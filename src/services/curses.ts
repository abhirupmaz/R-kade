import { ActiveCurseState, CurseId, EvaluatedLetter } from '../types';

export interface CurseValidationResult {
  valid: boolean;
  reason?: string;
  progressText: string;
  isComplete: boolean;
}

export interface CurseHistoryEntry {
  attemptNumber: number; // 1-based
  curse: ActiveCurseState;
  satisfied: boolean; // Did player satisfy it or was it bypassed?
}

const ALL_CURSE_TEMPLATES: {
  id: CurseId;
  name: string;
  icon: string;
  shortRule: (prevGuess: string, opt?: string) => string;
  description: (prevGuess: string, opt?: string) => string;
  example: (prevGuess: string, opt?: string) => string;
  flavor: string;
  // Return false if this curse would make it IMPOSSIBLE to ever guess the target word
  isFair: (prevGuess: string, targetWord: string, opt?: string, prevHits?: number) => boolean;
}[] = [
  {
    id: 'ECHO_ONE',
    name: 'Echo Fragment',
    icon: '🔮',
    shortRule: (prev) => `Use at least 1 letter from "${prev}"`,
    description: (prev) => `Your next guess must contain at least 1 letter from "${prev}".`,
    example: (prev) => {
      const letter = prev[0];
      return `e.g. if your guess was "${prev}", your next word must include "${letter}" somewhere.`;
    },
    flavor: 'A whisper from your past attempt lingers in the void.',
    isFair: () => true,
  },
  {
    id: 'ECHO_TWO',
    name: 'Twin Chains',
    icon: '⛓️',
    shortRule: (prev) => `Use at least 2 letters from "${prev}"`,
    description: (prev) => `Your next guess must include at least 2 letters from "${prev}".`,
    example: (prev) => {
      const l1 = prev[0];
      const l2 = prev[1];
      return `e.g. if your guess was "${prev}", your next word must include both "${l1}" and "${l2}" (or any 2 from "${prev}").`;
    },
    flavor: 'Two phantom glyphs bind your next move.',
    // Only activate when the previous guess had ≥ 2 hits (green + yellow letters)
    isFair: (_prev, _target, _opt, prevHits) => (prevHits ?? 0) >= 2,
  },
  {
    id: 'ALPHA_LINK',
    name: 'Alpha Link',
    icon: '⚡',
    shortRule: (prev) => `Must start with "${prev[0]}"`,
    description: (prev) => `Your next guess MUST begin with "${prev[0]}".`,
    example: (prev) => `e.g. if your guess was "${prev}", your next word must start with "${prev[0]}" — like "${prev[0]}LARK" or "${prev[0]}RAVE".`,
    flavor: 'The opening rune is forged in stone.',
    isFair: (prev, target) => target[0] === prev[0],
  },
  {
    id: 'OUROBOROS',
    name: 'Ouroboros',
    icon: '🔁',
    shortRule: (prev) => `Must start with "${prev[prev.length - 1]}"`,
    description: (prev) => `Your next guess MUST start with "${prev[prev.length - 1]}" — the last letter of your previous guess.`,
    example: (prev) => {
      const last = prev[prev.length - 1];
      return `e.g. your guess "${prev}" ended in "${last}", so your next word must start with "${last}" — like "${last}RAVE" or "${last}LOOM".`;
    },
    flavor: 'The serpent consumes its own tail.',
    isFair: (prev, target) => target[0] === prev[prev.length - 1],
  },
  {
    id: 'GLITCH_MIRAGE',
    name: 'Glitch Mirage',
    icon: '🎭',
    shortRule: () => 'Your NEXT guess result will have 1 false color tile',
    description: () =>
      'After you submit your NEXT guess, one random tile in the result will show a WRONG color. You will not know which tile is lying.',
    example: () =>
      'e.g. a tile that should be 🟩 Green may appear 🟨 Yellow or ⬛ Gray — trust your other clues!',
    flavor: 'A deceptive mirage alters your reality.',
    isFair: () => true,
  },
  {
    id: 'OVERLOAD_TIMER',
    name: 'Overload Pulse',
    icon: '⏱️',
    shortRule: () => '45s Countdown! Submit or your previous word repeats',
    description: () =>
      'You have 45 seconds to submit your next guess. If time runs out, your previous guess repeats automatically and wastes a turn!',
    example: () => 'The timer starts now. Type fast and submit before it hits zero!',
    flavor: 'The core is unstable. Think fast.',
    isFair: () => true,
  },
  {
    id: 'VOWEL_BAN',
    name: 'Forbidden Rune',
    icon: '🚫',
    shortRule: (_, opt) => `Forbidden letter: "${opt || 'E'}"`,
    description: (_, opt) => `Forbidden from using the letter "${opt || 'E'}" this guess.`,
    example: (_, opt) => {
      const banned = opt || 'E';
      return `e.g. you cannot type "${banned}" anywhere in your next guess. Plan your word around this restriction.`;
    },
    flavor: 'An ancient seal locks away a sacred letter.',
    isFair: (_, target, opt) => !target.includes((opt || 'E').toUpperCase()),
  },
  {
    id: 'ANCHOR_SLOT',
    name: 'Anchor Slot',
    icon: '🎯',
    shortRule: (prev) => `Must match 1 exact position with "${prev}"`,
    description: (prev) => `Must share at least one exact letter-slot as "${prev}".`,
    example: (prev) => {
      const l = prev[0];
      return `e.g. if your guess was "${prev}", your next word must have "${l}" in position 1, OR "${prev[1]}" in position 2, etc.`;
    },
    flavor: 'An immutable coordinate anchors your guess.',
    isFair: (prev, target) => {
      for (let i = 0; i < Math.min(prev.length, target.length); i++) {
        if (prev[i] === target[i]) return true;
      }
      return false;
    },
  },
];

/**
 * Deterministic hash from string for daily consistency
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Pick a banned letter for VOWEL_BAN that isn't in the target word
 */
function pickFairBannedLetter(
  targetWord: string,
  dateKey: string,
  attemptIndex: number,
  mode: 'DAILY' | 'PRACTICE'
): string | undefined {
  const candidates = ['E', 'A', 'R', 'I', 'O', 'T', 'N', 'S', 'L', 'C', 'D', 'P'];
  const absent = candidates.filter((l) => !targetWord.includes(l));
  if (absent.length === 0) return undefined;
  if (mode === 'DAILY') {
    const idx = simpleHash(`${dateKey}_vowel_${attemptIndex}`) % absent.length;
    return absent[idx];
  }
  return absent[Math.floor(Math.random() * absent.length)];
}

/**
 * Count how many letters in prevGuess are hits (green or yellow) in prevEvaluation
 */
function countPrevHits(prevEvaluation: EvaluatedLetter[]): number {
  return prevEvaluation.filter(
    (e) => e.status === 'correct' || e.status === 'present'
  ).length;
}

/**
 * Generate the active curse for a given attempt index (0 to 5)
 * - Attempt 0 (Guess 1): null
 * - Attempt 1..4 (Guess 2..5): fair curse (filtered against targetWord)
 * - Attempt 5 (Guess 6): null ("Final Stand")
 *
 * prevEvaluation is the color result of prevGuess so we can gate ECHO_TWO.
 */
export function getCurseForAttempt(
  attemptIndex: number,
  dateKey: string,
  prevGuess: string,
  mode: 'DAILY' | 'PRACTICE',
  targetWord: string,
  prevEvaluation: EvaluatedLetter[] = []
): ActiveCurseState | null {
  if (attemptIndex === 0) return null;
  if (attemptIndex >= 5) return null;
  if (!prevGuess || prevGuess.length < 5) return null;

  const prevUpper = prevGuess.toUpperCase();
  const targetUpper = targetWord.toUpperCase();

  const prevHits = countPrevHits(prevEvaluation);

  // Build the fair subset of curse templates for this context
  const fairBannedLetter = pickFairBannedLetter(targetUpper, dateKey, attemptIndex, mode);

  const fairTemplates = ALL_CURSE_TEMPLATES.filter((t) => {
    const opt = t.id === 'VOWEL_BAN' ? fairBannedLetter : undefined;
    if (t.id === 'VOWEL_BAN' && !fairBannedLetter) return false;
    return t.isFair(prevUpper, targetUpper, opt, prevHits);
  });

  if (fairTemplates.length === 0) return null;

  let selectedIndex = 0;
  if (mode === 'DAILY') {
    const seed = `${dateKey}_curse_attempt_${attemptIndex}`;
    const hash = simpleHash(seed);
    selectedIndex = hash % fairTemplates.length;
  } else {
    selectedIndex = Math.floor(Math.random() * fairTemplates.length);
  }

  const template = fairTemplates[selectedIndex];

  let bannedLetter: string | undefined = undefined;
  if (template.id === 'VOWEL_BAN') {
    bannedLetter = fairBannedLetter;
  }

  let timeLimit: number | undefined = undefined;
  if (template.id === 'OVERLOAD_TIMER') {
    timeLimit = 45; // Updated from 30 to 45 seconds
  }

  let deceptiveIndex: number | undefined = undefined;
  if (template.id === 'GLITCH_MIRAGE') {
    deceptiveIndex = mode === 'DAILY'
      ? simpleHash(`${dateKey}_deceptive_${attemptIndex}`) % 5
      : Math.floor(Math.random() * 5);
  }

  return {
    id: template.id,
    name: template.name,
    icon: template.icon,
    shortRule: template.shortRule(prevUpper, bannedLetter),
    description: template.description(prevUpper, bannedLetter),
    example: template.example(prevUpper, bannedLetter),
    flavor: template.flavor,
    bannedLetter,
    timeLimit,
    timeRemaining: timeLimit,
    deceptiveIndex,
  };
}

/**
 * Validate a candidate guess against the active curse requirement
 */
export function validateCurse(
  curse: ActiveCurseState | null,
  guess: string,
  prevGuess: string
): CurseValidationResult {
  if (!curse) {
    return { valid: true, progressText: '', isComplete: true };
  }

  const guessUpper = guess.toUpperCase();
  const prevUpper = (prevGuess || '').toUpperCase();
  const prevLetters = Array.from(new Set(prevUpper.split('')));

  switch (curse.id) {
    case 'ECHO_ONE': {
      const common = prevLetters.filter((l) => guessUpper.includes(l));
      const isComplete = common.length >= 1;
      const progressText = isComplete
        ? `✓ ${common.length} letter${common.length > 1 ? 's' : ''} matched (${common.join(', ')})`
        : `0/1 previous letters used`;
      return {
        valid: isComplete,
        reason: isComplete ? undefined : `Must use at least 1 letter from "${prevUpper}"`,
        progressText,
        isComplete,
      };
    }

    case 'ECHO_TWO': {
      const common = prevLetters.filter((l) => guessUpper.includes(l));
      const isComplete = common.length >= 2;
      const progressText = isComplete
        ? `✓ ${common.length}/2 letters matched (${common.join(', ')})`
        : `${common.length}/2 previous letters used`;
      return {
        valid: isComplete,
        reason: isComplete ? undefined : `Must use at least 2 letters from "${prevUpper}"`,
        progressText,
        isComplete,
      };
    }

    case 'ALPHA_LINK': {
      const req = prevUpper[0];
      const isComplete = guessUpper.startsWith(req);
      return {
        valid: isComplete,
        reason: isComplete ? undefined : `Must start with "${req}"`,
        progressText: isComplete ? `✓ Starts with '${req}'` : `Must start with '${req}'`,
        isComplete,
      };
    }

    case 'OUROBOROS': {
      const req = prevUpper[prevUpper.length - 1];
      const isComplete = guessUpper.startsWith(req);
      return {
        valid: isComplete,
        reason: isComplete ? undefined : `Must start with "${req}" (last letter of "${prevUpper}")`,
        progressText: isComplete ? `✓ Starts with '${req}'` : `Must start with '${req}'`,
        isComplete,
      };
    }

    case 'VOWEL_BAN': {
      const banned = (curse.bannedLetter || 'E').toUpperCase();
      const containsBanned = guessUpper.includes(banned);
      const isComplete = !containsBanned;
      return {
        valid: isComplete,
        reason: isComplete ? undefined : `Contains forbidden letter "${banned}"`,
        progressText: isComplete ? `✓ No '${banned}' used` : `❌ Contains forbidden '${banned}'`,
        isComplete,
      };
    }

    case 'ANCHOR_SLOT': {
      const matchedSlots: number[] = [];
      for (let i = 0; i < Math.min(guessUpper.length, prevUpper.length); i++) {
        if (guessUpper[i] === prevUpper[i]) matchedSlots.push(i + 1);
      }
      const isComplete = matchedSlots.length >= 1;
      return {
        valid: isComplete,
        reason: isComplete ? undefined : `Must place at least 1 letter at the same slot as in "${prevUpper}"`,
        progressText: isComplete ? `✓ Slot ${matchedSlots.join(', ')} anchored` : `0/1 slot matched`,
        isComplete,
      };
    }

    case 'GLITCH_MIRAGE':
    case 'OVERLOAD_TIMER':
    default:
      return { valid: true, progressText: 'Active', isComplete: true };
  }
}
