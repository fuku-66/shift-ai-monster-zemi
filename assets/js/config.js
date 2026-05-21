/**
 * モンスター育成プロジェクト 設定
 * デプロイ前にGAS_URLを書き換える
 */
window.MZ_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbx8Lguu3CT9FfoLpX_0b5SgNGzQTw98G0xlRUVYzmNnZ9MwPwwx_aEmofPDTHfelvg2/exec',
  // 📦 成果物用フォーム
  FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSfrrg3ZbvEhDcLwyamI3y6yHLwLgm0Ld47VX-QN2VF5N0G4sg/viewform',
  // 🏆 成果報告用フォーム（受賞・点数アップ等）
  FORM_URL_RESULT: 'https://docs.google.com/forms/d/e/1FAIpQLSdCtIzUTYHn5_WSyRvpQUX50yHUcdlOtQAvy6Yum16oA6Tg_A/viewform',

  // ────────────────────────────────────────────
  // レベル設定（件数ベース・あとで変更可能）
  // ────────────────────────────────────────────
  // しきい値: Lv1=0件 / Lv2=10件 / Lv3=20件 / Lv4=30件 / Lv5=40件
  LEVEL_THRESHOLDS: [0, 10, 20, 30, 40],
  // 成果報告1件 = 成果物何件分としてカウントするか
  RESULT_COUNT_MULTIPLIER: 3,

  EVOLUTION: [
    { lv: 1, name: 'タマゴ',         monsterKey: 'egg' },
    { lv: 2, name: 'ヒナ',           monsterKey: 'hatchling' },
    { lv: 3, name: '子モンスター',   monsterKey: 'baby' },
    { lv: 4, name: '成長モンスター', monsterKey: 'grown' },
    { lv: 5, name: '最終形態',       monsterKey: 'final' },
  ],

  SUBJECTS: [
    { key: 'ai',       label: 'AI基礎',       color: '#4FC3F7' },
    { key: 'eng',      label: '英語',         color: '#FF8A65' },
    { key: 'math',     label: '数学',         color: '#81C784' },
    { key: 'study',    label: '勉強法',       color: '#BA68C8' },
    { key: 'creative', label: 'クリエイティブ', color: '#F06292' },
  ],

  // 成果の種類
  RESULT_TYPES: [
    'コンテスト入賞', '受賞', '外部評価', '採用実績',
    '成績アップ', '点数アップ', 'その他',
  ],

  // 画像プレースホルダーテキスト（差し替えるまで表示）
  PLACEHOLDER_TEXT: '画像準備中',

  // ────────────────────────────────────────────
  // 以下は画像差し替え後に再利用予定（現在は未使用）
  // ────────────────────────────────────────────
  MONSTER_BY_AXIS: {
    ai:       { baby: '子サイバービースト', final: 'サイバービースト' },
    eng:      { baby: '子フェニックス',     final: 'フェニックス' },
    math:     { baby: '子クリスタルゴーレム', final: 'クリスタルゴーレム' },
    study:    { baby: '子シャドウウルフ',   final: 'シャドウウルフ' },
    creative: { baby: '子レインボードラゴン', final: 'レインボードラゴン' },
    balance:  { baby: '子ユニコーン',       final: 'ユニコーン神獣' },
  },
  MONSTER_IMAGES: {
    egg:                 'monster-0-egg.png',
    hatchling:           'monster-1-hatchling.png',
    'ai-baby':           'monster-2-cyber-baby.png',
    'eng-baby':          'monster-3-phoenix-baby.png',
    'math-baby':         'monster-4-golem-baby.png',
    'study-baby':        'monster-5-wolf-baby.png',
    'creative-baby':     'monster-6-rainbow-baby.png',
    'balance-baby':      'monster-7-unicorn-baby.png',
    'ai-final':          'monster-8-cyber.png',
    'eng-final':         'monster-9-phoenix.png',
    'math-final':        'monster-10-golem.png',
    'study-final':       'monster-11-wolf.png',
    'creative-final':    'monster-12-rainbow.png',
    'balance-final':     'monster-13-unicorn.png',
  },
  BALANCE_THRESHOLD: 10,
};
