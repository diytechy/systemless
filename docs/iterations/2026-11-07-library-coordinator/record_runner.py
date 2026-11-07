"""Record a confirmed spawn; never starts an agent or diagnostic process."""
import argparse
import datetime as dt
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('slug')
    parser.add_argument('task_name')
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    active_path = root / 'active-runners.json'
    active = json.loads(active_path.read_text(encoding='utf-8-sig'))
    legacy_path = root / 'active-worker.json'
    legacy = json.loads(legacy_path.read_text(encoding='utf-8-sig'))
    if legacy['slug'] != args.slug or legacy['task_name'] != args.task_name:
        raise SystemExit('Confirmed task must match the prepared individual brief')
    queue_path = root / 'queue.json'
    queue = json.loads(queue_path.read_text(encoding='utf-8-sig'))
    game = next(row for row in queue['games'] if row['slug'] == args.slug)
    runners = [row for row in active['runners'] if row['status'] == 'running' and row['slug'] != args.slug]
    if len(runners) >= 2:
        raise SystemExit('Both diagnostic runner slots are occupied')
    if args.check_only:
        print('Assignment preconditions checked; no mutation: ' + args.slug)
        return
    stamp = dt.datetime.now(dt.timezone.utc).isoformat()
    runners.append(dict(slug=args.slug, task_name=args.task_name, status='running', brief=legacy['brief']))
    active.update(runners=runners, updated_at=stamp)
    legacy.update(status='running; see active-runners.json', updated_at=stamp)
    game['status'] = 'worker active'
    for path, value in ((active_path, active), (legacy_path, legacy), (queue_path, queue)):
        path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print('Confirmed diagnostic runner recorded: ' + args.task_name)


if __name__ == '__main__':
    main()
