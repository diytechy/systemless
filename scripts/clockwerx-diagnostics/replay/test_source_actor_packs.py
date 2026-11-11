import unittest
from source_actor_packs import angular_exclusion, free_buster_packs


def fixture():
    def actor(half, direction=1):
        return dict(actorTypeRaw=5, activationMaskRaw=1, programReferenceRaw=-1,
                    initialFrameHalfIndexRaw=half, gridPosition=dict(row=1, column=2),
                    rawWords=[1, 2, 5, half, direction, 65535, 1, 1])
    return dict(structuralStatus="complete", header=dict(version=12),
                cells=[dict(present=True, flagsRaw=1, row=1, column=2)],
                blocks=[dict(kind="WA", records=[actor(0), actor(3), actor(6)])])


class SourcePackTests(unittest.TestCase):
    def test_joined_board_keeps_each_buster_pivot_fixed_and_outside_connectors(self):
        level = fixture()
        level['blocks'].append(dict(kind='EX', records=[dict(rawWords=[3, 4, 0])]))
        level['cells'].append(dict(present=True, flagsRaw=0x4083, row=4, column=5,
                                  inlineProgram=dict(text='ew')))
        with self.assertRaises(ValueError):
            free_buster_packs(level)
        self.assertEqual(free_buster_packs(level, allow_joined_board=True)['2,1']['maxActors'], 3)
        level['blocks'][-1]['records'][0]['rawWords'] = [1, 1, 0]
        with self.assertRaisesRegex(ValueError, 'non-connector'):
            free_buster_packs(level, allow_joined_board=True)
        level['blocks'].pop()
        level['cells'][0]['flagsRaw'] |= 0x80
        with self.assertRaisesRegex(ValueError, 'fixed non-connector'):
            free_buster_packs(level, allow_joined_board=True)

    def test_joined_board_rejects_unknown_geometry_and_el_hy(self):
        for kind, words in [('EX', [7, 10, 0]), ('EX', [1, 1, 1]), ('EL', []), ('HY', [])]:
            level = fixture()
            level['blocks'].append(dict(kind=kind, records=[dict(rawWords=words)]))
            with self.assertRaises(ValueError):
                free_buster_packs(level, allow_joined_board=True)
        with self.assertRaises(ValueError):
            free_buster_packs(fixture(), allow_joined_board=1)

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
