"""One owned hidden child, one authorization, one fresh replay, no retry."""
import pathlib,json,hashlib,subprocess,sys,time,datetime
def sha(p):
 h=hashlib.sha256()
 with pathlib.Path(p).open('rb') as f:
  for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
 return h.hexdigest()

def wall_bound(auth):
 bound=auth.get('wallBoundSeconds')
 if type(bound) is not int or bound not in (360,600) or \
   bound==600 and auth.get('mode') not in ('witness','fresh-proof'):
  raise ValueError('Expected 360 seconds, or explicit 600-second full-state proof bound')
 return bound
def counters(out,cap):
 rows=out/'case/counter-journal.jsonl';last={}
 if rows.exists():
  with rows.open(encoding='utf-8') as f:
   for line in f:
    try:last=json.loads(line)
    except json.JSONDecodeError:break
 if not last:return {'exact':False,'attemptedLower':0,'attemptedUpper':cap,'completedLower':0,'completedUpper':cap,'constructorUpper':1,'constructorResetUpper':1,'RNGDrawsLower':0,'RNGTailQualified':False}
 exact=last.get('phase')=='terminal-closed'
 upper=last['attemptedUpdates'] if exact else min(cap,max(last['attemptedUpdates'],last['reservedUpperUpdates']))
 return {'exact':exact,'attemptedLower':last['attemptedUpdates'],'attemptedUpper':upper,'completedLower':last['completedUpdates'],'completedUpper':last['completedUpdates'] if exact else upper,'constructorLower':last['constructorsAttempted'],'constructorUpper':last['constructorsAttempted'],'constructorResetLower':last['constructorResetsAttempted'],'constructorResetUpper':min(1,last['constructorsAttempted']),'RNGDrawsLower':last['RNGDraws'],'RNGTailQualified':exact,'lastLedger':last}
def main():
 auth_path=pathlib.Path(sys.argv[1]);expected=sys.argv[2];node=sys.argv[3];out=None;child=None;auth=None;start=None
 try:
  assert sha(auth_path)==expected,'Authorization hash mismatch'
  auth=json.loads(auth_path.read_text(encoding='utf-8'));out=pathlib.Path(auth['outputPath'])
  candidate=auth['mode']=='candidate';purpose='clockwerx-generic-candidate-replay-v1' if candidate else 'clockwerx-generic-chosen-replay-v1'
  assert auth['executionApproved'] is True and auth['authority']=='Root' and auth['schema']=='clockwerx-single-replay-authorization-v1' and auth['purpose']==purpose
  assert auth['mode'] in ['candidate','witness','fresh-proof'] and auth['invocationID']
  assert auth['maxConstructors']==1 and auth['maxConstructorResets']==1 and auth['maxExplicitResets']==0 and type(auth['maxUpdates']) is int and 1<=auth['maxUpdates']<=16000
  timeout_seconds=wall_bound(auth)
  if candidate:assert auth['gates']['candidateLiteralReviewed'] is True
  else:assert auth['gates']['closedGoalLiteralReviewed'] is True and auth['gates']['baselineReviewed'] is True
  if auth['mode']=='fresh-proof':assert auth['gates']['completedWitnessReviewed'] is True
  own=pathlib.Path(__file__).resolve().parent
  for name in ['supervise.py','run-replay.mjs','core.mjs','stream.mjs','factory-source-round.mjs']:
   matches=[r for r in auth['code'] if pathlib.Path(r['path']).resolve()==own/name]
   assert len(matches)==1 and sha(own/name)==matches[0]['sha256'],'Replay code pin mismatch'
  with pathlib.Path(str(auth_path)+'.SUPERVISOR-CONSUMED').open('x',encoding='utf-8') as f:f.write(json.dumps({'authSHA256':expected,'invocationID':auth['invocationID'],'UTC':datetime.datetime.now(datetime.timezone.utc).isoformat()})+'\n')
  out.mkdir(exist_ok=False);start=time.monotonic()
  with (out/'stdout.log').open('xb') as stdout,(out/'stderr.log').open('xb') as stderr:
   command=[node,'--max-old-space-size=1024',str(own/'run-replay.mjs'),str(auth_path),expected]
   child=subprocess.Popen(command,stdin=subprocess.DEVNULL,stdout=stdout,stderr=stderr,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
   (out/'owned-process.json').write_text(json.dumps({'PID':child.pid,'command':command,'authSHA256':expected,'invocationID':auth['invocationID']},indent=2)+'\n',encoding='utf-8')
   timeout=False
   try:code=child.wait(timeout=timeout_seconds)
   except subprocess.TimeoutExpired:timeout=True;child.kill();code=child.wait()
  result={'status':'CLOSED','PID':child.pid,'exitCode':code,'timedOut':timeout,'elapsedSeconds':time.monotonic()-start,'noAutomaticRetry':True,'budget':counters(out,auth['maxUpdates'])}
  (out/'closure.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result));return 1 if timeout else code
 except BaseException as error:
  # A failure after launch must still terminate only this owned child.
  if child is not None and child.poll() is None:child.kill();child.wait()
  failure={'status':'SUPERVISOR_FAILURE_NO_RETRY','error':str(error),'ownedChildLaunched':child is not None,'PID':child.pid if child is not None else None,'actualSourceRoundExecutionPossible':child is not None}
  if child is not None and out is not None:
   failure['budget']=counters(out,auth['maxUpdates'])
   failure['elapsedSeconds']=time.monotonic()-start
  target=pathlib.Path(str(auth_path)+'.SUPERVISOR-FAILURE-'+str(__import__('os').getpid())+'.json')
  with target.open('x',encoding='utf-8') as f:json.dump(failure,f,indent=2)
  raise
if __name__=='__main__':raise SystemExit(main())
