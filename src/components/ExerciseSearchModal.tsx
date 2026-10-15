import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Dumbbell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ExerciseTemplate, MuscleGroup, EquipmentCategory, ExerciseType } from '../types';

interface ExerciseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseTemplate) => void;
}

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

export const ExerciseSearchModal: React.FC<ExerciseSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectExercise
}) => {
  const { exercises, addCustomExercise } = useApp();
  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  // Formulário de exercício customizado
  const [customTitle, setCustomTitle] = useState('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('peito');
  const [customEquipment, setCustomEquipment] = useState<EquipmentCategory>('barra');
  const [customType, setCustomType] = useState<ExerciseType>('weight_reps');

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

  if (!isOpen) return null;

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newEx = {
      title: customTitle.trim(),
      primary_muscle_group: customMuscle,
      equipment: customEquipment,
      type: customType,
      muscles_pt: customMuscle.toUpperCase()
    };

    addCustomExercise(newEx);
    setIsCreatingCustom(false);
    setCustomTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col h-[90vh] sm:h-[80vh] text-white">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <h2 className="text-base font-bold text-white">
            {isCreatingCustom ? 'Novo Exercício Personalizado' : 'Adicionar Exercício'}
          </h2>
          <button
            onClick={() => {
              if (isCreatingCustom) setIsCreatingCustom(false);
              else onClose();
            }}
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isCreatingCustom ? (
          /* Formulário de Criação */
          <form onSubmit={handleCreateCustom} className="flex-1 flex flex-col gap-3 py-3 overflow-y-auto">
            <div>
              <label className="text-xs uppercase text-zinc-400 font-bold mb-1 block">
                Nome do Exercício
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Ex: Supino no Smith com Pegada Fechada"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase text-zinc-400 font-bold mb-1 block">
                Grupo Muscular Principal
              </label>
              <select
                value={customMuscle}
                onChange={(e) => setCustomMuscle(e.target.value as MuscleGroup)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
              >
                {MUSCLE_FILTERS.filter((m) => m.value !== 'all').map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase text-zinc-400 font-bold mb-1 block">
                Equipamento
              </label>
              <select
                value={customEquipment}
                onChange={(e) => setCustomEquipment(e.target.value as EquipmentCategory)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
              >
                <option value="barra">Barra</option>
                <option value="halteres">Halteres</option>
                <option value="maquina">Máquina</option>
                <option value="polia">Polia / Cabo</option>
                <option value="peso_corporal">Peso Corporal</option>
                <option value="kettlebell">Kettlebell</option>
                <option value="elastico">Elástico</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="text-xs uppercase text-zinc-400 font-bold mb-1 block">
                Tipo de Métrica
              </label>
              <select
                value={customType}
                onChange={(e) => setCustomType(e.target.value as ExerciseType)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
              >
                <option value="weight_reps">Peso & Repetições</option>
                <option value="bodyweight_reps">Apenas Repetições (Peso Corporal)</option>
                <option value="duration">Duração (Segundos / Minutos)</option>
                <option value="distance_duration">Distância & Tempo</option>
              </select>
            </div>

            <div className="mt-auto flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsCreatingCustom(false)}
                className="flex-1 py-2.5 bg-[#18181b] text-zinc-400 font-semibold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md"
              >
                Salvar Exercício
              </button>
            </div>
          </form>
        ) : (
          /* Lista de Exercícios */
          <>
            {/* Campo de Busca */}
            <div className="relative my-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome ou músculo..."
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
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

            {/* Filtros Horizontais por Músculo */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
              {MUSCLE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSelectedMuscle(f.value)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition ${
                    selectedMuscle === f.value
                      ? 'bg-white text-black'
                      : 'bg-[#18181b] text-zinc-400 hover:text-white border border-[#27272a]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Lista dos Exercícios */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredExercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-500">
                  <Dumbbell className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs font-semibold">Nenhum exercício encontrado</p>
                  <button
                    onClick={() => {
                      setCustomTitle(query);
                      setIsCreatingCustom(true);
                    }}
                    className="mt-2 text-xs font-bold text-white hover:underline"
                  >
                    + Criar "{query || 'Novo Exercício'}"
                  </button>
                </div>
              ) : (
                filteredExercises.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      onSelectExercise(ex);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-xl bg-[#18181b] hover:bg-[#222226] border border-[#27272a] transition flex items-center justify-between group active:scale-98"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-zinc-200 transition">
                        {ex.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold text-zinc-400 capitalize">
                          {ex.primary_muscle_group}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-[10px] text-zinc-500 capitalize">{ex.equipment}</span>
                        {ex.is_custom && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-zinc-700 text-white">
                            Personalizado
                          </span>
                        )}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-zinc-400 group-hover:text-white transition" />
                  </button>
                ))
              )}
            </div>

            {/* Rodapé: Botão Criar Personalizado */}
            <div className="pt-3 border-t border-[#27272a]">
              <button
                onClick={() => setIsCreatingCustom(true)}
                className="w-full py-2.5 bg-[#18181b] hover:bg-[#222226] text-white font-bold text-xs rounded-xl border border-white/20 flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                Criar Novo Exercício
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
