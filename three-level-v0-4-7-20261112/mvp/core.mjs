// Rules receive their level explicitly. No global selected-level state.
export function createState(level){return {levelId:level.id,phase:'playing',locations:Object.fromEntries(level.items.map(i=>[i.id,'board'])),active:level.categories.slice(0,2).map(c=>c.id),next:2,buffer:[],events:[],history:[],attempts:0,moves:0};}
export function count(level,s,category){return level.items.filter(i=>i.category===category&&s.locations[i.id]==='sorted').length;}
export function blocked(level,s,id){const item=level.items.find(i=>i.id===id);return item?item.blockedBy.filter(b=>s.locations[b]==='board'):[];}
function settle(level,s){
 let changed=true;
 while(changed){
  changed=false;
  for(const id of [...s.buffer]){
   const item=level.items.find(i=>i.id===id);
   if(s.active.includes(item.category)){s.buffer=s.buffer.filter(b=>b!==id);s.locations[id]='sorted';s.events.push({type:'drain',id});changed=true;}
  }
  s.active=s.active.flatMap(category=>{
   if(count(level,s,category)!==level.items.filter(i=>i.category===category).length)return [category];
   changed=true;if(s.next<level.categories.length){const next=level.categories[s.next++].id;s.events.push({type:'open',category:next});return [next];}return [];
  });
 }
 if(level.items.every(i=>s.locations[i.id]==='sorted')&&s.buffer.length===0){s.phase='won';s.events.push({type:'win'});}
}
function finish(previous,s,id){
 s.attempts++;
 s.history=[...previous.history,{step:s.attempts,id,events:structuredClone(s.events),before:{buffer:[...previous.buffer],active:[...previous.active]},after:{buffer:[...s.buffer],active:[...s.active],phase:s.phase}}].slice(-5);
 return s;
}
export function take(level,previous,id){
 if(previous.levelId!==level.id)throw Error('Level/state mismatch');
 const s=structuredClone(previous);s.events=[];
 if(s.phase!=='playing')return s;
 const item=level.items.find(i=>i.id===id);if(!item||s.locations[id]!=='board')return s;
 const blockers=blocked(level,s,id);
 if(blockers.length){s.events.push({type:'blocked',id,blockers});return finish(previous,s,id);}
 s.moves++;
 if(s.active.includes(item.category)){s.locations[id]='sorted';s.events.push({type:'sort',id});}
 else if(s.buffer.length>=level.capacity){s.phase='lost';s.events.push({type:'overflow',id});return finish(previous,s,id);}
 else{s.locations[id]='buffer';s.buffer.push(id);s.events.push({type:'store',id});}
 settle(level,s);return finish(previous,s,id);
}
