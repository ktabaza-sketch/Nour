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

// Structure: meal type -> categories -> restaurants -> safe dishes + DoorDash link.
// urlType "store" = a verified DoorDash store page; "search" = opens DoorDash
// search pre-filled with the restaurant name (lands on the right store once
// signed in with a delivery address). Menus change — confirm mammal-free when ordering.
const ORDER_MENU = {
  breakfast: [
    {
      category: "Cafés & bakeries",
      restaurants: [
        { name: "Hatched", area: "Palo Alto", safeDishes: [
          { dish: "Avocado toast", note: "plant-based; add an egg" },
          { dish: "Egg & cheese sandwich, no meat", note: "order without bacon/sausage (dairy)" },
          { dish: "Garden / veggie salad", note: "verify no bacon bits" },
        ], watchOut: "egg sandwiches default to bacon, ham or sausage — order without cured pork" },
        { name: "Philz Coffee", area: "Palo Alto", safeDishes: [
          { dish: "Any coffee or tea drink", note: "oat or dairy milk (dairy if not oat)" },
          { dish: "Bakery pastries & croissants", note: "butter-based, no lard (dairy)" },
        ], watchOut: "skip breakfast wraps/sandwiches that come with bacon or sausage" },
        { name: "Peet's Coffee", area: "Palo Alto", safeDishes: [
          { dish: "Oatmeal", note: "milk = dairy; verify no meat topping" },
          { dish: "Banana or pumpkin bread", note: "plant-forward loaf" },
          { dish: "Coffee & espresso drinks", note: "dairy if made with milk" },
        ], watchOut: "avoid the bacon/sausage/ham breakfast sandwiches" },
        { name: "Cafe Borrone", area: "Menlo Park", safeDishes: [
          { dish: "Mushroom scramble", note: "mushrooms, shallots, crème fraîche (dairy)" },
          { dish: "Spinach & feta scramble", note: "(dairy)" },
          { dish: "Salsa & avocado scramble", note: "eggs, salsa, sour cream, avocado (dairy)" },
        ], watchOut: "skip the ham & cheddar scramble and any ham/bacon add-ons" },
      ],
    },
    {
      category: "American breakfast",
      restaurants: [
        { name: "Hobee's", area: "Palo Alto", safeDishes: [
          { dish: "Veggie omelet or scramble", note: "no meat; cheese = dairy" },
          { dish: "Breakfast quesadilla, no meat", note: "egg & cheese (dairy)" },
          { dish: "Blueberry coffee cake", note: "no mammal fat" },
        ], watchOut: "scrambles and bowls often add bacon, sausage or ham — specify none" },
        { name: "Palo Alto Creamery", area: "Palo Alto", safeDishes: [
          { dish: "Two eggs any style", note: "pick a no-meat side (dairy: buttered toast)" },
          { dish: "Buttermilk pancakes", note: "(dairy)" },
          { dish: "Fresh fruit bowl", note: "plant-based" },
        ], watchOut: "ham/bacon/sausage are default egg-plate sides and hide in scrambles & benedicts" },
        { name: "Stacks", area: "Menlo Park", safeDishes: [
          { dish: "Veggie omelet, no meat", note: "mushrooms, spinach, tomato, cheese (dairy)" },
          { dish: "Pancakes / waffles / French toast", note: "(dairy)" },
          { dish: "Egg-white veggie plate", note: "verify no meat side" },
        ], watchOut: "skillets, benedicts and combos load bacon, sausage, ham and chorizo — order meat-free" },
        { name: "True Food Kitchen", area: "Palo Alto", safeDishes: [
          { dish: "Garden scramble", note: "eggs with vegetables" },
          { dish: "Avocado toast", note: "plant-based" },
          { dish: "Chia seed pudding", note: "coconut-based, plant" },
        ], watchOut: "order any breakfast 'sausage' off; avoid dishes with chorizo" },
        { name: "Joanie's Cafe", area: "Palo Alto", safeDishes: [
          { dish: "Omelette or scramble, no meat", note: "veggie + cheese (dairy)" },
          { dish: "French toast", note: "(dairy)" },
          { dish: "Crab cakes", note: "shellfish — safe" },
        ], watchOut: "bacon, ham and sausage on egg plates and benedicts — leave off" },
      ],
    },
    {
      category: "Bagels",
      restaurants: [
        { name: "Izzy's Brooklyn Bagels", area: "Palo Alto", safeDishes: [
          { dish: "Bagel with cream cheese", note: "(dairy)" },
          { dish: "Lox / Nova bagel", note: "smoked salmon — safe" },
          { dish: "Egg & cheese bagel, no meat", note: "(dairy)" },
          { dish: "Tuna or whitefish salad bagel", note: "fish — safe" },
        ], watchOut: "kosher (no pork) but AGS still bans beef — skip pastrami, corned beef and beef salami" },
        { name: "House of Bagels", area: "Mountain View", safeDishes: [
          { dish: "Bagel with cream cheese", note: "(dairy)" },
          { dish: "Lox bagel", note: "smoked salmon — safe" },
          { dish: "Tuna or egg-salad bagel", note: "safe" },
        ], watchOut: "avoid bacon/sausage/ham breakfast bagel sandwiches" },
      ],
    },
    {
      category: "Mexican breakfast",
      restaurants: [
        { name: "Sancho's Taqueria", area: "Palo Alto", safeDishes: [
          { dish: "Egg & potato breakfast burrito", note: "no chorizo/bacon; add chicken (dairy if cheese)" },
          { dish: "Chilaquiles with egg", note: "no carnitas/chorizo (dairy)" },
          { dish: "Fish taco", note: "safe" },
        ], watchOut: "chorizo, carnitas, al pastor and carne asada are all mammal — egg/chicken/fish only" },
        { name: "Las Chiquitas", area: "Redwood City", safeDishes: [
          { dish: "Egg & potato breakfast burrito", note: "no chorizo/bacon (dairy if cheese)" },
          { dish: "Chilaquiles with egg", note: "no carnitas/chorizo (dairy)" },
          { dish: "Veggie quesadilla", note: "(dairy)" },
        ], watchOut: "skip chorizo, carnitas, machaca (beef), al pastor and asada" },
      ],
    },
    {
      category: "Açaí & smoothie bowls",
      restaurants: [
        { name: "Vitality Bowls", area: "Palo Alto", safeDishes: [
          { dish: "Açaí bowls", note: "plant-based" },
          { dish: "Fruit & green smoothies", note: "plant-based" },
          { dish: "Avocado toast", note: "plant-based" },
        ], watchOut: "essentially none — all plant/fruit; add-on chicken is also AGS-safe" },
        { name: "Pressed Açaí Bowls", area: "Palo Alto", safeDishes: [
          { dish: "Açaí bowls with granola & fruit", note: "plant-based" },
          { dish: "Cold-pressed juices & smoothies", note: "plant-based" },
        ], watchOut: "none — plant/fruit based, no mammal ingredients" },
      ],
    },
  ],

  lightLunch: [
    {
      category: "Salads & bowls",
      restaurants: [
        { name: "Sweetgreen", area: "Palo Alto", safeDishes: [
          { dish: "Harvest Bowl", note: "roasted chicken, wild rice, sweet potato, almonds (dairy: goat cheese)" },
          { dish: "Kale Caesar with roasted chicken", note: "(dairy: parmesan)" },
          { dish: "Create-your-own with tofu or blackened chicken", note: "" },
        ], watchOut: "no beef/pork/lamb here — just skip any seasonal steak add-on" },
        { name: "True Food Kitchen", area: "Palo Alto", safeDishes: [
          { dish: "Ancient Grains Bowl", note: "vegetarian; sweet potato, portobello, avocado" },
          { dish: "Tuscan Kale Salad + grilled chicken", note: "(dairy: parmesan)" },
          { dish: "Edamame dumplings", note: "" },
        ], watchOut: "avoid grass-fed steak tacos, bison burger, and prosciutto pizza" },
      ],
    },
    {
      category: "Poke",
      restaurants: [
        { name: "Go Fish Poke Bar", area: "Palo Alto", safeDishes: [
          { dish: "Ahi tuna poke bowl", note: "" },
          { dish: "Salmon poke bowl", note: "" },
          { dish: "Build-your-own: tuna/salmon/shrimp/tofu", note: "" },
        ], watchOut: "essentially none — fish/shellfish/tofu; just avoid any Spam add-on (pork)" },
        { name: "Poke House", area: "Palo Alto", safeDishes: [
          { dish: "Signature tuna poke bowl", note: "" },
          { dish: "Salmon or spicy tuna bowl", note: "" },
          { dish: "Build-your-own with shrimp or tofu", note: "" },
        ], watchOut: "no mammal meat on poke menus; skip any Spam musubi" },
        { name: "Poke One", area: "Palo Alto", safeDishes: [
          { dish: "Build-your-own with ahi tuna", note: "" },
          { dish: "Salmon poke bowl", note: "" },
          { dish: "Tofu poke bowl", note: "vegan" },
        ], watchOut: "none significant — fish/shellfish/tofu only" },
      ],
    },
    {
      category: "Sandwiches & wraps",
      restaurants: [
        { name: "Mendocino Farms", area: "Palo Alto", safeDishes: [
          { dish: "Not So Fried Chicken Sandwich", note: "crispy chicken, herb aioli, slaw" },
          { dish: "Vegan Curried Couscous salad", note: "vegan" },
          { dish: "Modern Caesar + chicken", note: "(dairy: parmesan)" },
          { dish: "Skinny James salad", note: "greens, hearts of palm, edamame, avocado" },
        ], watchOut: "avoid Prosciutto & Chèvre, Peruvian steak, pork carnitas, and anything with bacon" },
        { name: "Ike's Love & Sandwiches", area: "Palo Alto", safeDishes: [
          { dish: "Halal chicken sandwiches", note: "confirm no bacon add-on" },
          { dish: "Wild salmon sandwich", note: "" },
          { dish: "Vegetarian / vegan sandwiches", note: "many options" },
        ], watchOut: "huge menu — many builds have pastrami, ham, beef meatballs or bacon; read each carefully (often dairy cheese too)" },
      ],
    },
    {
      category: "Mediterranean",
      restaurants: [
        { name: "CAVA", area: "Palo Alto", safeDishes: [
          { dish: "Build-your-own bowl with harissa honey chicken", note: "" },
          { dish: "Grilled chicken + falafel bowl", note: "over greens or grains" },
          { dish: "Falafel + hummus bowl", note: "vegetarian (dairy: feta)" },
        ], watchOut: "skip grilled steak and braised lamb; tzatziki/feta = dairy" },
        { name: "Oren's Hummus", area: "Palo Alto", safeDishes: [
          { dish: "Hummus with chicken shishlik", note: "" },
          { dish: "Falafel plate / hummus with falafel", note: "" },
          { dish: "Israeli salad", note: "" },
          { dish: "Hummus with fava beans (ful)", note: "" },
        ], watchOut: "avoid beef/lamb kebab & skewers, merguez sausage, and beef/lamb shawarma" },
      ],
    },
    {
      category: "Cafés & light bites",
      restaurants: [
        { name: "Blue Bottle Coffee", area: "Palo Alto", safeDishes: [
          { dish: "Coffee, cold brew, lattes", note: "dairy if milk" },
          { dish: "Pastries (croissant, cookies, waffle)", note: "" },
          { dish: "Seasonal veggie or egg toast", note: "confirm no prosciutto/ham" },
        ], watchOut: "any breakfast toast could carry ham/prosciutto — verify; drinks and pastries are safe" },
      ],
    },
    {
      category: "Smoothies & açaí bowls",
      restaurants: [
        { name: "BARE Bowls", area: "Palo Alto", safeDishes: [
          { dish: "Açaí bowl with granola, banana, berries", note: "" },
          { dish: "Fruit smoothies", note: "" },
        ], watchOut: "none — fully plant-based, no mammal ingredients" },
      ],
    },
  ],

  dinner: [
    {
      category: "Mexican",
      restaurants: [
        { name: "Chipotle", area: "Palo Alto", safeDishes: [
          { dish: "Chicken burrito bowl", note: "chicken + black/pinto beans (Chipotle beans are lard-free)" },
          { dish: "Sofritas bowl", note: "tofu, vegan" },
          { dish: "Chicken salad", note: "skip cheese/sour cream to avoid dairy" },
          { dish: "Chips & guacamole", note: "vegan" },
        ], watchOut: "barbacoa & steak (beef), carnitas (pork) are mammal — pick chicken or sofritas; queso/sour cream = dairy" },
        { name: "LuLu's Mexican Food", area: "Palo Alto", safeDishes: [
          { dish: "Chicken super burrito", note: "ask for whole or black beans, not refried" },
          { dish: "Fish taco", note: "" },
          { dish: "Shrimp taco", note: "" },
          { dish: "Veggie burrito", note: "no-lard beans" },
        ], watchOut: "carne asada, al pastor, carnitas, chorizo = avoid; refried beans may have lard; cheese/crema = dairy" },
        { name: "Sancho's Taqueria", area: "Palo Alto", safeDishes: [
          { dish: "Fish taco", note: "" },
          { dish: "Chicken super burrito", note: "whole/black beans, not refried" },
          { dish: "Shrimp burrito", note: "" },
          { dish: "Veggie burrito", note: "" },
        ], watchOut: "carne asada, al pastor, carnitas = avoid; ask about lard in refried beans; sour cream/cheese = dairy" },
      ],
    },
    {
      category: "Mediterranean & Middle Eastern",
      restaurants: [
        { name: "Real Mediterranean Kitchen", area: "Palo Alto", safeDishes: [
          { dish: "Chicken kebob plate", note: "" },
          { dish: "Falafel plate", note: "vegan" },
          { dish: "Chicken shawarma", note: "" },
          { dish: "Hummus", note: "" },
        ], watchOut: "lamb/beef gyro and beef kofta = avoid; tzatziki and feta = dairy" },
        { name: "Mediterranean Wraps", area: "Palo Alto", safeDishes: [
          { dish: "Chicken shawarma wrap", note: "" },
          { dish: "Chicken shawarma plate", note: "" },
          { dish: "Falafel wrap", note: "vegan" },
          { dish: "Hummus", note: "" },
        ], watchOut: "beef/lamb shawarma and gyro = avoid; feta/tzatziki = dairy" },
        { name: "Yalla Falafel", area: "Palo Alto", safeDishes: [
          { dish: "Falafel pita", note: "vegan" },
          { dish: "Shawarma-spiced chicken pita", note: "" },
          { dish: "Hummus", note: "" },
        ], watchOut: "any lamb/beef preparation = avoid; feta = dairy" },
        { name: "The Halal Guys", area: "Redwood City", safeDishes: [
          { dish: "Chicken over rice", note: "" },
          { dish: "Falafel sandwich", note: "vegan" },
          { dish: "Chicken gyro sandwich", note: "confirm chicken, not beef" },
          { dish: "Hummus", note: "" },
        ], watchOut: "the beef/lamb gyro combo = avoid; white sauce may contain dairy" },
      ],
    },
    {
      category: "Thai",
      restaurants: [
        { name: "Thaiphoon", area: "Palo Alto", safeDishes: [
          { dish: "Chicken satay", note: "peanut sauce" },
          { dish: "Chicken pad thai", note: "or shrimp / tofu" },
          { dish: "Green curry", note: "chicken or tofu (coconut base)" },
          { dish: "Tom yum goong", note: "shrimp, spicy sour broth" },
        ], watchOut: "avoid pork/beef dishes (pad krapow moo, beef panang) and pork larb" },
        { name: "Lotus Thai Bistro", area: "Palo Alto", safeDishes: [
          { dish: "Pad thai", note: "chicken, tofu, or shrimp" },
          { dish: "Cashew nut chicken", note: "" },
          { dish: "Red or green curry", note: "chicken or tofu" },
          { dish: "Basil chicken (pad krapow gai)", note: "" },
        ], watchOut: "skip pork (moo) or beef (nuea) versions; order larb gai (chicken), not pork larb" },
        { name: "Siam Fine Thai Cuisine", area: "Palo Alto", safeDishes: [
          { dish: "Chicken satay", note: "" },
          { dish: "Green curry with chicken", note: "or tofu" },
          { dish: "Pad see ew with chicken", note: "" },
          { dish: "Tom yum goong", note: "shrimp" },
        ], watchOut: "avoid beef/pork curries and stir-fries; confirm no pork in fried rice" },
        { name: "Indochine Thai & Vietnamese", area: "Palo Alto", safeDishes: [
          { dish: "Pho ga", note: "chicken-broth version only" },
          { dish: "Lemongrass chicken", note: "" },
          { dish: "Green curry", note: "chicken or tofu" },
          { dish: "Chicken pad thai", note: "" },
        ], watchOut: "regular pho & bun bo hue use BEEF broth — avoid; only pho ga is broth-safe" },
      ],
    },
    {
      category: "Chinese",
      restaurants: [
        { name: "Chef Chu's", area: "Los Altos", safeDishes: [
          { dish: "Kung pao chicken", note: "" },
          { dish: "Cashew chicken", note: "" },
          { dish: "Salt & pepper prawns", note: "" },
          { dish: "Whole steamed fish", note: "" },
        ], watchOut: "avoid Mongolian beef, black pepper steak, the pork section and char siu; some fried rice/soups use pork or ham" },
        { name: "Tai Pan", area: "Palo Alto", safeDishes: [
          { dish: "Kung pao chicken", note: "" },
          { dish: "Salt & pepper prawns", note: "" },
          { dish: "Steamed fresh fish", note: "" },
          { dish: "Sautéed string beans", note: "ask for no pork" },
        ], watchOut: "siu mai, BBQ pork buns, char siu are pork; avoid beef; request chicken or shrimp fried rice (some has ham)" },
        { name: "Panda Express", area: "Palo Alto", safeDishes: [
          { dish: "Grilled teriyaki chicken", note: "" },
          { dish: "Mushroom chicken", note: "" },
          { dish: "String bean chicken breast", note: "" },
          { dish: "Kung pao chicken", note: "" },
          { dish: "Super greens + steamed rice", note: "plant sides" },
        ], watchOut: "avoid Beijing beef, broccoli beef, black pepper Angus steak, and BBQ pork (char siu)" },
        { name: "Asian Box", area: "Palo Alto", safeDishes: [
          { dish: "Box: lemongrass chicken", note: "over rice or noodles + veggies" },
          { dish: "Box: tofu", note: "" },
          { dish: "Box: wok'd shrimp", note: "" },
        ], watchOut: "proteins are chicken/tofu/shrimp — just skip any pork add-on and confirm sauces" },
      ],
    },
    {
      category: "Japanese & sushi",
      restaurants: [
        { name: "Fuki Sushi", area: "Palo Alto", safeDishes: [
          { dish: "Nigiri & sashimi", note: "tuna, salmon, yellowtail, shrimp, eel" },
          { dish: "California roll", note: "" },
          { dish: "Spicy tuna roll", note: "" },
          { dish: "Chicken teriyaki", note: "" },
          { dish: "Agedashi tofu", note: "" },
        ], watchOut: "gyoza are usually pork; skip chashu and pork katsu — sushi, sashimi, chicken teriyaki, edamame are safe" },
        { name: "Kanji Sushi & Ramen", area: "Palo Alto", safeDishes: [
          { dish: "Sushi & sashimi", note: "fish / veg rolls" },
          { dish: "Chicken teriyaki", note: "" },
          { dish: "Chicken karaage", note: "fried chicken" },
          { dish: "Edamame", note: "" },
        ], watchOut: "tonkotsu ramen = pork bone broth (avoid) and most ramen tops with chashu pork — stick to sushi unless a chicken/veg broth is confirmed" },
        { name: "Taro San Japanese Noodle Bar", area: "Palo Alto", safeDishes: [
          { dish: "Chicken udon", note: "dashi (fish/kelp) broth" },
          { dish: "Tempura udon", note: "shrimp & vegetable tempura" },
          { dish: "Veggie udon", note: "dashi broth" },
        ], watchOut: "avoid niku udon (beef) and pork-topped bowls; udon dashi is bonito/kelp (safe), unlike ramen" },
      ],
    },
    {
      category: "Vietnamese",
      restaurants: [
        { name: "Pho To Chau", area: "Mountain View", safeDishes: [
          { dish: "Pho ga", note: "chicken-broth version only" },
          { dish: "Chicken vermicelli (bun ga)", note: "" },
          { dish: "Shrimp spring rolls (goi cuon)", note: "" },
          { dish: "Lemongrass chicken over rice", note: "" },
        ], watchOut: "classic pho, pho tai/bo and bun bo hue are BEEF broth — avoid; only pho ga broth is safe" },
      ],
    },
    {
      category: "Korean",
      restaurants: [
        { name: "So Gong Dong Tofu House", area: "Palo Alto", safeDishes: [
          { dish: "Seafood soft tofu soup (haemul sundubu)", note: "ask for seafood/anchovy broth, not beef" },
          { dish: "Vegetable soft tofu soup", note: "confirm broth base" },
          { dish: "Seafood pancake (haemul pajeon)", note: "" },
          { dish: "Bibimbap with chicken or vegetable", note: "" },
        ], watchOut: "sundubu broth is often beef stock — ask for seafood/veggie; avoid galbi, bulgogi and pork sundubu" },
      ],
    },
    {
      category: "Indian",
      restaurants: [
        { name: "Zareen's", area: "Palo Alto", safeDishes: [
          { dish: "Chicken tikka masala", note: "(dairy)" },
          { dish: "Chicken karahi", note: "" },
          { dish: "Chicken kabab plate", note: "" },
          { dish: "Chana masala", note: "chickpeas, vegan" },
          { dish: "Daal", note: "lentils" },
        ], watchOut: "halal (no pork) but avoid goat/lamb (bhuna gosht, nihari, goat biryani); paneer & creamy gravies = dairy; some ghee" },
        { name: "Amber India", area: "Los Altos", safeDishes: [
          { dish: "Butter chicken", note: "(dairy)" },
          { dish: "Chicken tikka masala", note: "(dairy)" },
          { dish: "Tandoori chicken", note: "" },
          { dish: "Chana masala", note: "" },
          { dish: "Palak paneer", note: "(dairy)" },
        ], watchOut: "avoid lamb/goat (rogan josh, keema); creamy curries and paneer = dairy; ghee in some dishes" },
        { name: "Janta Indian Cuisine", area: "Palo Alto", safeDishes: [
          { dish: "Chicken curry", note: "" },
          { dish: "Chicken tikka masala", note: "(dairy)" },
          { dish: "Dal (lentils)", note: "" },
          { dish: "Chana masala", note: "" },
        ], watchOut: "avoid lamb/goat dishes (keema, rogan josh); paneer & cream gravies = dairy; ghee in some breads" },
      ],
    },
    {
      category: "Pizza & Italian",
      restaurants: [
        { name: "Italico", area: "Palo Alto", safeDishes: [
          { dish: "Margherita pizza", note: "(dairy)" },
          { dish: "Marinara pizza", note: "no cheese, vegan" },
          { dish: "Funghi / vegetable pizza", note: "(dairy)" },
        ], watchOut: "prosciutto, salsiccia (sausage), 'nduja, guanciale = avoid; cheese = dairy" },
        { name: "New York Pizza", area: "Palo Alto", safeDishes: [
          { dish: "Cheese pizza", note: "(dairy)" },
          { dish: "Margherita pizza", note: "(dairy)" },
          { dish: "Veggie pizza", note: "(dairy)" },
        ], watchOut: "pepperoni, sausage, meatball, ham = avoid; cheese = dairy" },
        { name: "Pizzeria Delfina", area: "Palo Alto", safeDishes: [
          { dish: "Margherita pizza", note: "(dairy)" },
          { dish: "Marinara pizza", note: "no cheese, vegan" },
          { dish: "Broccoli raab pizza", note: "veggie (dairy)" },
        ], watchOut: "salsiccia, prosciutto, coppa, pancetta = avoid; cheese = dairy" },
        { name: "Terun", area: "Palo Alto", safeDishes: [
          { dish: "Margherita pizza", note: "(dairy)" },
          { dish: "Marinara pizza", note: "no cheese, vegan" },
          { dish: "Funghi (mushroom) pizza", note: "(dairy)" },
        ], watchOut: "prosciutto, salsiccia, 'nduja, speck = avoid; cheese = dairy" },
      ],
    },
    {
      category: "American",
      restaurants: [
        { name: "Chick-fil-A", area: "Redwood City", safeDishes: [
          { dish: "Grilled chicken sandwich", note: "" },
          { dish: "Grilled nuggets", note: "" },
          { dish: "Chicken sandwich", note: "fried in peanut oil" },
          { dish: "Waffle fries", note: "cooked in canola oil, not tallow" },
        ], watchOut: "Cobb and Club items add bacon — order without; cheese = dairy" },
        { name: "True Food Kitchen", area: "Palo Alto", safeDishes: [
          { dish: "Grilled chicken salad or bowl", note: "" },
          { dish: "Ancient Grains Bowl", note: "vegetarian; add chicken" },
          { dish: "Edamame dumplings", note: "" },
          { dish: "Tuscan kale salad", note: "" },
        ], watchOut: "avoid the grass-fed burger and any steak dishes; confirm no beef broth in soups" },
      ],
    },
    {
      category: "Seafood",
      restaurants: [
        { name: "Pacific Catch", area: "Palo Alto", safeDishes: [
          { dish: "Grilled fish tacos", note: "" },
          { dish: "Ahi poke bowl", note: "" },
          { dish: "Grilled salmon plate", note: "" },
          { dish: "Shrimp dishes", note: "" },
        ], watchOut: "clam chowder may be made with bacon/pork = avoid; the rest is seafood-safe" },
        { name: "Little MadFish", area: "Redwood City", safeDishes: [
          { dish: "Salmon / tuna sashimi", note: "" },
          { dish: "Chirashi bowl", note: "assorted raw fish over rice" },
          { dish: "Poke bowl", note: "" },
          { dish: "Grilled / fried fish", note: "" },
        ], watchOut: "skip pork items (chashu, pork katsu) and any pork-broth ramen; fish/bonito dashi is fine" },
      ],
    },
    {
      category: "Hawaiian & poke",
      restaurants: [
        { name: "Go Fish Poke Bar", area: "Palo Alto", safeDishes: [
          { dish: "Ahi tuna poke bowl", note: "" },
          { dish: "Salmon poke bowl", note: "" },
          { dish: "Spicy shrimp bowl", note: "" },
        ], watchOut: "essentially mammal-free — fish, shrimp, tofu, veggies; confirm no bacon topping" },
        { name: "Poke House", area: "Mountain View", safeDishes: [
          { dish: "Tuna poke bowl", note: "" },
          { dish: "Salmon poke bowl", note: "" },
          { dish: "Shrimp bowl", note: "" },
          { dish: "Tofu / veggie bowl", note: "vegan" },
        ], watchOut: "all-seafood/tofu proteins, mammal-free; just verify toppings and sauces" },
        { name: "Poki Bowl", area: "Palo Alto", safeDishes: [
          { dish: "Ahi tuna poke bowl", note: "" },
          { dish: "Salmon poke bowl", note: "" },
          { dish: "Shrimp poke bowl", note: "" },
          { dish: "Tofu / veggie bowl", note: "vegan" },
        ], watchOut: "no mammal traps — all seafood/plant; imitation crab is fish-based and safe" },
      ],
    },
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
  "Many patients also react to dairy and gelatin capsules; sensitivity is personal — track your own.",
  "Cross-contamination (shared grills/fryers with mammal fat) can trigger reactions — ask restaurants.",
  "Always carry your epinephrine auto-injector and antihistamines. When in doubt, don't eat it.",
];

if (typeof module !== "undefined") {
  module.exports = { RULES, ORDER_MENU, GROCERY, FACTS };
}
