#!/usr/bin/env node
/**
 * Recipe Parser — handles 3 formats:
 *
 * FORMAT A:
 *   Recipe Name: Foo Bar
 *   Ingredients:
 *   - item
 *   Instructions:
 *   1. step
 *
 * FORMAT B:
 *   Foo Bar                  ← first non-empty line is the name
 *   For the waffles:         ← sub-section headers appear immediately
 *   200g flour               ← no bullet points
 *   Step 1                   ← instructions marked "Step N"
 *   Do this thing.
 *
 * FORMAT C:
 *   Foo Bar                  ← first non-empty line is the name
 *   1 cup flour              ← ingredients with no header, just raw lines
 *   1.FOR THE CRUST:         ← numbered steps with inline labels
 *   Do this thing.
 *
 * Usage:
 *   node parse-recipes.js --dir ./recipes --favorites ./favorites.txt --out recipes.json
 */

const fs = require('fs');
const path = require('path');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INGREDIENT_SUBSECTION_RE = /^(For the |For |To |You will|You'll|You need).+:$/i;
const KNOWN_SECTION_LABELS = new Set(['Ingredients:', 'Instructions:']);

function isSubsectionHeader(line) {
  if (KNOWN_SECTION_LABELS.has(line)) return false;
  return INGREDIENT_SUBSECTION_RE.test(line);
}

function isIngredientLine(line) {
  if (/^[-•]\s/.test(line)) return true;
  if (/^[\d¼½¾⅓⅔⅛⅜⅝⅞]/.test(line)) return true;
  if (/^(a |an |pinch|handful|dash|splash|knob|drizzle|squeeze)/i.test(line)) return true;
  return false;
}

// ─── Tag generation ───────────────────────────────────────────────────────────

const TAG_KEYWORDS = {
  cake: ['cake', 'sponge', 'layer cake'],
  cookies: ['cookie', 'biscuit', 'shortbread', 'brownie'],
  bread: ['bread', 'loaf', 'sourdough', 'soda bread', 'focaccia', 'bun', 'roll'],
  pastry: ['pastry', 'tart', 'pie', 'puff', 'choux', 'croissant', 'eclair', 'frangipane'],
  chocolate: ['chocolate', 'cocoa', 'ganache'],
  lemon: ['lemon', 'citrus', 'lime'],
  chicken: ['chicken', 'poultry'],
  beef: ['beef', 'steak', 'mince', 'ground beef'],
  seafood: ['salmon', 'fish', 'shrimp', 'prawn', 'cod', 'tuna', 'seafood'],
  pasta: ['pasta', 'spaghetti', 'linguine', 'penne', 'fettuccine', 'lasagne', 'lasagna'],
  soup: ['soup', 'stew', 'broth', 'chowder'],
  salad: ['salad'],
  dessert: ['cake', 'pudding', 'tart', 'pie', 'mousse', 'ice cream', 'custard', 'brownie', 'cookie', 'meringue'],
  breakfast: ['pancake', 'waffle', 'muffin', 'scone', 'omelette', 'frittata', 'egg'],
  indian: ['curry', 'masala', 'tikka', 'dal', 'naan', 'biryani', 'chai'],
  italian: ['pasta', 'risotto', 'pizza', 'tiramisu', 'panna cotta', 'focaccia'],
  french: ['croissant', 'eclair', 'crepe', 'ratatouille', 'dauphinoise', 'baguette', 'tarte'],
  vegetarian: ['tofu', 'lentil', 'chickpea', 'vegetable', 'veg', 'veggie'],
};

function generateTags(name, allIngredientText) {
  const haystack = (name + ' ' + allIngredientText).toLowerCase();
  return Object.entries(TAG_KEYWORDS)
    .filter(([, keywords]) => keywords.some(kw => haystack.includes(kw)))
    .map(([tag]) => tag);
}

// ─── Detect format ────────────────────────────────────────────────────────────

function detectFormat(lines) {
  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.trim().startsWith('Recipe Name:')) return 'A';
    break;
  }
  if (lines.some(l => /^Step\s+\d+$/i.test(l.trim()))) return 'B';
  return 'C';
}

// ─── Format A parser ──────────────────────────────────────────────────────────

function parseFormatA(lines) {
  const result = { name: '', ingredientSections: [], instructions: [] };
  let mode = 'header';
  let currentSection = null;

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('Recipe Name:')) {
      result.name = trimmed.replace('Recipe Name:', '').trim();
      continue;
    }
    if (trimmed === 'Ingredients:') {
      mode = 'ingredients';
      currentSection = { label: null, items: [] };
      result.ingredientSections.push(currentSection);
      continue;
    }
    if (trimmed === 'Instructions:') {
      mode = 'instructions';
      continue;
    }
    if (mode === 'ingredients' && isSubsectionHeader(trimmed)) {
      currentSection = { label: trimmed.replace(/:$/, ''), items: [] };
      result.ingredientSections.push(currentSection);
      continue;
    }
    if (mode === 'ingredients') {
      const item = trimmed.replace(/^[-•]\s*/, '').trim();
      if (item && currentSection) currentSection.items.push(item);
      continue;
    }
    if (mode === 'instructions') {
      const step = trimmed.replace(/^\d+\.\s*/, '').trim();
      if (step) result.instructions.push(step);
    }
  }
  return result;
}

// ─── Format B parser ──────────────────────────────────────────────────────────

function parseFormatB(lines) {
  const result = { name: '', ingredientSections: [], instructions: [] };
  let nameParsed = false;
  let mode = 'ingredients';
  let currentSection = null;

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (!nameParsed) {
      result.name = trimmed;
      nameParsed = true;
      currentSection = { label: null, items: [] };
      result.ingredientSections.push(currentSection);
      continue;
    }

    if (/^Step\s+\d+$/i.test(trimmed)) {
      mode = 'instructions';
      continue;
    }

    if (mode === 'ingredients') {
      if (isSubsectionHeader(trimmed)) {
        currentSection = { label: trimmed.replace(/:$/, ''), items: [] };
        result.ingredientSections.push(currentSection);
      } else if (currentSection) {
        currentSection.items.push(trimmed.replace(/^[-•]\s*/, ''));
      }
    } else {
      result.instructions.push(trimmed);
    }
  }

  result.ingredientSections = result.ingredientSections.filter(s => s.items.length > 0);
  return result;
}

// ─── Format C parser ──────────────────────────────────────────────────────────

function parseFormatC(lines) {
  const result = { name: '', ingredientSections: [], instructions: [] };
  let nameParsed = false;
  let mode = 'ingredients';
  let currentSection = { label: null, items: [] };
  result.ingredientSections.push(currentSection);

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (!nameParsed) {
      result.name = trimmed;
      nameParsed = true;
      continue;
    }

    if (/^\d+\.\s*[A-Z]/.test(trimmed) || /^\d+\.\s+\S/.test(trimmed)) {
      mode = 'instructions';
      const step = trimmed.replace(/^\d+\.\s*(?:[A-Z][A-Z\s]+:\s*)?/, '').trim();
      if (step) result.instructions.push(step);
      continue;
    }

    if (mode === 'ingredients') {
      if (isSubsectionHeader(trimmed)) {
        currentSection = { label: trimmed.replace(/:$/, ''), items: [] };
        result.ingredientSections.push(currentSection);
      } else {
        currentSection.items.push(trimmed.replace(/^[-•]\s*/, ''));
      }
    } else {
      result.instructions.push(trimmed);
    }
  }

  result.ingredientSections = result.ingredientSections.filter(s => s.items.length > 0);
  return result;
}

// ─── Main parse function ──────────────────────────────────────────────────────

function parseRecipeFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  const format = detectFormat(lines);
  let parsed;

  if (format === 'A') parsed = parseFormatA(lines);
  else if (format === 'B') parsed = parseFormatB(lines);
  else parsed = parseFormatC(lines);

  const allIngredientText = parsed.ingredientSections.flatMap(s => s.items).join(' ');

  return {
    name: parsed.name,
    filename: path.basename(filePath),
    format,
    ingredientSections: parsed.ingredientSections,
    instructions: parsed.instructions,
    tags: generateTags(parsed.name, allIngredientText),
    isFavorite: false,
  };
}

// ─── Run ──────────────────────────────────────────────────────────────────────

function parseAll(recipesDir, favoritesFile, outFile) {
  const files = fs.readdirSync(recipesDir).filter(f => f.endsWith('.txt'));

  const favorites = new Set();
  if (favoritesFile && fs.existsSync(favoritesFile)) {
    fs.readFileSync(favoritesFile, 'utf8')
      .split('\n').map(l => l.trim()).filter(Boolean)
      .forEach(f => favorites.add(f));
  }

  const recipes = [];
  const errors = [];
  const formatCounts = { A: 0, B: 0, C: 0 };

  for (const file of files) {
    try {
      const recipe = parseRecipeFile(path.join(recipesDir, file));
      recipe.isFavorite = favorites.has(file);
      recipes.push(recipe);
      formatCounts[recipe.format]++;
    } catch (err) {
      errors.push({ file, error: err.message });
    }
  }

  const empty = recipes.filter(r => !r.name || r.ingredientSections.length === 0);

  fs.writeFileSync(outFile, JSON.stringify(recipes, null, 2));

  console.log(`\n✅ Parsed ${recipes.length} recipes`);
  console.log(`   Format A: ${formatCounts.A}`);
  console.log(`   Format B: ${formatCounts.B}`);
  console.log(`   Format C: ${formatCounts.C}`);
  console.log(`⭐ Favorites: ${recipes.filter(r => r.isFavorite).length}`);
  console.log(`⚠️  Still empty: ${empty.length}`);
  if (empty.length) {
    console.log('   Sample empty files:');
    empty.slice(0, 10).forEach(r => console.log(`   - ${r.filename} (format: ${r.format})`));
  }
  console.log(`❌ Parse errors: ${errors.length}`);
  if (errors.length) errors.forEach(e => console.log(`   ${e.file}: ${e.error}`));
  console.log(`📄 Output: ${outFile}\n`);
}

const args = process.argv.slice(2);
const get = f => { const i = args.indexOf(f); return i !== -1 ? args[i + 1] : null; };

const recipesDir = get('--dir');
const favoritesFile = get('--favorites');
const outFile = get('--out') || 'recipes.json';

if (!recipesDir) {
  console.error('Usage: node parse-recipes.js --dir <recipes_folder> [--favorites <file>] [--out <file>]');
  process.exit(1);
}

parseAll(recipesDir, favoritesFile, outFile);
