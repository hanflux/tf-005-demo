// One non-blocking narration lane. Cues belong to a gameplay run, never a dialog.
export const VOICE_FILES={intro:'./audio-052/voice-intro.mp3',box:'./audio-052/voice-box.mp3',win:'./audio-052/voice-win.mp3'};
export class VoiceLane{
 constructor(owner){this.owner=owner;this.run=0;this.seen=new Set();this.queue=[];this.current=null;this.buffers=null;this.loading=null;this.error='';this.history=[];this.serial=0;}
 record(type,detail={}){this.history.push({type,run:this.run,t:performance.now(),...detail});if(this.history.length>160)this.history.shift();}
 begin(run){this.cancel('new-run');this.run=run;this.seen.clear();}
 enabled(){const o=this.owner;return o.prefs.voiceOn&&o.prefs.voiceVolume>0;}
 async load(retry=false){
  if(this.buffers||this.loading||!this.owner.ctx||(this.error&&!retry))return this.loading;
  this.loading=(async()=>{try{const rows=await Promise.all(Object.entries(VOICE_FILES).map(async([name,path])=>{const r=await fetch(path);if(!r.ok)throw Error('voice unavailable');return [name,await this.owner.ctx.decodeAudioData(await r.arrayBuffer())];}));this.buffers=Object.fromEntries(rows);this.error='';this.pump();}catch{this.error='人声加载失败，点开启 / 继续声音重试';}finally{this.loading=null;this.owner.notify();}})();return this.loading;
 }
 say(kind,key,run=this.run){
  if(run!==this.run||!VOICE_FILES[kind]||this.seen.has(key))return false;
  this.seen.add(key);
  if(kind==='win')this.queue=this.queue.filter(x=>x.kind!=='intro');
  if(!this.enabled()||document.hidden||this.owner.backgrounded){this.record('skipped',{kind,key});return false;}
  this.queue.push({kind,key,run});this.record('queued',{kind,key});this.pump();return true;
 }
 pump(){
  const o=this.owner;if(this.current||!this.buffers||!o.activated||!this.enabled()||document.hidden||o.backgrounded||o.ctx?.state!=='running')return;
  const cue=this.queue.shift();if(!cue)return;if(cue.run!==this.run){this.pump();return;}
  const source=o.ctx.createBufferSource(),serial=++this.serial;source.buffer=this.buffers[cue.kind];source.connect(o.voiceGain);this.current={...cue,source,serial};o.applyGains();this.record('started',{kind:cue.kind,key:cue.key,duration:source.buffer.duration,contextTime:o.ctx.currentTime});
  source.onended=()=>{source.disconnect();if(this.current?.serial!==serial)return;this.current=null;this.record('ended',{kind:cue.kind,key:cue.key});o.applyGains();o.notify();this.pump();};source.start();o.notify();
 }
 cancel(reason){this.queue=[];const old=this.current;this.current=null;++this.serial;if(old){old.source.onended=null;try{old.source.stop();}catch{}old.source.disconnect();this.record('cancelled',{kind:old.kind,key:old.key,reason});}this.owner.applyGains();}
 snapshot(){return {ready:!!this.buffers,error:this.error,run:this.run,instances:this.current?1:0,current:this.current?{kind:this.current.kind,key:this.current.key}:null,queue:this.queue.map(({kind,key,run})=>({kind,key,run})),durations:this.buffers?Object.fromEntries(Object.entries(this.buffers).map(([k,v])=>[k,v.duration])):{},history:this.history.map(x=>({...x}))};}
}
