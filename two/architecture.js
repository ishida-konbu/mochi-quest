// The market uses named trades so its sign, tools and resident agree.
export function buildingCraft(b) {
  return b.craft || ({ temple: 'ink', inn: 'lodge', pagoda: 'pagoda' }[b.kind]) || 'tea';
}

export function roofForm(b) {
  return ['net', 'rice', 'lodge', 'rush', 'baskets'].includes(buildingCraft(b)) ? 'hip' : 'gable';
}

// Coordinates range from -1 to 1 across the eaves. The hipped roof has a
// short ridge and four pitched faces, with a slight bell at the eaves.
export function hipHeight(x, z) {
  const pitch = Math.min(1, Math.max(Math.abs(z), (Math.abs(x) - .46) / .54));
  return (1 - pitch) ** 1.28;
}

// Measurements in the building's local frame. The entrance faces positive Z.
export function roomPlan(b) {
  const pagoda = b.kind === 'pagoda';
  const width = b.w * (pagoda ? 0.73 : 1);
  const depth = b.d * (pagoda ? 0.73 : 1);
  const craft = buildingCraft(b);
  const door = pagoda ? Math.min(width * .46, 3.25) : width * (craft === 'brew' || craft === 'ink' ? .55 : .69);
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
  const workbench = pagoda ? null : b.kind==='wardShop' ? {u:width*.255,v:depth*.22,width:width*.32,depth:1.09,height:.49} : { u: width * .36, v: -depth * .22, width: width * .21, depth: depth * .39, height: .49 };
  const porch = b.kind === 'temple' || b.kind === 'inn' ? {
    u: 0, v: depth*.49, width: depth*.51, depth: width*.48,
    eave: b.wall*.78, rise: b.kind === 'temple' ? 1.16 : .78, rotation: Math.PI/2,
  } : null;
  const monitor = craft === 'dye' || craft === 'tea' ? {
    u: width * (craft === 'dye' ? -.06 : .19), v: 0, width: width * (craft === 'dye' ? .48 : .29),
    depth: depth*.255, eave: b.wall + b.roof + (craft === 'dye' ? .63 : .45),
    rise: craft === 'dye' ? .44 : .30, rotation: 0,
  } : null;
  return { width, depth, door, floor, ceiling, walls, craft, workbench, porch, monitor };
}

// Five open storeys around paired stair flights. Rendering and collision use
// these exact treads and openings, including the landings at either end.
export function pagodaPlan(b) {
  const scale=b.roof/14.5, floor=.48, rise=3.52*scale, run=3.68, stairWidth=1.42, lane=.85, steps=Math.ceil(10*scale);
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
  return {slabs,storeys,posts,panels,rise,scale};
}
