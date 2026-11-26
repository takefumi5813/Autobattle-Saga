# 町の絵の頼み方（2026-11-26）

オーナー「町はそれぞれ個性があるように。木や建物は使い回し禁止。バリエーションは10倍」。
大陸ごとに「建物12」と「自然と小物17」の2枚を ChatGPT に描かせる（見本に `art/interior-ref.png` を添える）。
背景は緑（#00FF00）。緑の多い絵（自然の全部・密林の建物）は赤紫（#FF00FF）。
切り分けは `art/cut_town.py`（段ごと左から、下の名前の順）。

## 共通の書き出し
The attached image shows sprites from my game (16-bit SNES-era JRPG pixel art, 3/4 top-down view seen slightly from above, warm earthy palette, dark outlines, soft shading; characters are about 36 px tall). Draw a sprite sheet in exactly the same pixel art style and scale. Every object separate with wide empty spacing, on a perfectly flat solid pure {KEY} background, no shadows on the background, no text, no labels, no grid. Crisp hard pixel edges, not blurry. Every object must look clearly different from the others (different shape, size, roof, color, details).

## 建物（3段×4。どれも正面の入口が下を向く）
- c0 中つ国（鉱山町と穀倉の国、温帯の中世）
- c1 北の雪国ノルデン（雪をかぶった屋根、丸太小屋、長屋、木の尖塔の教会、魚干し）
- c2 東方の八洲（瓦屋根、漆喰の白壁、蔵、茶屋、塔、木の門）
- c3 砂の大陸ザハル（日干し煉瓦、丸屋根、布の日よけ、塔、隊商宿）
- c4 南の密林ヴェルデ（高床、草葺き、木の上の家、竹、彫った柱）
- c5 古き魔の大陸エルドラ（黒い石のゴシック、歪んだ塔、魔女の家、紫の灯）

## 自然と小物（1段目：木5、2段目：茂み・岩・花など5、3段目：柵・井戸・露店・灯り・その地方の物5、4段目：地面の模様2）
