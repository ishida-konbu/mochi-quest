// The gate fittings share the four original structural post locations.
// Geometry is in metres; casting, timbers, split stone and the earthen
// finish are kept separate so their sheen and shadow read at walkway level.
import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { surface } from './village-bath-figures.js';
const {sin,cos,PI,abs}=Math,tau=2*PI;
const wood='#9e7e56',cedar='#af916b',heart='#7f6248',bronze='#656c5c',rub='#aba081';
const tint=new T.Color();

function dressedPlinth(s,x,z,profile,color){
  // Chamfered granite shoulder and shoe, with the metal post collar sitting
  // inside its smaller top face. No cylindrical plinth under a square post.
  const cut=.19,outline=[[-1,-1+cut],[-1+cut,-1],[1-cut,-1],[1,-1+cut],
    [1,1-cut],[1-cut,1],[-1+cut,1],[-1,1-cut],[-1,-1+cut]];
  s.add(surface(8,profile.length-1,(u,v)=>{
    const [w,y,d]=profile[Math.round(v*(profile.length-1))],[a,b]=outline[Math.round(8*u)];
    return [x+a*w,y,z+b*d];
  },(u,v)=>tint.set(color).multiplyScalar(.87+.12*v+.064*sin(u*31))), '#fff');
}

function bracket(s,x,z){
  // Three bearing blocks transmit the timber load to the upright. The
  // curved arm is not decoration pasted to the face of a diagonal brace.
  for(let i=0;i<3;i++){
    const sy=2.408+i*.133,half=.204+i*.061;
    dressedPlinth(s,x,z,[[half*.73,sy,half*.70],[half*.81,sy+.053,half*.76],
      [half,sy+.115,half*.93],[half,sy+.148,half*.93],[.02,sy+.148,.02]],i%2?wood:heart);
  }
  const arm=new T.Shape();
  arm.moveTo(-.45,.010);arm.quadraticCurveTo(-.40,-.065,-.317,-.064);
  arm.quadraticCurveTo(-.256,-.064,-.270,.007);
  arm.bezierCurveTo(-.188,.006,-.154,-.016,-.127,-.071);
  arm.quadraticCurveTo(0,-.126,.127,-.071);arm.bezierCurveTo(.154,-.016,.188,.006,.270,.007);
  arm.quadraticCurveTo(.256,-.061,.317,-.064);arm.quadraticCurveTo(.405,-.066,.45,.010);
  arm.lineTo(.49,.119);arm.quadraticCurveTo(.411,.148,.335,.098);arm.lineTo(-.335,.098);
  arm.quadraticCurveTo(-.411,.148,-.49,.119);arm.closePath();
  const g=new T.ExtrudeGeometry(arm,{depth:.122,bevelEnabled:true,bevelThickness:.011,bevelSize:.012,bevelSegments:1,curveSegments:7});
  s.add(g,cedar,x,2.649,z-.061);
  s.add(g,wood,x-.061,2.782,z,1,1,1,0,PI/2);
  for(const end of [-1,1]){
    s.box(heart,x+end*.373,2.811,z,.184,.11,.204);
    s.box(cedar,x+end*.373,2.868,z,.207,.064,.226);
  }
}

function pivotLeaf(s,dir){
  const post=1.78*dir;
  // An open plank door sits against each return. The meeting stile, paired
  // bands, hinge sockets and drop bolt are visible from the inner court.
  const min=-1.03,max=.30,x=post-.014*dir,thick=.095,h=2.28,low=.23;
  const tones=['#8f7154','#9a7c5b','#8d7157','#977959','#a18464','#9a7e5e'];
  for(let j=0;j<8;j++){
    const z=min+(j+.5)*(max-min)/8;
    s.box(tones[(j*5+1)%6],x,low+h/2,z,thick,h,(max-min)/8-.005);
  }
  for(const face of [-1,1]){
    const fx=x+dir*(thick*.50+.021)*face,detail=fx+.013*dir*face;
    for(const v of [min+.045,max-.045])s.box(heart,fx,low+h/2,v,.046,h,.084);
    for(const y of [.39,1.26,2.32])s.box(wood,fx,y,(min+max)/2,.047,.083,max-min-.13);
    for(const [y,len] of [[.57,.662],[1.99,.726]]){
      const z=max-.006;
      const strap=new T.Shape();strap.moveTo(0,-.055);strap.lineTo(len*.55,-.046);
      strap.quadraticCurveTo(len*.73,-.067,len*.80,-.021);strap.quadraticCurveTo(len,-.020,len+.027,0);
      strap.quadraticCurveTo(len,.020,len*.80,.021);strap.quadraticCurveTo(len*.73,.067,len*.55,.046);
      strap.lineTo(0,.055);strap.closePath();
      const g=new T.ExtrudeGeometry(strap,{depth:.012,bevelEnabled:false,curveSegments:6});
      s.add(g,bronze,detail,y,z,1,1,1,0,PI/2);
      for(const d of [.087,.303,len*.72])s.ball('#8e8e75',detail+.016*dir*face,y,z-d,.011,.018,.018);
    }
    if(face<0){
      const vz=min+.249,cy=1.28,ring=new T.TorusGeometry(.071,.013,7,24);
      s.add(ring,'#797e69',detail-dir*.026,cy-.048,vz,1,1,1,0,PI/2,-.09);
      s.ball(rub,detail-dir*.010,cy+.023,vz,.027,.041,.036);
      for(const h of [.48,.82])s.box(bronze,detail,h,min+.166,.053,.047,.118);
      s.post('#727968',detail-.037*dir,.714,min+.166,.013,.527,.013);
    }
  }
  for(const y of [.55,1.98]){
    s.post('#646959',x,y,max+.008,.045,.262,.045);
    s.post(rub,x,y+.14,max+.008,.027,.029,.027);
  }
}

export function gateCarpentry(){
  const s=sculpture();
  for(const dir of [-1,1]){
    const post=dir*1.78;
    pivotLeaf(s,dir);
    for(const z of [-.57,.40]){
      dressedPlinth(s,post,z,[[.281,.007,.272],[.290,.099,.28],[.272,.181,.261],
        [.251,.220,.245],[.23,.283,.226],[.202,.307,.199],[.160,.307,.157]],'#9a9e8e');
      dressedPlinth(s,post,z,[[.174,.309,.174],[.178,.346,.177],[.161,.363,.159],[.149,.577,.149],
        [.153,.586,.152],[.149,.60,.148]],bronze);
      for(const a of [0,1,2,3]){
        const angle=a*PI/2;
        for(const y of [.369,.555]){
          const x=post+.153*cos(angle),v=z+.153*sin(angle);
          s.ball(rub,x,y,v,.014,.016,.014);
        }
      }
      bracket(s,post,z);
    }
    // Through-tenon and hardwood wedge exposed at each end of the nuki.
    for(const v of [-.57,.40])for(const y of [2.32,2.68]){
      s.box(heart,post+dir*.167,y,v,.19,.121,.096);
      s.box('#b19870',post+dir*.19,y+.02,v,.076,.159,.052,0,0,-dir*.12);
    }
  }
  return s.finish();
}

function roughBlock(s,left,right,bottom,top,side,seed){
  // Each stone has a chipped front, a border bevel and receding side faces.
  // Slightly sloping bed joints meet the next course at a different point.
  const w=right-left,cx=(left+right)*.5,h=top-bottom,cy=(top+bottom)*.5;
  const du=Math.min(.156,w*.23),rise=.35*h,noise=sin(seed*73.81);
  const plan=[[-w*.5+du*.69,-h*.50],[-w*.5,-h*.5+rise*.66],[-w*.5+du*.07,h*.5-rise*.56],
    [-w*.5+du*.74,h*.5],[w*.5-du*.82,h*.5-.013*noise],[w*.5,h*.5-rise*.66],
    [w*.5-du*.05,-h*.5+rise*.47],[w*.5-du*.76,-h*.5],[-w*.5+du*.69,-h*.50]];
  const rings=[[1,.21],[.985,.253],[.92,.294],[.63,.301],[.018,.306]];
  const color=['#90968b','#a7a18e','#929788','#a69780','#898d80','#a6a594','#a29e8e'][Math.abs(seed)%7];
  const coords=(u,v)=>{
    const i=Math.round(8*u),[a,b]=plan[i],[sc,d]=rings[Math.round(v*4)];
    return [cx+a*sc,cy+b*sc+.016*(a/w)*noise,side*(d+.011*cos(seed*3+i*.8)*sc)];};
  s.add(surface(8,4,coords,(u,v)=>tint.set(color).multiplyScalar(.79+.24*v+.070*sin(seed*3+9*u))), '#fff');
  if(w>.59 && seed%3===0){
    for(let j=0;j<3;j++){
      const x=cx-w*.19+j*.06,y=cy+.038*noise-.022*j;
      s.stroke('#7f8477',[[x,y,side*.307],[x+.036,y+.014,side*.308],[x+.059,y+.010,side*.306]],
        [.002,.004,.001],3);
    }
  }
}
export function wallStoneRoot(length){
  const s=sculpture(),hw=length/2+.04;
  for(const face of [-1,1]){
    for(let row=0;row<2;row++){
      const size=row===0?.92:.72;
      let start=-hw;
      for(let i=0;start<hw-.005;i++){
        let width=size*(.89+.25*(.5+.5*sin(i*17+row*7+length)));
        if(i===0&&row===1)width*=.53;
        if(hw-start-width<.28)width=hw-start;
        const a=start+(i===0?0:.008),b=start+width-.008,seed=row*97+i*7+Math.round(length*13);
        roughBlock(s,a,b,row===0?.017:.263,row===0?.260:.475,face,seed);
        start+=width;
      }
    }
    s.add(surface(20,3,(u,v)=>[(u*2-1)*hw,.467+.032*v,
      face*(.305-.105*v+.002*sin(u*33))]),'#939789');
  }
  return s.finish();
}

// Subtle compacted strata and weather stains run continuously across metric
// world space, through the tapered face and around the cut window reveals.
let earth;
export function earthenPlaster(){
  if(earth)return earth;
  earth=new T.MeshStandardMaterial({color:'#d0bf9e',roughness:.96,side:T.DoubleSide});
  earth.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 clayPoint;\n'+shader.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\nvec4 w=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nw=instanceMatrix*w;\n#endif\nclayPoint=(modelMatrix*w).xyz;');
    shader.fragmentShader=`varying vec3 clayPoint;
      float earthHash(vec2 p){return fract(sin(dot(p,vec2(89.147,41.431)))*43758.55);}
      float earthNoise(vec2 p){
        vec2 i=floor(p),u=fract(p);u=u*u*(3.-2.*u);
        return mix(mix(earthHash(i),earthHash(i+vec2(1.,0.)),u.x),
          mix(earthHash(i+vec2(0.,1.)),earthHash(i+1.),u.x),u.y);
      }
      `+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float x=clayPoint.x+.91*clayPoint.z,y=clayPoint.y;
      vec2 plane=vec2(x,y);float fine=earthNoise(plane*83.);
      float stains=earthNoise(plane*vec2(.70,1.9));
      float strata=y*7.4+.085*earthNoise(plane*vec2(2.9,.8))+.050*sin(x*1.7);
      float line=(1.-smoothstep(.022,.107,abs(fract(strata)-.19)))*(.24+.76*earthNoise(plane*vec2(1.2,6.)));
      float sand=smoothstep(.64,.92,fine)*(.5+.5*earthNoise(plane*4.));
      diffuseColor.rgb*=.89+.074*stains+.065*earthNoise(plane*5.6)+.054*fine-line*.073;
      diffuseColor.rgb+=vec3(.021,.015,.006)*sand;
    `);
  };
  return earth;
}

export function drainStones(){
  const out=sculpture(),width=3.28,n=7,w=width/n,gap=.012;
  out.box('#545d54',0,-.003,0,width+.068,.027,.321);
  // Long slots pass through the stone covers into the open drain below.
  for(let i=0;i<n;i++){
    const shape=new T.Shape(),half=(w-gap)/2,hd=.138,r=.015;
    shape.moveTo(-half+r,-hd);shape.lineTo(half-r,-hd);shape.quadraticCurveTo(half,-hd,half,-hd+r);
    shape.lineTo(half,hd-r);shape.quadraticCurveTo(half,hd,half-r,hd);shape.lineTo(-half+r,hd);
    shape.quadraticCurveTo(-half,hd,-half,hd-r);shape.lineTo(-half,-hd+r);shape.quadraticCurveTo(-half,-hd,-half+r,-hd);shape.closePath();
    for(const x of [-.126,-.043,.043,.126]){
      const h=new T.Path(),r=.014,len=.081;h.moveTo(x-r,-len);h.absarc(x,-len,r,PI,2*PI,false);
      h.lineTo(x+r,len);h.absarc(x,len,r,0,PI,false);h.closePath();shape.holes.push(h);
    }
    const g=new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelThickness:.004,bevelSize:.003,
      curveSegments:5,bevelSegments:1});
    out.add(g,i%3?'#a8a99a':'#b3ad9a',(i+.5)*w-width*.5,.008,0,1,1,1,-PI/2);
  }
  return out.finish();
}

export function streetSplashRun(length,ground){
  const s=sculpture(),hw=length/2,stones=['#8a9184','#919587','#a5a18d','#a4a294','#7f887c'];
  s.add(surface(32,3,(u,v)=>{const x=(u*2-1)*hw,z=.28+v*.42;return [x,ground(x,z)+.024,z];}),'#797c69');
  const gravel=new T.IcosahedronGeometry(1,0),count=Math.round(length*13.7);
  for(let i=0;i<count;i++){
    const x=-hw+length*(i+.5)/count,z=.375+.180*(.5+.5*cos(i*2.391));
    const r=.045+.023*(.5+.5*sin(23*i+length));
    s.add(gravel,stones[i%5],x,ground(x,z)+.032,z,r*1.26,r*.52,r,0,i*.947);
  }
  const countStone=Math.ceil(length/.78);
  for(let i=0;i<countStone;i++){
    const a=-hw+length*i/countStone+.009,b=-hw+length*(i+1)/countStone-.009;
    s.add(surface(4,4,(u,v)=>{const x=a+(b-a)*u,j=Math.round(v*4);
      const [z,d]=[[.555,.028],[.584,.069],[.641,.076],[.686,.066],[.70,.018]][j];
      return [x,ground(x,z)+d,z];}),i%3?'#9ca08e':'#a9a594');
  }
  return s.finish();
}

// Cedar is split along the grain of the roof rather than along the UVs of
// the merged fittings. The grain curves with the actual bargeboard. Fine
// scratches fade under minification as the player crosses the avenue.
let barkFinish;
export function gateTimberFinish(){
  if(barkFinish)return barkFinish;
  barkFinish=new T.MeshStandardMaterial({vertexColors:true,roughness:.79,side:T.DoubleSide});
  barkFinish.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 hinokiPoint;varying vec3 hinokiNormal;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nhinokiPoint=position;hinokiNormal=normal;');
    shader.fragmentShader=`varying vec3 hinokiPoint;varying vec3 hinokiNormal;
      float fibreHash(vec2 p){return fract(sin(dot(p,vec2(37.73,119.27)))*41217.29);}
      float fibreNoise(vec2 p){
        vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(fibreHash(i),fibreHash(i+vec2(1,0)),f.x),
                   mix(fibreHash(i+vec2(0,1)),fibreHash(i+1.),f.x),f.y);
      }
      `+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 p=hinokiPoint;
      float curve=.205+1.08*exp(-pow(abs(p.x)/1.01,2.))+.152*pow(abs(p.x)/2.54,6.);
      float front=smoothstep(.26,.81,abs(normalize(hinokiNormal).z));
      vec2 plane=vec2(p.x+.18*p.z,mix(p.z,p.y-curve,front));
      float broad=fibreNoise(plane*vec2(2.35,48.));
      float wandering=fibreNoise(plane*vec2(2.9,3.2));
      float ring=(plane.y+.010*sin(3.8*plane.x+wandering*4.)+.021*wandering)*317.;
      float fine=.5+.5*sin(ring);fine=mix(.5,fine,1.-smoothstep(.28,1.98,fwidth(ring)));
      float grain=fibreNoise(plane*vec2(15.,195.));
      float cathedrals=sin(plane.y*84.+3.6*broad+.28*sin(.85*p.x));
      diffuseColor.rgb*=.78+.24*broad+.11*fine+.078*grain+.026*cathedrals;
    `).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor+=.085*(broad-.5);');
  };
  return barkFinish;
}

export function carvedGable(){
  const s=sculpture(),hd=1.31;
  for(const side of [-1,1]){
    // Narrow riven laths can be seen through the cut foliate openings.
    // Behind the pendant a sculpted king-post bears on the transom rail.
    for(const d of [-1,1]){
      for(let i=0;i<4;i++){
        const x=d*(.20+.142*i);
        s.box(heart,x,.496,side*(hd-.236),.019,.51,.039);
      }
      for(const y of [.37,.50,.63])s.box(wood,d*.454,y,side*(hd-.264),.69,.018,.042);
    }
    const bottle=new T.LatheGeometry([[.114,0],[.130,.032],[.105,.064],[.079,.148],
      [.105,.219],[.137,.287],[.159,.39],[.129,.46],[.094,.483],[.074,.541]]
      .map(v=>new T.Vector2(...v)),24);
    s.add(bottle,'#987851',0,.281,side*(hd-.127),1,1,.55);
    const z=side*(hd-.017);
    for(const d of [-1,1]){
      // A continuous curved ribbon is cut down to the working rail. The
      // forked end follows the void in the board instead of filling it.
      const relief=new T.Shape();relief.moveTo(d*.118,.326);
      relief.bezierCurveTo(d*.177,.437,d*.208,.605,d*.334,.691);
      relief.quadraticCurveTo(d*.465,.805,d*.592,.689);
      relief.quadraticCurveTo(d*.493,.755,d*.374,.666);
      relief.bezierCurveTo(d*.291,.595,d*.267,.478,d*.210,.398);
      relief.quadraticCurveTo(d*.408,.512,d*.526,.466);
      relief.quadraticCurveTo(d*.398,.454,d*.279,.358);
      relief.quadraticCurveTo(d*.178,.294,d*.118,.326);relief.closePath();
      const carved=new T.ExtrudeGeometry(relief,{depth:.031,bevelEnabled:true,bevelThickness:.007,bevelSize:.008,
        bevelSegments:2,curveSegments:10});
      s.add(carved,'#a2875f',0,0,z,1,1,1,0,side<0?PI:0);
      const lobes=[[.57,.551],[.667,.519],[.793,.416],[.894,.369],[1.023,.333],[1.111,.280]];
      s.stroke('#927653',lobes.map(([x,y])=>[d*x,y,side*(hd+.009)]),[.009,.029,.025,.028,.024,.003],19);
      for(const x of [.57,.76,.94]){
        const y=.654-(x-.52)*.81;
        s.stroke('#ae956c',[[d*(x-.065),y-.037,z],[d*x,y+.009,z+side*.020],[d*(x+.061),y,z]],
          [.004,.017,.003],8);
      }
    }
  }
  return s.finish();
}
