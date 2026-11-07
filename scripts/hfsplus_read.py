"""Read selected files from an HFS+ image without mounting or writing it.

Supports raw HFS+ and the HFS wrapper used by the owner's disks. Only inline
extent records are accepted; fragmented forks needing an overflow tree fail
explicitly instead of returning partial data. The current source volume was
validated byte for byte against 7-Zip during this iteration.
"""
import struct
import machfs


def u16(data, offset):
    return struct.unpack_from('>H', data, offset)[0]


def u32(data, offset):
    return struct.unpack_from('>I', data, offset)[0]


class HfsPlusReader:
    def __init__(self, image):
        self.image = image
        self.base = 0
        if image[1024:1026] == b'BD':
            if image[1148:1150] != b'H+':
                raise ValueError('Classic HFS image does not contain HFS+')
            self.base = u16(image, 1052)*512 + u16(image, 1150)*u32(image, 1044)
        header = image[self.base+1024:self.base+1536]
        if header[:2] not in (b'H+', b'HX'):
            raise ValueError('Expected an HFS+ volume header')
        self.block_size = u32(header, 40)
        if self.block_size < 512 or self.block_size & (self.block_size-1):
            raise ValueError('Invalid HFS+ allocation block size')
        catalog = self.read_fork(header[272:352])
        node_size = u16(catalog, 32)
        if node_size < 512 or node_size > len(catalog):
            raise ValueError('Invalid catalogue node size')
        node_id = u32(catalog, 24)
        self.records = {}
        seen = set()
        while node_id:
            if node_id in seen:
                raise ValueError('Catalogue leaf loop')
            seen.add(node_id)
            node = catalog[node_id*node_size:(node_id+1)*node_size]
            if len(node) != node_size or node[8] != 255:
                raise ValueError('Invalid catalogue leaf')
            count = u16(node, 10)
            if (count+1)*2 > node_size-14:
                raise ValueError('Invalid catalogue record count')
            for i in range(count):
                start = u16(node, node_size-2*(i+1))
                end = u16(node, node_size-2*(i+2))
                if not 14 <= start < end <= node_size-2*(count+1):
                    raise ValueError('Invalid catalogue record bounds')
                row = node[start:end]
                key_len = u16(row, 0)
                name_len = u16(row, 6)
                if key_len != 6+name_len*2:
                    raise ValueError('Invalid catalogue key')
                name = row[8:8+name_len*2].decode('utf-16-be')
                record = row[key_len+2:]
                kind = u16(record, 0)
                if kind in (1, 2):
                    self.records[u32(record, 8)] = (u32(row, 2), name, kind, record)
            node_id = u32(node, 0)

    def read_fork(self, fork):
        size = struct.unpack_from('>Q', fork)[0]
        parts = []
        supplied = 0
        for i in range(8):
            block, count = struct.unpack_from('>II', fork, 16+8*i)
            if not count:
                continue
            start = self.base+block*self.block_size
            end = start+count*self.block_size
            if end > len(self.image):
                raise ValueError('Extent extends past image')
            parts.append(self.image[start:end])
            supplied += end-start
        if supplied < size:
            raise ValueError('HFS+ overflow extents are not supported by this extractor')
        return b''.join(parts)[:size]

    def path(self, cnid):
        names, seen = [], set()
        while cnid != 2:
            if cnid in seen:
                raise ValueError('Catalogue parent loop')
            seen.add(cnid)
            parent, name, _, _ = self.records[cnid]
            names.append(name)
            cnid = parent
        return '/'.join(reversed(names))

    def files(self, folder):
        prefix = folder.rstrip('/')+'/'
        for cnid, (_, _, kind, record) in self.records.items():
            if kind != 2:
                continue
            path = self.path(cnid)
            if not path.startswith(prefix):
                continue
            file = machfs.File()
            file.crdate, file.mddate, file.bkdate = (u32(record,i) for i in (12,16,28))
            file.type, file.creator = record[48:52], record[52:56]
            file.flags = u16(record,56)
            file.y, file.x = struct.unpack_from('>hh',record,58)
            file.data = self.read_fork(record[88:168])
            file.rsrc = self.read_fork(record[168:248])
            yield path[len(prefix):], file
