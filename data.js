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
  { terms: ["milk", "whole milk", "cream", "heavy cream", "half and half", "butter", "buttermilk", "cheese", "cheddar", "mozzarella", "parmesan", "feta", "cotija", "paneer", "yogurt", "ghee", "ice cream", "custard", "queso", "sour cream", "crema", "creme fraiche", "condensed milk", "evaporated milk", "gelato", "labneh", "tzatziki"], category: "Dairy", severity: "caution", personal: "dairy", reason: "Dairy — a mammal product. Nour is allergic to dairy, so this is flagged as unsafe (ghee/butter/cheese/cream/yogurt all count)." },
  { terms: ["whey", "casein", "caseinate", "lactose", "milk solids", "milk powder", "milkfat", "milk fat", "curds"], category: "Dairy derivative", severity: "caution", personal: "dairy", reason: "A milk-derived ingredient — unsafe with a dairy allergy." },
  { terms: ["rennet", "animal rennet"], category: "Rennet", severity: "caution", personal: "dairy", reason: "Traditional rennet is from calf stomach (mammalian), and it means cheese/dairy. Unsafe here." },

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

// Structure: meal type -> categories -> restaurants (ranked by rating in the UI)
// -> dairy-free & mammal-free safe dishes. DoorDash links are generated in code
// from the restaurant name + city (a name search always resolves to the store).
// Ratings are point-in-time from Google/Yelp/DoorDash (source shown on each card)
// and are approximate — menus and ratings change; confirm dairy-free when ordering.
const ORDER_MENU = {
  breakfast: [
    {
      category: "Cafés & bakeries",
      restaurants: [
        { name: "The Farm", area: "Palo Alto", rating: 4.5, reviews: 193, ratingSrc: "Google", safeDishes: [
          { dish: "Avocado toast", note: "dry / no butter, no cheese" },
          { dish: "Açaí bowl", note: "confirm dairy-free granola, no yogurt drizzle" },
          { dish: "Egg sandwich", note: "no cheese; skip the prosciutto version" },
          { dish: "Fresh fruit", note: "plain" },
        ], watchOut: "prosciutto (pork) on the signature egg sandwich; French toast is butter/custard; lattes are dairy — order oat milk" },
        { name: "Verve Coffee Roasters", area: "Palo Alto", rating: 4.4, reviews: null, ratingSrc: "Google", safeDishes: [
          { dish: "Avocado toast, add egg", note: "no cheese, dry / no butter" },
          { dish: "Oat-milk latte or cold brew", note: "oat/almond milk, no whipped dairy" },
        ], watchOut: "skip the cheese bread and butter pastries; espresso drinks are dairy unless you ask for oat/almond milk" },
        { name: "Coupa Cafe", area: "Palo Alto", rating: 4.1, reviews: 1483, ratingSrc: "Yelp", safeDishes: [
          { dish: "Breakfast arepa with scrambled eggs", note: "no cheese; corn arepa is naturally dairy-free" },
          { dish: "Avocado toast", note: "dry / no butter, no cheese" },
          { dish: "Latte or cappuccino", note: "with oat or almond milk" },
          { dish: "Fresh fruit cup", note: "plain" },
        ], watchOut: "arepas and croissant sandwiches often come with cheese; lattes are dairy by default; toast may be buttered" },
        { name: "Douce France", area: "Palo Alto", rating: null, reviews: 738, ratingSrc: "Yelp", safeDishes: [
          { dish: "Plain French omelette with side salad", note: "no cheese; cooked in oil, not butter" },
          { dish: "Egg sandwich on baguette", note: "no cheese; no ham/bacon" },
          { dish: "Fresh fruit", note: "plain" },
        ], watchOut: "French bakery — croissants/pastries are all butter, Croque has cheese + béchamel, pancakes are buttermilk, ham is pork; stick to plain egg dishes" },
      ],
    },
    {
      category: "American breakfast",
      restaurants: [
        { name: "Joanie's Café", area: "Palo Alto", rating: 4.4, reviews: null, ratingSrc: "Google", safeDishes: [
          { dish: "Two eggs any style with potatoes & toast", note: "dry toast / no butter; no bacon or sausage" },
          { dish: "Egg-white veggie scramble", note: "no cheese" },
          { dish: "Oatmeal", note: "made with water or oat milk, no butter" },
          { dish: "Fresh fruit bowl", note: "plain" },
        ], watchOut: "pancakes/waffles/French toast are buttermilk + butter; omelets and Benedict (hollandaise) are dairy; bacon/ham/sausage are pork" },
        { name: "Stacks", area: "Menlo Park", rating: 4.3, reviews: 1300, ratingSrc: "Google", safeDishes: [
          { dish: "Two eggs with potatoes & toast", note: "dry toast / no butter; no meat side" },
          { dish: "Egg-white scramble with vegetables", note: "no cheese" },
          { dish: "Huevos rancheros", note: "no cheese, no crema; ask for beans without lard" },
          { dish: "Fresh fruit", note: "plain" },
        ], watchOut: "pancakes/French toast are buttermilk + butter; chilaquiles/huevos come with cheese + crema; bacon/sausage/ham/chicken-fried steak are pork/beef" },
        { name: "Palo Alto Creamery", area: "Palo Alto", rating: 4.2, reviews: null, ratingSrc: "Tripadvisor", safeDishes: [
          { dish: "Two eggs with hash browns & toast", note: "dry toast / no butter; no bacon/sausage" },
          { dish: "Homemade oatmeal", note: "oat milk, no butter" },
          { dish: "Egg-white veggie scramble", note: "no cheese" },
          { dish: "Fresh fruit", note: "plain" },
        ], watchOut: "soda-fountain diner — milkshakes/malts, buttermilk pancakes, cheese omelets and buttered toast everywhere; bacon/sausage/ham are pork" },
        { name: "Hatched", area: "Palo Alto", rating: null, reviews: 47, ratingSrc: "Yelp", safeDishes: [
          { dish: "Egg sandwich", note: "no cheese; a version without bacon/prosciutto" },
          { dish: "Avocado toast", note: "dry / no butter, no cheese" },
          { dish: "Side of soft-scrambled eggs", note: "no cheese" },
        ], watchOut: "sandwiches default to cheese + prosciutto/bacon (pork); matcha and espresso drinks are dairy — ask for oat milk" },
      ],
    },
    {
      category: "Bagels",
      restaurants: [
        { name: "Izzy's Brooklyn Bagels", area: "Palo Alto", rating: 4.5, reviews: null, ratingSrc: "Tripadvisor", safeDishes: [
          { dish: "Bagel with nova (smoked salmon), tomato, onion, capers", note: "no cream cheese — bagels are pareve/dairy-free" },
          { dish: "Bagel with vegan cream cheese", note: "they carry a vegan option; confirm at order" },
          { dish: "Plain bagel", note: "with jam, no butter" },
        ], watchOut: "kosher deli — standard cream cheese and egg-and-cheese are dairy; also skip beef pastrami/corned beef (mammal)" },
        { name: "House of Bagels", area: "Mountain View", rating: 4.3, reviews: 662, ratingSrc: "Google", safeDishes: [
          { dish: "Bagel with lox, tomato & onion", note: "no cream cheese" },
          { dish: "Plain bagel with jam", note: "no butter" },
          { dish: "Egg bagel sandwich", note: "no cheese, no bacon/ham/sausage" },
        ], watchOut: "cream-cheese schmears and buttered bagels are dairy; breakfast sandwiches default to cheese + pork" },
        { name: "Bagel Street Cafe", area: "Mountain View", rating: 4.2, reviews: 527, ratingSrc: "Restaurant Guru", safeDishes: [
          { dish: "Veggie bagel (avocado, tomato, cucumber, sprouts)", note: "no cheese / cream cheese" },
          { dish: "Bagel with lox", note: "no cream cheese / no butter" },
          { dish: "Plain bagel with jam", note: "no butter" },
        ], watchOut: "cream cheese and cheese slices are the default; sandwiches add bacon/ham/sausage (pork)" },
        { name: "Boichik Bagels", area: "Palo Alto", rating: 4.0, reviews: null, ratingSrc: "Google", safeDishes: [
          { dish: "Bagel with lox, tomato, onion & capers", note: "hold the cream cheese — water bagels are dairy-free" },
          { dish: "Bagel with lox", note: "no schmear / butter" },
        ], watchOut: "the concept is cream-cheese schmears (dairy) — order bagel + lox + veggies with NO schmear/butter" },
      ],
    },
    {
      category: "Mexican breakfast",
      restaurants: [
        { name: "Los Altos Taqueria", area: "Mountain View", rating: 4.2, reviews: 819, ratingSrc: "Yelp", safeDishes: [
          { dish: "Breakfast burrito with eggs & beans", note: "no chorizo/bacon, no cheese, no sour cream; whole (non-lard) beans" },
          { dish: "Grilled fish tacos", note: "corn tortillas, no crema, no cheese" },
          { dish: "Veggie burrito", note: "no cheese, no crema" },
          { dish: "Chips with guacamole & salsa", note: "plain" },
        ], watchOut: "chorizo, carnitas, al pastor, carne asada are pork/beef; burritos default to cheese + crema; refried beans may use lard" },
        { name: "Sancho's Taqueria", area: "Palo Alto", rating: 4.2, reviews: 851, ratingSrc: "Google", safeDishes: [
          { dish: "Breakfast burrito, egg & potato & beans", note: "no meat, no cheese, no sour cream" },
          { dish: "Grilled fish tacos", note: "no crema, no cheese" },
          { dish: "Veggie burrito", note: "no cheese, no crema; ask for beans without lard" },
          { dish: "Chips & guacamole", note: "plain" },
        ], watchOut: "chorizo/bacon and carnitas/asada are pork/beef; cheese and crema are standard; check refried beans for lard" },
      ],
    },
    {
      category: "Açaí & smoothie bowls",
      restaurants: [
        { name: "Palmetto Superfoods", area: "Palo Alto", rating: 4.4, reviews: 500, ratingSrc: "Uber Eats", safeDishes: [
          { dish: "'Just Açaí' signature bowl", note: "confirm dairy-free granola" },
          { dish: "Build-your-own açaí bowl", note: "skip Nutella (milk)" },
          { dish: "Smoothie", note: "almond/oat/coconut base, no yogurt" },
        ], watchOut: "açaí base is dairy-free; Nutella has milk and some smoothies use yogurt; skip the collagen add-on (mammal)" },
        { name: "Pressed", area: "Palo Alto", rating: 4.0, reviews: 361, ratingSrc: "Yelp", safeDishes: [
          { dish: "Açaí Original Bowl", note: "base is dairy-free" },
          { dish: "Açaí Power Bowl", note: "choose plant protein, not whey" },
          { dish: "Smoothie", note: "almond/oat base, no dairy or yogurt" },
          { dish: "Dairy-free 'Freeze' soft serve", note: "coconut/almond based" },
        ], watchOut: "the only trap is dairy/whey protein add-ins and yogurt in some smoothies — pick plant protein and an almond/oat base" },
        { name: "Vitality Bowls", area: "Palo Alto", rating: 3.8, reviews: 324, ratingSrc: "Yelp", safeDishes: [
          { dish: "Açaí bowl with granola, banana, strawberries", note: "dairy-free base; confirm granola is dairy-free" },
          { dish: "Peanut-butter açaí bowl", note: "" },
          { dish: "Smoothie or fresh juice", note: "almond/oat base, no dairy protein" },
          { dish: "Avocado toast", note: "dry / no butter, no cheese" },
        ], watchOut: "açaí is juice/water blended (dairy-free), but paninis have cheese and some protein add-ins are whey — keep to fruit bowls and plant-milk smoothies" },
      ],
    },
  ],

  lightLunch: [
    {
      category: "Salads & bowls",
      restaurants: [
        { name: "True Food Kitchen", area: "Palo Alto", rating: 4.3, reviews: 2403, ratingSrc: "Yelp", safeDishes: [
          { dish: "Ancient Grains Bowl", note: "vegan; add grilled chicken if wanted" },
          { dish: "Ahi Poke Bowl", note: "sushi rice, avocado, soy — dairy-free" },
          { dish: "Tuscan Kale Salad", note: "no parmesan" },
        ], watchOut: "kale & Caesar salads have parmesan; pizzas and squash toast are cheese-heavy; some bowls add goat cheese — specify no cheese" },
        { name: "Asian Box", area: "Palo Alto", rating: 4.2, reviews: 811, ratingSrc: "Yelp", safeDishes: [
          { dish: "Build-a-box: rice or greens + lemongrass chicken, veg, herbs", note: "tamarind or lemongrass vinaigrette; dairy-free" },
          { dish: "Tofu box over rice noodles with vegetables", note: "dairy-free" },
          { dish: "Shrimp box with greens and herbs", note: "dairy-free" },
        ], watchOut: "skip the caramelized-pork protein (mammal); the Vietnamese menu has no dairy" },
        { name: "Sweetgreen", area: "Palo Alto", rating: 3.6, reviews: 442, ratingSrc: "Yelp", safeDishes: [
          { dish: "Harvest Bowl (chicken, wild rice, sweet potato, apple, almonds)", note: "no goat cheese; balsamic" },
          { dish: "Create-your-own with chicken or tofu + greens", note: "no cheese; balsamic or lime-cilantro vinaigrette" },
          { dish: "Miso Glazed Salmon plate", note: "miso-ginger, no dairy" },
        ], watchOut: "goat cheese/parmesan/feta are removable; avoid Caesar, ranch and green-goddess (buttermilk) dressings" },
      ],
    },
    {
      category: "Poke",
      restaurants: [
        { name: "Go Fish Poke Bar", area: "Palo Alto", rating: 4.3, reviews: 464, ratingSrc: "Google", safeDishes: [
          { dish: "Ahi tuna poke bowl over rice", note: "shoyu/ponzu; dairy-free" },
          { dish: "Salmon poke bowl with avocado, seaweed salad, edamame", note: "dairy-free" },
          { dish: "Build-your-own with tuna/salmon/shrimp", note: "ponzu or shoyu base; dairy-free" },
        ], watchOut: "inherently dairy- & mammal-free; spicy mayo is egg-based (fine)" },
        { name: "Poke House", area: "Palo Alto", rating: 4.1, reviews: 253, ratingSrc: "Yelp", safeDishes: [
          { dish: "Build-your-own ahi poke bowl, shoyu, seaweed salad, edamame", note: "dairy-free" },
          { dish: "Salmon poke bowl with avocado and ponzu", note: "dairy-free" },
        ], watchOut: "no dairy or mammal meat on the menu; 'house' mayo is egg-based" },
      ],
    },
    {
      category: "Sandwiches & wraps",
      restaurants: [
        { name: "Mendocino Farms", area: "Palo Alto", rating: 4.5, reviews: 435, ratingSrc: "Yelp", safeDishes: [
          { dish: "Vegan Banh Mi (marinated tofu, pickled veg, cilantro)", note: "dairy-free, vegan" },
          { dish: "Impossible Taco Salad", note: "no cotija, no crema" },
          { dish: "Curried Couscous & Falafel salad", note: "no yogurt drizzle; confirm dairy-free dressing" },
        ], watchOut: "caprese/pesto have mozzarella; Farm Club & BLTs have bacon (mammal); Caesar wrap has parmesan; aiolis are egg-based and fine" },
        { name: "Ike's Love & Sandwiches", area: "Palo Alto", rating: 3.3, reviews: 158, ratingSrc: "Yelp", safeDishes: [
          { dish: "Fall'ing for Ike's (vegan turkey, cranberry, sriracha)", note: "no cheddar / no vegan cheese" },
          { dish: "Real turkey or halal-chicken sandwich", note: "no cheese; Dirty Sauce is vegan garlic aioli" },
          { dish: "Meatless Mike (vegan meatballs, marinara)", note: "no cheese" },
        ], watchOut: "cheese is the default on nearly every sandwich — order no cheese; avoid bacon/salami/pepperoni/meatball/pastrami (mammal)" },
      ],
    },
    {
      category: "Mediterranean",
      restaurants: [
        { name: "Zareen's", area: "Palo Alto", rating: 4.5, reviews: 2992, ratingSrc: "Yelp", safeDishes: [
          { dish: "Chana Masala (marked vegan)", note: "over basmati rice, not naan" },
          { dish: "Aloo Cholay (potato-chickpea, vegan)", note: "ask for no ghee; with rice" },
          { dish: "Vegetable samosa", note: "confirm vegan filling, not chicken" },
        ], watchOut: "tikka masala/butter chicken/korma use cream/butter; naan & paratha have ghee; raita is yogurt; tikka marinades use yogurt; beef/lamb are mammal — stick to marked-vegan chickpea/potato curries over plain rice" },
        { name: "Oren's Hummus", area: "Palo Alto", rating: 4.3, reviews: 2743, ratingSrc: "Yelp", safeDishes: [
          { dish: "Hummus Classic with warm pita", note: "dairy-free, vegan" },
          { dish: "Falafel pita or plate", note: "tahini; dairy-free" },
          { dish: "Chicken skewer plate with rice & Israeli salad", note: "no labneh/feta add-on" },
        ], watchOut: "skip beef/lamb kebab & shawarma (mammal) and any feta or labneh add-on (dairy)" },
        { name: "SAJJ Mediterranean", area: "Sunnyvale", rating: 4.0, reviews: 401, ratingSrc: "Yelp", safeDishes: [
          { dish: "Build-a-bowl with falafel over rice or salad", note: "hummus, tahini, harissa; no tzatziki/feta" },
          { dish: "Chicken shawarma bowl", note: "tahini or harissa; garlic toum is dairy-free" },
          { dish: "Falafel wrap", note: "hummus + tahini; skip yogurt sauces" },
        ], watchOut: "avoid tzatziki/garlic-yogurt sauce and feta (dairy) and the steak shawarma (beef); toum, hummus, tahini, harissa are dairy-free" },
        { name: "CAVA", area: "Mountain View", rating: 3.7, reviews: 3500, ratingSrc: "Yelp", safeDishes: [
          { dish: "Greens + grains bowl with falafel or grilled chicken", note: "hummus, harissa, roasted veg; tahini or harissa vinaigrette" },
          { dish: "Crispy Falafel Pita", note: "vegan; hummus, eggplant, slaw, garlic dressing, skhug" },
          { dish: "Salad bowl with chicken, hummus, roasted eggplant", note: "garlic dressing (dairy-free)" },
        ], watchOut: "Crazy Feta, tzatziki, feta and the yogurt-dill dressing are dairy — skip them; only proteins are chicken and falafel" },
      ],
    },
    {
      category: "Cafés & light bites",
      restaurants: [
        { name: "Garden Fresh (vegan Chinese)", area: "Mountain View", rating: 4.4, reviews: 1452, ratingSrc: "Yelp", safeDishes: [
          { dish: "Fresh spring rolls", note: "vegan, dairy-free" },
          { dish: "Buddha's Feast / mixed vegetable brown-rice bowl", note: "dairy-free" },
          { dish: "Vegan 'chicken' lettuce wraps", note: "soy protein; dairy-free" },
          { dish: "Mango salad", note: "dairy-free" },
        ], watchOut: "entirely 100% vegan — no dairy and no real meat; the mock 'beef/pork/chicken' are soy (safe for AGS)" },
        { name: "Coupa Café", area: "Palo Alto", rating: 4.1, reviews: 1483, ratingSrc: "Yelp", safeDishes: [
          { dish: "House or chicken salad with vinaigrette", note: "no cheese" },
          { dish: "Reina Pepiada arepa (chicken-avocado)", note: "no cheese; corn arepa is dairy-free" },
          { dish: "Turkey sandwich", note: "no cheese, no butter" },
        ], watchOut: "arepas are usually stuffed with white cheese — order without; Caesar has parmesan and creamy dressing; croissants have butter" },
      ],
    },
    {
      category: "Smoothies & açaí bowls",
      restaurants: [
        { name: "Bare Bowls", area: "Palo Alto", rating: 4.5, reviews: 438, ratingSrc: "Yelp", safeDishes: [
          { dish: "The OG açaí bowl (açaí, banana, granola, berries)", note: "house cashew-milk base; dairy-free" },
          { dish: "Peanut butter açaí bowl", note: "dairy-free" },
          { dish: "Smoothies with house cashew milk", note: "dairy-free" },
        ], watchOut: "built on açaí + house cashew milk — the whole menu is dairy-free with no mammal items" },
        { name: "Palmetto Superfoods", area: "Palo Alto", rating: 4.4, reviews: 500, ratingSrc: "Uber Eats", safeDishes: [
          { dish: "Signature açaí bowl", note: "default vegan; dairy-free" },
          { dish: "Pitaya or Blue Majik bowl", note: "plant base; dairy-free" },
          { dish: "Smoothie with plant-milk base", note: "dairy-free" },
        ], watchOut: "vegan by default; the one trap is the optional collagen-peptide add-on (mammal) — leave it off" },
        { name: "Vitality Bowls", area: "Palo Alto", rating: 3.8, reviews: 324, ratingSrc: "Yelp", safeDishes: [
          { dish: "Original / Graviola açaí bowl", note: "dairy-free açaí base" },
          { dish: "Pitaya (dragonfruit) bowl", note: "plant base; dairy-free" },
          { dish: "Fruit or green smoothie", note: "apple juice or almond milk base, no yogurt" },
        ], watchOut: "choose açaí/pitaya bowls and a juice or plant-milk smoothie base; skip the paninis (cheese) and Nutella topping" },
        { name: "Jamba", area: "Palo Alto", rating: 3.5, reviews: 138, ratingSrc: "Yelp", safeDishes: [
          { dish: "Açaí Primo or PB Mood bowl", note: "plant base; dairy-free" },
          { dish: "Greens 'n Ginger smoothie", note: "all fruit/veg juice; dairy-free" },
          { dish: "Fruit smoothie with almond or soymilk", note: "no frozen yogurt / sherbet" },
        ], watchOut: "many classic smoothies contain sherbet or frozen yogurt (dairy) — pick all-fruit/juice or plant-milk and ask for no yogurt/sherbet" },
      ],
    },
  ],

  dinner: [
    {
      category: "Mexican",
      restaurants: [
        { name: "Reposado", area: "Palo Alto", rating: 4.3, reviews: 1535, ratingSrc: "Yelp", safeDishes: [
          { dish: "Grilled fish tacos", note: "no crema/cheese" },
          { dish: "Ceviche", note: "citrus-cured fish, dairy-free" },
          { dish: "Guacamole & chips", note: "dairy-free" },
          { dish: "Grilled chicken plate", note: "no cheese/crema, ask for no butter" },
        ], watchOut: "avoid carnitas & carne asada (mammal); enchiladas and most plates arrive with melted cheese & crema — request without" },
        { name: "Sancho's Taqueria", area: "Palo Alto", rating: 4.2, reviews: 851, ratingSrc: "Google", safeDishes: [
          { dish: "Grilled chicken (pollo asado) taco", note: "no cheese, corn tortilla" },
          { dish: "Grilled fish taco", note: "no crema/cheese, cabbage & salsa" },
          { dish: "Chicken burrito", note: "no cheese/sour cream, black beans (not refried)" },
          { dish: "Shrimp taco", note: "no crema/cheese" },
        ], watchOut: "avoid carnitas, al pastor, carne asada (mammal); skip queso/crema/sour cream; confirm black beans (refried can have lard)" },
        { name: "Celia's Mexican Restaurant", area: "Palo Alto", rating: 4.3, reviews: 712, ratingSrc: "Birdeye", safeDishes: [
          { dish: "Chicken fajitas", note: "no cheese/sour cream; tortillas without lard" },
          { dish: "Grilled chicken taco", note: "no cheese, salsa" },
          { dish: "Fish taco", note: "no crema/cheese" },
          { dish: "Chips, salsa & guacamole", note: "dairy-free" },
        ], watchOut: "skip carnitas & carne asada (mammal) and all cheese/sour cream; confirm beans are whole/black, not lard refried" },
        { name: "Toluco Mexican Kitchen", area: "East Palo Alto", rating: 4.0, reviews: 107, ratingSrc: "Yelp", safeDishes: [
          { dish: "Grilled chicken (pollo) taco", note: "no cheese/crema" },
          { dish: "Grilled fish taco", note: "no crema" },
          { dish: "Shrimp (camarones) taco", note: "no cheese/crema" },
          { dish: "Chicken burrito", note: "no cheese/sour cream, black beans" },
        ], watchOut: "their birria/quesabirria is beef + cheese — avoid; skip al pastor & carnitas (mammal) and all crema/queso" },
      ],
    },
    {
      category: "Mediterranean & Middle Eastern",
      restaurants: [
        { name: "Nick the Greek", area: "Palo Alto", rating: 4.8, reviews: 652, ratingSrc: "Google", safeDishes: [
          { dish: "Chicken gyro pita", note: "no tzatziki/feta, add hummus" },
          { dish: "Chicken souvlaki bowl", note: "rice + salad, no tzatziki/feta" },
          { dish: "Falafel pita", note: "no tzatziki, no feta" },
          { dish: "Greek salad", note: "no feta, oil & vinegar" },
        ], watchOut: "pork/lamb/beef gyro is mammal — order chicken; tzatziki and feta are dairy — omit both" },
        { name: "Mediterranean Wraps", area: "Palo Alto", rating: 4.5, reviews: 1168, ratingSrc: "Yelp", safeDishes: [
          { dish: "Falafel wrap", note: "no feta, add hummus/tahini" },
          { dish: "Chicken shawarma wrap", note: "no dairy sauce" },
          { dish: "Hummus plate", note: "dairy-free" },
          { dish: "Baba ghanoush", note: "dairy-free" },
          { dish: "Tabbouleh", note: "dairy-free" },
        ], watchOut: "choose chicken shawarma, not beef (mammal); avoid feta and any yogurt/tzatziki dressing" },
        { name: "Oren's Hummus", area: "Palo Alto", rating: 4.3, reviews: 2743, ratingSrc: "Yelp", safeDishes: [
          { dish: "Hummus with pita (plain or with chicken)", note: "dairy-free" },
          { dish: "Falafel", note: "dairy-free" },
          { dish: "Chicken skewer (shishlik) over hummus/salad", note: "no dairy" },
          { dish: "Baba ganoush", note: "dairy-free" },
          { dish: "Israeli salad", note: "no feta, lemon-oil" },
        ], watchOut: "skip beef/lamb kebab & merguez (mammal); avoid labneh, feta and tzatziki — some spreads are garnished with dairy, so ask" },
        { name: "Hummus Mediterranean Kitchen", area: "Palo Alto", rating: null, reviews: 564, ratingSrc: "Yelp", safeDishes: [
          { dish: "Hummus with fresh pita", note: "dairy-free" },
          { dish: "Falafel", note: "dairy-free, no tzatziki" },
          { dish: "Chicken shawarma plate/wrap", note: "tahini/hummus, no dairy sauce" },
          { dish: "Baba ganoush", note: "dairy-free" },
          { dish: "Israeli salad", note: "no feta, lemon-oil" },
        ], watchOut: "gyro & kebab are beef/lamb (mammal) — pick chicken; skip feta, labneh and yogurt/tzatziki sauces" },
      ],
    },
    {
      category: "Thai",
      restaurants: [
        { name: "Amarin Thai Cuisine", area: "Mountain View", rating: 3.9, reviews: 64, ratingSrc: "Yelp", safeDishes: [
          { dish: "Panang Curry", note: "coconut-based (not dairy); chicken or tofu" },
          { dish: "Pad Thai", note: "chicken or tofu — decline pork belly" },
          { dish: "Spicy Basil Fried Rice", note: "chicken or tofu, no pork" },
          { dish: "Red Curry", note: "coconut; chicken/tofu/shrimp" },
        ], watchOut: "Pad Thai and stir-fries often come with pork belly — request chicken/tofu; curries are coconut, not cream, so dairy-safe" },
        { name: "Thaiphoon", area: "Palo Alto", rating: 3.5, reviews: 604, ratingSrc: "Yelp", safeDishes: [
          { dish: "Pad Thai", note: "chicken, tofu or shrimp — no pork/beef add-on" },
          { dish: "Pad See Ew", note: "chicken or tofu" },
          { dish: "Green or Red Curry", note: "coconut; chicken or tofu" },
          { dish: "Tom Yum (or coconut Tom Kha) soup", note: "chicken or shrimp" },
        ], watchOut: "most stir-fries/curries offer a pork or beef protein — always specify chicken/tofu/shrimp; no dairy in standard Thai dishes" },
      ],
    },
    {
      category: "Chinese",
      restaurants: [
        { name: "Taste Restaurant", area: "Palo Alto", rating: 4.7, reviews: 1000, ratingSrc: "Uber Eats", safeDishes: [
          { dish: "Kung Pao Chicken", note: "dairy-free" },
          { dish: "Szechuan Boiled Fish (shui zhu yu)", note: "fish in chili-oil broth, no dairy" },
          { dish: "Salt & Pepper Shrimp", note: "" },
          { dish: "Garlic Eggplant / sautéed greens", note: "ask for no ground pork" },
          { dish: "Mapo Tofu", note: "request NO pork (usually has ground pork)" },
        ], watchOut: "Szechuan menu leans on pork/beef; mapo tofu and dry-fried beans hide ground pork — confirm chicken/fish/shrimp/veg and no beef broth" },
        { name: "Chef Zhao Kitchen", area: "Palo Alto", rating: 4.2, reviews: 625, ratingSrc: "Google", safeDishes: [
          { dish: "Black Bean Sauce Fish Fillet", note: "fish, no dairy" },
          { dish: "House Special Tofu", note: "confirm no ground pork; tofu/veg only" },
          { dish: "Salt & Pepper Shrimp", note: "" },
          { dish: "Sautéed String Beans / Bok Choy", note: "ask for no pork bits" },
        ], watchOut: "Shanghainese menu is pork-heavy — soup dumplings, buns, pork belly and spare ribs are pork; pick fish, shrimp, tofu or clearly-chicken dishes" },
        { name: "Tai Pan", area: "Palo Alto", rating: 4.0, reviews: 717, ratingSrc: "Yelp", safeDishes: [
          { dish: "Har Gow (shrimp dumplings)", note: "shrimp only" },
          { dish: "Shrimp rice-noodle roll (cheung fun)", note: "shrimp, not char siu" },
          { dish: "Steamed chicken or veg dumplings", note: "confirm no pork" },
          { dish: "Chinese broccoli (gai lan) with oyster sauce", note: "dairy-free" },
        ], watchOut: "dim sum — siu mai, char siu bao, spare ribs and most dumplings are pork; order shrimp/chicken/veg items" },
        { name: "P.F. Chang's", area: "Palo Alto", rating: null, reviews: null, ratingSrc: null, safeDishes: [
          { dish: "Chang's Chicken Lettuce Wraps", note: "chicken version" },
          { dish: "Ginger Chicken with Broccoli", note: "dairy-free" },
          { dish: "Kung Pao Chicken or Shrimp", note: "no mammal" },
          { dish: "Buddha's Feast (steamed tofu & veg)", note: "vegan" },
          { dish: "Miso Glazed Salmon", note: "fish" },
        ], watchOut: "skip Mongolian beef, pork dumplings and char siu; the chain publishes an allergen guide — choose chicken/shrimp/tofu/fish" },
      ],
    },
    {
      category: "Japanese & sushi",
      restaurants: [
        { name: "Sushi Tomi", area: "Mountain View", rating: 4.3, reviews: 2620, ratingSrc: "Yelp", safeDishes: [
          { dish: "Sashimi / nigiri (salmon, tuna, yellowtail, shrimp, eel)", note: "dairy-free" },
          { dish: "Chirashi bowl", note: "assorted fish over rice" },
          { dish: "Agedashi tofu", note: "fish-dashi broth is safe" },
          { dish: "Chicken teriyaki", note: "chicken" },
          { dish: "Edamame / seaweed salad", note: "plant-based" },
        ], watchOut: "no mammal risk; avoid cream-cheese rolls (Philadelphia roll) for dairy — spicy mayo is egg-based and fine" },
        { name: "MJ Sushi", area: "Palo Alto", rating: 4.3, reviews: 346, ratingSrc: "Yelp", safeDishes: [
          { dish: "Nigiri / sashimi", note: "fish/shellfish" },
          { dish: "Chirashi bowl", note: "fish over rice" },
          { dish: "Shrimp / veggie / chicken rolls", note: "no mammal" },
          { dish: "Edamame / seaweed salad", note: "plant-based" },
        ], watchOut: "no mammal on sushi; avoid cream-cheese rolls (dairy); spicy tuna (mayo/egg) is fine" },
        { name: "Taro San Japanese Noodle Bar", area: "Palo Alto", rating: 4.2, reviews: 1133, ratingSrc: "Yelp", safeDishes: [
          { dish: "Tori Paitan Udon", note: "chicken-broth udon" },
          { dish: "Tori (roasted chicken) Udon", note: "chicken" },
          { dish: "Tempura Udon", note: "shrimp/veg tempura; dashi broth (fish) is safe" },
          { dish: "Chicken Karaage", note: "fried chicken" },
        ], watchOut: "avoid the beef (niku) udon and any pork; stick to the chicken-broth (tori paitan) bowls — dashi is fish-based, not mammal" },
        { name: "Fuki Sushi", area: "Palo Alto", rating: 3.8, reviews: 1031, ratingSrc: "Yelp", safeDishes: [
          { dish: "Nigiri / sashimi assortment", note: "fish/shellfish" },
          { dish: "Chicken teriyaki", note: "chicken" },
          { dish: "Shrimp & vegetable tempura", note: "no dairy" },
          { dish: "Agedashi tofu", note: "fish-dashi safe" },
        ], watchOut: "skip cream-cheese rolls (dairy) and any tonkatsu/pork katsu; soups use fish dashi (safe), not pork broth" },
      ],
    },
    {
      category: "Vietnamese",
      restaurants: [
        { name: "Pho Anh", area: "Mountain View", rating: 4.4, reviews: 79, ratingSrc: "Yelp", safeDishes: [
          { dish: "Pho Ga", note: "chicken broth only" },
          { dish: "Chicken rice plate", note: "chicken" },
          { dish: "Shrimp spring rolls", note: "shrimp" },
        ], watchOut: "the house pho broth is beef-based — order chicken pho ga; skip beef-rib/brisket pho and any pork" },
        { name: "Pho Ha Noi", area: "Palo Alto", rating: 4.0, reviews: 1193, ratingSrc: "Yelp", safeDishes: [
          { dish: "Pho Ga", note: "chicken broth ONLY — not the beef pho" },
          { dish: "Bun Ga (chicken vermicelli bowl)", note: "fish-sauce based" },
          { dish: "Goi Cuon (fresh spring rolls)", note: "order shrimp-only, not pork" },
          { dish: "Lemongrass chicken over rice", note: "chicken" },
        ], watchOut: "classic pho broth is BEEF — order pho ga only; many bun bowls and spring rolls include pork, so specify shrimp/chicken" },
        { name: "Pho Avenue", area: "Mountain View", rating: 4.0, reviews: 509, ratingSrc: "Yelp", safeDishes: [
          { dish: "Pho Ga", note: "chicken-broth pho only" },
          { dish: "Chicken vermicelli (bun ga nuong)", note: "chicken" },
          { dish: "Shrimp spring rolls", note: "shrimp, not pork" },
          { dish: "Lemongrass chicken rice plate", note: "chicken" },
        ], watchOut: "default pho broth is beef — choose pho ga; avoid pork in bun bowls and rolls" },
      ],
    },
    {
      category: "Korean",
      restaurants: [
        { name: "Kunjip Tofu", area: "Mountain View", rating: 4.5, reviews: 681, ratingSrc: "Yelp", safeDishes: [
          { dish: "Whole chicken hot pot (dak)", note: "chicken" },
          { dish: "Seafood soft tofu soup", note: "seafood; confirm broth is not beef/anchovy" },
          { dish: "Japchae", note: "glass noodles without beef" },
          { dish: "Gyeran jjim (steamed egg)", note: "egg, no dairy" },
        ], watchOut: "many soondubu/soup bases use beef or anchovy — ask; avoid wagyu/galbi/pork and any cheese-topped tofu (dairy)" },
        { name: "So Gong Dong Tofu House", area: "Palo Alto", rating: 4.0, reviews: 1978, ratingSrc: "Yelp", safeDishes: [
          { dish: "Seafood soft tofu soup (soondubu)", note: "ask for seafood/veg broth base, no beef" },
          { dish: "Vegetable soft tofu soup", note: "request veg base" },
          { dish: "Bibimbap", note: "with tofu, seafood or chicken — not beef; no cheese" },
          { dish: "Haemul pajeon (seafood pancake)", note: "egg/flour, no dairy" },
        ], watchOut: "soondubu broth is often anchovy or beef — ask for seafood/veg; AVOID the cheese soft tofu (dairy) and all bulgogi/galbi/pork; bibimbap defaults to beef" },
      ],
    },
    {
      category: "Filipino",
      restaurants: [
        { name: "Tapsilog Bistro", area: "Campbell", rating: 4.3, reviews: 1618, ratingSrc: "Yelp", safeDishes: [
          { dish: "Chicken Adobosilog", note: "CHICKEN adobo (not pork), soy/vinegar based" },
          { dish: "Chicken Tocino Silog", note: "chicken tocino, no dairy" },
          { dish: "Bangus (milkfish) Silog", note: "fish" },
          { dish: "Garlic fried rice + egg (sinangag)", note: "no dairy" },
        ], watchOut: "Filipino menus are very pork-heavy (longganisa, pork tocino, lechon, sisig, bacon) — specify CHICKEN adobo/tocino or fish; confirm lumpia is veg/shrimp" },
      ],
    },
    {
      category: "Indian & Nepalese",
      restaurants: [
        { name: "Darbar Indian Cuisine", area: "Palo Alto", rating: 4.7, reviews: 10000, ratingSrc: "DoorDash", safeDishes: [
          { dish: "Chana Masala (vegan)", note: "ask for no ghee" },
          { dish: "Aloo Gobi (order 'dry')", note: "no butter/ghee" },
          { dish: "Bhindi / okra masala (dry)", note: "no ghee" },
          { dish: "Chicken curry (tomato-based)", note: "confirm no cream; ask for no ghee/butter" },
        ], watchOut: "avoid butter chicken, korma, dal makhani, paneer (cream/butter), naan (dairy); dal is often finished with ghee; lamb/goat are mammal" },
        { name: "Broadway Masala", area: "Redwood City", rating: 4.7, reviews: 10000, ratingSrc: "DoorDash", safeDishes: [
          { dish: "Chana Masala", note: "ask for no butter/ghee" },
          { dish: "Aloo Gobi", note: "ask for no butter" },
          { dish: "Baingan Bharta", note: "ask for no cream" },
          { dish: "Coconut/tomato chicken curry (Chettinad)", note: "confirm no cream; no ghee" },
        ], watchOut: "butter chicken, korma, tikka masala, dal makhani, paneer, naan all contain dairy; tikka marinades use yogurt; lamb/goat are mammal" },
        { name: "Chaat Bhavan", area: "Mountain View", rating: 4.7, reviews: 459, ratingSrc: "Yelp", safeDishes: [
          { dish: "Masala Dosa (rice-lentil crepe + potato)", note: "naturally dairy-free; ask for no butter on the dosa" },
          { dish: "Idli / sambar", note: "dairy-free" },
          { dish: "Chole (chickpeas)", note: "ask for no ghee/butter" },
        ], watchOut: "pure vegetarian (no mammal), but dairy is everywhere: yogurt-topped chaats, butter pav bhaji, paneer, lassi, kheer — always ask for no curd/butter/paneer" },
        { name: "Namaste Indian Cuisine", area: "Palo Alto", rating: 4.6, reviews: 1000, ratingSrc: "DoorDash", safeDishes: [
          { dish: "Chana Masala", note: "ask for no ghee/butter" },
          { dish: "Aloo Gobi", note: "ask for no butter" },
          { dish: "Baingan Bharta", note: "ask for no cream/butter" },
          { dish: "Chicken Biryani", note: "ask for no ghee/butter; confirm no yogurt in marinade" },
        ], watchOut: "paneer, korma, malai kofta, raita, naan all contain dairy; tandoori/tikka chicken uses a yogurt marinade — ask for dairy-free" },
        { name: "Zareen's", area: "Palo Alto", rating: 4.5, reviews: 2992, ratingSrc: "Yelp", safeDishes: [
          { dish: "Madras Chicken Curry (coconut-milk based)", note: "menu lists it dairy-free; confirm no cream added" },
          { dish: "Chana / chickpea dishes", note: "ask for no butter/ghee" },
          { dish: "Aloo Tikki (potato cutlets)", note: "listed vegan/dairy-free" },
        ], watchOut: "skip tikka masala/butter chicken (cream), any tikka (yogurt marinade), naan & paratha (ghee); avoid lamb/goat/beef (mammal)" },
        { name: "Ettan", area: "Palo Alto", rating: 4.3, reviews: 1994, ratingSrc: "OpenTable", safeDishes: [
          { dish: "Dal / lentils", note: "ask for no butter/cream/ghee finish" },
          { dish: "Tandoori chicken", note: "ask for a no-yogurt marinade / confirm dairy-free" },
          { dish: "Steamed basmati rice", note: "ask for no ghee" },
        ], watchOut: "upscale modern Indian — many plates use cream, ghee, paneer or yogurt marinades; tell the kitchen dairy allergy + no mammal; avoid lamb/goat" },
        { name: "Delhi to Kathmandu", area: "Sunnyvale", rating: 4.3, reviews: 198, ratingSrc: "Yelp", safeDishes: [
          { dish: "Chicken momos (steamed dumplings)", note: "confirm dairy-free; avoid the cheese-momo version" },
          { dish: "Veg momos (steamed)", note: "confirm no cheese filling" },
          { dish: "Chicken thukpa / chowmein", note: "chicken broth (not mutton); dairy-free" },
          { dish: "Chana / chole", note: "ask for no ghee/butter" },
        ], watchOut: "creamy curries (tikka/korma/butter), paneer, naan are dairy; some Nepali soups/curries use mutton (mammal) — pick chicken/veg; tandoori uses yogurt" },
        { name: "Everest Cuisine", area: "Mountain View", rating: 4.1, reviews: 659, ratingSrc: "Yelp", safeDishes: [
          { dish: "Chicken or veg momos (steamed)", note: "dairy-free; avoid cheese-momo option" },
          { dish: "Chicken thukpa / chowmein", note: "chicken broth; confirm dairy-free" },
          { dish: "Chana masala", note: "ask for no ghee/butter" },
        ], watchOut: "korma/butter/creamy curries, paneer, naan are dairy; goat/lamb (mutton) curries are mammal — choose chicken/veg; tandoori marinade has yogurt" },
        { name: "Amber India", area: "Los Altos", rating: 4.1, reviews: null, ratingSrc: "Tripadvisor", safeDishes: [
          { dish: "Chana Masala", note: "ask for no butter/ghee" },
          { dish: "Baingan Bharta", note: "ask for no cream" },
          { dish: "Aloo dish (gobi / jeera)", note: "ask for no ghee/butter" },
          { dish: "Tomato/coconut chicken curry", note: "confirm no cream" },
        ], watchOut: "the specialty is butter chicken (cream); korma, paneer, dal makhani, naan are dairy; yogurt tikka marinades; lamb/goat are mammal" },
        { name: "Curry Up Now", area: "Palo Alto", rating: null, reviews: null, ratingSrc: null, safeDishes: [
          { dish: "'Hella Vegan' bowl or burrito", note: "fully plant-based; add chicken or tofu" },
          { dish: "Chana masala bowl", note: "ask for no cream/yogurt/sour cream" },
          { dish: "Deconstructed samosa", note: "ask for NO sour cream/yogurt on top" },
        ], watchOut: "Naughty Naan and Sexy Fries have cheese; tikka masala has cream; chaat/samosa are topped with sour cream & yogurt; avoid lamb/goat" },
      ],
    },
    {
      category: "Pizza & Italian",
      restaurants: [
        { name: "Il Fornaio", area: "Mountain View", rating: 4.2, reviews: 380, ratingSrc: "Yelp", safeDishes: [
          { dish: "Pasta al pomodoro", note: "marinara, no cheese/butter" },
          { dish: "Marinara or vegetable pizza", note: "no cheese" },
          { dish: "Grilled chicken (pollo)", note: "olive oil & herbs, no butter/cream/parmesan" },
          { dish: "Mixed salad", note: "vinaigrette, no cheese" },
        ], watchOut: "avoid cream/butter/parmesan sauces and cured pork (prosciutto, pancetta, salsiccia); confirm no butter on grilled items" },
        { name: "Terún", area: "Palo Alto", rating: 4.1, reviews: 2254, ratingSrc: "Yelp", safeDishes: [
          { dish: "Pizza Marinara", note: "tomato, garlic, oregano, olive oil — no cheese" },
          { dish: "Pasta al pomodoro", note: "marinara, no cheese, ask for no parmigiano" },
          { dish: "Mixed green salad", note: "vinaigrette, no cheese" },
        ], watchOut: "nearly every pizza has mozzarella — only the Marinara is cheeseless; avoid cream/alfredo pastas and pork toppings (guanciale, prosciutto, sausage, nduja)" },
        { name: "Pizzeria Delfina", area: "Palo Alto", rating: 3.7, reviews: 684, ratingSrc: "Yelp", safeDishes: [
          { dish: "Pizza Marinara", note: "tomato, garlic, oregano, olive oil — no cheese" },
          { dish: "Tomato-sauce pasta", note: "no cheese; ask for no butter" },
          { dish: "Simple green/tomato salad", note: "vinaigrette, no cheese" },
        ], watchOut: "Marinara is the only cheeseless pizza; skip mozzarella/burrata pies and salumi (pepperoni, pancetta, prosciutto — mammal)" },
      ],
    },
    {
      category: "American",
      restaurants: [
        { name: "True Food Kitchen", area: "Palo Alto", rating: 4.3, reviews: 2403, ratingSrc: "Yelp", safeDishes: [
          { dish: "Grilled chicken over greens", note: "no cheese, vinaigrette" },
          { dish: "Ancient Grains bowl", note: "ask for no cheese; miso-veg base" },
          { dish: "Butternut squash / veg street tacos", note: "corn tortilla, no crema/cheese" },
          { dish: "Edamame", note: "dairy-free" },
        ], watchOut: "skip burgers / any beef (mammal); several bowls and pizzas come with cheese or dairy dressing — request without and confirm no butter" },
        { name: "Starbird Chicken", area: "Palo Alto", rating: 4.0, reviews: 117, ratingSrc: "Yelp", safeDishes: [
          { dish: "Grilled chicken sandwich", note: "no cheese, no ranch/creamy sauce" },
          { dish: "Chicken chop salad", note: "no cheese, vinaigrette" },
          { dish: "Chicken tenders", note: "ask for a non-dairy dip" },
          { dish: "Tater tots", note: "veg-oil fried" },
        ], watchOut: "ranch/buttermilk and 'creamy' sauces are dairy — choose vinaigrette or a non-dairy dip; no mammal on the menu but confirm the sandwich has no cheese" },
        { name: "Sweetgreen", area: "Palo Alto", rating: 3.6, reviews: 442, ratingSrc: "Yelp", safeDishes: [
          { dish: "Grilled chicken salad", note: "no cheese, vinaigrette" },
          { dish: "Guacamole Greens", note: "no cheese" },
          { dish: "Harvest bowl", note: "no goat cheese, add chicken" },
          { dish: "Custom warm grain bowl", note: "no cheese, no creamy dressing" },
        ], watchOut: "default bowls carry feta/goat/parmesan and caesar/ranch (dairy) — build custom without; skip any bacon add-on" },
      ],
    },
    {
      category: "Seafood & poke",
      restaurants: [
        { name: "Poké Bar", area: "Mountain View", rating: 4.4, reviews: 464, ratingSrc: "Yelp", safeDishes: [
          { dish: "Ahi tuna bowl", note: "dairy-free & mammal-free" },
          { dish: "Salmon bowl", note: "dairy-free" },
          { dish: "Tofu bowl", note: "vegan, dairy-free" },
        ], watchOut: "dairy-free & mammal-free across the menu; spicy mayo is egg-based; skip any Spam topping" },
        { name: "Go Fish Poke Bar", area: "Palo Alto", rating: 4.3, reviews: 464, ratingSrc: "Google", safeDishes: [
          { dish: "Ahi tuna poke bowl", note: "shoyu/ponzu, no creamy mayo" },
          { dish: "Salmon poke bowl", note: "rice + seaweed salad, no creamy sauce" },
          { dish: "Build-your-own with edamame & veg", note: "dairy-free bases" },
        ], watchOut: "no mammal meat; the only trap is creamy/spicy-mayo sauces — stick to shoyu, ponzu or plain" },
        { name: "Poke House", area: "Palo Alto", rating: 4.1, reviews: 253, ratingSrc: "Yelp", safeDishes: [
          { dish: "Tuna poke bowl", note: "shoyu base, no spicy mayo" },
          { dish: "Salmon poke bowl", note: "no creamy sauce" },
          { dish: "Shrimp or veggie bowl", note: "dairy-free" },
        ], watchOut: "all-seafood menu, no mammal; avoid creamy/spicy-mayo sauces — choose shoyu/ponzu" },
        { name: "Pokeworks", area: "Mountain View", rating: null, reviews: null, ratingSrc: null, safeDishes: [
          { dish: "Build-your-own tuna bowl", note: "shoyu/ponzu; dairy-free" },
          { dish: "Salmon bowl", note: "dairy-free" },
          { dish: "Tofu bowl", note: "vegan, dairy-free" },
        ], watchOut: "sauces are largely dairy-free and spicy mayo is egg-based; no mammal proteins" },
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
  // Cafés / breakfast / bagels / bowls
  "The Farm|Palo Alto": { mon:[["07:30","18:00"]], tue:[["07:30","18:00"]], wed:[["07:30","20:00"]], thu:[["07:30","20:00"]], fri:[["07:30","20:00"]], sat:[["08:00","20:00"]], sun:[["08:00","20:00"]] },
  "Verve Coffee Roasters|Palo Alto": { mon:[["07:00","18:00"]], tue:[["07:00","18:00"]], wed:[["07:00","18:00"]], thu:[["07:00","18:00"]], fri:[["07:00","18:00"]], sat:[["07:00","18:00"]], sun:[["07:00","18:00"]] },
  "Coupa Cafe|Palo Alto": { mon:[["07:00","20:00"]], tue:[["07:00","20:00"]], wed:[["07:00","20:00"]], thu:[["07:00","20:00"]], fri:[["07:00","20:00"]], sat:[["07:00","20:00"]], sun:[["07:00","20:00"]] },
  "Coupa Café|Palo Alto": { mon:[["07:00","20:00"]], tue:[["07:00","20:00"]], wed:[["07:00","20:00"]], thu:[["07:00","20:00"]], fri:[["07:00","20:00"]], sat:[["07:00","20:00"]], sun:[["07:00","20:00"]] },
  "Douce France|Palo Alto": { mon:[["07:00","19:00"]], tue:[["07:00","19:00"]], wed:[["07:00","19:00"]], thu:[["07:00","19:00"]], fri:[["07:00","19:00"]], sat:[["07:00","19:00"]], sun:[["08:00","16:00"]] },
  "Joanie's Café|Palo Alto": { mon:[["08:00","14:00"]], tue:[["08:00","14:00"]], wed:[["08:00","14:00"]], thu:[["08:00","14:00"]], fri:[["08:00","14:00"]], sat:[["08:00","14:00"]], sun:[["08:00","14:00"]] },
  "Stacks|Menlo Park": { mon:[["07:00","14:00"]], tue:[["07:00","14:00"]], wed:[["07:00","14:00"]], thu:[["07:00","14:00"]], fri:[["07:00","14:30"]], sat:[["07:00","14:30"]], sun:[["07:00","14:30"]] },
  "Palo Alto Creamery|Palo Alto": { mon:[["08:00","21:00"]], tue:[["08:00","21:00"]], wed:[["08:00","21:00"]], thu:[["08:00","21:00"]], fri:[["08:00","22:00"]], sat:[["08:00","22:00"]], sun:[["08:00","21:00"]] },
  "Hatched|Palo Alto": { mon:[["07:00","16:00"]], tue:[["07:00","16:00"]], wed:[["07:00","16:00"]], thu:[["07:00","16:00"]], fri:[["07:00","16:30"]], sat:[["07:00","16:30"]], sun:[["07:00","16:30"]] },
  "Izzy's Brooklyn Bagels|Palo Alto": { mon:[["07:00","15:00"]], tue:[["07:00","15:00"]], wed:[["07:00","15:00"]], thu:[["07:00","15:00"]], fri:[["07:00","15:00"]], sat:[["07:00","15:00"]], sun:[["07:00","15:00"]] },
  "House of Bagels|Mountain View": { mon:[["06:30","15:30"]], tue:[["06:30","15:30"]], wed:[["06:30","15:30"]], thu:[["06:30","15:30"]], fri:[["06:30","15:30"]], sat:[["06:30","15:30"]], sun:[["06:30","15:30"]] },
  "Bagel Street Cafe|Mountain View": { mon:[["06:30","16:00"]], tue:[["06:30","16:00"]], wed:[["06:30","16:00"]], thu:[["06:30","16:00"]], fri:[["06:30","16:00"]], sat:[["06:30","16:00"]], sun:[["07:00","15:00"]] },
  "Boichik Bagels|Palo Alto": { mon:[["07:00","16:30"]], tue:[["07:00","16:30"]], wed:[["07:00","16:30"]], thu:[["07:00","16:30"]], fri:[["07:00","16:30"]], sat:[["07:00","16:30"]], sun:[["07:00","16:30"]] },
  "Palmetto Superfoods|Palo Alto": { mon:[["08:00","20:00"]], tue:[["08:00","20:00"]], wed:[["08:00","20:00"]], thu:[["08:00","20:00"]], fri:[["08:00","20:00"]], sat:[["08:00","20:00"]], sun:[["08:00","20:00"]] },
  "Pressed|Palo Alto": { mon:[["07:00","22:00"]], tue:[["07:00","22:00"]], wed:[["07:00","22:00"]], thu:[["07:00","22:00"]], fri:[["07:00","22:00"]], sat:[["07:00","22:00"]], sun:[["07:00","22:00"]] },
  "Vitality Bowls|Palo Alto": { mon:[["07:30","19:00"]], tue:[["07:30","19:00"]], wed:[["07:30","19:00"]], thu:[["07:30","19:00"]], fri:[["07:30","19:00"]], sat:[["09:00","18:00"]], sun:[["09:00","18:00"]] },
  "Bare Bowls|Palo Alto": { mon:[["08:00","16:00"]], tue:[["08:00","16:00"]], wed:[["08:00","16:00"]], thu:[["08:00","16:00"]], fri:[["08:00","16:00"]], sat:[["08:00","16:00"]], sun:[["08:00","16:00"]] },
  "Jamba|Palo Alto": { mon:[["07:00","19:30"]], tue:[["07:00","19:30"]], wed:[["07:00","19:30"]], thu:[["07:00","19:30"]], fri:[["07:00","19:30"]], sat:[["07:30","19:30"]], sun:[["08:00","19:00"]] },

  // Light lunch / salads / poke / mexican
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

  // Asian dinner
  "Amarin Thai Cuisine|Mountain View": { mon:[["11:30","14:30"],["17:00","21:00"]], tue:[["11:30","14:30"],["17:00","21:00"]], wed:[["11:30","14:30"],["17:00","21:00"]], thu:[["11:30","14:30"],["17:00","21:00"]], fri:[["11:30","14:30"],["17:00","21:30"]], sat:[["12:00","15:00"],["17:00","21:30"]], sun:[["12:00","15:00"],["17:00","21:00"]] },
  "Thaiphoon|Palo Alto": { mon:[["11:00","14:30"],["16:00","21:00"]], tue:[["11:00","14:30"],["16:00","21:00"]], wed:[["11:00","14:30"],["16:00","21:30"]], thu:[["11:00","14:30"],["16:00","21:30"]], fri:[["11:00","14:30"],["16:00","22:00"]], sat:[["16:00","22:00"]], sun:[["16:00","21:30"]] },
  "Taste Restaurant|Palo Alto": { mon:[["11:00","15:00"],["17:00","21:30"]], tue:[["11:00","15:00"],["17:00","21:30"]], wed:[["11:00","15:00"],["17:00","21:30"]], thu:[["11:00","15:00"],["17:00","21:30"]], fri:[["11:00","15:00"],["17:00","21:30"]], sat:[["11:00","15:00"],["17:00","21:30"]], sun:[["11:00","15:00"],["17:00","21:30"]] },
  "Chef Zhao Kitchen|Palo Alto": { mon:[], tue:[["11:00","14:30"],["17:00","21:00"]], wed:[["11:00","14:30"],["17:00","21:00"]], thu:[["11:00","14:30"],["17:00","21:00"]], fri:[["11:00","14:30"],["17:00","21:00"]], sat:[["11:00","14:30"],["17:00","21:00"]], sun:[["11:00","14:30"],["17:00","21:00"]] },
  "Tai Pan|Palo Alto": { mon:[["11:00","14:30"],["17:00","20:30"]], tue:[["11:00","14:30"],["17:00","20:30"]], wed:[["11:00","14:30"],["17:00","20:30"]], thu:[["11:00","14:30"],["17:00","20:30"]], fri:[["11:00","14:30"],["17:00","20:30"]], sat:[["11:00","14:30"],["17:00","20:30"]], sun:[["11:00","14:30"],["17:00","20:30"]] },
  "P.F. Chang's|Palo Alto": { mon:[["11:00","21:00"]], tue:[["11:00","21:00"]], wed:[["11:00","21:00"]], thu:[["11:00","21:00"]], fri:[["11:00","22:00"]], sat:[["11:00","22:00"]], sun:[["11:00","21:00"]] },
  "Sushi Tomi|Mountain View": { mon:[["11:30","13:30"],["17:00","20:00"]], tue:[], wed:[["11:30","13:30"],["17:00","20:00"]], thu:[["11:30","13:30"],["17:00","20:00"]], fri:[["11:30","13:30"],["17:00","20:30"]], sat:[["11:30","13:30"],["17:00","20:30"]], sun:[["11:30","13:30"],["17:00","20:00"]] },
  "MJ Sushi|Palo Alto": { mon:[["11:30","22:30"]], tue:[["11:30","22:30"]], wed:[["11:30","22:30"]], thu:[["11:30","22:30"]], fri:[["11:30","24:00"]], sat:[["11:30","24:00"]], sun:[["11:30","22:30"]] },
  "Taro San Japanese Noodle Bar|Palo Alto": { mon:[["11:00","21:00"]], tue:[["11:00","21:00"]], wed:[["11:00","21:00"]], thu:[["11:00","21:00"]], fri:[["11:00","22:00"]], sat:[["11:00","22:00"]], sun:[["11:00","21:00"]] },
  "Fuki Sushi|Palo Alto": { mon:[["11:30","13:30"],["17:15","20:30"]], tue:[["11:30","13:30"],["17:15","20:30"]], wed:[["11:30","13:30"],["17:15","20:30"]], thu:[["11:30","13:30"],["17:15","20:30"]], fri:[["11:30","13:30"],["17:15","21:00"]], sat:[["17:15","21:00"]], sun:[] },
  "Pho Anh|Mountain View": { mon:[["10:00","20:30"]], tue:[["10:00","20:30"]], wed:[["10:00","20:30"]], thu:[["10:00","20:30"]], fri:[["10:00","22:00"]], sat:[["10:00","22:00"]], sun:[["10:00","22:00"]] },
  "Pho Ha Noi|Palo Alto": { mon:[["11:30","14:00"],["17:00","21:00"]], tue:[["11:30","14:00"],["17:00","21:00"]], wed:[["11:30","14:00"],["17:00","21:00"]], thu:[["11:30","14:00"],["17:00","21:00"]], fri:[["11:30","14:00"],["17:00","22:00"]], sat:[["11:00","15:00"],["17:00","22:00"]], sun:[["11:00","15:00"],["17:00","21:00"]] },
  "Pho Avenue|Mountain View": { mon:[["11:00","21:00"]], tue:[["11:00","21:00"]], wed:[["11:00","21:00"]], thu:[["11:00","21:00"]], fri:[["11:00","21:00"]], sat:[["11:00","21:00"]], sun:[["11:00","21:00"]] },
  "Kunjip Tofu|Mountain View": { mon:[["11:00","14:00"],["16:30","21:00"]], tue:[["11:00","14:00"],["16:30","21:00"]], wed:[["11:00","14:00"],["16:30","21:00"]], thu:[["11:00","14:00"],["16:30","21:00"]], fri:[["11:00","14:30"],["16:30","22:00"]], sat:[["11:00","22:00"]], sun:[["11:00","21:00"]] },
  "So Gong Dong Tofu House|Palo Alto": { mon:[["11:30","14:00"],["16:30","20:30"]], tue:[["11:30","14:00"],["16:30","20:30"]], wed:[["11:30","14:00"],["16:30","20:30"]], thu:[["11:30","14:00"],["16:30","20:30"]], fri:[["11:30","14:00"],["16:30","20:30"]], sat:[["11:30","14:30"],["16:30","20:30"]], sun:[["11:30","14:30"],["16:30","20:30"]] },
  "Tapsilog Bistro|Campbell": { mon:[], tue:[["09:00","14:30"],["16:30","20:30"]], wed:[["09:00","14:30"],["16:30","20:30"]], thu:[["09:00","14:30"],["16:30","20:30"]], fri:[["09:00","14:30"],["16:30","21:00"]], sat:[["09:00","21:00"]], sun:[["09:00","16:30"]] },

  // Mediterranean / Indian / pizza / american / seafood
  "Nick the Greek|Palo Alto": { mon:[["11:00","22:00"]], tue:[["11:00","22:00"]], wed:[["11:00","22:00"]], thu:[["11:00","22:00"]], fri:[["11:00","24:00"]], sat:[["11:00","24:00"]], sun:[["11:00","22:00"]] },
  "Mediterranean Wraps|Palo Alto": { mon:[["11:00","20:30"]], tue:[["11:00","20:30"]], wed:[["11:00","20:00"]], thu:[["11:00","20:00"]], fri:[["11:00","20:30"]], sat:[["11:00","20:30"]], sun:[["11:00","20:30"]] },
  "Hummus Mediterranean Kitchen|Palo Alto": { mon:[["10:30","21:00"]], tue:[["10:30","21:00"]], wed:[["10:30","21:00"]], thu:[["10:30","21:00"]], fri:[["10:30","21:30"]], sat:[["09:30","21:30"]], sun:[["09:30","21:00"]] },
  "Darbar Indian Cuisine|Palo Alto": { mon:[["11:00","14:30"],["17:00","21:30"]], tue:[["11:00","14:30"],["17:00","21:30"]], wed:[["11:00","14:30"],["17:00","21:30"]], thu:[["11:00","14:30"],["17:00","22:00"]], fri:[["11:00","14:30"],["17:00","22:00"]], sat:[["11:30","14:30"],["17:00","22:00"]], sun:[["17:00","21:30"]] },
  "Broadway Masala|Redwood City": { mon:[["11:30","14:30"],["17:00","21:30"]], tue:[["11:30","14:30"],["17:00","21:30"]], wed:[["11:30","14:30"],["17:00","21:30"]], thu:[["11:30","14:30"],["17:00","21:30"]], fri:[["11:30","14:30"],["17:00","22:00"]], sat:[["11:30","15:00"],["17:00","22:00"]], sun:[["11:30","15:00"],["17:00","21:30"]] },
  "Chaat Bhavan|Mountain View": { mon:[["11:00","22:00"]], tue:[["11:00","22:00"]], wed:[["11:00","22:00"]], thu:[["11:00","22:00"]], fri:[["11:00","22:00"]], sat:[["11:00","22:00"]], sun:[["11:00","22:00"]] },
  "Namaste Indian Cuisine|Palo Alto": { mon:[["11:30","14:30"],["17:00","21:00"]], tue:[["11:30","14:30"],["17:00","21:00"]], wed:[["11:30","14:30"],["17:00","21:00"]], thu:[["11:30","14:30"],["17:00","21:00"]], fri:[["11:30","14:30"],["17:00","21:30"]], sat:[["11:30","14:30"],["17:00","21:30"]], sun:[["11:30","14:30"],["17:00","21:00"]] },
  "Ettan|Palo Alto": { mon:[["11:30","14:00"],["17:00","21:00"]], tue:[["11:30","14:00"],["17:00","21:00"]], wed:[["11:30","14:00"],["17:00","21:00"]], thu:[["11:30","14:00"],["17:00","21:00"]], fri:[["11:30","14:00"],["17:00","22:00"]], sat:[["11:00","14:00"],["17:00","22:00"]], sun:[["11:00","14:00"],["17:00","21:00"]] },
  "Delhi to Kathmandu|Sunnyvale": { mon:[["11:00","24:00"]], tue:[["11:00","24:00"]], wed:[["11:00","24:00"]], thu:[["11:00","24:00"]], fri:[["11:00","24:00"]], sat:[["11:00","24:00"]], sun:[["11:00","24:00"]] },
  "Everest Cuisine|Mountain View": { mon:[["11:00","23:00"]], tue:[], wed:[["11:00","23:00"]], thu:[["11:00","23:00"]], fri:[["11:00","23:00"]], sat:[["11:00","23:00"]], sun:[["11:00","23:00"]] },
  "Amber India|Los Altos": { mon:[["11:30","14:30"],["17:00","21:30"]], tue:[["11:30","14:30"],["17:00","21:30"]], wed:[["11:30","14:30"],["17:00","21:30"]], thu:[["11:30","14:30"],["17:00","21:30"]], fri:[["11:30","14:30"],["17:00","21:30"]], sat:[["11:30","14:30"],["17:00","21:30"]], sun:[["11:30","14:30"],["17:00","21:30"]] },
  "Curry Up Now|Palo Alto": { mon:[["11:30","20:30"]], tue:[["11:30","20:30"]], wed:[["11:30","20:30"]], thu:[["11:30","20:30"]], fri:[["11:30","21:00"]], sat:[["11:30","20:00"]], sun:[["11:30","20:00"]] },
  "Il Fornaio|Mountain View": { mon:[["11:30","21:30"]], tue:[["11:30","21:30"]], wed:[["11:30","21:30"]], thu:[["11:30","21:30"]], fri:[["11:30","21:30"]], sat:[["11:30","21:30"]], sun:[["11:30","21:30"]] },
  "Terún|Palo Alto": { mon:[["11:30","14:00"],["17:00","21:00"]], tue:[["11:30","14:00"],["17:00","21:00"]], wed:[["11:30","14:00"],["17:00","21:00"]], thu:[["11:30","14:00"],["17:00","21:00"]], fri:[["11:30","14:00"],["17:00","21:30"]], sat:[["11:30","14:00"],["17:00","21:30"]], sun:[["11:30","14:00"],["17:00","21:00"]] },
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
      Breakfast: ["American breakfast", "Cafés & bakeries"],
      Lunch: ["Mediterranean", "Cafés & light bites", "Sandwiches & wraps"],
      Dinner: ["Thai", "Indian & Nepalese", "Vietnamese", "Chinese", "Korean"],
    },
  },
  spring: {
    emoji: "🌸", label: "Spring in Palo Alto",
    weather: "mild and blossoming",
    lean: "bright, fresh plates — Mediterranean mezze, garden bowls, and herby, colorful food",
    favored: {
      Breakfast: ["Cafés & bakeries", "Açaí & smoothie bowls"],
      Lunch: ["Salads & bowls", "Mediterranean", "Poke"],
      Dinner: ["Mediterranean & Middle Eastern", "Thai", "Japanese & sushi", "American", "Seafood & poke"],
    },
  },
  summer: {
    emoji: "☀️", label: "Summer at Stanford",
    weather: "warm, dry and sunny",
    lean: "cool and light things — chilled poke, crisp salads, and açaí bowls",
    favored: {
      Breakfast: ["Açaí & smoothie bowls", "Cafés & bakeries"],
      Lunch: ["Poke", "Salads & bowls", "Mediterranean", "Smoothies & açaí bowls"],
      Dinner: ["Seafood & poke", "Mediterranean & Middle Eastern", "Japanese & sushi", "Mexican", "Vietnamese"],
    },
  },
  fall: {
    emoji: "🍂", label: "Fall in the Bay",
    weather: "golden and mild",
    lean: "cozy-but-fresh food — warm spices, roasted veggies, and satisfying bowls",
    favored: {
      Breakfast: ["American breakfast", "Bagels", "Cafés & bakeries"],
      Lunch: ["Sandwiches & wraps", "Salads & bowls", "Mediterranean"],
      Dinner: ["Indian & Nepalese", "American", "Pizza & Italian", "Chinese", "Mediterranean & Middle Eastern"],
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
  note: "General targets for an ~18-year-old who studies a lot — not medical advice. Because Nour avoids dairy and red meat, iron, calcium, B12 & vitamin D matter most; a doctor or dietitian can confirm whether a supplement makes sense.",
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
    { k: "Carbs", v: "~250–290 g", why: "steady brain glucose — whole grains, rice, oats, fruit" },
    { k: "Healthy fat", v: "~55–75 g", why: "include omega-3 fish for memory & focus" },
    { k: "Fiber", v: "~25–28 g", why: "veggies, beans, whole grains" },
    { k: "Iron", v: "18 mg", why: "KEY (no red meat) — poultry, fish, tofu, beans, spinach + vitamin C to absorb" },
    { k: "Calcium", v: "1,300 mg", why: "KEY (dairy-free) — fortified plant milk, tofu, tahini, greens, canned fish w/ bones" },
    { k: "Omega-3 · B12 · Vit D", v: "from fish & eggs", why: "brain, energy & bone health without dairy" },
    { k: "Water", v: "~8–10 cups", why: "focus dips fast when even a little dehydrated" },
  ],
};

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
  "Nour is also allergic to dairy — milk, cheese, butter, ghee, cream and yogurt are all off-limits, in addition to mammal meat.",
  "Cross-contamination (shared grills/fryers with mammal fat) can trigger reactions — ask restaurants.",
  "Always carry your epinephrine auto-injector and antihistamines. When in doubt, don't eat it.",
];

if (typeof module !== "undefined") {
  module.exports = { RULES, ORDER_MENU, HOURS, SEASONS, NUTRITION, GROCERY, FACTS };
}
