// All three kitchens use the same inside corner. The mortar and stove face
// the open floor (+Z); the preparation bench faces that floor from the side.
export const COOKING_BENCH={left:-.78,right:.77,back:-.18,front:.465,top:.55};
export const BENCH_YAW=-Math.PI/2;
// The cook turns on the mat inside the corner between the work surfaces.
export const COOKING_PIVOT=[-3.05,1.33];
const benchX=-1.55,benchZ=1.57;
export const HAND_WATER=[.57,COOKING_BENCH.top,.015];
export function benchPoint([u,y,v]){
  return [benchX-v,y,benchZ+u];
}
export function benchLocal([x,y,z]){
  return [z-benchZ,y,benchX-x];
}
export function benchFrame(kitchen){
  return {...worktopPoint(kitchen,benchX,benchZ),yaw:kitchen.yaw+BENCH_YAW};
}
export const DANGO_STALL=[6,-78.2,1.35];
export const MARKET_STOCK_Z=-1.14;
export const MARKET_STOCK_TOP=.91;
export const MARKET_GRILL_TOP=.64;
export const WORKTOPS = Object.freeze({
  'river-mortar': { x: 5.8, z: 65.3, yaw: Math.PI, width: 1.55, depth: .645 },
  'terraces-mortar': { x: 150.4, z: 95.5, yaw: .12, width: 1.55, depth: .645 },
});
export const HERB_PATCH = {x: -6.8, z: 67.9};
export const RICE_BASKET = {x: 164.2, z: 97.1};
export const RICE_SHOP = {x: 146.5, z: 90.6};
export const MALLET_HANDLE_END = .94;
// The original slim grip lies along the middle plank of the lid.
export const LID_SEAT=.085;
export const STEAMER_HANDLE={height:.030,radius:.020,pegs:[[-.061,.0508],[.061,.0493]]};
// One square mat carries the worktop, both ground vessels and the cook.
export const COOKING_MAT={left:-4.76,right:-1.06,back:-.62,front:3.08,thickness:.018};
export const MALLET_RACK = [-3.78,.60,-.325];
export function worktopPoint(table,u,v) {
  const c=Math.cos(table.yaw), s=Math.sin(table.yaw);
  return {x:table.x+u*c+v*s,z:table.z-u*s+v*c};
}

// Leave an air gap between the preparation boards and the masonry hearth.
export const MARKET_PREP_RIGHT = COOKING_BENCH.right;
export const MARKET_GRILL_X = 1.04;
export const MARKET_GRILL_Z = .58;
// The canopy clears the lifted pestle and the cook working at the bench.
export const marketCookCanopy = {lift:.68,postX:1.88,width:4.32,frontPostZ:.12,backPostZ:-.79};

// Turn the inside corner towards the street. The short bench meets the
// awning at its edge; the fire and pestle occupy the open side of the stall.
export function marketCooktop([x,z,yaw]) {
  return {...worktopPoint({x,z,yaw},-1.60,4.05), yaw:yaw+Math.PI, width:COOKING_BENCH.right-COOKING_BENCH.left, depth:COOKING_BENCH.front-COOKING_BENCH.back};
}

// All points are in the same table-local frame as the working hands. The
// cloth follows the ground. The stone sole of the stove and the wooden foot
// of the mortar seat horizontally over each vessel's own patch of earth.
export function groundCookware(table,tableY=0,ground){
  function matHeight(x,z){
    if(!ground)return 0;
    const p=worktopPoint(table,x,z);
    return ground(p.x,p.z)-tableY+COOKING_MAT.thickness;
  }
  function vessel(x,z,foot){
    return [x,Math.max(matHeight(x,z),...foot.map(([u,v])=>matHeight(x+u,z+v))),z];
  }
  const mortarFoot=Array.from({length:12},(_,i)=>[.303*Math.sin(Math.PI*i/6),.303*Math.cos(Math.PI*i/6)]);
  const stoveFoot=[[-.305,-.295],[-.305,.295],[.305,.295],[.305,-.295]];
  const [mx,,mz]=MALLET_RACK;
  return {mortar:vessel(-3.28,-.04,mortarFoot),stove:vessel(-2.16,.26,stoveFoot),mortarFoot,stoveFoot,matHeight,
    malletRack:[mx,matHeight(mx,mz)+MALLET_RACK[1],mz],malletYaw:-.48,
    bowlRest:[-4.22,matHeight(-4.22,.54)+.335,.54]};
}

export function addCookwareSolids(table, floor, put, ground) {
  function solid(u,v,rx,rz,bottom,top,kind) {
    const {x,z}=worktopPoint(table,u,v);
    put(x,z,rx,rz,table.yaw,floor+top,kind,true,0,floor+bottom);
  }
  const {mortar,stove,malletRack,malletYaw,bowlRest,matHeight}=groundCookware(table,floor,ground);
  const [mx,my,mz]=mortar,[sx,sy,sz]=stove,[bx,by,bz]=bowlRest;
  solid(mx,mz,.365,.365,my-.12,my+.545,'oval');
  solid(sx,sz,.305,.295,sy-.12,sy+.036,'box');
  solid(sx,sz,.263,.263,sy+.036,sy+.46,'oval');
  solid(bx,bz,.185,.185,matHeight(bx,bz),by,'oval');
  for(const dz of [0,.39]){
    const [x,y,z]=malletRack;
    const u=x+Math.sin(malletYaw)*dz,v=z+Math.cos(malletYaw)*dz;
    solid(u,v,.10,.10,matHeight(u,v),y-.04,'box');
  }
  const m=COOKING_MAT;
  solid((m.left+m.right)/2,(m.back+m.front)/2,(m.right-m.left)/2,(m.front-m.back)/2,-Infinity,0,'rushMat');
}

export function addBenchSolids(kitchen,floor,put){
  const table=benchFrame(kitchen);
  const {left,right,front,back,top}=COOKING_BENCH;
  const center=worktopPoint(table,(left+right)/2,(front+back)/2);
  put(center.x,center.z,(right-left)/2,(front-back)/2,table.yaw,floor+top,'box',true,0,floor+top-.064);
  const bowl=worktopPoint(table,HAND_WATER[0],HAND_WATER[2]);
  put(bowl.x,bowl.z,.172,.172,table.yaw,floor+top+.14,'oval',true,0,floor+top);
  for(const u of [left+.20,right-.20])for(const v of [back+.12,front-.12]){
    const p=worktopPoint(table,u,v);
    put(p.x,p.z,.054,.054,table.yaw,floor+top-.064,'box',true,0,floor);
  }
}

// Register the same feet, work surface and vessels that the painter draws.
export function addLivingSolids(put,height) {
  for (const table of Object.values(WORKTOPS)) {
    const floor=height(table.x,table.z);
    addBenchSolids(table,floor+COOKING_MAT.thickness,put);
    addCookwareSolids(table,floor,put,height);
  }
  for(const [p,r,h] of [[RICE_BASKET,.40,.40],[RICE_SHOP,.48,.46]])
    put(p.x,p.z,r,r,0,height(p.x,p.z)+h,'oval',true);
}
