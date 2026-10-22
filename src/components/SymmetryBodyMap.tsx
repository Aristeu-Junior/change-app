import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export type MuscleGroupKey =
  | 'peito'
  | 'costas'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'antebracos'
  | 'abdomen'
  | 'quadriceps'
  | 'isquiotibiais'
  | 'gluteos'
  | 'panturrilhas'
  | 'trapezio'
  | 'lombar';

export interface SymmetryBodyMapProps {
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  view?: 'anterior' | 'posterior' | 'both' | 'toggle';
  size?: 'mini' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onSelectMuscle?: (muscle: MuscleGroupKey) => void;
  selectedMuscle?: string | null;
  muscleTiers?: Partial<Record<MuscleGroupKey, { tier: string; color: string; label: string }>>;
  className?: string;
  showLabels?: boolean;
}

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

  // Normalização de nomes de músculos
  const normalize = (list: string[]) =>
    list.map((m) =>
      (m || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    );

  const normPrimary = normalize(primaryMuscles);
  const normSecondary = normalize(secondaryMuscles);

  const isTarget = (keys: string[], list: string[]) =>
    keys.some((k) => list.some((m) => m.includes(k) || k.includes(m)));

  // Determina cor de cada músculo (Symmetry Electric Blue / Cyan & Amber Gold)
  const getFill = (group: MuscleGroupKey, keys: string[]) => {
    // 1. Se fornecido tiers de rank (modo "Conquiste seu rank")
    if (muscleTiers && muscleTiers[group]) {
      return muscleTiers[group]!.color;
    }

    // 2. Se selecionado interativamente
    if (selectedMuscle && keys.some((k) => selectedMuscle.toLowerCase().includes(k))) {
      return '#00E5FF'; // Ciano neon máximo
    }

    // 3. Músculo primário (Azul Elétrico Symmetry)
    if (isTarget(keys, normPrimary)) {
      return '#38BDF8'; // Sky 400 elétrico brilhante
    }

    // 4. Músculo secundário (Âmbar / Laranja)
    if (isTarget(keys, normSecondary)) {
      return '#F59E0B'; // Ouro / Âmbar
    }

    // 5. Neutro (Android Slate do Symmetry)
    return isLight ? '#CBD5E1' : '#1E293B';
  };

  const getGlowFilter = (group: MuscleGroupKey, keys: string[]) => {
    if (muscleTiers && muscleTiers[group]) return 'url(#sym-glow-rank)';
    if (isTarget(keys, normPrimary)) return 'url(#sym-glow-primary)';
    if (isTarget(keys, normSecondary)) return 'url(#sym-glow-sec)';
    return undefined;
  };

  // Cores de base e contornos metálicos futuristas
  const bodyBaseColor = isLight ? '#E2E8F0' : '#0F172A';
  const grooveStroke = isLight ? '#94A3B8' : '#0B0F19';
  const headColor = isLight ? '#94A3B8' : '#1E293B';

  // Dimensões de acordo com o tamanho
  const sizeMap = {
    mini: 'w-14 h-24', // Miniatura perfeita para cards de treino
    sm: 'w-24 h-40',
    md: 'w-36 h-60',
    lg: 'w-52 h-88'
  };

  // 1. SILHUETA ANTERIOR (FRENTE)
  const renderAnterior = () => (
    <svg
      viewBox="0 0 160 260"
      className={`${sizeMap[size]} select-none drop-shadow-lg`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id="sym-glow-primary" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38BDF8" floodOpacity="0.75" />
        </filter>
        <filter id="sym-glow-sec" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F59E0B" floodOpacity="0.65" />
        </filter>
        <filter id="sym-glow-rank" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#818CF8" floodOpacity="0.8" />
        </filter>
        <linearGradient id="sym-head-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isLight ? '#CBD5E1' : '#334155'} />
          <stop offset="100%" stopColor={isLight ? '#94A3B8' : '#1E293B'} />
        </linearGradient>
      </defs>

      {/* CABEÇA E PESCOÇO (FUTURISTA SEM ROSTO) */}
      <g id="head-neck">
        <path
          d="M 80 14 C 72 14, 68 23, 68 34 C 68 45, 73 51, 80 51 C 87 51, 92 45, 92 34 C 92 23, 88 14, 80 14 Z"
          fill="url(#sym-head-grad)"
          stroke={grooveStroke}
          strokeWidth="1.5"
        />
        {/* Tendões cervicais */}
        <path d="M 74 51 L 72 63 L 78 63 L 78 51 Z" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="1" />
        <path d="M 86 51 L 88 63 L 82 63 L 82 51 Z" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="1" />
      </g>

      {/* TRAPÉZIO SUPERIOR */}
      <g id="traps-ant">
        <path
          d="M 68 62 L 74 52 L 79 63 Z"
          fill={getFill('trapezio', ['trapezio', 'traps'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
        <path
          d="M 92 62 L 86 52 L 81 63 Z"
          fill={getFill('trapezio', ['trapezio', 'traps'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
      </g>

      {/* DELTÓIDES / OMBROS (ANTERIOR & LATERAL) */}
      <g
        id="shoulders"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={() => interactive && onSelectMuscle?.('ombros')}
        filter={getGlowFilter('ombros', ['ombro', 'ombros', 'deltoide', 'deltoides'])}
      >
        {/* Ombro Esquerdo */}
        <path
          d="M 57 65 C 47 66, 42 74, 42 84 C 42 92, 46 98, 52 97 C 56 93, 57 81, 58 68 Z"
          fill={getFill('ombros', ['ombro', 'ombros', 'deltoide', 'deltoides'])}
          stroke={grooveStroke}
          strokeWidth="1.3"
        />
        {/* Ombro Direito */}
        <path
          d="M 103 65 C 113 66, 118 74, 118 84 C 118 92, 114 98, 108 97 C 104 93, 103 81, 102 68 Z"
          fill={getFill('ombros', ['ombro', 'ombros', 'deltoide', 'deltoides'])}
          stroke={grooveStroke}
          strokeWidth="1.3"
        />
      </g>

      {/* PEITORAL MAIOR (CLAVICULAR E ESTERNAL) */}
      <g
        id="chest"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={() => interactive && onSelectMuscle?.('peito')}
        filter={getGlowFilter('peito', ['peito', 'peitoral', 'supino', 'crucifixo', 'chest'])}
      >
        {/* Peito Esquerdo Clavicular / Superior */}
        <path
          d="M 79 65 L 59 66 C 56 71, 58 78, 64 81 L 79 80 Z"
          fill={getFill('peito', ['peito', 'peitoral', 'supino', 'crucifixo', 'chest'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
        {/* Peito Esquerdo Esternal / Inferior */}
        <path
          d="M 79 81 L 64 82 C 60 85, 62 92, 70 94 C 76 95, 78 93, 79 90 Z"
          fill={getFill('peito', ['peito', 'peitoral', 'supino', 'crucifixo', 'chest'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
        {/* Peito Direito Clavicular / Superior */}
        <path
          d="M 81 65 L 101 66 C 104 71, 102 78, 96 81 L 81 80 Z"
          fill={getFill('peito', ['peito', 'peitoral', 'supino', 'crucifixo', 'chest'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
        {/* Peito Direito Esternal / Inferior */}
        <path
          d="M 81 81 L 96 82 C 100 85, 98 92, 90 94 C 84 95, 82 93, 81 90 Z"
          fill={getFill('peito', ['peito', 'peitoral', 'supino', 'crucifixo', 'chest'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
      </g>

      {/* BÍCEPS BRAQUIAL */}
      <g
        id="biceps"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={() => interactive && onSelectMuscle?.('biceps')}
        filter={getGlowFilter('biceps', ['biceps', 'braco', 'rosca'])}
      >
        <path
          d="M 43 89 C 39 95, 38 107, 42 119 C 46 121, 50 119, 52 111 C 54 101, 51 92, 47 88 Z"
          fill={getFill('biceps', ['biceps', 'braco', 'rosca'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
        <path
          d="M 117 89 C 121 95, 122 107, 118 119 C 114 121, 110 119, 108 111 C 106 101, 109 92, 113 88 Z"
          fill={getFill('biceps', ['biceps', 'braco', 'rosca'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
      </g>

      {/* ANTEBRAÇOS */}
      <g
        id="forearms"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={() => interactive && onSelectMuscle?.('antebracos')}
        filter={getGlowFilter('antebracos', ['antebraco', 'antebracos', 'punho'])}
      >
        <path
          d="M 41 122 C 37 130, 35 145, 39 157 C 42 159, 45 158, 47 151 C 50 141, 49 129, 46 121 Z"
          fill={getFill('antebracos', ['antebraco', 'antebracos', 'punho'])}
          stroke={grooveStroke}
          strokeWidth="1.1"
        />
        <path
          d="M 119 122 C 123 130, 125 145, 121 157 C 118 159, 115 158, 113 151 C 110 141, 111 129, 114 121 Z"
          fill={getFill('antebracos', ['antebraco', 'antebracos', 'punho'])}
          stroke={grooveStroke}
          strokeWidth="1.1"
        />
        {/* Mãos */}
        <path d="M 37 159 C 35 165, 36 171, 39 172 C 42 172, 44 167, 43 160 Z" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="0.8" />
        <path d="M 123 159 C 125 165, 124 171, 121 172 C 118 172, 116 167, 117 160 Z" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="0.8" />
      </g>

      {/* SERRATUS ANTERIOR (COSTELAS / LATERAIS) */}
      <g id="serratus">
        <path d="M 60 88 L 65 89 L 63 94 Z" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="0.7" />
        <path d="M 59 95 L 65 96 L 63 101 Z" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="0.7" />
        <path d="M 100 88 L 95 89 L 97 94 Z" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="0.7" />
        <path d="M 101 95 L 95 96 L 97 101 Z" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="0.7" />
      </g>

      {/* ABDÔMEN & OBLÍQUOS (6-PACK SCI-FI SYMMETRIA) */}
      <g
        id="abs"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={() => interactive && onSelectMuscle?.('abdomen')}
        filter={getGlowFilter('abdomen', ['abdomen', 'abdominal', 'core', 'abs'])}
      >
        {/* 6-Pack Esquerdo */}
        <rect x="71" y="96" width="8" height="9" rx="2" fill={getFill('abdomen', ['abdomen', 'abdominal', 'core', 'abs'])} stroke={grooveStroke} strokeWidth="1" />
        <rect x="71" y="107" width="8" height="9" rx="2" fill={getFill('abdomen', ['abdomen', 'abdominal', 'core', 'abs'])} stroke={grooveStroke} strokeWidth="1" />
        <rect x="72" y="118" width="7" height="11" rx="2" fill={getFill('abdomen', ['abdomen', 'abdominal', 'core', 'abs'])} stroke={grooveStroke} strokeWidth="1" />

        {/* 6-Pack Direito */}
        <rect x="81" y="96" width="8" height="9" rx="2" fill={getFill('abdomen', ['abdomen', 'abdominal', 'core', 'abs'])} stroke={grooveStroke} strokeWidth="1" />
        <rect x="81" y="107" width="8" height="9" rx="2" fill={getFill('abdomen', ['abdomen', 'abdominal', 'core', 'abs'])} stroke={grooveStroke} strokeWidth="1" />
        <rect x="81" y="118" width="7" height="11" rx="2" fill={getFill('abdomen', ['abdomen', 'abdominal', 'core', 'abs'])} stroke={grooveStroke} strokeWidth="1" />

        {/* Oblíquos Externos */}
        <path
          d="M 64 97 C 62 106, 63 118, 69 126 L 70 120 C 67 113, 67 104, 69 97 Z"
          fill={getFill('abdomen', ['abdomen', 'abdominal', 'core', 'abs'])}
          stroke={grooveStroke}
          strokeWidth="0.9"
        />
        <path
          d="M 96 97 C 98 106, 97 118, 91 126 L 90 120 C 93 113, 93 104, 91 97 Z"
          fill={getFill('abdomen', ['abdomen', 'abdominal', 'core', 'abs'])}
          stroke={grooveStroke}
          strokeWidth="0.9"
        />
      </g>

      {/* QUADRIL / PELVE */}
      <path d="M 70 131 L 90 131 L 86 140 L 74 140 Z" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="1" />

      {/* QUADRÍCEPS & COXAS ANTERIORES */}
      <g
        id="quadriceps"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={() => interactive && onSelectMuscle?.('quadriceps')}
        filter={getGlowFilter('quadriceps', ['quadriceps', 'perna', 'pernas', 'coxa', 'agachamento', 'leg'])}
      >
        {/* Vasto Lateral Esquerdo */}
        <path
          d="M 64 135 C 57 146, 55 164, 59 181 C 63 183, 66 183, 67 175 C 69 160, 69 146, 68 135 Z"
          fill={getFill('quadriceps', ['quadriceps', 'perna', 'pernas', 'coxa', 'agachamento', 'leg'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
        {/* Vasto Medial / Gota Esquerda */}
        <path
          d="M 68 156 C 70 166, 70 176, 67 182 C 70 185, 74 184, 75 177 C 75 168, 73 160, 70 155 Z"
          fill={getFill('quadriceps', ['quadriceps', 'perna', 'pernas', 'coxa', 'agachamento', 'leg'])}
          stroke={grooveStroke}
          strokeWidth="1"
        />

        {/* Vasto Lateral Direito */}
        <path
          d="M 96 135 C 103 146, 105 164, 101 181 C 97 183, 94 183, 93 175 C 91 160, 91 146, 92 135 Z"
          fill={getFill('quadriceps', ['quadriceps', 'perna', 'pernas', 'coxa', 'agachamento', 'leg'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
        {/* Vasto Medial / Gota Direita */}
        <path
          d="M 92 156 C 90 166, 90 176, 93 182 C 90 185, 86 184, 85 177 C 85 168, 87 160, 90 155 Z"
          fill={getFill('quadriceps', ['quadriceps', 'perna', 'pernas', 'coxa', 'agachamento', 'leg'])}
          stroke={grooveStroke}
          strokeWidth="1"
        />
      </g>

      {/* JOELHOS (PATELLA HEXAGONAL) */}
      <polygon points="65,185 68,188 65,191 62,188" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="1" />
      <polygon points="95,185 98,188 95,191 92,188" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="1" />

      {/* PANTURRILHAS (CANELA & GASTROCNÊMIO LATERAL) */}
      <g
        id="calves-ant"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={() => interactive && onSelectMuscle?.('panturrilhas')}
        filter={getGlowFilter('panturrilhas', ['panturrilha', 'panturrilhas', 'gemeos'])}
      >
        <path
          d="M 60 193 C 56 202, 57 219, 62 233 C 65 233, 68 232, 69 223 C 70 212, 69 200, 68 193 Z"
          fill={getFill('panturrilhas', ['panturrilha', 'panturrilhas', 'gemeos'])}
          stroke={grooveStroke}
          strokeWidth="1.1"
        />
        <path
          d="M 100 193 C 104 202, 103 219, 98 233 C 95 233, 92 232, 91 223 C 90 212, 91 200, 92 193 Z"
          fill={getFill('panturrilhas', ['panturrilha', 'panturrilhas', 'gemeos'])}
          stroke={grooveStroke}
          strokeWidth="1.1"
        />
        {/* Pés */}
        <path d="M 59 235 C 56 241, 58 245, 65 245 C 68 245, 68 240, 66 235 Z" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="0.8" />
        <path d="M 101 235 C 104 241, 102 245, 95 245 C 92 245, 92 240, 94 235 Z" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="0.8" />
      </g>
    </svg>
  );

  // 2. SILHUETA POSTERIOR (COSTAS)
  const renderPosterior = () => (
    <svg
      viewBox="0 0 160 260"
      className={`${sizeMap[size]} select-none drop-shadow-lg`}
      style={{ overflow: 'visible' }}
    >
      {/* CABEÇA E NUCA */}
      <g id="head-back">
        <path
          d="M 80 14 C 72 14, 68 23, 68 34 C 68 45, 73 51, 80 51 C 87 51, 92 45, 92 34 C 92 23, 88 14, 80 14 Z"
          fill="url(#sym-head-grad)"
          stroke={grooveStroke}
          strokeWidth="1.5"
        />
        <path d="M 74 51 L 72 63 L 88 63 L 86 51 Z" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="1" />
      </g>

      {/* TRAPÉZIO POSTERIOR (DIAMANTE/ESCUDO SYMMETRIA) */}
      <g
        id="traps-post"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={() => interactive && onSelectMuscle?.('trapezio')}
        filter={getGlowFilter('trapezio', ['trapezio', 'traps', 'encolhimento'])}
      >
        <polygon
          points="80,52 66,65 74,88 80,96 86,88 94,65"
          fill={getFill('trapezio', ['trapezio', 'traps', 'encolhimento'])}
          stroke={grooveStroke}
          strokeWidth="1.3"
        />
      </g>

      {/* DELTÓIDES POSTERIORES */}
      <g
        id="rear-delts"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={() => interactive && onSelectMuscle?.('ombros')}
        filter={getGlowFilter('ombros', ['ombro', 'ombros', 'deltoide', 'crucifixo invertido'])}
      >
        <path
          d="M 57 65 C 49 68, 45 76, 45 85 C 49 87, 55 85, 58 78 C 59 73, 59 68, 57 65 Z"
          fill={getFill('ombros', ['ombro', 'ombros', 'deltoide', 'crucifixo invertido'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
        <path
          d="M 103 65 C 111 68, 115 76, 115 85 C 111 87, 105 85, 102 78 C 101 73, 101 68, 103 65 Z"
          fill={getFill('ombros', ['ombro', 'ombros', 'deltoide', 'crucifixo invertido'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
      </g>

      {/* TRÍCEPS BRAQUIAL (FERRADURA) */}
      <g
        id="triceps"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={() => interactive && onSelectMuscle?.('triceps')}
        filter={getGlowFilter('triceps', ['triceps', 'testa', 'pulley', 'frances', 'corda'])}
      >
        <path
          d="M 44 87 C 40 94, 39 106, 43 118 C 47 120, 51 118, 52 110 C 52 100, 50 91, 47 87 Z"
          fill={getFill('triceps', ['triceps', 'testa', 'pulley', 'frances', 'corda'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
        <path
          d="M 116 87 C 120 94, 121 106, 117 118 C 113 120, 109 118, 108 110 C 108 100, 110 91, 113 87 Z"
          fill={getFill('triceps', ['triceps', 'testa', 'pulley', 'frances', 'corda'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
      </g>

      {/* GRANDE DORSAL (COSTAS / ASA EM V) */}
      <g
        id="lats"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={() => interactive && onSelectMuscle?.('costas')}
        filter={getGlowFilter('costas', ['costa', 'costas', 'dorsal', 'remada', 'puxada', 'pull', 'lats'])}
      >
        <path
          d="M 68 75 C 60 83, 58 100, 66 115 L 76 112 C 74 100, 72 87, 72 75 Z"
          fill={getFill('costas', ['costa', 'costas', 'dorsal', 'remada', 'puxada', 'pull', 'lats'])}
          stroke={grooveStroke}
          strokeWidth="1.3"
        />
        <path
          d="M 92 75 C 100 83, 102 100, 94 115 L 84 112 C 86 100, 88 87, 88 75 Z"
          fill={getFill('costas', ['costa', 'costas', 'dorsal', 'remada', 'puxada', 'pull', 'lats'])}
          stroke={grooveStroke}
          strokeWidth="1.3"
        />
      </g>

      {/* LOMBAR / ERETOR ESPINHAL */}
      <g
        id="lower-back"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={() => interactive && onSelectMuscle?.('lombar')}
        filter={getGlowFilter('lombar', ['lombar', 'eretor', 'stiff', 'terra'])}
      >
        <polygon
          points="76,103 74,126 80,128 86,126 84,103"
          fill={getFill('lombar', ['lombar', 'eretor', 'stiff', 'terra'])}
          stroke={grooveStroke}
          strokeWidth="1"
        />
      </g>

      {/* GLÚTEOS (GLÚTEO MÁXIMO E MÉDIO) */}
      <g
        id="glutes"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={() => interactive && onSelectMuscle?.('gluteos')}
        filter={getGlowFilter('gluteos', ['gluteo', 'gluteos', 'pelvica'])}
      >
        <path
          d="M 63 127 C 57 134, 58 152, 66 158 C 74 162, 79 156, 80 146 L 80 129 Z"
          fill={getFill('gluteos', ['gluteo', 'gluteos', 'pelvica'])}
          stroke={grooveStroke}
          strokeWidth="1.3"
        />
        <path
          d="M 97 127 C 103 134, 102 152, 94 158 C 86 162, 81 156, 80 146 L 80 129 Z"
          fill={getFill('gluteos', ['gluteo', 'gluteos', 'pelvica'])}
          stroke={grooveStroke}
          strokeWidth="1.3"
        />
      </g>

      {/* ISQUIOTIBIAIS (POSTERIOR DE COXA) */}
      <g
        id="hamstrings"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={() => interactive && onSelectMuscle?.('isquiotibiais')}
        filter={getGlowFilter('isquiotibiais', ['isquiotibiais', 'posterior', 'mesa flexora', 'cadeira flexora', 'stiff'])}
      >
        <path
          d="M 62 160 C 59 170, 59 182, 63 188 C 68 189, 72 186, 73 178 C 75 170, 74 162, 72 159 Z"
          fill={getFill('isquiotibiais', ['isquiotibiais', 'posterior', 'mesa flexora', 'cadeira flexora', 'stiff'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
        <path
          d="M 98 160 C 101 170, 101 182, 97 188 C 92 189, 88 186, 87 178 C 85 170, 86 162, 88 159 Z"
          fill={getFill('isquiotibiais', ['isquiotibiais', 'posterior', 'mesa flexora', 'cadeira flexora', 'stiff'])}
          stroke={grooveStroke}
          strokeWidth="1.2"
        />
      </g>

      {/* PANTURRILHAS POSTERIORES (GASTROCNÊMIO DUPLO) */}
      <g
        id="calves-post"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={() => interactive && onSelectMuscle?.('panturrilhas')}
        filter={getGlowFilter('panturrilhas', ['panturrilha', 'panturrilhas', 'gemeos'])}
      >
        <path
          d="M 60 194 C 55 204, 56 218, 63 233 C 66 234, 69 232, 70 223 C 71 211, 69 200, 68 194 Z"
          fill={getFill('panturrilhas', ['panturrilha', 'panturrilhas', 'gemeos'])}
          stroke={grooveStroke}
          strokeWidth="1.1"
        />
        <path
          d="M 100 194 C 105 204, 104 218, 97 233 C 94 234, 91 232, 90 223 C 89 211, 91 200, 92 194 Z"
          fill={getFill('panturrilhas', ['panturrilha', 'panturrilhas', 'gemeos'])}
          stroke={grooveStroke}
          strokeWidth="1.1"
        />
        {/* Tendão de Aquiles e Calcanhares */}
        <path d="M 59 235 C 56 241, 58 245, 65 245 C 68 245, 68 240, 66 235 Z" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="0.8" />
        <path d="M 101 235 C 104 241, 102 245, 95 245 C 92 245, 92 240, 94 235 Z" fill={bodyBaseColor} stroke={grooveStroke} strokeWidth="0.8" />
      </g>
    </svg>
  );

  // Se o modo for 'both' (ambos lado a lado)
  if (view === 'both') {
    return (
      <div className={`flex items-center justify-center gap-4 ${className}`}>
        <div className="flex flex-col items-center">
          {showLabels && (
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
              Frente
            </span>
          )}
          {renderAnterior()}
        </div>
        <div className="flex flex-col items-center">
          {showLabels && (
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
              Costas
            </span>
          )}
          {renderPosterior()}
        </div>
      </div>
    );
  }

  // Se o modo for 'anterior' ou 'posterior' fixo
  if (view === 'anterior') {
    return <div className={`flex flex-col items-center justify-center ${className}`}>{renderAnterior()}</div>;
  }
  if (view === 'posterior') {
    return <div className={`flex flex-col items-center justify-center ${className}`}>{renderPosterior()}</div>;
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
