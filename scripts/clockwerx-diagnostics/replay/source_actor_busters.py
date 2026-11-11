"""Source-only proposal admission for moving/programmed class1 busters.

This supplies artwork/anchor hypotheses, never a temporal actor assignment.
Dense or overlapping proposals are deliberately excluded from clear-fit counts.
"""


def buster_union_inventory(level, *, allow_static_teleport_busters=False, allow_static_slowdown_busters=False):
    if type(allow_static_teleport_busters) is not bool or type(allow_static_slowdown_busters) is not bool or \
            allow_static_teleport_busters and allow_static_slowdown_busters:
        raise ValueError("Literal static teleport proposal capability required")
    if level.get("structuralStatus") != "complete" or level.get("header", {}).get("version") != 12 or \
            level["header"].get("displaySizeRaw") != 8 or len(level.get("cells", [])) != 88:
        raise ValueError("Complete large version12 source required")
    blocks = {b["kind"]: b["records"] for b in level["blocks"]}
    if len(blocks) != len(level["blocks"]) or any(b["count"] != len(b["records"]) for b in level["blocks"]):
        raise ValueError("Unique complete source sections required")
    excluded = ("HY", "EL", "GN", "TR", "PU", "DR", "DS", "WY") if allow_static_slowdown_busters else \
        ("EX", "EL", "GN", "TR", "PU", "GO", "DR", "DS") if allow_static_teleport_busters else ("HY", "GN", "TR", "PU", "GO", "DR", "DS")
    if any(blocks.get(k) for k in excluded):
        raise ValueError("Separate moving-buster proposal family required")
    if allow_static_teleport_busters and (not 2 <= len(blocks.get("HY", [])) <= 18 or
            any(c["present"] and (c["flagsRaw"] & 0x380 or c.get("inlineProgram")) for c in level["cells"])):
        raise ValueError("Static paired teleport proposal board required")
    if allow_static_slowdown_busters:
        present = [c for c in level["cells"] if c["present"]]
        if any(c["flagsRaw"] & 0x380 or c.get("inlineProgram") for c in present) or \
                not any(c["flagsRaw"] & 32 for c in present) or not any(c["flagsRaw"] & 8 for c in present) or \
                any(not blocks.get(k) for k in ("EX", "WL", "SP", "BO", "GO")) or \
                any(r.get("rawWords", [0, 0, -1])[2] not in (0, 169) for r in blocks["GO"]):
            raise ValueError("Static Slow/ring/EX/BO/GO/WL/SP proposal board required")
    cells = {(c["row"], c["column"]): c for c in level["cells"] if c["present"]}
    programs = blocks.get("WP", [])
    actors = []
    for index, actor in enumerate(blocks.get("WA", [])):
        if not actor["activationMaskRaw"] & 1 or actor["actorTypeRaw"] != 5:
            continue
        words, position = actor["rawWords"], actor["gridPosition"]
        cell = cells.get((position["row"], position["column"]))
        ref = actor["programReferenceRaw"]
        program = None if ref == -1 else programs[ref].get("text") if 0 <= ref < len(programs) else ""
        if cell is None or len(words) < 8 or words[7] != 1 or actor["version12ByteRaw"] != 0 or \
                words[4] not in (1, 65535) or type(words[3]) is not int or not 0 <= words[3] < 64 or \
                actor["initialFrameHalfIndexRaw"] != words[3] or program is not None and (
                    not isinstance(program, str) or not program or set(program) - set("nb" if allow_static_teleport_busters else "ns") or
                    not 1 <= words[6] <= len(program)):
            raise ValueError("Explicit class1 wall-free n/s or free source buster required")
        actors.append(dict(sourceRawRecord=index, rawHalfIndex=words[3],
                           programReference=ref, programLength=len(program) if program else 0,
                           initialPivotMoving=bool(cell["flagsRaw"] & 0x80)))
    if not 1 <= len(actors) <= 29 or not any(a["initialPivotMoving"] or a["programReference"] >= 0 for a in actors):
        raise ValueError("Bounded moving or programmed source busters required")
    return dict(actors=actors, temporalStateUsed=False, clearFitEligible=False,
                minimumAngularSuppression=4, spatialSuppressionPixels=3,
                boundary="All-source anchor union; pixel proposals only, no identity/visibility census or clear pose claim")
