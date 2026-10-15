import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Dumbbell,
  Trophy,
  Info,
  History,
  X,
  Trash2,
  PlaySquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExerciseTemplate, MuscleGroup } from '../../types';
import { displayWeight } from '../../utils/calc';
import { ExerciseSearchModal } from '../ExerciseSearchModal';
import { ExerciseVisualDemo } from '../ExerciseVisualDemo';

const MUSCLE_FILTERS: { label: string; value: MuscleGroup | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Peito', value: 'peito' },
  { label: 'Costas', value: 'costas' },
  { label: 'Dorsal (Asas)', value: 'lats' },
  { label: 'Ombros', value: 'ombros' },
  { label: 'Bíceps', value: 'biceps' },
  { label: 'Tríceps', value: 'triceps' },
  { label: 'Quadríceps', value: 'quadriceps' },
  { label: 'Posterior', value: 'isquiotibiais' },
  { label: 'Glúteos', value: 'gluteos' },
  { label: 'Panturrilha', value: 'panturrilha' },
  { label: 'Abdômen', value: 'abdomen' },
  { label: 'Cárdio', value: 'cardio' }
];

export const ExercisesView: React.FC = () => {
  const { exercises, personalRecords, workouts, settings, deleteCustomExercise } = useApp();

  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all');
  const [selectedDetailExercise, setSelectedDetailExercise] = useState<ExerciseTemplate | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesQuery =
        ex.title.toLowerCase().includes(query.toLowerCase()) ||
        ex.primary_muscle_group.toLowerCase().includes(query.toLowerCase()) ||
        (ex.muscles_pt && ex.muscles_pt.toLowerCase().includes(query.toLowerCase()));
      const matchesMuscle =
        selectedMuscle === 'all' ||
        ex.primary_muscle_group === selectedMuscle ||
        ex.secondary_muscle_groups?.includes(selectedMuscle as MuscleGroup);
      return matchesQuery && matchesMuscle;
    });
  }, [exercises, query, selectedMuscle]);

  // Histórico de séries realizadas deste exercício
  const exerciseHistory = useMemo(() => {
    if (!selectedDetailExercise) return [];
    const list: { workoutTitle: string; date: string; sets: any[] }[] = [];

    workouts.forEach((w) => {
      const found = w.exercises.find((e) => e.exercise_template_id === selectedDetailExercise.id);
      if (found && found.sets.some((s) => s.completed)) {
        list.push({
          workoutTitle: w.title,
          date: w.start_time,
          sets: found.sets.filter((s) => s.completed)
        });
      }
    });

    return list;
  }, [selectedDetailExercise, workouts]);

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-28 space-y-4 text-white">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Exercícios</h1>
          <p className="text-xs text-zinc-400">Guia de execução, animações & PRs</p>
        </div>
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="p-2.5 bg-[#141416] hover:bg-[#1e1e24] border border-[#27272a] text-white rounded-xl flex items-center gap-1.5 text-xs font-bold transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Criar</span>
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar exercício, músculo..."
          className="w-full bg-[#141416] border border-[#27272a] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filtros de Músculos */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {MUSCLE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSelectedMuscle(f.value)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition ${
              selectedMuscle === f.value
                ? 'bg-white text-black'
                : 'bg-[#141416] text-zinc-400 hover:text-white border border-[#27272a]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de Exercícios */}
      <div className="space-y-2">
        {filteredExercises.map((ex) => {
          const pr = personalRecords[ex.id];
          return (
            <div
              key={ex.id}
              onClick={() => setSelectedDetailExercise(ex)}
              className="bg-[#141416] border border-[#27272a] hover:border-zinc-500 rounded-2xl p-3.5 shadow-sm flex items-center justify-between cursor-pointer transition active:scale-98"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white transition">{ex.title}</h4>
                  <PlaySquare className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-semibold text-zinc-400 capitalize">
                    {ex.primary_muscle_group}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-[10px] text-zinc-500 capitalize">{ex.equipment}</span>
                  {ex.is_custom && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-zinc-800 text-white">
                      Custom
                    </span>
                  )}
                </div>
              </div>

              {/* Recorde se houver */}
              {pr ? (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-xs font-black text-white">
                    <Trophy className="w-3.5 h-3.5 text-zinc-300" />
                    <span>{displayWeight(pr.max_weight_kg, settings.weight_unit)}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">1RM: {displayWeight(pr.best_1rm_kg, settings.weight_unit)}</span>
                </div>
              ) : (
                <span className="text-[10px] text-zinc-600 font-bold uppercase">Ver Demo</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Completo com Vídeo / Demonstração Visual */}
      {selectedDetailExercise && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto text-white">
            {/* Topo */}
            <div className="flex items-start justify-between pb-2 border-b border-[#27272a]">
              <div>
                <h2 className="text-base font-black text-white">{selectedDetailExercise.title}</h2>
                <span className="text-xs text-zinc-400 capitalize">
                  {selectedDetailExercise.primary_muscle_group} • {selectedDetailExercise.equipment}
                </span>
              </div>
              <button
                onClick={() => setSelectedDetailExercise(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PLAYER DE ANIMAÇÃO / DEMONSTRAÇÃO VISUAL */}
            <ExerciseVisualDemo exercise={selectedDetailExercise} />

            {/* Caixa de Recorde Pessoal */}
            <div className="bg-[#18181b] p-3 rounded-xl border border-[#27272a]">
              <span className="text-xs uppercase text-zinc-400 font-bold block mb-2 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-white" />
                Seu Recorde Pessoal (PR)
              </span>
              {personalRecords[selectedDetailExercise.id] ? (
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-[#121214] p-2 rounded-lg border border-[#27272a]">
                    <span className="text-[10px] uppercase text-zinc-500 font-semibold block">
                      Carga Máxima
                    </span>
                    <span className="text-sm font-black text-white">
                      {displayWeight(
                        personalRecords[selectedDetailExercise.id].max_weight_kg,
                        settings.weight_unit
                      )}
                    </span>
                  </div>
                  <div className="bg-[#121214] p-2 rounded-lg border border-[#27272a]">
                    <span className="text-[10px] uppercase text-zinc-500 font-semibold block">
                      1RM Estimado
                    </span>
                    <span className="text-sm font-black text-white">
                      {displayWeight(
                        personalRecords[selectedDetailExercise.id].best_1rm_kg,
                        settings.weight_unit
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">Nenhuma série registrada ainda</p>
              )}
            </div>

            {/* Histórico Recente */}
            {exerciseHistory.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs uppercase text-zinc-400 font-bold block flex items-center gap-1.5">
                  <History className="w-4 h-4 text-white" />
                  Sessões Anteriores
                </span>
                <div className="space-y-1">
                  {exerciseHistory.slice(0, 3).map((h, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#18181b] rounded-xl border border-[#27272a] text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-white block">{h.workoutTitle}</span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(h.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-right text-zinc-300">
                        {h.sets.map((s, sIdx) => (
                          <span key={sIdx} className="font-semibold block text-[11px]">
                            {s.weight_kg}kg × {s.reps} reps
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Excluir se customizado */}
            {selectedDetailExercise.is_custom && (
              <button
                onClick={() => {
                  deleteCustomExercise(selectedDetailExercise.id);
                  setSelectedDetailExercise(null);
                }}
                className="w-full py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Excluir Exercício Personalizado
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal de Busca / Criação */}
      <ExerciseSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectExercise={(ex) => setSelectedDetailExercise(ex)}
      />
    </div>
  );
};
