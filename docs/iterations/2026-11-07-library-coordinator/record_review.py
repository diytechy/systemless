"""Persist a coordinator's explicit per-game review; does not accept settings."""
import argparse
import datetime as dt
import json
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('slug')
parser.add_argument('--outcome', required=True, choices=['unchanged baseline','compatibility blocker','unsupported requirement','not yet measured','measurement blocked'])
parser.add_argument('--review', required=True)
parser.add_argument('--timing', required=True)
parser.add_argument('--next', dest='next_slug')
parser.add_argument('--report', default='report.md')
parser.add_argument('--depth-size')
parser.add_argument('--controls')
parser.add_argument('--preferences')
parser.add_argument('--title')
parser.add_argument('--dependencies')
parser.add_argument('--version-notes')
args = parser.parse_args()
root = Path(__file__).parent
queue_file = root / 'queue.json'
queue = json.loads(queue_file.read_text(encoding='utf-8-sig'))
row = next(r for r in queue['games'] if r['slug'] == args.slug)
report = root / args.slug / args.report
if not report.is_file():
    raise SystemExit('Missing reviewed report: ' + str(report))
row.update(status=args.outcome, timing=args.timing, report=args.slug + '/' + args.report, review=args.review)
for option, field in ((args.depth_size,'depth_size'), (args.controls,'controls'), (args.preferences,'preferences_save_id'), (args.title,'title'), (args.dependencies,'dependencies'), (args.version_notes,'version_notes')):
    if option is not None:
        row[field] = option
row.setdefault('accepted_setting', 'No runtime setting change accepted by this review')
if args.next_slug:
    next(r for r in queue['games'] if r['slug'] == args.next_slug)['status'] = 'worker assigned'
queue_file.write_text(json.dumps(queue, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
done = [r for r in queue['games'] if r['status'] not in ('pending','worker assigned','worker active')]
stamp = dt.datetime.now(dt.timezone.utc).isoformat()
revision = subprocess.check_output(['git','rev-parse','HEAD'],cwd=root.parents[2],text=True).strip()
log = root / 'review-log.md'
if not log.exists():
    log.write_text('# Coordinator per-game review log\n\nChronological accepted evidence boundaries; no automatic runtime adoption. Earlier ClockWerx/Koji/Delirium reviews are in their reports and checkpoint.\n',encoding='utf-8')
with log.open('a',encoding='utf-8') as stream:
    stream.write(f'\n- {stamp} — {row["title"]} (`{args.slug}`): **{args.outcome}**. {args.review} Timing: {args.timing}. Report: [{args.report}]({args.slug}/{args.report}). Starting review revision `{revision}`. Completed first-pass results: {len(done)}/{len(queue["games"])}. Next: {args.next_slug or "coordinator comparison/pilot phase"}.\n')
checkpoint = root / 'current-action.md'
checkpoint.write_text(f'''# Current coordinator action

Updated {stamp}. Read this alongside checkpoint.md and queue.json; this file supersedes older next-action prose.

Reviewed first-pass results: {len(done)}/{len(queue['games'])}. Last reviewed: {args.slug} — {args.outcome}. {args.review}

Next: {args.next_slug or 'coordinator comparison/pilot phase'}. Read active-runners.json and concurrency.md before filling an available slot with a fresh gpt-6.1-sol worker. Latest user authorization permits two independent diagnostic runners; heavy builds and real-time benchmarks remain sequential. Review raw evidence and behavior boundaries before committing settings; no setting accepted by this checkpoint helper.

Runtime baseline remains ed74c8b4 unless explicitly changed by a reviewed code commit. Supported visible IAB is root-only; subagents use native/source checks and release workload before root captures. Windows Computer Use URL policy path is not retried. Revisit ClockWerx via supported root IAB before final pilot comparison. Pilot only after every title receives a first-pass result. Existing normal routes/saves/media must remain usable and private. No push or deploy.
''',encoding='utf-8')
active_path = root / 'active-worker.json'
if active_path.exists():
    active = json.loads(active_path.read_text(encoding='utf-8-sig'))
    if active['slug'] == args.slug:
        active.update(status='reviewed; workload released',updated_at=stamp)
        active_path.write_text(json.dumps(active,indent=2)+'\n',encoding='utf-8')
print(f'Review persisted: {args.slug}, {len(done)}/{len(queue["games"])}, next={args.next_slug}')
