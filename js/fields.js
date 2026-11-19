/* =========================================================
 * 共用場域資料：首頁、鑑測紀錄、受測者、受測名單、測驗頁共用
 * 場域只有「名稱」一個欄位；各處一律用 id 對應，改名後各頁都顯示新名稱
 *
 * sessionStorage（關閉分頁即清除；讀寫都包 try/catch）
 *   kf.customFields  [{ id, name, createdAt }]：使用者在選擇場域面板新增的場域，id 以 c_ 開頭
 *   kf.currentField  { id, date }：目前場域；date 不是今天就當作沒有目前場域
 *   kf.recentFields  [{ id, usedAt }]：最近使用，最新在前，最多 20 筆（相容舊格式：純 id 陣列）
 *
 *   KFFields.all()            所有場域：自訂場域（新的在前）＋預設場域
 *   KFFields.byId(id)         找場域（找不到回傳 null）
 *   KFFields.isCustom(id)
 *   KFFields.validate(name, excludeId)  回傳錯誤訊息或 null
 *   KFFields.add(name) / rename(id, name)  先 validate，回傳 { field } 或 { error }
 *   KFFields.getCurrent() / setCurrent(id) / getRecent()
 * ========================================================= */
(function () {
  // 預設場域（假資料）
  // TODO：之後改成從後端 API 讀取，例如 const fields = await fetch("/api/fields").then((r) => r.json());
  const BASE = [
    { id: "tpe-01", name: "大安社區關懷據點" },
    { id: "tpe-02", name: "信義長照中心" },
    { id: "tpe-03", name: "中正區活動中心" },
    { id: "tpe-04", name: "北投社區關懷據點" },
  ];
  const KEYS = { custom: "kf.customFields", current: "kf.currentField", recent: "kf.recentFields" };
  const RECENT_MAX = 20;
  const NAME_MAX = 30;

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

  // 自訂場域：格式不對的資料略過
  function customs() {
    const v = readJSON(KEYS.custom, []);
    if (!Array.isArray(v)) return [];
    return v
      .filter((f) => f && typeof f.id === "string" && f.id.startsWith("c_") && typeof f.name === "string")
      .map((f) => ({ id: f.id, name: f.name, createdAt: Number(f.createdAt) || 0, custom: true }));
  }
  function all() {
    const c = customs().sort((a, b) => b.createdAt - a.createdAt); // 新的在前
    return [...c, ...BASE];
  }
  const byId = (id) => all().find((f) => f.id === id) || null;
  const isCustom = (id) => typeof id === "string" && id.startsWith("c_") && !!byId(id);

  // 比對同名：忽略前後空白、全形／半形空白（全部去掉）、全形英數（NFKC）、英文大小寫
  const sameKey = (s) => String(s).normalize("NFKC").replace(/[\s　]+/g, "").toLowerCase();
  const clean = (s) => String(s ?? "").replace(/^[\s　]+|[\s　]+$/g, "");

  function validate(name, excludeId = null) {
    const n = clean(name);
    if (!n) return "請輸入場域名稱";
    if ([...n].length > NAME_MAX) return `場域名稱最多 ${NAME_MAX} 字`;
    const key = sameKey(n);
    if (all().some((f) => f.id !== excludeId && sameKey(f.name) === key)) return "此場域已存在";
    return null;
  }

  function newId() {
    const used = new Set(all().map((f) => f.id));
    let id;
    do {
      id = `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    } while (used.has(id));
    return id;
  }

  function add(name) {
    const error = validate(name);
    if (error) return { error };
    const field = { id: newId(), name: clean(name), createdAt: Date.now() };
    writeJSON(KEYS.custom, [...customs().map(({ id, name, createdAt }) => ({ id, name, createdAt })), field]);
    return { field: { ...field, custom: true } };
  }

  function rename(id, name) {
    if (!id?.startsWith("c_")) return { error: "只能編輯自訂場域" };
    const error = validate(name, id);
    if (error) return { error };
    const list = customs().map(({ id, name, createdAt }) => ({ id, name, createdAt }));
    const f = list.find((x) => x.id === id);
    if (!f) return { error: "找不到這個場域" };
    f.name = clean(name);
    writeJSON(KEYS.custom, list);
    return { field: { ...f, custom: true } };
  }

  // 最近使用：最新在前；舊格式（純 id 陣列）依原順序換算成時間戳；不存在的場域略過
  function getRecent() {
    const raw = readJSON(KEYS.recent, []);
    if (!Array.isArray(raw)) return [];
    const ids = new Set(all().map((f) => f.id));
    const now = Date.now();
    const seen = new Set();
    return raw
      .map((r, i) => (typeof r === "string" ? { id: r, usedAt: now - (i + 1) } : { id: r?.id, usedAt: Number(r?.usedAt) || 0 }))
      .filter((r) => ids.has(r.id) && !seen.has(r.id) && seen.add(r.id))
      .sort((a, b) => b.usedAt - a.usedAt)
      .slice(0, RECENT_MAX);
  }
  // 目前場域（只算今天）
  function getCurrent() {
    const v = readJSON(KEYS.current, null);
    if (!v || v.date !== todayStr()) return null;
    return byId(v.id);
  }
  // 目前場域的原始紀錄（不論日期），給「沒有今天的目前場域時」往下找用
  function getCurrentAnyDay() {
    const v = readJSON(KEYS.current, null);
    return (v && byId(v.id)) || null;
  }
  // 設為目前場域並加入最近使用
  function setCurrent(id) {
    writeJSON(KEYS.current, { id, date: todayStr() });
    const rest = getRecent().filter((r) => r.id !== id);
    writeJSON(KEYS.recent, [{ id, usedAt: Date.now() }, ...rest].slice(0, RECENT_MAX));
  }

  window.KFFields = {
    BASE,
    KEYS,
    NAME_MAX,
    all,
    byId,
    isCustom,
    customs,
    validate,
    add,
    rename,
    clean,
    getRecent,
    getCurrent,
    getCurrentAnyDay,
    setCurrent,
    todayStr,
  };
})();
