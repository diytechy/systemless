"""Reduce the saved captures and timestamped sampler, without game data."""
import datetime as dt
import hashlib
import json
import re
import statistics
from pathlib import Path

root = Path(__file__).parent
scratch = Path(r'D:\SystemlessBuild\diagnostics\2026-11-07-coordinator\delirium')
def time(value):
    return dt.datetime.fromisoformat(re.sub(r'(\.\d{6})\d+', r'\1', value.replace('Z', '+00:00')))

result = {'boundary': 'Browser/Codex process aggregate includes unrelated chats/tabs, not isolated game CPU or memory; host CPU is context. Guest ticks are not animation FPS.', 'captures': []}
specs = [(str(n), 'browser-default25-r%d' % n, 'browser-default25-r%d-cpu.json' % n) for n in (1,2,3)]
specs.append(('12-unmatched', 'browser-test12-r1-unmatched', 'browser-test12-r1b-cpu.json'))
for repetition, stem, name in specs:
    timing_path = root / (stem + '.json')
    timing = json.loads(timing_path.read_text(encoding='utf-8-sig'))
    assert timing['reason'] == 'complete' and timing['visible'] and timing['focused'] and timing['cpuMhz'] in (25,12)
    end = time(timing['capturedAt'])
    start = end - dt.timedelta(seconds=timing['wallSeconds'])
    resource_path = scratch / name
    raw = resource_path.read_bytes()
    resources = json.loads(raw.decode('utf-8-sig'))
    samples = resources['samples']
    reduced = []
    prior = None
    for sample in samples:
        stamp = time(sample['at'])
        current = {p['pid']: p for p in sample['processes']}
        if start <= stamp <= end:
            row = {'at': sample['at'], 'hostTotalCpuPercent': sample['hostTotalCpuPercent'],
                   'aggregateWorkingSetBytes': sum(p['workingSetBytes'] for p in current.values()),
                   'aggregatePrivateBytes': sum(p['privateBytes'] for p in current.values()),
                   'matchingProcesses': len(current)}
            if prior is not None:
                old_stamp, old = prior
                elapsed = (stamp - old_stamp).total_seconds()
                common = set(old) & set(current)
                valid = [pid for pid in common if current[pid]['cpuSeconds'] is not None and old[pid]['cpuSeconds'] is not None and current[pid]['cpuSeconds'] >= old[pid]['cpuSeconds']]
                row['cpuIntervalSeconds'] = elapsed
                row['aggregateCpuPercentOfHost'] = 100 * sum(current[pid]['cpuSeconds'] - old[pid]['cpuSeconds'] for pid in valid) / elapsed / resources['logicalProcessors']
                row['newProcessesNotCountedForCpu'] = len(set(current) - set(old))
                row['exitedProcessesNotCountedForCpu'] = len(set(old) - set(current))
            reduced.append(row)
        prior = stamp, current
    host = [s['hostTotalCpuPercent'] for s in reduced]
    browser = [s['aggregateCpuPercentOfHost'] for s in reduced if 'aggregateCpuPercentOfHost' in s]
    coverage = time(samples[0]['at']) <= start and time(samples[-1]['at']) >= end
    record = {'repetition': repetition, 'cpuMhz': timing['cpuMhz'], 'matchedScene': timing['cpuMhz'] == 25, 'start': start.isoformat(), 'end': end.isoformat(),
              'guestTicksPerSecond': timing['guestTicksPerSecond'], 'guestExecutionMeanMs': timing['guestExecutionMs']['mean'], 'guestExecutionP95Ms': timing['guestExecutionMs']['p95'],
              'resourceSource': str(resource_path), 'resourceSourceSha256': hashlib.sha256(raw).hexdigest(),
              'resourceCoverageComplete': coverage, 'resourceSamplesWithinCapture': len(reduced),
              'hostCpuMedianPercent': statistics.median(host) if host else None,
              'browserCodexAggregateCpuMedianPercentOfHost': statistics.median(browser) if browser else None,
              'aggregateWorkingSetMedianMiB': statistics.median([s['aggregateWorkingSetBytes'] / 2**20 for s in reduced]) if reduced else None,
              'reducedSamples': reduced}
    result['captures'].append(record)
rates = [row['guestTicksPerSecond'] for row in result['captures'] if row['cpuMhz'] == 25]
result['guestTicksPerSecond'] = {'median': statistics.median(rates), 'min': min(rates), 'max': max(rates)}
(root / 'browser-summary.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
for row in result['captures']:
    print({key: value for key, value in row.items() if key != 'reducedSamples'})
print(result['guestTicksPerSecond'])
