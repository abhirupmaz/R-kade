import React, { useState } from 'react';
import { X, User, Save, RotateCcw } from 'lucide-react';
import { UserProfile } from '../../types';
import { DEFAULT_AVATARS, saveProfile, resetAllStorage } from '../../services/storage';
import { sound } from '../../services/audio';
import { haptics } from '../../services/haptics';

interface ProfileModalProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onClose: () => void;
  onShowToast: (message: string, icon?: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onUpdateProfile,
  onClose,
  onShowToast,
}) => {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [confirmReset, setConfirmReset] = useState(false);

  // XP Calculation
  const currentLevelXp = (profile.level - 1) * 300;
  const progressInLevel = profile.xp - currentLevelXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((progressInLevel / 300) * 100)));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playKeyTap();

    const trimmed = name.trim() || 'Player';
    const updated: UserProfile = {
      ...profile,
      name: trimmed,
      avatar,
    };

    saveProfile(updated);
    onUpdateProfile(updated);
    onShowToast('Profile updated!', '✨');
    onClose();
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    sound.playKeyDelete();
    resetAllStorage();
    window.location.reload();
  };

  const badges = [
    { title: '3-Day Fire', req: 3, icon: '🔥', unlocked: profile.maxStreak >= 3 },
    { title: '7-Day Spark', req: 7, icon: '⚡', unlocked: profile.maxStreak >= 7 },
    { title: '14-Day Crown', req: 14, icon: '👑', unlocked: profile.maxStreak >= 14 },
    { title: '30-Day Legend', req: 30, icon: '💎', unlocked: profile.maxStreak >= 30 },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <h2 className="modal-title">
          <User size={20} color="var(--accent-cyan)" />
          <span>Player Profile</span>
        </h2>

        {/* Big Avatar Preview */}
        <div className="profile-avatar-large">{avatar}</div>

        {/* Level & XP Bar */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: 18,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: 'var(--accent-cyan)' }}>Level {profile.level} Arcade Veteran</span>
            <span style={{ color: 'var(--text-muted)' }}>{progressInLevel} / 300 XP</span>
          </div>
          <div style={{ width: '100%', height: 8, background: 'var(--bg-elevated)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))',
              borderRadius: 999,
              transition: 'width 0.4s'
            }} />
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="input-field-group">
            <label htmlFor="username">Player Display Name</label>
            <input
              id="username"
              type="text"
              className="text-input"
              value={name}
              maxLength={16}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. PixelRunner"
            />
          </div>

          <div className="input-field-group">
            <label>Choose Your Avatar</label>
            <div className="avatar-grid">
              {DEFAULT_AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  className={`avatar-option-btn ${avatar === av ? 'selected' : ''}`}
                  onClick={() => {
                    sound.playKeyTap();
                    setAvatar(av);
                  }}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Streak Milestone Badges */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>
              Streak Badges
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {badges.map((b) => (
                <div
                  key={b.title}
                  style={{
                    background: b.unlocked ? 'rgba(0, 240, 255, 0.08)' : 'var(--bg-surface)',
                    border: `1px solid ${b.unlocked ? 'rgba(0, 240, 255, 0.4)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: b.unlocked ? 1 : 0.5
                  }}
                >
                  <span style={{ fontSize: 18 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: b.unlocked ? '#fff' : 'var(--text-muted)' }}>
                      {b.title}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {b.unlocked ? 'Unlocked' : `Requires ${b.req}d streak`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Haptics & Vibration Testing Panel */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: 18,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Mobile Haptics & Touch Test
              </span>
              <button
                type="button"
                className="header-btn"
                style={{ width: 'auto', padding: '4px 10px', height: 28, fontSize: 11, fontWeight: 700, gap: 4, background: 'rgba(0, 240, 255, 0.15)', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                onClick={() => {
                  haptics.vibrateError();
                  onShowToast('Vibration pulse triggered!', '📳');
                }}
              >
                <span>Test Vibration 📳</span>
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              💡 <strong>Android</strong>: Check that <em>Touch Feedback</em> is enabled in system Sound Settings.<br />
              💡 <strong>iPhone</strong>: Turn off the physical Silent switch for sub-bass tactile clicks.
            </p>
          </div>

          <button type="submit" className="hero-cta-btn" style={{ marginBottom: 12 }}>
            <Save size={16} />
            <span>Save Profile</span>
          </button>
        </form>

        {/* Data Reset Button */}
        <button
          type="button"
          onClick={handleReset}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: 12,
            fontWeight: 600,
            color: confirmReset ? '#ef4444' : 'var(--text-muted)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          <RotateCcw size={13} />
          <span>{confirmReset ? 'Tap again to confirm full reset' : 'Reset player data'}</span>
        </button>
      </div>
    </div>
  );
};
