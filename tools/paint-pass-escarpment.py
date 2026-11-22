"""Paint one continuous mineral and ink sheet around the pass and the maple gorge."""
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
# Station is world X on the long southern face. Beyond the corner it follows
# the east return, gaining one metre for every metre south. Y is elevation.
start, span, bottom, height = -8, 448, -2, 48
width, rows = 4096, 768
rng = np.random.default_rng(877612)
s, y = np.meshgrid(
    np.linspace(start, start + span, width, dtype='float32'),
    np.linspace(bottom + height, bottom, rows, dtype='float32'),
)


def cloud(nx, ny):
    small = rng.normal(0, .44, (ny, nx)).astype('float32')
    return np.asarray(Image.fromarray(small).resize((width, rows), Image.Resampling.BICUBIC))


def wash(layer, colour, amount):
    a = np.clip(amount, 0, 1)[:, :, None]
    return layer * (1 - a) + np.array(colour, np.float32) * a


def band(a, low, high):
    t = np.clip((a - low) / (high - low), 0, 1)
    return t*t*(3-2*t)


broad = cloud(33, 6)
pool = cloud(86, 15)
feather = cloud(416, 84)
tooth = cloud(1153, 306)
dust = rng.normal(0, .84, (rows, width)).astype('float32')
# The strata rise, dip, then fold back. Small slips move one bed past its
# neighbour. Their traces carry on around the bend into the autumn valley.
fault = .61 * np.tanh((np.sin(s * .111 + y * .046) + .15 * pool) * 5.4)
fold = (y + 3.2*np.sin(s*.049+.7) + 1.91*np.sin(s*.113+1.1)
        + 1.22*np.sin(s*.153 + y*.077) + fault + .20*pool + .03*feather)
joints = (s + y*(.15 + .24*np.sin(s*.049)) + .77*np.sin(y*.29+s*.034)
          + .42*np.sin(y*.62 + s*.21) + .16*pool + .07*feather)
values = np.zeros_like(s)
fissures = np.zeros_like(s)
chips = np.zeros_like(s)
# Spacing and penetration of each joint are independent. Some split in two
# above a ledge and taper to a single hair; others fracture the full buttress.
joint_x = -16
while joint_x < start + span + 15:
    gap = rng.uniform(1.5, 8.5) * rng.uniform(.68, 1.33)
    joint_x += gap
    middle = (joint_x-start)/span*width
    radius = int(width/span*(20+gap))
    lo, hi = max(0,int(middle)-radius), min(width,int(middle)+radius)
    if lo >= hi:
        continue
    sl = np.s_[:, lo:hi]
    row = y[sl]
    centre = rng.uniform(-6, 49)
    reach = rng.uniform(4, 29)
    v = band(reach-abs(row-centre) + pool[sl]*3, -1.4, 2.8)
    err = joints[sl]-joint_x + rng.uniform(-.10,.10)*(row-22)
    err += np.clip((row-centre)*.19,-1,1)*rng.uniform(-1.1,1.1)
    size = rng.uniform(.044,.185)
    shaft = np.exp(-abs(err)/(size+.023)) * v
    pigment = rng.uniform(.42,.92)
    fissures[sl] = np.maximum(fissures[sl], shaft*pigment)
    shoulder = np.exp(-np.maximum(err,0)/(size*2.2))*(err>.04)*v
    chips[sl] = np.maximum(chips[sl], shoulder*rng.uniform(.31,.72))
    values[sl] -= np.exp(-np.maximum(-err,0)/(gap*.47))*(err<0)*v*rng.uniform(.08,.38)
    fork = err - np.clip(row-centre+3,0,8)*rng.uniform(.12,.27)
    small = np.exp(-abs(fork)/.066)*v*band(row-centre,-2,1)*(1-band(row-centre,5,11))
    fissures[sl] = np.maximum(fissures[sl], small*.64)

bed_ink = np.zeros_like(s)
mineral = np.zeros_like(s)
v = -16.
while v < 63:
    gap = rng.uniform(.63,3.9)
    v += gap
    err = fold-v
    breaking = band(.35 + pool + rng.uniform(-.4,.4) + .30*np.sin(s*rng.uniform(.085,.27)+v), -.18, .68)
    nick = rng.uniform(.045,.14)
    density = rng.uniform(.30,.78)
    bed_ink = np.maximum(bed_ink,np.exp(-abs(err)/nick)*breaking*density)
    ledge = np.exp(-abs(err-nick*2.1)/(nick*1.65))
    mineral = np.maximum(mineral,ledge*breaking*rng.uniform(.27,.71))
    values += np.exp(-np.maximum(err,0)/(gap*.29))*(err>0)*breaking*rng.uniform(.10,.26)

# Vertical dry-brush marks reach down scoured faces, breaking apart on the
# tooth of the paper. The offsets are in metres, independent of atlas size.
bristles = np.sin((joints + .12*pool)*8.6 + .8*np.sin(y*.9+s*.22))
bristles += .54*np.sin(joints*17.2+.29*feather)
hatching = band(bristles,.84,1.39)*band(feather+.58*pool+.26*tooth,.08,.83)
values += .32*broad + .16*pool + .093*feather + .018*tooth + .027*dust
paper = np.empty((rows,width,3),dtype=np.float32)
paper[:] = (161,162,148)
paper = wash(paper,(91,106,106), np.maximum(-values,0)*1.24)
paper = wash(paper,(208,201,175), np.maximum(values,0)*1.14)
paper = wash(paper,(191,170,139), band(broad*.95-pool*.5,.21,1.1)*.34)
paper = wash(paper,(66,74,73), np.clip(fissures*.82 + bed_ink*.54,0,.89))
paper = wash(paper,(217,215,190), np.maximum(chips*.50,mineral*.58))
paper = wash(paper,(85,97,91), hatching*.24)

# Contact staining and moss follow the surveyed crest and toe. Neither is a
# horizontal stripe across the plate, even where the cliff rises by thirty metres.
survey = """
import {terrainHeight as h} from './two/terrain.js';
const p=[];
for(let s=-8;s<=440;s++){
 const x=Math.min(s,310),z=-305+Math.max(0,s-310);
 p.push(s<=310?[h(x,-305),h(x,-302.5)]:[h(310,z),h(307.5,z)]);
}
console.log(JSON.stringify(p));
"""
profile = np.array(json.loads(subprocess.check_output(
    ['node','--input-type=module','-e',survey],cwd=ROOT)))
station = np.arange(start,start+span+1)
crest = np.interp(s[0],station,profile[:,0])
toe = np.interp(s[0],station,profile[:,1])
ledge = np.exp(-np.abs(y-crest+1.05-.68*pool)*.62)
damp = np.exp(-np.maximum(y-toe,0)*.31)*band(.26+pool*.36-fissures*.28,0,.52)
moss = band(tooth*.25+feather*.66+pool*.83,.20,.82)
paper = wash(paper,(103,118,97),moss*(.46*ledge+.27*damp))
paper = wash(paper,(84,98,98),.23*damp)
# Faint granular blooms cap the driest, most exposed slivers.
paper = wash(paper,(221,217,192), band(tooth+.39*dust,.47,1.32)*(.058+.105*chips))
# Carry the angular facet wash from the game's rock-pigment study across
# the whole sheet. Overlap individually shifted and turned pulls of the brush
# on the underlying fold; their borders leave no repeated rectangular stamp.
study = np.asarray(Image.open(ROOT/'two/assets/world/peach-valley-rock.webp').convert('L'),np.float32)
mean = float(study.mean())
sh,sw = study.shape
def mirrored(q, end):
    return end-np.abs(np.mod(q,2*end)-end)

def rock_pull(u,v):
    x = mirrored(u,sw-2); z = mirrored(v,sh-2)
    a,b = x.astype(np.int32),z.astype(np.int32)
    fx,fz = x-a,z-b
    return ((study[b,a]*(1-fx) + study[b,a+1]*fx)*(1-fz)
            + (study[b+1,a]*(1-fx) + study[b+1,a+1]*fx)*fz)

rock_wash, weight = np.zeros_like(y), np.zeros_like(y)
for centre in range(start-24,start+int(span)+50,26):
    # Each pull overlaps the next on a soft, irregular edge.
    lo=max(0,round((centre-38-start)*width/span)); hi=min(width,round((centre+38-start)*width/span))
    if lo>=hi: continue
    sl=np.s_[:,lo:hi]; local=s[sl]-centre
    wgt=1-band(abs(local)+broad[sl]*3.2,7,32)
    width_scale=rng.uniform(9.0,22.0)*rng.choice([-1,1])
    lift=rng.uniform(17,33)
    u=local*width_scale+y[sl]*rng.uniform(-4.2,4.2)+rng.uniform(25,sw-25)
    v=-fold[sl]*lift+local*rng.uniform(-6,6)+rng.uniform(10,sh-10)
    rock_wash[sl]+=(rock_pull(u,v)-mean)*wgt
    weight[sl]+=wgt
rock_wash/=np.maximum(weight,.001)
paper+=rock_wash[:,:,None]*np.array([.95,.94,.89],np.float32)

image = Image.fromarray(np.uint8(np.clip(paper,0,255)))

# Axe-cut strokes lift a sharp triangular face out of the soft wash. The ledge
# overhang throws a narrow ink shadow, followed by tapering, broken bristles.
pen = ImageDraw.Draw(image, 'RGBA')
def pixel(x, elevation):
    return ((x-start)*width/span,(bottom+height-elevation)*rows/height)

def stroke(nodes, widths, tint):
    left, right = [], []
    for j,(x0,y0) in enumerate(nodes):
        a,b = nodes[max(0,j-1)], nodes[min(len(nodes)-1,j+1)]
        dx,dy = b[0]-a[0], b[1]-a[1]
        length = max(.001,np.hypot(dx,dy))
        u,v = -dy*widths[j]/length, dx*widths[j]/length
        left.append(pixel(x0+u,y0+v))
        right.append(pixel(x0-u,y0-v))
    pen.polygon(left+right[::-1],fill=tint)

for _ in range(255):
    x0 = rng.uniform(start-3,start+span+3)
    y0 = rng.uniform(bottom-2,bottom+height+3)
    size = rng.uniform(.34,1.78)
    extent = size*rng.uniform(1.5,4.1)
    lean = rng.uniform(-.46,.44) + .24*np.sin(x0*.049)
    shelf = rng.uniform(.36,1.58)*size
    def place(u,v):
        return (x0+u-v*lean,y0-v)
    # The step changes bearing at a fault. Its underside opens toward the
    # viewer; a narrow light plane sits along the sunward lip.
    nodes = [place(-shelf,-.10*size), place(-.60*shelf,.01*size),
             place(-.19*shelf,-.16*size), place(0,0),
             place(.04*size,.23*extent),place(-.16*size,.39*extent),
             place(.04*size,.67*extent),place(-.22*size,extent)]
    corners = [*nodes[1:],place(.57*shelf,.61*extent),
               place(.75*shelf,.49*extent),place(1.06*shelf,.14*extent)]
    pen.polygon([pixel(*q) for q in corners],
                fill=(79,90,89,int(rng.uniform(17,49))))
    stroke(nodes,[.004,.026,.048,.086,.060,.055,.031,.002],
           (49,64,65,int(rng.uniform(84,173))))
    sunlit=[(x+.053*size,y+.053*size) for x,y in nodes[:4]]
    stroke(sunlit,[.006,.037,.059,.011],(224,216,187,int(rng.uniform(68,143))))
    for n in range(int(rng.integers(2,9))):
        x = rng.uniform(.08,.84)*shelf
        begin = rng.uniform(.04,.27)*extent
        end = min(.89*extent,begin+rng.uniform(.07,.41)*extent)
        nodes = [place(x,begin),place(x+.055*size,begin+(end-begin)*.47),
                 place(x-.08*size,end)]
        stroke(nodes,[.006,.017*size,.002],(80,90,84,int(rng.uniform(56,119))))

image.save(ROOT/'two/assets/world/pass-escarpment.webp',quality=92,method=6)
