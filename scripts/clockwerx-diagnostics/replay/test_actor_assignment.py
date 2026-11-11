import itertools
import random
import unittest

from actor_assignment import assign_poses


class ActorAssignmentTests(unittest.TestCase):
    def test_matches_exhaustive_scores_and_tie_order(self):
        rng = random.Random(69)
        for n in range(1, 7):
            for k in range(n + 1):
                for _ in range(12):
                    actors = [tuple(rng.randrange(3) for _ in range(3)) for _ in range(n)]
                    detections = [tuple(rng.randrange(3) for _ in range(3)) for _ in range(k)]

                    def score(indices):
                        pairs = list(zip(detections, (actors[j] for j in indices)))
                        return (sum(d[:2] != h[:2] for d, h in pairs),
                                sum(d != h for d, h in pairs), indices)

                    expected = min(itertools.permutations(range(n), k), key=score)
                    self.assertEqual(assign_poses(detections, actors), list(expected))

    def test_full_source_capacity_and_rectangular_assignment(self):
        actors = [(i, i + 1, i % 64) for i in range(31)]
        self.assertEqual(assign_poses(actors[::-1], actors), list(range(30, -1, -1)))
        self.assertEqual(assign_poses(actors[::3], actors), list(range(0, 31, 3)))
        self.assertEqual(assign_poses([], []), [])
        with self.assertRaises(ValueError):
            assign_poses(actors, actors[:3])


if __name__ == "__main__":
    unittest.main()
