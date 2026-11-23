// A short walk on the same floor connects the traveller's actual position
// to the open side of the resident's hands. Sample the whole stride: a desk,
// another witness or the edge of an upstairs floor can lie between its ends.
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

function clearStride(a,b,footing){
  const steps=Math.max(1,Math.ceil(distance(a,b)/.065));
  let y=a.y;
  for(let i=1;i<=steps;i++){
    const t=i/steps,next=footing(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,y);
    if(!Number.isFinite(next) || Math.abs(next-y)>.28)return false;
    y=next;
  }
  return Math.abs(y-b.y)<.3;
}

export function shortRoute(from, to, footing, maxLength = 5.5) {
  const direct = distance(from, to);
  if (direct > maxLength) return null;
  if (clearStride(from,to,footing)) return [to];
  // Try the two ends of an obstruction. The closest passable bend wins.
  const mx = (from.x + to.x) / 2, mz = (from.z + to.z) / 2;
  const nx = (from.z - to.z) / (direct || 1), nz = (to.x - from.x) / (direct || 1);
  for (const width of [.55, 1, 1.55, 2.1]) {
    for (const side of [1, -1]) {
      const x = mx + nx * width * side, z = mz + nz * width * side;
      const y = footing(x, z, from.y), bend = {x, y, z};
      if (Number.isFinite(y) && distance(from, bend) + distance(bend, to) <= maxLength &&
          clearStride(from,bend,footing) && clearStride(bend,to,footing)) return [bend, to];
    }
  }
  return null;
}

export function visitorMark(player, host, yaw, frontage, footing, standing = footing) {
  const sx = Math.sin(yaw), cz = Math.cos(yaw);
  let best = null;
  // Work from the side of the tray, leaving its front free for the lens.
  for (const [across, ahead] of [[.91, .48], [-.91, .48], [.71, .76], [-.71, .76],
    [1.12, .25], [-1.12, .25], [.36, 1.03], [-.36, 1.03],
    [.42,1.45],[-.42,1.45],[1.33,.92],[-1.33,.92],[1.62,.28],[-1.62,.28],[.68,1.78],[-.68,1.78],[1.5,1.32],[-1.5,1.32],[1.9,.28],[-1.9,.28],[0,2.1]]) {
    const x = host.x + across * cz + (frontage + ahead) * sx;
    const z = host.z - across * sx + (frontage + ahead) * cz;
    const y = standing(x, z, host.y);
    if (!Number.isFinite(y) || Math.abs(y - host.y) > .52) continue;
    const to = {x, y, z};
    if (best && distance(player, to) >= best.length) continue;
    const route = shortRoute(player, to, footing);
    if (!route) continue;
    const length = route.reduce((n, p, i) => n + distance(i ? route[i - 1] : player, p), 0);
    if (!best || length < best.length) best = {route, length, to};
  }
  return best;
}

// Keep the approach direction when it already gives a clear view of the hands.
// Check other sides once, at the start of the conversation. Subsequent gestures
// keep this same side of the table, even when the recipient becomes the speaker.
// Clearance of the camera-to-object segment around a rounded body, including
// its near silhouette. The ray ends on the object, not behind the worktable.
export function bodySightline(eye, target, body, width, height) {
  const x=(target.x-body.x)/width, y=(target.y-body.y)/height, z=(target.z-body.z)/width;
  const dx=(eye.x-target.x)/width, dy=(eye.y-target.y)/height, dz=(eye.z-target.z)/width;
  const t=Math.max(0,Math.min(1,-(x*dx+y*dy+z*dz)/(dx*dx+dy*dy+dz*dz || 1)));
  return Math.min(1, Math.max(0,(Math.hypot(x+t*dx,y+t*dy,z+t*dz)-.92)/.22));
}
export function conversationView(focus, facing, player, blocked, distance, rise, arrivalYaw, armClearance, subjectClearance) {
  const lateral = (player.x - focus.x) * Math.cos(facing) - (player.z - focus.z) * Math.sin(facing);
  const opposite = lateral >= 0 ? -1 : 1;
  const candidates = [.62,.95,.27,-.62,-.95,1.37,-1.37,0,1.9,-1.9,2.42,-2.42,Math.PI]
    .map(offset => facing + opposite * offset);
  if (Number.isFinite(arrivalYaw)) candidates.unshift(arrivalYaw);
  let best = -Infinity, chosen = facing;
  for (const yaw of candidates) {
    const sx = Math.sin(yaw), cz = Math.cos(yaw);
    let clearance = 1;
    for (let d = .21; d <= distance; d += .19) {
      if (blocked(focus.x + d*sx, focus.y + d*rise, focus.z + d*cz, Math.max(0,(d-.4)*.13))) {
        clearance -= .19*(1+d/distance)/distance;
      }
    }
    const turn = Number.isFinite(arrivalYaw) ? 1-Math.cos(yaw-arrivalYaw) : 0;
    const score = clearance - .11*turn - (armClearance ? 2*(1-armClearance(yaw)) : 0)
      - (subjectClearance ? 3*(1-subjectClearance(yaw)) : 0);
    if (score > best) {best = score; chosen = yaw;}
    if (score >= 1) break;
  }
  return chosen;
}

// Match a spot on the worktop to a reachable standing pose. Rotate the
// anatomical palm offset about the feet, including the lateral component
// of a rice mitt. The return path always uses the same floor as the player.
export function worktopMark(player, target, palm, footing, standing, detour, measureGrip) {
  const choices=[];
  const samples = measureGrip ? 48 : 24;
  const extensions = measureGrip ? [.08,.23,-.09,.38,-.22,.51,.62] : [.10,.27,-.10,.41];
  const chestRise = measureGrip ? .23 : .17, reach = measureGrip ? .70 : .47;
  for(let j=0;j<samples;j++){
    const yaw=player.heading+(j%2?1:-1)*Math.ceil(j/2)*2*Math.PI/samples;
    const sn=Math.sin(yaw),cs=Math.cos(yaw);
    const hx=cs*palm.x+sn*palm.z,hz=-sn*palm.x+cs*palm.z,length=Math.hypot(hx,hz) || 1;
    for(const extra of extensions){
      const x=target.x-hx*(1+extra/length),z=target.z-hz*(1+extra/length);
      const y=standing(x,z,player.y);
      const rise=target.y-y-palm.y;
      if(!Number.isFinite(y) || Math.abs(y-player.y)>.52 ||
          Math.hypot(extra,Math.max(0,rise-chestRise),Math.min(0,rise))>reach)continue;
      const goal={x,y,z},cost=distance(goal,player)+Math.abs(yaw-player.heading)*.13+Math.abs(extra)*.34;
      const gap=measureGrip ? measureGrip(goal,yaw) : 0;
      if(!Number.isFinite(gap) || gap>.031)continue;
      choices.push({goal,yaw,cost:cost+gap*8});
    }
  }
  choices.sort((a,b)=>a.cost-b.cost);
  for(const {goal,yaw,cost} of choices){
    const route=shortRoute(player,goal,footing,9);
    if(route)return {route,yaw,cost};
  }
  if(detour)for(const {goal,yaw,cost} of choices){
    const route=detour(goal);
    if(route)return {route,yaw,cost};
  }
  return null;
}

// A crowded workshop may need successive turns around both a resident and
// the counter. Share the local survey between all candidate handing points.
export function workshopDetour(from,footing){
  const step=.34,limit=20,stride=limit*2+1,origin=limit*stride+limit;
  const grid=new Map(),queue=[{at:{x:from.x,y:from.y,z:from.z},i:0,j:0,parent:null}];
  grid.set(origin,queue[0]);let cursor=0;
  const reachable=(a,b)=>clearStride(a,b,footing);
  function survey(targetKey){
    // Stop when this particular patch of floor has been checked. A reachable
    // hand beside the drawer need not wait for a survey of the whole village.
    while(!grid.has(targetKey) && cursor<queue.length){
      const node=queue[cursor++];
      for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1],[1,1],[-1,-1]]){
        const i=node.i+di,j=node.j+dj,key=(j+limit)*stride+i+limit;
        if(Math.abs(i)>limit || Math.abs(j)>limit || grid.has(key))continue;
        const x=from.x+i*step,z=from.z+j*step,y=footing(x,z,node.at.y);
        if(!Number.isFinite(y)){grid.set(key,null);continue;}
        const at={x,y,z};
        if(!reachable(node.at,at))continue;
        const n={i,j,at,parent:node};grid.set(key,n);queue.push(n);
      }
    }
    return grid.get(targetKey);
  }
  return goal=>{
    const col=Math.round((goal.x-from.x)/step),row=Math.round((goal.z-from.z)/step);
    for(const [di,dj] of [[0,0],[-1,0],[1,0],[0,-1],[0,1],[1,1],[-1,-1],[-1,1],[1,-1]]){
      if(Math.abs(row+dj)>limit || Math.abs(col+di)>limit)continue;
      let n=survey((row+dj+limit)*stride+col+di+limit);
      if(!n || !reachable(n.at,goal))continue;
      const stops=[goal];
      for(;n.parent;n=n.parent)stops.unshift(n.at);
      const route=[];let at=from;
      for(let i=0;i<stops.length;){
        let last=stops.length-1;
        while(last>i && !reachable(at,stops[last]))last--;
        at=stops[last];route.push(at);i=last+1;
      }
      return route;
    }
    return null;
  };
}
