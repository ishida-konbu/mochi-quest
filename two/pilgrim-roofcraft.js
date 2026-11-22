// Timber, tile and thatch are drawn in the dimensions of the actual building.
// The exposed lower surface, bargeboards and eaves follow the same roof as
// its weather side, including the rising ends of the harbor boat and the snow.
import * as T from './vendor/three.module.min.js';
import { pilgrimRoofPoint } from './pilgrim-lodge-plan.js';
import { brushStroke } from './pilgrimage-pigment.js';
import { skinGeometry } from './ryugu-sculpt.js';

export const ink='#443c32',wood='#876744',straw='#b29b72',cedar='#6c5041';
const {PI,sin,cos}=Math;
export function stroke(s,col,points,radii,steps=Math.max(5,points.length*2),sides=5){
  s.add(brushStroke(points,Array.isArray(radii)?radii:points.map(()=>radii),steps,sides),col);
}
export function beam(s,c,a,b,width,depth=width,round=false){
  const [x,y,z]=b.map((v,i)=>v-a[i]);
  const len=Math.hypot(x,y,z),flat=Math.hypot(x,z);
  const place=[c,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,width,len,depth,
    Math.atan2(flat,y),Math.atan2(x,z)];
  if(round)s.post(...place);else s.box(...place);
}
export function turned(s,c,x,y,z,rings,segments=26){
  const g=new T.LatheGeometry(rings.map(([r,h])=>new T.Vector2(r,h)),segments);
  s.add(g,c,x,y,z);
}
export function surface(s,col,rows,cols,at,tone){
  const g=skinGeometry(rows,cols,at);
  if(tone){
    const rgb=[],p=new T.Color();
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      const [color,value]=tone(i/cols,j/rows);
      p.set(color).multiplyScalar(value);rgb.push(p.r,p.g,p.b);
    }
    g.setAttribute('color',new T.Float32BufferAttribute(rgb,3));
  }
  s.add(g,col);
}
function paintedEdge(s,at,color){
  // A deep eave casts a continuous brush-like shadow. Successive cross
  // sections turn the corner together so the dark return is visible below.
  for(const side of [-1,1]){
    const points=Array.from({length:19},(_,i)=>at(i/9-1,side));
    for(const [lift,tint,r] of [[0,color,.046],[-.081,'#594d40',.052],[-.13,'#846c52',.027]]){
      stroke(s,tint,points.map(([x,y,z])=>[x,y+lift,z]),r,24);
    }
    surface(s,color,2,26,(u,v)=>{
      const [x,y,z]=at(2*u-1,side);return [x,y-.129*(1-v),z];
    });
    for(const dir of [-1,1]){
      const bevel=Array.from({length:11},(_,j)=>at(dir,side*j/10));
      stroke(s,color,bevel,.045,15);
    }
  }
}
const finish={
  dawn:['#9e8a70','#8d7b65','#664a37'],peach:['#a38a5e','#8f7c54','#7e6948'],
  temple:['#71736d','#85847a','#535754'],inari:['#726551','#89765e','#574a3f'],
  tsuruga:['#6d6960','#89806f','#564d3f'],sakai:['#74766b','#646b65','#4d5853'],
  snow:['#eaeeea','#dce6e6','#b1c2c6'],
};
export function lodgeRoof(s,kind,r){
  const w=(r.w+.66)/2,d=(r.d+.65)/2,e=r.eave,rise=r.rise;
  const [light,shade,edge]=finish[kind];
  const hip=['temple','dawn'].includes(kind),tiled=kind==='temple'||kind==='sakai';
  const at=(u,v)=>pilgrimRoofPoint(kind,w,d,e,rise,u,v);
  const bands=tiled?22:kind==='snow'?14:18;
  for(const side of [-1,1]){
    const half=(u,v)=>at(2*u-1,v*side);
    surface(s,'#fff',bands,64,half,(u,v)=>{
      const g=.5+.5*sin(7.3*u+2*v)*cos(8*u-3*v);
      const grain=kind==='snow'?.014*sin(u*91+v*14):.042*sin(u*156.7)*sin(v*3.6+u);
      return [Math.floor(v*bands)%4===1 && kind!=='snow'?shade:light,.93+.09*g+grain];
    });
    surface(s,kind==='snow'?'#786958':'#77634f',8,18,(u,v)=>{
      const [x,y,z]=half(u,v);return [x,y-(kind==='snow'?.24:.13),z*.995];
    });
    if(tiled){
      // Parallel round tiles have concave pans in between. Hip ridges cut
      // across these courses; antique half-round caps finish the drip edge.
      const n=Math.round(w*8);
      for(let j=0;j<=n;j++){
        const u=-.972+1.944*j/n;
        const points=Array.from({length:11},(_,i)=>{const [x,y,z]=at(u,side*i/10);return [x,y+.030,z];});
        stroke(s,j%3?'#777a74':'#8e8d81',points,.045,14,6);
        const [x,y,z]=points[10];
        s.post(edge,x,y-.025,z+side*.02,.079,.070,.079,PI/2);
        s.post('#a09c8c',x,y-.026,z+side*.064,.023,.016,.023,PI/2);
      }
      for(let j=1;j<=6;j++){
        const v=side*j/7;
        stroke(s,edge,Array.from({length:13},(_,i)=>at(i/6-1,v)),.012,16);
      }
    }else if(kind==='tsuruga'){
      for(let j=1;j<=7;j++){
        const v=j/8*side;
        const seam=Array.from({length:27},(_,i)=>{
          const [x,y,z]=at(i/13-1,v);return [x,y+.022,z];
        });
        stroke(s,j%2?'#a08d71':'#503f31',seam,j%2?.018:.022,28);
        for(const k of [-.80,-.45,0,.43,.80]){
          const [x,y,z]=at(k,v);s.ball('#4b4641',x,y+.043,z,.035,.023,.030);
        }
      }
    }else if(kind==='peach'){
      for(let j=0;j<=79;j++){
        const u=(j/79-.5)*1.96,v=.67+.13*(.5+.5*cos(j*2));
        const a=at(u,v*side),b=at(u+.003,side);
        a[1]+=.025;b[2]+=.048*side;b[1]-=.071+.044*sin(j*2.4);
        beam(s,j%3?straw:'#897551',a,b,.021,.012,true);
      }
    }else if(kind==='inari'){
      for(let j=1;j<9;j++){
        const v=j/9*side;
        stroke(s,'#574d3d',Array.from({length:15},(_,i)=>at(i/7-1,v)),.016,18);
      }
    }
  }
  paintedEdge(s,at,edge);
  // Actual rafter tails can be seen against the light when the player looks
  // up from the bench. Their ends stop at the fascia, clear of its outline.
  const n=Math.ceil(w*4.05);
  for(let i=0;i<=n;i++)for(const side of [-1,1]){
    const u=(i/n-.5)*1.9,start=at(u*.96,side*.32),end=at(u,side*.97);
    start[1]-=.16;end[1]-=.155;
    beam(s,i%3?cedar:wood,start,end,.056,.085);
  }
  const ridge=Array.from({length:25},(_,i)=>at((i/12-1)*(hip?.51:1),0));
  for(const [lift,col,thick] of [[.018,edge,.101],[.106,tiled?'#939188':kind==='snow'?'#edf0ed':'#9e8868',.051]]){
    stroke(s,col,ridge.map(([x,y,z])=>[x,y+lift,z]),thick,28,7);
  }
  if(kind==='temple'){
    for(const sx of [-1,1])for(const sz of [-1,1]){
      const run=Array.from({length:13},(_,i)=>{
        const q=i/12,[x,y,z]=at(sx*(.48+.52*q),sz*q);return [x,y+.055,z];
      });
      stroke(s,'#89897f',run,.094,16,7);
    }
  }
  return at;
}

// A hollow framed bay, with a lower kick-panel and individually sized muntins.
// The posts project on both faces and the upper rail meets the timber socket.
export function screenBay(s,x1,x2,z,h,finish='paper'){
  const low=.79,upper=h-.24,w=x2-x1,c=(x2+x1)/2;
  s.box(cedar,c,.10,z,w,.19,.146);
  s.box('#968364',c,.44,z,w,.59,.080);
  for(let j=1;j<w/.24;j++)s.box('#72604b',x1+j*.24,.44,z+.043,.013,.58,.014);
  s.box(wood,c,low,z,w,.105,.14);
  if(finish==='paper')s.box('#d6c9aa',c,(low+upper)/2,z-.024,w,upper-low,.028);
  const spacing=finish==='slat'?.14:.41,posts=Math.ceil(w/spacing);
  for(let j=0;j<=posts;j++){
    const x=x1+w*j/posts;
    s.box(finish==='slat'?'#847155':'#79654f',x,(upper+low)/2,z+.018,finish==='slat'?.059:.029,upper-low,.066);
  }
  const n=finish==='slat'?2:4;
  for(let j=0;j<=n;j++)s.box(wood,c,low+(upper-low)*j/n,z+.047,w,j===0||j===n?.088:.032,.071);
}
