// BrandList.jsx
// Entry point of the app. Shows all brands, lets the user pick one.
// This exists because the specs API's /search endpoint doesn't work -
// browsing by brand is the real, tested way to discover phones.

import { useEffect, useState } from 'react';
import { fetchBrands } from '../api';

export default function BrandList({ onSelectBrand }) {
  const [brands, setBrands] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBrands()
      .then(setBrands)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">Error: {error}</p>;
  if (!brands) return <p>Loading brands...</p>;

  // brands is an object keyed by brand name, e.g. { Apple: {...}, Samsung: {...} }
  const brandEntries = Object.entries(brands);

  return (
    <div className="brand-list">
      <h1>Phone Advisor</h1>
      <p>Choose a brand to browse phones</p>
      <div className="brand-grid">
        {brandEntries.map(([name, info]) => (
          <button
            key={info.brand_slug}
            className="brand-card"
            onClick={() => onSelectBrand(info.brand_slug, name)}
          >
            <span className="brand-name">{name}</span>
            <span className="brand-count">{info.device_count} devices</span>
          </button>
        ))}
      </div>
    </div>
  );
}