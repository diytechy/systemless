import unittest
from reconstruct_assets import mirrored_path, geometry_bounds, svg, filename


class ReconstructionTests(unittest.TestCase):
    def test_cubic_reversal_reflects_controls_in_reverse_order(self):
        self.assertEqual(mirrored_path([['M',0,0],['C',1,-2,3,-4,5,0]]),
                         'M0 0 C1 -2 3 -4 5 0 C3 4 1 2 0 0 Z')

    def test_invalid_half_rejected(self):
        for half in [[['M',0,1],['L',2,0]], [['M',0,0],['L',2,-1]],
                     [['M',0,0],['Q',1,2,2,0]], [['M',0,0],['L',float('nan'),0]]]:
            with self.assertRaises(ValueError): mirrored_path(half)

    def test_holes_and_control_hull_checked(self):
        shapes = [{'outer':[['M',0,0],['Q',2,-2,4,0]],
                   'holes':[[['M',1,0],['Q',2,-1,3,0]]]}]
        self.assertEqual(geometry_bounds(shapes), [0,-2,4,2])
        colors=['#001122']*4
        self.assertIn('fill-rule="evenodd"',svg(shapes,colors,dict(x=0,y=-2,width=4,height=4)))
        with self.assertRaises(ValueError): svg(shapes,colors,dict(x=0,y=-1,width=4,height=2))

    def test_filename_traversal_rejected(self):
        for name in ['../a','a/b','a\\b','..']:
            with self.assertRaises(ValueError): filename(name)


if __name__ == '__main__': unittest.main()
