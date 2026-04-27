/**
 * トップページ メインロジック
 */
(async function () {
  const cfg = window.MZ_CONFIG;
  const state = await window.MZ_API.fetchState();
  const stats = state.stats || { ai: 0, eng: 0, math: 0, study: 0, creative: 0 };

  // モンスター決定
  const m = window.MZ_MONSTER.determineMonster(stats);

  // モンスター画像・名前を反映
  const img = document.getElementById('monster-image');
  if (img) {
    img.src = m.imagePath;
    img.alt = m.monsterName;
    let triedSvg = false;
    img.onerror = () => {
      // PNGがなければSVGプレースホルダーを試す
      if (!triedSvg && img.src.endsWith('.png')) {
        triedSvg = true;
        img.src = m.imagePath.replace('.png', '.svg');
        return;
      }
      // どちらもなければ絵文字プレースホルダー
      img.style.display = 'none';
      const ph = document.getElementById('monster-placeholder');
      if (ph) ph.style.display = 'block';
    };
  }
  setText('monster-name', m.monsterName);
  setText('monster-lv', 'Lv.' + m.lv);
  setText('monster-total-xp', m.total + ' XP');
  setText('total-submissions', (state.totalSubmissions || 0) + ' 件');
  setText('total-members', (state.totalMembers || 0) + ' 人');

  // 軸別ポイント表示
  cfg.SUBJECTS.forEach(s => {
    setText('axis-' + s.key, (stats[s.key] || 0) + ' XP');
  });

  // 次レベルまでの残りXP
  const nextLv = cfg.EVOLUTION.find(e => e.lv === m.lv + 1);
  if (nextLv) {
    const remain = nextLv.xpStart - m.total;
    setText('next-lv-info', `次のLv.${nextLv.lv}まで あと ${remain} XP`);
  } else {
    setText('next-lv-info', '🌟 最終形態に到達！');
  }

  // レーダーチャート
  drawRadar(stats);

  // 最新提出
  renderRecent(state.recent || []);
})();

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function drawRadar(stats) {
  const cfg = window.MZ_CONFIG;
  const ctx = document.getElementById('radar-chart');
  if (!ctx || typeof Chart === 'undefined') return;

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: cfg.SUBJECTS.map(s => s.label),
      datasets: [{
        label: '現在のXP',
        data: cfg.SUBJECTS.map(s => stats[s.key] || 0),
        backgroundColor: 'rgba(241, 196, 15, 0.25)',
        borderColor: '#F1C40F',
        borderWidth: 2,
        pointBackgroundColor: cfg.SUBJECTS.map(s => s.color),
        pointBorderColor: '#fff',
        pointRadius: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          suggestedMax: 100,
          ticks: { color: '#aaa', backdropColor: 'transparent' },
          grid: { color: 'rgba(255,255,255,0.15)' },
          angleLines: { color: 'rgba(255,255,255,0.2)' },
          pointLabels: { color: '#fff', font: { size: 14, weight: 'bold' } },
        },
      },
      plugins: { legend: { display: false } },
    },
  });
}

function renderRecent(recent) {
  const ul = document.getElementById('recent-list');
  if (!ul) return;
  if (!recent.length) {
    ul.innerHTML = '<li class="empty">まだ提出がありません。最初の1人になろう！</li>';
    return;
  }
  ul.innerHTML = recent.map(r => `
    <li class="recent-item">
      <div class="recent-meta">
        <span class="recent-date">${r.date || ''}</span>
        <span class="recent-subject" data-subject="${r.subject || ''}">${r.subject || ''}</span>
        <span class="recent-xp">+${r.xp || 15} XP</span>
      </div>
      <div class="recent-name">${escapeHtml(r.name || 'ゲスト')}</div>
      <div class="recent-mission">${escapeHtml(r.missionTitle || '')}</div>
      ${r.comment ? `<div class="recent-comment">💬 ${escapeHtml(r.comment)}</div>` : ''}
    </li>
  `).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
