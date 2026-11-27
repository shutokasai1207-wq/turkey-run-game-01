// Gobble Dash — all sound is synthesized with WebAudio. No audio files.
// One clear job: bleeps, boings and the little autumn tune.

let audioCtx = null;
let masterGain = null;
let musicGain = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

// A tiny autumn tune: a bouncy bass line with a chirpy melody on top.
// Steps are eighth notes at 132 bpm; null means rest.
const BASS = [
  110, 0, 110, 0, 131, 0, 110, 0,
  98, 0, 98, 0, 123, 0, 147, 0,
  110, 0, 110, 0, 131, 0, 165, 0,
  98, 0, 123, 0, 147, 0, 165, 0,
];
const MELODY = [
  440, 0, 523, 659, 0, 587, 523, 0,
  440, 0, 392, 440, 0, 0, 523, 0,
  587, 0, 659, 587, 523, 440, 392, 0,
  440, 0, 523, 0, 659, 0, 784, 0,
];

export function ensureAudio() {
  if (audioCtx) {
    if (audioCtx.state === "suspended") audioCtx.resume();
    return;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  audioCtx = new Ctx();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = muted ? 0 : 0.5;
  masterGain.connect(audioCtx.destination);
  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.16;
  musicGain.connect(masterGain);
}

export function setMuted(value) {
  muted = value;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.5;
}

export function isMuted() {
  return muted;
}

function tone(freq, duration, type, volume, when = 0, slideTo = 0) {
  if (!audioCtx || !masterGain) return;
  const t0 = audioCtx.currentTime + when;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function musicTone(freq, duration, type, volume, when = 0) {
  if (!audioCtx || !musicGain) return;
  const t0 = audioCtx.currentTime + when;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(musicGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export function sfxJump() {
  tone(280, 0.16, "square", 0.22, 0, 620);
}

export function sfxDoubleJump() {
  tone(360, 0.14, "square", 0.2, 0, 780);
}

export function sfxCorn(combo) {
  const base = 660 + Math.min(combo, 12) * 32;
  tone(base, 0.09, "sine", 0.3);
  tone(base * 1.5, 0.12, "sine", 0.22, 0.05);
}

export function sfxHit() {
  tone(160, 0.22, "sawtooth", 0.32, 0, 60);
  tone(90, 0.28, "triangle", 0.3, 0.02, 45);
}

export function sfxDash() {
  tone(500, 0.18, "sawtooth", 0.16, 0, 1400);
}

export function sfxCaught() {
  tone(392, 0.22, "triangle", 0.3);
  tone(370, 0.22, "triangle", 0.3, 0.22);
  tone(349, 0.22, "triangle", 0.3, 0.44);
  tone(311, 0.5, "triangle", 0.32, 0.66);
}

export function sfxEscaped() {
  const notes = [523, 659, 784, 1047, 784, 1047];
  notes.forEach((n, i) => tone(n, 0.22, "triangle", 0.28, i * 0.13));
}

export function sfxClick() {
  tone(700, 0.06, "square", 0.16);
}

export function sfxZone() {
  tone(523, 0.12, "triangle", 0.24);
  tone(784, 0.18, "triangle", 0.24, 0.1);
}

export function startMusic() {
  ensureAudio();
  if (!audioCtx || musicTimer) return;
  musicStep = 0;
  const stepDur = 60 / 132 / 2;
  musicTimer = setInterval(() => {
    if (muted) return;
    const i = musicStep % 32;
    const bass = BASS[i];
    const mel = MELODY[i];
    if (bass) musicTone(bass, stepDur * 0.95, "triangle", 0.5);
    if (mel) musicTone(mel, stepDur * 0.9, "square", 0.1);
    musicStep += 1;
  }, stepDur * 1000);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
