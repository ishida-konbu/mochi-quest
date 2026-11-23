import * as T from './vendor/three.module.min.js';
import { brushWash } from './scroll-sculpt.js';

// Butt/foot ring, shoulder, lip, and the actual well are one continuous skin.
// The food rests at exactly the height of its well, including the court's footed dishes.
const wares=[null,
  ['桜川の舟皿','boat',.37,.209,.039,.085,'#925a45','#e8c7a4',0,'wood'],
  ['笹編みの長目皿','leaf',.355,.19,.028,.072,'#739043','#d4c693',1,'bamboo'],
  ['鉄釉の厚手角皿','chamfer',.310,.247,.045,.092,'#f0eae0','#ffdfbd',null,'stoneware'],
  ['峠の鉄絵鉢','round',.303,.269,.062,.162,'#864531','#d5a867',5,'glaze'],
  ['稲穂色の浅箕','leaf',.319,.245,.032,.077,'#a2783b','#dfbf82',1,'bamboo'],
  ['浜千鳥の長皿','round',.350,.232,.047,.103,'#246376','#f1e3ba',2,'glaze'],
  ['雪輪の白釉鉢','snow',.301,.278,.065,.154,'#668096','#e5edf1',0,'glaze'],
  ['楓文の織部丸皿','round',.300,.300,.038,.094,'#547d4f','#bd965a',5,'glaze'],
  ['薄に月の高杯','moon',.306,.275,.123,.169,'#a47c31','#ead8a0',3,'lacquer'],
  ['二色の日輪皿','sun',.311,.252,.045,.092,'#a64537','#e6b880',0,'lacquer'],
  ['菊唐草の朱塗り折敷','court',.329,.259,.055,.085,'#a93629','#ebbd66',3,'lacquer'],
  ['桃花形の薄紅皿','flower',.309,.269,.047,.128,'#a76b6b','#eab9a8',0,'glaze'],
  ['青螺鈿の潮水貝皿','shell',.351,.285,.064,.140,'#296c77','#dfdcb9',4,'shell'],
  ['蓮弁の青磁台皿','lotus',.339,.277,.102,.145,'#4a7d73','#d5cf9e',1,'glaze'],
  ['朱縁の方形折敷','square',.286,.243,.048,.077,'#aa4c26','#dbc293',0,'wood'],
  ['飴釉の楕円鉢','round',.338,.226,.062,.123,'#74512b','#caa463',5,'glaze'],
  ['焼締め六角皿','hex',.317,.270,.036,.099,'#765442','#b5b498',5,'glaze'],
];
const cache=new Map(), textures=new Map(), tau=2*Math.PI;
function paint(row){
  if(!textures.has(row)){
    let original=textures.get('friezes');
    if(!original){original=new T.TextureLoader().load(new URL('./assets/world/mochiyori-glazes.webp',import.meta.url).href,()=>{for(const texture of textures.values())texture.needsUpdate=true;});original.colorSpace=T.SRGBColorSpace;textures.set('friezes',original);}
    const t=original.clone(); t.wrapS=T.RepeatWrapping; t.anisotropy=4;
    t.repeat.set(2,.145); t.offset.set(.02,1-(row+1)/6+.012); t.needsUpdate=true;textures.set(row,t);
  }
  return textures.get(row);
}
function outline(type,a){
  const c=Math.cos(a),s=Math.sin(a),corner=(n,turn=0)=>Math.cos(Math.PI/n)/Math.cos(((a+turn+Math.PI/n+2*tau)%(tau/n))-Math.PI/n);
  switch(type){
    case 'square':case 'court':return 1/(Math.abs(c)**7+Math.abs(s)**7)**(1/7);
    case 'hex':return .10+.9*corner(6);
    case 'chamfer':return 1/Math.max(Math.abs(c),Math.abs(s),(Math.abs(c)+Math.abs(s))/1.82);
    case 'boat':return 1-.13*Math.sin(2*a)**2+.055*Math.cos(2*a);
    case 'leaf':return 1-.17*Math.sin(2*a)**2;
    case 'snow':return .99+.048*Math.cos(6*a)-.016*Math.cos(12*a);
    case 'flower':return .96+.102*Math.cos(5*a)-.031*Math.cos(10*a);
    case 'shell':return 1+.20*s+.061*Math.cos(12*a)*(.5+.5*s);
    case 'lotus':return .99+.045*Math.cos(10*a);
    default:return 1;
  }
}
const colour=(s)=>new T.Color(s);
function marketStoneware(){
  const loader=new T.TextureLoader();
  const clay=loader.load(new URL('./assets/world/market-ironware.webp',import.meta.url).href);
  const surface=loader.load(new URL('./assets/world/market-ironware-surface.webp',import.meta.url).href);
  clay.colorSpace=T.SRGBColorSpace;
  for(const map of [clay,surface]){
    map.wrapS=map.wrapT=T.MirroredRepeatWrapping;
    map.anisotropy=4;
  }
  // Red encodes small pits and mineral grains; green carries the dry-to-burnished finish.
  return brushWash(new T.MeshStandardMaterial({map:clay,bumpMap:surface,bumpScale:.00065,
    roughnessMap:surface,roughness:1,vertexColors:true,side:T.DoubleSide}),.045);
}
function slabTextureRadii(levels,span){
  // Lay the clay surface flat from the well, over the lip and down the wall.
  // Arc length keeps the grain visible on the nearly vertical edge.
  const radii=levels.map(([r])=>r);
  const foot=4;
  for(let j=levels.length-2;j>=foot;j--){
    const [r,y]=levels[j],[nextR,nextY]=levels[j+1];
    radii[j]=radii[j+1]+Math.hypot(nextR-r,(nextY-y)/span);
  }
  for(let j=0;j<foot;j++)radii[j]*=radii[foot]/levels[foot][0];
  return radii;
}
function splitBamboo(w,d,floor,h,form,n){
  const positions=[],cols=[],faces=[],angle=n===2?.08:.58,cs=Math.cos(angle),sn=Math.sin(angle);
  const shades=(n===2?['#b8b77b','#969c5f','#cab078']:['#d6b570','#b29455','#dec78b']).map(colour);
  const heights=[[0,floor],[.57,floor+.002],[.77,floor+.017],[.939,h*.94],[.967,h+.010]];
  function at(x,z,lift){
    const a=Math.atan2(z,x),R=Math.hypot(x,z)/outline(form,a);
    if(R>.953)return null;
    const j=heights.findIndex(([r])=>r>=R);
    const [r0,y0]=heights[j-1]||heights[0],[r1,y1]=heights[j];
    const mix=r1===r0?0:(R-r0)/(r1-r0),bow=.041*Math.abs(Math.cos(a))**4*R**4;
    return [x*w,y0+(y1-y0)*mix+bow+lift,z*d];
  }
  for(let family=0;family<2;family++)for(let i=-14;i<=14;i++){
    const colour=shades[Math.abs(i+family)%3];let prev=null;
    for(let j=0;j<=112;j++){
      const along=(j/112-.5)*2.48,cross=i*.077,lift=.0035+.0018*Math.cos(Math.PI*(along/.077+i+family));
      const pair=[-.014,.014].map(offset=>{
        const u=family?cross+offset:along,v=family?along:cross+offset;
        return at(cs*u-sn*v,sn*u+cs*v,lift);
      });
      if(!pair[0]||!pair[1]){prev=null;continue;}
      const ix=positions.length/3;for(const point of pair){positions.push(...point);cols.push(colour.r,colour.g,colour.b);}
      if(prev!==null)faces.push(prev,prev+1,ix,prev+1,ix+1,ix);
      prev=ix;
    }
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geo.setAttribute('color',new T.Float32BufferAttribute(cols,3));geo.setIndex(faces);geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,brushWash(new T.MeshStandardMaterial({vertexColors:true,roughness:.91,side:T.DoubleSide}),.10));
  mesh.name='経緯に通した竹ひご';return mesh;
}
function build(n){
  const [name,form,w,d,floor,h,coat,lip,row,kind]=wares[n], g=new T.Group(); g.name=name;g.userData.floor=floor;
  const stoneware=kind==='stoneware';
  const pigment=colour(coat), trim=colour(lip), biscuit=stoneware?colour('#f4d5b4'):kind==='glaze'?colour('#bda883'):pigment.clone().multiplyScalar(.72);
  const glossy=kind==='shell'||kind==='lacquer'||kind==='glaze';
  // The market dish is pressed from a slab. Its broad foot, nearly upright
  // outside wall and thumb-wide rim are visible even below the painted band.
  const levels=stoneware
    ? [[0,.009],[.52,.009],[.57,.002],[.71,.002],[.74,.016],[.89,.027],[.98,.047],[1,.066],[1,h-.005],[.99,h],[.91,h],[.89,h-.006],[.79,floor+.012],[.68,floor+.001],[.01,floor]]
    : [[.00,.006],[.29,.006],[.32,.002],[.43,.002],[.445,floor*.62],[.65,floor*.67],[.87,h*.57],[.97,h*.82],[1,h*.99],[.994,h+.006],[.967,h+.010],[.939,h*.94],[.77,floor+.017],[.57,floor+.002],[.01,floor]];
  const pos=[],normalColours=[],uv=[],indices=[],sideCount=100;
  const slabRadii=stoneware && slabTextureRadii(levels,(w+d)/2);
  for(let j=0;j<levels.length;j++){
    const [r,y]=levels[j];for(let i=0;i<=sideCount;i++){
      const u=i/sideCount,a=u*tau,c=Math.cos(a),s=Math.sin(a),R=r*outline(form,a);
      const bow=form==='boat'||form==='leaf'? .041*Math.pow(Math.abs(c),4):form==='shell'?.029*(s+1)/2+.012*Math.cos(12*a):0;
      const rib=form==='shell'?.006*Math.cos(12*a)*r*r:0;
      pos.push(w*R*c,y+bow*r**4+rib,d*R*s);
      const col=(j<=2?biscuit:j===9||j===10?trim:pigment).clone();
      if(j===7)col.lerp(trim,.23);
      if(form==='shell')col.lerp(colour(c>0?'#bcd9ad':'#b8a0c4'),.31+.22*Math.cos(12*a+.5));
      if(j===12||j===13)col.lerp(trim,kind==='lacquer'?.06:.22);
      const hand=1+.021*Math.sin(13*a+r*7)+.008*Math.sin(a*43+3*r);
      let exposure=hand;
      if(stoneware){
        // The thinner slip on a rubbed lip and the exposed foot reveal warmer clay.
        const rim=j===9||j===10;
        const wear=rim?1.50+.48*s*c+.20*Math.cos(3*a+.5):j<=4?1.64:j===11?1.02:1.24;
        exposure*=wear;
        const reach=slabRadii[j]*outline(form,a)/.73;
        uv.push(.5+w*c*reach,.5+d*s*reach);
      }else uv.push(u,Math.min(1,Math.max(0,j>=11?(13-j)/2:(j-5)/3)));
      normalColours.push(col.r*exposure,col.g*exposure,col.b*exposure);
    }
  }
  const geometry=new T.BufferGeometry();
  for(let j=0;j<levels.length-1;j++){
    const start=indices.length;
    for(let i=0;i<sideCount;i++){const a=j*(sideCount+1)+i;indices.push(a,a+sideCount+1,a+1,a+1,a+sideCount+1,a+sideCount+2);}
    if(!stoneware)geometry.addGroup(start,indices.length-start,((j>=5&&j<8)||(j>=11&&j<13))&&kind!=='bamboo'?1:0);
  }
  // Merge adjacent strips using the same finish to keep the number of draw calls independent of the profile resolution.
  const groups=[];for(const strip of geometry.groups){const last=groups.at(-1);if(last?.materialIndex===strip.materialIndex)last.count+=strip.count;else groups.push({...strip});}geometry.groups=groups;
  geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setAttribute('color',new T.Float32BufferAttribute(normalColours,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  // The frieze wraps at these duplicate vertices, but the glazed surface is continuous.
  const normals=geometry.attributes.normal, joined=new T.Vector3(), other=new T.Vector3();
  for(let j=0;j<levels.length;j++){
    const first=j*(sideCount+1),last=first+sideCount;
    joined.fromBufferAttribute(normals,first).add(other.fromBufferAttribute(normals,last)).normalize();
    normals.setXYZ(first,joined.x,joined.y,joined.z);
    normals.setXYZ(last,joined.x,joined.y,joined.z);
  }
  let finish;
  if(stoneware){
    finish=marketStoneware();
  }else{
    const enamel=brushWash(new T.MeshPhysicalMaterial({vertexColors:true,side:T.DoubleSide,roughness:glossy?.32:.81,clearcoat:glossy?.53:.06,clearcoatRoughness:.29,metalness:kind==='shell'?.16:0}),.075);
    const frieze=brushWash(new T.MeshPhysicalMaterial({map:paint(row),side:T.DoubleSide,roughness:.48,clearcoat:.28}),.07);
    finish=[enamel,frieze];
  }
  const body=new T.Mesh(geometry,finish);body.castShadow=body.receiveShadow=true;g.add(body);
  if(kind==='bamboo')g.add(splitBamboo(w,d,floor,h,form,n));
  if(kind==='shell'){
    const rim=new T.Shape(),level=floor+.013;
    for(let i=0;i<=sideCount;i++){
      const a=i*tau/sideCount,r=.698*outline(form,a),x=w*r*Math.cos(a),z=d*r*Math.sin(a);
      if(i===0)rim.moveTo(x,-z);else rim.lineTo(x,-z);
    }
    const film=new T.Mesh(new T.ShapeGeometry(rim),new T.MeshPhysicalMaterial({color:'#8ec8cd',roughness:.15,
      clearcoat:1,transparent:true,opacity:.33,depthWrite:false,side:T.DoubleSide}));
    film.name='貝皿に張った薄い水';film.position.y=level;film.rotation.x=-Math.PI/2;g.add(film);
  }
  return g;
}
export function regionalVessel(n){if(!cache.has(n))cache.set(n,build(n));return cache.get(n).clone();}

// A hand's breadth of maki-e or nacre is fitted into the rim of the worktop.
// The central pressing surface stays clear of utensils.
export function dressRegionalTable(group,p){
  const royal=p.style==='tide',court=p.style==='court',coast=p.style==='hull';
  if(!royal&&!court&&!coast)return;
  const material=brushWash(new T.MeshPhysicalMaterial({map:paint(royal?4:court?3:2),roughness:coast?.75:.37,
    metalness:royal?.11:0,clearcoat:coast?0:.56,iridescence:royal?.38:0,side:T.DoubleSide}),.04);
  function ribbon(name,w,h,x,y,z,rotX,rotZ=0){
    const mesh=new T.Mesh(new T.PlaneGeometry(w,h),material);mesh.name=name;mesh.position.set(x,y,z);
    mesh.rotation.set(rotX,0,rotZ);group.add(mesh);
  }
  if(coast){
    ribbon('浜千鳥を染めた引き綱の当て布',1.65,.072,0,p.top-.054,p.depth*.5-.014,0);
  }else{
    for(const side of [-1,1]){
      ribbon(royal?'貝片を伏せた潮の縁':'菊唐草の蒔絵',p.width-.08,royal?.075:.053,0,p.top+.0012,side*(p.depth*.5-.064),-Math.PI/2);
      ribbon('木口の細縁',p.depth-.19,.026,side*(p.width*.5-.047),p.top+.0013,0,-Math.PI/2,Math.PI/2);
    }
    ribbon(royal?'螺鈿の波頭':'卓縁の菊唐草',p.width-.13,royal?.044:.030,0,p.top-.051,p.depth*.5+.001,0);
  }
}
