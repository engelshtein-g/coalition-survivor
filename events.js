// שרוד את הקואליציה — בנק האירועים
// event: {id, tag, title, text, choices[], type?, once?}
// choice: {label, eff{coalition,public,budget}, out (כותרת/תגובה סאטירית), then? (id אירוע כפוי הבא)}
// type:"breaking" => מבזק (הבזק אדום). מדים בטווח 0–100.

const EVENTS = [
  {
    id: 'haredi_budget', tag: 'קואליציה',
    title: 'אולטימטום מהשותף החרדי',
    text: 'יו״ר הסיעה החרדית: או שמעביר תקציב עתק לישיבות עד חצות — או שהוא מפרק את הממשלה. הוא כבר עם המעיל.',
    choices: [
      { label: 'מעביר את התקציב', eff:{coalition:18,public:-14,budget:-22}, out:'הישיבות חוגגות. משלמי המסים פחות.' },
      { label: 'מסרב בתוקף', eff:{coalition:-26,public:10,budget:4}, out:'"עקרונות!" צעק, והלך לתקשורת.' },
      { label: '"נקים ועדה שתבחן"', eff:{coalition:-6,public:-4,budget:0}, out:'הוועדה תדון. אי־שם ב-2031.' },
    ],
  },
  {
    id: 'cost_of_living', tag: 'כלכלה',
    title: 'מחיר הקוטג׳ שוב עלה',
    text: 'הקוטג׳ חצה שקל כלפי מעלה. הרשת רותחת, קוראים לחרם, ושר האוצר מציע "לא לאכול קוטג׳".',
    choices: [
      { label: 'מפחית מע"מ על מוצרי יסוד', eff:{coalition:-6,public:20,budget:-18}, out:'העם מרוצה. הגירעון פחות.' },
      { label: 'מאשים את הרשתות', eff:{coalition:4,public:-6,budget:0}, out:'הרשתות מאשימות אותך בחזרה.' },
      { label: 'מצטלם בסופר עם עגלה', eff:{coalition:0,public:-12,budget:-1}, out:'"מנותק" עלה לטרנדינג.' },
    ],
  },
  {
    id: 'protest', tag: 'רחוב', type:'breaking',
    title: 'המונים בכיכר',
    text: 'מאתיים אלף חוסמים את איילון ודורשים את התפטרותך. הביאו גם תופים. הרבה תופים.',
    choices: [
      { label: 'יוצא בהצהרה מרגיעה', eff:{coalition:-4,public:12,budget:-2}, out:'הטון הרגוע עבד. הפעם.' },
      { label: 'שולח מים וסוסים', eff:{coalition:8,public:-22,budget:-6}, out:'הכיכר התרוקנה. גם האמון.' },
      { label: 'טס לחו"ל "לפגישה מדינית"', eff:{coalition:-2,public:-16,budget:-8}, out:'ברחת. צילמו אותך בשדה.' },
    ],
  },
  {
    id: 'corruption', tag: 'משפט',
    title: 'מעטפה עם השם שלך',
    text: 'תחקירן פרסם שקיבלת מעטפה חומה. אתה בטוח שזה היה מתכון לחמין, אבל הכותרת כבר רצה.',
    choices: [
      { label: '"רדיפה פוליטית!"', eff:{coalition:6,public:-10,budget:0}, out:'הבסיס מריע. השאר מגלגלים עיניים.' },
      { label: 'מוסר גרסה למשטרה', eff:{coalition:-8,public:8,budget:-2}, out:'שיתוף פעולה. השותפים לחוצים.' },
      { label: 'מדליף תיק על היריב', eff:{coalition:4,public:-4,budget:-3}, out:'עכשיו לשניכם יש מעטפות.' },
    ],
  },
  {
    id: 'settler_outpost', tag: 'קואליציה',
    title: 'מאחז חדש עלה בלילה',
    text: 'השר להתיישבות "לא ידע" על מאחז שצץ על גבעה. הוא מבקש רק חשמל, כביש, וקצת לגיטימציה.',
    choices: [
      { label: 'מכשיר בשקט', eff:{coalition:16,public:-12,budget:-8}, out:'הימין מאושר. וושינגטון פחות.' },
      { label: 'מפנה בבוקר', eff:{coalition:-22,public:6,budget:-4}, out:'השר איים להתפטר עד הצהריים.' },
      { label: '"המצב מורכב"', eff:{coalition:-4,public:-6,budget:0}, out:'כולם כועסים באופן שווה.' },
    ],
  },
  {
    id: 'doctors_strike', tag: 'רחוב',
    title: 'הרופאים בשביתה',
    text: 'ההסתדרות הרפואית משביתה. אמא שלך מתקשרת לשאול אם אין תורים, ואם אתה אשם.',
    choices: [
      { label: 'מתקצב תוספת שכר', eff:{coalition:-6,public:16,budget:-20}, out:'התורים חזרו. הקופה נאנחה.' },
      { label: 'מוציא צו ריתוק', eff:{coalition:6,public:-14,budget:-2}, out:'הרופאים חזרו בכעס.' },
      { label: 'מודה שאתה "בקשב"', eff:{coalition:0,public:-8,budget:0}, out:'"קשב" לא מרפא, מסתבר.' },
    ],
  },
  {
    id: 'appointment', tag: 'קואליציה',
    title: 'מינוי מקורב',
    text: 'בן דוד של שר בכיר מועמד לנהל חברה ממשלתית. מוכשר מאוד, בעיקר בקרבה משפחתית.',
    choices: [
      { label: 'ממנה, "הכי מתאים"', eff:{coalition:12,public:-16,budget:-4}, out:'"ג׳וב" עלה לכותרות.' },
      { label: 'מכריז על מכרז אמיתי', eff:{coalition:-16,public:14,budget:-2}, out:'השר נעלב עמוקות.' },
      { label: 'דוחה ל"בדיקה"', eff:{coalition:-4,public:-2,budget:0}, out:'הבדיקה תסתיים אחרי הבחירות.' },
    ],
  },
  {
    id: 'gas_deal', tag: 'כלכלה',
    title: 'עסקת הגז',
    text: 'תאגיד ענק מציע עסקת גז שתמלא את הקופה — ותרוקן קצת את האמון. יש גם מצגת.',
    choices: [
      { label: 'חותם על העסקה', eff:{coalition:8,public:-14,budget:24}, out:'הקופה מלאה. הכיכר מתמלאת.' },
      { label: 'דורש תמלוגים כפולים', eff:{coalition:-8,public:12,budget:8}, out:'התאגיד "שוקל אלטרנטיבות".' },
      { label: 'מקפיא לבדיקה', eff:{coalition:-4,public:2,budget:-4}, out:'המניה נפלה. גם הבדיקה.' },
    ],
  },
  {
    id: 'us_call', tag: 'חוץ', type:'breaking',
    title: 'שיחה מוושינגטון',
    text: 'שיחה דחופה מהבית הלבן. הם "מודאגים". לא ברור ממה, אבל הטון ברור.',
    choices: [
      { label: 'מתיישר עם הבקשה', eff:{coalition:-14,public:6,budget:6}, out:'וושינגטון מרוצה. הימין רותח.' },
      { label: '"ריבונות! לא מתערבים!"', eff:{coalition:16,public:-6,budget:-8}, out:'הבסיס מריע. השגריר לא.' },
      { label: 'מבטיח ולא עושה', eff:{coalition:4,public:-2,budget:2}, out:'קלאסי. יעבוד עד השיחה הבאה.' },
    ],
  },
  {
    id: 'reform', tag: 'משפט',
    title: 'רפורמה שנויה במחלוקת',
    text: 'שר המשפטים מניח על שולחנך חוק שישנה את מאזן הכוחות. חצי מדינה בעד, חצי כבר קונה דגלים.',
    choices: [
      { label: 'מקדם במלוא הקיטור', eff:{coalition:18,public:-24,budget:-6}, out:'הדגלים אזלו בחנויות.', then:'bagatz_strike' },
      { label: 'מקפיא לדיאלוג', eff:{coalition:-18,public:16,budget:-2}, out:'שני הצדדים כועסים שנכנעת.' },
      { label: 'מפצל ל"שלבים"', eff:{coalition:2,public:-6,budget:0}, out:'אף אחד לא מבין מה עבר.' },
    ],
  },
  {
    id: 'bagatz_strike', tag: 'משפט', once:true, type:'breaking',
    title: 'בג"ץ פוסל, והמשק משבית',
    text: 'ההמשך הישיר: בג"ץ פסל חלק מהרפורמה, וארגוני העובדים הכריזו שביתה כללית. הכל תלוי בך עכשיו.',
    choices: [
      { label: 'מכבד את בג"ץ', eff:{coalition:-16,public:14,budget:-4}, out:'הרחוב נרגע. הקואליציה רועדת.' },
      { label: 'מתעמת חזיתית', eff:{coalition:14,public:-20,budget:-10}, out:'"משבר חוקתי" עלה לכותרת.' },
    ],
  },
  {
    id: 'freebie', tag: 'קואליציה',
    title: 'חוק הפינוקים',
    text: 'סיעה קטנה דורשת רכב שרד נוסף, יועץ, ושני דוברים "כי מגיע". אחרת — הצבעת אי־אמון.',
    choices: [
      { label: 'נותן הכל', eff:{coalition:14,public:-12,budget:-10}, out:'צי הרכבים גדל. האמון קטן.' },
      { label: 'נותן חצי', eff:{coalition:2,public:-4,budget:-4}, out:'חצי מרוצים, חצי מאיימים.' },
      { label: '"תתביישו"', eff:{coalition:-20,public:10,budget:2}, out:'הם התביישו. ואיימו בכל זאת.' },
    ],
  },
  {
    id: 'media_storm', tag: 'רחוב',
    title: 'סערת ציוץ',
    text: 'שר בכיר צייץ בשתיים בלילה משהו שאסור היה לצייץ. עכשיו זו תמונת מצב ביטחונית.',
    choices: [
      { label: 'מוחק ומתנצל', eff:{coalition:-4,public:8,budget:0}, out:'הצילום־מסך כבר בכל מקום.' },
      { label: '"הובן לא נכון"', eff:{coalition:4,public:-10,budget:0}, out:'"הובן בדיוק נכון", ענו לו.' },
      { label: 'מגבה את הציוץ', eff:{coalition:10,public:-16,budget:0}, out:'הבסיס מריע. השגרירים מזמנים.' },
    ],
  },
  {
    id: 'housing', tag: 'כלכלה',
    title: 'מחירי הדיור',
    text: 'זוג צעיר בטלוויזיה מספר שהם גרים אצל ההורים בגיל 34. הראיון ויראלי. אתה מוזכר.',
    choices: [
      { label: 'משיק תוכנית דיור', eff:{coalition:-4,public:18,budget:-20}, out:'תקווה עלתה. וגם הגירעון.' },
      { label: '"תלכו לפריפריה"', eff:{coalition:2,public:-18,budget:0}, out:'גם הפריפריה ענתה: "בואו אתם."' },
      { label: 'מבטיח ועדת דיור', eff:{coalition:0,public:-6,budget:-2}, out:'הוועדה ה-14 לדיור. מזל טוב.' },
    ],
  },
  {
    id: 'security_flareup', tag: 'ביטחון', type:'breaking',
    title: 'הסלמה בגבול',
    text: 'ירי לעבר יישוב, אין נפגעים. הקבינט מחכה להחלטתך. גם כל הפרשנים בכל הערוצים.',
    choices: [
      { label: 'תגובה מדודה', eff:{coalition:2,public:8,budget:-6}, out:'"אחראי", אמרו. "חלש", אמרו אחרים.' },
      { label: 'מבצע רחב', eff:{coalition:10,public:-6,budget:-18}, out:'הכוננות עלתה. גם ההוצאה.' },
      { label: 'מגנה ומאיים', eff:{coalition:-6,public:-10,budget:0}, out:'הגינוי ה-40 השנה.' },
    ],
  },
  {
    id: 'religious_status', tag: 'קואליציה',
    title: 'סערת סטטוס קוו',
    text: 'ויכוח על תחבורה ציבורית בשבת. שני שותפים באותה קואליציה מאיימים זה על זה בפרסומים.',
    choices: [
      { label: 'משאיר כמו שהיה', eff:{coalition:6,public:-6,budget:0}, out:'"פחדן", אמרו שניהם.' },
      { label: 'מרחיב קווים', eff:{coalition:-18,public:14,budget:-4}, out:'החילונים מרוצים. הקואליציה רועדת.' },
      { label: '"סוגיה עדינה"', eff:{coalition:-2,public:-6,budget:0}, out:'עדינה כמו רימון.' },
    ],
  },
  {
    id: 'budget_vote', tag: 'כלכלה',
    title: 'הצבעת התקציב',
    text: 'עוד יומיים מצביעים על התקציב. חסרים שני קולות. שני ח"כים "מתלבטים", ואוהבים לטייל.',
    choices: [
      { label: 'משריין תקציב למחוזם', eff:{coalition:16,public:-8,budget:-14}, out:'הקולות נמצאו. במקרה.' },
      { label: 'לוחץ בעדינות', eff:{coalition:6,public:0,budget:-2}, out:'הצביעו. בלי חיוך.' },
      { label: 'סומך על ההיגיון', eff:{coalition:-18,public:4,budget:0}, out:'טעות. הם הצביעו נגד.' },
    ],
  },
  {
    id: 'scandal_minister', tag: 'משפט',
    title: 'שר עם בעיה',
    text: 'שר בממשלתך נתפס במשהו מביך שקשה להסביר בציוץ. הוא מבקש "גיבוי מלא ורגוע".',
    choices: [
      { label: 'מפטר מיד', eff:{coalition:-14,public:16,budget:0}, out:'"מנהיגות!", אמרו. השר לא.' },
      { label: 'מגבה "עד תום החקירה"', eff:{coalition:12,public:-16,budget:0}, out:'החקירה תארך שנתיים. נוחות.' },
      { label: 'מעביר לתיק פחות חשוב', eff:{coalition:2,public:-6,budget:0}, out:'שר לענייני כלום. קיים דבר כזה.' },
    ],
  },
  {
    id: 'poll', tag: 'רחוב',
    title: 'הסקר של שישי',
    text: 'סקר חדש: המפלגה שלך מתרסקת. הפרשנים כבר מציירים גרפים אדומים. הטלפון מלא.',
    choices: [
      { label: 'משיק "מהלך דרמטי"', eff:{coalition:-8,public:14,budget:-10}, out:'הדרמה עבדה. לשבוע.' },
      { label: '"סקרים לא מעניינים אותי"', eff:{coalition:2,public:-8,budget:0}, out:'אמר, וריענן את העמוד.' },
      { label: 'מזמין סקר נגדי', eff:{coalition:2,public:-4,budget:-3}, out:'הסקר שלך אמר שאתה מנצח. מוזר.' },
    ],
  },
  {
    id: 'coalition_rebel', tag: 'קואליציה',
    title: 'מרד קטן',
    text: 'ח"כ מהקואליציה מודיע ש"מצביע לפי מצפונו" מעכשיו. מצפון זה דבר יקר בקואליציה צרה.',
    choices: [
      { label: 'ממנה אותו ליו"ר ועדה', eff:{coalition:12,public:-6,budget:-6}, out:'המצפון נרגע. פלא.' },
      { label: 'מאיים בפיזור', eff:{coalition:-6,public:2,budget:0}, out:'הוא "יחשוב על זה".' },
      { label: 'מתעלם ומקווה', eff:{coalition:-12,public:0,budget:0}, out:'הוא הצביע נגד. מפתיע.' },
    ],
  },
  {
    id: 'windfall', tag: 'מזל', type:'breaking', once:true,
    title: 'גילוי שדה גז ענק',
    text: 'הפתעה נדירה: התגלה שדה גז עצום מול החוף. פתאום יש כסף, ופתאום כולם רוצים חלק.',
    choices: [
      { label: 'משקיע בקרן לאזרחים', eff:{coalition:-4,public:22,budget:14}, out:'העם המום לטובה.' },
      { label: 'מזרים לקואליציה', eff:{coalition:20,public:-8,budget:10}, out:'השותפים לא זכרו שאתה קיים. עכשיו כן.' },
    ],
  },
  {
    id: 'strike_transport', tag: 'רחוב',
    title: 'הרכבות נעצרו',
    text: 'עובדי הרכבת השביתו בבוקר. המדינה תקועה בפקק אחד ענק, וכולם מקללים בשמך.',
    choices: [
      { label: 'נכנע לדרישות', eff:{coalition:-4,public:12,budget:-16}, out:'הרכבות זזו. גם הגירעון.' },
      { label: 'מוציא צו', eff:{coalition:6,public:-10,budget:-2}, out:'חזרו לעבודה. בפרצוף חמוץ.' },
      { label: 'ממליץ "לעבוד מהבית"', eff:{coalition:0,public:-8,budget:0}, out:'לנהג האוטובוס אין "בית לעבוד ממנו".' },
    ],
  },
  {
    id: 'vip_flight', tag: 'משפט',
    title: 'טיסת השרד',
    text: 'התפרסם שהמטוס שלך הוזמן עם מיטה זוגית ומקרר יוקרה. הכותרת: "ישן טוב על חשבוננו".',
    choices: [
      { label: 'מוותר על השדרוג', eff:{coalition:-2,public:12,budget:2}, out:'צניעות עלתה לטרנד. נדיר.' },
      { label: '"נדרש מטעמי ביטחון"', eff:{coalition:2,public:-14,budget:-4}, out:'מיטה זוגית ביטחונית. חדשנות.' },
      { label: 'מאשים את הקודמים', eff:{coalition:0,public:-6,budget:0}, out:'"הם התחילו" עבד בכיתה ג׳.' },
    ],
  },
  {
    id: 'draft_law', tag: 'קואליציה',
    title: 'חוק הגיוס',
    text: 'בג"ץ, החרדים, והמילואימניקים — כולם רוצים תשובה על חוק הגיוס. עכשיו. באותו חדר.',
    choices: [
      { label: 'פטור מורחב', eff:{coalition:18,public:-22,budget:-6}, out:'החרדים חוגגים. המילואים בוערים.' },
      { label: 'גיוס שוויוני', eff:{coalition:-24,public:18,budget:-4}, out:'הרחוב מריע. הקואליציה מתפוררת.' },
      { label: 'מאריך את המצב', eff:{coalition:2,public:-8,budget:0}, out:'הבעיה נדחתה. שוב.' },
    ],
  },
  {
    id: 'confidence_vote', tag: 'קואליציה', type:'breaking',
    title: 'הצבעת אי־אמון',
    text: 'האופוזיציה מגישה אי־אמון. בדרך כלל פרוצדורלי — אבל שניים משלך "לא מרגישים טוב" היום.',
    choices: [
      { label: 'מבטיח תיקים וג׳ובים', eff:{coalition:16,public:-10,budget:-12}, out:'הבריאות שלהם השתפרה מיד.' },
      { label: 'נאום מלכד', eff:{coalition:6,public:4,budget:0}, out:'הנאום עבד. הפעם.' },
      { label: 'סומך על המשמעת', eff:{coalition:-16,public:2,budget:0}, out:'משמעת זו לא המילה החזקה שלהם.' },
    ],
  },
  {
    id: 'comptroller', tag: 'משפט',
    title: 'דוח מבקר המדינה',
    text: 'המבקר פרסם דוח חריף על התנהלות המשרדים. 300 עמודים, וכולם מדברים על שניים מהם.',
    choices: [
      { label: 'מאמץ את כל ההמלצות', eff:{coalition:-8,public:14,budget:-8}, out:'"אחראי", אמרו. השרים פחות.' },
      { label: '"נלמד את הדוח"', eff:{coalition:2,public:-8,budget:0}, out:'הדוח נלמד היטב. במגירה.' },
      { label: 'תוקף את המבקר', eff:{coalition:6,public:-12,budget:0}, out:'עכשיו גם המבקר יריב פוליטי.' },
    ],
  },
  {
    id: 'teachers', tag: 'רחוב',
    title: 'שביתת מורים',
    text: 'המורים שובתים, מיליון ילדים בבית, ומיליון הורים מחפשים אשם. מצאו אותך.',
    choices: [
      { label: 'מעלה שכר מורים', eff:{coalition:-6,public:18,budget:-20}, out:'הכיתות חזרו. הקופה נאנחה.' },
      { label: 'מציע "רפורמה" במקום כסף', eff:{coalition:4,public:-6,budget:-2}, out:'"רפורמה" זו מילה יוקרתית ל"אין תקציב".' },
      { label: 'מטיל אחריות על הרשויות', eff:{coalition:2,public:-10,budget:0}, out:'הרשויות החזירו לך את הכדור.' },
    ],
  },
  {
    id: 'judges', tag: 'קואליציה', type:'breaking',
    title: 'הוועדה למינוי שופטים',
    text: 'שני שופטים למינוי, והקואליציה מתפוצצת על מי. אותו רגע, אותו חדר, אפס הסכמה.',
    choices: [
      { label: 'ממנה את שלך', eff:{coalition:14,public:-16,budget:0}, out:'"פוליטיזציה!" עלה לכותרת.' },
      { label: 'פשרה מאוזנת', eff:{coalition:-10,public:12,budget:0}, out:'שני הצדדים כועסים במידה שווה.' },
      { label: 'מקפיא את המינויים', eff:{coalition:-6,public:2,budget:0}, out:'עכשיו חסרים גם שופטים.' },
    ],
  },
  {
    id: 'renovation', tag: 'משפט',
    title: 'שיפוץ הלשכה',
    text: 'התפרסם ששיפוץ לשכתך עלה כמו דירה בתל אביב. במיוחד סעיף "עיצוב פנים".',
    choices: [
      { label: 'מבטל ומחזיר כסף', eff:{coalition:-2,public:12,budget:1}, out:'צניעות. הפרשנים בהלם.' },
      { label: '"נדרש לתחזוקה"', eff:{coalition:2,public:-14,budget:-3}, out:'"תחזוקת שיש איטלקי" עלתה לטרנד.' },
      { label: 'מאשים את הקבלן', eff:{coalition:0,public:-6,budget:0}, out:'הקבלן פרסם את החוזה. אופס.' },
    ],
  },
  {
    id: 'fuel_protest', tag: 'רחוב',
    title: 'הפגנת יוקר הדלק',
    text: 'מחיר הדלק זינק, ונהגים חוסמים צמתים עם רכבים כבויים. הרדיו מדווח על פקקים בשמך.',
    choices: [
      { label: 'מוריד את הבלו על הדלק', eff:{coalition:-4,public:16,budget:-16}, out:'הצמתים נפתחו. הגירעון נסע.' },
      { label: '"תעברו לחשמלי"', eff:{coalition:2,public:-16,budget:0}, out:'"מנותק" חזר לטרנדינג.' },
      { label: 'מבטיח ועדה לאנרגיה', eff:{coalition:0,public:-6,budget:-2}, out:'הוועדה תתדלק אי־שם ב-2030.' },
    ],
  },
  {
    id: 'minister_quits', tag: 'קואליציה', type:'breaking', once:true,
    title: 'שר מתפטר בהפתעה',
    text: 'מבזק: שר בכיר הודיע על התפטרות בשידור חי, בלי לספר לך קודם. הקואליציה רועדת.',
    choices: [
      { label: 'ממנה מחליף מהר', eff:{coalition:8,public:-4,budget:-4}, out:'הכיסא התחמם תוך שעה.' },
      { label: 'מפציר בו לחזור', eff:{coalition:-6,public:-2,budget:-2}, out:'הוא "ישקול". יקר לך.' },
      { label: 'לוקח את התיק לעצמך', eff:{coalition:2,public:6,budget:0}, out:'עכשיו יש לך שני תפקידים ואפס שינה.' },
    ],
  },
  {
    id: 'inquiry', tag: 'משפט',
    title: 'דרישה לוועדת חקירה',
    text: 'האופוזיציה והרחוב דורשים ועדת חקירה ממלכתית על כשל שהתפרסם. הלחץ עולה שעה־שעה.',
    choices: [
      { label: 'מקים ועדה ממלכתית', eff:{coalition:-16,public:18,budget:-4}, out:'"אמיץ", אמרו. הקואליציה החווירה.' },
      { label: 'מציע "ועדת בדיקה" ממשלתית', eff:{coalition:8,public:-12,budget:-2}, out:'ועדה שאתה ממנה. חשוד, אמרו.' },
      { label: 'מתנגד לחלוטין', eff:{coalition:12,public:-18,budget:0}, out:'"מה יש להסתיר?" עלה לכותרת.' },
    ],
  },
  {
    id: 'rival_poll', tag: 'רחוב',
    title: 'המתחרה עוקף אותך',
    text: 'סקר חדש: יריב מהקואליציה שלך פתאום פופולרי ממך. הוא מחייך בכל תמונה. יותר מדי.',
    choices: [
      { label: 'מקרב אותו ומחבק', eff:{coalition:8,public:2,budget:-4}, out:'"אחדות". שניכם יודעים שלא.' },
      { label: 'מנטרל אותו בשקט', eff:{coalition:-8,public:-4,budget:0}, out:'הוא הבין. עכשיו הוא זהיר וכועס.' },
      { label: 'מתעלם, "אני עסוק במדינה"', eff:{coalition:-4,public:6,budget:0}, out:'התעלמות. הסקר הבא יחליט.' },
    ],
  },
  {
    id: 'austerity', tag: 'כלכלה',
    title: 'תוכנית צנע',
    text: 'האוצר מניח תוכנית קיצוצים שתמלא את הקופה — ותרוקן את הסבלנות של הציבור. יש בה 40 סעיפים, כולם כואבים.',
    choices: [
      { label: 'מאשר את מלוא הקיצוצים', eff:{coalition:2,public:-18,budget:22}, out:'הקופה התאוששה. הרחוב פחות.' },
      { label: 'קיצוץ מתון וסלקטיבי', eff:{coalition:0,public:-6,budget:10}, out:'חצי צנע, חצי כאב.' },
      { label: 'דוחה — "לא על גב הציבור"', eff:{coalition:-4,public:10,budget:-6}, out:'פופולרי. גם יקר.' },
    ],
  },
  {
    id: 'bond_sale', tag: 'כלכלה',
    title: 'הנפקת אג״ח',
    text: 'ראש בנק ישראל מציע לגייס כסף בשוק ההון עכשיו, בריבית סבירה. מחר אולי כבר לא.',
    choices: [
      { label: 'מגייס בגדול', eff:{coalition:2,public:-2,budget:20}, out:'הקופה מלאה. החוב גם.' },
      { label: 'גיוס זהיר', eff:{coalition:0,public:0,budget:10}, out:'מדוד, אחראי, משעמם. מצוין.' },
      { label: 'מוותר — "לא נתמכר לחוב"', eff:{coalition:-2,public:4,budget:-4}, out:'עקרוני. גם ריק.' },
    ],
  },
  {
    id: 'privatize', tag: 'כלכלה',
    title: 'הפרטת חברה ממשלתית',
    text: 'קרן זרה מציעה סכום נאה על נמל/חברת חשמל/מונופול ותיק. העובדים כבר מכינים אוהל מחאה.',
    choices: [
      { label: 'מוכר — הכסף מדבר', eff:{coalition:4,public:-14,budget:18}, out:'הקופה מרוצה. הוועד פחות.' },
      { label: 'מפריט חלקית', eff:{coalition:0,public:-6,budget:9}, out:'חצי מכרת, חצי מחאה.' },
      { label: '"נכס לאומי, לא למכירה"', eff:{coalition:-4,public:10,budget:-4}, out:'הצלת את הנכס. לא את התקציב.' },
    ],
  },
  {
    id: 'nonapology', tag: 'משפט', type:'breaking',
    title: 'המחדל',
    text: 'קרה כשל גדול, וכולם מסתכלים עליך. הניסוח של מה שתגיד עכשיו ילווה אותך שנים.',
    choices: [
      { label: '"אני אחראי — אבל לא אשם"', eff:{coalition:6,public:-8,budget:0}, out:'הניסוח נכנס להיסטוריה. לרעה.' },
      { label: 'לוקח אחריות מלאה', eff:{coalition:-10,public:16,budget:0}, out:'נדיר. הרחוב המום לטובה.' },
      { label: 'ממנה ועדה שתבדוק אותך', eff:{coalition:2,public:-10,budget:-2}, out:'תחקור את עצמך. בהצלחה.' },
    ],
  },
  {
    id: 'gov_chatbot', tag: 'רחוב',
    title: 'בינה מלאכותית בשירות הציבור',
    text: 'השקת צ׳אטבוט ממשלתי שיחליף פקידים. תוך יומיים הוא ענה לאזרחים בציניות מטרידה.',
    choices: [
      { label: 'סוגר את הצ׳אטבוט', eff:{coalition:0,public:8,budget:-6}, out:'הצ׳אטבוט התפטר קודם. גם לו יש כבוד.' },
      { label: '"תקלה זמנית, נתקן"', eff:{coalition:2,public:-6,budget:-2}, out:'הצ׳אטבוט ענה: "בטח."' },
      { label: 'מרחיב אותו למשרדים נוספים', eff:{coalition:4,public:-12,budget:8}, out:'עכשיו כל המדינה עונה בציניות.' },
    ],
  },
];
