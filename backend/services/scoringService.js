/**
 * scoringService.js
 *
 * Takes the cleaned phone object + a persona, returns a weighted score.
 * Pure deterministic math, no LLM involved - this is YOUR algorithm,
 * the strongest "I designed this" piece in the whole project.
 *
 * Since GSMArena doesn't provide a numeric benchmark (no AnTuTu score),
 * we extract usable numbers from the text fields we do have: RAM,
 * battery capacity, camera megapixels, and price. Each gets normalized
 * to a 0-10 scale, then combined using persona-specific weights.
 */

// Weight for each metric, per persona. Weights don't need to sum to 1 -
// they're relative importance multipliers, and the final score is
// normalized at the end regardless.
const PERSONA_WEIGHTS = {
  gamer: { ram: 0.35, battery: 0.35, camera: 0.1, price: 0.2 },
  contentCreator: { ram: 0.15, battery: 0.15, camera: 0.5, price: 0.2 },
  everyday: { ram: 0.2, battery: 0.25, camera: 0.25, price: 0.3 },
};

// --- Extraction: pull numbers out of the cleaned text fields ---

function extractRamGb(cleaned) {
  const match = (cleaned.ram || '').match(/(\d+)\s*GB/i);
  return match ? Number(match[1]) : null;
}

function extractBatteryMah(cleaned) {
  const match = (cleaned.batteryType || '').match(/(\d+)\s*mAh/i);
  return match ? Number(match[1]) : null;
}

function extractCameraMp(cleaned) {
  const match = (cleaned.mainCamera || '').match(/(\d+)\s*MP/i);
  return match ? Number(match[1]) : null;
}

function extractPriceUsd(cleaned) {
  const match = (cleaned.priceRaw || '').match(/\$\s*([\d,]+\.?\d*)/);
  return match ? Number(match[1].replace(',', '')) : null;
}

// --- Normalization: map raw numbers to a 0-10 scale ---
// Ranges are rough real-world bounds for current phones, not scientific -
// good enough for relative comparison between phones, which is the actual goal.

function normalize(value, min, max) {
  if (value === null) return 5; // missing data -> neutral score, don't punish or reward
  const clamped = Math.max(min, Math.min(max, value));
  return ((clamped - min) / (max - min)) * 10;
}

function normalizeRam(gb) {
  return normalize(gb, 4, 16);
}

function normalizeBattery(mah) {
  return normalize(mah, 3000, 6000);
}

function normalizeCamera(mp) {
  return normalize(mp, 8, 108);
}

function normalizePrice(usd) {
  if (usd === null) return 5;
  // Inverted: lower price = higher score
  const clamped = Math.max(200, Math.min(1500, usd));
  return 10 - ((clamped - 200) / (1500 - 200)) * 10;
}

/**
 * Main entry point: cleaned phone object + persona string in,
 * { score, breakdown } out. Score is 0-10.
 */
function scorePhone(cleaned, persona) {
  const weights = PERSONA_WEIGHTS[persona];
  if (!weights) {
    throw new Error(`Unknown persona: "${persona}". Valid options: ${Object.keys(PERSONA_WEIGHTS).join(', ')}`);
  }

  const raw = {
    ram: extractRamGb(cleaned),
    battery: extractBatteryMah(cleaned),
    camera: extractCameraMp(cleaned),
    price: extractPriceUsd(cleaned),
  };

  const normalized = {
    ram: normalizeRam(raw.ram),
    battery: normalizeBattery(raw.battery),
    camera: normalizeCamera(raw.camera),
    price: normalizePrice(raw.price),
  };

  const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
  const weightedSum = Object.keys(weights).reduce(
    (sum, key) => sum + normalized[key] * weights[key],
    0
  );
  const score = Math.round((weightedSum / weightSum) * 10) / 10; // round to 1 decimal

  return {
    score,
    persona,
    breakdown: {
      raw,        // the actual extracted numbers, for transparency/debugging
      normalized, // 0-10 per metric
      weights,    // what mattered for this persona
    },
  };
}

module.exports = { scorePhone, PERSONA_WEIGHTS };