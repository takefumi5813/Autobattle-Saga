/* ============ 町を歩く（2026-11-26） ============
   オーナー「町が管理画面の一項目なのが気持ち悪い。管理画面はステータスを開いた画面。町はRPGの一つの町として作りこむ」
   「最初は、オープニングで語られた町にたどり着いた場面で始まる」
   - 町はフィールドと同じ絵（FLD.bg の家・宿・礼拝堂・門・井戸・露店…、人物は FLD.ch）で組んだ、歩ける地図
   - 建物の戸口に立って入ると、その施設の中（店・宿・酒場…）。中の画面は前の「町」タブの施設の板をそのまま使う
   - 住人が通りを歩いている。話しかけると前と同じ talkTo()。名のある人物（S.where）も町の中を歩いていて、探して声をかける
   - 南の門から出ると旅の支度（管理画面の旅立ち）。右上の「メニュー」がステータスの画面（管理画面）
   - 町の並びは町ごとに決まった形（S.wseed と町の鍵から）。大陸ごとに空気の色を変える（雪・桜・砂・密林・魔の黄昏） */
let TW=null;          // 歩いている町の状態
let TOWN_IN=null;     // 入っている建物（施設の鍵）
const TW_FAC_ART={home:'house2',inn:'inn',shrine:'chapel',tavern:'house2',tool:'house1',weapon:'house3',armor:'house1',smith:'house3',guild:'house2',maps:'house1',grimoire:'house3',jewel:'house2',dojo:'house3'};
const TW_AIR={
  c0:{tint:null,ground:'grass'},
  c1:{tint:'rgba(214,230,255,.28)',ground:'grass',snow:1},
  c2:{tint:'rgba(255,214,226,.10)',ground:'grass',petal:1},
  c3:{tint:'rgba(255,196,110,.20)',ground:'dirt',sand:1},
  c4:{tint:'rgba(40,120,50,.14)',ground:'tforest',lush:1},
  c5:{tint:'rgba(80,50,130,.20)',ground:'tmud'}};
const twAir=k=>TW_AIR[(TOWNS[k]||{}).cont]||TW_AIR.c0;

/* ---- 町の並び ---- */
function twLayout(k){
  const r=seeded(S.wseed+':walk:'+k);const sz=townSize(k);
  const rows=sz==='small'?2:3, W=sz==='large'?608:sz==='mid'?512:448;
  const fs=townFacilities(k).concat((S.homes||{})[k]?['home']:[]).slice().sort((a,b)=>({inn:0,tavern:1,shrine:2}[a]??5)-({inn:0,tavern:1,shrine:2}[b]??5));
  const cx=Math.round(W/2);const slots=[];const top=40;
  const bases=[];for(let i=0;i<rows;i++)bases.push(top+100+i*132);
  for(let ri=0;ri<rows;ri++){const by=bases[ri];const xs=[];
    for(let x=cx-78;x>=52;x-=100)xs.push(x);for(let x=cx+78;x<=W-52;x+=100)xs.push(x);
    xs.sort((a,b)=>Math.abs(a-cx)-Math.abs(b-cx));for(const x of xs)slots.push({x,by,ri,d:Math.abs(x-cx)+ri*40});}
  // 広場に近い所から、施設を置く（真ん中の通りの段を優先）
  const mid=Math.floor((rows-1)/2);slots.sort((a,b)=>(Math.abs(a.ri-mid)*60+a.d)-(Math.abs(b.ri-mid)*60+b.d));
  const blds=[];
  fs.forEach((f,i)=>{const s=slots[i];if(!s)return;blds.push({f,art:TW_FAC_ART[f]||'house1',x:s.x,by:s.by});});
  for(const s of slots.slice(fs.length))if(r()<.8)blds.push({f:null,art:['house1','house2','house3'][Math.floor(r()*3)],x:s.x+Math.round((r()-.5)*10),by:s.by});
  const roadY=bases.map(b=>b+6);const lastRoad=roadY[roadY.length-1];
  const H=lastRoad+24+96;
  const gate={x:cx,by:H-10};
  const plaza={x:cx,y:roadY[mid]+12,w:96,h:56};
  const props=[];
  // 戸口の前と門の前には物を置かない（宿や酒場に入れなくなっていた）
  const blocked=(x,by)=>blds.some(b=>Math.abs(x-b.x)<34&&by>b.by-14&&by<b.by+34)||(Math.abs(x-cx)<40&&by>H-70);
  const P=(art,x,by,solid=true)=>{if(art!=='tgate'&&blocked(x,by))return;props.push({art,x:Math.round(x),by:Math.round(by),solid});};
  P('well',cx+30,plaza.y+18);
  if(sz!=='small'){P('stall',cx-40,plaza.y+26);P('stall',cx+62,plaza.y-6);}else P('stall',cx-38,plaza.y+24);
  P('lantern',cx-56,plaza.y-20);P('lantern',cx+56,plaza.y+24);P('lantern',cx-26,H-46);P('lantern',cx+26,H-46);
  // 建物の裏・町の外まわりに木と茂み、空いた所に荷車や干し草
  const air=twAir(k);
  for(let x=10;x<W;x+=34+Math.floor(r()*20))P(r()<.65?(air.sand?'bush1':'tree1'):'bush1',x,top+Math.floor(r()*14));
  for(let y=top+60;y<H-30;y+=48+Math.floor(r()*24)){P(r()<.6?'tree1':'bush1',8+r()*10,y);P(r()<.6?'tree1':'bush1',W-8-r()*10,y);}
  for(const b of blds)if(r()<.45)P(['hay','cart','fence'][Math.floor(r()*3)],b.x+(r()<.5?-1:1)*44,b.by-6);
  for(let x=20;x<W-20;x+=60)if(Math.abs(x-cx)>70)P('fence',x,H-18);
  P('tgate',gate.x,gate.by,false);
  return {k,W,H,cx,blds,props,roadY,plaza,gate,bases,top};}

/* ---- 当たり（足もとの箱） ---- */
function twBlockers(L,img){const bl=[];
  for(const b of L.blds){const im=img[b.art];if(!im)continue;const w=im.width-12;bl.push({x0:b.x-w/2,x1:b.x+w/2,y0:b.by-im.height*.5,y1:b.by-3});}
  for(const p of L.props){if(!p.solid)continue;const im=img[p.art];if(!im)continue;
    const w=p.art==='tree1'?14:p.art==='lantern'?8:im.width*.7;const d=p.art==='fence'?6:p.art==='tree1'?8:Math.min(14,im.height*.3);bl.push({x0:p.x-w/2,x1:p.x+w/2,y0:p.by-d,y1:p.by});}
  // 門の柱
  const g=img.tgate;if(g){bl.push({x0:L.gate.x-g.width/2,x1:L.gate.x-16,y0:L.gate.by-10,y1:L.gate.by});bl.push({x0:L.gate.x+16,x1:L.gate.x+g.width/2,y0:L.gate.by-10,y1:L.gate.by});}
  return bl;}
function twFree(x,y){const T=TW;if(x<8||x>T.L.W-8||y<T.L.top+24||y>T.L.H-2)return false;
  for(const b of T.bl)if(x>b.x0-4&&x<b.x1+4&&y>b.y0-2&&y<b.y1+3)return false;return true;}

/* ---- 地面を一枚に焼く ---- */
function twGround(L,img){const c=document.createElement('canvas');c.width=L.W;c.height=L.H;const g=c.getContext('2d');const air=twAir(L.k);
  const pat=n=>img[n]?g.createPattern(img[n],'repeat'):'#3a4a2a';
  g.fillStyle=pat(air.ground);g.fillRect(0,0,L.W,L.H);
  // 通り：土の模様を、ふちをぼかして重ねる
  const road=new Path2D();
  for(const ry of L.roadY)road.rect(28,ry,L.W-56,26);
  road.rect(L.cx-16,L.roadY[0],32,L.H-L.roadY[0]);
  road.rect(L.plaza.x-L.plaza.w/2,L.plaza.y-L.plaza.h/2,L.plaza.w,L.plaza.h);
  for(const b of L.blds)road.rect(b.x-9,b.by-4,18,L.roadY.find(y=>y>=b.by)-b.by+10||12);   // 戸口から通りへの小道
  g.save();g.filter='blur(2px)';g.fillStyle='rgba(0,0,0,.25)';g.fill(road);g.restore();
  g.save();g.clip(road);g.fillStyle=pat(air.sand?'trock':'dirt');g.fillRect(0,0,L.W,L.H);
  if(L.k&&townSize(L.k)!=='small'){g.globalAlpha=.55;g.fillStyle=pat('dfloor');g.fillRect(L.plaza.x-L.plaza.w/2,L.plaza.y-L.plaza.h/2,L.plaza.w,L.plaza.h);g.globalAlpha=1;}
  g.restore();
  return c;}

/* ---- 人物の絵 ---- */
function twSprite(key){return FLD.ch[key]||(CHAR_DB[key]?fHeroOf(key):FLD.ch.b_sword);}
function twDraw(g,o,t){const H=twSprite(o.key);if(!H||!H.fr)return;let set=H.fr,flip=false;
  if(o.dir==='u'&&H.fr.bk)set=H.fr.bk;else if(o.dir==='d'&&H.fr.fr4)set=H.fr.fr4;else flip=o.dir==='l';
  const im=o.mv?set.walk[Math.floor(o.ph)%8]:set.ready[Math.floor(t*1.2+(o.ph||0)*.1)%2];if(!im)return;
  const ax=im.ax||im.width/2;
  g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(o.x,o.y,7,2.6,0,0,Math.PI*2);g.fill();
  g.save();g.translate(Math.round(o.x),Math.round(o.y));if(flip)g.scale(-1,1);g.drawImage(im,-Math.round(ax),-im.height+1);g.restore();}

/* ---- 始める ---- */
async function renderTown(opt){opt=opt||{};
  if(S.start===null||(typeof journeyOver==='function'&&journeyOver())){renderPrep();return;}
  stopLoop();setSteps('prep');try{bgmScene('town');}catch(e){}
  TOWN_IN=null;twStop();
  const k=S.base;
  let ov=document.getElementById('townwalk');if(!ov){ov=document.createElement('div');ov.id='townwalk';document.body.appendChild(ov);}
  ov.innerHTML=`<canvas></canvas><div class="tw-hud"><div class="tw-name"><b>${TOWNS[k].name}</b><small>${CONT[TOWNS[k].cont].name}・${calTxtPlain()}</small></div><div class="tw-gold">金 <b>${S.gold}</b></div>
    <button class="tw-menu" id="twmenu">メニュー${(S.event||S.visitors.length||prepMsgs.length||worldMsgs.length)?'<i></i>':''}</button></div>
    <div class="tw-prompt" id="twprompt"></div><div class="tw-say" id="twsay"></div><div class="tw-arrive" id="twarrive"></div><div class="tw-load">…</div>`;
  await fLoad();if(!document.getElementById('townwalk'))return;
  ov.querySelector('.tw-load').remove();
  const img=FLD.bg;
  const same=TW&&TW.k===k&&TW.turn===S.turn;
  const L=same?TW.L:twLayout(k);
  const prev=same?TW:null;
  TW={k,turn:S.turn,L,img,bl:null,ground:prev?prev.ground:twGround(L,img),keys:{},t:0,last:0,raf:0,cv:ov.querySelector('canvas'),npcs:prev?prev.npcs:null,trail:[],say:null,target:null,act:null,parts:[]};
  TW.bl=twBlockers(L,img);
  // 一行：先頭は主人公（いなければ一行の先頭）
  const ids=partyIds();const lead=ids.includes(S.hero)?S.hero:ids[0];
  const start=opt.at||(prev&&prev.lead?{x:prev.lead.x,y:prev.lead.y}:{x:L.gate.x,y:L.gate.by-40});
  TW.lead={key:lead,id:lead,x:start.x,y:start.y,dir:prev&&prev.lead?prev.lead.dir:'u',hd:-Math.PI/2,sp:0,mv:false,ph:0,path:null};
  TW.follow=ids.filter(i=>i!==lead).map((id,i)=>({key:id,id,x:start.x+(i%2?6:-6),y:start.y+14+i*14,dir:'u',hd:-Math.PI/2,sp:0,mv:false,ph:i*2.3}));
  for(let i=0;i<160;i++)TW.trail.push({x:TW.lead.x,y:TW.lead.y+i*2});
  if(!TW.npcs)TW.npcs=twNpcs(L);
  else TW.npcs=TW.npcs.filter(n=>!n.named||seekable(n.named));
  const fit=()=>{const c=TW.cv;const w=innerWidth,h=innerHeight;const dpr=Math.min(2,devicePixelRatio||1);c.width=w*dpr;c.height=h*dpr;c.style.width=w+'px';c.style.height=h+'px';TW.dpr=dpr;TW.sc=Math.max(2,Math.min(w/300,h/236));};
  fit();TW.onResize=fit;addEventListener('resize',fit);
  TW.onKey=e=>{if(!TW)return;const kk=e.key.toLowerCase();
    if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(kk)){TW.keys[kk]=e.type==='keydown';TW.target=null;e.preventDefault();return;}
    if(e.type!=='keydown')return;
    if(kk==='enter'||kk===' '){e.preventDefault();twInteract();}
    else if(kk==='escape'||kk==='m'){e.preventDefault();twMenu();}};
  addEventListener('keydown',TW.onKey,true);addEventListener('keyup',TW.onKey,true);
  TW.cv.onpointerdown=e=>twClick(e);
  ov.querySelector('#twmenu').onclick=()=>twMenu();
  if(opt.arrive){const a=ov.querySelector('#twarrive');a.innerHTML=`<b>${TOWNS[k].name}</b><small>${CONT[TOWNS[k].cont].name}</small>`;a.classList.add('on');setTimeout(()=>a&&a.classList.remove('on'),3200);}
  if(opt.intro)setTimeout(()=>twSay({who:CHAR_DB[lead]?CHAR_DB[lead].name:'',text:opt.intro.replace(/^[^「]*「/,'').replace(/」.*$/,''),note:opt.intro.replace(/^.*」/,'')}),1400);
  else if(opt.msg)twSay({who:'',text:opt.msg});
  TW.raf=requestAnimationFrame(twFrame);}
function calTxtPlain(){try{return calTxt().replace(/<[^>]+>/g,'');}catch(e){return '';}}
function twStop(){if(!TW)return;cancelAnimationFrame(TW.raf);removeEventListener('resize',TW.onResize);removeEventListener('keydown',TW.onKey,true);removeEventListener('keyup',TW.onKey,true);const ov=document.getElementById('townwalk');if(ov)ov.remove();}
function twMenu(){twStop();TOWN_IN=null;if(PREP_TAB==='town')PREP_TAB='depart';renderPrep();}

/* ---- 住人：町の人（季節ごとに顔ぶれが変わる）と、この町にいる名のある人物 ---- */
function twNpcs(L){const k=L.k;const pop=townPop(k);const n=townSize(k)==='small'?7:townSize(k)==='mid'?10:13;const out=[];
  const r=seeded(S.wseed+':walkers:'+k+':'+S.turn);const arts=['b_sword','b_tank','b_mage','b_hunter','b_priest','b_thief'];
  const spot=()=>twRoadSpot(L,r);
  for(let j=0;j<n;j++){const i=Math.floor(r()*pop);if(out.some(o=>o.i===i))continue;const p=spot();out.push({i,key:arts[Math.floor(r()*arts.length)],x:p.x,y:p.y,dir:'d',hd:r()*6.28,sp:0,vmax:20+r()*14,mv:false,ph:r()*8,wait:r()*3,path:null});}
  for(const c of Object.keys(S.where||{}).filter(c=>S.where[c]===k&&seekable(c))){const p=spot();out.push({named:c,key:c,x:p.x,y:p.y,dir:'d',hd:r()*6.28,sp:0,vmax:26,mv:false,ph:r()*8,wait:r()*3,path:null});}
  return out;}
function twRoadSpot(L,r){for(let n=0;n<40;n++){const ry=L.roadY[Math.floor(r()*L.roadY.length)];const onMain=r()<.3;
  const x=onMain?L.cx+(r()-.5)*22:40+r()*(L.W-80),y=onMain?L.roadY[0]+r()*(L.H-L.roadY[0]-30):ry+4+r()*18;if(!TW||twFree(x,y))return {x,y};}return {x:L.cx,y:L.plaza.y};}

/* ---- 動き（2026-11-26 作り直し。オーナー「直進ではなく自然に曲がって」「NPCも含めて歩いているように見えない」） ----
   - 行き先までは升目（6画素）の A* で道を探し、見通せる所はつないで角を減らす（twPath）
   - 人はそれぞれ向き（hd）と速さ（sp）を持ち、向きは一度に少しずつしか変えられない（曲がりながら弧を描く）。
     動き出しはゆっくり加速し、着く手前で緩める。急に曲がるときは歩みを落とす
   - 足の運びは、実際に進んだ距離で進める（滑って見えないように。8コマで約28画素）
   - 絵の向き（左右・奥・手前）は、しばらく続いたときだけ切り替える（ちらつかないように）
   - 住人は通りの好きな所へ道を探して歩き、着くと立ち止まってあたりを見回す。人とすれ違うときは少しよける */
function twGridBuild(){const T=TW,L=T.L,cs=6,gw=Math.ceil(L.W/cs),gh=Math.ceil(L.H/cs);const g=new Uint8Array(gw*gh);
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)g[y*gw+x]=twFree(x*cs+cs/2,y*cs+cs/2)?1:0;T.grid={g,gw,gh,cs};}
function twLOS(a,b){const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.ceil(d/3);for(let i=1;i<=n;i++){const t=i/n;if(!twFree(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;}return true;}
function twPath(a,b){const G=TW.grid;if(!G)return [b];const {g,gw,gh,cs}=G;const ci=(x,y)=>Math.max(0,Math.min(gh-1,Math.floor(y/cs)))*gw+Math.max(0,Math.min(gw-1,Math.floor(x/cs)));
  if(twLOS(a,b))return [b];
  let s=ci(a.x,a.y),e=ci(b.x,b.y);
  if(!g[e]){let best=-1,bd=1e9;const ex=e%gw,ey=(e/gw)|0;for(let dy=-6;dy<=6;dy++)for(let dx=-6;dx<=6;dx++){const x=ex+dx,y=ey+dy;if(x<0||y<0||x>=gw||y>=gh||!g[y*gw+x])continue;const d=dx*dx+dy*dy;if(d<bd){bd=d;best=y*gw+x;}}if(best<0)return [];e=best;b={x:(e%gw)*cs+cs/2,y:((e/gw)|0)*cs+cs/2};}
  const N=gw*gh,G2=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),open=[s],inO=new Uint8Array(N);G2[s]=0;inO[s]=1;
  const hx=i=>Math.hypot((i%gw)-(e%gw),((i/gw)|0)-((e/gw)|0));let it=0;
  while(open.length&&it++<6000){let bi=0,bf=1e9;for(let k=0;k<open.length;k++){const f=G2[open[k]]+hx(open[k]);if(f<bf){bf=f;bi=k;}}const c=open.splice(bi,1)[0];inO[c]=0;if(c===e)break;
    const cx=c%gw,cy=(c/gw)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=gw||y>=gh)continue;const n=y*gw+x;if(!g[n])continue;if(dx&&dy&&(!g[cy*gw+x]||!g[y*gw+cx]))continue;
      const ng=G2[c]+(dx&&dy?1.414:1);if(ng<G2[n]){G2[n]=ng;from[n]=c;if(!inO[n]){open.push(n);inO[n]=1;}}}}
  if(from[e]<0&&e!==s)return [];
  const pts=[];for(let c=e;c!==s&&c>=0;c=from[c])pts.unshift({x:(c%gw)*cs+cs/2,y:((c/gw)|0)*cs+cs/2});pts.push(b);
  // 見通せる所はつなぐ
  const out=[];let cur=a,k=0;while(k<pts.length){let far=k;for(let m=pts.length-1;m>k;m--)if(twLOS(cur,pts[m])){far=m;break;}out.push(pts[far]);cur=pts[far];k=far+1;}
  return out;}
const twAng=(a,b)=>{let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};
function twStep(o,dx,dy){let moved=0;if(dx&&twFree(o.x+dx,o.y)){o.x+=dx;moved+=Math.abs(dx);}if(dy&&twFree(o.x,o.y+dy)){o.y+=dy;moved+=Math.abs(dy);}return moved;}
function twDirOf(o,dt){const c=Math.cos(o.hd),sn=Math.sin(o.hd);const want=Math.abs(c)>.62?(c<0?'l':'r'):(sn<0?'u':'d');
  if(want===o.dir){o.dirT=0;return;}o.dirT=(o.dirT||0)+dt;if(o.dirT>.14||!o.mv){o.dir=want;o.dirT=0;}}
/* 一歩ぶん動かす。want＝行きたい向き（なければ止まる）、vmax＝最高の速さ */
function twMove(o,dt,want,vmax,turn){turn=turn||6.5;let tv=0;
  if(want!=null){const df=twAng(o.hd,want);const st=Math.max(-turn*dt,Math.min(turn*dt,df));o.hd+=st;tv=vmax*Math.max(.3,(Math.cos(df)+1)/2);}
  const acc=tv>o.sp?140:220;o.sp+=Math.max(-acc*dt,Math.min(acc*dt,tv-o.sp));if(o.sp<1&&tv===0)o.sp=0;
  const d=o.sp*dt;let mv=0;if(d>0){mv=twStep(o,Math.cos(o.hd)*d,Math.sin(o.hd)*d);if(mv<d*.3)o.sp*=.6;}
  o.ph=(o.ph||0)+mv/3.5;o.mv=o.sp>5&&mv>0.01;twDirOf(o,dt);return mv;}
/* 道筋をたどる。着いたら true */
function twFollowPath(o,dt,vmax){while(o.path&&o.path.length){const w=o.path[0];const d=Math.hypot(w.x-o.x,w.y-o.y);if(d<(o.path.length>1?9:2.5))o.path.shift();else break;}
  if(!o.path||!o.path.length){twMove(o,dt,null,0);return true;}
  const w=o.path[0];const d=Math.hypot(w.x-o.x,w.y-o.y);const last=o.path.length===1;
  twMove(o,dt,Math.atan2(w.y-o.y,w.x-o.x),last?Math.min(vmax,8+d*2.4):vmax);
  if(o.sp<2){o.stuck=(o.stuck||0)+dt;if(o.stuck>.8){o.path=null;o.stuck=0;return true;}}else o.stuck=0;
  return false;}
function twFrame(now){if(!TW)return;const dt=Math.min(.05,TW.last?(now-TW.last)/1000:0);TW.last=now;TW.t+=dt;
  if(!TW.grid)twGridBuild();
  const L=TW.L,Ld=TW.lead,K=TW.keys;let vx=(K.arrowright||K.d?1:0)-(K.arrowleft||K.a?1:0),vy=(K.arrowdown||K.s?1:0)-(K.arrowup||K.w?1:0);
  if(TW.say)vx=vy=0;
  const SP=74;
  if(vx||vy){Ld.path=null;TW.target=null;twMove(Ld,dt,Math.atan2(vy,vx),SP,11);}
  else if(Ld.path&&Ld.path.length){const done=twFollowPath(Ld,dt,SP);if(done||!Ld.path||!Ld.path.length){Ld.path=null;const a=TW.target&&TW.target.then;TW.target=null;if(a)setTimeout(a,60);}}
  else twMove(Ld,dt,null,0);
  // 後ろの仲間：先頭の歩いた跡を、間をあけてたどる
  if(Ld.mv){const lt=TW.trail[0];if(!lt||Math.hypot(lt.x-Ld.x,lt.y-Ld.y)>=2){TW.trail.unshift({x:Ld.x,y:Ld.y});if(TW.trail.length>160)TW.trail.pop();}}
  TW.follow.forEach((f,i)=>{const p=TW.trail[Math.min(TW.trail.length-1,(i+1)*8)];const d=Math.hypot(p.x-f.x,p.y-f.y);
    if(d>3)twMove(f,dt,Math.atan2(p.y-f.y,p.x-f.x),Math.min(SP*1.25,d*4.5),8);else twMove(f,dt,null,0);});
  for(const n of TW.npcs){
    if(TW.say&&TW.say.npc===n){twMove(n,dt,null,0);continue;}
    // 先頭と近ければ立ち止まって向く（道をあける）
    const dl=Math.hypot(n.x-Ld.x,n.y-Ld.y);
    if(dl<18){twMove(n,dt,null,0);if(!n.mv){n.hd=Math.atan2(Ld.y-n.y,Ld.x-n.x);twDirOf(n,1);}continue;}
    if(n.wait>0){n.wait-=dt;twMove(n,dt,null,0);if(n.look&&n.wait<n.look){n.hd+=Math.PI*(Math.random()<.5?.5:-.5);n.look=0;twDirOf(n,1);}continue;}
    if(!n.path||!n.path.length){const g=twRoadSpot(L,Math.random);n.path=twPath(n,g);if(!n.path.length){n.wait=1;continue;}}
    // ほかの人とぶつかりそうなら、少しよける
    let avoid=0;for(const m of [Ld,...TW.npcs,...TW.follow]){if(m===n)continue;const dx=m.x-n.x,dy=m.y-n.y,d=Math.hypot(dx,dy);if(d<16&&d>0){const a=twAng(n.hd,Math.atan2(dy,dx));if(Math.abs(a)<1.1)avoid+=(a>0?-1:1)*(16-d)/16;}}
    if(avoid)n.hd+=avoid*1.6*dt;
    const done=twFollowPath(n,dt,n.vmax);
    if(done){n.path=null;n.wait=1.2+Math.random()*4;n.look=Math.random()<.6?n.wait*(.3+Math.random()*.4):0;}}
  // 近くの用事
  TW.act=twNear();const pr=document.getElementById('twprompt');
  if(pr){const t=TW.say?'':TW.act?TW.act.label:'';if(pr.dataset.t!==t){pr.dataset.t=t;pr.innerHTML=t?`<button>${t}</button>`:'';const b=pr.querySelector('button');if(b)b.onclick=()=>twInteract();}}
  twRender();TW.raf=requestAnimationFrame(twFrame);}
function twNear(){const Ld=TW.lead,L=TW.L;let best=null,bd=1e9;
  for(const n of TW.npcs){const d=Math.hypot(n.x-Ld.x,(n.y-Ld.y)*1.3);if(d<22&&d<bd){bd=d;best={kind:'npc',n,label:`${n.named?(S.seek[n.named]?CHAR_DB[n.named].name:CHAR_LOOK[n.named]):npcName(L.k,npcAt(L.k,n.i))}に話しかける`};}}
  if(best)return best;
  for(const b of L.blds){const dx=Math.abs(Ld.x-b.x),dy=Ld.y-b.by;if(dx<14&&dy>-2&&dy<16)return {kind:'bld',b,label:b.f?`${FACILITIES[b.f].name}に入る`:'民家の戸を叩く'};}
  if(Math.abs(Ld.x-L.gate.x)<22&&Ld.y>L.gate.by-26)return {kind:'gate',label:'町を出る（旅の支度）'};
  return null;}
function twInteract(){if(!TW)return;if(TW.say){twSayClose();return;}const a=TW.act;if(!a)return;
  if(a.kind==='npc')twTalk(a.n);
  else if(a.kind==='bld'){if(!a.b.f){twSay({who:'',text:['……返事はない。留守のようだ','戸の向こうで、赤子が泣いている','「間に合ってるよ」と、戸越しに断られた'][Math.floor(Math.random()*3)]});return;}
    twEnter(a.b.f);}
  else if(a.kind==='gate'){twStop();PREP_TAB='depart';renderPrep();}}
function twEnter(f){TW.backAt={x:TW.lead.x,y:TW.lead.y+6};twStop();TOWN_IN=f;TOWNF=f;NPCSEL=null;renderPrep();scrollTo(0,0);}
function twTalk(n){const k=TW.L.k;n.dir=n.x<TW.lead.x?'r':'l';
  if(n.named){talkTo(k,'n:'+n.named);persist();const c=n.named;const m=S.seek[c]||0;
    twSay({npc:n,who:m?CHAR_DB[c].name:CHAR_LOOK[c],sub:m?`${ROLES[CHAR_DB[c].role]}・話した${m}回`:'',text:NPCSEL.text,note:NPCSEL.note,recruit:m>=2&&seekable(c)?c:null});return;}
  talkTo(k,n.i);persist();const p=npcAt(k,n.i);
  twSay({npc:n,who:npcName(k,p),sub:npcSub(k,p),text:NPCSEL.text,note:NPCSEL.note});}
function twSay(o){if(!TW)return;TW.say=o;const el=document.getElementById('twsay');if(!el)return;
  el.innerHTML=`<div class="tw-box">${o.who?`<b>${o.who}</b>`:''}${o.sub?`<small>${o.sub}</small>`:''}<p>${o.text?(o.who?`「${o.text}」`:o.text):''}</p>${o.note?`<p class="tw-note">${o.note}</p>`:''}
    <div class="tw-btns">${o.recruit?`<button class="tw-b gold" data-twrec="${o.recruit}">仲間に誘う</button>`:''}<button class="tw-b" data-twok>▼</button></div></div>`;
  el.classList.add('on');
  el.querySelector('[data-twok]').onclick=()=>twSayClose();
  const rb=el.querySelector('[data-twrec]');if(rb)rb.onclick=()=>{const c=rb.dataset.twrec;recruitSeek(c);persist();const ok=!seekable(c);
    if(ok){TW.npcs=TW.npcs.filter(x=>x.named!==c);const id=c;if(partyIds().includes(id))TW.follow.push({key:id,id,x:TW.lead.x,y:TW.lead.y+10,dir:'u',hd:-Math.PI/2,sp:0,mv:false,ph:.5});}
    twSay({who:CHAR_DB[c].name,text:SEEKSAY&&SEEKSAY.c===c?SEEKSAY.text:(ok?'よろしく頼む':'……'),note:ok?(partyIds().includes(c)?'一行に加わった':'宿坊で控える'):''});};}
function twSayClose(){if(!TW)return;TW.say=null;const el=document.getElementById('twsay');if(el){el.classList.remove('on');el.innerHTML='';}
  const g=document.querySelector('.tw-gold b');if(g)g.textContent=S.gold;}
function twClick(e){if(!TW)return;if(TW.say){twSayClose();return;}const r=TW.cv.getBoundingClientRect();const sc=TW.sc;
  const wx=(e.clientX-r.left)/sc+TW.camX,wy=(e.clientY-r.top)/sc+TW.camY;const L=TW.L;
  for(const n of TW.npcs)if(Math.abs(wx-n.x)<9&&wy<n.y+3&&wy>n.y-36){const g={x:n.x+(TW.lead.x<n.x?-14:14),y:n.y};TW.target={then:()=>{TW.act=twNear();if(TW.act&&TW.act.kind==='npc')twTalk(TW.act.n);}};TW.lead.path=twPath(TW.lead,g);return;}
  for(const b of L.blds){const im=TW.img[b.art];if(im&&Math.abs(wx-b.x)<im.width/2&&wy<b.by&&wy>b.by-im.height){TW.target={then:()=>{TW.act=twNear();if(TW.act&&TW.act.kind==='bld')twInteract();}};TW.lead.path=twPath(TW.lead,{x:b.x,y:b.by+8});return;}}
  TW.target=null;TW.lead.path=twPath(TW.lead,{x:wx,y:wy});}

/* ---- 描く ---- */
function twRender(){const T=TW,g=T.cv.getContext('2d'),L=T.L,img=T.img;const sc=T.sc,dpr=T.dpr;const vw=T.cv.width/dpr/sc,vh=T.cv.height/dpr/sc;
  T.camX=Math.max(0,Math.min(L.W-vw,T.lead.x-vw/2));T.camY=Math.max(0,Math.min(L.H-vh,T.lead.y-vh*.55));if(L.W<vw)T.camX=(L.W-vw)/2;if(L.H<vh)T.camY=(L.H-vh)/2;
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#10140e';g.fillRect(0,0,T.cv.width,T.cv.height);
  g.setTransform(sc*dpr,0,0,sc*dpr,-Math.round(T.camX*sc*dpr),-Math.round(T.camY*sc*dpr));g.imageSmoothingEnabled=false;
  g.drawImage(T.ground,0,0);
  // 立っている物を足もとの奥行き順に
  const items=[];
  for(const b of L.blds)items.push({y:b.by,draw:()=>{const im=img[b.art];if(im)g.drawImage(im,Math.round(b.x-im.width/2),Math.round(b.by-im.height));}});
  for(const p of L.props)items.push({y:p.by,draw:()=>{const im=img[p.art];if(!im)return;let x=Math.round(p.x-im.width/2);
    if((p.art==='tree1'||p.art==='bush1')&&typeof fWind==='function'){}g.drawImage(im,x,Math.round(p.by-im.height));}});
  for(const o of [T.lead,...T.follow,...T.npcs])items.push({y:o.y,draw:()=>twDraw(g,o,T.t)});
  items.sort((a,b)=>a.y-b.y);for(const it of items)it.draw();
  // 灯りと空気
  const air=twAir(L.k);g.setTransform(dpr,0,0,dpr,0,0);
  if(air.tint){g.fillStyle=air.tint;g.fillRect(0,0,T.cv.width,T.cv.height);}
  twParticles(g,air,T.cv.width/dpr,T.cv.height/dpr);
  // 看板（施設の名前）
  g.font='600 12px "Yu Gothic","Hiragino Sans",sans-serif';g.textAlign='center';g.textBaseline='middle';
  for(const b of L.blds){if(!b.f)continue;const im=img[b.art];const sx=(b.x-T.camX)*sc,sy=(b.by-(im?im.height:60)-6-T.camY)*sc;if(sx<-60||sx>innerWidth+60||sy<-20||sy>innerHeight+20)continue;
    const t=FACILITIES[b.f].name;const w=g.measureText(t).width+12;g.fillStyle='rgba(16,12,8,.72)';g.fillRect(sx-w/2,sy-9,w,18);g.fillStyle='#f0e2c0';g.fillText(t,sx,sy+1);}
  // 名のある人物には小さな印（話したことがあれば名前）
  for(const n of T.npcs){if(!n.named)continue;const sx=(n.x-T.camX)*sc,sy=(n.y-40-T.camY)*sc;const m=S.seek[n.named]||0;g.fillStyle='rgba(16,12,8,.7)';const t=m?CHAR_DB[n.named].name:'？';const w=g.measureText(t).width+10;g.fillRect(sx-w/2,sy-8,w,16);g.fillStyle='#ffd23a';g.fillText(t,sx,sy+1);}}
function twParticles(g,air,w,h){const T=TW;if(!air.snow&&!air.petal&&!air.sand)return;if(!T.parts.length)for(let i=0;i<(air.sand?40:70);i++)T.parts.push({x:Math.random()*w,y:Math.random()*h,v:.5+Math.random(),s:Math.random()*6});
  for(const p of T.parts){p.y+=(air.sand?.2:p.v*.6);p.x+=air.sand?p.v*2.2:Math.sin(T.t+p.s)*.4+(air.petal?.5:0);if(p.y>h)p.y=-4;if(p.x>w)p.x=-4;
    g.fillStyle=air.snow?'rgba(255,255,255,.85)':air.petal?'rgba(244,170,190,.85)':'rgba(230,200,140,.35)';
    if(air.petal){g.beginPath();g.ellipse(p.x,p.y,2.4,1.3,T.t+p.s,0,Math.PI*2);g.fill();}else g.fillRect(p.x,p.y,air.sand?3:2,air.sand?1:2);}}

/* ---- 建物の中（管理画面の作りを使い、施設の板だけを出す） ---- */
function townInsideHtml(ids){const k=S.base;const f=TOWN_IN;const F=FACILITIES[f];
  let h=`<div class="tm tw-in"><nav class="tm-nav"><div class="crest">${ico(F.icon)}<b>${F.name}</b><span class="goldv">${TOWNS[k].name}</span><span class="goldv" title="手持ちの金">金 <b>${S.gold}</b></span></div>
    <button class="tw-out" id="twout">外へ出る</button></nav>`;
  h+=`<div class="fr facp">${facHtml(k,f,ids)}</div>`;
  if(f==='tavern')h+=townHtml(ids,{people:true});
  return h+'</div>';}

/* ============ 拠点（2026-11-26） ============
   オーナー「拠点を構えたら拠点が使えるようにしたい。なければ身軽で移動しているということ。拠点があれば持ち物を置いておける。宿屋を仮の拠点にすることもできる」
   - 持ち歩ける品（装備していない武具・装飾。形見は数えない）は CARRY_CAP まで。超えていると旅立てない（売るか、拠点に預ける）
   - 拠点：町に家を借りる・買う（宿屋で）、または宿屋を「仮の拠点」にする（一か所だけ。宿代は泊まるたびにかかる）
   - 拠点には品を預けられる（S.items[u].at＝町）。預けた品は持ち歩きに数えず、その町に戻らないと取り出せない
     預けられる数：宿の仮の拠点10・借家40・持ち家は無制限
   - 家のある町では、歩ける町に「わが家」が建つ。宿の仮の拠点は宿屋の中で預ける */
const CARRY_CAP=10;
const isStashed=u=>!!(S.items[u]&&S.items[u].at);
function carried(){const used=new Set();for(const e of Object.values(S.equip))for(const v of Object.values(e))if(v)used.add(v);
  return Object.keys(S.items).filter(u=>!used.has(u)&&!isStashed(u)&&S.items[u].k!=='memento');}
function baseKind(k){const h=(S.homes||{})[k];if(h)return h.type;if(S.innBase===k)return 'inn';return null;}
function stashCap(k){return {inn:10,rent:40,own:999}[baseKind(k)]||0;}
function stashed(k){return Object.keys(S.items).filter(u=>S.items[u].at===k);}
function baseWord(k){const b=baseKind(k);return b==='own'?'持ち家':b==='rent'?'借家':b==='inn'?'宿の仮の拠点':'';}
function basesTxt(){const out=[];for(const [k,h] of Object.entries(S.homes||{}))if(TOWNS[k])out.push(`${TOWNS[k].name}の${h.type==='own'?'持ち家':'借家'}`);if(S.innBase&&TOWNS[S.innBase])out.push(`${TOWNS[S.innBase].name}の宿`);return out.join('・')||'なし（身軽な旅）';}
function stashHtml(k){const kind=baseKind(k);if(!kind)return '';const cap=stashCap(k);const st=stashed(k);const cr=carried();
  const row=(u,act)=>{const d=itemDef(u);if(!d)return '';return `<div class="it2 ${d.tier?'gt'+d.tier:''}"><div class="ii">${ico(d.line||SLOTS[d.slot])}<b>${d.name}${S.items[u].plus?` +${S.items[u].plus}`:''}</b></div><span class="eff">${d.type||SLOTS[d.slot]}・${d.txt}</span><div class="row"><span style="flex:1"></span>${act}</div></div>`;};
  let h=`<div class="tl2" style="margin-top:6px"><b style="font-size:.95rem">${baseWord(k)}の物置</b><small>預けた品はこの町でしか取り出せない。持ち歩けるのは${CARRY_CAP}品まで</small></div>`;
  h+=`<div class="fz"><span>持ち歩き <b>${cr.length}/${CARRY_CAP}</b></span><span>預け <b>${st.length}${cap<999?'/'+cap:''}</b></span></div>`;
  h+=`<div class="tl2" style="margin-top:8px"><b style="font-size:.85rem">持ち歩いている品</b></div>${cr.length?`<div class="shelf">${cr.map(u=>row(u,`<button class="btn tiny" data-stash="${u}" ${st.length>=cap?'disabled':''}>預ける</button>`)).join('')}</div>`:'<p class="mini2">装備していない品はない</p>'}`;
  h+=`<div class="tl2" style="margin-top:8px"><b style="font-size:.85rem">預けている品</b></div>${st.length?`<div class="shelf">${st.map(u=>row(u,`<button class="btn tiny" data-unstash="${u}" ${cr.length>=CARRY_CAP?'disabled':''}>持ち出す</button>`)).join('')}</div>`:'<p class="mini2">まだ何も預けていない</p>'}`;
  return h;}
function innBaseHtml(k){if((S.homes||{})[k])return '';
  if(S.innBase===k)return `<div class="fz"><span><b>仮の拠点</b><small class="mini2">この宿を拠点にしている。品を10まで預けられる</small></span><button class="btn tiny" data-innbase="off" ${stashed(k).length?'disabled title="預けた品を持ち出してから"':''}>拠点をやめる</button></div>`+stashHtml(k);
  return `<div class="fz"><span><b>仮の拠点にする</b><small class="mini2">宿に品を預けて身軽に旅ができる（10品まで。拠点は一か所だけ${S.innBase&&TOWNS[S.innBase]?`。いまは${TOWNS[S.innBase].name}の宿`:''}）</small></span><button class="btn tiny" data-innbase="on" ${S.innBase&&stashed(S.innBase).length?'disabled title="前の宿に預けた品を持ち出してから"':''}>ここを拠点にする</button></div>`;}
function bindBase(){
  document.querySelectorAll('[data-stash]').forEach(b=>b.onclick=()=>{const u=b.dataset.stash,k=S.base;if(!baseKind(k)||stashed(k).length>=stashCap(k))return;S.items[u].at=k;persist();renderPrep();});
  document.querySelectorAll('[data-unstash]').forEach(b=>b.onclick=()=>{const u=b.dataset.unstash;if(!S.items[u]||S.items[u].at!==S.base||carried().length>=CARRY_CAP)return;delete S.items[u].at;persist();renderPrep();});
  document.querySelectorAll('[data-innbase]').forEach(b=>b.onclick=()=>{const k=S.base;if(b.dataset.innbase==='on'){S.innBase=k;prepMsgs.push(`${TOWNS[k].name}の宿を仮の拠点にした`);}else{S.innBase=null;prepMsgs.push('宿の仮の拠点をやめた。身軽な旅に戻る');}persist();renderPrep();});}
/* 前からのセーブ：持ち歩ける数を決める前に集めた品が多いと旅立てなくなるので、一度だけ、いまの町の宿を仮の拠点にして、あふれた分を預けておく */
function baseMigrate(s){if(s.carry1)return s;s.carry1=1;try{const used=new Set();for(const e of Object.values(s.equip||{}))for(const v of Object.values(e))if(v)used.add(v);
  const cr=Object.keys(s.items||{}).filter(u=>!used.has(u)&&!s.items[u].at&&s.items[u].k!=='memento');
  if(cr.length>CARRY_CAP&&s.base){if(!(s.homes||{})[s.base])s.innBase=s.innBase||s.base;const k=(s.homes||{})[s.base]?s.base:s.innBase;for(const u of cr.slice(CARRY_CAP))s.items[u].at=k;}}catch(e){}return s;}
