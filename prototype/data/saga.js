/* 自由な冒険と、ゆるやかな筋（2026-11-26、オーナー「ロマサガ的な自由度の高い冒険フリープレイに整理、オブリビオン的なクエストや緩やかな筋。
   基本は自由、各人の隠れた目的が徐々に出て達成される。遊ぼうと思えば長く遊べるけど、一応の筋もある。複製イベントをユニークに」）。
   三つの層：
   - 筋（SAGA_MAIN）：忘れられた神が名を取り戻すまでの章。節目（ランク・渡った大陸・信仰・深さなど）に届くと、帰ったときに章が開く。追わなくてもよい
   - 隠れた目的（GOALS）：名のある人物ごとに4段。一行にいて条件がそろうと、帰ったときに一段ずつ場面が出る。1段目はほのめかし、2段目で目的が分かり、
     3段目は場所や条件の山場、4段目で達成（報い：その人が強くなる・忠誠・信仰・品など）
   - 一度きりの出来事（UEVENTS）：大陸ごとの手書きの出来事。どれも一つの世界で一度だけ。続きのある出来事は after で前の出来事に続く
   さらに、前の「出来事の型」（events.js の EVENT_TPL）も、一つの世界で一度ずつしか起きないようにした（前は町ごと・区画ごとに同じ話が繰り返された）。
   条件（need）に書ける鍵：
     runs:n   その人と一緒に潜った回数（目的）／全体の潜行の回数（筋）
     loyal:n  その人の忠誠  faith:n その人の信仰  with:[id…] その人たちも一行にいる
     cont:'c1' 拠点がその大陸  conts:n 足を踏み入れた大陸の数  rank:'C' 冒険者ランク以上
     depth:n  大迷宮のいちばん深い階  cleared:n 踏破した迷宮の数  belief:n 町々の信仰の合計
     fame:n   使徒の名声がn以上  powers:n 取り戻した権能の数  turn:n 季節の数（4で一年）
     align:'L'|'C' 一行の気風が秩序（+20以上）／混沌（-20以下）
   fx は出来事と同じ（gold belief faith loyal loyalOne align mat item book jp jpOne rel reveal chart rivalFame divinity grace）。加えて
     boost:{hp:.1,atk:.08,spd:.05} 目的の人（または boost.id）がずっと強くなる  */
const SAGA_MAIN=[];   // data/saga_main.js が入れる
const GOALS={};       // data/saga_goals_*.js が入れる
const UEVENTS={};     // data/saga_events_*.js が入れる

function sagaInit(){if(!S.saga)S.saga={goal:{},gt:{},done:{},ch:0,ct:-1};if(!S.boost)S.boost={};return S.saga;}
const sagaConts=()=>CONTS.map(c=>c.id).filter(c=>typeof contKnown==='function'&&contKnown(c)).length;
const sagaBelief=()=>Object.values(S.belief||{}).reduce((a,v)=>a+(+v||0),0);
/* 条件がそろっているか。id は目的の人（筋なら null） */
function sagaNeed(need,id){need=need||{};const ids=partyIds();
  for(const [k,v] of Object.entries(need)){
    if(k==='runs'&&(id?cruns(id):(S.runs||0))<v)return false;
    if(k==='loyal'&&(S.loyal[id]||0)<v)return false;
    if(k==='faith'&&(S.faith&&S.faith[id]||0)<v)return false;
    if(k==='with'&&!v.every(x=>ids.includes(x)||(S.lost||[]).includes(x)||(S.gone||[]).includes(x)))return false;   // 失った者・去った者がいれば、その人なしで進む
    if(k==='cont'&&((PLACE(S.base)||{}).cont!==v))return false;
    if(k==='conts'&&sagaConts()<v)return false;
    if(k==='rank'&&rankIdx(rankOf())<rankIdx(v))return false;
    if(k==='depth'&&(S.depth||0)<v)return false;
    if(k==='cleared'&&Object.keys(S.cleared||{}).length<v)return false;
    if(k==='belief'&&sagaBelief()<v)return false;
    if(k==='fame'&&((S.rival||{}).fame||0)<v)return false;
    if(k==='powers'&&Object.keys(S.powers||{}).filter(p=>S.powers[p]).length<v)return false;
    if(k==='turn'&&(S.turn||0)<v)return false;
    if(k==='align'&&(v==='L'?S.align<20:v==='C'?S.align>-20:false))return false;}
  return true;}
/* 次に出す場面：目的の段 → 筋の章。どちらも一回の帰りに一つまで、同じ人の段は帰り一回ぶん間をあける */
function sagaPick(){const G=sagaInit();const ids=partyIds();let goal=null;
  for(const id of shuffle(ids.slice())){const g=GOALS[id];if(!g||G.done[id])continue;const st=G.goal[id]||0;const s=g.stages[st];if(!s)continue;
    if(G.gt[id]!=null&&G.gt[id]>=(S.turn||0))continue;if(sagaNeed(s.need,id)){goal={saga:'goal',id,st};break;}}
  const c=SAGA_MAIN[G.ch];const main=c&&G.ct<(S.turn||0)&&sagaNeed(c.need,null)?{saga:'main',i:G.ch}:null;
  if(!goal&&!main)return null;
  if(Math.random()<.2)return null;   // ときどきは土地の出来事に譲る（物語の場面ばかりにしない）
  return goal&&main?(Math.random()<.5?goal:main):goal||main;}
/* 一度きりの出来事：拠点の大陸（町の出来事）か、今回歩いた区画（道の出来事）に合うもの */
function uePick(walked){const seen=S.evSeen||{};const bc=(PLACE(S.base)||{}).cont;const ids=partyIds();const out=[];
  for(const [k,E] of Object.entries(UEVENTS)){if(seen['u:'+k])continue;if(E.after&&!seen['u:'+E.after])continue;
    if(E.after&&E.gap&&(S.evTurn||{})['u:'+E.after]!=null&&(S.turn||0)-(S.evTurn['u:'+E.after])<E.gap)continue;
    if(E.cond&&!E.cond(S,ids))continue;if(E.need&&!sagaNeed(E.need,null))continue;
    if(E.where==='town'){if(TOWNS[S.base]&&(E.cont==='any'||E.cont===bc))out.push({saga:'ue',k,place:S.base});}
    else{const as=walked.filter(a=>AREAS[a]&&(E.cont==='any'||AREAS[a].cont===E.cont)&&(!E.theme||AREAS[a].theme===E.theme));if(as.length)out.push({saga:'ue',k,place:pick(as)});}}
  /* 続きの出来事は先に出す */
  const fol=out.filter(o=>UEVENTS[o.k].after);return fol.length?pick(fol):out.length?pick(out):null;}
function sagaData(E){
  if(E.saga==='goal'){const g=GOALS[E.id];const s=g&&g.stages[E.st];if(!s)return null;return {title:s.title||g.title,lines:s.lines,text:s.text,opts:s.opts,kind:'goal',who:E.id};}
  if(E.saga==='main'){const c=SAGA_MAIN[E.i];return c?{title:c.title,lines:c.lines,text:c.text,opts:c.opts,kind:'main'}:null;}
  if(E.saga==='ue'){const U=UEVENTS[E.k];return U?Object.assign({kind:'ue'},U):null;}
  return null;}
/* 選んだあと：段を進め、報いを与える */
function sagaAfter(E,o){const G=sagaInit();const fx=o.fx||{};
  if(E.saga==='goal'){const g=GOALS[E.id];G.goal[E.id]=E.st+1;G.gt[E.id]=S.turn||0;
    if(fx.boost){const b=fx.boost;const id=b.id||E.id;const B0=S.boost[id]=S.boost[id]||{};for(const s of ['hp','atk','spd'])if(b[s])B0[s]=(B0[s]||0)+b[s];}
    if(E.st+1>=g.stages.length){G.done[E.id]=S.turn||0;return `${CHAR_DB[E.id].name}の目的「${g.title}」を果たした`;}
    if(E.st===1)return `${CHAR_DB[E.id].name}の目的が分かった：${g.title}（旅の記録で読める）`;return '';}
  if(E.saga==='main'){G.ch=E.i+1;G.ct=S.turn||0;return G.ch>=SAGA_MAIN.length?'筋の終わりにたどり着いた。旅はまだ続けられる':'旅の記録に、新しい章が加わった';}
  if(E.saga==='ue'){S.evTurn=S.evTurn||{};S.evTurn['u:'+E.k]=S.turn||0;}
  return '';}
/* 次の段の手がかり。段の hint が「その段への行き方」の書き方（最後の段にも hint がある）と、「次の段への行き方」の書き方の両方に合わせる */
const goalHint=(g,st)=>{const S3=g.stages[g.stages.length-1];return S3&&S3.hint?(g.stages[st]||{}).hint:(g.stages[st-1]||{}).hint;};
/* 旅の記録：筋・仲間の目的・出会った出来事 */
function sagaJournalHtml(){const G=sagaInit();let h='<div class="sj">';
  h+='<div class="sj-h">筋</div>';
  if(!G.ch)h+='<div class="sj-r"><small>まだ何も始まっていない。旅を続けよう</small></div>';
  SAGA_MAIN.slice(0,G.ch).forEach((c,i)=>{h+=`<div class="sj-r done"><b>${i+1}. ${c.title}</b><small>${c.sum||''}</small></div>`;});
  if(G.ch<SAGA_MAIN.length&&G.ch>0)h+=`<div class="sj-r"><b>${G.ch+1}. ？？？</b><small>${SAGA_MAIN[G.ch].hint||''}</small></div>`;
  h+='<div class="sj-h">仲間の目的</div>';let any=0;
  for(const [id,g] of Object.entries(GOALS)){if(!CHAR_DB[id])continue;const st=G.goal[id]||0;if(!st)continue;any=1;
    const dots=g.stages.map((_,i)=>i<st?'◆':'◇').join('');const done=G.done[id]!=null;
    h+=`<div class="sj-r ${done?'done':''}"><b>${CHAR_DB[id].name}　${st>=2?g.title:'？？？'}</b><span class="sj-d">${dots}</span><small>${done?(g.end||'果たした'):st>=2?(goalHint(g,st)||g.hint||''):(g.hint||'何か胸に秘めているようだ')}</small></div>`;}
  if(!any)h+='<div class="sj-r"><small>まだ誰の胸の内も見えない。一緒に旅を重ねると、少しずつ見えてくる</small></div>';
  const ue=Object.keys(S.evSeen||{}).filter(k=>k.startsWith('u:')).length;const tp=Object.keys(S.evSeen||{}).filter(k=>k.startsWith('g1:')).length;
  h+=`<div class="sj-h">出来事</div><div class="sj-r"><small>この世界で出会った出来事 ${ue+tp}（土地の出来事 ${ue}/${Object.keys(UEVENTS).length}）</small></div>`;
  return h+'</div>';}
