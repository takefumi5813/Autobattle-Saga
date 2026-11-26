# フィールドの草木と物の頼み方（2026-11-26）

オーナー「フィールド上の草や木もバリエーションを30倍くらい作って」「その他のオブジェクトも30倍くらい作ってバリエーションを持たせて」。
大陸ごとに4枚（木20・低い草花20・岩と地形20・人の物と小物20）＝6大陸×80＝480種。前のフィールドの絵（木5・茂み3・岩3・草2・花1）のおよそ34倍。
さらに一つずつ左右を返して色をずらす（twVariant、6通り）。
見本：`art/field/ref-c?.png`（上に町の絵＝人物の大きさ、下にその大陸の町の自然と小物＝作風。どれとも違う物を描かせる）。
背景は赤紫（#FF00FF）。エルドラ（紫が多い）だけ緑（#00FF00）。保存は `art/field/c?<T|L|R|O>.png`。切り分けは `art/cut_field.py`。

## 共通
The attached image shows sprites from my game (16-bit SNES-era JRPG pixel art, 3/4 top-down view seen slightly from above, warm earthy palette, dark outlines, soft shading; characters are about 36 px tall in the top strip). The lower part shows nature sprites I already have for this region. Draw a NEW sprite sheet in exactly the same pixel art style and the same scale: {WHAT}. Region: {REGION}. Arrange them in 4 rows of 5, every object separate with wide empty spacing (at least 60 px between objects), on a perfectly flat solid pure {KEY} background, no ground under the objects, no cast shadows on the background, no text, no labels, no grid. Crisp hard pixel edges. Every object must look clearly different from each other and from the ones in the attached image (different silhouette, size, species, color, details).

## 4枚
- T（木20）：20 different trees of this region for the wilderness: tall, medium and small ones, young and old, a few dead or broken ones, one or two leaning or with a split trunk. Trees should be tall like the trees in the attached image.
- L（低い草花20）：20 different low plants: grass tufts of different heights, ferns, wildflower patches of different colors, reeds, small bushes, thorny shrubs, mushrooms, vines on the ground. All low (about knee to waist height of a character).
- R（岩と地形20）：20 different natural terrain objects: small and large boulders, rock clusters, mossy stones, tree stumps, fallen logs, roots, termite or ant mounds, small cliffs/outcrops, puddles are NOT allowed (objects only).
- O（人の物と小物20）：20 different man-made or curious wayside objects found along roads and in the wild: signposts, milestones, waystones, small roadside shrines, statues, graves, a broken cart, barrels, crates, fences pieces, a scarecrow, an old well, ruins pillars, campfire remains, bones, a hunter's trap, banners, etc. Everything must fit the region's culture.

## 大陸
- c0 中つ国（温帯の中世。鉱山と穀倉。樫・樺・ぶな・ヒース・野の花・苔むした岩・古い石の遺跡・木の道しるべ・里程標・干し草）
  temperate medieval European countryside (mining and farming): oaks, birches, beeches, heather, wildflowers, mossy rocks, old stone ruins, wooden signposts, milestones, haystacks
- c1 北の雪国ノルデン（雪をかぶったトウヒやモミ・裸の樺・凍った茂み・雪の岩・氷の塊・ルーン石・橇・ケルン）
  snowy northern land (Norse-like): snow-covered spruces and firs, bare birches, frozen bushes, snow-capped rocks, ice chunks, runestones, sleds, cairns. Everything has snow on it.
- c2 東方の八洲（松・紅葉・桜・竹・杉・羊歯・紫陽花・苔の石・石灯籠・地蔵・小さな鳥居・祠）
  feudal Japan-like land: Japanese black pines, red maples, cherry trees, bamboo, cedars, ferns, hydrangeas, mossy stones, stone lanterns, jizo statues, small torii gates, tiny shrines
- c3 砂の大陸ザハル（椰子・アカシア・枯れ木・多肉の草・乾いた草・砂岩・白い骨・壊れた隊商の荷車・壺・オベリスク）
  desert land (Arabian/North African-like): date palms, acacias, dead trees, succulents, dry grass, sandstone rocks, bleached bones, a broken caravan cart, clay pots, small obelisks
- c4 南の密林ヴェルデ（大きな羊歯・広葉の熱帯の木・板根の大木・蔦・大きな花・苔の倒木・彫った柱・石の頭の遺跡）
  tropical jungle (Mesoamerican-like): giant ferns, broad-leaf tropical trees, buttress-root giants, hanging vines, huge flowers, mossy fallen logs, carved totem posts, stone head ruins
- c5 古き魔の大陸エルドラ（ねじれた黒い木・紫に光る茸・水晶の欠片・黒い茨・灰色の枯れ草・呪われた石・崩れたゴシックの柱・檻・墓石）
  ancient cursed land of dark magic: twisted black trees, glowing purple mushrooms, crystal shards, black thorns, dead grey grass, cursed standing stones, crumbling gothic pillars, iron cages, gravestones
