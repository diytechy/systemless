"""Translate a checked ClockWerx literal into a bounded Systemless play script."""

import argparse
import hashlib
import json
from pathlib import Path


KEYS = {"R": (49, 32), "S": (55, 0), "F": (59, 0), "B": (58, 0)}


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def build(entry, literal, entry_actions, prefix, max_ticks, final_margin, promotion):
    if entry["version"] != 1 or entry["clock"] != "frontend_ticks":
        raise ValueError("Expected a frontend-tick Systemless entry script")
    actions = entry["actions"][:entry_actions]
    if len(actions) != entry_actions or not entry_actions:
        raise ValueError("Entry action count is outside the entry script")
    captures = []
    tick = 0
    for action in actions:
        tick += action.get("ticks", 0)
        if action["type"] == "screenshot":
            captures.append(dict(name=action["name"], frontend=tick))
    origin = tick

    def frame(step):
        if step < prefix or (step - prefix) % 2:
            raise ValueError(f"Model update {step} cannot map to a frontend tick")
        return origin + (step - prefix) // 2

    def run(to):
        nonlocal tick
        if to < tick:
            raise ValueError(f"Overlapping or unsorted inputs at frontend tick {to}")
        if to > tick:
            actions.append(dict(type="run", ticks=to - tick))
            tick = to

    def capture(name):
        actions.append(dict(type="screenshot", name=name))
        captures.append(dict(name=name, frontend=tick))

    def key(down, kind):
        number, character = KEYS[kind]
        actions.append(dict(type="key_down" if down else "key_up", key=number, ch=character))

    holds = literal["holds"]
    if not holds or holds[-1]["end"] > literal["updates"]:
        raise ValueError("Literal needs holds within its update limit")
    literal_end = frame(literal["updates"])
    ends_held = holds[-1]["end"] == literal["updates"]
    for i, hold in enumerate(holds, 1):
        kind = hold["k"]
        start, end, nominal = (frame(hold[k]) for k in ("start", "end", "nominal"))
        if kind not in KEYS or not start <= nominal < end:
            raise ValueError(f"Invalid hold {i}")
        run(start)
        key(True, kind)
        run(nominal + 1)
        capture(f"input-{i:02d}-{kind}-nominal")
        run(end + (final_margin if i == len(holds) and ends_held else 0))
        key(False, kind)

    if not ends_held:
        # Preserve every trailing idle tick. Extending the last button here
        # would change the checked literal before it reaches its goal.
        run(literal_end + final_margin)
    capture("goal-after-hold")
    run(tick + 120)
    capture("results")

    def advance(name):
        key(True, "R")
        run(tick + 2)
        key(False, "R")
        run(tick + 520)
        capture(name)

    advance("after-results")
    if promotion:
        advance("after-promotion")
    if tick > max_ticks or len(captures) > 64 or len({c["name"] for c in captures}) != len(captures):
        raise ValueError("Rehearsal exceeds tick or capture bounds, or repeats a capture name")

    scenario = dict(version=1, clock="frontend_ticks", max_ticks=max_ticks,
                    application_partition_size=entry["application_partition_size"],
                    export_save_files=True, actions=actions)
    return scenario, captures, origin, tick


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("entry", type=Path)
    p.add_argument("literal", type=Path)
    p.add_argument("output", type=Path)
    p.add_argument("--entry-actions", required=True, type=int)
    p.add_argument("--prefix", required=True, type=int)
    p.add_argument("--max-ticks", type=int, default=6800)
    p.add_argument("--final-margin", type=int, default=20)
    p.add_argument("--advance-promotion", action="store_true",
                   help="Add one advance for an independently expected rank overlay")
    a = p.parse_args()
    if a.prefix < 0 or a.entry_actions < 1 or a.final_margin < 0 or not 1 <= a.max_ticks <= 10000:
        p.error("Expected nonnegative prefix/margin, positive entry actions and a 1–10000 tick cap")
    literal = read(a.literal)
    scenario, captures, origin, ticks = build(read(a.entry), literal, a.entry_actions, a.prefix,
                                             a.max_ticks, a.final_margin, a.advance_promotion)
    a.output.mkdir()
    sidecar = dict(literal=str(a.literal.resolve()),
                   literalSHA256=hashlib.sha256(a.literal.read_bytes()).hexdigest(),
                   prefix=a.prefix, frontendOrigin=origin, nativeOnlyFinalHoldTicks=a.final_margin,
                   holds=literal["holds"], plannedTicks=ticks)
    if literal["holds"][-1]["end"] < literal["updates"]:
        sidecar["nativeOnlyFinalHoldTicks"] = 0
        sidecar["nativeOnlyFinalIdleTicks"] = a.final_margin
    for name, value in (("native-goal.json", scenario), ("capture-plan.json", dict(captures=captures)),
                        ("input-sidecar.json", sidecar), ("view-gate-draft.json", dict(executionApproved=False))):
        with (a.output / name).open("x", encoding="utf-8") as f:
            json.dump(value, f, indent=2)
    print(f"{ticks} frontend ticks; {len(captures)} captures")


if __name__ == "__main__":
    main()
