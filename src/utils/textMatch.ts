/**
 * Strip diacritics from a string using Unicode NFD normalisation.
 */
function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Compare a user's attempt to the expected French word.
 * Case-insensitive, accent-stripped comparison.
 */
export function matchFrenchWord(attempt: string, expected: string): boolean {
  const normalAttempt = stripAccents(attempt.trim().toLowerCase());
  const normalExpected = stripAccents(expected.trim().toLowerCase());
  return normalAttempt === normalExpected;
}
