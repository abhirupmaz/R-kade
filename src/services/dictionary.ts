import { EvaluatedLetter, GuessEvaluation } from '../types';
import { TARGET_WORDS, ALL_VALID_WORDS } from './wordList';

export { TARGET_WORDS, ALL_VALID_WORDS };

// Create a Set of all 12,972 allowable words for instantaneous O(1) lookups
const VALID_SET = new Set<string>(ALL_VALID_WORDS);

/**
 * Check if word is a legitimate 5-letter English word in the comprehensive dictionary
 */
export function isValidWord(word: string): boolean {
  if (!word || word.length !== 5) return false;
  return VALID_SET.has(word.toUpperCase());
}

/**
 * Standard Wordle Day 0 anchor (January 1, 2024)
 */
const WORDLE_EPOCH = new Date(2024, 0, 1).getTime();

export interface DailyWordInfo {
  word: string;
  dayNumber: number;
  dateKey: string; // YYYY-MM-DD
}

/**
 * Get daily word deterministically based on date
 */
export function getDailyWordInfo(targetDate: Date = new Date()): DailyWordInfo {
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const dateKey = `${year}-${month}-${day}`;

  const currentMid = new Date(year, targetDate.getMonth(), targetDate.getDate()).getTime();
  const diffDays = Math.floor((currentMid - WORDLE_EPOCH) / (1000 * 60 * 60 * 24));
  const dayNumber = Math.max(1, diffDays + 1);

  // Deterministic index calculation from the 2,315 curated target words
  const wordIndex = Math.abs((dayNumber * 7919 + 1013) % TARGET_WORDS.length);
  const word = TARGET_WORDS[wordIndex].toUpperCase();

  return {
    word,
    dayNumber,
    dateKey
  };
}

/**
 * Get random word for Practice Mode
 */
export function getRandomTargetWord(): string {
  const randomIndex = Math.floor(Math.random() * TARGET_WORDS.length);
  return TARGET_WORDS[randomIndex].toUpperCase();
}

/**
 * Strict Wordle letter matching algorithm.
 * 1. Letter matches target in exact spot -> 'correct' (green)
 * 2. Letters present in remaining available spots -> 'present' (yellow)
 * 3. Remaining letters -> 'absent' (gray)
 */
export function evaluateGuess(guess: string, target: string): GuessEvaluation {
  const upperGuess = guess.toUpperCase();
  const upperTarget = target.toUpperCase();
  
  const result: EvaluatedLetter[] = Array(5).fill(null).map((_, i) => ({
    letter: upperGuess[i] || '',
    status: 'absent'
  }));

  if (upperGuess.length !== 5 || upperTarget.length !== 5) {
    return { letters: result, isCorrect: false };
  }

  // Count available letters in target
  const targetLetterCounts: { [char: string]: number } = {};
  for (const char of upperTarget) {
    targetLetterCounts[char] = (targetLetterCounts[char] || 0) + 1;
  }

  // Step 1: Find all greens (correct position)
  for (let i = 0; i < 5; i++) {
    if (upperGuess[i] === upperTarget[i]) {
      result[i].status = 'correct';
      targetLetterCounts[upperGuess[i]]--;
    }
  }

  // Step 2: Find all yellows (present in other positions up to available count)
  for (let i = 0; i < 5; i++) {
    if (result[i].status !== 'correct') {
      const char = upperGuess[i];
      if (targetLetterCounts[char] && targetLetterCounts[char] > 0) {
        result[i].status = 'present';
        targetLetterCounts[char]--;
      } else {
        result[i].status = 'absent';
      }
    }
  }

  const isCorrect = upperGuess === upperTarget;
  return { letters: result, isCorrect };
}

/**
 * Generates Wordle share emoji grid text
 */
export function generateShareGrid(
  dayNumber: number,
  evaluations: EvaluatedLetter[][],
  status: 'WON' | 'LOST',
  streak: number,
  mode: 'DAILY' | 'PRACTICE'
): string {
  const attempts = status === 'WON' ? evaluations.length : 'X';
  const header = mode === 'DAILY' 
    ? `🕹️ R-KADE Wordle #${dayNumber} ${attempts}/6 🔥 Streak: ${streak}` 
    : `🕹️ R-KADE Wordle (Practice) ${attempts}/6`;

  const rows = evaluations.map(row => {
    return row.map(cell => {
      if (cell.status === 'correct') return '🟩';
      if (cell.status === 'present') return '🟨';
      return '⬛';
    }).join('');
  }).join('\n');

  return `${header}\n\n${rows}\n\nPlay at: R-KADE`;
}
