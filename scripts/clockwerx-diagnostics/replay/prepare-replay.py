"""Pin one already-reviewed candidate, witness, or fresh proof without running it."""

import argparse
import json
from pathlib import Path

from supervise import sha


HERE = Path(__file__).resolve().parent
CODE = ("supervise.py", "run-replay.mjs", "core.mjs", "stream.mjs", "factory-source-round.mjs")


def pin(path):
    path = path.resolve(strict=True)
    return dict(path=str(path), sha256=sha(path), bytes=path.stat().st_size)


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("mode", choices=("candidate", "witness", "fresh-proof"))
    p.add_argument("freeze", type=Path, help="Directory with runtime, source-freeze.json and config.json")
    p.add_argument("literal", type=Path)
    p.add_argument("output", type=Path, help="New replay output directory")
    p.add_argument("authorization", type=Path, help="New authorization JSON")
    p.add_argument("--review", required=True, help="Short description of the operator's completed review")
    p.add_argument("--observer", choices=("legacy", "fast-delta", "fast-delta-v2"), default="legacy",
                   help="Explicit frozen recorder choice; fast-delta changes only lossless encoding")
    p.add_argument("--baseline", type=Path, help="Reviewed, closed candidate or witness directory")
    p.add_argument("--original-review", type=Path, help="Reviewed original goal evidence")
    a = p.parse_args()
    candidate = a.mode == "candidate"
    if (a.baseline is None) != candidate or (a.original_review is None) != candidate:
        p.error("Witness and fresh proof require a reviewed baseline and original goal; candidate takes neither")
    if a.output.exists():
        p.error("Replay output already exists")
    literal = read(a.literal)
    updates = literal.get("updates")
    if type(updates) is not int or not 1 <= updates <= 16000:
        p.error("Literal update count must be between 1 and 16000")
    if not (a.freeze / "runtime").is_dir():
        p.error("Frozen runtime directory is missing")
    auth = dict(
        schema="clockwerx-single-replay-authorization-v1", authority="Root", executionApproved=True,
        purpose=f"clockwerx-generic-{'candidate' if candidate else 'chosen'}-replay-v1",
        status=a.review, mode=a.mode, invocationID=a.output.name, outputPath=str(a.output.resolve()),
        sourcePath=str((a.freeze / "runtime").resolve()), sourceFreeze=pin(a.freeze / "source-freeze.json"),
        config=pin(a.freeze / "config.json"), literal=pin(a.literal),
        observer=pin(HERE.parent / ({"fast-delta": "observer-fast-delta.mjs",
                                  "fast-delta-v2": "observer-fast-delta-v2.mjs"}.get(a.observer, "observer.mjs"))),
        code=[pin(HERE / name) for name in CODE], maxConstructors=1, maxConstructorResets=1,
        maxExplicitResets=0, maxUpdates=updates, wallBoundSeconds=360, dt=1/120, noAutomaticRetry=True,
        gates=dict(candidateLiteralReviewed=True) if candidate else
        dict(closedGoalLiteralReviewed=True, baselineReviewed=True),
    )
    if not candidate:
        base = a.baseline
        run = read(base / "invocation-result.json")
        closure = read(base / "closure.json")
        witness = a.mode == "witness"
        expected = ("candidate", "CLOSED_CANDIDATE_GOAL") if witness else ("witness", "CLOSED_ACCEPTED")
        case = pin(base / "case" / "result.json")
        if (run.get("mode"), run.get("status")) != expected or closure.get("exitCode") != 0 or \
                closure.get("timedOut") is not False or run.get("caseResultSHA256") != case["sha256"] or \
                run.get("ledger", {}).get("completedUpdates") != updates:
            p.error("Baseline must be closed successfully on the same literal length")
        if read(base / "case" / "result.json").get("status") != "GOAL":
            p.error("Baseline did not complete on a goal")
        auth["rootClosedGoalReview" if witness else "rootCompletedWitnessReview"] = pin(
            base / "invocation-result.json")
        auth["rootOriginalSuccessReview"] = pin(a.original_review)
        auth["baseline"] = dict(caseResult=case, streams={
            name: pin(base / "case" / "observation" / f"{name}.jsonl")
            for name in ("lineage", "hook-metadata")
        })
        if not witness:
            auth["gates"]["completedWitnessReviewed"] = True
    with a.authorization.open("x", encoding="utf-8") as f:
        json.dump(auth, f, indent=2)
        f.write("\n")
    print(sha(a.authorization))


if __name__ == "__main__":
    main()
