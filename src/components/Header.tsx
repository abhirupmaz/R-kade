import React from 'react';
import { Volume2, VolumeX, Flame } from 'lucide-react';
import { UserProfile } from '../types';
import { sound } from '../services/audio';

interface HeaderProps {
  profile: UserProfile;
  onOpenProfile: () => void;
  onOpenStats: () => void;
  onToggleSound: () => void;
  onSelectTab: (tab: 'hub' | 'wordle' | 'stats' | 'profile' | 'bolly') => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onOpenProfile,
  onOpenStats,
  onToggleSound,
  onSelectTab,
}) => {
  const handleSoundClick = () => {
    sound.playKeyTap();
    onToggleSound();
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div 
          className="logo-badge" 
          onClick={() => onSelectTab('hub')}
          role="button" 
          tabIndex={0}
        >
          <div className="logo-icon-wrap">🕹️</div>
          <span className="logo-text">R-KADE</span>
        </div>
      </div>

      <div className="header-right">
        {/* Daily Streak Pill */}
        <button 
          className="streak-pill" 
          onClick={() => {
            sound.playKeyTap();
            onOpenStats();
          }}
          title="Daily Streak"
          aria-label={`Current Streak: ${profile.streak} days`}
        >
          <Flame className="streak-flame" size={16} color="#f59e0b" fill="#f59e0b" />
          <span>{profile.streak}</span>
        </button>

        {/* Audio Toggle */}
        <button 
          className="header-btn" 
          onClick={handleSoundClick}
          title={profile.soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          aria-label="Sound Toggle"
        >
          {profile.soundEnabled ? (
            <Volume2 size={18} color="var(--accent-cyan)" />
          ) : (
            <VolumeX size={18} color="var(--text-muted)" />
          )}
        </button>

        {/* Profile Avatar Trigger */}
        <button 
          className="header-btn avatar-btn" 
          onClick={() => {
            sound.playKeyTap();
            onOpenProfile();
          }}
          title="Player Profile"
          aria-label="Profile Settings"
        >
          {profile.avatar}
        </button>
      </div>
    </header>
  );
};
