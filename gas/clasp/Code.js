/**
 * 🐲 SHIFT AI ジュニア ドラゴン育成サイト
 * Googleフォーム + スプシ 一括セットアップ
 *
 * 使い方:
 *   Apps Scriptエディタで initSetup を1回実行するだけ。
 *   実行後、「設定」シートにフォームURLとEntry IDが書き込まれる。
 */

function initSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ----- 既存フォームのチェック（2重実行防止） -----
  const existing = ss.getSheetByName('設定');
  if (existing && existing.getRange('B2').getValue()) {
    safeAlert('⚠️ すでにセットアップ済みです。やり直す場合は「設定」シートを削除してから再実行してください。');
    return;
  }

  // ----- フォーム作成 -----
  const form = FormApp.create('🐲 ドラゴンの書 — 学習アウトプット提出フォーム');
  form.setDescription(
    'SHIFT AIジュニア ドラゴン育成プロジェクト\n' +
    'AIを使った学習の成果をここから提出してね。\n' +
    '講師が承認すると +20XP、ドラゴンが育ちます🔥'
  )
  .setConfirmationMessage('提出ありがとう！講師がチェックして承認するとXPが加算されるよ🐲')
  .setAllowResponseEdits(false)
  .setCollectEmail(false)
  .setShowLinkToRespondAgain(true);

  // ----- フィールド -----
  const nicknameItem = form.addTextItem()
    .setTitle('ニックネーム')
    .setHelpText('サイト上で表示される名前だよ（本名は入れないでね）')
    .setRequired(true);

  const missionIdItem = form.addTextItem()
    .setTitle('課題ID')
    .setHelpText('サイトのカードから「提出する」を押すと自動入力されるよ')
    .setRequired(true);

  const subjectItem = form.addMultipleChoiceItem()
    .setTitle('教科')
    .setChoiceValues(['英語', '数学', '国語', 'その他'])
    .setRequired(true);

  const contentItem = form.addParagraphTextItem()
    .setTitle('提出内容')
    .setHelpText('どんな学習をしたか、どんなAIを使ったか、学んだことなどを書いてね。\nAI出力をそのまま貼るのはNG。自分の言葉でまとめよう。')
    .setRequired(true);

  const urlItem = form.addTextItem()
    .setTitle('参考URL（任意）')
    .setHelpText('作品URL、スクショのGoogleドライブ共有リンクなど');

  const commentItem = form.addParagraphTextItem()
    .setTitle('ひとこと・質問（任意）')
    .setHelpText('講師への質問やコメントがあればどうぞ');

  // ----- スプシ紐付け -----
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // ----- 承認管理列の追加 -----
  Utilities.sleep(2000);
  const sheets = ss.getSheets();
  // フォーム回答シート＝最新追加シート
  const responseSheet = sheets[sheets.length - 1];
  responseSheet.setName('提出ログ');
  const lastCol = responseSheet.getLastColumn();
  responseSheet.getRange(1, lastCol + 1, 1, 3)
    .setValues([['承認', 'フィードバック', 'XP加算済']])
    .setFontWeight('bold')
    .setBackground('#F1C40F')
    .setFontColor('#000000');

  // ----- 設定シート作成 -----
  let setupSheet = ss.getSheetByName('設定');
  if (!setupSheet) setupSheet = ss.insertSheet('設定');
  setupSheet.clear();

  const rows = [
    ['項目', '値', '使い方'],
    ['FORM_URL',              form.getPublishedUrl(),                   'サイトの CONFIG.FORM_URL に貼る'],
    ['FORM_ENTRY_NICKNAME',   'entry.' + nicknameItem.getId(),          'サイトの CONFIG.FORM_ENTRY_NICKNAME に貼る'],
    ['FORM_ENTRY_MISSION_ID', 'entry.' + missionIdItem.getId(),         'サイトの CONFIG.FORM_ENTRY_MISSION_ID に貼る'],
    ['FORM_ENTRY_SUBJECT',    'entry.' + subjectItem.getId(),           'サイトの CONFIG.FORM_ENTRY_SUBJECT に貼る'],
    ['SPREADSHEET_ID',        ss.getId(),                               '後でwebapp.gsで使用'],
    ['FORM_EDIT_URL',         form.getEditUrl(),                        'フォーム編集画面'],
    ['SETUP_DATE',            new Date().toISOString(),                 'セットアップ実行日時'],
  ];
  setupSheet.getRange(1, 1, rows.length, 3).setValues(rows);
  setupSheet.getRange('A1:C1').setFontWeight('bold').setBackground('#7D3C98').setFontColor('#FFFFFF');
  setupSheet.setColumnWidth(1, 220);
  setupSheet.setColumnWidth(2, 500);
  setupSheet.setColumnWidth(3, 280);
  setupSheet.setFrozenRows(1);

  safeAlert(
    '✅ セットアップ完了！\n\n' +
    '「設定」シートに FORM_URL と entry.XXXX が書き込まれました。\n' +
    '提出ログは「提出ログ」シートに自動で貯まります。'
  );
}

/**
 * UI アラート（スクリプトエディタから直接実行時のみ表示）
 * clasp run や関数を外から呼んだときはログだけ残す
 */
function safeAlert(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (e) {
    Logger.log(message);
  }
}

/**
 * Discord Webhook 送信ヘルパー
 * Google Apps Script の共有IPがCloudflareにbotっぽく見えて1015で弾かれる既知の問題対策として
 * 明示的にUser-Agentを指定する
 */
function sendDiscordWebhook_(url, payload) {
  return UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    headers: {
      'User-Agent': 'DragonBookBot/1.0 (+SHIFT AI Junior; Google Apps Script)'
    }
  });
}

/**
 * フォームを中高生向けに整える + 正しい prefill entry ID を取得して設定シート更新
 *  - 「課題ID」フィールドを「挑戦した課題」にリネーム
 *  - ヘルプ文を中高生向けに変更
 *  - form.createResponse().toPrefilledUrl() で本物のprefill URLを生成→entry IDを再取得
 *  - 設定シートを最新の値で更新
 */
function upgradeForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setup = ss.getSheetByName('設定');
  if (!setup) { safeAlert('⚠️ 設定シートがないよ'); return; }
  const editUrl = setup.getRange('B7').getValue();
  const formId = editUrl.toString().match(/\/forms\/d\/([^/]+)/)[1];
  const form = FormApp.openById(formId);

  // 1) 課題ID → 挑戦した課題 にリネーム
  const items = form.getItems();
  const missionItem = items.find(i => i.getTitle() === '課題ID' || i.getTitle() === '挑戦した課題');
  if (missionItem) {
    missionItem.setTitle('挑戦した課題');
    missionItem.asTextItem().setHelpText('カードから「📝 提出する」を押すと自動入力されます（自分で書き換えないでね）');
  }
  const subjectItem = items.find(i => i.getTitle() === '教科');

  // 2) 本物のprefill URLを生成
  const resp = form.createResponse();
  resp.withItemResponse(missionItem.asTextItem().createResponse('__MID_PLACEHOLDER__'));
  resp.withItemResponse(subjectItem.asMultipleChoiceItem().createResponse('英語'));
  const realPrefillUrl = resp.toPrefilledUrl();
  Logger.log('Real prefill URL: ' + realPrefillUrl);

  // 3) entry ID を抽出
  const missionEntryMatch = realPrefillUrl.match(/(entry\.\d+)=__MID_PLACEHOLDER__/);
  const subjectEntryMatch = realPrefillUrl.match(/(entry\.\d+)=[^&]+$|(entry\.\d+)=%E8%8B%B1%E8%AA%9E/);
  const realMissionEntry = missionEntryMatch ? missionEntryMatch[1] : '';
  const realSubjectEntry = subjectEntryMatch ? (subjectEntryMatch[1] || subjectEntryMatch[2]) : '';
  Logger.log('取得した entry ID: mission=' + realMissionEntry + ' subject=' + realSubjectEntry);

  // 4) 設定シートを更新
  const data = setup.getRange('A1:C' + setup.getLastRow()).getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === 'FORM_ENTRY_MISSION_ID' && realMissionEntry) {
      setup.getRange(i + 1, 2).setValue(realMissionEntry);
    } else if (data[i][0] === 'FORM_ENTRY_SUBJECT' && realSubjectEntry) {
      setup.getRange(i + 1, 2).setValue(realSubjectEntry);
    }
  }
  // サンプル prefill URL も記録
  setup.getRange(setup.getLastRow() + 1, 1, 1, 3).setValues([[
    'SAMPLE_PREFILL_URL', realPrefillUrl, 'デバッグ用サンプル'
  ]]);

  safeAlert(
    '✅ フォーム更新完了\n' +
    '・「課題ID」→「挑戦した課題」に変更\n' +
    '・正しい entry ID を設定シートに反映'
  );
}

/**
 * 提出ログシートを修復する
 * - 空の「提出ログ」シート（誤作成）を削除
 * - 「フォームの回答 1」を「提出ログ」にリネーム
 * - 承認・フィードバック・XP加算済 列を追加（既に無ければ）
 */
function fixResponseSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. 空の誤作成 提出ログ があれば削除
  const existing = ss.getSheetByName('提出ログ');
  if (existing) {
    const lastRow = existing.getLastRow();
    const lastCol = existing.getLastColumn();
    const vals = existing.getRange(1, 1, Math.max(1, lastRow), Math.max(1, lastCol)).getValues();
    // データが「承認・フィードバック・XP加算済」の1行だけなら削除対象
    const header = (vals[0] || []).join('|');
    if (header === '承認|フィードバック|XP加算済') {
      ss.deleteSheet(existing);
      Logger.log('空の提出ログを削除しました');
    }
  }

  // 2. フォーム回答シートをリネーム
  const formSheet = ss.getSheetByName('フォームの回答 1');
  if (!formSheet) {
    safeAlert('⚠️ 「フォームの回答 1」シートが見つかりません。');
    return;
  }
  formSheet.setName('提出ログ');
  Logger.log('フォーム回答シートを「提出ログ」にリネームしました');

  // 3. 承認関連の列を追加（既に無い場合のみ）
  const headers = formSheet.getRange(1, 1, 1, formSheet.getLastColumn()).getValues()[0];
  if (!headers.includes('承認')) {
    const lastCol = formSheet.getLastColumn();
    formSheet.getRange(1, lastCol + 1, 1, 3)
      .setValues([['承認', 'フィードバック', 'XP加算済']])
      .setFontWeight('bold')
      .setBackground('#F1C40F')
      .setFontColor('#000000');
    Logger.log('承認・フィードバック・XP加算済 列を追加しました');
  }

  safeAlert('✅ 提出ログシートを修復しました！\n提出ログシートに承認・フィードバック列があるか確認してね。');
}

/**
 * Discord Webhook 疎通テスト
 * スクリプトプロパティ `DISCORD_WEBHOOK_URL` に登録済みのWebhookにテストメッセージを送る
 */
function testDiscordWebhook() {
  const url = PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL');
  if (!url) {
    Logger.log('❌ DISCORD_WEBHOOK_URL が設定されていません');
    Logger.log('  プロジェクトの設定 → スクリプトプロパティ で登録してね');
    safeAlert('❌ DISCORD_WEBHOOK_URL が未登録です');
    return;
  }
  Logger.log('✅ DISCORD_WEBHOOK_URL 取得 OK (長さ=' + url.length + ')');

  const payload = {
    username: '🐲 ドラゴンの書',
    embeds: [{
      title: '🔥 Webhook疎通テスト',
      description: 'ドラゴン育成システムの自動通知チャンネルです。\nこのメッセージが見えたら設定完了！',
      color: 0xF1C40F,
      footer: { text: 'SHIFT AIジュニア ドラゴン育成プロジェクト' },
      timestamp: new Date().toISOString()
    }]
  };

  const response = sendDiscordWebhook_(url, payload);
  const code = response.getResponseCode();
  Logger.log('Discord応答コード: ' + code);

  if (code >= 200 && code < 300) {
    safeAlert('✅ Discordにテストメッセージを送信しました！\nチャンネルを確認してください🐲');
  } else {
    safeAlert('⚠️ Discord送信失敗 (HTTP ' + code + ')\n' + response.getContentText().substring(0, 200));
  }
}

/**
 * 教科フィールドを削除する
 * 理由: 課題IDに教科が埋め込まれているため冗長（m-e=英語, m-m=数学, m-j=国語, m-o=その他）
 * 提出時に裏で自動判別する
 */
function removeSubjectField() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setup = ss.getSheetByName('設定');
  if (!setup) { safeAlert('⚠️ 設定シートがないよ'); return; }
  const editUrl = setup.getRange('B7').getValue();
  const formId = editUrl.toString().match(/\/forms\/d\/([^/]+)/)[1];
  const form = FormApp.openById(formId);

  const items = form.getItems();
  const subjectItem = items.find(i => i.getTitle() === '教科');
  if (subjectItem) {
    form.deleteItem(subjectItem);
    Logger.log('教科フィールドを削除しました');
  } else {
    Logger.log('教科フィールドは既に存在しません');
  }

  // 設定シートの FORM_ENTRY_SUBJECT 行にメモを残す
  const data = setup.getRange('A1:C' + setup.getLastRow()).getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === 'FORM_ENTRY_SUBJECT') {
      setup.getRange(i + 1, 2, 1, 2).setValues([['(削除済み)', '教科はmission ID先頭から自動判別']]);
      break;
    }
  }

  safeAlert('✅ 教科フィールドを削除しました。\n提出時は挑戦した課題の欄だけでOKになります。');
}

/**
 * Email収集を有効化する
 * 実行すると既存のGoogleフォームの「メールアドレスを収集する」がONになる。
 * 以降の提出はスプシ「提出ログ」シートに Email 列が追加される。
 */
function enableEmailCollection() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setup = ss.getSheetByName('設定');
  if (!setup) {
    safeAlert('⚠️ 「設定」シートが見つかりません。先に initSetup を実行してください。');
    return;
  }
  const editUrl = setup.getRange('B7').getValue();
  const match = editUrl && editUrl.toString().match(/\/forms\/d\/([^/]+)/);
  if (!match) {
    safeAlert('⚠️ フォーム編集URLが取得できませんでした。');
    return;
  }
  const formId = match[1];
  const form = FormApp.openById(formId);
  form.setCollectEmail(true);

  // 設定シートに記録
  const lastRow = setup.getLastRow();
  setup.getRange(lastRow + 1, 1, 1, 3).setValues([[
    'EMAIL_COLLECT',
    'TRUE',
    'メール収集ON（' + new Date().toISOString() + '）'
  ]]);

  Logger.log('✅ Email収集を有効化しました');
  Logger.log('フォーム: ' + form.getPublishedUrl());
  safeAlert('✅ Email収集を有効化しました！\n次回以降の提出にメアドが含まれます。');
}

// ※ onApprovalEdit は Webapp.gs に本実装あり
