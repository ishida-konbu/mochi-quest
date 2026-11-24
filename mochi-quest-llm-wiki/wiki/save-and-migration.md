---
id: save-and-migration
type: technical
status: active
updated: 2026-11-25
sources:
  - ../raw/2026-11-25-user-direction.md
  - ../raw/2026-11-25-prior-design.md
  - ../raw/2026-11-25-repository-baseline.md
  - ../raw/2026-11-25-technical-references.md
---

# セーブデータ・移行・エクスポート

既存の旅の記録を保持しながら、長期間の生活・建築・商品・経済の状態を保存する。破損や容量制約に対して安全に復旧できる構成。

## ベースライン

**SAVE-01 [BASELINE]** 現行 `two/game.js` の `save()` は version 12、`restore()` は2〜12を扱う。`two/main.js` はlocalStorageの読み書きと旧公開元からの引継ぎを行う。旧 `items` は回復アイテムのcooldown、`notebook` は旧シナリオ。詳細は [現行コード](current-repository.md) と [調査記録](../raw/2026-11-25-repository-baseline.md)。HEADで再確認し、バージョン番号を決める。

## 保存方針

**SAVE-02 [DESIGN]** 生活システムに新しいバージョン付き領域を追加。小規模な初期フェーズは既存の保存方式と一貫した単一snapshotを利用してもよい。容量・書き込み頻度が増える段階ではIndexedDBに同一revisionのゲーム正本をトランザクション保存する（実装の前に転送方式を確認）。最初から一部をlocalStorage、一部をIndexedDBに無条件で分散し、別の時点を組み合わせない。移行後に従来版へ戻すことは保証しない。古い旅記録のバックアップを保持し、旧版が新記録を壊さないようにする。

```json
{
  "version": 13,
  "legacyFields": "existing fields remain at their compatible top-level paths; illustrative only",
  "livingWorld": {
    "schemaVersion": 1,
    "revision": 1,
    "saveSeed": 12345,
    "worldMinute": 480,
    "wallet": 0,
    "inventory": [],
    "recipes": [],
    "batches": [],
    "camps": [],
    "structures": [],
    "worldChanges": {"removedTrees": [], "resourceDeltas": []},
    "plots": [],
    "stands": [],
    "markets": [],
    "npcState": [],
    "contacts": [],
    "quests": [],
    "eventFlags": [],
    "processCursors": {},
    "textResults": []
  }
}
```

例示のversion 13は調査時点の次の候補で、実装時に最新バージョンと衝突しない番号を採用。`legacyFields` は説明用の疑似フィールドで実装しない。既存フィールドは既存の契約に従って保持。データ配置・正規化は [技術](architecture.md)。大きい画像・生成メッシュ・GPU・定義カタログは保存せず、安定ID、差分、レシピキーから復元する。

## 旧セーブからの移行

**SAVE-03 [REQ]** 旧版のプレイ記録を壊さず、新システムを開始できること。

1. 原データの読み取り、バージョンと必須フィールドの検証、元のバックアップ作成。既存の2〜12対応の移行を尊重。未対応/破損を無言で初期化しない。
2. 既存 `restore`/移行で旧地形座標、船、亀、自転車、回復アイテム、御朱印、通知、鏡餅解放、帳面、回想、プレイヤー設定などを維持。新しい正本へコピーしてから変更を加える。
3. `livingWorld` を一回だけ初期化。既存の `state.time` を新しいworldMinuteに直接換算して何百日分の売上・成長を生じさせない。京の日周期の位相は `kyoClock` から可能なら同じ見た目へ移行する（旧版の12時相当の位相を確認）。初期の生活日indexは0。旧版の過去の配達を再実行しない。新スタート時の初期値・資金は一回のみ。
4. 検証済みスナップショットを保存し、読込・再復元に成功したら新revisionを正本にする。失敗なら旧記録に戻れる。移行を再実行しても同じ結果。旧物語完了のフラグから新物語/秘境の交易許可を勝手に生成しない。
5. 未知のバージョンは読込不可と説明し、エクスポート/旧版の利用を促す。既存の保存を削除しない。

### バリデーション

- 全IDは正当な形式、必須の参照が存在。廃止IDは明示的な移行テーブル/互換アセット、未移行の物を破棄しない。
- `worldMinute`, `revision`, 通貨、数量、属性は定めた範囲内。位置は正規化し、建物・木の差分が正しい実体を指す。販売所在庫と全所有場所のロット数量が整合。
- 一意なスタック/ロット/イベントID。売上/報酬/初期資金/収穫の二重適用なし。市場のlastSettledBucket、農業lastUpdatedMinuteなどは保存時間以下。時間を進めていないのに再ロードで成長・売上が発生しない。
- 秘境の知識・権限は独立。旧回想・小包は保護。生成AIの不正文字列は表示しないがゲーム状態を巻き戻さない。

## 書込・復旧・転送

**SAVE-04 [DESIGN]** 自動保存はイベント確定後/定期的/安全なメニュー遷移時。毎フレーム同期書込をしない。データ量が増える場合は非同期で最新snapshotを保存し、書き込み順序を管理。直近成功revisionと前回成功revisionを保持できる範囲で保持。書き込み失敗・容量不足時は「未保存」と明示し、古い正常データを上書き破棄しない。タブを閉じるイベントのみに依存しない。複数タブからの保存競合をrevision/単一書込制御で防ぎ、古いタブが新しいデータを消さないようにする。

**SAVE-05 [DESIGN]** ユーザーの任意エクスポート（JSON等、版と作成日時）/インポート（構文・サイズ・バージョン・内容検証、既存との差分/上書き確認、バックアップ）。ブラウザのデータ消去・オリジン変更で失われる可能性を説明。IndexedDBの利用は永続性を保証しない。旧GitHub Pages→Cloudflareの転送は既存仕組みを維持。大規模な新生活データをURLハッシュに詰め込む前提を置かず、容量制限に応じ明示的な書出/読込方式へ。ゲームリセットは旧機能/設定保持の規約を調べ、新生活データの削除範囲を確認したうえで実施。AI設定や文章キャッシュの削除範囲も説明。

## テスト

新旧save fixture、旧通知/御朱印/回想、購入→制作→陳列→販売→回収、伐採→建築→栽培、保存/再読込/時間ジャンプ、破損/未知版/クォータ失敗/多重保存/転送/エクスポート、AI不使用時の動作。旧セーブを上書きしてしまう移行はリリースしない。詳細は [受け入れテスト](acceptance-tests.md)。

## フェーズ1・2の実装記録

2026-11-25の対象版、遊べる範囲、保存形式、検証結果と未検証の項目は[実装と検版記録](../raw/2026-11-25-phase-1-2-verification.md)に記載した。

## 関連ページ

- [調査ベースライン](current-repository.md)
- [データ契約](architecture.md)
- [時計](world-clock.md)
- [差分](building.md)
- [経済](market-and-trade.md)
- [旧物語](festival-story-boundary.md)
- [テスト](acceptance-tests.md)
