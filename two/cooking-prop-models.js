import { MALLET_HANDLE_END } from './living-layout.js';
// Cooking implements are measured at their contact surfaces. One atlas and
// one mesh per moving implement keep the seams and patina attached to it.
import * as T from './vendor/three.module.min.js';
import { cookingAtlas } from './cooking-atlases.js';
import { InkForm, surface } from './ryugu-ink.js';
import { brushWash } from './scroll-sculpt.js';

const tau = Math.PI * 2;
const atlas = { wood:0, rice:1, paper:2, clay:3, cloth:4, leaf:5, end:6, iron:7 };
const origin = [0,0,0], unit = [1,1,1];
let pigment;

function kitchenPaint() {
  if (!pigment) {
    const map=cookingAtlas('materials');
    pigment = brushWash(new T.MeshStandardMaterial({map,vertexColors:true,roughness:.72,side:T.DoubleSide}),.14);
  }
  return pigment;
}

function implement(name, build) {
  const f = new InkForm(atlas,4,2);
  build(f);
  const mesh = new T.Mesh(f.geometry(),kitchenPaint());
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

// Profile from the lower end to the upper end and back along the inside.
function turn(f, profile, position, tint, tile, rotation=origin, sides=44, grainPlane=false) {
  const g = new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(Math.max(.0001,r),h)),sides);
  // Fibres run along the tool's axis. A planar cut through the timber
  // keeps annual rings and lid planks from twisting into a pinwheel.
  if(tile==='wood' || tile==='end') {
    const radius=Math.max(...profile.map(([r])=>r));
    const heights=profile.map(([,h])=>h),lo=Math.min(...heights),hi=Math.max(...heights);
    const {position:point,uv}=g.attributes;
    for(let i=0;i<point.count;i++) {
      const x=point.getX(i),y=point.getY(i),z=point.getZ(i);
      if(grainPlane || tile==='end') uv.setXY(i,.51+.44*x/radius,.49+.44*z/radius);
      else uv.setXY(i,.08+.84*(y-lo)/(hi-lo),.48+.35*(.78*x+.62*z)/radius);
    }
  }
  f.draw(g,position,unit,tint,rotation,tile);
  g.dispose();
}

function patch(f,strips,rings,point,tint,tile,texcoord) {
  const positions=[], indices=[], uv=[];
  for(let j=0;j<=rings;j++) for(let i=0;i<=strips;i++) {
    const u=i/strips, v=j/rings;
    const p=point(u,v);
    positions.push(...p);
    uv.push(...(texcoord?texcoord(p):[u,v]));
    const k=j*(strips+1)+i;
    if(i<strips && j<rings) indices.push(k,k+strips+1,k+1,k+1,k+strips+1,k+strips+2);
  }
  const g=surface(positions,indices,uv);
  f.draw(g,origin,unit,tint,origin,tile);
  g.dispose();
}

export function makeMallet() {
  return implement('水を含ませた欅の横杵',f=>{
    // A turned cross-head with slightly crowned striking faces and a wedged tang.
    const rotation=[0,0,-Math.PI/2];
    turn(f,[[.001,-.167],[.051,-.165],[.065,-.160]],origin,'#b99368','end',rotation,52);
    turn(f,[[.065,-.160],[.071,-.150],[.074,-.105],[.071,-.018],[.072,.079],
      [.067,.145],[.061,.159]],origin,'#c8a16e','wood',rotation,52);
    turn(f,[[.061,.159],[.048,.163],[.001,.165]],origin,'#c4a277','end',rotation,52);
    turn(f,[[.001,-.073],[.025,-.073],[.028,.056],[.030,.097],[.027,.175],
      [.023,.37],[.024,.51],[.023,.63],[.021,.75],[.024,.86],
      [.026,.893],[.023,.915],[.001,MALLET_HANDLE_END]],
      [0,-.013,0],'#d5b588','wood',[Math.PI/2,0,0],32);
    f.stroke([[0,-.030,-.066],[.003,-.015,-.075],[-.001,.005,-.070]],
      [.003,.004,.001],'#765844','end',5,8);
  });
}

export function makeLid() {
  return implement('蒸籠の板蓋',f=>{
    turn(f,[[.0001,-.014],[.248,-.014],[.260,-.010],[.269,-.007],[.272,-.002],
      [.272,.011],[.266,.016],[.001,.016]],origin,'#c6a271','wood',origin,44,true);
    for(const z of [-.132,.0,.132]) {
      const w=Math.sqrt(.263**2-z*z)-.003;
      f.stroke([[-w,.0163,z],[-.33*w,.0163,z+.001],[w,.0163,z-.001]],
        [.0008,.0013,.0007],'#91764f','wood',4,6);
    }
    // The narrow crosspiece is rounded on top where the cook pinches it.
    turn(f,[[.001,-.090],[.012,-.089],[.021,-.082],[.019,.080],
      [.014,.088],[.001,.090]],[0,.030,0],'#ad885b','wood',[0,0,-Math.PI/2],22);
    for(const x of [-.061,.061]) f.oval([x,.049,0],[.005,.0013,.005],'#725a43',origin,'end');
  });
}

export function makeBowl() {
  return implement('洗い米の片口鉢',f=>{
    // The throwing foot, flaring wall and rolled lip surround an actual hollow.
    turn(f,[[.001,.006],[.048,.006],[.049,.001],[.059,.001],[.060,.011],[.073,.016],
      [.095,.030],[.124,.057],[.147,.094],[.154,.106],[.153,.113],[.147,.116],
      [.143,.113],[.141,.102],[.119,.067],[.091,.042],[.061,.028],[.001,.024]],
      origin,'#b6bab1','clay');
    turn(f,[[.145,.105],[.153,.107],[.153,.111],[.148,.115],[.144,.113]],
      origin,'#867b63','clay');
    for (let i=0;i<3;i++) {
      const y=.035+i*.016,r=.103+i*.014;
      turn(f,[[r,y],[r+.0015,y+.001],[r+.001,y+.003]],origin,'#8b978e','clay');
    }
    // A small pair of iron-oxide brush marks sits on the potter's glaze.
    for (const a of [.4,.53,.65]) {
      const p=(r,y,t)=>[r*Math.sin(t),y,r*Math.cos(t)];
      f.stroke([p(.121,.057,a-.05),p(.135,.077,a),p(.145,.094,a+.09)],
        [.0007,.0025,.0004],'#7e816c','clay',4,6);
    }
  });
}

export function makePaddle() {
  return implement('桜材のしゃもじ',f=>{
    // Thin hewn sides merge into a cupped, bevelled blade. The grip follows +Z.
    for(const face of [-1,1]) patch(f,18,24,(u,v)=>{
      const w=(.012+.071*Math.sin(Math.PI*v)**.66)*Math.min(1,.095+v*12);
      const z=-.115+.216*v;
      return [(2*u-1)*w,face*(.002+.004*Math.sin(Math.PI*u))+.010*(2*u-1)**2+.016*(1-v)**2,z];
    },face===1?'#d9b989':'#c8a67d','wood',([x,,z])=>[.45+2.8*z,.53+2.8*x]);
    for(const side of [-1,1]) patch(f,2,24,(u,v)=>{
      const w=(.012+.071*Math.sin(Math.PI*v)**.66)*Math.min(1,.095+v*12);
      return [side*w,(2*u-1)*.002+.010+.016*(1-v)**2,-.115+.216*v];
    },'#ba9a72','end');
    turn(f,[[.001,.068],[.016,.086],[.018,.103],[.016,.135],[.014,.218],[.016,.238],[.012,.248],[.001,.251]],
      [0,.006,0],'#d3b184','wood',[Math.PI/2,0,0],24);
  });
}

export function makeBoard() {
  return implement('俎板',f=>{
    // Parallel-grain face with clipped corners, separate sawn ends and knife traces.
    const hw=.226,hd=.165,b=.009, corners=[
      [-hw+b,-hd],[hw-b,-hd],[hw,-hd+b],[hw,hd-b],[hw-b,hd],[-hw+b,hd],[-hw,hd-b],[-hw,-hd+b]];
    const top=(x,z)=>.0012*Math.sin(5*x+3*z);
    for(let i=0;i<8;i++) {
      const [ax,az]=corners[i], [bx,bz]=corners[(i+1)%8];
      patch(f,6,2,(u,v)=>{
        const x=(ax+(bx-ax)*u)*v,z=(az+(bz-az)*u)*v;
        return [x,top(x,z),z];
      },'#d2b184','wood',([x,,z])=>[.5+x/(2*hw),.5+z/(2*hd)]);
      patch(f,5,2,(u,v)=>{
        const x=ax+(bx-ax)*u,z=az+(bz-az)*u;
        return [x,top(x,z)-v*.036,z];
      },'#b99568',Math.abs(ax-bx)>.10?'wood':'end');
    }
    for(let i=0;i<12;i++) {
      const x=-.16+i*.022,z=.012*Math.cos(3.99*i),a=.016*Math.sin(1.7*i);
      f.stroke([[x-.015,top(x-.015,z-.056)+.0002,z-.056],[x+a,top(x+a,z)+.0004,z],[x+a+.027,top(x+a+.027,z+.051)+.0004,z+.051]],
        [.00018,.0006,.00014],'#b89a76','wood',3,4);
    }
  });
}

export function makePrepDish() {
  return implement('薬味の豆皿',f=>{
    turn(f,[[.001,.003],[.024,.003],[.025,.0005],[.030,.0005],[.031,.004],
      [.039,.006],[.048,.011],[.052,.015],[.050,.018],[.046,.015],
      [.036,.010],[.023,.008],[.001,.008]],origin,'#c6c1ac','clay',origin,32);
    turn(f,[[.049,.015],[.051,.016],[.050,.018],[.048,.018]],origin,'#878e79','clay',origin,32);
  });
}

const colours = {rice:'#fff1d1',brownRice:'#ceb38a',azuki:'#944f49',soy:'#bb905b',
  herb:'#72906a',sesame:'#514a3e',sakura:'#ca8b95',salt:'#f4ede2',sugar:'#e7d9b1'};

export function ingredientStudy(id, amount, prepared) {
  return implement(id+'の下ごしらえ',f=>{
    const tint=colours[id], seeds=id==='sesame'||id==='salt'||id==='sugar';
    const leaf=id==='herb', flower=id==='sakura';
    const count=leaf || flower ? Math.min(5,1+Math.round(amount/8)) : Math.min(32,4+Math.round(amount*(seeds?1:.45)));
    for(let i=0;i<count;i++) {
      const a=i*2.39996+(prepared?.7:0), r=Math.sqrt((i+.25)/count);
      const x=.056*r*Math.cos(a),z=.042*r*Math.sin(a),y=.003+.007*(1-r);
      if (flower) {
        const k=.017+Math.min(.011,amount*.00045);
        // The wrinkled petals of the preserved cherry remain attached to their stem.
        for(let j=0;j<5;j++) {
          const d=a+j*tau/5, len=k*(.83+.12*Math.sin(j+i));
          patch(f,7,6,(u,v)=>{
            const b=(2*v-1)*len*.37*Math.sin(Math.PI*u)**.8;
            return [x+u*len*Math.cos(d)-b*Math.sin(d), y+.0045*Math.sin(Math.PI*u)+b*b*18,
              z+u*len*Math.sin(d)+b*Math.cos(d)];
          },j%2?'#d49898':'#c48393','cloth');
        }
        f.stroke([[x,y,z],[x+.013,y+.002,z-.010],[x+.025,y,z-.015]],
          [.0018,.0013,.0006],'#a58971','leaf',4,5);
        f.oval([x,y+.002,z],[.004,.002,.004],'#ccb376',origin,'rice');
      } else if (leaf) {
        const l=prepared?.027:.053;
        patch(f,14,4,(u,v)=>{
          const off=(v*2-1)*l*.35*Math.sin(Math.PI*u)**.8*(.55+.45*Math.abs(Math.cos(5*Math.PI*u)));
          return [x+l*(u-.45)*Math.cos(a)-off*Math.sin(a), y+.004*Math.sin(Math.PI*u)+Math.abs(off)*.15,
            z+l*(u-.45)*Math.sin(a)+off*Math.cos(a)];
        },i%2?'#829568':'#6b885d','leaf');
      } else if (seeds) {
        const size=id==='sesame'?.0044:.0024;
        f.oval([x,y-.002,z],[size,size*.51,size*(id==='sesame'?1.65:1.14)],tint,[0,a,.11],'rice');
      } else {
        const crushed=prepared && i%3!==0, size=crushed?.011:.014;
        f.oval([x,y,z],[size*.73,size*(crushed?.39:.69),size],tint,[0,a,.09*Math.sin(i)],'clay');
        const dx=.004*Math.sin(a), dz=.004*Math.cos(a);
        f.stroke([[x-dx,y+size*.49,z-dz],[x,y+size*.69,z],[x+dx,y+size*.48,z+dz]],
          [.0007,.0011,.0005],id==='azuki'?'#deb3a3':'#887255','rice',4,4);
      }
    }
    if(id==='azuki' && prepared) f.oval([0,.006,0],[.058,.013,.042],'#934e4a',origin,'rice');
  });
}

export function makeSteamingCloth() {
  const pos=[], gathered=[], index=[], uv=[];
  const steps=24, sides=64;
  // The open wet cloth lies in the round basket. Lifting two opposed
  // corners lets the other edges sag around the rice instead of closing it.
  for(let j=0;j<=steps;j++) for(let i=0;i<=sides;i++) {
    const u=i/sides, r=j/steps, a=u*tau, c=Math.cos(a),s=Math.sin(a);
    const hem=Math.pow(r,3), pleat=(Math.sin(11*a+.9)+.28*Math.sin(19*a))*hem;
    const flatR=.217*r*(1+.035*pleat);
    pos.push(flatR*c, .001+.143*r**3+.008*pleat, flatR*s);
    const gatheredR=.165*r*(1-.24*hem*s*s)+.006*pleat;
    gathered.push(gatheredR*c*(1-.12*hem), .158*hem*(.51+.49*Math.abs(c)**3)+.005*pleat,
      gatheredR*s+.035*hem*c*c);
    uv.push(.5+.46*r*c,.5+.46*r*s);
    const k=j*(sides+1)+i;
    if(j<steps && i<sides) index.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);
  }
  const g=surface(pos,index,uv);
  g.morphAttributes.position=[new T.Float32BufferAttribute(gathered,3)];
  // Lifted canvas still exhibits the same faint warp and weft in its corners.
  const coords=g.attributes.uv;
  for(let i=0;i<coords.count;i++) coords.setXY(i,(.016+coords.getX(i)*.969)/4,(.016+coords.getY(i)*.969)/2);
  const gatheredSurface=surface(gathered,index,uv);
  g.morphAttributes.normal=[gatheredSurface.attributes.normal];
  const material=kitchenPaint().clone();
  material.vertexColors=false;material.color.set('#ffecd1');material.roughness=.94;
  const cloth=new T.Mesh(g,material);
  cloth.name='濡らした蒸し布';cloth.castShadow=cloth.receiveShadow=true;
  return cloth;
}
