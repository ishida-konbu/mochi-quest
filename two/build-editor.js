// An edit is a draft until its explicit commit. The preview and the journey
// share the survey, including its terrain-dependent material receipt.
import {BUILD_MODULES,surveySite,constructionSite,finishConstruction,HEIGHT_STEP,MAX_HEIGHT_STEPS,
  getMoveRoots,surveyMoveGroup,moveStructureGroup,surveyRemoveGroup,removeStructureGroup,timberTree} from './living-build.js';
import {wrapCoord,wrapDelta,terrainContactHeight} from './terrain.js';
import {marketLocation} from './living-market.js';
import {buildName,createBuildPanel} from './build-editor-panel.js';

const stepAngle=Math.PI/12;
const snapTurn=a=>Math.atan2(Math.sin(Math.round(a/stepAngle)*stepAngle),Math.cos(Math.round(a/stepAngle)*stepAngle));
const level=n=>Math.round(n*100)/100;
const orderedAngle=a=>(Math.round(a*180/Math.PI)%360+360)%360;
const neutral=()=>({dx:0,dz:0,yaw:0,heightSteps:0});
const onFoot=p=>p.grounded && !p.activity && !p.mount && !p.vessel && !p.skiff && !p.inWater && (p.h??0)<.2;

export function createBuildEditor({dialog,game,makeViewport,bearing,save,construct,guideTree,openMaterials}){
  const p=game.state.player,world=game.state.livingWorld;
  const panel=createBuildPanel(action);
  let opened=false, busy=false, tool='new', kind='camp', ids=[], range=false, grid=true;
  let viewport,draft,delta=neutral(),pivot,center,viewYaw,quote=null,ghosts=[],notice='',activeTree=null,epoch=0;
  function initialPose(){
    const a=bearing();return {x:wrapCoord(p.x-3.7*Math.sin(a)),z:wrapCoord(p.z-3.7*Math.cos(a)),yaw:snapTurn(a),heightSteps:0};
  }
  function detach(){
    if(!opened)return;
    epoch++;opened=false;busy=false;panel.hideHelp();viewport.close();panel.shell.remove();
    delete dialog.dataset.builder;dialog.setAttribute('aria-labelledby','dialog-title');
  }
  function mount(){
    if(!dialog.open)return;
    viewport??=makeViewport();
    opened=true;delete dialog.dataset.living;dialog.dataset.builder='';
    dialog.setAttribute('aria-labelledby','build-mode-title');dialog.append(panel.shell);
    viewport.open({surface:panel.surface,center,yaw:viewYaw,onMove:moveBy,onTurn:turnBy,
      onSelect:(items,opts={})=>{if(tool==='select'||(items.length && tool==='new'))select(items,opts.additive);},
      onMoveStart:()=>{if(tool==='select' && ids.length)startMove();}});
    refresh();panel.surface.focus({preventScroll:true});
  }
  function open(preset){
    detach();tool='new';kind=Object.hasOwn(BUILD_MODULES,preset)?preset:'camp';ids=[];range=false;
    draft=initialPose();delta=neutral();center={...draft,y:terrainContactHeight(draft.x,draft.z)};viewYaw=bearing();notice='';
    mount();panel.focusKind(kind);
  }
  function select(items,additive=false){
    if(busy)return;
    if(additive){const next=new Set(ids);for(const id of items)next.has(id)?next.delete(id):next.add(id);ids=[...next];}
    else ids=[...new Set(items)];
    tool='select';notice='';refresh();
  }
  function startMove(){
    if(!ids.length)return;
    const roots=getMoveRoots(world,ids);if(!roots.length)return;
    pivot={x:roots[0].x+roots.reduce((s,r)=>s+wrapDelta(r.x-roots[0].x),0)/roots.length,
      z:roots[0].z+roots.reduce((s,r)=>s+wrapDelta(r.z-roots[0].z),0)/roots.length};
    delta={...neutral(),pivot};range=false;tool='move';notice='';refresh();
  }
  function moveBy(dx,dz){
    if(busy || !Number.isFinite(dx+dz))return;
    if(tool==='new'){
      draft={...draft,x:wrapCoord(draft.x+dx),z:wrapCoord(draft.z+dz)};
    }else if(tool==='move')delta={...delta,dx:delta.dx+dx,dz:delta.dz+dz};
    else return;
    notice='';refresh();
  }
  function turnBy(steps){
    if(busy || !Number.isFinite(steps))return;
    if(tool==='new')draft={...draft,yaw:snapTurn(draft.yaw+stepAngle*steps)};
    else if(tool==='move')delta={...delta,yaw:snapTurn(delta.yaw+stepAngle*steps)};
    else return;
    notice='';refresh();
  }
  function rootsForHeight(){
    if(tool==='new')return quote?.parentId || ['posts','wall','roof'].includes(kind)?[]:[draft];
    return getMoveRoots(world,ids).filter(s=>!ghosts.find(g=>g.id===s.id)?.parentId);
  }
  function shiftHeight(n){
    if(busy || !['new','move'].includes(tool))return;
    const roots=rootsForHeight(),offset=tool==='move'?delta.heightSteps:0;
    if(!roots.length || !roots.every(s=>(s.heightSteps??0)+offset+n>=0 && (s.heightSteps??0)+offset+n<=MAX_HEIGHT_STEPS))return;
    if(tool==='new')draft={...draft,heightSteps:draft.heightSteps+n};
    else delta={...delta,heightSteps:delta.heightSteps+n};
    notice='';refresh();
  }
  function refresh(){
    if(!opened)return;
    const options={state:game.state};
    let needWood=0,needCoins=0,title='',status='',grounds='',angle=0,height='0 m',allow=false,unpriced=false;
    activeTree=null;quote=null;ghosts=[];
    if(tool==='new'){
      const d=BUILD_MODULES[kind],site=surveySite(world,kind,draft,options);
      quote=site;
      const preflight=site.ok?constructionSite(world,kind,draft,options):site;
      needWood=d.wood+(site.foundationWood??0);needCoins=d.coins;
      allow=preflight.ok && onFoot(p);activeTree=site.treeId?timberTree(site.treeId):null;
      title=buildName(kind);
      status=preflight.reason || (onFoot(p)?'この位置に建てられます。':'地面に降りると着工できます。');
      if(site.parentId)grounds=kind==='camp'?'板床に寝床を敷きます。高さは板床に合わせます。':'板床に取り付けます。高さは板床で調整します。';
      else if(site.ok){
        grounds='高低差 '+site.relief.toFixed(2)+' m ／ うち基礎材 '+site.foundationWood+'本';
        if(kind==='stand')grounds+=' ／ '+marketLocation(site).footfall;
        if(kind==='camp')grounds+='。小屋に敷くには、枠を板床に重ねてください。';
      }else grounds='本体の費用です。土地が決まると基礎材を加えます。';
      ghosts=[{...draft,y:terrainContactHeight(draft.x,draft.z)+draft.heightSteps*HEIGHT_STEP,...site,kind,ok:allow}];
      angle=orderedAngle(ghosts[0].yaw);height=site.parentId?'板床と同じ':level(draft.heightSteps*HEIGHT_STEP)+' m';
    }else{
      const members=world.structures.filter(s=>ids.includes(s.id)),one=members[0];
      title=members.length===1?buildName(one.kind):members.length?members.length+'点を選択':'建物を選ぶ';
      if(tool==='select'){
        status=range?'画面をドラッグして、建物を囲んでください。':ids.length?'移動・回転か、撤去を選んでください。':!world.structures.length?'まず「新築する」から建物を建ててください。':'画面の建物か、一覧から選んでください。';
      }else{
        const moving=tool==='move';
        quote=moving?surveyMoveGroup(world,ids,delta,options):surveyRemoveGroup(world,ids,options);
        ghosts=moving?(quote.structures??[]).map(s=>({...s,ok:quote.ok})):[];
        needWood=quote.woodDelta??0;needCoins=quote.coinsDelta??0;allow=quote.ok;
        const count=quote.structures?.length??members.length;
        unpriced=moving && !quote.ok && needWood===0;
        const included=[...new Set((quote.structures??[]).filter(s=>!ids.includes(s.id)).map(s=>buildName(s.kind)))];
        if(moving){
          grounds=included.length?'支え合う部材も一緒に移します（計'+count+'点）。':unpriced?'移せる場所で基礎材を見積もります。':'基礎材の増減分を精算します。';
        }else{
          grounds=included.length?included.join('・')+'も含めて、計'+count+'点を撤去します。':count+'点を撤去します。';
        }
        status=quote.reason || (moving?'この位置に移せます。':'対象と、戻ってくる木材・銭を確かめてください。');
        const single=getMoveRoots(world,ids);
        const destination=single.length===1?ghosts.find(g=>g.id===single[0].id):null;
        angle=orderedAngle(destination?.yaw??((single.length===1?single[0].yaw:0)+delta.yaw));
        const offset=single.length===1?(single[0].heightSteps??0)+delta.heightSteps:delta.heightSteps;
        height=destination?.parentId?'板床と同じ':(single.length>1 && offset>=0?(offset>0?'+':'±'):'')+level(offset*HEIGHT_STEP)+' m';
      }
    }
    const roots=['new','move'].includes(tool)?rootsForHeight():[],offset=tool==='move'?delta.heightSteps:0;
    panel.update({tool,kind,ids,structures:world.structures,wood:world.wood,coins:world.wallet,needWood,needCoins,title,
      status:notice||status,grounds,unpriced,allowed:allow,grid,range,angle,height,busy,blockingTree:activeTree,
      canLower:roots.length>0 && roots.every(r=>(r.heightSteps??0)+offset>0),
      canRaise:roots.length>0 && roots.every(r=>(r.heightSteps??0)+offset<MAX_HEIGHT_STEPS)});
    viewport.update({ghosts,selectedIds:tool==='remove' && quote?.structures?quote.structures.map(s=>s.id):ids,range,grid});
  }
  function suspend(){
    center=ghosts[0]??center;viewYaw=viewport.bearing();detach();
  }
  function confirm(){
    if(busy || !quote?.ok)return;
    if(tool==='new'){
      const site=constructionSite(world,kind,draft,{state:game.state});
      if(!site.ok || !onFoot(p)){refresh();return;}
      busy=true;notice='普請の支度をしています。';refresh();
      const key=epoch;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(!opened || epoch!==key || !dialog.open)return;
        const where={...draft,entryBay:site.entryBay},which=kind;
        suspend();
        construct({...site,kind:which,structures:world.structures},exit=>{
          const result=finishConstruction(world,which,where,game.state,exit);
          if(result.ok)save();
          return result;
        },result=>{
          notice=result.message||result.reason;
          if(result.ok){
            tool='select';center=result.structure;
            ids=which==='hut'?world.structures.filter(s=>s.id===center.id || s.parentId===center.id).map(s=>s.id):[center.id];
          }
          mount();
        });
      }));
      return;
    }
    const result=tool==='move'?moveStructureGroup(world,ids,delta,{state:game.state}):removeStructureGroup(world,ids,{state:game.state});
    notice=result.message||result.reason;
    if(result.ok){save();if(tool==='remove')ids=[];tool='select';delta=neutral();}
    refresh();
  }
  function action(name,value){
    if(!opened || busy && name!=='close')return;
    if(name==='kind'||name==='new'){
      const from=tool;tool='new';ids=[];range=false;if(name==='kind')kind=value;
      if(from!=='new')draft=initialPose();
      if(['posts','roof','wall'].includes(kind))draft.heightSteps=0;
      notice='';refresh();return;
    }
    if(name==='manage'){range=false;select(ids);return;}
    if(name==='pick'){
      const target=world.structures.find(s=>s.id===value);if(!target)return;
      select([value]);center=target;viewport.focus(target);return;
    }
    if(name==='close'){detach();dialog.close();return;}
    if(name==='materials'){detach();openMaterials();return;}
    if(name==='move'){startMove();return;}
    if(name==='remove' && ids.length){tool='remove';range=false;notice='';refresh();return;}
    if(name==='cancel'){tool='select';range=false;delta=neutral();notice='';refresh();return;}
    if(name==='confirm'){confirm();return;}
    if(name==='grid'){grid=!grid;refresh();return;}
    if(name==='range'){range=!range;notice='';refresh();return;}
    if(name==='lower'||name==='raise'){shiftHeight(name==='raise'?1:-1);return;}
    if(name==='turn-left'||name==='turn-right'){turnBy(name==='turn-right'?1:-1);return;}
    if(name==='mark-tree' && activeTree){
      const tree=activeTree;
      detach();guideTree(tree);
    }
  }
  function keydown(e){
    if(!opened || e.isComposing||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('select,input,textarea'))return;
    const key=e.key;
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','q','Q','e','E','Escape','Delete'].includes(key))return;
    e.preventDefault();e.stopPropagation();
    if(busy)return;
    if(key==='Escape'){if(panel.hideHelp())return;action(['move','remove'].includes(tool)?'cancel':'close');return;}
    if(key==='Delete'){if(tool==='select')action('remove');return;}
    if(tool==='select' && ids.length)startMove();
    if(key.toLowerCase()==='q'||key.toLowerCase()==='e'){turnBy(key.toLowerCase()==='e'?1:-1);return;}
    if(e.shiftKey&&(key==='ArrowUp'||key==='ArrowDown')){shiftHeight(key==='ArrowUp'?1:-1);return;}
    const a=viewport.bearing(),side=key==='ArrowRight'?.5:key==='ArrowLeft'?-.5:0,forward=key==='ArrowUp'?.5:key==='ArrowDown'?-.5:0;
    moveBy(side*Math.cos(a)-forward*Math.sin(a),-side*Math.sin(a)-forward*Math.cos(a));
  }
  panel.shell.addEventListener('keydown',keydown);
  return {open,close:detach,resize:()=>{if(opened)viewport.resize();},get active(){return opened;}};
}
