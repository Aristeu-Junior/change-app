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
