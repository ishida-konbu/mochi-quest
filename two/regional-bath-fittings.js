// Every hard fitting is on the bank. +v is the walk-in beach. Width and
// depth are full dimensions; elevations are relative to the water line.
export const inletImpactV=1.338;
export function regionalBathFittings(site, lip) {
  const a=-Math.PI*.62, b=Math.PI*.21;
  const shore=(angle)=>lip(site.index,angle);
  return {
    inlet:{u:site.rx*shore(a)*Math.cos(a),v:site.rz*shore(a)*Math.sin(a)-.16,
      w:1.62,d:2.16,h:1.35},
    sign:{u:(site.rx+.58)*shore(b)*Math.cos(b),v:(site.rz+.52)*shore(b)*Math.sin(b),
      w:1.46,d:.16,h:1.39},
  };
}

// The same place-specific water is visible in the hollow of the spout, at
// the falling sheet and across the basin. Dyes are sRGB.
export const bathCraft={
  sakura:  {rim:'cobble', spout:'bamboo',   plant:'sakura',water:'#8a9e85',base:'#959987',accent:'#ca9a98'},
  bamboo:  {rim:'slate',  spout:'bamboo',   plant:'sasa',water:'#738c73',base:'#717d68',accent:'#8a946a'},
  earthen: {rim:'coping', spout:'jar',      plant:'iris',water:'#91a090',base:'#997c66',accent:'#9e654c'},
  sulfur:  {rim:'sinter', spout:'cascade',  plant:'sedge',water:'#bac6a5',base:'#b4a581',accent:'#c8bd8c'},
  paddy:   {rim:'cobble', spout:'board',    plant:'rice',water:'#909e79',base:'#919177',accent:'#b69a5d'},
  shore:   {rim:'timber', spout:'trough',   plant:'sedge',water:'#839e96',base:'#8c8b79',accent:'#786f56'},
  snow:    {rim:'slate',  spout:'cascade',  plant:'pine',water:'#97afa7',base:'#8d9b9b',accent:'#e2e6de'},
  maple:   {rim:'slate',  spout:'rock',     plant:'maple',water:'#89947f',base:'#818777',accent:'#a66345'},
  susuki:  {rim:'cobble', spout:'board',    plant:'susuki',water:'#989b7a',base:'#a09880',accent:'#ceb58b'},
  dawn:    {rim:'sinter', spout:'boat',     plant:'sedge',water:'#a4ada1',base:'#b1a594',accent:'#c1a487'},
  capital: {rim:'coping', spout:'lotus',    plant:'iris',water:'#82938a',base:'#91978c',accent:'#7a8c7e'},
  peach:   {rim:'cobble', spout:'jar',      plant:'peach',water:'#a7a28e',base:'#ab9b88',accent:'#bc8386'},
  temple:  {rim:'coping', spout:'lotus',    plant:'lotus',water:'#7d9083',base:'#8a8876',accent:'#8a8e75'},
  inari:   {rim:'slate',  spout:'fox',      plant:'sasa',water:'#92a18b',base:'#8e8a78',accent:'#ad684d'},
  tsuruga: {rim:'slate',  spout:'boat',     plant:'susuki',water:'#829b94',base:'#929c96',accent:'#8a7760'},
  sakai:   {rim:'coping', spout:'jar',      plant:'sedge',water:'#899a91',base:'#9f9785',accent:'#647f7b'},
};
