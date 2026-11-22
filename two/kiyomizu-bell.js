// The original bronze synthesis and hillside echoes are released under CC0-1.0.
import { bellRadiusAt, KIYOMIZU_BELL } from './kiyomizu-layout.js';
import { KYO_DAY_SECONDS } from './kyo-layout.js';
import { wrapWorld } from './geography.js';

export const BELL_INTERVAL = KYO_DAY_SECONDS / 6;
export const BELL_FIRST = BELL_INTERVAL / 4;
export function templeBellHour(time, clockOffset = 0) {
  return Math.floor((time + clockOffset - BELL_FIRST) / BELL_INTERVAL);
}

// A notice flies level. Intersect its swept edge with the bronze at that height,
// including the flared lip and the narrower shoulder under the suspension.
export function noticeBellDistance(start, dx, dz, length) {
  const bell = KIYOMIZU_BELL, margin = .045;
  const x = start.x - bell.x, z = start.z - bell.z;
  if (Math.abs(x) > length + bell.radius + margin || Math.abs(z) > length + bell.radius + margin ||
      start.y + margin < bell.bottom || start.y - margin > bell.top) return Infinity;
  const radius = bellRadiusAt(Math.max(bell.bottom, start.y - margin)) + margin;
  const distance2 = x*x + z*z - radius*radius;
  if (distance2 <= 0) return 0;
  const toward = -(x*dx + z*dz), chord2 = toward*toward - distance2;
  if (toward < 0 || chord2 < 0) return Infinity;
  const entry = toward - Math.sqrt(chord2);
  return entry <= length ? entry : Infinity;
}

// Split bronze modes beat slowly against one another. The high modes die away
// first and leave the low, wavering tail. [Hz, peak amplitude, decay seconds].
const modes = [
  [101.8, .265, 2.32], [102.43, .124, 2.07],
  [206.4, .123, 1.65], [239.7, .110, 1.18], [241.26, .067, 1.41],
  [375.6, .082, .85], [438.5, .048, .58], [617.3, .055, .42],
  [823.9, .040, .27], [1182.1, .023, .16], [1720.6, .013, .085],
];

export function createTempleBell(ctx, outdoor) {
  const bronze = ctx.createGain(), air = ctx.createBiquadFilter(), volume = ctx.createGain();
  const direct = ctx.createStereoPanner();
  air.type = 'lowpass'; air.Q.value = .6;
  bronze.connect(air).connect(volume).connect(direct).connect(outdoor);
  // Two quiet, darker returns from opposite slopes trail the direct sound.
  const reflections = [[.31, .16, 820], [.59, .085, 540]].map(([seconds, gain, hz]) => {
    const delay = ctx.createDelay(1), filter = ctx.createBiquadFilter();
    const send = ctx.createGain(), pan = ctx.createStereoPanner();
    delay.delayTime.value = seconds; filter.frequency.value = hz; filter.Q.value = .6;
    send.gain.value = gain;
    volume.connect(delay).connect(filter).connect(send).connect(pan).connect(outdoor);
    return pan;
  });
  const voices = new Set();
  let seen = null, tailUntil = 0, nextMix = 0;

  function excite(start, paper) {
    // Repeated throws can overlap. Retire the oldest tail with a short fade.
    if (voices.size >= 3) release(voices.values().next().value, .09);
    const voice = { gain: ctx.createGain(), nodes: new Set() };
    voice.gain.connect(bronze); voices.add(voice);
    function partial(hz, endHz, peak, attack, decay, type='sine') {
      const osc = ctx.createOscillator(), amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(hz, start);
      osc.frequency.setTargetAtTime(endHz, start, .032);
      amp.gain.setValueAtTime(0, start);
      amp.gain.linearRampToValueAtTime(peak, start + attack);
      amp.gain.setTargetAtTime(0, start + attack, decay);
      osc.connect(amp).connect(voice.gain);
      voice.nodes.add(osc);
      osc.onended = () => {
        osc.disconnect(); amp.disconnect(); voice.nodes.delete(osc);
        if (!voice.nodes.size) { voices.delete(voice); voice.gain.disconnect(); }
      };
      osc.start(start); osc.stop(start + attack + Math.min(13, 7 * decay));
    }
    for (const [hz, level, decay] of modes) {
      const strength = paper ? (hz < 250 ? .48 : .87) : 1;
      partial(hz * 1.0012, hz, level * strength, hz < 250 ? .032 : .006, decay);
    }
    if (paper) partial(1470, 947, .07, .003, .019);
    else partial(148, 68, .19, .005, .045, 'triangle');
    tailUntil = start + 14;
  }

  function release(voice, fade) {
    voice.gain.gain.setTargetAtTime(0, ctx.currentTime, fade / 5);
    for (const osc of voice.nodes) osc.stop(ctx.currentTime + fade);
    voices.delete(voice);
  }
  function update(strike, player, yaw, time, inside) {
    if (!strike) return;
    const now = ctx.currentTime;
    const fresh = strike !== seen && time >= strike.time && time - strike.time < .12;
    seen = strike;
    if (!fresh && (now > tailUntil || now < nextMix)) return;
    const dx = wrapWorld(KIYOMIZU_BELL.x - player.x), dz = wrapWorld(KIYOMIZU_BELL.z - player.z);
    const horizontal = Math.hypot(dx, dz);
    const distance = Math.hypot(horizontal, player.y + 1.1 - (KIYOMIZU_BELL.bottom + .8));
    const edge = Math.max(0, Math.min(1, (860 - distance) / 210));
    const level = edge*edge*(3 - 2*edge) / (1 + distance / 235) * (inside && horizontal > 15 ? .58 : 1);
    const pan = .78 * (dx*Math.cos(yaw) - dz*Math.sin(yaw)) / Math.max(5, horizontal);
    volume.gain.setTargetAtTime(level, now, .036);
    air.frequency.setTargetAtTime(630 + 4300 / (1 + distance / 90), now, .055);
    direct.pan.setTargetAtTime(pan, now, .045);
    reflections[0].pan.setTargetAtTime(.35 * pan - .44, now, .055);
    reflections[1].pan.setTargetAtTime(.32 * pan + .42, now, .055);
    nextMix = now + .045;
    if (fresh && level > .001) {
      excite(now + .004 + distance / 343, strike.source === 'notice');
      return level;
    }
  }
  function stop() {
    for (const voice of voices) release(voice, .015);
    tailUntil = nextMix = 0;
    volume.gain.cancelScheduledValues(ctx.currentTime);
    volume.gain.value = 0;
  }
  return { update, stop };
}
