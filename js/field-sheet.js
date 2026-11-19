/* =========================================================
 * 共用「選擇場域」面板（樣式 css/field-sheet.css、資料 js/fields.js）：首頁、鑑測紀錄、受測者頁
 * 各頁只要提供面板外框（<section class="sheet …">，位置與滑出動畫）和遮罩，內容由這裡產生
 *
 *   const fieldSheet = FieldSheet.create({
 *     sheet, mask, app,              // 面板、遮罩、開啟時設為 inert 的頁面主體
 *     bodyClasses: ["sheet-open"],   // 開啟時加在 <body> 上的 class
 *     title: "選擇場域",
 *     confirmLabel: "開始測驗", confirmIcon: "ti-arrow-right",
 *     toast: showToast,
 *     onConfirm(field),              // 按確認按鈕，或新增場域成功（＝點選該場域後確認）
 *     onRename(field),               // 自訂場域改名後：頁面更新顯示的名稱
 *   });
 *   fieldSheet.open({ sub, selectedId });  fieldSheet.close();  fieldSheet.escape()（表單→回列表；列表→關閉）
 *
 * 畫面：場域列表 ⇄ 新增／編輯表單（同一個面板內左右滑動切換，回列表時保留搜尋字）
 * 鍵盤彈出：--vh（可見高度）、--kb（被鍵盤蓋住的高度）由 visualViewport 更新，面板縮到鍵盤上方，輸入框與主按鈕不被遮住
 * ========================================================= */
(function () {
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  // 搜尋：只比對名稱；不分大小寫，「臺」視同「台」，空白分隔的多個關鍵字都要符合
  const norm = (s) => String(s).toLowerCase().replace(/臺/g, "台");
  const termsOf = (q) => norm(q).split(/\s+/).filter(Boolean);
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 名稱中符合關鍵字的部分用 <mark> 標出（norm 不改變字數，位置可直接對應原文）
  function highlight(name, terms) {
    if (!terms.length) return esc(name);
    const n = norm(name);
    const hit = new Array(name.length).fill(false);
    terms.forEach((t) => {
      for (let i = n.indexOf(t); i !== -1; i = n.indexOf(t, i + 1)) for (let k = i; k < i + t.length; k++) hit[k] = true;
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

  // 排序：自訂場域依建立時間（新的在前）排最前面；預設場域用過的依最近使用在前，沒用過的依名稱
  function sortFields(list, recent) {
    const rank = new Map(recent.map((r, i) => [r.id, i]));
    const customs = list.filter((f) => f.custom).sort((a, b) => b.createdAt - a.createdAt);
    const base = list
      .filter((f) => !f.custom)
      .sort((a, b) => {
        const ra = rank.get(a.id);
        const rb = rank.get(b.id);
        if (ra !== undefined && rb !== undefined) return ra - rb;
        if (ra !== undefined) return -1;
        if (rb !== undefined) return 1;
        return a.name.localeCompare(b.name, "zh-Hant");
      });
    return [...customs, ...base];
  }

  // 鍵盤彈出時：--vh 為可見高度、--kb 為被鍵盤蓋住的高度（同登入頁的 visualViewport 做法）
  let vvBound = false;
  function bindViewport() {
    const vv = window.visualViewport;
    if (!vv || vvBound) return;
    vvBound = true;
    const sync = () => {
      const root = document.documentElement.style;
      root.setProperty("--vh", `${vv.height}px`);
      root.setProperty("--kb", `${Math.max(0, innerHeight - vv.height - vv.offsetTop)}px`);
    };
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    sync();
  }

  let uid = 0;
  function create(opts) {
    const { sheet, mask, app } = opts;
    const id = `fsh${++uid}`;
    const toast = opts.toast || ((m) => console.info(m));
    const S = { open: false, selectedId: null, query: "", mode: "list", editId: null, lastFocus: null, formFrom: null };

    sheet.classList.add("fsh");
    sheet.setAttribute("aria-labelledby", `${id}-title`);
    sheet.innerHTML = `
      <div class="fsh-grab" data-drag><span class="fsh-bar"></span></div>
      <div class="fsh-views">
        <div class="fsh-view fsh-list-view">
          <header class="fsh-head" data-drag>
            <div>
              <h2 class="fsh-title" id="${id}-title">${esc(opts.title || "選擇場域")}</h2>
              <div class="fsh-sub" id="${id}-sub"></div>
            </div>
            <button class="fsh-close" type="button" aria-label="關閉"><i class="ti ti-x"></i></button>
          </header>
          <div class="fsh-search-row">
            <label class="fsh-search">
              <i class="ti ti-search"></i>
              <input class="fsh-search-input" type="search" placeholder="搜尋場域名稱" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="search" aria-label="搜尋場域名稱" />
              <button class="fsh-search-clear" type="button" aria-label="清除搜尋" hidden><i class="ti ti-x"></i></button>
            </label>
            <button class="fsh-add" type="button" data-act="add"><i class="ti ti-plus"></i>新增</button>
          </div>
          <div class="fsh-list" role="radiogroup" aria-label="場域"></div>
          <footer class="fsh-foot">
            <button class="fsh-primary fsh-confirm" type="button">${esc(opts.confirmLabel || "確認場域")} <i class="ti ${opts.confirmIcon || "ti-check"}"></i></button>
          </footer>
        </div>
        <div class="fsh-view fsh-form-view is-off-right" inert>
          <header class="fsh-head" data-drag>
            <div class="fsh-head-main">
              <button class="fsh-back" type="button" aria-label="返回場域列表"><i class="ti ti-arrow-left"></i></button>
              <h2 class="fsh-title fsh-form-title" id="${id}-form-title">新增場域</h2>
            </div>
            <button class="fsh-close" type="button" aria-label="關閉"><i class="ti ti-x"></i></button>
          </header>
          <form class="fsh-form" id="${id}-form" novalidate autocomplete="off">
            <label class="fsh-label" for="${id}-name">場域名稱</label>
            <input class="fsh-input" id="${id}-name" type="text" enterkeyhint="done" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="例如：松山社區關懷據點" aria-describedby="${id}-hint ${id}-error" />
            <div class="fsh-error" id="${id}-error" role="alert" hidden><i class="ti ti-alert-circle"></i><span></span></div>
            <div class="fsh-hint-row"><span class="fsh-hint" id="${id}-hint"></span><span class="fsh-count" aria-hidden="true"></span></div>
          </form>
          <footer class="fsh-foot">
            <button class="fsh-primary fsh-save" type="submit" form="${id}-form"></button>
          </footer>
        </div>
      </div>`;

    const $ = (sel) => sheet.querySelector(sel);
    const listView = $(".fsh-list-view");
    const formView = $(".fsh-form-view");
    const list = $(".fsh-list");
    const search = $(".fsh-search-input");
    const clear = $(".fsh-search-clear");
    const input = $(".fsh-input");
    const errorBox = $(".fsh-error");
    const saveBtn = $(".fsh-save");
    const countEl = $(".fsh-count");

    /* ── 列表 ── */
    function rowHTML(f, terms) {
      const sel = f.id === S.selectedId;
      return `
        <div class="fsh-row${sel ? " is-selected" : ""}" data-id="${esc(f.id)}">
          <div class="fsh-pick" role="radio" aria-checked="${sel}" tabindex="0">
            <span class="fsh-radio"><i class="ti ti-check"></i></span>
            <span class="fsh-name">${highlight(f.name, terms)}</span>
            ${f.custom ? '<span class="fsh-custom">自訂</span>' : ""}
            <span class="fsh-picked">已選取</span>
          </div>
          ${f.custom ? `<button class="fsh-edit" type="button" aria-label="編輯場域名稱" title="編輯場域名稱"><i class="ti ti-pencil"></i></button>` : ""}
        </div>`;
    }

    function renderList() {
      const terms = termsOf(S.query);
      const all = KFFields.all();
      const recent = KFFields.getRecent();
      let html = "";
      if (!terms.length) {
        // 最近使用：最多 3 個，目前場域排第一
        const cur = KFFields.getCurrent();
        let ids = recent.map((r) => r.id);
        if (cur && ids.includes(cur.id)) ids = [cur.id, ...ids.filter((x) => x !== cur.id)];
        const recentFields = ids.slice(0, 3).map(KFFields.byId).filter(Boolean);
        if (recentFields.length) html += `<h3 class="fsh-section">最近使用</h3>${recentFields.map((f) => rowHTML(f, terms)).join("")}`;
        const sorted = sortFields(all, recent);
        html += `<h3 class="fsh-section">全部場域（${sorted.length}）</h3>${sorted.map((f) => rowHTML(f, terms)).join("")}`;
      } else {
        const matched = sortFields(
          all.filter((f) => {
            const n = norm(f.name);
            return terms.every((t) => n.includes(t));
          }),
          recent,
        );
        if (!matched.length) {
          const q = KFFields.clean(S.query);
          list.innerHTML = `
            <div class="fsh-empty">
              <i class="ti ti-map-search"></i>
              <div class="fsh-empty-text">找不到「${esc(q)}」相關場域</div>
              <button class="fsh-empty-add" type="button" data-act="add-query"><i class="ti ti-plus"></i>新增「${esc(q)}」為場域</button>
            </div>`;
          return;
        }
        html += `<h3 class="fsh-section">搜尋結果（${matched.length}）</h3>${matched.map((f) => rowHTML(f, terms)).join("")}`;
      }
      list.innerHTML = html;
    }

    function select(fid) {
      if (S.selectedId === fid) return;
      S.selectedId = fid;
      list.querySelectorAll(".fsh-row").forEach((row) => {
        const on = row.dataset.id === fid;
        row.classList.toggle("is-selected", on);
        row.querySelector(".fsh-pick").setAttribute("aria-checked", String(on));
        // 單選鈕小彈跳
        const radio = row.querySelector(".fsh-radio");
        radio.classList.remove("pop");
        if (on) {
          void radio.offsetWidth;
          radio.classList.add("pop");
        }
      });
    }

    function confirm() {
      const field = KFFields.byId(S.selectedId);
      if (!field) {
        list.classList.remove("shake");
        void list.offsetWidth; // 重新觸發動畫
        list.classList.add("shake");
        toast("請先選擇場域");
        return;
      }
      opts.onConfirm?.(field);
    }

    /* ── 畫面切換 ── */
    function showView(which, instant = false) {
      const toForm = which === "form";
      [listView, formView].forEach((v) => v.classList.toggle("no-anim", instant || REDUCED));
      listView.classList.toggle("is-off-left", toForm);
      formView.classList.toggle("is-off-right", !toForm);
      listView.inert = toForm;
      formView.inert = !toForm;
      if (instant) requestAnimationFrame(() => [listView, formView].forEach((v) => v.classList.remove("no-anim")));
    }

    /* ── 新增／編輯表單 ── */
    function setError(msg) {
      errorBox.hidden = !msg;
      errorBox.querySelector("span").textContent = msg || "";
      input.classList.toggle("is-error", !!msg);
      input.setAttribute("aria-invalid", msg ? "true" : "false");
    }
    function syncForm() {
      const n = KFFields.clean(input.value);
      const len = [...n].length;
      saveBtn.disabled = !n;
      countEl.textContent = `${len}／${KFFields.NAME_MAX}`;
      countEl.classList.toggle("is-over", len > KFFields.NAME_MAX);
    }
    function openForm(mode, { fid = null, name = "" } = {}) {
      S.mode = mode;
      S.editId = fid;
      S.formFrom = document.activeElement;
      const edit = mode === "edit";
      $(".fsh-form-title").textContent = edit ? "編輯場域" : "新增場域";
      $(".fsh-hint").textContent = edit ? "儲存後，各處都會顯示新的名稱" : "新增後會自動選取這個場域";
      saveBtn.innerHTML = edit ? '儲存 <i class="ti ti-check"></i>' : '新增並選取 <i class="ti ti-check"></i>';
      input.value = name;
      setError("");
      syncForm();
      $(".fsh-form").scrollTop = 0;
      showView("form");
      // 自動聚焦；有帶入文字時游標放在最後
      input.focus({ preventScroll: true });
      const end = input.value.length;
      try {
        input.setSelectionRange(end, end);
      } catch (e) {}
    }
    function backToList() {
      S.mode = "list";
      S.editId = null;
      input.blur();
      setError("");
      showView("list");
      // 焦點回到開啟表單的按鈕（重新渲染後找同一個場域的鉛筆），找不到就回搜尋框
      const back = S.formFrom?.isConnected ? S.formFrom : null;
      (back || search).focus({ preventScroll: true });
    }
    function submit() {
      const value = input.value;
      if (S.mode === "edit") {
        const r = KFFields.rename(S.editId, value);
        if (r.error) {
          setError(r.error);
          input.focus({ preventScroll: true });
          return;
        }
        renderList(); // 保留原本的搜尋字與選取
        const fid = r.field.id;
        backToList();
        list.querySelector(`.fsh-row[data-id="${CSS.escape(fid)}"] .fsh-edit`)?.focus({ preventScroll: true });
        toast(`已更新為 ${r.field.name}`);
        opts.onRename?.(r.field);
        return;
      }
      const r = KFFields.add(value);
      if (r.error) {
        setError(r.error);
        input.focus({ preventScroll: true });
        return;
      }
      input.blur();
      S.selectedId = r.field.id;
      opts.onConfirm?.(r.field); // 和「點選該場域後確認」完全相同的流程
    }

    /* ── 開關 ── */
    function open({ sub = "", selectedId = null } = {}) {
      bindViewport();
      S.open = true;
      S.query = "";
      S.selectedId = selectedId;
      S.lastFocus = document.activeElement;
      search.value = "";
      clear.hidden = true;
      $(`#${id}-sub`).textContent = sub;
      showView("list", true);
      renderList();
      list.scrollTop = 0;
      sheet.style.transform = "";
      sheet.classList.add("is-open");
      sheet.setAttribute("aria-hidden", "false");
      mask?.classList.add("is-open");
      document.body.classList.add(...(opts.bodyClasses || []));
      if (app) app.inert = true;
    }
    function close() {
      if (!S.open) return;
      S.open = false;
      document.activeElement?.blur?.();
      sheet.style.transform = "";
      sheet.classList.remove("is-open");
      sheet.setAttribute("aria-hidden", "true");
      mask?.classList.remove("is-open");
      document.body.classList.remove(...(opts.bodyClasses || []));
      if (app) app.inert = false;
      S.lastFocus?.focus?.({ preventScroll: true });
      // 面板收合後回到列表畫面
      setTimeout(() => !S.open && showView("list", true), 500);
    }
    // Esc：表單 → 回列表；列表 → 關閉；回傳是否有處理
    function escape() {
      if (!S.open) return false;
      if (S.mode !== "list") backToList();
      else close();
      return true;
    }

    /* ── 事件 ── */
    sheet.querySelectorAll(".fsh-close").forEach((b) => b.addEventListener("click", close));
    mask?.addEventListener("click", close);
    $(".fsh-confirm").addEventListener("click", confirm);
    $(".fsh-back").addEventListener("click", backToList);
    $(".fsh-add").addEventListener("click", () => openForm("add"));
    list.addEventListener("animationend", (e) => e.target === list && list.classList.remove("shake"));

    // 點鉛筆＝編輯（不選取）；點列的其他部分＝選取
    list.addEventListener("click", (e) => {
      if (e.target.closest('[data-act="add-query"]')) return openForm("add", { name: KFFields.clean(S.query) });
      const row = e.target.closest(".fsh-row");
      if (!row) return;
      if (e.target.closest(".fsh-edit")) {
        const f = KFFields.byId(row.dataset.id);
        if (f) openForm("edit", { fid: f.id, name: f.name });
        return;
      }
      select(row.dataset.id);
    });
    list.addEventListener("keydown", (e) => {
      const pick = e.target.closest?.(".fsh-pick");
      if (pick && e.target === pick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        select(pick.closest(".fsh-row").dataset.id);
      }
    });

    // 搜尋：即時篩選
    search.addEventListener("input", () => {
      S.query = search.value;
      clear.hidden = !S.query;
      renderList();
      list.scrollTop = 0;
    });
    clear.addEventListener("click", (e) => {
      e.preventDefault();
      search.value = "";
      search.dispatchEvent(new Event("input"));
      search.focus({ preventScroll: true });
    });

    // 表單：輸入時清掉錯誤、更新按鈕；Enter 或按鈕送出
    input.addEventListener("input", () => {
      if (!errorBox.hidden) setError("");
      syncForm();
    });
    $(".fsh-form").addEventListener("submit", (e) => {
      e.preventDefault();
      submit();
    });
    // Enter 一律送出驗證（名稱空白時主按鈕停用，瀏覽器不會自動送出，這裡自己處理才能顯示「請輸入場域名稱」）
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.isComposing) {
        e.preventDefault();
        submit();
      }
    });
    // 鍵盤彈出、可見高度改變：讓輸入框保持在可見範圍
    window.visualViewport?.addEventListener("resize", () => {
      if (S.open && S.mode !== "list" && document.activeElement === input) input.scrollIntoView({ block: "nearest" });
    });

    // 把手與標題列：往下拖跟手移動，放開時超過 120 單位關閉，否則彈回
    let drag = null;
    // 1 --u 是幾 px（頁面有 unitPx() 時用它）
    const unitPx = () => (typeof window.unitPx === "function" ? window.unitPx() : 1);
    sheet.addEventListener("pointerdown", (e) => {
      if (!S.open || !e.target.closest("[data-drag]") || e.target.closest("button, input")) return;
      drag = { y: e.clientY, dy: 0, el: e.target.closest("[data-drag]") };
      drag.el.setPointerCapture(e.pointerId);
      sheet.classList.add("is-dragging");
    });
    sheet.addEventListener("pointermove", (e) => {
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
      if (dy > 120 * unitPx()) close();
    };
    sheet.addEventListener("pointerup", endDrag);
    sheet.addEventListener("pointercancel", endDrag);

    return {
      open,
      close,
      escape,
      renderList,
      get isOpen() {
        return S.open;
      },
      get selectedId() {
        return S.selectedId;
      },
      get mode() {
        return S.mode;
      },
    };
  }

  window.FieldSheet = { create };
})();
