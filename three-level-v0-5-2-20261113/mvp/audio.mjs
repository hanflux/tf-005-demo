import {VoiceLane} from './voice.mjs';
const DEFAULT={musicOn:true,sfxOn:true,musicVolume:.45,sfxVolume:.30,voiceOn:true,voiceVolume:.80};
const KEY='ssjwl-audio-v1';
const MUSIC_PATH='./audio-050/carefree-loop.mp3',MUSIC_LOOP_SECONDS=40;
export class GameAudio{
 constructor(){
  this.prefs={...DEFAULT};try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d){for(const k of ['musicOn','sfxOn','voiceOn'])if(typeof d[k]==='boolean')this.prefs[k]=d[k];for(const k of ['musicVolume','sfxVolume','voiceVolume'])if(Number.isFinite(d[k]))this.prefs[k]=Math.max(0,Math.min(1,d[k]));if(!('voiceOn' in d)&&(d.musicOn===false||d.musicVolume===0)&&(d.sfxOn===false||d.sfxVolume===0))this.prefs.voiceOn=false;}}catch{}
  this.ctx=null;this.ready=false;this.activated=false;this.loading=null;this.bgm=null;this.offset=0;this.startedAt=0;this.sounds=new Set();this.starts=0;this.plays={};this.error='';this.notify=()=>{};this.backgrounded=document.hidden;this.voice=new VoiceLane(this);
  document.addEventListener('visibilitychange',()=>this.visibility());
  window.addEventListener('blur',()=>{this.backgrounded=true;this.visibility();});
  window.addEventListener('focus',()=>{this.backgrounded=document.hidden;this.visibility();});
 }
 activate(retryVoice=false){if(this.activating)return retryVoice?this.activating.then(()=>this.voice.load(true)):this.activating;const task=this.activateNow(retryVoice);this.activating=task;return task.finally(()=>{if(this.activating===task)this.activating=null;});}
 async activateNow(retryVoice=false){
  this.activated=true;this.notify();if(this.loading)return this.loading;
  if(!document.hidden)this.backgrounded=false;
  if(!this.ctx){const Context=window.AudioContext||window.webkitAudioContext;if(!Context){this.error='此浏览器暂不支持声音';this.notify();return;}this.ctx=new Context();this.ctx.addEventListener('statechange',()=>this.notify());this.musicGain=this.ctx.createGain();this.sfxGain=this.ctx.createGain();this.voiceGain=this.ctx.createGain();this.voiceGain.connect(this.ctx.destination);this.musicGain.connect(this.ctx.destination);this.sfxGain.connect(this.ctx.destination);this.applyGains();}
  try{if(!document.hidden)await this.ctx.resume();}catch{this.error='请再次点声音按钮';this.notify();return;}
  void this.voice.load(retryVoice);this.voice.pump();if(this.ready){this.sync();return;}
  this.loading=(async()=>{
   try{
    const entries=await Promise.all(['tidy-loop','sort','store','warning','victory'].map(async name=>{const r=await fetch(name==='tidy-loop'?MUSIC_PATH:`../baseline/audio/${name}.wav`);if(!r.ok)throw Error('audio unavailable');return [name,await this.ctx.decodeAudioData(await r.arrayBuffer())];}));
    this.buffers=Object.fromEntries(entries);this.ready=true;this.error='';this.sync();
   }catch{this.error='声音加载失败，点此重试';}finally{this.loading=null;this.notify();}
  })();return this.loading;
 }
 applyGains(){if(!this.ctx)return;const duck=!!this.voice?.current;this.musicGain.gain.setTargetAtTime(this.prefs.musicOn?this.prefs.musicVolume*(duck ? .28 : 1):0,this.ctx.currentTime,.025);this.sfxGain.gain.setTargetAtTime(this.prefs.sfxOn?this.prefs.sfxVolume*(duck ? .6 : 1):0,this.ctx.currentTime,.015);this.voiceGain.gain.setValueAtTime(this.prefs.voiceOn?this.prefs.voiceVolume:0,this.ctx.currentTime);}
 beginRun(run){this.voice.begin(run);}
 narrate(kind,key,run){return this.voice.say(kind,key,run);}
 stopVoice(reason){this.voice.cancel(reason);}

 set(key,value){if(!(key in DEFAULT))return;this.prefs[key]=typeof DEFAULT[key]==='boolean'?!!value:Math.max(0,Math.min(1,Number(value)||0));try{localStorage.setItem(KEY,JSON.stringify(this.prefs));}catch{}if(!this.prefs.voiceOn||this.prefs.voiceVolume===0)this.voice.cancel('muted');this.applyGains();this.sync();this.voice.pump();this.notify();}
 stop(){if(!this.bgm)return;this.offset=(this.offset+this.ctx.currentTime-this.startedAt)%Math.min(MUSIC_LOOP_SECONDS,this.buffers['tidy-loop'].duration);this.bgm.stop();this.bgm.disconnect();this.bgm=null;}
 sync(){
  if(!this.ready||!this.activated||document.hidden||this.backgrounded||!this.prefs.musicOn||this.prefs.musicVolume===0||this.ctx.state!=='running'){this.stop();return;}
  if(this.bgm)return;
  const source=this.ctx.createBufferSource();source.buffer=this.buffers['tidy-loop'];source.loop=true;source.loopEnd=Math.min(MUSIC_LOOP_SECONDS,source.buffer.duration);source.connect(this.musicGain);source.start(0,this.offset);this.startedAt=this.ctx.currentTime;this.bgm=source;this.starts++;this.notify();
 }
 play(kind,group=null){
  if(!this.ready||document.hidden||this.backgrounded||!this.prefs.sfxOn||this.prefs.sfxVolume===0||this.ctx.state!=='running')return {played:false};
  const source=this.ctx.createBufferSource();source.buffer=this.buffers[kind];if(!source.buffer)return {played:false};
  source.feedbackGroup=group;source.connect(this.sfxGain);this.plays[kind]=(this.plays[kind]||0)+1;this.sounds.add(source);source.onended=()=>{this.sounds.delete(source);source.disconnect();};source.start();return {played:true,audioTime:this.ctx.currentTime,performanceTime:performance.now()};
 }
 stopGroup(group){for(const source of this.sounds)if(source.feedbackGroup===group){source.stop();source.disconnect();this.sounds.delete(source);}}
 async visibility(){
  if(!this.ctx)return;
  if(document.hidden||this.backgrounded){this.voice.cancel('background');this.stop();for(const s of this.sounds)s.stop();await this.ctx.suspend();this.notify();}
  else if(this.activated){try{await this.ctx.resume();this.sync();this.notify();}catch{this.error='点声音按钮继续播放';this.notify();}}
 }
 snapshot(){return {prefs:{...this.prefs},ready:this.ready,activated:this.activated,backgrounded:this.backgrounded,contextState:this.ctx?.state||'none',bgmInstances:this.bgm?1:0,sfxInstances:this.sounds.size,bgmStarts:this.starts,musicPath:MUSIC_PATH,loopSeconds:MUSIC_LOOP_SECONDS,decodedMusicSeconds:this.buffers?.['tidy-loop']?.duration||0,sfxPlays:{...this.plays},offset:this.offset,error:this.error,voice:this.voice.snapshot(),mixGains:this.ctx?{music:this.musicGain.gain.value,sfx:this.sfxGain.gain.value,voice:this.voiceGain.gain.value}:null};}
}
