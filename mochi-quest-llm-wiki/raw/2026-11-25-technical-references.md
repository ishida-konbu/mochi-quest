# 技術参照資料 — 2026-11-25

以下は出典へのリンクと、設計に関わる確認内容の要約。モデル選定・性能・費用は導入時に再検証する。

- [Andrej Karpathy, llm-wiki.md の公開一覧](https://gist.github.com/karpathy)：2026-04-04公開のLLM Wiki構想。原資料、相互リンクされたWiki、エージェント用規約の三層と索引・ログによる継続的な保守。ここでは製品設計用に適応し、通常のMarkdownリンクを採用する。
- [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)：2026-11-18更新の資料では無料割当10,000 Neurons/日、UTC 00:00リセット。無料枠超過や対象モデルには制約。課金を有効化しない前提で、失敗時はローカル文例に切り替える。将来の無料枠を保証するものではない。
- [Cloudflare Workers AI JSON Mode](https://developers.cloudflare.com/workers-ai/features/json-mode/)：対応モデルでJSON形式/スキーマを要求できる。出力の内容・正当性はアプリ側で検証が必要。
- [WebLLM](https://github.com/mlc-ai/web-llm)：ブラウザのWebGPUでLLM推論を実行可能なオープンソースエンジン（Apache-2.0）。モデルライセンスは別途確認。描画とGPU資源を共有し、大容量モデルの取得・機種依存を伴うため標準要件にしない。
- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)・[Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)：ブラウザで構造化データを保存する際の公式技術参照。セーブの永続性を無条件には保証できない。

参考ゲームの設計思想（本会話の調査結果に基づく要約）：あつまれ どうぶつの森の収集/制作/生活、GTA/RDR2の自由行動/社会/商業、ゼルダBotW/TotKの地形/能力/システムの掛け合わせ、Stardew Valleyの共同体と生産、Eastshadeの非戦闘型探索。具体的なコンテンツや素材は模倣せず、Mochi Quest固有の資産と文化で設計する。
