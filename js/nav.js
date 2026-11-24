/* =========================================================
 * 共用底部導覽（樣式在 css/nav.css，尺寸依導覽列寬度以容器查詢計算）：首頁、鑑測紀錄、受測者管理
 * 頁面放 <nav class="nav" id="nav"></nav>，載入本檔後呼叫 renderNav()
 *
 * 選中項目的圖示浮起成深綠大圓，導覽列在它的位置挖凹槽；平常是目前頁面的項目
 * 換頁：前往其他頁時把目前位置記在 sessionStorage「kf.navPrev」，新頁面先停在那裡再滑到自己的項目；沒有記錄就直接顯示
 * setNavActive("upload") 讓上傳暫時浮起（首頁開啟上傳面板時）；setNavActive() 滑回目前頁面的項目
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
  // 文字跟著語系（js/app-i18n.js，需在本檔之前載入）；沒有載入時用上面的中文
  const tr = (key, fallback, params) => (window.AppI18n ? AppI18n.t(key, params) : fallback);
  const labelOf = (n) => tr("nav." + n.id, n.label);
  const PENDING_KEY = "kf.uploadPending";
  const PREV_KEY = "kf.navPrev";
  const currentItem = () => {
    const page = location.pathname.split("/").pop() || "home.html";
    return NAV_ITEMS.find((n) => n.href === page)?.id || null;
  };
  let activeId = null; // 目前浮起的項目

  // 凹槽位置：項目中心佔導覽列（含框）寬度的百分比
  function placeNotch(nav) {
    const btn = nav.querySelector(`[data-id="${activeId}"]`);
    if (!btn) return;
    const n = nav.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    nav.style.setProperty("--notch-x", `${((r.left + r.width / 2 - n.left) / n.width) * 100}%`);
  }
  // 不播動畫地執行
  function still(nav, fn) {
    nav.classList.add("no-anim");
    fn();
    void getComputedStyle(nav).getPropertyValue("--notch-x");
    void nav.offsetWidth;
    nav.classList.remove("no-anim");
  }
  function setNavActive(id) {
    const nav = document.getElementById("nav");
    if (!nav) return;
    activeId = id || currentItem();
    nav.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("is-active", b.dataset.id === activeId));
    placeNotch(nav);
  }
  // 前往其他頁：記下目前浮起的位置
  function go(href) {
    try {
      if (activeId) sessionStorage.setItem(PREV_KEY, activeId);
    } catch (e) {}
    location.href = href;
  }
  function takePrev() {
    try {
      const v = sessionStorage.getItem(PREV_KEY);
      sessionStorage.removeItem(PREV_KEY);
      return NAV_ITEMS.some((n) => n.id === v) ? v : null;
    } catch (e) {
      return null;
    }
  }

  // 套用語系文字（切換語系時不重建，浮起的位置不變）
  function applyNavLang(nav) {
    if (window.AppI18n) nav.lang = AppI18n.lang === "zh-TW" ? "zh-Hant" : AppI18n.lang;
    nav.setAttribute("aria-label", tr("nav.menu", "主選單"));
    NAV_ITEMS.forEach((n) => {
      const el = nav.querySelector(`[data-id="${n.id}"] .nav-label`);
      el.textContent = labelOf(n);
      // 窄螢幕的日文放兩行：アップ／ロード
      if (el.textContent === "アップロード") el.innerHTML = "アップ<wbr>ロード";
    });
  }
  document.addEventListener("app:langchange", () => {
    const nav = document.getElementById("nav");
    if (!nav?.querySelector(".nav-item")) return;
    applyNavLang(nav);
    setNavBadge(pendingNow);
    still(nav, () => placeNotch(nav));
  });

  function renderNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;
    const current = currentItem();
    nav.innerHTML =
      '<span class="nav-bg" aria-hidden="true"></span>' +
      NAV_ITEMS.map((n) => {
        const attrs = n.action ? `data-action="${n.action}"` : `data-href="${n.href}" data-ready="${n.ready}"${n.id === current ? ' aria-current="page"' : ""}`;
        const badge = n.action === "upload" ? '<b class="nav-up-badge" id="navUpBadge" hidden></b>' : "";
        return `<button class="nav-item" type="button" data-id="${n.id}" ${attrs}>
            <span class="nav-float"><span class="nav-bub"></span><i class="ti ${n.icon} nav-icon" aria-hidden="true"></i>${badge}</span>
            <span class="nav-label"></span>
          </button>`;
      }).join("");
    applyNavLang(nav);
    // 不支援 @property 或 mask：改用頁面底色的圓疊在導覽列上
    const canNotch = typeof CSS !== "undefined" && "registerProperty" in CSS && (CSS.supports("mask", "radial-gradient(#000, #000)") || CSS.supports("-webkit-mask", "radial-gradient(#000, #000)"));
    nav.classList.toggle("no-notch", !canNotch);

    // 先停在上一頁的位置，再滑到目前頁面；home.html?upload=1 由開啟上傳面板時滑到「上傳」
    const prev = takePrev();
    const resume = prev && prev !== current;
    if (resume) nav.classList.add("is-resume");
    still(nav, () => setNavActive(resume ? prev : current));
    const willUpload = typeof window.openUpSheet === "function" && new URLSearchParams(location.search).get("upload") === "1";
    if (resume && !willUpload) setTimeout(() => activeId === prev && setNavActive(), 150);
    // 視窗大小改變：凹槽直接移到新位置（大小沒變時不處理，避免打斷滑動）
    let width = nav.offsetWidth;
    new ResizeObserver(() => {
      if (nav.offsetWidth === width) return;
      width = nav.offsetWidth;
      still(nav, () => placeNotch(nav));
    }).observe(nav);

    let pending = 0;
    try {
      pending = Number(sessionStorage.getItem(PENDING_KEY)) || 0;
    } catch (e) {}
    setNavBadge(pending);

    nav.addEventListener("click", (e) => {
      const btn = e.target.closest(".nav-item");
      if (!btn) return;
      if (btn.dataset.action === "upload") {
        if (typeof window.openUpSheet === "function") window.openUpSheet(); // 只有首頁有上傳面板
        else go("home.html?upload=1");
        return;
      }
      if (btn.getAttribute("aria-current") === "page") return;
      if (btn.dataset.ready !== "true") {
        const label = btn.querySelector(".nav-label").textContent;
        if (typeof window.showToast === "function") window.showToast(tr("nav.wip", `「${label}」頁面製作中`, { name: label }));
        return;
      }
      go(btn.dataset.href);
    });
  }

  // 上傳圖示右上角的紅色數字（0 時不顯示）
  let pendingNow = 0;
  function setNavBadge(n) {
    pendingNow = n;
    const badge = document.getElementById("navUpBadge");
    if (!badge) return;
    badge.textContent = n;
    badge.hidden = !(n > 0);
    badge.closest(".nav-item").setAttribute("aria-label", n > 0 ? tr("nav.pending", `上傳（${n} 筆待上傳）`, { n }) : tr("nav.upload", "上傳"));
  }

  // 首頁：更新徽章並記下來給其他頁使用
  function setUploadPending(n) {
    setNavBadge(n);
    try {
      sessionStorage.setItem(PENDING_KEY, String(n));
    } catch (e) {}
  }

  window.renderNav = renderNav;
  window.setNavActive = setNavActive;
  window.setNavBadge = setNavBadge;
  window.setUploadPending = setUploadPending;
})();
