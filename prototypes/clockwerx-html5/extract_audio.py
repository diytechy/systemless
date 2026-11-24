"""Render audio from the owned ClockWerx HFS image into a private assets directory."""
import argparse
from array import array
from collections import defaultdict
from dataclasses import dataclass
import hashlib
import io
import json
import math
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import warnings
import wave

from extract_assets import resources

try:
    import numpy as np
except ImportError:
    np = None


IMAGE_SHA256 = "03f7f09e3c4a4c820a373873bc103de0ec0777f36c5aa5e778afa61b33c959f4"
SONG_IDS = tuple(range(10, 121, 10))
SAMPLE_RATE = 22050
SOUND_INDEX_TO_RSRC = {
    0: 1000, 1: 8397, 2: 29526, 3: 30378, 4: 32405,
    6: 16932, 7: 10346, 8: 1000, 9: 29523, 10: 19371, 11: 16850,
    12: 1013, 13: 1015, 14: 3232, 15: 31074, 16: 1000, 17: 1022,
    18: 15958, 19: 20796, 20: 18398, 21: 9581, 22: 20832, 23: 8875,
    24: 2134, 25: 1027, 26: 27737, 28: 1499, 29: 27310, 30: 32405,
    31: 1032, 32: 1032, 33: 1032, 34: 1032, 35: 31178, 36: 1000,
    37: 31074, 38: 31074, 39: 2584, 40: 1005, 41: 1005, 42: 3172,
    43: 9931, 44: 16352, 45: 16352, 46: 8939,
}
LEGACY_EFFECTS = {1022: "ActionFlip", 15958: "ActionSwing", 20796: "ActionBounce"}
SOUND_ALIASES = {29526: "Close", 9931: "Fanfare", 1005: "Whack"}


def igor_lz77_decompress(data):
    size, = struct.unpack_from(">I", data)
    output = bytearray()
    cursor = 4
    while len(output) < size:
        flags = data[cursor:cursor + 1]
        if not flags:
            raise ValueError("Truncated Igor LZ77 flags")
        cursor += 1
        for bit in range(8):
            if len(output) == size:
                break
            if flags[0] & (1 << bit):
                if cursor == len(data):
                    raise ValueError("Truncated Igor LZ77 literal")
                output.append(data[cursor])
                cursor += 1
            else:
                if cursor + 2 > len(data):
                    raise ValueError("Truncated Igor LZ77 reference")
                first, second = data[cursor:cursor + 2]
                cursor += 2
                length = (first >> 4) + 3
                distance = 4096 - (((first & 15) << 8) | second)
                if distance > len(output) or length > size - len(output):
                    raise ValueError("Invalid Igor LZ77 reference")
                for _ in range(length):
                    output.append(output[-distance])
    return bytes(output)


def undelta(data):
    result = bytearray()
    accumulator = 0
    for value in data:
        accumulator = (accumulator + value) & 255
        result.append(accumulator)
    return bytes(result)


@dataclass
class Sample:
    pcm: bytes
    rate: float
    loop_start: int
    loop_end: int
    base_note: int
    width: int = 1


@dataclass
class Instrument:
    default_snd: int
    root_key_override: int
    disable_loop: bool
    fixed_pitch: bool
    splits: tuple

    def sample_id(self, note):
        return next((sound for low, high, sound in self.splits if low <= note <= high),
                    self.default_snd)


def parse_inst(data):
    default, root, _, flags1, flags2, _, _, _, count = struct.unpack_from(">HHBBBBHHH", data)
    splits = []
    for i in range(count):
        low, high, sound, _, _ = struct.unpack_from(">BBHHH", data, 14 + 8 * i)
        splits.append((low, high, sound))
    return Instrument(default, root, bool(flags1 & 0x20), bool(flags2 & 0x40), tuple(splits))


def run_ffmpeg(executable, data, arguments):
    result = subprocess.run(
        [str(executable), "-hide_banner", "-loglevel", "error", *arguments],
        input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False,
    )
    if result.returncode:
        raise ValueError("ffmpeg failed: " + result.stderr.decode(errors="replace").strip())
    return result.stdout


def aiff_chunk(tag, contents):
    return tag + struct.pack(">I", len(contents)) + contents + (b"\0" if len(contents) % 2 else b"")


def decode_mace3(payload, packets, rate, ffmpeg):
    if not ffmpeg:
        raise ValueError("KilledByDoor uses MACE 3:1. Install ffmpeg or pass --ffmpeg <path>.")
    fraction, exponent = math.frexp(rate)
    extended = struct.pack(">HQ", exponent + 16382, int(fraction * (1 << 64)))
    # Each two-byte MAC3 packet decodes to six mono samples.
    common = struct.pack(">HIH", 1, packets * 6, 8) + extended + b"MAC3\x08MACE 3:1\0"
    aifc = (b"AIFC" + aiff_chunk(b"FVER", struct.pack(">I", 0xA2805140))
            + aiff_chunk(b"COMM", common) + aiff_chunk(b"SSND", bytes(8) + payload))
    pcm = run_ffmpeg(ffmpeg, aiff_chunk(b"FORM", aifc),
                     ["-f", "aiff", "-i", "pipe:0", "-f", "s16le", "pipe:1"])
    if len(pcm) != packets * 6 * 2:
        raise ValueError("Unexpected decoded MACE 3:1 length")
    return pcm


def parse_snd(data, ffmpeg=None):
    format_id, extra = struct.unpack_from(">HH", data)
    if format_id not in (1, 2):
        raise ValueError("Unknown snd resource format {}".format(format_id))
    commands = 4 + 6 * extra if format_id == 1 else 4
    count, = struct.unpack_from(">H", data, commands)
    for index in range(count):
        cmd, _, header = struct.unpack_from(">HHI", data, commands + 2 + index * 8)
        if cmd & 0x7FFF in (0x50, 0x51):
            break
    else:
        raise ValueError("snd resource has no sound/buffer command")
    _, length, fixed_rate, start, end, encoding, base = struct.unpack_from(">5IBB", data, header)
    rate = fixed_rate / 65536
    if not rate:
        raise ValueError("Invalid snd sample rate")
    if encoding == 0:
        pcm = data[header + 22:header + 22 + length]
        if len(pcm) != length or not pcm:
            raise ValueError("Invalid PCM length")
        return Sample(pcm, rate, start, end, base)
    if encoding == 0xFE and struct.unpack_from(">h", data, header + 56)[0] == 3:
        packets, = struct.unpack_from(">I", data, header + 22)
        payload = data[header + 64:header + 64 + packets * 2]
        if length != 1 or not packets or len(payload) != packets * 2:
            raise ValueError("Invalid mono MACE 3:1 sound header")
        return Sample(decode_mace3(payload, packets, rate, ffmpeg), rate, start, end, base, 2)
    raise ValueError("Unsupported snd encoding 0x{:02x}".format(encoding))


def midi_vlq(data, pos):
    number = 0
    for _ in range(4):
        value = data[pos]
        pos += 1
        number = number * 128 + (value & 127)
        if value < 128:
            return number, pos
    raise ValueError("Invalid MIDI variable-length quantity")


def midi_track_events(track):
    tick = pos = running = 0
    while pos < len(track):
        delta, pos = midi_vlq(track, pos)
        tick += delta
        status = track[pos]
        if status >= 128:
            pos += 1
            running = status if status < 0xF0 else 0
        elif running:
            status = running
        else:
            raise ValueError("MIDI event missing running status")
        if status == 0xFF:
            kind = track[pos]
            size, pos = midi_vlq(track, pos + 1)
            if pos + size > len(track):
                raise ValueError("Truncated MIDI meta event")
            if kind == 0x51 and size == 3:
                yield tick, status, int.from_bytes(track[pos:pos + size], "big"), 0
            if kind == 0x2F:
                yield tick, status, 0, 0
                return
            pos += size
        elif status in (0xF0, 0xF7):
            size, pos = midi_vlq(track, pos)
            if pos + size > len(track):
                raise ValueError("Truncated MIDI SysEx event")
            pos += size
        elif status < 0xF0:
            first = track[pos]
            pos += 1
            second = 0
            if status & 0xF0 not in (0xC0, 0xD0):
                second = track[pos]
                pos += 1
            yield tick, status, first, second
        else:
            raise ValueError("Unsupported MIDI status 0x{:02x}".format(status))


def midi_timeline(midi, rate):
    tag, size, format_id, tracks, division = struct.unpack_from(">4sI3H", midi)
    if tag != b"MThd" or size < 6 or format_id not in (0, 1) or not 0 < division < 32768:
        raise ValueError("Expected a Type-0 or Type-1 MIDI with ticks per quarter note")
    cursor = 8 + size
    events = []
    for _ in range(tracks):
        tag, length = struct.unpack_from(">4sI", midi, cursor)
        cursor += 8
        if tag != b"MTrk" or cursor + length > len(midi):
            raise ValueError("Invalid MIDI track chunk")
        events.extend(midi_track_events(midi[cursor:cursor + length]))
        cursor += length

    by_channel = defaultdict(list)
    elapsed = previous_tick = frame = 0
    tempo = 500000
    for tick, status, first, second in sorted(events, key=lambda event: event[0]):
        elapsed += (tick - previous_tick) * tempo
        previous_tick = tick
        frame = (elapsed * rate + division * 500000) // (division * 1000000)
        if status == 0xFF:
            if first:
                tempo = first
        else:
            by_channel[status & 15].append((frame, status & 0xF0, first, second))
    return by_channel, frame


@dataclass
class Voice:
    sample: Sample
    pcm: object
    loop: bool
    pitch: float
    fixed_pitch: bool
    velocity: float
    note: int
    start: int
    position: float = 0
    released: int = None
    held: bool = True


def mix_voice(mix, voice, begin, end, rate, bend, volume, pan, attack, release):
    sample = voice.sample
    step = voice.pitch / rate if voice.fixed_pitch else voice.pitch / rate * 2 ** (bend / 12)
    frames = len(sample.pcm)
    tail = (frames - voice.position) / step
    if not voice.loop:
        end = min(end, begin + math.ceil(tail))
    if voice.released is not None:
        end = min(end, voice.released + release)
    count = end - begin
    if count <= 0:
        return False

    # Keep pan within a modest stereo spread for the original mono samples.
    angle = math.pi * (0.15 + 0.70 * pan / 127) / 2
    left = voice.velocity * volume * math.cos(angle)
    right = voice.velocity * volume * math.sin(angle)
    loop_length = sample.loop_end - sample.loop_start
    attack_age = begin - voice.start
    release_age = None if voice.released is None else begin - voice.released

    if np is not None:
        index = np.arange(count)
        position = voice.position + index * step
        if voice.loop:
            wrap = position >= sample.loop_end
            position[wrap] = sample.loop_start + (position[wrap] - sample.loop_start) % loop_length
        first = position.astype(np.intp)
        second = np.minimum(first + 1, frames - 1)
        if voice.loop:
            second[second == sample.loop_end] = sample.loop_start
        pcm = voice.pcm[first] + (voice.pcm[second] - voice.pcm[first]) * (position - first)
        pcm *= np.minimum(1, (index + attack_age) / attack)
        if release_age is not None:
            pcm *= 1 - (index + release_age) / release
        if not voice.loop:
            pcm *= np.minimum(1, (tail - index) / attack)
        mix[begin:end, 0] += pcm * left
        mix[begin:end, 1] += pcm * right
    else:
        pcm = voice.pcm
        for i in range(count):
            position = voice.position + i * step
            if voice.loop and position >= sample.loop_end:
                position = sample.loop_start + (position - sample.loop_start) % loop_length
            first = int(position)
            second = min(first + 1, frames - 1)
            if voice.loop and second == sample.loop_end:
                second = sample.loop_start
            value = pcm[first] + (pcm[second] - pcm[first]) * (position - first)
            value *= min(1, (i + attack_age) / attack)
            if release_age is not None:
                value *= 1 - (i + release_age) / release
            if not voice.loop:
                value *= min(1, (tail - i) / attack)
            output = 2 * (begin + i)
            mix[output] += value * left
            mix[output + 1] += value * right
    voice.position += count * step
    if voice.loop and voice.position >= sample.loop_end:
        voice.position = sample.loop_start + (voice.position - sample.loop_start) % loop_length
    return ((voice.loop or voice.position < frames)
            and (voice.released is None or end < voice.released + release))


def mix_channel(mix, events, instruments, samples, pcm, rate, attack, release, last, percussion, remaps):
    voices = []
    program = percussion if percussion is not None and percussion >= 0 else 0
    bend, volume, pan, sustain = 0, 100 / 127, 64, False
    cursor = 0
    missing = set()
    for frame, kind, first, second in events + [(last, -1, 0, 0)]:
        if frame > cursor:
            voices = [voice for voice in voices
                      if mix_voice(mix, voice, cursor, frame, rate, bend, volume, pan, attack, release)]
            cursor = frame
        if kind == 0xC0:
            program = first
        elif kind == 0x90 and second:
            instrument_id = remaps.get(program, program)
            instrument = instruments.get(instrument_id)
            if instrument is None:
                missing.add("INST {}".format(instrument_id))
                continue
            sample_id = instrument.sample_id(first)
            sample = samples.get(sample_id)
            if sample is None:
                missing.add("snd/csnd {}".format(sample_id))
                continue
            loop = not instrument.disable_loop and 0 <= sample.loop_start < sample.loop_end - 16 < sample.loop_end <= len(sample.pcm)
            root = instrument.root_key_override
            if not 0 < root <= 127:
                root = sample.base_note if 0 < sample.base_note <= 127 else 60
            pitch = sample.rate if instrument.fixed_pitch else sample.rate * 2 ** ((first - root) / 12)
            voices.append(Voice(sample, pcm[sample_id], loop, pitch, instrument.fixed_pitch,
                                (second / 127) ** 1.5, first, frame))
        elif kind in (0x80, 0x90):
            voice = next((v for v in voices if v.note == first and v.held), None)
            if voice:
                voice.held = False
                if not sustain:
                    voice.released = frame
        elif kind == 0xE0:
            bend = ((first | (second << 7)) - 8192) / 4096  # Standard +/- 2 semitones.
        elif kind == 0xB0:
            if first == 7:
                volume = second / 127
            elif first == 10:
                pan = second
            elif first == 64:
                sustain = second >= 64
                if not sustain:
                    for voice in voices:
                        if not voice.held and voice.released is None:
                            voice.released = frame
            elif first in (120, 123):
                for voice in voices:
                    if voice.released is None:
                        voice.held = False
                        voice.released = frame
        elif kind == -2:  # End of song releases any voices still held.
            for voice in voices:
                if voice.released is None:
                    voice.released = frame
    return missing


def render_midi_song(midi, instruments, samples, *, rate=SAMPLE_RATE,
                     release_ticks=1, percussion=None, remaps=None):
    """Return interleaved stereo signed 16-bit PCM, little endian."""
    timeline, end = midi_timeline(midi, rate)
    attack = max(1, round(rate * 0.015))
    release = max(attack, round(rate * release_ticks / 60))
    last = end + release
    if np is None:
        mix = array("f", [0]) * (2 * last)
        pcm = {key: array("f", ((byte - 128) / 128 for byte in sample.pcm))
               for key, sample in samples.items()}
    else:
        mix = np.zeros((last, 2), dtype=np.float32)
        pcm = {key: (np.frombuffer(sample.pcm, dtype=np.uint8).astype(np.float32) - 128) / 128
               for key, sample in samples.items()}

    missing = set()
    for channel, events in timeline.items():
        missing.update(mix_channel(mix, events + [(end, -2, 0, 0)], instruments, samples, pcm,
                                   rate, attack, release, last, percussion if channel == 9 else None,
                                   remaps or {}))
    if missing:
        warnings.warn("Missing MIDI patches: " + ", ".join(sorted(missing)))

    target = 32767 * 10 ** (-1 / 20)
    if np is not None:
        peak = max(float(mix.max()), -float(mix.min()))
        if peak:
            mix *= target / peak
        return np.rint(mix).astype("<i2").tobytes()
    peak = max(max(mix), -min(mix))
    scale = target / peak if peak else 0
    output = array("h", (round(sample * scale) for sample in mix))
    if sys.byteorder != "little":
        output.byteswap()
    return output.tobytes()


def wave_bytes(pcm, rate, width, channels):
    output = io.BytesIO()
    with wave.open(output, "wb") as writer:
        writer.setparams((channels, width, rate, 0, "NONE", "not compressed"))
        writer.writeframes(pcm)
    return output.getvalue()


def extract_effects(fork, output, ffmpeg):
    effects = {rid: (name, data) for kind, rid, name, data in resources(fork) if kind == b"snd "}
    if len(effects) != 34 or not set(SOUND_INDEX_TO_RSRC.values()) <= effects.keys():
        raise ValueError("Expected all 34 ClockWerx Sounds resources")
    filenames, sounds = {}, {}
    for rid, (name, data) in sorted(effects.items()):
        safe_name = re.sub(r"[^A-Za-z0-9_.-]+", "_", name).strip("._-") or "sound"
        legacy = LEGACY_EFFECTS.get(rid)
        filename = legacy + ".wav" if legacy else "sfx-{}-{}.wav".format(rid, safe_name)
        sound = parse_snd(data, ffmpeg)
        (output / filename).write_bytes(wave_bytes(sound.pcm, round(sound.rate), sound.width, 1))
        filenames[rid] = filename
        sounds["rsrc-{}".format(rid)] = filename
        if name:
            sounds[name] = filename
        if legacy:
            sounds[legacy] = filename
        if rid in SOUND_ALIASES:
            sounds[SOUND_ALIASES[rid]] = filename
    sounds.update({str(index): filenames[rid] for index, rid in SOUND_INDEX_TO_RSRC.items()})
    return sounds


def parse_song(data):
    # Headspace/Igor SONG header (TMPL 129: offset 0=cmid, 13=global release in 1/60s, 16=remap count).
    midi_id, = struct.unpack_from(">H", data)
    release, _, _, count = struct.unpack_from(">BBBH", data, 13)
    remaps = dict(struct.unpack_from(">2H", data, 18 + i * 4) for i in range(count))
    return midi_id, max(1, release), 126, remaps


def extract_music(fork, output, ffmpeg):
    bank = {(kind, rid): data for kind, rid, _, data in resources(fork)}
    samples = {}
    instruments = {}
    for (kind, rid), data in bank.items():
        if kind == b"INST":
            instruments[rid] = parse_inst(data)
        elif kind in (b"snd ", b"csnd"):
            if kind == b"csnd":
                data = undelta(igor_lz77_decompress(data))
            samples[rid] = parse_snd(data)
    tracks = {}
    for index, rid in enumerate(SONG_IDS):
        key = "song-" + chr(ord("a") + index)
        midi_id, release, percussion, remaps = parse_song(bank[b"SONG", rid])
        midi = igor_lz77_decompress(bank[b"cmid", midi_id])
        pcm = render_midi_song(midi, instruments, samples, release_ticks=release,
                               percussion=percussion, remaps=remaps)
        if not any(pcm):
            raise ValueError("No audible MIDI output for " + key)
        wav = wave_bytes(pcm, SAMPLE_RATE, 2, 2)
        filename, payload = "music-" + key + ".wav", wav
        if ffmpeg:
            payload = run_ffmpeg(ffmpeg, wav,
                                 ["-f", "wav", "-i", "pipe:0", "-c:a", "libvorbis",
                                  "-q:a", "5", "-f", "ogg", "pipe:1"])
            filename = "music-" + key + ".ogg"
        (output / filename).write_bytes(payload)
        tracks[key] = filename
        print("Rendered {}".format(key), flush=True)
    return dict(tracks=tracks, titleTrack="song-a", victoryTrack="song-g",
                chapterTracks=[name for name in tracks if name not in ("song-a", "song-g")])


def private_assets_dir(path):
    path = Path(path).resolve()
    repo = Path(__file__).resolve().parents[2]
    if path == repo or repo in path.parents:
        raise ValueError("Use a private assets directory outside the Git repository.")
    return path


def update_manifest(assets_dir, sounds=None, music=None):
    assets_dir = private_assets_dir(assets_dir)
    path = assets_dir / "manifest.json"
    manifest = json.loads(path.read_text(encoding="utf-8"))
    if sounds is not None:
        manifest.setdefault("sounds", {}).update(sounds)
    if music is not None:
        manifest["music"] = music
    manifest["files"] = [
        dict(name=file.name, bytes=file.stat().st_size, sha256=hashlib.sha256(file.read_bytes()).hexdigest())
        for file in sorted(assets_dir.iterdir()) if file.is_file() and file != path
    ]
    with tempfile.TemporaryDirectory(dir=assets_dir) as temp:
        staged = Path(temp) / path.name
        staged.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        os.replace(staged, path)
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path)
    parser.add_argument("--update-manifest", required=True, type=Path, metavar="ASSETS_DIR")
    parser.add_argument("--ffmpeg", help="Override the ffmpeg executable")
    parser.add_argument("--allow-any-hash", action="store_true")
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--songs-only", action="store_true")
    modes.add_argument("--sfx-only", action="store_true")
    args = parser.parse_args()

    try:
        assets = private_assets_dir(args.update_manifest)
        manifest = json.loads((assets / "manifest.json").read_text(encoding="utf-8"))
        raw = args.image.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        if digest != IMAGE_SHA256 and not args.allow_any_hash:
            raise ValueError("Unexpected ClockWerx image SHA-256: " + digest)
        if digest != IMAGE_SHA256:
            print("Warning: accepting alternate image SHA-256 " + digest, file=sys.stderr)
        if manifest.get("fixtureSha256", digest) != digest:
            raise ValueError("The existing assets manifest refers to a different disk image.")
        ffmpeg = shutil.which(args.ffmpeg) if args.ffmpeg else shutil.which("ffmpeg")
        if args.ffmpeg and not ffmpeg:
            raise ValueError("ffmpeg executable not found: " + args.ffmpeg)
        if not ffmpeg and Path("C:/ffmpeg/bin/ffmpeg.exe").is_file():
            ffmpeg = "C:/ffmpeg/bin/ffmpeg.exe"

        import machfs

        volume = machfs.Volume()
        volume.read(raw)
        folder = volume["ClockWerx Folder"]
        with tempfile.TemporaryDirectory(dir=assets) as temp:
            output = Path(temp)
            sounds = None if args.songs_only else extract_effects(folder["ClockWerx Sounds"].rsrc, output, ffmpeg)
            music = None if args.sfx_only else extract_music(folder["ClockWerx Music"].rsrc, output, ffmpeg)
            for audio in output.iterdir():
                os.replace(audio, assets / audio.name)
            update_manifest(assets, sounds, music)
    except (OSError, ValueError, ImportError, KeyError, IndexError, struct.error) as error:
        parser.exit(1, "Audio extraction failed: {}\n".format(error))


if __name__ == "__main__":
    main()
