import React, { useState, useEffect } from 'react';
import { Play, Pause, Activity, Dumbbell, User, Video, Sparkles, AlertCircle } from 'lucide-react';
import { ExerciseTemplate } from '../types';

interface ExerciseVisualDemoProps {
  exercise: ExerciseTemplate;
}

export const ExerciseVisualDemo: React.FC<ExerciseVisualDemoProps> = ({ exercise }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [frame, setFrame] = useState(0); // 0 (início) a 1 (contração máxima)
  const [viewMode, setViewMode] = useState<'video' | 'anatomy' | 'vector'>('video');
  const [gifLoaded, setGifLoaded] = useState(false);
  const [gifError, setGifError] = useState(false);

  // URL do GIF de animação 3D do boneco real com ativação muscular em vermelho
  const gifUrl = exercise.gif_id
    ? `https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/${exercise.gif_id}.gif`
    : exercise.gif_url || null;

  // Loop de animação contínua para o modo vetorial
  useEffect(() => {
    if (!isPlaying || viewMode !== 'vector') return;
    let direction = 1;
    const interval = setInterval(() => {
      setFrame((prev) => {
        if (prev >= 1) direction = -1;
        if (prev <= 0) direction = 1;
        const next = prev + direction * 0.045;
        return Math.max(0, Math.min(1, next));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, viewMode]);

  const pMuscle = exercise.primary_muscle_group?.toLowerCase() || 'peito';
  const sMuscles = exercise.secondary_muscle_groups?.map((m) => m.toLowerCase()) || [];

  const isPrimary = (group: string) => pMuscle.includes(group);
  const isSecondary = (group: string) => sMuscles.some((m) => m.includes(group));

  const getMuscleFill = (group: string) => {
    if (isPrimary(group)) return '#EF4444'; // Vermelho Hevy em evidência
    if (isSecondary(group)) return '#F97316'; // Laranja secundário
    return '#E4E4E7'; // Manequim Branco Neutro
  };

  // 1. VÍDEO DO BONECO 3D REAL (LOOP DE ALTA DEFINIÇÃO)
  const render3dVideo = () => {
    if (!gifUrl || gifError) {
      return renderMovementIllustration();
    }

    return (
      <div className="relative w-full h-64 flex items-center justify-center bg-black rounded-xl overflow-hidden">
        {/* Placeholder de carregamento */}
        {!gifLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <span className="text-[11px] font-bold text-zinc-400">Carregando animação 3D do boneco...</span>
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
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            gifLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
        />

        {/* Badge do Boneco Hevy */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-black text-white">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>Boneco 3D • Músculo Alvo em Destaque</span>
        </div>
      </div>
    );
  };

  // 2. DIAGRAMA VETORIAL DINÂMICO SVG (FALLBACK & CONTROLE DE CADÊNCIA)
  const renderMovementIllustration = () => {
    const f = frame;
    const animType = exercise.animation_type || 'bench_press';

    if (animType === 'squat') {
      const hipY = 125 + f * 45;
      const kneeX = 98 - f * 22;
      const kneeY = 165 + f * 10;
      const barY = 78 + f * 42;
      const quadFill = isPrimary('pernas') || isPrimary('quadriceps') ? '#EF4444' : '#E4E4E7';

      return (
        <svg viewBox="0 0 240 240" className="w-full h-56 select-none drop-shadow-md">
          <line x1="30" y1="222" x2="210" y2="222" stroke="#3F3F46" strokeWidth="3" strokeDasharray="4 4" />
          <circle cx="120" cy={barY - 18} r="15" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="2" />
          <path
            d={`M 112 ${barY - 3} C 112 ${barY + 15} 110 ${hipY - 15} 114 ${hipY} C 122 ${hipY} 128 ${hipY - 15} 128 ${barY - 3} Z`}
            fill="#FFFFFF"
            stroke="#D4D4D8"
            strokeWidth="2"
          />
          <path
            d={`M 120 ${hipY} Q ${kneeX + 16} ${kneeY - 15} ${kneeX} ${kneeY} Q ${kneeX + 12} ${kneeY + 6} 118 ${hipY + 12} Z`}
            fill={quadFill}
            stroke="#A1A1AA"
            strokeWidth="2"
          />
          <line x1={kneeX} y1={kneeY} x2="102" y2="220" stroke="#E4E4E7" strokeWidth="8" strokeLinecap="round" />
          <rect x="25" y={barY - 2} width="190" height="6" rx="2" fill="#FFFFFF" />
          <rect x="42" y={barY - 26} width="12" height="52" rx="3" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.5" />
          <rect x="186" y={barY - 26} width="12" height="52" rx="3" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.5" />
        </svg>
      );
    }

    if (animType === 'deadlift') {
      const hipY = 158 - f * 34;
      const hipX = 86 + f * 24;
      const shoulderX = 136 - f * 20;
      const shoulderY = 126 - f * 42;
      const barY = 192 - f * 82;
      const backFill = isPrimary('costas') ? '#EF4444' : '#E4E4E7';

      return (
        <svg viewBox="0 0 240 240" className="w-full h-56 select-none drop-shadow-md">
          <line x1="30" y1="222" x2="210" y2="222" stroke="#3F3F46" strokeWidth="3" strokeDasharray="4 4" />
          <circle cx={shoulderX} cy={shoulderY - 18} r="14" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="2" />
          <path
            d={`M ${shoulderX - 6} ${shoulderY} Q ${(shoulderX + hipX) / 2 - 8} ${(shoulderY + hipY) / 2} ${hipX - 4} ${hipY} L ${hipX + 8} ${hipY + 4} Q ${(shoulderX + hipX) / 2 + 8} ${(shoulderY + hipY) / 2} ${shoulderX + 6} ${shoulderY} Z`}
            fill={backFill}
            stroke="#A1A1AA"
            strokeWidth="2"
          />
          <line x1={shoulderX} y1={shoulderY + 6} x2="136" y2={barY} stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
          <line x1="55" y1={barY} x2="215" y2={barY} stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
          <circle cx="65" cy={barY} r="22" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
          <circle cx="205" cy={barY} r="22" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
        </svg>
      );
    }

    // Padrão: Supino Reto
    const barY = 92 + f * 42;
    const elbowY = 120 + f * 22;
    const chestFill = isPrimary('peito') ? '#EF4444' : '#E4E4E7';

    return (
      <svg viewBox="0 0 240 240" className="w-full h-56 select-none drop-shadow-md">
        <rect x="25" y="166" width="180" height="10" rx="3" fill="#27272A" />
        <circle cx="62" cy="154" r="14" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="2" />
        <path
          d="M 76 156 Q 105 136 142 156 L 150 166 L 76 166 Z"
          fill={chestFill}
          stroke="#A1A1AA"
          strokeWidth="2"
        />
        <line x1="104" y1={elbowY} x2="108" y2={barY} stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
        <line x1="45" y1={barY} x2="175" y2={barY} stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
        <rect x="38" y={barY - 24} width="12" height="48" rx="3" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.5" />
        <rect x="170" y={barY - 24} width="12" height="48" rx="3" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.5" />
      </svg>
    );
  };

  // 3. MAPA ANATÔMICO CORPORAL COMPLETO (FRENTE E COSTAS)
  const renderAnatomyMap = () => {
    return (
      <div className="w-full flex items-center justify-around py-4 px-2 bg-black rounded-xl">
        {/* Boneco Visão Frontal */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Visão Frontal
          </span>
          <svg viewBox="0 0 120 220" className="w-32 h-56 select-none drop-shadow">
            <circle cx="60" cy="22" r="13" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="1.5" />
            <circle cx="38" cy="44" r="8" fill={getMuscleFill('ombros')} stroke="#A1A1AA" strokeWidth="1" />
            <circle cx="82" cy="44" r="8" fill={getMuscleFill('ombros')} stroke="#A1A1AA" strokeWidth="1" />
            <rect x="44" y="44" width="15" height="16" rx="4" fill={getMuscleFill('peito')} stroke="#A1A1AA" strokeWidth="1" />
            <rect x="61" y="44" width="15" height="16" rx="4" fill={getMuscleFill('peito')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="32" cy="66" rx="5" ry="10" fill={getMuscleFill('biceps')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="88" cy="66" rx="5" ry="10" fill={getMuscleFill('biceps')} stroke="#A1A1AA" strokeWidth="1" />
            <rect x="52" y="64" width="16" height="24" rx="3" fill={getMuscleFill('abdomen')} stroke="#A1A1AA" strokeWidth="1" />
            <path d="M 44 98 Q 40 125 46 148 L 56 148 Q 58 125 56 98 Z" fill={getMuscleFill('quadriceps') !== '#E4E4E7' ? getMuscleFill('quadriceps') : getMuscleFill('pernas')} stroke="#A1A1AA" strokeWidth="1" />
            <path d="M 64 98 Q 62 125 64 148 L 74 148 Q 80 125 76 98 Z" fill={getMuscleFill('quadriceps') !== '#E4E4E7' ? getMuscleFill('quadriceps') : getMuscleFill('pernas')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="48" cy="176" rx="5" ry="16" fill={getMuscleFill('panturrilhas')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="72" cy="176" rx="5" ry="16" fill={getMuscleFill('panturrilhas')} stroke="#A1A1AA" strokeWidth="1" />
          </svg>
        </div>

        {/* Boneco Visão Traseira */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Visão Posterior
          </span>
          <svg viewBox="0 0 120 220" className="w-32 h-56 select-none drop-shadow">
            <circle cx="60" cy="22" r="13" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="1.5" />
            <polygon points="60,35 44,48 76,48" fill={getMuscleFill('trapezio')} stroke="#A1A1AA" strokeWidth="1" />
            <circle cx="38" cy="45" r="7" fill={getMuscleFill('ombros')} stroke="#A1A1AA" strokeWidth="1" />
            <circle cx="82" cy="45" r="7" fill={getMuscleFill('ombros')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="32" cy="65" rx="5" ry="10" fill={getMuscleFill('triceps')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="88" cy="65" rx="5" ry="10" fill={getMuscleFill('triceps')} stroke="#A1A1AA" strokeWidth="1" />
            <path d="M 44 48 Q 40 70 54 80 L 66 80 Q 80 70 76 48 Z" fill={getMuscleFill('costas')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="50" cy="106" rx="10" ry="10" fill={getMuscleFill('gluteos')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="70" cy="106" rx="10" ry="10" fill={getMuscleFill('gluteos')} stroke="#A1A1AA" strokeWidth="1" />
            <path d="M 42 120 Q 40 135 44 148 L 56 148 Q 58 135 56 120 Z" fill={getMuscleFill('isquiotibiais')} stroke="#A1A1AA" strokeWidth="1" />
            <path d="M 64 120 Q 62 135 64 148 L 76 148 Q 80 135 78 120 Z" fill={getMuscleFill('isquiotibiais')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="48" cy="176" rx="6" ry="15" fill={getMuscleFill('panturrilhas')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="72" cy="176" rx="6" ry="15" fill={getMuscleFill('panturrilhas')} stroke="#A1A1AA" strokeWidth="1" />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#141416] border border-[#27272a] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
      {/* Seletor de Modo: Boneco 3D Real vs Anatomia vs Diagrama */}
      <div className="flex items-center justify-between bg-[#000000] p-2 border-b border-[#27272a]">
        <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a]">
          <button
            onClick={() => setViewMode('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'video'
                ? 'bg-white text-black shadow-md'
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
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Anatomia</span>
          </button>

          <button
            onClick={() => setViewMode('vector')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'vector'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Cadência</span>
          </button>
        </div>

        {viewMode === 'vector' && (
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2.5 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-white" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-white" />
                <span>Animar</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Janela de Renderização */}
      <div className="relative bg-[#000000] flex flex-col items-center justify-center p-3 border-b border-[#27272a]">
        {viewMode === 'video' && render3dVideo()}
        {viewMode === 'anatomy' && renderAnatomyMap()}
        {viewMode === 'vector' && renderMovementIllustration()}

        {/* Legenda dos Músculos */}
        <div className="flex items-center justify-center gap-3.5 mt-2.5 text-[10px] font-bold text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm" />
            <span className="text-zinc-200">Músculo Alvo (Em Destaque)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 inline-block shadow-sm" />
            <span className="text-zinc-400">Boneco Manequim</span>
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
                className="px-2.5 py-1 rounded-lg bg-[#27272a] text-zinc-300 font-semibold text-xs border border-[#3f3f46]"
              >
                + {m}
              </span>
            ))}
          </div>
        </div>

        {/* Passo a Passo */}
        {exercise.steps && exercise.steps.length > 0 && (
          <div>
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block mb-2">
              Execução Correta Passo a Passo
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

        {/* Dicas e Postura */}
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
