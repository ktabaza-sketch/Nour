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
        { name: "Bluestone Lane", area: "Los Altos", rating: 4.1, reviews: 940, ratingSrc: "Google", platforms: ["Uber Eats","DoorDash"], safeDishes: [ { dish: "Avocado smash on sourdough", note: "no feta, no butter" }, { dish: "Coconut chia pudding", note: "coconut, not dairy; no yogurt topping" }, { dish: "Iced coffee or latte with oat milk", note: "oat/almond milk available" } ], watchOut: "toasts default to butter and many plates come with feta/ricotta — say dairy-free every time" },
        { name: "Crepevine", area: "Palo Alto", rating: 4.3, reviews: 1500, ratingSrc: "Google", platforms: ["Uber Eats","DoorDash","Grubhub"], safeDishes: [ { dish: "Tofu scramble with potatoes", note: "no cheese; potatoes in oil not butter" }, { dish: "Grilled tofu with peanut sauce & veggies", note: "dairy-free, mammal-free" }, { dish: "Fresh fruit bowl", note: "skip any yogurt side" } ], watchOut: "crepes, pancakes & French toast are dairy/egg batter; scrambles come with cheese and bacon/sausage are mammal" },
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
        { name: "La Costeña", area: "Mountain View", rating: 4.4, reviews: 2500, ratingSrc: "Google", platforms: ["Uber Eats","DoorDash"], safeDishes: [ { dish: "Grilled chicken burrito", note: "no cheese, no sour cream; whole black beans (no lard) or rice" }, { dish: "Veggie burrito", note: "no cheese, no crema; add guacamole" }, { dish: "Chicken tacos on corn tortillas", note: "no cheese, salsa" } ], watchOut: "refried beans are cooked with lard; carnitas/asada/al pastor/chorizo are mammal; cheese & crema are default" },
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
        { name: "Tender Greens", area: "Palo Alto", rating: 4.7, reviews: 6000, ratingSrc: "Uber Eats", platforms: ["Uber Eats","DoorDash"], safeDishes: [ { dish: "Chopped salad with grilled chicken", note: "no cheese; oil & vinegar (skip ranch/blue-cheese)" }, { dish: "Grilled salmon or albacore plate", note: "with a green salad, skip the mashed potatoes" }, { dish: "Farro / grain bowl", note: "no cheese, vinaigrette on the side" } ], watchOut: "many dressings are buttermilk/blue-cheese and the mashed potatoes are butter+cream — ask for oil & vinegar, no cheese" },
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
        { name: "Le Boulanger", area: "Los Altos", rating: 4.2, reviews: 500, ratingSrc: "Google", platforms: ["Uber Eats","DoorDash"], safeDishes: [ { dish: "Roasted turkey sandwich on baguette", note: "no cheese; mustard, lettuce, tomato" }, { dish: "Roasted chicken sandwich", note: "no cheese, no dairy aioli" }, { dish: "Chinese chicken or garden salad", note: "dressing on the side, no cheese" } ], watchOut: "pastries are butter-heavy, most sandwiches default to brie/provolone/Swiss, and the chowder & broccoli-cheddar soups are dairy — skip ham/salami" },
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
        { name: "Falafel Stop", area: "Sunnyvale", rating: 4.5, reviews: 1900, ratingSrc: "Google", platforms: ["Uber Eats","DoorDash","Grubhub"], safeDishes: [ { dish: "Falafel pita with hummus, tahini & Israeli salad", note: "fully vegan" }, { dish: "Sabich pita (fried eggplant + egg)", note: "dairy-free, mammal-free" }, { dish: "Hummus bowl with pita", note: "add extra falafel" } ], watchOut: "all-vegetarian so no mammal risk; only trap is skipping any added feta (delivers to the Stanford area)" },
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
    {
      category: "Burmese",
      restaurants: [
        { name: "Burma Ruby", area: "Palo Alto", rating: 4.7, reviews: 1200, ratingSrc: "Uber Eats", platforms: ["Uber Eats","DoorDash"], safeDishes: [ { dish: "Tea leaf salad", note: "has dried shrimp; dairy-free" }, { dish: "Ginger salad", note: "pickled ginger, beans, peanuts; dairy-free" }, { dish: "Coconut chicken noodle soup", note: "coconut broth, not dairy" } ], watchOut: "coconut is fine (not dairy); avoid pork/beef curries and milk tea — stick to chicken, seafood, tofu, salads" },
      ],
    },
    {
      category: "Sushi",
      restaurants: [
        { name: "Kanpai Sushi", area: "Palo Alto", rating: 4.3, reviews: 700, ratingSrc: "Google", platforms: ["Uber Eats","DoorDash"], safeDishes: [ { dish: "Salmon & tuna nigiri or sashimi", note: "dairy-free & mammal-free" }, { dish: "Spicy tuna roll", note: "no cream cheese; spicy mayo is egg" }, { dish: "Edamame & seaweed salad", note: "dairy-free starters" } ], watchOut: "skip cream-cheese (Philadelphia) rolls; no beef/pork tataki" },
      ],
    },
  ],

  dinner: [
    {
      category: "Mexican",
      restaurants: [
        { name: "Tacos El Grullense", area: "Redwood City", rating: 4.5, reviews: null, ratingSrc: "Uber Eats", platforms: ["Uber Eats","DoorDash","Grubhub"], safeDishes: [ { dish: "Grilled fish (pescado) taco", note: "corn tortilla, no crema/cheese" }, { dish: "Shrimp (camarón) taco", note: "no cheese/crema; salsa fresca" }, { dish: "Grilled chicken (pollo asado) taco", note: "no queso, no crema" } ], watchOut: "beans/rice may be cooked with lard; skip crema, cheese and all mammal meats (asada/al pastor/carnitas)" },
        { name: "LuLu's", area: "Palo Alto", rating: 3.7, reviews: 339, ratingSrc: "Restaurant Guru", platforms: ["Uber Eats"], safeDishes: [ { dish: "Grilled fish taco", note: "no cheese; hold the chipotle crema (dairy)" }, { dish: "Grilled shrimp taco", note: "no cheese; salsa fresca + avocado" }, { dish: "Grilled chicken street taco", note: "no cheese/crema" } ], watchOut: "house chipotle sauce is dairy-based; order tacos with no cheese and no crema" },
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
        { name: "Yalla Falafel", area: "Palo Alto", rating: 4.7, reviews: null, ratingSrc: "Uber Eats", platforms: ["Uber Eats"], safeDishes: [ { dish: "Amba chicken (shawarma-spiced) pita", note: "chicken + hummus + amba; no yogurt sauce" }, { dish: "Crispy herb falafel", note: "lemon tahini, dairy-free" }, { dish: "Hummus", note: "housemade, dairy-free" } ], watchOut: "amba aioli is egg-based (ok); skip labneh/yogurt add-ons; all proteins are chicken/falafel" },
        { name: "Falafel Tazah", area: "Redwood City", rating: 4.8, reviews: 459, ratingSrc: "Yelp", platforms: ["Uber Eats","Grubhub"], safeDishes: [ { dish: "Chicken shawarma plate", note: "sub tahini/hummus for the default garlic YOGURT sauce" }, { dish: "Falafel wrap or plate", note: "dairy-free" }, { dish: "Hummus", note: "garbanzo/tahini/lemon, dairy-free" } ], watchOut: "default chicken shawarma comes with garlic yogurt sauce — request tahini; skip lamb/beef shawarma" },
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
        { name: "Farmhouse Kitchen Thai", area: "Menlo Park", rating: 4.2, reviews: 2022, ratingSrc: "Yelp", platforms: ["Uber Eats","DoorDash"], safeDishes: [ { dish: "Hat Yai fried chicken", note: "crispy dry-fried chicken, no dairy" }, { dish: "Khao Soi Gai", note: "coconut curry noodle with chicken; coconut not dairy" }, { dish: "Green or Panang curry", note: "coconut-based; chicken or tofu" } ], watchOut: "pick chicken/tofu/seafood; avoid any beef/pork (moo/neua) dishes" },
        { name: "Lotus Thai Bistro", area: "Palo Alto", rating: 3.6, reviews: 476, ratingSrc: "Yelp", platforms: ["Uber Eats","DoorDash","Grubhub"], safeDishes: [ { dish: "Green or pumpkin curry", note: "coconut milk (not dairy); chicken, tofu or shrimp" }, { dish: "Pad Thai", note: "rice noodle, egg, no milk; chicken/shrimp/tofu" }, { dish: "Pad See Ew", note: "soy; chicken or tofu, no dairy" } ], watchOut: "curries are coconut not cream — order chicken/tofu/shrimp, never beef or pork" },
        { name: "Tommy Thai", area: "Mountain View", rating: 3.8, reviews: 1011, ratingSrc: "Yelp", platforms: ["Uber Eats","DoorDash"], safeDishes: [ { dish: "Green or Panang curry", note: "coconut; chicken or tofu" }, { dish: "Pineapple fried rice", note: "chicken, tofu or shrimp; no dairy" }, { dish: "Tom Yum soup", note: "clear lemongrass broth; chicken/shrimp" } ], watchOut: "coconut curries are dairy-free; skip beef/pork proteins" },
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
        { name: "Da Sichuan Bistro", area: "Palo Alto", rating: 3.9, reviews: 587, ratingSrc: "Yelp", platforms: ["Uber Eats","DoorDash"], safeDishes: [ { dish: "Kung Pao chicken", note: "chicken, peanuts, chili; no dairy" }, { dish: "Fish fillet in chili oil (shui zhu yu)", note: "fish only; no dairy" }, { dish: "Mapo tofu", note: "ask for NO ground pork; no dairy otherwise" } ], watchOut: "Sichuan stir-fries hide ground pork (mapo tofu, green beans, eggplant) — always ask to omit it" },
        { name: "Kirin Chinese Restaurant", area: "Mountain View", rating: 3.6, reviews: 645, ratingSrc: "Yelp", platforms: ["Uber Eats"], safeDishes: [ { dish: "Kung Pao chicken", note: "chicken, chili, peanuts; no dairy" }, { dish: "Salt & pepper shrimp or squid", note: "seafood, no dairy" }, { dish: "Steamed whole fish (ginger-scallion)", note: "fish only, no dairy" } ], watchOut: "Cantonese menu is pork-heavy (char siu, BBQ pork, ribs) — stick to chicken/seafood" },
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
        { name: "Jin Sho", area: "Palo Alto", rating: 4.8, reviews: 230, ratingSrc: "Uber Eats", platforms: ["Uber Eats"], safeDishes: [ { dish: "Assorted sashimi / nigiri", note: "raw fish, rice; no dairy" }, { dish: "Chicken teriyaki", note: "chicken, soy glaze; no dairy" }, { dish: "Edamame & miso soup", note: "dashi is fish/kombu, no dairy" } ], watchOut: "skip cream-cheese rolls (Philadelphia/some specialty rolls) — the only dairy risk here" },
        { name: "Hanabi Sushi", area: "Mountain View", rating: 4.7, reviews: null, ratingSrc: "Uber Eats", platforms: ["Uber Eats","DoorDash"], safeDishes: [ { dish: "Sashimi combo", note: "raw fish only, no dairy" }, { dish: "Chicken teriyaki bento", note: "chicken, rice, salad, miso; no dairy" }, { dish: "Chirashi bowl", note: "assorted fish over rice" } ], watchOut: "avoid cream-cheese specialty rolls; bento dressing is dairy-free" },
        { name: "Eighty-Eight Sushi & Ramen", area: "Mountain View", rating: 4.2, reviews: null, ratingSrc: "Uber Eats", platforms: ["Uber Eats"], safeDishes: [ { dish: "Sushi & sashimi rolls", note: "choose non-cream-cheese rolls" }, { dish: "Chicken karaage", note: "fried chicken; confirm batter has no milk" }, { dish: "Edamame & seaweed salad", note: "plant-based, no dairy" } ], watchOut: "ramen here is tonkotsu (pork broth) with pork chashu — order sushi/karaage, not the ramen" },
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
        { name: "Pho To Chau", area: "Mountain View", rating: 4.2, reviews: 977, ratingSrc: "Yelp", platforms: ["Uber Eats","DoorDash"], safeDishes: [ { dish: "Pho Ga", note: "chicken broth + chicken — the only mammal-free pho" }, { dish: "Bun grilled chicken (vermicelli)", note: "rice vermicelli, fish sauce; no dairy" }, { dish: "Fresh spring rolls", note: "order shrimp-only; standard has pork" } ], watchOut: "default pho broth is beef — order Pho Ga specifically; fresh rolls usually include pork" },
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
        { name: "Bonchon", area: "Mountain View", rating: 4.7, reviews: null, ratingSrc: "Uber Eats", platforms: ["Uber Eats","DoorDash"], safeDishes: [ { dish: "Soy garlic wings/drumsticks", note: "Korean fried chicken, no dairy in batter" }, { dish: "Spicy (hot) chicken", note: "chicken, chili glaze; no dairy" }, { dish: "Chicken tenders & pickled radish", note: "no dairy" } ], watchOut: "skip the honey-butter flavor (dairy) and any bulgogi/tteokbokki with beef — plain fried chicken is safe" },
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
        { name: "Pamilya", area: "Redwood City", rating: 4.2, reviews: 134, ratingSrc: "Yelp", platforms: ["Uber Eats","DoorDash"], safeDishes: [ { dish: "Chicken adobo (boneless)", note: "soy-vinegar braise; chicken not pork; no dairy" }, { dish: "Chicken inasal / grilled chicken", note: "no dairy" }, { dish: "Vegetable lumpia", note: "veg spring rolls; skip Shanghai (pork)" } ], watchOut: "Filipino menus lean pork — avoid sisig, lechon, longganisa and pork lumpia; confirm chicken-only adobo" },
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
        { name: "Momo King", area: "Mountain View", rating: 3.8, reviews: 16, ratingSrc: "Google", platforms: ["Uber Eats"], safeDishes: [ { dish: "Chicken momo (steamed dumplings)", note: "confirm wrapper has no dairy" }, { dish: "Chicken chili", note: "Indo-Nepalese chili chicken; no dairy" }, { dish: "Chicken curry", note: "ask for tomato/onion base, no cream/ghee" } ], watchOut: "avoid korma/tikka-masala/paneer (cream + dairy) and all lamb/goat; ask 'no ghee, no cream'" },
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
        { name: "Amici's East Coast Pizzeria", area: "Menlo Park", rating: null, reviews: null, ratingSrc: null, platforms: ["Uber Eats","Grubhub"], safeDishes: [ { dish: "Marinara pizza (no cheese)", note: "thin crust, tomato/garlic/basil, hold cheese" }, { dish: "Build-your-own with Daiya vegan cheese", note: "veggie toppings, no meat" }, { dish: "Vegan pie + grilled chicken", note: "Daiya cheese, no pork toppings" } ], watchOut: "confirm no parmesan dusting; skip pepperoni/sausage/prosciutto and standard mozzarella — use Daiya or go cheeseless" },
        { name: "Curry Pizza House", area: "Palo Alto", rating: null, reviews: 384, ratingSrc: "Yelp", platforms: ["Uber Eats","Grubhub"], safeDishes: [ { dish: "Vegan pizza (GF vegan crust)", note: "vegan cheese + marinara, veggie toppings" }, { dish: "Build-your-own vegan", note: "vegan cheese is only on the GF vegan crust" } ], watchOut: "regular-crust pizzas use dairy cheese and chicken tikka sauces have cream — order the vegan build" },
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
        { name: "The Melt", area: "Palo Alto", rating: 4.7, reviews: 7000, ratingSrc: "Uber Eats", platforms: ["Uber Eats","DoorDash","Grubhub"], safeDishes: [ { dish: "Grilled or crispy chicken sandwich", note: "hold the cheese and any creamy sauce" }, { dish: "Fries", note: "fried in vegetable oil" } ], watchOut: "the concept is grilled-cheese 'melts' — order the chicken sandwich with no cheese; skip beef/bacon and garlic-butter items" },
        { name: "The Counter", area: "Palo Alto", rating: null, reviews: null, ratingSrc: null, platforms: ["Uber Eats"], safeDishes: [ { dish: "Grilled chicken breast burger, no cheese", note: "on a bun or over greens; hold dairy sauces" }, { dish: "Turkey burger, no cheese", note: "customize with veggies" }, { dish: "Fries", note: "fried in vegetable oil" } ], watchOut: "build-your-own — choose chicken or turkey, hold cheese/ranch/thousand-island (dairy); no beef/bacon" },
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
        { name: "Pacific Catch", area: "Palo Alto", rating: 4.2, reviews: 547, ratingSrc: "Yelp", platforms: ["Uber Eats","DoorDash","Grubhub"], safeDishes: [ { dish: "Grilled fish tacos (mahi/salmon)", note: "no crema/cheese" }, { dish: "Ahi poke bowl", note: "soy/sesame, dairy-free" }, { dish: "Grilled fresh catch", note: "ask grilled with no butter, rice + veg" } ], watchOut: "skip clam chowder and any cream/butter finishes — request grilled fish cooked in oil, not butter" },
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

// ---------------------------------------------------------------------------
// GROCERY CATALOG — dairy-free & mammal-free products on Whole Foods / Amazon /
// Amazon Fresh, with approximate Amazon ratings. Ratings & availability drift;
// treat as a guide. Supplement doses are not medical advice.
// ---------------------------------------------------------------------------

const GROCERY_ITEMS = [
  { category: "Produce", items: [
    { name: "Organic Baby Spinach, 5 oz clamshell", brand: "365 by Whole Foods Market", asin: null, diet: "Vegan", verified: "Single ingredient: organic baby spinach — dairy-free, no mammal/gelatin (plant)", rating: 4.6, reviews: 3200, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh"], nutrients: ["iron", "calcium", "fiber", "vitamin-c"] },
    { name: "Lacinato (Dinosaur) Kale, 1 bunch", brand: "Whole Foods Market (fresh)", asin: null, diet: "Vegan", verified: "Single ingredient: fresh lacinato kale — dairy-free, no mammal/gelatin (plant)", rating: 4.5, reviews: 800, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh"], nutrients: ["iron", "calcium", "fiber", "vitamin-c"] },
    { name: "Red Bell Peppers, each", brand: "Whole Foods Market (fresh)", asin: null, diet: "Vegan", verified: "Single ingredient: fresh red bell pepper — dairy-free, no mammal/gelatin (plant)", rating: 4.5, reviews: 1500, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh"], nutrients: ["vitamin-c", "fiber"] },
    { name: "Navel Oranges, 3 lb bag", brand: "Whole Foods Market (fresh)", asin: null, diet: "Vegan", verified: "Single ingredient: fresh navel oranges — dairy-free, no mammal/gelatin (plant)", rating: 4.4, reviews: 2600, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh"], nutrients: ["vitamin-c", "fiber", "calcium"] },
    { name: "Broccoli Crowns, each", brand: "Whole Foods Market (fresh)", asin: null, diet: "Vegan", verified: "Single ingredient: fresh broccoli — dairy-free, no mammal/gelatin (plant)", rating: 4.5, reviews: 1900, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh"], nutrients: ["vitamin-c", "fiber", "calcium", "iron"] },
    { name: "Strawberries, 1 lb package", brand: "Whole Foods Market (fresh)", asin: null, diet: "Vegan", verified: "Single ingredient: fresh strawberries — dairy-free, no mammal/gelatin (plant)", rating: 4.4, reviews: 4100, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh"], nutrients: ["vitamin-c", "fiber"] },
    { name: "Lemons, 2 lb bag", brand: "Whole Foods Market (fresh)", asin: null, diet: "Vegan", verified: "Single ingredient: fresh lemons — dairy-free, no mammal/gelatin (plant)", rating: 4.4, reviews: 1700, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh"], nutrients: ["vitamin-c", "fiber"] },
  ] },
  { category: "Poultry & Seafood", items: [
    { name: "Chunk Light Tuna in Water, 2.6 oz pouch", brand: "StarKist", asin: "B01ITIOG5Y", diet: "Pescatarian", verified: "Ingredients: light tuna, water, salt — dairy-free, no mammal/gelatin; label states gluten-free & soy-free", rating: 4.7, reviews: 47000, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["protein", "iron", "b12", "omega-3"] },
    { name: "Wild Sardines in Water, No Salt Added, 4.4 oz (with bones)", brand: "Wild Planet", asin: "B013ORK8P2", diet: "Pescatarian", verified: "Ingredients: sardines, water — dairy-free, no mammal/gelatin; edible soft bones supply calcium", rating: 4.6, reviews: 8600, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "calcium", "omega-3", "b12", "vitamin-d"] },
    { name: "Wild Pink Salmon, Skinless Boneless in Water, 2.6 oz pouch", brand: "StarKist", asin: "B07GX3RJ7H", diet: "Pescatarian", verified: "Ingredients: pink salmon, water, salt — dairy-free, no mammal/gelatin; label gluten-free & soy-free", rating: 4.6, reviews: 12000, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["protein", "omega-3", "b12", "vitamin-d"] },
    { name: "Wild Pink Salmon with Skin and Bones, 14.75 oz can", brand: "Wild Planet", asin: "B0939MS1HW", diet: "Pescatarian", verified: "Ingredients: wild pink salmon, sea salt — dairy-free, no mammal/gelatin; soft edible bones for calcium", rating: 4.5, reviews: 3400, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "calcium", "omega-3", "vitamin-d", "b12"] },
    { name: "Wild Mackerel Fillets in Organic Extra Virgin Olive Oil, 4.4 oz", brand: "Wild Planet", asin: "B013ORKCOY", diet: "Pescatarian", verified: "Ingredients: mackerel, organic extra virgin olive oil, sea salt — dairy-free, no mammal/gelatin", rating: 4.4, reviews: 5200, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "omega-3", "vitamin-d", "b12"] },
    { name: "Short Cuts Grilled Carved Chicken Breast Strips, Fully Cooked, 8 oz", brand: "Perdue", asin: "B06XC1WHYK", diet: "Poultry", verified: "Ingredients: chicken breast, water, vinegar, salt, soy protein, spices — dairy-free, no mammal/gelatin (poultry only)", rating: 4.5, reviews: 1300, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["protein", "b12"] },
    { name: "Sweet Italian Style Fully Cooked Chicken Sausage, 11 oz", brand: "al fresco", asin: "B07QK2B12L", diet: "Poultry", verified: "Made with lean skinless chicken, no pork; label gluten-free & dairy-free — no whey/casein, no mammal meat", rating: 4.4, reviews: 900, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["protein", "b12"] },
    { name: "Wild-Caught Cold-Smoked Sockeye Salmon Nova Lox, 8 oz", brand: "Kate's / Wild Caught Nova Lox", asin: "B0734CNB1Q", diet: "Pescatarian", verified: "Ingredients: wild sockeye salmon, salt, natural smoke — dairy-free, no mammal/gelatin", rating: 4.3, reviews: 2100, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "omega-3", "b12", "vitamin-d"] },
  ] },
  { category: "Dairy Alternatives & Eggs", items: [
    { name: "Organic Unsweetened Soymilk, Half Gallon (64 oz)", brand: "Silk", asin: "B000PKZ9JM", diet: "Vegan", verified: "Dairy-free vegan soymilk (soybeans, water); fortified with calcium, vitamin D and B12 — no milk/whey/casein, no mammal ingredients", rating: 4.7, reviews: 9800, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "calcium", "b12", "vitamin-d"] },
    { name: "Original Unsweetened Pea Milk, 48 oz", brand: "Ripple", asin: "B074KL78Z9", diet: "Vegan", verified: "Plant-based pea-protein milk, certified vegan & dairy/soy/nut-free; 8g pea protein, calcium-rich — no milk/whey/casein, no mammal ingredients", rating: 4.4, reviews: 3100, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "calcium", "iron", "vitamin-d"] },
    { name: "Unsweetened Almondmilk, 48 oz", brand: "Califia Farms", asin: "B00IZ6P9H0", diet: "Vegan", verified: "Dairy-free vegan almondmilk (almonds, water); high-calcium, no added sugar — no milk/whey/butter, no mammal ingredients", rating: 4.6, reviews: 12000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["calcium", "vitamin-d"] },
    { name: "Original Oatmilk, Half Gallon (64 oz)", brand: "Oatly", asin: "B075QJ8M1K", diet: "Vegan", verified: "Dairy-free vegan oatmilk made from oats; fortified with calcium, riboflavin, D and B12 — no milk/whey/casein, no mammal ingredients", rating: 4.6, reviews: 5400, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["calcium", "b12", "vitamin-d", "fiber"] },
    { name: "Original Unsweetened Dairy-Free Creamer, 25.4 oz", brand: "nutpods", asin: "B08LWXPYCZ", diet: "Vegan", verified: "Certified vegan & Whole30; made from almonds and coconut cream — dairy-free, no milk/cream/whey, no mammal ingredients", rating: 4.6, reviews: 43000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: [] },
    { name: "Just Like Cheddar Shreds, 8 oz", brand: "Violife", asin: "B07GT6857V", diet: "Vegan", verified: "100% vegan cheese alternative (coconut-oil base), free from dairy/casein/lactose; B12-fortified — no mammal ingredients or gelatin", rating: 4.4, reviews: 6800, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["b12", "calcium"] },
    { name: "Just Like Mozzarella Shreds, 8 oz", brand: "Violife", asin: "B07GT6H8SY", diet: "Vegan", verified: "100% vegan cheese alternative (coconut-oil base), dairy/soy/lactose-free, B12-fortified — no milk/casein/whey, no mammal ingredients", rating: 4.4, reviews: 5200, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["b12"] },
    { name: "Chive Almond Milk Cream Cheese Style Spread, 8 oz", brand: "Kite Hill", asin: "B071XSRFMY", diet: "Vegan", verified: "Almond-milk based, Non-GMO, certified vegan & dairy-free (Whole30 approved) — no milk/cream/whey/casein, no mammal ingredients", rating: 4.3, reviews: 1500, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: [] },
    { name: "European Style Cultured Salted Vegan Butter, 8 oz", brand: "Miyoko's Creamery", asin: "B07D6SBD3V", diet: "Vegan", verified: "Organic cultured plant-milk (cashew) butter, certified vegan & lactose-free — no dairy butter/cream/ghee, no mammal ingredients", rating: 4.5, reviews: 4300, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: [] },
    { name: "Plain Unsweetened Almond Milk Yogurt, 16 oz", brand: "Kite Hill", asin: "B073QLS4SB", diet: "Vegan", verified: "Almond-milk yogurt with live cultures, certified vegan, dairy/soy-free — no milk/whey/casein, no gelatin, no mammal ingredients", rating: 4.2, reviews: 900, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "calcium"] },
    { name: "Pasture-Raised Large Grade A Eggs, 12 ct", brand: "Vital Farms", asin: "B00TNWEN18", diet: "Vegetarian", verified: "Whole chicken eggs only — no dairy and no mammal/beef/gelatin ingredients; eggs are AGS-safe and allowed in this aisle", rating: 4.6, reviews: 7600, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "vitamin-d", "b12"] },
    { name: "100% Liquid Egg Whites, 32 oz", brand: "Bob Evans", asin: "B0862TD5VW", diet: "Vegetarian", verified: "100% cage-free liquid egg whites — no dairy, no milk/whey, no mammal/gelatin ingredients; egg-based and AGS-safe", rating: 4.5, reviews: 1200, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["protein"] },
  ] },
  { category: "Bakery & Bread", items: [
    { name: "21 Whole Grains and Seeds Organic Bread, 27 oz Loaf", brand: "Dave's Killer Bread", asin: "B001F79MMY", diet: "Vegan", verified: "Certified vegan whole-grain bread; ingredients contain no milk/whey/butter, no honey, no mammal/gelatin ingredients", rating: 4.7, reviews: 15000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "fiber", "iron"] },
    { name: "Soft Taco Whole Wheat Tortillas, 10 Count", brand: "Mission", asin: "B07KQPN2T8", diet: "Vegan", verified: "Whole-wheat flour tortillas; vegetable-oil based, no milk/whey/butter, no lard or mammal ingredients — dairy-free", rating: 4.7, reviews: 8100, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["fiber", "iron"] },
    { name: "Extra Thin Yellow Corn Tortillas, 16 oz", brand: "Mission", asin: "B004BVT34I", diet: "Vegan", verified: "Gluten-free corn tortillas (corn masa, lime); no milk/whey/butter, no lard or mammal ingredients — naturally dairy-free", rating: 4.7, reviews: 3400, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["fiber"] },
    { name: "Plain Pre-Sliced Bagels, 6 ct (20 oz)", brand: "Thomas'", asin: "B000R4JI0C", diet: "Dairy-free", verified: "Ingredient label lists no milk/whey/butter/casein and no mammal/gelatin ingredients — confirmed dairy-free (not certified vegan)", rating: 4.7, reviews: 4100, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["protein", "iron", "fiber"] },
    { name: "Ezekiel 4:9 Sprouted Whole Grain English Muffins, 16 oz", brand: "Food For Life", asin: "B076PM4G2W", diet: "Vegan", verified: "Certified vegan sprouted-grain muffins; no milk/whey/butter, no honey, no mammal/gelatin — dairy-free (replaces whey-containing Thomas' muffins)", rating: 4.6, reviews: 2600, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "fiber", "iron"] },
    { name: "Whole Wheat Smart Pockets Pita Bread (3 packs, 18 total)", brand: "Toufayan", asin: "B081ZC41NT", diet: "Vegan", verified: "Labeled naturally vegan & cholesterol-free; whole-wheat pita with no milk/whey/butter, no lard or mammal ingredients — dairy-free", rating: 4.5, reviews: 3800, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["fiber", "protein"] },
  ] },
  { category: "Deli & Dips", items: [
    { name: "Classic Hummus, 10 oz", brand: "Sabra", asin: "B00120UWY6", diet: "Vegan", verified: "Ingredients: chickpeas, tahini, soybean oil, garlic — labeled Dairy-Free, no mammal", rating: 4.6, reviews: 8700, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "iron", "fiber"] },
    { name: "Classic Guacamole Bowl, 15 oz", brand: "Wholly Guacamole", asin: "B081P344BS", diet: "Vegan", verified: "Ingredients: Hass avocado, onion, lime, salt — dairy-free, no mammal", rating: 4.5, reviews: 3400, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["fiber"] },
    { name: "Baba Ghanoush Eggplant Dip, 29 oz", brand: "Cortas", asin: "B00A6J97PE", diet: "Vegan", verified: "Ingredients: eggplant, tahini, lemon, garlic — dairy-free, no yogurt, no mammal", rating: 4.5, reviews: 500, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["fiber"] },
    { name: "Chunky Salsa, Medium, 15.5 oz", brand: "Tostitos", asin: "B00C8W0NV4", diet: "Vegan", verified: "Ingredients: tomatoes, peppers, onion, spices — dairy-free, no mammal", rating: 4.7, reviews: 6900, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: [] },
    { name: "Black Olive Tapenade in Oil, 6.7 oz", brand: "DeLallo", asin: "B087D58H3K", diet: "Vegan", verified: "Ingredients: black olives, capers, extra virgin olive oil — dairy-free, no mammal", rating: 4.5, reviews: 400, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: [] },
  ] },
  { category: "Pantry & Dry Goods", items: [
    { name: "Organic Old Fashioned Rolled Oats, 32 oz", brand: "Bob's Red Mill", asin: "B000QXGB7C", diet: "Vegan", verified: "Ingredients: organic whole grain rolled oats — single ingredient, dairy-free, no mammal/gelatin", rating: 4.8, reviews: 41000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["fiber", "protein", "iron"] },
    { name: "Organic Steel Cut Oats, 24 oz", brand: "Bob's Red Mill", asin: "B00IEITN4O", diet: "Vegan", verified: "Ingredients: organic whole grain steel cut oats — single ingredient, dairy-free, no mammal/gelatin", rating: 4.8, reviews: 18000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["fiber", "protein", "iron"] },
    { name: "Organic White Quinoa, 26 oz", brand: "Bob's Red Mill", asin: "B07WGFHS5D", diet: "Vegan", verified: "Ingredients: organic whole grain quinoa — single ingredient, dairy-free, no mammal/gelatin", rating: 4.7, reviews: 9500, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "iron", "fiber"] },
    { name: "Organic Short Grain Brown Rice, 32 oz", brand: "Lundberg Family Farms", asin: "B000QV32CQ", diet: "Vegan", verified: "Ingredients: organic whole grain brown rice — single ingredient, dairy-free, no mammal/gelatin", rating: 4.7, reviews: 8200, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["fiber", "protein"] },
    { name: "Organic California White Jasmine Rice, 32 oz", brand: "Lundberg Family Farms", asin: "B001O8RCLW", diet: "Vegan", verified: "Ingredients: organic jasmine white rice — single ingredient, dairy-free, no mammal/gelatin", rating: 4.7, reviews: 6400, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein"] },
    { name: "Organic Brown Rice Penne Rigate, Gluten Free, 12 oz", brand: "Jovial", asin: "B00IV7058G", diet: "Vegan", verified: "Ingredients: organic whole grain brown rice, water — dairy-free, egg-free, no mammal/gelatin", rating: 4.6, reviews: 12000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon"], nutrients: ["protein", "fiber"] },
    { name: "Organic Black Beans, No Salt Added, 15 oz", brand: "Eden Foods", asin: "B000SR5GRC", diet: "Vegan", verified: "Ingredients: organic black beans, water, kombu seaweed — no lard, dairy-free, no mammal/gelatin", rating: 4.7, reviews: 5600, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["protein", "fiber", "iron"] },
    { name: "Organic Pinto Beans, No Salt Added, 15 oz", brand: "Eden Foods", asin: "B000VK3WRW", diet: "Vegan", verified: "Ingredients: organic pinto beans, water, kombu seaweed — no lard, dairy-free, no mammal/gelatin", rating: 4.7, reviews: 3900, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["protein", "fiber", "iron"] },
    { name: "Organic Garbanzo Beans (Chickpeas), No Salt Added, 15 oz", brand: "Eden Foods", asin: "B000VK3WQI", diet: "Vegan", verified: "Ingredients: organic garbanzo beans, water, kombu seaweed — no lard, dairy-free, no mammal/gelatin", rating: 4.7, reviews: 6100, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["protein", "fiber", "iron"] },
    { name: "Organic Free Range Chicken Broth, 32 oz", brand: "Pacific Foods", asin: "B001HTLBM4", diet: "Omnivore", verified: "Poultry-based broth: organic chicken broth, chicken flavor, vegetables — no beef/bone broth, no dairy, no mammal/gelatin", rating: 4.7, reviews: 14000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein"] },
    { name: "Organic Low Sodium Vegetable Broth, 32 oz", brand: "Pacific Foods", asin: "B008YAW8VM", diet: "Vegan", verified: "Ingredients: organic vegetable stock (carrots, celery, onions, tomatoes), sea salt — dairy-free, no mammal/gelatin", rating: 4.7, reviews: 11000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: [] },
    { name: "Organic Classic Coconut Milk, 13.5 oz", brand: "Native Forest", asin: "B00YCYS7IW", diet: "Vegan", verified: "Ingredients: organic coconut, water, organic guar gum — plant-based, dairy-free, no mammal/gelatin", rating: 4.6, reviews: 22000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon"], nutrients: ["iron"] },
    { name: "Homemade Marinara Sauce, 24 oz", brand: "Rao's", asin: "B000WH9DCW", diet: "Vegan", verified: "Ingredients: Italian tomatoes, olive oil, onions, garlic, basil, salt, oregano — no cheese/cream, dairy-free, no mammal/gelatin", rating: 4.7, reviews: 46000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["vitamin-c", "fiber"] },
    { name: "Organic Diced Tomatoes, 14.5 oz", brand: "Muir Glen", asin: "B000SR5X7A", diet: "Vegan", verified: "Ingredients: organic tomatoes, tomato juice, calcium chloride, citric acid — dairy-free, no mammal/gelatin", rating: 4.8, reviews: 7300, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["vitamin-c", "fiber"] },
    { name: "Premium Tahini (Sesame Paste), 11 oz", brand: "Soom Foods", asin: "B09LJDV88X", diet: "Vegan", verified: "Ingredients: 100% roasted Ethiopian white humera sesame — single ingredient, dairy-free, no mammal/gelatin", rating: 4.7, reviews: 4200, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon"], nutrients: ["calcium", "protein", "iron"] },
    { name: "Organic Creamy Peanut Butter, Unsalted, 16 oz", brand: "Once Again", asin: "B0046HNRPS", diet: "Vegan", verified: "Ingredients: organic dry roasted peanuts — single ingredient, no palm oil, dairy-free, no mammal/gelatin", rating: 4.7, reviews: 5800, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon"], nutrients: ["protein", "fiber"] },
    { name: "Organic Creamy Almond Butter, Roasted, 16 oz", brand: "Once Again", asin: "B005H90IJ2", diet: "Vegan", verified: "Ingredients: organic dry roasted almonds — single ingredient, dairy-free, no mammal/gelatin", rating: 4.6, reviews: 3100, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon"], nutrients: ["protein", "calcium", "fiber"] },
    { name: "Natural Sunflower Seed Butter, Creamy, 16 oz", brand: "SunButter", asin: "B000VK84P2", diet: "Vegan", verified: "Ingredients: roasted sunflower seeds, sugar, salt — nut-free & dairy-free, no mammal/gelatin", rating: 4.7, reviews: 13000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "fiber", "iron"] },
    { name: "Everyday Extra Virgin Olive Oil, 25.4 oz", brand: "California Olive Ranch", asin: "B00CO1YXL0", diet: "Vegan", verified: "Ingredients: 100% extra virgin olive oil — single ingredient, dairy-free, no mammal/gelatin", rating: 4.7, reviews: 16000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: [] },
    { name: "100% Pure Avocado Oil, 25.4 oz", brand: "Chosen Foods", asin: "B01FB3Q1TE", diet: "Vegan", verified: "Ingredients: 100% pure avocado oil — single ingredient, dairy-free, no mammal/gelatin", rating: 4.7, reviews: 19000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: [] },
    { name: "Gluten Free Tamari Soy Sauce, 10 oz", brand: "San-J", asin: "B01BMYSNSS", diet: "Vegan", verified: "Ingredients: water, soybeans, salt, alcohol — wheat-free & dairy-free, no mammal/gelatin", rating: 4.8, reviews: 9800, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: [] },
    { name: "40°N Premium Fish Sauce, 8.45 oz", brand: "Red Boat", asin: "B00K6ZJ1W2", diet: "Pescatarian", verified: "Ingredients: black anchovy, sea salt — fish-based (not mammal), dairy-free, no gelatin/lard", rating: 4.7, reviews: 7600, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon"], nutrients: ["protein"] },
    { name: "Petite French Green Lentils, 24 oz", brand: "Bob's Red Mill", asin: "B084J5YGZJ", diet: "Vegan", verified: "Ingredients: petite French green lentils — single ingredient, dairy-free, no mammal/gelatin", rating: 4.7, reviews: 3400, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "iron", "fiber"] },
    { name: "Brown Lentils, 27 oz", brand: "Bob's Red Mill", asin: "B09JBHMHXC", diet: "Vegan", verified: "Ingredients: whole brown lentils — single ingredient, dairy-free, no mammal/gelatin", rating: 4.7, reviews: 2600, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "iron", "fiber"] },
    { name: "Organic Pumpkin Seeds (Pepitas), Raw & Unsalted, 2 lb", brand: "Terrasoul Superfoods", asin: "B01BLYNWVM", diet: "Vegan", verified: "Ingredients: organic raw shelled pumpkin seeds — single ingredient, dairy-free, no mammal/gelatin", rating: 4.6, reviews: 15000, ratingSrc: "Amazon", stores: ["Amazon"], nutrients: ["protein", "iron", "omega-3"] },
    { name: "Organic Chia Seeds, 12 oz", brand: "Bob's Red Mill", asin: "B075XG1YR3", diet: "Vegan", verified: "Ingredients: organic whole chia seeds — single ingredient, dairy-free, no mammal/gelatin", rating: 4.8, reviews: 21000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["omega-3", "fiber", "calcium"] },
    { name: "Organic Unsulphured Blackstrap Molasses, 16 oz", brand: "Wholesome", asin: "B00MFBVY2U", diet: "Vegan", verified: "Ingredients: organic blackstrap molasses (sugarcane) — plant-based, dairy-free, no mammal/gelatin", rating: 4.7, reviews: 8900, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["iron", "calcium"] },
    { name: "California Dried Mission Figs, 7 oz", brand: "Sun-Maid", asin: "B006WQMRRK", diet: "Vegan", verified: "Ingredients: dried mission figs — single ingredient, no added sugar, dairy-free, no mammal/gelatin", rating: 4.6, reviews: 6700, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["fiber", "calcium", "iron"] },
    { name: "Organic Dried Turkish Apricots, 32 oz", brand: "Sunny Fruit", asin: "B089NCMHWQ", diet: "Vegan", verified: "Ingredients: organic dried apricots — no added sugar, no sulfites, dairy-free, no mammal/gelatin", rating: 4.6, reviews: 10000, ratingSrc: "Amazon", stores: ["Amazon"], nutrients: ["fiber", "iron"] },
  ] },
  { category: "Breakfast & Cereal", items: [
    { name: "Organic Original Ancient Grain Granola (12 oz)", brand: "Purely Elizabeth", asin: "B01515ECLQ", diet: "Vegan", verified: "Label: gluten-free oats, coconut sugar, coconut oil, chia/hemp/quinoa — certified vegan, no milk/whey, no mammal, no gelatin", rating: 4.6, reviews: 9800, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["fiber", "protein"] },
    { name: "Organic Heritage Flakes Cereal (13.25 oz)", brand: "Nature's Path", asin: "B0082304LM", diet: "Vegan", verified: "Label: 6 organic ancient grains, cane sugar, sea salt — plant-based, no milk, no mammal, no gelatin", rating: 4.6, reviews: 6100, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["fiber", "iron", "protein"] },
    { name: "Gluten Free Classic Oatmeal Cup (1.81 oz, 12-pack)", brand: "Bob's Red Mill", asin: "B013AX5WUQ", diet: "Vegan", verified: "Label: whole grain oats, flax, chia, sea salt — Non-GMO, vegan, no milk/whey, no mammal, no gelatin", rating: 4.6, reviews: 5400, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["fiber", "protein", "iron"] },
    { name: "Total Whole Grain Cereal (16 oz)", brand: "General Mills (Total)", asin: "B000VDR3WO", diet: "Vegetarian", verified: "Ingredients: whole grain wheat, sugar, corn bran + added iron & calcium; no milk listed, no gelatin, no beef/pork (contains added vitamin D3, not milk) — dairy-free, mammal-meat-free, gelatin-free", rating: 4.7, reviews: 4200, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["iron", "calcium"] },
    { name: "Overnight Oats Cups, Variety 10-Pack (5 oz cups)", brand: "MUSH", asin: "B07DZ37YKZ", diet: "Vegan", verified: "Label explicitly 'Dairy Free'; oats + almondmilk, no added sugar — no milk/whey/casein, no mammal, no gelatin", rating: 4.3, reviews: 8700, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["fiber", "protein"] },
    { name: "Whole Wheat Fig Bars, Original Fig (12 twin packs)", brand: "Nature's Bakery", asin: "B006BHRV1W", diet: "Vegan", verified: "Label: vegan, no cholesterol; figs, whole wheat flour — no milk, no mammal, no gelatin", rating: 4.7, reviews: 22000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["fiber"] },
    { name: "Classic Almond Butter Squeeze Packs (1.15 oz, 10-pack)", brand: "Justin's", asin: "B01684FP1U", diet: "Vegan", verified: "Only two ingredients: dry roasted almonds, palm oil — vegan, no milk, no mammal, no gelatin", rating: 4.7, reviews: 14000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein"] },
  ] },
  { category: "Snacks", items: [
    { name: "Chocolate Sea Salt Protein Bar (12 ct)", brand: "RXBAR", asin: "B0143NQVQ6", diet: "Vegetarian", verified: "Label: dates, egg whites, nuts, cocoa — no milk/whey/casein, no mammal, no gelatin (egg-white protein, so vegetarian not vegan)", rating: 4.6, reviews: 45000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "fiber"] },
    { name: "MacroBar Organic Protein Bar, Protein Variety Pack (12 ct)", brand: "GoMacro", asin: "B07V9PM8HJ", diet: "Vegan", verified: "Certified vegan & Non-GMO; brown rice/pea protein, nut butters — no milk, no mammal, no gelatin", rating: 4.6, reviews: 12000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "iron", "fiber"] },
    { name: "Cherry Pie Fruit & Nut Bar (1.7 oz, 16 ct)", brand: "Larabar", asin: "B00H4IFF06", diet: "Vegan", verified: "Three ingredients: dates, almonds, unsweetened cherries — vegan, no milk, no mammal, no gelatin", rating: 4.7, reviews: 26000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["fiber", "protein"] },
    { name: "Dark Chocolate Nuts & Sea Salt Bar (1.4 oz, 12 ct) — DAIRY-FREE variant", brand: "KIND", asin: "B007PE7ANY", diet: "Vegan", verified: "This variant's ingredient list has NO milk (unlike KIND's caramel/PB-choc dairy bars); nuts, dark chocolate, sea salt. Note: shared-equipment 'may contain milk' advisory — no milk ingredient, no mammal, no gelatin", rating: 4.7, reviews: 38000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "fiber"] },
    { name: "Sea Salt Roasted Chickpea Snacks (5 oz, 4-pack)", brand: "Biena", asin: "B079DFLWDH", diet: "Vegan", verified: "Label: chickpeas, sunflower oil, sea salt — vegan, no milk, no mammal, no gelatin", rating: 4.4, reviews: 15000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "fiber", "iron"] },
    { name: "Organic Roasted Seaweed Snacks, Sea Salt (12 ct)", brand: "gimMe", asin: "B00BCG0OB6", diet: "Vegan", verified: "Label: organic seaweed, sunflower/sesame oil, sea salt — vegan, no milk, no mammal, no gelatin", rating: 4.6, reviews: 17000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["omega-3"] },
    { name: "Simple Organic Dark Chocolate Bar (2.1 oz)", brand: "Hu", asin: "B079TF1WDR", diet: "Vegan", verified: "Label: only cacao, coconut sugar, cocoa butter — certified vegan, no milk/soy/dairy, no mammal, no gelatin", rating: 4.5, reviews: 19000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["iron", "fiber"] },
    { name: "All Natural Roasted & Salted Pumpkin Seeds (5 oz, 12-pack)", brand: "DAVID", asin: "B00GN065A0", diet: "Vegan", verified: "Two ingredients: pumpkin seeds, salt — vegan, no milk, no mammal, no gelatin", rating: 4.6, reviews: 7300, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["protein", "iron"] },
    { name: "Organic Berry Patch Bunny Fruit Snacks (0.8 oz, 20 ct)", brand: "Annie's", asin: "B07BB256TC", diet: "Vegan", verified: "Gelling agent is pectin, not gelatin; organic, colors from fruit/veg juice — vegan, no milk, no mammal, pectin not gelatin", rating: 4.7, reviews: 21000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: [] },
    { name: "Juicy Burst Fruit Snacks, Berry Medley (0.8 oz, 22 ct)", brand: "Black Forest", asin: "B0CWPP7214", diet: "Vegan", verified: "Ingredients list pectin (no gelatin); fruit juice from concentrate — no milk, no mammal, pectin not gelatin", rating: 4.7, reviews: 34000, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: [] },
    { name: "Vegan Marshmallows, Classic Vanilla (10 oz)", brand: "Dandies", asin: "B00FBNZ58S", diet: "Vegan", verified: "Label states 'no gelatin'; uses carrageenan instead — vegan, no milk, no mammal, gelatin-free", rating: 4.5, reviews: 9600, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: [] },
    { name: "Semi-Sweet Mini Chocolate Chips (10 oz)", brand: "Enjoy Life", asin: "B000VK5VTO", diet: "Vegan", verified: "Free-from top allergens incl. dairy/casein; cane sugar, unsweet chocolate, cocoa butter — vegan, no milk, no mammal, no gelatin", rating: 4.7, reviews: 24000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["iron"] },
    { name: "Almond Flour Crackers, Fine Ground Sea Salt (4.25 oz)", brand: "Simple Mills", asin: "B01CI3TADE", diet: "Vegan", verified: "Label: almond/sunflower/flax flour, sea salt — vegan, no milk/whey, no mammal, no gelatin", rating: 4.5, reviews: 41000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "fiber"] },
  ] },
  { category: "Frozen", items: [
    { name: "Wild-Caught Sockeye Salmon Fillets, 32 oz", brand: "365 by Whole Foods Market", asin: "B07NRCRZFF", diet: "Pescatarian", verified: "Ingredients: wild sockeye salmon only — fish, no dairy, no mammal (beef/pork/gelatin)", rating: 4.4, reviews: 1300, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "omega-3"] },
    { name: "Wild White Gulf Raw Shrimp 16/20, 32 oz", brand: "365 by Whole Foods Market", asin: "B07NR73MGF", diet: "Pescatarian", verified: "Ingredients: wild white gulf shrimp, salt — shellfish, no dairy, no mammal", rating: 4.3, reviews: 900, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "omega-3"] },
    { name: "Shelled Edamame, 12 oz", brand: "365 by Whole Foods Market", asin: "B074H6S8D8", diet: "Vegan", verified: "Ingredients: shelled soybeans (edamame) — plant only, dairy-free, no mammal", rating: 4.6, reviews: 2100, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "iron", "fiber"] },
    { name: "Chopped Spinach, 16 oz", brand: "365 by Whole Foods Market", asin: "B074H5ZHSV", diet: "Vegan", verified: "Ingredients: chopped spinach — single vegetable, dairy-free, no mammal", rating: 4.5, reviews: 800, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["iron", "calcium", "fiber"] },
    { name: "Organic Whole Strawberries, 32 oz", brand: "365 by Whole Foods Market", asin: "B074H6G852", diet: "Vegan", verified: "Ingredients: organic strawberries — fruit only, dairy-free, no mammal", rating: 4.5, reviews: 1600, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["fiber"] },
    { name: "Dairy-Free Oatmilk Frozen Dessert, Simply Vanilla Bean, 1 Pint", brand: "So Delicious", asin: "B0815TK2CH", diet: "Vegan", verified: "Oatmilk base, labeled Dairy-Free & Certified Vegan — no dairy, no gelatin, no mammal", rating: 4.4, reviews: 500, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: [] },
    { name: "Certified Vegan Non-Dairy Frozen Dessert, Mint Chocolate Cookie, 1 Pint", brand: "Ben & Jerry's", asin: "B07Z8SRF23", diet: "Vegan", verified: "Almond-milk base, Certified Vegan — no dairy, no gelatin, no mammal-derived ingredients", rating: 4.5, reviews: 700, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: [] },
    { name: "Sorbetto, Alphonso Mango, 16 oz", brand: "Talenti", asin: "B00FTBSUUM", diet: "Vegan", verified: "Fruit sorbetto (mango, water, sugar) — dairy-free, no gelatin, no mammal", rating: 4.6, reviews: 1100, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: [] },
    { name: "Meatless Plant-Based Chick'n Strips, 10 oz", brand: "Gardein", asin: "B07FH1SPRS", diet: "Vegan", verified: "Soy/wheat protein strips, vegan brand — dairy-free, no mammal, no gelatin", rating: 4.4, reviews: 1400, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "iron"] },
  ] },
  { category: "Beverages", items: [
    { name: "Orange Juice with Calcium + Vitamin D, No Pulp, 59 oz", brand: "Tropicana", asin: "B00CJT38BI", diet: "Dairy-free", verified: "100% OJ, dairy-free & mammal-free; fortified with calcium, vitamin D & natural vitamin C", rating: 4.7, reviews: 1500, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Whole Foods", "Amazon"], nutrients: ["calcium", "vitamin-d", "vitamin-c"] },
    { name: "Pure Coconut Water, 33.8 Fl Oz", brand: "Vita Coco", asin: "B003HBI2B8", diet: "Vegan", verified: "Dairy-free & mammal-free coconut water; natural electrolytes, no added sugar", rating: 4.7, reviews: 40000, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Whole Foods", "Amazon"], nutrients: [] },
    { name: "Organic Cold-Pressed Uber Greens Green Juice, 12 Fl Oz", brand: "Suja", asin: "B071NG4M73", diet: "Vegan", verified: "Dairy-free & mammal-free; cold-pressed leafy-green + cucumber/celery juice, plant-based", rating: 4.4, reviews: 600, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["vitamin-c"] },
    { name: "Synergy Organic Raw Kombucha, Trilogy, 16.2 oz (Pack of 12)", brand: "GT's", asin: "B078J5JW6G", diet: "Vegan", verified: "Dairy-free & mammal-free raw kombucha; organic fermented tea, plant-based probiotics", rating: 4.5, reviews: 3000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: [] },
    { name: "Sparkling Water 4-Flavor Variety Pack, 12 oz (Pack of 20)", brand: "Spindrift", asin: "B07FCQKZ4F", diet: "Vegan", verified: "Dairy-free & mammal-free sparkling water made with real squeezed fruit; no sweeteners", rating: 4.6, reviews: 30000, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Whole Foods", "Amazon"], nutrients: [] },
  ] },
  { category: "Ready Meals", items: [
    { name: "Organic Lentil Vegetable Soup, 14.5 oz", brand: "Amy's", asin: "B000VK6J9A", diet: "Vegan", verified: "Labeled Vegan/Dairy-Free; lentils, veg, olive oil — no dairy, no mammal", rating: 4.6, reviews: 5200, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "iron", "fiber"] },
    { name: "Organic Split Pea Soup, 16.5 oz", brand: "Pacific Foods", asin: "B09ZPMJTM8", diet: "Vegan", verified: "Vegan split pea (no-ham variety); peas, carrots — dairy-free, no mammal", rating: 4.5, reviews: 2600, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "iron", "fiber"] },
    { name: "Organic Quinoa & Brown Rice with Garlic, 8.5 oz (microwave pouch)", brand: "Seeds of Change", asin: "B004T33K2O", diet: "Vegan", verified: "Ingredients: brown rice, quinoa, garlic, olive oil — dairy-free, no mammal", rating: 4.6, reviews: 7800, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "fiber"] },
    { name: "Thai Green Curry with Tofu & Jasmine Rice, 10 oz", brand: "Amy's", asin: "B01N53ZN03", diet: "Vegan", verified: "Labeled Vegan; tofu, coconut milk, jasmine rice — no dairy cream, no mammal", rating: 4.4, reviews: 1900, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein", "fiber"] },
    { name: "Plant-Based Buddha Bowl, 10 oz", brand: "Tattooed Chef", asin: "B09FRHSHGK", diet: "Vegan", verified: "Plant-based bowl (riced cauliflower, veg, grains) — dairy-free, no mammal", rating: 4.2, reviews: 600, ratingSrc: "Amazon", stores: ["Amazon Fresh", "Amazon"], nutrients: ["protein", "iron", "fiber"] },
    { name: "Lemongrass Basil Chicken with Basmati Rice, 10 oz", brand: "Saffron Road", asin: "B00L9Z6JN2", diet: "Poultry", verified: "Chicken breast, peppers, coconut-based lemongrass basil sauce — no cream/dairy, no mammal (poultry only)", rating: 4.3, reviews: 700, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon Fresh", "Amazon"], nutrients: ["protein"] },
  ] },
  { category: "Vitamins & Supplements", items: [
    { name: "Blood Builder Iron + Vitamin C (60 Tablets)", brand: "MegaFood", asin: "B0001532T0", diet: "Vegan", verified: "Veggie tablet — gelatin-free, dairy-free; ~26 mg whole-food iron + vitamin C & beetroot", rating: 4.6, reviews: 31000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon", "Amazon Fresh"], nutrients: ["iron", "vitamin-c"] },
    { name: "Iron 18 mg Ferrous Bisglycinate (Ferrochel), 120 Veg Capsules", brand: "NOW Foods", asin: "B000WQDD2O", diet: "Vegan", verified: "Veggie capsule — gelatin-free, dairy-free; 18 mg non-constipating iron bisglycinate", rating: 4.7, reviews: 9000, ratingSrc: "Amazon", stores: ["Amazon", "Whole Foods"], nutrients: ["iron"] },
    { name: "Gentle Iron 25 mg, 90 Vegetable Capsules", brand: "Solgar", asin: "B06XYVV5CW", diet: "Vegan", verified: "Veggie capsule — gelatin-free, dairy-free (listing states Vegan/Dairy-Free); 25 mg iron bisglycinate", rating: 4.7, reviews: 13000, ratingSrc: "Amazon", stores: ["Amazon", "Whole Foods"], nutrients: ["iron"] },
    { name: "Vitamin Code RAW Iron, 30 Vegan Capsules", brand: "Garden of Life", asin: "B00280M13O", diet: "Vegan", verified: "Veggie (cellulose) capsule — gelatin-free, dairy-free; 22 mg whole-food iron + C, B12 & folate", rating: 4.6, reviews: 5000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon"], nutrients: ["iron", "vitamin-c", "b12"] },
    { name: "Calcium Citrate with Vitamin D, 240 Veg Capsules", brand: "NOW Foods", asin: "B00024D786", diet: "Vegan", verified: "Veggie capsule — gelatin-free, dairy-free; calcium citrate + vitamin D & trace minerals", rating: 4.7, reviews: 7000, ratingSrc: "Amazon", stores: ["Amazon", "Whole Foods"], nutrients: ["calcium", "vitamin-d"] },
    { name: "mykind Organics Plant Calcium with D3 & K2, 90 Vegan Tablets", brand: "Garden of Life", asin: "B00K5NEKLC", diet: "Vegan", verified: "Vegan tablet — gelatin-free, dairy-free; whole-food/algae calcium + vegan D3 & K2", rating: 4.6, reviews: 1600, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon"], nutrients: ["calcium", "vitamin-d"] },
    { name: "Vegan Vitamin D3 2500 IU (Vitashine, lichen), 60 Veggie Caps", brand: "Doctor's Best", asin: "B00E816ROU", diet: "Vegan", verified: "Veggie capsule — gelatin-free, dairy-free; plant/lichen-sourced D3 (cholecalciferol)", rating: 4.6, reviews: 2600, ratingSrc: "Amazon", stores: ["Amazon"], nutrients: ["vitamin-d"] },
    { name: "Algae Omega, 60 Soft Gels (715 mg EPA+DHA)", brand: "Nordic Naturals", asin: "B0096M62O6", diet: "Vegan", verified: "Certified-vegan softgel — gelatin-free, dairy-free; algae-oil EPA+DHA (no fish, no mammal)", rating: 4.6, reviews: 7000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon"], nutrients: ["omega-3"] },
    { name: "Vegan Algae Omega-3, 60 Vegetarian Softgels (500 mg)", brand: "Ovega-3", asin: "B004LL7AXE", diet: "Vegan", verified: "Vegetarian (carrageenan) softgel — gelatin-free, dairy-free; algal 135 mg EPA + 270 mg DHA", rating: 4.5, reviews: 2000, ratingSrc: "Amazon", stores: ["Amazon", "Whole Foods"], nutrients: ["omega-3"] },
    { name: "Methyl B-12 (Methylcobalamin) 1,000 mcg, 100 Lozenges", brand: "NOW Foods", asin: "B001F0R7VE", diet: "Vegan", verified: "Dissolvable lozenge — gelatin-free, dairy-free; methylcobalamin B12", rating: 4.8, reviews: 13000, ratingSrc: "Amazon", stores: ["Amazon", "Whole Foods"], nutrients: ["b12"] },
    { name: "mykind Organics Women's Once Daily Multivitamin, 60 Vegan Tablets", brand: "Garden of Life", asin: "B00K5NEMJM", diet: "Vegan", verified: "Vegan whole-food tablet — gelatin-free, dairy-free; multi with iron, C, D3, B12, biotin", rating: 4.6, reviews: 4000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon"], nutrients: ["multivitamin", "iron", "vitamin-c", "vitamin-d", "b12"] },
    { name: "Essential for Women 18+ Multivitamin, 60 Capsules", brand: "Ritual", asin: "B09W35DHLH", diet: "Vegan", verified: "Vegan delayed-release capsule — gelatin-free, dairy-free; USP-verified, incl. algal D3, B12 & omega-3 DHA", rating: 4.3, reviews: 9000, ratingSrc: "Amazon", stores: ["Amazon"], nutrients: ["multivitamin", "vitamin-d", "b12", "omega-3"] },
    { name: "Women's One Daily Multivitamin, 90 Tablets", brand: "MegaFood", asin: "B00014HFV2", diet: "Vegetarian", verified: "Vegetarian whole-food tablet — gelatin-free, dairy-free (made without milk); C, D, iron & B vitamins", rating: 4.7, reviews: 2000, ratingSrc: "Amazon", stores: ["Whole Foods", "Amazon"], nutrients: ["multivitamin", "iron", "vitamin-c", "vitamin-d"] },
  ] },
];
// ---------------------------------------------------------------------------
// MEAL-PREP & DELIVERY SERVICES (populated by research). Weekly plans of
// dairy-free & mammal-free meals — prepared, plant-based, or cook-at-home kits.
// ---------------------------------------------------------------------------

const PREP_SERVICES = [
  { category: "Plant-based (mammal-free by default)", services: [
    { name: "Mosaic Foods", type: "Plant-based", note: "frozen ready-to-heat plant-based bowls & family meals — no mammal, no dairy; choose protein-forward bowls (lentil, chickpea, tofu)", rating: 4.0, reviews: 1093, ratingSrc: "Trustpilot", url: "https://www.mosaicfoods.com", tags: ["Plant-based","Dairy-free option","High-protein","Organic"], watchOut: "fully vegan, so no animal traps; just verify plant-milk sauces if avoiding coconut", deliversTo: "Nationwide" },
    { name: "Thistle", type: "Plant-based", note: "fresh ready-to-eat plant-forward meals, all gluten-free AND dairy-free by default; poultry/salmon add-ons if she wants more protein", rating: 4.0, reviews: 1000, ratingSrc: "Trustpilot", url: "https://www.thistle.co", tags: ["Plant-based","Dairy-free option","Pescatarian","Gluten-free","Organic"], watchOut: "opt-in proteins are fish/poultry only — never mammal; core menu is fully plant-based", deliversTo: "Bay Area" },
    { name: "Purple Carrot", type: "Plant-based", note: "100% plant-based kits + prepared items — naturally mammal-free and dairy-free; pick higher-protein tofu/tempeh/legume bowls for iron", rating: 4.1, reviews: 5000, ratingSrc: "App Store", url: "https://www.purplecarrot.com", tags: ["Plant-based","Dairy-free option","High-protein"], watchOut: "cook-at-home — just don't add your own butter/cheese; confirm no honey if strict", deliversTo: "Nationwide" },
    { name: "Veestro", type: "Plant-based", note: "fully prepared frozen vegan entrées — 100% plant-based, naturally mammal-free & dairy-free; lots of higher-protein plates", rating: 3.6, reviews: 300, ratingSrc: "Trustpilot", url: "https://www.veestro.com", tags: ["Plant-based","Dairy-free option","High-protein"], watchOut: "all vegan — no animal traps; just skip if you dislike frozen texture", deliversTo: "Nationwide" },
    { name: "Splendid Spoon", type: "Plant-based", note: "ready-to-eat vegan smoothies, grain bowls & soups — no mammal, no dairy; grain/lentil bowls give the most protein", rating: 4.0, reviews: 162, ratingSrc: "Trustpilot", url: "https://www.splendidspoon.com", tags: ["Plant-based","Dairy-free option","Gluten-free"], watchOut: "smoothie-heavy menu is light on protein — lean on the bowls", deliversTo: "Nationwide" },
    { name: "Sakara Life", type: "Plant-based", note: "premium organic ready-to-eat plant-based program — fully mammal-free & dairy-free; clean but plan extra protein", rating: 3.8, reviews: 250, ratingSrc: "Trustpilot", url: "https://www.sakara.com", tags: ["Plant-based","Dairy-free option","Organic","Gluten-free"], watchOut: "expensive and lower-calorie/protein — not a standalone if she needs iron/protein volume", deliversTo: "Nationwide" },
    { name: "Daily Harvest", type: "Plant-based", note: "frozen smoothies, harvest bowls, flatbreads & soups — entirely plant-based, so no mammal or dairy; pair bowls for a full meal", rating: 2.9, reviews: 1368, ratingSrc: "Trustpilot", url: "https://www.daily-harvest.com", tags: ["Plant-based","Dairy-free option","Organic","Gluten-free"], watchOut: "lower protein per item — bulk up with add-ins; the low rating is delivery/service, not ingredients", deliversTo: "Nationwide" },
  ] },
  { category: "Prepared meals (ready to heat)", services: [
    { name: "Trifecta", type: "Prepared", note: "prepared clean meals — order the Classic chicken/salmon plates or the plant-based line; both avoid dairy, just skip beef/bison", rating: 4.3, reviews: 5000, ratingSrc: "App Store", url: "https://www.trifectanutrition.com", tags: ["Dairy-free option","Pescatarian","Chicken option","High-protein","Gluten-free","Organic"], watchOut: "menu includes beef/steak à la carte — select chicken/fish/veg; the plant-based line is safest", deliversTo: "Nationwide (from Sacramento)" },
    { name: "CookUnity", type: "Prepared", note: "chef-prepared meals with a Non-Dairy Preferred and pescatarian filter — choose chicken/fish/plant dishes, avoid mammal proteins", rating: 4.0, reviews: 16000, ratingSrc: "Trustpilot", url: "https://www.cookunity.com", tags: ["Dairy-free option","Pescatarian","Chicken option","High-protein"], watchOut: "chef menus rotate and often use butter/parmesan finishes — verify each meal's allergen list every week", deliversTo: "Bay Area" },
    { name: "Fresh N Lean", type: "Prepared", note: "dedicated Whole30, Paleo (dairy-free) & Plant-Based menus — choose plant-based or chicken/fish; avoid the beef entrées", rating: 3.9, reviews: 5000, ratingSrc: "Trustpilot", url: "https://www.freshnlean.com", tags: ["Dairy-free option","Pescatarian","Chicken option","High-protein","Gluten-free","Plant-based"], watchOut: "Protein/Bulk plans feature beef and pork — stick to Plant-Based or Paleo poultry/fish dishes", deliversTo: "Nationwide" },
    { name: "Factor", type: "Prepared", note: "fully prepared heat-and-eat meals — filter to dairy-free and pick chicken/fish/veg; skip all beef/pork plates and cream/cheese sauces", rating: 3.9, reviews: 70000, ratingSrc: "Trustpilot", url: "https://www.factor75.com", tags: ["Dairy-free option","Pescatarian","Chicken option","High-protein","Gluten-free"], watchOut: "many dishes hide cheese/cream/butter and lots are beef/pork — read each label, don't trust the filter alone", deliversTo: "Nationwide" },
  ] },
  { category: "Meal kits (cook at home)", services: [
    { name: "Gobble", type: "Meal kit", note: "15-minute kits; filter to Pescatarian, Lean & Clean and Vegetarian recipes with chicken/salmon/shrimp, and omit the cream or cheese the dish adds", rating: 4.6, reviews: 3000, ratingSrc: "Trustpilot", url: "https://www.gobble.com", tags: ["Pescatarian","Chicken option","Dairy-free option"], watchOut: "pre-made sauces often contain cream or butter — check each sauce since prep is pre-portioned", deliversTo: "Nationwide" },
    { name: "Home Chef", type: "Meal kit", note: "use 'Customize It' to choose chicken or salmon and filter Calorie/Carb-Conscious; pick poultry/fish/veg dishes and omit the cheese or butter packet", rating: 4.4, reviews: 12000, ratingSrc: "Trustpilot", url: "https://www.homechef.com", tags: ["Chicken option","Pescatarian","Dairy-free option","Budget"], watchOut: "dairy is common (cheese, cream, butter) and not every dish has a dairy-free swap — read labels", deliversTo: "Nationwide" },
    { name: "HelloFresh", type: "Meal kit", note: "use the Veggie/Pescatarian filters plus the dairy-free allergen filter; pick chicken, shrimp or salmon recipes and leave out any cheese/cream sachet", rating: 4.3, reviews: 40000, ratingSrc: "Trustpilot", url: "https://www.hellofresh.com", tags: ["Pescatarian","Chicken option","Dairy-free option","Budget"], watchOut: "shared-facility processing and frequent cheese/cream add-ins — verify each recipe's allergen note", deliversTo: "Nationwide" },
    { name: "Blue Apron", type: "Meal kit", note: "filter to Vegetarian and Pescatarian recipes and choose chicken/seafood; skip beef, pork & lamb and leave out the cheese or crème fraîche bundled", rating: 4.1, reviews: 5732, ratingSrc: "Trustpilot", url: "https://www.blueapron.com", tags: ["Pescatarian","Chicken option","Dairy-free option"], watchOut: "cheese/butter appears in most recipes — no dairy-free filter, so check each ingredient list", deliversTo: "Nationwide" },
    { name: "Green Chef", type: "Meal kit", note: "choose the Plant-Based, Mediterranean or Gluten-Free plans; recipes are clearly labeled dairy-free / plant-based with chicken & fish options — avoid keto beef/pork", rating: 4.0, reviews: 4885, ratingSrc: "Trustpilot", url: "https://www.greenchef.com", tags: ["Plant-based","Dairy-free option","Pescatarian","Chicken option","Gluten-free","Organic"], watchOut: "some 'dairy-free' meals still add feta or a cream sauce as an optional finish — confirm the per-recipe allergen list", deliversTo: "Nationwide" },
    { name: "Sunbasket", type: "Meal kit", note: "filter to Pescatarian, Paleo, Gluten-Free & Diabetes-Friendly; lots of wild salmon, cod, shrimp & chicken recipes — pick those and skip beef/pork/lamb", rating: 3.9, reviews: 3500, ratingSrc: "Trustpilot", url: "https://www.sunbasket.com", tags: ["Pescatarian","Chicken option","Dairy-free option","Organic","Gluten-free"], watchOut: "many recipes ship a cheese, yogurt or cream packet — set it aside and read every ingredient card", deliversTo: "Nationwide" },
    { name: "EveryPlate", type: "Meal kit", note: "cheapest option (HelloFresh-owned); pick chicken and veggie recipes and skip beef/pork and any cheese sachet", rating: 4.0, reviews: 8000, ratingSrc: "Trustpilot", url: "https://www.everyplate.com", tags: ["Chicken option","Pescatarian","Dairy-free option","Budget"], watchOut: "no dietary filters — scan each recipe manually for mammal meat and dairy", deliversTo: "Nationwide" },
    { name: "Marley Spoon", type: "Meal kit", note: "filter to Vegetarian, Pescatarian and Health tags; pick chicken and fish recipes and omit any cheese or yogurt included", rating: 3.8, reviews: 2500, ratingSrc: "Trustpilot", url: "https://marleyspoon.com", tags: ["Pescatarian","Chicken option","Dairy-free option","Gluten-free"], watchOut: "no true dairy-free filter and cream/cheese are frequent — read the per-recipe allergens weekly", deliversTo: "Nationwide" },
    { name: "Dinnerly", type: "Meal kit", note: "budget sister of Marley Spoon — filter to Veggie and low-cost chicken/fish recipes and leave out the cheese packet where included", rating: 3.8, reviews: 1500, ratingSrc: "Trustpilot", url: "https://dinnerly.com", tags: ["Pescatarian","Chicken option","Dairy-free option","Budget"], watchOut: "minimal packaging means fewer printed allergen details — check ingredients online before cooking", deliversTo: "Nationwide" },
  ] },
  { category: "Bay Area & local", services: [
    { name: "Methodology", type: "Prepared", note: "Bay Area prepared meals with no gluten, dairy or refined sugar in any dish — select the poultry/fish or vegan options, skip mammal proteins", rating: 4.4, reviews: 200, ratingSrc: "Google", url: "https://www.gomethodology.com", tags: ["Dairy-free option","Pescatarian","Chicken option","Gluten-free","Plant-based","Organic","Local"], watchOut: "dairy-free across the board — just avoid any beef/pork/lamb entrées on the weekly rotating menu", deliversTo: "San Francisco, Peninsula & Bay Area" },
    { name: "Trader Joe's Ready Meals", type: "Grocery prepared", note: "refrigerated ready-to-heat entrées & salads at Peninsula stores; choose the clearly-labeled dairy-free chicken, fish and plant-based options", rating: 4.5, reviews: 3000, ratingSrc: "Google", url: "https://www.traderjoes.com", tags: ["Chicken option","Pescatarian","Dairy-free option","Plant-based","Gluten-free","Local"], watchOut: "many prepared items contain milk/butter/cheese or beef/pork — read the allergen panel on every package", deliversTo: "Peninsula stores (Palo Alto, Mountain View, Menlo Park, Los Altos)" },
    { name: "Whole Foods Prepared Foods", type: "Grocery prepared", note: "hot/cold bars & grab-and-go at Palo Alto, Mountain View & Los Altos; take roasted/grilled chicken, salmon and dressed veg/grain sides", rating: 4.3, reviews: 2500, ratingSrc: "Google", url: "https://www.wholefoodsmarket.com", tags: ["Chicken option","Pescatarian","Dairy-free option","Plant-based","Organic","Local"], watchOut: "shared utensils and butter/cheese/cream on many items — ask staff to check labels and avoid buttered sides", deliversTo: "Peninsula stores + Amazon/Prime delivery" },
    { name: "Territory Foods", type: "Prepared", note: "every meal is gluten-free AND dairy-free by default, cooked in local Bay Area kitchens — filter out beef/pork and pick chicken/fish/veg", rating: 4.0, reviews: 300, ratingSrc: "Google", url: "https://www.territoryfoods.com", tags: ["Dairy-free option","Pescatarian","Chicken option","Gluten-free","High-protein","Organic","Local"], watchOut: "dairy is already excluded, so the only trap is mammal meat — use the 'avoid ingredients' filter for beef/pork/lamb", deliversTo: "Bay Area home delivery + Peninsula pickup points" },
    { name: "Pete's Real Food (Pete's Paleo)", type: "Prepared", note: "every meal is 100% dairy-free, gluten-free & soy-free paleo; order the Mediterranean/balsamic chicken and fish dishes, ready to heat", rating: 3.8, reviews: 110, ratingSrc: "Trustpilot", url: "https://www.petesrealfood.com", tags: ["Dairy-free option","Paleo","Chicken option","Pescatarian","Gluten-free","Organic"], watchOut: "paleo menus lean on beef/pork and use lard/tallow — filter to poultry/fish-only meals and check the fat used", deliversTo: "Bay Area & Peninsula (ships nationwide)" },
    { name: "Model Meals", type: "Prepared", note: "California Whole30/Paleo service that is entirely dairy-free; choose the chicken and seafood entrées from the weekly rotating menu", rating: 4.0, reviews: 80, ratingSrc: "Google", url: "https://www.modelmeals.com", tags: ["Dairy-free option","Paleo","Chicken option","Pescatarian","Gluten-free","Organic"], watchOut: "Whole30 menu features beef/pork and may use tallow/lard — restrict to poultry/fish meals and verify cooking fat", deliversTo: "California incl. Bay Area & Peninsula" },
    { name: "The Good Kitchen", type: "Prepared", note: "heat-and-eat meals with clear dairy-free labels and strong Paleo/Whole30 coverage — filter to the dairy-free chicken and fish dishes", rating: 3.6, reviews: 90, ratingSrc: "Trustpilot", url: "https://www.thegoodkitchen.com", tags: ["Dairy-free option","Paleo","Chicken option","Pescatarian","Gluten-free","Organic"], watchOut: "network of chefs also cooks grass-fed beef/pork — use the dairy-free filter and pick poultry/seafood only", deliversTo: "Bay Area & Peninsula (ships nationwide)" },
    { name: "MealPro", type: "Prepared", note: "San Jose-based; build meals with chicken, white fish or plant protein and heat vacuum-sealed portions — skip beef/pork picks", rating: 3.8, reviews: 90, ratingSrc: "Yelp", url: "https://www.mealpro.net", tags: ["Pescatarian","Chicken option","Dairy-free option","Paleo","Local"], watchOut: "menu includes red-meat proteins; customize each meal to poultry/fish/veg and confirm no dairy-based sauces", deliversTo: "San Jose, Sunnyvale, Bay Area & Peninsula" },
    { name: "Jessie & Laurent", type: "Prepared", note: "long-running Bay Area chef service; order the dairy-free/gluten-free chicken, fish or veggie dishes, delivered chilled and ready to heat, no subscription", rating: 4.0, reviews: 84, ratingSrc: "Yelp", url: "https://jessieandlaurent.com", tags: ["Dairy-free option","Pescatarian","Chicken option","Gluten-free","Organic","Local"], watchOut: "kitchen is not certified allergen-free and menu includes beef/pork — request mammal-free + no-dairy modifications", deliversTo: "Greater Bay Area & Peninsula" },
  ] },
];

if (typeof module !== "undefined") {
  module.exports = { RULES, ORDER_MENU, HOURS, SEASONS, NUTRITION, GROCERY, GROCERY_ITEMS, PREP_SERVICES, FACTS };
}
