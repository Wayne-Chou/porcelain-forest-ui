/* =========================================================
 * 設定區：單位名稱、測驗項目、導航都在這裡改，介面會自動更新
 * ========================================================= */
const CONFIG = {
  unitName: "建豐長照中心",

  // 今日數據（之後改成從後端讀取）
  stats: { done: 18, pending: 3 },

  // 測驗項目：新增測驗只要在這裡加一筆
  tests: [
    { id: "sppb", name: "SPPB", desc: "簡易身體功能評估 · 約 8 分鐘", icon: "ti-activity" },
    { id: "gait", name: "行走測驗", desc: "步態分析 · 約 5 分鐘", icon: "ti-walk" },
    // { id: "grip", name: "握力測驗", desc: "上肢肌力 · 約 3 分鐘", icon: "ti-hand-grab" },
  ],

  // 底部導航：ready 改成 true 之後才會真的換頁
  nav: [
    { id: "home",     label: "鑑測",   icon: "ti-scan",       href: "index.html",    ready: true },
    { id: "report",   label: "報告",   icon: "ti-chart-line", href: "report.html",   ready: false },
    { id: "subjects", label: "受測者", icon: "ti-users",      href: "subjects.html", ready: false },
    { id: "settings", label: "設定",   icon: "ti-settings",   href: "settings.html", ready: false },
  ],
};

/* =========================================================
 * 共用功能
 * ========================================================= */
const $ = (sel) => document.querySelector(sel);

let toastTimer;
function showToast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2000);
}

// 底部導航：依目前頁面標出選中項目，點其他項目時膠囊先展開再換頁
function renderNav() {
  const nav = $("#nav");
  if (!nav) return;
  const current = location.pathname.split("/").pop() || "index.html";

  nav.innerHTML = CONFIG.nav
    .map(
      (n) => `
      <button class="nav-item ${n.href === current ? "is-active" : ""}" data-href="${n.href}" data-ready="${n.ready}" aria-label="${n.label}">
        <i class="ti ${n.icon}"></i><span>${n.label}</span>
      </button>`,
    )
    .join("");

  nav.addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-item");
    if (!btn || btn.classList.contains("is-active")) return;
    if (btn.dataset.ready !== "true") {
      showToast(`「${btn.getAttribute("aria-label")}」頁面製作中`);
      return;
    }
    nav.querySelector(".is-active")?.classList.remove("is-active");
    btn.classList.add("is-active");
    setTimeout(() => (location.href = btn.dataset.href), 380);
  });
}

/* =========================================================
 * 首頁
 * ========================================================= */
function renderHero() {
  const now = new Date();
  const week = "日一二三四五六"[now.getDay()];
  const num = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
  const dayText = (d) => (d <= 10 ? num[d] : d < 20 ? "十" + num[d - 10] : num[Math.floor(d / 10)] + "十" + (num[d % 10] || ""));
  $("#heroDate").textContent = `${num[now.getMonth() + 1]}月${dayText(now.getDate())}日 · 星期${week}`;

  const h = now.getHours();
  const greet = h < 11 ? "早安" : h < 18 ? "午安" : "晚安";
  $("#heroTitle").innerHTML = `${greet}，<br>${CONFIG.unitName}`;

  countUp($("#statDone"), CONFIG.stats.done);
  countUp($("#statPending"), CONFIG.stats.pending);
  const badge = $("#uploadBadge");
  if (CONFIG.stats.pending > 0) {
    badge.textContent = CONFIG.stats.pending;
    badge.hidden = false;
  }
}

// 數字從 0 跑到目標值
function countUp(el, target) {
  const start = performance.now() + 300;
  const dur = 1200;
  const tick = (t) => {
    const p = Math.min(Math.max((t - start) / dur, 0), 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function renderTests() {
  const list = $("#testList");
  list.innerHTML =
    CONFIG.tests
      .map(
        (t, i) => `
      <button class="test-card ${i === 0 ? "is-active" : ""}" data-index="${i}">
        <div class="top"><span class="no">NO. ${String(i + 1).padStart(2, "0")}</span><i class="ti ${t.icon}"></i></div>
        <div class="name serif ${t.name.length > 4 ? "long" : ""}">${t.name}</div>
        <div class="desc">${t.desc}</div>
        <span class="start" data-start="${t.id}">開始測驗 <i class="ti ti-arrow-right"></i></span>
      </button>`,
      )
      .join("") +
    `<div class="test-card soon"><i class="ti ti-plus"></i><span>更多項目即將推出</span></div>`;

  $("#dots").innerHTML = CONFIG.tests.map((_, i) => `<span class="dot ${i === 0 ? "is-active" : ""}"></span>`).join("");

  const cards = [...list.querySelectorAll(".test-card:not(.soon)")];
  const dots = [...$("#dots").children];
  let active = 0;

  const setActive = (i) => {
    if (i === active) return;
    cards[active].classList.remove("is-active");
    dots[active].classList.remove("is-active");
    cards[i].classList.add("is-active");
    dots[i].classList.add("is-active");
    active = i;
  };

  // 滑動時，最靠左邊對齊點的卡片成為選中卡片
  let raf;
  list.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const left = list.getBoundingClientRect().left + parseFloat(getComputedStyle(list).scrollPaddingLeft || 0);
      let best = 0, bestDist = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(c.getBoundingClientRect().left - left);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      setActive(best);
    });
  });

  // 點未選中的卡片 → 滑過去；點選中卡片 → 開始測驗
  list.addEventListener("click", (e) => {
    const card = e.target.closest(".test-card:not(.soon)");
    if (!card) return;
    const i = Number(card.dataset.index);
    if (i !== active) {
      card.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
      setActive(i);
      return;
    }
    onTestSelected(CONFIG.tests[i]);
  });
}

// 選好測驗後要做的事（之後做好 assess.html 就改成換頁）
function onTestSelected(test) {
  showToast(`即將開始：${test.name}`);
  // location.href = `assess.html?test=${test.id}`;
}

function bindTools() {
  document.querySelectorAll("[data-action]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const map = { calibrate: "鏡頭校準", upload: "影像上傳" };
      showToast(`「${map[btn.dataset.action]}」功能製作中`);
    }),
  );
}

/* ===== 啟動 ===== */
renderNav();
if ($("#testList")) {
  renderHero();
  renderTests();
  bindTools();
}
