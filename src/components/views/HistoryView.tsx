import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Flame,
  Play,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDuration, displayWeight } from '../../utils/calc';
import { Workout } from '../../types';

export const HistoryView: React.FC = () => {
  const { workouts, startWorkout, settings } = useApp();
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  // Generate last 28 days for calendar heatmap
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
    startWorkout(undefined, `${workout.title} (Replay)`);
  };

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-28 space-y-5">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-white">History</h1>
        <p className="text-xs text-slate-400">Past logs & training consistency</p>
      </div>

      {/* Calendar Heatmap Card */}
      <div className="bg-[#131720] border border-[#242c3d] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-[#008cff]" />
            <span>Consistency (Last 4 Weeks)</span>
          </div>
          <span className="text-slate-400 font-semibold">
            {workouts.length} {workouts.length === 1 ? 'Session' : 'Sessions'}
          </span>
        </div>

        {/* 7 columns x 4 rows mini grid */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {calendarDays.map((d) => (
            <div
              key={d.date}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition ${
                d.workoutCount > 0
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-[#1a202c] text-slate-600'
              }`}
              title={`${d.date}: ${d.workoutCount} workouts`}
            >
              <span>{d.dayOfMonth}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Workout History List */}
      <div className="space-y-3">
        <span className="text-xs uppercase text-slate-400 font-semibold block">
          Workouts Logged ({workouts.length})
        </span>

        {workouts.length === 0 ? (
          <div className="bg-[#131720] border border-[#242c3d] rounded-2xl p-8 text-center text-slate-500 space-y-2">
            <Dumbbell className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm font-semibold">No workouts logged yet</p>
            <p className="text-xs text-slate-600">Start an empty workout or run a routine to begin your streak!</p>
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
                className="bg-[#131720] border border-[#242c3d] rounded-2xl p-4 shadow-md flex flex-col gap-3 transition"
              >
                {/* Header */}
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => toggleExpand(w.id)}
                >
                  <div>
                    <h3 className="text-base font-bold text-white hover:text-[#008cff] transition">
                      {w.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{new Date(w.start_time).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}</span>
                      <span>•</span>
                      <span>{formatDuration(durationSec)}</span>
                    </div>
                  </div>

                  <button className="p-1 text-slate-400 hover:text-white">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Metrics Badges */}
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Dumbbell className="w-3.5 h-3.5 text-[#008cff]" />
                    <span>{displayWeight(w.total_volume_kg, settings.weight_unit)}</span>
                  </div>
                  <div className="text-slate-400">
                    <span>{w.total_sets} sets</span>
                  </div>
                  {(w.prs_hit || 0) > 0 && (
                    <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-[11px] font-bold">
                      <Flame className="w-3 h-3 fill-amber-400" />
                      <span>{w.prs_hit} PRs</span>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="space-y-3 pt-3 border-t border-[#242c3d] animate-in fade-in duration-150">
                    {w.description && (
                      <p className="text-xs text-slate-400 italic bg-[#1a202c] p-2.5 rounded-xl">
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
                            className="bg-[#1a202c] p-3 rounded-xl border border-[#242c3d] text-xs space-y-1.5"
                          >
                            <h4 className="font-bold text-[#008cff]">{ex.title}</h4>
                            <div className="space-y-1 pl-1">
                              {completedSets.map((s, sIdx) => (
                                <div key={sIdx} className="flex justify-between text-slate-300">
                                  <span className="text-slate-500 font-semibold">Set {sIdx + 1}</span>
                                  <span className="font-bold">
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
                      className="w-full py-2.5 bg-[#1a202c] hover:bg-[#222938] text-[#008cff] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Repeat This Workout
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
