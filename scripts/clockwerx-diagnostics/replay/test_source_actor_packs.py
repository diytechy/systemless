import unittest
from source_actor_packs import angular_exclusion, free_buster_packs


def fixture():
    def actor(half, direction=1):
        return dict(actorTypeRaw=5, activationMaskRaw=1, programReferenceRaw=-1,
                    initialFrameHalfIndexRaw=half, gridPosition=dict(row=1, column=2),
                    rawWords=[1, 2, 5, half, direction, 65535, 1, 1])
    return dict(structuralStatus="complete", header=dict(version=12),
                cells=[dict(present=True, flagsRaw=1)],
                blocks=[dict(kind="WA", records=[actor(0), actor(3), actor(6)])])


class SourcePackTests(unittest.TestCase):
    def test_source_only_count_and_circular_separation(self):
        pack = free_buster_packs(fixture())["2,1"]
        self.assertEqual((pack["maxActors"], pack["minimumFrameSeparation"]), (3, 6))
        self.assertEqual(pack["sourceRawRecords"], [0, 1, 2])
        mask = angular_exclusion(62, 6)
        self.assertTrue(mask[0])
        self.assertFalse(mask[4])
        self.assertFalse(mask[56])

    def test_unsupported_pack_motion_program_clocks_and_overlap_reject(self):
        for word, value in [(7, 3), (4, 65535), (3, 1)]:
            level = fixture()
            a = level["blocks"][0]["records"][1]
            a["rawWords"][word] = value
            if word == 3:
                a["initialFrameHalfIndexRaw"] = value
            with self.assertRaises(ValueError):
                free_buster_packs(level)
        level = fixture()
        level["blocks"].append(dict(kind="EX", records=[{}]))
        with self.assertRaises(ValueError):
            free_buster_packs(level)
        level = fixture()
        level["blocks"][0]["records"][1]["programReferenceRaw"] = 0
        with self.assertRaises(ValueError):
            free_buster_packs(level)


if __name__ == "__main__":
    unittest.main()
