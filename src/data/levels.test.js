import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from './levels.js';

test('all five levels retain their words and each word matches its syllables', () => {
  assert.deepEqual(LEVELS.map((level) => level.words.length), [19, 18, 20, 12, 10]);
  for (const level of LEVELS) {
    for (const entry of level.words) {
      assert.equal(entry.syllables.join('').toUpperCase(), entry.word, entry.word);
      assert.ok(entry.category, `${entry.word} has a category clue`);
      assert.equal('emoji' in entry, false, `${entry.word} uses a category instead of an emoji clue`);
    }
  }
});
