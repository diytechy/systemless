import copy
import unittest
from source_actor_busters import buster_union_inventory


def fixture():
    cells = [dict(row=i // 11, column=i % 11, present=True, flagsRaw=0x81 if i == 24 else 1) for i in range(88)]
    actor = dict(actorTypeRaw=5, activationMaskRaw=1, version12ByteRaw=0,
                 gridPosition=dict(row=2, column=2), programReferenceRaw=0,
                 initialFrameHalfIndexRaw=40, rawWords=[2, 2, 5, 40, 1, 0, 1, 1])
    return dict(structuralStatus="complete", header=dict(version=12, displaySizeRaw=8), cells=cells,
                blocks=[dict(kind="WA", count=1, records=[actor]),
                        dict(kind="WP", count=1, records=[dict(text="nsnn")])])


class ProposalAdmission(unittest.TestCase):
    def test_static_teleport_bounce_proposals_are_separate_and_never_clear(self):
        source = fixture()
        source["cells"][24]["flagsRaw"] = 1
        source["blocks"][1]["records"][0]["text"] = "nbnb"
        source["blocks"].append(dict(kind="HY", count=2, records=[dict(rawWords=[1,1,1,0,15]),dict(rawWords=[4,4,1,0,15])]))
        with self.assertRaises(ValueError):
            buster_union_inventory(source)
        result = buster_union_inventory(source, allow_static_teleport_busters=True)
        self.assertFalse(result["clearFitEligible"])
        self.assertFalse(result["temporalStateUsed"])
        for change in (lambda s: s["cells"][24].update(flagsRaw=0x81),
                       lambda s: s["blocks"][1]["records"][0].update(text="ns"),
                       lambda s: s["blocks"][0]["records"][0].update(version12ByteRaw=1),
                       lambda s: s["blocks"][0]["records"][0]["rawWords"].__setitem__(7,3)):
            altered = copy.deepcopy(source)
            change(altered)
            with self.assertRaises(ValueError):
                buster_union_inventory(altered, allow_static_teleport_busters=True)

    def test_source_union_is_explicitly_not_a_clear_or_temporal_fit(self):
        result = buster_union_inventory(fixture())
        self.assertFalse(result["temporalStateUsed"])
        self.assertFalse(result["clearFitEligible"])
        self.assertEqual(result["actors"][0]["rawHalfIndex"], 40)
        self.assertTrue(result["actors"][0]["initialPivotMoving"])

    def test_inactive_busters_are_not_allocated(self):
        source = fixture()
        inactive = copy.deepcopy(source["blocks"][0]["records"][0])
        inactive.update(activationMaskRaw=8, programReferenceRaw=99)
        source["blocks"][0]["records"].append(inactive)
        source["blocks"][0]["count"] = 2
        self.assertEqual(len(buster_union_inventory(source)["actors"]), 1)

    def test_future_clock_program_wall_and_layout_families_reject(self):
        for change in (lambda s: s["header"].update(version=11),
                       lambda s: s["blocks"][0]["records"][0].update(version12ByteRaw=1),
                       lambda s: s["blocks"][0]["records"][0].update(programReferenceRaw=99),
                       lambda s: s["blocks"][1]["records"][0].update(text="nb"),
                       lambda s: s["blocks"][0]["records"][0]["rawWords"].__setitem__(7, 3)):
            source = fixture()
            change(source)
            with self.assertRaises(ValueError):
                buster_union_inventory(source)


if __name__ == "__main__":
    unittest.main()
