export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';

export type GameStatus = 'IN_PROGRESS' | 'WON' | 'LOST';

export type GameMode = 'DAILY' | 'PRACTICE';

export interface EvaluatedLetter {
  letter: string;
  status: LetterStatus;
  isDeceptive?: boolean; // For Glitch Mirage curse
}

export interface GuessEvaluation {
  letters: EvaluatedLetter[];
  isCorrect: boolean;
}

export type CurseId =
  | 'ECHO_ONE'
  | 'ECHO_TWO'
  | 'ALPHA_LINK'
  | 'OUROBOROS'
  | 'GLITCH_MIRAGE'
  | 'OVERLOAD_TIMER'
  | 'VOWEL_BAN'
  | 'ANCHOR_SLOT';

export interface ActiveCurseState {
  id: CurseId;
  name: string;
  icon: string;
  shortRule: string;
  description: string;
  flavor: string;
  bannedLetter?: string;
  timeLimit?: number; // In seconds (e.g. 30)
  timeRemaining?: number;
  deceptiveIndex?: number;
}

export interface DailyWordleRecord {
  dateKey: string; // YYYY-MM-DD
  dayNumber: number;
  word: string;
  guesses: string[];
  evaluations: EvaluatedLetter[][];
  status: GameStatus;
  completedAt?: string;
  attemptsUsed: number;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string | null;
  lastWonDate: string | null;
  guessDistribution: { [key: number]: number }; // 1 to 6
  practiceGamesPlayed: number;
  practiceGamesWon: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string; // emoji or avatar id
  level: number;
  xp: number;
  streak: number;
  maxStreak: number;
  stats: UserStats;
  themeColor: string;
  soundEnabled: boolean;
  highContrast: boolean;
}

export type ActiveTab = 'hub' | 'wordle' | 'stats' | 'profile';

export interface ArcadeGameInfo {
  id: string;
  title: string;
  tagline: string;
  icon: string;
  badge?: string;
  status: 'ACTIVE' | 'COMING_SOON';
  accentColor: string;
  category: string;
  description: string;
}
