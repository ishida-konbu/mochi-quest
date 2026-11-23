// Several handovers share a kind of object, but the wrapping and maker's
// marks change in the player's hands as the story progresses.
const individualDrawings = {
  'trial-print': 'trial-print',
  'peach-invite': 'peach-invite',
  'palace-invite': 'palace-invite',
  'makers-seals': 'makers-seals',
  'board-loan': 'port-tag',
};

export function itemIllustration(item) {
  const drawing = individualDrawings[item.id] ?? item.art;
  return new URL('./assets/items/' + drawing + '.webp', import.meta.url).href;
}
