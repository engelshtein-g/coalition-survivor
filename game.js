/* שרוד את הקואליציה — מנוע המשחק (client-side בלבד) */
(function () {
  "use strict";

  var RING_C = 2 * Math.PI * 32;                 // היקף הטבעת (~201.06)
  var START = 55, LOW = 22;
  var DRIFT = { coalition: -2, public: -3, budget: -3 }; // שחיקת שלטון
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
    budget: { verdict: "הקופה התרוקנה", reason: "אין כסף. אפילו הקפה בישיבת הממשלה עבר לתשלום." }
  };
  var TITLES = {
    coalition: ["מפרק הקואליציות", "אמן ההבטחות", "זה שנתנו לו יותר מדי"],
    public: ["המנואץ", "אויב הרחוב", "זה שלא הקשיב"],
    budget: ["פושט הרגל", "מפזר הכספים", "זה שגמר את הקופה"]
  };
  function tierPrefix(d) { if (d < 80) return "כהונת בזק — "; if (d >= 500) return "האגדה — "; if (d >= 260) return "הוותיק — "; return ""; }
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
    $("end-title").textContent = tierPrefix(state.days) + '"' + pool[rint(pool.length)] + '"';
    $("share-hint").textContent = "";
    show("screen-end");
  }

  /* ---------- שיתוף ---------- */
  function shareText() {
    var word = { coalition: "השותפים ברחו", public: "העם התקומם", budget: "נגמר הכסף" }[state.cause];
    return "שרדתי " + state.days.toLocaleString("he-IL") + " ימים כראש ממשלה. נפלתי כי " +
      word + ". התואר שלי: " + $("end-title").textContent + ". תשרוד יותר ממני?";
  }
  function doShare() {
    var text = shareText(), url = location.href.split("#")[0];
    if (navigator.share) { navigator.share({ title: "שרוד את הקואליציה", text: text, url: url }).catch(function () {}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(text + " " + url).then(function () { $("share-hint").textContent = "הועתק ללוח — הדבק ושתף."; }, function () { $("share-hint").textContent = text; }); }
    else { $("share-hint").textContent = text; }
  }

  /* ---------- חיבור ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    $("btn-start").addEventListener("click", newGame);
    $("btn-again").addEventListener("click", function () { show("screen-start"); });
    $("btn-share").addEventListener("click", doShare);
    $("newsflash").addEventListener("click", proceed);
  });
})();
