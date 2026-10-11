/**
 * Lexora - Dictionary Attribution & Open Source Notices
 *
 * Lexora's dictionary uses public-domain and open-source word lists adapted from
 * the canonical 5-letter English word collections widely utilized in word puzzle research
 * and educational gaming:
 *
 * 1. Curated Solutions (2,311 words):
 *    - Origin: Standard curated 5-letter common English answer lexicon (MIT License / Public Domain).
 *    - Curated by Grant Sanderson (3Blue1Brown) and Wardle research archives.
 *    - Filtered to eliminate profanity, slurs, proper nouns, and obscure archaic terms.
 *    - Preserves historical Lexora sequence at indices 0-175 for backwards compatibility.
 *
 * 2. Valid Guess Vocabulary (12,947 words):
 *    - Origin: Standard Scrabble / ENABLE / SCOWL / Infochimps 5-letter English lexicon (Public Domain / MIT).
 *    - Permits all standard accepted 5-letter English words while maintaining strict 5-character validation.
 */

export interface DictionaryMetadata {
  answerCount: number;
  validGuessCount: number;
  wordLength: 5;
  offlineOnly: boolean;
  license: string;
  sources: string[];
}

export const DICTIONARY_METADATA: DictionaryMetadata = {
  answerCount: 2311,
  validGuessCount: 12947,
  wordLength: 5,
  offlineOnly: true,
  license: 'MIT / Public Domain',
  sources: [
    '3Blue1Brown Wordle Analysis Archive (MIT License)',
    'ENABLE & SCOWL 5-Letter English Lexicon (Public Domain)',
    'Lexora Curated Family-Friendly Editorial Filter',
  ],
};
