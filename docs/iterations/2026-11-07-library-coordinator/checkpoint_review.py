"""Checkpoint an explicitly reviewed result; never derives a verdict or setting."""
import argparse
import datetime as dt
import json
import subprocess
import sys
from pathlib import Path


def run(*args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--message', required=True)
    parser.add_argument('--check-only', action='store_true')
    parser.add_argument('review_args', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    review_args = args.review_args
    if review_args and review_args[0] == '--':
        review_args = review_args[1:]
    if not review_args or review_args[0].startswith('-'):
        parser.error('Supply -- SLUG and explicit record_review.py arguments')
    slug = review_args[0]
    if any(c not in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in slug):
        parser.error('Invalid title slug')
    root = Path(__file__).resolve().parent
    repo = root.parents[2]
    branch = subprocess.check_output(['git', 'branch', '--show-current'], cwd=repo, text=True).strip()
    if branch != 'dev':
        raise SystemExit('Expected existing dev branch; left checkout untouched')
    staged = subprocess.check_output(['git', 'diff', '--cached', '--name-only'], cwd=repo, text=True).strip()
    if staged:
        raise SystemExit('Existing staged changes require coordinator review before checkpoint')
    report = root / slug / 'report.md'
    summary = root / slug / 'review-summary.json'
    result = json.loads(summary.read_text(encoding='utf-8-sig'))
    if result.get('workload_released') is not True or not report.is_file():
        raise SystemExit('Durable report and explicit workload release required')
    runners_path = root / 'active-runners.json'
    runners = json.loads(runners_path.read_text(encoding='utf-8-sig'))
    if not any(row['slug'] == slug for row in runners['runners']):
        raise SystemExit('Title is absent from active-runners recovery record')
    if args.check_only:
        print('Checkpoint preconditions checked; no mutation: ' + slug)
        return
    for path in (report, summary):
        lines = path.read_text(encoding='utf-8-sig').splitlines()
        path.write_text('\n'.join(line.rstrip() for line in lines).rstrip() + '\n', encoding='utf-8')
    run(sys.executable, str(root / 'record_review.py'), *review_args, cwd=repo)
    for row in runners['runners']:
        if row['slug'] == slug:
            row['status'] = 'reviewed; workload released'
    runners['updated_at'] = dt.datetime.now(dt.timezone.utc).isoformat()
    runners_path.write_text(json.dumps(runners, indent=2) + '\n', encoding='utf-8')
    run(sys.executable, str(root / 'classify_inventory.py'), cwd=repo, stdout=subprocess.DEVNULL)
    paths = [root / (slug + '-brief.md'), report, summary, runners_path]
    paths += [root / name for name in ('active-worker.json', 'current-action.md', 'queue.json',
                                      'inventory-and-queue.md', 'review-log.md')]
    run('git', 'add', '-f', '--', *(str(p) for p in paths), cwd=repo)
    run('git', 'diff', '--cached', '--check', cwd=repo)
    run('git', 'commit', '-m', args.message, cwd=repo)


if __name__ == '__main__':
    main()
