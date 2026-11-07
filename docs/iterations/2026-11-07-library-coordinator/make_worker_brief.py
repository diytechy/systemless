"""Generate a complete fact-bound assignment for a not-yet-prepared title."""
import argparse
import json
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('slug')
args = parser.parse_args()
root = Path(__file__).parent
repo = root.parents[2]
queue = json.loads((root / 'queue.json').read_text(encoding='utf-8-sig'))
game = next(row for row in queue['games'] if row['slug'] == args.slug)
inventory = json.loads((root / 'inventory.json').read_text(encoding='utf-8-sig'))
volumes = {row['source']: row for row in inventory['volumes']}
revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo, text=True).strip()
status = subprocess.check_output(['git', 'status', '--short'], cwd=repo, text=True).strip() or 'clean'
out = root / (args.slug + '-brief.md')
if out.exists():
    raise SystemExit('Existing individual brief preserved: ' + str(out))
candidates = '\n'.join('- ' + json.dumps(dict(candidate, source_volume_sha256=volumes[candidate['source']]['sha256_before']), ensure_ascii=False) for candidate in game['candidates'])
text = f'''# {game['title']} individual worker assignment

- Title/slug: {game['title']} / `{game['slug']}`. Version evidence appears verbatim below; resolve ambiguity from original documentation/resources.
- Checkout: C:/Projects/systemless, existing dev. Starting revision {revision}; runtime baseline ed74c8b4 until a later report explicitly records a runtime change. Current status: {status}. Preserve coordinator/other files.
- Original installation: D:/SheepShaver_MAC_Emulator. Paths below are relative to it. Source hashes, exact executable candidates and architecture evidence:
{candidates}
- Copied fixture/extraction: none established for this title; discover and validate read-only. Use D:/SystemlessBuild/diagnostics/2026-11-07-coordinator/{game['slug']} for all private media/scenarios/captures. Existing source001/002/Boot must remain unchanged. No original writable mount/launch.
- Runtime entry/route/pacing: no prepared private release entry or route for this title. Existing release WASM aa25ac7a47cbd323ce6b4909892db2158f3d4e7d03d8346575949e5e5840674c contains only Koji/ClockWerx/Delirium. Normal runtime default25/2catchup/4reset slack; not a measured title configuration.
- Display/partition: {game['depth_size']}; use SIZE evidence above for memory, verify required resolution/depth from documentation or bounded native behavior and label exploratory defaults. No blanket 8-bit assumption.
- Save/preferences: {game['preferences_save_id']}. Discover actual requirements; do not invent save compatibility or replace existing browser saves. Registration/preference values stay private.
- Controls/known state: {game['controls']}. Current timing: {game['timing']}. No compatibility qualification from APPL/CODE/cfrg metadata alone.
- Known source/context limitations: {game.get('known_issues', 'No additional title-specific issue established; inspect bounded behavior rather than infer compatibility.')}
- Associated containers/variants: {json.dumps(game.get('associated_containers', []), ensure_ascii=False)}. Inspect relevant requirements; preserve current selected version/save identity, do not silently replace it with an archive/Trash variant.
- Authorized file scope: own report/evidence directory docs/iterations/2026-11-07-library-coordinator/{game['slug']}/ and assigned private D: scratch. Reuse scripts/extract_owned_game.py if present; propose needed shared-helper changes before editing it. No runtime/catalogue/packaging/global-setting changes without coordinator agreement. No commits/push/deploy/nested agents.
- Existing native diagnostic executable: D:/SystemlessBuild/target/ci-test/systemless.exe. Cached machfs environment: D:/SystemlessBuild/uv-cache/archive-v0/YghSmGhw_A5RgPIr/Scripts/python.exe. Inspect/reuse before reinstall/build.
- Baseline scene/readiness/input sequence: discovery task. Inspect the original title, documentation and finite native screenshots, choose a representative initial play scene and small reproducible action sequence, or document exact blocker. Do not manufacture timing/controls.
- Hypothesis/acceptance: first-pass preparation and compatibility evidence. Preserve all forks/metadata and identify dependencies. No pacing candidate without release-browser baseline and repeated comparable evidence. On substantial missing service/unsupported requirement, save minimal reproduction and smallest next step; do not sprawl into shared fixes.
- Exclusive workload ownership: only this worker runs native/extraction/build workload until explicit release to coordinator. Visible supported IAB is root-only; do not attempt subagent browser or Windows Computer Use. Coordinator only lightweight docs until release. No overlapping capture/emulator/build/conversion.
- Required stopping/result: useful inspected behavior evidence or precise compatibility/preparation blocker, report/status JSON, checks, limits, rollback and next action. Release workload promptly after bounded checks, then finish docs. Follow common-unprepared-worker.md in full and linked skill/worker contract; no permission needed for authorized reversible preparation.
'''
out.write_text(text, encoding='utf-8')
print(out)
