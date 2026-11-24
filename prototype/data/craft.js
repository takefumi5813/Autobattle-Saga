/* 素材・お金・錬成・開発・術の合成のデータ（2026-11-24）。試作（shintaku.html）が読み込む。
   オーナーの方針：持ち帰った装備・品・素材を売らないと、やりくりできない厳しさにする。
   お金（金）の出入り：
     出ていく：旅立つたびの支度（一人あたり給金と食糧＋野営の夜ごと）、宿坊の控えの食い扶持、錬成と開発と合成
     入ってくる：倒した敵の懐、迷宮の宝箱、品と素材と書物を売る */
const ECON={
  start:120,                 // 最初の手持ち
  wage:6,                    // 一人あたりの給金（旅立つたび）
  food:4,                    // 一人あたりの食糧（旅立つたび）
  night:2,                   // 一人あたりの野営一夜ぶん
  room:3,                    // 宿坊の控え一人あたり（旅立つたび）
  unpaidLoyal:-4,            // 払えなかったとき、一行の忠誠が下がる
  killGold:[1,3],            // 敵一体あたりの懐（階の倍率がかかる）
  chestGold:6,              // 迷宮を抜けたときの宝箱（×階）
  sellTier:[0,4,10,20,40,80,160],   // 格ごとの売値（錬成1段ごとに3割増し）
  sellBook:15,
};
/* 素材：倒した敵の種類（kinds）か、迷宮の深さ（floor 以上の階の宝箱）で手に入る */
const MATERIALS={
  kegawa:{name:'狼の毛皮',price:6,kinds:['wolf']},
  kiba:{name:'獣の牙',price:8,kinds:['wolf']},
  tetsukuzu:{name:'鉄屑',price:5,kinds:['goblin','scout','bandit']},
  noroinuno:{name:'呪い布',price:10,kinds:['shaman']},
  onihone:{name:'鬼の骨',price:25,kinds:['ogre','strayogre']},
  tozokugin:{name:'盗品の銀',price:15,kinds:['bandit','boss']},
  meikyuutetsu:{name:'迷宮鉄',price:12,floor:3},
  reiboku:{name:'霊木片',price:18,floor:4},
  mashou:{name:'魔晶',price:30,floor:5},
  hoshitetsu:{name:'星鉄片',price:50,floor:6},
  gekkin:{name:'月銀',price:70,floor:7},
  ryuukotsu:{name:'竜骨片',price:90,floor:8},
  // 採集（区画に入って集める。森が多い）。gather は採れる土地の見た目
  yakusou:{name:'薬草',price:5,gather:['forest','marsh','plain']},
  kinoko:{name:'茸',price:4,gather:['forest']},
  jueki:{name:'樹液',price:7,gather:['forest']},
  kouseki:{name:'鉱石',price:6,gather:['hill','pass']},
  shio:{name:'塩',price:4,gather:['marsh']},
  kawazakana:{name:'川魚の干物',price:5,gather:['river']},
  mugi:{name:'野麦',price:3,gather:['plain']},
};
/* 錬成：+1〜+5。数値が1段ごとに8%上がり、+5で隠れた癖が一つ目覚める。金と素材を使う */
const REFINE=[null,
  {gold:20,mats:{meikyuutetsu:1}},
  {gold:40,mats:{meikyuutetsu:2}},
  {gold:80,mats:{reiboku:1,meikyuutetsu:2}},
  {gold:150,mats:{mashou:1,reiboku:1}},
  {gold:300,mats:{hoshitetsu:1,mashou:1}},
];
/* 開発：鍛冶場で型と格を選び、素材から新しい品を作る（生成した武具のうち、その型・格の固有の一品が生まれる） */
const CRAFT={
  2:{gold:30,mats:{tetsukuzu:3}},
  3:{gold:60,mats:{meikyuutetsu:3}},
  4:{gold:120,mats:{reiboku:2,mashou:1}},
  5:{gold:250,mats:{hoshitetsu:2,mashou:2}},
  6:{gold:500,mats:{ryuukotsu:2,gekkin:1,hoshitetsu:2}},
};
/* 術の合成：二つの技を体得に近いところ（実戦以上）まで使い込んだ者が、組み合わせて新しい技を生む。金と魔晶を使う */
const FUSE_COST={gold:40,mats:{mashou:1}};
