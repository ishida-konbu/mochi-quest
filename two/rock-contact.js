import { rockForm, roundedStone } from './rock-forms.js';

// Index the five original meshes once. A thousand differently scaled and
// rotated outcrops can share their triangles and this little plan-view grid.
const plans = new Map();
const gridSize = 10;
const bin = n => Math.min(gridSize-1,Math.max(0,Math.floor(n*gridSize)));

function meshPlan(form, sx, sy, sz, pitch, roll) {
  const key = pitch || roll ? [form,sx.toFixed(9),sy.toFixed(9),pitch,roll].join('/') : form;
  if (plans.has(key)) return plans.get(key);
  const mesh = form === 'round' ? roundedStone(43) : rockForm(form);
  if (pitch || roll) mesh.scale(sx,sy,sz).rotateZ(roll).rotateX(pitch);
  const plan=indexMesh(mesh);
  mesh.dispose();
  plans.set(key,plan);
  return plan;
}

function indexMesh(mesh) {
  mesh.computeBoundingBox();
  const {min,max} = mesh.boundingBox;
  const {position} = mesh.attributes;
  const vertices = Array.from({length: position.count}, (_,i) => ({
    x:position.getX(i), y:position.getY(i), z:position.getZ(i),
  }));
  const columns = Array.from({length:gridSize*gridSize},()=>[]);
  const column = x => bin((x-min.x)/(max.x-min.x));
  const row = z => bin((z-min.z)/(max.z-min.z));
  const index = mesh.index.array;
  for (let i=0;i<index.length;i+=3) {
    const a=vertices[index[i]], b=vertices[index[i+1]], c=vertices[index[i+2]];
    const bx=b.x-a.x, bz=b.z-a.z, cx=c.x-a.x, cz=c.z-a.z;
    const area=bx*cz-bz*cx;
    if (Math.abs(area)<1e-12) continue;
    const face={a,b,c,bx,bz,cx,cz,area,seen:0,
      dx:((b.y-a.y)*cz-(c.y-a.y)*bz)/area,
      dz:(bx*(c.y-a.y)-cx*(b.y-a.y))/area};
    for(let j=row(Math.min(a.z,b.z,c.z));j<=row(Math.max(a.z,b.z,c.z));j++)
      for(let k=column(Math.min(a.x,b.x,c.x));k<=column(Math.max(a.x,b.x,c.x));k++)
        columns[j*gridSize+k].push(face);
  }
  return {min,max,column,row,columns,query:0};
}

// Use the GLB's indexed stone itself, including its composed XYZ rotation.
// Cast only a bounding box at load time; build the triangle index when a
// footprint first reaches the stone. Offscreen coastlines incur no mesh work.
export function mountScannedContact(geometry, matrix, putSolid) {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  // InstancedMesh stores all sixteen components as floats on the GPU.
  const local=matrix.clone().fromArray(Float32Array.from(matrix.elements));
  const x=local.elements[12], y=local.elements[13], z=local.elements[14];
  local.setPosition(0,0,0);
  const box=geometry.boundingBox.clone().applyMatrix4(local);
  const item=putSolid(x,z,Math.max(-box.min.x,box.max.x),Math.max(-box.min.z,box.max.z),0,
    y+box.max.y,'rockMesh',true,0,y+box.min.y);
  item.stone={sx:1,sy:1,sz:1,y,box,x:NaN,z:NaN,radius:NaN,high:-Infinity,low:Infinity,
    makePlan() {
      const instance=geometry.clone().applyMatrix4(local);
      const plan=indexMesh(instance);
      instance.dispose();
      return plan;
    }};
}

export function mountRockContact(part,putSolid) {
  const {x,y,z,yaw=0,form,pitch=0,roll=0}=part;
  let {sx,sy,sz}=part;
  // Factor out the uniform scale before tilting. The hundreds of riverbank
  // pebbles share a small set of inclinations at many different sizes.
  const plan=meshPlan(form,sx/sz,sy/sz,1,pitch,roll);
  if (pitch || roll) sx=sy=sz;
  const item=putSolid(x,z,sx*Math.max(-plan.min.x,plan.max.x),sz*Math.max(-plan.min.z,plan.max.z),
    yaw,y+sy*plan.max.y,'rockMesh',true,0,y+sy*plan.min.y);
  item.stone={sx,sy,sz,y,plan,x:NaN,z:NaN,radius:NaN,high:-Infinity,low:Infinity};
}

function inside(face,x,z) {
  const dx=x-face.a.x, dz=z-face.a.z;
  const s=(dx*face.cz-dz*face.cx)/face.area, t=(face.bx*dz-face.bz*dx)/face.area;
  return s>=-1e-8 && t>=-1e-8 && s+t<=1+1e-8;
}

// A linear face clipped by a circle reaches its highest and lowest points
// on a triangle edge or at the two extrema of the circle along its grade.
function edgeRange(a,b,u,v,radius,stone) {
  const ax=(a.x-u)*stone.sx, az=(a.z-v)*stone.sz;
  const dx=(b.x-a.x)*stone.sx, dz=(b.z-a.z)*stone.sz;
  const length=dx*dx+dz*dz;
  if (length<1e-18) return;
  const cross=ax*dz-az*dx;
  const disc=radius*radius*length-cross*cross;
  if (disc<0) return;
  const nearest=-(ax*dx+az*dz)/length, extent=Math.sqrt(disc)/length;
  const start=Math.max(0,nearest-extent), end=Math.min(1,nearest+extent);
  if(start>end) return;
  const h0=a.y+(b.y-a.y)*start, h1=a.y+(b.y-a.y)*end;
  stone.high=Math.max(stone.high,h0,h1);
  stone.low=Math.min(stone.low,h0,h1);
}

export function rockRange(stone,x,z,radius) {
  if (stone.x===x && stone.z===z && stone.radius===radius) return stone;
  stone.x=x;stone.z=z;stone.radius=radius;
  stone.high=-Infinity;stone.low=Infinity;
  if (!stone.plan) {
    const {min,max}=stone.box;
    if(x+radius<min.x || x-radius>max.x || z+radius<min.z || z-radius>max.z) return stone;
    stone.plan=stone.makePlan();
    delete stone.makePlan;
  }
  const {plan,sx,sz}=stone;
  const u=x/sx, v=z/sz, ru=radius/sx, rv=radius/sz;
  if (u+ru<plan.min.x || u-ru>plan.max.x || v+rv<plan.min.z || v-rv>plan.max.z) return stone;
  if (radius && Math.max(x-sx*plan.min.x,sx*plan.max.x-x)**2 +
      Math.max(z-sz*plan.min.z,sz*plan.max.z-z)**2 <= radius*radius) {
    stone.low=stone.y+plan.min.y*stone.sy;
    stone.high=stone.y+plan.max.y*stone.sy;
    return stone;
  }
  const query=++plan.query;
  const lastRow=plan.row(v+rv), lastColumn=plan.column(u+ru);
  for(let row=plan.row(v-rv);row<=lastRow;row++) {
    for(let column=plan.column(u-ru);column<=lastColumn;column++) {
      for(const face of plan.columns[row*gridSize+column]) {
        if(face.seen===query) continue;
        face.seen=query;
        const h=face.a.y+face.dx*(u-face.a.x)+face.dz*(v-face.a.z);
        if(inside(face,u,v)){
          stone.high=Math.max(stone.high,h);
          stone.low=Math.min(stone.low,h);
        }
        if(!radius) continue;
        const gx=face.dx/sx,gz=face.dz/sz,gradient=Math.hypot(gx,gz);
        if(gradient>1e-12){
          const du=ru*gx/gradient, dv=rv*gz/gradient;
          if(inside(face,u+du,v+dv)) stone.high=Math.max(stone.high,h+radius*gradient);
          if(inside(face,u-du,v-dv)) stone.low=Math.min(stone.low,h-radius*gradient);
        }
        edgeRange(face.a,face.b,u,v,radius,stone);
        edgeRange(face.b,face.c,u,v,radius,stone);
        edgeRange(face.c,face.a,u,v,radius,stone);
      }
    }
  }
  stone.high=stone.y+stone.high*stone.sy;
  stone.low=stone.y+stone.low*stone.sy;
  return stone;
}
