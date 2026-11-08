"""Synthetic stream tests; no owned level bytes are fixtures."""
import struct
import unittest

from decode_clockwerx_levels import decode


ORDER = ('HY', 'SP', 'WL', 'DR', 'DS', 'PU', 'BO', 'GO', 'WY',
         'WP', 'WA', 'TX', 'EX', 'EL', 'GN', 'TR')
# Independent, literal serialized lengths from the stream-reader audit.
SIZES = {
    5: (6, 8, 12, 8, 8, 6, 6, 6, 8, None, 16, 107, 6, 8, 10, 8),
    6: (6, 8, 12, 8, 8, 6, 8, 6, 8, None, 16, 107, 6, 8, 10, 8),
    11: (10, 12, 12, 8, 8, 10, 8, 10, 12, None, 20, 107, 6, 12, 14, 12),
    12: (10, 12, 12, 8, 8, 10, 8, 10, 12, None, 22, 107, 6, 12, 14, 12),
}


def fixture(version=12, filled=True, cells=None):
    data = bytearray(struct.pack('>4H', 0x5253, version, 123, 7))
    for index in range(88):
        flags, secondary, program = (cells or {}).get(index, (0, 15, None))
        data += struct.pack('>H', flags)
        if version > 8: data += struct.pack('>H', secondary)
        if program is not None:
            data += bytes([len(program)]) + program
            if len(data) % 2: data += b'\x9b'
    for kind, size in zip(ORDER, SIZES[version]):
        if kind == 'WA' and len(data) % 2: data += b'\xab'
        data += struct.pack('>H', int(filled))
        if not filled: continue
        if kind == 'WP': data += b'\x02ab'
        elif kind == 'TX':
            data += b'\x04Test' + bytes(28)
            data += struct.pack('>5h', 12, 3, 0, -20, 44)
            data += b'\x05Hello' + bytes(58)
        else: data += bytes(size)
    return bytes(data)


class LevelDecoderTests(unittest.TestCase):
    def test_all_supported_version_boundaries(self):
        for version in SIZES:
            with self.subTest(version=version):
                data = fixture(version)
                result = decode(data)
                self.assertEqual(result['structuralStatus'], 'complete')
                self.assertEqual(result['decodedThroughOffset'], len(data))
                self.assertEqual([b['kind'] for b in result['blocks']], list(ORDER))
                self.assertEqual(result['preActorPaddingHex'], 'ab')
                self.assertEqual(result['header']['serializedColumns'], 11)
                self.assertEqual(result['header']['displayColumns'], 10)

    def test_every_truncation_reports_partial(self):
        data = fixture()
        for end in range(len(data)):
            result = decode(data[:end])
            self.assertEqual(result['structuralStatus'], 'partial', end)
            self.assertTrue(result['unsupported'], end)
            self.assertLessEqual(result['decodedThroughOffset'], end)

    def test_inline_programs_and_independent_flag_bits(self):
        data = fixture(cells={0:(0xc087,0xf123,b'ab'), 1:(0x81,15,b'c')})
        result = decode(data)
        self.assertEqual(result['structuralStatus'], 'complete')
        first = result['cells'][0]
        self.assertTrue(first['bonus'])
        self.assertTrue(first['goal'])
        self.assertEqual(first['inlineProgram']['text'], 'ab')
        self.assertEqual(first['inlineProgram']['paddingHex'], '9b')
        self.assertEqual(first['otherFlagsRaw'], 0x8080)
        self.assertEqual(first['attributeBitsRaw'], 0xf120)
        self.assertEqual(result['cells'][1]['inlineProgram']['paddingHex'], '')

    def test_absent_dot_does_not_consume_program(self):
        result = decode(fixture(cells={0:(0x80,15,None)}))
        self.assertEqual(result['structuralStatus'], 'complete')
        self.assertNotIn('inlineProgram', result['cells'][0])

    def test_text_fixed_pascal_and_signed_positions(self):
        block = next(b for b in decode(fixture())['blocks'] if b['kind'] == 'TX')
        text = block['records'][0]
        self.assertEqual(text['fontName'], 'Test')
        self.assertEqual(text['text'], 'Hello')
        self.assertEqual(text['positionWords'], [-20,44])
        self.assertEqual(text['byteLength'], 107)

    def test_invalid_fixed_pascal_is_not_silent(self):
        data = bytearray(fixture())
        text = next(b for b in decode(data)['blocks'] if b['kind'] == 'TX')
        data[text['records'][0]['offset']] = 33
        result = decode(bytes(data))
        self.assertEqual(result['structuralStatus'], 'partial')
        self.assertEqual(result['unsupported'][0]['context'], 'TX record 0')

    def test_unknown_version_and_tail_are_preserved(self):
        data = bytearray(fixture())
        data[3] = 13
        result = decode(bytes(data))
        self.assertEqual(result['structuralStatus'], 'partial')
        self.assertEqual(bytes.fromhex(result['unsupported'][0]['rawHex']), data[8:])
        result = decode(fixture()+b'\xaa')
        self.assertEqual(result['unsupported'][0]['rawHex'], 'aa')

    def test_empty_sections(self):
        result = decode(fixture(filled=False))
        self.assertEqual(result['structuralStatus'], 'complete')
        self.assertTrue(all(b['count'] == 0 for b in result['blocks']))


if __name__ == '__main__':
    unittest.main()
