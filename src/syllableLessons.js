import { LEVELS } from './data/levels.js';

const BLEND_PATTERN = /^(bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|tr)([aeiou])$/;
const CLOSED_PATTERN = /^[bcdfghjklmnñpqrstvwxyz][aeiou][bcdfghjklmnñpqrstvwxyz]$/;

export function groupThreeLetterSyllables(levels) {
  const lessons = { blends: [], endings: [] };
  const seen = new Set();

  for (const level of levels) {
    for (const entry of level.words) {
      for (const syllable of entry.syllables) {
        const normalized = syllable.toLowerCase();
        if (normalized.length !== 3 || seen.has(normalized)) {
          continue;
        }

        const blend = normalized.match(BLEND_PATTERN);
        if (blend) {
          lessons.blends.push({
            syllable: normalized,
            parts: [blend[1], blend[2]],
            exampleWord: entry.word,
            exampleSyllables: entry.syllables.map((part) => part.toLowerCase()),
          });
          seen.add(normalized);
        } else if (CLOSED_PATTERN.test(normalized)) {
          lessons.endings.push({
            syllable: normalized,
            parts: [normalized[0], normalized.slice(1)],
            exampleWord: entry.word,
            exampleSyllables: entry.syllables.map((part) => part.toLowerCase()),
          });
          seen.add(normalized);
        }
      }
    }
  }

  for (const [group, firstSyllable] of [['blends', 'pla'], ['endings', 'pan']]) {
    lessons[group].sort((first, second) => (
      Number(first.syllable !== firstSyllable) - Number(second.syllable !== firstSyllable)
    ));
  }

  return lessons;
}

export const SYLLABLE_LESSONS = groupThreeLetterSyllables(LEVELS);