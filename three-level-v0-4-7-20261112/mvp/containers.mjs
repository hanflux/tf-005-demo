// All categories share one original flat-illustrated ordinary storage box.
export const containerKind=(level,id)=>level.id==='l2'?({toy:'paper',cat:'tools',daily:'daily',recycle:'recycle'}[id]):id;
export function containerHTML(level,category,n,total,uid){
 const kind=containerKind(level,category.id),front=level.id==='l1';
 return `<div class="bin ${front?'l1-front-bin':''}" data-category="${category.id}" data-kind="${kind}" data-state="${n===total?'full':n?'collecting':'empty'}" aria-label="${category.name}，${n} / ${total}"><img class="container-art" src="${front?'./art-047/storage-front.svg':'./art-046/storage-box.webp'}" alt="" draggable="false"><span class="bin-mouth" aria-hidden="true"></span><div class="bin-label"><b>${category.name}</b><span class="bin-count">${n} / ${total}</span></div><span class="bin-complete" aria-hidden="true">收好 ✓</span></div>`;
}

// Deliberately no data-category / bin-mouth, listener, reward or network action.
export function adPlaceholderHTML(){return `<button type="button" class="l1-front-bin ad-placeholder" disabled aria-label="广告位，暂未开放，仅为视觉占位，无解锁或奖励功能"><img class="container-art" src="./art-047/storage-front.svg" alt="" draggable="false"><span class="bin-label"><b>广告位</b><span class="bin-count">暂未开放</span></span></button>`;}
