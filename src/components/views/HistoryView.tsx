import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Flame,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDuration, displayWeight } from '../../utils/calc';
import { Workout } from '../../types';

export const HistoryView: React.FC = () => {
  const { workouts, startWorkout, settings } = useApp();
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  // Gera os últimos 28 dias para o mapa de calor
  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = workouts.filter((w) => w.start_time.startsWith(dateStr)).length;
      days.push({
        date: dateStr,
        dayOfMonth: d.getDate(),
        workoutCount: count
      });
    }
    return days;
  }, [workouts]);

  const toggleExpand = (id: string) => {
    setExpandedWorkoutId(expandedWorkoutId === id ? null : id);
  };

  const handleRepeatWorkout = (workout: Workout) => {
    startWorkout(undefined, `${workout.title} (Repetição)`);
  };

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-28 space-y-5 text-white">
      {/* Topo */}
      <div>
        <h1 className="text-2xl font-black text-white">Histórico</h1>
        <p className="text-xs text-zinc-400">Consistência de treinos & diário de bordo</p>
      </div>

      {/* Card do Mapa de Calor (Heatmap) */}
      <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-white" />
            <span>Frequência (Últimas 4 Semanas)</span>
          </div>
          <span className="text-zinc-400 font-semibold">
            {workouts.length} {workouts.length === 1 ? 'Treino' : 'Treinos'}
          </span>
        </div>

        {/* Grade 7 colunas x 4 linhas */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {calendarDays.map((d) => (
            <div
              key={d.date}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition ${
                d.workoutCount > 0
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#1c1c1f] text-zinc-600'
              }`}
              title={`${d.date}: ${d.workoutCount} treinos`}
            >
              <span>{d.dayOfMonth}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista Cronológica */}
      <div className="space-y-3">
        <span className="text-xs uppercase text-zinc-400 font-bold block">
          Treinos Concluídos ({workouts.length})
        </span>

        {workouts.length === 0 ? (
          <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-8 text-center text-zinc-500 space-y-2">
            <Dumbbell className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-xs font-bold">Nenhum treino registrado ainda</p>
            <p className="text-[11px] text-zinc-600">
              Inicie um treino livre ou selecione um plano para começar seu histórico!
            </p>
          </div>
        ) : (
          workouts.map((w) => {
            const isExpanded = expandedWorkoutId === w.id;
            const durationSec =
              w.end_time && w.start_time
                ? Math.max(
                    0,
                    Math.floor(
                      (new Date(w.end_time).getTime() - new Date(w.start_time).getTime()) / 1000
                    )
                  )
                : 0;

            return (
              <div
                key={w.id}
                className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md flex flex-col gap-3 transition"
              >
                {/* Cabeçalho */}
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => toggleExpand(w.id)}
                >
                  <div>
                    <h3 className="text-sm font-bold text-white transition">{w.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                      <span>
                        {new Date(w.start_time).toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                      <span>•</span>
                      <span>{formatDuration(durationSec)}</span>
                    </div>
                  </div>

                  <button className="p-1 text-zinc-400 hover:text-white">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Métricas */}
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-1 text-zinc-300">
                    <Dumbbell className="w-3.5 h-3.5 text-white" />
                    <span>{displayWeight(w.total_volume_kg, settings.weight_unit)}</span>
                  </div>
                  <div className="text-zinc-400">
                    <span>{w.total_sets} séries</span>
                  </div>
                  {(w.prs_hit || 0) > 0 && (
                    <div className="flex items-center gap-1 text-white bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-600 text-[10px] font-black">
                      <Flame className="w-3 h-3 fill-white" />
                      <span>{w.prs_hit} PRs</span>
                    </div>
                  )}
                </div>

                {/* Detalhes Expandidos */}
                {isExpanded && (
                  <div className="space-y-3 pt-3 border-t border-[#27272a] animate-in fade-in duration-150">
                    {w.description && (
                      <p className="text-xs text-zinc-400 italic bg-[#18181b] p-2.5 rounded-xl">
                        "{w.description}"
                      </p>
                    )}

                    <div className="space-y-2">
                      {w.exercises.map((ex, exIdx) => {
                        const completedSets = ex.sets.filter((s) => s.completed);
                        if (completedSets.length === 0) return null;
                        return (
                          <div
                            key={exIdx}
                            className="bg-[#18181b] p-3 rounded-xl border border-[#27272a] text-xs space-y-1.5"
                          >
                            <h4 className="font-bold text-white">{ex.title}</h4>
                            <div className="space-y-1 pl-1">
                              {completedSets.map((s, sIdx) => (
                                <div key={sIdx} className="flex justify-between text-zinc-300">
                                  <span className="text-zinc-500 font-semibold">Série {sIdx + 1}</span>
                                  <span className="font-black text-white">
                                    {s.weight_kg} kg × {s.reps} reps
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handleRepeatWorkout(w)}
                      className="w-full py-2.5 bg-[#18181b] hover:bg-[#222226] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-[#27272a]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Repetir Este Treino
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
