import {createState,take,blocked,count} from './core.mjs';
import {items,categories,capacity} from './level.mjs';
import {art} from './art.mjs';
import {GameAudio} from './audio.mjs';
const $=s=>document.querySelector(s);
const audio=new GameAudio();
let quickRestore={musicOn:true,sfxOn:true};
try{const saved=JSON.parse(localStorage.getItem('ssjwl-quick-restore-v1'));if(saved&&typeof saved.musicOn==='boolean'&&typeof saved.sfxOn==='boolean'&&(saved.musicOn||saved.sfxOn))quickRestore=saved;}catch{}
function audioUI(){
 for(const [prefix,on,volume] of [['music','musicOn','musicVolume'],['sfx','sfxOn','sfxVolume']]){$('#'+prefix+'-on').checked=audio.prefs[on];$('#'+prefix+'-volume').value=Math.round(audio.prefs[volume]*100);$('#'+prefix+'-value').textContent=Math.round(audio.prefs[volume]*100)+'%';}
 const muted=!audio.prefs.musicOn&&!audio.prefs.sfxOn;
 $('#quick-mute').textContent=muted?'恢复声音':'静音';$('#quick-mute').setAttribute('aria-label',muted?'一键恢复之前的声音设置':'一键静音');$('#quick-mute').setAttribute('aria-pressed',String(muted));
 $('#audio-status').textContent=audio.error||(!audio.activated?'点一下开启声音':!audio.ready?'声音加载中…':muted?'已静音':'原创声音已就绪');
}
audio.notify=audioUI;audioUI();
for(const prefix of ['music','sfx']){
 $('#'+prefix+'-on').addEventListener('change',event=>{audio.set(prefix+'On',event.target.checked);audio.activate();});
 $('#'+prefix+'-volume').addEventListener('input',event=>{audio.set(prefix+'Volume',Number(event.target.value)/100);audio.activate();});
}
$('#quick-mute').addEventListener('click',()=>{
 if(audio.prefs.musicOn||audio.prefs.sfxOn){quickRestore={musicOn:audio.prefs.musicOn,sfxOn:audio.prefs.sfxOn};try{localStorage.setItem('ssjwl-quick-restore-v1',JSON.stringify(quickRestore));}catch{}audio.set('musicOn',false);audio.set('sfxOn',false);}
 else {audio.set('musicOn',quickRestore.musicOn);audio.set('sfxOn',quickRestore.sfxOn);}
 audio.activate();
});
$('#audio-start').addEventListener('click',()=>audio.activate());
document.addEventListener('pointerdown',()=>audio.activate(),{capture:true});
document.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key))audio.activate();},{capture:true});
let state=createState();
let busy=false,epoch=0;const animations=new Set();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function setBusy(value){busy=value;$('#board').inert=value;$('#board').setAttribute('aria-busy',String(value));}
function cancelEffects(){epoch++;for(const animation of animations)animation.cancel();animations.clear();document.querySelectorAll('.flight').forEach(el=>el.remove());setBusy(false);}
function fly(id,from,to,duration=220){
 if(reduced()||!from||!to)return Promise.resolve();
 const item=items.find(i=>i.id===id),el=document.createElement('div');el.className='flight';el.setAttribute('aria-hidden','true');el.innerHTML=art(id)+`<span>${item.name}</span>`;
 Object.assign(el.style,{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px'});document.body.append(el);
 const x=to.left+to.width/2-from.left-from.width/2,y=to.top+to.height/2-from.top-from.height/2;
 const animation=el.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${x*.12}px,${y*.12-10}px) scale(1.06)`,offset:.22,opacity:1},{transform:`translate(${x}px,${y}px) scale(.48)`,opacity:.75}],{duration,easing:'cubic-bezier(.2,.75,.3,1)',fill:'forwards'});
 animations.add(animation);return animation.finished.catch(()=>{}).finally(()=>{animations.delete(animation);el.remove();});
}
function pulse(selector){const el=$(selector);if(!el||reduced())return;el.classList.remove('landed');void el.offsetWidth;el.classList.add('landed');}
function render(){
 $('#progress').textContent=`${items.filter(i=>state.locations[i.id]==='sorted').length} / 20 已归位`;
 $('#containers').innerHTML=state.active.map(id=>{const c=categories.find(c=>c.id===id);return `<div class="container" data-category="${id}" style="--color:${c.color}"><b>${c.name}</b><span class="count">${count(state,id)} / 5</span><div class="meter"><i style="width:${count(state,id)*20}%"></i></div></div>`;}).join('')||'<div class="container">全部收好啦 ✦</div>';
 $('#board').innerHTML=items.filter(i=>state.locations[i.id]==='board').map(i=>`<button id="${i.id}" class="item ${blocked(state,i.id).length?'blocked':''} ${['r1','r2','r3','r4'].includes(i.id)?'top':''}" style="left:${i.x}px;top:${i.y}px" aria-label="${i.name}，${categories.find(c=>c.id===i.category).name}${blocked(state,i.id).length?'，被压住':''}" data-id="${i.id}">${art(i.id)}<span>${i.name}</span></button>`).join('');
 $('#tray').innerHTML=Array.from({length:capacity},(_,n)=>{const i=items.find(i=>i.id===state.buffer[n]);return `<div class="slot ${i?'filled':''}" data-slot="${n}">${i?art(i.id)+`<span>${i.name}</span>`:n+1}</div>`;}).join('');
 $('#capacity').textContent=`${state.buffer.length} / ${capacity}${state.buffer.length===capacity?' · 满了！':''}`;$('.storage').classList.toggle('warning',state.buffer.length===capacity);
 $('.room').classList.toggle('tidy',state.phase==='won');$('.room').setAttribute('aria-label',state.phase==='won'?'收拾完成的整洁客厅':'猫咪拆过的客厅，待收拾');$('.cat-doodle').textContent=state.phase==='won'?'⌁ 猫：这次真的不拆了喵 ⌁':'⌁ 猫：我没动喵 ⌁';
 if(state.phase!=='playing'){
  const won=state.phase==='won';$('#result-icon').textContent=won?'✦':'⌁';$('#result-title').textContent=won?'客厅恢复清爽！':'哎呀，暂存爆仓了';
  const last=state.events.find(e=>e.type==='overflow');$('#result-text').textContent=won?'20 件归位，暂存清空。沙发舒服了，地毯露出来了——这一屋清爽，是你收出来的。':`3 格已经放满，${items.find(i=>i.id===last?.id)?.name||'这件物品'}的分类还没开放。先收满当前分类换新箱，再拿其他物品。`;
  $('#result').classList.toggle('won',won);
 }
}
function feedback(){
 const e=state.events[0];if(!e)return;const i=items.find(i=>i.id===e.id);
 if(state.phase==='won')audio.play('victory');else if(['blocked','overflow'].includes(e.type))audio.play('warning');else if(e.type==='store')audio.play(state.buffer.length===capacity?'warning':'store');else if(e.type==='sort')audio.play('sort');
 const text={sort:`${i?.name}归位 ✓`,store:`${i?.name}暂存 · ${capacity-state.buffer.length} 格可用`,blocked:`先移开${e.blockers?.map(id=>items.find(i=>i.id===id).name).join('、')}，再拿${i?.name}`,overflow:'第 4 件没有空位，暂存爆仓。'};
 let message=text[e.type]||'';const opens=state.events.filter(e=>e.type==='open');if(opens.length)message+=' · '+opens.map(e=>categories.find(c=>c.id===e.category).name+'开放').join('、');const drains=state.events.filter(e=>e.type==='drain');if(drains.length)message+=`，${drains.length}件暂存自动归位`;
 $('#feedback').textContent=message;$('#feedback').dataset.type=e.type;if(e.type==='blocked')$('#'+e.id)?.classList.add('shake');
}
async function pick(id){
 if(busy||state.phase!=='playing')return;
 const item=items.find(i=>i.id===id),source=$('#'+id);if(!item||!source)return;
 const before=state,from=source.getBoundingClientRect();
 // Capture the OLD category's rectangle, before it can be replaced at completion.
 const target=before.active.includes(item.category)?$(`[data-category="${item.category}"]`):$(`[data-slot="${before.buffer.length}"]`),to=target?.getBoundingClientRect();
 const drainsFrom=Object.fromEntries(before.buffer.map((stored,n)=>[stored,$(`[data-slot="${n}"]`)?.getBoundingClientRect()]));
 state=take(before,id);const first=state.events[0];if(!first)return;
 if(['blocked','overflow'].includes(first.type)){render();feedback();if(state.phase==='lost'&&!$('#result').open)$('#result').showModal();return;}
 const turn=epoch;setBusy(true);if(!reduced())source.style.visibility='hidden';
 $('#feedback').textContent=`${item.name} → ${first.type==='store'?'临时放这儿':categories.find(c=>c.id===item.category).name}`;$('#feedback').dataset.type='flight';
 await fly(id,from,to);if(turn!==epoch)return;
 render();feedback();
 if(first.type==='store')pulse(`[data-slot="${state.buffer.indexOf(id)}"]`);else pulse('#containers');
 const drains=state.events.filter(e=>e.type==='drain');
 await Promise.all(drains.map(e=>{const category=items.find(i=>i.id===e.id).category;return fly(e.id,drainsFrom[e.id],$(`[data-category="${category}"]`)?.getBoundingClientRect(),180);}));
 if(turn!==epoch)return;
 if(drains.length)pulse('#containers');
 if(state.phase==='won'){
  if(!reduced())await new Promise(resolve=>setTimeout(resolve,720));
  if(turn!==epoch)return;if(!$('#result').open)$('#result').showModal();
 }
 setBusy(false);
}
$('#board').addEventListener('click',event=>{const id=event.target.closest('[data-id]')?.dataset.id;if(id)pick(id);});
function restart(){cancelEffects();if($('#result').open)$('#result').close();state=createState();render();$('#feedback').textContent='重新摆好啦。先收满当前分类，再开新箱。';$('#feedback').removeAttribute('data-type');}
$('#restart').addEventListener('click',restart);$('#again').addEventListener('click',restart);
window.addEventListener('resize',()=>{for(const a of animations)a.finish();});
let tutorialSeen=false;try{tutorialSeen=localStorage.getItem('ssjwl-p0-tutorial')==='seen';}catch{}
$('#start').addEventListener('click',()=>{$('#tutorial').close();try{localStorage.setItem('ssjwl-p0-tutorial','seen');}catch{}});
render();if(!tutorialSeen)$('#tutorial').showModal();
