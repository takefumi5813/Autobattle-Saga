/* BGM（2026-11-25、soundraw で作った曲。prototype/audio/ の mp3）。
   場面ごとに曲を切り替え、つなぎ目は0.8秒で重ねて入れ替える。曲がない場面は近い場面の曲（なければ無音）。
   ブラウザは操作するまで音を出させないので、最初のクリックで鳴り始める。音量は画面右下の ♪ ボタンで 大→中→小→消 と切り替え、ブラウザに覚える。 */
const BGM_FILES={battle:'audio/battle.mp3',boss:'audio/boss.mp3',road:'audio/road.mp3',dungeon:'audio/dungeon.mp3',town:'audio/town.mp3',camp:'audio/camp.mp3'};
const BGM_FALLBACK={boss:'battle',dungeon:'road',camp:'town',town:'road',road:'town',battle:null};
const BGM_VOLS=[.55,.35,.18,0];
const BGM={cur:null,want:null,el:null,missing:{},vol:(()=>{try{const v=localStorage.getItem('shintaku-bgm-vol');return v==null?1:+v;}catch(e){return 1;}})(),unlocked:false};
function bgmLevel(){return BGM_VOLS[BGM.vol]??.35;}
function bgmResolve(k){const seen=new Set();while(k&&(BGM.missing[k]||!BGM_FILES[k])&&!seen.has(k)){seen.add(k);k=BGM_FALLBACK[k];}return k&&!BGM.missing[k]?k:null;}
/* 場面を伝える（毎フレーム呼んでよい。変わったときだけ切り替える） */
function bgmScene(key){BGM.want=key;if(!BGM.unlocked)return;const k=bgmResolve(key);if(k===BGM.cur)return;bgmSwitch(k);}
function bgmSwitch(k){const old=BGM.el;BGM.cur=k;BGM.el=null;
  if(old){const a=old;const v0=a.volume;const t0=performance.now();const f=()=>{const p=Math.min(1,(performance.now()-t0)/800);a.volume=v0*(1-p);if(p<1)requestAnimationFrame(f);else{a._stop=true;a.pause();}};f();}   // 止めるだけ（src を消すと error が起きて「曲がない」と誤解していた）
  if(!k)return;const a=new Audio(BGM_FILES[k]);a.loop=true;a.volume=0;BGM.el=a;
  a.addEventListener('error',()=>{if(a._stop)return;BGM.missing[k]=true;if(BGM.el===a){BGM.cur=null;BGM.el=null;bgmScene(BGM.want);}},{once:true});
  a.play().then(()=>{const t0=performance.now();const f=()=>{if(BGM.el!==a)return;const p=Math.min(1,(performance.now()-t0)/800);a.volume=bgmLevel()*p;if(p<1)requestAnimationFrame(f);};f();}).catch(()=>{});}
function bgmSetVol(i){BGM.vol=i;try{localStorage.setItem('shintaku-bgm-vol',String(i));}catch(e){}if(BGM.el)BGM.el.volume=bgmLevel();bgmButton();}
function bgmButton(){let b=document.getElementById('bgmbtn');if(!b){b=document.createElement('button');b.id='bgmbtn';b.type='button';
    b.style.cssText='position:fixed;right:10px;top:10px;z-index:50;font:600 12px/1 sans-serif;padding:7px 10px;border:1px solid rgba(0,0,0,.35);background:rgba(20,20,24,.82);color:#f2c230;cursor:pointer;border-radius:2px';
    b.onclick=e=>{e.stopPropagation();bgmUnlock();bgmSetVol((BGM.vol+1)%BGM_VOLS.length);};document.body.appendChild(b);}
  b.textContent='♪ '+['大','中','小','消'][BGM.vol];b.title='BGMの音量（押すたびに 大→中→小→消）';}
function bgmUnlock(){if(BGM.unlocked)return;BGM.unlocked=true;if(BGM.want)bgmScene(BGM.want);}
addEventListener('pointerdown',bgmUnlock,{capture:true});addEventListener('keydown',bgmUnlock,{capture:true});
addEventListener('DOMContentLoaded',bgmButton);if(document.readyState!=='loading')setTimeout(bgmButton,0);
