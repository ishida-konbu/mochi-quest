// Object studies for the seventeen settlements. Each finished still life shares
// its materials and geometry with the object examined close up in the journal.
import * as T from './vendor/three.module.min.js';
import { InkForm, surface } from './ryugu-ink.js';
import { brushWash, surfaceGrain } from './scroll-sculpt.js';
import { residentRobeSurface } from './resident-art.js';
import { tablePlan, hullStrake, waveBracket } from './story-table-plan.js';
import { regionalVessel, dressRegionalTable } from './story-tableware.js';

const tau = 2 * Math.PI, { sin, cos, abs, sqrt } = Math;
const tiles = {wood:0, rice:1, paper:2, clay:3, cloth:4, leaf:5, endGrain:6, iron:7};
const raw = () => new InkForm(tiles, 4, 2);
const straw = '#d1b781', dark = '#584c3c', edge = '#897653';
const white = '#faf2db', ink = '#544e40';
const neutral = [0, 0, 0], one = [1, 1, 1];
const templates = new Map();
let pigment;
const performParts={
  '三日月傷の蓋':'open','潮で白んだ蓋':'open','繕い目のある右袂':'open','開いた控え':'open',
  '合わせ餅':'turn','割餅右':'divide','同じ袋の米・右':'divide','水鉢の合い蓋':'open','蒸し箱の上段':'open',
  '盆にのせた花餅':'divide','漆の内筒':'open'
};
function finish(form, name) {
  if (!pigment) {
    const url = new URL('./assets/world/mochiyori-materials.webp', import.meta.url);
    const map = new T.TextureLoader().load(url.href);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 4;
    pigment = brushWash(new T.MeshStandardMaterial({map, vertexColors:true, side:T.DoubleSide, roughness:.94}), .30);
  }
  const mesh = new T.Mesh(form.geometry(), pigment);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.name = name;
  const motion=performParts[name];if(motion)mesh.userData.performPart=motion;
  return mesh;
}
function collect(parent, name, draw, x=0, y=0, z=0) {
  const f=raw();
  draw(f);
  const mesh=finish(f,name);
  mesh.position.set(x,y,z);
  parent.add(mesh);
  return mesh;
}
function grid(f, columns, rows, point, tint, tile='paper') {
  const p=[],uv=[],ix=[];
  for (let j=0;j<=rows;j++) for(let i=0;i<=columns;i++) {
    p.push(...point(i/columns,j/rows));
    uv.push(i/columns,j/rows);
    const k=j*(columns+1)+i;
    if(i<columns && j<rows) ix.push(k,k+columns+1,k+1,k+1,k+columns+1,k+columns+2);
  }
  f.draw(surface(p,ix,uv),neutral,one,tint,neutral,tile);
}
function stroke(f, pts, width, col=dark, sides=5, steps) {
  f.stroke(pts,width,col,'paper',sides,steps ?? Math.max(4,pts.length*2));
}
// A board is sawn along its longest dimension. On a cut end the growth rings
// cross the board, even when the worker turns the piece upright in their hand.
function timberGrain(form,geometry,span,middle,origin) {
  const position=geometry.attributes.position,normal=geometry.attributes.normal;
  const first=form.uv.length-2*position.count;
  const long=span.indexOf(Math.max(...span));
  const phase=Math.abs(Math.sin(origin[0]*19+origin[1]*41+origin[2]*67));
  const cross=[0,1,2].filter(axis=>axis!==long).sort((a,b)=>span[b]-span[a]);
  const sampleSpan=span.map(length=>Math.min(.9,length/.44));
  for(let i=0;i<position.count;i++){
    const point=[position.getX(i),position.getY(i),position.getZ(i)];
    const face=[Math.abs(normal.getX(i)),Math.abs(normal.getY(i)),Math.abs(normal.getZ(i))];
    const cut=face[long]>.84, width=face[cross[0]]>face[cross[1]]?cross[1]:cross[0];
    const along=axis=>T.MathUtils.clamp((point[axis]-middle[axis])/span[axis],-.5,.5);
    const u=cut?.5+along(cross[0])*sampleSpan[cross[0]]:.41+.12*phase+along(long)*.80;
    const transverse=cut?cross[1]:width;
    const v=.34+.29*phase+along(transverse)*Math.min(.64,sampleSpan[transverse]);
    const tile=cut?tiles.endGrain:tiles.wood;
    form.uv[first+i*2]=(tile%4+.015+u*.97)/4;
    form.uv[first+i*2+1]=(1-Math.floor(tile/4)+.014+v*.972)/2;
  }
}
function block(f,x,y,z,w,h,d,tint=straw, tile='wood', bevel=.013) {
  // A plane-cut timber with worn, chamfered arrises and grain running along its length.
  const c=Math.min(bevel,h*.19,d*.14), shape=new T.Shape();
  shape.moveTo(-w/2+c,-d/2+c);shape.lineTo(w/2-c,-d/2+c);
  shape.lineTo(w/2-c,d/2-c);shape.lineTo(-w/2+c,d/2-c);shape.closePath();
  const g=new T.ExtrudeGeometry(shape,{depth:h-2*c,bevelEnabled:true,bevelThickness:c,bevelSize:c,bevelSegments:1,steps:1});
  const uv=g.attributes.uv,p=g.attributes.position,n=g.attributes.normal;
  for(let k=0;k<p.count;k++){
    const a=abs(n.getX(k)),b=abs(n.getY(k)),top=abs(n.getZ(k))>.5;
    const u=top||b>a?p.getX(k)/w+.5:p.getY(k)/d+.5;
    const v=top?p.getY(k)/d+.5:(p.getZ(k)+c)/h;
    uv.setXY(k,T.MathUtils.clamp(u,0,1),T.MathUtils.clamp(v,0,1));
  }
  f.draw(g,[x,y-h/2+c,z],one,tint,[-Math.PI/2,0,0],tile);
  if(tile==='wood')timberGrain(f,g,[w,d,h],[0,0,h/2-c],[x,y,z]);
  g.dispose();
}
// Sliding furniture uses the same plane-cut corners and longitudinal wood
// grain as a local worktop. Workshop paint is shared with the still life.
export function drawerTimbers(parent,name,boards,plainWood){
  const form=raw();
  for(const [x,y,z,w,h,d,tint] of boards)block(form,x,y,z,w,h,d,tint,'wood',Math.min(.009,w*.18));
  const mesh=new T.Mesh(form.geometry(),pigment || plainWood);
  mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
}
function turned(f,x,y,z,profile,tint,tile='wood',sides=40) {
  const g=new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(Math.max(r,.0003),h)),sides);
  f.draw(g,[x,y,z],one,tint,neutral,tile);g.dispose();
}
function ring(f,x,y,z,r,w,col, rz=r) {
  const g=new T.TorusGeometry(1,w/r,5,40);
  f.draw(g,[x,y,z],[r,rz,r],col,[Math.PI/2,0,0],'wood');g.dispose();
}
function leaf(f,x,y,z,w,d,yaw=0,imprint=false){
  function point(t,s) {
    const dx=(t-.5)*w, breadth=(sin(Math.PI*t)**.78)*d;
    const dz=s*breadth, lift=imprint?0:.024*s*s*sin(Math.PI*t)+.024*(2*t-1)**4;
    return [x+dx*cos(yaw)-dz*sin(yaw),y+lift+.006*sin(Math.PI*t),z+dx*sin(yaw)+dz*cos(yaw)];
  }
  grid(f,16,4,(u,v)=>point(u,v*2-1),imprint?'#cbb584':'#a3ad7d',imprint?'wood':'leaf');
  const vein=(a,b,w)=>stroke(f,[a,b].map(p=>[p[0],p[1]+.003,p[2]]),[w,.0011],imprint?'#a48e69':'#758458',4,3);
  vein(point(.025,0),point(.97,0),.004);
  for(const side of [-1,1])for(let i=0;i<4;i++){
    const t=.12+i*.155;vein(point(t,0),point(t+.145,side*.85),.0029);
  }
}
function blossom(f,x,y,z,s=1) {
  for(let i=0;i<5;i++) {
    const a=i*tau/5;
    const offset=[.001,.011,-.004,.007,.015][i];
    grid(f,14,7,(u,v)=>{
      const l=.055*s*u,b=(sin(Math.PI*u)**.76)*.018*s*(v*2-1);
      const curl=.016*sin(Math.PI*u)-.005*cos(2*Math.PI*v)*u+.011*(2*v-1)**2;
      return [x+l*sin(a)+b*cos(a),y+s*(.004+curl+offset*u),z+l*cos(a)-b*sin(a)];
    },i%2?'#bb787b':'#d99b95','cloth');
  }
  stroke(f,[[x+.067*s,y+.006*s,z-.045*s],[x+.037*s,y+.005*s,z-.026*s],[x,y+.008*s,z]],[.002*s,.003*s,.001*s],'#8f9068',4);
  f.oval([x,y+.013*s,z],[.010*s,.006*s,.010*s],'#d1ab78',neutral,'rice');
}
const cakeNames=['','花筏餅','笹結び餅','炒り豆の角餅','湯蒸し味噌餅','穂の花餅','浜塩餅','凍みくるみ餅','栗の焼き餅','月見あわ餅','紅白の朝焼け餅','花の重ね餅','桃しずく餅','潮葛の真珠餅','蓮のちぎり餅','狐の揚げ餅','昆布巻き餅','胡麻の平焼き餅'];
function dough(f,rx,ry,rz,tint,shift=0,shape='oval'){
  // Flatten the base against its leaf. Superelliptic sections give cut and
  // hand-rounded cakes different corners while preserving the soft shoulders.
  grid(f,48,20,(u,v)=>{
    const a=tau*u, h=Math.PI*v, round=shape==='square'?.30:.94;
    const r=sin(h)**.80 * (1+.019*sin(3*a+shift)+.013*sin(7*a-.5));
    // Rounded equilateral outline from three clipped half-planes.
    const side=((a+.52+tau)% (tau/3))-Math.PI/3;
    const turn=shape==='triangle'? Math.min(.98,.59/cos(side)):1;
    const x=rx*Math.sign(cos(a))*abs(cos(a))**round*r*turn;
    const z=rz*Math.sign(sin(a))*abs(sin(a))**round*r*turn;
    const y=ry*(1+Math.sign(-cos(h))*abs(cos(h))**.64);
    return [x,y+.004*sin(4*a)*r,z];
  },tint,f.doughTile||'rice');
}
function grain(f,n,rx,rz,h,col,kind='seed'){
  for(let i=0;i<n;i++){
    const a=i*2.39996,r=.89*sqrt((i+.5)/n),x=rx*r*cos(a),z=rz*r*sin(a);
    const y=h*(1+Math.pow(Math.max(0,1-r**2.5),.32))+.002;
    const s=kind==='bean'?.022:kind==='nut'?.025:.0075;
    f.oval([x,y,z],[s,s*(kind==='seed'?.24:.47),s*(kind==='nut'?.74:.61)],col,[0,a,.1],'rice');
  }
}
function wrappedRice(f,length,depth,height,band,colour,base){
  // One rice surface drives the kelp and nori; their edges hug the actual
  // softened corners instead of intersecting a second ellipsoid.
  function skin(u,v,offset=0){
    const a=tau*v,r=Math.sin(Math.PI*u)**.16;
    const round=q=>Math.sign(q)*Math.abs(q)**.61;
    return [(u-.5)*length,height+(height+offset)*r*round(cos(a)),(depth+offset)*r*round(sin(a))];
  }
  grid(f,40,32,(u,v)=>skin(u,v),base,f.doughTile||'rice');
  // Unroll each half of the strip from its free end. At the peeling edge
  // the loose length extends along the tangent to the rounded rice surface.
  f.unfold=(x,y,z,v,open)=>{
    const u=.5+x/length,side=v<.5?1:-1,angle=Math.PI*Math.abs(2*v-1);
    const hinge=Math.PI*(1-open);
    if(angle<=hinge)return [0,0,0];
    const point=a=>skin(u,.5-side*a/tau,.0028);
    const edge=point(hinge), before=point(Math.max(0,hinge-.005)),after=point(hinge+.005);
    const dy=after[1]-before[1],dz=after[2]-before[2],tangent=Math.hypot(dy,dz);
    let last=edge,arc=0;
    for(let i=1;i<=8;i++){
      const p=point(hinge+(angle-hinge)*i/8);
      arc+=Math.hypot(p[1]-last[1],p[2]-last[2]);last=p;
    }
    const across=edge[2]+dz/tangent*arc;
    const rim=Math.hypot(x/.343,across/.226);
    const drape=.005+.066*T.MathUtils.smoothstep(rim,.55,.99)-.025*T.MathUtils.smoothstep(rim,1.04,1.36);
    return [0,Math.max(edge[1]+dy/tangent*arc,open*drape)-y,across-z];
  };
  grid(f,24,40,(u,v)=>skin(.5+(u-.5)*band+.009*sin(v*tau*4),v,.0028),colour,f.wrapTile||'leaf');
  f.unfold=null;
}
const ingredientTiles={
  steamed:0,sasa:1,beanDough:2,steamedOval:3,halfPounded:4,roasted:5,walnut:6,chestnut:7,
  millet:8,blush:9,matcha:10,peachJam:11,kuzu:12,sesameDough:13,fried:14,kombu:15,
};
const ingredientByScene=[null,'steamed','halfPounded','beanDough','steamedOval','halfPounded','roasted','walnut','chestnut','millet','steamed','steamed','peachJam','kuzu','sesameDough','fried','steamed','roasted'];
let ingredients;
function modelFood(parent,name,scene,draw){
  const f=raw(), rootDraw=f.draw.bind(f),indices=[[],[]];
  const poses=[6,16].includes(scene)?[1,.25,.5,.75]:scene===2?[1]:[];
  const movement=poses.map(()=>[]);
  let articulated=false;
  f.doughTile=ingredientByScene[scene];
  f.draw=function(geometry,pos,scale,col,rotation,tile,uvMode){
    const ingredient=Object.hasOwn(ingredientTiles,tile);
    this.columns=4;this.rows=ingredient?4:2;this.patches=ingredient?ingredientTiles:tiles;
    const start=this.ix.length,first=this.p.length;rootDraw(geometry,pos,scale,col,rotation,tile,uvMode);
    if(poses.length){
      const uv=geometry.attributes.uv;
      for(let j=first,i=0;j<this.p.length;j+=3,i++){
        const x=this.p[j],y=this.p[j+1],z=this.p[j+2];
        poses.forEach((open,k)=>{
          const d=this.unfold?.(x,y,z,uv.getY(i),open);
          if(d)movement[k].push(x+d[0],y+d[1],z+d[2]);
          else movement[k].push(x,y,z);
        });
      }
      if(this.unfold)articulated=true;
    }
    const target=indices[ingredient?1:0];for(let i=start;i<this.ix.length;i++)target.push(this.ix[i]);
  };
  draw(f);
  const mesh=finish(f,name), geometry=mesh.geometry;
  if(articulated){
    geometry.morphAttributes.position=movement.map(points=>new T.Float32BufferAttribute(points,3));
    geometry.morphAttributes.normal=geometry.morphAttributes.position.map(position=>{
      const shape=new T.BufferGeometry();
      shape.setAttribute('position',position);shape.setIndex(geometry.index);shape.computeVertexNormals();
      return shape.attributes.normal;
    });
    mesh.updateMorphTargets();mesh.userData.foodMotion=scene===2?'open':'tie';
  }
  if(!ingredients){
    const map=new T.TextureLoader().load(new URL('./assets/world/mochiyori-ingredients.webp',import.meta.url).href);
    map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
    ingredients=brushWash(new T.MeshPhysicalMaterial({map,vertexColors:true,side:T.DoubleSide,roughness:.58,clearcoat:.10,clearcoatRoughness:.52}),.065);
  }
  // A sectioned pastry keeps both its textured crumb and its separately inked seeds.
  // They share vertex buffers, with an independent triangle list for each material.
  if(indices[1].length){
    if(indices[0].length){
      const skin=new T.BufferGeometry();
      for(const [key,attribute] of Object.entries(geometry.attributes))skin.setAttribute(key,attribute);
      skin.morphTargetsRelative=geometry.morphTargetsRelative;skin.morphAttributes=geometry.morphAttributes;
      skin.setIndex(indices[0]);const garnish=new T.Mesh(skin,mesh.material);garnish.userData.foodMotion=mesh.userData.foodMotion;
      garnish.name=name+'の仕上げ';garnish.castShadow=garnish.receiveShadow=true;parent.add(garnish);
    }
    geometry.setIndex(indices[1]);mesh.material=ingredients;
  }
  parent.add(mesh);return mesh;
}
function steamedLayer(f,index,col,tile){
  // Soft cut faces round over the rim, with a different shallow wave at each pressing.
  const low=index*.032,hh=.033,rx=.151-index*.001,rz=.109-index*.0007;
  const contour=a=>{const c=cos(a),s=sin(a);return [rx*Math.sign(c)*abs(c)**.23,rz*Math.sign(s)*abs(s)**.23];};
  const edge=(a)=>.0019*sin(3*a+index*.31)+.0009*cos(7*a-index*.16);
  grid(f,72,8,(u,v)=>{
    const a=tau*u,[x,z]=contour(a),t=abs(2*v-1),k=1-.02*t*t;
    return [x*k,low+.003+hh*v+edge(a),z*k];
  },col,tile);
  grid(f,72,12,(u,v)=>{const a=tau*u,[x,z]=contour(a);return [x*v*.981,low+hh+.003+.0012*(1-v*v)+edge(a)*v,z*v*.981];},col,tile);
}
function tuckedPeach(f){
  // The seam is formed by the dough itself; the hairline of pink lies in its furrow.
  grid(f,64,30,(u,v)=>{
    const a=tau*u,h=Math.PI*v,c=cos(a),s=sin(a),r=sin(h)**.86;
    const fork=.010*Math.exp(-22*c*c)*Math.max(0,-cos(h))**1.3;
    return [.149*r*c*(1+.028*s),.100*(1-Math.sign(cos(h))*abs(cos(h))**.78)-fork,.131*r*s];
  },'#fff6e4','peachJam');
  stroke(f,[[.008,.170,-.082],[.002,.188,-.031],[-.002,.190,.016],[-.011,.180,.073],[-.008,.160,.095]],[.0005,.0011,.0021,.0019,.0003],'#cc8c79');
}
function halfPounded(f){
  // Pressure compresses the lower grains. The loose long kernels turn tangentially around the top.
  dough(f,.127,.080,.111,'#fff7e1');
  for(let i=0;i<82;i++){
    const a=i*2.39996,r=.935*sqrt((i+.5)/82),y=.08*(1+(1-r**2.5)**.32);
    f.oval([.127*r*cos(a),y-.002,.111*r*sin(a)],[.012,.0055,.0068],i%4?'#fff6db':'#e9d8ad',[.14*sin(a),a+.37*cos(i*2.4),.13*cos(a)],'rice');
  }
}
function furledBamboo(f){
  for(const flip of [-1,1]){
    const surface=(u,v,lift=0)=>{
      const r=sin(Math.PI*Math.max(.0001,Math.min(.9999,u)))**.62;
      const a=-1.12+v*3.76+.14*(2*u-1);
      return [flip*((u-.50)*.48+.031),.059+(.061+lift)*r*cos(a),flip*(.086+lift)*r*sin(a)];
    };
    // Each leaf opens onto its own half of the dish. The veins retain the
    // same spacing as the paper-thin blade instead of folding onto themselves.
    f.unfold=(x,y,z)=>{
      const a=Math.atan2(flip*z/.086,(y-.059)/.061);
      const u=T.MathUtils.clamp(.5+(flip*x-.031)/.48,0,1);
      const breadth=sin(Math.PI*u)**.62;
      const across=flip*(.043+(a+1.12)*.066)*breadth;
      const rim=Math.hypot(x/.32,across/.18);
      const height=.008+.053*T.MathUtils.smoothstep(rim,.52,1)-.021*T.MathUtils.smoothstep(rim,1.05,1.6);
      return [0,height-y,across-z];
    };
    grid(f,36,16,(u,v)=>surface(u,v),flip>0?'#d6df9e':'#c3d18f','sasa');
    for(let j=0;j<6;j++){
      const v=(j+.6)/6.6,pts=Array.from({length:9},(_,i)=>surface(.035+i*.116,v,.0018));
      stroke(f,pts,iColourRadius(j),j===3?'#8b995b':'#adb578',4,10);
    }
  }
  // Lay the loosened tie along the outer blade. Its loop stays visible on
  // the dish while the unwrapped cake is taken away.
  f.unfold=(x,y,z)=>[.12,.012+.12*(y-.059)-y,-.135+.76*z-z];
  function iColourRadius(i){return i===3?.0021:.00085;}
  for(const x of [-.028,-.013])stroke(f,Array.from({length:23},(_,i)=>[x,.059+.064*cos(tau*i/22),.089*sin(tau*i/22)]),.0052,straw,5,25);
  stroke(f,[[-.022,.123,0],[-.065,.164,.028],[-.091,.151,.040],[-.025,.125,.009],[.008,.147,-.043],[.042,.125,-.073]],[.004,.006,.004,.006,.005,.001],straw);
}
function food(parent,scene){
  const skin=modelFood(parent,cakeNames[scene],scene,f=>{
    switch(scene){
      case 1:
        dough(f,.170,.047,.120,'#fff9ef');grain(f,12,.14,.094,.047,'#e7d7be');blossom(f,.018,.095,.006,1.09);break;
      case 2: dough(f,.202,.055,.076,'#b4bd7e');break;
      case 3:
        f.doughTile='steamed';dough(f,.163,.069,.114,'#fff8e8',1,'square');
        for(let j=0;j<9;j++){
          const x=.139*sin(13.7*j+.7),z=.086*cos(3.9*j+.9),r=Math.max(abs(x)/.163,abs(z)/.114);
          const y=.069*(1+(1-r**2.5)**.32);
          f.oval([x,y-.002,z],[.015,.007,.012],j%3?'#b2844c':'#d6b780',[.14,j*.87,.18],'rice');
        }
        for(let j=0;j<6;j++){const x=-.114+j*.044,y=.032+.022*((j*7)%4);f.oval([x,y,.113],[.016,.010,.0035],j%2?'#ad773b':'#d9b16e',[0,0,j*.59],'rice');}
        break;
      case 4:
        dough(f,.183,.043,.114,'#fff6dc');break;
      case 5: halfPounded(f);break;
      case 6: f.wrapTile='kombu';wrappedRice(f,.354,.120,.044,.29,'#9ca481','#ffffe2');break;
      case 7:
        f.doughTile='steamedOval';dough(f,.145,.075,.12,'#e2d2b5');
        grid(f,60,15,(u,v)=>{const a=tau*u,drip=.14*(.5+.5*cos(3*a-.5))**8+.055*(.5+.5*cos(7*a+.7))**10,r=Math.min(.998,v*(.78+.095*sin(3*a)+drip));return [.147*r*cos(a),.075*(1+(1-r**2.5)**.32)+.003,.121*r*sin(a)];},'#f6d4a1','walnut');
        grain(f,9,.114,.09,.075,'#a7774b','nut');break;
      case 8: dough(f,.172,.049,.128,'#f5dfa7');
        grid(f,54,16,(u,v)=>{
          const a=tau*u,r=v*(.77+.07*sin(5*a+.6)+.05*cos(8*a));
          return [.172*r*cos(a),.049*(1-(1-r**2.5)**.32)-.0009,.128*r*sin(a)];
        },'#b98855','roasted');
        for(let j=0;j<15;j++){
          const a=j*2.4,r=.89*sqrt((j+.5)/15),y=.049*(1+(1-r**2.5)**.32)-.001;
          f.oval([.172*r*cos(a),y,.128*r*sin(a)],[.012,.005,.009],j%3?'#b78c4b':'#e3c17a',[0,a,0],'rice');
        }
        break;
      case 9: dough(f,.126,.090,.118,'#fff0b1');grain(f,37,.12,.107,.090,'#c9a259');break;
      case 10:
        for(const sign of [-1,1])grid(f,62,24,(u,v)=>{
          const a=.27+tau*u*.85+(sign<0?Math.PI:0),q=tau*v,cap=Math.max(0,sin(Math.PI*u))**.23;
          return [(u-.5)*.54,.063+(.030*sin(a)+.036*cos(q))*cap,(.034*cos(a)+.039*sin(q))*cap];
        },sign===1?'#f4b1b1':'#fff8e0',sign===1?'blush':'steamed');
        break;
      case 11:
        for(let i=0;i<5;i++)steamedLayer(f,i,[white,'#bdcd9c','#f7e9c8','#b2c994',white][i],i%2?'matcha':'steamed');
        break;
      case 12:tuckedPeach(f);break;
      case 13: dough(f,.142,.100,.135,'#d9eff9');break;
      case 14: {
        dough(f,.172,.084,.159,'#e6e2d2');grain(f,48,.159,.149,.084,'#726858');
        for(let i=0;i<8;i++){const a=tau*i/8;stroke(f,[[.016*cos(a),.168,.016*sin(a)],[.086*cos(a+.05),.163,.082*sin(a+.05)],[.148*cos(a),.145,.133*sin(a)]],[.0009,.0045,.0012],'#8c8170');}
        break;
      }
      case 15: dough(f,.217,.049,.179,'#ffdf9d',1,'triangle');grain(f,16,.090,.077,.049,'#b08a56');break;
      case 16: f.wrapTile='kombu';wrappedRice(f,.43,.080,.054,.73,'#adad7b','#fffae3');break;
      case 17:
        dough(f,.174,.038,.151,'#efdda6');
        grain(f,93,.169,.148,.038,'#efe1ba');
        for(let i=0;i<83;i++){
          const a=i*2.4,r=.87*sqrt((i+.5)/83),y=.038*(1-(1-r**2.5)**.32);
          f.oval([.171*r*cos(a),y-.001,.149*r*sin(a)],[.008,.002,.005],'#594f41',[0,a,0],'rice');
        }
        break;
    }
  });
  if(scene===2){
    const wrapper=new T.Group();wrapper.name='笹結び餅の開き笹';
    modelFood(wrapper,'笹の葉と竹皮の留め',scene,furledBamboo);
    parent.add(wrapper);
  }
  if(scene===13){
    // A second pale core remains visible through the blue kuzu skin, especially at its lip.
    if(!pearlSkin)pearlSkin=new T.MeshPhysicalMaterial({map:ingredients.map,vertexColors:true,
      color:'#cfecff',roughness:.23,clearcoat:.35,clearcoatRoughness:.24,transparent:true,opacity:.59,depthWrite:false});
    skin.material=pearlSkin;skin.renderOrder=1;
    collect(parent,'葛の薄皮の内側',f=>dough(f,.109,.077,.102,'#eef0df'),0,.023,0);
  }
}
let pearlSkin;
export function poseStoryFood(object,gesture,progress){
  const t=T.MathUtils.smoothstep(progress,0,1);
  object.traverse(part=>{
    if(!part.userData.foodMotion||!part.morphTargetInfluences)return;
    const action=part.userData.foodMotion;
    const weights=part.morphTargetInfluences;
    if(gesture==='rest')weights.fill(0);
    else if(action==='open' && gesture==='open')weights[0]=t;
    else if(action==='tie' && (gesture==='lift' || gesture==='tie')){
      const phase=(gesture==='lift'?t:1-t)*weights.length;
      weights.fill(0);
      const lower=Math.floor(phase),mix=phase-lower;
      if(lower>0)weights[lower%weights.length]=1-mix;
      if(mix>0)weights[(lower+1)%weights.length]=mix;
    }
  });
}

function cake(scene){
  const k='food-'+scene;
  if(!templates.has(k)){const g=new T.Group();g.name='取り分ける餅';g.userData.performPart='divide lift turn open tie';food(g,scene);templates.set(k,g);}
  return templates.get(k).clone();
}
function add(parent,object,x=0,y=0,z=0,yaw=0,size=1){
  object.position.set(x,y,z);object.rotation.y=yaw;object.scale.setScalar(size);parent.add(object);return object;
}
function dish(f,r=.36,colour='#dad7c0'){
  turned(f,0,0,0,[[.001,.012],[r*.37,.012],[r*.39,.004],[r*.47,.004],[r*.49,.031],[r*.76,.047],[r,.088],[r*.995,.104],[r*.96,.109],[r*.73,.083],[r*.47,.055],[.001,.051]],colour,'rice');
  ring(f,0,.094,0,r*.957,.004,'#8b9990');
}
function basketWeave(f,rx,rz,h){
  // The split-bamboo laths alternate in front of and behind each upright.
  const uprights=40,rows=7;
  function side(a,t,offset=0){
    const scale=.91+.09*t;
    return [sin(a)*(rx*scale+offset),.022+t*h,cos(a)*(rz*scale+offset)];
  }
  for(let j=0;j<rows;j++){
    grid(f,96,1,(u,v)=>side(u*tau,(j+v*.88)/rows,.004*cos(u*tau*uprights/2+j*Math.PI)),j%3?'#c9ab77':'#ddbf88','wood');
  }
  for(let i=0;i<uprights;i++){
    const a=tau*i/uprights;
    grid(f,2,rows*2,(u,v)=>side(a+(u-.5)*.028,v,.006*cos(v*rows*Math.PI+i*Math.PI)),i%4?'#cab386':'#b29b70','wood');
  }
  for(const y of [.018,h+.028])ring(f,0,y,0,y>.02?rx:rx*.91,.010,edge,y>.02?rz:rz*.91);
  for(let i=0;i<24;i++){
    const a=i*tau/24;stroke(f,[side(a-.012,.97,.008),side(a,1.038,.005),side(a+.014,1.006,-.013)],[.003,.005,.002],straw);
  }
}
function fusedCake(parent) {
  const body=new T.Group();
  body.name='合わせ餅';parent.add(body);
  const breadth=c=>.88+.22*Math.sin(Math.PI*Math.abs(c)*.72);
  const height=(x,p)=>.056*(1-cos(p))+Math.exp(-(x*x)/.00015)*(.0059*cos(p/2)**4-.008*sin(p/2)**3);
  function under(x,z){
    const dx=x/.25;
    let r=Math.hypot(dx,z/.124);
    for(let i=0;i<7 && r>.00001;i++)r=Math.hypot(dx,z/(.124*breadth(dx/r)));
    const p=Math.asin(Math.min(.999,r)**(1/.72));
    return [x,height(x,p)-.0018,z];
  }
  for(const s of [-1,1]){
    collect(body,s===1?'継ぎ目から離す餅':'敷き葉に残す餅',f=>{
      grid(f,40,30,(u,v)=>{
        const a=(s<0?.5:-.5)*Math.PI+u*Math.PI,p=v*Math.PI,r=sin(p)**.72,x=.25*cos(a)*r;
        return [x,height(x,p),.124*sin(a)*r*breadth(cos(a))];
      },white,'rice');
      // The halves share a seam before inspection. Each torn face keeps its
      // own inward bow and rice grain when the two leaf impressions part.
      grid(f,16,30,(u,v)=>{
        const p=v*Math.PI,r=sin(p)**.72,z=(u-.5)*.248*r*breadth(0);
        const hollow=.0028*sin(Math.PI*u)*sin(p)*(1+.2*cos(27*u+19*v));
        return [s*hollow,height(0,p),-s*z];
      },'#f2e5cd','rice');
      blossom(f,s*.108,.111,s*.011,.86);
      // The tips point away from each other. Both sets of secondary veins
      // branch towards their own tip, preserving the handed impression.
      const mark=(t,v=0)=>under(s*(.111+t),t*(s<0?.34:-.47)+v);
      stroke(f,[-.085,-.047,0,.047,.084].map(t=>mark(t)),[.001,.0027,.0035,.0024,.0007],'#9e896a');
      for(let j=-2;j<=2;j++)for(const side of [-1,1]){
        const t=j*.024,span=.046-.005*Math.abs(j);
        stroke(f,[mark(t),mark(t+.011,side*.013),mark(t+.025,side*span*.73),mark(t+.032,side*span)],
          [.0018,.0022,.0015,.0005],'#ad9979');
      }
      if(s===1){
        const join=[-.097,-.075,-.052,-.026,0,.024,.050,.075,.098].map((z,j)=>under(.002+.0015*sin(j*1.33),z));
        stroke(f,join,[.0007,.0019,.0029,.0026,.0031,.0028,.0021,.0019,.0006],'#aa9477');
        stroke(f,[[.004,.047,.107],[.002,.087,.084],[.001,.102,.008],[.002,.087,-.084]],[.002,.003,.002,.0008],'#ccb89a');
      }
    });
  }
  return body;
}
function basket(parent){
  const rx=.78,rz=.47;
  collect(parent,'十一に見える餅籠と底の敷き跡',f=>{
    turned(f,0,0,0,[[.001,0],[.98,0],[1,.025],[.001,.028]],'#c8b183','wood');
  }).scale.set(rx*.93,1,rz*.93);
  collect(parent,'編み縁と十二枚の舟形桜葉',f=>{
    basketWeave(f,rx,rz,.117);
    for(let j=0;j<3;j++)for(let i=0;i<4;i++){
      const x=(i-1.5)*.286*(j===1?1:.86);
      leaf(f,x,.041,(j-1)*.218,.285,.096,(i%2-.5)*.14);
    }
  });
  for(let j=0;j<3;j++)for(let i=0;i<4;i++){
    if(j===0 && (i===1||i===2))continue;
    add(parent,cake(1),(i-1.5)*.286*(j===1?1:.86),.071,(j-1)*.218, i*.21,.77);
  }
  const fused=fusedCake(parent);fused.position.set(0,.071,-.218);
}
function squareTray(f,x,y,z,w,d,h){
  block(f,x,y+.012,z,w,.026,d,'#bfaa7e');
  for(const s of [-1,1]){
    block(f,x,y+h/2,z+s*(d/2-.013),w,h,.027,'#cfb889');
    block(f,x+s*(w/2-.015),y+h/2,z,.031,h,d,'#c7ae7e');
    for(const side of [-1,1])for(let k=1;k<4;k++)
      block(f,x+side*(w/2-.018),y+k*h/4,z+s*d/2,.033,.015,.006,edge);
  }
}
// Saw the alignment notch into the side of each removable batten. Its top
// and underside stay level so all three still bear the upper tray.
function batten(f,width,height,tint,chipped=false){
  const x=width/2, end=.215;
  const corner=chipped ? [[x,end-.031],[.003,end-.013],[-.002,end-.016],[-.009,end]] : [[x,end]];
  const profile=new T.Shape([[-x,-end],[x,-end],[x,.102],[x-.010,.103],
    [x-.010,.125],[x,.128],...corner,[-x,end]].map(([a,z])=>new T.Vector2(a,-z)));
  const bevel=.0012;
  const wood=new T.ExtrudeGeometry(profile,{depth:height-2*bevel,bevelEnabled:true,
    bevelSize:bevel,bevelThickness:bevel,bevelSegments:1});
  f.draw(wood,[0,bevel+.001,0],one,tint,[-Math.PI/2,0,0],'wood');
  timberGrain(f,wood,[width,2*end,height],[0,0,height/2-bevel],[width,height,chipped?end:0]);
  wood.dispose();
  for(const z of [.140,.155]){
    stroke(f,[[-x*.88,height+.002,z+.006],[x*.55,height+.002,z-.004]],[.0024,.001],ink,4,3);
  }
}
function steamer(parent,prototype=false) {
  collect(parent,'蒸し箱の下段',f=>{
    for(const side of [-1,1]){
      block(f,side*.277,.085,0,.027,.16,.45,'#c3aa7e');
      block(f,0,.085,side*.210,.53,.16,.028,'#d2b889');
      for(let i=0;i<3;i++)block(f,side*.261,.051+i*.036,.224,.029,.012,.006,edge);
    }
    for(let i=0;i<10;i++)block(f,-.247+i*.055,.055,0,.033,.026,.38,'#d4bd92');
    for(const side of [-1,1]){
      for(const x of [-.195,.191])block(f,x,.145,side*.230,.026,.028,.014,prototype?'#965e45':'#957851');
      stroke(f,[[-.153,.101,side*.226],[-.11,.117,side*.241],[0,.119,side*.255],[.111,.117,side*.241],[.154,.101,side*.226]],.011,edge);
    }
  });
  collect(parent,'蒸し箱の上段',f=>{
    for(const s of [-1,1]){
      block(f,0,.073,s*.211,.58,.145,.028,'#c6ac7f');
      block(f,s*.278,.073,0,.025,.145,.40,'#ddc698');
    }
    for(let i=0;i<9;i++)block(f,-.22+i*.055,.018,0,.035,.030,.40,'#d6c093');
    for(const side of [-1,1]){
      for(let k=0;k<3;k++)block(f,side*.260,.031+k*.045,.227,.035,.014,.007,'#ad8c61');
      if(prototype){
        // Carpenter's cinnabar sight lines, cut by hand to register both tiers.
        for(let k=0;k<3;k++)stroke(f,[[side*.210-.012,.132-k*.03,.228],[side*.210+.008,.122-k*.03,.228]],[.004,.002],'#9c624a');
        stroke(f,[[.116,.047,side*.226],[.129,.063,side*.226],[.150,.036,side*.226]],.003,'#90674d');
      }
    }
  },0,.171,0);
  for(let i=0;i<3;i++)collect(parent,'取り外し桟'+i,f=>{
    batten(f,.038,.035,'#dfcda0');
  },.399+i*.058,0,0);
}
// Two folds turn around the edge of the parcel. The tips rise over the rice
// before the leaves settle on the mat, preserving the crease under the hand.
function lunchParcel(parent){
  collect(parent,'卯助の昼飯を置く敷物',f=>{
    grid(f,24,14,(u,v)=>[(u-.5)*.80,.012+.002*sin(18*u)*sin(9*v),(v-.5)*.34],'#c9b691','cloth');
    leaf(f,0,.019,0,.35,.116,.16);
  });
  collect(parent,'ひと口欠けた昼餅',f=>{
    grid(f,60,24,(u,v)=>{
      const a=u*tau,p=v*Math.PI,r=sin(p)**.78;
      const notch=Math.max(0,cos(a))**12*(.045+.016*cos(a*17));
      return [(.122-notch)*cos(a)*r,.023+.042*(1-cos(p)),.096*sin(a)*r];
    },white,'rice');
    for(let j=0;j<5;j++)f.oval([.061,.061+.007*sin(j*2),.020*(j-2)],[.004,.003,.004],'#e4d4b6',neutral,'rice');
  });
  for(const side of [-1,1]){
    const flap=new T.Group(),base=new T.Group(),tip=new T.Group();
    flap.name=side>0?'昼飯を覆う外葉':'昼飯を覆う内葉';
    flap.position.set(side*.132,.022,0);flap.userData.leafSide=side;
    parent.add(flap);flap.add(base);base.add(tip);
    const height=side>0?.098:.088;
    tip.position.y=height;
    collect(base,'竹皮の折り目',f=>{
      grid(f,12,12,(u,v)=>[side*.010*sin(Math.PI*u),u*height,(v-.5)*(.214+.014*sin(Math.PI*u))],'#a3a477','leaf');
    });
    const edge=(u,v)=>[-side*u*.157,.008*sin(Math.PI*u)+.004*v*v,u*.008+v*(.107*(1-.52*u*u))];
    collect(tip,'竹皮の葉脈',f=>{
      grid(f,20,10,(u,v)=>edge(u,v*2-1),'#b4af81','leaf');
      for(const v of [-.74,-.44,-.14,.16,.46,.76]){
        const points=[0,.25,.5,.75,1].map(u=>{const pt=edge(u,v*(1-u*.53));pt[1]+=.0012;return pt;});
        stroke(f,points,[.0008,.0012,.0011,.0009,.0004],'#8c895e');
      }
    });
    const pinch=new T.Group();pinch.name='竹皮をつまむ先';pinch.position.fromArray(edge(.93,.25));tip.add(pinch);
  }
}

export function openLunchLeaf(flap,progress){
  const base=flap.children[0],tip=base.children[0],side=flap.userData.leafSide;
  base.rotation.z=-side*1.53*progress;tip.rotation.z=-side*1.54*progress;
  return tip.getObjectByName('竹皮をつまむ先');
}
function documentSheet(f,x,y,z,w,d,tint=white){
  const at=(u,v)=>[x+(u-.5)*w,y+.010*(cos(u*Math.PI*2)*.43+sin(v*Math.PI*2)*.38)+.009*(u-v)**3,z+(v-.5)*d];
  grid(f,12,7,at,tint,'paper');
  for(let i=0;i<5;i++)for(let j=0;j<4-(i%2);j++){
    const u=.82-i*.148,v=.18+j*.133+.015*(i%2);
    const line=[[u+.014,v],[u-.009,v+.026],[u+.012,v+.043],[u-.022,v+.066]].map(([a,b])=>{const p=at(a,b);p[1]+=.002;return p;});
    stroke(f,line,[.001,.0026,.0019,.0007],ink,4,4);
  }
  const seal=at(.15,.72);block(f,seal[0],seal[1]+.003,seal[2],.033,.003,.035,'#ae715c','paper');
}
function ledger(parent){
  collect(parent,'開いた控え',f=>documentSheet(f,-.06,.066,-.04,.43,.31));
  collect(parent,'綴じ帳と二つの書付',f=>{
    for(let j=0;j<5;j++)block(f,-.062,.012+j*.007,-.042,.49,.009,.37,j%2?'#e6d8b6':'#d6c5a2','paper');
    block(f,-.064,.049,-.044,.498,.012,.375,'#8c9690','cloth');

    documentSheet(f,.13,.018,.196,.51,.19);
    for(let j=0;j<4;j++)stroke(f,[[-.287,.050,-.16+j*.070],[-.308,.057,-.16+j*.070],[-.319,.035,-.16+j*.070],[-.312,.012,-.16+j*.070]],.005,edge);
    stroke(f,[[.29,.019,-.202],[.35,.021,-.086],[.425,.023,.091]],[.012,.012,.009],'#a18759');
    stroke(f,[[.425,.023,.091],[.439,.021,.123],[.442,.012,.156]],[.012,.012,.001],ink);
  });
}
function cloth(parent){
    const wrap=new T.Group();wrap.name='蒸し布';parent.add(wrap);
    function sheet(u,v){return [(u-.5)*.70,.045+.023*cos(u*14+.9*v)+.027*(v-.4)**2+.009*sin(v*15+u*2),(v-.5)*.45];}
    collect(wrap,'蒸し布の左袂',f=>grid(f,18,15,(u,v)=>sheet(u*.5,v),'#ddd1b1','cloth'));
    collect(wrap,'繕い目のある右袂',f=>{
    grid(f,18,15,(u,v)=>sheet(.5+u*.5,v),'#ddd1b1','cloth');
    const patch=(u,v)=>{const p=sheet(.53+.32*u,.33+.43*(1-u)*v);p[1]+=.005;return p;};
    grid(f,14,7,patch,'#82929b','cloth');
    for(const [a,b] of [[[0,0],[1,0]],[[0,1],[1,0]],[[0,0],[0,1]]]){
      for(let i=0;i<9;i++){
        const p0=patch(T.MathUtils.lerp(a[0],b[0],i/9),T.MathUtils.lerp(a[1],b[1],i/9)),p1=patch(T.MathUtils.lerp(a[0],b[0],(i+.52)/9),T.MathUtils.lerp(a[1],b[1],(i+.52)/9));
        p0[1]+=.004;p1[1]+=.004;stroke(f,[p0,p1],.0022,'#6c7669',4,2);
      }
    }
  });
}
function weddingTray(parent){
  collect(parent,'婚礼の漆盆と花枝の蒔絵',f=>{
    const steps=[[.001,.011],[.26,.011],[.268,.024],[.30,.034],[.36,.052],[.366,.067],[.355,.074],[.313,.065],[.26,.053],[.001,.047]];
    turned(f,0,0,0,steps,'#754e40');ring(f,0,.071,0,.353,.0038,'#c09e64');
    for(let i=0;i<5;i++){
      const a=.43+i*.40,x=.302*cos(a),z=.302*sin(a);
      for(let j=0;j<5;j++)f.oval([x+cos(j*tau/5)*.011,.065,z+sin(j*tau/5)*.011],[.010,.002,.006], '#c9ad76',[0,-j*tau/5,0]);
    }
  });
  collect(parent,'盆にのせた花餅',f=>{
    for(const [x,z] of [[-.095,.048],[.081,.058],[-.002,-.088]]){
      for(let i=0;i<5;i++)f.oval([x+.041*cos(tau*i/5),.081,z+.041*sin(tau*i/5)],[.051,.026,.038],white,[0,-tau*i/5,0],'rice');
      f.oval([x,.108,z],[.019,.005,.019],'#dcc69e',neutral,'rice');
    }
  });
}
function crate(parent,marked=true){
  if(!marked){
    collect(parent,'松原沖から竜宮へ流れた事故箱',f=>{
      // A rough sea-chest, taller and deeper than the shallow returnable case.
      // Its two long runners, plank seams and scarfed braces survive the voyage.
      const timber=['#89938a','#a2a490','#969b89'];
      for(const side of [-1,1]){
        for(let i=0;i<3;i++){
          block(f,0,.068+i*.09,side*.228,.64,.087,.028,timber[i]);
          block(f,side*.31,.068+i*.09,0,.03,.087,.436,timber[(i+1)%3]);
        }
        for(const x of [-.251,.252]){
          block(f,x,.166,side*.247,.040,.310,.020,'#69796c');
          for(let j=0;j<3;j++)f.oval([x,.061+j*.103,side*.26],[.006,.006,.003],'#515e53');
        }
        block(f,side*.198,.018,0,.055,.032,.51,'#716f59');
      }
      block(f,0,.034,0,.603,.025,.431,timber[1]);
      for(let i=0;i<12;i++){
        const x=-.248+i*.044;
        stroke(f,[[x,.082,.246],[x+.009,.102,.246],[x+.029,.117,.246]],[.001,.002,.0007],'#c2c2a8');
      }
    });
    collect(parent,'潮で白んだ蓋',f=>{
      const timber=['#89938a','#a2a490','#969b89'];
      for(let i=0;i<4;i++)block(f,(i-1.5)*.157,.324,0,.155,.033,.482,timber[i%3]);
      for(const z of [-.151,.15])block(f,0,.346,z,.66,.034,.042,'#777f70');
    });return;
  }
  collect(parent,'三日月の傷・通い箱',f=>{
    squareTray(f,0,.008,0,.64,.47,.305);
    for(const x of [-.24,.23]){
      for(const s of [-1,1]){block(f,x,.17,s*.24,.041,.31,.009,'#8b7a5e');for(const y of [.066,.278])f.oval([x,y,s*.248],[.009,.009,.003],dark);}
    }
  });
  collect(parent,'三日月傷の蓋',f=>{
    for(let j=0;j<4;j++)block(f,0,.328,(j-1.5)*.116,.658,.036,.114,j%2?'#c5ac7d':'#cbb88b');
    for(const x of [-.24,.23])block(f,x,.348,0,.046,.024,.49,edge);
    // The identifying cut belongs to the upper right corner of the lid.
    stroke(f,[[.074,.348,.067],[.093,.350,.119],[.134,.351,.157],[.186,.351,.165],[.212,.349,.147]],
      [.001,.005,.008,.005,.001],'#715c45');
    stroke(f,[[.085,.352,.097],[.105,.353,.127],[.143,.353,.151],[.176,.353,.157]],
      [.001,.003,.004,.001],'#e6d2a8');
  });
}
// Keep the dark hammer scale continuous across both sides of a fracture.
// ExtrudeGeometry's default UVs are drawing coordinates and can reach into
// the neighbouring swatch, especially at the square holes in the small coins.
function metalPlate(form,geometry,origin,colour,extent){
  const {position,normal,uv}=geometry.attributes;
  for(let i=0;i<position.count;i++){
    const flat=abs(normal.getZ(i))>.5;
    const u=flat || abs(normal.getY(i))>abs(normal.getX(i))?position.getX(i):position.getY(i);
    const v=flat?position.getY(i):position.getZ(i);
    uv.setXY(i,.5+u/extent,.5+v/extent);
  }
  form.draw(geometry,origin,one,colour,[-Math.PI/2,0,0],'iron');
  geometry.dispose();
}
function hinge(parent,{pieces='main',joined=false,rope=true}={}){
  const cut=[[-.144,.040],[-.116,.051],[-.103,.069],[-.079,.063],[-.061,.090],[-.052,.125]];
  const draw=(f,points,colour)=>{
    const shape=new T.Shape(points.map(([x,z])=>new T.Vector2(x,-z)));
    const geo=new T.ExtrudeGeometry(shape,{depth:.014,bevelEnabled:true,bevelThickness:.0018,bevelSize:.0015,bevelSegments:1});
    metalPlate(f,geo,[0,.012,0],colour,.33);
    stroke(f,cut.map(([x,z])=>[x,.028,z]),.002,'#c6b69b');
  };
  if(pieces!=='chip')collect(parent,'欠けた蝶番',f=>{
    draw(f,[[-.144,-.122],[.118,-.122],[.118,.125],...cut.slice().reverse()],'#6c7168');
    for(const z of [-.085,.005,.091]){
      const barrel=new T.CylinderGeometry(.023,.023,.064,14);
      f.draw(barrel,[.122,.033,z],one,'#61685c',[Math.PI/2,0,0],'iron');barrel.dispose();
    }
    for(const x of [-.088,.060])for(const z of [-.076,.034]){
      f.oval([x,.029,z],[.014,.005,.014],'#464c43',neutral,'iron');
      stroke(f,[[x-.007,.034,z+.002],[x+.007,.034,z-.002]],.002,'#a6a391');
    }
  });
  if(pieces!=='main')collect(parent,'欠けの破片',f=>draw(f,[...cut,[-.144,.125]],'#8b8473'),joined?0:-.039,0,joined?0:.045);
  if(rope)collect(parent,'切れた綱',f=>{
    for(let i=0;i<3;i++){
      const x=.197+i*.016;
      const path=Array.from({length:19},(_,j)=>[x+.028*sin(j*.54+i*2),.026+.012*cos(j*.54+i*2),-.18+j*.018]);
      stroke(f,path,.009,i%2?edge:straw);
      for(let j=0;j<3;j++)stroke(f,[path[18],[x-.026+j*.025,.015,.197+j*.013]],[.005,.0005],edge);
    }
  });
}
function tag(parent){
  collect(parent,'日付を重ねた荷札',f=>{
    for(let j=0;j<2;j++){
      const x=.053*j,z=-.044*j,y=.01+.018*j;
      block(f,x,y,z,.35,.018,.12,j?'#dcca9e':'#c4aa7d');
      for(let i=0;i<6;i++){
        const dx=x-.096+i*.038;
        stroke(f,[[dx+.006,y+.012,z-.022],[dx-.006,y+.012,z+.004],[dx+.005,y+.012,z+.013],[dx-.004,y+.012,z+.030]],[.002,.003,.002,.001],ink,4,4);
      }
    }
    stroke(f,[[-.102,.039,-.065],[-.17,.058,-.105],[-.237,.03,-.070],[-.201,.026,.030],[-.151,.026,.030]],.005,edge);
  });
}
let celadon;
function waterBowl(parent){
  // Keep the celadon and its lid on the same glaze. The timber and rice
  // pigment atlas gives a ceramic a conspicuous woodgrain in a close-up.
  celadon ??= surfaceGrain(brushWash(new T.MeshPhysicalMaterial({
    vertexColors:true,side:T.DoubleSide,roughness:.44,clearcoat:.28,clearcoatRoughness:.33
  }),.17),3.4);
  const belly=collect(parent,'蓋付きの運搬用水鉢',f=>{
    turned(f,0,0,0,[[.001,.009],[.14,.009],[.15,.029],[.207,.063],[.26,.162],[.27,.239],[.258,.262],[.234,.264],[.227,.235],[.18,.12],[.001,.05]],'#a1a89a','rice');

    for(let i=0;i<3;i++)ring(f,0,.096+i*.040,0,.234+i*.010,.003,'#697d73');
    for(const s of [-1,1])stroke(f,[[s*.235,.21,-.02],[s*.307,.228,-.016],[s*.313,.168,.008],[s*.247,.158,.009]],.012,'#889a89');
    turned(f,0,0,0,[[.138,.006],[.144,.007],[.147,.014]],'#ba9c78');
  });
  const lid=collect(parent,'水鉢の合い蓋',f=>{
    turned(f,0,0,0,[[.001,.263],[.224,.263],[.278,.274],[.273,.287],[.18,.298],[.046,.307],[.036,.327],[.045,.343],[.035,.352],[.001,.353]],'#c1c3aa','wood');
    ring(f,0,.290,0,.249,.0018,'#9ca593');
  });
  belly.material=lid.material=celadon;
}
function riceSack(parent) {
  collect(parent,'藁縄を掛けた米俵',f=>{
    grid(f,40,24,(u,v)=>{const a=tau*u,r=sin(Math.PI*v)**.34;return [(.5-v)*.63,.17+.164*r*cos(a),.177*r*sin(a)];},'#ccba90','cloth');
    for(const x of [-.196,0,.196]){
      const r=Math.pow(sin(Math.PI*(.5-x/.63)),.34);
      const pts=Array.from({length:25},(_,j)=>[x+.003*sin(j*4),.17+.168*r*cos(j*tau/24),.18*r*sin(j*tau/24)]);
      stroke(f,pts,.011,edge);
    }
    for(const s of [-1,1])stroke(f,[[-.30,.21,s*.015],[-.177,.265,s*.133],[0,.277,s*.138],[.185,.263,s*.128],[.309,.199,s*.012]],.008,straw);
  });
}
const evidence={basket,steamer,cloth,tray:weddingTray,crate,hinge,ledger,tag,bowl:waterBowl,rice:riceSack};
const inscriptions={
  'terrace-letter':['棚田より','米と道具を','持参します','みのり'],
  'changed-day':['八重の返書','京への搬入','検分の翌朝'],
  'ship-instruction':['船積み','翌朝の便','お澄'],
  'old-manifest':['松原行','検分当日','敷板・丸皿','予備祭札'],
  'purchase-list':['購入内訳','十五景各一組','蒸し箱・敷板','皿・包み・祭札'],
  'regional-returns':['現物照合','地方十四組','受取人控'],
  'withdrawal-cover':['各景の辞退','に伴う引揚げ','添付　受領書'],
  'dated-inquiry':['受取翌日','今年も出品','月見の棚田'],
  'dawn-delivery':['日取り変更','検分の翌朝','八重'],
  'inari-delivery':['検分当日','検分翌朝'],
  'dawn-hearing':['搬入は','検分の翌朝','朝吉・うめ'],
  'reversed-tags':['検分当日','検分翌朝'],
  'paid-change':['出船変更','翌朝の便','変更料済'],
  'joint-work':['雪の支度','お冬・望','量は相談'],
  'submission-check':['受理控','提出　八重','確認済'],
  'omission-copy':['提出の控','再搬入予定','記載せず'],
  'port-wages':['運び賃','追加仕事','支払済'],
  'loaned-boards':['配膳板二枚','東大寺より','望へ貸す'],
  'entrusted-steamer':['預け札','蒸籠　弥平','ささへ'],
};
const inkTexts=new Map();
function written(parent,lines,x,y,z,w,d,yaw=0,wooden=false){
  const key=lines.join('|')+wooden;
  if(!inkTexts.has(key)){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=320;
    const g=canvas.getContext('2d');
    g.clearRect(0,0,512,320);
    const long=Math.max(...lines.map(l=>[...l].length));
    const size=Math.min(58,Math.floor(275/long));
    g.textAlign='center';g.textBaseline='middle';g.font='600 '+size+'px "Yu Mincho","Hiragino Mincho ProN",serif';
    for(const [i,line] of lines.entries()){
      const xx=512-(i+.65)*512/(lines.length+.3);
      g.fillStyle=i===0&&!wooden?'#845746':'#4f463a';
      [...line].forEach((s,j)=>g.fillText(s,xx,29+(j+.5)*size*.98));
    }
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    inkTexts.set(key,new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
  }
  const lettering=new T.Mesh(new T.PlaneGeometry(w,d),inkTexts.get(key));
  lettering.rotation.order='YXZ';lettering.rotation.set(-Math.PI/2,yaw,0);lettering.position.set(x,y,z);lettering.renderOrder=2;
  parent.add(lettering);
}
function sheetWithText(g,lines,wooden){
  const w=wooden?.51:.565,d=wooden?.228:.373;
  collect(g,wooden?'字を焼いた荷札':'墨書きの控え',f=>{
    if(wooden){
      const sh=new T.Shape();
      const contour=[[-.50,-.32],[-.422,-.50],[.49,-.50],[.50,-.44],[.50,.46],[.485,.50],[-.42,.50],[-.50,.32]];
      contour.forEach(([x,z],i)=>sh[i?'lineTo':'moveTo'](w*x,-d*z));sh.closePath();
      const eye=new T.Path();eye.absarc(-.40*w,0,.012,0,tau,true);sh.holes.push(eye);
      const geo=new T.ExtrudeGeometry(sh,{depth:.013,bevelEnabled:true,bevelSegments:1,bevelSize:.0028,bevelThickness:.0028});
      const pos=geo.attributes.position,uv=geo.attributes.uv;for(let i=0;i<pos.count;i++)uv.setXY(i,.5+pos.getX(i)/w,.5+pos.getY(i)/d);
      f.draw(geo,[0,.004,0],one,'#d3b387',[-Math.PI/2,0,0],'wood');geo.dispose();
      stroke(f,[[-w*.40,.002,0],[-w*.40,.023,-.003],[-w*.52,.039,-.035],[-w*.66,.029,-.039],[-w*.67,.012,.020],[-w*.52,.009,.057],[-w*.40,.002,.007]],.0048,edge);
      for(let i=0;i<3;i++)stroke(f,[[-w*.451,.023,-.006+i*.006],[-w*.467,.030,.008+i*.005]],[.003,.002],straw);
    }else{
      // Hand-cut deckle. The middle is flat for ink; corners rise on a curl.
      for(let k=0;k<4;k++)grid(f,31,19,(u,v)=>{
        let x=(u-.5)*(w+.001*k),z=(v-.5)*(d+.0012*k);
        x+=.003*sin(v*97+k)*Math.abs(u-.5)**4*16+.0019*k*sin(v*6);
        z+=.002*cos(u*127+k)*Math.abs(v-.5)**4*16+.0018*k;
        const curl=Math.max(0,(u-.78)/.22)**2*Math.max(0,(.21-v)/.21)**2;
        return [x,.004+.003*k+.013*curl,z];
      },k===3?'#f1e5c8':'#d6c9a8','paper');
      for(let i=0;i<38;i++){
        const x=(i/38-.5)*w,z=d*.50+.001*sin(i);stroke(f,[[x,.014,z],[x+.002*sin(i),.014,z+.001+.002*cos(i)**2]],[.00065,.00015],'#c8bda4',3,2);
      }
      const x=-w*.416,z=d*.267;
      for(const dx of [-.018,.018])stroke(f,[[x+dx,.016,z-.019],[x+dx,.016,z+.019]],.0017,'#a76e56',4,3);
      for(const dz of [-.019,.019])stroke(f,[[x-.018,.016,z+dz],[x+.018,.016,z+dz]],.0017,'#a76e56',4,3);
      for(let i=0;i<3;i++)stroke(f,[[x-.011,.016,z-.010+i*.009],[x+.007,.016,z-.010+i*.009],[x+.007,.016,z-.006+i*.009]],.0014,'#ae715c',4,4);
    }
  });
  if(lines.some(Boolean))written(g,lines,0,wooden?.021:.0155,0,w*.85,d*.89,0,wooden);
}
function boards(g,joining=false){
  for(let k=0;k<2;k++)collect(g,k?'敷板二':'敷板一',f=>{
    block(f,0,.021,0,.34,.041,.54,k?'#d2bc95':'#cfb387');
    for(const z of [-.185,.185])block(f,0,.049,z,.314,.016,.036,'#a8906e');
    for(const x of [-.131,.131])for(const z of [-.185,.185])f.oval([x,.057,z],[.008,.002,.008],edge);
    if(!k && joining){
      stroke(f,[[-.169,.044,-.135],[-.083,.044,-.135],[-.083,.044,-.266]],[.002,.005,.002],'#796245');
      block(f,-.127,.042,-.207,.075,.005,.12,'#b99c70');
      for(const z of [-.186,-.236])f.oval([-.097,.046,z],[.006,.002,.006],dark);
    }
  },(k-.5)*.38,0,0);
}
function rail(g){
  collect(g,'共通道具の桟',f=>{
    batten(f,.051,.032,'#af9473',true);
  },.395,0,0);
}
function oldSteamer(g){
  collect(g,'弥平の曲げわっぱの蒸籠',f=>{
    turned(f,0,0,0,[[.223,.005],[.262,.014],[.28,.182],[.278,.201],[.260,.203],[.243,.039],[.225,.039]],'#cfb48a','wood');
    for(let i=-6;i<=6;i++){
      const x=i*.034,depth=2*sqrt(.236**2-x*x);
      block(f,x,.041,0,.022,.019,depth,'#d2bd91');
    }
    for(const h of [.038,.158,.193])ring(f,0,h,0,.26+.02*h/.2,.006,edge);
    stroke(f,[[-.265,.161,.035],[-.32,.254,.044],[-.22,.397,.058],[.025,.439,.05],[.226,.372,.051],[.314,.248,.043],[.267,.159,.033]],.0155,straw);
    for(let i=0;i<7;i++){
      const x=-.063+i*.019;
      stroke(f,[[x,.429,.040],[x+.006,.450,.050],[x+.013,.445,.066],[x+.016,.425,.060]],.007,'#7e9190');
    }
  });
}
class TeaSurface extends T.Mesh {
  updateMatrix(){
    super.updateMatrix();
    if(!this.parent)return;
    // Keep the tea level across the round bore as the cup tips and returns
    // to the table. Its circular footprint is measured in the cup's frame.
    const m=this.parent.matrixWorld.elements;
    if(m[5]>1e-5){
      this.matrix.elements[1]=-m[1]/m[5];
      this.matrix.elements[9]=-m[9]/m[5];
    }
  }
}
function servingCup(g,x,z){
  const cup=collect(g,'湯呑み',f=>{
    turned(f,0,0,0,[[.001,.005],[.051,.005],[.056,.018],[.082,.023],[.104,.112],[.099,.135],[.087,.136],[.083,.04],[.001,.029]],'#a6b4a7','rice');
  },x,0,z);
  const tea=raw();
  turned(tea,0,0,0,[[.087,.002],[.0003,0]],'#99956a','rice');
  const meniscus=new TeaSurface(tea.geometry(),cup.material);
  meniscus.name='湯呑みの茶面';meniscus.position.y=.108;meniscus.receiveShadow=true;cup.add(meniscus);
}
function teaAndBundle(g){
  servingCup(g,-.22,.04);
  collect(g,'旅包み',f=>{
    grid(f,40,20,(u,v)=>{
      const a=tau*u,h=Math.PI*v,r=sin(h)**.74*(1+.039*cos(6*a+v));
      return [.105+.173*r*cos(a),.115*(1-cos(h)),.126*r*sin(a)];
    },'#9faca2','cloth');
    for(const s of [-1,1])stroke(f,[[.101,.211,.013],[.108+s*.039,.250,.009],[.106+s*.082,.274,.032],[.097+s*.098,.258,.056]],[.024,.023,.019,.004],'#a0aa98',6);
  });
}
function halfCake(g,hue,patch){
  const w=.175,h=.092,d=.131;
  for(const s of [-1,1])collect(g,s<0?'割餅左':'割餅右',f=>{
      const cx=0;
      grid(f,28,22,(u,v)=>{
        const a=(-Math.PI/2+u*Math.PI),q=v*Math.PI,r=sin(q)**.85;
        return [cx+s*w*cos(a)*r,h*(1-cos(q)),d*sin(a)*r];
      },white,'rice');
      grid(f,32,8,(u,v)=>{
        const a=tau*u,r=v;return [cx,.09+.09*r*cos(a),.131*r*sin(a)];
      },white,'rice');
      grid(f,32,8,(u,v)=>{
        const a=tau*u,r=v*(1+.045*cos(7*a));return [cx-s*.0015,.088+.066*r*cos(a),.101*r*sin(a)];
      },hue,'rice');
      if(patch && s===1){
        // The same triangular patch was used for both fillings. Its imprint
        // bends up the underside; a mark floating below the cake disappears side-on.
        const stamp=(u,v)=>{
          const x=.032+.086*u,z=-.050+.100*(1-u)*v,r=Math.hypot(x/w,z/d);
          return [cx+x,h*(1-sqrt(1-r**(2/.85)))-.0014,z];
        };
        for(let j=0;j<9;j++){
          const t=j/9;
          stroke(f,[stamp(t,.02),stamp(t,.5),stamp(t,.98)],[.001,.0019,.001],'#ae9e81',4);
          stroke(f,[stamp(.02,t),stamp(.5,t),stamp(.93,t)],[.001,.0016,.001],'#b4a58b',4);
        }
      }
  },s*.063,0,0);
}
function surfaceOfRice(g){
  for(const x of [-.165,.165]){
    const packet=collect(g,x<0?'同じ袋の米・左':'同じ袋の米・右',f=>{
      grid(f,12,8,(u,v)=>{
        const a=u*2-1,b=v*2-1;
        return [.145*a,.004+.039*Math.pow(abs(a),5)+.031*b*b,.077*b*(1-.20*a*a)];
      },'#bb9b6b','leaf');
      for(const end of [-1,1]){
        grid(f,7,4,(u,v)=>[end*(.145-.035*v)*(1-.08*abs(2*u-1)),.043+.023*v,(u-.5)*.124*(1-.65*v)],'#ad8857','leaf');
      }
      for(let i=0;i<50;i++){
        const a=i*2.4+x*9,r=sqrt((i+.5)/50);
        f.oval([.115*r*cos(a),.030+.032*(1-r*r),.059*r*sin(a)],[.014,.005,.007],
          i%4===0?'#d5c9a7':'#f2e6c8',[.12,a,.1],'rice');
      }
    },x,0,0);
    for(const side of [-1,1]){
      const skin=(u,v)=>{
        const a=2*u-1,tip=(side>0?.99:1.05)-.22*a*a+.08*a*side+.22*x*sin(u*4);
        return [.144*a*(1-.08*v)+.003*v*side,
          (.047+.007*side)*v+.016*sin(Math.PI*v)-.009*a*a*v,
          -side*(.086*tip*v)];
      };
      const flap=collect(packet,side>0?'竹皮の折り返し・手前':'竹皮の折り返し・奥',f=>{
        grid(f,14,8,skin,side>0?'#c6a574':'#b18f63','leaf');
        for(const v of [.14,.29,.48,.71,.89,.99]){
          const line=Array.from({length:8},(_,i)=>{
            const u=i/7,p=skin(u,v+.009*sin(6*u+9*v));
            p[1]+=.0006;return p;
          });
          stroke(f,line,v>.98?.0012:.00065,v>.98?'#846b4c':'#ab8c60',3,7);
        }
      },0,.036,side*.066);
      flap.userData.riceFold=side;
    }
  }
}
export function poseRicePackets(model,motion,progress){
  model.traverse(part=>{
    const side=part.userData.riceFold;
    if(!side)return;
    const second=part.parent.name==='同じ袋の米・右';
    const packetProgress=T.MathUtils.smoothstep(progress,second?.36:0,second?1:.64);
    const phase=motion==='fold'?1-packetProgress:packetProgress;
    // The outer fold lifts first and settles last, leaving the lapped edge on top.
    const opened=T.MathUtils.smoothstep(phase,side>0?.05:.24,side>0?.76:.95);
    part.rotation.x=side*2.21*opened;
  });
}
function manifestTube(g){
  const tube=new T.Group();tube.name='漆の内筒';g.add(tube);
  const shell=(f,profile,col)=>{
    const geo=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),40);
    f.draw(geo,[0,.070,.215],one,col,[-Math.PI/2,0,0],'wood');geo.dispose();
  };
  collect(tube,'漆筒の胴',f=>{
    shell(f,[[.001,0],[.061,0],[.068,.013],[.066,.355],[.056,.355],[.055,.032],[.001,.032]],'#774e40');
    for(const z of [.178,-.103]){
      stroke(f,Array.from({length:23},(_,j)=>[.068*cos(j*tau/22),.070+.068*sin(j*tau/22),z]),.0035,straw);
    }
  });
  collect(tube,'漆筒の栓',f=>{
    shell(f,[[.056,.321],[.072,.321],[.072,.43],[.066,.439],[.001,.439],[.001,.426],[.059,.422],[.059,.322]],'#82574c');
    stroke(f,Array.from({length:26},(_,j)=>[.072*cos(j*tau/25),.070+.072*sin(j*tau/25),-.135]),.004,edge);
  }).userData.performPart='open';
}

// A cargo note folds narrowly enough to fit the lacquer tube. The same ink
// crosses all eight panels and stays on the paper as each crease opens.
function cargoNote(){
  const note=new T.Group(),sample=new T.Group(),width=.055,depth=.278;
  note.name='書付';
  written(sample,inscriptions['old-manifest'],0,0,0,width*8,depth);
  const ink=sample.children[0].material;sample.children[0].geometry.dispose();
  let previous=note;
  for(let i=0;i<8;i++){
    const panel=new T.Group();panel.name='内訳の折り目'+i;
    panel.position.x=i?width:0;previous.add(panel);previous=panel;
    collect(panel,'出荷控の楮紙',f=>grid(f,3,12,(u,v)=>[u*width,.001+.0008*Math.sin(v*17+i)*u,(v-.5)*depth],
      i%2?'#eee1c6':'#ede0c4','paper'));
    const strip=new T.PlaneGeometry(width,depth,2,12),uv=strip.attributes.uv;
    for(let j=0;j<uv.count;j++)uv.setX(j,(i+uv.getX(j))/8);
    const text=new T.Mesh(strip,ink);text.rotation.x=-Math.PI/2;text.position.set(width/2,.0024,0);
    text.renderOrder=2;panel.add(text);
  }
  const edge=new T.Group();edge.name='内訳を広げる紙端';edge.position.set(width,.002,-depth*.38);previous.add(edge);
  return note;
}
function foldCargoNote(note,amount){
  for(let i=1;i<8;i++)note.getObjectByName('内訳の折り目'+i).rotation.z=(i%2?1:-1)*Math.PI*.983*amount;
}
export function sealCargoNote(model){
  const note=model.getObjectByName('書付'),tube=model.getObjectByName('漆の内筒');
  foldCargoNote(note,1);
  note.position.copy(note.parent.worldToLocal(tube.localToWorld(new T.Vector3(-.027,.056,-.003))));
  note.quaternion.copy(note.parent.getWorldQuaternion(new T.Quaternion()).invert()).multiply(tube.getWorldQuaternion(new T.Quaternion()));
}
export function readCargoNote(handle,part,model,act){
  if(!act)return null;
  const tube=model.getObjectByName('漆の内筒'),start=handle.position.clone(),angle=handle.quaternion.clone();
  const base=handle.parent.worldToLocal(tube.localToWorld(new T.Vector3()));
  const offset=(x,y,z)=>handle.parent.worldToLocal(tube.localToWorld(new T.Vector3(x,y,z))).sub(base);
  const smooth=t=>T.MathUtils.smoothstep(t,0,1);
  return {pose(t){
    handle.quaternion.copy(angle);handle.position.copy(start);
    if(act==='unplug'){
      const draw=smooth(t/.44),set=smooth((t-.44)/.56);
      handle.position.add(offset(.14*set,.003*set,-.12*draw+.17*set));
    }else if(act==='extract'){
      const draw=smooth(t/.43),across=smooth((t-.43)/.30),down=smooth((t-.73)/.27);
      handle.position.add(offset(-.50*across,.025*across-.077*down,-.303*draw+.31*down));
    }else foldCargoNote(part,1-t);
  },corner:()=>{
    if(act==='unplug')return tube.localToWorld(new T.Vector3(0,.104,-.185))
      .add(handle.getWorldPosition(new T.Vector3()).sub(handle.parent.localToWorld(start.clone())));
    if(act==='extract')return part.localToWorld(new T.Vector3(.023,.004,-.14));
    return part.getObjectByName('内訳を広げる紙端').getWorldPosition(new T.Vector3());
  },spine:()=>act==='spread'?part.localToWorld(new T.Vector3(0,.003,.055)):tube.localToWorld(new T.Vector3(0,.128,.10))};
}
export function createStoryFood(n){
  const group=new T.Group();
  if(!cakeNames[n])throw new RangeError('Unknown settlement '+n);
  stillWithPlate(group,Number(n));
  group.name=cakeNames[n];return group;
}
function stillWithPlate(g,n){
  const vessel=regionalVessel(n);g.add(vessel);
  const pastry=cake(n);
  if(n===1)collect(pastry,'桜餅に敷いた舟形の葉',f=>leaf(f,0,0,0,.49,.137,-.33),0,-.010,0);
  add(g,pastry,0,vessel.userData.floor+(n===1?.012:.002),0,.19,1);
}
function driedDough(g){
  collect(g,'刷り印',f=>{
    block(f,0,.012,0,.149,.024,.115,'#80654a');
    stroke(f,[[.01,.025,0],[.008,.065,0],[0,.113,0],[-.01,.171,0]],[.015,.013,.011,.009],dark);
    stroke(f,[[-.010,.136,0],[-.015,.221,0],[-.023,.314,.028]],[.019,.024,.017],straw);
  });
  written(g,['望'],0,.026,.017,.089,.056);
  const sample=cake(9);add(g,sample,.219,0,.036,-.23,1);
  written(g,['望'],.219,.199,.036,.051,.039);
}
function exhibitVariant(code,id){
  if(!id)return null;
  const g=new T.Group();
  const letters={
    'sakai-date':['堺　お澄殿','検分の翌朝','蔵前へ'],
    'dawn-date':['浦　朝吉殿','うめ殿','検分の翌朝'],
    'inari-date':['稲荷　結殿','検分の翌朝','陸路の荷'],
    'kyo-return-tag':['茶屋借用','京の一組','翌朝返却'],
    'peach-invite':['桃林の皆様','もち寄り祭へ','勘兵衛'],
    'palace-invite':['竜宮の皆様','もち寄り祭へ','勘兵衛'],
  };
  if(letters[id]){
    sheetWithText(g,letters[id],id==='kyo-return-tag');
    if(id==='peach-invite')collect(g,'封に添えた桃の葉',f=>leaf(f,-.15,.026,.06,.22,.045,-.69));
    if(id==='palace-invite')collect(g,'油紙のかかり紐',f=>{
      for(const z of [-.08,.07]) stroke(f,[[-.25,.012,z],[-.18,.026,z],[.19,.027,z],[.25,.013,z]],.0055,'#728674');
    });
  }else if(id==='salvaged-tools'){
    collect(g,'道具を包む縞木綿',f=>{
      grid(f,42,20,(u,v)=>{
        const a=tau*u,h=Math.PI*v,r=sin(h)**.55*(1+.044*cos(8*a+v*3));
        return [.28*r*cos(a),.125*(1-cos(h)),.195*r*sin(a)];
      },'#879987','cloth');
      for(const s of [-1,1])stroke(f,[[0,.24,0],[s*.056,.29,.016],[s*.111,.306,.045],[s*.143,.28,.086]],[.034,.027,.019,.005],'#788d7d',8);
    });
  }else if(id==='artisan-steamer'){oldSteamer(g);}
  else if(id==='festival-maker-tag'||id==='signed-maker-tag'){
    sheetWithText(g,[],true);
    written(g,['半量'],.175,.022,.035,.210,.168,0,true);
    collect(g,'お冬の花印',f=>{
      const x=-.092,z=.004;
      for(let i=0;i<5;i++){
        const a=i*tau/5;
        f.oval([x+.027*cos(a),.022,z+.027*sin(a)],[.025,.0014,.020],
          i%2?'#a9543f':'#a54f3d',[0,-a,0],'paper');
        stroke(f,[[x+.008*cos(a),.0235,z+.008*sin(a)],[x+.023*cos(a),.0235,z+.023*sin(a)]],
          [.0016,.001],'#d6af81',4,3);
      }
    });
    const secondSeal=collect(g,'望の薄の印',f=>{
      for(const [dx,dz] of [[-.052,-.031],[-.025,-.054],[.016,-.058],[.049,-.037],[.058,-.012]]){
        stroke(f,[[.046,.022,.043],[.046+dx*.24,.022,dz*.59+.043],[.046+dx*.72,.022,dz+.034],
          [.046+dx,.022,dz+.035]],[.0038,.0035,.002,.0004],'#584333',4,9);
      }
    });
    secondSeal.visible=id==='signed-maker-tag';
  }
  else if(id==='plain-crate'){
    collect(g,'町人の荷箱',f=>{squareTray(f,0,.008,0,.63,.48,.26);});
    collect(g,'町人の荷箱の蓋',f=>{
      for(let i=0;i<4;i++)block(f,0,.279,(i-1.5)*.12,.657,.027,.117,i%2?'#bda57e':'#c7b187');
      for(const x of [-.24,.24])block(f,x,.301,0,.037,.023,.483,'#ae906e');
    }).userData.performPart='open';
  }else if(id==='board-liner'||id==='plate-liner'){
    // Removable paper liners are kept at their receiving ports. The actual
    // objects fit the outline at 1:1 even though the study camera may zoom.
    crate(g,true);const lid=g.getObjectByName('三日月傷の蓋');lid.visible=false;
    collect(g,'中敷き',f=>{
      // Lay the removed liner across the case mouth on two narrow battens.
      // Both receiving marks remain visible from a normal standing eye line.
      for(const z of [-.143,.143])block(f,0,.031,z,.654,.016,.025,'#a18b65');
      block(f,0,.044,0,.579,.008,.401,'#ded0ac','cloth');
      for(let k=0;k<2;k++){
        const offset=k*.004,col=k?'#baaa89':'#c9b897';
        if(id==='plate-liner')ring(f,0,.050,0,.194+offset,.0028,col);
        else for(const sign of [-1,1]){
          stroke(f,[[sign*.270,.050,-.166-offset],[sign*.270,.050,.166+offset]],.003,col);
          stroke(f,[[-.264,.050,sign*(.17+offset)],[.264,.050,sign*(.17+offset)]],.003,col);
        }
      }
    },0,.288,0);
  }else if(id==='case-sketches'){
    for(const [i,label] of ['敦賀控','堺控'].entries()){
      const page=new T.Group();page.name=i?'堺の控え':'敦賀の控え';page.userData.performPart='open';g.add(page);
      sheetWithText(page,[''],false);written(page,[label],.206,.016,-.038,.068,.151);
      collect(page,'蓋の見取図',f=>{
        const a=[-.18,.018,-.066],b=[.027,.018,-.09],c=[.121,.018,-.011],e=[-.088,.018,.019];
        const low=p=>[p[0],p[1],p[2]+.067];
        for(const ends of [[a,b],[b,c],[c,e],[e,a],[c,low(c)],[e,low(e)],[a,low(a)],[low(a),low(e)],[low(e),low(c)]]){
          stroke(f,ends,.0021,ink,4,2);
        }
        for(const x of [-.134,-.017])stroke(f,[[x,.019,-.068],[x+.092,.019,.004]],.0028,edge,4,2);
        stroke(f,[[.008,.019,-.038],[.018,.019,-.021],[.043,.019,-.013],[.056,.019,-.018]],[.001,.0028,.0028,.0006],ink);

      });
      page.position.set((i-.5)*.49,.006*i,-.035*i);page.rotation.y=i?.065:-.052;
    }
  }else if(id==='ferry-leaf'){
    collect(g,'舟形の敷き葉',f=>leaf(f,0,.004,0,.42,.082,-.13));
  }else if(id==='wedding-print'||id==='trial-print'){
    sheetWithText(g,[''],false);
    written(g,[id==='wedding-print'?'祝い餅':'試作'],.183,.016,0,.06,.14);
    collect(g,'三角の繕い目の写し',f=>{
      const y=.018;
      ring(f,-.045,y,0,.126,.0018,ink,.099);
      const corners=[[-.10,y,-.046],[.018,y,-.029],[-.075,y,.055],[-.10,y,-.046]];
      stroke(f,corners,.002,ink);
      for(let i=0;i<4;i++){
        const x=-.091+i*.028,z=-.045+i*.004;
        stroke(f,[[x,y,z-.006],[x-.005,y,z+.008]],.002,ink);
      }
    });
  }else if(id==='tool-rubbing'){
    sheetWithText(g,[''],false);
    collect(g,'角継ぎと桟の墨拓',f=>{
      const y=.018;
      stroke(f,[[-.19,y,-.10],[-.03,y,-.10],[-.03,y,-.041],[-.13,y,-.041],[-.13,y,.097],[-.19,y,.097],[-.19,y,-.10]],.003,ink);
      for(let i=0;i<3;i++){
        const x=.018+i*.064;
        stroke(f,[[x,y,.098],[x,y,-.099],[x+.03,y,-.099],[x+.03,y,.098-(i===2?.028:0)],[x,y,.098]],.002,ink);
        stroke(f,[[x,y,-.06],[x+.03,y,-.07]],.003,ink);
      }
    });
  }else if(id==='shore-tea'){
    servingCup(g,0,0);
  }else if(id==='mountain-flask'){
    collect(g,'山茶の竹筒の胴',f=>{
      turned(f,0,0,0,[[.001,.003],[.084,.003],[.087,.016],[.084,.263],[.089,.278],[.072,.284],[.066,.244]],'#9b9b62');
      for(const h of [.04,.173,.233])ring(f,0,h,0,.085,.005,edge);
      stroke(f,[[-.079,.228,0],[-.106,.347,0],[-.058,.385,.018],[.059,.369,.026],[.087,.231,0]],.006,straw);
    });
    collect(g,'山茶の栓',f=>turned(f,0,0,0,[[.001,0],[.068,0],[.076,.010],[.079,.025],[.069,.035],[.001,.035]],'#bca179'),0,.268,0);
  }else if(id==='loan-slip'){
    sheetWithText(g,['貸出札の写し','配膳板　二枚','寺より薄野へ'],false);
  }else if(id==='peach-reply'){
    sheetWithText(g,['京へ参ります','桃子'],false);
    collect(g,'返事に添えた桃の葉',f=>leaf(f,-.13,.02,0,.23,.047,.95));
  }else if(id==='leaf-marks'){
    const base=createStoryEvidence('basket');
    base.children.filter(o=>o.name==='十一に見える餅籠と底の敷き跡').forEach(o=>g.add(o));
    collect(g,'餅と葉をよけた十二の敷き跡',f=>{
      basketWeave(f,.78,.47,.117);
      for(let j=0;j<3;j++)for(let i=0;i<4;i++)
        leaf(f,(i-1.5)*.286*(j===1?1:.86),.035,(j-1)*.218,.269,.089,(i%2-.5)*.14,true);
    });
  }else if(id==='lunch-wrap'){
    lunchParcel(g);
  }else if(id==='warm-cakes'||id==='peach-invitation'){stillWithPlate(g,id==='warm-cakes'?1:12);}
  else if(id==='same-rice')surfaceOfRice(g);
  else if(id==='steam-test'){
    steamer(g);const old=new T.Group();oldSteamer(old);add(g,old,-.60,0,-.56,.14,.80);
  }
  else if(id==='repair-body'){
    steamer(g);
    for(const part of [...g.children])if(part.name.startsWith('取り外し桟'))part.removeFromParent();
  }else if(id==='prototype'||id==='steam-repair'){steamer(g,id==='prototype');setEvidencePose(g,'spaced');}
  else if(id==='wedding-filling'||id==='walnut-filling')halfCake(g,id==='wedding-filling'?'#dfcda0':'#986e4d',true);
  else if(id==='cloth-test'){cloth(g);add(g,cake(4),-.19,.077,.026,-.1,.57);}
  else if(id==='sakai-boards'||id==='old-tool-marks'){boards(g,id==='old-tool-marks');if(id==='old-tool-marks')rail(g);}
  else if(id==='steaming-witness'){oldSteamer(g);const cover=new T.Group();cloth(cover);add(g,cover,0,.20,0,.12,.71);}
  else if(id==='packing-bars'){
    const full=new T.Group();steamer(full);for(const part of [...full.children])if(part.name.startsWith('取り外し桟')){part.position.x-=.44;g.add(part);}
  }else if(id==='spare-case'){
    collect(g,'船頭の用意した予備箱',f=>{
      squareTray(f,0,.007,0,.64,.48,.155);
      for(const s of [-1,1]){
        for(const z of [-.15,.15])block(f,s*.305,.151,z,.043,.043,.064,straw);
        stroke(f,[[s*.317,.141,-.122],[s*.344,.215,-.077],[s*.355,.235,.009],[s*.344,.215,.077],[s*.317,.141,.122]],.010,edge);
      }
    });
    const plates=new T.Group();for(let i=0;i<3;i++)collect(plates,'運んだ丸皿'+(i||''),f=>dish(f,.22),0,i*.03,0);
    add(g,plates,.55,0,.02,.2,.76);
  }
  else if(id==='tsuruga-plates'||id==='kyoto-set'){
    for(let i=0;i<3;i++)collect(g,i===2?'運んだ丸皿':'重ねた丸皿'+i,f=>dish(f,.194,'#bfc4af'),0,i*.042,0);
    if(id==='kyoto-set'){const set=new T.Group();boards(set);add(g,set,-.42,0,.09,-.2,.52);}
  }else if(id==='entrusted-steamer'){oldSteamer(g);const note=new T.Group();sheetWithText(note,inscriptions[id],true);add(g,note,.33,0,.205,-.3,.63);}
  else if(id==='mountain-tea'||id==='rest-wish')teaAndBundle(g);
  else if(id==='palace-consent'||id==='matched-hinge'){
    crate(g,false);
    collect(g,'蝶番がもげた割れ目',f=>{
      stroke(f,[[-.165,.335,.243],[-.147,.303,.247],[-.167,.289,.247],[-.147,.259,.248],[-.156,.239,.246],[-.112,.211,.247]],
        [.003,.005,.003,.006,.005,.001],dark);
      for(const y of [.277,.194])f.oval([-.112,y,.246],[.007,.006,.002],'#594a37');
    });
    const h=new T.Group();hinge(h,{pieces:'chip',joined:true,rope:false});
    h.rotation.x=Math.PI/2;h.rotation.z=-.09;h.scale.setScalar(.61);h.position.set(-.14,.236,.252);g.add(h);
  }else if(id==='old-manifest'){add(g,cargoNote(),-.28,.003,0);const tube=new T.Group();manifestTube(tube);add(g,tube,.375,0,-.04,.24);}
  else if(id==='loaned-boards'){boards(g);const tag=new T.Group();sheetWithText(tag,inscriptions[id],true);add(g,tag,0,.067,.015,-.075,.58);}
  else if(id==='lidded-bowl'){
    waterBowl(g);
    const lid=g.getObjectByName('水鉢の合い蓋');
    const rest=new T.Group();rest.name='水鉢の蓋置き';rest.position.set(-.58,-.258,-.11);g.add(rest);lid.position.copy(rest.position);
    const serving=new T.Group();serving.name='水中の餅の置き場';serving.position.set(0,.135,0);g.add(serving);
    collect(g,'水の張られた鉢',f=>turned(f,0,0,0,[[.001,.157],[.214,.157],[.229,.161]],'#a8c1b2','rice'));

  }
  else if(id==='continued-work')driedDough(g);
  else if(id==='seats-for-crew'){for(const [i,n] of [1,11,13].entries()){const plate=new T.Group();stillWithPlate(plate,n);add(g,plate,(i-1)*.36,0,i%2?.07:-.07,i*.65,.68);}}
  else if(inscriptions[id]){
    if(id==='reversed-tags'||id==='inari-delivery'){
      for(let i=0;i<2;i++){
        const note=new T.Group();sheetWithText(note,[inscriptions[id][i]],true);
        add(g,note,(i-.5)*.093,i?.025:.004,(i-.5)*.131,-.065+i*.21,.76).name=i?'新しい荷札':'古い荷札';
        if(!i&&id==='reversed-tags'){note.rotation.x=Math.PI;note.position.y=.025;}
      }
      g.userData.joinedLabels=true;
    }else{
      const doc=new T.Group();doc.name=id==='withdrawal-cover'?'見出しの表紙':'書付';doc.userData.performPart='open';
      sheetWithText(doc,inscriptions[id],code==='tag'||id==='paid-change');g.add(doc);
      if(id==='port-wages'||id==='paid-change'){
        collect(g,'運び賃',f=>{
          // Cast copper cash with square perforations, threaded on a hemp cord.
          for(let i=0;i<7;i++){
            const x=.226+(i%3)*.055,z=.178+Math.floor(i/3)*.039;
            const coin=new T.Shape();coin.absarc(0,0,.037,0,tau,false);
            const hole=new T.Path();hole.moveTo(-.009,-.009);hole.lineTo(-.009,.009);hole.lineTo(.009,.009);hole.lineTo(.009,-.009);hole.closePath();coin.holes.push(hole);
            const geo=new T.ExtrudeGeometry(coin,{depth:.006,bevelEnabled:false,curveSegments:12});
            metalPlate(f,geo,[x,.023+i*.004,z],i%2?'#798171':'#9b8c69',.085);
          }
          stroke(f,[[.226,.029,.178],[.240,.067,.214],[.288,.055,.230],[.34,.048,.245]],.004,edge);
        });
      }
      if(id==='regional-returns'){
        // Counterfoils for all fourteen regional sets, filed in two packets.
        collect(g,'十四景の照合札',f=>{
          for(let i=0;i<14;i++){
            const x=.08+(i%7)*.025,z=.075+Math.floor(i/7)*.109;
            block(f,x,.014+i*.001,z,.079,.006,.092,i%2?'#d7cba9':'#e0d3b2','paper');
            block(f,x-.016,.019+i*.001,z+.026,.013,.002,.012,'#9d6550','paper');
          }
        },-.385,0,.023);
      }
      if(id==='withdrawal-cover'){
        const leaf=new T.Group();sheetWithText(leaf,['蒸し箱ほか','確かに受領','みのり'],false);add(g,leaf,.30,-.008,.07,.10,.82).name='添付の受領書';
      }
    }
  }else return null;
  return g;
}

// The cord follows both actual holes when the performance lifts a tag out of
// the model into a hand. Each examined copy owns its moving vertices.
const labelCordMaterial=new T.MeshStandardMaterial({color:edge,roughness:1});
function tieLabels(g){
  const first=g.getObjectByName('古い荷札'),second=g.getObjectByName('新しい荷札'),anchor=new T.Vector3(-.204,.017,0);
  const a=new T.Vector3(),b=new T.Vector3(),priorA=new T.Vector3(Infinity),priorB=new T.Vector3(Infinity);
  const count=18,sides=6,positions=new Float32Array((count+1)*sides*3),ix=[];
  for(let i=0;i<count;i++)for(let j=0;j<sides;j++){const l=i*sides+j,r=i*sides+(j+1)%sides;ix.push(l,r,l+sides,r,r+sides,l+sides);}
  const geo=new T.BufferGeometry(),attr=new T.BufferAttribute(positions,3);attr.setUsage(T.DynamicDrawUsage);geo.setAttribute('position',attr);geo.setIndex(ix);
  const cord=new T.Mesh(geo,labelCordMaterial);cord.name='二枚の札を通す一本の紐';cord.frustumCulled=false;g.add(cord);
  const c=new T.Vector3(),axis=new T.Vector3(),normal=new T.Vector3(),across=new T.Vector3(),scratch=new T.Vector3();
  function update(){
    a.copy(anchor);first.localToWorld(a);g.worldToLocal(a);b.copy(anchor);second.localToWorld(b);g.worldToLocal(b);
    if(a.distanceToSquared(priorA)+b.distanceToSquared(priorB)<.00000002)return;
    priorA.copy(a);priorB.copy(b);
    const sag=Math.max(.019,.14-.16*a.distanceTo(b));
    for(let i=0;i<=count;i++){
      const t=i/count,w=sin(t*Math.PI),slope=Math.PI*cos(t*Math.PI);
      c.lerpVectors(a,b,t);c.x-=w*sag;c.y=Math.max(.007,c.y+.024*w-.12*w*Math.abs(a.y-b.y));
      axis.subVectors(b,a);axis.x-=slope*sag;axis.y+=slope*(.024-.12*Math.abs(a.y-b.y));axis.normalize();
      normal.crossVectors(axis,Math.abs(axis.y)>.95?scratch.set(1,0,0):scratch.set(0,1,0)).normalize();across.crossVectors(axis,normal);
      for(let j=0;j<sides;j++){
        const theta=j*tau/sides;
        scratch.copy(c).addScaledVector(normal,.0044*cos(theta)).addScaledVector(across,.0044*sin(theta));attr.setXYZ(i*sides+j,scratch.x,scratch.y,scratch.z);
      }
    }
    attr.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();
  }
  update();cord.onBeforeRender=update;
  return g;
}
export function releaseStoryEvidence(g){
  if(g.userData.joinedLabels)g.getObjectByName('二枚の札を通す一本の紐')?.geometry.dispose();
}

export function createStoryEvidence(code,id){
  if(id){
    const key=code+'/'+id;
    if(!templates.has(key)){
      const variant=exhibitVariant(code,id);
      templates.set(key,variant||createStoryEvidence(code));
    }
    const instance=templates.get(key).clone();
    instance.userData.storyEvidence=code;
    instance.userData.storyVariant=id;
    return instance.userData.joinedLabels?tieLabels(instance):instance;
  }
  if(!evidence[code])throw new RangeError('Unknown story evidence '+code);
  if(!templates.has(code)){
    const g=new T.Group();g.userData.storyEvidence=code;evidence[code](g);templates.set(code,g);
  }
  return templates.get(code).clone();
}

function dyedPanel(f,x,y,z,w,h,tint,i=0){
  grid(f,22,9,(u,v)=>[x+(u-.5)*w,y-v*h+.015*v*cos(8*u+i),z+(.012+.036*v)*sin(13*u+i)],tint,'cloth');
}
function furnishTable(f,n,p){
  const {style,top:h,width,depth,lx,lz,base}=p,front=depth/2,half=width/2,gold='#ceab60';
  const rim=(x,y,z,r,col)=>ring(f,x,y,z,r,.006,col);
  const knot=(x,y,z,r=.062)=>{
    for(let j=0;j<3;j++)rim(x,y+j*.018,z,r,'#c9ad77');
    stroke(f,[[x-r,y+.038,z],[x-.02,y+.054,z+r],[x+.028,y+.009,z+r],[x+.044,y-.072,z+.043]],[.009,.010,.008,.002],edge);
  };
  if(style==='bamboo'){
    for(const s of [-1,1])for(const t of [-1,1]){
      for(const y of [.11,.36,h-.18]){rim(s*lx,y,t*lz,.056,'#819c61');rim(s*lx,y+.012,t*lz,.057,'#5c7048');}
      knot(s*lx,h-.145,t*lz);
    }
    for(let j=0;j<15;j++){
      const z=(j-7)*depth/15;
      for(let i=0;i<4;i++){const x=-1.06+i*.61+.09*sin(j);block(f,x,h+.001,z,.012,.002,.039,j%3?'#b2a25d':'#686e3d');}
    }
  }else if(style==='hull'){
    // The bow and stern lift off two runners; caulk lies in the seams between the strakes.
    for(const s of [-1,1])for(let i=0;i<3;i++){
      const strake=hullStrake(half,s,i);
      for(const [lo,hi,height] of strake.spans){
        grid(f,Math.ceil((hi-lo)*20),4,(u,v)=>strake.point(lo+(hi-lo)*u,height*v),
          ['#39636a','#4a6c70','#8b7959'][i],'wood');
      }
    }
    // The diamond mesh is threaded over the front gunwale; its floats have an auger hole.
    const hanging=(u,v)=>[-.99+1.97*u,.661-.34*v-.14*sin(Math.PI*u),front+.027+.033*v];
    for(const t of [-1,1])for(let j=-8;j<20;j++){
      const k=j/14;
      const a=t>0?Math.max(0,-k*4.4):Math.max(0,(k-1)*4.4),b=t>0?Math.min(1,(1-k)*4.4):Math.min(1,k*4.4);
      if(b<=a)continue;
      const pts=Array.from({length:5},(_,i)=>{const v=a+(b-a)*i/4;return hanging(k+t*v/4.4,v);});
      stroke(f,pts,.0065,'#646754',4,7);
    }
    for(let i=0;i<8;i++){const [x,y,z]=hanging(i/7,0);f.oval([x,y,z],[.053,.031,.028],i%2?'#d2b585':'#a46849',neutral,'wood');}
    for(let j=0;j<5;j++)rim(-.79,.10+j*.017,-.08,.15-j*.008,straw);
  }else if(style==='hearth'||style==='kiln'){
    for(let row=0;row<4;row++)for(const side of [-1,1])for(let k=0;k<3;k++){
      const x=side*(half*.41+k*.202+.035*(row%2));
      block(f,x,.14+row*(h-.20)/4,front-.05,.188,.085,.033,['#9b684f','#a97a60','#8b5e48'][(row+k)%3],'clay');
    }
    for(let i=0;i<5;i++)stroke(f,[[-.27+i*.11,.125,-.19],[-.24+i*.105,.11,.26]],[.035,.049],i%2?'#615145':'#8a755a',7);
    if(style==='hearth'){
      for(const x of [-.99,-.82,-.65])for(let i=0;i<3;i++){
        const a=i*.06;block(f,x+a,h-.142,front-.06,.025,.083,.039,'#524d41','iron');
      }
    }else{
      for(const end of [-1,1])for(let i=0;i<4;i++)f.oval([end*(half-.105),h+.002,(i-1.5)*.21],[.012,.004,.012],'#8f8e7d',neutral,'paper');
      const col='#ad855d';stroke(f,[[-.41,h-.09,front-.035],[-.40,h-.19,front+.02],[.34,h-.19,front+.02],[.35,h-.09,front-.035]],.020,col,7);
    }
  }else if(style==='chest'||style==='cargo'){
    for(let i=0;i<3;i++)for(let j=0;j<2;j++){
      const x=(i-1)*.805,y=.26+j*.29;
      block(f,x,y,front-.025,.75,.237,.058,style==='cargo'?'#79816c':j?'#aa7450':'#9a633f');
      for(const side of [-1,1])f.oval([x+side*.095,y+.016,front+.012],[.030,.030,.011],gold,neutral,'paper');
      stroke(f,[[x-.093,y+.012,front+.022],[x-.082,y-.044,front+.048],[x+.075,y-.047,front+.047],[x+.095,y+.012,front+.02]],.009,dark,6);
    }
    if(style==='cargo')for(const s of [-1,1]){
      block(f,s*.953,h*.49,front-.003,.066,h*.92,.042,'#474f49','iron');
      for(let i=0;i<5;i++)f.oval([s*.953,.12+.143*i,front+.018],[.010,.010,.005],gold);
    }
  }else if(style==='court'){
    block(f,0,h-.144,front-.085,width-.17,.20,.052,base,'wood');
    for(const dx of [-.97,0,.97]){
      for(let k=0;k<10;k++){
        const a=k*tau/10;
        f.oval([dx+.054*cos(a),h-.15+.054*sin(a),front-.055],[.034,.013,.005],gold,[0,0,a],'paper');
      }
      f.oval([dx,h-.15,front-.054],[.017,.017,.006],'#d7be78');
    }
    for(const side of [-1,1]){block(f,0,h-.011,side*(front-.007),width-.01,.014,.025,gold);block(f,0,.15,side*(lz-.018),2*lx,.038,.031,'#a14e38');}
  }else if(style==='tide'){
    // Layered wave brackets sweep towards a pearl in the pierced centre.
    for(const s of [-1,1])for(const face of [-1,1]){
      const pts=waveBracket(lx,s,face);
      stroke(f,pts,[.058,.082,.062,.047,.030,.008],'#48848b',8,24);
      stroke(f,pts.map(q=>[q[0],q[1]+.027,q[2]+face*.047]),[.006,.013,.014,.013,.008,.002],gold,5,21);
    }
    for(let i=0;i<16;i++){
      const x=(i-7.5)*.148,y=h-.091+.017*cos(i*.84);
      f.oval([x,y,front-.036],[.080,.055,.017],['#b6cbb6','#a4bfd8','#c5a7bc'][i%3],[0,0,.24*sin(i)],'paper');
    }
    for(const face of [-1,1])block(f,0,h-.03,face*(front-.006),width-.015,.016,.022,gold);
  }else if(style==='dryer'){
    for(let i=0;i<7;i++){
      const x=(i-3)*.272,hang=.18+.05*(i%3);
      stroke(f,[[x-.026,h+.938,-lz],[x-.015,h+.88,-lz+.015],[x,h+.94-hang,-lz+.018]],.008,edge,5);
      f.oval([x,h+.85-hang,-lz+.018],[.076,.112,.037],'#c9b698',[.14,0,.08*sin(i)],'rice');
    }
  }else if(style==='altar'){
    for(const s of [-1,1])for(const j of [-1,0,1]){
      const z=j*.154;
      stroke(f,[[s*(lx-.16),.18,z],[s*(lx-.15),.34,z+.028],[s*(lx-.12),.43,z+.031],[s*(lx-.10),.36,z-.015],[s*(lx-.16),.20,z]], [.009,.045,.008,.028,.009],n===14?'#779283':'#c59855',7,16);
    }
    if(n===14)for(const s of [-1,1])for(let i=0;i<3;i++)block(f,s*(lx-.17),h-.129-i*.045,0,.53-.1*i,.052,depth-.17*i,'#9e6046');
  }else if(style==='branch'){
    const contour=p.parts[0].outline;
    for(const side of [-1,1])for(let j=0;j<5;j++){
      const ring=(side===1?contour.slice(17):contour.slice(0,17)).map(([x,z],i)=>[x,h-.01-j*.025+.008*sin(i+j),z+side*.004]);
      stroke(f,ring,[.004,.009,.007,.004,.008,.005,.009,.006,.004,.007,.007,.004,.008,.007,.004,.007,.002],j%2?'#79563f':'#906343',5,35);
    }
    for(const side of [-1,1]){
      stroke(f,[[side*lx,.07,-lz],[side*lx,.24,-lz],[side*(lx-.21),.45,-lz*.48],[side*(lx-.35),h-.11,-.12]],[.044,.08,.052,.037],'#785343',8,19);
      for(let j=0;j<4;j++)stroke(f,[[side*(lx-.1),.10+.07*j,lz],[side*(lx-.07),.15+.07*j,lz+.033],[side*(lx-.06),.18+.07*j,lz]],[.003,.006,.002],'#57483e',5);
    }
  }else if(n===5){
    for(let j=0;j<3;j++){
      const x=(j-1)*.51;
      f.oval([x,.25,.225],[.255,.172,.21],'#c3a35e',neutral,'cloth');
      for(const k of [-1,1])stroke(f,Array.from({length:17},(_,i)=>[x+k*.13,.25+.148*cos(i*tau/16),.225+.185*sin(i*tau/16)]),.010,edge,5);
    }
  }else if(n===8||n===15){
    for(const side of [-1,1]){
      poleTie(side);if(n===8)block(f,side*(lx+.006),.26,front-.02,.058,.139,.06,'#774e32');
    }
    function poleTie(s){stroke(f,[[s*(lx+.08),.12,lz],[s*(lx-.23),.36,.08],[s*(lx-.38),h-.092,-lz]],[.030,.034,.03],n===15?'#b95d3e':'#9f7251',7,6);}
  }else if(n===1||n===10){
    for(let k=0;k<3;k++)dyedPanel(f,-.82+k*.32,h-.115,front-.022,.31,n===1?.24:.32,k===1?'#b9897c':n===1?'#6a8686':'#ad5744',k);
    if(n===10)stroke(f,[[-.73,.25,.04],[.16,.30,.02],[.83,.36,-.04]],[.029,.027,.041],'#8c6949',7);
  }
}
const tableTemplates=new Map();
export function createStoryWorktable(sceneNumber,chapterNumber=0,place){
  const n=Number(sceneNumber), key=n+'-'+(place||'');
  if(!tableTemplates.has(key)){
    const p=tablePlan(n,place),group=new T.Group();group.name=p.name;group.userData.worktop=p.top;
    group.userData.worktopThickness=p.parts[0].h;
    const batches=new Map();
    for(const part of p.parts){
      if(!batches.has(part.finish))batches.set(part.finish,[]);
      batches.get(part.finish).push(part);
    }
    for(const [material,parts] of batches){
      const mesh=collect(group,p.name+'・'+material,f=>{
        for(const q of parts){
          const tile=material==='clay'||material==='iron'?material:'wood';
          if(q.type==='box')block(f,q.x,q.y,q.z,q.w,q.h,q.d,q.tint,tile);
          else if(q.type==='slab'){
            const profile=new T.Shape(q.outline.map(([x,z])=>new T.Vector2(x,-z)));
            const shell=new T.ExtrudeGeometry(profile,{depth:q.h,bevelEnabled:false});
            const uv=shell.attributes.uv,loc=shell.attributes.position;
            for(let i=0;i<uv.count;i++)uv.setXY(i,.5+loc.getX(i)/p.width,.5+loc.getY(i)/p.depth);
            f.draw(shell,[0,q.y-q.h*.5,0],one,q.tint,[-Math.PI/2,0,0],'wood');
            timberGrain(f,shell,[p.width,p.depth,q.h],[0,0,q.h/2],[0,q.y,q.outline[0][1]]);
            shell.dispose();
          }
          else if(q.round){
            const first=f.uv.length;
            f.stroke([q.a,q.b],q.r,q.tint,'wood',10,3);
            // Stroke coordinates follow the circumference first. Turn the
            // swatch so the fibres follow the length of the bamboo or pole.
            for(let j=first;j<f.uv.length;j+=2){
              const around=(f.uv[j]*4-.015)/.97,along=(f.uv[j+1]*2-1-.014)/.972;
              f.uv[j]=(.015+.97*along)/4;f.uv[j+1]=(1.25+.225*(1-cos(tau*around)))/2;
            }
          }
          else {
            const from=new T.Vector3(...q.a),to=new T.Vector3(...q.b),axis=to.clone().sub(from);
            const rotation=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),axis.clone().normalize()));
            const beam=new T.BoxGeometry(q.r*1.78,axis.length(),q.r*1.78);
            const centre=from.lerp(to,.5).toArray(),side=q.r*1.78;
            f.draw(beam,centre,one,q.tint,[rotation.x,rotation.y,rotation.z],'wood');
            timberGrain(f,beam,[side,axis.length(),side],neutral,centre);beam.dispose();
          }
        }
      });
      if(material==='lacquer'||material==='iron'){
        const glossy=material==='lacquer';
        mesh.material=brushWash(new T.MeshPhysicalMaterial({map:mesh.material.map,vertexColors:true,roughness:glossy?.33:.56,metalness:glossy?.06:.49,clearcoat:glossy?.61:0}),.10);
      }
    }
    collect(group,p.name+'・仕口と意匠',f=>furnishTable(f,n,p));
    dressRegionalTable(group,p);
    tableTemplates.set(key,group);
  }
  return tableTemplates.get(key).clone();
}
function serving(parent,n,x,z,y,count=2,scale=1){
  const vessel=regionalVessel(n),group=new T.Group();group.add(vessel);
  const arrangement=n===9&&count>1?[[0,.00,.058,.78],[-.116,.00,-.038,.73],[.10,.00,-.070,.78],[.004,.135,-.017,.67]]:
    count===1?[[0,0,0,.97]]:[[-.113,0,.037,.70],[.122,0,-.039,.72]];
  for(const [dx,dy,dz,s] of arrangement)add(group,cake(n),dx,vessel.userData.floor+.002+dy,dz,n===10?.13:(dx>0?.23:-.26),s);
  group.userData.storyEvidence='food/'+n;
  add(parent,group,x,y,z,.13,scale);
}
function arrangement(n,chapter){
  if(n===11 && chapter>=8)return [];
  if(n===11 && chapter<6)return ['ledger','tag'];
  return ({
    1:['basket'],2:['steamer','tag'],3:['steamer','ledger'],4:['steamer','rice'],5:['rice','ledger'],
    6:['hinge','crate'],7:['tag','cloth'],8:['steamer','tag'],9:['cloth','tag'],10:['tag','crate'],
    11:['ledger','tag','ledger'],12:['rice','ledger'],13:['crate','ledger'],14:['tray','tag'],
    15:['tray','tag'],16:['crate','ledger'],17:['crate','bowl']
  })[n];
}
// Open folds give the hand a real place to stow and retrieve things. The
// inner pleats are dark enough that a parcel disappears below the turned hem.
export function createParcelWrap() {
  const key='travel/indigo-wrap';
  if(!templates.has(key)){
    const bag=new T.Group();
    const point=(a,t)=>{
      const r=.45+.55*Math.sin(t*2.23+.1),fold=1+.067*cos(a*7+.9*t)+.032*sin(11*a-t);
      return [.30*r*fold*cos(a),.36*t+.018*t*sin(3*a),.19*r*fold*sin(a)];
    };
    collect(bag,'藍の風呂敷・布目と返し縫い',f=>{
      grid(f,56,19,(u,v)=>point(u*tau,v),'#647f81','cloth');
      grid(f,56,8,(u,v)=>{
        const p=point(u*tau,1-v*.73);return [p[0]*(1-v*.26),p[1]-.005,p[2]*(1-v*.26)];
      },'#536b6a','cloth');
      grid(f,28,6,(u,v)=>{const p=point(u*tau,.27);return [p[0]*v,.092,p[2]*v];},'#465c5b','cloth');
      for(let i=0;i<36;i++){
        const a=i*tau/36;
        stroke(f,[point(a,.96),point(a+.082,.96)],.0027,'#c5bc9b',4,2);
      }
      for(const s of [-1,1]){
        stroke(f,[[s*.22,.332,-.023],[s*.25,.387,-.009],[s*.19,.453,-.040],[s*.124,.454,-.075]],
          [.029,.029,.021,.006],'#728b86',8);
      }
    });
    templates.set(key,bag);
  }
  return templates.get(key).clone();
}
export function createStoryStillLife(sceneNumber,chapterNumber=0,place){
  const n=Number(sceneNumber), g=new T.Group();
  if(!cakeNames[n])throw new RangeError('Unknown settlement '+sceneNumber);
  const table=createStoryWorktable(n,chapterNumber,place);
  g.name=table.name;g.add(table);
  const y=g.userData.worktop=table.userData.worktop;
  if(place==='charcoal'){
    add(g,createStoryEvidence('bowl','mountain-tea'),-.18,y,.03,.1,1.1);
    add(g,createStoryEvidence('steamer','prototype'),.66,y,-.06,-.17,.68);
    return g;
  }
  if(place==='shore'||(place==='teahouse'&&chapterNumber<8)){
    const shore=place==='shore';
    add(g,createStoryEvidence(shore?'hinge':'tray',shore?'broken-hinge':'kyoto-set'),-.20,y,.02,-.08,1.25);
    if(shore){
      // Two narrow bearing strips leave room beneath the broken iron for
      // the turtle's lower beak to lift it without scraping the boat plank.
      const blockRest=collect(g,'蝶番を受ける舟大工の台木',f=>{
        for(const x of [-.068,.068])block(f,x,.145,0,.058,.29,.175,'#9c7954','wood',.007);
        block(f,0,.088,0,.178,.090,.054,'#765a40','wood',.005);
        for(const x of [-.068,.068])block(f,x,.295,0,.059,.010,.178,'#be9d74','wood',.002);
      },-.99,y,.34);
      Object.assign(blockRest.userData,{storyStorage:true,storyEvidence:'台木',worktop:.30});
    }
    return g;
  }
  const exhibits=arrangement(n,chapterNumber);
  if(!exhibits.length){
    for(let i=0;i<17;i++)serving(g,i+1,((i%6)-2.5)*.407,(Math.floor(i/6)-1)*.31,y,1,.50);
  }else if(n===1){
    add(g,createStoryEvidence('basket'),-.35,y,.032,0,1.08);
    collect(g,'継ぎのある冷まし台と十二の敷き跡',f=>{
      for(const x of [-.27,.27])block(f,x,.023,0,.071,.046,.56,edge);
      for(let i=0;i<4;i++)block(f,0,.061,(i-1.5)*.137,.67,.038,.133,'#ddc69d');
      for(let j=0;j<3;j++)for(let i=0;i<4;i++)leaf(f,(i-1.5)*.153,.083,(j-1)*.155,.141,.036,.14*(i%2),true);
      block(f,.249,.084,.182,.137,.007,.026,edge);
    },.79,y,-.03);
  }else{
    // Persistent work surfaces hold ordinary tools. Dated replies, joint
    // signatures and the accepted return ledger appear in their authored clues.
    let main;
    if(n===4)main=createStoryEvidence('steamer','repair-body');
    else if(n===2){main=new T.Group();oldSteamer(main);}
    else if(n===12){main=new T.Group();teaAndBundle(main);}
    else if(n===13){main=new T.Group();waterBowl(main);}
    else main=createStoryEvidence(exhibits[0],n===8?'prototype':undefined);
    main.userData.storyEvidence=exhibits[0];
    add(g,main,-.56,y,-.035,-.08,1.20);
    add(g,createStoryEvidence(exhibits[1]),.17,y,.195,-.16,.91);
    if(exhibits[2])add(g,createStoryEvidence(exhibits[2]),.77,y,-.028,-.27,.88);
    else serving(g,n,.85,-.065,y,2,1);
  }
  return g;
}
export function animateStoryStillLife(group,time,engaged=false){
  const joined=group.getObjectByName('合わせ餅');
  if(joined){
    const lift=engaged?.5-.5*cos(time*1.48):0;
    joined.position.y=.071+.31*lift;
    joined.rotation.x=-2.47*lift;
  }
  const top=group.getObjectByName('蒸し箱の上段');
  if(top){
    const lift=engaged?.5-.5*cos(time*1.35):0;
    top.position.y=.171+.25*lift;top.position.x=-.10*lift;
  }
}


// Examination poses are absolute. Reopening a clue or switching between the
// three steam tests cannot accumulate offsets on the evidence model.
export function setEvidencePose(group,mode){
  const joined=group.getObjectByName('合わせ餅');
  if(joined){
    const lift=mode==='lift'?1:0;
    joined.position.set(0,.071+.49*lift,-.218+.15*lift);
    joined.rotation.x=-2.08*lift;
  }
  const upper=group.getObjectByName('蒸し箱の上段');
  if(upper){
    const single=mode==='single',spaced=mode==='spaced';
    upper.position.set(single?-.65:0, single?0:spaced?.212:.171,0);
    for(let i=0;i<3;i++){
      const rail=group.getObjectByName('取り外し桟'+i);
      if(rail)rail.position.set(spaced?(i-1)*.213:.399+i*.058,spaced?.169:0,0);
    }
  }
}
// The apron sits on the same wrapped elliptic torso as the haori. A selvedge,
// stitches, tie and rows of resist-dyed marks stay on the moving body.
export function tieStoryApron(torso,kind,index,occupation){
  const robe=residentRobeSurface(kind);
  const cloths=['#aeb4a5','#9ba5a3','#c4ad98','#bcb7a0','#cbbbad'];
  const booking=occupation==='もち寄り祭の世話役';
  const toolBelt=/細工|木工|船大工|蒸籠/.test(occupation);
  const darkBand=booking?'#8c6b58':toolBelt?'#89826b':cloths[index%cloths.length];
  const swath=(u,v,lift=0)=>{
    const a=(u-.5)*(booking?1.52:1.97),t=.018+.37*v;
    const p=robe(a,t,.025+.014*(1-v)+lift);
    p[1]-=.037*(1-v);
    return p;
  };
  collect(torso,'腰に結った仕事布',f=>{
    grid(f,26,11,(u,v)=>swath(u,v),darkBand,'cloth');
    for(const v of [.045,.079,.87])grid(f,26,1,(u,t)=>swath(u,v+.018*t,.003),'#d8c8a8','cloth');
    if(booking){
      for(let j=0;j<5;j++){
        const a=j*tau/5,from=swath(.5+.041*cos(a),.45+.030*sin(a),.006);
        f.oval(from,[.013,.013,.003],'#d9c6a0',[0,0,0],'rice');
      }
    }else{
      for(let j=0;j<6;j++){
        const u=.13+j*.145;
        stroke(f,[swath(u-.018,.21,.004),swath(u,.24,.005),swath(u+.018,.21,.004)],.002,'#d9c8a8',4,5);
      }
    }
    const knot=swath(.89,.93,.012);
    for(const s of [-1,1]){
      const [x,y,z]=knot;
      stroke(f,[knot,[x+s*.035,y+.031,z+.013],[x+s*.074,y+.007,z+.011],[x+s*.028,y-.008,z+.008]],[.009,.014,.010,.0025], '#8d7b60');
      stroke(f,[knot,[x+s*.021,y-.041,z+.008],[x+s*.042,y-.079,z+.016]],[.008,.008,.002], '#8d7b60');
    }
  });
}

// A human-scale glazed water vessel rests in a timber sling. Its carrying
// poles and uncovered water distinguish it from the lidded food jar.
export function festivalWaterVessel(parent){
  collect(parent,'海客を迎える担ぎ鉢',f=>{
    for(const x of [-.50,.50]){
      block(f,x,.134,0,.103,.214,.977,'#a58b6a');
      stroke(f,[[x,.167,-1.22],[x,.164,-.68],[x,.146,0],[x,.164,.68],[x,.167,1.22]],[.032,.044,.048,.044,.032],straw,9,28);
      for(const z of [-.91,.91])for(let j=0;j<4;j++){
        const zz=z+j*.018;
        stroke(f,[[x-.031,.157,zz],[x-.019,.195,zz],[x+.022,.198,zz],[x+.036,.157,zz]],.005,edge,5,6);
      }
    }
    for(const z of [-.37,.37])block(f,0,.207,z,1.21,.105,.127,'#c3aa82');
    turned(f,0,.243,0,[[.001,.005],[.31,.005],[.34,.030],[.41,.043],[.57,.110],
      [.694,.209],[.770,.327],[.788,.427],[.777,.471],[.749,.483],[.724,.464],[.732,.421],[.709,.330],[.603,.184],[.399,.079],[.001,.064]],'#9daf9f','rice',64);
    for(const [h,r] of [[.324,.765],[.413,.786],[.455,.779]])ring(f,0,.243+h,0,r,.0052,'#778d80');
    for(const side of [-1,1]){
      stroke(f,[[side*.75,.653,-.126],[side*.813,.685,-.105],[side*.847,.705,0],[side*.811,.685,.105],[side*.75,.653,.126]],.021,'#8b9e8d');
      for(const z of [-.39,.39])stroke(f,[[side*.50,.156,z],[side*.55,.206,z],[side*.582,.264,z],[side*.50,.294,z]],.012,'#a1885b');
    }
  });
  const water=new T.Mesh(new T.CircleGeometry(.727,64),new T.MeshPhysicalMaterial({
    color:'#8ea99b',transparent:true,opacity:.48,roughness:.28,clearcoat:.32,depthWrite:false}));
  water.rotation.x=-Math.PI/2;water.position.y=.645;water.name='客鉢の水面';water.renderOrder=1;parent.add(water);
  collect(parent,'鉢の縁に寄る細波',f=>{
    for(let j=0;j<4;j++){
      const a=j*1.58+.19,pts=Array.from({length:9},(_,i)=>{
        const ang=a+i*.057,r=.684+.009*sin(ang*8);return [r*cos(ang),.647,r*sin(ang)];
      });
      stroke(f,pts,[.001,.002,.003,.003,.0025,.002,.0018,.001,.0005],'#c7cdb5',4);
    }
  });
}
