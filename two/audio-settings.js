import { JOURNEY_MUSIC } from './journey-music.js';
import { REGIONS } from './terrain.js';

function fillSoundtrack(table) {
  const areas = REGIONS.map(({ id, name }) => {
    if (id === 'coast') name += '／竜宮沖の海面';
    if (id === 'ryugu') name += '（潜水中）';
    return [id, name];
  });
  areas.push(['palace', '竜宮城の御殿'], ['boat', '船に乗っている間'], ['bike', '電動自転車に乗っている間']);
  for (const [id, label] of areas) {
    const track = JOURNEY_MUSIC[id];
    const row = table.insertRow();
    const area = document.createElement('th');
    area.scope = 'row';
    area.textContent = label;
    row.append(area);
    const song = row.insertCell();
    const artist = document.createElement('small');
    artist.textContent = track.artist;
    song.append(track.title, artist);
  }
}

export function createAudioSettings({
  volumes, travelCameraEnabled, onTravelCameraChange, onChange, onOpen, onReset,
  sceneryQuality, onSceneryQualityChange,
}) {
  const panel = document.getElementById('audio-settings');
  const toggle = document.getElementById('audio-settings-toggle');
  const dismiss = document.getElementById('audio-settings-close');
  const reset = document.getElementById('reset-journey');
  const scenery = document.getElementById('scenery-quality');
  scenery.value = sceneryQuality;
  scenery.addEventListener('change', () => onSceneryQualityChange(scenery.value));
  const follow = document.getElementById('travel-camera');
  follow.checked = travelCameraEnabled;
  follow.addEventListener('change', () => onTravelCameraChange(follow.checked));
  reset.addEventListener('click', () => {
    if (window.confirm('ほんとうにリセットしてもよいか？')) onReset();
  });
  const sliders = panel.querySelectorAll('input[type="range"]');
  const levels = { ...volumes };
  for (const slider of sliders) {
    const channel = slider.dataset.channel;
    const output = slider.nextElementSibling;
    slider.value = Math.round(levels[channel] * 100);
    const showValue = () => {
      const value = slider.value + '%';
      output.value = value;
      slider.setAttribute('aria-valuetext', value);
    };
    showValue();
    slider.addEventListener('input', () => {
      levels[channel] = slider.valueAsNumber / 100;
      showValue();
      onChange({ ...levels });
    });
  }
  fillSoundtrack(panel.querySelector('tbody'));

  function close(restoreFocus = false) {
    if (panel.hidden) return;
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', () => {
    if (!panel.hidden) return close(true);
    onOpen();
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    sliders[0].focus({ preventScroll: true });
  });
  dismiss.addEventListener('click', () => close(true));
  panel.addEventListener('keydown', event => {
    // Keep the range inputs' native arrow keys and the disclosure's Space key.
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    }
    if (event.key === 'Tab' && event.shiftKey && event.target === dismiss) {
      event.preventDefault();
      close(true);
    }
    if (event.key === 'Tab' && !event.shiftKey && event.target === reset) {
      // Rejoin the HUD's tab order just after the opener.
      event.preventDefault();
      close();
      document.getElementById('guide').focus({ preventScroll: true });
    }
  });
  panel.addEventListener('keyup', event => event.stopPropagation());
  function closeFromOutside(event) {
    if (!panel.contains(event.target) && !toggle.contains(event.target)) close();
  }
  document.addEventListener('pointerdown', closeFromOutside, true);
  document.addEventListener('focusin', closeFromOutside);
  return {
    close,
    setMuted(muted) { document.getElementById('audio-muted').hidden = !muted; },
  };
}
