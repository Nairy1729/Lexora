import type { LetterEvaluation, KeyStatus } from '../types/game';

/**
 * Evaluates a 5-letter guess against a 5-letter solution using a two-pass
 * frequency-aware algorithm matching official Wordle rules.
 *
 * Rules:
 * 1. Pass 1: Allocate exact matches ('correct' - green).
 *    Decrement available counts of that letter in the solution.
 * 2. Pass 2: Allocate misplaced matches ('present' - yellow) only if
 *    that letter remains available in the solution. Decrement remaining count.
 * 3. All other positions are marked 'absent' - dark gray.
 *
 * Never marks more occurrences of a letter as 'present' than remain in the solution.
 */
export function evaluateGuess(guess: string, solution: string): LetterEvaluation[] {
  const normalizedGuess = guess.toUpperCase();
  const normalizedSolution = solution.toUpperCase();

  if (normalizedGuess.length !== 5 || normalizedSolution.length !== 5) {
    throw new Error('Both guess and solution must be exactly 5 letters.');
  }

  const result: LetterEvaluation[] = new Array(5);
  const solutionCounts: Record<string, number> = {};

  // Build frequency map of letters in solution
  for (let i = 0; i < 5; i++) {
    const char = normalizedSolution[i];
    solutionCounts[char] = (solutionCounts[char] || 0) + 1;
  }

  // Pass 1: Exact position matches ('correct')
  for (let i = 0; i < 5; i++) {
    if (normalizedGuess[i] === normalizedSolution[i]) {
      result[i] = 'correct';
      solutionCounts[normalizedGuess[i]] -= 1;
    }
  }

  // Pass 2: Misplaced matches ('present') and absent letters ('absent')
  for (let i = 0; i < 5; i++) {
    if (result[i]) {
      continue; // Already evaluated in Pass 1
    }

    const char = normalizedGuess[i];
    if (solutionCounts[char] && solutionCounts[char] > 0) {
      result[i] = 'present';
      solutionCounts[char] -= 1;
    } else {
      result[i] = 'absent';
    }
  }

  return result;
}

/**
 * Updates keyboard key statuses based on the latest guess evaluation.
 * Precedence hierarchy: 'correct' > 'present' > 'absent' > 'unused'.
 */
export function updateKeyboardStatus(
  currentStatus: Record<string, KeyStatus>,
  guess: string,
  evaluations: LetterEvaluation[]
): Record<string, KeyStatus> {
  const updated: Record<string, KeyStatus> = { ...currentStatus };
  const normalizedGuess = guess.toUpperCase();

  for (let i = 0; i < normalizedGuess.length; i++) {
    const letter = normalizedGuess[i];
    const newEvaluation = evaluations[i];
    const existing = updated[letter] || 'unused';

    if (existing === 'correct') {
      // 'correct' is the highest status; never downgrade
      continue;
    }

    if (newEvaluation === 'correct') {
      updated[letter] = 'correct';
    } else if (newEvaluation === 'present') {
      updated[letter] = 'present';
    } else if (newEvaluation === 'absent') {
      if (existing === 'unused') {
        updated[letter] = 'absent';
      }
    }
  }

  return updated;
}
