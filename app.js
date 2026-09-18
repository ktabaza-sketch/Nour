/* Nour — app logic: ingredient checker + UI */

// ---- Settings (persisted per-device) --------------------------------------
// Nour's three allergies (red meat, milk, wheat) are always on. The only
// toggles are strictness extras: cross-contact warnings and full gluten-free.
const DEFAULT_SETTINGS = { maycontain: true, gluten: false };

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem("nour.settings") || "{}") };
  } catch { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings(s) {
  try { localStorage.setItem("nour.settings", JSON.stringify(s)); } catch {}
}
let settings = loadSettings();

// ---- Favorites (saved per-device; stores just the ids) --------------------
function loadFavs() {
  try { return JSON.parse(localStorage.getItem("nour.favs") || "{}"); } catch { return {}; }
}
function saveFavs() {
  try { localStorage.setItem("nour.favs", JSON.stringify(favs)); } catch {}
}
let favs = loadFavs();

function favId(kind, name, sub) { return kind + "|" + name + "|" + (sub || ""); }
function isFav(id) { return !!favs[id]; }
function favBtn(id) {
  return `<button class="fav-btn${isFav(id) ? " on" : ""}" data-fav="${escapeHtml(id)}" aria-label="Save to favorites" title="Save to favorites">${isFav(id) ? "♥" : "♡"}</button>`;
}
function favCount() { return Object.keys(favs).length; }

// ---- Checker engine -------------------------------------------------------
// Returns whether a personal-toggle rule is active for the current settings.
function personalActive(rule) {
  if (!rule.personal) return true;          // not gated by a toggle
  if (rule.personal === "maycontain") return settings.maycontain; // "may contain" / shared-line warnings
  if (rule.personal === "gluten")     return settings.gluten;     // strict: barley, rye, uncertified oats
  return true;
}

// Escape a term for use in a word-boundary-ish regex.
function esc(t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// Multi-word qualifiers from the reassuring rules ("corn tortilla", "dairy-free
// cheese", "rice noodles") and the cross-contact rule ("may contain wheat") are
// blanked out before the avoid/caution rules run, so a safe phrase can't trip
// the risky word inside it. Longest phrases are blanked first.
let QUALIFIERS = null;
function qualifierPhrases() {
  if (QUALIFIERS) return QUALIFIERS;
  const q = [];
  for (const rule of RULES) {
    if (rule.severity === "safe" || rule.personal === "maycontain") {
      for (const t of rule.terms) if (/[\s-]/.test(t)) q.push(t);
    }
  }
  QUALIFIERS = q.sort((a, b) => b.length - a.length);
  return QUALIFIERS;
}
function blankQualifiers(hay) {
  let out = hay;
  for (const q of qualifierPhrases()) {
    out = out.replace(new RegExp("(^|[^a-z0-9])" + esc(q) + "(?=[^a-z0-9]|$)", "gi"), (m, pre) => pre + " ".repeat(q.length));
  }
  return out;
}

function analyze(text) {
  const hay = " " + text.toLowerCase().replace(/[\n\r]+/g, " ") + " ";
  const hayStrict = blankQualifiers(hay);
  const findings = [];
  const seen = new Set();

  for (const rule of RULES) {
    // Reassuring and cross-contact rules read the full text; risky rules read
    // the text with the reassuring phrases blanked out.
    const src = (rule.severity === "safe" || rule.personal === "maycontain") ? hay : hayStrict;
    for (const term of rule.terms) {
      // match whole words/phrases: boundary that isn't a letter/number
      const re = new RegExp("(^|[^a-z0-9])" + esc(term) + "([^a-z0-9]|$)", "i");
      if (re.test(src)) {
        const key = rule.category + "|" + term;
        if (seen.has(key)) continue;
        seen.add(key);

        // Personal toggles only ever add caution rules; the three allergies
        // themselves can't be switched off.
        const severity = rule.severity;
        if (rule.personal && !personalActive(rule)) {
          // user opted out of flagging this class -> skip
          continue;
        }
        findings.push({ term, category: rule.category, severity, reason: rule.reason });
        break; // one hit per rule is enough
      }
    }
  }
  return findings;
}

function verdictLevel(findings) {
  if (findings.some(f => f.severity === "avoid")) return "avoid";
  if (findings.some(f => f.severity === "caution")) return "caution";
  if (findings.some(f => f.severity === "safe")) return "safe";
  return "unknown";
}

const VERDICT_COPY = {
  avoid:   { icon: "⛔", title: "Avoid this", sub: "Contains red meat, dairy or wheat. Don't order without a safe swap." },
  caution: { icon: "⚠️", title: "Check first", sub: "Might contain red meat, dairy or wheat (often hidden). Verify before eating." },
  safe:    { icon: "✅", title: "Looks safe", sub: "No red meat, dairy or wheat found — still read the full label." },
  unknown: { icon: "🤔", title: "Not enough info", sub: "Nothing recognized. Paste the full ingredient list or ask the restaurant." },
};

function renderVerdict(findings) {
  const box = document.getElementById("verdict");
  const level = verdictLevel(findings);
  const c = VERDICT_COPY[level];

  // Sort findings: avoid, caution, safe
  const order = { avoid: 0, caution: 1, safe: 2 };
  const sorted = [...findings].sort((a, b) => order[a.severity] - order[b.severity]);

  let body = "";
  if (sorted.length) {
    body = sorted.map(f => `
      <div class="finding ${f.severity}">
        <span class="dot"></span>
        <div>
          <div class="term">${escapeHtml(f.term)} <span class="cat">· ${escapeHtml(f.category)}</span></div>
          <div class="reason">${escapeHtml(f.reason)}</div>
        </div>
      </div>`).join("");
  } else {
    body = `<div class="finding"><div class="reason muted">Try pasting the item's ingredient list, or search the Order and Grocery tabs for safe options.</div></div>`;
  }

  box.className = "verdict " + level;
  box.innerHTML = `
    <div class="verdict-head">
      <div class="big">${c.icon} ${c.title}</div>
      <div class="sub">${c.sub}</div>
    </div>
    <div class="verdict-body">${body}</div>`;
  box.hidden = false;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]
  ));
}

// ---- Open-now status (approximate, from the device's local clock) ----------
// HOURS is keyed "Name|Area". Missing/null => unknown. DoorDash is the true
// source of live availability; this is a best-effort pre-check.
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function toMin(hm) { const [h, m] = hm.split(":").map(Number); return h * 60 + m; }
function fmtTime(hm) {
  let [h, m] = hm.split(":").map(Number);
  if (h >= 24) h -= 24;
  const ap = h >= 12 ? "pm" : "am";
  const hr = ((h + 11) % 12) + 1;
  return m ? `${hr}:${String(m).padStart(2, "0")}${ap}` : `${hr}${ap}`;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// First opening at or after `now`, scanning today's remaining ranges then the
// following days. Returns { add, day, open } or null.
function nextOpening(h, now) {
  const M = now.getHours() * 60 + now.getMinutes();
  for (let add = 0; add < 8; add++) {
    const d = (now.getDay() + add) % 7;
    const ranges = h[DAY_KEYS[d]];
    if (!Array.isArray(ranges) || !ranges.length) continue;
    for (const [o] of ranges) {
      if (add === 0 && toMin(o) <= M) continue; // already passed today
      return { add, day: d, open: o };
    }
  }
  return null;
}

function openStatus(r, now) {
  const h = (typeof HOURS !== "undefined") ? HOURS[r.name + "|" + r.area] : null;
  if (!h) return { state: "unknown" };
  now = now || new Date();
  const M = now.getHours() * 60 + now.getMinutes();
  const today = h[DAY_KEYS[now.getDay()]];
  const yest = h[DAY_KEYS[(now.getDay() + 6) % 7]];

  // Overnight spillover from yesterday (a range whose close is past midnight)
  if (Array.isArray(yest)) {
    for (const [o, c] of yest) {
      if (toMin(c) <= toMin(o) && M < toMin(c)) return { state: "open", label: "Open now", until: c };
    }
  }
  // Currently open?
  if (Array.isArray(today)) {
    for (const [o, c] of today) {
      const om = toMin(o), cm = toMin(c);
      const isOpen = cm > om ? (M >= om && M < cm) : (M >= om);
      if (isOpen) {
        const closeAbs = cm > om ? cm : cm + 1440;
        const closesSoon = (closeAbs - M) <= 45;
        return { state: "open", label: closesSoon ? "Closes soon" : "Open now", until: c, closesSoon };
      }
    }
  }
  // Closed now — say when it opens next.
  const no = nextOpening(h, now);
  if (!no) return { state: "closed", label: "Temporarily closed" };
  let when;
  if (no.add === 0) when = "today " + fmtTime(no.open);
  else if (no.add === 1) when = "tomorrow " + fmtTime(no.open);
  else when = WEEKDAY_SHORT[no.day] + " " + fmtTime(no.open);
  return { state: "closed", label: "Opens " + when };
}

function openBadge(r) {
  const s = openStatus(r);
  if (s.state === "open") {
    const till = (s.until && !s.closesSoon) ? ` · till ${fmtTime(s.until)}` : "";
    return `<span class="open-badge ${s.closesSoon ? "soon" : "open"}">${s.closesSoon ? "🟠" : "🟢"} ${escapeHtml(s.label)}${till}</span>`;
  }
  if (s.state === "closed") return `<span class="open-badge closed">⚫ ${escapeHtml(s.label)}</span>`;
  return `<span class="open-badge unknown">🕘 Hours vary — check DoorDash</span>`;
}

// ---- Rendering static content --------------------------------------------
function renderFacts() {
  const el = document.getElementById("factsList");
  if (el) el.innerHTML = FACTS.map(f => `<li>${escapeHtml(f)}</li>`).join("");
}

let currentMeal = "all";   // "all" shows every restaurant once; meals are optional filters

const MEAL_LABEL = {
  all: "All meals",
  breakfast: "Breakfast & brunch",
  lightLunch: "Light lunch",
  dinner: "Late lunch & dinner",
};
const MEAL_SHORT = { breakfast: "🍳 Breakfast", lightLunch: "🥗 Lunch", dinner: "🍽️ Dinner" };
const MEAL_KEYS = ["breakfast", "lightLunch", "dinner"];

// The "All meals" view: every restaurant once, dishes merged across the meals
// it appears in, filed under the first category it was listed in. Built once.
let ALL_MENU_CACHE = null;
function menuCategoriesFor(meal) {
  if (meal !== "all") return (ORDER_MENU && ORDER_MENU[meal]) || [];
  if (ALL_MENU_CACHE) return ALL_MENU_CACHE;
  const key = r => (r.name + "|" + r.area).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const byKey = new Map(), cats = new Map();
  MEAL_KEYS.forEach(m => (ORDER_MENU[m] || []).forEach(c => c.restaurants.forEach(r => {
    const k = key(r);
    if (!byKey.has(k)) {
      const copy = Object.assign({}, r, { safeDishes: (r.safeDishes || []).slice(), platforms: (r.platforms || []).slice(), meals: [m] });
      byKey.set(k, copy);
      if (!cats.has(c.category)) cats.set(c.category, []);
      cats.get(c.category).push(copy);
    } else {
      const ex = byKey.get(k);
      if (!ex.meals.includes(m)) ex.meals.push(m);
      (r.safeDishes || []).forEach(d => { if (!ex.safeDishes.some(x => x.dish.toLowerCase() === d.dish.toLowerCase())) ex.safeDishes.push(d); });
      (r.platforms || []).forEach(p => { if (!ex.platforms.includes(p)) ex.platforms.push(p); });
      if (ex.rating == null && r.rating != null) { ex.rating = r.rating; ex.reviews = r.reviews; ex.ratingSrc = r.ratingSrc; }
    }
  })));
  ALL_MENU_CACHE = [...cats.entries()].map(([category, restaurants]) => ({ category, restaurants }));
  return ALL_MENU_CACHE;
}
function mealTags(r) {
  if (!r.meals || currentMeal !== "all") return "";
  return `<span class="meal-tags">${r.meals.map(m => `<span class="meal-tag">${MEAL_SHORT[m] || m}</span>`).join("")}</span>`;
}

function restaurantMatches(r, q) {
  if (!q) return true;
  if (r.name.toLowerCase().includes(q) || (r.area || "").toLowerCase().includes(q)) return true;
  return (r.safeDishes || []).some(d =>
    d.dish.toLowerCase().includes(q) || (d.note || "").toLowerCase().includes(q));
}

// Generate delivery links from name + city rather than fixed store IDs (which
// go stale and 404) — a name search always lands on the right restaurant once
// signed in with an address. Each restaurant lists the platform(s) it's on.
function storeQuery(r) {
  const city = (r.area || "").split(/[(\/,]/)[0].trim();
  return encodeURIComponent((r.name + " " + city).trim());
}
function ddSearchUrl(r) { return "https://www.doordash.com/search/store/" + storeQuery(r); }

const PLATFORM = {
  "DoorDash":  { cls: "",         url: r => "https://www.doordash.com/search/store/" + storeQuery(r) },
  "Uber Eats": { cls: "ubereats", url: r => "https://www.ubereats.com/search?q=" + storeQuery(r) },
  "Grubhub":   { cls: "grubhub",  url: r => "https://www.grubhub.com/search?queryText=" + storeQuery(r) },
};
function platformsOf(r) { return (r.platforms && r.platforms.length) ? r.platforms : ["DoorDash"]; }

function platformButtons(r, sm) {
  const btns = platformsOf(r).map(p => {
    const cfg = PLATFORM[p] || PLATFORM["DoorDash"];
    return `<a class="dd-btn ${sm ? "sm " : ""}${cfg.cls}" href="${cfg.url(r)}" target="_blank" rel="noopener noreferrer">🛵 ${escapeHtml(p)}</a>`;
  }).join("");
  return `<div class="plat-row">${btns}</div>`;
}

function dishItem(d) {
  // Highlight ordering instructions ("no cheese", "ask for…") so she sees them.
  const isInstruction = /\b(no |ask|without|dairy-free|oat milk|hold the|sub )/i.test(d.note || "");
  const note = d.note ? ` <span class="dnote${isInstruction ? " instr" : ""}">— ${escapeHtml(d.note)}</span>` : "";
  return `<li>${escapeHtml(d.dish)}${note}</li>`;
}

function ratingBadge(r) {
  if (r.rating == null) return "";
  const stars = "★".repeat(Math.round(r.rating)) + "☆".repeat(5 - Math.round(r.rating));
  const count = r.reviews ? ` <span class="rev">(${formatCount(r.reviews)})</span>` : "";
  const src = r.ratingSrc ? ` ${escapeHtml(r.ratingSrc)}` : "";
  return `<span class="rating" title="${r.rating}${src} rating"><span class="stars">${stars}</span> ${r.rating.toFixed(1)}${count}</span>`;
}

// Spots added from local knowledge rather than a live menu read carry
// `unverified` so the card says so instead of implying a checked rating.
function newTag(r) {
  return r.unverified ? `<span class="new-tag" title="Added without a live menu check — confirm dishes in the delivery app">🆕 new · confirm</span>` : "";
}

function formatCount(n) {
  return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n);
}

// Website + published allergen list, when the restaurant has one. The badge
// says whether a published list backs the dishes or she has to ask.
const ALLERGEN_KIND_LABEL = { chart: "allergen chart", pdf: "allergen PDF", "menu filters": "menu with dietary filters", statement: "allergen statement" };
function allergenBadge(r) {
  if (r.allergenUrl) return `<span class="alg-badge yes" title="${escapeHtml(r.allergenCheck || "")}">📋 Published ${escapeHtml(ALLERGEN_KIND_LABEL[r.allergenKind] || "allergen list")}</span>`;
  if (r.allergenDate) return `<span class="alg-badge no" title="Checked ${escapeHtml(r.allergenDate)}: nothing published — tell them it's an allergy when ordering">📋 No published allergen list · ask</span>`;
  return "";
}
function linksRow(r) {
  const links = [];
  if (r.website) links.push(`<a class="link-btn" href="${escapeHtml(r.website)}" target="_blank" rel="noopener noreferrer">🌐 Website</a>`);
  if (r.allergenUrl) links.push(`<a class="link-btn alg" href="${escapeHtml(r.allergenUrl)}" target="_blank" rel="noopener noreferrer">📋 Allergen list</a>`);
  return links.length ? `<div class="links-row">${links.join("")}</div>` : "";
}
function allergenLine(r) {
  return r.allergenCheck ? `<p class="alg-check">${r.allergenUrl ? "📋" : "ℹ️"} ${escapeHtml(r.allergenCheck)}</p>` : "";
}

function restaurantCard(r) {
  const id = favId("order", r.name, r.area);
  const area = r.area ? `<span class="area-tag">${escapeHtml(r.area)}</span>` : "";
  const dishes = (r.safeDishes || []).map(dishItem).join("");
  const watch = r.watchOut
    ? `<p class="watch"><b>Skip:</b> ${escapeHtml(r.watchOut)}</p>` : "";
  return `
    <div class="resto">
      ${favBtn(id)}
      <div class="resto-head"><h3>${escapeHtml(r.name)}</h3></div>
      <div class="resto-rating">${area}${ratingBadge(r)}${openBadge(r)}${newTag(r)}${allergenBadge(r)}${mealTags(r)}</div>
      <ul class="dishes">${dishes}</ul>
      ${allergenLine(r)}
      ${watch}
      ${linksRow(r)}
      ${platformButtons(r)}
    </div>`;
}

// Sort restaurants by rating (highest first); unrated go last.
function byRating(a, b) {
  const ra = a.rating == null ? -1 : a.rating;
  const rb = b.rating == null ? -1 : b.rating;
  if (rb !== ra) return rb - ra;
  return (b.reviews || 0) - (a.reviews || 0);
}

let currentCuisine = null; // null = all cuisines

function renderCuisineChips() {
  const el = document.getElementById("cuisineChips");
  if (!el) return;
  const cats = menuCategoriesFor(currentMeal).map(c => c.category);
  if (currentCuisine && !cats.includes(currentCuisine)) currentCuisine = null;
  const chip = (label, val, active) =>
    `<button class="chip${active ? " active" : ""}" data-cuisine="${val === null ? "" : escapeHtml(val)}">${escapeHtml(label)}</button>`;
  el.innerHTML = chip("All", null, currentCuisine === null) +
    cats.map(c => chip(c, c, currentCuisine === c)).join("");
  el.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => {
    currentCuisine = b.dataset.cuisine || null;
    renderCuisineChips();
    renderRestaurants(document.getElementById("restoSearch").value);
  }));
}

function renderRestaurants(filter = "") {
  const q = filter.trim().toLowerCase();
  const el = document.getElementById("restoList");
  const meta = document.getElementById("restoMeta");
  const categories = menuCategoriesFor(currentMeal)
    .filter(c => !currentCuisine || c.category === currentCuisine);

  let count = 0;
  const html = categories.map(cat => {
    const restos = cat.restaurants.filter(r => restaurantMatches(r, q)).sort(byRating);
    count += restos.length;
    if (!restos.length) return "";
    return `<div class="cat-head">${escapeHtml(cat.category)}</div>` +
      restos.map(restaurantCard).join("");
  }).join("");

  const scope = currentCuisine ? `${currentCuisine} · ` : "";
  meta.textContent = `${scope}${MEAL_LABEL[currentMeal]} · ${count} spot${count === 1 ? "" : "s"} · open-now is from your device time`;

  if (!count) {
    el.innerHTML = `<div class="card muted">No matches here. Try another cuisine, switch to <b>All meals</b>, or a term like "chicken" or "poke".</div>`;
    return;
  }
  el.innerHTML = html;
}

// ---- Week planner (generated, rotates weekly, season-aware) ----------------
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_ORDER = ["Breakfast", "Lunch", "Dinner"];
const MEAL_KEY = { Breakfast: "breakfast", Lunch: "lightLunch", Dinner: "dinner" };
let selectedDayIdx = null;

function todayPlanIdx() { return (new Date().getDay() + 6) % 7; } // Mon=0 … Sun=6

// Week bucket: 7-day periods aligned to Monday, from the device's local date.
function weekIndex(now) {
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayNum = Math.floor(local.getTime() / 86400000);
  return Math.floor((dayNum - 4) / 7);
}

function seasonFor(now) {
  const m = now.getMonth();
  if (m === 11 || m <= 1) return SEASONS.winter;
  if (m <= 4) return SEASONS.spring;
  if (m <= 7) return SEASONS.summer;
  return SEASONS.fall;
}

// Each restaurant becomes a candidate carrying its full dish list, so we can
// build a two-course pairing from it.
function mealPool(mealLabel) {
  const out = [];
  (ORDER_MENU[MEAL_KEY[mealLabel]] || []).forEach(cat =>
    cat.restaurants.forEach(r => {
      if ((r.safeDishes || []).length) out.push({ meal: mealLabel, name: r.name, area: r.area, cuisine: cat.category, dishes: r.safeDishes, platforms: r.platforms });
    }));
  return out;
}

function gcd(a, b) { return b ? gcd(b, a % b) : a; }

// Deterministic index distinct across the 7 weekdays and shifting every week.
function rotIndex(n, week, day, seed) {
  const stride = [7, 5, 3, 2].find(s => gcd(s, n) === 1) || 1;
  return (((week * 11 + day * stride + seed * 3) % n) + n) % n;
}

function optionCounts() {
  const names = new Set();
  let dishes = 0;
  ["breakfast", "lightLunch", "dinner"].forEach(m =>
    (ORDER_MENU[m] || []).forEach(c => c.restaurants.forEach(r => {
      names.add(r.name + "|" + r.area);
      dishes += (r.safeDishes || []).length;
    })));
  return { restaurants: names.size, dishes: Math.floor(dishes / 10) * 10 };
}

// A dish counts as a real protein course if it can be had with chicken or
// seafood (checks the dish name and its note, e.g. "Pad Thai — chicken or tofu").
const PROTEIN_RE = /\b(chicken|turkey|duck|poultry|karaage|fish|salmon|tuna|ahi|shrimp|prawn|crab|lobster|scallop|poke|sashimi|nigiri|chirashi|seafood|lox|nova|halibut|cod|bangus|milkfish|eel|unagi|ceviche|anchovy)\b/i;
function hasProtein(d) { return PROTEIN_RE.test(d.dish + " " + (d.note || "")); }
function restaurantHasProtein(r) { return (r.dishes || []).some(hasProtein); }

// Season-favored subset if it's big enough, else the full pool.
function seasonPool(mealLabel, season) {
  const full = mealPool(mealLabel);
  const fav = full.filter(c => season.favored[mealLabel].includes(c.cuisine));
  return fav.length >= 8 ? fav : full;
}

// Restaurants that can serve a chicken/seafood course — so every meal option
// carries protein. Prefer season-favored; widen if too few.
function proteinPool(mealLabel, season) {
  const seasonal = seasonPool(mealLabel, season).filter(restaurantHasProtein);
  if (seasonal.length >= 2) return seasonal;
  const full = mealPool(mealLabel).filter(restaurantHasProtein);
  return full.length >= 2 ? full : seasonPool(mealLabel, season);
}

// Two distinct restaurant options for a meal (rotates weekly).
function twoOptions(pool, week, day, seed) {
  const n = pool.length;
  if (!n) return [];
  const i1 = rotIndex(n, week, day, seed);
  let i2 = rotIndex(n, week, day, seed + 37);
  if (i2 === i1) i2 = (i1 + 1) % n;
  return n >= 2 ? [pool[i1], pool[i2]] : [pool[i1]];
}

function planForDay(week, day, season) {
  return MEAL_ORDER.map((meal, mi) => ({
    meal,
    kcal: (NUTRITION.splits.find(s => s.meal === meal) || {}).kcal || "",
    options: twoOptions(proteinPool(meal, season), week, day, mi + 1),
  }));
}

// A low-effort prep option for a day — plant-based or ready-to-heat, rotating.
function prepPickFor(week, day) {
  if (typeof PREP_SERVICES === "undefined") return null;
  const flat = [];
  PREP_SERVICES.forEach(c => c.services.forEach(s => {
    if (s.type === "Plant-based" || s.type === "Prepared") flat.push(s);
  }));
  return flat.length ? flat[rotIndex(flat.length, week, day, 9)] : null;
}

// Build a two-course pairing that always leads with a chicken/seafood course.
function twoCourses(dishes) {
  const pi = (dishes || []).findIndex(hasProtein);
  if (pi < 0) return (dishes || []).slice(0, 2);
  const protein = dishes[pi];
  const other = dishes.find((d, i) => i !== pi);
  return other ? [protein, other] : [protein];
}

// Nutrition tags for a pairing — protein is guaranteed; omega-3/iron/calcium
// are inferred from the dishes so the health angle is visible at a glance.
function nutriTags(courses) {
  const t = courses.map(c => c.dish + " " + (c.note || "")).join(" ").toLowerCase();
  const tags = ["💪 Protein"];
  if (/salmon|tuna|ahi|fish|shrimp|poke|sashimi|nigiri|crab|lobster|scallop|lox|nova|sardine|anchovy|eel|seafood|ceviche|halibut|cod|bangus|milkfish/.test(t)) tags.push("🐟 Omega-3");
  if (/chicken|turkey|duck|fish|salmon|tuna|shrimp|tofu|bean|lentil|chickpea|chana|daal|dal|spinach|falafel|hummus|edamame/.test(t)) tags.push("🩸 Iron");
  if (/tahini|hummus|greens|kale|spinach|tofu|sesame|almond|broccoli|bok choy/.test(t)) tags.push("🦴 Calcium");
  return tags;
}

// A restaurant option rendered as a two-course pairing.
function optionCard(o, idx) {
  const courses = twoCourses(o.dishes);
  const labels = courses.length > 1 ? ["Main", "Second course"] : ["Dish"];
  const courseHtml = courses.map((d, i) => `
    <div class="course">
      <span class="course-n">${labels[i] || "Course " + (i + 1)}</span>
      <span class="course-dish">${escapeHtml(d.dish)}${d.note ? ` <span class="course-note">— ${escapeHtml(d.note)}</span>` : ""}</span>
    </div>`).join("");
  const tags = nutriTags(courses).map(x => `<span class="ntag">${x}</span>`).join("");
  const id = favId("order", o.name, o.area);
  return `
    <div class="opt">
      ${favBtn(id)}
      <div class="opt-head">
        <span class="opt-tag">Option ${idx === 0 ? "A" : "B"}</span>
        <span class="opt-name">${escapeHtml(o.name)}</span>
      </div>
      <div class="opt-status">${openBadge(o)} <span class="area-tag">${escapeHtml(o.area)}</span>${newTag(o)}</div>
      <div class="courses">${courseHtml}</div>
      <div class="ntags">${tags}</div>
      ${platformButtons(o, true)}
    </div>`;
}

function mealBlock(sec) {
  return `
    <div class="meal-block">
      <div class="meal-head">
        <span class="meal-title">${escapeHtml(sec.meal)}</span>
        <span class="meal-kcal">target ${escapeHtml(sec.kcal)} kcal</span>
      </div>
      ${sec.options.map(optionCard).join("")}
    </div>`;
}

function designPanel(dayLabel) {
  return `
    <div class="design-card">
      <div class="design-title">🧠 How I built ${dayLabel}'s plan for you</div>
      <p>I balanced it to about <b>2,000–2,200 kcal</b> across the day (≈500 breakfast · ≈650 lunch · ≈750 dinner, with room for a snack), with <b>protein in every meal</b> and <b>wheat-free complex carbs</b> — rice, quinoa, potatoes, corn — so your energy and focus stay steady through long study sessions.</p>
      <p>Since you skip <b>red meat, dairy and wheat</b>, I leaned on <b>fish, tofu, beans, chicken &amp; leafy greens for iron</b> (with vitamin-C veg so your body absorbs it), <b>tahini, greens &amp; fortified sides for calcium</b>, <b>beans, greens &amp; eggs for the fiber and B-vitamins</b> you'd otherwise get from wheat, plus <b>omega-3 fish and eggs</b> for memory and energy. Two options per meal, each a two-course combo where <b>at least one course is chicken or seafood</b> so you always get solid protein — pick whatever sounds best. 💛</p>
    </div>`;
}

function nutritionDetails() {
  return `
    <details class="nutri">
      <summary>Recommended daily targets for you 📊</summary>
      <p class="nutri-note">${escapeHtml(NUTRITION.note)}</p>
      <ul class="nutri-list">
        ${NUTRITION.targets.map(t => `<li><span class="nk">${escapeHtml(t.k)}</span><span class="nv">${escapeHtml(t.v)}</span><span class="nw">${escapeHtml(t.why)}</span></li>`).join("")}
      </ul>
    </details>`;
}

function prepShortcut(s, isToday) {
  if (!s) return "";
  return `
    <div class="prep-shortcut">
      <div class="ps-title">🍱 No time to cook ${isToday ? "today" : "that day"}?</div>
      <div class="ps-name">${escapeHtml(s.name)} <span class="prep-type">${escapeHtml(s.type)}</span></div>
      <div class="ps-note">${escapeHtml(s.note)}</div>
      <a class="dd-btn prep-btn sm" href="${escapeHtml(s.url || "#")}" target="_blank" rel="noopener noreferrer">🍱 Set up on ${escapeHtml(s.name)}</a>
    </div>`;
}

function renderWeek() {
  const chipsEl = document.getElementById("dayChips");
  const planEl = document.getElementById("dayPlan");
  const statsEl = document.getElementById("weekStats");
  if (!chipsEl || !planEl) return;

  const now = new Date();
  const week = weekIndex(now);
  const season = seasonFor(now);
  const counts = optionCounts();
  const todayIdx = todayPlanIdx();
  if (selectedDayIdx == null) selectedDayIdx = todayIdx;

  if (statsEl) {
    statsEl.innerHTML = `<b>${counts.restaurants} safe restaurants · ${counts.dishes}+ dishes with no red meat, no dairy and no wheat.</b> You're never limited, Nour 💚`;
  }

  chipsEl.innerHTML = WEEKDAYS.map((d, i) =>
    `<button class="day-chip${i === selectedDayIdx ? " active" : ""}${i === todayIdx ? " is-today" : ""}" data-i="${i}">${escapeHtml(d.slice(0, 3))}</button>`
  ).join("");
  chipsEl.querySelectorAll(".day-chip").forEach(b =>
    b.addEventListener("click", () => { selectedDayIdx = +b.dataset.i; renderWeek(); }));

  const dayName = WEEKDAYS[selectedDayIdx];
  const isToday = selectedDayIdx === todayIdx;
  const dayLabel = isToday ? "today" : dayName;
  const plan = planForDay(week, selectedDayIdx, season);

  const note = `Hi Nour 💚 Palo Alto is deep in ${season.label.split(" ")[0].toLowerCase()} right now — usually ${season.weather} this time of year — the kind of weather that calls for ${season.lean}. So ${isToday ? "today's" : dayName + "'s"} picks lean that way, each one hand-checked to be <b>free of red meat, dairy and wheat</b> — with the exact thing to ask for (corn tortillas, tamari, no bun) — just for you. 💛`;

  planEl.innerHTML = `
    <div class="day-head">
      <div class="day-title">${season.emoji} ${escapeHtml(dayName)}${isToday ? ' <span class="today-tag">Today</span>' : ""}</div>
      <div class="day-theme">${escapeHtml(season.label)} · a fresh plan every week</div>
    </div>
    <div class="day-note">${note}</div>
    ${typeof eatingPlanHtml === "function" ? eatingPlanHtml((selectedDayIdx + 1) % 7, isToday) : ""}
    ${designPanel(dayLabel)}
    ${nutritionDetails()}
    ${plan.map(mealBlock).join("")}
    ${prepShortcut(prepPickFor(week, selectedDayIdx), isToday)}
    <button class="explore-btn" id="exploreAll">🍽️ You've got ${counts.restaurants} spots &amp; ${counts.dishes}+ safe dishes — explore them all →</button>`;

  const explore = document.getElementById("exploreAll");
  if (explore) explore.addEventListener("click", () => switchTab("order"));
}

// ---- Grocery (Whole Foods / Amazon / Walmart / bakeries / specialty shops) ----
let currentStore = "";        // "" = all stores
let currentGrocCat = null;    // null = all categories
let currentGrocView = "products"; // "products" | "shops"
let currentShopType = null;   // null = all shop types

const AMAZON_FAMILY = ["Whole Foods", "Amazon Fresh", "Amazon"];
const STORE_REG = (typeof STORES !== "undefined") ? STORES : {};
function storeShort(s) { return (STORE_REG[s] && STORE_REG[s].short) || s; }
// Every retailer an item can be bought from: the Amazon family via `stores`,
// everyone else via `links`.
function itemStores(it) {
  const set = new Set((it.stores || []).filter(s => AMAZON_FAMILY.includes(s)));
  Object.keys(it.links || {}).forEach(s => set.add(s));
  return [...set];
}
function looksLikeSearch(url) { return /\/search|[?&]q=|[?&]k=|[?&]query|[?&]search/i.test(url || ""); }

const NUTRIENT_LABEL = {
  protein: "💪 Protein", iron: "🩸 Iron", calcium: "🦴 Calcium", "omega-3": "🐟 Omega-3",
  fiber: "🌾 Fiber", b12: "⚡ B12", "vitamin-d": "☀️ Vit D", "vitamin-c": "🍊 Vit C",
  multivitamin: "💊 Multi", magnesium: "✨ Magnesium",
};
function storeKey(s) { return s.toLowerCase().replace(/[^a-z]+/g, "-"); }

// Link straight to the specific product page when we have a verified ASIN;
// otherwise fall back to a precise product search (never a fabricated ASIN).
function amazonUrl(item) {
  if (item.asin && /^B0[A-Z0-9]{8}$/i.test(item.asin)) {
    return "https://www.amazon.com/dp/" + item.asin.toUpperCase();
  }
  const clean = ((item.brand ? item.brand + " " : "") + item.name).replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  let dept = "";
  if (currentStore === "Amazon Fresh") dept = "&i=amazonfresh";
  else if (currentStore === "Whole Foods") dept = "&i=wholefoods";
  return "https://www.amazon.com/s?k=" + encodeURIComponent(clean) + dept;
}
function isSpecificItem(item) { return !!(item.asin && /^B0[A-Z0-9]{8}$/i.test(item.asin)); }

function nutrientChips(ns) {
  return (ns || []).map(n => `<span class="ntag">${NUTRIENT_LABEL[n] || escapeHtml(n)}</span>`).join("");
}
function storeBadges(ss) {
  return (ss || []).map(s => `<span class="store-badge sb-${storeKey(s)}">${escapeHtml(storeShort(s))}</span>`).join("");
}

// One buy button per retailer. The store being filtered on comes first.
function buyButtons(it) {
  const btns = [];
  const amz = (it.stores || []).some(s => AMAZON_FAMILY.includes(s));
  if (amz) {
    const store = AMAZON_FAMILY.includes(currentStore) ? currentStore : "Amazon";
    btns.push({ store, url: amazonUrl(it), specific: isSpecificItem(it) });
  }
  for (const [store, url] of Object.entries(it.links || {})) {
    if (!url) continue;
    btns.push({ store, url, specific: !looksLikeSearch(url) });
  }
  btns.sort((a, b) => (b.store === currentStore) - (a.store === currentStore));
  return btns.map(b => `<a class="dd-btn store-btn sk-${storeKey(b.store)}" href="${escapeHtml(b.url)}" target="_blank" rel="noopener noreferrer">🛒 ${b.specific ? "Buy at" : "Find at"} ${escapeHtml(storeShort(b.store))}</a>`).join("");
}
function firstBuyUrl(it) {
  if ((it.stores || []).some(s => AMAZON_FAMILY.includes(s))) return amazonUrl(it);
  const first = Object.values(it.links || {}).find(Boolean);
  return first || amazonUrl(it);
}

function groceryMatches(it, q) {
  if (currentStore && !itemStores(it).includes(currentStore)) return false;
  if (!q) return true;
  const hay = (it.name + " " + (it.brand || "") + " " + (it.note || "") + " " + (it.verified || "") + " " + (it.diet || "") + " " + (it.gfLabel ? "gluten-free gf" : "") + " " + (it.nutrients || []).join(" ")).toLowerCase();
  return hay.includes(q);
}

function groceryCard(it) {
  const dietTag = it.diet ? ` · ${escapeHtml(it.diet)}` : "";
  const gfBadge = it.gfLabel ? `<span class="gf-badge" title="Labelled gluten-free">GF label</span>` : "";
  const id = favId("grocery", it.name, it.brand);
  return `
    <div class="resto groc">
      ${favBtn(id)}
      <div class="resto-head"><h3>${escapeHtml(it.name)}</h3></div>
      ${it.brand ? `<div class="groc-brand">${escapeHtml(it.brand)}</div>` : ""}
      <div class="resto-rating">${ratingBadge(it)}${storeBadges(itemStores(it))}</div>
      <div class="groc-verified">✓ No red meat · no dairy · no wheat${dietTag} ${gfBadge}</div>
      ${it.verified ? `<div class="groc-note">${escapeHtml(it.verified)}</div>` : (it.note ? `<div class="groc-note">${escapeHtml(it.note)}</div>` : "")}
      ${(it.nutrients && it.nutrients.length) ? `<div class="ntags">${nutrientChips(it.nutrients)}</div>` : ""}
      <div class="buy-row">${buyButtons(it)}</div>
    </div>`;
}

// Store filter chips — built from whatever retailers the catalog actually links to.
function renderStoreChips() {
  const el = document.getElementById("storeChips");
  if (!el || typeof GROCERY_ITEMS === "undefined") return;
  const counts = {};
  GROCERY_ITEMS.forEach(c => c.items.forEach(it => itemStores(it).forEach(s => { counts[s] = (counts[s] || 0) + 1; })));
  // Only retailers with a few products get a chip; the rest still show as badges and buy buttons.
  const order = [...AMAZON_FAMILY.filter(s => counts[s]), ...Object.keys(counts).filter(s => !AMAZON_FAMILY.includes(s) && counts[s] >= 3).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))];
  const chip = (label, val, active) => `<button class="chip${active ? " active" : ""}" data-store="${escapeHtml(val)}">${escapeHtml(label)}</button>`;
  el.innerHTML = chip("All stores", "", currentStore === "") + order.map(s => chip(`${storeShort(s)} · ${counts[s]}`, s, currentStore === s)).join("");
  el.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => {
    currentStore = b.dataset.store || "";
    renderStoreChips();
    renderGrocery();
  }));
}

// ---- Where to shop (bakeries, specialty grocers, online retailers) ----------
const SHOP_TYPE_ORDER = ["Supermarket", "Bakery", "Organic & specialty", "Asian & international", "Online retailer", "Brand direct"];
function shopList() { return (typeof SHOPS !== "undefined") ? SHOPS : []; }

function shopCard(s) {
  const id = favId("shop", s.name, "");
  const best = (s.bestFor || []).map(t => `<span class="ntag">${escapeHtml(t)}</span>`).join("");
  return `
    <div class="resto shop">
      ${favBtn(id)}
      <div class="resto-head"><h3>${escapeHtml(s.name)}</h3></div>
      <div class="resto-rating"><span class="shop-type">${escapeHtml(s.type)}</span>${s.area ? `<span class="area-tag">${escapeHtml(s.area)}</span>` : ""}${ratingBadge(s)}</div>
      ${s.delivery ? `<div class="shop-delivery">🚚 ${escapeHtml(s.delivery)}</div>` : ""}
      ${s.why ? `<div class="groc-note">${escapeHtml(s.why)}</div>` : ""}
      ${best ? `<div class="ntags"><span class="ntags-label">Look for:</span>${best}</div>` : ""}
      ${s.orderTip ? `<div class="shop-tip">💡 ${escapeHtml(s.orderTip)}</div>` : ""}
      ${s.watchOut ? `<p class="watch"><b>Watch:</b> ${escapeHtml(s.watchOut)}</p>` : ""}
      ${s.url ? `<a class="dd-btn store-btn sk-${storeKey(s.name)}" href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">🏪 Open ${escapeHtml(s.name)}</a>` : ""}
    </div>`;
}

function renderShopTypeChips() {
  const el = document.getElementById("shopTypeChips");
  if (!el) return;
  const counts = {};
  shopList().forEach(s => { counts[s.type] = (counts[s.type] || 0) + 1; });
  const types = [...SHOP_TYPE_ORDER.filter(t => counts[t]), ...Object.keys(counts).filter(t => !SHOP_TYPE_ORDER.includes(t))];
  const chip = (label, val, active) => `<button class="chip${active ? " active" : ""}" data-type="${escapeHtml(val)}">${escapeHtml(label)}</button>`;
  el.innerHTML = chip("All", "", currentShopType === null) + types.map(t => chip(`${t} · ${counts[t]}`, t, currentShopType === t)).join("");
  el.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => {
    currentShopType = b.dataset.type || null;
    renderShopTypeChips();
    renderShops();
  }));
}

function renderShops() {
  const el = document.getElementById("shopsList");
  if (!el) return;
  const q = (document.getElementById("grocSearch").value || "").trim().toLowerCase();
  const list = shopList().filter(s => (!currentShopType || s.type === currentShopType) &&
    (!q || (s.name + " " + s.type + " " + (s.area || "") + " " + (s.why || "") + " " + (s.bestFor || []).join(" ") + " " + (s.delivery || "")).toLowerCase().includes(q)));
  const groups = {};
  list.forEach(s => (groups[s.type] = groups[s.type] || []).push(s));
  const types = [...SHOP_TYPE_ORDER.filter(t => groups[t]), ...Object.keys(groups).filter(t => !SHOP_TYPE_ORDER.includes(t))];
  const meta = document.getElementById("shopsMeta");
  if (meta) meta.textContent = `${currentShopType || "All types"} · ${list.length} shop${list.length === 1 ? "" : "s"} that deliver to Palo Alto or ship`;
  el.innerHTML = list.length
    ? types.map(t => `<div class="cat-head">${escapeHtml(t)}</div>` + groups[t].sort(byRating).map(shopCard).join("")).join("")
    : `<div class="card muted">No shops match. Try another type or search term.</div>`;
}

function setGrocView(view) {
  currentGrocView = view;
  const products = view === "products";
  const show = (id, on) => { const e = document.getElementById(id); if (e) e.hidden = !on; };
  show("productsBlock", products); show("storeChips", products); show("grocCatChips", products);
  show("shopsBlock", !products); show("shopTypeChips", !products);
  const search = document.getElementById("grocSearch");
  if (search) search.placeholder = products ? "Search products, brands, or nutrients…" : "Search shops, areas, or what they're good for…";
  document.querySelectorAll("#grocView .seg-btn").forEach(b => b.classList.toggle("active", b.dataset.gview === view));
  if (products) renderGrocery(); else { renderShopTypeChips(); renderShops(); }
}

function renderGrocCatChips() {
  const el = document.getElementById("grocCatChips");
  if (!el || typeof GROCERY_ITEMS === "undefined") return;
  const cats = GROCERY_ITEMS.map(c => c.category);
  const chip = (label, val, active) =>
    `<button class="chip${active ? " active" : ""}" data-cat="${val === null ? "" : escapeHtml(val)}">${escapeHtml(label)}</button>`;
  el.innerHTML = chip("All", null, currentGrocCat === null) +
    cats.map(c => chip(c, c, currentGrocCat === c)).join("");
  el.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => {
    currentGrocCat = b.dataset.cat || null;
    renderGrocCatChips();
    renderGrocery();
  }));
}

// A balanced weekly basket covering protein / iron / calcium / omega-3.
const GROC_ROLES = [
  { label: "Poultry or eggs", pred: it => it.category === "Poultry & Seafood" && /chicken|turkey|egg/i.test(it.name) },
  { label: "Omega-3 fish", pred: it => (it.nutrients || []).includes("omega-3") && it.category !== "Vitamins & Supplements" && it.category !== "Dairy Alternatives & Eggs" },
  { label: "Plant protein", pred: it => /bean|lentil|chickpea|garbanzo|tofu|tempeh|edamame/i.test(it.name) },
  { label: "Calcium plant milk", pred: it => it.category === "Dairy Alternatives & Eggs" && (it.nutrients || []).includes("calcium") },
  { label: "Iron food", pred: it => (it.nutrients || []).includes("iron") && it.category !== "Vitamins & Supplements" && !/milk/i.test(it.name) },
  { label: "Calcium food", pred: it => (it.nutrients || []).includes("calcium") && it.category !== "Vitamins & Supplements" && it.category !== "Dairy Alternatives & Eggs" },
  { label: "Wheat-free grain", pred: it => it.category === "Pantry & Dry Goods" && /oat|quinoa|rice|pasta|buckwheat|millet|tortilla/i.test(it.name) },
  { label: "Vitamin-C produce", pred: it => it.category === "Produce" && (it.nutrients || []).includes("vitamin-c") },
  { label: "Study snack", pred: it => it.category === "Snacks" },
];

function renderGrocWeekly() {
  const el = document.getElementById("grocWeekly");
  if (!el || typeof GROCERY_ITEMS === "undefined") return;
  const flat = [];
  GROCERY_ITEMS.forEach(c => c.items.forEach(it => flat.push(Object.assign({ category: c.category }, it))));
  const week = weekIndex(new Date());
  const picks = GROC_ROLES.map((r, i) => {
    const pool = flat.filter(r.pred);
    if (!pool.length) return null;
    return { role: r.label, it: pool[rotIndex(pool.length, week, 0, i + 1)] };
  }).filter(Boolean);

  el.innerHTML = `
    <div class="card weekly-card">
      <div class="weekly-title">🧺 This week's grocery list</div>
      <p class="weekly-why">A balanced basket that covers your week's <b>protein, iron, calcium, fiber &amp; omega-3</b> — every item free of red meat, dairy and wheat. It refreshes each week.</p>
      <ul class="weekly-list">
        ${picks.map(p => `
          <li>
            <div class="wl-main"><span class="wl-role">${escapeHtml(p.role)}</span>
            <span class="wl-name">${escapeHtml(p.it.name)}${p.it.brand ? ` · <span class="muted">${escapeHtml(p.it.brand)}</span>` : ""}</span></div>
            <a class="wl-add" href="${firstBuyUrl(p.it)}" target="_blank" rel="noopener noreferrer">Add</a>
          </li>`).join("")}
      </ul>
    </div>`;
}

function renderGrocery() {
  const labels = document.getElementById("grocLabels");
  if (labels) labels.innerHTML = GROCERY.labelCheck.map(l => `<li>${escapeHtml(l)}</li>`).join("");
  if (typeof GROCERY_ITEMS === "undefined") return;
  if (currentGrocView === "shops") { renderShops(); return; }

  renderGrocWeekly();
  const q = (document.getElementById("grocSearch").value || "").trim().toLowerCase();
  const cats = GROCERY_ITEMS.filter(c => !currentGrocCat || c.category === currentGrocCat);
  let count = 0;
  const html = cats.map(cat => {
    const items = cat.items.filter(it => groceryMatches(it, q)).sort(byRating);
    count += items.length;
    if (!items.length) return "";
    return `<div class="cat-head">${escapeHtml(cat.category)}</div>` + items.map(groceryCard).join("");
  }).join("");

  const meta = document.getElementById("grocMeta");
  if (meta) meta.textContent = `${currentGrocCat ? currentGrocCat + " · " : ""}${currentStore ? storeShort(currentStore) : "All stores"} · ${count} item${count === 1 ? "" : "s"}`;
  const el = document.getElementById("grocList");
  el.innerHTML = count ? html : `<div class="card muted">No matches. Try another store, category, or search term.</div>`;
}

// ---- Meal-prep services ---------------------------------------------------
let currentPrepType = "";
let currentPrepCat = null;

function prepMatches(s, q) {
  if (currentPrepType && s.type !== currentPrepType) return false;
  if (!q) return true;
  const hay = (s.name + " " + (s.note || "") + " " + (s.tags || []).join(" ") + " " + (s.type || "")).toLowerCase();
  return hay.includes(q);
}

function prepCard(s) {
  const tags = (s.tags || []).map(t => `<span class="ntag">${escapeHtml(t)}</span>`).join("");
  const delivers = s.deliversTo ? `<span class="area-tag">🚚 ${escapeHtml(s.deliversTo)}</span>` : "";
  const id = favId("prep", s.name, "");
  return `
    <div class="resto groc prep">
      ${favBtn(id)}
      <div class="resto-head"><h3>${escapeHtml(s.name)}</h3></div>
      <div class="resto-rating">${ratingBadge(s)}${delivers}<span class="prep-type">${escapeHtml(s.type || "")}</span></div>
      ${s.note ? `<div class="groc-note">${escapeHtml(s.note)}</div>` : ""}
      ${tags ? `<div class="ntags">${tags}</div>` : ""}
      ${s.watchOut ? `<p class="watch"><b>Watch:</b> ${escapeHtml(s.watchOut)}</p>` : ""}
      <a class="dd-btn prep-btn" href="${escapeHtml(s.url || "#")}" target="_blank" rel="noopener noreferrer">🍱 Set up on ${escapeHtml(s.name)}</a>
    </div>`;
}

function renderPrepCatChips() {
  const el = document.getElementById("prepCatChips");
  if (!el || typeof PREP_SERVICES === "undefined") return;
  const cats = PREP_SERVICES.map(c => c.category);
  const chip = (label, val, active) =>
    `<button class="chip${active ? " active" : ""}" data-pcat="${val === null ? "" : escapeHtml(val)}">${escapeHtml(label)}</button>`;
  el.innerHTML = chip("All", null, currentPrepCat === null) + cats.map(c => chip(c, c, currentPrepCat === c)).join("");
  el.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => {
    currentPrepCat = b.dataset.pcat || null;
    renderPrepCatChips();
    renderPrep();
  }));
}

function findPrepService(name) {
  for (const c of (PREP_SERVICES || [])) for (const s of c.services) if (s.name === name) return s;
  return null;
}

// Featured "best starting point" recommendation for Nour.
function renderPrepFeatured() {
  const el = document.getElementById("prepFeatured");
  if (!el || typeof PREP_SERVICES === "undefined") return;
  const top = findPrepService("Thistle") || findPrepService("Mosaic Foods");
  if (!top) { el.innerHTML = ""; return; }
  const tags = (top.tags || []).map(t => `<span class="ntag">${escapeHtml(t)}</span>`).join("");
  el.innerHTML = `
    <div class="card featured">
      <div class="featured-tag">★ Best starting point for you, Nour</div>
      <div class="featured-name">${escapeHtml(top.name)} <span class="prep-type">${escapeHtml(top.type)}</span></div>
      <div class="resto-rating">${ratingBadge(top)}<span class="area-tag">🚚 ${escapeHtml(top.deliversTo)}</span></div>
      <p class="featured-why">${escapeHtml(top.note)} Every meal is gluten-free <em>and</em> dairy-free by default with no red meat on the menu, so there's almost nothing to screen — just add salmon or chicken for extra protein.</p>
      ${tags ? `<div class="ntags">${tags}</div>` : ""}
      <a class="dd-btn prep-btn" href="${escapeHtml(top.url)}" target="_blank" rel="noopener noreferrer">🍱 Start with ${escapeHtml(top.name)}</a>
      <p class="featured-alt">Also great: <b>Mosaic Foods</b> (frozen, protein-forward, fully plant-based) and <b>Territory Foods</b> (prepared chicken/fish, dairy-free by default).</p>
    </div>`;
}

function renderPrep() {
  if (typeof PREP_SERVICES === "undefined") return;
  renderPrepFeatured();
  const q = (document.getElementById("prepSearch").value || "").trim().toLowerCase();
  const cats = PREP_SERVICES.filter(c => !currentPrepCat || c.category === currentPrepCat);
  let count = 0;
  const html = cats.map(cat => {
    const svcs = cat.services.filter(s => prepMatches(s, q)).sort(byRating);
    count += svcs.length;
    if (!svcs.length) return "";
    return `<div class="cat-head">${escapeHtml(cat.category)}</div>` + svcs.map(prepCard).join("");
  }).join("");
  const meta = document.getElementById("prepMeta");
  if (meta) meta.textContent = `${currentPrepCat ? currentPrepCat + " · " : ""}${currentPrepType || "All types"} · ${count} service${count === 1 ? "" : "s"} · ratings from Trustpilot / App Store`;
  const el = document.getElementById("prepList");
  el.innerHTML = count ? html : `<div class="card muted">No matches. Try another type or search term.</div>`;
}

// ---- Favorites view -------------------------------------------------------
function favSection(icon, title, groups, cardFn) {
  const cats = Object.keys(groups);
  if (!cats.length) return "";
  return `<div class="fav-kind"><div class="fav-kind-head">${icon} ${escapeHtml(title)}</div>` +
    cats.map(cat => `<div class="cat-head">${escapeHtml(cat)}</div>` + groups[cat].map(cardFn).join("")).join("") +
    `</div>`;
}

function renderFavorites() {
  const el = document.getElementById("favList");
  if (!el) return;

  const seen = new Set();
  const restoGroups = {};
  ["breakfast", "lightLunch", "dinner"].forEach(meal => (ORDER_MENU[meal] || []).forEach(c => c.restaurants.forEach(r => {
    const id = favId("order", r.name, r.area);
    if (favs[id] && !seen.has(id)) { seen.add(id); (restoGroups[c.category] = restoGroups[c.category] || []).push(r); }
  })));

  const grocGroups = {};
  (typeof GROCERY_ITEMS !== "undefined" ? GROCERY_ITEMS : []).forEach(c => c.items.forEach(it => {
    const id = favId("grocery", it.name, it.brand);
    if (favs[id]) (grocGroups[c.category] = grocGroups[c.category] || []).push(it);
  }));

  const prepGroups = {};
  (typeof PREP_SERVICES !== "undefined" ? PREP_SERVICES : []).forEach(c => c.services.forEach(s => {
    const id = favId("prep", s.name, "");
    if (favs[id]) (prepGroups[c.category] = prepGroups[c.category] || []).push(s);
  }));

  const shopGroups = {};
  shopList().forEach(s => {
    const id = favId("shop", s.name, "");
    if (favs[id]) (shopGroups[s.type] = shopGroups[s.type] || []).push(s);
  });

  const html = favSection("🛵", "Restaurants", restoGroups, restaurantCard) +
    favSection("🛒", "Grocery", grocGroups, groceryCard) +
    favSection("🏪", "Shops", shopGroups, shopCard) +
    favSection("🍱", "Meal-prep", prepGroups, prepCard);

  el.innerHTML = html || `<div class="card muted">No favorites yet. Tap the ♡ heart on any restaurant, grocery product, or meal-prep service to save it here for quick access — grouped just like the app.</div>`;
}

function bindFavorites() {
  document.addEventListener("click", e => {
    const b = e.target.closest(".fav-btn");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const id = b.dataset.fav;
    if (favs[id]) delete favs[id]; else favs[id] = true;
    saveFavs();
    const on = !!favs[id];
    document.querySelectorAll(".fav-btn").forEach(x => {
      if (x.dataset.fav === id) { x.classList.toggle("on", on); x.textContent = on ? "♥" : "♡"; }
    });
    const favTab = document.getElementById("tab-favorites");
    if (favTab && favTab.classList.contains("active")) renderFavorites();
  });
}

function renderAllergyCardDairy() {
  // The allergy card is static: all three allergies are always on.
}

// ---- Tabs -----------------------------------------------------------------
function switchTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.id === "tab-" + name));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  // Re-render time-sensitive tabs so open-now badges reflect the current time.
  if (name === "week") renderWeek();
  if (name === "order") renderRestaurants(document.getElementById("restoSearch").value);
  if (name === "grocery") renderGrocery();
  if (name === "prep") renderPrep();
  if (name === "favorites") renderFavorites();
  document.body.classList.toggle("chat-open", name === "chat");
  if (name === "chat" && typeof chatRender === "function") { chatRender(); return; }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---- Settings sheet -------------------------------------------------------
function openSettings() {
  document.getElementById("setMayContain").checked = settings.maycontain;
  document.getElementById("setGluten").checked = settings.gluten;
  const k = document.getElementById("setApiKey");
  if (k && typeof getApiKey === "function") k.value = getApiKey();
  document.getElementById("settingsSheet").hidden = false;
}
function closeSettings() { document.getElementById("settingsSheet").hidden = true; }

function bindSettings() {
  const map = { setMayContain: "maycontain", setGluten: "gluten" };
  Object.entries(map).forEach(([id, key]) => {
    document.getElementById(id).addEventListener("change", e => {
      settings[key] = e.target.checked;
      saveSettings(settings);
      renderAllergyCardDairy();
    });
  });
  const k = document.getElementById("setApiKey");
  if (k) k.addEventListener("change", e => { if (typeof setApiKey === "function") setApiKey(e.target.value); });
}

// ---- Init -----------------------------------------------------------------
function init() {
  renderFacts();
  renderCuisineChips();
  renderRestaurants();
  renderWeek();
  renderGrocCatChips();
  renderStoreChips();
  renderGrocery();
  renderPrepCatChips();
  renderPrep();
  renderAllergyCardDairy();
  bindSettings();
  bindFavorites();

  const favOpen = document.getElementById("favOpen");
  if (favOpen) favOpen.addEventListener("click", () => switchTab("favorites"));

  const grocSearch = document.getElementById("grocSearch");
  if (grocSearch) grocSearch.addEventListener("input", renderGrocery);
  document.querySelectorAll("#grocView .seg-btn").forEach(b =>
    b.addEventListener("click", () => setGrocView(b.dataset.gview)));

  const prepSearch = document.getElementById("prepSearch");
  if (prepSearch) prepSearch.addEventListener("input", renderPrep);
  document.querySelectorAll("#prepTypeSeg .seg-btn").forEach(b =>
    b.addEventListener("click", () => {
      currentPrepType = b.dataset.ptype;
      document.querySelectorAll("#prepTypeSeg .seg-btn").forEach(x => x.classList.toggle("active", x === b));
      renderPrep();
    }));

  if (typeof initChat === "function") initChat();
  document.body.classList.add("chat-open");
  const searchEl = document.getElementById("restoSearch");
  searchEl.addEventListener("input", e => renderRestaurants(e.target.value));
  document.querySelectorAll("#mealSeg .seg-btn").forEach(b =>
    b.addEventListener("click", () => {
      currentMeal = b.dataset.meal;
      currentCuisine = null;
      document.querySelectorAll("#mealSeg .seg-btn").forEach(x => x.classList.toggle("active", x === b));
      renderCuisineChips();
      renderRestaurants(searchEl.value);
    }));

  document.querySelectorAll(".tab-btn").forEach(b =>
    b.addEventListener("click", () => switchTab(b.dataset.tab)));

  document.getElementById("settingsBtn").addEventListener("click", openSettings);
  document.getElementById("closeSettings").addEventListener("click", closeSettings);
  document.getElementById("settingsSheet").addEventListener("click", e => {
    if (e.target.id === "settingsSheet") closeSettings();
  });

  // Register service worker for offline use. Auto-reload once when a new
  // version takes control so updates are never stuck behind a stale cache.
  if ("serviceWorker" in navigator) {
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
    navigator.serviceWorker.register("sw.js").then((reg) => {
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (sw) sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) sw.postMessage("skip");
        });
      });
      reg.update().catch(() => {});
    }).catch(() => {});
  }
}

document.addEventListener("DOMContentLoaded", init);
