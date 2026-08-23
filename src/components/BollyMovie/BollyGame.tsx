import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BollyMovie, BollyGuessResult, GameStatus } from '../../types';
import {
  getDailyBollyMovie,
  getRandomBollyMovie,
  evaluateBollyGuess,
  isBollyCorrect,
} from '../../services/bollyMovies';
import { BollySearch } from './BollySearch';
import { BollyGrid } from './BollyGrid';
import { sound } from '../../services/audio';
import { haptics } from '../../services/haptics';
import confetti from 'canvas-confetti';
import { RefreshCw, Trophy, XCircle, Clapperboard, Film, HelpCircle } from 'lucide-react';

const MAX_GUESSES = 7;

interface BollyGameProps {
  onShowToast: (text: string, icon?: string) => void;
  onImpactShake?: () => void;
}

export const BollyGame: React.FC<BollyGameProps> = ({ onShowToast, onImpactShake }) => {
  const [mode, setMode] = useState<'DAILY' | 'PRACTICE'>('DAILY');
  const [targetMovie, setTargetMovie] = useState<BollyMovie>(() => getDailyBollyMovie());
  const [guessResults, setGuessResults] = useState<BollyGuessResult[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('IN_PROGRESS');
  const [showGameOver, setShowGameOver] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const guessedIdsRef = useRef<Set<string>>(new Set());

  const initGame = useCallback((targetMode: 'DAILY' | 'PRACTICE') => {
    setMode(targetMode);
    setGuessResults([]);
    setGameStatus('IN_PROGRESS');
    setShowGameOver(false);
    guessedIdsRef.current = new Set();

    if (targetMode === 'DAILY') {
      setTargetMovie(getDailyBollyMovie());
    } else {
      setTargetMovie(getRandomBollyMovie());
    }
  }, []);

  // Load daily state from localStorage
  useEffect(() => {
    initGame('DAILY');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectMovie = useCallback((movie: BollyMovie) => {
    if (gameStatus !== 'IN_PROGRESS') return;

    // Prevent duplicate guesses
    if (guessedIdsRef.current.has(movie.id)) {
      onShowToast('Already guessed!', '⚠️');
      return;
    }
    guessedIdsRef.current.add(movie.id);

    const result = evaluateBollyGuess(movie, targetMovie);
    const isCorrect = isBollyCorrect(movie, targetMovie);
    const newResults = [...guessResults, result];
    setGuessResults(newResults);

    if (isCorrect) {
      setGameStatus('WON');
      sound.playWin();
      haptics.vibrateWin();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#d946ef', '#10b981', '#00f0ff'],
      });
      setTimeout(() => setShowGameOver(true), 800);
    } else if (newResults.length >= MAX_GUESSES) {
      setGameStatus('LOST');
      sound.playLoss();
      haptics.vibrateLoss();
      onImpactShake?.();
      setTimeout(() => setShowGameOver(true), 600);
    } else {
      // Wrong guess feedback
      sound.playError();
      haptics.vibrateWrongGuess();
      
      const guessesLeft = MAX_GUESSES - newResults.length;
      if (guessesLeft <= 3) {
        onShowToast(
          `Wrong! ${guessesLeft} guess${guessesLeft === 1 ? '' : 'es'} left`,
          '🎬'
        );
      }
    }
  }, [gameStatus, targetMovie, guessResults, onShowToast]);

  return (
    <div className="bolly-game-container">
      {/* Top Bar */}
      <div className="bolly-top-bar">
        <div className="mode-toggle-group">
          <button
            className={`mode-btn ${mode === 'DAILY' ? 'active' : ''}`}
            onClick={() => { sound.playKeyTap(); initGame('DAILY'); }}
          >
            <span>Daily</span>
          </button>
          <button
            className={`mode-btn ${mode === 'PRACTICE' ? 'active' : ''}`}
            onClick={() => { sound.playKeyTap(); initGame('PRACTICE'); }}
          >
            <span>Practice</span>
          </button>
          <button
            className="mode-btn"
            style={{ padding: '0 8px' }}
            onClick={() => { sound.playKeyTap(); setShowHelpModal(true); }}
            aria-label="How to play"
          >
            <HelpCircle size={16} />
          </button>
        </div>

        {mode === 'PRACTICE' && (
          <button
            className="header-btn"
            style={{ width: 'auto', padding: '0 10px', fontSize: 11, fontWeight: 700, gap: 4 }}
            onClick={() => { sound.playKeyTap(); initGame('PRACTICE'); onShowToast('New movie loaded!', '🎲'); }}
          >
            <RefreshCw size={12} />
            <span>New Movie</span>
          </button>
        )}
      </div>

      {/* Game Title */}
      <div className="bolly-title-section">
        <div className="bolly-title-icon">
          <Clapperboard size={24} />
        </div>
        <div className="bolly-title-text">
          <h2>What's the Bolly Movie?</h2>
          <p>Guess the movie in {MAX_GUESSES} tries using clues</p>
        </div>
      </div>

      {/* Search Bar */}
      <BollySearch
        onSelect={handleSelectMovie}
        disabled={gameStatus !== 'IN_PROGRESS'}
        guessedIds={guessedIdsRef.current}
      />

      {/* Clue Grid */}
      <BollyGrid
        guessResults={guessResults}
        maxGuesses={MAX_GUESSES}
      />

      {/* Answer reveal when lost */}
      {gameStatus === 'LOST' && (
        <div style={{ textAlign: 'center', marginTop: 12, padding: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, color: '#f87171', fontWeight: 800, letterSpacing: 1 }}>
          THE MOVIE WAS: {targetMovie.name.toUpperCase()} ({targetMovie.year})
        </div>
      )}

      {/* Game Over Modal */}
      {showGameOver && (
        <div className="modal-overlay" onClick={() => setShowGameOver(false)}>
          <div className="modal-card bolly-game-over-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowGameOver(false)}>✕</button>

            <div className="bolly-gameover-header">
              {gameStatus === 'WON' ? (
                <>
                  <Trophy size={44} color="#f59e0b" />
                  <h3>Nailed it! 🎬</h3>
                  <p>You guessed <strong>{targetMovie.name}</strong> in {guessResults.length} tries!</p>
                </>
              ) : (
                <>
                  <XCircle size={44} color="#ef4444" />
                  <h3>Better luck next time!</h3>
                  <p>The movie was <strong>{targetMovie.name}</strong> ({targetMovie.year})</p>
                </>
              )}
            </div>

            <div className="bolly-gameover-details">
              <div className="bolly-detail-row">
                <Film size={14} />
                <span><strong>Director:</strong> {targetMovie.director}</span>
              </div>
              <div className="bolly-detail-row">
                <span>🎭</span>
                <span><strong>Genre:</strong> {targetMovie.genre.join(', ')}</span>
              </div>
              <div className="bolly-detail-row">
                <span>⭐</span>
                <span><strong>Cast:</strong> {targetMovie.cast.slice(0, 4).join(', ')}</span>
              </div>
              {targetMovie.overview && (
                <p className="bolly-overview-text">"{targetMovie.overview}"</p>
              )}
            </div>

            {mode === 'PRACTICE' && (
              <button
                className="hero-cta-btn"
                style={{ marginTop: 16 }}
                onClick={() => { setShowGameOver(false); initGame('PRACTICE'); }}
              >
                Play Again
              </button>
            )}
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="modal-overlay" onClick={() => setShowHelpModal(false)} style={{ zIndex: 100 }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380, padding: 24 }}>
            <button className="modal-close-btn" onClick={() => setShowHelpModal(false)}>✕</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 18, fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)' }}>
              <HelpCircle size={20} color="#fbbf24" />
              <span>How To Play Bolly Movie</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Guess the Bollywood movie in 7 tries. Search for a movie, and the grid will give you clues based on Year, Genre, Director, and Cast.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(16, 185, 129, 0.4)', flexShrink: 0 }} />
                <span><strong>Green</strong>: Exact match for this clue.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', flexShrink: 0 }} />
                <span><strong>Yellow</strong>: Partial match. Year is within 3 years, or some Genres/Cast match.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(100, 116, 139, 0.12)', border: '1px solid rgba(100, 116, 139, 0.2)', flexShrink: 0 }} />
                <span><strong>Gray</strong>: No match for this clue.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
