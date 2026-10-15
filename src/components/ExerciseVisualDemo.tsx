import React, { useState, useEffect } from 'react';
import { Play, Pause, Activity, Dumbbell, User } from 'lucide-react';
import { ExerciseTemplate } from '../types';

interface ExerciseVisualDemoProps {
  exercise: ExerciseTemplate;
}

export const ExerciseVisualDemo: React.FC<ExerciseVisualDemoProps> = ({ exercise }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [frame, setFrame] = useState(0); // 0 (início) a 1 (contração máxima)
  const [viewMode, setViewMode] = useState<'movement' | 'anatomy'>('movement');

  // Loop de animação contínua e suave para a cadência do exercício
  useEffect(() => {
    if (!isPlaying) return;
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
  }, [isPlaying]);

  const pMuscle = exercise.primary_muscle_group?.toLowerCase() || 'peito';
  const sMuscles = exercise.secondary_muscle_groups?.map((m) => m.toLowerCase()) || [];

  const isPrimary = (group: string) => pMuscle.includes(group);
  const isSecondary = (group: string) => sMuscles.some((m) => m.includes(group));

  const getMuscleFill = (group: string) => {
    if (isPrimary(group)) return '#EF4444'; // Vermelho Hevy em evidência
    if (isSecondary(group)) return '#F97316'; // Laranja secundário
    return '#E4E4E7'; // Manequim Branco Neutro
  };

  // 1. ILUSTRAÇÃO DO BONECO HEVY EM EXECUÇÃO
  const renderMovementIllustration = () => {
    const f = frame;
    const animType = exercise.animation_type || 'bench_press';

    // A. AGACHAMENTO (SQUAT)
    if (animType === 'squat') {
      const hipY = 125 + f * 45;
      const kneeX = 98 - f * 22;
      const kneeY = 165 + f * 10;
      const barY = 78 + f * 42;
      const quadFill = isPrimary('pernas') || isPrimary('quadriceps') ? '#EF4444' : '#E4E4E7';
      const gluteFill = isPrimary('gluteos') || isSecondary('gluteos') ? '#EF4444' : '#E4E4E7';

      return (
        <svg viewBox="0 0 240 240" className="w-full h-52 select-none drop-shadow-md">
          {/* Piso */}
          <line x1="30" y1="222" x2="210" y2="222" stroke="#3F3F46" strokeWidth="3" strokeDasharray="4 4" />
          
          {/* Cabeça do Manequim */}
          <circle cx="120" cy={barY - 18} r="15" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="2" />
          
          {/* Tronco & Peitoral Volumétrico */}
          <path
            d={`M 112 ${barY - 3} C 112 ${barY + 15} 110 ${hipY - 15} 114 ${hipY} C 122 ${hipY} 128 ${hipY - 15} 128 ${barY - 3} Z`}
            fill="#FFFFFF"
            stroke="#D4D4D8"
            strokeWidth="2"
          />

          {/* Glúteos (Destaque Muscular) */}
          <ellipse cx="122" cy={hipY + 5} rx="12" ry="10" fill={gluteFill} stroke="#A1A1AA" strokeWidth="1.5" />

          {/* Coxa / Quadríceps Volumoso (Destaque Hevy) */}
          <path
            d={`M 120 ${hipY} Q ${kneeX + 16} ${kneeY - 15} ${kneeX} ${kneeY} Q ${kneeX + 12} ${kneeY + 6} 118 ${hipY + 12} Z`}
            fill={quadFill}
            stroke="#A1A1AA"
            strokeWidth="2"
          />

          {/* Panturrilha / Canela */}
          <path
            d={`M ${kneeX} ${kneeY} Q ${kneeX + 8} 190 102 220 L 92 220 Q ${kneeX - 6} 190 ${kneeX} ${kneeY} Z`}
            fill="#E4E4E7"
            stroke="#A1A1AA"
            strokeWidth="1.5"
          />
          {/* Pé */}
          <ellipse cx="106" cy="220" rx="14" ry="4" fill="#FFFFFF" />

          {/* Barra com Anilhas Olímpicas Brancas */}
          <rect x="25" y={barY - 2} width="190" height="6" rx="2" fill="#FFFFFF" />
          {/* Anilhas Grandes */}
          <rect x="42" y={barY - 26} width="12" height="52" rx="3" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.5" />
          <rect x="186" y={barY - 26} width="12" height="52" rx="3" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.5" />
          {/* Braços e Mãos segurando a barra */}
          <path
            d={`M 112 ${barY + 4} Q 92 ${barY + 18} 82 ${barY} L 86 ${barY}`}
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M 128 ${barY + 4} Q 148 ${barY + 18} 158 ${barY} L 154 ${barY}`}
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    }

    // B. LEVANTAMENTO TERRA (DEADLIFT)
    if (animType === 'deadlift') {
      const hipY = 158 - f * 34;
      const hipX = 86 + f * 24;
      const shoulderX = 136 - f * 20;
      const shoulderY = 126 - f * 42;
      const barY = 192 - f * 82;
      const backFill = isPrimary('costas') ? '#EF4444' : '#E4E4E7';
      const legFill = isSecondary('isquiotibiais') || isSecondary('gluteos') ? '#F97316' : '#E4E4E7';

      return (
        <svg viewBox="0 0 240 240" className="w-full h-52 select-none drop-shadow-md">
          <line x1="30" y1="222" x2="210" y2="222" stroke="#3F3F46" strokeWidth="3" strokeDasharray="4 4" />
          
          {/* Cabeça */}
          <circle cx={shoulderX} cy={shoulderY - 18} r="14" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="2" />

          {/* Tronco / Lombar / Dorsais (Músculo Ativo) */}
          <path
            d={`M ${shoulderX - 6} ${shoulderY} Q ${(shoulderX + hipX) / 2 - 8} ${(shoulderY + hipY) / 2} ${hipX - 4} ${hipY} L ${hipX + 8} ${hipY + 4} Q ${(shoulderX + hipX) / 2 + 8} ${(shoulderY + hipY) / 2} ${shoulderX + 6} ${shoulderY} Z`}
            fill={backFill}
            stroke="#A1A1AA"
            strokeWidth="2"
          />

          {/* Coxas & Isquiotibiais */}
          <path
            d={`M ${hipX} ${hipY} Q 98 175 110 178 L 100 220 L 118 220 Q 115 178 ${hipX + 12} ${hipY} Z`}
            fill={legFill}
            stroke="#A1A1AA"
            strokeWidth="2"
          />

          {/* Braço descendo reto até a barra */}
          <line x1={shoulderX} y1={shoulderY + 6} x2="136" y2={barY} stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />

          {/* Barra Olímpica e Anilhas */}
          <line x1="55" y1={barY} x2="215" y2={barY} stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
          <circle cx="65" cy={barY} r="22" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
          <circle cx="205" cy={barY} r="22" fill="#FFFFFF" stroke="#27272A" strokeWidth="2" />
        </svg>
      );
    }

    // C. PUXADA FRONTAL / BARRA FIXA (LAT PULLDOWN / PULL UP)
    if (animType === 'pull_up' || animType === 'lat_pulldown') {
      const bodyY = 145 - f * 38;
      const elbowY = 90 + f * 36;
      const latsFill = isPrimary('costas') ? '#EF4444' : '#E4E4E7';
      const bicepsFill = isSecondary('biceps') ? '#F97316' : '#FFFFFF';

      return (
        <svg viewBox="0 0 240 240" className="w-full h-52 select-none drop-shadow-md">
          {/* Barra Superior */}
          <rect x="25" y="36" width="190" height="7" rx="3" fill="#FFFFFF" />
          <circle cx="65" cy="39" r="6" fill="#D4D4D8" />
          <circle cx="175" cy="39" r="6" fill="#D4D4D8" />

          {/* Antebraços */}
          <line x1="65" y1="39" x2="78" y2={elbowY} stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
          <line x1="175" y1="39" x2="162" y2={elbowY} stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />

          {/* Braço / Bíceps (Secundário) */}
          <path
            d={`M 78 ${elbowY} Q 92 ${elbowY + 4} 108 ${bodyY - 14}`}
            stroke={bicepsFill}
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M 162 ${elbowY} Q 148 ${elbowY + 4} 132 ${bodyY - 14}`}
            stroke={bicepsFill}
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />

          {/* Cabeça */}
          <circle cx="120" cy={bodyY - 32} r="15" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="2" />

          {/* Grande Dorsal (Lats - Destaque em Asa) */}
          <path
            d={`M 108 ${bodyY - 15} Q 90 ${bodyY + 8} 110 ${bodyY + 36} L 130 ${bodyY + 36} Q 150 ${bodyY + 8} 132 ${bodyY - 15} Z`}
            fill={latsFill}
            stroke="#A1A1AA"
            strokeWidth="2"
          />

          {/* Pernas do Boneco */}
          <line x1="112" y1={bodyY + 36} x2="108" y2={bodyY + 85} stroke="#E4E4E7" strokeWidth="8" strokeLinecap="round" />
          <line x1="128" y1={bodyY + 36} x2="132" y2={bodyY + 85} stroke="#E4E4E7" strokeWidth="8" strokeLinecap="round" />
        </svg>
      );
    }

    // D. ROSCA BÍCEPS (CURL)
    if (animType === 'curl') {
      const handX = 142 - f * 34;
      const handY = 168 - f * 72;
      const bicepsFill = isPrimary('biceps') ? '#EF4444' : '#E4E4E7';

      return (
        <svg viewBox="0 0 240 240" className="w-full h-52 select-none drop-shadow-md">
          <line x1="30" y1="222" x2="210" y2="222" stroke="#3F3F46" strokeWidth="3" strokeDasharray="4 4" />
          
          {/* Cabeça */}
          <circle cx="100" cy="50" r="15" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="2" />

          {/* Tronco */}
          <path
            d="M 92 68 C 92 85 90 135 94 150 L 110 150 C 114 135 112 85 110 68 Z"
            fill="#FFFFFF"
            stroke="#D4D4D8"
            strokeWidth="2"
          />

          {/* Pernas */}
          <line x1="96" y1="150" x2="92" y2="220" stroke="#E4E4E7" strokeWidth="8" strokeLinecap="round" />
          <line x1="106" y1="150" x2="110" y2="220" stroke="#E4E4E7" strokeWidth="8" strokeLinecap="round" />

          {/* Braço (Bíceps em Pico com Destaque Hevy) */}
          <path
            d="M 104 76 Q 120 95 114 125"
            stroke={bicepsFill}
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          />

          {/* Antebraço */}
          <line x1="114" y1="125" x2={handX} y2={handY} stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />

          {/* Halter Anatômico */}
          <rect x={handX - 12} y={handY - 14} width="8" height="28" rx="3" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.5" />
          <rect x={handX + 6} y={handY - 14} width="8" height="28" rx="3" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.5" />
          <line x1={handX - 8} y1={handY} x2={handX + 8} y2={handY} stroke="#FFFFFF" strokeWidth="5" />
        </svg>
      );
    }

    // E. PADRÃO: SUPINO RETO / PRESS DE PEITORAL (BENCH PRESS)
    const barY = 92 + f * 42;
    const elbowY = 120 + f * 22;
    const chestFill = isPrimary('peito') ? '#EF4444' : '#E4E4E7';
    const tricepsFill = isSecondary('triceps') ? '#F97316' : '#FFFFFF';

    return (
      <svg viewBox="0 0 240 240" className="w-full h-52 select-none drop-shadow-md">
        {/* Banco de Supino */}
        <rect x="25" y="166" width="180" height="10" rx="3" fill="#27272A" />
        <rect x="55" y="176" width="8" height="46" fill="#3F3F46" />
        <rect x="175" y="176" width="8" height="46" fill="#3F3F46" />

        {/* Cabeça do Boneco no Banco */}
        <circle cx="62" cy="154" r="14" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="2" />

        {/* Tronco & Peitoral Volumoso (Músculo Ativo Hevy) */}
        <path
          d="M 76 156 Q 105 136 142 156 L 150 166 L 76 166 Z"
          fill={chestFill}
          stroke="#A1A1AA"
          strokeWidth="2"
        />

        {/* Pernas apoiadas no chão */}
        <path d="M 150 166 Q 175 178 180 220" stroke="#E4E4E7" strokeWidth="8" strokeLinecap="round" fill="none" />
        <ellipse cx="186" cy="220" rx="10" ry="4" fill="#FFFFFF" />

        {/* Braço / Tríceps */}
        <path
          d={`M 96 154 Q 92 ${elbowY} 104 ${elbowY}`}
          stroke={tricepsFill}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Antebraço empurrando a barra */}
        <line x1="104" y1={elbowY} x2="108" y2={barY} stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />

        {/* Barra Olímpica e Anilhas Brancas */}
        <line x1="45" y1={barY} x2="175" y2={barY} stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
        <rect x="38" y={barY - 24} width="12" height="48" rx="3" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.5" />
        <rect x="170" y={barY - 24} width="12" height="48" rx="3" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.5" />
      </svg>
    );
  };

  // 2. MAPA ANATÔMICO CORPORAL COMPLETO (FRENTE E COSTAS)
  const renderAnatomyMap = () => {
    return (
      <div className="w-full flex items-center justify-around py-3 px-2">
        {/* Boneco Visão Frontal */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Visão Frontal
          </span>
          <svg viewBox="0 0 120 220" className="w-28 h-52 select-none drop-shadow">
            {/* Cabeça */}
            <circle cx="60" cy="22" r="13" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="1.5" />
            
            {/* Ombros / Deltoides Frontais */}
            <circle cx="38" cy="44" r="8" fill={getMuscleFill('ombros')} stroke="#A1A1AA" strokeWidth="1" />
            <circle cx="82" cy="44" r="8" fill={getMuscleFill('ombros')} stroke="#A1A1AA" strokeWidth="1" />

            {/* Peitoral Maior (Esquerdo e Direito) */}
            <rect x="44" y="44" width="15" height="16" rx="4" fill={getMuscleFill('peito')} stroke="#A1A1AA" strokeWidth="1" />
            <rect x="61" y="44" width="15" height="16" rx="4" fill={getMuscleFill('peito')} stroke="#A1A1AA" strokeWidth="1" />

            {/* Bíceps (Braços) */}
            <ellipse cx="32" cy="66" rx="5" ry="10" fill={getMuscleFill('biceps')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="88" cy="66" rx="5" ry="10" fill={getMuscleFill('biceps')} stroke="#A1A1AA" strokeWidth="1" />
            {/* Antebraços */}
            <ellipse cx="28" cy="92" rx="4" ry="12" fill={getMuscleFill('antebraco')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="92" cy="92" rx="4" ry="12" fill={getMuscleFill('antebraco')} stroke="#A1A1AA" strokeWidth="1" />

            {/* Abdômen / Core */}
            <rect x="52" y="64" width="16" height="24" rx="3" fill={getMuscleFill('abdomen')} stroke="#A1A1AA" strokeWidth="1" />

            {/* Quadríceps (Coxas) */}
            <path d="M 44 98 Q 40 125 46 148 L 56 148 Q 58 125 56 98 Z" fill={getMuscleFill('quadriceps') !== '#E4E4E7' ? getMuscleFill('quadriceps') : getMuscleFill('pernas')} stroke="#A1A1AA" strokeWidth="1" />
            <path d="M 64 98 Q 62 125 64 148 L 74 148 Q 80 125 76 98 Z" fill={getMuscleFill('quadriceps') !== '#E4E4E7' ? getMuscleFill('quadriceps') : getMuscleFill('pernas')} stroke="#A1A1AA" strokeWidth="1" />

            {/* Panturrilhas Frontais */}
            <ellipse cx="48" cy="176" rx="5" ry="16" fill={getMuscleFill('panturrilhas')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="72" cy="176" rx="5" ry="16" fill={getMuscleFill('panturrilhas')} stroke="#A1A1AA" strokeWidth="1" />
          </svg>
        </div>

        {/* Boneco Visão Traseira */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Visão Posterior
          </span>
          <svg viewBox="0 0 120 220" className="w-28 h-52 select-none drop-shadow">
            {/* Cabeça */}
            <circle cx="60" cy="22" r="13" fill="#FFFFFF" stroke="#D4D4D8" strokeWidth="1.5" />

            {/* Trapézio & Costas Superiores */}
            <polygon points="60,35 44,48 76,48" fill={getMuscleFill('trapezio')} stroke="#A1A1AA" strokeWidth="1" />

            {/* Deltoides Posteriores */}
            <circle cx="38" cy="45" r="7" fill={getMuscleFill('ombros')} stroke="#A1A1AA" strokeWidth="1" />
            <circle cx="82" cy="45" r="7" fill={getMuscleFill('ombros')} stroke="#A1A1AA" strokeWidth="1" />

            {/* Tríceps (Braços Costas) */}
            <ellipse cx="32" cy="65" rx="5" ry="10" fill={getMuscleFill('triceps')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="88" cy="65" rx="5" ry="10" fill={getMuscleFill('triceps')} stroke="#A1A1AA" strokeWidth="1" />

            {/* Grande Dorsal (Lats) */}
            <path d="M 44 48 Q 40 70 54 80 L 66 80 Q 80 70 76 48 Z" fill={getMuscleFill('costas')} stroke="#A1A1AA" strokeWidth="1" />

            {/* Lombar / Eretores da Espinha */}
            <rect x="54" y="80" width="12" height="16" rx="2" fill={getMuscleFill('lombar')} stroke="#A1A1AA" strokeWidth="1" />

            {/* Glúteos */}
            <ellipse cx="50" cy="106" rx="10" ry="10" fill={getMuscleFill('gluteos')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="70" cy="106" rx="10" ry="10" fill={getMuscleFill('gluteos')} stroke="#A1A1AA" strokeWidth="1" />

            {/* Isquiotibiais / Posterior de Coxa */}
            <path d="M 42 120 Q 40 135 44 148 L 56 148 Q 58 135 56 120 Z" fill={getMuscleFill('isquiotibiais')} stroke="#A1A1AA" strokeWidth="1" />
            <path d="M 64 120 Q 62 135 64 148 L 76 148 Q 80 135 78 120 Z" fill={getMuscleFill('isquiotibiais')} stroke="#A1A1AA" strokeWidth="1" />

            {/* Panturrilhas Traseiras */}
            <ellipse cx="48" cy="176" rx="6" ry="15" fill={getMuscleFill('panturrilhas')} stroke="#A1A1AA" strokeWidth="1" />
            <ellipse cx="72" cy="176" rx="6" ry="15" fill={getMuscleFill('panturrilhas')} stroke="#A1A1AA" strokeWidth="1" />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#141416] border border-[#27272a] rounded-2xl overflow-hidden flex flex-col shadow-xl">
      {/* Barra de Abas do Visualizador: Execução vs Anatomia */}
      <div className="flex items-center justify-between bg-[#000000] p-2 border-b border-[#27272a]">
        <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-[#27272a]">
          <button
            onClick={() => setViewMode('movement')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'movement'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Movimento</span>
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
        </div>

        {viewMode === 'movement' && (
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

      {/* Janela de Renderização do Boneco Hevy */}
      <div className="relative bg-[#000000] flex flex-col items-center justify-center p-3 border-b border-[#27272a]">
        {/* Indicador de Fase */}
        {viewMode === 'movement' && (
          <div className="w-full flex items-center justify-between mb-1 px-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              Boneco Hevy • Músculo em Destaque
            </span>
            <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#18181b] text-white border border-[#27272a]">
              <Activity className="w-3 h-3 text-red-500 animate-pulse" />
              <span>{frame > 0.5 ? 'Contração' : 'Alongamento'}</span>
            </div>
          </div>
        )}

        {/* Conteúdo Renderizado */}
        {viewMode === 'movement' ? renderMovementIllustration() : renderAnatomyMap()}

        {/* Legenda de Cores do Boneco */}
        <div className="flex items-center justify-center gap-3 mt-2 text-[10px] font-bold text-zinc-400">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm" />
            <span className="text-zinc-300">Principal</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shadow-sm" />
            <span className="text-zinc-400">Sinergista</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-200 inline-block shadow-sm" />
            <span className="text-zinc-400">Manequim</span>
          </div>
        </div>
      </div>

      {/* Informações Anatômicas e Instruções Biomecânicas */}
      <div className="p-4 space-y-4 text-left">
        {/* Músculos Alvo */}
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
