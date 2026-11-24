/* 暮らしの厳しさ（2026-11-24）。オーナーの望み「This War of Mine 的な厳しいリソース管理」「気持ちが落ちるとモチベーションが落ちる」
   「基本的に休まないと進まない。夜の進行は緊張が高まる・精神が疲弊する」。
   - 食糧（S.ration）：旅立つとき一人あたり（1＋野営の夜の数）、帰るたびに一人1つ食べる。足りないと空腹→飢え→衰弱（S.hunger 0〜3）
     野麦・川魚の干物・茸は、食糧が尽きたとき代わりに食べる
   - 傷（S.wound 0〜3：軽傷・重傷・瀕死）：旅で倒れると負う。最大HPが減る。休めば治り、薬で手当てできる。瀕死のまま放っておくと死ぬ
   - 病（S.sick）：雨や雪の中を歩く・飢え・野宿でかかる。手も足も鈍る。薬か休養で治る
   - 気持ち（S.mood 0〜100）：勝てば上がり、仲間を失う・飢える・傷つく・野宿で下がる。沈むと手が遅くなり、戦いでためらい、神託に従わなくなる。
     絶望が続くと一行を去る
   - 旅の消耗（u.strain、旅のあいだだけ）：歩くたび・戦うたび・暗い迷宮の中で溜まる。野営で少し抜ける。溜まると鈍る
   - 疲労（S.fatigue 0〜100）：旅のたびに溜まり、宿・家で少し、季節を一つ休むと大きく抜ける。疲れ切った者は旅に出ない（休まないと進めない）
   文字はできるだけ短い札で見せる。 */
const LIFE={ration0:10,meds0:1,rationPrice:2,medPrice:14,drinkPrice:3};
const EDIBLE=['mugi','kawazakana','kinoko'];
const MOOD_T=[[75,'意気軒昂'],[45,'平静'],[28,'沈みがち'],[12,'落ち込み'],[0,'絶望']];
const HUNGER_T=['','空腹','飢え','衰弱'];
const WOUND_T=['','軽傷','重傷','瀕死'];
const isTemp=id=>!!(CHAR_DB[id]&&CHAR_DB[id].temp);
const nmOf=id=>CHAR_DB[id]?CHAR_DB[id].name:id;
function lifeInit(s){s.mood=s.mood||{};s.hunger=s.hunger||{};s.wound=s.wound||{};s.sick=s.sick||{};s.fatigue=s.fatigue||{};s.dying=s.dying||{};s.badMood=s.badMood||{};
  if(s.ration==null||s.lifeV!==1){s.ration=Math.max(s.ration||0,LIFE.ration0,Object.values(s.party||{}).filter(Boolean).length*7);s.lifeV=1;}if(s.meds==null)s.meds=LIFE.meds0;}
const moodOf=id=>(S.mood&&S.mood[id]!=null)?S.mood[id]:60;
function moodTier(id){const m=moodOf(id);for(let i=0;i<MOOD_T.length;i++)if(m>=MOOD_T[i][0])return i;return 4;}
function addMood(id,v){if(isTemp(id))return;const d=CHAR_DB[id];let k=1;
  if(v<0&&d){if(d.pers==='豪胆')k=.7;if(d.pers==='敬虔'&&(S.faith[id]||0)>=70)k=.8;}
  if(v>0&&d&&d.pers==='皮肉屋')k=.75;S.mood[id]=clamp(moodOf(id)+v*k,0,100);}
const fatOf=id=>(S.fatigue&&S.fatigue[id])||0;
/* 旅に出られない：瀕死・衰弱・絶望・疲れ切っている（主人公は無理をしてでも出る） */
function cantGo(id){if(id===S.hero||isTemp(id))return '';if((S.wound[id]||0)>=3)return '瀕死';if((S.hunger[id]||0)>=3)return '衰弱';if(moodTier(id)>=4)return '絶望';if(fatOf(id)>=85)return '疲れ切っている';return '';}
/* 戦いでの強さへの掛け算 */
function lifeMul(id){let hp=1,atk=1,spd=1,sta=0;const t=moodTier(id),h=S.hunger[id]||0,w=S.wound[id]||0,sk=S.sick[id]||0,f=fatOf(id);
  spd*=[1.06,1,.92,.84,.72][t];atk*=[1.04,1,1,.93,.85][t];
  if(h>=1)sta-=20;if(h>=2){hp*=.85;atk*=.9;}if(h>=3){hp*=.82;atk*=.88;spd*=.9;}
  hp*=1-.15*w;if(w>=2)spd*=.93;if(w>=3)spd*=.9;
  if(sk){spd*=.85;atk*=.9;sta-=15;}
  if(f>=60){sta-=25;spd*=.92;}else if(f>=35)sta-=10;
  return {hp,atk,spd,sta};}
function applyLife(u){if(isTemp(u.id))return;const m=lifeMul(u.id);u.max=Math.max(1,Math.round(u.max*m.hp));u.hp=u.max;u.atk*=m.atk;u.spd*=m.spd;u.sta=clamp((u.sta??100)+m.sta,10,100);
  u.balk=[0,0,.04,.1,.18][moodTier(u.id)];u.strain=Math.round(fatOf(u.id)*.4);u.fell=0;}
/* 気持ちが沈んだ者・消耗した者は、戦いの最中にためらう */
const BALK_L=['……体が動かない','もう、嫌だ……','なんで、こんな所に','……少し、待ってくれ','（手が震えている）','……眠い。頭が回らない'];
function lifeBalk(u){const p=(u.balk||0)+((u.strain||0)>=80?.08:(u.strain||0)>=50?.03:0);if(!p||Math.random()>=p)return false;
  u.gauge=.45;popOn(u,'ためらう','miss');if(Math.random()<.35)say(u,pick(BALK_L));return true;}
const strainMul=u=>(u.strain||0)>=80?.84:(u.strain||0)>=50?.92:1;
/* 消耗を足す（夜・暗がりでは多め）。境目を越えたら一言 */
function addStrain(v,why){if(!B)return;for(const u of B.units){if(u.state==='lost'||isTemp(u.id)&&v>0&&false)continue;const a=u.strain||0;u.strain=clamp(a+v,0,100);
    if(v>0&&a<50&&u.strain>=50&&u.state==='ok')log(`${u.name}の顔に疲れが濃い${why?`（${why}）`:''}`,'miss');
    if(v>0&&a<80&&u.strain>=80&&u.state==='ok'){log(`${u.name}は気が張りつめ、限界が近い`,'warn');if(Math.random()<.5)say(u,pick(['……休ませてくれ','目を閉じると、あいつらの顔が浮かぶ','まだ着かないのか']));}}}
/* ---- 食べる ---- */
function eat(n){let got=Math.min(n,S.ration);S.ration-=got;for(const m of EDIBLE){while(got<n&&(S.mats[m]||0)>0){S.mats[m]--;got++;}}return got;}
function rationNeed(ids,nights){return ids.filter(id=>!isTemp(id)).length*(1+nights);}
const foodStock=()=>S.ration+EDIBLE.reduce((a,m)=>a+(S.mats[m]||0),0);
/* 一人あたり per を食べさせる。足りなければ、主人公以外から順に食べられない */
function feed(ids,per,notes,where){ids=ids.filter(id=>!isTemp(id));if(!ids.length)return [];const need=ids.length*per;let short=need-eat(need);
  const order=ids.slice().sort((a,b)=>(a===S.hero)-(b===S.hero));const hungry=[];for(const id of order)if(short>=per){short-=per;hungry.push(id);}
  for(const id of ids){if(hungry.includes(id)){S.hunger[id]=Math.min(3,(S.hunger[id]||0)+1);addMood(id,-6);}else S.hunger[id]=Math.max(0,(S.hunger[id]||0)-1);}
  if(hungry.length&&notes)notes.push(`${where}：食糧が足りず、${hungry.map(nmOf).join('・')}は食べられなかった（${hungry.map(id=>HUNGER_T[S.hunger[id]]).join('・')}）`);
  return hungry;}
/* ---- 旅立ち：出られない者は控えに回し、食糧を背負う ---- */
function lifeDepart(){const out=[];for(const r of ROLE_ORDER){const id=S.party[r];if(!id)continue;const why=cantGo(id);if(why){S.party[r]=null;out.push(`${nmOf(id)}（${why}）`);}}
  if(out.length)prepMsgs.push(`旅に出られない者がいる：${out.join('・')}。控えに回した`);return out;}
function lifeProvision(ids,nights){const notes=[];const hungry=feed(ids,1+nights,notes,'旅の糧');return {notes,hungry};}
/* ---- 帰り：宿・食事・傷・病・気持ち・疲労 ---- */
function lifeAfterRun(kind,notes){
  const went=B.units.filter(u=>!isTemp(u.id)&&u.state!=='lost'&&!S.lost.includes(u.id)).map(u=>u.id);
  const all=Object.keys(CHAR_DB).filter(id=>avail(id)&&!isTemp(id)&&!S.visitors.some(v=>v.id===id)&&(Object.values(S.party).includes(id)||S.met[id]));
  const rested=all.filter(id=>!went.includes(id));
  // 宿と家
  const sz=townSize(S.base);const fixed=TOWNS[S.base]&&TOWNS[S.base].fixed;const home=(S.homes||{})[S.base];
  const innP=fixed||home?0:({small:2,mid:3,large:5}[sz]||3);const rent=home&&home.type==='rent'?HOME_PRICE[sz].rent:0;const cost=innP*all.length+rent;let rough=false;
  if(cost>0&&S.gold<cost){rough=true;notes.push(rent?'家賃を払えなかった。町外れの納屋で夜露をしのいだ':'宿代が払えず、町外れの納屋で夜露をしのいだ');if(rent){S.rentDue=(S.rentDue||0)+1;if(S.rentDue>=2){delete S.homes[S.base];S.rentDue=0;notes.push('家賃の滞納が続き、借家を追い出された');}}}
  else if(cost>0){S.gold-=cost;S.rentDue=0;notes.push(`宿と家賃 −${cost}（${rent?'家賃'+rent:'一人'+innP}・${all.length}人）`);}
  // 食事
  feed(all,1,notes,'帰りの食卓');
  // 旅の傷
  const bad=(WEATHER_BAD_STEPS());
  for(const u of B.units){const id=u.id;if(isTemp(id)||!went.includes(id))continue;
    let w=(u.fell>=1?1:0)+(u.fell>=3?1:0)+(kind==='wipe'?1:0);if(!u.fell&&u.max&&u.hp/u.max<.2&&Math.random()<.4)w=1;
    if(w){const b=S.wound[id]||0;S.wound[id]=Math.min(3,b+w);notes.push(`${u.name}は${WOUND_T[S.wound[id]]}を負った`);addMood(id,-3*w);}
    // 病：雨や雪・飢え・野宿・消耗
    const p=.04+bad*.08+(S.hunger[id]||0)*.1+(rough?.12:0)+((u.strain||0)>=80?.08:0);
    if(!S.sick[id]&&Math.random()<p){S.sick[id]=1;notes.push(`${u.name}は熱を出した（病）`);}}
  for(const id of rested){const p=(S.hunger[id]||0)*.06+(rough?.06:0);if(!S.sick[id]&&Math.random()<p){S.sick[id]=1;notes.push(`${nmOf(id)}は熱を出した（病）`);}}
  // 治る・悪くなる
  for(const id of all){const w=S.wound[id]||0;
    if(w&&rested.includes(id)&&!rough){S.wound[id]=w-1;}
    else if(w===1&&!rough&&Math.random()<.4)S.wound[id]=0;
    if(S.sick[id]){if(Math.random()<(rough?.15:rested.includes(id)?.55:.3)){S.sick[id]=0;}else{S.sick[id]++;if(S.sick[id]>=4){S.sick[id]=0;S.wound[id]=Math.min(3,(S.wound[id]||0)+1);notes.push(`${nmOf(id)}の病がこじれ、体が弱った（${WOUND_T[S.wound[id]]}）`);}}}
    if((S.wound[id]||0)>=3){S.dying[id]=(S.dying[id]||0)+1;if(S.dying[id]>=2&&id!==S.hero&&Math.random()<.4){dieAtHome(id,notes);continue;}}else S.dying[id]=0;}
  // 気持ち
  const lost=B.lostNow.length;
  for(const id of all){if(!avail(id))continue;let v=0;
    if(went.includes(id)){v+={win:6,arrive:2,trip:2,retreat:-5,wipe:-14}[kind]||0;if(B.newDepth)v+=4;if(B.firstClear)v+=4;const u=B.units.find(x=>x.id===id);if(u){v-=3*(u.fell||0);v-=Math.round((u.strain||0)/12);}}
    v-=16*lost;v-=5*(S.hunger[id]||0);v-=3*(S.wound[id]||0);if(S.sick[id])v-=5;if(rough)v-=6;if(home)v+=3;
    addMood(id,v);const m=moodOf(id);S.mood[id]=m+(55-m)*(rested.includes(id)?.15:.06);
    if(moodTier(id)>=3)S.loyal[id]=clamp(S.loyal[id]-2,0,100);
    if(home)S.loyal[id]=clamp(S.loyal[id]+1,0,100);}
  // 疲労：旅に出た者は溜まり、休めば抜ける
  for(const id of all){const u=B.units.find(x=>x.id===id);let f=fatOf(id);
    if(went.includes(id))f+=22+Math.round((u&&u.strain||0)*.4);
    f-=rough?5:home?22:fixed?18:15;if(rested.includes(id))f-=25;S.fatigue[id]=clamp(f,0,100);}
  // 絶望が続くと去る
  for(const id of all){if(!avail(id)||id===S.hero)continue;if(moodTier(id)>=4){S.badMood[id]=(S.badMood[id]||0)+1;if(S.badMood[id]>=2&&Math.random()<.35){leaveParty(id);notes.push(`${nmOf(id)}は書き置きを残して去った。「もう、続けられない」`);}}else S.badMood[id]=0;}
  const sad=all.filter(id=>avail(id)&&moodTier(id)>=3);if(sad.length)notes.push(`沈んでいる者：${sad.map(id=>`${nmOf(id)}（${MOOD_T[moodTier(id)][1]}）`).join('・')}`);
  notes.push(`食糧 残り${S.ration}${foodStock()>S.ration?`（ほかに食べられる素材${foodStock()-S.ration}）`:''}・薬 ${S.meds}`);
}
function WEATHER_BAD_STEPS(){return (B.plan||[]).slice(0,B.si+1).filter(p=>p.weather==='rain'||p.weather==='snow').length;}
function leaveParty(id){for(const r of ROLE_ORDER)if(S.party[r]===id)S.party[r]=null;if(!S.gone.includes(id))S.gone.push(id);}
function dieAtHome(id,notes){S.lost.push(id);for(const r of ROLE_ORDER)if(S.party[r]===id){S.party[r]=null;S.vacated[r]=id;}
  try{makeMemento(id);}catch(e){}
  notes.push(`${nmOf(id)}の傷は膿み、手当ての甲斐なく息を引き取った`);for(const o of Object.keys(CHAR_DB))if(avail(o)&&o!==id&&!isTemp(o))addMood(o,-14);}
/* ---- 一季休む：旅に出ず、傷と疲れを癒やす。時は進む（食べ、宿代を払い、世界も動く） ---- */
function restSeason(){const notes=[];const all=Object.keys(CHAR_DB).filter(id=>avail(id)&&!isTemp(id)&&!S.visitors.some(v=>v.id===id)&&(Object.values(S.party).includes(id)||S.met[id]));
  const sz=townSize(S.base);const fixed=TOWNS[S.base]&&TOWNS[S.base].fixed;const home=(S.homes||{})[S.base];
  const innP=fixed||home?0:({small:2,mid:3,large:5}[sz]||3);const rent=home&&home.type==='rent'?HOME_PRICE[sz].rent:0;const cost=innP*all.length+rent;let rough=false;
  if(cost>0&&S.gold<cost)rough=true;else S.gold-=cost;
  feed(all,1,notes,'休みのあいだ');
  for(const id of all){if(!rough&&S.wound[id])S.wound[id]--;if(S.sick[id]&&Math.random()<(rough?.3:.7))S.sick[id]=0;
    S.fatigue[id]=clamp(fatOf(id)-(rough?20:home?60:50),0,100);addMood(id,(rough?-4:home?8:5)-5*(S.hunger[id]||0));
    if((S.wound[id]||0)<3)S.dying[id]=0;}
  S.turn=(S.turn||0)+1;for(const v of S.visitors)v.left--;S.visitors=S.visitors.filter(v=>v.left>0);
  for(const c of Object.keys(S.where||{})){if(!seekable(c)||Math.random()>.3)continue;const ts=townsIn((TOWNS[S.where[c]]||{}).cont||'c0');if(ts.length)S.where[c]=pick(ts);}
  rollNext(S);
  prepMsgs.push(`一季、${home?'家で':fixed?'神殿で':rough?'納屋で':'宿で'}体を休めた（${calTxt()}）。${rough?'宿代が払えず、ろくに休めなかった。':`宿と家賃 −${cost}。`}${notes.join('。')}`);}
/* ---- 薬・酒 ---- */
function treat(id){if(S.meds<1)return;if(S.sick[id]){S.sick[id]=0;}else if(S.wound[id]){S.wound[id]--;if(S.wound[id]<3)S.dying[id]=0;}else return;S.meds--;addMood(id,3);prepMsgs.push(`${nmOf(id)}を薬で手当てした（薬 残り${S.meds}）`);}
function brewMed(){if((S.mats.yakusou||0)<2)return;S.mats.yakusou-=2;S.meds++;prepMsgs.push(`薬草2つから薬を煎じた（薬 ${S.meds}）`);}
function drinkRound(){const ids=partyIds().filter(id=>!isTemp(id));const c=LIFE.drinkPrice*ids.length;if(S.gold<c||S.drankTurn===S.turn)return;S.gold-=c;S.drankTurn=S.turn;for(const id of ids)addMood(id,8);prepMsgs.push(`酒場で一杯ふるまった（金${c}）。皆の顔が少し明るくなった`);}
function rationPrice(k){const sz=townSize(k);const season=(S.turn||0)%4;return Math.max(1,Math.round(LIFE.rationPrice*({small:.8,mid:1,large:1.25}[sz]||1)*(season===3?1.6:season===2?.85:1)*priceMod(k)*10)/10);}
function buyRation(n){const p=Math.ceil(rationPrice(S.base)*n);if(S.gold<p)return;S.gold-=p;S.ration+=n;prepMsgs.push(`食糧を${n}つ買った（金${p}・いま${S.ration}）`);}
function buyMed(){const p=Math.round(LIFE.medPrice*priceMod(S.base));if(S.gold<p)return;S.gold-=p;S.meds++;prepMsgs.push(`薬を買った（金${p}・いま${S.meds}）`);}
/* ---- 見せ方 ---- */
function lifeChips(id){if(isTemp(id))return '';const t=moodTier(id),h=S.hunger[id]||0,w=S.wound[id]||0,f=fatOf(id);const c=[];
  c.push(`<span class="c ${t>=3?'w':t===0?'g':''}" title="気持ち ${Math.round(moodOf(id))}。沈むと手が遅くなり、戦いでためらい、神託に従わなくなる">${MOOD_T[t][1]}</span>`);
  if(h)c.push(`<span class="c w" title="食べられないと進む。飢えると体力と力が落ちる">${HUNGER_T[h]}</span>`);
  if(w)c.push(`<span class="c w" title="最大HP −${w*15}%。休むか薬で治る。瀕死のまま放っておくと死ぬ">${WOUND_T[w]}</span>`);
  if(S.sick[id])c.push(`<span class="c w" title="手も足も鈍る。薬か休養で治る">病</span>`);
  if(f>=35)c.push(`<span class="c ${f>=60?'w':''}" title="疲労 ${Math.round(f)}。旅のたびに溜まり、休むと抜ける。85を超えると旅に出ない">${f>=85?'疲れ切っている':f>=60?'疲れ':'くたびれ'}</span>`);
  const cg=cantGo(id);if(cg)c.push(`<span class="c b">旅に出られない</span>`);
  return c.join('');}
function lifeCareHtml(id){if(isTemp(id))return '';const need=(S.wound[id]||0)||S.sick[id];
  return `<div class="row2" style="margin-top:6px">${need?`<button class="btn tiny" data-treat="${id}" ${S.meds<1?'disabled':''}>薬で手当て（薬 ${S.meds}）</button>`:''}</div>`;}
function lifeDockHtml(ids,nights){const need=rationNeed(ids,nights),have=foodStock();
  return `<span title="食糧：旅立つとき一人あたり（1＋野営の夜）、帰るたびに一人1つ。野麦・干物・茸も食べられる" class="${have<need?'bad':''}">食糧 ${S.ration}${have>S.ration?`+${have-S.ration}`:''}／要る ${need}</span>・<span title="薬：傷や病の手当てに使う">薬 ${S.meds}</span>`;}
/* 一行が尽きた：最初の信徒を失い、誰も残っていない */
function journeyOver(){return S.hero&&S.lost.includes(S.hero)&&!Object.keys(CHAR_DB).some(k=>avail(k)&&!isTemp(k)&&S.met&&S.met[k]);}
function journeyOverHtml(){const h=CHAR_DB[S.hero];return `<div class="tm"><div class="sth"><small>EPILOGUE</small><b>あなたの声を聞く者は、もういない</b><span class="mini2">${h?h.name:'最初の信徒'}は帰らなかった。忘れられた小神は、また長い眠りにつく。</span></div><p style="text-align:center;margin-top:24px"><button class="go" id="newjourney"><b>新しく始める</b><small>NEW JOURNEY</small></button></p></div>`;}

/* ---- 臨時の雇われ口（2026-11-24 作り直し、オーナー「行き先とかメンバーを見て受けるかどうかを考えたほうがよい。無謀なのは容赦なくロスト」）
   酒場に、行き先・深さ・隊の顔ぶれと腕・隊長の気質・分け前・見立て（手頃・厳しい・危うい・無謀）を並べる。
   危うい・無謀な仕事では神の加護が届かず、最初の信徒も失われうる。隊長の気質で撤退の線が違う（慎重：二人倒れたら／豪胆：誰か失ったら／無鉄砲：退かない） */
const CAPT={慎重:{pol:'two',w:'慎重'},豪胆:{pol:'lost',w:'豪胆'},無鉄砲:{pol:'never',w:'無鉄砲'}};
const RISK=[['手頃',.3],['厳しい',-1.2],['危うい',-2.6],['無謀',-99]];
function hireOffers(k){const r=seeded(S.wseed+':hire2:'+k+':'+S.turn);const cont=TOWNS[k].cont;const all={};for(const a of Object.keys(AREAS))if(AREAS[a].cont===cont)all[a]=true;for(const t of Object.keys(TOWNS))if(TOWNS[t].cont===cont)all[t]=true;
  const dns=Object.keys(AREAS).filter(d=>AREAS[d].kind==='dungeon'&&!AREAS[d].sealed&&AREAS[d].cont===cont);
  const reach=dns.map(d=>[d,findPath(k,d,all)]).filter(x=>x[1]&&x[1].length).sort((a,b)=>a[1].length-b[1].length).slice(0,8);
  if(!reach.length)return [];
  const own=partyIds().filter(id=>!isTemp(id));const ownB=own.reduce((a,id)=>{const j=S.cls[id]||CHAR_DB[id].role;return a+(jobLv(id,j)||0)*.12;},0);
  const offs=[];const used={};
  {const g=dns.includes('great')&&!reach.some(x=>x[0]==='great')?findPath(k,'great',all):null;if(g&&g.length)reach.push(['great',g]);}   // 大迷宮へ挑む一行もいる
  for(let i=0;i<3;i++){const [d,path]=reach[Math.floor(r()*reach.length)];if(used[d]&&reach.length>2){i--;if(Object.keys(used).length>=reach.length)break;continue;}used[d]=1;
    const great=d==='great';const fl=great?3+Math.floor(r()*3):Math.round(lvEff(d,AREAS[d].lv||3));const eff=great?fl+3.5:fl;
    const sk=1+Math.floor(r()*5);const cap=['慎重','豪胆','無鉄砲'][Math.floor(r()*(eff>=6?3:2.4))];
    const margin=(sk-2)*.6+ownB-(eff-3)*1.3+(cap==='慎重'?.4:cap==='無鉄砲'?-.6:0);const risk=RISK.find(x=>margin>=x[1])[0];
    const pay=Math.round(6+eff*1.5+Math.max(0,eff-3)*5+sk+r()*5);
    const nm=ADV_NAMES[Math.floor(r()*ADV_NAMES.length)];
    offs.push({i,nm,d,fl,great,sk,cap,risk,pay,nights:path.filter(n=>AREAS[n]&&AREAS[n].kind!=='dungeon').length,line:HIRE_LINES[Math.floor(r()*HIRE_LINES.length)],known:!!S.known[d]});}
  return offs;}
function hireOfferHtml(k,ids){const offs=hireOffers(k);if(!offs.length)return '<p class="mini2">いまは助っ人を探している一行はいない</p>';
  const need=['tank','priest','sword','mage','hunter'].filter(r=>!S.party[r]).slice(0,Math.max(0,4-ids.length));
  const roles=need.map(r=>slotRoles(r)[0]);const capRole=roles.includes('sword')?'sword':roles[0];
  return `<div class="hcards">`+offs.map(o=>{const lv={手頃:0,厳しい:1,危うい:2,無謀:3}[o.risk];
    return `<div class="hcard r${lv}" title="隊長（${o.cap}な${ROLES[capRole]}）「${o.line}」">
      <div class="hrk">${o.risk}</div><div class="hnm">「${o.nm}」</div>
      <div class="hdst">${o.great?`大迷宮 ${floorName(o.fl)}`:AREAS[o.d].name}<small>${o.great?'':`深さ${o.fl}`}${o.known?'':'・未踏'}・野営${o.nights}夜</small></div>
      <div class="hcrew">${roles.map(r=>`<span title="${ROLES[r]}">${ico(ROLE_LINE[r])}</span>`).join('')}<b>${'★'.repeat(o.sk)}<i>${'★'.repeat(5-o.sk)}</i></b></div>
      <div class="hcap" title="隊長の気質。撤退の線が違う">${o.cap}<small>${o.cap==='慎重'?'二人倒れたら退く':o.cap==='豪胆'?'誰かを失うまで粘る':'決して退かない'}</small></div>
      ${lv>=2?'<div class="hng">神の加護は届かない</div>':''}
      <div class="hft"><span>金 <b>${o.pay}</b></span><button class="ab gold" data-hire2="${o.i}">加わる</button></div></div>`;}).join('')+`</div>`;}
function takeHire2(i){if(S.hire)return;const k=S.base;const o=hireOffers(k).find(x=>x.i===+i);if(!o)return;const ids=partyIds();
  const need=['tank','priest','sword','mage','hunter'].filter(r=>!S.party[r]).slice(0,Math.max(0,4-ids.length));const made=[];
  for(const r of need){const role=slotRoles(r)[0];const id=makeChar({temp:role,crew:o.nm});S.met[id]=true;outfit(S,id);const d=CHAR_DB[id];const m=1+.07*(o.sk-2);d.hp=Math.round(d.hp*m);d.atk=d.atk*m;S.party[r]=id;made.push(id);}
  if(!made.length)return;const cap=made.find(id=>CHAR_DB[id].role==='sword')||made[0];CHAR_DB[cap].captain=true;CHAR_DB[cap].pers=o.cap==='慎重'?'慎重':'豪胆';
  // 道は隊長が知っている：通る場所を地図に写す
  const all={};for(const a of Object.keys(AREAS))if(AREAS[a].cont===TOWNS[k].cont)all[a]=true;for(const t of Object.keys(TOWNS))if(TOWNS[t].cont===TOWNS[k].cont)all[t]=true;
  for(const n of findPath(k,o.d,all)||[])if(!S.known[n]){S.charted=S.charted||{};S.charted[n]=1;}
  S.hire={name:o.nm,pay:o.pay,ids:made,prevDive:S.diveTo,prevFloor:S.floor,pol:CAPT[o.cap].pol,risk:o.risk,noGrace:o.risk==='危うい'||o.risk==='無謀'};S.diveTo=o.d;if(o.great)S.floor=o.fl;
  prepMsgs.push(`「${o.nm}」に臨時で加わった：${made.map(id=>`${CHAR_DB[id].name}（${ROLES[CHAR_DB[id].role]}${id===cap?'・隊長':''}）`).join('・')}。行き先は${o.great?`大迷宮 ${floorName(o.fl)}`:AREAS[o.d].name}。見立ては「${o.risk}」`);}
