/* Nour — Chat tab: "Mama" companion.
   A warm, schedule-aware helper that talks Nour through choosing a safe meal
   and stays with her until the order is placed and the food has arrived.

   Works fully offline from data.js (restaurants, hours, rules, schedule).
   If a Claude API key is saved in Settings, free-typed messages get natural
   replies from Claude — with the same allergy rules and the same restaurant
   list — and the scripted flow remains the fallback. Loaded after app.js and
   reuses its helpers (analyze, restaurantCard, openStatus, menuCategoriesFor…). */

const CHAT_STORE = "nour.chat";
const APIKEY_STORE = "nour.apikey";
const DELIVERY_LEAD = 35;              // minutes from tapping "order" to the door at EVGR A
const NUDGE_AFTER_MS = 7 * 60 * 1000;  // gentle check-in if she goes quiet while deciding

// ---- Schedule helpers -------------------------------------------------------
function classesFor(dayIdx) { // dayIdx: 0 = Sunday (Date#getDay)
  const S = (typeof SCHEDULE !== "undefined") ? SCHEDULE.classes : {};
  return (S[DAY_KEYS[dayIdx]] || []).slice().sort((a, b) => toMin(a.start) - toMin(b.start));
}
function fmtM(M) { M = ((M % 1440) + 1440) % 1440; return fmtTime(`${Math.floor(M / 60)}:${String(M % 60).padStart(2, "0")}`); }
function minsLabel(n) { if (n < 60) return `${n} min`; const h = Math.floor(n / 60), m = n % 60; return m ? `${h}h ${m}m` : `${h}h`; }
function scheduleNow(now) {
  now = now || new Date();
  const M = now.getHours() * 60 + now.getMinutes();
  const cls = classesFor(now.getDay());
  const current = cls.find(c => M >= toMin(c.start) && M < toMin(c.end)) || null;
  const next = cls.find(c => toMin(c.start) > M) || null;
  const last = cls.length ? cls[cls.length - 1] : null;
  return { M, cls, current, next, last };
}
function mealForTime(M) {
  if (M < 10 * 60 + 45) return "breakfast";
  if (M < 15 * 60 + 30) return "lightLunch";
  return "dinner";
}
const MEAL_WORD = { breakfast: "breakfast", lightLunch: "lunch", dinner: "dinner" };

// Earliest start in [from, to] of a class-free window `need` minutes long.
function freeWindow(cls, from, to, need) {
  let t = from;
  while (t + need <= to) {
    const hit = cls.find(c => toMin(c.start) < t + need && toMin(c.end) > t);
    if (!hit) return t;
    t = toMin(hit.end) + 5;
  }
  return null;
}

// The day's eating tasks, timed around classes (dayIdx: 0 = Sunday).
function eatingPlan(dayIdx) {
  const cls = classesFor(dayIdx);
  const home = (typeof HOME !== "undefined") ? HOME.name : "home";
  const tasks = [];
  const where = c => c.where || "class";

  if (!cls.length) {
    tasks.push({ kind: "breakfast", emoji: "🍳", at: 9 * 60 + 30, title: "Slow breakfast", tip: `No classes — eggs and fruit at ${home}, or order an açaí bowl for around ${fmtM(10 * 60)}.` });
    tasks.push({ kind: "lightLunch", emoji: "🥗", at: 12 * 60 + 30, title: "Lunch", tip: "A real lunch, not a snack: a bowl, tacos on corn tortillas, or a shawarma plate over rice." });
    if (dayIdx === 6) tasks.push({ kind: "grocery", emoji: "🛒", at: 11 * 60, title: "Grocery order for the week", tip: "Instacart / Whole Foods / Amazon Fresh by 11 so it lands before dinner — eggs, rice, GF bread, fruit, snacks for lab days." });
    if (dayIdx === 0) tasks.push({ kind: "cook", emoji: "🍳", at: 16 * 60, title: "Cook a batch for Tue & Thu", tip: "Lab days leave no lunch window — cook rice + chicken or lentils now and box two portions." });
    tasks.push({ kind: "dinner", emoji: "🍽️", at: 18 * 60 + 30, title: "Dinner", tip: `Order around ${fmtM(18 * 60)} so it arrives at ${home} by 6:30, or cook.` });
    return tasks.sort((a, b) => a.at - b.at);
  }

  // Breakfast: before the first class, at home.
  const first = cls[0];
  const bAt = Math.max(8 * 60, Math.min(toMin(first.start) - 60, 10 * 60));
  tasks.push({ kind: "breakfast", emoji: "🍳", at: bAt, title: `Breakfast at ${home}`,
    tip: `${first.name} starts at ${fmtTime(first.start)} — eat before you leave. Eggs, GF toast and fruit, or order an açaí bowl at ${fmtM(bAt - DELIVERY_LEAD)} to land by ${fmtM(bAt)}.` });

  // Lunch: a 40-minute class-free window from noon; otherwise an early lunch before class.
  let L = freeWindow(cls, 12 * 60, 15 * 60 + 30, 40);
  const early = freeWindow(cls, 11 * 60 + 15, 12 * 60 + 30, 40);
  let lunchTitle = "Lunch", lunchTip;
  if (L == null || (L > 14 * 60 && early != null)) { L = early; lunchTitle = "Early lunch"; }
  if (L != null) {
    const prev = cls.filter(c => toMin(c.end) <= L && L - toMin(c.end) <= 20).pop();
    const nextC = cls.find(c => toMin(c.start) >= L);
    if (prev) lunchTip = `${prev.name} ends at ${fmtTime(prev.end)} — order at ${fmtM(L - DELIVERY_LEAD)} from ${where(prev)} so it reaches ${home} about ${fmtM(L + 5)}, right as you get in.`;
    else if (nextC) lunchTip = `Eat at ${home} before ${nextC.name} at ${fmtTime(nextC.start)} — order by ${fmtM(L - DELIVERY_LEAD)} or heat what you cooked.`;
    else lunchTip = `Free afternoon — order at ${fmtM(L - DELIVERY_LEAD)} or cook.`;
    if (L > 13 * 60 + 30) lunchTitle = "Late lunch";
    tasks.push({ kind: "lightLunch", emoji: "🥗", at: L, title: lunchTitle, tip: lunchTip });
  }

  // Snack: any run of classes with < 30-min gaps lasting 3h+.
  let runStart = null, runEnd = null;
  const flush = () => { if (runStart != null && runEnd - runStart >= 180) tasks.push({ kind: "snack", emoji: "🍌", at: runStart - 15, title: "Pack a snack", tip: `${fmtM(runStart)}–${fmtM(runEnd)} is back-to-back — banana, a GF bar, nuts or hummus with carrots in your bag.` }); };
  for (const c of cls) {
    if (runStart == null) { runStart = toMin(c.start); runEnd = toMin(c.end); continue; }
    if (toMin(c.start) - runEnd < 30) runEnd = toMin(c.end); else { flush(); runStart = toMin(c.start); runEnd = toMin(c.end); }
  }
  flush();

  // Afternoon bite when lunch was early and dinner is late.
  const last = cls[cls.length - 1];
  const lastEnd = toMin(last.end);
  const D = lastEnd >= 17 * 60 ? lastEnd + 15 : 18 * 60 + 30;
  if (L != null && D - L > 6 * 60) {
    const A = freeWindow(cls, 15 * 60 + 30, 17 * 60 + 30, 30);
    if (A != null) tasks.push({ kind: "snack", emoji: "🥤", at: A, title: "Afternoon bite", tip: `A gap before ${last.name} — a smoothie or a small bowl near campus, or leftovers at ${home}.` });
  }

  // Dinner: right after the last class, ordered during it.
  const dinnerTip = lastEnd >= 17 * 60
    ? `${last.name} ends at ${fmtTime(last.end)} — order at ${fmtM(D - DELIVERY_LEAD + 5)} from ${where(last)} so it reaches ${home} around ${fmtM(D + 5)}.`
    : `Classes end at ${fmtTime(last.end)} — order around ${fmtM(D - DELIVERY_LEAD)} or cook; eat by ${fmtM(D)}.`;
  tasks.push({ kind: "dinner", emoji: "🍽️", at: D, title: "Dinner", tip: dinnerTip });
  return tasks.sort((a, b) => a.at - b.at);
}

function eatingPlanHtml(dayIdx, isToday) {
  const tasks = eatingPlan(dayIdx);
  const M = new Date().getHours() * 60 + new Date().getMinutes();
  return `<div class="timing">
    <div class="timing-title">⏰ ${isToday ? "Today's" : WEEKDAY_SHORT[dayIdx] + "'s"} timing around your classes</div>
    ${tasks.map(t => `<div class="timing-row${isToday && t.at < M - 90 ? " past" : ""}">
      <span class="timing-at">${t.emoji} ${fmtM(t.at)}</span>
      <span class="timing-body"><b>${escapeHtml(t.title)}</b> — ${escapeHtml(t.tip)}</span>
    </div>`).join("")}
  </div>`;
}

// ---- Restaurant candidates ---------------------------------------------------
function allSpots() {
  return menuCategoriesFor("all").flatMap(c => c.restaurants.map(r => Object.assign({}, r, { category: c.category })));
}
function spotKey(r) { return (r.name + "|" + r.area).toLowerCase(); }
function findSpot(name, area) {
  const n = (name || "").toLowerCase().trim(), a = (area || "").toLowerCase().trim();
  const all = allSpots();
  return all.find(r => r.name.toLowerCase() === n && (!a || (r.area || "").toLowerCase() === a)) ||
         all.find(r => r.name.toLowerCase() === n) ||
         all.find(r => n && r.name.toLowerCase().includes(n)) || null;
}
function spotScore(r) {
  const st = openStatus(r).state;
  let s = (r.rating == null ? 3.9 : r.rating);
  s += st === "open" ? 3 : st === "unknown" ? 1 : -6;
  if (isFav(favId("order", r.name, r.area))) s += 2;
  if (r.unverified) s -= 0.4;
  return s;
}
function candidates(meal, cats) {
  let list = allSpots();
  if (meal && meal !== "all") list = list.filter(r => (r.meals || []).includes(meal));
  if (cats) list = list.filter(r => cats.test(r.category));
  return list.sort((a, b) => spotScore(b) - spotScore(a));
}

const ME_CATS = /Middle Eastern|Lebanese|Arabic|Turkish|Persian|Halal/i;
const CUISINES = [
  { re: /middle ?east|arab|leban|jordan|syri|palest|egypt|iraq|shawarma|falafel|hummus|kebab|kabob|kabab|mezz?e|manakish|mediterr|mansaf|maqluba|fattoush|tabbouleh/i, cats: /Middle Eastern|Lebanese|Arabic|Mediterranean/i, label: "Middle Eastern", chip: "🕌 Middle Eastern" },
  { re: /turk|iskender|pide/i, cats: /Turkish/i, label: "Turkish" },
  { re: /persian|iran|afghan|kabul|koobideh|joojeh/i, cats: /Persian/i, label: "Persian & Afghan" },
  { re: /pakistan|halal/i, cats: /Halal|Persian|Lebanese|Arabic|Middle Eastern|Turkish/i, label: "halal" },
  { re: /mexic|taco|burrito|taqueria|latin|salvador|pupusa|peru|colombia|caribbean|jerk|ceviche/i, cats: /Mexican|Latin|Peruvian/i, label: "Mexican & Latin", chip: "🌮 Mexican & Latin" },
  { re: /\bthai|pad thai|tom kha|tom yum/i, cats: /Thai/i, label: "Thai", chip: "🍜 Thai" },
  { re: /indian|nepal|\bdal\b|daal|biryani|tikka|masala|dosa|himalay/i, cats: /Indian|Nepalese/i, label: "Indian & Nepalese", chip: "🍛 Indian" },
  { re: /sushi|japan|poke|sashimi|ramen|teriyaki/i, cats: /Sushi|Japanese|Poke|Seafood & poke/i, label: "Japanese & poke", chip: "🍣 Sushi & poke" },
  { re: /\bpho\b|vietnam|banh|bun\b/i, cats: /Vietnamese/i, label: "Vietnamese", chip: "🍲 Pho" },
  { re: /chinese|dim sum|stir.?fry|szechuan|sichuan/i, cats: /Chinese/i, label: "Chinese" },
  { re: /korea|bibimbap|tofu soup|soondubu|kimchi/i, cats: /Korean/i, label: "Korean" },
  { re: /burm|tea leaf/i, cats: /Burmese/i, label: "Burmese" },
  { re: /filipin|pinoy|silog|adobo/i, cats: /Filipino/i, label: "Filipino" },
  { re: /hawaii|mahi|l&l/i, cats: /Hawaiian/i, label: "Hawaiian" },
  { re: /pizza|italian|pasta/i, cats: /Pizza/i, label: "gluten-free pizza", chip: "🍕 GF pizza" },
  { re: /smoothie|a[çc]a[ií]|juice|fruit bowl/i, cats: /Smoothies|Açaí/i, label: "smoothies & açaí" },
  { re: /\begg|breakfast|brunch|pancake|omelet|bagel/i, cats: /breakfast|Cafés|Bagels|Açaí/i, label: "breakfast", meal: "breakfast" },
  { re: /salad|bowl|healthy|light|fresh|greens|clean/i, cats: /Salads|Poke|Smoothies|Açaí|Mediterranean/i, label: "something light", chip: "🥗 Light" },
  { re: /sandwich|wrap|burger|american|rotisserie|chicken/i, cats: /American|Sandwiches|Salads|Halal|Middle Eastern/i, label: "American & sandwiches" },
  { re: /seafood|fish|shrimp|salmon|tuna/i, cats: /Seafood|Sushi|Japanese|Hawaiian|Poke/i, label: "seafood" },
  { re: /soup|warm|comfort|cozy|cold|sick|rain|hot food/i, cats: /Vietnamese|Thai|Korean|Indian|Burmese|Persian|Turkish|Middle Eastern/i, label: "something warm", chip: "🍲 Something warm" },
  { re: /cheap|budget|broke|inexpensive|affordable/i, cats: /Mexican|Vietnamese|Salads|Latin|Hawaiian|Halal|Thai/i, label: "easy on the wallet" },
];

// ---- Chat state --------------------------------------------------------------
const chat = { day: null, msgs: [], stage: "idle", meal: "auto", cats: null, catLabel: null, shown: [], chosen: null, nudged: false, nudgeTimer: null, busy: false };

function todayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function chatSave() {
  try {
    localStorage.setItem(CHAT_STORE, JSON.stringify({ day: chat.day, msgs: chat.msgs.slice(-40), stage: chat.stage, meal: chat.meal, catLabel: chat.catLabel, shown: chat.shown, chosen: chat.chosen, nudged: chat.nudged }));
  } catch {}
}
function chatLoad() {
  try {
    const s = JSON.parse(localStorage.getItem(CHAT_STORE) || "null");
    if (!s || s.day !== todayKey()) return false;
    Object.assign(chat, { day: s.day, msgs: s.msgs || [], stage: s.stage || "idle", meal: s.meal || "auto", catLabel: s.catLabel || null, shown: s.shown || [], chosen: s.chosen || null, nudged: !!s.nudged });
    if (chat.catLabel) { const c = CUISINES.find(x => x.label === chat.catLabel); chat.cats = c ? c.cats : null; }
    return true;
  } catch { return false; }
}
function getApiKey() { try { return (localStorage.getItem(APIKEY_STORE) || "").trim(); } catch { return ""; } }
function setApiKey(k) { try { if (k) localStorage.setItem(APIKEY_STORE, k.trim()); else localStorage.removeItem(APIKEY_STORE); } catch {} updateChatStatus(); }

// ---- Rendering ---------------------------------------------------------------
function chip(label, act, arg) { return { label, act, arg: arg || null }; }
function stripHtml(h) { const d = document.createElement("div"); d.innerHTML = h; return (d.textContent || "").replace(/\s+/g, " ").trim(); }
function say(html, chips, opts) {
  chat.msgs.push({ who: "bot", html, text: (opts && opts.text) || stripHtml(html).slice(0, 600), chips: chips || null });
  chatSave(); chatRender();
}
function said(text) {
  chat.msgs.push({ who: "me", html: escapeHtml(text), text });
  chatSave(); chatRender();
}
function chatRender() {
  const log = document.getElementById("chatLog"), chipsEl = document.getElementById("chatChips");
  if (!log) return;
  log.innerHTML = chat.msgs.map(m => `<div class="msg ${m.who}">${m.who === "bot" ? `<div class="avatar" aria-hidden="true">💛</div>` : ""}<div class="bubble">${m.html}</div></div>`).join("") +
    (chat.busy ? `<div class="msg bot"><div class="avatar" aria-hidden="true">💛</div><div class="bubble typing"><span></span><span></span><span></span></div></div>` : "");
  const lastBot = [...chat.msgs].reverse().find(m => m.who === "bot");
  const chips = (lastBot && lastBot.chips) || [];
  chipsEl.innerHTML = chips.map((c, i) => `<button class="chip" data-i="${i}">${escapeHtml(c.label)}</button>`).join("");
  chipsEl.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => { const c = chips[+b.dataset.i]; said(c.label); handleAction(c.act, c.arg); }));
  requestAnimationFrame(() => { const end = document.getElementById("chatEnd"); if (end) end.scrollIntoView({ block: "end", behavior: "smooth" }); });
}
function updateChatStatus() {
  const el = document.getElementById("chatStatus");
  if (el) el.textContent = getApiKey() ? "✨ smart replies on · here till you order" : "here till you order · offline-ready";
}

// ---- Copy (Mama's voice) ------------------------------------------------------
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const HOME_NAME = (typeof HOME !== "undefined") ? HOME.name : "home";

function greetingHtml() {
  const { M, current, next, last } = scheduleNow();
  const meal = mealForTime(M);
  const hour = new Date().getHours();
  const hi = hour < 12 ? "Sabah el kheir, habibti ☀️" : hour < 18 ? "Hi habibti 💛" : "Masa el kheir, habibti 🌙";
  let line;
  if (current) line = `You're in <b>${escapeHtml(current.name)}</b> till ${fmtTime(current.end)}. Want me to line up ${MEAL_WORD[meal]} so it reaches ${HOME_NAME} right after?`;
  else if (next && toMin(next.start) - M <= 75) line = `<b>${escapeHtml(next.name)}</b> starts at ${fmtTime(next.start)} — ${minsLabel(toMin(next.start) - M)} from now. Something quick before, or shall I set up ${MEAL_WORD[meal]} for after?`;
  else if (last && M >= toMin(last.end) && M - toMin(last.end) < 90) line = `You're done for the day — ${escapeHtml(last.name)} is over. Have you eaten? Tell me what you're in the mood for and I'll find it.`;
  else line = `It's ${fmtM(M)} — ${MEAL_WORD[meal]} time. Did you eat? Tell me what you're in the mood for and I'll find something safe.`;
  return `${hi} ${line}`;
}
function startChips() {
  return [chip("🍽️ What should I eat?", "start"), chip("📅 Plan my day", "plan"), chip("🕌 Middle Eastern", "cuisine", "Middle Eastern"), chip("🎲 Pick for me", "pickforme"), chip("❓ Is this safe?", "askcheck")];
}
function cuisineChips() {
  return [chip("🕌 Middle Eastern", "cuisine", "Middle Eastern"), chip("🌮 Mexican & Latin", "cuisine", "Mexican & Latin"), chip("🍜 Thai", "cuisine", "Thai"), chip("🍣 Sushi & poke", "cuisine", "Japanese & poke"),
          chip("🥗 Light", "cuisine", "something light"), chip("🍛 Indian", "cuisine", "Indian & Nepalese"), chip("🍲 Something warm", "cuisine", "something warm"), chip("🎲 Surprise me", "pickforme")];
}
function optionsChips() { return [chip("👉 More options", "more"), chip("🔁 Different cuisine", "askcuisine"), chip("🎲 Pick for me", "pickforme"), chip("✅ I ordered", "ordered")]; }
function orderingChips() { return [chip("✅ I ordered", "ordered"), chip("🔁 Something else", "more"), chip("❓ Ask about a dish", "askcheck")]; }
function orderedChips() { return [chip("📦 It arrived", "arrived"), chip("😕 Something's wrong", "wrong"), chip("🏠 Start over", "reset")]; }

function mealFromState() { return chat.meal === "auto" ? mealForTime(scheduleNow().M) : chat.meal; }

function showOptions(intro) {
  const meal = mealFromState();
  let list = candidates(meal, chat.cats).filter(r => !chat.shown.includes(spotKey(r)));
  if (!list.length && chat.cats) list = candidates("all", chat.cats).filter(r => !chat.shown.includes(spotKey(r)));
  if (!list.length) { chat.shown = []; list = candidates(meal, chat.cats); }
  const three = list.slice(0, 3);
  if (!three.length) { say(`I couldn't find that one, habibti. Tell me another cuisine, or I'll pick for you.`, cuisineChips()); return; }
  three.forEach(r => chat.shown.push(spotKey(r)));
  const closedNote = three.every(r => openStatus(r).state === "closed") ? ` They look closed right now — I've noted when each opens; or tell me another cuisine.` : "";
  const lead = intro || pick([
    `Here are three I'd order for you right now${chat.catLabel ? ` — ${escapeHtml(chat.catLabel)}` : ""}. Follow the note on each dish, that's the whole trick:`,
    `Okay habibti, ${chat.catLabel ? escapeHtml(chat.catLabel) + " it is. " : ""}These three are safe when you order them exactly as written:`,
  ]);
  const cards = three.map(r => `${restaurantCard(r)}<button class="chat-pick" data-pick="${escapeHtml(spotKey(r))}">This one 👍</button>`).join("");
  chat.stage = "options";
  say(`${lead}${closedNote}<div class="chat-cards">${cards}</div>Tap <b>This one</b> and I'll write out exactly what to order.`, optionsChips(), { text: `${stripHtml(lead)} ${three.map(r => r.name + " (" + r.area + ")").join(", ")}.` });
  armNudge();
}

function chooseSpot(key) {
  const r = allSpots().find(x => spotKey(x) === key) || findSpot(key.split("|")[0], key.split("|")[1]);
  if (!r) return;
  chat.chosen = spotKey(r); chat.stage = "ordering";
  const dishes = (r.safeDishes || []).slice(0, 4).map(d => `<li><b>${escapeHtml(d.dish)}</b>${d.note ? ` — <span class="instr">${escapeHtml(d.note)}</span>` : ""}</li>`).join("");
  const st = openStatus(r);
  const openLine = st.state === "closed" ? `<p class="chat-warn">⚫ ${escapeHtml(st.label)} — schedule it in the app, or pick another and I'll wait.</p>` : "";
  const html = `Good choice 💛 Here's exactly what to order from <b>${escapeHtml(r.name)}</b>:
    <ul class="chat-order">${dishes}</ul>
    ${r.watchOut ? `<p class="chat-skip"><b>Skip:</b> ${escapeHtml(r.watchOut)}</p>` : ""}
    <p>In the order notes write: <i>"Allergy: no red meat, no dairy, no wheat — please no cross-contact."</i> Deliver to <b>${escapeHtml(HOME_NAME)}</b>.</p>
    ${openLine}${platformButtons(r)}
    <p class="muted small">Tap ✅ once it's placed — I'm not going anywhere.</p>`;
  say(html, orderingChips(), { text: `Order from ${r.name}: ${(r.safeDishes || []).slice(0, 4).map(d => d.dish + (d.note ? " (" + d.note + ")" : "")).join("; ")}.` });
  armNudge();
}

function orderedReply() {
  clearNudge();
  const r = chat.chosen ? allSpots().find(x => spotKey(x) === chat.chosen) : null;
  chat.stage = "ordered";
  const checks = r ? (r.safeDishes || []).map(d => d.note).filter(n => n && /\b(no |ask|without|corn|tamari|skip|instead|not )/i.test(n)).slice(0, 4) : [];
  const checkHtml = checks.length ? `When it arrives, open the box before you eat: <ul class="chat-order">${checks.map(c => `<li>${escapeHtml(c)}</li>`).join("")}</ul>` : `When it arrives, open the box and check nothing extra slipped in — no bread, no cheese, no sauce you didn't ask for.`;
  const eta = fmtM(scheduleNow().M + DELIVERY_LEAD);
  say(`Yalla, sahtein habibti 💛 ${r ? `<b>${escapeHtml(r.name)}</b> should` : "It should"} reach ${HOME_NAME} around <b>${eta}</b>. ${checkHtml} If anything looks wrong, don't eat it — tell me and we'll fix it.`, orderedChips());
}

function arrivedReply() {
  chat.stage = "done";
  const { M, next } = scheduleNow();
  const gap = next ? toMin(next.start) - M : null;
  const nextLine = !next ? ` Nothing else on the calendar — take your time.`
    : gap <= 30 ? ` ${escapeHtml(next.name)} starts in ${minsLabel(Math.max(gap, 1))} — take it with you and eat the moment you sit down.`
    : ` ${escapeHtml(next.name)} is at ${fmtTime(next.start)} — eat slowly, you have time.`;
  say(`Wonderful 🥰 Eat well, habibti.${nextLine} I'll be right here for the next meal — just open this tab.`, [chip("💛 Thanks Mama", "thanks"), chip("📅 Plan my day", "plan"), chip("🏠 Start over", "reset")]);
}

function wrongReply() {
  chat.stage = "ordering";
  say(`Don't eat it. Message the driver or the app's support right away — "wrong item / allergy order". Most refund on the spot. Tell me what came and I'll check it, or I'll find you something else now.`, [chip("❓ Check what came", "askcheck"), chip("🔁 Something else", "more"), chip("✅ Sorted, I ordered again", "ordered")]);
}

function planReply() {
  const now = new Date();
  say(`Here's how I'd eat today around your classes:${eatingPlanHtml(now.getDay(), true)}Want me to line up the next one?`,
    [chip("🍽️ Yes, what should I eat?", "start"), chip("🕌 Middle Eastern", "cuisine", "Middle Eastern"), chip("🎲 Pick for me", "pickforme")]);
}

function checkReply(text) {
  const findings = analyze(text);
  const level = verdictLevel(findings);
  const order = { avoid: 0, caution: 1, safe: 2 };
  const rows = [...findings].sort((a, b) => order[a.severity] - order[b.severity]).map(f =>
    `<div class="finding ${f.severity}"><span class="dot"></span><div><div class="term">${escapeHtml(f.term)} <span class="cat">· ${escapeHtml(f.category)}</span></div><div class="reason">${escapeHtml(f.reason)}</div></div></div>`).join("");
  const lead = {
    avoid: `⛔ No, habibti — not this one. It has ${findings.filter(f => f.severity === "avoid").map(f => f.term).slice(0, 3).join(", ")}.`,
    caution: `⚠️ Hmm — maybe, but ask first. Say "allergy" and check these:`,
    safe: `✅ That looks fine to me. Still say it's an allergy when you order.`,
    unknown: `🤔 I can't tell from that. Paste the description or the ingredient list and I'll read it properly.`,
  }[level];
  const chips = level === "avoid" ? [chip("🔁 Find me a safe version", "more"), chip("🎲 Pick for me", "pickforme")] : chat.stage === "ordering" ? orderingChips() : [chip("🍽️ Find me something", "start"), chip("❓ Check another", "askcheck")];
  say(`${lead}${rows ? `<div class="chat-verdict ${level}">${rows}</div>` : ""}`, chips);
}

function factsReply() {
  say(`The short version, habibti:<ul class="chat-order">${FACTS.slice(0, 6).map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul>`, startChips());
}

function armNudge() {
  clearNudge();
  if (chat.nudged) return;
  chat.nudgeTimer = setTimeout(() => {
    if (!["options", "ordering"].includes(chat.stage)) return;
    chat.nudged = true;
    say(`Still deciding, habibti? No pressure — want me to just pick one and you tap order? 🎲`, [chip("🎲 Yes, pick for me", "pickforme"), chip("👉 Show more", "more"), chip("✅ I ordered", "ordered")]);
  }, NUDGE_AFTER_MS);
}
function clearNudge() { if (chat.nudgeTimer) { clearTimeout(chat.nudgeTimer); chat.nudgeTimer = null; } }

// ---- Actions (chips and detected intents) ---------------------------------------
function handleAction(act, arg) {
  switch (act) {
    case "start": {
      const meal = mealFromState();
      chat.stage = "cuisine";
      say(`${MEAL_WORD[meal][0].toUpperCase() + MEAL_WORD[meal].slice(1)} it is. What are you in the mood for? Pick one, or just tell me.`, cuisineChips());
      break;
    }
    case "askcuisine": chat.cats = null; chat.catLabel = null; chat.shown = []; chat.stage = "cuisine"; say(`Sure — what kind of food?`, cuisineChips()); break;
    case "cuisine": {
      const c = CUISINES.find(x => x.label === arg);
      chat.cats = c ? c.cats : null; chat.catLabel = c ? c.label : null; chat.shown = [];
      if (c && c.meal) chat.meal = c.meal;
      showOptions();
      break;
    }
    case "more": showOptions(pick([`A few more, then:`, `Okay, next three:`, `Let's keep looking:`])); break;
    case "pickforme": {
      const meal = mealFromState();
      const open = candidates(meal, chat.cats).filter(r => openStatus(r).state !== "closed");
      const r = open.find(x => !chat.shown.includes(spotKey(x))) || open[0] || candidates(meal, chat.cats)[0];
      if (!r) { say(`Tell me a cuisine first, habibti.`, cuisineChips()); break; }
      chat.shown.push(spotKey(r));
      say(`Then I'm choosing for you: <b>${escapeHtml(r.name)}</b>${r.area ? ` in ${escapeHtml(r.area)}` : ""}${r.rating ? ` — ${r.rating.toFixed(1)}★` : ""} and ${openStatus(r).state === "open" ? "open now" : "usually open now"}. Trust me on this one 💛`);
      chooseSpot(spotKey(r));
      break;
    }
    case "pickspot": chooseSpot(arg); break;
    case "ordered": orderedReply(); break;
    case "arrived": arrivedReply(); break;
    case "wrong": wrongReply(); break;
    case "plan": planReply(); break;
    case "facts": factsReply(); break;
    case "askcheck": chat.stage = chat.stage === "ordering" ? "ordering" : "check"; say(`Type the dish or paste its description / ingredients and I'll read it for red meat, dairy and wheat.`, [chip("🍽️ Find me something instead", "start")]); break;
    case "thanks": say(pick([`Always, habibti 💛 Drink some water too.`, `That's what I'm here for. Sahtein 💛`]), startChips()); break;
    case "reset": chat.stage = "idle"; chat.meal = "auto"; chat.cats = null; chat.catLabel = null; chat.shown = []; chat.chosen = null; chat.nudged = false; clearNudge(); say(greetingHtml(), startChips()); break;
    default: say(greetingHtml(), startChips());
  }
}

// ---- Free text ------------------------------------------------------------------
function localIntent(text) {
  const t = text.toLowerCase().trim();
  const has = re => re.test(t);
  if (has(/\b(ordered|placed|checked out|it's in|its in|done ordering|i did it|order(ed)? it)\b/)) return { act: "ordered" };
  if (has(/\b(arrived|it's here|its here|got it|delivered|came)\b/) && chat.stage === "ordered") return { act: "arrived" };
  if (has(/\b(wrong|missing|has cheese|has bread|has pita|mistake|messed up)\b/) && ["ordered", "done"].includes(chat.stage)) return { act: "wrong" };
  if (has(/\b(not hungry|skip|later|don'?t want|no thanks|nah)\b/)) return { reply: `Habibti, skipping ${MEAL_WORD[mealFromState()]} means a headache in two hours — I know you. Even something small: a smoothie, eggs, hummus and carrots. Shall I pick something light?`, chips: [chip("🥗 Okay, something light", "cuisine", "something light"), chip("🎲 Pick for me", "pickforme"), chip("📅 Plan my day", "plan")] };
  if (has(/\b(pick for me|you choose|you pick|surprise|whatever|anything|i don'?t care|don'?t know)\b/)) return { act: "pickforme" };
  if (has(/\b(more|other|others|else|different|another|next)\b/) && ["options", "ordering", "cuisine"].includes(chat.stage)) return { act: has(/cuisine|kind|type/) ? "askcuisine" : "more" };
  if (has(/\b(plan|schedule|today|my day|classes?|when should i eat)\b/)) return { act: "plan" };
  if (has(/\b(facts?|rules?|what can'?t i eat|allerg(y|ies) list)\b/)) return { act: "facts" };
  if (has(/\b(thanks|thank you|shukran|love you|bye|good night|goodnight)\b/)) return { act: "thanks" };
  if (has(/\b(cook|make something|recipe|pantry|groceries|grocery)\b/)) return { reply: `Cooking tonight? Good girl. Quick and safe at ${HOME_NAME}: rice + a can of salmon + lemon and olive oil; eggs with corn tortillas and avocado; or lentils with cumin and rice. The 🛒 Grocery tab has the exact products and a weekly list.`, chips: [chip("🛒 Open Grocery", "gotogrocery"), chip("🍽️ Actually, order something", "start")] };
  // A specific restaurant by name
  const spot = allSpots().find(r => r.name.length >= 4 && t.includes(r.name.toLowerCase()));
  if (spot) return { spot };
  // Meal words
  const meal = has(/\bbreakfast|brunch\b/) ? "breakfast" : has(/\blunch\b/) ? "lightLunch" : has(/\bdinner|supper|tonight\b/) ? "dinner" : null;
  // Cuisine words
  const cs = CUISINES.filter(c => c.re.test(t));
  // Safety question or a dish description
  const findings = analyze(text);
  const asking = has(/\b(safe|can i (eat|have|order|get)|is it ok|is this ok|what about|allowed|does it have|contain)\b/) || findings.some(f => f.severity !== "safe");
  if (asking && !(cs.length && !findings.length && t.split(/\s+/).length <= 3)) return { check: true };
  if (cs.length) return { cuisine: cs[0], meal };
  if (meal) return { meal };
  if (has(/\b(hungry|eat|food|order|starving|what should i|feed me|hi|hello|hey|salam|marhaba)\b/)) return { act: "start" };
  return null;
}

async function handleText(text) {
  const it = localIntent(text);
  if (it && it.act) { if (it.act === "gotogrocery") { switchTab("grocery"); return; } handleAction(it.act, it.arg); return; }
  if (it && it.reply) { say(it.reply, it.chips); return; }
  if (it && it.spot) { say(`<b>${escapeHtml(it.spot.name)}</b> — yes, I know it. Here's what's safe there:`); chat.shown.push(spotKey(it.spot)); chooseSpot(spotKey(it.spot)); return; }
  if (it && it.check) { checkReply(text); return; }
  if (it && it.cuisine) { if (it.meal) chat.meal = it.meal; handleAction("cuisine", it.cuisine.label); return; }
  if (it && it.meal) { chat.meal = it.meal; chat.stage = "cuisine"; say(`${MEAL_WORD[it.meal][0].toUpperCase() + MEAL_WORD[it.meal].slice(1)} — good. What kind?`, cuisineChips()); return; }

  // Unmatched: Claude if a key is saved, otherwise a gentle clarifier.
  if (getApiKey()) {
    const ok = await claudeReply(text);
    if (ok) return;
  }
  const findings = analyze(text);
  if (findings.length) { checkReply(text); return; }
  say(pick([`Tell me more, habibti — a cuisine, a dish, or just "I'm hungry" and I'll take it from there.`, `I didn't quite catch that. Are we ordering, or checking a dish?`]),
    [chip("🍽️ Let's order", "start"), chip("❓ Check a dish", "askcheck"), chip("📅 Plan my day", "plan")]);
}

// ---- Optional Claude replies ------------------------------------------------------
function systemPrompt() {
  const now = new Date();
  const { M, cls, current, next } = scheduleNow(now);
  const meal = mealFromState();
  const spots = candidates(meal, chat.cats).slice(0, 40).map(r => {
    const st = openStatus(r);
    return `- ${r.name} | ${r.area} | ${r.category} | ${r.rating != null ? r.rating.toFixed(1) + "★" : "unrated"} | ${st.state === "open" ? "open now" : st.state === "closed" ? st.label : "hours unknown"} | dishes: ${(r.safeDishes || []).map(d => d.dish + (d.note ? " (" + d.note + ")" : "")).join("; ")}${r.watchOut ? " | skip: " + r.watchOut : ""}`;
  }).join("\n");
  const sched = cls.length ? cls.map(c => `${c.name} ${fmtTime(c.start)}–${fmtTime(c.end)}${c.where ? " @ " + c.where : ""}`).join("; ") : "no classes";
  const plan = eatingPlan(now.getDay()).map(t => `${fmtM(t.at)} ${t.title}: ${t.tip}`).join("\n");
  return `You are "Mama": the warm, loving, slightly bossy mother of Nour, a Stanford student, talking to her in a food app. Nour is ALLERGIC to red meat (beef, pork, lamb, goat, veal, venison, bison, and their broth, lard, tallow, gelatin, collagen), all milk products (milk, butter, ghee, cheese, cream, yogurt, whey, casein, labneh) and wheat (flour, bread, pita, wraps, wheat noodles, batter, soy sauce, teriyaki, couscous, bulgur, seitan; "gluten-free" labels count as wheat-free). Never suggest anything containing them; when unsure say "check first" and tell her what to ask.
Your job: help her decide what to eat NOW, quickly, and stay with her until the order is placed. Recommend ONLY restaurants from the list below (max 3 per reply), always with the exact modification from the dish note. To show a restaurant card, write the token [[card: NAME | AREA]] on its own line (exact name and area from the list). Ask her to tap "✅ I ordered" once it's placed. Keep replies under 90 words, in a caring mother's voice with occasional Arabic endearments (habibti, yalla, sahtein) — no lectures, no medical advice, no markdown headers.
She lives at ${HOME_NAME} (${(typeof HOME !== "undefined") ? HOME.full : ""}); delivery takes about ${DELIVERY_LEAD} minutes. Today is ${WEEKDAYS[(now.getDay() + 6) % 7]} ${fmtM(M)}. Classes today: ${sched}. ${current ? "She is in " + current.name + " until " + fmtTime(current.end) + "." : ""} ${next ? "Next class: " + next.name + " at " + fmtTime(next.start) + "." : ""}
Suggested eating timing today:
${plan}
Current meal: ${MEAL_WORD[meal]}${chat.catLabel ? "; she asked for " + chat.catLabel : ""}. Restaurants (best first):
${spots}`;
}

async function claudeReply(text) {
  const key = getApiKey(); if (!key) return false;
  chat.busy = true; chatRender();
  try {
    const history = chat.msgs.filter(m => m.text).slice(-12).map(m => ({ role: m.who === "bot" ? "assistant" : "user", content: m.text }));
    // The last entry is the message we're answering (already appended by said()).
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 500, system: systemPrompt(), messages: history.length ? history : [{ role: "user", content: text }] }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const j = await res.json();
    const out = (j.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    if (!out) throw new Error("empty");
    chat.busy = false;
    const html = renderClaude(out);
    const chips = chat.stage === "ordering" ? orderingChips() : chat.stage === "ordered" ? orderedChips() : optionsChips();
    if (/\[\[card:/i.test(out)) { chat.stage = chat.stage === "ordered" ? "ordered" : "options"; armNudge(); }
    say(html, chips, { text: out.replace(/\[\[card:[^\]]*\]\]/g, "").trim() });
    return true;
  } catch (e) {
    chat.busy = false; chatRender();
    return false;
  }
}
function renderClaude(out) {
  const parts = out.split(/(\[\[card:[^\]]*\]\])/i);
  return parts.map(p => {
    const m = p.match(/^\[\[card:\s*([^|\]]+?)\s*(?:\|\s*([^\]]+?)\s*)?\]\]$/i);
    if (m) {
      const r = findSpot(m[1], m[2]);
      if (!r) return "";
      chat.shown.push(spotKey(r));
      return `<div class="chat-cards">${restaurantCard(r)}<button class="chat-pick" data-pick="${escapeHtml(spotKey(r))}">This one 👍</button></div>`;
    }
    return escapeHtml(p).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  }).join("");
}

// ---- Init ----------------------------------------------------------------------------
function initChat() {
  const input = document.getElementById("chatInput"), send = document.getElementById("chatSend"), log = document.getElementById("chatLog");
  if (!input || !log) return;
  updateChatStatus();
  const restored = chatLoad();
  chat.day = todayKey();
  if (!restored || !chat.msgs.length) { chat.msgs = []; say(greetingHtml(), startChips()); }
  else {
    chatRender();
    if (["options", "ordering"].includes(chat.stage)) armNudge();
  }
  const submit = () => {
    const text = input.value.trim(); if (!text) return;
    input.value = ""; said(text); handleText(text);
  };
  send.addEventListener("click", submit);
  input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
  // "This one" buttons inside cards, and platform taps count as "ordering".
  log.addEventListener("click", e => {
    const p = e.target.closest(".chat-pick");
    if (p) { said("This one 👍"); chooseSpot(p.dataset.pick); return; }
    const a = e.target.closest(".dd-btn");
    if (a && chat.stage !== "ordered") {
      const card = a.closest(".resto");
      const name = card ? (card.querySelector("h3") || {}).textContent : "";
      const r = name ? findSpot(name) : null;
      if (r && chat.chosen !== spotKey(r)) { chat.chosen = spotKey(r); }
      chat.stage = "ordering";
      setTimeout(() => say(`Go ahead, I'm right here 💛 Order the dishes exactly as written, add the allergy note, and tap ✅ when it's placed.`, orderingChips()), 400);
    }
  });
}
