import { palaceInteriorAt } from './ryugu-layout.js';

export const JOURNEY_MUSIC = {
  river: { title: 'Inuyama Gardens', artist: 'Mandala Dreams', file: 'inuyama-gardens.mp3' },
  shrine: { title: 'Oku No In', artist: 'Mandala Dreams', file: 'oku-no-in.mp3' },
  market: { title: 'Water Mirror', artist: 'Akibakid', file: 'water-mirror.mp3' },
  spring: { title: 'Onsen Ritual', artist: 'Joseph Beg', file: 'onsen-ritual.mp3' },
  terraces: { title: 'Shade Of The Sunflower', artist: 'Mandala Dreams', file: 'shade-of-the-sunflower.mp3' },
  coast: { title: 'Pacific Shores', artist: 'Mandala Dreams', file: 'pacific-shores.mp3' },
  snow: { title: 'Hokkaido Solitude', artist: 'Mandala Dreams', file: 'hokkaido-solitude.mp3' },
  autumn: { title: 'Autumn Garden', artist: 'Joseph Beg', file: 'autumn-garden.mp3' },
  moon: { title: 'Waking Dream', artist: 'Mandala Dreams', file: 'waking-dream.mp3' },
  dawn: { title: 'Ittekimasu', artist: 'Mandala Dreams', file: 'ittekimasu.mp3' },
  kyo: { title: 'Kyoto by Dawn', artist: 'Ooyy, Smartface', file: 'kyoto-by-dawn.mp3' },
  peach: { title: 'Shanghai', artist: 'Saira Ridley', file: 'shanghai.mp3', gain: .24 },
  ryugu: { title: 'Sand Mandala', artist: 'Joseph Beg', file: 'sand-mandala.mp3' },
  todaiji: { title: 'Sanctity (Instrumental Version)', artist: 'Isaku Kageyama', file: 'sanctity-instrumental-version.mp3' },
  inari: { title: 'Strange Tales (Instrumental Version)', artist: 'Isaku Kageyama', file: 'strange-tales-instrumental-version.mp3' },
  tsuruga: { title: 'Across the Sea of Japan', artist: 'Mandala Dreams', file: 'across-the-sea-of-japan.mp3' },
  sakai: { title: 'Greeted in Osaka', artist: 'Sight of Wonders', file: 'greeted-in-osaka.mp3' },
  palace: { title: 'State of Zen', artist: 'Mandala Dreams', file: 'state-of-zen.mp3' },
  bike: { title: 'Mayonaka', artist: 'Usnow', file: 'mayonaka.mp3', gain: .20 },
};

export function journeyMusicCue({ regionId, player }, inPalace = palaceInteriorAt(player.x, player.z, player.y)) {
  if (player.mount === 'bike') return 'bike';
  if (regionId !== 'ryugu') return regionId;
  if (inPalace) return 'palace';
  return player.diveDepth > 0 ? 'ryugu' : 'coast';
}
