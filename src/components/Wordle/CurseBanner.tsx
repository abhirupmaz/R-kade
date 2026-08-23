import React, { useState } from 'react';
import { ActiveCurseState } from '../../types';
import { CurseValidationResult } from '../../services/curses';
import { HelpCircle, ShieldCheck, Zap } from 'lucide-react';

interface CurseBannerProps {
  attemptIndex: number; // 0 to 5 (0 = 1st guess, 5 = 6th guess)
  activeCurse: ActiveCurseState | null;
  validation: CurseValidationResult;
  timerSeconds?: number;
  totalTimerSeconds?: number;
}

export const CurseBanner: React.FC<CurseBannerProps> = ({
  attemptIndex,
  activeCurse,
  validation,
  timerSeconds,
  totalTimerSeconds = 30,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);

  // Attempt 1 (Index 0): Initial turn
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

  // Attempt 6 (Index 5): Final Stand
  if (attemptIndex >= 5 || !activeCurse) {
    return (
      <div className="curse-banner final-stand">
        <div className="curse-banner-left">
          <span className="curse-icon-pill shield">
            <ShieldCheck size={15} />
          </span>
          <div className="curse-info">
            <span className="curse-name" style={{ color: '#fbbf24' }}>Final Stand — Curse Lifted!</span>
            <span className="curse-desc">The curse has broken. Pure skill on your final shot.</span>
          </div>
        </div>
      </div>
    );
  }

  // Active Curse (Attempts 2 through 5)
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
