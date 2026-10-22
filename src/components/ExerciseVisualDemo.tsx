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
  const [viewMode, setViewMode] = useState<'video' | 'anatomy' | 'cadence'>('video');
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

        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-black text-white pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>Biomecânica 3D • Músculo em Destaque</span>
        </div>
      </div>
    );
  };

  // 2. MAPA ANATÔMICO CORPORAL ALTA DEFINIÇÃO (SYMMETRIA SYSTEM)
  const renderAnatomyMap = () => {
    return (
      <div className={`w-full flex flex-col sm:flex-row items-center justify-around gap-4 py-5 px-3 rounded-2xl border transition-colors ${
        isLight ? 'bg-white border-zinc-200' : 'bg-black border-zinc-800'
      }`}>
        {/* Visão Anterior (Frente) */}
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1">
            <User className="w-3 h-3" /> Visão Anterior (Frente)
          </span>

          <svg viewBox="0 0 160 260" className="w-36 h-60 select-none drop-shadow-md pointer-events-none">
            {/* Cabeça e Pescoço */}
            <path
              d="M 80 16 C 72 16, 68 26, 68 36 C 68 46, 73 52, 80 52 C 87 52, 92 46, 92 36 C 92 26, 88 16, 80 16 Z"
              fill={neutralBodyColor}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            <path d="M 74 52 L 72 63 L 88 63 L 86 52 Z" fill={neutralBodyColor} stroke={strokeColor} strokeWidth="1" />

            {/* Deltóides / Ombros (Esquerdo e Direito) */}
            <path
              d="M 57 66 C 47 67, 43 75, 43 85 C 43 93, 47 98, 53 97 C 56 93, 57 81, 58 69 Z"
              fill={getMuscleFill('ombros')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            <path
              d="M 103 66 C 113 67, 117 75, 117 85 C 117 93, 113 98, 107 97 C 104 93, 103 81, 102 69 Z"
              fill={getMuscleFill('ombros')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            {/* Peitoral Maior (Clavicular e Esternal) */}
            <path
              d="M 79 66 L 58 68 C 54 74, 55 86, 62 93 C 70 98, 77 96, 79 92 Z"
              fill={getMuscleFill('peito')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            <path
              d="M 81 66 L 102 68 C 106 74, 105 86, 98 93 C 90 98, 83 96, 81 92 Z"
              fill={getMuscleFill('peito')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            {/* Bíceps Braquial */}
            <path
              d="M 43 90 C 39 96, 38 109, 42 121 C 46 123, 50 121, 52 113 C 54 103, 51 93, 47 89 Z"
              fill={getMuscleFill('biceps')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            <path
              d="M 117 90 C 121 96, 122 109, 118 121 C 114 123, 110 121, 108 113 C 106 103, 109 93, 113 89 Z"
              fill={getMuscleFill('biceps')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            {/* Antebraços */}
            <path
              d="M 41 124 C 37 132, 35 147, 39 159 C 42 161, 45 160, 47 153 C 50 143, 49 131, 46 123 Z"
              fill={getMuscleFill('antebracos')}
              stroke={strokeColor}
              strokeWidth="1"
            />
            <path
              d="M 119 124 C 123 132, 125 147, 121 159 C 118 161, 115 160, 113 153 C 110 143, 111 131, 114 123 Z"
              fill={getMuscleFill('antebracos')}
              stroke={strokeColor}
              strokeWidth="1"
            />

            {/* Abdômen (Reto Abdominal 6-Pack e Oblíquos) */}
            {/* Superior */}
            <rect x="71" y="96" width="8" height="10" rx="2" fill={getMuscleFill('abdomen')} stroke={strokeColor} strokeWidth="0.8" />
            <rect x="81" y="96" width="8" height="10" rx="2" fill={getMuscleFill('abdomen')} stroke={strokeColor} strokeWidth="0.8" />
            {/* Médio */}
            <rect x="71" y="108" width="8" height="10" rx="2" fill={getMuscleFill('abdomen')} stroke={strokeColor} strokeWidth="0.8" />
            <rect x="81" y="108" width="8" height="10" rx="2" fill={getMuscleFill('abdomen')} stroke={strokeColor} strokeWidth="0.8" />
            {/* Inferior */}
            <rect x="72" y="120" width="7" height="11" rx="2" fill={getMuscleFill('abdomen')} stroke={strokeColor} strokeWidth="0.8" />
            <rect x="81" y="120" width="7" height="11" rx="2" fill={getMuscleFill('abdomen')} stroke={strokeColor} strokeWidth="0.8" />

            {/* Oblíquos Externos */}
            <path d="M 63 98 C 61 108, 62 120, 69 128 L 70 122 C 67 115, 67 105, 69 98 Z" fill={getMuscleFill('abdomen')} stroke={strokeColor} strokeWidth="0.8" />
            <path d="M 97 98 C 99 108, 98 120, 91 128 L 90 122 C 93 115, 93 105, 91 98 Z" fill={getMuscleFill('abdomen')} stroke={strokeColor} strokeWidth="0.8" />

            {/* Pelve e Quadril */}
            <path d="M 70 133 L 90 133 L 86 142 L 74 142 Z" fill={neutralBodyColor} stroke={strokeColor} strokeWidth="0.8" />

            {/* Quadríceps (Coxas Frente) */}
            <path
              d="M 64 136 C 58 147, 56 166, 60 183 C 64 185, 68 185, 69 177 C 71 161, 71 147, 70 136 Z"
              fill={getMuscleFill('quadriceps') !== '#E4E4E7' && getMuscleFill('quadriceps') !== '#27272A' ? getMuscleFill('quadriceps') : getMuscleFill('pernas')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            <path
              d="M 96 136 C 102 147, 104 166, 100 183 C 96 185, 92 185, 91 177 C 89 161, 89 147, 90 136 Z"
              fill={getMuscleFill('quadriceps') !== '#E4E4E7' && getMuscleFill('quadriceps') !== '#27272A' ? getMuscleFill('quadriceps') : getMuscleFill('pernas')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            {/* Joelhos */}
            <circle cx="65" cy="188" r="3.5" fill={neutralBodyColor} stroke={strokeColor} strokeWidth="1" />
            <circle cx="95" cy="188" r="3.5" fill={neutralBodyColor} stroke={strokeColor} strokeWidth="1" />

            {/* Panturrilhas / Canelas */}
            <path
              d="M 60 194 C 56 203, 57 220, 62 234 C 65 234, 68 233, 69 224 C 70 213, 69 201, 68 194 Z"
              fill={getMuscleFill('panturrilhas')}
              stroke={strokeColor}
              strokeWidth="1.1"
            />
            <path
              d="M 100 194 C 104 203, 103 220, 98 234 C 95 234, 92 233, 91 224 C 90 213, 91 201, 92 194 Z"
              fill={getMuscleFill('panturrilhas')}
              stroke={strokeColor}
              strokeWidth="1.1"
            />

            {/* Pés */}
            <path d="M 59 236 C 56 242, 58 246, 65 246 C 68 246, 68 241, 66 236 Z" fill={neutralBodyColor} stroke={strokeColor} strokeWidth="0.8" />
            <path d="M 101 236 C 104 242, 102 246, 95 246 C 92 246, 92 241, 94 236 Z" fill={neutralBodyColor} stroke={strokeColor} strokeWidth="0.8" />
          </svg>
        </div>

        {/* Visão Posterior (Costas) */}
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1">
            <User className="w-3 h-3" /> Visão Posterior (Costas)
          </span>

          <svg viewBox="0 0 160 260" className="w-36 h-60 select-none drop-shadow-md pointer-events-none">
            {/* Cabeça e Nuca */}
            <path
              d="M 80 16 C 72 16, 68 26, 68 36 C 68 46, 73 52, 80 52 C 87 52, 92 46, 92 36 C 92 26, 88 16, 80 16 Z"
              fill={neutralBodyColor}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            {/* Trapézio (Formato Diamante / Pipa) */}
            <polygon
              points="80,53 66,66 74,89 80,97 86,89 94,66"
              fill={getMuscleFill('trapezio')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            {/* Deltóides Posteriores */}
            <path
              d="M 57 66 C 49 69, 45 77, 45 86 C 49 88, 55 86, 58 79 C 59 74, 59 69, 57 66 Z"
              fill={getMuscleFill('ombros')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            <path
              d="M 103 66 C 111 69, 115 77, 115 86 C 111 88, 105 86, 102 79 C 101 74, 101 69, 103 66 Z"
              fill={getMuscleFill('ombros')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            {/* Tríceps Braquial */}
            <path
              d="M 44 88 C 40 95, 39 107, 43 119 C 47 121, 51 119, 52 111 C 52 101, 50 92, 47 88 Z"
              fill={getMuscleFill('triceps')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            <path
              d="M 116 88 C 120 95, 121 107, 117 119 C 113 121, 109 119, 108 111 C 108 101, 110 92, 113 88 Z"
              fill={getMuscleFill('triceps')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            {/* Grande Dorsal (Costas / Asa em V) */}
            <path
              d="M 68 76 C 60 84, 58 101, 66 116 L 76 113 C 74 101, 72 88, 72 76 Z"
              fill={getMuscleFill('costas')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            <path
              d="M 92 76 C 100 84, 102 101, 94 116 L 84 113 C 86 101, 88 88, 88 76 Z"
              fill={getMuscleFill('costas')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            {/* Lombar / Eretor da Espinha */}
            <polygon
              points="76,104 74,127 80,129 86,127 84,104"
              fill={getMuscleFill('lombar')}
              stroke={strokeColor}
              strokeWidth="1"
            />

            {/* Glúteos (Glúteo Máximo e Médio) */}
            <path
              d="M 63 128 C 57 135, 58 153, 66 159 C 74 163, 79 157, 80 147 L 80 130 Z"
              fill={getMuscleFill('gluteos')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            <path
              d="M 97 128 C 103 135, 102 153, 94 159 C 86 163, 81 157, 80 147 L 80 130 Z"
              fill={getMuscleFill('gluteos')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            {/* Isquiotibiais (Posterior de Coxa) */}
            <path
              d="M 62 161 C 59 171, 59 183, 63 189 C 68 190, 72 187, 73 179 C 75 171, 74 163, 72 160 Z"
              fill={getMuscleFill('isquiotibiais')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            <path
              d="M 98 161 C 101 171, 101 183, 97 189 C 92 190, 88 187, 87 179 C 85 171, 86 163, 88 160 Z"
              fill={getMuscleFill('isquiotibiais')}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            {/* Panturrilhas Posteriores (Gastrocnêmio) */}
            <path
              d="M 60 195 C 55 205, 56 219, 63 234 C 66 235, 69 233, 70 224 C 71 212, 69 201, 68 195 Z"
              fill={getMuscleFill('panturrilhas')}
              stroke={strokeColor}
              strokeWidth="1.1"
            />
            <path
              d="M 100 195 C 105 205, 104 219, 97 234 C 94 235, 91 233, 90 224 C 89 212, 91 201, 92 195 Z"
              fill={getMuscleFill('panturrilhas')}
              stroke={strokeColor}
              strokeWidth="1.1"
            />

            {/* Pés */}
            <path d="M 59 236 C 56 242, 58 246, 65 246 C 68 246, 68 241, 66 236 Z" fill={neutralBodyColor} stroke={strokeColor} strokeWidth="0.8" />
            <path d="M 101 236 C 104 242, 102 246, 95 246 C 92 246, 92 241, 94 236 Z" fill={neutralBodyColor} stroke={strokeColor} strokeWidth="0.8" />
          </svg>
        </div>
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
      {/* Seletor Superior: 3D Real vs Anatomia Symmetria vs Cadência */}
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

          <button
            onClick={() => setViewMode('cadence')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'cadence'
                ? isLight
                  ? 'bg-black text-white shadow-md'
                  : 'bg-white text-black shadow-md'
                : isLight
                ? 'text-zinc-600 hover:text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Cadência</span>
          </button>
        </div>

        {/* Badge Symmetria */}
        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-zinc-400 px-2">
          <Sparkles className="w-3 h-3 text-red-500" />
          <span className="hidden sm:inline">Symmetria Biomechanics</span>
        </div>
      </div>

      {/* Janela de Renderização */}
      <div className={`p-3.5 flex flex-col items-center justify-center border-b ${
        isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-black border-[#27272a]'
      }`}>
        {viewMode === 'video' && render3dVideo()}
        {viewMode === 'anatomy' && renderAnatomyMap()}
        {viewMode === 'cadence' && renderCadenceEngine()}

        {/* Legenda Anatômica dos Músculos */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-bold text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm" />
            <span className={isLight ? 'text-zinc-800' : 'text-zinc-200'}>Músculo Alvo (Primário)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shadow-sm" />
            <span className="text-zinc-500">Músculo Sinergista</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full inline-block shadow-sm ${isLight ? 'bg-zinc-300' : 'bg-zinc-700'}`} />
            <span className="text-zinc-500">Manequim</span>
          </div>
        </div>
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
