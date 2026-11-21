# Mochi Quest

**[作品選択](https://ishida-konbu.github.io/mochi-quest/)**

- [Mochi Quest 2　六景巡り](https://ishida-konbu.github.io/mochi-quest/two/) は、鳥獣戯画の里を歩く三人称の3Dオープンワールド。道路や橋をたどって六つの名所を巡り、御朱印を集められます。
- [Mochi Quest 1　絵巻道中](https://ishida-konbu.github.io/mochi-quest/one/) は、墨絵の世界を横に旅する第一作です。

## Mochi Quest 2 の操作

矢印キーか WASD でカメラを基準に前後左右へ移動します。ドラッグまたは Q・R で視点を回転し、Space でジャンプ、Z で三条通知、E で調べる・乗降、0〜4 で餅モードの切り替えができます。スマートフォンでは左スティックで歩き、画面をなぞって周囲を見回します。

M で地図、C でお顔カメラ、Esc で一時停止。お顔カメラでは表情を選び、写真を保存できます。旅の記録は各作品ごとに同じブラウザに自動保存されます。

## 開発と公開

リポジトリの直下で `python3 -m http.server 8080` を実行し、[作品選択ページ](http://localhost:8080/)を開きます。Node.js 22 で `npm test` を実行すると両作品のゲームロジックを検証できます。外部パッケージのインストールは不要です。

GitHub Pages は `main` ブランチのルートを配信します。第二作は WebGL 2 を使用します。Three.js r180 を [MIT ライセンス](two/vendor/THREE-LICENSE.txt) の下で同梱しています。掛け声の音声モデルは [音声クレジット](audio/CREDITS.txt) に記載しています。
