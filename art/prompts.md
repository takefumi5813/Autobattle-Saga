# ドット絵の方向決め（叩き台）

2026-11-24。Canva の画像生成で作成。プロンプトはオーナーの許可を得て Claude が書いた。比較ボードは `direction-drafts.png`（Canva のデザイン「神託の迷宮　ドット絵の方向（叩き台）」を書き出したもの）。

3案とも同じ場面：B3Fの回廊でオーガが棍棒を振りかぶり、右側にパーティ5人。キャラの色分けはモック（`mock/ff6mock.html`）に合わせた。

- ガレス：茶髪・銀の鎧・赤いマント・長剣
- ボルグ：赤毛・大きな木の盾
- エリン：薄紫の髪・青いローブ・杖
- ミラ：緑のフード付きの装束・弓
- リオ：淡い金髪・白い法衣・聖印

## 共通部分（場面）

> Side-view RPG battle scene in a (…) stone dungeon corridor. On the right side, a party of five adventurers stands in a loose formation facing left: a swordsman with short brown hair, silver armor and a red cape holding a longsword; a burly heavy knight with red hair and a large wooden tower shield; a young mage with lavender hair in a deep blue robe holding a staff; a hunter in green hooded clothes holding a bow; a young priest with pale blonde hair in a white robe holding a small holy symbol. On the left side, a huge ogre raises a wooden club high over its head, about to swing, flanked by two small goblins. (作風) No text, no interface, no letters, no numbers.

## 作風の部分

- **A 王道**：authentic late-era 16-bit home console pixel art. Crisp hard-edged pixels with no anti-aliasing, limited palette, light dithering, clean dark outlines, small character sprites about 32 pixels tall as on a 256x224 screen scaled up with nearest-neighbor. Bright, saturated colors and warm torchlight.
- **B 薄暮**：moody, melancholic 16-bit pixel art. Muted, desaturated palette of cool greys and deep blues with dim amber torchlight, heavy shadows, about 32 colors in total. Crisp hard-edged pixels (…). The feeling of a world where the old gods are forgotten.
- **C 絵本**：warm storybook pixel art. Soft warm palette with gentle contrast, cute chibi proportions about two and a half heads tall, rounded shapes, cozy glow from the torches. Crisp hard-edged pixels (…).

縦横比はすべて 4:3。

## 決定：B（薄暮）を見やすく・親しみやすく

オーナーの判断は「Bだが、少し見やすく。もう少し親しみの持てる感じに」。Bの画像を下敷き（画像参照）にして2段階で調整した。

- **B+1 控えめ**：Keep this scene, composition and its moody, muted 16-bit pixel art style, but make it a little easier to read and a little more approachable. Let the warm amber torchlight fall on the five adventurers (…) with a soft warm rim light, (5人の色分け) Give their faces slightly softer, friendlier expressions. Keep the ogre and goblins on the left in shadow, keep the cool grey and blue palette in the background and the melancholic atmosphere.
- **B+2 もう一歩**：B+1に加え、Make the characters slightly larger with slightly bigger heads, about three and a half heads tall (…) Lift the shadows of the background a little (…)

オーナーの最終判断は「基本はB+1、明るさはB+2」。B+1を下敷きにして、明るさだけを変えた。

- **決定案**：Keep this exact scene, composition, character sizes and proportions, and its moody, muted 16-bit pixel art style. Only change the lighting: lift the shadows of the background so the stone corridor, the arches and the floor are clearly visible, about as bright as a dim torch-lit hall rather than near darkness, while keeping the cool grey and blue palette and the melancholic, forgotten-gods atmosphere. Keep the warm amber torchlight and the soft warm rim light on the five adventurers (…)

比較ボードは `direction-final.png`。

### 決まった作風（以後の絵の基準）

- 背景はくすんだ灰と紺。暗いが、石壁・アーチ・床がはっきり見える明るさ
- 灯りは暖かい琥珀色。キャラには暖色の縁取り光を当てて、背景から浮かせる
- キャラは頭身を下げすぎない（B+1の体つき）。表情はやわらかく
- 敵は影寄りだが、形は読める
- 硬い画素、アンチエイリアスなし

## 立ち絵の見本（叩き台）

決定案（`direction-final.png` の右の画像）を参照画像にして2枚作った。並べたボードは `characters-draft.png`。

- **一行の立ち絵**（16:9）：Character lineup in the same pixel art style, palette and lighting as the reference image: six adventurers standing side by side in full body, three-quarter view facing slightly left, relaxed idle poses (…) on a plain dark slate-blue background with a faint warm rim light (…) 左から：剣士（27・茶髪・銀の鎧に赤いマント・長剣）、重騎士（34・赤毛と無精ひげ・へこんだ鋼の鎧・木の大盾・ぶっきらぼうだが温かい笑み）、魔術師（19・薄紫の髪・金縁の深い青のローブ・青い水晶の杖）、狩人（22・緑のフード付き外套・長弓）、神官（16・淡い金髪・金の刺繍の白い法衣・聖印）、盗賊（20歳の娘・短い焦げ茶の髪・深い青緑のスカーフ・革のベスト・短剣二本）
- **ガレスの動き**（16:9）：Game sprite sheet (…) top row shows him standing still facing front, facing left, facing right, and facing away; bottom row shows four frames of a walking cycle seen from the side facing left (…)

ラズ（盗賊）の見た目は、このとき新しく決めた（短い焦げ茶の髪・深い青緑のスカーフ・革のベスト・短剣二本）。

### 仕上がりの所見

- 6人とも描き分けがはっきりしていて、作風も決定案とそろっている
- エリンのローブが、指定の青より紫寄りになった
- ミラはフードで髪が隠れている（モックでは緑の髪）
- ガレスの向き違い（正面・左・右・後ろ）は使える見本になった。ただし歩きの4コマはほとんど同じ絵で、足がほぼ動いていない。AIの画像生成では歩きの動きは作れないので、歩きはドットに起こす段階で打つ

## ゲーム用のドット（モックに組み込み済み）

最初は 16×24 画素で1画素ずつ手打ちしたが、オーナーから「立ち絵の見本と比べてチープすぎる。もともと作った絵を直して使ってほしい」と指摘があり、やめた。いまは**立ち絵の見本そのものを切り抜いて縮めた絵**を使っている。

- 元の絵：`characters-draft.png` の上半分（一行6人の立ち絵）
- 作り方：`cut_sprites.py`（Python・Pillow）。使い方 `python -I art/cut_sprites.py art/characters-draft.png art/sprites 48`
  1. 背景（暗い青灰）を、絵の縁からつながっている部分だけ消す（人物の中の暗い色は残す）
  2. 6人を横の範囲で切り分ける（ガレスのマントとボルグの盾がつながったときは、確かめ済みの範囲を使う）
  3. 全員に同じ縮小率をかけて、いちばん背の高いボルグが48画素になるように縮める（背丈の差が残る）
  4. 縮める前に鮮やかさ×1.08・メリハリ×1.2。縮めたあと32色に絞り、透明度は二値。12画素未満の離れた点は消す
  5. 外側に1画素の濃紺の輪郭（#141826）
- 出力：`sprites/<id>.png`、確認用の一覧 `sprites/_sheet.png`、モックに埋め込むデータ `sprites/sprites.js`
- モックへの入れ方：`sprites.js` の中身を `ff6mock.html` の `HERO_IMG` に貼る。読み込みは `loadHeroes()`。絵が大きくなったので、立ち位置は絵の大きさから計算し、隊形と歩くときの列の間隔を広げた
- 動き：AIの絵からはコマ送りが作れないので、**絵を部位ごとに動かす切り絵アニメ**にした（`heroFrames()`）。新しい絵は描いていないので、見本の質はそのまま
  - 絵を腰（上から64%）で上半身と足に分け、足は左右に分ける（境目は足先の画素の平均位置）
  - 歩き4コマ：後ろ足を5画素持ち上げて前へ運ぶ → そろう → 前足を持ち上げて運ぶ → そろう。上半身は1画素前へ傾け、そろうコマで体を1画素上げる
  - 構え2コマ：戦闘中に止まっているあいだ、肩を1画素沈めて息をしているように見せる
  - 攻撃：踏み込むあいだ、上半身を5画素前へ傾ける
  - 被弾：上半身を3画素後ろへのけぞらせ、2画素下がる。最初の0.15秒は白く点滅
  - 左右の足をずらすとすき間が開くので、後ろ足は4画素広く取って前足の下に敷いている
  - 腕や武器の動き・倒れる姿は、下の「ポーズ違い」の絵で補う

## ポーズ違い（攻撃・倒れ）

立ち絵の一行（`characters-draft.png` の元画像）を参照画像にして、同じ並び順・同じ作風で2枚生成した。元の大きさの画像は `poses-attack.png` と `poses-down.png`。

- **攻撃のポーズ**（16:9）：Same six characters, same pixel art style, palette, lighting and proportions as the reference lineup, in the same left-to-right order, but each now in a dynamic attack pose, all facing left, full body, spaced far apart so no two figures overlap, on the same plain dark slate-blue background (…) 剣士：両手で剣を頭上に振りかぶる／重騎士：大盾を前に突き出して踏み込む／魔術師：水晶の杖を前上方へ突き出して詠唱／狩人：弓を引き絞る／神官：聖印を両手で頭上に掲げて祈る／盗賊：低く構えて短剣で斬りつける
- **倒れた姿**（16:9）：(…) each now knocked down and fallen in battle: lying on the ground on their side, head toward the left, eyes closed, weapons dropped beside them (…) No blood (…)

指示では全員左向きにしたが、ガレスとリオは右向きで描かれた。倒れた姿は3人ずつ2段に並んだ。

切り抜きは `cut_poses.py`（使い方 `python -I art/cut_poses.py art`）。立ち絵と同じ手順に加えて：
- 人物ごとの区画は長方形の組み合わせで指定する（エリンの杖の先がボルグの頭の高さまで伸びているため）
- 弓と弦のあいだのように、人物に囲まれた背景のかたまりも消す
- 縮尺は立ち絵にそろえる（攻撃：まっすぐ立つリオの背丈を立ち絵のリオに合わせる／倒れ：ガレスの頭から足までを立ち絵のガレスの背丈くらいに）
- ゲームでは右向きにそろえる（左向きで描かれた人だけ反転）。立ち位置は足もとの中心で合わせる
- 色数は48色（32色ではエリンの薄紫の髪が肌の色とまとまった）

モックでの使い方：攻撃のポーズは、敵へ踏み込むあいだと、技を使った直後0.6秒（凍結の霧・貫通矢・治癒・雷撃）に出す。倒れた姿は、オーガの薙ぎ払いでミラが倒れ、リオの救命で立ち上がる場面で見せている。

## 勝利のポーズ

立ち絵を参照にして2枚生成した（前の6人：`poses-win.png`、アルド・ケイ・セラ：`extra-win.png`）。

- ガレス：長剣を片手で高く掲げ、誇らしげに笑う／ボルグ：大盾を地面に立て、拳を突き上げて笑う／エリン：腰に手を当て、杖を肩にのせて得意げ／ミラ：弓を下ろし、小さくうなずいて微笑む（生成では親指を立てた）／リオ：聖印を胸に抱き、目を閉じて感謝の笑み／ラズ：短剣を投げ上げて受け止める、いたずらっぽい笑み
- アルド：戦斧を肩にかつぎ、疲れたが満足げな笑み／ケイ：片手でコインを弾き、にやりと笑う／セラ：銀の聖印を顔の前に掲げ、静かに安堵の笑み

切り抜きは `cut_win.py`（使い方 `python -I art/cut_win.py art`）。ほぼ正面向きなので反転しない。縮尺は、まっすぐ立っている人（6人の絵はリオ、3人の絵はケイ）の背丈を立ち絵にそろえて決める。モックでは、戦闘に勝った直後の1.8秒、勝利のポーズを見せる（`POSE_IMG[id].win`）。

## 残りの3人（アルド・ケイ・セラ）

前の6人と同じ手順。まず立ち絵を、一行の立ち絵（`characters-draft.png` の元画像）を参照にして生成し（`extra-stand.png`）、攻撃と倒れはその立ち絵を参照にして生成した（`extra-attack.png`・`extra-down.png`）。見た目はモックの描き分けと設定に合わせた。性別は設定に書かれていないので指定していない。

- アルド：31歳の元傭兵団副長。短い黒髪、傷のある顔、暗い深紅の革と板金の鎧（真鍮の金具）、重い戦斧
- ケイ：25歳の元賞金稼ぎ。くせのある橙色の髪、赤い差し色の暗い灰色のフード付き革外套、長弓と矢筒、皮肉な笑み
- セラ：29歳の破門された元司祭。肩までの濃い紫の髪、色あせた紫の縁取りの淡い白藤色の法衣、小さな銀の聖印

切り抜きは `cut_extra.py`（使い方 `python -I art/cut_extra.py art`）。3人のあいだのいちばん広い2つのすき間で分ける。縮尺は、立ち絵はアルドを48画素（ガレスと同じ）、攻撃はケイを立ち絵のケイの背丈に、倒れはアルドの長さを56画素にそろえる。立ち絵ではケイとセラが右向きに描かれたので反転して左向きに、攻撃ではアルドとケイを反転して右向きにそろえた。モックでは `HERO_IMG` / `POSE_IMG` に足すだけで、ほかの6人と同じ扱いになる。

## 背景（モックに組み込み済み）

冒険画面の地図は、生成した素材で組み立てている（`buildAdvMap()`）。決定案（`direction-final.png` の右の画像）を参照画像にして3枚生成した。

- **物の一覧**（`bg-objects.png`・16:9）：Environment sprite sheet for a 16-bit RPG field map seen from a three-quarter top-down view, in the same moody, muted dusk pixel art style and palette as the reference image (…) three large round leafy deciduous trees, two tall dark conifer trees, three low bushes, three grey boulders, one stone lantern with a small warm flame, two clumps of tall grass, one small patch of pale wildflowers, one short wooden fence segment, one wooden signpost (…) Plain flat light grey background (…)
- **草地**（`bg-grass.png`・1:1）：Seamless tileable ground texture (…) short meadow grass at dusk (…)
- **土の道**（`bg-dirt.png`・1:1）：Seamless tileable ground texture (…) packed dirt road with small pebbles and faint wheel ruts (…)

切り抜きは `cut_bg.py`（使い方 `python -I art/cut_bg.py art`）。明るい灰色の背景からかたまりごとに切り出し、上・中・下の段と左右の位置で名前をつける。木は80画素、灯籠は44画素（人物より少し低く）。地面の模様は160画素四方・12色に縮める（モックに埋め込むデータを小さくするため）。土の道は轍が横に流れるよう90度回す。

組み立て方：
- 草の模様を、上下左右に反転した4枚組で敷き詰める（継ぎ目を目立たせない）
- くねる道の帯に土の模様を写す。土は草より明るくして道筋を読めるようにし、草との境を暗くする
- 道より奥（上）には高い木、手前（下）には低木・岩・草むら・花だけを置く（高い木を手前に置くと人物にかぶるため）。いちばん手前の木は根元を画面の外に置き、梢だけが下から見える
- 旅立ちの場所に柵と道しるべ、森の入口の両側に針葉樹
- 最後に全体を薄暮の色調へ塗り替え（`gradeCanvas()`）、道ぎわに灯籠を5つ置いて足もとと火袋を照らす（`glow()`）
- 川と橋は前の絵のまま、色だけ暗い紺に落とした

## 大きさの見直し（2026-11-24）

オーナーから「風景に比べてキャラが大きすぎる。道幅がキャラ一人分というのはおかしい」と指摘があり、人物と敵をすべて4分の3の大きさで切り抜き直した（立ち絵の背丈48→36画素、オーガ74→56画素）。道の半分の幅は16→28画素、橋も同じ幅にした（`roadHalf()`・`BRIDGE_HALF`）。人物が3〜4人並べる幅になる。

大きさを変えるときの手順：各 `cut_*.py` の大きさの値を変えて回し直し（勝利のポーズは立ち絵の背丈に合わせるので最後）、`python -I art/splice_data.py` でモックのデータの行を差し替える。

## 敵の動き（モックに組み込み済み）

- **攻撃のポーズ**（`enemies-attack.png`・16:9）：敵の絵（`enemies.png`）を参照に、同じデザインで生成。ゴブリンが槍を突き出す／ゴブリン呪術師が髑髏の杖を掲げて呪う／オーガが棍棒を地面に叩きつける（前かがみ）。切り抜きは `cut_enemy_poses.py`。この絵は立ち姿の絵と縮尺が違うので、構えた姿勢に合わせた高さ（ゴブリン40・呪術師60・オーガ66画素）で1体ずつ縮める。
- **歩き・構え・被弾**：仲間と同じ切り絵の仕組み（`heroFrames()`）を、左右反転して使う（`enemyFrames()`）。
- **モックでの使い方**：近づくあいだと戦闘前の様子見は歩き、戦闘中に止まっているときは構え、斬られた直後の0.3秒はのけぞり（最初の一瞬は白く光る）。仲間に踏み込むときは攻撃のポーズ（ゴブリンは突き、オーガは叩きつけ）。オーガの薙ぎ払いの瞬間も叩きつけのポーズ（`smashT`）。振りかぶりは前の絵のまま。ゴブリン呪術師は最初の戦闘でゴブリンの後ろに控え、呪いの矢でエリンを撃つ（詠唱のポーズ）。凍結の霧で凍り、貫通矢で倒れる。

## 世界地図（モックに組み込み済み）

町や迷宮の位置はモックで決まっているので、「町のない地形」と「場所の印」を別々に生成し、印を決まった位置に置いた。どちらも決定案を参照画像にした。

- **地形**（`world-terrain.png`・5:4で生成）：Overworld map for a 16-bit RPG seen from directly above (…) Terrain only: no towns, no buildings, no roads (…) mostly one large landmass of grassland; dark sea along the left edge, in the top-left corner with one small island there, along the bottom edge on the right, and along the right edge; a range of grey snow-capped mountains running across the upper left and the upper middle; a dense dark forest in the lower left; a misty marsh with pools near the lower right coast; open plains with scattered small groves in the center (…)
- **場所の印**（`world-icons.png`・1:1）：9種類を3×3に。王都（白い城）・鉱山町（赤い屋根）・村・忘れられた神殿（金の屋根）・大迷宮の門・板で塞がれた坑道・暗い塔・半ば沈んだ修道院・焼けた森

できた地形は、左上の小島が神殿、森の中が森の集落ニーア、湿地脇の海岸が港町セレス、沖の海が沈んだ修道院の位置に重なり、いまの配置とよく合った。

作り方は `cut_world.py`（使い方 `python -I art/cut_world.py art`）。地形は正方形のページに置いて書き出したので 1080×1080。幅256に縮めて上下を16画素ずつ切り、画面と同じ 256×224 にする。印は3×3の区画ごとにまとめて切り出し（焼けた森は木がばらけて別のかたまりになるため）、いちばん広い印が22画素になる縮尺でそろえる。モックでは `worldBg` を地形に差し替え、`placeIcon()` で場所ごとの印（`ICON_OF`）を描く。拠点の旗は印の上に出す。区画の菱形と道の点線は前の描き方のまま、色だけ落とした。

## 敵（モックに組み込み済み）

決定案（`direction-final.png` の右の画像。オーガとゴブリンが描かれている）を参照画像にして、1枚生成した（`enemies.png`・16:9）。

> Enemy sprite sheet for a 16-bit RPG in the same moody, muted dusk pixel art style, palette and lighting as the reference image, using the same ogre and goblin designs. Four separate full-body enemies, all facing left (…) on a plain flat light grey background (…) 1) a small green goblin with pointed ears and red eyes, holding a crude short spear; 2) a goblin shaman in a tattered purple hood, holding a staff topped with a small animal skull; 3) a huge hulking grey-brown ogre with small horns and a loincloth, standing and holding a big wooden club lowered at its side; 4) the exact same ogre raising the big wooden club high over its head with both hands (…)

注意：画像を Canva のページに置いて書き出すとき、最初は Canva が「野蛮の力」という文字や模様入りのポスターに仕立ててしまい、使えなかった。ページを作るときは「デザインはしないこと。文字・背景の模様・装飾は一切追加しない」とはっきり書く。

切り抜きは `cut_enemies.py`（使い方 `python -I art/cut_enemies.py art`）。大きい順に4つのかたまりを取り、左から ゴブリン・呪術師・オーガ・オーガ（振りかぶり）。縮尺は全員共通で、立ったオーガが74画素（ゴブリンは約44画素、振りかぶったオーガは約99画素）。左向きのまま使う。モックでは読み込み後に `goblinL` / `ogreL` / `ogreRaiseL` を差し替え、少しだけ薄暮の色調にする。ゴブリン呪術師は絵だけ用意してあり、モックの場面にはまだ出ていない。

まだのこと：敵の倒れ方（いまは前の溶けて消える演出）、拠点・技能タブ（窓だけの画面なので手を入れていない）。

## 注意

生成画像は「方向を決めるための見本」。画素の大きさがそろっていない（本物のドット絵のように1画素ずつ打たれていない）ので、そのままゲームの素材には使えない。方向が決まったら、キャラ単体の立ち絵・歩きの見本を作り、それを手本に 256×224 の画面で使える大きさのドットに起こす。
