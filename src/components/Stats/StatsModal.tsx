import React from 'react';
import { X, BarChart2, Zap } from 'lucide-react';
import { UserProfile } from '../../types';

interface StatsModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ profile, onClose }) => {
  const { stats } = profile;
  const winPercent = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

  // Compute maximum count in guess distribution for bar chart scaling
  const maxGuessCount = Math.max(1, ...Object.values(stats.guessDistribution));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <h2 className="modal-title">
          <BarChart2 size={20} color="var(--accent-cyan)" />
          <span>Player Statistics</span>
        </h2>

        {/* 4 Stat Overview Blocks */}
        <div className="stats-summary-grid">
          <div className="stat-box">
            <div className="stat-value">{stats.gamesPlayed}</div>
            <div className="stat-label">Played</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{winPercent}%</div>
            <div className="stat-label">Win Rate</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: '#fbbf24' }}>
              {stats.currentStreak}
            </div>
            <div className="stat-label">🔥 Current</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: '#34d399' }}>
              {stats.maxStreak}
            </div>
            <div className="stat-label">🏆 Max</div>
          </div>
        </div>

        {/* Guess Distribution Bar Chart */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Guess Distribution
          </div>

          <div className="guess-dist-container">
            {[1, 2, 3, 4, 5, 6].map((guessNum) => {
              const count = stats.guessDistribution[guessNum] || 0;
              const percentage = Math.max(7, Math.round((count / maxGuessCount) * 100));
              const isTop = count > 0 && count === maxGuessCount;

              return (
                <div key={guessNum} className="guess-row">
                  <span className="guess-row-num">{guessNum}</span>
                  <div className="guess-bar-wrap">
                    <div
                      className={`guess-bar ${isTop ? 'highlight' : ''}`}
                      style={{ width: `${percentage}%` }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Arcade Level & Practice Stats */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Practice Mode Solves
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 2 }}>
              {stats.practiceGamesWon} / {stats.practiceGamesPlayed} won
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Arcade Rank
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-cyan)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={14} /> Level {profile.level}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
