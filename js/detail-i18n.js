/* =========================================================
 * 詳細報告多語系（detail-gait.html、detail-sppb.html 共用）
 * 語系：zh-TW 繁體中文、ja 日本語、en English
 * 來源優先順序：網址 ?lang= → sessionStorage「kf.lang」→ 預設 zh-TW
 * 用法：
 *   t(key, params)        取得目前語系的文字；params 代入 {name}
 *   I18N.apply(root)      套用 data-i18n（文字）、data-i18n-html（含 <br>／<strong>）、
 *                         data-i18n-alt、data-i18n-aria
 *   I18N.set(lang)        切換語系：更新 <html lang>、網址參數、sessionStorage，觸發 document 的 "langchange"
 * 語系選擇：共用的 Language 按鈕＋滾輪彈窗（js/lang-picker.js），按確定後觸發 "kf:langchange"，這裡接手呼叫 set()
 * 不翻譯：API 給的最新消息標題與內容、姓名
 * ========================================================= */
(function () {
  const LANGS = ["zh-TW", "ja", "en"];
  const IDX = { "zh-TW": 0, ja: 1, en: 2 };

  /* 文字對照：key: [繁體中文, 日本語, English] */
  const T = {
    /* ── 共用：頁面、hero、儲存 ── */
    "gait.docTitle": ["步態分析詳細報告", "歩行分析 詳細レポート", "Gait Analysis Report"],
    "gait.eyebrow": ["行走測驗", "歩行テスト", "Walking test"],
    "gait.heroTitle": ["步態分析<br />詳細報告", "歩行分析<br />詳細レポート", "Gait Analysis<br />Report"],
    "gait.modalDesc": [
      "是否將此份<strong>步態分析報告</strong>儲存為圖片？",
      "この<strong>歩行分析レポート</strong>を画像として保存しますか？",
      "Save this <strong>gait analysis report</strong> as an image?",
    ],
    "gait.file": ["步態分析報告", "歩行分析レポート", "Gait-Analysis-Report"],
    "gait.closing": [
      "本報告依行走測驗結果產生，僅供健康參考使用，不作為醫療診斷依據。如有任何疑問，請洽專業醫療人員進行進一步評估。祝您身體健康、步伐穩健！",
      "本レポートは歩行テストの結果をもとに作成したもので、健康の参考情報です。医学的な診断ではありません。ご不明な点は、医療の専門家にご相談ください。どうぞお元気で、しっかりした足取りで毎日をお過ごしください。",
      "This report is based on your walking test results and is for health reference only. It is not a medical diagnosis. If you have any questions, please consult a healthcare professional. Wishing you good health and steady steps!",
    ],
    "sppb.docTitle": ["SPPB 詳細報告", "SPPB 詳細レポート", "SPPB Detailed Report"],
    "sppb.eyebrow": ["簡易身體功能量表", "簡易身体機能評価（SPPB）", "Short Physical Performance Battery"],
    "sppb.heroTitle": ["SPPB<br />詳細報告", "SPPB<br />詳細レポート", "SPPB<br />Detailed Report"],
    "sppb.modalDesc": [
      "是否將此份<strong> SPPB 詳細報告</strong>儲存為圖片？",
      "この<strong>SPPB 詳細レポート</strong>を画像として保存しますか？",
      "Save this <strong>SPPB report</strong> as an image?",
    ],
    "sppb.file": ["SPPB詳細報告", "SPPB詳細レポート", "SPPB-Report"],
    "sppb.closing": [
      "本報告依 SPPB 簡易身體功能量表產生，僅供健康參考使用，不作為醫療診斷依據。如有任何疑問，請洽專業醫療人員進行進一步評估。祝您身體健康！",
      "本レポートは SPPB（簡易身体機能評価）の結果をもとに作成したもので、健康の参考情報です。医学的な診断ではありません。ご不明な点は、医療の専門家にご相談ください。どうぞお元気でお過ごしください。",
      "This report is based on the Short Physical Performance Battery (SPPB) and is for health reference only. It is not a medical diagnosis. If you have any questions, please consult a healthcare professional. Wishing you good health!",
    ],

    "save.btn": ["儲存此報告", "このレポートを保存", "Save this report"],
    "save.sub": ["點擊儲存圖片至相簿", "タップして画像を写真に保存", "Tap to save it as an image"],
    "save.left": ["儲存時效剩餘", "保存できる残り時間", "Time left to save:"],
    "countdown.dev": ["開發模式", "開発モード", "Dev mode"],
    "countdown.expired": ["已過期", "期限切れ", "Expired"],
    "countdown.days": ["{n} 天 ", "{n}日 ", "{n} d "],

    "modal.title": ["儲存分析報告", "レポートを保存", "Save report"],
    "modal.hint": [
      "報告將以圖檔方式存入您的相簿，<br />方便日後查閱或與家人分享。",
      "レポートは画像として写真に保存されます。<br />あとで見返したり、ご家族と共有したりできます。",
      "The report will be saved to your photos,<br />so you can view it later or share it with family.",
    ],
    "modal.expirePre": ["報告有效期限：1 天（剩餘 ", "レポートの有効期限：1日（残り ", "Report valid for 1 day ("],
    "modal.expirePost": ["）", "）", " left)"],
    "modal.save": ["儲存至相簿", "写真に保存", "Save to photos"],
    "modal.skip": ["略過，直接查看報告", "保存せずにレポートを見る", "Skip and view the report"],

    "alert.line": [
      "為了順利儲存報告圖片，請點擊右下角「⋯」選單，選擇「在瀏覽器中開啟」後再試一次",
      "レポート画像を保存するには、右下の「⋯」メニューから「ブラウザで開く」を選び、もう一度お試しください",
      "To save the report image, tap the “⋯” menu at the bottom right, choose “Open in browser”, and try again.",
    ],
    "alert.popup": [
      "無法開啟新視窗，請確認瀏覽器未封鎖彈出視窗",
      "新しいウィンドウを開けませんでした。ブラウザでポップアップがブロックされていないかご確認ください",
      "Couldn't open a new window. Please make sure pop-ups aren't blocked.",
    ],
    "alert.saveFail": ["儲存失敗：", "保存に失敗しました：", "Save failed: "],
    "ios.title": ["報告圖片", "レポート画像", "Report image"],
    "ios.generating": ["圖片產生中，請稍候…", "画像を作成しています。少々お待ちください…", "Creating the image, please wait…"],
    "ios.hold": [
      "長按下方圖片，選擇「儲存到照片」即可存到相簿",
      "下の画像を長押しし、「写真に保存」を選ぶと保存できます",
      "Press and hold the image below, then choose “Save to Photos”.",
    ],
    "ios.fail": ["產生圖片失敗，請關閉此頁重試", "画像の作成に失敗しました。このページを閉じて、もう一度お試しください", "Couldn't create the image. Please close this page and try again."],

    "api.risk": ["無法辨識的風險等級資料（riskLevel: {v}）", "リスクレベルのデータを認識できません（riskLevel: {v}）", "Unrecognized risk level data (riskLevel: {v})"],
    "api.network": [
      "網路連線失敗，無法取得報告資料，請稍後再試。",
      "ネットワークに接続できず、レポートを取得できませんでした。しばらくしてからもう一度お試しください。",
      "Network error. We couldn't load the report. Please try again later.",
    ],

    "expired.title": ["此報告已過期", "このレポートは期限切れです", "This report has expired"],
    "expired.desc": [
      "報告僅保留至檢測日隔天，如需查看請洽檢測人員",
      "レポートは測定日の翌日まで保存されます。ご覧になりたい場合は、測定担当者にお問い合わせください",
      "Reports are kept until the day after the test. Please contact the testing staff if you need to view it.",
    ],
    "unauth.title": ["您沒有訪問權限", "このレポートを表示する権限がありません", "You don't have access to this report"],
    "unauth.desc": ["無法開啟此報告，請確認連結是否正確", "このレポートを開けません。リンクが正しいかご確認ください", "This report can't be opened. Please check that the link is correct."],

    /* ── 基本資料、行動力狀態 ── */
    "sec.profile": ["個人資訊與行動力", "個人情報と移動能力", "Profile & mobility"],
    "card.profile": ["基本資料與行動力狀態", "基本情報と移動能力の状態", "Basic info & mobility status"],
    "pi.name": ["姓名", "お名前", "Name"],
    "pi.gender": ["性別", "性別", "Sex"],
    "pi.age": ["年紀", "年齢", "Age"],
    "pi.date": ["檢測日期", "測定日", "Test date"],
    "gender.1": ["男性", "男性", "Male"],
    "gender.0": ["女性", "女性", "Female"],
    "age": ["{n} 歲", "{n} 歳", "{n} yrs"],
    "guest": ["訪客", "ゲスト", "Guest"],
    "loading": ["載入中…", "読み込み中…", "Loading…"],
    "mobility.title": ["您的行動力狀態", "あなたの移動能力の状態", "Your mobility status"],
    "mobility.alt": ["平衡狀況示意圖", "バランスの状態のイラスト", "Illustration of your balance status"],
    "mobility.good.title": ["輕微搖晃", "軽い揺れ", "Slight sway"],
    "mobility.good.desc": [
      "身體保持穩定，僅有自然小幅晃動，重心維持於安全範圍",
      "体は安定しており、自然な小さな揺れのみです。重心は安全な範囲に保たれています",
      "Your body stays steady with only small, natural sway. Your center of balance stays within a safe range.",
    ],
    "mobility.warn.title": ["中度搖晃", "中程度の揺れ", "Moderate sway"],
    "mobility.warn.desc": [
      "身體出現明顯左右晃動，重心移動範圍增加，需要注意平衡能力",
      "体に左右の揺れがはっきり見られ、重心の動く範囲が広がっています。バランスに注意が必要です",
      "Your body sways noticeably from side to side and your balance shifts more widely. Please pay attention to your balance.",
    ],
    "mobility.danger.title": ["危險搖晃", "危険な揺れ", "Risky sway"],
    "mobility.danger.desc": [
      "身體大幅度晃動，重心偏移明顯，平衡能力下降，跌倒風險提高",
      "体が大きく揺れ、重心のずれが目立ちます。バランス能力が低下し、転倒リスクが高まっています",
      "Your body sways a lot and your balance shifts clearly. Balance has declined and fall risk is higher.",
    ],

    /* ── 風險評估 ── */
    "sec.risk": ["風險評估", "リスク評価", "Risk assessment"],
    "card.risk": ["跌倒風險等級評估", "転倒リスクの評価", "Fall risk level"],
    "risk.pill": ["目前程度", "現在の位置", "You are here"],
    "risk.name.low2": ["低風險", "低リスク", "Low"],
    "risk.name.low": ["稍低風險", "やや低リスク", "Slightly low"],
    "risk.name.medium": ["中度風險", "中程度リスク", "Moderate"],
    "risk.name.high": ["高風險", "高リスク", "High"],
    "risk.name.danger": ["危險", "危険", "Danger"],
    // 色條下方的短標籤
    "risk.lbl.low2": ["低", "低", "Low"],
    "risk.lbl.low": ["稍低", "やや低", "Mild"],
    "risk.lbl.medium": ["中", "中", "Mod."],
    "risk.lbl.high": ["高", "高", "High"],
    "risk.lbl.danger": ["危險", "危険", "Danger"],
    "risk.desc.low2": ["跌倒風險低，體能表現優異", "転倒リスクは低く、体力はとても良好です", "Low fall risk with excellent physical performance"],
    "risk.desc.low": ["跌倒風險稍低，狀況良好", "転倒リスクはやや低く、良好な状態です", "Slightly low fall risk; you are in good condition"],
    "risk.desc.medium": ["跌倒風險中等，持續關注為佳", "転倒リスクは中程度です。引き続き気をつけましょう", "Moderate fall risk; keep an eye on it"],
    "risk.desc.high": ["跌倒風險較高，建議積極改善", "転倒リスクが高めです。積極的な改善をおすすめします", "Higher fall risk; we recommend taking steps to improve"],
    "risk.desc.danger": ["目前跌倒風險偏高，請特別注意", "現在、転倒リスクが高い状態です。特にご注意ください", "Your fall risk is currently high; please take extra care"],

    /* ── 步態數據、步行、晃動 ── */
    "sec.gait": ["步態指標", "歩行の指標", "Gait indicators"],
    "card.gait": ["步態數據指標", "歩行データ", "Gait data"],
    "term.speed": ["步行速度", "歩行速度", "Gait speed"],
    "term.sway": ["身體晃動程度", "体の揺れ", "Body sway"],
    "common.unable": ["無法完成", "実施できず", "Unable to complete"],
    "walk.pill.4": ["正常範圍", "正常範囲", "Normal range"],
    "walk.pill.3": ["稍慢，需留意", "やや遅め（要注意）", "Slightly slow"],
    "walk.pill.2": ["偏慢，需加強", "遅め（要強化）", "Slow — needs work"],
    "walk.pill.1": ["步速過慢，高風險", "とても遅い（高リスク）", "Very slow — high risk"],
    "walk.pill.0": ["無法完成", "実施できず", "Unable to complete"],
    "walk.desc.4": [
      "步行速度 {v} cm/s，符合 SPPB 滿分（4分）標準（> 83 cm/s），代表下肢肌力與協調能力良好，建議維持每日至少 30 分鐘的規律步行習慣。",
      "歩行速度は {v} cm/s で、SPPB の満点（4点）の基準（83 cm/s 超）を満たしています。脚の筋力と協調性は良好です。毎日30分以上歩く習慣を続けましょう。",
      "Your gait speed is {v} cm/s, meeting the SPPB full-score (4 points) standard (> 83 cm/s). This shows good leg strength and coordination. Keep walking at least 30 minutes a day.",
    ],
    "walk.desc.3": [
      "步行速度 {v} cm/s，符合 SPPB 3分標準（65～83 cm/s），代表下肢功能略有下降，建議增加日常步行量，並每週進行 2～3 次輕度肌力訓練，如深蹲、踮腳尖等動作。",
      "歩行速度は {v} cm/s で、SPPB 3点の基準（65〜83 cm/s）にあたります。脚の機能が少し低下しています。日常の歩く量を増やし、週2〜3回、スクワットやつま先立ちなどの軽い筋力トレーニングを行いましょう。",
      "Your gait speed is {v} cm/s, meeting the SPPB 3-point standard (65–83 cm/s). Leg function has declined slightly. Try to walk more each day and do light strength exercises, such as squats or heel raises, 2–3 times a week.",
    ],
    "walk.desc.2": [
      "步行速度 {v} cm/s，符合 SPPB 2分標準（46～64 cm/s），代表下肢功能明顯退化，建議諮詢專業人員進行評估與步態訓練，並同時檢視居家環境安全。",
      "歩行速度は {v} cm/s で、SPPB 2点の基準（46〜64 cm/s）にあたります。脚の機能がはっきり低下しています。専門家に相談して評価と歩行訓練を受け、あわせて住まいの安全も見直しましょう。",
      "Your gait speed is {v} cm/s, meeting the SPPB 2-point standard (46–64 cm/s). Leg function has clearly declined. Please consult a professional for an assessment and gait training, and check your home for safety.",
    ],
    "walk.desc.1": [
      "步行速度 {v} cm/s，符合 SPPB 1分標準（< 46 cm/s），代表下肢功能嚴重退化、跌倒風險高，建議就醫評估並接受專業復健介入，外出時應使用輔助器具以確保安全。",
      "歩行速度は {v} cm/s で、SPPB 1点の基準（46 cm/s 未満）にあたります。脚の機能が大きく低下し、転倒リスクが高い状態です。医療機関で評価を受け、専門的なリハビリを受けましょう。外出時は安全のため歩行補助具を使いましょう。",
      "Your gait speed is {v} cm/s, meeting the SPPB 1-point standard (< 46 cm/s). Leg function has declined significantly and fall risk is high. Please see a doctor for an assessment and professional rehabilitation, and use a walking aid when you go out.",
    ],
    "walk.desc.0": [
      "無法完成 4 公尺步行，下肢功能與平衡嚴重退化。建議儘速就醫評估，外出務必使用輔具並有人陪同。",
      "4メートルの歩行を行うことができませんでした。脚の機能とバランスが大きく低下しています。早めに医療機関で評価を受け、外出時は必ず歩行補助具を使い、付き添いの方と一緒に行動しましょう。",
      "You were unable to complete the 4-meter walk, which shows a significant decline in leg function and balance. Please see a doctor soon, and always use a walking aid and have someone with you when going out.",
    ],
    "sway.word.low": ["輕微", "軽度", "Slight"],
    "sway.word.medium": ["中", "中度", "Moderate"],
    "sway.word.high": ["高", "高度", "High"],
    "sway.pill.low": ["良好", "良好", "Good"],
    "sway.pill.medium": ["需注意", "要注意", "Caution"],
    "sway.pill.high": ["危險", "危険", "Danger"],
    "sway.desc.low": [
      "行走時身體晃動幅度輕微，表示動態平衡與核心穩定度良好，建議持續進行平衡訓練（如太極、瑜伽），以維持現有表現。",
      "歩くときの体の揺れは小さく、動きの中でのバランスと体幹の安定性は良好です。太極拳やヨガなどのバランス練習を続けて、今の状態を保ちましょう。",
      "Your body sways only slightly while walking, showing good dynamic balance and core stability. Keep up balance exercises such as tai chi or yoga to maintain this.",
    ],
    "sway.desc.medium": [
      "行走時身體晃動達中等程度，顯示平衡控制有待加強，建議每日進行 10～15 分鐘的下肢肌力與平衡訓練，並留意行走環境的安全性。",
      "歩くときの体の揺れは中程度で、バランスを保つ力を高める必要があります。毎日10〜15分、脚の筋力とバランスの練習を行い、歩く場所の安全にも気を配りましょう。",
      "Your body sways moderately while walking, so balance control could be improved. Do 10–15 minutes of leg-strength and balance exercises daily, and watch for hazards where you walk.",
    ],
    "sway.desc.high": [
      "行走時身體晃動幅度偏高，跌倒風險顯著上升，建議諮詢專業人員，進行專業平衡評估與復健介入，外出時應考慮使用輔助器具。",
      "歩くときの体の揺れが大きく、転倒リスクが明らかに高まっています。専門家に相談してバランスの評価とリハビリを受け、外出時は歩行補助具の使用をご検討ください。",
      "Your body sways a lot while walking, which clearly raises fall risk. Please consult a professional for a balance assessment and rehabilitation, and consider using a walking aid when you go out.",
    ],

    /* ── 行動建議、衛教、消息 ── */
    "sec.actions": ["行動建議與衛教資訊", "おすすめの行動と健康情報", "Recommendations & health tips"],
    "card.actions": ["下一步行動建議與衛教資訊", "次のステップと健康情報", "Next steps & health tips"],
    "sub.actions": ["行動建議", "おすすめの行動", "Recommended actions"],
    "sub.edu": ["衛教資訊", "健康情報", "Health tips"],
    "edu.bannerAlt": [
      "長者六力 ICOPE 檢測：65 歲以上每年 1 次公費檢測，評估認知、視力、聽力、行動、營養、憂鬱六大面向",
      "高齢者の6つの力 ICOPE チェック：65歳以上は年1回、公費で受けられます。認知・視力・聴力・移動・栄養・気分の6項目を確認します",
      "ICOPE check for older adults: free once a year for ages 65+, covering cognition, vision, hearing, mobility, nutrition and mood",
    ],
    "news.tag": ["最新消息", "お知らせ", "News"],

    /* ── SPPB ── */
    "sppb.total": ["SPPB 總分", "SPPB 合計点", "SPPB total"],
    "vivi.A": ["失能者", "障害あり", "Disabled"],
    "vivi.B": ["衰弱者", "フレイル", "Frail"],
    "vivi.C": ["衰弱前期者", "プレフレイル", "Pre-frail"],
    "vivi.D": ["健康者", "健常", "Robust"],
    "sec.sppb": ["SPPB 項目", "SPPB の項目", "SPPB tests"],
    "card.sppb": ["三項測驗結果", "3つのテスト結果", "Results of the 3 tests"],
    "test.balance": ["平衡", "バランス", "Balance"],
    "test.chair": ["起坐", "椅子立ち上がり", "Chair stand"],
    "test.walk": ["步行", "歩行", "Walking"],
    "bal.sideBySide": ["並排站立", "閉脚立位", "Side-by-side stand"],
    "bal.semiTandem": ["半並排站立", "セミタンデム立位", "Semi-tandem stand"],
    "bal.tandem": ["直線站立", "タンデム立位", "Tandem stand"],
    "sppb.tests": ["三項測驗", "3つのテスト", "The three tests"],
    "unit.sideBySide": ["秒・並排", "秒・閉脚", "s · side-by-side"],
    "unit.semiTandem": ["秒・半並排", "秒・セミタンデム", "s · semi-tandem"],
    "unit.tandem": ["秒・直線", "秒・タンデム", "s · tandem"],
    "unit.chair": ["秒・五次", "秒・5回", "s · 5 stands"],
    "bal.skipped": ["未進行", "未実施", "Not done"],
    "bal.passed": ["達 10 秒", "10秒達成", "Reached 10 s"],
    "sec": ["{v} 秒", "{v} 秒", "{v} s"],
    "bal.pill.4": ["平衡良好", "バランス良好", "Good balance"],
    "bal.pill.3": ["平衡稍弱，需留意", "やや弱め（要注意）", "Slightly weak — take note"],
    "bal.pill.2": ["平衡偏弱，需加強", "弱め（要強化）", "Weak — needs work"],
    "bal.pill.1": ["平衡不足，高風險", "バランス不足（高リスク）", "Poor balance — high risk"],
    "bal.pill.0": ["無法完成", "実施できず", "Unable to complete"],
    "bal.desc.4": [
      "三種站姿皆達標，靜態平衡良好。建議持續每週 2 次平衡練習，如單腳站立、太極，維持現有表現。",
      "3つの立ち方すべてで基準を満たし、立っているときのバランスは良好です。片脚立ちや太極拳などのバランス練習を週2回続けて、今の状態を保ちましょう。",
      "You met the standard in all three stances, showing good standing balance. Keep doing balance exercises such as one-leg stands or tai chi twice a week to maintain this.",
    ],
    "bal.desc.3": [
      "直線站立未達 10 秒，靜態平衡略有下降。建議每日扶椅練習直線站立，逐步延長維持時間。",
      "タンデム立位が10秒に届かず、立っているときのバランスが少し低下しています。毎日いすにつかまってタンデム立位を練習し、少しずつ時間を延ばしましょう。",
      "You could not hold the tandem stand for 10 seconds, so standing balance has declined slightly. Practice the tandem stand daily while holding a chair, and gradually hold it longer.",
    ],
    "bal.desc.2": [
      "窄站姿難以維持，平衡能力明顯下降。建議在穩固支撐旁每日練習半並排與直線站立，並檢視居家防滑與扶手。",
      "足幅の狭い立ち方を保つのが難しく、バランス能力がはっきり低下しています。しっかりした支えのそばで、毎日セミタンデム立位とタンデム立位を練習し、住まいの滑り止めや手すりも見直しましょう。",
      "Narrow stances are hard to hold, showing a clear decline in balance. Practice the semi-tandem and tandem stands daily next to a sturdy support, and check your home for non-slip floors and handrails.",
    ],
    "bal.desc.1": [
      "僅能維持基本站姿，平衡能力不足、跌倒風險高。建議諮詢專業人員進行平衡訓練，練習時務必有人陪同或扶穩。",
      "基本的な立ち方しか保てず、バランス能力が不足し、転倒リスクが高い状態です。専門家に相談してバランス訓練を受け、練習の際は必ず誰かに付き添ってもらうか、しっかりつかまって行いましょう。",
      "You can only hold the basic stance; balance is poor and fall risk is high. Please consult a professional for balance training, and always have someone with you or hold onto something steady while practicing.",
    ],
    "bal.desc.0": [
      "無法維持並排站立 10 秒，平衡能力嚴重不足。建議就醫評估，日常活動應使用輔具並有人陪同。",
      "閉脚立位を10秒間保つことができず、バランス能力が大きく不足しています。医療機関で評価を受け、日常生活では補助具を使い、付き添いの方と一緒に行動しましょう。",
      "You could not hold the side-by-side stand for 10 seconds, showing a serious lack of balance. Please see a doctor for an assessment, and use an aid and have someone with you in daily activities.",
    ],
    "chair.pill.4": ["正常範圍", "正常範囲", "Normal range"],
    "chair.pill.3": ["稍慢，需留意", "やや遅め（要注意）", "Slightly slow"],
    "chair.pill.2": ["偏慢，需加強", "遅め（要強化）", "Slow — needs work"],
    "chair.pill.1": ["過慢，高風險", "とても遅い（高リスク）", "Very slow — high risk"],
    "chair.pill.0": ["無法完成", "実施できず", "Unable to complete"],
    "chair.desc.4": [
      "五次起坐 {x} 秒，符合 4 分標準（≤ 11.19 秒），下肢肌力良好。建議持續每週 2 次肌力訓練維持現有表現。",
      "5回椅子立ち上がりは {x} 秒で、4点の基準（11.19秒以下）を満たしています。脚の筋力は良好です。週2回の筋力トレーニングを続けて、今の状態を保ちましょう。",
      "You completed the 5× chair stand in {x} s, meeting the 4-point standard (≤ 11.19 s). Your leg strength is good. Keep doing strength exercises twice a week to maintain it.",
    ],
    "chair.desc.3": [
      "五次起坐 {x} 秒，符合 3 分標準（11.20～13.69 秒），下肢肌力略有下降。建議每週 2～3 次椅子坐站練習，每次 10 下 × 2 組。",
      "5回椅子立ち上がりは {x} 秒で、3点の基準（11.20〜13.69秒）にあたります。脚の筋力が少し低下しています。週2〜3回、いすからの立ち座りを10回×2セット行いましょう。",
      "You completed the 5× chair stand in {x} s, meeting the 3-point standard (11.20–13.69 s). Leg strength has declined slightly. Practice standing up from a chair 2–3 times a week, 10 times × 2 sets.",
    ],
    "chair.desc.2": [
      "五次起坐 {x} 秒，符合 2 分標準（13.70～16.69 秒），下肢肌力明顯不足。建議在專業人員指導下進行肌力訓練，起身時可扶穩桌椅。",
      "5回椅子立ち上がりは {x} 秒で、2点の基準（13.70〜16.69秒）にあたります。脚の筋力がはっきり不足しています。専門家の指導のもとで筋力トレーニングを行い、立ち上がるときは机やいすにしっかりつかまりましょう。",
      "You completed the 5× chair stand in {x} s, meeting the 2-point standard (13.70–16.69 s). Leg strength is clearly low. Do strength training with guidance from a professional, and hold onto a table or chair when standing up.",
    ],
    "chair.desc.1": [
      "五次起坐 {x} 秒，符合 1 分標準（16.70～60 秒），下肢肌力嚴重不足、跌倒風險高。建議就醫評估並接受復健介入，起身時應有扶手或他人協助。",
      "5回椅子立ち上がりは {x} 秒で、1点の基準（16.70〜60秒）にあたります。脚の筋力が大きく不足し、転倒リスクが高い状態です。医療機関で評価を受けてリハビリを行い、立ち上がるときは手すりを使うか、誰かに手伝ってもらいましょう。",
      "You completed the 5× chair stand in {x} s, meeting the 1-point standard (16.70–60 s). Leg strength is very low and fall risk is high. Please see a doctor for an assessment and rehabilitation, and use a handrail or ask for help when standing up.",
    ],
    "chair.desc.0": [
      "無法在 60 秒內完成五次起坐。建議儘速就醫評估，日常起身需使用扶手或由他人協助。",
      "60秒以内に5回の立ち上がりを終えることができませんでした。早めに医療機関で評価を受け、日常の立ち上がりには手すりを使うか、誰かに手伝ってもらいましょう。",
      "You were unable to complete five chair stands within 60 seconds. Please see a doctor soon, and use a handrail or ask someone to help you stand up in daily life.",
    ],
    "edu.1.t": ["肌力是防跌的基礎", "筋力は転倒予防の基本です", "Strength is the foundation of fall prevention"],
    "edu.1.d": [
      "下肢肌力越好，起身、走路越穩，規律訓練能有效降低跌倒風險。",
      "脚の筋力が強いほど、立ち上がりや歩行が安定します。続けて鍛えることで転倒リスクを減らせます。",
      "Stronger legs make standing up and walking steadier. Regular training can lower your fall risk.",
    ],
    "edu.2.t": ["練平衡要有支撐", "バランス練習は支えのそばで", "Practice balance with support"],
    "edu.2.d": [
      "練習平衡時旁邊應有穩固的椅背或牆面，必要時請家人陪同。",
      "バランスの練習は、しっかりしたいすの背や壁のそばで行い、必要に応じてご家族に付き添ってもらいましょう。",
      "Keep a sturdy chair back or wall within reach when practicing balance, and ask family to stay with you if needed.",
    ],
    "edu.3.t": ["吃夠蛋白質與維生素 D", "たんぱく質とビタミンDをしっかりと", "Get enough protein and vitamin D"],
    "edu.3.d": [
      "每餐攝取豆魚蛋肉類，適度曬太陽，有助維持肌肉量與骨骼強度。",
      "毎食、豆・魚・卵・肉を取り入れ、適度に日光を浴びると、筋肉と骨の維持に役立ちます。",
      "Include beans, fish, eggs or meat at every meal and get some sunlight to help keep your muscles and bones strong.",
    ],
    "edu.4.t": ["穿防滑包覆的鞋", "滑りにくく足を包む靴を", "Wear non-slip, supportive shoes"],
    "edu.4.d": [
      "避免穿拖鞋外出，選擇防滑、包覆性佳的鞋子，減少滑倒。",
      "外出時はスリッパを避け、滑りにくく足をしっかり包む靴を選んで、滑って転ぶのを防ぎましょう。",
      "Avoid slippers when going out; choose non-slip shoes that hold your feet well to prevent slips.",
    ],

    /* ── 新版面：頂帶、結果卡、導覽列、區段、儲存膠囊 ── */
    "name.m": ["{name} 先生", "{name} 様", "Mr. {name}"],
    "name.f": ["{name} 女士", "{name} 様", "Ms. {name}"],
    "sep": ["・", "・", " · "],
    "result.gait": ["跌倒風險等級", "転倒リスクレベル", "Fall risk level"],
    "save.short": ["儲存報告", "レポートを保存", "Save report"],
    "save.leftShort": ["剩 {t}", "残り {t}", "{t} left"],
    "gedu.1.t": ["穿著合適鞋具", "足に合った靴を選びましょう", "Wear suitable shoes"],
    "gedu.1.d": [
      "選擇防滑、包覆性佳的鞋子，避免穿拖鞋或高跟鞋外出，可有效減少跌倒發生。",
      "滑りにくく足をしっかり包む靴を選び、スリッパやハイヒールでの外出を避けると、転倒を減らせます。",
      "Choose non-slip shoes that hold your feet well, and avoid slippers or high heels outdoors to help prevent falls.",
    ],
    "gedu.2.t": ["定期審視用藥", "お薬を定期的に見直しましょう", "Review your medicines regularly"],
    "gedu.2.d": [
      "部分藥物可能影響平衡感與反應力，請定期與醫師討論目前用藥是否需要調整。",
      "一部のお薬はバランス感覚や反応に影響することがあります。今のお薬を調整する必要がないか、定期的に医師と相談しましょう。",
      "Some medicines can affect balance and reaction time. Talk with your doctor regularly about whether your medicines need adjusting.",
    ],
    "gedu.3.t": ["均衡營養補充", "バランスのよい栄養を", "Eat a balanced diet"],
    "gedu.3.d": [
      "攝取足夠的鈣質、維生素 D 與蛋白質，有助於維持骨骼強度與肌肉量，降低骨折風險。",
      "カルシウム・ビタミンD・たんぱく質を十分にとると、骨と筋肉を保ち、骨折のリスクを下げるのに役立ちます。",
      "Getting enough calcium, vitamin D and protein helps keep your bones and muscles strong and lowers the risk of fractures.",
    ],
    "gedu.4.t": ["定期視力檢查", "定期的に視力検査を", "Get your eyes checked regularly"],
    "gedu.4.d": [
      "視力退化是跌倒的重要風險因子之一，建議每年進行視力檢查，確認眼鏡度數是否合適。",
      "視力の低下は転倒の大きな原因のひとつです。年に1回は視力検査を受け、眼鏡の度が合っているか確認しましょう。",
      "Poor eyesight is a major cause of falls. Have an eye exam every year and make sure your glasses are right for you.",
    ],

    /* ── 預覽模式（開發用） ── */
    "pv.risk": ["預覽：風險等級", "プレビュー：リスクレベル", "Preview: risk level"],
    "pv.speed": ["預覽：步行速度分數", "プレビュー：歩行速度の点数", "Preview: gait speed score"],
    "pv.sway": ["預覽：身體晃動", "プレビュー：体の揺れ", "Preview: body sway"],
    "pv.news": ["預覽：最新消息", "プレビュー：お知らせ", "Preview: news"],
    "pv.balance": ["預覽：平衡分數", "プレビュー：バランスの点数", "Preview: balance score"],
    "pv.chair": ["預覽：起坐分數", "プレビュー：椅子立ち上がりの点数", "Preview: chair stand score"],
    "pv.total": ["預覽：總分", "プレビュー：合計点", "Preview: total"],
    "pv.autoTotal": ["總分由三項自動計算", "合計点は3つのテストから自動計算されます", "The total is calculated from the 3 tests"],
    "pv.has": ["有", "あり", "On"],
    "pv.none": ["無", "なし", "Off"],
    "pv.expired": ["預覽：過期頁", "プレビュー：期限切れページ", "Preview: expired page"],
    "pv.unauth": ["預覽：無權限頁", "プレビュー：権限なしページ", "Preview: no-access page"],
    "pv.back": ["返回預覽", "プレビューに戻る", "Back to preview"],
    "nav.home": ["回首頁", "ホームへ戻る", "Back to home"],
    "pv.video": ["預覽：推薦影片", "プレビュー：おすすめ動画", "Preview: video"],

    /* ── 行走頁區塊版面（每個區塊的小副標與大標） ── */
    "blk.next": ["下一步", "次のステップ", "Next steps"],
    "blk.start": ["從這裡開始", "ここから始めましょう", "Start here"],
    "blk.eduEyebrow": ["防跌知識", "転倒予防の知識", "Fall prevention"],
    "blk.videoEyebrow": ["影音衛教", "動画で学ぶ", "Watch & learn"],
    "blk.video": ["推薦影片", "おすすめ動画", "Recommended video"],
    "mob.badge": ["身體晃動", "体の揺れ", "Body sway"],
    "video.open": ["在 YouTube 開啟", "YouTubeで開く", "Open in YouTube"],
    "video.play": ["播放影片", "動画を再生", "Play video"],
  };

  /* 行動建議：每個風險等級一組 [標題, 說明]，三種語系各一份 */
  const A = (zh, ja, en) => [zh, ja, en];
  const ACTIONS = {
    gait: {
      low2: A(
        [
          ["維持良好的日常活動", "目前步態表現優異，建議持續每日散步 30 分鐘以上，維持肌力與心肺功能。"],
          ["定期自我健康檢測", "每 3 個月進行一次步態分析，追蹤身體機能變化，做到早期預防。"],
          ["參加社區健康促進課程", "可加入社區長者健康課程或舞蹈、太極等活動，增進社交互動與身體協調性。"],
          ["持續均衡飲食與補充營養", "攝取足夠蛋白質、鈣質與維生素 D，鞏固骨骼與肌肉基礎，為長期健康提供支撐。"],
        ],
        [
          ["今の活動的な生活を続けましょう", "歩き方はとても良好です。毎日30分以上の散歩を続けて、筋力と心肺機能を保ちましょう。"],
          ["定期的にセルフチェックをしましょう", "3か月に1回歩行分析を受けて体の変化を確認し、早めの予防につなげましょう。"],
          ["地域の健康教室に参加しましょう", "地域の高齢者向け健康教室や、ダンス・太極拳などに参加して、交流を楽しみながら体の協調性を高めましょう。"],
          ["バランスのよい食事を続けましょう", "たんぱく質・カルシウム・ビタミンDを十分にとり、骨と筋肉の土台を固めて、長く健康に過ごせるようにしましょう。"],
        ],
        [
          ["Keep up your daily activity", "Your walking is excellent. Keep walking 30 minutes or more each day to maintain strength and heart-lung fitness."],
          ["Check your health regularly", "Have a gait analysis every 3 months to track changes in your body and catch problems early."],
          ["Join community health classes", "Try senior health classes, dancing or tai chi to stay social and improve coordination."],
          ["Keep eating a balanced diet", "Get enough protein, calcium and vitamin D to keep your bones and muscles strong for long-term health."],
        ],
      ),
      low: A(
        [
          ["開始預防性平衡訓練", "每日進行 10 分鐘平衡練習，如扶椅站立、踮腳尖等，可有效提升穩定性。"],
          ["參加社區健康促進課程", "可加入社區長者健康課程或健走、太極等活動，強化肌力與身體協調性。"],
          ["檢視居家環境", "確認常用動線的照明與防滑狀況，浴室建議加裝扶手，減少潛在跌倒風險。"],
          ["每 2 個月追蹤步態變化", "定期回測可即時察覺功能退化趨勢，提早介入避免風險等級上升。"],
        ],
        [
          ["予防のためのバランス練習を始めましょう", "毎日10分、いすにつかまって立つ、つま先立ちなどのバランス練習をすると、安定性が高まります。"],
          ["地域の健康教室に参加しましょう", "地域の高齢者向け健康教室や、ウォーキング・太極拳などで、筋力と体の協調性を高めましょう。"],
          ["住まいの環境を見直しましょう", "よく通る場所の明るさと滑りにくさを確認し、浴室には手すりをつけて、転倒の危険を減らしましょう。"],
          ["2か月ごとに歩き方を確認しましょう", "定期的に測定すると衰えに早く気づけ、リスクが上がる前に対策できます。"],
        ],
        [
          ["Start preventive balance training", "Do 10 minutes of balance practice daily, such as standing while holding a chair or standing on tiptoe, to improve stability."],
          ["Join community health classes", "Try senior health classes, walking groups or tai chi to build strength and coordination."],
          ["Check your home", "Make sure the paths you use often are well lit and non-slip, and consider grab bars in the bathroom to reduce the risk of falls."],
          ["Recheck your gait every 2 months", "Regular rechecks help you notice decline early and act before your risk level rises."],
        ],
      ),
      medium: A(
        [
          ["安排物理治療課程", "建議每週接受 1～2 次物理治療，針對下肢肌力、平衡感與步態穩定進行系統訓練。"],
          ["考慮使用輔助器具", "外出時可依需求使用手杖或助行器，降低長途行走時的不穩定風險。"],
          ["進行居家安全改造", "浴室、走廊、床邊加裝扶手，移除地面障礙物，夜間保持足夠照明。"],
          ["前往家醫科進行評估", "請醫師全面審視目前慢性病用藥、視力與骨質狀況，排除可矯正的跌倒危險因子。"],
          ["每 4～6 週追蹤步態", "持續監測步態數據，調整訓練方向，確認介入成效。"],
        ],
        [
          ["理学療法を受けましょう", "週1〜2回、理学療法を受けて、脚の筋力・バランス・歩行の安定性を計画的に鍛えましょう。"],
          ["歩行補助具の使用を検討しましょう", "外出時は必要に応じて杖や歩行器を使い、長く歩くときのふらつきを防ぎましょう。"],
          ["住まいを安全に整えましょう", "浴室・廊下・ベッドのそばに手すりをつけ、床の物を片付け、夜間も十分な明かりを確保しましょう。"],
          ["かかりつけ医で評価を受けましょう", "医師に持病のお薬・視力・骨の状態を詳しく確認してもらい、改善できる転倒の原因を取り除きましょう。"],
          ["4〜6週ごとに歩き方を確認しましょう", "歩行データを続けて確認し、訓練内容を調整して効果を確かめましょう。"],
        ],
        [
          ["Arrange physical therapy", "Have physical therapy 1–2 times a week for structured training of leg strength, balance and walking stability."],
          ["Consider a walking aid", "Use a cane or walker when needed outdoors to stay steady on longer walks."],
          ["Make your home safer", "Add grab bars in the bathroom, hallway and by the bed, clear the floor, and keep good lighting at night."],
          ["See your family doctor", "Ask your doctor to fully review your medicines for chronic conditions, your eyesight and bone health to address fall risks that can be fixed."],
          ["Recheck your gait every 4–6 weeks", "Keep tracking your gait data to adjust your training and confirm your progress."],
        ],
      ),
      high: A(
        [
          ["儘速安排醫療諮詢", "建議前往家醫科、復健科或尋求相關專業人員諮詢，進行全面的健康評估與防跌指導。"],
          ["開始居家平衡訓練", "建議每週進行 2~3 次基礎肌力訓練，可在家人或照護者在旁輔助下，練習安全簡單的坐姿抬腳等運動。"],
          ["改善居家環境安全", "檢視浴室、走廊、床邊是否有扶手，移除地面障礙物，確保照明充足以降低跌倒風險。"],
          ["定期回測追蹤進步", "建議每 4～6 週回來進行一次步態分析，追蹤改善成效，及早調整訓練計畫。"],
        ],
        [
          ["早めに医療機関に相談しましょう", "かかりつけ医やリハビリ科、専門家に相談し、全身の健康チェックと転倒予防の指導を受けましょう。"],
          ["自宅でバランス練習を始めましょう", "週2〜3回、基本的な筋力トレーニングを行いましょう。ご家族や介護者にそばで支えてもらいながら、座ったまま脚を上げるなどの安全で簡単な運動から始めましょう。"],
          ["住まいの安全を高めましょう", "浴室・廊下・ベッドのそばに手すりがあるか確認し、床の物を片付け、明かりを十分にして転倒を防ぎましょう。"],
          ["定期的に再測定しましょう", "4〜6週ごとに歩行分析を受けて改善の様子を確認し、早めに訓練計画を見直しましょう。"],
        ],
        [
          ["Seek medical advice soon", "Visit your family doctor, a rehabilitation clinic or a professional for a full health check and fall-prevention advice."],
          ["Start balance training at home", "Do basic strength exercises 2–3 times a week, practicing safe, simple moves such as seated leg raises with a family member or caregiver nearby to help."],
          ["Improve home safety", "Check for grab bars in the bathroom, hallway and by the bed, clear the floor, and keep rooms well lit."],
          ["Recheck regularly", "Have a gait analysis every 4–6 weeks to track your progress and adjust your training plan early."],
        ],
      ),
      danger: A(
        [
          ["建議安排醫療評估", "請勿延誤，建議至醫院老年醫學科、家庭醫學科或復健科進行完整評估，確認潛在的衰弱原因與身體狀況。"],
          ["全天候使用輔助器具", "室內外行走均建議使用手杖或助行器，並告知家人目前狀況，避免獨自進行高風險活動。"],
          ["建議進行居家全面安全改造", "馬桶旁、浴缸旁、床邊、樓梯均需加裝扶手；移除所有地面障礙物（地毯、電線）；全室夜間保持夜燈照明。"],
          ["規劃專業復健療程", "建議由醫療、復健或運動指導專業人員評估後，依個人狀況安排合適的復健、肌力或步態訓練，避免自行進行高風險活動。"],
          ["建立緊急聯絡機制", "設定緊急呼叫裝置或手機一鍵撥號，並告知家人或鄰居每日確認安全，避免跌倒後無人即時協助。"],
        ],
        [
          ["医療機関で評価を受けましょう", "先延ばしにせず、老年内科・家庭医療科・リハビリ科などで詳しい評価を受け、体が弱っている原因を確認しましょう。"],
          ["いつも歩行補助具を使いましょう", "屋内でも屋外でも杖や歩行器を使い、ご家族に今の状態を伝えて、危険な動作を一人で行わないようにしましょう。"],
          ["住まい全体を安全に整えましょう", "トイレ・浴槽・ベッドのそば・階段に手すりをつけ、床のマットや電気コードを片付け、夜は常夜灯をつけましょう。"],
          ["専門的なリハビリを計画しましょう", "医療・リハビリ・運動指導の専門家に評価してもらい、状態に合ったリハビリや筋力・歩行訓練を行いましょう。危険な運動を自己判断で行うのは避けましょう。"],
          ["緊急時の連絡方法を決めておきましょう", "緊急通報装置や携帯電話のワンタッチ発信を設定し、ご家族やご近所の方に毎日の安否確認をお願いして、転倒時にすぐ助けが来るようにしましょう。"],
        ],
        [
          ["Get a medical assessment", "Please don't delay. Visit a geriatrics, family medicine or rehabilitation clinic for a full assessment of what may be causing frailty."],
          ["Use a walking aid at all times", "Use a cane or walker indoors and outdoors, let your family know your condition, and avoid risky activities alone."],
          ["Make your whole home safer", "Add grab bars by the toilet, bathtub, bed and stairs; remove rugs and cords from the floor; and use night lights."],
          ["Plan professional rehabilitation", "After an assessment by a medical, rehabilitation or exercise professional, follow a rehab, strength or gait program suited to you, and avoid risky exercise on your own."],
          ["Set up emergency contact", "Set up an emergency call device or one-touch dialing, and ask family or neighbors to check on you daily so help comes quickly after a fall."],
        ],
      ),
    },
    sppb: {
      low2: A(
        [
          ["維持規律運動", "每週累積 150 分鐘中等強度活動，如快走、騎單車，維持肌力與心肺功能。"],
          ["持續肌力與平衡練習", "每週 2 次深蹲、單腳站立等練習，維持目前的良好表現。"],
          ["參加社區健康促進課程", "可加入社區長者運動課程或太極、舞蹈等活動，增進身體協調與社交互動。"],
          ["每 6 個月回測 SPPB", "定期追蹤體能變化，及早發現退化趨勢。"],
        ],
        [
          ["運動の習慣を続けましょう", "早歩きや自転車など、ほどよい強さの運動を週に合計150分行い、筋力と心肺機能を保ちましょう。"],
          ["筋力とバランスの練習を続けましょう", "週2回、スクワットや片脚立ちなどを行い、今の良い状態を保ちましょう。"],
          ["地域の健康教室に参加しましょう", "地域の高齢者向け運動教室や、太極拳・ダンスなどに参加して、体の協調性を高め、交流を深めましょう。"],
          ["6か月ごとに SPPB を再測定しましょう", "体力の変化を定期的に確認し、衰えに早く気づきましょう。"],
        ],
        [
          ["Keep exercising regularly", "Get 150 minutes a week of moderate activity, such as brisk walking or cycling, to maintain strength and heart-lung fitness."],
          ["Keep up strength and balance practice", "Do squats, one-leg stands and similar exercises twice a week to stay in good shape."],
          ["Join community health classes", "Try senior exercise classes, tai chi or dancing to improve coordination and stay social."],
          ["Retake the SPPB every 6 months", "Track changes in your physical fitness to spot any decline early."],
        ],
      ),
      low: A(
        [
          ["加強下肢肌力", "每週 2～3 次椅子坐站、踮腳尖練習，每次 10～15 下 × 2 組。"],
          ["每日平衡練習 10 分鐘", "扶著椅背練習半並排與直線站立，逐步延長維持時間。"],
          ["檢視居家環境", "確認常用動線照明充足、地面防滑，浴室建議加裝扶手。"],
          ["每 3 個月回測 SPPB", "追蹤三項分數變化，提早介入避免風險等級上升。"],
        ],
        [
          ["脚の筋力を鍛えましょう", "週2〜3回、いすからの立ち座りやつま先立ちを、10〜15回×2セット行いましょう。"],
          ["毎日10分バランス練習を", "いすの背につかまってセミタンデム立位とタンデム立位を練習し、少しずつ時間を延ばしましょう。"],
          ["住まいの環境を見直しましょう", "よく通る場所が明るく滑りにくいか確認し、浴室には手すりをつけましょう。"],
          ["3か月ごとに SPPB を再測定しましょう", "3つのテストの点数の変化を確認し、リスクが上がる前に対策しましょう。"],
        ],
        [
          ["Build leg strength", "Do sit-to-stands from a chair and heel raises 2–3 times a week, 10–15 times × 2 sets."],
          ["Practice balance 10 minutes a day", "Hold the back of a chair and practice the semi-tandem and tandem stands, gradually holding them longer."],
          ["Check your home", "Make sure the paths you use often are well lit and non-slip, and consider grab bars in the bathroom."],
          ["Retake the SPPB every 3 months", "Track your scores on the 3 tests and act early, before your risk level rises."],
        ],
      ),
      medium: A(
        [
          ["開始規律運動計畫", "依 VIVIFRAIL 等級，在專業人員指導下進行肌力、平衡與步行訓練。"],
          ["前往家醫科評估", "請醫師檢視用藥、視力、骨質與營養狀況，排除可改善的跌倒因子。"],
          ["進行居家安全改造", "浴室、走廊、床邊加裝扶手，移除地面障礙物，夜間保持照明。"],
          ["評估是否需要輔具", "外出或長距離行走時，可依需求使用手杖或助行器。"],
          ["每 1～2 個月回測 SPPB", "確認訓練成效並調整計畫。"],
        ],
        [
          ["運動計画を始めましょう", "VIVIFRAIL の区分に合わせて、専門家の指導のもとで筋力・バランス・歩行の訓練を行いましょう。"],
          ["かかりつけ医で評価を受けましょう", "医師にお薬・視力・骨・栄養の状態を確認してもらい、改善できる転倒の原因を取り除きましょう。"],
          ["住まいを安全に整えましょう", "浴室・廊下・ベッドのそばに手すりをつけ、床の物を片付け、夜も明かりをつけておきましょう。"],
          ["歩行補助具が必要か確認しましょう", "外出時や長く歩くときは、必要に応じて杖や歩行器を使いましょう。"],
          ["1〜2か月ごとに SPPB を再測定しましょう", "訓練の効果を確認し、計画を見直しましょう。"],
        ],
        [
          ["Start a regular exercise plan", "Based on your VIVIFRAIL grade, do strength, balance and walking training with guidance from a professional."],
          ["See your family doctor", "Ask your doctor to review your medicines, eyesight, bone health and nutrition to address fall risks that can be improved."],
          ["Make your home safer", "Add grab bars in the bathroom, hallway and by the bed, clear the floor, and keep lights on at night."],
          ["Check whether you need a walking aid", "Use a cane or walker when needed for outings or longer walks."],
          ["Retake the SPPB every 1–2 months", "Check your progress and adjust your plan."],
        ],
      ),
      high: A(
        [
          ["儘速安排醫療諮詢", "建議前往復健科或家醫科進行完整評估與防跌指導。"],
          ["在陪同下進行肌力訓練", "由家人或照護者在旁協助，從坐姿抬腿等安全動作開始。"],
          ["改善居家環境安全", "檢查扶手、照明與地面障礙物，降低居家跌倒風險。"],
          ["外出使用輔具", "外出時使用手杖或助行器，避免獨自前往陌生或濕滑環境。"],
          ["每月回測追蹤", "每月進行一次 SPPB，追蹤改善成效。"],
        ],
        [
          ["早めに医療機関に相談しましょう", "リハビリ科やかかりつけ医で、詳しい評価と転倒予防の指導を受けましょう。"],
          ["付き添いのもとで筋力訓練を", "ご家族や介護者に付き添ってもらい、座ったまま脚を上げるなどの安全な運動から始めましょう。"],
          ["住まいの安全を高めましょう", "手すり・明かり・床の障害物を確認し、家の中での転倒を防ぎましょう。"],
          ["外出時は歩行補助具を", "外出時は杖や歩行器を使い、慣れない場所や滑りやすい場所へ一人で行くのは避けましょう。"],
          ["毎月再測定しましょう", "月に1回 SPPB を受けて、改善の様子を確認しましょう。"],
        ],
        [
          ["Seek medical advice soon", "Visit a rehabilitation clinic or your family doctor for a full assessment and fall-prevention advice."],
          ["Do strength training with someone nearby", "With a family member or caregiver helping, start with safe moves such as seated leg raises."],
          ["Improve home safety", "Check handrails, lighting and floor clutter to lower your risk of falling at home."],
          ["Use a walking aid outdoors", "Use a cane or walker when going out, and avoid going alone to unfamiliar or slippery places."],
          ["Recheck monthly", "Take the SPPB once a month to track your progress."],
        ],
      ),
      danger: A(
        [
          ["建議安排醫療評估", "請勿延誤，至老年醫學科、家醫科或復健科進行完整評估。"],
          ["全天候使用輔具", "室內外行走均使用手杖或助行器，避免獨自進行高風險活動。"],
          ["居家全面安全改造", "馬桶旁、浴缸旁、床邊、樓梯加裝扶手，移除地毯與電線，夜間保持夜燈。"],
          ["規劃專業復健療程", "由醫療或復健專業人員評估後，安排合適的肌力、平衡與步行訓練。"],
          ["建立緊急聯絡機制", "設定緊急呼叫裝置或一鍵撥號，並請家人或鄰居每日確認安全。"],
        ],
        [
          ["医療機関で評価を受けましょう", "先延ばしにせず、老年内科・かかりつけ医・リハビリ科で詳しい評価を受けましょう。"],
          ["いつも歩行補助具を使いましょう", "屋内でも屋外でも杖や歩行器を使い、危険な動作を一人で行わないようにしましょう。"],
          ["住まい全体を安全に整えましょう", "トイレ・浴槽・ベッドのそば・階段に手すりをつけ、マットや電気コードを片付け、夜は常夜灯をつけましょう。"],
          ["専門的なリハビリを計画しましょう", "医療やリハビリの専門家に評価してもらい、状態に合った筋力・バランス・歩行の訓練を行いましょう。"],
          ["緊急時の連絡方法を決めておきましょう", "緊急通報装置やワンタッチ発信を設定し、ご家族やご近所の方に毎日の安否確認をお願いしましょう。"],
        ],
        [
          ["Get a medical assessment", "Please don't delay. Visit a geriatrics, family medicine or rehabilitation clinic for a full assessment."],
          ["Use a walking aid at all times", "Use a cane or walker indoors and outdoors, and avoid risky activities alone."],
          ["Make your whole home safer", "Add grab bars by the toilet, bathtub, bed and stairs; remove rugs and cords; and use night lights."],
          ["Plan professional rehabilitation", "After an assessment by a medical or rehabilitation professional, follow strength, balance and walking training suited to you."],
          ["Set up emergency contact", "Set up an emergency call device or one-touch dialing, and ask family or neighbors to check on you daily."],
        ],
      ),
    },
  };

  /* ── 語系判斷與保存 ── */
  function detect() {
    const q = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(q)) return q;
    try {
      const s = sessionStorage.getItem("kf.lang");
      if (LANGS.includes(s)) return s;
    } catch (e) {}
    return "zh-TW";
  }
  let lang = detect();
  try {
    sessionStorage.setItem("kf.lang", lang);
  } catch (e) {}

  function t(key, params) {
    const row = T[key];
    if (!row) {
      console.warn("[i18n] 缺少文字：" + key);
      return key;
    }
    let v = row[IDX[lang]] ?? row[0];
    if (params) v = v.replace(/\{(\w+)\}/g, (m, k) => (params[k] ?? m));
    return v;
  }
  // 行動建議：t 以外的結構化文字
  function actions(page, level) {
    return ACTIONS[page]?.[level]?.[IDX[lang]] || [];
  }

  /* 日文字型：切到日文才載入，--font-sans／--font-serif 改為 JP 字型優先（見 css/detail.css） */
  let jaFontsLoaded = false;
  function loadJaFonts() {
    if (jaFontsLoaded) return;
    jaFontsLoaded = true;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500;700&family=Noto+Serif+JP:wght@600&display=swap";
    document.head.appendChild(link);
  }
  function applyLangAttrs() {
    document.documentElement.lang = lang;
    if (lang === "ja") loadJaFonts();
  }
  applyLangAttrs();

  function apply(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    root.querySelectorAll("[data-i18n-html]").forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
    root.querySelectorAll("[data-i18n-alt]").forEach((el) => el.setAttribute("alt", t(el.dataset.i18nAlt)));
    root.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    // 狀態膠囊：保留圖示，文字直接放在膠囊裡（不包 <span>；html2canvas 存圖時 inline-flex 膠囊內的 <span> 文字會不見）
    root.querySelectorAll("[data-i18n-pill]").forEach((el) => {
      [...el.childNodes].forEach((n) => n.nodeType === 3 && n.remove());
      el.append(t(el.dataset.i18nPill));
    });
  }

  // 切換語系：不重新載入、不重新呼叫 API；網址保留 token、preview 等其他參數
  function set(next) {
    if (!LANGS.includes(next) || next === lang) return;
    lang = next;
    applyLangAttrs();
    try {
      sessionStorage.setItem("kf.lang", lang);
    } catch (e) {}
    try {
      const u = new URL(location.href);
      u.searchParams.set("lang", lang);
      history.replaceState(history.state, "", u.pathname + u.search + u.hash);
    } catch (e) {}
    apply(document);
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  // 語系選擇彈窗按「確定」：不重新整理、不重新呼叫 API
  document.addEventListener("kf:langchange", (e) => set(e.detail.lang));

  window.t = t;
  window.I18N = {
    t,
    actions,
    apply,
    set,
    get lang() {
      return lang;
    },
  };
})();
