import React, { useState } from 'react';
import { ActiveCurseState, GameStatus } from '../../types';
import { CurseValidationResult, CurseHistoryEntry } from '../../services/curses';
import { HelpCircle, ShieldCheck, Zap, ScrollText } from 'lucide-react';

interface CurseBannerProps {
  attemptIndex: number; // 0 to 5 (0 = 1st guess, 5 = 6th guess)
  activeCurse: ActiveCurseState | null;
  validation: CurseValidationResult;
  timerSeconds?: number;
  totalTimerSeconds?: number;
  curseHistory?: CurseHistoryEntry[];
  gameStatus?: GameStatus;
}

export const CurseBanner: React.FC<CurseBannerProps> = ({
  attemptIndex,
  activeCurse,
  validation,
  timerSeconds,
  totalTimerSeconds = 30,
  curseHistory = [],
  gameStatus,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);

  const isGameOver = gameStatus === 'WON' || gameStatus === 'LOST';

  // --- GAME OVER: Show Curse Recap ---
  if (isGameOver) {
    if (curseHistory.length === 0) {
      return null; // No curses, no banner needed
    }
    return (
      <>
        <div className="curse-banner final-stand" style={{ cursor: 'pointer' }} onClick={() => setShowModal(true)}>
          <div className="curse-banner-left">
            <span className="curse-icon-pill shield">
              <ScrollText size={14} />
            </span>
            <div className="curse-info">
              <span className="curse-name" style={{ color: '#a78bfa' }}>Curse Recap</span>
              <span className="curse-desc">
                {curseHistory.length} curse{curseHistory.length !== 1 ? 's' : ''} encountered —{' '}
                {curseHistory.filter((e) => e.satisfied).length} overcome
              </span>
            </div>
          </div>
          <div className="curse-banner-right">
            <div className="curse-status-pill valid">
              <span>View</span>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-card curse-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>

              <div className="curse-modal-header">
                <span className="curse-modal-icon">📜</span>
                <div className="curse-modal-tag">GAME CHRONICLE</div>
                <h3 className="curse-modal-title">Curses This Run</h3>
              </div>

              <div className="curse-modal-body">
                {curseHistory.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                    No curses were activated this game.
                  </p>
                ) : (
                  <div className="curse-history-list">
                    {curseHistory.map((entry, i) => (
                      <div
                        key={i}
                        className={`curse-history-entry ${entry.satisfied ? 'satisfied' : 'failed'}`}
                      >
                        <div className="curse-history-meta">
                          <span className="curse-history-icon">{entry.curse.icon}</span>
                          <div className="curse-history-info">
                            <span className="curse-history-name">{entry.curse.name}</span>
                            <span className="curse-history-rule">{entry.curse.shortRule}</span>
                          </div>
                        </div>
                        <div className="curse-history-badge">
                          <span className="curse-history-attempt">Guess {entry.attemptNumber}</span>
                          <span className={`curse-history-status ${entry.satisfied ? 'won' : 'lost'}`}>
                            {entry.satisfied ? '✓ Overcome' : '✗ Skipped'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="curse-recap-summary">
                  <span>
                    {curseHistory.filter((e) => e.satisfied).length}/{curseHistory.length} curses overcome
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="hero-cta-btn"
                style={{ marginTop: 16 }}
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // --- TURN 1 (Index 0): No curses yet ---
  if (attemptIndex === 0) {
    return (
      <div className="curse-banner calibration">
        <div className="curse-banner-left">
          <span className="curse-icon-pill">
            <Zap size={13} className="curse-zap-icon" />
          </span>
          <div className="curse-info">
            <span className="curse-name">Turn 1: Clean Slate</span>
            <span className="curse-desc">Arcade Curses will awaken on Turn 2!</span>
          </div>
        </div>
      </div>
    );
  }

  // --- TURN 6 (Index 5) or no curse (was filtered as unfair): Final Stand ---
  if (attemptIndex >= 5 || !activeCurse) {
    return (
      <div className="curse-banner final-stand">
        <div className="curse-banner-left">
          <span className="curse-icon-pill shield">
            <ShieldCheck size={15} />
          </span>
          <div className="curse-info">
            <span className="curse-name" style={{ color: '#fbbf24' }}>
              {attemptIndex >= 5 ? 'Final Stand — Curse Lifted!' : 'Fair Play — No Curse This Turn'}
            </span>
            <span className="curse-desc">
              {attemptIndex >= 5
                ? 'The curse has broken. Pure skill on your final shot.'
                : 'No valid curse could be applied fairly to this turn.'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE CURSE (Attempts 2 through 5) ---
  const isTimerCurse = activeCurse.id === 'OVERLOAD_TIMER';
  const isUrgent = isTimerCurse && (timerSeconds ?? 30) <= 10;
  const timerPercent = isTimerCurse && timerSeconds !== undefined
    ? Math.max(0, Math.min(100, (timerSeconds / totalTimerSeconds) * 100))
    : 100;

  return (
    <>
      <div className={`curse-banner active ${validation.isComplete ? 'satisfied' : 'pending'} ${isUrgent ? 'urgent' : ''}`}>
        <div className="curse-banner-left">
          <span className="curse-icon-pill main">
            <span className="curse-emoji">{activeCurse.icon}</span>
          </span>

          <div className="curse-info">
            <div className="curse-title-row">
              <span className="curse-badge-tag">CURSE {attemptIndex} / 4</span>
              <span className="curse-name">{activeCurse.name}</span>
            </div>
            <span className="curse-desc">{activeCurse.shortRule}</span>
          </div>
        </div>

        <div className="curse-banner-right">
          {isTimerCurse && timerSeconds !== undefined ? (
            <div className={`curse-timer-badge ${isUrgent ? 'urgent' : ''}`}>
              <span>⏱️ {timerSeconds}s</span>
            </div>
          ) : (
            <div className={`curse-status-pill ${validation.isComplete ? 'valid' : 'incomplete'}`}>
              <span>{validation.progressText || (validation.isComplete ? '✓ Ready' : 'Pending')}</span>
            </div>
          )}

          <button
            type="button"
            className="curse-help-btn"
            onClick={() => setShowModal(true)}
            aria-label="Curse Details"
          >
            <HelpCircle size={14} />
          </button>
        </div>

        {/* Overload Timer Progress Bar */}
        {isTimerCurse && (
          <div className="curse-timer-bar-wrap">
            <div
              className={`curse-timer-bar-fill ${isUrgent ? 'urgent' : ''}`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Curse Detail Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card curse-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>

            <div className="curse-modal-header">
              <span className="curse-modal-icon">{activeCurse.icon}</span>
              <div className="curse-modal-tag">ACTIVE MODIFIER</div>
              <h3 className="curse-modal-title">{activeCurse.name}</h3>
            </div>

            <div className="curse-modal-body">
              <div className="curse-rule-box">
                <strong>Requirement:</strong> {activeCurse.description}
              </div>

              <p className="curse-flavor-text">
                "{activeCurse.flavor}"
              </p>

              <div className="curse-status-box">
                <span className="curse-status-label">Current Status:</span>
                <span className={`curse-status-val ${validation.isComplete ? 'complete' : 'pending'}`}>
                  {validation.isComplete ? '✓ Condition Met' : '⚠️ Must satisfy to submit'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="hero-cta-btn"
              style={{ marginTop: 16 }}
              onClick={() => setShowModal(false)}
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};
