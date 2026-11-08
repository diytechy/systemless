"""Decode copied ClockWerx RND2 streams; private content must stay outside Git.

Structural layouts follow CODE7 ROPrepare and CODE6 *Stream2Spec routines.
Decoding a record is not qualification of its runtime behavior. Fields without
verified semantics remain raw, including every original byte.
"""
import argparse
import hashlib
import json
import struct
from collections import Counter
from pathlib import Path


SUPPORTED_VERSIONS = (5, 6, 11, 12)
BLOCK_ORDER = ('HY', 'SP', 'WL', 'DR', 'DS', 'PU', 'BO', 'GO', 'WY',
               'WP', 'WA', 'TX', 'EX', 'EL', 'GN', 'TR')
STREAM_ROUTINES = dict(HY=0x7508, SP=0x998a, WL=0xaee4, DR=0x1996,
                       DS=0x9f2c, PU=0x83c8, BO=0x934, GO=0x700e,
                       WY=0xf468, WP=0xf190, WA=0xdee4, TX=0x11a,
                       EX=0x5a2e, EL=0x508e, GN=0x6804, TR=0xa53c)


class DecodeError(ValueError):
    pass


class Reader:
    def __init__(self, data):
        self.data = data
        self.pos = 0

    def take(self, size):
        if size < 0 or self.pos + size > len(self.data):
            raise DecodeError(f'truncated at offset {self.pos}: need {size} bytes')
        value = self.data[self.pos:self.pos + size]
        self.pos += size
        return value

    def u16(self):
        return struct.unpack('>H', self.take(2))[0]

    def align(self):
        return self.take(self.pos % 2).hex()

    def pascal(self, aligned=False):
        start = self.pos
        length = self.take(1)[0]
        value = self.take(length).decode('mac_roman')
        padding = self.align() if aligned else ''
        return dict(offset=start, text=value, paddingHex=padding,
                    rawHex=self.data[start:self.pos].hex())


def record_size(kind, version):
    """Serialized lengths, not in-memory struct sizes (notably TX and WL)."""
    if kind == 'TX': return 107
    if kind == 'WA': return 16 + (4 if version > 7 else 0) + (2 if version >= 12 else 0)
    if kind == 'BO': return 6 + (2 if version >= 6 else 0)
    if kind in ('DR', 'DS'): return 8
    if kind == 'WL': return 12
    if kind == 'EX': return 6
    base = dict(HY=6, SP=8, PU=6, GO=6, WY=8, EL=8, GN=10, TR=8)
    threshold = dict(HY=9, SP=7, PU=7, GO=7, WY=9, EL=6, GN=7, TR=10)
    return base[kind] + (4 if version > threshold[kind] else 0)


def fixed_pascal(data):
    if not data or data[0] >= len(data):
        raise DecodeError('invalid fixed Pascal string length')
    return data[1:1 + data[0]].decode('mac_roman')


def decode_record(reader, kind, version):
    start = reader.pos
    if kind == 'WP':
        return dict(kind=kind, **reader.pascal())
    data = reader.take(record_size(kind, version))
    record = dict(kind=kind, offset=start, byteLength=len(data), rawHex=data.hex(),
                  semantics='partial: raw parameters retained; runtime behavior unqualified')
    if kind == 'TX':
        record.update(fontName=fixed_pascal(data[:33]),
                      styleWords=list(struct.unpack('>3H', data[33:39])),
                      fontSize=struct.unpack_from('>H', data, 33)[0],
                      fontFaceRaw=struct.unpack_from('>H', data, 35)[0],
                      renderingStyleByteRaw=data[38],
                      positionWords=list(struct.unpack('>2h', data[39:43])),
                      text=fixed_pascal(data[43:107]))
        if record['text'].startswith('@') and len(record['text']) >= 2:
            record['conditionalPrefixRaw'] = record['text'][:2]
            record['displayTextAfterPrefix'] = record['text'][2:]
        # Draw call passes word at spec+8 first, spec+10 second. Keep raw words
        # until the drawing wrapper's coordinate convention is qualified.
    else:
        record['rawWords'] = list(struct.unpack('>' + 'H' * (len(data)//2), data))
        if kind != 'WL':
            row, col = struct.unpack_from('>2h', data)
            record['gridPosition'] = dict(row=row, column=col)
        if kind == 'WA':
            record['actorTypeRaw'] = struct.unpack_from('>h', data, 4)[0]
            record['programReferenceRaw'] = struct.unpack_from('>h', data, 10)[0]
            record['initialFrameHalfIndexRaw'] = struct.unpack_from('>h', data, 6)[0]
            record['activationMaskRaw'] = struct.unpack_from('>I', data, 16)[0] if version > 7 else 15
            record['version12ByteRaw'] = data[20] if version >= 12 else 1
    return record


def decode(data):
    reader = Reader(data)
    out = dict(schema='clockwerx-rnd2-decoded-v1', sha256=hashlib.sha256(data).hexdigest(),
               byteLength=len(data), structuralStatus='partial', gameplayQualified=False,
               cells=[], blocks=[], unsupported=[])
    boundary = 0
    context = 'header'
    try:
        signature, version, time_raw, size_raw = (reader.u16() for _ in range(4))
        out['header'] = dict(signature=signature, version=version, timeLimitRaw=time_raw,
                             displaySizeRaw=size_raw, serializedRows=8, serializedColumns=11,
                             displayRows=8 if size_raw == 8 else 7,
                             displayColumns=11 if size_raw == 8 else 10)
        boundary = reader.pos
        if signature != 0x5253:
            raise DecodeError('unsupported signature; legacy streams are not guessed')
        if version not in SUPPORTED_VERSIONS:
            raise DecodeError(f'unsupported version {version}')
        for index in range(88):
            context = f'grid cell {index}'
            start = reader.pos
            flags = reader.u16()
            secondary = reader.u16() if version > 8 else None
            cell = dict(index=index, row=index//11, column=index%11, offset=start,
                        flagsRaw=flags, secondaryRaw=secondary, present=bool(flags & 1),
                        bonus=bool(flags & 2), goal=bool(flags & 4),
                        initialStateBit14=bool(flags & 0x4000),
                        otherFlagsRaw=flags & ~0x4007)
            if secondary is not None:
                cell.update(activationMaskRaw=secondary & 15, attributeBitsRaw=secondary & 0xfff0)
            # DOCreateAll only consumes an inline program when the dot exists.
            if flags & 1 and flags & 0x80:
                cell['inlineProgram'] = reader.pascal(aligned=True)
            cell['byteLength'] = reader.pos-start
            cell['rawHex'] = data[start:reader.pos].hex()
            out['cells'].append(cell)
            boundary = reader.pos
        for kind in BLOCK_ORDER:
            context = f'{kind} count'
            if kind == 'WA':
                out['preActorPaddingHex'] = reader.align()
            start = reader.pos
            count = reader.u16()
            block = dict(kind=kind, offset=start, count=count, records=[],
                         sourceRoutine=f'CODE6:{STREAM_ROUTINES[kind]:04x}')
            out['blocks'].append(block)
            boundary = reader.pos
            for index in range(count):
                context = f'{kind} record {index}'
                record = decode_record(reader, kind, version)
                if kind == 'DR':
                    record['paddingHex'] = reader.align()
                block['records'].append(record)
                boundary = reader.pos
            block['endOffset'] = reader.pos
        if reader.pos != len(data):
            context = 'trailing data'
            raise DecodeError(f'{len(data)-reader.pos} trailing bytes')
        out['structuralStatus'] = 'complete'
    except DecodeError as error:
        out['unsupported'].append(dict(context=context, offset=boundary, reason=str(error),
                                       rawHex=data[boundary:].hex()))
    out['decodedThroughOffset'] = boundary
    out['mechanicInventory'] = dict(
        presentDots=sum(c['present'] for c in out['cells']),
        bonusFlags=sum(c['bonus'] for c in out['cells']),
        goalFlags=sum(c['goal'] for c in out['cells']),
        inlinePrograms=sum('inlineProgram' in c for c in out['cells']),
        recordCounts={b['kind']: b['count'] for b in out['blocks']},
        boundary='Record classes are source-verified; behavior and visual fidelity are unqualified.')
    return out


def decode_directory(directory, output):
    """Never overwrite previous private evidence."""
    directory = directory.resolve(strict=True)
    if output.exists():
        raise ValueError('Use a new output directory; existing evidence is preserved')
    metadata = json.loads((directory/'resources.json').read_text(encoding='utf-8'))
    output.mkdir(parents=True)
    rows = []
    for resource in metadata:
        if resource['type'] != 'RND2': continue
        name = resource['file']
        if Path(name).name != name or '/' in name or '\\' in name:
            raise ValueError('Invalid resource filename')
        data = (directory/name).read_bytes()
        if len(data) != resource['size']:
            raise ValueError('Resource size differs from inventory')
        item = decode(data)
        item.update(resourceId=resource['id'], resourceTitle=resource['name'], sourceFile=name)
        (output/(Path(name).stem+'.json')).write_text(json.dumps(item, indent=2)+'\n', encoding='utf-8')
        rows.append(dict(resourceId=resource['id'], sha256=item['sha256'],
                         version=item.get('header', {}).get('version'),
                         structuralStatus=item['structuralStatus'],
                         unsupported=item['unsupported'], mechanicInventory=item['mechanicInventory']))
    summary = dict(schema='clockwerx-rnd2-decode-summary-v1', resourceCount=len(rows),
                   statusCounts=dict(Counter(r['structuralStatus'] for r in rows)),
                   versionCounts=dict(Counter(r['version'] for r in rows)), resources=rows)
    (output/'summary.json').write_text(json.dumps(summary, indent=2)+'\n', encoding='utf-8')
    return summary


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = decode_directory(args.directory, args.output)
    print(json.dumps({k: result[k] for k in ('resourceCount', 'statusCounts', 'versionCounts')}))
