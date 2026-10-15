import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  List,
  History,
  BarChart3,
  Settings as SettingsIcon,
  Clock,
  ChevronRight,
  Play
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDuration } from '../utils/calc';

export type TabType = 'routines' | 'exercises' | 'history' | 'analytics' | 'settings';

interface MobileTabBarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ currentTab, onSelectTab }) => {
  const { activeWorkout, isWorkoutModalOpen, setWorkoutModalOpen } = useApp();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeWorkout) return;
    const start = new Date(activeWorkout.start_time).getTime();
    const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [activeWorkout]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex flex-col pointer-events-none">
      {/* Pílula Flutuante de Treino Ativo (quando minimizado) */}
      {activeWorkout && !isWorkoutModalOpen && (
        <div className="px-4 pb-2 w-full max-w-md mx-auto pointer-events-auto animate-in slide-in-from-bottom duration-150">
          <button
            onClick={() => setWorkoutModalOpen(true)}
            className="w-full p-3.5 bg-white text-black rounded-2xl shadow-2xl flex items-center justify-between active:scale-98 transition group border border-zinc-200"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center animate-pulse">
                <Play className="w-4 h-4 fill-white" />
              </div>
              <div className="text-left">
                <span className="text-xs font-black block line-clamp-1">{activeWorkout.title}</span>
                <span className="text-[10px] text-zinc-600 flex items-center gap-1 font-bold">
                  <Clock className="w-3 h-3" />
                  {formatDuration(elapsed)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-extrabold bg-black text-white px-3 py-1.5 rounded-lg shadow-sm">
              <span>Continuar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* Barra de Navegação Inferior */}
      <nav className="w-full bg-[#0b0b0d]/95 backdrop-blur-md border-t border-[#27272a] px-2 py-2 pb-safe pointer-events-auto flex items-center justify-around shadow-2xl">
        <button
          onClick={() => onSelectTab('routines')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            currentTab === 'routines'
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Dumbbell className="w-5 h-5 stroke-[2.3]" />
          <span className="text-[10px] font-bold tracking-tight">Treinos</span>
        </button>

        <button
          onClick={() => onSelectTab('exercises')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            currentTab === 'exercises'
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <List className="w-5 h-5 stroke-[2.3]" />
          <span className="text-[10px] font-bold tracking-tight">Exercícios</span>
        </button>

        <button
          onClick={() => onSelectTab('history')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            currentTab === 'history'
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <History className="w-5 h-5 stroke-[2.3]" />
          <span className="text-[10px] font-bold tracking-tight">Histórico</span>
        </button>

        <button
          onClick={() => onSelectTab('analytics')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            currentTab === 'analytics'
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <BarChart3 className="w-5 h-5 stroke-[2.3]" />
          <span className="text-[10px] font-bold tracking-tight">Estatísticas</span>
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            currentTab === 'settings'
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <SettingsIcon className="w-5 h-5 stroke-[2.3]" />
          <span className="text-[10px] font-bold tracking-tight">Ajustes</span>
        </button>
      </nav>
    </div>
  );
};
