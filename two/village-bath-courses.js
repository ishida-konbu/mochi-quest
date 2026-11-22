// Metres in the site's surveyed frame, with +v towards the entrance. y is
// the offset from the original spring waterline; separate pools each have a
// continuous solid vessel, an approach through the front lip and a dry aisle.
const pools={
  earthen:[
    {id:'shigaraki',name:'緋色の甕',u:0,v:0,rx:1.31,rz:1.37,y:0,depth:.54,shape:'jar',action:'jar',label:'緋色の甕にひとりで浸かる',message:'すっぽりひとり分。赤土の肌に背をあずけた。',tint:'#91a491',rim:'#aa7050'},
    {id:'ash',name:'灰釉の甕',u:-3.35,v:-.95,rx:1.24,rz:1.29,y:.18,depth:.59,shape:'jar',action:'jar',label:'灰釉の甕に浸かる',message:'緑に流れた灰釉の下で、熱い一筋が頬をほどく。',tint:'#89a798',rim:'#7a9681'},
    {id:'iron',name:'鉄釉の甕',u:3.35,v:-.95,rx:1.25,rz:1.30,y:.27,depth:.59,shape:'jar',action:'jar',label:'鉄釉の甕に浸かる',message:'鉄釉の濃い縁に、ひとり分の波紋が返ってくる。',tint:'#829294',rim:'#6f7064'},
  ],
  sulfur:[
    {id:'sinter-basin',name:'白濁の岩湯',u:.16,v:.76,rx:4.12,rz:2.10,y:0,depth:.67,shape:'mineral',action:'float',label:'白濁の岩湯に浮かぶ',message:'乳白の湯の底から、ふつふつと小さな気泡がのぼる。',tint:'#c4cec2'},
    {id:'sinter-head',duration:3.18,mist:1.34,name:'湯の花の上段',u:-1.13,v:-2.85,rx:2.45,rz:1.09,y:.56,depth:.50,shape:'shelf',action:'seat',label:'上段の源泉に腰かける',message:'湧き立つ源泉を背に、白い岩棚から湯がこぼれてゆく。',tint:'#a7bca6'},
  ],
  paddy:[
    {id:'lower-field',duration:3.9,mist:.64,name:'下田のぬる湯',u:.05,v:.88,rx:4.38,rz:1.71,y:0,depth:.57,shape:'terrace',action:'terrace',label:'下田のぬる湯で伸びる',message:'田越しの湯が、畦の下で穏やかなぬる湯になる。',tint:'#a8b396'},
    {id:'upper-field',duration:3.05,mist:1.28,name:'上田のあつ湯',u:-.46,v:-2.64,rx:3.91,rz:1.11,y:.24,depth:.5,shape:'terrace',action:'seat',label:'上田のあつ湯に浸かる',message:'木樋を抜けたばかりの湯が、水口から足元を温める。',tint:'#b4b699'},
  ],
};
const stations={
  sakura:[{id:'petal-drift',name:'桜の吹き寄せ',u:.50,v:.50,rx:3.45,rz:2.38,y:0,depth:.51,action:'flowers',label:'花筏に包まれる',message:'花びらが餅のまわりを巡り、小さな花筏になった。'}],
  bamboo:[{id:'bamboo-shower',name:'笹の三つ筧',u:-1.55,v:-.53,rx:1.34,rz:1.59,y:0,depth:.53,action:'bamboo',label:'三つ筧の湯を浴びる',message:'節を抜いた三本の青竹から、細い湯筋が肩に落ちる。'}],
  shore:[{id:'shell-couch',heading:0,name:'潮鳴りの貝座',u:-1.82,v:.15,rx:1.15,rz:1.75,y:0,depth:.46,action:'tide',label:'貝座で潮の息を聞く',message:'貝殻の襞に背をあずけると、寄せては返す塩湯に揺らされた。'},
    {id:'pearl-couch',name:'真珠色の貝座',u:1.17,v:.15,rx:1.15,rz:1.75,y:0,depth:.46,heading:0,action:'tide',label:'真珠色の貝座に横たわる',message:'隣の貝座に身をあずけ、足先まで潮の温もりに包まれた。'}],
  maple:[
    {id:'gorge-spout',name:'岩樋の打たせ湯',u:-1.53,v:-1.22,rx:1.06,rz:1.06,y:0,depth:.50,action:'cascade',label:'岩樋の打たせ湯を浴びる',message:'岩樋からひとすじ。湯の重みがもち肌をほぐす。'},
    {id:'twin-spout',name:'細樋の肩湯',u:1.54,v:-1.22,rx:1.03,rz:1.04,y:0,depth:.50,action:'cascade',label:'細樋で肩を温める',message:'細かくほどける湯しぶきに、楓の葉の影が揺れる。'},
  ],
  susuki:[{id:'moon-bed',name:'弓月の寝湯',u:-1.42,v:1.15,rx:1.95,rz:1.04,y:0,depth:.47,action:'moon',heading:-Math.PI/2,label:'月を仰いで寝湯に浸かる',message:'枕石に頭を置くと、薄の穂先の向こうに月が浮かんだ。'}],
};
// Only these three pavilions serve an independent rinse. Each stool sits on
// the dry room floor even when the adjacent spring contains several water levels.
for(const [kind,id,name,u,v,message] of [
  ['sakura','hanami-rinse','花漉しの掛け湯',1.30,-5.22,'桜を漉した湯を一杯。淡い香りが肩に残った。'],
  ['earthen','potter-rinse','焼締めの掛け鉢',.60,-5.12,'温めた手びねりの鉢から、ひと肌の湯をそっと流す。'],
  ['shore','abalone-rinse','鮑殻の潮流し',1.10,-5.22,'鮑の殻ですくった真水で、潮湯のあとの塩を流した。'],
]){
  (stations[kind]??=[]).push({id,name,u,v,rx:.88,rz:.68,shape:'rect',action:'rinse',wet:false,depth:0,
    berthU:u,berthV:v,seatY:.40,heading:Math.PI,duration:3.2,label:name+'を使う',message});
}
export function villagePools(site){return site?.rank==='main'?pools[site.kind]:undefined;}
export function villageStations(site){return site?.rank==='main'?stations[site.kind]:undefined;}
export function villagePoolLip(pool,a){
  const co=Math.cos(a),si=Math.sin(a);
  if(pool.shape==='jar')return 1+.012*Math.cos(3*a+.53)+.006*Math.sin(5*a);
  if(pool.shape==='terrace')return (Math.abs(co)**5+Math.abs(si)**5)**(-.2)*(1+.017*Math.cos(3*a+.4));
  const scallop=pool.shape==='shelf'?.035:.055;
  return 1+scallop*Math.sin(3*a+.4)+.035*Math.cos(5*a-.39)+.026*Math.sin(7*a+.6);
}
export const villagePoolsPoint=(p,a)=>{const r=villagePoolLip(p,a);return [p.u+p.rx*r*Math.cos(a),p.v+p.rz*r*Math.sin(a)];};
export function villageCourseRim(p,a){
  const [u,v]=villagePoolsPoint(p,a),front=v>p.v;
  const access=p.shape==='jar'?.83:p.shape==='shelf'?.88:1.27;
  // The downstream end faces the road. At the upstream side of the lower
  // rice and rock pools, a second cut receives the connecting stairs.
  const crossing=p.id==='sinter-basin'?-1.72:p.id==='lower-field'?0:undefined;
  const distance=front?Math.abs(u-p.u)-access:crossing===undefined?Infinity:Math.abs(u-crossing)-.61;
  const t=Math.min(1,Math.max(0,distance/.48)),k=t*t*(3-2*t);
  const rough=p.shape==='shelf'||p.shape==='mineral'?.095*Math.sin(7*a+.3)+.052*Math.cos(11*a):0;
  const width=p.shape==='jar'?.19:p.shape==='terrace'?.35:.46+.065*Math.sin(4*a);
  const height=p.shape==='jar'?.40:p.shape==='terrace'?.24:.31;
  return {u,v,top:p.y-.095+k*(height+rough+.095),width,gate:k};
}
export function villageTreads(kind){
  if(kind==='sulfur')return [[-1.72,.04,-.44],[-1.72,-.41,-.24],[-1.72,-.86,-.04],
    [-1.72,-1.31,.16],[-1.72,-1.76,.37],[-1.72,-2.17,.46],[-1.72,-2.61,.25]];
  if(kind==='paddy')return [[0,.40,-.38],[0,-.045,-.18],[0,-.49,.024],[0,-2.11,.062]];
  return [];
}
export function addVillageBathSolids(site,add){
  const basins=villagePools(site);
  for(const p of basins||[]){
    const n=p.shape==='jar'?40:64;
    for(let j=0;j<n;j++){
      const a=2*Math.PI*j/n,b=2*Math.PI*(j+1)/n,r=villageCourseRim(p,(a+b)/2);
      if(r.gate<.08)continue;
      const [ax,az]=villagePoolsPoint(p,a),[bx,bz]=villagePoolsPoint(p,b);
      const dx=bx-ax,dz=bz-az,length=Math.hypot(dx,dz),shift=r.width*.40;
      add(r.u+dz/length*shift,r.v-dx/length*shift,length+.022,r.width*.91,r.top,'box',true,-Math.atan2(dz,dx));
    }
  }
  if(site.rank!=='main')return;
  switch(site.kind){
    case 'earthen':
      for(const p of basins){
        for(let i=0;i<3;i++)add(p.u,p.v+p.rz+.25+.24*i,1.45-.072*i,.38,p.y-.09-.10*i,'floor',true);
        add(p.u,p.v+p.rz*.49,1.46,.45,p.y-.39,'floor',true);
        add(p.u,p.v+p.rz*.85,1.46,.49,p.y-.205,'floor',true);
      }
      // Glazed supply pots and their split-bamboo pipes stay behind the back rim.
      for(const p of basins)add(p.u,p.v-p.rz-.37,.68,.63,p.y+.91,'oval',true);
      break;
    case 'sulfur':
      add(-1.82,-3.96,1.44,.63,1.48,'oval',true);
      for(const [x,z,h] of villageTreads('sulfur'))add(x,z,.87,.51,h,'floor',true);
      break;
    case 'paddy':
      add(-3.71,-3.84,.81,.53,1.04,'box',true);add(0,-1.33,.83,1.12,.245,'floor',true);
      for(const [x,z,h] of villageTreads('paddy'))add(x,z,.86,.48,h,'floor',true);
      break;
    case 'sakura':add(-2.58,-2.97,.91,.66,.75,'box',true);break;
    case 'bamboo':
      for(const x of [-3.00,-.24])add(x,-2.03,.22,.22,2.19,'wall');
      add(-1.62,-2.03,3,.19,1.99,'ceiling');
      break;
    case 'shore':for(const x of [-1.82,1.17])add(x,-1.33,.99,.42,.29,'oval',true);break;
    case 'maple':
      for(const x of [-2.62,2.62])add(x,-2.67,.37,.37,2.75,'wall');
      add(0,-2.67,5.54,.49,2.38,'ceiling');
      break;
    case 'susuki':
      add(.26,1.15,.39,1.28,.13,'oval',true);
      break;
  }
}
