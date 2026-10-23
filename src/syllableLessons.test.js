import test from 'node:test';
import assert from 'node:assert/strict';
import { groupThreeLetterSyllables } from './syllableLessons.js';
import { LEVELS } from './data/levels.js';

test('groups three-letter syllables into blend and final-consonant lessons', () => {
  const lessons = groupThreeLetterSyllables(LEVELS);

  assert.equal(lessons.blends[0].syllable, 'pla');
  assert.equal(lessons.endings[0].syllable, 'pan');
  assert.ok(lessons.blends.some(({ syllable, parts }) => syllable === 'pla' && parts.join('') === 'pla'));
  assert.ok(lessons.endings.some(({ syllable, parts }) => syllable === 'pan' && parts.join('') === 'pan'));
  assert.ok([...lessons.blends, ...lessons.endings].every(({ syllable, exampleWord, exampleSyllables }) => (
    syllable.length === 3
    && exampleWord.includes(syllable.toUpperCase())
    && exampleSyllables.join('').toUpperCase() === exampleWord
    && exampleSyllables.includes(syllable)
  )));
});