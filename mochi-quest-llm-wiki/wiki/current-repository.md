---
id: current-repository
type: reference
status: active
updated: 2026-11-25
sources:
  - ../raw/2026-11-25-repository-baseline.md
  - ../raw/2026-11-25-user-direction.md
---

# 既存リポジトリ・統合マップ

GitHubで確認した2026-11-25時点の事実をまとめる。記録されたコミットと実装時のHEADとの差を必ず確認する。

## 調査ベースライン

**BASE-01 [BASELINE]** `main` = `90cc82afb17c800e1aa657983a88721ccc3b6b94`。ゲーム本体は `two/`。`one/`、作品選択、既存配信を壊さない。Three.js r180 / WebGL 2 / JS ES modules、Cloudflare Workers Static Assets、`npm test` は Node の組み込みテストランナー。公開版の操作テストは今回未実施。詳細は [原資料](../raw/2026-11-25-repository-baseline.md)。

| 既存ファイル・機能 | 拡張の接点・留意点 |
|---|---|
| `two/game.js` | `createGame`、シミュレーション、移動、アイテム、セーブ/復元。`state.time`を新時計のために安易に書き換えない。`inventory` は既存回復アイテム群であり、新しい素材在庫と区別。 |
| `two/main.js` | 入力、レンダリング、画面、保存・転送。既存E/Z/I/J/M/C/Esc等の意味とタッチ操作を調べる。 |
| `two/terrain.js` | 地形、高さ、水深、衝突、地域ID、座標ラップ、季節場。開拓可能地の判定に利用。`regionAt`はindexを返す。 |
| `two/world.js`, `forest.js`, `forest-mesh.js`, `landscape-tiles.js` | 景観と植生。伐採は描画・衝突・採集の一貫した差分を扱う。既存林の描画方法を調べ、オブジェクト単位のIDを検証。 |
| `two/kyo-layout.js`, `atmosphere.js`, `kyo-lights.js`, `court-watch.js`, `street-watch.js` | 京は288秒の日周期、照明、点灯、夜警が既存。グローバル時計との接続で意図しない高速化・停止を防ぐ。 |
| `two/actors.js`, `bestiary.js`, `scroll-encounters.js`, `travelling-merchants.js`, `road-merchants.js` | NPC・動物・街道商人。既存演出を保持しつつ、識別できる住民の生活・経済行動を段階的に追加。 |
| `two/ocean-voyage.js`, `skiff-travel.js`, `trade-routes.js` | 船・舟・交通網。市場需要との連携、共通時計と物理時刻の分離。 |
| `two/mochiyori-story.js`, `mochiyori-progress.js`, `mochiyori-book.js`, `mochiyori-parcels.js` | 伝統餅と既存の七章、帳面・配達物・推理。伝統餅データを移植/参照するが旧進行フラグを新イベントで書き換えない。 |
| `two/story-crafts.js`, `story-models.js`, `mochi-model.js`, `mochi-pounding.js` | 餅・道具・人物の既存造形と実演を活かす。食べ物としての餅と主人公モデルを分離。 |
| `two/journey-transfer.js`, `journey-player.js`, `main.js` | 旧公開元からの記録引継ぎ、上書き確認、ブラウザ保存。新データ移行を設計。 |
| `worker.js`, `wrangler.jsonc` | 現時点はASSETSおよび音源Rangeの処理。AI binding/ルートはない。静的配信と音源回帰を守る。 |
| `tests/*.test.mjs`, `package.json` | 既存テストの規約とfixtureを継承。prebuildでテスト。 |

## 現状の資産 [BASELINE]

README上は17景、配達対象861匹、主湯17・脇湯11、街道商人74人、牛車4台。白餅・団子・草餅・きなこ餅・羽二重餅・鏡餅、飛行、潜水、舟、船、亀、自転車、御朱印、写真、温泉、茶屋、都の祭・点灯、各景の職人と郷土餅。数はHEADの変更に合わせ再確認すること。

**BASE-02 [BASELINE]** 既存セーブはversion 12、2〜12の移行が実装されている。詳細は [保存](save-and-migration.md)。既存の「十七景もち寄り帖」は `createNotebook` が現在章・全手掛かり・正解証拠/理由に依存する。システム先行で新ストーリーへ自動変換しない。

## 実装前の確認

HEADのSHA、README、該当モジュール、既存のテストとビルド、固定景の境界、樹林の生成・衝突ID、既存セーブ転送の容量と互換性、ブラウザ起動の可否を確認。コードの機能を使い回せる範囲を把握し、Wikiのファイル名案は既存実装に合わせ調整する。

## フェーズ1・2の実装記録

2026-11-25の対象版、遊べる範囲、保存形式、検証結果と未検証の項目は[実装と検版記録](../raw/2026-11-25-phase-1-2-verification.md)に記載した。

## 関連ページ

- [アーキテクチャ](architecture.md)
- [保存と移行](save-and-migration.md)
- [昼夜](world-clock.md)
- [実装計画](implementation-roadmap.md)
