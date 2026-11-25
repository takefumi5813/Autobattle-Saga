/* 立体と通れない所（2026-11-25 作り直し。オーナー「構築物の取り扱いが非常に雑で、すり抜けが起きている。全体的に非常に丁寧に立体処理を」
   「敵もきちんと構築物を避けて動くように」「攻撃時の動きもうまく」「キャラクターが重ならないように」「草や木が風で動くと良い」）
   - 立っている物はすべて、絵から足もとの形を割り出す（木は幹だけ、岩や茂みは根元の輪郭、建物は土台の幅と奥行き、門は柱2本）。
     形は地図（世界）の座標で持つ（絵は世界の向きに立っているので、曲がった道の帯の座標で持つと斜めにずれる）
   - 4画素の升目で「通れる／通れない」を作り、まっすぐ行けないときは回り道を探す（A*）。仲間・敵・旅の一行が使う
   - 体どうしは重ならない（人は半径6、大物は12）
   - 木・茂み・草・葦は風で傾く。天気（強い風・雨）で強く、迷宮では止まる。草は踏み分けられる */
const NAV_CS=4,BODY_R=5;
const SWAY_AMP={tree:.065,pine:.05,big:.03,dead:.025,bush:.08,grass:.16,reed:.2,scare:.025};
/* 絵の種類：足もとの形（f）と、風での揺れ（s） */
function fFootKind(BG,img,lamp){const is=(...ks)=>ks.some(k=>BG[k]&&BG[k]===img);
  if(lamp)return {f:'post'};
  if(is('tree1','tree2','tree3'))return {f:'trunk',s:'tree'};
  if(is('pine1','pine2'))return {f:'trunk',s:'pine'};
  if(is('bigtree'))return {f:'trunk',s:'big'};
  if(is('deadtree','deadtree2'))return {f:'trunk',s:'dead'};
  if(is('bush1','bush2','bush3'))return {f:'blob',s:'bush'};
  if(is('reeds','cattail'))return {f:null,s:'reed'};
  if(is('grass1','grass2','flowers'))return {f:null,s:'grass'};
  if(is('house1','house2','house3','inn','chapel'))return {f:'house'};
  if(is('dwall'))return {f:'wall',d:9};
  if(is('cliff'))return {f:'wall',d:22};
  if(is('fence'))return {f:'wall',d:3};
  if(is('tgate'))return {f:'gate'};
  if(is('sign','lantern','mile'))return {f:'post'};
  if(is('scare'))return {f:'post',s:'scare'};
  if(is('dbones','mush'))return {f:null};
  if(is('dpillar'))return {f:'blob',k:.7};
  return {f:'blob'};}
/* 絵の根元の輪郭（不透明な画素の幅）を測る。幹の太さは下の1割、根元の広がりは下の2割5分 */
const _spanCache=new WeakMap();
function fBaseSpan(img){let r=_spanCache.get(img);if(r)return r;const w=img.width,h=img.height;let d;try{d=img.getContext?img.getContext('2d').getImageData(0,0,w,h).data:null;}catch(e){d=null;}
  const rowSpan=y=>{let a=-1,b=-1;for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>40){if(a<0)a=x;b=x;}return a<0?null:[a,b];};
  if(!d){r={trunk:[w*.42,w*.58],base:[w*.15,w*.85]};_spanCache.set(img,r);return r;}
  let tA=0,tB=0,tn=0,bA=w,bB=0;for(let y=h-1;y>=Math.floor(h*.75);y--){const s=rowSpan(y);if(!s)continue;if(y>=h*.9){tA+=s[0];tB+=s[1];tn++;}bA=Math.min(bA,s[0]);bB=Math.max(bB,s[1]);}
  r={trunk:tn?[tA/tn,tB/tn]:[w*.42,w*.58],base:bB>bA?[bA,bB]:[w*.15,w*.85]};_spanCache.set(img,r);return r;}
/* 足もとの形（世界の座標）。e：楕円 {x,y,rx,ry}、r：箱 {x0,x1,y0,y1} */
function fFootShapes(K,im,px,py){const w=im.width,h=im.height,S=fBaseSpan(im),L=px-w/2,out=[];
  if(!K.f)return out;
  if(K.f==='trunk'){const a=S.trunk[0],b=S.trunk[1];const rx=Math.max(2.5,Math.min(9,(b-a)/2+1));out.push({t:'e',x:L+(a+b)/2,y:py-1.5,rx,ry:Math.max(2,rx*.6)});}
  else if(K.f==='post')out.push({t:'e',x:px,y:py-1.5,rx:3,ry:2});
  else if(K.f==='blob'){const a=S.base[0],b=S.base[1];const rx=Math.max(3,(b-a)/2*(K.k||.88));const ry=Math.max(2.5,Math.min(rx*.55,h*.28));out.push({t:'e',x:L+(a+b)/2,y:py-ry*.7,rx,ry});}
  else if(K.f==='house'){const a=S.base[0],b=S.base[1];const dep=Math.min(38,h*.4);out.push({t:'r',x0:L+a+2,x1:L+b-2,y0:py-dep,y1:py});}
  else if(K.f==='wall'){const a=S.base[0],b=S.base[1];out.push({t:'r',x0:L+a,x1:L+b,y0:py-(K.d||8),y1:py});}
  else if(K.f==='gate'){const a=S.base[0],b=S.base[1];const pw=Math.max(5,(b-a)*.12);out.push({t:'r',x0:L+a,x1:L+a+pw,y0:py-6,y1:py},{t:'r',x0:L+b-pw,x1:L+b,y0:py-6,y1:py});}
  return out;}
/* 通れる升目を作る（地図を作るとき一度）。形は体の半径だけ太らせて塗る */
function navBuild(W,H,shapes){const cw=Math.ceil(W/NAV_CS),ch=Math.ceil(H/NAV_CS);const blk=new Uint8Array(cw*ch);
  for(const s of shapes){const x0=s.t==='e'?s.x-s.rx:s.x0,x1=s.t==='e'?s.x+s.rx:s.x1,y0=s.t==='e'?s.y-s.ry:s.y0,y1=s.t==='e'?s.y+s.ry:s.y1;
    const cx0=Math.max(0,Math.floor((x0-BODY_R)/NAV_CS)),cx1=Math.min(cw-1,Math.floor((x1+BODY_R)/NAV_CS)),cy0=Math.max(0,Math.floor((y0-BODY_R)/NAV_CS)),cy1=Math.min(ch-1,Math.floor((y1+BODY_R)/NAV_CS));
    for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){const px=(cx+.5)*NAV_CS,py=(cy+.5)*NAV_CS;if(navInside(s,px,py,BODY_R))blk[cy*cw+cx]=1;}}
  // 形を探しやすいように、横64画素ごとの箱に分ける
  const bucket=new Map();for(const s of shapes){const x0=s.t==='e'?s.x-s.rx:s.x0,x1=s.t==='e'?s.x+s.rx:s.x1;for(let k=Math.floor(x0/64);k<=Math.floor(x1/64);k++){if(!bucket.has(k))bucket.set(k,[]);bucket.get(k).push(s);}}
  return {cw,ch,blk,shapes,bucket};}
function navInside(s,x,y,r){if(s.t==='e'){const nx=(x-s.x)/(s.rx+r),ny=(y-s.y)/(s.ry+r);return nx*nx+ny*ny<1;}return x>s.x0-r&&x<s.x1+r&&y>s.y0-r&&y<s.y1+r;}
const navBlocked=(N,x,y)=>{const cx=Math.floor(x/NAV_CS),cy=Math.floor(y/NAV_CS);if(cx<0||cy<0||cx>=N.cw||cy>=N.ch)return false;return N.blk[cy*N.cw+cx]===1;};
/* 世界の点 (x,y) を、半径 r の体が形の外に出るよう押し出す量 */
function navPush(N,x,y,r){let dx=0,dy=0;for(let it=0;it<3;it++){let moved=false;const list=N.bucket.get(Math.floor((x+dx)/64))||[];
    for(const s of list){const X=x+dx,Y=y+dy;if(!navInside(s,X,Y,r))continue;moved=true;
      if(s.t==='e'){const ax=s.rx+r,ay=s.ry+r;let nx=(X-s.x)/ax,ny=(Y-s.y)/ay;let d=Math.hypot(nx,ny);if(d<1e-3){nx=0;ny=1;d=1;}dx+=s.x+nx/d*ax*1.001-X;dy+=s.y+ny/d*ay*1.001-Y;}
      else{const l=X-(s.x0-r),rr=(s.x1+r)-X,t=Y-(s.y0-r),b=(s.y1+r)-Y;const m=Math.min(l,rr,t,b);if(m===l)dx-=l+.01;else if(m===rr)dx+=rr+.01;else if(m===t)dy-=t+.01;else dy+=b+.01;}}
    if(!moved)break;}
  return [dx,dy];}
/* 帯の座標と世界の座標のあいだの、その場の回転（道の向き） */
function navRot(sx){const m=fLay().wm;const i=Math.max(0,Math.min(m.N-1,Math.round(sx)));return [m.cs[i],m.sn[i]];}
/* 帯の座標で持つもの（o.x,o.y または [x,y]）を押し出す */
function pushOut(o,pad){const N=B&&B.nav;if(!N||!fLay()||!fLay().wm)return;const arr=o.x==null;if(arr&&o[0]==null)return;let x=arr?o[0]:o.x,y=arr?o[1]:o.y;
  const [wx,wy]=fWorld(x,y);const [dx,dy]=navPush(N,wx,wy,pad??BODY_R);if(!dx&&!dy)return;const [c,s]=navRot(x);x+=c*dx+s*dy;y+=-s*dx+c*dy;if(arr){o[0]=x;o[1]=y;}else{o.x=x;o.y=y;}}
/* まっすぐ行けるか（升目を2画素ずつ確かめる。出発点のすぐそばは見ない） */
function navLOS(N,ax,ay,bx,by){const L=Math.hypot(bx-ax,by-ay);const n=Math.ceil(L/2);for(let i=2;i<=n;i++){const t=i/n;if(navBlocked(N,ax+(bx-ax)*t,ay+(by-ay)*t))return false;}return true;}
/* 回り道（A*）。出発点と行き先のまわり（+120画素）だけを探す。行き先が塞がっていれば、近くの通れる升目へ */
function navAstar(N,ax,ay,bx,by){const cw=N.cw,ch=N.ch;let sx=Math.floor(ax/NAV_CS),sy=Math.floor(ay/NAV_CS),gx=Math.floor(bx/NAV_CS),gy=Math.floor(by/NAV_CS);
  const free=(x,y)=>x>=0&&y>=0&&x<cw&&y<ch&&!N.blk[y*cw+x];
  if(!free(gx,gy)){let best=null;for(let r=1;r<=8&&!best;r++)for(let dy=-r;dy<=r&&!best;dy++)for(let dx=-r;dx<=r;dx++)if(free(gx+dx,gy+dy)){best=[gx+dx,gy+dy];break;}if(!best)return null;[gx,gy]=best;}
  const pad=30;const X0=Math.max(0,Math.min(sx,gx)-pad),X1=Math.min(cw-1,Math.max(sx,gx)+pad),Y0=Math.max(0,Math.min(sy,gy)-pad),Y1=Math.min(ch-1,Math.max(sy,gy)+pad);
  const bw=X1-X0+1,bh=Y1-Y0+1,n=bw*bh;if(n>60000)return null;const g=new Float32Array(n).fill(1e9),par=new Int32Array(n).fill(-1),closed=new Uint8Array(n);
  const id=(x,y)=>(y-Y0)*bw+(x-X0);const H=(x,y)=>{const dx=Math.abs(x-gx),dy=Math.abs(y-gy);return Math.max(dx,dy)+.414*Math.min(dx,dy);};
  const heap=[];const push=(f,i)=>{heap.push([f,i]);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(heap[p][0]<=heap[k][0])break;[heap[p],heap[k]]=[heap[k],heap[p]];k=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m;}}return top;};
  if(sx<X0||sx>X1||sy<Y0||sy>Y1)return null;const s0=id(sx,sy);g[s0]=0;push(H(sx,sy),s0);const goal=id(gx,gy);let steps=0;
  const D=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
  while(heap.length&&steps++<20000){const [,cur]=pop();if(closed[cur])continue;closed[cur]=1;if(cur===goal)break;const cx=cur%bw+X0,cy=Math.floor(cur/bw)+Y0;
    for(const [dx,dy,c] of D){const nx=cx+dx,ny=cy+dy;if(nx<X0||nx>X1||ny<Y0||ny>Y1)continue;if(!free(nx,ny)&&!(nx===sx&&ny===sy))continue;if(dx&&dy&&(!free(cx+dx,cy)||!free(cx,cy+dy)))continue;
      const ni=id(nx,ny);const ng=g[cur]+c;if(ng<g[ni]){g[ni]=ng;par[ni]=cur;push(ng+H(nx,ny),ni);}}}
  if(par[goal]<0&&goal!==s0)return null;const path=[];for(let k=goal;k>=0&&k!==s0;k=par[k])path.push([((k%bw)+X0+.5)*NAV_CS,(Math.floor(k/bw)+Y0+.5)*NAV_CS]);path.reverse();
  // 見通せる所は飛ばして、まっすぐな線につなぐ
  const out=[];let a=[ax,ay];for(let i=0;i<path.length;){let j=path.length-1;while(j>i&&!navLOS(N,a[0],a[1],path[j][0],path[j][1]))j--;out.push(path[j]);a=path[j];i=j+1;}
  return out;}
/* 戦いの中の歩き：行き先が見通せなければ回り道の次の曲がり角を返す（帯の座標）。0.7秒か行き先が動いたら探し直す */
function navWay(o,gx,gy){const N=B&&B.nav;if(!N||!fLay()||!fLay().wm||o.x==null)return null;const [ux,uy]=fWorld(o.x,o.y),[tx,ty]=fWorld(gx,gy);
  if(navLOS(N,ux,uy,tx,ty)){o._np=null;return null;}
  let P=o._np;if(!P||Math.hypot(P.tx-tx,P.ty-ty)>10||B.t>P.t+.7){o._np=P={tx,ty,t:B.t,path:navAstar(N,ux,uy,tx,ty)||[],i:0};}
  while(P.i<P.path.length-1&&(Math.hypot(P.path[P.i][0]-ux,P.path[P.i][1]-uy)<3||navLOS(N,ux,uy,P.path[P.i+1][0],P.path[P.i+1][1])))P.i++;
  const w=P.path[P.i];if(!w)return null;const [c,s]=navRot(o.x);const dx=w[0]-ux,dy=w[1]-uy;return [o.x+c*dx+s*dy,o.y-s*dx+c*dy];}
/* 旅の道筋：点と点のあいだが塞がっていれば回り道を挟む（帯の座標の点の並び） */
function navRouteFix(pts){const N=B&&B.nav;if(!N||!fLay()||!fLay().wm)return pts;const out=[pts[0]];
  for(let i=1;i<pts.length;i++){const a=out[out.length-1],b=pts[i];const [ax,ay]=fWorld(a[0],a[1]),[bx,by]=fWorld(b[0],b[1]);
    if(!navLOS(N,ax,ay,bx,by)){const p=navAstar(N,ax,ay,bx,by);if(p&&p.length>1){let cur=[a[0],a[1]],cw=[ax,ay];for(const w of p.slice(0,-1)){const [c,s]=navRot(cur[0]);const dx=w[0]-cw[0],dy=w[1]-cw[1];cur=[cur[0]+c*dx+s*dy,cur[1]-s*dx+c*dy];cw=w;out.push(cur);}}}
    out.push(b);}
  return out;}
/* 体どうしを離す（帯の座標。人は半径6、大物は12。狙っている相手には手が届く距離を残す） */
function navSeparate(list){for(let it=0;it<2;it++)for(let i=0;i<list.length;i++){const a=list[i];if(a.x==null)continue;for(let j=i+1;j<list.length;j++){const b=list[j];if(b.x==null)continue;
    const ra=BIG_E.includes(a.kind)?12:6,rb=BIG_E.includes(b.kind)?12:6;const dx=b.x-a.x,dy=b.y-a.y;const d=Math.hypot(dx,dy);const m=ra+rb;if(d>=m)continue;
    const ux=d>1e-3?dx/d:(Math.random()-.5),uy=d>1e-3?dy/d:(Math.random()-.5);const push=(m-d)/2;const wa=BIG_E.includes(a.kind)?.25:1,wb=BIG_E.includes(b.kind)?.25:1;const k=push*2/(wa+wb);
    a.x-=ux*k*wa;a.y-=uy*k*wa;b.x+=ux*k*wb;b.y+=uy*k*wb;}}}
/* 風：天気で強さが変わり、ときどき突風。草と葦は、そばを歩く者から押しのけられる */
function fWind(){const sk=B&&B.plan&&B.plan[B.si];if(sk&&(sk.t==='dun'||sk.t==='dunrest'))return 0;const w=B&&B.weather;return w==='wind'?2.4:w==='rain'?1.5:w==='snow'?.8:w==='fog'?.5:1;}
function fSway(o,now,wind,bodies){const a=SWAY_AMP[o.s];if(!a||!wind&&o.s!=='grass'&&o.s!=='reed')return 0;
  const ph=o.ph||0;const gust=.65+.35*Math.sin(now/2300+o.x*.004)+.25*Math.sin(now/870+ph);
  let sh=a*wind*(.45*gust+.55*Math.sin(now/(560+(ph%7)*45)+ph))*(.8+.2*Math.sin(now/3100));
  if((o.s==='grass'||o.s==='reed'||o.s==='bush')&&bodies)for(const b of bodies){const dx=o.x-b[0],dy=o.y-b[1];const d=Math.hypot(dx,dy*1.6);if(d<12)sh+=(dx>=0?-1:1)*(o.s==='bush'?.12:.35)*(1-d/12);}
  return Math.max(-.45,Math.min(.45,sh));}
/* 揺れを付けて描く（足もとを支点に、上ほど横へずらす） */
function fDrawSway(g,img,fx,fy,sh,al){if(al!=null&&al<1)g.globalAlpha=al;if(Math.abs(sh)<.002){g.drawImage(img,Math.round(fx-img.width/2),Math.round(fy-img.height));}
  else{g.save();g.translate(Math.round(fx),Math.round(fy));g.transform(1,0,-sh,1,0,0);g.drawImage(img,-Math.round(img.width/2),-img.height);g.restore();}if(al!=null&&al<1)g.globalAlpha=1;}
