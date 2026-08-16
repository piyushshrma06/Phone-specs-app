// PhoneDetail.jsx
// The core screen: calls the full backend pipeline (cache -> agents ->
// scoring) and shows specs, Gemini's verdict, and a persona-based score.
// Switching persona re-fetches, since the score depends on it - the
// cache-aside layer means this re-fetch is still fast (cache hit),
// only the scoring math re-runs.

import { useEffect, useState } from 'react';
import { fetchPhoneWithScore } from '../api';
import SignalMeter from './SignalMeter';

const PERSONAS = [
  { value: 'gamer', label: 'Gamer' },
  { value: 'contentCreator', label: 'Content Creator' },
  { value: 'everyday', label: 'Everyday User' },
];

export default function PhoneDetail({ slug, onBack }) {
  const [persona, setPersona] = useState('everyday');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPhoneWithScore(slug, persona)
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug, persona]);

  return (
    <div className="phone-detail">
      <button className="back-link" onClick={onBack}>&larr; Back to list</button>

      {error && <p className="error">Error: {error}</p>}
      {loading && <p>Loading...</p>}

      {data && !loading && (
        <>
          <div className="detail-header">
            <img src={data.cleaned.imageUrl} alt={data.cleaned.model} className="detail-image" />
            <div>
              <h1>{data.cleaned.model}</h1>
              <p className="release-date">{data.cleaned.releaseDate}</p>
              <p className="cache-tag">{data.fromCache ? '⚡ cached result' : '🔄 freshly fetched'}</p>
            </div>
          </div>

          <div className="persona-switcher">
            {PERSONAS.map((p) => (
              <button
                key={p.value}
                className={`persona-btn ${persona === p.value ? 'active' : ''}`}
                onClick={() => setPersona(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="score-card">
            <SignalMeter
              score={data.score}
              label={`Score // ${PERSONAS.find((p) => p.value === persona)?.label.toUpperCase()} FIT`}
            />
          </div>

          <div className={`verdict-badge ${data.verdict.verdict === 'Buy' ? 'buy' : 'pass'}`}>
            {data.verdict.verdict}
          </div>
          <p className="verdict-summary">{data.verdict.summary}</p>

          <div className="pros-cons">
            <div>
              <h3>Pros</h3>
              <ul>
                {data.verdict.pros.map((pro, i) => <li key={i}>{pro}</li>)}
              </ul>
            </div>
            <div>
              <h3>Cons</h3>
              <ul>
                {data.verdict.cons.map((con, i) => <li key={i}>{con}</li>)}
              </ul>
            </div>
          </div>

          <div className="specs-table">
            <h3>Specs</h3>
            <div className="spec-row"><span>Chipset</span><span>{data.cleaned.chipset}</span></div>
            <div className="spec-row"><span>RAM</span><span>{data.cleaned.ram}</span></div>
            <div className="spec-row"><span>Storage</span><span>{data.cleaned.storageOptions}</span></div>
            <div className="spec-row"><span>Display</span><span>{data.cleaned.displaySize}</span></div>
            <div className="spec-row"><span>Main Camera</span><span>{data.cleaned.mainCamera}</span></div>
            <div className="spec-row"><span>Battery</span><span>{data.cleaned.batteryType}</span></div>
            <div className="spec-row"><span>Price</span><span>{data.cleaned.priceRaw}</span></div>
          </div>
        </>
      )}
    </div>
  );
}