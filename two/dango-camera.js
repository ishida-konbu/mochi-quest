const clamp = (value, low, high) => Math.max(low, Math.min(value, high));
const angleBetween = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const ramp = (value, low, high) => {
  const t = clamp((value - low) / (high - low), 0, 1);
  return t * t * (3 - 2 * t);
};

export function onDangoCourse(player) {
  return player.mode === 'dango' && !player.inWater &&
    !player.mount && !player.skiff && !player.activity;
}

export function isGroundedDango(player) {
  return player.grounded && onDangoCourse(player);
}

export function createDangoCamera() {
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
    const rolling = enabled && isGroundedDango(player) && !looking && manualHold === 0;
    const speed = rolling ? Math.hypot(player.vx, player.vz) : 0;
    let ahead = 0;
    if (speed > 3) {
      // The camera sits on the opposite side of the actual ground velocity.
      // Contact sliding and the world's wrapped seam are resolved by physics.
      let turn = angleBetween(Math.atan2(-player.vx, -player.vz), yaw);
      if (Math.abs(turn) > Math.PI - .12 && turnRate !== 0) {
        turn = Math.sign(turnRate) * Math.abs(turn);
      }
      const targetRate = clamp(turn * 2.8, -1.45, 1.45) * ramp(speed, 3, 12);
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
