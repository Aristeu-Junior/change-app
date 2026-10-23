import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Flame,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDuration, displayWeight } from '../../utils/calc';
import { Workout } from '../../types';

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

// Formata uma data ISO ou Date para YYYY-MM-DD no fuso horário local do usuário
const toLocalDateKey = (dateInput: string | Date): string => {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const HistoryView: React.FC = () => {
  const { workouts, startWorkout, deleteWorkout, clearWorkouts, settings } = useApp();
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const now = new Date();
  const [viewYear, setViewYear] = useState<number>(() => now.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => now.getMonth());
  const [lastKnownMonthKey, setLastKnownMonthKey] = useState<string>(
    () => `${now.getFullYear()}-${now.getMonth()}`
  );

  // Sempre que o mês virar, troca automaticamente o calendário para o novo mês vigente
  useEffect(() => {
    const checkMonthTurn = () => {
      const current = new Date();
      const currentKey = `${current.getFullYear()}-${current.getMonth()}`;
      if (currentKey !== lastKnownMonthKey) {
        setLastKnownMonthKey(currentKey);
        setViewYear(current.getFullYear());
        setViewMonth(current.getMonth());
      }
    };

    const interval = window.setInterval(checkMonthTurn, 60000);
    window.addEventListener('focus', checkMonthTurn);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', checkMonthTurn);
    };
  }, [lastKnownMonthKey]);

  // Mapa de quantidade de treinos por dia (YYYY-MM-DD local)
  const workoutsByDateMap = useMemo(() => {
    const map: Record<string, number> = {};
    workouts.forEach((w) => {
      const key = toLocalDateKey(w.start_time);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [workouts]);

  // Constrói o calendário completo do mês (do dia 1º até o último dia do mês: 28, 29, 30 ou 31)
  const monthCalendarData = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstDayOfMonth.getDay(); // 0 (Dom) a 6 (Sáb)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate(); // 28, 29, 30 ou 31
    const todayKey = toLocalDateKey(new Date());

    const leadingEmptySlots = Array.from({ length: startWeekday }, (_, idx) => `empty-${idx}`);
    const days: {
      dateKey: string;
      dayNumber: number;
      workoutCount: number;
      isToday: boolean;
    }[] = [];

    let monthTotalWorkouts = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      const dateKey = toLocalDateKey(d);
      const count = workoutsByDateMap[dateKey] || 0;
      monthTotalWorkouts += count;

      days.push({
        dateKey,
        dayNumber: day,
        workoutCount: count,
        isToday: dateKey === todayKey
      });
    }

    return {
      leadingEmptySlots,
      days,
      daysInMonth,
      monthTotalWorkouts
    };
  }, [viewYear, viewMonth, workoutsByDateMap]);

  const isViewingCurrentMonth =
    viewYear === new Date().getFullYear() && viewMonth === new Date().getMonth();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    const current = new Date();
    setViewYear(current.getFullYear());
    setViewMonth(current.getMonth());
  };

  const toggleExpand = (id: string) => {
    setExpandedWorkoutId(expandedWorkoutId === id ? null : id);
  };

  const handleRepeatWorkout = (workout: Workout) => {
    startWorkout(workout.routine_id || undefined, `${workout.title}`);
  };

  return (
    <div className={`flex flex-col min-h-full view-container space-y-5 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
      {/* Topo */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-black ${isLight ? 'text-zinc-900' : 'text-white'}`}>Histórico</h1>
          <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Calendário mensal completo & cargas reais</p>
        </div>

        {workouts.length > 0 &&
          (confirmClearAll ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  clearWorkouts();
                  setConfirmClearAll(false);
                }}
                className="px-2.5 py-1.5 bg-red-600 text-white rounded-xl text-[11px] font-black"
              >
                Confirmar Limpeza
              </button>
              <button
                onClick={() => setConfirmClearAll(false)}
                className="px-2.5 py-1.5 bg-[#18181b] border border-[#27272a] text-zinc-300 rounded-xl text-[11px] font-bold"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClearAll(true)}
              className="px-3 py-1.5 bg-[#141416] hover:bg-[#1e1e24] border border-[#27272a] text-zinc-400 hover:text-red-400 rounded-xl flex items-center gap-1.5 text-xs font-bold transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          ))}
      </div>

      {/* Calendário do Mês Inteiro (Do dia 1º até o último dia do mês no formato oficial) */}
      <div className={`border rounded-2xl p-4 shadow-md space-y-3 ${isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-[#141416] border-[#27272a] text-white'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-white shrink-0" />
            <div>
              <h2 className={`text-sm font-black leading-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {MONTHS_PT[viewMonth]} {viewYear}
              </h2>
              <span className="text-[10px] text-zinc-400 font-semibold block">
                Dia 1 ao dia {monthCalendarData.daysInMonth} •{' '}
                {monthCalendarData.monthTotalWorkouts}{' '}
                {monthCalendarData.monthTotalWorkouts === 1 ? 'treino no mês' : 'treinos no mês'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isViewingCurrentMonth && (
              <button
                type="button"
                onClick={handleResetToCurrentMonth}
                className="px-2 py-1 rounded-lg bg-white text-black text-[10px] font-black mr-1 transition"
              >
                Mês Atual
              </button>
            )}
            <button
              type="button"
              onClick={handlePrevMonth}
              className={`p-1.5 rounded-lg border transition ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700'
                  : 'bg-[#1c1c1f] hover:bg-zinc-800 border-[#27272a] text-zinc-300'
              }`}
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className={`p-1.5 rounded-lg border transition ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700'
                  : 'bg-[#1c1c1f] hover:bg-zinc-800 border-[#27272a] text-zinc-300'
              }`}
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cabeçalho dos Dias da Semana */}
        <div className="grid grid-cols-7 gap-1.5 pt-1 text-center">
          {WEEKDAYS_PT.map((wd) => (
            <span
              key={wd}
              className="text-[10px] font-black uppercase tracking-wider text-zinc-500 py-0.5"
            >
              {wd}
            </span>
          ))}
        </div>

        {/* Grade Oficial do Mês (Dia 1 até o último dia) */}
        <div className="grid grid-cols-7 gap-1.5">
          {monthCalendarData.leadingEmptySlots.map((emptyKey) => (
            <div key={emptyKey} className="aspect-square rounded-lg bg-transparent" />
          ))}

          {monthCalendarData.days.map((d) => {
            const trained = d.workoutCount > 0;
            return (
              <div
                key={d.dateKey}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-black transition relative select-none ${
                  trained
                    ? isLight
                      ? 'bg-black text-white shadow-md'
                      : 'bg-white text-black shadow-md'
                    : d.isToday
                    ? isLight
                      ? 'bg-zinc-100 text-zinc-900 border-2 border-black'
                      : 'bg-[#1c1c1f] text-white border-2 border-white/60'
                    : isLight
                    ? 'bg-zinc-50 text-zinc-600 border border-zinc-200'
                    : 'bg-[#1c1c1f] text-zinc-500 border border-[#27272a]/50'
                }`}
                title={`${d.dateKey}: ${d.workoutCount} ${
                  d.workoutCount === 1 ? 'treino' : 'treinos'
                }`}
              >
                <span>{d.dayNumber}</span>
                {trained && (
                  <span className={`w-1 h-1 rounded-full mt-0.5 ${isLight ? 'bg-white' : 'bg-black'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista Cronológica */}
      <div className="space-y-3">
        <span className="text-xs uppercase text-zinc-400 font-bold block">
          Treinos Concluídos ({workouts.length})
        </span>

        {workouts.length === 0 ? (
          <div className={`border rounded-2xl p-8 text-center space-y-2 ${isLight ? 'bg-white border-zinc-200 text-zinc-500' : 'bg-[#141416] border-[#27272a] text-zinc-500'}`}>
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
                className={`border rounded-2xl p-4 shadow-md flex flex-col gap-3 transition ${isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-[#141416] border-[#27272a] text-white'}`}
              >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => toggleExpand(w.id)}
                  >
                    <h3 className={`text-sm font-bold transition ${isLight ? 'text-zinc-900' : 'text-white'}`}>{w.title}</h3>
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

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWorkout(w.id);
                      }}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                      title="Excluir este treino do histórico"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleExpand(w.id)}
                      className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Métricas Limpas */}
                <div
                  className="flex items-center gap-3 text-xs font-semibold cursor-pointer"
                  onClick={() => toggleExpand(w.id)}
                >
                  <div className="flex items-center gap-1 text-zinc-200 bg-[#18181b] px-2.5 py-1 rounded-lg border border-[#27272a]">
                    <Dumbbell className="w-3.5 h-3.5 text-white" />
                    <span>Carga: {displayWeight(w.total_volume_kg, settings.weight_unit)}</span>
                  </div>
                  <div className="text-zinc-400">
                    <span>
                      {w.total_sets}{' '}
                      {w.total_sets === 1 ? 'série concluída' : 'séries concluídas'}
                    </span>
                  </div>
                  {(w.prs_hit || 0) > 0 && (
                    <div className="flex items-center gap-1 text-white bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-600 text-[10px] font-black">
                      <Flame className="w-3 h-3 fill-white" />
                      <span>{w.prs_hit} PR</span>
                    </div>
                  )}
                </div>

                {/* Resumo direto dos exercícios realizados com a carga exata */}
                {!isExpanded && w.exercises.some((ex) => ex.sets.some((s) => s.completed)) && (
                  <div
                    className="space-y-1 pt-2 border-t border-[#27272a]/60 cursor-pointer"
                    onClick={() => toggleExpand(w.id)}
                  >
                    {w.exercises.map((ex, idx) => {
                      const completedSets = ex.sets.filter((s) => s.completed);
                      if (completedSets.length === 0) return null;
                      const maxW = Math.max(...completedSets.map((s) => Number(s.weight_kg) || 0));
                      const repsExample = completedSets[0]?.reps || 0;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs text-zinc-300"
                        >
                          <span className="truncate pr-2 font-medium">
                            {completedSets.length}× {ex.title}
                          </span>
                          <span className="font-black text-white shrink-0">
                            {displayWeight(maxW, settings.weight_unit)} ({repsExample} reps)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

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
                                  <span className="text-zinc-500 font-semibold">
                                    Série {sIdx + 1}
                                  </span>
                                  <span className="font-black text-white">
                                    {displayWeight(Number(s.weight_kg) || 0, settings.weight_unit)}{' '}
                                    × {s.reps} reps
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
                      className={`w-full py-2.5 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border ${
                        isLight
                          ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200'
                          : 'bg-[#18181b] hover:bg-[#222226] text-white border-[#27272a]'
                      }`}
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
