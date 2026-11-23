"""Three repeating monochrome impressions for Sakuragawa, the forest lake and the sea.

The gravel impressions use top views of the six bundled Rock Moss Set 01 scans
by Kless Gyzen (Poly Haven, CC0). Render original triangles with their UVs so
the shape, mineral grain and moss on each individual pebble survive reduction.
"""
import io
import json
import math
import random
import struct
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

root = Path(__file__).resolve().parents[1] / 'two/assets/world'
size = 768
rng = random.Random(12173)
noise = np.random.default_rng(92813)
tau = math.tau


def rock_stamps():
    data = (root / 'moss-stones.glb').read_bytes()
    n = struct.unpack_from('<I', data, 12)[0]
    gltf = json.loads(data[20:20+n])
    blob = data[28+n:]

    def read(idx):
        acc = gltf['accessors'][idx]
        view = gltf['bufferViews'][acc['bufferView']]
        fmt = {5126: '<f4', 5123: '<u2', 5125: '<u4'}[acc['componentType']]
        dim = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[acc['type']]
        start = view.get('byteOffset', 0) + acc.get('byteOffset', 0)
        return np.ndarray((acc['count'], dim), dtype=fmt, buffer=blob, offset=start,
                          strides=(view.get('byteStride', dim*np.dtype(fmt).itemsize), np.dtype(fmt).itemsize))

    source = next(v for v in gltf['images'] if 'diff' in v['name'])
    view = gltf['bufferViews'][source['bufferView']]
    start = view['byteOffset']
    tex = np.asarray(Image.open(io.BytesIO(blob[start:start+view['byteLength']])).convert('L'))
    for mesh in gltf['meshes']:
        p = mesh['primitives'][0]
        pos, uv, faces = read(p['attributes']['POSITION']), read(p['attributes']['TEXCOORD_0']), read(p['indices']).reshape(-1,3)
        flat = pos[:,[0,2]]
        coords = 2+(flat-flat.min(axis=0))*57/max(np.ptp(flat,axis=0))
        buffer = np.zeros((62,62,4), np.uint8)
        zbuffer = np.full((62,62), -np.inf)
        height = max(np.ptp(pos[:,1]), .00001)
        for f in faces:
            a,b,c = coords[f]
            m = np.stack((b-a,c-a), axis=1)
            if abs(np.linalg.det(m)) < .0001: continue
            x0,y0 = np.floor(np.min([a,b,c],axis=0)).astype(int)
            x1,y1 = np.ceil(np.max([a,b,c],axis=0)).astype(int)+1
            y,x = np.mgrid[y0:y1,x0:x1]
            bary = (np.stack((x+.5-a[0],y+.5-a[1]), axis=-1) @ np.linalg.inv(m).T)
            u,v = bary[...,0],bary[...,1]
            weights = np.stack((1-u-v,u,v),axis=-1)
            h = weights @ pos[f,1]
            depth = zbuffer[y0:y1,x0:x1]
            cover = (weights.min(axis=-1) >= 0) & (h > depth)
            depth[cover] = h[cover]
            uvpix = ((weights @ uv[f]) % 1 * np.array([tex.shape[1],tex.shape[0]])).astype(int)
            tone = tex[uvpix[...,1],uvpix[...,0]]*.55+(h-pos[:,1].min())/height*63+49
            part = buffer[y0:y1,x0:x1]
            part[cover,:3] = tone[cover,None]
            part[cover,3] = 255
        img = Image.fromarray(buffer)
        yield img.crop(img.getbbox())


def noise_sheet(level, grain):
    fine = noise.normal(level,grain,(size,size))
    # Periodic, low-frequency wash across the edges of the woodblock.
    y,x = np.mgrid[:size,:size]*tau/size
    fine += 7*np.sin(4*x+np.sin(3*y)) + 5*np.cos(3*y+np.cos(2*x))
    return Image.fromarray(np.uint8(np.clip(fine,0,255)))


def stamp(canvas, img, x, y):
    for dx in ([0, -size] if x+img.width>size else [0]):
        for dy in ([0, -size] if y+img.height>size else [0]):
            canvas.paste(img, (x+dx,y+dy), img.getchannel('A'))


def deposit(canvas,img):
    stamp(canvas, img, rng.randrange(size), rng.randrange(size))


def gravel():
    bed = noise_sheet(111,14)
    scans = list(rock_stamps())
    for layer,count in enumerate([1750,470,95]):
        for _ in range(count):
            w = int(rng.uniform(5,13)*(1+layer*.94))
            h = int(w*rng.uniform(.56,.92))
            s = rng.choice(scans).resize((w,h),Image.Resampling.LANCZOS)
            s = s.rotate(rng.uniform(-53,47),Image.Resampling.BICUBIC,expand=True)
            alpha = s.getchannel('A')
            stone = ImageOps.colorize(ImageOps.grayscale(s), (37,)*3, (rng.randrange(195,249),)*3).convert('RGBA')
            stone.putalpha(alpha)
            x,y = rng.randrange(size),rng.randrange(size)
            shadow = Image.new('RGBA',s.size,(57,57,57));shadow.putalpha(alpha.point(lambda a: int(a*.78)))
            stamp(bed,shadow,(x+1)%size,(y+2)%size)
            stamp(bed,stone,x,y)
    return bed


def leaf_stamp():
    w = rng.randint(16,35); h = int(w*rng.uniform(.26,.63))
    s = Image.new('RGBA',(w+8,h+8))
    d = ImageDraw.Draw(s)
    shape=[]
    def vein(t): return 3+h*(.46+.20*math.sin(3*t+.2))
    for side,steps in [(1,range(18)),(-1,reversed(range(18)))]:
        for j in steps:
            t=j/17
            shape.append((3+w*t,vein(t)+side*h*.42*math.sin(math.pi*t)**.82*(.91+.10*(j%2))))
    val=rng.randrange(67,136)
    d.polygon(shape, fill=(val,)*3+(210,))
    d.line([(3+w*j/16, vein(j/16)) for j in range(17)], fill=(170,)*3+(230,),width=1)
    for j in range(1,8):
        t=j/9
        for sign in [-1,1]:
            d.line([(3+w*(t+.11),vein(t+.11)),(3+w*t,vein(t)+sign*h*.34*math.sin(math.pi*t))],fill=(145,)*3+(190,))
    return s.rotate(rng.uniform(0,360),Image.Resampling.BICUBIC,expand=True)


def silt():
    bed=noise_sheet(152,9)
    for _ in range(165):
        deposit(bed,leaf_stamp())
    for _ in range(130):
        s=Image.new('RGBA',(74,28))
        d=ImageDraw.Draw(s)
        path=[(j,13+3.2*math.sin(j*.083)+1.8*math.sin(j*.21)) for j in range(rng.randint(13,69))]
        d.line(path,fill=(96,)*3+(153,),width=2)
        d.line([(x,y+1.8) for x,y in path],fill=(188,)*3+(135,),width=1)
        deposit(bed,s.rotate(rng.uniform(0,360),Image.Resampling.BICUBIC,expand=True))
    return bed


def shell_hash():
    bed=noise_sheet(148,16)
    for _ in range(1040):
        r=rng.uniform(1.6,7)
        s=Image.new('RGBA',(19,17)); d=ImageDraw.Draw(s)
        a=rng.uniform(-2.6,-1.2); fan=rng.uniform(.65,1.8)
        tip=(10,13)
        rib=[(10+r*math.cos(a+fan*j/8),13+r*math.sin(a+fan*j/8)) for j in range(9)]
        val=rng.randrange(150,233)
        d.polygon([tip,*rib],fill=(val,)*3+(220,))
        d.line(rib,fill=(93,)*3+(205,),width=1)
        if r>3:
            for end in rib[::3]:d.line([tip,end],fill=(250,)*3+(185,),width=1)
        deposit(bed,s.rotate(rng.uniform(0,360),Image.Resampling.BICUBIC,expand=True))
    return bed


Image.merge('RGB',(gravel(),silt(),shell_hash())).save(root/'waterbed-impressions.webp',quality=85,method=6)
