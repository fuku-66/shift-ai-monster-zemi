/**
 * モンスター育成プロジェクト 設定
 * デプロイ前にGAS_URLを書き換える
 */
window.MZ_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbymsygunqf9qsKePt1ALguS9DFcmfa3llaOqAXtURDhlYNZplSwk0kLpq2pI30eyEKz/exec',
  // 📦 成果物用フォーム（25課題の提出）
  FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSfrrg3ZbvEhDcLwyamI3y6yHLwLgm0Ld47VX-QN2VF5N0G4sg/viewform',
  // 🏆 成果報告用フォーム（受賞・点数アップ等）
  FORM_URL_RESULT: 'https://docs.google.com/forms/d/e/1FAIpQLSdCtIzUTYHn5_WSyRvpQUX50yHUcdlOtQAvy6Yum16oA6Tg_A/viewform',

  EVOLUTION: [
    { lv: 1, name: 'タマゴ', xpStart: 0,    monsterKey: 'egg' },
    { lv: 2, name: 'ヒナ',   xpStart: 200,  monsterKey: 'hatchling' },
    { lv: 3, name: '子モンスター', xpStart: 600,  monsterKey: 'baby' },
    { lv: 4, name: '最終形態',     xpStart: 1500, monsterKey: 'final' },
  ],

  SUBJECTS: [
    { key: 'ai',       label: 'AI基礎',       color: '#4FC3F7' },
    { key: 'eng',      label: '英語',         color: '#FF8A65' },
    { key: 'math',     label: '数学',         color: '#81C784' },
    { key: 'study',    label: '勉強法',       color: '#BA68C8' },
    { key: 'creative', label: 'クリエイティブ', color: '#F06292' },
  ],

  // カテゴリ別XP定義
  XP_BY_STAR_OUTPUT: { 1: 15, 2: 25, 3: 40, 4: 60, 5: 80 },
  XP_RESULT_FIXED: 120, // 成果報告は難易度なしで一律

  // 成果の種類
  RESULT_TYPES: [
    'コンテスト入賞', '受賞', '外部評価', '採用実績',
    '成績アップ', '点数アップ', 'その他',
  ],

  // 子・最終形態のモンスター名（最強軸ごと）
  MONSTER_BY_AXIS: {
    ai:       { baby: '子サイバービースト', final: 'サイバービースト' },
    eng:      { baby: '子フェニックス',     final: 'フェニックス' },
    math:     { baby: '子クリスタルゴーレム', final: 'クリスタルゴーレム' },
    study:    { baby: '子シャドウウルフ',   final: 'シャドウウルフ' },
    creative: { baby: '子レインボードラゴン', final: 'レインボードラゴン' },
    balance:  { baby: '子ユニコーン',       final: 'ユニコーン神獣' },
  },

  // 画像ファイル名（assets/images/monsters/ 配下）
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

  // バランス判定: 5軸の最大-最小がこの値以下ならユニコーン
  BALANCE_THRESHOLD: 10,
};
