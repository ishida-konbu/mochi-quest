---
id: decisions
type: governance
status: active
updated: 2026-11-27
sources:
  - ../raw/2026-11-27-corner-kitchen.md
  - ../raw/2026-11-27-steamer-grip-and-footsteps.md
  - ../raw/2026-11-27-continuous-work-profile.md
  - ../raw/2026-11-27-workshop-hand-length.md
  - ../raw/2026-11-27-planted-waist-and-kitchen-worktop.md
  - ../raw/2026-11-27-ground-kitchen-and-planing.md
  - ../raw/2026-11-27-working-mochi.md
  - ../raw/2026-11-26-traveller-working-pose.md
  - ../raw/2026-11-26-front-working-hands.md
  - ../raw/2026-11-26-rounded-wrist-work.md
  - ../raw/2026-11-26-body-led-reach.md
  - ../raw/2026-11-26-action-revision.md
  - ../raw/2026-11-26-work-and-rest.md
  - ../raw/2026-11-25-interactive-building.md
  - ../raw/2026-11-25-open-forestry-level-foundations.md
  - ../raw/2026-11-25-construction-performance.md
  - ../raw/2026-11-25-user-direction.md
  - ../raw/2026-11-25-prior-design.md
  - ../raw/2026-11-25-single-mochi.md
  - ../raw/2026-11-25-cooking-tool-route.md
---

# 設計決定記録・未確定事項

最新のユーザー意思を固定し、暫定案を確定仕様と混同しないための決定台帳。詳細の定義は各所有ページを参照する。

## 確定（ユーザー明示または承認した方向性）

| ID | 区分 | 内容 | 所有ページ |
|---|---|---|---|
| D-01 | REQ | 生活・クラフト・自由探索・交流と物語を融合 | [全体](game-vision.md) |
| D-02 | REQ | ゲームシステムを先行。詳細なメインストーリーは再設計を保留 | [祭り](festival-story-boundary.md) |
| D-03 | REQ | もち寄り祭、各景の伝統餅、配達人のお餅、外界と没交渉の桃源郷・竜宮城 | [祭り](festival-story-boundary.md) |
| D-04 | REQ | 固定景を除く全世界で昼夜を実装 | [時間](world-clock.md) |
| D-05 | REQ | 採集・交易・栽培・組み合わせによる独自餅制作 | [素材](resources-and-farming.md)・[餅](mochi-crafting.md) |
| D-06 | REQ | 土地を選択し伐採・開拓・野営・拠点制作。土地の条件を反映 | [拠点](building.md) |
| D-07 | REQ | 立地・商品選択で結果が変わる無人販売所 | [経済](market-and-trade.md) |
| D-08 | REQ | 生成AIは創作餅の命名、商品説明、NPCの感想の三用途を採用 | [AI](generative-ai.md) |
| D-09 | REQ | ライトユーザーの容易さとやり込みを両立 | [UX](user-experience.md) |

## 推奨初期値・技術設計（変更可能）

| ID | 区分 | 内容 | 所有ページ |
|---|---|---|---|
| D-10 | DESIGN | ゲーム内日長48分、オフライン進行なし、就寝・待機で時間を送る | [時間](world-clock.md) |
| D-11 | DESIGN | 餅の7要素と固定小数/整数ベースの評価、互換ルール | [餅](mochi-crafting.md) |
| D-12 | DESIGN | 既存景観・経路の保護、自由配置＋スナップのモジュール型建築 | [拠点](building.md) |
| D-13 | DESIGN | 経済は単一プレイヤーの決定論的近似、NPC購入を個体/集団で段階実装 | [経済](market-and-trade.md) |
| D-14 | DESIGN | AIなしでも全機能が動く。AI文章は任意・検証・予算制限付き | [AI](generative-ai.md) |
| D-15 | DESIGN | ゲームロジックとレンダラ分離、安定ID、バージョン付き保存と復旧 | [技術](architecture.md)・[保存](save-and-migration.md) |
| D-16 | DESIGN | 既存「十七景もち寄り帖」はシステム先行中に削除・上書きしない。新旧を混同しない | [祭り](festival-story-boundary.md) |
| D-17 | DESIGN | 初期の縦断ループは桜川、棚田、蔵町で作り、その後全景に展開 | [計画](implementation-roadmap.md) |
| D-18 | REQ | 工房で主人公が米の加熱、下ごしらえ、餅つき、混ぜ合わせを実演する。一仕込みの出来高にかかわらず、一個の成形から盛り付けまでを見せる。次に使う道具は作業場所に用意するか、餅とともに運ぶ | [餅](mochi-crafting.md) |
| D-19 | REQ | 販売所と拠点の新築は主人公のお餅が現地で行う。材料に手を掛けてから組み付けて離すまでをつなげ、用のない往復を省く | [拠点](building.md) |
| D-20 | REQ | 伐採の条件を撤廃する。斜面にも建てられ、勾配が大きいほど水平な基礎に多くの木材を使う | [拠点](building.md) |
| D-21 | REQ | 建築を独立した「建てる」モードにする。絵札と見積もりで選び、現地の枠で配置・高さ調整・範囲編集を行う。D-19の実演を各建物の部品1〜3点の加工カットに短縮する | [拠点](building.md) |
| D-22 | REQ | 探索中、立木のそばで手斧を三度入れ、倒木と切り株を現地に描く。時が経ち、建築と干渉しない木は再生する | [立木](building.md) |
| D-23 | REQ | 餅作りと普請では地域音が続き、主人公の手が弾力を保つ。普請は仕事に応じた複数の画角を組み合わせる | [工房](mochi-crafting.md)・[普請](building.md) |
| D-24 | REQ | 小屋の板床に寝床を置き、伸び、あくび、掛け物、時の移ろい、起床を現地で描く。寝具は四段階。各地の技法による習得条件は全域への展開時に決める | [野営](building.md)・[時計](world-clock.md) |
| D-25 | REQ | 工作の丸い手はD-26で届かせ方を改訂。伐採は一打ごとに幹を深く欠き、三打目で上下に割る。就寝は温泉の伸びを生かし、元の体格を保って寝台に横たわる | [餅作り](mochi-crafting.md)・[拠点](building.md)・[就寝](world-clock.md) |
| D-26 | REQ | 遠い作業点には、足を残して胴を伸ばし、丸い手を付け根ごと前へ運ぶ。手斧は片手で横から振る | [作業姿勢](mochi-crafting.md)・[普請と伐採](building.md) |
| D-27 | REQ | 工房と普請では丸い短い手で握りを保ち、手首が返る。奥へ届くときの胴と肩の送りはD-26を引き継ぐ | [手と胴の動き](mochi-crafting.md)・[鉋の往復](building.md) |
| D-28 | REQ | 工房・普請・伐採は通常状態の餅に見えることを優先する。D-26・27の肩の送りと手首の返しは、顔・胴・手の丸みと位置関係を保てる範囲で行う | [実画面での比較](../raw/2026-11-26-traveller-working-pose.md)・[作業姿勢](mochi-crafting.md) |
| D-29 | REQ | 短い手は付け根ごと餅の球面に沿って前に回る。鉋は両手で握り、足を残して胴と肩を送り、引き始めに手首を返す。料理は作業台に正対する。手斧は三打とも刃から木に入る | [依頼と検版](../raw/2026-11-26-front-working-hands.md)・[工房](mochi-crafting.md)・[普請と伐採](building.md) |
| D-30 | REQ | 作業の前後動は足元から伸びる餅の胴で表し、短い腕の付け根と顔が一緒に前へ出る。料理では両手を体の前で使い、伐採では片手の斧を体側から振る | [参照画と依頼](../raw/2026-11-27-working-mochi.md)・[工房](mochi-crafting.md)・[普請と伐採](building.md) |
| D-31 | REQ | 工房では地面の筵にかまどと臼を置き、杵は両手で扱う。切る・つぶす・成形・盛り付けは調理台を使う。鉋の送りでは足元から背と腹の厚みを前方へ分散させ、作業中の表情では瞳を明瞭に保つ | [改訂の経緯](../raw/2026-11-27-ground-kitchen-and-planing.md)・[工房](mochi-crafting.md)・[鉋](building.md) |
| D-32 | REQ | 鉋の送りは足の上で腰を支え、胴の中ほどから肩と顔を前へしならせる。3工房は地面から一枚の調理台を使い、薄いまな板と盛り皿を天板に直置きする | [依頼・実景](../raw/2026-11-27-planted-waist-and-kitchen-worktop.md)・[鉋](building.md)・[工房](mochi-crafting.md) |
| D-33 | REQ | 餅クラフトと建てるでは手の長さを保ち、付け根を移し、温泉の餅と同様に太さをなるべく保って胴を伸縮する。鋸と鉋は両手、木槌は片手で材を押さえて打つ。肌の崩れと道具・設備の貫通を検査する | [今回の条件](../raw/2026-11-27-workshop-hand-length.md)・[工房](mochi-crafting.md)・[普請](building.md) |
| D-34 | REQ | 作業で伸びる餅は顔の下と背中に段差を作らず、腰から頬まで滑らかにつなぐ。蒸し器の蓋を開けて横へ置くときは片手を使う | [今回の指示・比較](../raw/2026-11-27-continuous-work-profile.md)・[工房](mochi-crafting.md)・[普請](building.md) |
| D-35 | REQ | 蒸し器は蓋の中央に取手を付け、片手でそこを握る。工房内を移るときは進行方向へ向き直り、到着してから次の作業に向く | [依頼と実演](../raw/2026-11-27-steamer-grip-and-footsteps.md)・[工房](mochi-crafting.md) |
| D-36 | REQ | 木蓋の中央に板目に沿って元の細木を戻し、立てたときに縦長に見せる。臼とかまどの並びに対して短い作業台を直角に置き、工房内の往復を短くする | [配置の比較と検証](../raw/2026-11-27-corner-kitchen.md)・[工房](mochi-crafting.md) |
| D-37 | REQ | 工房では一枚の正方形の筵にかまど・臼・短い卓の四脚を載せ、入場後はかまど・臼・卓・市場の焼き台を、一つの足場から向き直って使う。D-35・36の工程間の歩行を改訂する | [依頼と検証](../raw/2026-11-27-pivot-kitchen.md)・[工房](mochi-crafting.md) |

## 未確定・要検証（OPEN）

| ID | 課題 | 扱い |
|---|---|---|
| O-01 | 新メインストーリーの原因、責任、登場人物の役割、事件の順序、祭り・秘境の結末 | システム完成後にユーザーと設計。仮筋の本番実装禁止 |
| O-02 | 正式な通貨名、価格表、農作物・レシピの素材数、成長日数、時間進行倍率 | 各ページの可変初期値で試作しプレイテストで調整 |
| O-03 | 拠点の最大数・広さ、整地の上限、秘境の建築許可、販売所の許可区域 | 初期の安全な上限から開始。破壊・経路塞ぎは許容しない |
| O-04 | 既存ストーリーの正式な移行・保存方針と新作のタイトル | 既存機能保持。新ストーリー設計時に決める |
| O-05 | 生成AIの具体的なモデル、プロバイダ、無料枠、実測日本語品質、公開運用 | まずローカル代替文＋アダプタ。ネット接続・課金・モデル配信は別途判断 |
| O-06 | 祭り開催後の年次ループ・翌年のイベント | 将来設計。初期の強制リアルタイム期限なし |
| O-07 | 各機器の性能予算と実プレイ時の適切な素材密度・拠点上限 | HEADで測定し調整。実測なしに性能保証しない |
| O-08 | 固定景の追加有無、昼夜照明・空の美術最終調整 | `moon`/`dawn`を明示的な例外として開始。他は実地確認・合意 |

初期仕様の小変更は所有ページで行い、表の決定を変更する必要がある場合だけ本ページを更新する。実装の都合で [REQ] を変更しない。

## 関連ページ

- [全体設計](game-vision.md)
- [ロードマップ](implementation-roadmap.md)
- [物語](festival-story-boundary.md)
- [生成AI](generative-ai.md)
