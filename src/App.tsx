import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileTabBar, TabType } from './components/MobileTabBar';
import { RoutinesView } from './components/views/RoutinesView';
import { ExercisesView } from './components/views/ExercisesView';
import { HistoryView } from './components/views/HistoryView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';
import { ActiveWorkoutModal } from './components/ActiveWorkoutModal';
import { WorkoutSummaryModal } from './components/WorkoutSummaryModal';

const AppContent: React.FC = () => {
  const { theme } = useApp();
  const [currentTab, setCurrentTab] = useState<TabType>('routines');

  const isLight = theme === 'light';

  return (
    <div className={`w-full min-h-screen ${isLight ? 'bg-[#f4f4f5] text-black' : 'bg-black text-white'} flex justify-center transition-colors duration-200`}>
      {/* Mobile Frame Container (Max 480px width on desktop with clean borders, full width on mobile) */}
      <div className={`w-full max-w-md min-h-screen ${isLight ? 'bg-white border-zinc-200' : 'bg-black border-[#27272a]/60'} border-x flex flex-col relative shadow-2xl transition-colors duration-200`}>
        {/* Main View Area */}
        <main className="flex-1 overflow-x-hidden">
          {currentTab === 'routines' && <RoutinesView />}
          {currentTab === 'exercises' && <ExercisesView />}
          {currentTab === 'history' && <HistoryView />}
          {currentTab === 'analytics' && <AnalyticsView />}
          {currentTab === 'settings' && <SettingsView />}
        </main>

        {/* Bottom Tab Bar with Active Floating Workout Pill */}
        <MobileTabBar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Live Active Workout Screen (Fullscreen Modal) */}
        <ActiveWorkoutModal />

        {/* Post-Workout Summary / Celebration Modal */}
        <WorkoutSummaryModal />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
