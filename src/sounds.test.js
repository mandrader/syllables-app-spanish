import test from 'node:test';
import assert from 'node:assert/strict';
import { access, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SYLLABLE_LESSONS } from './syllableLessons.js';

const audioDirectory = new URL('../public/audio/lesson/', import.meta.url);

test('every lesson syllable and example word has a bundled audio clip', async () => {
  const clips = new Set();
  for (const group of Object.values(SYLLABLE_LESSONS)) {
    for (const item of group) {
      clips.add(`syllable-${item.syllable}.wav`);
      clips.add(`word-${item.exampleWord.toLowerCase()}.wav`);
    }
  }

  for (const filename of clips) {
    const url = new URL(filename, audioDirectory);
    await access(fileURLToPath(url));
    assert.ok((await stat(fileURLToPath(url))).size > 44, `${filename} should contain audio data`);
  }
});