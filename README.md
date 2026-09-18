# Nour — Safe-Food Helper (no red meat · no dairy · no wheat)

A small, mobile-first, installable web app that helps someone allergic to
**red meat, milk products and wheat** decide what's safe to eat — whether
ordering delivery, shopping at Whole Foods / Amazon Fresh, or reading an
ingredient label.

Built for a Stanford student. Works offline once installed.

> ⚠️ **This is a helper, not medical advice.** Always read full labels, ask
> restaurants directly, and carry your prescribed epinephrine. When in doubt,
> don't eat it.

## What it does

- **🐱 Personal Butler** — The first tab is a chat companion: a warm, attentive
  cat butler that talks Nour through every meal. It knows the time, Nour's class schedule and where she lives (EVGR A), so it
  opens with the right question ("BIOE 44 Lab starts in 6 min — order for
  after?"), offers three safe spots at a time, writes out exactly what to order
  and what to put in the allergy note, and stays with her until she taps
  **I ordered** and **It arrived** (with a box-check list). Any dish or
  ingredient list typed into the chat is scanned for red meat, dairy and
  wheat (including hidden forms like gelatin, whey and soy sauce) and answered
  with a clear **Avoid / Check first / Looks safe** verdict. "Plan my day"
  shows the day's eating tasks timed around classes. Works offline with quick
  replies; an optional Claude API key in Settings makes free-typed messages
  fully conversational (the key stays on the device and calls go straight to
  Anthropic).
- **🛵 Order** — Restaurants that deliver to Stanford on DoorDash, Uber Eats
  and Grubhub, ranked by rating, grouped by cuisine, with the exact dishes and
  modifications ("corn tortillas", "tamari, not soy sauce", "no bun") that are
  free of all three allergens. Shows whether each spot is open right now. Each
  card links the restaurant's own website and, where one is published, its
  allergen chart / dietary menu, with a one-line note on what that list
  confirms or contradicts (`website`, `allergenUrl`, `allergenKind`,
  `allergenCheck`, `allergenDate` in `data.js`). Spots with no published list
  are marked so Nour knows to say "allergy" when ordering. An **On campus ·
  Cardinal Dollars** category lists Stanford eateries (`campus: true`, with
  `where`, `nearest`, `channel`) that order through Stanford's own app
  (`CAMPUS` in `data.js`); the Butler ranks them higher when she is in or
  about to be in class.
- **📅 Week** — A different two-course plan for every day, rotating weekly and
  tuned to the Palo Alto season, with daily nutrition targets for an 18-year-old
  and a note explaining how it was built. Each day starts with a timing block
  built from Nour's class schedule (`SCHEDULE` in `data.js`): when to eat
  breakfast before the first class, when to order so lunch lands at EVGR A as
  she gets in, when to pack a snack for a back-to-back lab afternoon, and when
  dinner realistically happens.
- **🛒 Grocery** — Specific products (direct links) on Whole Foods, Amazon,
  Amazon Fresh, Walmart, Costco, Target, Sprouts, Thrive Market and dozens of
  bakeries, specialty grocers and online shops — verified free of red meat,
  dairy and wheat, organised into store aisles, tagged for nutrients, with a
  rotating weekly basket (with a one-tap **Copy list** and store shortcuts),
  a **Cut your delivery fees** card of student subscription plans (`PERKS`),
  and a **Where to shop** directory of every retailer that delivers to Palo
  Alto or ships — supermarkets, small local grocers on Instacart and
  DoorDash, halal / Persian / Turkish / Indian / Latin markets, dedicated
  gluten-free bakeries, farm boxes, fish & butcher shops, Middle Eastern
  online grocers and brand stores.
- **🍱 Prep** — Meal-prep and meal-kit services that can reliably deliver
  wheat-free, dairy-free, non-red-meat meals, with setup tips.
- **⭐ Favorites** — Heart any restaurant, product or service; the favorites
  view groups them the same way the app does.
- **🆘 Card** — A show-to-staff allergy card and a what-to-do-in-a-reaction
  checklist.
- **⚙️ Personalize** — The three allergies are always on. Optional strictness:
  flag "may contain" cross-contact warnings, and treat barley/rye/uncertified
  oats as unsafe (full gluten-free). Saved on-device.

## The rules it encodes

- **Red meat:** beef, pork, lamb, goat, veal, venison, bison — and anything
  made from them: beef/pork/bone broth, lard, tallow, gelatin, collagen.
- **Milk:** all dairy — milk, cream, butter, ghee, cheese, yogurt, whey,
  casein, lactose, milk solids.
- **Wheat:** wheat flour in every form — bread, pasta, wraps, flour tortillas,
  couscous, farro, bulgur, seitan, breading, batter, croutons, most noodles —
  and hidden wheat in soy sauce, teriyaki, hoisin, ponzu, many marinades.
- **Safe base:** poultry, fish, shellfish, eggs, rice, corn, quinoa, potatoes,
  fruit, vegetables, beans, nuts; "gluten-free" + "dairy-free" labels together.

Rules live in [`data.js`](./data.js) — each with a plain-language reason. Add or
adjust foods there and the checker and guides update automatically.

## Run it

It's a static app with no build step.

```bash
# from the project folder
python3 -m http.server 8000
# then open http://localhost:8000 on your phone or computer
```

**Install on a phone:** open the served URL in Safari/Chrome → *Share* → *Add to
Home Screen*. It then runs full-screen and works offline (service worker caches
everything).

**Host it free:** push to GitHub and enable **GitHub Pages** (Settings → Pages →
deploy from branch). The app will be live at a shareable URL — no server needed.

## Files

| File | Purpose |
|------|---------|
| `index.html` | App shell and all tabs |
| `styles.css` | Mobile-first styling |
| `app.js` | Checker engine + UI logic |
| `data.js` | Allergen rules, restaurant picks, grocery catalog, prep services (edit here) |
| `manifest.webmanifest`, `sw.js` | PWA install + offline support |
| `icons/` | App icons |

## Customizing

- Open **Settings (⚙️)** in the app to adjust strictness.
- To add a restaurant or product, edit the arrays in `data.js` (they're
  commented). Bump `CACHE` in `sw.js` after changes so installed copies refresh.
