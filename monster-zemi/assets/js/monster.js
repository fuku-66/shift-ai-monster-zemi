/**
 * モンスター決定ロジック
 * 入力: 5軸XP値
 * 出力: { lv, monsterName, imagePath, dominantAxis, isBalance }
 */
(function (global) {
  const cfg = global.MZ_CONFIG;

  function calcLv(totalXp) {
    let cur = cfg.EVOLUTION[0];
    for (const e of cfg.EVOLUTION) if (totalXp >= e.xpStart) cur = e;
    return cur;
  }

  function determineMonster(stats) {
    const total = cfg.SUBJECTS.reduce((sum, s) => sum + (stats[s.key] || 0), 0);
    const lvInfo = calcLv(total);
    const lv = lvInfo.lv;

    // Lv1, Lv2 は共通
    if (lv === 1) {
      return {
        lv, total,
        monsterName: 'タマゴ',
        imagePath: 'assets/images/monsters/' + cfg.MONSTER_IMAGES.egg,
        dominantAxis: null,
        isBalance: false,
      };
    }
    if (lv === 2) {
      return {
        lv, total,
        monsterName: 'ヒナ',
        imagePath: 'assets/images/monsters/' + cfg.MONSTER_IMAGES.hatchling,
        dominantAxis: null,
        isBalance: false,
      };
    }

    // Lv3 / Lv4: 軸を決定
    const values = cfg.SUBJECTS.map(s => stats[s.key] || 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const isBalance = (max - min) <= cfg.BALANCE_THRESHOLD && max > 0;

    let axis;
    if (isBalance) {
      axis = 'balance';
    } else {
      const idx = values.indexOf(max);
      axis = cfg.SUBJECTS[idx].key;
    }

    const stage = lv === 3 ? 'baby' : 'final';
    const monsterName = cfg.MONSTER_BY_AXIS[axis][stage];
    const imageKey = `${axis}-${stage}`;
    const imagePath = 'assets/images/monsters/' + cfg.MONSTER_IMAGES[imageKey];

    return {
      lv, total,
      monsterName,
      imagePath,
      dominantAxis: axis,
      isBalance,
    };
  }

  global.MZ_MONSTER = { determineMonster, calcLv };
})(window);
