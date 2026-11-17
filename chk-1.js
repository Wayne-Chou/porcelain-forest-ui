
      /* =========================================================
       * 設定區：單位名稱、測驗項目、導航都在這裡改，介面會自動更新
       * ========================================================= */
      const CONFIG = {
        unitName: "建豐健康科技",

        // 今日數據（之後改成從後端讀取）；待上傳數量改由 uploads 計算
        stats: { done: 2 }, // 與名單頁已完成 SPPB 的人數一致

        // 待上傳的鑑測（假資料，日期依今天自動產生）
        // TODO：之後改成從設備本機或 API 讀取
        // 一個日期算 1 筆；failOnce：第一次上傳一定失敗、第二次起成功（示範失敗畫面用）
        uploads: [
          { date: isoDaysAgo(0), failOnce: false },
          { date: isoDaysAgo(1), failOnce: true },
          { date: isoDaysAgo(3), failOnce: false },
          { date: isoDaysAgo(6), failOnce: false },
        ],

        // 測驗項目：新增測驗只要在這裡加一筆
        tests: [
          {
            id: "sppb",
            name: "SPPB",
            desc: "簡易身體功能評估",
            minutes: 5,
            output: "跌倒風險評估",
            icon: "ti-activity",
          },
          {
            id: "gait",
            name: "行走測驗",
            desc: "步態分析",
            minutes: 2,
            output: "步速與步態報告",
            icon: "ti-walk",
          },
          // { id: "grip", name: "握力測驗", desc: "上肢肌力", minutes: 3, output: "握力評估", icon: "ti-hand-grab" },
        ],

        // 底部導航：ready 改成 true 之後才會真的換頁
        nav: [
          {
            id: "home",
            label: "鑑測",
            icon: "ti-scan",
            href: "home.html",
            ready: true,
          },
          {
            id: "report",
            label: "紀錄",
            icon: "ti-history",
            href: "report.html",
            ready: true,
          },
          {
            id: "subjects",
            label: "受測者",
            icon: "ti-users",
            href: "subjects.html",
            ready: true,
          },
          {
            id: "settings",
            label: "設定",
            icon: "ti-settings",
            href: "settings.html",
            ready: false,
          },
        ],

        // 鑑測場域（假資料）
        // TODO：之後改成從後端 API 讀取，例如 const fields = await fetch("/api/fields").then((r) => r.json());
        fields: [
          { id: "tpe-01", name: "大安社區關懷據點" },
          { id: "tpe-02", name: "信義長照中心" },
          { id: "tpe-03", name: "中正區活動中心" },
          { id: "tpe-04", name: "北投社區關懷據點" },
        ],
      };

      /* =========================================================
       * 共用功能
       * ========================================================= */
      const $ = (sel) => document.querySelector(sel);
      // 1 個 --u 實際是幾 px（iPad 13 吋直式 = 1）；拖曳關閉距離等 JS 裡的尺寸用它換算
      function unitPx() {
        let probe = document.getElementById("__unit");
        if (!probe) {
          probe = document.createElement("div");
          probe.id = "__unit";
          probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;width:calc(1000 * var(--u));height:0";
          document.body.appendChild(probe);
        }
        return probe.offsetWidth / 1000;
      }

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
        const current = location.pathname.split("/").pop() || "home.html";

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
        const num = [
          "",
          "一",
          "二",
          "三",
          "四",
          "五",
          "六",
          "七",
          "八",
          "九",
          "十",
          "十一",
          "十二",
        ];
        const dayText = (d) =>
          d <= 10
            ? num[d]
            : d < 20
              ? "十" + num[d - 10]
              : num[Math.floor(d / 10)] + "十" + (num[d % 10] || "");
        $("#heroDate").textContent =
          `${num[now.getMonth() + 1]}月${dayText(now.getDate())}日 · 星期${week}`;

        const h = now.getHours();
        const greet = h < 11 ? "早安" : h < 18 ? "午安" : "晚安";
        $("#heroTitle").innerHTML = `${greet}，<br>${CONFIG.unitName}`;

        countUp($("#statDone"), CONFIG.stats.done);
        countUp($("#statPending"), pendingCount());
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
        list.innerHTML = CONFIG.tests
          .map(
            (t, i) => `
      <button class="test-card ${i === 0 ? "is-active" : ""}" data-index="${i}">
        <div class="top"><span class="no"><em>產出</em>${t.output}</span><i class="ti ${t.icon}"></i></div>
        <div class="name serif ${t.name.length > 4 ? "long" : ""}">${t.name}</div>
        <div class="desc">${t.desc}</div>
        <div class="time"><i class="ti ti-clock"></i>約 ${t.minutes} 分鐘</div>
        <span class="start" data-start="${t.id}">開始測驗 <i class="ti ti-arrow-right"></i></span>
      </button>`,
          )
          .join("");

        $("#dots").innerHTML = CONFIG.tests
          .map(
            (_, i) => `<span class="dot ${i === 0 ? "is-active" : ""}"></span>`,
          )
          .join("");

        const cards = [...list.querySelectorAll(".test-card")];
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

        // 滑動時，最接近畫面中央的卡片成為選中卡片
        let raf;
        list.addEventListener("scroll", () => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            const r = list.getBoundingClientRect();
            const mid = r.left + r.width / 2;
            let best = 0,
              bestDist = Infinity;
            cards.forEach((c, i) => {
              const cr = c.getBoundingClientRect();
              const d = Math.abs(cr.left + cr.width / 2 - mid);
              if (d < bestDist) {
                bestDist = d;
                best = i;
              }
            });
            setActive(best);
          });
        });

        // 點未選中的卡片 → 滑過去；點選中卡片 → 開始測驗
        list.addEventListener("click", (e) => {
          const card = e.target.closest(".test-card");
          if (!card) return;
          const i = Number(card.dataset.index);
          if (i !== active) {
            card.scrollIntoView({
              behavior: "smooth",
              inline: "nearest",
              block: "nearest",
            });
            setActive(i);
            return;
          }
          onTestSelected(CONFIG.tests[i]);
        });
      }

      // 選好測驗後：打開場域面板，選好場域後進入受測名單
      function onTestSelected(test) {
        openFieldSheet(test);
      }

      // 影像上傳卡：依待上傳數量顯示狀態；背景上傳中時「立即上傳」改成「上傳中」
      function renderSync() {
        const card = $("#syncCard");
        const pending = pendingCount();
        const done = pending === 0;
        card.classList.toggle("is-done", done);
        $("#syncIcon").className = `ti ${done ? "ti-cloud-check" : "ti-cloud-upload"}`;
        $("#syncBadge").textContent = pending;
        $("#syncBadge").hidden = done;
        const busy = isUploading();
        const btn = card.querySelector(".sync-btn");
        if (btn.dataset.busy === String(busy)) return; // 狀態沒變就不重畫（載入圖示不會重轉）
        btn.dataset.busy = busy;
        btn.classList.toggle("is-busy", busy);
        btn.innerHTML = busy
          ? '<i class="ti ti-loader-2 spin"></i>上傳中'
          : '立即上傳 <i class="ti ti-arrow-up"></i>';
      }

      /* =========================================================
       * 場域：sessionStorage（關閉分頁即清除；以「當天的工作階段」為單位）
       * kf.currentField  { id, date }：date 不是今天就當作沒有目前場域
       * kf.recentFields  [{ id, usedAt }]：最近使用（usedAt 為時間戳），最新在前，最多 20 筆
       *                  （相容舊格式：純 id 陣列）
       * ========================================================= */
      const FIELD_KEYS = {
        current: "kf.currentField",
        recent: "kf.recentFields",
      };
      const RECENT_MAX = 20;
      const fieldById = new Map(CONFIG.fields.map((f) => [f.id, f]));

      const esc = (s) =>
        String(s).replace(
          /[&<>"']/g,
          (c) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[c],
        );

      function readJSON(key, fallback) {
        try {
          const v = JSON.parse(sessionStorage.getItem(key));
          return v ?? fallback;
        } catch (e) {
          return fallback;
        }
      }
      function writeJSON(key, val) {
        try {
          sessionStorage.setItem(key, JSON.stringify(val));
        } catch (e) {}
      }
      function todayStr() {
        const d = new Date();
        const p = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      }

      const fieldStore = {
        getCurrent() {
          const v = readJSON(FIELD_KEYS.current, null);
          if (!v || v.date !== todayStr()) return null;
          return fieldById.get(v.id) || null;
        },
        setCurrent(id) {
          writeJSON(FIELD_KEYS.current, { id, date: todayStr() });
          const rest = this.getRecent().filter((r) => r.id !== id);
          writeJSON(
            FIELD_KEYS.recent,
            [{ id, usedAt: Date.now() }, ...rest].slice(0, RECENT_MAX),
          );
        },
        // 最近使用：最新在前；舊格式（純 id 陣列）依原順序換算成時間戳
        getRecent() {
          const raw = readJSON(FIELD_KEYS.recent, []);
          if (!Array.isArray(raw)) return [];
          const now = Date.now();
          const seen = new Set();
          return raw
            .map((r, i) =>
              typeof r === "string"
                ? { id: r, usedAt: now - (i + 1) }
                : { id: r?.id, usedAt: Number(r?.usedAt) || 0 },
            )
            .filter(
              (r) => fieldById.has(r.id) && !seen.has(r.id) && seen.add(r.id),
            )
            .sort((a, b) => b.usedAt - a.usedAt)
            .slice(0, RECENT_MAX);
        },
      };

      /* =========================================================
       * 選擇場域：底部面板（選好測驗後開啟，選場域後進入受測名單）
       * ========================================================= */
      const sheet = $("#sheet");
      const fieldList = $("#fieldList");
      const searchInput = $("#searchInput");
      const searchClear = $("#searchClear");

      const S = {
        open: false,
        test: null,
        selectedId: null,
        query: "",
        lastFocus: null,
      };

      // 搜尋：只比對名稱；不分大小寫，「臺」視同「台」，空白分隔的多個關鍵字都要符合
      const norm = (s) => s.toLowerCase().replace(/臺/g, "台");
      const queryTerms = () => norm(S.query).split(/\s+/).filter(Boolean);

      // 名稱中符合關鍵字的部分用 <mark> 標出（norm 不改變字數，位置可直接對應原文）
      function highlight(name, terms) {
        if (!terms.length) return esc(name);
        const n = norm(name);
        const hit = new Array(name.length).fill(false);
        terms.forEach((t) => {
          for (let i = n.indexOf(t); i !== -1; i = n.indexOf(t, i + 1)) {
            for (let k = i; k < i + t.length; k++) hit[k] = true;
          }
        });
        let html = "";
        for (let i = 0; i < name.length; ) {
          let j = i;
          while (j < name.length && hit[j] === hit[i]) j++;
          const part = esc(name.slice(i, j));
          html += hit[i] ? `<mark>${part}</mark>` : part;
          i = j;
        }
        return html;
      }

      // 排序：用過的依最近使用時間在前，沒用過的在後，沒用過的依名稱排序
      function sortFields(list, recent) {
        const rank = new Map(recent.map((r, i) => [r.id, i]));
        return [...list].sort((a, b) => {
          const ra = rank.get(a.id);
          const rb = rank.get(b.id);
          if (ra !== undefined && rb !== undefined) return ra - rb;
          if (ra !== undefined) return -1;
          if (rb !== undefined) return 1;
          return a.name.localeCompare(b.name, "zh-Hant");
        });
      }

      function fieldRowHTML(f, terms) {
        const sel = f.id === S.selectedId;
        return `
      <div class="frow ${sel ? "is-selected" : ""}" role="radio" aria-checked="${sel}" tabindex="0" data-id="${f.id}">
        <span class="frow-radio"><i class="ti ti-check"></i></span>
        <span class="frow-name">${highlight(f.name, terms)}</span>
        <span class="frow-tag">已選取</span>
      </div>`;
      }

      function renderList() {
        const terms = queryTerms();
        const recent = fieldStore.getRecent();
        let html = "";

        if (!terms.length) {
          // 最近使用：最多 3 個，目前場域排第一
          const cur = fieldStore.getCurrent();
          let ids = recent.map((r) => r.id);
          if (cur && ids.includes(cur.id))
            ids = [cur.id, ...ids.filter((id) => id !== cur.id)];
          const recentFields = ids.slice(0, 3).map((id) => fieldById.get(id));
          if (recentFields.length) {
            html += `<h3 class="sheet-section">最近使用</h3>${recentFields.map((f) => fieldRowHTML(f, terms)).join("")}`;
          }
          const all = sortFields(CONFIG.fields, recent);
          html += `<h3 class="sheet-section">全部場域（${all.length}）</h3>${all.map((f) => fieldRowHTML(f, terms)).join("")}`;
        } else {
          const matched = sortFields(
            CONFIG.fields.filter((f) => {
              const n = norm(f.name);
              return terms.every((t) => n.includes(t));
            }),
            recent,
          );
          if (!matched.length) {
            fieldList.innerHTML = `
      <div class="list-empty">
        <i class="ti ti-map-search"></i>
        <div class="list-empty-title">找不到符合的場域</div>
        <div class="list-empty-sub">試試其他關鍵字</div>
      </div>`;
            return;
          }
          html += `<h3 class="sheet-section">搜尋結果（${matched.length}）</h3>${matched.map((f) => fieldRowHTML(f, terms)).join("")}`;
        }
        fieldList.innerHTML = html;
      }

      function openFieldSheet(test) {
        S.open = true;
        S.test = test;
        S.query = "";
        S.lastFocus = document.activeElement;
        searchInput.value = "";
        searchClear.hidden = true;

        // 當天已有目前場域：自動選取
        const cur = fieldStore.getCurrent();
        S.selectedId = cur ? cur.id : null;
        $("#sheetSub").textContent = `${test.name} · ${test.desc}`;
        renderList();
        fieldList.scrollTop = 0;

        sheet.style.transform = "";
        sheet.classList.add("is-open");
        sheet.setAttribute("aria-hidden", "false");
        document.body.classList.add("sheet-open");
        $("#app").inert = true;
      }

      function closeFieldSheet() {
        if (!S.open) return;
        S.open = false;
        searchInput.blur();
        sheet.style.transform = "";
        sheet.classList.remove("is-open");
        sheet.setAttribute("aria-hidden", "true");
        document.body.classList.remove("sheet-open");
        $("#app").inert = false;
        S.lastFocus?.focus?.({ preventScroll: true });
      }

      function selectField(id) {
        if (S.selectedId === id) return;
        S.selectedId = id;
        fieldList.querySelectorAll(".frow").forEach((row) => {
          const on = row.dataset.id === id;
          row.classList.toggle("is-selected", on);
          row.setAttribute("aria-checked", on);
          // 單選鈕小彈跳
          const radio = row.querySelector(".frow-radio");
          radio.classList.remove("pop");
          if (on) {
            void radio.offsetWidth;
            radio.classList.add("pop");
          }
        });
      }

      function confirmField() {
        const field = fieldById.get(S.selectedId);
        if (!field) {
          fieldList.classList.remove("shake");
          void fieldList.offsetWidth; // 重新觸發動畫
          fieldList.classList.add("shake");
          showToast("請先選擇場域");
          return;
        }
        const { test } = S;
        fieldStore.setCurrent(field.id);
        closeFieldSheet();
        // 等面板關閉動畫結束再進入受測名單
        setTimeout(() => {
          location.href = `roster.html?test=${test.id}&field=${field.id}`;
        }, 350);
      }

      function initFieldSheet() {
        $("#sheetClose").addEventListener("click", closeFieldSheet);
        $("#sheetMask").addEventListener("click", closeFieldSheet);
        $("#sheetConfirm").addEventListener("click", confirmField);
        fieldList.addEventListener("animationend", (e) => {
          if (e.target === fieldList) fieldList.classList.remove("shake");
        });
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && S.open) closeFieldSheet();
        });

        // 點整列 = 選取
        fieldList.addEventListener("click", (e) => {
          const row = e.target.closest(".frow");
          if (row) selectField(row.dataset.id);
        });
        fieldList.addEventListener("keydown", (e) => {
          const row = e.target.closest?.(".frow");
          if (row && e.target === row && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            selectField(row.dataset.id);
          }
        });

        // 搜尋：即時篩選
        searchInput.addEventListener("input", () => {
          S.query = searchInput.value;
          searchClear.hidden = !S.query;
          renderList();
          fieldList.scrollTop = 0;
        });
        searchClear.addEventListener("click", (e) => {
          e.preventDefault();
          searchInput.value = "";
          searchInput.dispatchEvent(new Event("input"));
          searchInput.focus({ preventScroll: true });
        });

        // 拖曳把手區：往下拖跟手移動，放開時超過 120px 關閉，否則彈回
        const grab = $("#sheetGrab");
        let drag = null;
        grab.addEventListener("pointerdown", (e) => {
          if (!S.open || e.target.closest("button")) return;
          drag = { y: e.clientY, dy: 0 };
          grab.setPointerCapture(e.pointerId);
          sheet.classList.add("is-dragging");
        });
        grab.addEventListener("pointermove", (e) => {
          if (!drag) return;
          drag.dy = Math.max(0, e.clientY - drag.y);
          sheet.style.transform = `translateY(${drag.dy}px)`;
        });
        const endDrag = () => {
          if (!drag) return;
          const { dy } = drag;
          drag = null;
          sheet.classList.remove("is-dragging");
          sheet.style.transform = "";
          if (dy > 120 * unitPx()) closeFieldSheet();
        };
        grab.addEventListener("pointerup", endDrag);
        grab.addEventListener("pointercancel", endDrag);

        // 鍵盤彈出時：--vh 為可見高度、--kb 為被鍵盤蓋住的高度，讓面板與底部按鈕保持可見
        const vv = window.visualViewport;
        if (vv) {
          const sync = () => {
            const root = document.documentElement.style;
            root.setProperty("--vh", `${vv.height}px`);
            const kb = Math.max(0, innerHeight - vv.height - vv.offsetTop);
            root.setProperty("--kb", `${kb}px`);
          };
          vv.addEventListener("resize", sync);
          vv.addEventListener("scroll", sync);
          sync();
        }
      }

      /* =========================================================
       * 影像上傳
       * kf.uploadedDates：已上傳的日期（"YYYY-MM-DD" 陣列），重新整理後不再出現
       * U[date]：{ status: "idle" | "uploading" | "done" | "fail", pct, attempt, timer, removed }
       * ========================================================= */
      const UPLOADED_KEY = "kf.uploadedDates";
      const U = {};
      const up = { open: false, lastFocus: null };

      // 依今天往前推 n 天的日期（本地時間，"YYYY-MM-DD"）
      function isoDaysAgo(n) {
        const d = new Date();
        d.setDate(d.getDate() - n);
        const p = (x) => String(x).padStart(2, "0");
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      }
      function getUploaded() {
        try {
          const v = JSON.parse(sessionStorage.getItem(UPLOADED_KEY));
          return Array.isArray(v) ? v : [];
        } catch (e) {
          return [];
        }
      }
      function addUploaded(date) {
        try {
          const list = getUploaded();
          if (!list.includes(date)) list.push(date);
          sessionStorage.setItem(UPLOADED_KEY, JSON.stringify(list));
        } catch (e) {}
      }
      // 尚未上傳（且還沒從列表移除）的日期，由新到舊
      function pendingUploads() {
        const done = getUploaded();
        return CONFIG.uploads
          .filter((u) => !done.includes(u.date) && !U[u.date]?.removed)
          .sort((a, b) => b.date.localeCompare(a.date));
      }
      // 一個日期算 1 筆
      const pendingCount = () => pendingUploads().length;
      const isUploading = () =>
        Object.values(U).some((s) => s.status === "uploading");

      // 「11 月 12 日」
      function dayLabel(iso) {
        const [, m, d] = iso.split("-").map(Number);
        return `${m} 月 ${d} 日`;
      }

      function upRowHTML(u) {
        return `
      <div class="up-row" data-date="${u.date}">
        <span class="up-ico"><i class="ti ti-calendar"></i></span>
        <div class="up-main">
          <div class="up-date">${dayLabel(u.date)}</div>
          <div class="up-status"></div>
          <div class="up-bar"><div class="up-fill"></div></div>
        </div>
        <button class="up-btn" type="button"></button>
      </div>`;
      }

      // 依狀態更新一列（文字、進度條、按鈕）
      function renderUpRow(date) {
        const row = $(`#upBody .up-row[data-date="${date}"]`);
        if (!row) return;
        const s = U[date];
        const status = row.querySelector(".up-status");
        const bar = row.querySelector(".up-bar");
        const fill = row.querySelector(".up-fill");
        const btn = row.querySelector(".up-btn");
        // 進度每次更新只改文字和進度條；狀態改變時才重畫按鈕（避免載入圖示的旋轉重新開始）
        const changed = row.dataset.state !== s.status;
        row.dataset.state = s.status;
        row.classList.toggle("is-fail", s.status === "fail");
        const setBtn = (cls, html) => {
          if (!changed) return;
          btn.className = `up-btn${cls ? " " + cls : ""}`;
          btn.innerHTML = html;
        };
        if (s.status === "idle") {
          status.textContent = ""; // 待上傳不顯示第二行，日期垂直置中（見 CSS）
          bar.classList.remove("is-on");
          setBtn("", '<i class="ti ti-cloud-upload"></i>上傳');
        } else if (s.status === "uploading") {
          status.textContent = `上傳中 ${Math.floor(s.pct)}%`;
          bar.classList.add("is-on");
          fill.style.width = `${s.pct}%`;
          setBtn("is-busy", '<i class="ti ti-loader-2 spin"></i>上傳中');
        } else if (s.status === "done") {
          status.textContent = "已上傳";
          bar.classList.add("is-on");
          fill.style.width = "100%";
          setBtn("is-done", '<i class="ti ti-circle-check"></i>已上傳');
        } else {
          status.innerHTML = '<i class="ti ti-alert-circle"></i>上傳失敗';
          setBtn("is-retry", '<i class="ti ti-refresh"></i>重新上傳');
          // 進度條停在失敗的位置，0.6 秒後淡出
          if (changed)
            setTimeout(() => {
              if (U[date].status === "fail") bar.classList.remove("is-on");
            }, 600);
        }
      }

      function shakeRow(date) {
        const row = $(`#upBody .up-row[data-date="${date}"]`);
        if (!row) return;
        row.classList.remove("shake");
        void row.offsetWidth;
        row.classList.add("shake");
        row.addEventListener("animationend", () => row.classList.remove("shake"), {
          once: true,
        });
      }

      // 總數：數字變化時往下跑
      function setUpNum(n, animate = true) {
        const el = $("#upNum");
        if (el.dataset.n === String(n)) return;
        el.dataset.n = n;
        const old = el.querySelector(".roll-cur");
        const nw = document.createElement("span");
        nw.className = `roll-cur${animate && old ? " roll-in" : ""}`;
        nw.textContent = n;
        if (old && animate) {
          old.className = "roll-out";
          old.setAttribute("aria-hidden", "true"); // 滑出中的舊數字不給讀屏念
          setTimeout(() => old.remove(), 460);
        } else if (old) old.remove();
        el.appendChild(nw);
      }

      // 總數列、空狀態、首頁數字一起更新
      function renderUpTotals(animate = true) {
        const n = pendingCount();
        const allDone = pendingUploads().length === 0;
        $("#upTotal").hidden = allDone;
        $("#upTotalDone").hidden = !allDone;
        if (!allDone) setUpNum(n, animate);
        if (allDone && !$("#upBody .up-empty")) {
          $("#upBody").innerHTML = `
      <div class="up-empty">
        <i class="ti ti-cloud-check"></i>
        <div class="up-empty-title">所有鑑測都已上傳</div>
        <div class="up-empty-sub">新的鑑測完成後會出現在這裡</div>
      </div>`;
        }
        $("#statPending").textContent = n;
        renderSync();
      }

      function renderUpList() {
        const list = pendingUploads();
        list.forEach((u) => {
          U[u.date] ??= { status: "idle", pct: 0, attempt: 0, removed: false };
        });
        $("#upBody").innerHTML = list.length
          ? `<div class="up-card">${list.map(upRowHTML).join("")}</div>`
          : "";
        list.forEach((u) => renderUpRow(u.date));
        renderUpTotals(false);
      }

      /* 模擬上傳：約 3～5 秒從 0% 到 100%，速度忽快忽慢
       * TODO：之後改成實際上傳 API，例如
       *   uploadExams(date, {
       *     onProgress: (pct) => { U[date].pct = pct; renderUpRow(date); },  // 進度回呼
       *   }).then(() => uploadSucceeded(date))
       *     .catch((err) => uploadFailed(date, err));                         // 失敗處理
       */
      function startUpload(date) {
        const u = CONFIG.uploads.find((x) => x.date === date);
        const s = U[date];
        if (!u || s.status === "uploading" || s.status === "done") return;
        const wasFail = s.status === "fail";
        s.status = "uploading";
        s.pct = 0;
        s.attempt += 1;
        const willFail = u.failOnce && s.attempt === 1;
        const failAt = 56 + Math.random() * 8; // 約 60% 時失敗
        renderUpRow(date);
        if (wasFail) shakeRow(date);
        renderSync();

        const tick = () => {
          // 偶爾停頓、偶爾衝快一點
          const r = Math.random();
          s.pct += r < 0.15 ? 0.4 : r < 0.85 ? 2 + Math.random() * 3 : 6 + Math.random() * 4;
          if (willFail && s.pct >= failAt) {
            s.pct = failAt;
            renderUpRow(date);
            return uploadFailed(date);
          }
          if (s.pct >= 100) {
            s.pct = 100;
            return uploadSucceeded(date);
          }
          renderUpRow(date);
          s.timer = setTimeout(tick, 110 + Math.random() * 90);
        };
        s.timer = setTimeout(tick, 150);
      }

      function uploadSucceeded(date) {
        U[date].status = "done";
        addUploaded(date);
        renderUpRow(date);
        renderSync();
        if (!up.open) showToast(`${dayLabel(date)}已上傳`);
        // 1.2 秒後淡出並收合，從列表移除，總數往下跑
        setTimeout(() => {
          const row = $(`#upBody .up-row[data-date="${date}"]`);
          const finish = () => {
            row?.remove();
            U[date].removed = true;
            renderUpTotals();
          };
          if (!row) return finish();
          row.style.height = `${row.offsetHeight}px`;
          void row.offsetHeight;
          row.classList.add("is-leaving");
          row.style.height = "0px";
          setTimeout(finish, 420);
        }, 1200);
      }

      function uploadFailed(date) {
        U[date].status = "fail";
        renderUpRow(date);
        shakeRow(date);
        renderSync();
        if (!up.open) showToast(`${dayLabel(date)}上傳失敗，請重新上傳`);
      }

      function openUpSheet() {
        if (up.open || S.open) return;
        up.open = true;
        up.lastFocus = document.activeElement;
        const sheet = $("#upSheet");
        $("#upBody").scrollTop = 0;
        sheet.style.transform = "";
        sheet.classList.add("is-open");
        sheet.setAttribute("aria-hidden", "false");
        document.body.classList.add("sheet-open", "up-open");
        $("#app").inert = true;
      }

      // 有日期正在上傳時也可以關閉，上傳在背景繼續
      function closeUpSheet() {
        if (!up.open) return;
        up.open = false;
        const sheet = $("#upSheet");
        sheet.style.transform = "";
        sheet.classList.remove("is-open");
        sheet.setAttribute("aria-hidden", "true");
        document.body.classList.remove("sheet-open", "up-open");
        $("#app").inert = false;
        up.lastFocus?.focus?.({ preventScroll: true });
      }

      function initUpload() {
        renderUpList();
        $("#syncCard").addEventListener("click", openUpSheet);
        $("#upClose").addEventListener("click", closeUpSheet);
        $("#upMask").addEventListener("click", closeUpSheet);
        $("#upBody").addEventListener("click", (e) => {
          const btn = e.target.closest(".up-btn");
          if (btn) startUpload(btn.closest(".up-row").dataset.date);
        });
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && up.open) closeUpSheet();
        });

        // 拖曳把手區：往下拖跟手移動，放開時超過 120px 關閉，否則彈回
        const sheet = $("#upSheet");
        const grab = $("#upGrab");
        let drag = null;
        grab.addEventListener("pointerdown", (e) => {
          if (!up.open || e.target.closest("button")) return;
          drag = { y: e.clientY, dy: 0 };
          grab.setPointerCapture(e.pointerId);
          sheet.classList.add("is-dragging");
        });
        grab.addEventListener("pointermove", (e) => {
          if (!drag) return;
          drag.dy = Math.max(0, e.clientY - drag.y);
          sheet.style.transform = `translateY(${drag.dy}px)`;
        });
        const endDrag = () => {
          if (!drag) return;
          const { dy } = drag;
          drag = null;
          sheet.classList.remove("is-dragging");
          sheet.style.transform = "";
          if (dy > 120 * unitPx()) closeUpSheet();
        };
        grab.addEventListener("pointerup", endDrag);
        grab.addEventListener("pointercancel", endDrag);
      }

      /* =========================================================
       * 語系切換（radiogroup）：預設「中」；點擊只切換選中狀態並寫入 sessionStorage「kf.lang」
       * （zh-TW／ja／en，與詳細頁的 js/detail-i18n.js 共用同一個 key，兩邊選擇會同步）
       * 鍵盤：Tab 進出整組（只有選中那格可聚焦）；方向鍵、Home、End 切換
       * TODO：之後沿用 js/detail-i18n.js 的機制把首頁等 iPad 端頁面翻譯
       * ========================================================= */
      const LANGS = ["zh-TW", "ja", "en"];
      function readLang() {
        try {
          const v = sessionStorage.getItem("kf.lang");
          return LANGS.includes(v) ? v : "zh-TW";
        } catch (e) {
          return "zh-TW";
        }
      }
      function setLang(lang, focus = false) {
        const sw = $("#langSwitch");
        if (!sw) return;
        sw.querySelectorAll(".lang-opt").forEach((b) => {
          const on = b.dataset.lang === lang;
          b.setAttribute("aria-checked", String(on));
          b.tabIndex = on ? 0 : -1;
          if (on && focus) b.focus();
        });
        try {
          sessionStorage.setItem("kf.lang", lang);
        } catch (e) {}
      }
      function initLangSwitch() {
        const sw = $("#langSwitch");
        if (!sw) return;
        setLang(readLang());
        sw.addEventListener("click", (e) => {
          const b = e.target.closest(".lang-opt");
          if (b) setLang(b.dataset.lang);
        });
        sw.addEventListener("keydown", (e) => {
          const i = LANGS.indexOf(readLang());
          const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: LANGS.length - 1 }[e.key];
          if (next === undefined) return;
          e.preventDefault();
          setLang(LANGS[(next + LANGS.length) % LANGS.length], true);
        });
      }

      /* ===== 啟動 ===== */
      renderNav();
      initLangSwitch();
      if ($("#testList")) {
        renderHero();
        renderTests();
        initUpload(); // 會一併更新影像上傳卡
        initFieldSheet();
      }
    