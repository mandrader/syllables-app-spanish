import test from 'node:test';
import assert from 'node:assert/strict';
import { createPuzzle, isCorrectArrangement, shuffleNonIdentity, starsForMistakes } from './gameLogic.js';

test('puzzle contains each syllable once and begins in a different order', () => {
  const puzzle = createPuzzle(['pa', 'la', 'bra'], () => 0);
  assert.deepEqual(puzzle.slots, [null, null, null]);
  assert.deepEqual([...puzzle.tray].sort(), [0, 1, 2]);
  assert.notDeepEqual(puzzle.tray, [0, 1, 2]);
  assert.equal(puzzle.colors.length, 8);
});

test('single-syllable words remain in their only possible order', () => {
  assert.deepEqual(shuffleNonIdentity([0], () => 0), [0]);
});

test('stars reflect mistakes and preserve the original score thresholds', () => {
  assert.deepEqual([0, 1, 2, 3].map(starsForMistakes), [3, 2, 2, 1]);
});

test('only the original syllable order is a correct arrangement', () => {
  assert.equal(isCorrectArrangement([0, 1, 2]), true);
  assert.equal(isCorrectArrangement([2, 1, 0]), false);
});
