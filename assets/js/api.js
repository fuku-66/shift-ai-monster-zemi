/**
 * GAS WebApp API クライアント
 */
(function (global) {
  const cfg = global.MZ_CONFIG;

  async function fetchState() {
    if (!cfg.GAS_URL || cfg.GAS_URL.includes('PUT_YOUR_GAS')) {
      console.warn('GAS_URL未設定。モックデータを返します');
      return mockState();
    }
    try {
      const res = await fetch(cfg.GAS_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      console.error('GAS取得失敗:', err);
      return mockState();
    }
  }

  // 開発用モック
  function mockState() {
    return {
      stats: { ai: 3, eng: 4, math: 2, study: 1, creative: 5 },
      totalCount: 18,
      totalSubmissions: 16,
      totalMembers: 8,
      lv: 2, lvName: 'ヒナ', monster: 'hatchling', monsterName: 'ヒナ',
      recent: [
        { id: 'r-15', date: '2026-04-27', name: 'デモ太郎',  category: 'output', subject: 'クリエイティブ', missionTitle: 'AIで自分のオリジナルキャラを作ろう', count: 1, comment: '楽しかった！' },
        { id: 'r-14', date: '2026-04-27', name: 'サンプル花子', category: 'output', subject: '英語',       missionTitle: '好きな映画タイトルをAIに分解させよう', count: 1, comment: '' },
        { id: 'r-13', date: '2026-04-26', name: 'テストくん',   category: 'result', subject: '全教科',     missionTitle: '英検3級合格', count: 3, comment: '' },
        { id: 'r-12', date: '2026-04-26', name: 'デモ太郎',    category: 'output', subject: '数学',       missionTitle: '苦手な単元の問題をAIに解かせよう', count: 1, comment: '' },
        { id: 'r-11', date: '2026-04-25', name: 'サンプル花子', category: 'output', subject: 'クリエイティブ', missionTitle: '4コマ漫画のシナリオをAIと作ろう', count: 1, comment: '4コマ完成！' },
      ],
      all: [],
    };
  }

  global.MZ_API = { fetchState };
})(window);
