import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ANSWERS, VALID_GUESSES, isValidWord, getWordListCounts } from '../wordList';
import { DICTIONARY_METADATA } from '../../constants/dictionaryAttribution';

describe('Expanded Dictionary Integrity & Validation Suite', () => {
  it('1. Answer and guess counts meet expansion targets', () => {
    const counts = getWordListCounts();
    assert.ok(counts.answers >= 2300, `Expected at least 2300 answers, got ${counts.answers}`);
    assert.ok(counts.validGuesses >= 12900, `Expected at least 12900 guesses, got ${counts.validGuesses}`);
    assert.equal(counts.answers, DICTIONARY_METADATA.answerCount);
    assert.equal(counts.validGuesses, DICTIONARY_METADATA.validGuessCount);
  });

  it('2. Every answer entry is strictly 5 uppercase English letters', () => {
    const pattern = /^[A-Z]{5}$/;
    for (let i = 0; i < ANSWERS.length; i++) {
      const word = ANSWERS[i];
      assert.ok(
        pattern.test(word),
        `Answer at index ${i} ('${word}') is not 5 uppercase letters`
      );
    }
  });

  it('3. Every entry in VALID_GUESSES is strictly 5 uppercase English letters', () => {
    const pattern = /^[A-Z]{5}$/;
    for (const word of VALID_GUESSES) {
      assert.ok(
        pattern.test(word),
        `Guess '${word}' is not 5 uppercase letters`
      );
    }
  });

  it('4. Zero duplicate entries exist in ANSWERS', () => {
    const uniqueAnswers = new Set(ANSWERS);
    assert.equal(
      uniqueAnswers.size,
      ANSWERS.length,
      `Found ${ANSWERS.length - uniqueAnswers.size} duplicate answers`
    );
  });

  it('5. Every single answer in ANSWERS is also present in VALID_GUESSES', () => {
    for (const answer of ANSWERS) {
      assert.ok(
        VALID_GUESSES.has(answer),
        `Answer '${answer}' is missing from VALID_GUESSES set`
      );
    }
  });

  it('6. isValidWord returns true for valid answers and valid guesses', () => {
    assert.equal(isValidWord('CRANE'), true);
    assert.equal(isValidWord('SLATE'), true);
    assert.equal(isValidWord('AUDIO'), true);
    assert.equal(isValidWord('ROAST'), true);
    assert.equal(isValidWord('SHINE'), true);
    assert.equal(isValidWord('WHALE'), true);
  });

  it('7. isValidWord is case-insensitive', () => {
    assert.equal(isValidWord('crane'), true);
    assert.equal(isValidWord('Slate'), true);
    assert.equal(isValidWord('aUdIo'), true);
  });

  it('8. isValidWord strictly rejects non-5-letter words and gibberish', () => {
    assert.equal(isValidWord(''), false);
    assert.equal(isValidWord('CAT'), false);
    assert.equal(isValidWord('CATS'), false);
    assert.equal(isValidWord('BANANA'), false);
    assert.equal(isValidWord('ZZZZZ'), false);
    assert.equal(isValidWord('12345'), false);
    assert.equal(isValidWord('C!ANE'), false);
  });

  it('9. Preserves historical 176 answers at indices 0-175 for backwards compatibility', () => {
    assert.equal(ANSWERS[0], 'SLATE');
    assert.equal(ANSWERS[1], 'CRANE');
    assert.equal(ANSWERS[2], 'ROAST');
    assert.equal(ANSWERS[3], 'PLANT');
    assert.equal(ANSWERS[4], 'SHINE');
    assert.equal(ANSWERS[106], 'LATCH');
    assert.equal(ANSWERS[175], 'JOINT');
  });

  it('10. Contains no offensive slur terms in ANSWERS', () => {
    const offensiveCheck = ['BITCH', 'WHORE', 'PUSSY', 'NIGGA', 'FAGOT', 'CUNTY'];
    for (const term of offensiveCheck) {
      assert.ok(
        !ANSWERS.includes(term),
        `Found offensive term '${term}' in curated ANSWERS`
      );
    }
  });
});
