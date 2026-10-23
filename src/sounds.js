let audioContext;
let lessonAudio;
let backgroundMusicSource;
let backgroundMusicGain;

const MUSIC_BEAT = 60 / 74;
const MUSIC_MELODY = [
  523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46,
  523.25, 659.25, 783.99, 987.77, 880, 783.99, 659.25, 587.33,
  523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 783.99,
  659.25, 587.33, 523.25, 587.33, 659.25, 523.25, 392, 523.25,
];
const MUSIC_CHORDS = [
  [130.81, 196, 261.63],
  [174.61, 220, 261.63],
  [110, 164.81, 220],
  [130.81, 196, 261.63],
];

function getAudioContext() {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  audioContext ??= new AudioContextClass();
  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }
  return audioContext;
}

function playNotes(notes, type = 'sine') {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const now = context.currentTime;
  notes.forEach(({ frequency, offset, duration = 0.12 }) => {
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    const start = now + offset;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(0.12, start + 0.012);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(volume);
    volume.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  });
}

function createMusicBuffer(context) {
  const loopDuration = MUSIC_BEAT * 16;
  const frameCount = Math.ceil(loopDuration * context.sampleRate);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const samples = buffer.getChannelData(0);
  const noteDuration = MUSIC_BEAT * 0.36;

  for (let frame = 0; frame < frameCount; frame++) {
    const time = frame / context.sampleRate;
    const chordIndex = Math.floor(time / (MUSIC_BEAT * 4));
    const chordTime = time - chordIndex * MUSIC_BEAT * 4;
    const chordFade = Math.min(1, chordTime / 0.7, (MUSIC_BEAT * 4 - chordTime) / 0.7);
    let sample = MUSIC_CHORDS[chordIndex].reduce((sum, frequency) => (
      sum + Math.sin(2 * Math.PI * frequency * chordTime) * 0.018 * chordFade
    ), 0);

    const noteIndex = Math.floor(time / (MUSIC_BEAT / 2)) % MUSIC_MELODY.length;
    const noteTime = time - Math.floor(time / (MUSIC_BEAT / 2)) * (MUSIC_BEAT / 2);
    if (noteTime < noteDuration) {
      const envelope = Math.min(1, noteTime / 0.025) * Math.exp(-noteTime * 3.2);
      const phase = 2 * Math.PI * MUSIC_MELODY[noteIndex] * noteTime;
      sample += (Math.sin(phase) + Math.sin(phase * 2) * 0.16) * 0.11 * envelope;
    }

    samples[frame] = sample;
  }

  return buffer;
}

export function startBackgroundMusic() {
  const context = getAudioContext();
  if (!context || backgroundMusicSource) {
    return;
  }

  const source = context.createBufferSource();
  const gain = context.createGain();
  const clipPlaying = lessonAudio && !lessonAudio.paused && !lessonAudio.ended;
  source.buffer = createMusicBuffer(context);
  source.loop = true;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.linearRampToValueAtTime(clipPlaying ? 0.004 : 0.055, context.currentTime + 1.2);
  source.connect(gain);
  gain.connect(context.destination);
  source.start();
  backgroundMusicSource = source;
  backgroundMusicGain = gain;
}

export function stopBackgroundMusic() {
  if (!backgroundMusicSource || !audioContext) {
    return;
  }

  const source = backgroundMusicSource;
  const gain = backgroundMusicGain;
  const stopAt = audioContext.currentTime + 0.2;
  gain.gain.cancelScheduledValues(audioContext.currentTime);
  gain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.05);
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
  };
  source.stop(stopAt);
  backgroundMusicSource = null;
  backgroundMusicGain = null;
}

function duckBackgroundMusic(ducked) {
  if (!backgroundMusicGain || !audioContext) {
    return;
  }

  backgroundMusicGain.gain.setTargetAtTime(
    ducked ? 0.004 : 0.055,
    audioContext.currentTime,
    ducked ? 0.025 : 0.12,
  );
}

export function playSyllableSound() {
  playNotes([{ frequency: 660, offset: 0, duration: 0.07 }], 'triangle');
}

export function playCorrectSound() {
  playNotes([
    { frequency: 523, offset: 0.04 },
    { frequency: 659, offset: 0.15 },
    { frequency: 784, offset: 0.26, duration: 0.2 },
  ]);
}

export function playIncorrectSound() {
  playNotes([
    { frequency: 260, offset: 0, duration: 0.16 },
    { frequency: 196, offset: 0.13, duration: 0.2 },
  ], 'triangle');
}

export function playLessonClip(kind, text) {
  lessonAudio?.pause();
  duckBackgroundMusic(true);
  lessonAudio = new Audio(
    `${import.meta.env.BASE_URL}audio/lesson/${kind}-${encodeURIComponent(text.toLowerCase())}.wav`,
  );
  lessonAudio.addEventListener('ended', () => duckBackgroundMusic(false), { once: true });
  lessonAudio.addEventListener('error', () => duckBackgroundMusic(false), { once: true });
  void lessonAudio.play().catch(() => duckBackgroundMusic(false));
}