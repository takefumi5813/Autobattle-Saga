/* 技のデータ（2026-11-24 から部品で組み立てる形）。試作（shintaku.html）が読み込む。
   1つの技 = 名前・系統・覚え方・待ち時間・説明 ＋ 狙い（tgt）・使う場面（when）・効果の部品（fx）。
   覚え方：base（職の基本）／book（書物で覚える）／from（その技を使っていると閃く）／cls（その上級職だけが閃ける）
   tgt：one（敵1体。既定）／all（敵全体）／self（自分か味方全体。狙いがいらない）
   when：使う場面の名前（試作の WHEN 表）。書かなければ「狙える敵がいる」
   multi：連撃（アビリティ「連撃」で1.3倍） stopper：大技の振りかぶりを止める役（振りかぶりを見たら優先して使う）
   fx の部品（試作の FX 表）。数字は攻撃力に対する倍率、秒、または回復量：
     dmg{m, on:'tg'|'all'|'rand', n（randの数／tgの追加の数）, hits, crit:true|'stop'|'big', stop（止まった敵への倍率）,
         shatter（凍った敵に2倍で砕く。'discover'なら神の知識も）, burn（燃えた印）, noStun（気絶の1.5倍を使わない）,
         low{th,m}（HPがth割を切った敵にはさらにm倍）, exec（このHP割合を切った小物を仕留める）, big（大物への倍率）, selfLow{th,m}（自分のHPが低いと）}
     stun{dur,on} freeze{dur,on} unwind{on,note} gauge{mul,on}（行動ゲージを倍率に） lull{on,delay,song}
     bleed{dps,dur,on}（出血・燃焼などの継続ダメージ） weak{dur,on}（被ダメージ+25%） slow{dur,on}（行動が4割遅く）
     heal{on:'party'|'self'|'low', amt, pct, hb（回復の装備・アビリティが効く）} guard{dur} ward{dur}（全員の被ダメージ-20%）
     parry{dur} taunt{dur} thorns{dur}（受けたダメージの3割を返す） buff{k:'blessAtk'|'songT'|'hasteT'|'regenT', dur, song}
     selfgauge{add}（自分の次の行動を早める） selfhurt{pct} revive{pct} downx{add, song}
   note：技を使ったときの一言（効果が出たときだけの一言は部品の側に書く） */
const SKILL_DATA={
  // ===== 基本（職の素の攻撃。試作の actParty が直接扱う） =====
  slash:{name:'斬撃',line:'剣',base:true,desc:'剣士の基本攻撃'},
  bash:{name:'盾撃',line:'盾',base:true,desc:'重騎士の基本攻撃'},
  fire:{name:'火球',line:'魔',base:true,desc:'魔術師の基本攻撃'},
  shot:{name:'射撃',line:'弓',base:true,desc:'狩人の基本攻撃'},
  cure:{name:'治癒',line:'祈',base:true,desc:'神官の基本回復'},
  stab:{name:'短刀',line:'短',base:true,desc:'盗賊の基本攻撃。動けない敵には1.5倍'},

  // ===== 剣 =====
  parry:{name:'受け流し',line:'剣',book:true,cd:10,tgt:'self',when:'selfHurt75',desc:'4秒間、自分への被ダメージを半減',fx:[{t:'parry',dur:4}]},
  double:{name:'二段斬り',line:'剣',from:'slash',cd:6,multi:true,desc:'素早い2連撃（攻撃力×1.9）',fx:[{t:'dmg',m:1.9}]},
  tsubame:{name:'燕返し',line:'剣',from:'double',cd:10,multi:true,desc:'3連撃（攻撃力×3.2）',fx:[{t:'dmg',m:3.2,crit:true}]},
  mumyo:{name:'無明剣',line:'剣',from:'tsubame',cls:'kensei',cd:14,note:'一閃',desc:'単体に攻撃力×5。防御も気絶も関係なく斬る',fx:[{t:'dmg',m:5,crit:true,noStun:true}]},
  sutemi:{name:'捨て身',line:'剣',from:'slash',cls:'berserk',cd:7,when:'sutemiOk',desc:'攻撃力×3。自分も最大HPの1割を失う',fx:[{t:'dmg',m:3,crit:true},{t:'selfhurt',pct:.1}]},
  kiriage:{name:'斬り上げ',line:'剣',from:'slash',cd:7,desc:'攻撃力×1.6で斬り上げ、0.8秒ひるませる',fx:[{t:'dmg',m:1.6},{t:'stun',dur:.8}]},
  shitotsu:{name:'刺突',line:'剣',from:'slash',cd:6,desc:'攻撃力×1.7の突き。4秒間血を流させる',fx:[{t:'dmg',m:1.7},{t:'bleed',dps:4,dur:4}]},
  yokonagi:{name:'横薙ぎ',line:'剣',from:'double',cd:10,multi:true,when:'many2',tgt:'all',desc:'敵全体を薙ぐ（攻撃力×1.1）',fx:[{t:'dmg',m:1.1,on:'all'}]},
  kabutowari:{name:'兜割り',line:'剣',from:'kiriage',cd:11,desc:'攻撃力×2.6。5秒間、その敵が受けるダメージが増える',fx:[{t:'dmg',m:2.6},{t:'weak',dur:5}]},
  iai:{name:'居合',line:'剣',book:true,cd:12,desc:'鞘走りの一閃（攻撃力×2.8、必ず急所）',fx:[{t:'dmg',m:2.8,crit:true}]},
  kaiten:{name:'回転斬り',line:'剣',from:'yokonagi',cd:12,multi:true,when:'many2',tgt:'all',desc:'敵全体に攻撃力×1.5',fx:[{t:'dmg',m:1.5,on:'all'}]},
  kesagiri:{name:'袈裟斬り',line:'剣',from:'shitotsu',cd:9,desc:'攻撃力×2.2。深い傷で4秒間血を流させる',fx:[{t:'dmg',m:2.2},{t:'bleed',dps:6,dur:4}]},
  hayate:{name:'疾風剣',line:'剣',from:'tsubame',cd:10,desc:'攻撃力×2.4。すぐ次の構えに移る',fx:[{t:'dmg',m:2.4},{t:'selfgauge',add:.5}]},
  kenbu:{name:'剣舞',line:'剣',book:true,cd:14,multi:true,tgt:'all',desc:'舞うように3度、敵を選ばず斬る（攻撃力×1.1ずつ）',fx:[{t:'dmg',m:1.1,on:'rand',n:3}]},
  renzan:{name:'連斬',line:'剣',from:'hayate',cd:14,multi:true,desc:'4連撃（攻撃力×3.6）',fx:[{t:'dmg',m:3.6,crit:true}]},
  shinkuu:{name:'真空斬',line:'剣',from:'kaiten',cls:'kensei',cd:16,multi:true,tgt:'all',desc:'剣圧で敵全体を斬る（攻撃力×2.2、必ず急所）',fx:[{t:'dmg',m:2.2,on:'all',crit:true}]},
  gekiha:{name:'撃破',line:'剣',from:'sutemi',cls:'berserk',cd:12,desc:'攻撃力×3.6。自分のHPが半分を切っていると1.5倍',fx:[{t:'dmg',m:3.6,crit:true,selfLow:{th:.5,m:1.5}}]},

  // ===== 盾 =====
  wall:{name:'鉄壁',line:'盾',book:true,cd:16,tgt:'self',when:'guardNeed',note:'全員の守りが固まった',desc:'3秒間、全員の被ダメージを減らす',fx:[{t:'guard',dur:3}]},
  bigbash:{name:'大盾撃',line:'盾',from:'bash',cd:9,stopper:true,desc:'攻撃力×2で殴り気絶させる。振りかぶりを止める',fx:[{t:'unwind',note:'止めた'},{t:'stun',dur:1.5},{t:'dmg',m:2}]},
  furaku:{name:'不落',line:'盾',from:'bigbash',cls:'guardian',cd:20,tgt:'self',when:'furakuNeed',note:'誰も倒れさせない構え',desc:'5秒間、全員の被ダメージを大きく減らす',fx:[{t:'guard',dur:5}]},
  seijun:{name:'聖盾',line:'盾',from:'bash',cls:'paladin',cd:12,tgt:'self',when:'selfHurt80',note:'敵の注意を集め、傷が癒える',desc:'挑発しながら自分のHPを回復する',fx:[{t:'taunt',dur:6},{t:'heal',on:'self',pct:.18}]},
  uchikaeshi:{name:'打ち返し',line:'盾',from:'bash',cd:8,desc:'攻撃力×1.4で打ち返し、3秒間敵の注意を引く',fx:[{t:'dmg',m:1.4},{t:'taunt',dur:3}]},
  kamae:{name:'堅守の構え',line:'盾',book:true,cd:12,tgt:'self',when:'selfHurt90',note:'盾を構えて敵を引きつける',desc:'5秒間、自分への被ダメージを半減し、敵の注意を引く',fx:[{t:'parry',dur:5},{t:'taunt',dur:5}]},
  shinpu:{name:'震盾',line:'盾',from:'bigbash',cd:12,tgt:'all',when:'many2',note:'地面ごと揺さぶった',desc:'盾で地を打ち、敵全体を1秒ひるませる（攻撃力×0.8）',fx:[{t:'stun',dur:1,on:'all'},{t:'dmg',m:.8,on:'all'}]},
  mamori:{name:'守りの陣',line:'盾',from:'wall',cd:18,tgt:'self',when:'noWard',note:'一行が守りの陣を組んだ',desc:'6秒間、全員の被ダメージ-20%',fx:[{t:'ward',dur:6}]},
  tatenaguri:{name:'盾殴打',line:'盾',from:'uchikaeshi',cd:9,desc:'攻撃力×1.8。4秒間、その敵が受けるダメージが増える',fx:[{t:'dmg',m:1.8},{t:'weak',dur:4}]},
  hangeki:{name:'反撃の構え',line:'盾',from:'kamae',cd:14,tgt:'self',when:'selfHurt90',note:'棘のような構え',desc:'5秒間、受けたダメージの3割を相手に返す',fx:[{t:'thorns',dur:5},{t:'taunt',dur:3}]},
  iwa:{name:'岩のごとく',line:'盾',book:true,cd:20,tgt:'self',when:'selfHurt60',note:'岩のように踏みとどまる',desc:'自分の最大HPの25%を回復し、6秒間敵の注意を引く',fx:[{t:'heal',on:'self',pct:.25},{t:'taunt',dur:6}]},
  daikatsu:{name:'大喝',line:'盾',from:'shinpu',cd:14,tgt:'all',when:'many2',note:'大声が敵をすくませた',desc:'敵全体の行動ゲージを6割に戻し、4秒間注意を引く',fx:[{t:'gauge',mul:.6,on:'all'},{t:'taunt',dur:4}]},
  seiiki:{name:'聖域',line:'盾',from:'seijun',cls:'paladin',cd:22,tgt:'self',when:'partyHurt1',note:'足もとに聖域が開いた',desc:'6秒間、全員の被ダメージ-20%、少しずつ回復',fx:[{t:'ward',dur:6},{t:'buff',k:'regenT',dur:6}]},
  fudouheki:{name:'不動の壁',line:'盾',from:'mamori',cls:'guardian',cd:24,tgt:'self',when:'furakuNeed',note:'動かぬ壁となった',desc:'4秒間の鉄壁と、8秒間の守りの陣',fx:[{t:'guard',dur:4},{t:'ward',dur:8}]},

  // ===== 魔 =====
  thunder:{name:'雷撃',line:'魔',book:true,cd:7,desc:'単体に雷（攻撃力×3）',fx:[{t:'dmg',m:3,shatter:'discover',crit:'big'}]},
  blast:{name:'爆炎',line:'魔',from:'fire',cd:10,multi:true,tgt:'all',desc:'敵全体に炎（攻撃力×1.6）',fx:[{t:'dmg',m:1.6,on:'all',burn:true}]},
  tenrai:{name:'天雷',line:'魔',from:'thunder',cls:'sage',cd:14,multi:true,tgt:'all',desc:'敵全体に雷。凍った敵は砕ける',fx:[{t:'dmg',m:1.8,on:'all',shatter:true}]},
  jubaku:{name:'呪縛',line:'魔',from:'fire',cls:'warlock',cd:10,desc:'単体の行動ゲージを0に戻し、振りかぶりも解く',fx:[{t:'gauge',mul:0},{t:'unwind',note:'封じた'},{t:'dmg',m:1}]},
  hyouso:{name:'氷槍',line:'魔',from:'fire',cd:8,desc:'攻撃力×2.2の氷の槍。1.5秒凍らせる',fx:[{t:'dmg',m:2.2},{t:'freeze',dur:1.5}]},
  inazuma:{name:'稲妻',line:'魔',from:'thunder',cd:8,multi:true,tgt:'all',desc:'稲妻が3度、敵を選ばず落ちる（攻撃力×1.1ずつ）',fx:[{t:'dmg',m:1.1,on:'rand',n:3,shatter:true}]},
  kaen:{name:'火炎陣',line:'魔',book:true,cd:12,tgt:'all',when:'many2',desc:'敵全体を炎で包む（攻撃力×1.0、4秒間燃える）',fx:[{t:'dmg',m:1,on:'all',burn:true},{t:'bleed',dps:4,dur:4,on:'all'}]},
  jumon:{name:'弱体の呪文',line:'魔',book:true,cd:10,when:'tgFresh',note:'呪いがまとわりつく',desc:'6秒間、単体の受けるダメージを増やし、動きを鈍らせる',fx:[{t:'weak',dur:6},{t:'slow',dur:6}]},
  fubuki:{name:'吹雪',line:'魔',from:'hyouso',cd:14,tgt:'all',when:'many2',desc:'敵全体に攻撃力×1.0、1.2秒凍らせる',fx:[{t:'dmg',m:1,on:'all'},{t:'freeze',dur:1.2,on:'all'}]},
  meteo:{name:'隕石',line:'魔',from:'blast',cd:18,multi:true,tgt:'all',desc:'空から岩を落とす（敵全体に攻撃力×2.4）',fx:[{t:'dmg',m:2.4,on:'all',burn:true}]},
  maya:{name:'魔力の矢',line:'魔',from:'fire',cd:5,desc:'素早い魔力の矢（攻撃力×1.8）',fx:[{t:'dmg',m:1.8}]},
  dokugiri:{name:'毒霧',line:'魔',from:'kaen',cd:12,tgt:'all',when:'many2',note:'毒の霧が広がる',desc:'敵全体を5秒間、毒で蝕む',fx:[{t:'bleed',dps:5,dur:5,on:'all'}]},
  juuatsu:{name:'重圧',line:'魔',from:'jumon',cd:12,tgt:'all',when:'many2',note:'見えない重みがのしかかる',desc:'敵全体の動きを5秒間鈍らせる（攻撃力×0.6）',fx:[{t:'slow',dur:5,on:'all'},{t:'dmg',m:.6,on:'all'}]},
  kyuuin:{name:'吸魔',line:'魔',from:'maya',cd:10,desc:'攻撃力×1.6。奪った力で全員を少し癒やす',fx:[{t:'dmg',m:1.6},{t:'heal',on:'party',amt:6}]},
  raijin:{name:'雷神の槌',line:'魔',from:'inazuma',cls:'sage',cd:16,desc:'単体に攻撃力×4の雷。凍った敵は砕ける',fx:[{t:'dmg',m:4,shatter:true,crit:'big'}]},
  kyoufu:{name:'恐怖',line:'魔',from:'jubaku',cls:'warlock',cd:14,tgt:'all',when:'many2',note:'敵が恐怖にすくむ',desc:'敵全体の行動ゲージを3割に戻し、4秒間受けるダメージを増やす',fx:[{t:'gauge',mul:.3,on:'all'},{t:'weak',dur:4,on:'all'}]},

  // ===== 弓 =====
  aim:{name:'狙い撃ち',line:'弓',book:true,cd:8,desc:'単体に強射（攻撃力×2.2）',fx:[{t:'dmg',m:2.2,crit:'stop'}]},
  shadow:{name:'影縫い',line:'弓',from:'shot',cd:10,stopper:true,desc:'射撃と同時に2秒足止め。振りかぶりを止める',fx:[{t:'unwind',note:'縫い止めた'},{t:'stun',dur:2},{t:'dmg',m:1}]},
  tensen:{name:'天穿',line:'弓',from:'aim',cls:'archer',cd:12,multi:true,tgt:'all',desc:'敵全体を貫く強射（攻撃力×2）',fx:[{t:'dmg',m:2,on:'all'}]},
  oboro:{name:'朧',line:'弓',from:'shadow',cls:'shinobi',cd:12,tgt:'all',note:'敵が影に縫い止められた',desc:'敵全体を1.5秒足止めする',fx:[{t:'stun',dur:1.5,on:'all'},{t:'unwind',on:'all'}]},
  rensha:{name:'連射',line:'弓',from:'shot',cd:7,multi:true,desc:'3本続けて射る（攻撃力×2.4）',fx:[{t:'dmg',m:2.4}]},
  ashinerai:{name:'足狙い',line:'弓',from:'shot',cd:8,desc:'攻撃力×1.2。5秒間動きを鈍らせる',fx:[{t:'dmg',m:1.2},{t:'slow',dur:5}]},
  dokuya:{name:'毒矢',line:'弓',book:true,cd:9,desc:'攻撃力×1.0。5秒間毒で蝕む',fx:[{t:'dmg',m:1},{t:'bleed',dps:6,dur:5}]},
  yamikaze:{name:'闇風',line:'弓',from:'shadow',cd:12,tgt:'all',when:'many2',desc:'敵全体に攻撃力×0.9。3秒間動きを鈍らせる',fx:[{t:'dmg',m:.9,on:'all'},{t:'slow',dur:3,on:'all'}]},
  kousha:{name:'剛射',line:'弓',from:'aim',cd:10,desc:'攻撃力×2.6の強弓。大物には1.4倍',fx:[{t:'dmg',m:2.6,big:1.4,crit:'big'}]},
  senshi:{name:'千矢',line:'弓',from:'rensha',cd:14,multi:true,tgt:'all',desc:'矢の雨が5度降る（攻撃力×0.8ずつ）',fx:[{t:'dmg',m:.8,on:'rand',n:5}]},
  hiya:{name:'火矢',line:'弓',book:true,cd:10,desc:'攻撃力×1.6。4秒間燃やす',fx:[{t:'dmg',m:1.6,burn:true},{t:'bleed',dps:4,dur:4}]},
  hayabusa:{name:'隼',line:'弓',from:'ashinerai',cd:9,desc:'攻撃力×2.0。すぐ次の矢をつがえる',fx:[{t:'dmg',m:2},{t:'selfgauge',add:.5}]},
  seiten:{name:'星天の矢',line:'弓',from:'tensen',cls:'archer',cd:18,multi:true,tgt:'all',desc:'敵全体に攻撃力×2.6（必ず急所）',fx:[{t:'dmg',m:2.6,on:'all',crit:true}]},
  kagemai:{name:'影舞',line:'弓',from:'oboro',cls:'shinobi',cd:14,tgt:'all',desc:'敵全体に攻撃力×0.8、5秒間受けるダメージを増やす',fx:[{t:'dmg',m:.8,on:'all'},{t:'weak',dur:5,on:'all'}]},

  // ===== 祈 =====
  bless:{name:'祝福',line:'祈',book:true,cd:14,tgt:'self',when:'noBless',note:'全員の攻撃に力が宿る',desc:'6秒間、全員の攻撃力+25%',fx:[{t:'buff',k:'blessAtk',dur:6}]},
  wind:{name:'癒しの風',line:'祈',from:'cure',cd:12,tgt:'self',when:'partyHurt2',desc:'全員のHPを回復',fx:[{t:'heal',on:'party',amt:20,hb:true}]},
  kiseki:{name:'奇跡の祈り',line:'祈',from:'wind',cls:'bishop',cd:30,tgt:'self',when:'anyDown',note:'倒れた仲間が立ち上がる',desc:'倒れた仲間全員を、その場で立たせる',fx:[{t:'revive',pct:.4}]},
  teate:{name:'癒しの手',line:'祈',from:'cure',cd:8,tgt:'self',when:'partyHurt1',desc:'いちばん傷の深い仲間を大きく癒やす',fx:[{t:'heal',on:'low',amt:40,hb:true}]},
  kago:{name:'加護',line:'祈',book:true,cd:16,tgt:'self',when:'noWard',note:'神の加護が一行を包む',desc:'6秒間、全員の被ダメージ-20%',fx:[{t:'ward',dur:6}]},
  saisei:{name:'再生の祈り',line:'祈',from:'wind',cd:18,tgt:'self',when:'noRegen',note:'傷が少しずつ塞がっていく',desc:'8秒間、全員が少しずつ回復する',fx:[{t:'buff',k:'regenT',dur:8}]},
  jouka:{name:'浄化の光',line:'祈',from:'cure',cd:10,desc:'単体に攻撃力×2の光。全員を少し癒やす',fx:[{t:'dmg',m:2},{t:'heal',on:'party',amt:6}]},
  megumi:{name:'恵みの雨',line:'祈',from:'saisei',cd:22,tgt:'self',when:'partyHurt2',desc:'全員のHPを大きく回復',fx:[{t:'heal',on:'party',amt:30,hb:true}]},
  kourin:{name:'光輪',line:'祈',book:true,cd:12,tgt:'all',when:'many2',desc:'敵全体に攻撃力×1.0の光。3秒間動きを鈍らせる',fx:[{t:'dmg',m:1,on:'all'},{t:'slow',dur:3,on:'all'}]},
  shugo:{name:'守護の祈り',line:'祈',from:'kago',cd:18,tgt:'self',when:'guardNeed',note:'祈りが盾となる',desc:'3秒間の鉄壁と、全員の小回復',fx:[{t:'guard',dur:3},{t:'heal',on:'party',amt:10}]},
  kamioroshi:{name:'神降ろし',line:'祈',from:'jouka',cd:20,tgt:'self',when:'noBless',note:'神の力が降りてくる',desc:'6秒間、全員の攻撃力+25%・行動の速さ+20%',fx:[{t:'buff',k:'blessAtk',dur:6},{t:'buff',k:'hasteT',dur:6}]},
  tenkei:{name:'天啓',line:'祈',from:'megumi',cls:'bishop',cd:26,tgt:'self',when:'partyHurt2',note:'天の声が一行を奮い立たせる',desc:'全員を大きく癒やし、6秒間行動の速さ+20%',fx:[{t:'heal',on:'party',amt:40,hb:true},{t:'buff',k:'hasteT',dur:6}]},

  // ===== 短 =====
  kyusho:{name:'急所突き',line:'短',from:'stab',cd:8,desc:'攻撃力×2.4。凍結・気絶・足止め中の敵には、必ず急所に入る',fx:[{t:'dmg',m:2.4,stop:1.6,crit:'stop',stopNote:'急所を貫いた'}]},
  nage:{name:'投げ短刀',line:'短',book:true,cd:7,multi:true,desc:'敵2体に短刀を投げる（攻撃力×1.4ずつ）',fx:[{t:'dmg',m:1.4,n:1}]},
  kubikari:{name:'首狩り',line:'短',from:'kyusho',cls:'assassin',cd:12,when:'tgLow40',desc:'HPが4割を切った敵に攻撃力×4。大物でなければ、2割5分を切った敵をその場で仕留める',fx:[{t:'dmg',m:1.5,crit:true,exec:.25,low:{th:.4,m:2.667}}]},
  kirisaki:{name:'切り裂き',line:'短',from:'stab',cd:6,desc:'攻撃力×1.4。4秒間血を流させる',fx:[{t:'dmg',m:1.4},{t:'bleed',dps:5,dur:4}]},
  ashibarai:{name:'足払い',line:'短',from:'stab',cd:8,desc:'足を払って1.2秒転ばせる（攻撃力×0.8）',fx:[{t:'stun',dur:1.2},{t:'dmg',m:.8}]},
  dokuha:{name:'毒刃',line:'短',book:true,cd:9,desc:'攻撃力×1.2。5秒間毒で蝕む',fx:[{t:'dmg',m:1.2},{t:'bleed',dps:7,dur:5}]},
  sougeki:{name:'双撃',line:'短',from:'kirisaki',cd:8,multi:true,desc:'両手の刃で2連撃（攻撃力×2.0）',fx:[{t:'dmg',m:2}]},
  kemuri:{name:'煙玉',line:'短',book:true,cd:16,tgt:'all',when:'many2',note:'煙が立ちこめる',desc:'敵全体の動きを4秒鈍らせ、行動ゲージを7割に戻す',fx:[{t:'slow',dur:4,on:'all'},{t:'gauge',mul:.7,on:'all'}]},
  haimen:{name:'背面打ち',line:'短',from:'ashibarai',cd:10,desc:'攻撃力×2.6。動けない敵には1.5倍で必ず急所',fx:[{t:'dmg',m:2.6,stop:1.5,crit:'stop'}]},
  senpuu:{name:'旋風刃',line:'短',from:'nage',cd:12,multi:true,tgt:'all',when:'many2',desc:'敵全体に攻撃力×1.0',fx:[{t:'dmg',m:1,on:'all'}]},
  kagegiri:{name:'影斬り',line:'短',from:'kyusho',cd:12,desc:'攻撃力×3.0（必ず急所）。4秒間受けるダメージを増やす',fx:[{t:'dmg',m:3,crit:true},{t:'weak',dur:4}]},
  shinomai:{name:'死の舞',line:'短',from:'kubikari',cls:'assassin',cd:18,multi:true,tgt:'all',desc:'敵を選ばず4度斬る（攻撃力×1.2ずつ、弱った敵には2倍）',fx:[{t:'dmg',m:1.2,on:'rand',n:4,low:{th:.3,m:2}}]},

  // ===== 歌 =====
  gaika:{name:'凱歌',line:'歌',book:true,cd:16,tgt:'self',when:'noSong',note:'歌声が一行の足を速め、刃を鋭くする',desc:'8秒間、全員の攻撃+15%・行動の速さ+15%',fx:[{t:'buff',k:'songT',dur:8,song:true}]},
  komori:{name:'子守唄',line:'歌',from:'gaika',cd:14,tgt:'all',when:'komoriNeed',note:'敵の動きが鈍った',desc:'敵全体の行動ゲージを半分に戻し、大技の振りかぶりを1秒遅らせる',fx:[{t:'gauge',mul:.5,on:'all'},{t:'lull',on:'all',delay:1,song:true}]},
  chinkon:{name:'鎮魂歌',line:'歌',from:'komori',cls:'bard',cd:24,tgt:'self',when:'anyDown',desc:'倒れた仲間の救命の猶予を6秒延ばし、全員を少し癒やす',fx:[{t:'downx',add:6,song:true},{t:'heal',on:'party',amt:10}]},
  shingun:{name:'進軍歌',line:'歌',from:'gaika',cd:16,tgt:'self',when:'noHaste',note:'足並みが揃う',desc:'8秒間、全員の行動の速さ+20%',fx:[{t:'buff',k:'hasteT',dur:8,song:true}]},
  iyashiuta:{name:'癒しの歌',line:'歌',book:true,cd:16,tgt:'self',when:'noRegen',note:'やわらかな歌が傷を撫でる',desc:'8秒間、全員が少しずつ回復する',fx:[{t:'buff',k:'regenT',dur:8,song:true}]},
  yuuki:{name:'勇気の歌',line:'歌',from:'shingun',cd:18,tgt:'self',when:'noBless',note:'勇ましい歌が響く',desc:'6秒間、全員の攻撃力+25%・被ダメージ-20%',fx:[{t:'buff',k:'blessAtk',dur:6,song:true},{t:'ward',dur:6,song:true}]},
  fukyouwa:{name:'不協和音',line:'歌',from:'komori',cd:14,tgt:'all',when:'many2',note:'耳ざわりな音が敵を乱す',desc:'敵全体の行動ゲージを7割に戻し、5秒間受けるダメージを増やす',fx:[{t:'gauge',mul:.7,on:'all'},{t:'weak',dur:5,on:'all',song:true}]},
  sasayaki:{name:'囁きの歌',line:'歌',book:true,cd:14,stopper:true,desc:'単体の行動ゲージを0に戻し、振りかぶりを解く（攻撃力×0.8）',fx:[{t:'gauge',mul:0},{t:'unwind',note:'囁きで鎮めた'},{t:'dmg',m:.8}]},
  eiyuu:{name:'英雄譚',line:'歌',from:'chinkon',cls:'bard',cd:26,tgt:'self',when:'noHaste',note:'英雄の物語が一行を奮い立たせる',desc:'8秒間、全員の攻撃力+25%・行動の速さ+20%・少しずつ回復',fx:[{t:'buff',k:'hasteT',dur:8,song:true},{t:'buff',k:'blessAtk',dur:8,song:true},{t:'buff',k:'regenT',dur:8,song:true}]},
};
