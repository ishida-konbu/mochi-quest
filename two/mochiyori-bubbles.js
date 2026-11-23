import { Vector3, MathUtils } from './vendor/three.module.min.js';
import { CAST } from './mochiyori-story.js';

const portraits = new Map([...CAST.map(person => person.name), '茶屋の亭主', '炭焼き', '配達人のお餅']
  .map((name, index) => [name, index]));
const residents = new Map(CAST.map(person => [person.name, person]));
const heroName = '配達人のお餅';

function node(tag, cls, label) {
  const el = document.createElement(tag);
  el.className = cls;
  if (label) el.textContent = label;
  return el;
}

export function createSpeechView({stage, canvas, camera, player, dialogue, world, approach, activate, destination, inspectHands}) {
  const layer = node('div', 'speech-layer');
  const signs = node('div', 'speaker-signs');
  const bubble = node('section', 'world-speech');
  const portrait = node('span', 'speaker-portrait');
  const words = node('div', 'speaker-words');
  const byline = node('div', 'speaker-byline');
  const name = node('strong', 'speaker-name');
  const trade = node('small', 'speaker-trade');
  const line = node('p', 'spoken-line');
  const close = node('button', 'speech-close', '×');
  const controls = node('div', 'dialogue-replies');
  const lens = node('button','handwork-lens','手元を拡大');
  let closeView = false;
  lens.type = 'button';
  lens.onclick = () => {
    if (!inspectHands?.(!closeView)) return;
    closeView = !closeView;
    lens.textContent = closeView ? '全景に戻る' : '手元を拡大';
    lens.setAttribute('aria-pressed',String(closeView));
    canvas.focus({preventScroll:true});
  };
  close.type = 'button';
  close.title = '会話を終える（Esc）';
  close.setAttribute('aria-label', close.title);
  words.setAttribute('aria-live', 'polite');
  words.setAttribute('aria-atomic', 'true');
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', '配達人のお餅の返事');
  byline.append(name, trade);
  words.append(byline, line);
  bubble.append(portrait, words, close);
  layer.append(signs, bubble, controls);
  stage.append(layer);
  bubble.hidden = controls.hidden = true;
  const markers = new Map();
  const point = new Vector3();
  const origin = new Vector3();
  let frame = null, playing = false, width = 0, height = 0;

  // Measure the balloon only when its content wraps or the viewport changes.
  new ResizeObserver(([entry]) => {
    width = entry.borderBoxSize?.[0]?.inlineSize || bubble.offsetWidth;
    height = entry.borderBoxSize?.[0]?.blockSize || bubble.offsetHeight;
  }).observe(bubble);

  function show(next) {
    frame = next;
    stage.classList.toggle('speaking', !!next);
    bubble.hidden = controls.hidden = !next;
    controls.replaceChildren();
    if (!next) return;
    const speaker = next.speaker === 'お餅' ? heroName : next.speaker;
    const person = residents.get(speaker) || (next.person.name === speaker && next.person);
    const tile = portraits.get(speaker);
    portrait.hidden = tile == null;
    if (tile != null) portrait.style.backgroundPosition = (tile%8)*100/7+'% '+Math.floor(tile/8)*100/7+'%';
    name.textContent = speaker;
    trade.textContent = person?.occupation || '';
    line.textContent = next.text;
    bubble.classList.toggle('courier-line',speaker === heroName);
    if (next.action) world().playAction(next.action.key, next.person.id);
    else world().stopAction();
    for (const [i, option] of next.choices.entries()) {
      const reply = node('button','reply-option');
      reply.type = 'button';
      if (i < 9) {
        const key = node('kbd','reply-key',next.choices.length === 1 ? 'E' : String(i+1));
        key.setAttribute('aria-hidden','true');
        reply.append(key);
      }
      reply.append(node('span','',option.label));
      reply.onclick = () => advance(option.id);
      controls.append(reply);
    }
    if (!next.choices.length) {
      const more = node('button','reply-next');
      more.type = 'button';
      more.append(node('kbd','reply-key','E'),node('span','','続きを読む'));
      more.onclick = () => advance();
      controls.append(more);
    }
    controls.append(lens);
    controls.classList.toggle('single-reply',next.choices.length <= 1);
    controls.scrollTop = 0;
    playing = !world().actionPlaying;
    syncPlayback();
  }

  function syncPlayback() {
    lens.hidden = !(closeView || frame?.action && world().actionFocus);
    const busy = !!world().actionPlaying;
    if (playing === busy) return;
    playing = busy;
    for (const button of controls.children) if (button !== lens) button.disabled = busy;
    const more = controls.querySelector('.reply-next span');
    if (more) more.textContent = busy ? '手元を見る…' : '続きを読む';
  }

  function stop() {
    if (!frame) return;
    dialogue.close();
    world().stopAction();
    world().holdSpeaker(null);
    show(null);
    canvas.focus({preventScroll:true});
  }

  function advance(id) {
    if (!frame || world().actionPlaying) return;
    if (id === undefined && frame.choices.length === 1) id = frame.choices[0].id;
    if (id === undefined && frame.choices.length) {
      controls.firstElementChild.focus({preventScroll:true});
      return;
    }
    const next = dialogue.step(id);
    if (!next) { stop(); return; }
    if (next === frame) return;
    show(next);
    canvas.focus({preventScroll:true});
  }

  function start(contact) {
    if (!contact?.person) return;
    activate();
    const who = world().speakers().find(s => s.person.id === contact.person.id && s.site.key === contact.site.key);
    if (!who) return;
    who.actor.getWorldPosition(origin);
    const next = contact.pickup ? dialogue.inspect(contact.pickup, who.site) : dialogue.start(who.person, who.site);
    if (!next) return;
    closeView = false;
    lens.textContent = '手元を拡大';
    lens.setAttribute('aria-pressed','false');
    world().holdSpeaker(who.person.id);
    approach();
    show(next);
    canvas.focus({preventScroll:true});
  }
  close.onclick = stop;

  function handleKey(event) {
    if (!frame) return false;
    const digit = /^(?:Digit|Numpad)([1-9])$/.exec(event.code);
    if (!digit && event.code !== 'KeyE' && event.code !== 'Escape') return false;
    event.preventDefault();
    if (!event.repeat) {
      if (event.code === 'Escape') stop();
      else if (!digit) advance();
      else {
        const option = frame.choices[+digit[1]-1];
        if (option) advance(option.id);
      }
    }
    return true;
  }

  function mark(who) {
    let sign = markers.get(who.person.id);
    if (!sign) {
      sign = node('button','speaker-sign','…');
      sign.type = 'button';
      sign.setAttribute('aria-label',who.person.name+'に話しかける');
      sign.onclick = () => {
        const near = world().nearest(player, who.person.id);
        if (near?.person.id === who.person.id) start(near);
      };
      markers.set(who.person.id, sign);
      signs.append(sign);
    }
    return sign;
  }

  function update(hidden) {
    layer.hidden = hidden;
    if (hidden) return;
    const people = world().speakers(), w = canvas.clientWidth, h = canvas.clientHeight;
    signs.hidden = !!frame;
    if (!frame) {
      const lead = destination();
      for (const [id, sign] of markers) {
        if (!people.some(who => who.person.id === id)) { sign.remove(); markers.delete(id); }
      }
      for (const who of people) {
        const sign = mark(who);
        const d = who.actor.getWorldPosition(point).distanceToSquared(player);
        point.copy(who.anchor).project(camera);
        sign.hidden = d > 28*28 || point.z < -1 || point.z > 1 || Math.abs(point.x) > 1 || Math.abs(point.y) > 1;
        if (sign.hidden) continue;
        const expected = lead && who.person.name === lead.person && who.site.region === lead.site.region && who.site.place === lead.site.place;
        const label = expected ? who.person.name : '…';
        if (sign.textContent !== label) {
          sign.textContent = label;
          sign.classList.toggle('awaited', Boolean(expected));
        }
        const near = d < 4.8*4.8 && world().nearest(player,who.person.id)?.person.id === who.person.id;
        if (sign.disabled === near) sign.disabled = !near;
        const x = (point.x+1)*w/2, y = (1-point.y)*h/2;
        sign.style.transform = 'translate('+Math.round(x)+'px,'+Math.round(y)+'px) translate(-50%,-100%)';
      }
      return;
    }

    if (Math.hypot(player.x-origin.x, player.z-origin.z) > 7 || Math.abs(player.y-origin.y) > 4.5) { stop(); return; }
    syncPlayback();
    if (frame.speaker === heroName || frame.speaker === 'お餅') {
      point.set(player.x,player.y+(player.mount ? 2.6 : 1.7),player.z);
    } else {
      const who = people.find(s => s.person.name === frame.speaker && s.site.key === frame.site.key);
      if (who) point.copy(who.anchor);
      else point.copy(origin).y += 1.8;
    }
    point.project(camera);
    const ahead = point.z >= -1 && point.z <= 1;
    const x = ahead ? (1+point.x)*w/2 : w/2, y = ahead ? (1-point.y)*h/2 : h*.45;
    const bw = width || bubble.offsetWidth, bh = height || bubble.offsetHeight;
    if (closeView) {
      // Leave the area around the hands open, even when the speaker is the
      // courier bending over the work. Keep the caption in the upper margin.
      bubble.style.transform = 'translate('+Math.round(w-bw-8)+'px,'+Math.round(Math.min(66,h*.13))+'px)';
      bubble.classList.add('outside-view');
      return;
    }
    const left = MathUtils.clamp(x-bw*.44,8,Math.max(8,w-bw-8));
    const top = MathUtils.clamp(y-bh-15,8,Math.max(8,h-bh-28));
    bubble.style.transform = 'translate('+Math.round(left)+'px,'+Math.round(top)+'px)';
    bubble.style.setProperty('--tail',MathUtils.clamp(x-left,15,bw-17)+'px');
    bubble.classList.toggle('outside-view',!ahead || x < 0 || x > w || y < top+bh-6);
  }
  return {start, advance, stop, handleKey, update, get active() {return !!frame;}};
}
