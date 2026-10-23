import { useEffect, useRef, useState } from 'react';
import { LEVELS } from './data/levels.js';
import { createPuzzle, isCorrectArrangement, shuffleArray, starsForMistakes } from './gameLogic.js';
import {
  playCorrectSound,
  playIncorrectSound,
  playLessonClip,
  playSyllableSound,
  startBackgroundMusic,
  stopBackgroundMusic,
} from './sounds.js';
import { SYLLABLE_LESSONS } from './syllableLessons.js';
import {
  emptyProgress,
  getLevelStars,
  getStars,
  isLevelUnlocked,
  loadProgress,
  recordStars,
  saveProgress,
} from './progress.js';

const FEEDBACK_DELAY = 1500;
const NEXT_WORD_DELAY = 1900;
const MAX_STARS_PER_WORD = 3;
const LESSON_GROUPS = [
  {
    id: 'blends',
    title: 'Consonantes juntas',
    example: 'pl + a → pla',
    instruction: 'Di las dos consonantes juntas y después añade la vocal.',
  },
  {
    id: 'endings',
    title: 'Consonante al final',
    example: 'p + an → pan',
    instruction: 'Di la primera consonante y júntala con la vocal y la consonante final.',
  },
];

function makeSession(levelIndex) {
  const wordOrder = shuffleArray(LEVELS[levelIndex].words.map((_, index) => index));
  const firstWord = LEVELS[levelIndex].words[wordOrder[0]];
  return {
    levelIndex,
    wordOrder,
    wordIndex: 0,
    mistakes: 0,
    ...createPuzzle(firstWord.syllables),
  };
}

function App() {
  const [screen, setScreen] = useState('menu');
  const [lessonGroup, setLessonGroup] = useState('blends');
  const [lessonIndex, setLessonIndex] = useState(0);
  const [progress, setProgress] = useState(emptyProgress);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [session, setSession] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [persistenceError, setPersistenceError] = useState('');
  const [storageWritable, setStorageWritable] = useState(true);
  const feedbackTimer = useRef(null);

  useEffect(() => {
    try {
      setProgress(loadProgress());
    } catch (error) {
      setProgress(emptyProgress());
      setStorageWritable(false);
      setPersistenceError(`No se pudo cargar el progreso guardado: ${error.message}`);
    }
  }, []);

  useEffect(() => () => {
    window.clearTimeout(feedbackTimer.current);
    stopBackgroundMusic();
  }, []);

  function commitProgress(nextProgress) {
    setProgress(nextProgress);
    if (!storageWritable) {
      return;
    }
    try {
      saveProgress(nextProgress);
      setPersistenceError('');
    } catch (error) {
      setStorageWritable(false);
      setPersistenceError(`No se pudo guardar el progreso: ${error.message}`);
    }
  }

  function toggleHints() {
    commitProgress({ ...progress, hintsEnabled: !progress.hintsEnabled });
  }

  function startGame(levelIndex) {
    window.clearTimeout(feedbackTimer.current);
    setFeedback(null);
    setSession(makeSession(levelIndex));
    setScreen('game');
    if (musicEnabled) {
      startBackgroundMusic();
    }
  }

  function leaveGame() {
    window.clearTimeout(feedbackTimer.current);
    setFeedback(null);
    setScreen('levels');
    stopBackgroundMusic();
  }

  function openLesson() {
    setScreen('lesson');
    if (musicEnabled) {
      startBackgroundMusic();
    }
  }

  function leaveLesson() {
    setScreen('menu');
    stopBackgroundMusic();
  }

  function toggleMusic() {
    const nextEnabled = !musicEnabled;
    setMusicEnabled(nextEnabled);
    if (nextEnabled && (screen === 'game' || screen === 'lesson')) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }

  function completeWord(nextSession, word) {
    const isCorrect = isCorrectArrangement(nextSession.slots);
    if (isCorrect) {
      playCorrectSound();
      const earnedStars = starsForMistakes(nextSession.mistakes);
      const nextProgress = recordStars(progress, nextSession.levelIndex, word.word, earnedStars);
      commitProgress(nextProgress);
      setFeedback({ kind: 'correct', text: `${word.word}   ¡Muy bien!` });
      feedbackTimer.current = window.setTimeout(() => {
        const nextWordIndex = nextSession.wordIndex + 1;
        if (nextWordIndex >= nextSession.wordOrder.length) {
          setFeedback(null);
          setScreen('complete');
          stopBackgroundMusic();
          return;
        }

        const nextWord = LEVELS[nextSession.levelIndex].words[nextSession.wordOrder[nextWordIndex]];
        setSession({
          ...nextSession,
          wordIndex: nextWordIndex,
          mistakes: 0,
          ...createPuzzle(nextWord.syllables),
        });
        setFeedback(null);
      }, NEXT_WORD_DELAY);
      return;
    }

    playIncorrectSound();
    setSession({
      ...nextSession,
      mistakes: nextSession.mistakes + 1,
      tray: [...nextSession.tray, ...nextSession.slots.filter((tile) => tile !== null)],
      slots: nextSession.slots.map(() => null),
    });
    setFeedback({ kind: 'incorrect', text: `${nextSession.slots.map((tile) => word.syllables[tile]).join('').toUpperCase()}   Intenta de nuevo` });
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), FEEDBACK_DELAY);
  }

  function placeTile(tileIndex, targetSlotIndex) {
    if (!session || feedback) {
      return;
    }

    const isInTray = session.tray.includes(tileIndex);
    const sourceSlotIndex = session.slots.indexOf(tileIndex);
    if (!isInTray && sourceSlotIndex === -1) {
      return;
    }

    const slotIndex = targetSlotIndex ?? session.slots.indexOf(null);
    if (slotIndex < 0 || session.slots[slotIndex] !== null) {
      return;
    }

    const slots = [...session.slots];
    if (sourceSlotIndex !== -1) {
      slots[sourceSlotIndex] = null;
    }
    slots[slotIndex] = tileIndex;
    const nextSession = {
      ...session,
      slots,
      tray: session.tray.filter((item) => item !== tileIndex),
    };
    playSyllableSound();
    setSession(nextSession);

    if (slots.every((tile) => tile !== null)) {
      const level = LEVELS[nextSession.levelIndex];
      const word = level.words[nextSession.wordOrder[nextSession.wordIndex]];
      completeWord(nextSession, word);
    }
  }

  function returnTileToTray(slotIndex) {
    if (!session || feedback || session.slots[slotIndex] === null) {
      return;
    }
    const slots = [...session.slots];
    const tileIndex = slots[slotIndex];
    slots[slotIndex] = null;
    setSession({ ...session, slots, tray: [...session.tray, tileIndex] });
  }

  function handleDrop(event, slotIndex) {
    event.preventDefault();
    const tileIndex = Number(event.dataTransfer.getData('text/plain'));
    if (Number.isInteger(tileIndex)) {
      placeTile(tileIndex, slotIndex);
    }
  }

  function handleTrayDrop(event) {
    event.preventDefault();
    if (!session || feedback) {
      return;
    }
    const tileIndex = Number(event.dataTransfer.getData('text/plain'));
    const slotIndex = session.slots.indexOf(tileIndex);
    if (slotIndex !== -1) {
      returnTileToTray(slotIndex);
    }
  }

  const currentLevel = session ? LEVELS[session.levelIndex] : null;
  const currentWord = session
    ? currentLevel.words[session.wordOrder[session.wordIndex]]
    : null;
  const currentLessonGroup = LESSON_GROUPS.find(({ id }) => id === lessonGroup);
  const currentLessonList = SYLLABLE_LESSONS[lessonGroup];
  const currentLesson = currentLessonList[lessonIndex];
  const exampleWord = currentLesson.exampleWord.toLowerCase();
  const exampleSyllableIndex = exampleWord.indexOf(currentLesson.syllable);

  return (
    <main className={`app-shell screen-${screen}`}>
      {persistenceError && (
        <div className="storage-warning" role="alert">
          {persistenceError} El progreso de esta sesión puede no conservarse.
        </div>
      )}

      {screen === 'menu' && (
        <section className="panel menu-panel">
          <div className="brand-mark" aria-hidden="true">📚</div>
          <p className="eyebrow">¡Jugar y aprender!</p>
          <h1>Aprendo a Leer</h1>
          <p className="subtitle">Junta las sílabas y forma la palabra</p>
          <button className="button button-primary button-large" onClick={() => setScreen('levels')}>
            Jugar
          </button>
          <button className="button button-secondary button-large" onClick={openLesson}>
            Aprender sílabas
          </button>
          <HintToggle enabled={progress.hintsEnabled} onToggle={toggleHints} />
        </section>
      )}

      {screen === 'lesson' && (
        <section className="panel lesson-panel">
          <button className="button button-quiet back-button" onClick={leaveLesson}>
            ← Menú
          </button>
          <p className="eyebrow">Paso a paso</p>
          <h1>Sílabas de tres letras</h1>
          <p className="lesson-lead">Mira cómo se juntan las partes. Después, escucha y practica.</p>

          <div className="lesson-tabs" role="tablist" aria-label="Tipo de sílaba">
            {LESSON_GROUPS.map((group) => (
              <button
                aria-selected={lessonGroup === group.id}
                className="lesson-tab"
                key={group.id}
                onClick={() => {
                  setLessonGroup(group.id);
                  setLessonIndex(0);
                }}
                role="tab"
                type="button"
              >
                <span>{group.title}</span>
                <small>{group.example}</small>
              </button>
            ))}
          </div>

          <p className="lesson-instruction">{currentLessonGroup.instruction}</p>
          <div className="lesson-display" role="tabpanel">
            <div className="lesson-breakdown" aria-label={`Partes: ${currentLesson.parts.join(' y ')}; sílaba: ${currentLesson.syllable}`}>
              {currentLesson.parts.map((part, index) => (
                <span className={`lesson-part lesson-part-${index + 1}`} key={`${part}-${index}`}>
                  {part}
                </span>
              ))}
              <span className="lesson-arrow" aria-hidden="true">→</span>
              <strong className="lesson-whole">{currentLesson.syllable}</strong>
            </div>
            <div className="lesson-example" role="img" aria-label={exampleWord.toUpperCase()}>
              {currentLesson.exampleSyllables.map((syllable, index) => (
                <span
                  aria-hidden="true"
                  className={`lesson-word-syllable${index === currentLesson.exampleSyllables.indexOf(currentLesson.syllable) ? ' lesson-word-syllable-target' : ''}`}
                  key={`${syllable}-${index}`}
                >
                  {syllable}
                </span>
              ))}
            </div>
            <div className="lesson-audio-controls">
              <button className="button button-primary" onClick={() => playLessonClip('syllable', currentLesson.syllable)} type="button">
                🔊 Escuchar sílaba
              </button>
              <button className="button button-secondary" onClick={() => playLessonClip('word', exampleWord)} type="button">
                🔊 Escuchar palabra
              </button>
              <MusicToggle enabled={musicEnabled} onToggle={toggleMusic} />
            </div>
          </div>

          <div className="lesson-syllables" aria-label="Practica otra sílaba">
            {currentLessonList.map((item, index) => (
              <button
                aria-pressed={lessonIndex === index}
                className="lesson-syllable"
                key={item.syllable}
                onClick={() => {
                  setLessonIndex(index);
                  playLessonClip('syllable', item.syllable);
                }}
                type="button"
              >
                {item.syllable}
              </button>
            ))}
          </div>
        </section>
      )}

      {screen === 'levels' && (
        <section className="panel levels-panel">
          <button className="button button-quiet back-button" onClick={() => setScreen('menu')}>
            ← Menú
          </button>
          <p className="eyebrow">¡Tú puedes!</p>
          <h1>Elige un nivel</h1>
          <div className="level-grid">
            {LEVELS.map((level, levelIndex) => {
              const unlocked = isLevelUnlocked(progress, levelIndex, LEVELS);
              const stars = getLevelStars(progress, levelIndex, level);
              const maxStars = level.words.length * MAX_STARS_PER_WORD;
              return (
                <button
                  className={`level-card${unlocked ? '' : ' level-locked'}`}
                  disabled={!unlocked}
                  key={level.title}
                  onClick={() => startGame(levelIndex)}
                >
                  <span className="level-number">{String(levelIndex + 1).padStart(2, '0')}</span>
                  <span className="level-title">{level.title.replace(/^Nivel \d+ - /, '')}</span>
                  <span className="level-stars">
                    {unlocked ? `⭐ ${stars} / ${maxStars}` : '🔒 Bloqueado'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {screen === 'game' && session && currentLevel && currentWord && (
        <section className="panel game-panel">
          <header className="game-toolbar">
            <button className="button button-quiet" onClick={leaveGame}>← Niveles</button>
            <HintToggle enabled={progress.hintsEnabled} onToggle={toggleHints} />
            <MusicToggle enabled={musicEnabled} onToggle={toggleMusic} />
            <span className="word-counter">
              {currentLevel.title} · Palabra {session.wordIndex + 1} de {session.wordOrder.length}
            </span>
          </header>

          <div className="game-content">
            <p className="eyebrow">¡Vamos a formar una palabra!</p>
            <h1>Forma la palabra</h1>
            <div className="clue" aria-live="polite">
              {progress.hintsEnabled
                ? <><span className="clue-category">{currentWord.category}</span><span className="clue-blanks">{[...currentWord.word].map(() => '_').join(' ')}</span></>
                : <span className="clue-hidden">Usa las sílabas para descubrirla</span>}
            </div>

            <div className={`slots${feedback ? ` slots-${feedback.kind}` : ''}`} aria-label="Espacios de respuesta">
              {session.slots.map((tileIndex, slotIndex) => (
                <div
                  className="answer-slot"
                  key={`${currentWord.word}-${slotIndex}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, slotIndex)}
                >
                  {tileIndex === null ? (
                    <span className="slot-placeholder" aria-hidden="true">·</span>
                  ) : (
                    <SyllableTile
                      color={session.colors[tileIndex % session.colors.length]}
                      draggable={!feedback}
                      onClick={() => returnTileToTray(slotIndex)}
                      onDragStart={(event) => event.dataTransfer.setData('text/plain', String(tileIndex))}
                      syllable={currentWord.syllables[tileIndex]}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="feedback" aria-live="assertive">
              {feedback && <p className={`feedback-${feedback.kind}`}>{feedback.text}</p>}
            </div>

            <div
              className="syllable-tray"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleTrayDrop}
              aria-label="Sílabas disponibles"
            >
              {session.tray.map((tileIndex) => (
                <SyllableTile
                  color={session.colors[tileIndex % session.colors.length]}
                  draggable={!feedback}
                  key={tileIndex}
                  onClick={() => placeTile(tileIndex)}
                  onDragStart={(event) => event.dataTransfer.setData('text/plain', String(tileIndex))}
                  syllable={currentWord.syllables[tileIndex]}
                />
              ))}
            </div>
            <p className="game-instruction">Toca una sílaba o arrástrala a un espacio</p>
          </div>
        </section>
      )}

      {screen === 'complete' && session && (
        <section className="panel complete-panel">
          <div className="celebration" aria-hidden="true">🎉</div>
          <p className="eyebrow">¡Lo lograste!</p>
          <h1>¡Nivel completado!</h1>
          <p className="earned-stars" aria-label={`${getLevelStars(progress, session.levelIndex, LEVELS[session.levelIndex])} estrellas`}>
            {'⭐'.repeat(Math.max(1, getLevelStars(progress, session.levelIndex, LEVELS[session.levelIndex])))}
          </p>
          <p className="star-total">
            {getLevelStars(progress, session.levelIndex, LEVELS[session.levelIndex])} / {LEVELS[session.levelIndex].words.length * MAX_STARS_PER_WORD} estrellas
          </p>
          <button className="button button-primary button-large" onClick={() => startGame(session.levelIndex)}>
            Jugar de nuevo
          </button>
          <button
            className="button button-secondary button-large"
            disabled={session.levelIndex + 1 >= LEVELS.length}
            onClick={() => startGame(session.levelIndex + 1)}
          >
            Siguiente nivel
          </button>
          <button className="button button-quiet" onClick={() => setScreen('levels')}>Ver niveles</button>
        </section>
      )}
    </main>
  );
}

function HintToggle({ enabled, onToggle }) {
  return (
    <button
      aria-pressed={enabled}
      className="hint-toggle"
      onClick={onToggle}
      type="button"
    >
      💡 Pista: {enabled ? 'ON' : 'OFF'}
    </button>
  );
}

function MusicToggle({ enabled, onToggle }) {
  return (
    <button
      aria-pressed={enabled}
      className="hint-toggle music-toggle"
      onClick={onToggle}
      type="button"
    >
      ♫ Música: {enabled ? 'ON' : 'OFF'}
    </button>
  );
}

function SyllableTile({ color, draggable, onClick, onDragStart, syllable }) {
  return (
    <button
      className="syllable-tile"
      draggable={draggable}
      onClick={onClick}
      onDragStart={onDragStart}
      style={{ '--tile-color': color }}
      type="button"
    >
      {syllable}
    </button>
  );
}

export default App;
