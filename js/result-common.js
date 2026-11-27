/* =========================================================
 * 鑑測結果頁共用程式（result.html SPPB、result-gait.html 行走測驗）；樣式在 css/result.css
 * 內容：共用小工具、資料讀取（紀錄、受測者，含一體機）、風險等級與五色半圓圖、頁首（返回、「報告」QR）、
 *      三張卡片的輪迴輪播（拖曳、圓點、閒置提醒、進場）、同齡常模、依風險推薦（商品＋優惠券）、最新消息
 * 各頁在載入本檔後定義 CONFIG（subjects、records），再呼叫這裡的函式
 * 注意：<script> 內字串裡的結束標籤一律寫成 <\/body>、<\/html>、<\/script>
 * ========================================================= */

/* =========================================================
 * 依風險等級推薦（result-gait.html 第 2 張卡）：level 1–5 對應 低、稍低、中、高、危險
 * 欄位對應之後的後台：images（0～3 張）、name（≤16 字）、desc（≤60 字）、discount（選填，1～99 的整數：9 = 9 折、85 = 85 折）、expire（選填）
 * 讀取用 getRecommend(level)：先讀 localStorage「kf.admin.recommends」（之後的後台寫入；這次不做寫入），沒有就用這裡的預設值
 * TODO：優惠券目前只做外觀，券號、QR 都是示範，沒有核銷、沒有防重複
 * ========================================================= */
const RECOMMENDS = [
  { level: 1, name: "彈力帶訓練組", desc: "三種阻力由輕到重，坐著也能做腿部運動，輕巧好收納，在家隨時練。", images: [], discount: 85, expire: "2026/12/31" },
  { level: 2, name: "平衡訓練軟墊", desc: "軟墊表面可以練習腳踝穩定，底部防滑不易移動，搭配椅背扶著，在家就能練習。", images: [], discount: 9, expire: "2026/12/31" },
  { level: 3, name: "感應式小夜燈", desc: "人靠近自動亮燈，暖黃光不刺眼，磁吸黏貼免鑽孔，床邊、走道都適合。", images: [], discount: 9, expire: "2026/12/31" },
  { level: 4, name: "床邊起身扶手", desc: "壓在床墊下固定不用打牆，起身坐下有地方扶。選購前建議請專業人員評估。", images: [], discount: 9, expire: "" },
  { level: 5, name: "跌倒偵測緊急呼叫器", desc: "隨身配戴，偵測到跌倒自動通知家人，也可一鍵求救。建議盡快請專業人員評估。", images: [], discount: 85, expire: "" },
];
// 優惠券 QR：和結果總覽的報告 QR 同一種做法（目前是固定的示範圖片）
// TODO：之後依券號產生（或由後台提供）QR 圖片
const COUPON_QR_SRC = "../img/qrcode-demo.png";

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

/* =========================================================
 * 跌倒風險等級（固定的文字和顏色，不可更改）
 * name：完整名稱（風險說明、詳細頁）；short：結果總覽卡「風險等級：X」那一行用的短名稱
 * SEG_ORDER：半圓圖由左到右（低 → 危險）；行走測驗的 riskLevel 0–4 也是這個順序
 * ========================================================= */
const RISK = {
  vlow: { name: "低風險", short: "低", arc: "#4ffa00", bg: "#f0fdf4", border: "#86efac", text: "#166534", desc: "跌倒風險低，體能表現優異" },
  low: { name: "稍低風險", short: "稍低", arc: "#8cff00", bg: "#f7fee7", border: "#bef264", text: "#3f6212", desc: "跌倒風險稍低，狀況良好" },
  mid: { name: "中度風險", short: "中", arc: "#ffd039", bg: "#fefce8", border: "#fde047", text: "#854d0e", desc: "跌倒風險中等，持續關注為佳" },
  high: { name: "高風險", short: "高", arc: "#ffa203", bg: "#fff7ed", border: "#fdba74", text: "#c2410c", desc: "跌倒風險較高，建議積極改善" },
  danger: { name: "危險", short: "危險", arc: "#ff5757", bg: "#fef2f2", border: "#fca5a5", text: "#b91c1c", desc: "目前跌倒風險偏高，請特別注意" },
};
const SEG_ORDER = ["vlow", "low", "mid", "high", "danger"];

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
  $("#gaugeText").textContent = `風險等級：${r.short}`;
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
 * 依風險等級推薦（RECOMMENDS 在本檔最上方）：五個等級都是同一種商品卡
 * 圖片區｜名稱｜說明（最多 3 行）｜優惠券條（有 discount 才顯示）
 * 優惠券條加 data-html2canvas-ignore（之後若加存圖，不要把券存進圖片）
 * ========================================================= */
function getRecommend(level) {
  let list = null;
  try {
    const v = JSON.parse(localStorage.getItem("kf.admin.recommends"));
    if (Array.isArray(v)) list = v;
  } catch (e) {}
  return (list ?? RECOMMENDS).find((r) => r && Number(r.level) === level) || null;
}
/* 券號（8 碼，例如 A7K2-0915）：由紀錄 id 和等級算出，同一筆紀錄每次打開都一樣
 * TODO：之後由系統發券產生 */
function couponCode(seed, level) {
  let h = 2166136261;
  for (const c of `${seed}|${level}`) h = Math.imul(h ^ c.codePointAt(0), 16777619) >>> 0;
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 去掉容易看錯的 I、O、0、1
  let head = "";
  for (let i = 0, x = h; i < 4; i++, x = Math.floor(x / 32)) head += A[x % 32];
  const tail = String(Math.imul(h, 2654435761) >>> 0).padStart(4, "0").slice(-4);
  return `${head}-${tail}`;
}
// discount：1～99 的整數才顯示優惠券條；不合法時每個值只警告一次
const warnedDiscount = new Set();
function discountOf(rec) {
  const d = rec.discount;
  if (d === undefined || d === null || d === "") return null;
  if (Number.isInteger(Number(d)) && Number(d) >= 1 && Number(d) <= 99 && String(d).trim() !== "") return Number(d);
  const key = `${rec.level}:${d}`;
  if (!warnedDiscount.has(key)) {
    warnedDiscount.add(key);
    console.warn(`[推薦商品] discount 不合法（需為 1～99 的整數），不顯示優惠券：level ${rec.level}、discount ${JSON.stringify(d)}`);
  }
  return null;
}
// seed：產生券號用（紀錄 id）
function renderRecommend(card, level, seed = "") {
  const rec = getRecommend(level);
  const head = `<div class="card-head"><h2 class="card-title serif">推薦商品</h2></div>`;
  if (!rec || !rec.name) {
    card.innerHTML = `${head}<p class="rec-empty">目前沒有推薦內容</p>`;
    return;
  }
  const images = (Array.isArray(rec.images) ? rec.images.filter(Boolean) : []).slice(0, 3);
  const slides = images.length
    ? images.map((src) => `<div class="rec-slide"><img src="${esc(src)}" alt="${esc(rec.name)}" draggable="false" /></div>`).join("")
    : `<div class="rec-slide rec-ph"><i class="ti ti-photo" aria-hidden="true"></i><span>商品圖片</span></div>`; // 還沒有商品圖：統一的占位
  const discount = discountOf(rec);
  const code = couponCode(seed, level);
  card.innerHTML = `${head}
    <div class="rec-media">
      <div class="rec-track">${slides}</div>
      <span class="rec-tag">依您的結果推薦</span>
      ${images.length > 1 ? `<div class="rec-dots" aria-hidden="true">${images.map((_, i) => `<span class="${i ? "" : "is-on"}"></span>`).join("")}</div>` : ""}
    </div>
    <div class="rec-name">${esc(rec.name)}</div>
    ${rec.desc ? `<div class="rec-desc">${esc(rec.desc)}</div>` : ""}
    ${
      discount
        ? `<div class="ticket" data-html2canvas-ignore>
        <div class="ticket-l">
          <div class="ticket-k">店內優惠</div>
          <div class="ticket-title">本商品 ${discount} 折</div>
          <div class="ticket-code">券號 ${esc(code)}${rec.expire ? `・至 ${esc(rec.expire)}` : ""}</div>
        </div>
        <div class="ticket-r">
          <img class="qr-mini" src="${COUPON_QR_SRC}" alt="優惠券 ${esc(code)} 的 QR Code" draggable="false" />
          <span class="ticket-use">憑此畫面至櫃檯</span>
        </div>
      </div>`
        : ""
    }`;
  if (images.length > 1) initMediaSlider(card.querySelector(".rec-media"), images.length);
}

/* 商品大圖左右滑：只換圖，不觸發外層卡片的切換（pointerdown 不往上傳）；放開時超過寬度 18% 換一張 */
function initMediaSlider(box, count) {
  const track = box.querySelector(".rec-track");
  const dots = [...box.querySelectorAll(".rec-dots span")];
  let index = 0;
  let drag = null;
  const go = (i) => {
    index = Math.max(0, Math.min(count - 1, i));
    track.style.transform = `translateX(${-index * 100}%)`;
    dots.forEach((d, k) => d.classList.toggle("is-on", k === index));
    box.dataset.index = index;
  };
  box.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    drag = { x: e.clientX, dx: 0, id: e.pointerId };
    box.setPointerCapture(e.pointerId);
    track.classList.add("is-dragging");
  });
  box.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    e.stopPropagation();
    drag.dx = e.clientX - drag.x;
    track.style.transform = `translateX(calc(${-index * 100}% + ${drag.dx}px))`;
  });
  const end = (e) => {
    if (!drag) return;
    e.stopPropagation();
    const { dx } = drag;
    drag = null;
    track.classList.remove("is-dragging");
    const w = box.clientWidth * 0.18;
    go(dx < -w ? index + 1 : dx > w ? index - 1 : index);
  };
  box.addEventListener("pointerup", end);
  box.addEventListener("pointercancel", end);
  box.addEventListener("click", (e) => e.stopPropagation()); // 點圖片區不算點卡片
  go(0);
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
 * 輪迴卡片輪播（三張一圈）
 * pos：連續的位置（每轉一張 ±1，可以一直累加）；目前頁 = pos 除以 3 的餘數
 * d：卡片與目前頁的距離，以三張為一圈換算到 −1.5～1.5（停住時是 −1、0、1）
 * 位移跟卡片寬度 W 連動：translateX = d × W × 0.81；translateZ = −min(|d|, 1.5) × W × 0.51
 * 三張卡片同一個高度（依舞台計算），內容不足留白、超出不捲動
 *   initCarousel({ pages: ["總覽", …], onMeasure })  pages：頁數圓點的 aria-label；onMeasure：卡片大小改變後呼叫
 * ========================================================= */
function initCarousel({ pages, onMeasure = () => {} }) {
  const stage = $("#stage");
  const cards = [...document.querySelectorAll(".card")];
  const N = cards.length;
  const C = { pos: 0, W: 740 };
  const lastD = cards.map(() => null); // 上一次「停住」時的位置（拖曳中不更新），用來判斷誰要「繞到另一側」
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
    C.pos = Math.round(C.pos) + step;
    layout(C.pos, true);
    renderDots();
  }
  // 頁數圓點：走最短的方向（三張一圈，最多轉一張）
  function goToPage(k) {
    turn(mod(k - indexOf(C.pos) + 1, N) - 1); // −1、0、1
  }

  $("#dots").innerHTML = pages
    .map((name, k) => `<button class="dot" type="button" role="tab" data-i="${k}" aria-label="${esc(name)}"></button>`)
    .join("");
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

  return { measure, turn, goToPage, get index() { return indexOf(C.pos); } };
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
