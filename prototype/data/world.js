/* 世界の生成（2026-11-24）。試作（shintaku.html）が読み込む。
   - 手で作った「中つ国（c0）」＝ いまの6つの町と区画。ここは毎回同じ
   - そのほかの5大陸（c1〜c5）は、セーブに入れた種（wseed）から生まれる。新しく始めるたびに違う世界になる
   - 合わせて町およそ70・迷宮300。町と町のあいだには必ず区画（歩ける土地）があり、迷宮は区画から入る
   - 大陸どうしは海路でつながる（港町セレスから各大陸の港へ）。海路も区画の一つとして歩く（船旅）
   増やすときは CONTS の towns / dungeons を変えるだけでよい */
const CONTS=[
  {id:'c0',name:'中つ国',lv:3,hand:true},
  {id:'c1',name:'北の雪国ノルデン',lv:5,towns:13,dungeons:54,themes:[['pass',4],['river',3],['hill',2],['forest',2]],
    syl:['ヴァ','ル','ン','ス','ヘ','イム','ガル','ド','フィ','ヨル','ク','ニ','ラ','ベル','トー','ア','グ','リ'],kinds:['町','村','砦','集落']},
  {id:'c2',name:'東方の八洲',lv:6,towns:13,dungeons:54,themes:[['forest',3],['river',3],['hill',2],['plain',2]],
    kanjiA:['霞','白','鬼','竜','月','狐','桜','鷺','黒','朱','青','雪','風','星','鳴','藤','柳','狼','楓','蛍'],kanjiB:['ヶ原','津','宿','里','谷','浦','岳','沢','野','坂','崎','川'],kinds:['','','村','宿']},
  {id:'c3',name:'砂の大陸ザハル',lv:7,towns:13,dungeons:54,themes:[['plain',4],['pass',3],['hill',2]],
    syl:['ア','ル','カ','ザ','ム','ハ','ラ','シ','ド','バ','ス','ン','ナ','ジ','ファ','リ'],kinds:['町','泉の町','都','隊商宿']},
  {id:'c4',name:'南の密林ヴェルデ',lv:8,towns:13,dungeons:54,themes:[['forest',5],['marsh',4],['river',2]],
    syl:['オ','コ','タ','マ','ル','ア','パ','キ','ナ','ト','ウ','ラ','チ','ヤ'],kinds:['村','集落','樹上町','町']},
  {id:'c5',name:'古き魔の大陸エルドラ',lv:10,towns:13,dungeons:54,themes:[['marsh',3],['hill',3],['pass',2],['forest',2]],
    syl:['エ','ル','ド','ラ','ゼ','ノ','ア','ス','モ','リ','ヴ','オ','ン','グ','イ'],kinds:['廃都','町','砦','集落']},
];
const C0_EXTRA_DUN=25;   // 中つ国にも小さな迷宮を足す（いまの5つと合わせて30）
const DUN_A=['凍てつく','沈んだ','焼けた','忘れられた','崩れた','黒い','歌う','眠る','呪われた','白骨の','蛇の','鬼の','星の','血の','霧の','古き','狂王の','嘆きの','獣の','砂に埋もれた','苔むした','鳴く'];
const DUN_B=['洞窟','地下墓所','塔','遺跡','坑道','神殿','迷宮','砦跡','井戸','礼拝堂','大樹','祠','城','書庫','牢獄','巣','地下水路','鐘楼'];
const DUN_THEME=['goblin','goblin','beast','bandit','ogre'];
const THEME_ENC={
  hill:[['none',3],['wolf',4],['ogre',2]],river:[['none',3],['bandit',4],['goblin',3]],plain:[['none',5],['bandit',3],['goblin',1]],
  pass:[['none',3],['wolf',3],['bandit',2]],forest:[['none',2],['wolf',5],['ogre',1]],marsh:[['none',3],['goblin',4],['wolf',1]],
};
const AREA_WORD={hill:['丘','高地','岩場'],river:['川辺','渡し','谷'],plain:['平原','野','草原'],pass:['峠','山道','岩山'],forest:['森','樹海','深森'],marsh:['湿原','沼地','泥沼']};
const SEA_X=[['c1','c2','北の海'],['c2','c4','南の海'],['c3','c4','灼けた海峡'],['c3','c5','砂の海路'],['c1','c5','氷の海']];
/* 世界全体の地図での大陸の置き場所（256×224の中）と大きさ */
const CONT_POS={c0:{x:120,y:112,r:40},c1:{x:96,y:30,r:30},c2:{x:222,y:88,r:30},c3:{x:30,y:150,r:30},c4:{x:150,y:196,r:28},c5:{x:226,y:192,r:28}};
const PORT={};
function genWorld(seed){
  let sd=seed>>>0||1;const rnd=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296;};
  const pk=a=>a[Math.floor(rnd()*a.length)];const wp=a=>{let t=a.reduce((x,y)=>x+y[1],0)*rnd();for(const [k,v] of a){t-=v;if(t<=0)return k;}return a[0][0];};
  const towns={},areas={},links=[];const usedNames=new Set();
  const uniq=(f)=>{for(let i=0;i<40;i++){const n=f();if(!usedNames.has(n)){usedNames.add(n);return n;}}const n=f()+'Ⅱ';usedNames.add(n);return n;};
  const dunName=()=>uniq(()=>pk(DUN_A)+pk(DUN_B));
  let dn=0;const addDun=(cont,lv,area,ax,ay)=>{const k=`d${dn++}`;const a=rnd()*Math.PI*2,r=10+rnd()*10;
    areas[k]={name:dunName(),kind:'dungeon',cont,x:Math.round(Math.max(8,Math.min(248,ax+Math.cos(a)*r))),y:Math.round(Math.max(10,Math.min(214,ay+Math.sin(a)*r))),icon:pk(['gate','mine','tower','burnt','abbey']),lv:lv+Math.floor(rnd()*4),dtheme:pk(DUN_THEME),gen:true};
    links.push([area,k]);return k;};
  // 中つ国：いまの区画に小さな迷宮を足す
  const c0areas=[['hill',120,128],['north',198,92],['plain',122,60],['pass',44,90],['forest',60,134],['marsh',182,198]];
  for(let i=0;i<C0_EXTRA_DUN;i++){const [a,x,y]=c0areas[i%c0areas.length];addDun('c0',3,a,x,y);}
  // ほかの大陸
  for(const C of CONTS){if(C.hand)continue;
    const pts=[];const cx=128,cy=112,rx=100,ry=86;
    for(let tries=0;pts.length<C.towns&&tries<4000;tries++){const a=rnd()*Math.PI*2,r=Math.sqrt(rnd());const x=cx+Math.cos(a)*rx*r,y=cy+Math.sin(a)*ry*r;
      if(pts.every(p=>Math.hypot(p.x-x,p.y-y)>36))pts.push({x:Math.round(x),y:Math.round(y)});}
    const tk=pts.map((p,i)=>{const k=`${C.id}t${i}`;
      const nm=C.kanjiA?uniq(()=>pk(C.kanjiA)+pk(C.kanjiB)):uniq(()=>{let s='';const n=2+Math.floor(rnd()*2);for(let j=0;j<n;j++){let x=pk(C.syl);while(j===0&&x==='ン')x=pk(C.syl);s+=x;}return s;});
      const kind=pk(C.kinds);towns[k]={name:nm,base:nm,kindName:kind,x:p.x,y:p.y,b:Math.floor(rnd()*4),icon:kind==='都'||kind==='廃都'?'capital':kind==='村'||kind==='集落'?'village':'town',cont:C.id,gen:true};
      return k;});
    // 名前の形：「〜の町」ではなく、種類を前に（例：砦ヴァルハイム、霞ヶ原、オアシス・ザハラ）
    for(const k of tk){const t=towns[k];t.name=t.kindName?(C.kanjiA?`${t.base}${t.kindName}`:`${t.kindName}${t.base}`):t.base;}
    // 港：大陸の西寄り（中つ国の側）の町
    const port=tk.slice().sort((a,b)=>towns[a].x-towns[b].x)[0];towns[port].port=true;towns[port].icon='town';towns[port].name=`港町${towns[port].base}`;
    // 道：最小全域木＋近いもう一本
    const E=new Set();const ek=(a,b)=>a<b?a+'|'+b:b+'|'+a;const inT=new Set([tk[0]]);
    while(inT.size<tk.length){let best=null;for(const a of inT)for(const b of tk){if(inT.has(b))continue;const d=Math.hypot(towns[a].x-towns[b].x,towns[a].y-towns[b].y);if(!best||d<best[2])best=[a,b,d];}E.add(ek(best[0],best[1]));inT.add(best[1]);}
    for(const a of tk){const near=tk.filter(b=>b!==a).sort((p,q)=>Math.hypot(towns[a].x-towns[p].x,towns[a].y-towns[p].y)-Math.hypot(towns[a].x-towns[q].x,towns[a].y-towns[q].y))[1];if(near&&rnd()<.6)E.add(ek(a,near));}
    const ak=[];let ai=0;
    for(const e of E){const [a,b]=e.split('|');const th=wp(C.themes);const k=`${C.id}a${ai++}`;
      const x=Math.round((towns[a].x+towns[b].x)/2+(rnd()-.5)*10),y=Math.round((towns[a].y+towns[b].y)/2+(rnd()-.5)*10);
      areas[k]={name:uniq(()=>`${towns[pk([a,b])].base}の${pk(AREA_WORD[th])}`),kind:'area',cont:C.id,x,y,theme:th,enc:THEME_ENC[th],lv:C.lv,gen:true};
      links.push([a,k],[k,b]);ak.push(k);}
    for(let i=0;i<C.dungeons;i++){const a=ak[i%ak.length];addDun(C.id,C.lv,a,areas[a].x,areas[a].y);}
    // 海路：中つ国の港町セレスから
    const sk=`sea_${C.id}`;areas[sk]={name:`${C.name.replace(/^.*?(ノルデン|八洲|ザハル|ヴェルデ|エルドラ)$/,'$1')}への海路`,kind:'area',cont:'c0',x:Math.min(250,214+CONTS.indexOf(C)*7),y:Math.min(220,184+CONTS.indexOf(C)*6),theme:'river',enc:[['none',5],['bandit',2]],sea:C.id,fare:8+CONTS.indexOf(C)*4,lv:C.lv,gen:true};
    links.push(['seles',sk],[sk,port]);PORT[C.id]=port;
  }
  /* 大陸どうしの航路（2026-11-26、オーナー「世界地図の全体も。各大陸間の接続も考えて」）：
     中つ国のセレスからは各大陸へ。さらに、となりあう大陸の港どうしも船でつながる（乱数は使わない＝前の世界はそのまま）
       ノルデン―八洲（北の海）／八洲―ヴェルデ（南の海）／ザハル―ヴェルデ（灼けた海峡）／ザハル―エルドラ（砂の海路）／ノルデン―エルドラ（氷の海）
     海路は区画の一つで、出口の大陸の港の沖に置く。船賃は行き先の危険度で決まる */
  for(const [a,b,nm] of SEA_X){if(!PORT[a]||!PORT[b])continue;const k=`sea_${a}_${b}`;const ta=towns[PORT[a]];const lvB=(CONTS.find(c=>c.id===b)||{}).lv||5;
    areas[k]={name:nm,kind:'area',cont:a,x:Math.max(6,ta.x-14),y:Math.min(214,ta.y+12),theme:'river',enc:[['none',5],['bandit',2]],sea:b,seaFrom:a,fare:10+lvB*3,lv:Math.max(lvB,(CONTS.find(c=>c.id===a)||{}).lv||3),gen:true};
    links.push([PORT[a],k],[k,PORT[b]]);}
  return {towns,areas,links};
}
/* 種：セーブにあればそれ、なければ新しく。新しいセーブ（newSave）はこの種を受け継ぐ */
const WSEED=(()=>{try{const s=JSON.parse(localStorage.getItem('shintaku-proto-v2'));if(s&&s.wseed)return s.wseed;}catch(e){}return 1+Math.floor(Math.random()*2147483646);})();
const GEN_WORLD=genWorld(WSEED);
/* 旅先の出来事（道中を楽しくする。区画の見た目ごと。いずれイベント3000の表に広げる） */
const SIGHTS={
  forest:[{t:'苔むした祠があった。一行は手を合わせた',fx:'faith'},{t:'木漏れ日の中、薬草の群生を見つけた',fx:'mat:yakusou:2'},{t:'倒木の下で、誰かの古い荷物が朽ちていた',fx:'gold:12'}],
  river:[{t:'渡し守の老人が、この先の道を教えてくれた',fx:'chart'},{t:'川で魚を獲り、腹を満たした',fx:'heal'},{t:'流れ着いた木箱を引き上げた',fx:'gold:10'}],
  plain:[{t:'行商の荷馬車とすれ違い、余った素材を買い取ってもらった',fx:'sellmat'},{t:'羊飼いの娘が、一行に神の名を尋ねた',fx:'belief'},{t:'風にそよぐ麦畑。誰かが口笛を吹いた',fx:'loyal'}],
  pass:[{t:'倒れた旅人を助け起こした。礼に古い地図を渡された',fx:'chart'},{t:'崖の上から、遠くの町の灯が見えた',fx:'chart'},{t:'岩陰で鉱石の層が露出していた',fx:'mat:kouseki:2'}],
  marsh:[{t:'鬼火が揺れている。誰も近づかなかった',fx:'none'},{t:'泥の中から錆びた剣が出てきた',fx:'item'},{t:'塩の結晶が白く光っていた',fx:'mat:shio:3'}],
  hill:[{t:'古戦場の跡。土の中から古い武具が出てきた',fx:'item'},{t:'見晴らしのいい岩の上で、地図を書き足した',fx:'chart'},{t:'野営の跡に、まだ温かい灰が残っていた',fx:'none'}],
};
