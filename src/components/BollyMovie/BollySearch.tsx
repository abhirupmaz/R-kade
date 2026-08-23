import React, { useState, useRef, useEffect } from 'react';
import { BollyMovie } from '../../types';
import { searchMovies } from '../../services/bollyMovies';
import { Search, X } from 'lucide-react';

interface BollySearchProps {
  onSelect: (movie: BollyMovie) => void;
  disabled?: boolean;
  guessedIds: Set<string>;
}

export const BollySearch: React.FC<BollySearchProps> = ({ onSelect, disabled, guessedIds }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BollyMovie[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 1) {
      const matches = searchMovies(query, 8).filter((m) => !guessedIds.has(m.id));
      setResults(matches);
      setShowDropdown(matches.length > 0);
      setHighlightIdx(-1);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [query, guessedIds]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (movie: BollyMovie) => {
    onSelect(movie);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIdx]);
    }
  };

  return (
    <div className="bolly-search-container">
      <div className={`bolly-search-input-wrap ${disabled ? 'disabled' : ''}`}>
        <Search size={16} className="bolly-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="bolly-search-input"
          placeholder="Search a Bollywood movie..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 1 && results.length > 0 && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {query && (
          <button
            className="bolly-search-clear"
            onClick={() => { setQuery(''); setShowDropdown(false); inputRef.current?.focus(); }}
            type="button"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="bolly-search-dropdown" ref={dropdownRef}>
          {results.map((movie, i) => (
            <button
              key={movie.id}
              className={`bolly-search-option ${i === highlightIdx ? 'highlighted' : ''}`}
              onClick={() => handleSelect(movie)}
              onMouseEnter={() => setHighlightIdx(i)}
              type="button"
            >
              <span className="bolly-option-name">{movie.name}</span>
              <span className="bolly-option-meta">{movie.year} · {movie.director}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
