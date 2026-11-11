"""Fit original actor artwork from source-only anchors, without importing the port."""

import argparse
import hashlib
import json
import time
from pathlib import Path

import numpy as np
from PIL import Image


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def pin(path):
    return dict(path=str(path.resolve()), bytes=path.stat().st_size,
                sha256=hashlib.sha256(path.read_bytes()).hexdigest())


def save(path, value):
    with path.open("x", encoding="utf-8") as f:
        json.dump(value, f, indent=2, allow_nan=False)
        f.write("\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("decoded", type=Path)
    parser.add_argument("native", type=Path)
    parser.add_argument("source", type=Path, help="Owned all-source.json and source artwork directory")
    parser.add_argument("output", type=Path)
    parser.add_argument("--max-seconds", type=int, default=180)
    parser.add_argument("--prior-captures-viewed", action="store_true",
                        help="Disclose earlier pixel exposure when checking a new fitter on old evidence")
    parser.add_argument("--prior-scene-viewed", action="store_true",
                        help="Disclose an earlier view of this board in another original run")
    a = parser.parse_args()
    if not 1 <= a.max_seconds <= 180 or a.output.exists():
        parser.error("Expected a fresh output and a 1–180 second fit limit")
    level, freeze, report = (read(x) for x in
                             (a.decoded, a.native / "capture-freeze.json", a.native / "captures/report.json"))
    closure = read(a.native / "closure.json")
    if closure["exitCode"] != 0 or closure["timedOut"] or not freeze["allPlannedCaptured"] or \
            report["budget_exhausted_frames"] != 0 or not 1 <= len(report["checkpoints"]) <= 64:
        parser.error("Original capture must be closed with its planned screenshots and no exhausted frames")
    if level["header"]["displaySizeRaw"] != 8:
        parser.error("This fitter uses the source large-board origin")
    cells = {(c["column"], c["row"]): c for c in level["cells"] if c["present"]}
    groups = {0: "700", 1: "500", 2: "4400", 3: "4500", 4: "3500"}
    blocks = {b["kind"]: b["records"] for b in level["blocks"]}
    actors = [x for x in blocks.get("WA", []) if x["activationMaskRaw"] & 1 and x["actorTypeRaw"] != 6]
    if any(x["actorTypeRaw"] not in groups for x in actors):
        parser.error("This fitter has no qualified source artwork mapping for that actor type")
    origin = lambda k: (74 + k[0] * 48, 72 + k[1] * 48)
    rails = {}
    for r in blocks.get("EX", []):
        row, col, orientation = r["rawWords"]
        if orientation not in (0, 256):
            parser.error("Unknown connector orientation")
        u, v = (col, row), (col, row + 1) if orientation else (col + 1, row)
        rails.setdefault(u, set()).add(v)
        rails.setdefault(v, set()).add(u)

    def positions(start):
        reachable, queue = {start}, [start]
        for u in queue:
            for v in rails.get(u, ()):
                if v not in reachable:
                    reachable.add(v)
                    queue.append(v)
        result = set()
        for k in reachable:
            x, y = origin(k)
            result.add((x, y))
            program = cells[k].get("inlineProgram")
            if program:
                for op in program["text"]:
                    dx, dy = {"n": (0, -3), "s": (0, 3), "w": (-3, 0), "e": (3, 0),
                              "p": (0, 0), "l": (0, 0), "r": (0, 0)}[op]
                    for _ in range(16):
                        x, y = x + dx, y + dy
                        result.add((x, y))
                if (x, y) != origin(k):
                    parser.error("Original-only anchor enumeration requires closed mover programs")
            else:
                for v in rails.get(k, ()):
                    dx, dy = v[0] - k[0], v[1] - k[1]
                    result.update((x + 3 * i * dx, y + 3 * i * dy) for i in range(1, 17))
        return result

    all_positions = set().union(*(positions(k) for k in cells))
    anchors, counts = {}, {}
    for actor in actors:
        group = groups[actor["actorTypeRaw"]]
        counts[group] = counts.get(group, 0) + 1
        k = (actor["gridPosition"]["column"], actor["gridPosition"]["row"])
        possible = all_positions if actor["actorTypeRaw"] == 0 or actor["programReferenceRaw"] >= 0 else positions(k)
        anchors.setdefault(group, set()).update(possible)
    anchors = {g: sorted(v, key=lambda p: (p[1], p[0])) for g, v in anchors.items()}
    if not all(1 <= len(v) <= 1300 for v in anchors.values()):
        parser.error("Source anchor inventory exceeds the bounded fitter")
    descriptors = read(a.source / "all-source.json")
    filenames = sorted({descriptors[g]["images"][d[4]] for g in anchors
                        for d in descriptors[g]["descriptors"]})
    method = dict(status="FROZEN_AFTER_PRIOR_CAPTURE_VIEW" if a.prior_captures_viewed else
                  "FROZEN_BEFORE_DEDICATED_PIXEL_READ", priorDedicatedCapturesViewed=a.prior_captures_viewed,
                  priorSceneViewedInOtherRun=a.prior_scene_viewed,
                  code=pin(Path(__file__)),
                  original=pin(a.native / "capture-freeze.json"), report=pin(a.native / "captures/report.json"),
                  level=pin(a.decoded), source=pin(a.source / "all-source.json"),
                  images={name: pin(a.source / "source" / name) for name in filenames},
                  anchorGroups=anchors, groups=counts, origin=[74, 72], actorAnchorBias=[-44, -43],
                  clip=[28, 28, 612, 452], gamma=.7, modelInputs=0)
    a.output.mkdir()
    save(a.output / "root-original-method.json", method)
    templates, images = {}, {}
    for group, points in anchors.items():
        rows, points = [], np.asarray(points)
        for frame in range(64):
            d = descriptors[group]["descriptors"][frame]
            filename = descriptors[group]["images"][d[4]]
            if filename not in images:
                path = a.source / "source" / filename
                if pin(path) != method["images"][filename]:
                    raise ValueError("Source image changed after method freeze")
                images[filename] = Image.open(path).convert("RGBA")
            im = images[filename].transpose(Image.Transpose.FLIP_TOP_BOTTOM) if d[2] & 256 else images[filename]
            rgba = np.asarray(im)
            if rgba.shape[:2] != (d[13], d[14]):
                raise ValueError("Source descriptor dimensions differ")
            yy, xx = np.nonzero(rgba[:, :, 3])
            color = np.round((rgba[yy, xx, :3].astype(np.float32) / 255) ** np.float32(.7) * 255)
            y, x = points[:, 1, None] + yy + d[9] - 43, points[:, 0, None] + xx + d[10] - 44
            mask = (x >= 28) & (x < 612) & (y >= 28) & (y < 452)
            rows.append((np.clip(y, 0, 479), np.clip(x, 0, 639), mask, color))
        templates[group] = rows
    banks = {g: np.full((len(report["checkpoints"]), 64, len(points)), np.nan, np.float32)
             for g, points in anchors.items()}
    captures = {Path(x["path"]).stem: x for x in freeze["allActualPNGs"]}
    observations, start = [], time.monotonic()
    try:
        for i, cp in enumerate(report["checkpoints"]):
            if time.monotonic() - start > a.max_seconds:
                raise TimeoutError("Original-only fitter time limit")
            path = Path(captures[cp["name"]]["path"])
            if pin(path)["sha256"] != captures[cp["name"]]["sha256"]:
                raise ValueError("Original capture changed")
            im = Image.open(path).convert("RGB")
            if im.size != (800, 600):
                raise ValueError("Expected original 800×600 captures")
            rgb, selected = np.asarray(im.crop((80, 60, 720, 540)), np.float32), {}
            for g, rows in templates.items():
                for f, (y, x, mask, color) in enumerate(rows):
                    delta, n = np.abs(rgb[y, x] - color).sum(axis=2), mask.sum(axis=1)
                    banks[g][i, f] = np.divide((delta * mask).sum(axis=1), 3 * n,
                                              out=np.full(len(n), np.inf, np.float32), where=n != 0)
                scores, chosen = banks[g][i].copy(), []
                for _ in range(counts[g]):
                    frame, position = np.unravel_index(scores.argmin(), scores.shape)
                    mean = float(scores[frame, position])
                    scores[:, position] = np.inf
                    if not np.isfinite(mean):
                        break
                    x, y = anchors[g][position]
                    chosen.append(dict(frame=int(frame), x=x, y=y, mean=mean, clear=mean < 2))
                selected[g] = chosen
            observations.append(dict(name=cp["name"], frontend=cp["frontend_ticks"],
                                     guest=cp["guest_tick"], selected=selected))
    finally:
        with (a.output / "raw-scores.npz").open("xb") as f:
            np.savez_compressed(f, **banks)
        save(a.output / "fits.json", dict(status="CLOSED_ORIGINAL_ONLY" if len(observations) == len(report["checkpoints"]) else
             "FAILED_PARTIAL_ORIGINAL_ONLY", method=pin(a.output / "root-original-method.json"),
             scores=pin(a.output / "raw-scores.npz"), anchorGroups=anchors, observations=observations,
             seconds=time.monotonic() - start))
    print(f"{len(all_positions)} source anchors; {len(observations)} captures; {time.monotonic() - start:.2f}s")


if __name__ == "__main__":
    main()
