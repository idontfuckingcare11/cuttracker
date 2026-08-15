import { config } from '../config.js';

// Base nutrition lookup per 100 grams
const COMMON_FOODS_PER_100G = [
  // Philippine / Asian dishes (Specific entries)
  { name: 'chicken humba', aliases: ['chicken humba', 'poultry humba'], calories: 220, proteinG: 24, carbsG: 6, fatG: 11 },
  { name: 'pork humba', aliases: ['pork humba', 'pig humba', 'humba', 'braised pork belly'], calories: 330, proteinG: 16, carbsG: 8, fatG: 26 },
  { name: 'chicken adobo', aliases: ['chicken adobo', 'inasal', 'chicken inasal'], calories: 210, proteinG: 24, carbsG: 2, fatG: 11 },
  { name: 'pork adobo', aliases: ['pork adobo', 'braised pork'], calories: 235, proteinG: 24, carbsG: 3, fatG: 14 },
  { name: 'beef caldereta', aliases: ['beef caldereta', 'caldereta', 'beef stew'], calories: 210, proteinG: 18, carbsG: 8, fatG: 12 },
  { name: 'beef tapa', aliases: ['beef tapa', 'tapa', 'cured beef'], calories: 240, proteinG: 26, carbsG: 4, fatG: 13 },
  { name: 'sinigang', aliases: ['sinigang na baboy', 'sinigang', 'pork sinigang', 'shrimp sinigang'], calories: 120, proteinG: 12, carbsG: 4, fatG: 6 },
  { name: 'lechon', aliases: ['lechon', 'lechon kawali', 'crispy pata'], calories: 380, proteinG: 20, carbsG: 0, fatG: 32 },
  { name: 'lumpia', aliases: ['lumpia', 'lumpiang shanghai', 'spring roll'], calories: 250, proteinG: 10, carbsG: 24, fatG: 13 },
  { name: 'tokwa / tofu', aliases: ['tofu', 'tokwa', 'firm tofu'], calories: 76, proteinG: 8, carbsG: 1.9, fatG: 4.8 },

  // Poultry & Meats
  { name: 'chicken breast', aliases: ['chicken breast', 'boneless chicken breast'], calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
  { name: 'chicken thigh', aliases: ['chicken thigh', 'chicken leg', 'fried chicken'], calories: 220, proteinG: 22, carbsG: 0, fatG: 14 },
  { name: 'steak / beef', aliases: ['steak', 'ribeye', 'sirloin', 'beef steak', 'minced beef', 'ground beef'], calories: 220, proteinG: 25, carbsG: 0, fatG: 13 },
  { name: 'pork chop', aliases: ['pork chop', 'pork loin'], calories: 210, proteinG: 26, carbsG: 0, fatG: 11 },

  // Fish & Seafood
  { name: 'salmon', aliases: ['salmon', 'salmon fillet'], calories: 173, proteinG: 20, carbsG: 0, fatG: 10.8 },
  { name: 'tuna', aliases: ['tuna', 'canned tuna', 'tuna steak'], calories: 130, proteinG: 28, carbsG: 0, fatG: 1 },
  { name: 'shrimp', aliases: ['shrimp', 'prawns'], calories: 99, proteinG: 24, carbsG: 0.2, fatG: 0.3 },

  // Staples, Grains & Eggs
  { name: 'white rice', aliases: ['white rice', 'cooked white rice', 'steamed rice'], calories: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 },
  { name: 'brown rice', aliases: ['brown rice', 'cooked brown rice'], calories: 112, proteinG: 2.6, carbsG: 24, fatG: 0.9 },
  { name: 'fried rice', aliases: ['fried rice', 'sinangag', 'yang chow'], calories: 174, proteinG: 4, carbsG: 28, fatG: 5.5 },
  { name: 'rolled oats', aliases: ['oats', 'oatmeal', 'rolled oats'], calories: 380, proteinG: 13, carbsG: 66, fatG: 6.5 },
  { name: 'whole egg', aliases: ['whole egg', 'boiled egg', 'scrambled egg', 'fried egg'], calories: 143, proteinG: 12.6, carbsG: 0.8, fatG: 9.5 },
  { name: 'egg white', aliases: ['egg white', 'egg whites'], calories: 52, proteinG: 11, carbsG: 0.7, fatG: 0.2 },
  { name: 'whey protein', aliases: ['whey protein', 'protein powder', 'protein shake'], calories: 400, proteinG: 80, carbsG: 10, fatG: 5 },

  // Vegetables & Fruits
  { name: 'banana', aliases: ['banana', 'bananas'], calories: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3 },
  { name: 'apple', aliases: ['apple', 'apples'], calories: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2 },
  { name: 'broccoli', aliases: ['broccoli'], calories: 34, proteinG: 2.8, carbsG: 6.6, fatG: 0.4 },
  { name: 'sweet potato', aliases: ['sweet potato', 'camote'], calories: 86, proteinG: 1.6, carbsG: 20, fatG: 0.1 },

  // Fats & Dairy
  { name: 'olive oil', aliases: ['olive oil', 'cooking oil'], calories: 884, proteinG: 0, carbsG: 0, fatG: 100 },
  { name: 'greek yogurt', aliases: ['greek yogurt', 'yogurt'], calories: 65, proteinG: 10, carbsG: 4, fatG: 0.4 },
  { name: 'peanut butter', aliases: ['peanut butter'], calories: 588, proteinG: 25, carbsG: 20, fatG: 50 },
  { name: 'almonds', aliases: ['almonds', 'almond'], calories: 579, proteinG: 21, carbsG: 22, fatG: 50 },

  // Dishes & Fast Food
  { name: 'pasta / noodles', aliases: ['pasta', 'spaghetti', 'carbonara', 'bolognese', 'noodles', 'ramen', 'pad thai'], calories: 175, proteinG: 6, carbsG: 31, fatG: 3.5 },
  { name: 'pizza', aliases: ['pizza', 'cheese pizza', 'pepperoni pizza'], calories: 266, proteinG: 11, carbsG: 33, fatG: 10 },
  { name: 'burger', aliases: ['burger', 'cheeseburger', 'hamburger'], calories: 250, proteinG: 13, carbsG: 24, fatG: 12 },

  // ═══════════════════════════════════════════════════════════
  // PHILIPPINE CANNED GOODS — All values per 100g
  // ═══════════════════════════════════════════════════════════

  // --- Century Tuna (Canned) ---
  { name: 'Century Tuna Flakes in Oil', aliases: ['century tuna', 'century tuna flakes in oil', 'century tuna oil', 'tuna flakes in oil'], calories: 196, proteinG: 12.5, carbsG: 7, fatG: 12.5 },
  { name: 'Century Tuna Flakes in Water', aliases: ['century tuna flakes in water', 'century tuna water', 'tuna flakes in water', 'tuna in water', 'tuna in brine'], calories: 80, proteinG: 15, carbsG: 2, fatG: 1 },
  { name: 'Century Tuna Hot & Spicy', aliases: ['century tuna hot and spicy', 'century tuna hot & spicy', 'century tuna spicy', 'tuna hot and spicy'], calories: 185, proteinG: 13, carbsG: 5, fatG: 12 },
  { name: 'Century Tuna Mechado', aliases: ['century tuna mechado', 'tuna mechado'], calories: 90, proteinG: 9, carbsG: 9, fatG: 3 },
  { name: 'Century Tuna Caldereta', aliases: ['century tuna caldereta', 'tuna caldereta'], calories: 105, proteinG: 12, carbsG: 8, fatG: 3 },
  { name: 'Century Tuna Afritada', aliases: ['century tuna afritada', 'tuna afritada'], calories: 95, proteinG: 10, carbsG: 8, fatG: 3 },
  { name: 'Century Corned Tuna', aliases: ['century corned tuna', 'corned tuna'], calories: 120, proteinG: 14, carbsG: 6, fatG: 4.5 },

  // --- San Marino ---
  { name: 'San Marino Corned Tuna', aliases: ['san marino corned tuna', 'san marino tuna'], calories: 166, proteinG: 12, carbsG: 6, fatG: 8 },

  // --- Century Bangus ---
  { name: 'Century Bangus', aliases: ['century bangus', 'bangus in oil', 'canned bangus', 'milkfish'], calories: 211, proteinG: 20, carbsG: 8, fatG: 12 },

  // --- Sardines ---
  { name: 'Mega Sardines (Tomato)', aliases: ['mega sardines', 'mega sardines tomato sauce', 'mega sardines tomato'], calories: 96, proteinG: 11, carbsG: 4, fatG: 4 },
  { name: 'Ligo Sardines (Tomato)', aliases: ['ligo sardines', 'ligo sardines tomato', 'ligo sardines tomato sauce'], calories: 98, proteinG: 10, carbsG: 4.5, fatG: 4 },
  { name: '555 Sardines (Tomato)', aliases: ['555 sardines', '555 sardines tomato', '555 sardines tomato sauce'], calories: 130, proteinG: 15, carbsG: 3.5, fatG: 7 },
  { name: '555 Fried Sardines', aliases: ['555 fried sardines', 'fried sardines'], calories: 180, proteinG: 11, carbsG: 7, fatG: 13 },
  { name: "Young's Town Sardines", aliases: ["young's town sardines", 'youngs town sardines', 'youngstown sardines'], calories: 130, proteinG: 9, carbsG: 1, fatG: 10 },
  { name: 'King Cup Sardines', aliases: ['king cup sardines'], calories: 100, proteinG: 14, carbsG: 2, fatG: 4 },
  { name: 'Montaño Spanish Sardines', aliases: ['montano sardines', 'montano spanish sardines', 'spanish sardines'], calories: 250, proteinG: 25, carbsG: 4, fatG: 15 },
  { name: 'Canned Sardines (generic)', aliases: ['sardines', 'sardinas', 'canned sardines'], calories: 105, proteinG: 12, carbsG: 4, fatG: 4.5 },

  // --- Corned Beef ---
  { name: 'Argentina Corned Beef', aliases: ['argentina corned beef', 'argentina beef'], calories: 240, proteinG: 23, carbsG: 1, fatG: 16 },
  { name: 'Purefoods Corned Beef', aliases: ['purefoods corned beef'], calories: 200, proteinG: 21, carbsG: 1, fatG: 13 },
  { name: 'Palm Corned Beef', aliases: ['palm corned beef'], calories: 285, proteinG: 21, carbsG: 0, fatG: 23 },
  { name: 'Delimondo Corned Beef', aliases: ['delimondo corned beef', 'delimondo'], calories: 218, proteinG: 18, carbsG: 2, fatG: 16 },
  { name: 'Corned Beef (generic)', aliases: ['corned beef', 'carne norte', 'karne norte'], calories: 230, proteinG: 21, carbsG: 1, fatG: 16 },

  // --- Luncheon Meat ---
  { name: 'Spam Classic', aliases: ['spam', 'spam classic', 'spam luncheon meat'], calories: 316, proteinG: 13, carbsG: 2, fatG: 29 },
  { name: 'Spam Lite', aliases: ['spam lite', 'spam less sodium'], calories: 233, proteinG: 14, carbsG: 2, fatG: 20 },
  { name: 'Ma-Ling Luncheon Meat', aliases: ['ma-ling', 'ma-ling luncheon meat', 'maling', 'maling luncheon meat'], calories: 260, proteinG: 15, carbsG: 2, fatG: 22 },
  { name: 'CDO Luncheon Meat', aliases: ['cdo luncheon meat', 'cdo chinese style', 'cdo chinese luncheon meat'], calories: 200, proteinG: 11, carbsG: 7, fatG: 15 },
  { name: 'Luncheon Meat (generic)', aliases: ['luncheon meat', 'canned meat'], calories: 280, proteinG: 13, carbsG: 3, fatG: 25 },

  // --- Liver Spread ---
  { name: 'CDO Liver Spread', aliases: ['cdo liver spread', 'liver spread cdo'], calories: 250, proteinG: 12, carbsG: 5, fatG: 20 },
  { name: 'Argentina Liver Spread', aliases: ['argentina liver spread'], calories: 245, proteinG: 11, carbsG: 5, fatG: 20 },
  { name: 'Liver Spread (generic)', aliases: ['liver spread', 'liverspread'], calories: 248, proteinG: 12, carbsG: 5, fatG: 20 },

  // --- Meat Loaf & Sausages ---
  { name: 'Argentina Meat Loaf', aliases: ['argentina meatloaf', 'argentina meat loaf', 'canned meatloaf', 'canned meat loaf'], calories: 155, proteinG: 7, carbsG: 17, fatG: 7 },
  { name: 'Argentina Vienna Sausage', aliases: ['argentina vienna sausage', 'vienna sausage', 'viennas'], calories: 205, proteinG: 10, carbsG: 2, fatG: 17 },
  { name: 'Argentina Beef Loaf', aliases: ['argentina beef loaf', 'beef loaf'], calories: 160, proteinG: 8, carbsG: 15, fatG: 8 },
  { name: 'CDO Ulam Burger', aliases: ['cdo ulam burger', 'ulam burger'], calories: 210, proteinG: 10, carbsG: 10, fatG: 15 },
  { name: 'CDO Karne Norte', aliases: ['cdo karne norte'], calories: 200, proteinG: 18, carbsG: 3, fatG: 13 },

  // --- Instant Noodles (dry block as packaged, per 100g) ---
  { name: 'Lucky Me Instant Noodles', aliases: ['lucky me', 'lucky me noodles', 'lucky me pancit canton', 'pancit canton'], calories: 448, proteinG: 12, carbsG: 59, fatG: 18 },
  { name: 'Nissin Cup Noodles', aliases: ['nissin cup noodles', 'cup noodles', 'nissin'], calories: 440, proteinG: 10, carbsG: 58, fatG: 19 },
  { name: 'Payless Noodles', aliases: ['payless noodles', 'payless', 'payless pancit canton'], calories: 430, proteinG: 10, carbsG: 60, fatG: 17 },

  // --- Other Filipino Canned / Packaged ---
  { name: '555 Tuna', aliases: ['555 tuna', '555 tuna flakes'], calories: 150, proteinG: 14, carbsG: 5, fatG: 8 },
  { name: 'Century Tuna Sisig', aliases: ['century tuna sisig', 'tuna sisig'], calories: 120, proteinG: 12, carbsG: 7, fatG: 5 },
  { name: 'Wow Ulam', aliases: ['wow ulam', 'wow ulam viand'], calories: 180, proteinG: 10, carbsG: 10, fatG: 12 }
];


function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findInBase(foodName) {
  const query = foodName.toLowerCase().trim();
  if (!query) return null;

  // 1. First pass: exact match on alias
  for (const item of COMMON_FOODS_PER_100G) {
    if (item.aliases.some((alias) => query === alias.toLowerCase())) {
      return {
        calories: item.calories,
        proteinG: item.proteinG,
        carbsG: item.carbsG,
        fatG: item.fatG
      };
    }
  }

  // 2. Second pass: exact word boundary match for multi-word or distinct single-word aliases
  for (const item of COMMON_FOODS_PER_100G) {
    for (const alias of item.aliases) {
      const aliasLower = alias.toLowerCase();
      // Only match word boundaries if alias is full match or query contains full word phrase boundary
      const regex = new RegExp(`\\b${escapeRegex(aliasLower)}\\b`, 'i');
      if (regex.test(query)) {
        // If alias is a single common word like 'rice' or 'egg' or 'tofu', require query to be very close
        return {
          calories: item.calories,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG
        };
      }
    }
  }
  return null;
}

// Smart heuristic calculator when food is not in DB and AI is unavailable
function estimateHeuristically(foodName) {
  const query = foodName.toLowerCase().trim();
  let proteinG = 10;
  let carbsG = 15;
  let fatG = 5;

  // Detect protein base
  if (/chicken|turkey|poultry/.test(query)) {
    proteinG = 24; carbsG = 2; fatG = 7;
  } else if (/pork|pig|bacon|lechon/.test(query)) {
    proteinG = 20; carbsG = 4; fatG = 18;
  } else if (/beef|steak|tapa|burger|caldereta/.test(query)) {
    proteinG = 22; carbsG = 4; fatG = 14;
  } else if (/fish|salmon|tuna|shrimp|seafood/.test(query)) {
    proteinG = 22; carbsG = 1; fatG = 5;
  } else if (/egg|omelet/.test(query)) {
    proteinG = 13; carbsG = 1; fatG = 10;
  } else if (/tofu|tokwa|soy/.test(query)) {
    proteinG = 9; carbsG = 3; fatG = 5;
  } else if (/whey|protein/.test(query)) {
    proteinG = 75; carbsG = 8; fatG = 4;
  }

  // Cooking method / Dish type adjustments
  if (/fried|crispy|tempura|lumpia/.test(query)) {
    fatG += 7;
    carbsG += 6;
  } else if (/humba|adobo|braised|stew|curry/.test(query)) {
    fatG += 5;
    carbsG += 5;
  } else if (/grilled|roasted|steamed|boiled/.test(query)) {
    fatG = Math.max(1, fatG - 2);
  }

  // Carbs detection
  if (/rice|sinangag/.test(query)) {
    carbsG += 20;
  } else if (/noodle|pasta|ramen|spaghetti/.test(query)) {
    carbsG += 22;
  } else if (/bread|toast|sandwich|bun/.test(query)) {
    carbsG += 30;
  } else if (/salad|vegetable|veggie/.test(query)) {
    carbsG = Math.max(4, carbsG - 10);
    fatG = Math.max(2, fatG - 3);
  }

  const calories = Math.round(proteinG * 4 + carbsG * 4 + fatG * 9);
  return { calories, proteinG: Number(proteinG.toFixed(1)), carbsG: Number(carbsG.toFixed(1)), fatG: Number(fatG.toFixed(1)) };
}

export async function estimateFoodNutrition(name, gramsInput = 100) {
  const grams = Math.max(1, Number(gramsInput) || 100);
  let per100g = findInBase(name);
  let source = 'database';

  // Try Groq LLM if API Key is configured for non-matching custom meals
  if (!per100g && config.groq.apiKey) {
    try {
      const prompt = `Provide exact nutrition info per 100 grams for the food item: "${name}".
Return ONLY a valid JSON object in this format:
{"calories": number, "proteinG": number, "carbsG": number, "fatG": number}`;

      const res = await fetch(config.groq.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.groq.apiKey}`
        },
        body: JSON.stringify({
          model: config.groq.model,
          temperature: 0.2,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (res.ok) {
        const json = await res.json();
        const text = json?.choices?.[0]?.message?.content || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (typeof parsed.calories === 'number') {
            per100g = {
              calories: Math.round(parsed.calories),
              proteinG: Number(parsed.proteinG || 0),
              carbsG: Number(parsed.carbsG || 0),
              fatG: Number(parsed.fatG || 0)
            };
            source = 'ai';
          }
        }
      }
    } catch (err) {
      console.warn('[food-estimator] Groq request failed, using generic fallback:', err.message);
    }
  }

  // Heuristic engine fallback if food is unknown and AI is unavailable/failed
  if (!per100g) {
    per100g = estimateHeuristically(name);
    source = 'heuristic';
  }

  const factor = grams / 100;
  return {
    name,
    grams,
    per100g,
    source,
    calories: Math.round(per100g.calories * factor),
    proteinG: Math.round(per100g.proteinG * factor * 10) / 10,
    carbsG: Math.round(per100g.carbsG * factor * 10) / 10,
    fatG: Math.round(per100g.fatG * factor * 10) / 10
  };
}

