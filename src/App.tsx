import { useState, useEffect, useCallback } from 'react';
import { ActiveTab, UserProfile, DailyWordleRecord } from './types';
import { getStoredProfile, saveProfile, getDailyRecord } from './services/storage';
import { getDailyWordInfo } from './services/dictionary';
import { sound } from './services/audio';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { ArcadeHub } from './components/ArcadeHub';
import { WordleGame } from './components/Wordle/WordleGame';
import { BollyGame } from './components/BollyMovie/BollyGame';
import { ProfileModal } from './components/Profile/ProfileModal';
import { StatsModal } from './components/Stats/StatsModal';
import { QrCodeModal } from './components/QrCodeModal';
import { Toast, ToastMessage } from './components/Toast';

import './styles/App.css';
import './styles/Wordle.css';
import './styles/BollyMovie.css';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hub');
  const [profile, setProfile] = useState<UserProfile>(() => getStoredProfile());
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [isImpactShaking, setIsImpactShaking] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync sound engine enabled flag with profile
  useEffect(() => {
    sound.setEnabled(profile.soundEnabled);
  }, [profile.soundEnabled]);

  const triggerImpactShake = () => {
    setIsImpactShaking(true);
    setTimeout(() => setIsImpactShaking(false), 420);
  };

  // Daily record lookup
  const dailyInfo = getDailyWordInfo();
  const todayRecord: DailyWordleRecord | null = getDailyRecord(dailyInfo.dateKey);

  // Toast helper (memoized)
  const showToast = useCallback((text: string, icon?: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    const newToast: ToastMessage = { id, text, icon };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
  }, []);

  const handleToggleSound = () => {
    const updated: UserProfile = {
      ...profile,
      soundEnabled: !profile.soundEnabled,
    };
    setProfile(updated);
    saveProfile(updated);
    showToast(updated.soundEnabled ? 'Sound Enabled' : 'Sound Muted', updated.soundEnabled ? '🔊' : '🔇');
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setProfile(updated);
  };

  return (
    <div className={`app-container ${isImpactShaking ? 'impact-shake' : ''}`}>
      {/* Toast Notification Container */}
      <Toast toasts={toasts} />

      {/* Arcade Shell Header */}
      <Header
        profile={profile}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenStats={() => setShowStatsModal(true)}
        onOpenQrCode={() => setShowQrModal(true)}
        onToggleSound={handleToggleSound}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'hub' && (
          <ArcadeHub
            profile={profile}
            todayRecord={todayRecord}
            onLaunchWordle={() => setActiveTab('wordle')}
            onLaunchBolly={() => setActiveTab('bolly')}
            onOpenStats={() => setShowStatsModal(true)}
            onOpenQrCode={() => setShowQrModal(true)}
          />
        )}

        {activeTab === 'wordle' && (
          <WordleGame
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onShowToast={showToast}
            onImpactShake={triggerImpactShake}
          />
        )}

        {activeTab === 'bolly' && (
          <BollyGame
            onShowToast={showToast}
            onImpactShake={triggerImpactShake}
          />
        )}

        {activeTab === 'stats' && (
          <div style={{ padding: 16 }}>
            <StatsModal
              profile={profile}
              onClose={() => setActiveTab('hub')}
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={{ padding: 16 }}>
            <ProfileModal
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onClose={() => setActiveTab('hub')}
              onShowToast={showToast}
            />
          </div>
        )}
      </main>

      {/* Profile Modal when triggered from header */}
      {showProfileModal && (
        <ProfileModal
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onClose={() => setShowProfileModal(false)}
          onShowToast={showToast}
        />
      )}

      {/* Stats Modal when triggered from header */}
      {showStatsModal && (
        <StatsModal
          profile={profile}
          onClose={() => setShowStatsModal(false)}
        />
      )}

      {/* QR Code Modal for Mobile Phone Testing */}
      {showQrModal && (
        <QrCodeModal
          onClose={() => setShowQrModal(false)}
          onShowToast={showToast}
        />
      )}

      {/* Bottom Navigation */}
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}

export default App;
