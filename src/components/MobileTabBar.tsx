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
      {/* Floating Active Workout Pill (shown when workout is in progress but minimized) */}
      {activeWorkout && !isWorkoutModalOpen && (
        <div className="px-4 pb-2 w-full max-w-md mx-auto pointer-events-auto">
          <button
            onClick={() => setWorkoutModalOpen(true)}
            className="w-full p-3.5 bg-gradient-to-r from-[#008cff] to-[#0060b0] text-white rounded-2xl shadow-xl shadow-[#008cff]/30 flex items-center justify-between active:scale-98 transition group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center animate-pulse">
                <Play className="w-4 h-4 fill-white" />
              </div>
              <div className="text-left">
                <span className="text-xs font-black block line-clamp-1">{activeWorkout.title}</span>
                <span className="text-[11px] text-white/80 flex items-center gap-1 font-semibold">
                  <Clock className="w-3 h-3" />
                  {formatDuration(elapsed)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg">
              <span>Resume</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="w-full bg-[#0b0e14]/95 backdrop-blur-md border-t border-[#242c3d] px-2 py-2 pb-safe pointer-events-auto flex items-center justify-around shadow-2xl">
        <button
          onClick={() => onSelectTab('routines')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            currentTab === 'routines'
              ? 'text-[#008cff]'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Dumbbell className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-bold tracking-tight">Workouts</span>
        </button>

        <button
          onClick={() => onSelectTab('exercises')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            currentTab === 'exercises'
              ? 'text-[#008cff]'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <List className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-bold tracking-tight">Exercises</span>
        </button>

        <button
          onClick={() => onSelectTab('history')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            currentTab === 'history'
              ? 'text-[#008cff]'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <History className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-bold tracking-tight">History</span>
        </button>

        <button
          onClick={() => onSelectTab('analytics')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            currentTab === 'analytics'
              ? 'text-[#008cff]'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <BarChart3 className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-bold tracking-tight">Analytics</span>
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            currentTab === 'settings'
              ? 'text-[#008cff]'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <SettingsIcon className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-bold tracking-tight">Settings</span>
        </button>
      </nav>
    </div>
  );
};
