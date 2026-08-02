# Nour — Alpha-gal Syndrome (AGS) Safe-Food Helper

A small, mobile-first, installable web app that helps someone with **Alpha-gal
Syndrome** decide what's safe to eat — whether ordering on DoorDash, shopping at
Whole Foods, or reading an ingredient label.

Built for a Stanford student with AGS. Works offline once installed.

> ⚠️ **This is a helper, not medical advice.** Always read full labels, ask
> restaurants directly, and carry your prescribed epinephrine. When in doubt,
> don't eat it.

## What it does

- **🔍 Check** — Paste a menu description or ingredient list. The app scans for
  alpha-gal sources and returns a clear **Avoid / Check first / Looks safe**
  verdict, listing every flagged word and *why*.
- **🛵 Order** — Curated safe orders (and the traps to avoid) at chains common
  around Stanford & Palo Alto: Chipotle, Sweetgreen, CAVA, poke, sushi, Thai,
  Panda Express, Chick-fil-A, Indian, pho, and more. Searchable.
- **🛒 Grocery** — Whole Foods safe protein staples, smart swaps
  (gelatin → agar, lard → oil, dairy milk → oat), and a hidden-ingredient label
  cheat-sheet.
- **🆘 Card** — A show-to-staff allergy card and a what-to-do-in-a-reaction
  checklist.
- **⚙️ Personalize** — AGS sensitivity varies. Toggle whether to flag dairy,
  "natural flavors," and ambiguous additives. Saved on-device.

## The science it encodes

Alpha-gal (galactose-α-1,3-galactose) is a sugar in **all non-primate mammals**.

- **Avoid:** beef, pork, lamb, goat, venison, bison, rabbit and other mammal
  meat; gelatin; lard/tallow; beef/pork/bone broth; collagen.
- **Often hidden:** gelatin (marshmallows, gummies, pill capsules), broth,
  mono-/di-glycerides, magnesium stearate, glycerin, "natural flavors."
- **Personal:** dairy and other mammal byproducts — many tolerate them, some
  don't.
- **Safe:** poultry, fish, shellfish, eggs, and all plant foods.

Reactions are often **delayed 2–6 hours** and can be severe.

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
| `index.html` | App shell and all four tabs |
| `styles.css` | Mobile-first styling |
| `app.js` | Checker engine + UI logic |
| `data.js` | AGS rules, restaurant picks, grocery guide (edit here) |
| `manifest.webmanifest`, `sw.js` | PWA install + offline support |
| `icons/` | App icons |

## Customizing for her

- Open **Settings (⚙️)** in the app to match her personal sensitivities.
- To add a favorite restaurant or a food the checker missed, edit the arrays in
  `data.js` (they're commented). Bump `CACHE = "nour-v1"` in `sw.js` to `v2`
  after changes so installed copies refresh.
