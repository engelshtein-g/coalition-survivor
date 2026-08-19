/* שרוד את הקואליציה — מנוע המשחק (client-side בלבד) */
(function () {
  "use strict";

  var RING_C = 2 * Math.PI * 32;                 // היקף הטבעת (~201.06)
  var START = 55, LOW = 22;
  var DRIFT = { coalition: -4, public: -2, budget: -3 }; // שחיקת שלטון — מכויל לפילוח מוות מאוזן (~35/35/30)
  var METERS = ["coalition", "public", "budget"];
  var NAMES = { coalition: "קואליציה", public: "ציבור", budget: "תקציב" };
  var MILESTONES = [
    { d: 100, t: "ימים בשלטון — כבר יותר מהרבה" },
    { d: 200, t: "ימים. אתה תופעה" },
    { d: 365, t: "שנה שלמה בשלטון" },
    { d: 500, t: "ימים. הפרשנים המומים" },
    { d: 730, t: "שנתיים. אגדה חיה" },
    { d: 1000, t: "ימים. נכנסת להיסטוריה" }
  ];

  var state = null, deck = [];
  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (n) { return Math.max(0, Math.min(100, n)); };
  var rint = function (max) { return Math.floor(Math.random() * max); };
  function track(name, data) { try { if (window.umami) window.umami.track(name, data); } catch (e) {} }

  function show(id) {
    var s = document.querySelectorAll(".screen");
    for (var i = 0; i < s.length; i++) s[i].classList.remove("is-active");
    $(id).classList.add("is-active");
    window.scrollTo(0, 0);
  }

  function reshuffle() {
    deck = EVENTS.filter(function (e) { return !e.chainOnly; });
    for (var i = deck.length - 1; i > 0; i--) { var j = rint(i + 1), t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
  }
  function byId(id) { for (var i = 0; i < EVENTS.length; i++) if (EVENTS[i].id === id) return EVENTS[i]; return null; }
  function drawEvent() {
    if (state.forcedNext) {
      var f = byId(state.forcedNext); state.forcedNext = null;
      if (f) { if (f.once) state.usedOnce[f.id] = 1; return f; }
    }
    var guard = 0;
    while (guard++ < 300) {
      if (deck.length === 0) reshuffle();
      var ev = deck.pop();
      if (ev === state.lastEv) continue;
      if (ev.once && state.usedOnce[ev.id]) continue;
      if (ev.once) state.usedOnce[ev.id] = 1;
      return ev;
    }
    return EVENTS[0];
  }

  /* ---------- התחלה ---------- */
  function newGame() {
    track("game_start");
    state = {
      meters: { coalition: START, public: START, budget: START },
      days: 0, current: null, locked: false,
      forcedNext: null, usedOnce: {}, lastEv: null,
      pending: null, lastMilestone: 0, cause: null
    };
    reshuffle();
    $("case-no").textContent = (24 + rint(3)) + "-" + (1000 + rint(9000));
    renderMeters(false);
    $("days").textContent = "0";
    show("screen-play");
    nextTurn();
  }

  function nextTurn() {
    state.current = drawEvent();
    state.lastEv = state.current;
    state.locked = false;
    renderEvent(state.current);
  }

  /* ---------- רינדור ---------- */
  function renderEvent(ev) {
    var cable = $("cable");
    $("ev-tag").textContent = ev.tag;
    $("ev-title").textContent = ev.title;
    $("ev-text").textContent = ev.text;
    cable.classList.toggle("is-breaking", ev.type === "breaking");
    cable.querySelector(".cable__stamp-line").textContent =
      ev.type === "breaking" ? "מבזק · לטיפול מיידי" : "מברק · לטיפול";
    var box = $("choices"); box.innerHTML = "";
    ev.choices.forEach(function (c, idx) {
      var b = document.createElement("button");
      b.className = "choice"; b.type = "button"; b.textContent = c.label;
      b.addEventListener("click", function () { pick(idx); });
      box.appendChild(b);
    });
    cable.classList.remove("is-enter"); void cable.offsetWidth; cable.classList.add("is-enter");
  }

  function renderMeters(animateDelta) {
    METERS.forEach(function (k) {
      var v = state.meters[k];
      $("ring-" + k).style.strokeDashoffset = (RING_C * (1 - v / 100)).toFixed(1);
      $("val-" + k).textContent = Math.round(v);
      var g = document.querySelector('.gauge[data-meter="' + k + '"]');
      if (v <= LOW) g.classList.add("is-low"); else g.classList.remove("is-low");
    });
  }

  function flashDeltas(deltas) {
    METERS.forEach(function (k) { $("val-" + k).classList.remove("bump"); $("delta-" + k).classList.remove("show"); });
    void document.body.offsetWidth; // reflow אחד לאיפוס האנימציות
    METERS.forEach(function (k) {
      var d = deltas[k], badge = $("delta-" + k), val = $("val-" + k);
      val.classList.add("bump");
      if (!d) { badge.className = "ring-delta"; badge.textContent = ""; return; }
      badge.textContent = (d > 0 ? "+" : "") + d;
      badge.className = "ring-delta " + (d > 0 ? "up" : "down") + " show";
    });
  }

  /* ---------- בחירה ---------- */
  function pick(idx) {
    if (state.locked) return;
    state.locked = true;
    var choice = state.current.choices[idx];

    // חישוב שינוי אמיתי (כולל שחיקה) לכל מד
    var deltas = {};
    METERS.forEach(function (k) {
      var old = state.meters[k];
      state.meters[k] = clamp(old + (choice.eff[k] || 0) + DRIFT[k]);
      deltas[k] = Math.round(state.meters[k] - old);
    });
    state.days += 12 + rint(22);
    $("days").textContent = state.days.toLocaleString("he-IL");

    // הטבעות זזות + מספרים עפים, ומבזק חולף על המסך
    renderMeters(true);
    flashDeltas(deltas);
    if (choice.then) state.forcedNext = choice.then;
    newsflash(choice.out || "וכך זה נמשך.", state.current.type === "breaking", deltas);
    state.nfTimer = setTimeout(proceed, 2700);
  }

  function newsflash(text, breaking, deltas) {
    $("nf-label").textContent = breaking ? "מבזק" : "עדכון";
    $("nf-text").textContent = text;
    $("nf-date").textContent = "יום " + state.days.toLocaleString("he-IL") + " לכהונה";
    $("nf-sub").textContent = METERS.map(function (k) {
      var v = deltas[k]; return NAMES[k] + " " + (v > 0 ? "+" : "") + v;
    }).join("   ·   ");
    var el = $("newsflash");
    el.classList.remove("is-on", "breaking");
    if (breaking) el.classList.add("breaking");
    void el.offsetWidth;
    el.classList.add("is-on");
  }

  function proceed() {
    var el = $("newsflash");
    if (!el.classList.contains("is-on")) return; // כבר טופל (למניעת קליק+טיימר כפולים)
    clearTimeout(state.nfTimer);
    el.classList.remove("is-on");
    var dead = deadMeter();
    if (dead) { state.cause = dead; setTimeout(function () { endGame(dead); }, 200); return; }
    var ms = crossedMilestone();
    if (ms) { showMilestone(ms); return; }
    nextTurn();
  }

  function deadMeter() {
    var m = state.meters;
    if (m.coalition <= 0) return "coalition";
    if (m.public <= 0) return "public";
    if (m.budget <= 0) return "budget";
    if (m.coalition >= 92) return "overreach"; // חזק מדי → מפוצץ לבחירות מוקדמות בביטחון יתר
    return null;
  }

  /* ---------- אבני דרך ---------- */
  function crossedMilestone() {
    for (var i = 0; i < MILESTONES.length; i++) {
      if (state.days >= MILESTONES[i].d && MILESTONES[i].d > state.lastMilestone) {
        state.lastMilestone = MILESTONES[i].d;
        return MILESTONES[i];
      }
    }
    return null;
  }
  function showMilestone(ms) {
    $("ms-num").textContent = ms.d;
    $("ms-text").textContent = ms.t;
    var el = $("milestone");
    el.classList.add("is-on");
    var done = false;
    var close = function () { if (done) return; done = true; el.classList.remove("is-on"); el.removeEventListener("click", close); setTimeout(nextTurn, 150); };
    el.addEventListener("click", close);
    setTimeout(close, 1900);
  }

  /* ---------- סיום ---------- */
  var CAUSE = {
    coalition: { verdict: "הקואליציה התפרקה", reason: "השותפים לקחו את הכיסאות, את התיקים, ואת רכבי השרד — והלכו." },
    public: { verdict: "העם איבד אמון", reason: "הרחוב ניצח. יצאת מהלשכה דרך הדלת האחורית, בלי צילומים." },
    budget: { verdict: "הקופה התרוקנה", reason: "אין כסף. אפילו הקפה בישיבת הממשלה עבר לתשלום." },
    overreach: { verdict: "פיזרת לבחירות מוקדמות", reason: "היית חזק מדי, בטוח מדי. הלכת לבחירות בראש שקט — וחזרת עם 40% פחות." }
  };
  var TITLES = {
    coalition: ["מפרק הקואליציות", "אמן ההבטחות", "זה שנתנו לו יותר מדי", "קצר הנשימה", "מלך הרוטציה", "האיש של יום אחד בכנסת"],
    public: ["המנואץ", "אויב הרחוב", "זה שלא הקשיב", "שר הצנע", "מי-שהיה", "האויב מספר אחת של הכיכר"],
    budget: ["פושט הרגל", "מפזר הכספים", "זה שגמר את הקופה", "אלוף הגירעון", "השר שהדפיס", "מוכר הנכסים הלאומיים"],
    overreach: ["השאפתן", "שיכור מכוח", "זה שקרא לבחירות", "הקיסר של רגע", "האיש שהאמין לסקרים", "יותר מדי, מהר מדי"]
  };
  function tierPrefix(d) { if (d < 80) return "כהונת בזק — "; if (d >= 500) return "האגדה — "; if (d >= 260) return "הוותיק — "; return ""; }
  // אחוזון מכויל מסימולציה של אוכלוסייה מעורבת (10k משחקים: נוטשים/אקראי/רגיל/מיומן).
  // אינטרפולציה לינארית בין נקודות העקומה. חסום ב-99 (תמיד יש טוב ממך). מוחלף בדאטה אמיתי אם יהיה לוח מובילים.
  function percentileBeat(d) {
    var pts = [[0,0],[50,1],[80,5],[120,12],[160,23],[200,36],[250,54],[300,73],[360,89],[430,98],[520,99]];
    for (var i = 1; i < pts.length; i++) {
      if (d <= pts[i][0]) {
        var a = pts[i-1], b = pts[i], f = (d - a[0]) / (b[0] - a[0]);
        return Math.max(1, Math.round(a[1] + f * (b[1] - a[1])));
      }
    }
    return 99;
  }
  function personalBest(d) {
    var best = 0;
    try { best = parseInt(localStorage.getItem("cs_best") || "0", 10) || 0; } catch (e) {}
    var isNew = d > best;
    if (isNew) { try { localStorage.setItem("cs_best", String(d)); } catch (e) {} }
    return { best: Math.max(best, d), isNew: isNew };
  }
  function rankLine(d) {
    if (d < 60) return "כהונת בזק. הקואליציה לא הספיקה להתחמם.";
    if (d < 150) return "שרדת — אבל בקושי. עוד ניסיון?";
    if (d < 300) return "לא רע בכלל. יותר מהרבה ממשלות אמיתיות.";
    if (d < 500) return "ותיק. הפרשנים כבר כותבים עליך ספרים.";
    return "אגדה. נכנסת להיסטוריה (וגם לפיד).";
  }

  function endGame(cause) {
    track("game_over", { days: state.days, cause: cause });
    var c = CAUSE[cause];
    $("end-cause").textContent = c.verdict;
    $("end-reason").textContent = c.reason;
    $("end-days").textContent = state.days.toLocaleString("he-IL");
    $("end-rank").textContent = rankLine(state.days);
    var pool = TITLES[cause];
    state.title = tierPrefix(state.days) + '"' + pool[rint(pool.length)] + '"';
    $("end-title").textContent = state.title;

    var pct = percentileBeat(state.days);
    var pb = personalBest(state.days);
    state.pct = pct;
    var stats = "שרדת יותר מ-" + pct + "% מהשחקנים";
    stats += pb.isNew ? "   ·   שיא אישי חדש" : ("   ·   השיא שלך: " + pb.best.toLocaleString("he-IL") + " ימים");
    $("end-stats").textContent = stats;

    $("share-hint").textContent = "";
    show("screen-end");
    drawShareCard(cause, pct); // מכין כרטיס PNG לשיתוף
  }

  /* ---------- שיתוף ---------- */
  function shareText() {
    var title = state.title || $("end-title").textContent;
    var d = state.days.toLocaleString("he-IL");
    return title + " — כך כינו אותי אחרי " + d + " ימים כראש ממשלה, ושרדתי יותר מ-" +
      (state.pct || 0) + "% מהשחקנים. תשרוד יותר ממני?";
  }

  /* מצייר כרטיס PNG לשיתוף (מאוחסן ב-state.shareBlob/shareCanvas) */
  function drawRing(x, cx, cy, r, val, color) {
    x.lineWidth = 18; x.lineCap = "round";
    x.strokeStyle = "rgba(255,255,255,.10)";
    x.beginPath(); x.arc(cx, cy, r, 0, 2 * Math.PI); x.stroke();
    x.strokeStyle = color;
    var start = -Math.PI / 2;
    x.beginPath(); x.arc(cx, cy, r, start, start + 2 * Math.PI * (Math.max(0, val) / 100)); x.stroke();
    x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
    x.font = "800 56px Rubik,Heebo,sans-serif";
    x.fillText(String(Math.round(val)), cx, cy + 2);
    x.textBaseline = "alphabetic";
  }
  function drawShareCard(cause, pct) {
    try {
      var W = 1080, H = 1350;
      var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      var x = cv.getContext("2d");
      var g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#182633"); g.addColorStop(1, "#0f1922");
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.strokeStyle = "rgba(255,255,255,.12)"; x.lineWidth = 2; x.strokeRect(40, 40, W - 80, H - 80);
      x.textAlign = "center"; x.direction = "rtl";

      x.fillStyle = "#8fa3b3"; x.font = "600 36px Rubik,Heebo,sans-serif";
      x.fillText("שרוד את הקואליציה", W / 2, 140);
      x.fillStyle = "#ef4d6b"; x.font = "800 54px Rubik,Heebo,sans-serif";
      x.fillText(CAUSE[cause].verdict, W / 2, 230);

      x.fillStyle = "#fff"; x.font = "900 230px Rubik,Heebo,sans-serif";
      x.fillText(state.days.toLocaleString("he-IL"), W / 2, 490);
      x.fillStyle = "#8fa3b3"; x.font = "600 42px Rubik,Heebo,sans-serif";
      x.fillText("ימים בשלטון", W / 2, 555);

      x.fillStyle = "#c7b8ff"; x.font = "800 48px Rubik,Heebo,sans-serif";
      var title = state.title || "";
      if (x.measureText(title).width > W - 160) x.font = "800 40px Rubik,Heebo,sans-serif";
      x.fillText(title, W / 2, 660);

      var meters = [
        { k: "coalition", c: "#22b07d", n: "קואליציה" },
        { k: "public", c: "#3d8bf0", n: "ציבור" },
        { k: "budget", c: "#f0a13d", n: "תקציב" }
      ];
      var cy = 900, r = 92, third = W / 3;
      meters.forEach(function (m, i) {
        var cx = third * (i + 0.5);
        drawRing(x, cx, cy, r, state.meters[m.k], m.c);
        x.fillStyle = "#8fa3b3"; x.font = "600 36px Rubik,Heebo,sans-serif";
        x.fillText(m.n, cx, cy + r + 58);
      });

      x.fillStyle = "#fff"; x.font = "700 44px Rubik,Heebo,sans-serif";
      x.fillText("שרדת יותר מ-" + pct + "% מהשחקנים", W / 2, 1180);
      x.fillStyle = "#6f8496"; x.font = "600 34px Rubik,Heebo,sans-serif";
      x.fillText("engelshtein-g.github.io/coalition-survivor", W / 2, 1280);

      state.shareCanvas = cv;
      state.shareBlob = null;
      if (cv.toBlob) cv.toBlob(function (b) { state.shareBlob = b; }, "image/png");
    } catch (e) { state.shareCanvas = null; state.shareBlob = null; }
  }

  function doShare() {
    var text = shareText(), url = location.href.split("#")[0];
    // 1) עדיף: שיתוף עם תמונת הכרטיס (מובייל)
    if (state.shareBlob && navigator.canShare) {
      try {
        var file = new File([state.shareBlob], "coalition-survivor.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], text: text, url: url }).catch(function () {});
          return;
        }
      } catch (e) {}
    }
    // 2) שיתוף טקסט מקורי (מובייל בלי קבצים)
    if (navigator.share) { navigator.share({ title: "שרוד את הקואליציה", text: text, url: url }).catch(function () {}); return; }
    // 3) דסקטופ: מוריד את הכרטיס + מעתיק טקסט
    if (state.shareCanvas) {
      try {
        var a = document.createElement("a");
        a.href = state.shareCanvas.toDataURL("image/png");
        a.download = "coalition-survivor.png"; a.click();
        $("share-hint").textContent = "הכרטיס ירד למכשיר — שתף אותו.";
      } catch (e) {}
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text + " " + url).then(function () {
        if (!$("share-hint").textContent) $("share-hint").textContent = "הטקסט הועתק ללוח — הדבק ושתף.";
      }, function () { if (!$("share-hint").textContent) $("share-hint").textContent = text; });
    } else if (!$("share-hint").textContent) { $("share-hint").textContent = text; }
  }

  /* ---------- חיבור ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    $("btn-start").addEventListener("click", newGame);
    $("btn-again").addEventListener("click", function () { show("screen-start"); });
    $("btn-share").addEventListener("click", doShare);
    $("newsflash").addEventListener("click", proceed);
  });
})();
