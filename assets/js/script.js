/* =========================================================
   SHIFT AI ジュニア ドラゴン育成サイト
   フロントエンド スクリプト
   =========================================================
   データソース: GAS WebApp（JSON API）
   API URLはデプロイ時に設定（現状はモックデータ）
   ========================================================= */

const CONFIG = {
  API_URL:               "https://script.google.com/macros/s/AKfycbw3a2kgnY2qyxHYKQ-ikPamyJsOTNPAhAE8pOJFGzNzB27OTmWVXAjIyaoL8jJ7AWOP/exec",
  FORM_URL:              "https://docs.google.com/forms/d/e/1FAIpQLScZoIsBob0QGxApinDdwVVoMT10aVzOfO-urY-w5DxFThCdwg/viewform",
  FORM_ENTRY_NICKNAME:   "entry.1068732636",
  FORM_ENTRY_MISSION_ID: "entry.658661739",
  SPREADSHEET_ID:        "1j-2-fWD9PnLEh1zzqWHayOTZEarVHA37TqDJuXhJaKo",
  USE_MOCK: false,
};

/* ---------------------------------------------------------
   進化段階定義
   --------------------------------------------------------- */
const EVOLUTION = [
  { lv: 1, name: "タマゴ",         xpStart: 0,    sprite: "assets/sprites/lv1-egg.png"  },
  { lv: 2, name: "ベビードラゴン",   xpStart: 100,  sprite: "assets/sprites/lv2-baby.png" },
  { lv: 3, name: "若竜",           xpStart: 400,  sprite: "assets/sprites/lv3-young.png" },
  { lv: 4, name: "成竜",           xpStart: 1100, sprite: "assets/sprites/lv4-adult.png" },
  { lv: 5, name: "神竜",           xpStart: 2400, sprite: "assets/sprites/lv5-god.png"   },
];

function calcEvolutionState(totalXp) {
  let current = EVOLUTION[0];
  let next = null;
  for (let i = 0; i < EVOLUTION.length; i++) {
    if (totalXp >= EVOLUTION[i].xpStart) {
      current = EVOLUTION[i];
      next = EVOLUTION[i + 1] || null;
    }
  }
  const xpInCurrentLv = totalXp - current.xpStart;
  const xpNeededForNext = next ? next.xpStart - current.xpStart : 0;
  const progress = next ? (xpInCurrentLv / xpNeededForNext) * 100 : 100;
  return { current, next, xpInCurrentLv, xpNeededForNext, progress: Math.min(progress, 100), isMax: !next };
}

/* ---------------------------------------------------------
   モックデータ
   --------------------------------------------------------- */
function getMockData() {
  return {
    totalXp: 120,
    totalSubmissions: 6,
    totalMembers: 4,
    recent: [
      { id: "s-001", date: "2026-04-23", name: "あかり", subject: "英語",   missionTitle: "AIと5分間 英会話する",           content: "ChatGPT音声で好きなアニメについて英語で5分話せた！聞き取りが追いつかない時もあったけどAIがゆっくり話してくれた。", likes: 3 },
      { id: "s-002", date: "2026-04-23", name: "りく",   subject: "数学",   missionTitle: "AIに別の解き方を教えてもらう",   content: "二次方程式の解法を3通り出してもらって、因数分解と解の公式の違いが理解できた。", likes: 5 },
      { id: "s-003", date: "2026-04-22", name: "さな",   subject: "国語",   missionTitle: "AIに本のあらすじを要約してもらう", content: "『君たちはどう生きるか』をAIに要約してもらって、そこから自分の意見を書いた。", likes: 2 },
      { id: "s-004", date: "2026-04-22", name: "あかり", subject: "その他", missionTitle: "AIでオリジナルイラストを作る",   content: "NanoBananaで未来都市の絵を作ってみた🏙️ プロンプトの書き方で雰囲気が全然変わる！", likes: 7 },
      { id: "s-005", date: "2026-04-21", name: "ゆうた", subject: "英語",   missionTitle: "AIに英単語カードを作ってもらう", content: "宇宙に関する英単語10個を例文付きで出してもらった。例文ごとだと覚えやすい。", likes: 1 },
      { id: "s-006", date: "2026-04-21", name: "りく",   subject: "その他", missionTitle: "AIと一緒にScratchゲームを作る", content: "Claudeにコードの聞き方を教わりながらシューティングゲーム作った！", likes: 4 },
    ],
    all: [],
  };
}

async function fetchData() {
  if (CONFIG.USE_MOCK || !CONFIG.API_URL) return getMockData();
  try {
    const res = await fetch(CONFIG.API_URL);
    if (!res.ok) throw new Error("API error: " + res.status);
    return await res.json();
  } catch (e) {
    console.warn("API呼び出し失敗、モックにフォールバック:", e);
    return getMockData();
  }
}

/* ---------------------------------------------------------
   ドラゴン表示更新
   --------------------------------------------------------- */
function renderDragonStage(data) {
  const { totalXp, totalSubmissions, totalMembers, recent } = data;
  const state = calcEvolutionState(totalXp);

  const spriteEl = document.getElementById("dragonSprite");
  if (spriteEl) {
    spriteEl.src = state.current.sprite;
    spriteEl.alt = `Lv.${state.current.lv} ${state.current.name}`;
    spriteEl.onerror = () => {
      const prevLv = Math.max(1, state.current.lv - 1);
      spriteEl.src = EVOLUTION[prevLv - 1].sprite;
    };
  }
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText("lvNumber", state.current.lv);
  setText("lvName",   state.current.name);
  setText("xpCurrent", state.xpInCurrentLv);
  setText("xpNext",    state.xpNeededForNext || "MAX");
  setText("totalSubmissions", totalSubmissions);
  setText("totalMembers",     totalMembers);
  setText("totalXp",          totalXp);

  const fillEl = document.getElementById("xpBarFill");
  if (fillEl) fillEl.style.width = state.progress + "%";

  // 最新5件
  const listEl = document.getElementById("recentList");
  if (listEl) {
    listEl.innerHTML = "";
    const items = (recent || []).slice(0, 5);
    if (items.length === 0) {
      listEl.innerHTML = '<li class="submission-list__loading">まだ提出がないよ。最初の提出者になろう🐲</li>';
    } else {
      items.forEach(item => listEl.appendChild(createSubmissionItem(item, { clickable: true })));
    }
  }
}

/* ---------------------------------------------------------
   提出リスト 1行 生成（クリック可能)
   --------------------------------------------------------- */
function createSubmissionItem(item, opts = {}) {
  const li = document.createElement("li");
  li.className = "submission-row";
  if (opts.clickable) li.classList.add("is-clickable");
  const excerpt = truncate(item.content || "", 40);
  li.innerHTML = `
    <span class="subject-badge subject-badge--${escapeHtml(item.subject)}">${escapeHtml(item.subject)}</span>
    <span class="submission-name">${escapeHtml(item.name)}</span>
    <span class="submission-content">${escapeHtml(excerpt)}</span>
    <span class="submission-likes" aria-label="いいね">♥ ${Number(item.likes) || 0}</span>
    <span class="submission-date">${escapeHtml(item.date)}</span>
  `;
  if (opts.clickable) {
    li.addEventListener("click", () => openSubmissionModal(item));
  }
  return li;
}

function truncate(s, n) { return s.length > n ? s.slice(0, n) + "…" : s; }

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ---------------------------------------------------------
   課題カタログ描画
   --------------------------------------------------------- */
const missionState = { subject: "", difficulty: "" };

function renderMissions(opts = {}) {
  const gridEl = document.getElementById("missionGrid");
  if (!gridEl) return;

  let filtered = MOCK_MISSIONS.filter(m => {
    if (missionState.subject && m.subject !== missionState.subject) return false;
    if (missionState.difficulty && String(m.difficulty) !== missionState.difficulty) return false;
    return true;
  });

  // トップページは6件に絞る（各教科バランス良く＋ランダム性）
  if (opts.featured) {
    filtered = pickFeaturedMissions_(MOCK_MISSIONS, 6);
  }

  gridEl.innerHTML = "";
  if (filtered.length === 0) {
    gridEl.innerHTML = '<div class="submission-list__loading">条件に合う課題はないよ</div>';
    return;
  }
  filtered.forEach(m => gridEl.appendChild(createMissionCard(m)));
}

/**
 * トップページ用おすすめ6件をピック
 * 各教科から★1-★3中心にランダムで取得（難しすぎない）
 */
function pickFeaturedMissions_(all, n) {
  const byDifficulty = all.filter(m => m.difficulty <= 3);
  const shuffled = byDifficulty.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function createMissionCard(m) {
  const card = document.createElement("article");
  card.className = "mission-card";
  const stars = "★".repeat(m.difficulty) + "☆".repeat(5 - m.difficulty);
  const hintHtml = m.hint
    ? `<div class="mission-card__hint">💡 ${escapeHtml(m.hint)}</div>`
    : "";
  card.innerHTML = `
    <div class="mission-card__head">
      <span class="subject-badge subject-badge--${escapeHtml(m.subject)}">${escapeHtml(m.subject)}</span>
      <span class="difficulty-stars" title="難易度 ${m.difficulty}">${stars}</span>
    </div>
    <h3 class="mission-card__title">${escapeHtml(m.title)}</h3>
    <p class="mission-card__desc">${escapeHtml(m.desc)}</p>
    ${hintHtml}
    <div class="mission-card__foot">
      <span class="mission-card__xp">+${m.xp} XP</span>
      <button class="btn btn--mission" data-mission-id="${escapeHtml(m.id)}">📝 提出する</button>
    </div>
  `;
  card.querySelector("button").addEventListener("click", () => openSubmitForm(m));
  return card;
}

function openSubmitForm(m) {
  // Googleフォームに課題IDと教科をプリセット値として渡す
  const url = buildFormUrl(m);
  window.open(url, "_blank", "noopener");
}

function buildFormUrl(m) {
  const base = CONFIG.FORM_URL || "#";
  if (!base.startsWith("http")) return base;
  // 中高生が見ても意味がわかるように「タイトル [ID]」形式で自動入力する
  // 教科はmission IDから自動判別できるため、フォームには渡さない
  const missionDisplay = `${m.title} [${m.id}]`;
  const params = new URLSearchParams();
  params.set("usp", "pp_url");
  params.set(CONFIG.FORM_ENTRY_MISSION_ID, missionDisplay);
  const sep = base.includes("?") ? "&" : "?";
  return base + sep + params.toString();
}

/**
 * mission ID から教科を判別（将来のwebapp.gs側ロジックと対応）
 * m-e* → 英語 / m-m* → 数学 / m-j* → 国語 / m-o* → その他
 */
function getSubjectFromMissionId(id) {
  if (!id) return "その他";
  const prefix = id.slice(0, 3);
  return { "m-e": "英語", "m-m": "数学", "m-j": "国語", "m-o": "その他" }[prefix] || "その他";
}

function setupMissionFilters() {
  const subjectSel = document.getElementById("missionFilterSubject");
  const diffSel    = document.getElementById("missionFilterDifficulty");
  if (subjectSel) subjectSel.addEventListener("change", () => { missionState.subject = subjectSel.value;    renderMissions(); });
  if (diffSel)    diffSel.addEventListener("change",    () => { missionState.difficulty = diffSel.value;    renderMissions(); });
}

/* ---------------------------------------------------------
   作品ポップアップ（モーダル）
   --------------------------------------------------------- */
function openSubmissionModal(item) {
  const modal = document.getElementById("submissionModal");
  const body  = document.getElementById("modalBody");
  if (!modal || !body) return;

  const likedKey = `liked_${item.id}`;
  const isLiked = !!localStorage.getItem(likedKey);
  const likeCount = Number(item.likes) || 0;

  body.innerHTML = `
    <div class="modal__head">
      <span class="subject-badge subject-badge--${escapeHtml(item.subject)}">${escapeHtml(item.subject)}</span>
      <span class="modal__date">${escapeHtml(item.date)}</span>
    </div>
    <h3 class="modal__title">${escapeHtml(item.missionTitle || "提出作品")}</h3>
    <p class="modal__author">✍️ ${escapeHtml(item.name)}</p>
    <div class="modal__text">${escapeHtml(item.content || "")}</div>
    <div class="modal__actions">
      <button class="like-btn ${isLiked ? "is-liked" : ""}" data-id="${escapeHtml(item.id)}">
        <span class="like-btn__heart">♥</span>
        <span class="like-btn__count">${likeCount + (isLiked ? 1 : 0)}</span>
      </button>
    </div>
  `;

  const likeBtn = body.querySelector(".like-btn");
  if (likeBtn) likeBtn.addEventListener("click", () => toggleLike(item, likeBtn));

  modal.setAttribute("aria-hidden", "false");
  modal.classList.add("is-open");
}

function closeSubmissionModal() {
  const modal = document.getElementById("submissionModal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  modal.classList.remove("is-open");
}

function setupModal() {
  const modal = document.getElementById("submissionModal");
  if (!modal) return;
  modal.querySelectorAll("[data-modal-close]").forEach(el => {
    el.addEventListener("click", closeSubmissionModal);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSubmissionModal();
  });
}

/* ---------------------------------------------------------
   いいね機能（localStorage連打防止 + 将来 GAS 送信）
   --------------------------------------------------------- */
function toggleLike(item, btnEl) {
  const key = `liked_${item.id}`;
  const isLiked = !!localStorage.getItem(key);
  const countEl = btnEl.querySelector(".like-btn__count");
  const baseLikes = Number(item.likes) || 0;

  if (isLiked) {
    localStorage.removeItem(key);
    btnEl.classList.remove("is-liked");
    countEl.textContent = baseLikes;
    sendLike(item.id, -1);
  } else {
    localStorage.setItem(key, "1");
    btnEl.classList.add("is-liked");
    countEl.textContent = baseLikes + 1;
    sendLike(item.id, +1);
    btnEl.classList.add("is-poped");
    setTimeout(() => btnEl.classList.remove("is-poped"), 400);
  }
}

async function sendLike(submissionId, delta) {
  if (CONFIG.USE_MOCK || !CONFIG.API_URL) {
    console.log(`[mock] like ${submissionId}: ${delta > 0 ? "+1" : "-1"}`);
    return;
  }
  try {
    await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like", id: submissionId, delta }),
    });
  } catch (e) {
    console.warn("いいね送信失敗:", e);
  }
}

/* ---------------------------------------------------------
   アーカイブページ
   --------------------------------------------------------- */
const ARCHIVE_PER_PAGE = 20;
const archiveState = { all: [], filtered: [], page: 1 };

function renderArchive(data) {
  archiveState.all = (data.all && data.all.length > 0) ? data.all : (data.recent || []);
  archiveState.filtered = archiveState.all.slice();
  applyArchiveView();

  const selector = document.getElementById("filterSubject");
  if (selector) {
    selector.addEventListener("change", () => {
      const val = selector.value;
      archiveState.filtered = val ? archiveState.all.filter(x => x.subject === val) : archiveState.all.slice();
      archiveState.page = 1;
      applyArchiveView();
    });
  }
}

function applyArchiveView() {
  const listEl = document.getElementById("archiveList");
  const countEl = document.getElementById("resultCount");
  const total = archiveState.filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / ARCHIVE_PER_PAGE));
  const page = Math.min(archiveState.page, totalPages);
  const start = (page - 1) * ARCHIVE_PER_PAGE;
  const view = archiveState.filtered.slice(start, start + ARCHIVE_PER_PAGE);

  if (listEl) {
    listEl.innerHTML = "";
    if (view.length === 0) {
      listEl.innerHTML = '<li class="submission-list__loading">条件に合う提出はまだないよ</li>';
    } else {
      view.forEach(item => listEl.appendChild(createSubmissionItem(item, { clickable: true })));
    }
  }
  if (countEl) countEl.textContent = `${total}件 (${page}/${totalPages}ページ)`;
  renderPagination(totalPages, page);
}

function renderPagination(totalPages, currentPage) {
  const nav = document.getElementById("pagination");
  if (!nav) return;
  nav.innerHTML = "";
  if (totalPages <= 1) return;
  const prev = document.createElement("button");
  prev.textContent = "←";
  prev.disabled = currentPage <= 1;
  prev.addEventListener("click", () => { archiveState.page--; applyArchiveView(); });
  nav.appendChild(prev);
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("is-active");
    btn.addEventListener("click", () => { archiveState.page = i; applyArchiveView(); });
    nav.appendChild(btn);
  }
  const next = document.createElement("button");
  next.textContent = "→";
  next.disabled = currentPage >= totalPages;
  next.addEventListener("click", () => { archiveState.page++; applyArchiveView(); });
  nav.appendChild(next);
}

/* ---------------------------------------------------------
   起動
   --------------------------------------------------------- */
async function init() {
  setupModal();
  setupMissionFilters();
  const data = await fetchData();
  const page = window.__PAGE__ || "top";
  if (page === "archive") {
    renderArchive(data);
  } else if (page === "missions") {
    renderMissions({ featured: false });  // missionsページ: 全件 + フィルタ
  } else {
    renderDragonStage(data);
    renderMissions({ featured: true });   // トップ: おすすめ6件のみ
  }
}

document.addEventListener("DOMContentLoaded", init);
