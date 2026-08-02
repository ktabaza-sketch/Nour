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
      ${ratingBadge(r) ? `<div class="resto-rating">${ratingBadge(r)}</div>` : ""}
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

function renderRestaurants(filter = "") {
  const q = filter.trim().toLowerCase();
  const el = document.getElementById("restoList");
  const meta = document.getElementById("restoMeta");
  const categories = (ORDER_MENU && ORDER_MENU[currentMeal]) || [];

  let count = 0;
  const html = categories.map(cat => {
    const restos = cat.restaurants.filter(r => restaurantMatches(r, q)).sort(byRating);
    count += restos.length;
    if (!restos.length) return "";
    return `<div class="cat-head">${escapeHtml(cat.category)}</div>` +
      restos.map(restaurantCard).join("");
  }).join("");

  meta.textContent = `${MEAL_LABEL[currentMeal]} · ${count} spot${count === 1 ? "" : "s"} that deliver to the Stanford area`;

  if (!count) {
    el.innerHTML = `<div class="card muted">No matches here. Try another meal tab or a term like "chicken" or "poke".</div>`;
    return;
  }
  el.innerHTML = html;
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
  renderRestaurants();
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
      document.querySelectorAll("#mealSeg .seg-btn").forEach(x => x.classList.toggle("active", x === b));
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
