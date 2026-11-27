/* =========================================================
 * iPad 端多語系：kiosk.html、kiosk-consent.html、home.html、result.html、result-gait.html 整頁翻譯；assess.html 只翻譯測驗完成彈窗；其他有底部導覽的頁面只翻譯導覽列（js/nav.js）
 * 語系：zh-TW、ja、en；來源 sessionStorage「kf.lang」（與詳細頁相同），預設 zh-TW
 *
 *   t(key, params)          目前語系的文字；params 代入 {name}；沒有這個 key 時回傳 key
 *   AppI18n.has(key)        字典有沒有這個 key
 *   AppI18n.lang            目前語系
 *   AppI18n.apply(root)     套用 data-i18n（文字）、data-i18n-html（含 <br>／<wbr>）、
 *                           data-i18n-attr="aria-label:key;title:key"（屬性）
 *
 * 整頁翻譯的頁面：<html data-app-i18n>，<html lang> 跟著切換；其他頁不改 <html lang>（內容仍是中文）
 * 切換：收到 js/lang-picker.js 的 "kf:langchange" → 套用 → 在 document 觸發 "app:langchange"
 *       日文字型載入完成後觸發 "app:fontsready"（需要重新量測版面的頁面使用）
 * 樣式在 css/app-i18n.css
 * ========================================================= */
(function () {
  const DICT = {
    "zh-TW": {
      /* 底部導覽 */
      "nav.menu": "主選單",
      "nav.home": "鑑測",
      "nav.report": "紀錄",
      "nav.upload": "上傳",
      "nav.subjects": "受測者",
      "nav.settings": "設定",
      "nav.pending": "上傳（{n} 筆待上傳）",
      "nav.wip": "「{name}」頁面製作中",

      /* 首頁 */
      "home.docTitle": "建豐健康科技 - 鑑測首頁",
      "home.morning": "早安，",
      "home.afternoon": "午安，",
      "home.evening": "晚安，",
      "home.kiosk": "首頁",
      "home.output": "產出",
      "home.start": "開始測驗",
      "test.sppb.name": "簡易身體<wbr>功能評估",
      "test.sppb.desc": "SPPB",
      "test.sppb.output": "跌倒風險評估",
      "test.gait.name": "行走測驗",
      "test.gait.desc": "步態分析",
      "test.gait.output": "步速與步態報告",

      /* 一體機歡迎頁 */
      "kiosk.docTitle": "建豐健康科技 - AI跌倒風險檢測",
      "kiosk.title": "AI跌倒風險檢測",
      "kiosk.expert": "專家模式",
      "kiosk.steps": "檢測步驟",
      "kiosk.step1": "插入健保卡",
      "kiosk.step2": "走一段路",
      "kiosk.step3": "看結果",
      "kiosk.video": "衛教影片",
      "kiosk.carousel": "檢測介紹",
      "kiosk.carouselRole": "輪播",
      "kiosk.slideRole": "頁",
      "kiosk.tabUse": "使用步驟",
      "kiosk.tabCheck": "自我檢查",
      "kiosk.tabHow": "檢測怎麼做",
      "kiosk.tabReport": "報告搶先看",
      "kiosk.useTitle": "只要三個步驟",
      "kiosk.checkTitle": "問問自己",
      "kiosk.q1": "過去一年曾經跌倒過嗎？",
      "kiosk.q2": "走路或起身需要扶東西嗎？",
      "kiosk.q3": "會擔心自己跌倒嗎？",
      "kiosk.qCta": "只要有一項，就建議您做一次檢測",
      "kiosk.howTitle": "照平常的速度<br />從起點走到終點就完成",
      "kiosk.walkStart": "起點",
      "kiosk.walkEnd": "終點",
      "kiosk.sample": "示意",
      "kiosk.riskLevel": "跌倒風險等級",
      "kiosk.riskLow": "稍低風險",
      "kiosk.reportTitle": "做完就能拿到<br />您的跌倒風險報告",
      "kiosk.report1": "一眼看懂風險等級",
      "kiosk.report2": "掃 QR Code 用手機帶走",
      "kiosk.report3": "附上專屬的改善建議",
      "kiosk.guest": "訪客模式",
      "kiosk.guestSub": "不用插卡，直接開始",
      "kiosk.or": "或",
      "kiosk.insert": "插入健保卡",
      "kiosk.insertSub": "插入螢幕下方讀卡機",
      "kiosk.insertAria": "請將健保卡插入螢幕下方讀卡機",
      "kiosk.sbTitle": "進入待機",
      "kiosk.sbBody": "畫面會關閉，影片暫停播放。",
      "kiosk.sbHint": "要喚醒時，請在螢幕上連續點兩下",
      "kiosk.sbCancel": "取消",
      "kiosk.sbOk": "進入待機",
      "kiosk.standby": "待機中",
      "kiosk.standbySub": "點兩下螢幕喚醒",

      /* 測驗完成彈窗（assess.html） */
      "finish.title": "完成檢測",
      "finish.question": "步行時\n是否使用輔具？",
      "finish.no": "沒有",
      "finish.yes": "有",
      "finish.submit": "送出結果",
      "finish.retake": "重測",
      "finish.hint": "請先選擇是否使用輔具",

      /* 一體機同意頁、隱私權政策（kiosk-consent.html）。注意：同意頁與政策的外文翻譯要經過法務確認 */
      "consent.docTitle": "建豐健康科技 - 個人資料蒐集與檢測同意",
      "consent.title": "個人資料蒐集與檢測同意",
      "consent.intro": "檢測前，請您先了解以下事項：",
      "consent.item1": "蒐集您的基本資料",
      "consent.item2": "錄製行走畫面",
      "consent.item3": "使用 AI 分析步態與平衡",
      "consent.item4": "產出跌倒風險評估",
      "consent.note": "＊本結果僅供健康評估參考，不等同醫療診斷。",
      "consent.attach": "附件",
      "consent.policy": "完整隱私權政策",
      "consent.policySub": "共十三條，點此查看全文",
      "consent.view": "查看",
      "consent.decline": "不同意並離開",
      "consent.agree": "已瞭解\n並同意",
      "consent.agreeSub": "點此確認",
      "policy.title": "隱私權政策",
      "policy.close": "關閉",
      "policy.langNote": "",

      /* 鑑測結果頁（result.html、result-gait.html）：js/result-common.js、各頁 data-i18n */
      "res.docTitle.gait": "建豐健康科技 - 行走測驗鑑測結果",
      "res.docTitle.sppb": "建豐健康科技 - SPPB 鑑測結果",
      "res.home": "回首頁",
      "res.homeKiosk": "回到一體機",
      "res.back": "受測名單",
      "res.report": "報告",
      "res.reportSub": "手機掃描看詳細內容",
      "res.reportAria.gait": "開啟行走測驗詳細報告",
      "res.reportAria.sppb": "開啟 SPPB 詳細報告",
      "res.demo": "示範",
      "res.demoAria": "示範：切換風險等級",
      "res.pager": "頁面切換",
      "res.swipe": "左右滑動查看",
      "res.notFound": "找不到鑑測紀錄",
      "res.overview": "結果總覽",
      "res.riskSub": "跌倒風險評估",
      "res.gaugeAria": "跌倒風險半圓圖",
      "res.riskTitle": "目前風險等級：{name}",
      "res.viviK": "VIVIFRAIL 等級",
      "res.vivi.A": "A 失能者",
      "res.vivi.B": "B 衰弱者",
      "res.vivi.C": "C 衰弱前期者",
      "res.vivi.D": "D 健康者",
      "res.outOf12": "滿分 12 分",
      "res.peer.above": "優於 {n} 同齡長者",
      "res.peer.below": "低於 {n} 同齡長者",
      "res.peer.behind": "落後 {n} 同齡長者",
      "res.you": "您",
      "res.weaker": "表現較弱",
      "res.middle": "中間",
      "res.stronger": "表現較好",
      "res.cardChart": "詳細數據 圖表",
      "res.cardData": "詳細數據 數據",
      "res.details": "詳細數據",
      "res.kindChart": "· 圖表",
      "res.kindData": "· 數據",
      "res.radarAria": "三項分數雷達圖",
      "res.balance": "平衡",
      "res.gait": "步行",
      "res.chair": "起坐",
      "res.measures": "測量數據",
      "res.m.walk": "步行速度",
      "res.m.chair": "五次起坐測試",
      "res.m.side": "並排站立",
      "res.m.semi": "半前後站立",
      "res.m.tandem": "前後站立",
      "res.unable": "無法完成",
      "res.sec": "秒",
      "res.rec": "推薦商品",
      "res.recEmpty": "目前沒有推薦內容",
      "res.news": "最新消息",
      "res.newsEmpty": "目前沒有最新消息",
      "res.newsCta": "詳情請洽門市櫃檯",
      "res.video": "推薦影片",
      "res.videoEmpty": "目前沒有影片",
      "res.videoTap": "點一下觀看影片",
      "res.videoAria": "開啟影片播放視窗",
      "res.close": "關閉",
      "res.videoHint": "按「關閉」回到結果頁",
      "res.care": "照護服務",
      "res.careDanger": "危險等級建議",
      "res.careHigh": "高風險建議",
      "res.careOther": "{short}風險建議",
      "res.hotline": "諮詢專線",
      "res.qrDemo": "示意 QR，<br>正式版可掃描前往網站",
    },

    ja: {
      "nav.menu": "メインメニュー",
      "nav.home": "測定",
      "nav.report": "記録",
      "nav.upload": "アップロード",
      "nav.subjects": "対象者",
      "nav.settings": "設定",
      "nav.pending": "アップロード（未送信 {n} 件）",
      "nav.wip": "「{name}」は準備中です",

      "home.docTitle": "建豐健康科技 - 測定ホーム",
      "home.morning": "おはようございます、",
      "home.afternoon": "こんにちは、",
      "home.evening": "こんばんは、",
      "home.kiosk": "ホーム",
      "home.output": "結果",
      "home.start": "テスト開始",
      "test.sppb.name": "簡易身体<wbr>機能評価",
      "test.sppb.desc": "SPPB",
      "test.sppb.output": "転倒リスク<wbr>評価",
      "test.gait.name": "歩行テスト",
      "test.gait.desc": "歩行分析",
      "test.gait.output": "歩行速度・<wbr>歩行レポート",

      "kiosk.docTitle": "建豐健康科技 - AI転倒リスク検査",
      "kiosk.title": "AI転倒リスク検査",
      "kiosk.expert": "専門家モード",
      "kiosk.steps": "検査の手順",
      "kiosk.step1": "健康保険証を<wbr>挿入",
      "kiosk.step2": "少し歩く",
      "kiosk.step3": "結果を見る",
      "kiosk.video": "健康に関する動画",
      "kiosk.carousel": "検査のご案内",
      "kiosk.carouselRole": "カルーセル",
      "kiosk.slideRole": "ページ",
      "kiosk.tabUse": "ご利用の手順",
      "kiosk.tabCheck": "セルフチェック",
      "kiosk.tabHow": "検査のやり方",
      "kiosk.tabReport": "レポート紹介",
      "kiosk.useTitle": "たった3つの手順です",
      "kiosk.checkTitle": "ご自身に聞いてみましょう",
      "kiosk.q1": "この1年で転んだことがありますか？",
      "kiosk.q2": "歩くときや立つときに支えが必要ですか？",
      "kiosk.q3": "転ぶのが心配ですか？",
      "kiosk.qCta": "1つでも当てはまる方には、検査をおすすめします",
      "kiosk.howTitle": "いつもの速さで<br />出発から到着まで歩くだけです",
      "kiosk.walkStart": "出発",
      "kiosk.walkEnd": "到着",
      "kiosk.sample": "見本",
      "kiosk.riskLevel": "転倒リスクレベル",
      "kiosk.riskLow": "やや低リスク",
      "kiosk.reportTitle": "検査が終わると<br />転倒リスクレポートを<br />お渡しします",
      "kiosk.report1": "リスクがひと目でわかります",
      "kiosk.report2": "QRコードでスマホに保存",
      "kiosk.report3": "あなた向けの改善アドバイス",
      "kiosk.guest": "ゲストモード",
      "kiosk.guestSub": "カード不要で<wbr>すぐ始められます",
      "kiosk.or": "または",
      "kiosk.insert": "健康保険証を挿入",
      "kiosk.insertSub": "画面下のカードリーダーへ",
      "kiosk.insertAria": "健康保険証を画面下のカードリーダーに挿入してください",
      "kiosk.sbTitle": "待機モードにしますか？",
      "kiosk.sbBody": "画面が消え、動画は一時停止します。",
      "kiosk.sbHint": "再開するときは、画面を続けて2回タップしてください",
      "kiosk.sbCancel": "キャンセル",
      "kiosk.sbOk": "待機する",
      "kiosk.standby": "待機中",
      "kiosk.standbySub": "画面を2回タップすると再開します",

      /* 測驗完成彈窗（assess.html） */
      "finish.title": "検査完了",
      "finish.question": "歩行時に補助具を\n使用しましたか？",
      "finish.no": "なし",
      "finish.yes": "あり",
      "finish.submit": "結果を送信",
      "finish.retake": "やり直す",
      "finish.hint": "補助具の使用有無を選択してください",

      /* 一體機同意頁、隱私權政策（kiosk-consent.html）。注意：同意頁與政策的外文翻譯要經過法務確認 */
      "consent.docTitle": "建豐健康科技 - 個人情報の収集および検査への同意",
      "consent.title": "個人情報の収集および検査への同意",
      "consent.intro": "検査の前に、以下の内容をご確認ください：",
      "consent.item1": "基本情報の収集",
      "consent.item2": "歩行の様子を録画",
      "consent.item3": "AIによる歩行とバランスの分析",
      "consent.item4": "転倒リスク評価の作成",
      "consent.note": "＊本結果は健康評価の参考であり、医療診断ではありません。",
      "consent.attach": "添付",
      "consent.policy": "プライバシーポリシー全文",
      "consent.policySub": "全13条・タップして全文を表示",
      "consent.view": "表示",
      "consent.decline": "同意せずに終了",
      "consent.agree": "内容を理解し\n同意する",
      "consent.agreeSub": "タップして確認",
      "policy.title": "プライバシーポリシー",
      "policy.close": "閉じる",
      "policy.langNote": "※日本語版は準備中です。",

      /* 鑑測結果頁（result.html、result-gait.html）：js/result-common.js、各頁 data-i18n */
      "res.docTitle.gait": "建豐健康科技 - 歩行テストの結果",
      "res.docTitle.sppb": "建豐健康科技 - SPPB の結果",
      "res.home": "ホームへ戻る",
      "res.homeKiosk": "キオスク画面へ戻る",
      "res.back": "対象者リスト",
      "res.report": "レポート",
      "res.reportSub": "スマホで読み取って詳細を確認",
      "res.reportAria.gait": "歩行テストの詳細レポートを開く",
      "res.reportAria.sppb": "SPPB の詳細レポートを開く",
      "res.demo": "デモ",
      "res.demoAria": "デモ：リスクレベルの切り替え",
      "res.pager": "ページ切り替え",
      "res.swipe": "左右にスワイプ",
      "res.notFound": "測定記録が見つかりません",
      "res.overview": "結果の概要",
      "res.riskSub": "転倒リスク評価",
      "res.gaugeAria": "転倒リスクの半円グラフ",
      "res.riskTitle": "現在のリスクレベル：{name}",
      "res.viviK": "VIVIFRAIL レベル",
      "res.vivi.A": "A 要介護",
      "res.vivi.B": "B フレイル",
      "res.vivi.C": "C プレフレイル",
      "res.vivi.D": "D 健常",
      "res.outOf12": "満点 12 点",
      "res.peer.above": "同年代の {n} より上",
      "res.peer.below": "同年代の {n} より下",
      "res.peer.behind": "同年代の {n} に及ばない",
      "res.you": "あなた",
      "res.weaker": "低め",
      "res.middle": "中間",
      "res.stronger": "高め",
      "res.cardChart": "詳細データ グラフ",
      "res.cardData": "詳細データ 数値",
      "res.details": "詳細データ",
      "res.kindChart": "· グラフ",
      "res.kindData": "· 数値",
      "res.radarAria": "3項目の点数のレーダーチャート",
      "res.balance": "バランス",
      "res.gait": "歩行",
      "res.chair": "椅子立ち上がり",
      "res.measures": "測定データ",
      "res.m.walk": "歩行速度",
      "res.m.chair": "5回立ち上がりテスト",
      "res.m.side": "閉脚立位",
      "res.m.semi": "セミタンデム",
      "res.m.tandem": "タンデム",
      "res.unable": "実施不可",
      "res.sec": "秒",
      "res.rec": "おすすめ商品",
      "res.recEmpty": "現在おすすめはありません",
      "res.news": "お知らせ",
      "res.newsEmpty": "お知らせはありません",
      "res.newsCta": "詳しくは店頭カウンターへ",
      "res.video": "おすすめ動画",
      "res.videoEmpty": "動画はありません",
      "res.videoTap": "タップして動画を見る",
      "res.videoAria": "動画の再生画面を開く",
      "res.close": "閉じる",
      "res.videoHint": "「閉じる」を押すと結果画面に戻ります",
      "res.care": "介護サービス",
      "res.careDanger": "危険レベル向け",
      "res.careHigh": "高リスク向け",
      "res.careOther": "{short}リスク向け",
      "res.hotline": "相談ダイヤル",
      "res.qrDemo": "サンプルの QR です。<br>正式版では読み取ってサイトを開けます",
    },

    en: {
      "nav.menu": "Main menu",
      "nav.home": "Assess",
      "nav.report": "Records",
      "nav.upload": "Upload",
      "nav.subjects": "Subjects",
      "nav.settings": "Settings",
      "nav.pending": "Upload ({n} pending)",
      "nav.wip": "\"{name}\" is coming soon",

      "home.docTitle": "建豐健康科技 - Assessment home",
      "home.morning": "Good morning,",
      "home.afternoon": "Good afternoon,",
      "home.evening": "Good evening,",
      "home.kiosk": "Home",
      "home.output": "Output",
      "home.start": "Start test",
      "test.sppb.name": "Physical Function Test",
      "test.sppb.desc": "SPPB",
      "test.sppb.output": "Fall risk assessment",
      "test.gait.name": "Walking test",
      "test.gait.desc": "Gait analysis",
      "test.gait.output": "Gait speed &amp;&nbsp;gait&nbsp;report",

      "kiosk.docTitle": "建豐健康科技 - AI Fall Risk Assessment",
      "kiosk.title": "AI Fall Risk Assessment",
      "kiosk.expert": "Expert Mode",
      "kiosk.steps": "Assessment steps",
      "kiosk.step1": "Insert NHI&nbsp;card",
      "kiosk.step2": "Take a short&nbsp;walk",
      "kiosk.step3": "See your results",
      "kiosk.video": "Health education video",
      "kiosk.carousel": "About the assessment",
      "kiosk.carouselRole": "carousel",
      "kiosk.slideRole": "slide",
      "kiosk.tabUse": "How to use",
      "kiosk.tabCheck": "Self-check",
      "kiosk.tabHow": "How it works",
      "kiosk.tabReport": "Your report",
      "kiosk.useTitle": "Just three steps",
      "kiosk.checkTitle": "Ask yourself",
      "kiosk.q1": "Have you fallen in the past year?",
      "kiosk.q2": "Do you need support to walk or stand up?",
      "kiosk.q3": "Are you worried about falling?",
      "kiosk.qCta": "If any apply, we suggest an assessment",
      "kiosk.howTitle": "Walk at your usual pace<br />from start to finish. That's it!",
      "kiosk.walkStart": "Start",
      "kiosk.walkEnd": "End",
      "kiosk.sample": "Sample",
      "kiosk.riskLevel": "Fall risk level",
      "kiosk.riskLow": "Slightly low",
      "kiosk.reportTitle": "Get your fall risk<br />report right away",
      "kiosk.report1": "Risk level at a glance",
      "kiosk.report2": "Scan the QR code to keep it",
      "kiosk.report3": "Tips made just for you",
      "kiosk.guest": "Guest mode",
      "kiosk.guestSub": "No card needed,<br />start right away",
      "kiosk.or": "or",
      "kiosk.insert": "Insert NHI card",
      "kiosk.insertSub": "Card reader below the screen",
      "kiosk.insertAria": "Please insert your NHI card into the card reader below the screen",
      "kiosk.sbTitle": "Enter standby?",
      "kiosk.sbBody": "The screen will turn off and the video will pause.",
      "kiosk.sbHint": "To wake it, double-tap the screen",
      "kiosk.sbCancel": "Cancel",
      "kiosk.sbOk": "Enter standby",
      "kiosk.standby": "Standby",
      "kiosk.standbySub": "Double-tap the screen to wake",

      /* 測驗完成彈窗（assess.html） */
      "finish.title": "Test Complete",
      "finish.question": "Did you use a walking aid?",
      "finish.no": "No",
      "finish.yes": "Yes",
      "finish.submit": "Submit Results",
      "finish.retake": "Retake",
      "finish.hint": "Please choose Yes or No first",

      /* 一體機同意頁、隱私權政策（kiosk-consent.html）。注意：同意頁與政策的外文翻譯要經過法務確認 */
      "consent.docTitle": "建豐健康科技 - Consent to Data Collection and Testing",
      "consent.title": "Consent to Data Collection and Testing",
      "consent.intro": "Before the test, please note the following:",
      "consent.item1": "Collect your basic information",
      "consent.item2": "Record video of your walking",
      "consent.item3": "AI analysis of gait and balance",
      "consent.item4": "Generate a fall risk assessment",
      "consent.note": "* Results are for health reference only and are not a medical diagnosis.",
      "consent.attach": "Attachment",
      "consent.policy": "Full Privacy Policy",
      "consent.policySub": "13 sections · Tap to read",
      "consent.view": "View",
      "consent.decline": "Decline and Exit",
      "consent.agree": "I Agree",
      "consent.agreeSub": "Tap to confirm",
      "policy.title": "Privacy Policy",
      "policy.close": "Close",
      "policy.langNote": "※ English version coming soon.",

      /* 鑑測結果頁（result.html、result-gait.html）：js/result-common.js、各頁 data-i18n */
      "res.docTitle.gait": "建豐健康科技 - Walking Test Results",
      "res.docTitle.sppb": "建豐健康科技 - SPPB Results",
      "res.home": "Back to home",
      "res.homeKiosk": "Back to kiosk",
      "res.back": "Subject list",
      "res.report": "Report",
      "res.reportSub": "Scan for full details",
      "res.reportAria.gait": "Open the detailed walking test report",
      "res.reportAria.sppb": "Open the detailed SPPB report",
      "res.demo": "Demo",
      "res.demoAria": "Demo: switch risk level",
      "res.pager": "Page navigation",
      "res.swipe": "Swipe to see more",
      "res.notFound": "Record not found",
      "res.overview": "Results Overview",
      "res.riskSub": "Fall risk assessment",
      "res.gaugeAria": "Fall risk gauge",
      "res.riskTitle": "Current risk level: {name}",
      "res.viviK": "VIVIFRAIL level",
      "res.vivi.A": "A Disabled",
      "res.vivi.B": "B Frail",
      "res.vivi.C": "C Pre-frail",
      "res.vivi.D": "D Robust",
      "res.outOf12": "Out of 12 points",
      "res.peer.above": "Better than {n} of peers",
      "res.peer.below": "Below {n} of peers",
      "res.peer.behind": "Behind {n} of peers",
      "res.you": "You",
      "res.weaker": "Weaker",
      "res.middle": "Middle",
      "res.stronger": "Stronger",
      "res.cardChart": "Details: chart",
      "res.cardData": "Details: data",
      "res.details": "Details",
      "res.kindChart": "· Chart",
      "res.kindData": "· Data",
      "res.radarAria": "Radar chart of the three test scores",
      "res.balance": "Balance",
      "res.gait": "Gait",
      "res.chair": "Chair stand",
      "res.measures": "Measurements",
      "res.m.walk": "Gait speed",
      "res.m.chair": "Five chair stands",
      "res.m.side": "Side-by-side",
      "res.m.semi": "Semi-tandem",
      "res.m.tandem": "Tandem",
      "res.unable": "Unable",
      "res.sec": "s",
      "res.rec": "Recommended Product",
      "res.recEmpty": "No recommendation available",
      "res.news": "News",
      "res.newsEmpty": "No news yet",
      "res.newsCta": "Ask at the store counter for details",
      "res.video": "Recommended Video",
      "res.videoEmpty": "No video available",
      "res.videoTap": "Tap to watch",
      "res.videoAria": "Open the video player",
      "res.close": "Close",
      "res.videoHint": "Tap “Close” to return to your results",
      "res.care": "Care Services",
      "res.careDanger": "For danger level",
      "res.careHigh": "For high risk",
      "res.careOther": "For {short} risk",
      "res.hotline": "Hotline",
      "res.qrDemo": "Sample QR.<br>Scannable in the final version",
    },
  };
  const LANGS = Object.keys(DICT);
  const DEFAULT = "zh-TW";
  const FULL = document.documentElement.hasAttribute("data-app-i18n"); // 整頁翻譯

  function stored() {
    try {
      const v = sessionStorage.getItem("kf.lang");
      if (LANGS.includes(v)) return v;
    } catch (e) {}
    return DEFAULT;
  }
  let lang = stored();

  const has = (key) => key in DICT[DEFAULT];
  function t(key, params) {
    const s = DICT[lang][key] ?? DICT[DEFAULT][key] ?? key;
    return params ? s.replace(/\{(\w+)\}/g, (m, k) => params[k] ?? m) : s;
  }

  /* 日文字型：切到日文才載入（css/app-i18n.css 讓它優先） */
  let jaFonts = false;
  function loadJaFonts() {
    if (jaFonts) return;
    jaFonts = true;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500;700&family=Noto+Serif+JP:wght@600&display=swap";
    link.onload = () =>
      requestAnimationFrame(() => document.fonts?.ready.then(() => document.dispatchEvent(new Event("app:fontsready"))));
    document.head.appendChild(link);
  }
  function applyLang() {
    const root = document.documentElement;
    if (FULL) root.lang = lang;
    root.dataset.navLang = lang; // 導覽列的字級與行數
    if (lang === "ja") loadJaFonts();
  }

  function apply(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    root.querySelectorAll("[data-i18n-html]").forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
    root.querySelectorAll("[data-i18n-attr]").forEach((el) =>
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":");
        el.setAttribute(attr.trim(), t(key.trim()));
      }),
    );
  }

  function sync() {
    const next = stored();
    if (next === lang) return;
    lang = next;
    applyLang();
    apply();
    document.dispatchEvent(new CustomEvent("app:langchange", { detail: { lang } }));
  }

  applyLang();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => apply());
  else apply();
  document.addEventListener("kf:langchange", sync);
  // 從瀏覽器上一頁回來（頁面快取）：語系可能已在別頁改變
  addEventListener("pageshow", (e) => e.persisted && sync());

  window.t = t;
  window.AppI18n = { LANGS, t, has, apply, get lang() { return lang; } };
})();
