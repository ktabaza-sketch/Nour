/*
 * Nour — safe-food knowledge base
 *
 * Nour is allergic to three things:
 *   1. RED MEAT — beef, pork, lamb, goat, veal, venison, bison, and anything
 *      made from them (broth/stock, lard/tallow, gelatin, collagen).
 *   2. MILK     — all dairy: milk, cream, butter, ghee, cheese, yogurt, whey, casein.
 *   3. WHEAT    — wheat flour in any form: bread, pasta, wraps, batters, wheat
 *      noodles, and hidden wheat such as regular soy sauce and teriyaki.
 * Poultry, fish, shellfish, eggs, rice, corn, quinoa, potatoes, fruit, veg,
 * beans, nuts and gluten-free-labelled foods are the safe base.
 *
 * This file is the single source of truth for the ingredient checker and the
 * curated guides. Every rule carries a plain-language reason so the user can
 * make her own informed decision. This is a helper, NOT medical advice.
 *
 * Severity levels:
 *   avoid   -> contains one of the three allergens (or is reliably made from one)
 *   caution -> often contains one; depends on the recipe — verify first
 *   safe    -> reassuring markers (still read the whole label)
 */

// ---------------------------------------------------------------------------
// RULE TABLE
// Each rule: match terms (lowercase), category, base severity, reason.
// "personal" ties the rule to a user toggle so sensitivity can be personalized.
// ---------------------------------------------------------------------------

const RULES = [
  // ======================= 1. RED MEAT: always AVOID =======================
  { terms: ["beef", "steak", "sirloin", "brisket", "ribeye", "filet mignon", "ground beef", "hamburger", "burger patty", "cheeseburger", "meatball", "meatloaf", "corned beef", "pastrami", "roast beef", "short rib", "carne asada", "asada"], category: "Red meat (beef)", severity: "avoid", reason: "Beef is red meat — one of Nour's allergens." },
  { terms: ["pork", "bacon", "ham", "prosciutto", "pancetta", "sausage", "chorizo", "salami", "pepperoni", "pulled pork", "carnitas", "al pastor", "spam", "hot dog", "bratwurst", "capicola", "mortadella", "char siu", "pork belly"], category: "Red meat (pork)", severity: "avoid", reason: "Pork and cured pork products count as red meat — avoid. (Chicken or turkey sausage/bacon is fine if it says so.)" },
  { terms: ["lamb", "mutton", "goat", "veal", "venison", "deer", "bison", "buffalo", "elk", "rabbit", "boar", "kangaroo", "barbacoa", "gyro", "gyros", "birria"], category: "Red meat (other)", severity: "avoid", reason: "Lamb, goat, veal, game — and beef/lamb dishes like barbacoa, birria or gyro — are red meat." },
  { terms: ["shawarma", "doner", "döner", "kebab", "kofta", "kebob", "meat sauce", "bolognese", "ragu", "ragù", "adobo"], category: "Likely-red-meat dish", severity: "caution", reason: "Often made from beef/lamb/pork. Ask what meat is used — chicken versions are usually fine (still check dairy & wheat)." },
  { terms: ["oxtail", "tripe", "liver", "kidney", "sweetbread", "beef tongue", "marrow", "bone marrow"], category: "Red-meat organ", severity: "avoid", reason: "Organ meat from cattle/pigs/lamb is red meat." },
  { terms: ["gelatin", "gelatine", "jell-o", "jello", "marshmallow", "gummy", "gummies"], category: "Gelatin (from pork/beef)", severity: "avoid", reason: "Gelatin is made from pig and cow skin/bones — hidden in gummies, marshmallows, capsules and some yogurts. Pectin or agar versions are fine." },
  { terms: ["lard", "tallow", "suet", "beef fat", "pork fat", "beef tallow", "manteca"], category: "Red-meat fat", severity: "avoid", reason: "Rendered beef/pork fat — used for frying and in refried beans, pastry, some tortillas." },
  { terms: ["beef broth", "beef stock", "pork broth", "bone broth", "beef bouillon", "pork bouillon", "beef base", "demi-glace", "beef consomme", "beef gravy", "pork gravy", "tonkotsu"], category: "Red-meat broth", severity: "avoid", reason: "Broth or stock made from beef/pork bones. Chicken or vegetable broth is fine." },
  { terms: ["collagen", "hydrolyzed collagen", "bovine collagen", "porcine"], category: "Collagen (bovine/porcine)", severity: "avoid", reason: "Collagen is made from cow or pig hide and bones — appears in drinks, bars and supplements." },

  // ========================= 2. MILK: always AVOID =========================
  { terms: ["milk", "whole milk", "cream", "heavy cream", "half and half", "butter", "buttermilk", "cheese", "cheddar", "mozzarella", "parmesan", "feta", "cotija", "paneer", "ricotta", "burrata", "brie", "halloumi", "mascarpone", "cream cheese", "yogurt", "yoghurt", "raita", "kefir", "ghee", "ice cream", "custard", "queso", "sour cream", "crema", "creme fraiche", "condensed milk", "evaporated milk", "gelato", "labneh", "tzatziki", "alfredo", "bechamel", "béchamel", "au gratin", "milk chocolate", "white chocolate", "dulce de leche"], category: "Dairy", severity: "avoid", reason: "A milk product — Nour is allergic to all dairy (butter, ghee, cheese, cream and yogurt all count). Ask for no butter on the grill." },
  { terms: ["whey", "casein", "caseinate", "lactose", "milk solids", "milk powder", "milkfat", "milk fat", "curds", "lactalbumin"], category: "Dairy derivative", severity: "avoid", reason: "A milk-derived ingredient — hides in bars, breads, chips and 'creamy' sauces." },
  { terms: ["rennet", "animal rennet"], category: "Rennet", severity: "avoid", reason: "Rennet means cheese — dairy." },
  { terms: ["creamy", "cream sauce", "ranch", "caesar", "tikka masala", "butter chicken", "korma", "makhani", "tandoori", "tikka", "clam chowder", "bisque", "mac and cheese", "pesto", "aioli"], category: "Usually contains dairy", severity: "caution", reason: "Usually made with cream, butter, cheese or yogurt (tandoori/tikka are yogurt-marinated; aioli is often mayo-based and fine). Ask, or choose a coconut/tomato/olive-oil version." },

  // ========================= 3. WHEAT: always AVOID ========================
  { terms: ["wheat", "whole wheat", "wheat flour", "enriched flour", "all-purpose flour", "all purpose flour", "bread flour", "durum", "semolina", "spelt", "kamut", "einkorn", "emmer", "farro", "bulgur", "couscous", "seitan", "wheat gluten", "vital wheat gluten", "wheat starch", "wheat germ", "wheat bran", "graham", "farina", "triticale", "hydrolyzed wheat protein", "cracked wheat", "freekeh", "tabbouleh"], category: "Wheat", severity: "avoid", reason: "Wheat in one of its many names (spelt, kamut, durum, farro, bulgur, couscous and seitan are all wheat)." },
  { terms: ["bread", "toast", "bun", "buns", "bread roll", "dinner roll", "kaiser roll", "bagel", "croissant", "pastry", "pastries", "muffin", "english muffin", "biscuit", "scone", "donut", "doughnut", "pancake", "pancakes", "waffle", "waffles", "french toast", "crepe", "crêpe", "pita", "naan", "roti", "chapati", "paratha", "lavash", "focaccia", "ciabatta", "baguette", "sourdough", "brioche", "flour tortilla", "flour tortillas", "pie crust", "phyllo", "filo", "strudel", "baklava", "samosa", "empanada", "corn dog", "pretzel", "pretzels", "cracker", "crackers", "crouton", "croutons", "breadcrumbs", "bread crumbs", "panko", "cake", "cupcake", "cookie", "cookies", "brownie", "churro", "cannoli", "tiramisu", "graham cracker"], category: "Wheat (bread & baked)", severity: "avoid", reason: "Made from wheat flour. Only OK if it's specifically labelled gluten-free (and check dairy/egg in GF baked goods)." },
  { terms: ["pasta", "spaghetti", "penne", "fettuccine", "linguine", "lasagna", "ravioli", "gnocchi", "orzo", "macaroni", "ramen", "udon", "somen", "lo mein", "chow mein", "egg noodles", "wonton", "wontons", "dumpling", "dumplings", "gyoza", "potsticker", "pot sticker", "potstickers", "bao", "egg roll", "egg rolls"], category: "Wheat (pasta, noodles & wrappers)", severity: "avoid", reason: "Wheat pasta, wheat noodles or wheat wrappers. Rice noodles, glass noodles, rice-paper rolls and gluten-free pasta are the swaps." },
  { terms: ["breaded", "batter", "battered", "beer batter", "tempura", "katsu", "schnitzel", "fried chicken", "chicken tenders", "chicken nuggets", "nuggets", "fish and chips", "fish & chips", "onion rings", "fried calamari", "fritter", "fritters", "roux", "cream of"], category: "Wheat (breading & batter)", severity: "avoid", reason: "Breading, batter and roux are wheat flour (and 'cream of' soups add dairy). Choose grilled, steamed or roasted." },
  { terms: ["soy sauce", "shoyu", "teriyaki", "hoisin", "ponzu", "unagi sauce", "eel sauce", "yakitori sauce", "sukiyaki", "yakisoba", "seitan"], category: "Hidden wheat (soy-sauce based)", severity: "avoid", reason: "Regular soy sauce is brewed with wheat, so teriyaki, ponzu, hoisin, eel sauce and most poke/stir-fry sauces contain wheat. Ask for tamari (wheat-free) or coconut aminos." },
  { terms: ["flour", "tortilla", "tortillas", "wrap", "wraps", "burrito", "quesadilla", "noodle", "noodles", "soba", "pizza", "granola", "oyster sauce", "gochujang", "miso", "worcestershire", "gravy", "stir-fry sauce", "stir fry sauce", "marinade", "marinated", "crispy", "karaage", "falafel", "veggie burger", "imitation crab", "krab", "surimi", "malt", "malt vinegar", "malt extract", "malted", "couscous salad"], category: "Often contains wheat", severity: "caution", reason: "Could go either way: 'flour' means wheat unless it says rice/almond/corn/chickpea; tortillas & wraps must be corn (or lettuce), not flour; a burrito BOWL is fine; noodles must be rice or glass; pizza only with a gluten-free crust; granola/oats need a gluten-free label; oyster sauce, gochujang, miso, gravies, marinades and 'crispy' coatings often hide wheat; falafel & veggie burgers often use flour binder; imitation crab has wheat; malt is barley. Ask or check the label." },

  // =============== Cross-contact warnings (personal: maycontain) ===============
  { terms: ["may contain", "may contain wheat", "may contain milk", "processed in a facility", "manufactured in a facility", "made in a facility", "shared equipment", "manufactured on equipment", "produced on shared", "shared fryer"], category: "Cross-contact warning", severity: "caution", personal: "maycontain", reason: "The maker warns of possible traces of an allergen from shared lines or fryers. Fine for many people, risky for some — your call, based on how sensitive you are." },

  // ============ Strict gluten-free (personal: gluten — off by default) ============
  { terms: ["barley", "rye", "oats", "oat", "oatmeal", "rolled oats", "steel cut oats", "brewer's yeast", "beer"], category: "Gluten (not wheat)", severity: "caution", personal: "gluten", reason: "Barley, rye and (uncertified) oats contain or pick up gluten. They are NOT wheat, so they're only flagged because you turned on strict gluten-free. Certified gluten-free oats are fine." },

  // ============================ Reassuring SAFE markers ============================
  { terms: ["chicken", "turkey", "duck", "cornish hen", "poultry", "chicken breast", "grilled chicken", "rotisserie chicken", "roasted turkey", "turkey bacon", "chicken sausage"], category: "Poultry", severity: "safe", reason: "Poultry is not red meat — safe (just check it isn't breaded, marinated in soy sauce, or cooked in butter)." },
  { terms: ["fish", "salmon", "tuna", "cod", "halibut", "tilapia", "trout", "mahi", "snapper", "sardine", "anchovy", "mackerel", "sea bass", "branzino", "sashimi", "nigiri", "ceviche"], category: "Fish", severity: "safe", reason: "Fish is safe — grilled, baked, raw or steamed (not battered; tamari instead of soy sauce)." },
  { terms: ["shrimp", "prawn", "crab", "lobster", "scallop", "clam", "mussel", "oyster", "squid", "calamari", "octopus", "crawfish", "poke"], category: "Shellfish / seafood", severity: "safe", reason: "Shellfish and seafood are safe (unless you have a separate shellfish allergy). Skip breaded/fried versions and soy-sauce marinades." },
  { terms: ["egg", "eggs", "omelet", "omelette", "tofu", "tempeh", "edamame", "beans", "black beans", "chickpea", "garbanzo", "lentil", "lentils", "hummus", "nuts", "almond", "peanut", "cashew", "avocado", "olive oil"], category: "Egg / plant protein", severity: "safe", reason: "Eggs, tofu, beans, lentils, hummus and nuts contain none of the three allergens — safe staples (plain, not breaded or in a soy-sauce marinade)." },
  { terms: ["rice", "brown rice", "jasmine rice", "basmati", "quinoa", "corn tortilla", "corn tortillas", "rice noodles", "rice noodle", "vermicelli", "glass noodles", "rice paper", "rice cake", "rice cakes", "buckwheat", "millet", "polenta", "grits", "potato", "potatoes", "sweet potato", "cassava", "plantain", "arepa", "lettuce wrap", "lettuce wraps", "almond flour", "rice flour", "chickpea flour", "corn flour", "cornmeal", "tapioca", "gluten-free oats", "certified gluten-free oats"], category: "Wheat-free grain / starch", severity: "safe", reason: "Naturally wheat-free carb — rice, corn, quinoa, potatoes, buckwheat and rice noodles are the everyday swaps." },
  { terms: ["tamari", "gluten-free soy sauce", "gluten free soy sauce", "coconut aminos", "fish sauce"], category: "Wheat-free sauce", severity: "safe", reason: "Tamari and coconut aminos are the wheat-free stand-ins for soy sauce (most tamari is wheat-free — glance at the label). Fish sauce is anchovy-based." },
  { terms: ["gluten-free", "gluten free", "certified gluten-free", "wheat-free", "wheat free"], category: "Wheat-free label", severity: "safe", reason: "Labelled gluten-free = no wheat. It says nothing about dairy or meat — check those separately." },
  { terms: ["gluten-free bread", "gluten free bread", "gluten-free bun", "gluten-free crust", "gluten-free pizza", "gluten-free pasta", "gluten free pasta", "gluten-free noodles", "gluten-free tortilla", "gluten-free wrap", "gluten-free toast", "gluten-free bagel", "gluten-free pancakes", "gluten-free waffles", "gluten-free granola", "gluten-free flour", "gluten-free crackers", "gluten-free cookies", "gluten-free cake", "gluten-free muffin", "gluten-free tamari", "gluten-free teriyaki", "gf bread", "gf crust", "gf pasta", "gf bun", "gf toast", "gf granola"], category: "Gluten-free version", severity: "safe", reason: "The gluten-free version of a normally-wheat item — fine for wheat. Still check it for dairy and egg (GF baked goods often use milk or butter)." },
  { terms: ["dairy-free", "dairy free", "non-dairy", "oat milk", "almond milk", "soy milk", "coconut milk", "cashew milk", "pea milk", "vegan cheese", "vegan butter", "dairy-free cheese", "dairy free cheese", "non-dairy cheese", "plant-based cheese", "cashew cheese", "dairy-free butter", "vegan butter", "dairy-free yogurt", "coconut yogurt", "almond yogurt", "dairy-free ice cream", "non-dairy ice cream", "sorbet", "coconut cream", "cashew cream", "vegan mayo"], category: "Dairy-free label", severity: "safe", reason: "No milk products. It says nothing about wheat — check that separately (and oat milk is fine unless you're strict gluten-free)." },
  { terms: ["vegan", "plant-based", "plant based", "vegetarian"], category: "Vegan / vegetarian claim", severity: "safe", reason: "Vegan covers red meat, gelatin and dairy — but NOT wheat (bread, pasta and seitan are vegan). Vegetarian may still contain dairy. Look for gluten-free too." },
];

// ---------------------------------------------------------------------------
// CURATED DOORDASH-STYLE SAFE ORDERS (chains common around Stanford / Palo Alto)
// "order" = a genuinely safe build. "watch" = the trap to avoid at that spot.
// ---------------------------------------------------------------------------

// Structure: meal type -> categories -> restaurants (ranked by rating in the UI)
// -> safe dishes free of red meat, dairy AND wheat (with the exact modification
// to ask for). Ordering links are generated in code from the restaurant name +
// city (a name search always resolves to the store). Ratings are point-in-time
// from Google/Yelp/DoorDash (source shown on each card) and are approximate —
// menus change; confirm "no dairy, no wheat/soy sauce, no red meat" when ordering.
const ORDER_MENU = {
  breakfast: [
    {
      category: "Cafés & bakeries",
      restaurants: [
        { name: "Bluestone Lane", area: "Los Altos", rating: 4.1, reviews: 940, ratingSrc: "Google", platforms: ["Uber Eats","DoorDash"],
          safeDishes: [
            { dish: "Avocado smash on gluten-free bread, add poached egg", note: "GF bread (offered on all toasts), no feta, no butter; shared toaster" },
            { dish: "Coconut chia pudding", note: "coconut base; granola is house GF — or skip it; no yogurt" },
            { dish: "Breakfast Bowl (kale, tomato, quinoa, avocado, poached egg)", note: "no feta; quinoa is wheat-free" },
            { dish: "Warm chicken & grains bowl", note: "no feta; grains vary — only if quinoa/lentils, NOT farro (wheat)" },
          ],
          watchOut: "toasts are sourdough + butter unless you say GF bread/dry; feta or ricotta on most plates; the grain bowl sometimes uses farro (wheat); banana bread & pastries are wheat+butter; oat/almond milk for coffee" },
        { name: "Crepevine", area: "Palo Alto", rating: 4.3, reviews: 1500, ratingSrc: "Google", platforms: ["Uber Eats","DoorDash","Grubhub"],
          safeDishes: [
            { dish: "Tofu scramble with house potatoes", note: "no cheese, NO toast (sub fruit); potatoes in oil not butter" },
            { dish: "Mixed-greens salad with grilled chicken or grilled salmon, balsamic", note: "no cheese; confirm caramelized walnuts dairy-free; no bread" },
            { dish: "Ginger-curry chicken salad, lemongrass vinaigrette", note: "confirm marinade has no soy sauce; no croutons" },
            { dish: "Fresh fruit bowl", note: "plain, no yogurt" },
          ],
          watchOut: "crepes, pancakes, waffles & French toast are wheat batter + dairy (GF crepes exist but fillings are cheese); every scramble comes with toast/English muffin — refuse it; rice-noodle 'asian' salad dressing and tofu peanut sauce likely contain soy sauce; bacon/sausage are pork" },
        { name: "The Farm", area: "Palo Alto", rating: 4.5, reviews: 193, ratingSrc: "Google",
          safeDishes: [
            { dish: "Avocado toast on gluten-free toast", note: "they stock GF toast; no butter, no cheese" },
            { dish: "Veggie omelette (pepper, onion, tomato, spinach) with roasted potatoes", note: "no cheese; cooked in oil not butter; no toast" },
            { dish: "Grilled salmon", note: "comes with bulgur (wheat) — sub greens or potatoes" },
            { dish: "Açaí bowl", note: "skip the oats (not certified GF); no yogurt; confirm base dairy-free" },
          ],
          watchOut: "egg sandwich is multigrain + mozzarella, chicken wrap is lavash (wheat), salmon plate sits on bulgur (wheat), Garden Greens salad has feta, Benedict-style plate has hollandaise; ask for GF toast + oat milk" },
        { name: "Coupa Cafe", area: "Palo Alto", rating: 4.1, reviews: 1483, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Breakfast arepa with scrambled eggs, tomato, onion, peppers", note: "corn arepa is GF; no cheese; fruit side" },
            { dish: "Reina Pepiada arepa (chicken, avocado, mayo)", note: "no cheese; mayo is egg-based" },
            { dish: "Rosemary & lime chicken tacos", note: "yellow corn tortillas; no cheese/crema; salsa verde" },
            { dish: "Palo Alto Chopped salad (quinoa, garbanzo, avocado)", note: "no feta; lemon vinaigrette" },
          ],
          watchOut: "croissant sandwiches, toasts & pastries are wheat+butter; Pollo arepa has cheddar, Carne Mechada is beef; breakfast tacos come with bacon (pork) — swap; empanaditas are beef/cheese; lattes dairy unless oat/almond; shared kitchen with pastries" },
        { name: "Cafe Borrone", area: "Menlo Park", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash"], unverified: true,
          safeDishes: [
            { dish: "Two-egg breakfast with fruit", note: "No toast/croissant; eggs in oil; no cheese" },
            { dish: "Green salad with grilled chicken", note: "No cheese, no croutons; oil & vinegar or vinaigrette (confirm dairy-free)" },
            { dish: "Fresh fruit plate", note: "Skip yogurt side" },
          ],
          watchOut: "Pastry-heavy counter; soups may be roux/cream based; many salads carry feta or parmesan — order plain." },
      ],
    },
    {
      category: "American breakfast",
      restaurants: [
        { name: "Joanie's Café", area: "Palo Alto", rating: 4.4, reviews: null, ratingSrc: "Google",
          safeDishes: [
            { dish: "Two eggs any style with hash browns or home fries + fruit", note: "NO toast/muffin — take avocado or fruit; no meat; potatoes in oil" },
            { dish: "Egg-white veggie scramble", note: "no cheese; fruit instead of toast; confirm no butter on griddle" },
            { dish: "Cajun chicken salad (avocado, cucumber, olives, peppers)", note: "vinaigrette; no cheese; confirm no croutons" },
            { dish: "Fresh fruit bowl", note: "plain" },
          ],
          watchOut: "every egg plate defaults to toast or a muffin (wheat) — decline; oatmeal is cooked with milk + granola; pancakes/waffles/French toast are wheat+buttermilk; Benedict = English muffin + hollandaise; breakfast burrito is flour tortilla; bacon/ham/sausage are pork" },
        { name: "Stacks", area: "Menlo Park", rating: 4.3, reviews: 1300, ratingSrc: "Google",
          safeDishes: [
            { dish: "Two eggs with Stacks potatoes", note: "no toast (they have a GF menu — ask for it); no meat side" },
            { dish: "Egg-white scramble with vegetables", note: "no cheese; no toast; oil not butter" },
            { dish: "Veggie omelet from the gluten-free menu", note: "no cheese; potatoes, no toast" },
            { dish: "Fresh fruit", note: "plain, no yogurt" },
          ],
          watchOut: "huevos rancheros is a FLOUR tortilla with pork chorizo, cheese & sour cream — off; teriyaki chicken salad = soy sauce (wheat); pancakes/waffles/French toast are wheat+buttermilk (GF waffle still has dairy); chicken-fried steak, bacon, ham, sausage are beef/pork" },
        { name: "Palo Alto Creamery", area: "Palo Alto", rating: 4.2, reviews: null, ratingSrc: "Tripadvisor",
          safeDishes: [
            { dish: "Two eggs any style with hash browns", note: "house GF bread or no toast; no butter; ask for untoasted/clean skillet" },
            { dish: "Egg-white veggie scramble", note: "no cheese; hash browns, no toast; oil not butter" },
            { dish: "Homemade oatmeal", note: "confirm cooked in water not milk; oats not certified GF" },
            { dish: "Fresh fruit bowl", note: "plain, no yogurt" },
          ],
          watchOut: "egg plates come with BUTTERED toast by default; shared toaster (ask for untoasted GF bread); pancakes/waffles/brioche French toast are wheat+dairy; granola & parfait have dairy/wheat; corned beef hash, bacon, ham, sausage are beef/pork; milkshakes everywhere" },
        { name: "Hatched", area: "Palo Alto", rating: null, reviews: 47, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Side of soft-scrambled eggs", note: "no cheese/chives butter; no bun" },
            { dish: "Apple, walnut & greens salad, balsamic", note: "no gorgonzola; no bread" },
            { dish: "Garden salad (romaine, avocado, radish, cucumber)", note: "swap green goddess (dairy) for balsamic/oil & vinegar" },
          ],
          watchOut: "the concept is sandwiches on buns/French bread — no GF bread known; Ono chicken is battered/fried (wheat); sandwiches default to cheddar + aioli + bacon/prosciutto (pork); avocado toast is French bread; matcha/espresso are dairy — ask for oat milk" },
        { name: "Hobee's", area: "Palo Alto", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats","Grubhub"], unverified: true,
          safeDishes: [
            { dish: "Fresh vegetable scramble", note: "No cheese; fruit instead of toast/coffee cake; ask eggs cooked in oil not butter" },
            { dish: "Two eggs with chicken-apple sausage & hash browns", note: "Chicken sausage (confirm no wheat filler); no toast; hash browns cooked in oil" },
            { dish: "Fresh fruit bowl with GF oatmeal or side of eggs", note: "Confirm oats are certified gluten-free; no milk/butter" },
          ],
          watchOut: "The signature blueberry coffee cake, toast, pancakes and most 'combos' are wheat; scrambles default with cheese; griddle uses butter — ask for oil." },
      ],
    },
    {
      category: "Bagels",
      restaurants: [
        { name: "House of Bagels", area: "Mountain View", rating: 4.3, reviews: 662, ratingSrc: "Google",
          safeDishes: [
            { dish: "Lox, tomato, onion & cucumber on a gluten-free bagel", note: "Canyon Bakehouse GF bagel; no cream cheese; ask untoasted (shared toaster)" },
            { dish: "Egg sandwich on a gluten-free bagel", note: "GF bagel; no cheese; no bacon/ham/sausage" },
            { dish: "Gluten-free bagel with jam", note: "plain/sesame/everything GF; no butter" },
          ],
          watchOut: "regular bagels are wheat — say 'gluten-free bagel' every time and ask them to slice/toast it separately (shared station); cream cheese, butter & cheddar are default; breakfast sandwiches add bacon/ham/sausage (pork)" },
      ],
    },
    {
      category: "Mexican breakfast",
      restaurants: [
        { name: "La Costeña", area: "Mountain View", rating: 4.4, reviews: 2500, ratingSrc: "Google", platforms: ["Uber Eats","DoorDash"],
          safeDishes: [
            { dish: "Pollo adobado tacos (corn tortillas)", note: "corn not flour; no cheese/sour cream; adobado, not encebollado" },
            { dish: "Burrito bowl with pollo adobado", note: "no cheese, no sour cream; add guacamole; beans are lard-free" },
            { dish: "Chicken plate with rice, beans & corn tortillas", note: "corn tortillas; no cheese/crema; skip mole" },
            { dish: "Veggie tacos or veggie bowl", note: "no cheese/crema; guacamole" },
          ],
          watchOut: "burritos are flour tortillas — order bowl or corn tacos; Pollo encebollado is marinated in soy sauce (wheat) and mole has toasted bread — pick adobado; carnitas/asada/al pastor/chorizo are pork/beef; cheese & sour cream are default; beans have no lard" },
        { name: "Los Altos Taqueria", area: "Mountain View", rating: 4.2, reviews: 819, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Grilled bass fish tacos", note: "corn tortillas; no crema, no cheese; grilled not fried" },
            { dish: "Chicken bowl (rice, beans, grilled veggies, guacamole)", note: "no cheese, no sour cream; ask for whole beans (no lard)" },
            { dish: "Huevos rancheros", note: "corn tortillas; no cheese; confirm sauce has no flour, beans no lard" },
            { dish: "Chips with guacamole & salsa", note: "corn chips; confirm fryer not shared with battered items" },
          ],
          watchOut: "burritos & quesabirria are flour tortillas + cheese + beef; fried tilapia may be floured; carne asada fries, chorizo, carnitas, al pastor, menudo are pork/beef; cheese & crema default; refried beans may use lard" },
        { name: "Sancho's Taqueria", area: "Palo Alto", rating: 4.2, reviews: 851, ratingSrc: "Google",
          safeDishes: [
            { dish: "Grilled fish tacos", note: "GRILLED not battered; corn tortillas; no crema, no cheese" },
            { dish: "Chicken plate with rice, beans & corn tortillas", note: "corn not flour; no cheese/sour cream; confirm beans no lard" },
            { dish: "Huevos rancheros", note: "corn tortillas; no cheese/crema; confirm salsa has no flour" },
            { dish: "Chips & guacamole", note: "corn chips; shared fryer possible" },
          ],
          watchOut: "burritos (Super/California) are flour tortillas — off; fish tacos come grilled OR lightly battered (wheat) — say grilled; plates offer flour or corn tortillas — say corn; chorizo/bacon/carnitas/asada are pork/beef; cheese, crema, sour cream default" },
        { name: "Taqueria La Bamba", area: "Mountain View", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats"], unverified: true,
          safeDishes: [
            { dish: "Huevos a la mexicana on corn tortillas", note: "Corn tortillas; no cheese/crema; beans not refried in lard (confirm)" },
            { dish: "Egg & potato tacos (corn)", note: "Corn tortillas; no cheese; ask no chorizo" },
            { dish: "Chicken (pollo asado) bowl with rice, beans, salsa", note: "No flour tortilla, no cheese/sour cream; confirm beans lard-free" },
          ],
          watchOut: "Chorizo, carnitas and al pastor are pork; refried beans and rice may use lard; burritos default to flour tortillas — always say corn." },
      ],
    },
    {
      category: "Açaí & smoothie bowls",
      restaurants: [
        { name: "Palmetto Superfoods", area: "Palo Alto", rating: 4.4, reviews: 500, ratingSrc: "Uber Eats",
          safeDishes: [
            { dish: "'Just Açaí' signature bowl", note: "swap to GF Maple Cinna-Hemp granola (celiac-friendly) or no granola" },
            { dish: "Bay Blend bowl (açaí, pitaya, coconut, chia)", note: "GF granola not almond-honey granola; confirm chia pudding is coconut-based" },
            { dish: "Build-your-own açaí bowl", note: "no Nutella (milk); GF granola; fruit, nut butter, coconut" },
            { dish: "Smoothie", note: "almond/oat/coconut base; no yogurt, no whey, no collagen" },
          ],
          watchOut: "default almond-honey granola is not GF — ask for the Maple Cinna-Hemp GF granola; steel-cut-oat bases aren't certified GF; Nutella has milk; collagen add-on is bovine/marine (red meat risk); some smoothies use yogurt" },
        { name: "Pressed", area: "Palo Alto", rating: 4, reviews: 361, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Açaí Original Bowl", note: "ask for GF granola or no granola; base is dairy-free" },
            { dish: "Açaí Power Bowl", note: "plant protein not whey; GF granola; confirm protein powder wheat-free" },
            { dish: "Smoothie", note: "almond/oat base; no dairy, no yogurt" },
            { dish: "Dairy-free Açaí 'Freeze' soft serve", note: "coconut + oat-milk base (oat, not wheat); no granola topping" },
          ],
          watchOut: "standard crunchy granola contains wheat/oats — request the GF granola; whey protein and yogurt appear in some blends; Freeze uses oat milk (fine for wheat, note if oat-sensitive)" },
        { name: "Vitality Bowls", area: "Palo Alto", rating: 3.8, reviews: 324, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Açaí bowl with granola, banana, strawberries", note: "their granola is organic GF; base is dairy-free" },
            { dish: "Peanut-butter açaí bowl", note: "GF granola; no whey protein" },
            { dish: "Smoothie or fresh juice", note: "almond/oat base; no dairy protein" },
            { dish: "Avocado toast on gluten-free bread", note: "GF bread available; no butter, no cheese" },
          ],
          watchOut: "paninis/wraps are wheat + cheese unless GF bread; some protein add-ins are whey; not a dedicated GF kitchen (they say separate allergen prep area — confirm)" },
        { name: "SunLife Organics", area: "Palo Alto", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats"], unverified: true,
          safeDishes: [
            { dish: "Açaí bowl (almond-milk base)", note: "Skip granola unless confirmed gluten-free; no honey-yogurt toppings" },
            { dish: "Pitaya (dragon fruit) bowl", note: "Fruit + coconut + seeds only; confirm granola is GF or omit" },
            { dish: "Green smoothie with plant milk", note: "Choose almond/coconut/oat base; avoid whey or 'Money' protein blends with milk" },
          ],
          watchOut: "Granola is the wheat/oat trap; some protein powders contain whey. Bowls are plant-based by default but confirm the base milk." },
      ],
    },
    {
      category: "Gluten-free bakeries & cafés",
      restaurants: [
        { name: "Sweet Diplomacy", area: "Los Altos", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash"], unverified: true,
          safeDishes: [
            { dish: "Vegan-labelled cupcake or muffin", note: "Dedicated GF bakery; pick items flagged vegan (no butter/milk)" },
            { dish: "Vegan cookie or brownie", note: "Ask staff which day's items are dairy-free; most contain butter" },
            { dish: "Coffee with oat or almond milk", note: "Plant milk only" },
          ],
          watchOut: "Everything is wheat-free, but most pastries use butter/cream — only the vegan-marked items are dairy-free. Confirm delivery radius reaches Stanford." },
      ],
    },
  ],
  lightLunch: [
    {
      category: "Salads & bowls",
      restaurants: [
        { name: "Tender Greens", area: "Palo Alto", rating: 4.7, reviews: 6000, ratingSrc: "Uber Eats", platforms: ["Uber Eats","DoorDash"],
          safeDishes: [
            { dish: "Grilled salmon plate with simple salad", note: "oil & vinegar; roasted veg not mashed potatoes (butter/cream)" },
            { dish: "Salt & pepper chicken plate", note: "no cheese; vinaigrette; skip mashed potatoes and bread" },
            { dish: "Longevity Bowl with grilled salmon", note: "no pecorino; lentils, cauliflower, potatoes are wheat-free" },
            { dish: "California Bowl, chipotle BBQ chicken", note: "no queso fresco, no lime crema; confirm BBQ sauce has no wheat/soy" },
          ],
          watchOut: "everything is GF except bread/sandwiches, fried chicken (breaded) and falafel (shared wheat equipment); farro/wheat-berry grain salads are wheat; mashed potatoes are butter+cream; ranch, blue-cheese, green-goddess dressings are dairy; steak & salami are red meat" },
        { name: "True Food Kitchen", area: "Palo Alto", rating: 4.3, reviews: 2403, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Ancient Grains Bowl, add grilled chicken", note: "standard has farro (wheat) — order the GF version they offer; confirm" },
            { dish: "Wild-caught tuna poke bowl", note: "TFK lists no gluten ingredients (tamari-style); confirm at order" },
            { dish: "Tuscan Kale Salad, add chicken or salmon", note: "no parmesan, no breadcrumbs; lemon dressing" },
          ],
          watchOut: "menu uses wheat & dairy widely: pizzas, squash toast, kale/Caesar parmesan, goat cheese on bowls; Ancient Grains bowl contains wheat unless you ask for the GF swap; they will modify most dishes GF — say 'wheat allergy + dairy allergy'" },
        { name: "Asian Box", area: "Palo Alto", rating: 4.2, reviews: 811, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Chicken box over jasmine rice with veg & herbs", note: "100% GF menu (GF soy sauce); tamarind or lemongrass vinaigrette" },
            { dish: "Tofu box over GF rice noodles", note: "no dairy on menu; peanuts present" },
            { dish: "Shrimp box over greens with herbs", note: "fish-sauce dressing fine; skip 'Asian street dust' if unsure" },
          ],
          watchOut: "the whole menu is gluten-free and dairy-free — the only traps are caramelized/lemongrass pork and steak (red meat); peanuts & shrimp are in the kitchen" },
        { name: "Sweetgreen", area: "Palo Alto", rating: 3.6, reviews: 442, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Harvest Bowl (chicken, wild rice, sweet potato, apple, almonds)", note: "no goat cheese; balsamic; listed gluten-free" },
            { dish: "Create-your-own: roasted chicken or tofu + greens + avocado", note: "no cheese; balsamic or lime-cilantro-jalapeño; confirm chicken marinade" },
            { dish: "Guacamole Greens (chicken, avocado, tortilla chips)", note: "corn chips; lime-cilantro vinaigrette; confirm no cheese" },
          ],
          watchOut: "Miso Glazed Salmon marinade contains WHEAT — dropped; crispy chicken, spicy cashew/miso-sesame dressings and shroomami tofu carry soy sauce (wheat); goat cheese/parmesan/feta removable; Caesar, ranch, green goddess are buttermilk" },
        { name: "Chipotle Mexican Grill", area: "Palo Alto", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats","Grubhub"], unverified: true,
          safeDishes: [
            { dish: "Chicken burrito bowl", note: "Rice, black beans, fajita veg, salsas, guac; NO cheese, sour cream or queso" },
            { dish: "Chicken salad", note: "Skip cheese; honey vinaigrette is dairy-free per Chipotle allergen chart (confirm)" },
            { dish: "Sofritas bowl", note: "Tofu; no cheese/sour cream; corn chips and tortilla-less" },
          ],
          watchOut: "Only flour tortillas contain wheat, but the serving line is shared; steak, barbacoa and carnitas are red meat; cheese/sour cream/queso are dairy." },
      ],
    },
    {
      category: "Poke",
      restaurants: [
        { name: "Go Fish Poke Bar", area: "Palo Alto", rating: 4.3, reviews: 464, ratingSrc: "Google",
          safeDishes: [
            { dish: "Build-your-own ahi tuna bowl over rice", note: "ask for the GF-labeled sauce/tamari; NO shoyu; avocado, edamame" },
            { dish: "Salmon bowl with avocado, seaweed salad, togarashi mayo", note: "togarashi mayo is egg-based — confirm no soy; seaweed salad often has soy" },
            { dish: "Tamari-ginger roasted chicken bowl", note: "tamari glaze — confirm wheat-free tamari" },
          ],
          watchOut: "regular shoyu & ponzu contain wheat — reviewers say some sauces are labeled GF, so ask which; seaweed salad and gomae sauce usually have soy sauce; no dairy or red meat on the menu" },
        { name: "Poke House", area: "Palo Alto", rating: 4.1, reviews: 253, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Build-your-own ahi bowl over rice, avocado, edamame", note: "sauce: sriracha aioli or GF-labeled citrus soy only; confirm" },
            { dish: "Salmon bowl over greens with avocado & cucumber", note: "no house shoyu/unagi; ask for GF sauce or plain sesame oil" },
          ],
          watchOut: "sauces are the wheat trap: House Shoyu, Sweet Unagi, miso aioli & wasabi goma carry soy sauce/miso; reviewers say citrus soy is marked GF — verify; crispy/tempura toppings are wheat; no dairy or red meat otherwise" },
      ],
    },
    {
      category: "Sandwiches & wraps",
      restaurants: [
        { name: "Le Boulanger", area: "Los Altos", rating: 4.2, reviews: 500, ratingSrc: "Google", platforms: ["Uber Eats","DoorDash"],
          safeDishes: [
            { dish: "Grilled chicken sandwich on gluten-free bread", note: "GF bread; no jack cheese, no pesto (parmesan); peppers, tomato, greens" },
            { dish: "Chicken, walnut & cranberry salad, balsamic", note: "no gorgonzola; no roll/croutons" },
            { dish: "Chicken, spinach, strawberry & mandarin salad", note: "no gorgonzola; raspberry vinaigrette" },
          ],
          watchOut: "working bakery — they call salads 'gluten sensitive'; pastries, rolls, croutons and the free roll are wheat+butter; sandwiches default to brie/provolone/Swiss; pesto has parmesan; chowder & broccoli-cheddar soups are roux+dairy; ham/salami are pork" },
        { name: "Mendocino Farms", area: "Palo Alto", rating: 4.5, reviews: 435, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Vegan Banh Mi on gluten-free bread", note: "order RGF on GF bread; confirm tofu marinade has no soy sauce" },
            { dish: "Impossible Taco Salad", note: "no cotija/crema; tortilla strips are corn — confirm marked GF" },
            { dish: "Avocado & Quinoa Superfood Ensalada", note: "vegan, no croutons; confirm GF on allergen sheet, no cheese" },
            { dish: "Farm Club (turkey, avocado) on gluten-free bread", note: "no bacon, no cheese; herb aioli is egg-based" },
          ],
          watchOut: "all sandwiches default to wheat bread — ask for GF bread (RGF items); Curried Couscous salad is wheat; Chinese Chicken salad has wonton strips + soy dressing; crispy/Not-So-Fried chicken is breaded; caprese/pesto/goat-cheese items are dairy; bacon, pork belly, steak are red meat" },
        { name: "Ike's Love & Sandwiches", area: "Palo Alto", rating: 3.3, reviews: 158, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Halal chicken sandwich on gluten-free bread", note: "no cheese; Dirty Sauce is vegan aioli; confirm GF bread in stock" },
            { dish: "Turkey sandwich on gluten-free bread", note: "no cheese; lettuce, tomato, avocado; ask fresh gloves" },
            { dish: "Wild salmon sandwich on gluten-free bread", note: "no cheese; confirm sweet chili sauce has no soy sauce" },
          ],
          watchOut: "every sandwich is on wheat unless you ask for GF bread (often runs out); vegan turkey/chicken/meatballs are likely seitan (wheat) — skip; cheese is the default on nearly everything; bacon, salami, pastrami, pepperoni, meatball are red meat; cookies/chips not GF" },
      ],
    },
    {
      category: "Mediterranean",
      restaurants: [
        { name: "Falafel Stop", area: "Sunnyvale", rating: 4.5, reviews: 1900, ratingSrc: "Google", platforms: ["Uber Eats","DoorDash","Grubhub"],
          safeDishes: [
            { dish: "Falafel on hummus plate with Israeli salad & tahini", note: "falafel has no flour (per GF reports); plate, no pita" },
            { dish: "Grilled chicken kebab on hummus plate", note: "no pita; tahini/amba; no feta" },
            { dish: "Sabich plate (fried eggplant + egg, hummus, salad)", note: "as plate not pita; confirm eggplant is un-battered" },
          ],
          watchOut: "pita and pita sandwiches are wheat — order everything as a plate; falafel is flour-free but fried near pita (cross-contact); confirm the shawarma meat (turkey vs lamb) before ordering; skip feta and any yogurt sauce" },
        { name: "Zareen's", area: "Palo Alto", rating: 4.5, reviews: 2992, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Madras Chicken Curry with basmati rice", note: "coconut milk; marked dairy-free & gluten-free; rice not naan" },
            { dish: "Chana Masala (marked vegan)", note: "over basmati rice, not naan/roti; confirm no flour thickener" },
            { dish: "Madras Vegan Curry thali", note: "coconut curry, potato, peas; skip the naan/roti in the thali" },
            { dish: "Grilled Chicken Boti (marked GF)", note: "with rice; confirm marinade has no yogurt" },
          ],
          watchOut: "naan, paratha, roti and samosa pastry are wheat (and naan has ghee); tikka masala, butter chicken, korma, paneer dishes use cream/butter; tikka marinades and raita are yogurt; beef/lamb kebabs are red meat; pakoras are chickpea flour but check the fryer" },
        { name: "Oren's Hummus", area: "Palo Alto", rating: 4.3, reviews: 2743, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Hummus Classic with gluten-free pita or veggies", note: "ask for their GF pita; vegan" },
            { dish: "Falafel over turmeric basmati rice", note: "falafel marked GF & vegan; tahini" },
            { dish: "Chicken kebab (shishlik) over basmati rice", note: "marked GF; no labneh/feta add-on" },
            { dish: "Israeli salad / baba ganoush", note: "lemon-oil, no feta; dairy-free" },
          ],
          watchOut: "menu labels GF items and GF pita is available — use it instead of regular pita; schnitzel is breaded (wheat); skip beef/lamb kebab & merguez (red meat) and labneh/feta/tzatziki add-ons" },
        { name: "SAJJ Mediterranean", area: "Sunnyvale", rating: 4, reviews: 401, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Rice or salad bowl with falafel", note: "falafel vegan & GF, dedicated fryer; hummus, tahini, harissa" },
            { dish: "Chicken shawarma rice bowl", note: "tahini or toum (dairy-free); confirm shawarma marinade wheat-free" },
            { dish: "Salad bowl with chicken kabob, hummus & baba ghanoush", note: "lemon-oil or tahini; no tzatziki/feta" },
          ],
          watchOut: "wraps and pita are wheat — always order a rice or salad bowl; tzatziki, garlic-yogurt sauce and feta are dairy; steak shawarma is beef; toum, hummus, baba ghanoush, tahini and harissa are dairy-free; allergen sheet is posted at the counter" },
        { name: "CAVA", area: "Mountain View", rating: 3.7, reviews: 3500, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Greens + grains bowl with grilled chicken", note: "brown rice/greens; hummus, harissa, roasted veg; lemon-herb tahini" },
            { dish: "Harissa honey chicken bowl", note: "RightRice or lentils; skhug, pickled onions; no feta" },
            { dish: "Roasted vegetable & lentil bowl (vegan)", note: "all dips are GF; harissa vinaigrette; no pita chips" },
          ],
          watchOut: "the falafel contains wheat flour — skip it (a GF version exists at some locations; confirm); pita and pita chips are wheat; Crazy Feta, feta, tzatziki and yogurt-dill dressing are dairy; lamb meatballs, braised lamb and steak are red meat; staff re-glove on request" },
        { name: "DishDash", area: "Sunnyvale", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats"], unverified: true,
          safeDishes: [
            { dish: "Chicken kabob plate with rice", note: "No pita; rice plate; skip any yogurt/tzatziki side" },
            { dish: "Mjadarah (lentils & rice with caramelized onions)", note: "Ask no yogurt on side; confirm onions fried without flour" },
            { dish: "Hummus & baba ghanoush with vegetable sticks", note: "No pita — ask for cucumber/carrots instead" },
          ],
          watchOut: "Kibbeh and fattoush contain bulgur/pita; falafel may contain flour (confirm); labneh, feta and yogurt sauces are dairy; shawarma may be beef/lamb." },
        { name: "Kabul Afghan Cuisine", area: "San Carlos", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats"], unverified: true,
          safeDishes: [
            { dish: "Chicken kabob (murgh) with challow rice", note: "No bread; rice only; skip any yogurt/chutney containing dairy" },
            { dish: "Sabzi challow (spinach with rice)", note: "Vegetarian; confirm cooked in oil not ghee" },
            { dish: "Kaddo (sautéed pumpkin)", note: "Omit the yogurt sauce; confirm oil not ghee" },
          ],
          watchOut: "Lamb and beef kabobs dominate; mantu/aushak are wheat dumplings; yogurt sauces and ghee appear on many dishes — ask plainly." },
      ],
    },
    {
      category: "Cafés & light bites",
      restaurants: [
        { name: "Garden Fresh (vegan Chinese)", area: "Mountain View", rating: 4.4, reviews: 1452, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Fresh basil (rice-paper) rolls", note: "rice paper, not fried; confirm dipping sauce has no soy sauce" },
            { dish: "Mango salad", note: "from the wheat-free-labeled list; confirm dressing" },
            { dish: "Sautéed mixed vegetables & plain tofu with brown rice", note: "ask for a wheat-free-labeled sauce or no soy sauce" },
          ],
          watchOut: "100% vegan so no dairy or meat, but the mock 'beef/pork/chicken/fish' are mostly WHEAT GLUTEN (seitan) — avoid all faux meats; chow mein, scallion pancakes, fried rolls and most stir-fry sauces have wheat/soy sauce; order only from their ~10 labeled wheat-free dishes" },
        { name: "Coupa Café", area: "Palo Alto", rating: 4.1, reviews: 1483, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Reina Pepiada arepa (chicken, avocado, mayo)", note: "corn arepa is GF; no cheese; mayo is egg-based" },
            { dish: "House or chicken salad", note: "no cheese/croutons; oil & vinegar — some dressings contain wheat" },
            { dish: "Turkey sandwich on gluten-free bread", note: "no cheese, no butter; confirm GF bread available" },
          ],
          watchOut: "arepas are naturally corn/GF but usually stuffed with white cheese — order without; empanada dough and croissants/pastries are wheat; Caesar has parmesan; reviewers report some salad dressings contain wheat — ask; pabellón/pernil arepas are beef/pork" },
      ],
    },
    {
      category: "Smoothies & açaí bowls",
      restaurants: [
        { name: "Bare Bowls", area: "Palo Alto", rating: 4.5, reviews: 438, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "The OG açaí bowl (açaí, banana, granola, berries)", note: "house cashew milk; granola is house-made gluten-free" },
            { dish: "Peanut butter açaí bowl", note: "dairy-free, gluten-free" },
            { dish: "Smoothies with house cashew milk", note: "dairy-free; no wheat anywhere on menu" },
          ],
          watchOut: "the whole shop is gluten-free and dairy-free (cashew/nut milks, local GF granola) with no meat — only tree-nut heavy; nothing to modify" },
        { name: "Palmetto Superfoods", area: "Palo Alto", rating: 4.4, reviews: 500, ratingSrc: "Uber Eats",
          safeDishes: [
            { dish: "Signature açaí bowl", note: "ask GF Maple Cinna-Hemp granola, not honey-almond; base has oats" },
            { dish: "Pitaya or Blue Majik bowl", note: "plant base; GF maple cinna-hemp granola only" },
            { dish: "Smoothie with plant-milk base", note: "dairy-free; no granola" },
          ],
          watchOut: "vegan by default; only the Maple Cinna-Hemp granola is labeled gluten-free — the honey-almond granola is not; açaí base is blended with steel-cut oats (not wheat, but cross-contact caution); leave off the collagen-peptide add-on (bovine)" },
        { name: "Vitality Bowls", area: "Palo Alto", rating: 3.8, reviews: 324, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Original / Graviola açaí bowl", note: "organic gluten-free granola; dairy-free base" },
            { dish: "Pitaya (dragonfruit) bowl", note: "plant base; GF granola" },
            { dish: "Fruit or green smoothie", note: "apple juice or almond milk base; no whey protein add" },
          ],
          watchOut: "bowls use gluten-free granola and the menu lists allergens per item; skip paninis (wheat + cheese), Nutella, and whey-protein boosts (milk); allergy-conscious prep area" },
        { name: "Jamba", area: "Palo Alto", rating: 3.5, reviews: 138, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Açaí Primo or PB Mood bowl, no granola", note: "plant base; hold granola unless confirmed wheat-free" },
            { dish: "Greens 'n Ginger smoothie", note: "all fruit/veg; dairy-free, wheat-free" },
            { dish: "Mega Mango or Strawberry Whirl smoothie", note: "all-fruit/juice; no sherbet or frozen yogurt" },
          ],
          watchOut: "Jamba's granola and oatmeal are flagged for wheat (cross-contact) — order bowls without granola; parfaits have yogurt + granola; many classic smoothies contain sherbet or frozen yogurt — pick all-fruit or plant-milk and ask for no yogurt/sherbet" },
      ],
    },
    {
      category: "Burmese",
      restaurants: [
        { name: "Burma Ruby", area: "Palo Alto", rating: 4.7, reviews: 1200, ratingSrc: "Uber Eats", platforms: ["Uber Eats","DoorDash"],
          safeDishes: [
            { dish: "Tea leaf salad", note: "dried shrimp; order from GF menu; dairy-free" },
            { dish: "Ginger salad", note: "pickled ginger, beans, peanuts; GF menu" },
            { dish: "Chicken or fish curry with steamed/coconut rice", note: "ask GF soy sauce; confirm curry is on the GF menu" },
          ],
          watchOut: "they have a separate gluten-free menu and GF soy sauce — say so when ordering; most tofu dishes use a wheat marinade; coconut chicken noodle soup, rainbow salad and platha use wheat/egg noodles or dough; samusa pastry is wheat; skip pork/beef/lamb curries and milk tea" },
        { name: "Rangoon Ruby", area: "Palo Alto", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats","Grubhub"], unverified: true,
          safeDishes: [
            { dish: "Tea leaf salad with chicken", note: "Confirm crunchy mix (fried peas/garlic) has no flour; add chicken" },
            { dish: "Coconut chicken curry with rice", note: "Rice not paratha; confirm no soy sauce in curry" },
            { dish: "Shrimp with vegetables, steamed rice", note: "Ask no soy/oyster sauce; fish sauce and tamarind are fine" },
          ],
          watchOut: "Samusa/samosa soup, rainbow salad and nan gyi thoke use wheat noodles or pastry; stir-fries may use soy sauce; some dishes have butter." },
      ],
    },
    {
      category: "Sushi",
      restaurants: [
        { name: "Kanpai Sushi", area: "Palo Alto", rating: 4.3, reviews: 700, ratingSrc: "Google", platforms: ["Uber Eats","DoorDash"],
          safeDishes: [
            { dish: "Salmon & tuna sashimi or nigiri", note: "ask for GF soy sauce/tamari (listed GF-friendly); confirm stocked" },
            { dish: "Spicy tuna roll", note: "no cream cheese; confirm spicy mix has no soy sauce, no imitation crab" },
            { dish: "Edamame (plain, salted)", note: "wheat-free, dairy-free" },
          ],
          watchOut: "regular shoyu, ponzu, eel sauce, teriyaki and most marinades contain wheat — bring or ask for tamari; tempura, katsu, gyoza, udon/ramen are wheat; imitation crab (California roll) has wheat; seaweed salad dressing usually has soy sauce; cream-cheese rolls are dairy; no beef/pork tataki" },
      ],
    },
  ],
  dinner: [
    {
      category: "Mexican",
      restaurants: [
        { name: "Tacos El Grullense", area: "Redwood City", rating: 4.5, reviews: null, ratingSrc: "Uber Eats", platforms: ["Uber Eats","DoorDash","Grubhub"],
          safeDishes: [
            { dish: "Pollo asado street tacos", note: "corn tortillas; onion-cilantro-salsa; no queso/crema" },
            { dish: "Pollo asado plate with rice & beans", note: "corn tortillas; no cheese/sour cream; confirm beans not lard" },
            { dish: "Camarones (shrimp) plate, ranchero or diabla style", note: "confirm grilled not battered, no butter" },
          ],
          watchOut: "their fish and shrimp tacos are BATTERED and on FLOUR tortillas — avoid; burritos and quesadillas are flour; crispy tacos come with jack cheese & sour cream; beans/rice may use lard; asada, al pastor, carnitas, chorizo are red meat" },
        { name: "LuLu's", area: "Palo Alto", rating: 3.7, reviews: 339, ratingSrc: "Restaurant Guru", platforms: ["Uber Eats"],
          safeDishes: [
            { dish: "Grilled fish taco", note: "corn tortilla; hold chipotle sauce (dairy); no cheese" },
            { dish: "Grilled shrimp taco", note: "corn tortilla; salsa fresca + avocado; no chipotle sauce" },
            { dish: "Grilled chicken street taco", note: "corn tortilla; no cheese/crema" },
          ],
          watchOut: "fish and shrimp are grilled on corn tortillas (good) but the chipotle sauce is dairy — hold it; burritos and quesadillas are flour; ask for corn tortillas on anything else; carnitas/asada/al pastor are red meat" },
        { name: "Reposado", area: "Palo Alto", rating: 4.3, reviews: 1535, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Ceviche (hamachi or trio)", note: "citrus-cured; they offer GF tortilla chips" },
            { dish: "Fish tacos", note: "corn tortillas; confirm grilled not fried; no crema/cheese" },
            { dish: "Guacamole with GF corn chips", note: "dairy-free" },
            { dish: "Grilled chicken plate (pollo)", note: "no cheese/crema; ask no butter; corn tortillas" },
          ],
          watchOut: "has a gluten-free menu and GF chips — ask for it; calamares fritos are breaded; enchiladas/plates arrive with melted cheese & crema — request without; carnitas & carne asada are red meat" },
        { name: "Sancho's Taqueria", area: "Palo Alto", rating: 4.2, reviews: 851, ratingSrc: "Google",
          safeDishes: [
            { dish: "Grilled chicken (pollo asado) tacos", note: "corn tortillas; no cheese" },
            { dish: "Grilled fish taco", note: "ask GRILLED (not battered) on CORN; remoulade is mayo — confirm no dairy" },
            { dish: "Chicken taco bowl", note: "rice, black beans, grilled veg, pico; no cheese/sour cream" },
            { dish: "Grilled shrimp taco", note: "corn tortilla; no crema/cheese" },
          ],
          watchOut: "fish tacos come battered or grilled and default to soft flour ('white') tortillas — specify grilled + corn; burritos are flour — get the bowl instead; queso/crema/sour cream on request only; carnitas, al pastor, asada are red meat; refried beans may have lard — choose black" },
        { name: "Celia's Mexican Restaurant", area: "Palo Alto", rating: 4.3, reviews: 712, ratingSrc: "Birdeye",
          safeDishes: [
            { dish: "Chicken fajitas", note: "corn tortillas; no sour cream/cheese; confirm marinade has no soy sauce" },
            { dish: "Grilled chicken taco", note: "corn tortilla; no cheese; salsa" },
            { dish: "Chips, salsa & guacamole", note: "corn chips; dairy-free" },
          ],
          watchOut: "the fish tacos are lightly BATTERED — avoid; fajitas default to flour tortillas, sour cream and guac — ask corn, no sour cream; enchilada/burrito plates are cheese-covered or flour; staff know allergens — ask for GF; carnitas & carne asada are red meat; confirm beans are whole, not lard refried" },
        { name: "Toluco Mexican Kitchen", area: "East Palo Alto", rating: 4, reviews: 107, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Grilled chicken (pollo) tacos", note: "organic corn tortillas; no cheese/crema" },
            { dish: "Fish taco", note: "organic corn tortilla; confirm grilled not battered; no crema" },
            { dish: "Shrimp taco", note: "default has cheese — order NO cheese/crema; corn tortilla" },
            { dish: "Shrimp ranchero or spicy red-sauce plate", note: "rice, beans, salad; not garlic-butter or creamy chipotle; confirm lard" },
          ],
          watchOut: "burritos and burrito bowls default to sour cream + cheese (burrito is flour — get a bowl, no dairy); shrimp tacos include cheese by default; garlic-butter and creamy-chipotle shrimp are dairy; birria/quesabirria is beef + cheese; al pastor & carnitas are red meat" },
        { name: "Tacolicious", area: "Palo Alto", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats","Grubhub"], unverified: true,
          safeDishes: [
            { dish: "Guajillo-braised chicken tacos", note: "Corn tortillas; no queso fresco/crema" },
            { dish: "Grilled shrimp tacos", note: "Corn tortillas; ask for grilled, not battered; no crema" },
            { dish: "Guacamole with chips", note: "Corn chips; confirm dedicated fryer (no battered fish shared)" },
          ],
          watchOut: "Baja-style fish tacos are beer-battered (wheat); carnitas/short-rib tacos are red meat; several tacos come with cheese or crema by default." },
      ],
    },
    {
      category: "Mediterranean & Middle Eastern",
      restaurants: [
        { name: "Yalla Falafel", area: "Palo Alto", rating: 4.7, reviews: null, ratingSrc: "Uber Eats", platforms: ["Uber Eats"],
          safeDishes: [
            { dish: "Amba chicken bowl on green Persian rice", note: "amba aioli is egg-based; s'chug; confirm no labneh/yogurt" },
            { dish: "Herb falafel bowl on green Persian rice", note: "dedicated GF fryer; lemon tahini; dairy-free" },
            { dish: "Hummus with vegetables", note: "no pita; housemade, dairy-free" },
          ],
          watchOut: "pita sandwiches are wheat — order the rice bowls; falafel and fries have a dedicated gluten-free fryer; skip labneh/yogurt add-ons; only proteins are chicken and falafel" },
        { name: "Falafel Tazah", area: "Redwood City", rating: 4.8, reviews: 459, ratingSrc: "Yelp", platforms: ["Uber Eats","Grubhub"],
          safeDishes: [
            { dish: "Chicken shawarma rice plate", note: "sub tahini for garlic YOGURT sauce; skip the pita on the plate" },
            { dish: "Falafel plate (rice, hummus, salad)", note: "no lavash/pita; confirm falafel has no flour binder" },
            { dish: "Hummus with salad", note: "garbanzo/tahini/lemon; no pita" },
          ],
          watchOut: "plates come with pita and wraps are lavash — leave the bread; chicken shawarma defaults to garlic-yogurt sauce — ask tahini; falafel flour content not confirmed; beef/lamb shawarma is red meat" },
        { name: "Nick the Greek", area: "Palo Alto", rating: 4.8, reviews: 652, ratingSrc: "Google",
          safeDishes: [
            { dish: "Chicken souvlaki bowl", note: "rice + salad; no pita, no tzatziki/feta; hummus instead" },
            { dish: "Chicken gyro bowl or plate", note: "chicken gyro is GF (beef/lamb gyro isn't); no pita/tzatziki/feta" },
            { dish: "Greek salad", note: "no feta; oil & vinegar; add chicken" },
          ],
          watchOut: "falafel is NOT gluten-free here — skip; pita, beef/lamb gyro (breadcrumbs), beefteki and orzo soup have wheat; fries share a fryer with falafel; tzatziki and feta are dairy; pork/beef/lamb gyro is red meat — pick chicken" },
        { name: "Mediterranean Wraps", area: "Palo Alto", rating: 4.5, reviews: 1168, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Chicken shawarma plate (gluten-free plate)", note: "hummus, salad, broiled tomato; no pita, no yogurt sauce" },
            { dish: "Falafel plate", note: "no pita; tahini; confirm falafel has no flour" },
            { dish: "Hummus & baba ghanoush with vegetables", note: "no pita; dairy-free" },
            { dish: "Chicken salad", note: "no feta; lemon-oil or tahini dressing" },
          ],
          watchOut: "wraps are wheat — the menu has a Gluten-Free Plates section, order from it; tabbouleh is bulgur (wheat); plates come with hot pita — leave it; skip feta and yogurt/tzatziki sauces; kufta and beef shawarma are red meat" },
        { name: "Oren's Hummus", area: "Palo Alto", rating: 4.3, reviews: 2743, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Hummus with chicken, gluten-free pita", note: "ask for GF pita; no dairy garnish" },
            { dish: "Falafel (marked GF, vegan)", note: "tahini; over rice or salad" },
            { dish: "Chicken shishlik over basmati rice", note: "marked GF; no labneh/feta" },
            { dish: "Baba ganoush & Israeli salad", note: "no feta; lemon-oil" },
          ],
          watchOut: "GF pita available and menu marks GF items — use both; schnitzel is breaded; beef/lamb kebab & merguez are red meat; labneh, feta and tzatziki are dairy — some spreads are garnished with dairy, so ask" },
        { name: "Hummus Mediterranean Kitchen", area: "Palo Alto", rating: null, reviews: 564, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Chicken shawarma plate", note: "rice + salad; leave the pita; tahini/hummus, no yogurt sauce" },
            { dish: "Falafel with hummus & salad", note: "no pita, no tzatziki; confirm falafel has no flour" },
            { dish: "Hummus with vegetables", note: "no pita; dairy-free" },
            { dish: "Israeli salad", note: "no feta; lemon-oil" },
          ],
          watchOut: "fresh-baked pita comes with nearly everything — refuse it; gyro is beef/lamb (red meat) — pick chicken shawarma or kebab; skip feta, labneh, tzatziki; falafel binder and any GF alternatives not confirmed — ask" },
        { name: "Chelokababi", area: "Sunnyvale", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats"], unverified: true,
          safeDishes: [
            { dish: "Joojeh kabob (saffron chicken) with basmati rice", note: "No butter pat on rice; no bread; skip yogurt side" },
            { dish: "Salmon kabob with rice", note: "No butter on rice; confirm marinade dairy-free" },
            { dish: "Shirazi salad", note: "Cucumber-tomato-onion, lemon & oil — naturally safe" },
          ],
          watchOut: "Koobideh, barg and most stews are beef/lamb; rice is served with butter unless refused; kashk-e-bademjan has whey; mast-o-khiar is yogurt." },
        { name: "Shalizaar", area: "Belmont", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash"], unverified: true,
          safeDishes: [
            { dish: "Joojeh (chicken) kabob with saffron rice", note: "Ask no butter on rice; no bread" },
            { dish: "Fesenjan with chicken (pomegranate-walnut)", note: "Rice; confirm made with chicken not beef, no butter" },
            { dish: "Grilled salmon with rice", note: "Confirm sauce is lemon/oil, no butter" },
          ],
          watchOut: "Belmont is ~20 min from Stanford — check delivery reaches campus. Rice is buttered by default; koobideh and lamb dishes are red meat; yogurt dips are dairy." },
      ],
    },
    {
      category: "Thai",
      restaurants: [
        { name: "Farmhouse Kitchen Thai", area: "Menlo Park", rating: 4.2, reviews: 2022, ratingSrc: "Yelp", platforms: ["Uber Eats","DoorDash"],
          safeDishes: [
            { dish: "Papaya salad (som tum)", note: "on their GF list; fish-sauce dressing, no soy; add shrimp if offered" },
            { dish: "Green or Panang curry", note: "coconut, not cream; chicken/shrimp/tofu; confirm no soy sauce; rice not noodles" },
            { dish: "Tom Kha (coconut soup)", note: "coconut broth, galangal, lemongrass; ask to add chicken or shrimp" },
            { dish: "Pad See Ew, GF version", note: "they offer a GF pad see ew (rice noodle, no wheat soy) — ask for it; chicken" },
          ],
          watchOut: "Khao Soi is EGG NOODLE (wheat) and Hat Yai chicken batter/shared fryer unconfirmed — skip both. Regular pad see ew, stir-fries and fried rice use wheat soy sauce; egg rolls fine only if glass-noodle skin. Say 'gluten allergy' — staff confirm dishes. No beef/pork proteins; curries are coconut, not dairy." },
        { name: "Lotus Thai Bistro", area: "Palo Alto", rating: 3.6, reviews: 476, ratingSrc: "Yelp", platforms: ["Uber Eats","DoorDash","Grubhub"],
          safeDishes: [
            { dish: "Green or pumpkin curry", note: "coconut milk (not dairy); chicken/shrimp/tofu; confirm no soy sauce; with rice" },
            { dish: "Pad Thai", note: "rice noodle, tamarind, egg; chicken/shrimp; ask no soy sauce" },
            { dish: "Chicken larb", note: "lime/fish-sauce dressing, mint, cashew; confirm no soy sauce" },
            { dish: "Tom Kha or Tom Yum soup", note: "coconut or clear lemongrass broth; chicken/shrimp; no dairy, no wheat" },
          ],
          watchOut: "Pad See Ew dropped — its dark soy sauce is wheat. Fried rice, basil stir-fry, popcorn chicken (batter) and khao soi (egg noodle) are wheat. Curries are coconut not cream. Order chicken/shrimp/tofu only, never beef or pork." },
        { name: "Tommy Thai", area: "Mountain View", rating: 3.8, reviews: 1011, ratingSrc: "Yelp", platforms: ["Uber Eats","DoorDash"],
          safeDishes: [
            { dish: "Green or Panang curry", note: "coconut milk; chicken/tofu; confirm no soy sauce; with steamed rice" },
            { dish: "Tom Yum soup", note: "clear lemongrass-galangal-lime broth; chicken/shrimp; listed ingredients have no soy" },
            { dish: "Tom Kha soup", note: "coconut broth (not dairy); add chicken or shrimp" },
            { dish: "Larb tofu or papaya salad", note: "lime dressing, mint, chili; confirm no soy sauce in dressing" },
          ],
          watchOut: "Pineapple fried rice dropped — fried rice and pan-fried noodles are wheat soy sauce. Grilled chicken skewers: marinade may contain soy — confirm. Wings are battered/sauced (wheat). Choose chicken/tofu/shrimp; skip beef/pork." },
        { name: "Amarin Thai Cuisine", area: "Mountain View", rating: 3.9, reviews: 64, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Panang Curry", note: "coconut-based (not dairy); chicken/tofu; confirm no soy sauce; with rice" },
            { dish: "Red Curry", note: "coconut; chicken/tofu/shrimp; confirm no soy sauce" },
            { dish: "Pad Thai", note: "rice noodle + tamarind; chicken or shrimp, decline pork belly; ask no soy sauce" },
            { dish: "Coconut prawn soup (Tom Kha Goong)", note: "coconut broth with shrimp; no dairy, no wheat" },
          ],
          watchOut: "Spicy Basil Fried Rice dropped — fried rice and stir-fries use wheat soy sauce. Pad Thai often comes with pork belly — request chicken/shrimp. Curries are coconut, not cream. No beef/pork." },
        { name: "Thaiphoon", area: "Palo Alto", rating: 3.5, reviews: 604, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Pad Thai", note: "rice noodle; chicken/shrimp/tofu; say gluten-free — no soy sauce; no pork/beef" },
            { dish: "Green or Red Curry", note: "coconut milk; chicken/tofu; confirm no soy sauce; with rice" },
            { dish: "Tom Yum or Tom Kha soup", note: "chicken or shrimp; no dairy, no wheat" },
            { dish: "Papaya salad with shrimp", note: "lime/fish-sauce dressing, peanuts; no soy" },
          ],
          watchOut: "Pad See Ew dropped (wheat soy sauce); fried rice and stir-fries too. Chicken satay marinade: confirm no soy. Restaurant says it accommodates gluten-free on request — say so when ordering. Always specify chicken/tofu/shrimp; no beef or pork." },
      ],
    },
    {
      category: "Chinese",
      restaurants: [
        { name: "Kirin Chinese Restaurant", area: "Mountain View", rating: 3.6, reviews: 645, ratingSrc: "Yelp", platforms: ["Uber Eats"],
          safeDishes: [
            { dish: "Steamed whole fish (ginger-scallion)", note: "ask NO soy sauce drizzle — ginger, scallion, hot oil only" },
            { dish: "Fish or chicken congee (porridge)", note: "rice porridge; confirm no soy sauce; skip pork versions" },
            { dish: "Shrimp rice-noodle roll (cheung fun)", note: "rice noodle; ask NO sweet soy sauce on top" },
            { dish: "Salt & pepper shrimp or squid", note: "confirm cornstarch-only dredge, no flour; shared fryer caution" },
          ],
          watchOut: "Kung Pao chicken dropped — stir-fries use wheat soy/oyster sauce. Har gow and dumpling wrappers are wheat starch; buns, chow mein, char siu are wheat/pork. Steamed and congee dishes are the safe zone — say 'no soy sauce'. Cantonese menu is pork-heavy." },
        { name: "P.F. Chang's", area: "Palo Alto", rating: null, reviews: null, ratingSrc: null,
          safeDishes: [
            { dish: "GF Chang's Chicken Lettuce Wraps", note: "order the GF version (dedicated GF wok); no dairy per chain guide — confirm" },
            { dish: "GF Ginger Chicken with Broccoli", note: "on the GF menu; dairy-free per chain guide — confirm at order" },
            { dish: "GF Buddha's Feast, steamed", note: "steamed tofu & veg, GF menu; vegan" },
            { dish: "GF Singapore Street Noodles", note: "rice noodles, shrimp & chicken, GF menu; confirm no dairy" },
          ],
          watchOut: "Kung Pao and Miso Glazed Salmon dropped — not on the GF menu (wheat soy/miso). Always say 'gluten-free' so it triggers the GF wok protocol. Chain uses milk in surprising places (dumplings, spring rolls, egg rolls, bao) — ask for the allergen guide. No Mongolian beef, pork dumplings, char siu." },
      ],
    },
    {
      category: "Japanese & sushi",
      restaurants: [
        { name: "Jin Sho", area: "Palo Alto", rating: 4.8, reviews: 230, ratingSrc: "Uber Eats", platforms: ["Uber Eats"],
          safeDishes: [
            { dish: "Assorted sashimi", note: "raw fish; ask for tamari (they have it) — no soy sauce" },
            { dish: "Nigiri (omakase or by the piece)", note: "fish + rice; tamari; skip eel & any pre-sauced/marinated pieces" },
            { dish: "Edamame", note: "plain salted; no dairy, no wheat" },
          ],
          watchOut: "Chicken teriyaki dropped — teriyaki is wheat soy. Server confirmed only sashimi/nigiri are safe for gluten-free; yuzu-soy on the yellowtail jalapeño is soy. Miso soup/miso cod: confirm miso is wheat-free. Skip tempura, cream-cheese rolls and imitation crab (wheat)." },
        { name: "Hanabi Sushi", area: "Mountain View", rating: 4.7, reviews: null, ratingSrc: "Uber Eats", platforms: ["Uber Eats","DoorDash"],
          safeDishes: [
            { dish: "Sashimi combo", note: "raw fish only; bring/ask for tamari, no soy sauce" },
            { dish: "Chirashi bowl", note: "fish over rice; ask no soy-marinated pieces, no eel sauce; tamari" },
            { dish: "Nigiri", note: "fish + rice; skip eel & sauced pieces; tamari" },
            { dish: "Edamame", note: "plain; no dairy, no wheat" },
          ],
          watchOut: "Chicken teriyaki bento dropped — teriyaki, tempura, katsu and udon are wheat. Poke bowls use soy-based sauce — skip. Baked/deep-fried rolls and anything with imitation crab, cream cheese or panko are out. Confirm tamari is stocked." },
        { name: "Eighty-Eight Sushi & Ramen", area: "Mountain View", rating: 4.2, reviews: null, ratingSrc: "Uber Eats", platforms: ["Uber Eats"],
          safeDishes: [
            { dish: "Sashimi", note: "raw fish; tamari not soy — site lists GF options, confirm tamari" },
            { dish: "Nigiri / plain fish rolls (tekka, salmon)", note: "fish + rice + nori; no eel, no imitation crab, no tempura" },
            { dish: "Edamame", note: "order plain — garlic-chili version has soy-based sauce" },
          ],
          watchOut: "Chicken karaage dropped (wheat batter/soy marinade). Ramen is tonkotsu PORK broth with wheat noodles. Tempura, tonkatsu, teriyaki, agedashi (tentsuyu = soy) all wheat. Seaweed salad dressing usually has soy — confirm. Cream-cheese jalapeño poppers are dairy." },
        { name: "Sushi Tomi", area: "Mountain View", rating: 4.3, reviews: 2620, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Sashimi / nigiri (salmon, tuna, yellowtail, shrimp)", note: "no eel (sweet soy glaze); ask for tamari" },
            { dish: "Chirashi bowl", note: "fish over rice; ask no marinated/sauced pieces; tamari" },
            { dish: "Edamame", note: "plain salted; no dairy, no wheat" },
          ],
          watchOut: "Agedashi tofu (tentsuyu soy broth) and chicken teriyaki dropped — both wheat soy. Tempura, udon, katsu, unagi sauce and imitation-crab rolls are wheat. Seaweed salad dressing: confirm. Spicy mayo is egg-based (OK); Philadelphia roll is dairy. Confirm tamari on hand." },
        { name: "MJ Sushi", area: "Palo Alto", rating: 4.3, reviews: 346, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Nigiri / Sashimi Deluxe", note: "fish/shellfish + rice; tamari not soy; skip eel & sauced pieces" },
            { dish: "Deluxe Chirashi", note: "fish over rice; ask no marinated pieces, no eel sauce" },
            { dish: "Avocado cucumber roll", note: "veg, rice, nori only; no imitation crab" },
            { dish: "Edamame", note: "plain; no dairy, no wheat" },
          ],
          watchOut: "Shrimp/chicken rolls dropped: shrimp tempura is wheat batter, California/crab rolls use imitation crab (wheat starch), teriyaki is wheat soy. Skip house rolls with eel sauce, tempura crunch or cream cheese (Philadelphia = dairy). Confirm tamari is available." },
        { name: "Fuki Sushi", area: "Palo Alto", rating: 3.8, reviews: 1031, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Nigiri / sashimi assortment", note: "fish/shellfish; ask for tamari, no soy; skip eel & sauced pieces" },
            { dish: "Shishamo (salt-grilled smelt)", note: "grilled with salt; no sauce, no dairy, no wheat" },
            { dish: "Hiyayakko (cold tofu)", note: "ask NO soy sauce — ginger/scallion only, tamari on side" },
            { dish: "Edamame / plain hosomaki (tekka, kappa)", note: "no imitation crab, no tempura" },
          ],
          watchOut: "Chicken teriyaki, tempura and agedashi tofu dropped — all wheat (soy glaze, batter, tentsuyu). Kushiyaki are usually tare (soy) glazed — ask shio (salt). Tonkatsu is pork+panko; sukiyaki/nabe broths are soy. Awabi Butter is dairy; cream-cheese rolls dairy. Confirm tamari stocked." },
      ],
    },
    {
      category: "Vietnamese",
      restaurants: [
        { name: "Pho To Chau", area: "Mountain View", rating: 4.2, reviews: 977, ratingSrc: "Yelp", platforms: ["Uber Eats","DoorDash"],
          safeDishes: [
            { dish: "Pho Ga", note: "chicken broth, rice noodles; NO hoisin at table; confirm broth has no soy" },
            { dish: "Bun grilled chicken (vermicelli)", note: "rice vermicelli, fish-sauce nuoc cham; confirm chicken marinade has no soy" },
            { dish: "Goi Cuon (fresh spring rolls)", note: "rice paper; shrimp-only (standard has pork); nuoc cham, NOT hoisin-peanut dip" },
            { dish: "Grilled chicken rice plate (com ga nuong)", note: "chicken + rice; confirm marinade has no soy/oyster sauce" },
          ],
          watchOut: "Default pho broth is BEEF — order Pho Ga. Banh mi is wheat bread; cha gio (fried egg rolls) wrappers are often wheat — skip; wonton/chow mein are wheat. Hoisin (wheat) sits on every table — don't add. Bun Bo Hue is beef/pork. Grilled-meat marinades sometimes contain soy — confirm." },
        { name: "Pho Anh", area: "Mountain View", rating: 4.4, reviews: 79, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Pho Ga", note: "chicken broth only, rice noodles; no hoisin; confirm no soy in broth" },
            { dish: "Grilled chicken rice plate", note: "chicken + rice; confirm marinade has no soy/oyster sauce" },
            { dish: "Shrimp spring rolls (fresh, rice paper)", note: "shrimp only; nuoc cham, not hoisin-peanut sauce" },
          ],
          watchOut: "House pho broth is beef — order pho ga; skip brisket/rib pho, beef stew and all pork. Restaurant says gluten-free requests are met — say 'no soy sauce, no hoisin'. Fried egg rolls and any bread (banh mi) are wheat." },
        { name: "Pho Avenue", area: "Mountain View", rating: 4, reviews: 509, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Pho Ga", note: "chicken-broth pho, rice noodles; no hoisin; confirm no soy in broth" },
            { dish: "Chicken vermicelli (bun ga nuong)", note: "rice vermicelli, nuoc cham; confirm chicken marinade has no soy" },
            { dish: "Fresh spring rolls — shrimp or vegetarian", note: "rice paper; ask shrimp-only (menu default is shrimp+pork); no hoisin dip" },
            { dish: "Ga nuong (grilled chicken) rice plate", note: "chicken + rice; confirm marinade has no soy/oyster sauce" },
          ],
          watchOut: "Default pho broth is beef — choose pho ga. Wonton soup, chow mein and banh mi are wheat; deep-fried egg rolls likely wheat wrappers. Hoisin is wheat — use only nuoc cham/sriracha. Avoid pork in bun bowls and rolls." },
        { name: "Tamarine", area: "Palo Alto", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash"], unverified: true,
          safeDishes: [
            { dish: "Lemongrass chicken with jasmine rice", note: "Confirm marinade uses fish sauce only — no soy/oyster sauce" },
            { dish: "Prawns in tamarind or ginger sauce, steamed rice", note: "Ask no soy/oyster sauce; tamari if available" },
            { dish: "Green papaya salad with shrimp", note: "Fish-sauce dressing; confirm no fried wheat topping" },
          ],
          watchOut: "Garlic noodles are wheat; shaking beef is red meat; many stir-fry sauces contain soy or oyster sauce — ask for fish-sauce-based dishes." },
        { name: "Pho Vi Hoa", area: "Los Altos", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats"], unverified: true,
          safeDishes: [
            { dish: "Pho ga (chicken pho)", note: "Chicken broth, not beef; rice noodles; skip hoisin (wheat)" },
            { dish: "Bun ga nuong (grilled chicken over rice vermicelli)", note: "Nuoc cham (fish sauce) only; confirm marinade has no soy sauce" },
            { dish: "Goi cuon (shrimp rice-paper rolls)", note: "Rice paper; ask nuoc cham instead of hoisin-peanut sauce" },
          ],
          watchOut: "Standard pho is beef broth — order pho ga; hoisin and soy sauce contain wheat; egg rolls use wheat wrappers." },
      ],
    },
    {
      category: "Korean",
      restaurants: [
        { name: "So Gong Dong Tofu House", area: "Palo Alto", rating: 4, reviews: 1978, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Seafood soft tofu soup (soondubu)", note: "oyster/shrimp/clam; ask seafood or veg broth, no beef; confirm no soy sauce in base" },
            { dish: "Vegetable soft tofu soup", note: "request veg broth; confirm chili base has no soy sauce" },
            { dish: "Bibimbap (tofu or seafood, not beef)", note: "NO gochujang (wheat) — sesame oil + salt; confirm namul unseasoned w/ soy" },
          ],
          watchOut: "Seafood pancake dropped — wheat flour batter. Gochujang and most banchan (japchae, braised items) carry wheat soy — eat only kimchi/bean sprouts/spinach after confirming. Soondubu base often has beef stock or soy sauce — ask every time. Cheese tofu soup is dairy; bulgogi/galbi/pork are out." },
      ],
    },
    {
      category: "Filipino",
      restaurants: [
        { name: "Pamilya", area: "Redwood City", rating: 4.2, reviews: 134, ratingSrc: "Yelp", platforms: ["Uber Eats","DoorDash"],
          safeDishes: [
            { dish: "Sinigang (tamarind soup) — shrimp or fish", note: "tamarind/veg broth; NOT the pork version; confirm no soy" },
            { dish: "Ginataang kalabasa (squash in coconut milk)", note: "coconut, not dairy; usually shrimp — confirm no pork; no soy" },
            { dish: "Garlic shrimp bowl", note: "shrimp + garlic rice; confirm cooked in oil not butter, no soy sauce" },
          ],
          watchOut: "Chicken adobo dropped — adobo is soy-sauce braise (wheat). BBQ chicken skewers marinade is soy/banana ketchup — only if they make it GF on request (they say GF available). Lumpia wrappers are wheat. Sisig, lechon, longganisa, kaldereta are pork/beef; kare-kare has beef/oxtail." },
        { name: "Tapsilog Bistro", area: "Campbell", rating: 4.3, reviews: 1618, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Bangus (milkfish) Silog", note: "vinegar-garlic marinated fish; confirm no soy; shared fryer caution" },
            { dish: "Chicken Tocino Silog", note: "sweet-cured chicken; confirm cure has no soy sauce; not pork tocino" },
            { dish: "Garlic fried rice + egg (sinangag)", note: "confirm rice is fried with garlic/oil only, no soy sauce" },
          ],
          watchOut: "Chicken Adobosilog dropped — adobo is soy-sauce based (wheat). Lumpia, burritos (flour tortilla + cheese), fried calamari (batter) are wheat/dairy. Tapa, longganisa, lechon kawali, sisig, bacon are beef/pork. Tocino cures and marinades sometimes include soy — ask." },
      ],
    },
    {
      category: "Indian & Nepalese",
      restaurants: [
        { name: "Darbar Indian Cuisine", area: "Palo Alto", rating: 4.7, reviews: 10000, ratingSrc: "DoorDash",
          safeDishes: [
            { dish: "Chana Masala (vegan)", note: "with steamed rice, not naan; ask no ghee/butter" },
            { dish: "Aloo Gobi (order 'dry')", note: "no butter/ghee; rice on the side, no bread" },
            { dish: "Chicken curry (tomato-based)", note: "confirm no cream/ghee; naturally wheat-free, eat with rice" },
            { dish: "Chicken vindaloo (vinegar-chili)", note: "confirm no cream; no flour thickener; rice not naan" },
          ],
          watchOut: "naan/roti/paratha/samosa pastry are wheat; tandoori & tikka marinades use yogurt; butter chicken/korma/dal makhani/paneer are dairy; hing (asafoetida) blends can carry wheat flour — ask; lamb/goat are red meat" },
        { name: "Broadway Masala", area: "Redwood City", rating: 4.7, reviews: 10000, ratingSrc: "DoorDash",
          safeDishes: [
            { dish: "Chana Masala", note: "ask no butter/ghee; with steamed rice, no naan" },
            { dish: "Aloo Gobi", note: "ask no butter; rice not bread" },
            { dish: "Baingan Bharta", note: "ask no cream/butter; wheat-free" },
            { dish: "Chicken Chettinad (chili-spice, dark meat)", note: "confirm no cream/yogurt; no flour; eat with rice" },
          ],
          watchOut: "naan, roti, paratha, samosa & pakora batter (if cut with wheat flour) are wheat traps; butter chicken, korma, tikka masala, dal makhani, paneer are dairy; tikka/tandoori marinades use yogurt; lamb/goat are red meat" },
        { name: "Chaat Bhavan", area: "Mountain View", rating: 4.7, reviews: 459, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Masala Dosa (rice-lentil crepe + potato)", note: "batter is rice/urad, not wheat; ask no butter/ghee on griddle" },
            { dish: "Idli / sambar", note: "steamed rice-lentil cakes; confirm sambar tempered in oil not ghee" },
            { dish: "Uthappam (onion/tomato)", note: "rice-lentil pancake; ask no butter, no cheese/paneer topping" },
            { dish: "Chole (chickpeas) with rice", note: "NOT with bhature/puri (wheat); ask no ghee/butter" },
          ],
          watchOut: "pure vegetarian (no red meat) but rava dosa/rava idli use semolina (wheat), pav bhaji, bhature, puri, samosa & papdi chaat are wheat; most chaats are topped with yogurt; paneer, lassi, kheer, butter on dosas — always say no curd/butter/paneer" },
        { name: "Namaste Indian Cuisine", area: "Palo Alto", rating: 4.6, reviews: 1000, ratingSrc: "DoorDash",
          safeDishes: [
            { dish: "Chana Masala", note: "ask no ghee/butter; with steamed rice, no naan" },
            { dish: "Aloo Gobi", note: "ask no butter; rice not bread" },
            { dish: "Baingan Bharta", note: "ask no cream/butter; wheat-free" },
            { dish: "Chicken Biryani", note: "rice-based; confirm no ghee/butter & no yogurt in the marinade" },
          ],
          watchOut: "naan/roti/paratha, samosa pastry are wheat; paneer, korma, malai kofta, raita, 'creamy curries' are dairy; tandoori/tikka chicken uses a yogurt marinade; lamb biryani is red meat" },
        { name: "Zareen's", area: "Palo Alto", rating: 4.5, reviews: 2992, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Madras Chicken Curry (coconut-milk based)", note: "menu lists dairy-free; confirm GF label; with rice, no roti" },
            { dish: "Grilled boneless chicken (herb-spice marinade)", note: "menu labels DF/GF/egg-free; skip the paratha/roll version" },
            { dish: "Tarka Daal (yellow lentils)", note: "labeled vegan + gluten-free; ask no ghee tarka" },
            { dish: "Chana / chickpea dishes", note: "ask no butter/ghee; rice on the side" },
          ],
          watchOut: "menu is labeled GF/DF — use it; paratha rolls, naan, samosas, chapli/kabab binders are wheat traps; tikka masala/butter chicken (cream), yogurt tikkas; aloo tikki may use bread crumbs — confirm; celiac reviewers report cross-contact; beef/lamb dishes are red meat" },
        { name: "Delhi to Kathmandu", area: "Sunnyvale", rating: 4.3, reviews: 198, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Chicken curry with white rice", note: "Nepali-style; confirm no cream/ghee; no bread" },
            { dish: "Kukhura Ko Sekuwa (clay-oven grilled chicken)", note: "spice/garlic/ginger marinade; confirm no yogurt, no soy sauce" },
            { dish: "Chana / chole", note: "ask no ghee/butter; eat with rice, not naan/roti" },
          ],
          watchOut: "momos (wheat wrappers), thukpa & chowmein (wheat noodles), chili chicken (flour batter + soy sauce) are all wheat; naan/roti; creamy tikka/korma/butter curries & paneer are dairy; mutton/goat dishes are red meat; tandoori uses yogurt" },
        { name: "Everest Cuisine", area: "Mountain View", rating: 4.1, reviews: 659, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Chicken Sekuwa (grilled, mustard-oil marinade)", note: "menu lists herbs/spices/garlic/ginger; confirm no yogurt/soy sauce" },
            { dish: "Nepali-style chicken curry", note: "confirm no cream/ghee; with steamed rice" },
            { dish: "Chana masala", note: "ask no ghee/butter; rice not naan" },
          ],
          watchOut: "momos (wheat wrappers), thukpa/chowmein (wheat noodles), chili chicken batter & soy sauce are wheat; naan/roti; korma/butter/creamy curries & paneer are dairy; goat/lamb (mutton) is red meat; tandoori marinade has yogurt" },
        { name: "Amber India", area: "Los Altos", rating: 4.1, reviews: null, ratingSrc: "Tripadvisor",
          safeDishes: [
            { dish: "Chana Masala", note: "ask no butter/ghee; steamed rice, not naan" },
            { dish: "Baingan Bharta", note: "ask no cream; wheat-free" },
            { dish: "Aloo dish (gobi / jeera)", note: "ask no ghee/butter; rice not bread" },
            { dish: "Chicken curry (tomato/coconut)", note: "confirm no cream/yogurt; no flour thickener" },
          ],
          watchOut: "naan, kulcha, roti, paratha & samosa pastry are wheat; signature butter chicken, korma, dal makhani, paneer are dairy; yogurt tikka marinades; goat/lamb curries are red meat; ask about hing blends (may contain wheat)" },
        { name: "Curry Up Now", area: "Palo Alto", rating: null, reviews: null, ratingSrc: null,
          safeDishes: [
            { dish: "'Hella Vegan' BOWL (rice or cauliflower rice)", note: "bowl only, never burrito; add tofu; chicken is yogurt-marinated — confirm" },
            { dish: "Chana masala bowl", note: "listed naturally GF; ask no cream/yogurt/sour cream; rice base" },
            { dish: "'Peace Love Vegan' bowl", note: "listed GF + vegan; rice/cauli-rice base, no naan" },
          ],
          watchOut: "burritos use flour tortillas — always order the bowl; Naughty Naan, deconstructed samosa (wheat pastry), Sexy Fries (cheese + shared fryer) are out; tikka masala has cream; chaat is topped with yogurt/sour cream; shared prep surfaces and fryers" },
        { name: "Saravanaa Bhavan", area: "Sunnyvale", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats"], unverified: true,
          safeDishes: [
            { dish: "Plain dosa with sambar & coconut chutney", note: "Rice-lentil batter; ask oil not ghee/butter; NOT rava (semolina) dosa" },
            { dish: "Idli sambar", note: "Steamed rice-lentil cakes; sambar is dairy-free (confirm no ghee tempering)" },
            { dish: "Lemon rice or tamarind rice", note: "Confirm cooked in oil, not ghee" },
          ],
          watchOut: "Vegetarian only (no chicken); ghee is everywhere — say 'no ghee, no butter'; rava dosa, poori, chapati and upma are wheat; raita/paneer/curd rice are dairy." },
      ],
    },
    {
      category: "Pizza & Italian",
      restaurants: [
        { name: "Amici's East Coast Pizzeria", area: "Menlo Park", rating: null, reviews: null, ratingSrc: null, platforms: ["Uber Eats","Grubhub"],
          safeDishes: [
            { dish: "12\" GF-crust marinara pizza (no cheese)", note: "Mariposa GF crust: rice/tapioca/potato — no dairy/egg listed; hold cheese" },
            { dish: "12\" GF crust + Daiya vegan cheese, veggie", note: "Daiya is free of charge; no parmesan dusting" },
            { dish: "GF crust + Daiya + grilled chicken", note: "confirm chicken is grilled, unbreaded, no dairy marinade; no pork toppings" },
          ],
          watchOut: "only the 12\" GF crust is wheat-free — regular/thin crust, garlic bread & pasta are wheat; GF pies baked on a separate screen but flour is in the air (not celiac-safe); standard mozzarella & parmesan are dairy; pepperoni/sausage/prosciutto/meatballs are red meat" },
        { name: "Curry Pizza House", area: "Palo Alto", rating: null, reviews: 384, ratingSrc: "Yelp", platforms: ["Uber Eats","Grubhub"],
          safeDishes: [
            { dish: "Curry Veggie Delight on 12\" GF vegan crust", note: "vegan cheese + curry sauce (dairy-free); crust listed gluten-free & vegan" },
            { dish: "Build-your-own on GF vegan crust", note: "vegan cheese; Jain red sauce or curry sauce only; veggie toppings" },
          ],
          watchOut: "vegan cheese is only offered on the GF vegan crust — all regular crusts are wheat + dairy cheese; malai & shahi sauces contain cream; chicken tikka toppings are yogurt-marinated; shared ovens/prep with wheat dough" },
        { name: "Il Fornaio", area: "Mountain View", rating: 4.2, reviews: 380, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "GF pasta al pomodoro", note: "ask GF pasta (corn/rice/quinoa); marinara only, no parmesan/butter" },
            { dish: "Salmone alla griglia", note: "grilled salmon, lemon, EVOO, spinach, roasted potatoes; ask no butter" },
            { dish: "Pollo Toscano (rosemary chicken)", note: "roasted cauliflower + potatoes; confirm no butter/flour dusting" },
            { dish: "Grigliata di pesce misto", note: "fish, scallops, prawns, lemon-olive oil sauce; ask no butter" },
          ],
          watchOut: "no GF pizza here — all pizza, bread basket, focaccia, ravioli/cannelloni are wheat; Cesarina salad has croutons + grana; marsala/cream/butter sauces (pollo ai funghi); prosciutto, pancetta, salsiccia are red meat; GF pasta is prepared in a shared kitchen" },
        { name: "Pizzeria Delfina", area: "Palo Alto", rating: 3.7, reviews: 684, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Pizza Marinara on GF crust (+$4)", note: "tomato, garlic, oregano, oil — cheeseless; confirm GF crust has no dairy/egg" },
            { dish: "Daily pasta with GF pasta, tomato sauce", note: "GF pasta on request (+$3-4); no butter/parmesan/pecorino" },
            { dish: "Simple green/tomato salad", note: "vinaigrette; no cheese, no croutons/breadcrumbs" },
          ],
          watchOut: "Marinara is the only cheeseless pie — every other pizza has mozzarella/burrata; regular crust, focaccia, bread & pastas are wheat; salumi (pepperoni, pancetta, guanciale, prosciutto) are red meat; not a dedicated GF kitchen, mixed reviews — say 'allergy'" },
        { name: "Patxi's Pizza", area: "Palo Alto", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats","Grubhub"], unverified: true,
          safeDishes: [
            { dish: "Gluten-free thin crust with vegan cheese, chicken & vegetables", note: "Order GF crust + vegan cheese; confirm chicken is plain, not marinated" },
            { dish: "GF crust with vegan cheese, mushrooms, olives, peppers", note: "Vegan cheese, GF crust; ask no parmesan dusting" },
            { dish: "Mixed green salad", note: "No cheese; vinaigrette (confirm dairy-free)" },
          ],
          watchOut: "GF crusts are baked in a shared flour kitchen (cross-contact); pepperoni/sausage are pork; regular mozzarella is dairy — must specify vegan cheese." },
      ],
    },
    {
      category: "American",
      restaurants: [
        { name: "The Counter", area: "Palo Alto", rating: null, reviews: null, ratingSrc: null, platforms: ["Uber Eats"],
          safeDishes: [
            { dish: "Grilled chicken breast 'burger in a bowl'", note: "over greens or on Udi's GF bun; no cheese, no ranch/aioli; vinaigrette" },
            { dish: "Turkey burger, GF bun or bowl, no cheese", note: "confirm patty is on the GF menu (no breadcrumbs); veggie toppings" },
            { dish: "Fries / sweet potato fries", note: "ask: fryer shared with breaded items on some days" },
          ],
          watchOut: "flag 'Allergy Order' (prints in red for the kitchen); regular buns, onion strings & fried pickles are wheat; cheese, ranch, thousand-island, garlic aioli are dairy; beef, bacon, veggie-burger binders — check; GF bun (Udi's) contains egg" },
        { name: "True Food Kitchen", area: "Palo Alto", rating: 4.3, reviews: 2403, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Grilled chicken over greens", note: "no cheese; vinaigrette; check allergen guide for the dressing" },
            { dish: "Street tacos (chicken or fish)", note: "confirm corn tortillas; no cotija/crema; grilled not fried" },
            { dish: "Grilled salmon plate", note: "confirm sides (no farro/couscous) & no butter; per allergen guide" },
            { dish: "Edamame", note: "sea salt; wheat- & dairy-free" },
          ],
          watchOut: "Ancient Grains bowl contains FARRO (wheat) — skip or ask quinoa-only; edamame dumplings, lasagna, sandwiches & regular pizza are wheat; teriyaki/poke sauces may carry soy sauce; many bowls default to cheese/dairy dressing; burgers are beef; not a GF kitchen — ask for the allergen guide" },
        { name: "Starbird Chicken", area: "Palo Alto", rating: 4, reviews: 117, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Crispy chicken tenders (GF coating)", note: "menu marks 'GF' (gluten-friendly); confirm no buttermilk; shared-fryer risk" },
            { dish: "Chicken chop salad", note: "no cheese; vinaigrette not ranch; skip any crispy wheat topping" },
            { dish: "Tater tots", note: "veg-oil; ask about shared fryer with churros/breaded items" },
          ],
          watchOut: "sandwiches/wraps use wheat buns — order tenders/salad instead; ranch, buttermilk & 'creamy' sauces are dairy; kitchen has gluten on site ('GF' = gluten-friendly, cross-contact possible); no red meat on the menu" },
        { name: "Sweetgreen", area: "Palo Alto", rating: 3.6, reviews: 442, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Guacamole Greens + roasted chicken", note: "no cheese by default; lime-cilantro vinaigrette; confirm chips are corn" },
            { dish: "Harvest Bowl, no goat cheese", note: "wild rice, chicken, sweet potato, apple, almonds, balsamic vin." },
            { dish: "Custom warm bowl: wild rice + roasted chicken", note: "no cheese, no breadcrumbs; vinaigrette not caesar/ranch/goddess" },
          ],
          watchOut: "salmon marinade currently contains wheat; crispy/hot-honey chicken is breaded; za'atar breadcrumbs, croutons & the new flour-tortilla wraps are wheat; caesar, ranch, green goddess dressings and feta/goat/parmesan are dairy; bacon add-on is red meat; check the allergen guide — it changes" },
        { name: "Chick-fil-A", area: "Sunnyvale", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats","Grubhub"], unverified: true,
          safeDishes: [
            { dish: "Grilled chicken nuggets", note: "Grilled, not breaded; per allergen chart wheat- and milk-free (confirm current)" },
            { dish: "Waffle potato fries", note: "Cooked in a fryer separate from breaded chicken (confirm)" },
            { dish: "Market salad with grilled chicken", note: "No cheese; skip granola/crouton toppings; use light vinaigrette" },
          ],
          watchOut: "All breaded chicken and buns are wheat; grilled chicken sandwich bun is wheat — get grilled nuggets/filet only; sauces like Polynesian are fine, ranch is dairy." },
      ],
    },
    {
      category: "Seafood & poke",
      restaurants: [
        { name: "Pacific Catch", area: "Palo Alto", rating: 4.2, reviews: 547, ratingSrc: "Yelp", platforms: ["Uber Eats","DoorDash","Grubhub"],
          safeDishes: [
            { dish: "Grilled fish tacos (mahi/salmon)", note: "order from the GF menu; confirm corn tortillas; no crema/cotija" },
            { dish: "Ahi poke bowl with tamari", note: "ask GF tamari; skip wonton chips & crispy toppings" },
            { dish: "Grilled fresh catch, rice + veg", note: "grilled in oil not butter; no teriyaki glaze unless tamari-based" },
          ],
          watchOut: "ask for the gluten-free menu — kitchen stocks tamari but standard shoyu/ponzu/teriyaki have wheat; clam chowder, fish & chips, tempura, calamari are wheat; crema/cheese on tacos & butter finishes are dairy; no red meat needed — pick fish/shrimp/chicken" },
        { name: "Poké Bar", area: "Mountain View", rating: 4.4, reviews: 464, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Ahi tuna bowl with GF soy sauce", note: "plain ahi, NOT pre-mixed 'spicy ahi' (contains wheat)" },
            { dish: "Salmon bowl with GF soy sauce", note: "GF sauces are labeled; spicy/wasabi mayo are egg-based, fine" },
            { dish: "Veggie/tofu GF bowl", note: "tofu, sweet onion, edamame, cucumber; ask GF shoyu" },
          ],
          watchOut: "regular shoyu, spicy ahi mix, imitation crab, crispy onions/wonton crisps & seaweed salad (often soy-sauce dressed) are wheat traps; no dairy or red meat on the menu; skip Spam; not a dedicated GF facility" },
        { name: "Poke House", area: "Palo Alto", rating: 4.1, reviews: 253, ratingSrc: "Yelp",
          safeDishes: [
            { dish: "Tuna poke bowl, GF house shoyu", note: "GF sauces are labeled; they stock GF soy-sauce packets — ask" },
            { dish: "Salmon poke bowl, GF shoyu", note: "no sweet unagi (wheat), no miso aioli (confirm miso)" },
            { dish: "Shrimp or veggie bowl", note: "GF-labeled sauce only; rice base, fresh toppings" },
          ],
          watchOut: "regular house shoyu, sweet unagi, citrus ponzu & miso aioli can carry wheat — use only GF-labeled sauces; imitation crab, crispy onions, wonton chips are wheat; no dairy or red meat on the menu; cross-contact possible" },
        { name: "Pokeworks", area: "Mountain View", rating: null, reviews: null, ratingSrc: null,
          safeDishes: [
            { dish: "Ahi tuna bowl, GF-marked sauce", note: "per allergen guide: aiolis/classic are GF; NOT shoyu or sweet shoyu" },
            { dish: "Salmon bowl, GF-marked sauce", note: "sriracha/wasabi aioli are egg-based (no dairy); skip crispy toppings" },
            { dish: "Shrimp or tofu bowl", note: "confirm tofu/shrimp marinade is wheat-free on the allergen PDF" },
          ],
          watchOut: "shoyu, sweet shoyu (mis-marked GF in some stores), imitation crab, crispy onions, wonton crisps & the chicken (teriyaki-style) are wheat; use the online allergen guide; no dairy or red meat on the menu" },
        { name: "La Viga Seafood & Cocina Mexicana", area: "Redwood City", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats"], unverified: true,
          safeDishes: [
            { dish: "Ceviche de pescado or camarón", note: "Served with corn tostadas — confirm no flour crackers" },
            { dish: "Camarones a la diabla with rice", note: "Ask oil not butter; no flour tortillas — corn" },
            { dish: "Grilled fish tacos", note: "Corn tortillas; grilled not battered; no cheese/crema" },
          ],
          watchOut: "Mojo de ajo and some sauces use butter; some fish tacos are battered; cheese and crema garnish many plates." },
      ],
    },
    {
      category: "Latin & Caribbean",
      restaurants: [
        { name: "Coconuts Caribbean Restaurant & Bar", area: "Palo Alto", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats","Grubhub"], unverified: true,
          safeDishes: [
            { dish: "Jerk chicken with rice & peas and plantains", note: "Confirm jerk marinade has no soy sauce (many do); coconut rice is dairy-free" },
            { dish: "Curry chicken with rice", note: "Coconut-based; confirm no flour thickener" },
            { dish: "Callaloo & fried plantains", note: "Confirm shared fryer with breaded items" },
          ],
          watchOut: "Oxtail and curry goat are red meat; jerk marinades often contain soy sauce (wheat); festival/dumplings are wheat; coco bread is wheat." },
        { name: "Cascal", area: "Mountain View", rating: null, reviews: null, ratingSrc: null, platforms: ["DoorDash","Uber Eats"], unverified: true,
          safeDishes: [
            { dish: "Chicken & seafood paella", note: "Ask no chorizo (pork); confirm stock is chicken/seafood, no butter" },
            { dish: "Ceviche", note: "Confirm served with plantain/corn chips not bread" },
            { dish: "Garlic shrimp (gambas) tapa", note: "Ask cooked in olive oil not butter; no bread" },
          ],
          watchOut: "Paella often includes chorizo; many tapas come with bread or manchego; croquetas and empanadas are wheat; skirt steak is red meat." },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// OPENING HOURS  (keyed "Name|Area"; per-day 24h local ranges; [] = closed;
// missing key or null = unknown). Populated from Google/Yelp; approximate and
// point-in-time — DoorDash shows true live availability at order time.
// ---------------------------------------------------------------------------

const HOURS = {
  "The Farm|Palo Alto": { mon:[["07:30","18:00"]], tue:[["07:30","18:00"]], wed:[["07:30","20:00"]], thu:[["07:30","20:00"]], fri:[["07:30","20:00"]], sat:[["08:00","20:00"]], sun:[["08:00","20:00"]] },
  "Coupa Cafe|Palo Alto": { mon:[["07:00","20:00"]], tue:[["07:00","20:00"]], wed:[["07:00","20:00"]], thu:[["07:00","20:00"]], fri:[["07:00","20:00"]], sat:[["07:00","20:00"]], sun:[["07:00","20:00"]] },
  "Coupa Café|Palo Alto": { mon:[["07:00","20:00"]], tue:[["07:00","20:00"]], wed:[["07:00","20:00"]], thu:[["07:00","20:00"]], fri:[["07:00","20:00"]], sat:[["07:00","20:00"]], sun:[["07:00","20:00"]] },
  "Joanie's Café|Palo Alto": { mon:[["08:00","14:00"]], tue:[["08:00","14:00"]], wed:[["08:00","14:00"]], thu:[["08:00","14:00"]], fri:[["08:00","14:00"]], sat:[["08:00","14:00"]], sun:[["08:00","14:00"]] },
  "Stacks|Menlo Park": { mon:[["07:00","14:00"]], tue:[["07:00","14:00"]], wed:[["07:00","14:00"]], thu:[["07:00","14:00"]], fri:[["07:00","14:30"]], sat:[["07:00","14:30"]], sun:[["07:00","14:30"]] },
  "Palo Alto Creamery|Palo Alto": { mon:[["08:00","21:00"]], tue:[["08:00","21:00"]], wed:[["08:00","21:00"]], thu:[["08:00","21:00"]], fri:[["08:00","22:00"]], sat:[["08:00","22:00"]], sun:[["08:00","21:00"]] },
  "Hatched|Palo Alto": { mon:[["07:00","16:00"]], tue:[["07:00","16:00"]], wed:[["07:00","16:00"]], thu:[["07:00","16:00"]], fri:[["07:00","16:30"]], sat:[["07:00","16:30"]], sun:[["07:00","16:30"]] },
  "House of Bagels|Mountain View": { mon:[["06:30","15:30"]], tue:[["06:30","15:30"]], wed:[["06:30","15:30"]], thu:[["06:30","15:30"]], fri:[["06:30","15:30"]], sat:[["06:30","15:30"]], sun:[["06:30","15:30"]] },
  "Palmetto Superfoods|Palo Alto": { mon:[["08:00","20:00"]], tue:[["08:00","20:00"]], wed:[["08:00","20:00"]], thu:[["08:00","20:00"]], fri:[["08:00","20:00"]], sat:[["08:00","20:00"]], sun:[["08:00","20:00"]] },
  "Pressed|Palo Alto": { mon:[["07:00","22:00"]], tue:[["07:00","22:00"]], wed:[["07:00","22:00"]], thu:[["07:00","22:00"]], fri:[["07:00","22:00"]], sat:[["07:00","22:00"]], sun:[["07:00","22:00"]] },
  "Vitality Bowls|Palo Alto": { mon:[["07:30","19:00"]], tue:[["07:30","19:00"]], wed:[["07:30","19:00"]], thu:[["07:30","19:00"]], fri:[["07:30","19:00"]], sat:[["09:00","18:00"]], sun:[["09:00","18:00"]] },
  "Bare Bowls|Palo Alto": { mon:[["08:00","16:00"]], tue:[["08:00","16:00"]], wed:[["08:00","16:00"]], thu:[["08:00","16:00"]], fri:[["08:00","16:00"]], sat:[["08:00","16:00"]], sun:[["08:00","16:00"]] },
  "Jamba|Palo Alto": { mon:[["07:00","19:30"]], tue:[["07:00","19:30"]], wed:[["07:00","19:30"]], thu:[["07:00","19:30"]], fri:[["07:00","19:30"]], sat:[["07:30","19:30"]], sun:[["08:00","19:00"]] },
  "True Food Kitchen|Palo Alto": { mon:[["11:00","21:00"]], tue:[["11:00","21:00"]], wed:[["11:00","21:00"]], thu:[["11:00","21:00"]], fri:[["11:00","22:00"]], sat:[["10:00","22:00"]], sun:[["10:00","21:00"]] },
  "Asian Box|Palo Alto": { mon:[["10:30","21:00"]], tue:[["10:30","21:00"]], wed:[["10:30","21:00"]], thu:[["10:30","21:00"]], fri:[["10:30","21:00"]], sat:[["10:30","21:00"]], sun:[["10:30","20:00"]] },
  "Sweetgreen|Palo Alto": { mon:[["10:30","21:00"]], tue:[["10:30","21:00"]], wed:[["10:30","21:00"]], thu:[["10:30","21:00"]], fri:[["10:30","21:00"]], sat:[["10:30","21:00"]], sun:[["10:30","21:00"]] },
  "Go Fish Poke Bar|Palo Alto": { mon:[["11:00","20:00"]], tue:[["11:00","20:00"]], wed:[["11:00","20:00"]], thu:[["11:00","20:00"]], fri:[["11:00","20:00"]], sat:[["11:00","20:00"]], sun:[["11:00","19:00"]] },
  "Poke House|Palo Alto": { mon:[["11:00","21:00"]], tue:[["11:00","21:00"]], wed:[["11:00","21:00"]], thu:[["11:00","21:00"]], fri:[["11:00","21:00"]], sat:[["11:00","21:00"]], sun:[["11:00","21:00"]] },
  "Mendocino Farms|Palo Alto": { mon:[["10:00","21:00"]], tue:[["10:00","21:00"]], wed:[["10:00","21:00"]], thu:[["10:00","21:00"]], fri:[["10:00","21:00"]], sat:[["10:00","21:00"]], sun:[["10:00","21:00"]] },
  "Ike's Love & Sandwiches|Palo Alto": { mon:[["10:00","19:00"]], tue:[["10:00","19:00"]], wed:[["10:00","19:00"]], thu:[["10:00","19:00"]], fri:[["10:00","19:00"]], sat:[["10:00","19:00"]], sun:[["10:00","19:00"]] },
  "Oren's Hummus|Palo Alto": { mon:[["11:00","23:00"]], tue:[["11:00","23:00"]], wed:[["11:00","23:00"]], thu:[["11:00","23:00"]], fri:[["11:00","23:30"]], sat:[["11:00","23:30"]], sun:[["11:00","23:00"]] },
  "Zareen's|Palo Alto": { mon:[["11:00","24:00"]], tue:[["11:00","24:00"]], wed:[["11:00","24:00"]], thu:[["11:00","24:00"]], fri:[["11:00","24:00"]], sat:[["11:00","24:00"]], sun:[["11:00","24:00"]] },
  "SAJJ Mediterranean|Sunnyvale": { mon:[["11:00","21:00"]], tue:[["11:00","21:00"]], wed:[["11:00","21:00"]], thu:[["11:00","21:00"]], fri:[["11:00","21:00"]], sat:[["11:00","21:00"]], sun:[["11:00","21:00"]] },
  "Garden Fresh (vegan Chinese)|Mountain View": { mon:[], tue:[["11:30","14:30"],["16:30","21:30"]], wed:[["11:30","14:30"],["16:30","21:30"]], thu:[["11:30","14:30"],["16:30","21:30"]], fri:[["11:30","14:30"],["16:30","21:30"]], sat:[["11:30","14:30"],["16:30","21:30"]], sun:[["11:30","14:30"],["16:30","21:30"]] },
  "CAVA|Mountain View": { mon:[["10:45","22:00"]], tue:[["10:45","22:00"]], wed:[["10:45","22:00"]], thu:[["10:45","22:00"]], fri:[["10:45","22:00"]], sat:[["10:45","22:00"]], sun:[["10:45","22:00"]] },
  "Los Altos Taqueria|Mountain View": { mon:[["07:00","22:00"]], tue:[["07:00","22:00"]], wed:[["07:00","22:00"]], thu:[["07:00","22:00"]], fri:[["07:00","22:00"]], sat:[["07:00","22:00"]], sun:[["07:00","22:00"]] },
  "Sancho's Taqueria|Palo Alto": { mon:[["10:00","21:00"]], tue:[["10:00","21:00"]], wed:[["10:00","21:00"]], thu:[["10:00","21:00"]], fri:[["10:00","21:00"]], sat:[["10:00","21:00"]], sun:[["10:00","20:00"]] },
  "Reposado|Palo Alto": { mon:[["11:30","15:00"],["16:00","22:00"]], tue:[["11:30","15:00"],["16:00","22:00"]], wed:[["11:30","15:00"],["16:00","22:00"]], thu:[["11:30","15:00"],["16:00","22:00"]], fri:[["11:30","15:00"],["16:00","22:30"]], sat:[["11:00","15:00"],["16:00","22:30"]], sun:[["11:00","15:00"],["16:00","21:00"]] },
  "Celia's Mexican Restaurant|Palo Alto": { mon:[["11:00","21:30"]], tue:[["11:00","21:30"]], wed:[["11:00","21:30"]], thu:[["11:00","21:30"]], fri:[["11:00","22:00"]], sat:[["11:00","22:00"]], sun:[["11:00","21:30"]] },
  "Toluco Mexican Kitchen|East Palo Alto": { mon:[["09:00","21:00"]], tue:[["09:00","21:00"]], wed:[["09:00","21:00"]], thu:[["09:00","21:00"]], fri:[["09:00","21:00"]], sat:[["08:00","21:00"]], sun:[["08:00","16:00"]] },
  "Amarin Thai Cuisine|Mountain View": { mon:[["11:30","14:30"],["17:00","21:00"]], tue:[["11:30","14:30"],["17:00","21:00"]], wed:[["11:30","14:30"],["17:00","21:00"]], thu:[["11:30","14:30"],["17:00","21:00"]], fri:[["11:30","14:30"],["17:00","21:30"]], sat:[["12:00","15:00"],["17:00","21:30"]], sun:[["12:00","15:00"],["17:00","21:00"]] },
  "Thaiphoon|Palo Alto": { mon:[["11:00","14:30"],["16:00","21:00"]], tue:[["11:00","14:30"],["16:00","21:00"]], wed:[["11:00","14:30"],["16:00","21:30"]], thu:[["11:00","14:30"],["16:00","21:30"]], fri:[["11:00","14:30"],["16:00","22:00"]], sat:[["16:00","22:00"]], sun:[["16:00","21:30"]] },
  "P.F. Chang's|Palo Alto": { mon:[["11:00","21:00"]], tue:[["11:00","21:00"]], wed:[["11:00","21:00"]], thu:[["11:00","21:00"]], fri:[["11:00","22:00"]], sat:[["11:00","22:00"]], sun:[["11:00","21:00"]] },
  "Sushi Tomi|Mountain View": { mon:[["11:30","13:30"],["17:00","20:00"]], tue:[], wed:[["11:30","13:30"],["17:00","20:00"]], thu:[["11:30","13:30"],["17:00","20:00"]], fri:[["11:30","13:30"],["17:00","20:30"]], sat:[["11:30","13:30"],["17:00","20:30"]], sun:[["11:30","13:30"],["17:00","20:00"]] },
  "MJ Sushi|Palo Alto": { mon:[["11:30","22:30"]], tue:[["11:30","22:30"]], wed:[["11:30","22:30"]], thu:[["11:30","22:30"]], fri:[["11:30","24:00"]], sat:[["11:30","24:00"]], sun:[["11:30","22:30"]] },
  "Fuki Sushi|Palo Alto": { mon:[["11:30","13:30"],["17:15","20:30"]], tue:[["11:30","13:30"],["17:15","20:30"]], wed:[["11:30","13:30"],["17:15","20:30"]], thu:[["11:30","13:30"],["17:15","20:30"]], fri:[["11:30","13:30"],["17:15","21:00"]], sat:[["17:15","21:00"]], sun:[] },
  "Pho Anh|Mountain View": { mon:[["10:00","20:30"]], tue:[["10:00","20:30"]], wed:[["10:00","20:30"]], thu:[["10:00","20:30"]], fri:[["10:00","22:00"]], sat:[["10:00","22:00"]], sun:[["10:00","22:00"]] },
  "Pho Avenue|Mountain View": { mon:[["11:00","21:00"]], tue:[["11:00","21:00"]], wed:[["11:00","21:00"]], thu:[["11:00","21:00"]], fri:[["11:00","21:00"]], sat:[["11:00","21:00"]], sun:[["11:00","21:00"]] },
  "So Gong Dong Tofu House|Palo Alto": { mon:[["11:30","14:00"],["16:30","20:30"]], tue:[["11:30","14:00"],["16:30","20:30"]], wed:[["11:30","14:00"],["16:30","20:30"]], thu:[["11:30","14:00"],["16:30","20:30"]], fri:[["11:30","14:00"],["16:30","20:30"]], sat:[["11:30","14:30"],["16:30","20:30"]], sun:[["11:30","14:30"],["16:30","20:30"]] },
  "Tapsilog Bistro|Campbell": { mon:[], tue:[["09:00","14:30"],["16:30","20:30"]], wed:[["09:00","14:30"],["16:30","20:30"]], thu:[["09:00","14:30"],["16:30","20:30"]], fri:[["09:00","14:30"],["16:30","21:00"]], sat:[["09:00","21:00"]], sun:[["09:00","16:30"]] },
  "Nick the Greek|Palo Alto": { mon:[["11:00","22:00"]], tue:[["11:00","22:00"]], wed:[["11:00","22:00"]], thu:[["11:00","22:00"]], fri:[["11:00","24:00"]], sat:[["11:00","24:00"]], sun:[["11:00","22:00"]] },
  "Mediterranean Wraps|Palo Alto": { mon:[["11:00","20:30"]], tue:[["11:00","20:30"]], wed:[["11:00","20:00"]], thu:[["11:00","20:00"]], fri:[["11:00","20:30"]], sat:[["11:00","20:30"]], sun:[["11:00","20:30"]] },
  "Hummus Mediterranean Kitchen|Palo Alto": { mon:[["10:30","21:00"]], tue:[["10:30","21:00"]], wed:[["10:30","21:00"]], thu:[["10:30","21:00"]], fri:[["10:30","21:30"]], sat:[["09:30","21:30"]], sun:[["09:30","21:00"]] },
  "Darbar Indian Cuisine|Palo Alto": { mon:[["11:00","14:30"],["17:00","21:30"]], tue:[["11:00","14:30"],["17:00","21:30"]], wed:[["11:00","14:30"],["17:00","21:30"]], thu:[["11:00","14:30"],["17:00","22:00"]], fri:[["11:00","14:30"],["17:00","22:00"]], sat:[["11:30","14:30"],["17:00","22:00"]], sun:[["17:00","21:30"]] },
  "Broadway Masala|Redwood City": { mon:[["11:30","14:30"],["17:00","21:30"]], tue:[["11:30","14:30"],["17:00","21:30"]], wed:[["11:30","14:30"],["17:00","21:30"]], thu:[["11:30","14:30"],["17:00","21:30"]], fri:[["11:30","14:30"],["17:00","22:00"]], sat:[["11:30","15:00"],["17:00","22:00"]], sun:[["11:30","15:00"],["17:00","21:30"]] },
  "Chaat Bhavan|Mountain View": { mon:[["11:00","22:00"]], tue:[["11:00","22:00"]], wed:[["11:00","22:00"]], thu:[["11:00","22:00"]], fri:[["11:00","22:00"]], sat:[["11:00","22:00"]], sun:[["11:00","22:00"]] },
  "Namaste Indian Cuisine|Palo Alto": { mon:[["11:30","14:30"],["17:00","21:00"]], tue:[["11:30","14:30"],["17:00","21:00"]], wed:[["11:30","14:30"],["17:00","21:00"]], thu:[["11:30","14:30"],["17:00","21:00"]], fri:[["11:30","14:30"],["17:00","21:30"]], sat:[["11:30","14:30"],["17:00","21:30"]], sun:[["11:30","14:30"],["17:00","21:00"]] },
  "Delhi to Kathmandu|Sunnyvale": { mon:[["11:00","24:00"]], tue:[["11:00","24:00"]], wed:[["11:00","24:00"]], thu:[["11:00","24:00"]], fri:[["11:00","24:00"]], sat:[["11:00","24:00"]], sun:[["11:00","24:00"]] },
  "Everest Cuisine|Mountain View": { mon:[["11:00","23:00"]], tue:[], wed:[["11:00","23:00"]], thu:[["11:00","23:00"]], fri:[["11:00","23:00"]], sat:[["11:00","23:00"]], sun:[["11:00","23:00"]] },
  "Amber India|Los Altos": { mon:[["11:30","14:30"],["17:00","21:30"]], tue:[["11:30","14:30"],["17:00","21:30"]], wed:[["11:30","14:30"],["17:00","21:30"]], thu:[["11:30","14:30"],["17:00","21:30"]], fri:[["11:30","14:30"],["17:00","21:30"]], sat:[["11:30","14:30"],["17:00","21:30"]], sun:[["11:30","14:30"],["17:00","21:30"]] },
  "Curry Up Now|Palo Alto": { mon:[["11:30","20:30"]], tue:[["11:30","20:30"]], wed:[["11:30","20:30"]], thu:[["11:30","20:30"]], fri:[["11:30","21:00"]], sat:[["11:30","20:00"]], sun:[["11:30","20:00"]] },
  "Il Fornaio|Mountain View": { mon:[["11:30","21:30"]], tue:[["11:30","21:30"]], wed:[["11:30","21:30"]], thu:[["11:30","21:30"]], fri:[["11:30","21:30"]], sat:[["11:30","21:30"]], sun:[["11:30","21:30"]] },
  "Pizzeria Delfina|Palo Alto": { mon:[["17:00","21:00"]], tue:[["17:00","21:00"]], wed:[["12:00","21:00"]], thu:[["12:00","21:00"]], fri:[["12:00","22:00"]], sat:[["12:00","22:00"]], sun:[["12:00","21:00"]] },
  "Starbird Chicken|Palo Alto": { mon:[["10:30","22:00"]], tue:[["10:30","22:00"]], wed:[["10:30","22:00"]], thu:[["10:30","22:00"]], fri:[["10:30","22:00"]], sat:[["10:30","22:00"]], sun:[["10:30","21:00"]] },
  "Poké Bar|Mountain View": { mon:[["11:00","20:00"]], tue:[["11:00","20:00"]], wed:[["11:00","20:00"]], thu:[["11:00","20:00"]], fri:[["11:00","20:00"]], sat:[["11:00","20:00"]], sun:[["11:00","20:00"]] },
  "Pokeworks|Mountain View": { mon:[["10:30","21:00"]], tue:[["10:30","21:00"]], wed:[["10:30","21:00"]], thu:[["10:30","21:00"]], fri:[["10:30","21:00"]], sat:[["10:30","21:00"]], sun:[["10:30","21:00"]] },
};

// ---------------------------------------------------------------------------
// WEEK PLANNER config — the day plans are GENERATED in app.js from the full
// menu, seeded by the week number so they rotate every week and no two days
// in a week repeat. SEASONS biases each day's picks toward what suits the
// current Palo Alto season, and supplies the warm, personal note for Nour.
// (Palo Alto has a Mediterranean climate: warm dry summers, mild wet winters.)
// ---------------------------------------------------------------------------

const SEASONS = {
  winter: {
    emoji: "🌧️", label: "Winter in Palo Alto",
    weather: "cool and often rainy",
    lean: "warm, comforting things — steamy Thai and Indian curries, chicken pho, and hearty grain bowls",
    favored: {
      Breakfast: ["American breakfast","Cafés & bakeries","Mexican breakfast"],
      Lunch: ["Mediterranean","Cafés & light bites","Sandwiches & wraps"],
      Dinner: ["Thai","Indian & Nepalese","Vietnamese","Chinese","Korean"],
    },
  },
  spring: {
    emoji: "🌸", label: "Spring in Palo Alto",
    weather: "mild and blossoming",
    lean: "bright, fresh plates — Mediterranean mezze, garden bowls, and herby, colorful food",
    favored: {
      Breakfast: ["Cafés & bakeries","Açaí & smoothie bowls","American breakfast"],
      Lunch: ["Salads & bowls","Mediterranean","Poke"],
      Dinner: ["Mediterranean & Middle Eastern","Thai","Japanese & sushi","American","Seafood & poke"],
    },
  },
  summer: {
    emoji: "☀️", label: "Summer at Stanford",
    weather: "warm, dry and sunny",
    lean: "cool and light things — chilled poke, crisp salads, and açaí bowls",
    favored: {
      Breakfast: ["Açaí & smoothie bowls","Cafés & bakeries","American breakfast"],
      Lunch: ["Poke","Salads & bowls","Mediterranean","Smoothies & açaí bowls"],
      Dinner: ["Seafood & poke","Mediterranean & Middle Eastern","Japanese & sushi","Mexican","Vietnamese"],
    },
  },
  fall: {
    emoji: "🍂", label: "Fall in the Bay",
    weather: "golden and mild",
    lean: "cozy-but-fresh food — warm spices, roasted veggies, and satisfying bowls",
    favored: {
      Breakfast: ["American breakfast","Bagels","Cafés & bakeries"],
      Lunch: ["Sandwiches & wraps","Salads & bowls","Mediterranean"],
      Dinner: ["Indian & Nepalese","American","Pizza & Italian","Chinese","Mediterranean & Middle Eastern"],
    },
  },
};

// ---------------------------------------------------------------------------
// NUTRITION — general daily targets for an ~18-year-old woman with a busy,
// study-heavy schedule. These are standard reference values, NOT medical
// advice; iron, calcium, B12 and vitamin D deserve a real conversation with
// her doctor/dietitian because she avoids BOTH dairy and red meat.
// ---------------------------------------------------------------------------

const NUTRITION = {
  note: "General targets for an ~18-year-old who studies a lot — not medical advice. Because Nour avoids red meat, dairy and wheat, iron, calcium, B12, vitamin D, fiber and B-vitamins (usually from fortified wheat) matter most; a doctor or dietitian can confirm whether a supplement makes sense.",
  // Approximate calorie split across the day (~2,000–2,200 kcal total).
  splits: [
    { meal: "Breakfast", kcal: "450–550" },
    { meal: "Lunch", kcal: "600–700" },
    { meal: "Dinner", kcal: "700–800" },
    { meal: "Snack (optional)", kcal: "200–300" },
  ],
  targets: [
    { k: "Calories", v: "~2,000–2,200 kcal", why: "fuel for long study days" },
    { k: "Protein", v: "~50–75 g", why: "focus & satiety — chicken, fish, tofu, eggs, beans" },
    { k: "Carbs", v: "~250–290 g", why: "steady brain glucose — rice, quinoa, potatoes, corn, GF oats, fruit (no wheat needed)" },
    { k: "Healthy fat", v: "~55–75 g", why: "include omega-3 fish for memory & focus" },
    { k: "Fiber", v: "~25–28 g", why: "KEY (no wheat) — veggies, beans, lentils, quinoa, brown rice, GF oats, chia, fruit" },
    { k: "Iron", v: "18 mg", why: "KEY (no red meat, no fortified wheat) — poultry, fish, tofu, beans, spinach, fortified GF cereal + vitamin C to absorb" },
    { k: "Calcium", v: "1,300 mg", why: "KEY (dairy-free) — fortified plant milk, tofu, tahini, greens, canned fish w/ bones" },
    { k: "Folate & B-vitamins", v: "400 mcg folate", why: "KEY (no wheat) — wheat products are usually the fortified source; use leafy greens, beans, eggs, fortified GF cereal" },
    { k: "Omega-3 · B12 · Vit D", v: "from fish & eggs", why: "brain, energy & bone health without dairy" },
    { k: "Water", v: "~8–10 cups", why: "focus dips fast when even a little dehydrated" },
  ],
};

// ---------------------------------------------------------------------------
// WHOLE FOODS GROCERY GUIDE
// ---------------------------------------------------------------------------

const GROCERY = {
  proteins: [
    "Fresh & frozen poultry: chicken, turkey, duck (plain — not breaded or marinated)",
    "Fresh & frozen fish and seafood: salmon, tuna, cod, shrimp, scallops",
    "Eggs (all)",
    "Tofu, tempeh (plain soy, not multigrain), edamame — never seitan (it's wheat)",
    "Canned beans, lentils, chickpeas — check for no lard",
    "Nuts, nut butters, seeds",
    "Plant-based proteins labelled BOTH gluten-free and dairy-free (many 'chik'n' strips use wheat gluten)",
  ],
  swaps: [
    { instead: "Bread, bagels, English muffins", use: "Gluten-free AND dairy-free loaves (Canyon Bakehouse, Little Northern Bakehouse)" },
    { instead: "Pasta", use: "Brown-rice, chickpea or lentil pasta (Jovial, Banza)" },
    { instead: "Flour tortillas / wraps", use: "Corn tortillas, or almond/cassava tortillas (Siete)" },
    { instead: "Soy sauce, teriyaki, hoisin", use: "Tamari (wheat-free) or coconut aminos" },
    { instead: "Breadcrumbs / croutons", use: "Gluten-free panko, crushed rice crackers, nuts" },
    { instead: "Regular oats & granola", use: "Certified gluten-free oats and granola" },
    { instead: "Beef/pork broth", use: "Chicken broth or vegetable broth" },
    { instead: "Gelatin desserts, gummies, marshmallows", use: "Pectin or agar versions (Annie's, Dandies)" },
    { instead: "Butter / ghee", use: "Olive, avocado or coconut oil; vegan butter (Miyoko's, Earth Balance)" },
    { instead: "Dairy milk, yogurt, cheese", use: "Fortified soy/pea/almond milk; almond or coconut yogurt; Violife/Chao" },
    { instead: "Regular capsules/vitamins", use: "Gelatin-free 'veggie capsule' or tablet forms, labelled gluten-free" },
  ],
  labelCheck: [
    "CONTAINS: WHEAT / MILK  → the bold allergen line — the fastest check (US law requires it)",
    "wheat, flour, semolina, durum, spelt, farro, bulgur, couscous, seitan  → wheat (avoid)",
    "soy sauce, teriyaki, hoisin, malt (barley)  → hidden wheat / gluten (avoid; malt only if strict)",
    "milk, butter, ghee, cheese, cream, yogurt, whey, casein, lactose, milk solids  → dairy (avoid)",
    "beef, pork, lamb, gelatin, collagen, lard, tallow, beef/pork/bone broth  → red meat (avoid)",
    "'may contain wheat / milk', 'shared equipment'  → cross-contact — your call",
    "'gluten-free' + 'dairy-free' together  → the two labels you want to see",
  ],
};

// ---------------------------------------------------------------------------
// EDUCATION / QUICK FACTS
// ---------------------------------------------------------------------------

const FACTS = [
  "Nour is allergic to three things: red meat, milk products and wheat. Everything in this app is checked against all three.",
  "Red meat = beef, pork, lamb, goat, veal, venison and bison — plus what's made from them: broth, lard, tallow, gelatin (gummies, marshmallows, capsules) and collagen.",
  "Dairy hides as whey, casein, butter on the grill, ghee, 'creamy' dressings, yogurt marinades (tandoori, tikka) and cheese dusted on top.",
  "Wheat hides in soy sauce, teriyaki, poke sauces, batters, breading, croutons, wraps, flour tortillas and most noodles. Tamari, rice noodles and corn tortillas are the swaps.",
  "Chicken, turkey, fish, shellfish, eggs, rice, corn, quinoa, potatoes, fruit, vegetables, beans and nuts are the safe base — plenty to eat.",
  "'Vegan' is NOT enough (bread, pasta and seitan are vegan) and 'gluten-free' covers only wheat — look for both gluten-free and dairy-free.",
  "Cross-contact counts: shared fryers with breaded food, shared grills with butter. Ask, and say it's an allergy.",
  "Always carry your epinephrine auto-injector and antihistamines. When in doubt, don't eat it.",
];

// ---------------------------------------------------------------------------
// STORES — every retailer the catalog links to. `how` says how it reaches a
// Palo Alto studio; `kind` groups it in the "Where to shop" view. Any retailer
// named in an item's `links` or in SHOPS should be registered here (the UI
// falls back to a plain badge if it isn't).
// ---------------------------------------------------------------------------

const STORES = {
  "Whole Foods":  { short: "Whole Foods", kind: "Supermarket", how: "Same-day delivery via Amazon/Prime from the Palo Alto store", url: "https://www.amazon.com/wholefoods" },
  "Amazon Fresh": { short: "Fresh",       kind: "Supermarket", how: "Same-day grocery delivery via Amazon", url: "https://www.amazon.com/fresh" },
  "Amazon":       { short: "Amazon",      kind: "Online retailer", how: "Ships in 1–2 days with Prime", url: "https://www.amazon.com" },
  "Walmart":      { short: "Walmart",     kind: "Supermarket", how: "Walmart delivery from the Mountain View Supercenter (600 Showers Dr); walmart.com ships the rest", url: "https://www.walmart.com" },
};

// ---------------------------------------------------------------------------
// SHOPS — where else to buy: bakeries, organic & specialty grocers, Asian &
// international markets, online retailers and brand-direct stores that deliver
// to Palo Alto or ship. Populated by research; each entry says what is good
// there for Nour and how to order safely.
// ---------------------------------------------------------------------------

const SHOPS = [
];

// ---------------------------------------------------------------------------
// GROCERY CATALOG — specific products on Whole Foods / Amazon / Amazon Fresh,
// Walmart and the shops above. `links` maps a retailer name to that product's
// page there (or a search there when no page was verified).
// each verified free of red meat, dairy AND wheat (gfLabel = labelled
// gluten-free), with approximate Amazon ratings. Ratings & availability drift;
// treat as a guide. Supplement doses are not medical advice.
// ---------------------------------------------------------------------------

const GROCERY_ITEMS = [
  { category: "Produce", items: [
    { name: "Organic Baby Spinach, 5 oz clamshell", brand: "365 by Whole Foods Market", asin: null, diet: "Vegan", gfLabel: false, verified: "Single ingredient: organic baby spinach — no milk/whey/casein · no red meat/gelatin · no wheat (fresh produce, naturally gluten-free; not labeled)", rating: 4.6, reviews: 3200, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh"], nutrients: ["iron","calcium","fiber","vitamin-c"] },
    { name: "Lacinato (Dinosaur) Kale, 1 bunch", brand: "Whole Foods Market (fresh)", asin: null, diet: "Vegan", gfLabel: false, verified: "Single ingredient: fresh lacinato kale — no milk/whey/casein · no red meat/gelatin · no wheat (fresh produce, naturally gluten-free; not labeled)", rating: 4.5, reviews: 800, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh"], nutrients: ["iron","calcium","fiber","vitamin-c"] },
    { name: "Red Bell Peppers, each", brand: "Whole Foods Market (fresh)", asin: null, diet: "Vegan", gfLabel: false, verified: "Single ingredient: fresh red bell pepper — no milk/whey/casein · no red meat/gelatin · no wheat (fresh produce, naturally gluten-free; not labeled)", rating: 4.5, reviews: 1500, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh"], nutrients: ["vitamin-c","fiber"] },
    { name: "Navel Oranges, 3 lb bag", brand: "Whole Foods Market (fresh)", asin: null, diet: "Vegan", gfLabel: false, verified: "Single ingredient: fresh navel oranges — no milk/whey/casein · no red meat/gelatin · no wheat (fresh produce, naturally gluten-free; not labeled)", rating: 4.4, reviews: 2600, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh"], nutrients: ["vitamin-c","fiber","calcium"] },
    { name: "Broccoli Crowns, each", brand: "Whole Foods Market (fresh)", asin: null, diet: "Vegan", gfLabel: false, verified: "Single ingredient: fresh broccoli — no milk/whey/casein · no red meat/gelatin · no wheat (fresh produce, naturally gluten-free; not labeled)", rating: 4.5, reviews: 1900, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh"], nutrients: ["vitamin-c","fiber","calcium","iron"] },
    { name: "Strawberries, 1 lb package", brand: "Whole Foods Market (fresh)", asin: null, diet: "Vegan", gfLabel: false, verified: "Single ingredient: fresh strawberries — no milk/whey/casein · no red meat/gelatin · no wheat (fresh produce, naturally gluten-free; not labeled)", rating: 4.4, reviews: 4100, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh"], nutrients: ["vitamin-c","fiber"] },
    { name: "Lemons, 2 lb bag", brand: "Whole Foods Market (fresh)", asin: null, diet: "Vegan", gfLabel: false, verified: "Single ingredient: fresh lemons — no milk/whey/casein · no red meat/gelatin · no wheat (fresh produce, naturally gluten-free; not labeled)", rating: 4.4, reviews: 1700, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh"], nutrients: ["vitamin-c","fiber"] },
  ] },
  { category: "Poultry & Seafood", items: [
    { name: "Chunk Light Tuna in Water, 2.6 oz pouch", brand: "StarKist", asin: "B01ITIOG5Y", diet: "Pescatarian", gfLabel: true, verified: "Ingredients: light tuna, water, salt — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free & soy-free", rating: 4.7, reviews: 47000, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: ["protein","iron","b12","omega-3"] },
    { name: "Wild Sardines in Water, No Salt Added, 4.4 oz (with bones)", brand: "Wild Planet", asin: "B013ORK8P2", diet: "Pescatarian", gfLabel: false, verified: "Ingredients: sardines, water — no milk/whey/casein · no red meat/gelatin · no wheat ingredients (single-ingredient fish; brand states products are gluten-free — confirm 'gluten free' on can, not third-party certified)", rating: 4.6, reviews: 8600, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","calcium","omega-3","b12","vitamin-d"] },
    { name: "Wild Pink Salmon, Skinless Boneless in Water, 2.6 oz pouch", brand: "StarKist", asin: "B07GX3RJ7H", diet: "Pescatarian", gfLabel: true, verified: "Ingredients: pink salmon, water, salt — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free & soy-free", rating: 4.6, reviews: 12000, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: ["protein","omega-3","b12","vitamin-d"] },
    { name: "Wild Pink Salmon with Skin and Bones, 14.75 oz can", brand: "Wild Planet", asin: "B0939MS1HW", diet: "Pescatarian", gfLabel: false, verified: "Ingredients: wild pink salmon, sea salt — no milk/whey/casein · no red meat/gelatin · no wheat ingredients (single-ingredient fish; brand states gluten-free — confirm on can)", rating: 4.5, reviews: 3400, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","calcium","omega-3","vitamin-d","b12"] },
    { name: "Wild Mackerel Fillets in Organic Extra Virgin Olive Oil, 4.4 oz", brand: "Wild Planet", asin: "B013ORKCOY", diet: "Pescatarian", gfLabel: false, verified: "Ingredients: mackerel, organic extra virgin olive oil, sea salt — no milk/whey/casein · no red meat/gelatin · no wheat ingredients (brand states gluten-free — confirm on can)", rating: 4.4, reviews: 5200, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","omega-3","vitamin-d","b12"] },
    { name: "Short Cuts Grilled Carved Chicken Breast Strips, Fully Cooked, 8 oz", brand: "Perdue", asin: "B06XC1WHYK", diet: "Poultry", gfLabel: true, verified: "Ingredients: chicken breast, water, ≤2% vinegar, salt, soy protein concentrate, maltodextrin, spices, garlic & onion powder, soybean oil — no milk/whey/casein · no red meat/gelatin (poultry only) · no wheat — labeled gluten-free (contains soy)", rating: 4.5, reviews: 1300, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: ["protein","b12"] },
    { name: "Air-Chilled Boneless Skinless Chicken Breast, ~1 lb (meat counter)", brand: "Whole Foods Market (fresh)", asin: null, diet: "Poultry", gfLabel: false, verified: "Single ingredient: fresh chicken breast — no milk/whey/casein · no red meat/pork casing/gelatin · no wheat (unbreaded, unmarinated; naturally gluten-free; not labeled). Cook with olive oil + tamari for a sausage-free quick protein", rating: 4.5, reviews: 2000, ratingSrc: "Amazon (est.)", stores: ["Whole Foods","Amazon Fresh"], nutrients: ["protein","b12"] },
    { name: "Wild-Caught Cold-Smoked Sockeye Salmon Nova Lox, 8 oz", brand: "Kate's / Wild Caught Nova Lox", asin: "B0734CNB1Q", diet: "Pescatarian", gfLabel: false, verified: "Ingredients: wild sockeye salmon, salt, natural smoke — no milk/whey/casein · no red meat/gelatin · no wheat ingredients; not labeled gluten-free — confirm package (some smoked-salmon packers use shared lines)", rating: 4.3, reviews: 2100, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","omega-3","b12","vitamin-d"] },
  ] },
  { category: "Dairy Alternatives & Eggs", items: [
    { name: "Organic Unsweetened Soymilk, Half Gallon (64 oz)", brand: "Silk", asin: "B000PKZ9JM", diet: "Vegan", gfLabel: true, verified: "Organic soymilk (water, organic soybeans), vitamin/mineral blend, sea salt, gellan gum — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.7, reviews: 9800, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","calcium","b12","vitamin-d"] },
    { name: "Original Unsweetened Pea Milk, 48 oz", brand: "Ripple", asin: "B074KL78Z9", diet: "Vegan", gfLabel: true, verified: "Water, pea protein, sunflower oil, algal oil, vitamins/minerals — certified vegan, dairy/soy/nut-free — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.4, reviews: 3100, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","calcium","iron","vitamin-d"] },
    { name: "Unsweetened Almondmilk, 48 oz", brand: "Califia Farms", asin: "B00IZ6P9H0", diet: "Vegan", gfLabel: true, verified: "Almondmilk (water, almonds), calcium carbonate, sunflower lecithin, sea salt, gellan gum, vitamins — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.6, reviews: 12000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["calcium","vitamin-d"] },
    { name: "Original Oatmilk, Half Gallon (64 oz)", brand: "Oatly", asin: "B075QJ8M1K", diet: "Vegan", gfLabel: true, verified: "Oatmilk (water, oats), rapeseed oil, dipotassium phosphate, calcium carbonate, tricalcium phosphate, sea salt, vitamins — no milk/whey/casein · no red meat/gelatin · no wheat — US product made with certified gluten-free oats, labeled gluten-free (CFCO certified)", rating: 4.6, reviews: 5400, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["calcium","b12","vitamin-d","fiber"] },
    { name: "Original Unsweetened Dairy-Free Creamer, 25.4 oz", brand: "nutpods", asin: "B08LWXPYCZ", diet: "Vegan", gfLabel: true, verified: "Water, coconut cream, almonds, acacia gum, gellan gum, sunflower lecithin, dipotassium phosphate, sea salt — certified vegan, Whole30 — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.6, reviews: 43000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: [] },
    { name: "Just Like Cheddar Shreds, 8 oz", brand: "Violife", asin: "B07GT6857V", diet: "Vegan", gfLabel: true, verified: "Water, coconut oil, potato/corn starch, sea salt, vegan flavors, olive extract, B12 — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free ('free from gluten'), certified vegan", rating: 4.4, reviews: 6800, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["b12","calcium"] },
    { name: "Just Like Mozzarella Shreds, 8 oz", brand: "Violife", asin: "B07GT6H8SY", diet: "Vegan", gfLabel: true, verified: "Water, coconut oil, potato/corn starch, sea salt, vegan flavors, olive extract, B12 — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free ('free from gluten'), certified vegan", rating: 4.4, reviews: 5200, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["b12"] },
    { name: "Chive Almond Milk Cream Cheese Style Spread, 8 oz", brand: "Kite Hill", asin: "B071XSRFMY", diet: "Vegan", gfLabel: true, verified: "Almond milk (water, almonds), coconut oil, salt, chives, xanthan/locust bean/guar gum, cultures — certified vegan — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.3, reviews: 1500, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: [] },
    { name: "European Style Cultured Salted Vegan Butter, 8 oz", brand: "Miyoko's Creamery", asin: "B07D6SBD3V", diet: "Vegan", gfLabel: true, verified: "Organic coconut oil, water, organic sunflower oil, organic cashews, sunflower lecithin, sea salt, cultures — certified vegan — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free (soy- & palm-oil-free)", rating: 4.5, reviews: 4300, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: [] },
    { name: "Plain Unsweetened Almond Milk Yogurt, 16 oz", brand: "Kite Hill", asin: "B073QLS4SB", diet: "Vegan", gfLabel: true, verified: "Almond milk (water, almonds), citrus fiber, live active cultures, xanthan/locust bean gum — certified vegan — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.2, reviews: 900, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","calcium"] },
    { name: "Pasture-Raised Large Grade A Eggs, 12 ct", brand: "Vital Farms", asin: "B00TNWEN18", diet: "Vegetarian", gfLabel: false, verified: "Whole chicken eggs only — no milk/whey/casein · no red meat/gelatin · no wheat (single ingredient, naturally gluten-free; not labeled)", rating: 4.6, reviews: 7600, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","vitamin-d","b12"] },
    { name: "100% Liquid Egg Whites, 32 oz", brand: "Bob Evans", asin: "B0862TD5VW", diet: "Vegetarian", gfLabel: true, verified: "Ingredients: 100% cage-free liquid egg whites — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.5, reviews: 1200, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: ["protein"] },
  ] },
  { category: "Bakery & Bread", items: [
    { name: "Seeds & Grains Gluten Free Bread, 17 oz (4 pack)", brand: "Little Northern Bakehouse", asin: "B08RZDZR99", diet: "Vegan", gfLabel: true, verified: "Water, GF flour blend (tapioca/potato starch, brown rice, sorghum, corn), sunflower/millet/brown rice/flax/chia/pumpkin seeds, sunflower oil, psyllium, cane sugar, yeast, pea fiber, salt — no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free, certified vegan, free of top-8 allergens (no egg)", rating: 4.3, reviews: 1500, ratingSrc: "Amazon (est.)", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["fiber","protein","iron"] },
    { name: "Grain Free Almond Flour Tortillas, 8 ct (7 oz)", brand: "Siete", asin: "B0774RX9LY", diet: "Vegan", gfLabel: true, verified: "Ingredients: almond flour, tapioca starch, water, sea salt, xanthan gum — no milk/whey/casein · no red meat/lard/gelatin · no wheat — labeled gluten-free, grain-free, dairy-free, vegan (contains tree nuts)", rating: 4.5, reviews: 12000, ratingSrc: "Amazon (est.)", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","fiber"] },
    { name: "Extra Thin Yellow Corn Tortillas, 16 oz", brand: "Mission", asin: "B004BVT34I", diet: "Vegan", gfLabel: true, verified: "Corn masa flour, water, cellulose gum, guar gum, amylase, preservatives (propionic/benzoic acid, phosphoric acid) — no milk/whey/casein · no red meat/lard/gelatin · no wheat — labeled gluten-free (Mission corn tortillas carry a certified gluten-free mark)", rating: 4.7, reviews: 3400, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: ["fiber"] },
    { name: "Gluten Free Presliced Plain Bagels, 4 ct (14 oz)", brand: "Canyon Bakehouse", asin: "B06XSMV6L4", diet: "Vegetarian", gfLabel: true, verified: "Water, tapioca flour, brown rice flour, potato starch, organic agave, olive oil, whole grain sorghum, xanthan gum, egg whites, cultured brown rice flour, baking powder, sea salt, yeast, vinegar, enzymes — no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free, dairy/soy/nut-free (contains egg)", rating: 4.4, reviews: 2500, ratingSrc: "Amazon (est.)", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["fiber","iron"] },
    { name: "Gluten Free Honey Whole Grain English Muffins, 4 ct (12 oz)", brand: "Canyon Bakehouse", asin: "B07HZ4KLP9", diet: "Vegetarian", gfLabel: true, verified: "Water, brown rice flour, tapioca flour, potato starch, cultured brown rice flour, sunflower seeds, brown rice meal, honey, cane sugar, ≤2% canola oil, egg whites, sorghum, millet, teff, quinoa, amaranth, buckwheat, xanthan gum, yeast, sea salt, eggs, enzymes — no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free, dairy/soy/nut-free (contains egg & honey, so not vegan)", rating: 4.4, reviews: 1200, ratingSrc: "Amazon (est.)", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["fiber","protein","iron"] },
    { name: "Gluten Free Wraps, Original, 9\" (3 packs, 18 total)", brand: "Toufayan", asin: "B081ZGRD3B", diet: "Vegan", gfLabel: true, verified: "GF base (tapioca starch, rice flour, chickpea flour, dextrose, potato starch, xanthan gum, salt, maltodextrin, mono-/diglycerides), water, soybean oil, chia, yeast, baking powder, calcium propionate — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free, kosher pareve, naturally vegan", rating: 4.3, reviews: 2400, ratingSrc: "Amazon (est.)", stores: ["Amazon Fresh","Amazon"], nutrients: ["fiber"] },
  ] },
  { category: "Deli & Dips", items: [
    { name: "Classic Hummus, 10 oz", brand: "Sabra", asin: "B00120UWY6", diet: "Vegan", gfLabel: true, verified: "Chickpeas, water, tahini, soybean oil, garlic, salt, citric acid, potassium sorbate — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free & dairy-free", rating: 4.6, reviews: 8700, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","iron","fiber"] },
    { name: "Classic Guacamole Bowl, 15 oz", brand: "Wholly Guacamole", asin: "B081P344BS", diet: "Vegan", gfLabel: true, verified: "Hass avocados, onion, salt, lime juice, dehydrated onion, garlic — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free & dairy-free", rating: 4.5, reviews: 3400, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["fiber"] },
    { name: "Baba Ghanoush Eggplant Dip, 29 oz", brand: "Cortas", asin: "B00A6J97PE", diet: "Vegan", gfLabel: false, verified: "Grilled eggplant, tahini (sesame), lemon juice, salt, citric acid — no milk/whey/casein (no yogurt) · no red meat/gelatin · no wheat ingredients; imported can not labeled gluten-free — confirm label", rating: 4.5, reviews: 500, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: ["fiber"] },
    { name: "Chunky Salsa, Medium, 15.5 oz", brand: "Tostitos", asin: "B00C8W0NV4", diet: "Vegan", gfLabel: true, verified: "Tomatoes, jalapeños, onion, vinegar, salt, garlic, spices — no milk/whey/casein · no red meat/gelatin · no wheat — on Frito-Lay's gluten-free list, labeled gluten-free", rating: 4.7, reviews: 6900, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: [] },
    { name: "Black Olive Tapenade in Oil, 6.7 oz", brand: "DeLallo", asin: "B087D58H3K", diet: "Vegan", gfLabel: false, verified: "Black olives, extra virgin olive oil, capers, vinegar, spices — no milk/whey/casein · no red meat/gelatin · no wheat ingredients; not labeled gluten-free — confirm jar", rating: 4.5, reviews: 400, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: [] },
  ] },
  { category: "Pantry & Dry Goods", items: [
    { name: "Gluten Free Organic Old Fashioned Rolled Oats, 32 oz", brand: "Bob's Red Mill", asin: "B07BRXFXCR", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic whole grain rolled oats — no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free (dedicated GF facility, ELISA batch-tested; oats are not wheat but regular oats risk wheat cross-contact)", rating: 4.8, reviews: 28000, ratingSrc: "Amazon (est.)", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["fiber","protein","iron"] },
    { name: "Gluten Free Organic Steel Cut Oats, 24 oz", brand: "Bob's Red Mill", asin: "B01I7Y58G6", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic whole grain steel cut oats — no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free (dedicated GF facility, ELISA batch-tested)", rating: 4.7, reviews: 9000, ratingSrc: "Amazon (est.)", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["fiber","protein","iron"] },
    { name: "Organic White Quinoa, 26 oz", brand: "Bob's Red Mill", asin: "B07WGFHS5D", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic whole grain quinoa — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free (packed in Bob's dedicated gluten-free facility, ELISA-tested)", rating: 4.7, reviews: 9500, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","iron","fiber"] },
    { name: "Organic Short Grain Brown Rice, 32 oz", brand: "Lundberg Family Farms", asin: "B000QV32CQ", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic short grain brown rice — no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free", rating: 4.7, reviews: 8200, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["fiber","protein"] },
    { name: "Organic California White Jasmine Rice, 32 oz", brand: "Lundberg Family Farms", asin: "B001O8RCLW", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic jasmine white rice — no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free", rating: 4.7, reviews: 6400, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein"] },
    { name: "Organic Brown Rice Penne Rigate, Gluten Free, 12 oz", brand: "Jovial", asin: "B00IV7058G", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic brown rice flour, water — no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free (GFCO), egg-free", rating: 4.6, reviews: 12000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon"], nutrients: ["protein","fiber"] },
    { name: "Organic Black Beans, No Salt Added, 15 oz", brand: "Eden Foods", asin: "B000SR5GRC", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic black beans, water, kombu seaweed — no milk/whey/casein · no red meat/lard/gelatin · no wheat — labeled gluten-free", rating: 4.7, reviews: 5600, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: ["protein","fiber","iron"] },
    { name: "Organic Pinto Beans, No Salt Added, 15 oz", brand: "Eden Foods", asin: "B000VK3WRW", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic pinto beans, water, kombu seaweed — no milk/whey/casein · no red meat/lard/gelatin · no wheat — labeled gluten-free", rating: 4.7, reviews: 3900, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: ["protein","fiber","iron"] },
    { name: "Organic Garbanzo Beans (Chickpeas), No Salt Added, 15 oz", brand: "Eden Foods", asin: "B000VK3WQI", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic garbanzo beans, water, kombu seaweed — no milk/whey/casein · no red meat/lard/gelatin · no wheat — labeled gluten-free", rating: 4.7, reviews: 6100, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: ["protein","fiber","iron"] },
    { name: "Organic Free Range Chicken Broth, 32 oz", brand: "Pacific Foods", asin: "B001HTLBM4", diet: "Poultry", gfLabel: true, verified: "Organic chicken broth, organic chicken flavor, sea salt, organic onion powder, turmeric & rosemary extract — poultry only, no beef/pork/bone broth · no milk/whey/casein · no wheat/yeast extract — labeled gluten-free (independently tested <5 ppm)", rating: 4.7, reviews: 14000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein"] },
    { name: "Organic Low Sodium Vegetable Broth, 32 oz", brand: "Pacific Foods", asin: "B008YAW8VM", diet: "Vegan", gfLabel: true, verified: "Organic vegetable stock (carrots, celery, onions, tomatoes, leeks, parsley), sea salt — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.7, reviews: 11000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: [] },
    { name: "Organic Classic Coconut Milk, 13.5 oz", brand: "Native Forest", asin: "B00YCYS7IW", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic coconut, water, organic guar gum — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free, vegan", rating: 4.6, reviews: 22000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon"], nutrients: ["iron"] },
    { name: "Homemade Marinara Sauce, 24 oz", brand: "Rao's", asin: "B000WH9DCW", diet: "Vegan", gfLabel: true, verified: "Italian whole peeled tomatoes, olive oil, onions, salt, garlic, basil, black pepper, oregano — no cheese/cream/milk · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.7, reviews: 46000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["vitamin-c","fiber"] },
    { name: "Organic Diced Tomatoes, 14.5 oz", brand: "Muir Glen", asin: "B000SR5X7A", diet: "Vegan", gfLabel: true, verified: "Organic tomatoes, organic tomato juice, sea salt, calcium chloride, citric acid — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.8, reviews: 7300, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["vitamin-c","fiber"] },
    { name: "Premium Tahini (Sesame Paste), 11 oz", brand: "Soom Foods", asin: "B09LJDV88X", diet: "Vegan", gfLabel: true, verified: "Ingredients: 100% roasted white humera sesame seeds — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free, vegan", rating: 4.7, reviews: 4200, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon"], nutrients: ["calcium","protein","iron"] },
    { name: "Organic Creamy Peanut Butter, Unsalted, 16 oz", brand: "Once Again", asin: "B0046HNRPS", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic dry roasted peanuts — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.7, reviews: 5800, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon"], nutrients: ["protein","fiber"] },
    { name: "Organic Creamy Almond Butter, Roasted, 16 oz", brand: "Once Again", asin: "B005H90IJ2", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic dry roasted almonds — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.6, reviews: 3100, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon"], nutrients: ["protein","calcium","fiber"] },
    { name: "Natural Sunflower Seed Butter, Creamy, 16 oz", brand: "SunButter", asin: "B000VK84P2", diet: "Vegan", gfLabel: true, verified: "Ingredients: roasted sunflower seeds, sugar, salt — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free, nut-free", rating: 4.7, reviews: 13000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","fiber","iron"] },
    { name: "Everyday Extra Virgin Olive Oil, 25.4 oz", brand: "California Olive Ranch", asin: "B00CO1YXL0", diet: "Vegan", gfLabel: false, verified: "Ingredients: 100% extra virgin olive oil — no milk/whey/casein · no red meat/gelatin · no wheat (single ingredient, naturally gluten-free; not labeled)", rating: 4.7, reviews: 16000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: [] },
    { name: "100% Pure Avocado Oil, 25.4 oz", brand: "Chosen Foods", asin: "B01FB3Q1TE", diet: "Vegan", gfLabel: false, verified: "Ingredients: 100% pure avocado oil — no milk/whey/casein · no red meat/gelatin · no wheat (single ingredient, naturally gluten-free; not labeled)", rating: 4.7, reviews: 19000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: [] },
    { name: "Gluten Free Tamari Soy Sauce, 10 oz", brand: "San-J", asin: "B01BMYSNSS", diet: "Vegan", gfLabel: true, verified: "Ingredients: water, soybeans, salt, alcohol — 100% soy, NO wheat (regular soy sauce contains wheat) · no milk/whey/casein · no red meat/gelatin — certified gluten-free (GFCO)", rating: 4.8, reviews: 9800, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: [] },
    { name: "40°N Premium Fish Sauce, 8.45 oz", brand: "Red Boat", asin: "B00K6ZJ1W2", diet: "Pescatarian", gfLabel: true, verified: "Ingredients: black anchovy, sea salt — fish only, no red meat/gelatin · no milk/whey/casein · no wheat — labeled gluten-free (no added sugar/MSG)", rating: 4.7, reviews: 7600, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon"], nutrients: ["protein"] },
    { name: "Petite French Green Lentils, 24 oz", brand: "Bob's Red Mill", asin: "B084J5YGZJ", diet: "Vegan", gfLabel: false, verified: "Ingredients: petite French green lentils (single ingredient) — no milk/whey/casein · no red meat/gelatin · no wheat ingredients; not GF-labeled — may contain traces (shared equipment); Bob's Red Mill packs these outside its dedicated GF facility, so confirm the bag's allergen line", rating: 4.7, reviews: 3400, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","iron","fiber"] },
    { name: "Brown Lentils, 27 oz", brand: "Bob's Red Mill", asin: "B09JBHMHXC", diet: "Vegan", gfLabel: false, verified: "Ingredients: whole brown lentils (single ingredient) — no milk/whey/casein · no red meat/gelatin · no wheat ingredients; not GF-labeled — may contain traces (shared equipment); confirm the bag's allergen line (Bob's non-GF line)", rating: 4.7, reviews: 2600, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","iron","fiber"] },
    { name: "Organic Pumpkin Seeds (Pepitas), Raw & Unsalted, 2 lb", brand: "Terrasoul Superfoods", asin: "B01BLYNWVM", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic raw shelled pumpkin seeds — Amazon listing states gluten-free, vegan; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.6, reviews: 15000, ratingSrc: "Amazon", stores: ["Amazon"], nutrients: ["protein","iron","omega-3"] },
    { name: "Organic Chia Seeds, 12 oz", brand: "Bob's Red Mill", asin: "B075XG1YR3", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic whole chia seeds (single ingredient) — Bob's Red Mill chia is in its gluten-free line (GF badge on bag); no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.8, reviews: 21000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["omega-3","fiber","calcium"] },
    { name: "Organic Unsulphured Blackstrap Molasses, 16 oz", brand: "Wholesome", asin: "B00MFBVY2U", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic blackstrap molasses (sugarcane) — Wholesome labels it naturally gluten-free & vegan; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.7, reviews: 8900, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: ["iron","calcium"] },
    { name: "California Dried Mission Figs, 7 oz", brand: "Sun-Maid", asin: "B006WQMRRK", diet: "Vegan", gfLabel: false, verified: "Ingredients: dried mission figs (single ingredient, no added sugar) — no milk/whey/casein · no red meat/gelatin · no wheat ingredients; not GF-labeled; no allergen advisory seen — confirm bag", rating: 4.6, reviews: 6700, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: ["fiber","calcium","iron"] },
    { name: "Organic Dried Turkish Apricots, 32 oz", brand: "Sunny Fruit", asin: "B089NCMHWQ", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic dried apricots (no sugar, no sulfites) — listing/bag say Gluten Free, Non-GMO; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.6, reviews: 10000, ratingSrc: "Amazon", stores: ["Amazon"], nutrients: ["fiber","iron"] },
  ] },
  { category: "Breakfast & Cereal", items: [
    { name: "Organic Original Ancient Grain Granola (12 oz)", brand: "Purely Elizabeth", asin: "B01515ECLQ", diet: "Vegan", gfLabel: true, verified: "Label: certified gluten-free oats, puffed amaranth, quinoa, chia, coconut sugar/oil — Amazon listing: 'Gluten Free · Wheat Free', certified vegan; no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free (GF oats)", rating: 4.5, reviews: 10000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["fiber","protein"] },
    { name: "Organic Mesa Sunrise Flakes Cereal, Gluten Free (10.6 oz)", brand: "Nature's Path", asin: "B07MWRF9N3", diet: "Vegan", gfLabel: true, verified: "Ingredients: organic corn, flax, buckwheat, quinoa, amaranth, cane sugar, sea salt — listing/label 'Gluten-Free, Vegan, wheat free'; no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free (Nature's Path GF line)", rating: 4.6, reviews: 3000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["fiber","omega-3","iron"] },
    { name: "Gluten Free Classic Oatmeal Cup (1.81 oz, 12-pack)", brand: "Bob's Red Mill", asin: "B013AX5WUQ", diet: "Vegan", gfLabel: true, verified: "Label: certified gluten-free whole grain oats, flax, chia, sea salt — Bob's dedicated GF facility; vegan, no milk/whey; no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free (certified GF oats)", rating: 4.6, reviews: 5400, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["fiber","protein","iron"] },
    { name: "Corn Chex Gluten Free Cereal (12 oz)", brand: "General Mills (Chex)", asin: "B00SMYRZH2", diet: "Vegetarian", gfLabel: true, verified: "Ingredients: whole grain corn, corn meal, sugar, salt, molasses + added iron, calcium & vitamins (D3, not milk); no milk, no gelatin, no beef/pork; label 'Gluten Free' (corn, not wheat) — no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.7, reviews: 9000, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: ["iron","calcium"] },
    { name: "Overnight Oats Cups, Variety 10-Pack (5 oz cups)", brand: "MUSH", asin: "B07DZ37YKZ", diet: "Vegan", gfLabel: true, verified: "Listing/label: 'Gluten-Free, Dairy Free, Non-GMO' — oats + almondmilk + fruit, no added sugar; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free (GF oats)", rating: 4.3, reviews: 8700, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["fiber","protein"] },
    { name: "Gluten Free Fig Bars, Original Fig (12 twin packs)", brand: "Nature's Bakery", asin: "B01GFJJX16", diet: "Vegan", gfLabel: true, verified: "Label: figs, brown rice flour, GF ancient-grain blend (amaranth, quinoa, millet, sorghum, teff), whole grain oats — certified gluten-free, vegan, dairy-free, nut-free facility; no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free (oats in a certified-GF product)", rating: 4.6, reviews: 6000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["fiber"] },
    { name: "Classic Almond Butter Squeeze Packs (1.15 oz, 10-pack)", brand: "Justin's", asin: "B01684FP1U", diet: "Vegan", gfLabel: true, verified: "Only two ingredients: dry roasted almonds, palm oil — label states gluten-free, vegan; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.7, reviews: 14000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein"] },
  ] },
  { category: "Snacks", items: [
    { name: "Chocolate Sea Salt Protein Bar (12 ct)", brand: "RXBAR", asin: "B0143NQVQ6", diet: "Vegetarian", gfLabel: true, verified: "Label: dates, egg whites, nuts, cocoa — Amazon title/label 'Gluten Free'; no milk/whey; egg-white protein (vegetarian); no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.6, reviews: 45000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","fiber"] },
    { name: "MacroBar Organic Protein Bar, Protein Variety Pack (12 ct)", brand: "GoMacro", asin: "B07V9PM8HJ", diet: "Vegan", gfLabel: true, verified: "Certified organic, vegan, gluten-free (GFCO), kosher, soy-free per listing; brown rice/pea protein, nut butters; no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free", rating: 4.6, reviews: 12000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","iron","fiber"] },
    { name: "Cherry Pie Fruit & Nut Bar (1.7 oz, 16 ct)", brand: "Larabar", asin: "B00H4IFF06", diet: "Vegan", gfLabel: true, verified: "Three ingredients: dates, almonds, unsweetened cherries — label: gluten free, dairy free, vegan; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.7, reviews: 26000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["fiber","protein"] },
    { name: "Dark Chocolate Nuts & Sea Salt Bar (1.4 oz, 12 ct) — DAIRY-FREE variant", brand: "KIND", asin: "B007PE7ANY", diet: "Vegan", gfLabel: true, verified: "Ingredients: almonds, peanuts, dark chocolate, sea salt — Amazon listing 'Gluten Free' (4.7★, 24.6k reviews); no milk ingredient but 'may contain milk' shared-equipment advisory; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free — traces caution for milk", rating: 4.7, reviews: 24000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","fiber"] },
    { name: "Sea Salt Roasted Chickpea Snacks (5 oz, 4-pack)", brand: "Biena", asin: "B079DFLWDH", diet: "Vegan", gfLabel: true, verified: "Label: chickpeas, sunflower oil, sea salt — listing: gluten free, dairy free, vegan, grain free; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.4, reviews: 15000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","fiber","iron"] },
    { name: "Organic Roasted Seaweed Snacks, Sea Salt (12 ct)", brand: "gimMe", asin: "B00BCG0OB6", diet: "Vegan", gfLabel: true, verified: "Label: organic seaweed, sunflower/sesame oil, sea salt — listing: vegan, gluten free; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.6, reviews: 17000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["omega-3"] },
    { name: "Simple Organic Dark Chocolate Bar (2.1 oz)", brand: "Hu", asin: "B079TF1WDR", diet: "Vegan", gfLabel: true, verified: "Label: only cacao, coconut sugar, cocoa butter — Hu bars: vegan, gluten free, dairy-free, paleo; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.5, reviews: 19000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["iron","fiber"] },
    { name: "All Natural Roasted & Salted Pumpkin Seeds (5 oz, 12-pack)", brand: "DAVID", asin: "B00GN065A0", diet: "Vegan", gfLabel: false, verified: "Two ingredients: pumpkin seeds, salt — no gluten-free claim on the listing; no milk/whey/casein · no red meat/gelatin · no wheat ingredients; not GF-labeled — confirm pack for a shared-line advisory", rating: 4.6, reviews: 7300, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: ["protein","iron"] },
    { name: "Organic Berry Patch Bunny Fruit Snacks (0.8 oz, 20 ct)", brand: "Annie's", asin: "B07BB256TC", diet: "Vegan", gfLabel: true, verified: "Pectin (not gelatin), organic fruit juice colors — Annie's Bunny Fruit Snacks labeled 'Gluten Free', vegan; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.7, reviews: 21000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: [] },
    { name: "Juicy Burst Fruit Snacks, Berry Medley (0.8 oz, 22 ct)", brand: "Black Forest", asin: "B0CWPP7214", diet: "Vegan", gfLabel: true, verified: "Pectin (not gelatin), fruit juice from concentrate — Black Forest fruit snacks are labeled gluten free & fat free; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free (confirm on this Juicy Burst box)", rating: 4.7, reviews: 34000, ratingSrc: "Amazon", stores: ["Amazon Fresh","Amazon"], nutrients: [] },
    { name: "Vegan Marshmallows, Classic Vanilla (10 oz)", brand: "Dandies", asin: "B00FBNZ58S", diet: "Vegan", gfLabel: true, verified: "Label: 'no gelatin' (carrageenan), vegan, gluten-free; tapioca syrup, cane sugar; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.5, reviews: 9600, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: [] },
    { name: "Semi-Sweet Mini Chocolate Chips (10 oz)", brand: "Enjoy Life", asin: "B000VK5VTO", diet: "Vegan", gfLabel: true, verified: "Free-from top allergens incl. dairy/casein & wheat; cane sugar, unsweetened chocolate, cocoa butter — certified gluten-free (dedicated facility); no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free", rating: 4.8, reviews: 5000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["iron"] },
    { name: "Almond Flour Crackers, Fine Ground Sea Salt (4.25 oz)", brand: "Simple Mills", asin: "B01CI3TADE", diet: "Vegan", gfLabel: true, verified: "Label: almond/sunflower/flax seed flour, sea salt — certified gluten-free, grain-free, vegan; no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free", rating: 4.5, reviews: 41000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","fiber"] },
  ] },
  { category: "Frozen", items: [
    { name: "Wild-Caught Sockeye Salmon Fillets, 32 oz", brand: "365 by Whole Foods Market", asin: "B07NRCRZFF", diet: "Pescatarian", gfLabel: false, verified: "Ingredients: wild sockeye salmon only — fish; no milk/whey/casein · no red meat/gelatin · no wheat ingredients; single ingredient, no GF claim needed", rating: 4.4, reviews: 1300, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","omega-3"] },
    { name: "Wild White Gulf Raw Shrimp 16/20, 32 oz", brand: "365 by Whole Foods Market", asin: "B07NR73MGF", diet: "Pescatarian", gfLabel: false, verified: "Ingredients: wild white gulf shrimp, salt — shellfish; no milk/whey/casein · no red meat/gelatin · no wheat ingredients; single ingredient, no GF claim needed", rating: 4.3, reviews: 900, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","omega-3"] },
    { name: "Shelled Edamame, 12 oz", brand: "365 by Whole Foods Market", asin: "B074H6S8D8", diet: "Vegan", gfLabel: false, verified: "Ingredients: shelled soybeans (edamame) — plant only; no milk/whey/casein · no red meat/gelatin · no wheat ingredients; single ingredient, no GF claim needed", rating: 4.6, reviews: 2100, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","iron","fiber"] },
    { name: "Chopped Spinach, 16 oz", brand: "365 by Whole Foods Market", asin: "B074H5ZHSV", diet: "Vegan", gfLabel: false, verified: "Ingredients: chopped spinach — single vegetable; no milk/whey/casein · no red meat/gelatin · no wheat ingredients; single ingredient, no GF claim needed", rating: 4.5, reviews: 800, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["iron","calcium","fiber"] },
    { name: "Organic Whole Strawberries, 32 oz", brand: "365 by Whole Foods Market", asin: "B074H6G852", diet: "Vegan", gfLabel: false, verified: "Ingredients: organic strawberries — fruit only; no milk/whey/casein · no red meat/gelatin · no wheat ingredients; single ingredient, no GF claim needed", rating: 4.7, reviews: 11000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["fiber"] },
    { name: "Dairy-Free Oatmilk Frozen Dessert, Simply Vanilla Bean, 1 Pint", brand: "So Delicious", asin: "B0815TK2CH", diet: "Vegan", gfLabel: false, verified: "Oatmilk base, labeled Dairy-Free & Certified Vegan, no gelatin — oats are not wheat, but this SKU's gluten-free labeling could not be confirmed this pass; no wheat ingredients — confirm 'gluten-free oats' on the current carton", rating: 4.4, reviews: 500, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: [] },
    { name: "Non-Dairy Frozen Dessert, Cherry Garcia (oat-based), 1 Pint", brand: "Ben & Jerry's", asin: "B06XD55CJH", diet: "Vegan", gfLabel: true, verified: "Oat-milk base with cherries & fudge flakes — Certified Vegan and certified gluten-free per Ben & Jerry's; no dairy, no gelatin; contains soy lecithin; no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free", rating: 4.6, reviews: 1500, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: [] },
    { name: "Sorbetto, Alphonso Mango, 16 oz", brand: "Talenti", asin: "B00FTBSUUM", diet: "Vegan", gfLabel: true, verified: "Fruit sorbetto (Alphonso mango, water, sugar, lemon juice) — Talenti lists its sorbettos gluten-free; dairy-free, no gelatin; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.6, reviews: 1100, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: [] },
    { name: "Buffalo Plant Chicken Wings, 8 oz (frozen)", brand: "Daring", asin: "B0BC26YRDT", diet: "Vegan", gfLabel: true, verified: "Soy-protein plant chicken in buffalo sauce — listing: Non-GMO, Gluten-Free, palm-oil-free, 9 g protein/serving; vegan (no butter/dairy), no red meat, no gelatin; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.2, reviews: 600, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","iron"] },
  ] },
  { category: "Beverages", items: [
    { name: "Orange Juice with Calcium + Vitamin D, No Pulp, 59 oz", brand: "Tropicana", asin: "B00CJT38BI", diet: "Vegetarian", gfLabel: false, verified: "100% orange juice fortified with calcium & vitamin D (D3 is lanolin-derived, hence vegetarian) — no dairy, no gelatin, no wheat; no GF claim printed — naturally wheat-free", rating: 4.7, reviews: 1500, ratingSrc: "Amazon", stores: ["Amazon Fresh","Whole Foods","Amazon"], nutrients: ["calcium","vitamin-d","vitamin-c"] },
    { name: "Pure Coconut Water, 33.8 Fl Oz", brand: "Vita Coco", asin: "B003HBI2B8", diet: "Vegan", gfLabel: true, verified: "Pure coconut water — listing: kosher, gluten-free, vegan; no sugar added; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.7, reviews: 40000, ratingSrc: "Amazon", stores: ["Amazon Fresh","Whole Foods","Amazon"], nutrients: [] },
    { name: "Organic Cold-Pressed Uber Greens Green Juice, 12 Fl Oz", brand: "Suja", asin: "B071NG4M73", diet: "Vegan", gfLabel: true, verified: "Cold-pressed greens, cucumber, celery, kale — Suja: USDA organic, vegan, gluten free; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.5, reviews: 3600, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["vitamin-c"] },
    { name: "Synergy Organic Raw Kombucha, Trilogy, 16.2 oz (Pack of 12)", brand: "GT's", asin: "B078J5JW6G", diet: "Vegan", gfLabel: true, verified: "Raw fermented kombucha (tea, cane sugar, cultures, fruit juice) — GT's labels Synergy gluten-free, vegan; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.5, reviews: 3000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: [] },
    { name: "Sparkling Water 4-Flavor Variety Pack, 12 oz (Pack of 20)", brand: "Spindrift", asin: "B07FCQKZ4F", diet: "Vegan", gfLabel: true, verified: "Sparkling water + real squeezed fruit — listing: gluten-free, non-GMO, no sweeteners; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.6, reviews: 30000, ratingSrc: "Amazon", stores: ["Amazon Fresh","Whole Foods","Amazon"], nutrients: [] },
  ] },
  { category: "Ready Meals", items: [
    { name: "Organic Lentil Vegetable Soup, 14.5 oz", brand: "Amy's", asin: "B000VK6J9A", diet: "Vegan", gfLabel: true, verified: "Labeled Vegan/Dairy-Free/Gluten Free by Amy's; lentils, vegetables, olive oil — no roux or wheat thickener; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.6, reviews: 5200, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","iron","fiber"] },
    { name: "Organic Split Pea Soup, 16.5 oz", brand: "Pacific Foods", asin: "B09ZPMJTM8", diet: "Vegan", gfLabel: false, verified: "Vegan split pea (no ham): split peas, carrots, onion, celery, spices — no wheat ingredients, no dairy, no red meat; GF labeling on this carton not confirmed this pass — confirm 'gluten free' on carton", rating: 4.5, reviews: 2600, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","iron","fiber"] },
    { name: "Organic Quinoa & Brown Rice with Garlic, 8.5 oz (microwave pouch)", brand: "Seeds of Change", asin: "B004T33K2O", diet: "Vegan", gfLabel: false, verified: "Ingredients: cooked brown rice, quinoa, olive oil, garlic, sea salt — no wheat/soy sauce/dairy; pouch is not GF-labeled — may contain traces (shared equipment)", rating: 4.6, reviews: 7800, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","fiber"] },
    { name: "Thai Green Curry with Tofu & Jasmine Rice, 10 oz", brand: "Amy's", asin: "B01N53ZN03", diet: "Vegan", gfLabel: true, verified: "Labeled Vegan & Gluten Free by Amy's; tofu, coconut milk, jasmine rice, vegetables — no dairy, no wheat noodles or soy sauce; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.4, reviews: 1900, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","fiber"] },
    { name: "Pad Thai with Organic Rice Noodles & Tofu, 9.5 oz", brand: "Amy's", asin: "B00FTBT8OE", diet: "Vegan", gfLabel: true, verified: "Organic broad rice noodles, house-made tofu, carrots, broccoli, green onions, cashews — labeled Vegan, Gluten Free, Dairy Free (tamari-style sauce, no wheat soy sauce); no red meat, no gelatin; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.3, reviews: 1500, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein","fiber"] },
    { name: "Lemongrass Basil Chicken with Basmati Rice, 10 oz", brand: "Saffron Road", asin: "B00L9Z6JN2", diet: "Poultry", gfLabel: true, verified: "Chicken breast, basmati rice, peppers, coconut-based lemongrass basil sauce — Saffron Road certifies its frozen entrées gluten-free (Certified GF, halal); no cream, no red meat; no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free (confirm this SKU's box)", rating: 4.3, reviews: 700, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon Fresh","Amazon"], nutrients: ["protein"] },
  ] },
  { category: "Vitamins & Supplements", items: [
    { name: "Blood Builder Iron + Vitamin C (60 Tablets)", brand: "MegaFood", asin: "B0001532T0", diet: "Vegan", gfLabel: true, verified: "Veggie tablet — MegaFood: certified gluten-free, vegan, dairy-free, no gelatin; ~26 mg whole-food iron + vitamin C & beetroot; no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free", rating: 4.6, reviews: 31000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon","Amazon Fresh"], nutrients: ["iron","vitamin-c"] },
    { name: "Iron 18 mg Ferrous Bisglycinate (Ferrochel), 120 Veg Capsules", brand: "NOW Foods", asin: "B000WQDD2O", diet: "Vegan", gfLabel: true, verified: "Veggie capsule — NOW: vegan, not manufactured with wheat/gluten/milk (GMP facility handles other allergens); 18 mg iron bisglycinate; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free — traces caution", rating: 4.7, reviews: 9000, ratingSrc: "Amazon", stores: ["Amazon","Whole Foods"], nutrients: ["iron"] },
    { name: "Gentle Iron 25 mg, 90 Vegetable Capsules", brand: "Solgar", asin: "B06XYVV5CW", diet: "Vegan", gfLabel: true, verified: "Vegetable capsule — Solgar label: Gluten, Wheat & Dairy Free, vegan; 25 mg iron bisglycinate; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.7, reviews: 13000, ratingSrc: "Amazon", stores: ["Amazon","Whole Foods"], nutrients: ["iron"] },
    { name: "Vitamin Code RAW Iron, 30 Vegan Capsules", brand: "Garden of Life", asin: "B00280M13O", diet: "Vegan", gfLabel: true, verified: "Vegan (cellulose) capsule — Garden of Life Vitamin Code: certified gluten-free (NSF), dairy-free, no gelatin; 22 mg whole-food iron + C, B12, folate; no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free", rating: 4.6, reviews: 5000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon"], nutrients: ["iron","vitamin-c","b12"] },
    { name: "Calcium Citrate with Vitamin D, 240 Veg Capsules", brand: "NOW Foods", asin: "B00024D786", diet: "Vegan", gfLabel: true, verified: "Veggie capsule — NOW: vegan, not manufactured with wheat/gluten/milk; calcium citrate + vitamin D & trace minerals; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free — traces caution", rating: 4.7, reviews: 7000, ratingSrc: "Amazon", stores: ["Amazon","Whole Foods"], nutrients: ["calcium","vitamin-d"] },
    { name: "mykind Organics Plant Calcium with D3 & K2, 90 Vegan Tablets", brand: "Garden of Life", asin: "B00K5NEKLC", diet: "Vegan", gfLabel: true, verified: "Vegan tablet — mykind Organics: certified gluten-free, vegan, no gelatin/dairy; algae calcium + vegan D3 & K2; no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free", rating: 4.6, reviews: 1600, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon"], nutrients: ["calcium","vitamin-d"] },
    { name: "Vegan Vitamin D3 2500 IU (Vitashine, lichen), 60 Veggie Caps", brand: "Doctor's Best", asin: "B00E816ROU", diet: "Vegan", gfLabel: true, verified: "Veggie capsule — Doctor's Best: vegan, non-GMO, gluten free, soy free; lichen-sourced D3; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.6, reviews: 2600, ratingSrc: "Amazon", stores: ["Amazon"], nutrients: ["vitamin-d"] },
    { name: "Algae Omega, 60 Soft Gels (715 mg EPA+DHA)", brand: "Nordic Naturals", asin: "B0096M62O6", diet: "Vegan", gfLabel: true, verified: "Certified-vegan softgel (no gelatin) — Nordic Naturals: gluten & dairy free; algae-oil EPA+DHA; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.6, reviews: 7000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon"], nutrients: ["omega-3"] },
    { name: "Vegan Algae Omega-3, 60 Vegetarian Softgels (500 mg)", brand: "Ovega-3", asin: "B004LL7AXE", diet: "Vegan", gfLabel: true, verified: "Vegetarian (carrageenan) softgel — Ovega-3: gluten-free, non-GMO, no fish/gelatin/dairy; algal EPA+DHA; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.5, reviews: 2000, ratingSrc: "Amazon", stores: ["Amazon","Whole Foods"], nutrients: ["omega-3"] },
    { name: "Methyl B-12 (Methylcobalamin) 1,000 mcg, 100 Lozenges", brand: "NOW Foods", asin: "B001F0R7VE", diet: "Vegan", gfLabel: true, verified: "Dissolvable lozenge — NOW: vegan, not manufactured with wheat/gluten/milk; methylcobalamin B12; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free — traces caution", rating: 4.8, reviews: 13000, ratingSrc: "Amazon", stores: ["Amazon","Whole Foods"], nutrients: ["b12"] },
    { name: "mykind Organics Women's Once Daily Multivitamin, 60 Vegan Tablets", brand: "Garden of Life", asin: "B00K5NEMJM", diet: "Vegan", gfLabel: true, verified: "Vegan whole-food tablet — listing: 'vegan, gluten free, non-GMO verified'; no gelatin/dairy; multi with iron, C, D3, B12, biotin; no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free", rating: 4.6, reviews: 4000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon"], nutrients: ["multivitamin","iron","vitamin-c","vitamin-d","b12"] },
    { name: "Essential for Women 18+ Multivitamin, 60 Capsules", brand: "Ritual", asin: "B09W35DHLH", diet: "Vegan", gfLabel: true, verified: "Vegan delayed-release capsule — Ritual: vegan, gluten-free, non-GMO; USP-verified; algal D3, B12, omega-3 DHA; no milk/whey/casein · no red meat/gelatin · no wheat — labeled gluten-free", rating: 4.3, reviews: 9000, ratingSrc: "Amazon", stores: ["Amazon"], nutrients: ["multivitamin","vitamin-d","b12","omega-3"] },
    { name: "Women's One Daily Multivitamin, 90 Tablets", brand: "MegaFood", asin: "B00014HFV2", diet: "Vegetarian", gfLabel: true, verified: "Vegetarian whole-food tablet — MegaFood: certified gluten-free, made without milk, no gelatin; C, D, iron & B vitamins; no milk/whey/casein · no red meat/gelatin · no wheat — certified gluten-free", rating: 4.7, reviews: 2000, ratingSrc: "Amazon", stores: ["Whole Foods","Amazon"], nutrients: ["multivitamin","iron","vitamin-c","vitamin-d"] },
  ] },
];
// ---------------------------------------------------------------------------
// MEAL-PREP & DELIVERY SERVICES (populated by research). Weekly plans of
// meals free of red meat, dairy and wheat — prepared, plant-based, or cook-at-home kits.
// ---------------------------------------------------------------------------

const PREP_SERVICES = [
  { category: "Prepared meals (ready to heat)", services: [
    { name: "Trifecta", type: "Prepared", note: "whole menu is gluten-free, dairy-free & soy-free; pick Classic chicken/salmon/turkey plates or the Plant-Based line, skip beef/bison", rating: 4.3, reviews: 5000, ratingSrc: "App Store", url: "https://www.trifectanutrition.com", tags: ["Dairy-free option","Pescatarian","Chicken option","High-protein","Gluten-free","Organic"], watchOut: "beef/bison/steak are on the à-la-carte menu — choose poultry, fish or plant mains only", deliversTo: "Nationwide (from Sacramento)" },
    { name: "CookUnity", type: "Prepared", note: "set Preferences to Gluten Free + Dairy Free (filters stack) and Pescatarian/poultry protein; chef meals are then labeled per allergen", rating: 4, reviews: 16000, ratingSrc: "Trustpilot", url: "https://www.cookunity.com", tags: ["Dairy-free option","Pescatarian","Chicken option","High-protein","Gluten-free"], watchOut: "rotating chef menus use soy-sauce marinades, pasta & bread; shared kitchen — re-check allergens every week", deliversTo: "Bay Area" },
    { name: "Fresh N Lean", type: "Prepared", note: "all meals gluten-free; choose Vegan, Whole30 or Paleo (dairy-free plans) and set 'red meat' as an avoided ingredient; poultry/fish/plant mains", rating: 3.9, reviews: 5000, ratingSrc: "Trustpilot", url: "https://www.freshnlean.com", tags: ["Dairy-free option","Pescatarian","Chicken option","High-protein","Gluten-free","Plant-based"], watchOut: "Protein+/Keto/Bulk plans are beef & pork heavy; Mediterranean plan adds cheese — stay on Vegan/Whole30/Paleo", deliversTo: "Nationwide" },
    { name: "Factor", type: "Prepared", note: "set dietary preferences to Gluten-Free (they call it gluten-conscious) AND Dairy-Free, then pick chicken/salmon/veg plates; skip beef/pork", rating: 3.9, reviews: 70000, ratingSrc: "Trustpilot", url: "https://www.factor75.com", tags: ["Dairy-free option","Pescatarian","Chicken option","High-protein","Gluten-free"], watchOut: "no cross-contact guarantee; many dishes hide cheese/cream/butter or pasta — read every label, not just the filter", deliversTo: "Nationwide" },
  ] },
  { category: "Meal kits (cook at home)", services: [
    { name: "Home Chef", type: "Meal kit", note: "set Taste Profile to Gluten-Smart, then Customize It to chicken/salmon/shrimp and omit any cheese or butter packet; no dairy-free filter", rating: 4.4, reviews: 12000, ratingSrc: "Trustpilot", url: "https://www.homechef.com", tags: ["Chicken option","Pescatarian","Dairy-free option","Budget","Gluten-free"], watchOut: "Gluten-Smart is not celiac-safe (shared facility); dairy is in most kits; skip bread/pasta/tortilla sides", deliversTo: "Nationwide" },
    { name: "HelloFresh", type: "Meal kit", note: "set the 'Naturally Gluten-Free' preference plus Veggie/Pescatarian; pick chicken, shrimp or salmon recipes and leave out cheese/cream sachets", rating: 4.3, reviews: 40000, ratingSrc: "Trustpilot", url: "https://www.hellofresh.com", tags: ["Pescatarian","Chicken option","Dairy-free option","Budget","Gluten-free"], watchOut: "shared-facility packing; watch soy-sauce marinades, tortilla/bread sides and cheese sachets — read each recipe's allergen line", deliversTo: "Nationwide" },
    { name: "Green Chef", type: "Meal kit", note: "choose the GIG-certified Gluten-Free plan and add the Dairy-Free preference; pick chicken, salmon, shrimp or plant recipes; avoid keto beef/pork", rating: 4, reviews: 4885, ratingSrc: "Trustpilot", url: "https://www.greenchef.com", tags: ["Plant-based","Dairy-free option","Pescatarian","Chicken option","Gluten-free","Organic"], watchOut: "a few gluten recipes exist (packed separately); some 'dairy-free' dishes ship an optional feta/cream finish — set it aside", deliversTo: "Nationwide" },
    { name: "Sunbasket", type: "Meal kit", note: "filter Gluten-Free (or Paleo, which is also dairy-free) then check the dairy-free icon on each recipe; wild salmon, cod, shrimp & chicken are plentiful", rating: 3.9, reviews: 3500, ratingSrc: "Trustpilot", url: "https://www.sunbasket.com", tags: ["Pescatarian","Chicken option","Dairy-free option","Organic","Gluten-free"], watchOut: "only one filter applies at a time and no dedicated allergen facility; set aside any cheese/yogurt/cream packet", deliversTo: "Nationwide" },
    { name: "Marley Spoon", type: "Meal kit", note: "set Preferred Menu to Gluten-Free Friendly + Dairy-Free (both exist) and Pescatarian; choose chicken and fish recipes", rating: 3.8, reviews: 2500, ratingSrc: "Trustpilot", url: "https://marleyspoon.com", tags: ["Pescatarian","Chicken option","Dairy-free option","Gluten-free"], watchOut: "'friendly' means no added gluten, not certified; cream/cheese and noodle recipes are frequent — read allergen icons weekly", deliversTo: "Nationwide" },
    { name: "Dinnerly", type: "Meal kit", note: "budget option; set the 'No Added Gluten/Wheat' recipe preference, then pick chicken/fish/veggie recipes and leave out any cheese packet; confirm each", rating: 3.8, reviews: 1500, ratingSrc: "Trustpilot", url: "https://dinnerly.com", tags: ["Pescatarian","Chicken option","Dairy-free option","Budget","Gluten-free"], watchOut: "no dairy-free filter and minimal packaging labels — check ingredients online; shared facility", deliversTo: "Nationwide" },
  ] },
  { category: "Bay Area & local", services: [
    { name: "Methodology", type: "Prepared", note: "every dish is gluten-free, dairy-free, refined-sugar-free (avocado oil); menu is mostly chicken & fish plus plant-based — just skip beef", rating: 4.4, reviews: 200, ratingSrc: "Google", url: "https://www.gomethodology.com", tags: ["Dairy-free option","Pescatarian","Chicken option","Gluten-free","Plant-based","Organic","Local"], watchOut: "occasional grass-fed beef entrées on the rotating menu — pick poultry/fish/vegan; GF grains like rice/quinoa used", deliversTo: "San Francisco, Peninsula & Bay Area" },
    { name: "Trader Joe's Ready Meals", type: "Grocery prepared", note: "grocery grab-and-go; choose items with both 'gluten free' and dairy-free labeling (e.g. GF chicken tikka masala, mini chicken tacos); read every panel", rating: 4.5, reviews: 3000, ratingSrc: "Google", url: "https://www.traderjoes.com", tags: ["Chicken option","Pescatarian","Dairy-free option","Plant-based","Gluten-free","Local"], watchOut: "many refrigerated entrées are beef/pork or contain wheat/cheese; TJ's labels but does not filter — check allergen line each time", deliversTo: "Peninsula stores (Palo Alto, Mountain View, Menlo Park, Los Altos)" },
    { name: "Whole Foods Prepared Foods", type: "Grocery prepared", note: "hot/cold bar & grab-and-go; each tray lists ingredients with allergens (WHEAT, MILK) in caps — take plain roasted chicken, salmon, rice & veg sides", rating: 4.3, reviews: 2500, ratingSrc: "Google", url: "https://www.wholefoodsmarket.com", tags: ["Chicken option","Pescatarian","Dairy-free option","Plant-based","Organic","Local"], watchOut: "shared utensils/cross-contact on bars; buttered veg, breaded chicken, pasta salads and croutons are common — read each tag", deliversTo: "Peninsula stores + Amazon/Prime delivery" },
    { name: "Territory Foods", type: "Prepared", note: "every meal is gluten-free AND dairy-free by default; use the 'avoid ingredients' filter for beef/pork/lamb and pick chicken, fish or plant mains", rating: 4, reviews: 300, ratingSrc: "Google", url: "https://www.territoryfoods.com", tags: ["Dairy-free option","Pescatarian","Chicken option","Gluten-free","High-protein","Organic","Local"], watchOut: "only trap is red meat on the menu — set the avoid-ingredients filter; local chef kitchens are shared", deliversTo: "Bay Area home delivery + Peninsula pickup points" },
    { name: "Pete's Real Food (Pete's Paleo)", type: "Prepared", note: "all meals paleo: gluten-free, dairy-free, soy-free; order the chicken, turkey, salmon & shrimp dishes from each weekly menu, ready to heat", rating: 3.8, reviews: 110, ratingSrc: "Trustpilot", url: "https://www.petesrealfood.com", tags: ["Dairy-free option","Paleo","Chicken option","Pescatarian","Gluten-free","Organic"], watchOut: "menus lean on beef/pork with lard/tallow and bone broth — choose poultry/fish meals only and check the fat used", deliversTo: "Bay Area & Peninsula (ships nationwide)" },
    { name: "The Good Kitchen", type: "Prepared", note: "every meal is gluten-free & dairy-free; save an allergen filter to the account and choose the chicken, turkey and salmon dishes", rating: 3.6, reviews: 90, ratingSrc: "Trustpilot", url: "https://www.thegoodkitchen.com", tags: ["Dairy-free option","Paleo","Chicken option","Pescatarian","Gluten-free","Organic"], watchOut: "chef network also cooks grass-fed beef & pork — filter to poultry/seafood; no ingredient swaps possible", deliversTo: "Bay Area & Peninsula (ships nationwide)" },
    { name: "MealPro", type: "Prepared", note: "build-your-own: pick chicken, white fish or plant protein with rice/quinoa/veg; use the Gluten-Free & Dairy-Free menu pages; confirm sauces", rating: 3.8, reviews: 90, ratingSrc: "Yelp", url: "https://www.mealpro.net", tags: ["Pescatarian","Chicken option","Dairy-free option","Paleo","Gluten-free","Local"], watchOut: "red-meat proteins and some sauced items on the menu — customize each meal and read the ingredient panel", deliversTo: "San Jose, Sunnyvale, Bay Area & Peninsula" },
    { name: "Jessie & Laurent", type: "Prepared", note: "weekly menu marks dairy-free and wheat-free dishes; order those chicken, fish or veggie dishes (chilled, no subscription); ask for mods", rating: 4, reviews: 84, ratingSrc: "Yelp", url: "https://jessieandlaurent.com", tags: ["Dairy-free option","Pescatarian","Chicken option","Gluten-free","Organic","Local"], watchOut: "not an allergen-free kitchen; menu includes beef/pork, bread & pasta — order only wheat-free + dairy-free labeled items", deliversTo: "Greater Bay Area & Peninsula" },
  ] },
  { category: "Plant-based (red-meat-free by default)", services: [
    { name: "Mosaic Foods", type: "Plant-based", note: "vegetarian (not vegan) frozen bowls; tick BOTH the Dairy-Free and Gluten-Free filters when building the box; pick tofu/lentil/chickpea bowls for protein", rating: 4, reviews: 1093, ratingSrc: "Trustpilot", url: "https://www.mosaicfoods.com", tags: ["Plant-based","Dairy-free option","High-protein","Organic","Gluten-free"], watchOut: "pasta bowls, pizzas & cheese items are on the menu; kitchen also handles wheat — rely on the two filters, not 'veggie'", deliversTo: "Nationwide" },
    { name: "Thistle", type: "Plant-based", note: "every meal is gluten-free AND dairy-free by default; choose plant-based or add lean protein (chicken/turkey/shrimp); no beef on the menu", rating: 4, reviews: 1000, ratingSrc: "Trustpilot", url: "https://www.thistle.co", tags: ["Plant-based","Dairy-free option","Pescatarian","Gluten-free","Organic"], watchOut: "confirm each week's protein add-on — skip any pork option; sauces are tamari/coconut-aminos based but check labels", deliversTo: "Bay Area" },
    { name: "Purple Carrot", type: "Plant-based", note: "100% vegan kits + prepared meals; use the Gluten-Free label/filter (≈4-6 of 8 weekly kits) — those are automatically dairy-free too", rating: 4.1, reviews: 5000, ratingSrc: "App Store", url: "https://www.purplecarrot.com", tags: ["Plant-based","Dairy-free option","High-protein","Gluten-free"], watchOut: "non-GF recipes use seitan, pasta, bread & soy sauce; kits are packed where wheat is handled — stick to GF-labeled only", deliversTo: "Nationwide" },
    { name: "Veestro", type: "Plant-based", note: "fully prepared vegan entrées; switch on the Gluten-Free filter (or the GF collection) — every item is already dairy-free; pick high-protein plates", rating: 3.6, reviews: 300, ratingSrc: "Trustpilot", url: "https://www.veestro.com", tags: ["Plant-based","Dairy-free option","High-protein","Gluten-free"], watchOut: "unfiltered menu includes seitan, pasta and breaded items; confirm 'gluten-free' on each product page before adding", deliversTo: "Nationwide" },
    { name: "Splendid Spoon", type: "Plant-based", note: "all vegan AND gluten-free by policy (in-house testing, audited protocols); order noodle bowls & grain bowls for protein — no setup needed", rating: 4, reviews: 162, ratingSrc: "Trustpilot", url: "https://www.splendidspoon.com", tags: ["Plant-based","Dairy-free option","Gluten-free"], watchOut: "facility also handles wheat/dairy — fine for most, but note it; smoothies are low-protein", deliversTo: "Nationwide" },
    { name: "Sakara Life", type: "Plant-based", note: "whole program is organic, plant-based, gluten-free & dairy-free — nothing to filter; plan extra protein alongside", rating: 3.8, reviews: 250, ratingSrc: "Trustpilot", url: "https://www.sakara.com", tags: ["Plant-based","Dairy-free option","Organic","Gluten-free"], watchOut: "Sakara says it cannot accommodate severe allergies (shared kitchen); pricey and low protein", deliversTo: "Nationwide" },
    { name: "Daily Harvest", type: "Plant-based", note: "entire menu is dairy-free and gluten-free (flatbreads use cauliflower/GF crust); no filter needed — bulk up bowls with protein", rating: 2.9, reviews: 1368, ratingSrc: "Trustpilot", url: "https://www.daily-harvest.com", tags: ["Plant-based","Dairy-free option","Organic","Gluten-free"], watchOut: "made in a facility that processes gluten & dairy; low protein per item; rating reflects service, not ingredients", deliversTo: "Nationwide" },
  ] },
  { category: "Gluten-free specialists", services: [
    { name: "Kitava To Go (Palo Alto)", type: "Prepared", note: "dedicated gluten-free, dairy-free kitchen (also soy/corn/seed-oil free); build a bowl with chicken, salmon or tofu; pickup on Alma St or delivery apps", rating: null, reviews: null, ratingSrc: null, url: "https://www.kitava.com", tags: ["Gluten-free","Dairy-free option","Chicken option","Pescatarian","Plant-based","Organic","Local"], watchOut: "menu may include grass-fed beef bowls — pick chicken/salmon/tofu; confirm current hours before relying on it", deliversTo: "Palo Alto (3441 Alma St) pickup + Uber Eats/Grubhub/Postmates" },
    { name: "Epicured", type: "Prepared", note: "100% gluten-free (and low-FODMAP) prepared meals shipped fresh; set the Dairy-Free allergen filter and pick chicken, turkey or fish entrées", rating: null, reviews: null, ratingSrc: null, url: "https://www.epicured.com", tags: ["Gluten-free","Dairy-free option","Chicken option","Pescatarian","High-protein","Prepared"], watchOut: "not all meals are dairy-free (cheese appears) and some use beef — stack the dairy-free filter and skip red meat", deliversTo: "Nationwide shipping (confirm 94305 at checkout)" },
    { name: "Paleo On The Go", type: "Prepared", note: "frozen paleo/AIP meals from San Diego, all gluten-, dairy- & soy-free; order the chicken, turkey, salmon and shrimp dishes à la carte or on a plan", rating: null, reviews: null, ratingSrc: null, url: "https://www.paleoonthego.com", tags: ["Gluten-free","Dairy-free option","Paleo","Chicken option","Pescatarian","Prepared"], watchOut: "heavy on grass-fed beef, pork, bacon and bone broth — read each item; choose poultry/fish only", deliversTo: "Ships nationwide (from San Diego)" },
    { name: "Ice Age Meals", type: "Prepared", note: "frozen paleo meals, all gluten-, dairy-, soy- & nut-free, shipped free to CA from Reno; build a 20-meal box from the chicken, turkey and fish dishes", rating: null, reviews: null, ratingSrc: null, url: "https://www.iceagemeals.net", tags: ["Gluten-free","Dairy-free option","Paleo","Chicken option","Pescatarian","Prepared"], watchOut: "many dishes are beef/bison/pork — no protein filter, so pick by name; minimum box is 20 meals (needs freezer space)", deliversTo: "Ships to all 50 states (2-day UPS)" },
    { name: "Hungryroot", type: "Meal kit", note: "grocery + recipe service; set Dietary Needs to Gluten-Free + Dairy-Free and Pescatarian, then it only suggests compliant chicken/fish/plant recipes", rating: null, reviews: null, ratingSrc: null, url: "https://www.hungryroot.com", tags: ["Gluten-free","Dairy-free option","Pescatarian","Chicken option","Plant-based","Meal kit"], watchOut: "'gluten-free' items aren't all certified and may share a facility; check the product photo/label for wheat & milk", deliversTo: "Nationwide" },
    { name: "Plentiful Kitchen", type: "Prepared", note: "SF Bay Area kitchen; every meal is gluten-free & dairy-free, organic produce, wild fish; order by Thursday, choose chicken/fish/veg dishes", rating: null, reviews: null, ratingSrc: null, url: "https://plentifulkitchen.com", tags: ["Gluten-free","Dairy-free option","Chicken option","Pescatarian","Organic","Local"], watchOut: "menu includes grass-fed beef — order poultry/fish/veg only; confirm Tuesday delivery covers 94305", deliversTo: "SF Bay Area weekly delivery (confirm Palo Alto ZIP)" },
    { name: "Westerly", type: "Prepared", note: "Bay Area chef-made whole-food meals, always gluten-free & dairy-free; pick the chicken, fish or plant dishes from the weekly menu", rating: null, reviews: null, ratingSrc: null, url: "https://www.westerlykitchen.com", tags: ["Gluten-free","Dairy-free option","Chicken option","Pescatarian","Local"], watchOut: "beef/pork dishes rotate through — choose by protein; confirm Peninsula delivery zone before ordering", deliversTo: "Bay Area weekly delivery (confirm Palo Alto ZIP)" },
  ] },
];

if (typeof module !== "undefined") {
  module.exports = { RULES, ORDER_MENU, HOURS, SEASONS, NUTRITION, GROCERY, GROCERY_ITEMS, STORES, SHOPS, PREP_SERVICES, FACTS };
}
