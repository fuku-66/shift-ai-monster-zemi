/**
 * 🥚 SHIFT AI ジュニア モンスター育成プロジェクト
 * ============================================================
 * WebApp 本体（5軸XP集計 + 即時XP加算 + 2カテゴリ対応）
 * ============================================================
 *
 * セットアップ:
 *   1. このスクリプトを「提出ログ」スプシにバインドする
 *   2. ScriptProperties に DISCORD_WEBHOOK_URL を設定
 *   3. setupSheet() を1回手動実行（ヘッダー＆チェックボックス自動化）
 *   4. installAllTriggers() を1回手動実行
 *   5. 「ウェブアプリ」としてデプロイ → URLをサイトのconfig.jsに貼る
 *
 * カテゴリ:
 *   📦 成果物 (output): 既存25課題から選択 / mission ID = m-{教科}{難易度}
 *   🏆 成果   (result): フリー報告枠 / mission ID = r-{教科}{難易度} / XP×3倍
 */

const XP_BY_STAR_OUTPUT = { 1: 15, 2: 25, 3: 40, 4: 60, 5: 80 };
const XP_RESULT_FIXED = 120; // 成果報告は難易度なしで一律
const SHEET_LOG = '提出ログ';

const EVOLUTION = [
  { lv: 1, name: 'タマゴ',         xpStart: 0,    monsterKey: 'egg' },
  { lv: 2, name: 'ヒナ',           xpStart: 200,  monsterKey: 'hatchling' },
  { lv: 3, name: '子モンスター',    xpStart: 600,  monsterKey: 'baby' },
  { lv: 4, name: '最終形態',        xpStart: 1500, monsterKey: 'final' },
];

const SUBJECT_MAP = { 'a': 'AI基礎', 'e': '英語', 'm': '数学', 's': '勉強法', 'c': 'クリエイティブ' };
const SUBJECT_TO_CODE = { 'AI基礎': 'a', '英語': 'e', '数学': 'm', '勉強法': 's', 'クリエイティブ': 'c' };
const AXIS_KEY    = { 'AI基礎': 'ai', '英語': 'eng', '数学': 'math', '勉強法': 'study', 'クリエイティブ': 'creative' };
const MONSTER_BY_AXIS = {
  ai:       { baby: '子サイバービースト',   final: 'サイバービースト' },
  eng:      { baby: '子フェニックス',       final: 'フェニックス' },
  math:     { baby: '子クリスタルゴーレム', final: 'クリスタルゴーレム' },
  study:    { baby: '子シャドウウルフ',     final: 'シャドウウルフ' },
  creative: { baby: '子レインボードラゴン', final: 'レインボードラゴン' },
  balance:  { baby: '子ユニコーン',         final: 'ユニコーン神獣' },
};
const BALANCE_THRESHOLD = 10;

/* ================================================================
   GET: サイト用JSON
   ================================================================ */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || '';
    if (action === 'createForm')  return jsonOut_(ensureSubmitForm_());
    if (action === 'rebuildForm') return jsonOut_(ensureSubmitForm_(true));
    if (action === 'formInfo')    return jsonOut_(getFormInfo_());
    if (action === 'setupSheet') return jsonOut_(setupSheetSilent_());
    if (action === 'installTriggers') return jsonOut_(installTriggersSilent_());
    if (action === 'rebuildResultForm') return jsonOut_(ensureResultForm_(true));
    if (action === 'createResultForm') return jsonOut_(ensureResultForm_());
    if (action === 'inspectSheets') return jsonOut_(inspectSheets_());
    if (action === 'buildHub') return jsonOut_(buildHubSheet_());
    if (action === 'cleanup') return jsonOut_(cleanupSheets_());
    if (action === 'lockAutoSheets') return jsonOut_(lockAndHideAutoSheets_());
    return jsonOut_(buildSiteState_());
  } catch (err) {
    return jsonOut_({ error: String(err) });
  }
}

/* 成果報告 専用フォーム（成果物フォームと別） */
function ensureResultForm_(forceRebuild) {
  const props = PropertiesService.getScriptProperties();
  const existingId = props.getProperty('RESULT_FORM_ID');
  if (existingId && !forceRebuild) {
    try {
      const f = FormApp.openById(existingId);
      return { ok: true, formUrl: f.getPublishedUrl(), editUrl: f.getEditUrl(), reused: true };
    } catch (err) {
      props.deleteProperty('RESULT_FORM_ID');
    }
  }
  if (existingId && forceRebuild) {
    try { DriveApp.getFileById(existingId).setTrashed(true); } catch (e) {}
    props.deleteProperty('RESULT_FORM_ID');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const form = FormApp.create('🏆 SHIFT AI ジュニア 成果報告フォーム');
  form.setDescription(
    '🏆 成果報告（一律 +120 XP）\n\n' +
    'コンテスト入賞・受賞・成績アップ・点数アップ・採用などの実績を報告するフォームです。\n' +
    '通常の成果物（AIで作成したもの）の提出は、別フォームから行ってください。'
  );
  form.setCollectEmail(true);

  // 1. ニックネーム
  form.addTextItem()
    .setTitle('ニックネーム（Discordと同じ名前）')
    .setRequired(true);

  // 2. タイトル
  form.addParagraphTextItem()
    .setTitle('タイトル（何の成果か）')
    .setHelpText('例：「英検3級合格」「校内絵画展で金賞」「数学テスト80点→90点」')
    .setRequired(true);

  // 3. 成果の種類
  form.addMultipleChoiceItem()
    .setTitle('🏅 成果の種類')
    .setHelpText('最も近いものを1つ選択してください。')
    .setChoiceValues([
      'コンテスト入賞', '受賞', '外部評価', '採用実績',
      '成績アップ', '点数アップ', 'その他',
    ])
    .showOtherOption(true)
    .setRequired(true);

  // 5. 成果の内容
  form.addParagraphTextItem()
    .setTitle('成果の内容')
    .setHelpText('どのような取り組みで達成したか、使用したAI、工夫した点、期間などを記入してください。')
    .setRequired(true);

  // 6. 参考ファイル
  try {
    form.addFileUploadItem()
      .setTitle('参考ファイル（任意）')
      .setHelpText('賞状・成績表・受賞ページのスクリーンショットなど。個人情報が写っている部分はモザイクまたはトリミング処理を行ってください。')
      .setRequired(false);
  } catch (e) {
    Logger.log('ファイルアップロード追加に失敗: ' + e);
  }

  // 7. 参考URL
  form.addTextItem()
    .setTitle('参考URL（任意）')
    .setHelpText('受賞ページ・コンテスト結果ページなどのリンクを記入してください。');

  // 8. ひとこと
  form.addParagraphTextItem().setTitle('ひとこと・質問（任意）');

  // 9. 外部公開（紹介）への同意（必須）
  form.addSectionHeaderItem()
    .setTitle('🔓 SHIFT AIでの紹介への同意（必須）')
    .setHelpText(
      'Discordチャンネルでは、提出があったことを成果の共有として常に通知します。\n' +
      'この同意確認は、SHIFT AIの公式ブログやセミナーなどで、生徒の成果事例として紹介してよいかを確認するものです。\n\n' +
      '・フルネーム・住所・学校名・電話番号などの個人情報は記入しないでください。\n' +
      '・万一、個人情報が含まれていた場合は、運営側で該当部分を伏せた上で紹介します。'
    );

  form.addMultipleChoiceItem()
    .setTitle('SHIFT AIの公式ブログ・セミナーなどで成果事例として紹介することに同意しますか？')
    .setHelpText('XPの加算と Discord での成果共有は同意の有無に関わらず行われます。「同意しません」を選択した場合、SHIFT AIの外部発信での紹介には使用しません。')
    .setChoiceValues(['同意します', '同意しません'])
    .setRequired(true);

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  props.setProperty('RESULT_FORM_ID', form.getId());
  return { ok: true, formUrl: form.getPublishedUrl(), editUrl: form.getEditUrl(), reused: false };
}

// 現在使用中のフォーム連携シート（フォームの回答 N）を保護＋非表示
function lockAndHideAutoSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();
  const formId = props.getProperty('FORM_ID');
  const resultFormId = props.getProperty('RESULT_FORM_ID');
  const targets = [formId, resultFormId].filter(Boolean);
  const processed = [];
  const errors = [];

  ss.getSheets().forEach(sh => {
    const name = sh.getName();
    if (name.indexOf('フォームの回答') !== 0) return;

    // 紐付くフォームIDを取得
    let linkedFormId = '';
    try {
      const url = sh.getFormUrl && sh.getFormUrl();
      if (url) {
        const m = url.match(/\/forms\/d\/([^\/]+)/);
        if (m) linkedFormId = m[1];
      }
    } catch (e) {}
    if (!targets.includes(linkedFormId)) return;

    try {
      // 既存の保護を解除してから新規設定（warning型 = 編集時に警告表示）
      sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(p => {
        try { p.remove(); } catch (e) {}
      });
      sh.protect()
        .setDescription('🔒 フォーム自動バックアップ（システム使用・編集すると壊れる可能性あり）')
        .setWarningOnly(true);

      // 非表示
      sh.hideSheet();
      processed.push(name);
    } catch (e) {
      errors.push(name + ': ' + e);
    }
  });

  return { ok: true, processed, errors };
}

// スプシをクリーンアップ（古い「フォームの回答」シート削除/隠し + 提出ログ初期化）
function cleanupSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const removed = [];
  const hidden = [];
  const errors = [];
  const props = PropertiesService.getScriptProperties();
  const currentFormId = props.getProperty('FORM_ID');
  const currentResultFormId = props.getProperty('RESULT_FORM_ID');

  // 古いフォーム連携シートをすべて処理
  ss.getSheets().slice().forEach(sh => {
    const name = sh.getName();
    if (name.indexOf('フォームの回答') !== 0) return;

    // フォームURLからIDを抽出
    let linkedFormId = '';
    try {
      const formUrl = sh.getFormUrl && sh.getFormUrl();
      if (formUrl) {
        const m = formUrl.match(/\/forms\/d\/([^\/]+)/);
        if (m) linkedFormId = m[1];
      }
    } catch (e) {}

    // 現在使用中のフォーム（成果物・成果報告）に紐付くシートはスキップ
    if (linkedFormId && (linkedFormId === currentFormId || linkedFormId === currentResultFormId)) {
      return;
    }

    // それ以外は destination を解除して削除
    if (linkedFormId) {
      try {
        FormApp.openById(linkedFormId).removeDestination();
      } catch (e) {
        // フォーム自体がゴミ箱にある等。シート単独で削除を試行
      }
    }

    try {
      ss.deleteSheet(sh);
      removed.push(name);
    } catch (e) {
      // 削除できない場合は隠す
      try {
        sh.clear();
        sh.hideSheet();
        sh.setName('_archived_' + name + '_' + new Date().getTime());
        hidden.push(name);
      } catch (e2) {
        errors.push(name + ': ' + e2);
      }
    }
  });

  // 提出ログのデータ行をクリア（ヘッダーだけ残す）
  const log = ss.getSheetByName(SHEET_LOG);
  let cleared = 0;
  if (log && log.getLastRow() > 1) {
    cleared = log.getLastRow() - 1;
    log.getRange(2, 1, cleared, log.getLastColumn()).clearContent();
  }

  return { ok: true, removedSheets: removed, hiddenSheets: hidden, logRowsCleared: cleared, errors };
}

// 提出ログシートに行を追加（カラム名で柔軟マッピング）
function appendToLog_(sh, data) {
  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const row = new Array(header.length).fill('');
  const setVal = (name, val) => {
    const i = header.findIndex(h => String(h).indexOf(name) >= 0);
    if (i >= 0) row[i] = val;
  };
  setVal('タイムスタンプ', data.timestamp);
  setVal('メールアドレス', data.email);
  setVal('ニックネーム', data.nickname);
  setVal('カテゴリ', data.category);
  setVal('挑戦した課題', data.mission);
  setVal('教科', data.subject);
  setVal('難易度', data.difficulty);
  setVal('成果の種類', data.resultType);
  setVal('提出内容', data.content);
  setVal('参考URL', data.url);
  setVal('ひとこと', data.comment);
  setVal('同意', data.consent);
  setVal('承認', data.approved);
  setVal('通知済', data.notified);
  sh.appendRow(row);
}

// シート一覧と各シートの行数を返す
function inspectSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    ssId: ss.getId(),
    ssUrl: ss.getUrl(),
    sheets: ss.getSheets().map(sh => ({
      name: sh.getName(),
      gid: sh.getSheetId(),
      rows: sh.getLastRow(),
      cols: sh.getLastColumn(),
    }))
  };
}

// 📎 リンク集（ハブシート）を生成
function buildHubSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let hub = ss.getSheetByName('📎 リンク集');
  if (!hub) hub = ss.insertSheet('📎 リンク集', 0);
  hub.clear();
  hub.setTabColor('#F1C40F');

  const props = PropertiesService.getScriptProperties();
  const formId = props.getProperty('FORM_ID');
  const resultFormId = props.getProperty('RESULT_FORM_ID');
  const scriptId = ScriptApp.getScriptId();
  const ssId = ss.getId();

  let outputForm = null, resultForm = null, outputSheetUrl = '', resultSheetUrl = '';
  try {
    if (formId) {
      outputForm = FormApp.openById(formId);
      const dest = outputForm.getDestinationId();
      if (dest === ssId) {
        // フォームの保存先シートを探す
        ss.getSheets().forEach(sh => {
          if (sh.getFormUrl && sh.getFormUrl() && sh.getFormUrl().indexOf(formId) >= 0) {
            outputSheetUrl = ss.getUrl() + '#gid=' + sh.getSheetId();
          }
        });
      }
    }
  } catch (e) {}
  try {
    if (resultFormId) {
      resultForm = FormApp.openById(resultFormId);
      ss.getSheets().forEach(sh => {
        if (sh.getFormUrl && sh.getFormUrl() && sh.getFormUrl().indexOf(resultFormId) >= 0) {
          resultSheetUrl = ss.getUrl() + '#gid=' + sh.getSheetId();
        }
      });
    }
  } catch (e) {}

  const ssBaseUrl = ss.getUrl();
  const rows = [
    ['カテゴリ', '項目', 'URL'],
    ['🌐 公開', '公開サイト（GitHub Pages）', 'https://fuku-66.github.io/shift-ai-monster-zemi/'],
    ['🌐 公開', 'GitHubリポジトリ', 'https://github.com/fuku-66/shift-ai-monster-zemi'],
    ['📦 成果物', '提出フォーム（生徒共有用）', outputForm ? outputForm.getPublishedUrl() : '(未作成)'],
    ['📦 成果物', 'フォーム編集画面', outputForm ? outputForm.getEditUrl() : '(未作成)'],
    ['📦 成果物', '提出データの保存先シート', outputSheetUrl || '(未送信のため未生成)'],
    ['🏆 成果報告', '報告フォーム（生徒共有用）', resultForm ? resultForm.getPublishedUrl() : '(未作成)'],
    ['🏆 成果報告', 'フォーム編集画面', resultForm ? resultForm.getEditUrl() : '(未作成)'],
    ['🏆 成果報告', '報告データの保存先シート', resultSheetUrl || '(未送信のため未生成)'],
    ['🛠️ 管理', '管理スプシ（このファイル）', ssBaseUrl],
    ['🛠️ 管理', 'GASエディタ', 'https://script.google.com/d/' + scriptId + '/edit'],
    ['🛠️ 管理', 'GAS WebApp（API endpoint）', ScriptApp.getService().getUrl() || ''],
  ];

  // 既存シート一覧
  rows.push(['', '', '']);
  rows.push(['📊 シート一覧', '', '']);
  ss.getSheets().forEach(sh => {
    if (sh.getName() === '📎 リンク集') return;
    const isFormBound = sh.getFormUrl && sh.getFormUrl();
    const tag = isFormBound ? '（フォーム連携）' : '';
    rows.push(['', sh.getName() + tag + ' ' + sh.getLastRow() + '行', ssBaseUrl + '#gid=' + sh.getSheetId()]);
  });

  hub.getRange(1, 1, rows.length, 3).setValues(rows);
  hub.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#F1C40F').setFontColor('#000');
  hub.setColumnWidth(1, 110);
  hub.setColumnWidth(2, 280);
  hub.setColumnWidth(3, 600);
  hub.setFrozenRows(1);

  // 一番左に移動
  ss.setActiveSheet(hub);
  ss.moveActiveSheet(1);

  return {
    ok: true,
    hubUrl: ssBaseUrl + '#gid=' + hub.getSheetId(),
    rowCount: rows.length,
  };
}

// HTTP経由で実行可能（UIアラートなし）
function setupSheetSilent_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_LOG);
  if (!sh) sh = ss.insertSheet(SHEET_LOG);

  const requiredHeaders = ['カテゴリ', '教科', '難易度', '成果の種類', '同意', '承認', 'フィードバック', '通知済'];
  const added = [];

  if (sh.getLastRow() === 0) {
    const fullHeaders = [
      'タイムスタンプ', 'メールアドレス', 'ニックネーム',
      'カテゴリ', '挑戦した課題', '教科', '難易度', '成果の種類',
      '提出内容', '提出ファイル', '参考URL（任意）', 'ひとこと・質問（任意）',
      '承認', 'フィードバック', '通知済',
    ];
    sh.getRange(1, 1, 1, fullHeaders.length).setValues([fullHeaders]);
    sh.getRange(1, 1, 1, fullHeaders.length).setFontWeight('bold').setBackground('#F1C40F');
    fullHeaders.forEach(h => added.push(h));
  } else {
    const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    requiredHeaders.forEach(h => {
      if (header.indexOf(h) === -1) {
        const newCol = sh.getLastColumn() + 1;
        sh.getRange(1, newCol).setValue(h);
        sh.getRange(1, newCol).setFontWeight('bold').setBackground('#F1C40F');
        added.push(h);
      }
    });
  }

  const lastRow = Math.max(1000, sh.getMaxRows());
  const headerNow = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const iApproved = headerNow.indexOf('承認') + 1;
  const iNotified = headerNow.indexOf('通知済') + 1;
  const cb = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  if (iApproved > 0) sh.getRange(2, iApproved, lastRow - 1, 1).setDataValidation(cb);
  if (iNotified > 0) {
    sh.getRange(2, iNotified, lastRow - 1, 1).setDataValidation(cb);
    try { sh.hideColumns(iNotified); } catch (e) {}
  }
  return { ok: true, addedHeaders: added };
}

function installTriggersSilent_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.getProjectTriggers().forEach(t => {
    const fn = t.getHandlerFunction();
    if (fn === 'onApprovalEdit' || fn === 'onFormSubmit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onApprovalEdit').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(ss).onFormSubmit().create();
  return { ok: true, triggers: ['onApprovalEdit', 'onFormSubmit'] };
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getFormInfo_() {
  const props = PropertiesService.getScriptProperties();
  const formId = props.getProperty('FORM_ID');
  if (!formId) return { ok: false, message: 'FORM not created yet' };
  try {
    const f = FormApp.openById(formId);
    const items = f.getItems();

    // toPrefilledUrl()でprefillエントリーIDを抽出
    const SAMPLES = {
      'ニックネーム':   '__NICK__',
      '挑戦した課題':   '__MISSION__',
      'タイトル':       '__TITLE__',
      '提出内容':       '__CONTENT__',
      '参考URL':        '__URL__',
      'ひとこと':       '__COMMENT__',
    };
    const response = f.createResponse();
    items.forEach(it => {
      try {
        const title = it.getTitle();
        let key = null;
        Object.keys(SAMPLES).forEach(k => { if (title.indexOf(k) >= 0) key = k; });
        if (!key) return;
        const type = it.getType();
        if (type === FormApp.ItemType.TEXT) {
          response.withItemResponse(it.asTextItem().createResponse(SAMPLES[key]));
        } else if (type === FormApp.ItemType.PARAGRAPH_TEXT) {
          response.withItemResponse(it.asParagraphTextItem().createResponse(SAMPLES[key]));
        }
      } catch (e) {}
    });
    const prefilledUrl = response.toPrefilledUrl();

    // entry IDマッピング
    const entries = {};
    const labelMap = {
      'ニックネーム':   'nickname',
      '挑戦した課題':   'mission',
      'タイトル':       'title',
      '提出内容':       'content',
      '参考URL':        'url',
      'ひとこと':       'comment',
    };
    Object.keys(SAMPLES).forEach(label => {
      const sample = SAMPLES[label];
      const re = new RegExp('(entry\\.\\d+)=' + sample);
      const m = prefilledUrl.match(re);
      if (m) entries[labelMap[label]] = m[1];
    });

    // カテゴリ・教科・難易度のentry IDも抽出（ラジオ/プルダウン）
    items.forEach(it => {
      try {
        const title = it.getTitle();
        const type = it.getType();
        const id = 'entry.' + it.getId();
        if (title.indexOf('カテゴリ') >= 0) entries.category = id;
        else if (title.indexOf('教科') >= 0) entries.subject = id;
        else if (title.indexOf('難易度') >= 0) entries.difficulty = id;
        else if (title.indexOf('成果の種類') >= 0) entries.resultType = id;
      } catch (e) {}
    });

    return {
      ok: true,
      formUrl: f.getPublishedUrl(),
      entries,
      prefilledUrl,
    };
  } catch (err) {
    return { ok: false, message: String(err) };
  }
}

function ensureSubmitForm_(forceRebuild) {
  const props = PropertiesService.getScriptProperties();
  const existingId = props.getProperty('FORM_ID');
  if (existingId && !forceRebuild) {
    try {
      const f = FormApp.openById(existingId);
      return { ok: true, formUrl: f.getPublishedUrl(), editUrl: f.getEditUrl(), reused: true };
    } catch (err) {
      props.deleteProperty('FORM_ID');
    }
  }
  if (existingId && forceRebuild) {
    try { DriveApp.getFileById(existingId).setTrashed(true); } catch (e) {}
    props.deleteProperty('FORM_ID');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const form = FormApp.create('📦 SHIFT AI ジュニア 成果物提出フォーム');
  form.setDescription(
    '📦 成果物の提出フォームです。\n\n' +
    'AIで作成した画像・文章・スライド・動画・デザイン・コードなどの成果物を提出してください。\n' +
    '受賞・点数アップなどの「成果」を報告したい場合は、別途「成果報告フォーム」をご利用ください。'
  );
  form.setCollectEmail(true);

  // 1. ニックネーム
  form.addTextItem()
    .setTitle('ニックネーム（Discordと同じ名前）')
    .setRequired(true);

  // 2. 挑戦した課題
  form.addParagraphTextItem()
    .setTitle('挑戦した課題')
    .setHelpText('サイトの課題カードから「📝 提出する」を押すと自動入力されます。')
    .setRequired(true);

  // 3. 提出内容
  form.addParagraphTextItem()
    .setTitle('提出内容')
    .setHelpText('AIとのやり取り、気づいたこと、工夫した点、スクリーンショットの説明などを記入してください。')
    .setRequired(true);

  // 4. 提出ファイル
  try {
    form.addFileUploadItem()
      .setTitle('提出ファイル（任意）')
      .setHelpText('画像・PDF・作品ファイルなどを添付できます。個人情報が写っている部分はモザイクまたはトリミング処理を行ってください。')
      .setRequired(false);
  } catch (e) {
    Logger.log('ファイルアップロード追加に失敗: ' + e);
  }

  // 5. 参考URL
  form.addTextItem()
    .setTitle('参考URL（任意）')
    .setHelpText('作品やプロンプトの共有リンクなど。');

  // 6. ひとこと
  form.addParagraphTextItem().setTitle('ひとこと・質問（任意）');

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  props.setProperty('FORM_ID', form.getId());
  return { ok: true, formUrl: form.getPublishedUrl(), editUrl: form.getEditUrl(), reused: false };
}

function rebuildSubmitForm() {
  const r = ensureSubmitForm_(true);
  Logger.log('REBUILT FORM_URL: ' + r.formUrl);
  try {
    SpreadsheetApp.getUi().alert(
      '✅ フォーム再構築完了\n\n' +
      '📋 新しい提出URL:\n' + r.formUrl + '\n\n' +
      '✏️ 編集URL:\n' + r.editUrl
    );
  } catch (e) {}
  return r;
}

/* ================================================================
   サイト表示用データを組み立てる
   ================================================================ */
function findLogSheet_(ss) {
  let best = ss.getSheetByName(SHEET_LOG);
  if (!best || best.getLastRow() < 1) {
    const all = ss.getSheets();
    let max = 0;
    all.forEach(sh => {
      if (sh.isSheetHidden()) return;
      if (sh.getName().indexOf('フォームの回答') === 0 && sh.getLastRow() > max) {
        max = sh.getLastRow();
        best = sh;
      }
    });
  }
  if (best) ensureApprovalCols_(best);
  return best;
}

function ensureApprovalCols_(sh) {
  if (sh.getLastColumn() === 0) return;
  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  // 承認列を「☑=有効」「□=取消」として運用
  ['承認', 'フィードバック', '通知済'].forEach(c => {
    if (header.indexOf(c) === -1) {
      const newCol = sh.getLastColumn() + 1;
      sh.getRange(1, newCol).setValue(c);
      sh.getRange(1, newCol).setFontWeight('bold').setBackground('#F1C40F');
      if (c === '承認' || c === '通知済') {
        const cb = SpreadsheetApp.newDataValidation().requireCheckbox().build();
        sh.getRange(2, newCol, Math.max(sh.getMaxRows() - 1, 1), 1).setDataValidation(cb);
        // 承認列は提出時にデフォルトTRUEを入れる（即時XP加算ロジック）
      }
    }
  });
}

function findCol_(header, name) {
  let idx = header.indexOf(name);
  if (idx >= 0) return idx;
  idx = header.findIndex(h => String(h).indexOf(name) >= 0);
  return idx;
}

function buildSiteState_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = findLogSheet_(ss);
  const empty = { stats: zeroStats_(), totalXp: 0, totalSubmissions: 0, totalMembers: 0, lv: 1, monster: 'egg', recent: [], all: [] };
  if (!sh) return empty;

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return empty;

  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const rows   = sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues();
  const col = (name) => findCol_(header, name);

  const iTimestamp = col('タイムスタンプ');
  const iNickname  = col('ニックネーム');
  const iCategory  = col('カテゴリ');
  const iMission   = col('挑戦した課題');
  const iSubject   = col('教科');
  const iDifficulty = col('難易度');
  const iResultType = col('成果の種類');
  const iContent   = col('提出内容');
  const iUrl       = col('参考URL');
  const iComment   = col('ひとこと');
  const iEmail     = col('メールアドレス');
  const iApproved  = col('承認');
  let iConsent = findCol_(header, '同意');
  if (iConsent < 0) iConsent = findCol_(header, '外部公開');

  const items = rows.map((r, idx) => {
    const rowIndex = idx + 2;
    const mField    = String(r[iMission] || '');
    const categoryRaw = iCategory >= 0 ? String(r[iCategory] || '') : '';
    const resultTypeRaw = iResultType >= 0 ? String(r[iResultType] || '') : '';
    const isResult = isResultSubmission_(categoryRaw, resultTypeRaw);
    const category = isResult ? 'result' : 'output';

    let missionId, subject, difficulty;
    if (isResult) {
      // 成果: 教科関係なく全教科に均等加算（subject='全教科'）
      missionId = 'r-all';
      subject = '全教科';
      difficulty = 0;
    } else {
      missionId = extractMissionId_(mField);
      subject   = subjectFromId_(missionId);
      difficulty = difficultyFromId_(missionId);
    }
    const xp = isResult ? XP_RESULT_FIXED : (XP_BY_STAR_OUTPUT[difficulty] || 0);

    return {
      id:           'r-' + rowIndex,
      date:         formatDate_(r[iTimestamp]),
      name:         r[iNickname] || '',
      email:        iEmail >= 0 ? r[iEmail] || '' : '',
      category:     category,
      subject:      subject,
      missionId:    missionId,
      missionTitle: extractMissionTitle_(mField) || mField,
      difficulty:   difficulty,
      xp:           xp,
      resultType:   iResultType >= 0 ? r[iResultType] || '' : '',
      content:      r[iContent] || '',
      url:          iUrl >= 0 ? r[iUrl] || '' : '',
      comment:      iComment >= 0 ? r[iComment] || '' : '',
      approved:     iApproved >= 0 ? isTruthy_(r[iApproved]) : true,  // 承認列なし=自動承認
      consented:    iConsent >= 0 ? String(r[iConsent] || '').indexOf('同意します') >= 0 : true,
    };
  });

  const approved = items.filter(x => x.approved);
  const stats = zeroStats_();
  const axisKeys = ['ai', 'eng', 'math', 'study', 'creative'];
  approved.forEach(x => {
    if (x.category === 'result') {
      // 成果は5軸均等加算（XP / 5 ずつ）
      const perAxis = x.xp / axisKeys.length;
      axisKeys.forEach(k => { stats[k] += perAxis; });
    } else {
      const k = AXIS_KEY[x.subject];
      if (k) stats[k] += x.xp;
    }
  });

  const totalXp = stats.ai + stats.eng + stats.math + stats.study + stats.creative;
  const lvInfo  = calcLv_(totalXp);
  const dom     = determineMonster_(stats, lvInfo.lv);

  // GitHub Pagesアーカイブは内部運用ツールなので全員表示
  // 同意フラグはSHIFT AIブログ/セミナーでの外部紹介の可否のみ管理（人手運用）
  return {
    stats: stats,
    totalXp: totalXp,
    totalSubmissions: approved.length,
    totalMembers: new Set(approved.map(x => x.email || x.name)).size,
    lv: lvInfo.lv,
    lvName: lvInfo.name,
    monster: dom.monsterKey,
    monsterName: dom.monsterName,
    dominantAxis: dom.axis,
    isBalance: dom.isBalance,
    recent: approved.slice().sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 5),
    all:    approved.slice().sort((a, b) => (b.date > a.date ? 1 : -1)),
  };
}

function zeroStats_() {
  return { ai: 0, eng: 0, math: 0, study: 0, creative: 0 };
}

function determineMonster_(stats, lv) {
  if (lv === 1) return { axis: null, monsterKey: 'egg',       monsterName: 'タマゴ', isBalance: false };
  if (lv === 2) return { axis: null, monsterKey: 'hatchling', monsterName: 'ヒナ',   isBalance: false };

  const keys = ['ai', 'eng', 'math', 'study', 'creative'];
  const values = keys.map(k => stats[k]);
  const max = Math.max.apply(null, values);
  const min = Math.min.apply(null, values);
  const isBalance = (max - min) <= BALANCE_THRESHOLD && max > 0;

  let axis;
  if (isBalance) {
    axis = 'balance';
  } else {
    const idx = values.indexOf(max);
    axis = keys[idx];
  }

  const stage = lv === 3 ? 'baby' : 'final';
  return {
    axis: axis,
    monsterKey: axis + '-' + stage,
    monsterName: MONSTER_BY_AXIS[axis][stage],
    isBalance: isBalance,
  };
}

function calcLv_(xp) {
  let cur = EVOLUTION[0];
  for (const e of EVOLUTION) if (xp >= e.xpStart) cur = e;
  return cur;
}

/* ================================================================
   フォーム送信時: 即時XP加算 + Discord通知（カテゴリ別）
   ================================================================ */
function onFormSubmit(e) {
  try {
    if (!e || !e.namedValues) return;
    const data = e.namedValues;
    const pickFirst = (name) => {
      // 部分一致でキーを探す
      const keys = Object.keys(data);
      const k = keys.find(k => k.indexOf(name) >= 0);
      return (k && data[k][0]) ? data[k][0] : '';
    };

    const nickname     = pickFirst('ニックネーム') || 'ゲスト';
    const categoryRaw  = pickFirst('カテゴリ');
    const titleField   = pickFirst('タイトル');
    const missionField = pickFirst('挑戦した課題') || titleField;
    const subjectStr   = pickFirst('教科');
    const resultType   = pickFirst('成果の種類');
    const content      = pickFirst('提出内容') || pickFirst('成果の内容') || pickFirst('経緯');
    const consentRaw   = pickFirst('同意') || pickFirst('外部公開');
    const consented    = !consentRaw || consentRaw.indexOf('同意します') >= 0;
    const isResult     = isResultSubmission_(categoryRaw, resultType);

    // 教科・難易度・XPを確定
    let subject, difficulty, missionId, missionTitle;
    if (isResult) {
      subject = '全教科';
      difficulty = 0;
      missionId = 'r-all';
      missionTitle = missionField;
    } else {
      missionId = extractMissionId_(missionField);
      subject = subjectFromId_(missionId);
      difficulty = difficultyFromId_(missionId);
      missionTitle = extractMissionTitle_(missionField) || missionField;
    }
    const xpGained = isResult ? XP_RESULT_FIXED : (XP_BY_STAR_OUTPUT[difficulty] || 0);

    // 「提出ログ」シートに統合書き込み（成果物・成果報告の両フォームで一元管理）
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const log = ss.getSheetByName(SHEET_LOG);
    if (log) {
      appendToLog_(log, {
        timestamp: new Date(),
        email: pickFirst('メール'),
        nickname: nickname,
        category: isResult ? '🏆 成果' : '📦 成果物',
        mission: missionTitle,
        subject: isResult ? '全教科' : subject,
        difficulty: isResult ? '' : ('★' + difficulty),
        resultType: resultType,
        content: content,
        url: pickFirst('参考URL'),
        comment: pickFirst('ひとこと'),
        consent: consentRaw,
        approved: true,
        notified: true,
      });
    }

    const stars = '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
    const excerpt = content.length > 120 ? content.substring(0, 120) + '…' : content;
    const state = buildSiteState_();

    // Discord通知は同意の有無に関わらず実行（内部チャットでの成果共有）
    const payload = isResult
      ? buildResultPayload_(nickname, missionTitle, subject, stars, xpGained, resultType, excerpt, state)
      : buildOutputPayload_(nickname, missionTitle, subject, stars, xpGained, excerpt, state);
    sendDiscord_(payload);
  } catch (err) {
    Logger.log('onFormSubmit error: ' + err);
  }
}

function buildOutputPayload_(nickname, title, subject, stars, xp, excerpt, state) {
  return {
    username: '🥚 モンスターの書',
    embeds: [{
      title: '📦 成果物の報告 +' + xp + ' XP',
      description:
        '**' + nickname + '** さんが成果物を提出！🎨\n\n' +
        '📝 ' + title + '\n' +
        '📚 ' + subject + '　' + stars,
      color: 0x3498DB,
      fields: [
        { name: '📝 内容（抜粋）', value: excerpt || '(内容なし)', inline: false },
        { name: '現在のモンスター', value: 'Lv.' + state.lv + ' ' + (state.monsterName || 'タマゴ'), inline: true },
        { name: '累積XP',           value: String(state.totalXp) + ' XP',                           inline: true },
      ],
      footer: { text: 'SHIFT AIジュニア モンスター育成プロジェクト' },
      timestamp: new Date().toISOString(),
    }],
  };
}

function buildResultPayload_(nickname, title, subject, stars, xp, resultType, excerpt, state) {
  return {
    username: '🥚 モンスターの書',
    embeds: [{
      title: '🏆 成果報告！ +' + xp + ' XP（成果ボーナス）',
      description:
        '🎉 **' + nickname + '** さんが成果を達成しました！\n\n' +
        '🏆 **' + title + '**\n' +
        (resultType ? '🏅 ' + resultType + '\n' : '') +
        '📚 5教科ぜんぶに均等加算',
      color: 0xF1C40F,
      fields: [
        { name: '📝 成果の内容（抜粋）', value: excerpt || '(内容なし)', inline: false },
        { name: '現在のモンスター', value: 'Lv.' + state.lv + ' ' + (state.monsterName || 'タマゴ'), inline: true },
        { name: '累積XP',           value: String(state.totalXp) + ' XP',                           inline: true },
      ],
      footer: { text: '🌟 おめでとう！ SHIFT AIジュニア モンスター育成プロジェクト' },
      timestamp: new Date().toISOString(),
    }],
  };
}

/* ================================================================
   承認☑を外したらXP取消（不適切提出のmariko対応用）
   ================================================================ */
function onApprovalEdit(e) {
  try {
    const sh = e.source.getActiveSheet();
    const name = sh.getName();
    if (name !== SHEET_LOG && name.indexOf('フォームの回答') !== 0) return;
    ensureApprovalCols_(sh);

    const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    const iApproved = header.indexOf('承認') + 1;
    if (iApproved < 1) return;

    const row = e.range.getRow();
    if (row < 2) return;
    if (e.range.getColumn() !== iApproved) return;

    const val = isTruthy_(e.value);
    if (val) return; // ☑にした場合は何もしない（提出時に既に通知済み）

    // ☑を外した = 不適切提出として取消
    const vals = sh.getRange(row, 1, 1, header.length).getValues()[0];
    const pick = (name) => vals[findCol_(header, name)];
    const nickname = pick('ニックネーム') || 'ゲスト';
    const missionField = pick('挑戦した課題') || '';
    const categoryRaw = String(pick('カテゴリ') || '');
    const resultTypeRaw = String(pick('成果の種類') || '');
    const isResult = isResultSubmission_(categoryRaw, resultTypeRaw);

    let subject, difficulty;
    if (isResult) {
      subject = String(pick('教科') || 'AI基礎');
      const diffStr = String(pick('難易度') || '★1');
      difficulty = parseInt((diffStr.match(/[1-5]/) || ['1'])[0], 10);
    } else {
      const missionId = extractMissionId_(missionField);
      subject = subjectFromId_(missionId);
      difficulty = difficultyFromId_(missionId);
    }
    const xp = isResult ? XP_RESULT_FIXED : (XP_BY_STAR_OUTPUT[difficulty] || 0);

    const payload = {
      username: '🥚 モンスターの書',
      embeds: [{
        title: '⚠️ 提出が取り消されました（-' + xp + ' XP）',
        description:
          '**' + nickname + '** さんの提出が講師判断で取消されました。\n' +
          '不適切な内容や重複提出が原因の可能性があります。',
        color: 0xE74C3C,
        footer: { text: 'SHIFT AIジュニア' },
        timestamp: new Date().toISOString(),
      }],
    };
    sendDiscord_(payload);
  } catch (err) {
    Logger.log('onApprovalEdit error: ' + err);
  }
}

/* ================================================================
   Discord 送信ヘルパー
   ================================================================ */
function sendDiscord_(payload) {
  const url = PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL');
  if (!url) {
    Logger.log('⚠️ DISCORD_WEBHOOK_URL 未設定');
    return;
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
        headers: { 'User-Agent': 'MonsterBookBot/1.0 (+SHIFT AI Junior)' },
      });
      const code = res.getResponseCode();
      if (code >= 200 && code < 300) return;
      if (code === 429 || code === 1015) { Utilities.sleep(2000 * attempt); continue; }
      return;
    } catch (err) {
      Utilities.sleep(1500 * attempt);
    }
  }
}

/* ================================================================
   ヘルパー
   ================================================================ */
function extractMissionId_(text) {
  const m = String(text || '').match(/\[((?:m|r)-[a-z]\d+)\]/);
  return m ? m[1] : '';
}
function extractMissionTitle_(text) {
  return String(text || '').replace(/\s*\[(?:m|r)-[a-z]\d+\]\s*$/, '').trim();
}
function subjectFromId_(id) {
  const c = (id || '').slice(2, 3);
  return SUBJECT_MAP[c] || 'その他';
}
function difficultyFromId_(id) {
  const last = String(id || '').slice(-1);
  const n = parseInt(last, 10);
  return (n >= 1 && n <= 5) ? n : 1;
}
function isResultSubmission_(categoryRaw, resultType) {
  const cat = String(categoryRaw || '');
  if (cat.indexOf('成果') >= 0 && cat.indexOf('成果物') < 0) return true;
  if (resultType && String(resultType).trim().length > 0) return true;
  return false;
}

function isTruthy_(v) {
  if (v === true) return true;
  const s = String(v).toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes' || s === '✓' || s === '☑' || s === '✅';
}
function formatDate_(v) {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return String(v);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
}

/* ================================================================
   トリガー登録（初回のみ手動実行）
   ================================================================ */
function installAllTriggers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.getProjectTriggers().forEach(t => {
    const fn = t.getHandlerFunction();
    if (fn === 'onApprovalEdit' || fn === 'onFormSubmit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onApprovalEdit').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(ss).onFormSubmit().create();
  SpreadsheetApp.getUi().alert(
    '✅ トリガー登録完了\n\n' +
    '・フォーム送信 → 即時XP加算 + Discord通知\n' +
    '・承認☑を外す → 取消通知（XP減算）'
  );
}

/* ================================================================
   スプシ初期セットアップ（手動実行・既存スプシにも対応）
   - 新規スプシ: 全ヘッダーを設定
   - 既存スプシ: 不足カラムだけ右側に追加（提出データを保持）
   ================================================================ */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_LOG);
  if (!sh) sh = ss.insertSheet(SHEET_LOG);

  // Phase 2 必須ヘッダー
  const requiredHeaders = [
    'カテゴリ', '教科', '難易度', '成果の種類',
    '承認', 'フィードバック', '通知済',
  ];

  // 新規スプシなら全ヘッダーを書き込む
  if (sh.getLastRow() === 0) {
    const fullHeaders = [
      'タイムスタンプ', 'メールアドレス', 'ニックネーム',
      'カテゴリ', '挑戦した課題', '教科', '難易度', '成果の種類',
      '提出内容', '提出ファイル', '参考URL（任意）', 'ひとこと・質問（任意）',
      '承認', 'フィードバック', '通知済',
    ];
    sh.getRange(1, 1, 1, fullHeaders.length).setValues([fullHeaders]);
    sh.getRange(1, 1, 1, fullHeaders.length).setFontWeight('bold').setBackground('#F1C40F');
  } else {
    // 既存スプシ: 不足ヘッダーを右側に追加
    const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    const added = [];
    requiredHeaders.forEach(h => {
      if (header.indexOf(h) === -1) {
        const newCol = sh.getLastColumn() + 1;
        sh.getRange(1, newCol).setValue(h);
        sh.getRange(1, newCol).setFontWeight('bold').setBackground('#F1C40F');
        added.push(h);
      }
    });
    Logger.log('追加カラム: ' + added.join(', '));
  }

  // チェックボックス設定（承認・通知済）
  const lastRow = Math.max(1000, sh.getMaxRows());
  const headerNow = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const iApproved = headerNow.indexOf('承認') + 1;
  const iNotified = headerNow.indexOf('通知済') + 1;
  const cb = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  if (iApproved > 0) sh.getRange(2, iApproved, lastRow - 1, 1).setDataValidation(cb);
  if (iNotified > 0) {
    sh.getRange(2, iNotified, lastRow - 1, 1).setDataValidation(cb);
    sh.hideColumns(iNotified);
  }

  SpreadsheetApp.getUi().alert(
    '✅ スプシ初期化完了（Phase 2 対応）\n\n' +
    '・新規提出は「承認」が自動TRUE → 即XP加算\n' +
    '・不適切提出は☑を外すと取消通知が飛びます\n' +
    '・カテゴリ列で 📦 成果物 / 🏆 成果 を判別'
  );
}

/* ================================================================
   Googleフォーム自動作成（初回のみ手動実行）
   ================================================================ */
function createSubmitForm() {
  const r = ensureSubmitForm_();
  Logger.log('FORM_URL: ' + r.formUrl);
  Logger.log('EDIT_URL: ' + r.editUrl);
  try {
    SpreadsheetApp.getUi().alert(
      (r.reused ? '✅ フォームは既に作成済みです\n\n' : '✅ フォーム作成完了\n\n') +
      '📋 提出用URL（生徒に共有）:\n' + r.formUrl + '\n\n' +
      '✏️ 編集URL:\n' + r.editUrl
    );
  } catch (e) {}
  return r;
}
