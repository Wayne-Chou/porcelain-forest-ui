
      /* =========================================================
       * 頁面清單：新增頁面只要在這裡加一筆
       * status："done" 已完成（可點擊）／"todo" 製作中（半透明、不能點）
       * ========================================================= */
      const PAGES = [
        { file: "pages/login.html",    name: "登入",       desc: "帳號密碼登入頁", status: "done" },
        { file: "pages/home.html",     name: "首頁",       desc: "選擇測驗、查看今日數據與影像上傳", status: "done" },
        // 受測名單需要網址參數（測驗、場域），預覽時帶入 SPPB 和第一個場域 tpe-01；preview=1 顯示進度狀態切換工具列
        { file: "pages/roster.html?test=sppb&field=tpe-01&preview=1", name: "受測名單", desc: "選擇場域後的人員名單，可新增人員、開始或重測", status: "done" },
        // 測驗頁需要網址參數；沒有 subject 時使用第一位受測者
        { file: "pages/assess.html?test=sppb&field=tpe-01", name: "SPPB 測驗", desc: "依序進行起坐、平衡、步行三項測驗", status: "done" },
        { file: "pages/assess.html?test=gait&field=tpe-01", name: "行走測驗", desc: "行走測驗頁", status: "done" },
        { file: "pages/report.html",   name: "鑑測紀錄",   desc: "依場域查看歷史鑑測紀錄，可依測驗與日期篩選", status: "done" },
        { file: "pages/result.html", name: "SPPB 鑑測結果", desc: "跌倒風險、VIVIFRAIL 等級與三項體能詳細數據", status: "done" },
        // 行走測驗鑑測結果：record=r101 是假資料（王小明、中度風險）；不帶 record 時可用 ?risk=0–4 預覽各等級
        { file: "pages/result-gait.html?record=r101", name: "行走測驗鑑測結果", desc: "跌倒風險等級半圓圖與說明，可點報告 QR Code 開啟詳細報告", status: "done" },
        // 詳細報告：正式由簡訊／LINE 連結帶 token 開啟；preview=1 用假資料，並顯示切換工具列
        { file: "pages/detail-gait.html?preview=1", name: "行走測驗詳細報告", desc: "受測者手機開啟的步態分析報告，可存成圖片", status: "done" },
        { file: "pages/detail-sppb.html?preview=1", name: "SPPB 詳細報告", desc: "受測者手機開啟的 SPPB 報告：三項分數、風險、VIVIFRAIL 與建議", status: "done" },
        { file: "pages/subjects.html", name: "受測者管理", desc: "管理各場域的受測人員，可新增、編輯資料", status: "done" },
        { file: "pages/settings.html", name: "系統設定",   desc: "設備與帳號設定", status: "todo" },
      ];

      const esc = (s) =>
        String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

      function cardHTML(p) {
        const inner = `
          <div class="card-name">${esc(p.name)}</div>
          <div class="card-desc">${esc(p.desc)}</div>`;
        return p.status === "done"
          ? `<a class="card" href="${esc(p.file)}" target="_blank" rel="noopener">${inner}</a>`
          : `<div class="card is-todo" aria-disabled="true">${inner}</div>`;
      }

      document.getElementById("grid").innerHTML = PAGES.map(cardHTML).join("");
    