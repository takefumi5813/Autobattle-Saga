/* ============ 町の並び（2026-11-26 作り直し） ============
   オーナー「町はそれぞれ個性があるように生き生きと。全部の町をもっと大きく、構成も単調でなくすべて違うように。整然と並んでいるのも変。
   木や建物の使い回しは禁止。バリエーションは10倍」
   - 絵：大陸ごとに建物12と自然・小物15と地面2（data/town_img.js の TOWN_IMG。名前は c0b0〜c0b11・c0n0〜c0n16）。
     同じ絵が一つの町に何度も出るときは、左右を返し、屋根や壁の色を少しずつ変える（twVariant）
   - 並び：町ごとに決まった乱数で「型」を選ぶ（曲がりくねった一本道・十字路・環状・段々・港・散村…）。通りは折れ線を少しずつ曲げて伸ばし、
     枝道・小道・広場を生やす。建物は通りの上側に、間隔も向きもばらばらに建て、戸口から通りへ小道をつなぐ。
     空いた所は、場所ごとの濃淡（ノイズ）で木立・茂み・花・岩を置く。町の外まわりは森や岩で囲む
   - 大きさ：村 760×600・町 1000×800・都 1300×1000 */
const TOWN_BI={cottage:0,house:1,stone:2,inn:3,tavern:4,smith:5,store:6,shack:7,chapel:8,guild:9,tower:10,big:11};
const TOWN_NI={tree:[0,1,2,3,4],small:[5,6,7,8,9],fence:10,well:11,stall:12,lamp:13,prop:14,ground:15,road:16};
const FAC_BLD={inn:'inn',tavern:'tavern',smith:'smith',tool:'store',shrine:'chapel',guild:'guild',weapon:'stone',armor:'house',jewel:'cottage',grimoire:'tower',maps:'shack',dojo:'big',home:'cottage'};
const TOWN_TYPES=['winding','crossroads','ring','terrace','scatter','fork','market'];
let TW_TOWNIMG=null;
async function twLoadTown(){if(TW_TOWNIMG||typeof TOWN_IMG==='undefined')return;const o={};for(const [k,v] of Object.entries(TOWN_IMG))o[k]=await fImg(v);TW_TOWNIMG=o;}
const twHas=c=>!!(TW_TOWNIMG&&TW_TOWNIMG[c+'b0']);
/* 一つの町で同じ絵が重なったら、左右を返し、色を少しずらした別の絵にする */
const TW_VAR={};
function twVariant(name,v){if(!v)return name;const key=name+'~'+v;if(TW_VAR[key])return key;const src=twArt(name);if(!src)return name;
  const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const g=c.getContext('2d');
  if(v%2){g.translate(c.width,0);g.scale(-1,1);}g.drawImage(src,0,0);g.setTransform(1,0,0,1,0,0);
  const d=g.getImageData(0,0,c.width,c.height),p=d.data;const sh=[[1,1,1],[1.12,.98,.86],[.86,.96,1.1],[1.05,1.08,.9],[.92,.88,.98],[1.1,1.02,1.02]][v%6];
  for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;const y=i/4/c.width;if(y>c.height*.55)continue;   // 上半分（屋根・壁の上）だけ色を変える
    p[i]=Math.min(255,p[i]*sh[0]);p[i+1]=Math.min(255,p[i+1]*sh[1]);p[i+2]=Math.min(255,p[i+2]*sh[2]);}
  g.putImageData(d,0,0);TW_VAR[key]=c;return key;}
/* 折れ線の道を伸ばす：始点から行き先へ、少しずつ向きを揺らしながら */
function twWalkRoad(r,x,y,tx,ty,step,wob,W,H){const pts=[{x,y}];let a=Math.atan2(ty-y,tx-x);for(let i=0;i<60;i++){const want=Math.atan2(ty-y,tx-x);let d=want-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;
  a+=d*.35+(r()-.5)*wob;x+=Math.cos(a)*step;y+=Math.sin(a)*step;x=Math.max(30,Math.min(W-30,x));y=Math.max(40,Math.min(H-10,y));pts.push({x,y});if(Math.hypot(tx-x,ty-y)<step)break;}pts.push({x:tx,y:ty});return pts;}
function twLayout(k){
  const r=seeded(S.wseed+':town2:'+k);const sz=townSize(k);const cont=(TOWNS[k]||{}).cont||'c0';
  const W=sz==='large'?1300:sz==='mid'?1000:760,H=sz==='large'?1000:sz==='mid'?800:600;
  const ok=twHas(cont);const C=ok?cont:null;
  let type=TOWN_TYPES[Math.floor(r()*TOWN_TYPES.length)];if(TOWNS[k]&&TOWNS[k].port&&r()<.6)type='harbor';if(cont==='c4'&&r()<.4)type='scatter';if(cont==='c1'&&r()<.3)type='terrace';
  const roads=[];const plazas=[];
  const ex={x:W*(.3+r()*.4),y:H-4};   // 町の出口（下の端）
  const cx=W*(.35+r()*.3),cy=H*(.35+r()*.25);
  const R=(pts,w)=>roads.push({pts,w});
  R(twWalkRoad(r,ex.x,ex.y,cx,cy,34,type==='winding'?.55:.28,W,H),34);   // 2026-11-26 オーナー「道がグネグネ」→ 揺れを半分に
  plazas.push({x:cx,y:cy,rx:50+r()*50,ry:34+r()*30});
  const nB=type==='scatter'?7:type==='market'?3:4+Math.floor(r()*3);
  if(type==='crossroads'){R(twWalkRoad(r,20,cy+(r()-.5)*80,W-20,cy+(r()-.5)*80,40,.5,W,H),30);}
  if(type==='ring'){const pts=[];const rr=Math.min(W,H)*.28;for(let i=0;i<=24;i++){const a=i/24*Math.PI*2;pts.push({x:cx+Math.cos(a)*rr*(1+(r()-.5)*.15),y:cy+Math.sin(a)*rr*.75*(1+(r()-.5)*.15)});}R(pts,26);}
  if(type==='terrace'){for(let i=0;i<3;i++){const y=H*(.22+i*.22)+(r()-.5)*30;R(twWalkRoad(r,40,y,W-40,y+(r()-.5)*60,40,.35,W,H),24);}}
  if(type==='market'){plazas.push({x:cx+(r()-.5)*W*.3,y:cy+H*.2,rx:70,ry:44});plazas[0].rx+=30;}
  let water=null;if(type==='harbor'){water={y:96+r()*40};plazas.push({x:W*.5,y:water.y+22,rx:W*.44,ry:18,quay:1});R(twWalkRoad(r,cx,cy,W*(.3+r()*.4),water.y+26,34,.5,W,H),28);}
  // 枝道：通りの途中から、ばらばらの向きへ
  /* 枝道は元の通りからおおよそ直角に出す。ほかの通りに沿って並走したり、すぐそばを走る枝道は作らない
     （2026-11-26、オーナー「この道は不自然。広場にするなら広場に。道がグネグネしている」。何本もの道が絡み合って見えていた） */
  const nearRoad=(x,y,skip)=>{for(const rd of roads){if(rd===skip)continue;for(let i=1;i<rd.pts.length;i++){const a=rd.pts[i-1],b=rd.pts[i];const dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy||1;const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/L2));if(Math.hypot(a.x+dx*t-x,a.y+dy*t-y)<rd.w/2+46)return true;}}return false;};
  for(let i=0,tries=0;i<nB&&tries<nB*6;tries++){const base=roads[Math.floor(r()*roads.length)];const j=1+Math.floor(r()*Math.max(1,base.pts.length-2));const p=base.pts[j]||base.pts[0];const q=base.pts[Math.min(base.pts.length-1,j+1)];
    const ba=Math.atan2(q.y-p.y,q.x-p.x);const a=ba+(r()<.5?1:-1)*(Math.PI/2+(r()-.5)*.6);const len=120+r()*(W*.3);const tx=Math.max(40,Math.min(W-40,p.x+Math.cos(a)*len)),ty=Math.max(60,Math.min(H-40,p.y+Math.sin(a)*len*.8));
    const pts=twWalkRoad(r,p.x,p.y,tx,ty,30,.3,W,H);let bad=0;for(const pt of pts.slice(2))if(nearRoad(pt.x,pt.y,null))bad++;if(bad>1)continue;
    i++;R(pts,18+Math.floor(r()*8));if(r()<.3)plazas.push({x:tx,y:ty,rx:30+r()*22,ry:22+r()*12});}
  // 通りの升目（置けるかどうかの判定用）
  const cs=8,gw=Math.ceil(W/cs),gh=Math.ceil(H/cs);const road=new Uint8Array(gw*gh);
  const markSeg=(a,b,w)=>{const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4);for(let i=0;i<=n;i++){const x=a.x+(b.x-a.x)*i/n,y=a.y+(b.y-a.y)*i/n;const rr=w/2;for(let yy=Math.floor((y-rr)/cs);yy<=Math.ceil((y+rr)/cs);yy++)for(let xx=Math.floor((x-rr)/cs);xx<=Math.ceil((x+rr)/cs);xx++){if(xx<0||yy<0||xx>=gw||yy>=gh)continue;if(Math.hypot(xx*cs+4-x,yy*cs+4-y)<=rr)road[yy*gw+xx]=1;}}};
  for(const rd of roads)for(let i=1;i<rd.pts.length;i++)markSeg(rd.pts[i-1],rd.pts[i],rd.w);
  for(const p of plazas)for(let yy=0;yy<gh;yy++)for(let xx=0;xx<gw;xx++){const dx=(xx*cs+4-p.x)/p.rx,dy=(yy*cs+4-p.y)/p.ry;if(dx*dx+dy*dy<=1)road[yy*gw+xx]=1;}
  const onRoad=(x,y)=>{const xx=Math.floor(x/cs),yy=Math.floor(y/cs);return xx>=0&&yy>=0&&xx<gw&&yy<gh&&road[yy*gw+xx]===1;};
  const rectFree=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y+=6)for(let x=x0;x<=x1;x+=6)if(onRoad(x,y))return false;return x0>16&&x1<W-16&&y0>(water?water.y+40:30)&&y1<H-20;};
  // 建物：通りに沿って、上側（戸口が通りを向く）に、間隔ばらばらに
  const sprite=n=>C?C+'b'+TOWN_BI[n]:({inn:'inn',chapel:'chapel'}[n]||['house1','house2','house3'][TOWN_BI[n]%3]);
  const blds=[];const used={};const want=townFacilities(k).concat((S.homes||{})[k]?['home']:[]);
  const near=p=>Math.hypot(p.x-cx,p.y-cy);
  // 建てられそうな所：通りに沿って一定でない間隔で、通りの両側（上・下・左右）に。さらに通りから離れた所にも少し（離れ家）
  const cand=[];for(const rd of roads){let acc=0,nextAt=20+r()*40;for(let i=1;i<rd.pts.length;i++){const a=rd.pts[i-1],b=rd.pts[i];const L=Math.hypot(b.x-a.x,b.y-a.y);acc+=L;
    if(acc<nextAt)continue;acc=0;nextAt=40+r()*60;const ang=Math.atan2(b.y-a.y,b.x-a.x);const nx=-Math.sin(ang),ny=Math.cos(ang);
    for(const sg of [1,-1]){const qx=b.x+nx*sg*(rd.w/2+6),qy=b.y+ny*sg*(rd.w/2+6);const up=ny*sg<-.45,down=ny*sg>.45;cand.push({x:qx+(r()-.5)*16,y:qy,mode:up?'up':down?'down':(nx*sg<0?'left':'right')});}}}
  for(const p of plazas)for(let a=0;a<8;a++){const t=Math.PI*2*a/8+r()*.4;cand.push({x:p.x+Math.cos(t)*(p.rx+8),y:p.y+Math.sin(t)*(p.ry+6),mode:Math.sin(t)<-.3?'up':Math.sin(t)>.3?'down':Math.cos(t)<0?'left':'right'});}
  for(let i=0;i<(sz==='small'?10:20);i++)cand.push({x:60+r()*(W-120),y:90+r()*(H-160),mode:'up',far:1});
  cand.sort((a,b)=>near(a)-near(b)+(r()-.5)*(sz==='small'?140:260)+(a.far?400:0)-(b.far?400:0));
  const names=Object.keys(TOWN_BI);
  /* 建物どうし：間をあける。さらに戸口の前（左右20・手前36）には別の建物を建てない（2026-11-26、戸口のすぐ前に別の家の裏手が来て入れなかった） */
  const occ=(x0,y0,x1,y1,dx)=>{for(const o of blds){if(x0<o.x1+10&&x1>o.x0-10&&y0<o.y1+12&&y1>o.y0-6)return true;
    if(x0<o.x+20&&x1>o.x-20&&y0<o.y1+36&&y1>o.y1-4)return true;
    if(dx!=null&&o.x0<dx+20&&o.x1>dx-20&&o.y0<y1+36&&o.y1>y1-4)return true;}return false;};
  const tryPlace=(c,bn,f)=>{const key=sprite(bn);const im=twArt(key);if(!im)return null;const w=im.width,h=im.height,d=h*.55;
    let x=Math.round(c.x),by=Math.round(c.y);
    if(c.mode==='down')by=Math.round(c.y+d+4);else if(c.mode==='left'){x=Math.round(c.x-w/2-4);by=Math.round(c.y+d*.4);}else if(c.mode==='right'){x=Math.round(c.x+w/2+4);by=Math.round(c.y+d*.4);}
    const x0=x-w/2-4,x1=x+w/2+4,y0=by-d,y1=by+4;
    if(water&&by-h<water.y+10)return null;   // 海の上には建てない（屋根まで陸に収める）
    if(!rectFree(x0,y0,x1,y1)||occ(x0,y0,x1,y1,x))return null;
    used[key]=(used[key]||0)+1;const art=twVariant(key,used[key]-1);const b={f,art,x,by,x0,x1,y0,y1,mode:c.mode};blds.push(b);return b;};
  for(const f of want){const bn=FAC_BLD[f]||'house';let ok=false;for(const c of cand){if(c.used||c.far)continue;if(tryPlace(c,bn,f)){c.used=1;ok=true;break;}}
    // 置けなければ：ほかの形の建物で、それでもだめなら通りのそばを探し回る（施設は必ず建てる）
    if(!ok)for(const alt of names){for(const c of cand){if(c.used)continue;if(tryPlace(c,alt,f)){c.used=1;ok=true;break;}}if(ok)break;}
    if(!ok)for(let i=0;i<400&&!ok;i++){const rd=roads[Math.floor(r()*roads.length)];const p=rd.pts[Math.floor(r()*rd.pts.length)];const a=r()*Math.PI*2;
      ok=!!tryPlace({x:p.x+Math.cos(a)*(rd.w/2+20+r()*60),y:p.y+Math.sin(a)*(rd.w/2+20+r()*40),mode:'up'},names[Math.floor(r()*names.length)],f);}}
  const fill=sz==='large'?40:sz==='mid'?28:17;
  /* 施設でない建物（民家）は、住まいに見える絵だけ（2026-11-26、オーナー「民家やないやろ」。祠や物見やぐらが民家として建っていた） */
  const HOMELY=['cottage','house','stone','shack'];
  for(const c of cand){if(blds.length>=fill+want.length)break;if(c.used)continue;const order=HOMELY.slice().sort(()=>r()-.5);
    for(const bn of order){if(tryPlace(c,bn,null)){c.used=1;break;}}}
  // 戸口から通りへの小道：建物を避けて、いちばん近い通りまで升目でたどる
  const occG=new Uint8Array(gw*gh);for(const b of blds)for(let y=Math.floor(b.y0/cs);y<=Math.floor((b.by-3)/cs);y++)for(let x=Math.floor((b.x0+4)/cs);x<=Math.floor((b.x1-4)/cs);x++)if(x>=0&&y>=0&&x<gw&&y<gh)occG[y*gw+x]=1;
  const paths=[];for(const b of blds){const sx=Math.floor(b.x/cs),sy=Math.floor((b.by+6)/cs);if(sx<0||sy<0||sx>=gw||sy>=gh)continue;
    const prev=new Int32Array(gw*gh).fill(-2);const q=[sy*gw+sx];prev[q[0]]=-1;let hit=-1;
    for(let qi=0;qi<q.length&&qi<4000;qi++){const c=q[qi];if(road[c]===1&&qi>0){hit=c;break;}const cx2=c%gw,cy2=(c/gw)|0;
      for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]]){const x=cx2+dx,y=cy2+dy;if(x<0||y<0||x>=gw||y>=gh)continue;const n=y*gw+x;if(prev[n]!==-2||occG[n])continue;prev[n]=c;q.push(n);}}
    if(hit<0)continue;const pts=[];for(let c=hit;c>=0;c=prev[c])pts.unshift({x:(c%gw)*cs+cs/2,y:((c/gw)|0)*cs+cs/2});pts[0]={x:b.x,y:b.by-2};if(pts.length>1)paths.push(pts);}
  for(const pp of paths)for(let i=1;i<pp.length;i++)markSeg(pp[i-1],pp[i],12);
  /* 戸口と小道のまわりは空けておく（2026-11-26、オーナー「行けない家、おかしい」。小道のすぐ脇の松や茂みが道をふさいでいた）：
     小道の両脇（幅34）と、戸口の前（左右18・手前28）には、木・茂み・柵・小物を置かない。物の幅ぶんを見て確かめる */
  const keep=new Uint8Array(gw*gh);const kSet=(x,y)=>{const xx=Math.floor(x/cs),yy=Math.floor(y/cs);if(xx>=0&&yy>=0&&xx<gw&&yy<gh)keep[yy*gw+xx]=1;};
  for(const pp of paths)for(let i=1;i<pp.length;i++){const a=pp[i-1],b=pp[i];const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4);for(let j=0;j<=n;j++){const x=a.x+(b.x-a.x)*j/n,y=a.y+(b.y-a.y)*j/n;for(let dy=-17;dy<=17;dy+=4)for(let dx=-17;dx<=17;dx+=4)kSet(x+dx,y+dy);}}
  for(const b of blds)for(let y=b.by-2;y<=b.by+28;y+=4)for(let x=b.x-18;x<=b.x+18;x+=4)kSet(x,y);
  /* 通りの縁にも木や茂みを置かない（2026-11-26、オーナー「移動で詰まることが多い。物が多すぎてふさいでいる」）。通りの両側12画素まで。
     井戸・露店・灯りだけは置いてよい（roadOK） */
  const keepR=new Uint8Array(gw*gh);for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)if(road[y*gw+x]===1)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<gw&&Y<gh)keepR[Y*gw+X]=1;}
  let roadOK=false;
  const kept=(x,y)=>{const xx0=Math.floor(x/cs),yy0=Math.floor(y/cs);if(!roadOK&&xx0>=0&&yy0>=0&&xx0<gw&&yy0<gh&&keepR[yy0*gw+xx0])return true;const xx=Math.floor(x/cs),yy=Math.floor(y/cs);return xx>=0&&yy>=0&&xx<gw&&yy<gh&&keep[yy*gw+xx]===1;};
  // 自然と小物
  const hasN=C&&twArt(C+'n0');const props=[];const N=n=>hasN?C+'n'+n:null;const P=(art,x,by,solid=true)=>{if(!art||!twArt(art))return;{const hw=Math.min(30,twArt(art).width*.4);for(const ox of [-hw,0,hw])for(const oy of [0,-5])if(kept(x+ox,by+oy))return;}props.push({art,x:Math.round(x),by:Math.round(by),solid});};
  const blocked=(x,y,m)=>(water&&y<water.y+34)||onRoad(x,y)||onRoad(x,y-6)||blds.some(b=>x>b.x0-m&&x<b.x1+m&&y>b.y0-m&&y<b.y1+m+14)||props.some(p=>Math.hypot(p.x-x,(p.by-y)*1.4)<m+8);
  const hx=(x,y)=>{let v=Math.sin(x*12.99+y*78.23+k.length*7.7)*43758.5;return v-Math.floor(v);};
  const nz=(x,y)=>{const X=Math.floor(x),Y=Math.floor(y),fx=x-X,fy=y-Y;const a=hx(X,Y),b=hx(X+1,Y),c=hx(X,Y+1),d=hx(X+1,Y+1);const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};
  const treeArt=()=>hasN?N(TOWN_NI.tree[Math.floor(r()*5)]):['tree1','tree2','tree3','pine1','pine2'][Math.floor(r()*5)];
  const smallArt=()=>hasN?N(TOWN_NI.small[Math.floor(r()*5)]):['bush1','bush2','bush3','rock1','flowers'][Math.floor(r()*5)];
  // 町の外まわり：森（上と左右の縁）
  if(!water)for(let x=8;x<W;x+=22+r()*20){P(treeArt(),x,22+r()*26);if(r()<.6)P(treeArt(),x+r()*10,52+r()*20);}
  for(let y=water?water.y+60:70;y<H-20;y+=24+r()*22){P(treeArt(),10+r()*14,y);P(treeArt(),W-10-r()*14,y);}
  // 中：濃淡で木立と茂み
  for(let i=0;i<(W*H)/1900;i++){const x=30+r()*(W-60),y=60+r()*(H-90);const n=nz(x/90,y/90);if(n<.5)continue;if(blocked(x,y,10))continue;
    if(n>.72&&r()<.7)P(treeArt(),x,y);else if(r()<.42)P(smallArt(),x,y,r()<.5);}   // 2026-11-26 オーナー「町の物が若干にぎやかすぎる」→ 3割ほど減らした
  // 広場：井戸・露店・灯り
  roadOK=true;
  for(const p of plazas){if(p.quay)continue;if(!blocked(p.x+p.rx*.3,p.y,0))P(hasN?N(TOWN_NI.well):'well',p.x+p.rx*.3,p.y+4);
    for(let i=0;i<2+Math.floor(r()*3);i++){const a=r()*Math.PI*2;P(hasN?N(TOWN_NI.stall):'stall',p.x+Math.cos(a)*p.rx*.75,p.y+Math.sin(a)*p.ry*.7);}}
  // 灯り：大通り沿いに、ばらばらに
  /* 灯りの足もとの幅ぶん（左右11画素）が通りや小道にかからない所だけ（2026-11-26、オーナー「灯籠と道の端のあいだで通れない」。
     曲がった通りや分かれ道では、真ん中の一点だけ確かめていたので、灯籠が道の上にはみ出して細い隙間を作っていた） */
  {const rd=roads[0];for(let i=2;i<rd.pts.length;i+=2+Math.floor(r()*2)){const p=rd.pts[i];const s=r()<.5?-1:1;const x=p.x+s*(rd.w/2+8),y=p.y;if(!blocked(x,y,2)&&![-11,11].some(o=>onRoad(x+o,y)||onRoad(x+o,y-6)||onRoad(x+o,y+4)))P(hasN?N(TOWN_NI.lamp):'lantern',x,y);}}
  roadOK=false;
  // 家のまわり：柵・その地方の物・茂み
  for(const b of blds){if(b.f)continue;const rr=r();if(rr<.35){const x=b.x1+14,y=b.by-4;if(!blocked(x,y,2))P(hasN?N(TOWN_NI.fence):'fence',x,y);}
    else if(rr<.6){const x=b.x0-14,y=b.by;if(!blocked(x,y,2))P(hasN?N(TOWN_NI.prop):'cart',x,y);}
    else if(rr<.8){const x=b.x1+10,y=b.by+2;if(!blocked(x,y,2))P(smallArt(),x,y,false);}}
  const exit={x:roads[0].pts[0].x,y:H-6};
  return {k,W,H,cx,cy,blds,props,roads,plazas,paths,road,cs,gw,gh,exit,type,cont:C,water,top:0,roadY:[],plaza:plazas[0],gate:null};}
/* 地面：その地方の地面の模様に、通り・小道・広場を土（石畳）の模様で */
function twGround(L,img){const c=document.createElement('canvas');c.width=L.W;c.height=L.H;const g=c.getContext('2d');const air=twAir(L.k);
  const gr=(L.cont&&twArt(L.cont+'n15'))||img[air.ground];const rd=(L.cont&&twArt(L.cont+'n16'))||img[air.sand?'trock':'dirt'];
  g.fillStyle=gr?g.createPattern(gr,'repeat'):'#3a4a2a';g.fillRect(0,0,L.W,L.H);
  // 濃淡（同じ模様の繰り返しが目立たないように）
  for(let i=0;i<L.W*L.H/9000;i++){const x=Math.random()*L.W,y=Math.random()*L.H,rr=30+Math.random()*90;const gg=g.createRadialGradient(x,y,0,x,y,rr);const dk=Math.random()<.5;gg.addColorStop(0,dk?'rgba(0,0,0,.10)':'rgba(255,240,200,.07)');gg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gg;g.fillRect(x-rr,y-rr,rr*2,rr*2);}
  const path=new Path2D();const seg=(pts,w)=>{for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/6);for(let j=0;j<=n;j++){const x=a.x+(b.x-a.x)*j/n,y=a.y+(b.y-a.y)*j/n;path.moveTo(x+w/2,y);path.arc(x,y,w/2,0,Math.PI*2);}}};
  for(const r of L.roads)seg(r.pts,r.w);for(const p of L.paths)seg(p,12);
  for(const p of L.plazas){path.moveTo(p.x+p.rx,p.y);path.ellipse(p.x,p.y,p.rx,p.ry,0,0,Math.PI*2);}
  g.save();g.filter='blur(3px)';g.fillStyle='rgba(0,0,0,.28)';g.fill(path);g.restore();
  if(L.water){const wy=L.water.y;const sea=g.createLinearGradient(0,0,0,wy);sea.addColorStop(0,'#1d3550');sea.addColorStop(1,'#2f5a78');g.fillStyle=sea;g.fillRect(0,0,L.W,wy+6);
    for(let i=0;i<L.W*wy/260;i++){const x=Math.random()*L.W,y=Math.random()*wy;g.fillStyle=Math.random()<.5?'rgba(170,210,235,.35)':'rgba(10,25,40,.35)';g.fillRect(Math.round(x),Math.round(y),3+Math.round(Math.random()*5),1);}
    g.fillStyle='rgba(230,240,250,.55)';for(let x=0;x<L.W;x+=3)g.fillRect(x,wy+4+Math.round(Math.sin(x/9)*1.5),2,1);
    g.fillStyle='#5b4026';g.fillRect(0,wy+6,L.W,10);g.fillStyle='#7a5733';for(let x=0;x<L.W;x+=12)g.fillRect(x,wy+6,11,9);g.fillStyle='#3a2816';for(let x=6;x<L.W;x+=48)g.fillRect(x,wy+4,4,14);}
  g.save();g.clip(path);g.fillStyle=rd?g.createPattern(rd,'repeat'):'#6a5a40';g.fillRect(0,0,L.W,L.H);g.restore();
  return c;}
/* 住人の行き先：通りや広場の上のどこか */
function twTownSpot(L,r){for(let n=0;n<60;n++){const rd=L.roads[Math.floor(r()*L.roads.length)];const p=rd.pts[Math.floor(r()*rd.pts.length)];const x=p.x+(r()-.5)*rd.w*.6,y=p.y+(r()-.5)*rd.w*.5;if(!TW||twFreeBody(x,y))return {x,y};}return {x:L.cx,y:L.cy};}   // 体の幅で確かめる（2026-11-26、真ん中だけだと物にかかった所に現れ、固まっていた）
