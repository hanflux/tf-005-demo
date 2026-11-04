import {createState,take,blocked,count} from './core.mjs';
import {items,categories,capacity} from './level.mjs';
import {art} from './art.mjs';
import {GameAudio} from './audio.mjs';
const $=s=>document.querySelector(s);
const audio=new GameAudio();
function audioUI(){
 for(const [prefix,on,volume] of [['music','musicOn','musicVolume'],['sfx','sfxOn','sfxVolume']]){$('#'+prefix+'-on').checked=audio.prefs[on];$('#'+prefix+'-volume').value=Math.round(audio.prefs[volume]*100);$('#'+prefix+'-value').textContent=Math.round(audio.prefs[volume]*100)+'%';}
 $('#audio-status').textContent=audio.error||(!audio.activated?'点一下开启声音':!audio.ready?'声音加载中…':!audio.prefs.musicOn&&!audio.prefs.sfxOn?'已静音':'原创声音已就绪');
}
audio.notify=audioUI;audioUI();
for(const prefix of ['music','sfx']){
 $('#'+prefix+'-on').addEventListener('change',event=>{audio.set(prefix+'On',event.target.checked);audio.activate();});
 $('#'+prefix+'-volume').addEventListener('input',event=>{audio.set(prefix+'Volume',Number(event.target.value)/100);audio.activate();});
}
$('#audio-start').addEventListener('click',()=>audio.activate());
document.addEventListener('pointerdown',()=>audio.activate(),{capture:true});
document.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key))audio.activate();},{capture:true});
let state=createState();
function render(){
  $('#progress').textContent=`${items.filter(i=>state.locations[i.id]==='sorted').length} / 20 已归位`;
  $('#containers').innerHTML=state.active.map(id=>{const c=categories.find(c=>c.id===id);return `<div class="container" style="--color:${c.color}"><b>${c.name}</b><span class="count">${count(state,id)} / 5</span><div class="meter"><i style="width:${count(state,id)*20}%"></i></div></div>`;}).join('')||'<div class="container">全部收好啦 ✦</div>';
  $('#board').innerHTML=items.filter(i=>state.locations[i.id]==='board').map(i=>`<button id="${i.id}" class="item ${blocked(state,i.id).length?'blocked':''} ${['r1','r2','r3','r4'].includes(i.id)?'top':''}" style="left:${i.x}px;top:${i.y}px" aria-label="${i.name}，${categories.find(c=>c.id===i.category).name}${blocked(state,i.id).length?'，被压住':''}" data-id="${i.id}">${art(i.id)}<span>${i.name}</span></button>`).join('');
  $('#tray').innerHTML=Array.from({length:capacity},(_,n)=>{const i=items.find(i=>i.id===state.buffer[n]);return `<div class="slot ${i?'filled':''}">${i?art(i.id)+`<span>${i.name}</span>`:n+1}</div>`;}).join('');
  $('#capacity').textContent=`${state.buffer.length} / ${capacity}${state.buffer.length===capacity?' · 满了！':''}`;
  $('.storage').classList.toggle('warning',state.buffer.length===capacity);
  if(state.phase!=='playing'){
    const won=state.phase==='won';$('#result-icon').textContent=won?'✦':'⌁';
    $('#result-title').textContent=won?'客厅恢复清爽！':'哎呀，暂存爆仓了';
    const last=state.events.find(e=>e.type==='overflow');
    $('#result-text').textContent=won?'20 件全归位。猫咪负责拆，你负责收——再来一局试试更从容？':`3 格已经放满，${items.find(i=>i.id===last?.id)?.name||'这件物品'}的分类还没开放。先收满当前分类换新箱，再拿其他物品。`;
    if(!$('#result').open)$('#result').showModal();
  }
}
function feedback(){
 const e=state.events[0];if(!e)return;
 const i=items.find(i=>i.id===e.id);
 if(state.phase==='won')audio.play('victory');else if(['blocked','overflow'].includes(e.type))audio.play('warning');else if(e.type==='store')audio.play(state.buffer.length===capacity?'warning':'store');else if(e.type==='sort')audio.play('sort');
 const text={sort:`${i?.name}归位 ✓`,store:`${i?.name}暂存 · ${capacity-state.buffer.length} 格可用`,blocked:`先移开${e.blockers?.map(id=>items.find(i=>i.id===id).name).join('、')}，再拿${i?.name}`,overflow:'第 4 件没有空位，暂存爆仓。'};
 let message=text[e.type]||'';
 const opens=state.events.filter(e=>e.type==='open');if(opens.length)message+=' · '+opens.map(e=>categories.find(c=>c.id===e.category).name+'开放').join('、');
 const drains=state.events.filter(e=>e.type==='drain');if(drains.length)message+=`，${drains.length}件暂存自动归位`;
 $('#feedback').textContent=message;$('#feedback').dataset.type=e.type;
 if(e.type==='blocked')$('#'+e.id)?.classList.add('shake');
}
$('#board').addEventListener('click',event=>{const id=event.target.closest('[data-id]')?.dataset.id;if(!id)return;state=take(state,id);render();feedback();});
function restart(){if($('#result').open)$('#result').close();state=createState();render();$('#feedback').textContent='重新摆好啦。先收满当前分类，再开新箱。';}
$('#restart').addEventListener('click',restart);$('#again').addEventListener('click',restart);
let tutorialSeen=false;try{tutorialSeen=localStorage.getItem('ssjwl-p0-tutorial')==='seen';}catch{}
$('#start').addEventListener('click',()=>{$('#tutorial').close();try{localStorage.setItem('ssjwl-p0-tutorial','seen');}catch{}});
render();if(!tutorialSeen)$('#tutorial').showModal();
