// api.js
// Thin wrapper around fetch calls to our backend (localhost:5000).
// Keeping all API calls in one file means components never construct
// URLs themselves - if the backend's base URL changes, this is the
// only file that needs to change.

const API_BASE = 'http://localhost:5000/api/phones';

export async function fetchBrands() {
  const res = await fetch(`${API_BASE}/brands`);
  if (!res.ok) throw new Error('Failed to fetch brands');
  return res.json();
}

export async function fetchPhonesByBrand(brandSlug) {
  const res = await fetch(`${API_BASE}/brands/${brandSlug}`);
  if (!res.ok) throw new Error('Failed to fetch phones for brand');
  return res.json();
}

export async function fetchPhoneWithScore(slug, persona) {
  const res = await fetch(`${API_BASE}/${slug}?persona=${persona}`);
  if (!res.ok) throw new Error('Failed to fetch phone details');
  return res.json();
}