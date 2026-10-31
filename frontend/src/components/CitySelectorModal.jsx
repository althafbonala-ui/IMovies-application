import React, { useState } from 'react';
import { CITIES } from '../data/mockMovies';

function CitySelectorModal({ isOpen, onClose, selectedCity, onSelectCity }) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredCities = CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="modal-dialog-custom p-4" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f84464" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <h5 className="fw-bold mb-0 text-white">Select Your City</h5>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-secondary text-light border-0" 
            onClick={onClose}
            aria-label="Close"
            style={{ fontSize: '1.25rem', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Search input */}
        <div className="mb-4">
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: '1.2rem' }}
            placeholder="Search for your city (e.g. Anantapur, Hyderabad)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Popular Cities */}
        <div className="mb-4">
          <div className="text-secondary small fw-semibold text-uppercase mb-2" style={{ letterSpacing: '0.08em' }}>
            Popular Cities
          </div>
          <div className="d-flex flex-wrap gap-2">
            {CITIES.filter((c) => c.popular).map((city) => {
              const isSelected = selectedCity.id === city.id;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    onSelectCity(city);
                    onClose();
                  }}
                  className={`btn btn-sm ${
                    isSelected
                      ? 'btn-danger'
                      : 'btn-outline-secondary text-light border-secondary border-opacity-25'
                  } rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2`}
                  style={{
                    backgroundColor: isSelected ? '#f84464' : 'rgba(255,255,255,0.04)',
                    borderColor: isSelected ? '#f84464' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  {city.name === 'Anantapur' && <span>⭐</span>}
                  <span>{city.name}</span>
                  {isSelected && <span className="small">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* All / Filtered Cities */}
        <div>
          <div className="text-secondary small fw-semibold text-uppercase mb-2" style={{ letterSpacing: '0.08em' }}>
            {searchQuery ? 'Search Results' : 'All Regional Locations'}
          </div>
          <div className="list-group list-group-flush border-top border-secondary border-opacity-25">
            {filteredCities.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => {
                  onSelectCity(city);
                  onClose();
                }}
                className="list-group-item list-group-item-action bg-transparent text-light border-secondary border-opacity-25 d-flex justify-content-between align-items-center py-2 px-1"
              >
                <div>
                  <span className="fw-medium text-white">{city.name}</span>
                  <span className="text-secondary small ms-2">({city.state})</span>
                  {city.name === 'Anantapur' && (
                    <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-50 ms-2 small">
                      Current Hub
                    </span>
                  )}
                </div>
                {selectedCity.id === city.id && <span className="text-danger fw-bold">✓ Selected</span>}
              </button>
            ))}
            {filteredCities.length === 0 && (
              <div className="text-center py-4 text-secondary small">
                No cities found matching "{searchQuery}".
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CitySelectorModal;
