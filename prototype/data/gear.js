/* 武具の生成（2026-11-24）。試作（shintaku.html）が読み込む。
   1本ずつ手で書く代わりに「型 × 出来（格）× 素材 × 産地 × 固有の癖」を決まった種（シード）で組み合わせ、
   毎回同じ顔ぶれの、名前の重ならない武具を作る。数は GEAR_COUNT で変えられる（増やしても前の品は同じまま残る）。
   格：1 粗末 / 2 並 / 3 良 / 4 名品 / 5 業物 / 6 伝説。4以上は銘（「夜鳴」など）、6は由来の一文が付く。
   固有の癖（tr）は持っているあいだ常に効く効果の部品。試作の TRAIT 表で意味を決め、パッシブの技にも使い回す。 */
const GEAR_COUNT={wpn:300,arm:60,acc:40};
const GEAR_TIER=['','粗末','並','良','名品','業物','伝説'];
const GEAR_TMUL=[0,.6,.85,1,1.15,1.3,1.5];
/* 武器の型：系統ごと。数値は格3のときの値 */
const WTYPES=[
  {n:'長剣',line:'剣',atk:3},{n:'大剣',line:'剣',atk:5,spd:-.08},{n:'刀',line:'剣',atk:3.5,spd:.04},{n:'曲刀',line:'剣',atk:3,spd:.06},{n:'細剣',line:'剣',atk:2.5,spd:.1},{n:'槍',line:'剣',atk:3.5},
  {n:'大盾',line:'盾',def:.1,hp:20},{n:'円盾',line:'盾',def:.07,hp:10,spd:.03},{n:'凧盾',line:'盾',def:.08,hp:15},{n:'戦鎚',line:'盾',atk:2,def:.05,hp:10},
  {n:'杖',line:'魔',atk:2},{n:'長杖',line:'魔',atk:2.5,frost:.5},{n:'魔導書',line:'魔',atk:1.5,flash:.2},{n:'宝珠',line:'魔',atk:2,spd:.05},
  {n:'長弓',line:'弓',atk:3},{n:'短弓',line:'弓',atk:2,spd:.08},{n:'弩',line:'弓',atk:4,spd:-.06},{n:'和弓',line:'弓',atk:3,flash:.1},
  {n:'聖印',line:'祈',heal:.2},{n:'錫杖',line:'祈',heal:.15,atk:1},{n:'数珠',line:'祈',heal:.1,obey:.05},{n:'聖典',line:'祈',heal:.15,flash:.15},{n:'拳甲',line:'祈',atk:2.5,heal:.05},
  {n:'短刀',line:'短',atk:2,spd:.05},{n:'双剣',line:'短',atk:2.5,spd:.06},{n:'投げ刃',line:'短',atk:2,spd:.08},{n:'鉤爪',line:'短',atk:3},
  {n:'竪琴',line:'歌',atk:1,heal:.1,spd:.05},{n:'笛',line:'歌',atk:1,spd:.1},{n:'鈴',line:'歌',heal:.1,obey:.05},
];
const ATYPES=[{n:'革鎧',def:.05,hp:10},{n:'鎖帷子',def:.12,spd:-.05},{n:'板金鎧',def:.16,hp:15,spd:-.1},{n:'法衣',def:.03,heal:.1},{n:'外套',def:.03,flash:.25},{n:'綿入れ',def:.06,hp:20},{n:'鱗鎧',def:.1,hp:10,spd:-.03},{n:'胴丸',def:.09,spd:.02}];
const CTYPES=[{n:'指輪',frost:1},{n:'首飾り',obey:.1},{n:'腕輪',hp:15},{n:'護符',def:.04},{n:'羽飾り',spd:.1},{n:'耳飾り',flash:.3},{n:'帯',hp:10,def:.02}];
/* 素材：格の下限（low）と、数値への掛け方 */
const MATS=[
  {n:'青銅',low:1,m:.9},{n:'鉄',low:1,m:1},{n:'樫',low:1,m:1,lines:['盾','魔','弓','祈','歌']},{n:'鋼',low:2,m:1.1},{n:'黒鉄',low:2,m:1.05,def:.02},
  {n:'銀',low:3,m:1,flash:.1},{n:'霊木',low:3,m:1,heal:.05,lines:['魔','祈','歌','弓']},{n:'骨',low:2,m:1.05},{n:'黒曜',low:3,m:1,spd:.04},
  {n:'星鉄',low:4,m:1.2},{n:'竜骨',low:5,m:1.3},{n:'月銀',low:5,m:1.15,flash:.15},
];
const ORIGINS=['ガルド','王都','セレス','ニーア','ロウ','鉱山','北方','東方','砂漠','塩沢','灰峠','古森','山寺','港','辺境','廃都','白翼','黒森'];
const MAKERS=['打ち','鍛え','作り','拵え','仕立て','伝来'];
const MEI_A=['月','雪','霧','鴉','狼','影','焔','嵐','雷','朧','紅','蒼','白','黒','夜','暁','茜','風','星','霜','灰','銀','血','露','雲','鬼','龍','鷹','蛍','錆'];
const MEI_B=['鳴','哭','牙','刃','光','舞','渡','喰','裂','断','穿','守','照','詠','祈','嘯','華','走','眠','咲','落','還','縫','歌','誓','灯'];
const LORE_WHO=['名もなき鍛冶','盲目の刀工','亡国の騎士','山寺の老僧','北方の狩人','白翼の離反者','流れの吟遊詩人','鉱山の頭領','砂漠の隊商','塩沢の巫女'];
const LORE_DEED=['死んだ弟の名を刻んで','一夜で百の狼を討つため','大神の目を盗んで','誰にも負けぬことを誓って','遠い故郷の雪を思って','神を信じぬ者のために','迷宮の底の鉄を用いて','王の首を落とすため','娘の嫁入りの守りに','最後の一振りとして'];
const LORE_END=['いまも持ち主を選ぶという。','刃には消えない曇りがある。','握ると、かすかに温かい。','夜になると小さく鳴る。','前の持ち主は、みな長生きしなかった。','祈りの言葉が柄に彫られている。'];
/* 固有の癖：w 武器 / a 防具 / c 装飾 のどれに付くか */
const GEAR_TRAITS={
  frostBite:'wc',stunBite:'w',giant:'w',beast:'w',goblin:'w',human:'w',vamp:'wc',bleedHit:'w',stunHit:'w',freezeHit:'w',first:'w',
  lowHp:'wc',fullHp:'wc',faithAtk:'wc',deep:'w',quickCd:'wc',
  accurate:'wc',lucky:'ac',
  guardT:'ac',dodge:'ac',regenT:'ac',rescue:'ac',counter:'aw',thornsP:'a',sweepRes:'a',
};
function genGear(){
  let seed=20261124;const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
  const pk=a=>a[Math.floor(rnd()*a.length)];
  const out={};const used=new Set();
  const tierRoll=()=>{const r=rnd();return r<.18?1:r<.42?2:r<.66?3:r<.84?4:r<.95?5:6;};
  const round=(v,d)=>Math.round(v*d)/d;
  const make=(slot,idx,types,code)=>{
    for(let tries=0;tries<50;tries++){
      const T=pk(types);const tier=tierRoll();
      const mats=MATS.filter(m=>m.low<=tier&&(!m.lines||!T.line||m.lines.includes(T.line)));const M=pk(mats);
      const org=pk(ORIGINS);const mk=pk(MAKERS);
      let mei='';if(tier>=4)mei=`「${pk(MEI_A)}${pk(MEI_B)}」`;
      const name=tier<=1?`${M.n}の${T.n}`:tier<=3?`${org}${mk}の${M.n}の${T.n}`:`${M.n}の${T.n}${mei}`;
      if(used.has(name)||(tier>=4&&used.has(mei)))continue;
      used.add(name);if(mei)used.add(mei);
      const tm=GEAR_TMUL[tier]*M.m;const d={name,slot,tier,type:T.n,gen:true};if(T.line)d.line=T.line;
      for(const k of ['atk','def','hp','spd','flash','frost','heal','obey']){let v=(T[k]||0);
        if(k==='atk'||k==='hp')v*=tm;else if(k==='def'||k==='heal'||k==='flash'||k==='obey')v*=GEAR_TMUL[tier];
        v+=M[k]||0;if(v)d[k]=k==='atk'||k==='hp'?Math.max(1,Math.round(v)):round(v,100);}
      const pool=Object.keys(GEAR_TRAITS).filter(t=>GEAR_TRAITS[t].includes(code));
      const nTr=tier===1?0:tier===2?(rnd()<.3?1:0):tier<=4?(tier===4&&rnd()<.35?2:1):2;
      const tr=[];while(tr.length<nTr){const t=pk(pool);if(!tr.includes(t))tr.push(t);}
      if(tr.length)d.tr=tr;
      if(tier===6)d.lore=`${pk(LORE_WHO)}が、${pk(LORE_DEED)}鍛えた。${pk(LORE_END)}`;
      out[`g${code}${String(idx).padStart(4,'0')}`]=d;return;}
  };
  // 種類ごとに種を分ける（武器の数を増やしても、防具や装飾の顔ぶれは変わらない）
  seed=20261124;for(let i=0;i<GEAR_COUNT.wpn;i++)make('wpn',i,WTYPES,'w');
  seed=31415926;for(let i=0;i<GEAR_COUNT.arm;i++)make('arm',i,ATYPES,'a');
  seed=27182818;for(let i=0;i<GEAR_COUNT.acc;i++)make('acc',i,CTYPES,'c');
  return out;
}
const GEAR_DATA=genGear();
