import { DailyWordleRecord, UserProfile, UserStats } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'rkade_user_profile_v1',
  DAILY_RECORDS: 'rkade_daily_records_v1',
  PRACTICE_RECORD: 'rkade_practice_state_v1',
  ACTIVE_PROFILE_ID: 'rkade_active_profile_id_v1',
  SETTINGS: 'rkade_settings_v1',
};

export const DEFAULT_AVATARS = ['👾', '🕹️', '⚡', '🦊', '🤖', '🚀', '👑', '🔥', '🐯', '💎', '🎮', '🦄'];

export const INITIAL_STATS: UserStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: null,
  lastWonDate: null,
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  practiceGamesPlayed: 0,
  practiceGamesWon: 0,
};

export const INITIAL_PROFILE: UserProfile = {
  id: 'profile_default',
  name: 'CyberPlayer',
  avatar: '🕹️',
  level: 1,
  xp: 0,
  streak: 0,
  maxStreak: 0,
  stats: INITIAL_STATS,
  themeColor: '#00f0ff',
  soundEnabled: true,
  highContrast: false,
};

/**
 * Get the current user profile from LocalStorage
 */
export function getStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      saveProfile(INITIAL_PROFILE);
      return INITIAL_PROFILE;
    }
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_PROFILE,
      ...parsed,
      stats: {
        ...INITIAL_STATS,
        ...(parsed.stats || {}),
        guessDistribution: {
          ...INITIAL_STATS.guessDistribution,
          ...(parsed.stats?.guessDistribution || {})
        }
      }
    };
  } catch (e) {
    console.error('Error loading stored profile', e);
    return INITIAL_PROFILE;
  }
}

/**
 * Save user profile to LocalStorage
 */
export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile', e);
  }
}

/**
 * Get all stored daily records
 */
export function getDailyRecords(): { [dateKey: string]: DailyWordleRecord } {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_RECORDS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Error loading daily records', e);
    return {};
  }
}

/**
 * Get specific daily record by date key (YYYY-MM-DD)
 */
export function getDailyRecord(dateKey: string): DailyWordleRecord | null {
  const records = getDailyRecords();
  return records[dateKey] || null;
}

/**
 * Save daily record
 */
export function saveDailyRecord(record: DailyWordleRecord): void {
  try {
    const records = getDailyRecords();
    records[record.dateKey] = record;
    localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving daily record', e);
  }
}

/**
 * Helper to get yesterday's date key in YYYY-MM-DD
 */
function getYesterdayDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  const prevY = date.getFullYear();
  const prevM = String(date.getMonth() + 1).padStart(2, '0');
  const prevD = String(date.getDate()).padStart(2, '0');
  return `${prevY}-${prevM}-${prevD}`;
}

/**
 * Update Profile Stats after a Daily Game completion
 */
export function recordDailyGameResult(
  dateKey: string,
  won: boolean,
  attempts: number
): UserProfile {
  const profile = getStoredProfile();
  const stats = { ...profile.stats };

  // Only update streak & stats if not already recorded as played for this dateKey
  if (stats.lastPlayedDate === dateKey) {
    return profile;
  }

  stats.gamesPlayed += 1;
  stats.lastPlayedDate = dateKey;

  const yesterdayKey = getYesterdayDateKey(dateKey);

  if (won) {
    stats.gamesWon += 1;
    if (stats.guessDistribution[attempts] !== undefined) {
      stats.guessDistribution[attempts] += 1;
    } else {
      stats.guessDistribution[attempts] = 1;
    }

    // Streak calculation:
    // If lastWonDate was yesterday -> continue streak
    // If streak is 0 or lastWonDate is older than yesterday -> reset streak to 1
    if (stats.lastWonDate === yesterdayKey) {
      stats.currentStreak += 1;
    } else if (stats.lastWonDate === dateKey) {
      // already won today (safety check)
    } else {
      stats.currentStreak = 1;
    }

    stats.lastWonDate = dateKey;

    if (stats.currentStreak > stats.maxStreak) {
      stats.maxStreak = stats.currentStreak;
    }

    // XP calculation: 100 base + bonus for fewer guesses + streak bonus
    const guessBonus = (7 - attempts) * 25;
    const streakBonus = Math.min(stats.currentStreak * 10, 100);
    const xpGained = 100 + guessBonus + streakBonus;
    
    profile.xp += xpGained;
    profile.level = Math.floor(profile.xp / 300) + 1;
  } else {
    // Loss resets current daily streak to 0
    stats.currentStreak = 0;
    // Small participation XP
    profile.xp += 25;
    profile.level = Math.floor(profile.xp / 300) + 1;
  }

  profile.streak = stats.currentStreak;
  profile.maxStreak = stats.maxStreak;
  profile.stats = stats;

  saveProfile(profile);
  return profile;
}

/**
 * Update stats for Practice game
 */
export function recordPracticeGameResult(won: boolean): UserProfile {
  const profile = getStoredProfile();
  const stats = { ...profile.stats };

  stats.practiceGamesPlayed += 1;
  if (won) {
    stats.practiceGamesWon += 1;
    profile.xp += 30;
    profile.level = Math.floor(profile.xp / 300) + 1;
  } else {
    profile.xp += 10;
  }

  profile.stats = stats;
  saveProfile(profile);
  return profile;
}

/**
 * Reset all user data
 */
export function resetAllStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.DAILY_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.PRACTICE_RECORD);
    saveProfile(INITIAL_PROFILE);
  } catch (e) {
    console.error('Error resetting storage', e);
  }
}
