/* =========================================================
 * 詳細報告共用程式（detail-gait.html、detail-sppb.html）
 * 各頁在載入本檔前先設定 window.PAGE_KEY = "gait" | "sppb"
 * 內容：推薦影片設定、倒數與過期、過期／無權限頁、API 共用函式、頂帶、半圓儀表（沿用 result.html 幾何與指針算法）、
 *      測驗數值（大數字、區間條）、行動力狀態、行動建議、最新消息、推薦影片、進場動畫、儲存視窗與存圖、預覽框
 * 文字一律用 t(key)（js/detail-i18n.js）
 * ========================================================= */

/* 推薦影片設定（兩頁共用）：可放多支，目前只顯示第一支
 * 陣列為空、或第一支沒有 youtubeId 時，整個區塊隱藏；title 為空字串時不顯示標題那一行 */
const REPORT_VIDEOS = [{ youtubeId: "ugWW7nimKUI", title: { "zh-TW": "", ja: "", en: "" } }];

const $ = (sel, root = document) => root.querySelector(sel);
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCapturing = () => document.body.classList.contains("is-capturing");

/* 圖片不存在：改顯示同尺寸的淺色佔位框（.img-frame 依 --ratio 保留比例） */
function imgMissing(img) {
  const frame = img.closest(".img-frame");
  if (frame) frame.classList.add("is-missing");
}
/* 把元素裡的文字換掉、保留圖示（inline-flex 膠囊的文字不能包 <span>，html2canvas 會漏畫） */
function setTail(el, text) {
  [...el.childNodes].forEach((n) => n.nodeType === 3 && n.remove());
  el.append(text);
}

/* ── 儲存時效倒數計時（檢測日期 + 1 天） ── */
let expireTime = null;
let countdownTimer = null;

/* 本機開發環境：略過過期判斷（不影響 API_BASE_URL） */
const IS_LOCAL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.protocol === "file:";

/* 預覽模式（開發用）：網址帶 ?preview=1 時不呼叫 API，改用假資料 */
const PREVIEW = new URLSearchParams(window.location.search).get("preview") === "1";

// 儲存膠囊與儲存視窗的倒數文字；膠囊顯示「剩 23:41:08」，開發模式、過期時直接顯示狀態
function setCountdownText(text, kind) {
  const dock = document.getElementById("dockCountdown");
  const modal = document.getElementById("modalCountdown");
  if (dock) {
    dock.textContent = kind === "time" ? t("save.leftShort", { t: text }) : text;
    dock.closest(".save-pill")?.classList.toggle("is-expired", kind === "expired");
  }
  if (modal) modal.textContent = text;
}

function updateCountdown() {
  if (expireTime === null) return;

  const modalWrap = document.getElementById("modalExpire");
  let diff = expireTime - Date.now();

  if (diff <= 0) {
    setCountdownText(t("countdown.expired"), "expired");
    if (modalWrap) modalWrap.classList.add("expired");
    clearInterval(countdownTimer);
    countdownTimer = null;
    showExpiredPage();
    return;
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  diff -= days * 24 * 60 * 60 * 1000;
  const hours = Math.floor(diff / (60 * 60 * 1000));
  diff -= hours * 60 * 60 * 1000;
  const minutes = Math.floor(diff / (60 * 1000));
  diff -= minutes * 60 * 1000;
  const seconds = Math.floor(diff / 1000);

  const pad = (n) => String(n).padStart(2, "0");
  const text = (days > 0 ? t("countdown.days", { n: days }) : "") + pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
  setCountdownText(text, "time");
}

function startCountdown(examDateMs) {
  if (IS_LOCAL) {
    console.log("[DEV] 本機環境，已略過過期判斷");
    setCountdownText(t("countdown.dev"), "dev");
    return;
  }
  expireTime = examDateMs + 24 * 60 * 60 * 1000;
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(updateCountdown, 1000);
  updateCountdown();
}

/* ── 過期頁／無權限頁：隱藏報告與儲存視窗，顯示狀態卡（卡片右上角同樣有語系切換） ── */
let statusKind = null;
function showStatusPage(kind) {
  statusKind = kind;
  const view = document.getElementById("statusView");
  view.innerHTML = `
    <div class="expired-card">
      <div class="expired-top" data-html2canvas-ignore>${I18N.switchHTML()}</div>
      <div class="expired-icon"><i class="ti ${kind === "expired" ? "ti-clock-x" : "ti-lock"}"></i></div>
      <div class="expired-title" data-i18n="${kind}.title"></div>
      <div class="expired-desc" data-i18n="${kind}.desc"></div>
      ${PREVIEW ? `<button type="button" class="pv-back" id="pvBack" data-html2canvas-ignore data-i18n="pv.back"></button>` : ""}
    </div>`;
  I18N.apply(view);
  view.hidden = false;
  document.getElementById("reportPage").hidden = true;
  document.getElementById("saveModal").classList.remove("show");
  document.getElementById("pvBack")?.addEventListener("click", hideStatusPage);
  window.scrollTo(0, 0);
}
// 預覽：「返回預覽」回到報告頁
function hideStatusPage() {
  statusKind = null;
  document.getElementById("statusView").hidden = true;
  document.getElementById("reportPage").hidden = false;
}
function showExpiredPage() {
  showStatusPage("expired");
}
function showUnauthorizedPage() {
  showStatusPage("unauth");
}

/* ── 回首頁按鈕（頂帶左上）：網址帶 from=result 或 preview=1 時才顯示；只帶 token（手機掃 QR Code）時不顯示 ── */
function initHomeButton() {
  const btn = document.getElementById("bandHome");
  if (!btn) return;
  const q = new URLSearchParams(window.location.search);
  btn.hidden = !(q.get("from") === "result" || PREVIEW);
  btn.addEventListener("click", () => (window.location.href = "home.html"));
}

/* ── API 設定 ── */
const API_BASE_URL = window.location.hostname === "localhost" ? window.location.origin : "https://service.fongai.co";

function getExamTokenFromUrl() {
  const token = new URLSearchParams(window.location.search).get("token");
  return token ? token.trim() : "";
}

/** 訪客模式判斷：token  */
function isGuestToken(token) {
  return token.startsWith("g-");
}

const riskLevelMap = {
  0: "low2",
  1: "low",
  2: "medium",
  3: "high",
  4: "danger",
};

function formatDateFromTimestamp(ms) {
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "—";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

/** 依出生時間戳計算實歲：若今年生日尚未到，年齡再減 1 */
function getAge(birthMs) {
  const birthDate = new Date(Number(birthMs));
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

function formatSpeed(speed) {
  const rounded = Math.round(speed * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

/** 偏移角度：取絕對值，整數不帶小數，其餘取到小數點後一位 */
function formatOffsetAngle(offset) {
  const n = Math.abs(Number(offset));
  if (!Number.isFinite(n)) return "—";
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function showApiError(message) {
  const banner = document.getElementById("apiErrorBanner");
  const text = document.getElementById("apiErrorMessage");
  if (!banner || !text) return;
  text.textContent = message;
  banner.classList.add("show");
}

function hideApiError() {
  const banner = document.getElementById("apiErrorBanner");
  if (banner) banner.classList.remove("show");
}

/* ── 頂帶：姓名＋稱謂、性別・年齡、檢測日期 ── */
function renderBand(profile, examDate, isGuest) {
  let name;
  if (isGuest) {
    name = t("guest"); // 訪客：不加稱謂
  } else {
    const n = profile?.name ?? "—";
    name = profile?.gender === 1 ? t("name.m", { name: n }) : profile?.gender === 0 ? t("name.f", { name: n }) : n;
  }
  document.getElementById("bandName").textContent = name;
  const parts = [];
  if (profile?.gender === 1 || profile?.gender === 0) parts.push(t("gender." + profile.gender));
  const age = getAge(profile?.birth);
  if (age !== null) parts.push(t("age", { n: age }));
  setTail(document.getElementById("bandWho"), parts.join(t("sep")) || "—");
  setTail(document.getElementById("bandDate"), formatDateFromTimestamp(examDate));
}

/* =========================================================
 * 風險等級（固定配色）、半圓儀表
 * ========================================================= */
/* color：儀表色段；bg／border／text：膠囊底、框、字 */
const riskConfig = {
  low2: { color: "#4ffa00", bg: "#f0fdf4", border: "#86efac", text: "#166534" },
  low: { color: "#8cff00", bg: "#f7fee7", border: "#bef264", text: "#3f6212" },
  medium: { color: "#ffd039", bg: "#fefce8", border: "#fde047", text: "#854d0e" },
  high: { color: "#ffa203", bg: "#fff7ed", border: "#fdba74", text: "#c2410c" },
  danger: { color: "#ff5757", bg: "#fef2f2", border: "#fca5a5", text: "#b91c1c" },
};
/* 膠囊與文字用的三個顏色變數（--risk-bg／--risk-border／--risk-text） */
function setRiskVars(el, level) {
  const c = riskConfig[level];
  el.style.setProperty("--risk-bg", c.bg);
  el.style.setProperty("--risk-border", c.border);
  el.style.setProperty("--risk-text", c.text);
}

/* 半圓儀表：幾何沿用 result.html（圓心 (380, 340)、半徑 300、線寬 76、五段等寬各 36°、段間留 0.9° 縫）
 * 色段由左到右：低、稍低、中、高、危險
 * 指針：在所屬色段內依分數擺放（區間 1 個分數 → 段中央；3 個分數 → 1/6、3/6、5/6），分數越高越靠左 */
const SEG_ORDER = ["low2", "low", "medium", "high", "danger"]; // 由左到右
const SEG_RANGE = { low2: [12, 12], low: [9, 11], medium: [6, 8], high: [3, 5], danger: [0, 2] };
const G = { cx: 380, cy: 340, R: 300, angle: 180, target: null, raf: 0, played: false };
const pt = (cx, cy, r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy - r * Math.sin((deg * Math.PI) / 180)];

/* 指針角度（度，180 = 最左）。score 為 null（行走頁）或不在該段區間內時，放在段中央 */
function needleAngle(level, score) {
  const k = SEG_ORDER.indexOf(level);
  const [min, max] = SEG_RANGE[level];
  const count = max - min + 1;
  let f = 0.5;
  if (score !== null && score >= min && score <= max) {
    const slot = max - score; // 0 = 最高分（最靠左）
    f = (2 * slot + 1) / (2 * count);
  }
  return 180 - 36 * k - 36 * f;
}

function drawGauge() {
  const svg = document.getElementById("gauge");
  if (!svg || svg.dataset.drawn) return;
  const { cx, cy, R } = G;
  const GAP = 0.9; // 每段兩端各留的縫（度）
  let html = "";
  SEG_ORDER.forEach((key, k) => {
    const a1 = 180 - 36 * k - (k > 0 ? GAP : 0); // 左端
    const a0 = 180 - 36 * (k + 1) + (k < 4 ? GAP : 0); // 右端
    const [x1, y1] = pt(cx, cy, R, a1);
    const [x0, y0] = pt(cx, cy, R, a0);
    html += `<path data-level="${key}" d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 0 1 ${x0.toFixed(1)} ${y0.toFixed(1)}" fill="none" stroke="${riskConfig[key].color}" stroke-width="76" />`;
  });
  // 指針畫成指向最左（180°），再用 rotate 轉到目標角度（用 SVG 屬性，存圖時 html2canvas 也看得到）
  html += `<g id="gaugeNeedle" transform="rotate(0 ${cx} ${cy})"><line x1="${cx}" y1="${cy}" x2="${cx - 230}" y2="${cy}" stroke="#1f3b33" stroke-width="10" stroke-linecap="round" /></g>`;
  html += `<circle cx="${cx}" cy="${cy}" r="14" fill="#1f3b33" /><circle cx="${cx}" cy="${cy}" r="5.5" fill="#b08d57" />`;
  svg.innerHTML = html;
  svg.dataset.drawn = "1";
}
function setNeedle(angle) {
  G.angle = angle;
  document.getElementById("gaugeNeedle")?.setAttribute("transform", `rotate(${(180 - angle).toFixed(2)} ${G.cx} ${G.cy})`);
  document.getElementById("gauge").dataset.angle = angle.toFixed(2);
}

/* cubic-bezier 緩動（與 CSS 相同的曲線） */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (s) => ((ax * s + bx) * s + cx) * s;
  const sy = (s) => ((ay * s + by) * s + cy) * s;
  const dx = (s) => (3 * ax * s + 2 * bx) * s + cx;
  return (x) => {
    let s = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(s) - x;
      const d = dx(s);
      if (Math.abs(e) < 1e-5 || !d) break;
      s -= e / d;
    }
    return sy(Math.min(1, Math.max(0, s)));
  };
}
const EASE_SWING = bezier(0.34, 1.2, 0.64, 1); // 進場：轉到目標位置略為超過再回來
const EASE_OUT = bezier(0.22, 1, 0.36, 1);

/* 指針轉到目標：第一次從最左邊轉入（1.6s）；之後（切換語系、預覽切換）用 .4s 移到新位置 */
const modalOpen = () => document.getElementById("saveModal")?.classList.contains("show");
function gaugeTo(target) {
  drawGauge();
  cancelAnimationFrame(G.raf);
  G.target = target;
  if (REDUCED || isCapturing()) {
    G.played = true;
    return setNeedle(target);
  }
  // 進頁時儲存視窗還開著：先停在最左邊，關閉視窗後才播放進場動畫
  if (!G.played && modalOpen()) {
    G.waiting = true;
    return setNeedle(180);
  }
  const first = !G.played;
  G.played = true;
  const from = first ? 180 : G.angle;
  if (Math.abs(from - target) < 0.01) return setNeedle(target);
  const dur = first ? 1600 : 400;
  const ease = first ? EASE_SWING : EASE_OUT;
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    setNeedle(from + (target - from) * ease(p));
    if (p < 1) G.raf = requestAnimationFrame(step);
  };
  G.raf = requestAnimationFrame(step);
}
function gaugeFinish() {
  cancelAnimationFrame(G.raf);
  if (G.target !== null) setNeedle(G.target);
}

/* 儀表下方：風險等級名稱（該等級字色）＋說明一行；指針依 score 擺放（null＝段中央） */
function renderGaugeRisk(level, score) {
  const card = document.getElementById("resultCard");
  setRiskVars(card, level);
  card.dataset.level = level;
  document.getElementById("gaugeValue").textContent = t("risk.name." + level);
  document.getElementById("riskDesc").textContent = t("risk.desc." + level);
  gaugeTo(needleAngle(level, score));
}

/* =========================================================
 * SPPB 總分（拱門基座）：第一次從 0 數到目標（約 140ms 一格）；
 * 進頁時儲存視窗開著就等關閉後才播放；之後（切換語系、預覽）、減少動態、存圖時直接顯示最終值
 * ========================================================= */
const COUNT = { timer: 0, target: null, played: false };
function showTotal(v) {
  const el = document.getElementById("totalNum");
  if (el) el.textContent = v;
}
function countTo(target) {
  clearInterval(COUNT.timer);
  COUNT.target = target;
  if (!COUNT.played && !REDUCED && !isCapturing() && modalOpen()) {
    COUNT.waiting = true; // 關閉儲存視窗後才從 0 數起
    return showTotal(0);
  }
  const first = !COUNT.played;
  COUNT.played = true;
  if (!first || REDUCED || isCapturing() || target === 0) return showTotal(target);
  let v = 0;
  showTotal(0);
  COUNT.timer = setInterval(() => {
    v += 1;
    showTotal(v);
    if (v >= target) clearInterval(COUNT.timer);
  }, 140);
}
function countFinish() {
  clearInterval(COUNT.timer);
  if (COUNT.target !== null) showTotal(COUNT.target);
}

/* =========================================================
 * 測驗數值（行走頁步行速度區塊、SPPB 三項測驗儀表格共用）
 * ========================================================= */
/* 大數字：區塊進場（"revealed"）時從 0 數到目標（約 .8s，整數遞增，最後顯示 text）；
 * 之後（切換語系、預覽切換）、減少動態、存圖時直接顯示最終值。value 為 null 時直接顯示 text（例如「無法完成」） */
function makeCounter(card, numEl) {
  const st = { value: null, text: "", played: false, raf: 0 };
  const show = (s) => (numEl.textContent = s);
  const finish = () => {
    cancelAnimationFrame(st.raf);
    show(st.text);
  };
  const play = () => {
    if (st.played || st.value === null) return;
    st.played = true;
    if (REDUCED || isCapturing()) return finish();
    const target = st.value;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 800);
      if (p < 1) {
        show(String(Math.floor(target * EASE_OUT(p))));
        st.raf = requestAnimationFrame(step);
      } else show(st.text);
    };
    show("0");
    st.raf = requestAnimationFrame(step);
  };
  card.addEventListener("revealed", play);
  document.addEventListener("capturestart", () => {
    st.played = true;
    finish();
  });
  return {
    set(value, text) {
      st.value = value === null || value === undefined ? null : Number(value);
      st.text = text;
      if (st.played || st.value === null) return finish();
      if (card.classList.contains("is-in")) return play(); // 資料晚於進場才到
      cancelAnimationFrame(st.raf);
      show("0"); // 進場前（區塊還沒出現）先停在 0
    },
  };
}
/* 區間條：四段，index 為亮起的段（0–3），-1 表示不亮任何一段 */
function setRange(bar, lbls, index) {
  bar.querySelectorAll(".spd-seg").forEach((s, i) => s.classList.toggle("is-on", i === index));
  lbls.querySelectorAll("span").forEach((s, i) => s.classList.toggle("is-on", i === index));
}

/* 狀態膠囊：4 良好、3／2 需留意、1／0 危險 */
const PILL = {
  good: "ti-circle-check",
  warn: "ti-alert-triangle",
  danger: "ti-alert-circle",
};
const PILL_KIND = { 4: "good", 3: "warn", 2: "warn", 1: "danger", 0: "danger" };
function setPill(el, kind, text) {
  el.className = "pill " + kind;
  el.innerHTML = `<i class="ti ${PILL[kind]}"></i>`;
  el.append(text);
}

/* =========================================================
 * 行動力狀態：插圖依晃動切換 good／warn／danger
 * ========================================================= */
function getSwayLevel(leftOffset, rightOffset) {
  const swayDegree = Math.abs(Number(leftOffset)) + Math.abs(Number(rightOffset));
  if (swayDegree < 8.0) return "low";
  if (swayDegree < 14.0) return "medium";
  return "high";
}

function getBalanceStatus(left, right) {
  const swayDegree = Math.abs(parseFloat(left) || 0) + Math.abs(parseFloat(right) || 0);
  if (swayDegree < 8.0) {
    return {
      title: t("mobility.good.title"),
      desc: t("mobility.good.desc"),
      illustration: "../img/detail/balance_status_good.png",
    };
  } else if (swayDegree < 14.0) {
    return {
      title: t("mobility.warn.title"),
      desc: t("mobility.warn.desc"),
      illustration: "../img/detail/balance_status_warn.png",
    };
  } else {
    return {
      title: t("mobility.danger.title"),
      desc: t("mobility.danger.desc"),
      illustration: "../img/detail/balance_status_danger.png",
    };
  }
}

const SWAY_PILL = { low: "good", medium: "warn", high: "danger" };
function renderMobility(leftOffset, rightOffset) {
  const card = $("#mobCard");
  if (!card) return; // 區塊不存在（例如 SPPB 頁暫時註解）時略過
  const level = getSwayLevel(leftOffset, rightOffset);
  const status = getBalanceStatus(leftOffset, rightOffset);
  card.dataset.level = level;
  const img = $("#mobImg");
  if (img.getAttribute("src") !== status.illustration) {
    $("#mobArt").classList.remove("is-missing");
    img.src = status.illustration;
  }
  img.alt = t("mobility.alt");
  $("#mobTitle").textContent = status.title;
  card.querySelectorAll(".mseg").forEach((s) => s.classList.toggle("is-on", s.dataset.l === level));
  setPill($("#swayPill"), SWAY_PILL[level], t("sway.pill." + level));
  $("#mobDesc").textContent = status.desc;
  $("#swayDesc").textContent = t("sway.desc." + level);
}

/* =========================================================
 * 行動建議：第一條為主步驟，第 2 條起為列表（只有 1 條時不顯示列表）；文字依 PAGE_KEY（js/detail-i18n.js）
 * ========================================================= */
function renderAdvice(level, list = I18N.actions(window.PAGE_KEY, level)) {
  const card = $("#advCard");
  card.dataset.level = level;
  const pill = $("#advLevel"); // 等級膠囊：固定配色表的底、框、字
  setRiskVars(pill, level);
  setTail(pill, t("risk.name." + level));
  const [first, ...rest] = list;
  $("#advMain").hidden = !first;
  $("#advMainTitle").textContent = first ? first[0] : "";
  $("#advMainDesc").textContent = first ? first[1] : "";
  const ol = $("#advList");
  ol.textContent = "";
  rest.forEach(([title, desc], k) => {
    const li = document.createElement("li");
    li.className = "adv-row";
    li.innerHTML = `<div class="adv-row-h"><span class="adv-num">${k + 2}</span><div class="adv-row-t"></div></div><div class="adv-row-d"></div>`;
    li.querySelector(".adv-row-t").textContent = title;
    li.querySelector(".adv-row-d").textContent = desc;
    ol.append(li);
  });
  ol.hidden = rest.length === 0;
  card.classList.toggle("is-single", rest.length === 0);
}

/* =========================================================
 * 最新消息（森林封面；沒有消息時整個區塊隱藏，預覽時保留預覽框；標題與內容不翻譯）
 * 內容依換行切行：含「：」或「:」的行拆成「項目／內容」；沒有冒號的行接在上一項內容後面換行，
 * 前面還沒有項目時獨立成一段。一律用 textContent。半形冒號在數字之間（9:00）或網址（https://）不當作分隔
 * ========================================================= */
function keyIndex(line) {
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === "：") return i;
    if (c === ":") {
      const isTime = /\d/.test(line[i - 1] || "") && /\d/.test(line[i + 1] || "");
      const isUrl = line.slice(i + 1, i + 3) === "//";
      if (!isTime && !isUrl) return i;
    }
  }
  return -1;
}
function buildNewsContent(box, text) {
  box.textContent = "";
  let dl = null;
  let lastDd = null;
  String(text ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((line) => {
      const i = keyIndex(line);
      const key = i > 0 ? line.slice(0, i).trim() : "";
      if (key) {
        if (!dl) {
          dl = document.createElement("dl");
          dl.className = "news-dl";
          box.append(dl);
        }
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = key;
        dd.textContent = line.slice(i + 1).trim();
        dl.append(dt, dd);
        lastDd = dd;
      } else if (lastDd) {
        lastDd.append(document.createElement("br"), document.createTextNode(line));
      } else {
        const p = document.createElement("p");
        p.className = "news-p";
        p.textContent = line;
        box.append(p);
      }
    });
}
function renderNewsCard(news) {
  const has = !!news;
  $("#newsCard").hidden = !has;
  $("#secNews").hidden = !has && !PREVIEW;
  if (!has) return;
  $("#newsTitle").textContent = news.title ?? "—";
  const box = $("#newsBox");
  buildNewsContent(box, news.content);
  $("#newsBody").hidden = !box.childNodes.length;
}

/* =========================================================
 * 推薦影片：點擊縮圖（或 Enter／Space）才換成 iframe；設定在本檔最上方 REPORT_VIDEOS
 * 存圖時播放器暫時換回縮圖（CSS .is-capturing）、連結膠囊改顯示文字網址，存完還原
 * ========================================================= */
let videoOn = true; // 預覽「有／無」
let video = null; // 目前顯示的影片
function videoTitle() {
  return (video && video.title && video.title[I18N.lang]) || "";
}
function stopVideo() {
  $("#vidMedia .vid-frame")?.remove();
  $("#vidMedia").classList.remove("is-playing");
}
function playVideo() {
  const media = $("#vidMedia");
  if (!video || media.classList.contains("is-playing")) return;
  const f = document.createElement("iframe");
  f.className = "vid-frame";
  f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?autoplay=1&rel=0&playsinline=1`;
  f.title = videoTitle() || t("blk.video");
  f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  f.allowFullscreen = true;
  f.referrerPolicy = "strict-origin-when-cross-origin";
  f.setAttribute("data-html2canvas-ignore", "");
  media.append(f);
  media.classList.add("is-playing");
  f.focus();
}
function renderVideo() {
  const v = videoOn ? REPORT_VIDEOS[0] : null;
  const ok = !!(v && v.youtubeId);
  $("#videoCard").hidden = !ok;
  $("#secVideo").hidden = !ok && !PREVIEW;
  if (!ok) {
    stopVideo();
    video = null;
    return;
  }
  const id = v.youtubeId;
  if (!video || video.youtubeId !== id) {
    stopVideo();
    $("#vidImg")?.remove();
    const img = document.createElement("img");
    img.id = "vidImg";
    img.alt = "";
    img.onerror = () => img.remove(); // 縮圖載入失敗：只留深綠底
    // 影片不存在時 YouTube 回傳 120×90 的灰色預設圖（不會觸發 error），同樣移除
    img.onload = () => img.naturalWidth <= 120 && img.remove();
    img.src = `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
    $("#vidThumb").prepend(img);
  }
  video = v;
  const title = videoTitle();
  $("#vidTitle").textContent = title;
  $("#vidTitle").hidden = !title;
  $("#vidMedia .vid-frame")?.setAttribute("title", title || t("blk.video"));
  const link = $("#vidLink");
  link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
  setTail(link, isCapturing() ? `youtu.be/${id}` : t("video.open"));
}
function initVideo() {
  const thumb = $("#vidThumb");
  thumb.addEventListener("click", playVideo);
  thumb.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      playVideo();
    }
  });
  document.addEventListener("capturestart", () => video && setTail($("#vidLink"), `youtu.be/${video.youtubeId}`));
  document.addEventListener("captureend", () => video && setTail($("#vidLink"), t("video.open")));
  renderVideo();
}

/* =========================================================
 * 進場動畫：區塊進入畫面時加 .is-in（淡入上浮）並觸發 "revealed"；1.2 秒後加 .is-settled（之後變化不再延遲）
 * 儲存視窗開著時進入畫面的區塊，等關閉視窗後才播放
 * ========================================================= */
const REVEAL_WAITING = [];
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  const done = (el) => {
    if (!REDUCED && !isCapturing() && modalOpen()) {
      REVEAL_WAITING.push(() => done(el));
      return;
    }
    el.classList.add("is-in");
    el.dispatchEvent(new Event("revealed"));
    setTimeout(() => el.classList.add("is-settled"), REDUCED ? 0 : 1200);
  };
  if (REDUCED || !("IntersectionObserver" in window)) return els.forEach(done);
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        done(e.target);
        io.unobserve(e.target);
      }),
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );
  els.forEach((el) => io.observe(el));
}

/* =========================================================
 * 儲存視窗與存圖
 * ========================================================= */
function closeModal() {
  document.getElementById("saveModal").classList.remove("show");
  // 進場動畫延到儲存視窗關閉後播放
  if (G.waiting) {
    G.waiting = false;
    gaugeTo(G.target);
  }
  if (COUNT.waiting) {
    COUNT.waiting = false;
    countTo(COUNT.target);
  }
  REVEAL_WAITING.splice(0).forEach((fn) => fn());
}
function triggerSave() {
  document.getElementById("saveModal").classList.add("show");
}

function isInAppBrowser() {
  const ua = navigator.userAgent || "";
  return /Line/i.test(ua);
}

/* 存圖前加 .is-capturing：進場元素直接顯示、指針與數字為最終值、儲存膠囊與預覽框不顯示；截完移除
 * 存圖前後在 document 觸發 "capturestart"／"captureend"（大數字、推薦影片用） */
async function captureReport() {
  document.body.classList.add("is-capturing");
  gaugeFinish();
  countFinish();
  REVEAL_WAITING.splice(0).forEach((fn) => fn());
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in", "is-settled"));
  document.dispatchEvent(new Event("capturestart"));
  try {
    await document.fonts?.ready; // 日文字型等載入完成再存圖
    return await html2canvas(document.body, {
      useCORS: true,
      scale: 2,
      backgroundColor: "#ece7df",
    });
  } finally {
    document.body.classList.remove("is-capturing");
    document.dispatchEvent(new Event("captureend"));
  }
}

async function saveReport() {
  if (isInAppBrowser()) {
    alert(t("alert.line"));
    return;
  }

  closeModal();
  await new Promise((resolve) => setTimeout(resolve, 300));

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  let newTab = null;
  if (isIOS) {
    newTab = window.open("", "_blank");
    if (newTab) {
      newTab.document.write(`
        <html lang="${I18N.lang}">
          <head><meta charset="UTF-8"><title>${t("ios.title")}</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#ece7df;font-family:sans-serif;color:#1a2420;">
            <p>${t("ios.generating")}</p>
          <\/body>
        <\/html>
      `);
    }
  }

  try {
    const canvas = await captureReport();

    const fileName = `${t(window.PAGE_KEY + ".file")}_${formatDateFromTimestamp(Date.now())}.png`;

    if (isAndroid) {
      const link = document.createElement("a");
      link.download = fileName;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } else if (isIOS) {
      const dataUrl = canvas.toDataURL("image/png");
      if (newTab) {
        newTab.document.open();
        newTab.document.write(`
          <html lang="${I18N.lang}">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${t("ios.title")}</title>
            </head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#ece7df;">
              <div style="text-align:center;padding:20px;">
                <p style="font-family:sans-serif;color:#1a2420;margin-bottom:16px;font-size:24px;font-weight:700;line-height:1.5;">
                  ${t("ios.hold")}
                </p>
                <img src="${dataUrl}" style="max-width:100%;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);" />
              </div>
            <\/body>
          <\/html>
        `);
        newTab.document.close();
      } else {
        alert(t("alert.popup"));
      }
    } else {
      const link = document.createElement("a");
      link.download = fileName;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  } catch (err) {
    console.error("儲存報告失敗:", err);
    if (newTab) {
      newTab.document.write(`<p style="font-family:sans-serif;padding:20px;">${t("ios.fail")}</p>`);
    } else {
      alert(t("alert.saveFail") + (err.message || err.toString()));
    }
  }
}

/* =========================================================
 * 預覽框（?preview=1）：在 [data-pv] 位置放一組切換按鈕
 * options：[{ label | i18n, value }]
 * ========================================================= */
function buildPreviewBox(slot, key, titleKey, options) {
  const box = document.querySelector(`[data-pv="${slot}"]`);
  if (!box) return; // 區塊不存在時略過
  box.innerHTML =
    `<div class="pv-title"><i class="ti ti-eye"></i><span data-i18n="${titleKey}"></span></div>` +
    `<div class="pv-btns">${options
      .map((o, i) => `<button type="button" data-key="${key}" data-i="${i}"${o.i18n ? ` data-i18n="${o.i18n}"` : ""}>${o.label || ""}</button>`)
      .join("")}</div>`;
  box.hidden = false;
  I18N.apply(box);
}
function syncPreviewButtons(options, state) {
  document.querySelectorAll(".pv-btns button[data-key]").forEach((b) => {
    const v = options[b.dataset.key][b.dataset.i].value;
    b.classList.toggle("is-on", JSON.stringify(v) === JSON.stringify(state[b.dataset.key]));
  });
}
