/* =========================================================
 * 共用底部導覽（樣式在 css/nav.css，尺寸依導覽列寬度以容器查詢計算）：首頁、鑑測紀錄、受測者管理
 * 頁面放 <nav class="nav" id="nav"></nav>，載入本檔後呼叫 renderNav()
 *
 * 「上傳」：首頁（有 openUpSheet）直接開啟上傳面板；其他頁前往 home.html?upload=1，首頁偵測到參數會自動開啟
 * 待上傳數字：首頁計算後呼叫 setUploadPending(n)（同時寫入 sessionStorage「kf.uploadPending」），其他頁讀取顯示
 * ========================================================= */
(function () {
  // 新增或調整項目只要改這裡；ready 改成 true 之後才會真的換頁
  const NAV_ITEMS = [
    { id: "home", label: "鑑測", icon: "ti-scan", href: "home.html", ready: true },
    { id: "report", label: "紀錄", icon: "ti-history", href: "report.html", ready: true },
    { id: "upload", label: "上傳", icon: "ti-cloud-upload", action: "upload" },
    { id: "subjects", label: "受測者", icon: "ti-users", href: "subjects.html", ready: true },
    { id: "settings", label: "設定", icon: "ti-settings", href: "settings.html", ready: false },
  ];
  const PENDING_KEY = "kf.uploadPending";

  function renderNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;
    const current = location.pathname.split("/").pop() || "home.html";
    nav.setAttribute("aria-label", "主選單");
    nav.innerHTML = NAV_ITEMS.map((n) =>
      n.action === "upload"
        ? `<button class="nav-up" type="button" data-action="upload" aria-label="${n.label}">
            <span class="nav-up-slot"></span>
            <span class="nav-up-circle"><i class="ti ${n.icon}" aria-hidden="true"></i><b class="nav-up-badge" id="navUpBadge" hidden></b></span>
            <span class="nav-label">${n.label}</span>
          </button>`
        : `<button class="nav-item${n.href === current ? " is-active" : ""}" type="button" data-href="${n.href}" data-ready="${n.ready}"${n.href === current ? ' aria-current="page"' : ""}>
            <i class="ti ${n.icon} nav-icon" aria-hidden="true"></i>
            <span class="nav-label">${n.label}</span>
          </button>`,
    ).join("");

    let pending = 0;
    try {
      pending = Number(sessionStorage.getItem(PENDING_KEY)) || 0;
    } catch (e) {}
    setNavBadge(pending);

    nav.addEventListener("click", (e) => {
      if (e.target.closest(".nav-up")) {
        if (typeof window.openUpSheet === "function") window.openUpSheet(); // 只有首頁有上傳面板
        else location.href = "home.html?upload=1";
        return;
      }
      const btn = e.target.closest(".nav-item");
      if (!btn || btn.classList.contains("is-active")) return;
      if (btn.dataset.ready !== "true") {
        const label = btn.querySelector(".nav-label").textContent;
        if (typeof window.showToast === "function") window.showToast(`「${label}」頁面製作中`);
        return;
      }
      nav.querySelector(".is-active")?.classList.remove("is-active");
      btn.classList.add("is-active");
      setTimeout(() => (location.href = btn.dataset.href), 220);
    });
  }

  // 上傳圓鈕右上角的紅色數字（0 時不顯示）
  function setNavBadge(n) {
    const badge = document.getElementById("navUpBadge");
    if (!badge) return;
    badge.textContent = n;
    badge.hidden = !(n > 0);
    badge.closest(".nav-up").setAttribute("aria-label", n > 0 ? `上傳（${n} 筆待上傳）` : "上傳");
  }

  // 首頁：更新徽章並記下來給其他頁使用
  function setUploadPending(n) {
    setNavBadge(n);
    try {
      sessionStorage.setItem(PENDING_KEY, String(n));
    } catch (e) {}
  }

  window.renderNav = renderNav;
  window.setNavBadge = setNavBadge;
  window.setUploadPending = setUploadPending;
})();
