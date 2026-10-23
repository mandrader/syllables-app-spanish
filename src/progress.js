export const STORAGE_KEY = 'silabas-app:progress:v1';

export function emptyProgress() {
  return { stars: {}, hintsEnabled: false };
}

export function loadProgress(storage = window.localStorage) {
  const serialized = storage.getItem(STORAGE_KEY);
  if (serialized === null) {
    return emptyProgress();
  }

  const saved = JSON.parse(serialized);
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
    throw new Error('El archivo guardado no tiene el formato esperado.');
  }
  if (saved.stars !== undefined && (!saved.stars || typeof saved.stars !== 'object' || Array.isArray(saved.stars))) {
    throw new Error('Los datos de estrellas guardados no son válidos.');
  }

  const stars = {};
  for (const [key, value] of Object.entries(saved.stars ?? {})) {
    if (!Number.isInteger(value) || value < 1 || value > 3) {
      throw new Error('Se encontró un puntaje de estrellas no válido.');
    }
    stars[key] = value;
  }

  return {
    stars,
    hintsEnabled: saved.hintsEnabled === true,
  };
}

export function saveProgress(progress, storage = window.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getStars(progress, levelIndex, word) {
  return progress.stars[`${levelIndex}.${word}`] ?? 0;
}

export function recordStars(progress, levelIndex, word, stars) {
  const key = `${levelIndex}.${word}`;
  if (stars <= getStars(progress, levelIndex, word)) {
    return progress;
  }
  return { ...progress, stars: { ...progress.stars, [key]: stars } };
}

export function getLevelStars(progress, levelIndex, level) {
  return level.words.reduce(
    (total, entry) => total + getStars(progress, levelIndex, entry.word),
    0,
  );
}

export function isLevelUnlocked(progress, levelIndex, levels) {
  if (levelIndex === 0) {
    return true;
  }
  return levels[levelIndex - 1].words.every(
    (entry) => getStars(progress, levelIndex - 1, entry.word) > 0,
  );
}
