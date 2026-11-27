/* =========================================================
 * 推薦商品（共用）：鑑測結果頁（result.html、result-gait.html 的推薦商品卡）、詳細報告（detail-*.html 的推薦商品區塊）
 * 樣式在 css/recommend.css（尺寸用 --ru，各頁設定：結果頁＝卡片單位 --cu、詳細頁依螢幕寬度）
 *
 *   getRecommend(level)              level 1–5（低…危險）對應的商品；先讀 localStorage「kf.admin.recommends」
 *   recMediaHTML(rec)                商品圖片區（有圖可左右滑；沒有圖顯示「商品圖片」占位；左上角「依您的結果推薦」）
 *   recTicketHTML(rec, level, seed)  優惠券條（有 discount 才有；data-html2canvas-ignore，不存進圖片）
 *   recInit(root)                    綁定圖片左右滑（只換圖，不觸發外層的滑動）
 * 注意：本檔不宣告 $、esc 等通用名稱（詳細頁與結果頁各自有自己的版本）
 * ========================================================= */

/* =========================================================
 * 依風險等級推薦：level 1–5 對應 低、稍低、中、高、危險
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

const recEsc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

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
// 商品圖片區：最多 3 張
function recMediaHTML(rec) {
  const images = (Array.isArray(rec.images) ? rec.images.filter(Boolean) : []).slice(0, 3);
  const slides = images.length
    ? images.map((src) => `<div class="rec-slide"><img src="${recEsc(src)}" alt="${recEsc(rec.name)}" draggable="false" /></div>`).join("")
    : `<div class="rec-slide rec-ph"><i class="ti ti-photo" aria-hidden="true"></i><span>商品圖片</span></div>`; // 還沒有商品圖：統一的占位
  return `<div class="rec-media">
      <div class="rec-track">${slides}</div>
      <span class="rec-tag">依您的結果推薦</span>
      ${images.length > 1 ? `<div class="rec-dots" aria-hidden="true">${images.map((_, i) => `<span class="${i ? "" : "is-on"}"></span>`).join("")}</div>` : ""}
    </div>`;
}
// 優惠券條：「本商品 N 折」＋券號（＋期限）＋QR；沒有 discount（或不合法）時回傳空字串
function recTicketHTML(rec, level, seed) {
  const discount = discountOf(rec);
  if (!discount) return "";
  const code = couponCode(seed, level);
  return `<div class="ticket" data-html2canvas-ignore>
      <div class="ticket-l">
        <div class="ticket-k">店內優惠</div>
        <div class="ticket-title">本商品 ${discount} 折</div>
        <div class="ticket-code">券號 ${recEsc(code)}${rec.expire ? `・至 ${recEsc(rec.expire)}` : ""}</div>
      </div>
      <div class="ticket-r">
        <img class="qr-mini" src="${COUPON_QR_SRC}" alt="優惠券 ${recEsc(code)} 的 QR Code" draggable="false" />
        <span class="ticket-use">憑此畫面至櫃檯</span>
      </div>
    </div>`;
}
function recInit(root) {
  const box = root.querySelector(".rec-media");
  const count = box ? box.querySelectorAll(".rec-slide").length : 0;
  if (count > 1) initMediaSlider(box, count);
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
