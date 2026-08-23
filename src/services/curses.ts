import { ActiveCurseState, CurseId } from '../types';

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
  flavor: string;
  // Return false if this curse would make it IMPOSSIBLE to ever guess the target word
  isFair: (prevGuess: string, targetWord: string, opt?: string) => boolean;
}[] = [
  {
    id: 'ECHO_ONE',
    name: 'Echo Fragment',
    icon: '🔮',
    shortRule: (prev) => `Use at least 1 letter from "${prev}"`,
    description: (prev) => `The void echoes: Your next guess must contain at least 1 letter from "${prev}".`,
    flavor: 'A whisper from your past attempt lingers in the void.',
    // Fair as long as at least one letter from prevGuess exists anywhere in the valid word list
    // Always fair: player can always include a prev letter without blocking the answer
    isFair: () => true,
  },
  {
    id: 'ECHO_TWO',
    name: 'Twin Chains',
    icon: '⛓️',
    shortRule: (prev) => `Use at least 2 letters from "${prev}"`,
    description: (prev) => `Dual binding: Your next guess must include at least 2 letters from "${prev}".`,
    flavor: 'Two phantom glyphs bind your next move.',
    // Always fair: player can include 2 prev letters and still guess the target word eventually
    isFair: () => true,
  },
  {
    id: 'ALPHA_LINK',
    name: 'Alpha Link',
    icon: '⚡',
    shortRule: (prev) => `Must start with "${prev[0]}"`,
    description: (prev) => `Prefix lock: Your next guess MUST begin with "${prev[0]}".`,
    flavor: 'The opening rune is forged in stone.',
    // Only fair if the target word starts with the same letter — otherwise it blocks a correct guess on this turn
    isFair: (prev, target) => target[0] === prev[0],
  },
  {
    id: 'OUROBOROS',
    name: 'Ouroboros',
    icon: '🔁',
    shortRule: (prev) => `Must start with "${prev[prev.length - 1]}"`,
    description: (prev) => `Tail to head: Your next guess MUST start with "${prev[prev.length - 1]}".`,
    flavor: 'The serpent consumes its own tail.',
    // Only fair if target word starts with last letter of prevGuess
    isFair: (prev, target) => target[0] === prev[prev.length - 1],
  },
  {
    id: 'GLITCH_MIRAGE',
    name: 'Glitch Mirage',
    icon: '🎭',
    shortRule: () => '1 tile will show a false color clue',
    description: () => 'Sensory illusion: One tile in your evaluated guess will display a false/inverted color clue.',
    flavor: 'A deceptive mirage alters your reality.',
    // Always fair — doesn't restrict what guess can be made
    isFair: () => true,
  },
  {
    id: 'OVERLOAD_TIMER',
    name: 'Overload Pulse',
    icon: '⏱️',
    shortRule: () => '30s Countdown! Submit or your previous word repeats',
    description: () => 'Reactor overload: You have 30 seconds to submit, or your previous guess repeats and wastes a turn!',
    flavor: 'The core is unstable. Think fast.',
    // Always fair — doesn't block any specific guess
    isFair: () => true,
  },
  {
    id: 'VOWEL_BAN',
    name: 'Forbidden Rune',
    icon: '🚫',
    shortRule: (_, opt) => `Forbidden letter: "${opt || 'E'}"`,
    description: (_, opt) => `Taboo seal: Forbidden from using the letter "${opt || 'E'}" this guess.`,
    flavor: 'An ancient seal locks away a sacred letter.',
    // Only fair if the target word does NOT contain the banned letter
    isFair: (_, target, opt) => !target.includes((opt || 'E').toUpperCase()),
  },
  {
    id: 'ANCHOR_SLOT',
    name: 'Anchor Slot',
    icon: '🎯',
    shortRule: (prev) => `Must match 1 exact position with "${prev}"`,
    description: (prev) => `Positional resonance: Must share at least one exact letter-slot as "${prev}".`,
    flavor: 'An immutable coordinate anchors your guess.',
    // Only fair if the target word itself satisfies it (i.e., target shares at least one slot with prevGuess)
    // This ensures the player isn't blocked from guessing the answer
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
 * so it's always fair.
 */
function pickFairBannedLetter(
  targetWord: string,
  dateKey: string,
  attemptIndex: number,
  mode: 'DAILY' | 'PRACTICE'
): string | undefined {
  // Common letters, try to pick one absent from target
  const candidates = ['E', 'A', 'R', 'I', 'O', 'T', 'N', 'S', 'L', 'C', 'D', 'P'];
  const absent = candidates.filter((l) => !targetWord.includes(l));

  if (absent.length === 0) return undefined; // Can't ban any letter fairly

  if (mode === 'DAILY') {
    const idx = simpleHash(`${dateKey}_vowel_${attemptIndex}`) % absent.length;
    return absent[idx];
  }
  return absent[Math.floor(Math.random() * absent.length)];
}

/**
 * Generate the active curse for a given attempt index (0 to 5)
 * - Attempt 0 (Guess 1): null
 * - Attempt 1..4 (Guess 2..5): fair curse (filtered against targetWord)
 * - Attempt 5 (Guess 6): null ("Final Stand")
 *
 * targetWord is used to ensure no curse makes the correct answer unguessable this turn.
 */
export function getCurseForAttempt(
  attemptIndex: number,
  dateKey: string,
  prevGuess: string,
  mode: 'DAILY' | 'PRACTICE',
  targetWord: string
): ActiveCurseState | null {
  if (attemptIndex === 0) return null;
  if (attemptIndex >= 5) return null;
  if (!prevGuess || prevGuess.length < 5) return null;

  const prevUpper = prevGuess.toUpperCase();
  const targetUpper = targetWord.toUpperCase();

  // Build the fair subset of curse templates for this context
  // First determine candidate banned letter for VOWEL_BAN
  const fairBannedLetter = pickFairBannedLetter(targetUpper, dateKey, attemptIndex, mode);

  const fairTemplates = ALL_CURSE_TEMPLATES.filter((t) => {
    const opt = t.id === 'VOWEL_BAN' ? fairBannedLetter : undefined;
    // VOWEL_BAN is excluded if no safe letter can be banned
    if (t.id === 'VOWEL_BAN' && !fairBannedLetter) return false;
    return t.isFair(prevUpper, targetUpper, opt);
  });

  // If no fair curses available, return null (no curse this turn)
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
    timeLimit = 30;
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
