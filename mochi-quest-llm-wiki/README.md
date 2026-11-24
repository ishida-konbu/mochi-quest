# Mochi Quest — 生活・クラフト型オープンワールド設計 Wiki

設計版 v0.1.0 / 2026-11-25 / [フェーズ1・2の実装と検版](raw/2026-11-25-phase-1-2-verification.md)

本書は『Mochi Quest 2 四季十七景巡り』を、自由探索・生活・クラフト・交易・交流を中心とするゲームへ拡張するための、Codex向けの参照可能・更新可能な設計ナレッジベースです。今回の実装対象はゲームシステム。新しいメインストーリーの詳細設計・実装は、システム検証後の別工程です。

## 最初に読む

- [wiki/index.md](wiki/index.md) — 全ページの索引。人間もエージェントもここから関連ページをたどる。
- [AGENTS.md](AGENTS.md) — 英語の実装・Wiki保守指示。対象リポジトリの既存指示を上書きしない。
- [SCHEMA.md](SCHEMA.md) — Wikiの情報階層、優先順位、改訂方法。
- [ゲーム全体設計](wiki/game-vision.md) — 設計目的、非目標、成功条件。
- [実装計画](wiki/implementation-roadmap.md) — 依存関係、実装順、段階別の完了条件。
- [決定・未確定事項](wiki/decisions.md) — 要件と提案と未決定を区別する。

## リポジトリへの配置

ZIPを展開して、フォルダ全体を `docs/living-world/` 等へ置く（配置名は例）。`AGENTS.md` はそのWiki配下で運用するためのもの。既存リポジトリのルートに同名ファイルがある場合は置き換えない。既存の開発規約と合わせて読む。

Codexに渡す初回指示例（英語）：

> Read `docs/living-world/AGENTS.md`, `docs/living-world/SCHEMA.md`, and `docs/living-world/wiki/index.md`. Inspect the current repository and reconcile the recorded baseline with HEAD. Then implement Phase 0 and Phase 1 only, as defined in `wiki/implementation-roadmap.md`. Leave later phases for a separate instruction. Preserve all existing travel, delivery, stamp, photo, and save behavior. Do not rewrite the main story. Run the existing tests and relevant new tests, verify the actual browser interaction where possible, and report exact changes and any unverified acceptance criteria. Update the wiki only to reflect evidence or explicitly approved design changes.

## 文書の読み方

`[REQ]` はユーザーが明示・承認した方向性から導かれる必須要件。`[DESIGN]` は現時点の推奨仕様（実装の初期値として採用可、変更可能）。`[OPEN]` は未決定。`[BASELINE]` は調査した既存実装の事実（HEADでは再確認）。Wikiは実装済みであることを意味しない。

`raw/` は不変の出典記録、`wiki/` はそれを統合した設計ページ。細かい仕様を変更したい場合は、該当ページを修正し、必要に応じて決定記録・関連ページ・索引・ログを更新する。ファイル名と仕様IDは参照の安定性のため維持する。

## 設計着手時の検証範囲

2026-11-25 JSTに GitHub `main` のコミット `90cc82afb17c800e1aa657983a88721ccc3b6b94` と関連ソースを参照。ブラウザの実プレイ・性能測定・実装・デプロイは未実施。数値、ファイル名案、材料データ、API契約例は設計上の初期案。ユーザーの明示した要件と混同しないこと。
