import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { beam, stroke, surface } from './pilgrim-roofcraft.js';
import { brushWash } from './scroll-sculpt.js';
import { DRAGON_PLINTH, DRAGON_CHAMBER, DRAGON_ROOF, dragonRoofHeight } from './kaede-dragon-layout.js';

const cedar='#885d40', heartwood='#a8794f', soot='#50463a', oldBronze='#637769';
const {sin,cos,PI}=Math;

// Chipped, bevelled corners catch a little light above the darker wet granite.
function granite(s,w,d,base,top,colors){
  const x=w/2,z=d/2,b=.095;
  const rim=[[-x+b,-z],[x-b,-z],[x,-z+b],[x,z-b],[x-b,z],[-x+b,z],[-x,z-b],[-x,-z+b]];
  for(let i=0;i<rim.length;i++){
    const a=rim[i],b=rim[(i+1)%rim.length];
    surface(s,colors[i%colors.length],2,1,(u,v)=>{
      const inset=v===1?.954:1, y=v===0?base:v===1?top:top-.037;
      return [(a[0]+u*(b[0]-a[0]))*inset,y,(a[1]+u*(b[1]-a[1]))*inset];
    });
    surface(s,colors[1],1,1,(u,v)=>[(a[0]+u*(b[0]-a[0]))*v*.954,top,(a[1]+u*(b[1]-a[1]))*v*.954]);
  }
}

function sanctuary(s){
  const {width:w,depth:d,bottom,top}=DRAGON_CHAMBER, x=w/2, z=d/2;
  s.box(soot,0,(bottom+top)/2,0,w-.06,top-bottom-.03,d-.08);
  for(const [y,h,reach] of [[bottom+.046,.092,.07],[bottom+.17,.11,.04],[top-.105,.07,.04],[top-.04,.08,.1]])
    s.box(cedar,0,y,0,w+reach,h,d+reach);
  for(const side of [-1,1]){
    for(let i=0;i<6;i++)s.box(i%3?'#9f7656':'#ab825d',side*(x-.017),.91,-z+.07+i*(d-.14)/5,.052,.67,(d-.08)/6);
    for(const h of [.61,1.07,1.24])s.box(cedar,side*x,h,0,.045,.047,d);
    for(const end of [-1,1]){
      s.box(heartwood,side*(x-.033),.907,end*(z-.018),.082,.82,.084);
      s.box('#c09669',side*(x-.033),1.28,end*(z-.018),.128,.075,.12);
    }
    // The pair of open cedar shutters frame the little votive carving.
    const cx=side*.387;
    s.box('#654531',cx,.915,z+.019,.167,.684,.062,0,-side*.28);
    for(const y of [.672,1.172])s.box(heartwood,cx,y,z+.058,.145,.047,.036,0,-side*.28);
    s.box('#927454',cx,.866,z+.059,.116,.268,.018,0,-side*.28);
    s.box('#514c3c',side*.455,.937,z+.080,.025,.083,.024);
  }
  for(let k=0;k<7;k++)s.box(k%2?'#996e4e':'#a47a57',-.412+k*.137,.90,-z-.007,.132,.73,.035);
  s.box(cedar,0,1.10,-z-.032,w,.044,.038);
  s.box('#674c37',0,.916,z+.014,.623,.705,.040);
  s.box('#bb986a',0,.917,z+.041,.582,.65,.023);
  s.box('#98744f',0,.557,z+.07,.82,.051,.14);
}

// A water dragon in profile, worked in shallow bronze relief on the cedar.
// The pale belly returns through its coil, and the snout follows the tide jewel.
function waterDragon(s){
  const z=DRAGON_CHAMBER.depth/2+.077;
  function line(color,knots,radii,depth=0,steps=knots.length*3){
    stroke(s,color,knots.map(([x,y])=>[x,y,z+depth]),radii,steps,6);
  }
  function barb(color,a,b,tip,depth){
    surface(s,color,1,2,(u,v)=>{
      const x=a[0]+u*(b[0]-a[0]),y=a[1]+u*(b[1]-a[1]);
      return [x+v*(tip[0]-x),y+v*(tip[1]-y),z+depth+.017*(1-v)*(1-Math.abs(2*u-1))];
    });
  }
  const spine=[[-.236,.704],[-.105,.66],[.087,.69],[.156,.776],[.113,.849],[-.043,.842],[-.155,.879],[-.183,.962],[-.137,1.045],[-.027,1.069]];
  line('#4b594f',spine,[.005,.022,.040,.046,.047,.052,.048,.050,.047,.043]);
  // Barbs gather behind the brow and diminish toward the tail.
  for(const [x,y,dx,dy] of [[-.16,.949,-.065,.038],[-.15,.907,-.050,.010],[-.095,.867,-.043,.014],
    [.131,.816,.047,.029],[.148,.779,.044,.017],[.136,.742,.030,.004]]){
    line('#71816c',[[x,y],[x+dx*.55,y+dy*.75],[x+dx,y+dy]],[.017,.010,.001],.011,6);
  }
  line('#91a78b',spine.map(([x,y],i)=>[x,y+.012*sin(i*.79)-.008]),[.002,.006,.012,.014,.012,.014,.012,.014,.013,.005],.034);
  for(const [x,y,tilt] of [[-.104,.687,.22],[.003,.69,-.16],[.117,.741,-.51],[.13,.81,.54],[-.067,.853,.23],[-.169,.904,.65],[-.165,.975,-.45]]){
    line('#a18e64',[[x-.016,y+.011],[x,y-.005],[x+.011,y-.010+tilt*.011]],[.002,.005,.0015],.043,5);
  }
  // The jaws are separate ridges so their shadow reads even in flat light.
  const head=new T.Shape();
  head.moveTo(-.099,1.072);
  head.quadraticCurveTo(-.088,1.125,-.052,1.135);
  head.lineTo(-.015,1.130);head.lineTo(.018,1.112);
  head.quadraticCurveTo(.054,1.088,.091,1.094);
  head.lineTo(.126,1.112);head.lineTo(.148,1.102);head.lineTo(.155,1.080);
  head.quadraticCurveTo(.146,1.054,.120,1.057);
  head.lineTo(.081,1.065);head.quadraticCurveTo(.018,1.020,-.038,1.033);
  head.quadraticCurveTo(-.083,1.046,-.099,1.072);
  s.add(new T.ExtrudeGeometry(head,{depth:.029,bevelThickness:.011,bevelSize:.009,bevelSegments:2,curveSegments:5}),oldBronze,0,0,z+.026);
  line('#85947a',[[.031,1.082],[.076,1.077],[.109,1.085],[.132,1.103]],[.008,.010,.012,.005],.066);
  line(oldBronze,[[.005,1.041],[.035,1.008],[.092,1.003],[.121,1.020]],[.025,.017,.013,.006],.026);
  barb('#cdbd94',[.083,1.064],[.099,1.065],[.090,1.038],.061);
  barb('#cdbd94',[.114,1.061],[.124,1.065],[.120,1.043],.061);
  barb('#687e68',[-.023,1.046],[.010,1.035],[-.007,.986],.047);
  s.ball('#d6b573',.001,1.096,z+.067,.017,.011,.009);
  s.ball('#342e25',.007,1.095,z+.075,.006,.007,.004);
  line('#627460',[[-.039,1.121],[-.014,1.115],[.014,1.109],[.041,1.116]],[.013,.014,.008,.001],.064);
  line('#d1b986',[[.065,1.062],[.067,1.053],[.068,1.049]],[.004,.003,.001],.060);
  s.ball('#45483a',.136,1.092,z+.075,.010,.006,.004);
  for(const [x,y,r] of [[-.047,1.118,.018],[-.097,1.107,.015]]){
    line('#695e40',[[x,y],[x-.025,y+.050],[x-.078,y+.073],[x-.111,y+.115]],[r+.004,.015,.010,.002],.021);
    line('#706044',[[x-.044,y+.062],[x-.042,y+.100],[x-.058,y+.127]],[.012,.008,.0015],.024);
  }
  barb('#8b9c7a',[-.046,1.093],[-.067,1.125],[-.124,1.153],.054);
  for(let i=0;i<5;i++){
    const y=1.113-i*.022, reach=.165+i*.011;
    barb(i%2?'#718571':'#91a085',[-.067,y-.015],[-.066,y+.010],[-reach,y+.023-i*.012],.050);
    line('#536856',[[-.073,y],[-.134,y+.003],[-reach,y+.023-i*.012]],[.013,.008,.0015],.054);
  }
  line('#866f4a',[[.110,1.084],[.16,1.133],[.216,1.119],[.232,1.155]],[.009,.007,.005,.0015],.069);
  line('#82714f',[[.123,1.068],[.183,1.078],[.213,1.043],[.246,1.058]],[.008,.006,.004,.0015],.064);
  line(oldBronze,[[-.132,.885],[-.080,.948],[-.024,.917],[.042,.940],[.078,.950]],[.024,.025,.015,.014,.009],.048);
  for(const [y,bend,tip] of [[.946,.962,.981],[.952,.933,.941],[.943,.914,.918]])
    line('#857955',[[.070,y],[.097,bend],[.120,tip]],[.010,.007,.002],.056);
  line(oldBronze,[[.129,.748],[.194,.731],[.184,.687],[.207,.679]],[.017,.014,.008,.006],.028);
  for(let k=0;k<3;k++)line('#997f54',[[.197,.682],[.219+k*.004,.672+k*.008],[.227+k*.004,.658+k*.009]],[.006,.004,.001],.032);
  s.ball('#c6ae73',.145,.965,z+.034,.033,.033,.022);
}

function cypressRoof(s){
  const r=DRAGON_ROOF, palette=['#666b5d','#777b68','#6e7364','#848371'];
  function roofPoint(side,t,along){
    return [side*t*r.width/2,dragonRoofHeight(t)+.034*along**4*t,r.z+along*r.depth/2*(.89+.11*t)];
  }
  for(const side of [-1,1]){
    for(let j=0;j<9;j++){
      surface(s,palette[(j+(side+1))%4],2,9,(u,v)=>{
        const p=roofPoint(side,(j+v)/9,2*u-1);
        p[1]+=.012*v;
        return p;
      });
      surface(s,'#525a50',1,9,(u,v)=>{
        const p=roofPoint(side,(j+1)/9,2*u-1);p[1]+=.012-.019*v;return p;
      });
    }
    surface(s,'#856647',4,9,(u,v)=>{
      const p=roofPoint(side,v,2*u-1);p[1]-=.055;return p;
    });
    for(const end of [-1,1]){
      surface(s,'#ac8157',3,12,(u,v)=>{
        const p=roofPoint(side,u,end);p[1]-=.075*v;return p;
      });
      const edge=Array.from({length:7},(_,i)=>roofPoint(side,i/6,end));
      stroke(s,'#c9a676',edge.map(([x,y,z])=>[x,y-.049,z+end*.006]),.009,12,5);
    }
    for(let j=-3;j<=3;j++){
      const e=roofPoint(side,.977,j/3*.86);
      beam(s,'#b18a63',[e[0]-side*.18,e[1]-.010,e[2]], [e[0],e[1]-.079,e[2]],.043,.046);
    }
    surface(s,'#614f3e',1,8,(u,v)=>{const p=roofPoint(side,1,2*u-1);p[1]+=.015-.078*v;return p;});
  }
  for(const end of [-1,1]){
    const z=r.z+end*.425;
    surface(s,'#935f40',1,12,(u,v)=>{
      const x=(2*u-1)*.52;return [x,r.eave-.022+v*(roofPoint(1,Math.abs(x)/(r.width/2),0)[1]-r.eave-.028),z];
    });
    for(const x of [-.38,-.25,-.12,.12,.25,.38]){
      const y=dragonRoofHeight(Math.abs(x)/(r.width/2))-.052;
      beam(s,'#79563d',[x,r.eave-.010,z+end*.002],[x,y,z+end*.002],.009,.008);
    }
    s.box(heartwood,0,r.eave+.115,z+end*.011,.064,.25,.065);
    for(const side of [-1,1]){
      beam(s,'#795437',[side*.44,r.eave+.008,z],[0,r.ridge-.072,z],.045,.054);
      const a=[-side*.16,r.ridge-.147,z+end*.152], b=[side*.145,r.ridge+.113,z+end*.152];
      beam(s,'#92765a',a,b,.035,.047);
    }
  }
  s.box('#655846',0,r.ridge+.012,r.z,.121,.085,r.depth*.94);
  for(const at of [-.30,0,.30])
    s.post('#a89975',0,r.ridge+.084,at+r.z,.041,.205,.041,0,0,PI/2);
}

function sacredRope(s){
  const z=.544;
  for(let strand=0;strand<2;strand++){
    const knots=[],radii=[];
    for(let i=0;i<=36;i++){
      const u=i/18-1,twist=i*.98+strand*PI,load=1-.25*u*u;
      knots.push([u*.53,1.383-.077*(1-u*u)+.009*load*cos(twist),z+.009*load*sin(twist)]);
      radii.push(.010*load);
    }
    stroke(s,strand?'#c2aa76':'#97805a',knots,radii,52,5);
  }
  for(const x of [-.37,0,.37]){
    const y=1.383-.077*(1-(x/.53)**2);
    for(let j=0;j<3;j++){
      const shift=j*.012;
      surface(s,j===1?'#cfcbb2':'#e9e2c6',1,1,(u,v)=>
        [x+shift+(u-.5)*.042+v*.009,y-.009-j*.027-.029*v,z+.014+j*.004+v*.009]);
    }
  }
}

function shrineFinish(){
  const m=brushWash(new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}),.19);
  const ink=m.onBeforeCompile, inkKey=m.customProgramCacheKey();
  m.onBeforeCompile=function(shader,renderer){
    ink.call(this,shader,renderer);
    shader.vertexShader='varying vec3 shrinePoint;\n'+shader.vertexShader.replace(
      '#include <begin_vertex>','#include <begin_vertex>\nshrinePoint=position;');
    shader.fragmentShader='varying vec3 shrinePoint;\n'+shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      vec3 p=shrinePoint;
      float vein=p.y<1.40 ? 267.*p.x+212.*p.z+2.2*sin(6.1*p.y+13.*p.x) : 292.*p.z+1.8*sin(8.*p.x);
      float age=.5+.5*sin(vein+.68*sin(2.27*vein)+1.4*sin(6.8*p.x+7.4*p.z+3.1*p.y));
      float tooth=smoothstep(.72,.98,age)*(1.-smoothstep(.42,1.8,fwidth(vein)));
      if(p.y<.351){
        float lichen=.5+.21*sin(19.*p.x+3.6*sin(10.*p.z+12.*p.y))+.16*cos(17.*p.y-12.*p.z+3.4*sin(17.*p.x))+.13*sin(dot(p,vec3(48.,33.,-52.)));
        diffuseColor.rgb*=mix(vec3(.87,.92,.81),vec3(1.06,1.05,1.02),smoothstep(.18,.75,lichen));
      }else diffuseColor.rgb*=1.-.14*tooth;
    `);
  };
  m.customProgramCacheKey=()=>inkKey+'-kaede-cedar-granite';
  return m;
}

export function buildKaedeDragonShrine(){
  const s=sculpture(), p=DRAGON_PLINTH;
  granite(s,p.width-.084,p.depth-.08,p.bottom,p.top-.110,['#7f8174','#909080','#848676']);
  granite(s,p.width,p.depth,p.top-.122,p.top,['#989c89','#aaa994','#9ca18a']);
  sanctuary(s);waterDragon(s);cypressRoof(s);sacredRope(s);
  const mesh=new T.Mesh(s.finish(),shrineFinish());
  mesh.name='楓清水の龍神祠';
  mesh.castShadow=mesh.receiveShadow=true;
  return mesh;
}
