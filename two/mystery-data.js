// 十五景もち寄り帖 ― 消された続き（改訂版）
// The conditions, effects and exhibit IDs are shared by the field and court.

export const cases = [
  {
    "id": "C01",
    "titleJa": "消えた祝い杵",
    "originRegion": "dawn",
    "tier": 1,
    "requesterNpcId": "NPC_KINEKICHI",
    "startLocationId": "LOC_DAWN_REQUEST",
    "prerequisites": {
      "all": []
    },
    "premiseJa": "祭に使う予備の祝い杵が、棚から消えた。",
    "goalsJa": [
      "普段の杵と祝い杵を区別する",
      "現物と修理の記録を照合する",
      "持出しの理由と無断だったことを説明する",
      "杵を取り戻す依頼と、祝い役への出演を区別する"
    ],
    "mandatoryEvidenceIds": [
      "EV_C01_02",
      "EV_C01_04",
      "EV_C01_05",
      "EV_C01_06",
      "EV_C01_07",
      "EV_C07_13"
    ],
    "inferenceIds": [
      "INF_C01_01"
    ],
    "requiredInferenceIds": [
      "INF_C01_01"
    ],
    "trialId": null,
    "resolvedFactId": "EV_C01_90",
    "offerDialogueId": "D_C01_OFFER",
    "resolutionDialogueId": "D_C01_RESOLVE",
    "followupCases": [
      "C02",
      "C03"
    ],
    "requiredAcceptance": true,
    "completionCondition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        },
        {
          "op": "hasInference",
          "id": "INF_C01_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_13"
        }
      ]
    },
    "requestScopeJa": "引き受けるのは祝い杵を探し、経過を確かめることだけ。杵吉の出演復帰、辞退理由の開示、後任探しを受諾条件や達成条件にしない。"
  },
  {
    "id": "C02",
    "titleJa": "横綱は橋を渡らない",
    "originRegion": "river",
    "tier": 2,
    "requesterNpcId": "NPC_NAKIKICHI",
    "startLocationId": "LOC_RIVER_REQUEST",
    "prerequisites": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C01"
        }
      ]
    },
    "premiseJa": "白い綱の目撃を最後に、横綱が姿を消した。",
    "goalsJa": [
      "綱の所有者と目撃された者を分ける",
      "横綱の無事と意思を本人に確かめる",
      "失踪記録を訂正する"
    ],
    "mandatoryEvidenceIds": [
      "EV_C02_02",
      "EV_C02_03",
      "EV_C02_07"
    ],
    "inferenceIds": [
      "INF_C02_01",
      "INF_C02_02"
    ],
    "requiredInferenceIds": [
      "INF_C02_02"
    ],
    "trialId": null,
    "resolvedFactId": "EV_C02_90",
    "offerDialogueId": "D_C02_OFFER",
    "resolutionDialogueId": "D_C02_RESOLVE",
    "followupCases": [
      "C04"
    ],
    "requiredAcceptance": true,
    "completionCondition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        },
        {
          "op": "hasInference",
          "id": "INF_C02_02"
        }
      ]
    },
    "requestScopeJa": "本人の所在・無事・自由を確かめる。出番への復帰や稽古の中断を依頼の達成条件にしない。"
  },
  {
    "id": "C03",
    "titleJa": "十杯あるのに、足りない米",
    "originRegion": "market",
    "tier": 2,
    "requesterNpcId": "NPC_TAWARATA",
    "startLocationId": "LOC_MARKET_REQUEST",
    "prerequisites": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C01"
        }
      ]
    },
    "premiseJa": "十杯分の米が八杯に。運び手が疑われている。",
    "goalsJa": [
      "同じ米を同じ条件で量る",
      "取引当時の器具を特定する",
      "運び手の疑いを晴らして不足を弁済する"
    ],
    "mandatoryEvidenceIds": [
      "EV_C03_01",
      "EV_C03_02",
      "EV_C03_03",
      "EV_C03_04",
      "EV_C03_05",
      "EV_C03_06",
      "EV_C03_07",
      "EV_C03_08"
    ],
    "inferenceIds": [
      "INF_C03_01",
      "INF_C03_02"
    ],
    "requiredInferenceIds": [
      "INF_C03_01",
      "INF_C03_02"
    ],
    "trialId": null,
    "resolvedFactId": "EV_C03_90",
    "offerDialogueId": "D_C03_OFFER",
    "resolutionDialogueId": "D_C03_RESOLVE",
    "followupCases": [
      "C04"
    ],
    "requiredAcceptance": true,
    "completionCondition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        }
      ]
    }
  },
  {
    "id": "C04",
    "titleJa": "晴れの日の、閉じた一行",
    "originRegion": "inari",
    "tier": 3,
    "requesterNpcId": "NPC_KUZUHA",
    "startLocationId": "LOC_INARI_MIDDLE",
    "prerequisites": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C02"
        },
        {
          "op": "caseSolved",
          "id": "C03"
        }
      ]
    },
    "premiseJa": "花嫁は祭を辞退したのか。晴れた日の手紙には、見えない続きがあった。",
    "goalsJa": [
      "天気雨と紙の構造を調べる",
      "全文と独立した控えを比べる",
      "代理参加の意味を訂正して届ける"
    ],
    "mandatoryEvidenceIds": [
      "EV_C04_01",
      "EV_C04_02",
      "EV_C04_03",
      "EV_C04_04",
      "EV_C04_05",
      "EV_C04_06",
      "EV_C04_07"
    ],
    "inferenceIds": [
      "INF_C04_01",
      "INF_C04_02"
    ],
    "requiredInferenceIds": [
      "INF_C04_01",
      "INF_C04_02"
    ],
    "trialId": null,
    "resolvedFactId": "EV_C04_90",
    "offerDialogueId": "D_C04_OFFER",
    "resolutionDialogueId": "D_C04_RESOLVE",
    "followupCases": [
      "C05",
      "C06"
    ],
    "requiredAcceptance": true,
    "completionCondition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        },
        {
          "op": "hasInference",
          "id": "INF_C04_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C04_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C04_07"
        }
      ]
    }
  },
  {
    "id": "C05",
    "titleJa": "海底の蔵と、消えた三十俵",
    "originRegion": "ryugu",
    "tier": 4,
    "requesterNpcId": "NPC_SHIOZO",
    "startLocationId": "LOC_RYUGU_REQUEST",
    "prerequisites": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "premiseJa": "竜宮を含む世界の保管蔵に、三十俵の不足があるとされた。",
    "goalsJa": [
      "三便の出荷・預替・現存を照合する",
      "京で各主張を具体的な札と反証する",
      "架空の不足を取り除く"
    ],
    "mandatoryEvidenceIds": [
      "EV_C05_01",
      "EV_C05_02",
      "EV_C05_03",
      "EV_C05_04",
      "EV_C05_05",
      "EV_C05_06",
      "EV_C05_07",
      "EV_C05_08",
      "EV_C05_09",
      "EV_C05_10",
      "EV_C05_11",
      "EV_C05_12"
    ],
    "inferenceIds": [
      "INF_C05_01",
      "INF_C05_02"
    ],
    "requiredInferenceIds": [
      "INF_C05_01",
      "INF_C05_02"
    ],
    "trialId": "TR_C05",
    "resolvedFactId": "EV_C05_90",
    "offerDialogueId": "D_C05_OFFER",
    "resolutionDialogueId": "D_C05_RESOLVE",
    "followupCases": [
      "C07"
    ],
    "requiredAcceptance": true,
    "completionCondition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        },
        {
          "op": "hasInference",
          "id": "INF_C05_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C05_02"
        },
        {
          "op": "trialWon",
          "id": "TR_C05"
        }
      ]
    },
    "hearingOrder": {
      "parallelGroup": "PARTIAL_HEARINGS_C05_C06",
      "unorderedWithCaseId": "C06",
      "mustFollowEventId": "EVT_C07_SUBMIT",
      "mustPrecedeEventId": "EVT_C07",
      "sourceEventsRemainBeforeIncidents": true
    }
  },
  {
    "id": "C06",
    "titleJa": "祈りの名簿は、誰の願いか",
    "originRegion": "todaiji",
    "tier": 4,
    "requesterNpcId": "NPC_TOAN",
    "startLocationId": "LOC_TODAIJI_REQUEST",
    "prerequisites": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "premiseJa": "大餅仏に祈った者の名が、里の祭をやめる連名書に載っている。",
    "goalsJa": [
      "毎日の祈りと三分割の票を体験する",
      "各地の本人控えと寺の原本片をつなぐ",
      "京で署名と同意を分けて示す",
      "取消同意を根拠にした一括移管を仮止めし、個々の参加意思を保留したまま次の審理へ進む"
    ],
    "mandatoryEvidenceIds": [
      "EV_C06_01",
      "EV_C06_02",
      "EV_C06_03",
      "EV_C06_04",
      "EV_C06_05",
      "EV_C06_06",
      "EV_C06_07",
      "EV_C06_08",
      "EV_C06_09"
    ],
    "inferenceIds": [
      "INF_C06_01",
      "INF_C06_02"
    ],
    "requiredInferenceIds": [
      "INF_C06_01",
      "INF_C06_02"
    ],
    "trialId": "TR_C06",
    "resolvedFactId": "EV_C06_90",
    "offerDialogueId": "D_C06_OFFER",
    "resolutionDialogueId": "D_C06_RESOLVE",
    "followupCases": [
      "C07"
    ],
    "requiredAcceptance": true,
    "completionCondition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        },
        {
          "op": "hasInference",
          "id": "INF_C06_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C06_02"
        },
        {
          "op": "trialWon",
          "id": "TR_C06"
        }
      ]
    },
    "provisionalOutcomeJa": "この署名束を根拠にした各里の催しの取消と、祭用物資の一括移管を仮止めする。個人の辞退や任意の共同炊事を無効にせず、筆丸個人の故意は最終審理で確かめる。",
    "hearingOrder": {
      "parallelGroup": "PARTIAL_HEARINGS_C05_C06",
      "unorderedWithCaseId": "C05",
      "mustFollowEventId": "EVT_C07_SUBMIT",
      "mustPrecedeEventId": "EVT_C07",
      "sourceEventsRemainBeforeIncidents": true
    }
  },
  {
    "id": "C07",
    "titleJa": "大文字の夜、消された続き",
    "originRegion": "kyo",
    "tier": 5,
    "requesterNpcId": "NPC_HABUMI",
    "startLocationId": "LOC_KYO_REQUEST",
    "prerequisites": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C05"
        },
        {
          "op": "caseSolved",
          "id": "C06"
        }
      ]
    },
    "premiseJa": "お餅が聞いた本物の相談が、助かった返事を失い、いまも各里が立ちゆかない証拠として提出されている。",
    "goalsJa": [
      "大文字の視点と当夜の独立した立会いを分けて検証する",
      "墨の反転と原票の対応から、解決後の紙が切り取られた順序を再構成する",
      "真実の相談、解決後の返事、提出時の虚偽の現在形を区別して責任を立証する",
      "自分たちに都合の悪い本物の辞退も、消さずに判決へ残す"
    ],
    "mandatoryEvidenceIds": [
      "EV_C07_01",
      "EV_C07_02",
      "EV_C07_03",
      "EV_C07_04",
      "EV_C07_05",
      "EV_C07_06",
      "EV_C07_07",
      "EV_C07_08",
      "EV_C07_09",
      "EV_C07_10",
      "EV_C07_11",
      "EV_C01_90",
      "EV_C02_90",
      "EV_C03_90",
      "EV_C04_90",
      "EV_C05_90",
      "EV_C06_90",
      "EV_C01_06",
      "EV_C01_07",
      "EV_C03_08",
      "EV_C07_12",
      "EV_C07_13"
    ],
    "inferenceIds": [
      "INF_C07_01",
      "INF_C07_02",
      "INF_C07_03",
      "INF_C07_04",
      "INF_C07_05"
    ],
    "requiredInferenceIds": [
      "INF_C07_01",
      "INF_C07_02",
      "INF_C07_03",
      "INF_C07_04",
      "INF_C07_05"
    ],
    "trialId": "TR_C07",
    "resolvedFactId": "EV_C07_90",
    "offerDialogueId": "D_C07_OFFER",
    "resolutionDialogueId": "D_C07_RESOLVE",
    "followupCases": [],
    "requiredAcceptance": true,
    "completionCondition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_02"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_03"
        },
        {
          "op": "trialWon",
          "id": "TR_C07"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_04"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_05"
        }
      ]
    }
  }
];

export const npcs = [
  {
    "id": "NPC_KINEKICHI",
    "nameJa": "杵吉",
    "species": "rabbit",
    "roleJa": "祝い餅のつき手・一搗き役を本年より返上した者",
    "sourceBinding": {
      "mode": "existing_npc",
      "legacyId": "rabbit-42",
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_DAWN_REQUEST",
    "appearanceAssetId": "AS_NPC_KINEKICHI",
    "caseIds": [
      "C01",
      "C07"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_KAEKICHI",
    "nameJa": "返吉",
    "species": "frog",
    "roleJa": "餅の返し手",
    "sourceBinding": {
      "mode": "existing_npc",
      "legacyId": "frog-43",
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_DAWN_REQUEST",
    "appearanceAssetId": "AS_NPC_KAEKICHI",
    "caseIds": [
      "C01"
    ],
    "locationOverrides": [],
    "spawnOffset": {
      "x": 0.5085355104,
      "z": 1.8910028119
    }
  },
  {
    "id": "NPC_TSUGUMARU",
    "nameJa": "継丸",
    "species": "frog",
    "roleJa": "道具の修繕屋",
    "sourceBinding": {
      "mode": "new_story_actor",
      "legacyId": null,
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_DAWN_BENCH",
    "appearanceAssetId": "AS_NPC_TSUGUMARU",
    "caseIds": [
      "C01"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_FUDEM",
    "nameJa": "筆丸",
    "species": "monkey",
    "roleJa": "祭の記録係・一つ臼の申立人",
    "sourceBinding": {
      "mode": "new_story_actor",
      "legacyId": null,
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_DAWN_RECORDER",
    "appearanceAssetId": "AS_NPC_FUDEM",
    "caseIds": [
      "C01",
      "C02",
      "C03",
      "C04",
      "C05",
      "C06",
      "C07"
    ],
    "locationOverrides": [
      {
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C01"
            }
          ]
        },
        "locationId": "LOC_KYO_ARCHIVE",
        "reasonJa": "初事件後は京の記録所で各地の報告を受け取る。"
      },
      {
        "condition": {
          "all": [
            {
              "op": "flagEquals",
              "id": "trialActive",
              "value": "TR_C07"
            }
          ]
        },
        "locationId": "LOC_KYO_WITNESS",
        "reasonJa": "最終審理で自分の提出内容について証言する。"
      }
    ]
  },
  {
    "id": "NPC_NAKIKICHI",
    "nameJa": "鳴吉",
    "species": "frog",
    "roleJa": "相撲の呼出し",
    "sourceBinding": {
      "mode": "existing_npc",
      "legacyId": "frog-1",
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_RIVER_REQUEST",
    "appearanceAssetId": "AS_NPC_NAKIKICHI",
    "caseIds": [
      "C02"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_ASHINOYAMA",
    "nameJa": "芦ノ山",
    "species": "frog",
    "roleJa": "横綱・休場して手返しを習う者",
    "sourceBinding": {
      "mode": "new_story_actor",
      "legacyId": null,
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_TERRACES_PRACTICE",
    "appearanceAssetId": "AS_NPC_ASHINOYAMA",
    "caseIds": [
      "C02",
      "C07"
    ],
    "locationOverrides": [
      {
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C02"
            }
          ]
        },
        "locationId": "LOC_RIVER_SUMO_RETURN",
        "reasonJa": "解決後は桜川へ自分の意思で戻るが、出演は約束しない。茶と休みを取れる私的な場所にいる。"
      }
    ],
    "recordLocationIds": [
      "LOC_MOON_PRACTICE"
    ],
    "postResolutionActivityJa": "観客のいない場所で休む。再出場・実演・無償の指導を自動で始めない。"
  },
  {
    "id": "NPC_SHIROASHI",
    "nameJa": "白足",
    "species": "rabbit",
    "roleJa": "鹿に乗る配達兎",
    "sourceBinding": {
      "mode": "existing_npc",
      "legacyId": "rabbit-3",
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_RIVER_TEABENCH",
    "appearanceAssetId": "AS_NPC_SHIROASHI",
    "caseIds": [
      "C02"
    ],
    "locationOverrides": [],
    "companionLegacyId": "deer-623",
    "stationaryInterviewRequired": true
  },
  {
    "id": "NPC_TAWARATA",
    "nameJa": "俵太",
    "species": "rabbit",
    "roleJa": "米の運び手",
    "sourceBinding": {
      "mode": "existing_npc",
      "legacyId": "rabbit-12",
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_MARKET_REQUEST",
    "appearanceAssetId": "AS_NPC_TAWARATA",
    "caseIds": [
      "C03"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_TAWARAKURO",
    "nameJa": "俵九郎",
    "species": "fox",
    "roleJa": "米商",
    "sourceBinding": {
      "mode": "new_story_actor",
      "legacyId": null,
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_MARKET_DEALER",
    "appearanceAssetId": "AS_NPC_TAWARAKURO",
    "caseIds": [
      "C03"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_MASUME",
    "nameJa": "枡目",
    "species": "frog",
    "roleJa": "標準枡の番人",
    "sourceBinding": {
      "mode": "existing_npc",
      "legacyId": "frog-222",
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_TERRACES_STANDARD",
    "appearanceAssetId": "AS_NPC_MASUME",
    "caseIds": [
      "C03"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_TAKEJI",
    "nameJa": "竹次",
    "species": "frog",
    "roleJa": "工房の書き手・木工職人",
    "sourceBinding": {
      "mode": "existing_npc",
      "legacyId": "frog-122",
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_SHRINE_WORKSHOP",
    "appearanceAssetId": "AS_NPC_TAKEJI",
    "caseIds": [
      "C03"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_YUKITSUZURI",
    "nameJa": "雪綴",
    "species": "frog",
    "roleJa": "書き物の綴じ手",
    "sourceBinding": {
      "mode": "existing_npc",
      "legacyId": "frog-323",
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_SNOW_BINDER",
    "appearanceAssetId": "AS_NPC_YUKITSUZURI",
    "caseIds": [
      "C06",
      "C07"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_KUZUHA",
    "nameJa": "葛葉",
    "species": "fox",
    "roleJa": "稲荷の花嫁・京の当日出席を断った者",
    "sourceBinding": {
      "mode": "new_story_actor",
      "legacyId": null,
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_INARI_MIDDLE",
    "appearanceAssetId": "AS_NPC_KUZUHA",
    "caseIds": [
      "C04"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_KOSAME",
    "nameJa": "小雨",
    "species": "fox",
    "roleJa": "稲荷の使い・午前の代理を引き受けた者",
    "sourceBinding": {
      "mode": "new_story_actor",
      "legacyId": null,
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_INARI_LOWER",
    "appearanceAssetId": "AS_NPC_KOSAME",
    "caseIds": [
      "C04"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_AIZO",
    "nameJa": "藍蔵",
    "species": "rabbit",
    "roleJa": "楓峡の染め手",
    "sourceBinding": {
      "mode": "existing_npc",
      "legacyId": "rabbit-336",
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_AUTUMN_DYER",
    "appearanceAssetId": "AS_NPC_AIZO",
    "caseIds": [
      "C04"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_MOMONE",
    "nameJa": "桃音",
    "species": "rabbit",
    "roleJa": "桃源郷の婚礼の招待客・控えの保管者",
    "sourceBinding": {
      "mode": "new_story_actor",
      "legacyId": null,
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_PEACH_WEDDING",
    "appearanceAssetId": "AS_NPC_MOMONE",
    "caseIds": [
      "C04",
      "C05"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_SHIOZO",
    "nameJa": "潮蔵",
    "species": "turtle",
    "roleJa": "竜宮の荷預かり",
    "sourceBinding": {
      "mode": "new_story_actor",
      "legacyId": null,
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_RYUGU_REQUEST",
    "appearanceAssetId": "AS_NPC_SHIOZO",
    "caseIds": [
      "C05"
    ],
    "locationOverrides": [
      {
        "condition": {
          "all": [
            {
              "op": "flagEquals",
              "id": "trialActive",
              "value": "TR_C05"
            }
          ]
        },
        "locationId": "LOC_KYO_WITNESS",
        "reasonJa": "開廷時だけ旅支度で証言席に着く。"
      }
    ],
    "appearanceVariants": {
      "court": "damp travel shawl; same turtle identity"
    }
  },
  {
    "id": "NPC_NAMISUKE",
    "nameJa": "波助",
    "species": "frog",
    "roleJa": "松原の網直し・荷継ぎ役",
    "sourceBinding": {
      "mode": "existing_npc",
      "legacyId": "frog-266",
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_COAST_TRANSFER",
    "appearanceAssetId": "AS_NPC_NAMISUKE",
    "caseIds": [
      "C05"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_TOAN",
    "nameJa": "灯庵",
    "species": "deer",
    "roleJa": "大餅仏の祈りの世話役",
    "sourceBinding": {
      "mode": "new_story_actor",
      "legacyId": null,
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_TODAIJI_REQUEST",
    "appearanceAssetId": "AS_NPC_TOAN",
    "caseIds": [
      "C06",
      "C07"
    ],
    "locationOverrides": [
      {
        "condition": {
          "all": [
            {
              "op": "flagEquals",
              "id": "trialActive",
              "value": "TR_C06"
            }
          ]
        },
        "locationId": "LOC_KYO_WITNESS",
        "reasonJa": "祈りの記録の作り方を京で証言する。"
      }
    ]
  },
  {
    "id": "NPC_SUZUNA",
    "nameJa": "鈴菜",
    "species": "rabbit",
    "roleJa": "薄野の寺の書き手・手返しの師・参拝者",
    "sourceBinding": {
      "mode": "existing_npc",
      "legacyId": "rabbit-372",
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_MOON_TEMPLE",
    "appearanceAssetId": "AS_NPC_SUZUNA",
    "caseIds": [
      "C02",
      "C06"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_YUKEMARU",
    "nameJa": "湯気丸",
    "species": "frog",
    "roleJa": "峠の宿の番・共同運営を望む参拝者",
    "sourceBinding": {
      "mode": "existing_npc",
      "legacyId": "frog-203",
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_SPRING_INN",
    "appearanceAssetId": "AS_NPC_YUKEMARU",
    "caseIds": [
      "C03",
      "C06"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_HABUMI",
    "nameJa": "羽文",
    "species": "rabbit",
    "roleJa": "京の配達役",
    "sourceBinding": {
      "mode": "new_story_actor",
      "legacyId": null,
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_KYO_REQUEST",
    "appearanceAssetId": "AS_NPC_HABUMI",
    "caseIds": [
      "C07"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_SHIRAE",
    "nameJa": "白枝",
    "species": "deer",
    "roleJa": "京の評定役",
    "sourceBinding": {
      "mode": "new_story_actor",
      "legacyId": null,
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_KYO_JUDGE",
    "appearanceAssetId": "AS_NPC_SHIRAE",
    "caseIds": [
      "C05",
      "C06",
      "C07"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_NAOKI",
    "nameJa": "直記",
    "species": "frog",
    "roleJa": "京の評定所の書記",
    "sourceBinding": {
      "mode": "new_story_actor",
      "legacyId": null,
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_KYO_INTAKE",
    "appearanceAssetId": "AS_NPC_NAOKI",
    "caseIds": [
      "C05",
      "C06",
      "C07"
    ],
    "locationOverrides": []
  },
  {
    "id": "NPC_TOKA",
    "nameJa": "灯火",
    "species": "rabbit",
    "roleJa": "京の見晴らし番",
    "sourceBinding": {
      "mode": "new_story_actor",
      "legacyId": null,
      "preserveDelivery": true
    },
    "homeLocationId": "LOC_KYO_EAST_VIEW",
    "appearanceAssetId": "AS_NPC_TOKA",
    "caseIds": [
      "C07"
    ],
    "locationOverrides": []
  }
];

export const locations = [
  {
    "id": "LOC_DAWN_REQUEST",
    "nameJa": "祝い杵の置き場の前",
    "regionId": "dawn",
    "position": {
      "x": 306.756923,
      "y": 4.912847,
      "z": 168.737026
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "臼の兎・杵吉に話す。消えるのは予備の祝い杵で、動作中の杵ではない。",
    "caseIds": [
      "C01"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 304.6,
        "y": 4.898636,
        "z": 168.8
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_DAWN_RACK",
    "nameJa": "予備の祝い杵を掛ける台",
    "regionId": "dawn",
    "position": {
      "x": 310.2,
      "y": 4.619777,
      "z": 167.7
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "臼の脇に新設する予備杵の台。欠片・台の跡を調べる。",
    "caseIds": [
      "C01"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 308.8,
        "y": 4.890797,
        "z": 166.6
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_DAWN_BENCH",
    "nameJa": "浦の宿の修繕台",
    "regionId": "dawn",
    "position": {
      "x": 286.052897,
      "y": 5.563317,
      "z": 160.81166
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "宿の西側に新設する小さな修繕台と乾燥棚。継丸と修理された祝い杵。",
    "caseIds": [
      "C01"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 287.494821,
        "y": 5.563317,
        "z": 161.412372
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_DAWN_RECORDER",
    "nameJa": "浦の記録係の小机",
    "regionId": "dawn",
    "position": {
      "x": 292,
      "y": 5.073126,
      "z": 165
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "最初の報告と訂正を筆丸が受け取る小机。",
    "caseIds": [
      "C01",
      "C07"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 291.1,
        "y": 5.025194,
        "z": 166.5
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_RIVER_REQUEST",
    "nameJa": "桜川の相撲場",
    "regionId": "river",
    "position": {
      "x": 4.1,
      "y": 4.28978,
      "z": 52
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "呼出し・鳴吉が横綱不在を相談する。既存の取組は残す。",
    "caseIds": [
      "C02"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 2,
        "y": 4.301807,
        "z": 51.2
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_RIVER_BRIDGE",
    "nameJa": "桜川大橋の南たもと",
    "regionId": "river",
    "position": {
      "x": 1.2,
      "y": 2.98282,
      "z": 34
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "橋の見え方と通った者の姿を確認する観察点。",
    "caseIds": [
      "C02"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 0.1,
        "y": 2.98282,
        "z": 34
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_RIVER_TEABENCH",
    "nameJa": "渡しの茶屋の腰掛け",
    "regionId": "river",
    "position": {
      "x": -32.2,
      "y": 3.500422,
      "z": 53.3
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "白足の固定聞き取り場所。借りた綱と折り畳んだ伝言を確認する。",
    "caseIds": [
      "C02"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": -31.1,
        "y": 3.547701,
        "z": 54.6
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_RIVER_SUMO_RETURN",
    "nameJa": "桜川の稽古見学席",
    "regionId": "river",
    "position": {
      "x": 8.4,
      "y": 4.49918,
      "z": 56
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "解決後の芦ノ山が、力ではなく手加減の稽古を見せる。",
    "caseIds": [
      "C02",
      "C07"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 9.9,
        "y": 4.499988,
        "z": 56.9
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_TERRACES_PRACTICE",
    "nameJa": "棚田の手返し稽古台",
    "regionId": "terraces",
    "position": {
      "x": 150,
      "y": 15.632585,
      "z": 113
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "芦ノ山の現在の稽古場所。稽古の型と本人の無事、自発的な外出を確認する。",
    "caseIds": [
      "C02"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 148.8,
        "y": 15.668177,
        "z": 113.8
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_MOON_PRACTICE",
    "nameJa": "薄野の稽古予約の控え台",
    "regionId": "moon",
    "position": {
      "x": -47.5,
      "y": 12.649976,
      "z": 280
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "鈴菜が残した稽古の予約控え。行き先は棚田。本人をここへ重複配置しない。",
    "caseIds": [
      "C02"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": -46.1,
        "y": 12.533385,
        "z": 281
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_MARKET_REQUEST",
    "nameJa": "蔵町の荷受け広場",
    "regionId": "market",
    "position": {
      "x": 13,
      "y": 3.011008,
      "z": -59
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "運び手・俵太が、米を抜いたと疑われている事情を話す。",
    "caseIds": [
      "C03"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 11.5,
        "y": 2.995776,
        "z": -58
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_MARKET_DEALER",
    "nameJa": "俵九郎の米売り場",
    "regionId": "market",
    "position": {
      "x": 29,
      "y": 3.236797,
      "z": -60
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "米商・俵九郎の店先。問題の枡と受払控えを示す。",
    "caseIds": [
      "C03"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 28,
        "y": 3.231145,
        "z": -61.4
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_MARKET_SCALE",
    "nameJa": "蔵町の比較台",
    "regionId": "market",
    "position": {
      "x": 25,
      "y": 3.218419,
      "z": -64
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "標準枡と問題の枡を同じ米で比較する新設の検分台。",
    "caseIds": [
      "C03"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 23.5,
        "y": 3.192976,
        "z": -64
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_TERRACES_STANDARD",
    "nameJa": "棚田の標準枡の工房",
    "regionId": "terraces",
    "position": {
      "x": 174.41411,
      "y": 21.941705,
      "z": 131.353812
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "枡目が保管する標準枡と、同じ日の米の見本。",
    "caseIds": [
      "C03"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 173.292744,
        "y": 21.941705,
        "z": 133.338084
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_SHRINE_WORKSHOP",
    "nameJa": "竹隠れの書き物工房",
    "regionId": "shrine",
    "position": {
      "x": -172.145146,
      "y": 27.894736,
      "z": -113.55043
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "竹次の工房。差し板の注文記録と仕事道具を確かめる。",
    "caseIds": [
      "C03"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": -174.059856,
        "y": 27.894736,
        "z": -111.503596
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_SHRINE_CHARTER",
    "nameJa": "竹隠れの古い約定掲示",
    "regionId": "shrine",
    "position": {
      "x": -158.9,
      "y": 19.719631,
      "z": -87.7
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "最初から公開されている祭の約定。写しを手帖に残せる。",
    "caseIds": [
      "C03",
      "C07"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": -158,
        "y": 19.35018,
        "z": -86.4
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_SPRING_INN",
    "nameJa": "峠の宿の記録と見本",
    "regionId": "spring",
    "position": {
      "x": 153.808304,
      "y": 34.020982,
      "z": -138.620384
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "湯気丸が乾燥見本と祈りの半券を見せる。",
    "caseIds": [
      "C03",
      "C06"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 151.452308,
        "y": 34.020982,
        "z": -136.43838
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_INARI_LOWER",
    "nameJa": "稲荷の下の踊り場",
    "regionId": "inari",
    "position": {
      "x": -193,
      "y": 6.522819,
      "z": -383.8
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "小雨の配達机。第一の行列は練習組と明示される。",
    "caseIds": [
      "C04"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": -191.4,
        "y": 6.522819,
        "z": -383.8
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_INARI_MIDDLE",
    "nameJa": "葛葉の婚礼の踊り場",
    "regionId": "inari",
    "position": {
      "x": -211,
      "y": 34.587963,
      "z": -442
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "葛葉の本番の婚礼と手紙を確認する中段。",
    "caseIds": [
      "C04"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": -209.3,
        "y": 34.587963,
        "z": -441.6
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_INARI_UPPER",
    "nameJa": "稲荷奥社の軒外机",
    "regionId": "inari",
    "position": {
      "x": -145.5,
      "y": 81.990671,
      "z": -535
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "濡れた紙と糊の順序を再現する記録机。天気待ちは不要。",
    "caseIds": [
      "C04"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": -144,
        "y": 81.97618,
        "z": -534.4
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_AUTUMN_DYER",
    "nameJa": "楓峡の染め工房",
    "regionId": "autumn",
    "position": {
      "x": 275.337032,
      "y": 19.671462,
      "z": -128.869905
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "藍蔵が布と糊の対照見本を用意する。",
    "caseIds": [
      "C04"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 274.334625,
        "y": 19.671462,
        "z": -126.578069
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_PEACH_WEDDING",
    "nameJa": "桃源郷の招待状の控え",
    "regionId": "peach",
    "position": {
      "x": -395,
      "y": 5.699762,
      "z": -87
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "桃音が受け取った招待状の控えを見せる。",
    "caseIds": [
      "C04"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": -393.5,
        "y": 5.807025,
        "z": -86.7
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_RYUGU_REQUEST",
    "nameJa": "竜宮前庭の潮蔵",
    "regionId": "ryugu",
    "position": {
      "x": -326,
      "y": -27.84,
      "z": 135
    },
    "yReference": "seabed_offset",
    "yOffsetMeters": 0.16,
    "descriptionJa": "前庭の保管係・潮蔵。潜水したまま話せる。",
    "caseIds": [
      "C05"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": true,
      "requiresGrounded": false,
      "playerStand": {
        "x": -324.6,
        "y": -27.55,
        "z": 136
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_RYUGU_LEDGER",
    "nameJa": "前庭の防水受領板",
    "regionId": "ryugu",
    "position": {
      "x": -329,
      "y": -27.84,
      "z": 142
    },
    "yReference": "seabed_offset",
    "yOffsetMeters": 0.16,
    "descriptionJa": "水中でも読める荷受けの記録板。宮殿の閉じた室内へは入らない。",
    "caseIds": [
      "C05"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": true,
      "requiresGrounded": false,
      "playerStand": {
        "x": -327.7,
        "y": -27.55,
        "z": 142.4
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_RYUGU_CRATES",
    "nameJa": "前庭の十二俵の保管棚",
    "regionId": "ryugu",
    "position": {
      "x": -326,
      "y": -27.84,
      "z": 128
    },
    "yReference": "seabed_offset",
    "yOffsetMeters": 0.16,
    "descriptionJa": "A17の十二俵の番号を、棚の外から照合する。",
    "caseIds": [
      "C05"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": true,
      "requiresGrounded": false,
      "playerStand": {
        "x": -324.5,
        "y": -27.55,
        "z": 128.1
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_COAST_TRANSFER",
    "nameJa": "松原の網工房の荷継ぎ控え",
    "regionId": "coast",
    "position": {
      "x": -177.937481,
      "y": 5.226196,
      "z": 136.796513
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "波助の網工房。A17の中継受領と引渡しを確認する。",
    "caseIds": [
      "C05"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": -178.881792,
        "y": 5.226196,
        "z": 139.382135
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_TERRACES_DISPATCH",
    "nameJa": "棚田の十二俵の出荷札",
    "regionId": "terraces",
    "position": {
      "x": 130.300254,
      "y": 16.016526,
      "z": 126.89577
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "A17の出荷元。十二俵の通し番号と送り先。",
    "caseIds": [
      "C05"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 131.681726,
        "y": 16.016526,
        "z": 127.968866
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_DAWN_DISPATCH",
    "nameJa": "浦の八俵の出荷札",
    "regionId": "dawn",
    "position": {
      "x": 290,
      "y": 5.0715,
      "z": 165.8
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "B08の出荷元。楓峡へ渡した八俵の記録。",
    "caseIds": [
      "C05"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 288.6,
        "y": 5.075206,
        "z": 166.2
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_AUTUMN_TRANSFER",
    "nameJa": "楓峡の八俵の荷継ぎ札",
    "regionId": "autumn",
    "position": {
      "x": 272.332351,
      "y": 19.671462,
      "z": -126.293637
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "B08が雪の都へ移ったことを示す引渡し控え。",
    "caseIds": [
      "C05"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 274.094303,
        "y": 19.671462,
        "z": -125.984566
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_SNOW_STORE",
    "nameJa": "雪灯りの米蔵",
    "regionId": "snow",
    "position": {
      "x": -97.295933,
      "y": 10.267602,
      "z": -263.433822
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "B08の八俵を現に保管している米屋。棚の番号を外から読める。",
    "caseIds": [
      "C05"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": -95.829646,
        "y": 10.267602,
        "z": -263.009556
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_PEACH_DISPATCH",
    "nameJa": "桃源郷の十俵の出荷机",
    "regionId": "peach",
    "position": {
      "x": -399,
      "y": 5.411324,
      "z": -91
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "C10の出荷元。十俵の送り状と里の印。",
    "caseIds": [
      "C05"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": -398,
        "y": 5.477526,
        "z": -89.5
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_SHRINE_TRANSFER",
    "nameJa": "竹隠れの十俵の引渡し机",
    "regionId": "shrine",
    "position": {
      "x": -130.938569,
      "y": 25.552271,
      "z": -104.423849
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "C10を蔵町へ引き渡した控え。",
    "caseIds": [
      "C05"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": -129.355565,
        "y": 25.552271,
        "z": -103.940012
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_MARKET_STORE",
    "nameJa": "蔵町の十俵の保管棚",
    "regionId": "market",
    "position": {
      "x": 20.403022,
      "y": 3.791363,
      "z": -38.140224
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "C10が現在ここにあることを通し番号で確かめる。",
    "caseIds": [
      "C05"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 21.781572,
        "y": 3.791363,
        "z": -37.223927
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_TODAIJI_REQUEST",
    "nameJa": "東大寺の祈りの受付",
    "regionId": "todaiji",
    "position": {
      "x": 215,
      "y": 5.8,
      "z": 428
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "灯庵が祈りの名簿について相談する。",
    "caseIds": [
      "C06"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 216.6,
        "y": 5.8,
        "z": 428.5
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_TODAIJI_PRAYER",
    "nameJa": "大餅仏前の朝の祈り",
    "regionId": "todaiji",
    "position": {
      "x": 215,
      "y": 5.8,
      "z": 423
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "奉納の盆・祈りの見出し・半券を同時に確認できる新しい儀礼台。",
    "caseIds": [
      "C06"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 216.6,
        "y": 5.8,
        "z": 423.5
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_TODAIJI_BACKING",
    "nameJa": "大餅仏前の控え紙の覆い棚",
    "regionId": "todaiji",
    "position": {
      "x": 205.5,
      "y": 5.8,
      "z": 423
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "日ごとの台紙が保管される小さな覆い棚。",
    "caseIds": [
      "C06"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 206.9,
        "y": 5.8,
        "z": 423.6
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_MOON_TEMPLE",
    "nameJa": "薄野の寺の鈴菜",
    "regionId": "moon",
    "position": {
      "x": -66.930957,
      "y": 17.145033,
      "z": 280.947575
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "鈴菜が自分の祈りの半券と日付を見せる。",
    "caseIds": [
      "C06"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": -69.105817,
        "y": 17.145033,
        "z": 282.599002
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_SNOW_BINDER",
    "nameJa": "雪灯りの綴じ工房",
    "regionId": "snow",
    "position": {
      "x": -112.329208,
      "y": 10.186348,
      "z": -305.037747
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "雪綴が保管した半券と、綴じた原稿の由来を確認する。",
    "caseIds": [
      "C06",
      "C07"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": -113.850583,
        "y": 10.186348,
        "z": -302.512481
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_RIVER_RECEIPT",
    "nameJa": "渡しの茶屋に預けた半券",
    "regionId": "river",
    "position": {
      "x": -35.450233,
      "y": 3.980422,
      "z": 49.396011
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "参拝者が預けた日付入りの半券。祈りの記録の対照資料。",
    "caseIds": [
      "C06"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": -33.958938,
        "y": 3.980422,
        "z": 49.705914
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_KYO_REQUEST",
    "nameJa": "京の評定所前の羽文",
    "regionId": "kyo",
    "position": {
      "x": 145.2,
      "y": 5.226102,
      "z": -442.3
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "配達役・羽文が、届いたはずの訂正について相談する。",
    "caseIds": [
      "C07"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 143.7,
        "y": 5.260243,
        "z": -442
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_KYO_COURT",
    "nameJa": "京の評定所・検分席",
    "regionId": "kyo",
    "position": {
      "x": 149,
      "y": 5.627248,
      "z": -450.8
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "第五・第六・第七事件の審理を行う公開の検分席。",
    "caseIds": [
      "C05",
      "C06",
      "C07"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 149,
        "y": 5.627248,
        "z": -448.3
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_KYO_INTAKE",
    "nameJa": "京の評定所・受付",
    "regionId": "kyo",
    "position": {
      "x": 149,
      "y": 5.148372,
      "z": -443.7
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "書記・直記が開廷条件と提出した資料を案内する。",
    "caseIds": [
      "C05",
      "C06",
      "C07"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 150.5,
        "y": 5.175288,
        "z": -442.8
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_KYO_JUDGE",
    "nameJa": "京の評定所・裁定席",
    "regionId": "kyo",
    "position": {
      "x": 149,
      "y": 5.627248,
      "z": -454
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "白枝の裁定席。証言と物証を分けて確認する。",
    "caseIds": [
      "C05",
      "C06",
      "C07"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 149,
        "y": 5.627248,
        "z": -452.4
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_KYO_WITNESS",
    "nameJa": "京の評定所・証言席",
    "regionId": "kyo",
    "position": {
      "x": 145.5,
      "y": 5.627248,
      "z": -450.7
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "審理中の証言者が一名ずつ立つ席。",
    "caseIds": [
      "C05",
      "C06",
      "C07"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 147,
        "y": 5.627248,
        "z": -450.7
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_KYO_ARCHIVE",
    "nameJa": "京の記録所",
    "regionId": "kyo",
    "position": {
      "x": 91,
      "y": 7.720924,
      "z": -449
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "筆丸の提出原稿、受付控え、訂正の原本を照合する記録所。",
    "caseIds": [
      "C07"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 91,
        "y": 7.720924,
        "z": -447.1
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_KYO_AVENUE_VIEW",
    "nameJa": "大通りの大文字観察点",
    "regionId": "kyo",
    "position": {
      "x": 120,
      "y": 5.645563,
      "z": -424
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "大文字が整って見える大通りの観察点。固定事件夜の再現に使う。",
    "caseIds": [
      "C07"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 120,
        "y": 5.645563,
        "z": -424
      },
      "lineOfSightRequired": true
    },
    "reconstructionCamera": {
      "eyeHeightMeters": 1.9,
      "targetWorld": {
        "x": 122,
        "z": -536
      },
      "eventId": "EVT_C07_DAIMONJI",
      "calibrationRequired": true
    }
  },
  {
    "id": "LOC_KYO_EAST_VIEW",
    "nameJa": "京の東筋の待ち合わせ",
    "regionId": "kyo",
    "position": {
      "x": 164,
      "y": 4.925905,
      "z": -467
    },
    "yReference": "groundHeight",
    "yOffsetMeters": 0,
    "descriptionJa": "灯火と会い、東の塔への普通の階段道を案内してもらう。",
    "caseIds": [
      "C07"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 165.5,
        "y": 4.920018,
        "z": -467.2
      },
      "lineOfSightRequired": true
    }
  },
  {
    "id": "LOC_KYO_LOOKOUT",
    "nameJa": "京の東塔・北の回廊",
    "regionId": "kyo",
    "position": {
      "x": 155,
      "y": 20.326773,
      "z": -482.1
    },
    "yReference": "building_storey",
    "yOffsetMeters": 0,
    "descriptionJa": "階段で上がれる東の塔の回廊。筆丸が主張する視点を検分する。",
    "caseIds": [
      "C07"
    ],
    "interaction": {
      "radiusMeters": 2.8,
      "allowSwimming": false,
      "requiresGrounded": true,
      "playerStand": {
        "x": 155,
        "y": 20.326773,
        "z": -482.1
      },
      "lineOfSightRequired": true
    },
    "reconstructionCamera": {
      "eyeHeightMeters": 1.9,
      "targetWorld": {
        "x": 122,
        "z": -536
      },
      "eventId": "EVT_C07_DAIMONJI",
      "calibrationRequired": true
    },
    "floorBinding": {
      "buildingIndexAtBaseline": 50,
      "buildingCenter": {
        "x": 155,
        "z": -479
      },
      "local": {
        "u": 0,
        "v": -3.1
      },
      "storey": 4,
      "floorOffset": 0.48,
      "storeyRise": 3.52
    }
  }
];

export const evidence = [
  {
    "id": "EV_C01_01",
    "caseId": "C01",
    "nameJa": "予備棚の二本の筋",
    "kind": "observation",
    "locationId": "LOC_DAWN_RACK",
    "npcId": "NPC_KINEKICHI",
    "descriptionJa": "祝い杵を置いていた棚。米粉の上に二本の平行な引き跡があり、戸口側へ続く。毎日の餅つきに使う杵は別にある。",
    "establishesJa": "予備の祝い杵が棚から運び出された。動いている餅つきの杵とは別物。",
    "doesNotProveJa": "持ち去った者や、盗む目的までは分からない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C01_E01"
    },
    "sourceEvent": "EVT_C01",
    "assetId": "AS_EV_C01_01",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "臼で動いているのは、いつもの杵。なくなったのは、棚に寝かせたお祝い用の一本なんだ。",
    "consumable": false
  },
  {
    "id": "EV_C01_02",
    "caseId": "C01",
    "nameJa": "三つ又に割れた木片",
    "kind": "physical",
    "locationId": "LOC_DAWN_RACK",
    "npcId": "NPC_KAEKICHI",
    "descriptionJa": "前夜の片付けで拾われた柄の木片。三つ又の割れ面と年輪がある。拾った時点は予備杵が棚にあった時より前。",
    "establishesJa": "柄の割れは持ち去り前からあった。後で発見する杵の欠損と照合できる。",
    "doesNotProveJa": "返吉が拾ったことだけでは、返吉が折ったとはいえない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C01_E02"
    },
    "sourceEvent": "EVT_C01",
    "assetId": "AS_EV_C01_02",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "片付けのときに落ちていたよ。杵はまだ棚にあった。捨てずに取っておいてよかった。",
    "consumable": false
  },
  {
    "id": "EV_C01_03",
    "caseId": "C01",
    "nameJa": "二つの丸跡がある添え木",
    "kind": "physical",
    "locationId": "LOC_DAWN_BENCH",
    "npcId": "NPC_TSUGUMARU",
    "descriptionJa": "乾燥棚の添え木には、間隔の違う二組の丸い圧痕。修理用の二股締め具の欠けた先端と一致する。",
    "establishesJa": "この場所で、当該締め具を使った修理が行われた。",
    "doesNotProveJa": "締め具の所持だけでは運び出した者は決まらない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C01_E03"
    },
    "sourceEvent": "EVT_C01",
    "assetId": "AS_EV_C01_03",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "この小さい丸と大きい丸は、うちの締め具の跡。締めすぎないよう、先を少し削ってある。",
    "consumable": false
  },
  {
    "id": "EV_C01_04",
    "caseId": "C01",
    "nameJa": "修理預かりの半券",
    "kind": "document",
    "locationId": "LOC_DAWN_BENCH",
    "npcId": "NPC_TSUGUMARU",
    "descriptionJa": "宿の作業受付が残した半券。「祝い杵、柄の継ぎ、持込・継丸」。前夜に宿の茶係が対面で受け付けた記録。",
    "establishesJa": "継丸が当該祝い杵を修理のために持ち込んだ。独立した受付記録で裏付けられる。",
    "doesNotProveJa": "杵吉の許可を得ていたことまでは証明しない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C01_E04"
    },
    "sourceEvent": "EVT_C01",
    "assetId": "AS_EV_C01_04",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "宿の方に、預かりを一枚書いてもらった。持ってきたのは、わたしだよ。でも、理由も見てほしい。",
    "consumable": false
  },
  {
    "id": "EV_C01_05",
    "caseId": "C01",
    "nameJa": "修理中の祝い杵",
    "kind": "physical",
    "locationId": "LOC_DAWN_BENCH",
    "npcId": "NPC_TSUGUMARU",
    "descriptionJa": "札に杵吉の屋号。柄の継ぎ目へ木片がぴたりと合い、年輪も連続する。添え木と締め具で固定されている。",
    "establishesJa": "紛失品の同一性、以前からの破損、修理目的を別々に確かめられる。",
    "doesNotProveJa": "無断で持ち出してよかったことにはならない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C01_E05"
    },
    "sourceEvent": "EVT_C01",
    "assetId": "AS_EV_C01_05",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "お祭りの朝に折れたらと思って……。言えば、わたしが折ったと思われるのが怖かった。",
    "consumable": false
  },
  {
    "id": "EV_C01_06",
    "caseId": "C01",
    "nameJa": "相談と返事がそろった祝い杵の見開き",
    "kind": "document",
    "locationId": "LOC_DAWN_RECORDER",
    "npcId": "NPC_FUDEM",
    "descriptionJa": "一枚の二つ折り札。左には当初の「祝い杵が見当たらない」、右には修理・無断持出し・返却の結果がある。筆丸が結果を読み返し、杵吉と宿の茶係が確認した。最後の「祝い杵は戻った」の墨が乾く前に畳まれ、左欄の余白へ左右反転した薄い写りが残った。お餅の手帖には両欄を開いた控えが残る。",
    "establishesJa": "当初の相談も解決後の返事も本物で、筆丸は両方を受領し、結果を読み返した。解決後に向かいへ写った墨の位置も確認できる。",
    "doesNotProveJa": "この時点で後の不正や悪意は証明されない。杵の返却は、杵吉が祝い役へ戻る同意でもない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": [
          {
            "op": "caseAccepted",
            "id": "C01"
          },
          {
            "op": "hasInference",
            "id": "INF_C01_01"
          }
        ]
      },
      "dialogueId": "D_C01_E06"
    },
    "sourceEvent": "EVT_C01",
    "assetId": "AS_EV_C01_06",
    "reusableIn": [
      "C07"
    ],
    "required": true,
    "witnessLineJa": "杵が戻ったことも、無断だったことも。はい、両方いただきます。……畳むのが早かった。墨が向かいへ写ってしまいましたね。",
    "consumable": false,
    "fullTextJa": {
      "leftHeading": "相談時の困り事",
      "left": "祝い杵が見当たらない。持ち出した相手も分からない。",
      "rightHeading": "調べたあとの返事",
      "right": "継丸が、先にあった割れを直そうと無断で持ち出した。修理した祝い杵は返却された。",
      "completionFooter": "祝い杵は戻った"
    },
    "folioLayout": {
      "width": 600,
      "height": 360,
      "foldX": 300,
      "coordinateUnit": "authored_viewBox_units_not_real_world_measurement",
      "leftRegion": [
        0,
        0,
        300,
        360
      ],
      "rightRegion": [
        300,
        0,
        600,
        360
      ],
      "rightFooterBounds": [
        354,
        260,
        566,
        315
      ],
      "leftTransferBounds": [
        34,
        260,
        246,
        315
      ],
      "transform": {
        "x": "600 - x",
        "y": "y"
      },
      "contactFace": "right interior facing surface folds onto left interior facing surface",
      "notOnOutsideBack": true,
      "samplePolicy": "Use authored facsimiles; never cut, wet, consume, or alter the original evidence.",
      "dryControl": "Dry the result footer before closing: no fresh transfer.",
      "wetControl": "Close while the result footer is wet: the facing left margin receives a reversed partial impression.",
      "proofBoundaryJa": "写りは、紙が訂正の墨と触れたことを検分する手掛かり。誰が読んで切り出し、どの本文を提出したかは、原票の対応・読み返し・綴じ・受付照合を合わせて証明する。"
    },
    "originalCustodyJa": "確認後の原票は筆丸が記録整理のために受領。お餅と立会人は開いた両欄の控えを保持する。原票を渡すことは改変や集約案への賛同を意味しない。",
    "folioId": "Q01",
    "assetIds": [
      "AS_FOLIO_C01_COMPLETE"
    ],
    "integrityAtRecordJa": "立会いの控えは、相談と返事がまだ一枚につながった見開き、受付印、折線、左欄の写りを記録する。単に別々の紙を同じ画面へ並べたものではない。"
  },
  {
    "id": "EV_C02_01",
    "caseId": "C02",
    "nameJa": "橋の上の白い綱の目撃",
    "kind": "testimony",
    "locationId": "LOC_RIVER_REQUEST",
    "npcId": "NPC_NAKIKICHI",
    "descriptionJa": "鳴吉は橋の向こうに白い綱を見て横綱と思った。本人の顔も蛙の足も見ておらず、鹿の背に荷物があった。",
    "establishesJa": "目撃の根拠は綱であり、本人確認ではない。",
    "doesNotProveJa": "横綱が連れ去られた、橋を渡った、という証明ではない。",
    "acquisition": {
      "mode": "talk",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C02_E01"
    },
    "sourceEvent": "EVT_C02",
    "assetId": "AS_EV_C02_01",
    "reusableIn": [],
    "required": false,
    "witnessLineJa": "白い綱が見えたから、横綱だと思ったんだ。顔？　そこまでは……。鹿の背に乗っていたような。",
    "consumable": false
  },
  {
    "id": "EV_C02_02",
    "caseId": "C02",
    "nameJa": "芦ノ山の名入り綱",
    "kind": "physical",
    "locationId": "LOC_RIVER_TEABENCH",
    "npcId": "NPC_SHIROASHI",
    "descriptionJa": "白足の荷物に巻かれた綱。芦ノ山の刺繍と、白足の袋紐の結び目が一緒にある。",
    "establishesJa": "持ち主の名は芦ノ山でも、その目撃時に運んだのは白足の荷物。",
    "doesNotProveJa": "名入りの持ち物だけで、その人が現場にいたとは決められない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C02_E02"
    },
    "sourceEvent": "EVT_C02",
    "assetId": "AS_EV_C02_02",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "硬い荷の角が鹿さんに当たるから、横綱が貸してくれたんだ。名札ごとお借りしたよ。",
    "consumable": false
  },
  {
    "id": "EV_C02_03",
    "caseId": "C02",
    "nameJa": "綱を貸した茶屋の記録",
    "kind": "document",
    "locationId": "LOC_RIVER_TEABENCH",
    "npcId": "NPC_SHIROASHI",
    "descriptionJa": "茶屋の控えに「芦ノ山より白足へ綱貸し、鹿荷の当て布」。茶係の立会いと、本人二名の印がある。",
    "establishesJa": "芦ノ山から白足への自発的貸与が、橋の目撃より前に成立している。",
    "doesNotProveJa": "横綱のその後の所在は、この控えだけでは分からない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C02_E03"
    },
    "sourceEvent": "EVT_C02",
    "assetId": "AS_EV_C02_03",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "返す日を忘れないよう、茶屋で書いてもらった。ここに横綱の印、こっちは僕の印。",
    "consumable": false
  },
  {
    "id": "EV_C02_04",
    "caseId": "C02",
    "nameJa": "裏へ折られた稽古の覚書",
    "kind": "document",
    "locationId": "LOC_RIVER_BRIDGE",
    "npcId": "NPC_NAKIKICHI",
    "descriptionJa": "休み台に「しばらく稽古へ」。裏の折返しに「強く押さず、白玉をつぶさず返す。棚田、鈴菜先生」とある。",
    "establishesJa": "本人は餅返しの稽古に行く予定だった。宛先と相談先が分かる。",
    "doesNotProveJa": "書置きだけで現在の無事は確定しない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C02_E04"
    },
    "sourceEvent": "EVT_C02",
    "assetId": "AS_EV_C02_04",
    "reusableIn": [],
    "required": false,
    "witnessLineJa": "表だけ読んで、相撲の稽古だと決めつけてた。裏にも字があるなんて……。",
    "consumable": false
  },
  {
    "id": "EV_C02_05",
    "caseId": "C02",
    "nameJa": "つぶれていない練習の白玉",
    "kind": "observation",
    "locationId": "LOC_TERRACES_PRACTICE",
    "npcId": "NPC_ASHINOYAMA",
    "descriptionJa": "稽古盆には、押しつぶした白玉から、丸いまま返せた白玉へと並ぶ練習の跡。稽古札は芦ノ山の名。",
    "establishesJa": "ここで、力ではなく柔らかな手つきを練習している。",
    "doesNotProveJa": "食べ物の形だけで本人確認はできない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C02_E05"
    },
    "sourceEvent": "EVT_C02",
    "assetId": "AS_EV_C02_05",
    "reusableIn": [],
    "required": false,
    "witnessLineJa": "相手を投げる手と、餅を返す手は、同じじゃなかった。やっと、ひとつ丸いまま返せたよ。",
    "consumable": false
  },
  {
    "id": "EV_C02_06",
    "caseId": "C02",
    "nameJa": "鈴菜の稽古帳",
    "kind": "document",
    "locationId": "LOC_MOON_PRACTICE",
    "npcId": "NPC_SUZUNA",
    "descriptionJa": "祭の餅返しを頼まれた芦ノ山が、自分で棚田の稽古を予約した控え。白足への綱貸しより前の日付。",
    "establishesJa": "稽古行きは騒ぎの後の言い訳ではなく、事前の自発的予定。",
    "doesNotProveJa": "横綱本人に会って無事を確かめる必要がある。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C02_E06"
    },
    "sourceEvent": "EVT_C02",
    "assetId": "AS_EV_C02_06",
    "reusableIn": [],
    "required": false,
    "witnessLineJa": "強い方ほど、力を抜く稽古はむずかしいの。来たいと頼んだのは、あの方よ。",
    "consumable": false
  },
  {
    "id": "EV_C02_07",
    "caseId": "C02",
    "nameJa": "芦ノ山の無事と本人の確認",
    "kind": "testimony",
    "locationId": "LOC_TERRACES_PRACTICE",
    "npcId": "NPC_ASHINOYAMA",
    "descriptionJa": "本人に対面し、姿と名と本人の説明を確認する。自由に帰れる状態で、自分で餅返しの稽古へ来たと話す。今日は出番へ戻らないという本人の返事も、そのまま記録する。",
    "establishesJa": "失踪や拘束ではなく、自発的な稽古行きだった。綱の目撃は別の人物。",
    "doesNotProveJa": "無事で帰る道があることは、今すぐ出番へ戻る同意ではない。連絡の行き違いは直しても、稽古を続ける本人の返事を取り消さない。",
    "acquisition": {
      "mode": "talk",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C02_E07"
    },
    "sourceEvent": "EVT_C02",
    "assetId": "AS_EV_C02_07",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "わたしはここにいる。自分で来たし、いつでも帰れる。けれど今日は、出番へ戻らない。押すのではなく、受け止める手を習いたいんだ。",
    "consumable": false
  },
  {
    "id": "EV_C03_01",
    "caseId": "C03",
    "nameJa": "十杯売りの注文札",
    "kind": "document",
    "locationId": "LOC_MARKET_REQUEST",
    "npcId": "NPC_TAWARATA",
    "descriptionJa": "俵九郎が量り売りした小口の米十杯。後の三便三十俵とは別の取引で、受取時に二杯相当足りなかった。",
    "establishesJa": "約束は標準十杯。この小口取引に本物の不足がある。",
    "doesNotProveJa": "各蔵の三便が不足していることにはならない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C03_E01"
    },
    "sourceEvent": "EVT_C03",
    "assetId": "AS_EV_C03_01",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "十杯を運んだはずなのに、着いたら八杯ぶん。途中で抜いたって言われて、困ってるんだ。",
    "consumable": false
  },
  {
    "id": "EV_C03_02",
    "caseId": "C03",
    "nameJa": "底の高い名入り桝",
    "kind": "physical",
    "locationId": "LOC_MARKET_DEALER",
    "npcId": "NPC_TAWARAKURO",
    "descriptionJa": "側面は五段の標準目盛り。底板が一段高い位置に固定され、内側は四段分しか使えない。店の焼印付き。",
    "establishesJa": "見た目の十杯は、同じ粒を用いれば標準八杯分になる。",
    "doesNotProveJa": "現在の状態だけでは取引時も上げ底だったとはまだいえない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C03_E02"
    },
    "sourceEvent": "EVT_C03",
    "assetId": "AS_EV_C03_02",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "外の目盛りは、ほら、五段あるだろう。……中の底まで見るのかい。",
    "consumable": false
  },
  {
    "id": "EV_C03_03",
    "caseId": "C03",
    "nameJa": "標準桝との比較実演",
    "kind": "observation",
    "locationId": "LOC_TERRACES_STANDARD",
    "npcId": "NPC_MASUME",
    "descriptionJa": "同じ乾いた米、同じすり切り、同じ秤で比較する。標準桝一杯の正味は秤目10。店の桝五杯を標準へ移すと四杯、十杯なら八杯・秤目80になる。袋の重さはどちらも差し引く。「秤目」はこのゲームの秤の目盛であり、実在の歴史的重量単位ではない。",
    "establishesJa": "店の桝の有効容積は標準の4/5。同じ米の一標準杯＝秤目10という換算を実験で得る。出発前の秤札と組み合わせて初めて、その荷の標準杯数が分かる。",
    "doesNotProveJa": "再現実験だけでは、取引当日にこの桝を使ったことや、実際の荷渡し時の量までは分からない。",
    "acquisition": {
      "mode": "reconstruct",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C03_E03"
    },
    "sourceEvent": "EVT_C03",
    "assetId": "AS_EV_C03_03",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "同じ米なら、標準の一杯で十目。店の五杯を移すと四杯だね。袋の分は、どちらも引いておこう。",
    "consumable": false,
    "scaleProtocol": {
      "fictionalUnitJa": "秤目",
      "standardCupNet": 10,
      "historicalSlipNet": 80,
      "tareExcluded": true,
      "sameRiceAndMoisture": true,
      "derivedStandardCups": 8,
      "requiresEvidenceIds": [
        "EV_C03_03",
        "EV_C03_04"
      ]
    }
  },
  {
    "id": "EV_C03_04",
    "caseId": "C03",
    "nameJa": "出発前の立会秤札",
    "kind": "document",
    "locationId": "LOC_MARKET_SCALE",
    "npcId": "NPC_MASUME",
    "descriptionJa": "俵太へ荷を渡す直前、独立した秤係が「袋を除く正味：秤目80／店主の読み上げ：十杯」と記録した生の秤札。札には標準八杯とも不足二杯とも書かれていない。",
    "establishesJa": "運び手へ渡る前の正味重量は秤目80だった。比較実演の同じ米・一標準杯＝秤目10と合わせると、受渡し時に標準八杯だったと算出できる。",
    "doesNotProveJa": "秤目80だけでは標準杯数も不足も決まらない。比較実演の換算が必要で、店主の動機もこの札だけでは分からない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C03_E04"
    },
    "sourceEvent": "EVT_C03",
    "assetId": "AS_EV_C03_04",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "ここは杯数の欄、こちらは秤の目だ。十杯と聞き、八十目と見た。そのまま記した。二つの数を比べるには、同じ米の一杯を量らなくては。",
    "consumable": false,
    "fullTextJa": "荷渡し直前\n袋を除く正味：秤目80\n店主の読み上げ：十杯\n立会秤係の確認印"
  },
  {
    "id": "EV_C03_05",
    "caseId": "C03",
    "nameJa": "合わせ板の製作控え",
    "kind": "document",
    "locationId": "LOC_SHRINE_WORKSHOP",
    "npcId": "NPC_TAKEJI",
    "descriptionJa": "俵九郎が注文した板の寸法・二本の偏った釘穴と、現物の取付痕が一致。職人は底の保護板との説明を受けた。",
    "establishesJa": "店主と加工部材のつながり。板の位置と容積実演で不正な使用を確認できる。",
    "doesNotProveJa": "職人が用途を知って共謀した証拠ではない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C03_E05"
    },
    "sourceEvent": "EVT_C03",
    "assetId": "AS_EV_C03_05",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "底を守る板だと頼まれたんだ。注文通りに作ったが、一段上へ留めたのはうちじゃないよ。",
    "consumable": false
  },
  {
    "id": "EV_C03_06",
    "caseId": "C03",
    "nameJa": "桝の使用と引渡しの記録",
    "kind": "document",
    "locationId": "LOC_MARKET_DEALER",
    "npcId": "NPC_TAWARAKURO",
    "descriptionJa": "取引時の立会札に店名焼印・上縁の欠け・二本の釘頭を図示。俵九郎がその桝で量り、俵太は袋だけ受け取った。",
    "establishesJa": "実演した桝が取引時の器具で、量り手は俵九郎。運び手は器具を扱っていない。",
    "doesNotProveJa": "他のすべての取引や店の過去まで不正とは決めない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C03_E06"
    },
    "sourceEvent": "EVT_C03",
    "assetId": "AS_EV_C03_06",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "量ったのはわたしだ。運び手には袋だけを渡した。桝の記録は……その通りだよ。",
    "consumable": false
  },
  {
    "id": "EV_C03_07",
    "caseId": "C03",
    "nameJa": "乾燥条件をそろえた控え米",
    "kind": "observation",
    "locationId": "LOC_SPRING_INN",
    "npcId": "NPC_YUKEMARU",
    "descriptionJa": "同じ取引日に採った同じ米を、蓋付きの比較皿に保存。店と標準の両桝で量り直しても比は4/5。",
    "establishesJa": "この差を運搬中の吸湿や乾燥だけでは説明できない。",
    "doesNotProveJa": "米一般が乾燥で変化しない、という主張ではない。",
    "acquisition": {
      "mode": "reconstruct",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C03_E07"
    },
    "sourceEvent": "EVT_C03",
    "assetId": "AS_EV_C03_07",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "湯気から離して取っておいた同じ米だよ。米をそろえても、底の高さの差は消えない。",
    "consumable": false
  },
  {
    "id": "EV_C04_01",
    "caseId": "C04",
    "nameJa": "「参れません」で閉じた手紙",
    "kind": "document",
    "locationId": "LOC_INARI_LOWER",
    "npcId": "NPC_KOSAME",
    "descriptionJa": "葛葉の名と印がある折り紙。見えるのは「当日は参れません」。下端に、米糊の仮札で留まった折返しがある。",
    "establishesJa": "見えている文は完結した全文ではない可能性がある。",
    "doesNotProveJa": "これだけで、里の祭への辞退・反対は分からない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C04_E01"
    },
    "sourceEvent": "EVT_C04",
    "assetId": "AS_EV_C04_01",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "届けたのはこの手紙。でも、姫さまが里の餅つきをやめるなんて、聞いていないよ。",
    "consumable": false
  },
  {
    "id": "EV_C04_02",
    "caseId": "C04",
    "nameJa": "晴れ空の天気雨の観察",
    "kind": "observation",
    "locationId": "LOC_INARI_MIDDLE",
    "npcId": "NPC_KUZUHA",
    "descriptionJa": "事件再現では青空と局地的な雨が同時に見える。雨はこの中段の行列へ当たり、庇の下は乾いている。",
    "establishesJa": "「晴れていたから紙は濡れない」という推論は誤り。",
    "doesNotProveJa": "現在の通常アニメーションから事件の正確な時刻は割り出せない。",
    "acquisition": {
      "mode": "reconstruct",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C04_E02"
    },
    "sourceEvent": "EVT_C04",
    "assetId": "AS_EV_C04_02",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "晴れの日でも、ここには雨が通ります。傘の上は濡れて、笑っている顔は濡れないの。",
    "consumable": false
  },
  {
    "id": "EV_C04_03",
    "caseId": "C04",
    "nameJa": "米糊の仮札の試料",
    "kind": "physical",
    "locationId": "LOC_AUTUMN_DYER",
    "npcId": "NPC_AIZO",
    "descriptionJa": "婚礼用の同じ紙と米糊の複製。雨を含ませ、折って乾かすと仮札と折返しが貼り合う。原本を濡らさず試せる。",
    "establishesJa": "雨に濡れた折り紙の一行が、仮札の裏へ隠れる過程は再現可能。",
    "doesNotProveJa": "その過程だけでは、誰かが意図的に隠したとは証明しない。",
    "acquisition": {
      "mode": "reconstruct",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C04_E03"
    },
    "sourceEvent": "EVT_C04",
    "assetId": "AS_EV_C04_03",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "これは試し紙。大事な手紙を濡らさず、同じ糊で確かめよう。濡れて閉じると、裏が貼りつくんだ。",
    "consumable": false
  },
  {
    "id": "EV_C04_04",
    "caseId": "C04",
    "nameJa": "開いた手紙の続き",
    "kind": "document",
    "locationId": "LOC_INARI_UPPER",
    "npcId": "NPC_KOSAME",
    "descriptionJa": "保存係が原本の折返しを開いて展示。「代わりに小雨を送り、里の餅つきは予定どおり」。署名から紙繊維が連続。",
    "establishesJa": "欠席するのは葛葉本人で、代理を立て、里の祭は続けると明記されている。",
    "doesNotProveJa": "誰が後で短い要約を作ったかは、まだ分からない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C04_E04"
    },
    "sourceEvent": "EVT_C04",
    "assetId": "AS_EV_C04_04",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "ここだ。「代わりに小雨を送り」。ぼくは断りの使いじゃない。参加するための使いだったんだ。",
    "consumable": false
  },
  {
    "id": "EV_C04_05",
    "caseId": "C04",
    "nameJa": "桃源郷に残った婚礼の控え",
    "kind": "document",
    "locationId": "LOC_PEACH_WEDDING",
    "npcId": "NPC_MOMONE",
    "descriptionJa": "葛葉が手渡した控え。日付・代理名・里の餅つき継続の全文が一致。桃音は署名と読み上げに立ち会っている。",
    "establishesJa": "開かれた続きは、事件後に付け足した文ではない。",
    "doesNotProveJa": "葛葉以外のすべての里の意向までは代表しない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C04_E05"
    },
    "sourceEvent": "EVT_C04",
    "assetId": "AS_EV_C04_05",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "結婚のお知らせと一緒にもらったよ。あの子は、来られなくても里の祭を続けると、ちゃんと読んでいた。",
    "consumable": false
  },
  {
    "id": "EV_C04_06",
    "caseId": "C04",
    "nameJa": "小雨の返事付き手渡し控え",
    "kind": "document",
    "locationId": "LOC_INARI_MIDDLE",
    "npcId": "NPC_KUZUHA",
    "descriptionJa": "発送前、葛葉が全文を読み上げて託した番号入り控え。現物と切離し縁が対応する。葛葉の代理依頼とは別の欄に、小雨本人の「午前の使いなら引き受けます。餅つきの当番と片付けは引き受けません。使い賃は、この範囲で。」という返事が残る。",
    "establishesJa": "発送時から代理の依頼があり、手紙全体が里の辞退を告げていなかった。小雨が実際に引き受けた仕事は本人の発送前の返事で確認され、午前の使いに限られる。",
    "doesNotProveJa": "葛葉が代理に指名しただけで小雨の承諾は成立しない。手紙やこの控えを、終日奉仕・餅つき当番・無償の片付けへの委任に広げない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C04_E06"
    },
    "sourceEvent": "EVT_C04",
    "assetId": "AS_EV_C04_06",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "わたしが頼んだことと、小雨が引き受けたことは、別々に書いてあります。返事を出す人も、返事を受ける人も、一人ずつです。",
    "consumable": false,
    "boundedAcceptanceJa": {
      "authorNpcId": "NPC_KOSAME",
      "text": "午前の使いなら引き受けます。餅つきの当番と片付けは引き受けません。使い賃は、この範囲で。",
      "scope": "morning delivery only",
      "excluded": [
        "mochi-pounding shift",
        "cleanup"
      ],
      "paidScopeExplicit": true,
      "createdBeforeHandoff": true
    }
  },
  {
    "id": "EV_C04_07",
    "caseId": "C04",
    "nameJa": "全文を読み返した訂正の控え",
    "kind": "document",
    "locationId": "LOC_INARI_UPPER",
    "npcId": "NPC_KOSAME",
    "descriptionJa": "筆丸は手紙の全文を読み、「葛葉本人の不在は里全体の辞退ではない。代理への依頼があり、小雨本人の承諾は午前の使いに限る」と確認した。小雨と桃音が立ち会い、両者が控えを保持する。",
    "establishesJa": "筆丸が、全里辞退でないことと、代理本人の承諾の範囲を提出前に理解していた。",
    "doesNotProveJa": "里の参加意向を、特定の誰かが全ての作業を引き受ける保証に置き換えない。後の虚偽提出は提出本と来歴を合わせて判定する。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": [
          {
            "op": "caseAccepted",
            "id": "C04"
          },
          {
            "op": "hasInference",
            "id": "INF_C04_02"
          }
        ]
      },
      "dialogueId": "D_C04_E07"
    },
    "sourceEvent": "EVT_C04",
    "assetId": "AS_EV_C04_07",
    "reusableIn": [
      "C07"
    ],
    "required": true,
    "witnessLineJa": "筆丸さんにも全文を読んでもらったよ。「辞退ではありません」って、向こうから言い直したんだ。",
    "consumable": false
  },
  {
    "id": "EV_C05_01",
    "caseId": "C05",
    "nameJa": "三十俵不足という申し立て",
    "kind": "document",
    "locationId": "LOC_RYUGU_REQUEST",
    "npcId": "NPC_SHIOZO",
    "descriptionJa": "京へ提出された表は、中継所の預かり30俵と到着蔵の預かり30俵を合計60俵の義務とする。現存30俵との差を不足とする。",
    "establishesJa": "争点となっている計算と三便の範囲を確定する。",
    "doesNotProveJa": "表の数字が、そのまま実際の物量ではない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C04"
          }
        ]
      },
      "dialogueId": "D_C05_E01"
    },
    "sourceEvent": "EVT_C07_SUBMIT",
    "assetId": "AS_EV_C05_01",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "海の蔵には十二俵、番号もそろっている。それなのに、陸も合わせて三十俵足りぬと言われた。",
    "consumable": false
  },
  {
    "id": "EV_C05_02",
    "caseId": "C05",
    "nameJa": "棚田のA17発送控え",
    "kind": "document",
    "locationId": "LOC_TERRACES_DISPATCH",
    "npcId": "NPC_MASUME",
    "descriptionJa": "A17-01〜12、同じ年の同じ祭の米十二俵を棚田から海風へ発送。新規の出荷はこの十二俵だけ。",
    "establishesJa": "A17の物量と識別子、最初の送り元。",
    "doesNotProveJa": "海風への到着だけで竜宮への到着はまだ証明しない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C05_E02"
    },
    "sourceEvent": "EVT_C05",
    "assetId": "AS_EV_C05_02",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "A17の一から十二。これが出した全部。海風へ預け、そこから竜宮へ移してもらったんだ。",
    "consumable": false
  },
  {
    "id": "EV_C05_03",
    "caseId": "C05",
    "nameJa": "海風のA17預替札",
    "kind": "document",
    "locationId": "LOC_COAST_TRANSFER",
    "npcId": "NPC_NAMISUKE",
    "descriptionJa": "A17-01〜12の十二俵を受け、その同じ十二俵を竜宮へ預替。元の預かりを閉じる印と、後継受取番号R17が連記される。",
    "establishesJa": "海風と竜宮の記録は別の商品ではなく、同じA17の保管交代。",
    "doesNotProveJa": "別便や別の通し番号をまとめて相殺してよいとはいえない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C05_E03"
    },
    "sourceEvent": "EVT_C05",
    "assetId": "AS_EV_C05_03",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "預替は、もう一山ふやすことじゃない。預かる手を、次の手へ渡すことだよ。",
    "consumable": false
  },
  {
    "id": "EV_C05_04",
    "caseId": "C05",
    "nameJa": "竜宮のR17受取石札",
    "kind": "document",
    "locationId": "LOC_RYUGU_LEDGER",
    "npcId": "NPC_SHIOZO",
    "descriptionJa": "耐水の刻字札。A17-01〜12、海風からの預替受取R17と記され、出荷札の通し番号に対応する。",
    "establishesJa": "A17の十二俵が竜宮へ到着した。中継札の後継番号と一致する。",
    "doesNotProveJa": "密閉箱だから誰も触れなかった、という意味ではない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C05_E04"
    },
    "sourceEvent": "EVT_C05",
    "assetId": "AS_EV_C05_04",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "水の底では紙より石札だ。ほら、海風の預替番号。来たものと出たものの続きが読める。",
    "consumable": false
  },
  {
    "id": "EV_C05_05",
    "caseId": "C05",
    "nameJa": "竜宮の十二箱の現物照合",
    "kind": "observation",
    "locationId": "LOC_RYUGU_CRATES",
    "npcId": "NPC_SHIOZO",
    "descriptionJa": "中庭の耐水米箱十二個。すべて外から番号を読め、中身確認窓を共同開封した照合記録付き。番号はA17-01〜12。",
    "establishesJa": "当該十二俵が現在ここにある。箱の外観だけで中身を推定していない。",
    "doesNotProveJa": "他地域の二便や、一般の盗難の有無は分からない。",
    "acquisition": {
      "mode": "reconstruct",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C05_E05"
    },
    "sourceEvent": "EVT_C05",
    "assetId": "AS_EV_C05_05",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "一つずつ数えるのが大変なら、照合台でまとめて見られるよ。番号も中身も、みんなで確かめてある。",
    "consumable": false
  },
  {
    "id": "EV_C05_06",
    "caseId": "C05",
    "nameJa": "初日の出のB08発送控え",
    "kind": "document",
    "locationId": "LOC_DAWN_DISPATCH",
    "npcId": "NPC_KINEKICHI",
    "descriptionJa": "B08-01〜08の八俵を楓峡へ発送。小口の桝売り取引とは別の大袋である。",
    "establishesJa": "B08は新規八俵の一便。蔵町の市の二杯不足と混同しない。",
    "doesNotProveJa": "次の保管場所は別途確認が必要。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C05_E06"
    },
    "sourceEvent": "EVT_C05",
    "assetId": "AS_EV_C05_06",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "こちらはB08の八俵。市の十杯売りとは、日も荷も違う。大きさを混ぜて数えないでね。",
    "consumable": false
  },
  {
    "id": "EV_C05_07",
    "caseId": "C05",
    "nameJa": "楓峡のB08預替控え",
    "kind": "document",
    "locationId": "LOC_AUTUMN_TRANSFER",
    "npcId": "NPC_AIZO",
    "descriptionJa": "B08-01〜08の受取と雪灯りへの預替を一枚に記載。元の預かりを閉じる印とS08を残す。",
    "establishesJa": "楓峡と雪灯りは同じ八俵の中継・到着。",
    "doesNotProveJa": "葉の色や季節の見た目を輸送日の時計にしてはいけない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C05_E07"
    },
    "sourceEvent": "EVT_C05",
    "assetId": "AS_EV_C05_07",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "紅葉の中を通った八俵が、雪の町へ行っただけ。秋の荷と冬の荷を、別々に増やしたわけじゃない。",
    "consumable": false
  },
  {
    "id": "EV_C05_08",
    "caseId": "C05",
    "nameJa": "雪灯りのS08在庫控え",
    "kind": "document",
    "locationId": "LOC_SNOW_STORE",
    "npcId": "NPC_YUKITSUZURI",
    "descriptionJa": "S08として受けたB08-01〜08の八俵。受取と現物照合の両方を二名で確認した当日控え。",
    "establishesJa": "B08の八俵はすべて雪灯りに現存する。",
    "doesNotProveJa": "雪の量から到着日時を推測したものではない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C05_E08"
    },
    "sourceEvent": "EVT_C05",
    "assetId": "AS_EV_C05_08",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "八俵、欠番なし。受取と、今ある分の確認は別にしておいた。片方だけでは足りないからね。",
    "consumable": false
  },
  {
    "id": "EV_C05_09",
    "caseId": "C05",
    "nameJa": "桃源郷のC10発送控え",
    "kind": "document",
    "locationId": "LOC_PEACH_DISPATCH",
    "npcId": "NPC_MOMONE",
    "descriptionJa": "C10-01〜10の十俵を竹隠れへ発送。送り元が保持する控え。",
    "establishesJa": "C10の新規出荷は十俵。",
    "doesNotProveJa": "受取側の報告とは独立に照合しなければならない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C05_E09"
    },
    "sourceEvent": "EVT_C05",
    "assetId": "AS_EV_C05_09",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "桃ばかりじゃないの。お祝い用の米も、十俵だけ送ったよ。控えはこちらに残っている。",
    "consumable": false
  },
  {
    "id": "EV_C05_10",
    "caseId": "C05",
    "nameJa": "竹隠れのC10預替控え",
    "kind": "document",
    "locationId": "LOC_SHRINE_TRANSFER",
    "npcId": "NPC_TAKEJI",
    "descriptionJa": "C10-01〜10を受け、蔵町の保管蔵へ預替M10。元の預かりを閉じる印がある。",
    "establishesJa": "竹隠れと蔵町は同じ十俵の受け渡し。",
    "doesNotProveJa": "別の古い祭のC10ではなく、年・祭番号も一致させる必要がある。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C05_E10"
    },
    "sourceEvent": "EVT_C05",
    "assetId": "AS_EV_C05_10",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "年と祭の番号も見ておくれ。名前の似た荷を、勝手につないではいけない。これは同じ十俵だ。",
    "consumable": false
  },
  {
    "id": "EV_C05_11",
    "caseId": "C05",
    "nameJa": "蔵町のM10在庫控え",
    "kind": "document",
    "locationId": "LOC_MARKET_STORE",
    "npcId": "NPC_TAWARATA",
    "descriptionJa": "公の保管蔵のC10-01〜10、十俵を照合。俵九郎の量り売り店とは所有も取引も異なる。",
    "establishesJa": "C10の十俵は公の保管蔵に現存し、蔵町の市の不正売買と区別される。",
    "doesNotProveJa": "俵九郎の過去の不足が帳消しになるわけではない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C05_E11"
    },
    "sourceEvent": "EVT_C05",
    "assetId": "AS_EV_C05_11",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "これは市の共同蔵。あの桝の米とは別便だよ。同じ町だからって、同じ取引にはならないんだ。",
    "consumable": false
  },
  {
    "id": "EV_C05_12",
    "caseId": "C05",
    "nameJa": "預替の約束と見本札",
    "kind": "document",
    "locationId": "LOC_COAST_TRANSFER",
    "npcId": "NPC_NAMISUKE",
    "descriptionJa": "発送、仮預かり、預替、到着の見本。預替では同じ通し番号を引き継ぎ、元の預かりを閉じる。納入義務を二重に立てない。",
    "establishesJa": "プレイヤーが判決前に理解できる、この架空の祭の帳簿ルール。",
    "doesNotProveJa": "現実の会計・法律一般のルールを説明する資料ではない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C05_E12"
    },
    "sourceEvent": "EVT_C05",
    "assetId": "AS_EV_C05_12",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "札は増えても、米は増えない。この祭では預替のとき、前の預かりを閉じるんだ。ここを先に見ておこう。",
    "consumable": false
  },
  {
    "id": "EV_C06_01",
    "caseId": "C06",
    "nameJa": "祭をやめるという連名書",
    "kind": "document",
    "locationId": "LOC_TODAIJI_REQUEST",
    "npcId": "NPC_TOAN",
    "descriptionJa": "「各里の餅つきを取りやめる」に、祈りに来た者の本物の署名片を貼り合わせた紙。署名片には通し番号が残る。",
    "establishesJa": "署名の本人性と、文面への同意は別の問題である。",
    "doesNotProveJa": "署名が本物でも、上の新しい文に同意したことにはならない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C04"
          }
        ]
      },
      "dialogueId": "D_C06_E01"
    },
    "sourceEvent": "EVT_C07_SUBMIT",
    "assetId": "AS_EV_C06_01",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "名も印も、ここに来た方のものです。でも、祈った願いは、その文とは違います。",
    "consumable": false
  },
  {
    "id": "EV_C06_02",
    "caseId": "C06",
    "nameJa": "毎日の祈願票の実演",
    "kind": "observation",
    "locationId": "LOC_TODAIJI_PRAYER",
    "npcId": "NPC_TOAN",
    "descriptionJa": "新しい見本票で実演。上段は目的・日付・番号、下段は署名、右は本人控え。上段と下段をまたぐ割印。署名片だけ整理係へ渡す。",
    "establishesJa": "後で使う証拠構造と、目的と署名を分けた時に生じる誤読を先に学べる。",
    "doesNotProveJa": "実演した今日の見本が、過去の事件の原本そのものではない。",
    "acquisition": {
      "mode": "reconstruct",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C06_E02"
    },
    "sourceEvent": "EVT_C06",
    "assetId": "AS_EV_C06_02",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "上はお寺に、右は祈った方に、下の署名は記録係へ。切り離しても、願いが迷子にならぬよう、番号と割印を付けます。",
    "consumable": false
  },
  {
    "id": "EV_C06_03",
    "caseId": "C06",
    "nameJa": "寺に残る上段の綴り",
    "kind": "document",
    "locationId": "LOC_TODAIJI_BACKING",
    "npcId": "NPC_TOAN",
    "descriptionJa": "事件日の上段だけを保持。「今日も、それぞれの里で餅をつけますように」、日付と番号P21/P22/P23。下端は不規則な切離し縁。",
    "establishesJa": "署名片の元の目的を示す原本の片側。署名の原本はここにはもうない。",
    "doesNotProveJa": "この上段だけでは偽文書の署名片との同一性がまだ不足する。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C06_E03"
    },
    "sourceEvent": "EVT_C06",
    "assetId": "AS_EV_C06_03",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "下の署名は切り離しました。ここに残った上半分と、向こうの切れ目がつながるか、見てください。",
    "consumable": false
  },
  {
    "id": "EV_C06_04",
    "caseId": "C06",
    "nameJa": "鈴菜の本人控えP21",
    "kind": "document",
    "locationId": "LOC_MOON_TEMPLE",
    "npcId": "NPC_SUZUNA",
    "descriptionJa": "本人が持つ右片。P21、事件日、目的全文。本人は各里の餅つき継続を祈り、その文を読んで署名した。",
    "establishesJa": "寺と独立した所持者による原本片と、目的の確認。",
    "doesNotProveJa": "本人の気持ちだけで紙の加工者を特定できない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C06_E04"
    },
    "sourceEvent": "EVT_C06",
    "assetId": "AS_EV_C06_04",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "餅つきが絶えませんように、と祈ったの。やめてくださいと書いた覚えはないし、控えにもそうは書いていないわ。",
    "consumable": false
  },
  {
    "id": "EV_C06_05",
    "caseId": "C06",
    "nameJa": "湯気丸の本人控えP22",
    "kind": "document",
    "locationId": "LOC_SPRING_INN",
    "npcId": "NPC_YUKEMARU",
    "descriptionJa": "右片P22、同じ日付・目的全文。保管場所が寺や鈴菜と異なり、番号は連名書の二枚目に対応する。",
    "establishesJa": "一枚だけの取り違えではなく、同一目的の複数署名が転用されている。",
    "doesNotProveJa": "預かり米の不足額とは関係がない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C06_E05"
    },
    "sourceEvent": "EVT_C06",
    "assetId": "AS_EV_C06_05",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "湯を沸かす朝も、里ごとの餅つきは続いてほしい。そういう願いで名を書いたんだ。",
    "consumable": false
  },
  {
    "id": "EV_C06_06",
    "caseId": "C06",
    "nameJa": "雪綴の本人控えP23と紙継ぎ見本",
    "kind": "physical",
    "locationId": "LOC_SNOW_BINDER",
    "npcId": "NPC_YUKITSUZURI",
    "descriptionJa": "雪綴本人の右片P23にも、祈願日・目的全文が残る。透明台では見本票の上下片を重ね、番号・切れ目・割印の照合手順を確かめる。本物の三枚の接続は、資料をそろえて寺で検分する。",
    "establishesJa": "紙片の同一性を筆跡ではなく物理的接続で検証する方法。",
    "doesNotProveJa": "似た紙色や同じ筆跡だけでは原本の同一性を確定しない。",
    "acquisition": {
      "mode": "reconstruct",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C06_E06"
    },
    "sourceEvent": "EVT_C06",
    "assetId": "AS_EV_C06_06",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "字が似ている、だけでは足りない。切れ目、番号、割印。その三つが一度につながるかを見よう。",
    "consumable": false
  },
  {
    "id": "EV_C06_07",
    "caseId": "C06",
    "nameJa": "川の使いの受渡控え",
    "kind": "document",
    "locationId": "LOC_RIVER_RECEIPT",
    "npcId": "NPC_HABUMI",
    "descriptionJa": "羽文はP21〜P23の署名片を「毎日の祈願記録」として受け取った。寺の上段は運ばず、取消文の見出しも添付されていない。",
    "establishesJa": "寺から出た時点の紙片の用途と内容。取消文はこの荷にはなかった。",
    "doesNotProveJa": "その後のどの人物が見出しを付けたかは、この控えだけでは決まらない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C06_E07"
    },
    "sourceEvent": "EVT_C06",
    "assetId": "AS_EV_C06_07",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "預かった札には「祈願記録」とあった。祭を取りやめる、なんて見出しは、荷の中になかったよ。",
    "consumable": false
  },
  {
    "id": "EV_C06_08",
    "caseId": "C06",
    "nameJa": "三枚の接続照合",
    "kind": "observation",
    "locationId": "LOC_TODAIJI_BACKING",
    "npcId": "NPC_YUKITSUZURI",
    "descriptionJa": "P21〜P23の署名片が各上段と一意に合い、割印が連続。本人控えの目的・番号・日付も一致する。三つの別原本を同一原本と重複扱いしない。",
    "establishesJa": "本物の祈願署名を別見出しへ転用したことを確定できる。",
    "doesNotProveJa": "誰が貼り替えたか、故意だったかはさらに別証拠が必要。",
    "acquisition": {
      "mode": "reconstruct",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C04"
          },
          {
            "op": "hasEvidence",
            "id": "EV_C06_01"
          },
          {
            "op": "hasEvidence",
            "id": "EV_C06_03"
          },
          {
            "op": "hasEvidence",
            "id": "EV_C06_04"
          },
          {
            "op": "hasEvidence",
            "id": "EV_C06_05"
          },
          {
            "op": "hasEvidence",
            "id": "EV_C06_06"
          }
        ]
      },
      "dialogueId": "D_C06_E08"
    },
    "sourceEvent": "EVT_C06",
    "assetId": "AS_EV_C06_08",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "三枚ともつながった。署名は本物。けれど、その上にあった願いを、別の文に取り替えている。",
    "consumable": false
  },
  {
    "id": "EV_C06_09",
    "caseId": "C06",
    "nameJa": "印刷見本にない取消の見出し",
    "kind": "document",
    "locationId": "LOC_SHRINE_WORKSHOP",
    "npcId": "NPC_TAKEJI",
    "descriptionJa": "祈願票の製作時に残した版下。目的全文・三分割・番号位置が固定され、取消の見出しは存在しない。",
    "establishesJa": "祈願票が最初から取消書だったという説明を否定する独立した製作資料。",
    "doesNotProveJa": "版下だけで全住民の政治的意向を代表させてはいけない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C06_E09"
    },
    "sourceEvent": "EVT_C06",
    "assetId": "AS_EV_C06_09",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "この版には、祭をやめる文は彫っていない。願いと名前が離れても番号で戻せる、それがこの紙の仕組みだ。",
    "consumable": false
  },
  {
    "id": "EV_C07_01",
    "caseId": "C07",
    "nameJa": "一つ臼の最終申し立て",
    "kind": "document",
    "locationId": "LOC_KYO_REQUEST",
    "npcId": "NPC_HABUMI",
    "descriptionJa": "申立人は筆丸。本文の見出しは「現在も未解決の六事」。祝い杵の未返却、横綱の所在不明、市の欠量未補填、稲荷の全里辞退、指定三便の三十俵不足、祈願者の取消同意を記す。浦から稲荷までの四件の添付には当事者が確かめた本物の相談欄が使われ、返事欄はない。祝い杵と米売りの左欄余白に薄い反転墨が残る。三便と祈願の資料は、申し立て前に別に作られた原資料である。",
    "establishesJa": "争うべきものは当初の相談の真偽ではなく、それを提出時点の未解決の状態として並べた本文。預かり米と祈願票の依頼メモが過去へ戻って使われたわけではない。",
    "doesNotProveJa": "原票が本物でも、この見出しと時制まで正しいとは限らない。書類を預けた同意を、改変や集約案への同意と取り違えない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C04"
          }
        ]
      },
      "dialogueId": "D_C07_E01"
    },
    "sourceEvent": "EVT_C07_SUBMIT",
    "assetId": "AS_EV_C07_01",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "これは、ぼくたちが届けた相談の字だ。偽物じゃない。なのに、助かったところだけが、ない。",
    "consumable": false,
    "originalConcernCaseIds": [
      "C01",
      "C02",
      "C03",
      "C04"
    ],
    "sourceEventIds": [
      "EVT_C01",
      "EVT_C02",
      "EVT_C03",
      "EVT_C04",
      "EVT_C05",
      "EVT_C06",
      "EVT_C07_SUBMIT"
    ],
    "dossierHeadingJa": "現在も未解決の六事",
    "assetIds": [
      "AS_FOLIO_C01_SUBMITTED",
      "AS_FOLIO_C03_SUBMITTED"
    ]
  },
  {
    "id": "EV_C07_02",
    "caseId": "C07",
    "nameJa": "全訂正の読み返し受領簿",
    "kind": "document",
    "locationId": "LOC_RIVER_RECEIPT",
    "npcId": "NPC_HABUMI",
    "descriptionJa": "浦から稲荷までの四件の訂正を、筆丸が要旨付きで読み返し確認。各地の立会人の控えと対応。祈願片の用途説明も記載。提出前の祭暦時点。",
    "establishesJa": "単なる封筒受領ではなく、筆丸が訂正内容を理解したことを独立記録で示す。",
    "doesNotProveJa": "預かり米と祈願票の判決後の知識を事件前にさかのぼらせてはいけない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C04"
          }
        ]
      },
      "dialogueId": "D_C07_E02"
    },
    "sourceEvent": "EVT_C07_READBACK",
    "assetId": "AS_EV_C07_02",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "受け取った印だけじゃない。要旨を読み返した言葉を、立会いの方と一緒に書き留めたよ。",
    "consumable": false
  },
  {
    "id": "EV_C07_03",
    "caseId": "C07",
    "nameJa": "受付の照合付き提出控え",
    "kind": "document",
    "locationId": "LOC_KYO_INTAKE",
    "npcId": "NPC_NAOKI",
    "descriptionJa": "直記と別の立会人が、筆丸の読み上げた六文、見出し「現在も未解決の六事」、添付番号、頁数、紙継ぎ位置を照合した。祝い杵と米売りの添付左欄に残る薄い反転墨も受理時の写しに記録され、現提出本と対応する。調査中に付けた写りを提出時のものと混同しない。",
    "establishesJa": "誤った本文・添付左片・墨の写りが、筆丸の提出した時点で同じ束にあったこと。後から検分台で付けた墨だという説明を独立した受理控えと照合できる。",
    "doesNotProveJa": "封が閉じているから魔法でも絶対に触れない、という密室証明ではない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C04"
          }
        ]
      },
      "dialogueId": "D_C07_E03"
    },
    "sourceEvent": "EVT_C07_SUBMIT",
    "assetId": "AS_EV_C07_03",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "筆丸どのが、その六つの文を読み上げた。私は番号と紙継ぎを照合した。今の本と、違いはない。",
    "consumable": false
  },
  {
    "id": "EV_C07_04",
    "caseId": "C07",
    "nameJa": "雪綴の綴じ渡し控え",
    "kind": "document",
    "locationId": "LOC_SNOW_BINDER",
    "npcId": "NPC_YUKITSUZURI",
    "descriptionJa": "雪綴は、既に相談側の左片だけになった原票と筆丸の割付を受け取り、番号順に綴じた。受付印、折り端、左欄の反転墨、本文見出しの位置を控え、筆丸の確認を受けて返した。原票の真正性を確かめることと、切り落とされた返事まで承認することは同じではない。",
    "establishesJa": "運び手による差し替え説、綴じ師が独自に文意を作った説を、独立した内容記録で検討できる。",
    "doesNotProveJa": "綴じ師の性格が善良だから無実、という根拠ではない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C04"
          }
        ]
      },
      "dialogueId": "D_C07_E04"
    },
    "sourceEvent": "EVT_C07_DRAFT",
    "assetId": "AS_EV_C07_04",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "私に来た時には、左の紙だけでした。端をそろえ、元の印を隠さぬように綴じた。読みやすくする仕事が、何を読めなくしたのか。そこまで、聞くべきでした。",
    "consumable": false
  },
  {
    "id": "EV_C07_05",
    "caseId": "C07",
    "nameJa": "相談欄だけを並べる清書割付",
    "kind": "document",
    "locationId": "LOC_KYO_ARCHIVE",
    "npcId": "NPC_NAOKI",
    "descriptionJa": "筆丸が内容照合した綴じ指定図。二つ折り札の左欄に「本文へ」、右欄に「控えへ」と矢印を付け、当事者の受付印を残す配置を指定している。「相談の記録」を作る指示だけなら必ずしも不正ではない。しかし最終稿には「現在も未解決の六事」という見出しが付く。",
    "establishesJa": "どの半分を本文へ採るかを指定した編集経路。完成した見開き、受領時の知識、実際に提出した時制と合わせると、その編集の意味を検討できる。",
    "doesNotProveJa": "左欄を抜粋する作業や簡潔な要約それ自体が不正なのではない。この指定図だけで故意を認定しない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C04"
          }
        ]
      },
      "dialogueId": "D_C07_E05"
    },
    "sourceEvent": "EVT_C07_DRAFT",
    "assetId": "AS_EV_C07_05",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "「左欄を本文へ、右欄は控えへ」。ここだけなら、相談の記録を作る仕事にも見えます。提出された表題と、同じ机で比べてください。",
    "consumable": false,
    "layoutInstructionJa": [
      "左の相談欄を本文へ",
      "右の返事欄は控えへ",
      "当事者の受付印を隠さず残す"
    ],
    "folioLayout": {
      "width": 600,
      "height": 360,
      "foldX": 300,
      "coordinateUnit": "authored_viewBox_units_not_real_world_measurement",
      "leftRegion": [
        0,
        0,
        300,
        360
      ],
      "rightRegion": [
        300,
        0,
        600,
        360
      ],
      "rightFooterBounds": [
        354,
        260,
        566,
        315
      ],
      "leftTransferBounds": [
        34,
        260,
        246,
        315
      ],
      "transform": {
        "x": "600 - x",
        "y": "y"
      },
      "contactFace": "right interior facing surface folds onto left interior facing surface",
      "notOnOutsideBack": true,
      "samplePolicy": "Use authored facsimiles; never cut, wet, consume, or alter the original evidence.",
      "dryControl": "Dry the result footer before closing: no fresh transfer.",
      "wetControl": "Close while the result footer is wet: the facing left margin receives a reversed partial impression.",
      "proofBoundaryJa": "写りは、紙が訂正の墨と触れたことを検分する手掛かり。誰が読んで切り出し、どの本文を提出したかは、原票の対応・読み返し・綴じ・受付照合を合わせて証明する。"
    }
  },
  {
    "id": "EV_C07_06",
    "caseId": "C07",
    "nameJa": "三つの場所の送り火観察",
    "kind": "observation",
    "locationId": "LOC_KYO_AVENUE_VIEW",
    "npcId": "NPC_TOKA",
    "descriptionJa": "固定した事件再現で、南大路・東筋の地上・東塔の北回廊を同じ火床配置と目線で比較。大路から整う大の字は他地点で重なりと間隔が変わる。",
    "establishesJa": "同じ形の写生を、どこでも同じ見え方だったとの説明には使えない。",
    "doesNotProveJa": "絵を記憶で整えて描くことは可能。視点矛盾だけで所在・犯人を確定しない。",
    "acquisition": {
      "mode": "reconstruct",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C04"
          }
        ]
      },
      "dialogueId": "D_C07_E06"
    },
    "sourceEvent": "EVT_C07_DAIMONJI",
    "assetId": "AS_EV_C07_06",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "火は山に置かれているから、歩けば重なりが変わるよ。これは時刻当てじゃない。同じ夜を、場所を変えて見比べるんだ。",
    "consumable": false
  },
  {
    "id": "EV_C07_07",
    "caseId": "C07",
    "nameJa": "筆丸の見晴らしの写生",
    "kind": "document",
    "locationId": "LOC_KYO_LOOKOUT",
    "npcId": "NPC_FUDEM",
    "descriptionJa": "筆丸は「訂正の受取刻は見晴らしに座り、そこから見た配置をそのまま描いた」と説明。図は大路の配置。誤記や写生の整形という代替説明も残る。",
    "establishesJa": "説明の信頼性を問い直すきっかけ。読み返し受領簿と合わせて、受領していないとの弁解を検討する。",
    "doesNotProveJa": "図だけで嘘や不在を断定しない。目線は現場で校正が必要。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C04"
          }
        ]
      },
      "dialogueId": "D_C07_E07"
    },
    "sourceEvent": "EVT_C07_DAIMONJI",
    "assetId": "AS_EV_C07_07",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "あの刻は見晴らしにいたはずです。この写生も……。ええ、見えたままを描いた、と申し上げました。",
    "consumable": false
  },
  {
    "id": "EV_C07_08",
    "caseId": "C07",
    "nameJa": "竹隠れのもち寄りの約束",
    "kind": "document",
    "locationId": "LOC_SHRINE_CHARTER",
    "npcId": "NPC_TAKEJI",
    "descriptionJa": "早期から公開。「米も杵も、それぞれの里のもの。余れば回し、足りなければ分ける。京は預かり、取り上げず」。当初から各地に写し。",
    "establishesJa": "協力と、地方の餅つきを強制的に廃止することの違い。世界の約束は終盤で突然追加されない。",
    "doesNotProveJa": "この約束だけで、あらゆる変更提案を禁じたり筆丸を有罪にしたりしない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C07_E08"
    },
    "sourceEvent": "EVT_FOUNDATION",
    "assetId": "AS_EV_C07_08",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "京に集まることも、里でつくことも、選べる。そのための約束なんだ。ひとつにするなら、皆の本当の返事がいる。",
    "consumable": false
  },
  {
    "id": "EV_C07_09",
    "caseId": "C07",
    "nameJa": "原本と要約の対照台",
    "kind": "observation",
    "locationId": "LOC_KYO_ARCHIVE",
    "npcId": "NPC_NAOKI",
    "descriptionJa": "六件の確定事項、当初の相談、解決後の返事、筆丸の提出本を並べる。初めの困り事は本物のまま残し、「現在も未解決」という新しい見出しと、抜けた続きが結論を変えた箇所を確かめる。預かり米の三便と蔵町の市の不正取引も混ぜない。",
    "establishesJa": "別々の誤りが一つ臼の主張を強める方向に選ばれている。来歴と知識を合わせて故意の主張を評価する。",
    "doesNotProveJa": "都合のよい結果だけで計画性を断定せず、受領・清書・提出証拠を併用する。",
    "acquisition": {
      "mode": "reconstruct",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C01"
          },
          {
            "op": "caseSolved",
            "id": "C02"
          },
          {
            "op": "caseSolved",
            "id": "C03"
          },
          {
            "op": "caseSolved",
            "id": "C04"
          },
          {
            "op": "caseSolved",
            "id": "C05"
          },
          {
            "op": "caseSolved",
            "id": "C06"
          }
        ]
      },
      "dialogueId": "D_C07_E09"
    },
    "sourceEvent": "EVT_C07",
    "assetId": "AS_EV_C07_09",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "困ったという言葉を消してはいけません。助かったという返事も消してはいけません。まず、どの時点の話かを、元へ戻しましょう。",
    "consumable": false
  },
  {
    "id": "EV_C07_10",
    "caseId": "C07",
    "nameJa": "送り火の刻の立会い記録",
    "kind": "document",
    "locationId": "LOC_KYO_INTAKE",
    "npcId": "NPC_NAOKI",
    "descriptionJa": "祭暦の固定した同じ刻に、筆丸が訂正要旨を読み返したことを直記と羽文が記録。景色の昼夜の違いではなく事件の順序を記した控え。",
    "establishesJa": "受取刻には不在だったという弁解に、直接の独立した反証を与える。",
    "doesNotProveJa": "通常の京の144秒周期を史実の時計に使った資料ではない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C04"
          }
        ]
      },
      "dialogueId": "D_C07_E10"
    },
    "sourceEvent": "EVT_C07_READBACK",
    "assetId": "AS_EV_C07_10",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "送り火の刻、と書いたのは出来事の順をそろえるためです。空の明るさを、別の里の時刻と比べたのではありません。",
    "consumable": false
  },
  {
    "id": "EV_C03_08",
    "caseId": "C03",
    "nameJa": "相談と補填がそろった米の見開き",
    "kind": "document",
    "locationId": "LOC_MARKET_SCALE",
    "npcId": "NPC_TAWARATA",
    "descriptionJa": "不足二杯を標準桝で補い、俵太・受取人・立会秤係が確認した二つ折り札。左は当初の「十杯買った米が、受取先の標準桝で八杯しかない」、右は上げ底の判明と二杯の補填。右下の「不足二杯、受取済」が乾く前に畳まれ、左欄の余白へ反転した写りが残る。原票は筆丸が受領し、お餅と立会人は両欄の控えを保持した。",
    "establishesJa": "不足は実在し、対象取引は解決後に補填された。元の相談を取り消さず、結果を同じ見開きへ加えたことを確認できる。",
    "doesNotProveJa": "補填によって最初の不正が消えたわけではない。二杯を返すだけで、待たされた手間や運び手への疑いまで無かったことにはならない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": [
          {
            "op": "caseAccepted",
            "id": "C03"
          },
          {
            "op": "hasInference",
            "id": "INF_C03_02"
          }
        ]
      },
      "dialogueId": "D_C03_E08"
    },
    "sourceEvent": "EVT_C03",
    "assetId": "AS_EV_C03_08",
    "reusableIn": [
      "C07"
    ],
    "required": true,
    "witnessLineJa": "二杯、標準の桝で受け取りました。足りなかったことも、返してもらったことも、両方書いておこう。待った分の仕事まで、帳面から消さないでくれ。",
    "consumable": false,
    "fullTextJa": {
      "leftHeading": "相談時の困り事",
      "left": "十杯買った米が、受取先の標準桝で八杯しかない。運ぶ間に減ったのだろうか。",
      "rightHeading": "調べたあとの返事",
      "right": "同じ米の一標準杯は秤目10。荷渡し前の秤目80は八杯に相当した。上げ底で量った売主の不正であり、不足二杯の補填を受けた。",
      "completionFooter": "不足二杯、受取済"
    },
    "folioLayout": {
      "width": 600,
      "height": 360,
      "foldX": 300,
      "coordinateUnit": "authored_viewBox_units_not_real_world_measurement",
      "leftRegion": [
        0,
        0,
        300,
        360
      ],
      "rightRegion": [
        300,
        0,
        600,
        360
      ],
      "rightFooterBounds": [
        354,
        260,
        566,
        315
      ],
      "leftTransferBounds": [
        34,
        260,
        246,
        315
      ],
      "transform": {
        "x": "600 - x",
        "y": "y"
      },
      "contactFace": "right interior facing surface folds onto left interior facing surface",
      "notOnOutsideBack": true,
      "samplePolicy": "Use authored facsimiles; never cut, wet, consume, or alter the original evidence.",
      "dryControl": "Dry the result footer before closing: no fresh transfer.",
      "wetControl": "Close while the result footer is wet: the facing left margin receives a reversed partial impression.",
      "proofBoundaryJa": "写りは、紙が訂正の墨と触れたことを検分する手掛かり。誰が読んで切り出し、どの本文を提出したかは、原票の対応・読み返し・綴じ・受付照合を合わせて証明する。"
    },
    "folioId": "Q03",
    "assetIds": [
      "AS_FOLIO_C03_COMPLETE"
    ],
    "integrityAtRecordJa": "立会いの控えは、相談と返事がまだ一枚につながった見開き、受付印、折線、左欄の写りを記録する。単に別々の紙を同じ画面へ並べたものではない。"
  },
  {
    "id": "EV_C07_11",
    "caseId": "C07",
    "nameJa": "預替と祈願の事前確認控え",
    "kind": "document",
    "locationId": "LOC_KYO_INTAKE",
    "npcId": "NPC_NAOKI",
    "descriptionJa": "最終提出前、筆丸は「A17/B08/C10は同じ荷の保管交代、出荷は合計三十俵」「署名片は各里の餅つき継続の祈願」と読み返す。羽文と直記が別々の控えに記録。",
    "establishesJa": "預かり米と祈願票の結論を後で知っただけではない。申立て前から、元伝票と署名の目的を正しく理解していた。",
    "doesNotProveJa": "後の判決そのものを、以前の本人の知識の証拠として使わない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C04"
          }
        ]
      },
      "dialogueId": "D_C07_E11"
    },
    "sourceEvent": "EVT_C07_READBACK",
    "assetId": "AS_EV_C07_11",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "提出前に、その二点も確かめた。「札が増えても米は増えない」「祈願は取消ではない」。筆丸どのが読んだ言葉です。",
    "consumable": false
  },
  {
    "id": "EV_C01_90",
    "caseId": "C01",
    "nameJa": "消えた祝い杵：確定した事実",
    "kind": "resolvedFact",
    "locationId": "LOC_DAWN_REQUEST",
    "npcId": "NPC_KINEKICHI",
    "descriptionJa": "継丸が、もとの割れを直すために祝い杵を無断で持ち出し、修理後に返した。杵吉がそれ以前に出した祝いの一搗き役の返上願は、杵の返却によって取り消されない。",
    "establishesJa": "継丸が、もとの割れを直すために祝い杵を無断で持ち出し、修理後に返した。杵吉がそれ以前に出した祝いの一搗き役の返上願は、杵の返却によって取り消されない。",
    "doesNotProveJa": "別事件の犯人・動機まで自動的に決まるわけではない。",
    "acquisition": {
      "mode": "resolution",
      "condition": {
        "all": [
          {
            "op": "caseAccepted",
            "id": "C01"
          },
          {
            "op": "hasInference",
            "id": "INF_C01_01"
          },
          {
            "op": "hasEvidence",
            "id": "EV_C01_06"
          },
          {
            "op": "hasEvidence",
            "id": "EV_C01_07"
          },
          {
            "op": "hasEvidence",
            "id": "EV_C07_13"
          }
        ]
      },
      "dialogueId": "D_C01_RESOLVE"
    },
    "sourceEvent": "EVT_C01",
    "assetId": "AS_RESOLVED_FACT",
    "reusableIn": [
      "C07"
    ],
    "required": true,
    "consumable": false
  },
  {
    "id": "EV_C02_90",
    "caseId": "C02",
    "nameJa": "横綱は橋を渡らない：確定した事実",
    "kind": "resolvedFact",
    "locationId": "LOC_RIVER_REQUEST",
    "npcId": "NPC_NAKIKICHI",
    "descriptionJa": "綱は白足へ貸した品。横綱は自発的に餅返しの稽古へ行った。",
    "establishesJa": "綱は白足へ貸した品。横綱は自発的に餅返しの稽古へ行った。",
    "doesNotProveJa": "所在不明の誤記を訂正することは、出番への復帰を命ずることではない。",
    "acquisition": {
      "mode": "resolution",
      "condition": {
        "all": [
          {
            "op": "caseAccepted",
            "id": "C02"
          },
          {
            "op": "hasInference",
            "id": "INF_C02_02"
          }
        ]
      },
      "dialogueId": "D_C02_RESOLVE"
    },
    "sourceEvent": "EVT_C02",
    "assetId": "AS_RESOLVED_FACT",
    "reusableIn": [
      "C07"
    ],
    "required": true,
    "consumable": false
  },
  {
    "id": "EV_C03_90",
    "caseId": "C03",
    "nameJa": "十杯あるのに、足りない米：確定した事実",
    "kind": "resolvedFact",
    "locationId": "LOC_MARKET_REQUEST",
    "npcId": "NPC_TAWARATA",
    "descriptionJa": "店主が底を一段上げた五段桝で量り、出発前から二杯足りなかった。対象取引の二杯は補填済み。",
    "establishesJa": "店主が底を一段上げた五段桝で量り、出発前から二杯足りなかった。対象取引の二杯は補填済み。",
    "doesNotProveJa": "別事件の犯人・動機まで自動的に決まるわけではない。",
    "acquisition": {
      "mode": "resolution",
      "condition": {
        "all": [
          {
            "op": "caseAccepted",
            "id": "C03"
          },
          {
            "op": "hasInference",
            "id": "INF_C03_01"
          },
          {
            "op": "hasInference",
            "id": "INF_C03_02"
          },
          {
            "op": "hasEvidence",
            "id": "EV_C03_08"
          }
        ]
      },
      "dialogueId": "D_C03_RESOLVE"
    },
    "sourceEvent": "EVT_C03",
    "assetId": "AS_RESOLVED_FACT",
    "reusableIn": [
      "C07"
    ],
    "required": true,
    "consumable": false
  },
  {
    "id": "EV_C04_90",
    "caseId": "C04",
    "nameJa": "晴れの日の、閉じた一行：確定した事実",
    "kind": "resolvedFact",
    "locationId": "LOC_INARI_MIDDLE",
    "npcId": "NPC_KUZUHA",
    "descriptionJa": "天気雨と米糊で続文が隠れた。全文は代理参加と里の餅つき継続を頼んでいた。",
    "establishesJa": "天気雨と米糊で続文が隠れた。全文は代理参加と里の餅つき継続を頼んでいた。",
    "doesNotProveJa": "別事件の犯人・動機まで自動的に決まるわけではない。",
    "acquisition": {
      "mode": "resolution",
      "condition": {
        "all": [
          {
            "op": "caseAccepted",
            "id": "C04"
          },
          {
            "op": "hasInference",
            "id": "INF_C04_01"
          },
          {
            "op": "hasInference",
            "id": "INF_C04_02"
          },
          {
            "op": "hasEvidence",
            "id": "EV_C04_07"
          }
        ]
      },
      "dialogueId": "D_C04_RESOLVE"
    },
    "sourceEvent": "EVT_C04",
    "assetId": "AS_RESOLVED_FACT",
    "reusableIn": [
      "C07"
    ],
    "required": true,
    "consumable": false
  },
  {
    "id": "EV_C05_90",
    "caseId": "C05",
    "nameJa": "海底の蔵と、消えた三十俵：確定した事実",
    "kind": "resolvedFact",
    "locationId": "LOC_KYO_COURT",
    "npcId": "NPC_SHIOZO",
    "descriptionJa": "三便の中継預かりと到着預かりを別物として数えた。実物三十俵はすべて確認できる。",
    "establishesJa": "三便の中継預かりと到着預かりを別物として数えた。実物三十俵はすべて確認できる。",
    "doesNotProveJa": "別事件の犯人・動機まで自動的に決まるわけではない。",
    "acquisition": {
      "mode": "resolution",
      "condition": {
        "all": [
          {
            "op": "caseAccepted",
            "id": "C05"
          },
          {
            "op": "hasInference",
            "id": "INF_C05_01"
          },
          {
            "op": "hasInference",
            "id": "INF_C05_02"
          },
          {
            "op": "trialWon",
            "id": "TR_C05"
          }
        ]
      },
      "dialogueId": "D_C05_RESOLVE"
    },
    "sourceEvent": "EVT_C05",
    "assetId": "AS_RESOLVED_FACT",
    "reusableIn": [
      "C07"
    ],
    "required": true,
    "consumable": false
  },
  {
    "id": "EV_C06_90",
    "caseId": "C06",
    "nameJa": "祈りの名簿は、誰の願いか：確定した事実",
    "kind": "resolvedFact",
    "locationId": "LOC_KYO_COURT",
    "npcId": "NPC_TOAN",
    "descriptionJa": "本物の祈願署名を別の取消見出しへ転用していた。この署名束から全里の取消同意は認定できず、それを根拠にした取消・一括移管は仮止めとなった。",
    "establishesJa": "本物の祈願署名を別の取消見出しへ転用していた。この署名束から全里の取消同意は認定できず、それを根拠にした取消・一括移管は仮止めとなった。",
    "doesNotProveJa": "誰も京の共同作業を望まないこと、全員が地元の役を引き受けること、転用の個人責任までは意味しない。",
    "acquisition": {
      "mode": "resolution",
      "condition": {
        "all": [
          {
            "op": "caseAccepted",
            "id": "C06"
          },
          {
            "op": "hasInference",
            "id": "INF_C06_01"
          },
          {
            "op": "hasInference",
            "id": "INF_C06_02"
          },
          {
            "op": "trialWon",
            "id": "TR_C06"
          }
        ]
      },
      "dialogueId": "D_C06_RESOLVE"
    },
    "sourceEvent": "EVT_C06",
    "assetId": "AS_RESOLVED_FACT",
    "reusableIn": [
      "C07"
    ],
    "required": true,
    "consumable": false
  },
  {
    "id": "EV_C07_90",
    "caseId": "C07",
    "nameJa": "大文字の夜、消された続き：確定した事実",
    "kind": "resolvedFact",
    "locationId": "LOC_KYO_COURT",
    "npcId": "NPC_HABUMI",
    "descriptionJa": "筆丸は解決と原資料の意味を知った後、完成見開きから返事側を除き、本物の過去の相談を「現在も未解決」の根拠として提出した。虚偽の全里辞退を退けても、杵吉本人の祝い役の返上は有効な返事として残る。",
    "establishesJa": "筆丸は解決と原資料の意味を知った後、完成見開きから返事側を除き、本物の過去の相談を「現在も未解決」の根拠として提出した。虚偽の全里辞退を退けても、杵吉本人の祝い役の返上は有効な返事として残る。",
    "doesNotProveJa": "各地の困り事が虚構だったことも、京で協力する案が常に悪いことも、全員が祭の役を引き受けることも意味しない。",
    "acquisition": {
      "mode": "resolution",
      "condition": {
        "all": [
          {
            "op": "caseAccepted",
            "id": "C07"
          },
          {
            "op": "hasInference",
            "id": "INF_C07_01"
          },
          {
            "op": "hasInference",
            "id": "INF_C07_02"
          },
          {
            "op": "hasInference",
            "id": "INF_C07_03"
          },
          {
            "op": "trialWon",
            "id": "TR_C07"
          },
          {
            "op": "hasInference",
            "id": "INF_C07_04"
          },
          {
            "op": "hasInference",
            "id": "INF_C07_05"
          }
        ]
      },
      "dialogueId": "D_C07_RESOLVE"
    },
    "sourceEvent": "EVT_C07",
    "assetId": "AS_RESOLVED_FACT",
    "reusableIn": [],
    "required": true,
    "consumable": false
  },
  {
    "id": "EV_C01_07",
    "caseId": "C01",
    "nameJa": "杵吉の祝い役返上願",
    "kind": "document",
    "locationId": "LOC_DAWN_REQUEST",
    "npcId": "NPC_KINEKICHI",
    "descriptionJa": "杵の紛失相談より前に杵吉が書いた本人控え。全文は「祝いの一搗き役を、本年より返上します。」。日付、役目、本人の名が同じ紙にある。道具を返してほしい相談とは別の返事で、取り消しは書かれていない。",
    "fullTextJa": "祝いの一搗き役を、本年より返上します。\n祭暦・支度前　杵吉",
    "establishesJa": "杵吉本人が、祝いの一搗きという特定の役目を辞退した。杵が見つからないから一時的に休んだのではない。",
    "doesNotProveJa": "里全体の祭の取消、全仕事からの引退、京への運営委任を意味しない。理由の説明や後任の確保がなければ無効になる願いでもない。",
    "acquisition": {
      "mode": "inspect",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C01_E07"
    },
    "sourceEvent": "EVT_KINEKICHI_RETIRE",
    "assetId": "AS_EV_C01_07",
    "reusableIn": [
      "C07"
    ],
    "required": true,
    "witnessLineJa": "杵は、返してほしい。祝いの一搗きは、もう引き受けない。二つとも、私の頼みです。",
    "consumable": false,
    "scopeJa": "祝いの一搗き役だけの返上。既存の別の実用杵作業を、役への再同意の証拠にしない。",
    "assetIds": [
      "AS_RESIGNATION_LETTER"
    ]
  },
  {
    "id": "EV_C07_13",
    "caseId": "C07",
    "nameJa": "乾いた札と濡れた札の折り比べ",
    "kind": "observation",
    "locationId": "LOC_DAWN_RECORDER",
    "npcId": "NPC_FUDEM",
    "descriptionJa": "相談と返事を向かいに書く二つ折り札の見本。右下の墨を乾かして畳む場合と、乾く前に右を左へ閉じる場合を比べる。濡れた右欄の文字は左欄の向かいの余白へ左右反転して写り、外側の裏面には写らない。いつでも写しの紙で試せる。",
    "establishesJa": "観察した折り方では、写りは右欄の文字が書かれた後にできる。位置は折線を軸に対応し、乾燥後に閉じる対照では新しい写りができない。",
    "doesNotProveJa": "この実演だけで提出原票の来歴、読んだ人物、切断者、意図までは決まらない。実物の対応と独立した受領・提出資料が必要。",
    "acquisition": {
      "mode": "reconstruct",
      "condition": {
        "all": []
      },
      "dialogueId": "D_C07_E13"
    },
    "sourceEvent": "EVT_NOTEBOOK_METHOD",
    "assetId": "AS_EV_C07_13",
    "reusableIn": [
      "C01",
      "C03"
    ],
    "required": true,
    "witnessLineJa": "よく乾いてからなら、何も写らない。急ぐと、向かいにもう一つ仕事が増える。見本なら、何度折ってもかまいません。",
    "consumable": false,
    "reconstructionRecipe": {
      "type": "foldTransferCompare",
      "geometry": {
        "width": 600,
        "height": 360,
        "foldX": 300,
        "coordinateUnit": "authored_viewBox_units_not_real_world_measurement",
        "leftRegion": [
          0,
          0,
          300,
          360
        ],
        "rightRegion": [
          300,
          0,
          600,
          360
        ],
        "rightFooterBounds": [
          354,
          260,
          566,
          315
        ],
        "leftTransferBounds": [
          34,
          260,
          246,
          315
        ],
        "transform": {
          "x": "600 - x",
          "y": "y"
        },
        "contactFace": "right interior facing surface folds onto left interior facing surface",
        "notOnOutsideBack": true,
        "samplePolicy": "Use authored facsimiles; never cut, wet, consume, or alter the original evidence.",
        "dryControl": "Dry the result footer before closing: no fresh transfer.",
        "wetControl": "Close while the result footer is wet: the facing left margin receives a reversed partial impression.",
        "proofBoundaryJa": "写りは、紙が訂正の墨と触れたことを検分する手掛かり。誰が読んで切り出し、どの本文を提出したかは、原票の対応・読み返し・綴じ・受付照合を合わせて証明する。"
      },
      "componentEvidenceIds": [],
      "requiredActions": [
        "inspect_open_dry_control",
        "fold_dry_control",
        "write_sample_right_footer",
        "fold_wet_sample",
        "open_and_compare_reflected_trace"
      ],
      "completionPolicy": "Observe both controls and explicitly record; no clock waiting and no permanent manipulation of original papers."
    },
    "assetIds": [
      "AS_FOLIO_TEMPLATE"
    ]
  },
  {
    "id": "EV_C07_12",
    "caseId": "C07",
    "nameJa": "切り出された相談欄の反転墨",
    "kind": "observation",
    "locationId": "LOC_KYO_ARCHIVE",
    "npcId": "NPC_NAOKI",
    "descriptionJa": "提出本の祝い杵と米売りの左片を、解決時に開いて残した見開き控えと重ねる。相談文・受付印・折り位置が対応し、左の薄い墨は右の「祝い杵は戻った」「不足二杯、受取済」を折線で反転した位置に合う。受理時の控えにも同じ写りがある。解決前の空白の返事欄から、この写りは生じない。",
    "establishesJa": "提出された相談側には、結果の記入後に対応する右欄と接した痕跡が残る。単に解決前の古い写しが取り残されたという説明では、この二組の対応と来歴を説明できない。",
    "doesNotProveJa": "墨跡だけで筆丸の故意、全ての紙の操作、全事件の首謀者まで決めない。原票の対応・読み返し・綴じと提出の順を別々に示す。",
    "acquisition": {
      "mode": "reconstruct",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C04"
          },
          {
            "op": "hasEvidence",
            "id": "EV_C01_06"
          },
          {
            "op": "hasEvidence",
            "id": "EV_C03_08"
          },
          {
            "op": "hasEvidence",
            "id": "EV_C07_01"
          },
          {
            "op": "hasEvidence",
            "id": "EV_C07_03"
          },
          {
            "op": "hasEvidence",
            "id": "EV_C07_13"
          }
        ]
      },
      "dialogueId": "D_C07_E12"
    },
    "sourceEvent": "EVT_C07_SUBMIT",
    "assetId": "AS_EV_C07_12",
    "reusableIn": [],
    "required": true,
    "witnessLineJa": "汚れだけを見てはいけません。右を左へ折った位置、元の印、受け付けた時の写し。三つを重ねて、いつ付いた跡なのかを確かめます。",
    "consumable": false,
    "reconstructionRecipe": {
      "type": "folioSourceOverlay",
      "geometry": {
        "width": 600,
        "height": 360,
        "foldX": 300,
        "coordinateUnit": "authored_viewBox_units_not_real_world_measurement",
        "leftRegion": [
          0,
          0,
          300,
          360
        ],
        "rightRegion": [
          300,
          0,
          600,
          360
        ],
        "rightFooterBounds": [
          354,
          260,
          566,
          315
        ],
        "leftTransferBounds": [
          34,
          260,
          246,
          315
        ],
        "transform": {
          "x": "600 - x",
          "y": "y"
        },
        "contactFace": "right interior facing surface folds onto left interior facing surface",
        "notOnOutsideBack": true,
        "samplePolicy": "Use authored facsimiles; never cut, wet, consume, or alter the original evidence.",
        "dryControl": "Dry the result footer before closing: no fresh transfer.",
        "wetControl": "Close while the result footer is wet: the facing left margin receives a reversed partial impression.",
        "proofBoundaryJa": "写りは、紙が訂正の墨と触れたことを検分する手掛かり。誰が読んで切り出し、どの本文を提出したかは、原票の対応・読み返し・綴じ・受付照合を合わせて証明する。"
      },
      "componentEvidenceIds": [
        "EV_C01_06",
        "EV_C03_08",
        "EV_C07_01",
        "EV_C07_03",
        "EV_C07_13"
      ],
      "requiredActions": [
        "inspect_both_original_concern_panels",
        "align_complete_case_spread",
        "reflect_right_footer_across_fold",
        "compare_intake_facsimile"
      ],
      "completionPolicy": "Snap matching panels and explain before explicit record; zoom and keyboard alternatives; no pixel hunting, no original cutting."
    },
    "assetIds": [
      "AS_FOLIO_COMPARISON",
      "AS_FOLIO_C01_COMPLETE",
      "AS_FOLIO_C03_COMPLETE",
      "AS_FOLIO_C01_SUBMITTED",
      "AS_FOLIO_C03_SUBMITTED"
    ]
  }
];

export const dialogues = [
  {
    "id": "D_C01_OFFER",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "offer",
    "condition": {
      "all": []
    },
    "speakerJa": "杵吉",
    "textJa": "弱ったな、お祝いの大杵が棚から消えちまったんだ。普段づかいの杵ならここにあるんだが、あっちは里から預かってる大切な品でね。返す相手が待ってるってのに、返せなくなっちまった。",
    "choices": [
      {
        "id": "D_C01_OFFER_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_OFFER_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "entryPolicy": "requester_router_unaccepted_and_prerequisites_met"
  },
  {
    "id": "D_C01_OFFER_L2",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "offer",
    "condition": {
      "all": []
    },
    "speakerJa": "杵吉",
    "textJa": "ちょうど今年から「祝いの一搗き役」は降りるって伝えたばかりなんだ。おかげで「役を投げ出したついでに杵まで放り出した」なんて陰口まで叩かれてる始末でね。どこへ行ったのか、確かめてくれないか。",
    "choices": [
      {
        "id": "D_C01_TAKE",
        "labelJa": "頼み事を受ける",
        "nextId": "D_C01_ACCEPT",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acceptCase",
            "id": "C01"
          }
        ]
      },
      {
        "id": "D_C01_LATER",
        "labelJa": "今は受けない",
        "nextId": "D_C01_DECLINE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "entryPolicy": "requester_router_unaccepted_and_prerequisites_met"
  },
  {
    "id": "D_C01_ACCEPT",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "accept",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "杵吉",
    "textJa": "ありがとうよ。棚にある返上の書付は、確かに私が書いたものだ。隠すつもりはない。ただ、消えた杵の行方と、あの返事は別物として見てやっておくれ。",
    "choices": [
      {
        "id": "D_C01_ACCEPT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_ACCEPT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST"
  },
  {
    "id": "D_C01_ACCEPT_L2",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "accept",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "杵吉",
    "textJa": "筆丸の手帖を使えば、相談と結果を見開きに並べて書けるそうだ。まずは今わかっていないことから、ひとつずつ書き留めておくれよ。",
    "choices": [
      {
        "id": "D_C01_BEGIN",
        "labelJa": "調べに行く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST"
  },
  {
    "id": "D_C01_DECLINE",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "decline",
    "condition": {
      "all": []
    },
    "speakerJa": "杵吉",
    "textJa": "そうかい、あんたにも用があるだろう。引き受けてくれる気になったら、またいつでも声をかけてくれ。",
    "choices": [
      {
        "id": "D_C01_DECLINE_CLOSE",
        "labelJa": "また今度",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST"
  },
  {
    "id": "D_C01_PRELUDE",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "杵吉",
    "textJa": "普段の餅は、今日も返吉と組んでついてるよ。ただ、祝いの一搗き役だけは今年から引き受けない。その返事だけは、先に出しておいたんだ。",
    "choices": [
      {
        "id": "D_C01_PRELUDE_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "entryPolicy": "requester_router_prerequisites_not_met"
  },
  {
    "id": "D_C01_REPEAT",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "杵吉",
    "textJa": "継丸を疑う声も耳に入ったよ。「あいつに頼めば直る」って、私も気軽に口にしてきたからね。だからって、誰が何をしたのかを曖昧なままにしとくわけにはいかないんだ。",
    "choices": [
      {
        "id": "D_C01_REPEAT_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openCaseNotebook",
          "caseId": "C01"
        }
      },
      {
        "id": "D_C01_REPORT",
        "labelJa": "確かめたことを報告する",
        "nextId": "D_C01_RESOLVE",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C01"
            },
            {
              "op": "hasInference",
              "id": "INF_C01_01"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C01_06"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C01_07"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C07_13"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C01_SCENE_LETTER_REPEAT_MENU",
        "labelJa": "返上の書付について",
        "nextId": "D_C01_SCENE_LETTER",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C01_07"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C01_SCENE_OLD_DEBT_REPEAT_MENU",
        "labelJa": "継丸への修理の頼みについて",
        "nextId": "D_C01_SCENE_OLD_DEBT",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C01"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C01_CONTINUE_SEARCH",
        "labelJa": "もう少し調べる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "entryPolicy": "requester_router_accepted_unresolved"
  },
  {
    "id": "D_C01_RESOLVE",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        },
        {
          "op": "hasInference",
          "id": "INF_C01_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_13"
        }
      ]
    },
    "speakerJa": "杵吉",
    "textJa": "……そうか、あれはやっぱりうちの祝い杵だったか。ヒビは持ち出される前から入っていて、継丸が黙って修理に持っていったんだな。……ったく、一言くれりゃいいものを。勝手にしたことについては、俺からあいつときっちり話をつけるよ。",
    "choices": [
      {
        "id": "D_C01_RESOLVE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_RESOLVE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "entryPolicy": "explicit_resolution_only",
    "stageDirectionJa": "返却済みの祝い杵を持ち主の備え台に残す。杵吉へ祝い役の再演をさせない。普段の餅つきと、一年に一度の役の辞退を別の動作として見せる。"
  },
  {
    "id": "D_C01_RESOLVE_L2",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        },
        {
          "op": "hasInference",
          "id": "INF_C01_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_13"
        }
      ]
    },
    "speakerJa": "杵吉",
    "textJa": "前に約束してた修理代を、「祭の会計が済んでから」って待たせたままにしてたんだ。そっちは先に払う。今回の無断修理のことは、また別に話し合うさ。",
    "choices": [
      {
        "id": "D_C01_RESOLVE_L2_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_RESOLVE_L3",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "entryPolicy": "explicit_resolution_only"
  },
  {
    "id": "D_C01_RESOLVE_L3",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        },
        {
          "op": "hasInference",
          "id": "INF_C01_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_13"
        }
      ]
    },
    "speakerJa": "杵吉",
    "textJa": "ただね、杵を返すことと、お祝いの役に戻ることは別だよ。私の辞退もそのまま残したうえで、確かめた経緯を記録してくれるかい。",
    "choices": [
      {
        "id": "D_C01_CONFIRM",
        "labelJa": "確定したことを伝える",
        "nextId": "D_C01_POST",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C01"
            },
            {
              "op": "hasInference",
              "id": "INF_C01_01"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C01_06"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C01_07"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C07_13"
            }
          ]
        },
        "effects": [
          {
            "op": "completeCase",
            "id": "C01"
          },
          {
            "op": "acquireEvidence",
            "id": "EV_C01_90"
          }
        ]
      },
      {
        "id": "D_C01_REVIEW_FIRST",
        "labelJa": "先に手帖を確かめる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openCaseNotebook",
          "caseId": "C01"
        }
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "entryPolicy": "explicit_resolution_only"
  },
  {
    "id": "D_C01_POST",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "杵吉",
    "textJa": "これで杵は返せる。そして私の一搗き役は、今年から返上する。その二つをきちんと書いてもらえたな。返吉とも、普段の仕事をどう回すか話してみるよ。",
    "choices": [
      {
        "id": "D_C01_POST_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "entryPolicy": "requester_router_solved_or_resolution_continuation"
  },
  {
    "id": "D_C02_OFFER",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "offer",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "鳴吉",
    "textJa": "大変だ、芦ノ山がいなくなっちまった！　横綱の白い綱が鹿の背に乗って橋を渡るのを見たんだけどよ、肝心の顔まではよく見えなかったんだ……。",
    "choices": [
      {
        "id": "D_C02_OFFER_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_OFFER_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "entryPolicy": "requester_router_unaccepted_and_prerequisites_met"
  },
  {
    "id": "D_C02_OFFER_L2",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "offer",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "鳴吉",
    "textJa": "出番はもう目と鼻の先なんだ。あいつがいなけりゃ、俺が声を張り上げて呼ぶ名前もなくなっちまう。……いや、まず何より無事かどうかだ。頼む、探してくれないか！",
    "choices": [
      {
        "id": "D_C02_TAKE",
        "labelJa": "頼み事を受ける",
        "nextId": "D_C02_ACCEPT",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C01"
            }
          ]
        },
        "effects": [
          {
            "op": "acceptCase",
            "id": "C02"
          }
        ]
      },
      {
        "id": "D_C02_LATER",
        "labelJa": "今は受けない",
        "nextId": "D_C02_DECLINE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "entryPolicy": "requester_router_unaccepted_and_prerequisites_met"
  },
  {
    "id": "D_C02_ACCEPT",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "accept",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "鳴吉",
    "textJa": "恩に着るよ！　俺が見たものは、見たとおりに全部話す。もし見つかったら、無理やり連れ戻さなくていい。今どうしてるか、あいつの口から聞いてきてくれ。",
    "choices": [
      {
        "id": "D_C02_BEGIN",
        "labelJa": "調べに行く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST"
  },
  {
    "id": "D_C02_DECLINE",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "decline",
    "condition": {
      "all": []
    },
    "speakerJa": "鳴吉",
    "textJa": "わかったよ。誰かに物を頼むときは、こっちも返事を待たなきゃな。俺も、自分が見たことをもう一度頭の中で整理しておくさ。",
    "choices": [
      {
        "id": "D_C02_DECLINE_CLOSE",
        "labelJa": "また今度",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST"
  },
  {
    "id": "D_C02_PRELUDE",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "鳴吉",
    "textJa": "芦ノ山を土俵へ呼び出すのが、俺の仕事だ。名を呼べば、あいつが出てくる。ずっとそうしてきたから、それをあいつの「返事」だと思い込んでたのかもしれねえな。",
    "choices": [
      {
        "id": "D_C02_PRELUDE_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "entryPolicy": "requester_router_prerequisites_not_met"
  },
  {
    "id": "D_C02_REPEAT",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "鳴吉",
    "textJa": "白い綱を見たのは間違いない。だが、「横綱を見た」って言い張ったのは俺だ。あいつの無事と俺の都合をごっちゃにしないよう、もう一度聞き直したいんだ。",
    "choices": [
      {
        "id": "D_C02_REPEAT_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openCaseNotebook",
          "caseId": "C02"
        }
      },
      {
        "id": "D_C02_REPORT",
        "labelJa": "確かめたことを報告する",
        "nextId": "D_C02_RESOLVE",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C02"
            },
            {
              "op": "hasInference",
              "id": "INF_C02_02"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C02_SCENE_CALLING_REPEAT_MENU",
        "labelJa": "芦ノ山を探す理由を聞く",
        "nextId": "D_C02_SCENE_CALLING",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C02"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C02_SCENE_NO_FACE_REPEAT_MENU",
        "labelJa": "顔は本当に見えた？",
        "nextId": "D_C02_SCENE_NO_FACE",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C02_01"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C02_CONTINUE_SEARCH",
        "labelJa": "もう少し調べる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "entryPolicy": "requester_router_accepted_unresolved"
  },
  {
    "id": "D_C02_RESOLVE",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        },
        {
          "op": "hasInference",
          "id": "INF_C02_02"
        }
      ]
    },
    "speakerJa": "鳴吉",
    "textJa": "なんだ、無事で、しかも自分から稽古に行ってたのか！　あの綱は白足に貸したもんで、俺はただの綱に向かってあいつの名を呼んでたってわけだな……。",
    "choices": [
      {
        "id": "D_C02_RESOLVE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_RESOLVE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "entryPolicy": "explicit_resolution_only",
    "stageDirectionJa": "鳴吉は大声で呼び戻さず、出番の札を静かに外す。芦ノ山を土俵へ配置しない。既存の別の相撲ペアの動きは維持する。"
  },
  {
    "id": "D_C02_RESOLVE_L2",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        },
        {
          "op": "hasInference",
          "id": "INF_C02_02"
        }
      ]
    },
    "speakerJa": "鳴吉",
    "textJa": "無事なら出番も元どおりにできるって、俺が勝手にそこまで勘定に入れちまってたんだ。あいつは、そんなことひと言も頼んでねえのにな。",
    "choices": [
      {
        "id": "D_C02_RESOLVE_L2_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_RESOLVE_L3",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "entryPolicy": "explicit_resolution_only"
  },
  {
    "id": "D_C02_RESOLVE_L3",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        },
        {
          "op": "hasInference",
          "id": "INF_C02_02"
        }
      ]
    },
    "speakerJa": "鳴吉",
    "textJa": "みんなには「無事だった」って知らせるよ。「出場する」とは書かない。その区別も、きっちり記録に残しておいてくれ。",
    "choices": [
      {
        "id": "D_C02_CONFIRM",
        "labelJa": "確定したことを伝える",
        "nextId": "D_C02_POST",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C02"
            },
            {
              "op": "hasInference",
              "id": "INF_C02_02"
            }
          ]
        },
        "effects": [
          {
            "op": "completeCase",
            "id": "C02"
          },
          {
            "op": "acquireEvidence",
            "id": "EV_C02_90"
          }
        ]
      },
      {
        "id": "D_C02_REVIEW_FIRST",
        "labelJa": "先に手帖を確かめる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openCaseNotebook",
          "caseId": "C02"
        }
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "entryPolicy": "explicit_resolution_only"
  },
  {
    "id": "D_C02_POST",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "鳴吉",
    "textJa": "今年の出番表から、芦ノ山の名を外すことにしたよ。次をどうするかは、また皆で相談するさ。あいつ一人を見つけさえすれば片づく話に、俺がしちまってたんだな。",
    "choices": [
      {
        "id": "D_C02_POST_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "entryPolicy": "requester_router_solved_or_resolution_continuation"
  },
  {
    "id": "D_C03_OFFER",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "offer",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "俵太",
    "textJa": "十杯の米を運んだはずなのに、届いてみたら八杯ぶんしかなかったんです。途中で私が抜き取ったと疑われて、私の荷札まで伏せられてしまいました……。",
    "choices": [
      {
        "id": "D_C03_OFFER_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_OFFER_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "entryPolicy": "requester_router_unaccepted_and_prerequisites_met"
  },
  {
    "id": "D_C03_OFFER_L2",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "offer",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "俵太",
    "textJa": "売り手の俵九郎さんは、私に最初の仕事を世話してくださった方なんです。だからこそ、面と向かって「違う」と言い出せない。どこで足りなくなったのか、調べていただけませんか。",
    "choices": [
      {
        "id": "D_C03_TAKE",
        "labelJa": "頼み事を受ける",
        "nextId": "D_C03_ACCEPT",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C01"
            }
          ]
        },
        "effects": [
          {
            "op": "acceptCase",
            "id": "C03"
          }
        ]
      },
      {
        "id": "D_C03_LATER",
        "labelJa": "今は受けない",
        "nextId": "D_C03_DECLINE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "entryPolicy": "requester_router_unaccepted_and_prerequisites_met"
  },
  {
    "id": "D_C03_ACCEPT",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "accept",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "俵太",
    "textJa": "ありがとうございます！　袋の封が切られていないというだけでは、私の言い分が全部通るわけではありません。荷を渡される前の記録も、どうか見てください。",
    "choices": [
      {
        "id": "D_C03_BEGIN",
        "labelJa": "調べに行く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST"
  },
  {
    "id": "D_C03_DECLINE",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "decline",
    "condition": {
      "all": []
    },
    "speakerJa": "俵太",
    "textJa": "わかりました。ほかにお願いできる方を探します。荷札と袋は、このまま動かさず残しておきますね。",
    "choices": [
      {
        "id": "D_C03_DECLINE_CLOSE",
        "labelJa": "また今度",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST"
  },
  {
    "id": "D_C03_PRELUDE",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "俵太",
    "textJa": "この荷札を下げて働き始めたとき、最初のお客を紹介してくださったのが俵九郎さんでした。あのときのご恩は、今も忘れたことはありません。",
    "choices": [
      {
        "id": "D_C03_PRELUDE_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "entryPolicy": "requester_router_prerequisites_not_met"
  },
  {
    "id": "D_C03_REPEAT",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "俵太",
    "textJa": "「不足の二杯は店で持とう」と、あの方は言ってくださいました。でも、私が抜いた分を店が肩代わりしてくれたことになれば、次から私は何も言い返せなくなるんです。",
    "choices": [
      {
        "id": "D_C03_REPEAT_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openCaseNotebook",
          "caseId": "C03"
        }
      },
      {
        "id": "D_C03_REPORT",
        "labelJa": "確かめたことを報告する",
        "nextId": "D_C03_RESOLVE",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C03"
            },
            {
              "op": "hasInference",
              "id": "INF_C03_01"
            },
            {
              "op": "hasInference",
              "id": "INF_C03_02"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C03_08"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C03_SCENE_FAVOR_REPEAT_MENU",
        "labelJa": "俵九郎との付き合いを聞く",
        "nextId": "D_C03_SCENE_FAVOR",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C03"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C03_SCENE_COVER_SHORTFALL_REPEAT_MENU",
        "labelJa": "店が二杯を負担するという話は？",
        "nextId": "D_C03_SCENE_COVER_SHORTFALL",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C03"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C03_CONTINUE_SEARCH",
        "labelJa": "もう少し調べる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "entryPolicy": "requester_router_accepted_unresolved"
  },
  {
    "id": "D_C03_RESOLVE",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        }
      ]
    },
    "speakerJa": "俵太",
    "textJa": "補填の二杯、確かに受け取りました。次は、どうかこの場で聞かせてください。「あいつに荷を預けるな」と言われた、同じ方々の前で。",
    "choices": [
      {
        "id": "D_C03_RESOLVE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_RESOLVE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "entryPolicy": "explicit_resolution_only",
    "stageDirectionJa": "俵太は荷受け広場に、俵九郎は実際の店先にいる。約16m離れた同じ広場へ、俵九郎が声を張って訂正を読む。隣へ瞬間移動させない。俵太は明示的な報告の完了後に荷札を表へ返す。握手や笑顔を必須にしない。",
    "sceneKey": "marketPublicCorrection",
    "sceneParticipants": [
      {
        "npcId": "NPC_TAWARATA",
        "locationId": "LOC_MARKET_REQUEST"
      },
      {
        "npcId": "NPC_TAWARAKURO",
        "locationId": "LOC_MARKET_DEALER"
      }
    ],
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C03_RESOLVE_L2",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        }
      ]
    },
    "speakerJa": "俵九郎",
    "textJa": "十回すくって量ったことに、嘘偽りはございませんよ。",
    "choices": [
      {
        "id": "D_C03_RESOLVE_L2_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_RESOLVE_L3",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "entryPolicy": "explicit_resolution_only",
    "sceneKey": "marketPublicCorrection",
    "sceneParticipants": [
      {
        "npcId": "NPC_TAWARATA",
        "locationId": "LOC_MARKET_REQUEST"
      },
      {
        "npcId": "NPC_TAWARAKURO",
        "locationId": "LOC_MARKET_DEALER"
      }
    ],
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C03_RESOLVE_L3",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        }
      ]
    },
    "speakerJa": "俵太",
    "textJa": "ええ。問題なのは、その枡に「どれだけ入るか」のほうです。",
    "choices": [
      {
        "id": "D_C03_RESOLVE_L3_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_RESOLVE_L4",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "entryPolicy": "explicit_resolution_only",
    "sceneKey": "marketPublicCorrection",
    "sceneParticipants": [
      {
        "npcId": "NPC_TAWARATA",
        "locationId": "LOC_MARKET_REQUEST"
      },
      {
        "npcId": "NPC_TAWARAKURO",
        "locationId": "LOC_MARKET_DEALER"
      }
    ],
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C03_RESOLVE_L4",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        }
      ]
    },
    "speakerJa": "俵九郎",
    "textJa": "……参りましたな。訂正いたします。俵太が道中で米を抜いたという話は、私の見誤りでした。上げ底の枡で量ったのは私自身で、不足の二杯はすでに補いました。",
    "choices": [
      {
        "id": "D_C03_RESOLVE_L4_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_RESOLVE_L5",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "entryPolicy": "explicit_resolution_only",
    "sceneKey": "marketPublicCorrection",
    "sceneParticipants": [
      {
        "npcId": "NPC_TAWARATA",
        "locationId": "LOC_MARKET_REQUEST"
      },
      {
        "npcId": "NPC_TAWARAKURO",
        "locationId": "LOC_MARKET_DEALER"
      }
    ],
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C03_RESOLVE_L5",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        }
      ]
    },
    "speakerJa": "俵太",
    "textJa": "不足分の米は受け取ります。けれど、「私の不始末だった」という話までは受け取れません。",
    "choices": [
      {
        "id": "D_C03_RESOLVE_L5_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_RESOLVE_L6",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "entryPolicy": "explicit_resolution_only",
    "sceneKey": "marketPublicCorrection",
    "sceneParticipants": [
      {
        "npcId": "NPC_TAWARATA",
        "locationId": "LOC_MARKET_REQUEST"
      },
      {
        "npcId": "NPC_TAWARAKURO",
        "locationId": "LOC_MARKET_DEALER"
      }
    ],
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C03_RESOLVE_L6",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        }
      ]
    },
    "speakerJa": "俵太",
    "textJa": "以前に仕事を紹介していただいた恩も、今回のことも、どちらも覚えています。片方で片方を帳消しにせず、確かめた経緯をそのまま記録してください。",
    "choices": [
      {
        "id": "D_C03_CONFIRM",
        "labelJa": "確定したことを伝える",
        "nextId": "D_C03_POST",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C03"
            },
            {
              "op": "hasInference",
              "id": "INF_C03_01"
            },
            {
              "op": "hasInference",
              "id": "INF_C03_02"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C03_08"
            }
          ]
        },
        "effects": [
          {
            "op": "completeCase",
            "id": "C03"
          },
          {
            "op": "acquireEvidence",
            "id": "EV_C03_90"
          }
        ]
      },
      {
        "id": "D_C03_REVIEW_FIRST",
        "labelJa": "先に手帖を確かめる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openCaseNotebook",
          "caseId": "C03"
        }
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "entryPolicy": "explicit_resolution_only",
    "sceneKey": "marketPublicCorrection",
    "sceneParticipants": [
      {
        "npcId": "NPC_TAWARATA",
        "locationId": "LOC_MARKET_REQUEST"
      },
      {
        "npcId": "NPC_TAWARAKURO",
        "locationId": "LOC_MARKET_DEALER"
      }
    ],
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C03_POST",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "俵太",
    "textJa": "これで、伏せられていた荷札を表に戻せます。次もあの店の荷を運ぶかどうかは、条件を聞いてから自分で決めます。それで恩知らずと呼ばれるなら、そう呼ばれても構いません。",
    "choices": [
      {
        "id": "D_C03_POST_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "entryPolicy": "requester_router_solved_or_resolution_continuation"
  },
  {
    "id": "D_C04_OFFER",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "offer",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C02"
        },
        {
          "op": "caseSolved",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "葛葉",
    "textJa": "京へは参れないとお返事を出しただけなのに、いつの間にか「里の祭まで取りやめる」と断ったことにされてしまいました。手紙を届けた小雨が、勝手に文を書き換えたのではと責められているのです。",
    "choices": [
      {
        "id": "D_C04_OFFER_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_OFFER_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "entryPolicy": "requester_router_unaccepted_and_prerequisites_met"
  },
  {
    "id": "D_C04_OFFER_L2",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "offer",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C02"
        },
        {
          "op": "caseSolved",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "葛葉",
    "textJa": "私自身が欠席するのは、間違いのない事実ですわ。けれど、私が書き添えた続きの文と、小雨に頼んだ仕事の範囲を、どうか確かめていただけますかしら。",
    "choices": [
      {
        "id": "D_C04_TAKE",
        "labelJa": "頼み事を受ける",
        "nextId": "D_C04_ACCEPT",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C02"
            },
            {
              "op": "caseSolved",
              "id": "C03"
            }
          ]
        },
        "effects": [
          {
            "op": "acceptCase",
            "id": "C04"
          }
        ]
      },
      {
        "id": "D_C04_LATER",
        "labelJa": "今は受けない",
        "nextId": "D_C04_DECLINE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "entryPolicy": "requester_router_unaccepted_and_prerequisites_met"
  },
  {
    "id": "D_C04_ACCEPT",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "accept",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "葛葉",
    "textJa": "ありがとうございます。下の踊り場で、小雨の話を聞いてあげてくださいな。私が代理を頼んだことと、あの子が実際に何を引き受けたのか――その両方を。",
    "choices": [
      {
        "id": "D_C04_BEGIN",
        "labelJa": "調べに行く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE"
  },
  {
    "id": "D_C04_DECLINE",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "decline",
    "condition": {
      "all": []
    },
    "speakerJa": "葛葉",
    "textJa": "ええ、承知いたしました。お返事を変えていただくために、困った顔をして見送るような真似はいたしません。どうぞ、お気をつけて。",
    "choices": [
      {
        "id": "D_C04_DECLINE_CLOSE",
        "labelJa": "また今度",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE"
  },
  {
    "id": "D_C04_PRELUDE",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "葛葉",
    "textJa": "花嫁の支度は着々と進んでいますわ。京の支度はどうするのか、祭の支度はどうするのかと、方々から尋ねられますの。ただ……私自身の予定を書き込む欄だけは、なかなか見当たらなくて。",
    "choices": [
      {
        "id": "D_C04_PRELUDE_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "entryPolicy": "requester_router_prerequisites_not_met"
  },
  {
    "id": "D_C04_REPEAT",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "葛葉",
    "textJa": "「空は晴れていた」と言い張る方の話も、「途中で雨に降られた」と言う小雨の話も、まずはそのまま聞いてみてください。どちらかを嘘つきにしなくても、真実は確かめられるはずですわ。",
    "choices": [
      {
        "id": "D_C04_REPEAT_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openCaseNotebook",
          "caseId": "C04"
        }
      },
      {
        "id": "D_C04_REPORT",
        "labelJa": "確かめたことを報告する",
        "nextId": "D_C04_RESOLVE",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C04"
            },
            {
              "op": "hasInference",
              "id": "INF_C04_01"
            },
            {
              "op": "hasInference",
              "id": "INF_C04_02"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C04_07"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C04_SCENE_FIRST_SENTENCE_REPEAT_MENU",
        "labelJa": "欠席の返事について聞く",
        "nextId": "D_C04_SCENE_FIRST_SENTENCE",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C04"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C04_SCENE_KOSAME_SCOPE_REPEAT_MENU",
        "labelJa": "小雨に何を頼んだ？",
        "nextId": "D_C04_SCENE_KOSAME_SCOPE",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C04"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C04_SCENE_RESTORED_NO_REPEAT_MENU",
        "labelJa": "全文が読めたら京へ行ける？",
        "nextId": "D_C04_SCENE_RESTORED_NO",
        "condition": {
          "all": [
            {
              "op": "hasInference",
              "id": "INF_C04_02"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C04_CONTINUE_SEARCH",
        "labelJa": "もう少し調べる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "entryPolicy": "requester_router_accepted_unresolved"
  },
  {
    "id": "D_C04_RESOLVE",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        },
        {
          "op": "hasInference",
          "id": "INF_C04_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C04_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C04_07"
        }
      ]
    },
    "speakerJa": "葛葉",
    "textJa": "続きの文は、最初からそこにあったのですね。小雨を代理に立て、里の餅つきはこれまでどおり続ける――それが私の返事ですわ。そして小雨が引き受けたのは、午前の使いまで。",
    "choices": [
      {
        "id": "D_C04_RESOLVE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_RESOLVE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "entryPolicy": "explicit_resolution_only",
    "stageDirectionJa": "葛葉は開いた手紙の最初の一行を指す。祝いの音は続くが、この返事を急かす拍手や一斉の歓声は入れない。"
  },
  {
    "id": "D_C04_RESOLVE_L2",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        },
        {
          "op": "hasInference",
          "id": "INF_C04_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C04_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C04_07"
        }
      ]
    },
    "speakerJa": "葛葉",
    "textJa": "誤解が解けて皆が喜んでくれるのは、私もうれしいですわ。けれど、これで「ならば私も京へ行けるはず」という話にだけは、なさらないでくださいまし。",
    "choices": [
      {
        "id": "D_C04_RESOLVE_L2_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_RESOLVE_L3",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "entryPolicy": "explicit_resolution_only"
  },
  {
    "id": "D_C04_RESOLVE_L3",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        },
        {
          "op": "hasInference",
          "id": "INF_C04_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C04_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C04_07"
        }
      ]
    },
    "speakerJa": "葛葉",
    "textJa": "手紙の続きが読めるようになっても、最初の一行が消えるわけではありません。私は京へは参りません。そのありのままの返事を、どうか届けてください。",
    "choices": [
      {
        "id": "D_C04_CONFIRM",
        "labelJa": "確定したことを伝える",
        "nextId": "D_C04_POST",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C04"
            },
            {
              "op": "hasInference",
              "id": "INF_C04_01"
            },
            {
              "op": "hasInference",
              "id": "INF_C04_02"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C04_07"
            }
          ]
        },
        "effects": [
          {
            "op": "completeCase",
            "id": "C04"
          },
          {
            "op": "acquireEvidence",
            "id": "EV_C04_90"
          }
        ]
      },
      {
        "id": "D_C04_REVIEW_FIRST",
        "labelJa": "先に手帖を確かめる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openCaseNotebook",
          "caseId": "C04"
        }
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "entryPolicy": "explicit_resolution_only"
  },
  {
    "id": "D_C04_POST",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "葛葉",
    "textJa": "小雨は引き受けた使いへ、私はこの婚礼へ。そのあと休むかどうかも、それぞれが自分で決めること。これでようやく、余計な支度がひとつ減りましたわ。",
    "choices": [
      {
        "id": "D_C04_POST_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "entryPolicy": "requester_router_solved_or_resolution_continuation"
  },
  {
    "id": "D_C05_OFFER",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "offer",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "潮蔵",
    "textJa": "わしの蔵には十二俵、通し番号まできっちり揃っておる。それなのに、陸の蔵も合わせて「三十俵が消えた」とされ、弁済を迫る書状が届いたのじゃ！",
    "choices": [
      {
        "id": "D_C05_OFFER_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_OFFER_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_REQUEST",
    "entryPolicy": "requester_router_unaccepted_and_prerequisites_met"
  },
  {
    "id": "D_C05_OFFER_L2",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "offer",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "潮蔵",
    "textJa": "共同の船便そのものには賛成じゃ。運ぶ者の手間がぐっと軽くなるからの。だが、その話し合いのために、ありもしない不足の責任まで背負うわけにはいかぬ。調べてはくれぬか。",
    "choices": [
      {
        "id": "D_C05_TAKE",
        "labelJa": "頼み事を受ける",
        "nextId": "D_C05_ACCEPT",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C04"
            }
          ]
        },
        "effects": [
          {
            "op": "acceptCase",
            "id": "C05"
          }
        ]
      },
      {
        "id": "D_C05_LATER",
        "labelJa": "今は受けない",
        "nextId": "D_C05_DECLINE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_REQUEST",
    "entryPolicy": "requester_router_unaccepted_and_prerequisites_met"
  },
  {
    "id": "D_C05_ACCEPT",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "accept",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        }
      ]
    },
    "speakerJa": "潮蔵",
    "textJa": "かたじけない。俵の数だけでなく、同じ荷が誰の手から誰の手へ渡ったかを辿ってみてくれ。空っぽになった中継の蔵にも、ちゃんと終えた仕事があるはずじゃ。",
    "choices": [
      {
        "id": "D_C05_BEGIN",
        "labelJa": "調べに行く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_REQUEST"
  },
  {
    "id": "D_C05_DECLINE",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "decline",
    "condition": {
      "all": []
    },
    "speakerJa": "潮蔵",
    "textJa": "承知した。潜って来たばかりで疲れもあろう。荷の記録はそのまま残しておく。見るだけなら、いつでも来るがよい。",
    "choices": [
      {
        "id": "D_C05_DECLINE_CLOSE",
        "labelJa": "また今度",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_REQUEST"
  },
  {
    "id": "D_C05_PRELUDE",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "潮蔵",
    "textJa": "共同で運べれば、助かる者は多い。わしもその一人じゃよ。ただ、どこへ預けるかは、荷の持ち主にもきちんと聞かねばならんな。",
    "choices": [
      {
        "id": "D_C05_PRELUDE_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_REQUEST",
    "entryPolicy": "requester_router_prerequisites_not_met"
  },
  {
    "id": "D_C05_REPEAT",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        }
      ]
    },
    "speakerJa": "潮蔵",
    "textJa": "蔵を満たした者の札だけでなく、次へ渡して空にした者の札も読んでおくれ。二枚の受取札を並べて、二山の米が生まれたように数えてしまっておらぬか？",
    "choices": [
      {
        "id": "D_C05_REPEAT_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openCaseNotebook",
          "caseId": "C05"
        }
      },
      {
        "id": "D_C05_REPORT",
        "labelJa": "京の報告先を確かめる",
        "nextId": "D_C05_COURT_ROUTE",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C05"
            },
            {
              "op": "hasInference",
              "id": "INF_C05_01"
            },
            {
              "op": "hasInference",
              "id": "INF_C05_02"
            },
            {
              "op": "trialWon",
              "id": "TR_C05"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C05_SCENE_JOINT_SHIP_REPEAT_MENU",
        "labelJa": "共同輸送には反対なの？",
        "nextId": "D_C05_SCENE_JOINT_SHIP",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C05"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C05_CONTINUE_SEARCH",
        "labelJa": "もう少し調べる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_REQUEST",
    "entryPolicy": "requester_router_accepted_unresolved"
  },
  {
    "id": "D_C05_RESOLVE",
    "caseId": "C05",
    "npcId": "NPC_SHIRAE",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        },
        {
          "op": "hasInference",
          "id": "INF_C05_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C05_02"
        },
        {
          "op": "trialWon",
          "id": "TR_C05"
        }
      ]
    },
    "speakerJa": "白枝",
    "textJa": "同じ荷が蔵を移るたびに、別の新しい在庫として二度数えられていただけでした。これでは「三十俵が消えた」などという言い分、通るはずがありません。",
    "choices": [
      {
        "id": "D_C05_RESOLVE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_RESOLVE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_COURT",
    "entryPolicy": "explicit_resolution_only",
    "stageDirectionJa": "裁判の図では、中継から荷が渡るたびに中継在庫が空くことを見せる。空になった場所を罰印で塗らない。"
  },
  {
    "id": "D_C05_RESOLVE_L2",
    "caseId": "C05",
    "npcId": "NPC_SHIRAE",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        },
        {
          "op": "hasInference",
          "id": "INF_C05_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C05_02"
        },
        {
          "op": "trialWon",
          "id": "TR_C05"
        }
      ]
    },
    "speakerJa": "白枝",
    "textJa": "共同輸送の利点は、それとは別に話し合えばよいこと。存在しない不足の弁済を迫ったり、荷を取り上げたりする根拠にはなりません。確定したことを伝えてください。",
    "choices": [
      {
        "id": "D_C05_CONFIRM",
        "labelJa": "確定したことを伝える",
        "nextId": "D_C05_POST",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C05"
            },
            {
              "op": "hasInference",
              "id": "INF_C05_01"
            },
            {
              "op": "hasInference",
              "id": "INF_C05_02"
            },
            {
              "op": "trialWon",
              "id": "TR_C05"
            }
          ]
        },
        "effects": [
          {
            "op": "completeCase",
            "id": "C05"
          },
          {
            "op": "acquireEvidence",
            "id": "EV_C05_90"
          }
        ]
      },
      {
        "id": "D_C05_REVIEW_FIRST",
        "labelJa": "先に手帖を確かめる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openCaseNotebook",
          "caseId": "C05"
        }
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_COURT",
    "entryPolicy": "explicit_resolution_only"
  },
  {
    "id": "D_C05_POST",
    "caseId": "C05",
    "npcId": "NPC_SHIRAE",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C05"
        }
      ]
    },
    "speakerJa": "白枝",
    "textJa": "三便の物資に関する申立ては退けます。誰がこの誤った集計を知りながら使ったのかは、別の審理で確かめましょう。荷主たちの返事まで、ここで代わりに決めることはいたしません。",
    "choices": [
      {
        "id": "D_C05_POST_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_COURT",
    "entryPolicy": "court_resolution_continuation_only"
  },
  {
    "id": "D_C05_COURT_ROUTE",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        },
        {
          "op": "hasInference",
          "id": "INF_C05_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C05_02"
        },
        {
          "op": "trialWon",
          "id": "TR_C05"
        }
      ]
    },
    "speakerJa": "潮蔵",
    "textJa": "京の評定所で、白枝どのに事の結びを報告しておくれ。受付は直記どのじゃ。わしも、ここで確かめた荷の記録を大切に守っておくぞ。",
    "choices": [
      {
        "id": "D_C05_COURT_ROUTE_CLOSE",
        "labelJa": "京の評定所へ向かう",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_REQUEST",
    "entryPolicy": "requester_ready_to_report_no_remote_judge"
  },
  {
    "id": "D_C05_RETURN",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C05"
        }
      ]
    },
    "speakerJa": "潮蔵",
    "textJa": "荷の数が戻ったのではない。初めから、ずっとここにあったのじゃ！　共同の船便の話は、これから改めて腰を据えて話し合う。お前さんも、よかったら茶を一杯飲んでいけ。",
    "choices": [
      {
        "id": "D_C05_RETURN_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_REQUEST",
    "entryPolicy": "requester_router_solved"
  },
  {
    "id": "D_C06_OFFER",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "offer",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "灯庵",
    "textJa": "お寺へ祈りにいらした方々のお名前が、「各里の餅つきを取りやめる」と書かれた連名書に貼り付けられております。署名は、確かに皆さまの直筆でございます。",
    "choices": [
      {
        "id": "D_C06_OFFER_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C06_OFFER_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_REQUEST",
    "entryPolicy": "requester_router_unaccepted_and_prerequisites_met"
  },
  {
    "id": "D_C06_OFFER_L2",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "offer",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "灯庵",
    "textJa": "祭を続けたい方も、誰かの手を借りたい方も、今年は少し仕事を減らしたい方も、同じひとつの願いに名を書かれました。そのおひとりおひとりの違いごと、確かめていただけますでしょうか。",
    "choices": [
      {
        "id": "D_C06_TAKE",
        "labelJa": "頼み事を受ける",
        "nextId": "D_C06_ACCEPT",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C04"
            }
          ]
        },
        "effects": [
          {
            "op": "acceptCase",
            "id": "C06"
          }
        ]
      },
      {
        "id": "D_C06_LATER",
        "labelJa": "今は受けない",
        "nextId": "D_C06_DECLINE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_REQUEST",
    "entryPolicy": "requester_router_unaccepted_and_prerequisites_met"
  },
  {
    "id": "D_C06_ACCEPT",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "accept",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "灯庵",
    "textJa": "ありがとうございます。まずは、祈願票を三つに分ける手順をお見せいたしましょう。そのうえで、各地へ足を運び、ご本人の控えとお話を直接お聞きください。私の説明だけで済ませてしまわぬように。",
    "choices": [
      {
        "id": "D_C06_BEGIN",
        "labelJa": "調べに行く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_REQUEST"
  },
  {
    "id": "D_C06_DECLINE",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "decline",
    "condition": {
      "all": []
    },
    "speakerJa": "灯庵",
    "textJa": "承知いたしました。お参りだけでも、ひと休みだけでも、どうぞご自由に。こちらの頼みを引き受けることと、お堂へ入ることは別のことでございますから。",
    "choices": [
      {
        "id": "D_C06_DECLINE_CLOSE",
        "labelJa": "また今度",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_REQUEST"
  },
  {
    "id": "D_C06_PRELUDE",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "灯庵",
    "textJa": "「今日も、それぞれの里で餅をつけますように」。同じ一文にお名前を連ねる方々にも、それぞれ異なる暮らしがございます。",
    "choices": [
      {
        "id": "D_C06_PRELUDE_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_REQUEST",
    "entryPolicy": "requester_router_prerequisites_not_met"
  },
  {
    "id": "D_C06_REPEAT",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "灯庵",
    "textJa": "署名が本物であるという点は、私も争いません。ただ、その名前のうえに本来何が書かれていたのか。そしてご本人が何を引き受けたのかを、元のかたちに戻して読んでいただきたいのです。",
    "choices": [
      {
        "id": "D_C06_REPEAT_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openCaseNotebook",
          "caseId": "C06"
        }
      },
      {
        "id": "D_C06_REPORT",
        "labelJa": "京の報告先を確かめる",
        "nextId": "D_C06_COURT_ROUTE",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C06"
            },
            {
              "op": "hasInference",
              "id": "INF_C06_01"
            },
            {
              "op": "hasInference",
              "id": "INF_C06_02"
            },
            {
              "op": "trialWon",
              "id": "TR_C06"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C06_SCENE_PRAYER_DIFFERENCE_REPEAT_MENU",
        "labelJa": "同じ祈りなら同じ希望では？",
        "nextId": "D_C06_SCENE_PRAYER_DIFFERENCE",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C06"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C06_CONTINUE_SEARCH",
        "labelJa": "もう少し調べる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_REQUEST",
    "entryPolicy": "requester_router_accepted_unresolved"
  },
  {
    "id": "D_C06_RESOLVE",
    "caseId": "C06",
    "npcId": "NPC_SHIRAE",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        },
        {
          "op": "hasInference",
          "id": "INF_C06_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C06_02"
        },
        {
          "op": "trialWon",
          "id": "TR_C06"
        }
      ]
    },
    "speakerJa": "白枝",
    "textJa": "これらの署名片は、本来「里で餅をつけるよう祈った票」から切り離されたものですね。祭の取りやめに対する同意としては認められません。",
    "choices": [
      {
        "id": "D_C06_RESOLVE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C06_RESOLVE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_COURT",
    "entryPolicy": "explicit_resolution_only",
    "stageDirectionJa": "同じ祈願文に、継続・共同厨房の希望・仕事を減らす返事を別々に並べる。賛成の一色へまとめない。"
  },
  {
    "id": "D_C06_RESOLVE_L2",
    "caseId": "C06",
    "npcId": "NPC_SHIRAE",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        },
        {
          "op": "hasInference",
          "id": "INF_C06_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C06_02"
        },
        {
          "op": "trialWon",
          "id": "TR_C06"
        }
      ]
    },
    "speakerJa": "白枝",
    "textJa": "ただし、だからといって全員が以前とまったく同じ働き方を望んだとも決めつけません。共同の台所を使いたいという返事も、今年の仕事を減らしたいという返事も、それぞれ別の意思として残ります。",
    "choices": [
      {
        "id": "D_C06_CONFIRM",
        "labelJa": "確定したことを伝える",
        "nextId": "D_C06_POST",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C06"
            },
            {
              "op": "hasInference",
              "id": "INF_C06_01"
            },
            {
              "op": "hasInference",
              "id": "INF_C06_02"
            },
            {
              "op": "trialWon",
              "id": "TR_C06"
            }
          ]
        },
        "effects": [
          {
            "op": "completeCase",
            "id": "C06"
          },
          {
            "op": "acquireEvidence",
            "id": "EV_C06_90"
          }
        ]
      },
      {
        "id": "D_C06_REVIEW_FIRST",
        "labelJa": "先に手帖を確かめる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openCaseNotebook",
          "caseId": "C06"
        }
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_COURT",
    "entryPolicy": "explicit_resolution_only"
  },
  {
    "id": "D_C06_POST",
    "caseId": "C06",
    "npcId": "NPC_SHIRAE",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "白枝",
    "textJa": "祈願票の本来の目的を回復し、「取りやめへの包括的な同意」という主張は退けます。催しの継続、共同運営、各人の休みについては、どうかそれぞれ本人の口から確かめてください。",
    "choices": [
      {
        "id": "D_C06_POST_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_COURT",
    "entryPolicy": "court_resolution_continuation_only"
  },
  {
    "id": "D_C06_COURT_ROUTE",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        },
        {
          "op": "hasInference",
          "id": "INF_C06_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C06_02"
        },
        {
          "op": "trialWon",
          "id": "TR_C06"
        }
      ]
    },
    "speakerJa": "灯庵",
    "textJa": "最後のご報告は、京の評定所にいらっしゃる白枝さまへお願いいたします。私はここでお寺に残る祈願の原本を守り、お参りくださった皆さまへ結果をお伝えいたします。",
    "choices": [
      {
        "id": "D_C06_COURT_ROUTE_CLOSE",
        "labelJa": "京の評定所へ向かう",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_REQUEST",
    "entryPolicy": "requester_ready_to_report_no_remote_judge"
  },
  {
    "id": "D_C06_RETURN",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "灯庵",
    "textJa": "願いの文は、ようやく元の場所へ戻りました。返事までひとつに揃える必要はないのですね。皆さまへ控えをお返ししたら、今日は私も少し腰を下ろして休むことにいたします。",
    "choices": [
      {
        "id": "D_C06_RETURN_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_REQUEST",
    "entryPolicy": "requester_router_solved"
  },
  {
    "id": "D_C07_OFFER",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "offer",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C05"
        },
        {
          "op": "caseSolved",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "羽文",
    "textJa": "大変なんです！　ぼくが届けてきたはずの訂正が、京の申し立てにはひとつも載っていないんですよ。あなたの手帖に残っていた最初の相談だけが、「今も解決していない失敗」として並べられているんです。",
    "choices": [
      {
        "id": "D_C07_OFFER_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_OFFER_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST",
    "entryPolicy": "requester_router_unaccepted_and_prerequisites_met"
  },
  {
    "id": "D_C07_OFFER_L2",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "offer",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C05"
        },
        {
          "op": "caseSolved",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "羽文",
    "textJa": "筆丸さんには、解決した結果も確かに渡しました。あの人がみんなの手間を減らしてくれたことも知っています。だからこそ、何が残されて、何が切り落とされたのか――あなたの目で確かめてほしいんです！",
    "choices": [
      {
        "id": "D_C07_TAKE",
        "labelJa": "頼み事を受ける",
        "nextId": "D_C07_ACCEPT",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C05"
            },
            {
              "op": "caseSolved",
              "id": "C06"
            }
          ]
        },
        "effects": [
          {
            "op": "acceptCase",
            "id": "C07"
          }
        ]
      },
      {
        "id": "D_C07_LATER",
        "labelJa": "今は受けない",
        "nextId": "D_C07_DECLINE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST",
    "entryPolicy": "requester_router_unaccepted_and_prerequisites_met"
  },
  {
    "id": "D_C07_ACCEPT",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "accept",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "羽文",
    "textJa": "ありがとうございます！　まずは、元の見開きと、提出された片側の頁を並べてみましょう。書かれている文そのものが本物でも、一緒に渡した続きを切り落とせば、まるで別の話になってしまいますから。",
    "choices": [
      {
        "id": "D_C07_BEGIN",
        "labelJa": "調べに行く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST"
  },
  {
    "id": "D_C07_DECLINE",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "decline",
    "condition": {
      "all": []
    },
    "speakerJa": "羽文",
    "textJa": "わかりました。預かってきた控えはそのまま残しておきます。返事を急がせて、あの人たちと同じ間違いをしたくはありませんから。",
    "choices": [
      {
        "id": "D_C07_DECLINE_CLOSE",
        "labelJa": "また今度",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST"
  },
  {
    "id": "D_C07_PRELUDE",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "羽文",
    "textJa": "竜宮の荷と東大寺の署名について、いよいよ評定所で審理が始まります。ぼくが運んだ資料のどの部分が申し立てに使われたのか、ぼく自身も控えを見直しているところです。",
    "choices": [
      {
        "id": "D_C07_PRELUDE_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST",
    "entryPolicy": "requester_router_prerequisites_not_met"
  },
  {
    "id": "D_C07_REPEAT",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "羽文",
    "textJa": "筆丸さんに便利な工夫があったことと、提出された束が正しいかどうかは別の話です。切り離された頁、残った墨移り、読み返した記録――それらをひとつにつなぎ合わせましょう！",
    "choices": [
      {
        "id": "D_C07_REPEAT_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openCaseNotebook",
          "caseId": "C07"
        }
      },
      {
        "id": "D_C07_REPORT",
        "labelJa": "京の報告先を確かめる",
        "nextId": "D_C07_COURT_ROUTE",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C07"
            },
            {
              "op": "hasInference",
              "id": "INF_C07_01"
            },
            {
              "op": "hasInference",
              "id": "INF_C07_02"
            },
            {
              "op": "hasInference",
              "id": "INF_C07_03"
            },
            {
              "op": "trialWon",
              "id": "TR_C07"
            },
            {
              "op": "hasInference",
              "id": "INF_C07_04"
            },
            {
              "op": "hasInference",
              "id": "INF_C07_05"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C07_SCENE_CARRIER_REPEAT_MENU",
        "labelJa": "自分の記録も使われている？",
        "nextId": "D_C07_SCENE_CARRIER",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C07"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C07_CONTINUE_SEARCH",
        "labelJa": "もう少し調べる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST",
    "entryPolicy": "requester_router_accepted_unresolved"
  },
  {
    "id": "D_C07_RESOLVE",
    "caseId": "C07",
    "npcId": "NPC_SHIRAE",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_02"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_03"
        },
        {
          "op": "trialWon",
          "id": "TR_C07"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_04"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_05"
        }
      ]
    },
    "speakerJa": "白枝",
    "textJa": "この申し立ては、訂正された結果だけを切り落とし、最初の相談を「現在も未解決の事案」として利用していました。切り離された紙の縁と墨の痕、確認から提出までの記録がすべて一致しています。",
    "choices": [
      {
        "id": "D_C07_RESOLVE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_RESOLVE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_COURT",
    "entryPolicy": "explicit_resolution_only",
    "stageDirectionJa": "切り離された相談欄と戻された結果欄の隣へ、真正な個人の返上状を一通残す。結末に全員が祝い役へ並ぶ場面を置かない。"
  },
  {
    "id": "D_C07_RESOLVE_L2",
    "caseId": "C07",
    "npcId": "NPC_SHIRAE",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_02"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_03"
        },
        {
          "op": "trialWon",
          "id": "TR_C07"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_04"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_05"
        }
      ]
    },
    "speakerJa": "白枝",
    "textJa": "筆丸は正しい結果を知ったうえで、意図的にこの部分だけを選び、提出したものと認定します。署名や相談を預けたことは、このような改変と提出への同意を意味しません。",
    "choices": [
      {
        "id": "D_C07_RESOLVE_L2_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_RESOLVE_L3",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_COURT",
    "entryPolicy": "explicit_resolution_only"
  },
  {
    "id": "D_C07_RESOLVE_L3",
    "caseId": "C07",
    "npcId": "NPC_SHIRAE",
    "situation": "resolution",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_02"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_03"
        },
        {
          "op": "trialWon",
          "id": "TR_C07"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_04"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_05"
        }
      ]
    },
    "speakerJa": "白枝",
    "textJa": "その一方で、杵吉が祝いの一搗き役を返上する書付は真正なものです。誤った申し立てを退けるあまり、本人の正当な辞退まで消してしまってはなりません。確定した結論を伝えてください。",
    "choices": [
      {
        "id": "D_C07_CONFIRM",
        "labelJa": "確定したことを伝える",
        "nextId": "D_C07_POST",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C07"
            },
            {
              "op": "hasInference",
              "id": "INF_C07_01"
            },
            {
              "op": "hasInference",
              "id": "INF_C07_02"
            },
            {
              "op": "hasInference",
              "id": "INF_C07_03"
            },
            {
              "op": "trialWon",
              "id": "TR_C07"
            },
            {
              "op": "hasInference",
              "id": "INF_C07_04"
            },
            {
              "op": "hasInference",
              "id": "INF_C07_05"
            }
          ]
        },
        "effects": [
          {
            "op": "completeCase",
            "id": "C07"
          },
          {
            "op": "acquireEvidence",
            "id": "EV_C07_90"
          }
        ]
      },
      {
        "id": "D_C07_REVIEW_FIRST",
        "labelJa": "先に手帖を確かめる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openCaseNotebook",
          "caseId": "C07"
        }
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_COURT",
    "entryPolicy": "explicit_resolution_only"
  },
  {
    "id": "D_C07_POST",
    "caseId": "C07",
    "npcId": "NPC_SHIRAE",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "白枝",
    "textJa": "「一つ臼」の申し立ては退けます。筆丸には、元の原本と訂正記録を保全したうえで、誤った内容を伝えたすべての先へ訂正を届けることを命じます。",
    "choices": [
      {
        "id": "D_C07_POST_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_POST_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_COURT",
    "entryPolicy": "court_resolution_continuation_only"
  },
  {
    "id": "D_C07_POST_L2",
    "caseId": "C07",
    "npcId": "NPC_SHIRAE",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "白枝",
    "textJa": "それぞれの里は、続けることも、休むことも、合意した共同の仕組みを使うことも自由に選べます。役目と費用を決める相談は、改めてひとりひとりの返事を得てから行ってください。",
    "choices": [
      {
        "id": "D_C07_POST_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_COURT",
    "entryPolicy": "court_resolution_continuation_only"
  },
  {
    "id": "D_C07_COURT_ROUTE",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_01"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_02"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_03"
        },
        {
          "op": "trialWon",
          "id": "TR_C07"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_04"
        },
        {
          "op": "hasInference",
          "id": "INF_C07_05"
        }
      ]
    },
    "speakerJa": "羽文",
    "textJa": "最後は、評定所の白枝さまに結論をお伝えしましょう。ぼくも、各地へ戻すための訂正の写しを揃えておきます。",
    "choices": [
      {
        "id": "D_C07_COURT_ROUTE_CLOSE",
        "labelJa": "京の評定所へ向かう",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST",
    "entryPolicy": "requester_ready_to_report_no_remote_judge"
  },
  {
    "id": "D_C07_RETURN",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "羽文",
    "textJa": "これから訂正を届ける便を組みます。もう「参加を取りつけるための旅」にはしません。各地から返ってきた言葉がどれほどばらばらでも、そのまま持ち帰ります。",
    "choices": [
      {
        "id": "D_C07_RETURN_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST",
    "entryPolicy": "requester_router_solved"
  },
  {
    "id": "D_NPC_KINEKICHI_INTRO",
    "caseId": null,
    "npcId": "NPC_KINEKICHI",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "杵吉",
    "textJa": "今振っているのは普段づかいの杵さ。お祝いの大杵は年に一度しか出番がねえ。……あれのほうが、よほど私より休み上手だよな。",
    "choices": [
      {
        "id": "D_C01_SCENE_LETTER_MENU",
        "labelJa": "返上の書付について",
        "nextId": "D_C01_SCENE_LETTER",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C01_07"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C01_SCENE_OLD_DEBT_MENU",
        "labelJa": "継丸への修理の頼みについて",
        "nextId": "D_C01_SCENE_OLD_DEBT",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C01"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C07_SCENE_VALID_REFUSAL_MENU",
        "labelJa": "申立ての中の返上状について",
        "nextId": "D_C07_SCENE_VALID_REFUSAL",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C01_07"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C07_01"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_KINEKICHI_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_KINEKICHI_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_KINEKICHI",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "杵吉",
    "textJa": "「杵が戻った」とは書いたが、「私が戻る」とはひと言も書いていないよ。今年から祝いの一搗き役は返上する。普段の餅なら、まあ、気が向いた日にでもな。",
    "choices": [
      {
        "id": "D_NPC_KINEKICHI_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_KAEKICHI_INTRO",
    "caseId": null,
    "npcId": "NPC_KAEKICHI",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "返吉",
    "textJa": "返吉だよ。餅を返す役ってのは、いつだって臼の中ばかり睨んでるもんだ。長く組んでるとさ、かえって隣の相棒の顔を見損なうことがあるんだよね。",
    "choices": [
      {
        "id": "D_C01_SCENE_PARTNER_MENU",
        "labelJa": "杵吉が休むと困る？",
        "nextId": "D_C01_SCENE_PARTNER",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C01"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_KAEKICHI_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_KAEKICHI_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_KAEKICHI",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "返吉",
    "textJa": "祝いの一搗き役は、引き受けたい者に声をかけて決めることにしたよ。まだ決まらないなら、決まるまで始めるのを少し遅らせるだけさ。",
    "choices": [
      {
        "id": "D_NPC_KAEKICHI_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_TSUGUMARU_INTRO",
    "caseId": null,
    "npcId": "NPC_TSUGUMARU",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "継丸",
    "textJa": "継丸です。修理のご相談でしたら、品物と、いつまでに必要かを教えてください。……あと、お代金のことも。後回しにすると、あとで互いに苦しくなりますから。",
    "choices": [
      {
        "id": "D_C01_SCENE_REPAIR_PAY_MENU",
        "labelJa": "修理の仕事はどうなっている？",
        "nextId": "D_C01_SCENE_REPAIR_PAY",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C01"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C01_SCENE_REPAIR_RESPONSIBILITY_MENU",
        "labelJa": "杵と修理の責任を話す",
        "nextId": "D_C01_SCENE_REPAIR_RESPONSIBILITY",
        "condition": {
          "all": [
            {
              "op": "hasInference",
              "id": "INF_C01_01"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_TSUGUMARU_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_BENCH",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_TSUGUMARU_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_TSUGUMARU",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "継丸",
    "textJa": "前に約束していた修理代は、無事に受け取りました。次の品からは、預かる期日と代金を先に決めることにします。これなら、無理なときはちゃんと断れそうです。",
    "choices": [
      {
        "id": "D_NPC_TSUGUMARU_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_FUDEM_INTRO",
    "caseId": null,
    "npcId": "NPC_FUDEM",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "筆丸",
    "textJa": "筆丸と申します。ややこしい記録の整理は、すべて私にお任せを。ご相談の文面と、その後の結果を左右の見開きに収められる手帖を作ったんですよ。読む方の手間も、少しは省けませんとね。",
    "choices": [
      {
        "id": "D_C01_SCENE_NOTEBOOK_MENU",
        "labelJa": "この手帖の使い方を聞く",
        "nextId": "D_C01_SCENE_NOTEBOOK",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C01"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C01_SCENE_HELPFUL_WORK_MENU",
        "labelJa": "共同の仕組みは誰のため？",
        "nextId": "D_C01_SCENE_HELPFUL_WORK",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C01"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C07_SCENE_CHOSEN_WORDS_MENU",
        "labelJa": "相談と結果をどう扱った？",
        "nextId": "D_C07_SCENE_CHOSEN_WORDS",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C07_01"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_FUDEM_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_FUDEM_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "筆丸",
    "textJa": "訂正の頁を落としたのは、紛れもなく私です。いま直記どのと一緒に、元の言葉をひとつずつ戻しているところです。……共同の仕組みを求める声があったとしても、それは私にすべてを任せる返事とは限りませんでしたね。",
    "choices": [
      {
        "id": "D_NPC_FUDEM_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_NAKIKICHI_INTRO",
    "caseId": null,
    "npcId": "NPC_NAKIKICHI",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "鳴吉",
    "textJa": "呼出しの鳴吉だ。俺が名を高らかに呼べば、あいつが土俵へ出てくる。長いこと、それが当たり前の景色だったんだがな……。",
    "choices": [
      {
        "id": "D_C02_SCENE_CALLING_MENU",
        "labelJa": "芦ノ山を探す理由を聞く",
        "nextId": "D_C02_SCENE_CALLING",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C02"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C02_SCENE_NO_FACE_MENU",
        "labelJa": "顔は本当に見えた？",
        "nextId": "D_C02_SCENE_NO_FACE",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C02_01"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_NAKIKICHI_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_NAKIKICHI_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_NAKIKICHI",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "鳴吉",
    "textJa": "芦ノ山の名は、今年の出番札から外したよ。空いた枠に別の誰かの名を書こうとして……いや、今年はそこを空欄のままにしておくことにしたんだ。",
    "choices": [
      {
        "id": "D_NPC_NAKIKICHI_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_ASHINOYAMA_INTRO",
    "caseId": null,
    "npcId": "NPC_ASHINOYAMA",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "芦ノ山",
    "textJa": "芦ノ山だ。今日は横綱の務めで来ているわけじゃない。餅を返す手つきを、一から習っているところだよ。",
    "choices": [
      {
        "id": "D_C02_SCENE_PRIVACY_MENU",
        "labelJa": "無事かどうかだけ聞く",
        "nextId": "D_C02_SCENE_PRIVACY",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C02"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C02_SCENE_BEGINNER_MENU",
        "labelJa": "手返しを習う理由を聞く",
        "nextId": "D_C02_SCENE_BEGINNER",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C02"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C02_SCENE_RETURN_MENU",
        "labelJa": "桜川へ戻るつもりは？",
        "nextId": "D_C02_SCENE_RETURN",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C02_07"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_ASHINOYAMA_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_ASHINOYAMA_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "芦ノ山",
    "textJa": "今日はただ見物に来ただけだ。横綱の綱を締めていなくても、こうして温かい茶を出してもらえるとはな。……うん、うまい。",
    "choices": [
      {
        "id": "D_NPC_ASHINOYAMA_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_SHIROASHI_INTRO",
    "caseId": null,
    "npcId": "NPC_SHIROASHI",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "白足",
    "textJa": "白足だよ。配達の頼みなら、行き先と中身をはっきり教えておくれ。帰り道に「ついでにこれも」って三つも増えたら、もう別の旅になっちゃうからね。",
    "choices": [
      {
        "id": "D_C02_SCENE_LOAD_MENU",
        "labelJa": "なぜ横綱の綱を借りた？",
        "nextId": "D_C02_SCENE_LOAD",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C02_02"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_SHIROASHI_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_TEABENCH",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_SHIROASHI_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_SHIROASHI",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "白足",
    "textJa": "お借りしていた綱はお返ししたよ。今日は最初から頼まれていた便だけを運ぶんだ。帰り道は、鹿さんと相談して決めることにするよ。",
    "choices": [
      {
        "id": "D_NPC_SHIROASHI_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_TAWARATA_INTRO",
    "caseId": null,
    "npcId": "NPC_TAWARATA",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "俵太",
    "textJa": "俵太です。荷を預かるときは、まず目の前で数を確かめます。けれど、「俺を信じていないのか」と先に言われてしまうと……それ以上、数えようがなくなるんです。",
    "choices": [
      {
        "id": "D_C03_SCENE_FAVOR_MENU",
        "labelJa": "俵九郎との付き合いを聞く",
        "nextId": "D_C03_SCENE_FAVOR",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C03"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C03_SCENE_COVER_SHORTFALL_MENU",
        "labelJa": "店が二杯を負担するという話は？",
        "nextId": "D_C03_SCENE_COVER_SHORTFALL",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C03"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_TAWARATA_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_TAWARATA_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_TAWARATA",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "俵太",
    "textJa": "補填の米を受け取り、公の訂正も聞き届けました。次の荷を引き受けるかどうかは、きちんと条件を見てから決めます。もちろん、昔の恩はそれとは別に、ずっと覚えていますよ。",
    "choices": [
      {
        "id": "D_NPC_TAWARATA_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_TAWARAKURO_INTRO",
    "caseId": null,
    "npcId": "NPC_TAWARAKURO",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "俵九郎",
    "textJa": "俵九郎です。お米の値段は看板に、ご用向きはこの私へ。貼り紙の数字だけでは、商いの事情は語り尽くせませんからなあ。",
    "choices": [
      {
        "id": "D_C03_SCENE_COST_MENU",
        "labelJa": "店の費用について聞く",
        "nextId": "D_C03_SCENE_COST",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C03"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C03_SCENE_TEN_SCOOPS_MENU",
        "labelJa": "十杯量ったという主張を聞く",
        "nextId": "D_C03_SCENE_TEN_SCOOPS",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C03_01"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C03_SCENE_PUBLIC_CORRECTION_MENU",
        "labelJa": "不足と訂正について話す",
        "nextId": "D_C03_SCENE_PUBLIC_CORRECTION",
        "condition": {
          "all": [
            {
              "op": "hasInference",
              "id": "INF_C03_02"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_TAWARAKURO_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_TAWARAKURO_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_TAWARAKURO",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "俵九郎",
    "textJa": "不足分はすべてお返しした。保管の代金も、今度は逃げずに表の看板へ書き出しましたよ。「高い」と言われますがな……まずは正当な値の話として、真正面から聞いてもらっています。",
    "choices": [
      {
        "id": "D_NPC_TAWARAKURO_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_MASUME_INTRO",
    "caseId": null,
    "npcId": "NPC_MASUME",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "枡目",
    "textJa": "枡目だ。計り比べをするときは、同じ米を使うのが鉄則さ。器の違いを確かめたいのに、中身まで替えちゃったら米に申し訳が立たないだろう？",
    "choices": [
      {
        "id": "D_C03_SCENE_CALIBRATION_MENU",
        "labelJa": "出発前の重さを読み直す",
        "nextId": "D_C03_SCENE_CALIBRATION",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C03_03"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C03_04"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_MASUME_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_STANDARD",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_MASUME_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_MASUME",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "枡目",
    "textJa": "枡の大きさならいくらでも揃えられる。けれど、食べる量も働く日数も、みんな同じにはならないね。そこまで同じに量れと頼まれなくて、本当に助かったよ。",
    "choices": [
      {
        "id": "D_NPC_MASUME_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_TAKEJI_INTRO",
    "caseId": null,
    "npcId": "NPC_TAKEJI",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "竹次",
    "textJa": "竹次だ。注文は寸法から聞くが、本当は使い道も聞かせてほしいんだよ。言われた通りにぴったり仕上げて、かえって人を困らせることもあるからな。",
    "choices": [
      {
        "id": "D_C03_SCENE_PLANK_MENU",
        "labelJa": "板を作った責任について聞く",
        "nextId": "D_C03_SCENE_PLANK",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C03_05"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_TAKEJI_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SHRINE_WORKSHOP",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_TAKEJI_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_TAKEJI",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "竹次",
    "textJa": "次の修理からは、仕事の前に代金をきっちり決めたよ。埋もれていた古い約束の札も掛け直した。古いからといって、読まなくていいわけじゃないからな。",
    "choices": [
      {
        "id": "D_NPC_TAKEJI_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_YUKITSUZURI_INTRO",
    "caseId": null,
    "npcId": "NPC_YUKITSUZURI",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "雪綴",
    "textJa": "雪綴です。「急ぎではありません」と言って置いていかれた束に限って、夕方には「まだでしょうか」と顔を出します。紙の束は黙っていますが、使いの方の目がものを言いますね。",
    "choices": [
      {
        "id": "D_C06_SCENE_LESS_WORK_MENU",
        "labelJa": "今年も同じ仕事をする？",
        "nextId": "D_C06_SCENE_LESS_WORK",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C06"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_YUKITSUZURI_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SNOW_BINDER",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_YUKITSUZURI_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "雪綴",
    "textJa": "今年の注文は、最初に約束した分までです。残りは別の綴じ手へ、ご本人に引き受けられるか尋ねてから渡します。……空いた日は、静かに雪を眺めます。",
    "choices": [
      {
        "id": "D_NPC_YUKITSUZURI_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_KUZUHA_INTRO",
    "caseId": null,
    "npcId": "NPC_KUZUHA",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "葛葉",
    "textJa": "葛葉と申します。婚礼の場にお越しくださり、ありがとうございます。用件のお話でしたら、どうか私自身の返事も最後までお聞きいただけますかしら。",
    "choices": [
      {
        "id": "D_C04_SCENE_FIRST_SENTENCE_MENU",
        "labelJa": "欠席の返事について聞く",
        "nextId": "D_C04_SCENE_FIRST_SENTENCE",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C04"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C04_SCENE_KOSAME_SCOPE_MENU",
        "labelJa": "小雨に何を頼んだ？",
        "nextId": "D_C04_SCENE_KOSAME_SCOPE",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C04"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C04_SCENE_RESTORED_NO_MENU",
        "labelJa": "全文が読めたら京へ行ける？",
        "nextId": "D_C04_SCENE_RESTORED_NO",
        "condition": {
          "all": [
            {
              "op": "hasInference",
              "id": "INF_C04_02"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_KUZUHA_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_KUZUHA_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_KUZUHA",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "葛葉",
    "textJa": "京へは参りません。お祝いのあと、少し静かに過ごしますわ。私自身の返事のまま、支度を進めていただくことができました。",
    "choices": [
      {
        "id": "D_NPC_KUZUHA_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_KOSAME_INTRO",
    "caseId": null,
    "npcId": "NPC_KOSAME",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "小雨",
    "textJa": "小雨だよ。京への使いは、午前だけって約束で引き受けたんだ。午後のことまで、まだ誰にも頼まれてないよ。",
    "choices": [
      {
        "id": "D_C04_SCENE_SUNSHOWER_MENU",
        "labelJa": "雨に遭ったときの話を聞く",
        "nextId": "D_C04_SCENE_SUNSHOWER",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C04"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C04_SCENE_PROXY_PAY_MENU",
        "labelJa": "代理の仕事を引き受けた？",
        "nextId": "D_C04_SCENE_PROXY_PAY",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C04"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_KOSAME_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_LOWER",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_KOSAME_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_KOSAME",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "小雨",
    "textJa": "午前の使いはきっちり終わったよ。午後はね、お客として婚礼を楽しんでいくんだ。仕事の続きかって？　いいえ、これはぼく自身の予定さ。",
    "choices": [
      {
        "id": "D_NPC_KOSAME_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_AIZO_INTRO",
    "caseId": null,
    "npcId": "NPC_AIZO",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "藍蔵",
    "textJa": "藍蔵だ。こうやって干している間も、立派な仕事のうちだよ。ただ眺めているだけで済むなら、とっくに店を閉めて帰ってるさ。",
    "choices": [
      {
        "id": "D_C04_SCENE_PAPER_MENU",
        "labelJa": "糊と紙から何が分かる？",
        "nextId": "D_C04_SCENE_PAPER",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C04_03"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_AIZO_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_AUTUMN_DYER",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_AIZO_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_AIZO",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "藍蔵",
    "textJa": "急ぎの包みだけは納めてきた。残りは明日だ。日が照っているうちに全部仕上げるなんて、最初から約束していないからな。",
    "choices": [
      {
        "id": "D_NPC_AIZO_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_MOMONE_INTRO",
    "caseId": null,
    "npcId": "NPC_MOMONE",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "桃音",
    "textJa": "桃音です。お招きのお返事を預かっています。いらしてくださる方のお名前と同じくらい、来られない方の言葉も大切にしまっておくの。",
    "choices": [
      {
        "id": "D_C04_SCENE_BEFORE_RAIN_MENU",
        "labelJa": "控えを取ったときの返事を聞く",
        "nextId": "D_C04_SCENE_BEFORE_RAIN",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C04_05"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_MOMONE_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_PEACH_WEDDING",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_MOMONE_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_MOMONE",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "桃音",
    "textJa": "いらっしゃるお返事も、お休みになるお返事も、すべて届きました。お席はその数に合わせて並べます。「空いた席」を、「欠けた席」とは呼ばないことにしたの。",
    "choices": [
      {
        "id": "D_NPC_MOMONE_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_SHIOZO_INTRO",
    "caseId": null,
    "npcId": "NPC_SHIOZO",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "潮蔵",
    "textJa": "潮蔵じゃ。よう来たな、竜宮へ。わしの蔵に積んである荷は十二俵。人の手から手へと渡って、ここまで無事に届いた十二俵じゃよ。",
    "choices": [
      {
        "id": "D_C05_SCENE_JOINT_SHIP_MENU",
        "labelJa": "共同輸送には反対なの？",
        "nextId": "D_C05_SCENE_JOINT_SHIP",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C05"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_SHIOZO_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_REQUEST",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_SHIOZO_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_SHIOZO",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "潮蔵",
    "textJa": "共同の船便については、これから改めて話し合う。頼めるところは頼み、断るところは断る。そうやって筋を通して運べる荷なら、わしも喜んで預かろう。",
    "choices": [
      {
        "id": "D_NPC_SHIOZO_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_NAMISUKE_INTRO",
    "caseId": null,
    "npcId": "NPC_NAMISUKE",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "波助",
    "textJa": "波助だよ。渡し終えた荷の数なら、この札に全部書いてある。蔵が空になったら、今度は網と荷台を片付けるんだ。そこまで終えて、はじめて「受渡し」なのさ。",
    "choices": [
      {
        "id": "D_C05_SCENE_EMPTY_STORE_MENU",
        "labelJa": "中継の蔵が空なのはなぜ？",
        "nextId": "D_C05_SCENE_EMPTY_STORE",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C05"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_NAMISUKE_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_COAST_TRANSFER",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_NAMISUKE_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_NAMISUKE",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "波助",
    "textJa": "今度の便からは、荷継ぎの代金もはっきり決まったよ。帰ったら網を繕って、きょうの仕事はおしまい。次の便が来るまで、ちゃんと足を伸ばして休めるんだ。",
    "choices": [
      {
        "id": "D_NPC_NAMISUKE_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_TOAN_INTRO",
    "caseId": null,
    "npcId": "NPC_TOAN",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "灯庵",
    "textJa": "灯庵と申します。お祈りでしたら、どうぞお入りください。ただ、何かの役目を引き受けるかどうかのお返事は、お祈りとは別に伺っておりますので。",
    "choices": [
      {
        "id": "D_C06_SCENE_PRAYER_DIFFERENCE_MENU",
        "labelJa": "同じ祈りなら同じ希望では？",
        "nextId": "D_C06_SCENE_PRAYER_DIFFERENCE",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C06"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_TOAN_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_REQUEST",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_TOAN_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_TOAN",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "灯庵",
    "textJa": "同じ願いの紙を持って、それぞれ違うお返事が届きました。その違いごと、大切にお預かりいたします。祈りの場所は、明日も変わらず開けておきますよ。",
    "choices": [
      {
        "id": "D_NPC_TOAN_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_SUZUNA_INTRO",
    "caseId": null,
    "npcId": "NPC_SUZUNA",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "鈴菜",
    "textJa": "鈴菜です。手返しを習いに来たのなら、今日はどこまでやるか先に決めましょう。上手になる話は、そのあとで十分だわ。",
    "choices": [
      {
        "id": "D_C02_SCENE_LESSON_MENU",
        "labelJa": "芦ノ山の稽古を聞く",
        "nextId": "D_C02_SCENE_LESSON",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C02"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C06_SCENE_CONTINUE_MENU",
        "labelJa": "今年の祭をどうしたい？",
        "nextId": "D_C06_SCENE_CONTINUE",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C06"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_SUZUNA_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MOON_TEMPLE",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_SUZUNA_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_SUZUNA",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "鈴菜",
    "textJa": "私はこの薄野で餅つきを続けるつもり。足を運んでくれる方の分だけ、心を込めて餅を用意するわ。芦ノ山さんの稽古は、またご本人が習いたいと頼みに来たときにね。",
    "choices": [
      {
        "id": "D_NPC_SUZUNA_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_YUKEMARU_INTRO",
    "caseId": null,
    "npcId": "NPC_YUKEMARU",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "湯気丸",
    "textJa": "湯気丸だよ。いま熱いお茶をいれるね。急いでいないなら、その「急がない」っていう話もゆっくり聞かせてもらえると嬉しいな。",
    "choices": [
      {
        "id": "D_C03_SCENE_CONTROL_GRAIN_MENU",
        "labelJa": "見本の米を残した理由を聞く",
        "nextId": "D_C03_SCENE_CONTROL_GRAIN",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C03_07"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_C06_SCENE_SHARED_KITCHEN_MENU",
        "labelJa": "共同の運営を望んでいる？",
        "nextId": "D_C06_SCENE_SHARED_KITCHEN",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C06"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_YUKEMARU_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SPRING_INN",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_YUKEMARU_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_YUKEMARU",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "湯気丸",
    "textJa": "共同の台所を使わせてもらいたいって、自分の言葉で返事を出したよ。もちろん、引き受けてくれる方の手間賃もきちんと見込んでね。これで宿のお茶も、少しゆっくりいれられそうだ。",
    "choices": [
      {
        "id": "D_NPC_YUKEMARU_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_HABUMI_INTRO",
    "caseId": null,
    "npcId": "NPC_HABUMI",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "羽文",
    "textJa": "配達役の羽文です。向こうの返事は確かに届けましたよ。今度は、それを受け取った側の返事も持ち帰るところなんです。",
    "choices": [
      {
        "id": "D_C07_SCENE_CARRIER_MENU",
        "labelJa": "自分の記録も使われている？",
        "nextId": "D_C07_SCENE_CARRIER",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C07"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_HABUMI_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_HABUMI_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "羽文",
    "textJa": "訂正を届けた先々から、それぞれ別々の返事が返ってきたよ。「続ける」「休む」「手を借りたい」。今度こそひとつに丸め込まず、このままの姿で運びます。",
    "choices": [
      {
        "id": "D_NPC_HABUMI_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_SHIRAE_INTRO",
    "caseId": null,
    "npcId": "NPC_SHIRAE",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "白枝",
    "textJa": "評定役の白枝です。結論を急ぐご事情があるなら、まずはその事情から伺いましょう。ただし、それを理由に資料の確認を省くわけにはまいりませんよ。",
    "choices": [
      {
        "id": "D_C07_SCENE_READ_BOTH_MENU",
        "labelJa": "申立てを全部取り消せば済む？",
        "nextId": "D_C07_SCENE_READ_BOTH",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C01_07"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_SHIRAE_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_JUDGE",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_SHIRAE_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_SHIRAE",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "白枝",
    "textJa": "本日の審理はこれで閉廷します。次の相談は、各人のお返事が届いてからにいたしましょう。実は私にも、休みの届けが一通出ておりますので。",
    "choices": [
      {
        "id": "D_NPC_SHIRAE_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_NAOKI_INTRO",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "直記",
    "textJa": "直記です。控えを減らすための申請書なら、すでに三通ほど……。ええ、その煩わしい手続きは私自身も変えたいのです。審理の続きでしたら、こちらへどうぞ。",
    "choices": [
      {
        "id": "D_C07_SCENE_WHAT_WAS_READ_MENU",
        "labelJa": "受け取っただけでは足りない？",
        "nextId": "D_C07_SCENE_WHAT_WAS_READ",
        "condition": {
          "all": [
            {
              "op": "hasEvidence",
              "id": "EV_C07_11"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_NAOKI_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_INTAKE",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_NAOKI_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "直記",
    "textJa": "元の相談と、その後の結果を、同じ見開きに書き戻しました。もしまた別の返事が届けば、別の日付で書き足します。見開きの余白は、そのために残しておくのです。",
    "choices": [
      {
        "id": "D_NPC_NAOKI_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_TOKA_INTRO",
    "caseId": null,
    "npcId": "NPC_TOKA",
    "situation": "ambient",
    "condition": {
      "all": []
    },
    "speakerJa": "灯火",
    "textJa": "灯火だよ。大文字の送り火なら、東の塔からも見える。上まで登る階段もちゃんとあるよ。景色の話になると、みんな足元の確認を忘れがちなんだよね。",
    "choices": [
      {
        "id": "D_C07_SCENE_DIRECTIONS_MENU",
        "labelJa": "眺めの違いだけで決められる？",
        "nextId": "D_C07_SCENE_DIRECTIONS",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C07"
            }
          ]
        },
        "effects": []
      },
      {
        "id": "D_NPC_TOKA_INTRO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_EAST_VIEW",
    "entryPolicy": "ambient_topic_always_available",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_NPC_TOKA_EPILOGUE",
    "caseId": "C07",
    "npcId": "NPC_TOKA",
    "situation": "epilogue",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "灯火",
    "textJa": "今日は塔を閉めたら、私も町の見物に回るよ。どこから送り火を眺めるかは、まだ決めていない。誰の案内もない夜というのも、たまには悪くないだろう。",
    "choices": [
      {
        "id": "D_NPC_TOKA_END_CLOSE",
        "labelJa": "また会いに来る",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "entryPolicy": "npc_menu_after_campaign_resolution",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C01_E01",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "祝い杵を寝かせていた棚板だ。うっすら積もった米粉の上に、二本の平行な引き跡が戸口へと伸びている。毎日使っている普段の杵とは、置き場所からして別物だ。",
    "choices": [
      {
        "id": "D_C01_E01_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C01_E01_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C01_01"
          }
        ]
      },
      {
        "id": "D_C01_E01_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C01_E01_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E01_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C01_E01_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E01_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RACK",
    "evidenceId": "EV_C01_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E01_QUOTE",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "杵吉の添え書きがある。「臼の前で動いてるのは、いつもの杵さ。消えたのは、棚に寝かせてあったお祝い用の一本なんだよ。」",
    "choices": [
      {
        "id": "D_C01_E01_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C01_E01",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_KINEKICHI",
    "locationId": "LOC_DAWN_RACK",
    "evidenceId": "EV_C01_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E01_LIMIT",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "棚に寝かせてあった予備の祝い杵が運び出されたのは確かだ。いま餅をついている普段の杵とは別物だね。",
    "choices": [
      {
        "id": "D_C01_E01_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_E01_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RACK",
    "evidenceId": "EV_C01_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E01_LIMIT_L2",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただ、誰が持ち出したのか、盗むつもりだったのかまでは、この跡だけではまだ分からない。",
    "choices": [
      {
        "id": "D_C01_E01_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C01_E01",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RACK",
    "evidenceId": "EV_C01_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E01_RECORDED",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C01_01"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「予備棚の二本の筋」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C01_E01_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C01_E01",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E01_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C01_01",
    "locationId": "LOC_DAWN_RACK",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C01_E02",
    "caseId": "C01",
    "npcId": "NPC_KAEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "昨夜の片付けで拾われた柄の木片だ。三つ又に割れた断面があり、年輪の模様がくっきり出ている。拾われたのは、まだ祝い杵が棚にあった時間より前のことだ。",
    "choices": [
      {
        "id": "D_C01_E02_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C01_E02_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C01_02"
          }
        ]
      },
      {
        "id": "D_C01_E02_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C01_E02_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E02_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C01_E02_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E02_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RACK",
    "evidenceId": "EV_C01_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E02_QUOTE",
    "caseId": "C01",
    "npcId": "NPC_KAEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "返吉の添え書きがある。「片付けのとき、足元に落ちてたんだ。そのときはまだ杵も棚にあったよ。捨てずに取っておいてよかった。」",
    "choices": [
      {
        "id": "D_C01_E02_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C01_E02",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_KAEKICHI",
    "locationId": "LOC_DAWN_RACK",
    "evidenceId": "EV_C01_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E02_LIMIT",
    "caseId": "C01",
    "npcId": "NPC_KAEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "柄の割れは、誰かが持ち出す前からすでにあったってことだ。あとで見つかる杵の欠けた部分と照らし合わせられるぞ。",
    "choices": [
      {
        "id": "D_C01_E02_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_E02_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RACK",
    "evidenceId": "EV_C01_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E02_LIMIT_L2",
    "caseId": "C01",
    "npcId": "NPC_KAEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "もっとも、返吉が木片を拾ったからといって、返吉が折った犯人だとは言い切れないな。",
    "choices": [
      {
        "id": "D_C01_E02_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C01_E02",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RACK",
    "evidenceId": "EV_C01_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E02_RECORDED",
    "caseId": "C01",
    "npcId": "NPC_KAEKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C01_02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「三つ又に割れた木片」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C01_E02_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C01_E02",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E02_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C01_02",
    "locationId": "LOC_DAWN_RACK",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C01_E03",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "乾燥棚の添え木に、大きさの違う二つの丸い圧痕がついている。修理に使う二股締め具の、欠けた先端の形とぴたりと一致する跡だ。",
    "choices": [
      {
        "id": "D_C01_E03_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C01_E03_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C01_03"
          }
        ]
      },
      {
        "id": "D_C01_E03_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C01_E03_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E03_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C01_E03_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E03_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_BENCH",
    "evidenceId": "EV_C01_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E03_QUOTE",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "継丸の添え書きがある。「この小さい丸と大きい丸は、うちの締め具の跡です。木を締めすぎないよう、片方の先を少し削ってあるんです。」",
    "choices": [
      {
        "id": "D_C01_E03_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C01_E03",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TSUGUMARU",
    "locationId": "LOC_DAWN_BENCH",
    "evidenceId": "EV_C01_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E03_LIMIT",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "この乾燥棚で、継丸の締め具を使った修理が行われたのは間違いない。",
    "choices": [
      {
        "id": "D_C01_E03_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_E03_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_BENCH",
    "evidenceId": "EV_C01_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E03_LIMIT_L2",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただ、締め具を持っていたというだけでは、棚から杵を運び出したのが誰かまでは決まらないぞ。",
    "choices": [
      {
        "id": "D_C01_E03_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C01_E03",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_BENCH",
    "evidenceId": "EV_C01_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E03_RECORDED",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C01_03"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「二つの丸跡がある添え木」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C01_E03_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C01_E03",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E03_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C01_03",
    "locationId": "LOC_DAWN_BENCH",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C01_E04",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "宿の作業受付が残した半券だ。「祝い杵、柄の継ぎ、持込・継丸」と書いてある。昨夜、宿の茶係が対面で受け付けた確かな記録だ。",
    "choices": [
      {
        "id": "D_C01_E04_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C01_E04_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C01_04"
          }
        ]
      },
      {
        "id": "D_C01_E04_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C01_E04_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E04_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C01_E04_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E04_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_BENCH",
    "evidenceId": "EV_C01_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E04_QUOTE",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "継丸の添え書きがある。「宿の方に、預かり札を一枚書いてもらいました。持ち込んだのは、確かにわたしです。……でも、なぜそうしたのかも見てほしいんです。」",
    "choices": [
      {
        "id": "D_C01_E04_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C01_E04",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TSUGUMARU",
    "locationId": "LOC_DAWN_BENCH",
    "evidenceId": "EV_C01_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E04_LIMIT",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "継丸がこの祝い杵を修理のために持ち込んだことは、宿の受付記録で裏付けられた。",
    "choices": [
      {
        "id": "D_C01_E04_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_E04_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_BENCH",
    "evidenceId": "EV_C01_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E04_LIMIT_L2",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "でも、持ち主である杵吉の許可をもらっていたかどうかまでは、この半券じゃ分からないな。",
    "choices": [
      {
        "id": "D_C01_E04_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C01_E04",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_BENCH",
    "evidenceId": "EV_C01_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E04_RECORDED",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C01_04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「修理預かりの半券」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C01_E04_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C01_E04",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E04_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C01_04",
    "locationId": "LOC_DAWN_BENCH",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C01_E05",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "札には杵吉の屋号が入っている。柄の継ぎ目にあの木片を当ててみると隙間なくはまり、年輪まで一本の線につながった。添え木と締め具で仮止めされている。",
    "choices": [
      {
        "id": "D_C01_E05_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C01_E05_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C01_05"
          }
        ]
      },
      {
        "id": "D_C01_E05_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C01_E05_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E05_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C01_E05_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E05_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_BENCH",
    "evidenceId": "EV_C01_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E05_QUOTE",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "継丸の添え書きがある。「お祭りの朝にポキリと折れたら大変だと思って……。でも、正直に言えば、わたしが折ったと思われるのが怖かったんです。」",
    "choices": [
      {
        "id": "D_C01_E05_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C01_E05",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TSUGUMARU",
    "locationId": "LOC_DAWN_BENCH",
    "evidenceId": "EV_C01_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E05_LIMIT",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "なくなった祝い杵と同一の品であること、持ち出される前からの破損だったこと、修理が目的だったこと――この三つがはっきりした。",
    "choices": [
      {
        "id": "D_C01_E05_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_E05_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_BENCH",
    "evidenceId": "EV_C01_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E05_LIMIT_L2",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "とはいえ、善意の修理だったとしても、持ち主に黙って持ち出してよかったことにはならないよな。",
    "choices": [
      {
        "id": "D_C01_E05_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C01_E05",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_BENCH",
    "evidenceId": "EV_C01_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E05_RECORDED",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C01_05"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「修理中の祝い杵」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C01_E05_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C01_E05",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E05_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C01_05",
    "locationId": "LOC_DAWN_BENCH",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C01_E06",
    "caseId": "C01",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        },
        {
          "op": "hasInference",
          "id": "INF_C01_01"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "一枚の二つ折り札だ。左の欄には最初の「祝い杵が見当たらない」、右の欄には「修理・無断持出し・返却」という結果が書かれている。筆丸が結果を読み返し、杵吉と宿の茶係が立ち会って確認した札だ。",
    "choices": [
      {
        "id": "D_C01_E06_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_E06_L2",
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "playEvidenceReconstruction",
          "evidenceId": "EV_C01_06",
          "sourceEvent": "EVT_C01"
        }
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "evidenceId": "EV_C01_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E06_L2",
    "caseId": "C01",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        },
        {
          "op": "hasInference",
          "id": "INF_C01_01"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "終わりの「祝い杵は戻った」の墨が乾く前に折り畳まれたせいで、向かい合う左欄の余白に、左右反転した薄い写りが残っている。お餅の手帖には両欄を開いたままの控えがある。",
    "choices": [
      {
        "id": "D_C01_E06_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C01_E06_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C01"
            },
            {
              "op": "hasInference",
              "id": "INF_C01_01"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C01_06"
          }
        ]
      },
      {
        "id": "D_C01_E06_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C01_E06_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E06_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C01_E06_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E06_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "evidenceId": "EV_C01_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E06_QUOTE",
    "caseId": "C01",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        },
        {
          "op": "hasInference",
          "id": "INF_C01_01"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "筆丸の添え書きがある。「杵が戻ったことも、無断だったことも。ええ、両方とも受け取りましたよ。……おや、畳むのが早すぎましたね。墨が向かいへ写ってしまいました。」",
    "choices": [
      {
        "id": "D_C01_E06_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C01_E06",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_FUDEM",
    "locationId": "LOC_DAWN_RECORDER",
    "evidenceId": "EV_C01_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E06_LIMIT",
    "caseId": "C01",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        },
        {
          "op": "hasInference",
          "id": "INF_C01_01"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "最初の相談も解決後の返事もどちらも本物で、筆丸は両方を受け取り、結果を読み返している。解決後に向かいへ写った墨の位置も確認できるぞ。",
    "choices": [
      {
        "id": "D_C01_E06_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_E06_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "evidenceId": "EV_C01_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E06_LIMIT_L2",
    "caseId": "C01",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        },
        {
          "op": "hasInference",
          "id": "INF_C01_01"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "ただ、この時点では後の不正や悪意までは分からない。それに、杵が戻ったからといって、杵吉が祝い役に戻る約束をしたわけでもない。",
    "choices": [
      {
        "id": "D_C01_E06_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C01_E06",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "evidenceId": "EV_C01_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C01_E06_RECORDED",
    "caseId": "C01",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C01_06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「相談と返事がそろった祝い杵の見開き」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C01_E06_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C01_E06",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E06_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C01_06",
    "locationId": "LOC_DAWN_RECORDER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C02_E01",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "鳴吉",
    "textJa": "白い綱が目に飛び込んできたから、てっきり横綱だと思ったんだ。顔か？　そこまでは……。確か、鹿の背に揺られてたような気がするんだが。",
    "choices": [
      {
        "id": "D_C02_E01_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C02_E01_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C02_01"
          }
        ]
      },
      {
        "id": "D_C02_E01_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C02_E01_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E01_QUOTE",
        "labelJa": "もう少し聞く",
        "nextId": "D_C02_E01_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E01_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "evidenceId": "EV_C02_01",
    "triggerKind": "npc_topic",
    "manualEvidenceGrant": true,
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C02_E01_QUOTE",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "鳴吉",
    "textJa": "白い綱が目に飛び込んできたから、てっきり横綱だと思ったんだ。顔か？　そこまでは……。確か、鹿の背に揺られてたような気がするんだが。",
    "choices": [
      {
        "id": "D_C02_E01_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C02_E01",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_NAKIKICHI",
    "locationId": "LOC_RIVER_REQUEST",
    "evidenceId": "EV_C02_01",
    "triggerKind": "npc_topic",
    "manualEvidenceGrant": true,
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C02_E01_LIMIT",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "目撃の根拠はあくまで「白い綱」だけで、本人を直接見たわけじゃないんだな。",
    "choices": [
      {
        "id": "D_C02_E01_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_E01_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "evidenceId": "EV_C02_01",
    "triggerKind": "npc_topic",
    "manualEvidenceGrant": true,
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C02_E01_LIMIT_L2",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "これだけじゃ、横綱が連れ去られたとも、橋を渡ったとも言い切れないぞ。",
    "choices": [
      {
        "id": "D_C02_E01_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C02_E01",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "evidenceId": "EV_C02_01",
    "triggerKind": "npc_topic",
    "manualEvidenceGrant": true,
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C02_E01_RECORDED",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C02_01"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「橋の上の白い綱の目撃」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C02_E01_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C02_E01",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E01_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C02_01",
    "locationId": "LOC_RIVER_REQUEST",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "resolved_single_npc",
    "triggerKind": "npc_topic",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C02_E02",
    "caseId": "C02",
    "npcId": "NPC_SHIROASHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "白足の荷物にぐるりと巻かれた白い綱だ。芦ノ山の名の刺繍と、白足が使っている袋紐の結び目が同じ場所に並んでいる。",
    "choices": [
      {
        "id": "D_C02_E02_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C02_E02_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C02_02"
          }
        ]
      },
      {
        "id": "D_C02_E02_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C02_E02_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E02_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C02_E02_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E02_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_TEABENCH",
    "evidenceId": "EV_C02_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E02_QUOTE",
    "caseId": "C02",
    "npcId": "NPC_SHIROASHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "白足の添え書きがある。「硬い荷の角が鹿さんに当たって痛そうだったから、横綱が貸してくれたんだ。名札がついたまま、お借りしたんだよ。」",
    "choices": [
      {
        "id": "D_C02_E02_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C02_E02",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_SHIROASHI",
    "locationId": "LOC_RIVER_TEABENCH",
    "evidenceId": "EV_C02_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E02_LIMIT",
    "caseId": "C02",
    "npcId": "NPC_SHIROASHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "綱の持ち主は芦ノ山だけど、橋の上で目撃されたときに運ばれていたのは白足の荷物だ。",
    "choices": [
      {
        "id": "D_C02_E02_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_E02_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_TEABENCH",
    "evidenceId": "EV_C02_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E02_LIMIT_L2",
    "caseId": "C02",
    "npcId": "NPC_SHIROASHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "名入りの持ち物があったからって、持ち主本人がその場にいたとは決められないな。",
    "choices": [
      {
        "id": "D_C02_E02_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C02_E02",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_TEABENCH",
    "evidenceId": "EV_C02_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E02_RECORDED",
    "caseId": "C02",
    "npcId": "NPC_SHIROASHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C02_02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「芦ノ山の名入り綱」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C02_E02_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C02_E02",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E02_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C02_02",
    "locationId": "LOC_RIVER_TEABENCH",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C02_E03",
    "caseId": "C02",
    "npcId": "NPC_SHIROASHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "茶屋の控え帳だ。「芦ノ山より白足へ綱貸し、鹿荷の当て布」と書いてあり、茶係の立会いのもと、本人二名の印が押されている。",
    "choices": [
      {
        "id": "D_C02_E03_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C02_E03_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C02_03"
          }
        ]
      },
      {
        "id": "D_C02_E03_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C02_E03_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E03_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C02_E03_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E03_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_TEABENCH",
    "evidenceId": "EV_C02_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E03_QUOTE",
    "caseId": "C02",
    "npcId": "NPC_SHIROASHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "白足の添え書きがある。「返す日を忘れないように、茶屋で書き留めてもらったんだ。ほら、ここが横綱の印で、こっちがぼくの印。」",
    "choices": [
      {
        "id": "D_C02_E03_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C02_E03",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_SHIROASHI",
    "locationId": "LOC_RIVER_TEABENCH",
    "evidenceId": "EV_C02_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E03_LIMIT",
    "caseId": "C02",
    "npcId": "NPC_SHIROASHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "橋の目撃より前に、芦ノ山が自分の意思で白足に綱を貸したことがはっきり分かる。",
    "choices": [
      {
        "id": "D_C02_E03_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_E03_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_TEABENCH",
    "evidenceId": "EV_C02_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E03_LIMIT_L2",
    "caseId": "C02",
    "npcId": "NPC_SHIROASHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "もっとも、そのあとの横綱がどこへ行ったかまでは、この貸し出し控えだけじゃ分からないな。",
    "choices": [
      {
        "id": "D_C02_E03_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C02_E03",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_TEABENCH",
    "evidenceId": "EV_C02_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E03_RECORDED",
    "caseId": "C02",
    "npcId": "NPC_SHIROASHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C02_03"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「綱を貸した茶屋の記録」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C02_E03_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C02_E03",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E03_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C02_03",
    "locationId": "LOC_RIVER_TEABENCH",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C02_E04",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "休み台に置かれた書置きだ。表には「しばらく稽古へ」。でも裏の折返しをめくると、「強く押さず、白玉をつぶさず返す。棚田、鈴菜先生」と書き添えてある。",
    "choices": [
      {
        "id": "D_C02_E04_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C02_E04_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C02_04"
          }
        ]
      },
      {
        "id": "D_C02_E04_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C02_E04_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E04_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C02_E04_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E04_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_BRIDGE",
    "evidenceId": "EV_C02_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E04_QUOTE",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "鳴吉の添え書きがある。「表だけ読んで、てっきり相撲の稽古だと決めつけてた。裏にまで字が書いてあるなんてな……。」",
    "choices": [
      {
        "id": "D_C02_E04_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C02_E04",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_NAKIKICHI",
    "locationId": "LOC_RIVER_BRIDGE",
    "evidenceId": "EV_C02_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E04_LIMIT",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "芦ノ山は餅返しの稽古に行くつもりだったんだな。行き先と相談先もこれではっきりした。",
    "choices": [
      {
        "id": "D_C02_E04_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_E04_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_BRIDGE",
    "evidenceId": "EV_C02_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E04_LIMIT_L2",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただ、書置きがあるというだけでは、今現在も無事でいるかどうかまではまだ分からない。",
    "choices": [
      {
        "id": "D_C02_E04_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C02_E04",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_BRIDGE",
    "evidenceId": "EV_C02_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E04_RECORDED",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C02_04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「裏へ折られた稽古の覚書」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C02_E04_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C02_E04",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E04_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C02_04",
    "locationId": "LOC_RIVER_BRIDGE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C02_E05",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "稽古盆の上に、無残に押しつぶされた白玉から、きれいな丸のまま返せた白玉へと順に並ぶ練習の跡がある。稽古札に書かれた名は芦ノ山だ。",
    "choices": [
      {
        "id": "D_C02_E05_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C02_E05_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C02_05"
          }
        ]
      },
      {
        "id": "D_C02_E05_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C02_E05_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E05_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C02_E05_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E05_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "evidenceId": "EV_C02_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E05_QUOTE",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "芦ノ山の添え書きがある。「相手を土俵へ叩きつける手と、餅を返す手は、まるで別物だった。ようやく、ひとつ丸いまま返せたところだよ。」",
    "choices": [
      {
        "id": "D_C02_E05_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C02_E05",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_ASHINOYAMA",
    "locationId": "LOC_TERRACES_PRACTICE",
    "evidenceId": "EV_C02_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E05_LIMIT",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "この場所で、力任せではない柔らかな手つきを練習している様子がうかがえるな。",
    "choices": [
      {
        "id": "D_C02_E05_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_E05_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "evidenceId": "EV_C02_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E05_LIMIT_L2",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "とはいえ、並んだ白玉の形だけで、本人が今ここにいるとまでは確認できないぞ。",
    "choices": [
      {
        "id": "D_C02_E05_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C02_E05",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "evidenceId": "EV_C02_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E05_RECORDED",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C02_05"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「つぶれていない練習の白玉」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C02_E05_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C02_E05",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E05_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C02_05",
    "locationId": "LOC_TERRACES_PRACTICE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C02_E06",
    "caseId": "C02",
    "npcId": "NPC_SUZUNA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "祭の餅返しを頼まれた芦ノ山が、自分で棚田の稽古を申し込んだ予約控えだ。日付は、白足へ綱を貸した日よりも前になっている。",
    "choices": [
      {
        "id": "D_C02_E06_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C02_E06_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C02_06"
          }
        ]
      },
      {
        "id": "D_C02_E06_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C02_E06_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E06_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C02_E06_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E06_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MOON_PRACTICE",
    "evidenceId": "EV_C02_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E06_QUOTE",
    "caseId": "C02",
    "npcId": "NPC_SUZUNA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "鈴菜の添え書きがある。「普段から力の強い方ほど、力を抜く稽古は難しいものなの。習いに来たいと言い出したのは、あの方ご自身よ。」",
    "choices": [
      {
        "id": "D_C02_E06_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C02_E06",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_SUZUNA",
    "locationId": "LOC_MOON_PRACTICE",
    "evidenceId": "EV_C02_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E06_LIMIT",
    "caseId": "C02",
    "npcId": "NPC_SUZUNA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "稽古行きは騒ぎのあとの言い訳なんかじゃなく、前から自分で立てていた予定だったんだ。",
    "choices": [
      {
        "id": "D_C02_E06_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_E06_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MOON_PRACTICE",
    "evidenceId": "EV_C02_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E06_LIMIT_L2",
    "caseId": "C02",
    "npcId": "NPC_SUZUNA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "あとは横綱本人に直接会って、今の無事を確かめるだけだ。",
    "choices": [
      {
        "id": "D_C02_E06_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C02_E06",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MOON_PRACTICE",
    "evidenceId": "EV_C02_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C02_E06_RECORDED",
    "caseId": "C02",
    "npcId": "NPC_SUZUNA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C02_06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「鈴菜の稽古帳」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C02_E06_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C02_E06",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E06_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C02_06",
    "locationId": "LOC_MOON_PRACTICE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C02_E07",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "芦ノ山",
    "textJa": "おお、わしを探していたのか。ここではまだほんの見習いだよ。聞きたいことがあるなら、稽古の区切りがいいところで話そうか。",
    "choices": [
      {
        "id": "D_C02_E07_ASK_SAFE",
        "labelJa": "無事か確かめたい",
        "nextId": "D_C02_E07_CONFIRM",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E07_ASK_APPEAR",
        "labelJa": "出番へ戻れる？",
        "nextId": "D_C02_E07_BOUNDARY",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E07_GIVE_SPACE",
        "labelJa": "今は話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "evidenceId": "EV_C02_07",
    "triggerKind": "npc_topic",
    "manualEvidenceGrant": true,
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C02_E07_QUOTE",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "芦ノ山",
    "textJa": "わしはここにいる。自分の足で来たし、帰ろうと思えばいつでも帰れる。けれど今日、出番へは戻らない。相手を押すのではなく、受け止める手を習いたいんだ。",
    "choices": [
      {
        "id": "D_C02_E07_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C02_E07",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_ASHINOYAMA",
    "locationId": "LOC_TERRACES_PRACTICE",
    "evidenceId": "EV_C02_07",
    "triggerKind": "npc_topic",
    "manualEvidenceGrant": true,
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C02_E07_LIMIT",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "行方不明や連れ去りなんかじゃなく、自分の意思で稽古に来ていた。橋の上で見られた綱は、別の人が運んでいたものだ。",
    "choices": [
      {
        "id": "D_C02_E07_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_E07_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "evidenceId": "EV_C02_07",
    "triggerKind": "npc_topic",
    "manualEvidenceGrant": true,
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C02_E07_LIMIT_L2",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただ、無事でいつでも帰れるからといって、今すぐ出番に戻る約束をしたわけじゃない。連絡の行き違いは直しても、稽古を続ける本人の返事までひっくり返すわけにはいかないな。",
    "choices": [
      {
        "id": "D_C02_E07_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C02_E07",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "evidenceId": "EV_C02_07",
    "triggerKind": "npc_topic",
    "manualEvidenceGrant": true,
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C02_E07_RECORDED",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C02_07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「芦ノ山の無事と本人の確認」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C02_E07_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C02_E07",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E07_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C02_07",
    "locationId": "LOC_TERRACES_PRACTICE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "resolved_single_npc",
    "triggerKind": "npc_topic",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C03_E01",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "俵九郎が量り売りした小口の米、十杯の注文札だ。のちの三便三十俵とはまったく別の取引で、受取先で計り直したところ、二杯相当が足りなかったと記されている。",
    "choices": [
      {
        "id": "D_C03_E01_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C03_E01_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C03_01"
          }
        ]
      },
      {
        "id": "D_C03_E01_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C03_E01_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E01_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C03_E01_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E01_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "evidenceId": "EV_C03_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E01_QUOTE",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "俵太の添え書きがある。「十杯分を運んだはずなのに、着いてみたら八杯ぶんしかなかったんです。途中で抜いたと疑われて、本当に困っています。」",
    "choices": [
      {
        "id": "D_C03_E01_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E01",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TAWARATA",
    "locationId": "LOC_MARKET_REQUEST",
    "evidenceId": "EV_C03_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E01_LIMIT",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "約束の量は標準の十杯。この小口取引で、確かに不足が起きていることが分かる。",
    "choices": [
      {
        "id": "D_C03_E01_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_E01_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "evidenceId": "EV_C03_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E01_LIMIT_L2",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただし、これは小口の取引だ。この荷が足りなかったからって、別の便の米まで不足している証拠にはならないぞ。",
    "choices": [
      {
        "id": "D_C03_E01_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E01",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "evidenceId": "EV_C03_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E01_RECORDED",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_01"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「十杯売りの注文札」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C03_E01_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C03_E01",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E01_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C03_01",
    "locationId": "LOC_MARKET_REQUEST",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C03_E02",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "側面に五段の標準目盛りが刻まれた店の枡だ。だが内側を覗き込むと、底板が一段高い位置に打ち付けられていて、実際には四段分しか入らない。側面には店の焼印が押されている。",
    "choices": [
      {
        "id": "D_C03_E02_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C03_E02_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C03_02"
          }
        ]
      },
      {
        "id": "D_C03_E02_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C03_E02_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E02_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C03_E02_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E02_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "evidenceId": "EV_C03_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E02_QUOTE",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "俵九郎の添え書きがある。「外の目盛りは、ほら、ちゃんと五段あるだろう。……わざわざ中の底まで覗き込むのかい？」",
    "choices": [
      {
        "id": "D_C03_E02_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E02",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TAWARAKURO",
    "locationId": "LOC_MARKET_DEALER",
    "evidenceId": "EV_C03_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E02_LIMIT",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "見た目の十杯でも、同じ米粒で比べれば標準の八杯分にしか満たない計算になる。",
    "choices": [
      {
        "id": "D_C03_E02_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_E02_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "evidenceId": "EV_C03_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E02_LIMIT_L2",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "もっとも、今この枡が上げ底だからといって、取引の当日もこの状態だったとまではまだ言い切れないな。",
    "choices": [
      {
        "id": "D_C03_E02_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E02",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "evidenceId": "EV_C03_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E02_RECORDED",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「底の高い名入り桝」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C03_E02_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C03_E02",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E02_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C03_02",
    "locationId": "LOC_MARKET_DEALER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C03_E03",
    "caseId": "C03",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "同じ取引の米が、二つの枡の横に置かれている。まず標準の一杯を秤に載せ、次に店の枡から移し替えて比べることができそうだ。",
    "choices": [
      {
        "id": "D_C03_E03_START",
        "labelJa": "検分を始める",
        "nextId": "D_C03_E03_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "playEvidenceReconstruction",
          "evidenceId": "EV_C03_03",
          "sourceEvent": "EVT_C03"
        }
      },
      {
        "id": "D_C03_E03_RECON_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_STANDARD",
    "evidenceId": "EV_C03_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E03_OBSERVE",
    "caseId": "C03",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "同じ乾いた米、同じすり切り、同じ秤で比べる。標準桝一杯の正味は「秤目10」。店の枡五杯を標準へ移すと四杯にしかならず、十杯なら八杯――つまり「秤目80」になる。袋の重さはどちらも差し引いてある。",
    "choices": [
      {
        "id": "D_C03_E03_OBSERVE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_E03_OBSERVE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_STANDARD",
    "evidenceId": "EV_C03_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E03_OBSERVE_L2",
    "caseId": "C03",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "※「秤目（はかりめ）」は、この世界の秤に刻まれた独自の目盛りだ。",
    "choices": [
      {
        "id": "D_C03_E03_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C03_E03_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C03_03"
          }
        ]
      },
      {
        "id": "D_C03_E03_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C03_E03_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E03_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C03_E03_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E03_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_STANDARD",
    "evidenceId": "EV_C03_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E03_QUOTE",
    "caseId": "C03",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "枡目の添え書きがある。「同じ米なら、標準の一杯で十目。店の枡の五杯を移すと、ちょうど四杯になるね。もちろん、袋の重さはどちらも引いてあるよ。」",
    "choices": [
      {
        "id": "D_C03_E03_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E03_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_MASUME",
    "locationId": "LOC_TERRACES_STANDARD",
    "evidenceId": "EV_C03_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E03_LIMIT",
    "caseId": "C03",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "店の枡に入る量は標準の五分の四。同じ米なら「標準一杯＝秤目10」という換算が実演で分かった。出発前の秤札と組み合わせれば、荷を渡したときの標準杯数がはっきりするぞ。",
    "choices": [
      {
        "id": "D_C03_E03_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_E03_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_STANDARD",
    "evidenceId": "EV_C03_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E03_LIMIT_L2",
    "caseId": "C03",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただ、この比較実演だけじゃ、取引当日にこの枡を使ったことや、実際に渡された瞬間の量までは分からない。",
    "choices": [
      {
        "id": "D_C03_E03_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E03_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_STANDARD",
    "evidenceId": "EV_C03_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E03_RECORDED",
    "caseId": "C03",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_03"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「標準桝との比較実演」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C03_E03_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C03_E03",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E03_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C03_03",
    "locationId": "LOC_TERRACES_STANDARD",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C03_E04",
    "caseId": "C03",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "俵太へ荷を渡す直前、独立した秤係が記録した生の秤札だ。「袋を除く正味：秤目80／店主の読み上げ：十杯」とあるだけで、標準八杯とも不足二杯とも書かれていない。",
    "choices": [
      {
        "id": "D_C03_E04_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C03_E04_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C03_04"
          }
        ]
      },
      {
        "id": "D_C03_E04_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C03_E04_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E04_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C03_E04_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E04_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_SCALE",
    "evidenceId": "EV_C03_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E04_QUOTE",
    "caseId": "C03",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "枡目の添え書きがある。「ここが杯数の欄、こっちが秤の目だ。店主が『十杯』と読み上げるのを聞き、秤が『八十目』を指すのを見て、そのまま書き留めた。この二つの数を比べるには、同じ米の一杯を量ってみなくちゃね。」",
    "choices": [
      {
        "id": "D_C03_E04_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E04",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_MASUME",
    "locationId": "LOC_MARKET_SCALE",
    "evidenceId": "EV_C03_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E04_LIMIT",
    "caseId": "C03",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "運び手へ渡る前から、米の正味は秤目80だった。比較実演で得た「同じ米・標準一杯＝秤目10」と合わせれば、渡した時点ですでに標準八杯しかなかったと計算できる。",
    "choices": [
      {
        "id": "D_C03_E04_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_E04_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_SCALE",
    "evidenceId": "EV_C03_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E04_LIMIT_L2",
    "caseId": "C03",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "もっとも、秤目80という数字だけでは杯数も不足も決まらない。比較実演の換算が必要だし、店主の狙いまではこの札からは読み取れないな。",
    "choices": [
      {
        "id": "D_C03_E04_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E04",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_SCALE",
    "evidenceId": "EV_C03_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E04_RECORDED",
    "caseId": "C03",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「出発前の立会秤札」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C03_E04_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C03_E04",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E04_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C03_04",
    "locationId": "LOC_MARKET_SCALE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C03_E05",
    "caseId": "C03",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "俵九郎が注文した合わせ板の控えだ。寸法と偏った二本の釘穴の位置が、あの枡の取付痕とぴたりと一致する。ただし職人は「底の保護板」として注文を受けていた。",
    "choices": [
      {
        "id": "D_C03_E05_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C03_E05_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C03_05"
          }
        ]
      },
      {
        "id": "D_C03_E05_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C03_E05_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E05_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C03_E05_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E05_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SHRINE_WORKSHOP",
    "evidenceId": "EV_C03_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E05_QUOTE",
    "caseId": "C03",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "竹次の添え書きがある。「底を守る板だと頼まれたんだ。注文どおりの寸法で作ったが、わざわざ一段上へ打ち付けたのはうちの仕事じゃないよ。」",
    "choices": [
      {
        "id": "D_C03_E05_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E05",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TAKEJI",
    "locationId": "LOC_SHRINE_WORKSHOP",
    "evidenceId": "EV_C03_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E05_LIMIT",
    "caseId": "C03",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "店主と加工された板の結びつきが分かるな。板の取付位置と容積の実演を合わせれば、不正な計量が行われた経緯が見えてくる。",
    "choices": [
      {
        "id": "D_C03_E05_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_E05_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SHRINE_WORKSHOP",
    "evidenceId": "EV_C03_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E05_LIMIT_L2",
    "caseId": "C03",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "だからといって、板を作った職人が用途を知ってグルだった証拠にはならないぞ。",
    "choices": [
      {
        "id": "D_C03_E05_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E05",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SHRINE_WORKSHOP",
    "evidenceId": "EV_C03_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E05_RECORDED",
    "caseId": "C03",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_05"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「合わせ板の製作控え」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C03_E05_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C03_E05",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E05_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C03_05",
    "locationId": "LOC_SHRINE_WORKSHOP",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C03_E06",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "取引時の立会札だ。店の焼印、上縁の欠け、二本の釘頭の図まで細かく描き込まれている。量ったのは俵九郎自身で、俵太はただ袋だけを受け取っていた。",
    "choices": [
      {
        "id": "D_C03_E06_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C03_E06_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C03_06"
          }
        ]
      },
      {
        "id": "D_C03_E06_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C03_E06_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E06_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C03_E06_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E06_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "evidenceId": "EV_C03_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E06_QUOTE",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "俵九郎の添え書きがある。「米を量ったのは私だ。運び手には袋だけを預けた。使っていた枡の絵図面は……ああ、そのとおりだよ。」",
    "choices": [
      {
        "id": "D_C03_E06_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E06",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TAWARAKURO",
    "locationId": "LOC_MARKET_DEALER",
    "evidenceId": "EV_C03_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E06_LIMIT",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "実演に使ったあの上げ底の枡こそが取引当日の器具で、量ったのは俵九郎だ。運び手の俵太は器具に触れてさえいない。",
    "choices": [
      {
        "id": "D_C03_E06_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_E06_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "evidenceId": "EV_C03_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E06_LIMIT_L2",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただし、これで他のすべての取引や、店の過去の商いまで不正だったと決めつけるわけにはいかないな。",
    "choices": [
      {
        "id": "D_C03_E06_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E06",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "evidenceId": "EV_C03_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E06_RECORDED",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「桝の使用と引渡しの記録」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C03_E06_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C03_E06",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E06_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C03_06",
    "locationId": "LOC_MARKET_DEALER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C03_E07",
    "caseId": "C03",
    "npcId": "NPC_YUKEMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "きっちり蓋をされた比較皿に、あの日の控え米が残されている。同じ乾き具合の米を使って、二つの枡の差をもう一度確かめられそうだ。",
    "choices": [
      {
        "id": "D_C03_E07_START",
        "labelJa": "検分を始める",
        "nextId": "D_C03_E07_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "playEvidenceReconstruction",
          "evidenceId": "EV_C03_07",
          "sourceEvent": "EVT_C03"
        }
      },
      {
        "id": "D_C03_E07_RECON_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SPRING_INN",
    "evidenceId": "EV_C03_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E07_OBSERVE",
    "caseId": "C03",
    "npcId": "NPC_YUKEMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "取引と同じ日に採取し、蓋付きの比較皿で保存しておいた同じ米だ。店の枡と標準の枡で量り直してみても、その比はやはり五分の四になる。",
    "choices": [
      {
        "id": "D_C03_E07_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C03_E07_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C03_07"
          }
        ]
      },
      {
        "id": "D_C03_E07_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C03_E07_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E07_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C03_E07_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E07_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SPRING_INN",
    "evidenceId": "EV_C03_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E07_QUOTE",
    "caseId": "C03",
    "npcId": "NPC_YUKEMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "湯気丸の添え書きがある。「宿の湯気から離れたところに取っておいた、あの日と同じ米だよ。米の条件をぴったりそろえても、底の高さの差だけは消えないんだ。」",
    "choices": [
      {
        "id": "D_C03_E07_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E07_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_YUKEMARU",
    "locationId": "LOC_SPRING_INN",
    "evidenceId": "EV_C03_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E07_LIMIT",
    "caseId": "C03",
    "npcId": "NPC_YUKEMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "この二杯の差を、運搬中の湿気や乾燥のせいだと言い逃れることはできないな。",
    "choices": [
      {
        "id": "D_C03_E07_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_E07_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SPRING_INN",
    "evidenceId": "EV_C03_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E07_LIMIT_L2",
    "caseId": "C03",
    "npcId": "NPC_YUKEMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "もちろん、米というものが湿気や乾燥で一切変化しない、なんて一般論を言いたいわけじゃないぞ。",
    "choices": [
      {
        "id": "D_C03_E07_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E07_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SPRING_INN",
    "evidenceId": "EV_C03_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E07_RECORDED",
    "caseId": "C03",
    "npcId": "NPC_YUKEMARU",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「乾燥条件をそろえた控え米」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C03_E07_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C03_E07",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E07_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C03_07",
    "locationId": "LOC_SPRING_INN",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C04_E01",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "葛葉の名と印が記された折り紙の手紙だ。外から見えるのは「当日は参れません」の一行だけ。よく見ると、下端に米糊の仮札でぴったり留まった折返しがある。",
    "choices": [
      {
        "id": "D_C04_E01_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C04_E01_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C04_01"
          }
        ]
      },
      {
        "id": "D_C04_E01_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C04_E01_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E01_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C04_E01_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E01_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_LOWER",
    "evidenceId": "EV_C04_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E01_QUOTE",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "小雨の添え書きがある。「ぼくが届けたのは、確かにこの手紙だよ。でも、姫さまが里の餅つきまでやめるなんて、ひと言も聞いていないんだ。」",
    "choices": [
      {
        "id": "D_C04_E01_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C04_E01",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_KOSAME",
    "locationId": "LOC_INARI_LOWER",
    "evidenceId": "EV_C04_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E01_LIMIT",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "いま表に見えている文は、手紙の全部じゃないのかもしれないな。",
    "choices": [
      {
        "id": "D_C04_E01_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_E01_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_LOWER",
    "evidenceId": "EV_C04_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E01_LIMIT_L2",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "この文面だけでは、里の祭に対する辞退や反対があったとは判断できないぞ。",
    "choices": [
      {
        "id": "D_C04_E01_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C04_E01",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_LOWER",
    "evidenceId": "EV_C04_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E01_RECORDED",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C04_01"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「「参れません」で閉じた手紙」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C04_E01_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C04_E01",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E01_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C04_01",
    "locationId": "LOC_INARI_LOWER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C04_E02",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "抜けるような青空の下へ、ひとすじの雨が降り注いでいる。事件当時の踊り場と庇のようすを、同じ条件で見比べられそうだ。今の天気が変わるのを待つ必要はない。",
    "choices": [
      {
        "id": "D_C04_E02_START",
        "labelJa": "検分を始める",
        "nextId": "D_C04_E02_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "playEvidenceReconstruction",
          "evidenceId": "EV_C04_02",
          "sourceEvent": "EVT_C04"
        }
      },
      {
        "id": "D_C04_E02_RECON_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "evidenceId": "EV_C04_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E02_OBSERVE",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "事件当時の再現では、晴れ渡った青空と局地的な天気雨が同時に見られる。雨脚はちょうど中段の行列あたりを叩いており、庇の下はまったく濡れていない。",
    "choices": [
      {
        "id": "D_C04_E02_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C04_E02_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C04_02"
          }
        ]
      },
      {
        "id": "D_C04_E02_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C04_E02_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E02_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C04_E02_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E02_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "evidenceId": "EV_C04_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E02_QUOTE",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "葛葉の添え書きがある。「晴れの日でも、このあたりにはよく通り雨が通りますの。傘の上は濡れているのに、下で笑っている顔は乾いている――そんな場所ですわ。」",
    "choices": [
      {
        "id": "D_C04_E02_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C04_E02_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_KUZUHA",
    "locationId": "LOC_INARI_MIDDLE",
    "evidenceId": "EV_C04_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E02_LIMIT",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "「晴れていたのだから紙が濡れるはずがない」という思い込みは間違いだったな。",
    "choices": [
      {
        "id": "D_C04_E02_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_E02_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "evidenceId": "EV_C04_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E02_LIMIT_L2",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただし、普段の空模様から、事件が起きた正確な時刻まで割り出すことはできないぞ。",
    "choices": [
      {
        "id": "D_C04_E02_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C04_E02_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "evidenceId": "EV_C04_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E02_RECORDED",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C04_02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「晴れ空の天気雨の観察」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C04_E02_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C04_E02",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E02_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C04_02",
    "locationId": "LOC_INARI_MIDDLE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C04_E03",
    "caseId": "C04",
    "npcId": "NPC_AIZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "手紙と同じ紙と、同じ米糊の試料が並べられている。濡らす、折る、乾かす。大切な原本に触れることなく、続きの文字が貼り隠れてしまう過程を確かめられそうだ。",
    "choices": [
      {
        "id": "D_C04_E03_START",
        "labelJa": "検分を始める",
        "nextId": "D_C04_E03_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "playEvidenceReconstruction",
          "evidenceId": "EV_C04_03",
          "sourceEvent": "EVT_C04"
        }
      },
      {
        "id": "D_C04_E03_RECON_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_AUTUMN_DYER",
    "evidenceId": "EV_C04_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E03_OBSERVE",
    "caseId": "C04",
    "npcId": "NPC_AIZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "婚礼用の同じ和紙と米糊で作った複製だ。雨を含ませ、折り畳んで乾かすと、仮札と折返しがぴったりと貼り付く。原本を濡らさずに同じ現象を試すことができる。",
    "choices": [
      {
        "id": "D_C04_E03_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C04_E03_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C04_03"
          }
        ]
      },
      {
        "id": "D_C04_E03_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C04_E03_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E03_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C04_E03_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E03_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_AUTUMN_DYER",
    "evidenceId": "EV_C04_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E03_QUOTE",
    "caseId": "C04",
    "npcId": "NPC_AIZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "藍蔵の添え書きがある。「これは試し紙だよ。大事な手紙を濡らさずに、同じ糊で確かめてみな。濡れたまま閉じると、裏側同士が吸い付くように貼りつくんだ。」",
    "choices": [
      {
        "id": "D_C04_E03_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C04_E03_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_AIZO",
    "locationId": "LOC_AUTUMN_DYER",
    "evidenceId": "EV_C04_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E03_LIMIT",
    "caseId": "C04",
    "npcId": "NPC_AIZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "雨に濡れた折り紙の一行が、仮札の裏へ隠れてしまう現象は実際に再現できると分かった。",
    "choices": [
      {
        "id": "D_C04_E03_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_E03_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_AUTUMN_DYER",
    "evidenceId": "EV_C04_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E03_LIMIT_L2",
    "caseId": "C04",
    "npcId": "NPC_AIZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "もっとも、自然に貼り付くというだけでは、誰かがわざと隠したのか、偶然だったのかまでは分からないな。",
    "choices": [
      {
        "id": "D_C04_E03_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C04_E03_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_AUTUMN_DYER",
    "evidenceId": "EV_C04_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E03_RECORDED",
    "caseId": "C04",
    "npcId": "NPC_AIZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C04_03"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「米糊の仮札の試料」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C04_E03_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C04_E03",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E03_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C04_03",
    "locationId": "LOC_AUTUMN_DYER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C04_E04",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "保存係が原本の折返しを丁寧に開き、展示している。「代わりに小雨を送り、里の餅つきは予定どおり」――葛葉の署名から折返しの先まで、紙の繊維がひと続きに繋がっている。",
    "choices": [
      {
        "id": "D_C04_E04_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C04_E04_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C04_04"
          }
        ]
      },
      {
        "id": "D_C04_E04_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C04_E04_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E04_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C04_E04_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E04_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_UPPER",
    "evidenceId": "EV_C04_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E04_QUOTE",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "小雨の添え書きがある。「ここだ！『代わりに小雨を送り』って書いてある。ぼくは断りの使いじゃない。祭に参加するための使いだったんだ。」",
    "choices": [
      {
        "id": "D_C04_E04_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C04_E04",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_KOSAME",
    "locationId": "LOC_INARI_UPPER",
    "evidenceId": "EV_C04_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E04_LIMIT",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "欠席するのは葛葉本人だけで、代理を立てて里の祭は続けるとはっきり書いてあるぞ。",
    "choices": [
      {
        "id": "D_C04_E04_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_E04_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_UPPER",
    "evidenceId": "EV_C04_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E04_LIMIT_L2",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただ、誰があとから「全里辞退」などという短い要約を作ったのかまでは、まだ分からないな。",
    "choices": [
      {
        "id": "D_C04_E04_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C04_E04",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_UPPER",
    "evidenceId": "EV_C04_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E04_RECORDED",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C04_04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「開いた手紙の続き」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C04_E04_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C04_E04",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E04_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C04_04",
    "locationId": "LOC_INARI_UPPER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C04_E05",
    "caseId": "C04",
    "npcId": "NPC_MOMONE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "葛葉が桃音に手渡していた控えだ。日付、代理の名、里の餅つき継続――全文が原本と一字一句違わず一致している。桃音は署名と読み上げの場に立ち会っていた。",
    "choices": [
      {
        "id": "D_C04_E05_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C04_E05_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C04_05"
          }
        ]
      },
      {
        "id": "D_C04_E05_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C04_E05_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E05_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C04_E05_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E05_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_PEACH_WEDDING",
    "evidenceId": "EV_C04_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E05_QUOTE",
    "caseId": "C04",
    "npcId": "NPC_MOMONE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "桃音の添え書きがある。「ご結婚のお知らせと一緒に預かったの。葛葉さまは、ご自身が行けなくても里の祭は続けると、最初から声に出して読んでいらしたわ。」",
    "choices": [
      {
        "id": "D_C04_E05_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C04_E05",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_MOMONE",
    "locationId": "LOC_PEACH_WEDDING",
    "evidenceId": "EV_C04_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E05_LIMIT",
    "caseId": "C04",
    "npcId": "NPC_MOMONE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "開かれた続きの文は、事件のあとになって慌てて付け足されたものじゃないってことだ。",
    "choices": [
      {
        "id": "D_C04_E05_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_E05_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_PEACH_WEDDING",
    "evidenceId": "EV_C04_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E05_LIMIT_L2",
    "caseId": "C04",
    "npcId": "NPC_MOMONE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただし、葛葉ひとりの返事であって、ほかのすべての里の意向まで代表しているわけじゃないぞ。",
    "choices": [
      {
        "id": "D_C04_E05_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C04_E05",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_PEACH_WEDDING",
    "evidenceId": "EV_C04_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E05_RECORDED",
    "caseId": "C04",
    "npcId": "NPC_MOMONE",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C04_05"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「桃源郷に残った婚礼の控え」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C04_E05_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C04_E05",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E05_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C04_05",
    "locationId": "LOC_PEACH_WEDDING",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C04_E06",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "発送前、葛葉が全文を読み上げて託した番号入りの控えだ。切り離した縁の形が原本とぴったり合う。葛葉の代理依頼とは別の欄に、小雨本人の筆跡で「午前の使いなら引き受けます。",
    "choices": [
      {
        "id": "D_C04_E06_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_E06_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "evidenceId": "EV_C04_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E06_L2",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "餅つきの当番と片付けは引き受けません。使い賃は、この範囲で。」と、はっきりした返事が残されている。",
    "choices": [
      {
        "id": "D_C04_E06_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C04_E06_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C04_06"
          }
        ]
      },
      {
        "id": "D_C04_E06_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C04_E06_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E06_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C04_E06_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E06_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "evidenceId": "EV_C04_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E06_QUOTE",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "葛葉の添え書きがある。「私が頼んだことと、小雨が引き受けたことは、別々の欄に記してあります。返事を出す人も、返事を受ける人も、ひとりずつ独立しているのですから。」",
    "choices": [
      {
        "id": "D_C04_E06_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C04_E06",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_KUZUHA",
    "locationId": "LOC_INARI_MIDDLE",
    "evidenceId": "EV_C04_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E06_LIMIT",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "発送の段階から代理の依頼があり、手紙全体として里の辞退を告げていたわけじゃない。小雨が引き受けた仕事は発送前の本人の返事で確認できて、あくまで「午前の使い」に限られる。",
    "choices": [
      {
        "id": "D_C04_E06_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_E06_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "evidenceId": "EV_C04_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E06_LIMIT_L2",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "葛葉が代理に指名したというだけで、小雨が承諾したことになるわけじゃない。この手紙や控えを盾に、一日じゅうの奉仕や餅つき当番、タダの片付けまで押し付けることはできないな。",
    "choices": [
      {
        "id": "D_C04_E06_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C04_E06",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "evidenceId": "EV_C04_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E06_RECORDED",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C04_06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「小雨の返事付き手渡し控え」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C04_E06_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C04_E06",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E06_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C04_06",
    "locationId": "LOC_INARI_MIDDLE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C04_E07",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        },
        {
          "op": "hasInference",
          "id": "INF_C04_02"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "筆丸は手紙の全文を読み、「葛葉本人の不在は里全体の辞退ではない。代理への依頼があり、小雨本人の承諾は午前の使いに限る」と確かに確認している。",
    "choices": [
      {
        "id": "D_C04_E07_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_E07_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_UPPER",
    "evidenceId": "EV_C04_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E07_L2",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        },
        {
          "op": "hasInference",
          "id": "INF_C04_02"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "その場には小雨と桃音も立ち会っており、双方が控えを手に持っている。",
    "choices": [
      {
        "id": "D_C04_E07_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C04_E07_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C04"
            },
            {
              "op": "hasInference",
              "id": "INF_C04_02"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C04_07"
          }
        ]
      },
      {
        "id": "D_C04_E07_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C04_E07_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E07_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C04_E07_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E07_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_UPPER",
    "evidenceId": "EV_C04_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E07_QUOTE",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        },
        {
          "op": "hasInference",
          "id": "INF_C04_02"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "小雨の添え書きがある。「筆丸さんにも、ちゃんと全文を読んでもらったんだ。『それなら辞退ではありませんね』って、向こうから言い直してくれたんだよ。」",
    "choices": [
      {
        "id": "D_C04_E07_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C04_E07",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_KOSAME",
    "locationId": "LOC_INARI_UPPER",
    "evidenceId": "EV_C04_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E07_LIMIT",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        },
        {
          "op": "hasInference",
          "id": "INF_C04_02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "筆丸が、全里辞退ではないことと代理本人の承諾の範囲を、京への提出より前にちゃんと理解していたことが分かる。",
    "choices": [
      {
        "id": "D_C04_E07_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_E07_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_UPPER",
    "evidenceId": "EV_C04_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E07_LIMIT_L2",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        },
        {
          "op": "hasInference",
          "id": "INF_C04_02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "里が参加するつもりだからって、誰かひとりがすべての作業を無条件に引き受ける保証にはならない。あとの虚偽提出については、提出本と来歴を合わせて見極める必要があるぞ。",
    "choices": [
      {
        "id": "D_C04_E07_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C04_E07",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_UPPER",
    "evidenceId": "EV_C04_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C04_E07_RECORDED",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C04_07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「全文を読み返した訂正の控え」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C04_E07_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C04_E07",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_E07_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C04_07",
    "locationId": "LOC_INARI_UPPER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C05_E01",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "京へ提出された集計表だ。中継所の預かり30俵と到着蔵の預かり30俵をそのまま足し上げ、合計60俵の納入義務があると計算している。そして今ある30俵との差を「不足」と言い張っているのだ。",
    "choices": [
      {
        "id": "D_C05_E01_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C05_E01_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C04"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C05_01"
          }
        ]
      },
      {
        "id": "D_C05_E01_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C05_E01_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E01_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C05_E01_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E01_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_REQUEST",
    "evidenceId": "EV_C05_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E01_QUOTE",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "潮蔵の添え書きがある。「海の蔵には十二俵、番号も揃っている。それなのに陸の分まで合わせて三十俵足りぬと言われたんじゃ。」",
    "choices": [
      {
        "id": "D_C05_E01_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E01",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_SHIOZO",
    "locationId": "LOC_RYUGU_REQUEST",
    "evidenceId": "EV_C05_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E01_LIMIT",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "争点になっている計算方法と、対象となる三便の範囲がはっきりした。",
    "choices": [
      {
        "id": "D_C05_E01_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_E01_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_REQUEST",
    "evidenceId": "EV_C05_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E01_LIMIT_L2",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "もちろん、表に書かれた数字が、そのまま実際の米の量を表しているわけじゃない。",
    "choices": [
      {
        "id": "D_C05_E01_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E01",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_REQUEST",
    "evidenceId": "EV_C05_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E01_RECORDED",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C05_01"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「三十俵不足という申し立て」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C05_E01_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C05_E01",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E01_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C05_01",
    "locationId": "LOC_RYUGU_REQUEST",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C05_E02",
    "caseId": "C05",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "通し番号「A17-01〜12」、同じ年の同じ祭に供える米十二俵を棚田から海風へ発送した控えだ。この便で新たに出荷されたのは、この十二俵だけである。",
    "choices": [
      {
        "id": "D_C05_E02_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C05_E02_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C05_02"
          }
        ]
      },
      {
        "id": "D_C05_E02_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C05_E02_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E02_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C05_E02_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E02_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_DISPATCH",
    "evidenceId": "EV_C05_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E02_QUOTE",
    "caseId": "C05",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "枡目の添え書きがある。「A17の一から十二。これが出荷した全部だよ。まず海風へ預けて、そこから竜宮へ移してもらったんだ。」",
    "choices": [
      {
        "id": "D_C05_E02_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E02",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_MASUME",
    "locationId": "LOC_TERRACES_DISPATCH",
    "evidenceId": "EV_C05_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E02_LIMIT",
    "caseId": "C05",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "A17の正確な数と通し番号、そして最初の送り元が確認できた。",
    "choices": [
      {
        "id": "D_C05_E02_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_E02_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_DISPATCH",
    "evidenceId": "EV_C05_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E02_LIMIT_L2",
    "caseId": "C05",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "もっとも、海風へ送った記録だけじゃ、無事に竜宮へ着いたとまでは言い切れないな。",
    "choices": [
      {
        "id": "D_C05_E02_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E02",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_DISPATCH",
    "evidenceId": "EV_C05_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E02_RECORDED",
    "caseId": "C05",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C05_02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「棚田のA17発送控え」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C05_E02_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C05_E02",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E02_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C05_02",
    "locationId": "LOC_TERRACES_DISPATCH",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C05_E03",
    "caseId": "C05",
    "npcId": "NPC_NAMISUKE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "海風の預替札だ。A17-01〜12の十二俵を受け取り、その同じ十二俵を竜宮へ預け替えたことが記されている。元の預かりを閉じる印と、引き継ぎの受取番号「R17」が並んで書かれている。",
    "choices": [
      {
        "id": "D_C05_E03_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C05_E03_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C05_03"
          }
        ]
      },
      {
        "id": "D_C05_E03_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C05_E03_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E03_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C05_E03_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E03_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_COAST_TRANSFER",
    "evidenceId": "EV_C05_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E03_QUOTE",
    "caseId": "C05",
    "npcId": "NPC_NAMISUKE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "波助の添え書きがある。「預替っていうのは、米をもう一山ふやすことじゃない。預かる手を、次の手へ渡すことだよ。」",
    "choices": [
      {
        "id": "D_C05_E03_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E03",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_NAMISUKE",
    "locationId": "LOC_COAST_TRANSFER",
    "evidenceId": "EV_C05_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E03_LIMIT",
    "caseId": "C05",
    "npcId": "NPC_NAMISUKE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "海風と竜宮の記録は別々の米じゃなく、同じ「A17」の保管が交代したことを示している。",
    "choices": [
      {
        "id": "D_C05_E03_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_E03_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_COAST_TRANSFER",
    "evidenceId": "EV_C05_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E03_LIMIT_L2",
    "caseId": "C05",
    "npcId": "NPC_NAMISUKE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただし、別の便や違う通し番号の荷までひとまとめにして相殺できるわけじゃないぞ。",
    "choices": [
      {
        "id": "D_C05_E03_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E03",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_COAST_TRANSFER",
    "evidenceId": "EV_C05_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E03_RECORDED",
    "caseId": "C05",
    "npcId": "NPC_NAMISUKE",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C05_03"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「海風のA17預替札」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C05_E03_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C05_E03",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E03_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C05_03",
    "locationId": "LOC_COAST_TRANSFER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C05_E04",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "水中でも朽ちない耐水の刻字札だ。「A17-01〜12、海風からの預替受取R17」と刻まれており、出荷札の通し番号とぴたりと対応している。",
    "choices": [
      {
        "id": "D_C05_E04_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C05_E04_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C05_04"
          }
        ]
      },
      {
        "id": "D_C05_E04_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C05_E04_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E04_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C05_E04_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E04_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_LEDGER",
    "evidenceId": "EV_C05_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E04_QUOTE",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "潮蔵の添え書きがある。「水の底では紙より石札が一番じゃ。ほら、海風の預替番号が刻んである。来たものと出たものの繋がりが一目で読めるじゃろう。」",
    "choices": [
      {
        "id": "D_C05_E04_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E04",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_SHIOZO",
    "locationId": "LOC_RYUGU_LEDGER",
    "evidenceId": "EV_C05_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E04_LIMIT",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "A17の十二俵が間違いなく竜宮へ到着したことが分かる。中継札にある引き継ぎ番号とも一致しているぞ。",
    "choices": [
      {
        "id": "D_C05_E04_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_E04_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_LEDGER",
    "evidenceId": "EV_C05_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E04_LIMIT_L2",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "もっとも、頑丈な密閉箱に入っているからって、誰も中身に触れられなかったとまでは言い切れないな。",
    "choices": [
      {
        "id": "D_C05_E04_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E04",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_LEDGER",
    "evidenceId": "EV_C05_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E04_RECORDED",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C05_04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「竜宮のR17受取石札」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C05_E04_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C05_E04",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E04_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C05_04",
    "locationId": "LOC_RYUGU_LEDGER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C05_E05",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "十二個の米箱と、立会いのもとで中身を確認した照合記録だ。数を数えたあと、番号を順に突き合わせて同じ荷の行方を追えそうだ。",
    "choices": [
      {
        "id": "D_C05_E05_START",
        "labelJa": "検分を始める",
        "nextId": "D_C05_E05_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "playEvidenceReconstruction",
          "evidenceId": "EV_C05_05",
          "sourceEvent": "EVT_C05"
        }
      },
      {
        "id": "D_C05_E05_RECON_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_CRATES",
    "evidenceId": "EV_C05_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E05_OBSERVE",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "中庭に並んだ耐水米箱が十二個。すべて外から番号が読み取れ、中身確認窓を共同で開けて確かめた照合記録が付いている。番号はA17-01〜12で揃っている。",
    "choices": [
      {
        "id": "D_C05_E05_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C05_E05_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C05_05"
          }
        ]
      },
      {
        "id": "D_C05_E05_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C05_E05_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E05_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C05_E05_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E05_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_CRATES",
    "evidenceId": "EV_C05_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E05_QUOTE",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "潮蔵の添え書きがある。「一つずつ潜って数えるのが大変なら、この照合台でまとめて見るといい。番号も中身も、みんなで立ち会って確かめてあるぞ。」",
    "choices": [
      {
        "id": "D_C05_E05_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E05_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_SHIOZO",
    "locationId": "LOC_RYUGU_CRATES",
    "evidenceId": "EV_C05_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E05_LIMIT",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "A17の十二俵は、いま現実にここに存在する。箱の外観だけで中身が入っていると推測したわけじゃない。",
    "choices": [
      {
        "id": "D_C05_E05_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_E05_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_CRATES",
    "evidenceId": "EV_C05_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E05_LIMIT_L2",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただし、ほかの地域の二便や、世間一般の盗難の有無までは、この箱からは分からないな。",
    "choices": [
      {
        "id": "D_C05_E05_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E05_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_CRATES",
    "evidenceId": "EV_C05_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E05_RECORDED",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C05_05"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「竜宮の十二箱の現物照合」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C05_E05_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C05_E05",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E05_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C05_05",
    "locationId": "LOC_RYUGU_CRATES",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C05_E06",
    "caseId": "C05",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "「B08-01〜08」の八俵を楓峡へ発送した控えだ。市の小口桝売り取引とはまったく別口の大袋である。",
    "choices": [
      {
        "id": "D_C05_E06_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C05_E06_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C05_06"
          }
        ]
      },
      {
        "id": "D_C05_E06_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C05_E06_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E06_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C05_E06_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E06_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_DISPATCH",
    "evidenceId": "EV_C05_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E06_QUOTE",
    "caseId": "C05",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "杵吉の添え書きがある。「こっちはB08の八俵だよ。市の十杯売りとは日も荷もまるで別だ。大きさを混ぜて数えちゃいけないよ。」",
    "choices": [
      {
        "id": "D_C05_E06_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E06",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_KINEKICHI",
    "locationId": "LOC_DAWN_DISPATCH",
    "evidenceId": "EV_C05_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E06_LIMIT",
    "caseId": "C05",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "B08は新たに出荷された八俵の一便だ。蔵町の市の二杯不足とは混同しないよう切り分ける必要があるぞ。",
    "choices": [
      {
        "id": "D_C05_E06_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_E06_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_DISPATCH",
    "evidenceId": "EV_C05_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E06_LIMIT_L2",
    "caseId": "C05",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "このあとどの蔵へ移ったかは、次の保管場所の記録を別に確かめる必要があるな。",
    "choices": [
      {
        "id": "D_C05_E06_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E06",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_DISPATCH",
    "evidenceId": "EV_C05_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E06_RECORDED",
    "caseId": "C05",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C05_06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「初日の出のB08発送控え」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C05_E06_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C05_E06",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E06_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C05_06",
    "locationId": "LOC_DAWN_DISPATCH",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C05_E07",
    "caseId": "C05",
    "npcId": "NPC_AIZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "楓峡での預替控えだ。B08-01〜08の受取と、雪灯りへの預け替えが一枚に記され、元の預かりを閉じる印と引き継ぎ番号「S08」が残されている。",
    "choices": [
      {
        "id": "D_C05_E07_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C05_E07_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C05_07"
          }
        ]
      },
      {
        "id": "D_C05_E07_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C05_E07_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E07_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C05_E07_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E07_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_AUTUMN_TRANSFER",
    "evidenceId": "EV_C05_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E07_QUOTE",
    "caseId": "C05",
    "npcId": "NPC_AIZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "藍蔵の添え書きがある。「紅葉の中を通り抜けた八俵が、雪の町へ届いただけの話さ。秋の荷と冬の荷で、米が二倍に増えたわけじゃないだろう。」",
    "choices": [
      {
        "id": "D_C05_E07_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E07",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_AIZO",
    "locationId": "LOC_AUTUMN_TRANSFER",
    "evidenceId": "EV_C05_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E07_LIMIT",
    "caseId": "C05",
    "npcId": "NPC_AIZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "楓峡と雪灯りの記録は、同じ八俵の中継と到着をつなぐものだ。",
    "choices": [
      {
        "id": "D_C05_E07_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_E07_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_AUTUMN_TRANSFER",
    "evidenceId": "EV_C05_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E07_LIMIT_L2",
    "caseId": "C05",
    "npcId": "NPC_AIZO",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "なお、各地の紅葉の色づきや季節の風景を、輸送日時の時計代わりに使っちゃいけないぞ。",
    "choices": [
      {
        "id": "D_C05_E07_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E07",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_AUTUMN_TRANSFER",
    "evidenceId": "EV_C05_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E07_RECORDED",
    "caseId": "C05",
    "npcId": "NPC_AIZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C05_07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「楓峡のB08預替控え」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C05_E07_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C05_E07",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E07_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C05_07",
    "locationId": "LOC_AUTUMN_TRANSFER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C05_E08",
    "caseId": "C05",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "「S08」として受け取ったB08-01〜08の八俵の在庫控えだ。受取記録と現物照合の両方を二名で確認した当日の控えが残っている。",
    "choices": [
      {
        "id": "D_C05_E08_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C05_E08_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C05_08"
          }
        ]
      },
      {
        "id": "D_C05_E08_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C05_E08_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E08_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C05_E08_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E08_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SNOW_STORE",
    "evidenceId": "EV_C05_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E08_QUOTE",
    "caseId": "C05",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "雪綴の添え書きがある。「八俵、欠番はありません。受け取った記録と、今ここにある現物の確認は別々に行いました。どちらか片方だけでは不十分ですから。」",
    "choices": [
      {
        "id": "D_C05_E08_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E08",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_YUKITSUZURI",
    "locationId": "LOC_SNOW_STORE",
    "evidenceId": "EV_C05_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E08_LIMIT",
    "caseId": "C05",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "B08の八俵は、すべて雪灯りの蔵に現存していることが確認できた。",
    "choices": [
      {
        "id": "D_C05_E08_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_E08_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SNOW_STORE",
    "evidenceId": "EV_C05_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E08_LIMIT_L2",
    "caseId": "C05",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "もちろん、雪の積もり具合から到着日時を推測した記録じゃないぞ。",
    "choices": [
      {
        "id": "D_C05_E08_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E08",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SNOW_STORE",
    "evidenceId": "EV_C05_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E08_RECORDED",
    "caseId": "C05",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C05_08"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「雪灯りのS08在庫控え」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C05_E08_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C05_E08",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E08_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C05_08",
    "locationId": "LOC_SNOW_STORE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C05_E09",
    "caseId": "C05",
    "npcId": "NPC_MOMONE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "「C10-01〜10」の十俵を竹隠れへ発送した、送り元の保持控えだ。",
    "choices": [
      {
        "id": "D_C05_E09_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C05_E09_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C05_09"
          }
        ]
      },
      {
        "id": "D_C05_E09_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C05_E09_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E09_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C05_E09_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E09_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_PEACH_DISPATCH",
    "evidenceId": "EV_C05_09",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E09_QUOTE",
    "caseId": "C05",
    "npcId": "NPC_MOMONE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "桃音の添え書きがある。「桃ばかりじゃないのよ。お祝い用の米も、きっちり十俵だけ送りました。送り元の控えは、ちゃんとこちらに残っているわ。」",
    "choices": [
      {
        "id": "D_C05_E09_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E09",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_MOMONE",
    "locationId": "LOC_PEACH_DISPATCH",
    "evidenceId": "EV_C05_09",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E09_LIMIT",
    "caseId": "C05",
    "npcId": "NPC_MOMONE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "C10で新たに出荷されたのは十俵だと分かる。",
    "choices": [
      {
        "id": "D_C05_E09_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_E09_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_PEACH_DISPATCH",
    "evidenceId": "EV_C05_09",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E09_LIMIT_L2",
    "caseId": "C05",
    "npcId": "NPC_MOMONE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "このあと受取側の報告とも、それぞれ別々に照合しなきゃいけないな。",
    "choices": [
      {
        "id": "D_C05_E09_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E09",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_PEACH_DISPATCH",
    "evidenceId": "EV_C05_09",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E09_RECORDED",
    "caseId": "C05",
    "npcId": "NPC_MOMONE",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C05_09"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「桃源郷のC10発送控え」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C05_E09_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C05_E09",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E09_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C05_09",
    "locationId": "LOC_PEACH_DISPATCH",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C05_E10",
    "caseId": "C05",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "竹隠れの預替控えだ。C10-01〜10を受け取り、蔵町の保管蔵へ「M10」として預け替え、元の預かりを閉じる印が押されている。",
    "choices": [
      {
        "id": "D_C05_E10_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C05_E10_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C05_10"
          }
        ]
      },
      {
        "id": "D_C05_E10_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C05_E10_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E10_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C05_E10_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E10_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SHRINE_TRANSFER",
    "evidenceId": "EV_C05_10",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E10_QUOTE",
    "caseId": "C05",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "竹次の添え書きがある。「年と祭の番号までしっかり見ておくれ。名前の似た別の荷を勝手につなげちゃいけないよ。これは間違いなく同じ十俵だ。」",
    "choices": [
      {
        "id": "D_C05_E10_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E10",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TAKEJI",
    "locationId": "LOC_SHRINE_TRANSFER",
    "evidenceId": "EV_C05_10",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E10_LIMIT",
    "caseId": "C05",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "竹隠れと蔵町の記録は、同じ十俵の受け渡しを示している。",
    "choices": [
      {
        "id": "D_C05_E10_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_E10_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SHRINE_TRANSFER",
    "evidenceId": "EV_C05_10",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E10_LIMIT_L2",
    "caseId": "C05",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "別の古い祭の「C10」と取り違えないよう、年や祭番号の一致まで確認する必要があるぞ。",
    "choices": [
      {
        "id": "D_C05_E10_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E10",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SHRINE_TRANSFER",
    "evidenceId": "EV_C05_10",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E10_RECORDED",
    "caseId": "C05",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C05_10"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「竹隠れのC10預替控え」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C05_E10_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C05_E10",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E10_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C05_10",
    "locationId": "LOC_SHRINE_TRANSFER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C05_E11",
    "caseId": "C05",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "公の保管蔵にある「C10-01〜10」の十俵を照合した控えだ。俵九郎の量り売り店とは、持ち主も取引もまったく別の荷物である。",
    "choices": [
      {
        "id": "D_C05_E11_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C05_E11_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C05_11"
          }
        ]
      },
      {
        "id": "D_C05_E11_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C05_E11_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E11_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C05_E11_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E11_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_STORE",
    "evidenceId": "EV_C05_11",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E11_QUOTE",
    "caseId": "C05",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "俵太の添え書きがある。「ここは市の共同蔵です。あの枡の米とはまったくの別便ですよ。同じ町の中だからって、同じ取引にはなりません。」",
    "choices": [
      {
        "id": "D_C05_E11_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E11",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TAWARATA",
    "locationId": "LOC_MARKET_STORE",
    "evidenceId": "EV_C05_11",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E11_LIMIT",
    "caseId": "C05",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "C10の十俵は公の保管蔵に現存していて、蔵町の市の不正売買とははっきり区別される。",
    "choices": [
      {
        "id": "D_C05_E11_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_E11_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_STORE",
    "evidenceId": "EV_C05_11",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E11_LIMIT_L2",
    "caseId": "C05",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "だからといって、俵九郎が過去に起こした小口売りの不足が帳消しになるわけじゃないぞ。",
    "choices": [
      {
        "id": "D_C05_E11_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E11",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_STORE",
    "evidenceId": "EV_C05_11",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E11_RECORDED",
    "caseId": "C05",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C05_11"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「蔵町のM10在庫控え」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C05_E11_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C05_E11",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E11_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C05_11",
    "locationId": "LOC_MARKET_STORE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C05_E12",
    "caseId": "C05",
    "npcId": "NPC_NAMISUKE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "発送、仮預かり、預替、到着――この祭で使われる伝票の見本だ。預替の際には同じ通し番号を引き継ぎ、元の預かりを閉じる決まりになっている。納入義務を二重に立てて数えないための約束事だ。",
    "choices": [
      {
        "id": "D_C05_E12_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C05_E12_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C05_12"
          }
        ]
      },
      {
        "id": "D_C05_E12_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C05_E12_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E12_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C05_E12_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E12_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_COAST_TRANSFER",
    "evidenceId": "EV_C05_12",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E12_QUOTE",
    "caseId": "C05",
    "npcId": "NPC_NAMISUKE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "波助の添え書きがある。「札の枚数が増えても、米の俵は増えない。この祭の決まりでは、預替のときに前の預かりを閉じるんだ。まずはこの見本を見ておこう。」",
    "choices": [
      {
        "id": "D_C05_E12_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E12",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_NAMISUKE",
    "locationId": "LOC_COAST_TRANSFER",
    "evidenceId": "EV_C05_12",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E12_LIMIT",
    "caseId": "C05",
    "npcId": "NPC_NAMISUKE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "判決に臨む前に押さえておくべき、この祭独自の帳簿ルールだ。",
    "choices": [
      {
        "id": "D_C05_E12_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_E12_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_COAST_TRANSFER",
    "evidenceId": "EV_C05_12",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E12_LIMIT_L2",
    "caseId": "C05",
    "npcId": "NPC_NAMISUKE",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "あくまでこの祭の帳簿の決まりであって、現実の会計や法律一般を説明するものじゃないな。",
    "choices": [
      {
        "id": "D_C05_E12_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C05_E12",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_COAST_TRANSFER",
    "evidenceId": "EV_C05_12",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C05_E12_RECORDED",
    "caseId": "C05",
    "npcId": "NPC_NAMISUKE",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C05_12"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「預替の約束と見本札」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C05_E12_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C05_E12",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_E12_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C05_12",
    "locationId": "LOC_COAST_TRANSFER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C06_E01",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "「各里の餅つきを取りやめる」という見出しの下に、お寺へ祈りに来た者たちの本物の署名片が貼り合わされた連名書だ。よく見ると、署名片の端に通し番号が振られている。",
    "choices": [
      {
        "id": "D_C06_E01_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C06_E01_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C04"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C06_01"
          }
        ]
      },
      {
        "id": "D_C06_E01_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C06_E01_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E01_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C06_E01_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E01_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_REQUEST",
    "evidenceId": "EV_C06_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E01_QUOTE",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "灯庵の添え書きがある。「お名前も印も、確かにお寺へいらした方々のものです。ですが、皆さまが祈られた願いは、その上に書かれた文とはまるで違います。」",
    "choices": [
      {
        "id": "D_C06_E01_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E01",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TOAN",
    "locationId": "LOC_TODAIJI_REQUEST",
    "evidenceId": "EV_C06_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E01_LIMIT",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "署名が本人のものであることと、今の文面に同意していることは、まったく別の問題だな。",
    "choices": [
      {
        "id": "D_C06_E01_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C06_E01_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_REQUEST",
    "evidenceId": "EV_C06_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E01_LIMIT_L2",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "どれほど署名が本物でも、あとから上に付けられた新しい見出しにまで頷いた証拠にはならないぞ。",
    "choices": [
      {
        "id": "D_C06_E01_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E01",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_REQUEST",
    "evidenceId": "EV_C06_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E01_RECORDED",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C06_01"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「祭をやめるという連名書」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C06_E01_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C06_E01",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E01_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C06_01",
    "locationId": "LOC_TODAIJI_REQUEST",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C06_E02",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "願いの文、署名、そして本人の控え。新しい見本票を使って、どの部分が誰の手元へ残る仕組みなのかを確かめることができそうだ。",
    "choices": [
      {
        "id": "D_C06_E02_START",
        "labelJa": "検分を始める",
        "nextId": "D_C06_E02_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "playEvidenceReconstruction",
          "evidenceId": "EV_C06_02",
          "sourceEvent": "EVT_C06"
        }
      },
      {
        "id": "D_C06_E02_RECON_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_PRAYER",
    "evidenceId": "EV_C06_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E02_OBSERVE",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "新しい見本票による実演だ。上段には目的・日付・番号、下段には署名、右端には本人控えが並ぶ。上段と下段をまたぐように割印が押され、切り離した署名片だけを整理係へ渡す仕組みになっている。",
    "choices": [
      {
        "id": "D_C06_E02_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C06_E02_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C06_02"
          }
        ]
      },
      {
        "id": "D_C06_E02_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C06_E02_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E02_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C06_E02_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E02_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_PRAYER",
    "evidenceId": "EV_C06_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E02_QUOTE",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "灯庵の添え書きがある。「上はお寺に、右はお参りされた方に、下の署名は記録係へ。切り離しても元の願いが迷子にならぬよう、番号と割印を添えております。」",
    "choices": [
      {
        "id": "D_C06_E02_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E02_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TOAN",
    "locationId": "LOC_TODAIJI_PRAYER",
    "evidenceId": "EV_C06_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E02_LIMIT",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "あとで使う証拠の仕組みと、目的の文面と署名を切り離したときに起こり得るすり替えの構造を、先に理解できるな。",
    "choices": [
      {
        "id": "D_C06_E02_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C06_E02_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_PRAYER",
    "evidenceId": "EV_C06_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E02_LIMIT_L2",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただし、いま実演した今日の見本が、そのまま過去の事件の原本というわけじゃないぞ。",
    "choices": [
      {
        "id": "D_C06_E02_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E02_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_PRAYER",
    "evidenceId": "EV_C06_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E02_RECORDED",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C06_02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「毎日の祈願票の実演」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C06_E02_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C06_E02",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E02_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C06_02",
    "locationId": "LOC_TODAIJI_PRAYER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C06_E03",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "事件当日の上段だけが残された綴りだ。「今日も、それぞれの里で餅をつけますように」という祈りの文と、日付、番号「P21・P22・P23」が並んでいる。下端には不規則な切り離し跡が残る。",
    "choices": [
      {
        "id": "D_C06_E03_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C06_E03_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C06_03"
          }
        ]
      },
      {
        "id": "D_C06_E03_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C06_E03_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E03_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C06_E03_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E03_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_BACKING",
    "evidenceId": "EV_C06_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E03_QUOTE",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "灯庵の添え書きがある。「下の署名は切り離してお渡ししました。ここに残った上半分と、向こうにある紙の切れ目がひとつに繋がるか、どうかお確かめください。」",
    "choices": [
      {
        "id": "D_C06_E03_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E03",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TOAN",
    "locationId": "LOC_TODAIJI_BACKING",
    "evidenceId": "EV_C06_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E03_LIMIT",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "署名片の本来の目的を示す原本の片側だ。肝心の署名部分は、もうここには残っていない。",
    "choices": [
      {
        "id": "D_C06_E03_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C06_E03_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_BACKING",
    "evidenceId": "EV_C06_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E03_LIMIT_L2",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "この上段だけでは、偽の連名書に貼られた署名片と同一の紙だったとまではまだ言い切れないな。",
    "choices": [
      {
        "id": "D_C06_E03_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E03",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_BACKING",
    "evidenceId": "EV_C06_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E03_RECORDED",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C06_03"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「寺に残る上段の綴り」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C06_E03_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C06_E03",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E03_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C06_03",
    "locationId": "LOC_TODAIJI_BACKING",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C06_E04",
    "caseId": "C06",
    "npcId": "NPC_SUZUNA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "鈴菜本人が大切に持っていた右片だ。番号「P21」、事件当日の日付、そして祈りの全文が記されている。彼女は各里の餅つきが続くことを祈り、その文を読んで署名した。",
    "choices": [
      {
        "id": "D_C06_E04_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C06_E04_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C06_04"
          }
        ]
      },
      {
        "id": "D_C06_E04_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C06_E04_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E04_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C06_E04_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E04_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MOON_TEMPLE",
    "evidenceId": "EV_C06_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E04_QUOTE",
    "caseId": "C06",
    "npcId": "NPC_SUZUNA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "鈴菜の添え書きがある。「『餅つきが絶えませんように』と祈ったの。やめてくださいなんて書いた覚えはないし、手元の控えにもそんなことは書かれていないわ。」",
    "choices": [
      {
        "id": "D_C06_E04_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E04",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_SUZUNA",
    "locationId": "LOC_MOON_TEMPLE",
    "evidenceId": "EV_C06_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E04_LIMIT",
    "caseId": "C06",
    "npcId": "NPC_SUZUNA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "お寺とは別の場所で保管されていた、本人所有の原本片と本来の目的を確認できるぞ。",
    "choices": [
      {
        "id": "D_C06_E04_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C06_E04_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MOON_TEMPLE",
    "evidenceId": "EV_C06_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E04_LIMIT_L2",
    "caseId": "C06",
    "npcId": "NPC_SUZUNA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "もっとも、本人の思いだけじゃ、誰が紙を貼り替えたのかまでは特定できないな。",
    "choices": [
      {
        "id": "D_C06_E04_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E04",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MOON_TEMPLE",
    "evidenceId": "EV_C06_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E04_RECORDED",
    "caseId": "C06",
    "npcId": "NPC_SUZUNA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C06_04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「鈴菜の本人控えP21」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C06_E04_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C06_E04",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E04_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C06_04",
    "locationId": "LOC_MOON_TEMPLE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C06_E05",
    "caseId": "C06",
    "npcId": "NPC_YUKEMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "右片「P22」、同じ日付と同じ目的の全文が記されている。お寺や鈴菜とはまったく別の場所で保管されていたもので、番号は連名書の二枚目の署名片と一致する。",
    "choices": [
      {
        "id": "D_C06_E05_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C06_E05_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C06_05"
          }
        ]
      },
      {
        "id": "D_C06_E05_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C06_E05_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E05_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C06_E05_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E05_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SPRING_INN",
    "evidenceId": "EV_C06_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E05_QUOTE",
    "caseId": "C06",
    "npcId": "NPC_YUKEMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "湯気丸の添え書きがある。「湯を沸かす忙しい朝でも、それぞれの里の餅つきは続いてほしい。そういう願いを込めて名前を書いたんだ。」",
    "choices": [
      {
        "id": "D_C06_E05_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E05",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_YUKEMARU",
    "locationId": "LOC_SPRING_INN",
    "evidenceId": "EV_C06_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E05_LIMIT",
    "caseId": "C06",
    "npcId": "NPC_YUKEMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "たまたま一枚だけ取り違えたんじゃなく、同じ目的で書かれた複数の署名が丸ごと転用されているわけだ。",
    "choices": [
      {
        "id": "D_C06_E05_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C06_E05_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SPRING_INN",
    "evidenceId": "EV_C06_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E05_LIMIT_L2",
    "caseId": "C06",
    "npcId": "NPC_YUKEMARU",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "なお、蔵の審理で問題になっている米の不足額とは直接の関係はないぞ。",
    "choices": [
      {
        "id": "D_C06_E05_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E05",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SPRING_INN",
    "evidenceId": "EV_C06_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E05_RECORDED",
    "caseId": "C06",
    "npcId": "NPC_YUKEMARU",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C06_05"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「湯気丸の本人控えP22」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C06_E05_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C06_E05",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E05_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C06_05",
    "locationId": "LOC_SPRING_INN",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C06_E06",
    "caseId": "C06",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "紙を無理に引き寄せて合わせるのではなく、切れ目と割印の位置をそっと並べて比べる。同じ輪郭が続く場所と、番号でつながる場所が浮かび上がってくる。",
    "choices": [
      {
        "id": "D_C06_E06_START",
        "labelJa": "検分を始める",
        "nextId": "D_C06_E06_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "playEvidenceReconstruction",
          "evidenceId": "EV_C06_06",
          "sourceEvent": "EVT_C06"
        }
      },
      {
        "id": "D_C06_E06_RECON_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SNOW_BINDER",
    "evidenceId": "EV_C06_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E06_OBSERVE",
    "caseId": "C06",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "雪綴本人の右片「P23」にも、祈願の日付と目的の全文が残されている。透明台の上で見本票の上下片を重ね合わせ、番号・切れ目・割印の照合手順を確認した。本物の三枚の接続は、すべての資料を揃えてお寺で検分する。",
    "choices": [
      {
        "id": "D_C06_E06_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C06_E06_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C06_06"
          }
        ]
      },
      {
        "id": "D_C06_E06_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C06_E06_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E06_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C06_E06_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E06_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SNOW_BINDER",
    "evidenceId": "EV_C06_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E06_QUOTE",
    "caseId": "C06",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "雪綴の添え書きがある。「字が似ている、というだけでは不十分です。切れ目、番号、割印――その三つが一度にぴたりと繋がるかを見極めましょう。」",
    "choices": [
      {
        "id": "D_C06_E06_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E06_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_YUKITSUZURI",
    "locationId": "LOC_SNOW_BINDER",
    "evidenceId": "EV_C06_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E06_LIMIT",
    "caseId": "C06",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "紙片が同一の原本から切り離されたものかを、筆跡の印象じゃなく物理的な接続で確かめる方法が分かった。",
    "choices": [
      {
        "id": "D_C06_E06_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C06_E06_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SNOW_BINDER",
    "evidenceId": "EV_C06_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E06_LIMIT_L2",
    "caseId": "C06",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "紙の色合いが似ていることや、筆跡が同じに見えることだけでは、元の紙が同一だったとは断定できないな。",
    "choices": [
      {
        "id": "D_C06_E06_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E06_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SNOW_BINDER",
    "evidenceId": "EV_C06_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E06_RECORDED",
    "caseId": "C06",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C06_06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「雪綴の本人控えP23と紙継ぎ見本」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C06_E06_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C06_E06",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E06_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C06_06",
    "locationId": "LOC_SNOW_BINDER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C06_E07",
    "caseId": "C06",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "川の使い・羽文の受渡控えだ。P21〜P23の署名片を「毎日の祈願記録」としてお寺から受け取っている。お寺にある上段は運んでおらず、取消文の見出しも荷物には添えられていなかった。",
    "choices": [
      {
        "id": "D_C06_E07_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C06_E07_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C06_07"
          }
        ]
      },
      {
        "id": "D_C06_E07_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C06_E07_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E07_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C06_E07_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E07_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_RECEIPT",
    "evidenceId": "EV_C06_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E07_QUOTE",
    "caseId": "C06",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "羽文の添え書きがある。「預かった荷札には『祈願記録』と書いてありました。祭を取りやめる、なんていう見出しは荷の中にひとかけらも入っていませんでしたよ。」",
    "choices": [
      {
        "id": "D_C06_E07_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E07",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_HABUMI",
    "locationId": "LOC_RIVER_RECEIPT",
    "evidenceId": "EV_C06_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E07_LIMIT",
    "caseId": "C06",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "お寺から送り出された時点での、紙片の用途と中身がはっきりした。取消文は最初からこの荷にはなかったんだ。",
    "choices": [
      {
        "id": "D_C06_E07_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C06_E07_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_RECEIPT",
    "evidenceId": "EV_C06_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E07_LIMIT_L2",
    "caseId": "C06",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただし、そのあと誰が連名書の見出しを付けたのかまでは、この受渡控えだけでは決まらないぞ。",
    "choices": [
      {
        "id": "D_C06_E07_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E07",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_RECEIPT",
    "evidenceId": "EV_C06_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E07_RECORDED",
    "caseId": "C06",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C06_07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「川の使いの受渡控え」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C06_E07_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C06_E07",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E07_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C06_07",
    "locationId": "LOC_RIVER_RECEIPT",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C06_E08",
    "caseId": "C06",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_06"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "三人の署名片それぞれに、お寺の上段と本人の控えを並べて照合する。同じひとつの祈りの文に対して、三者三様の返事が残されている。",
    "choices": [
      {
        "id": "D_C06_E08_START",
        "labelJa": "検分を始める",
        "nextId": "D_C06_E08_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "playEvidenceReconstruction",
          "evidenceId": "EV_C06_08",
          "sourceEvent": "EVT_C06"
        }
      },
      {
        "id": "D_C06_E08_RECON_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_BACKING",
    "evidenceId": "EV_C06_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E08_OBSERVE",
    "caseId": "C06",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_06"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "P21〜P23の署名片がそれぞれの上段とただ一つに噛み合い、割印の線が連続する。本人の控えに書かれた目的・番号・日付もすべて一致した。三つの独立した原本をひとつと混同することはない。",
    "choices": [
      {
        "id": "D_C06_E08_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C06_E08_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C04"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C06_01"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C06_03"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C06_04"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C06_05"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C06_06"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C06_08"
          }
        ]
      },
      {
        "id": "D_C06_E08_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C06_E08_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E08_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C06_E08_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E08_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_BACKING",
    "evidenceId": "EV_C06_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E08_QUOTE",
    "caseId": "C06",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_06"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "雪綴の添え書きがある。「三枚とも、ぴたりと繋がりましたね。署名は紛れもなく本物です。けれど、その上に本来あった願いを、別の文へすり替えた者がいるのです。」",
    "choices": [
      {
        "id": "D_C06_E08_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E08_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_YUKITSUZURI",
    "locationId": "LOC_TODAIJI_BACKING",
    "evidenceId": "EV_C06_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E08_LIMIT",
    "caseId": "C06",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "本物の祈願署名が、まったく別の見出しの下へ転用された事実を確定できる。",
    "choices": [
      {
        "id": "D_C06_E08_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C06_E08_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_BACKING",
    "evidenceId": "EV_C06_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E08_LIMIT_L2",
    "caseId": "C06",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "誰が貼り替えたのか、また故意だったのかを突き止めるには、さらに別の証拠が必要になるぞ。",
    "choices": [
      {
        "id": "D_C06_E08_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E08_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_BACKING",
    "evidenceId": "EV_C06_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E08_RECORDED",
    "caseId": "C06",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C06_08"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「三枚の接続照合」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C06_E08_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C06_E08",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E08_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C06_08",
    "locationId": "LOC_TODAIJI_BACKING",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C06_E09",
    "caseId": "C06",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "祈願票を作った際に残された版下だ。目的の全文・三分割の線・番号の位置まで固定されており、取りやめの見出しなどはどこにも彫られていない。",
    "choices": [
      {
        "id": "D_C06_E09_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C06_E09_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C06_09"
          }
        ]
      },
      {
        "id": "D_C06_E09_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C06_E09_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E09_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C06_E09_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E09_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SHRINE_WORKSHOP",
    "evidenceId": "EV_C06_09",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E09_QUOTE",
    "caseId": "C06",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "竹次の添え書きがある。「この版木には、祭をやめる文なんかひと言も彫っちゃいないよ。願いと名前が離れても番号で元に戻せる――それがこの紙の仕組みなんだ。」",
    "choices": [
      {
        "id": "D_C06_E09_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E09",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TAKEJI",
    "locationId": "LOC_SHRINE_WORKSHOP",
    "evidenceId": "EV_C06_09",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E09_LIMIT",
    "caseId": "C06",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "「祈願票は最初から取消書だった」という弁解を根底から否定する、独立した製作資料だ。",
    "choices": [
      {
        "id": "D_C06_E09_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C06_E09_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SHRINE_WORKSHOP",
    "evidenceId": "EV_C06_09",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E09_LIMIT_L2",
    "caseId": "C06",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "もちろん、この版下だけを持ち出して、住民全員の意向を代表させちゃいけないな。",
    "choices": [
      {
        "id": "D_C06_E09_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C06_E09",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SHRINE_WORKSHOP",
    "evidenceId": "EV_C06_09",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C06_E09_RECORDED",
    "caseId": "C06",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C06_09"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「印刷見本にない取消の見出し」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C06_E09_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C06_E09",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_E09_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C06_09",
    "locationId": "LOC_SHRINE_WORKSHOP",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E01",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "申立人は筆丸。本文の見出しは「現在も未解決の六事」と大きく掲げられている。祝い杵の未返却、横綱の所在不明、市の欠量未補填、稲荷の全里辞退、指定三便の三十俵不足、祈願者の取消同意――六つの問題が列挙されている。",
    "choices": [
      {
        "id": "D_C07_E01_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E01_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST",
    "evidenceId": "EV_C07_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E01_L2",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "浦から稲荷までの四件の添付資料には当事者が確認した本物の相談欄が使われているが、返事欄がまるごと無い。しかも、祝い杵と米売りの左欄の余白には、うっすらと反転した墨の跡が残っている。",
    "choices": [
      {
        "id": "D_C07_E01_L2_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E01_L3",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST",
    "evidenceId": "EV_C07_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E01_L3",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "なお、三便と祈願に関する資料は、この申し立てが組まれる前に別の経緯で作られた原資料である。",
    "choices": [
      {
        "id": "D_C07_E01_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C07_E01_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C04"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C07_01"
          }
        ]
      },
      {
        "id": "D_C07_E01_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C07_E01_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E01_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C07_E01_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E01_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST",
    "evidenceId": "EV_C07_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E01_QUOTE",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "羽文の添え書きがある。「これは、ぼくたちが届けた相談の字です。偽物なんかじゃない。なのに、みんなが助かった結果のところだけが、ごっそり抜け落ちているんです。」",
    "choices": [
      {
        "id": "D_C07_E01_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E01",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_HABUMI",
    "locationId": "LOC_KYO_REQUEST",
    "evidenceId": "EV_C07_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E01_LIMIT",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "争うべきは当初の相談が本当だったかどうかじゃない。それを「提出時点でも未解決の状態」として並べ立てた本文の時制と意図だ。預かり米と祈願票の依頼メモが時間を遡って使われたわけじゃないぞ。",
    "choices": [
      {
        "id": "D_C07_E01_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E01_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST",
    "evidenceId": "EV_C07_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E01_LIMIT_L2",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "原票が本物だからといって、この見出しや時制まで正しいとは限らない。書類を預けた同意を、勝手に改変して集約案へ使う同意と取り違えちゃいけないな。",
    "choices": [
      {
        "id": "D_C07_E01_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E01",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST",
    "evidenceId": "EV_C07_01",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E01_RECORDED",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_01"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「一つ臼の最終申し立て」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C07_E01_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C07_E01",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E01_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C07_01",
    "locationId": "LOC_KYO_REQUEST",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E02",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "浦から稲荷までの四件の訂正記録を、筆丸が要旨付きで声に出して読み返し、確認した記録簿だ。各地の立会人の控えとも一致し、祈願片の用途説明も明記されている。提出よりも前の祭暦時点の記録である。",
    "choices": [
      {
        "id": "D_C07_E02_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C07_E02_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C04"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C07_02"
          }
        ]
      },
      {
        "id": "D_C07_E02_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C07_E02_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E02_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C07_E02_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E02_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_RECEIPT",
    "evidenceId": "EV_C07_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E02_QUOTE",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "羽文の添え書きがある。「受け取った印だけじゃありません。筆丸さんが要旨を読み返した言葉を、立会いの方と一緒に一言一句書き留めてあるんです。」",
    "choices": [
      {
        "id": "D_C07_E02_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E02",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_HABUMI",
    "locationId": "LOC_RIVER_RECEIPT",
    "evidenceId": "EV_C07_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E02_LIMIT",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "単に封筒を受け取ったというだけじゃなく、筆丸が訂正の中身をはっきり理解していたことを、独立した記録で証明できるな。",
    "choices": [
      {
        "id": "D_C07_E02_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E02_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_RECEIPT",
    "evidenceId": "EV_C07_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E02_LIMIT_L2",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "ただし、のちの預かり米や祈願票の判決で分かった知識を、事件が起きる前の時点へさかのぼって当てはめちゃいけないぞ。",
    "choices": [
      {
        "id": "D_C07_E02_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E02",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_RECEIPT",
    "evidenceId": "EV_C07_02",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E02_RECORDED",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「全訂正の読み返し受領簿」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C07_E02_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C07_E02",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E02_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C07_02",
    "locationId": "LOC_RIVER_RECEIPT",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E03",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "評定所の直記と別の立会人が、筆丸の読み上げた六つの文面、見出し「現在も未解決の六事」、添付番号、頁数、紙継ぎの位置をすべて照合した提出控えだ。",
    "choices": [
      {
        "id": "D_C07_E03_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E03_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_INTAKE",
    "evidenceId": "EV_C07_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E03_L2",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "祝い杵と米売りの添付左欄に残る薄い反転墨も、受理した瞬間の写しにしっかり記録されており、いま目の前にある提出本と一致する。調査の検分で付けた写りを提出時のものと取り違える余地はない。",
    "choices": [
      {
        "id": "D_C07_E03_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C07_E03_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C04"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C07_03"
          }
        ]
      },
      {
        "id": "D_C07_E03_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C07_E03_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E03_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C07_E03_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E03_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_INTAKE",
    "evidenceId": "EV_C07_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E03_QUOTE",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "直記の添え書きがある。「筆丸どのが、その六つの文をご自身の声で読み上げられました。私は番号と紙継ぎを照合いたしました。今の提出本と、一点の違いもありません。」",
    "choices": [
      {
        "id": "D_C07_E03_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E03",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_NAOKI",
    "locationId": "LOC_KYO_INTAKE",
    "evidenceId": "EV_C07_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E03_LIMIT",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "誤った本文、添付された左片、そして反転墨の写りが、筆丸の提出した時点でひとつの束になっていたことが分かる。「あとから検分台で付けた墨だ」という言い逃れを、受理控えと照合して崩せるぞ。",
    "choices": [
      {
        "id": "D_C07_E03_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E03_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_INTAKE",
    "evidenceId": "EV_C07_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E03_LIMIT_L2",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "もっとも、封が閉じていたから絶対に誰も触れられなかった、というような密室証明じゃないな。",
    "choices": [
      {
        "id": "D_C07_E03_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E03",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_INTAKE",
    "evidenceId": "EV_C07_03",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E03_RECORDED",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_03"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「受付の照合付き提出控え」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C07_E03_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C07_E03",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E03_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C07_03",
    "locationId": "LOC_KYO_INTAKE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E04",
    "caseId": "C07",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "雪綴の作業控えだ。彼女の元に届いた時点で、原票はすでに相談側の左片だけになっていた。雪綴は筆丸の割付に従って番号順に綴じ、受付印、折り端、左欄の反転墨、本文見出しの位置を控え、筆丸の確認を得て返している。",
    "choices": [
      {
        "id": "D_C07_E04_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E04_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SNOW_BINDER",
    "evidenceId": "EV_C07_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E04_L2",
    "caseId": "C07",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "原票が本物であることを確かめることと、切り落とされた返事の存在まで承認することは、まったく別の問題だ。",
    "choices": [
      {
        "id": "D_C07_E04_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C07_E04_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C04"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C07_04"
          }
        ]
      },
      {
        "id": "D_C07_E04_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C07_E04_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E04_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C07_E04_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E04_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SNOW_BINDER",
    "evidenceId": "EV_C07_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E04_QUOTE",
    "caseId": "C07",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "雪綴の添え書きがある。「私のところへ来たときには、すでに左側の紙だけでした。端をそろえ、元の印を隠さないように丁寧に綴じました。……読みやすく整える仕事が、いったい何を読めなくしてしまったのか。」",
    "choices": [
      {
        "id": "D_C07_E04_QUOTE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E04_QUOTE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_YUKITSUZURI",
    "locationId": "LOC_SNOW_BINDER",
    "evidenceId": "EV_C07_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E04_QUOTE_L2",
    "caseId": "C07",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "「そこまでは、私の方から聞くべきでした。」",
    "choices": [
      {
        "id": "D_C07_E04_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E04",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_YUKITSUZURI",
    "locationId": "LOC_SNOW_BINDER",
    "evidenceId": "EV_C07_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E04_LIMIT",
    "caseId": "C07",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "運び手が途中で差し替えたという説や、綴じ師が勝手に文意を作り変えたという説を、この独立した内容記録で検証できるな。",
    "choices": [
      {
        "id": "D_C07_E04_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E04_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SNOW_BINDER",
    "evidenceId": "EV_C07_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E04_LIMIT_L2",
    "caseId": "C07",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "もちろん、綴じ師が真面目で善良な人柄だから無実だ、なんて感情論が根拠になるわけじゃないぞ。",
    "choices": [
      {
        "id": "D_C07_E04_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E04",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SNOW_BINDER",
    "evidenceId": "EV_C07_04",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E04_RECORDED",
    "caseId": "C07",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「雪綴の綴じ渡し控え」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C07_E04_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C07_E04",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E04_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C07_04",
    "locationId": "LOC_SNOW_BINDER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E05",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "筆丸自身が内容を照合した綴じ指定図だ。二つ折り札の左欄に「本文へ」、右欄に「控えへ」と矢印を引き、当事者の受付印だけを残す配置を指定している。",
    "choices": [
      {
        "id": "D_C07_E05_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E05_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "evidenceId": "EV_C07_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E05_L2",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "「相談の記録」をまとめるだけの指示なら、必ずしも不正とは言えない。しかし最終稿の頭には、「現在も未解決の六事」という見出しが据えられているのだ。",
    "choices": [
      {
        "id": "D_C07_E05_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C07_E05_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C04"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C07_05"
          }
        ]
      },
      {
        "id": "D_C07_E05_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C07_E05_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E05_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C07_E05_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E05_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "evidenceId": "EV_C07_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E05_QUOTE",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "直記の添え書きがある。「『左欄を本文へ、右欄は控えへ』――ここだけを見れば、単なる相談の記録を作る仕事にも見えます。どうか、実際に提出された表題と同じ机に並べて比べてみてください。」",
    "choices": [
      {
        "id": "D_C07_E05_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E05",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_NAOKI",
    "locationId": "LOC_KYO_ARCHIVE",
    "evidenceId": "EV_C07_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E05_LIMIT",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "見開きのどちら半分を本文に採るかを指示した編集の経路が見えるな。完成していた見開き、受領時の知識、実際に提出した時制と合わせれば、この編集が何を意味していたかが浮かび上がる。",
    "choices": [
      {
        "id": "D_C07_E05_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E05_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "evidenceId": "EV_C07_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E05_LIMIT_L2",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "左欄を抜粋することや簡潔に要約すること自体がすぐ不正になるわけじゃない。この指定図だけで故意を認定することはできないぞ。",
    "choices": [
      {
        "id": "D_C07_E05_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E05",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "evidenceId": "EV_C07_05",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E05_RECORDED",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_05"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「相談欄だけを並べる清書割付」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C07_E05_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C07_E05",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E05_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C07_05",
    "locationId": "LOC_KYO_ARCHIVE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E06",
    "caseId": "C07",
    "npcId": "NPC_TOKA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "京の大通り、東筋、そして東の塔。同じ事件の夜の三つの視点を並べて比べる。山に灯る火床の重なり方が、筆丸の描いた図とどう違うのか確かめられそうだ。",
    "choices": [
      {
        "id": "D_C07_E06_START",
        "labelJa": "検分を始める",
        "nextId": "D_C07_E06_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "playEvidenceReconstruction",
          "evidenceId": "EV_C07_06",
          "sourceEvent": "EVT_C07_DAIMONJI"
        }
      },
      {
        "id": "D_C07_E06_RECON_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_AVENUE_VIEW",
    "evidenceId": "EV_C07_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E06_OBSERVE",
    "caseId": "C07",
    "npcId": "NPC_TOKA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "固定された事件の夜の再現で、南大路・東筋の地上・東塔の北回廊を、同じ火床の配置と同じ目線で比較する。大路から見ると美しく整う「大」の字も、ほかの地点から見れば火の重なりも間隔も大きく変わってしまう。",
    "choices": [
      {
        "id": "D_C07_E06_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C07_E06_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C04"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C07_06"
          }
        ]
      },
      {
        "id": "D_C07_E06_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C07_E06_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E06_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C07_E06_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E06_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_AVENUE_VIEW",
    "evidenceId": "EV_C07_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E06_QUOTE",
    "caseId": "C07",
    "npcId": "NPC_TOKA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "灯火の添え書きがある。「火床は実際の山肌に並んでいるから、歩く場所を変えれば重なり方も変わるんだよ。これは時刻当てじゃない。同じ夜を、立つ場所を変えて見比べるのさ。」",
    "choices": [
      {
        "id": "D_C07_E06_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E06_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TOKA",
    "locationId": "LOC_KYO_AVENUE_VIEW",
    "evidenceId": "EV_C07_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E06_LIMIT",
    "caseId": "C07",
    "npcId": "NPC_TOKA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "大路から見た形の写生を持ち出して、「自分がいた塔の上でも同じ見え方だった」とする説明には使えないな。",
    "choices": [
      {
        "id": "D_C07_E06_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E06_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_AVENUE_VIEW",
    "evidenceId": "EV_C07_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E06_LIMIT_L2",
    "caseId": "C07",
    "npcId": "NPC_TOKA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "ただし、絵というものは記憶で頭の中で整えて描くこともできる。視点の矛盾だけを理由に、その人物の居場所や犯行を断定することはできないぞ。",
    "choices": [
      {
        "id": "D_C07_E06_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E06_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_AVENUE_VIEW",
    "evidenceId": "EV_C07_06",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E06_RECORDED",
    "caseId": "C07",
    "npcId": "NPC_TOKA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「三つの場所の送り火観察」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C07_E06_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C07_E06",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E06_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C07_06",
    "locationId": "LOC_KYO_AVENUE_VIEW",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E07",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "筆丸は「訂正の受取刻には見晴らしに座っており、そこから見えた火の配置をそのまま描いた」と説明している。しかし図に描かれているのは大路からの配置だ。もっとも、単なる誤記や写生の整形という可能性も残る。",
    "choices": [
      {
        "id": "D_C07_E07_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C07_E07_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C04"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C07_07"
          }
        ]
      },
      {
        "id": "D_C07_E07_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C07_E07_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E07_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C07_E07_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E07_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_LOOKOUT",
    "evidenceId": "EV_C07_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E07_QUOTE",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "筆丸の添え書きがある。「あの刻限は見晴らしにいたはずです。この写生も……ええ、確かにその場で見えたままを描いた、と申し上げました。」",
    "choices": [
      {
        "id": "D_C07_E07_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E07",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_FUDEM",
    "locationId": "LOC_KYO_LOOKOUT",
    "evidenceId": "EV_C07_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E07_LIMIT",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "筆丸の説明の信憑性を問い直す重要なきっかけになるぞ。読み返し受領簿と合わせて、「受け取っていない」という弁解を検証できる。",
    "choices": [
      {
        "id": "D_C07_E07_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E07_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_LOOKOUT",
    "evidenceId": "EV_C07_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E07_LIMIT_L2",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "ただし、この図一枚だけで嘘や不在を断定しちゃいけない。目線の違いはあくまで現場での検証と合わせる必要があるな。",
    "choices": [
      {
        "id": "D_C07_E07_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E07",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_LOOKOUT",
    "evidenceId": "EV_C07_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E07_RECORDED",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「筆丸の見晴らしの写生」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C07_E07_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C07_E07",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E07_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C07_07",
    "locationId": "LOC_KYO_LOOKOUT",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E08",
    "caseId": "C07",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "物語の早い段階から公開されていた掲示だ。「米も杵も、それぞれの里のもの。余れば回し、足りなければ分ける。京は預かり、取り上げず」――当初から各地にその写しが配られている。",
    "choices": [
      {
        "id": "D_C07_E08_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C07_E08_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C07_08"
          }
        ]
      },
      {
        "id": "D_C07_E08_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C07_E08_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E08_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C07_E08_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E08_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SHRINE_CHARTER",
    "evidenceId": "EV_C07_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E08_QUOTE",
    "caseId": "C07",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "竹次の添え書きがある。「京に集まることも、里でつくことも、自分たちで選べる。そのための約束なんだ。ひとつにまとめるなら、みんなの本物の返事が要る。」",
    "choices": [
      {
        "id": "D_C07_E08_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E08",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TAKEJI",
    "locationId": "LOC_SHRINE_CHARTER",
    "evidenceId": "EV_C07_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E08_LIMIT",
    "caseId": "C07",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "互いに協力することと、地方の餅つきを強制的に廃止することの決定的な違いが示されている。この世界の根本の約束は、終盤になって都合よく後出しされたものじゃないんだな。",
    "choices": [
      {
        "id": "D_C07_E08_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E08_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SHRINE_CHARTER",
    "evidenceId": "EV_C07_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E08_LIMIT_L2",
    "caseId": "C07",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "とはいえ、この約束があるからといって、あらゆる変更の提案を禁じたり、それだけで筆丸を有罪にしたりできるわけじゃないぞ。",
    "choices": [
      {
        "id": "D_C07_E08_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E08",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SHRINE_CHARTER",
    "evidenceId": "EV_C07_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E08_RECORDED",
    "caseId": "C07",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_08"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「竹隠れのもち寄りの約束」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C07_E08_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C07_E08",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E08_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C07_08",
    "locationId": "LOC_SHRINE_CHARTER",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E09",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C01"
        },
        {
          "op": "caseSolved",
          "id": "C02"
        },
        {
          "op": "caseSolved",
          "id": "C03"
        },
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "caseSolved",
          "id": "C05"
        },
        {
          "op": "caseSolved",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "提出された六つの主張と、それぞれの確定した記録がずらりと並んでいる。元の文を消さずに、その後の経緯を左右で読み比べることができそうだ。",
    "choices": [
      {
        "id": "D_C07_E09_START",
        "labelJa": "検分を始める",
        "nextId": "D_C07_E09_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "playEvidenceReconstruction",
          "evidenceId": "EV_C07_09",
          "sourceEvent": "EVT_C07"
        }
      },
      {
        "id": "D_C07_E09_RECON_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "evidenceId": "EV_C07_09",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E09_OBSERVE",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C01"
        },
        {
          "op": "caseSolved",
          "id": "C02"
        },
        {
          "op": "caseSolved",
          "id": "C03"
        },
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "caseSolved",
          "id": "C05"
        },
        {
          "op": "caseSolved",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "六件の確定事項、当初の相談、解決後の返事、そして筆丸の提出本を机に並べて見比べる。",
    "choices": [
      {
        "id": "D_C07_E09_OBSERVE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E09_OBSERVE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "evidenceId": "EV_C07_09",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E09_OBSERVE_L2",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C01"
        },
        {
          "op": "caseSolved",
          "id": "C02"
        },
        {
          "op": "caseSolved",
          "id": "C03"
        },
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "caseSolved",
          "id": "C05"
        },
        {
          "op": "caseSolved",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "初めの困り事自体は本物のまま残しながら、「現在も未解決」という新しい見出しと、抜け落ちた続きが結論をどう歪めているかを確かめる。なお、預かり米の三便と蔵町の市の不正取引を混同してはならない。",
    "choices": [
      {
        "id": "D_C07_E09_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C07_E09_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C01"
            },
            {
              "op": "caseSolved",
              "id": "C02"
            },
            {
              "op": "caseSolved",
              "id": "C03"
            },
            {
              "op": "caseSolved",
              "id": "C04"
            },
            {
              "op": "caseSolved",
              "id": "C05"
            },
            {
              "op": "caseSolved",
              "id": "C06"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C07_09"
          }
        ]
      },
      {
        "id": "D_C07_E09_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C07_E09_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E09_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C07_E09_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E09_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "evidenceId": "EV_C07_09",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E09_QUOTE",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C01"
        },
        {
          "op": "caseSolved",
          "id": "C02"
        },
        {
          "op": "caseSolved",
          "id": "C03"
        },
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "caseSolved",
          "id": "C05"
        },
        {
          "op": "caseSolved",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "直記の添え書きがある。「『困った』という言葉を消してはなりません。『助かった』という返事も消してはなりません。まずは、それぞれがいつの時点の話なのかを元に戻しましょう。」",
    "choices": [
      {
        "id": "D_C07_E09_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E09_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_NAOKI",
    "locationId": "LOC_KYO_ARCHIVE",
    "evidenceId": "EV_C07_09",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E09_LIMIT",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C01"
        },
        {
          "op": "caseSolved",
          "id": "C02"
        },
        {
          "op": "caseSolved",
          "id": "C03"
        },
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "caseSolved",
          "id": "C05"
        },
        {
          "op": "caseSolved",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "それぞれ異なる誤りが、どれも「一つ臼」の主張を強める方向ばかりに選び取られている。来歴と当時の知識を合わせて、故意の主張を評価する材料になるな。",
    "choices": [
      {
        "id": "D_C07_E09_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E09_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "evidenceId": "EV_C07_09",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E09_LIMIT_L2",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C01"
        },
        {
          "op": "caseSolved",
          "id": "C02"
        },
        {
          "op": "caseSolved",
          "id": "C03"
        },
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "caseSolved",
          "id": "C05"
        },
        {
          "op": "caseSolved",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "もっとも、結果が都合よく揃っているというだけで計画性を断定せず、受領・清書・提出の証拠と併用する必要があるぞ。",
    "choices": [
      {
        "id": "D_C07_E09_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E09_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "evidenceId": "EV_C07_09",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E09_RECORDED",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_09"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「原本と要約の対照台」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C07_E09_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C07_E09",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E09_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C07_09",
    "locationId": "LOC_KYO_ARCHIVE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E10",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "祭暦の固定された同じ刻限に、筆丸が訂正の要旨を読み返したことを直記と羽文が記録した控えだ。各地の景色の昼夜の違いではなく、出来事が起きた順序を正確に記した記録である。",
    "choices": [
      {
        "id": "D_C07_E10_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C07_E10_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C04"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C07_10"
          }
        ]
      },
      {
        "id": "D_C07_E10_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C07_E10_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E10_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C07_E10_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E10_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_INTAKE",
    "evidenceId": "EV_C07_10",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E10_QUOTE",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "直記の添え書きがある。「『送り火の刻』と記したのは、出来事の前後関係をそろえるためです。空の明るさを、別の里の時刻と見比べたわけではありません。」",
    "choices": [
      {
        "id": "D_C07_E10_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E10",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_NAOKI",
    "locationId": "LOC_KYO_INTAKE",
    "evidenceId": "EV_C07_10",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E10_LIMIT",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「受取の時刻にはそこにいなかった」という筆丸の弁解に対し、直接かつ独立した反証を突きつける記録だ。",
    "choices": [
      {
        "id": "D_C07_E10_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E10_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_INTAKE",
    "evidenceId": "EV_C07_10",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E10_LIMIT_L2",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "なお、通常の京における演出上の144秒周期を、史実の時計として使った資料じゃないぞ。",
    "choices": [
      {
        "id": "D_C07_E10_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E10",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_INTAKE",
    "evidenceId": "EV_C07_10",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E10_RECORDED",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_10"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「送り火の刻の立会い記録」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C07_E10_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C07_E10",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E10_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C07_10",
    "locationId": "LOC_KYO_INTAKE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C03_E08",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_02"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "不足分の二杯を標準枡で補い、俵太・受取人・立会秤係の三者が確認した二つ折り札だ。左欄は当初の「十杯買った米が、受取先の標準枡で八杯しかない」、右欄は上げ底の判明と二杯の補填が記されている。",
    "choices": [
      {
        "id": "D_C03_E08_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_E08_L2",
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "playEvidenceReconstruction",
          "evidenceId": "EV_C03_08",
          "sourceEvent": "EVT_C03"
        }
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_SCALE",
    "evidenceId": "EV_C03_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E08_L2",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_02"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "右下の「不足二杯、受取済」の墨が乾ききる前に折り畳まれたため、向かいの左欄の余白に左右反転した写りが残っている。原票は筆丸が受け取り、手帖と立会人のもとには両欄の控えが残された。",
    "choices": [
      {
        "id": "D_C03_E08_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C03_E08_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseAccepted",
              "id": "C03"
            },
            {
              "op": "hasInference",
              "id": "INF_C03_02"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C03_08"
          }
        ]
      },
      {
        "id": "D_C03_E08_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C03_E08_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E08_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C03_E08_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E08_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_SCALE",
    "evidenceId": "EV_C03_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E08_QUOTE",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_02"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "俵太の添え書きがある。「二杯、標準の枡で確かに受け取りました。足りなかったことも、返してもらったことも、両方書いておきます。疑われて待たされた仕事まで、帳面からなかったことにはしないでください。」",
    "choices": [
      {
        "id": "D_C03_E08_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E08",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_TAWARATA",
    "locationId": "LOC_MARKET_SCALE",
    "evidenceId": "EV_C03_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E08_LIMIT",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "不足は現実に起きており、解決後にきちんと補填された。元の相談を取り消すのではなく、結果を同じ見開きに書き加えたことが確認できる。",
    "choices": [
      {
        "id": "D_C03_E08_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_E08_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_SCALE",
    "evidenceId": "EV_C03_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E08_LIMIT_L2",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        },
        {
          "op": "hasInference",
          "id": "INF_C03_02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "ただし、不足を補ったからといって最初の不正が消えるわけじゃない。二杯を返しただけで、待たされた手間や運び手が背負った疑いまでなかったことにはできないな。",
    "choices": [
      {
        "id": "D_C03_E08_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C03_E08",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_SCALE",
    "evidenceId": "EV_C03_08",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C03_E08_RECORDED",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「相談と補填がそろった米の見開き」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C03_E08_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C03_E08",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_E08_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C03_08",
    "locationId": "LOC_MARKET_SCALE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E11",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "最終提出の前、筆丸は「A17・B08・C10は同じ荷の保管交代であり、出荷は合計三十俵」「署名片は各里の餅つき継続の祈願」と声に出して読み返していた。羽文と直記がそれぞれ別の控えに記録している。",
    "choices": [
      {
        "id": "D_C07_E11_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C07_E11_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C04"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C07_11"
          }
        ]
      },
      {
        "id": "D_C07_E11_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C07_E11_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E11_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C07_E11_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E11_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_INTAKE",
    "evidenceId": "EV_C07_11",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E11_QUOTE",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "直記の添え書きがある。「提出の前、その二点も確かに確認しました。『札が増えても米は増えない』『祈願は取消ではない』――紛れもなく、筆丸どのがご自身で読まれた言葉です。」",
    "choices": [
      {
        "id": "D_C07_E11_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E11",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "sourceSpeakerNpcId": "NPC_NAOKI",
    "locationId": "LOC_KYO_INTAKE",
    "evidenceId": "EV_C07_11",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E11_LIMIT",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "預かり米と祈願票の結論を裁判のあとで知ったわけじゃない。申し立てを出す前から、元の伝票と署名の目的を正しく理解していたことが分かるな。",
    "choices": [
      {
        "id": "D_C07_E11_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E11_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_INTAKE",
    "evidenceId": "EV_C07_11",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E11_LIMIT_L2",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "後の判決そのものを、それ以前の本人の知識を示す証拠として使っちゃいけないぞ。",
    "choices": [
      {
        "id": "D_C07_E11_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E11",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_INTAKE",
    "evidenceId": "EV_C07_11",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "locationBinding": "fixed_evidence_anchor"
  },
  {
    "id": "D_C07_E11_RECORDED",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_11"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「預替と祈願の事前確認控え」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C07_E11_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C07_E11",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E11_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "evidenceId": "EV_C07_11",
    "locationId": "LOC_KYO_INTAKE",
    "entryPolicy": "after_explicit_record_or_notebook_reread",
    "locationBinding": "fixed_evidence_anchor",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_INF_C01_01_OPEN",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_05"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "祝い杵は、なぜ棚からなくなったんだろう？",
    "choices": [
      {
        "id": "D_INF_C01_01_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C01_01"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C01_01"
        }
      },
      {
        "id": "D_INF_C01_01_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C01_01_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C01_01_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C01_01",
    "inferenceStage": "field",
    "entryPolicy": "notebook_challenge",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_INF_C01_01_HINT_1",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "棚から消えた「祝いの杵」と、今臼の前で動かしている「普段の杵」を分けて考えてみよう。",
    "choices": [
      {
        "id": "D_INF_C01_01_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C01_01_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C01_01_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C01_01",
    "hintLevel": 1,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C01_01_HINT_2",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "宿の乾燥棚にある品と、昨夜拾われた木片を見比べてみよう。",
    "choices": [
      {
        "id": "D_INF_C01_01_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C01_01_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C01_01_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C01_01",
    "hintLevel": 2,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C01_01_HINT_3",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「三つ又の木片」「修理半券」「修理中の祝い杵」――この三つを組み合わせよう。",
    "choices": [
      {
        "id": "D_INF_C01_01_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C01_01",
    "hintLevel": 3,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C02_01_OPEN",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C02_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C02_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C02_03"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "橋の上の白い綱は、横綱が渡った証拠といえるかな？",
    "choices": [
      {
        "id": "D_INF_C02_01_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C02_01"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C02_01"
        }
      },
      {
        "id": "D_INF_C02_01_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C02_01_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C02_01_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C02_01",
    "inferenceStage": "field",
    "entryPolicy": "notebook_challenge",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_INF_C02_01_HINT_1",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "鳴吉が目撃したのは本人の「顔」だったか、それとも「持ち物」だったか。",
    "choices": [
      {
        "id": "D_INF_C02_01_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C02_01_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C02_01_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C02_01",
    "hintLevel": 1,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C02_01_HINT_2",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "茶屋で、白い綱を誰が誰に貸したのか記録を確かめよう。",
    "choices": [
      {
        "id": "D_INF_C02_01_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C02_01_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C02_01_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C02_01",
    "hintLevel": 2,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C02_01_HINT_3",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「目撃証言」「名入り綱」「茶屋の貸与記録」――この三つを合わせよう。",
    "choices": [
      {
        "id": "D_INF_C02_01_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C02_01",
    "hintLevel": 3,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C02_02_OPEN",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C02_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C02_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C02_07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "芦ノ山に、いったい何が起きたんだろう？",
    "choices": [
      {
        "id": "D_INF_C02_02_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C02_02"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C02_02"
        }
      },
      {
        "id": "D_INF_C02_02_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C02_02_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C02_02_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C02_02",
    "inferenceStage": "field",
    "entryPolicy": "notebook_challenge",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_INF_C02_02_HINT_1",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "まずは本人が無事かどうか、自分の意思で動ける状態かを確かめよう。",
    "choices": [
      {
        "id": "D_INF_C02_02_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C02_02_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C02_02_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C02_02",
    "hintLevel": 1,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C02_02_HINT_2",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "稽古の場所は棚田だ。書置きの裏か、鈴菜の稽古帳に手掛かりがあるぞ。",
    "choices": [
      {
        "id": "D_INF_C02_02_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C02_02_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C02_02_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C02_02",
    "hintLevel": 2,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C02_02_HINT_3",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「本人の確認」に「名入り綱」「貸与控え」を合わせて、二つの疑問に答えを出そう。",
    "choices": [
      {
        "id": "D_INF_C02_02_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C02_02",
    "hintLevel": 3,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C03_01_OPEN",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "十杯が八杯に減ったのは、どの段階だろう？",
    "choices": [
      {
        "id": "D_INF_C03_01_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C03_01"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C03_01"
        }
      },
      {
        "id": "D_INF_C03_01_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C03_01_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C03_01_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C03_01",
    "inferenceStage": "field",
    "entryPolicy": "notebook_challenge",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_INF_C03_01_HINT_1",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "荷渡し前の札には、杯数の答えは直接書かれていない。秤の目盛りをよく読もう。",
    "choices": [
      {
        "id": "D_INF_C03_01_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C03_01_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C03_01_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C03_01",
    "hintLevel": 1,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C03_01_HINT_2",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "同じ米を標準桝で一杯、同じ秤に載せると十目になる。袋の重さはすでに引かれているぞ。",
    "choices": [
      {
        "id": "D_INF_C03_01_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C03_01_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C03_01_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C03_01",
    "hintLevel": 2,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C03_01_HINT_3",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「名入り桝」「比較実演」「出発前の秤札」を組み合わせよう。八十目を一杯の十目で割れば、渡された時点で八杯だったと分かる。",
    "choices": [
      {
        "id": "D_INF_C03_01_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C03_01",
    "hintLevel": 3,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C03_02_OPEN",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_03"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "誰の、どの行為まで証明できるだろう？",
    "choices": [
      {
        "id": "D_INF_C03_02_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C03_02"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C03_02"
        }
      },
      {
        "id": "D_INF_C03_02_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C03_02_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C03_02_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C03_02",
    "inferenceStage": "field",
    "entryPolicy": "notebook_challenge",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_INF_C03_02_HINT_1",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "今ある枡が、まさに「あの取引」に使われたことを示す記録を探そう。",
    "choices": [
      {
        "id": "D_INF_C03_02_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C03_02_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C03_02_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C03_02",
    "hintLevel": 1,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C03_02_HINT_2",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "焼印、縁の欠け、釘頭の図が一致するかを比べよう。",
    "choices": [
      {
        "id": "D_INF_C03_02_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C03_02_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C03_02_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C03_02",
    "hintLevel": 2,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C03_02_HINT_3",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「比較実演」「秤札」「合わせ板控え」「使用引渡記録」「控え米」をまとめて提示しよう。秤の生の数値と、その換算をセットで示すのが鍵だ。",
    "choices": [
      {
        "id": "D_INF_C03_02_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C03_02",
    "hintLevel": 3,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C04_01_OPEN",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C04_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C04_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C04_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C04_04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "晴れた日に、どうして手紙の一行が隠れてしまったんだろう？",
    "choices": [
      {
        "id": "D_INF_C04_01_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C04_01"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C04_01"
        }
      },
      {
        "id": "D_INF_C04_01_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C04_01_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C04_01_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C04_01",
    "inferenceStage": "field",
    "entryPolicy": "notebook_challenge",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_INF_C04_01_HINT_1",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "その場の天気と、紙の折り方を切り分けて調べてみよう。",
    "choices": [
      {
        "id": "D_INF_C04_01_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C04_01_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C04_01_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C04_01",
    "hintLevel": 1,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C04_01_HINT_2",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "楓峡にある同じ紙と米糊を使って、原本を濡らさずに試してみよう。",
    "choices": [
      {
        "id": "D_INF_C04_01_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C04_01_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C04_01_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C04_01",
    "hintLevel": 2,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C04_01_HINT_3",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「閉じた手紙」「天気雨」「米糊試料」「開いた全文」の四つが必要だ。",
    "choices": [
      {
        "id": "D_INF_C04_01_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C04_01",
    "hintLevel": 3,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C04_02_OPEN",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C04_04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C04_05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C04_06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "葛葉は、本来なにを頼んでいたんだろう？",
    "choices": [
      {
        "id": "D_INF_C04_02_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C04_02"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C04_02"
        }
      },
      {
        "id": "D_INF_C04_02_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C04_02_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C04_02_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C04_02",
    "inferenceStage": "field",
    "entryPolicy": "notebook_challenge",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_INF_C04_02_HINT_1",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "葛葉ひとりの欠席と、里全体の意向を分けて考えよう。",
    "choices": [
      {
        "id": "D_INF_C04_02_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C04_02_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C04_02_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C04_02",
    "hintLevel": 1,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C04_02_HINT_2",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「後から書き加えたのだろう」という疑いを、桃源郷の控えで確かめよう。",
    "choices": [
      {
        "id": "D_INF_C04_02_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C04_02_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C04_02_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C04_02",
    "hintLevel": 2,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C04_02_HINT_3",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「開いた全文」「桃源郷の控え」「小雨への手渡し控え」の三つを比べよう。",
    "choices": [
      {
        "id": "D_INF_C04_02_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C04_02",
    "hintLevel": 3,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C05_01_OPEN",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_12"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "A17の十二俵は、いったい何度出荷されたんだろう？",
    "choices": [
      {
        "id": "D_INF_C05_01_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C05_01"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C05_01"
        }
      },
      {
        "id": "D_INF_C05_01_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C05_01_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C05_01_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C05_01",
    "inferenceStage": "field",
    "entryPolicy": "notebook_challenge",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_INF_C05_01_HINT_1",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "発行された「札の数」と、実際の「物の数」を分けて考えよう。",
    "choices": [
      {
        "id": "D_INF_C05_01_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C05_01_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C05_01_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C05_01",
    "hintLevel": 1,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C05_01_HINT_2",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "通し番号「A17-01〜12」と、預替番号「R17」の繋がりを追ってみよう。",
    "choices": [
      {
        "id": "D_INF_C05_01_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C05_01_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C05_01_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C05_01",
    "hintLevel": 2,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C05_01_HINT_3",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「棚田発送」「海風預替」「竜宮受取」「現物照合」「預替見本」――この五つをつなごう。",
    "choices": [
      {
        "id": "D_INF_C05_01_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C05_01",
    "hintLevel": 3,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C05_02_OPEN",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_08"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_09"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_10"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_11"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_12"
        },
        {
          "op": "flagEquals",
          "id": "trialActive",
          "value": "TR_C05"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "三便三十俵に、本当に不足はあるんだろうか？",
    "choices": [
      {
        "id": "D_INF_C05_02_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C05_02"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C05_02"
        }
      },
      {
        "id": "D_INF_C05_02_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C05_02_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C05_02_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C05_02",
    "inferenceStage": "court",
    "entryPolicy": "court_notebook_challenge",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_INF_C05_02_HINT_1",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "A17だけでなく、B08とC10も同じやり方で辿ってみよう。",
    "choices": [
      {
        "id": "D_INF_C05_02_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C05_02_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C05_02_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C05_02",
    "hintLevel": 1,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "court"
  },
  {
    "id": "D_INF_C05_02_HINT_2",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "各便の通し番号と、前の預かりが閉じられた印を確かめよう。",
    "choices": [
      {
        "id": "D_INF_C05_02_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C05_02_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C05_02_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C05_02",
    "hintLevel": 2,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "court"
  },
  {
    "id": "D_INF_C05_02_HINT_3",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "12・8・10の三本の経路を一本ずつ結び、実物30俵と帳簿60俵の食い違いを説明しよう。",
    "choices": [
      {
        "id": "D_INF_C05_02_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C05_02",
    "hintLevel": 3,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "court"
  },
  {
    "id": "D_INF_C06_01_OPEN",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_08"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "本物の署名は、祭の取りやめへの同意を示しているんだろうか？",
    "choices": [
      {
        "id": "D_INF_C06_01_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C06_01"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C06_01"
        }
      },
      {
        "id": "D_INF_C06_01_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C06_01_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C06_01_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C06_01",
    "inferenceStage": "field",
    "entryPolicy": "notebook_challenge",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_INF_C06_01_HINT_1",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「名前が本物か」と「何の上に署名したか」を切り分けて考えよう。",
    "choices": [
      {
        "id": "D_INF_C06_01_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C06_01_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C06_01_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C06_01",
    "hintLevel": 1,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C06_01_HINT_2",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "上段・下段・右の本人控えという三分割の構造を、見本票で確かめよう。",
    "choices": [
      {
        "id": "D_INF_C06_01_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C06_01_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C06_01_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C06_01",
    "hintLevel": 2,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C06_01_HINT_3",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「連名書」「実演」「寺の上段」「二人の控え」「接続照合」を揃えて提示しよう。",
    "choices": [
      {
        "id": "D_INF_C06_01_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C06_01",
    "hintLevel": 3,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C06_02_OPEN",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_08"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_09"
        },
        {
          "op": "flagEquals",
          "id": "trialActive",
          "value": "TR_C06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「お寺が取消の署名を集めた」という説明は成り立つかな？",
    "choices": [
      {
        "id": "D_INF_C06_02_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C06_02"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C06_02"
        }
      },
      {
        "id": "D_INF_C06_02_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C06_02_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C06_02_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C06_02",
    "inferenceStage": "court",
    "entryPolicy": "court_notebook_challenge",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_INF_C06_02_HINT_1",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "お寺から送り出される前と、送り出された後の紙の姿を分けよう。",
    "choices": [
      {
        "id": "D_INF_C06_02_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C06_02_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C06_02_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C06_02",
    "hintLevel": 1,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "court"
  },
  {
    "id": "D_INF_C06_02_HINT_2",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "使いの羽文は、何を、どんな用途の荷として受け取ったんだろう？",
    "choices": [
      {
        "id": "D_INF_C06_02_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C06_02_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C06_02_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C06_02",
    "hintLevel": 2,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "court"
  },
  {
    "id": "D_INF_C06_02_HINT_3",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「寺の上段」「紙継ぎ見本」「受渡控え」「接続照合」「版下」の五つが揃えば、前後の経緯がはっきりするぞ。",
    "choices": [
      {
        "id": "D_INF_C06_02_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C06_02",
    "hintLevel": 3,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "court"
  },
  {
    "id": "D_INF_C07_01_OPEN",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_10"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "送り火の写生から、どこまでのことが分かるだろう？",
    "choices": [
      {
        "id": "D_INF_C07_01_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C07_01"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C07_01"
        }
      },
      {
        "id": "D_INF_C07_01_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C07_01_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C07_01_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C07_01",
    "inferenceStage": "field",
    "entryPolicy": "notebook_challenge",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_INF_C07_01_HINT_1",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "絵は写真と違って記憶で描くこともできる。何が直接の証拠になるかを切り分けよう。",
    "choices": [
      {
        "id": "D_INF_C07_01_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C07_01_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C07_01_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C07_01",
    "hintLevel": 1,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C07_01_HINT_2",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "三地点での再現観察と、受取刻の立会い記録を突き合わせてみよう。",
    "choices": [
      {
        "id": "D_INF_C07_01_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C07_01_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C07_01_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C07_01",
    "hintLevel": 2,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C07_01_HINT_3",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「送り火観察」「見晴らしの写生」「立会い記録」を選び、視点の食い違いだけでは断定できないと説明しよう。",
    "choices": [
      {
        "id": "D_INF_C07_01_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C07_01",
    "hintLevel": 3,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C07_02_OPEN",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C04_07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_10"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_11"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "訂正と元資料の本当の意味は、筆丸に伝わっていなかったんだろうか？",
    "choices": [
      {
        "id": "D_INF_C07_02_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C07_02"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C07_02"
        }
      },
      {
        "id": "D_INF_C07_02_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C07_02_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C07_02_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C07_02",
    "inferenceStage": "field",
    "entryPolicy": "notebook_challenge",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_INF_C07_02_HINT_1",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「紙を受け取ること」と「中身を読んで理解すること」を分けて考えよう。",
    "choices": [
      {
        "id": "D_INF_C07_02_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C07_02_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C07_02_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C07_02",
    "hintLevel": 1,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C07_02_HINT_2",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "初日の出と伏見の訂正控えには、筆丸自身が要旨を読み返した言葉が残っているぞ。",
    "choices": [
      {
        "id": "D_INF_C07_02_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C07_02_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C07_02_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C07_02",
    "hintLevel": 2,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C07_02_HINT_3",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「祝い杵の訂正」「婚礼の手紙の訂正」「全訂正受領簿」「立会い記録」の四つを揃えよう。",
    "choices": [
      {
        "id": "D_INF_C07_02_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C07_02",
    "hintLevel": 3,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "field"
  },
  {
    "id": "D_INF_C07_03_OPEN",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_09"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_10"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_11"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_12"
        },
        {
          "op": "flagEquals",
          "id": "trialActive",
          "value": "TR_C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "誰の、どんな行為がこの大きな謎の答えなんだろう？",
    "choices": [
      {
        "id": "D_INF_C07_03_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C07_03"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C07_03"
        }
      },
      {
        "id": "D_INF_C07_03_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C07_03_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C07_03_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C07_03",
    "inferenceStage": "court",
    "entryPolicy": "court_notebook_challenge",
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_INF_C07_03_HINT_1",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「当初の相談が真実だったこと」と「提出時にも未解決だったこと」は別問題だ。",
    "choices": [
      {
        "id": "D_INF_C07_03_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C07_03_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C07_03_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C07_03",
    "hintLevel": 1,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "court"
  },
  {
    "id": "D_INF_C07_03_HINT_2",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「完成見開き → 読み返し → 左欄の抜粋 →『現在も未解決』の見出し → 提出」という一本の線をつなごう。",
    "choices": [
      {
        "id": "D_INF_C07_03_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C07_03_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C07_03_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C07_03",
    "hintLevel": 2,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "court"
  },
  {
    "id": "D_INF_C07_03_HINT_3",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "墨の物証だけにも、人柄や集約案への好き嫌いにも頼らず、原票の対応・受領・割付・綴じ・受付をすべて合わせよう。",
    "choices": [
      {
        "id": "D_INF_C07_03_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "inferenceId": "INF_C07_03",
    "hintLevel": 3,
    "entryPolicy": "explicit_hint_request",
    "locationBinding": "resolved_single_npc",
    "inferenceStage": "court"
  },
  {
    "id": "D_FEEDBACK_OWNER_WEARER",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "名札が教えてくれるのは「持ち主」が誰かということだけ。あの場でそれを身につけていた人まで同じとは限らないぞ。",
    "choices": [
      {
        "id": "D_FEEDBACK_OWNER_WEARER_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_OWNER_WEARER_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "feedbackCode": "OWNER_WEARER",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_PICKER_BREAKER",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "木片を拾ったからといって、その人が折った犯人だとは限らない。いつ折れたのか、その前後の現物を確かめてからにしよう。",
    "choices": [
      {
        "id": "D_FEEDBACK_PICKER_BREAKER_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_PICKER_BREAKER_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "feedbackCode": "PICKER_BREAKER",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_SEALED_BAG",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "袋の封が切られていなくても、そもそも袋へ詰める前から量が少なかったのかもしれない。荷を渡す前の計量記録を見てみよう。",
    "choices": [
      {
        "id": "D_FEEDBACK_SEALED_BAG_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_SEALED_BAG_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "feedbackCode": "SEALED_BAG",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_WRONG_TRADE",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "同じ町の米でも、市の十杯売りと三十俵の三便はまったく別の取引だ。取引番号と単位をそろえて見直そう。",
    "choices": [
      {
        "id": "D_FEEDBACK_WRONG_TRADE_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_WRONG_TRADE_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "feedbackCode": "WRONG_TRADE",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_SUN_NO_RAIN",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "空が晴れているのに、そこだけ雨が降る――そんなことは珍しくない。この手紙がどこでどう濡れたのか、確かめてみよう。",
    "choices": [
      {
        "id": "D_FEEDBACK_SUN_NO_RAIN_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_SUN_NO_RAIN_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "feedbackCode": "SUN_NO_RAIN",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_REFUSAL_SCOPE",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "本人が京へ行けないことと、里のみんなが祭をやめることは別の話だ。誰について書いた一文なのか、折り目の続きを読んでみよう。",
    "choices": [
      {
        "id": "D_FEEDBACK_REFUSAL_SCOPE_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_REFUSAL_SCOPE_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "feedbackCode": "REFUSAL_SCOPE",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_COUNT_IS_IDENTITY",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "数が同じだからといって、同じ荷が二つあるわけじゃない。通し番号と送り先が一本につながる札を選ぼう。",
    "choices": [
      {
        "id": "D_FEEDBACK_COUNT_IS_IDENTITY_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_COUNT_IS_IDENTITY_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "feedbackCode": "COUNT_IS_IDENTITY",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_RECEIPT_IS_CREATION",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "受取札が一枚増えたからって、米がもう一山湧いて出るわけじゃない。前の預かりがちゃんと閉じられているか確かめよう。",
    "choices": [
      {
        "id": "D_FEEDBACK_RECEIPT_IS_CREATION_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_RECEIPT_IS_CREATION_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "feedbackCode": "RECEIPT_IS_CREATION",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_SIGNATURE_IS_CONSENT",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "署名が本人のものだとしても、今の見出しに頷いた証拠にはならない。署名したとき、その上に何が書かれていたのかを戻してみよう。",
    "choices": [
      {
        "id": "D_FEEDBACK_SIGNATURE_IS_CONSENT_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_SIGNATURE_IS_CONSENT_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "feedbackCode": "SIGNATURE_IS_CONSENT",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_HANDWRITING_ONLY",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "字が似ているというだけで、誰がその束を提出したかまでは決められない。番号、綴じ方、受渡しの記録を合わせて辿ってみよう。",
    "choices": [
      {
        "id": "D_FEEDBACK_HANDWRITING_ONLY_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_HANDWRITING_ONLY_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "feedbackCode": "HANDWRITING_ONLY",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_VIEWPOINT_IS_GUILT",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "写生と実際の景色の食い違いは、話を確かめ直すきっかけにはなる。ただ、それだけで提出した人や悪意を決めつけるわけにはいかないな。",
    "choices": [
      {
        "id": "D_FEEDBACK_VIEWPOINT_IS_GUILT_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_VIEWPOINT_IS_GUILT_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "feedbackCode": "VIEWPOINT_IS_GUILT",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_MOTIVE_IS_PROOF",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "祭をまとめたい気持ちと、実際にどの文を切り落としたかは別の話だ。主張を支える受領と提出の記録を示そう。",
    "choices": [
      {
        "id": "D_FEEDBACK_MOTIVE_IS_PROOF_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_MOTIVE_IS_PROOF_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "feedbackCode": "MOTIVE_IS_PROOF",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_NOT_ENOUGH_EVIDENCE",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "選んだ資料だけでは、この主張の途中がまだつながっていない。何が足りていないのか、手帖で見直してみよう。",
    "choices": [
      {
        "id": "D_FEEDBACK_NOT_ENOUGH_EVIDENCE_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_NOT_ENOUGH_EVIDENCE_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "feedbackCode": "NOT_ENOUGH_EVIDENCE",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_EARLY_COMPLETION",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "頼み事を引き受けることと、結論をみんなに伝えることは別の手順だ。頼まれた相手のもとへ戻って、確かめた事実を報告しよう。",
    "choices": [
      {
        "id": "D_FEEDBACK_EARLY_COMPLETION_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_EARLY_COMPLETION_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "feedbackCode": "EARLY_COMPLETION",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_C01_SCENE_LETTER",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C01_07"
        }
      ]
    },
    "speakerJa": "杵吉",
    "textJa": "あれは確かに私が書いた。祝いの一搗き役を、今年から返上するっていう返事さ。普段の餅つきまで投げ出すなんて、ひと言も書いたつもりはないよ。",
    "choices": [
      {
        "id": "D_C01_SCENE_LETTER_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_SCENE_LETTER_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic",
    "stageDirectionJa": "杵を振る手を止め、棚の書付へ目を向ける。答えを急がせない。"
  },
  {
    "id": "D_C01_SCENE_LETTER_L2",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C01_07"
        }
      ]
    },
    "speakerJa": "杵吉",
    "textJa": "断るのに、いちいち立派な理由が要るのかい。……その前に、まずは「断りの返事」として受け取ってもらえるのか、確かめておきたいね。",
    "choices": [
      {
        "id": "D_C01_SCENE_LETTER_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_KINEKICHI_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_SCENE_LETTER_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C01_SCENE_OLD_DEBT",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "杵吉",
    "textJa": "前の修理代は、皆で決めた額があるんだ。ただ、「祭の会計が片づいたら払うから」って言って、ずっと待ってもらっていたんだよな。",
    "choices": [
      {
        "id": "D_C01_SCENE_OLD_DEBT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_SCENE_OLD_DEBT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C01_SCENE_OLD_DEBT_L2",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "杵吉",
    "textJa": "また頼めばいいって軽く考えてたんだ。代金を払って仕事を頼む話を、いつの間にか「里を思う気持ち」の話にすり替えてたんだな。",
    "choices": [
      {
        "id": "D_C01_SCENE_OLD_DEBT_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_KINEKICHI_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_SCENE_OLD_DEBT_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C01_SCENE_PARTNER",
    "caseId": "C01",
    "npcId": "NPC_KAEKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "返吉",
    "textJa": "そりゃ困るよ。長いあいだ、同じ呼吸で餅を返してきたんだからね。でも、「相棒が困るから」を休めない理由にしちまったら、あいつは何も相談できなくなる。",
    "choices": [
      {
        "id": "D_C01_SCENE_PARTNER_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_SCENE_PARTNER_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C01_SCENE_PARTNER_L2",
    "caseId": "C01",
    "npcId": "NPC_KAEKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "返吉",
    "textJa": "杵を返す相手がいる。一搗き役を返す相手もいる。同じ「返す」でも、受け取る意味がまるで違うんだよな。",
    "choices": [
      {
        "id": "D_C01_SCENE_PARTNER_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_KAEKICHI_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_SCENE_PARTNER_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C01_SCENE_REPAIR_PAY",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "継丸",
    "textJa": "前に決まった分の修理代を、まだ待っているんです。ここの仕事が、わたしの暮らしを支えるほとんどすべてなので。",
    "choices": [
      {
        "id": "D_C01_SCENE_REPAIR_PAY_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_SCENE_REPAIR_PAY_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_BENCH",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C01_SCENE_REPAIR_PAY_L2",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "継丸",
    "textJa": "「いつものように頼むよ」って言われると、お代金はいつも後回しなのに、締切だけはしっかり先に来るんです。",
    "choices": [
      {
        "id": "D_C01_SCENE_REPAIR_PAY_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_TSUGUMARU_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_SCENE_REPAIR_PAY_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_BENCH",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C01_SCENE_REPAIR_RESPONSIBILITY",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasInference",
          "id": "INF_C01_01"
        }
      ]
    },
    "speakerJa": "継丸",
    "textJa": "黙って持ち出したのは、わたしです。壊してわざと仕事を作ったと思われたくなくて、誰にも言わず直して戻そうとしました。",
    "choices": [
      {
        "id": "D_C01_SCENE_REPAIR_RESPONSIBILITY_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_SCENE_REPAIR_RESPONSIBILITY_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_BENCH",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic",
    "stageDirectionJa": "締め具を手放す。修理の説明ではなく、相手へ返事をする間を置く。"
  },
  {
    "id": "D_C01_SCENE_REPAIR_RESPONSIBILITY_L2",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasInference",
          "id": "INF_C01_01"
        }
      ]
    },
    "speakerJa": "継丸",
    "textJa": "無断で直した今回の分まで、当然のように払えとは言いません。品物を返すことと、これからの頼み方は、持ち主の方ときちんと話し合います。",
    "choices": [
      {
        "id": "D_C01_SCENE_REPAIR_RESPONSIBILITY_L2_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_SCENE_REPAIR_RESPONSIBILITY_L3",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_BENCH",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C01_SCENE_REPAIR_RESPONSIBILITY_L3",
    "caseId": "C01",
    "npcId": "NPC_TSUGUMARU",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasInference",
          "id": "INF_C01_01"
        }
      ]
    },
    "speakerJa": "継丸",
    "textJa": "ただ……前に約束していただいた分の代金だけは、この謝罪と一緒くたにして消さないでほしいんです。そこだけは、お願いできますか。",
    "choices": [
      {
        "id": "D_C01_SCENE_REPAIR_RESPONSIBILITY_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_TSUGUMARU_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_SCENE_REPAIR_RESPONSIBILITY_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_BENCH",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C01_SCENE_NOTEBOOK",
    "caseId": "C01",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "筆丸",
    "textJa": "左の頁にはご相談を、右の頁には確かめた後の結果を。まだ裏付けのない話を、事実と同じ欄に混ぜないための工夫なんですよ。",
    "choices": [
      {
        "id": "D_C01_SCENE_NOTEBOOK_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_SCENE_NOTEBOOK_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C01_SCENE_NOTEBOOK_L2",
    "caseId": "C01",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "筆丸",
    "textJa": "控えをお預かりするときは、見開きのまま双方で確認します。もっとも、相談を聞いた印というのは、誰かの言い分に賛成した印ではありませんからね。",
    "choices": [
      {
        "id": "D_C01_SCENE_NOTEBOOK_L2_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_SCENE_NOTEBOOK_L3",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C01_SCENE_NOTEBOOK_L3",
    "caseId": "C01",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "筆丸",
    "textJa": "紙は少し余計に掛かりますが、あとから絡まった誤解をほどくより、ずっと安上がりでしょう？",
    "choices": [
      {
        "id": "D_C01_SCENE_NOTEBOOK_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_FUDEM_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_SCENE_NOTEBOOK_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C01_SCENE_HELPFUL_WORK",
    "caseId": "C01",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "筆丸",
    "textJa": "修理代を決める人と、支払う人が違う。荷を受ける人と、運賃を持つ人が違う。間で待たされてばかりの仕事が多すぎるんですよ。",
    "choices": [
      {
        "id": "D_C01_SCENE_HELPFUL_WORK_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_SCENE_HELPFUL_WORK_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C01_SCENE_HELPFUL_WORK_L2",
    "caseId": "C01",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "筆丸",
    "textJa": "共同の会計や運び手がいれば、息をつける方は確かにいます。継丸さんの未払い分を私が整理したのも、そのためでした。",
    "choices": [
      {
        "id": "D_C01_SCENE_HELPFUL_WORK_L2_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_SCENE_HELPFUL_WORK_L3",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C01_SCENE_HELPFUL_WORK_L3",
    "caseId": "C01",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C01"
        }
      ]
    },
    "speakerJa": "筆丸",
    "textJa": "以前から決まっていた修理代と、今回の無断修理の分は、きちんと分けておきましょう。混ぜてしまえば、待つ方も払う方も、また堂々巡りになりますからね。",
    "choices": [
      {
        "id": "D_C01_SCENE_HELPFUL_WORK_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_FUDEM_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_SCENE_HELPFUL_WORK_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C02_SCENE_CALLING",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "鳴吉",
    "textJa": "俺の声であいつが土俵へ出てくると、客席がどっと沸くんだ。その呼び声一本で飯を食ってきた。だから休むって聞いたとき、真っ先に出番表を睨んじまったんだよ。",
    "choices": [
      {
        "id": "D_C02_SCENE_CALLING_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_SCENE_CALLING_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C02_SCENE_CALLING_L2",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "鳴吉",
    "textJa": "無事かどうかを案じるより先に、本番に間に合うかを勘定した。そんな下心を「心配」なんて綺麗な言葉でひとまとめにしたくはねえのさ。",
    "choices": [
      {
        "id": "D_C02_SCENE_CALLING_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_NAKIKICHI_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_SCENE_CALLING_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C02_SCENE_NO_FACE",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C02_01"
        }
      ]
    },
    "speakerJa": "鳴吉",
    "textJa": "見えてやしねえよ。俺が見たのは、白い綱と鹿の背の荷だけだ。そこに芦ノ山の姿を勝手に描き足したのは、俺の頭のほうさ。",
    "choices": [
      {
        "id": "D_C02_SCENE_NO_FACE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_SCENE_NO_FACE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C02_SCENE_NO_FACE_L2",
    "caseId": "C02",
    "npcId": "NPC_NAKIKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C02_01"
        }
      ]
    },
    "speakerJa": "鳴吉",
    "textJa": "声なら遠くまで届く。だが、目まで同じつもりで遠くを見ようとしちゃいけねえな。",
    "choices": [
      {
        "id": "D_C02_SCENE_NO_FACE_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_NAKIKICHI_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_SCENE_NO_FACE_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C02_SCENE_PRIVACY",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "芦ノ山",
    "textJa": "見てのとおり無事だよ。自分の足でここへ来た。鳴吉にはそう伝えてくれ。綱を白足に貸したことも、話してかまわないさ。",
    "choices": [
      {
        "id": "D_C02_SCENE_PRIVACY_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_SCENE_PRIVACY_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic",
    "stageDirectionJa": "稽古盆を隠さない。話し終えたら盆へ視線を戻し、出演の返事を催促しない。"
  },
  {
    "id": "D_C02_SCENE_PRIVACY_L2",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "芦ノ山",
    "textJa": "いつ土俵へ出るかは、まだ決めていない。……もっとも、稽古で白玉を潰してばかりいる話まで、土産話にしなくていいからな。",
    "choices": [
      {
        "id": "D_C02_SCENE_PRIVACY_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_ASHINOYAMA_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_SCENE_PRIVACY_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C02_SCENE_BEGINNER",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "芦ノ山",
    "textJa": "力を出すほうなら、考えずとも体が勝手に動く。だがここでは、その染みついた癖が邪魔をするんだ。丸いものを、丸いまま返す――ただそれだけのはずなんだがな。",
    "choices": [
      {
        "id": "D_C02_SCENE_BEGINNER_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_SCENE_BEGINNER_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C02_SCENE_BEGINNER_L2",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "芦ノ山",
    "textJa": "相手を土俵へ叩きつければ拍手が湧く。だが、餅を潰すと先生は黙り込む。あの沈黙のほうが、わしにはよほどこたえるよ。",
    "choices": [
      {
        "id": "D_C02_SCENE_BEGINNER_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_ASHINOYAMA_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_SCENE_BEGINNER_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C02_SCENE_RETURN",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C02_07"
        }
      ]
    },
    "speakerJa": "芦ノ山",
    "textJa": "桜川には帰るよ。ただ、出番に出るとは言っていない。茶を飲みに戻る者が一人くらいいても、里は困らんだろう。",
    "choices": [
      {
        "id": "D_C02_SCENE_RETURN_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_SCENE_RETURN_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C02_SCENE_RETURN_L2",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C02_07"
        }
      ]
    },
    "speakerJa": "芦ノ山",
    "textJa": "鳴吉には悪いが、今年は呼ぶ名前をひとつ減らしてもらう。次のことは、また次に頼まれたときに考えるさ。",
    "choices": [
      {
        "id": "D_C02_SCENE_RETURN_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_ASHINOYAMA_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_SCENE_RETURN_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C02_SCENE_LOAD",
    "caseId": "C02",
    "npcId": "NPC_SHIROASHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C02_02"
        }
      ]
    },
    "speakerJa": "白足",
    "textJa": "荷の角が鹿さんの背に当たって痛そうだったから、間に綱を巻いたんだ。芦ノ山さんが、快く貸してくれたんだよ。茶屋に控えも残ってる。",
    "choices": [
      {
        "id": "D_C02_SCENE_LOAD_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_SCENE_LOAD_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_TEABENCH",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C02_SCENE_LOAD_L2",
    "caseId": "C02",
    "npcId": "NPC_SHIROASHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C02_02"
        }
      ]
    },
    "speakerJa": "白足",
    "textJa": "立派な綱だから、立派な横綱が乗っているように見えたのかな。僕が運んでいたのは、角の張った荷物だけなんだけどね。",
    "choices": [
      {
        "id": "D_C02_SCENE_LOAD_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_SHIROASHI_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_SCENE_LOAD_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RIVER_TEABENCH",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C02_SCENE_LESSON",
    "caseId": "C02",
    "npcId": "NPC_SUZUNA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "鈴菜",
    "textJa": "ご本人から直々に習いたいと頼まれました。いつ人前でお披露目するかなんて、頼まれていません。だから稽古帳にも、出番の予定は書いていないわ。",
    "choices": [
      {
        "id": "D_C02_SCENE_LESSON_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_SCENE_LESSON_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MOON_TEMPLE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C02_SCENE_LESSON_L2",
    "caseId": "C02",
    "npcId": "NPC_SUZUNA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C02"
        }
      ]
    },
    "speakerJa": "鈴菜",
    "textJa": "少しコツを掴むと、周りの人はすぐ「じゃあ皆の前で」と期待したくなるでしょう。今回は、そういう話を持ち込む前に、まずご本人の気持ちを聞くことにしたの。",
    "choices": [
      {
        "id": "D_C02_SCENE_LESSON_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_SUZUNA_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_SCENE_LESSON_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MOON_TEMPLE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_FAVOR",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "俵太",
    "textJa": "最初の仕事を紹介してくださったのは、あの方なんです。お礼を言うべき相手と、異議を申し立てる相手が同じだと、途端に言葉が喉に詰まってしまいます。",
    "choices": [
      {
        "id": "D_C03_SCENE_FAVOR_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_SCENE_FAVOR_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_FAVOR_L2",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "俵太",
    "textJa": "していただいたご恩は本当です。けれど、だからといって今回の不足まで私のせいにされていい理由にはならないはずです。",
    "choices": [
      {
        "id": "D_C03_SCENE_FAVOR_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_TAWARATA_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_SCENE_FAVOR_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_COVER_SHORTFALL",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "俵太",
    "textJa": "「若い者の失敗は店で持ってやる」と。まるで助けてくださるような優しい言葉なので、断れば私が意地を張っているように聞こえてしまいます。",
    "choices": [
      {
        "id": "D_C03_SCENE_COVER_SHORTFALL_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_SCENE_COVER_SHORTFALL_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_COVER_SHORTFALL_L2",
    "caseId": "C03",
    "npcId": "NPC_TAWARATA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "俵太",
    "textJa": "不足を埋めてもらうだけなら、それで丸く収まるのかもしれません。けれど、明日から誰が私に荷を預けてくれるか――その信用までは戻ってこないんです。",
    "choices": [
      {
        "id": "D_C03_SCENE_COVER_SHORTFALL_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_TAWARATA_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_SCENE_COVER_SHORTFALL_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_COST",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "俵九郎",
    "textJa": "米を運ぶにも、蔵に置いておくにも相応の元手が掛かります。値上げの貼り紙を出せば、「昔はもっと安かった」と文句を言われる。その苦しさは分かっていただきたいのです。",
    "choices": [
      {
        "id": "D_C03_SCENE_COST_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_SCENE_COST_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_COST_L2",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C03"
        }
      ]
    },
    "speakerJa": "俵九郎",
    "textJa": "ただ……今お尋ねなのは、あの袋の米の量でしたな。店の台所事情を並べ立てても、消えた二杯が増えるわけではありませんか。",
    "choices": [
      {
        "id": "D_C03_SCENE_COST_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_TAWARAKURO_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_SCENE_COST_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_TEN_SCOOPS",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_01"
        }
      ]
    },
    "speakerJa": "俵九郎",
    "textJa": "十回すくって量ったことに間違いはありません。店の同じ枡を使いましたから。",
    "choices": [
      {
        "id": "D_C03_SCENE_TEN_SCOOPS_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_SCENE_TEN_SCOOPS_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_TEN_SCOOPS_L2",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_01"
        }
      ]
    },
    "speakerJa": "俵九郎",
    "textJa": "一杯あたりにどれだけ入っていたかも確かめる、と。……ええ。そこまで仰るなら、どうぞその枡をご覧ください。",
    "choices": [
      {
        "id": "D_C03_SCENE_TEN_SCOOPS_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_TAWARAKURO_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_SCENE_TEN_SCOOPS_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_PUBLIC_CORRECTION",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasInference",
          "id": "INF_C03_02"
        }
      ]
    },
    "speakerJa": "俵九郎",
    "textJa": "その枡で量ったのは私です。不足の二杯は補います。俵太が道中で抜いたという話も、この私から公に訂正いたしましょう。",
    "choices": [
      {
        "id": "D_C03_SCENE_PUBLIC_CORRECTION_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_SCENE_PUBLIC_CORRECTION_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_PUBLIC_CORRECTION_L2",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasInference",
          "id": "INF_C03_02"
        }
      ]
    },
    "speakerJa": "俵九郎",
    "textJa": "最初に仕事を世話したことを、この場に持ち出すべきではありませんでした。返すものの相談に、過去の恩義を混ぜてしまいましたな。",
    "choices": [
      {
        "id": "D_C03_SCENE_PUBLIC_CORRECTION_L2_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_SCENE_PUBLIC_CORRECTION_L3",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_PUBLIC_CORRECTION_L3",
    "caseId": "C03",
    "npcId": "NPC_TAWARAKURO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasInference",
          "id": "INF_C03_02"
        }
      ]
    },
    "speakerJa": "俵九郎",
    "textJa": "これからの保管料は、誤魔化さず先に値段として表に出します。高ければ断られることもあるでしょう。ですがそれは、商いの話として真っ当に受け止めます。",
    "choices": [
      {
        "id": "D_C03_SCENE_PUBLIC_CORRECTION_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_TAWARAKURO_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_SCENE_PUBLIC_CORRECTION_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MARKET_DEALER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_CALIBRATION",
    "caseId": "C03",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_04"
        }
      ]
    },
    "speakerJa": "枡目",
    "textJa": "この取引と同じ米を、標準の枡ですり切り一杯。秤の目は「十」だ。そして出発前の立会札には、空袋の重さを引いて「八十」と記されている。",
    "choices": [
      {
        "id": "D_C03_SCENE_CALIBRATION_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_SCENE_CALIBRATION_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_STANDARD",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_CALIBRATION_L2",
    "caseId": "C03",
    "npcId": "NPC_MASUME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_04"
        }
      ]
    },
    "speakerJa": "枡目",
    "textJa": "店の枡をいま量り比べた結果と、当日の重さを突き合わせれば、市を出発する前から八杯ぶんだったと一目で分かるはずだよ。",
    "choices": [
      {
        "id": "D_C03_SCENE_CALIBRATION_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_MASUME_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_SCENE_CALIBRATION_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_STANDARD",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_PLANK",
    "caseId": "C03",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_05"
        }
      ]
    },
    "speakerJa": "竹次",
    "textJa": "底を守る保護板だと聞いて作ったんだ。使い道を知っていれば、あんな注文は受けなかっただろうな。",
    "choices": [
      {
        "id": "D_C03_SCENE_PLANK_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_SCENE_PLANK_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SHRINE_WORKSHOP",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_PLANK_L2",
    "caseId": "C03",
    "npcId": "NPC_TAKEJI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_05"
        }
      ]
    },
    "speakerJa": "竹次",
    "textJa": "俺が作った板と、あの枡の釘穴はぴたりと合う。だからこそ、誰がいつ取り付けて使ったのかもきちんと確かめてくれ。似たような板を作る職人は、ほかにもいるからな。",
    "choices": [
      {
        "id": "D_C03_SCENE_PLANK_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_TAKEJI_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_SCENE_PLANK_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SHRINE_WORKSHOP",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_CONTROL_GRAIN",
    "caseId": "C03",
    "npcId": "NPC_YUKEMARU",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_07"
        }
      ]
    },
    "speakerJa": "湯気丸",
    "textJa": "同じ日の同じ米を、ちゃんと残してあるよ。「運ぶ間に湿ったからだ」「乾いたからだ」と水掛け論になる前に、同じ条件で比べられるようにね。",
    "choices": [
      {
        "id": "D_C03_SCENE_CONTROL_GRAIN_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C03_SCENE_CONTROL_GRAIN_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SPRING_INN",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C03_SCENE_CONTROL_GRAIN_L2",
    "caseId": "C03",
    "npcId": "NPC_YUKEMARU",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C03_07"
        }
      ]
    },
    "speakerJa": "湯気丸",
    "textJa": "なにせ宿屋は湯気が多いからね。見本のお米までふっくら炊き上げちゃったら、商売にならないよ。",
    "choices": [
      {
        "id": "D_C03_SCENE_CONTROL_GRAIN_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_YUKEMARU_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C03_SCENE_CONTROL_GRAIN_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SPRING_INN",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C04_SCENE_FIRST_SENTENCE",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "葛葉",
    "textJa": "私は確かに「欠席」と書きましたわ。けれど、「理由が足りない」と言われて書き足しているうちに……まずははっきりお断りの返事を出すことにしたのです。",
    "choices": [
      {
        "id": "D_C04_SCENE_FIRST_SENTENCE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_SCENE_FIRST_SENTENCE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C04_SCENE_FIRST_SENTENCE_L2",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "葛葉",
    "textJa": "婚礼はおめでたいことですわ。だからこそ、それ以外の頼み事まで「お祝いなのだから」と喜んで引き受けねばならないというのは、少し違うのではありませんか。",
    "choices": [
      {
        "id": "D_C04_SCENE_FIRST_SENTENCE_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_KUZUHA_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_SCENE_FIRST_SENTENCE_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C04_SCENE_KOSAME_SCOPE",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "葛葉",
    "textJa": "京への使いは午前だけ、と約束して引き受けてもらいました。使い賃のことと、戻ってからの過ごし方は、それとは別に話し合ったのですわ。",
    "choices": [
      {
        "id": "D_C04_SCENE_KOSAME_SCOPE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_SCENE_KOSAME_SCOPE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C04_SCENE_KOSAME_SCOPE_L2",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "葛葉",
    "textJa": "午後はお客として戻る、とあの子が申しましたの。だから小雨の席は、裏方の手伝いの列ではなく、お祝いの膳の前にきちんと取ってありますわ。",
    "choices": [
      {
        "id": "D_C04_SCENE_KOSAME_SCOPE_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_KUZUHA_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_SCENE_KOSAME_SCOPE_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C04_SCENE_SUNSHOWER",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "小雨",
    "textJa": "空は確かに明るかったよ。でも、雨も降ったんだ。どちらか片方を「間違いだ」って決めつけないと、大人たちは話を聞いてくれないのかと思ったよ。",
    "choices": [
      {
        "id": "D_C04_SCENE_SUNSHOWER_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_SCENE_SUNSHOWER_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_LOWER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C04_SCENE_SUNSHOWER_L2",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "小雨",
    "textJa": "濡れないように包みは守ったつもりだったんだ。でも、読めないところが出来たなら、「読めなくなりました」ってそのまま渡すべきだったね。中に何が書いてあったかまで、ぼくが勝手に決めつけないで。",
    "choices": [
      {
        "id": "D_C04_SCENE_SUNSHOWER_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_KOSAME_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_SCENE_SUNSHOWER_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_LOWER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C04_SCENE_PROXY_PAY",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "小雨",
    "textJa": "午前の使いなら、って引き受けたんだ。葛葉さんの代わりに一日じゅう働くなんて、ひと言も言ってないよ。使い賃だって、その範囲で決めたんだから。",
    "choices": [
      {
        "id": "D_C04_SCENE_PROXY_PAY_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_SCENE_PROXY_PAY_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_LOWER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C04_SCENE_PROXY_PAY_L2",
    "caseId": "C04",
    "npcId": "NPC_KOSAME",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C04"
        }
      ]
    },
    "speakerJa": "小雨",
    "textJa": "午後はちゃんとお客として、お祝いの膳をいただくつもり。席をひとつ、お願いしておいたんだ。荷物を置く場所じゃなくて、ぼくが座る席をね。",
    "choices": [
      {
        "id": "D_C04_SCENE_PROXY_PAY_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_KOSAME_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_SCENE_PROXY_PAY_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_LOWER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C04_SCENE_RESTORED_NO",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasInference",
          "id": "INF_C04_02"
        }
      ]
    },
    "speakerJa": "葛葉",
    "textJa": "いいえ。隠れていた続きは、私の欠席を取り消す文ではありませんわ。代理の使いを立てることと、里に残る催しを続けるというお返事ですの。",
    "choices": [
      {
        "id": "D_C04_SCENE_RESTORED_NO_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_SCENE_RESTORED_NO_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C04_SCENE_RESTORED_NO_L2",
    "caseId": "C04",
    "npcId": "NPC_KUZUHA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasInference",
          "id": "INF_C04_02"
        }
      ]
    },
    "speakerJa": "葛葉",
    "textJa": "手紙の続きが読めるようになっても、最初の一行は消えませんわ。",
    "choices": [
      {
        "id": "D_C04_SCENE_RESTORED_NO_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_KUZUHA_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_SCENE_RESTORED_NO_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_INARI_MIDDLE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C04_SCENE_PAPER",
    "caseId": "C04",
    "npcId": "NPC_AIZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C04_03"
        }
      ]
    },
    "speakerJa": "藍蔵",
    "textJa": "同じ紙と同じ糊で試せば、濡れて貼り合うことは誰の目にも確かめられる。わざわざ原本を濡らして答えを作る必要なんてないさ。",
    "choices": [
      {
        "id": "D_C04_SCENE_PAPER_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_SCENE_PAPER_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_AUTUMN_DYER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C04_SCENE_PAPER_L2",
    "caseId": "C04",
    "npcId": "NPC_AIZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C04_03"
        }
      ]
    },
    "speakerJa": "藍蔵",
    "textJa": "誰かがわざとやったのかどうかは、ここから先の話だ。紙が黙っていることまで、勝手に喋らせるなよ。",
    "choices": [
      {
        "id": "D_C04_SCENE_PAPER_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_AIZO_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_SCENE_PAPER_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_AUTUMN_DYER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C04_SCENE_BEFORE_RAIN",
    "caseId": "C04",
    "npcId": "NPC_MOMONE",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C04_05"
        }
      ]
    },
    "speakerJa": "桃音",
    "textJa": "送り出す前に、葛葉さまから全文を読み上げていただきましたの。「参れないこと」「代理のこと」「里の餅つきのこと」。三つとも、最初からそこにありましたわ。",
    "choices": [
      {
        "id": "D_C04_SCENE_BEFORE_RAIN_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C04_SCENE_BEFORE_RAIN_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_PEACH_WEDDING",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C04_SCENE_BEFORE_RAIN_L2",
    "caseId": "C04",
    "npcId": "NPC_MOMONE",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C04_05"
        }
      ]
    },
    "speakerJa": "桃音",
    "textJa": "あとから気が変わったという話には、とてもできませんね。最初のお返事を聞いた者が、こうしてここにいるのですから。",
    "choices": [
      {
        "id": "D_C04_SCENE_BEFORE_RAIN_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_MOMONE_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C04_SCENE_BEFORE_RAIN_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_PEACH_WEDDING",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C05_SCENE_JOINT_SHIP",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        }
      ]
    },
    "speakerJa": "潮蔵",
    "textJa": "いや、共同の船便そのものには助けられるのじゃよ。空になった箱だけを戻すために、わし一人で海を越える手間も省けるからの。",
    "choices": [
      {
        "id": "D_C05_SCENE_JOINT_SHIP_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_SCENE_JOINT_SHIP_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C05_SCENE_JOINT_SHIP_L2",
    "caseId": "C05",
    "npcId": "NPC_SHIOZO",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        }
      ]
    },
    "speakerJa": "潮蔵",
    "textJa": "便利な仕組みに賛成することと、ありもしない不足の責任をかぶることは別じゃ。反対か賛成かの二択に、わしの返事を無理やり畳み込まんでくれ！",
    "choices": [
      {
        "id": "D_C05_SCENE_JOINT_SHIP_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_SHIOZO_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_SCENE_JOINT_SHIP_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_RYUGU_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C05_SCENE_EMPTY_STORE",
    "caseId": "C05",
    "npcId": "NPC_NAMISUKE",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        }
      ]
    },
    "speakerJa": "波助",
    "textJa": "次の預かり手へ無事に渡したから空になったんだよ。預かった数も、渡した数も、全部札に残してる。蔵を空にして、ようやく片付く仕事もあるんだ。",
    "choices": [
      {
        "id": "D_C05_SCENE_EMPTY_STORE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C05_SCENE_EMPTY_STORE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_COAST_TRANSFER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C05_SCENE_EMPTY_STORE_L2",
    "caseId": "C05",
    "npcId": "NPC_NAMISUKE",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        }
      ]
    },
    "speakerJa": "波助",
    "textJa": "空にしたらしたで「暇そうだね」なんて言われちまったよ。今度は荷の山じゃなくて、片付けたあとの仕事ぶりを見てもらおうと思ってるんだ。",
    "choices": [
      {
        "id": "D_C05_SCENE_EMPTY_STORE_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_NAMISUKE_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C05_SCENE_EMPTY_STORE_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_COAST_TRANSFER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C06_SCENE_PRAYER_DIFFERENCE",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "灯庵",
    "textJa": "皆さま、同じ祈りの文を読まれました。ですから、「同じひとつの運営を望んでいる」とひとまとめにしたくなる気持ちも分かります。私にとっても、その方が扱いやすい面は確かにございます。",
    "choices": [
      {
        "id": "D_C06_SCENE_PRAYER_DIFFERENCE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C06_SCENE_PRAYER_DIFFERENCE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C06_SCENE_PRAYER_DIFFERENCE_L2",
    "caseId": "C06",
    "npcId": "NPC_TOAN",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "灯庵",
    "textJa": "けれど、「扱いやすさ」は皆さまおひとりおひとりの返事ではありません。鈴菜さん、湯気丸さん、雪綴さん。どうか、それぞれのお話を直接聞いて差し上げてください。",
    "choices": [
      {
        "id": "D_C06_SCENE_PRAYER_DIFFERENCE_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_TOAN_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_SCENE_PRAYER_DIFFERENCE_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TODAIJI_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C06_SCENE_CONTINUE",
    "caseId": "C06",
    "npcId": "NPC_SUZUNA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "鈴菜",
    "textJa": "私は、この薄野で餅つきを続けたい。だからこそ祈りました。でもそれは、休みたいと思っている方にも「同じだけ働きなさい」と願ったわけじゃないわ。",
    "choices": [
      {
        "id": "D_C06_SCENE_CONTINUE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C06_SCENE_CONTINUE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MOON_TEMPLE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C06_SCENE_CONTINUE_L2",
    "caseId": "C06",
    "npcId": "NPC_SUZUNA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "鈴菜",
    "textJa": "足を運ぶ人と、役目を引き受ける人の数に合わせて、できる範囲でやる。それなら、無理なく続けられる気がするの。",
    "choices": [
      {
        "id": "D_C06_SCENE_CONTINUE_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_SUZUNA_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_SCENE_CONTINUE_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_MOON_TEMPLE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C06_SCENE_SHARED_KITCHEN",
    "caseId": "C06",
    "npcId": "NPC_YUKEMARU",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "湯気丸",
    "textJa": "宿の朝餉の支度と祭の仕込みが、同じ時刻に重なって両側から呼ばれるんだ。湯気なら二手に分かれて飛んでいけるけれど、私の体はひとつしかないからね。",
    "choices": [
      {
        "id": "D_C06_SCENE_SHARED_KITCHEN_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C06_SCENE_SHARED_KITCHEN_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SPRING_INN",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C06_SCENE_SHARED_KITCHEN_L2",
    "caseId": "C06",
    "npcId": "NPC_YUKEMARU",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "湯気丸",
    "textJa": "共同の台所を、きちんと代金を払って使いたい。それは、私自身が出す返事だよ。ただ、私がそう望んだからといって、ほかの里までみんな賛成だったことにはしないでほしいんだ。",
    "choices": [
      {
        "id": "D_C06_SCENE_SHARED_KITCHEN_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_YUKEMARU_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_SCENE_SHARED_KITCHEN_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SPRING_INN",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C06_SCENE_LESS_WORK",
    "caseId": "C06",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "雪綴",
    "textJa": "今年は、引き受ける束の数を減らします。祈りに名前を書いたのは本当です。だからといって、去年と同じ仕事量を引き受けたことにはなりません。",
    "choices": [
      {
        "id": "D_C06_SCENE_LESS_WORK_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C06_SCENE_LESS_WORK_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SNOW_BINDER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C06_SCENE_LESS_WORK_L2",
    "caseId": "C06",
    "npcId": "NPC_YUKITSUZURI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        }
      ]
    },
    "speakerJa": "雪綴",
    "textJa": "「続いてほしい」と願うものを、自分も同じ形でずっと支え続けられるとは限りません。その線をきちんと分けて話せるのなら、来年もまたお寺へ祈りに行けます。",
    "choices": [
      {
        "id": "D_C06_SCENE_LESS_WORK_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_YUKITSUZURI_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C06_SCENE_LESS_WORK_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_SNOW_BINDER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C07_SCENE_DIRECTIONS",
    "caseId": "C07",
    "npcId": "NPC_TOKA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "灯火",
    "textJa": "大通り、東筋、東塔。同じ夜の火を並べて見比べよう。あの図と、本人が言った居場所が合うかどうかは、自分の目で確かめられる。",
    "choices": [
      {
        "id": "D_C07_SCENE_DIRECTIONS_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_SCENE_DIRECTIONS_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_EAST_VIEW",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C07_SCENE_DIRECTIONS_L2",
    "caseId": "C07",
    "npcId": "NPC_TOKA",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "灯火",
    "textJa": "ただね、人から借りた図か、記憶を頼りに描いた図かまでは、山は教えてくれない。景色を確かめたら、その次は「紙が辿ってきた道」を見ておいで。",
    "choices": [
      {
        "id": "D_C07_SCENE_DIRECTIONS_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_TOKA_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_SCENE_DIRECTIONS_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_EAST_VIEW",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C07_SCENE_CHOSEN_WORDS",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_01"
        }
      ]
    },
    "speakerJa": "筆丸",
    "textJa": "あなたが各地から集めた相談は、決して作り話ではないでしょう。実際に杵はなくなり、米は足りず、役を休みたいと願う者もいたのですから。",
    "choices": [
      {
        "id": "D_C07_SCENE_CHOSEN_WORDS_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_SCENE_CHOSEN_WORDS_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C07_SCENE_CHOSEN_WORDS_L2",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_01"
        }
      ]
    },
    "speakerJa": "筆丸",
    "textJa": "ひとつひとつの問題が片づいたら、それでまた全部を元どおりに戻すおつもりですか？　代金を待たされる者も、頼みを断れない者も、再び同じ苦しい場所へ。",
    "choices": [
      {
        "id": "D_C07_SCENE_CHOSEN_WORDS_L2_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_SCENE_CHOSEN_WORDS_L3",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C07_SCENE_CHOSEN_WORDS_L3",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_01"
        }
      ]
    },
    "speakerJa": "筆丸",
    "textJa": "……失礼。いま問われているのは、私が提出した文章のことでしたね。手元の控えを確かめてから、きちんとお答えいたします。",
    "choices": [
      {
        "id": "D_C07_SCENE_CHOSEN_WORDS_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_FUDEM_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_SCENE_CHOSEN_WORDS_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C07_SCENE_CARRIER",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "羽文",
    "textJa": "ぼくは相談も、その後の結果も、両方運びました。最初の相談が本物だからといって、そのまま今の事実だとは言えないはずです。日付とその続きが、ぼくの渡した話の一部なんですから。",
    "choices": [
      {
        "id": "D_C07_SCENE_CARRIER_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_SCENE_CARRIER_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C07_SCENE_CARRIER_L2",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "羽文",
    "textJa": "あなたの手帖が使われたからといって、あなたがこの申し立てに同意したことにはなりません。どの部分を誰が選び取ったのか、一緒に調べましょう。",
    "choices": [
      {
        "id": "D_C07_SCENE_CARRIER_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_HABUMI_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_SCENE_CARRIER_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C07_SCENE_WHAT_WAS_READ",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_11"
        }
      ]
    },
    "speakerJa": "直記",
    "textJa": "受取印があれば、確かに「届いた」とは言えます。しかし「読んだかどうか」までは、印ひとつでは分かりません。ですから私は、読み返した内容を別に書き残しているのです。",
    "choices": [
      {
        "id": "D_C07_SCENE_WHAT_WAS_READ_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_SCENE_WHAT_WAS_READ_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_INTAKE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C07_SCENE_WHAT_WAS_READ_L2",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_11"
        }
      ]
    },
    "speakerJa": "直記",
    "textJa": "やたらと手続きを増やすのが役目のように思われがちですが、本当は「減らしても差し支えない手続き」のほうを見極めているつもりですよ。",
    "choices": [
      {
        "id": "D_C07_SCENE_WHAT_WAS_READ_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_NAOKI_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_SCENE_WHAT_WAS_READ_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_INTAKE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C07_SCENE_VALID_REFUSAL",
    "caseId": "C07",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C01_07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_01"
        }
      ]
    },
    "speakerJa": "杵吉",
    "textJa": "あの書付は、紛れもなく私が出した返事だ。おかしな束の中に紛れ込まされたからといって、本物の返事が偽物になるわけがないだろう。",
    "choices": [
      {
        "id": "D_C07_SCENE_VALID_REFUSAL_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_SCENE_VALID_REFUSAL_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C07_SCENE_VALID_REFUSAL_L2",
    "caseId": "C07",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C01_07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_01"
        }
      ]
    },
    "speakerJa": "杵吉",
    "textJa": "「杵が戻った」とは書いたが、「私が戻る」とは書いていない。祝いの一搗き役は、今年から返させてもらうよ。",
    "choices": [
      {
        "id": "D_C07_SCENE_VALID_REFUSAL_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_KINEKICHI_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_SCENE_VALID_REFUSAL_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C07_SCENE_READ_BOTH",
    "caseId": "C07",
    "npcId": "NPC_SHIRAE",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C01_07"
        }
      ]
    },
    "speakerJa": "白枝",
    "textJa": "誤った主張はきっぱりと退けます。ですが、同じ束の中に含まれていた真正な返事まで、ついでにひっくり返してよいわけではありません。",
    "choices": [
      {
        "id": "D_C07_SCENE_READ_BOTH_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_SCENE_READ_BOTH_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_JUDGE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C07_SCENE_READ_BOTH_L2",
    "caseId": "C07",
    "npcId": "NPC_SHIRAE",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C01_07"
        }
      ]
    },
    "speakerJa": "白枝",
    "textJa": "共同の助けを求める者もいれば、出番を断る者もいる。この場の勝敗のために、そのひとりひとりの違いを塗りつぶしてしまわないでください。",
    "choices": [
      {
        "id": "D_C07_SCENE_READ_BOTH_BACK",
        "labelJa": "ほかの話を聞く",
        "nextId": "D_NPC_SHIRAE_INTRO",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_SCENE_READ_BOTH_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_JUDGE",
    "locationBinding": "resolved_single_npc",
    "entryPolicy": "named_npc_optional_topic"
  },
  {
    "id": "D_C01_E07",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "杵の紛失騒ぎより前に、杵吉自身が書いた本人控えだ。「祝いの一搗き役を、本年より返上します。」と一文ではっきり記され、日付も役目も本人の名も同じ紙に揃っている。",
    "choices": [
      {
        "id": "D_C01_E07_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_E07_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C01_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C01_E07_L2",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "道具を返してほしいという相談とはまったく別の返事で、取り消された形跡もない。",
    "choices": [
      {
        "id": "D_C01_E07_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C01_E07_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C01_07"
          }
        ]
      },
      {
        "id": "D_C01_E07_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C01_E07_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E07_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C01_E07_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E07_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C01_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C01_E07_QUOTE",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "杵吉の添え書きがある。「杵は返してほしい。祝いの一搗きは、もう引き受けない。その二つとも、私自身の頼みだよ。」",
    "choices": [
      {
        "id": "D_C01_E07_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C01_E07",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C01_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "sourceSpeakerNpcId": "NPC_KINEKICHI"
  },
  {
    "id": "D_C01_E07_LIMIT",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "杵吉本人が「祝いの一搗き」という特定の役目を辞退したことが分かる。杵が見つからないから一時的に休んだわけじゃない。",
    "choices": [
      {
        "id": "D_C01_E07_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C01_E07_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C01_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C01_E07_LIMIT_L2",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただ、これだけで里全体の祭をやめるとか、普段の餅つきまで引退するとか、京に運営を任せるとかいった意味にはならない。理由の説明や代わりの人がいなければ無効になる紙でもないしな。",
    "choices": [
      {
        "id": "D_C01_E07_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C01_E07",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C01_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C01_E07_RECORDED",
    "caseId": "C01",
    "npcId": "NPC_KINEKICHI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C01_07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「杵吉の祝い役返上願」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C01_E07_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C01_E07",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C01_E07_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_REQUEST",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C01_07",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "entryPolicy": "after_explicit_record_or_notebook_reread"
  },
  {
    "id": "D_C07_E13",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "同じ紙と墨を使った折りの見本だ。右欄の末尾に文字を書き、閉じてから開く。どちらの側へ何が写るのか、目の前で確かめることができそうだ。",
    "choices": [
      {
        "id": "D_C07_E13_START",
        "labelJa": "検分を始める",
        "nextId": "D_C07_E13_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "playEvidenceReconstruction",
          "evidenceId": "EV_C07_13",
          "sourceEvent": "EVT_NOTEBOOK_METHOD"
        }
      },
      {
        "id": "D_C07_E13_RECON_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C07_13",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E13_OBSERVE",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "相談と返事を向かい合わせに書く二つ折り札の見本だ。右下の墨を十分乾かしてから畳む場合と、乾ききる前に右を左へ閉じる場合を見比べる。",
    "choices": [
      {
        "id": "D_C07_E13_OBSERVE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E13_OBSERVE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C07_13",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E13_OBSERVE_L2",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "まだ湿った右欄の文字は、折り線を挟んで向かい合う左欄の余白へ「左右反転した鏡文字」となって写り、外側の裏面には一切写らない。この現象は写しの紙で何度でも試せる。",
    "choices": [
      {
        "id": "D_C07_E13_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C07_E13_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C07_13"
          }
        ]
      },
      {
        "id": "D_C07_E13_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C07_E13_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E13_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C07_E13_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E13_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C07_13",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E13_QUOTE",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "調べる",
    "textJa": "筆丸の添え書きがある。「よく乾いてから畳めば、何も写りはしません。急ぐと、向かい側にもうひとつ余計な仕事が増えてしまう。見本でしたら、何度折り直してもかまいませんよ。」",
    "choices": [
      {
        "id": "D_C07_E13_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E13_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C07_13",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "sourceSpeakerNpcId": "NPC_FUDEM"
  },
  {
    "id": "D_C07_E13_LIMIT",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "この折り方の観察から、写りは「右欄の文字が書かれたあと」にできることが分かる。位置は折り線を軸に線対称で、乾いてから閉じた対照実験では新しい写りはできないぞ。",
    "choices": [
      {
        "id": "D_C07_E13_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E13_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C07_13",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E13_LIMIT_L2",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "ただし、この実演だけじゃ、提出された原票の来歴や、誰がそれを読んで切り離したのか、その意図までは決まらない。実物との照合と、独立した受領・提出資料が必要だ。",
    "choices": [
      {
        "id": "D_C07_E13_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E13_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C07_13",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E13_RECORDED",
    "caseId": "C07",
    "npcId": "NPC_FUDEM",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_13"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「乾いた札と濡れた札の折り比べ」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C07_E13_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C07_E13",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E13_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_DAWN_RECORDER",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C07_13",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "entryPolicy": "after_explicit_record_or_notebook_reread"
  },
  {
    "id": "D_C07_E12",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_13"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "手元の見開き控えと、提出された片側の頁を並べる。書かれた文字の意味だけでなく、紙の切れ端と墨の痕跡がどこへ繋がるのかを探し出す。",
    "choices": [
      {
        "id": "D_C07_E12_START",
        "labelJa": "検分を始める",
        "nextId": "D_C07_E12_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "playEvidenceReconstruction",
          "evidenceId": "EV_C07_12",
          "sourceEvent": "EVT_C07_SUBMIT"
        }
      },
      {
        "id": "D_C07_E12_RECON_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C07_12",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E12_OBSERVE",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_13"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "提出本の祝い杵と米売りの左片を、解決時に開いたまま残しておいた見開き控えとぴったり重ね合わせる。",
    "choices": [
      {
        "id": "D_C07_E12_OBSERVE_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E12_OBSERVE_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C07_12",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E12_OBSERVE_L2",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_13"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "相談文・受付印・折り目の位置がすべて一致し、左欄の薄い墨は、右欄の「祝い杵は戻った」「不足二杯、受取済」を折り線で反転させた位置にぴたりと重なる。受理時の写しにも同じ痕跡が残っている。",
    "choices": [
      {
        "id": "D_C07_E12_OBSERVE_L2_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E12_OBSERVE_L3",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C07_12",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E12_OBSERVE_L3",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_13"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "まだ解決前の「白紙だった返事欄」から、このような反転墨が生じることは絶対にあり得ない。",
    "choices": [
      {
        "id": "D_C07_E12_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C07_E12_RECORDED",
        "condition": {
          "all": [
            {
              "op": "caseSolved",
              "id": "C04"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C01_06"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C03_08"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C07_01"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C07_03"
            },
            {
              "op": "hasEvidence",
              "id": "EV_C07_13"
            }
          ]
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C07_12"
          }
        ]
      },
      {
        "id": "D_C07_E12_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C07_E12_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E12_QUOTE",
        "labelJa": "添えられた説明を読む",
        "nextId": "D_C07_E12_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E12_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C07_12",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E12_QUOTE",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_13"
        }
      ]
    },
    "speakerJa": "調べる",
    "textJa": "直記の添え書きがある。「ただの汚れだと思って見過ごしてはなりません。右を左へ折った位置、元の受付印、そして受理したときの写し。この三つを重ね合わせて、いつ付いた跡なのかを確かめるのです。」",
    "choices": [
      {
        "id": "D_C07_E12_QUOTE_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E12_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C07_12",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "sourceSpeakerNpcId": "NPC_NAOKI"
  },
  {
    "id": "D_C07_E12_LIMIT",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_13"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "提出された相談側には、結果が記入されたあとの右欄と直接触れ合った痕跡が刻まれている。「解決前の古い写しがそのまま残っていただけ」という弁解では、この二組の一致と来歴を説明できないな。",
    "choices": [
      {
        "id": "D_C07_E12_LIMIT_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C07_E12_LIMIT_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C07_12",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E12_LIMIT_L2",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseSolved",
          "id": "C04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_13"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "もっとも、墨の痕跡だけで筆丸の故意や、すべての紙の操作、全事件の首謀者まで一気に決めつけちゃいけない。原票の対応、読み返し、綴じと提出の順序をひとつずつ示す必要があるぞ。",
    "choices": [
      {
        "id": "D_C07_E12_LIMIT_BACK",
        "labelJa": "資料に戻る",
        "nextId": "D_C07_E12_OBSERVE",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C07_12",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true
  },
  {
    "id": "D_C07_E12_RECORDED",
    "caseId": "C07",
    "npcId": "NPC_NAOKI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "hasEvidence",
          "id": "EV_C07_12"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「切り出された相談欄の反転墨」を手帖に書き留めた。現物はそのまま残してあるから、見たことも聞いたこともいつでも読み返せる。",
    "choices": [
      {
        "id": "D_C07_E12_REREAD",
        "labelJa": "もう一度確かめる",
        "nextId": "D_C07_E12",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C07_E12_RECORDED_CLOSE",
        "labelJa": "手帖を閉じる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_KYO_ARCHIVE",
    "locationBinding": "fixed_evidence_anchor",
    "evidenceId": "EV_C07_12",
    "triggerKind": "world_hotspot_or_notebook",
    "manualEvidenceGrant": true,
    "entryPolicy": "after_explicit_record_or_notebook_reread"
  },
  {
    "id": "D_INF_C07_04_OPEN",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_12"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_13"
        },
        {
          "op": "flagEquals",
          "id": "trialActive",
          "value": "TR_C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "提出された相談欄は、いつの時点の紙から切り出されたものだろう？",
    "choices": [
      {
        "id": "D_INF_C07_04_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C07_04"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C07_04"
        }
      },
      {
        "id": "D_INF_C07_04_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C07_04_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C07_04_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationBinding": "resolved_single_npc",
    "inferenceId": "INF_C07_04",
    "inferenceStage": "court",
    "entryPolicy": "court_notebook_challenge"
  },
  {
    "id": "D_INF_C07_04_HINT_1",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "相談の文面が本物であることは認めよう。だがその紙に、「相談より後の出来事」が残した跡はないだろうか。",
    "choices": [
      {
        "id": "D_INF_C07_04_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C07_04_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C07_04_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationBinding": "resolved_single_npc",
    "inferenceId": "INF_C07_04",
    "inferenceStage": "court",
    "entryPolicy": "explicit_hint_request",
    "hintLevel": 1
  },
  {
    "id": "D_INF_C07_04_HINT_2",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "見本札の右欄を左へ折ると、乾いていない文字は向かい側の余白へ鏡文字になって写る。外側の裏ではないぞ。",
    "choices": [
      {
        "id": "D_INF_C07_04_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C07_04_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C07_04_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationBinding": "resolved_single_npc",
    "inferenceId": "INF_C07_04",
    "inferenceStage": "court",
    "entryPolicy": "explicit_hint_request",
    "hintLevel": 2
  },
  {
    "id": "D_INF_C07_04_HINT_3",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「祝い杵と米売りの完成見開き」「折り比べ」「提出片の比較」「受理時の写し」を重ねよう。解決前の白い右欄では決して作れない写りだ。",
    "choices": [
      {
        "id": "D_INF_C07_04_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationBinding": "resolved_single_npc",
    "inferenceId": "INF_C07_04",
    "inferenceStage": "court",
    "entryPolicy": "explicit_hint_request",
    "hintLevel": 3
  },
  {
    "id": "D_INF_C07_05_OPEN",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "investigate",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_07"
        },
        {
          "op": "flagEquals",
          "id": "trialActive",
          "value": "TR_C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "偽りの「全里辞退」を退けたあと、杵吉の返上願はどう扱うべきだろう？",
    "choices": [
      {
        "id": "D_INF_C07_05_CHALLENGE",
        "labelJa": "証拠を組み合わせる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "unlockInference",
            "id": "INF_C07_05"
          }
        ],
        "uiAction": {
          "type": "openInference",
          "inferenceId": "INF_C07_05"
        }
      },
      {
        "id": "D_INF_C07_05_HINT",
        "labelJa": "手掛かりを読む",
        "nextId": "D_INF_C07_05_HINT_1",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C07_05_LATER",
        "labelJa": "あとで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationBinding": "resolved_single_npc",
    "inferenceId": "INF_C07_05",
    "inferenceStage": "court",
    "entryPolicy": "court_notebook_challenge"
  },
  {
    "id": "D_INF_C07_05_HINT_1",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「戻った」という言葉の主語を確かめよう。戻ったのは「杵」か、それとも「祝い役」か。",
    "choices": [
      {
        "id": "D_INF_C07_05_H1_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C07_05_HINT_2",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C07_05_H1_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationBinding": "resolved_single_npc",
    "inferenceId": "INF_C07_05",
    "inferenceStage": "court",
    "entryPolicy": "explicit_hint_request",
    "hintLevel": 1
  },
  {
    "id": "D_INF_C07_05_HINT_2",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "返上願は、杵が消えたあとの言い訳じゃない。相談より前の日付と、そこに書かれた特定の役名を読もう。",
    "choices": [
      {
        "id": "D_INF_C07_05_H2_NEXT",
        "labelJa": "もう一段、手掛かりを読む",
        "nextId": "D_INF_C07_05_HINT_3",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_INF_C07_05_H2_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationBinding": "resolved_single_npc",
    "inferenceId": "INF_C07_05",
    "inferenceStage": "court",
    "entryPolicy": "explicit_hint_request",
    "hintLevel": 2
  },
  {
    "id": "D_INF_C07_05_HINT_3",
    "caseId": "C07",
    "npcId": "NPC_HABUMI",
    "situation": "hint",
    "condition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        }
      ]
    },
    "speakerJa": "手帖",
    "textJa": "「杵吉の返上願」と「祝い杵の返却確認」を組み合わせて、「道具は戻るが、本人の辞退は残る」と答えよう。",
    "choices": [
      {
        "id": "D_INF_C07_05_H3_CLOSE",
        "labelJa": "ここまでで考える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationBinding": "resolved_single_npc",
    "inferenceId": "INF_C07_05",
    "inferenceStage": "court",
    "entryPolicy": "explicit_hint_request",
    "hintLevel": 3
  },
  {
    "id": "D_C02_E07_BOUNDARY",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "芦ノ山",
    "textJa": "出番には戻らない。無事かどうかを確かめたいだけなら、ちゃんと話すよ。",
    "choices": [
      {
        "id": "D_C02_E07_BOUNDARY_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_E07_BOUNDARY_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "evidenceId": "EV_C02_07",
    "triggerKind": "npc_topic",
    "manualEvidenceGrant": true,
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C02_E07_BOUNDARY_L2",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "芦ノ山",
    "textJa": "「見つかったから、今までどおりに出られるだろう」――そういう話は、わしの返事を聞いてからにしてくれ。",
    "choices": [
      {
        "id": "D_C02_E07_BOUNDARY_LISTEN",
        "labelJa": "本人の話を聞く",
        "nextId": "D_C02_E07_CONFIRM",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E07_BOUNDARY_CLOSE",
        "labelJa": "話を終える",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "evidenceId": "EV_C02_07",
    "triggerKind": "npc_topic",
    "manualEvidenceGrant": true,
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C02_E07_CONFIRM",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "芦ノ山",
    "textJa": "無事だ。この姿も名前も、よく確かめてくれ。自分でここへ来て、手返しを習っている。綱は白足に貸しただけだ。",
    "choices": [
      {
        "id": "D_C02_E07_CONFIRM_CONTINUE",
        "labelJa": "続ける",
        "nextId": "D_C02_E07_CONFIRM_L2",
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "evidenceId": "EV_C02_07",
    "triggerKind": "npc_topic",
    "manualEvidenceGrant": true,
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_C02_E07_CONFIRM_L2",
    "caseId": "C02",
    "npcId": "NPC_ASHINOYAMA",
    "situation": "investigate",
    "condition": {
      "all": []
    },
    "speakerJa": "芦ノ山",
    "textJa": "鳴吉には「無事だ」と伝えていい。ただし、今度の出番には戻らない。稽古を始めたからといって、それを次の見せ場の約束にすり替えないでほしいんだ。",
    "choices": [
      {
        "id": "D_C02_E07_RECORD",
        "labelJa": "手帖に記録する",
        "nextId": "D_C02_E07_RECORDED",
        "condition": {
          "all": []
        },
        "effects": [
          {
            "op": "acquireEvidence",
            "id": "EV_C02_07"
          }
        ]
      },
      {
        "id": "D_C02_E07_ASK",
        "labelJa": "この資料で、どこまで分かる？",
        "nextId": "D_C02_E07_LIMIT",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E07_QUOTE",
        "labelJa": "もう少し聞く",
        "nextId": "D_C02_E07_QUOTE",
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_C02_E07_LEAVE",
        "labelJa": "いったん離れる",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      }
    ],
    "effects": [],
    "locationId": "LOC_TERRACES_PRACTICE",
    "evidenceId": "EV_C02_07",
    "triggerKind": "npc_topic",
    "manualEvidenceGrant": true,
    "locationBinding": "resolved_single_npc"
  },
  {
    "id": "D_FEEDBACK_CONCERN_RESULT",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "相談の文面が本物でも、「今もそうだ」という証拠にはならない。相談した日付と、そのあとに確かめた結果を並べてみよう。",
    "choices": [
      {
        "id": "D_FEEDBACK_CONCERN_RESULT_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_CONCERN_RESULT_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "locationBinding": "resolved_single_npc",
    "feedbackCode": "CONCERN_RESULT",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_MIRROR_INTENT",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "反転した墨の跡は、結果の文字が書かれたあとに紙が折られた証拠だ。ただ、誰が中身を読んで切り出したのかは、別の記録と合わせる必要がある。",
    "choices": [
      {
        "id": "D_FEEDBACK_MIRROR_INTENT_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_MIRROR_INTENT_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "locationBinding": "resolved_single_npc",
    "feedbackCode": "MIRROR_INTENT",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_PERSONAL_SCOPE",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "この返上願が語っているのは、杵吉本人の「祝いの一搗き役」についてだけだ。里全体の祭や、ほかの人の返事までひっくるめてはいけない。",
    "choices": [
      {
        "id": "D_FEEDBACK_PERSONAL_SCOPE_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_PERSONAL_SCOPE_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "locationBinding": "resolved_single_npc",
    "feedbackCode": "PERSONAL_SCOPE",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_PROXY_SCOPE",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "葛葉が小雨を代理に指名したことと、小雨自身が「いいよ」と引き受けたことは別の返事だ。小雨が実際に引き受けた時間と仕事の中身も読もう。",
    "choices": [
      {
        "id": "D_FEEDBACK_PROXY_SCOPE_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_PROXY_SCOPE_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "locationBinding": "resolved_single_npc",
    "feedbackCode": "PROXY_SCOPE",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_RETURN_IS_AGREEMENT",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "戻ってきたのは「祝い杵」であって、本人が祝い役に戻る約束じゃない。本物の返上願がいつ、何のために書かれたかを確かめよう。",
    "choices": [
      {
        "id": "D_FEEDBACK_RETURN_IS_AGREEMENT_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_RETURN_IS_AGREEMENT_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "locationBinding": "resolved_single_npc",
    "feedbackCode": "RETURN_IS_AGREEMENT",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_BENEFIT_IS_CONSENT",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "共同の仕組みが便利なことと、本人がその条件で頼んだことは別々に確かめよう。便利だからといって、本人の返事の代わりにはならない。",
    "choices": [
      {
        "id": "D_FEEDBACK_BENEFIT_IS_CONSENT_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_BENEFIT_IS_CONSENT_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "locationBinding": "resolved_single_npc",
    "feedbackCode": "BENEFIT_IS_CONSENT",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  },
  {
    "id": "D_FEEDBACK_RECORD_IS_AUTHORIZATION",
    "caseId": null,
    "npcId": "NPC_NAOKI",
    "situation": "present",
    "condition": {
      "all": []
    },
    "speakerJa": "手帖",
    "textJa": "手帖に相談を書き留めたからって、この申し立てに賛成したわけじゃない。誰がどの結果を落として、どんな主張として出したのかを示そう。",
    "choices": [
      {
        "id": "D_FEEDBACK_RECORD_IS_AUTHORIZATION_RETRY",
        "labelJa": "選び直す",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": []
      },
      {
        "id": "D_FEEDBACK_RECORD_IS_AUTHORIZATION_NOTE",
        "labelJa": "手帖を開く",
        "nextId": null,
        "condition": {
          "all": []
        },
        "effects": [],
        "uiAction": {
          "type": "openNotebook"
        }
      }
    ],
    "effects": [],
    "locationBinding": "resolved_single_npc",
    "feedbackCode": "RECORD_IS_AUTHORIZATION",
    "entryPolicy": "explicit_invalid_presentation_no_penalty"
  }
];

export const inferences = [
  {
    "id": "INF_C01_01",
    "caseId": "C01",
    "promptJa": "祝い杵は、なぜ棚からなくなったんだろう？",
    "requiredEvidenceIds": [
      "EV_C01_02",
      "EV_C01_04",
      "EV_C01_05"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C01_02",
        "EV_C01_04",
        "EV_C01_05"
      ]
    ],
    "choices": [
      {
        "id": "INF_C01_01_A",
        "textJa": "継丸が、もともとの割れを直すために無断で持ち出した。",
        "correct": true,
        "feedbackJa": "木片は持ち出し前から割れていたことを示し、宿の受付控えが継丸の持ち込みを裏付けている。修理中の杵の継ぎ目と年輪が、消えた祝い杵と同一の品であることを証明しているぞ！"
      },
      {
        "id": "INF_C01_01_B",
        "textJa": "返吉が折ってしまったので、そのまま捨てた。",
        "correct": false,
        "feedbackJa": "欠片を拾った人が、それを折った本人だとは限らない。しかも修理中の現物がちゃんと残っているぞ。"
      },
      {
        "id": "INF_C01_01_C",
        "textJa": "祝い杵は、毎日の餅つきに使われている。",
        "correct": false,
        "feedbackJa": "棚に寝かせてあった祝い杵と、今臼の前で動かしている普段の杵は別の品だ。屋号と年輪を照らし合わせてみよう。"
      }
    ],
    "reasoningJa": "木片は持ち出し前から割れていたことを示し、宿の受付控えが継丸の持ち込みを裏付けている。修理中の杵の継ぎ目と年輪が、消えた祝い杵と同一の品であることを証明しているぞ！",
    "hintsJa": [
      "棚から消えた「祝いの杵」と、今臼の前で動かしている「普段の杵」を分けて考えてみよう。",
      "宿の乾燥棚にある品と、昨夜拾われた木片を見比べてみよう。",
      "「三つ又の木片」「修理半券」「修理中の祝い杵」――この三つを組み合わせよう。"
    ],
    "grantsEvidenceIds": [],
    "stage": "field"
  },
  {
    "id": "INF_C02_01",
    "caseId": "C02",
    "promptJa": "橋の上の白い綱は、横綱が渡った証拠といえるかな？",
    "requiredEvidenceIds": [
      "EV_C02_01",
      "EV_C02_02",
      "EV_C02_03"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C02_01",
        "EV_C02_02",
        "EV_C02_03"
      ]
    ],
    "choices": [
      {
        "id": "INF_C02_01_A",
        "textJa": "綱は芦ノ山の物だが、橋の上では白足の荷物に使われていた。",
        "correct": true,
        "feedbackJa": "目撃者の鳴吉は顔を見ていない。茶屋の貸与控えと白足の荷紐が、綱の所有者と現場の運び手をはっきり切り分けているぞ！"
      },
      {
        "id": "INF_C02_01_B",
        "textJa": "名入りなのだから、渡ったのは横綱本人に違いない。",
        "correct": false,
        "feedbackJa": "持ち物の名札が示すのはあくまで「所有者」だ。あの場で誰が使っていたかは、別に確かめる必要があるな。"
      },
      {
        "id": "INF_C02_01_C",
        "textJa": "白足が綱を持っていたのだから、横綱を誘拐したのだ。",
        "correct": false,
        "feedbackJa": "本人同士と茶係の立会いがある貸与控えは、芦ノ山が自分の意思で貸したことを示しているぞ。"
      }
    ],
    "reasoningJa": "目撃者の鳴吉は顔を見ていない。茶屋の貸与控えと白足の荷紐が、綱の所有者と現場の運び手をはっきり切り分けているぞ！",
    "hintsJa": [
      "鳴吉が目撃したのは本人の「顔」だったか、それとも「持ち物」だったか。",
      "茶屋で、白い綱を誰が誰に貸したのか記録を確かめよう。",
      "「目撃証言」「名入り綱」「茶屋の貸与記録」――この三つを合わせよう。"
    ],
    "grantsEvidenceIds": [],
    "stage": "field"
  },
  {
    "id": "INF_C02_02",
    "caseId": "C02",
    "promptJa": "芦ノ山に、いったい何が起きたんだろう？",
    "requiredEvidenceIds": [
      "EV_C02_02",
      "EV_C02_03",
      "EV_C02_07"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C02_02",
        "EV_C02_03",
        "EV_C02_07"
      ]
    ],
    "choices": [
      {
        "id": "INF_C02_02_A",
        "textJa": "自分の意思で餅返しの稽古へ行っていた。綱の目撃は白足であり、所在不明の記録を訂正する。",
        "correct": true,
        "feedbackJa": "本人の安全と自由を直接確かめ、貸与記録によって紛らわしい目撃の誤解も解消できた。書置きを辿る前に本人を見つけた場合でも、十分に解決へ至るぞ！"
      },
      {
        "id": "INF_C02_02_B",
        "textJa": "本人が見つかっても、書置きの全手掛かりを回るまでは無事とはいえない。",
        "correct": false,
        "feedbackJa": "本人への直接確認は何より確かな証拠だ。不要な寄り道を解決の条件にする必要はないな。"
      },
      {
        "id": "INF_C02_02_C",
        "textJa": "恥ずかしがっていたので、何か盗みを隠しているのだ。",
        "correct": false,
        "feedbackJa": "照れや恥ずかしさは犯行の証拠にはならない。実際に確認できた行動と本人の言葉だけを根拠にしよう。"
      }
    ],
    "reasoningJa": "本人の安全と自由を直接確かめ、貸与記録によって紛らわしい目撃の誤解も解消できた。書置きを辿る前に本人を見つけた場合でも、十分に解決へ至るぞ！",
    "hintsJa": [
      "まずは本人が無事かどうか、自分の意思で動ける状態かを確かめよう。",
      "稽古の場所は棚田だ。書置きの裏か、鈴菜の稽古帳に手掛かりがあるぞ。",
      "「本人の確認」に「名入り綱」「貸与控え」を合わせて、二つの疑問に答えを出そう。"
    ],
    "grantsEvidenceIds": [],
    "stage": "field"
  },
  {
    "id": "INF_C03_01",
    "caseId": "C03",
    "promptJa": "十杯が八杯に減ったのは、どの段階だろう？",
    "requiredEvidenceIds": [
      "EV_C03_02",
      "EV_C03_03",
      "EV_C03_04"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C03_02",
        "EV_C03_03",
        "EV_C03_04"
      ]
    ],
    "choices": [
      {
        "id": "INF_C03_01_A",
        "textJa": "運ぶ前。底を一段上げた枡で、標準の五分の四しか量れていなかった。",
        "correct": true,
        "feedbackJa": "「標準一杯＝秤目10」という換算と、荷渡し直前の「正味80」を合わせれば、渡された時点で八杯だったと分かる。さらに店の枡が五分の四しか入らない実演が、計量段階の不足とぴたりと一致するぞ！"
      },
      {
        "id": "INF_C03_01_B",
        "textJa": "俵太が運ぶ途中で二杯抜き取った。",
        "correct": false,
        "feedbackJa": "秤札の数字だけを見るんじゃなく、「一杯＝十目」の実演と合わせて計算しよう。80÷10＝8なのだから、荷を渡す前からすでに八杯だったんだ。"
      },
      {
        "id": "INF_C03_01_C",
        "textJa": "米が道中で急に縮んで小さくなった。",
        "correct": false,
        "feedbackJa": "同じ乾燥条件で保存した控え米を使っても、店の枡の量は五分の四にしかならない。差の原因は米じゃなく器具側にあるな。"
      }
    ],
    "reasoningJa": "「標準一杯＝秤目10」という換算と、荷渡し直前の「正味80」を合わせれば、渡された時点で八杯だったと分かる。さらに店の枡が五分の四しか入らない実演が、計量段階の不足とぴたりと一致するぞ！",
    "hintsJa": [
      "荷渡し前の札には、杯数の答えは直接書かれていない。秤の目盛りをよく読もう。",
      "同じ米を標準桝で一杯、同じ秤に載せると十目になる。袋の重さはすでに引かれているぞ。",
      "「名入り桝」「比較実演」「出発前の秤札」を組み合わせよう。八十目を一杯の十目で割れば、渡された時点で八杯だったと分かる。"
    ],
    "grantsEvidenceIds": [],
    "stage": "field"
  },
  {
    "id": "INF_C03_02",
    "caseId": "C03",
    "promptJa": "誰の、どの行為まで証明できるだろう？",
    "requiredEvidenceIds": [
      "EV_C03_04",
      "EV_C03_05",
      "EV_C03_06",
      "EV_C03_07",
      "EV_C03_03"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C03_04",
        "EV_C03_05",
        "EV_C03_06",
        "EV_C03_07",
        "EV_C03_03"
      ]
    ],
    "choices": [
      {
        "id": "INF_C03_02_A",
        "textJa": "俵九郎が取引時に上げ底の枡で量った。俵太の道中抜取りは否定される。",
        "correct": true,
        "feedbackJa": "部材の控えと使用記録が、この上げ底枡を取引当日に結びつける。「秤目80」を同じ米の一杯十目で換算した受渡し前の八杯と、同じ乾燥条件での実演が、道中の抜き取りや水分変化という言い逃れを退けるぞ！"
      },
      {
        "id": "INF_C03_02_B",
        "textJa": "竹次が板を作ったのだから、すべての不正の首謀者だ。",
        "correct": false,
        "feedbackJa": "保護板としての材料製作と、それを一段高い位置に取り付けて不正に量った行為は明確に区別しなきゃいけないな。"
      },
      {
        "id": "INF_C03_02_C",
        "textJa": "この市にある米は、どれもこれも不正な米だ。",
        "correct": false,
        "feedbackJa": "証明されたのはあくまで「この十杯売りの取引」についてだ。同じ町にある共同蔵の荷はまったく別の取引だぞ。"
      }
    ],
    "reasoningJa": "部材の控えと使用記録が、この上げ底枡を取引当日に結びつける。「秤目80」を同じ米の一杯十目で換算した受渡し前の八杯と、同じ乾燥条件での実演が、道中の抜き取りや水分変化という言い逃れを退けるぞ！",
    "hintsJa": [
      "今ある枡が、まさに「あの取引」に使われたことを示す記録を探そう。",
      "焼印、縁の欠け、釘頭の図が一致するかを比べよう。",
      "「比較実演」「秤札」「合わせ板控え」「使用引渡記録」「控え米」をまとめて提示しよう。秤の生の数値と、その換算をセットで示すのが鍵だ。"
    ],
    "grantsEvidenceIds": [],
    "stage": "field"
  },
  {
    "id": "INF_C04_01",
    "caseId": "C04",
    "promptJa": "晴れた日に、どうして手紙の一行が隠れてしまったんだろう？",
    "requiredEvidenceIds": [
      "EV_C04_01",
      "EV_C04_02",
      "EV_C04_03",
      "EV_C04_04"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C04_01",
        "EV_C04_02",
        "EV_C04_03",
        "EV_C04_04"
      ]
    ],
    "choices": [
      {
        "id": "INF_C04_01_A",
        "textJa": "局地的な天気雨で米糊の仮札と折返しが貼り合い、続きが見えなくなった。",
        "correct": true,
        "feedbackJa": "晴天と通り雨は同時に起こり得る。複製試料で貼り付く過程を再現し、原本のひと続きの紙に全文が残っていることを確認できたぞ！"
      },
      {
        "id": "INF_C04_01_B",
        "textJa": "晴天だったのだから、雨に降られたという話はすべて嘘だ。",
        "correct": false,
        "feedbackJa": "稲荷の現場再現では、青空と局地的な雨が同時に降る様子をはっきりと観察できるぞ。"
      },
      {
        "id": "INF_C04_01_C",
        "textJa": "糊の跡が残っているのだから、小雨が悪意で隠したのだ。",
        "correct": false,
        "feedbackJa": "同じ糊の跡は、偶然の雨濡れと乾燥によっても生じる。跡があるという事実だけで、誰かの悪意や意図まで決めつけちゃいけないな。"
      }
    ],
    "reasoningJa": "晴天と通り雨は同時に起こり得る。複製試料で貼り付く過程を再現し、原本のひと続きの紙に全文が残っていることを確認できたぞ！",
    "hintsJa": [
      "その場の天気と、紙の折り方を切り分けて調べてみよう。",
      "楓峡にある同じ紙と米糊を使って、原本を濡らさずに試してみよう。",
      "「閉じた手紙」「天気雨」「米糊試料」「開いた全文」の四つが必要だ。"
    ],
    "grantsEvidenceIds": [],
    "stage": "field"
  },
  {
    "id": "INF_C04_02",
    "caseId": "C04",
    "promptJa": "葛葉は、本来なにを頼んでいたんだろう？",
    "requiredEvidenceIds": [
      "EV_C04_04",
      "EV_C04_05",
      "EV_C04_06"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C04_04",
        "EV_C04_05",
        "EV_C04_06"
      ]
    ],
    "choices": [
      {
        "id": "INF_C04_02_A",
        "textJa": "本人は欠席し、小雨を代理に出す。里の餅つきはそのまま続ける。",
        "correct": true,
        "feedbackJa": "原本の全文と、事件前に桃音が預かった控え、さらに小雨への手渡し控えがすべて一致している。本人の欠席・代理の派遣・里の辞退はまったく別のことだ！"
      },
      {
        "id": "INF_C04_02_B",
        "textJa": "「参れません」と書いてあるのだから、里全体の辞退だ。",
        "correct": false,
        "feedbackJa": "主語と続く一文を読み飛ばしているな。本人が出席できないことは、里の行事そのものの中止を意味しないぞ。"
      },
      {
        "id": "INF_C04_02_C",
        "textJa": "あとから思い直しただけで、最初はやはり辞退だった。",
        "correct": false,
        "feedbackJa": "桃源郷に残されていた事件前の控えにも、最初から代理を立てることと祭の継続が明記されているぞ。"
      }
    ],
    "reasoningJa": "原本の全文と、事件前に桃音が預かった控え、さらに小雨への手渡し控えがすべて一致している。本人の欠席・代理の派遣・里の辞退はまったく別のことだ！",
    "hintsJa": [
      "葛葉ひとりの欠席と、里全体の意向を分けて考えよう。",
      "「後から書き加えたのだろう」という疑いを、桃源郷の控えで確かめよう。",
      "「開いた全文」「桃源郷の控え」「小雨への手渡し控え」の三つを比べよう。"
    ],
    "grantsEvidenceIds": [],
    "stage": "field"
  },
  {
    "id": "INF_C05_01",
    "caseId": "C05",
    "promptJa": "A17の十二俵は、いったい何度出荷されたんだろう？",
    "requiredEvidenceIds": [
      "EV_C05_02",
      "EV_C05_03",
      "EV_C05_04",
      "EV_C05_05",
      "EV_C05_12"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C05_02",
        "EV_C05_03",
        "EV_C05_04",
        "EV_C05_05",
        "EV_C05_12"
      ]
    ],
    "choices": [
      {
        "id": "INF_C05_01_A",
        "textJa": "発送は一度きり。海風と竜宮の記録は、同じ十二俵の保管交代だ。",
        "correct": true,
        "feedbackJa": "同じ年・祭・通し番号、元の預かりを閉じる印、後継番号R17、そして目の前にある現物――すべてが一本の線で繋がっているぞ！"
      },
      {
        "id": "INF_C05_01_B",
        "textJa": "受取札が二枚あるのだから、二十四俵あったはずだ。",
        "correct": false,
        "feedbackJa": "札を受け取った回数と、新たに出荷された物量を混同しているな。"
      },
      {
        "id": "INF_C05_01_C",
        "textJa": "十二俵という数字が同じなら、どんな荷とでも相殺できる。",
        "correct": false,
        "feedbackJa": "数の一致だけじゃなく、同一の便・通し番号・預替の連続性を確かめる必要があるぞ。"
      }
    ],
    "reasoningJa": "同じ年・祭・通し番号、元の預かりを閉じる印、後継番号R17、そして目の前にある現物――すべてが一本の線で繋がっているぞ！",
    "hintsJa": [
      "発行された「札の数」と、実際の「物の数」を分けて考えよう。",
      "通し番号「A17-01〜12」と、預替番号「R17」の繋がりを追ってみよう。",
      "「棚田発送」「海風預替」「竜宮受取」「現物照合」「預替見本」――この五つをつなごう。"
    ],
    "grantsEvidenceIds": [],
    "stage": "field"
  },
  {
    "id": "INF_C05_02",
    "caseId": "C05",
    "promptJa": "三便三十俵に、本当に不足はあるんだろうか？",
    "requiredEvidenceIds": [
      "EV_C05_01",
      "EV_C05_02",
      "EV_C05_03",
      "EV_C05_04",
      "EV_C05_05",
      "EV_C05_06",
      "EV_C05_07",
      "EV_C05_08",
      "EV_C05_09",
      "EV_C05_10",
      "EV_C05_11",
      "EV_C05_12"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C05_01",
        "EV_C05_02",
        "EV_C05_03",
        "EV_C05_04",
        "EV_C05_05",
        "EV_C05_06",
        "EV_C05_07",
        "EV_C05_08",
        "EV_C05_09",
        "EV_C05_10",
        "EV_C05_11",
        "EV_C05_12"
      ]
    ],
    "choices": [
      {
        "id": "INF_C05_02_A",
        "textJa": "対象三便は「12＋8＋10＝30俵」すべて現存し、二重計上した60との差30は架空の不足だ。",
        "correct": true,
        "feedbackJa": "三便それぞれを出荷・中継・到着まで一本につなぎ、すでに閉じられた中継の預かりを再び納入義務に数えないことで真相が解けるぞ！"
      },
      {
        "id": "INF_C05_02_B",
        "textJa": "この世界では、これまで一度も米の不正など起きなかった。",
        "correct": false,
        "feedbackJa": "この審理で確認したのはあくまで対象三便の存否だ。市の十杯売りにおける不正は、別の取引で現実に起きているぞ。"
      },
      {
        "id": "INF_C05_02_C",
        "textJa": "三十俵しか見つからないのだから、残りの三十俵を誰かが隠したのだ。",
        "correct": false,
        "feedbackJa": "60俵という数字は、同じ荷の中継と到着を二重に足し合わせた数にすぎない。新規に発送されたのは最初から30俵だけだぞ。"
      }
    ],
    "reasoningJa": "三便それぞれを出荷・中継・到着まで一本につなぎ、すでに閉じられた中継の預かりを再び納入義務に数えないことで真相が解けるぞ！",
    "hintsJa": [
      "A17だけでなく、B08とC10も同じやり方で辿ってみよう。",
      "各便の通し番号と、前の預かりが閉じられた印を確かめよう。",
      "12・8・10の三本の経路を一本ずつ結び、実物30俵と帳簿60俵の食い違いを説明しよう。"
    ],
    "grantsEvidenceIds": [],
    "stage": "court"
  },
  {
    "id": "INF_C06_01",
    "caseId": "C06",
    "promptJa": "本物の署名は、祭の取りやめへの同意を示しているんだろうか？",
    "requiredEvidenceIds": [
      "EV_C06_01",
      "EV_C06_02",
      "EV_C06_03",
      "EV_C06_04",
      "EV_C06_05",
      "EV_C06_08"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C06_01",
        "EV_C06_02",
        "EV_C06_03",
        "EV_C06_04",
        "EV_C06_05",
        "EV_C06_08"
      ]
    ],
    "choices": [
      {
        "id": "INF_C06_01_A",
        "textJa": "元の目的は各里の餅つき継続の祈願。署名片だけが別の見出しへ転用された。",
        "correct": true,
        "feedbackJa": "三分割票の番号・切れ目・割印をつなぎ合わせれば、お寺の上段と本人の控えが同じひとつの願いを指し示しているぞ！"
      },
      {
        "id": "INF_C06_01_B",
        "textJa": "名前が本物なのだから、上の文面も承認したことになる。",
        "correct": false,
        "feedbackJa": "署名した「その瞬間」に上に書かれていた文と、あとから上に付け替えられた文を区別しよう。"
      },
      {
        "id": "INF_C06_01_C",
        "textJa": "連名書の署名は、すべて誰かが書いた偽物だった。",
        "correct": false,
        "feedbackJa": "署名片の筆跡自体は本人のものだ。どの文面に対して書かれたのかこそが争点だぞ。"
      }
    ],
    "reasoningJa": "三分割票の番号・切れ目・割印をつなぎ合わせれば、お寺の上段と本人の控えが同じひとつの願いを指し示しているぞ！",
    "hintsJa": [
      "「名前が本物か」と「何の上に署名したか」を切り分けて考えよう。",
      "上段・下段・右の本人控えという三分割の構造を、見本票で確かめよう。",
      "「連名書」「実演」「寺の上段」「二人の控え」「接続照合」を揃えて提示しよう。"
    ],
    "grantsEvidenceIds": [],
    "stage": "field"
  },
  {
    "id": "INF_C06_02",
    "caseId": "C06",
    "promptJa": "「お寺が取消の署名を集めた」という説明は成り立つかな？",
    "requiredEvidenceIds": [
      "EV_C06_03",
      "EV_C06_06",
      "EV_C06_07",
      "EV_C06_08",
      "EV_C06_09"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C06_03",
        "EV_C06_06",
        "EV_C06_07",
        "EV_C06_08",
        "EV_C06_09"
      ]
    ],
    "choices": [
      {
        "id": "INF_C06_02_A",
        "textJa": "お寺での用途は祈願だった。寺から渡したのは署名片だけで、取消の見出しは付いていなかった。",
        "correct": true,
        "feedbackJa": "製作時の版下、寺の原本片、本人の控え、運搬の控えが、それぞれ独立にお寺での本来の用途を示している。誰が貼り替えたかは次の争点だ！"
      },
      {
        "id": "INF_C06_02_B",
        "textJa": "お寺に署名の原本があったのだから、灯庵が取消を作ったのだ。",
        "correct": false,
        "feedbackJa": "元の保管場所がお寺だというだけじゃ、あとから見出しを付け替えた張本人は決まらないな。"
      },
      {
        "id": "INF_C06_02_C",
        "textJa": "取消が無効なのだから、全員が京の祭に出席する義務がある。",
        "correct": false,
        "feedbackJa": "取消に同意していないことと、特定の祭へ強制的に参加させることはまったく別の話だぞ。"
      }
    ],
    "reasoningJa": "製作時の版下、寺の原本片、本人の控え、運搬の控えが、それぞれ独立にお寺での本来の用途を示している。誰が貼り替えたかは次の争点だ！",
    "hintsJa": [
      "お寺から送り出される前と、送り出された後の紙の姿を分けよう。",
      "使いの羽文は、何を、どんな用途の荷として受け取ったんだろう？",
      "「寺の上段」「紙継ぎ見本」「受渡控え」「接続照合」「版下」の五つが揃えば、前後の経緯がはっきりするぞ。"
    ],
    "grantsEvidenceIds": [],
    "stage": "court"
  },
  {
    "id": "INF_C07_01",
    "caseId": "C07",
    "promptJa": "送り火の写生から、どこまでのことが分かるだろう？",
    "requiredEvidenceIds": [
      "EV_C07_06",
      "EV_C07_07",
      "EV_C07_10"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C07_06",
        "EV_C07_07",
        "EV_C07_10"
      ]
    ],
    "choices": [
      {
        "id": "INF_C07_01_A",
        "textJa": "見えたまま描いたという説明には疑問が残る。だが不在の弁解を崩すのは、独立した立会い記録だ。",
        "correct": true,
        "feedbackJa": "視点の食い違いだけじゃ、記憶違いや絵の整形という可能性を排除できない。実際の読返し立会い記録こそが、本人の受領と所在を直接裏付けるんだ！"
      },
      {
        "id": "INF_C07_01_B",
        "textJa": "絵の見え方が違うのだから、それだけで筆丸が全事件の犯人だ。",
        "correct": false,
        "feedbackJa": "視点の食い違いはあくまで補助的な証拠にすぎない。提出責任や事前の知識を示す証拠が別に必要だぞ。"
      },
      {
        "id": "INF_C07_01_C",
        "textJa": "京が夜だったなら、初日の出の浦も必ず同じ夜だったはずだ。",
        "correct": false,
        "feedbackJa": "この世界の昼夜や季節の変化は地域ごとの演出だ。出来事の順序を辿るには、祭暦の記録を使う必要があるぞ。"
      }
    ],
    "reasoningJa": "視点の食い違いだけじゃ、記憶違いや絵の整形という可能性を排除できない。実際の読返し立会い記録こそが、本人の受領と所在を直接裏付けるんだ！",
    "hintsJa": [
      "絵は写真と違って記憶で描くこともできる。何が直接の証拠になるかを切り分けよう。",
      "三地点での再現観察と、受取刻の立会い記録を突き合わせてみよう。",
      "「送り火観察」「見晴らしの写生」「立会い記録」を選び、視点の食い違いだけでは断定できないと説明しよう。"
    ],
    "grantsEvidenceIds": [],
    "stage": "field"
  },
  {
    "id": "INF_C07_02",
    "caseId": "C07",
    "promptJa": "訂正と元資料の本当の意味は、筆丸に伝わっていなかったんだろうか？",
    "requiredEvidenceIds": [
      "EV_C01_06",
      "EV_C04_07",
      "EV_C07_02",
      "EV_C07_10",
      "EV_C07_11"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C01_06",
        "EV_C04_07",
        "EV_C07_02",
        "EV_C07_10",
        "EV_C07_11"
      ]
    ],
    "choices": [
      {
        "id": "INF_C07_02_A",
        "textJa": "間違いなく届いており、筆丸は要旨を読み返して内容を理解していた。",
        "correct": true,
        "feedbackJa": "単なる封筒の受領印じゃなく、正しい訂正要旨を自分の言葉で読み返した記録と、独立した立会い人の証言が残っているぞ！"
      },
      {
        "id": "INF_C07_02_B",
        "textJa": "受領印が押してあるのだから、それだけで中身を読んだことになる。",
        "correct": false,
        "feedbackJa": "受け取ることと、中身を読んで理解することは別だ。要旨の読返しと立会人の記録まで確認しよう。"
      },
      {
        "id": "INF_C07_02_C",
        "textJa": "最後の裁判の席で知ったのだから、昔の提出も故意だった。",
        "correct": false,
        "feedbackJa": "裁判で後から知った事実を、過去の時点へさかのぼらせちゃいけない。提出より前に残された訂正の記録を使おう。"
      }
    ],
    "reasoningJa": "単なる封筒の受領印じゃなく、正しい訂正要旨を自分の言葉で読み返した記録と、独立した立会い人の証言が残っているぞ！",
    "hintsJa": [
      "「紙を受け取ること」と「中身を読んで理解すること」を分けて考えよう。",
      "初日の出と伏見の訂正控えには、筆丸自身が要旨を読み返した言葉が残っているぞ。",
      "「祝い杵の訂正」「婚礼の手紙の訂正」「全訂正受領簿」「立会い記録」の四つを揃えよう。"
    ],
    "grantsEvidenceIds": [],
    "stage": "field"
  },
  {
    "id": "INF_C07_03",
    "caseId": "C07",
    "promptJa": "誰の、どんな行為がこの大きな謎の答えなんだろう？",
    "requiredEvidenceIds": [
      "EV_C07_01",
      "EV_C07_02",
      "EV_C07_03",
      "EV_C07_04",
      "EV_C07_05",
      "EV_C07_09",
      "EV_C07_10",
      "EV_C07_11",
      "EV_C07_12"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C07_01",
        "EV_C07_02",
        "EV_C07_03",
        "EV_C07_04",
        "EV_C07_05",
        "EV_C07_09",
        "EV_C07_10",
        "EV_C07_11",
        "EV_C07_12"
      ]
    ],
    "choices": [
      {
        "id": "INF_C07_03_A",
        "textJa": "筆丸は相談も解決も知りながら、返事側を外した原票を「現在も未解決」の根拠に仕立て、自らの申し立てとして提出した。",
        "correct": true,
        "feedbackJa": "本物の相談を否定する必要はない。完成見開きからの切り出し、事前の読み返し、左欄だけを採る割付、綴じ時点と受付時点で一致する見出しと本文――これらすべてが、結果を知ったうえでの意図的な現在形の提出を裏付けているぞ！"
      },
      {
        "id": "INF_C07_03_B",
        "textJa": "七件ともすべて筆丸が裏で糸を引き、祝い杵を盗み、横綱をさらったのだ。",
        "correct": false,
        "feedbackJa": "前半で明らかになったそれぞれの本当の原因を消してしまう誤りだ。筆丸が行ったのは、解決済み記録の切り取りと改変だぞ。"
      },
      {
        "id": "INF_C07_03_C",
        "textJa": "みんなを一か所へ集めたいという気持ち自体が悪いので有罪だ。",
        "correct": false,
        "feedbackJa": "調整の提案や理想そのものが罪なんじゃない。理解していたはずの訂正を意図的に隠した、その具体的な行為を証明しよう。"
      }
    ],
    "reasoningJa": "本物の相談を否定する必要はない。完成見開きからの切り出し、事前の読み返し、左欄だけを採る割付、綴じ時点と受付時点で一致する見出しと本文――これらすべてが、結果を知ったうえでの意図的な現在形の提出を裏付けているぞ！",
    "hintsJa": [
      "「当初の相談が真実だったこと」と「提出時にも未解決だったこと」は別問題だ。",
      "「完成見開き → 読み返し → 左欄の抜粋 →『現在も未解決』の見出し → 提出」という一本の線をつなごう。",
      "墨の物証だけにも、人柄や集約案への好き嫌いにも頼らず、原票の対応・受領・割付・綴じ・受付をすべて合わせよう。"
    ],
    "grantsEvidenceIds": [],
    "stage": "court"
  },
  {
    "id": "INF_C07_04",
    "caseId": "C07",
    "promptJa": "提出された相談欄は、いつの時点の紙から切り出されたものだろう？",
    "requiredEvidenceIds": [
      "EV_C01_06",
      "EV_C03_08",
      "EV_C07_03",
      "EV_C07_12",
      "EV_C07_13"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C01_06",
        "EV_C03_08",
        "EV_C07_03",
        "EV_C07_12",
        "EV_C07_13"
      ]
    ],
    "choices": [
      {
        "id": "INF_C07_04_A",
        "textJa": "返事まで書かれた見開きから、相談側だけが切り出された。古い未記入の写しなどではない。",
        "correct": true,
        "feedbackJa": "開いた解決控えの右下にある文字と、提出された左片の反転墨が折り線を軸にぴたりと一致する。受理時の写しにも同じ跡があるため、法廷で後から付けた墨でもない。結果が書き込まれた後の原票が使われたと断定できるぞ！"
      },
      {
        "id": "INF_C07_04_B",
        "textJa": "解決前に切り離した左片へ、後から別紙の訂正が偶然触れただけだ。完成見開きは使われていない。",
        "correct": false,
        "feedbackJa": "祝い杵と米売りの立会い控えは、返事が書き込まれ、まだ一枚に繋がった状態の見開きを記録している。その相談欄が提出片と一致するんだ。別紙との偶然の接触じゃ、この原票の来歴は説明できないぞ。"
      },
      {
        "id": "INF_C07_04_C",
        "textJa": "墨の写りは、今回の検分で初めて付いたものだ。提出したときには無かった。",
        "correct": false,
        "feedbackJa": "独立した受理時の写しにも、同じ二組の反転墨がしっかり残っている。検分では原物に墨を付けず、写しの紙だけで実演を行っているんだ。"
      }
    ],
    "reasoningJa": "開いた解決控えの右下にある文字と、提出された左片の反転墨が折り線を軸にぴたりと一致する。受理時の写しにも同じ跡があるため、法廷で後から付けた墨でもない。結果が書き込まれた後の原票が使われたと断定できるぞ！",
    "hintsJa": [
      "相談の文面が本物であることは認めよう。だがその紙に、「相談より後の出来事」が残した跡はないだろうか。",
      "見本札の右欄を左へ折ると、乾いていない文字は向かい側の余白へ鏡文字になって写る。外側の裏ではないぞ。",
      "「祝い杵と米売りの完成見開き」「折り比べ」「提出片の比較」「受理時の写し」を重ねよう。解決前の白い右欄では決して作れない写りだ。"
    ],
    "grantsEvidenceIds": [],
    "stage": "court"
  },
  {
    "id": "INF_C07_05",
    "caseId": "C07",
    "promptJa": "偽りの「全里辞退」を退けたあと、杵吉の返上願はどう扱うべきだろう？",
    "requiredEvidenceIds": [
      "EV_C01_07"
    ],
    "acceptedEvidenceSets": [
      [
        "EV_C01_07",
        "EV_C01_06"
      ],
      [
        "EV_C01_07",
        "EV_C01_90"
      ]
    ],
    "choices": [
      {
        "id": "INF_C07_05_A",
        "textJa": "祝い杵は返却された。しかし杵吉は祝いの一搗き役を返上する。その両方を本人の返事として残す。",
        "correct": true,
        "feedbackJa": "返上願の対象は祝いの一搗き役であり、紛失騒ぎより前に本人が書いたものだ。浦で確かめたのはあくまで道具の返却であって、出演への再同意じゃない。取消の虚偽を正したからといって、真正な個人の辞退まで消しちゃいけないんだ！"
      },
      {
        "id": "INF_C07_05_B",
        "textJa": "今年だけ休む扱いに直し、祭が落ち着く来年の復帰は予定に入れておく。",
        "correct": false,
        "feedbackJa": "原文は「本年より返上」であり、一年限りの休みじゃない。どれほど善意の落とし所であっても、本人がしていない承諾を勝手に書き足してはならないぞ。"
      },
      {
        "id": "INF_C07_05_C",
        "textJa": "本当の辞退か確かめるため、理由と後任の説明が揃うまで返上を保留する。",
        "correct": false,
        "feedbackJa": "本人が書いた特定の役の返上はすでに確認されている。健康状態の説明や後任探しを新たな成立条件にしてはならない。また、ひとりの辞退から全里の取消権限が生まれるわけでもないぞ。"
      }
    ],
    "reasoningJa": "返上願の対象は祝いの一搗き役であり、紛失騒ぎより前に本人が書いたものだ。浦で確かめたのはあくまで道具の返却であって、出演への再同意じゃない。取消の虚偽を正したからといって、真正な個人の辞退まで消しちゃいけないんだ！",
    "hintsJa": [
      "「戻った」という言葉の主語を確かめよう。戻ったのは「杵」か、それとも「祝い役」か。",
      "返上願は、杵が消えたあとの言い訳じゃない。相談より前の日付と、そこに書かれた特定の役名を読もう。",
      "「杵吉の返上願」と「祝い杵の返却確認」を組み合わせて、「道具は戻るが、本人の辞退は残る」と答えよう。"
    ],
    "grantsEvidenceIds": [],
    "stage": "court"
  }
];

export const trials = [
  {
    "id": "TR_C05",
    "caseId": "C05",
    "venueLocationId": "LOC_KYO_COURT",
    "venueNameJa": "京の評定所",
    "readyCondition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_08"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_09"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_10"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_11"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_12"
        }
      ]
    },
    "roles": {
      "judgeNpcId": "NPC_SHIRAE",
      "clerkNpcId": "NPC_NAOKI",
      "claimantNpcId": "NPC_FUDEM",
      "presenter": "player"
    },
    "openingJa": "白枝「本日は、米がそもそも何俵あったのか、そして誰がどこで預かったのか――この二つを切り分けて伺います。札の枚数だけで米を増やさぬよう、ご注意ください。」",
    "rounds": [
      {
        "id": "TR_C05_R01",
        "testimony": {
          "npcId": "NPC_FUDEM",
          "lines": [
            {
              "id": "TR_C05_R01_S01",
              "textJa": "海風は十二俵を受け取り、竜宮もまた十二俵を受け取った。手元に残る受取の札は、確かに二枚ございます。"
            },
            {
              "id": "TR_C05_R01_S02",
              "textJa": "ならば本来、この二か所には合わせて二十四俵が揃っていなければなりません。"
            },
            {
              "id": "TR_C05_R01_S03",
              "textJa": "ところが現物は十二俵しかない。どちらかが残りの十二俵を隠し持っていると考えたのです。"
            }
          ]
        },
        "challenge": {
          "statementId": "TR_C05_R01_S02",
          "acceptedEvidenceSets": [
            [
              "EV_C05_02",
              "EV_C05_03",
              "EV_C05_04",
              "EV_C05_05",
              "EV_C05_12"
            ]
          ],
          "choices": [
            {
              "id": "TR_C05_R01_A",
              "textJa": "二枚の札は同じA17の保管交代だ！　海風の預かりは「預替」で閉じられている！",
              "correct": true,
              "feedbackJa": "通し番号と預替の後継番号が一本に繋がり、竜宮にはその同じ十二俵がちゃんと残っている。新しい出荷が二度あったわけじゃないんだ！"
            },
            {
              "id": "TR_C05_R01_B",
              "textJa": "亀は長生きだから、潮蔵の記憶は絶対に正しい！",
              "correct": false,
              "feedbackJa": "寿命や人柄じゃ数量の証明にならない。通し番号と現物を照合しよう。"
            },
            {
              "id": "TR_C05_R01_C",
              "textJa": "古い札ばかりなので、どちらも無視して構わない！",
              "correct": false,
              "feedbackJa": "記録を捨てるんじゃなく、同じ荷が辿った別々の段階として読み解く必要があるぞ。"
            }
          ]
        },
        "successJa": "通し番号と預替の後継番号が一本に繋がり、竜宮にはその同じ十二俵がちゃんと残っている。新しい出荷が二度あったわけじゃないんだ！",
        "failureJa": "その資料が示している事実と、この証言の主張は、どこで食い違っていますか？　落ち着いて見直しましょう。資料は失われません。",
        "grantInferenceId": "INF_C05_01",
        "requiresCompletedRoundIds": []
      },
      {
        "id": "TR_C05_R02",
        "testimony": {
          "npcId": "NPC_FUDEM",
          "lines": [
            {
              "id": "TR_C05_R02_S01",
              "textJa": "よろしい、A17がひとつの便であったことは認めましょう。"
            },
            {
              "id": "TR_C05_R02_S02",
              "textJa": "ですが、残るB08とC10の不足については、まだ何の説明もなされておりませんよ。"
            },
            {
              "id": "TR_C05_R02_S03",
              "textJa": "数字が同じに見えるだけで、実際には別々の便だったのかもしれませんからね。"
            }
          ]
        },
        "challenge": {
          "statementId": "TR_C05_R02_S02",
          "acceptedEvidenceSets": [
            [
              "EV_C05_06",
              "EV_C05_07",
              "EV_C05_08",
              "EV_C05_09",
              "EV_C05_10",
              "EV_C05_11"
            ]
          ],
          "choices": [
            {
              "id": "TR_C05_R02_A",
              "textJa": "B08の八俵とC10の十俵も、年・祭・番号・預替の繋がりと現物がすべて一致している！",
              "correct": true,
              "feedbackJa": "ただ数合わせをしたんじゃない。送り元の控え、中継所の閉鎖印、到着先の現物照合を、各便ごとに一本ずつつなぎ切ったんだ！"
            },
            {
              "id": "TR_C05_R02_B",
              "textJa": "A17が合っていたのだから、残りも調べず同じだとみなす！",
              "correct": false,
              "feedbackJa": "残りの二便についても、それぞれ個別に出荷と現存を確認しなきゃいけないな。"
            },
            {
              "id": "TR_C05_R02_C",
              "textJa": "雪の町には冬しか荷が届かないから、B08は別の年の物だ！",
              "correct": false,
              "feedbackJa": "地域の雪景色は事件の時計じゃない。伝票に記された年と祭番号を読もう。"
            }
          ]
        },
        "successJa": "ただ数合わせをしたんじゃない。送り元の控え、中継所の閉鎖印、到着先の現物照合を、各便ごとに一本ずつつなぎ切ったんだ！",
        "failureJa": "その資料が示している事実と、この証言の主張は、どこで食い違っていますか？　落ち着いて見直しましょう。資料は失われません。",
        "grantInferenceId": null,
        "requiresCompletedRoundIds": [
          "TR_C05_R01"
        ]
      },
      {
        "id": "TR_C05_R03",
        "testimony": {
          "npcId": "NPC_FUDEM",
          "lines": [
            {
              "id": "TR_C05_R03_S01",
              "textJa": "私の集計表が示す六十俵に対し、確認された現物は三十俵にすぎません。"
            },
            {
              "id": "TR_C05_R03_S02",
              "textJa": "ゆえにやはり、「三十俵が不足している」という結論は揺るがないのです。"
            },
            {
              "id": "TR_C05_R03_S03",
              "textJa": "だからこそ、各里の保管を京へ一本化すべきだと申し上げているのですよ！"
            }
          ]
        },
        "challenge": {
          "statementId": "TR_C05_R03_S02",
          "acceptedEvidenceSets": [
            [
              "EV_C05_01",
              "EV_C05_02",
              "EV_C05_03",
              "EV_C05_04",
              "EV_C05_05",
              "EV_C05_06",
              "EV_C05_07",
              "EV_C05_08",
              "EV_C05_09",
              "EV_C05_10",
              "EV_C05_11",
              "EV_C05_12"
            ]
          ],
          "choices": [
            {
              "id": "TR_C05_R03_A",
              "textJa": "表の「六十」は同じ三便を二度数えた数字だ！　最初に出荷された三十俵はすべて揃っている！",
              "correct": true,
              "feedbackJa": "対象三便の新規出荷量は「十二＋八＋十＝三十俵」。預かりの履歴を二重に足した六十との差に、実物の不足なんて存在しないんだ！"
            },
            {
              "id": "TR_C05_R03_B",
              "textJa": "この世に米の不正などひとつもなく、枡の事件もなかった！",
              "correct": false,
              "feedbackJa": "市の枡売りにおける不正は別の取引で確かに存在した。判決の範囲を不当に広げすぎちゃいけないな。"
            },
            {
              "id": "TR_C05_R03_C",
              "textJa": "足りない分は、各地の祭をやめてしまえば解決する！",
              "correct": false,
              "feedbackJa": "そもそも不足が存在するかどうかが争点だ。対策を先に決めて結論を歪めちゃいけないぞ。"
            }
          ]
        },
        "successJa": "対象三便の新規出荷量は「十二＋八＋十＝三十俵」。預かりの履歴を二重に足した六十との差に、実物の不足なんて存在しないんだ！",
        "failureJa": "その資料が示している事実と、この証言の主張は、どこで食い違っていますか？　落ち着いて見直しましょう。資料は失われません。",
        "grantInferenceId": "INF_C05_02",
        "requiresCompletedRoundIds": [
          "TR_C05_R01",
          "TR_C05_R02"
        ]
      }
    ],
    "reconstruction": {
      "promptJa": "出来事と記録を、証明できた正しい順番に並べてください。",
      "options": [
        {
          "id": "TR_C05_ORDER_1",
          "textJa": "三便を合わせて三十俵、それぞれの送り元から出荷する。"
        },
        {
          "id": "TR_C05_ORDER_2",
          "textJa": "中継所が同じ通し番号のまま荷を仮預かりする。"
        },
        {
          "id": "TR_C05_ORDER_3",
          "textJa": "預替によって中継所の預かりを閉じ、最終の蔵が荷を受け取る。"
        },
        {
          "id": "TR_C05_ORDER_4",
          "textJa": "到着した蔵で、現物三十俵が揃っていることを確認する。"
        },
        {
          "id": "TR_C05_ORDER_5",
          "textJa": "中継と到着を二重に数えた「六十俵」の集計表を訂正する。"
        }
      ],
      "correctOrder": [
        "TR_C05_ORDER_1",
        "TR_C05_ORDER_2",
        "TR_C05_ORDER_3",
        "TR_C05_ORDER_4",
        "TR_C05_ORDER_5"
      ],
      "feedbackJa": "経緯の順序がひと繋がりになりましたね。帳簿の数字や署名と、現実に起きた出来事を明確に切り分けられています。",
      "wrongFeedbackJa": "その出来事が起きる前に、何が必要だったでしょうか。手帖の記録に立ち返って並べ直してみましょう。"
    },
    "verdictJa": "指定三便「A17・B08・C10」について、三十俵の不足は認められません。預替の履歴を別の納入義務として二重に数えた集計表を訂正し、この架空の不足を地方の祭を取りやめる理由に用いてはならない。",
    "closingJa": "潮蔵「米は消えてなどいなかった。消えかけていたのは、預かる手と手をつなぐ信頼のほうだったんじゃな。」",
    "effects": []
  },
  {
    "id": "TR_C06",
    "caseId": "C06",
    "venueLocationId": "LOC_KYO_COURT",
    "venueNameJa": "京の評定所",
    "readyCondition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_08"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_09"
        }
      ]
    },
    "roles": {
      "judgeNpcId": "NPC_SHIRAE",
      "clerkNpcId": "NPC_NAOKI",
      "claimantNpcId": "NPC_FUDEM",
      "presenter": "player"
    },
    "openingJa": "白枝「名が本物か。何に名を書いたのか。そして誰がそれを別の文へ移したのか。この三つをひとまとめにせず、順を追って伺いましょう。」",
    "rounds": [
      {
        "id": "TR_C06_R01",
        "testimony": {
          "npcId": "NPC_FUDEM",
          "lines": [
            {
              "id": "TR_C06_R01_S01",
              "textJa": "この連名書には、紛れもなく皆さんの名前と印が並んでいます。"
            },
            {
              "id": "TR_C06_R01_S02",
              "textJa": "お名前が本物である以上、その上に記された取消の文面にも同意されたはずです。"
            },
            {
              "id": "TR_C06_R01_S03",
              "textJa": "もし文字が偽物だと仰るなら、ご本人たちに直接確かめていただいても構いませんよ？"
            }
          ]
        },
        "challenge": {
          "statementId": "TR_C06_R01_S02",
          "acceptedEvidenceSets": [
            [
              "EV_C06_01",
              "EV_C06_02",
              "EV_C06_03",
              "EV_C06_04",
              "EV_C06_05",
              "EV_C06_08"
            ]
          ],
          "choices": [
            {
              "id": "TR_C06_R01_A",
              "textJa": "署名は本物だが、元の文は「各里の餅つきを続ける」という祈願だった！",
              "correct": true,
              "feedbackJa": "署名片を番号・切り離し縁・割印でお寺の上段へ戻すと、本来の目的がそのまま復元される。本人の控えとも完全に一致するぞ！"
            },
            {
              "id": "TR_C06_R01_B",
              "textJa": "署名が本物なら、あとから付けた文にもすべて同意したことになる！",
              "correct": false,
              "feedbackJa": "署名した「その瞬間」に、上に何が書かれていたかを確かめる必要があるな。"
            },
            {
              "id": "TR_C06_R01_C",
              "textJa": "名前が使われた以上、書いた全員が嘘をついている！",
              "correct": false,
              "feedbackJa": "署名の真偽を争う必要はない。転用された目的の違いを比べよう。"
            }
          ]
        },
        "successJa": "署名片を番号・切り離し縁・割印でお寺の上段へ戻すと、本来の目的がそのまま復元される。本人の控えとも完全に一致するぞ！",
        "failureJa": "その資料が示している事実と、この証言の主張は、どこで食い違っていますか？　落ち着いて見直しましょう。資料は失われません。",
        "grantInferenceId": "INF_C06_01",
        "requiresCompletedRoundIds": []
      },
      {
        "id": "TR_C06_R02",
        "testimony": {
          "npcId": "NPC_FUDEM",
          "lines": [
            {
              "id": "TR_C06_R02_S01",
              "textJa": "とはいえ、それらの署名はすべて東大寺から送り出されたものです。"
            },
            {
              "id": "TR_C06_R02_S02",
              "textJa": "ならば灯庵どのが取消の文面を仕立てて送ったと考えるのが、最も自然ではありませんか？"
            },
            {
              "id": "TR_C06_R02_S03",
              "textJa": "お寺に原本が残っていることは、灯庵どの自身も認めておられますよ。"
            }
          ]
        },
        "challenge": {
          "statementId": "TR_C06_R02_S02",
          "acceptedEvidenceSets": [
            [
              "EV_C06_03",
              "EV_C06_07",
              "EV_C06_09"
            ]
          ],
          "choices": [
            {
              "id": "TR_C06_R02_A",
              "textJa": "寺に残るのは上段の原本で、運ばれたのは祈願の署名片だけだ！　取消の見出しは荷になかった！",
              "correct": true,
              "feedbackJa": "上段と署名片は別の紙片に分かれている。製作時の版下と出発時の受渡控えが、お寺における本来の用途をはっきり裏付けているぞ！"
            },
            {
              "id": "TR_C06_R02_B",
              "textJa": "お寺に証拠がある以上、お寺の全員が共犯だ！",
              "correct": false,
              "feedbackJa": "元の保管場所と、あとから紙を加工した者の責任を混同しちゃいけないな。"
            },
            {
              "id": "TR_C06_R02_C",
              "textJa": "灯庵は穏やかな人柄だから、証拠がなくても無実だ！",
              "correct": false,
              "feedbackJa": "人柄への好感で決めるんじゃなく、お寺を出る前の資料の中身を確認しよう。"
            }
          ]
        },
        "successJa": "上段と署名片は別の紙片に分かれている。製作時の版下と出発時の受渡控えが、お寺における本来の用途をはっきり裏付けているぞ！",
        "failureJa": "その資料が示している事実と、この証言の主張は、どこで食い違っていますか？　落ち着いて見直しましょう。資料は失われません。",
        "grantInferenceId": null,
        "requiresCompletedRoundIds": [
          "TR_C06_R01"
        ]
      },
      {
        "id": "TR_C06_R03",
        "testimony": {
          "npcId": "NPC_FUDEM",
          "lines": [
            {
              "id": "TR_C06_R03_S01",
              "textJa": "祈願票とこの署名片は、たまたま似た和紙を使っていただけかもしれません。"
            },
            {
              "id": "TR_C06_R03_S02",
              "textJa": "紙の色合いや似た筆跡だけでは、もとの用途を決めつけることはできないはずです。"
            },
            {
              "id": "TR_C06_R03_S03",
              "textJa": "したがって、取消への同意は今も有効であると考えます！"
            }
          ]
        },
        "challenge": {
          "statementId": "TR_C06_R03_S03",
          "acceptedEvidenceSets": [
            [
              "EV_C06_03",
              "EV_C06_06",
              "EV_C06_07",
              "EV_C06_08",
              "EV_C06_09"
            ]
          ],
          "choices": [
            {
              "id": "TR_C06_R03_A",
              "textJa": "紙の色ではなく、P21〜P23の切れ目・番号・割印がただひとつに連続している！",
              "correct": true,
              "feedbackJa": "雪綴本人のP23控えを含め、三人の原本片と製作・運搬の資料がすべて噛み合った。本来の祈願が確認された以上、取消への同意として扱うことはできない！"
            },
            {
              "id": "TR_C06_R03_B",
              "textJa": "紙の色が同じなら、それだけで必ず同じ一枚だったはずだ！",
              "correct": false,
              "feedbackJa": "紙の色が同じというだけじゃ弱い。切れ目の輪郭・番号・割印の同時一致を示そう。"
            },
            {
              "id": "TR_C06_R03_C",
              "textJa": "取消が無効なのだから、皆を京の祭へ強制的に参加させるべきだ！",
              "correct": false,
              "feedbackJa": "自由に参加することと、取消に同意していないことはまったく別の問題だぞ。"
            }
          ]
        },
        "successJa": "雪綴本人のP23控えを含め、三人の原本片と製作・運搬の資料がすべて噛み合った。本来の祈願が確認された以上、取消への同意として扱うことはできない！",
        "failureJa": "その資料が示している事実と、この証言の主張は、どこで食い違っていますか？　落ち着いて見直しましょう。資料は失われません。",
        "grantInferenceId": "INF_C06_02",
        "requiresCompletedRoundIds": [
          "TR_C06_R01",
          "TR_C06_R02"
        ]
      }
    ],
    "reconstruction": {
      "promptJa": "出来事と記録を、証明できた正しい順番に並べてください。",
      "options": [
        {
          "id": "TR_C06_ORDER_1",
          "textJa": "餅つきの継続を祈る全文のもとで、祈願票に署名する。"
        },
        {
          "id": "TR_C06_ORDER_2",
          "textJa": "お寺は上段を、本人は右片を保持し、署名片を整理用に分ける。"
        },
        {
          "id": "TR_C06_ORDER_3",
          "textJa": "使いが「祈願記録」として署名片を京へ運ぶ。"
        },
        {
          "id": "TR_C06_ORDER_4",
          "textJa": "別の「取消見出し」の下へ、署名片が貼り付けられる。"
        },
        {
          "id": "TR_C06_ORDER_5",
          "textJa": "番号・切れ目・割印・本人控えを照合し、元の願いを復元する。"
        }
      ],
      "correctOrder": [
        "TR_C06_ORDER_1",
        "TR_C06_ORDER_2",
        "TR_C06_ORDER_3",
        "TR_C06_ORDER_4",
        "TR_C06_ORDER_5"
      ],
      "feedbackJa": "経緯の順序がひと繋がりになりましたね。帳簿の数字や署名と、現実に起きた出来事を明確に切り分けられています。",
      "wrongFeedbackJa": "その出来事が起きる前に、何が必要だったでしょうか。手帖の記録に立ち返って並べ直してみましょう。"
    },
    "verdictJa": "P21〜P23は本物の祈願署名であり、各里の祭を取りやめる同意ではありません。灯庵が取消の署名を募ったという主張も、この資料からは成立しません。よって、この署名束を根拠とした催しの取消および物資の一括移管は、次の評定まで仮止めといたします。ただし、誰か個人の辞退や、望む者が京の炊き場を共同で使う相談まで禁じるものではありません。原本と最終提出本の来歴については、次の審理で照合します。",
    "closingJa": "灯庵「京で一緒に炊き出しができれば、朝の忙しい手が少し空きます。それは私もお願いいたしました。だからといって、皆さまの役目も願いも、ひとまとめにして差し出したわけではないのです。」\n白枝「仮止めと、最終の判断は明確に分けます。助けを借りる相談も、断るお返事も、どちらもこの場に残しましょう。」",
    "effects": []
  },
  {
    "id": "TR_C07",
    "caseId": "C07",
    "venueLocationId": "LOC_KYO_COURT",
    "venueNameJa": "京の評定所",
    "readyCondition": {
      "all": [
        {
          "op": "caseAccepted",
          "id": "C07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_01"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_02"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_03"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_04"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_05"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_08"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_09"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_10"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_11"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_90"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C02_90"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_90"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C04_90"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C05_90"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C06_90"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_06"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C01_07"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C03_08"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_12"
        },
        {
          "op": "hasEvidence",
          "id": "EV_C07_13"
        }
      ]
    },
    "roles": {
      "judgeNpcId": "NPC_SHIRAE",
      "clerkNpcId": "NPC_NAOKI",
      "claimantNpcId": "NPC_FUDEM",
      "presenter": "player"
    },
    "openingJa": "白枝「今日ここで確かめるのは、誰がどんな悪人面をしていたかではありません。あのとき交わされた本当の相談が、いつ、どのようにして別の結論の証拠へすり替えられたのか――その順序を伺います。なお、申し立てを退けたからといって、誰も困っていなかったことにするつもりもありません。」",
    "rounds": [
      {
        "id": "TR_C07_R01",
        "testimony": {
          "npcId": "NPC_FUDEM",
          "lines": [
            {
              "id": "TR_C07_R01_S01",
              "textJa": "その相談を書いたのは、お餅どのが話を聞いた当事者たちご本人です。皆が実際に困っていた。それは紛れもない事実でしょう？"
            },
            {
              "id": "TR_C07_R01_S02",
              "textJa": "ならば、それを「現在も未解決の六事」として差し出すことに、何の不都合がありましょうか。"
            },
            {
              "id": "TR_C07_R01_S03",
              "textJa": "相談の文字も、当人たちの印も、すべて本物です。それとも、あれが偽物だと仰るのですか？"
            }
          ]
        },
        "challenge": {
          "statementId": "TR_C07_R01_S02",
          "acceptedEvidenceSets": [
            [
              "EV_C07_01",
              "EV_C01_90",
              "EV_C02_90",
              "EV_C03_90",
              "EV_C04_90",
              "EV_C05_90",
              "EV_C06_90"
            ]
          ],
          "choices": [
            {
              "id": "TR_C07_R01_A",
              "textJa": "相談自体は本物だ！　しかし解決後の返事を切り落とし、提出時にも未解決とする見出しは事実に反している！",
              "correct": true,
              "feedbackJa": "無断の持ち出しも、市の米の不正も否定はしない。だが、戻った道具、二杯の補填、代理の約束、三便の所在、署名の本来の目的を加えれば、提出時の六つの主張は到底成り立たないぞ！"
            },
            {
              "id": "TR_C07_R01_B",
              "textJa": "裁判に勝つため、当人たちの最初の相談も偽物だったことにする！",
              "correct": false,
              "feedbackJa": "自分たちの主張に都合が悪いからって、本当の相談まで消しちゃいけない。正すべきは「時点」と「抜け落ちた続き」だ。"
            },
            {
              "id": "TR_C07_R01_C",
              "textJa": "一か所に集まる祭が気に入らないので、この文は全部嘘だ！",
              "correct": false,
              "feedbackJa": "好き嫌いを根拠にしちゃいけないな。確定した事実と提出文の食い違いを具体的に示そう。"
            }
          ]
        },
        "successJa": "無断の持ち出しも、市の米の不正も否定はしない。だが、戻った道具、二杯の補填、代理の約束、三便の所在、署名の本来の目的を加えれば、提出時の六つの主張は到底成り立たないぞ！",
        "failureJa": "その資料が示している事実と、この証言の主張は、どこで食い違っていますか？　落ち着いて見直しましょう。資料は失われません。",
        "grantInferenceId": null,
        "requiresCompletedRoundIds": []
      },
      {
        "id": "TR_C07_R02",
        "testimony": {
          "npcId": "NPC_FUDEM",
          "lines": [
            {
              "id": "TR_C07_R02_S01",
              "textJa": "送り火のあの刻限、私は東の塔の北回廊におりました。"
            },
            {
              "id": "TR_C07_R02_S02",
              "textJa": "こちらの写生は、その場所から見えた送り火の配置をそのまま描き留めたものです。"
            },
            {
              "id": "TR_C07_R02_S03",
              "textJa": "ですから、私がその時刻に訂正を受け取ったという記録のほうこそ、何かの考え違いでしょう。"
            }
          ]
        },
        "challenge": {
          "statementId": "TR_C07_R02_S03",
          "acceptedEvidenceSets": [
            [
              "EV_C07_06",
              "EV_C07_07",
              "EV_C07_10"
            ]
          ],
          "choices": [
            {
              "id": "TR_C07_R02_A",
              "textJa": "写生の食い違いは補助にすぎない！　不在の弁解を崩すのは、読返しに立ち会った記録だ！",
              "correct": true,
              "feedbackJa": "視点の違いだけじゃ「記憶で絵を整えた」という言い逃れが残る。直記と羽文の立会い記録こそが、実際の受領と所在を直接裏付けるんだ！"
            },
            {
              "id": "TR_C07_R02_B",
              "textJa": "写生が食い違っているのだから、それだけで七件すべての犯人だ！",
              "correct": false,
              "feedbackJa": "補助的な証拠から結論を飛躍させすぎているぞ。各地で起きた七件の原因はそれぞれ別個のものだ。"
            },
            {
              "id": "TR_C07_R02_C",
              "textJa": "大の字はどこから見ても同じ形なので、場所の比較はできない！",
              "correct": false,
              "feedbackJa": "火床は実際の山肌に並んでいる。固定された再現で、各地点からの重なり方の違いを確認できるぞ。"
            }
          ]
        },
        "successJa": "視点の違いだけじゃ「記憶で絵を整えた」という言い逃れが残る。直記と羽文の立会い記録こそが、実際の受領と所在を直接裏付けるんだ！",
        "failureJa": "その資料が示している事実と、この証言の主張は、どこで食い違っていますか？　落ち着いて見直しましょう。資料は失われません。",
        "grantInferenceId": "INF_C07_01",
        "requiresCompletedRoundIds": [
          "TR_C07_R01"
        ]
      },
      {
        "id": "TR_C07_R03",
        "testimony": {
          "npcId": "NPC_FUDEM",
          "lines": [
            {
              "id": "TR_C07_R03_S01",
              "textJa": "書類を受け取ったからといって、中身をすべて理解していたことにはなりませんよ。"
            },
            {
              "id": "TR_C07_R03_S02",
              "textJa": "私が訂正だけでなく、預替や祈願の意味まで知っていたと仰るなら、封筒の受領印だけでは足りないはずです。"
            },
            {
              "id": "TR_C07_R03_S03",
              "textJa": "この審理の席で初めて明らかになったことを、あの夜の私に背負わせぬようお願いいたします！"
            }
          ]
        },
        "challenge": {
          "statementId": "TR_C07_R03_S02",
          "acceptedEvidenceSets": [
            [
              "EV_C01_06",
              "EV_C04_07",
              "EV_C07_02",
              "EV_C07_10",
              "EV_C07_11"
            ]
          ],
          "choices": [
            {
              "id": "TR_C07_R03_A",
              "textJa": "筆丸は提出前に、訂正・三便の保管交代・祈願の目的を自分の言葉で読み返して確認している！",
              "correct": true,
              "feedbackJa": "単なる受領印じゃなく、正しい要旨を自分の口で読み返した言葉と独立した立会い記録が残っている。後の判決を過去の知識の証拠に使ったわけじゃない！"
            },
            {
              "id": "TR_C07_R03_B",
              "textJa": "受領印さえ押してあれば、中身を読んだかどうかなど調べなくてよい！",
              "correct": false,
              "feedbackJa": "受け取ることと、内容を理解することは別だ。読み返しの記録こそを突きつけよう。"
            },
            {
              "id": "TR_C07_R03_C",
              "textJa": "最後の裁判で聞いたのだから、提出前にも知っていたはずだ！",
              "correct": false,
              "feedbackJa": "知識の前後関係が逆転しているぞ。提出より前に残された控えで証明しよう。"
            }
          ]
        },
        "successJa": "筆丸は提出前に、訂正と元資料の意味を自分の言葉で読み返している。受領印だけの推測じゃない。\n筆丸「……ええ、読みましたとも。みんな助かったのだな、とも思いました。けれど……次に誰かが困ったとき、いったい誰が手を差し伸べてくれるのです？」",
        "failureJa": "その資料が示している事実と、この証言の主張は、どこで食い違っていますか？　落ち着いて見直しましょう。資料は失われません。",
        "grantInferenceId": "INF_C07_02",
        "requiresCompletedRoundIds": [
          "TR_C07_R01",
          "TR_C07_R02"
        ]
      },
      {
        "id": "TR_C07_R05",
        "testimony": {
          "npcId": "NPC_FUDEM",
          "lines": [
            {
              "id": "TR_C07_R05_S01",
              "textJa": "最初に書かれた相談をそのまま残すことまで、不正呼ばわりはできないでしょう。"
            },
            {
              "id": "TR_C07_R05_S02",
              "textJa": "この左側の原票は、まだ返事が書かれていなかった頃の紙です。古い相談がそのまま残っていただけのこと。"
            },
            {
              "id": "TR_C07_R05_S03",
              "textJa": "余白についた墨の汚れひとつまで、悪意の印と呼ぶのはおやめください！"
            }
          ]
        },
        "challenge": {
          "statementId": "TR_C07_R05_S02",
          "acceptedEvidenceSets": [
            [
              "EV_C01_06",
              "EV_C03_08",
              "EV_C07_03",
              "EV_C07_12",
              "EV_C07_13"
            ]
          ],
          "choices": [
            {
              "id": "TR_C07_R05_A",
              "textJa": "返事まで書かれた見開きから、相談側だけが切り出された！　古い未記入の写しなどではない！",
              "correct": true,
              "feedbackJa": "開いた解決控えの右下にある文字と、提出された左片の反転墨が折り線を軸にぴたりと一致する。受理時の写しにも同じ跡があるから、法廷で後から付けた墨でもない。結果が書き込まれた後の原票が使われたと断定できる！"
            },
            {
              "id": "TR_C07_R05_B",
              "textJa": "解決前に切り離した左片へ、後から別紙の訂正が偶然触れただけだ！　完成見開きは使われていない！",
              "correct": false,
              "feedbackJa": "祝い杵と米売りの立会い控えは、返事が書き込まれ、まだ一枚に繋がった状態の見開きを記録している。その相談欄が提出片と一致するんだ。別紙との偶然の接触じゃ、この原票の来歴は説明できないぞ。"
            },
            {
              "id": "TR_C07_R05_C",
              "textJa": "墨の写りは、今回の検分で初めて付いたものだ！　提出したときには無かった！",
              "correct": false,
              "feedbackJa": "独立した受理時の写しにも、同じ二組の反転墨がしっかり残っている。検分では原物に墨を付けず、写しの紙だけで実演を行っているんだ。"
            }
          ]
        },
        "successJa": "右欄に書いた結果の文字が、左の相談欄へ反転して写り込んでいる。受理時の写しにも同じ跡がある。解決前の白い紙じゃなく、返事が書かれた原票から左側だけが切り採られたんだ。――だが、誰の責任かを決めるには、次にその来歴を示さねばならない。",
        "failureJa": "その紙が示している事実と、そこから決めてよい範囲を切り分けてみましょう。資料は失われません。別の組合せで確かめ直せます。",
        "grantInferenceId": "INF_C07_04",
        "requiresCompletedRoundIds": [
          "TR_C07_R01",
          "TR_C07_R02",
          "TR_C07_R03"
        ],
        "demonstrationEvidenceIds": [
          "EV_C07_12",
          "EV_C07_13"
        ]
      },
      {
        "id": "TR_C07_R04",
        "testimony": {
          "npcId": "NPC_FUDEM",
          "lines": [
            {
              "id": "TR_C07_R04_S01",
              "textJa": "あの束が、私の申し立てとして提出されたことは争いません。"
            },
            {
              "id": "TR_C07_R04_S02",
              "textJa": "助けを求める里があった――その事実は、紙を短く整えたところで変わりはしないのです。"
            },
            {
              "id": "TR_C07_R04_S03",
              "textJa": "返事の側を控えに回したとしても、「現在も未解決」という見出しの意味まで変えたわけではありませんよ！"
            }
          ]
        },
        "challenge": {
          "statementId": "TR_C07_R04_S03",
          "acceptedEvidenceSets": [
            [
              "EV_C07_01",
              "EV_C07_02",
              "EV_C07_03",
              "EV_C07_04",
              "EV_C07_05",
              "EV_C07_09",
              "EV_C07_10",
              "EV_C07_11",
              "EV_C07_12"
            ]
          ],
          "choices": [
            {
              "id": "TR_C07_R04_A",
              "textJa": "筆丸は相談も解決も知りながら、返事側を外した原票を「現在も未解決」の根拠に仕立て、自らの申し立てとして提出した！",
              "correct": true,
              "feedbackJa": "本物の相談を否定する必要はない。完成見開きからの切り出し、事前の読み返し、左欄だけを採る割付、綴じ時点と受付時点で一致する見出しと本文――これらすべてが、結果を知ったうえでの意図的な現在形の提出を裏付けている！"
            },
            {
              "id": "TR_C07_R04_B",
              "textJa": "筆跡が似ているのだから、それ以外の来歴など調べるまでもない！",
              "correct": false,
              "feedbackJa": "見た目の類似だけでは、作者も提出の責任も確定できないぞ。"
            },
            {
              "id": "TR_C07_R04_C",
              "textJa": "几帳面すぎる性格そのものが、悪い動機の証拠だ！",
              "correct": false,
              "feedbackJa": "性格じゃなく、実際に何を読んで理解し、何を取り除き、何を読み上げて提出したかを示そう。"
            }
          ]
        },
        "successJa": "過去の相談は本物で、助けを要した事実も消えない。しかし筆丸は、解決の結果を知りながら、完成した原票から返事だけを外した束を「現在も未解決」と読み上げて提出した。編み直しや運び手の行き違いで説明できるものじゃない。\n筆丸「……ですが、こちらもお返しいたしましょう。杵吉どのの、本当の返事です。」\n直記が、すでに手帖へ記録されている祝い役の返上願を、静かに評定台へ置く。",
        "failureJa": "その資料が示している事実と、この証言の主張は、どこで食い違っていますか？　落ち着いて見直しましょう。資料は失われません。",
        "grantInferenceId": "INF_C07_03",
        "requiresCompletedRoundIds": [
          "TR_C07_R01",
          "TR_C07_R02",
          "TR_C07_R03",
          "TR_C07_R05"
        ]
      },
      {
        "id": "TR_C07_R06",
        "testimony": {
          "npcId": "NPC_NAOKI",
          "lines": [
            {
              "id": "TR_C07_R06_S01",
              "textJa": "では、取消の連名書は認めない、と判決案を書き直しましょう。"
            },
            {
              "id": "TR_C07_R06_S02",
              "textJa": "祝い杵も無事に手元へ戻りましたから、杵吉どのも祝いの一搗きへお戻りになる。これで、ようやく元どおりですね。"
            },
            {
              "id": "TR_C07_R06_S03",
              "textJa": "皆さんが望んだ祭を取り戻すための、これが最後の確認です。"
            }
          ]
        },
        "challenge": {
          "statementId": "TR_C07_R06_S02",
          "acceptedEvidenceSets": [
            [
              "EV_C01_07",
              "EV_C01_06"
            ],
            [
              "EV_C01_07",
              "EV_C01_90"
            ]
          ],
          "choices": [
            {
              "id": "TR_C07_R06_A",
              "textJa": "祝い杵は返却された。しかし杵吉は祝いの一搗き役を返上する。その両方を本人の返事として残す！",
              "correct": true,
              "feedbackJa": "返上願の対象は祝いの一搗き役であり、紛失騒ぎより前に本人が書いたものだ。浦で確かめたのはあくまで道具の返却であって、出演への再同意じゃない。取消の虚偽を正したからといって、真正な個人の辞退まで消しちゃいけないんだ！"
            },
            {
              "id": "TR_C07_R06_B",
              "textJa": "今年だけ休む扱いに直し、祭が落ち着く来年の復帰は予定に入れておく！",
              "correct": false,
              "feedbackJa": "原文は「本年より返上」であり、一年限りの休みじゃない。どれほど善意の落とし所であっても、本人がしていない承諾を勝手に書き足してはならないぞ。"
            },
            {
              "id": "TR_C07_R06_C",
              "textJa": "本当の辞退か確かめるため、理由と後任の説明が揃うまで返上を保留する！",
              "correct": false,
              "feedbackJa": "本人が書いた特定の役の返上はすでに確認されている。健康状態の説明や後任探しを新たな成立条件にしてはならない。また、ひとりの辞退から全里の取消権限が生まれるわけでもないぞ。"
            }
          ]
        },
        "successJa": "杵吉「『杵が戻った』とは書いたが、『私が戻る』とはひと言も書いていないよ。」\n白枝「返却された杵と、本人の返上願。その両方を記録に残します。誤りを正す側の手が、新しい強制を加えることのないように。」",
        "failureJa": "その紙が示している事実と、そこから決めてよい範囲を切り分けてみましょう。資料は失われません。別の組合せで確かめ直せます。",
        "grantInferenceId": "INF_C07_05",
        "requiresCompletedRoundIds": [
          "TR_C07_R01",
          "TR_C07_R02",
          "TR_C07_R03",
          "TR_C07_R05",
          "TR_C07_R04"
        ]
      }
    ],
    "reconstruction": {
      "promptJa": "出来事と記録を、証明できた正しい順番に並べてください。",
      "options": [
        {
          "id": "TR_C07_ORDER_0",
          "textJa": "杵吉が、紛失相談より前に祝いの一搗き役の返上願を書く。"
        },
        {
          "id": "TR_C07_ORDER_1",
          "textJa": "各地で別々の困り事が起こり、当人たちが相談の左欄を確認する。"
        },
        {
          "id": "TR_C07_ORDER_2",
          "textJa": "解決と補填の結果が右欄に加わり、乾く前の墨が畳まれた左欄へ写る。"
        },
        {
          "id": "TR_C07_ORDER_3",
          "textJa": "送り火の受取刻に、筆丸がすべての訂正と原資料の意味を読み返して確認する。"
        },
        {
          "id": "TR_C07_ORDER_4",
          "textJa": "返事側を外し、相談側だけを「現在も未解決」の本文へ組み入れる。"
        },
        {
          "id": "TR_C07_ORDER_5",
          "textJa": "筆丸が同じ見出しと六つの文を読み上げ、添付資料ごと提出する。"
        },
        {
          "id": "TR_C07_ORDER_6",
          "textJa": "原票の対応、墨の写り、読み返し、綴じと受理記録を合わせて提出責任を証明する。"
        },
        {
          "id": "TR_C07_ORDER_7",
          "textJa": "偽りの全里辞退を退け、杵吉本人の真正な祝い役の辞退はそのまま残す。"
        }
      ],
      "correctOrder": [
        "TR_C07_ORDER_0",
        "TR_C07_ORDER_1",
        "TR_C07_ORDER_2",
        "TR_C07_ORDER_3",
        "TR_C07_ORDER_4",
        "TR_C07_ORDER_5",
        "TR_C07_ORDER_6",
        "TR_C07_ORDER_7"
      ],
      "feedbackJa": "本当の相談と、その後の返事が、あるべき同じ順序へと戻りましたね。返事とは参加の承諾だけではない。道具の返却と、本人の辞退もまた、立派に両立するのです。",
      "wrongFeedbackJa": "その出来事が起きる前に、何が必要だったでしょうか。手帖の記録に立ち返って並べ直してみましょう。"
    },
    "verdictJa": "「一つ臼」の申し立ては、提示された根拠によっては認められません。指定三便の不足および全里の取消同意は成立せず、筆丸は訂正を知ったうえで、完成した記録から返事側を取り除き「現在も未解決」として提出したものと認定します。よって虚偽の撤回と、元の相談・続きの両方を残した訂正の公表を命じます。なお、杵吉の祝い役の返上は有効な本人の意思として残します。他の者の参加、手伝い、休みについても一括して決めることはいたしません。京での任意の共同作業は、引き受ける範囲、費用と報酬、そして休む権利を改めて確かめたうえで相談することができます。訂正の手間や祭の支度を、誰かの無償の尽力だけへ再び押し付けてはなりません。",
    "closingJa": "筆丸「帳面の困り事を減らせば、皆の手も少しは空くはずだと……ただ、そう書きたかったのです。」\n白枝「『困った』という言葉を消したところで、仕事は終わりません。同じように、『助かった』という返事を消しても、誰かを助けた事実が消えるわけではないのですよ。」\n杵吉「さてと……私は今年、食べるほうに回るよ。餅が冷めないうちにな。」\nお餅は、空いた杵を誰かの手へ押しつけることなく、ただ食べるための席をひとつ、静かにあける。",
    "effects": []
  }
];

export const ambient = [
  {
    "id": "AMB_REGION_RIVER",
    "selector": {
      "regionId": "river"
    },
    "kind": "region",
    "condition": {
      "all": []
    },
    "linesJa": [
      "川を渡るのに気を取られすぎると、向こう岸で何をするつもりだったか忘れちまうんだよな。",
      "名前が縫い付けてある持ち物でも、今日は別の誰かが借りて使っているかもしれないね。",
      "鹿さんの背中は案外高いんだ。荷物の陰に隠れた顔は、土手から見上げただけじゃ見えないこともあるよ。"
    ],
    "rumor": {
      "caseId": "C02",
      "textJa": "鳴吉さんが横綱のことで頭を抱えているみたいだよ。",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C01"
          }
        ]
      }
    },
    "onboardingHint": {
      "caseId": "C01",
      "textJa": "初日の出の浦の杵吉さんが、祝い杵を探しているそうだ。地図の東側だよ。",
      "mapActionJa": "初日の出の浦を地図で見る"
    }
  },
  {
    "id": "AMB_REGION_SHRINE",
    "selector": {
      "regionId": "shrine"
    },
    "kind": "region",
    "condition": {
      "all": []
    },
    "linesJa": [
      "竹は一本ずつ真っ直ぐ立っているけれど、風が吹けばみんなで一緒に鳴るんだね。",
      "紙を漉いた人、文字を書いた人、それを届けた人。どれも似ているようで、まったく別の仕事なんだよ。",
      "古い約束の書き付けは、あちらの掲示台に出ている。誰でも読めるようにしてあるんだ。"
    ],
    "rumor": null
  },
  {
    "id": "AMB_REGION_MARKET",
    "selector": {
      "regionId": "market"
    },
    "kind": "region",
    "condition": {
      "all": []
    },
    "linesJa": [
      "今日の店先はにぎやかだねえ。お餅だって、指で押されても少しは押し返してきそうだよ。",
      "同じ「十杯」でも、どんな枡で量ったのか一度聞いてみるといいさ。",
      "揉め事が起きたら、言い出した人を責める前に、まずは最初の札を引っ張り出してみることだね。"
    ],
    "rumor": {
      "caseId": "C03",
      "textJa": "俵太さんが荷の分量で困っているよ。運ぶ前とあとで、話がまるで食い違っているんだ。",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C01"
          }
        ]
      }
    }
  },
  {
    "id": "AMB_REGION_SPRING",
    "selector": {
      "regionId": "spring"
    },
    "kind": "region",
    "condition": {
      "all": []
    },
    "linesJa": [
      "湯けむりのせいで見えないことと、そこに存在しないことは、まるで別の話だよね。",
      "熱いお茶も、急がずゆっくり飲めば、相手の話をじっくり聞く時間になるのさ。",
      "何かを比べるときは、同じ米、同じ器、同じ乾き具合。ひとつずつ条件をそろえてからだね。"
    ],
    "rumor": null
  },
  {
    "id": "AMB_REGION_TERRACES",
    "selector": {
      "regionId": "terraces"
    },
    "kind": "region",
    "condition": {
      "all": []
    },
    "linesJa": [
      "こうして段々になっていると、水も慌てずにゆっくり下まで回れるのかな。",
      "思い切り力を抜くっていうのも、立派な稽古のうちなんだよ。",
      "米を送り出すときは、必ず通し番号を控えておく。次に誰の手へ渡ったか、あとから辿れるようにね。"
    ],
    "rumor": null
  },
  {
    "id": "AMB_REGION_COAST",
    "selector": {
      "regionId": "coast"
    },
    "kind": "region",
    "condition": {
      "all": []
    },
    "linesJa": [
      "潮風で乾く物もあれば、かえって湿気てしまう物もある。海辺は油断できないね。",
      "沖の目印を順に辿っていくと、海の底の門が見えてくる。深さも少しずつ変えながら潜るといいよ。",
      "預かる手が次々替わったところで、中の米の数まで勝手に増えたりはしないさ。"
    ],
    "rumor": null
  },
  {
    "id": "AMB_REGION_SNOW",
    "selector": {
      "regionId": "snow"
    },
    "kind": "region",
    "condition": {
      "all": []
    },
    "linesJa": [
      "冷え込む日は、言葉も少しゆっくり口から出すことにしているんです。",
      "紙の端をぴしっとそろえるのが私の仕事。そこに書かれた願いまでひとまとめにそろえるのは、また別の人の仕事ですね。",
      "番号が連なっているからといって、もともと一枚の同じ紙だったとは限りません。切れ目と割印も確かめてみましょう。"
    ],
    "rumor": null
  },
  {
    "id": "AMB_REGION_AUTUMN",
    "selector": {
      "regionId": "autumn"
    },
    "kind": "region",
    "condition": {
      "all": []
    },
    "linesJa": [
      "紅葉の赤といっても、よく見れば一枚ずつ違う赤があるんだねえ。",
      "染めた布と、雨に濡れた紙。同じ水を含んでも、後に残る跡はまるで違うんだよ。",
      "大事な品でぶっつけ本番を試す前に、同じ材料の試し紙を用意しておくのが職人の知恵さ。"
    ],
    "rumor": null
  },
  {
    "id": "AMB_REGION_MOON",
    "selector": {
      "regionId": "moon"
    },
    "kind": "region",
    "condition": {
      "all": []
    },
    "linesJa": [
      "ここではね、月を眺めているうちに、ついつい話が長くなっちゃうの。",
      "つぶれず丸いまま返せた白玉を、記念にひとつ取っておきたくなるよね。",
      "名前を書いたとき、その上にどんな文が並んでいたか。手元に控えがあると、思い出しやすいわよ。"
    ],
    "rumor": null
  },
  {
    "id": "AMB_REGION_DAWN",
    "selector": {
      "regionId": "dawn"
    },
    "kind": "region",
    "condition": {
      "all": []
    },
    "linesJa": [
      "臼の音が響くと、きょうも一日が始まったって気がするね。",
      "お祝いの日に使う道具は、ふだんの道具とは分けて丁寧に手入れしておくものさ。",
      "良かれと思って直してあげるときでも、やっぱりひと声かけるのが一番だったねえ。"
    ],
    "rumor": {
      "caseId": "C01",
      "textJa": "臼のそばで杵吉さんが、予備の祝い杵を探しているよ。",
      "condition": {
        "all": []
      }
    }
  },
  {
    "id": "AMB_REGION_KYO",
    "selector": {
      "regionId": "kyo"
    },
    "kind": "region",
    "condition": {
      "all": []
    },
    "linesJa": [
      "大通りから見上げる送り火と、塔の上から見下ろす送り火は、火の並びが少し違って見えるんだよ。",
      "評定所は東側にある大きな建物だ。その手帖があれば、途中で里へ戻っても、また続きから話を聞けるよ。",
      "結論だけ聞いて納得せず、どこからその話が湧いてきたのかも確かめてほしいな。"
    ],
    "rumor": {
      "caseId": "C07",
      "textJa": "使いの羽文さんが、届けたはずの返事の行方を追っているよ。",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C05"
          },
          {
            "op": "caseSolved",
            "id": "C06"
          }
        ]
      }
    }
  },
  {
    "id": "AMB_REGION_PEACH",
    "selector": {
      "regionId": "peach"
    },
    "kind": "region",
    "condition": {
      "all": []
    },
    "linesJa": [
      "桃の花が散ったあとも、交わした約束の控えだけは大切にしまっておくの。",
      "来られない人の代わりに、別の人がお祝いに駆けつけてくれることもあるわよね。",
      "同じお祭りでも、ここのお餅にはほんのり桃の香りをつけたいな。"
    ],
    "rumor": null
  },
  {
    "id": "AMB_REGION_RYUGU",
    "selector": {
      "regionId": "ryugu"
    },
    "kind": "region",
    "condition": {
      "all": []
    },
    "linesJa": [
      "海の底で交わした話も、どうか水面の上までまっすぐ届いてほしいものだね。",
      "この中庭なら、泳いだままでも石札が読めるよ。門の屋根の上と間違えないように気をつけてね。",
      "箱の数だけ数えて終わりじゃなくて、通し番号と中身の照合もきっちり大切にしているんだ。"
    ],
    "rumor": {
      "caseId": "C05",
      "textJa": "中庭の潮蔵さんが、帳簿と箱を見比べて深いため息をついているよ。",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C04"
          }
        ]
      }
    }
  },
  {
    "id": "AMB_REGION_TODAIJI",
    "selector": {
      "regionId": "todaiji"
    },
    "kind": "region",
    "condition": {
      "all": []
    },
    "linesJa": [
      "大餅仏さまの丸いお腹を見上げていると、こちらの肩の力までふっと抜けてきますね。",
      "毎日のお祈りは同じように見えても、誰がどんな願いを胸に抱えて来たかは、ひとりひとり違うものです。",
      "上の文をよく読んでから名前を書くこと。そして小さな控えも、忘れずに持って帰るといいですよ。"
    ],
    "rumor": {
      "caseId": "C06",
      "textJa": "祈りの受付で、灯庵さんが見覚えのある名簿を広げて首を傾げていましたよ。",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C04"
          }
        ]
      }
    }
  },
  {
    "id": "AMB_REGION_INARI",
    "selector": {
      "regionId": "inari"
    },
    "kind": "region",
    "condition": {
      "all": []
    },
    "linesJa": [
      "晴れているのに雨が降る。ここでは、どちらも紛れもない本当のことなのさ。",
      "上と下の行列は稽古の組、真ん中が葛葉さまの婚礼だよ。似た衣装を着ていても、まったく別の組なんだ。",
      "ひとつの手紙を読むときは、表だけじゃなく、折返しの裏にも続きが隠れていないか探してみてね。"
    ],
    "rumor": {
      "caseId": "C04",
      "textJa": "中段の葛葉さまが、婚礼の手紙について話を聞いてほしいと待っているそうだよ。",
      "condition": {
        "all": [
          {
            "op": "caseSolved",
            "id": "C02"
          },
          {
            "op": "caseSolved",
            "id": "C03"
          }
        ]
      }
    }
  },
  {
    "id": "AMB_ROLE_PORTER",
    "selector": {
      "roleOrCraft": "porter"
    },
    "kind": "role",
    "condition": {
      "all": []
    },
    "linesJa": [
      "預かった荷と、預かった言葉。どちらも途中で形を変えずに、そのまま届けたいものだね。",
      "渡す前の控えと、受け取ったあとの控え。両方そろっていると、運ぶほうも安心できるんだよ。"
    ]
  },
  {
    "id": "AMB_ROLE_SUMO",
    "selector": {
      "roleOrCraft": "sumo"
    },
    "kind": "role",
    "condition": {
      "all": []
    },
    "linesJa": [
      "勝ち負けを決める前に、まず相手がしっかり立つまで待つ。それも相撲の礼儀だよ。",
      "押す力が強すぎると、せっかくの餅がつぶれちまう。今日は思い切り力を抜く稽古かな。"
    ]
  },
  {
    "id": "AMB_ROLE_SCRIBE",
    "selector": {
      "roleOrCraft": "scribe"
    },
    "kind": "role",
    "condition": {
      "all": []
    },
    "linesJa": [
      "読みやすく書き写すことと、都合よく短く切り落とすことは、まるで同じじゃないんだ。",
      "よかったら、あなた自身の控えも一枚持っていきなよ。あとで役に立つから。"
    ]
  },
  {
    "id": "AMB_ROLE_TEA",
    "selector": {
      "roleOrCraft": "tea"
    },
    "kind": "role",
    "condition": {
      "all": []
    },
    "linesJa": [
      "お茶がすっかり冷めるまで、ゆっくり話を聞こうじゃないか。",
      "性急な返事より、最後まで話を聞き届けてくれたあとの返事のほうが、ずっと嬉しいこともあるさ。"
    ]
  },
  {
    "id": "AMB_ROLE_LOOM",
    "selector": {
      "roleOrCraft": "loom"
    },
    "kind": "role",
    "condition": {
      "all": []
    },
    "linesJa": [
      "織り目っていうのはね、途中で糸を切っても、隣の糸のことをちゃんと覚えているんだよ。",
      "ぱっと見は似た色でも、最初から同じ布だったとは限らないさ。"
    ]
  },
  {
    "id": "AMB_ROLE_WINNOW",
    "selector": {
      "roleOrCraft": "winnow"
    },
    "kind": "role",
    "condition": {
      "all": []
    },
    "linesJa": [
      "米と籾殻は、慌てずゆっくり選り分ければよく見える。人の話も、きっと同じかもしれないね。",
      "米を量り始める前に、まずはその器が合っているかどうか確かめようじゃないか。"
    ]
  },
  {
    "id": "AMB_ROLE_MEND",
    "selector": {
      "roleOrCraft": "mend"
    },
    "kind": "role",
    "condition": {
      "all": []
    },
    "linesJa": [
      "直した跡が残るのは、決して恥ずかしいことばかりじゃないよ。",
      "破れた端と端をそっと合わせてみれば、もとの形がちゃんと浮かび上がってくるんだ。"
    ]
  },
  {
    "id": "AMB_ROLE_POUNDER",
    "selector": {
      "roleOrCraft": "pounder"
    },
    "kind": "role",
    "condition": {
      "all": []
    },
    "linesJa": [
      "臼の調子に合わせて、もうひと搗き。",
      "お祝いの杵も、ふだんの杵も、持ち出すときは持ち主にひと声かけてからね。"
    ]
  },
  {
    "id": "AMB_ROLE_WANDER",
    "selector": {
      "roleOrCraft": "wander"
    },
    "kind": "role",
    "condition": {
      "all": []
    },
    "linesJa": [
      "気まぐれな寄り道で聞いた雑談が、あとで思わぬ役に立つこともあるものさ。",
      "困っている人を見かけたら、まずは言い分だけでも聞いてみるといいよ。"
    ]
  },
  {
    "id": "AMB_SPECIES_RABBIT",
    "selector": {
      "species": "rabbit"
    },
    "kind": "species",
    "condition": {
      "all": []
    },
    "linesJa": [
      "耳が二つあるんだから、二人の言い分も喧嘩させずに順番に聞けるよ。"
    ]
  },
  {
    "id": "AMB_SPECIES_FROG",
    "selector": {
      "species": "frog"
    },
    "kind": "species",
    "condition": {
      "all": []
    },
    "linesJa": [
      "水の上から見るのと、水底から見上げるのとでは、同じ景色も違って見えるんだケロ。"
    ]
  },
  {
    "id": "AMB_SPECIES_TURTLE",
    "selector": {
      "species": "turtle"
    },
    "kind": "species",
    "condition": {
      "all": []
    },
    "linesJa": [
      "そんなに急がなくても、話の続きは逃げたりしないよ。"
    ]
  },
  {
    "id": "AMB_SPECIES_MONKEY",
    "selector": {
      "species": "monkey"
    },
    "kind": "species",
    "condition": {
      "all": []
    },
    "linesJa": [
      "いくら手先が器用だからって、人の言葉をつなぎ替えていいわけがないよね。"
    ]
  },
  {
    "id": "AMB_SPECIES_FOX",
    "selector": {
      "species": "fox"
    },
    "kind": "species",
    "condition": {
      "all": []
    },
    "linesJa": [
      "「誰かに化かされた」と決めつける前に、自分の目に映った物をもう一度思い返してみてほしいな。"
    ]
  },
  {
    "id": "AMB_SPECIES_DEER",
    "selector": {
      "species": "deer"
    },
    "kind": "species",
    "condition": {
      "all": []
    },
    "linesJa": [
      "背中に乗せた荷の名前と、その荷を運んでいる者の名前は、違うこともあるんだよ。"
    ]
  },
  {
    "id": "AMB_SPECIES_BOAR",
    "selector": {
      "species": "boar"
    },
    "kind": "species",
    "condition": {
      "all": []
    },
    "linesJa": [
      "まっすぐ突き進むのは得意なんだ。でもね、推理だけは一度立ち止まって戻ってみてもいいもんだ。"
    ]
  },
  {
    "id": "AMB_SPECIES_BIRD",
    "selector": {
      "species": "bird"
    },
    "kind": "species",
    "condition": {
      "all": []
    },
    "linesJa": [
      "空の上から見える景色と、地面を歩いて分かること。両方そろって一人前さ。"
    ]
  },
  {
    "id": "AMB_SPECIES_TIGER",
    "selector": {
      "species": "tiger"
    },
    "kind": "species",
    "condition": {
      "all": []
    },
    "linesJa": [
      "遠く離れて全体を眺めていると、足元の小さな跡を見落としてしまうことがあるね。"
    ]
  },
  {
    "id": "AMB_SPECIES_SHISHI",
    "selector": {
      "species": "shishi"
    },
    "kind": "species",
    "condition": {
      "all": []
    },
    "linesJa": [
      "声の大きさで押すより、小さくても確かな根拠に耳を澄まそうじゃないか。"
    ]
  },
  {
    "id": "AMB_SPECIES_DRAGON",
    "selector": {
      "species": "dragon"
    },
    "kind": "species",
    "condition": {
      "all": []
    },
    "linesJa": [
      "どれほど高く空を渡っても、誰かの胸の内の気持ちまでは見通せないものだよ。"
    ]
  },
  {
    "id": "AMB_SPECIES_KIRIN",
    "selector": {
      "species": "kirin"
    },
    "kind": "species",
    "condition": {
      "all": []
    },
    "linesJa": [
      "願いがどこへ向かっているかは、地面に残った足の跡だけでは分からないものだね。"
    ]
  },
  {
    "id": "AMB_DEFAULT",
    "selector": {},
    "kind": "fallback",
    "condition": {
      "all": []
    },
    "linesJa": [
      "どうぞよい道中を。困り事を抱えている方の話も、ぜひ聞いていってあげてね。"
    ]
  }
];

export const timeline = [
  {
    "id": "EVT_FOUNDATION",
    "order": 0,
    "labelJa": "祭の前から",
    "factsJa": [
      "十五景もち寄りの約束は竹隠れで公開されている。",
      "各里が別々の餅つきや祈りを続け、米と客が往来する。"
    ]
  },
  {
    "id": "EVT_NOTEBOOK_METHOD",
    "order": 0.5,
    "labelJa": "相談札のいつもの扱い",
    "factsJa": [
      "一枚の二つ折り札の左を相談、右を返事に使う。",
      "乾く前に右を左へ閉じると、向かいの左欄へ墨が反転して写る。",
      "この扱いは初日の出の記録台で、いつでも見本により確かめられる。"
    ]
  },
  {
    "id": "EVT_KINEKICHI_RETIRE",
    "order": 1,
    "labelJa": "祭暦・支度前、紛失相談より前",
    "factsJa": [
      "杵吉が「祝いの一搗き役を、本年より返上します。」と書き、本人控えを保持する。",
      "対象は特定の祝い役。後の道具の紛失相談とは別の意思表示である。"
    ]
  },
  {
    "id": "EVT_C05",
    "order": 2,
    "labelJa": "祭暦・支度前の預替",
    "factsJa": [
      "A17十二俵、B08八俵、C10十俵が各中継へ到着する。",
      "同じ通し番号のまま最終蔵へ預替される。",
      "現物三十俵が照合される。"
    ]
  },
  {
    "id": "EVT_C06",
    "order": 3,
    "labelJa": "祭暦・支度前日の祈り",
    "factsJa": [
      "各里の餅つき継続を願う票に署名する。",
      "寺が上段、本人が右片を保持する。",
      "下の署名片を祈願記録として羽文が運ぶ。"
    ]
  },
  {
    "id": "EVT_C01",
    "order": 10,
    "labelJa": "祭暦・準備一日目",
    "factsJa": [
      "祝い杵に、持ち出される前から割れがある。",
      "継丸が無断で修理へ持ち出し、調査で経過が分かり、杵が返る。",
      "相談札の右へ返却の結果を書き足し、筆丸が読み返す。乾く前に畳んだ墨が左欄へ写る。",
      "杵吉の祝い役の返上願は取り消されない。"
    ]
  },
  {
    "id": "EVT_C02",
    "order": 20,
    "labelJa": "準備二日目・川の出来事",
    "factsJa": [
      "芦ノ山が稽古を予約する。",
      "綱を白足に貸す。",
      "綱を見た目撃が横綱本人と誤認される。",
      "本人確認後、訂正が記録される。"
    ],
    "parallelGroup": "EARLY_CASES_C02_C03",
    "mustFollowEventIds": [
      "EVT_C01"
    ],
    "mustPrecedeEventIds": [
      "EVT_C04",
      "EVT_C07_READBACK"
    ],
    "unorderedWithEventIds": [
      "EVT_C03"
    ]
  },
  {
    "id": "EVT_C03",
    "order": 21,
    "labelJa": "準備二日目・市の出来事",
    "factsJa": [
      "店主が上げ底桝で十度すくって量る。",
      "荷渡し前、独立した秤係が正味を「秤目80」と記録する。杯数の換算はまだ書かれない。",
      "俵太が運ぶ。標準杯一杯＝秤目10の同じ米の実演と原記録を合わせ、荷渡し前から八杯だったと判明する。",
      "売主が二杯を補填する。相談札の右へ結果を加え、湿った「不足二杯、受取済」が左の余白へ反転して写る。"
    ],
    "parallelGroup": "EARLY_CASES_C02_C03",
    "mustFollowEventIds": [
      "EVT_C01"
    ],
    "mustPrecedeEventIds": [
      "EVT_C04",
      "EVT_C07_READBACK"
    ],
    "unorderedWithEventIds": [
      "EVT_C02"
    ]
  },
  {
    "id": "EVT_C04",
    "order": 30,
    "labelJa": "準備三日目・婚礼の日",
    "factsJa": [
      "葛葉が代理を頼む全文を読み上げ、控えを残す。",
      "小雨が持つ紙の折返しが天気雨で貼り合う。",
      "全文を確認し、筆丸が訂正の意味を読み返す。"
    ]
  },
  {
    "id": "EVT_C07_READBACK",
    "order": 40,
    "labelJa": "準備四日目・送り火の受取刻",
    "factsJa": [
      "筆丸が浦から稲荷までの四件の訂正の要旨を読み返す。",
      "三便の預替は同じ荷の保管交代であることと、祈願片の元の目的も読み返し確認する。",
      "羽文・直記が独立した控えを残す。"
    ]
  },
  {
    "id": "EVT_C07_DAIMONJI",
    "order": 40.5,
    "labelJa": "同じ送り火の夜の検分用場面",
    "factsJa": [
      "事件時の火床配置を固定して三地点の目線を比較する。",
      "視点の図だけで所在や罪を確定しない。"
    ]
  },
  {
    "id": "EVT_C07_DRAFT",
    "order": 41,
    "labelJa": "受取刻のあと・清書",
    "factsJa": [
      "筆丸が読み返しで理解した後、完成した浦から稲荷までの四件の見開きから返事側を外し、真正な相談側を使う。",
      "三便の預替を重ね、祈願片を取消の見出しへ並べる。預かり米と祈願票の後の依頼札は使われない。",
      "左欄のみの割付に「現在も未解決の六事」の見出しを合わせる。",
      "雪綴が受け取った左片、添付順、本文位置を控え、筆丸へ返す。"
    ]
  },
  {
    "id": "EVT_C07_SUBMIT",
    "order": 42,
    "labelJa": "清書後・公開提出",
    "factsJa": [
      "筆丸が「現在も未解決の六事」の見出しと六文を、自分の申し立てとして読み上げて提出する。",
      "直記らが文面・番号・紙継ぎ・反転墨を含む受理時の状態を照合し、独立した控えを残す。"
    ]
  },
  {
    "id": "EVT_C07",
    "order": 50,
    "labelJa": "預かり米と祈願票の裁判後・最終照合",
    "factsJa": [
      "蔵の審理は指定三便の架空の不足を退ける。寺の審理は祈願の転用を示し、署名を根拠にした一括取消・移管を仮止めする。",
      "反転墨と完成見開きの対応、事前の読み返し、清書割付、綴じと受付の来歴から、筆丸の提出責任を証明する。",
      "真実だった相談と解決の続きの両方を公開し、杵吉の真正な祝い役の辞退は残す。",
      "祭や共同作業への参加・拒否、負担と報酬を別に確かめる。"
    ]
  }
];

export const assets = [
  {
    "id": "AS_EV_C01_01",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c01_01.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C01_01"
  },
  {
    "id": "AS_EV_C01_02",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c01_02.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C01_02"
  },
  {
    "id": "AS_EV_C01_03",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c01_03.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C01_03"
  },
  {
    "id": "AS_EV_C01_04",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c01_04.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C01_04"
  },
  {
    "id": "AS_EV_C01_05",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c01_05.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C01_05"
  },
  {
    "id": "AS_EV_C01_06",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c01_06.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C01_06"
  },
  {
    "id": "AS_EV_C02_01",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c02_01.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C02_01"
  },
  {
    "id": "AS_EV_C02_02",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c02_02.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C02_02"
  },
  {
    "id": "AS_EV_C02_03",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c02_03.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C02_03"
  },
  {
    "id": "AS_EV_C02_04",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c02_04.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C02_04"
  },
  {
    "id": "AS_EV_C02_05",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c02_05.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C02_05"
  },
  {
    "id": "AS_EV_C02_06",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c02_06.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C02_06"
  },
  {
    "id": "AS_EV_C02_07",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c02_07.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C02_07"
  },
  {
    "id": "AS_EV_C03_01",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c03_01.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C03_01"
  },
  {
    "id": "AS_EV_C03_02",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c03_02.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C03_02"
  },
  {
    "id": "AS_EV_C03_03",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c03_03.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C03_03"
  },
  {
    "id": "AS_EV_C03_04",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c03_04.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C03_04"
  },
  {
    "id": "AS_EV_C03_05",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c03_05.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C03_05"
  },
  {
    "id": "AS_EV_C03_06",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c03_06.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C03_06"
  },
  {
    "id": "AS_EV_C03_07",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c03_07.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C03_07"
  },
  {
    "id": "AS_EV_C04_01",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c04_01.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C04_01"
  },
  {
    "id": "AS_EV_C04_02",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c04_02.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C04_02"
  },
  {
    "id": "AS_EV_C04_03",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c04_03.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C04_03"
  },
  {
    "id": "AS_EV_C04_04",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c04_04.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C04_04"
  },
  {
    "id": "AS_EV_C04_05",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c04_05.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C04_05"
  },
  {
    "id": "AS_EV_C04_06",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c04_06.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C04_06"
  },
  {
    "id": "AS_EV_C04_07",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c04_07.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C04_07"
  },
  {
    "id": "AS_EV_C05_01",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c05_01.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C05_01"
  },
  {
    "id": "AS_EV_C05_02",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c05_02.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C05_02"
  },
  {
    "id": "AS_EV_C05_03",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c05_03.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C05_03"
  },
  {
    "id": "AS_EV_C05_04",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c05_04.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C05_04"
  },
  {
    "id": "AS_EV_C05_05",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c05_05.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C05_05"
  },
  {
    "id": "AS_EV_C05_06",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c05_06.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C05_06"
  },
  {
    "id": "AS_EV_C05_07",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c05_07.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C05_07"
  },
  {
    "id": "AS_EV_C05_08",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c05_08.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C05_08"
  },
  {
    "id": "AS_EV_C05_09",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c05_09.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C05_09"
  },
  {
    "id": "AS_EV_C05_10",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c05_10.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C05_10"
  },
  {
    "id": "AS_EV_C05_11",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c05_11.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C05_11"
  },
  {
    "id": "AS_EV_C05_12",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c05_12.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C05_12"
  },
  {
    "id": "AS_EV_C06_01",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c06_01.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C06_01",
    "transparent": false
  },
  {
    "id": "AS_EV_C06_02",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c06_02.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C06_02",
    "transparent": false
  },
  {
    "id": "AS_EV_C06_03",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c06_03.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C06_03",
    "transparent": false
  },
  {
    "id": "AS_EV_C06_04",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c06_04.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C06_04",
    "transparent": false
  },
  {
    "id": "AS_EV_C06_05",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c06_05.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C06_05",
    "transparent": false
  },
  {
    "id": "AS_EV_C06_06",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c06_06.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C06_06",
    "transparent": false
  },
  {
    "id": "AS_EV_C06_07",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c06_07.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C06_07"
  },
  {
    "id": "AS_EV_C06_08",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c06_08.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C06_08",
    "transparent": false
  },
  {
    "id": "AS_EV_C06_09",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c06_09.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C06_09"
  },
  {
    "id": "AS_EV_C07_01",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c07_01.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C07_01"
  },
  {
    "id": "AS_EV_C07_02",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c07_02.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C07_02"
  },
  {
    "id": "AS_EV_C07_03",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c07_03.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C07_03"
  },
  {
    "id": "AS_EV_C07_04",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c07_04.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C07_04"
  },
  {
    "id": "AS_EV_C07_05",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c07_05.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C07_05"
  },
  {
    "id": "AS_EV_C07_06",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c07_06.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C07_06"
  },
  {
    "id": "AS_EV_C07_07",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c07_07.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C07_07"
  },
  {
    "id": "AS_EV_C07_08",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c07_08.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C07_08"
  },
  {
    "id": "AS_EV_C07_09",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c07_09.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C07_09"
  },
  {
    "id": "AS_EV_C07_10",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c07_10.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C07_10"
  },
  {
    "id": "AS_EV_C03_08",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c03_08.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C03_08"
  },
  {
    "id": "AS_EV_C07_11",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c07_11.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C07_11"
  },
  {
    "id": "AS_CLUE_MEASURE",
    "status": "supplied",
    "file": "assets/mystery/clues/measure_section.webp",
    "purpose": "exact_clue_diagram",
    "dimensions": [
      768,
      540
    ],
    "mathematicalRatio": "4/5",
    "supportsEvidenceIds": [
      "EV_C03_02",
      "EV_C03_03"
    ]
  },
  {
    "id": "AS_CLUE_LETTER_CLOSED",
    "status": "supplied",
    "file": "assets/mystery/clues/letter_closed.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      768,
      540
    ]
  },
  {
    "id": "AS_CLUE_LETTER_OPEN",
    "status": "supplied",
    "file": "assets/mystery/clues/letter_open.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      768,
      540
    ]
  },
  {
    "id": "AS_CLUE_PRAYER_TEMPLATE",
    "status": "supplied",
    "file": "assets/mystery/clues/prayer_sample_s00.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      840,
      460
    ],
    "transparent": false
  },
  {
    "id": "AS_CLUE_PRAYER_FALSE",
    "status": "supplied",
    "file": "assets/mystery/clues/prayer_false_heading.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      840,
      460
    ],
    "transparent": false
  },
  {
    "id": "AS_CLUE_P21_UPPER",
    "status": "supplied",
    "file": "assets/mystery/clues/prayer_p21_upper.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      840,
      460
    ],
    "transparent": true
  },
  {
    "id": "AS_CLUE_P21_COUNTER",
    "status": "supplied",
    "file": "assets/mystery/clues/prayer_p21_counter.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      840,
      460
    ],
    "transparent": true
  },
  {
    "id": "AS_CLUE_P21_JOINED",
    "status": "supplied",
    "file": "assets/mystery/clues/prayer_p21_joined.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      840,
      460
    ],
    "transparent": true
  },
  {
    "id": "AS_CLUE_P22_UPPER",
    "status": "supplied",
    "file": "assets/mystery/clues/prayer_p22_upper.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      840,
      460
    ],
    "transparent": true
  },
  {
    "id": "AS_CLUE_P22_COUNTER",
    "status": "supplied",
    "file": "assets/mystery/clues/prayer_p22_counter.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      840,
      460
    ],
    "transparent": true
  },
  {
    "id": "AS_CLUE_P22_JOINED",
    "status": "supplied",
    "file": "assets/mystery/clues/prayer_p22_joined.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      840,
      460
    ],
    "transparent": true
  },
  {
    "id": "AS_CLUE_P23_UPPER",
    "status": "supplied",
    "file": "assets/mystery/clues/prayer_p23_upper.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      840,
      460
    ],
    "transparent": true
  },
  {
    "id": "AS_CLUE_P23_COUNTER",
    "status": "supplied",
    "file": "assets/mystery/clues/prayer_p23_counter.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      840,
      460
    ],
    "transparent": true
  },
  {
    "id": "AS_CLUE_P23_JOINED",
    "status": "supplied",
    "file": "assets/mystery/clues/prayer_p23_joined.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      840,
      460
    ],
    "transparent": true
  },
  {
    "id": "AS_UI_TALK",
    "status": "supplied",
    "file": "assets/mystery/ui/talk.webp",
    "purpose": "ui_icon",
    "dimensions": [
      128,
      128
    ],
    "transparent": true
  },
  {
    "id": "AS_UI_REQUEST",
    "status": "supplied",
    "file": "assets/mystery/ui/request.webp",
    "purpose": "ui_icon",
    "dimensions": [
      128,
      128
    ],
    "transparent": true
  },
  {
    "id": "AS_UI_EVIDENCE",
    "status": "supplied",
    "file": "assets/mystery/ui/evidence.webp",
    "purpose": "ui_icon",
    "dimensions": [
      128,
      128
    ],
    "transparent": true
  },
  {
    "id": "AS_UI_JOURNAL",
    "status": "supplied",
    "file": "assets/mystery/ui/journal.webp",
    "purpose": "ui_icon",
    "dimensions": [
      128,
      128
    ],
    "transparent": true
  },
  {
    "id": "AS_UI_COURT",
    "status": "supplied",
    "file": "assets/mystery/ui/court.webp",
    "purpose": "ui_icon",
    "dimensions": [
      128,
      128
    ],
    "transparent": true
  },
  {
    "id": "AS_UI_HINT",
    "status": "supplied",
    "file": "assets/mystery/ui/hint.webp",
    "purpose": "ui_icon",
    "dimensions": [
      128,
      128
    ],
    "transparent": true
  },
  {
    "id": "AS_RESOLVED_FACT",
    "status": "supplied",
    "file": "assets/mystery/ui/resolved_fact.webp",
    "purpose": "ui_icon",
    "dimensions": [
      128,
      128
    ],
    "transparent": true
  },
  {
    "id": "AS_COURT_SIGN",
    "status": "supplied",
    "file": "assets/mystery/clues/court_sign.webp",
    "purpose": "world_sign",
    "dimensions": [
      640,
      190
    ]
  },
  {
    "id": "AS_NPC_KINEKICHI",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_KINEKICHI",
    "baseRig": "rabbit",
    "accessoryJa": "朱の腰紐",
    "recipe": {
      "accessory": "waist sash",
      "baseColor": "#9d493d",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_KAEKICHI",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_KAEKICHI",
    "baseRig": "frog",
    "accessoryJa": "藍の手拭い",
    "recipe": {
      "accessory": "neck cloth",
      "baseColor": "#4f6a77",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_TSUGUMARU",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_TSUGUMARU",
    "baseRig": "frog",
    "accessoryJa": "継ぎ当ての前掛け",
    "recipe": {
      "accessory": "patch apron",
      "baseColor": "#a58c64",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_FUDEM",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_FUDEM",
    "baseRig": "monkey",
    "accessoryJa": "角の欠けた帳面と小筆",
    "recipe": {
      "accessory": "ledger on strap",
      "baseColor": "#67574c",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_NAKIKICHI",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_NAKIKICHI",
    "baseRig": "frog",
    "accessoryJa": "呼出しの扇",
    "recipe": {
      "accessory": "small fan",
      "baseColor": "#71806a",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_ASHINOYAMA",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_ASHINOYAMA",
    "baseRig": "frog",
    "accessoryJa": "白い細綱と稽古前掛け",
    "recipe": {
      "accessory": "soft white belt",
      "baseColor": "#e5ddca",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_SHIROASHI",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_SHIROASHI",
    "baseRig": "rabbit",
    "accessoryJa": "鹿荷の布と小さな肩掛け",
    "recipe": {
      "accessory": "courier satchel",
      "baseColor": "#697a67",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_TAWARATA",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_TAWARATA",
    "baseRig": "rabbit",
    "accessoryJa": "米札の肩掛け",
    "recipe": {
      "accessory": "rice-tag satchel",
      "baseColor": "#a29164",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_TAWARAKURO",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_TAWARAKURO",
    "baseRig": "fox",
    "accessoryJa": "店の角印の首札",
    "recipe": {
      "accessory": "square shop tag",
      "baseColor": "#9b724d",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_MASUME",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_MASUME",
    "baseRig": "frog",
    "accessoryJa": "五段目盛りの首札",
    "recipe": {
      "accessory": "measure tag",
      "baseColor": "#89917c",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_TAKEJI",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_TAKEJI",
    "baseRig": "frog",
    "accessoryJa": "細竹の物差し",
    "recipe": {
      "accessory": "bamboo ruler",
      "baseColor": "#84936d",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_YUKITSUZURI",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_YUKITSUZURI",
    "baseRig": "frog",
    "accessoryJa": "三本の紙紐",
    "recipe": {
      "accessory": "three binding cords",
      "baseColor": "#78828b",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_KUZUHA",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_KUZUHA",
    "baseRig": "fox",
    "accessoryJa": "白無垢と小さな桃飾り",
    "recipe": {
      "accessory": "white bridal cloth",
      "baseColor": "#f4eddf",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_KOSAME",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_KOSAME",
    "baseRig": "fox",
    "accessoryJa": "小雨紋の風呂敷",
    "recipe": {
      "accessory": "rain-motif cloth",
      "baseColor": "#718999",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_AIZO",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_AIZO",
    "baseRig": "rabbit",
    "accessoryJa": "藍染の袖布",
    "recipe": {
      "accessory": "indigo swatch",
      "baseColor": "#4e687d",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_MOMONE",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_MOMONE",
    "baseRig": "rabbit",
    "accessoryJa": "桃色の包み紐",
    "recipe": {
      "accessory": "peach cord",
      "baseColor": "#c39188",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_SHIOZO",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_SHIOZO",
    "baseRig": "turtle",
    "accessoryJa": "耐水札の首掛け",
    "recipe": {
      "accessory": "stone tally necklace",
      "baseColor": "#748b84",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_NAMISUKE",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_NAMISUKE",
    "baseRig": "frog",
    "accessoryJa": "網の補修糸",
    "recipe": {
      "accessory": "netting thread",
      "baseColor": "#8b9b8a",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_TOAN",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_TOAN",
    "baseRig": "deer",
    "accessoryJa": "無地の淡墨袈裟",
    "recipe": {
      "accessory": "plain gray stole",
      "baseColor": "#8b8b7a",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_SUZUNA",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_SUZUNA",
    "baseRig": "rabbit",
    "accessoryJa": "薄の葉の栞",
    "recipe": {
      "accessory": "grass bookmark",
      "baseColor": "#adab81",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_YUKEMARU",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_YUKEMARU",
    "baseRig": "frog",
    "accessoryJa": "湯気の丸紋の布",
    "recipe": {
      "accessory": "steam-mark cloth",
      "baseColor": "#a7b7ac",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_HABUMI",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_HABUMI",
    "baseRig": "rabbit",
    "accessoryJa": "羽文印の文箱",
    "recipe": {
      "accessory": "letter box",
      "baseColor": "#977f58",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_SHIRAE",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_SHIRAE",
    "baseRig": "deer",
    "accessoryJa": "白枝紋の札",
    "recipe": {
      "accessory": "branch-mark tablet",
      "baseColor": "#d0ccb7",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_NAOKI",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_NAOKI",
    "baseRig": "frog",
    "accessoryJa": "二本の朱筆",
    "recipe": {
      "accessory": "two clerk brushes",
      "baseColor": "#9d493d",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_NPC_TOKA",
    "status": "procedural",
    "purpose": "named_npc_appearance",
    "npcId": "NPC_TOKA",
    "baseRig": "rabbit",
    "accessoryJa": "小さな提灯",
    "recipe": {
      "accessory": "small lantern",
      "baseColor": "#d2b374",
      "outlineColor": "#343c36",
      "maxAdditionalMeshes": 3,
      "maxAccessoryTriangles": 320,
      "scaleRelativeToStature": 0.18,
      "collision": "none",
      "placement": "attach to rig chest/neck or nearby work prop; preserve existing species gait"
    }
  },
  {
    "id": "AS_PROP_MALLET",
    "status": "procedural",
    "purpose": "world_prop_recipe",
    "nameJa": "祝い杵",
    "recipe": {
      "head": {
        "shape": "beveled_cylinder",
        "radius": 0.17,
        "length": 0.7,
        "axis": "x"
      },
      "handle": {
        "shape": "cylinder",
        "radius": 0.035,
        "length": 0.78
      },
      "repair": {
        "splintSize": [
          0.015,
          0.18,
          0.04
        ],
        "bindings": 3
      }
    },
    "evidenceIds": [
      "EV_C01_05"
    ],
    "material": {
      "body": "warm wood or paper",
      "ink": "#343c36",
      "accent": "#9d493d",
      "roughness": 0.92,
      "metalness": 0
    }
  },
  {
    "id": "AS_PROP_MEASURE",
    "status": "procedural",
    "purpose": "world_prop_recipe",
    "nameJa": "上げ底の桝",
    "recipe": {
      "outerSize": [
        0.32,
        0.23,
        0.32
      ],
      "innerSize": [
        0.28,
        0.2,
        0.28
      ],
      "falseBottomLift": 0.04,
      "shape": "open_topped_box",
      "marks": 5,
      "reversibleForDemo": true
    },
    "evidenceIds": [
      "EV_C03_02"
    ],
    "material": {
      "body": "warm wood or paper",
      "ink": "#343c36",
      "accent": "#9d493d",
      "roughness": 0.92,
      "metalness": 0
    }
  },
  {
    "id": "AS_PROP_PAPER",
    "status": "procedural",
    "purpose": "world_prop_recipe",
    "nameJa": "書付と折返し",
    "recipe": {
      "shape": "segmented_plane",
      "size": [
        0.33,
        0.44
      ],
      "foldLine": 0.52,
      "thickness": 0.001,
      "letterTextureClosed": "AS_CLUE_LETTER_CLOSED",
      "letterTextureOpen": "AS_CLUE_LETTER_OPEN"
    },
    "evidenceIds": [
      "EV_C04_01",
      "EV_C04_04"
    ],
    "material": {
      "body": "warm wood or paper",
      "ink": "#343c36",
      "accent": "#9d493d",
      "roughness": 0.92,
      "metalness": 0
    }
  },
  {
    "id": "AS_PROP_SLATE",
    "status": "procedural",
    "purpose": "world_prop_recipe",
    "nameJa": "竜宮の刻字札",
    "recipe": {
      "shape": "rounded_box",
      "size": [
        0.44,
        0.58,
        0.035
      ],
      "engravings": "A17-01—12 / 預替 R17",
      "normal": "readable from approach point underwater"
    },
    "evidenceIds": [
      "EV_C05_04"
    ],
    "material": {
      "body": "warm wood or paper",
      "ink": "#343c36",
      "accent": "#9d493d",
      "roughness": 0.92,
      "metalness": 0
    }
  },
  {
    "id": "AS_PROP_CRATE",
    "status": "procedural",
    "purpose": "world_prop_recipe",
    "nameJa": "耐水米箱",
    "recipe": {
      "shape": "box",
      "size": [
        0.7,
        0.65,
        0.82
      ],
      "bands": 2,
      "viewWindow": [
        0.18,
        0.18
      ],
      "count": 12,
      "labelRange": "A17-01..A17-12"
    },
    "evidenceIds": [
      "EV_C05_05"
    ],
    "material": {
      "body": "warm wood or paper",
      "ink": "#343c36",
      "accent": "#9d493d",
      "roughness": 0.92,
      "metalness": 0
    }
  },
  {
    "id": "AS_PROP_TICKET",
    "status": "procedural",
    "purpose": "world_prop_recipe",
    "nameJa": "三分割祈願票",
    "recipe": {
      "shape": "three_planes",
      "size": [
        0.42,
        0.3
      ],
      "parts": [
        "A_upper_temple",
        "B_lower_signature",
        "C_right_counterfoil"
      ],
      "registration": "shared piece coordinates and same seal across A/B",
      "textures": "AS_CLUE_P21_*, AS_CLUE_P22_*, AS_CLUE_P23_*"
    },
    "evidenceIds": [
      "EV_C06_03",
      "EV_C06_08"
    ],
    "material": {
      "body": "warm wood or paper",
      "ink": "#343c36",
      "accent": "#9d493d",
      "roughness": 0.92,
      "metalness": 0
    }
  },
  {
    "id": "AS_PROP_COURT_SIGN",
    "status": "procedural",
    "purpose": "world_prop_recipe",
    "nameJa": "評定所の扁額",
    "recipe": {
      "shape": "beveled_box",
      "size": [
        2.4,
        0.65,
        0.08
      ],
      "textureId": "AS_COURT_SIGN"
    },
    "evidenceIds": [],
    "material": {
      "body": "warm wood or paper",
      "ink": "#343c36",
      "accent": "#9d493d",
      "roughness": 0.92,
      "metalness": 0
    }
  },
  {
    "id": "AS_PROP_OBSERVATION_STATION",
    "status": "procedural",
    "purpose": "world_prop_recipe",
    "nameJa": "検分の小卓",
    "recipe": {
      "shape": "wooden_table",
      "size": [
        0.85,
        0.72,
        0.62
      ],
      "sign": "調べる",
      "purpose": "Replay controls; no timed weather dependency"
    },
    "evidenceIds": [
      "EV_C07_06"
    ],
    "material": {
      "body": "warm wood or paper",
      "ink": "#343c36",
      "accent": "#9d493d",
      "roughness": 0.92,
      "metalness": 0
    }
  },
  {
    "id": "AS_CLUE_P21_SIGNATURE",
    "status": "supplied",
    "file": "assets/mystery/clues/prayer_p21_signature.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      840,
      460
    ],
    "transparent": true
  },
  {
    "id": "AS_CLUE_P22_SIGNATURE",
    "status": "supplied",
    "file": "assets/mystery/clues/prayer_p22_signature.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      840,
      460
    ],
    "transparent": true
  },
  {
    "id": "AS_CLUE_P23_SIGNATURE",
    "status": "supplied",
    "file": "assets/mystery/clues/prayer_p23_signature.webp",
    "purpose": "exact_clue_surface",
    "dimensions": [
      840,
      460
    ],
    "transparent": true
  },
  {
    "id": "AS_DAIMONJI_PROJECTION",
    "status": "supplied",
    "file": "assets/mystery/clues/daimonji_projection.webp",
    "purpose": "source_derived_projection",
    "dimensions": [
      1340,
      770
    ],
    "transparent": false
  },
  {
    "id": "AS_FOLIO_TEMPLATE",
    "status": "supplied",
    "file": "assets/mystery/clues/folio_template.webp",
    "purpose": "exact_material_demonstration",
    "dimensions": [
      668,
      555
    ]
  },
  {
    "id": "AS_FOLIO_C01_COMPLETE",
    "status": "supplied",
    "file": "assets/mystery/clues/folio_c01_complete.webp",
    "purpose": "completed_case_folio",
    "dimensions": [
      600,
      360
    ]
  },
  {
    "id": "AS_FOLIO_C01_SUBMITTED",
    "status": "supplied",
    "file": "assets/mystery/clues/folio_c01_submitted.webp",
    "purpose": "submitted_concern_fragment",
    "dimensions": [
      360,
      486
    ]
  },
  {
    "id": "AS_FOLIO_C03_COMPLETE",
    "status": "supplied",
    "file": "assets/mystery/clues/folio_c03_complete.webp",
    "purpose": "completed_case_folio",
    "dimensions": [
      600,
      360
    ]
  },
  {
    "id": "AS_FOLIO_C03_SUBMITTED",
    "status": "supplied",
    "file": "assets/mystery/clues/folio_c03_submitted.webp",
    "purpose": "submitted_concern_fragment",
    "dimensions": [
      360,
      486
    ]
  },
  {
    "id": "AS_FOLIO_COMPARISON",
    "status": "supplied",
    "file": "assets/mystery/clues/folio_comparison.webp",
    "purpose": "exact_source_sequence_comparison",
    "dimensions": [
      1090,
      1095
    ]
  },
  {
    "id": "AS_RESIGNATION_LETTER",
    "status": "supplied",
    "file": "assets/mystery/clues/resignation_letter.webp",
    "purpose": "authentic_personal_refusal",
    "dimensions": [
      768,
      540
    ]
  },
  {
    "id": "AS_EV_C01_07",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c01_07.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C01_07"
  },
  {
    "id": "AS_EV_C07_13",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c07_13.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C07_13"
  },
  {
    "id": "AS_EV_C07_12",
    "status": "supplied",
    "file": "assets/mystery/evidence/ev_c07_12.webp",
    "purpose": "notebook_card",
    "dimensions": [
      768,
      960
    ],
    "evidenceId": "EV_C07_12"
  }
];
