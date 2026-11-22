# Mochi Quest

**[作品選択](https://mochi-quest.mochi-quest.workers.dev/)**

- [Mochi Quest 2　四季十景巡り](https://mochi-quest.mochi-quest.workers.dev/two/) は、鳥獣戯画の里を歩く三人称の3Dオープンワールド。川や海を泳ぎ、建物の戸口をくぐり、雪の都・紅葉の峡・十五夜の薄野・初日の出の浜を含む十の名所で御朱印を集められます。
- [Mochi Quest 1　絵巻道中](https://mochi-quest.mochi-quest.workers.dev/one/) は、墨絵の世界を横に旅する第一作です。

## Mochi Quest 2 の操作

矢印キーか WASD でカメラを基準に前後左右へ移動します。ドラッグまたは Q・R で視点を回転し、Space でジャンプし、空中で押すたびに体が伸びます。Z で三条通知、E で調べる・乗降、0〜5 で餅モードの切り替えができます。スマートフォンでは左スティックで歩き、画面をなぞって周囲を見回します。

団子は転がり続けると加速します。草餅は木・岩・建物・動物をすり抜け、橋の下を泳げます。草餅で道具や温泉を使うには、そばで E を押します。羽二重餅はジャンプの連打か長押しで上昇し、飛びながら前に進むと加速します。きなこ餅の三条通知は周囲八方向、ラーメンで満腹になると二十四方向へ同時発射します。電動自転車は全十景のポートで借りたり返したりできます。

配達帳で動物を選ぶと、未配達の一匹までの方角と距離が分かります。全675匹に届けると鏡餅が開き、地図に印を置いた場所へ瞬間移動できます。以前の配達記録と、一度開いた鏡餅も引き継ぎます。

茶屋でお茶を運ぶ蛙や、酒蔵で柄杓を動かす職人にも通知を届けられます。暖簾をくぐると、屋内の仕事を間近で眺められます。

錦秋の楓峡には紅葉・黄葉する木が400本あります。桜川には鹿の背にまたがる兎、十五夜の薄野の上空には雲間を泳ぐ龍がいます。羽二重餅で高度を上げると龍を探せます。麒麟は雲を踏んで進み、丹頂はさまざまな高さを飛びます。空を渡る小鳥の群れは配達の対象外です。獅子の身ぶりや動物同士の遊びは高山寺の絵巻を参考にしています。[高山寺「鳥獣人物戯画」](https://kosanji.com/chojujinbutsugiga/)

M で地図、C でお顔カメラ、Esc で一時停止。お顔カメラでは表情を選び、写真を保存できます。十景それぞれの和風の小品と環境音は最初の操作で流れ始め、画面右上のスピーカーで切り替えられます。旅の記録は各作品ごとに同じブラウザに自動保存されます。

GitHub Pages で遊んでいた場合は、同じブラウザで[旧版の手引き](https://ishida-konbu.github.io/mochi-quest/two/#guide)を開き、「Cloudflare版に旅の記録を引き継ぐ」を選んでください。Cloudflare 版に旅の記録がある場合は、二つの記録を見比べてから選択できます。

## 開発と公開

リポジトリの直下で `python3 -m http.server 8080` を実行し、[作品選択ページ](http://localhost:8080/)を開きます。Node.js 22 で `npm test` を実行すると両作品のゲームロジックを検証できます。外部パッケージのインストールは不要です。

本番は Cloudflare Workers Static Assets の Worker `mochi-quest` です。Cloudflare Workers Builds が GitHub の `ishida-konbu/mochi-quest` の `main` への push を受け取り、リポジトリ直下で `npm run build` と `npx wrangler deploy` を順に実行します。ビルドでは先に全テストを実行し、失敗した場合は公開を止めます。

リポジトリのルートで `npm ci` の後、`npm run dev` で配信構成をローカル確認できます。`npm run deploy` は配信用のファイルを `dist/` に集めて公開します。第二作は WebGL 2 を使用します。Three.js r180 を [MIT ライセンス](two/vendor/THREE-LICENSE.txt) の下で同梱しています。旅の環境音・効果音の出典とライセンス、掛け声の音声モデルは [音声クレジット](audio/CREDITS.txt) に記載しています。

第二作の遠景には描き下ろしの山水画を使用しています。お餅や水辺に映る朝の環境光には Greg Zaal の HDRI を軽量化して使用しました。[Spruit Sunrise](https://polyhaven.com/a/spruit_sunrise) ／ [CC0](https://polyhaven.com/license)

桜川の浅瀬と海岸には Kless Gyzen の苔岩6種を配置しています。配信用モデルは元の色と凹凸のテクスチャを活かして約4千ポリゴンに軽量化しました。[Rock Moss Set 01](https://polyhaven.com/a/rock_moss_set_01) ／ [CC0](https://polyhaven.com/license)

足元の草花は12系統に5通りの草姿を描き分けた、この作品のための植物画です。原画の生成コードと配信用アトラスを CC0 で公開しています。[植物画のソース](tools/paint-meadow.mjs) ／ [アトラス](two/assets/world/meadow-herbs.webp) ／ [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
