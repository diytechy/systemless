"""Source-only angular exclusion for free class1 busters at fixed pivots."""


def free_buster_packs(level):
    if level.get("structuralStatus") != "complete" or level.get("header", {}).get("version") != 12:
        raise ValueError("Complete version12 source required for free buster packs")
    blocks = {b["kind"]: b["records"] for b in level["blocks"]}
    if any(blocks.get(k) for k in ("EX", "EL", "HY")) or any(
            c["present"] and c["flagsRaw"] & 0x380 for c in level["cells"]):
        raise ValueError("Free buster packs require fixed pivots without EX/EL/HY")
    packs = {}
    for index, a in enumerate(blocks.get("WA", [])):
        if not a["activationMaskRaw"] & 1 or a["actorTypeRaw"] != 5:
            continue
        w, position = a["rawWords"], a["gridPosition"]
        if len(w) < 8 or w[7] != 1 or a["programReferenceRaw"] != -1 or \
                w[4] not in (1, 65535) or not 0 <= w[3] < 32 or a["initialFrameHalfIndexRaw"] != w[3]:
            raise ValueError("Unprogrammed class1 buster source declarations required")
        key = str(position["column"]) + "," + str(position["row"])
        pack = packs.setdefault(key, dict(sourceRawRecords=[], initialFrames=[], directions=[]))
        pack["sourceRawRecords"].append(index)
        pack["initialFrames"].append(2 * w[3])
        pack["directions"].append(1 if w[4] == 1 else -1)
    if not packs:
        raise ValueError("No active source buster pack")
    for pack in packs.values():
        frames = sorted(pack["initialFrames"])
        if len(frames) != len(set(frames)) or len(set(pack["directions"])) != 1:
            raise ValueError("Distinct source angles and one rotation sign per fixed pack required")
        gaps = [b - a for a, b in zip(frames, frames[1:])] + [64 + frames[0] - frames[-1]]
        gap = min(gaps)
        if gap < 4:
            raise ValueError("Dense/overlapping source pack remains unqualified")
        pack.update(maxActors=len(frames), minimumFrameSeparation=gap, speedClass=1,
                    direction=pack.pop("directions")[0])
    return packs


def angular_exclusion(frame, separation):
    return [min((f - frame) % 64, (frame - f) % 64) < separation for f in range(64)]
