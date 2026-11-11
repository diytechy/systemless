"""Rank one fixed phase using saved original fits and an actual idle trajectory.

No emulator or port is imported or executed. This reports mismatches; a best
ranking is not an assertion of exact native timing or scene acceptance.
"""
import argparse
import collections
import hashlib
import json
import time
from pathlib import Path
from actor_assignment import assign_poses


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def pin(path):
    return dict(path=str(path.resolve()), bytes=path.stat().st_size,
                sha256=hashlib.sha256(path.read_bytes()).hexdigest())


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("fits", type=Path)
    p.add_argument("cold", type=Path, help="Actual idle run directory")
    p.add_argument("output", type=Path, help="New report, never overwritten")
    p.add_argument("--frontend-origin", type=int, default=1264)
    p.add_argument("--max-prefix", type=int, default=1600)
    a = p.parse_args()
    if a.output.exists() or not 0 <= a.max_prefix <= 4000:
        p.error("New output and prefix bound 0..4000 required")
    fits, result = read(a.fits), read(a.cold / "result.json")
    if fits["status"] != "CLOSED_ORIGINAL_ONLY" or result["status"] != "COLD_CAP_COMPLETE":
        p.error("Closed original-only fits and completed actual idle run required")
    stream = a.cold / "lineage.jsonl"
    pins = [pin(x) for x in (a.fits, a.cold / "result.json", stream)]
    with stream.open(encoding="utf-8") as f:
        rows = [json.loads(line) for line in f]
    if any(r["step"] != i or r["dying"] or r["complete"] for i, r in enumerate(rows)):
        p.error("Expected contiguous, nonterminal actual idle rows")
    obs = [r for r in fits["observations"] if r["frontend"] >= a.frontend_origin]
    if not obs or a.max_prefix + 2 * max(r["frontend"] - a.frontend_origin for r in obs) >= len(rows):
        p.error("Insufficient saved rows for every fixed-prefix comparison")
    # Precompute only saved declarations. Group assignments have no phase or
    # actor identity constraint beyond the original artwork group.
    actors = []
    for row in rows:
        groups = collections.defaultdict(list)
        for h in row["actors"]:
            groups[str(h["group"])].append((h["point"]["x"], h["point"]["y"], h["frame"]))
        actors.append(groups)
    observations = [(2 * (r["frontend"] - a.frontend_origin),
                     {g: [(d["x"], d["y"], d["frame"]) for d in ds if d["clear"]]
                      for g, ds in r["selected"].items()}) for r in obs]
    rank, started = [], time.monotonic()
    for prefix in range(a.max_prefix + 1):
        if time.monotonic() - started > 120:
            raise TimeoutError("Saved-data ranking exceeded 120 seconds")
        positions = poses = clear = 0
        for offset, groups in observations:
            for group, ds in groups.items():
                clear += len(ds)
                if not ds:
                    continue
                available = actors[prefix + offset][group]
                indices = assign_poses(ds, available)
                matched = [available[j] for j in indices]
                dp = sum(d[:2] != h[:2] for d, h in zip(ds, matched))
                df = sum(d != h for d, h in zip(ds, matched))
                positions += dp
                poses += df
        rank.append(([positions, poses, clear], prefix))
    rank.sort()
    if pins != [pin(Path(x["path"])) for x in pins]:
        raise ValueError("Saved evidence changed during ranking")
    report = dict(status="RANKED_SAVED_ACTUAL_COLD", top=rank[:30],
                  frontendOrigin=a.frontend_origin, searchedPrefixInclusive=[0, a.max_prefix],
                  originalCaptures=len(obs), constructors=0, updates=0, inputs=pins,
                  bestHasExactPositionsAndPoses=rank[0][0][:2] == [0, 0],
                  scope="One fixed prefix for all captures; no per-image/actor phase adjustment",
                  seconds=time.monotonic() - started)
    with a.output.open("x", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        f.write("\n")
    print(json.dumps({k: report[k] for k in ("status", "top", "seconds")}))


if __name__ == "__main__":
    main()
