/**
 * 🐲 SHIFT AI ジュニア ドラゴン育成サイト
 * ============================================================
 * Googleフォーム + スプシ 一括セットアップスクリプト
 * ============================================================
 *
 * ■ 使い方（初回1回だけ）
 *   1. Googleスプレッドシート を新規作成（空でOK。名前は「ドラゴンの書_管理」等）
 *   2. 拡張機能 → Apps Script を開く
 *   3. このコード全文を貼り付けて保存
 *   4. 関数 initSetup を実行
 *   5. 初回はGoogle認証ダイアログが出るので承認
 *   6. 実行後、「表示」→「ログ」で出力を確認
 *   7. ログに出る FORM_URL と entry.XXXX をメモ
 *   8. index.html の assets/js/script.js の CONFIG に貼り付け
 *
 * ■ 出力されるもの
 *   - Googleフォーム（公開URL）
 *   - スプシに「フォームの回答」シート自動生成
 *   - 承認管理用の列（後述）を案内
 */

function initSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ----- フォーム作成 -----
  const form = FormApp.create('🐲 ドラゴンの書 — 学習アウトプット提出フォーム');
  form.setDescription(
    'SHIFT AIジュニア ドラゴン育成プロジェクト。\n' +
    'AIを使った学習の成果をここから提出してね。\n' +
    '講師が承認すると +20XP、ドラゴンが育ちます🔥'
  )
  .setConfirmationMessage('提出ありがとう！講師がチェックして承認するとXPが加算されるよ🐲')
  .setAllowResponseEdits(false)
  .setCollectEmail(false)
  .setShowLinkToRespondAgain(true);

  // ----- フィールド作成 -----
  const nicknameItem = form.addTextItem()
    .setTitle('ニックネーム')
    .setHelpText('サイト上で表示される名前だよ（本名は入れないでね）')
    .setRequired(true);

  const missionIdItem = form.addTextItem()
    .setTitle('課題ID')
    .setHelpText('サイトのカードから「提出する」を押すと自動入力されるよ（手動入力も可）')
    .setRequired(true);

  const subjectItem = form.addMultipleChoiceItem()
    .setTitle('教科')
    .setChoiceValues(['英語', '数学', '国語', 'その他'])
    .setRequired(true);

  const contentItem = form.addParagraphTextItem()
    .setTitle('提出内容')
    .setHelpText(
      'どんな学習をしたか、どんなAIを使ったか、学んだことなどを書いてね。\n' +
      '※ AIが出力した文章をそのまま貼るのはNG。自分の言葉でまとめよう。'
    )
    .setRequired(true);

  const urlItem = form.addTextItem()
    .setTitle('参考URL（任意）')
    .setHelpText('作品のURL、スクショのGoogleドライブ共有リンクなど');

  const commentItem = form.addParagraphTextItem()
    .setTitle('ひとこと・質問（任意）')
    .setHelpText('講師への質問やコメントがあればどうぞ');

  // ----- スプシ紐付け -----
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // ----- 承認管理用の列を追記 -----
  // フォームの回答シートに「承認」「フィードバック」列を追加
  Utilities.sleep(1500); // 回答シートが自動生成されるのを待つ
  const sheets = ss.getSheets();
  const responseSheet = sheets[sheets.length - 1]; // 最後に追加されたシート = フォーム回答シート
  const lastCol = responseSheet.getLastColumn();
  responseSheet.getRange(1, lastCol + 1).setValue('承認').setFontWeight('bold').setBackground('#F1C40F');
  responseSheet.getRange(1, lastCol + 2).setValue('フィードバック').setFontWeight('bold').setBackground('#F1C40F');
  responseSheet.getRange(1, lastCol + 3).setValue('XP加算済').setFontWeight('bold').setBackground('#F1C40F');

  // ----- ログ出力 -----
  const publishedUrl = form.getPublishedUrl();
  const editUrl = form.getEditUrl();

  Logger.log('==================================================');
  Logger.log('✅ フォーム作成完了！');
  Logger.log('==================================================');
  Logger.log('公開URL（生徒はこちら）: ' + publishedUrl);
  Logger.log('編集URL: ' + editUrl);
  Logger.log('');
  Logger.log('【assets/js/script.js の CONFIG に貼り付け】');
  Logger.log('  FORM_URL:              "' + publishedUrl + '",');
  Logger.log('  FORM_ENTRY_NICKNAME:   "entry.' + nicknameItem.getId() + '",');
  Logger.log('  FORM_ENTRY_MISSION_ID: "entry.' + missionIdItem.getId() + '",');
  Logger.log('  FORM_ENTRY_SUBJECT:    "entry.' + subjectItem.getId() + '",');
  Logger.log('==================================================');
  Logger.log('スプシの「フォームの回答」シートに "承認" 列ができたよ。');
  Logger.log('承認するときは "承認" 列に TRUE を入れる or ✅ 入力してください。');
  Logger.log('==================================================');
}

/**
 * 毎回のフォーム送信時に呼ばれる（初期設定時に手動で追加）
 * Discord に通知 + サイトに反映する用のトリガー（後で実装）
 */
function onFormSubmit(e) {
  // TODO: Discord Webhook で「新しい提出があったよ」通知
  // TODO: 承認トリガーと連動（別関数）
}

/**
 * 承認時のトリガー（スプシの onEdit）
 * 承認列にTRUEが入ったらXP加算 + Discord通知
 */
function onApprovalEdit(e) {
  // TODO: 実装
  //  - 編集されたセルが「承認」列か判定
  //  - TRUEなら XP+20 加算 / Discord通知
  //  - FALSEなら 差し戻し通知
}
