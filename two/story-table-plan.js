// Half-hidden joinery matters to a notice thrown below the counter. The same
// metre survey feeds both the mesh builder and the player's contact query.
const workshops=[null,
  ['花筏の涼み床','trestle',.73,2.62,1.12,'#98694a','#d8b989'],
  ['竹皮で縛った編み台','bamboo',.75,2.52,1.03,'#536e42','#abaf62'],
  ['蔵町の勘定箪笥','chest',.89,2.65,1.12,'#58392c','#bd8450'],
  ['旅籠の蒸し竈','hearth',.96,2.61,1.11,'#7c5443','#d2af86'],
  ['畦の籾選り台','horse',.82,2.65,1.12,'#887748','#d7c492'],
  ['松原の舟板仕事台','hull',.81,2.68,1.10,'#344e50','#ba9974'],
  ['軒下の寒干し棚','dryer',.80,2.60,1.13,'#5a6572','#b8aa99'],
  ['楓峡の橋板の削り台','horse',.73,2.70,1.03,'#753e30','#bd8565'],
  ['薄野の大三方','altar',.72,2.60,1.10,'#7e542d','#d7b670'],
  ['浦の搗き手の台','trestle',.75,2.61,1.06,'#92523e','#d1b098'],
  ['京の朱漆配膳棚','court',.83,2.72,1.17,'#541f25','#812e30'],
  ['桃林の一枚板','branch',.66,2.60,1.11,'#77493e','#c59477'],
  ['竜宮の螺鈿波脚卓','tide',.96,2.68,1.18,'#164952','#285f69'],
  ['大仏殿の組物膳','altar',.82,2.64,1.05,'#673a32','#bf8b61'],
  ['稲荷の朱脚荷台','horse',.78,2.58,1.03,'#a74933','#e1c3a0'],
  ['敦賀の荷改め櫃','cargo',.92,2.72,1.16,'#4f5247','#8b8461'],
  ['堺の鉄板と焼締め煉瓦','kiln',.77,2.64,1.15,'#7e4934','#44413d'],
];
// The same survey sets the live drawer's slide and the joiner's opening in
// the resident's side of a solid counter.
export const workDrawerSize=Object.freeze({width:1.16,height:.52,depth:.52,topInset:.045,edge:.015});

export function counterLeaves(plan){
  const width=.98,depth=.55;
  const x=workDrawerSize.width*.5+.095+width*.5,z=-(plan.depth+depth)*.5+.004;
  return [-1,1].map(side=>({x:x*side,z,width,depth,worktop:plan.top}));
}

export function hullStrake(half,side,board){
  const row=board/3,run=half-.16+.095*row;
  const gap=(workDrawerSize.width/2+.054)/run;
  // The outside strakes remain continuous on the customer's side. A low
  // sill and two full-height ends frame the opening on the artisan's side.
  const spans=side>0?[[-1,1,1]]:[[-1,-gap,1],[gap,1,1]];
  if(side<0 && board===0)spans.push([-gap,gap,.31]);
  return {spans,point(t,v){
    const flare=1-.21*t*t+.05*row;
    return [t*run,.13+(board+v)*.164+.095*t*t,side*(.22+.086*(board+v))*flare];
  }};
}

export function waveBracket(lx,side,face){
  const hook=face<0?.48:1;
  const nodes=[[0,.15,.24],[.07,.34,.30],[.28,.52,.33],[.41,.57,.33],[.47,.50,.33],[.42,.45,.33]];
  return nodes.map(([inset,y,z])=>[side*(lx-.20-inset*hook),y,face*z]);
}

function cutDrawerBay(parts,top,front){
  const {width,height,depth,topInset,edge}=workDrawerSize;
  const bay={x:[-width/2-.044,width/2+.044],y:[top-topInset-height-.036,top-topInset+.022],
    z:[-front-edge-.05,-front-edge+depth+.027]};
  const result=[];
  for(const part of parts){
    if(part.type!=='box' || part.y+part.h/2>top-.004){result.push(part);continue;}
    const x=[part.x-part.w/2,part.x+part.w/2],y=[part.y-part.h/2,part.y+part.h/2],z=[part.z-part.d/2,part.z+part.d/2];
    const ix=[Math.max(x[0],bay.x[0]),Math.min(x[1],bay.x[1])],
      iy=[Math.max(y[0],bay.y[0]),Math.min(y[1],bay.y[1])],
      iz=[Math.max(z[0],bay.z[0]),Math.min(z[1],bay.z[1])];
    if(ix[0]>=ix[1] || iy[0]>=iy[1] || iz[0]>=iz[1]){result.push(part);continue;}
    function board(xlo,xhi,ylo,yhi,zlo,zhi){
      const w=xhi-xlo,h=yhi-ylo,d=zhi-zlo;
      if(Math.min(w,h,d)>.001)result.push({...part,x:(xlo+xhi)/2,y:(ylo+yhi)/2,z:(zlo+zhi)/2,w,h,d});
    }
    board(x[0],ix[0],...y,...z);board(ix[1],x[1],...y,...z);
    board(...ix,y[0],iy[0],...z);board(...ix,iy[1],y[1],...z);
    board(...ix,...iy,z[0],iz[0]);board(...ix,...iy,iz[1],z[1]);
  }
  return result;
}
const layouts=new Map();
export function tablePlan(number=1,place) {
  const key=number+'-'+(place||'');
  if(layouts.has(key))return layouts.get(key);
  const sub=place==='charcoal'?['炭窯の小仕事台','hearth',.75,2.47,.99,'#554537','#9e8868']:
    place==='court'?['白洲の文案','court',.75,2.64,1.11,'#403331','#5d473e']:null;
  const [name,style,top,width,depth,base,surface]=sub || workshops[number] || workshops[1];
  let parts=[];
  function box(x,y,z,w,h,d,tint,finish='wood') {parts.push({type:'box',x,y,z,w,h,d,tint,finish});}
  function pole(a,b,r,tint,finish='wood',round=true) {parts.push({type:'pole',a,b,r,tint,finish,round});}
  const half=width/2,front=depth/2,lx=half-.22,lz=front-.13,apron=top-.085;
  const sides=[-1,1];
  const closed=['chest','cargo','hearth','kiln'].includes(style);
  // Each plank meets its neighbour at the pressing plane used by the recipes.
  const boards=style==='bamboo'?15:['court','tide','branch','kiln'].includes(style)?1:style==='hull'?5:4;
  for(let i=0;i<boards;i++){
    const z=depth*((i+.5)/boards-.5),thick=style==='branch'?.14:style==='kiln'?.056:.080;
    if(style==='branch'||style==='hull'){
      let outline;
      if(style==='branch'){
        // A single rip-sawn trunk keeps its waney edge and narrower root end.
        const way=Array.from({length:17},(_,i)=>-1+2*i/16);
        const side=(t,s)=>[t*half,s*(front*(.88-.085*t)+.038*Math.sin(7*t+s)+.018*Math.cos(16*t-.3*s))];
        outline=way.map(t=>side(t,-1)).concat([...way].reverse().map(t=>side(t,1)));
      }else{
        const lo=z-depth/boards/2+.002,hi=z+depth/boards/2-.002;
        const reach=v=>half*(1-.26*(Math.abs(v)/front)**2.7);
        outline=[[-reach(lo),lo],[reach(lo),lo],[reach(hi),hi],[-reach(hi),hi]];
      }
      parts.push({type:'slab',outline,y:top-thick/2,h:thick,tint:surface,finish:'wood'});
    }else box(0,top-thick/2,z,width,thick,depth/boards-.004,surface,style==='kiln'?'iron':['court','tide'].includes(style)?'lacquer':'wood');
  }
  if(closed){
    if(style==='hearth'||style==='kiln'){
      // A genuine open firemouth between cheek walls; its lintel carries the lip.
      box(0,apron*.48,-front+.14,width-.28,apron*.96,.22,base,'clay');
      for(const side of sides)box(side*(half*.63),apron*.48,0,half*.55,apron*.96,depth-.12,base,'clay');
      box(0,apron*.83,0,width-.23,apron*.31,depth-.12,base,'clay');
      box(0,.055,0,width-.22,.11,depth-.12,'#5f5147','clay');
    }else {
      box(0,apron*.5,0,width-.16,apron-.06,depth-.10,base);
      box(0,.07,0,width-.07,.14,depth-.05,base);
    }
  }else if(style==='altar'||style==='tide'){
    // Paired open pierced trestles and splayed feet carry the larger temple tables.
    for(const side of sides){
      const x=side*(lx-.16);
      box(x,.055,0,.27,.11,depth*.91,base,style==='tide'?'lacquer':'wood');
      for(const face of sides) pole([x,.11,face*lz*.78],[x+side*.10,apron,face*lz*.50],.076,base);
      box(x,apron-.045,0,.38,.115,depth+.03,base);
    }
    box(0,.28,0,2*lx-.10,.065,.075,base);
  }else if(style==='hull'){
    // Two keel runners support the beached plank; the gunwales flare away from them.
    for(const s of sides){
      box(0,.075,s*.26,width-.26,.15,.115,base);
      for(const x of [-lx,-.72,.72,lx])pole([x*.85,.11,s*.26],[x,apron,s*(front-.07)],.057,'#9a7c5c');
      box(0,apron-.028,s*(front-.05),width*.795,.10,.10,base);
    }
  }else{
    for(const s of sides)for(const t of sides){
      const X=s*lx,Z=t*lz,spread=['horse','trestle','branch'].includes(style);
      const foot=[X+s*(spread?.10:0),.025,Z+t*(spread?.05:0)];
      const head=[X-s*(spread?.14:0),apron,Z-t*(spread?.13:0)];
      pole(foot,head,style==='branch'?.098:style==='bamboo'?.056:style==='court'?.066:.055,base,'wood',style==='bamboo'||style==='branch'||style==='dryer');
    }
    for(const s of sides)box(0,apron-.045,s*lz,2*lx+.13,.108,.059,base);
    if(style==='court'){
      box(0,.19,0,width-.35,.065,depth-.22,base,'lacquer');
    }else{
      for(const s of sides)box(s*lx,.25,0,.073,.081,2*lz+.06,base);
      box(0,.275,0,2*lx+.10,.071,.069,base);
    }
  }
  if(style==='dryer'){
    for(const s of sides)pole([s*lx,apron,-lz],[s*lx,top+.99,-lz],.032,base);
    pole([-lx-.10,top+.955,-lz],[lx+.10,top+.955,-lz],.027,'#8b775b');
  }
  parts=cutDrawerBay(parts,top,front);
  // Solid details that are already carved in the joined decoration mesh.
  const contacts=[...parts];
  // The join between two boards is only four millimetres wide. To a
  // traveller it is one continuous surface, including when a changed scene
  // places a table over an old save and the traveller needs to walk out.
  if(boards>1 && style!=='hull'){
    contacts.push({type:'box',x:0,y:top-.040,z:0,w:width,h:.080,d:depth-.004,minRadius:.015});
  }
  const brace=(a,b,r)=>contacts.push({type:'pole',a,b,r});
  if(style==='hull'){
    for(const side of sides)for(let row=0;row<3;row++){
      const strake=hullStrake(half,side,row);
      for(const [lo,hi,height] of strake.spans){
        const steps=Math.ceil((hi-lo)*4);
        for(let i=0;i<steps;i++)brace(strake.point(lo+(hi-lo)*i/steps,height*.5),
          strake.point(lo+(hi-lo)*(i+1)/steps,height*.5),height*.077);
      }
    }
  }else if(style==='tide'){
    for(const side of sides)for(const face of sides){
      const pts=waveBracket(lx,side,face);
      for(let j=1;j<pts.length;j++)brace(pts[j-1],pts[j],j===4?.039:.069);
    }
  }else if(style==='dryer'){
    for(let i=0;i<7;i++){const x=(i-3)*.272,y=top+.67-.05*(i%3);brace([x,y-.044,-lz+.018],[x,y+.044,-lz+.018],.061);}
  }else if(style==='branch'||number===8||number===15){
    for(const s of sides)brace([s*lx,.12,lz],[s*(lx-.38),top-.092,-lz],style==='branch'?.052:.032);
  }else if(number===5){
    for(let j=-1;j<=1;j++)brace([j*.51-.085,.25,.225],[j*.51+.085,.25,.225],.17);
  }
  const plan={name,style,top,width,depth,lx,lz,base,surface,parts,contacts};
  layouts.set(key,plan);return plan;
}
