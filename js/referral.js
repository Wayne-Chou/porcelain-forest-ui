/* =========================================================
 * 照護服務轉介（共用資料）：鑑測結果頁（危險等級時多一張「照護服務」卡）、詳細報告（行動建議下方的深綠橫幅）
 *   levels：要顯示的風險等級（1–5 = 低…危險），目前只有 5（危險）
 *   headline 可用 \n 換行；url 只在詳細頁做成按鈕，結果頁只顯示網址文字（一體機、專家 iPad 都不可以跳離檢測流程）
 * getReferral(level)：先讀 localStorage「kf.admin.referral」（之後的後台寫入；這次不做寫入），沒有就用預設值；
 *   level 不在 levels 裡時回傳 null
 * ========================================================= */
const KF_REFERRAL = {
  levels: [5],
  name: "全台照護服務平台",
  headline: "需要有人\n在旁照顧嗎？",
  points: ["居家照護、醫院看護與陪伴", "照服員媒合，可快速安排", "線上照護日誌，家人隨時掌握"],
  url: "https://nurseaide.simpler.com.tw/",
  phone: "03-561-5265",
  hours: "週一至週五 09:00–18:00",
};
// 結果頁的 QR：目前是示範圖片（img/qrcode-demo.png），true 時 QR 下方加「示意 QR」小字
// TODO：正式版要產生內容是 url 的 QR（這次不加 QR 套件），完成後改成 false
const QR_DEMO = true;

function getReferral(level) {
  let data = null;
  try {
    const v = JSON.parse(localStorage.getItem("kf.admin.referral"));
    if (v && typeof v === "object") data = v;
  } catch (e) {}
  const r = data ?? KF_REFERRAL;
  return Array.isArray(r.levels) && r.levels.map(Number).includes(Number(level)) && r.name ? r : null;
}
// 顯示用的網址文字：去掉 https:// 和結尾的 /
const referralUrlText = (url) => String(url || "").replace(/^https?:\/\//i, "").replace(/\/+$/, "");
