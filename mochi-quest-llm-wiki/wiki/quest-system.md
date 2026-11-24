---
id: quest-system
type: system
status: active
updated: 2026-11-25
sources:
  - ../raw/2026-11-25-user-direction.md
  - ../raw/2026-11-25-prior-design.md
---

# ミッション基盤・偶発的な出会い

生活・探索と物語をつなぐ汎用的な依頼の基盤を設計する。完成済みのメインプロットを前提にせず、小さな依頼から複数解法を検証する。

## 設計原則

- **QUEST-01 [REQ]** 採集、餅作り、拠点、交易、配達、住民交流をうまく活用することで少しずつ物語を進められる。任意の行動から依頼を見つける。現フェーズで新しいメイン事件を実装しない。
- **QUEST-02 [DESIGN]** 依頼は「何を必要としているか」を提示し、達成方法を固定レシピや決められた収集順に限定しない。特性を満たす餅、品物、行為、協力者、知識、会話などの述語を用いる。メインの重要な場面は後工程で明示。
- **QUEST-03 [DESIGN]** 設計した依頼定義をデータで管理し、状態をイベントで更新。生成AIはミッションを作ったり正誤を判断したりしない。短い生活依頼は手書きテンプレートから条件付きで組み立てられる。

## ミッション分類（例）

| 種別 | ゲーム性 | 条件例 |
|---|---|---|
| 通知・荷物配達 | 道・船・モード選択 | `deliver(parcelId, npcId)` |
| 採集・仕入れ | 地域と代替入手 | `possess(resourceId, count)` または交換 |
| 創作 | レシピ発明と特性 | `batch.attributes.preservation>=65` 等 |
| 建築 | 場所・設備の制作 | `placeModule(capability, eligibleSite)` |
| 農業 | 土地・水・生産 | `harvest(cropId, count)` または買う |
| 交易 | 立地、販売、経路 | 商品/数量/販売所、実売イベント |
| 人物交流 | 贈答、観察、住民の行動 | 既知の人物、会話、試食イベント |
| 偶発 | 道中での出会い・手伝い | 状況、時刻、近接、未実行 |
| 文化 | 餅つき、月見、婚礼など | 行事に参加、必要品を用意 |
| 調査（将来） | 地理・知識・観察・時間 | 発見、情報、複数の手掛かり |

## データ契約

例は動作検証用の非正史・小規模サンプル。

```json
{
  "id":"sample-travel-mochi",
  "version":1,
  "title":"旅の途中で食べる餅",
  "issuerNpcId":"sample-npc",
  "discoverWhen":{"all":[{"event":"talk","npcId":"sample-npc"}]},
  "completion":{"any":[
    {"all":[{"event":"giftBatch","npcId":"sample-npc","quantity":2,"attributesMin":{"preservation":65,"portability":60}}]},
    {"all":[{"event":"deliverParcel","targetNpcId":"sample-npc","parcelTag":"suitable_travel_food"}]}
  ]},
  "reward":{"currency":20,"relationship":3},
  "onCompleteEvents":["sample-travel-food-helped"],
  "repeatPolicy":"once"
}
```

実装で `issuerNpcId` は実在IDへ解決し、テスト用例は正式データへ入れない。条件DSLはホワイトリスト化し `eval` を使わない。イベントの対象・数量・時刻・既知状態を検証する。配達物は一般消費できない。`QuestState {questId, status, discoveredMinute, acceptedMinute, progress, consumedEventIds, completedMinute, rewardClaimed}`。状態 `unknown -> available -> accepted -> ready -> completed`。任意辞退/保留が可能。既に条件を満たす品は受注後に手渡せる。達成に必要な事実が受注前に発見されても認識できるよう条件の種類を区別する（現在状態と過去の事実）。

**QUEST-04 [DESIGN]** `any/all` 述語とエンジンイベントで解決の自由を作る。条件を満たした品を実際に渡す場合のみ在庫を消費する。複数ルートで同じ依頼を解決しても報酬は一度。クエスト受領を強制しない。ミッション履歴と次にできることを帳面に出す。利用可能な解法を示すが最適解を常時表示しない。初心者は段階的なヒント、熟練者は地形・属性・人脈から考える。

### 最初のプレイ可能な依頼（設計例、正史化しない）

1. 桜川で出会う住民から「甘くなく、持ち歩きやすい餅」を頼まれる。既存レシピ、自由制作、購入した代替品のいずれでも解決（特性判定）。
2. 棚田の農家にもち米を分けてもらう。通貨で購入、配達の報酬、小豆や素材との交換のいずれでもよい。
3. 蔵町の市付近で売れる商品を考える。任意の販売所を置き、買い手の反応と売上を見る。完了で次の技法の情報を得る（商売は物語全体の必須条件にしない）。

これらで採集、購入、自由配合、贈答・販売、NPCの反応が一つの遊びになることを検証。後工程で土地固有の問題を扱う。

## 偶発イベントと世界の変化

**QUEST-05 [DESIGN]** 時刻、場所、既知の住民、進捗、NPCの状態を条件とし、短いイベントを既存の移動経路や生活場所に配置。発生率/クールダウンで過剰な割込みを防止。見逃した場合も後から会える、繰り返し発生する、別の機会があるなどで救済。解決後の会話/営業/仕事の見た目が変化する。状態はセーブし、再ロードで同一イベントを複製しない。生活系の成功は小さな世界の変化と結び付ける。

## 関連ページ

- [全体](game-vision.md)
- [創作餅](mochi-crafting.md)
- [商売](market-and-trade.md)
- [住民](npc-simulation.md)
- [新ストーリーとの境界](festival-story-boundary.md)
- [イベントと状態](architecture.md)
