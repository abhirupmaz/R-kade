import React from 'react';
import { BollyGuessResult, BollyClueStatus } from '../../types';
import { ArrowUp, ArrowDown, Check, Minus } from 'lucide-react';

interface BollyGridProps {
  guessResults: BollyGuessResult[];
  maxGuesses: number;
}

const ClueCell: React.FC<{
  label: string;
  status: BollyClueStatus;
  value: string;
  subValue?: string;
  icon?: React.ReactNode;
  delay: number;
}> = ({ label, status, value, subValue, icon, delay }) => {
  return (
    <div
      className={`bolly-clue-cell ${status}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="bolly-clue-label">{label}</span>
      <div className="bolly-clue-value">
        {icon && <span className="bolly-clue-icon">{icon}</span>}
        <span>{value}</span>
      </div>
      {subValue && <span className="bolly-clue-sub">{subValue}</span>}
    </div>
  );
};

export const BollyGrid: React.FC<BollyGridProps> = ({ guessResults, maxGuesses }) => {
  return (
    <div className="bolly-grid">
      {guessResults.map((result, rowIdx) => {
        const { movie, clues } = result;
        const isLatest = rowIdx === guessResults.length - 1;
        const baseDelay = isLatest ? 80 : 0;

        // Year direction icon
        let yearIcon: React.ReactNode = <Check size={13} />;
        if (clues.year === 'wrong' || clues.year === 'partial') {
          yearIcon = clues.yearDirection === 'higher'
            ? <ArrowUp size={13} />
            : <ArrowDown size={13} />;
        }

        // Genre sub-value
        const genreSub = clues.genre === 'partial' && clues.genreMatches.length > 0
          ? `Matched: ${clues.genreMatches.join(', ')}`
          : undefined;

        // Cast sub-value
        const castSub = clues.cast === 'partial' && clues.castMatches.length > 0
          ? `Matched: ${clues.castMatches.join(', ')}`
          : undefined;

        return (
          <div
            key={`${movie.id}-${rowIdx}`}
            className={`bolly-guess-row ${isLatest ? 'reveal' : ''}`}
          >
            <div className="bolly-guess-movie-name">
              <span className="bolly-guess-number">#{rowIdx + 1}</span>
              <span className="bolly-guess-title">{movie.name}</span>
            </div>
            <div className="bolly-clue-grid">
              <ClueCell
                label="Year"
                status={clues.year}
                value={String(movie.year)}
                icon={yearIcon}
                delay={baseDelay}
              />
              <ClueCell
                label="Genre"
                status={clues.genre}
                value={movie.genre.join(', ')}
                subValue={genreSub}
                icon={clues.genre === 'correct' ? <Check size={13} /> : <Minus size={13} />}
                delay={baseDelay + 100}
              />
              <ClueCell
                label="Director"
                status={clues.director}
                value={movie.director}
                icon={clues.director === 'correct' ? <Check size={13} /> : <Minus size={13} />}
                delay={baseDelay + 200}
              />
              <ClueCell
                label="Cast"
                status={clues.cast}
                value={movie.cast.slice(0, 3).join(', ')}
                subValue={castSub}
                icon={clues.cast === 'correct' ? <Check size={13} /> : <Minus size={13} />}
                delay={baseDelay + 300}
              />
            </div>
          </div>
        );
      })}

      {/* Empty remaining slots */}
      {Array.from({ length: maxGuesses - guessResults.length }).map((_, i) => (
        <div key={`empty-${i}`} className="bolly-guess-row empty">
          <div className="bolly-guess-movie-name">
            <span className="bolly-guess-number">#{guessResults.length + i + 1}</span>
            <span className="bolly-guess-title empty-title">?</span>
          </div>
        </div>
      ))}
    </div>
  );
};
