"""Extract only owned ClockWerx Movement assets. Outputs are PRIVATE; never commit them.
Requires machfs and Pillow. Reads copied HFS fixture without modifying it.
"""
import argparse, hashlib, json, os, struct, wave, subprocess, time
from pathlib import Path
import machfs
from PIL import Image

def resources(b):
    do,mo,_,_=struct.unpack_from('>4I',b);to,no=struct.unpack_from('>HH',b,mo+24);tb=mo+to
    for i in range(struct.unpack_from('>H',b,tb)[0]+1):
        typ,n,ref=struct.unpack_from('>4sHH',b,tb+2+8*i)
        for j in range(n+1):
            p=tb+ref+12*j;rid,ni=struct.unpack_from('>hH',b,p);off=int.from_bytes(b[p+5:p+8],'big');size=struct.unpack_from('>I',b,do+off)[0];name=''
            if ni!=65535:
                q=mo+no+ni;name=b[q+1:q+1+b[q]].decode('mac_roman')
            yield typ,rid,name,b[do+off+4:do+off+4+size]

def extract(fixture,out):
    started=time.time();print(json.dumps({'phase':'start','ownedPid':os.getpid(),'utcEpoch':started}),flush=True)
    out.mkdir(parents=True,exist_ok=True);raw=fixture.read_bytes();sha=hashlib.sha256(raw).hexdigest()
    if sha!='03f7f09e3c4a4c820a373873bc103de0ec0777f36c5aa5e778afa61b33c959f4':raise ValueError('Unexpected fixture hash')
    v=machfs.Volume();v.read(raw);folder=v['ClockWerx Folder'];g=folder['ClockWerx Graphics'];b=g.data
    rr={(t,i):d for t,i,n,d in resources(g.rsrc)}
    def palette(i):
        p=rr[(b'pltt',i)];return [tuple(p[16+16*j+k] for k in [0,2,4]) for j in range(256)]
    blocks={struct.unpack_from('>I',b,16+8*i)[0]:struct.unpack_from('>I',b,20+8*i)[0] for i in range(struct.unpack_from('>I',b,8)[0])}
    manifest={'fixtureSha256':sha,'logicalSize':[640,480],'groups':{},'files':[]}
    for gid in [300,500,4400,4500,700,4300,401]:
        base=blocks[gid];pal=palette(401 if gid==401 else 1000);arrays=[]
        for j in range(4):
            count,rel=struct.unpack_from('>II',b,base+48+8*j);arrays.append([struct.unpack_from('>II',b,base+rel+8*k) for k in range(count)])
        descriptors=[struct.unpack_from('>15h',b,off) for off,length in arrays[0]]
        images=[]
        for j,(off,length) in enumerate(arrays[1]):
            _,top,left,h,w,unused,encoding=struct.unpack_from('>I6H',b,off)
            if encoding:raise ValueError('Unsupported image encoding')
            pairs=struct.unpack_from('>H',b,off+16)[0];pixels=[]
            for k in range(pairs):
                count,value=b[off+18+2*k:off+20+2*k];pixels.extend([value]*count)
            if len(pixels)!=w*h:raise ValueError('RLE dimensions mismatch')
            # The original mask is independent of palette index0 (white highlights
            # must survive). Its one-byte runs use bit7 for opaque and bits0..6
            # for length. Descriptors select shared masks for multiple dot colors.
            alpha=[255]*len(pixels)
            descriptor=next((v for v in descriptors if v[4]==j),None)
            if descriptor and 0<=descriptor[6]<len(arrays[2]):
                maskoff,masklen=arrays[2][descriptor[6]]
                mw,mh=struct.unpack_from('>HH',b,maskoff+8)
                if mw*mh==len(pixels) and masklen>16:
                    alpha=[]
                    for run in b[maskoff+16:maskoff+masklen]:alpha.extend([255 if run&128 else 0]*(run&127))
                    if len(alpha)!=len(pixels):raise ValueError(f'Mask RLE dimensions mismatch group{gid} image{j} {len(alpha)}!={len(pixels)}')
            image=Image.new('RGBA',(max(1,w),max(1,h)))
            if pixels:image.putdata([(*pal[x],a) for x,a in zip(pixels,alpha)])
            fn=f'{gid}-{j}.png';image.save(out/fn);images.append(fn)
        frames=[]
        for vals in descriptors:
            frames.append({'image':vals[4],'flipY':bool(vals[2]&256),'x':vals[10]-44 if gid!=401 else 0,'y':vals[9]-44 if gid!=401 else 0,'width':vals[14],'height':vals[13],'id':vals[1]})
        manifest['groups'][str(gid)]={'images':images,'frames':frames}
    # Resource PICTs omit the 512-byte file header required by ImageMagick.
    border=next(d for t,i,n,d in resources(folder['ClockWerx'].rsrc) if t==b'PICT' and i==401)
    pict=out/'border401.pict';pict.write_bytes(bytes(512)+border)
    child=subprocess.Popen(['magick',str(pict),str(out/'backdrop.png')])
    print(json.dumps({'phase':'pict-conversion','ownedChildPid':child.pid,'capSeconds':5}),flush=True)
    try:
        if child.wait(timeout=5):raise RuntimeError('PICT conversion failed')
    except subprocess.TimeoutExpired:
        child.kill();child.wait();raise
    pict.unlink();manifest['backdrop']='backdrop.png'
    level=next(d for t,i,n,d in resources(folder['ClockWerx Levels'].rsrc) if t==b'RND2' and i==151)
    # Movement RND2 header: signature/version, 120, 8 rows; 11 columns are fixed by this resource's cell section.
    cells=[struct.unpack_from('>HH',level,8+4*i) for i in range(88)]
    manifest['board']={'resourceId':151,'sha256':hashlib.sha256(level).hexdigest(),'columns':11,'rows':8,'cells':cells}
    (out/'movement.rnd2').write_bytes(level)
    for t,i,name,d in resources(folder['ClockWerx Sounds'].rsrc):
        if name not in ['ActionFlip','ActionBounce','ActionSwing','ActionReverse']:continue
        # Standard sampled-sound header reached through bufferCmd's offset.
        fmt=struct.unpack_from('>H',d)[0];nc=struct.unpack_from('>H',d,10 if fmt==1 else 4)[0];cp=12 if fmt==1 else 6
        for j in range(nc):
            cmd,p1,off=struct.unpack_from('>HHI',d,cp+8*j)
            if (cmd&0x7fff)!=81:continue
            length,rate=struct.unpack_from('>II',d,off+4);encoding=d[off+20]
            if encoding!=0:continue
            fn=name+'.wav'
            with wave.open(str(out/fn),'wb') as wv:wv.setnchannels(1);wv.setsampwidth(1);wv.setframerate(round(rate/65536));wv.writeframes(d[off+22:off+22+length])
            manifest.setdefault('sounds',{})[name]=fn
    for f in sorted(out.iterdir()):
        if f.is_file() and f.name!='manifest.json':manifest['files'].append({'name':f.name,'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2));print(json.dumps({'pid':os.getpid(),'durationSeconds':time.time()-started,'fixtureSha256':sha,'files':len(manifest['files']),'sounds':manifest.get('sounds',{})}))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('fixture',type=Path);p.add_argument('output',type=Path);a=p.parse_args();extract(a.fixture,a.output)
