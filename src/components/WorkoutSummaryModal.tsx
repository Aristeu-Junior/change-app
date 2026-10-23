import React, { useState } from 'react';
import { Trophy, Clock, Dumbbell, CheckCircle2, Flame, X, BookmarkPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDuration, displayWeight } from '../utils/calc';
import { Routine } from '../types';

export const WorkoutSummaryModal: React.FC = () => {
  const { completedWorkoutSummary, closeSummaryModal, settings, saveRoutine } = useApp();
  const [hasSavedRoutine, setHasSavedRoutine] = useState(false);

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

  const handleSaveAsRoutine = () => {
    if (hasSavedRoutine) return;
    const routine: Routine = {
      id: `routine-${Date.now()}`,
      title: completedWorkoutSummary.title || 'Meu Plano de Treino',
      folder_id: null,
      notes: `Plano gerado a partir do treino concluído em ${new Date().toLocaleDateString('pt-BR')}.`,
      exercises: completedWorkoutSummary.exercises.map((ex, exIdx) => ({
        id: `re-${Date.now()}-${exIdx}`,
        exercise_template_id: ex.exercise_template_id,
        title: ex.title,
        rest_seconds: ex.rest_seconds || 90,
        sets: ex.sets.map((s, sIdx) => ({
          id: `rs-${Date.now()}-${exIdx}-${sIdx}`,
          index: sIdx,
          type: s.type || 'normal',
          weight_kg: s.weight_kg !== null && s.weight_kg !== undefined ? Number(s.weight_kg) : 20,
          reps: s.reps !== null && s.reps !== undefined ? Number(s.reps) : 10,
          completed: false
        }))
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    saveRoutine(routine);
    setHasSavedRoutine(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 30, 40]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 text-white">
      <div className="w-full max-w-sm bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative">
        <button
          onClick={closeSummaryModal}
          className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition absolute right-4 top-4"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone Troféu */}
        <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl mb-4 animate-bounce">
          <Trophy className="w-8 h-8 fill-black" />
        </div>

        <h2 className="text-xl font-black text-white">Treino Concluído!</h2>
        <p className="text-xs text-zinc-400 mt-1 font-semibold">{completedWorkoutSummary.title}</p>

        {/* Banner de Recorde */}
        {(completedWorkoutSummary.prs_hit || 0) > 0 && (
          <div className="mt-3 px-3 py-1.5 rounded-full bg-zinc-800 border border-white/40 flex items-center gap-1.5 text-xs font-black text-white">
            <Flame className="w-4 h-4 fill-white" />
            <span>{completedWorkoutSummary.prs_hit} Recordes Pessoais Batidos!</span>
          </div>
        )}

        {/* Grade de Estatísticas */}
        <div className="grid grid-cols-3 gap-2 w-full mt-5">
          <div className="bg-[#18181b] p-3 rounded-2xl border border-[#27272a]">
            <Clock className="w-4 h-4 text-white mx-auto mb-1" />
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Tempo</span>
            <span className="text-sm font-black text-white">{formatDuration(durationSec)}</span>
          </div>

          <div className="bg-[#18181b] p-3 rounded-2xl border border-[#27272a]">
            <Dumbbell className="w-4 h-4 text-white mx-auto mb-1" />
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Carga</span>
            <span className="text-sm font-black text-white">
              {displayWeight(completedWorkoutSummary.total_volume_kg, settings.weight_unit)}
            </span>
          </div>

          <div className="bg-[#18181b] p-3 rounded-2xl border border-[#27272a]">
            <CheckCircle2 className="w-4 h-4 text-white mx-auto mb-1" />
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Séries</span>
            <span className="text-sm font-black text-white">{completedWorkoutSummary.total_sets}</span>
          </div>
        </div>

        {/* Lista resumida de exercícios com a carga exata */}
        <div className="w-full mt-4 max-h-40 overflow-y-auto space-y-1.5 text-left border-t border-[#27272a] pt-3">
          {completedWorkoutSummary.exercises.map((ex, idx) => {
            const completedSets = ex.sets.filter((s) => s.completed);
            if (completedSets.length === 0) return null;
            const maxW = Math.max(...completedSets.map((s) => Number(s.weight_kg) || 0));
            return (
              <div key={idx} className="flex justify-between text-xs py-1">
                <span className="font-semibold text-zinc-300 truncate pr-2">{ex.title}</span>
                <span className="text-white shrink-0 font-black">
                  {displayWeight(maxW, settings.weight_unit)} • {completedSets.length} séries
                </span>
              </div>
            );
          })}
        </div>

        {/* Botões de Ação */}
        <div className="w-full flex flex-col gap-2 mt-5">
          <button
            type="button"
            onClick={handleSaveAsRoutine}
            disabled={hasSavedRoutine}
            className={`w-full py-3 border rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm ${
              hasSavedRoutine
                ? 'bg-zinc-900 border-zinc-600 text-white'
                : 'bg-[#18181b] hover:bg-[#222226] border-[#3f3f46] text-white active:scale-98'
            }`}
          >
            {hasSavedRoutine ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>✓ Salvo como Plano de Treino</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4 text-white" />
                <span>Salvar como Plano de Treino</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={closeSummaryModal}
            className="w-full py-3.5 bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl active:scale-98 transition shadow-lg"
          >
            Excelente
          </button>
        </div>
      </div>
    </div>
  );
};
