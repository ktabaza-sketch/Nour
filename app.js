/* Nour — app logic: ingredient checker + UI */

// ---- Settings (persisted per-device) --------------------------------------
// Nour has a dairy allergy, so dairy defaults to "avoid" (treated like mammal
// meat). The toggle remains so the strictness is visible and adjustable.
const DEFAULT_SETTINGS = { dairy: true, flavors: true, additives: true };

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem("nour.settings") || "{}") };
  } catch { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings(s) {
  try { localStorage.setItem("nour.settings", JSON.stringify(s)); } catch {}
}
let settings = loadSettings();

// ---- Checker engine -------------------------------------------------------
// Returns whether a personal-toggle rule is active for the current settings.
function personalActive(rule) {
  if (!rule.personal) return true;          // not gated by a toggle
  if (rule.personal === "dairy")     return settings.dairy;     // only flag if user avoids dairy
  if (rule.personal === "flavors")   return settings.flavors;
  if (rule.personal === "additives") return settings.additives;
  return true;
}

// Escape a term for use in a word-boundary-ish regex.
function esc(t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function analyze(text) {
  const hay = " " + text.toLowerCase().replace(/[\n\r]+/g, " ") + " ";
  const findings = [];
  const seen = new Set();

  for (const rule of RULES) {
    for (const term of rule.terms) {
      // match whole words/phrases: boundary that isn't a letter/number
      const re = new RegExp("(^|[^a-z0-9])" + esc(term) + "([^a-z0-9]|$)", "i");
      if (re.test(hay)) {
        const key = rule.category + "|" + term;
        if (seen.has(key)) continue;
        seen.add(key);

        // Personal toggle can either suppress (dairy off) or downgrade behavior.
        let severity = rule.severity;
        if (rule.personal === "dairy" && settings.dairy) severity = "avoid";
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
  avoid:   { icon: "⛔", title: "Avoid this", sub: "Contains an alpha-gal source. Don't order without a safe swap." },
  caution: { icon: "⚠️", title: "Check first", sub: "Might contain a mammal-derived ingredient. Verify before eating." },
  safe:    { icon: "✅", title: "Looks safe", sub: "No alpha-gal sources found — still read the full label." },
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
  if (!Array.isArray(today)) return { state: "unknown" };
  if (today.length === 0) return { state: "closed", label: "Closed today" };

  for (const [o, c] of today) {
    const om = toMin(o), cm = toMin(c);
    const isOpen = cm > om ? (M >= om && M < cm) : (M >= om); // cm<=om => spans midnight
    if (isOpen) {
      const closeAbs = cm > om ? cm : cm + 1440;
      const closesSoon = (closeAbs - M) <= 45;
      return { state: "open", label: closesSoon ? "Closes soon" : "Open now", until: c, closesSoon };
    }
  }
  const next = today.map(x => x[0]).filter(o => toMin(o) > M).sort((a, b) => toMin(a) - toMin(b))[0];
  if (next) return { state: "closed", label: "Opens " + fmtTime(next) };
  return { state: "closed", label: "Closed now" };
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
  document.getElementById("factsList").innerHTML =
    FACTS.map(f => `<li>${escapeHtml(f)}</li>`).join("");
}

let currentMeal = "breakfast";

const MEAL_LABEL = {
  breakfast: "Breakfast & brunch",
  lightLunch: "Light lunch",
  dinner: "Late lunch & dinner",
};

function restaurantMatches(r, q) {
  if (!q) return true;
  if (r.name.toLowerCase().includes(q) || (r.area || "").toLowerCase().includes(q)) return true;
  return (r.safeDishes || []).some(d =>
    d.dish.toLowerCase().includes(q) || (d.note || "").toLowerCase().includes(q));
}

// Build a DoorDash search link from name + city. We generate this rather than
// store fixed store IDs, because a stale store ID 404s — a name search always
// lands on the right restaurant once she's signed in with a delivery address.
function ddSearchUrl(r) {
  const city = (r.area || "").split(/[(\/,]/)[0].trim();
  const query = (r.name + " " + city).trim();
  return "https://www.doordash.com/search/store/" + encodeURIComponent(query);
}

function ddButton(r) {
  return `<a class="dd-btn" href="${ddSearchUrl(r)}" target="_blank" rel="noopener noreferrer">🛵 Order on DoorDash</a>`;
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

function formatCount(n) {
  return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n);
}

function restaurantCard(r) {
  const area = r.area ? `<span class="area-tag">${escapeHtml(r.area)}</span>` : "";
  const dishes = (r.safeDishes || []).map(dishItem).join("");
  const watch = r.watchOut
    ? `<p class="watch"><b>Skip:</b> ${escapeHtml(r.watchOut)}</p>` : "";
  return `
    <div class="resto">
      <div class="resto-head">
        <h3>${escapeHtml(r.name)}</h3>
        ${area}
      </div>
      <div class="resto-rating">${ratingBadge(r)}${openBadge(r)}</div>
      <ul class="dishes">${dishes}</ul>
      ${watch}
      ${ddButton(r)}
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
  const cats = ((ORDER_MENU && ORDER_MENU[currentMeal]) || []).map(c => c.category);
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
  const categories = ((ORDER_MENU && ORDER_MENU[currentMeal]) || [])
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
    el.innerHTML = `<div class="card muted">No matches here. Try another cuisine, meal tab, or a term like "chicken" or "poke".</div>`;
    return;
  }
  el.innerHTML = html;
}

// ---- Week planner --------------------------------------------------------
let selectedDayIdx = null;
function todayPlanIdx() { return (new Date().getDay() + 6) % 7; } // Mon=0 … Sun=6

function pickCard(p) {
  return `
    <div class="pick">
      <div class="pick-meal">${escapeHtml(p.meal)}</div>
      <div class="pick-body">
        <div class="pick-dish">${escapeHtml(p.dish)}</div>
        ${p.note ? `<div class="pick-note">${escapeHtml(p.note)}</div>` : ""}
        <div class="pick-resto">${escapeHtml(p.name)} <span class="area-tag">${escapeHtml(p.area)}</span></div>
        <div class="pick-status">${openBadge(p)}</div>
        <a class="dd-btn sm" href="${ddSearchUrl(p)}" target="_blank" rel="noopener noreferrer">🛵 Order on DoorDash</a>
      </div>
    </div>`;
}

function renderWeek() {
  const chipsEl = document.getElementById("dayChips");
  const planEl = document.getElementById("dayPlan");
  if (!chipsEl || !planEl) return;
  if (selectedDayIdx == null) selectedDayIdx = todayPlanIdx();

  chipsEl.innerHTML = DAY_PLANS.map((p, i) =>
    `<button class="day-chip${i === selectedDayIdx ? " active" : ""}${i === todayPlanIdx() ? " is-today" : ""}" data-i="${i}">${escapeHtml(p.day.slice(0, 3))}</button>`
  ).join("");
  chipsEl.querySelectorAll(".day-chip").forEach(b =>
    b.addEventListener("click", () => { selectedDayIdx = +b.dataset.i; renderWeek(); }));

  const plan = DAY_PLANS[selectedDayIdx];
  const isToday = selectedDayIdx === todayPlanIdx();
  planEl.innerHTML = `
    <div class="day-head">
      <div class="day-title">${plan.emoji} ${escapeHtml(plan.day)}${isToday ? ' <span class="today-tag">Today</span>' : ""}</div>
      <div class="day-theme">${escapeHtml(plan.theme)}</div>
    </div>
    ${plan.picks.map(pickCard).join("")}`;
}

function renderGrocery() {
  document.getElementById("grocProteins").innerHTML =
    GROCERY.proteins.map(p => `<li>${escapeHtml(p)}</li>`).join("");
  document.getElementById("grocSwaps").innerHTML =
    GROCERY.swaps.map(s => `<li><span class="from">${escapeHtml(s.instead)}</span><span class="arrow">→</span><span class="to">${escapeHtml(s.use)}</span></li>`).join("");
  document.getElementById("grocLabels").innerHTML =
    GROCERY.labelCheck.map(l => `<li>${escapeHtml(l)}</li>`).join("");
}

function renderAllergyCardDairy() {
  document.getElementById("acDairy").textContent =
    settings.dairy ? " · dairy (milk, cheese, butter, whey)" : "";
}

// ---- Tabs -----------------------------------------------------------------
function switchTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.id === "tab-" + name));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  // Re-render time-sensitive tabs so open-now badges reflect the current time.
  if (name === "week") renderWeek();
  if (name === "order") renderRestaurants(document.getElementById("restoSearch").value);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---- Settings sheet -------------------------------------------------------
function openSettings() {
  document.getElementById("setDairy").checked = settings.dairy;
  document.getElementById("setFlavors").checked = settings.flavors;
  document.getElementById("setAdditives").checked = settings.additives;
  document.getElementById("settingsSheet").hidden = false;
}
function closeSettings() { document.getElementById("settingsSheet").hidden = true; }

function bindSettings() {
  const map = { setDairy: "dairy", setFlavors: "flavors", setAdditives: "additives" };
  Object.entries(map).forEach(([id, key]) => {
    document.getElementById(id).addEventListener("change", e => {
      settings[key] = e.target.checked;
      saveSettings(settings);
      renderAllergyCardDairy();
    });
  });
}

// ---- Init -----------------------------------------------------------------
function init() {
  renderFacts();
  renderCuisineChips();
  renderRestaurants();
  renderWeek();
  renderGrocery();
  renderAllergyCardDairy();
  bindSettings();

  document.getElementById("checkBtn").addEventListener("click", () => {
    const text = document.getElementById("checkInput").value;
    if (!text.trim()) { document.getElementById("verdict").hidden = true; return; }
    renderVerdict(analyze(text));
  });
  document.getElementById("clearBtn").addEventListener("click", () => {
    document.getElementById("checkInput").value = "";
    document.getElementById("verdict").hidden = true;
    document.getElementById("checkInput").focus();
  });
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

  // Register service worker for offline use
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

document.addEventListener("DOMContentLoaded", init);
