import {LEVELS,getLevel,sprites,selections} from './levels.mjs';
import {createState,take,blocked,count} from './core.mjs';
import {GameAudio} from './audio.mjs';
import {containerHTML} from './containers.mjs';
import {fitLayout} from './scene-layout.mjs';
import {spritePath,scenePath,sceneFrame} from './scene-art.mjs';
import {readBest,saveBest} from './route-records.mjs';
const $=s=>document.querySelector(s),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let level=LEVELS[0],state=createState(level),busy=false,epoch=0,ready=false,lastHit=null,pendingResult=false;
const masks=new Map(),completed=new Map(),audio=new GameAudio();
const inputTracing=new URLSearchParams(location.search).has('qa-input'),inputLog=[];
let inputQueue=[],pendingIds=new Set(),activeId=null,runPeak=0,routeResult=null;
let viewLayout={},binView=null;
const menuWaiters=new Set();
function resumeQueue(){if(!document.querySelector('dialog[open]')){for(const done of menuWaiters)done();menuWaiters.clear();}}
async function waitForMenus(token){if(token===epoch&&document.querySelector('dialog[open]'))await new Promise(done=>menuWaiters.add(done));}
function applyLayout(){const board=$('#board'),r=board.getBoundingClientRect();viewLayout=fitLayout(level,r.width,r.height);for(const [id,p] of Object.entries(viewLayout)){const e=$('#'+id);if(e){e.style.left=p.x+'px';e.style.top=p.y+'px';e.style.width=p.size+'px';e.style.zIndex=p.z;e.firstElementChild.style.transform=`rotate(${p.angle}deg)`;}}if(level.id!=='l1'){const f=sceneFrame(r.width,r.height);const plate=$('#scene-plate');plate.style.left=f.x+'px';plate.style.width=f.width+'px';plate.style.borderTopWidth=(440/971*f.width)+'px';plate.style.borderBottomWidth=(170/971*f.width)+'px';plate.style.borderImageSource=`url(${scenePath(level)})`;plate.classList.toggle('wide',f.wide);plate.style.backgroundImage=f.wide?`url(./scene-art/${level.scene}-wide.webp)`:'none';}else{$('#room-image').style.width='';$('#room-image').style.left='';}$('#feedback').style.top=matchMedia('(orientation:landscape) and (min-width:600px) and (max-height:600px)').matches?'8px':($('.hud').getBoundingClientRect().bottom-$('main').getBoundingClientRect().top+8)+'px';}
function renderBins(s=state){binView=s;$('#progress').textContent=`${Object.values(s.locations).filter(x=>x==='sorted').length} / ${level.items.length} 已归位`;$('#later').textContent=level.categories.slice(s.next).map(c=>`接着 · ${c.name}`).join(' → ')||'每件物品，都回到它的位置';$('#pressure').textContent=`暂存 ${s.buffer.length}/${level.capacity}`;const active=s.phase==='won'?level.categories.slice(-2).map(c=>c.id):s.active;$('#bins').innerHTML=active.map((id,n)=>{const c=level.categories.find(c=>c.id===id),total=level.items.filter(i=>i.category===id).length;return containerHTML(level,c,count(level,s,id),total,`bin-${epoch}-${n}`);}).join('');}

function localRecords(){try{return window.localStorage;}catch{return null;}}
function levelDescription(l){const best=l.routeGoal?readBest(l,localRecords()).best:null;return `${l.items.length}件 · ${completed.has(l.id)?'本次已收好':'等你来收'}${l.routeGoal?` · 可选${l.routeGoal.targetPeak}格目标${best!==null?` · 本机最佳${best}格`:''}`:''}`;}
function traceInput(kind,detail={}){
 if(!inputTracing)return;
 inputLog.push({t:performance.now(),kind,...detail,busy,epoch,level:level.id,moves:state.moves,phase:state.phase,buffer:[...state.buffer],queue:[...inputQueue]});
 if(inputLog.length>4000)inputLog.shift();
}
const image=id=>`<img src="${spritePath(id,level)}" alt="" draggable="false">`,name=id=>level.items.find(i=>i.id===id)?.name||id,categoryName=id=>level.categories.find(c=>c.id===id)?.name||id;
async function loadMasks(){const paths=[...new Set(LEVELS.flatMap(l=>l.items.map(i=>spritePath(i.id,l))))];await Promise.all(paths.map(async path=>{const img=new Image();img.src=path;await img.decode();const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,128,128);masks.set(path,ctx.getImageData(0,0,128,128).data);}));ready=true;$('#board').setAttribute('aria-busy',String(busy));}
function describe(entry){const e=entry.events[0],n=name(entry.id);let text=e.type==='blocked'?`${n}被${e.blockers.map(name).join('、')}压住`:e.type==='store'?`${n}放进暂存`:e.type==='sort'?`${n}归入${categoryName(level.items.find(i=>i.id===entry.id).category)}`:`${n}放不下：暂存已满`;
 const drained=entry.events.filter(e=>e.type==='drain');if(drained.length)text+=`；${drained.map(e=>name(e.id)).join('、')}自动归位，腾出${drained.length}格`;const opened=entry.events.filter(e=>e.type==='open');if(opened.length&&!drained.length)text+=`；${opened.map(e=>categoryName(e.category)).join('、')}打开了`;return text;}
function historyHTML(detail=false){return state.history.map(e=>`<li><span class="step">${e.step}</span><span>${describe(e)}${detail?`<small>暂存 ${e.before.buffer.length} → ${e.after.buffer.length} / ${level.capacity} · 当前：${e.after.buffer.map(name).join('、')||'空'}</small>`:''}</span></li>`).join('')||'<li>还没收第一件，慢慢来。</li>';}
function render(){
 $('#level-title').textContent=level.name;$('#level-number').textContent=`${LEVELS.indexOf(level)+1} / 3`;$('#session-progress').textContent=`本次完成 ${completed.size} / 3`;
 $('.room').dataset.scene=level.scene;$('#room-image').src=scenePath(level);$('#room-image').alt=level.name+'场景';$('.room').setAttribute('aria-label',level.name);$('.wall-note').textContent=level.scene==='desk'?'今天到这里 ✓':'下一站，新家';$('.desk-keepsakes').innerHTML=(level.artOverrides?['t1','t2','c1']:['d1','d2']).map(image).join('');
 $('#progress').textContent=`${Object.values(state.locations).filter(x=>x==='sorted').length} / ${level.items.length} 已归位`;
 renderBins();
 $('#later').textContent=level.categories.slice(state.next).map(c=>`接着 · ${c.name}`).join('  →  ')||'每件物品，都回到它的位置';
 $('#board').innerHTML=level.items.filter(i=>state.locations[i.id]==='board').map(i=>{const p=level.layout[i.id],covers=blocked(level,state,i.id);return `<button id="${i.id}" class="prop ${covers.length?'blocked':''}" style="left:${p.x/360*100}%;top:${p.y/456*100}%;width:${p.size/360*100}%;aspect-ratio:1;z-index:${p.z}" aria-label="${i.name}${covers.length?'，被'+covers.map(name).join('、')+'压住':''}">${image(i.id)}</button>`;}).join('');
 for(const i of level.items){const e=$('#'+i.id);if(e){e.firstElementChild.style.transform=`rotate(${level.layout[i.id].angle}deg)`;e.firstElementChild.style.transformOrigin='50% 92%';}}
 $('#tray').innerHTML=Array.from({length:level.capacity},(_,i)=>`<div class="slot ${state.buffer[i]?'full':''}" data-slot="${i}">${state.buffer[i]?image(state.buffer[i])+`<span>${name(state.buffer[i])}</span>`:i+1}</div>`).join('');
 $('#pressure').textContent=`暂存 ${state.buffer.length}/${level.capacity}`;$('.storage').classList.toggle('danger',state.buffer.length===level.capacity);$('.room').classList.toggle('tidy',state.phase==='won');$('#board').setAttribute('aria-busy',String(!ready||busy));if($('#history-dialog').open)$('#history-detail').innerHTML=`<ol>${historyHTML(true)}</ol>`;applyLayout();
}
function alphaAt(id,x,y){
 const el=$('#'+id),mask=masks.get(spritePath(id,level));if(!el||!mask)return 0;
 const r=el.getBoundingClientRect(),cx=r.x+r.width*.5,cy=r.y+r.height*.92;
 const a=-viewLayout[id].angle*Math.PI/180,dx=x-cx,dy=y-cy;
 let u=(dx*Math.cos(a)-dy*Math.sin(a)+r.width*.5)/r.width;
 let v=(dx*Math.sin(a)+dy*Math.cos(a)+r.height*.92)/r.height;
 if(u<0||u>=1||v<0||v>=1)return 0;return mask[(Math.floor(v*128)*128+Math.floor(u*128))*4+3];
}
function resolveHit(x,y){
 const order=level.items.filter(i=>state.locations[i.id]==='board'&&$('#'+i.id)?.style.visibility!=='hidden').sort((a,b)=>viewLayout[b.id].z-viewLayout[a.id].z);
 // Every visible solid pixel wins before any transparent-padding forgiveness.
 for(const i of order)if(alphaAt(i.id,x,y)>=64)return i.id;
 // 6 CSS pixel edge forgiveness; cannot steal another item's solid pixel.
 let best=null,dist=Infinity;
 for(const i of order){for(const [dx,dy] of [[3,0],[-3,0],[0,3],[0,-3],[6,0],[-6,0],[0,6],[0,-6],[4,4],[-4,4],[4,-4],[-4,-4]]){
  const d=dx*dx+dy*dy;if(d<dist&&alphaAt(i.id,x+dx,y+dy)>=128){best=i.id;dist=d;}
 }}return best;
}
function pointFor(id){
 const e=$('#'+id);if(!e)return null;const r=e.getBoundingClientRect(),clip=$('.room-viewport')?.getBoundingClientRect()||$('#board').getBoundingClientRect();let best=null,score=-1;
 const left=Math.max(r.left,clip.left,0),right=Math.min(r.right,clip.right,innerWidth),top=Math.max(r.top,clip.top,0),bottom=Math.min(r.bottom,clip.bottom,innerHeight);
 for(let y=top;y<bottom;y+=3)for(let x=left;x<right;x+=3){
  if(alphaAt(id,x,y)<192||resolveHit(x,y)!==id||!document.elementFromPoint(x,y)?.closest('#board'))continue;
  let n=0;for(const [dx,dy] of [[-5,0],[5,0],[0,5],[0,-5],[-3,-3],[3,3]])if(resolveHit(x+dx,y+dy)===id)n++;
  const v=n*100-Math.hypot(x-r.x-r.width/2,y-r.y-r.height/2);if(v>score){score=v;best={x,y};}
 }return best;
}
function pick(id){
 traceInput('request',{id});
 if(!ready||state.phase!=='playing'||document.querySelector('dialog[open]')){traceInput('rejected',{id,reason:!ready?'not-ready':'ended'});return;}
 if(pendingIds.has(id)||state.locations[id]!=='board'){traceInput('rejected',{id,reason:pendingIds.has(id)?'duplicate-pending':'not-on-board'});return;}
 void audio.activate();pendingIds.add(id);inputQueue.push(id);traceInput('queued',{id});
 if(busy){$('#feedback').textContent=`${name(id)}已排好，接着收。`;return;}
 busy=true;$('#board').setAttribute('aria-busy','true');void drainInputs(epoch);
}
async function drainInputs(token){
 while(token===epoch&&inputQueue.length&&state.phase==='playing'){
  await waitForMenus(token);if(token!==epoch)return;
  const id=inputQueue.shift();activeId=id;
  // A preceding category completion may already have moved a queued item.
  if(state.locations[id]!=='board'){traceInput('cancelled',{id,reason:'no-longer-on-board'});pendingIds.delete(id);continue;}
  await performPick(id,token);
  if(token!==epoch)return;
  pendingIds.delete(id);activeId=null;
 }
 if(token!==epoch)return;
 if(inputQueue.length)traceInput('cancelled',{ids:[...inputQueue],reason:'game-ended'});
 inputQueue=[];pendingIds.clear();activeId=null;busy=false;$('#board').setAttribute('aria-busy',String(!ready));traceInput('idle');
}
async function performPick(id,token){
 lastHit=id;const next=take(level,state,id),event=next.events[0];
 if(!event){traceInput('rejected',{id,reason:'no-event'});return;}
 traceInput('accepted',{id,event:event.type});
 if(event.type==='blocked'){state=next;render();$('#feedback').textContent=describe(next.history.at(-1));audio.play('warning');for(const cover of event.blockers){const e=$('#'+cover);e?.classList.add('highlight');if(e)setTimeout(()=>e.classList.remove('highlight'),1800);}traceInput('committed',{id,event:event.type});return;}
 if(event.type==='overflow'){state=next;runPeak=Math.max(runPeak,state.buffer.length);render();audio.play('warning');traceInput('committed',{id,event:event.type});finish();return;}
 const source=$('#'+id),category=level.items.find(i=>i.id===id).category;
 const target=event.type==='store'?$(`[data-slot="${state.buffer.length}"]`):$(`[data-category="${category}"] .bin-mouth`);
 $('#feedback').textContent=event.type==='store'?`${name(id)}先放这里，留意三个暂存位。`:`${name(id)}归位！`;audio.play(event.type==='store'?'store':'sort');
 await fly(id,source,target,token,viewLayout[id].angle,event.type==='sort');
 if(token!==epoch)return;
 await animateSettlement(next,id,event,token);

 if(token!==epoch)return;
 state=next;runPeak=Math.max(runPeak,state.buffer.length);render();traceInput('committed',{id,event:event.type});$('#feedback').textContent=describe(state.history.at(-1));if(state.phase!=='playing')finish();
}

async function animateElement(el,frames,duration,token){if(reduced||!el||token!==epoch)return;const anim=el.animate(frames,{duration,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'});try{await anim.finished;}catch{}if(token===epoch)anim.cancel();}
async function fly(id,source,target,token,angle=0,intoMouth=true){
 if(reduced||!source||!target)return;
 const start=source.getBoundingClientRect(),end=target.getBoundingClientRect();
 const ghost=document.createElement('div');ghost.className='ghost';ghost.dataset.item=id;ghost.dataset.destination=intoMouth?'mouth':'tray';ghost.innerHTML=image(id);
 Object.assign(ghost.style,{left:start.x+'px',top:start.y+'px',width:start.width+'px',height:start.height+'px'});document.body.append(ghost);source.style.visibility='hidden';
 const dx=end.x+end.width/2-start.x-start.width/2,dy=end.y+end.height/2-start.y-start.height/2;
 traceInput('flight',{id,to:intoMouth?'mouth':'tray',destination:{x:end.x+end.width/2,y:end.y+end.height/2},source:{x:start.x,y:start.y,width:start.width,height:start.height}});
 await animateElement(ghost,[{transform:`translate(0,0) rotate(${angle}deg) scale(1)`,opacity:1},{offset:.82,transform:`translate(${dx}px,${dy-5}px) rotate(0deg) scale(.36)`,opacity:1},{transform:`translate(${dx}px,${dy+3}px) rotate(0deg) scale(.16)`,opacity:intoMouth?0:1}],240,token);ghost.remove();
}
async function animateSettlement(next,id,event,token){
 const view=structuredClone(state);view.locations[id]=event.type==='store'?'buffer':'sorted';if(event.type==='store')view.buffer.push(id);
 renderBins(view);
 const finished=new Set();
 async function finishBin(category){const el=$(`[data-category="${category}"]`);if(!el)return;el.dataset.state='full';el.querySelector('.bin-count').textContent=`${count(level,view,category)} / ${level.items.filter(i=>i.category===category).length}`;traceInput('container-full',{category});await animateElement(el,[{transform:'scale(1)'},{transform:'scale(1.045)'},{transform:'scale(1)'}],190,token);finished.add(category);}
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
   await fly(e.id,$(`[data-slot="${slot}"] img`),$(`[data-category="${category}"] .bin-mouth`),token,0,true);if(token!==epoch)return;
   view.buffer.splice(slot,1);view.locations[e.id]='sorted';renderBins(view);
   $('#tray').innerHTML=Array.from({length:level.capacity},(_,i)=>`<div class="slot ${view.buffer[i]?'full':''}" data-slot="${i}">${view.buffer[i]?image(view.buffer[i])+`<span>${name(view.buffer[i])}</span>`:i+1}</div>`).join('');
   traceInput('buffer-drained',{id:e.id,category,remaining:[...view.buffer]});
  }
 }
 for(const c of view.active)if(!finished.has(c)&&count(level,view,c)===level.items.filter(i=>i.category===c).length){await finishBin(c);if(token!==epoch)return;}
}

function finish(){const win=state.phase==='won';if(win){completed.set(level.id,{moves:state.moves,attempts:state.attempts,peak:runPeak});if(level.routeGoal)routeResult=saveBest(level,runPeak,localRecords());audio.play('victory');$('#session-progress').textContent=`本次完成 ${completed.size} / 3`;if($('#levels-dialog').open)refreshLevelCompletion();}
 $('#result-kicker').textContent=level.name;$('#result-title').textContent=win?'收好啦，舒服了！':'先缓一缓，位置满了';
 const last=state.history.at(-1);$('#result-message').textContent=win?`${level.items.length}件都归位了。这一角，清清爽爽。`:`${name(last.id)}属于${categoryName(level.items.find(i=>i.id===last.id).category)}，现在没有可收它的箱子。暂存已有${state.buffer.map(name).join('、')}，放不下第4件。它仍留在场景里。`;
 renderRouteResult(win);
 $('#failure-review').innerHTML=win?'':`<b>失败前的最近5步</b><ol>${historyHTML(true)}</ol><p>试着先完成当前一箱，让新分类接走暂存。免费重开可以换一条路线。</p>`;
 $('#next').hidden=!win;$('#next').textContent=completed.size===3?'看看今天的成果':LEVELS.indexOf(level)<2?'下一关':'去收还没完成的角落';pendingResult=true;showPendingResult();}
function renderRouteResult(win){
 const box=$('#route-results');box.hidden=!level.routeGoal||!win;box.replaceChildren();if(box.hidden)return;
 const goal=level.routeGoal,record=routeResult,done=runPeak<=goal.targetPeak;
 const status=record.saved?(record.first?'本机首次记录':record.improved?'比上次更省位置了':'本机最佳继续保留'):'本次已记下，浏览器未能保存';
 const title=document.createElement('b');title.textContent=done?'轻装收桌，达成了':'这一桌，也收得好';box.append(title);
 const beforeAfter=document.createElement('p');beforeAfter.className='route-before-after';beforeAfter.textContent=`整理前 ${level.items.length}件散落 → 整理后 全部归位`;box.append(beforeAfter);
 const peak=document.createElement('p');peak.className='route-peak';peak.textContent=`本次最高暂存 ${runPeak} / ${level.capacity} 格`;box.append(peak);
 const best=document.createElement('p');best.id='route-best';best.textContent=record.saved?`本机最佳 ${record.best} 格 · ${status}`:`${status}${record.previous!==null?`；原记录 ${record.previous} 格`:'，仅供这次查看'}`;box.append(best);
 const optional=document.createElement('p');optional.textContent=done?'可选目标已完成：不超过1格。想换条路线也可以。':`可选挑战：${goal.text}。不影响通关，不用赶时间。`;box.append(optional);
 const privacy=document.createElement('small');privacy.textContent='最佳记录仅存在本机浏览器，可随浏览器数据清除；没有上传。';box.append(privacy);
}
function showPendingResult(){if(pendingResult&&state.phase!=='playing'&&!document.querySelector('dialog[open]')){pendingResult=false;$('#result').showModal();}}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function startLevel(id){const selected=getLevel(id);if(!selected)throw Error('Unknown level');pendingResult=false;traceInput('cancelled',{ids:[...pendingIds],reason:'restart-or-level-change'});epoch++;for(const done of menuWaiters)done();menuWaiters.clear();inputQueue=[];pendingIds.clear();activeId=null;document.querySelectorAll('.ghost').forEach(g=>{g.getAnimations().forEach(a=>a.cancel());g.remove();});busy=false;lastHit=null;runPeak=0;routeResult=null;level=selected;state=createState(level);closeDialogs();render();$('#feedback').textContent=level.hint;$('.room-viewport')?.scrollTo({top:0,behavior:'instant'});window.scrollTo({top:0,behavior:'instant'});}
function refreshLevelCompletion(){for(const l of LEVELS){const label=$(`[data-level="${l.id}"] small`);if(label)label.textContent=levelDescription(l);}}
function renderLevelOptions(){$('#level-options').innerHTML=LEVELS.map((l,n)=>`<button data-level="${l.id}"><b>${n+1}. ${l.name}</b><small>${levelDescription(l)}</small></button>`).join('');}
function openLevels(){closeDialogs();renderLevelOptions();$('#levels-dialog').showModal();}
function showFinal(){closeDialogs();$('#final-summary').innerHTML=LEVELS.map(l=>`<p>✓ ${l.name}<small>${completed.get(l.id).moves}件收取 · ${completed.get(l.id).attempts}次有效尝试${l.routeGoal?` · 最高暂存${completed.get(l.id).peak}格`:''}</small></p>`).join('');$('#final').showModal();}
function syncAudio(){
 const p=audio.prefs,m=Math.round(p.musicVolume*100),f=Math.round(p.sfxVolume*100);
 $('#music-on').checked=p.musicOn;$('#sfx-on').checked=p.sfxOn;$('#music-volume').value=m;$('#sfx-volume').value=f;
 $('#music-value').textContent=`${m}%`;$('#sfx-value').textContent=`${f}%`;
 $('#music-volume').setAttribute('aria-valuetext',`${m}%`);$('#sfx-volume').setAttribute('aria-valuetext',`${f}%`);
 const music=p.musicOn&&m>0,sfx=p.sfxOn&&f>0;
 $('#audio-status').textContent=audio.error||(!audio.activated?'等待点击，开启声音':!audio.ready?'声音加载中…':audio.backgrounded||document.hidden?'声音已暂停，返回后继续':!music&&!sfx?'已静音，设置已记住':audio.ctx?.state!=='running'?'声音待恢复，请点开启 / 继续声音':`${music?'音乐播放中':'音乐已关闭'} · ${sfx?'音效已开启':'音效已关闭'}`);
}

audio.notify=syncAudio;
$('#board').addEventListener('pointerdown',e=>traceInput('pointerdown',{x:e.clientX,y:e.clientY,target:e.target.id,resolved:resolveHit(e.clientX,e.clientY)}));
$('#board').addEventListener('click',e=>{const keyboard=e.detail===0?e.target.closest('.prop'):null;const id=keyboard?.id||resolveHit(e.clientX,e.clientY);traceInput('click',{x:e.clientX,y:e.clientY,target:e.target.id,resolved:id,source:keyboard?'keyboard':'pointer'});if(id)pick(id);else{traceInput('rejected',{reason:'empty-hit'});if(!busy&&state.phase==='playing')$('#feedback').textContent='这里没有物件，点物件本身试试。';}});
$('#reset').onclick=()=>startLevel(level.id);$('#again').onclick=()=>startLevel(level.id);$('#levels-open').onclick=openLevels;$('#result-levels').onclick=openLevels;$('#final-levels').onclick=openLevels;
$('#level-options').onclick=e=>{const b=e.target.closest('[data-level]');if(b)startLevel(b.dataset.level);};
$('#next').onclick=()=>{if(completed.size===3)showFinal();else{const n=LEVELS.indexOf(level),next=LEVELS[n+1]||LEVELS.find(l=>!completed.has(l.id));startLevel(next.id);}};
$('#history-open').onclick=()=>{closeDialogs();$('#history-detail').innerHTML=`<ol>${historyHTML(true)}</ol>`;$('#history-dialog').showModal();};
$('#sound-open').onclick=()=>{closeDialogs();syncAudio();$('#sound-dialog').showModal();void audio.activate();};$('#audio-start').onclick=()=>audio.activate();
for(const [id,key] of [['music-on','musicOn'],['sfx-on','sfxOn']])$('#'+id).onchange=e=>audio.set(key,e.target.checked);
for(const [id,key] of [['music-volume','musicVolume'],['sfx-volume','sfxVolume']])$('#'+id).oninput=e=>audio.set(key,Number(e.target.value)/100);
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$('#'+b.dataset.close).close();
for(const d of document.querySelectorAll('dialog'))d.addEventListener('close',()=>{showPendingResult();resumeQueue();});
$('#settings-open').onclick=()=>{$('#settings-dialog').showModal();};
$('#rules-open').onclick=()=>{closeDialogs();$('#rules-dialog').showModal();};
new ResizeObserver(applyLayout).observe($('.room'));

render();syncAudio();$('#feedback').textContent=level.hint;loadMasks().catch(e=>{$('#feedback').textContent='素材加载失败，请重新打开本地页面。';console.error(e);});
// Read-only QA surface. No way to mutate state, skip levels or fabricate wins.
window.ssjwl={snapshot:()=>structuredClone(state),ui:()=>({busy,epoch,ready,reduced,lastHit,levelId:level.id,completed:[...completed.keys()],queue:[...inputQueue],activeId,runPeak,routeResult:routeResult?{...routeResult}:null}),inputTrace:()=>structuredClone(inputLog),audioSnapshot:()=>audio.snapshot(),pointFor,resolveHit,alphaAt,layout:()=>structuredClone(viewLayout),containerView:()=>binView?structuredClone(binView):null};
