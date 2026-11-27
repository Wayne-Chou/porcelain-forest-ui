/* =========================================================
 * 推薦商品（共用）：鑑測結果頁（result.html、result-gait.html 的推薦商品卡）、詳細報告（detail-*.html 的推薦商品區塊）
 * 樣式在 css/recommend.css（尺寸用 --ru，各頁設定：結果頁＝卡片單位 --cu、詳細頁依螢幕寬度）
 *
 *   getRecommend(level)              level 1–5（低…危險）對應的商品；先讀 localStorage「kf.admin.recommends」
 *   recName(rec)／recDesc(rec)       名稱、說明（多語物件，依目前語系；js/pick-lang.js 的 pickLang）
 *   recMediaHTML(rec)                商品圖片區（有圖可左右滑；沒有圖或載入失敗顯示「商品圖片」占位；左上角「依您的結果推薦」）
 *   recTicketHTML(rec, level, seed)  優惠券條（有 discount 才有；data-html2canvas-ignore，不存進圖片）
 *   recInit(root)                    綁定圖片載入失敗的占位、圖片左右滑（只換圖，不觸發外層的滑動）
 *   recText(key, params)             元件內的固定文字（三語，見 REC_TEXT）
 * 需要先載入 js/pick-lang.js；本檔不宣告 $、esc 等通用名稱（詳細頁與結果頁各自有自己的版本）
 * ========================================================= */

/* =========================================================
 * 依風險等級推薦：level 1–5 對應 低、稍低、中、高、危險
 * 欄位對應之後的後台：images（0～3 張）、name（≤16 字）、desc（≤60 字）、discount（選填，1～99 的整數：9 = 9 折、85 = 85 折）、expire（選填）
 *   name、desc：多語物件 { "zh-TW", en, ja }（key 同 js/app-i18n.js；缺的語系退回 zh-TW）；也接受字串（舊資料、後台資料）
 *   images：相對於網站根目錄的路徑（例如 img/products/x.jpg），或完整網址；檔案不存在時自動改顯示「商品圖片」占位
 * 讀取用 getRecommend(level)：先讀 localStorage「kf.admin.recommends」（之後的後台寫入；這次不做寫入），沒有就用這裡的預設值
 * TODO：優惠券目前只做外觀，券號、QR 都是示範，沒有核銷、沒有防重複
 * ========================================================= */
const RECOMMENDS = [
  { level: 1,
    name: { "zh-TW": "彈力帶訓練組", en: "Resistance Band Set" },
    desc: { "zh-TW": "三種阻力由輕到重，坐著也能做腿部運動，輕巧好收納，在家隨時練。",
            en: "Three resistance levels from light to heavy. Do leg exercises even while seated. Light and easy to store, so you can train at home anytime." },
    images: ["img/products/resistance-band.jpg"], discount: 85, expire: "2026/12/31" },
  { level: 2,
    name: { "zh-TW": "平衡訓練軟墊", en: "Balance Training Pad" },
    desc: { "zh-TW": "軟墊表面可以練習腳踝穩定，底部防滑不易移動，搭配椅背扶著，在家就能練習。",
            en: "The soft surface helps you practice ankle stability. The non-slip base stays in place. Hold a chair back for support and practice at home." },
    images: ["img/products/balance-pad.jpg"], discount: 9, expire: "2026/12/31" },
  { level: 3,
    name: { "zh-TW": "浴室止滑地墊", en: "Non-slip Bath Mat" },
    desc: { "zh-TW": "吸盤底面牢牢貼合地板，表面防滑紋路，淋浴時腳步更穩，可整片沖洗晾乾。",
            en: "Suction cups hold it firmly to the floor, and the textured surface helps you step steadily in the shower. Rinse and air-dry with ease." },
    images: ["img/products/bath-mat.jpg"], discount: 9, expire: "2026/12/31" },
  { level: 4,
    name: { "zh-TW": "床邊起身扶手", en: "Bedside Assist Rail" },
    desc: { "zh-TW": "壓在床墊下固定不用打牆，起身坐下有地方扶。選購前建議請專業人員評估。",
            en: "Secures under the mattress with no drilling. Gives you something to hold when getting up or sitting down. Please consult a professional before buying." },
    images: ["img/products/bed-rail.jpg"], discount: 9, expire: "" },
  { level: 5,
    name: { "zh-TW": "跌倒偵測緊急呼叫器", en: "Fall Detection Alert Device" },
    desc: { "zh-TW": "隨身配戴，偵測到跌倒自動通知家人，也可一鍵求救。建議盡快請專業人員評估。",
            en: "A wearable device that automatically alerts your family when a fall is detected, with one-touch emergency calling. Please consult a professional soon." },
    images: ["img/products/fall-alert.jpg"], discount: 85, expire: "" },
];
// 優惠券 QR：和結果總覽的報告 QR 同一種做法（目前是固定的示範圖片）
// TODO：之後依券號產生（或由後台提供）QR 圖片
const COUPON_QR_SRC = "../img/qrcode-demo.png";

// 元件內的固定文字：[繁中, 日, 英]（語系由 js/pick-lang.js 的 currentLang() 決定）
const REC_TEXT = {
  tag: ["依您的結果推薦", "結果に基づくおすすめ", "Picked for your result"],
  ph: ["商品圖片", "商品画像", "Product image"],
  offer: ["店內優惠", "店内特典", "In-store offer"],
  code: ["券號 {code}", "クーポン番号 {code}", "Code {code}"],
  expire: ["至 {date}", "有効期限 {date}", "Valid until {date}"],
  sep: ["・", "・", " · "],
  use: ["憑此畫面至櫃檯", "この画面をレジでご提示ください", "Show this screen at the counter"],
  qrAlt: ["優惠券 {code} 的 QR Code", "クーポン {code} の QR コード", "QR code for coupon {code}"],
};
function recText(key, params) {
  const row = REC_TEXT[key];
  let v = row[Math.max(0, KF_LANGS.indexOf(currentLang()))] ?? row[0];
  if (params) v = v.replace(/\{(\w+)\}/g, (m, k) => params[k] ?? m);
  return v;
}
/* 折扣文字：繁中「本商品 n 折」；英、日換算成「p% off」：n 一位數 p = 100 − n×10（9 → 10）、兩位數 p = 100 − n（85 → 15） */
function discountText(n) {
  const p = n < 10 ? 100 - n * 10 : 100 - n;
  const lang = currentLang();
  if (lang === "en") return `${p}% off this item`;
  if (lang === "ja") return `この商品 ${p}%オフ`;
  return `本商品 ${n} 折`;
}
const recName = (rec) => pickLang(rec?.name);
const recDesc = (rec) => pickLang(rec?.desc);

/* 圖片路徑：相對路徑以網站根目錄為準（本檔在 js/，所以根目錄 = 本檔的上一層）；完整網址、/ 開頭、./ ../ 開頭照原樣 */
const REC_ROOT = new URL("../", document.currentScript?.src || location.href);
function recImgSrc(src) {
  const v = String(src || "");
  if (/^([a-z][a-z0-9+.-]*:|\/|\.\.?\/)/i.test(v)) return v;
  return new URL(v, REC_ROOT).href;
}
const REC_PH_HTML = () => `<i class="ti ti-photo" aria-hidden="true"></i><span>${recText("ph")}</span>`;

const recEsc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function getRecommend(level) {
  let list = null;
  try {
    const v = JSON.parse(localStorage.getItem("kf.admin.recommends"));
    if (Array.isArray(v)) list = v;
  } catch (e) {}
  return (list ?? RECOMMENDS).find((r) => r && Number(r.level) === level && recName(r)) || null;
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
// 商品圖片區：最多 3 張；圖片載入失敗時由 recInit 換成占位（不出現破圖）
function recMediaHTML(rec) {
  const images = (Array.isArray(rec.images) ? rec.images.filter(Boolean) : []).slice(0, 3);
  const name = recName(rec);
  const slides = images.length
    ? images.map((src) => `<div class="rec-slide"><img src="${recEsc(recImgSrc(src))}" alt="${recEsc(name)}" draggable="false" /></div>`).join("")
    : `<div class="rec-slide rec-ph">${REC_PH_HTML()}</div>`; // 還沒有商品圖：統一的占位
  return `<div class="rec-media">
      <div class="rec-track">${slides}</div>
      <span class="rec-tag">${recText("tag")}</span>
      ${images.length > 1 ? `<div class="rec-dots" aria-hidden="true">${images.map((_, i) => `<span class="${i ? "" : "is-on"}"></span>`).join("")}</div>` : ""}
    </div>`;
}
// 圖片載入失敗（檔案不存在等）：那一張換成「商品圖片」占位
function recImgFallback(img) {
  const slide = img.closest(".rec-slide");
  if (!slide || slide.classList.contains("rec-ph")) return;
  slide.classList.add("rec-ph", "is-missing");
  slide.innerHTML = REC_PH_HTML();
}
// 優惠券條：「本商品 N 折」（英、日換算成 p% off）＋券號（＋期限）＋QR；沒有 discount（或不合法）時回傳空字串
function recTicketHTML(rec, level, seed) {
  const discount = discountOf(rec);
  if (!discount) return "";
  const code = couponCode(seed, level);
  const codeLine = recText("code", { code: recEsc(code) }) + (rec.expire ? recText("sep") + recText("expire", { date: recEsc(rec.expire) }) : "");
  return `<div class="ticket" data-html2canvas-ignore>
      <div class="ticket-l">
        <div class="ticket-k">${recText("offer")}</div>
        <div class="ticket-title">${discountText(discount)}</div>
        <div class="ticket-code">${codeLine}</div>
      </div>
      <div class="ticket-r">
        <img class="qr-mini" src="${COUPON_QR_SRC}" alt="${recEsc(recText("qrAlt", { code }))}" draggable="false" />
        <span class="ticket-use">${recText("use")}</span>
      </div>
    </div>`;
}
function recInit(root) {
  root.querySelectorAll(".rec-slide img").forEach((img) => {
    if (img.complete && !img.naturalWidth) recImgFallback(img); // 已經失敗（快取）
    else img.addEventListener("error", () => recImgFallback(img), { once: true });
  });
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
