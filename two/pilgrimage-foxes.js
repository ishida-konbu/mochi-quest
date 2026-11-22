// A five-figure procession, drawn in three dimensions. The silhouettes alternate
// between the lantern, tall cap, white hood, paper parasol and horizontal flute.
import * as T from './vendor/three.module.min.js';
import { terrainHeight, wrapDelta } from './terrain.js';
import { WEDDING_SITES, WEDDING_ROLES as roles, weddingWalkerPose } from './pilgrimage-layout.js';
import { brushWash, surfaceGrain } from './scroll-sculpt.js';
import { sculpture } from './pilgrimage-pigment.js';
import { costumeDistance } from './costume-distance.js';
import { makeNPC } from './actors.js';
import { SilkPanels } from './kosode.js';
import { foldMark, paintedSilk } from './emaki-costume.js';
import { weddingVisage } from './wedding-visages.js';

const {sin,cos,PI}=Math, tau=2*PI;
const soot='#37352e', silk='#eee5cb', cord='#ae4c39';


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

function headwear(role){
  const s=sculpture(),white=role==='bride';
  if(white){
    // An open hood: the turned rim frames the face, with real air behind its
    // front edge. Silk meets at the nape and hangs over the upper back.
    const hood=(u,v)=>{
      const a=u*tau,theta=.014+v*(2.06+.16*cos(a)),lower=(1-cos(a))*.5;
      const pleat=.023*sin(6*a+1.7*v)*lower*v;
      return [(.310+pleat)*sin(theta)*sin(a)+.021*(1-v),
        .066+.425*sin(theta)*cos(a)-.173*v*lower,
        -.139-.295*cos(theta)+.068*cos(a)*v-.038*lower*v];
    };
    s.add(panel(26,56,hood),silk);
    s.add(panel(5,54,(u,v)=>{
      const q=hood(u,1-.078*v);
      return [q[0]*(1-.03*v),q[1]-.012*v,q[2]+.004-.011*v];
    }),'#d1bfa0');
    for(const side of [-1,1]) {
      for(let j=0;j<5;j++) {
        const u=.18+j*.056;
        const trace=[[u+.11,.15],[u+.051,.43],[u+.020,.71],[u,.934]];
        s.stroke(j%2?'#a89379':'#beab8b',trace.map(([a,v])=>hood(side*a,v)),
          [.0006,.0035,.006,.0005],13);
      }
    }
    for(const d of [-1,1]){
      for(let k=0;k<5;k++){const a=k*tau/5;s.ball(k%2?cord:'#ca9270',d*.285+.012*sin(a),.25+.030*cos(a),.015+.030*sin(a),.020,.027,.025);}
      s.ball('#d2a75d',d*.304,.253,.018,.019,.017,.019);
    }
    const rim=Array.from({length:23},(_,i)=>hood(i/22,1));
    s.stroke('#ac7a60',rim,[.002,.008,.010,.008,.002],41);
    for(const side of [-1,1])s.stroke('#baa889',[[side*.27,.18,.157],[side*.31,.101,.132],
      [side*.335,-.031,.02],[side*.304,-.16,-.094]],[.002,.009,.011,.002],12);
  } else if(role==='groom'){
    // Folded lacquered eboshi bends away from the forehead. Its side crease
    // runs up to a backward-pointing crown rather than a circular cone.
    const cap=(u,v)=>{
      const a=tau*u,r=.158*(1-.39*v-.59*v**3);
      return [r*sin(a)-.040*v*v,.167+.347*v+.014*cos(a)*v,
        -.066-.173*v*v+r*.90*cos(a)-.030*sin(a)**2*sin(PI*v)];
    };
    s.add(panel(19,36,cap),'#42413b');
    for(const side of [-1,1]){
      const knots=[[.17,.03],[.18,.30],[.155,.65],[.10,.95]];
      s.stroke('#817966',knots.map(([u,v])=>cap(side*u,v)),[.001,.005,.004,.001],13);
      s.stroke('#887657',[[side*.123,.19,-.051],[side*.159,.075,-.073],[side*.126,-.076,-.062],
        [side*.047,-.168,-.022]],[.008,.007,.005,.003],14);
    }
  } else if(role==='lantern'){
    const t=(u,v)=>{
      const a=u*tau,r=.024+v*.452;
      return [r*sin(a),.500-.196*v+.032*v**6+.081*cos(a)*v,-.07+.88*r*cos(a)];
    };
    s.add(panel(7,44,t),'#bba16e');
    for(let j=0;j<24;j++)s.stroke('#907650',[t(j/24,.03),t(j/24,.49),t(j/24,1)],[.006,.005,.004],7);
    s.stroke('#776449',Array.from({length:41},(_,j)=>t(j/40,.995)),[.007,.009,.007],49);
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
  const s=sculpture(),weave=new SilkPanels(),bride=role==='bride',groom=role==='groom';
  const bolt={lantern:2,groom:1,bride:3,parasol:2,flute:0}[role];
  const hem=bride?.105:groom?.226:role==='parasol'?.42:.357;
  const radius=new T.SplineCurve([[.1,.348],[.22,.34],[.48,.285],[.72,.224],[.84,.20],[1.06,.25],[1.205,.245],[1.38,.118]]
    .map(([y,r])=>new T.Vector2(r,y)));
  const cloth=(u,v,lift=0)=>{
    const a=u*tau,sec=radius.getPointAt(v),w=sec.x+(.018+.024*(1-v))*cos(7*a+.9*v)*Math.sin(v*PI+.32);
    const skirt=(1-v)**3,train=bride?Math.max(0,-cos(a+.21))**2*skirt:0;
    const gather=skirt*(.034*sin(4*a+2.2*v)+.013*cos(11*a+v));
    return [sin(a)*(w+lift+gather)+.029*skirt,hem+(1.37-hem)*(sec.y-.10)/1.28+.036*(1-v)*sin(3*a),
      cos(a)*(w*.79+lift+gather)-.39*train+.037*v];
  };
  weave.cut(26,64,(u,v)=>cloth(u-.5,v),bolt);
  weave.cut(3,64,(u,v)=>cloth(u-.5,.008+.019*v,.006),4,bride?'#d0ab82':'#a7987e');
  // Overlapping fronts turn separately at the knee. The bride's three lower
  // silks spread backward on the train, revealing darker turned-under edges.
  for(let j=0;j<(bride?3:1);j++) {
    weave.cut(5,64,(u,v)=>{
      const a=(u-.5)*tau,q=cloth(u-.5,.002+.048*v,.010+.009*j);
      q[1]+=.005+.027*j+.017*sin(a+.22*j);
      q[2]-=.026*j*Math.max(0,-cos(a));return q;
    },4,bride?['#876453','#c8a488','#e9daba'][j]:'#93836f');
  }
  for(const side of [-1,1]){
    for(let j=0;j<5;j++){
      const u=side*(.032+.083*j),drift=.018*sin(j*1.81);
      const trace=[[u*.71,.57],[u*.85+drift,.42],[u+.008,.22],[u+drift-.006,.043]];
      foldMark(weave,cloth,trace,.0065,bride?'#b1a08a':groom?'#66665e':'#97856c',.008);
      if(j%2===0)foldMark(weave,cloth,trace.map(([x,y])=>[x+side*.008,y-.013]),
        .007,bride?'#f4ead3':'#baa98c',.009);
    }
  }
  function clothline(coords,widths,tint,lift=.007){
    s.stroke(tint,coords.map(([u,v])=>cloth(u,v,lift)),widths,15);
  }
  // Turned-back collar, double lapel and long pleats have dark lifted tips.
  for(const side of [-1,1]){
    const u=n=>side*n;
    clothline([[u(.262),.955],[u(.153),.904],[u(.068),.817],[u(-.020),.729]], [.032,.037,.031,.018],
      bride?'#bda575':'#e1d4b3',.015);
    clothline([[u(.25),.954],[u(.14),.897],[u(.061),.81],[u(-.022),.722]],[.002,.010,.009,.002],soot,.042);

  }
  s.add(panel(2,42,(u,v)=>cloth(u,.59+v*.099,.018)),bride?'#d2ba81':groom?'#b8a786':'#a86948');
  const paw=(d,xx,yy,zz)=>{
    s.ball('#ddc298',xx,yy,zz,.078,.058,.107,-.3,0,d*.10);
    for(let k=0;k<3;k++)s.stroke('#7c6450',[[xx+d*.015,yy+.017,zz+.056],
      [xx+d*(.028+k*.021),yy+.015,zz+.096-k*.013]],[.006,.001],5);
  };
  for(const side of [-1,1]){
    const hand=bride?[side*.113,1.04,.33]:role==='flute'?
      [side<0?-.151:.252,side<0?1.405:1.437,side<0?.416:.405]:
      role==='parasol'?(side<0?[-.232,1.12,.266]:[-.162,1.36,.337]):
      role==='lantern'&&side>0?[.323,1.187,.161]:[side*.267,.98,.285];
    const sx=side*.21;
    // Weighted rectangular sleeves hang off the wrist while the fox holds its prop.
    const clothSleeve=(u,v)=>{
      const a=u*tau,w=.13+.032*sin(v*PI),depth=.129;
      const fall=(1-cos(a))*.5;
      const xx=sx+(hand[0]-sx)*v+side*(.108+.047*fall)*sin(PI*v);
      const drag=(bride?.195:groom?.134:.084)*fall*sin(PI*v*.72);
      return [xx+w*Math.sign(sin(a))*Math.abs(sin(a))**.53,
        1.25+(hand[1]-1.25)*v-.25*v*fall-drag,
        .036+(hand[2]-.080)*v+depth*cos(a)];
    };
    weave.cut(14,36,clothSleeve,bolt,'#fff',(u,v)=>[.04+.91*u,.06+.79*v]);
    weave.cut(11,11,(u,v)=>{
      const a=.235+.265*v,l=clothSleeve(a,1),r=clothSleeve(1-a,1);
      return l.map((q,k)=>q+(r[k]-q)*u+(k===2?.012*sin(PI*u):0));
    },bolt,'#fff',(u,v)=>[.05+.83*u,.10+.38*v]);
    weave.cut(5,36,(u,v)=>{
      const q=clothSleeve(u,1-.12*v);
      return [q[0]*(1-.035*v),q[1]+.012*v,q[2]-.016*v];
    },4,bride?'#c49b85':'#b9aa8e');
    s.stroke(bride?'#a97964':'#77644e',Array.from({length:16},(_,i)=>clothSleeve(i/15,1)),
      [.004,.006,.004],21);
    for(let j=0;j<3;j++){
      const at=side>0?.17+j*.11:.83-j*.11;
      const knots=[[at,.17],[at+.042*side,.42],[at+.047*side,.68],[at+.012*side,.91]];
      s.stroke(bride?'#b5a48b':'#786d5e',knots.map(([u,v])=>clothSleeve(u,v)),
        [.0007,.003,.005,.0005],11);
    }
    paw(side,...hand);
  }
  if(bride){
    fan(s,0,1.024,.40,.316);
    for(const d of [-1,1]){
      const motifs=[[.21,.13],[.235,.22],[.19,.32],[.212,.42],[.247,.49]];
      clothline(motifs.map(([u,v])=>[u*d,v]),[.006,.012,.010,.007,.002],'#ad7a60',.017);
      for(let j=1;j<4;j++){
        const [u,v]=motifs[j];
        for(let k=0;k<5;k++){
          const a=tau*k/5+.3*j;
          foldMark(weave,cloth,[[d*u,v],[d*(u+.008*sin(a)),v+.015*cos(a)],
            [d*(u+.016*sin(a)),v+.029*cos(a)]],.009,'#ae8871',.010);
        }
      }
      clothline([[d*.45,.033],[d*.34,.039],[d*.23,.042],[d*.12,.034],[0,.029]],
        [.010,.015,.016,.014,.005],'#bc9d71',.014);
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
    const lantern=(u,v,pad=0)=>{
      const a=tau*u,r=.069+.106*sin(PI*v)**.73+.003*cos(tau*v*14)+pad;
      return [.38+r*sin(a),1.89+.505*v,.42+r*.91*cos(a)];
    };
    s.add(panel(38,36,lantern),'#e4c699');
    for(const v of [.008,.956])s.add(panel(2,36,(u,f)=>lantern(u,v+f*.034,.004)),'#655843');
    for(const side of [-1,1]){
      // A single stalk on the lantern follows the round paper, crossed by
      // successively lighter ears of rice. It reads at processional distance.
      const stalk=[[.06,.26],[.021,.43],[-.026,.59],[-.075,.70]];
      s.stroke('#805e42',stalk.map(([u,v])=>lantern(side*.23+u,v,.004)),[.001,.004,.004,.001],12);
      for(let k=0;k<4;k++)for(const d of [-1,1]){
        const u=side*.23+.006-.018*k,v=.44+k*.061,leaf=[[u,v],[u+.014*d,v-.006],[u+.025*d,v-.048]];
        s.stroke('#8b7050',leaf.map(([u,y])=>lantern(u,y,.004)),[.001,.007,.0006],8);
      }
    }
    s.stroke('#953e30',[[.39,1.89,.42],[.385,1.79,.428],[.398,1.70,.432]],[.026,.033,.009],9);
  } else {
    s.stroke('#6d503c',[[-.372,1.390,.415],[-.176,1.407,.429],[.121,1.434,.426],[.451,1.462,.395]],
      [.018,.022,.022,.017],15);
    for(let i=0;i<6;i++)s.ball(soot,-.24+i*.096,1.42+i*.005,.444-.003*i,.009,.004,.006);
  }
  return {trim:s.finish(),silk:weave.finish()};
}

export function foxParties(scene){
  const mat=surfaceGrain(brushWash(new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide,emissive:'#857858',emissiveIntensity:.055}),.22),3.5);
  const distance=costumeDistance(scene,roles.length*WEDDING_SITES.length);
  const walkers=WEDDING_SITES.map(()=>roles.map((_,j)=>({costume:j+5})));
  const obj=new T.Object3D(), combined=new T.Matrix4(), batches=new Map(),all=[];
  function batch(name,geo,capacity,paint=mat,rest=null){
    const m=new T.InstancedMesh(geo,paint,capacity);m.count=0;m.frustumCulled=false;
    m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.name='稲荷・'+name;
    m.castShadow=m.receiveShadow=true;scene.add(m);
    if(!batches.has(name))batches.set(name,[]);
    batches.get(name).push({m,rest});all.push(m);
  }
  // The wandering fox and its kin share the same painted, curled brush tail.
  const original=makeNPC({type:'fox',stature:1},new T.Group()).limbs;
  for(const [key,node,scale,offset] of [
    ['尾',original.tail,.72,[.055,.488,-.201]],
  ]){
    node.updateWorldMatrix(true,true);
    const inverse=node.matrixWorld.clone().invert();
    // The brush trails below the sash, swept out to the side of the train.
    const fall=new T.Quaternion().setFromEuler(new T.Euler(-.63,-.56,.035,'YXZ'));
    const fit=new T.Matrix4().compose(new T.Vector3(...offset),fall,new T.Vector3(scale,scale,scale));
    node.traverse(part=>{
      if(!part.isMesh)return;
      const rest=fit.clone().multiply(inverse).multiply(part.matrixWorld);
      batch(key,part.geometry,roles.length*WEDDING_SITES.length,part.material,rest);
    });
  }
  for(const role of roles){
    const robe=body(role);
    batch(role,robe.trim,WEDDING_SITES.length);
    batch(role,robe.silk,WEDDING_SITES.length,paintedSilk());
    batch(role+'面相',weddingVisage(role),WEDDING_SITES.length);
    if(['bride','groom','lantern'].includes(role))batch(role+'装束',headwear(role),WEDDING_SITES.length);
  }
  const shoe=sculpture();
  const trouser=(u,v)=>{
    const a=tau*u,r=.050+.065*v+.010*cos(5*a+v)*sin(PI*v);
    return [r*sin(a),.22+.346*v+.009*cos(3*a)*(1-v),-.031+r*.81*cos(a)];
  };
  shoe.add(panel(11,24,trouser),'#8e7d66');
  shoe.add(panel(2,24,(u,v)=>trouser(u,.023+.061*v)),'#ada082');
  shoe.stroke('#957556',[[0,.31,-.022],[0,.226,-.072],[0,.132,.008],[0,.06,.074]],
    [.057,.042,.038,.052],10);
  shoe.ball('#ae9c71',0,.046,.071,.064,.04,.13);
  shoe.stroke(soot,[[-.047,.074,.12],[0,.085,.089],[.052,.071,.13]],[.007,.012,.006],7);
  batch('sandals',shoe.finish(),2*roles.length*WEDDING_SITES.length);
  function place(key,x,y,z,yaw,pitch,roll,size){
    obj.position.set(x,y,z);obj.scale.setScalar(size);obj.rotation.set(pitch,yaw,roll,'YXZ');
    obj.updateMatrix();
    for(const {m,rest} of batches.get(key)){
      m.setMatrixAt(m.count++,rest?combined.multiplyMatrices(obj.matrix,rest):obj.matrix);
    }
  }
  return (time,player,active,camera)=>{
    distance.begin(time,player,camera);
    for(const m of all) m.count=0;
    if(active) for(const [i,site] of WEDDING_SITES.entries()){
      for(const [j,role] of roles.entries()){
        const q=weddingWalkerPose(i,j,time), dx=wrapDelta(q.x-player.x),dz=wrapDelta(q.z-player.z);
        if(dx*dx+dz*dz>95**2)continue;
        const x=player.x+dx,z=player.z+dz,size=role==='lantern'?1.045:role==='groom'?1.12:1.075;
        const phase=time*3.52+j*.87+i*.6,stride=sin(phase),sway=.024*stride;
        const y=terrainHeight(q.x,q.z), bob=.027+.024*Math.abs(stride);
        if(!distance.close(walkers[i][j],x,y+bob,z,q.yaw,size))continue;
        const bow=role==='bride'?.115:role==='parasol'?.057:role==='flute'?-.043:.023;
        place(role,x,y+bob,z,q.yaw,bow+.011*cos(phase*2),sway,size);
        place('尾',x,y+bob,z,q.yaw+.105*stride,bow+.038*cos(phase),sway,size);
        const headY=1.48*size, lean=Math.sin(bow)*headY;
        const glance=role==='bride'?.23+.29*sin(time*.26):role==='groom'?.23:role==='flute'?-.033:-.12;
        const headX=x+lean*sin(q.yaw)-sway*headY*cos(q.yaw),headZ=z+lean*cos(q.yaw)+sway*headY*sin(q.yaw);
        const turn=q.yaw+glance+.09*sin(time*.72+j),nod=bow+.041*cos(phase*2);
        place(role+'面相',headX,y+bob+headY,headZ,turn,nod,sway*.58,size);
        if(batches.has(role+'装束'))place(role+'装束',headX,y+bob+headY,headZ,turn,nod,sway*.58,size);
        for(const side of [-1,1]){
          const u=side*.121*size,v=side*stride*.151*size;
          place('sandals',x+u*cos(q.yaw)+v*sin(q.yaw),y+Math.max(0,.047*side*cos(phase)),
            z-u*sin(q.yaw)+v*cos(q.yaw),q.yaw,side*stride*.17,0,size);
        }
      }
    }
    distance.end();
    for(const m of all){
      m.visible=m.count>0;
      if(!m.visible)continue;
      m.instanceMatrix.clearUpdateRanges();m.instanceMatrix.addUpdateRange(0,m.count*16);
      m.instanceMatrix.needsUpdate=true;
    }
  };
}
