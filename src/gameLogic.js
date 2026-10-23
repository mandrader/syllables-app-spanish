const TILE_COLORS = [
  '#ff6b6b',
  '#ffa94d',
  '#ffd43b',
  '#69db7c',
  '#4dabf7',
  '#9775fa',
  '#f783ac',
  '#3bc9db',
];

export function shuffleArray(items, random = Math.random) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function shuffleNonIdentity(items, random = Math.random) {
  const shuffled = shuffleArray(items, random);
  if (shuffled.length > 1 && shuffled.every((item, index) => item === items[index])) {
    shuffled.push(shuffled.shift());
  }
  return shuffled;
}

export function createPuzzle(syllables, random = Math.random) {
  const syllableIndexes = syllables.map((_, index) => index);
  return {
    slots: syllables.map(() => null),
    tray: shuffleNonIdentity(syllableIndexes, random),
    colors: shuffleArray(TILE_COLORS, random),
  };
}

export function starsForMistakes(mistakes) {
  if (mistakes === 0) {
    return 3;
  }
  return mistakes <= 2 ? 2 : 1;
}

export function isCorrectArrangement(slots) {
  return slots.every((syllableIndex, slotIndex) => syllableIndex === slotIndex);
}
