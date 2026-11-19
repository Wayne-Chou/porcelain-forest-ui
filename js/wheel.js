/* =========================================================
 * 共用滾輪（上下滑動、置中吸附）：受測名單「新增人員」生日、語系選擇彈窗共用
 * 樣式在 css/wheel.css；外層的選取帶、淡出漸層、可見列數由各頁自行排版
 *
 *   const w = createWheel(el, {
 *     onScroll(),          // 捲動中（每個影格一次）：例如即時預覽
 *     onSettle(value),     // 捲動停止：確定該欄的值
 *     keyboard: true,      // 可聚焦，方向鍵／Home／End 移動，Enter 呼叫 onEnter
 *     onEnter(value),
 *     label: "Language",   // 啟用 keyboard 時的 aria-label
 *   });
 *   w.fill([{ label, disabled, lang }])  選項值 = 索引 + 1
 *   w.value()  w.scrollTo(v, smooth)  w.markCenter()  w.setDisabled(maxAllowed)  w.count
 * ========================================================= */
(function () {
  let uid = 0;
  const hasScrollEnd = "onscrollend" in window;

  function createWheel(el, opts = {}) {
    const id = "wheel" + ++uid;
    let target = null; // 鍵盤或程式捲動的目的地（平滑捲動途中 value() 以它為準）

    // 用 CSS 計算出的精確小數高度（不受彈窗縮放動畫影響），捲動位置才不會累積誤差
    const itemH = () => {
      const item = el.querySelector(".wheel-item");
      return (item && parseFloat(getComputedStyle(item).height)) || 44;
    };

    const api = {
      el,
      count: 0,
      fill(items) {
        let html = '<div class="wheel-pad"></div>';
        items.forEach((it, i) => {
          const v = i + 1;
          html += `<div class="wheel-item${it.disabled ? " is-disabled" : ""}" data-v="${v}" id="${id}-${v}"${opts.keyboard ? ' role="option" aria-selected="false"' : ""}${it.lang ? ` lang="${it.lang}"` : ""}>${it.label}</div>`;
        });
        el.innerHTML = html + '<div class="wheel-pad"></div>';
        api.count = items.length;
        el.dataset.count = items.length;
      },
      // 目前在中央的選項值
      value() {
        if (target != null) return target;
        const i = Math.round(el.scrollTop / itemH());
        return Math.max(1, Math.min(api.count, i + 1));
      },
      scrollTo(v, smooth) {
        v = Math.max(1, Math.min(api.count, v));
        const top = (v - 1) * itemH();
        // 已經在該位置時不會觸發 scrollend，不記目的地
        target = smooth && Math.abs(el.scrollTop - top) >= 1 ? v : null;
        el.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
        if (smooth) api.markCenter(v);
      },
      // 標出中央選項（未指定時依目前捲動位置）
      markCenter(v = api.value()) {
        el.querySelectorAll(".wheel-item").forEach((item) => {
          const on = Number(item.dataset.v) === v;
          item.classList.toggle("is-center", on);
          if (opts.keyboard) item.setAttribute("aria-selected", String(on));
        });
        if (opts.keyboard) el.setAttribute("aria-activedescendant", `${id}-${v}`);
      },
      setDisabled(maxAllowed) {
        el.querySelectorAll(".wheel-item").forEach((item) => {
          item.classList.toggle("is-disabled", Number(item.dataset.v) > maxAllowed);
        });
      },
    };

    let raf;
    let timer;
    const settle = () => {
      target = null;
      api.markCenter();
      opts.onSettle?.(api.value());
    };
    el.addEventListener("scroll", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (target == null) api.markCenter();
        opts.onScroll?.();
      });
      // 不支援 scrollend 時，用 120ms 防抖判斷捲動停止
      if (!hasScrollEnd) {
        clearTimeout(timer);
        timer = setTimeout(settle, 120);
      }
    });
    if (hasScrollEnd) el.addEventListener("scrollend", settle);
    // 手指或滾輪介入時，放棄鍵盤的目的地，改以實際位置為準
    ["pointerdown", "wheel", "touchstart"].forEach((type) =>
      el.addEventListener(type, () => (target = null), { passive: true }),
    );

    // 點擊非中央的選項：平滑捲動到該選項
    el.addEventListener("click", (e) => {
      const item = e.target.closest(".wheel-item");
      if (item && Number(item.dataset.v) !== api.value()) api.scrollTo(Number(item.dataset.v), true);
    });

    if (opts.keyboard) {
      el.tabIndex = 0;
      el.setAttribute("role", "listbox");
      if (opts.label) el.setAttribute("aria-label", opts.label);
      el.addEventListener("keydown", (e) => {
        const v = api.value();
        const next = { ArrowDown: v + 1, ArrowUp: v - 1, Home: 1, End: api.count, PageDown: v + 2, PageUp: v - 2 }[e.key];
        if (next !== undefined) {
          e.preventDefault();
          api.scrollTo(next, true);
        } else if (e.key === "Enter") {
          e.preventDefault();
          opts.onEnter?.(v);
        }
      });
    }
    return api;
  }

  window.createWheel = createWheel;
})();
