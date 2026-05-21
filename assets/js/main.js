/**
 * トップページ メインロジック v3
 * 件数ベース判定 + 画像プレースホルダー対応
 */
(async function () {
  const cfg = window.MZ_CONFIG;
  const state = await window.MZ_API.fetchState();
  const stats = state.stats || { ai: 0, eng: 0, math: 0, study: 0, creative: 0 };
  const totalCount = (typeof state.totalCount === 'number')
    ? state.totalCount
    : Object.values(stats).reduce((a, b) => a + b, 0);

  const m = window.MZ_MONSTER.determineMonster(stats, totalCount);

  // ステータスバー
  setText('status-lv', 'Lv.' + m.lv);
  setText('status-name', m.monsterName);
  setText('status-xp', m.total + ' 件');

  // 件数バー進捗
  const thresholds = cfg.LEVEL_THRESHOLDS || [0, 10, 20, 30, 40];
  const curThreshold = thresholds[m.lv - 1] || 0;
  const nextThreshold = thresholds[m.lv];
  if (typeof nextThreshold === 'number') {
    const span = nextThreshold - curThreshold;
    const progress = span > 0 ? Math.min(100, ((m.total - curThreshold) / span) * 100) : 0;
    document.getElementById('xp-bar-fill').style.width = progress + '%';
    setText('next-lv-info', `次のLv.${m.lv + 1}まで あと ${Math.max(0, nextThreshold - m.total)} 件`);
  } else {
    document.getElementById('xp-bar-fill').style.width = '100%';
    setText('next-lv-info', '🌟 最終形態到達');
  }

  setText('total-submissions', state.totalSubmissions || 0);
  setText('total-members', state.totalMembers || 0);

  // 軸別カウント
  cfg.SUBJECTS.forEach(s => {
    setText('axis-' + s.key, (stats[s.key] || 0));
  });

  // ミニアバター
  setMonsterImage('mini-monster-img', 'mini-monster-emoji', m.imagePath, m.monsterName, m.placeholder);
  setText('mini-lv', 'Lv.' + m.lv);

  // モーダル用画像
  setMonsterImage('modal-monster-img', 'modal-monster-emoji', m.imagePath, m.monsterName, m.placeholder);
  setText('modal-monster-name', m.monsterName);
  setText('modal-monster-lv', 'Lv.' + m.lv);
  setText('modal-monster-meta', `累計 ${m.total} 件 ｜ ${state.totalSubmissions || 0} 件提出`);

  // 最新提出
  renderRecent(state.recent || []);
})();

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setMonsterImage(imgId, emojiId, imagePath, alt, placeholderText) {
  const img = document.getElementById(imgId);
  const emoji = document.getElementById(emojiId);
  const placeholder = placeholderText || '画像準備中';

  if (!img) return;

  const showPlaceholder = () => {
    img.style.display = 'none';
    if (emoji) {
      emoji.style.display = 'flex';
      emoji.textContent = placeholder;
      emoji.classList.add('placeholder-text');
    }
  };

  if (!imagePath) {
    showPlaceholder();
    return;
  }

  img.src = imagePath;
  img.alt = alt || '';
  img.onerror = showPlaceholder;
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
    const countLabel = cat === 'result' ? `+${r.count || 3} 件` : `+${r.count || 1} 件`;
    return `
    <li class="recent-item" style="border-left-color:${borderColor}">
      <div class="recent-meta">
        ${catBadge}
        <span class="recent-date">${r.date || ''}</span>
        <span class="recent-subject">${r.subject || ''}</span>
        <span class="recent-xp">${countLabel}</span>
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
