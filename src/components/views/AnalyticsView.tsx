import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Trophy,
  Scale,
  Flame,
  Dumbbell,
  Clock,
  Plus,
  TrendingUp,
  X
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

  // Overall Statistics
  const totalVolume = useMemo(() => {
    return workouts.reduce((acc, w) => acc + (w.total_volume_kg || 0), 0);
  }, [workouts]);

  const totalSets = useMemo(() => {
    return workouts.reduce((acc, w) => acc + (w.total_sets || 0), 0);
  }, [workouts]);

  // Muscle group set distribution
  const muscleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    workouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        const completedCount = ex.sets.filter((s) => s.completed).length;
        if (completedCount > 0) {
          // Map to broad category
          const muscle = ex.title.toLowerCase();
          let cat = 'Other';
          if (muscle.includes('bench') || muscle.includes('chest') || muscle.includes('push up') || muscle.includes('fly')) {
            cat = 'Chest';
          } else if (muscle.includes('deadlift') || muscle.includes('lat') || muscle.includes('row') || muscle.includes('pull up')) {
            cat = 'Back';
          } else if (muscle.includes('press') || muscle.includes('lateral') || muscle.includes('delt')) {
            cat = 'Shoulders';
          } else if (muscle.includes('curl') || muscle.includes('triceps') || muscle.includes('skull')) {
            cat = 'Arms';
          } else if (muscle.includes('squat') || muscle.includes('leg') || muscle.includes('calf') || muscle.includes('thrust')) {
            cat = 'Legs';
          } else if (muscle.includes('plank') || muscle.includes('crunch') || muscle.includes('abs')) {
            cat = 'Core';
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
    <div className="flex flex-col min-h-full px-4 pt-4 pb-28 space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Analytics</h1>
        <p className="text-xs text-slate-400">Progression, PRs & body metrics</p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#131720] border border-[#242c3d] p-3.5 rounded-2xl flex flex-col items-center text-center">
          <Flame className="w-5 h-5 text-amber-400 mb-1" />
          <span className="text-[10px] uppercase font-bold text-slate-500">Workouts</span>
          <span className="text-lg font-black text-white">{workouts.length}</span>
        </div>

        <div className="bg-[#131720] border border-[#242c3d] p-3.5 rounded-2xl flex flex-col items-center text-center">
          <Dumbbell className="w-5 h-5 text-[#008cff] mb-1" />
          <span className="text-[10px] uppercase font-bold text-slate-500">Volume</span>
          <span className="text-lg font-black text-white">
            {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume}kg`}
          </span>
        </div>

        <div className="bg-[#131720] border border-[#242c3d] p-3.5 rounded-2xl flex flex-col items-center text-center">
          <TrendingUp className="w-5 h-5 text-emerald-400 mb-1" />
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Sets</span>
          <span className="text-lg font-black text-white">{totalSets}</span>
        </div>
      </div>

      {/* Muscle Distribution Chart */}
      <div className="bg-[#131720] border border-[#242c3d] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#008cff]" />
            <span>Muscle Training Distribution</span>
          </div>
          <span className="text-slate-500 text-[11px]">{totalSets} completed sets</span>
        </div>

        {muscleDistribution.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">Complete workouts to see your split</p>
        ) : (
          <div className="space-y-2 pt-1">
            {muscleDistribution.map((m) => (
              <div key={m.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{m.name}</span>
                  <span className="text-slate-400 font-bold">{m.percent}% ({m.count})</span>
                </div>
                <div className="w-full h-2 bg-[#1a202c] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${m.percent}%` }}
                    className="h-full bg-gradient-to-r from-[#008cff] to-cyan-400 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PR Trophy Shelf */}
      <div className="bg-[#131720] border border-[#242c3d] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Personal Records Trophy Shelf</span>
          </div>
          <span className="text-amber-400 text-xs font-bold">{prList.length} PRs</span>
        </div>

        {prList.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">PRs will appear as you record heavy sets!</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {prList.map((pr) => (
              <div
                key={pr.exercise_template_id}
                className="bg-[#1a202c] p-3 rounded-xl border border-[#242c3d] flex flex-col justify-between"
              >
                <span className="text-xs font-bold text-white line-clamp-1">{pr.exercise_title}</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-base font-black text-amber-400">
                    {displayWeight(pr.max_weight_kg, settings.weight_unit)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    1RM: {displayWeight(pr.best_1rm_kg, settings.weight_unit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Body Measurements Log */}
      <div className="bg-[#131720] border border-[#242c3d] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <div className="flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>Body Measurements</span>
          </div>
          <button
            onClick={() => setIsAddingMeasurement(!isAddingMeasurement)}
            className="text-xs text-[#008cff] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Log Entry
          </button>
        </div>

        {isAddingMeasurement && (
          <form
            onSubmit={handleSaveMeasurement}
            className="bg-[#1a202c] p-3.5 rounded-xl border border-[#242c3d] space-y-3 animate-in fade-in duration-100"
          >
            <span className="text-xs font-bold text-white block">Log Today's Measurement</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="Weight (kg)"
                value={measWeight}
                onChange={(e) => setMeasWeight(e.target.value)}
                className="bg-[#131720] border border-[#242c3d] rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Body Fat (%)"
                value={measFat}
                onChange={(e) => setMeasFat(e.target.value)}
                className="bg-[#131720] border border-[#242c3d] rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="number"
                step="0.5"
                placeholder="Waist (cm)"
                value={measWaist}
                onChange={(e) => setMeasWaist(e.target.value)}
                className="bg-[#131720] border border-[#242c3d] rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="number"
                step="0.5"
                placeholder="Arms (cm)"
                value={measArms}
                onChange={(e) => setMeasArms(e.target.value)}
                className="bg-[#131720] border border-[#242c3d] rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAddingMeasurement(false)}
                className="px-3 py-1 bg-[#131720] text-slate-400 text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-[#008cff] text-white font-bold text-xs rounded-lg"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {measurements.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-1">Track body weight and measurements over time</p>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {measurements.map((m, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-[#1a202c] rounded-xl border border-[#242c3d] flex justify-between items-center text-xs"
              >
                <span className="font-semibold text-slate-400">{m.date}</span>
                <div className="flex gap-3 text-white font-bold">
                  {m.weight_kg && <span>{m.weight_kg} kg</span>}
                  {m.fat_percent && <span className="text-amber-400">{m.fat_percent}% fat</span>}
                  {m.waist_cm && <span className="text-slate-400">{m.waist_cm}cm waist</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
