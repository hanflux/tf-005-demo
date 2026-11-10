import {LEVELS,getLevel,sprites,selections,spritePath} from './levels.mjs';
import {createState,take,blocked,count} from './core.mjs';
import {GameAudio} from './audio.mjs';
const $=s=>document.querySelector(s),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let level=LEVELS[0],state=createState(level),busy=false,epoch=0,ready=false,lastHit=null,pendingResult=false;
const masks=new Map(),completed=new Map(),audio=new GameAudio();
const image=id=>`<img src="${spritePath(id)}" alt="" draggable="false">`,name=id=>level.items.find(i=>i.id===id)?.name||id,categoryName=id=>level.categories.find(c=>c.id===id)?.name||id;
async function loadMasks(){await Promise.all(Object.keys(sprites).map(async id=>{const img=new Image();img.src=spritePath(id);await img.decode();const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,128,128);masks.set(id,ctx.getImageData(0,0,128,128).data);}));ready=true;$('#board').setAttribute('aria-busy',String(busy));}
function describe(entry){const e=entry.events[0],n=name(entry.id);let text=e.type==='blocked'?`${n}被${e.blockers.map(name).join('、')}压住`:e.type==='store'?`${n}放进暂存`:e.type==='sort'?`${n}归入${categoryName(level.items.find(i=>i.id===entry.id).category)}`:`${n}放不下：暂存已满`;
 const drained=entry.events.filter(e=>e.type==='drain');if(drained.length)text+=`；${drained.map(e=>name(e.id)).join('、')}自动归位，腾出${drained.length}格`;return text;}
function historyHTML(detail=false){return state.history.map(e=>`<li><span class="step">${e.step}</span><span>${describe(e)}${detail?`<small>暂存 ${e.before.buffer.length} → ${e.after.buffer.length} / ${level.capacity} · 当前：${e.after.buffer.map(name).join('、')||'空'}</small>`:''}</span></li>`).join('')||'<li>还没收第一件，慢慢来。</li>';}
function render(){
 $('#level-title').textContent=level.name;$('#level-number').textContent=`${LEVELS.indexOf(level)+1} / 3`;$('#session-progress').textContent=`本次完成 ${completed.size} / 3`;$('#scene-caption').textContent=level.caption;
 $('.room').dataset.scene=level.scene;$('.room').setAttribute('aria-label',level.name);$('.wall-note').textContent=level.scene==='desk'?'今天到这里 ✓':'下一站，新家';
 $('#progress').textContent=`${Object.values(state.locations).filter(x=>x==='sorted').length} / ${level.items.length} 已归位`;
 $('#bins').innerHTML=state.active.map(c=>{const group=level.items.filter(i=>i.category===c),n=count(level,state,c);return `<div class="bin" data-category="${c}">${image(group[0].id)}<div><b>${categoryName(c)}</b><span>${n} / ${group.length}</span><div class="meter"><i style="width:${n/group.length*100}%"></i></div></div></div>`;}).join('');
 $('#later').textContent=level.categories.slice(state.next).map(c=>`接着 · ${c.name}`).join('  →  ')||'每件物品，都回到它的位置';
 $('#board').innerHTML=level.items.filter(i=>state.locations[i.id]==='board').map(i=>{const p=level.layout[i.id],covers=blocked(level,state,i.id);return `<button id="${i.id}" class="prop ${covers.length?'blocked':''}" style="left:${p.x/360*100}%;top:${p.y/456*100}%;width:${p.size/360*100}%;aspect-ratio:1;z-index:${p.z}" aria-label="${i.name}${covers.length?'，被'+covers.map(name).join('、')+'压住':''}">${image(i.id)}</button>`;}).join('');
 for(const i of level.items){const e=$('#'+i.id);if(e){e.firstElementChild.style.transform=`rotate(${level.layout[i.id].angle}deg)`;e.firstElementChild.style.transformOrigin='50% 92%';}}
 $('#tray').innerHTML=Array.from({length:level.capacity},(_,i)=>`<div class="slot ${state.buffer[i]?'full':''}" data-slot="${i}">${state.buffer[i]?image(state.buffer[i])+`<span>${name(state.buffer[i])}</span>`:i+1}</div>`).join('');
 $('#pressure').textContent=`${state.buffer.length} / ${level.capacity}`;$('.storage').classList.toggle('danger',state.buffer.length===level.capacity);$('.room').classList.toggle('tidy',state.phase==='won');$('#board').setAttribute('aria-busy',String(!ready||busy));$('#history-list').innerHTML=historyHTML();if($('#history-dialog').open)$('#history-detail').innerHTML=`<ol>${historyHTML(true)}</ol>`;
}
function alphaAt(id,x,y){
 const el=$('#'+id),mask=masks.get(id);if(!el||!mask)return 0;
 const r=el.getBoundingClientRect(),cx=r.x+r.width*.5,cy=r.y+r.height*.92;
 const a=-level.layout[id].angle*Math.PI/180,dx=x-cx,dy=y-cy;
 let u=(dx*Math.cos(a)-dy*Math.sin(a)+r.width*.5)/r.width;
 let v=(dx*Math.sin(a)+dy*Math.cos(a)+r.height*.92)/r.height;
 if(u<0||u>=1||v<0||v>=1)return 0;return mask[(Math.floor(v*128)*128+Math.floor(u*128))*4+3];
}
function resolveHit(x,y){
 const order=level.items.filter(i=>state.locations[i.id]==='board').sort((a,b)=>level.layout[b.id].z-level.layout[a.id].z);
 // Every visible solid pixel wins before any transparent-padding forgiveness.
 for(const i of order)if(alphaAt(i.id,x,y)>=64)return i.id;
 // 6 CSS pixel edge forgiveness; cannot steal another item's solid pixel.
 let best=null,dist=Infinity;
 for(const i of order){for(const [dx,dy] of [[3,0],[-3,0],[0,3],[0,-3],[6,0],[-6,0],[0,6],[0,-6],[4,4],[-4,4],[4,-4],[-4,-4]]){
  const d=dx*dx+dy*dy;if(d<dist&&alphaAt(i.id,x+dx,y+dy)>=128){best=i.id;dist=d;}
 }}return best;
}
function pointFor(id){
 const e=$('#'+id);if(!e)return null;const r=e.getBoundingClientRect();let best=null,score=-1;
 for(let y=Math.max(r.y,0);y<r.bottom;y+=3)for(let x=Math.max(r.x,0);x<r.right;x+=3){
  if(alphaAt(id,x,y)<192||resolveHit(x,y)!==id)continue;
  let n=0;for(const [dx,dy] of [[-5,0],[5,0],[0,5],[0,-5],[-3,-3],[3,3]])if(resolveHit(x+dx,y+dy)===id)n++;
  const s=n*100-Math.hypot(x-r.x-r.width/2,y-r.y-r.height/2);if(s>score){score=s;best={x,y};}
 }return best;
}
async function pick(id){
 if(busy||!ready||state.phase!=='playing')return;void audio.activate();
 lastHit=id;const next=take(level,state,id),event=next.events[0];if(!event)return;
 if(event.type==='blocked'){state=next;render();$('#feedback').textContent=describe(next.history.at(-1));audio.play('warning');for(const cover of event.blockers){const e=$('#'+cover);e?.classList.add('highlight');if(e)setTimeout(()=>e.classList.remove('highlight'),1800);}return;}
 if(event.type==='overflow'){state=next;render();audio.play('warning');finish();return;}
 const token=epoch,source=$('#'+id),start=source.getBoundingClientRect(),category=level.items.find(i=>i.id===id).category;
 const target=event.type==='store'?$(`[data-slot="${state.buffer.length}"]`):$(`[data-category="${category}"]`),end=target.getBoundingClientRect();busy=true;$('#board').setAttribute('aria-busy','true');
 $('#feedback').textContent=event.type==='store'?`${name(id)}先放这里，留意三个暂存位。`:`${name(id)}归位！`;audio.play(event.type==='store'?'store':'sort');
 if(!reduced){const ghost=document.createElement('div');ghost.className='ghost';ghost.innerHTML=image(id);Object.assign(ghost.style,{left:start.x+'px',top:start.y+'px',width:start.width+'px',height:start.height+'px'});document.body.append(ghost);source.style.visibility='hidden';const a=ghost.animate([{transform:`translate(0,0) rotate(${level.layout[id].angle}deg) scale(1)`},{transform:`translate(${end.x+end.width/2-start.x-start.width/2}px,${end.y+end.height/2-start.y-start.height/2}px) rotate(0deg) scale(.48)`}],{duration:270,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'});try{await a.finished;}catch{}ghost.remove();}
 if(token!==epoch)return;state=next;busy=false;render();$('#feedback').textContent=describe(state.history.at(-1));if(state.phase!=='playing')finish();
}
function finish(){const win=state.phase==='won';if(win){completed.set(level.id,{moves:state.moves,attempts:state.attempts});audio.play('victory');$('#session-progress').textContent=`本次完成 ${completed.size} / 3`;if($('#levels-dialog').open)refreshLevelCompletion();}
 $('#result-kicker').textContent=level.name;$('#result-title').textContent=win?'收好啦，舒服了！':'先缓一缓，位置满了';
 const last=state.history.at(-1);$('#result-message').textContent=win?`${level.items.length}件都归位了。这一角，清清爽爽。`:`${name(last.id)}属于${categoryName(level.items.find(i=>i.id===last.id).category)}，现在没有可收它的箱子。暂存已有${state.buffer.map(name).join('、')}，放不下第4件。它仍留在场景里。`;
 $('#failure-review').innerHTML=win?'':`<b>失败前的最近5步</b><ol>${historyHTML(true)}</ol><p>试着先完成当前一箱，让新分类接走暂存。免费重开可以换一条路线。</p>`;
 $('#next').hidden=!win;$('#next').textContent=completed.size===3?'看看今天的成果':LEVELS.indexOf(level)<2?'下一关':'去收还没完成的角落';pendingResult=true;showPendingResult();}
function showPendingResult(){if(pendingResult&&state.phase!=='playing'&&!document.querySelector('dialog[open]')){pendingResult=false;$('#result').showModal();}}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function startLevel(id){const selected=getLevel(id);if(!selected)throw Error('Unknown level');pendingResult=false;epoch++;document.querySelectorAll('.ghost').forEach(g=>{g.getAnimations().forEach(a=>a.cancel());g.remove();});busy=false;lastHit=null;level=selected;state=createState(level);closeDialogs();render();$('#feedback').textContent=level.hint;window.scrollTo({top:0,behavior:'instant'});}
function refreshLevelCompletion(){for(const l of LEVELS){const label=$(`[data-level="${l.id}"] small`);if(label)label.textContent=`${l.items.length}件 · ${completed.has(l.id)?'本次已收好':'等你来收'}`;}}
function renderLevelOptions(){$('#level-options').innerHTML=LEVELS.map((l,n)=>`<button data-level="${l.id}"><b>${n+1}. ${l.name}</b><small>${l.items.length}件 · ${completed.has(l.id)?'本次已收好':'等你来收'}</small></button>`).join('');}
function openLevels(){closeDialogs();renderLevelOptions();$('#levels-dialog').showModal();}
function showFinal(){closeDialogs();$('#final-summary').innerHTML=LEVELS.map(l=>`<p>✓ ${l.name}<small>${completed.get(l.id).moves}件收取 · ${completed.get(l.id).attempts}次有效尝试</small></p>`).join('');$('#final').showModal();}
function syncAudio(){const p=audio.prefs;$('#music-on').checked=p.musicOn;$('#sfx-on').checked=p.sfxOn;$('#music-volume').value=Math.round(p.musicVolume*100);$('#sfx-volume').value=Math.round(p.sfxVolume*100);$('#music-value').textContent=`${Math.round(p.musicVolume*100)}%`;$('#sfx-value').textContent=`${Math.round(p.sfxVolume*100)}%`;$('#audio-status').textContent=audio.error||(!audio.activated?'点一下开始声音':audio.ready?'设置已记住':'声音加载中…');}
audio.notify=syncAudio;
$('#board').addEventListener('click',e=>{const keyboard=e.detail===0?e.target.closest('.prop'):null;const id=keyboard?.id||resolveHit(e.clientX,e.clientY);if(id)pick(id);else if(!busy&&state.phase==='playing')$('#feedback').textContent='这里没有物件，点物件本身试试。';});
$('#reset').onclick=()=>startLevel(level.id);$('#again').onclick=()=>startLevel(level.id);$('#levels-open').onclick=openLevels;$('#result-levels').onclick=openLevels;$('#final-levels').onclick=openLevels;
$('#level-options').onclick=e=>{const b=e.target.closest('[data-level]');if(b)startLevel(b.dataset.level);};
$('#next').onclick=()=>{if(completed.size===3)showFinal();else{const n=LEVELS.indexOf(level),next=LEVELS[n+1]||LEVELS.find(l=>!completed.has(l.id));startLevel(next.id);}};
$('#history-open').onclick=()=>{$('#history-detail').innerHTML=`<ol>${historyHTML(true)}</ol>`;$('#history-dialog').showModal();};
$('#sound-open').onclick=()=>{syncAudio();$('#sound-dialog').showModal();void audio.activate();};$('#audio-start').onclick=()=>audio.activate();
for(const [id,key] of [['music-on','musicOn'],['sfx-on','sfxOn']])$('#'+id).onchange=e=>audio.set(key,e.target.checked);
for(const [id,key] of [['music-volume','musicVolume'],['sfx-volume','sfxVolume']])$('#'+id).oninput=e=>audio.set(key,Number(e.target.value)/100);
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$('#'+b.dataset.close).close();
for(const d of document.querySelectorAll('dialog'))d.addEventListener('close',showPendingResult);
render();syncAudio();$('#feedback').textContent=level.hint;loadMasks().catch(e=>{$('#feedback').textContent='素材加载失败，请重新打开本地页面。';console.error(e);});
// Read-only QA surface. No way to mutate state, skip levels or fabricate wins.
window.ssjwl={snapshot:()=>structuredClone(state),ui:()=>({busy,epoch,ready,reduced,lastHit,levelId:level.id,completed:[...completed.keys()]}),audioSnapshot:()=>audio.snapshot(),pointFor,resolveHit,alphaAt,layout:()=>structuredClone(level.layout)};
