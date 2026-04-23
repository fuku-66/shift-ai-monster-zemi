# 🐲 SHIFT AI ジュニア ドラゴン育成サイト

SHIFT AIジュニア（中高生）の学習アウトプットを可視化するゲーミフィケーションサイト。みんなで1体のドラゴンを育てよう。

## 概要

- **対象**: SHIFT AIジュニア会員（中高生）とその保護者
- **コンセプト**: 学習アウトプット → 講師承認 → XP → ドラゴン進化
- **世界観**: 異世界転生チート系 × ドット絵レトロRPG風
- **ログイン**: 不要（全員で1体のドラゴンを育成）

## サイト構成

| ページ | URL | 内容 |
|--------|-----|------|
| トップ | `/index.html` | ドラゴン・XPバー・最新提出・提出ボタン |
| アーカイブ | `/archive.html` | 全提出一覧・フィルタ・ページ分割 |
| 使い方 | `/how-to.html` | ルール・XP計算・Lv進化表 |

## フォルダ構造

```
junior-dragon/
├── README.md
├── index.html
├── archive.html
├── how-to.html
├── assets/
│   ├── css/style.css
│   ├── js/script.js
│   ├── sprites/             # Web表示用 512x512
│   │   ├── lv1-egg.png      ✅
│   │   ├── lv2-baby.png     ✅
│   │   ├── lv3-young.png    ⏳
│   │   ├── lv4-adult.png    ⏳
│   │   └── lv5-god.png      ⏳
│   └── sprites-original/    # オリジナル高解像度バックアップ
├── docs/
│   ├── requirements.md      # 要件定義書
│   ├── prompts.md           # ドット絵生成プロンプト集
│   └── roadmap.md           # Phase 1 / 2 ロードマップ
└── gas/
    └── webapp.gs            # Google Apps Script (後で作成)
```

## 技術スタック

- **ホスティング**: GitHub Pages
- **フロント**: HTML + CSS + Vanilla JS
- **バックエンド**: Google Apps Script (Web App)
- **データ**: Googleスプレッドシート
- **フォーム**: Googleフォーム
- **通知**: Discord Webhook
- **画像**: GPT Image 2（ドット絵）+ CSS擬似アニメ

## 進化システム

| Lv | 名称 | 累積XP |
|----|------|-------|
| 1 | タマゴ | 0 |
| 2 | ベビー | 100 |
| 3 | 若竜 | 400 |
| 4 | 成竜 | 1100 |
| 5 | 神竜（Max） | 2400 |

**1提出（承認済み）= +20 XP**

## ステータス

- Phase 0 (骨格作成): ✅ 完了（2026-04-23）
- Phase 1 (初回リリース): 🚧 進行中（2026-04-30目標）
- Phase 2 (ブラッシュアップ版): 未着手

詳細は [docs/roadmap.md](./docs/roadmap.md) 参照。

## 公開URL

（GitHub Pages デプロイ後に追記）
