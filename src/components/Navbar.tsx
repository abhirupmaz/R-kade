import React from 'react';
import { Home, BarChart3, User } from 'lucide-react';
import { ActiveTab } from '../types';
import { sound } from '../services/audio';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  const handleTabClick = (tab: ActiveTab) => {
    sound.playKeyTap();
    onSelectTab(tab);
  };

  return (
    <nav className="bottom-nav" aria-label="Main Navigation">
      <button
        className={`nav-item ${activeTab === 'hub' ? 'active' : ''}`}
        onClick={() => handleTabClick('hub')}
        aria-label="Home"
      >
        {activeTab === 'hub' && <div className="nav-indicator" />}
        <span className="nav-icon"><Home size={20} /></span>
        <span>Home</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
        onClick={() => handleTabClick('stats')}
        aria-label="Player Statistics and Streaks"
      >
        {activeTab === 'stats' && <div className="nav-indicator" />}
        <span className="nav-icon"><BarChart3 size={20} /></span>
        <span>Stats</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => handleTabClick('profile')}
        aria-label="Player Profile"
      >
        {activeTab === 'profile' && <div className="nav-indicator" />}
        <span className="nav-icon"><User size={20} /></span>
        <span>Profile</span>
      </button>
    </nav>
  );
};
