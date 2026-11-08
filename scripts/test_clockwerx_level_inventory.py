import struct
import unittest
from inventory_clockwerx_levels import parse_catalog


def entry(rid,name):
    b=name.encode('mac_roman');data=struct.pack('>hB',rid,len(b))+b
    return data+b'\0'*(len(data)%2)


class CatalogTests(unittest.TestCase):
    def test_order_names_signed_ids_and_alignment(self):
        data=struct.pack('>H',2)+entry(9,'ABC')+entry(-3,'Even')
        rows=parse_catalog(data)
        self.assertEqual([(r['ordinal'],r['resourceId'],r['menuTitle']) for r in rows],[(1,9,'ABC'),(2,-3,'Even')])

    def test_bad_count_truncation_duplicate_and_tail_fail(self):
        for data in [b'',b'\0\1',struct.pack('>H',1)+b'\0\1\x05a',
                     struct.pack('>H',2)+entry(1,'A')+entry(1,'B'),b'\0\0extra']:
            with self.assertRaises(ValueError):parse_catalog(data)

    def test_nonzero_padding_rejected(self):
        with self.assertRaisesRegex(ValueError,'alignment'):parse_catalog(b'\0\1'+entry(1,'AB')[:-1]+b'!')


if __name__=='__main__':unittest.main()
