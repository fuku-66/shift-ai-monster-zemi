# 🥚 モンスター育成プロジェクト

SHIFT AI ジュニア向け・5教科レーダーチャート式モンスター育成サイト

## Phase 2 変更点（2026-04-30）
- ✅ **提出時に即XP加算**（mariko承認待ちフェーズ廃止）
- ✅ **2カテゴリ化**: 📦 成果物 / 🏆 成果（XP×3倍）
- ✅ **Discord通知2種**: 成果物の報告 / 成果報告（華やか）
- ✅ **不適切時の取消フロー**: スプシ「承認」☑を外すとXP減算+取消通知
- ✅ **レスポンシブ対応**: スマホ1列 / タブレット2列 / PC3列の自動切替
- ⏳ junior-dragon（旧）→ アーカイブ予定（mariko対応）

## 概要
- **コンセプト**: みんなの提出で1体のモンスターが育つ。提出した教科のバランスで姿が変化
- **5教科**: AI基礎 / 英語 / 数学 / 勉強法 / クリエイティブ
- **2カテゴリ**: 📦 成果物（既存25課題）/ 🏆 成果（フリー報告枠・受賞・点数アップ等）
- **4段階進化**: タマゴ → ヒナ → 子モンスター（軸別6種）→ 最終形態（軸別6種）

## XPテーブル
| 難易度 | 📦 成果物 | 🏆 成果（×3倍） |
|--------|----------|--------------|
| ★1 やさしい | +15 | +45 |
| ★2 | +25 | +75 |
| ★3 ふつう | +40 | +120 |
| ★4 | +60 | +180 |
| ★5 チャレンジ | +80 | +240 |

設計書: https://docs.google.com/spreadsheets/d/1zGFVHYJh_lfS5bBrslGsFwQikr-vG48C3gPj3F6x5Gw/edit

---

## ディレクトリ
```
monster-zemi/
├── index.html         トップ（モンスター + レーダーチャート + 最新提出）
├── missions.html      課題一覧（5教科×5難易度=25課題）
├── archive.html       全提出アーカイブ
├── how-to.html        使い方
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── config.js    GAS_URL / FORM_URL / モンスター対応表
│   │   ├── monster.js   軸→モンスター決定ロジック
│   │   ├── api.js       GAS呼び出し
│   │   └── main.js      トップページ描画
│   └── images/monsters/ 14体分の画像（SVGプレースホルダー入り）
├── docs/
│   └── missions.json    25課題の定義
└── gas/clasp/
    ├── Webapp.js        GAS本体（5軸XP集計+承認トリガー+Discord通知）
    └── appsscript.json
```

---

## 🚀 明日のセットアップ手順（順番）

### Step 1: 画像生成（mariko / Gemini）
スプシ②シートのプロンプトでGemini Imageに14枚生成。

```
https://docs.google.com/spreadsheets/d/1zGFVHYJh_lfS5bBrslGsFwQikr-vG48C3gPj3F6x5Gw/edit#gid=（②モンスタータブ）
```

ファイル名で `assets/images/monsters/` に保存:
| # | 名前 | ファイル名 |
|---|------|----------|
| 0 | タマゴ | monster-0-egg.png |
| 1 | ヒナ | monster-1-hatchling.png |
| 2 | 子サイバービースト | monster-2-cyber-baby.png |
| 3 | 子フェニックス | monster-3-phoenix-baby.png |
| 4 | 子クリスタルゴーレム | monster-4-golem-baby.png |
| 5 | 子シャドウウルフ | monster-5-wolf-baby.png |
| 6 | 子レインボードラゴン | monster-6-rainbow-baby.png |
| 7 | 子ユニコーン | monster-7-unicorn-baby.png |
| 8 | サイバービースト | monster-8-cyber.png |
| 9 | フェニックス | monster-9-phoenix.png |
| 10 | クリスタルゴーレム | monster-10-golem.png |
| 11 | シャドウウルフ | monster-11-wolf.png |
| 12 | レインボードラゴン | monster-12-rainbow.png |
| 13 | ユニコーン神獣 | monster-13-unicorn.png |

> 画像が無い間はSVGプレースホルダー（同名.svg）が自動的に表示される。

---

### Step 2: 提出スプシ作成（mariko / Googleスプシ）
1. 新規スプシを作成。タイトル例: `モンスター育成 提出ログ`
2. シート名を `提出ログ` にする
3. 後でGASを開いて `setupSheet()` を実行 → ヘッダー自動投入

---

### Step 3: Googleフォーム作成（mariko）
質問項目（順番厳守）:
| # | タイプ | ラベル | 必須 |
|---|--------|--------|------|
| 1 | メール（自動収集） | メールアドレス | ✅ |
| 2 | 短文 | ニックネーム | ✅ |
| 3 | 短文 | 挑戦した課題 | ✅ |
| 4 | 段落 | 提出内容 | ✅ |
| 5 | 短文 | 参考URL（任意） | ⬜ |
| 6 | 段落 | ひとこと・質問（任意） | ⬜ |

設定 →「回答」→「スプレッドシートにリンク」→ Step 2のスプシを選択

> 「挑戦した課題」は中学生がコピペしやすいよう、`missions.html` の各課題に `[m-a01]` 形式のIDが入っている。これをコピペして提出させる。

---

### Step 4: GASスクリプト設定（mariko）
1. Step 2のスプシで「拡張機能」→「Apps Script」
2. `gas/clasp/Webapp.js` の中身を全コピペ
3. 「プロジェクトの設定」→「スクリプトプロパティ」で `DISCORD_WEBHOOK_URL` を追加
4. エディタで `setupSheet()` を選択して実行 → 提出ログのヘッダーが自動投入される
5. `installAllTriggers()` を選択して実行 → 承認・フォーム送信トリガー登録
6. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」/ 実行ユーザー「自分」/ アクセス「全員」
7. デプロイ後の URL（`https://script.google.com/macros/s/.../exec`）をコピー

---

### Step 5: フロントの設定書き換え（AI / mariko）
`assets/js/config.js` の以下2行を置き換える:

```js
GAS_URL: 'PUT_YOUR_GAS_WEBAPP_URL_HERE',  // ← Step 4でコピーしたURL
FORM_URL: 'PUT_YOUR_GOOGLE_FORM_URL_HERE', // ← Step 3のフォームURL（送信用）
```

---

### Step 6: GitHub Pagesデプロイ（mariko or AI）

#### オプションA: 既存のjunior-dragonリポジトリに追加（おすすめ）
```bash
# junior-dragonリポジトリの monster-zemi/ ディレクトリとしてアップ
# URL: https://USERNAME.github.io/junior-dragon/monster-zemi/
```

#### オプションB: 新規リポジトリ
```bash
cd 03_projects/shift-ai/monster-zemi
git init && git add . && git commit -m "Initial commit"
gh repo create shift-ai-monster-zemi --public --source=. --push
# Settings → Pages → Branch: main → Save
# URL: https://USERNAME.github.io/shift-ai-monster-zemi/
```

---

### Step 7: テスト動作確認
1. ブラウザでサイトを開く → モンスター（タマゴ）と空のレーダーチャートが表示される
2. Googleフォームから1件テスト提出
3. スプシで「承認」列の□をクリック → ☑
4. Discordに承認通知が届けば成功 🎉
5. サイトを再読み込みするとXPが反映される

---

## XPテーブル
| 難易度 | XP |
|--------|-----|
| ★1 やさしい | +15 |
| ★2 | +25 |
| ★3 ふつう | +40 |
| ★4 | +60 |
| ★5 チャレンジ | +80 |

## Lvテーブル
| Lv | 姿 | 累計XP |
|----|------|--------|
| 1 | タマゴ | 0〜199 |
| 2 | ヒナ | 200〜599 |
| 3 | 子モンスター（軸別6種） | 600〜1499 |
| 4 | 最終形態（軸別6種） | 1500〜 |

## バランス判定
5軸の最大値と最小値の差が **10以下** ならユニコーン神獣（レア進化）。

---

## 💡 既存junior-dragonとの関係
- このプロジェクトは独立。junior-dragonは触らずそのまま残す
- GASコードは構造を流用したが、教科ID（m-a/m-e/m-m/m-s/m-c）と4段階Lv・5軸ロジックを追加
