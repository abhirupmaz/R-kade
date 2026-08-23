import { BollyMovie, BollyGuessResult, BollyClueStatus } from '../types';
import moviesData from '../assets/bolly-movies.json';

const allMovies: BollyMovie[] = moviesData as BollyMovie[];

/**
 * Simple deterministic hash for daily movie selection
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
 * Get today's date key (YYYY-MM-DD)
 */
export function getBollyDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Get the daily target movie based on the current date
 */
export function getDailyBollyMovie(): BollyMovie {
  const dateKey = getBollyDateKey();
  const hash = simpleHash(`bolly_daily_${dateKey}`);
  const idx = hash % allMovies.length;
  return allMovies[idx];
}

/**
 * Get a random movie for practice mode
 */
export function getRandomBollyMovie(): BollyMovie {
  const idx = Math.floor(Math.random() * allMovies.length);
  return allMovies[idx];
}

/**
 * Search movies by name prefix (for autocomplete)
 */
export function searchMovies(query: string, limit: number = 8): BollyMovie[] {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase().trim();
  
  // Prioritize: starts-with matches first, then includes matches
  const startsWithMatches: BollyMovie[] = [];
  const includesMatches: BollyMovie[] = [];

  for (const movie of allMovies) {
    const name = movie.name.toLowerCase();
    if (name.startsWith(q)) {
      startsWithMatches.push(movie);
    } else if (name.includes(q)) {
      includesMatches.push(movie);
    }
    if (startsWithMatches.length + includesMatches.length >= limit * 2) break;
  }

  return [...startsWithMatches, ...includesMatches].slice(0, limit);
}

/**
 * Find exact movie match by name
 */
export function findMovieByName(name: string): BollyMovie | undefined {
  const q = name.toLowerCase().trim();
  return allMovies.find((m) => m.name.toLowerCase() === q);
}

/**
 * Evaluate a guessed movie against the target movie
 */
export function evaluateBollyGuess(guess: BollyMovie, target: BollyMovie): BollyGuessResult {
  // Year
  let yearStatus: BollyClueStatus = 'wrong';
  let yearDirection: 'higher' | 'lower' | undefined = undefined;
  if (guess.year === target.year) {
    yearStatus = 'correct';
  } else {
    yearDirection = target.year > guess.year ? 'higher' : 'lower';
    // Within 3 years counts as partial
    if (Math.abs(guess.year - target.year) <= 3) {
      yearStatus = 'partial';
    }
  }

  // Genre
  const guessGenres = new Set(guess.genre.map((g) => g.toLowerCase()));
  const targetGenres = new Set(target.genre.map((g) => g.toLowerCase()));
  const genreMatches = [...guessGenres].filter((g) => targetGenres.has(g));
  let genreStatus: BollyClueStatus = 'wrong';
  if (
    guessGenres.size === targetGenres.size &&
    genreMatches.length === targetGenres.size
  ) {
    genreStatus = 'correct';
  } else if (genreMatches.length > 0) {
    genreStatus = 'partial';
  }

  // Director
  const directorStatus: BollyClueStatus =
    guess.director.toLowerCase() === target.director.toLowerCase()
      ? 'correct'
      : 'wrong';

  // Cast
  const guessCast = new Set(guess.cast.map((c) => c.toLowerCase()));
  const targetCast = new Set(target.cast.map((c) => c.toLowerCase()));
  const castMatches = [...guessCast].filter((c) => targetCast.has(c));
  let castStatus: BollyClueStatus = 'wrong';
  if (
    guessCast.size === targetCast.size &&
    castMatches.length === targetCast.size
  ) {
    castStatus = 'correct';
  } else if (castMatches.length > 0) {
    castStatus = 'partial';
  }

  // Restore original casing for display
  const genreMatchesDisplay = target.genre.filter((g) =>
    genreMatches.includes(g.toLowerCase())
  );
  const castMatchesDisplay = target.cast.filter((c) =>
    castMatches.includes(c.toLowerCase())
  );

  return {
    movie: guess,
    clues: {
      year: yearStatus,
      yearDirection,
      genre: genreStatus,
      genreMatches: genreMatchesDisplay,
      director: directorStatus,
      cast: castStatus,
      castMatches: castMatchesDisplay,
    },
  };
}

/**
 * Check if a guess is the correct movie
 */
export function isBollyCorrect(guess: BollyMovie, target: BollyMovie): boolean {
  return guess.id === target.id;
}
