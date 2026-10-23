import React, { useState } from 'react';
import {
  Droplets,
  Droplet,
  Plus,
  Trash2,
  X,
  Bell,
  BellOff,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  Scale,
  Calendar,
  ChevronRight,
  Flame,
  Apple
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { triggerHaptic } from '../utils/calc';

interface WaterTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WaterTrackerModal: React.FC<WaterTrackerModalProps> = ({ isOpen, onClose }) => {
  const {
    theme,
    todayWaterIntake,
    todayWaterProgressPercent,
    todayWaterLogs,
    waterTrackerConfig,
    waterRhythmStatus,
    addWaterLog,
    removeWaterLog,
    updateWaterGoal,
    updateWaterTrackerConfig,
    measurements
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tracker' | 'settings'>('tracker');
  const [customMlInput, setCustomMlInput] = useState<string>('');
  const [editingGoalInput, setEditingGoalInput] = useState<string>('');
  const [isCustomGoalOpen, setIsCustomGoalOpen] = useState(false);
  const [weightCalcInput, setWeightCalcInput] = useState<string>('');
  const [notificationPermissionState, setNotificationPermissionState] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  if (!isOpen) return null;

  const isLight = theme === 'light';
  const goalMl = waterTrackerConfig.daily_goal_ml || 2500;
  const remainingMl = Math.max(0, goalMl - todayWaterIntake);

  // Pega o peso corporal mais recente registrado pelo usuário
  const latestWeight = measurements.length > 0 && measurements[0].weight_kg ? measurements[0].weight_kg : null;

  const handleQuickAdd = (amount: number) => {
    triggerHaptic(15);
    addWaterLog(amount);
  };

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMlInput, 10);
    if (!isNaN(val) && val > 0 && val <= 3000) {
      addWaterLog(val);
      setCustomMlInput('');
    }
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(editingGoalInput, 10);
    if (!isNaN(val) && val >= 500 && val <= 10000) {
      updateWaterGoal(val);
      setIsCustomGoalOpen(false);
      setEditingGoalInput('');
    }
  };

  const handleCalculateFromWeight = () => {
    const weight = parseFloat(weightCalcInput) || latestWeight;
    if (weight && weight > 20 && weight < 300) {
      // 35 ml por kg é o padrão médico esportivo recomendado pela OMS / ACSM
      const calculatedGoal = Math.round((weight * 35) / 50) * 50;
      updateWaterGoal(calculatedGoal);
      triggerHaptic(15);
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermissionState(perm);
        if (perm === 'granted') {
          updateWaterTrackerConfig({ reminders_enabled: true });
          triggerHaptic(20);
        }
      } catch {
        // Fallback
      }
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl border shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88dvh] overflow-hidden ${
          isLight
            ? 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-900/10'
            : 'bg-[#0e0f12] border-zinc-800 text-white shadow-black/80'
        }`}
      >
        {/* Barra superior de arrasto (mobile) e cabeçalho */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
          <div className={`w-10 h-1 rounded-full ${isLight ? 'bg-zinc-300' : 'bg-zinc-700'}`} />
        </div>

        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-800/80'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl font-black flex items-center justify-center shadow-md border shrink-0 ${
              isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-zinc-300'
            }`}>
              <Droplet className={`w-5 h-5 stroke-[2.4] ${isLight ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <h2 className={`text-base font-black tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                Hidratação & Água Diária
              </h2>
              <p className={`text-[11px] font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {waterRhythmStatus.label}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 ${
              isLight ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700' : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
            }`}
            aria-label="Fechar modal de água"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas: Registro Rápido vs Ajustes & Lembretes */}
        <div className={`flex border-b px-5 pt-2 gap-4 ${isLight ? 'border-zinc-200 bg-zinc-50/50' : 'border-zinc-800/60 bg-zinc-950/30'}`}>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`pb-2.5 text-xs font-black tracking-tight flex items-center gap-1.5 transition border-b-2 ${
              activeTab === 'tracker'
                ? isLight
                  ? 'border-black text-black'
                  : 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Consumo Diário</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 text-xs font-black tracking-tight flex items-center gap-1.5 transition border-b-2 ${
              activeTab === 'settings'
                ? isLight
                  ? 'border-black text-black'
                  : 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Meta & Lembretes</span>
          </button>
        </div>

        {/* Conteúdo Rolável */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {activeTab === 'tracker' ? (
            <>
              {/* Card Principal de Progresso & Indicador Circular/Onda */}
              <div
                className={`relative overflow-hidden p-5 rounded-2xl border transition-all ${
                  isLight
                    ? 'bg-gradient-to-br from-sky-50/70 via-white to-zinc-50 border-sky-200/70 shadow-sm'
                    : 'bg-gradient-to-br from-sky-950/30 via-[#12141a] to-[#0c0d10] border-sky-900/40 shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-500 block mb-1">
                      Meta de Hoje
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-3xl sm:text-4xl font-black tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                        {todayWaterIntake.toLocaleString('pt-BR')}
                      </span>
                      <span className={`text-sm font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        / {goalMl.toLocaleString('pt-BR')} ml
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          todayWaterIntake >= goalMl
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        }`}
                      >
                        {todayWaterIntake >= goalMl ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Meta Batida!
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-3 h-3 text-sky-400" />
                            Faltam {remainingMl.toLocaleString('pt-BR')} ml
                          </>
                        )}
                      </span>
                      <span className={`text-[11px] font-bold ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {todayWaterProgressPercent}% concluído
                      </span>
                    </div>
                  </div>

                  {/* Mostrador Circular SVG */}
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke={isLight ? '#e2e8f0' : '#1e293b'}
                        strokeWidth="3.5"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="3.5"
                        strokeDasharray={94.2}
                        strokeDashoffset={94.2 - (94.2 * Math.min(100, todayWaterProgressPercent)) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-500 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Droplets className="w-4 h-4 text-sky-500 fill-sky-500 animate-pulse" />
                      <span className={`text-[10px] font-black ${isLight ? 'text-zinc-800' : 'text-white'}`}>
                        {todayWaterProgressPercent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barra contínua de enchimento */}
                <div className="mt-4 w-full h-2 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${Math.min(100, todayWaterProgressPercent)}%` }}
                  />
                </div>
              </div>

              {/* Botões de Registro Rápido */}
              <div className="space-y-2">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider block ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Registrar Copo ou Garrafa
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleQuickAdd(200)}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 active:scale-95 transition group ${
                      isLight
                        ? 'bg-white hover:bg-sky-50/50 border-zinc-200 text-zinc-900 shadow-sm'
                        : 'bg-[#14151a] hover:bg-zinc-800/80 border-zinc-800 text-white shadow-md'
                    }`}
                  >
                    <span className="text-base font-black group-hover:scale-110 transition">+200 ml</span>
                    <span className={`text-[10px] font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      Copo americano
                    </span>
                  </button>

                  <button
                    onClick={() => handleQuickAdd(300)}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 active:scale-95 transition group ${
                      isLight
                        ? 'bg-white hover:bg-sky-50/50 border-zinc-200 text-zinc-900 shadow-sm'
                        : 'bg-[#14151a] hover:bg-zinc-800/80 border-zinc-800 text-white shadow-md'
                    }`}
                  >
                    <span className="text-base font-black group-hover:scale-110 transition">+300 ml</span>
                    <span className={`text-[10px] font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      Copo grande
                    </span>
                  </button>

                  <button
                    onClick={() => handleQuickAdd(500)}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 active:scale-95 transition group ${
                      isLight
                        ? 'bg-white hover:bg-sky-50/50 border-zinc-200 text-zinc-900 shadow-sm'
                        : 'bg-[#14151a] hover:bg-zinc-800/80 border-zinc-800 text-white shadow-md'
                    }`}
                  >
                    <span className="text-base font-black group-hover:scale-110 transition">+500 ml</span>
                    <span className={`text-[10px] font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      Garrafinha
                    </span>
                  </button>

                  <button
                    onClick={() => handleQuickAdd(750)}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 active:scale-95 transition group ${
                      isLight
                        ? 'bg-white hover:bg-sky-50/50 border-zinc-200 text-zinc-900 shadow-sm'
                        : 'bg-[#14151a] hover:bg-zinc-800/80 border-zinc-800 text-white shadow-md'
                    }`}
                  >
                    <span className="text-base font-black group-hover:scale-110 transition">+750 ml</span>
                    <span className={`text-[10px] font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      Shaker / Garrafa G
                    </span>
                  </button>
                </div>

                {/* Registro Personalizado de Quantidade */}
                <form onSubmit={handleCustomAdd} className="flex gap-2 pt-1">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="10"
                      max="3000"
                      step="10"
                      value={customMlInput}
                      onChange={(e) => setCustomMlInput(e.target.value)}
                      placeholder="Outro volume (ex: 350 ml)"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
                          : 'bg-[#14151a] border-zinc-800 text-white placeholder-zinc-500'
                      }`}
                    />
                    <span className={`absolute right-3.5 top-2.5 text-[10px] font-extrabold ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      ml
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!customMlInput || parseInt(customMlInput, 10) <= 0}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wide uppercase transition active:scale-95 shrink-0 ${
                      isLight
                        ? 'bg-black text-white hover:bg-zinc-800 disabled:opacity-40'
                        : 'bg-white text-black hover:bg-zinc-200 disabled:opacity-40'
                    }`}
                  >
                    Adicionar
                  </button>
                </form>
              </div>

              {/* Histórico de Registros de Hoje */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Linha do Tempo Hoje ({todayWaterLogs.length})
                  </span>
                  {todayWaterLogs.length > 0 && (
                    <span className={`text-[10px] font-bold ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Total: {todayWaterIntake} ml
                    </span>
                  )}
                </div>

                {todayWaterLogs.length === 0 ? (
                  <div
                    className={`p-6 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 ${
                      isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-500' : 'bg-[#14151a] border-zinc-800/80 text-zinc-400'
                    }`}
                  >
                    <Droplets className="w-6 h-6 stroke-1 text-sky-500/70" />
                    <p className="text-xs font-bold">Nenhum copo registrado hoje ainda</p>
                    <p className="text-[10px] text-zinc-500">Toque em qualquer botão acima para registrar seu primeiro copo d'água!</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {todayWaterLogs.map((entry) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                          isLight
                            ? 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-900'
                            : 'bg-[#121317] hover:bg-zinc-800/60 border-zinc-800 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                            isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-950 text-sky-400'
                          }`}>
                            <Droplets className="w-3.5 h-3.5 fill-current" />
                          </div>
                          <div>
                            <span className="text-xs font-black block">+{entry.amount_ml} ml</span>
                            <span className={`text-[10px] font-semibold flex items-center gap-1 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              <Clock className="w-2.5 h-2.5" />
                              {formatTime(entry.timestamp)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => removeWaterLog(entry.id)}
                          className={`p-1.5 rounded-lg transition active:scale-95 ${
                            isLight ? 'hover:bg-zinc-100 text-zinc-400 hover:text-red-600' : 'hover:bg-zinc-800 text-zinc-500 hover:text-red-400'
                          }`}
                          title="Remover este registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Aba de Ajustes & Lembretes */}
              <div className="space-y-4">
                {/* Ajuste de Meta Diária */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#121317] border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-xs font-black ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                        Meta Diária de Consumo
                      </h3>
                      <p className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        Atual: <strong className="font-black text-sky-500">{goalMl} ml</strong> por dia
                      </p>
                    </div>

                    <button
                      onClick={() => setIsCustomGoalOpen(!isCustomGoalOpen)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                        isLight ? 'border-zinc-300 text-zinc-800 hover:bg-zinc-100' : 'border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      {isCustomGoalOpen ? 'Fechar' : 'Alterar'}
                    </button>
                  </div>

                  {/* Metas Predefinidas */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2000, 2500, 3000, 3500].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          updateWaterGoal(preset);
                          triggerHaptic(12);
                        }}
                        className={`py-1.5 rounded-xl text-[11px] font-black border transition active:scale-95 ${
                          goalMl === preset
                            ? isLight
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-black border-white'
                            : isLight
                            ? 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                        }`}
                      >
                        {(preset / 1000).toFixed(1)} L
                      </button>
                    ))}
                  </div>

                  {/* Formulário de Meta Personalizada */}
                  {isCustomGoalOpen && (
                    <form onSubmit={handleSaveGoal} className="flex gap-2 pt-2">
                      <input
                        type="number"
                        min="500"
                        max="10000"
                        step="100"
                        value={editingGoalInput}
                        onChange={(e) => setEditingGoalInput(e.target.value)}
                        placeholder={`Ex: ${goalMl} ml`}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${
                          isLight ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-zinc-900 border-zinc-700 text-white'
                        }`}
                      />
                      <button
                        type="submit"
                        className={`px-3 py-2 rounded-xl text-xs font-black uppercase shrink-0 ${
                          isLight ? 'bg-black text-white' : 'bg-white text-black'
                        }`}
                      >
                        Salvar
                      </button>
                    </form>
                  )}

                  {/* Calculadora por Peso Corporal (35ml/kg) */}
                  <div className={`mt-2 pt-3 border-t flex flex-col gap-2 ${isLight ? 'border-zinc-200' : 'border-zinc-800/80'}`}>
                    <div className="flex items-center gap-1.5 text-xs font-extrabold">
                      <Scale className="w-3.5 h-3.5 text-sky-500" />
                      <span>Calcular pela sua massa corporal</span>
                    </div>
                    <p className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      Fórmula médica oficial recomendada para atletas: <strong>35 ml de água</strong> por cada 1 kg de peso.
                    </p>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder={latestWeight ? `${latestWeight} kg` : 'Seu peso (ex: 75 kg)'}
                        value={weightCalcInput}
                        onChange={(e) => setWeightCalcInput(e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold ${
                          isLight ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-zinc-900 border-zinc-700 text-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleCalculateFromWeight}
                        className={`px-3 py-2 rounded-xl text-xs font-extrabold uppercase shrink-0 ${
                          isLight ? 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300' : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                        }`}
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Configuração de Lembretes Inteligentes */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#121317] border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        waterTrackerConfig.reminders_enabled ? 'bg-sky-500/20 text-sky-400' : 'bg-zinc-700/30 text-zinc-500'
                      }`}>
                        {waterTrackerConfig.reminders_enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className={`text-xs font-black ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                          Lembretes de Hidratação
                        </h3>
                        <p className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          Avisos sonoros e notificações discretas no aparelho
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        triggerHaptic(12);
                        if (!waterTrackerConfig.reminders_enabled && notificationPermissionState !== 'granted') {
                          handleRequestNotificationPermission();
                        } else {
                          updateWaterTrackerConfig({ reminders_enabled: !waterTrackerConfig.reminders_enabled });
                        }
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                        waterTrackerConfig.reminders_enabled
                          ? isLight ? 'bg-black' : 'bg-white'
                          : isLight ? 'bg-zinc-300' : 'bg-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full transition-transform ${
                          waterTrackerConfig.reminders_enabled
                            ? isLight ? 'translate-x-6 bg-white' : 'translate-x-6 bg-black'
                            : isLight ? 'translate-x-0 bg-white' : 'translate-x-0 bg-zinc-400'
                        }`}
                      />
                    </button>
                  </div>

                  {waterTrackerConfig.reminders_enabled && (
                    <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>Frequência do lembrete:</span>
                        <div className="flex gap-1.5">
                          {[60, 90, 120].map((mins) => (
                            <button
                              key={mins}
                              onClick={() => {
                                updateWaterTrackerConfig({ reminder_interval_minutes: mins });
                                triggerHaptic(10);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition ${
                                (waterTrackerConfig.reminder_interval_minutes || 90) === mins
                                  ? isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-white'
                                  : isLight ? 'bg-white text-zinc-700 border-zinc-200' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                              }`}
                            >
                              {mins} min
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500">
                        <span>Horário ativo:</span>
                        <span>08:00 às 22:00</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Banner de Expansão Futura de Nutrição e Dieta */}
                <div
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                    isLight ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                  }`}
                >
                  <Apple className="w-6 h-6 shrink-0 text-emerald-500" />
                  <div>
                    <span className="text-[11px] font-black block leading-tight">
                      Módulo de Nutrição & Dieta em Breve
                    </span>
                    <span className="text-[10px] opacity-80 block mt-0.5 leading-tight">
                      Estruturado para receber contagem de macros (proteínas, carboidratos, calorias e refeições) integrado ao CHANGE.
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className={`p-4 border-t flex items-center justify-between ${isLight ? 'border-zinc-200 bg-zinc-50/80' : 'border-zinc-800 bg-zinc-950/60'}`}>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>Sincronizado na Nuvem</span>
          </div>

          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 ${
              isLight ? 'bg-black text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-200'
            }`}
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
