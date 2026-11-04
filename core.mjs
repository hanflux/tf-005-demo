import {items,categories,capacity} from './level.mjs';
export function createState(){return {phase:'playing',locations:Object.fromEntries(items.map(i=>[i.id,'board'])),active:categories.slice(0,2).map(c=>c.id),next:2,buffer:[],events:[],moves:0};}
export function count(s,category){return items.filter(i=>i.category===category&&s.locations[i.id]==='sorted').length;}
export function blocked(s,id){const item=items.find(i=>i.id===id);return item?item.blockedBy.filter(b=>s.locations[b]==='board'):[];}
function settle(s){
  // Drain newly available categories, then replace completed containers, to a fixed point.
  let changed=true;
  while(changed){
    changed=false;
    for(const id of [...s.buffer]){
      const item=items.find(i=>i.id===id);
      if(s.active.includes(item.category)){
        s.buffer=s.buffer.filter(b=>b!==id);s.locations[id]='sorted';
        s.events.push({type:'drain',id});changed=true;
      }
    }
    s.active=s.active.flatMap(category=>{
      if(count(s,category)!==items.filter(i=>i.category===category).length)return [category];
      changed=true;
      if(s.next<categories.length){const next=categories[s.next++].id;s.events.push({type:'open',category:next});return [next];}
      return [];
    });
  }
  if(items.every(i=>s.locations[i.id]==='sorted')&&s.buffer.length===0){s.phase='won';s.events.push({type:'win'});}
}
export function take(previous,id){
  const s=structuredClone(previous);s.events=[];
  if(s.phase!=='playing')return s;
  const item=items.find(i=>i.id===id);
  if(!item||s.locations[id]!=='board')return s;
  const blockers=blocked(s,id);
  if(blockers.length){s.events.push({type:'blocked',id,blockers});return s;}
  s.moves++;
  if(s.active.includes(item.category)){s.locations[id]='sorted';s.events.push({type:'sort',id});}
  else if(s.buffer.length>=capacity){s.phase='lost';s.events.push({type:'overflow',id});return s;}
  else {s.locations[id]='buffer';s.buffer.push(id);s.events.push({type:'store',id});}
  settle(s);return s;
}
