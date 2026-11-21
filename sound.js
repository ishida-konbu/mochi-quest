const VOICES = {
  'モチコラショッ': new URL('./audio/mochikorasho.mp3', import.meta.url),
  '三条通知！': new URL('./audio/sanjo-tsuchi.mp3', import.meta.url)
};

// Short plucked phrases use the same pentatonic tuning throughout the scroll.
const PHRASES = {
  score: [[0, 659.25], [.075, 880]],
  pickup: [[0, 440], [.075, 523.25], [.15, 659.25]],
  mode: [[0, 329.63], [.072, 392], [.14, 523.25], [.22, 659.25]],
  bath: [[0, 329.63], [.17, 440], [.36, 523.25]],
  sleep: [[0, 440], [.22, 392], [.48, 261.63]],
  mount: [[0, 392], [.08, 523.25]],
  dismount: [[0, 523.25], [.1, 392]]
};

export function createAudio() {
  let enabled = true;
  let unlocked = false;
  let context;
  let master;
  let noise;
  let voice = null;
  let voiceText = '';
  let voiceUntil = 0;
  let voiceRequest = 0;
  const voices = new Map();
  const playing = new Set();

  function prepareVoice(text) {
    if (!voices.has(text)) {
      const request = fetch(VOICES[text]).then(response => {
        if (!response.ok) throw new Error('Voice audio unavailable');
        return response.arrayBuffer();
      }).then(data => context.decodeAudioData(data)).catch(() => null);
      voices.set(text, request);
    }
    return voices.get(text);
  }

  // Resume inside the gesture handler, before waiting on network or decoding.
  function unlock() {
    unlocked = true;
    if (!enabled) return;
    const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!context && Audio) {
      try {
        context = new Audio();
        master = context.createGain();
        master.gain.value = .72;
        master.connect(context.destination);
        noise = context.createBuffer(1, Math.ceil(context.sampleRate * .2), context.sampleRate);
        const samples = noise.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      } catch { context = null; }
    }
    if (context && context.state !== 'running') context.resume().catch(() => {});
    if (context) for (const text of Object.keys(VOICES)) prepareVoice(text);
  }

  function stopVoice() {
    if (voice) {
      try { voice.stop(); } catch { /* the scheduled clip already ended */ }
      voice = null;
    }
    globalThis.speechSynthesis?.cancel();
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    if (master) master.gain.value = enabled ? .72 : 0;
    if (enabled) return;
    voiceRequest++;
    voiceUntil = 0;
    stopVoice();
    for (const source of playing) {
      try { source.stop(); } catch { /* the envelope already ended */ }
    }
  }

  async function speak(text) {
    const now = performance.now();
    if (!(text in VOICES) || (text === voiceText && now < voiceUntil)) return;
    voiceText = text;
    voiceUntil = now + 750;
    const request = ++voiceRequest;
    const recorded = context ? await prepareVoice(text) : null;
    if (!enabled || request !== voiceRequest || performance.now() - now > 1800) return;
    stopVoice();
    if (recorded && context.state === 'running') {
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = recorded;
      gain.gain.value = .94;
      source.connect(gain).connect(master);
      source.onended = () => {
        if (voice === source) voice = null;
        source.disconnect(); gain.disconnect();
      };
      voice = source;
      voiceUntil = performance.now() + recorded.duration * 920;
      source.start();
    } else if (globalThis.speechSynthesis && globalThis.SpeechSynthesisUtterance) {
      const line = new SpeechSynthesisUtterance(text);
      line.lang = 'ja-JP';
      line.voice = speechSynthesis.getVoices().find(v => v.lang.startsWith('ja')) || null;
      line.pitch = 1.25; line.rate = 1.13; line.volume = .8;
      speechSynthesis.speak(line);
    }
  }

  function playSource(source, nodes, start, end) {
    playing.add(source);
    source.onended = () => {
      playing.delete(source);
      source.disconnect();
      for (const node of nodes) node.disconnect();
    };
    source.start(start); source.stop(end);
  }

  function tone(start, frequency, endFrequency, duration, level, shape = 'sine') {
    const oscillator = context.createOscillator();
    const amp = context.createGain();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    amp.gain.setValueAtTime(.0001, start);
    amp.gain.exponentialRampToValueAtTime(level, start + .006);
    amp.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(amp).connect(master);
    playSource(oscillator, [amp], start, start + duration + .01);
  }

  function rustle(start, low, high, duration, level) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const amp = context.createGain();
    source.buffer = noise;
    filter.type = 'bandpass';
    filter.Q.value = .8;
    filter.frequency.setValueAtTime(low, start);
    filter.frequency.exponentialRampToValueAtTime(high, start + duration);
    amp.gain.setValueAtTime(.0001, start);
    amp.gain.exponentialRampToValueAtTime(level, start + .012);
    amp.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(filter).connect(amp).connect(master);
    playSource(source, [filter, amp], start, start + duration + .004);
  }

  function effect(name) {
    if (!context || context.state !== 'running') return;
    const now = context.currentTime + .003;
    if (name === 'throw') {
      rustle(now, 1200, 5100, .15, .34);
    } else if (name === 'jump') {
      tone(now, 190, 430, .13, .10);
    } else if (name === 'elastic') {
      tone(now, 270, 585, .105, .085);
      tone(now + .06, 510, 330, .09, .042);
    } else if (name === 'bump') {
      tone(now, 150, 57, .18, .23, 'triangle');
      rustle(now, 680, 170, .15, .20);
    } else if (PHRASES[name]) {
      for (const [delay, hz] of PHRASES[name]) {
        tone(now + delay, hz * 1.012, hz, .47, .15, 'triangle');
        tone(now + delay, hz * 2.01, hz * 2, .12, .04);
      }
    }
  }

  function handle(event) {
    if (!enabled || !unlocked) return;
    if (event.type === 'say') void speak(event.text);
    else if (event.type === 'sound') effect(event.name);
  }
  return { unlock, setEnabled, handle };
}
