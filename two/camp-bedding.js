// Bedding is a furnishing choice of an individual bed. Regional teaching and
// its future unlock rules belong to the later island-wide progression design.
export const BEDDING_NAMES=Object.freeze(['藁の掛けむしろ','端切れの掛け布','煎餅布団','ふかふかの布団']);
export function setBeddingGrade(world,id,grade){
  const bed=world.structures.find(s=>s.kind==='camp' && s.id===id);
  if(!bed || !Number.isInteger(grade) || !BEDDING_NAMES[grade])return {ok:false,reason:'寝床と寝具を選んでください。'};
  world.structures=world.structures.map(s=>s===bed?{...s,beddingGrade:grade}:s);
  return {ok:true,message:BEDDING_NAMES[grade]+'をしつらえました。'};
}
