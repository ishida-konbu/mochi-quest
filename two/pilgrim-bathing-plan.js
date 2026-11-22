// Metres in each spring's own frame. +v leads to the street or mountain trail.
// Water area radii refer to the wet inner face, not the outside of the timber.
export const orchardCasks=[
  {u:-2.04,v:0,r:1.57,wood:'#ab885f',band:'#776b50'},
  {u:2.04,v:0,r:1.86,wood:'#946c50',band:'#645a4a'},
];
export function kilnSteamBath(site){return site.rank==='main' && site.kind==='sakai';}
export const steamRoom={u:0,v:-.30,w:5.64,d:4.86,door:2.24,seatV:-.48,seatU:1.65,seatTop:.39};
export const inariFall={u:0,v:-.58,top:2.92};
export const dawnBeds=[-2,0,2];
export const sluiceOpening=time=>(1-Math.cos(time*.36))*.5;
export const tideRise=(site,time)=>site?.rank==='main' && site.kind==='tsuruga'?.095*sluiceOpening(time):0;
export const brineGate={u:-3.30,v:-.10};
export function pilgrimCustomInlet(s){
  return s.rank==='main'&&['sakai','peach','temple','inari','tsuruga'].includes(s.kind);
}

const pools={
  sakai:[],
  peach:orchardCasks.map((q,i)=>({id:i?'orchard-ripe':'orchard-blossom',u:q.u,v:q.v,rx:q.r,rz:q.r,y:i?.30:.54,
    depth:i?.80:.94,shape:'round',tint:i?'#a8a58b':'#bba9a0',name:i?'熟桃の桶':'花香の桶',action:'seat',label:'桃の桶に浸かる',
    message:i?'ふくらんだ桃の香りが桶から立ちのぼる。':'桃の花を浮かべた木の桶に身を沈めた。'})),
  temple:[
    {id:'lotus-heart',u:0,v:0,rx:2.36,rz:2.36,y:.19,depth:.80,shape:'round',tint:'#99a797',
      name:'蓮台の本湯',action:'float',label:'蓮台に浸かる',message:'石蓮の花心に浮かぶと、細い余り湯が隣の花弁へ落ちた。'},
    ...[-1,1].map((side,i)=>({id:i?'lotus-east':'lotus-west',u:side*3.41,v:-.30,rx:.86,rz:1.19,
      y:-.02,depth:.38,shape:'petal',tint:'#b1af97',name:i?'東の花弁湯':'西の花弁湯',action:'seat',label:'花弁に腰をおろす',
      message:'花弁一枚ぶんの浅湯に、そっと腰をおろした。'})),
  ],
};
const stations={
  dawn:dawnBeds.map((u,i)=>({id:'dawn-bed-'+i,u,v:.10,rx:.94,rz:2.14,shape:'rect',berthU:u,berthV:.10,
    heading:0,action:'recline',name:'暁の石の寝台',label:'朝日を仰いで寝湯',message:'首を石枕にのせると、浅い湯が背を伝った。'})),
  inari:[{id:'inari-shoulders',u:0,v:-.58,rx:1.18,rz:1.06,berthU:0,berthV:-.58,heading:0,
    action:'cascade',name:'曲り湯の打たせ場',label:'打たせ湯を浴びる',message:'山腹から曲げた樋を通り、温かい湯筋が肩に落ちた。'}],
  tsuruga:[{id:'harbor-tide',u:-1.66,v:.0,rx:2.42,rz:1.75,berthU:-1.68,berthV:.05,heading:Math.PI/2,
    action:'tide',name:'潮差しの汐湯',label:'潮の流れに浮く',message:'水門が上がると、塩の湯が舟溜まりに満ちてきた。'}],
  sakai:[-1,1].map((side,i)=>({id:i?'steam-east':'steam-west',u:side*1.18,v:-.245,rx:1.20,rz:1.805,
    shape:'rect',berthU:side*steamRoom.seatU,berthV:steamRoom.seatV,seatY:steamRoom.seatTop,
    heading:-side*Math.PI/2,action:'steam',name:'堺の陶室蒸し湯',label:'陶室で蒸し湯',message:'簀の床から熱い霧が上がり、陶室の腰掛けでお餅がふやけた。'})),
  snow:[{id:'snow-deep',u:-.55,v:-.28,rx:3.10,rz:2.73,depth:1.44,berthU:-.55,berthV:-.28,
    action:'deep',name:'雪割岩の深み',label:'岩の深湯に浸かる',message:'雪割岩の深みに沈むと、肩の上だけに雪風が触れた。'}],
};
export function pilgrimPools(s){return s.rank==='main'?pools[s.kind]:undefined;}
export function pilgrimStations(s){return s.rank==='main'?stations[s.kind]:undefined;}
export function pilgrimPoolLip(pool,a){
  return pool.shape==='petal'?1+.12*Math.sin(a)-.085*Math.cos(2*a):1;
}

// Heights include the submerged treads. These few triangles sit on the dry
// bank and the player can climb from the gravel into either barrel unaided.
export function caskSteps(pool){
  return [[1.03,-.30],[.64,-.14],[.25,.025],[-.15,-.12],[-.51,-.30],[-.81,-.49],[-1.10,-.66],[-1.37,-.81]]
    .map(([v,dy])=>({u:pool.u,v:pool.rz+v,w:1.27,d:.41,h:pool.y+dy}));
}
export function caskTop(pool,a){
  const gap=Math.sin(a)>0?Math.max(0,1-Math.abs(pool.rx*Math.cos(a))/.85):0;
  return pool.y+.31-.32*gap;
}
export function caskCrest(pool,a){
  const t=((a+Math.PI*2)%(Math.PI*2)/Math.PI-1.02)/.96;
  if(t<=0 || t>=1)return caskTop(pool,a);
  const n=pool.u<0?19:21,fan=Math.sin(t*Math.PI)**.83;
  return pool.y+.37+fan*(pool.u<0?.94:.79)+.050*Math.cos((t*n-.5)*Math.PI*2);
}
export function petalTop(pool,a){
  const main=pool.id==='lotus-heart';
  const x=pool.rx*Math.cos(a),z=pool.rz*Math.sin(a);
  const opening=(z>0?Math.min(1,Math.abs(x)/(main?1.0:.63)):1);
  const outlet=main?Math.min(1,Math.abs(z+.29)/.47):1;
  const flower=.5+.5*Math.cos(8*(a-Math.PI/4));
  return pool.y-.08+opening*opening*(.18+outlet*(main?(.49+.64*flower):.28));
}
export const winterRocks=[
  [-6.40,.53,1.46,1.28,2.36,.31],[-5.26,-.03,1.05,1.06,2.75,-.38],
  [-5.77,1.36,1.12,.83,1.42,.79],[-4.93,1.39,.88,.61,.91,-.53],
  [-4.69,-.42,.73,.86,1.21,.11],[-6.74,1.93,.93,.75,.99,-.12],
];
export function steamVaultHeight(x,v){
  const arch=Math.sqrt(Math.max(0,1-x*x));
  return 2.47+1.52*arch**.78-.098*Math.cos(2*Math.PI*v)*arch;
}
// The dry door is two metres wide through the full thickness of the shell;
// the two screened steam grates stand away from the path to either bench.
export function addPilgrimBathSolids(site,add,level){
  if(site.rank!=='main')return;
  if(site.kind==='sakai'){
    const c=steamRoom,front=c.v+c.d/2,back=c.v-c.d/2,wing=(c.w-c.door)/2;
    add(c.u,c.v,c.w,c.d,.045,'floor',true);
    for(const side of [-1,1]){
      add(side*(c.w/2-.14),c.v,.29,c.d,2.63,'wall');
      add(side*(c.door+wing)/2,front,wing,.31,2.57,'wall');
      add(side*c.seatU,c.seatV,.66,2.28,c.seatTop,'box',true);
    }
    add(0,back,c.w,.32,2.67,'wall');
    add(0,front,c.door,.32,2.82,'slab',true).bottom=level+2.48;
    const roof=add(0,c.v,c.w+.28,c.d+.24,2.47,'roof',true);
    roof.pilgrimKind='steamVault';roof.pilgrimDepth=(c.d+.24)/2;roof.thickness=.19;
    add(0,c.v-.64,.88,.88,5.035,'oval',true).bottom=level+3.83;
    add(0,back+.62,1.74,.88,1.34,'box',true);
    for(const side of [-1,1])add(side*(c.seatU+.51),c.seatV,.19,2.07,.95,'wall');
  }
  if(site.kind==='peach'||site.kind==='temple'){
    for(const p of pilgrimPools(site)){
      const count=80;
      for(let i=0;i<count;i++){
        const a=(i+.5)*Math.PI*2/count,lip=pilgrimPoolLip(p,a);
        const h=site.kind==='peach'?caskCrest(p,a):petalTop(p,a);
        const wide=site.kind==='peach'?.18:.24,ca=Math.cos(a),sa=Math.sin(a);
        const len=Math.PI*2/count*Math.hypot(p.rx*sa,p.rz*ca)*lip;
        if(sa>0 && Math.abs(ca*p.rx)<.63 && site.kind==='temple')continue;
        add(p.u+(p.rx*lip+wide*.45)*ca,p.v+(p.rz*lip+wide*.45)*sa,len+.05,wide,h,'box',true,
          Math.atan2(-p.rz*ca,p.rx*(-sa)));
      }
      if(site.kind==='peach')for(const step of caskSteps(p))add(step.u,step.v,step.w,step.d,step.h,'floor',true);
    }
  }
  if(site.kind==='dawn'){
    for(const u of dawnBeds){
      add(u,-1.34,1.32,.41,.16,'box',true);
      add(u,-1.87,1.76,.24,u===0?.95:.78,'box',true);
      add(u,.24,1.43,2.32,-.22,'floor',true);
    }
  }
  if(site.kind==='inari'){
    for(const [u,v,w,d,h] of [[-.81,-2.66,2.13,1.38,2.41],[.39,-2.96,1.18,1.00,2.83],
      [-1.86,-2.35,1.26,1.42,1.36],[-1.02,-1.97,1.22,.82,.80]])add(u,v,w,d,h,'oval',true);
    add(-.18,-1.76,.90,2.15,3.04,'slab',true).bottom=level+2.59;
  }
  if(site.kind==='tsuruga'){
    for(const side of [-1,1])add(brineGate.u+side*.79,-1.72,.25,.31,2.52,'wall');
    add(brineGate.u,-1.71,1.50,.19,1.65,'wall');
    add(brineGate.u,-2.31,1.88,1.34,1.00,'box',true);
  }
  if(site.kind==='snow')for(const [u,v,rx,rz,h,yaw] of winterRocks)
    add(u,v,2*rx,2*rz,h,'springRock',true,yaw).roundHeight=h*.63;
}
