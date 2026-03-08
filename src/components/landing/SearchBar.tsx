"use client"

import React from 'react';

interface SearchBarProps {
  searchTerm: string;
  placeholderText: string;
  hasError: boolean;
  searchError: string;
  isValidating: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  buttonText: string;
  style?: React.CSSProperties;
}

export default function SearchBar({
  searchTerm,
  placeholderText,
  hasError,
  searchError,
  isValidating,
  onInputChange,
  onSearch,
  buttonText,
  style,
}: SearchBarProps) {
  return (
    <>
      <div className={`search-bar ${hasError ? 'search-bar--error' : ''}`} role="search" style={style}>
        <div className="search-bar__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="10" cy="10" r="7"/>
            <line x1="15.5" y1="15.5" x2="21" y2="21"/>
          </svg>
        </div>
        <input
          className="search-bar__input"
          type="text"
          placeholder={placeholderText}
          aria-label="Consultar CNPJ ou nome da empresa"
          value={searchTerm}
          onChange={onInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSearch();
            }
          }}
        />
        <button
          className="search-bar__button"
          type="submit"
          onClick={onSearch}
          disabled={isValidating}
        >
          {buttonText}
        </button>
      </div>
      {searchError && (
        <p className="caption text-danger mt-3" style={{ textAlign: 'center' }}>
          {searchError}
        </p>
      )}
    </>
  );
}
