"""Compare saved original actor observations with a closed literal's source lineage."""

import argparse
import json
from pathlib import Path

from supervise import sha
from actor_assignment import assign_poses


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def lineage(path):
    previous = ""
    with path.open(encoding="utf-8") as f:
        for line in f:
            row = json.loads(line)
            if row[0] == "full":
                previous = row[1]
            elif row[0] == "delta":
                previous = previous[:row[1]] + row[3] + (previous[-row[2]:] if row[2] else "")
            else:
                raise ValueError("Unknown lineage encoding")
            yield json.loads(previous)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("fits", type=Path)
    p.add_argument("case", type=Path)
    p.add_argument("output", type=Path)
    p.add_argument("--prefix", required=True, type=int)
    p.add_argument("--frontend-origin", default=1264, type=int)
    a = p.parse_args()
    result = read(a.case / "result.json")
    if result.get("status") != "GOAL":
        p.error("Expected a closed actual goal")
    observations = {}
    for original in read(a.fits)["observations"]:
        step = a.prefix + 2 * (original["frontend"] - a.frontend_origin)
        if a.prefix <= step <= result["updates"]:
            if step in observations:
                p.error("Two original observations map to one model step")
            observations[step] = original
    counts, joins = {}, []
    stream = a.case / "observation/lineage.jsonl"
    for row in lineage(stream):
        step = row["step"]
        if step not in observations:
            continue
        original = observations[step]
        actors = [row["state"]["player"], *row["state"]["enemies"]]
        groups = {}
        for group, detections in original["selected"].items():
            clear = [d for d in detections if d["clear"]]
            available = [physical for actor, physical in zip(actors, row["physicalActors"])
                         if actor["group"] == int(group)]
            if len(clear) > len(available):
                raise ValueError("More original observations than actors in this group")
            indices = assign_poses([(d["x"], d["y"], d["frame"]) for d in clear],
                                   [(h["physical"]["x"], h["physical"]["y"], h["canonicalFrame"])
                                    for h in available])
            chosen = []
            for native, index in zip(clear, indices):
                actual = available[index]
                point = actual["physical"]
                pos = (native["x"], native["y"]) == (point["x"], point["y"])
                chosen.append(dict(original=native, actual=actual, samePosition=pos,
                                   samePose=pos and native["frame"] == actual["canonicalFrame"]))
            missed_pos = sum(not x["samePosition"] for x in chosen)
            missed_pose = sum(not x["samePose"] for x in chosen)
            counter = counts.setdefault(group, dict(clear=0, positions=0, poses=0))
            counter["clear"] += len(clear)
            counter["positions"] += len(clear) - missed_pos
            counter["poses"] += len(clear) - missed_pose
            groups[group] = dict(clearComparisons=chosen, observations=detections)
        joins.append(dict(name=original["name"], step=step, groups=groups))
    if len(joins) != len(observations):
        raise ValueError("Original capture could not join the model lineage")
    report = dict(status="BOUNDED_ORIGINAL_ROUTE_ANCHOR_COMPARISON", fixedPrefix=a.prefix,
                  joins=len(joins), counts=counts, rows=joins, fitSHA256=sha(a.fits),
                  lineageSHA256=sha(stream),
                  boundary="Fixed-phase captures. Minimum-mismatch assignment within each artwork group; "
                           "ambiguous observations retained. No original cadence or actor-identity inference.")
    with a.output.open("x", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        f.write("\n")
    print(json.dumps(dict(joins=len(joins), counts=counts)))


if __name__ == "__main__":
    main()
