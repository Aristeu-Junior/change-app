import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Trophy,
  Scale,
  Flame,
  Dumbbell,
  Plus,
  TrendingUp
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { displayWeight } from '../../utils/calc';
import { BodyMeasurement } from '../../types';

export const AnalyticsView: React.FC = () => {
  const { workouts, personalRecords, measurements, saveMeasurement, settings } = useApp();

  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false);
  const [measWeight, setMeasWeight] = useState<string>('');
  const [measFat, setMeasFat] = useState<string>('');
  const [measWaist, setMeasWaist] = useState<string>('');
  const [measArms, setMeasArms] = useState<string>('');

  const totalVolume = useMemo(() => {
    return workouts.reduce((acc, w) => acc + (w.total_volume_kg || 0), 0);
  }, [workouts]);

  const totalSets = useMemo(() => {
    return workouts.reduce((acc, w) => acc + (w.total_sets || 0), 0);
  }, [workouts]);

  // Distribuição de séries por grupo muscular em Português
  const muscleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    workouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        const completedCount = ex.sets.filter((s) => s.completed).length;
        if (completedCount > 0) {
          const muscle = ex.title.toLowerCase();
          let cat = 'Outros';
          if (muscle.includes('supino') || muscle.includes('peito') || muscle.includes('crucifixo') || muscle.includes('flexão')) {
            cat = 'Peito';
          } else if (muscle.includes('terra') || muscle.includes('puxada') || muscle.includes('remada') || muscle.includes('barra fixa')) {
            cat = 'Costas';
          } else if (muscle.includes('desenvolvimento') || muscle.includes('elevação') || muscle.includes('ombro')) {
            cat = 'Ombros';
          } else if (muscle.includes('rosca') || muscle.includes('tríceps') || muscle.includes('bíceps')) {
            cat = 'Braços';
          } else if (muscle.includes('agachamento') || muscle.includes('leg') || muscle.includes('extensora') || muscle.includes('stiff') || muscle.includes('panturrilha')) {
            cat = 'Pernas';
          } else if (muscle.includes('prancha') || muscle.includes('abdominal') || muscle.includes('pernas na barra')) {
            cat = 'Abdômen';
          }

          counts[cat] = (counts[cat] || 0) + completedCount;
          total += completedCount;
        }
      });
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }, [workouts]);

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const m: BodyMeasurement = {
      date: today,
      weight_kg: measWeight ? parseFloat(measWeight) : null,
      fat_percent: measFat ? parseFloat(measFat) : null,
      waist_cm: measWaist ? parseFloat(measWaist) : null,
      arms_cm: measArms ? parseFloat(measArms) : null
    };

    saveMeasurement(m);
    setIsAddingMeasurement(false);
    setMeasWeight('');
    setMeasFat('');
    setMeasWaist('');
    setMeasArms('');
  };

  const prList = Object.values(personalRecords);

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-28 space-y-6 text-white">
      {/* Topo */}
      <div>
        <h1 className="text-2xl font-black text-white">Estatísticas</h1>
        <p className="text-xs text-zinc-400">Evolução de carga, volume & medidas</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#141416] border border-[#27272a] p-3.5 rounded-2xl flex flex-col items-center text-center">
          <Flame className="w-5 h-5 text-white mb-1" />
          <span className="text-[10px] uppercase font-bold text-zinc-400">Treinos</span>
          <span className="text-base font-black text-white">{workouts.length}</span>
        </div>

        <div className="bg-[#141416] border border-[#27272a] p-3.5 rounded-2xl flex flex-col items-center text-center">
          <Dumbbell className="w-5 h-5 text-white mb-1" />
          <span className="text-[10px] uppercase font-bold text-zinc-400">Volume</span>
          <span className="text-base font-black text-white">
            {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume}kg`}
          </span>
        </div>

        <div className="bg-[#141416] border border-[#27272a] p-3.5 rounded-2xl flex flex-col items-center text-center">
          <TrendingUp className="w-5 h-5 text-white mb-1" />
          <span className="text-[10px] uppercase font-bold text-zinc-400">Séries</span>
          <span className="text-base font-black text-white">{totalSets}</span>
        </div>
      </div>

      {/* Gráfico de Distribuição Muscular */}
      <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-white" />
            <span>Foco Muscular Treinado</span>
          </div>
          <span className="text-zinc-500 text-[11px] font-semibold">{totalSets} séries totais</span>
        </div>

        {muscleDistribution.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-2">
            Complete seus treinos para visualizar o equilíbrio da sua divisão
          </p>
        ) : (
          <div className="space-y-2 pt-1">
            {muscleDistribution.map((m) => (
              <div key={m.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-300">{m.name}</span>
                  <span className="text-white font-black">{m.percent}% ({m.count} séries)</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${m.percent}%` }}
                    className="h-full bg-white rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vitrine de Recordes Pessoais (PRs) */}
      <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-white" />
            <span>Recordes Pessoais (PR)</span>
          </div>
          <span className="text-white text-xs font-black">{prList.length} PRs</span>
        </div>

        {prList.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-2">
            Seus recordes de carga e repetições máximas aparecerão aqui automaticamente!
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {prList.map((pr) => (
              <div
                key={pr.exercise_template_id}
                className="bg-[#18181b] p-3 rounded-xl border border-[#27272a] flex flex-col justify-between"
              >
                <span className="text-xs font-bold text-white line-clamp-1">{pr.exercise_title}</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-sm font-black text-white">
                    {displayWeight(pr.max_weight_kg, settings.weight_unit)}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold">
                    1RM: {displayWeight(pr.best_1rm_kg, settings.weight_unit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registro de Medidas Corporais */}
      <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
          <div className="flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-white" />
            <span>Medidas Corporais & Peso</span>
          </div>
          <button
            onClick={() => setIsAddingMeasurement(!isAddingMeasurement)}
            className="text-xs text-white hover:underline flex items-center gap-1 font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> Registrar Hoje
          </button>
        </div>

        {isAddingMeasurement && (
          <form
            onSubmit={handleSaveMeasurement}
            className="bg-[#18181b] p-3 rounded-xl border border-[#27272a] space-y-3 animate-in fade-in duration-100"
          >
            <span className="text-xs font-bold text-white block">Adicionar Nova Medição</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="Peso Corporal (kg)"
                value={measWeight}
                onChange={(e) => setMeasWeight(e.target.value)}
                className="bg-[#121214] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Gordura Corporal (%)"
                value={measFat}
                onChange={(e) => setMeasFat(e.target.value)}
                className="bg-[#121214] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="number"
                step="0.5"
                placeholder="Cintura (cm)"
                value={measWaist}
                onChange={(e) => setMeasWaist(e.target.value)}
                className="bg-[#121214] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="number"
                step="0.5"
                placeholder="Braço Contraído (cm)"
                value={measArms}
                onChange={(e) => setMeasArms(e.target.value)}
                className="bg-[#121214] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAddingMeasurement(false)}
                className="px-3 py-1 bg-[#121214] text-zinc-400 text-xs rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-white text-black font-black text-xs rounded-lg"
              >
                Salvar Medida
              </button>
            </div>
          </form>
        )}

        {measurements.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-1">
            Acompanhe seu peso e evolução física ao longo dos meses
          </p>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {measurements.map((m, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-[#18181b] rounded-xl border border-[#27272a] flex justify-between items-center text-xs"
              >
                <span className="font-semibold text-zinc-400">{m.date}</span>
                <div className="flex gap-3 text-white font-bold">
                  {m.weight_kg && <span>{m.weight_kg} kg</span>}
                  {m.fat_percent && <span className="text-zinc-300">{m.fat_percent}% fat</span>}
                  {m.waist_cm && <span className="text-zinc-400">{m.waist_cm}cm cintura</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
