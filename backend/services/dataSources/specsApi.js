/**
 * specsApi.js
 *
 * Wraps calls to the external `mobile-specs-api` service (localhost:4000).
 * This is the ONLY file in our app that knows that API's routes and
 * response shape ({ status, data }). Everything else in our app just
 * calls these two functions and gets back plain data.
 */

// Using 127.0.0.1 instead of 'localhost' - on some Windows setups, fetch
// resolves 'localhost' to the IPv6 ::1 address first, which can cause a
// generic "fetch failed" error even when the server is running fine.
const BASE_URL = process.env.SPECS_API_BASE_URL || 'http://127.0.0.1:4000';

/**
 * Searches for phones matching a query string.
 * Calls: GET /search?query=...
 * Returns an array of matching phones (empty array if none found).
 */
async function searchPhones(query) {
  const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`specsApi search failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  // The /search endpoint returns a BARE ARRAY, not the { status, data }
  // wrapper the README implies - confirmed by actually testing it.
  // An empty array just means "no results found", not an error.
  if (Array.isArray(json)) {
    return json;
  }

  // Fallback in case it's ever wrapped after all
  return json.data ?? json;
}

/**
 * Fetches full specs for one phone using its slug.
 * Calls: GET /:slug
 * Returns the phone's detail object.
 */
async function getPhoneDetails(slug) {
  const url = `${BASE_URL}/${slug}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`specsApi getPhoneDetails failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  // Defensive: return json.data if present, otherwise fall back to the
  // raw json itself, in case a future response shape changes slightly.
  return json.data ?? json;
}

/**
 * Gets the full list of brands (name, slug, device count).
 * Calls: GET /brands
 * This endpoint IS wrapped in { status, data } - unlike /search.
 */
async function getBrands() {
  const url = `${BASE_URL}/brands`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`specsApi getBrands failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return json.data ?? json;
}

/**
 * Gets the list of phones for one brand, using the brand's slug
 * (e.g. "apple-phones-48", from getBrands()).
 * Calls: GET /brands/:brandSlug
 */
async function getPhonesByBrand(brandSlug) {
  const url = `${BASE_URL}/brands/${brandSlug}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`specsApi getPhonesByBrand failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return json.data ?? json;
}

module.exports = { searchPhones, getPhoneDetails, getBrands, getPhonesByBrand };