import React, { useState, useMemo } from 'react';
import { FRONT_MUSCLES, BACK_MUSCLES, MuscleDef } from 'body-muscles';
import { useApp } from '../context/AppContext';

export type MuscleGroupKey =
  | 'peito'
  | 'costas'
  | 'lats'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'antebraco'
  | 'antebracos'
  | 'abdomen'
  | 'quadriceps'
  | 'isquiotibiais'
  | 'gluteos'
  | 'panturrilha'
  | 'panturrilhas'
  | 'trapezio'
  | 'lombar';

export interface SymmetryBodyMapProps {
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  view?: 'anterior' | 'posterior' | 'both' | 'toggle';
  size?: 'mini' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onSelectMuscle?: (muscleId: string) => void;
  selectedMuscle?: string | null;
  muscleTiers?: Partial<Record<string, { tier: string; color: string; label: string }>>;
  className?: string;
  showLabels?: boolean;
}

// Mapeamento exato de grupos musculares de treino para os 89 IDs anatômicos do body-muscles
const MUSCLE_ID_MAPPINGS: Record<string, string[]> = {
  // Peitoral (Clavicular e Esternal)
  peito: ['chest-upper-left', 'chest-upper-right', 'chest-lower-left', 'chest-lower-right'],
  peitoral: ['chest-upper-left', 'chest-upper-right', 'chest-lower-left', 'chest-lower-right'],
  chest: ['chest-upper-left', 'chest-upper-right', 'chest-lower-left', 'chest-lower-right'],

  // Costas / Dorsais / Grande Dorsal
  costas: [
    'lats-upper-left', 'lats-mid-left', 'lats-lower-left',
    'lats-upper-right', 'lats-mid-right', 'lats-lower-right',
    'traps-mid-left', 'traps-lower-left', 'traps-mid-right', 'traps-lower-right'
  ],
  dorsal: [
    'lats-upper-left', 'lats-mid-left', 'lats-lower-left',
    'lats-upper-right', 'lats-mid-right', 'lats-lower-right'
  ],
  lats: [
    'lats-upper-left', 'lats-mid-left', 'lats-lower-left',
    'lats-upper-right', 'lats-mid-right', 'lats-lower-right'
  ],
  trapezio: [
    'traps-upper-left', 'traps-mid-left', 'traps-lower-left',
    'traps-upper-right', 'traps-mid-right', 'traps-lower-right'
  ],
  lombar: [
    'lower-back-erectors-left', 'lower-back-ql-left',
    'lower-back-erectors-right', 'lower-back-ql-right', 'spine'
  ],

  // Ombros / Deltoides (Anterior, Lateral e Posterior)
  ombros: [
    'shoulder-front-left', 'shoulder-front-right',
    'shoulder-side-left', 'shoulder-side-right',
    'deltoid-rear-left', 'deltoid-rear-right'
  ],
  deltoides: [
    'shoulder-front-left', 'shoulder-front-right',
    'shoulder-side-left', 'shoulder-side-right',
    'deltoid-rear-left', 'deltoid-rear-right'
  ],
  shoulders: [
    'shoulder-front-left', 'shoulder-front-right',
    'shoulder-side-left', 'shoulder-side-right',
    'deltoid-rear-left', 'deltoid-rear-right'
  ],

  // Bíceps Braquial
  biceps: ['biceps-left', 'biceps-right'],
  bracos: [
    'biceps-left', 'biceps-right',
    'triceps-long-left', 'triceps-lateral-left',
    'triceps-long-right', 'triceps-lateral-right'
  ],

  // Tríceps Braquial
  triceps: [
    'triceps-long-left', 'triceps-lateral-left',
    'triceps-long-right', 'triceps-lateral-right'
  ],

  // Antebraços
  antebraco: [
    'forearm-left', 'forearm-right',
    'forearm-flexors-left', 'forearm-extensors-left',
    'forearm-flexors-right', 'forearm-extensors-right'
  ],
  antebracos: [
    'forearm-left', 'forearm-right',
    'forearm-flexors-left', 'forearm-extensors-left',
    'forearm-flexors-right', 'forearm-extensors-right'
  ],

  // Abdômen & Core
  abdomen: [
    'abs-upper-left', 'abs-upper-right',
    'abs-lower-left', 'abs-lower-right',
    'serratus-anterior-left', 'serratus-anterior-right',
    'obliques-left', 'obliques-right'
  ],
  abdominal: [
    'abs-upper-left', 'abs-upper-right',
    'abs-lower-left', 'abs-lower-right',
    'serratus-anterior-left', 'serratus-anterior-right',
    'obliques-left', 'obliques-right'
  ],
  core: [
    'abs-upper-left', 'abs-upper-right',
    'abs-lower-left', 'abs-lower-right',
    'obliques-left', 'obliques-right'
  ],

  // Pernas / Quadríceps
  pernas: [
    'quads-left', 'quads-right',
    'adductors-left', 'adductors-right',
    'hip-flexor-left', 'hip-flexor-right'
  ],
  quadriceps: [
    'quads-left', 'quads-right',
    'adductors-left', 'adductors-right'
  ],
  legs: [
    'quads-left', 'quads-right',
    'adductors-left', 'adductors-right'
  ],

  // Isquiotibiais / Posterior de Coxa
  isquiotibiais: [
    'hamstrings-medial-left', 'hamstrings-lateral-left',
    'hamstrings-medial-right', 'hamstrings-lateral-right'
  ],
  posterior: [
    'hamstrings-medial-left', 'hamstrings-lateral-left',
    'hamstrings-medial-right', 'hamstrings-lateral-right'
  ],

  // Glúteos
  gluteos: [
    'gluteus-maximus-left', 'gluteus-medius-left',
    'gluteus-maximus-right', 'gluteus-medius-right'
  ],
  gluteo: [
    'gluteus-maximus-left', 'gluteus-medius-left',
    'gluteus-maximus-right', 'gluteus-medius-right'
  ],

  // Panturrilhas
  panturrilha: [
    'calves-gastroc-medial-left', 'calves-gastroc-lateral-left', 'calves-soleus-left',
    'calves-gastroc-medial-right', 'calves-gastroc-lateral-right', 'calves-soleus-right',
    'tibialis-anterior-left', 'tibialis-anterior-right'
  ],
  panturrilhas: [
    'calves-gastroc-medial-left', 'calves-gastroc-lateral-left', 'calves-soleus-left',
    'calves-gastroc-medial-right', 'calves-gastroc-lateral-right', 'calves-soleus-right',
    'tibialis-anterior-left', 'tibialis-anterior-right'
  ]
};

export const SymmetryBodyMap: React.FC<SymmetryBodyMapProps> = ({
  primaryMuscles = [],
  secondaryMuscles = [],
  view = 'toggle',
  size = 'md',
  interactive = false,
  onSelectMuscle,
  selectedMuscle,
  muscleTiers,
  className = '',
  showLabels = false
}) => {
  const { theme } = useApp();
  const isLight = theme === 'light';
  const [activeSide, setActiveSide] = useState<'anterior' | 'posterior'>('anterior');
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  // Normalização
  const normalize = (list: string[]) =>
    list.map((m) =>
      (m || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    );

  const normPrimary = normalize(primaryMuscles);
  const normSecondary = normalize(secondaryMuscles);

  // Expande lista de músculos alvo para conjunto de IDs anatômicos precisos do body-muscles
  const primaryIdSet = useMemo(() => {
    const set = new Set<string>();
    normPrimary.forEach((group) => {
      // 1. Mapeamento direto
      if (MUSCLE_ID_MAPPINGS[group]) {
        MUSCLE_ID_MAPPINGS[group].forEach((id) => set.add(id));
      }
      // 2. Busca por substrings
      Object.entries(MUSCLE_ID_MAPPINGS).forEach(([key, ids]) => {
        if (group.includes(key) || key.includes(group)) {
          ids.forEach((id) => set.add(id));
        }
      });
    });
    return set;
  }, [normPrimary]);

  const secondaryIdSet = useMemo(() => {
    const set = new Set<string>();
    normSecondary.forEach((group) => {
      if (MUSCLE_ID_MAPPINGS[group]) {
        MUSCLE_ID_MAPPINGS[group].forEach((id) => set.add(id));
      }
      Object.entries(MUSCLE_ID_MAPPINGS).forEach(([key, ids]) => {
        if (group.includes(key) || key.includes(group)) {
          ids.forEach((id) => set.add(id));
        }
      });
    });
    return set;
  }, [normSecondary]);

  // Mapeamento de Tiers para IDs anatômicos (Modo "Conquiste seu Rank")
  const rankColorById = useMemo(() => {
    if (!muscleTiers) return null;
    const map = new Map<string, string>();
    Object.entries(muscleTiers).forEach(([groupKey, tierInfo]) => {
      const ids = MUSCLE_ID_MAPPINGS[groupKey.toLowerCase()] || [];
      ids.forEach((id) => map.set(id, tierInfo.color));
    });
    return map;
  }, [muscleTiers]);

  // Estética Visual Symmetry (Andróide Biomecânico)
  const neutralBodyColor = isLight ? '#CBD5E1' : '#1E293B'; // Cinza ardósia oficial
  const grooveStroke = isLight ? '#94A3B8' : '#0B0F19'; // Ranhuras pretas nítidas
  const primaryColor = '#38BDF8'; // Azul Elétrico Neon Symmetry (Sky 400)
  const secondaryColor = '#F59E0B'; // Âmbar / Ouro Symmetry

  const getMuscleFill = (muscleId: string) => {
    // 1. Modo Rank
    if (rankColorById && rankColorById.has(muscleId)) {
      return rankColorById.get(muscleId)!;
    }

    // 2. Seleção interativa
    if (selectedMuscle && (muscleId === selectedMuscle || muscleId.includes(selectedMuscle))) {
      return '#00E5FF';
    }

    // 3. Hover
    if (hoveredMuscle === muscleId) {
      return '#0284C7';
    }

    // 4. Músculo Primário do Exercício
    if (primaryIdSet.has(muscleId)) {
      return primaryColor;
    }

    // 5. Músculo Secundário / Sinergista
    if (secondaryIdSet.has(muscleId)) {
      return secondaryColor;
    }

    // 6. Cabeça, mãos e pés ou corpo neutro
    return neutralBodyColor;
  };

  // Filtros de Brilho Neon (Glow)
  const getFilter = (muscleId: string) => {
    if (rankColorById && rankColorById.has(muscleId)) {
      return 'url(#sym-glow-primary)';
    }
    if (primaryIdSet.has(muscleId)) {
      return 'url(#sym-glow-primary)';
    }
    if (secondaryIdSet.has(muscleId)) {
      return 'url(#sym-glow-sec)';
    }
    return undefined;
  };

  // Mapeamento de dimensões
  const sizeMap = {
    mini: 'w-12 h-24', // Miniatura perfeita para cards de rotinas
    sm: 'w-20 h-40',
    md: 'w-36 h-72',
    lg: 'w-52 h-96'
  };

  // Definições SVG compartilhadas (Filtros de brilho neon)
  const renderDefs = () => (
    <defs>
      <filter id="sym-glow-primary" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="0.6" floodColor="#38BDF8" floodOpacity="0.8" />
      </filter>
      <filter id="sym-glow-sec" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="0.5" floodColor="#F59E0B" floodOpacity="0.7" />
      </filter>
    </defs>
  );

  // Renderizador de Músculo Individual
  const renderPath = (muscle: MuscleDef) => {
    const isPri = primaryIdSet.has(muscle.id);
    const isSec = secondaryIdSet.has(muscle.id);

    return (
      <path
        key={muscle.id}
        id={muscle.id}
        d={muscle.path}
        fill={getMuscleFill(muscle.id)}
        stroke={grooveStroke}
        strokeWidth="0.12"
        strokeLinejoin="round"
        filter={getFilter(muscle.id)}
        cursor={interactive ? 'pointer' : 'default'}
        onMouseEnter={() => interactive && setHoveredMuscle(muscle.id)}
        onMouseLeave={() => interactive && setHoveredMuscle(null)}
        onClick={() => interactive && onSelectMuscle?.(muscle.id)}
        className="transition-colors duration-150"
      >
        {interactive && <title>{muscle.name}</title>}
      </path>
    );
  };

  // 1. VISÃO ANTERIOR (FRENTE) — ViewBox oficial body-muscles: "0 0 35 93"
  const renderAnterior = () => (
    <svg
      viewBox="0 0 35 93"
      className={`${sizeMap[size]} select-none drop-shadow-md`}
      style={{ overflow: 'visible' }}
    >
      {renderDefs()}
      <g id="anterior-muscles">
        {FRONT_MUSCLES.map(renderPath)}
      </g>
    </svg>
  );

  // 2. VISÃO POSTERIOR (COSTAS) — ViewBox oficial body-muscles: "37 0 35 93"
  const renderPosterior = () => (
    <svg
      viewBox="37 0 35 93"
      className={`${sizeMap[size]} select-none drop-shadow-md`}
      style={{ overflow: 'visible' }}
    >
      {renderDefs()}
      <g id="posterior-muscles">
        {BACK_MUSCLES.map(renderPath)}
      </g>
    </svg>
  );

  // 3. VISÃO DUPLA LADO A LADO (FRENTE + COSTAS EM UM ÚNICO SVG) — ViewBox oficial: "0 0 74 93"
  const renderBoth = () => (
    <svg
      viewBox="0 0 74 93"
      className={`${size === 'mini' ? 'w-24 h-24' : size === 'sm' ? 'w-40 h-40' : size === 'md' ? 'w-64 h-72' : 'w-80 h-96'} select-none drop-shadow-lg`}
      style={{ overflow: 'visible' }}
    >
      {renderDefs()}
      <g id="front-group">{FRONT_MUSCLES.map(renderPath)}</g>
      <g id="back-group">{BACK_MUSCLES.map(renderPath)}</g>
    </svg>
  );

  // Se o modo for 'both' (ambos lado a lado)
  if (view === 'both') {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        {showLabels && (
          <div className="w-full flex items-center justify-around text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1 px-4">
            <span>Frente (Anterior)</span>
            <span>Costas (Posterior)</span>
          </div>
        )}
        {renderBoth()}
      </div>
    );
  }

  // Se o modo for 'anterior' fixo
  if (view === 'anterior') {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        {showLabels && (
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
            Frente
          </span>
        )}
        {renderAnterior()}
      </div>
    );
  }

  // Se o modo for 'posterior' fixo
  if (view === 'posterior') {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        {showLabels && (
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
            Costas
          </span>
        )}
        {renderPosterior()}
      </div>
    );
  }

  // Modo padrão: 'toggle' com botões Frente / Costas
  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
      {/* Botões Frente / Costas */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveSide('anterior')}
          className={`px-3 py-1 rounded-lg text-xs font-black transition ${
            activeSide === 'anterior'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Frente
        </button>
        <button
          type="button"
          onClick={() => setActiveSide('posterior')}
          className={`px-3 py-1 rounded-lg text-xs font-black transition ${
            activeSide === 'posterior'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Costas
        </button>
      </div>

      <div className="animate-in fade-in duration-200">
        {activeSide === 'anterior' ? renderAnterior() : renderPosterior()}
      </div>
    </div>
  );
};
