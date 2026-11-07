# Resumed two-runner policy

The user resumed after a computer crash and explicitly authorized up to two runners at a time. This supersedes older one-worker/exclusive-native-workload wording in the handoff, briefs and checkpoint history.

Use at most two fresh gpt-6.1-sol game workers, each restricted to its own report and private D: scratch directory. Read-only source inventory, extraction and bounded native behavior checks may overlap between those two assignments. They are diagnostic behavior checks, never performance measurements. No worker may build or change shared runtime/catalogue/helpers without coordinator agreement. Heavy builds, bulk conversions and all real-time performance captures remain sequential and require both diagnostic runners to release workload first.

The coordinator alone edits shared queue/checkpoint files, reviews evidence and commits on dev. Review each result separately; never adopt settings from concurrent diagnostic wall times. Preserve source hashes, forks, Finder metadata, preferences and existing save identities. No push, upload or deployment.

Recovery: active-runners.json is the authoritative multi-slot assignment record; active-worker.json remains a legacy last-assignment pointer. Inspect actual agent state and each private owned-process.json before resuming. A pre-crash task name or spawn-pending pointer does not prove a worker is alive. On 2026-11-07 restart, no prior game worker or Systemless process survived; Desk Invaders II had no report or private output and was restarted from its prepared brief.
