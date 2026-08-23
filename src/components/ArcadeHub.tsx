import React from 'react';
import { Play, CheckCircle2, Flame, Sparkles, Smartphone, HelpCircle, Shuffle, Clapperboard } from 'lucide-react';
import { DailyWordleRecord, UserProfile } from '../types';
import { sound } from '../services/audio';

interface ArcadeHubProps {
  profile: UserProfile;
  todayRecord: DailyWordleRecord | null;
  onLaunchWordle: (mode?: 'DAILY' | 'PRACTICE') => void;
  onLaunchBolly: () => void;
  onOpenStats: () => void;
  onOpenQrCode: () => void;
}

export const ArcadeHub: React.FC<ArcadeHubProps> = ({
  profile,
  todayRecord,
  onLaunchWordle,
  onLaunchBolly,
  onOpenStats,
  onOpenQrCode,
}) => {
  const isTodayCompleted = todayRecord && (todayRecord.status === 'WON' || todayRecord.status === 'LOST');

  return (
    <div className="hub-view">
      {/* Featured Daily Wordle Hero Banner */}
      <div className="hub-hero">
        <div className="hero-glow-orb" />
        
        <div className="hero-header">
          <span className="hero-tag">
            <Sparkles size={12} /> Daily Challenge
          </span>
          <div className="hero-streak-badge" onClick={onOpenStats} role="button" tabIndex={0}>
            <Flame size={14} color="#f59e0b" fill="#f59e0b" />
            <span>{profile.streak} Day Streak</span>
          </div>
        </div>

        <h2 className="hero-title">Word-Kade Wordle</h2>
        <p className="hero-desc">
          5 blank letters. 6 attempts. Clues update in real time with duplicate frequency checks and mobile haptic feedback.
        </p>

        <button 
          className={`hero-cta-btn ${isTodayCompleted ? 'completed' : ''}`}
          onClick={() => {
            sound.playKeyTap();
            onLaunchWordle('DAILY');
          }}
        >
          {isTodayCompleted ? (
            <>
              <CheckCircle2 size={18} />
              <span>View Today's Result</span>
            </>
          ) : (
            <>
              <Play size={18} fill="#04101e" />
              <span>Play Daily Challenge</span>
            </>
          )}
        </button>
      </div>

      {/* Practice Arena Card */}
      <div
        className="game-card active-game"
        onClick={() => {
          sound.playKeyTap();
          onLaunchWordle('PRACTICE');
        }}
        style={{ cursor: 'pointer' }}
      >
        <div className="game-card-left">
          <div className="game-card-icon" style={{ borderColor: 'rgba(217, 70, 239, 0.4)', background: 'rgba(217, 70, 239, 0.1)' }}>
            <Shuffle size={22} color="#d946ef" />
          </div>
          <div className="game-card-info">
            <h4>Practice Mode</h4>
            <p>Unlimited rounds to sharpen your skills anytime</p>
          </div>
        </div>
        <div className="game-card-right">
          <span className="badge-tag badge-active" style={{ background: 'rgba(217, 70, 239, 0.2)', color: '#f472b6', borderColor: 'rgba(217, 70, 239, 0.4)' }}>
            Unlimited
          </span>
        </div>
      </div>

      {/* What's the Bolly Movie? Game Card */}
      <div
        className="game-card active-game"
        onClick={() => {
          sound.playKeyTap();
          onLaunchBolly();
        }}
        style={{ cursor: 'pointer', borderColor: 'rgba(245, 158, 11, 0.35)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(15, 23, 42, 0.6))' }}
      >
        <div className="game-card-left">
          <div className="game-card-icon" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.12)' }}>
            <Clapperboard size={22} color="#f59e0b" />
          </div>
          <div className="game-card-info">
            <h4 style={{ color: '#fbbf24' }}>What's the Bolly Movie?</h4>
            <p>Guess the Bollywood movie in 7 tries using clues</p>
          </div>
        </div>
        <div className="game-card-right">
          <span className="badge-tag badge-active" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
            NEW
          </span>
        </div>
      </div>

      {/* Test on Phone / Mobile QR Card */}
      <div
        className="game-card active-game"
        onClick={() => {
          sound.playKeyTap();
          onOpenQrCode();
        }}
        style={{ cursor: 'pointer', borderColor: 'rgba(0, 240, 255, 0.4)', background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.08), rgba(15, 23, 42, 0.6))' }}
      >
        <div className="game-card-left">
          <div className="game-card-icon" style={{ borderColor: 'var(--accent-cyan)', background: 'rgba(0, 240, 255, 0.15)' }}>
            <Smartphone size={22} color="var(--accent-cyan)" />
          </div>
          <div className="game-card-info">
            <h4 style={{ color: 'var(--accent-cyan)' }}>Test on Your Phone</h4>
            <p>Scan QR code or connect over Wi-Fi for mobile haptics</p>
          </div>
        </div>
        <div className="game-card-right">
          <span className="badge-tag badge-active">
            Scan QR
          </span>
        </div>
      </div>

      {/* How to Play Clues Guide */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
          <HelpCircle size={16} color="var(--accent-cyan)" />
          <span>How To Play</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
              W
            </div>
            <span><strong>Green</strong>: Letter is in the word and in the correct spot.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
              I
            </div>
            <span><strong>Yellow</strong>: Letter is in the word but in the wrong spot.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
              N
            </div>
            <span><strong>Gray</strong>: Letter is not in the secret word at all.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
