/* =========================================================
 * 共用語系選擇：Language 按鈕＋畫面正中央的滾輪對話框（首頁、行走／SPPB 詳細頁共用）
 * 需要：css/wheel.css、css/lang-picker.css、js/wheel.js（先載入）、Tabler icons
 *
 *   LangPicker.buttonHTML("light" | "dark")  產生按鈕（淺底：首頁、過期／無權限卡片；深底：詳細頁頂帶）
 *   LangPicker.current()                     目前語系（sessionStorage「kf.lang」，預設 zh-TW）
 *   LangPicker.open(triggerEl)               開啟彈窗（按鈕已用事件委派綁好，一般不用自己呼叫）
 *
 * 按「確定」才套用：寫入 sessionStorage「kf.lang」（zh-TW／ja／en），
 * 語系有改變時在 document 觸發 "kf:langchange"（event.detail = { lang, prev }）給頁面使用
 * 點遮罩、按「取消」、按 Esc：關閉且不變更
 * ========================================================= */
(function () {
  const LANGS = ["zh-TW", "ja", "en"];
  // 每個選項顯示自己的語言名稱（不翻譯）
  const NAMES = { "zh-TW": "繁體中文", ja: "日本語", en: "English" };
  // 「取消／確定」跟著目前語系
  const DICT = {
    "zh-TW": { cancel: "取消", ok: "確定" },
    ja: { cancel: "キャンセル", ok: "決定" },
    en: { cancel: "Cancel", ok: "Done" },
  };

  function current() {
    try {
      const v = sessionStorage.getItem("kf.lang");
      if (LANGS.includes(v)) return v;
    } catch (e) {}
    // 詳細頁可能用網址 ?lang= 指定（js/detail-i18n.js 會同步寫入 kf.lang）
    const l = document.documentElement.lang;
    return LANGS.includes(l) ? l : "zh-TW";
  }

  // 按鈕：「Language」固定英文
  function buttonHTML(variant = "light") {
    return `<button type="button" class="lp-btn lp-btn--${variant === "dark" ? "dark" : "light"}" data-lang-picker aria-label="Language" aria-haspopup="dialog" lang="en" data-html2canvas-ignore><i class="ti ti-world" aria-hidden="true"></i>Language</button>`;
  }

  /* ── 彈窗：第一次開啟時建立 ── */
  let root = null;
  let wheel = null;
  let isOpen = false;
  let trigger = null;

  function build() {
    root = document.createElement("div");
    root.className = "lp-root";
    root.setAttribute("data-html2canvas-ignore", "");
    root.innerHTML = `
      <div class="lp-mask"></div>
      <section class="lp-dialog" role="dialog" aria-modal="true" aria-labelledby="lpTitle" aria-hidden="true">
        <h2 class="lp-title" id="lpTitle" lang="en"><i class="ti ti-world" aria-hidden="true"></i>Language</h2>
        <div class="lp-wheels">
          <div class="lp-band"></div>
          <div class="wheel lp-wheel"></div>
        </div>
        <div class="lp-actions">
          <button type="button" class="lp-cancel"></button>
          <button type="button" class="lp-ok"></button>
        </div>
      </section>`;
    document.body.appendChild(root);

    wheel = createWheel(root.querySelector(".lp-wheel"), {
      keyboard: true,
      label: "Language",
      onEnter: () => close(true),
    });
    wheel.fill(LANGS.map((l) => ({ label: NAMES[l], lang: l })));

    root.querySelector(".lp-mask").addEventListener("click", () => close(false));
    root.querySelector(".lp-cancel").addEventListener("click", () => close(false));
    root.querySelector(".lp-ok").addEventListener("click", () => close(true));

    // Esc 關閉；Tab 只在彈窗內循環
    root.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      } else if (e.key === "Tab") {
        const f = [...root.querySelectorAll(".lp-wheel, .lp-cancel, .lp-ok")];
        const i = f.indexOf(document.activeElement);
        const next = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : i === f.length - 1 ? 0 : i + 1;
        e.preventDefault();
        f[next].focus();
      }
    });
  }

  function open(btn) {
    if (isOpen) return;
    if (!root) build();
    isOpen = true;
    trigger = btn || document.activeElement;
    const lang = current();
    const cancel = root.querySelector(".lp-cancel");
    const ok = root.querySelector(".lp-ok");
    cancel.textContent = DICT[lang].cancel;
    ok.textContent = DICT[lang].ok;
    cancel.lang = ok.lang = lang;

    root.classList.add("is-open");
    root.querySelector(".lp-dialog").setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("lp-lock");
    // 打開時直接停在目前語系（不播捲動動畫）
    const v = LANGS.indexOf(lang) + 1;
    wheel.scrollTo(v, false);
    wheel.markCenter(v);
    wheel.el.focus({ preventScroll: true });
  }

  function close(apply) {
    if (!isOpen) return;
    isOpen = false;
    const chosen = LANGS[wheel.value() - 1];
    root.classList.remove("is-open");
    root.querySelector(".lp-dialog").setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("lp-lock");
    trigger?.focus?.({ preventScroll: true });
    if (!apply) return;
    const prev = current();
    try {
      sessionStorage.setItem("kf.lang", chosen);
    } catch (e) {}
    if (chosen !== prev) {
      document.dispatchEvent(new CustomEvent("kf:langchange", { detail: { lang: chosen, prev } }));
    }
  }

  // 按鈕：事件委派（按鈕可能之後才由 JS 產生，例如過期頁）
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang-picker]");
    if (btn) open(btn);
  });

  window.LangPicker = { LANGS, NAMES, current, buttonHTML, open, close, get isOpen() { return isOpen; } };
})();
