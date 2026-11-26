/* ============ 町を出る（2026-11-26） ============
   オーナー「地図上で移動を決めるというより、町から出るとマップが出て、そこからどこに向かえるかを決める。
   突然よくわからないところに向かっているので、町や施設から出るとワールドマップになって、フィールド上を移動していくように（FF12）。
   雇われのときは自分で動けないので、どこかに集合して、あとは言われたとおりに動いていく」
   - 町の出口に立つと「町を出る」→ この画面。世界地図で行き先を選び（知っている町・区画・迷宮・未踏の「？」）、出発するとフィールドを歩いて向かう
   - 管理画面からは旅立たない（管理画面の「旅立ち」は「支度」：一行・戒律・陣形）
   - 雇われのとき：行き先は雇い主が決めている。地図は見られるが選べない。「隊に合流して出発」だけ */
let DEPART=false;
function departScreenHtml(ids){const k=S.base;const t=TOWNS[k];
  let h=`<div class="tm dp"><nav class="tm-nav"><div class="crest">${ico('門')}<b>${t.name}を出る</b>${calTxt()}<span class="goldv">金 <b>${S.gold}</b></span><span class="goldv">食糧 <b>${S.ration}</b></span></div>
    <button class="tw-out" id="dpback">町へ戻る</button></nav>`;
  h+=`<div class="wld"><div>${contTabs()}<div class="fr">${mapSvg()}</div></div><div style="display:flex;flex-direction:column;gap:14px">`;
  // 一行
  h+=`<div><div class="hd">一行<small>${ids.length}人</small></div><div class="fr dp-party">${ids.map(id=>`<span title="${CHAR_DB[id].name}">${faceBox(id)}</span>`).join('')}<span class="mini2" style="margin-left:auto">${lifeDockHtml(ids,1)}</span></div></div>`;
  if(S.hire){const H=S.hire;const d=PLACE(S.diveTo);
    h+=`<div><div class="hd">雇われ<small>「${H.name}」</small></div><div class="fr"><p>「${H.name}」の隊は町の外で待っている。行き先は隊長が決めた<b>${d?d.name:'迷宮'}</b>。こちらは隊に合流して、言われたとおりについていく</p>
      <div class="chips2 rt">${diveNodes().map(n=>`<span class="c">${shortName(PLACE(n).name)}</span>`).join('<i>›</i>')}</div>
      <button class="go" id="go" style="margin-top:12px"><b>隊に合流して出発</b><small>DEPART</small></button></div></div>`;}
  else{h+=`<div><div class="hd">行き先<small>地図の場所を選ぶ</small></div><div class="fr">${WSEL?wInfoHtml():'<p class="mini2">地図の上の町・区画・迷宮・「？」を選ぶ。行き先までは、フィールドを区画づたいに歩いて向かう</p>'}${departGoHtml()}</div></div>`;}
  h+=`</div></div></div>`;
  return h;}
/* 迷宮が行き先に決まっているとき：潜る階と出発 */
function departGoHtml(){if(!WSEL||!AREAS[WSEL]||AREAS[WSEL].kind!=='dungeon'||(S.diveTo||'great')!==WSEL)return '';
  const ids=partyIds();const fls=[];if(WSEL==='great')for(let f=3;f<=S.depth;f++)fls.push(f);const camps=diveNodes().filter(isArea).length;const cost=tripCost(ids,camps,diveNodes());
  return `<div style="margin-top:10px">${fls.length?`<div class="flr" role="radiogroup" aria-label="潜る階">${fls.map(f=>`<button role="radio" aria-checked="${f===S.floor}" class="${f===S.floor?'on':''}${f===S.depth?' new':''}" data-floor="${f}">B${f}<small>×${floorMul(f).toFixed(2)}</small></button>`).join('')}</div>`:''}
    <p class="mini2">道のり：${diveNodes().map(n=>shortName(PLACE(n).name)).join('・')}（野営${camps}夜）・支度 金${cost}${S.gold<cost?'（足りない）':''}</p>
    <button class="go" id="go"><b>ここへ向かう</b><small>DEPART</small></button></div>`;}
function bindDepart(){if($('#dpback'))$('#dpback').onclick=()=>{DEPART=false;WSEL=null;renderTown({});};}
/* ---- フィールドを移動しているあいだ、右上に世界地図（2026-11-26、オーナー「移動中は右上に世界地図を出しておく」） ----
   いまいる区画（町・迷宮）に印、今回の道のりを黄色い点線で。区画が変わったときだけ描き直す。押すと大きくなる */
function fWorldInsetHere(){if(!B||!B.plan)return null;const nodes=(B.layout&&B.layout.trip&&B.layout.trip.nodes)||[];const st=B.plan[B.si];
  if(!st)return nodes[0]||S.base;if(st.area)return st.area;if(st.t==='arrive')return st.to;if(st.t==='dun'||st.t==='dunrest')return nodes[nodes.length-1];return nodes[0]||S.base;}
function fWorldInset(){const el=document.getElementById('fworld');if(!el||!B)return;const here=fWorldInsetHere();const key=here+'|'+B.si;if(el.dataset.k===key)return;el.dataset.k=key;
  const P=PLACE(here);const keep=WCONT;if(P&&P.cont)WCONT=P.cont;let svg='';try{svg=mapSvg();}finally{WCONT=keep;}
  const nodes=((B.layout&&B.layout.trip&&B.layout.trip.nodes)||[]).filter(k=>PLACE(k)&&PLACE(k).x!=null&&(!P||PLACE(k).cont===P.cont));
  let add='';if(nodes.length>1)add+=`<polyline points="${nodes.map(k=>PLACE(k).x+','+PLACE(k).y).join(' ')}" fill="none" stroke="#ffd23a" stroke-width="1.6" stroke-dasharray="3 2" opacity=".9"/>`;
  if(P&&P.x!=null)add+=`<circle cx="${P.x}" cy="${P.y-2}" r="9" fill="none" stroke="#ffd23a" stroke-width="1.6"><animate attributeName="r" values="6;11;6" dur="1.6s" repeatCount="indefinite"/></circle><circle cx="${P.x}" cy="${P.y-2}" r="2.6" fill="#ffd23a"/>`;
  el.innerHTML=svg.replace('</svg>',add+'</svg>')+`<span class="fwn">${P?P.name:''}</span>`;}
/* 地図は二つとも、ふだんは小さく、マウスを載せたときだけ大きく（2026-11-26、オーナー）。右上の世界地図は CSS の :hover、左上の近くの地図は画面の左上にマウスがあるかで */
document.addEventListener('mousemove',e=>{const c=document.getElementById('field');if(!c||typeof FLD==='undefined')return;const r=c.getBoundingClientRect();const k=r.width/256;
  const x=(e.clientX-r.left)/k,y=(e.clientY-r.top)/k;const big=FLD.miniHover;FLD.miniHover=x>=0&&y>=0&&x<(big?128:52)&&y<(big?102:42);});
