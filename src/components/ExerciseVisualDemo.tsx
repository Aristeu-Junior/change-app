import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';
import { ExerciseTemplate } from '../types';

interface ExerciseVisualDemoProps {
  exercise: ExerciseTemplate;
}

export const ExerciseVisualDemo: React.FC<ExerciseVisualDemoProps> = ({ exercise }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [frame, setFrame] = useState(0); // 0 (start) to 1 (contracted)

  // Smooth animation loop simulating the exercise movement cadence
  useEffect(() => {
    if (!isPlaying) return;
    let direction = 1;
    const interval = setInterval(() => {
      setFrame((prev) => {
        if (prev >= 1) direction = -1;
        if (prev <= 0) direction = 1;
        const next = prev + direction * 0.05;
        return Math.max(0, Math.min(1, next));
      });
    }, 60);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Render movement-specific SVG based on animation_type
  const renderMovementIllustration = () => {
    const f = frame; // 0 to 1
    const animType = exercise.animation_type || 'bench_press';

    if (animType === 'squat') {
      // Barbell Squat: standing -> deep squat
      const hipY = 130 + f * 50;
      const kneeX = 90 - f * 20;
      const kneeY = 170 + f * 10;
      const barY = 80 + f * 45;

      return (
        <svg viewBox="0 0 240 240" className="w-full h-48 select-none">
          {/* Ground */}
          <line x1="20" y1="220" x2="220" y2="220" stroke="currentColor" strokeWidth="3" opacity="0.4" />
          {/* Head & Torso */}
          <circle cx="120" cy={barY - 15} r="14" fill="currentColor" />
          <line x1="120" y1={barY - 5} x2="120" y2={hipY} stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          {/* Thigh (Hip to Knee) */}
          <line x1="120" y1={hipY} x2={kneeX} y2={kneeY} stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          {/* Shin (Knee to Foot) */}
          <line x1={kneeX} y1={kneeY} x2="95" y2="218" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
          {/* Barbell */}
          <line x1="40" y1={barY} x2="200" y2={barY} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <rect x="35" y={barY - 20} width="10" height="40" rx="3" fill="currentColor" />
          <rect x="195" y={barY - 20} width="10" height="40" rx="3" fill="currentColor" />
          {/* Arms holding bar */}
          <line x1="120" y1={barY + 10} x2="80" y2={barY} stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <line x1="120" y1={barY + 10} x2="160" y2={barY} stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    }

    if (animType === 'deadlift') {
      // Deadlift: bent over -> lockout
      const hipY = 160 - f * 35;
      const hipX = 85 + f * 25;
      const shoulderX = 135 - f * 20;
      const shoulderY = 130 - f * 45;
      const barY = 190 - f * 80;

      return (
        <svg viewBox="0 0 240 240" className="w-full h-48 select-none">
          <line x1="20" y1="220" x2="220" y2="220" stroke="currentColor" strokeWidth="3" opacity="0.4" />
          {/* Head */}
          <circle cx={shoulderX} cy={shoulderY - 18} r="13" fill="currentColor" />
          {/* Torso */}
          <line x1={shoulderX} y1={shoulderY} x2={hipX} y2={hipY} stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          {/* Legs */}
          <line x1={hipX} y1={hipY} x2="110" y2="175" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          <line x1="110" y1="175" x2="115" y2="218" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
          {/* Arm to bar */}
          <line x1={shoulderX} y1={shoulderY} x2="135" y2={barY} stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          {/* Barbell */}
          <line x1="70" y1={barY} x2="200" y2={barY} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <circle cx="70" cy={barY} r="18" fill="currentColor" opacity="0.9" />
          <circle cx="200" cy={barY} r="18" fill="currentColor" opacity="0.9" />
        </svg>
      );
    }

    if (animType === 'pull_up' || animType === 'lat_pulldown') {
      // Pull Up / Lat Pulldown: arms extended -> chin above bar / bar to chest
      const bodyY = 150 - f * 40;
      const elbowY = 100 + f * 30;

      return (
        <svg viewBox="0 0 240 240" className="w-full h-48 select-none">
          {/* Overhead Bar */}
          <line x1="30" y1="40" x2="210" y2="40" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          {/* Hands on bar */}
          <circle cx="65" cy="40" r="5" fill="currentColor" />
          <circle cx="175" cy="40" r="5" fill="currentColor" />
          {/* Arms */}
          <line x1="65" y1="40" x2="80" y2={elbowY} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <line x1="80" y1={elbowY} x2="110" y2={bodyY - 20} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <line x1="175" y1="40" x2="160" y2={elbowY} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <line x1="160" y1={elbowY} x2="130" y2={bodyY - 20} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          {/* Head & Torso */}
          <circle cx="120" cy={bodyY - 35} r="13" fill="currentColor" />
          <line x1="120" y1={bodyY - 20} x2="120" y2={bodyY + 35} stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          {/* Legs */}
          <line x1="120" y1={bodyY + 35} x2="110" y2={bodyY + 75} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <line x1="120" y1={bodyY + 35} x2="130" y2={bodyY + 75} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </svg>
      );
    }

    if (animType === 'curl') {
      // Bicep Curl: arm down -> curled up
      const handX = 145 - f * 35;
      const handY = 165 - f * 70;

      return (
        <svg viewBox="0 0 240 240" className="w-full h-48 select-none">
          <line x1="30" y1="220" x2="210" y2="220" stroke="currentColor" strokeWidth="3" opacity="0.4" />
          {/* Head & Torso */}
          <circle cx="100" cy="50" r="14" fill="currentColor" />
          <line x1="100" y1="65" x2="100" y2="150" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          {/* Legs */}
          <line x1="100" y1="150" x2="90" y2="218" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
          <line x1="100" y1="150" x2="115" y2="218" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
          {/* Upper Arm (Shoulder to Elbow) */}
          <line x1="100" y1="75" x2="115" y2="125" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
          {/* Forearm (Elbow to Hand) */}
          <line x1="115" y1="125" x2={handX} y2={handY} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          {/* Dumbbell */}
          <line x1={handX - 10} y1={handY} x2={handX + 10} y2={handY} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <rect x={handX - 14} y={handY - 10} width="6" height="20" rx="2" fill="currentColor" />
          <rect x={handX + 8} y={handY - 10} width="6" height="20" rx="2" fill="currentColor" />
        </svg>
      );
    }

    // Default: Barbell Bench Press (Supino Reto)
    // Bar lowering to chest and pressing back up
    const barY = 90 + f * 42;
    const elbowY = 120 + f * 20;

    return (
      <svg viewBox="0 0 240 240" className="w-full h-48 select-none">
        {/* Bench */}
        <line x1="30" y1="165" x2="210" y2="165" stroke="currentColor" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
        <line x1="60" y1="165" x2="60" y2="215" stroke="currentColor" strokeWidth="6" opacity="0.3" />
        <line x1="180" y1="165" x2="180" y2="215" stroke="currentColor" strokeWidth="6" opacity="0.3" />
        {/* Head & Torso on Bench */}
        <circle cx="65" cy="150" r="13" fill="currentColor" />
        <line x1="75" y1="155" x2="160" y2="155" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
        {/* Legs off bench */}
        <line x1="160" y1="155" x2="185" y2="180" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
        <line x1="185" y1="180" x2="190" y2="218" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
        {/* Arms pushing bar */}
        <line x1="110" y1="155" x2="105" y2={elbowY} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        <line x1="105" y1={elbowY} x2="110" y2={barY} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        {/* Barbell & Plates */}
        <line x1="50" y1={barY} x2="170" y2={barY} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        <rect x="44" y={barY - 18} width="8" height="36" rx="2" fill="currentColor" />
        <rect x="168" y={barY - 18} width="8" height="36" rx="2" fill="currentColor" />
      </svg>
    );
  };

  return (
    <div className="bg-[#141416] border border-[#27272a] rounded-2xl overflow-hidden flex flex-col shadow-lg">
      {/* Visual Animation Player Frame */}
      <div className="relative bg-[#09090b] flex flex-col items-center justify-center p-4 border-b border-[#27272a] text-white">
        {/* Play/Pause Control pill */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-xs font-bold flex items-center gap-1 text-white hover:opacity-80 transition"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-white" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Animar</span>
              </>
            )}
          </button>
        </div>

        {/* Phase indicator badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/10 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white">
          <Activity className="w-3 h-3 text-white" />
          <span>{frame > 0.6 ? 'Contração Máxima' : 'Posição Inicial'}</span>
        </div>

        {/* SVG Movement */}
        <div className="w-full flex items-center justify-center">
          {renderMovementIllustration()}
        </div>

        {/* Cadence Timeline Slider */}
        <div className="w-full px-4 pt-1 flex items-center gap-3">
          <span className="text-[10px] font-mono text-zinc-500">0s</span>
          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.round(frame * 100)}%` }}
              className="h-full bg-white transition-all duration-75"
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-300">Forma</span>
        </div>
      </div>

      {/* Anatomical Muscle Highlight & Detailed Form Cues */}
      <div className="p-4 space-y-4 text-left">
        {/* Target Muscles */}
        <div>
          <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">
            Músculos Alvo & Anatomia
          </span>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2.5 py-1 rounded-lg bg-white text-black font-extrabold text-xs">
              Principal: {exercise.muscles_pt || exercise.primary_muscle_group.toUpperCase()}
            </span>
            {exercise.secondary_muscle_groups?.map((m) => (
              <span
                key={m}
                className="px-2.5 py-1 rounded-lg bg-[#27272a] text-zinc-300 font-semibold text-xs border border-[#3f3f46]"
              >
                Sinergista: {m}
              </span>
            ))}
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        {exercise.steps && exercise.steps.length > 0 && (
          <div>
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block mb-2">
              Passo a Passo de Execução
            </span>
            <div className="space-y-2">
              {exercise.steps.map((st, sIdx) => (
                <div key={sIdx} className="flex items-start gap-2.5 text-xs text-zinc-200">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-black flex items-center justify-center shrink-0 text-[10px]">
                    {sIdx + 1}
                  </span>
                  <p className="leading-relaxed">{st}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Cues & Hevy Tips */}
        {exercise.tips && exercise.tips.length > 0 && (
          <div className="bg-[#1c1c1f] p-3 rounded-xl border border-[#27272a] space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider text-white font-extrabold block">
              Dicas de Ouro & Postura
            </span>
            <ul className="space-y-1 text-xs text-zinc-300 list-disc list-inside">
              {exercise.tips.map((tip, tIdx) => (
                <li key={tIdx} className="leading-relaxed">{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
