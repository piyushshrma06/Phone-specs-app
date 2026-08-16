// PhoneList.jsx
// Shows devices for one brand. Filters out obvious non-phones (iPad,
// Watch) using the name string - cheap client-side check, since
// calling getPhoneWithScore on every item just to check isLikelyPhone
// would trigger a Gemini call per device, which is slow and wasteful.

import { useEffect, useState } from 'react';
import { fetchPhonesByBrand } from '../api';

export default function PhoneList({ brandSlug, brandName, onSelectPhone, onBack }) {
  const [devices, setDevices] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPhonesByBrand(brandSlug)
      .then(setDevices)
      .catch((err) => setError(err.message));
  }, [brandSlug]);

  if (error) return <p className="error">Error: {error}</p>;
  if (!devices) return <p>Loading {brandName} devices...</p>;

  const phonesOnly = devices.filter((d) => !/ipad|watch/i.test(d.name));

  return (
    <div className="phone-list">
      <button className="back-link" onClick={onBack}>&larr; Back to brands</button>
      <h1>{brandName}</h1>
      <p>{phonesOnly.length} phones</p>
      <div className="phone-grid">
        {phonesOnly.map((phone) => (
          <button
            key={phone.slug}
            className="phone-card"
            onClick={() => onSelectPhone(phone.slug)}
          >
            <img src={phone.imageUrl} alt={phone.name} className="phone-thumb" />
            <span className="phone-name">{phone.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}