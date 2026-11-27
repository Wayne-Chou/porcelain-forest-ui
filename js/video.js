/* =========================================================
 * 推薦影片（共用資料）：詳細報告（detail-gait.html、detail-sppb.html 的推薦影片區塊）、鑑測結果頁（result.html、result-gait.html 的影片卡）
 *   id：YouTube 影片 id；沒有 id 時兩邊都不顯示影片
 *   title：影片標題，可以是字串，或依語系的 { "zh-TW", ja, en }；空字串時不顯示標題那一行
 *   desc：說明文字（結果頁影片卡用）；空字串時不顯示
 * ========================================================= */
const KF_VIDEO = {
  id: "ugWW7nimKUI",
  title: { "zh-TW": "", ja: "", en: "" },
  desc: "",
};

// 依語系取標題（結果頁沒有語系，用繁中）
function videoTitleOf(v, lang = "zh-TW") {
  const t = v?.title;
  if (!t) return "";
  return typeof t === "string" ? t : t[lang] || "";
}
