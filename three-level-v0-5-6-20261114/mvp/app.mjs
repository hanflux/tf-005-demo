import {LEVELS,getLevel,sprites,selections} from './levels.mjs';
import {createState,take,blocked,count,unlockHelp} from './core.mjs';
import {GameAudio} from './audio.mjs';
import {containerHTML,lockedPlaceholderHTML,finishedPlaceholderHTML} from './containers.mjs';
import {fitLayout} from './scene-layout.mjs';
import {livingFrame} from './living-layout.mjs';
import {spritePath,scenePath,sceneFrame,requiredAssets} from './scene-art.mjs';
import {pocketFor,inPocket,distanceToAlpha} from './hit-policy.mjs';
import {AssetLoader} from './asset-loader.mjs';
import {readBest,saveBest} from './route-records.mjs';
import {rateRoute,starBudget,readStars,saveStars} from './stars.mjs';
const $=s=>document.querySelector(s),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let entered=false;
let level=LEVELS[0],state=createState(level),busy=false,epoch=0,ready=false,lastHit=null,pendingResult=false,viewingRoom=false;
const masks=new Map(),completed=new Map(),audio=new GameAudio(),assets=new AssetLoader();
let assetEpoch=0,assetKey='',assetController=null,assetState='loading',assetError='',assetPaths=[];const assetWaiters=new Set();
const inputTracing=new URLSearchParams(location.search).has('qa-input'),inputLog=[];
let inputQueue=[],pendingIds=new Set(),activeId=null,runStores=0,runPeak=0,routeResult=null;
let viewLayout={},binView=null,helpToken=null,starResult=null;
const menuWaiters=new Set();
const l1Animations=new Set();let l1SoundEpoch=0;
window.addEventListener('blur',()=>{l1SoundEpoch++;helpToken=null;if($('#help-dialog').open)$('#help-dialog').close();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){l1SoundEpoch++;helpToken=null;if($('#help-dialog').open)$('#help-dialog').close();}});
const GUIDE_KEY='ssjwl-guide-v1';let guideDone=false;try{guideDone=localStorage.getItem(GUIDE_KEY)==='done';}catch{}
let guide={active:false,stage:'tap',started:0},guideTimer=null;
function endGuide(){guide.active=false;guideDone=true;try{localStorage.setItem(GUIDE_KEY,'done');}catch{}clearTimeout(guideTimer);refreshGuide();}
function beginGuide(){clearTimeout(guideTimer);guide={active:entered&&level.id==='l1'&&!guideDone,stage:'tap',started:performance.now()};if(guide.active){const token=epoch;guideTimer=setTimeout(()=>{if(epoch===token)refreshGuide();},8100);}refreshGuide();}
function refreshGuide(){
 if(guide.active&&((state.moves>=3&&performance.now()-guide.started>=8000)||state.moves>=6||state.phase!=='playing')){endGuide();return;}
 const on=guide.active&&entered&&level.id==='l1';$('#guide-copy').hidden=!on;$('#later').hidden=on;$('#guide-skip').hidden=!on;document.querySelectorAll('.guide-focus').forEach(x=>x.classList.remove('guide-focus'));if(!on)return;
 $('#guide-copy').textContent=guide.stage==='store'?'暂存格有限，先收当前分类':guide.stage==='sort'?'同类进箱，其余先放暂存格':'轻点露出的物品，自动归类';
 if(guide.stage==='store')$('.storage').classList.add('guide-focus');else if(guide.stage==='sort')$('#bins').classList.add('guide-focus');else{const item=level.items.find(i=>state.locations[i.id]==='board'&&!blocked(level,state,i.id).length&&state.active.includes(i.category));if(item)$('#'+item.id)?.classList.add('guide-focus');}
}
function guideEvent(type){if(guide.active&&['sort','store'].includes(type))guide.stage=type;refreshGuide();}
function maybeIntro(){if(entered&&ready)audio.narrate('intro','intro',epoch);}
function enterGame(){if(entered)return;void audio.activate();entered=true;document.documentElement.classList.remove('before-entry');$('#entry').hidden=true;setTimeout(()=>{$('#game').inert=false;$('#level-title').focus({preventScroll:true});},220);try{const target=new URL('./',document.baseURI);const base=document.querySelector('base');if(base)base.href=target.href;if(!location.pathname.endsWith('/mvp/'))history.replaceState(null,'',target.pathname+location.search+location.hash);}catch{}applyLayout();renderBins();beginGuide();maybeIntro();traceInput('entered-room',{moves:state.moves});}
function playCue(kind){return audio.play(kind,'l1-feedback');}
function landingContact(id,kind,token,flight){
 if(token!==epoch)return;
 const contactAt=performance.now(),allowed=flight?.soundEpoch===l1SoundEpoch;
 const sound=allowed?playCue(kind):{played:false};
 traceInput('landing-contact',{id,target:kind==='store'?'tray':'mouth',contactAt,durationMs:flight?.durationMs||0,sound,suppressedByBackground:!allowed});
}
function receiverRebound(id,el,token,tray=false){
 if(!el||token!==epoch||reduced)return;
 const frames=tray?[{transform:'scale(.94)',filter:'drop-shadow(0 0 1px #e2bb7180)'},{offset:.45,transform:'scale(1.06)',filter:'drop-shadow(0 0 2px #e2bb7160)'},{transform:'scale(1)',filter:'none'}]:[{transform:'scale(1,.97)',filter:'drop-shadow(0 0 1px #e2bb7180)'},{offset:.45,transform:'scale(1.018,1.025)',filter:'drop-shadow(0 0 2px #e2bb7160)'},{transform:'scale(1)',filter:'none'}];
 traceInput('receiver-rebound-start',{id,target:tray?'tray':'mouth',durationMs:180});
 void animateElement(el,frames,180,token).then(()=>traceInput(token===epoch?'receiver-rebound-ended':'receiver-rebound-cancelled',{id,originEpoch:token}));
}
function resumeQueue(){if(!document.querySelector('dialog[open]')){for(const done of menuWaiters)done();menuWaiters.clear();}}
async function waitForMenus(token){if(token===epoch&&document.querySelector('dialog[open]'))await new Promise(done=>menuWaiters.add(done));}
function applyLayout(){const board=$('#board'),r=board.getBoundingClientRect();viewLayout=fitLayout(level,r.width,r.height);for(const [id,p] of Object.entries(viewLayout)){const e=$('#'+id);if(e){e.style.left=p.x+'px';e.style.top=p.y+'px';e.style.width=p.size+'px';e.style.zIndex=p.z;e.firstElementChild.style.transform=`rotate(${p.angle}deg)`;}}if(level.id!=='l1'){const f=sceneFrame(r.width,r.height);const plate=$('#scene-plate');plate.style.left=f.x+'px';plate.style.width=f.width+'px';const top=level.id==='l3'?520:460;plate.style.borderTopWidth=(top/971*f.width)+'px';plate.style.borderImageSlice=top+' 0 170 fill';plate.style.borderBottomWidth=(170/971*f.width)+'px';plate.style.borderImageSource=`url(${scenePath(level)})`;plate.classList.toggle('wide',f.wide);plate.style.backgroundImage=f.wide?`url(${scenePath(level,true)})`:'none';}else{const f=livingFrame(r.width,r.height),plate=$('#living-floor');plate.style.borderTopWidth=f.top+'px';plate.style.borderBottomWidth=f.bottom+'px';plate.style.borderImageSlice=(f.wide?'460':'620')+' 0 100 fill';plate.style.borderImageSource=`url(${f.src})`;$('#room-image').src=f.src;}$('#feedback').style.top=matchMedia('(orientation:landscape) and (min-width:600px) and (max-height:600px)').matches?'8px':($('.hud').getBoundingClientRect().bottom-$('main').getBoundingClientRect().top+8)+'px';ensureCurrentAssets();}
function renderBins(s=state){binView=s;$('#progress').textContent=`${Object.values(s.locations).filter(x=>x==='sorted').length} / ${level.items.length} 已归位`;$('#later').textContent=level.categories.slice(s.next).map(c=>`接着 · ${c.name}`).join(' → ')||'每件物品，都回到它的位置';$('#pressure').textContent=`暂存 ${s.buffer.length}/${level.capacity}`;const active=s.phase==='won'?level.categories.slice(s.helpUnlocked?-3:-2).map(c=>c.id):s.active;$('#bins').innerHTML=active.map((id,n)=>{const c=level.categories.find(c=>c.id===id),total=level.items.filter(i=>i.category===id).length;return containerHTML(level,c,count(level,s,id),total,`bin-${epoch}-${n}`);}).join('')+(s.helpUnlocked?Array.from({length:Math.max(0,3-active.length)},()=>finishedPlaceholderHTML()).join(''):Array.from({length:Math.max(0,2-active.length)},()=>finishedPlaceholderHTML(false)).join('')+lockedPlaceholderHTML(entered&&ready&&!busy&&s.phase==='playing'&&s.next<level.categories.length));}

function localRecords(){try{return window.localStorage;}catch{return null;}}
function levelDescription(l){const stars=readStars(l,false,localRecords()),helpStars=readStars(l,true,localRecords());const best=l.routeGoal?readBest(l,localRecords()).best:null;return `${l.items.length}件 · ${completed.has(l.id)?'本次已收好':'等你来收'} · 免费最佳${stars?'★'.repeat(stars):'未记录'} · 帮助最佳${helpStars?'★'.repeat(helpStars):'未记录'}${l.routeGoal?` · 可选${l.routeGoal.targetPeak}格目标${best!==null?` · 本机最佳${best}格`:''}`:''}`;}
function traceInput(kind,detail={}){
 if(!inputTracing)return;
 inputLog.push({t:performance.now(),kind,...detail,busy,epoch,level:level.id,moves:state.moves,phase:state.phase,buffer:[...state.buffer],queue:[...inputQueue]});
 if(inputLog.length>4000)inputLog.shift();
}
const image=id=>`<img src="${spritePath(id,level)}" alt="" draggable="false">`,name=id=>level.items.find(i=>i.id===id)?.name||id,categoryName=id=>level.categories.find(c=>c.id===id)?.name||id;
function syncAssetGate(){
 const gate=$('#resource-gate');$('main').dataset.loadState=assetState;gate.hidden=ready;$('#board').inert=!ready;$('#board').setAttribute('aria-busy',String(!ready||busy));
 $('#resource-message').textContent=assetState==='error'?'这个角落的图片没准备好，请再试一次。':`正在准备${level.name}…`;
 $('#resource-retry').hidden=assetState!=='error';
}
function releaseAssetWaiters(){for(const done of assetWaiters)done();assetWaiters.clear();}
async function waitForAssets(token){if(token===epoch&&!ready)await new Promise(done=>assetWaiters.add(done));}
function ensureCurrentAssets(force=false){
 const r=$('.room').getBoundingClientRect(),wide=r.width>r.height,paths=requiredAssets(level,wide),key=level.id+':'+wide;
 if(!force&&key===assetKey)return;
 assetKey=key;assetController?.abort();const controller=new AbortController();assetController=controller;const token=++assetEpoch,gameToken=epoch,selected=level;
 assetPaths=paths;ready=false;assetState='loading';assetError='';syncAssetGate();traceInput('assets-loading',{assetEpoch:token,paths:[...paths]});
 void (async()=>{
  try{
   const decoded=await Promise.all(paths.map(async path=>[path,await assets.image(path,controller.signal)]));
   if(token!==assetEpoch||gameToken!==epoch)return;
   for(const [path,img] of decoded){if(!selected.items.some(i=>spritePath(i.id,selected)===path)||masks.has(path))continue;const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,128,128);masks.set(path,ctx.getImageData(0,0,128,128).data);}
   await Promise.all([...document.querySelectorAll('#board img,.container-art')].map(img=>img.decode()));
   if(token!==assetEpoch||gameToken!==epoch||controller.signal.aborted)return;
   ready=true;assetState='ready';maybeIntro();syncAssetGate();renderBins();releaseAssetWaiters();traceInput('assets-ready',{assetEpoch:token});
  }catch(error){
   if(token!==assetEpoch||gameToken!==epoch||error.name==='AbortError')return;
   controller.abort();ready=false;assetState='error';assetError=String(error.message);syncAssetGate();traceInput('assets-error',{assetEpoch:token,error:assetError});
  }
 })();
}

function describe(entry){const e=entry.events[0],n=name(entry.id);let text=e.type==='blocked'?`${n}被${e.blockers.map(name).join('、')}压住`:e.type==='store'?`${n}放进暂存`:e.type==='sort'?`${n}归入${categoryName(level.items.find(i=>i.id===entry.id).category)}`:`${n}放不下：暂存已满`;
 const drained=entry.events.filter(e=>e.type==='drain');if(drained.length)text+=`；${drained.map(e=>name(e.id)).join('、')}自动归位，腾出${drained.length}格`;const opened=entry.events.filter(e=>e.type==='open');if(opened.length&&!drained.length)text+=`；${opened.map(e=>categoryName(e.category)).join('、')}打开了`;return text;}
function historyHTML(detail=false){return state.history.map(e=>`<li><span class="step">${e.step}</span><span>${describe(e)}${detail?`<small>暂存 ${e.before.buffer.length} → ${e.after.buffer.length} / ${level.capacity} · 当前：${e.after.buffer.map(name).join('、')||'空'}</small>`:''}</span></li>`).join('')||'<li>还没收第一件，慢慢来。</li>';}
function trayHTML(s){return Array.from({length:level.capacity},(_,i)=>{const id=s.buffer[i];return `<div class="slot ${id?'full':''}" data-slot="${i}" role="img" aria-label="暂存${i+1}：${id?name(id):'空位'}">${id?image(id):i+1}</div>`;}).join('');}
function renderCapacityCopy(){const word=level.capacity===5?'五':'三';$('.storage').setAttribute('aria-label',word+'个暂存位置');$('#rules-capacity').textContent=`点物件即可自动分类，开放的两只箱子会直接接走它；还没有箱子的物件先放在${word}个暂存位。`;$('#rules-overflow').textContent=`新分类开放后，会自动接走匹配的暂存物。${word}个格子放满仍可继续收当前分类，第${level.capacity+1}件不匹配的物件放不下，这局就结束了。`;$('#rules-locked').hidden=false;$('#rules-locked').textContent='第三箱可自选测试帮助，不播放广告：提前开放下一分类，本局持续换类与自动回流，重开还原。不增加暂存格。';const b=starBudget(level);$('#rules-stars').textContent=`本关三星：最高暂存≤${b.three}格且共暂存≤${b.stores}件；二星≤${b.two}格且≤${b.stores+1}件；其余通关一星。不计时，不惩罚点错遮挡物。免费与帮助成绩分开保存。`;}
function render(){
 $('main').dataset.hudLevel=level.id;renderCapacityCopy();
 $('#level-title').textContent=level.name;$('#level-number').textContent=`${LEVELS.indexOf(level)+1} / 3`;$('#session-progress').textContent=`本次完成 ${completed.size} / 3`;
 $('.room').dataset.scene=level.scene;if(level.id==='l1')$('#room-image').src=scenePath(level,$('.room').clientWidth>$('.room').clientHeight);else $('#room-image').removeAttribute('src');$('#room-image').alt=level.name+'场景';$('.room').setAttribute('aria-label',level.name);$('.wall-note').textContent=level.scene==='desk'?'今天到这里 ✓':'下一站，新家';$('.desk-keepsakes').innerHTML=(level.artOverrides?['t1','t2','c1']:['d1','d2']).map(image).join('');
 $('#progress').textContent=`${Object.values(state.locations).filter(x=>x==='sorted').length} / ${level.items.length} 已归位`;
 renderBins();
 $('#later').textContent=level.categories.slice(state.next).map(c=>`接着 · ${c.name}`).join('  →  ')||'每件物品，都回到它的位置';
 $('#board').innerHTML=level.items.filter(i=>state.locations[i.id]==='board').map(i=>{const p=level.layout[i.id],covers=blocked(level,state,i.id);return `<button id="${i.id}" class="prop ${covers.length?'blocked':''}${pendingIds.has(i.id)&&activeId!==i.id?' queued':''}" style="left:${p.x/360*100}%;top:${p.y/456*100}%;width:${p.size/360*100}%;aspect-ratio:1;z-index:${p.z}" aria-label="${i.name}${covers.length?'，被'+covers.map(name).join('、')+'压住':''}">${image(i.id)}</button>`;}).join('');
 for(const i of level.items){const e=$('#'+i.id);if(e){e.firstElementChild.style.transform=`rotate(${level.layout[i.id].angle}deg)`;e.firstElementChild.style.transformOrigin='50% 92%';}}
 $('#tray').innerHTML=trayHTML(state);
 $('#pressure').textContent=`暂存 ${state.buffer.length}/${level.capacity}`;$('.storage').classList.toggle('danger',state.buffer.length===level.capacity);$('.room').classList.toggle('tidy',state.phase==='won');$('#board').setAttribute('aria-busy',String(!ready||busy));if($('#history-dialog').open)$('#history-detail').innerHTML=`<ol>${historyHTML(true)}</ol>`;applyLayout();refreshGuide();
}
function alphaAt(id,x,y){
 const el=$('#'+id),mask=masks.get(spritePath(id,level));if(!el||!mask)return 0;
 const r=el.getBoundingClientRect(),cx=r.x+r.width*.5,cy=r.y+r.height*.92;
 const a=-viewLayout[id].angle*Math.PI/180,dx=x-cx,dy=y-cy;
 let u=(dx*Math.cos(a)-dy*Math.sin(a)+r.width*.5)/r.width;
 let v=(dx*Math.sin(a)+dy*Math.cos(a)+r.height*.92)/r.height;
 if(u<0||u>=1||v<0||v>=1)return 0;return mask[(Math.floor(v*128)*128+Math.floor(u*128))*4+3];
}
function hitDetail(x,y){
 const order=level.items.filter(i=>state.locations[i.id]==='board'&&$('#'+i.id)?.style.visibility!=='hidden').sort((a,b)=>viewLayout[b.id].z-viewLayout[a.id].z);
 const solid=order.find(i=>alphaAt(i.id,x,y)>=64);
 // A pocket can disambiguate its own explicitly blocked lower object, never an
 // unrelated solid object, nor anything above it. Only explicitly authored illustration holes participate.
 for(const i of order){
  if(i===solid)break;
  const pocket=pocketFor(level.id,i.id);if(!pocket||(solid&&!solid.blockedBy.includes(i.id)))continue;
  const el=$('#'+i.id),r=el.getBoundingClientRect(),a=-viewLayout[i.id].angle*Math.PI/180,dx=x-r.x-r.width*.5,dy=y-r.y-r.height*.92;
  const u=(dx*Math.cos(a)-dy*Math.sin(a)+r.width*.5)/r.width,v=(dx*Math.sin(a)+dy*Math.cos(a)+r.height*.92)/r.height;
  if(u<0||u>=1||v<0||v>=1)continue;
  const limit=inPocket(level.id,i.id,u,v)?pocket.maxDistance:solid?3:0;
  if(!limit)continue;
  const distance=distanceToAlpha(masks.get(spritePath(i.id,level)),u,v,r.width,limit);
  if(Number.isFinite(distance))return {id:i.id,kind:limit===3?'cover-edge':'semantic-pocket',distance,underlying:solid?.id||null};
 }
 if(solid)return {id:solid.id,kind:'solid',distance:0};
 // Original <=6 CSS-pixel contour forgiveness, unchanged outside authored inner pockets.
 let best=null,dist=Infinity;
 for(const i of order)for(const [dx,dy] of [[3,0],[-3,0],[0,3],[0,-3],[6,0],[-6,0],[0,6],[0,-6],[4,4],[-4,4],[4,-4],[-4,-4]]){
  const d=dx*dx+dy*dy;if(d<dist&&alphaAt(i.id,x+dx,y+dy)>=128){best=i.id;dist=d;}
 }
 return best?{id:best,kind:'contour',distance:Math.sqrt(dist)}:{id:null,kind:'rejected',distance:null};
}
function resolveHit(x,y){return hitDetail(x,y).id;}

function pointFor(id){
 const e=$('#'+id);if(!e)return null;const r=e.getBoundingClientRect(),clip=$('.room-viewport')?.getBoundingClientRect()||$('#board').getBoundingClientRect();let best=null,score=-1;
 const left=Math.max(r.left,clip.left,0),right=Math.min(r.right,clip.right,innerWidth),top=Math.max(r.top,clip.top,0),bottom=Math.min(r.bottom,clip.bottom,innerHeight);
 // QA target coordinates use the same integer CSS grid as synthesized click.
 for(let y=Math.ceil(top);y<bottom;y+=3)for(let x=Math.ceil(left);x<right;x+=3){
  if(alphaAt(id,x,y)<192||resolveHit(x,y)!==id||!document.elementFromPoint(x,y)?.closest('#board'))continue;
  let n=0;for(const [dx,dy] of [[-5,0],[5,0],[0,5],[0,-5],[-3,-3],[3,3]])if(resolveHit(x+dx,y+dy)===id)n++;
  const v=n*100-Math.hypot(x-r.x-r.width/2,y-r.y-r.height/2);if(v>score){score=v;best={x,y};}
 }return best;
}
function pick(id){
 traceInput('request',{id});
 if(!entered||!ready||state.phase!=='playing'||document.querySelector('dialog[open]')){traceInput('rejected',{id,reason:!ready?'not-ready':'ended'});return;}
 if(pendingIds.has(id)||state.locations[id]!=='board'){traceInput('rejected',{id,reason:pendingIds.has(id)?'duplicate-pending':'not-on-board'});return;}
 void audio.activate();pendingIds.add(id);inputQueue.push(id);traceInput('queued',{id});
 $('#'+id)?.classList.add('queued');traceInput('queue-ack',{id});
 if(busy){$('#feedback').textContent=`${name(id)}已排好，接着收。`;return;}
 busy=true;$('#board').setAttribute('aria-busy','true');void drainInputs(epoch);
}
async function drainInputs(token){
 while(token===epoch&&inputQueue.length&&state.phase==='playing'){
  do{await waitForMenus(token);await waitForAssets(token);}while(token===epoch&&(!ready||document.querySelector('dialog[open]')));if(token!==epoch)return;
  const id=inputQueue.shift();activeId=id;$('#'+id)?.classList.remove('queued');
  // A preceding category completion may already have moved a queued item.
  if(state.locations[id]!=='board'){traceInput('cancelled',{id,reason:'no-longer-on-board'});pendingIds.delete(id);continue;}
  await performPick(id,token);
  if(token!==epoch)return;
  pendingIds.delete(id);activeId=null;
 }
 if(token!==epoch)return;
 if(inputQueue.length)traceInput('cancelled',{ids:[...inputQueue],reason:'game-ended'});
 inputQueue=[];pendingIds.clear();activeId=null;busy=false;const helpButton=$('button.locked-placeholder');if(helpButton)helpButton.disabled=!entered||!ready||state.phase!=='playing'||state.next>=level.categories.length;document.querySelectorAll('.prop.queued').forEach(el=>el.classList.remove('queued'));$('#board').setAttribute('aria-busy',String(!ready));traceInput('idle');
}
async function performPick(id,token){
 lastHit=id;const next=take(level,state,id),event=next.events[0];
 if(!event){traceInput('rejected',{id,reason:'no-event'});return;}
 traceInput('accepted',{id,event:event.type});
 if(event.type==='blocked'){state=next;render();$('#feedback').textContent=describe(next.history.at(-1));playCue('warning');for(const cover of event.blockers){const e=$('#'+cover);e?.classList.add('highlight');if(e)setTimeout(()=>e.classList.remove('highlight'),1800);}traceInput('committed',{id,event:event.type});return;}
 if(event.type==='overflow'){state=next;runPeak=Math.max(runPeak,state.buffer.length);render();void animateElement($('.storage'),[{transform:'translateX(0)'},{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],180,token);playCue('warning');traceInput('committed',{id,event:event.type});finish();return;}
 const source=$('#'+id),category=level.items.find(i=>i.id===id).category;
 const target=event.type==='store'?$(`[data-slot="${state.buffer.length}"]`):$(`[data-category="${category}"] .bin-mouth`);
 $('#feedback').textContent=event.type==='store'?`${name(id)}先放这里，留意${level.capacity}个暂存位。`:`${name(id)}归位！`;
 const flight=await fly(id,source,target,token,viewLayout[id].angle,event.type==='sort');
 if(token!==epoch)return;
 landingContact(id,event.type==='store'?'store':'sort',token,flight);
 await animateSettlement(next,id,event,token);

 if(token!==epoch)return;
 state=next;if(event.type==='store')runStores++;runPeak=Math.max(runPeak,state.buffer.length);render();guideEvent(event.type);const receiver=event.type==='store'?$(`[data-slot="${state.buffer.indexOf(id)}"]`):$(`[data-category="${category}"] .container-art`);if(event.type==='store'||count(level,state,category)<level.items.filter(i=>i.category===category).length)receiverRebound(id,event.type==='store'?receiver?.querySelector('img'):receiver,token,event.type==='store');traceInput('committed',{id,event:event.type});$('#feedback').textContent=describe(state.history.at(-1));if(state.phase!=='playing')finish();
}

async function animateElement(el,frames,duration,token,easing='cubic-bezier(.2,.7,.2,1)'){if(reduced||!el||token!==epoch)return;const anim=el.animate(frames,{duration,easing,fill:'forwards'});const scoped=true;if(scoped)l1Animations.add(anim);try{await anim.finished;}catch{}finally{if(scoped)l1Animations.delete(anim);}if(token===epoch)anim.cancel();}
async function fly(id,source,target,token,angle=0,intoMouth=true){
 const soundEpoch=l1SoundEpoch;
 if(reduced||!source||!target){traceInput('flight-skipped',{id,reduced,durationMs:0});return {soundEpoch,durationMs:0};}
 const duration=650,started=performance.now(),originLevel=level.id;
 const start=source.getBoundingClientRect(),end=target.getBoundingClientRect();
 const ghost=document.createElement('div');ghost.className='ghost';ghost.dataset.item=id;ghost.dataset.destination=intoMouth?'mouth':'tray';ghost.innerHTML=image(id);
 Object.assign(ghost.style,{left:start.x+'px',top:start.y+'px',width:start.width+'px',height:start.height+'px'});document.body.append(ghost);source.style.visibility='hidden';
 if(angle){ghost.firstElementChild.style.transformOrigin='50% 92%';void animateElement(ghost.firstElementChild,[{transform:`rotate(${angle}deg)`},{offset:.16,transform:`rotate(${angle*.7}deg)`},{offset:.68,transform:`rotate(${angle*.15}deg)`},{transform:'rotate(0deg)'}],duration,token,'linear');}
 const dx=end.x+end.width/2-start.x-start.width/2,dy=end.y+end.height/2-start.y-start.height/2;
 traceInput('flight',{id,durationMs:duration,sourceHidden:source.style.visibility==='hidden',to:intoMouth?'mouth':'tray',destination:{x:end.x+end.width/2,y:end.y+end.height/2},source:{x:start.x,y:start.y,width:start.width,height:start.height}});
 const rise=Math.min(12,Math.abs(dy)*.12),arc=Math.min(24,Math.abs(dy)*.12),near=Math.min(12,Math.abs(dy)*.08);
 const trayScale=Math.min(1,(parseFloat(getComputedStyle(target).getPropertyValue('--tray-icon-size'))||34)/start.width),frames=[{transform:`translate(0,0) rotate(0deg) scale(.97)`,opacity:1,easing:'ease-out'},{offset:.16,transform:`translate(${dx*.035}px,${-rise}px) rotate(0deg) scale(1.04)`,opacity:1,easing:'cubic-bezier(.32,.02,.45,1)'},{offset:.68,transform:`translate(${dx*.78}px,${dy*.7-arc}px) rotate(0deg) scale(.68)`,opacity:1,easing:'ease-out'},{offset:.88,transform:`translate(${dx*.98}px,${dy-near}px) rotate(0deg) scale(${intoMouth ? .38 : Math.max(.42,trayScale)})`,opacity:1,easing:'ease-in'},{transform:`translate(${dx}px,${dy+(intoMouth?3:0)}px) rotate(0deg) scale(${intoMouth ? .16 : trayScale})`,opacity:intoMouth?0:1}];
 await animateElement(ghost,frames,duration,token,'linear');ghost.remove();
 traceInput(token===epoch?'flight-ended':'flight-cancelled',{id,originLevel,originEpoch:token,durationMs:duration,elapsedMs:performance.now()-started});
 return {soundEpoch,durationMs:duration};
}
async function animateSettlement(next,id,event,token){
 const view=structuredClone(state);if(event.type==='help'){view.helpUnlocked=true;view.active.push(event.category);view.next++;}else{view.locations[id]=event.type==='store'?'buffer':'sorted';if(event.type==='store')view.buffer.push(id);}
 renderBins(view);
 const finished=new Set();
 async function finishBin(category){const el=$(`[data-category="${category}"]`);if(!el)return;el.dataset.state='full';el.querySelector('.bin-count').textContent=`${count(level,view,category)} / ${level.items.filter(i=>i.category===category).length}`;traceInput('container-full',{category});audio.narrate('box','box:'+category,token);if(level.id==='l1')void animateElement(el.querySelector('.container-art'),[{filter:'none'},{filter:'drop-shadow(0 0 2px #e2bb7180)'},{filter:'none'}],190,token);await animateElement(el,[{transform:'scale(1)'},{transform:'scale(1.045)'},{transform:'scale(1)'}],190,token);finished.add(category);}
 for(const e of next.events.slice(1)){
  if(token!==epoch)return;
  if(e.type==='open'){
   const old=view.active.find(c=>count(level,view,c)===level.items.filter(i=>i.category===c).length);if(!old)continue;
   await finishBin(old);if(token!==epoch)return;
   await animateElement($(`[data-category="${old}"]`),[{transform:'translateY(0)',opacity:1},{transform:'translateY(-15px)',opacity:0}],120,token);if(token!==epoch)return;
   view.active[view.active.indexOf(old)]=e.category;view.next++;renderBins(view);traceInput('container-enter',{category:e.category,replaces:old});
   await animateElement($(`[data-category="${e.category}"]`),[{transform:'translateY(12px)',opacity:0},{transform:'translateY(0)',opacity:1}],140,token);
  }else if(e.type==='drain'){
   const slot=view.buffer.indexOf(e.id),category=level.items.find(i=>i.id===e.id).category;
   const flight=await fly(e.id,$(`[data-slot="${slot}"] img`),$(`[data-category="${category}"] .bin-mouth`),token,0,true);if(token!==epoch)return;landingContact(e.id,'sort',token,flight);
   view.buffer.splice(slot,1);view.locations[e.id]='sorted';renderBins(view);
   $('#tray').innerHTML=trayHTML(view);
   receiverRebound(e.id,$(`[data-category="${category}"] .container-art`),token);
   traceInput('buffer-drained',{id:e.id,category,remaining:[...view.buffer]});
  }
 }
 for(const c of view.active)if(!finished.has(c)&&count(level,view,c)===level.items.filter(i=>i.category===c).length){await finishBin(c);if(token!==epoch)return;}
}

function finish(){const win=state.phase==='won';if(!win)audio.stopVoice('failed');if(win){starResult={...rateRoute(level,runPeak,runStores),help:!!state.helpUnlocked,...saveStars(level,!!state.helpUnlocked,rateRoute(level,runPeak,runStores).stars,localRecords())};completed.set(level.id,{moves:state.moves,attempts:state.attempts,peak:runPeak,stars:starResult.stars,help:starResult.help});if(level.routeGoal&&!state.helpUnlocked)routeResult=saveBest(level,runPeak,localRecords());playCue('victory');audio.narrate('win','win',epoch);$('#session-progress').textContent=`本次完成 ${completed.size} / 3`;if($('#levels-dialog').open)refreshLevelCompletion();}
 $('#result-kicker').textContent=level.name;$('#result-title').textContent=win?'收好啦，舒服了！':'先缓一缓，位置满了';
 const last=state.history.at(-1);$('#result-message').textContent=win?`${level.items.length}件都归位了。这一角，清清爽爽。`:`${name(last.id)}属于${categoryName(level.items.find(i=>i.id===last.id).category)}，现在没有对应箱子。${level.capacity}格暂存已满，放不下第${level.capacity+1}件；它仍留在房间。`;
 renderRouteResult(win);$('#star-results').hidden=!win;$('#star-results').textContent=win?`${'★'.repeat(starResult.stars)}${'☆'.repeat(3-starResult.stars)} · ${starResult.stars}星\n${starResult.reason}\n${starResult.help?'测试帮助路线':'免费路线'} · ${starResult.saved?`本机最佳${starResult.best}星`:'本机保存不可用'}（两类分开记录）`:'';
 $('#result').dataset.outcome=win?'won':'lost';$('#failure-review').hidden=win;$('#failure-review').open=false;
 $('#failure-review').innerHTML=win?'':`<summary>回顾最近5步</summary><div class="review-scroll" tabindex="0" role="region" aria-label="失败前的最近五步"><p>暂存里：${state.buffer.map(name).join('、')}。</p><ol>${historyHTML(true)}</ol><p>试着先完成当前一箱，让新分类接走暂存。免费重开可以换一条路线。</p></div>`;
 $('#next').hidden=!win;$('#next').textContent=completed.size===3?'看看今天的成果':LEVELS.indexOf(level)<2?'下一关':'去收还没完成的角落';$('#tidy-next').textContent=$('#next').textContent;
 viewingRoom=win;if(viewingRoom)$('#feedback').textContent='';$('#result-room').hidden=!viewingRoom;pendingResult=!viewingRoom;syncTidyActions();showPendingResult();traceInput('completion-presentation',{roomFirst:viewingRoom});}
function renderRouteResult(win){
 const box=$('#route-results');box.hidden=!level.routeGoal||!win||!!state.helpUnlocked;box.replaceChildren();if(box.hidden)return;
 const goal=level.routeGoal,record=routeResult,done=runPeak<=goal.targetPeak;
 const status=record.saved?(record.first?'本机首次记录':record.improved?'比上次更省位置了':'本机最佳继续保留'):'本次已记下，浏览器未能保存';
 const title=document.createElement('b');title.textContent=done?'轻装收桌，达成了':'这一桌，也收得好';box.append(title);
 const beforeAfter=document.createElement('p');beforeAfter.className='route-before-after';beforeAfter.textContent=`整理前 ${level.items.length}件散落 → 整理后 全部归位`;box.append(beforeAfter);
 const peak=document.createElement('p');peak.className='route-peak';peak.textContent=`本次最高暂存 ${runPeak} / ${level.capacity} 格`;box.append(peak);
 const best=document.createElement('p');best.id='route-best';best.textContent=record.saved?`本机最佳 ${record.best} 格 · ${status}`:`${status}${record.previous!==null?`；原记录 ${record.previous} 格`:'，仅供这次查看'}`;box.append(best);
 const optional=document.createElement('p');optional.textContent=done?`可选目标已完成：不超过${goal.targetPeak}格。想换条路线也可以。`:`可选挑战：${goal.text}。不影响通关，不用赶时间。`;box.append(optional);
 const privacy=document.createElement('small');privacy.textContent='最佳记录仅存在本机浏览器，可随浏览器数据清除；没有上传。';box.append(privacy);
}
function syncTidyActions(){$('#tidy-actions').hidden=!(viewingRoom&&state.phase==='won');}
function showPendingResult(){if(pendingResult&&state.phase!=='playing'&&!document.querySelector('dialog[open]')){pendingResult=false;$('#result').showModal();$('#result-title').focus({preventScroll:true});$('#result').scrollTop=0;$('.result-body').scrollTop=0;}}
function showRoom(){if(state.phase!=='won')return;pendingResult=false;viewingRoom=true;$('#result').close();syncTidyActions();$('#tidy-result').focus({preventScroll:true});traceInput('tidy-room-view');}
function showRoomResult(){if(state.phase!=='won')return;viewingRoom=false;syncTidyActions();pendingResult=true;showPendingResult();traceInput('tidy-result-view');}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function startLevel(id){helpToken=null;starResult=null;const selected=getLevel(id);if(!selected)throw Error('Unknown level');pendingResult=false;viewingRoom=false;syncTidyActions();traceInput('cancelled',{ids:[...pendingIds],reason:'restart-or-level-change'});epoch++;audio.beginRun(epoch);ready=false;assetKey='';assetController?.abort();releaseAssetWaiters();l1SoundEpoch++;for(const anim of l1Animations)anim.cancel();l1Animations.clear();audio.stopGroup('l1-feedback');for(const done of menuWaiters)done();menuWaiters.clear();inputQueue=[];pendingIds.clear();activeId=null;document.querySelectorAll('.ghost').forEach(g=>{g.getAnimations().forEach(a=>a.cancel());g.remove();});busy=false;lastHit=null;runPeak=0;runStores=0;routeResult=null;level=selected;state=createState(level);closeDialogs();render();beginGuide();$('#feedback').textContent=level.hint;$('.room-viewport')?.scrollTo({top:0,behavior:'instant'});window.scrollTo({top:0,behavior:'instant'});}
function refreshLevelCompletion(){for(const l of LEVELS){const label=$(`[data-level="${l.id}"] small`);if(label)label.textContent=levelDescription(l);}}
function renderLevelOptions(){$('#level-options').innerHTML=LEVELS.map((l,n)=>`<button data-level="${l.id}"><b>${n+1}. ${l.name}</b><small>${levelDescription(l)}</small></button>`).join('');}
function openLevels(){closeDialogs();renderLevelOptions();$('#levels-dialog').showModal();}
function showFinal(){closeDialogs();$('#final-summary').innerHTML=LEVELS.map(l=>`<p>✓ ${l.name}<small>${'★'.repeat(completed.get(l.id).stars)} · ${completed.get(l.id).help?'测试帮助':'免费'} · ${completed.get(l.id).moves}件收取 · ${completed.get(l.id).attempts}次尝试${l.routeGoal?` · 最高暂存${completed.get(l.id).peak}格`:''}</small></p>`).join('');$('#final').showModal();}
function syncAudio(){
 const p=audio.prefs,m=Math.round(p.musicVolume*100),f=Math.round(p.sfxVolume*100),v=Math.round(p.voiceVolume*100);
 $('#voice-on').checked=p.voiceOn;$('#voice-volume').value=v;$('#voice-value').textContent=`${v}%`;$('#voice-volume').setAttribute('aria-valuetext',`${v}%`);$('#voice-status').textContent=audio.voice.error||'人声播放时，音乐和音效会自动放轻。';$('#music-on').checked=p.musicOn;$('#sfx-on').checked=p.sfxOn;$('#music-volume').value=m;$('#sfx-volume').value=f;
 $('#music-value').textContent=`${m}%`;$('#sfx-value').textContent=`${f}%`;
 $('#music-volume').setAttribute('aria-valuetext',`${m}%`);$('#sfx-volume').setAttribute('aria-valuetext',`${f}%`);
 const music=p.musicOn&&m>0,sfx=p.sfxOn&&f>0;
 $('#audio-status').textContent=audio.error||(!audio.activated?'等待点击，开启声音':!audio.ready?'声音加载中…':audio.backgrounded||document.hidden?'声音已暂停，返回后继续':!music&&!sfx&&(!p.voiceOn||v===0)?'已静音，设置已记住':audio.ctx?.state!=='running'?'声音待恢复，请点开启 / 继续声音':`${music?'音乐播放中':'音乐已关闭'} · ${sfx?'音效已开启':'音效已关闭'} · ${p.voiceOn&&v>0?'人声已开启':'人声已关闭'}`);
}

audio.notify=syncAudio;
$('#board').addEventListener('pointerdown',e=>{if(!ready)return;const id=resolveHit(e.clientX,e.clientY);traceInput('pointerdown',{x:e.clientX,y:e.clientY,target:e.target.id,resolved:id});if(id&&!reduced&&state.phase==='playing')$('#'+id)?.classList.add('pressed');});
for(const type of ['pointerup','pointercancel'])document.addEventListener(type,()=>document.querySelectorAll('.prop.pressed').forEach(el=>el.classList.remove('pressed')));
$('#board').addEventListener('click',e=>{if(!ready){traceInput('rejected',{reason:'not-ready'});return;}const keyboard=e.detail===0?e.target.closest('.prop'):null;const id=keyboard?.id||resolveHit(e.clientX,e.clientY);traceInput('click',{x:e.clientX,y:e.clientY,target:e.target.id,resolved:id,source:keyboard?'keyboard':'pointer',hit:keyboard?{id,kind:'keyboard'}:hitDetail(e.clientX,e.clientY)});if(id)pick(id);else{traceInput('rejected',{reason:'empty-hit'});if(!busy&&state.phase==='playing')$('#feedback').textContent='这里没有物件，点物件本身试试。';}});
$('#bins').onclick=e=>{if(!e.target.closest('button.locked-placeholder')||busy||!ready||!entered||state.phase!=='playing'||state.helpUnlocked||state.next>=level.categories.length)return;helpToken={epoch};const request=helpToken;$('#help-confirm').onclick=()=>confirmHelp(request);$('#help-category').textContent=`将开放${categoryName(level.categories[state.next].id)}。匹配暂存自动归位，之后继续满箱换类，直到本局结束。`;$('#help-dialog').showModal();};
async function confirmHelp(request){
 const token=request.epoch;if(request!==helpToken||token!==epoch||document.hidden||busy||!ready||state.phase!=='playing')return;
 helpToken=null;const next=unlockHelp(level,state);if(next===state)return;
 busy=true;$('#help-dialog').close();$('#board').inert=true;renderBins();
 await animateSettlement(next,null,next.events[0],token);if(token!==epoch)return;
 state=next;busy=false;$('#board').inert=false;render();$('#feedback').textContent='测试帮助已开启，本局持续有效；没有播放广告。';traceInput('help-committed');if(state.phase!=='playing')finish();
};
$('#help-dialog').addEventListener('close',()=>{helpToken=null;});
$('#help-restart').onclick=()=>startLevel(level.id);
$('#reset').onclick=()=>startLevel(level.id);$('#again').onclick=()=>startLevel(level.id);$('#levels-open').onclick=openLevels;$('#result-levels').onclick=openLevels;$('#final-levels').onclick=openLevels;
$('#level-options').onclick=e=>{const b=e.target.closest('[data-level]');if(b)startLevel(b.dataset.level);};
function advanceLevel(){if(completed.size===3)showFinal();else{const n=LEVELS.indexOf(level),next=LEVELS[n+1]||LEVELS.find(l=>!completed.has(l.id));startLevel(next.id);}}
$('#next').onclick=advanceLevel;$('#tidy-next').onclick=advanceLevel;$('#tidy-result').onclick=showRoomResult;$('#result-room').onclick=showRoom;
$('#history-open').onclick=()=>{closeDialogs();$('#history-detail').innerHTML=`<ol>${historyHTML(true)}</ol>`;$('#history-dialog').showModal();};
$('#sound-open').onclick=()=>{closeDialogs();syncAudio();$('#sound-dialog').showModal();void audio.activate(true);};$('#audio-start').onclick=()=>audio.activate(true);
for(const [id,key] of [['music-on','musicOn'],['sfx-on','sfxOn'],['voice-on','voiceOn']])$('#'+id).onchange=e=>audio.set(key,e.target.checked);
for(const [id,key] of [['music-volume','musicVolume'],['sfx-volume','sfxVolume'],['voice-volume','voiceVolume']])$('#'+id).oninput=e=>audio.set(key,Number(e.target.value)/100);
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$('#'+b.dataset.close).close();
for(const d of document.querySelectorAll('dialog'))d.addEventListener('close',()=>{if(d.id==='result'&&!d.open&&state.phase==='won'&&!pendingResult)viewingRoom=true;syncTidyActions();showPendingResult();resumeQueue();});
$('#settings-open').onclick=()=>{$('#settings-dialog').showModal();};
$('#rules-open').onclick=()=>{closeDialogs();$('#rules-dialog').showModal();};
new ResizeObserver(applyLayout).observe($('.room'));

$('#resource-retry').onclick=()=>{assetKey='';render();};
audio.beginRun(epoch);render();syncAudio();$('#feedback').textContent=level.hint;
// Only this same-document entry gesture unlocks audio; prefetch never plays.
$('#enter-game').addEventListener('click',e=>{if(e.isTrusted)enterGame();});
$('#guide-skip').onclick=()=>{endGuide();closeDialogs();};
void audio.preload();
// Read-only QA surface. No way to mutate state, skip levels or fabricate wins.
window.ssjwl={snapshot:()=>structuredClone(state),ui:()=>({busy,epoch,ready,entered,guide:{...guide,done:guideDone},assetState,assetEpoch,assetError,assetPaths:[...assetPaths],reduced,lastHit,levelId:level.id,completed:[...completed.keys()],queue:[...inputQueue],activeId,runPeak,runStores,starResult:starResult?{...starResult}:null,routeResult:routeResult?{...routeResult}:null}),inputTrace:()=>structuredClone(inputLog),audioSnapshot:()=>audio.snapshot(),pointFor,resolveHit,hitDetail,alphaAt,layout:()=>structuredClone(viewLayout),containerView:()=>binView?structuredClone(binView):null};
