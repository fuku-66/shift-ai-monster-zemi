/**
 * モンスター決定ロジック（件数ベース）
 * 入力: 教科別カウント or 合計カウント
 * 出力: { lv, total, monsterName, imagePath, placeholder, dominantAxis, isBalance }
 */
(function (global) {
  const cfg = global.MZ_CONFIG;

  function calcLv(count) {
    const thresholds = cfg.LEVEL_THRESHOLDS || [0, 10, 20, 30, 40];
    let lv = 1;
    for (let i = 0; i < thresholds.length; i++) {
      if (count >= thresholds[i]) lv = i + 1;
    }
    return cfg.EVOLUTION.find(e => e.lv === lv) || cfg.EVOLUTION[0];
  }

  const LV_EMOJI = { 1: '🥚', 2: '🐣', 3: '❓', 4: '❓', 5: '❓' };

  function determineMonster(stats, totalCount) {
    let count;
    if (typeof totalCount === 'number') {
      count = totalCount;
    } else {
      count = cfg.SUBJECTS.reduce((sum, s) => sum + (stats[s.key] || 0), 0);
    }
    const lvInfo = calcLv(count);

    const imgKey = (cfg.LV_IMAGE_KEYS || {})[lvInfo.lv];
    const fileName = imgKey && (cfg.MONSTER_IMAGES || {})[imgKey];
    const imagePath = fileName ? (cfg.IMAGE_BASE || '') + fileName : '';

    return {
      lv: lvInfo.lv,
      total: count,
      monsterName: lvInfo.name,
      imagePath,
      placeholder: LV_EMOJI[lvInfo.lv] || '🥚',
      dominantAxis: null,
      isBalance: false,
    };
  }

  global.MZ_MONSTER = { determineMonster, calcLv };
})(window);
