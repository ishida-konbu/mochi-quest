# 既存リポジトリ調査記録

調査日：2026-11-25 JST。対象：`ishida-konbu/mochi-quest` の `main`。取得したHEADは `90cc82afb17c800e1aa657983a88721ccc3b6b94`（コミット日時 2026-11-23 16:16:54 UTC、コミット題名 Carry Mochiyori exchanges from hand to hand across all seventeen regions）。この記録は取得時点の要約であり、実行結果ではない。

- [コミット](https://github.com/ishida-konbu/mochi-quest/commit/90cc82afb17c800e1aa657983a88721ccc3b6b94)
- [公開版](https://mochi-quest.mochi-quest.workers.dev/two/)：今回ブラウザ操作による実地検証は未実施。
- [README](https://github.com/ishida-konbu/mochi-quest/blob/90cc82afb17c800e1aa657983a88721ccc3b6b94/README.md)：Mochi Quest 2は17景、配達対象861匹、主湯17+脇湯11、街道商人74人、牛車4台、舟・定期船・廻船、御朱印、写真、モード、現行「十七景もち寄り帖」。WebGL 2、Three.js r180同梱、Cloudflare Workers Static Assets。Node.js 22で `npm test`。
- [terrain.js](https://github.com/ishida-konbu/mochi-quest/blob/90cc82afb17c800e1aa657983a88721ccc3b6b94/two/terrain.js) 42行付近以降：`ORIGINAL_REGIONS`, `REGIONS`, `regionAt`, `seasonAt`, `wrapCoord`, `wrapDelta`, `BOUND`。地域の最近傍判定は座標ラップを考慮し、`regionAt` は配列のインデックスを返す。季節場に `snow`, `autumn`, `moon`, `dawn` の重み。
- [game.js](https://github.com/ishida-konbu/mochi-quest/blob/90cc82afb17c800e1aa657983a88721ccc3b6b94/two/game.js) 294行付近 `createGame(snapshot)`、1475行付近 `save()`：version 12。`notebook`, `flightSeed`, `kagamiUnlocked`, `time`, `score`, `visited`, `delivered`, `player`, `items`（既存ピックアップのcooldown配列）, `bikes`, `turtle`, `lastBath`, `lastBathPlace` を保存。`restore()` はversion 2〜12を検証し、地形変更等の移行を処理。既存モードID `normal`, `dango`, `kusa`, `kinako`, `habutae`, `kagami`。
- [main.js](https://github.com/ishida-konbu/mochi-quest/blob/90cc82afb17c800e1aa657983a88721ccc3b6b94/two/main.js) 50〜100・211行付近：`localStorage`のread/store、`startJourney`で旧公開元からの転送、ゲームと設定の保存。記録の上書き確認あり。
- [kyo-layout.js](https://github.com/ishida-konbu/mochi-quest/blob/90cc82afb17c800e1aa657983a88721ccc3b6b94/two/kyo-layout.js) 187行付近：`KYO_DAY_SECONDS=288`, `kyoClock(time,player)`, `kyoNight`。既存の京都の照明・門限・夜警・山の演出に関連。`player.kyoClockOffset` があり、船は別途 `state.time` に依存する。
- [mochiyori-story.js](https://github.com/ishida-konbu/mochi-quest/blob/90cc82afb17c800e1aa657983a88721ccc3b6b94/two/mochiyori-story.js)：`SCENES` に17景の餅、`CAST`、`CHAPTERS`、供給記録。秘境フラグを持つ景がある。
- [mochiyori-progress.js](https://github.com/ishida-konbu/mochi-quest/blob/90cc82afb17c800e1aa657983a88721ccc3b6b94/two/mochiyori-progress.js)：`createNotebook`、章内の `requested`, `heard`, `proofIndex`、`ready()` は章内の全手掛かりを要求、`prove` の正誤判定、`finish`、回想・アイテム・追跡。新システムと混同しない。
- [現行シナリオ設計](https://github.com/ishida-konbu/mochi-quest/blob/90cc82afb17c800e1aa657983a88721ccc3b6b94/docs/mochiyori-design.md)：七つの謎と終幕、二度の裁判、観察/証言/推理、既存の作業台と回想の造形。新プロットの正本ではない。
- [worker.js](https://github.com/ishida-konbu/mochi-quest/blob/90cc82afb17c800e1aa657983a88721ccc3b6b94/worker.js)・[wrangler.jsonc](https://github.com/ishida-konbu/mochi-quest/blob/90cc82afb17c800e1aa657983a88721ccc3b6b94/wrangler.jsonc)：WorkerはMP3 Rangeを処理し、その他はASSETSへ。`run_worker_first` は音源パスを対象。AI bindingやAPIルートを前提にしない。
- [package.json](https://github.com/ishida-konbu/mochi-quest/blob/90cc82afb17c800e1aa657983a88721ccc3b6b94/package.json)：`test`: `node --test tests/*.test.mjs`、`prebuild`: `npm test`。

未確認：全ソースの網羅的な読解、テスト実行、描画・当たり判定・ルートの現地検証、最新コミットとの差異。実装時にHEADから再確認すること。
