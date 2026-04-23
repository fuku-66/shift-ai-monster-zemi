/**
 * 🐲 SHIFT AI ジュニア ドラゴン育成サイト
 * ============================================================
 * WebApp 本体（サイト向けJSON API + 承認トリガー + いいね）
 * ============================================================
 *
 * 対応エンドポイント:
 *   GET  ... doGet(e)  → サイト表示用のステータス取得
 *   POST ... doPost(e) → いいね送信
 *
 * トリガー:
 *   onApprovalEdit(e) → スプシの「承認」列にTRUEで発火
 *     - +20XP
 *     - Discord通知
 *
 * 初回のみ: installApprovalTrigger() を手動実行してトリガーを登録する
 */

// 難易度別XPテーブル（★1=15 / ★2=25 / ★3=40 / ★4=60 / ★5=80）
const XP_BY_STAR = { 1: 15, 2: 25, 3: 40, 4: 60, 5: 80 };
const SHEET_LOG = '提出ログ';
const SHEET_SETUP = '設定';

/**
 * 課題IDから難易度（星）を抽出
 * ID規則: m-X0D （X=教科、D=難易度1-5）
 * 例: m-e01 → 1 / m-j05 → 5
 */
function difficultyFromId_(id) {
  const last = String(id || '').slice(-1);
  const n = parseInt(last, 10);
  return (n >= 1 && n <= 5) ? n : 1;
}
function xpForMission_(id) {
  return XP_BY_STAR[difficultyFromId_(id)] || 15;
}

/* ================================================================
   GET: サイト表示用のステータス JSON を返す
   ================================================================ */
function doGet(e) {
  try {
    const data = buildSiteState_();
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ================================================================
   POST: いいねの加算・削除
   受信: { action: "like", id: "r-5", delta: 1 | -1 }
   ================================================================ */
function doPost(e) {
  try {
    const body = e && e.postData ? JSON.parse(e.postData.contents || '{}') : {};
    if (body.action === 'like') {
      toggleLike_(body.id, Number(body.delta) || 1);
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ================================================================
   サイト表示用データをスプシから組み立てる
   ================================================================ */
function buildSiteState_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_LOG);
  if (!sh) return { totalXp: 0, totalSubmissions: 0, totalMembers: 0, recent: [], all: [] };

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return { totalXp: 0, totalSubmissions: 0, totalMembers: 0, recent: [], all: [] };

  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const rows   = sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues();

  const col = (name) => header.indexOf(name);
  const iTimestamp = col('タイムスタンプ');
  const iNickname  = col('ニックネーム');
  const iMission   = col('挑戦した課題');
  const iContent   = col('提出内容');
  const iUrl       = col('参考URL（任意）');
  const iComment   = col('ひとこと・質問（任意）');
  const iEmail     = col('メールアドレス');
  const iApproved  = col('承認');
  const iXpDone    = col('通知済') >= 0 ? col('通知済') : col('XP加算済');
  const iLikes     = col('いいね数');

  const items = rows.map((r, idx) => {
    const rowIndex = idx + 2;
    const mTitleWithId = String(r[iMission] || '');
    const missionId    = extractMissionId_(mTitleWithId);
    const missionTitle = extractMissionTitle_(mTitleWithId);
    const subject      = subjectFromId_(missionId);
    const difficulty = difficultyFromId_(missionId);
    return {
      id:           'r-' + rowIndex,
      date:         formatDate_(r[iTimestamp]),
      name:         r[iNickname] || '',
      email:        r[iEmail] || '',
      subject:      subject,
      missionId:    missionId,
      missionTitle: missionTitle || mTitleWithId,
      difficulty:   difficulty,
      xp:           XP_BY_STAR[difficulty] || 15,
      content:      r[iContent] || '',
      url:          r[iUrl] || '',
      comment:      r[iComment] || '',
      likes:        Number(r[iLikes]) || 0,
      approved:     isTruthy_(r[iApproved]),
      xpAdded:      isTruthy_(r[iXpDone]),
    };
  });

  const approved = items.filter(x => x.approved);
  const totalXp = approved.reduce((sum, x) => sum + (x.xp || 15), 0);
  const members = new Set(approved.map(x => x.email || x.name)).size;
  const recent  = approved.slice().sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 5);

  return {
    totalXp: totalXp,
    totalSubmissions: approved.length,
    totalMembers: members,
    recent: recent,
    all: approved.slice().sort((a, b) => (b.date > a.date ? 1 : -1)),
  };
}

/* ================================================================
   承認トリガー: 「承認」列に TRUE が入ったら発火
   ================================================================ */
function onApprovalEdit(e) {
  try {
    const sh = e.source.getActiveSheet();
    if (sh.getName() !== SHEET_LOG) return;

    const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    const iApproved = header.indexOf('承認') + 1;
    // "通知済" を優先、旧"XP加算済"にも後方互換
    let iNotified = header.indexOf('通知済') + 1;
    if (iNotified < 1) iNotified = header.indexOf('XP加算済') + 1;
    if (iApproved < 1 || iNotified < 1) return;

    const editedCol = e.range.getColumn();
    const row = e.range.getRow();
    if (row < 2) return;
    if (editedCol !== iApproved) return; // 承認列以外は無視（差し戻し通知なし）

    // 承認☑にしたときだけ通知（重複防止）
    const val = isTruthy_(e.value);
    if (!val) return;
    const alreadyNotified = isTruthy_(sh.getRange(row, iNotified).getValue());
    if (alreadyNotified) return;

    sh.getRange(row, iNotified).setValue(true);
    notifyApproval_(sh, row, header);
  } catch (err) {
    Logger.log('onApprovalEdit error: ' + err);
  }
}

function notifyApproval_(sh, row, header) {
  const vals = sh.getRange(row, 1, 1, header.length).getValues()[0];
  const pick = (name) => vals[header.indexOf(name)];
  const nickname = pick('ニックネーム') || 'ゲスト';
  const mission  = pick('挑戦した課題') || '';
  const missionId = extractMissionId_(mission);
  const subject  = subjectFromId_(missionId);
  const difficulty = difficultyFromId_(missionId);
  const xpGained = XP_BY_STAR[difficulty] || 15;
  const stars = '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  const state    = buildSiteState_();
  const lvInfo   = calcLv_(state.totalXp);

  const payload = {
    username: '🐲 ドラゴンの書',
    embeds: [{
      title: '✅ 提出を承認しました！ +' + xpGained + ' XP',
      description:
        '**' + nickname + '** さんの提出が承認されました🔥\n\n' +
        '📝 ' + mission + '\n' +
        '📚 ' + subject + '　' + stars,
      color: 0xF1C40F,
      fields: [
        { name: '現在のドラゴン', value: 'Lv.' + lvInfo.lv + ' ' + lvInfo.name, inline: true },
        { name: '累積XP',         value: String(state.totalXp) + ' XP',         inline: true },
        { name: '総提出数',        value: String(state.totalSubmissions) + '件', inline: true },
      ],
      footer: { text: 'SHIFT AIジュニア ドラゴン育成プロジェクト' },
      timestamp: new Date().toISOString(),
    }],
  };
  sendDiscord_(payload);
}

// 差し戻し通知は中高生向けのUX配慮で削除（誤チェック外しで通知されないため）
// フィードバック欄はmariko個人の覚え書き用として残す

/* ================================================================
   フォーム送信時のDiscord通知
   ================================================================ */
function onFormSubmit(e) {
  try {
    if (!e || !e.namedValues) return;
    const data = e.namedValues;
    const pickFirst = (name) => {
      const v = data[name];
      return v && v[0] ? v[0] : '';
    };
    const nickname     = pickFirst('ニックネーム') || 'ゲスト';
    const missionField = pickFirst('挑戦した課題') || '';
    const missionId    = extractMissionId_(missionField);
    const missionTitle = extractMissionTitle_(missionField) || missionField;
    const subject      = subjectFromId_(missionId);
    const difficulty   = difficultyFromId_(missionId);
    const stars        = '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
    const content      = pickFirst('提出内容') || '';
    const excerpt      = content.length > 120 ? content.substring(0, 120) + '…' : content;
    const xpPotential  = XP_BY_STAR[difficulty] || 15;

    const payload = {
      username: '🐲 ドラゴンの書',
      embeds: [{
        title: '📥 新しい提出が届きました！',
        description:
          '**' + nickname + '** さんが提出してくれたよ📝\n\n' +
          '📚 ' + missionTitle + '\n' +
          subject + '　' + stars + '　承認で **+' + xpPotential + ' XP**',
        color: 0x3498DB,
        fields: [
          { name: '📝 内容（抜粋）', value: excerpt || '(内容なし)', inline: false }
        ],
        footer: { text: '講師がチェック中...承認されたらドラゴンが育つよ🔥' },
        timestamp: new Date().toISOString(),
      }],
    };
    sendDiscord_(payload);
    Logger.log('提出通知送信: ' + nickname + ' - ' + missionTitle);
  } catch (err) {
    Logger.log('onFormSubmit error: ' + err);
  }
}

/* ================================================================
   いいねトグル（doPostから呼ばれる）
   ================================================================ */
function toggleLike_(id, delta) {
  if (!id || !id.startsWith('r-')) return;
  const rowIdx = parseInt(id.slice(2), 10);
  if (!rowIdx || rowIdx < 2) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_LOG);
  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  let iLikes = header.indexOf('いいね数');
  if (iLikes < 0) {
    iLikes = sh.getLastColumn();
    sh.getRange(1, iLikes + 1).setValue('いいね数').setFontWeight('bold').setBackground('#FF6B9D').setFontColor('#FFFFFF');
  }
  const cell = sh.getRange(rowIdx, iLikes + 1);
  const current = Number(cell.getValue()) || 0;
  const next = Math.max(0, current + (delta > 0 ? 1 : -1));
  cell.setValue(next);
}

/* ================================================================
   Discord 送信ヘルパー（User-Agent必須）
   ================================================================ */
function sendDiscord_(payload) {
  const url = PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL');
  if (!url) {
    Logger.log('⚠️ DISCORD_WEBHOOK_URL 未設定');
    return;
  }
  // 連続送信防止: 最大3回リトライ、毎回指数バックオフ
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
        headers: { 'User-Agent': 'DragonBookBot/1.0 (+SHIFT AI Junior; Google Apps Script)' },
      });
      const code = res.getResponseCode();
      if (code >= 200 && code < 300) {
        Logger.log('Discord送信成功 (attempt ' + attempt + ')');
        return;
      }
      Logger.log('Discord送信失敗 attempt=' + attempt + ' code=' + code + ' body=' + res.getContentText().substring(0, 200));
      // 429/1015の場合は待機してリトライ
      if (code === 429 || code === 1015) {
        Utilities.sleep(2000 * attempt);
        continue;
      }
      // その他エラーは諦める
      return;
    } catch (err) {
      Logger.log('Discord送信例外 attempt=' + attempt + ': ' + err);
      Utilities.sleep(1500 * attempt);
    }
  }
  Logger.log('Discord送信 最終的に失敗');
}

/* ================================================================
   ID/教科/Lv ヘルパー
   ================================================================ */
function extractMissionId_(text) {
  const m = String(text || '').match(/\[(m-[a-z]\d+)\]/);
  return m ? m[1] : '';
}
function extractMissionTitle_(text) {
  return String(text || '').replace(/\s*\[m-[a-z]\d+\]\s*$/, '').trim();
}
function subjectFromId_(id) {
  const p = (id || '').slice(0, 3);
  return { 'm-e': '英語', 'm-m': '数学', 'm-j': '国語', 'm-o': 'その他' }[p] || 'その他';
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
  return `${y}-${m}-${dd}`;
}
const EVOLUTION_SERVER = [
  { lv: 1, name: 'タマゴ',        xpStart: 0    },
  { lv: 2, name: 'ベビードラゴン', xpStart: 100  },
  { lv: 3, name: '若竜',          xpStart: 400  },
  { lv: 4, name: '成竜',          xpStart: 1100 },
  { lv: 5, name: '神竜',          xpStart: 2400 },
];
function calcLv_(xp) {
  let cur = EVOLUTION_SERVER[0];
  for (const e of EVOLUTION_SERVER) if (xp >= e.xpStart) cur = e;
  return cur;
}

/* ================================================================
   承認トリガーを登録する（初回のみ手動実行）
   ================================================================ */
function installApprovalTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'onApprovalEdit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onApprovalEdit').forSpreadsheet(ss).onEdit().create();
  safeAlert('✅ 承認トリガーを登録しました。\n今後「承認」列にTRUEを入れるとDiscord通知&XP加算が自動で動きます。');
}

/**
 * フォーム送信時のDiscordトリガーを登録する（初回のみ手動実行）
 */
function installFormSubmitTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(ss).onFormSubmit().create();
  safeAlert('✅ 提出トリガーを登録しました。\nフォームから送信されるたびにDiscord通知が飛びます。');
}

/**
 * 全トリガーを一括で登録する（便利関数）
 */
function installAllTriggers() {
  installApprovalTrigger();
  installFormSubmitTrigger();
}

/* ================================================================
   スプシのクリーンアップ: 教科列を削除 + 承認/XP加算済にチェックボックス化
   ================================================================ */
function cleanupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_LOG);
  if (!sh) { safeAlert('⚠️ 提出ログがないよ'); return; }

  // 1) 教科列を削除（既に消えていれば無視）
  let header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const iSubject = header.indexOf('教科');
  if (iSubject >= 0) {
    sh.deleteColumn(iSubject + 1);
    Logger.log('教科列を削除しました');
  }

  // 2) XP加算済 → 通知済 にリネーム
  header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const iOld = header.indexOf('XP加算済');
  if (iOld >= 0) {
    sh.getRange(1, iOld + 1).setValue('通知済');
    Logger.log('XP加算済 → 通知済 にリネームしました');
  }

  // 3) 承認列にチェックボックス + 通知済列も同じく
  header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const iApproved = header.indexOf('承認');
  const iNotified = header.indexOf('通知済');
  const lastRow   = sh.getMaxRows();

  if (iApproved >= 0) {
    const range = sh.getRange(2, iApproved + 1, lastRow - 1, 1);
    const rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    range.setDataValidation(rule);
  }
  if (iNotified >= 0) {
    const range = sh.getRange(2, iNotified + 1, lastRow - 1, 1);
    const rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    range.setDataValidation(rule);
    // 通知済列は内部管理用なので非表示化する
    sh.hideColumns(iNotified + 1);
    Logger.log('通知済列を非表示にしました');
  }

  safeAlert(
    '✅ スプシをクリーンアップしました\n' +
    '・教科列を削除\n' +
    '・承認列にチェックボックスを設置\n' +
    '・XP加算済 → 通知済にリネーム + 非表示化（内部用なので気にしなくてOK）\n\n' +
    '承認するときは「承認」列の□をクリック → ☑ にするだけ！'
  );
}

/* ================================================================
   モック: 提出ログに疎通確認用のダミー行を入れる（任意）
   ================================================================ */
function insertDummyApprovedRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_LOG);
  if (!sh) { safeAlert('⚠️ 提出ログがないよ'); return; }
  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const now = new Date();
  const row = header.map(h => {
    switch (h) {
      case 'タイムスタンプ':          return now;
      case 'ニックネーム':            return 'デモ太郎';
      case '挑戦した課題':            return 'AIに英単語カードを作ってもらう [m-e01]';
      case '提出内容':                return 'ChatGPTで宇宙用語10個の単語カードを作った';
      case '参考URL（任意）':          return '';
      case 'ひとこと・質問（任意）':   return 'AIでテスト投稿';
      case 'メールアドレス':          return 'demo@example.com';
      case '承認':                   return true;
      case 'フィードバック':          return '';
      case 'XP加算済':                return '';
      case 'いいね数':                return 0;
      default:                       return '';
    }
  });
  sh.appendRow(row);
  safeAlert('ダミー行を追加しました。承認列はTRUE・XP加算済は空なので次の承認編集でDiscord通知が走ります。');
}
