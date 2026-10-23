import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Activity,
  Dumbbell,
  User,
  Video,
  Sparkles,
  RotateCcw,
  Zap,
  Timer,
  CheckCircle2,
  Info
} from 'lucide-react';
import { ExerciseTemplate } from '../types';
import { useApp } from '../context/AppContext';
import { SymmetryBodyMap } from './SymmetryBodyMap';

interface ExerciseVisualDemoProps {
  exercise: ExerciseTemplate;
}

type CadencePreset = 'hypertrophy' | 'strength' | 'time_under_tension';

interface CadencePhase {
  name: string;
  duration: number; // segundos
  color: string;
  instruction: string;
}

export const ExerciseVisualDemo: React.FC<ExerciseVisualDemoProps> = ({ exercise }) => {
  const { theme } = useApp();
  const isLight = theme === 'light';

  const [isPlaying, setIsPlaying] = useState(true);
  const [viewMode, setViewMode] = useState<'video' | 'anatomy'>('video');
  const [gifLoaded, setGifLoaded] = useState(false);
  const [gifError, setGifError] = useState(false);
  const [activePreset, setActivePreset] = useState<CadencePreset>('hypertrophy');

  // URL do GIF do Boneco 3D
  const gifUrl = exercise.gif_id
    ? `https://cdn.jsdelivr.net/gh/omercotkd/exercises-gifs@main/assets/${exercise.gif_id}.gif`
    : exercise.gif_url || null;

  // Presets de Cadência estilo Symmetria
  const PRESETS: Record<CadencePreset, { label: string; tempo: string; phases: CadencePhase[] }> = {
    hypertrophy: {
      label: 'Hipertrofia Pura',
      tempo: '3 - 1 - 1 - 1',
      phases: [
        { name: 'Excêntrica (Descida)', duration: 3.0, color: '#3B82F6', instruction: 'Desça com controle e sinta as fibras alongarem' },
        { name: 'Ponto de Inversão', duration: 1.0, color: '#8B5CF6', instruction: 'Transição suave sem perder a tensão mecânica' },
        { name: 'Concêntrica (Subida)', duration: 1.0, color: '#10B981', instruction: 'Exploda com força e vença a gravidade' },
        { name: 'Pico de Contração', duration: 1.0, color: '#EF4444', instruction: 'Aperte ao máximo o músculo alvo no topo' }
      ]
    },
    strength: {
      label: 'Força & Potência',
      tempo: '2 - 0 - 1 - 0',
      phases: [
        { name: 'Excêntrica', duration: 2.0, color: '#3B82F6', instruction: 'Descida rápida porém firme e estável' },
        { name: 'Concêntrica', duration: 1.0, color: '#10B981', instruction: 'Máxima aceleração e explosão de força' }
      ]
    },
    time_under_tension: {
      label: 'Tensão Máxima (TUT)',
      tempo: '4 - 2 - 2 - 1',
      phases: [
        { name: 'Descida Controlada', duration: 4.0, color: '#3B82F6', instruction: 'Descida lenta e contínua de 4 segundos' },
        { name: 'Pausa Isométrica', duration: 2.0, color: '#8B5CF6', instruction: 'Segure 2s no ponto de maior esforço' },
        { name: 'Subida Guiada', duration: 2.0, color: '#10B981', instruction: 'Suba sem solavancos e sem descansar' },
        { name: 'Trava Muscular', duration: 1.0, color: '#EF4444', instruction: 'Contração voluntária de pico antes de descer' }
      ]
    }
  };

  const currentPresetData = PRESETS[activePreset];
  const totalCycleDuration = currentPresetData.phases.reduce((acc, p) => acc + p.duration, 0);

  // Estado do Motor de Cadência Symmetria
  const [cycleTime, setCycleTime] = useState(0); // 0 a totalCycleDuration
  const [repsDone, setRepsDone] = useState(0);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    if (!isPlaying || viewMode !== 'cadence') {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setCycleTime((prev) => {
        const next = prev + delta;
        if (next >= totalCycleDuration) {
          setRepsDone((r) => r + 1);
          return next % totalCycleDuration;
        }
        return next;
      });

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, viewMode, totalCycleDuration]);

  // Identifica a fase atual
  let accumulated = 0;
  let activePhaseIndex = 0;
  let phaseProgress = 0;

  for (let i = 0; i < currentPresetData.phases.length; i++) {
    const phase = currentPresetData.phases[i];
    if (cycleTime >= accumulated && cycleTime < accumulated + phase.duration) {
      activePhaseIndex = i;
      phaseProgress = (cycleTime - accumulated) / phase.duration;
      break;
    }
    accumulated += phase.duration;
  }

  const activePhase = currentPresetData.phases[activePhaseIndex] || currentPresetData.phases[0];

  // Identificação dos Grupos Musculares
  const pMuscle = exercise.primary_muscle_group?.toLowerCase() || 'peito';
  const sMuscles = exercise.secondary_muscle_groups?.map((m) => m.toLowerCase()) || [];

  const isPrimary = (group: string) => pMuscle.includes(group);
  const isSecondary = (group: string) => sMuscles.some((m) => m.includes(group));

  const getMuscleFill = (group: string) => {
    if (isPrimary(group)) return '#EF4444'; // Vermelho Neon Primário Symmetria
    if (isSecondary(group)) return '#F97316'; // Laranja Âmbar Secundário
    return isLight ? '#E4E4E7' : '#27272A'; // Manequim elegante
  };

  const strokeColor = isLight ? '#A1A1AA' : '#3F3F46';
  const neutralBodyColor = isLight ? '#F4F4F5' : '#18181B';

  // 1. VÍDEO DO BONECO 3D REAL
  const render3dVideo = () => {
    if (!gifUrl || gifError) {
      return renderAnatomyMap();
    }

    return (
      <div className="relative w-full h-64 sm:h-72 flex items-center justify-center bg-black rounded-xl overflow-hidden">
        {!gifLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <span className="text-[11px] font-bold text-zinc-400">Carregando animação 3D...</span>
          </div>
        )}

        <img
          src={gifUrl}
          alt={exercise.title}
          onLoad={() => setGifLoaded(true)}
          onError={() => {
            setGifError(true);
            setGifLoaded(true);
          }}
          className={`w-full h-full object-contain pointer-events-none select-none transition-opacity duration-300 ${
            gifLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
        />
      </div>
    );
  };

  // 2. MAPA ANATÔMICO CORPORAL SYMMETRY (ANDRÓIDE BIO-VETORIAL)
  const renderAnatomyMap = () => {
    return (
      <div className={`w-full flex flex-col items-center justify-center py-4 px-3 rounded-2xl border transition-colors ${
        isLight ? 'bg-white border-zinc-200' : 'bg-black border-zinc-800'
      }`}>
        <SymmetryBodyMap
          primaryMuscles={[pMuscle]}
          secondaryMuscles={sMuscles}
          view="both"
          size="md"
          showLabels
        />
      </div>
    );
  };

  // 3. MOTOR DE CADÊNCIA & TEMPO DE HIPERTROFIA (SYMMETRIA ENGINE)
  const renderCadenceEngine = () => {
    const cycleProgress = cycleTime / totalCycleDuration;

    return (
      <div className={`w-full p-4 rounded-2xl border flex flex-col items-center gap-5 transition-colors ${
        isLight ? 'bg-white border-zinc-200' : 'bg-black border-zinc-800'
      }`}>
        {/* Seletor de Ritmo & Cadência */}
        <div className="w-full flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-xs font-black tracking-wide uppercase">Cadência Symmetria</span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
            {(['hypertrophy', 'strength', 'time_under_tension'] as CadencePreset[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setActivePreset(p);
                  setCycleTime(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition ${
                  activePreset === p
                    ? 'bg-white text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {PRESETS[p].label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Mostrador Circular de Cadência em Tempo Real */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Círculo de fundo */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={isLight ? '#E4E4E7' : '#27272A'}
              strokeWidth="8"
              fill="none"
            />
            {/* Círculo animado com cor da fase ativa */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={activePhase.color}
              strokeWidth="8"
              fill="none"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={2 * Math.PI * 40 * (1 - cycleProgress)}
              strokeLinecap="round"
              className="transition-all duration-75"
            />
          </svg>

          {/* Centro do Contador */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
            <span
              className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 text-white shadow-sm"
              style={{ backgroundColor: activePhase.color }}
            >
              {activePhase.name.split(' ')[0]}
            </span>
            <span className="text-3xl font-black tracking-tight">
              {cycleTime.toFixed(1)}s
            </span>
            <span className="text-[10px] font-bold text-zinc-500">
              {repsDone} repetições
            </span>
          </div>
        </div>

        {/* Barra de Fases com Instrução Sonora / Visual */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-zinc-400">Tempo Alvo:</span>
            <span className="font-mono font-black text-sm">{currentPresetData.tempo}</span>
          </div>

          {/* Gráfico de Barras Segmentadas das Fases */}
          <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-zinc-800">
            {currentPresetData.phases.map((ph, idx) => {
              const widthPct = (ph.duration / totalCycleDuration) * 100;
              const isCurrent = idx === activePhaseIndex;
              return (
                <div
                  key={ph.name}
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: ph.color,
                    opacity: isCurrent ? 1 : 0.4
                  }}
                  className="h-full transition-opacity duration-150"
                />
              );
            })}
          </div>

          {/* Instrução Biomecânica da Fase Atual */}
          <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
            isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <div
              className="w-3 h-3 rounded-full shrink-0 animate-ping"
              style={{ backgroundColor: activePhase.color }}
            />
            <p className="text-xs font-semibold leading-relaxed">
              {activePhase.instruction}
            </p>
          </div>
        </div>

        {/* Controles de Play / Pause / Reset da Cadência */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 rounded-xl bg-white text-black font-black text-xs flex items-center gap-2 shadow hover:opacity-90 active:scale-95 transition"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-black" /> Pausar Cadência
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" /> Retomar Cadência
              </>
            )}
          </button>

          <button
            onClick={() => {
              setCycleTime(0);
              setRepsDone(0);
            }}
            title="Reiniciar Repetições"
            className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-2xl overflow-hidden flex flex-col shadow-2xl border transition-colors ${
      isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#141416] border-[#27272a]'
    }`}>
      {/* Seletor Superior: Boneco 3D vs Anatomia */}
      <div className={`flex items-center justify-between p-2.5 border-b ${
        isLight ? 'bg-white border-zinc-200' : 'bg-[#000000] border-[#27272a]'
      }`}>
        <div className={`flex items-center gap-1 p-1 rounded-xl border ${
          isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-[#18181b] border-[#27272a]'
        }`}>
          <button
            onClick={() => setViewMode('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'video'
                ? isLight
                  ? 'bg-black text-white shadow-md'
                  : 'bg-white text-black shadow-md'
                : isLight
                ? 'text-zinc-600 hover:text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Boneco 3D</span>
          </button>

          <button
            onClick={() => setViewMode('anatomy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'anatomy'
                ? isLight
                  ? 'bg-black text-white shadow-md'
                  : 'bg-white text-black shadow-md'
                : isLight
                ? 'text-zinc-600 hover:text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Anatomia</span>
          </button>
        </div>
      </div>

      {/* Janela de Renderização */}
      <div className={`p-3.5 flex flex-col items-center justify-center border-b ${
        isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-black border-[#27272a]'
      }`}>
        {viewMode === 'video' && render3dVideo()}
        {viewMode === 'anatomy' && renderAnatomyMap()}
      </div>

      {/* Informações Anatômicas e Instruções Biomecânicas */}
      <div className="p-4 space-y-4 text-left">
        {/* Músculos Trabalhados */}
        <div>
          <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block mb-1.5">
            Músculos Trabalhados
          </span>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-3 py-1 rounded-lg bg-red-600 text-white font-extrabold text-xs shadow-sm flex items-center gap-1">
              ★ {exercise.muscles_pt || exercise.primary_muscle_group.toUpperCase()}
            </span>
            {exercise.secondary_muscle_groups?.map((m) => (
              <span
                key={m}
                className={`px-2.5 py-1 rounded-lg font-semibold text-xs border ${
                  isLight
                    ? 'bg-zinc-200 text-zinc-800 border-zinc-300'
                    : 'bg-[#27272a] text-zinc-300 border-[#3f3f46]'
                }`}
              >
                + {m}
              </span>
            ))}
          </div>
        </div>

        {/* Execução Correta Passo a Passo */}
        {exercise.steps && exercise.steps.length > 0 && (
          <div>
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block mb-2">
              Execução Correta Passo a Passo
            </span>
            <div className="space-y-2">
              {exercise.steps.map((st, sIdx) => (
                <div key={sIdx} className="flex items-start gap-2.5 text-xs">
                  <span
                    className={`w-5 h-5 rounded-full font-black flex items-center justify-center shrink-0 text-[10px] ${
                      isLight ? 'bg-black text-white' : 'bg-white text-black'
                    }`}
                  >
                    {sIdx + 1}
                  </span>
                  <p className={`leading-relaxed ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{st}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dicas e Postura */}
        {exercise.tips && exercise.tips.length > 0 && (
          <div className={`p-3.5 rounded-xl border space-y-1.5 ${
            isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-[#1c1c1f] border-[#27272a]'
          }`}>
            <span className={`text-[11px] uppercase tracking-wider font-extrabold block ${
              isLight ? 'text-black' : 'text-white'
            }`}>
              Dicas de Ouro & Postura
            </span>
            <ul className={`space-y-1 text-xs list-disc list-inside ${
              isLight ? 'text-zinc-700' : 'text-zinc-300'
            }`}>
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
