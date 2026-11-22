"""Bake a non-repeating ink-wash painting from the Kyoto land and woodland survey."""
import json
import math
from pathlib import Path
import random
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
survey = """
import {terrainHeight,TREES} from './two/terrain.js';
import {KYO_HILL_SHEET as box,kyoRidgeHeight,inFireMeadow} from './two/higashiyama.js';
const heights=[],rises=[],mown=[];
for(let z=box.z;z<=box.z+box.depth;z+=4)for(let x=box.x;x<=box.x+box.width;x+=4) {
  heights.push(Math.round(terrainHeight(x,z)*10));
  rises.push(Math.round(kyoRidgeHeight(x,z)*10));
  mown.push(+inFireMeadow(x,z));
}
console.log(JSON.stringify({box,heights,rises,mown,trees:TREES.filter(t=>t.kyotoRidge || kyoRidgeHeight(t.x,t.z)>.5)
  .map(t=>[t.x,t.z,t.h,t.kind])}));
"""
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',survey],cwd=ROOT))
box=data['box']
ppm=1.5
w,h=int(box['width']*ppm),int(box['depth']*ppm)
grid=(1+box['depth']//4,1+box['width']//4)
def field(key):
    return np.array(data[key],dtype=np.float32).reshape(grid)

height=field('heights')*.1
rise=field('rises')*.1
dz,dx=np.gradient(height,4)
slope=np.hypot(dx,dz)
rng=random.Random(750912)
noise=np.random.default_rng(61032)
def scale_grid(a):
    return np.asarray(Image.fromarray(a.astype(np.float32)).resize((w,h),Image.Resampling.BICUBIC))

def cloud(length):
    a=noise.integers(0,256,(max(3,h//length),max(3,w//length)),dtype=np.uint8)
    return np.asarray(Image.fromarray(a).resize((w,h),Image.Resampling.BICUBIC),dtype=np.float32)/255-.5

def blurred(a,r):
    image=Image.fromarray(np.uint8(np.clip(a,0,1)*255))
    return np.asarray(image.filter(ImageFilter.GaussianBlur(r)),dtype=np.float32)/255

canopy=Image.new('L',(w,h))
crowns=ImageDraw.Draw(canopy)
for x,z,tall,_ in data['trees']:
    u,v=(x-box['x'])*ppm,(z-box['z'])*ppm
    r=tall*ppm*.63
    crowns.ellipse((u-r,v-r*.86,u+r,v+r*.86),fill=198)
grove=np.asarray(canopy.filter(ImageFilter.GaussianBlur(7*ppm)),dtype=np.float32)/255
# Indigo-grey pools below wooded folds. The convex faces retain buff paper
# with islands of cool bare stone breaking through the grass.
bloom=cloud(137)*.52+cloud(52)*.33+cloud(18)*.14
grade=scale_grid(slope)
northface=scale_grid(np.clip(.5+dx*.45-dz*.39,0,1))
mown=blurred(scale_grid(field('mown')),2.6*ppm)
shoulder=scale_grid(np.clip((rise-18)/67,0,1))
rock=np.clip((grade-.47)*2.5+bloom*2.9+northface*.33,0,1)*shoulder*(1-.68*mown)
wood=np.clip(grove*1.25+bloom*.44+grade*.10,0,1)
def wash(image,colour,density):
    return image+(np.array(colour,dtype=np.float32)-image)*np.clip(density,0,1)[:,:,None]
paper=np.broadcast_to(np.array([215,205,170],dtype=np.float32),(h,w,3))
paper=wash(paper,[168,173,141],.28+.32*northface+bloom)
paper=wash(paper,[112,127,114],wood*.94)
paper=wash(paper,[176,178,164],rock)
paper=wash(paper,[216,201,166],mown*.59)
paper=wash(paper,[83,98,92],np.clip((northface-.50)*.65+bloom*.54,0,.49)*(wood+.6*rock))
paper+=(bloom*13+cloud(6)*2.6)[:,:,None]
im=Image.fromarray(np.uint8(np.clip(paper,0,255)))
draw=ImageDraw.Draw(im)

def sample(a,x,y):
    return a[min(grid[0]-1,max(0,round(y/(4*ppm)))),min(grid[1]-1,max(0,round(x/(4*ppm))))]

def brush(points,width,colour):
    left,right=[],[]
    for i,(x,y) in enumerate(points):
        ax,ay=points[max(0,i-1)]
        bx,by=points[min(len(points)-1,i+1)]
        d=math.hypot(bx-ax,by-ay) or 1
        t=i/(len(points)-1)
        nw=width*(.09+.91*math.sin(math.pi*t)**.72)
        wx,wy=(ay-by)/d*nw,(bx-ax)/d*nw
        left.append((x+wx,y+wy))
        right.append((x-wx*.72,y-wy*.72))
    draw.polygon(left+right[::-1],fill=colour)

def tint(x,y,ink,opacity):
    c=im.getpixel((min(w-1,max(0,round(x))),min(h-1,max(0,round(y)))))
    return tuple(round(a+(b-a)*opacity) for a,b in zip(c,ink))

# Long, tapering hemp-fibre strokes follow the fall line. Fracture planes
# leave a pale lip above a short transverse line; the paper shows between beds.
for _ in range(11900):
    x,y=rng.randrange(w),rng.randrange(h)
    if sample(rise,x,y)<4 or sample(slope,x,y)<.20:continue
    bare=rock[y,x]
    if mown[y,x]>.64 and rng.random()<.76:continue
    aspect=math.atan2(-sample(dz,x,y),-sample(dx,x,y))
    across=bare>.42 and rng.random()<.42
    turn=aspect+(rng.choice([-1.27,1.27]) if across else rng.uniform(-.31,.31))
    tx,ty=math.cos(turn),math.sin(turn)
    length=ppm*rng.uniform(2.5,13)*(1+.51*bare)
    strands=rng.choice([2,3,4]) if not across else rng.choice([1,2])
    for strand in range(strands):
        gap=ppm*strand*rng.uniform(.76,1.45)
        ox=x-ty*gap+tx*rng.uniform(-3,3)
        oy=y+tx*gap+ty*rng.uniform(-3,3)
        reach=length*rng.uniform(.53,1.15)
        bow=rng.uniform(-.13,.17)*reach
        path=[]
        for j in range(8):
            t=j/7
            bend=bow*math.sin(t*math.pi)+rng.uniform(-.40,.40)
            path.append((ox+tx*reach*t-ty*bend,oy+ty*reach*t+tx*bend))
        brush(path,ppm*rng.uniform(.25,.72),tint(x,y,(59,66,58),rng.uniform(.18,.53)))
        if across and strand==0:
            brush([(px,py-ppm) for px,py in path[:6]],.66*ppm,tint(x,y,(242,231,199),.65))
# Moss dots on shaded banks; low, sparse grass between exposed ledges.
for _ in range(14200):
    x,y=rng.randrange(w),rng.randrange(h)
    if sample(rise,x,y)<3:continue
    moss=grove[y,x]>.22 or rock[y,x]>.55
    for _ in range(rng.randint(3,9)):
        a,b=x+rng.gauss(0,4.4)*ppm,y+rng.gauss(0,1.8)*ppm
        if moss:
            r=rng.uniform(.65,2.45)*ppm
            brush([(a-r,b+.15*r),(a,b-.22*r),(a+r,b)],r*.48,tint(x,y,(58,75,63),rng.uniform(.20,.49)))
        else:
            lean=rng.uniform(-1.3,2.3)*ppm
            tall=rng.uniform(1.1,3.2)*ppm
            brush([(a,b),(a+.48*lean,b-.51*tall),(a+lean,b-tall)],ppm*.36,tint(x,y,(101,97,72),.45))

# The dark heels of the brush follow exposed roots on a sloping forest floor.
# At the lip of the mown bank the same gesture turns into a spray of cut stalks.
for x,z,tall,kind in data['trees']:
    if tall<6 or rng.random()>.17:continue
    u,v=(x-box['x'])*ppm,(z-box['z'])*ppm
    if not (0<=u<w and 0<=v<h):continue
    aspect=math.atan2(-sample(dz,u,v),-sample(dx,u,v))
    for _ in range(rng.randint(2,4)):
        yaw=aspect+rng.uniform(-1.4,1.4)
        reach=ppm*rng.uniform(1.9,4.8)
        dx0,dy0=math.cos(yaw)*reach,math.sin(yaw)*reach
        bow=rng.uniform(-.21,.21)
        arc=[(u,v),(u+.28*dx0+bow*dy0,v+.28*dy0-bow*dx0),
             (u+.68*dx0-bow*dy0*.4,v+.68*dy0+bow*dx0*.4),(u+dx0,v+dy0)]
        brush(arc,ppm*(.49 if kind in ('oak','zelkova') else .33),tint(u,v,(57,58,48),.53))
        if reach>4.8:
            brush([arc[1],(u+.55*dx0+dy0*.24,v+.55*dy0-dx0*.24),
                   (u+.78*dx0+dy0*.36,v+.78*dy0-dx0*.36)],ppm*.23,tint(u,v,(75,72,55),.48))

im.save(ROOT/'two/assets/world/kyo-hills.webp',quality=90,method=6)
