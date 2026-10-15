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
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playGymTone(type: 'countdown' | 'complete' | 'check'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (type === 'countdown') {
      // 3, 2, 1 subtle blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'complete') {
      // Rest timer finished: double high chime
      const now = ctx.currentTime;
      [880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.25, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.35);
      });
    } else if (type === 'check') {
      // Satisfying click / tap tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch {
    // AudioContext might be blocked until user gesture, safely ignore
  }
}

// Haptic feedback
export function triggerHaptic(type: 'light' | 'medium' | 'success' = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    if (type === 'light') {
      navigator.vibrate(15);
    } else if (type === 'medium') {
      navigator.vibrate(30);
    } else if (type === 'success') {
      navigator.vibrate([40, 60, 80]);
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
