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

export const HOUSE_EAVES = {width:1.24,depth:1.28};
export const PAGODA_SPAN = 1.33;
export const roofSkinDepth = form => form==='barkHip' ? .039 : form==='hip' ? .09 : form==='pagoda' ? .075 : .04;

export function houseRoof(width,depth,eave,rise,form) {
  return {width:width*HOUSE_EAVES.width,depth:depth*HOUSE_EAVES.depth,eave,rise,form,
    wallWidth:width,wallDepth:depth};
}

// The receiver places these four narrow walls in the building's local frame.
export function roofWallContacts(roof,add) {
  for(const side of [-1,1]){
    add(side*roof.wallWidth/2,0,.14,roof.wallDepth+.14);
    add(0,side*roof.wallDepth/2,roof.wallWidth+.14,.14);
  }
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
  // The half landings bridge the ground-floor passage. Their thinner
  // planks leave a full standing clearance underneath.
  const slab=(u,v,w,d,top,kind)=>slabs.push({u,v,w,d,top,kind,thickness:kind==='landing'?.085:.13});
  for(let n=0;n<5;n++) {
    const y=floor+rise*n, taper=1-n*.085;
    const w=b.w*taper, d=b.d*taper, shaftW=2*(lane+stairWidth/2), shaftD=run+1.5;
    const crown=n===4, wallRatio=n ? .76 : .73;
    const roof={width:w*PAGODA_SPAN,depth:d*PAGODA_SPAN,eave:y+2.60*scale,
      rise:(crown?2.05:1.19)*scale,form:'pagoda',aperture:crown?0:.51,
      wallWidth:w*wallRatio,wallDepth:d*wallRatio};
    storeys.push({y,w,d,roof,wallTop:n ? y+2.45*scale : roomPlan(b).ceiling});
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

// Both the painted roof and the contact surface use local eave coordinates
// (-1 to 1). The gable ridge is narrower than its eaves; the pagoda has a
// real opening above the stairs. Outside the sheet there is no surface.
export function roofProfile(form, x, z, aperture = .51, padX = 0, padZ = 0) {
  x = Math.abs(x);
  if (x > 1 + padX || Math.abs(z) > 1 + padZ) return -Infinity;
  if (form === 'leanTo') return Math.max(0,Math.min(1,.5-.5*z));
  z = Math.abs(z);
  if (form === 'hip') return hipHeight(x,z);
  if (form === 'barkHip') {
    const pitch=Math.max(z,(x-.46)/.54,0), t=Math.min(1,pitch);
    // The cypress-bark roof swells above the eaves, then lifts at each hip.
    return (1-t)*(1+.18*Math.sin(Math.PI*t))+.10*Math.min(x,z)**5;
  }
  if (form === 'pagoda') {
    const r = Math.max(x,z);
    if (x + padX < aperture && z + padZ < aperture) return -Infinity;
    const t = Math.min(1, Math.max(0, (r - aperture) / (1 - aperture)));
    const corner = Math.min(x,z) / Math.max(.001,r);
    return (1-t)**1.59 + .17*corner**3.8*t**1.7;
  }
  const v = Math.min(1,z);
  const width = .86 + .14*v;
  if (x > width + padX) return -Infinity;
  const end = Math.min(1,x/width);
  return (1-v)**1.62 + end**5*(.045 + .12*v);
}
