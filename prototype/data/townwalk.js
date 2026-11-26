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

/* ---- 当たり（足もとの箱） ---- */
/* 当たり（2026-11-26 作り直し。オーナー「相変わらず障害物をすり抜ける」）：
   前は絵の幅や高さの決まった割合で箱を作っていたので、絵ごとの形と合わず、壁や幹の上を歩けていた。
   いまは絵の不透明な画素から、足もとの帯（建物は下45%、木は根元の下20%、そのほかは下40%）の左右の端を測って箱にする（twFoot、絵ごとに一度だけ） */
const TW_FOOT=new WeakMap();
function twFoot(im,band){const key=band;let m=TW_FOOT.get(im);if(m&&m[key])return m[key];m=m||{};
  const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height).data;
  const H=im.height,W=im.width,y0=Math.floor(H*(1-band));let x0=W,x1=-1,yTop=H;
  for(let y=y0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>80){if(x<x0)x0=x;if(x>x1)x1=x;}
  if(x1<0){x0=W*.3;x1=W*.7;}
  m[key]={l:x0-W/2,r:x1-W/2+1,d:H-y0};TW_FOOT.set(im,m);return m[key];}
function twBlockers(L,img){const bl=[];
  for(const b of L.blds){const im=twArt(b.art);if(!im)continue;const f=twFoot(im,.45);bl.push({x0:b.x+f.l+2,x1:b.x+f.r-2,y0:b.by-f.d,y1:b.by-2});}
  for(const p of L.props){if(!p.solid||p.flat)continue;const im=twArt(p.art);if(!im)continue;
    const tall=im.height>im.width*1.15&&im.height>40;   // 木や灯り：根元だけ
    const f=twFoot(im,tall?.2:.4);const d=tall?Math.min(10,f.d):Math.min(22,Math.max(6,f.d*.7));
    bl.push({x0:p.x+f.l,x1:p.x+f.r,y0:p.by-d,y1:p.by});}
  const g=img.tgate;if(g&&L.gate){bl.push({x0:L.gate.x-g.width/2,x1:L.gate.x-16,y0:L.gate.by-10,y1:L.gate.by});bl.push({x0:L.gate.x+16,x1:L.gate.x+g.width/2,y0:L.gate.by-10,y1:L.gate.by});}
  return bl;}
/* 体の幅で確かめる（中心だけでなく左右と上下も。体がはみ出して重ならないように） */
const twFreeBody=(x,y)=>twFree(x,y)&&twFree(x-5,y)&&twFree(x+5,y)&&twFree(x,y-3)&&twFree(x-4,y-2)&&twFree(x+4,y-2);
/* 当たりは64画素ごとの桶に分けて持つ（大きな町でも速く） */
function twBucket(bl){const B={};for(const b of bl){for(let gy=Math.floor((b.y0-6)/64);gy<=Math.floor((b.y1+6)/64);gy++)for(let gx=Math.floor((b.x0-6)/64);gx<=Math.floor((b.x1+6)/64);gx++){(B[gx+','+gy]=B[gx+','+gy]||[]).push(b);}}return B;}
function twFree(x,y){const T=TW,L=T.L;
  if(L.room){if(x<12||x>L.W-12||y<L.WH+10)return false;if(y>L.H-11&&!(Math.abs(x-L.cx)<14&&y<L.H-1))return false;}
  else if(x<8||x>L.W-8||y<L.top+24||y>L.H-2||(L.water&&y<L.water.y+22))return false;
  const bk=T.blb?(T.blb[Math.floor(x/64)+','+Math.floor(y/64)]||[]):T.bl;for(const b of bk)if(x>b.x0-4&&x<b.x1+4&&y>b.y0-2&&y<b.y1+3)return false;return true;}

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
  await fLoad();await twLoadInt();await twLoadTown();if(!document.getElementById('townwalk'))return;
  const room=opt.room||null;if(room){const n=ov.querySelector('.tw-name');if(n)n.innerHTML=`<b>${FACILITIES[room].name}</b><small>${TOWNS[k].name}・${calTxtPlain()}</small>`;}
  ov.querySelector('.tw-load').remove();
  const img=FLD.bg;
  const same=TW&&TW.k===k&&TW.turn===S.turn&&(TW.room||null)===room;
  const L=same?TW.L:(room?twRoom(k,room):twLayout(k));
  const prev=same?TW:null;
  TW={k,turn:S.turn,L,img,bl:null,room,ground:prev?prev.ground:(room?twRoomGround(L):twGround(L,img)),keys:{},t:0,last:0,raf:0,cv:ov.querySelector('canvas'),npcs:prev?prev.npcs:null,trail:[],say:null,target:null,act:null,parts:[]};
  TW.bl=twBlockers(L,img);TW.blb=twBucket(TW.bl);
  // 一行：先頭は主人公（いなければ一行の先頭）
  const ids=partyIds();const lead=ids.includes(S.hero)?S.hero:ids[0];
  const start=opt.at||(prev&&prev.lead?{x:prev.lead.x,y:prev.lead.y}:room?{x:L.cx,y:L.H-16}:{x:L.exit.x,y:L.H-40});
  TW.lead={key:lead,id:lead,x:start.x,y:start.y,dir:prev&&prev.lead?prev.lead.dir:'u',hd:-Math.PI/2,sp:0,mv:false,ph:0,path:null};
  TW.follow=ids.filter(i=>i!==lead&&!(S.hire&&isTemp(i))).map((id,i)=>({key:id,id,x:start.x+(i%2?6:-6),y:start.y+14+i*14,dir:'u',hd:-Math.PI/2,sp:0,mv:false,ph:i*2.3}));
  for(let i=0;i<160;i++)TW.trail.push({x:TW.lead.x,y:TW.lead.y+i*2});
  if(!TW.npcs)TW.npcs=room?twRoomNpcs(L):twNpcs(L);
  if(!room)twCrewPlace();
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
function twRoadSpot(L,r){if(L.room)return twRoomSpot(L,r);if(L.roads)return twTownSpot(L,r);for(let n=0;n<40;n++){const ry=L.roadY[Math.floor(r()*L.roadY.length)];const onMain=r()<.3;
  const x=onMain?L.cx+(r()-.5)*22:40+r()*(L.W-80),y=onMain?L.roadY[0]+r()*(L.H-L.roadY[0]-30):ry+4+r()*18;if(!TW||twFree(x,y))return {x,y};}return {x:L.cx,y:L.plaza.y};}

/* ---- 動き（2026-11-26 作り直し。オーナー「直進ではなく自然に曲がって」「NPCも含めて歩いているように見えない」） ----
   - 行き先までは升目（6画素）の A* で道を探し、見通せる所はつないで角を減らす（twPath）
   - 人はそれぞれ向き（hd）と速さ（sp）を持ち、向きは一度に少しずつしか変えられない（曲がりながら弧を描く）。
     動き出しはゆっくり加速し、着く手前で緩める。急に曲がるときは歩みを落とす
   - 足の運びは、実際に進んだ距離で進める（滑って見えないように。8コマで約28画素）
   - 絵の向き（左右・奥・手前）は、しばらく続いたときだけ切り替える（ちらつかないように）
   - 住人は通りの好きな所へ道を探して歩き、着くと立ち止まってあたりを見回す。人とすれ違うときは少しよける */
/* 道を探す升目：物から6画素の余裕をとって塗る（かすって通らないように） */
function twGridBuild(){const T=TW,L=T.L,cs=L.W>700?8:6,gw=Math.ceil(L.W/cs),gh=Math.ceil(L.H/cs);const g=new Uint8Array(gw*gh);
  const ok=(x,y)=>twFreeBody(x,y)&&twFree(x-8,y)&&twFree(x+8,y)&&twFree(x,y+4);
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)g[y*gw+x]=ok(x*cs+cs/2,y*cs+cs/2)?1:0;T.grid={g,gw,gh,cs};}
function twLOS(a,b){const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.ceil(d/3);for(let i=1;i<=n;i++){const t=i/n;if(!twFree(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;}return true;}
function twPath(a,b){const G=TW.grid;if(!G)return [b];const {g,gw,gh,cs}=G;const ci=(x,y)=>Math.max(0,Math.min(gh-1,Math.floor(y/cs)))*gw+Math.max(0,Math.min(gw-1,Math.floor(x/cs)));
  if((Math.abs(a.x-b.x)<3||Math.abs(a.y-b.y)<3)&&twLOS(a,b))return [b];
  let s=ci(a.x,a.y),e=ci(b.x,b.y);
  if(!g[e]){let best=-1,bd=1e9;const ex=e%gw,ey=(e/gw)|0;for(let dy=-6;dy<=6;dy++)for(let dx=-6;dx<=6;dx++){const x=ex+dx,y=ey+dy;if(x<0||y<0||x>=gw||y>=gh||!g[y*gw+x])continue;const d=dx*dx+dy*dy;if(d<bd){bd=d;best=y*gw+x;}}if(best<0)return [];e=best;b={x:(e%gw)*cs+cs/2,y:((e/gw)|0)*cs+cs/2};}
  const N=gw*gh,G2=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),done=new Uint8Array(N);G2[s]=0;
  const hx=i=>Math.abs((i%gw)-(e%gw))+Math.abs(((i/gw)|0)-((e/gw)|0));let it=0;
  const H=[];const push=(n,f)=>{H.push([f,n]);let i=H.length-1;while(i>0){const p=(i-1)>>1;if(H[p][0]<=H[i][0])break;[H[p],H[i]]=[H[i],H[p]];i=p;}};
  const pop=()=>{const t=H[0],l=H.pop();if(H.length){H[0]=l;let i=0;for(;;){const a=2*i+1,b=a+1;let m=i;if(a<H.length&&H[a][0]<H[m][0])m=a;if(b<H.length&&H[b][0]<H[m][0])m=b;if(m===i)break;[H[m],H[i]]=[H[i],H[m]];i=m;}}return t[1];};
  push(s,0);
  while(H.length&&it++<20000){const c=pop();if(done[c])continue;done[c]=1;if(c===e)break;
    const cx=c%gw,cy=(c/gw)|0;const pc=from[c];const pdx=pc>=0?cx-(pc%gw):0,pdy=pc>=0?cy-((pc/gw)|0):0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=gw||y>=gh)continue;const n=y*gw+x;if(!g[n])continue;
      const ng=G2[c]+1+((pdx||pdy)&&(dx!==pdx||dy!==pdy)?0.8:0);if(ng<G2[n]){G2[n]=ng;from[n]=c;push(n,ng+hx(n));}}}
  if(from[e]<0&&e!==s)return [];
  const pts=[];for(let c=e;c!==s&&c>=0;c=from[c])pts.unshift({x:(c%gw)*cs+cs/2,y:((c/gw)|0)*cs+cs/2});pts.push(b);
  // 曲がり角だけ残す（絵は上下左右の4向きなので、斜めには歩かせない。角は歩くときに丸く曲がる）
  const out=[];for(let i=0;i<pts.length;i++){const p=pts[i-1]||a,q=pts[i],r=pts[i+1];if(!r){out.push(q);break;}if(Math.sign(q.x-p.x)!==Math.sign(r.x-q.x)||Math.sign(q.y-p.y)!==Math.sign(r.y-q.y))out.push(q);}
  return out;}
const twAng=(a,b)=>{let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};
/* 人どうしは重ならない（半径9）。近づく向きの動きだけ止める */
function twBump(o,x,y){if(!TW)return false;for(const m of [TW.lead,...TW.follow,...TW.npcs]){if(!m||m===o)continue;const d2=(m.x-x)**2+((m.y-y)*1.4)**2,d0=(m.x-o.x)**2+((m.y-o.y)*1.4)**2;if(d2<81&&d2<d0)return true;}return false;}
function twStep(o,dx,dy){let moved=0;if(dx&&twFreeBody(o.x+dx,o.y)&&!twBump(o,o.x+dx,o.y)){o.x+=dx;moved+=Math.abs(dx);}if(dy&&twFreeBody(o.x,o.y+dy)&&!twBump(o,o.x,o.y+dy)){o.y+=dy;moved+=Math.abs(dy);}return moved;}
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
    if(dl<26&&Ld.mv&&!n.keeper&&!n.seated&&Math.abs(twAng(Ld.hd,Math.atan2(n.y-Ld.y,n.x-Ld.x)))<0.8&&!n.side){   // 歩いてくる先頭に道をあける
      const px=-Math.sin(Ld.hd),py=Math.cos(Ld.hd);const sgn=twAng(Ld.hd,Math.atan2(n.y-Ld.y,n.x-Ld.x))>0?1:-1;const sx=n.x+px*16*sgn,sy=n.y+py*16*sgn;if(twFree(sx,sy)){n.side=1;n.path=[{x:sx,y:sy}];n.wait=0;}}
    if(dl<18&&!Ld.mv){twMove(n,dt,null,0);if(!n.mv){n.hd=Math.atan2(Ld.y-n.y,Ld.x-n.x);twDirOf(n,1);}continue;}
    if(n.wait>0){n.wait-=dt;twMove(n,dt,null,0);if(n.look&&n.wait<n.look){n.hd+=Math.PI*(Math.random()<.5?.5:-.5);n.look=0;twDirOf(n,1);}continue;}
    if(!n.path||!n.path.length){const g=twRoadSpot(L,Math.random);n.path=twPath(n,g);if(!n.path.length){n.wait=1;continue;}}
    // 前に人がいれば：向かってくる相手なら右へよけ、同じ向きなら歩みを落として待つ（かすらない）
    let slow=1;for(const m of [Ld,...TW.npcs,...TW.follow]){if(m===n)continue;const dx=m.x-n.x,dy=m.y-n.y,d=Math.hypot(dx,dy);if(d>30||d<.1)continue;const a=twAng(n.hd,Math.atan2(dy,dx));if(Math.abs(a)>0.9)continue;
      const head=m.mv&&Math.abs(twAng(m.hd,n.hd))>2.2;slow=Math.min(slow,Math.max(0,(d-12)/16));
      if((head||d<20)&&!n.side){const px=-Math.sin(n.hd),py=Math.cos(n.hd);for(const sgn of [1,-1]){const sx=n.x+px*14*sgn,sy=n.y+py*14*sgn;if(twFree(sx,sy)&&!twBump(n,sx,sy)){n.side=1;(n.path=n.path||[]).unshift({x:sx,y:sy});break;}}}}
    if(n.side&&n.path&&n.path.length&&Math.hypot(n.path[0].x-n.x,n.path[0].y-n.y)<4)n.side=0;
    if(slow<1){n.waitT=(n.waitT||0)+dt;if(n.waitT>2.5){n.path=null;n.waitT=0;n.side=0;continue;}}else n.waitT=0;
    const done=twFollowPath(n,dt,n.vmax*Math.max(.15,slow));
    if(done){n.path=null;n.wait=1.2+Math.random()*4;n.look=Math.random()<.6?n.wait*(.3+Math.random()*.4):0;}}
  // 重なっている人は少しずつ離す（現れた場所が近すぎたときなど）
  {const all=[Ld,...TW.follow,...TW.npcs];for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const a=all[i],c=all[j];const dx=c.x-a.x,dy=(c.y-a.y)*1.4,d=Math.hypot(dx,dy);if(d<9){const ux=d>.01?dx/d:1,uy=d>.01?dy/d/1.4:0;
    for(const [o,sg] of [[a,-1],[c,1]]){if(o===Ld||o.keeper||o.seated)continue;const nx=o.x+ux*.6*sg,ny=o.y+uy*.6*sg;if(twFreeBody(nx,ny)){o.x=nx;o.y=ny;}}}}}
  twTouch(dt);
  // 近くの用事
  TW.act=twNear();const pr=document.getElementById('twprompt');
  if(pr){const t=TW.say?'':TW.act?TW.act.label:'';if(pr.dataset.t!==t){pr.dataset.t=t;pr.innerHTML=t?`<button>${t}</button>`:'';const b=pr.querySelector('button');if(b)b.onclick=()=>twInteract();}}
  twRender();TW.raf=requestAnimationFrame(twFrame);}
function twNear(){const Ld=TW.lead,L=TW.L;let best=null,bd=1e9;
  if(L.room){const kp=TW.npcs.find(n=>n.keeper);if(kp){const dx=Math.abs(Ld.x-kp.x),dy=Ld.y-kp.y;if(dx<34&&dy>-8&&dy<48)return {kind:'keeper',n:kp,label:`${kp.title}と話す`};}
    if(L.room==='home'){const ch=L.props.find(p=>p.art==='chest');if(ch&&Math.hypot(Ld.x-ch.x,Ld.y-ch.by)<28)return {kind:'chest',label:'物置の箱を開ける'};}}
  for(const n of TW.npcs){if(n.keeper)continue;if(n.crew){const d=Math.hypot(n.x-Ld.x,(n.y-Ld.y)*1.3);if(d<24&&d<bd){bd=d;best={kind:'crew',n,label:n.captain?`「${S.hire.name}」の隊長と話す（出発）`:`${CHAR_DB[n.crew].name}（${S.hire.name}）と話す`};}continue;}const d=Math.hypot(n.x-Ld.x,(n.y-Ld.y)*1.3);if(d<22&&d<bd){bd=d;best={kind:'npc',n,label:`${n.named?(S.seek[n.named]?CHAR_DB[n.named].name:CHAR_LOOK[n.named]):npcName(L.k,npcAt(L.k,n.i))}に話しかける`};}}
  if(best)return best;
  if(L.room){if(Math.abs(Ld.x-L.cx)<22&&Ld.y>L.H-22)return {kind:'exit',label:'外へ出る'};return null;}
  for(const b of L.blds){const dx=Math.abs(Ld.x-b.x),dy=Ld.y-b.by;if(dx<14&&dy>-2&&dy<16)return {kind:'bld',b,label:b.f?`${FACILITIES[b.f].name}に入る`:'民家の戸を叩く'};}
  if(L.exit&&Math.abs(Ld.x-L.exit.x)<30&&Ld.y>L.H-34)return {kind:'gate',label:S.hire?`町を出る（「${S.hire.name}」は出口で待っている）`:'町を出る'};
  return null;}
function twInteract(){if(!TW)return;if(TW.say){twSayClose();return;}const a=TW.act;if(!a)return;
  if(a.kind==='npc')twTalk(a.n);
  else if(a.kind==='bld'){if(!a.b.f){twSay({who:'',text:['……返事はない。留守のようだ','戸の向こうで、赤子が泣いている','「間に合ってるよ」と、戸越しに断られた'][Math.floor(Math.random()*3)]});return;}
    twEnterRoom(a.b.f,a.b);}
  else if(a.kind==='keeper')twOpenCounter(TW.L.room);
  else if(a.kind==='chest')twOpenCounter('home');
  else if(a.kind==='exit')twLeaveRoom();
  else if(a.kind==='gate'){if(S.hire){twSay({who:'',text:`雇われの身だ。「${S.hire.name}」の隊長に声をかけないと、隊は出発しない。`});return;}twStop();DEPART=true;WSEL=null;renderPrep();}
  else if(a.kind==='crew')twCrewTalk(a.n);}
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
  for(const n of TW.npcs)if(Math.abs(wx-n.x)<9&&wy<n.y+3&&wy>n.y-36){const g={x:n.x+(TW.lead.x<n.x?-14:14),y:n.y};if(n.keeper){g.x=n.x;g.y=n.y+34;}TW.target={then:()=>{TW.act=twNear();if(TW.act&&TW.act.kind!=='exit')twInteract();}};TW.lead.path=twPath(TW.lead,g);return;}
  for(const b of L.blds){const im=twArt(b.art);if(im&&Math.abs(wx-b.x)<im.width/2&&wy<b.by&&wy>b.by-im.height){TW.target={then:()=>{TW.act=twNear();if(TW.act&&TW.act.kind==='bld')twInteract();}};TW.lead.path=twPath(TW.lead,{x:b.x,y:b.by+8});return;}}
  TW.target=null;TW.lead.path=twPath(TW.lead,{x:wx,y:wy});}

/* ---- 描く ---- */
function twRender(){const T=TW,g=T.cv.getContext('2d'),L=T.L,img=T.img;const sc=T.sc,dpr=T.dpr;const vw=T.cv.width/dpr/sc,vh=T.cv.height/dpr/sc;
  T.camX=Math.max(0,Math.min(L.W-vw,T.lead.x-vw/2));T.camY=Math.max(0,Math.min(L.H-vh,T.lead.y-vh*.55));if(L.W<vw)T.camX=(L.W-vw)/2;if(L.H<vh)T.camY=(L.H-vh)/2;
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#10140e';g.fillRect(0,0,T.cv.width,T.cv.height);
  g.setTransform(sc*dpr,0,0,sc*dpr,-Math.round(T.camX*sc*dpr),-Math.round(T.camY*sc*dpr));g.imageSmoothingEnabled=false;
  g.drawImage(T.ground,0,0);
  twDrawMarks(g);
  // 立っている物を足もとの奥行き順に
  const items=[];
  for(const b of L.blds)items.push({y:b.by,draw:()=>{const im=twArt(b.art);if(im)g.drawImage(im,Math.round(b.x-im.width/2),Math.round(b.by-im.height));}});
  for(const p of L.props){if(p.flat)continue;items.push({y:p.by,draw:()=>{const im=twArt(p.art);if(!im)return;const x=Math.round(p.x-im.width/2),y=Math.round(p.by-im.height);
    const sk=(p.shake>0?Math.sin(T.t*38+p.x)*p.shake*2.4:0)+(twIsPlant(p.art)?Math.sin(T.t*1.3+p.x*.05)*.5:0);
    if(sk&&twIsPlant(p.art)){g.save();g.translate(p.x,p.by);g.transform(1,0,sk*.03,1,0,0);g.drawImage(im,-im.width/2,-im.height);g.restore();}else g.drawImage(im,x,y);}});}
  for(const o of [T.lead,...T.follow,...T.npcs])items.push({y:o.y,draw:()=>twDraw(g,o,T.t)});
  items.sort((a,b)=>a.y-b.y);for(const it of items)it.draw();
  twDrawFx(g);
  // 灯りと空気
  const air=L.room?{}:twAir(L.k);g.setTransform(dpr,0,0,dpr,0,0);
  if(air.tint){g.fillStyle=air.tint;g.fillRect(0,0,T.cv.width,T.cv.height);}
  twParticles(g,air,T.cv.width/dpr,T.cv.height/dpr);
  // 看板（施設の名前）
  g.font='600 12px "Yu Gothic","Hiragino Sans",sans-serif';g.textAlign='center';g.textBaseline='middle';
  for(const b of L.blds){if(!b.f)continue;const im=twArt(b.art);const sx=(b.x-T.camX)*sc,sy=(b.by-(im?im.height:60)*.42-T.camY)*sc;   /* 名札は建物の正面の壁（軒の下）に掛ける。前は屋根の上で、上の建物の名札に見えていた */if(sx<-60||sx>innerWidth+60||sy<-20||sy>innerHeight+20)continue;
    const t=FACILITIES[b.f].name;const w=g.measureText(t).width+12;g.fillStyle='rgba(16,12,8,.72)';g.fillRect(sx-w/2,sy-9,w,18);g.fillStyle='#f0e2c0';g.fillText(t,sx,sy+1);}
  // 名のある人物には小さな印（話したことがあれば名前）
  for(const n of T.npcs){if(!n.captain)continue;const sx=(n.x-T.camX)*sc,sy=(n.y-42-T.camY)*sc;const t=`「${S.hire?S.hire.name:''}」集合`;const w=g.measureText(t).width+12;g.fillStyle='rgba(16,12,8,.78)';g.fillRect(sx-w/2,sy-9,w,18);g.fillStyle='#ffd23a';g.fillText(t,sx,sy+1);}
  for(const n of T.npcs){if(!n.named)continue;const sx=(n.x-T.camX)*sc,sy=(n.y-40-T.camY)*sc;const m=S.seek[n.named]||0;g.fillStyle='rgba(16,12,8,.7)';const t=m?CHAR_DB[n.named].name:'？';const w=g.measureText(t).width+10;g.fillRect(sx-w/2,sy-8,w,16);g.fillStyle='#ffd23a';g.fillText(t,sx,sy+1);}}
function twParticles(g,air,w,h){const T=TW;if(!air.snow&&!air.petal&&!air.sand)return;if(!T.parts.length)for(let i=0;i<(air.sand?40:70);i++)T.parts.push({x:Math.random()*w,y:Math.random()*h,v:.5+Math.random(),s:Math.random()*6});
  for(const p of T.parts){p.y+=(air.sand?.2:p.v*.6);p.x+=air.sand?p.v*2.2:Math.sin(T.t+p.s)*.4+(air.petal?.5:0);if(p.y>h)p.y=-4;if(p.x>w)p.x=-4;
    g.fillStyle=air.snow?'rgba(255,255,255,.85)':air.petal?'rgba(244,170,190,.85)':'rgba(230,200,140,.35)';
    if(air.petal){g.beginPath();g.ellipse(p.x,p.y,2.4,1.3,T.t+p.s,0,Math.PI*2);g.fill();}else g.fillRect(p.x,p.y,air.sand?3:2,air.sand?1:2);}}

/* ---- 建物の中（管理画面の作りを使い、施設の板だけを出す） ---- */
function townInsideHtml(ids){const k=S.base;const f=TOWN_IN;const F=FACILITIES[f];
  let h=`<div class="tm tw-in"><nav class="tm-nav"><div class="crest">${ico(F.icon)}<b>${F.name}</b><span class="goldv">${TOWNS[k].name}</span><span class="goldv" title="手持ちの金">金 <b>${S.gold}</b></span></div>
    <button class="tw-out" id="twout">${TWROOM?'戻る':'外へ出る'}</button></nav>`;
  h+=`<div class="fr facp">${facHtml(k,f,ids)}</div>`;
  // 住人の一覧は出さない（2026-11-26、オーナー「これは？」）。町の人とは、町や酒場の中を歩いて会って話す
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

/* ============ 建物の中を歩く（2026-11-26、オーナー「建物の中も歩けるようにしたい」） ============
   - 家具・床・壁は ChatGPT に町の絵を見本として描かせたもの（art/cut_interior.py → data/interior_img.js の INT_IMG）
   - 戸口から入ると、その施設の部屋（twRoom）。奥の壁・床・家具・店の主人（カウンターの向こう）・客
   - 主人に話しかけると、前と同じ施設の板（買う・売る・泊まる…）。「戻る」で部屋に戻る
   - 酒場には客が座っていて、話しかけられる（町の住人と同じ talkTo）。わが家は物置の箱を開けると預けられる
   - 下の出口から町へ。出た所は入った戸口の前 */
let TW_INT=null, TWTOWN=null, TWROOM=null;
async function twLoadInt(){if(TW_INT||typeof INT_IMG==='undefined')return;const o={};for(const [k,v] of Object.entries(INT_IMG))o[k]=await fImg(v);TW_INT=o;}
const twArt=n=>(TW_INT&&TW_INT[n])||(typeof TW_TOWNIMG!=='undefined'&&TW_TOWNIMG&&TW_TOWNIMG[n])||(typeof TW_VAR!=='undefined'&&TW_VAR[n])||(FLD.bg&&FLD.bg[n]);
const ROOM_LOOK={inn:['f_wood','w_plaster'],tavern:['f_wood','w_plaster'],home:['f_wood','w_plaster'],tool:['f_wood','w_wood'],weapon:['f_wood','w_wood'],armor:['f_wood','w_wood'],jewel:['f_wood','w_window'],
  grimoire:['f_wood','w_wood'],maps:['f_wood','w_window'],smith:['f_earth','w_stone'],guild:['f_stone','w_plaster'],shrine:['f_stone','w_stone'],dojo:['f_mat','w_wood']};
const KEEPER={inn:['宿の女将','b_hunter'],tavern:['酒場の主人','b_tank'],tool:['道具屋の主人','b_sword'],weapon:['武器屋の親父','b_sword'],armor:['防具屋の主人','b_tank'],jewel:['装飾品屋の主人','b_mage'],
  grimoire:['魔導書屋の老人','b_mage'],maps:['地図屋の主人','b_mage'],smith:['鍛冶屋の親方','b_tank'],guild:['ギルドの受付','b_hunter'],shrine:['祠守り','b_priest'],dojo:['師範','b_sword']};
function twRoom(k,f){const W=304,H=232,WH=52,cx=W/2;const props=[];const P=(art,x,by,solid=true,flat=false)=>props.push({art,x:Math.round(x),by:Math.round(by),solid,flat});
  let keeper=null;const seats=[];
  const shopBack=(a,b)=>{P(a,64,WH+44);P(b||a,W-64,WH+44);};
  switch(f){
    case 'inn':P('counter',78,128);keeper={x:78,y:110};P('fireplace',cx+40,WH+50);P('bed',W-44,150);P('bed',W-44,204);P('rtable',cx-50,190);P('rug',cx,176,false,true);P('plant',22,WH+30);seats.push({x:cx-72,y:192},{x:cx-28,y:192});break;
    case 'tavern':P('bar',cx,110);keeper={x:cx,y:92};P('barrels',cx+74,WH+42);P('shelf',cx-76,WH+44);P('rtable',60,150);P('rtable',W-60,150);P('rtable',60,206);P('rtable',W-60,206);P('candela',24,WH+30);P('candela',W-24,WH+30);
      seats.push({x:38,y:152},{x:82,y:152},{x:W-82,y:152},{x:W-38,y:152},{x:38,y:208},{x:82,y:208},{x:W-82,y:208},{x:W-38,y:208});break;   // 入口から主人までの真ん中は空けておく
    case 'home':P('bed',52,WH+60);P('fireplace',cx+20,WH+50);P('ltable',cx-56,176);P('rug',cx,170,false,true);P('chest',W-48,WH+40);P('plant',W-22,190);break;
    case 'smith':P('forge',cx+50,WH+56);P('anvil',cx-24,150);keeper={x:cx+6,y:146};P('rack',60,WH+44);P('barrels',W-36,190);P('crates',36,200);break;
    case 'guild':P('counter',cx,128);keeper={x:cx,y:110};P('board',60,WH+36);P('bookshelf',W-60,WH+48);P('ltable',W-76,196);P('candela',24,WH+30);seats.push({x:W-100,y:198},{x:W-52,y:198});break;
    case 'shrine':P('altar',cx,WH+54);P('candela',cx-46,WH+50);P('candela',cx+46,WH+50);P('rug',cx,170,false,true);keeper={x:cx-30,y:WH+70};P('plant',24,200);P('plant',W-24,200);break;
    case 'dojo':P('rack',64,WH+44);P('rack',W-64,WH+44);P('armor',cx+40,WH+44);keeper={x:cx,y:WH+64};P('barrels',W-30,200);break;
    case 'weapon':shopBack('rack');P('rack',cx,WH+40);P('counter',cx,132);keeper={x:cx,y:114};P('crates',30,200);P('armor',W-30,200);break;
    case 'armor':shopBack('armor');P('armor',cx,WH+44);P('counter',cx,132);keeper={x:cx,y:114};P('chest',36,200);break;
    case 'jewel':shopBack('shelf');P('candela',cx-30,WH+34);P('candela',cx+30,WH+34);P('counter',cx,132);keeper={x:cx,y:114};P('chest',W-36,200);P('plant',26,200);break;
    case 'grimoire':case 'maps':shopBack('bookshelf');P('bookshelf',cx,WH+48);P('counter',cx,132);keeper={x:cx,y:114};P('ltable',60,196);P('candela',W-26,200);break;
    default:shopBack('shelf');P('barrels',cx,WH+40);P('counter',cx,132);keeper={x:cx,y:114};P('crates',32,200);P('plant',W-26,200);
  }
  const look=ROOM_LOOK[f]||['f_wood','w_wood'];
  return {k,room:f,W,H,WH,cx,top:WH-18,blds:[],props,keeper,seats,floor:look[0],wall:look[1],roadY:[],plaza:{x:cx,y:H/2,w:0,h:0},gate:null,door:{x:cx,y:H-6}};}
function twRoomGround(L){const c=document.createElement('canvas');c.width=L.W;c.height=L.H;const g=c.getContext('2d');
  const fl=twArt(L.floor),wl=twArt(L.wall);
  g.fillStyle=fl?g.createPattern(fl,'repeat'):'#5a4330';g.fillRect(0,0,L.W,L.H);
  // 奥の壁
  if(wl){for(let x=0;x<L.W;x+=wl.width-2)g.drawImage(wl,x,L.WH-wl.height);}else{g.fillStyle='#3a2c20';g.fillRect(0,0,L.W,L.WH);}
  g.fillStyle='#120e0a';g.fillRect(0,0,L.W,Math.max(0,L.WH-(wl?wl.height:L.WH)));
  // 壁の足もとの影
  const sh=g.createLinearGradient(0,L.WH,0,L.WH+14);sh.addColorStop(0,'rgba(0,0,0,.45)');sh.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=sh;g.fillRect(0,L.WH,L.W,14);
  // 左右と手前の壁（梁）
  g.fillStyle='#2a1d12';g.fillRect(0,L.WH-8,7,L.H);g.fillRect(L.W-7,L.WH-8,7,L.H);g.fillRect(0,L.H-7,L.W,7);
  g.fillStyle='#5a3f24';g.fillRect(6,L.WH-8,2,L.H);g.fillRect(L.W-8,L.WH-8,2,L.H);g.fillRect(0,L.H-8,L.W,2);
  // 出口（手前の真ん中）と戸口の敷物
  g.fillStyle='#0c0907';g.fillRect(L.cx-17,L.H-8,34,8);
  const dw=twArt('doorway');if(dw){g.drawImage(dw,0,dw.height-11,dw.width,11,L.cx-dw.width*.17,L.H-19,dw.width*.34,11);}
  // 平らな物（敷物）は床に焼く
  for(const p of L.props)if(p.flat){const im=twArt(p.art);if(im)g.drawImage(im,Math.round(p.x-im.width/2),Math.round(p.by-im.height/2));}
  // 窓の光
  const lt=g.createRadialGradient(L.W/2,L.WH+20,10,L.W/2,L.WH+40,L.W*.7);lt.addColorStop(0,'rgba(255,214,150,.10)');lt.addColorStop(1,'rgba(0,0,0,.22)');g.fillStyle=lt;g.fillRect(0,0,L.W,L.H);
  return c;}
function twRoomNpcs(L){const out=[];const k=L.k;const f=L.room;const r=seeded(S.wseed+':room:'+k+':'+f+':'+S.turn);const arts=['b_sword','b_tank','b_mage','b_hunter','b_priest','b_thief'];
  if(L.keeper){const K=KEEPER[f]||['店の主人','b_sword'];out.push({keeper:1,title:K[0],key:K[1],x:L.keeper.x,y:L.keeper.y,dir:'d',hd:Math.PI/2,sp:0,vmax:0,mv:false,ph:0,wait:1e9,path:null});}
  const pop=townPop(k);const nSeat=f==='tavern'?4:f==='guild'?2:f==='inn'?1:0;const used=new Set();
  for(let j=0;j<nSeat&&j<L.seats.length;j++){const s=L.seats[Math.floor(r()*L.seats.length)];if(used.has(s))continue;used.add(s);const i=Math.floor(r()*pop);out.push({i,key:arts[Math.floor(r()*arts.length)],x:s.x,y:s.y,dir:s.x<L.cx?'r':'l',hd:s.x<L.cx?0:Math.PI,sp:0,vmax:0,mv:false,ph:r()*8,wait:1e9,seated:1,path:null});}
  const nWalk=f==='tavern'?2:f==='guild'||f==='inn'?1:r()<.5?1:0;
  for(let j=0;j<nWalk;j++){const i=Math.floor(r()*pop);const p={x:40+r()*(L.W-80),y:L.WH+70+r()*(L.H-L.WH-100)};out.push({i,key:arts[Math.floor(r()*arts.length)],x:p.x,y:p.y,dir:'d',hd:r()*6.28,sp:0,vmax:16+r()*8,mv:false,ph:r()*8,wait:1+r()*3,path:null});}
  // 名のある人物は、ときどき酒場で一杯やっている
  if(f==='tavern')for(const c of Object.keys(S.where||{}).filter(c=>S.where[c]===k&&seekable(c))){if(r()<.5){const s=L.seats.find(x=>!used.has(x));if(s){used.add(s);out.push({named:c,key:c,x:s.x,y:s.y,dir:s.x<L.cx?'r':'l',hd:0,sp:0,vmax:0,mv:false,ph:0,wait:1e9,seated:1,path:null});}}}
  return out;}
function twRoomSpot(L,r){for(let n=0;n<40;n++){const x=24+r()*(L.W-48),y=L.WH+40+r()*(L.H-L.WH-60);if(!TW||twFree(x,y))return {x,y};}return {x:L.cx,y:L.H-40};}
/* 町 → 部屋 */
function twEnterRoom(f,b){if(!TW)return;TW.lead.x=b?b.x:TW.lead.x;TW.lead.y=b?b.by+10:TW.lead.y+6;TW.lead.dir='d';TW.lead.hd=Math.PI/2;TW.lead.path=null;TW.lead.sp=0;
  TWTOWN=TW;twStop();TW=null;renderTown({room:f});}
/* 部屋 → 町（入った戸口の前） */
function twLeaveRoom(){twStop();if(TWTOWN&&TWTOWN.k===S.base&&TWTOWN.turn===S.turn){TW=TWTOWN;TWTOWN=null;renderTown({});}else{TW=null;TWTOWN=null;renderTown({});}}
/* 主人と話す → 施設の板 */
function twOpenCounter(f){TWROOM=TW;twStop();TOWN_IN=f;TOWNF=f;NPCSEL=null;renderPrep();scrollTo(0,0);}

/* ============ 町の細かい演出（2026-11-26、オーナー「雪が積もっているなら近づけば落ちるとか、細かい演出を全体的に」） ============
   - 人がそばを通ると、木や茂みが揺れる（p.shake）。大陸ごとに、揺れた木から落ちるものが違う：
     北の雪国＝枝の雪がどさっと落ちて足もとに積もる／八洲＝桜や紅葉の葉が舞う／密林・中つ国＝葉が落ちる／砂の大陸＝砂がこぼれる／エルドラ＝紫の光の粒が舞い上がる
   - 歩くと足跡が残る：雪は深い足跡（しばらく残る）、砂は浅い跡と砂ぼこり、ほかは小さな土ぼこり。港の水ぎわでは水しぶきはなし
   - 木や茂みは、風でわずかに揺れている
   - 部屋の中では何も起きない */
function twIsPlant(a){const m=/^c\dn(\d+)$/.exec(a);if(m)return +m[1]<10;return /^(tree|bush|pine|grass|bigtree|reeds|cattail|deadtree)/.test(a);}
function twTouch(dt){const T=TW;if(!T||T.L.room)return;const air=twAir(T.L.k);const c=(TOWNS[T.L.k]||{}).cont||'c0';
  T.fx=T.fx||[];T.marks=T.marks||[];
  for(const p of T.L.props)if(p.shake>0)p.shake=Math.max(0,p.shake-dt*1.4);
  if(!T.pb){T.pb={};for(const p of T.L.props){if(!twIsPlant(p.art))continue;const k=Math.floor(p.x/64)+','+Math.floor(p.by/64);(T.pb[k]=T.pb[k]||[]).push(p);}}
  for(const m of [T.lead,...T.follow,...T.npcs]){if(!m.mv)continue;
    // 足跡
    m.stepAcc=(m.stepAcc||0)+Math.hypot(m.x-(m.px??m.x),m.y-(m.py??m.y));m.px=m.x;m.py=m.y;
    if(m.stepAcc>7){m.stepAcc=0;m.foot=!m.foot;const side=m.foot?2:-2;const px=-Math.sin(m.hd)*side,py=Math.cos(m.hd)*side;
      if(air.snow)T.marks.push({x:m.x+px,y:m.y+py,t:0,life:14,kind:'snow',a:m.hd});
      else if(air.sand){T.marks.push({x:m.x+px,y:m.y+py,t:0,life:5,kind:'sand',a:m.hd});if(Math.random()<.5)T.fx.push({x:m.x,y:m.y-1,vx:(Math.random()-.5)*8,vy:-6-Math.random()*6,t:0,life:.7,kind:'dust',c:'rgba(230,200,140,'});}
      else if(Math.random()<.35)T.fx.push({x:m.x,y:m.y-1,vx:(Math.random()-.5)*6,vy:-4-Math.random()*4,t:0,life:.5,kind:'dust',c:'rgba(150,130,100,'});}
    // そばの木や茂みを揺らす
    const k0=Math.floor(m.x/64),k1=Math.floor(m.y/64);
    for(let gx=k0-1;gx<=k0+1;gx++)for(let gy=k1-1;gy<=k1+1;gy++)for(const p of (T.pb[gx+','+gy]||[])){
      const im=twArt(p.art);if(!im)continue;const r=Math.min(im.width*.5,28)+6;const dx=m.x-p.x,dy=(m.y-p.by)*1.6;if(dx*dx+dy*dy>r*r)continue;
      if(p.shake>.25)continue;p.shake=1;twShed(p,im,c,air);}}
  // 粒と跡を進める
  for(const f of T.fx){f.t+=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;if(f.g)f.vy+=f.g*dt;if(f.sway)f.x+=Math.sin(f.t*4+f.ph)*f.sway*dt;if(f.floor!=null&&f.y>=f.floor){f.y=f.floor;f.vx=0;f.vy=0;f.g=0;f.sway=0;if(f.kind==='snow'){f.kind='pile';f.life=Math.max(f.life,f.t+8);}}}
  T.fx=T.fx.filter(f=>f.t<f.life);if(T.fx.length>700)T.fx.splice(0,T.fx.length-700);
  for(const k of T.marks)k.t+=dt;T.marks=T.marks.filter(k=>k.t<k.life);if(T.marks.length>500)T.marks.splice(0,T.marks.length-500);}
/* 揺れた木から落ちるもの */
function twShed(p,im,c,air){const T=TW;const top=p.by-im.height,w=im.width*.6;const R=Math.random;
  const big=im.height>50;const n=big?14:6;
  for(let i=0;i<n;i++){const x=p.x+(R()-.5)*w,y=top+im.height*(.15+R()*.45);const floor=p.by+(R()-.3)*10;
    if(air.snow)T.fx.push({x,y,vx:(R()-.5)*10,vy:10+R()*20,g:160,t:0,life:3,floor,kind:'snow',sz:1+R()*2.2});
    else if(c==='c2')T.fx.push({x,y,vx:(R()-.5)*16,vy:4+R()*8,g:12,sway:22,ph:R()*6,t:0,life:5,floor,kind:'leaf',col:R()<.6?'#f3a9c0':'#d9502e'});
    else if(c==='c3'){if(i<3)T.fx.push({x,y:p.by-im.height*.2,vx:(R()-.5)*10,vy:2,g:90,t:0,life:1.2,floor,kind:'dust',c:'rgba(230,200,140,'});}
    else if(c==='c5')T.fx.push({x,y,vx:(R()-.5)*8,vy:-6-R()*10,t:0,life:2.5,kind:'spark'});
    else if(i<(big?6:3))T.fx.push({x,y,vx:(R()-.5)*14,vy:6+R()*8,g:14,sway:18,ph:R()*6,t:0,life:4.5,floor,kind:'leaf',col:c==='c4'?'#4e8a3a':R()<.5?'#7a9a3c':'#b8862e'});}}
function twDrawMarks(g){const T=TW;if(!T.marks)return;for(const k of T.marks){const a=Math.max(0,1-k.t/k.life);
  if(k.kind==='snow'){g.fillStyle=`rgba(120,140,170,${.55*a})`;g.save();g.translate(k.x,k.y);g.rotate(k.a+Math.PI/2);g.beginPath();g.ellipse(0,0,1.6,2.6,0,0,Math.PI*2);g.fill();g.restore();}
  else{g.fillStyle=`rgba(120,90,50,${.35*a})`;g.fillRect(Math.round(k.x)-1,Math.round(k.y),2,1);}}}
function twDrawFx(g){const T=TW;if(!T.fx)return;for(const f of T.fx){const a=Math.max(0,1-f.t/f.life);
  if(f.kind==='snow'||f.kind==='pile'){const al=f.kind==='pile'?Math.min(1,a*3):1;const s=Math.ceil((f.sz||2)+1),X=Math.round(f.x),Y=Math.round(f.y);   // 雪の上でも見えるよう、青い影を下に付ける
    g.fillStyle=`rgba(110,130,170,${.7*al})`;g.fillRect(X-1,Y+1,s+2,f.kind==='pile'?2:s);g.fillStyle=`rgba(255,255,255,${al})`;g.fillRect(X,Y,s,f.kind==='pile'?Math.max(2,s-1):s);}
  else if(f.kind==='leaf'){g.fillStyle=f.col;g.globalAlpha=Math.min(1,a*2);g.save();g.translate(f.x,f.y);g.rotate(f.t*3+f.ph);g.fillRect(-1.5,-.8,3,1.6);g.restore();g.globalAlpha=1;}
  else if(f.kind==='dust'){g.fillStyle=f.c+(.5*a)+')';g.beginPath();g.arc(f.x,f.y,1.5+(1-a)*2.5,0,Math.PI*2);g.fill();}
  else if(f.kind==='spark'){g.fillStyle=`rgba(200,140,255,${a})`;g.fillRect(Math.round(f.x),Math.round(f.y),2,2);g.fillStyle=`rgba(200,140,255,${a*.3})`;g.fillRect(Math.round(f.x)-1,Math.round(f.y)-1,4,4);}}}

/* ============ 雇われの集合（2026-11-26、オーナー「雇われたけど、どこで出るねん。勝手に町も出られるぞ」） ============
   雇い主の隊の者は一行について歩かず、町の出口のそばに集まって待つ（頭の上に「〇〇」集合）。
   隊長に話しかけて「出発する」で、隊長の決めた行き先へ出発する（世界地図では選ばない）。それまで町は出られない。
   右上の案内にも、集合場所を出す */
function twCrewPlace(){const T=TW;if(!S.hire||!T||T.L.room)return;T.npcs=T.npcs.filter(n=>!n.crew);const ids=partyIds().filter(isTemp);if(!ids.length)return;
  const L=T.L;const ex=L.exit||{x:L.W/2,y:L.H};let k=0;
  for(const id of ids){let x=ex.x+(k%2?1:-1)*(22+Math.floor(k/2)*16),y=L.H-56-(k%2)*6;for(let tries=0;tries<30&&!twFreeBody(x,y);tries++){x+=(Math.random()-.5)*20;y-=4;}
    T.npcs.push({crew:id,captain:!!CHAR_DB[id].captain,key:id,x,y,dir:'u',hd:-Math.PI/2,sp:0,vmax:0,mv:false,ph:k,wait:1e9,seated:1,path:null});k++;}}
function twCrewTalk(n){const H=S.hire;if(!H)return;n.hd=Math.atan2(TW.lead.y-n.y,TW.lead.x-n.x);twDirOf(n,1);
  if(!n.captain){twSay({npc:n,who:CHAR_DB[n.crew].name,sub:`「${H.name}」・${ROLES[CHAR_DB[n.crew].role]||''}`,text:['支度はいいか。隊長に声をかけたら出るぞ','雇われでも、背中は預けるからな','分け前は帰ってからだ']['abc'.indexOf('a')+Math.floor(Math.random()*3)]});return;}
  const d=PLACE(S.diveTo);
  twSay({npc:n,who:CHAR_DB[n.crew].name,sub:`「${H.name}」の隊長`,text:`揃ったな。行き先は${d?d.name:'迷宮'}だ。陣形と戒律はこっちで決めてある。出るぞ`,depart:true});
  const el=document.querySelector('#twsay .tw-btns');if(el){const b=document.createElement('button');b.className='tw-b gold';b.textContent='出発する';b.onclick=()=>{twSayClose();twStop();startBattle();};el.prepend(b);}}
