import React, { useState, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileTabBar, TabType } from './components/MobileTabBar';
import { AuthLoginScreen } from './components/AuthLoginScreen';

// Code-splitting de alta performance: carrega cada aba sob demanda
const RoutinesView = lazy(() => import('./components/views/RoutinesView').then(m => ({ default: m.RoutinesView })));
const ExercisesView = lazy(() => import('./components/views/ExercisesView').then(m => ({ default: m.ExercisesView })));
const HistoryView = lazy(() => import('./components/views/HistoryView').then(m => ({ default: m.HistoryView })));
const AnalyticsView = lazy(() => import('./components/views/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const SettingsView = lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));
const ActiveWorkoutModal = lazy(() => import('./components/ActiveWorkoutModal').then(m => ({ default: m.ActiveWorkoutModal })));
const WorkoutSummaryModal = lazy(() => import('./components/WorkoutSummaryModal').then(m => ({ default: m.WorkoutSummaryModal })));

const ViewLoadingFallback: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] space-y-3">
    <div className="w-7 h-7 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Carregando...</span>
  </div>
);

const AppContent: React.FC = () => {
  const { theme, isAuthenticated } = useApp();
  const [currentTab, setCurrentTab] = useState<TabType>('routines');

  // Exige autenticação na tela de login estilo Hevy antes de exibir os treinos
  if (!isAuthenticated) {
    return <AuthLoginScreen />;
  }

  const isLight = theme === 'light';

  return (
    <div className={`w-full min-h-screen ${isLight ? 'bg-[#f4f4f5] text-black' : 'bg-black text-white'} flex justify-center transition-colors duration-200`}>
      {/* Mobile Frame Container (Max 480px width on desktop with clean borders, full width on mobile) */}
      <div className={`w-full max-w-md min-h-screen ${isLight ? 'bg-white border-zinc-200' : 'bg-black border-[#27272a]/60'} border-x flex flex-col relative shadow-2xl transition-colors duration-200`}>
        {/* Main View Area */}
        <main className="flex-1 overflow-x-hidden">
          <Suspense fallback={<ViewLoadingFallback />}>
            {currentTab === 'routines' && <RoutinesView />}
            {currentTab === 'exercises' && <ExercisesView />}
            {currentTab === 'history' && <HistoryView />}
            {currentTab === 'analytics' && <AnalyticsView />}
            {currentTab === 'settings' && <SettingsView />}
          </Suspense>
        </main>

        {/* Bottom Tab Bar with Active Floating Workout Pill */}
        <MobileTabBar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Live Active Workout Screen (Fullscreen Modal) */}
        <Suspense fallback={null}>
          <ActiveWorkoutModal />
          <WorkoutSummaryModal />
        </Suspense>
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
