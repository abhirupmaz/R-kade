import React, { useState } from 'react';
import { X, User, Save, RotateCcw, Volume2, Vibrate, BellOff } from 'lucide-react';
import { UserProfile } from '../../types';
import { DEFAULT_AVATARS, saveProfile, resetAllStorage } from '../../services/storage';
import { sound } from '../../services/audio';

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

  const handleToggle = (key: 'soundEnabled' | 'hapticsEnabled' | 'showCursePopups') => {
    sound.playKeyTap();
    const updated: UserProfile = { ...profile, [key]: !profile[key] };
    onUpdateProfile(updated);
    saveProfile(updated);
  };

  const badges = [
    { title: '3-Day Fire', req: 3, icon: '🔥', unlocked: profile.maxStreak >= 3 },
    { title: '7-Day Spark', req: 7, icon: '⚡', unlocked: profile.maxStreak >= 7 },
    { title: '14-Day Crown', req: 14, icon: '👑', unlocked: profile.maxStreak >= 14 },
    { title: '30-Day Legend', req: 30, icon: '💎', unlocked: profile.maxStreak >= 30 },
  ];

  const settingRow = (
    icon: React.ReactNode,
    label: string,
    sublabel: string,
    checked: boolean,
    onChange: () => void
  ) => (
    <div className="setting-row" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0', borderBottom: '1px solid var(--border-subtle)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--accent-cyan)', opacity: 0.8 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sublabel}</div>
        </div>
      </div>
      <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{
          position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
          background: checked ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
          borderRadius: 24, transition: '0.3s',
          boxShadow: checked ? '0 0 8px rgba(0,240,255,0.4)' : 'none'
        }}>
          <span style={{
            position: 'absolute', height: 18, width: 18, left: checked ? 23 : 3, bottom: 3,
            background: '#fff', borderRadius: '50%', transition: '0.3s'
          }} />
        </span>
      </label>
    </div>
  );

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

          {/* Settings Section */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '4px 14px',
            marginBottom: 18,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', padding: '10px 0 4px' }}>
              Settings
            </div>
            {settingRow(
              <Volume2 size={16} />,
              'Sound Effects',
              'Keyboard clicks, win / lose sounds',
              profile.soundEnabled,
              () => handleToggle('soundEnabled')
            )}
            {settingRow(
              <Vibrate size={16} />,
              'Haptic Feedback',
              'Vibration on mobile devices',
              profile.hapticsEnabled,
              () => handleToggle('hapticsEnabled')
            )}
            {settingRow(
              <BellOff size={16} />,
              'Curse Popups',
              'Fullscreen splash when a curse activates',
              profile.showCursePopups,
              () => handleToggle('showCursePopups')
            )}
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
