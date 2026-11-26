/* ============ 雇われのあいだ（2026-11-26） ============
   オーナー「雇われなのに陣形を動かせるのはおかしい。陣形全体への命令ができるのもおかしい。決められるのはリーダーの指示に従った範囲での調整だけ。
   意見は可能だが聞いてもらえるかわからないように。雇われなのに戒律も指示できるのはおかしい」
   - 戒律は隊長の気質で決まる（HIRE_POL）。こちらは「意見する」だけ。聞いてもらえるかは隊長しだい（慎重45%・豪胆30%・無鉄砲15%、ランクで少し上がる）。一つの戒律につき雇われ一回に一度
   - 陣形の置き場所と陣形全体の型は隊長が決める。自分の一行の者だけ、動き方（構える・攻める・回り込む）を調整できる（S.hire.adj）
   - 戦いの計算は polOf()（雇われなら隊長の戒律）を見る */
const HIRE_POL={慎重:{target:'weak',heal:'50',rescue:'first',combo:'safe',retreat:'two',camp:'watch'},
  豪胆:{target:'strong',heal:'30',rescue:'situ',combo:'aggressive',retreat:'lost',camp:'rest'},
  無鉄砲:{target:'strong',heal:'30',rescue:'situ',combo:'aggressive',retreat:'never',camp:'rest'}};
const HIRE_YES={慎重:.45,豪胆:.3,無鉄砲:.15};
function hireCap(){const H=S.hire;if(!H)return null;return H.cap||({two:'慎重',lost:'豪胆',never:'無鉄砲'}[H.pol])||'慎重';}
function hirePol(){const H=S.hire;if(!H.policy){H.policy=Object.assign({},HIRE_POL[hireCap()]);if(H.pol)H.policy.retreat=H.pol;}return H.policy;}
function polOf(){return S.hire?hirePol():S.policy;}
function hireOpine(k,v){const H=S.hire;if(!H)return;H.asked=H.asked||{};if(H.asked[k])return;H.asked[k]=1;const P=hirePol();const law=LAWS.find(l=>l[0]===k);const opt=law[2].find(o=>o[0]===v);
  const cap=hireCap();let p=HIRE_YES[cap]+Math.max(0,rankIdx(rankOf())-1)*.05;const ok=Math.random()<p;
  if(ok){P[k]=v;prepMsgs.push(`「${H.name}」の隊長（${cap}）に、${law[1]}は「${opt[1]}」でと意見した。隊長「……一理ある。今回はそうしよう」`);}
  else prepMsgs.push(`「${H.name}」の隊長（${cap}）に、${law[1]}は「${opt[1]}」でと意見した。隊長「${cap==='慎重'?'気持ちは分かるが、隊のやり方に従ってもらう':cap==='豪胆'?'雇われが口を出すな。黙ってついてこい':'うるせえ。俺のやり方でいく'}」`);}
/* 旅立ちの画面：戒律（隊長が決める。意見だけ） */
function hireLawsHtml(){const H=S.hire;const P=hirePol();H.asked=H.asked||{};
  let h=`<div class="hd">戒律<small>「${H.name}」の隊長が決める</small></div><div class="fr"><p class="mini2" style="margin:0 0 8px">隊長は${hireCap()}。こちらからは意見するだけ。聞いてもらえるかは分からない（一つにつき一度）</p>`;
  for(const [k,label,opts] of LAWS){const asked=H.asked[k];
    h+=`<div class="law">${ico(label)}<span>${label}</span><div class="seg">${opts.map(([v,t,tip])=>P[k]===v?`<button class="on" disabled title="隊長の決め">${t}</button>`:`<button data-opine="${k}|${v}" ${asked?'disabled':''} title="${asked?'もう意見した':'隊長に「'+t+'」を意見する（'+tip+'）'}">${t}</button>`).join('')}</div>${asked?'<small class="mini2">意見済み</small>':''}</div>`;}
  return h+`</div>`;}
/* 陣形：置き場所は隊長の決め。自分の一行の者の動き方だけ調整できる */
function hireFormHtml(ids){const cols=['後','中','前'],rows=['左','中','右'];
  let h=`<div class="hd" style="margin-top:16px">陣形<small>隊長の陣形</small></div><div class="fr frm"><p class="mini2" style="margin:0 0 8px">置き場所は隊長が決める。自分の一行の者は、隊長の指示の範囲で動き方だけ変えられる</p>
    <div class="pitch"><span class="pe">敵 ▶</span>${rows.map(r=>cols.map(c=>{const here=ids.filter(id=>formOf(id).c===c+r);return `<div class="cell">${here.map(id=>`<span class="fp">${faceBox(id)}</span>`).join('')}</div>`;}).join('')).join('')}</div>
    <div class="fms">${ids.map(id=>{const f=formOf(id);const mine=!isTemp(id);return `<div class="fm"><span class="fmw">${faceBox(id)}<b>${CHAR_DB[id].name}</b><small>${f.c[0]}・${f.c[1]}${mine?'':'・隊の者'}</small></span>
      <div class="seg">${Object.entries(FORM_MOVE).map(([m,n])=>mine?`<button class="${f.m===m?'on':''}" data-hmove="${id}|${m}">${n}</button>`:`<button class="${f.m===m?'on':''}" disabled>${n}</button>`).join('')}</div></div>`;}).join('')}</div></div>`;
  return h;}
function bindHire(){
  document.querySelectorAll('[data-opine]').forEach(b=>b.onclick=()=>{const [k,v]=b.dataset.opine.split('|');hireOpine(k,v);persist();renderPrep();});
  document.querySelectorAll('[data-hmove]').forEach(b=>b.onclick=()=>{const [id,m]=b.dataset.hmove.split('|');S.hire.adj=S.hire.adj||{};S.hire.adj[id]=m;persist();renderPrep();});}
