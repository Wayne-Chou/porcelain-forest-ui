/* =========================================================
 * 多語資料取值（共用）：推薦商品、最新消息、照護服務等「後台資料」的文字欄位
 *   引用：result.html、result-gait.html、detail-gait.html、detail-sppb.html（在 recommend.js、news.js、referral.js 之前）
 *
 *   currentLang()      目前語系：結果頁用 js/app-i18n.js（AppI18n.lang）、詳細頁用 js/detail-i18n.js（I18N.lang）；
 *                      都沒有時讀 sessionStorage「kf.lang」，預設 zh-TW
 *   pickLang(obj)      依目前語系取值，沒有（或空字串）就退回 zh-TW；obj 是字串（舊資料、後台資料）時直接回傳；
 *                      陣列（例如照護服務的重點）逐項取值
 *   langAttr(obj)      退回繁中的文字要標 lang="zh-Hant"（日文、英文畫面裡維持繁中字型）：回傳 ' lang="zh-Hant"' 或空字串
 *   多語物件的 key 跟 js/app-i18n.js 的語系代碼一致：{ "zh-TW": "…", ja: "…", en: "…" }
 * ========================================================= */
const KF_LANGS = ["zh-TW", "ja", "en"];
function currentLang() {
  if (window.AppI18n?.lang) return window.AppI18n.lang;
  if (window.I18N?.lang) return window.I18N.lang;
  try {
    const v = sessionStorage.getItem("kf.lang");
    if (KF_LANGS.includes(v)) return v;
  } catch (e) {}
  return "zh-TW";
}
const hasText = (v) => v !== undefined && v !== null && v !== "";
function pickLang(obj, lang = currentLang()) {
  if (!hasText(obj)) return "";
  if (Array.isArray(obj)) return obj.map((v) => pickLang(v, lang));
  if (typeof obj !== "object") return String(obj);
  const v = hasText(obj[lang]) ? obj[lang] : obj["zh-TW"];
  if (Array.isArray(v)) return v.map((x) => pickLang(x, lang));
  return hasText(v) ? String(v) : "";
}
// 這個欄位在目前語系是不是退回了繁中（字串一律視為繁中）
function isZhFallback(obj, lang = currentLang()) {
  if (lang === "zh-TW" || !hasText(obj)) return false;
  if (Array.isArray(obj)) return obj.some((v) => isZhFallback(v, lang));
  return typeof obj !== "object" || !hasText(obj[lang]);
}
const langAttr = (obj, lang = currentLang()) => (isZhFallback(obj, lang) ? ' lang="zh-Hant"' : "");
