"""Reduce timestamped resource samples without labeling aggregate usage game CPU."""
import argparse
import datetime as dt
import json
import math
import re
import statistics
from pathlib import Path


def timestamp(value):
    value=value.replace('Z','+00:00')
    # PowerShell emits seven fractional digits; Python3.8 accepts three or six.
    value=re.sub(r'\.(\d+)(?=[+-]|$)',lambda match:'.'+(match.group(1)+'000000')[:6],value)
    return dt.datetime.fromisoformat(value)


def stats(values):
    values=sorted(value for value in values if isinstance(value,(int,float)) and math.isfinite(value))
    return dict(mean=statistics.mean(values),median=statistics.median(values),min=values[0],max=values[-1]) if values else None


def summarize_resources(document,start,end):
    start,end=timestamp(start),timestamp(end)
    if end<=start:raise ValueError('Capture must have a positive duration')
    logical=document['logicalProcessors']
    if type(logical) is not int or logical<=0:raise ValueError('Missing logical processor count')
    samples=sorted(document['samples'],key=lambda row:timestamp(row['at']))
    inside=[row for row in samples if start<=timestamp(row['at'])<=end]
    if len(inside)<2:raise ValueError('Too few resource samples inside capture')
    reduced=[];total_cpu=0;total_wall=0;groups={}
    for index,row in enumerate(inside):
        item=dict(at=row['at'],hostTotalCpuPercent=row.get('hostTotalCpuPercent'),
            aggregateWorkingSetBytes=sum(p['workingSetBytes'] for p in row['processes']),
            aggregatePrivateBytes=sum(p['privateBytes'] for p in row['processes']),matchingProcesses=len(row['processes']))
        if index:
            previous=inside[index-1]
            wall=(timestamp(row['at'])-timestamp(previous['at'])).total_seconds()
            if wall<=0:raise ValueError('Duplicate resource timestamp')
            old={p['pid']:p for p in previous['processes']};new={p['pid']:p for p in row['processes']}
            cpu=0;invalid=0
            for pid in old.keys() & new.keys():
                before,after=old[pid],new[pid]
                first,last=before.get('cpuSeconds'),after.get('cpuSeconds')
                if before['name']!=after['name'] or not isinstance(first,(int,float)) or not isinstance(last,(int,float)) or not math.isfinite(first+last) or last<first:
                    invalid+=1;continue
                change=last-first;cpu+=change
                groups[after['name']]=groups.get(after['name'],0)+change
            total_cpu+=cpu;total_wall+=wall
            item.update(cpuIntervalSeconds=wall,aggregateCpuPercentOfHost=cpu/wall/logical*100,
                newProcessesNotCountedForCpu=len(new.keys()-old.keys()),
                exitedProcessesNotCountedForCpu=len(old.keys()-new.keys()),invalidCpuPairs=invalid)
        reduced.append(item)
    return dict(boundary=document.get('boundary','Matching process aggregate; not isolated game usage'),
        cpuMethod='Cumulative CPU deltas only for same PID/name at both ends of each wholly-contained sample interval; new/exited/invalid pairs omitted, potentially undercounting. PID reuse with identical name and monotonic CPU cannot be detected.',
        memoryMethod='Sum of sampled process working sets/private bytes; working sets may double-count shared pages; private bytes are committed allocation, not physical RAM.',
        requestedStart=start.isoformat(),requestedEnd=end.isoformat(),
        coverageBracketsCapture=timestamp(samples[0]['at'])<=start and timestamp(samples[-1]['at'])>=end,
        samplesWithinCapture=len(inside),measuredCpuIntervalSeconds=total_wall,
        aggregateCpuPercentOfHostTimeWeighted=total_cpu/total_wall/logical*100,
        cpuSecondsByProcessName=groups,hostCpuPercent=stats(row.get('hostTotalCpuPercent') for row in inside),
        aggregateWorkingSetBytes=stats(row['aggregateWorkingSetBytes'] for row in reduced),
        aggregatePrivateBytes=stats(row['aggregatePrivateBytes'] for row in reduced),reducedSamples=reduced)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('resources',type=Path);parser.add_argument('timing',type=Path)
    parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    timing=json.loads(args.timing.read_text(encoding='utf-8-sig'))
    result=summarize_resources(json.loads(args.resources.read_text(encoding='utf-8-sig')),timing['captureStartedAt'],timing['capturedAt'])
    output=json.dumps(result,indent=2)+'\n'
    if args.output:args.output.write_text(output,encoding='utf-8')
    else:print(output,end='')
