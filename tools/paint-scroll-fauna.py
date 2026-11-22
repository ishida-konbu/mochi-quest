"""Paint the original hide, feather and court-weave panels used by the six scroll animals."""
import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageOps

rng = random.Random(11823)
S = 512
atlas = Image.new("RGB", (4*S,3*S))
def colour(hexcode): return tuple(bytes.fromhex(hexcode.lstrip('#')))
def panel(index,top,bottom):
    global im,draw
    im=Image.new("RGB",(S,S))
    draw=ImageDraw.Draw(im)
    top,bottom=colour(top),colour(bottom)
    for y in range(S):
        t=y/(S-1)
        draw.line((0,y,S,y), tuple(round(a+(b-a)*t) for a,b in zip(top,bottom)))
    # Pigment gathers in broad pools before the paper takes up the water.
    pools=Image.new("RGB",im.size,(165,157,137))
    d=ImageDraw.Draw(pools)
    for _ in range(95):
        x,y=rng.randrange(-30,S),rng.randrange(-30,S)
        r=rng.randint(8,67);v=rng.randint(-25,28)
        d.ellipse((x-r,y-r//2,x+r,y+r//2),fill=(165+v,157+v,137+v))
    im=Image.blend(im,ImageChops.overlay(im,pools.filter(ImageFilter.GaussianBlur(18))),.38)
    draw=ImageDraw.Draw(im)
def stroke(points,shade,width):
    # Dry, pointed beginnings and endings; avoid constant-width mechanical outlines.
    n=len(points)
    for i in range(n-1):
        w=width*(.14+.86*math.sin(math.pi*(i+.5)/(n-1))**.67)
        draw.line((points[i],points[i+1]),fill=shade,width=max(1,round(w)))
def curve(x,y,dx,dy,bend,ink,w):
    stroke([(x+dx*i/16,y+dy*i/16+bend*math.sin(i*math.pi/16)) for i in range(17)],ink,w)
brush=Image.open(Path(__file__).with_name('animal-brushwork.webp')).convert('RGB')
def finish(index):
    # Overprint the studio's original fur / quill / scale brush, as on the
    # fox's face and the crane's wings. Keep brocade threads independently drawn.
    global im,draw
    swatches={1:(0,.22),2:(1,.41),3:(2,.61),4:(2,.28),6:(3,.54),8:(2,.59),9:(2,.47),10:(1,.54)}
    if index in swatches:
        tile,strength=swatches[index];edge=brush.width//2
        px,py=(tile%2)*edge,(tile//2)*edge
        swatch=brush.crop((px+3,py+3,px+edge-3,py+edge-3)).resize((256,256),Image.Resampling.LANCZOS)
        texture=Image.new('RGB',im.size)
        for row in range(2):
            for col in range(2):
                stamp=ImageOps.mirror(swatch) if col else swatch
                texture.paste(ImageOps.flip(stamp) if row else stamp,(col*256,row*256))
        im=Image.blend(im,ImageChops.multiply(im,texture),strength)
        draw=ImageDraw.Draw(im)

    for _ in range(24000):
        x,y=rng.randrange(S-3),rng.randrange(S)
        tint=rng.choice([-5,-3,-2,2,4,6])
        c=tuple(min(255,max(0,k+tint)) for k in im.getpixel((x,y)))
        draw.line((x,y,x+rng.randrange(1,4),y),fill=c)
    atlas.paste(im,((index%4)*S,(index//4)*S))

panel(0,'fff8e5','f6edd8');finish(0)
panel(1,'b3aa9a','ddd0b8')
for i in range(700):
    x,y=rng.randrange(S),rng.randrange(S)
    curve(x,y,rng.uniform(2,15),rng.uniform(-6,11),rng.uniform(-4,4),rng.choice(['#afa28f','#b5a995','#c0b39f']),1.4)
for j in range(14):
    x=30+j*34+rng.uniform(-10,10);mid=190+rng.uniform(-42,42)
    for k in range(rng.randrange(2,5)):
        curve(x+k*4,mid+5*k,rng.uniform(-20,12),rng.uniform(29,104),rng.uniform(-11,10),'#8b8273',1.8 if k==0 else .9)
finish(1)
panel(2,'a79272','dfd1b6')
# Broken, interlocking ink rosettes: a dream-eater's back, haunch and shoulder.
for row in range(7):
    for col in range(13):
        x=col*45+(row%2)*21+rng.randrange(-5,6);y=row*37+rng.randrange(0,9)
        r=rng.uniform(7,16)
        for j in range(3):
            a=j*1.93+rng.random()*.5
            pts=[(x+r*math.cos(a+k*.095),y+r*.74*math.sin(a+k*.095)+k*.25) for k in range(17)]
            stroke(pts,'#4d463c',rng.uniform(3,7))
        curve(x-2,y-1,5,-2,1,'#6a5742',3)
for j in range(26):
    x=rng.randrange(S);y=rng.randrange(286,440)
    curve(x,y,-5,rng.uniform(7,19),2,'#a28d71',2.1)
finish(2)
def feather(index,ground,tip,bar,dark):
    panel(index,ground,tip)
    # Each UV island is a single feather. A broad irregular subterminal band,
    # narrower proximal bars and engraved barbs all converge on the rachis.
    for j in range(5):
        y=58+j*91
        outline=[(x,y+math.sin(x/101+j)*7-abs(x-250)*.17) for x in range(-10,530,8)]
        poly=outline+[(x,v+(19 if j==0 else 13)+9*math.sin(x/70+j)) for x,v in reversed(outline)]
        draw.polygon(poly,fill=bar)
    for j in range(122):
        y=6+j*4.35
        for s in [-1,1]:
            curve(252+s*3,y,s*rng.uniform(120,255),-rng.uniform(32,70),-12, dark if j%6==0 else bar,1.3)
    curve(255,5,-3,500,0,'#e7d8b3',3)
    finish(index)
feather(3,'c7bb9e','827461','#6d6252','#493f34')
panel(4,'d4c4a2','e4d8bd')
for row in range(-1,16):
    for j in range(14):
        x=j*43+(row%2)*21; y=row*35
        curve(x,y,14,13,0,'#6a5d4d',3)
        curve(x+14,y+13,13,-16,2,'#726454',3)
finish(4)
panel(5,'8e6956','aa8062')
for row in range(-1,8):
    for j in range(-1,9):
        x=j*76+(row%2)*38; y=row*73
        for k in range(8):
            a=k*math.pi/4
            pts=[(x+math.cos(a)*18+math.cos(a+q*.3)*7,y+math.sin(a)*18+math.sin(a+q*.3)*7) for q in range(22)]
            stroke(pts,'#d7bc83',2.5)
        draw.ellipse((x-6,y-6,x+6,y+6),outline='#dcc78e',width=2)
        curve(x+24,y+17,20,14,-3,'#c5a479',2)
for x in range(0,S,5): draw.line((x,0,x,S),fill=tuple(int(c*.985) for c in im.getpixel((x,220))),width=1)
finish(5)
panel(6,'8f8874','d9c7a8')
for j in range(-1,13):
    y=j*34
    for i in range(-1,14):
        x=i*46+(j%2)*23
        pts=[(x+23*math.cos(q*math.pi/20),y+26*math.sin(q*math.pi/20)) for q in range(21)]
        stroke(pts,'#685f4f',2.8)
        stroke([(x,y-2) for x,y in pts],'#dcceae',1.8)
finish(6)
panel(7,'78867a','a3aa91')
for j in range(-1,10):
    for i in range(-2,9):
        x=82*i+j%2*41;y=51*j
        for r in [10,18,26,34]:
            stroke([(x+r*math.cos(q*math.pi/20),y-r*math.sin(q*math.pi/20)) for q in range(21)],'#d9d3b7',2)
finish(7)
feather(8,'697263','444c47','#41473e','#888473')
panel(9,'7e6553','c5a983')
for row in range(-1,15):
    for j in range(-1,14):
        x=j*43+(row%2)*21;y=row*35
        curve(x,y,26,9,10,'#584b40',3)
        curve(x+2,y-2,21,6,8,'#cebb95',2)
finish(9)
panel(10,'c1a77b','e4d3a6')
for j in range(11):
    for s in [-1,1]:
        x=25+j*52
        pts=[(x+s*14*math.sin(t/17*math.pi),t*15) for t in range(25)]
        stroke(pts,'#6b5948',6)
finish(10)
panel(11,'82675b','aa8670')
for j in range(-1,16):
    for i in range(-1,16):
        x=i*40+(j%2)*20;y=j*38
        stroke([(x+18*math.sin(q*.17),y+q*1.1) for q in range(20)],'#c6b795',2)
finish(11)
target=Path(__file__).resolve().parents[1]/'two/assets/bestiary/scroll-fauna.webp'
atlas.save(target,quality=91,method=6)
