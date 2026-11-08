import unittest
import xml.etree.ElementTree as ET
from PIL import Image
from vectorize_assets import contours, simplify, hand_svg, dot_svg


class VectorShapeTests(unittest.TestCase):
    def test_holes_and_diagonal_islands_survive_tracing(self):
        ring = [[True] * 5 for _ in range(5)]
        for y in range(1, 4):
            for x in range(1, 4): ring[y][x] = False
        loops = contours(ring)
        self.assertEqual(len(loops), 2)
        areas = [abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(loop,loop[1:]+loop[:1]))/2) for loop in loops]
        self.assertEqual(sorted(areas), [9, 25])
        self.assertEqual(len(contours([[True, False], [False, True]])), 2)

    def test_hand_tip_extent_and_transparent_hole_are_vector_paths(self):
        image = Image.new('RGBA', (38, 12), (240, 210, 0, 255))
        for y in range(3, 9):
            for x in range(8, 15): image.putpixel((x, y), (0, 0, 0, 0))
        root = ET.fromstring(hand_svg(image))
        path = root.find('{http://www.w3.org/2000/svg}path')
        self.assertEqual(path.attrib['fill-rule'], 'evenodd')
        self.assertEqual(path.attrib['d'].count('M'), 2)
        self.assertIn('38', path.attrib['d'])
        self.assertNotIn('<image', ET.tostring(root, encoding='unicode'))
        self.assertEqual(root.attrib['viewBox'], '-1 -1 40 14')

    def test_sphere_uses_geometry_not_embedded_pixels(self):
        root = ET.fromstring(dot_svg(Image.new('RGBA', (10, 10), 'red')))
        circle = root.find('{http://www.w3.org/2000/svg}circle')
        self.assertEqual((circle.attrib['cx'], circle.attrib['cy']), ('5', '5'))
        self.assertNotIn('base64', ET.tostring(root, encoding='unicode'))


if __name__ == '__main__': unittest.main()
