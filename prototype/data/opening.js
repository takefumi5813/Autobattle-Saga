/* 主人公のオープニング（2026-11-26、紙芝居）。始まりで主人公を選ぶと流れる。各5分ほど。
   絵は prototype/opening/<主人公>-<番号>.webp（ChatGPT で描き、art/opening/ に元の絵）。
   場面：i＝絵の番号、t＝文（｜で改行）、z＝寄り（'in' 寄っていく／'out' 引いていく／'l' 'r' 横へ流す／'up' 'down'）、
   at＝寄る先（絵の中の位置 0〜1）、bgm＝ここから曲を変える、card＝紙芝居のように横へ引き抜いて替える */
const OPENING={
  rio:{title:'第一の信徒　リオ',sub:'忘れられた神殿',bgm:'camp',scenes:[
    {i:1,z:'in',t:'その神殿の名を、もう誰も覚えていない。｜丘の上、霧の中。祭る者のいなくなった神殿が、ひとつ残っていた。'},
    {i:1,z:'r',t:'神の名も、祈りの言葉も、町の人々は忘れてしまった。｜忘れられた神は、少しずつ、小さくなっていった。｜――それが、あなただった。'},
    {i:2,z:'in',card:1,t:'十六年前の、雨の夜。｜神殿の石段に、布にくるまれた赤子が置かれていた。'},
    {i:2,z:'out',t:'見つけたのは、最後の神官だった老婆。｜「……ここへ来たのも、何かの縁だろうね」｜赤子は、リオと名づけられた。'},
    {i:3,z:'l',card:1,t:'老婆はリオに、古い祈りの歌を教えた。｜誰も聞く者のいない歌を。'},
    {i:3,z:'in',at:[.5,.4],t:'「神様は、聞いていらっしゃるの？」｜「聞いていらっしゃるとも。ただ、お返事がとても遅いのさ」'},
    {i:4,z:'in',card:1,t:'リオが十三の年、老婆は床についた。｜最後の夜、老婆は古い布を出してきた。リオが包まれていた布だった。'},
    {i:4,z:'r',t:'布には、見覚えのない紋が縫い取られていた。｜「これはね、大神様の神殿の紋だよ。……お前が誰であっても、ここがお前の家だ」'},
    {i:5,z:'out',card:1,t:'神殿に残ったのは、リオ一人になった。｜朝は掃き、昼は畑を耕し、夕べには祈った。'},
    {i:5,z:'l',t:'春が来て、冬が来た。参る者は一人もいなかった。｜それでもリオは、毎朝、歌を欠かさなかった。'},
    {i:6,z:'in',card:1,t:'三年目の、ある夜明け。｜いつものように歌い終えたとき――'},
    {i:6,z:'up',mv:1,t:'返事があった。｜声とも光ともつかないものが、胸の奥に届いた。｜リオには、それがあなただと分かった。'},
    {i:6,z:'in',at:[.5,.45],t:'リオ「……聞こえます。聞こえています、神様」｜涙が止まらなかった。老婆の言ったことは、本当だった。'},
    {i:7,z:'in',card:1,t:'神様がまだここにいるなら、その名を世界に思い出させなければ。｜リオは、そう決めた。'},
    {i:7,z:'out',t:'小さな荷物と、祈りの書と、あの布を持って。｜リオは初めて、神殿の扉に外から鍵をかけた。'},
    {i:8,z:'r',card:1,bgm:'road',t:'山を下りると、鉱山町ガルドの煙が見えた。｜その向こう、谷の底には、大迷宮が口を開けている。'},
    {i:8,z:'in',at:[.7,.6],t:'魔物と宝の眠る、底の見えない迷宮。｜腕に覚えのある者たちが潜り、多くは帰ってこない。'},
    {i:9,z:'l',card:1,t:'ガルドの人々は、リオの話を笑った。｜「忘れられた神様？　そりゃあ、忘れられるだけのわけがあったんだろうよ」'},
    {i:9,z:'in',at:[.78,.45],t:'リオ「笑われても、いいんです。神様の声が聞こえたんです」｜「……だから、一緒に旅をしてくれる人を探しています」'},
    {i:10,z:'out',card:1,end:1,t:'夕暮れの丘で、リオは大迷宮を見下ろした。｜あなたの声を聞いた、最初の一人として。'},
  ]},
  gareth:{title:'第一の信徒　ガレス',sub:'雪の礼拝堂',bgm:'camp',scenes:[
    {i:1,z:'in',t:'中つ国の北、ヴァレン家。｜代々王に仕えてきた、騎士の家だった。'},
    {i:1,z:'r',t:'三男のガレスは、父の背中を見て育った。｜剣の重さも、旗の誇りも、父が教えた。'},
    {i:2,z:'in',card:1,t:'ある年の戦で、父は負けた。｜王は領地を取り上げ、ヴァレンの旗は城から下ろされた。'},
    {i:2,z:'out',t:'「名さえ残れば、家はまた立つ」｜父はそう言って、二度と剣を取らなかった。'},
    {i:3,z:'l',card:1,t:'家を継いだ長兄は、家名を守るため、大神の神殿へ寄進を重ねた。｜寄進の分だけ、家は痩せていった。'},
    {i:3,z:'in',at:[.3,.5],t:'十五の春、ガレスは従士として家を出された。｜食い扶持を減らすためだと、誰もが知っていた。'},
    {i:4,z:'in',card:1,t:'十九で、初めて人を斬った。｜仲間の従士が何人も死んだ。主は言った。「名誉ある死だ」と。'},
    {i:4,z:'r',t:'ガレスには、そうは思えなかった。｜死んだ者たちの顔は、名誉の顔をしていなかった。'},
    {i:5,z:'in',card:1,t:'そして、あの日が来た。｜燃える村。止められなかった命令。'},
    {i:5,z:'out',t:'飛んできた石が、ガレスの鼻を割った。｜傷は治さずに残した。｜あの日のことは、今も誰にも話していない。'},
    {i:6,z:'l',card:1,t:'ガレスは騎士の誓いを捨て、家名を捨てた。｜紋の入った外套を川に投げ、北へ歩いた。'},
    {i:6,z:'in',t:'「名のために人を死なせる生き方からは、もう降りる」'},
    {i:7,z:'r',card:1,t:'流れ着いたのは、北の雪国ノルデン。｜凍った港で荷を担ぎ、隊商の用心棒をして食いつないだ。'},
    {i:7,z:'in',at:[.4,.55],t:'剣だけは手放せなかった。｜それが自分のただ一つの技だと、知っていたから。'},
    {i:8,z:'in',card:1,t:'ある吹雪の夜。ガレスは、凍てついた古い礼拝堂に逃げ込んだ。｜祭壇の神の名は、雪に削られて読めなかった。'},
    {i:8,z:'up',mv:1,t:'誰に祈るでもなく、膝をついたとき――｜声がした。'},
    {i:8,z:'in',at:[.7,.4],t:'「名のためではなく、人のために剣を振れ」'},
    {i:9,z:'in',card:1,bgm:'road',t:'ガレス「……騎士の誓いは捨てた。だが、あなたの声には従ってみたい」｜夜明け、ガレスは欠けた肩当てを締め直した。'},
    {i:9,z:'out',t:'守る相手を、今度は自分で選ぶ。｜そのための剣なら、もう一度振れる気がした。'},
    {i:10,z:'out',card:1,end:1,t:'雪の町を、ガレスは一人で歩き出した。｜あなたの声を聞いた、最初の一人として。'},
  ]},
  erin:{title:'第一の信徒　エリン',sub:'写本の中の声',bgm:'camp',scenes:[
    {i:1,z:'in',t:'東の学術都市。｜写字生の家に、エリンは生まれた。'},
    {i:1,z:'r',t:'母は朝から晩まで、学院の古文書を書き写していた。｜エリンは文字より先に、母の机の端で数式を覚えた。'},
    {i:2,z:'up',card:1,t:'九歳の年、エリンは魔導学院に拾われた。｜「百年に一人の才だ」と、教授たちは言った。'},
    {i:2,z:'in',at:[.5,.7],t:'母は喜んで、少しだけ寂しそうに笑った。'},
    {i:3,z:'in',card:1,t:'エリンは入学から一度も、首席を譲らなかった。｜目の下の印は、首席の徴。消せない印だった。'},
    {i:3,z:'l',t:'誰の理屈にも、穴を見つけた。｜教授たちは、だんだんエリンを煙たがった。'},
    {i:4,z:'in',card:1,t:'十七の冬。エリンは鍵を盗み、禁書庫に入った。'},
    {i:4,z:'in',at:[.47,.55],t:'埃の中に、一本の古い論文があった。｜「迷宮の魔力は、誰かが組んだ式である」――'},
    {i:5,z:'out',card:1,t:'学院はそれを否定し、論文を焼いた。｜エリンは「禁書庫への無断立ち入り」で放校になった。'},
    {i:5,z:'in',t:'だが、焼かれる前に、エリンは全部覚えていた。｜……その筆跡に、見覚えがあることも。'},
    {i:6,z:'in',card:1,t:'母は、その数年前に姿を消していた。｜学院は「病死」と知らせてきた。墓は、どこにもなかった。'},
    {i:7,z:'r',card:1,bgm:'road',t:'迷宮の式の手がかりは、東方の島々、八洲の古文書にあるはずだった。｜エリンは船に乗った。'},
    {i:7,z:'in',t:'学院を見返すため。｜……それだけだと、自分に言い聞かせながら。'},
    {i:8,z:'l',card:1,bgm:'camp',t:'八洲の古い書庫で、エリンは何十日も写本をめくり続けた。'},
    {i:8,z:'in',at:[.48,.5],mv:1,t:'ある夜、写本の一頁が、かすかに光った。｜そして――声がした。'},
    {i:8,z:'in',at:[.74,.36],t:'エリン「……今の、誰？」｜文字ではない。式でもない。誰かが、こちらに話しかけている。'},
    {i:9,z:'in',card:1,t:'神か。それとも、自分の式の誤りか。｜エリンは帳面を開いた。'},
    {i:9,z:'in',at:[.5,.65],t:'エリン「仮説：この声は神。｜検証方法：言うとおりに動いてみる」'},
    {i:10,z:'out',card:1,bgm:'road',t:'エリン「……助手が要るわね」｜鎖で綴じた魔導書を抱え、エリンは書庫の戸を開けた。'},
    {i:10,z:'r',end:1,t:'八洲の町から、エリンは一人で歩き出した。｜あなたの声を聞いた、最初の一人として。'},
  ]},
  kei:{title:'第一の信徒　ケイ',sub:'砂の港の前払い',bgm:'camp',scenes:[
    {i:1,z:'r',t:'港町セレス。潮と魚と、貧しさの匂いがする街。｜ケイは、その貧民街で育った。'},
    {i:1,z:'in',at:[.45,.6],t:'親の顔は知らない。｜覚えているのは、腹が減っていたことと、雨の冷たさだけだ。'},
    {i:2,z:'in',card:1,t:'拾ってくれたのは、路地の奥の小さな孤児院だった。｜院長は厳しくて、よく笑う人だった。'},
    {i:2,z:'in',at:[.5,.4],t:'「ケイ、あんたは目がいい」｜「その目を、いつか誰かのために使いなさい」'},
    {i:3,z:'l',card:1,t:'十五で、ケイは賞金稼ぎの見習いになった。｜手配書を読むために、文字を覚えた。'},
    {i:3,z:'in',t:'弓の腕は、すぐに師匠を追い越した。'},
    {i:4,z:'in',card:1,t:'あの年、孤児院では、葬式がひとつ出た。'},
    {i:4,z:'out',t:'最初の獲物のことを、ケイは誰にも話さない。｜賞金のためじゃなかった、とだけ言う。'},
    {i:5,z:'r',card:1,t:'二十で一人立ちした。｜稼ぎの半分は、黙って孤児院の戸口に置いてくる。'},
    {i:5,z:'in',t:'「金のためさ」と、いつも言いながら。'},
    {i:6,z:'r',card:1,bgm:'road',t:'大物の賞金首を追って、ケイは砂の大陸ザハルへ渡った。｜照りつける陽と、果てのない砂。'},
    {i:6,z:'in',at:[.7,.55],t:'獲物の足跡は、砂に埋もれた古い遺跡へ続いていた。'},
    {i:7,z:'in',card:1,t:'遺跡は、迷宮の口だった。｜ケイの目の前で、獲物は砂ごと地の底に呑まれた。'},
    {i:7,z:'out',t:'賞金は消えた。｜手配書は、ただの紙切れになった。'},
    {i:8,z:'in',card:1,bgm:'camp',t:'砂の港の安酒場。帰りの船賃もない。｜ケイは最後の一杯を、ゆっくり飲んだ。'},
    {i:8,z:'in',at:[.5,.45],t:'「……神様でも悪魔でもいい」｜「前払いしてくれるなら、誰の仕事でも受けるさ」'},
    {i:9,z:'in',card:1,mv:1,t:'そのとき、声がした。｜少なくともケイには、こう聞こえた。――報いは、約束しよう。'},
    {i:9,z:'in',at:[.42,.62],t:'杯の底で、古い銅貨が一枚、光っていた。｜いつ入ったのか、まるで覚えがない。'},
    {i:10,z:'out',card:1,bgm:'road',t:'ケイ「神様が前払いしてくれるってさ」｜「……仲間は自分で探せってことか」'},
    {i:10,z:'r',end:1,t:'夜明けの砂の港で、ケイは一人、弓の弦を張り直した。｜あなたの声を聞いた、最初の一人として。'},
  ]},
  sera:{title:'第一の信徒　セラ',sub:'密林の祈り',bgm:'camp',scenes:[
    {i:1,z:'up',t:'大神の大神殿。｜天を突く白い塔は、世界でいちばん多くの祈りが集まる場所だった。'},
    {i:1,z:'in',at:[.5,.7],t:'セラは、そこの神学校で学んだ。｜誰よりも熱心に、誰よりも正しく。'},
    {i:2,z:'in',card:1,t:'二十三で司祭になり、貧しい地区の施療院を任された。'},
    {i:2,z:'r',t:'セラの説教には、人が集まった。｜薬と、パンと、言葉を、セラは同じように分け与えた。'},
    {i:3,z:'l',card:1,t:'疫病の年が来た。｜施療院の前には、毎朝、長い列ができた。'},
    {i:3,z:'in',t:'熱にうかされた子どもたち。｜祈ることしかできない親たち。'},
    {i:4,z:'in',card:1,t:'大神殿から、命令が届いた。｜「薬は、寄進の多い地区から先に配ること」'},
    {i:4,z:'in',at:[.5,.55],t:'セラは、封蝋の紋を、長いあいだ見つめていた。'},
    {i:5,z:'r',card:1,t:'その夜、セラは命令を破った。｜施療院の薬を、列に並んだ順に配った。'},
    {i:5,z:'out',t:'救えた命があった。｜救えなかった命も、あった。'},
    {i:6,z:'up',card:1,t:'破門は、大聖堂の真ん中で言い渡された。'},
    {i:6,z:'in',at:[.2,.35],t:'一人の聖騎士が、セラを庇おうと前へ出かけて――上の者に止められた。｜セラは、その顔を忘れていない。'},
    {i:7,z:'r',card:1,bgm:'road',t:'祈る場所を失ったセラは、南へ流れた。｜誰も大神の名を知らない、密林の果てへ。'},
    {i:8,z:'in',card:1,bgm:'camp',t:'南の密林ヴェルデ。開拓村には、医者もいなかった。｜セラは持てるだけの薬を、また配った。'},
    {i:8,z:'l',t:'そして、ある夜。｜最後の薬を、最後の病人に飲ませ終えた。'},
    {i:9,z:'in',card:1,t:'空になった薬箱の前で、セラは祈った。｜答えを期待しない祈りには、もう慣れていた。'},
    {i:9,z:'up',mv:1,t:'――だが、その夜は、答えがあった。'},
    {i:9,z:'in',at:[.42,.28],t:'セラ「大神様は答えてくださらなかった」｜「あなたは、答えてくださるのですね」'},
    {i:10,z:'in',card:1,bgm:'road',t:'本当に人を救う神なのか。｜この目で、確かめたい。'},
    {i:10,z:'out',end:1,t:'密林の村から、セラは一人で旅立った。｜あなたの声を聞いた、最初の一人として。'},
  ]},
};
/* 絵の頼み方（ChatGPT に人物の一枚絵を添えて、主人公ごとに一つの会話で10枚） */
const OPENING_ART={
  style:'Hand-painted storybook illustration for a kamishibai (Japanese picture-story) card. Landscape 3:2. Painterly gouache and ink, visible brush texture, warm muted earthy palette, soft dramatic light. Fantasy world mixing Western medieval, Japanese and Chinese elements. Grounded proportions, not chibi, not photoreal. No text, no letters, no border.',
  rio:['A forgotten small stone temple on a misty hilltop at dawn, overgrown with ivy, crumbling steps, lonely and quiet, distant valley below.',
    'Rainy night. On the temple stone steps lies a baby wrapped in a cloth embroidered with a golden sun-like crest. An old hunched priestess with a lantern bends down to find it.',
    'Candle-lit temple interior. The old priestess teaches a little girl (about 6, pale blonde hair) to sing a prayer from an old book. Empty pews behind them.',
    'Night, small bedroom. The dying old priestess in bed shows an embroidered cloth with a golden crest to a 13-year-old girl kneeling at the bedside, candlelight, tears.',
    'Teenage girl priestess (Rio) alone sweeping the empty temple courtyard, falling autumn leaves; a small vegetable garden beside the temple; sense of years passing.',
    'Dawn. Rio kneels before a worn altar singing a prayer; a soft beam of golden light streams through a broken roof onto her, she looks up astonished, tears in her eyes.',
    'Morning. Rio with a small travel bag, prayer book and the folded crest cloth, locking the temple door from outside, looking back at it.',
    'Rio on a mountain path looking down at a mining town in a valley with chimney smoke; beyond it a huge dark chasm-like labyrinth entrance in the valley floor.',
    'Busy rough mining-town street with miners and a tavern; small Rio talks earnestly while burly townsfolk laugh at her.',
    'Sunset. Rio stands alone on a hill, cloak blowing, looking down toward the great labyrinth in the valley, determined.'],
  gareth:['A proud stone castle of a knight family with banners, a father knight in steel armor and a young boy (Gareth) looking up at him in the courtyard.',
    'After a lost war: soldiers lowering and removing the family banner from the castle tower, the defeated father knight sitting with his sword laid down.',
    'Inside a grand white temple of the Great God, an older brother hands a heavy pouch of gold to a priest; through the doorway the family house looks poor and bare. A 15-year-old boy leaves with a pack.',
    'A muddy battlefield, young squire Gareth (19) with a sword, fallen comrades around him, a lord on horseback in the background.',
    'A burning village at dusk seen from a distance, soldiers silhouetted; young Gareth turns as a stone thrown by a village girl strikes his face. Tragic, not gory.',
    'Gareth (27, tanned, ponytail, broken scar on nose, stubble) throws a cloak bearing a family crest into a river, then walks north toward snowy mountains.',
    'A frozen northern harbor town in snow; Gareth carries cargo crates on his shoulder, wooden ships iced in, grey sky.',
    'Blizzard night. Gareth kneels inside a small frozen ancient chapel, snow on the floor, a weathered altar with an unreadable name, a faint warm light appears.',
    'Dawn inside the chapel. Gareth fastening his chipped shoulder guard, his single-edged notched sword at his side, resolute expression.',
    'Gareth walking alone out of a snowy town onto a mountain pass at sunrise, his sword over his shoulder, wide landscape.'],
  erin:['A cozy scholarly house in an eastern academic city: a mother copying ancient manuscripts at a desk; a little girl with black-purple hair writes equations on the floor beside her.',
    'A grand magic academy hall with tall bookshelves; professors in robes look at a 9-year-old girl; her mother stands behind, smiling a little sadly.',
    'Academy classroom: teen Erin (mark under her eye, asymmetric black-purple hair with one braid) stands confidently pointing out a flaw on a chalkboard while professors frown.',
    'Night, forbidden archive library behind iron bars; teen Erin reads an old paper of labyrinth diagrams by a small lantern. Over-the-shoulder view from behind her, so the paper faces her and is upright for us too.',
    'Academy council in dark robes burning a manuscript in a brazier; Erin (17) watches, being expelled, defiant.',
    'An empty writing desk with a cold candle, scattered quills and an unfinished manuscript in a dim room; a sense of a missing mother.',
    'Erin (19, high-collared scholar coat) on a wooden ship deck crossing the sea toward eastern islands with pagodas and misty mountains.',
    'An old eastern archive in Yashima with scrolls and paper lanterns; Erin reads an open old book at night, one page glowing softly. Over-the-shoulder view from behind her, so the book faces her and is upright for us too.',
    'Erin writing in a notebook by lantern light, a chained grimoire open beside her, a thoughtful skeptical half-smile. Over-the-shoulder view from behind her, so both books face her and are upright for us too.',
    'Erin stepping out of the archive gate into an eastern town street at morning, holding the chained grimoire, wind in her coat.'],
  kei:['A poor harbor town slum by the sea, narrow alleys, laundry lines, fishing boats; a ragged small orange-haired boy with a sharp gaze sitting in the rain.',
    'A small orphanage at the end of an alley; a stern but warm older woman (the matron) laughing with several orphan children, young Kei among them.',
    'A teenage Kei (15) learning to read wanted posters on a board beside an older bounty hunter mentor, holding a bow.',
    'A small funeral in front of the orphanage on a grey day; orphans in black; teen Kei standing apart, clutching a bow, jaw set.',
    'Night: adult Kei (25, hunter) quietly leaves a pouch of coins at the orphanage door and walks away without knocking.',
    'A vast sand desert under blazing sun, a caravan of camels; Kei on foot following tracks toward half-buried ancient ruins.',
    'Ancient sand ruins collapse into a dark labyrinth pit, sand pouring down like a waterfall swallowing a fleeing outlaw; Kei watches from the edge.',
    'A cheap tavern in a desert port at night, lanterns, Kei alone at the counter with an empty cup and a crumpled wanted poster.',
    'Close view: Kei looks at the bottom of his cup where an old copper coin glints mysteriously, faint golden light.',
    'Dawn at a desert harbor with ships, Kei sitting on a crate restringing his bow, determined grin.'],
  sera:['A colossal white cathedral of the Great God with spires piercing the sky, crowds of pilgrims; a young seminarian woman in the foreground.',
    'A humble clinic in a poor district; priestess Sera (29, calm dignified) hands out bread and medicine to poor people.',
    'Plague year: a long line of sick people and parents with feverish children waiting outside the clinic at dawn.',
    'Sera reading a sealed order letter with a large red wax seal bearing the Great God crest, troubled face, candlelight.',
    'Night, Sera secretly distributing medicine bottles to the waiting line in order, breaking the order.',
    'Inside the great cathedral: Sera kneeling alone before high clergy pronouncing excommunication; a holy knight in white armor half-steps forward but is held back by another.',
    'Sera travelling south alone on a river boat into dense tropical jungle, small bag, prayer book.',
    'A pioneer village in a southern jungle, thatched huts, sick villagers on mats; Sera gives the last medicine to a patient by lamplight.',
    'Night, Sera kneels in prayer before an empty medicine chest in a hut; a soft golden light answers, she looks up in quiet awe.',
    'Morning, Sera walking alone out of the jungle village onto a misty path, villagers waving behind her.'],
};
/* 紙芝居を流す。k＝主人公、done＝終わったら（飛ばしても）呼ぶ */
function playOpening(k,done){const O=OPENING[k];if(!O){done&&done();return;}
  const pad=n=>String(n).padStart(2,'0');const imgs={};
  for(const s of O.scenes)if(!imgs[s.i]){const im=new Image();im.src=`opening/${k}-${pad(s.i)}.webp`;imgs[s.i]=im;}
  /* 山場は Gemini で動かした10秒の動画（mv:1 の場面から流し、終わったら最後の一コマのまま） */
  const vids={};for(const s of O.scenes)if(s.mv&&!vids[s.i]){const v=document.createElement('video');v.src=`opening/${k}-${pad(s.i)}.mp4`;v.preload='auto';v.playsInline=true;v.volume=.7;vids[s.i]=v;}
  const wrap=document.createElement('div');wrap.id='opening';
  wrap.style.cssText='position:fixed;inset:0;z-index:300;background:#000;cursor:pointer;user-select:none';
  const cv=document.createElement('canvas');cv.style.cssText='width:100%;height:100%;display:block';wrap.appendChild(cv);
  const skip=document.createElement('button');skip.textContent='飛ばす ▶▶';skip.type='button';
  skip.style.cssText='position:absolute;right:14px;top:12px;font:600 13px/1 sans-serif;padding:8px 12px;background:rgba(0,0,0,.45);color:#e8dcc0;border:1px solid rgba(232,220,192,.35);border-radius:2px;cursor:pointer';
  wrap.appendChild(skip);document.body.appendChild(wrap);
  const g=cv.getContext('2d');let W=0,H=0,dpr=1;
  const fit=()=>{dpr=Math.min(2,devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;};fit();addEventListener('resize',fit);
  const SC=O.scenes;const durOf=s=>Math.max(10,6.5+s.t.replace(/｜/g,'').length*.2);
  let idx=-1,t0=0,prev=null,prevT=0,ended=false,phase='title',ph0=performance.now();
  const TITLE=5,FADE=1.4,CARD=1.1,ENDT=6,CPS=14;
  /* 寄りと流し：時間 p(0〜1) で、絵のどこをどれだけ大きく見せるか */
  function cam(s,p){const e=p<0?0:p>1?1:p;const q=e*e*(3-2*e)*.6+e*.4;const at=s.at||[.5,.5];let z=1.06,x=.5,y=.5;
    switch(s.z){case'in':z=1.04+.16*q;x=.5+(at[0]-.5)*q;y=.5+(at[1]-.5)*q;break;case'out':z=1.2-.16*q;x=at[0]+(.5-at[0])*q;y=at[1]+(.5-at[1])*q;break;
      case'l':z=1.14;x=.62-.24*q;break;case'r':z=1.14;x=.38+.24*q;break;case'up':z=1.14;y=.64-.28*q;break;case'down':z=1.14;y=.36+.28*q;break;}
    return {z,x,y};}
  function drawImg(s,p,alpha,offX){const v=vids[s.i];const useV=!!(v&&v.dataset.on&&v.readyState>=2);const im=useV?v:imgs[s.i];g.save();g.globalAlpha=alpha;g.translate(offX||0,0);
    const iw=useV?v.videoWidth:im&&im.naturalWidth,ih=useV?v.videoHeight:im&&im.naturalHeight;
    if(im&&(useV||im.complete)&&iw){const c=cam(s,p);const base=Math.max(W/iw,H/ih)*c.z;const dw=iw*base,dh=ih*base;
      let dx=W/2-c.x*dw,dy=H/2-c.y*dh;dx=Math.min(0,Math.max(W-dw,dx));dy=Math.min(0,Math.max(H-dh,dy));g.drawImage(im,dx,dy,dw,dh);}
    else{const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#2a2420');gr.addColorStop(1,'#0e0c0a');g.fillStyle=gr;g.fillRect(0,0,W,H);g.fillStyle='rgba(232,220,192,.25)';g.font=`${H*.05}px serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(`（絵 ${s.i}）`,W/2,H*.42);}
    if(offX){g.fillStyle='rgba(0,0,0,.5)';g.fillRect(W,0,18,H);}   // 引き抜く紙の縁の影
    g.restore();}
  function vignette(){const r=g.createRadialGradient(W/2,H*.45,Math.min(W,H)*.35,W/2,H*.5,Math.max(W,H)*.75);r.addColorStop(0,'rgba(0,0,0,0)');r.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=r;g.fillRect(0,0,W,H);}
  function text(s,n){const lines=s.t.split('｜');const fs=Math.max(15,Math.min(W*.024,H*.042));const lh=fs*1.75;const boxH=lines.length*lh+fs*2.2;
    const gr=g.createLinearGradient(0,H-boxH-fs*2,0,H);gr.addColorStop(0,'rgba(8,6,4,0)');gr.addColorStop(.35,'rgba(8,6,4,.62)');gr.addColorStop(1,'rgba(8,6,4,.85)');g.fillStyle=gr;g.fillRect(0,H-boxH-fs*2,W,boxH+fs*2);
    g.font=`500 ${fs}px "Yu Mincho","YuMincho","Hiragino Mincho ProN","Noto Serif JP",serif`;g.textAlign='left';g.textBaseline='top';
    let left=n;const wMax=Math.max(...lines.map(l=>g.measureText(l).width));const x0=Math.max(fs,(W-wMax)/2);
    lines.forEach((l,i)=>{const sh=left>=l.length?l:l.slice(0,Math.max(0,left));left-=l.length;const y=H-boxH+fs*.9+i*lh;
      g.fillStyle='rgba(0,0,0,.7)';g.fillText(sh,x0+1.5,y+1.5);g.fillStyle='#efe4cc';g.fillText(sh,x0,y);});}
  function titleCard(a,main,sub){g.fillStyle='#000';g.fillRect(0,0,W,H);g.globalAlpha=a;g.textAlign='center';g.textBaseline='middle';
    const fs=Math.max(20,Math.min(W*.04,H*.07));g.fillStyle='#c9a85a';g.font=`600 ${fs*.42}px "Yu Mincho",serif`;g.fillText(sub,W/2,H/2-fs*1.1);
    g.fillStyle='#efe4cc';g.font=`600 ${fs}px "Yu Mincho","Hiragino Mincho ProN",serif`;g.fillText(main,W/2,H/2+fs*.1);
    g.fillStyle='rgba(201,168,90,.7)';g.fillRect(W/2-fs*2.5,H/2+fs*.85,fs*5,1);g.globalAlpha=1;}
  function go(n){if(n>=SC.length){phase='end';ph0=performance.now();return;}
    if(idx>=0){prev=SC[idx];prevT=(performance.now()-t0)/1000;}idx=n;t0=performance.now();
    const s=SC[idx];if(s.bgm&&typeof bgmScene==='function')bgmScene(s.bgm);
    if(s.mv&&vids[s.i]){const v=vids[s.i];v.dataset.on=1;v.currentTime=0;v.play().catch(()=>{v.muted=true;v.play().catch(()=>{});});}}
  const key=e=>{if(e.key==='Escape'){e.preventDefault();finish();}else if(e.key===' '||e.key==='Enter'){e.preventDefault();next();}};
  function finish(){if(ended)return;ended=true;for(const v of Object.values(vids)){v.pause();v.removeAttribute('src');v.load();}removeEventListener('resize',fit);removeEventListener('keydown',key,true);wrap.remove();done&&done();}
  /* 押すと：字の途中なら全部出す、出ていれば次へ */
  function next(){if(phase==='title'){phase='play';go(0);return;}if(phase==='end'){finish();return;}
    const s=SC[idx];const el=(performance.now()-t0)/1000;const total=s.t.replace(/｜/g,'').length;
    if(Math.floor((el-.6)*CPS)<total){t0=performance.now()-(total/CPS+.7)*1000;return;}
    if(s.end){phase='end';ph0=performance.now();return;}go(idx+1);}
  addEventListener('keydown',key,true);wrap.onclick=e=>{if(e.target===skip)return;next();};skip.onclick=e=>{e.stopPropagation();finish();};
  if(typeof bgmScene==='function')bgmScene(O.bgm||'camp');
  function frame(){if(ended)return;g.setTransform(dpr,0,0,dpr,0,0);const now=performance.now();
    if(phase==='title'){const e=(now-ph0)/1000;const a=Math.min(1,e/1.2,Math.max(0,(TITLE-e)/1));titleCard(a,O.title,O.sub);if(e>TITLE){phase='play';go(0);}}
    else if(phase==='play'){const s=SC[idx];const el=(now-t0)/1000;const d=durOf(s);
      if(prev&&el<(s.card?CARD:FADE)){const pd=durOf(prev);
        if(s.card){drawImg(s,el/d,1);const q=el/CARD;const e2=q*q*(3-2*q);drawImg(prev,(prevT+el)/pd,1,-e2*(W+24));}
        else{drawImg(prev,(prevT+el)/pd,1);drawImg(s,el/d,Math.min(1,el/FADE));}}
      else drawImg(s,el/d,1);
      vignette();const n=Math.floor((el-.6)*CPS);if(n>0)text(s,n);
      g.fillStyle='rgba(232,220,192,.35)';g.fillRect(0,H-3,W*((idx+Math.min(1,el/d))/SC.length),3);
      if(el>d){if(s.end){phase='end';ph0=now;}else go(idx+1);}}
    else{const e=(now-ph0)/1000;const s=SC[idx];drawImg(s,1,1);vignette();g.fillStyle=`rgba(0,0,0,${Math.min(1,e/1.5)})`;g.fillRect(0,0,W,H);
      if(e>1.2){const a=Math.min(1,(e-1.2)/1.2,Math.max(0,(ENDT-e)/.8));g.globalAlpha=a;g.textAlign='center';g.textBaseline='middle';const fs=Math.max(22,Math.min(W*.05,H*.085));
        g.fillStyle='#efe4cc';g.font=`600 ${fs}px "Yu Mincho","Hiragino Mincho ProN",serif`;g.fillText('神託の迷宮',W/2,H/2);g.fillStyle='#c9a85a';g.font=`500 ${fs*.34}px "Yu Mincho",serif`;g.fillText(O.title,W/2,H/2+fs*1.1);g.globalAlpha=1;}
      if(e>ENDT){finish();return;}}
    requestAnimationFrame(frame);}
  requestAnimationFrame(frame);}
