// Measurements in the building's local frame. The entrance faces positive Z.
export function roomPlan(b) {
  const pagoda = b.kind === 'pagoda';
  const width = b.w * (pagoda ? 0.73 : 1);
  const depth = b.d * (pagoda ? 0.73 : 1);
  const door = Math.min(width * 0.46, 3.25);
  const panel = (width - door) / 2;
  const floor = 0.48;
  const ceiling = pagoda ? 3.05 : b.wall + 0.1;
  const walls = [
    { u: 0, v: -depth / 2, width, depth: 0.18 },
    ...[-1, 1].flatMap((sign) => [
      { u: (sign * (door + panel)) / 2, v: depth / 2, width: panel, depth: 0.18 },
      { u: (sign * width) / 2, v: 0, width: 0.18, depth },
    ]),
  ];
  return { width, depth, door, floor, ceiling, walls };
}

// Five open storeys around paired stair flights. Rendering and collision use
// these exact treads and openings, including the landings at either end.
export function pagodaPlan(b) {
  const floor=.48, rise=3.52, run=3.68, stairWidth=1.42, lane=.85, steps=10;
  const slabs=[], storeys=[], posts=[], panels=[];
  const slab=(u,v,w,d,top,kind)=>slabs.push({u,v,w,d,top,kind});
  for(let n=0;n<5;n++) {
    const y=floor+rise*n, scale=1-n*.085;
    const w=b.w*scale, d=b.d*scale, shaftW=2*(lane+stairWidth/2), shaftD=run+1.5;
    storeys.push({y,w,d});
    if(n) {
      // Four open central bays lead out onto the gallery. Between them stand
      // short plaster-and-lattice panels, with a continuous upper transom.
      for(const front of [false,true]) {
        const span=(front?w:d)*.76, edge=(front?d:w)*.38, door=1.75;
        const length=(span-door)/2;
        for(const face of [-1,1]) for(const side of [-1,1]) {
          const center=side*(door+length)/2;
          panels.push({u:front?center:face*edge,v:front?face*edge:center,
            width:front?length:.15,depth:front?.15:length,length,y,front,face});
        }
      }
      // The gallery surrounds the well. The stairs finish on its front landing.
      for(const side of [-1,1]) {
        slab(side*(w+shaftW)/4,0,(w-shaftW)/2,d,y,'gallery');
        slab(0,side*(d+shaftD)/4,shaftW,(d-shaftD)/2,y,'gallery');
      }
      slab(0,(run+.75)/2,shaftW,1.50,y,'landing');
    }
    if(n===4) break;
    slab(0,-(run+.75)/2,shaftW,1.50,y+rise/2,'landing');
    for(const laneSign of [-1,1]) {
      for(let j=0;j<steps;j++) {
        const fraction=(j+.5)/steps;
        const v=(fraction-.5)*run*laneSign;
        const top=y+rise*((laneSign<0?0:.5)+(j+1)/(2*steps));
        slab(laneSign*lane,v,stairWidth,run/steps+.012,top,'tread');
      }
      for(const end of [-1,1]) {
        const v=end*run/2;
        const top=y+rise*((laneSign<0?0:.5)+(laneSign===end?.5:0));
        posts.push({u:laneSign*(lane+stairWidth/2),v,top});
      }
    }
  }
  return {slabs,storeys,posts,panels,rise};
}
