// Survey of the timber crossing and its two stone bridgeheads, in world metres.
export const MAPLE_BRIDGE={x:292,z:-130,length:24.8,halfWidth:2.1,maple:true};
const north=17.85,south=12.15,half=MAPLE_BRIDGE.length/2;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

export function mapleDeckHeight(z){
  const length=MAPLE_BRIDGE.length,end=2.2;
  const d=Math.max(0,Math.min(length,z-MAPLE_BRIDGE.z+half));
  // The timber runs out level at either stone sill. Most of the lift is
  // spread evenly along the span, with a small crown between the two seats.
  const run=d<end ? d*d/(2*end) : d>length-end ?
    length-end-(length-d)**2/(2*end) : d-end/2;
  return north+(south-north)*run/(length-end)+.22*Math.sin(Math.PI*d/length)**2;
}

export function mapleApproachHeight(x,z,native){
  const across=Math.abs(x-MAPLE_BRIDGE.x),along=z-MAPLE_BRIDGE.z;
  const outside=Math.abs(along)-half;
  if(across>=13 || outside<=-7 || outside>=16)return native;
  const width=1-smooth((across-3.5)/9.5);
  const end=(1-smooth((outside-2)/14))*(1-smooth(-outside/7));
  const inside=Math.max(0,-outside),road=Math.max(0,outside-1.2);
  const datum=along<0?north:south,grade=along<0?.30:-.22;
  const pavingBed=.14-.095*smooth((outside-.12)/.82);
  const soil=datum-pavingBed+grade*road*road/(road+2)-inside*(.54+.12*inside);
  const bank=native+(soil-native)*width*end;
  // The bicycle stand sits on the southeast shoulder. Level the mesh cells
  // under its sign, wheels and boarding side, then round off the cut.
  const dx=Math.abs(x-297.5),dz=Math.abs(z+110);
  if(dx>=7.5 || dz>=7.5)return bank;
  // Keep the bridge's south sill on its original grade just uphill.
  const edge=Math.hypot(Math.max(0,dx-2.5)/5,Math.max(0,dz-2.5)/(z< -110?3.1:5));
  return bank+(10.38-bank)*(1-smooth(edge));
}

// Use the same measurements for solid contact, the painted trestles and their
// masonry. Piles end at the soffit and penetrate the actual riverbed mesh.
export function mapleBridgeFootings(meshHeight){
  const b=MAPLE_BRIDGE,piers=[],beams=[],ties=[],abutments=[],thresholds=[],endStones=[];
  for(const side of [-1,1]){
    const x=b.x+side*(b.halfWidth-.13);
    for(let j=1;j<=14;j+=3){
      const z=b.z+b.length*(j/14-.5);
      const seat=mapleDeckHeight(z)-.23;
      piers.push({x,z,w:.34,d:.34,top:seat-.22,bottom:meshHeight(x,z)-.35});
      if(side<0){
        beams.push({x:b.x,z,w:2*b.halfWidth+.12,d:.34,top:seat,bottom:seat-.22});
        const bed=Math.max(meshHeight(x,z),meshHeight(2*b.x-x,z));
        if(seat-bed>6){
          const tie=bed+.6*(seat-bed);
          ties.push({x:b.x,z,w:2*b.halfWidth-.18,d:.20,top:tie,bottom:tie-.20});
        }
      }
    }
    const z=b.z+side*(half-.78),front=z-side*.54,w=2*b.halfWidth+.38;
    const top=Math.min(mapleDeckHeight(z-.54),mapleDeckHeight(z+.54))-.235;
    const bottom=Math.min(...[-w/2,0,w/2].map(u=>meshHeight(b.x+u,front)))-.30;
    abutments.push({x:b.x,z,w,d:1.08,top,bottom:Math.min(top-.42,bottom)});
    const edge=b.z+side*half,datum=mapleDeckHeight(edge);
    thresholds.push({x:b.x,z:edge+side*.49,w:2*b.halfWidth+.20,d:1.00,top:datum-.012,bottom:datum-.32});
    for(const hand of [-1,1]){
      endStones.push({x:b.x+hand*(b.halfWidth+.13),z:edge+side*.46,
        w:.43,d:.90,top:datum+.18,bottom:datum-.32});
    }
  }
  return {piers,beams,ties,abutments,thresholds,endStones};
}
