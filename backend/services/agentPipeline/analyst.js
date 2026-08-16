/**
 * analyst.js
 *
 * Takes the RAW object returned by specsApi.getPhoneDetails() and flattens
 * it into one clean, predictable shape. Nothing downstream (Verdict agent,
 * scoring engine) should ever need to know GSMArena's nested structure or
 * deal with embedded HTML - that all gets handled here, once.
 *
 * Why this matters: the raw data has HTML tags buried in string values
 * (e.g. Price contains an <a> tag) and inconsistent nesting
 * (specifications.Platform.Chipset, specifications.Battery.Type, etc).
 * If every downstream piece had to know that shape, one GSMArena layout
 * change would break the whole app in five places instead of one.
 */

/**
 * Strips HTML tags and collapses extra whitespace from a string.
 * e.g. '<a href="#">GSM / CDMA</a>' -> 'GSM / CDMA'
 */
function stripHtml(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<[^>]*>/g, '')       // remove tags
    .replace(/&nbsp;/g, ' ')       // common HTML entity in this data
    .replace(/\s+/g, ' ')          // collapse whitespace/newlines
    .trim();
}

/**
 * Safely reads a nested value without throwing if a section is missing.
 * e.g. safeGet(raw, ['specifications', 'Platform', 'Chipset'])
 */
function safeGet(obj, path) {
  return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

/**
 * Main entry point: raw specsApi.getPhoneDetails() output in,
 * clean flat object out.
 */
function analyzePhone(raw) {
  const specs = raw.specifications || {};

  const cleaned = {
    // Basic info - already flat in the raw data
    model: raw.model || 'Unknown',
    brand: raw.brand || inferBrandFromModel(raw.model),
    imageUrl: raw.imageUrl || null,
    releaseDate: stripHtml(raw.release_date),

    // Flattened from nested specifications - the actual "analysis" work
    chipset: stripHtml(safeGet(specs, ['Platform', 'Chipset'])),
    cpu: stripHtml(safeGet(specs, ['Platform', 'CPU'])),
    gpu: stripHtml(safeGet(specs, ['Platform', 'GPU'])),

    ram: extractRam(safeGet(specs, ['Memory', 'Internal'])),
    storageOptions: stripHtml(safeGet(specs, ['Memory', 'Internal'])),

    displayType: stripHtml(safeGet(specs, ['Display', 'Type'])),
    displaySize: stripHtml(safeGet(specs, ['Display', 'Size'])),

    mainCamera: stripHtml(safeGet(specs, ['Main Camera', 'Triple']) || safeGet(specs, ['Main Camera', 'Single'])),
    selfieCamera: stripHtml(safeGet(specs, ['Selfie camera', 'Single'])),

    batteryType: stripHtml(safeGet(specs, ['Battery', 'Type'])),
    charging: stripHtml(safeGet(specs, ['Battery', 'Charging'])),

    // Price is buried in an <a> tag inside Misc - strip it to plain text
    priceRaw: stripHtml(safeGet(specs, ['Misc', 'Price'])),

    // Flag devices that are clearly not phones (iPad, Watch) so the
    // Researcher/route layer can filter them out before this ever
    // reaches the scoring engine.
    isLikelyPhone: !/ipad|watch/i.test(raw.model || ''),
  };

  return cleaned;
}

/**
 * The raw "Internal" memory string looks like:
 * "128GB 8GB RAM, 256GB 8GB RAM, 512GB 8GB RAM, 1TB 8GB RAM"
 * We just want a representative RAM figure, e.g. "8GB RAM".
 * This is intentionally simple - good enough for scoring, not meant to
 * capture every storage/RAM combination.
 */
function extractRam(internalString) {
  if (!internalString) return null;
  const match = internalString.match(/(\d+)\s*GB\s*RAM/i);
  return match ? `${match[1]}GB RAM` : null;
}

/**
 * The raw `brand` field often comes back empty (we saw this happen with
 * the iPhone 15 Pro test). Fall back to guessing it from the model name's
 * first word, since that's usually the brand (e.g. "Apple iPhone 15 Pro").
 */
function inferBrandFromModel(model) {
  if (!model) return 'Unknown';
  return model.split(' ')[0];
}

module.exports = { analyzePhone };