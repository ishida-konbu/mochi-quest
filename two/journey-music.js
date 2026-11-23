import { palaceInteriorAt } from './ryugu-layout.js';

// repeatLead starts the returning intro this many seconds before the end.
// For quiet intros, fadeInAt delays the handoff until the recording becomes audible.
export const JOURNEY_MUSIC = {
  river: { title: 'Inuyama Gardens', artist: 'Mandala Dreams', file: 'inuyama-gardens.mp3', repeatLead: 4.3 },
  shrine: { title: 'Oku No In', artist: 'Mandala Dreams', file: 'oku-no-in.mp3', repeatLead: 5.8 },
  market: { title: 'State of Zen', artist: 'Mandala Dreams', file: 'state-of-zen.mp3', repeatLead: 5.6 },
  spring: { title: 'Onsen Ritual', artist: 'Joseph Beg', file: 'onsen-ritual.mp3', repeatLead: 7.6 },
  terraces: { title: 'Shade Of The Sunflower', artist: 'Mandala Dreams', file: 'shade-of-the-sunflower.mp3', repeatLead: 4.4 },
  coast: { title: 'Pacific Shores', artist: 'Mandala Dreams', file: 'pacific-shores.mp3', repeatLead: 5.8 },
  snow: { title: 'Sand Mandala', artist: 'Joseph Beg', file: 'sand-mandala.mp3', repeatLead: 4.3 },
  autumn: { title: 'Autumn Garden', artist: 'Joseph Beg', file: 'autumn-garden.mp3', repeatLead: 3.6 },
  moon: { title: 'Waking Dream', artist: 'Mandala Dreams', file: 'waking-dream.mp3', repeatLead: 3.7 },
  dawn: { title: 'Ittekimasu', artist: 'Mandala Dreams', file: 'ittekimasu.mp3', repeatLead: 3.4 },
  kyo: { title: 'Rise of the Red Sun', artist: 'Mandala Dreams', file: 'rise-of-the-red-sun.mp3', repeatLead: 6.8, fadeInAt: .65 },
  peach: { title: 'Shanghai', artist: 'Saira Ridley', file: 'shanghai.mp3', repeatLead: 4.3, gain: .24 },
  ryugu: { title: 'Across the Sea of Japan', artist: 'Mandala Dreams', file: 'across-the-sea-of-japan.mp3', repeatLead: 6.2 },
  todaiji: { title: 'Sanctity (Instrumental Version)', artist: 'Isaku Kageyama', file: 'sanctity-instrumental-version.mp3', repeatLead: 3.1 },
  inari: { title: 'Hokkaido Solitude', artist: 'Mandala Dreams', file: 'hokkaido-solitude.mp3', repeatLead: 2.6 },
  tsuruga: { title: 'Kyoto by Dawn', artist: 'Ooyy, Smartface', file: 'kyoto-by-dawn.mp3', repeatLead: 2.5 },
  sakai: { title: 'Greeted in Osaka', artist: 'Sight of Wonders', file: 'greeted-in-osaka.mp3', repeatLead: 4.1 },
  palace: { title: 'Hong Kong Calling', artist: 'Philip Ayers', file: 'hong-kong-calling.mp3', repeatLead: 9.2, fadeInAt: 3.0 },
  boat: { title: 'Water Mirror', artist: 'Akibakid', file: 'water-mirror.mp3', repeatLead: 3.0 },
  bike: { title: 'Mayonaka', artist: 'Usnow', file: 'mayonaka.mp3', repeatLead: 3.6, gain: .20 },
};

export function journeyMusicCue({ regionId, player }, inPalace = palaceInteriorAt(player.x, player.z, player.y)) {
  if (player.mount === 'bike') return 'bike';
  if (player.vessel || player.skiff) return 'boat';
  if (regionId !== 'ryugu') return regionId;
  if (inPalace) return 'palace';
  return player.diveDepth > 0 ? 'ryugu' : 'coast';
}
