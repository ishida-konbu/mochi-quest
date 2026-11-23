import * as T from './vendor/three.module.min.js';
import { DRAGON_CHAMBER } from './kaede-dragon-layout.js';

const hinoki = '#efe4cd', weathered = '#d2c9b8', endCut = '#f2dfaf';
const smoked = '#897d6d', iron = '#c5bdae', oiled = '#a5a5a2';

function wood(b, color, x, y, z, w, h, d, grain, seed, bevel = 0) {
  b.box('wood', color, [x, y, z], [w, h, d], {grain, seed, bevel});
}

// Extruded profiles let light catch the scalloped ends of a hijiki or the
// lip of a hand-forged hinge, even viewed sideways from the spring.
function profile(b, kind, color, path, front, back, grain, seed) {
  const outline = path.map(([x,y]) => new T.Vector2(x,y));
  for (const tri of T.ShapeUtils.triangulateShape(outline, [])) {
    for (const z of [front, back]) {
      const order = z === front ? tri : [...tri].reverse();
      b.face(kind, color, order.map(i => [...path[i], z]), {grain, seed});
    }
  }
  for (let i = 0; i < path.length; i++) {
    const a = path[i], c = path[(i+1) % path.length];
    b.face(kind, color, [[...a,back],[...c,back],[...c,front],[...a,front]], {grain, seed});
  }
}

function foundation(b) {
  const {bottom, width, depth} = DRAGON_CHAMBER;
  const halfW = width / 2, halfD = depth / 2;
  // The sill frame is lifted clear of the damp stone on four short piers.
  for (const x of [-.442, .442]) for (const z of [-.296, .296]) {
    wood(b, smoked,x,.409,z,.148,.118,.143,'y',x+z+.9,.006);
  }
  for (const z of [-.295,.295]) {
    wood(b, weathered,0,bottom+.114,z,1.105,.108,.104,'x',z+.47,.005);
  }
  for (const x of [-.444,.444]) {
    wood(b, weathered,x,.469,.012,.102,.080,.836,'z',x+.83,.004);
  }
  // The outermost deck board forms the narrow worshipper-facing ledge.
  for (let i=0;i<8;i++) {
    const z=-halfD+i*.122;
    wood(b,i===7?weathered:hinoki,0,.535,z,2*halfW+.115,.050,.120,'x',3.29+i*.871,.0025);
  }
  for (const z of [-.317,.317]) {
    wood(b,weathered,0,.594,z,.984,.070,.100,'x',4.01+z,.003);
  }
  for(const x of [-.443,.443]) {
    wood(b,weathered,x,.593,0,.098,.069,.626,'z',4.43+x,.003);
  }
}

function walls(b) {
  // The frame encloses the backs of the two front grilles, so openings read
  // as a real, deep interior in oblique as well as straight-on views.
  wood(b,'#675d50',0,.910,-.045,.813,.646,.467,'y',8.05);
  for (const side of [-1,1]) {
    for (const end of [-1,1]) {
      wood(b,weathered,side*.444,.955,end*.319,.096,.790,.091,'y',9+side+.18*end,.005);
    }
    for (let i=0; i<5; i++) {
      wood(b, i===1||i===4?'#d4c5ac':'#e4d3b6',side*.427,.938,-.212+i*.106,.039,.661,.1045,'y',11+i*.47+side);
    }
    // Exposed nuki cross the vertical wallboarding and enter the posts.
    for (const [y,h] of [[.650,.050],[.828,.046],[1.198,.066]]) {
      wood(b,weathered,side*.455,y,0,.045,h,.628,'z',13+y+side,.0015);
      for (const z of [-.323,.323]) {
        wood(b,'#b6a58c',side*.493,y,z,.008,h*.50,.032,'z',14+y+z);
      }
    }
  }
  for(let i=0;i<7;i++) {
    wood(b,'#d6cbb6',-.345+i*.115,.932,-.318,.1135,.652,.052,'y',15+i*.71);
  }
  for(const y of [.657,.824,1.192]) {
    wood(b,weathered,0,y,-.341,.889,.045,.038,'x',17+y);
  }
}

// San-karado with a lower field held in a bevelled rebate and a set of
// upper vertical renji. The stiles run through; the rails meet them end-on.
function door(b, side) {
  const cx=side*.195, z=.332;
  const w=.381, stile=.034, clear=w-2*stile;
  const left=cx-clear/2, right=cx+clear/2;
  for (const dx of [-1,1]) {
    wood(b,hinoki,cx+dx*(w-stile)/2,.923,z,stile,.604,.052,'y',19+cx+dx,.0025);
  }
  for (const [y,h] of [[.651,.060],[.897,.042],[1.192,.066]]) {
    wood(b,hinoki,cx,y,z,clear,h,.052,'x',22+y+side,.002);
  }
  const y0=.683,y1=.873, edge=.014, front=.350, field=.339;
  const inner=[[left+edge,y0+edge],[right-edge,y0+edge],[right-edge,y1-edge],[left+edge,y1-edge]];
  const outer=[[left,y0],[right,y0],[right,y1],[left,y1]];
  for(let i=0;i<4;i++) {
    const j=(i+1)%4;
    b.face('wood',weathered,[[...outer[i],field],[...outer[j],field],[...inner[j],front],[...inner[i],front]],{grain:'y',seed:23+side});
  }
  const width=clear-2*edge;
  for (let i=0;i<2;i++) {
    wood(b,i===0?'#f0debc':'#e5d4b7',cx+(i-.5)*width/2,(y0+y1)/2,front-.007,
      width/2-.0008,y1-y0-2*edge,.014,'y',25+side+i*.47);
  }
  for(let i=0;i<7;i++) {
    wood(b,i===2||i===5?'#dfcfb4':hinoki,left+clear*(i+.5)/7,1.038,.331,.0195,.239,.029,
      'y',27+i*.49+side);
  }
  wood(b,'#b4a58e',cx,1.033,.307,clear,.020,.022,'x',30+side);
}

function ironNail(b,x,y,z,size) {
  const head=new T.SphereGeometry(1,7,3,0,2*Math.PI,0,Math.PI/2);
  head.rotateX(Math.PI/2).scale(size,size,size*.51).translate(x,y,z);
  b.add('metal',oiled,head,{seed:34+x+y});
}

function doorHardware(b,side) {
  // A shouldered strap broadens at its forged tip. Two small peened heads
  // secure the strap to each rail, with the pintle seated in the doorjamb.
  const pivot=side*.383;
  for (const y of [.649,1.191]) {
    const blade=[[0,-.015],[.061,-.014],[.101,-.007],[.120,-.008],[.127,-.013],
      [.146,0],[.127,.013],[.12,.008],[.101,.007],[.060,.014],[0,.015]];
    profile(b,'metal',iron,blade.map(([u,v])=>[pivot-side*u,y+v]),.366,.358,'x',38+y+side);
    b.box('metal',iron,[side*.401,y,.361],[.034,.031,.015],{bevel:.003,seed:40+y});
    const pin=new T.CylinderGeometry(.0073,.0073,.056,9);
    pin.translate(pivot,y,.369);
    b.add('metal',iron,pin,{grain:'y',seed:41+side});
    for(const d of [.043,.118]) ironNail(b,pivot-side*d,y,.367,.0043);
    ironNail(b,side*.401,y,.368,.0044);
  }
  // Small, pear-shaped drop pulls on a blackened iron back plate.
  const x=side*.049, y=.900, z=.366;
  profile(b,'metal',oiled,[[x-.018,y-.007],[x-.018,y+.009],[x-.009,y+.017],
    [x+.009,y+.017],[x+.018,y+.009],[x+.018,y-.007],[x+.007,y-.018],[x-.007,y-.018]],
    z,z-.007,'y',42+side);
  const pull=new T.TorusGeometry(.014,.0028,5,16);
  pull.scale(1,1.26,1).rotateX(-.19).translate(x,y-.021,z+.011);
  b.add('metal',iron,pull,{grain:'y',seed:43+side});
  ironNail(b,x,y+.003,z+.006,.0067);
}

function brackets(b) {
  for (const x of [-.444,.444]) for(const z of [-.319,.319]) {
    wood(b,weathered,x,1.232,z,.112,.033,.115,'x',46+x+z,.003);
    const bearing=[[-.054,-.010],[.054,-.010],[.063,.009],[.073,.016],[.073,.036],
      [-.073,.036],[-.073,.016],[-.063,.009]];
    profile(b,'wood',hinoki,bearing.map(([dx,dy])=>[x+dx,1.251+dy]),
      z+.058,z-.058,'x',47+x-z);
    // Hijiki: a curved shoulder rises to a squared-off bearing at each end.
    const profilePts=[[-.121,.023],[-.096,.023],[-.087,.018],[-.082,.009],[-.073,.003],
      [-.053,.002],[-.045,-.007],[-.044,-.013],[.044,-.013],[.045,-.007],[.053,.002],
      [.073,.003],[.082,.009],[.087,.018],[.096,.023],[.121,.023],[.121,.053],[-.121,.053]];
    profile(b,'wood',weathered,profilePts.map(([dx,dy])=>[x+dx,1.298+dy]),
      z+.038,z-.038,'x',48+x+z);
    for(const side of [-1,1]) {
      wood(b,endCut,x+side*.088,1.360,z,.068,.029,.087,'z',49+x+side*.2,.002);
    }
  }
  for(const z of [-.319,.319]) {
    wood(b,weathered,0,1.390,z,1.195,.041,.101,'x',50+z,.003);
  }
  for(const x of [-.444,.444]) {
    wood(b,weathered,x,1.368,.008,.076,.048,.876,'z',51+x,.0025);
  }
  // Doorhead sits beneath the exposed blockwork, with a slightly projecting
  // drip moulding and a dark space between it and the eave.
  wood(b,hinoki,0,1.236,.318,.971,.045,.095,'x',52.91,.003);
  wood(b,weathered,0,1.280,.302,.846,.049,.060,'x',53.03,.002);
  wood(b,'#ab9d87',0,1.332,.261,.900,.071,.058,'y',53.24);
}

function laidRope(b) {
  const points=54, sides=4, z=.440;
  const line=(x)=>1.283-.061*(1-(x/.459)**2);
  const hemp=['#ddd0ae','#f1dfbb','#d8c39c'];
  for(let strand=0;strand<3;strand++) {
    const tube=[], indices=[];
    for(let i=0;i<=points;i++) {
      const x=.459*(2*i/points-1), theta=i/points*2*Math.PI*10+strand*2*Math.PI/3;
      const r=.005+.006*Math.sin(Math.PI*i/points);
      const yc=line(x)+Math.cos(theta)*r*.80, zc=z+Math.sin(theta)*r*.80;
      for(let j=0;j<sides;j++) {
        const a=2*Math.PI*j/sides;
        tube.push(x,yc+r*Math.cos(a),zc+r*Math.sin(a));
        if(i<points) {
          const p=i*sides+j,q=i*sides+(j+1)%sides;
          indices.push(p,q,p+sides,p+sides,q,q+sides);
        }
      }
    }
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(tube,3));
    g.setIndex(indices);g.computeVertexNormals();
    b.add('rope',hemp[strand],g,{grain:'x',seed:59+strand});
  }
  for(const side of [-1,1]) {
    const peg=new T.CylinderGeometry(.010,.009,.098,8);
    peg.rotateX(Math.PI/2).translate(side*.454,1.281,.402);
    b.add('wood',endCut,peg,{grain:'z',seed:60+side});
    const wraps=[];
    for(let i=0;i<3;i++) {
      wraps.push(new T.Vector2(.012,i*.0055),new T.Vector2(.015,i*.0055+.0028));
    }
    wraps.push(new T.Vector2(.012,.0165));
    const binding=new T.LatheGeometry(wraps,9);
    binding.rotateX(Math.PI/2).translate(side*.454,1.282,.425);
    b.add('rope',hemp[0],binding,{grain:'x',seed:62+side});
  }
  // Three unbleached folded paper streamers. Each fold changes direction
  // and surface angle in depth; the stepped edge follows the cut of a shide.
  for(const [x,slant] of [[-.271,-.006],[-.027,.003],[.240,.009]]) {
    const y=line(x)-.008;
    const ribbon=[
      [[-.010,0,0],[.009,0,0],[.009,-.027,.004],[-.010,-.027,.004]],
      [[-.010,-.027,.004],[.009,-.027,.004],[.034,-.048,.001],[.009,-.048,.001]],
      [[.009,-.048,.001],[.034,-.048,.001],[.032,-.071,.007],[.006,-.071,.007]],
      [[.006,-.071,.007],[.032,-.071,.007],[.051,-.092,.010],[.025,-.092,.010]],
      [[.025,-.092,.010],[.051,-.092,.010],[.046,-.113,.005],[.020,-.113,.005]]
    ];
    ribbon.forEach((fold,i)=>b.face('paper',i%2?'#e0dace':'#fff9e9',
      fold.map(([dx,dy,dz])=>[x+dx+slant*(-dy/.113),y+dy,z+.012+dz]),{grain:'y',seed:i+.71}));
  }
}

export function buildHokoraJoinery(b) {
  foundation(b);
  walls(b);
  for(const side of [-1,1]) {
    door(b,side);
    doorHardware(b,side);
  }
  brackets(b);
  laidRope(b);
}
