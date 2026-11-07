import sys,tempfile
from pathlib import Path
sys.path.insert(0,r'C:\Projects\systemless\scripts')
from extract_owned_game import *
v=machfs.Volume();v.name='Synthetic'; v['Game']=machfs.Folder();v['Game']['Nested']=machfs.Folder()
f=machfs.File();f.data=b'fork-data';f.rsrc=b'fork-resource';f.type=b'APPL';f.creator=b'TEST';f.flags=1024;f.crdate=123456;f.mddate=234567;f.bkdate=345678;f.x=12;f.y=34
v['Game']['Nested']['App']=f;v['Unrelated']=copy.deepcopy(f)
v['Game'].crdate=456789;v['Game'].mddate=567890
v['Game']['Nested'].crdate=678901;v['Game']['Nested'].mddate=789012
t=copy_selected(v,['Game']);r=machfs.Volume();r.read(t.write(size=2097152,desktopdb=False,bootable=False));assert verify(t,r)==1;assert 'Unrelated' not in r
t=copy_selected(v,['Game/Nested/App']);r=machfs.Volume();r.read(t.write(size=2097152,desktopdb=False,bootable=False));assert verify(t,r)==1
for path in [('Game',),('Game','Nested')]:
 for field in FIELDS:
  if hasattr(v[path],field):assert getattr(v[path],field)==getattr(r[path],field),(path,field)
for name in ['../App','/App','Game//App','A'*32,'bad:name']:
 try:parts(name)
 except ValueError:pass
 else:raise AssertionError(name)
with tempfile.TemporaryDirectory(dir=r'D:\SystemlessBuild') as d:
 s=Path(d)/'source.img';s.write_bytes(v.write(size=2097152,desktopdb=False,bootable=False))
 try:extract(s,Path(d)/'out.img',['Game'],2097152)
 except ValueError:pass
 else:raise AssertionError('source-dir guard')
print('Synthetic nested forks, Finder metadata/dates/flags/location, exclusion and path guards passed')

with tempfile.TemporaryDirectory(dir=r'D:\SystemlessBuild') as d:
 root=Path(d);(root/'Content').mkdir();s=root/'Content'/'source.img';s.write_bytes(v.write(size=2097152,desktopdb=False,bootable=False))
 try:extract(s,root/'Elsewhere'/'out.img',['Game'],2097152,root)
 except ValueError:pass
 else:raise AssertionError('installation-root guard')
 out=root.parent/(root.name+'-copy.img')
 result=extract(s,out,['Game'],2097152,root);assert result['files_verified']==1
 try:extract(s,out,['Game'],2097152,root)
 except ValueError:pass
 else:raise AssertionError('overwrite guard')
 out.unlink()
print('Installation-root guard and successful extraction/reopen/overwrite checks passed')
