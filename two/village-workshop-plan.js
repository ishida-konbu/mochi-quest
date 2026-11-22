// With +v towards the road, the workshop faces across the water. Each
// occupies the graded carpenter's plot at the back of its own spring.
const villages=new Set(['sakura','bamboo','earthen','sulfur','paddy','shore','maple','susuki']);
export const isVillageWorkshop=s=>s.rank==='main' && villages.has(s.kind);

// Wall paintings have their own architectural mounts: a shutter, an inset
// plaster panel, a square of woven silk or two rails holding a hanging roll.
export const villageFrames={
  sakura:  {x:.56,y:1.97,w:2.58,style:'shutter'},
  bamboo:  {x:.70,y:1.62,w:2.01,style:'roll'},
  earthen: {x:.37,y:2.00,w:2.54,style:'plaster'},
  sulfur:  {x:-.37,y:1.62,w:2.05,style:'shutter'},
  paddy:   {x:-.55,y:1.69,w:2.02,style:'weave'},
  shore:   {x:1.06,y:1.74,w:1.96,style:'shutter'},
  maple:   {x:-.24,y:1.77,w:2.26,style:'plaster'},
  susuki:  {x:-1.56,y:1.74,w:1.97,style:'roll'},
};

export function addVillageWorkshopSolids(site,room,add){
  if(!isVillageWorkshop(site))return;
  const back=-room.d/2;
  if(['sakura','earthen','shore'].includes(site.kind))
    add(room.u,room.v+.67,.64,.46,.409,'floor',true);
  const furniture={
    sakura:[[.60,back+.63,2.98,.72,.89,'oval'],[-1.65,back+.15,1.10,.27,1.93,'box']],
    bamboo:[[-1.73,back+.55,.66,.67,.67,'oval'],[-1.17,back+.82,.41,.42,.51,'oval'],[1.92,back+.52,.63,.63,.66,'oval']],
    earthen:[[-room.w/2+.92,back+.55,1.36,.65,1.16,'box'],[1.99,back+.73,1.76,.91,1.11,'oval']],
    sulfur:[[-1.31,back+.40,1.63,.69,.59,'box'],[.57,back+.40,1.84,.69,.59,'box']],
    paddy:[[1.33,back+.52,.99,.48,.98,'box'],[-1.45,back+.80,1.06,.66,.74,'box']],
    shore:[[1.34,back+.64,.88,.88,.82,'oval']],
    maple:[[-room.w/2+.47,room.d/2,.99,.10,.90,'wall'],[room.w/2-.47,room.d/2,.99,.10,.90,'wall']],
    susuki:[[-1.54,back+.44,.92,.56,.54,'box'],[-1.91,back+.73,.47,.47,.72,'oval'],
      [-2.39,-.31,.42,.42,1.25,'oval'],[2.43,.50,.33,.33,1.01,'oval']],
  };
  for(const [x,z,w,d,y,kind] of furniture[site.kind])add(room.u+x,room.v+z,w,d,y,kind,kind!=='wall');
}

// West-side service bays occupy the already graded strip along the lee
// screen. The positive-v opening remains the traveller's path to the water.
export function villageYard(site,plan){
  const edge=-plan.w;
  switch(site.kind){
    case 'sakura':return {x:edge+.78,z:-1.08,w:1.42,d:4.94,post:2.88};
    case 'bamboo':return {x:edge+.77,z:-3.55,w:1.40,d:3.10,post:2.12};
    case 'earthen':return {x:plan.room.u-plan.room.w/2+.92,z:plan.room.v-plan.room.d/2+.28,w:.67,d:.59,post:plan.room.eave+plan.room.rise+.73};
    case 'sulfur':return {x:edge+.69,z:-1.02,w:1.05,d:2.62,post:1.73};
    case 'paddy':return {x:edge+.75,z:-.50,w:1.02,d:3.57,post:2.45};
    case 'shore':return {x:plan.annex.u+.46,z:plan.annex.v,w:.40,d:3.99,post:1.83};
    case 'maple':return {x:edge+.76,z:-.91,w:1.09,d:2.54,post:2.10};
    case 'susuki':return {x:edge+.89,z:-2.02,w:1.42,d:4.40,post:2.53};
  }
}
export function addVillageYardSolids(s,p,add){
  if(!isVillageWorkshop(s))return;
  const a=villageYard(s,p),{x,z,w,d,post}=a;
  switch(s.kind){
    case 'sakura':
      add(x,z,w,d,.27,'floor',true);
      add(x-w*.41,z+d*.42,.17,.17,post,'wall');
      add(x-w*.41,z-d*.42,.17,.17,post-.72,'wall');
      break;
    case 'bamboo':
      for(const side of [-1,1])for(let j=0;j<4;j++)
        add(x+side*w/2,z+d*(j/3-.5),.089,.089,post,'wall');
      for(let i=0;i<11;i++){
        const t=(i+.5)/11,dx=w*(t-.5);
        const arch=post+.65*Math.sqrt(1-(2*t-1)**2);
        add(x+dx,z,w/11+.011,d,arch+.035,'slab',true);
      }
      break;
    case 'earthen':add(x,z,w,d,post,'box',true);break;
    case 'sulfur':add(x,z,w,d,.71,'box',true);break;
    case 'paddy':
      for(const end of [-1,1])add(x,z+end*d*.44,w,.22,post,'wall');
      add(x,z,w*.6,d,.81,'wall');
      break;
    case 'shore':add(x,z,w,d,post,'wall');break;
    case 'maple':add(x,z,w,d,.36,'floor',true);add(x-w*.45,z,.115,d,1.16,'wall');break;
    case 'susuki':
      add(x,z,w,d,.32,'floor',true);
      for(const end of [-1,1])add(x-w*.43,z+end*d*.47,.11,.14,post,'wall');
      add(x-w*.43,z,.10,d,post-.13,'wall');
      add(x-.26,z,.40,d*.69,.635,'box',true);
      break;
  }
}
