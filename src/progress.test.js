import test from 'node:test';
import assert from 'node:assert/strict';
import { getLevelStars, getStars, isLevelUnlocked, loadProgress, recordStars, saveProgress, STORAGE_KEY } from './progress.js';

function createStorage(savedValue = null) {
  const values = new Map(savedValue === null ? [] : [[STORAGE_KEY, savedValue]]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

const levels = [
  { words: [{ word: 'MESA' }, { word: 'PATO' }] },
  { words: [{ word: 'PELOTA' }] },
];

test('progress starts empty, records the highest score, and unlocks the next level', () => {
  let progress = loadProgress(createStorage());
  progress = recordStars(progress, 0, 'MESA', 2);
  progress = recordStars(progress, 0, 'MESA', 1);
  progress = recordStars(progress, 0, 'PATO', 3);

  assert.equal(getStars(progress, 0, 'MESA'), 2);
  assert.equal(getLevelStars(progress, 0, levels[0]), 5);
  assert.equal(isLevelUnlocked(progress, 1, levels), true);
  assert.equal(isLevelUnlocked(progress, 2, levels), false);
});

test('progress and hint setting survive a storage round trip', () => {
  const storage = createStorage();
  const progress = { stars: { '0.MESA': 3 }, hintsEnabled: true };
  saveProgress(progress, storage);
  assert.deepEqual(loadProgress(storage), progress);
});

test('invalid saved progress reports an error rather than silently resetting', () => {
  const storage = createStorage('not json');
  assert.throws(() => loadProgress(storage), SyntaxError);
});
