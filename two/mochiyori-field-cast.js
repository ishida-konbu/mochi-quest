// The old picture-book performances can reconstruct a day in another town.
// In the field, local witnesses and the courier demonstrate it with the actual
// exhibits. Roles are in the same order as each performance's original cast.
export const courier = '配達人のお餅';
const roles = {
  'clue/steam-repair':['留吉',courier],
  'clue/steaming-witness':['蓮照',courier],
  'clue/wedding-tray':['大吉','蓮照'],
  'clue/flute-witness':['笛丸','結'],
  'proof/mystery_04/0':['とわ','安蔵','お澄'],
  'proof/mystery_04/1':['安蔵','お澄'],
  'end/mystery_04':['とわ','お澄','安蔵'],
  'proof/mystery_05/1':['ささ',courier,courier],
  'end/mystery_05':['ささ','ささ',courier],
  'proof/mystery_06/0':['宗伯','すずり'],
  'proof/mystery_06/1':['宗伯','すずり'],
  'proof/mystery_06/3':['すずり','宗伯','お澄'],
  'proof/mystery_07/1':['すずり','宗伯'],
  'proof/mystery_07/4':['すずり','宗伯'],
  'clue/port-wages':['勘兵衛',courier],
  'clue/lidded-bowl':['とわ',courier],
  'clue/seats-for-crew':['ちよ',courier]
};
export function fieldCast(score, hostName) {
  // A tasting is offered by the person you actually asked, even at the
  // coast or the court while the regular cook is working elsewhere.
  if(score.key.startsWith('food/'))return [hostName,courier];
  return roles[score.key] || score.cast;
}
