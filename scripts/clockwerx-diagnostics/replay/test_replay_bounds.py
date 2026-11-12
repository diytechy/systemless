import unittest
from supervise import wall_bound

class ReplayBoundsTests(unittest.TestCase):
    def test_default_and_explicit_full_state_bounds(self):
        for mode in ('candidate','witness','fresh-proof'):
            self.assertEqual(wall_bound(dict(mode=mode,wallBoundSeconds=360)),360)
        for mode in ('witness','fresh-proof'):
            self.assertEqual(wall_bound(dict(mode=mode,wallBoundSeconds=600)),600)

    def test_candidates_and_unbounded_or_untyped_values_reject(self):
        for mode,bound in [('candidate',600),('search',600),('witness',0),
                           ('witness',601),('fresh-proof',True),('witness',600.0),
                           ('witness','600'),('fresh-proof',None)]:
            with self.assertRaises(ValueError):
                wall_bound(dict(mode=mode,wallBoundSeconds=bound))

if __name__=='__main__':unittest.main()
