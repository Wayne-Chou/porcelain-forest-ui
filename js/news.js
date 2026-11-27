/* =========================================================
 * 最新消息（共用）：詳細報告（detail-gait.html、detail-sppb.html）、鑑測結果頁（result-gait.html）
 * 樣式在 css/news.css
 *
 *   KF_NEWS                    預設消息：{ title, body, image, date, published }（對應之後的後台欄位）
 *   getLatestNews()            已上架中最新的一則（先讀 localStorage「kf.admin.news」）；詳細頁預覽、結果頁第 3 張卡都用它
 *   newsText(news)             詳細頁用的內文：body（相容 API 的 content）
 *   buildNewsContent(box, text) 依換行切行：含「：」或「:」的行拆成「項目／內容」；沒有冒號的行接在上一項內容後面換行，
 *                               前面還沒有項目時獨立成一段。一律用 textContent。半形冒號在數字之間（9:00）或網址（https://）不當作分隔
 * 標題與內容不翻譯
 * ========================================================= */

// 預設消息（之後由後台維護）：{ title（≤30 字）, body（≤300 字，可換行）, image（選填，一張）, date（系統帶入發布時間）, published }
const KF_NEWS = [
  { title: "保健品滿千折百，會員點數加倍",
    body: "即日起，店內保健品單筆消費滿 1,000 元折 100 元，會員結帳另享點數兩倍回饋。\n活動期間：11/20 – 12/31",
    image: "", date: "2026-11-20", published: true },
  { title: "12/6 免費足部壓力檢測",
    body: "現場由專人協助量測腳底受力狀況，並提供鞋墊挑選建議。\n時間：12/6（六）14:00 – 17:00\n每場限 20 位，請至櫃檯登記。",
    image: "", date: "2026-11-15", published: true },
  { title: "夜間感應燈到貨了",
    body: "人一靠近就自動亮燈，門市已有展示品，歡迎現場試用。\n上架首週第二件 8 折。",
    image: "", date: "2026-11-02", published: false },
];

/* 最新一則消息：先讀 localStorage「kf.admin.news」（之後的後台寫入；這次不做寫入），沒有就用 KF_NEWS
 * 只取 published 為 true 的消息中 date 最新的一則；一則都沒有時回傳 null */
function getLatestNews() {
  let list = null;
  try {
    const v = JSON.parse(localStorage.getItem("kf.admin.news"));
    if (Array.isArray(v)) list = v;
  } catch (e) {}
  return (
    (list ?? KF_NEWS)
      .filter((n) => n && n.published === true && n.title)
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))[0] || null
  );
}

// 詳細頁的內文：只用 body（標題另外顯示）；也相容 API 回傳的 content 字串
function newsText(news) {
  if (typeof news?.content === "string") return news.content;
  return String(news?.body ?? "");
}

function newsKeyIndex(line) {
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
      const i = newsKeyIndex(line);
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
