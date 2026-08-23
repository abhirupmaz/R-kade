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
import { RefreshCw, Trophy, XCircle, Clapperboard, Film } from 'lucide-react';

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
      onImpactShake?.();
      onShowToast(
        `Wrong! ${MAX_GUESSES - newResults.length} guess${MAX_GUESSES - newResults.length === 1 ? '' : 'es'} left`,
        '🎬'
      );
    }
  }, [gameStatus, targetMovie, guessResults, onShowToast, onImpactShake]);

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
    </div>
  );
};
