import React, { useState, useEffect } from 'react';
import { Trophy, X, Share2, RefreshCw, ExternalLink } from 'lucide-react';
import { GameMode, EvaluatedLetter, UserProfile } from '../../types';
import { generateShareGrid } from '../../services/dictionary';
import { sound } from '../../services/audio';

interface GameOverModalProps {
  status: 'WON' | 'LOST';
  targetWord: string;
  dayNumber: number;
  mode: GameMode;
  evaluations: EvaluatedLetter[][];
  profile: UserProfile;
  onClose: () => void;
  onPlayAgainPractice?: () => void;
  onShowToast: (message: string, icon?: string) => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  targetWord,
  dayNumber,
  mode,
  evaluations,
  profile,
  onClose,
  onPlayAgainPractice,
  onShowToast,
}) => {
  const isWon = status === 'WON';
  const attempts = isWon ? evaluations.length : 6;

  // Countdown to next UTC midnight / next daily puzzle
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShare = async () => {
    sound.playKeyTap();
    const shareText = generateShareGrid(
      dayNumber,
      evaluations,
      status,
      profile.streak,
      mode
    );

    try {
      if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
        await navigator.share({
          title: 'R-KADE Wordle',
          text: shareText,
        });
        onShowToast('Shared successfully!', '✨');
      } else {
        await navigator.clipboard.writeText(shareText);
        onShowToast('Score copied to clipboard!', '📋');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareText);
        onShowToast('Score copied to clipboard!', '📋');
      } catch {
        onShowToast('Could not copy to clipboard', '⚠️');
      }
    }
  };

  const openDictionary = () => {
    window.open(`https://www.google.com/search?q=define+${targetWord.toLowerCase()}`, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {/* Modal Status Header */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          {isWon ? (
            <>
              <div className="gameover-badge won">
                <Trophy size={14} /> Victory Achieved
              </div>
              <h2 className="modal-title" style={{ justifyContent: 'center', fontSize: 24 }}>
                Outstanding Solve!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                You solved Wordle #{dayNumber} in <strong>{attempts} / 6</strong> guesses.
              </p>
            </>
          ) : (
            <>
              <div className="gameover-badge lost">
                Game Over
              </div>
              <h2 className="modal-title" style={{ justifyContent: 'center', fontSize: 24 }}>
                Out of Turns
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Better luck next time! Keep up your practice.
              </p>
            </>
          )}
        </div>

        {/* Revealed Secret Word */}
        <div className="word-reveal-box">
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            The Secret Word Was
          </div>
          <div className="word-reveal-text">{targetWord}</div>
          <button className="word-meaning-link" onClick={openDictionary}>
            Search definition <ExternalLink size={11} style={{ display: 'inline', marginLeft: 2 }} />
          </button>
        </div>

        {/* Streak & Stats Highlights */}
        {mode === 'DAILY' && (
          <div className="stats-summary-grid" style={{ marginBottom: 16 }}>
            <div className="stat-box">
              <div className="stat-value">{profile.streak}</div>
              <div className="stat-label">🔥 Streak</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{profile.maxStreak}</div>
              <div className="stat-label">Max Streak</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">
                {profile.stats.gamesPlayed > 0 
                  ? Math.round((profile.stats.gamesWon / profile.stats.gamesPlayed) * 100) 
                  : 0}%
              </div>
              <div className="stat-label">Win Rate</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{profile.stats.gamesPlayed}</div>
              <div className="stat-label">Played</div>
            </div>
          </div>
        )}

        {/* Next Daily Wordle Countdown */}
        {mode === 'DAILY' && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            textAlign: 'center',
            marginBottom: 16
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Next Daily Wordle in
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {timeLeft || '00:00:00'}
            </div>
          </div>
        )}

        {/* Actions */}
        <button className="share-score-btn" onClick={handleShare}>
          <Share2 size={18} />
          <span>Share Score Grid</span>
        </button>

        {mode === 'PRACTICE' && onPlayAgainPractice && (
          <button className="secondary-action-btn" onClick={onPlayAgainPractice} style={{ marginTop: 8 }}>
            <RefreshCw size={16} />
            <span>Play Another Word</span>
          </button>
        )}
      </div>
    </div>
  );
};
