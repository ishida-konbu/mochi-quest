"""Rebuild the in-game hero with Blender 5 and cwebp.

blender -b -P tools/export-nikkori.py -- <rig.blend> <eight-gestures.blend>
The input scenes stay on disk unmodified. Only the hero, his facial paint
and his eight skeleton performances are written into the public assets.
"""
import array
import json
import math
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

import bpy
from mathutils import Matrix, Vector, kdtree

rig_file, gesture_file = map(Path, sys.argv[sys.argv.index('--') + 1:])
out = Path(__file__).resolve().parents[1] / 'two/assets/actors/nikkori'
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(rig_file.resolve()))
original = [v.co.copy() for v in bpy.data.objects['Mochi_LOD4'].data.vertices]

bpy.ops.wm.open_mainfile(filepath=str(gesture_file.resolve()))
scene = bpy.context.scene
arm = bpy.data.objects['Mochi • Rig']
body = bpy.data.objects['Mochi_LOD4']
clean = [v.co.copy() for v in body.data.shape_keys.key_blocks[1].data]
assert len(original) == len(clean)
delta = [a-b for a,b in zip(original,clean)]
lookup = kdtree.KDTree(len(clean))
for i,co in enumerate(clean):
    lookup.insert(co,i)
lookup.balance()

# Keep the supplied vertex groups and UV islands through quadric decimation.
body.modifiers.clear()
body.shape_key_clear()
for vertex,coord in zip(body.data.vertices,clean):
    vertex.co = coord
decimate = body.modifiers.new('Handheld LOD', 'DECIMATE')
decimate.ratio = .135
body.hide_viewport = False
deps = bpy.context.evaluated_depsgraph_get()
body_eval = body.evaluated_get(deps)
mesh = bpy.data.meshes.new_from_object(body_eval, preserve_all_data_layers=True, depsgraph=deps)
mesh.calc_loop_triangles()

def gl(co):
    return (co[0], co[2], -co[1])

def smooth(a,b,x):
    t = min(1,max(0,(x-a)/(b-a)))
    return t*t*(3-2*t)

def pulled(co):
    x,y,z = co
    h = z/2.32
    u = min(1,max(0,(h-.035)/.535))
    rise = u**3*(10-15*u+6*u*u)
    # The weight stays in two rounded ends; tension pinches the softer
    # dough between them. Keep the face together on the upper portion.
    neck = math.exp(-((h-.295)/.168)**2) * smooth(.035,.17,h)
    a = math.atan2(y,x)
    flute = neck*(.023*math.cos(5*a+h*3)+.016*math.sin(3*a-h*5))
    radius = .89 - .44*neck - .08*smooth(.36,.74,h) + flute
    return Vector((x*radius + .092*math.sin(h*math.pi)*rise,
                   y*radius - .047*rise + .031*neck*math.cos(a),
                   z + 2.02*rise))

def pressed(co):
    x,y,z = co
    h = z/2.32
    base = math.exp(-((h-.26)/.22)**2)
    return Vector((x*(1+.13*base),y*(1+.16*base),z-.13*smooth(.03,.72,h)))

base = [v.co.copy() for v in mesh.vertices]
smile = []
for co in base:
    nearest=lookup.find_n(co,4)
    weights=[1/max(dist,.00015)**2 for _,_,dist in nearest]
    offset = sum((delta[n]*w for ((_,n,_),w) in zip(nearest,weights)),Vector((0,0,0)))/sum(weights)
    # Transfer the small original smile-eyelid relief. All mouth shapes use
    # the clean lip bed prepared for painted expressions in the gestures file.
    smile.append(co+offset*smooth(1.20,1.29,co.z))

shapes=[smile, [pulled(v) for v in base], [pressed(v) for v in base]]
# Compute smooth normals once per original vertex, before splitting UV seams.
def normals(vertices):
    for v,coord in zip(mesh.vertices,vertices):
        v.co=coord
    mesh.update()
    return [v.normal.copy() for v in mesh.vertices]
base_normals=normals(base)
shape_normals=[normals(points) for points in shapes]
normals(base)

bones=list(arm.data.bones)
bone_index={b.name:i for i,b in enumerate(bones)}
joints,weights=[],[]
for vertex in mesh.vertices:
    links=sorted(((g.weight,bone_index[body.vertex_groups[g.group].name]) for g in vertex.groups
                  if body.vertex_groups[g.group].name in bone_index), reverse=True)[:4]
    wsum=sum(w for w,_ in links)
    if not wsum: raise ValueError('Unweighted skin vertex')
    joints.append(tuple(i for _,i in links)+(0,)*(4-len(links)))
    weights.append(tuple(w/wsum for w,_ in links)+(0,)*(4-len(links)))

buffer=bytearray()
views=[]
access=[]
codes={'f':5126, 'H':5123, 'B':5121}
def accessor(rows,kind,fmt='f',bounds=False):
    rows=list(rows)
    flat=array.array(fmt,(v for row in rows for v in row)).tobytes()
    buffer.extend(b'\0'*(-len(buffer)%4))
    view=len(views)
    views.append(dict(buffer=0,byteOffset=len(buffer),byteLength=len(flat)))
    buffer.extend(flat)
    item=dict(bufferView=view,componentType=codes[fmt],count=len(rows),type=kind)
    if bounds:
        item.update(min=list(map(min,zip(*rows))),max=list(map(max,zip(*rows))))
    access.append(item)
    return len(access)-1

splits={}
ids=[]
uvs=[]
indices=[]
uvmap=mesh.uv_layers.active.data
for tri in mesh.loop_triangles:
    for vi,li in zip(tri.vertices,tri.loops):
        uv=uvmap[li].uv
        tex=(round(uv.x,7),round(1-uv.y,7))
        key=(vi,tex)
        if key not in splits:
            splits[key]=len(ids)
            ids.append(vi)
            uvs.append(tex)
        indices.append((splits[key],))
attr={
    'POSITION':accessor((gl(base[i]) for i in ids),'VEC3',bounds=True),
    'NORMAL':accessor((gl(base_normals[i]) for i in ids),'VEC3'),
    'TEXCOORD_0':accessor(uvs,'VEC2'),
    'JOINTS_0':accessor((joints[i] for i in ids),'VEC4','B'),
    'WEIGHTS_0':accessor((weights[i] for i in ids),'VEC4'),
}
targets=[dict(POSITION=accessor((gl(coords[i]-base[i]) for i in ids),'VEC3',bounds=True),
              NORMAL=accessor((gl(norm[i]-base_normals[i]) for i in ids),'VEC3'))
         for coords,norm in zip(shapes,shape_normals)]
prim=dict(attributes=attr,indices=accessor(indices,'SCALAR','H'),targets=targets)
nodes=[dict(name='Nikkori',mesh=0,skin=0)]
heads = [Vector(gl(b.head_local)) for b in bones]
for i,b in enumerate(bones):
    translation=heads[i]-(heads[bone_index[b.parent.name]] if b.parent else Vector((0,0,0)))
    node=dict(name=b.name.replace('.','_'),translation=list(translation))
    if b.children: node['children']=[1+bone_index[c.name] for c in b.children]
    nodes.append(node)
inverse=accessor(([v for col in Matrix.Translation(-p).transposed() for v in col] for p in heads),'MAT4')
C=Matrix.Rotation(-math.pi/2,4,'X')
Ci=C.inverted()
clips=[]
face_cues={}
face_node=body.data.materials[0].node_tree.nodes['値']
performances=['Normal','Drowsy','Surprise','Warm','Bathe','Bump','Notify','Read']
frames=list(range(0,48,3))+[47]
timeline=accessor(((f/scene.render.fps,) for f in frames),'SCALAR',bounds=True)
rest=[b.matrix_local.inverted() for b in bones]
for n,name in enumerate(performances):
    samples=[[] for b in bones]
    cues=[]
    for f in frames:
        scene.frame_set(1+n*48+f)
        cell=round(face_node.outputs[0].default_value)
        if not cues or cues[-1][1] != cell: cues.append([f/scene.render.fps,cell])
        globals_=[C @ arm.pose.bones[b.name].matrix @ rest[i] @ Ci @ Matrix.Translation(heads[i]) for i,b in enumerate(bones)]
        for i,b in enumerate(bones):
            mat=globals_[i] if not b.parent else globals_[bone_index[b.parent.name]].inverted()@globals_[i]
            loc,rot,scale=mat.decompose()
            if samples[i]:
                prev=samples[i][-1][1]
                if sum(a*b for a,b in zip(prev,(rot.x,rot.y,rot.z,rot.w)))<0: rot.negate()
            samples[i].append((tuple(loc),(rot.x,rot.y,rot.z,rot.w),tuple(scale)))
    channels=[]
    samplers=[]
    for i,sample in enumerate(samples):
        for k,path in enumerate(('translation','rotation','scale')):
            samplers.append(dict(input=timeline,output=accessor((s[k] for s in sample),'VEC4' if k==1 else 'VEC3')))
            channels.append(dict(sampler=len(samplers)-1,target=dict(node=i+1,path=path)))
    face_cues[name]=cues
    clips.append(dict(name=name,channels=channels,samplers=samplers))
nodes[0]['extras']=dict(faceCues=face_cues)
doc=dict(asset=dict(version='2.0',generator='Nikkori Mochi • Blender rig and eight gestures'),scene=0,
         scenes=[dict(nodes=[0,1])], nodes=nodes, skins=[dict(inverseBindMatrices=inverse,
         joints=list(range(1,len(bones)+1)),skeleton=1)], meshes=[dict(name='Nikkori Mochi',
         primitives=[prim],weights=[0,0,0],extras=dict(targetNames=['Original smile','Taffy pull','Landing fold']))],
         animations=clips,bufferViews=views,accessors=access,buffers=[dict(byteLength=len(buffer))])
meta=json.dumps(doc,separators=(',',':')).encode()
meta+=b' '*(-len(meta)%4)
buffer.extend(b'\0'*(-len(buffer)%4))
with (out/'nikkori.glb').open('wb') as f:
    f.write(struct.pack('<4sIII4s',b'glTF',2,28+len(meta)+len(buffer),len(meta),b'JSON'))
    f.write(meta)
    f.write(struct.pack('<I4s',len(buffer),b'BIN\0'))
    f.write(buffer)
print('Hero:',len(ids),'UV vertices,',len(indices)//3,'triangles,',len(clips),'performances')

textures={
 'texture_diffuse.png':('rice-color',1536,1536,90),
 'texture_normal.png':('rice-normal',1024,1024,91),
 '元の表情を除いた素肌':('bare-cheeks',522,344,94),
 '目と口 | 8表情・24セル':('expressions',1566,1548,94),
 '蒸し米 • 丸くつぶれた粒':('rice-grain',448,448,92),
 '瞳のふくらみ | 24セル':('eye-relief',1044,1032,90),
}
with tempfile.TemporaryDirectory() as tmp:
    for image,(name,w,h,q) in textures.items():
        src=Path(tmp)/(name+'.png')
        src.write_bytes(bpy.data.images[image].packed_file.data)
        subprocess.run(['cwebp','-quiet','-q',str(q),'-alpha_q','96','-resize',str(w),str(h),
                        str(src),'-o',str(out/(name+'.webp'))],check=True)
