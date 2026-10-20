import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  List,
  History,
  Trophy,
  User,
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
  const { activeWorkout, isWorkoutModalOpen, setWorkoutModalOpen, theme } = useApp();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeWorkout) return;
    const start = new Date(activeWorkout.start_time).getTime();
    const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [activeWorkout]);

  const isLight = theme === 'light';

  const tabClass = (tab: TabType) => {
    const isActive = currentTab === tab;
    if (isActive) {
      return isLight ? 'text-black font-extrabold scale-105' : 'text-white font-extrabold scale-105';
    }
    return isLight ? 'text-zinc-400 hover:text-zinc-600' : 'text-zinc-500 hover:text-zinc-300';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex flex-col pointer-events-none">
      {/* Pílula Flutuante de Treino Ativo (quando minimizado) */}
      {activeWorkout && !isWorkoutModalOpen && (
        <div className="px-4 pb-2 w-full max-w-md mx-auto pointer-events-auto animate-in slide-in-from-bottom duration-150">
          <button
            onClick={() => setWorkoutModalOpen(true)}
            className={`w-full p-3.5 ${
              isLight ? 'bg-black text-white' : 'bg-white text-black'
            } rounded-2xl shadow-2xl flex items-center justify-between active:scale-98 transition group border border-zinc-200/20`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl ${
                  isLight ? 'bg-white text-black' : 'bg-black text-white'
                } flex items-center justify-center animate-pulse`}
              >
                <Play className={`w-4 h-4 ${isLight ? 'fill-black' : 'fill-white'}`} />
              </div>
              <div className="text-left">
                <span className="text-xs font-black block line-clamp-1">{activeWorkout.title}</span>
                <span
                  className={`text-[10px] ${
                    isLight ? 'text-zinc-300' : 'text-zinc-600'
                  } flex items-center gap-1 font-bold`}
                >
                  <Clock className="w-3 h-3" />
                  {formatDuration(elapsed)}
                </span>
              </div>
            </div>

            <div
              className={`flex items-center gap-1 text-xs font-extrabold ${
                isLight ? 'bg-white text-black' : 'bg-black text-white'
              } px-3 py-1.5 rounded-lg shadow-sm`}
            >
              <span>Continuar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* Barra de Navegação Inferior Intuitiva */}
      <nav
        className={`w-full ${
          isLight ? 'bg-white/95 border-zinc-200' : 'bg-[#000000]/95 border-[#27272a]'
        } backdrop-blur-md border-t px-2 py-2 pb-safe pointer-events-auto flex items-center justify-around shadow-2xl transition-colors`}
      >
        {/* Aba Planos de Treino */}
        <button
          onClick={() => onSelectTab('routines')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${tabClass('routines')}`}
        >
          <Dumbbell className="w-5 h-5 stroke-[2.3]" />
          <span className="text-[10px] tracking-tight">Planos</span>
          {currentTab === 'routines' && (
            <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-black' : 'bg-white'}`} />
          )}
        </button>

        {/* Aba Exercícios */}
        <button
          onClick={() => onSelectTab('exercises')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${tabClass('exercises')}`}
        >
          <List className="w-5 h-5 stroke-[2.3]" />
          <span className="text-[10px] tracking-tight">Exercícios</span>
          {currentTab === 'exercises' && (
            <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-black' : 'bg-white'}`} />
          )}
        </button>

        {/* Aba Histórico */}
        <button
          onClick={() => onSelectTab('history')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${tabClass('history')}`}
        >
          <History className="w-5 h-5 stroke-[2.3]" />
          <span className="text-[10px] tracking-tight">Histórico</span>
          {currentTab === 'history' && (
            <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-black' : 'bg-white'}`} />
          )}
        </button>

        {/* Aba Rank & Estatísticas (Estilo Hevy) */}
        <button
          onClick={() => onSelectTab('analytics')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${tabClass('analytics')}`}
        >
          <Trophy className="w-5 h-5 stroke-[2.3]" />
          <span className="text-[10px] tracking-tight">Rank</span>
          {currentTab === 'analytics' && (
            <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-black' : 'bg-white'}`} />
          )}
        </button>

        {/* Aba Perfil & Ajustes */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${tabClass('settings')}`}
        >
          <User className="w-5 h-5 stroke-[2.3]" />
          <span className="text-[10px] tracking-tight">Perfil</span>
          {currentTab === 'settings' && (
            <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-black' : 'bg-white'}`} />
          )}
        </button>
      </nav>
    </div>
  );
};
