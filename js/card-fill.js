/* =========================================================
 * 共用「健保卡自動帶入」提示區塊（樣式 css/card-fill.css）：受測名單、受測者頁的新增人員面板
 *
 *   const cardFill = CardFill.create({
 *     sheet,                                  // 面板
 *     before,                                 // 區塊插在這個元素前面（第一個欄位）
 *     lock: [el, …],                          // 讀取中不可操作的區域
 *     canInsert(),                            // 現在可不可以帶入（面板開啟且為新增模式）
 *     steps: [{ flash: el, apply(data) }, …], // 依序帶入的欄位；apply 後 flash 元素閃一次
 *   });
 *   cardFill.insert(data)  讀卡帶入：{ name, gender: "男"|"女", birth: { rocYear, month, day } }
 *   cardFill.reset()       回到初始狀態（並取消進行中的讀取）
 *   cardFill.show(bool)    顯示／隱藏整個區塊（編輯模式不顯示）
 * ========================================================= */
(function () {
  const DEMO_TOOLS = true; // 展示用「模擬讀卡」按鈕；正式上線改成 false（說明文字保留）
  // 模擬讀卡的資料：每按一次換下一筆
  const DEMO_CARDS = [
    { name: "王小明", gender: "男", birth: { rocYear: 50, month: 3, day: 15 } },
    { name: "陳美玲", gender: "女", birth: { rocYear: 45, month: 11, day: 2 } },
    { name: "林志豪", gender: "男", birth: { rocYear: 38, month: 7, day: 28 } },
  ];
  const READ_MS = 1500; // 讀取中
  const STEP_MS = 180; // 欄位依序帶入的間隔
  const FLASH_MS = 800; // 與 css/card-fill.css 的 cfFlash 相同
  const TEXT = {
    idle: "插入健保卡，可自動帶入姓名、性別與出生年月日",
    reading: "讀取中…",
    done: "已從健保卡帶入資料，請確認後按確認新增",
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  function create({ sheet, before, lock, canInsert, steps }) {
    const box = document.createElement("div");
    box.className = "cf";
    box.innerHTML = `
      <span class="cf-icon"><i class="ti ti-id" aria-hidden="true"></i></span>
      <span class="cf-text" role="status"></span>
      ${DEMO_TOOLS ? '<button class="cf-demo" type="button">模擬讀卡</button>' : ""}`;
    before.before(box);
    const icon = box.querySelector(".cf-icon .ti");
    const text = box.querySelector(".cf-text");
    const demo = box.querySelector(".cf-demo");

    let demoIndex = 0;
    let busy = false;
    let timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));

    function setState(state) {
      box.classList.toggle("is-reading", state === "reading");
      box.classList.toggle("is-done", state === "done");
      icon.className = `ti ${state === "done" ? "ti-circle-check" : "ti-id"}`;
      text.textContent = TEXT[state];
    }
    function setBusy(v) {
      busy = v;
      sheet.classList.toggle("cf-locked", v);
      lock.forEach((el) => (el.inert = v));
      if (demo) demo.disabled = v;
    }
    function flash(el) {
      if (reduced.matches) return;
      el.classList.remove("cf-flash");
      void el.offsetWidth; // 連續帶入時重新觸發
      el.classList.add("cf-flash");
      later(() => el.classList.remove("cf-flash"), FLASH_MS);
    }
    function applyStep(step, data) {
      step.apply(data);
      flash(step.flash);
    }
    function finish(refocus) {
      setBusy(false);
      setState("done");
      if (refocus && demo) demo.focus({ preventScroll: true });
    }

    // 讀取中 → 依序帶入 → 完成；減少動態效果時直接顯示結果
    function insert(data) {
      if (!data || busy || !canInsert()) return false;
      const refocus = document.activeElement === demo;
      timers.forEach(clearTimeout);
      timers = [];
      steps.forEach((s) => s.flash.classList.remove("cf-flash"));
      if (reduced.matches) {
        steps.forEach((s) => applyStep(s, data));
        finish(false);
        return true;
      }
      document.activeElement?.blur?.(); // 姓名欄正在輸入時先收起鍵盤
      setBusy(true);
      setState("reading");
      later(() => sheet.classList.remove("cf-locked"), READ_MS); // 開始帶入：欄位不再淡化，閃光才清楚（全部帶入後才可操作）
      steps.forEach((s, i) => later(() => applyStep(s, data), READ_MS + i * STEP_MS));
      later(() => finish(refocus), READ_MS + (steps.length - 1) * STEP_MS);
      return true;
    }
    function reset() {
      timers.forEach(clearTimeout);
      timers = [];
      steps.forEach((s) => s.flash.classList.remove("cf-flash"));
      setBusy(false);
      setState("idle");
    }

    demo?.addEventListener("click", () => {
      if (insert(DEMO_CARDS[demoIndex])) demoIndex = (demoIndex + 1) % DEMO_CARDS.length;
    });
    reset();
    return { insert, reset, show: (v) => (box.hidden = !v) };
  }

  window.CardFill = { create };
})();
