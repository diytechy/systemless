"""Reduce matched ClockWerx frame/pose and broad-process resource captures."""
import argparse
import hashlib
import json
import math
import statistics
from pathlib import Path
from analyze_browser_resources import capture_bounds, summarize_resources


def distribution(values):
    values=sorted(values)
    if not values:return None
    return dict(mean=statistics.mean(values),median=statistics.median(values),
                p95=values[math.ceil(len(values)*.95)-1],max=values[-1])


def reduce_run(root,label):
    raw=json.loads((root/(label+'-timing.json')).read_text(encoding='utf-8-sig'))
    timing=json.loads((root/(label+'-memory.json')).read_text(encoding='utf-8-sig'))
    assert raw['frames']==timing['frames'], 'Memory export changed captured frames'
    frames=timing['frames']
    assert timing['valid'] and timing['fromRestart']
    assert timing['startState']['time']==0
    assert timing['sound'] is False and timing['handColor']=='gold'
    assert timing['logicalSize']==timing['backingSize']==[640,480]
    assert timing['cssSize']==[615,461.25] and timing['devicePixelRatio']==1
    assert timing['counters']['droppedCatchupSeconds']==0
    assert all(f['visible'] and f['focused'] and not f['gamePaused'] and not f['gameComplete']
               and not f['recordedSwingActive'] and not any(f['heldActions'].values()) for f in frames)
    assert len({f['presentedPlayer']['pivot'] for f in frames})==1
    deltas=[]
    for a,b in zip(frames,frames[1:]):
        d=(b['presentedPlayer']['angle']-a['presentedPlayer']['angle']+math.pi)%(math.tau)-math.pi
        deltas.append(abs(d)*180/math.pi)
    changed=[d for d in deltas if d>1e-7]
    seconds=(frames[-1]['rafTimestampMs']-frames[0]['rafTimestampMs'])/1000
    resources=json.loads((root/(label+'-resources.json')).read_text(encoding='utf-8-sig'))
    reduced=summarize_resources(resources,*capture_bounds(timing))
    assert reduced['coverageBracketsCapture']
    memory=timing['pageMemory']
    files={name:hashlib.sha256((root/(label+'-'+name+'.json')).read_bytes()).hexdigest()
           for name in ['timing','memory','resources']}
    return dict(label=label,sourceHashes=files,captureUtc=timing['captureUtc'],
                durationMs=timing['durationMs'],presentation=timing['presentation'],
                startState=timing['startState'],endState=timing['endState'],
                counters=timing['counters'],userAgent=timing['userAgent'],
                workMs=distribution([f['totalWorkMs'] for f in frames]),
                renderMs=distribution([f['renderMs'] for f in frames]),
                rafGapMs=distribution([b['rafTimestampMs']-a['rafTimestampMs'] for a,b in zip(frames,frames[1:])]),
                mainThreadWorkOccupancyPercent=sum(f['totalWorkMs'] for f in frames)/timing['durationMs']*100,
                repeatedPoseFraction=1-len(changed)/len(deltas),
                orientationChangesPerSecond=len(changed)/seconds,
                positiveAngleStepDegrees=distribution(changed),pageMemory=memory,resources=reduced)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root',type=Path);parser.add_argument('--output',required=True,type=Path)
    args=parser.parse_args()
    labels=['r1-bitmap','r1-current','r1-astra','r2-current','r2-astra','r2-bitmap','r3-astra','r3-bitmap','r3-current']
    runs=[reduce_run(args.root,label) for label in labels]
    assert all(r['startState']==runs[0]['startState'] for r in runs)
    assert len({r['userAgent'] for r in runs})==1
    args.output.write_text(json.dumps(dict(runs=runs),indent=2)+'\n',encoding='utf-8')
