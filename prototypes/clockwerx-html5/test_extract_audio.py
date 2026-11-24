import json
import math
import struct
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import extract_audio as ea


def make_snd_format2(pcm, *, rate=22254.0, loop_start=0, loop_end=0, base_note=60, cmd=0x8050):
    header = struct.pack(">HHHHHI", 2, 0, 1, cmd, 0, 14)
    sound_header = struct.pack(
        ">5IBB", 0, len(pcm), round(rate * 65536), loop_start, loop_end, 0, base_note
    )
    return header + sound_header + pcm


def make_simple_midi(note=60, velocity=100, program=1, duration_ticks=240, tpqn=480):
    # Track 0: tempo 120 BPM (500000 us/quarter) + Program Change + Note On + Note Off + End of Track
    track = bytearray()
    track += b"\x00\xFF\x51\x03" + (500000).to_bytes(3, "big")
    track += bytes([0x00, 0xC0, program])
    track += bytes([0x00, 0x90, note, velocity])
    # VLQ for duration_ticks (assume < 16384)
    if duration_ticks >= 128:
        track += bytes([0x80 | (duration_ticks >> 7), duration_ticks & 0x7F])
    else:
        track += bytes([duration_ticks])
    track += bytes([0x80, note, 0])
    track += b"\x00\xFF\x2F\x00"
    mthd = struct.pack(">4sI3H", b"MThd", 6, 1, 1, tpqn)
    mtrk = struct.pack(">4sI", b"MTrk", len(track)) + bytes(track)
    return mthd + mtrk


class ExtractAudioTests(unittest.TestCase):
    def test_igor_lz77_and_undelta_roundtrip(self):
        # Construct an LZ77 stream: 4 literal bytes "ABCD" followed by back-ref distance 4, length 4 ("ABCD")
        # flags = 0b00001111 (bits 0..3 literal, bit 4 ref)
        # length=4 -> (4-3)=1 -> high nibble 1; dist=4 -> 4096-4 = 4092 = 0xFFC -> low nibble F, second byte FC
        payload = struct.pack(">I", 8) + bytes([0x0F, 65, 66, 67, 68, 0x1F, 0xFC])
        self.assertEqual(ea.igor_lz77_decompress(payload), b"ABCDABCD")

        deltas = bytes([10, 5, 250, 1])  # 10, 15, 9, 10 (mod 256)
        self.assertEqual(ea.undelta(deltas), bytes([10, 15, 9, 10]))

    def test_parse_inst_and_splits(self):
        # Default=100, root=0, flags1=0x20 (disable_loop), flags2=0x40 (fixed_pitch), 2 splits
        data = struct.pack(">HHBBBBHHH", 100, 0, 0, 0x20, 0x40, 0, 0, 0, 2)
        data += struct.pack(">BBHHH", 36, 36, 12736, 0, 0)
        data += struct.pack(">BBHHH", 38, 40, 12738, 0, 0)
        inst = ea.parse_inst(data)
        self.assertEqual(inst.default_snd, 100)
        self.assertTrue(inst.disable_loop)
        self.assertTrue(inst.fixed_pitch)
        self.assertEqual(inst.sample_id(36), 12736)
        self.assertEqual(inst.sample_id(39), 12738)
        self.assertEqual(inst.sample_id(60), 100)

    def test_parse_snd_accepts_both_sound_cmd_and_buffer_cmd(self):
        wave_pcm = bytes(int(128 + 60 * math.sin(2 * math.pi * i / 32)) for i in range(64))
        for cmd in (0x8050, 0x8051):
            sample = ea.parse_snd(make_snd_format2(wave_pcm, cmd=cmd, loop_start=8, loop_end=56, base_note=64))
            self.assertEqual(sample.pcm, wave_pcm)
            self.assertEqual(sample.loop_start, 8)
            self.assertEqual(sample.loop_end, 56)
            self.assertEqual(sample.base_note, 64)

    def test_render_midi_song_produces_audible_stereo_pcm(self):
        wave_pcm = bytes(int(128 + 90 * math.sin(2 * math.pi * i / 50)) for i in range(200))
        sample = ea.Sample(wave_pcm, 22050.0, 20, 170, 60)
        inst = ea.Instrument(default_snd=100, root_key_override=0, disable_loop=False, fixed_pitch=False, splits=())
        midi = make_simple_midi(note=60, velocity=110, program=1, duration_ticks=240)
        pcm = ea.render_midi_song(midi, {1: inst}, {100: sample}, rate=11025, release_ticks=3)
        self.assertGreater(len(pcm), 0)
        self.assertEqual(len(pcm) % 4, 0)
        samples = struct.unpack("<{}h".format(len(pcm) // 2), pcm)
        self.assertGreater(max(abs(s) for s in samples), 10000)

    def test_update_manifest_updates_sounds_music_and_hashes_outside_repo(self):
        with tempfile.TemporaryDirectory() as tmp:
            assets = Path(tmp) / "assets"
            assets.mkdir()
            (assets / "backdrop.png").write_bytes(b"pngdata")
            (assets / "ActionSwing.wav").write_bytes(b"wavdata")
            (assets / "music-song-a.ogg").write_bytes(b"oggdata")
            (assets / "manifest.json").write_text(
                json.dumps({"logicalSize": [640, 480], "backdrop": "backdrop.png", "sounds": {}, "files": []}),
                encoding="utf-8",
            )
            updated = ea.update_manifest(
                assets,
                sounds={"ActionSwing": "ActionSwing.wav", "18": "ActionSwing.wav"},
                music={"tracks": {"song-a": "music-song-a.ogg"}, "titleTrack": "song-a", "victoryTrack": "song-a", "chapterTracks": ["song-a"]},
            )
            self.assertEqual(updated["sounds"]["18"], "ActionSwing.wav")
            self.assertEqual(updated["music"]["titleTrack"], "song-a")
            file_names = [row["name"] for row in updated["files"]]
            self.assertEqual(file_names, ["ActionSwing.wav", "backdrop.png", "music-song-a.ogg"])
            # Rejects paths inside the Git repository.
            with self.assertRaisesRegex(ValueError, "outside the Git repository"):
                ea.private_assets_dir(Path(__file__).resolve().parent)


if __name__ == "__main__":
    unittest.main()
