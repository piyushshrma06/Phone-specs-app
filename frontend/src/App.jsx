// App.jsx
// Simple screen-based state machine: 'brands' -> 'phones' -> 'detail'
// No router library needed for an app this size.

import { useState } from 'react';
import BrandList from './components/BrandList';
import PhoneList from './components/PhoneList';
import PhoneDetail from './components/PhoneDetail';
import Header from './components/Header';
import './App.css';

function App() {
  const [screen, setScreen] = useState('brands');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState(null);

  function handleSelectBrand(brandSlug, brandName) {
    setSelectedBrand({ slug: brandSlug, name: brandName });
    setScreen('phones');
  }

  function handleSelectPhone(slug) {
    setSelectedSlug(slug);
    setScreen('detail');
  }

  function handleBackToPhoneList() {
    setScreen('phones');
  }

  function handleBackToBrands() {
    setScreen('brands');
    setSelectedBrand(null);
  }

  return (
    <div className="app">
      <Header />
      {screen === 'brands' && <BrandList onSelectBrand={handleSelectBrand} />}
      {screen === 'phones' && selectedBrand && (
        <PhoneList
          brandSlug={selectedBrand.slug}
          brandName={selectedBrand.name}
          onSelectPhone={handleSelectPhone}
          onBack={handleBackToBrands}
        />
      )}
      {screen === 'detail' && selectedSlug && (
        <PhoneDetail slug={selectedSlug} onBack={handleBackToPhoneList} />
      )}
    </div>
  );
}

export default App;