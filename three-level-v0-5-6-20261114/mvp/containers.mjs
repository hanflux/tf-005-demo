// All categories share one original flat-illustrated ordinary storage box.
export const containerKind=(level,id)=>level.id==='l2'?({toy:'paper',cat:'tools',daily:'daily',recycle:'recycle'}[id]):id;
export function containerHTML(level,category,n,total,uid){
 const kind=containerKind(level,category.id),front=true;
 return `<div class="bin ${front?'l1-front-bin':''}" data-category="${category.id}" data-kind="${kind}" data-state="${n===total?'full':n?'collecting':'empty'}" aria-label="${category.name}，${n} / ${total}"><img class="container-art" src="${front?'./art-047/storage-front.svg':'./art-046/storage-box.webp'}" alt="" draggable="false"><span class="bin-mouth" aria-hidden="true"></span><div class="bin-label"><b>${category.name}</b><span class="bin-count">${n} / ${total}</span></div><span class="bin-complete" aria-hidden="true">收好 ✓</span></div>`;
}

// A voluntary simulation; never launches an ad or changes state on opening.
export function lockedPlaceholderHTML(enabled=true){return `<button type="button" class="l1-front-bin locked-placeholder" ${enabled?'':'disabled'} aria-label="第三箱已锁，测试帮助，不播放广告"><img class="container-art" src="./art-047/storage-front.svg" alt="" draggable="false"><span class="bin-label"><b>第三箱 · 已锁</b><span class="bin-count">测试帮助</span></span></button>`;}
export function finishedPlaceholderHTML(help=true){return `<div class="l1-front-bin locked-placeholder" aria-label="本局收纳箱已收好"><img class="container-art" src="./art-047/storage-front.svg" alt=""><span class="bin-label"><b>收好 ✓</b><span class="bin-count">${help?'本局帮助已开启':'分类已归位'}</span></span></div>`;}
