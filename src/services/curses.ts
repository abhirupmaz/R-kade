import { ActiveCurseState, CurseId } from '../types';

export interface CurseValidationResult {
  valid: boolean;
  reason?: string;
  progressText: string;
  isComplete: boolean;
}

const ALL_CURSE_TEMPLATES: {
  id: CurseId;
  name: string;
  icon: string;
  shortRule: (prevGuess: string, opt?: string) => string;
  description: (prevGuess: string, opt?: string) => string;
  flavor: string;
}[] = [
  {
    id: 'ECHO_ONE',
    name: 'Echo Fragment',
    icon: '🔮',
    shortRule: (prev) => `Must contain at least 1 letter from "${prev}"`,
    description: (prev) => `The void echoes: Your next guess must contain at least 1 letter that was in "${prev}".`,
    flavor: 'A whisper from your past attempt lingers in the void.',
  },
  {
    id: 'ECHO_TWO',
    name: 'Twin Chains',
    icon: '⛓️',
    shortRule: (prev) => `Must contain at least 2 letters from "${prev}"`,
    description: (prev) => `Dual binding: Your next guess must include at least 2 letters from "${prev}".`,
    flavor: 'Two phantom glyphs bind your next move.',
  },
  {
    id: 'ALPHA_LINK',
    name: 'Alpha Link',
    icon: '⚡',
    shortRule: (prev) => `Must start with "${prev[0]}"`,
    description: (prev) => `Prefix lock: Your next guess MUST begin with the letter "${prev[0]}".`,
    flavor: 'The opening rune is forged in stone.',
  },
  {
    id: 'OUROBOROS',
    name: 'Ouroboros',
    icon: '🔁',
    shortRule: (prev) => `Must start with "${prev[prev.length - 1]}"`,
    description: (prev) => `Tail to head: Your next guess MUST start with "${prev[prev.length - 1]}" (last letter of "${prev}").`,
    flavor: 'The serpent consumes its own tail.',
  },
  {
    id: 'GLITCH_MIRAGE',
    name: 'Glitch Mirage',
    icon: '🎭',
    shortRule: () => '1 tile will show a FALSE color clue',
    description: () => 'Sensory illusion: One tile in your evaluated guess will display a false/inverted color clue (you won’t know which!).',
    flavor: 'A deceptive mirage alters your reality.',
  },
  {
    id: 'OVERLOAD_TIMER',
    name: 'Overload Pulse',
    icon: '⏱️',
    shortRule: () => '30s Countdown! Submit or repeat previous word',
    description: () => 'Reactor overload: You have 30 seconds to submit a valid word, or your previous guess will be auto-submitted and a turn wasted!',
    flavor: 'The core is unstable. Think fast.',
  },
  {
    id: 'VOWEL_BAN',
    name: 'Forbidden Rune',
    icon: '🚫',
    shortRule: (_, opt) => `Forbidden letter: "${opt || 'E'}"`,
    description: (_, opt) => `Taboo seal: You are forbidden from using the letter "${opt || 'E'}" in this guess.`,
    flavor: 'An ancient seal locks away a sacred letter.',
  },
  {
    id: 'ANCHOR_SLOT',
    name: 'Anchor Slot',
    icon: '🎯',
    shortRule: (prev) => `Must match 1 exact letter position with "${prev}"`,
    description: (prev) => `Positional resonance: Must share at least one exact letter at the exact same slot as "${prev}".`,
    flavor: 'An immutable coordinate anchors your guess.',
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
 * Generate the active curse for a given attempt index (0 to 5)
 * - Attempt 0 (Guess 1): null
 * - Attempt 1..4 (Guess 2..5): active curse
 * - Attempt 5 (Guess 6): null ("Final Stand")
 */
export function getCurseForAttempt(
  attemptIndex: number,
  dateKey: string,
  prevGuess: string,
  mode: 'DAILY' | 'PRACTICE'
): ActiveCurseState | null {
  // Guess 1 (index 0) has NO curse
  if (attemptIndex === 0) return null;

  // Guess 6 (index 5 - the final attempt) has NO curse
  if (attemptIndex >= 5) return null;

  if (!prevGuess || prevGuess.length < 5) return null;

  const prevUpper = prevGuess.toUpperCase();

  let selectedIndex = 0;
  if (mode === 'DAILY') {
    const seed = `${dateKey}_curse_attempt_${attemptIndex}`;
    const hash = simpleHash(seed);
    selectedIndex = hash % ALL_CURSE_TEMPLATES.length;
  } else {
    selectedIndex = Math.floor(Math.random() * ALL_CURSE_TEMPLATES.length);
  }

  const template = ALL_CURSE_TEMPLATES[selectedIndex];

  // Optional parameters for specific curses
  let bannedLetter: string | undefined = undefined;
  if (template.id === 'VOWEL_BAN') {
    // Pick 'E', 'A', 'I', 'O', or 'R'
    const pool = ['E', 'A', 'I', 'O', 'R', 'T'];
    const bIndex = mode === 'DAILY' ? simpleHash(`${dateKey}_vowel_${attemptIndex}`) % pool.length : Math.floor(Math.random() * pool.length);
    bannedLetter = pool[bIndex];
  }

  let timeLimit: number | undefined = undefined;
  if (template.id === 'OVERLOAD_TIMER') {
    timeLimit = 30;
  }

  let deceptiveIndex: number | undefined = undefined;
  if (template.id === 'GLITCH_MIRAGE') {
    deceptiveIndex = mode === 'DAILY' ? simpleHash(`${dateKey}_deceptive_${attemptIndex}`) % 5 : Math.floor(Math.random() * 5);
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
      const progressText = isComplete
        ? `✓ Starts with '${req}'`
        : `Must start with '${req}'`;
      return {
        valid: isComplete,
        reason: isComplete ? undefined : `Must start with the letter "${req}"`,
        progressText,
        isComplete,
      };
    }

    case 'OUROBOROS': {
      const req = prevUpper[prevUpper.length - 1];
      const isComplete = guessUpper.startsWith(req);
      const progressText = isComplete
        ? `✓ Starts with '${req}'`
        : `Must start with '${req}'`;
      return {
        valid: isComplete,
        reason: isComplete ? undefined : `Must start with "${req}" (last letter of "${prevUpper}")`,
        progressText,
        isComplete,
      };
    }

    case 'VOWEL_BAN': {
      const banned = (curse.bannedLetter || 'E').toUpperCase();
      const containsBanned = guessUpper.includes(banned);
      const isComplete = !containsBanned;
      const progressText = isComplete
        ? `✓ No '${banned}' used`
        : `❌ Contains forbidden '${banned}'`;
      return {
        valid: isComplete,
        reason: isComplete ? undefined : `Contains forbidden letter "${banned}"`,
        progressText,
        isComplete,
      };
    }

    case 'ANCHOR_SLOT': {
      let matchedIndices: number[] = [];
      for (let i = 0; i < Math.min(guessUpper.length, prevUpper.length); i++) {
        if (guessUpper[i] === prevUpper[i]) {
          matchedIndices.push(i + 1);
        }
      }
      const isComplete = matchedIndices.length >= 1;
      const progressText = isComplete
        ? `✓ Slot ${matchedIndices.join(', ')} anchored`
        : `0/1 slot matched with "${prevUpper}"`;
      return {
        valid: isComplete,
        reason: isComplete ? undefined : `Must place at least 1 letter at the exact same position as in "${prevUpper}"`,
        progressText,
        isComplete,
      };
    }

    case 'GLITCH_MIRAGE':
    case 'OVERLOAD_TIMER':
    default:
      return {
        valid: true,
        progressText: 'Active',
        isComplete: true,
      };
  }
}
