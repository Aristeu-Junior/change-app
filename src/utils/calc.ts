import { ExerciseType } from '../types';

// 1RM Calculation using the Brzycki Formula: 1RM = Weight × (36 / (37 - Reps))
export function calculate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return Math.round(weightKg * 10) / 10;
  if (reps >= 37) return Math.round(weightKg * 2 * 10) / 10;
  const oneRepMax = weightKg * (36 / (37 - reps));
  return Math.round(oneRepMax * 10) / 10;
}

// Weight conversions
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

export function displayWeight(kg: number | null | undefined, unit: 'kg' | 'lbs'): string {
  if (kg === null || kg === undefined || isNaN(kg)) return '-';
  if (unit === 'lbs') {
    return `${kgToLbs(kg)} lbs`;
  }
  return `${kg} kg`;
}

// Plate Calculator for Olympic Barbell (standard 20kg bar)
export interface PlateBreakdown {
  plateWeight: number;
  countPerSide: number;
  color: string;
}

export interface PlateResult {
  totalTarget: number;
  barWeight: number;
  weightPerSide: number;
  achievedTotal: number;
  remainder: number;
  plates: PlateBreakdown[];
}

export function calculatePlates(totalTargetKg: number, barWeightKg = 20): PlateResult {
  const availablePlates = [
    { weight: 25, color: '#ef4444' }, // Red
    { weight: 20, color: '#3b82f6' }, // Blue
    { weight: 15, color: '#eab308' }, // Yellow
    { weight: 10, color: '#22c55e' }, // Green
    { weight: 5, color: '#f8fafc' },  // White
    { weight: 2.5, color: '#000000' }, // Black
    { weight: 1.25, color: '#94a3b8' } // Grey
  ];

  let weightToDistribute = Math.max(0, (totalTargetKg - barWeightKg) / 2);
  const targetPerSide = weightToDistribute;
  const plates: PlateBreakdown[] = [];

  for (const p of availablePlates) {
    if (weightToDistribute >= p.weight) {
      const count = Math.floor(weightToDistribute / p.weight);
      weightToDistribute -= count * p.weight;
      weightToDistribute = Math.round(weightToDistribute * 100) / 100;
      plates.push({
        plateWeight: p.weight,
        countPerSide: count,
        color: p.color
      });
    }
  }

  const achievedPerSide = targetPerSide - weightToDistribute;
  const achievedTotal = barWeightKg + achievedPerSide * 2;

  return {
    totalTarget: totalTargetKg,
    barWeight: barWeightKg,
    weightPerSide: achievedPerSide,
    achievedTotal,
    remainder: Math.round((totalTargetKg - achievedTotal) * 10) / 10,
    plates
  };
}

// Time formatting: seconds -> "mm:ss" or "h:mm:ss"
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatSecondsClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Web Audio API Synthesizer (Zero asset dependency sound generator)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function playGymTone(type: 'countdown' | 'complete' | 'check' | 'water'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const play = () => {
      const now = ctx.currentTime;
      if (type === 'countdown') {
        // 3, 2, 1 som de contagem
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'complete') {
        // Fim do descanso: sino de academia nítido e encorpado
        [880, 1174.66].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);
          gain.gain.setValueAtTime(0.35, now + idx * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.35);
        });
      } else if (type === 'check') {
        // Marcador de série concluída
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.09);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'water') {
        // Gota de água cristalina
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(1450, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch {
    // Ignora erros de permissão de áudio sem travar a interface
  }
}

// Haptic feedback
export function triggerHaptic(type: 'light' | 'medium' | 'success' | number = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (typeof type === 'number') {
        navigator.vibrate(type);
      } else if (type === 'light') {
        navigator.vibrate(15);
      } else if (type === 'medium') {
        navigator.vibrate(30);
      } else if (type === 'success') {
        navigator.vibrate([40, 60, 80]);
      }
    } catch {
      // Ignore vibration errors on unsupported or restricted environments
    }
  }
}

// Screen Wake Lock API (keeps screen awake during gym workout)
let wakeLockSentinel: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function releaseWakeLock(): void {
  if (wakeLockSentinel) {
    wakeLockSentinel.release().catch(() => {});
    wakeLockSentinel = null;
  }
}

// Normalização de texto para busca sem acentos e case-insensitive
export function normalizeSearchText(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Detecção inteligente do tipo de tracking do exercício (tempo / distância / peso e reps)
export function getExerciseTrackingType(
  template?: { type?: ExerciseType } | null,
  title?: string
): ExerciseType {
  if (template?.type) return template.type;
  const t = normalizeSearchText(title || '');
  if (
    t.includes('esteira') ||
    t.includes('bicicleta') ||
    t.includes('bike') ||
    t.includes('eliptico') ||
    t.includes('transport') ||
    t.includes('remo') ||
    t.includes('rowing') ||
    t.includes('corrida') ||
    t.includes('caminhada') ||
    t.includes('air bike') ||
    t.includes('assault bike')
  ) {
    return 'distance_duration';
  }
  if (
    t.includes('prancha') ||
    t.includes('plank') ||
    t.includes('vacuum') ||
    t.includes('vacuo') ||
    t.includes('dead hang') ||
    t.includes('isometria') ||
    t.includes('isometrica') ||
    t.includes('alongamento') ||
    t.includes('pular corda') ||
    t.includes('corda') ||
    t.includes('jump rope') ||
    t.includes('wall sit') ||
    t.includes('l-sit') ||
    t.includes('escada') ||
    t.includes('stairmaster') ||
    t.includes('canoa') ||
    t.includes('hollow')
  ) {
    return 'duration';
  }
  return 'weight_reps';
}

// Áudio silencioso em loop para manter a MediaSession e background vivos no celular bloqueado
let silentAudioEl: HTMLAudioElement | null = null;
const SILENT_WAV = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAAAAP8A/wD/AP8A/wD/AP8A';

export function startBackgroundWorkoutAudio(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (!silentAudioEl) {
      silentAudioEl = new Audio(SILENT_WAV);
      silentAudioEl.loop = true;
      silentAudioEl.volume = 0.01;
    }
    silentAudioEl.play().catch(() => {
      // Browsers podem precisar de gesto do usuário
    });
    return true;
  } catch {
    return false;
  }
}

export function stopBackgroundWorkoutAudio(): void {
  try {
    if (silentAudioEl) {
      silentAudioEl.pause();
      silentAudioEl.currentTime = 0;
      silentAudioEl = null;
    }
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    }
  } catch {
    // Silencia erros
  }
}

export interface LockScreenState {
  title: string;
  artist: string;
  album?: string;
  onCheckOrSkip: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export function updateLockScreenMediaSession(state: LockScreenState | null): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  if (!state) {
    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    } catch {
      // Ignora
    }
    return;
  }

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.title,
      artist: state.artist,
      album: state.album || 'CHANGE Treino',
      artwork: [
        { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    });

    navigator.mediaSession.playbackState = 'playing';

    const actionHandler = () => {
      state.onCheckOrSkip();
    };

    navigator.mediaSession.setActionHandler('play', actionHandler);
    navigator.mediaSession.setActionHandler('pause', actionHandler);
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (state.onNext) state.onNext();
      else state.onCheckOrSkip();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (state.onPrev) state.onPrev();
    });
  } catch {
    // Ignora restrições do navegador
  }
}
