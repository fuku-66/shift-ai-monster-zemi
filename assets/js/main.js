/**
 * トップページ メインロジック v2
 * ステータスバー + ミニアバター + トグル式チャート
 */
(async function () {
  const cfg = window.MZ_CONFIG;
  const state = await window.MZ_API.fetchState();
  const stats = state.stats || { ai: 0, eng: 0, math: 0, study: 0, creative: 0 };

  const m = window.MZ_MONSTER.determineMonster(stats);

  // ステータスバー
  setText('status-lv', 'Lv.' + m.lv);
  setText('status-name', m.monsterName);
  setText('status-xp', m.total + ' XP');

  // XPバー進捗
  const cur = cfg.EVOLUTION.find(e => e.lv === m.lv);
  const next = cfg.EVOLUTION.find(e => e.lv === m.lv + 1);
  if (next) {
    const span = next.xpStart - cur.xpStart;
    const progress = Math.min(100, ((m.total - cur.xpStart) / span) * 100);
    document.getElementById('xp-bar-fill').style.width = progress + '%';
    setText('next-lv-info', `次のLv.${next.lv}まで あと ${next.xpStart - m.total} XP`);
  } else {
    document.getElementById('xp-bar-fill').style.width = '100%';
    setText('next-lv-info', '🌟 最終形態到達');
  }

  setText('total-submissions', state.totalSubmissions || 0);
  setText('total-members', state.totalMembers || 0);

  // 軸別ポイント
  cfg.SUBJECTS.forEach(s => {
    setText('axis-' + s.key, (stats[s.key] || 0));
  });

  // ミニアバター
  setMonsterImage('mini-monster-img', 'mini-monster-emoji', m.imagePath, m.monsterName);
  setText('mini-lv', 'Lv.' + m.lv);

  // モーダル用画像（先にセット）
  setMonsterImage('modal-monster-img', 'modal-monster-emoji', m.imagePath, m.monsterName);
  setText('modal-monster-name', m.monsterName);
  setText('modal-monster-lv', 'Lv.' + m.lv);
  const balanceText = (m.lv >= 3 && state.isBalance) ? '🌈 全軸バランス進化' : '';
  setText('modal-monster-meta', `${m.total} XP 累計 ｜ ${state.totalSubmissions || 0} 件提出 ${balanceText}`);

  // レーダーチャート: 常に描画
  window._radarStats = stats;
  window._radarDrawn = false;

  // 最新提出
  renderRecent(state.recent || []);

  // 描画はDOMやChartの準備完了後に。失敗してもログだけ
  setTimeout(() => {
    try {
      drawRadar(stats);
      window._radarDrawn = true;
    } catch (e) {
      console.error('レーダー描画失敗:', e);
    }
    // sessionStorageで開閉状態を反映
    const savedState = sessionStorage.getItem('radarOpen');
    if (savedState === '0') {
      const wrap = document.getElementById('radar-wrap');
      const toggle = document.getElementById('radar-toggle');
      const icon = document.getElementById('radar-toggle-icon');
      if (wrap) wrap.style.display = 'none';
      if (toggle) {
        toggle.classList.remove('open');
        toggle.querySelector('span:first-child').textContent = '📡 詳細レーダーチャートを見る';
      }
      if (icon) icon.textContent = '▼';
    }
  }, 0);
})();

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setMonsterImage(imgId, emojiId, imagePath, alt) {
  const img = document.getElementById(imgId);
  const emoji = document.getElementById(emojiId);
  if (!img) return;
  img.src = imagePath;
  img.alt = alt || '';
  let triedSvg = false;
  img.onerror = () => {
    if (!triedSvg && img.src.endsWith('.png')) {
      triedSvg = true;
      img.src = imagePath.replace('.png', '.svg');
      return;
    }
    img.style.display = 'none';
    if (emoji) emoji.style.display = 'block';
  };
}

function toggleRadar() {
  const wrap = document.getElementById('radar-wrap');
  const toggle = document.getElementById('radar-toggle');
  const icon = document.getElementById('radar-toggle-icon');
  const open = wrap.style.display !== 'none';

  if (open) {
    wrap.style.display = 'none';
    toggle.classList.remove('open');
    icon.textContent = '▼';
    toggle.querySelector('span:first-child').textContent = '📡 詳細レーダーチャートを見る';
    sessionStorage.setItem('radarOpen', '0');
  } else {
    wrap.style.display = 'block';
    toggle.classList.add('open');
    icon.textContent = '▲';
    toggle.querySelector('span:first-child').textContent = '📡 レーダーチャートを閉じる';
    if (!window._radarDrawn) {
      drawRadar(window._radarStats || {});
      window._radarDrawn = true;
    }
    sessionStorage.setItem('radarOpen', '1');
  }
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
          pointLabels: { color: '#fff', font: { size: 12, weight: 'bold' } },
        },
      },
      plugins: { legend: { display: false } },
    },
  });
}

function toggleMonsterDetail() {
  document.getElementById('monster-modal-backdrop').classList.add('show');
}
function closeMonsterModal() {
  document.getElementById('monster-modal-backdrop').classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.getElementById('monster-modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target.id === 'monster-modal-backdrop') closeMonsterModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMonsterModal();
  });
});

function renderRecent(recent) {
  const ul = document.getElementById('recent-list');
  if (!ul) return;
  if (!recent.length) {
    ul.innerHTML = '<li class="empty">まだ提出がありません。最初の1人になろう！</li>';
    return;
  }
  ul.innerHTML = recent.map(r => {
    const cat = r.category || 'output';
    const catBadge = cat === 'result'
      ? '<span class="cat-badge result">🏆 成果</span>'
      : '<span class="cat-badge output">📦 成果物</span>';
    const borderColor = cat === 'result' ? '#F1C40F' : '#3498DB';
    return `
    <li class="recent-item" style="border-left-color:${borderColor}">
      <div class="recent-meta">
        ${catBadge}
        <span class="recent-date">${r.date || ''}</span>
        <span class="recent-subject">${r.subject || ''}</span>
        <span class="recent-xp">+${r.xp || 15} XP</span>
      </div>
      <div class="recent-name">${escapeHtml(r.name || 'ゲスト')}</div>
      <div class="recent-mission">${escapeHtml(r.missionTitle || '')}</div>
      ${r.comment ? `<div class="recent-comment">💬 ${escapeHtml(r.comment)}</div>` : ''}
    </li>
  `;
  }).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
