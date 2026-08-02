/*
 * Nour — Alpha-gal Syndrome (AGS) safe-food knowledge base
 *
 * AGS is an allergy to galactose-alpha-1,3-galactose ("alpha-gal"), a sugar
 * found in ALL non-primate mammals. Reactions are often DELAYED 2-6 hours.
 *
 * This file is the single source of truth for the ingredient checker and the
 * curated guides. Every rule carries a plain-language reason so the user can
 * make her own informed decision. This is a helper, NOT medical advice.
 *
 * Severity levels:
 *   avoid   -> mammalian meat or a reliably mammal-derived ingredient
 *   caution -> often mammal-derived OR dairy; depends on personal sensitivity
 *   safe    -> reassuring markers (still read the whole label)
 */

// ---------------------------------------------------------------------------
// RULE TABLE
// Each rule: match terms (lowercase), category, base severity, reason.
// "personal" ties the rule to a user toggle so sensitivity can be personalized.
// ---------------------------------------------------------------------------

const RULES = [
  // ---- Mammalian meat: always AVOID ----
  { terms: ["beef", "steak", "sirloin", "brisket", "ribeye", "filet mignon", "ground beef", "hamburger", "burger patty", "cheeseburger", "meatball", "meatloaf", "corned beef", "pastrami", "roast beef"], category: "Mammal meat (beef)", severity: "avoid", reason: "Beef is mammalian meat — a primary source of alpha-gal." },
  { terms: ["pork", "bacon", "ham", "prosciutto", "pancetta", "sausage", "chorizo", "salami", "pepperoni", "pulled pork", "carnitas", "al pastor", "spam", "hot dog", "bratwurst", "capicola", "mortadella"], category: "Mammal meat (pork)", severity: "avoid", reason: "Pork and cured pork products are mammalian — contain alpha-gal." },
  { terms: ["lamb", "mutton", "goat", "veal", "venison", "deer", "bison", "buffalo", "elk", "rabbit", "boar", "kangaroo", "mammal", "barbacoa", "gyro", "gyros"], category: "Mammal meat (other)", severity: "avoid", reason: "This is non-primate mammal meat (or a beef/lamb preparation like barbacoa or gyro) — a source of alpha-gal." },
  { terms: ["shawarma", "doner", "döner", "kebab", "kofta", "kebob", "meat sauce", "bolognese", "ragu", "ragù"], category: "Likely-mammal dish", severity: "caution", reason: "Often made from beef/lamb/pork. Ask what meat is used — chicken versions are usually safe." },
  { terms: ["oxtail", "tripe", "liver", "kidney", "sweetbread", "beef tongue", "marrow", "bone marrow"], category: "Mammal organ meat", severity: "avoid", reason: "Mammalian organ meats are especially high in alpha-gal and often react strongly." },

  // ---- Reliably mammal-derived: AVOID ----
  { terms: ["gelatin", "gelatine", "gel", "jell-o", "jello", "marshmallow", "gummy", "gummies"], category: "Gelatin", severity: "avoid", reason: "Gelatin is made from mammal skin/bone. A well-known hidden alpha-gal source (also in capsules, marshmallows, gummies)." },
  { terms: ["lard", "tallow", "suet", "beef fat", "pork fat", "beef tallow", "schmaltz (pork)", "manteca"], category: "Mammal fat", severity: "avoid", reason: "Rendered mammal fat — used for frying and in refried beans, pastry, tortillas." },
  { terms: ["beef broth", "beef stock", "pork broth", "bone broth", "beef bouillon", "pork bouillon", "beef base", "dashi (with meat)", "demi-glace", "beef consomme", "beef gravy", "pork gravy"], category: "Mammal broth/stock", severity: "avoid", reason: "Broth or stock made from mammal bones/meat carries alpha-gal." },
  { terms: ["collagen", "hydrolyzed collagen", "bovine collagen", "porcine"], category: "Collagen", severity: "avoid", reason: "Collagen is a mammalian connective-tissue protein — appears in drinks, bars, and supplements." },
  { terms: ["carmine", "cochineal", "carminic acid", "e120", "crimson lake"], category: "Carmine (red dye)", severity: "caution", reason: "Carmine is from insects, not mammals — usually fine for alpha-gal, but some AGS patients still react. Verify with your allergist." },

  // ---- Dairy & mammalian byproducts: PERSONAL (default caution) ----
  { terms: ["milk", "whole milk", "cream", "heavy cream", "half and half", "butter", "buttermilk", "cheese", "cheddar", "mozzarella", "parmesan", "feta", "yogurt", "ghee", "ice cream", "custard", "queso", "sour cream", "creme fraiche", "condensed milk", "evaporated milk", "gelato"], category: "Dairy (cow/goat)", severity: "caution", personal: "dairy", reason: "Dairy is a mammal product. Many AGS patients tolerate it; some react (especially to high-fat dairy). Set your dairy sensitivity in Settings." },
  { terms: ["whey", "casein", "caseinate", "lactose", "milk solids", "milk powder", "milkfat", "milk fat", "curds"], category: "Dairy protein/derivative", severity: "caution", personal: "dairy", reason: "A milk-derived ingredient. Same personal-tolerance note as dairy." },
  { terms: ["rennet", "animal rennet"], category: "Rennet", severity: "caution", personal: "dairy", reason: "Traditional rennet is from calf stomach (mammalian). Microbial/vegetarian rennet is fine." },

  // ---- Ambiguous / often-animal additives: PERSONAL (default caution) ----
  { terms: ["natural flavor", "natural flavors", "natural flavoring", "natural flavour"], category: "Natural flavors", severity: "caution", personal: "flavors", reason: "'Natural flavors' can include mammal-derived components and isn't disclosed. Conservative AGS patients avoid or verify with the maker." },
  { terms: ["glycerin", "glycerine", "glycerol", "mono and diglycerides", "monoglycerides", "diglycerides", "magnesium stearate", "stearic acid", "stearate", "oleic acid", "sodium stearoyl lactylate"], category: "Possibly-animal additive", severity: "caution", personal: "additives", reason: "Can be plant- OR animal-derived; source is rarely stated. Often fine, but flagged so you can check." },
  { terms: ["glucosamine", "chondroitin", "heparin"], category: "Animal-derived supplement", severity: "caution", personal: "additives", reason: "Commonly sourced from mammal/shellfish tissue — check the supplement's source." },

  // ---- Reassuring SAFE markers ----
  { terms: ["chicken", "turkey", "duck", "cornish hen", "poultry", "chicken breast", "grilled chicken", "rotisserie chicken", "roasted turkey"], category: "Poultry", severity: "safe", reason: "Poultry is a bird, not a mammal — safe for alpha-gal." },
  { terms: ["fish", "salmon", "tuna", "cod", "halibut", "tilapia", "trout", "mahi", "snapper", "sardine", "anchovy", "mackerel", "sea bass", "branzino"], category: "Fish", severity: "safe", reason: "Fish contain no alpha-gal — safe." },
  { terms: ["shrimp", "prawn", "crab", "lobster", "scallop", "clam", "mussel", "oyster", "squid", "calamari", "octopus", "crawfish", "poke"], category: "Shellfish/seafood", severity: "safe", reason: "Shellfish and seafood are alpha-gal safe (unless you have a separate shellfish allergy)." },
  { terms: ["egg", "eggs", "omelet", "omelette", "tofu", "tempeh", "edamame", "beans", "black beans", "chickpea", "garbanzo", "lentil", "hummus", "falafel", "seitan", "nuts", "almond", "peanut", "cashew", "quinoa", "rice", "avocado"], category: "Plant / egg protein", severity: "safe", reason: "Eggs and plant proteins contain no alpha-gal — safe staples." },
  { terms: ["vegan", "plant-based", "plant based", "dairy-free", "vegetarian"], category: "Label claim", severity: "safe", reason: "Vegan/plant-based items avoid all mammal products. (Vegetarian may still contain dairy/gelatin — read on.)" },
];

// ---------------------------------------------------------------------------
// CURATED DOORDASH-STYLE SAFE ORDERS (chains common around Stanford / Palo Alto)
// "order" = a genuinely safe build. "watch" = the trap to avoid at that spot.
// ---------------------------------------------------------------------------

const RESTAURANTS = [
  { name: "Chipotle", cuisine: "Mexican", order: "Chicken burrito bowl: white/brown rice, black or pinto beans (their beans are vegetarian — no lard), fajita veggies, chicken, salsa, guac, lettuce.", watch: "Skip carnitas, barbacoa, steak, and chorizo. Cheese/sour cream = dairy (your call)." },
  { name: "Sweetgreen", cuisine: "Salads/bowls", order: "Build-your-own with roasted chicken or tofu, any grains and veggies. 'Harvest Bowl' works if you swap off any goat cheese.", watch: "Watch for goat cheese, bacon bits, and warm mushroom (check dressing bases)." },
  { name: "CAVA", cuisine: "Mediterranean", order: "Greens/grain bowl with grilled chicken or falafel, hummus, greens, most spreads, pita.", watch: "Skip braised lamb and any beef meatballs. Tzatziki/feta = dairy." },
  { name: "Poke bowls (e.g. Poki Bowl, Pokéworks)", cuisine: "Hawaiian", order: "Salmon or tuna or shrimp poke over rice with seaweed, edamame, avocado, veggies. Excellent AGS choice.", watch: "Only mammal risk is imitation-crab fillers/'natural flavor' — ask, or use real fish." },
  { name: "Sushi / Japanese", cuisine: "Japanese", order: "Sashimi, nigiri, veggie/fish rolls, edamame, miso soup, chicken teriyaki, agedashi tofu.", watch: "Avoid pork/beef gyoza, tonkotsu (pork-bone) ramen, and beef broths. Check dashi." },
  { name: "Thai", cuisine: "Thai", order: "Chicken or tofu or shrimp with pad thai, pad see ew, green/red curry, drunken noodles.", watch: "Skip pork/beef dishes. Some curries use fish sauce (safe) — confirm no beef/pork base." },
  { name: "Panda Express", cuisine: "Chinese-American", order: "Grilled Teriyaki Chicken, Mushroom Chicken, String Bean Chicken, Super Greens, steamed rice.", watch: "Avoid Beijing Beef, SweetFire Chicken Breast? (ok) — the real avoid list is anything beef/BBQ pork." },
  { name: "Chick-fil-A", cuisine: "Fast food", order: "Grilled chicken sandwich or nuggets, grilled nuggets, waffle fries (fried in canola oil), side salad, fruit cup.", watch: "Bun/mayo contain egg/dairy (fine unless dairy-sensitive). No mammal fat in their fries — good." },
  { name: "Mediterranean / Halal (e.g. The Halal Guys)", cuisine: "Mediterranean", order: "Chicken over rice, falafel, hummus, salad, pita.", watch: "Skip the gyro/lamb/beef. White sauce may contain dairy." },
  { name: "Indian", cuisine: "Indian", order: "Chicken tikka, tandoori chicken, chana masala, dal, veg curries, rice, most naan.", watch: "Avoid lamb/goat (rogan josh, keema). Ghee & paneer = dairy. Naan may have milk." },
  { name: "Pho / Vietnamese", cuisine: "Vietnamese", order: "Chicken pho (pho ga), spring rolls with shrimp, vermicelli bowls with grilled chicken or shrimp.", watch: "Classic beef pho broth is a mammal-broth AVOID. Ask specifically for chicken broth." },
  { name: "Pizza (build-your-own)", cuisine: "Italian", order: "Cheese or veggie pizza, or chicken + veg. Many places offer vegan cheese.", watch: "No pepperoni/sausage/ham. Cheese = dairy. Ask if crust/dough uses lard (rare but possible)." },
];

// ---------------------------------------------------------------------------
// WHOLE FOODS GROCERY GUIDE
// ---------------------------------------------------------------------------

const GROCERY = {
  proteins: [
    "Fresh & frozen poultry: chicken, turkey, duck",
    "Fresh & frozen fish and seafood: salmon, tuna, cod, shrimp, scallops",
    "Eggs (all)",
    "Tofu, tempeh, edamame, seitan (wheat-based)",
    "Canned beans, lentils, chickpeas — check for no lard",
    "Nuts, nut butters, seeds",
    "365 plant-based / vegan proteins (read for 'natural flavors' if very sensitive)",
  ],
  swaps: [
    { instead: "Beef/pork broth", use: "Chicken broth or vegetable broth (365 or Pacific)" },
    { instead: "Gelatin desserts", use: "Agar-agar, pectin-set jams, vegan gummies" },
    { instead: "Butter/lard in baking", use: "Olive/avocado/coconut oil, or vegan butter (Miyoko's, Earth Balance)" },
    { instead: "Marshmallows", use: "Dandies (vegan, gelatin-free)" },
    { instead: "Regular capsules/vitamins", use: "Gelatin-free 'veggie capsule' or tablet forms" },
    { instead: "Dairy milk (if sensitive)", use: "Oat, almond, soy, coconut milk" },
  ],
  labelCheck: [
    "gelatin / gelatine  → mammal (avoid)",
    "collagen  → mammal (avoid)",
    "lard, tallow, suet  → mammal fat (avoid)",
    "beef/pork/bone broth or stock  → mammal (avoid)",
    "mono- & diglycerides, magnesium stearate, glycerin  → could be animal (verify)",
    "'natural flavors'  → undisclosed; conservative patients verify",
    "whey, casein, milkfat  → dairy (personal tolerance)",
  ],
};

// ---------------------------------------------------------------------------
// EDUCATION / QUICK FACTS
// ---------------------------------------------------------------------------

const FACTS = [
  "Alpha-gal is a sugar found in ALL non-primate mammals — beef, pork, lamb, venison, bison, goat, rabbit.",
  "Reactions are often DELAYED 2–6 hours after eating, which makes the trigger hard to spot.",
  "Poultry, fish, shellfish, eggs, and plants do NOT contain alpha-gal — these are your safe base.",
  "Hidden sources matter most: gelatin (marshmallows, gummies, capsules), broth, lard/tallow, collagen.",
  "Many patients also react to dairy and gelatin capsules; sensitivity is personal — track your own.",
  "Cross-contamination (shared grills/fryers with mammal fat) can trigger reactions — ask restaurants.",
  "Always carry your epinephrine auto-injector and antihistamines. When in doubt, don't eat it.",
];

if (typeof module !== "undefined") {
  module.exports = { RULES, RESTAURANTS, GROCERY, FACTS };
}
