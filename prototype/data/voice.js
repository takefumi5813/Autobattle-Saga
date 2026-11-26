/* ============ 神の声を聞く（2026-11-26） ============
   オーナー「仲間になる者は、神の声を聞いた者であるということにしましょう。どう声を聞くかのシステムを考える」
   名のある人物には「声の届き」がある（S.heard[c]：0〜3）。3（聞いた）になった者だけが仲間になれる。
     0 まだ何も      … ふつうの住人と変わらない
     1 かすかに      … 「誰かに呼ばれた気がする」。頭の上に小さな光の粒が見える
     2 夢に見る      … 夢で声を聞いた。光の粒がはっきりする
     3 聞いた        … あなたの神の声だと分かった。誘えば仲間になる（ランク・気風の条件はこれまでどおり）
   声の届き方（三つ）
     ① 町の信仰：その人のいる町の信仰が厚いほど、季節が変わるたびに声が少しずつ届く（自然には2まで。最後の一歩は誰かが要る）
        布教したばかりの町ではよく届く
     ② 信徒が伝える：最初の信徒（主人公）が一行にいて、その人と話すと、声を伝える（季節に一度、1上がる。まだ0なら届かない）
     ③ 夢枕に立つ：名を知った相手（一度話した人）に、神の余力1を使って直接語りかける（1上がる。町の信仰が40以上なら2）
   一行の仲間・訪ねてくる者（来訪）・町の信者・後継者は、もう声を聞いた者として扱う（後継者は親から聞いて育った） */
const VOICE_LV=['まだ何も聞いていない','かすかに声を感じる','夢で声を聞いた','神の声を聞いた'];
const VOICE_SAY=[
  null,
  ['……近ごろ、誰かに呼ばれている気がするんだ。気のせいだろうけど','風の音が、言葉に聞こえることがある'],
  ['ゆうべ、夢を見た。知らない神が、何か言っていた','あの夢の声……どこかで聞いたことがある気がする'],
  ['あの声……あなたたちの神だったのか','夢の中の声と、同じ響きだ。……分かった、聞こう'],
];
function heardOf(c){if(!S.heard)S.heard={};if(c===S.hero||S.met[c]||partyIds().includes(c))return 3;return S.heard[c]||0;}
function addHeard(c,n,why){if(!S.heard)S.heard={};const b=heardOf(c);const a=Math.min(3,b+n);if(a<=b)return '';S.heard[c]=a;
  return `${CHAR_DB[c]?CHAR_DB[c].name:'その人'}：${VOICE_LV[a]}${why?`（${why}）`:''}`;}
/* ① 季節が変わるたび：町の信仰で、自然に2まで届く */
function voiceSeason(notes){if(!S.where)return;
  for(const c of Object.keys(S.where)){if(typeof seekable==='function'&&!seekable(c))continue;const t=S.where[c];const b=(S.belief||{})[t]||0;const h=heardOf(c);if(h>=2)continue;
    const preached=S.preachedTurn&&S.preachedTurn[t]===S.turn;const p=Math.min(.7,b/120+(preached?.25:0));
    if(Math.random()<p){const m=addHeard(c,1,`${TOWNS[t]?TOWNS[t].name:''}の信仰`);if(m&&notes&&S.seek&&S.seek[c])notes.push(m);}}}
/* ② 信徒が伝える：話しかけたときに呼ぶ。返すのは添える一言 */
function voiceRelay(c){S.relayTurn=S.relayTurn||{};const h=heardOf(c);if(h>=3||h<1)return '';if(S.relayTurn[c]===S.turn)return '';
  if(!partyIds().includes(S.hero))return '';S.relayTurn[c]=S.turn;const m=addHeard(c,1,`${CHAR_DB[S.hero].name}が声を伝えた`);return m;}
/* ③ 夢枕に立つ */
function voiceDream(c){if(S.grace<1||heardOf(c)>=3)return '';S.grace--;const t=(S.where||{})[c];const n=((S.belief||{})[t]||0)>=40?2:1;return addHeard(c,n,'夢枕に立った');}
/* 誘えるか：聞いていなければ断られる（言葉は届きの段階で変わる） */
function voiceRefuse(c){const h=heardOf(c);if(h>=3)return null;
  return ['……神？　悪いが、私には何も聞こえない。聞こえない声には従えない','呼ばれている気はする。でも、まだ誰の声か分からない','夢の声……あれがあなたの神なのか？　もう少し、確かめさせてくれ'][h];}
function voiceLine(c){const h=heardOf(c);const L=VOICE_SAY[h];return L?L[(S.turn||0)%L.length]:'';}

/* ============ 一度仲間にした人物は、次から最初の一人として選べる（2026-11-26、オーナー） ============
   ブラウザに別に覚えておく（'shintaku-unlocked'。セーブをやり直しても残る）。
   選んだ人物の始まりの町は、その人の出身の大陸の町。オープニング（紙芝居）がまだない人は、すぐ町から始まる */
const UNLOCK_KEY='shintaku-unlocked';
function unlockedChars(){try{return JSON.parse(localStorage.getItem(UNLOCK_KEY))||[];}catch(e){return [];}}
function unlockChar(id){const d=CHAR_DB[id];if(!d||d.temp||d.town||d.parent||d.alt||!(typeof CHAR_CONT!=='undefined'&&CHAR_CONT[id]))return;const u=unlockedChars();if(u.includes(id))return;u.push(id);try{localStorage.setItem(UNLOCK_KEY,JSON.stringify(u));}catch(e){}}
function startOf(id){if(START[id])return START[id];const d=CHAR_DB[id];if(!d)return null;const cont=CHAR_CONT[id]||'c0';
  START[id]={name:d.name,hero:id,cont,base:cont==='c0'?'garde':undefined,align:alignOf(id),party:{},bench:[],extra:true,
    blurb:d.bio||'',intro:`${d.name}「……聞こえる。あなたの声だ」${d.name}は一人で歩き出した。`,note:'一度、仲間にした人物'};return START[id];}
