/* =========================================================
 * 鑑測結果頁共用程式（result.html SPPB、result-gait.html 行走測驗）；樣式在 css/result.css
 * 內容：共用小工具、資料讀取（紀錄、受測者，含一體機）、風險等級與五色半圓圖、頁首（返回、「報告」QR）、
 *      卡片輪迴輪播（拖曳、圓點、閒置提醒、進場）、同齡比較、推薦商品（js/recommend.js）、最新消息、影片（js/video.js）、風險切換示範鈕
 * 各頁在載入本檔後定義 CONFIG（subjects、records），再呼叫這裡的函式
 * 注意：<script> 內字串裡的結束標籤一律寫成 <\/body>、<\/html>、<\/script>
 * ========================================================= */

/* =========================================================
 * 風險切換示範（展示用；兩個結果頁共用）：頁首下方一排「低｜稍低｜中｜高｜危險」，只切換畫面，不寫回紀錄
 * DEMO_RISK_SWITCH：正式上線改成 false（整排不顯示）
 * DEMO.gait[i]、DEMO.sppb[i]：i = 0–4 依序為 低、稍低、中、高、危險
 *   SPPB：平衡三個站姿（秒；null = 沒有做）、4 公尺步行（秒）、五次起坐（秒；null = 無法完成），各項分數依 SPPB 標準計分，總分 = 平衡＋步行＋起坐
 *   VIVIFRAIL、風險等級由頁面原本的規則從總分算出（與下表一致：12 D 低｜9 C 稍低｜7 C 中｜5 B 高｜2 A 危險）
 * ========================================================= */
const DEMO_RISK_SWITCH = true;
const DEMO = {
  gait: [{ riskLevel: 0 }, { riskLevel: 1 }, { riskLevel: 2 }, { riskLevel: 3 }, { riskLevel: 4 }],
  // 秒數用字串，照表格的寫法顯示（15.0 秒顯示「15.0」）
  sppb: [
    { stand: { side: "10", semi: "10", tandem: "10" }, walk: "4.2", chair: "10.5", items: { balance: 4, walk: 4, chair: 4 }, score: 12 },
    { stand: { side: "10", semi: "10", tandem: "10" }, walk: "5.5", chair: "15.0", items: { balance: 4, walk: 3, chair: 2 }, score: 9 },
    { stand: { side: "10", semi: "10", tandem: "6.0" }, walk: "7.5", chair: "16.0", items: { balance: 3, walk: 2, chair: 2 }, score: 7 },
    { stand: { side: "10", semi: "10", tandem: "2.0" }, walk: "8.0", chair: "20.0", items: { balance: 2, walk: 2, chair: 1 }, score: 5 },
    { stand: { side: "10", semi: "5.0", tandem: null }, walk: "10.5", chair: null, items: { balance: 1, walk: 1, chair: 0 }, score: 2 },
  ],
};
// 示範鈕：current = 目前等級（0–4）；onPick(level) 由各頁重畫
function initDemoRisk(current, onPick) {
  const bar = $("#demoRisk");
  if (!bar) return;
  if (!DEMO_RISK_SWITCH) return bar.remove();
  bar.innerHTML =
    `<span class="demo-tag">示範</span>` +
    SEG_ORDER.map((key, i) => {
      const r = RISK[key];
      return `<button class="demo-btn" type="button" data-level="${i}" aria-pressed="${i === current}" style="--risk-bg:${r.bg};--risk-border:${r.border};--risk-text:${r.text}">${r.short}</button>`;
    }).join("");
  bar.hidden = false;
  bar.addEventListener("click", (e) => {
    const b = e.target.closest(".demo-btn");
    if (!b) return;
    const level = Number(b.dataset.level);
    stopVideoCard(); // 切換等級：影片換回封面
    onPick(level);
    setDemoPressed(level);
  });
}
function setDemoPressed(level) {
  document.querySelectorAll(".demo-btn").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.level) === level)));
}

/* ===== 共用小工具 ===== */
const $ = (sel) => document.querySelector(sel);
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
let toastTimer;
function showToast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2000);
}
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
function isoOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
// 依今天往前推 n 天（"YYYY-MM-DD"），各頁 CONFIG.records 使用
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoOf(d);
}

/* 跌倒風險等級 RISK、SEG_ORDER、riskLevelText：js/risk.js（與詳細頁共用） */

/* 跌倒風險半圓圖：圓心 (380, 340)、半徑 300、線寬 76；五段等寬（每段 36°），段與段之間留小縫
 * 指針畫成指向最左（180°），再用 rotate 轉到 angle（度，180 = 最左、0 = 最右） */
const pt = (cx, cy, r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy - r * Math.sin((deg * Math.PI) / 180)];
const GAUGE = { cx: 380, cy: 340 };
function drawGauge(svg) {
  const { cx, cy } = GAUGE;
  const R = 300, GAP = 0.9; // GAP：每段兩端各留的縫（度）
  let html = "";
  SEG_ORDER.forEach((key, k) => {
    const a1 = 180 - 36 * k - (k > 0 ? GAP : 0); // 左端
    const a0 = 180 - 36 * (k + 1) + (k < 4 ? GAP : 0); // 右端
    const [x1, y1] = pt(cx, cy, R, a1);
    const [x0, y0] = pt(cx, cy, R, a0);
    html += `<path data-level="${key}" d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 0 1 ${x0.toFixed(1)} ${y0.toFixed(1)}" fill="none" stroke="${RISK[key].arc}" stroke-width="76" />`;
  });
  html += `<g class="needle" transform="rotate(0 ${cx} ${cy})"><line x1="${cx}" y1="${cy}" x2="${cx - 230}" y2="${cy}" stroke="#1a2420" stroke-width="10" stroke-linecap="round" /></g>`;
  html += `<circle cx="${cx}" cy="${cy}" r="11" fill="#1a2420" /><circle cx="${cx}" cy="${cy}" r="5" fill="#fff" />`;
  svg.innerHTML = html;
}
function setNeedle(svg, angle) {
  svg.querySelector(".needle").setAttribute("transform", `rotate(${(180 - angle).toFixed(2)} ${GAUGE.cx} ${GAUGE.cy})`);
  svg.dataset.angle = angle.toFixed(2);
}
/* cubic-bezier 緩動：轉到目標位置略為超過再回來 */
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
const EASE_SWING = bezier(0.34, 1.2, 0.64, 1);
// 指針從最左轉到目標（卡片轉入後開始，1.6 秒）；減少動態時直接定位
function sweepNeedle(svg, target) {
  if (REDUCED) return setNeedle(svg, target);
  setNeedle(svg, 180);
  const t0 = performance.now() + 300;
  const step = (now) => {
    const p = Math.min(1, Math.max(0, (now - t0) / 1600));
    setNeedle(svg, 180 + (target - 180) * EASE_SWING(p));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
// 結果總覽卡的「風險等級：短名稱」與風險說明（固定配色；行走頁沒有風險說明框）
function renderRiskBlock(key) {
  const r = RISK[key];
  $("#gaugeText").textContent = riskLevelText(key);
  const risk = $("#risk");
  if (!risk) return;
  risk.style.setProperty("--risk-bg", r.bg);
  risk.style.setProperty("--risk-border", r.border);
  risk.style.setProperty("--risk-text", r.text);
  risk.style.setProperty("--risk-arc", r.arc);
  risk.dataset.level = key;
  $("#riskTitle").textContent = `目前風險等級：${r.name}`;
  $("#riskDesc").textContent = r.desc;
}

/* =========================================================
 * 資料（sessionStorage，關閉分頁即清除；讀取都包 try/catch）
 * kf.records.<fieldId>：測驗頁完成測驗時新增的紀錄；一體機為 kf.records.kiosk（紀錄裡附上訪客或讀卡資料）
 * kf.subjects.<fieldId>：{ added, done, edits }（與其他頁共用）
 * ========================================================= */
function readJSON(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key));
  } catch (e) {
    return null;
  }
}
// 場域：kf.currentField（不論日期）→ kf.recentFields 第一筆
function currentFieldId() {
  const cur = readJSON("kf.currentField");
  if (cur?.id) return cur.id;
  const recent = readJSON("kf.recentFields");
  return Array.isArray(recent) && recent[0] ? recent[0].id || recent[0] : null;
}
// 所有紀錄：CONFIG.records ＋ sessionStorage 中所有 kf.records.*
function allRecords() {
  const list = [...CONFIG.records];
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key || !key.startsWith("kf.records.")) continue;
      const v = readJSON(key);
      if (Array.isArray(v)) list.push(...v);
    }
  } catch (e) {}
  return list;
}
function maskName(name) {
  const c = [...String(name || "")];
  if (c.length <= 1) return c.join("");
  if (c.length === 2) return c[0] + "*";
  return c[0] + "*".repeat(c.length - 2) + c[c.length - 1];
}
// 受測者：一體機紀錄直接附上訪客或讀卡資料（健保卡姓名遮罩中間字：王*明）；其他為後台匯入或現場新增，並套用 edits
function findSubject(record) {
  if (record?.visitor) return { ...record.visitor, visitor: true };
  if (record?.card) return { ...record.card, name: maskName(record.card.name) };
  const fid = record?.fieldId || currentFieldId();
  const local = fid ? readJSON(`kf.subjects.${fid}`) : null;
  const id = record?.subjectId;
  const base =
    (id ? CONFIG.subjects.find((s) => s.id === id) : CONFIG.subjects[0]) ||
    (Array.isArray(local?.added) ? local.added.find((s) => s.id === id) : null);
  if (!base) return null;
  const e = local?.edits?.[base.id];
  return e ? { ...base, name: e.name ?? base.name, gender: e.gender ?? base.gender, birth: e.birth ?? base.birth } : base;
}
// 訪客（「訪客 V-1118-023」）不加先生／女士
const honorific = (s) => (s.visitor ? s.name : `${s.name} ${s.gender === "女" ? "女士" : "先生"}`);
// 姓名與檢測日期目前隱藏（HTML 已註解）：找不到元素就略過
function renderWho(subject, date) {
  const nameEl = $("#whoName");
  const dateEl = $("#whoDate");
  if (nameEl) nameEl.textContent = honorific(subject);
  if (dateEl) dateEl.textContent = date;
}

/* =========================================================
 * 頁首：返回按鈕、「報告」說明＋QR Code 小卡
 * ========================================================= */
/* 左上角：從測驗完成進入（from=assess）→「‹ 受測名單」回到這個場域的名單；
 * 從一體機測驗進入（from=kiosk）→ 首頁鍵回到一體機歡迎頁；其他 → 首頁鍵回到專家首頁 */
function initHeader(testId, record, params) {
  const fromAssess = params.get("from") === "assess";
  const fromKiosk = params.get("from") === "kiosk";
  $("#homeBtn").hidden = fromAssess;
  $("#backBtn").hidden = !fromAssess;
  document.querySelector(".header").classList.toggle("has-back", fromAssess);
  if (fromKiosk) $("#homeBtn").setAttribute("aria-label", "回到一體機");
  $("#homeBtn").addEventListener("click", () => (location.href = fromKiosk ? "kiosk.html" : "home.html"));
  $("#backBtn").addEventListener("click", () => {
    const fid = record?.fieldId || currentFieldId() || "";
    location.href = `roster.html?test=${testId}&field=${fid}`;
  });
}

/* 報告 QR Code 小卡：只有「點一下」（按下到放開移動不超過 8px）才開啟詳細報告；拖曳時取消這次點擊 */
function initQrLink(qrSrc, detailUrl) {
  $("#reportQr").src = qrSrc;
  const a = $("#qrCard");
  a.href = detailUrl;
  let start = null;
  a.addEventListener("pointerdown", (e) => (start = { x: e.clientX, y: e.clientY }));
  a.addEventListener("click", (e) => {
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) e.preventDefault();
    start = null;
  });
  a.addEventListener("dragstart", (e) => e.preventDefault());
}

/* 頁首右邊「報告」說明：和左邊的首頁鍵（或「‹ 受測名單」）至少保留 24 單位；放不下時改放在 QR 小卡正下方 */
function fitReport() {
  const report = $("#qrCard");
  const left = [$("#homeBtn"), $("#backBtn")].find((b) => b && !b.hidden);
  if (!report || !left) return;
  report.classList.remove("is-below");
  const back = $("#backBtn");
  if (back) {
    back.style.alignSelf = "";
    back.style.marginTop = "";
  }
  const u = Math.min(innerWidth, innerHeight * 0.75) / 1032;
  const header = report.parentElement;
  const r = report.getBoundingClientRect();
  const gap = r.left - left.getBoundingClientRect().right;
  // 頁首內容的右邊界（扣掉右側內距）：整組被擠出去也算放不下
  const rightEdge = header.getBoundingClientRect().right - parseFloat(getComputedStyle(header).paddingRight);
  if (gap < 24 * u - 0.5 || r.right > rightEdge + 0.5) report.classList.add("is-below");
  // 「‹ 受測名單」：和 QR 小卡的垂直中心對齊（「報告」放到小卡下方時，頁首變高，置中會偏低）
  if (back && !back.hidden) {
    const qr = report.querySelector(".qr-card").getBoundingClientRect();
    const top = header.getBoundingClientRect().top + parseFloat(getComputedStyle(header).paddingTop);
    back.style.alignSelf = "flex-start";
    back.style.marginTop = `${qr.top + qr.height / 2 - top - back.offsetHeight / 2}px`;
  }
}

// 姓名放不下時，以 2px 為單位縮小字級，最多縮到原本的 80%（姓名目前隱藏）
function fitName() {
  const el = $("#whoName");
  if (!el) return;
  el.style.fontSize = "";
  let size = parseFloat(getComputedStyle(el).fontSize);
  const min = size * 0.8;
  while (el.scrollWidth > el.clientWidth && size - 2 >= min) {
    size -= 2;
    el.style.fontSize = `${size}px`;
  }
}

/* =========================================================
 * 同齡比較（兩頁結果總覽卡，沿用 SPPB 原本的「50% 優於同齡長者」顯示）
 *   above50 →「50%」＋「優於同齡長者」；below50 →「50%」＋「低於同齡長者」；behind80 →「80%」＋「落後同齡長者」
 * 讀 record.norm；沒有時依風險等級推示範值；值不合法時整段隱藏
 * TODO：之後改成 API 回傳的值（record.norm）
 * ========================================================= */
const PEERS = {
  above50: { value: "50%", label: "優於同齡長者" },
  below50: { value: "50%", label: "低於同齡長者" },
  behind80: { value: "80%", label: "落後同齡長者" },
};
// 示範規則：低、稍低 → above50；中 → below50；高、危險 → behind80
const demoNorm = (riskKey) => ({ vlow: "above50", low: "above50", mid: "below50", high: "behind80", danger: "behind80" })[riskKey] ?? null;
// 紀錄有 norm 就用它（不合法時回傳 null → 隱藏）；沒有時用示範值
function normOf(record, riskKey) {
  if (record && record.norm !== undefined && record.norm !== null) return Object.hasOwn(PEERS, record.norm) ? record.norm : null;
  return demoNorm(riskKey);
}
// box 裡面要有 .big-peer（數字）和 .split-k（文字）
function renderPeer(box, key) {
  const p = Object.hasOwn(PEERS, key ?? "") ? PEERS[key] : null;
  box.hidden = !p;
  if (!p) return;
  box.querySelector(".big-peer").textContent = p.value;
  box.querySelector(".split-k").textContent = p.label;
  box.dataset.norm = key;
}

/* =========================================================
 * 依風險等級推薦（資料、圖片區、優惠券條共用 js/recommend.js）：五個等級都是同一種商品卡
 * 圖片區｜名稱｜說明（最多 3 行）｜優惠券條（有 discount 才顯示）
 * 優惠券條加 data-html2canvas-ignore（之後若加存圖，不要把券存進圖片）
 * ========================================================= */
// seed：產生券號用（紀錄 id）；圖片區、優惠券條、左右滑都在 js/recommend.js
function renderRecommend(card, level, seed = "") {
  const rec = getRecommend(level);
  const head = `<div class="card-head"><h2 class="card-title serif">推薦商品</h2></div>`;
  if (!rec || !rec.name) {
    card.innerHTML = `${head}<p class="rec-empty">目前沒有推薦內容</p>`;
    return;
  }
  card.innerHTML = `${head}${recMediaHTML(rec)}
    <div class="rec-name">${recEsc(rec.name)}</div>
    ${rec.desc ? `<div class="rec-desc">${recEsc(rec.desc)}</div>` : ""}
    ${recTicketHTML(rec, level, seed)}`;
  recInit(card);
}

/* =========================================================
 * 最新消息（只放一則：getLatestNews()，js/news.js）
 * 由上而下：標題｜圖片（有才顯示）｜日期 YYYY.MM.DD｜消息標題｜內容（保留換行，太長時自己捲動）｜底部提示（固定文字，不能點）
 * ========================================================= */
function renderNewsOne(card, news) {
  const head = `<div class="card-head"><h2 class="card-title serif">最新消息</h2></div>`;
  if (!news) {
    card.innerHTML = `${head}<p class="rec-empty">目前沒有最新消息</p>`;
    return;
  }
  const date = /^\d{4}-\d{2}-\d{2}/.test(news.date || "") ? news.date.slice(0, 10).replaceAll("-", ".") : "";
  card.innerHTML = `${head}
    ${news.image ? `<img class="nw-img" src="${esc(news.image)}" alt="" draggable="false" />` : ""}
    ${date ? `<div class="nw-date">${date}</div>` : ""}
    <h3 class="nw-title${news.image ? " has-img" : ""}"><span>${esc(news.title)}</span></h3>
    <div class="nw-body"><div class="nw-scroll" tabindex="0">${esc(news.body ?? "")}</div></div>
    <div class="nw-cta"><i class="ti ti-building-store" aria-hidden="true"></i>詳情請洽門市櫃檯</div>`;
}

/* =========================================================
 * 影片卡（最後一張；資料共用 js/video.js 的 KF_VIDEO）：卡片整張不存進圖片
 * 一開始只顯示封面（YouTube 縮圖＋播放按鈕），在封面上左右滑照常換卡，「點一下」才換成 iframe 播放
 * 播放中的 iframe 會吃掉觸控：下方顯示「滑動影片以外的地方切換卡片」；換到別張卡、或示範鈕切換等級時，移除 iframe（影片停止）
 * 封面圖載入失敗（或 YouTube 回傳 120×90 的預設灰圖）：深綠漸層＋播放按鈕＋「點此播放影片」
 * ========================================================= */
const VIDEO_CARD = { card: null };
function renderVideoCard(card) {
  VIDEO_CARD.card = card;
  const v = typeof KF_VIDEO !== "undefined" ? KF_VIDEO : null;
  const head = `<div class="card-head"><h2 class="card-title serif">推薦影片</h2></div>`;
  if (!v?.id) {
    card.innerHTML = `${head}<p class="rec-empty">目前沒有影片</p>`;
    return;
  }
  const title = videoTitleOf(v);
  card.innerHTML = `${head}
    <div class="vd-media">
      <button class="vd-cover" type="button" aria-label="播放影片${title ? "：" + esc(title) : ""}">
        <img class="vd-img" src="https://img.youtube.com/vi/${encodeURIComponent(v.id)}/hqdefault.jpg" alt="" draggable="false" />
        <span class="vd-play"><i class="ti ti-player-play" aria-hidden="true"></i></span>
        <span class="vd-fallback-text">點此播放影片</span>
      </button>
    </div>
    <p class="vd-tip" hidden>滑動影片以外的地方切換卡片</p>
    ${title ? `<h3 class="vd-title">${esc(title)}</h3>` : ""}
    ${v.desc ? `<div class="vd-desc"><div class="vd-scroll" tabindex="0">${esc(v.desc)}</div></div>` : ""}`;
  const media = card.querySelector(".vd-media");
  const img = card.querySelector(".vd-img");
  const fallback = () => media.classList.add("is-fallback");
  img.addEventListener("error", fallback);
  img.addEventListener("load", () => img.naturalWidth <= 120 && fallback());
  // 只有「點一下」才播放：按下到放開移動超過 8px 算滑動（交給外層換卡）；旁邊露出的卡片點了是轉過來，不播放
  const cover = card.querySelector(".vd-cover");
  let start = null;
  cover.addEventListener("pointerdown", (e) => (start = { x: e.clientX, y: e.clientY }));
  cover.addEventListener("click", (e) => {
    const moved = start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8;
    start = null;
    if (moved || card.classList.contains("is-side") || card.getAttribute("aria-hidden") === "true") return;
    e.stopPropagation();
    playVideoCard();
  });
}
function playVideoCard() {
  const card = VIDEO_CARD.card;
  const media = card?.querySelector(".vd-media");
  if (!media || media.classList.contains("is-playing")) return;
  const f = document.createElement("iframe");
  f.className = "vd-frame";
  f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(KF_VIDEO.id)}?autoplay=1&rel=0&playsinline=1`;
  f.title = videoTitleOf(KF_VIDEO) || "推薦影片";
  f.allow = "autoplay; encrypted-media; picture-in-picture";
  f.allowFullscreen = true;
  f.referrerPolicy = "strict-origin-when-cross-origin";
  media.append(f);
  media.classList.add("is-playing");
  card.querySelector(".vd-tip").hidden = false;
}
// 換回封面（移除 iframe，影片停止）
function stopVideoCard() {
  const card = VIDEO_CARD.card;
  const media = card?.querySelector(".vd-media");
  if (!media || !media.classList.contains("is-playing")) return;
  media.querySelector(".vd-frame")?.remove();
  media.classList.remove("is-playing");
  card.querySelector(".vd-tip").hidden = true;
}

/* =========================================================
 * 照護服務卡（js/referral.js）：getReferral(level) 有資料時插在結果總覽之後（第 2 張），沒有就移除
 * 卡片數量、圓點跟著增減（示範鈕切換時也即時更新）；結果頁只顯示網址文字，不做可點擊的外部連結
 * ========================================================= */
let CAROUSEL = null;
const CARE = { card: null };
function renderCareCard(level) {
  const data = typeof getReferral === "function" ? getReferral(level) : null;
  if (!CARE.card) {
    CARE.card = document.createElement("section");
    CARE.card.className = "card card--care";
    CARE.card.setAttribute("aria-label", "照護服務");
  }
  const card = CARE.card;
  const shown = card.isConnected;
  if (!data) {
    if (shown) {
      card.remove();
      CAROUSEL?.refresh();
    }
    return;
  }
  const key = SEG_ORDER[level - 1];
  const r = RISK[key];
  const pill = level === 5 ? "危險等級建議" : level === 4 ? "高風險建議" : `${r.short}風險建議`;
  const url = referralUrlText(data.url);
  card.style.setProperty("--care-c", r.arc);
  card.innerHTML = `
    <div class="card-head care-head">
      <h2 class="card-title serif">照護服務</h2>
      <span class="care-pill">${esc(pill)}</span>
    </div>
    <div class="care-headline">${esc(data.headline)}</div>
    <div class="care-name">${esc(data.name)}</div>
    <ul class="care-points">${(data.points || []).map((p) => `<li><i class="ti ti-check" aria-hidden="true"></i>${esc(p)}</li>`).join("")}</ul>
    <div class="care-bar">
      <div class="care-l">
        ${data.phone ? `<div class="care-k">諮詢專線</div><div class="care-phone">${esc(data.phone)}</div>` : ""}
        ${data.hours ? `<div class="care-hours">${esc(data.hours)}</div>` : ""}
      </div>
      <div class="care-r">
        <img class="care-qr" src="../img/qrcode-demo.png" alt="" draggable="false" />
        ${url ? `<div class="care-url">${esc(url)}</div>` : ""}
        ${QR_DEMO ? `<div class="care-demo">示意 QR，<br>正式版可掃描前往網站</div>` : ""}
      </div>
    </div>`;
  if (!shown) {
    document.querySelector(".card")?.after(card); // 結果總覽之後
    CAROUSEL?.refresh();
  }
  fitCareUrl();
}
// 網址文字：放不下時從 15 縮到 13
function fitCareUrl() {
  const el = CARE.card?.querySelector(".care-url");
  if (!el) return;
  el.classList.remove("is-small");
  if (el.scrollWidth > el.clientWidth + 1) el.classList.add("is-small");
}

/* =========================================================
 * 輪迴卡片輪播（N 張一圈：行走頁 4 張、SPPB 6 張）
 * pos：連續的位置（每轉一張 ±1，可以一直累加）；目前頁 = pos 除以 3 的餘數
 * d：卡片與目前頁的距離，以 N 張為一圈換算到 −N/2～N/2（只顯示 −1、0、1 三張，其他透明）
 * 位移跟卡片寬度 W 連動：translateX = d × W × 0.81；translateZ = −min(|d|, 1.5) × W × 0.51
 * 三張卡片同一個高度（依舞台計算），內容不足留白、超出不捲動
 *   initCarousel({ onMeasure })  onMeasure：卡片大小改變後呼叫；頁數圓點的 aria-label 用各卡片的 aria-label
 *   卡片增減（照護服務卡）後呼叫 refresh()
 * ========================================================= */
function initCarousel({ onMeasure = () => {} } = {}) {
  const stage = $("#stage");
  let cards = [...document.querySelectorAll(".card")];
  let N = cards.length;
  const C = { pos: 0, W: 740 };
  // 上一次「停住」時的位置（拖曳中不更新），用來判斷誰要「繞到另一側」
  let lastD = cards.map(() => null);
  cards.forEach((c, i) => (c.dataset.i = i)); // 照護服務卡可能在輪播建立前插入
  const mod = (n, m) => ((n % m) + m) % m;
  const indexOf = (pos) => mod(Math.round(pos), N);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const distance = (i, pos) => {
    const d = i - pos;
    return d - N * Math.round(d / N);
  };

  // 依舞台大小計算卡片：高 = 舞台高 × 0.98；寬 = min(舞台寬 × 0.72, 卡片高 × 0.79)
  function measure() {
    const ch = stage.clientHeight * 0.98;
    const cw = Math.min(stage.clientWidth * 0.72, ch * 0.79);
    C.W = cw;
    stage.style.setProperty("--card-w", `${cw}px`);
    stage.style.setProperty("--card-h", `${ch}px`);
    onMeasure();
  }

  function placeCard(card, d) {
    const ad = Math.abs(d);
    card.style.transform = `translateX(${d * C.W * 0.81}px) translateZ(${-Math.min(ad, 1.5) * C.W * 0.51}px) rotateY(${-clamp(d, -1.4, 1.4) * 42}deg)`;
    card.style.opacity = ad > 1.45 ? 0 : 1 - Math.min(ad, 1) * 0.3;
    card.style.filter = `brightness(${1 - Math.min(ad, 1) * 0.06})`;
    card.style.zIndex = String(100 - Math.round(ad * 10)); // 越靠近中間越高
    card.style.pointerEvents = ad > 1.45 ? "none" : "auto";
    card.classList.toggle("is-side", Math.round(ad) === 1);
  }

  // settle：換頁定位（套用過場）；拖曳中只即時跟手
  function layout(pos, settle = false) {
    const current = indexOf(pos);
    cards.forEach((card, i) => {
      card.setAttribute("aria-hidden", i !== current);
      if (REDUCED) {
        // 減少動態：不做 3D 旋轉，只顯示目前這一張
        card.style.transform = "none";
        card.style.filter = "none";
        card.style.opacity = i === current ? 1 : 0;
        card.style.zIndex = i === current ? 2 : 1;
        card.style.pointerEvents = i === current ? "auto" : "none";
        return;
      }
      const d = distance(i, pos);
      // 從一側繞到另一側的卡片：不要橫越中央，先直接放到新位置並透明，再淡入
      if (settle && lastD[i] !== null && Math.abs(d - lastD[i]) > 1.5) {
        card.style.transition = "none";
        placeCard(card, d);
        card.style.opacity = 0;
        void card.offsetWidth;
        card.style.transition = "opacity 0.5s 0.2s";
        card.style.opacity = 1 - Math.min(Math.abs(d), 1) * 0.3;
        clearTimeout(card._t);
        card._t = setTimeout(() => (card.style.transition = ""), 750);
      } else {
        placeCard(card, d);
      }
      if (settle || lastD[i] === null) lastD[i] = d;
    });
  }

  function renderDots() {
    const i = indexOf(C.pos);
    document.querySelectorAll(".dot").forEach((t, k) => {
      t.classList.toggle("is-active", k === i);
      t.setAttribute("aria-selected", k === i);
    });
  }

  /* 閒置提醒：6 秒沒有操作（拖曳、點擊、按鍵）時播放一次，之後每 8 秒重複；一操作就停止並重新計時
   * 卡片：一起往左偏移卡片寬度的 6% 再彈回；提示膠囊：放大到 1.06 倍再恢復，外圍金色光暈往外擴散一次
   * 減少動態：只播放光暈 */
  const IDLE = { first: 6000, repeat: 8000, timer: null, anims: [] };
  function playNudge() {
    stopNudge();
    const hint = $("#hint");
    const base = getComputedStyle(hint).getPropertyValue("--hint-shadow").trim();
    IDLE.anims.push(
      hint.animate(
        [{ boxShadow: `${base}, 0 0 0 0 rgba(217, 183, 122, 0.6)` }, { boxShadow: `${base}, 0 0 0 28px rgba(217, 183, 122, 0)` }],
        { duration: 1100, easing: "ease-out" },
      ),
    );
    if (!REDUCED) {
      IDLE.anims.push(hint.animate([{ scale: 1 }, { scale: 1.06, offset: 0.4 }, { scale: 1 }], { duration: 900, easing: "ease-in-out" }));
      const dx = -C.W * 0.06;
      cards.forEach((card) =>
        IDLE.anims.push(
          card.animate(
            [{ translate: "0 0" }, { translate: `${dx}px 0`, offset: 0.35, easing: "cubic-bezier(0.34, 1.4, 0.64, 1)" }, { translate: "0 0" }],
            { duration: 900, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
          ),
        ),
      );
    }
    IDLE.timer = setTimeout(playNudge, IDLE.repeat);
  }
  function stopNudge() {
    IDLE.anims.forEach((a) => a.cancel());
    IDLE.anims = [];
  }
  function resetIdle() {
    stopNudge();
    clearTimeout(IDLE.timer);
    IDLE.timer = setTimeout(playNudge, IDLE.first);
  }

  // step：往右轉一張 +1（顯示右邊那張）、往左轉一張 −1、0 = 彈回
  function turn(step) {
    const before = indexOf(C.pos);
    C.pos = Math.round(C.pos) + step;
    layout(C.pos, true);
    renderDots();
    if (indexOf(C.pos) !== before) stopVideoCard(); // 換到別張卡：影片停止
  }
  // 頁數圓點：走最短的方向
  function goToPage(k) {
    const half = Math.floor(N / 2);
    turn(mod(k - indexOf(C.pos) + half, N) - half);
  }

  // 頁數圓點：依目前的卡片產生（aria-label 用卡片的 aria-label）
  function buildDots() {
    $("#dots").innerHTML = cards
      .map((c, k) => `<button class="dot" type="button" role="tab" data-i="${k}" aria-label="${esc(c.getAttribute("aria-label") || "")}"></button>`)
      .join("");
  }
  buildDots();
  $("#dots").addEventListener("click", (e) => {
    const b = e.target.closest(".dot");
    if (b) goToPage(Number(b.dataset.i));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") turn(1);
    if (e.key === "ArrowLeft") turn(-1);
  });

  // 左右拖曳：跟著手指即時轉動；放開時超過卡片寬度 16% 就往該方向轉一張，否則彈回
  let drag = null;
  let suppressClick = false;
  stage.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, dx: 0, moved: false, id: e.pointerId };
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 8) return;
    if (!drag.moved) {
      drag.moved = true;
      stage.setPointerCapture(e.pointerId);
      stage.classList.add("is-dragging");
      cards.forEach((c) => (c.style.transition = "")); // 拖曳中不套用任何過場
    }
    drag.dx = dx;
    if (!REDUCED) layout(C.pos - dx / (C.W * 0.81));
  });
  const end = () => {
    if (!drag) return;
    const { dx, moved } = drag;
    drag = null;
    stage.classList.remove("is-dragging");
    if (!moved) return;
    suppressClick = true; // 拖曳後的放開不算點擊
    setTimeout(() => (suppressClick = false), 0);
    const threshold = C.W * 0.16;
    if (dx < -threshold) turn(1);
    else if (dx > threshold) turn(-1);
    else turn(0);
  };
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);

  // 點兩側露出的卡片：轉到那一張
  stage.addEventListener("click", (e) => {
    if (suppressClick) return;
    const card = e.target.closest(".card");
    if (!card) return;
    const d = Math.round(distance(Number(card.dataset.i), C.pos));
    if (d) turn(d);
  });

  // 視窗大小改變（包含 iPad 旋轉）：即時重新計算卡片大小和位置（不播過場）
  let first = true;
  new ResizeObserver(() => {
    if (first) return (first = false); // 第一次由下面的進場處理
    measure();
    stage.classList.add("no-anim");
    layout(C.pos);
    fitName();
    fitReport();
    fitCareUrl();
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove("no-anim")));
  }).observe(stage);

  // 進場：卡片從遠處（translateZ、透明）轉入定位（0.8s）
  measure();
  if (REDUCED) {
    layout(C.pos);
    renderDots();
  } else {
    cards.forEach((c) => {
      c.style.transition = "none";
      c.style.transform = `translateZ(${-C.W * 0.81}px)`;
      c.style.opacity = 0;
    });
    void document.body.offsetWidth;
    requestAnimationFrame(() => {
      cards.forEach((c) => (c.style.transition = "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.8s, filter 0.8s"));
      layout(C.pos);
      renderDots();
      setTimeout(() => cards.forEach((c) => (c.style.transition = "")), 850);
    });
  }

  // 閒置提醒：任何拖曳、點擊、按鍵都算操作（capture 階段先處理）
  document.addEventListener("pointerdown", resetIdle, true);
  document.addEventListener("keydown", resetIdle, true);
  resetIdle();

  // 卡片增減後（例如照護服務卡）：重新編號、重建圓點；目前所在的卡被移除時回到第 1 張
  function refresh() {
    const current = cards[indexOf(C.pos)];
    cards = [...document.querySelectorAll(".card")];
    N = cards.length;
    cards.forEach((c, i) => (c.dataset.i = i));
    lastD = cards.map(() => null);
    const k = cards.indexOf(current);
    C.pos = k < 0 ? 0 : k;
    buildDots();
    stage.classList.add("no-anim");
    layout(C.pos);
    renderDots();
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove("no-anim")));
    if (k < 0) stopVideoCard();
  }
  CAROUSEL = { refresh };
  return { measure, turn, goToPage, refresh, get index() { return indexOf(C.pos); } };
}

/* 頁面共用的啟動收尾：顯示頁面、量頁首、字型載入後再量一次 */
function showPage(afterFonts = () => {}) {
  $("#page").hidden = false;
  fitName();
  fitReport();
  document.fonts?.ready.then(() => {
    fitName();
    fitReport();
    afterFonts();
  });
}
