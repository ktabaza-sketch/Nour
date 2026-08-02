/* Nour — app logic: ingredient checker + UI */

// ---- Settings (persisted per-device) --------------------------------------
const DEFAULT_SETTINGS = { dairy: false, flavors: true, additives: true };

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

function renderRestaurants(filter = "") {
  const q = filter.trim().toLowerCase();
  const list = RESTAURANTS.filter(r =>
    !q || r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q) || r.order.toLowerCase().includes(q)
  );
  const el = document.getElementById("restoList");
  if (!list.length) {
    el.innerHTML = `<div class="card muted">No matches. Try a cuisine like "Thai" or "poke".</div>`;
    return;
  }
  el.innerHTML = list.map(r => `
    <div class="resto">
      <div class="resto-head">
        <h3>${escapeHtml(r.name)}</h3>
        <span class="cuisine">${escapeHtml(r.cuisine)}</span>
      </div>
      <p class="order"><b>Safe order:</b> ${escapeHtml(r.order)}</p>
      <p class="watch"><b>Watch out:</b> ${escapeHtml(r.watch)}</p>
    </div>`).join("");
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
  document.getElementById("restoSearch").addEventListener("input", e => renderRestaurants(e.target.value));

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
