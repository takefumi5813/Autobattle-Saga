/* 一行の後ろから見る視点（試作、2026-11-24。オーナーの案「一行の後ろから見るTPS視点」）
   いつもの見下ろしの絵は裏の画面（FLD.off）に描き、そこで人物・木・岩・敵の絵を描いた位置を記録しておく（FLD.rec）。
   表の画面には、地面を奥行きのある床として描き（スーファミのモード7のように一行ずつ）、記録した絵を足もとの位置で奥行きに合わせて
   大きさを変えて立てる。カメラは一行の後ろ・少し上にいて、道の向きを見る（ゆっくり追う）。
   いまの絵は横向きしかないので、奥へ歩く一行は横を向いたまま。後ろ姿の絵を生成すれば本物らしくなる（次の段）。 */
const TPS={D:82,H:142,F:98,HOR:-20,FAR:520};   // オーナー「もう少し上からの見下ろしに」：カメラを高く（見下ろす角度 約45度）
function fTPS(G,cam,camY,focus,dir,now,o){
  const FW=G.canvas.width,FH=G.canvas.height;const map=(fLay()&&fLay().groundC)||FLD.map;   // 物を描く前の地面だけの絵
  if(!FLD.mapData||FLD.mapData.src!==map){FLD.mapData={src:map,d:map.getContext('2d').getImageData(0,0,map.width,map.height).data,w:map.width,h:map.height};}
  const M=FLD.mapData;
  // カメラの向きはゆっくり追う（道が曲がると、景色が回り込む）
  const T=FLD.tdir||(FLD.tdir=[dir[0],dir[1]]);const k=Math.min(1,(o.dt||.016)*1.6);T[0]+=(dir[0]-T[0])*k;T[1]+=(dir[1]-T[1])*k;const L=Math.hypot(T[0],T[1])||1;const fx=T[0]/L,fy=T[1]/L,rx=-fy,ry=fx;
  const F2=FLD.tfoc||(FLD.tfoc=[focus[0],focus[1]]);F2[0]+=(focus[0]-F2[0])*Math.min(1,(o.dt||.016)*4);F2[1]+=(focus[1]-F2[1])*Math.min(1,(o.dt||.016)*4);
  const Cx=F2[0]-fx*TPS.D,Cy=F2[1]-fy*TPS.D;
  const img=FLD.tpsImg&&FLD.tpsImg.width===FW?FLD.tpsImg:(FLD.tpsImg=G.createImageData(FW,FH));const p=img.data;
  const sky=o.dark?[10,10,16]:o.night>.3?[12,16,38]:o.tod==='夕'?[200,120,80]:[150,168,196];const sky2=o.dark?[6,6,10]:o.night>.3?[20,26,50]:o.tod==='夕'?[236,176,120]:[214,206,190];
  const fog=o.dark?[6,6,10]:o.night>.3?[14,18,40]:sky2;
  for(let sy=0;sy<FH;sy++){let i=sy*FW*4;
    if(sy<=TPS.HOR){const t=sy/TPS.HOR;for(let sx=0;sx<FW;sx++,i+=4){p[i]=sky[0]+(sky2[0]-sky[0])*t;p[i+1]=sky[1]+(sky2[1]-sky[1])*t;p[i+2]=sky[2]+(sky2[2]-sky[2])*t;p[i+3]=255;}continue;}
    const z=TPS.H*TPS.F/(sy-TPS.HOR);const per=z/TPS.F;const cx=Cx+fx*z,cy=Cy+fy*z;const fk=Math.min(1,Math.max(0,(z-TPS.FAR*.45)/(TPS.FAR*.55)));
    for(let sx=0;sx<FW;sx++,i+=4){const l=(sx-FW/2)*per;const wx=Math.round(cx+rx*l),wy=Math.round(cy+ry*l);let r=fog[0],g=fog[1],b=fog[2];
      if(wx>=0&&wy>=0&&wx<M.w&&wy<M.h){const j=(wy*M.w+wx)*4;r=M.d[j]+(fog[0]-M.d[j])*fk;g=M.d[j+1]+(fog[1]-M.d[j+1])*fk;b=M.d[j+2]+(fog[2]-M.d[j+2])*fk;}
      p[i]=r;p[i+1]=g;p[i+2]=b;p[i+3]=255;}}
  G.putImageData(img,0,0);
  // 遠くの山なみ（屋外だけ）
  if(!o.dark){G.fillStyle=o.night>.3?'#141a30':'#6c7690';G.beginPath();G.moveTo(0,TPS.HOR+1);const ph=Math.atan2(fy,fx)*60;for(let x=0;x<=FW;x+=8)G.lineTo(x,TPS.HOR-6-8*Math.abs(Math.sin((x+ph)/37))-5*Math.abs(Math.sin((x+ph)/13)));G.lineTo(FW,TPS.HOR+1);G.closePath();G.fill();}
  // 立てる絵（足もとの位置を奥行きに直す）
  const proj=(sx,sy)=>{const wx=sx+cam-Cx,wy=sy+camY-Cy;const a=wx*fx+wy*fy,s=wx*rx+wy*ry;if(a<8)return null;const sc=TPS.F/a;return [FW/2+s*sc,TPS.HOR+TPS.H*sc,sc,a];};
  FLD.tpsProj=(sx,sy)=>{const q=proj(sx,sy);return q?[q[0],q[1],q[2]]:[sx,sy,1];};
  const list=[];const objs=fLay()&&fLay().objs;
  for(const r of FLD.rec||[]){if(objs&&!r.who)continue;const w=r.w||r.img.width,h=r.h||r.img.height;const q=proj(r.x+w/2,r.y+h-2);if(!q||q[3]>TPS.FAR)continue;list.push({r,w,h,q});}   // 人と敵（木や建物は下の一覧から立てる）
  for(const o of objs||[]){const q=proj(o.x-cam,o.y-camY);if(!q||q[3]>TPS.FAR||q[0]<-200||q[0]>FW+200)continue;list.push({r:{img:o.c,al:1,o},w:o.c.width,h:o.c.height,q});}
  list.sort((a,b)=>b.q[3]-a.q[3]);
  G.imageSmoothingEnabled=false;
  for(const it of list){const {r,w,h,q}=it;const sc=q[2];const W2=w*sc,H2=h*sc;if(W2<1||H2<1||q[0]+W2/2<0||q[0]-W2/2>FW)continue;
    const tall=h>46;const near=q[3]<TPS.D-24;if(q[3]<TPS.D*.45&&!r.who)continue;   // カメラのすぐ前の草木は描かない
    let al=r.al==null?1:r.al;if(near&&!r.who)al=Math.min(al,tall?.3:.5);   // 一行より手前の木や岩・草むらは透かす   // 一行より手前の木や岩は透かす
    const fk=Math.min(1,Math.max(0,(q[3]-TPS.FAR*.45)/(TPS.FAR*.55)));
    if(!tall&&h>20){G.globalAlpha=.35*al;G.fillStyle='#000';G.beginPath();G.ellipse(q[0],q[1],Math.max(2,7*sc),Math.max(1,2.4*sc),0,0,7);G.fill();}
    G.globalAlpha=al*(1-fk*.8);const sh=r.o&&r.o.s?fSway(r.o,now,FLD.wind??1,null):0;   // 風で揺れる木（data/nav.js）
    if(Math.abs(sh)>.002){G.save();G.translate(Math.round(q[0]),Math.round(q[1]));G.transform(1,0,-sh,1,0,0);G.drawImage(r.img,-Math.round(W2/2),-Math.round(H2),Math.round(W2),Math.round(H2));G.restore();}
    else G.drawImage(r.img,Math.round(q[0]-W2/2),Math.round(q[1]-H2),Math.round(W2),Math.round(H2));}
  G.globalAlpha=1;
  // 焚き火
  if(o.night>.02&&o.fire){const q=proj(o.fire[0],o.fire[1]);G.globalAlpha=.55*o.night;G.fillStyle='#0a0e26';G.fillRect(0,0,FW,FH);G.globalAlpha=1;
    if(q){const fl=.85+.15*Math.sin(now/90);G.globalCompositeOperation='lighter';const gr=G.createRadialGradient(q[0],q[1]-4,2,q[0],q[1]-4,70*fl*Math.min(2,q[2]));gr.addColorStop(0,`rgba(255,170,80,${.6*o.night})`);gr.addColorStop(1,'rgba(255,120,40,0)');G.fillStyle=gr;G.fillRect(0,0,FW,FH);G.globalCompositeOperation='source-over';
      for(let i=0;i<6;i++){const h=(4+((Math.floor(now/80)+i*3)%5))*q[2];G.fillStyle=i%2?'#ffd060':'#ff7a30';G.fillRect(q[0]-4*q[2]+i*1.5*q[2],q[1]-h,2*q[2],h);}}}
  else if(o.dark){const gr=G.createRadialGradient(FW/2,FH*.78,20,FW/2,FH*.78,190);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.7)');G.fillStyle=gr;G.fillRect(0,0,FW,FH);}
  if(o.wk==='rain'){G.strokeStyle='rgba(170,195,230,.5)';G.beginPath();for(let i=0;i<70;i++){const x=((i*53+now*.22*(1+i%3))%(FW+20))-10,y=(i*97+now*.55)%FH;G.moveTo(x,y);G.lineTo(x-2,y+6);}G.stroke();}
  else if(o.wk==='snow'){G.fillStyle='#f0f4ff';for(let i=0;i<60;i++){const x=((i*41+Math.sin(now/700+i)*8)%FW+FW)%FW,y=(i*73+now*.03*(1+i%3))%FH;G.fillRect(Math.round(x),Math.round(y),2,2);}}
  else if(o.wk==='fog'){G.fillStyle='rgba(200,205,215,.22)';G.fillRect(0,0,FW,FH);}
  if(o.tod==='夕'){G.fillStyle='rgba(255,130,50,.12)';G.fillRect(0,0,FW,FH);}
}

/* 右上の小さな地図（2026-11-24、オーナー「地図は右上とかに表示させたい」）。北が上。
   地面だけの絵を縮めて道筋・木や建物の点を描いた小さな地図（lay.mini、旅ごとに一度作る）から、一行のまわりを切り出す。
   一行は黄色、敵は赤、野営地は白い点、行き先は白い四角。後ろから見る視点では、カメラの向きを三角で示す */
function fMiniMap(G){const lay=fLay();if(!lay||!lay.wm||!FLD.map)return;const src=lay.groundC||FLD.map;const K=.12;
  if(!lay.mini){const c=fCanvas(Math.ceil(src.width*K),Math.ceil(src.height*K));const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.drawImage(src,0,0,c.width,c.height);
    x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,0,c.width,c.height);
    for(const o of lay.objs||[]){x.fillStyle=o.c.height>60?'rgba(30,44,30,.9)':'rgba(40,50,40,.6)';const r=o.c.height>60?2:1;x.fillRect(Math.round(o.x*K)-r,Math.round(o.y*K)-r,r*2,r*2);}
    const m=lay.wm;x.strokeStyle='rgba(236,214,150,.95)';x.lineWidth=1.6;x.beginPath();for(let s=0;s<m.N;s+=6){const X=m.cx[s]*K,Y=m.cy[s]*K;s?x.lineTo(X,Y):x.moveTo(X,Y);}x.stroke();
    lay.mini=c;}
  const FW=G.canvas.width/(G.__k||1),big=!!FLD.miniHover,W=big?120:44,H=big?94:34,X0=4,Y0=4;   // ふだんは小さく、マウスを載せたときだけ大きく（2026-11-26）   // 右上は世界地図にゆずり、近くの地図は左上へ（2026-11-26）
  const pts=Object.entries(FLD.P||{}).filter(([id])=>{const u=B.units.find(x=>x.id===id);return u&&u.state!=='lost';}).map(([,P])=>fWorld(P.x,P.y));
  if(!pts.length)return;const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cy=pts.reduce((a,p)=>a+p[1],0)/pts.length;
  G.save();G.globalAlpha=.92;G.fillStyle='#0b0d14';G.fillRect(X0-2,Y0-2,W+4,H+4);G.beginPath();G.rect(X0,Y0,W,H);G.clip();
  G.imageSmoothingEnabled=false;G.drawImage(lay.mini,Math.round(X0+W/2-cx*K),Math.round(Y0+H/2-cy*K));
  const at=(wx,wy)=>[X0+W/2+(wx-cx)*K,Y0+H/2+(wy-cy)*K];
  G.globalAlpha=1;
  for(const c0 of lay.camps||[]){const [a,b]=at(...fWorld(c0+20,fPathY(c0+20)));G.fillStyle='#e8e4d8';G.fillRect(Math.round(a)-1,Math.round(b)-1,2,2);}
  {const last=B.plan&&B.plan[B.plan.length-1];if(last&&last.x!=null){const [a,b]=at(...fWorld(last.x,fPathY(last.x)));G.strokeStyle='#fff';G.strokeRect(Math.round(a)-2.5,Math.round(b)-2.5,5,5);}}
  for(const e of B.enemies||[]){if(e.state!=='ok')continue;const Q=FLD.E&&FLD.E[e.id];if(!Q)continue;const [a,b]=at(...fWorld(Q.x,Q.y));G.fillStyle='#ff5a4a';G.fillRect(Math.round(a)-1,Math.round(b)-1,2,2);}
  for(const p of pts){const [a,b]=at(p[0],p[1]);G.fillStyle='#ffd84a';G.fillRect(Math.round(a)-1,Math.round(b)-1,2,2);}
  if(FLD.tps&&FLD.tdir){const L=Math.hypot(FLD.tdir[0],FLD.tdir[1])||1;const fx=FLD.tdir[0]/L,fy=FLD.tdir[1]/L;const a=X0+W/2,b=Y0+H/2;G.fillStyle='rgba(255,216,74,.55)';G.beginPath();G.moveTo(a+fx*9,b+fy*9);G.lineTo(a-fy*4-fx*2,b+fx*4-fy*2);G.lineTo(a+fy*4-fx*2,b-fx*4-fy*2);G.closePath();G.fill();}
  G.restore();G.strokeStyle='rgba(236,214,150,.8)';G.lineWidth=1;G.strokeRect(X0-1.5,Y0-1.5,W+3,H+3);
  G.fillStyle='rgba(236,214,150,.9)';G.font='bold 6px sans-serif';G.fillText('N',X0+W-6,Y0+7);}
