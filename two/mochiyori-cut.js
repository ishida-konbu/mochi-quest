// Split the actual serving at the pastry's mid-plane. Both pieces keep the
// sculpted crust and decorations. The newly exposed crumb gets its own grain.
import * as T from './vendor/three.module.min.js';

const fillings={
  market:['#ead8ac','#b88340','bean'], spring:['#935f3c','#d9be87','paste'],
  terraces:['#8b514b','#ad7668','paste'], snow:['#e8dcc0','#b89c70','grain'],
  peach:['#bd8062','#e6b993','paste'], todaiji:['#ded2ba','#393628','sesame'],
  inari:['#d8c395','#a78b56','paste'], autumn:['#e5d4ac','#c39a51','bean']
};
const cuts=new Map();
function faceMaterial(region){
  const [crumb,grain,kind]=fillings[region]||['#e9ddc3','#b7a989','grain'];
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=192;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle=kind==='paste'?'#efe1c6':crumb;ctx.fillRect(0,0,256,192);
  ctx.save();if(kind==='paste'){
    ctx.beginPath();ctx.ellipse(127,98,95,64,-.06,0,2*Math.PI);ctx.clip();ctx.fillStyle=crumb;ctx.fillRect(0,0,256,192);
  }
  let seed=region.length+172;
  const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(let j=0;j<210;j++){
    const x=random()*256,y=random()*192, r=(kind==='bean'&&j<22?5.6:kind==='sesame'?2.3:1.6)*(.6+random());
    ctx.globalAlpha=.32+.53*random();ctx.fillStyle=j%5===0?'#fff3ce':grain;
    ctx.beginPath();ctx.ellipse(x,y,r*1.4,r*.72,random()*Math.PI,0,2*Math.PI);ctx.fill();
  }
  ctx.restore();
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  return new T.MeshStandardMaterial({map,roughness:.95,side:T.DoubleSide});
}
function hull(points) {
  const sorted=[...new Map(points.map(p=>[p[1].toFixed(5)+'/'+p[2].toFixed(5),p])).values()].sort((a,b)=>a[1]-b[1]||a[2]-b[2]);
  const cross=(a,b,c)=>(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]);
  const half=seq=>{const h=[];for(const p of seq){while(h.length>1&&cross(h.at(-2),h.at(-1),p)<=0)h.pop();h.push(p);}h.pop();return h;};
  return half(sorted).concat(half(sorted.reverse()));
}
function cutTemplate(source,region) {
  const root=new T.Group(), halves=[new T.Group(),new T.Group()];
  root.add(...halves);
  // Work in pastry coordinates, independent of its dish or the actor's hand.
  const copy=source.clone(true);copy.position.set(0,0,0);copy.rotation.set(0,0,0);copy.scale.setScalar(1);
  copy.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(copy), plane=(bounds.min.x+bounds.max.x)*.5;
  const border=[];
  copy.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const g=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    const attrs=['position','normal','uv','color'].filter(key=>g.attributes[key]).map(key=>[key,g.attributes[key]]);
    const pos=g.attributes.position;
    const at=i=>attrs.flatMap(([,a])=>Array.from({length:a.itemSize},(_,j)=>a.getComponent(i,j)));
    const buffers=[[],[]], order=g.index?.array;
    for(let i=0;i<(order?.length||pos.count);i+=3){
      const tri=[i,i+1,i+2].map(j=>at(order?order[j]:j));
      for(const [k,side] of [-1,1].entries()){
        const poly=[];
        for(let j=0;j<3;j++){
          const a=tri[j],b=tri[(j+1)%3],da=a[0]-plane,db=b[0]-plane;
          if(da*side>=0)poly.push(a);
          if(da*db<0){
            const t=da/(da-db),v=a.map((n,h)=>n+t*(b[h]-n));poly.push(v);
            if(k===0)border.push(v);
          }
        }
        for(let j=1;j<poly.length-1;j++)buffers[k].push(poly[0],poly[j],poly[j+1]);
      }
    }
    for(const [k,buf] of buffers.entries()){
      if(!buf.length)continue;
      const geom=new T.BufferGeometry();let offset=0;
      for(const [name,a] of attrs){
        const values=new Float32Array(buf.length*a.itemSize);
        buf.forEach((v,i)=>{for(let j=0;j<a.itemSize;j++)values[i*a.itemSize+j]=v[offset+j];});
        geom.setAttribute(name,new T.BufferAttribute(values,a.itemSize));offset+=a.itemSize;
      }
      const m=new T.Mesh(geom,mesh.material);m.castShadow=true;halves[k].add(m);
    }
    g.dispose();
  });
  const edge=hull(border);
  if(edge.length>=3){
    const verts=[],uv=[],s=bounds.getSize(new T.Vector3());
    for(let i=1;i<edge.length-1;i++)for(const p of [edge[0],edge[i],edge[i+1]]){
      verts.push(plane,p[1],p[2]);uv.push((p[2]-bounds.min.z)/s.z,(p[1]-bounds.min.y)/s.y);
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(verts,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
    const mat=faceMaterial(region);for(const h of halves)h.add(new T.Mesh(geometry,mat));
  }
  halves[0].name='手元に残る半分';halves[1].name='取り分けた半分';
  return root;
}
export function dividePastry(source,region){
  if(!cuts.has(region))cuts.set(region,cutTemplate(source,region));
  const split=cuts.get(region).clone(true);
  split.position.copy(source.position);split.quaternion.copy(source.quaternion);split.scale.copy(source.scale);
  source.parent.add(split);source.visible=false;return split;
}
