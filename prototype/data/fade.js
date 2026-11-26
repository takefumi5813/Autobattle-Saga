/* 画面の移り変わり（2026-11-26、オーナー「画面の遷移がパッと切り替わるのは微妙に違和感ある」）。
   町・建物の中・神殿の画面・旅（フィールド）・帰還の画面などが切り替わるとき、前の画面の写しを上に重ね、ゆっくり消して新しい画面へ溶かす。
   画面を出す関数（renderTown / renderPrep / renderStart / startBattle / renderResult）を包み、呼ぶ前と後で「いまの画面」が変わったときだけ動く
   （同じ画面の中の更新、たとえばボタンを押して板を描き直すだけのときは何もしない）。最後に読み込む */
(function(){
  const DUR=420;
  /* いまの画面の鍵：町の中（建物ごと）／神殿の画面のタブ／旅／帰還 */
  function screenKey(){const tw=document.getElementById('townwalk');
    if(tw)return 'town:'+(typeof TOWN_IN!=='undefined'&&TOWN_IN?TOWN_IN:'')+':'+((tw.querySelector('.tw-name b')||{}).textContent||'');
    const v=document.getElementById('view');if(!v)return '';
    if(v.querySelector('#field'))return 'field';
    const f=v.firstElementChild;return 'view:'+(f?f.className:'')+':'+(typeof PREP_TAB!=='undefined'?PREP_TAB:'');}
  /* 前の画面の写し（描いた canvas の中身も写す） */
  function snap(){const tw=document.getElementById('townwalk');const src=tw||document.getElementById('view');if(!src||!src.firstChild)return null;
    const r=tw?{left:0,top:0,width:innerWidth,height:innerHeight}:src.getBoundingClientRect();
    const c=src.cloneNode(true);const a=src.querySelectorAll('canvas'),b=c.querySelectorAll('canvas');
    a.forEach((cv,i)=>{try{const x=b[i].getContext('2d');x.drawImage(cv,0,0);}catch(e){}});
    c.removeAttribute('id');c.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
    const w=document.createElement('div');w.className='scr-fade';
    w.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;overflow:hidden;pointer-events:none;z-index:2147483000;opacity:1;background:${tw?'#000':getComputedStyle(document.body).backgroundColor||'#000'}`;
    if(tw){c.style.position='absolute';c.style.inset='0';}else{c.style.margin='0';c.style.width=r.width+'px';}
    w.appendChild(c);return w;}
  function play(w,fromTown){if(!w)return;
    // 町や旅の絵の画面からは、いったん少し暗くしてから溶かす（場面が変わった感じ）
    const dim=document.createElement('div');dim.style.cssText='position:absolute;inset:0;background:#000;opacity:0;transition:opacity 160ms ease-out';w.appendChild(dim);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{dim.style.opacity=fromTown?'.45':'.2';w.style.transition=`opacity ${DUR}ms ease-in-out ${fromTown?120:60}ms`;w.style.opacity='0';}));
    setTimeout(()=>w.remove(),DUR+400);}
  let busy=null;   // 入れ子で呼ばれたとき（renderTown の中から renderPrep など）は外側の一つだけ
  function wrap(name){const f=window[name];if(typeof f!=='function'||f.__faded)return;
    const g=function(...args){if(busy)return f.apply(this,args);let k0='',w=null;
      if(pending){k0=pending.k;w=pending.w;pending=null;}else{try{k0=screenKey();w=snap();}catch(e){w=null;}}
      const fromTown=k0.startsWith('town')||k0==='field';
      if(w)document.body.appendChild(w);busy=w||true;   // 先に前の画面の写しを被せておく（読み込みのあいだ新しい画面の黒い下地が見えない）
      const done=()=>{busy=null;try{if(w){if(screenKey()!==k0)play(w,fromTown);else w.remove();}}catch(e){w&&w.remove();}};
      let r;try{r=f.apply(this,args);}catch(e){done();throw e;}
      if(r&&typeof r.then==='function'){r.then(done,done);}else done();return r;};
    g.__faded=true;window[name]=g;}
  for(const n of ['renderTown','renderPrep','renderStart','startBattle','renderResult'])wrap(n);
  /* 町を閉じる（twStop）と町の絵が先に消えるので、閉じる直前に写しておき、すぐ後の画面の切り替えで使う */
  let pending=null;
  {const f=window.twStop;if(typeof f==='function'){window.twStop=function(...a){if(!busy&&!pending&&document.getElementById('townwalk')){try{const p={k:screenKey(),w:snap()};pending=p;setTimeout(()=>{if(pending===p)pending=null;},0);}catch(e){}}return f.apply(this,a);};}}
})();
