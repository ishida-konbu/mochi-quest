// A five-figure procession, drawn in three dimensions. The silhouettes alternate
// between the lantern, tall cap, white hood, paper parasol and horizontal flute.
import * as T from './vendor/three.module.min.js';
import { terrainHeight, wrapDelta } from './terrain.js';
import { WEDDING_SITES, weddingPoint } from './pilgrimage-layout.js';
import { brushWash, surfaceGrain } from './scroll-sculpt.js';
import { sculpture, brushStroke } from './pilgrimage-pigment.js';

const {sin,cos,PI}=Math, tau=2*PI;
const soot='#37352e', fur='#b67e53', ivory='#eed9ae', silk='#eee5cb', cord='#ae4c39';
const roles=['lantern','groom','bride','parasol','flute'];
const dress={lantern:'#99785a',groom:'#404f52',bride:'#eee5cb',parasol:'#71826f',flute:'#a67059'};

function panel(rows,columns,point) {
  const xyz=[], faces=[];
  for(let j=0;j<=rows;j++) for(let i=0;i<=columns;i++) {
    xyz.push(...point(i/columns,j/rows));
    if(i<columns&&j<rows){
      const a=j*(columns+1)+i,b=a+columns+1;
      faces.push(a,b,a+1,a+1,b,b+1);
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
  g.setIndex(faces);g.computeVertexNormals();return g;
}

// Crown and snout are one tapering profile. The muzzle markings and narrowed
// eyes sit on the curved cheeks at both sides of the face.
function face(role){
  const s=sculpture(),white=role==='bride',coat=white?'#dfc8a3':fur;
  const stations=[[-.232,.003,.007,.054],[-.158,.160,.19,.064],[-.064,.222,.21,.069],
    [.070,.222,.184,.055],[.168,.169,.131,.009],[.302,.086,.069,-.036],
    [.393,.054,.048,-.041],[.425,.017,.022,-.037]];
  const profile=new T.CatmullRomCurve3(stations.map(([z,w,h])=>new T.Vector3(w,h,z)));
  const mids=new T.SplineCurve(stations.map(([z,, ,y])=>new T.Vector2(z,y)));
  const skin=(u,v,lift=0)=>{
    const q=profile.getPoint(u), y=mids.getPoint(u).y;
    return [(q.x+lift)*cos(v),y+(q.y+lift)*sin(v),q.z];
  };
  s.add(panel(30,32,(u,v)=>skin(v,u*tau)),coat);
  for(const side of [-1,1]){
    const flank=(u,v,d=.004)=>skin(u,side===1?v:PI-v,d);
    // A pale cheek sweeps from the ear to the lip in a long taper.
    s.add(panel(9,24,(u,v)=>{
      const t=.14+.82*u, top=-.52+.65*sin(u*PI*.83)-.12*u;
      return flank(t,-1.55+(top+1.55)*v,.004);
    }),white?'#f5e7ca':ivory);
    const ear=new T.Shape(); ear.moveTo(-.112,-.025);
    ear.quadraticCurveTo(-.139,.094,-.087,.318);ear.quadraticCurveTo(.047,.235,.117,.007);
    ear.quadraticCurveTo(0,-.049,-.112,-.025);
    const earOuter=new T.ExtrudeGeometry(ear,{depth:.038,bevelEnabled:false,curveSegments:7});
    if(!white) s.add(earOuter,coat,side*.15,.202,-.08,.94,1,1,-.1,.64*side,-.30*side);
    if(!white) s.add(earOuter,'#735447',side*.16,.223,-.031,.57,.73,.47,-.1,.64*side,-.30*side);
    if(!white) s.stroke(soot,[[side*.228,.213,-.018],[side*.231,.343,-.041],[side*.237,.493,-.057]],[.009,.01,.002],9);
    const line=(knots,widths,color)=>s.stroke(color,knots.map(([u,v])=>flank(u,v,.012)),widths,13);
    const lid=(t,v)=>.25-.105*t+(.166*v-.079)*sin(PI*t);
    s.add(panel(5,18,(u,v)=>flank(.376+.18*u,lid(u,v),.016)),'#e4cc9d');
    s.add(panel(5,10,(u,v)=>flank(.443+.036*u,.209+sin(PI*u)*(v-.5)*.142,.024)),soot);
    line([[.35,.25],[.395,.292],[.455,.291],[.518,.231],[.566,.135]],[.001,.008,.011,.009,.001],soot);
    line([[.33,.512],[.408,.558],[.512,.455]],[.002,.010,.002],white?cord:'#7c513d');
    // Three tufts break the pale cheek line and turn the whiskers toward the muzzle.
    for(let k=0;k<3;k++){
      const t=.235+k*.038,v=-.26-k*.13;
      const base=flank(t,v,.009), end=flank(t+.15,v-.094,.008);
      const tip=[base[0]+side*(.033+k*.004),base[1]-.083+k*.012,base[2]-.06];
      s.add(panel(2,6,(u,w)=>end.map((n,h)=>n+(base[h]-n)*u+(tip[h]-base[h])*u*w)),ivory);
      s.stroke('#88684e',[end,tip],[.005,.0006],5);
    }
    line([[.52,-.48],[.66,-.53],[.82,-.39],[.94,-.20]],[.003,.014,.012,.003],soot);
    for(let k=0;k<3;k++){
      const q=flank(.69+k*.038,-.20,.012);
      s.stroke('#695447',[q,[q[0]+side*.064,q[1]+.006-k*.017,q[2]+.014],
        [q[0]+side*(.126+k*.021),q[1]+.016-k*.024,q[2]-.015]],[.006,.005,.0007],7);
    }
  }
  s.ball(soot,0,-.030,.399,.054,.036,.041);
  if(white){
    // An open hood: the turned rim frames the face, with real air behind its
    // front edge. Silk meets at the nape and hangs over the upper back.
    const hood=(u,v)=>{
      const a=u*tau,theta=.018+v*(2.09+.16*cos(a));
      return [.359*sin(theta)*sin(a),.06+.32*sin(theta)*cos(a)-.11*v*(1-cos(a))*.5,
        -.164-.31*cos(theta)+.070*cos(a)*v];
    };
    s.add(panel(16,54,hood),silk);
    for(const d of [-1,1]){
      for(let k=0;k<5;k++){const a=k*tau/5;s.ball(k%2?cord:'#ca9270',d*.285+.012*sin(a),.25+.030*cos(a),.015+.030*sin(a),.020,.027,.025);}
      s.ball('#d2a75d',d*.304,.253,.018,.019,.017,.019);
    }
    const rim=Array.from({length:23},(_,i)=>hood(i/22,1));
    s.stroke('#ae6952',rim,[.003,.023,.027,.026,.003],41);
    for(const side of [-1,1])s.stroke('#baa889',[[side*.27,.18,.157],[side*.31,.101,.132],
      [side*.335,-.031,.02],[side*.304,-.16,-.094]],[.002,.009,.011,.002],12);
  } else if(role==='groom'){
    s.add(new T.LatheGeometry([[.138,0],[.155,.045],[.112,.15],[.088,.29],[.029,.49],[.004,.51]]
      .map(([r,y])=>new T.Vector2(r,y)),16),'#363c36',0,.163,-.081,1,1,1,-.34);
    s.stroke('#82816d',[[.067,.277,-.118],[.053,.44,-.15],[.014,.608,-.215]],[.009,.006,.002],10);
  } else if(role==='lantern'){
    s.add(new T.ConeGeometry(.46,.23,24),'#ad9364',0,.346,-.075,1,1,.89,-.29);
  }
  return s.finish();
}

function fan(s,x,y,z,scale){
  const a0=-.94,a1=.92;
  const pts=(u,v)=>{
    const a=a0+(a1-a0)*u, radius=(.27+.67*v)*scale;
    return [x+radius*sin(a),y+radius*cos(a),z+.035*cos(u*PI*14)*v+.028*v];
  };
  s.add(panel(3,28,pts),'#ceb583');
  for(let i=0;i<=8;i++){
    const end=pts(i/8,1);
    s.stroke(i%2?'#907052':'#a45c45',[[x,y,z],pts(i/8,.18),end],[.014,.008,.002],10);
  }
  const edge=Array.from({length:16},(_,i)=>pts(i/15,1));s.stroke(soot,edge,[.004,.009,.004],22);
}
function body(role){
  const s=sculpture(),bride=role==='bride',groom=role==='groom',dye=dress[role];
  const hem=bride?.105:groom?.226:.357;
  const radius=new T.SplineCurve([[.1,.348],[.22,.34],[.48,.285],[.72,.224],[.84,.20],[1.06,.25],[1.205,.245],[1.38,.118]]
    .map(([y,r])=>new T.Vector2(r,y)));
  const cloth=(u,v,lift=0)=>{
    const a=u*tau,sec=radius.getPointAt(v),w=sec.x+(.018+.024*(1-v))*cos(7*a+.9*v)*Math.sin(v*PI+.32);
    const train=bride?Math.max(0,-cos(a))**2*(1-v)**5:0;
    return [sin(a)*(w+lift),hem+(1.37-hem)*(sec.y-.10)/1.28+.036*(1-v)*sin(3*a),
      cos(a)*(w*.79+lift)-.34*train+.037*v];
  };
  s.add(panel(19,50,cloth),dye);
  function clothline(coords,widths,tint,lift=.007){
    s.stroke(tint,coords.map(([u,v])=>cloth(u,v,lift)),widths,15);
  }
  // Turned-back collar, double lapel and long pleats have dark lifted tips.
  for(const side of [-1,1]){
    const u=n=>side*n;
    clothline([[u(.262),.955],[u(.153),.904],[u(.068),.817],[u(-.020),.729]], [.032,.037,.031,.018],
      bride?'#bda575':'#e1d4b3',.015);
    clothline([[u(.25),.954],[u(.14),.897],[u(.061),.81],[u(-.022),.722]],[.002,.010,.009,.002],soot,.042);
    for(let i=0;i<3;i++){
      const q=.053+.097*i;
      clothline([[u(q*.74),.598],[u(q*.82+.014),.44],[u(q+.013),.19],[u(q+.021),.031]],
        [.002,.011,.017,.002],bride?'#beab8b':'#464941');
    }
  }
  s.add(panel(2,42,(u,v)=>cloth(u,.59+v*.099,.018)),bride?'#d2ba81':groom?'#b8a786':'#a86948');
  const paw=(d,xx,yy,zz)=>{
    s.ball('#ddc298',xx,yy,zz,.078,.058,.107,-.3,0,d*.10);
    for(let k=0;k<3;k++)s.stroke('#7c6450',[[xx+d*.015,yy+.017,zz+.056],
      [xx+d*(.028+k*.021),yy+.015,zz+.096-k*.013]],[.006,.001],5);
  };
  for(const side of [-1,1]){
    const hand=bride?[side*.113,1.04,.33]:role==='flute'?[side*.245,1.34,.296]:
      [side*(role==='lantern'&&side===1?.313:.267),side>0&&!groom?1.18:.98,.285];
    const sx=side*.21, sleeveColor=bride?'#eee1c3':dye;
    // Weighted rectangular sleeves hang off the wrist while the fox holds its prop.
    const clothSleeve=(u,v)=>{
      const a=u*tau,w=.13+.032*sin(v*PI),depth=.129;
      const xx=sx+(hand[0]-sx)*v+side*.089*sin(PI*v);
      return [xx+w*Math.sign(sin(a))*Math.abs(sin(a))**.53,
        1.25+(hand[1]-1.25)*v-.25*v*(1-cos(a))*.5,
        .036+(hand[2]-.036)*v+depth*cos(a)];
    };
    s.add(panel(10,28,clothSleeve),sleeveColor);
    s.stroke(bride?'#ac6653':'#423e35',Array.from({length:16},(_,i)=>clothSleeve(i/15,1)),
      [.012,.014,.012],21);
    paw(side,...hand);
  }
  const tail=[[.075,.66,-.135],[.19,.61,-.32],[.32,.53,-.51],[.403,.64,-.705],[.458,.84,-.79],[.525,.966,-.72]];
  const rows=29,sides=16,brush=brushStroke(tail,[.057,.121,.168,.153,.084,.001],rows,sides);
  const colors=[], tipColor=new T.Color('#f2e5c7'),baseColor=new T.Color(bride?'#d0b492':'#b38359'),tone=new T.Color();
  const positions=brush.attributes.position;
  const bristle=(row,rib)=>{
    const k=row*sides+(rib%sides);return [positions.getX(k),positions.getY(k),positions.getZ(k)];
  };
  for(let j=0;j<=rows;j++)for(let k=0;k<sides;k++){
    const t=j/rows,a=k*tau/sides;
    const ivory=T.MathUtils.smoothstep(t+.060*sin(5*a)+.023*sin(3*a),.61,.70);
    tone.copy(baseColor).lerp(tipColor,ivory).multiplyScalar(.95+.055*cos(4*a+.6*t));
    colors.push(tone.r,tone.g,tone.b);
  }
  brush.setAttribute('color',new T.Float32BufferAttribute(colors,3));s.add(brush,'#fff');
  for(let i=0;i<16;i++){
    const start=6+(i*5)%11, points=[bristle(start,i),bristle(start+3,i),bristle(start+6,i+1)];
    s.stroke('#86715c',points,[.001,.005,.001],8);
  }
  if(bride){
    fan(s,0,1.024,.40,.316);
    for(const d of [-1,1]){
      const motifs=[[.21,.13],[.235,.22],[.19,.32],[.212,.42],[.247,.49]];
      clothline(motifs.map(([u,v])=>[u*d,v]),[.006,.012,.010,.007,.002],'#ad7a60',.017);
      for(let j=1;j<4;j++){
        const [u,v]=motifs[j],q=cloth(d*(u+.024),v+.037,.020);
        for(let k=0;k<5;k++){const a=k*tau/5;s.ball('#b88068',q[0]+.018*sin(a),q[1]+.024*cos(a),
          q[2]+.018*sin(a),.018,.024,.017,0,0,a);}
      }
      clothline([[d*.45,.033],[d*.34,.039],[d*.23,.042],[d*.12,.034],[0,.029]],
        [.010,.015,.016,.014,.005],'#bc9d71',.014);
    }
    for(const side of [-1,1]){
      for(let j=0;j<3;j++){
        const u=side*(.079+j*.042),v=.185+.070*j,[x,y,z]=cloth(u,v,.009);
        for(let k=0;k<5;k++){const a=k*tau/5;s.ball('#c38b71',x+.025*sin(a),y+.021*cos(a),z+.012,.02,.026,.008,0,0,-a);}
      }
    }
  } else if(groom){
    for(const d of [-1,1]){
      const [x,y,z]=cloth(d*.129,.87,.015);
      s.ball('#e4dabd',x,y,z,.035,.039,.016);
    }
    s.stroke('#977546',[[.179,1.02,.28],[.22,1.15,.36],[.30,1.39,.41]],[.018,.028,.012],10);
  } else if(role==='parasol'){
    s.stroke('#594633',[[-.24,.92,.145],[-.22,1.82,.52],[-.19,2.58,.86]],[.022,.025,.027],12);
    const cap=(u,v)=>{
      const a=u*tau,r=.05+1.13*v;
      return [-.19+sin(a)*r,2.58+.255*(1-v*v)+.13*cos(a)*r-.015*v*cos(28*a),.86+cos(a)*r];
    };
    s.add(panel(6,112,cap),'#b4503c');
    for(const [v,tone] of [[.33,'#d29063'],[.87,'#d3b287'],[.99,soot]])
      s.stroke(tone,Array.from({length:65},(_,i)=>cap(i/64,v)),[.013,.016,.013],88);
    for(let i=0;i<28;i++) s.stroke(i%2?'#854f3c':'#ceb087',
      [cap(i/28,.01),cap(i/28,.52),cap(i/28,1)].map(([x,y,z])=>[x,y+.012,z]),[.010,.008,.011],8);
    s.add(panel(2,112,(u,v)=>{const q=cap(u,.61+v*.093);q[1]+=.014;return q;}),'#d5b887');
    s.ball(soot,-.19,2.85,.86,.072,.091,.072);
  } else if(role==='lantern'){
    s.stroke('#725c40',[[.30,.92,.20],[.33,1.59,.15],[.37,2.42,.09],[.38,2.51,.40]],[.025,.023,.019,.012],17);
    s.stroke(soot,[[.38,2.51,.40],[.38,2.43,.41]],[.008,.008],5);
    s.ball('#efce91',.38,2.14,.42,.183,.275,.17);
    for(let i=0;i<8;i++){const q=(i+.5)/8*PI;
      s.post(i===0||i===7?'#53493a':'#a88759',.38,2.14+.27*cos(q),.42,.183*sin(q),.016,.17*sin(q));}
    s.stroke('#953e30',[[.39,1.89,.42],[.385,1.79,.428],[.398,1.70,.432]],[.026,.033,.009],9);
  } else {
    s.stroke('#715039',[[-.416,1.385,.264],[-.196,1.405,.328],[.082,1.424,.34],[.417,1.45,.318]],
      [.025,.028,.027,.024],15);
    for(let i=0;i<6;i++)s.ball(soot,-.29+i*.10,1.419,.350,.012,.006,.010);
  }
  return s.finish();
}

export function foxParties(scene){
  const mat=surfaceGrain(brushWash(new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide,emissive:'#857858',emissiveIntensity:.055}),.22),3.5);
  const obj=new T.Object3D(), batches=new Map();
  function batch(name,geo,capacity){
    const m=new T.InstancedMesh(geo,mat,capacity);m.count=0;m.frustumCulled=false;
    m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.name='稲荷・'+name;
    m.castShadow=m.receiveShadow=true;scene.add(m);batches.set(name,m);
  }
  for(const role of roles){batch(role,body(role),3);batch(role+'Face',face(role),3);}
  const shoe=sculpture();
  shoe.stroke('#957556',[[0,.31,-.022],[0,.226,-.072],[0,.132,.008],[0,.06,.074]],
    [.057,.042,.038,.052],10);
  shoe.ball('#ae9c71',0,.046,.071,.064,.04,.13);
  shoe.stroke(soot,[[-.047,.074,.12],[0,.085,.089],[.052,.071,.13]],[.007,.012,.006],7);
  batch('sandals',shoe.finish(),30);
  function place(key,x,y,z,yaw,pitch,roll,size){
    const m=batches.get(key);
    obj.position.set(x,y,z);obj.scale.setScalar(size);obj.rotation.set(pitch,yaw,roll,'YXZ');
    obj.updateMatrix();m.setMatrixAt(m.count++,obj.matrix);
  }
  return (time,player,active)=>{
    for(const m of batches.values()) m.count=0;
    if(active) for(const [i,site] of WEDDING_SITES.entries()){
      for(const [j,role] of roles.entries()){
        const walked=time*.82+(site.rx-site.rz)*1.04+i*2.2-j*1.44;
        const q=weddingPoint(site,walked), dx=wrapDelta(q.x-player.x),dz=wrapDelta(q.z-player.z);
        if(dx*dx+dz*dz>95**2)continue;
        const x=player.x+dx,z=player.z+dz,size=role==='lantern'?1.045:role==='groom'?1.12:1.075;
        const phase=time*3.52+j*.87+i*.6,stride=sin(phase),sway=.024*stride;
        const y=terrainHeight(q.x,q.z), bob=.027+.024*Math.abs(stride);
        const bow=role==='bride'?.115:role==='parasol'?.057:role==='flute'?-.043:.023;
        place(role,x,y+bob,z,q.yaw,bow+.011*cos(phase*2),sway,size);
        const headY=1.48*size, lean=Math.sin(bow)*headY;
        const glance=role==='bride'?.23+.29*sin(time*.26):role==='groom'?.23:role==='flute'?.31:-.12;
        place(role+'Face',x+lean*sin(q.yaw)-sway*headY*cos(q.yaw),y+bob+headY,
          z+lean*cos(q.yaw)+sway*headY*sin(q.yaw),q.yaw+glance+.09*sin(time*.72+j),
          bow+.041*cos(phase*2),sway*.58,size);
        for(const side of [-1,1]){
          const u=side*.121*size,v=side*stride*.151*size;
          place('sandals',x+u*cos(q.yaw)+v*sin(q.yaw),y+Math.max(0,.047*side*cos(phase)),
            z-u*sin(q.yaw)+v*cos(q.yaw),q.yaw,side*stride*.17,0,size);
        }
      }
    }
    for(const m of batches.values()){
      m.visible=m.count>0;
      if(!m.visible)continue;
      m.instanceMatrix.clearUpdateRanges();m.instanceMatrix.addUpdateRange(0,m.count*16);
      m.instanceMatrix.needsUpdate=true;
    }
  };
}
