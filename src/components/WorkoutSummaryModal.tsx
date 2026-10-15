import React from 'react';
import { Trophy, Clock, Dumbbell, Award, CheckCircle2, Flame, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDuration, displayWeight } from '../utils/calc';

export const WorkoutSummaryModal: React.FC = () => {
  const { completedWorkoutSummary, closeSummaryModal, settings } = useApp();

  if (!completedWorkoutSummary) return null;

  const durationSec = completedWorkoutSummary.end_time && completedWorkoutSummary.start_time
    ? Math.max(
        0,
        Math.floor(
          (new Date(completedWorkoutSummary.end_time).getTime() -
            new Date(completedWorkoutSummary.start_time).getTime()) /
            1000
        )
      )
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#131720] border border-[#242c3d] rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative">
        <button
          onClick={closeSummaryModal}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy Header Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
          <Trophy className="w-8 h-8 text-black" />
        </div>

        <h2 className="text-xl font-black text-white">Workout Completed!</h2>
        <p className="text-xs text-slate-400 mt-1">{completedWorkoutSummary.title}</p>

        {/* PR Banner if PRs hit */}
        {(completedWorkoutSummary.prs_hit || 0) > 0 && (
          <div className="mt-3 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Flame className="w-4 h-4 fill-amber-400" />
            <span>{completedWorkoutSummary.prs_hit} Personal Records Hit!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 w-full mt-6">
          <div className="bg-[#1a202c] p-3 rounded-2xl border border-[#242c3d]">
            <Clock className="w-4 h-4 text-[#008cff] mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Time</span>
            <span className="text-sm font-black text-white">{formatDuration(durationSec)}</span>
          </div>

          <div className="bg-[#1a202c] p-3 rounded-2xl border border-[#242c3d]">
            <Dumbbell className="w-4 h-4 text-[#008cff] mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Volume</span>
            <span className="text-sm font-black text-white">
              {displayWeight(completedWorkoutSummary.total_volume_kg, settings.weight_unit)}
            </span>
          </div>

          <div className="bg-[#1a202c] p-3 rounded-2xl border border-[#242c3d]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sets</span>
            <span className="text-sm font-black text-white">{completedWorkoutSummary.total_sets}</span>
          </div>
        </div>

        {/* Exercises list summary */}
        <div className="w-full mt-5 max-h-36 overflow-y-auto space-y-1.5 text-left border-t border-[#242c3d] pt-3">
          {completedWorkoutSummary.exercises.map((ex, idx) => {
            const completedSets = ex.sets.filter((s) => s.completed);
            if (completedSets.length === 0) return null;
            return (
              <div key={idx} className="flex justify-between text-xs py-1">
                <span className="font-semibold text-slate-300 truncate pr-2">{ex.title}</span>
                <span className="text-slate-500 shrink-0">{completedSets.length} sets</span>
              </div>
            );
          })}
        </div>

        {/* Done Button */}
        <button
          onClick={closeSummaryModal}
          className="w-full mt-6 py-3.5 bg-[#008cff] hover:bg-[#0077db] text-white font-bold rounded-xl active:scale-98 transition shadow-lg shadow-[#008cff]/20"
        >
          Awesome
        </button>
      </div>
    </div>
  );
};
