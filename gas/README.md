# GAS セットアップ手順

## 概要

- `create-form.gs`: Googleフォーム + スプシを一括生成する初回セットアップ用スクリプト
- `webapp.gs`（後で作成）: サイトからデータ取得・XP集計・Discord通知する WebApp

---

## 🎯 初回セットアップ（マリコが実行）

### ステップ1: 管理用スプシを新規作成
1. https://sheets.google.com にアクセス
2. 「空白のスプレッドシート」で新規作成
3. 名前を `ドラゴンの書_管理` などに変更

### ステップ2: Apps Script を開いてコード貼り付け
1. スプシのメニュー「**拡張機能 → Apps Script**」
2. デフォルトの `myFunction()` を全部削除
3. `create-form.gs` の全文をコピペ
4. 「💾 保存」

### ステップ3: 関数 `initSetup` を実行
1. 上部の関数セレクタで `initSetup` を選ぶ
2. 「▶ 実行」ボタン
3. 初回は権限承認ダイアログ → 「続行」「自分のGoogleアカウントを選択」「詳細」→「このプロジェクトを許可」
4. 実行完了を待つ（数秒）

### ステップ4: ログから URL と Entry ID を取得
1. 「📜 実行ログ」を開く（下にドロワーで出る）or 「表示 → ログ」
2. ログに以下のような出力が出ている:

```
✅ フォーム作成完了！
公開URL（生徒はこちら）: https://docs.google.com/forms/d/e/XXXX/viewform
【assets/js/script.js の CONFIG に貼り付け】
  FORM_URL:              "https://docs.google.com/forms/d/e/XXXX/viewform",
  FORM_ENTRY_NICKNAME:   "entry.1234567890",
  FORM_ENTRY_MISSION_ID: "entry.2345678901",
  FORM_ENTRY_SUBJECT:    "entry.3456789012",
```

### ステップ5: サイトに貼り付け
ログの `FORM_URL` と `entry.XXXX` の値を、`assets/js/script.js` の先頭にある `CONFIG` オブジェクトに貼り付ける:

```javascript
const CONFIG = {
  API_URL: "",
  FORM_URL: "https://docs.google.com/forms/d/e/XXXX/viewform",     // ← 貼り付け
  FORM_ENTRY_NICKNAME:   "entry.1234567890",                        // ← 貼り付け
  FORM_ENTRY_MISSION_ID: "entry.2345678901",                        // ← 貼り付け
  FORM_ENTRY_SUBJECT:    "entry.3456789012",                        // ← 貼り付け
  USE_MOCK: true,
};
```

### ステップ6: 動作確認
1. ブラウザでサイトを開く
2. 課題カードの「📝 提出する」をクリック
3. Googleフォームが開き、**課題IDと教科が事前入力済み**になっていればOK

---

## 📊 スプシで承認する方法

`initSetup()` 実行後、スプシの「フォームの回答 1」シートに以下の列が追加されている:

| A列 | B列 | C列以降 ... | 末尾-2 | 末尾-1 | 末尾 |
|-----|-----|-----------|--------|--------|------|
| タイムスタンプ | ニックネーム | ... 各フィールド | **承認** | **フィードバック** | **XP加算済** |

- 承認するとき: 「承認」列に `TRUE` or `✅` を入力
- 差し戻すとき: 「フィードバック」列にコメント記入
- XP加算トリガー（後で `webapp.gs` に実装）: 承認TRUEかつXP加算済FALSEのときだけXPを加算

---

## 🚧 今後実装する `webapp.gs`（Phase 1.2）

以下の3機能を1つのGAS WebAppに実装予定:

1. **データ取得API** (`doGet`)
   - サイトが呼ぶ → 累積XP・総提出数・参加人数・最新提出一覧を JSON で返す
2. **承認トリガー** (`onEdit`)
   - 「承認」列が TRUE になったら自動で +20XP + Discord通知
3. **いいねAPI** (`doPost`)
   - サイトから `{ action: "like", id, delta }` を受信 → スプシ更新

実装時に clasp で管理し、このフォルダに `.gs` ファイルとして配置。
