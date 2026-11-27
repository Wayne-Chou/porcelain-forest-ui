/* =========================================================
 * 跌倒風險等級（共用資料；固定的文字和顏色，不可更改）
 *   引用：result.html、result-gait.html（js/result-common.js 之前）、detail-gait.html、detail-sppb.html（js/detail-common.js 之前）
 * RISK：name 完整名稱（繁中）、short 短名稱（繁中）、arc 半圓圖色段、bg／border／text 膠囊底、框、字、desc 風險說明（結果頁）
 * SEG_ORDER：半圓圖由左到右（低 → 危險）；行走測驗的 riskLevel 0–4 也是這個順序
 * riskLevelText(key, lang)：半圓圖下方的「風險等級：短名稱」（結果頁用繁中；詳細頁依語系）
 * ========================================================= */
const RISK = {
  vlow: { name: "低風險", arc: "#4ffa00", bg: "#f0fdf4", border: "#86efac", text: "#166534", desc: "跌倒風險低，體能表現優異" },
  low: { name: "稍低風險", arc: "#8cff00", bg: "#f7fee7", border: "#bef264", text: "#3f6212", desc: "跌倒風險稍低，狀況良好" },
  mid: { name: "中度風險", arc: "#ffd039", bg: "#fefce8", border: "#fde047", text: "#854d0e", desc: "跌倒風險中等，持續關注為佳" },
  high: { name: "高風險", arc: "#ffa203", bg: "#fff7ed", border: "#fdba74", text: "#c2410c", desc: "跌倒風險較高，建議積極改善" },
  danger: { name: "危險", arc: "#ff5757", bg: "#fef2f2", border: "#fca5a5", text: "#b91c1c", desc: "目前跌倒風險偏高，請特別注意" },
};
const SEG_ORDER = ["vlow", "low", "mid", "high", "danger"];

// 短名稱與「風險等級：」三語（繁中｜日｜英）
const RISK_LANGS = ["zh-TW", "ja", "en"];
const RISK_SHORT = {
  vlow: ["低", "低", "Low"],
  low: ["稍低", "やや低", "Mod-Low"],
  mid: ["中", "中", "Moderate"],
  high: ["高", "高", "High"],
  danger: ["危險", "危険", "Danger"],
};
const RISK_LEVEL_PREFIX = ["風險等級：", "リスクレベル：", "Risk level: "];
SEG_ORDER.forEach((k) => (RISK[k].short = RISK_SHORT[k][0])); // 結果頁示範鈕、照護服務卡等沿用 RISK[k].short

const riskLangIdx = (lang) => Math.max(0, RISK_LANGS.indexOf(lang));
function riskShortName(key, lang = "zh-TW") {
  return RISK_SHORT[key]?.[riskLangIdx(lang)] ?? "";
}
function riskLevelText(key, lang = "zh-TW") {
  return RISK_LEVEL_PREFIX[riskLangIdx(lang)] + riskShortName(key, lang);
}
