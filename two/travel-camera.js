const clamp = (value, low, high) => Math.max(low, Math.min(value, high));
const angleBetween = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const ramp = (value, low, high) => {
  const t = clamp((value - low) / (high - low), 0, 1);
  return t * t * (3 - 2 * t);
};

// A skiff carries its seated passenger. Walking on a ship's deck supplies
// its own velocity after the ship has transported the player for the frame.
export function canFollowTravel(player) {
  return !player.activity && !player.skiff;
}

export function createTravelCamera() {
  let steeringYaw = null, inputAngle = 0;
  let turnRate = 0, manualHold = 0, lead = 0;

  function movementYaw(yaw, side, forward, enabled) {
    if (!enabled || (!side && !forward)) {
      steeringYaw = null;
      return yaw;
    }
    const angle = Math.atan2(side, forward);
    if (steeringYaw === null) {
      steeringYaw = yaw;
      inputAngle = angle;
    } else {
      // A held arrow keeps its world course even as the eye turns. A new
      // keyboard chord or a stick flick aims relative to the current view.
      const change = angleBetween(angle, inputAngle);
      const magnitude = Math.abs(change);
      if (magnitude >= .65) {
        steeringYaw = yaw;
        inputAngle = angle;
      } else if (magnitude > .22) {
        // The stick itself remains responsive within this band. Only its
        // reference frame ignores small reciprocal movements of the thumb.
        const intended = magnitude - .22;
        steeringYaw += clamp(angleBetween(yaw, steeringYaw), -intended, intended);
        inputAngle += Math.sign(change) * intended;
      }
    }
    return steeringYaw;
  }

  function manualLook(deltaYaw = 0) {
    if (steeringYaw !== null) steeringYaw += deltaYaw;
    manualHold = 1.35;
    turnRate = 0;
  }

  function follow(yaw, player, dt, enabled, looking = false) {
    if (looking) manualLook();
    else manualHold = Math.max(0, manualHold - dt);
    const following = enabled && canFollowTravel(player) && !looking && manualHold === 0;
    const speed = following ? Math.hypot(player.vx, player.vz) : 0;
    let ahead = 0;
    if (speed > .25) {
      // Post-contact horizontal velocity follows a sliding wall, a dive or a
      // flight across the map seam. A vertical jump has no bearing to chase.
      let turn = angleBetween(Math.atan2(-player.vx, -player.vz), yaw);
      if (Math.abs(turn) > Math.PI - .12 && turnRate !== 0) {
        turn = Math.sign(turnRate) * Math.abs(turn);
      }
      // Start gently at the edge of the thumbstick and allow faster turns
      // when rolling or riding at speed. Both limits are in radians/second.
      const maxRate = 1.12 + .33 * ramp(speed, 6.4, 20);
      const targetRate = clamp(turn * 2.8, -maxRate, maxRate) * ramp(speed, .25, 1.35);
      turnRate += (targetRate - turnRate) * (1 - Math.exp(-5 * dt));
      const step = turnRate * dt;
      if (Math.sign(step) === Math.sign(turn) && Math.abs(step) >= Math.abs(turn)) {
        yaw += turn;
        turnRate = 0;
      } else yaw += step;
      ahead = ramp(speed, 6, 23) * Math.max(0, Math.cos(turn)) ** 2;
    } else turnRate = 0;
    lead += (ahead - lead) * (1 - Math.exp(-3.5 * dt));
    return yaw;
  }

  function reset() {
    steeringYaw = null;
    turnRate = manualHold = lead = 0;
  }
  return { movementYaw, manualLook, follow, reset, get lead() { return lead; } };
}

// A view along the line from the traveller to the cut hides the blade behind
// the dough or the trunk. Ease to the nearest clear three-quarter view once.
export function chopCameraArc(yaw, axeLine, clearance) {
  const relative = angleBetween(yaw, axeLine);
  if (Math.abs(Math.sin(relative)) >= .79) return null;
  const axis = axeLine + (Math.cos(relative) < 0 ? Math.PI : 0);
  let chosen, best = -Infinity;
  for (const side of [-1, 1]) {
    const turn = angleBetween(axis + side * 1.29, yaw);
    if (Math.abs(turn) > 1.55) continue;
    const room = Math.min(clearance(yaw + turn / 2), clearance(yaw + turn));
    const score = room * 1.55 - Math.abs(turn);
    if (score > best) { best = score; chosen = turn; }
  }
  if (chosen === undefined) return null;
  const duration = Math.max(.65, Math.abs(chosen) * 1.53);
  let elapsed = 0;
  return dt => {
    elapsed = Math.min(duration, elapsed + dt);
    return yaw + chosen * ramp(elapsed, 0, duration);
  };
}
