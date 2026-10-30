import React, { useRef, useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Users,
  Volume2,
  Vibrate,
  Eye,
  Download,
  Upload,
  Check,
  ShieldCheck,
  Scale,
  Droplets,
  Play,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playGymTone, triggerHaptic } from '../../utils/calc';
import { UserAccountModal } from '../UserAccountModal';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDataJson,
    importDataJson,
    theme,
    toggleTheme,
    currentUser,
    users,
    isCurrentUserAdmin,
    adminTogglePhysioAccess,
    waterTrackerConfig,
    updateWaterGoal,
    measurements,
    saveMeasurement
  } = useApp();

  const isLight = theme === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Estado local para Altura e Peso
  const latestWeight =
    measurements.length > 0 && measurements[0].weight_kg
      ? measurements[0].weight_kg
      : settings.body_weight_kg || null;

  const [heightInput, setHeightInput] = useState<string>(
    settings.height_cm ? String(settings.height_cm) : ''
  );
  const [weightInput, setWeightInput] = useState<string>(
    latestWeight ? String(latestWeight) : ''
  );
  const [waterGoalInput, setWaterGoalInput] = useState<string>(
    String(waterTrackerConfig.daily_goal_ml || 2500)
  );

  useEffect(() => {
    if (settings.height_cm) setHeightInput(String(settings.height_cm));
  }, [settings.height_cm]);

  useEffect(() => {
    if (latestWeight) setWeightInput(String(latestWeight));
  }, [latestWeight]);

  useEffect(() => {
    if (waterTrackerConfig.daily_goal_ml) {
      setWaterGoalInput(String(waterTrackerConfig.daily_goal_ml));
    }
  }, [waterTrackerConfig.daily_goal_ml]);

  // Cálculo da recomendação atlética: 35 ml por kg
  const numericWeight = parseFloat(weightInput.replace(',', '.'));
  const calculatedWaterRec =
    !isNaN(numericWeight) && numericWeight > 30 ? Math.round(numericWeight * 35) : 0;

  const handleHeightChange = (val: string) => {
    setHeightInput(val);
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num) && num > 50 && num < 260) {
      updateSettings({ height_cm: Math.round(num) });
    }
  };

  const handleWeightChange = (val: string) => {
    setWeightInput(val);
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num) && num > 20 && num < 350) {
      const cleanWeight = Math.round(num * 10) / 10;
      updateSettings({ body_weight_kg: cleanWeight });

      // Salva no histórico de medições para acompanhar progresso corporal
      saveMeasurement({
        date: new Date().toISOString().split('T')[0],
        weight_kg: cleanWeight
      });
    }
  };

  const handleApplyCalculatedGoal = () => {
    if (calculatedWaterRec > 0) {
      setWaterGoalInput(String(calculatedWaterRec));
      updateWaterGoal(calculatedWaterRec);
      playGymTone('water');
      triggerHaptic(15);
    }
  };

  const handleWaterGoalChange = (val: string) => {
    setWaterGoalInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 500 && num <= 10000) {
      updateWaterGoal(num);
    }
  };

  const handleExport = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-treinos-change-${currentUser.name.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJson(content);
      if (success) {
        setImportStatus('Dados restaurados com sucesso!');
      } else {
        setImportStatus('Falha ao processar arquivo de backup.');
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  const cardStyle = `rounded-2xl p-4 transition-colors ${
    isLight
      ? 'bg-white border border-zinc-200 text-zinc-900 shadow-sm'
      : 'bg-[#141416] border border-[#27272a] text-white shadow-md'
  }`;

  const titleStyle = `text-sm font-bold block ${isLight ? 'text-zinc-900' : 'text-white'}`;
  const subStyle = `text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`;

  return (
    <div className={`flex flex-col min-h-full view-container space-y-5 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
      {/* Topo */}
      <div>
        <h1 className={`text-2xl font-black ${isLight ? 'text-zinc-900' : 'text-white'}`}>Ajustes</h1>
        <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Conta, tema, métricas & preferências de treino
        </p>
      </div>

      {/* CONTA DO ATLETA E GESTÃO DE CONVIDADOS */}
      <div className={cardStyle}>
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-xs uppercase font-bold text-zinc-400 block">
            Minha Conta Exclusiva
          </span>
          {isCurrentUserAdmin && (
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
              isLight ? 'bg-black text-white' : 'bg-white text-black'
            }`}>
              Admin
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full font-black flex items-center justify-center text-sm shadow-md shrink-0 ${
              isLight ? 'bg-black text-white' : 'bg-white text-black'
            }`}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className={`text-sm font-black block truncate ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {currentUser.name}
              </span>
              <span className={`text-xs block truncate ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {currentUser.email}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAccountModalOpen(true)}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm shrink-0 active:scale-95 ${
              isLight
                ? 'bg-black hover:bg-zinc-800 text-white'
                : 'bg-white hover:bg-zinc-200 text-black'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isCurrentUserAdmin ? 'Cadastrar / Minha Conta' : 'Minha Conta'}</span>
          </button>
        </div>
      </div>

      {/* SEÇÃO DO ADMINISTRADOR: LIBERAÇÃO DA ÁREA DE FISIOTERAPIA */}
      {isCurrentUserAdmin && (
        <div className={`${cardStyle} space-y-3.5 border-emerald-500/20`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Activity className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs uppercase font-black text-white block">
                  Liberação da Área de Fisioterapia
                </span>
                <span className="text-[10px] text-zinc-400 block font-semibold">
                  Aba 100% oculta para usuários comuns. Apenas o administrador libera o acesso.
                </span>
              </div>
            </div>
            <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              Admin Only
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {users
              .filter(
                (u) =>
                  u.email !== 'aristeu2304@gmail.com' &&
                  u.email !== 'aristeu@change.app' &&
                  u.id !== 'user-aristeu'
              )
              .map((u) => {
                const hasAccess = !!u.has_physio_access;
                return (
                  <div
                    key={u.id}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isLight
                        ? 'bg-zinc-50 border-zinc-200'
                        : 'bg-[#18181b] border-[#27272a]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white truncate">{u.name}</span>
                        {hasAccess ? (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                            Liberada ✓
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            Oculta
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 truncate block">{u.email}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => adminTogglePhysioAccess(u.email, !hasAccess)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 border flex items-center gap-1.5 ${
                        hasAccess
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-sm'
                          : 'bg-[#27272a] hover:bg-zinc-700 text-zinc-300 border-zinc-600'
                      }`}
                    >
                      <Activity className="w-3 h-3" />
                      <span>{hasAccess ? 'Acesso Ativo' : 'Liberar Acesso'}</span>
                    </button>
                  </div>
                );
              })}

            {users.filter(
              (u) =>
                u.email !== 'aristeu2304@gmail.com' &&
                u.email !== 'aristeu@change.app' &&
                u.id !== 'user-aristeu'
            ).length === 0 && (
              <p className="text-xs text-zinc-500 italic py-1">
                Nenhum usuário convidado cadastrado no momento. Ao cadastrar um amigo, você poderá liberar a fisioterapia para ele aqui.
              </p>
            )}
          </div>
        </div>
      )}

      {/* MÉTRICAS CORPORAIS & HIDRATAÇÃO */}
      <div className={`${cardStyle} space-y-4`}>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-zinc-400 block">
            Métricas Corporais & Hidratação
          </span>
          <Scale className={`w-4 h-4 ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`} />
        </div>

        {/* Altura e Peso em 2 Colunas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={`text-xs font-bold block ${isLight ? 'text-zinc-800' : 'text-white'}`}>
              Sua Altura
            </label>
            <div className="relative">
              <input
                type="number"
                min="100"
                max="250"
                step="1"
                placeholder="Ex: 178"
                value={heightInput}
                onChange={(e) => handleHeightChange(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white ${
                  isLight
                    ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
                    : 'bg-[#1c1c1f] border-[#27272a] text-white placeholder-zinc-500'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-zinc-400 pointer-events-none">
                cm
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`text-xs font-bold block ${isLight ? 'text-zinc-800' : 'text-white'}`}>
              Seu Peso Corporal
            </label>
            <div className="relative">
              <input
                type="number"
                min="30"
                max="300"
                step="0.5"
                placeholder="Ex: 75.0"
                value={weightInput}
                onChange={(e) => handleWeightChange(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white ${
                  isLight
                    ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
                    : 'bg-[#1c1c1f] border-[#27272a] text-white placeholder-zinc-500'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-zinc-400 pointer-events-none">
                kg
              </span>
            </div>
          </div>
        </div>

        {/* Card de Cálculo Automático 35ml/kg */}
        {calculatedWaterRec > 0 && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
              isLight
                ? 'bg-sky-50/80 border-sky-200/80 text-sky-950'
                : 'bg-sky-950/30 border-sky-900/50 text-sky-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                isLight ? 'bg-sky-200 text-sky-800' : 'bg-sky-900/60 text-sky-400'
              }`}>
                <Droplets className="w-4 h-4 fill-current" />
              </div>
              <div className="min-w-0">
                <span className="font-black block leading-tight truncate">
                  Meta Recomendada: {calculatedWaterRec.toLocaleString('pt-BR')} ml / dia
                </span>
                <span className={`text-[10px] block leading-tight ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
                  35 ml/kg esportivo para seu peso ({weightInput} kg)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyCalculatedGoal}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black shrink-0 transition active:scale-95 shadow-sm ${
                isLight
                  ? 'bg-black text-white hover:bg-zinc-800'
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              Aplicar Meta
            </button>
          </div>
        )}

        {/* Ajuste Manual da Meta Diária */}
        <div className={`pt-3 border-t space-y-2.5 ${isLight ? 'border-zinc-200' : 'border-[#27272a]'}`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className={titleStyle}>Meta Diária de Hidratação</span>
              <span className={subStyle}>
                Limite personalizado para atingir 100% no dia
              </span>
            </div>
            <div className="relative w-28 shrink-0">
              <input
                type="number"
                min="500"
                max="8000"
                step="50"
                value={waterGoalInput}
                onChange={(e) => handleWaterGoalChange(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-black text-right pr-7 transition focus:outline-none ${
                  isLight
                    ? 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    : 'bg-[#1c1c1f] border-[#27272a] text-white'
                }`}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 pointer-events-none">
                ml
              </span>
            </div>
          </div>

          {/* Atalhos Rápidos de Volume */}
          <div className="grid grid-cols-4 gap-1.5">
            {[2000, 2500, 3000, 3500].map((amount) => {
              const isSelected = (waterTrackerConfig.daily_goal_ml || 2500) === amount;
              return (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleWaterGoalChange(String(amount))}
                  className={`py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                    isSelected
                      ? isLight
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-white text-black shadow-sm'
                      : isLight
                      ? 'bg-zinc-100 text-zinc-600 hover:text-black border border-zinc-200'
                      : 'bg-[#1c1c1f] text-zinc-400 hover:text-white border border-[#27272a]'
                  }`}
                >
                  {amount} ml
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TEMA PRETO E BRANCO & BRANCO E PRETO */}
      <div className={cardStyle}>
        <span className="text-xs uppercase font-bold text-zinc-400 block mb-3">Tema Visual Exclusivo</span>
        <div className="flex items-center justify-between">
          <div>
            <span className={titleStyle}>Modo de Exibição</span>
            <span className={subStyle}>
              {theme === 'dark' ? 'Preto e Branco (Modo Escuro)' : 'Branco e Preto (Modo Claro)'}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className={`p-3 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition ${
              isLight
                ? 'bg-black text-white hover:bg-zinc-800'
                : 'bg-white text-black hover:bg-zinc-200'
            }`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 fill-black" />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 fill-white" />
                <span>Modo Escuro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* UNIDADES DE MEDIDA */}
      <div className={`${cardStyle} space-y-4`}>
        <span className="text-xs uppercase font-bold text-zinc-400 block">Unidades de Treino</span>

        {/* Peso */}
        <div className="flex items-center justify-between">
          <div>
            <span className={titleStyle}>Unidade de Peso</span>
            <span className={subStyle}>Utilizada nas anilhas, barras e PRs</span>
          </div>
          <div className={`flex p-1 rounded-xl border ${
            isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-[#1c1c1f] border-[#27272a]'
          }`}>
            <button
              type="button"
              onClick={() => updateSettings({ weight_unit: 'kg' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                settings.weight_unit === 'kg'
                  ? isLight
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-white text-black shadow-sm'
                  : isLight
                  ? 'text-zinc-600 hover:text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              KG
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ weight_unit: 'lbs' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                settings.weight_unit === 'lbs'
                  ? isLight
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-white text-black shadow-sm'
                  : isLight
                  ? 'text-zinc-600 hover:text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              LBS
            </button>
          </div>
        </div>

        {/* Distância */}
        <div className={`flex items-center justify-between pt-2 border-t ${isLight ? 'border-zinc-200' : 'border-[#27272a]'}`}>
          <div>
            <span className={titleStyle}>Unidade de Distância</span>
            <span className={subStyle}>Para exercícios aeróbicos e corrida</span>
          </div>
          <div className={`flex p-1 rounded-xl border ${
            isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-[#1c1c1f] border-[#27272a]'
          }`}>
            <button
              type="button"
              onClick={() => updateSettings({ distance_unit: 'quilometros' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                settings.distance_unit === 'quilometros'
                  ? isLight
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-white text-black shadow-sm'
                  : isLight
                  ? 'text-zinc-600 hover:text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              KM
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ distance_unit: 'milhas' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                settings.distance_unit === 'milhas'
                  ? isLight
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-white text-black shadow-sm'
                  : isLight
                  ? 'text-zinc-600 hover:text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              MILHAS
            </button>
          </div>
        </div>
      </div>

      {/* TEMPORIZADOR E ERGONOMIA */}
      <div className={`${cardStyle} space-y-4`}>
        <span className="text-xs uppercase font-bold text-zinc-400 block">Experiência na Academia</span>

        {/* Duração Padrão do Descanso */}
        <div>
          <span className={titleStyle}>Tempo Padrão de Descanso</span>
          <span className={`${subStyle} mb-2 block`}>
            Dispara automaticamente ao concluir uma série
          </span>
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {[30, 60, 90, 120, 180].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => updateSettings({ default_rest_seconds: sec })}
                className={`py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                  settings.default_rest_seconds === sec
                    ? isLight
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-white text-black shadow-sm'
                    : isLight
                    ? 'bg-zinc-100 text-zinc-600 hover:text-black border border-zinc-200'
                    : 'bg-[#1c1c1f] text-zinc-400 hover:text-white border border-[#27272a]'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Efeitos Sonoros */}
        <div className={`flex items-center justify-between pt-2 border-t ${isLight ? 'border-zinc-200' : 'border-[#27272a]'}`}>
          <div className="flex items-center gap-2">
            <Volume2 className={`w-4 h-4 ${isLight ? 'text-zinc-900' : 'text-white'}`} />
            <div>
              <span className={titleStyle}>Efeitos Sonoros</span>
              <span className={subStyle}>Sinos de término e bips da academia</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => playGymTone('complete')}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition active:scale-95 ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700'
              }`}
              title="Testar som de descanso"
            >
              Testar Sino
            </button>
            <button
              type="button"
              onClick={() => playGymTone('water')}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition active:scale-95 ${
                isLight
                  ? 'bg-sky-100 hover:bg-sky-200 text-sky-900 border-sky-300'
                  : 'bg-sky-950/80 hover:bg-sky-900 text-sky-300 border-sky-800'
              }`}
              title="Testar som de hidratação"
            >
              Testar Água
            </button>
            <input
              type="checkbox"
              checked={settings.sound_enabled}
              onChange={(e) => updateSettings({ sound_enabled: e.target.checked })}
              className="w-5 h-5 accent-black dark:accent-white rounded cursor-pointer ml-1"
            />
          </div>
        </div>

        {/* Vibração Tátil */}
        <div className={`flex items-center justify-between pt-2 border-t ${isLight ? 'border-zinc-200' : 'border-[#27272a]'}`}>
          <div className="flex items-center gap-2">
            <Vibrate className={`w-4 h-4 ${isLight ? 'text-zinc-900' : 'text-white'}`} />
            <div>
              <span className={titleStyle}>Vibração no Celular</span>
              <span className={subStyle}>Feedback tátil ao marcar série</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => triggerHaptic('success')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition active:scale-95 ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700'
              }`}
            >
              Testar
            </button>
            <input
              type="checkbox"
              checked={settings.haptics_enabled}
              onChange={(e) => updateSettings({ haptics_enabled: e.target.checked })}
              className="w-5 h-5 accent-black dark:accent-white rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Manter Tela Ligada */}
        <div className={`flex items-center justify-between pt-2 border-t ${isLight ? 'border-zinc-200' : 'border-[#27272a]'}`}>
          <div className="flex items-center gap-2">
            <Eye className={`w-4 h-4 ${isLight ? 'text-zinc-900' : 'text-white'}`} />
            <div>
              <span className={titleStyle}>Manter Tela Ligada</span>
              <span className={subStyle}>Não desliga a tela durante o treino</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.wake_lock_enabled}
            onChange={(e) => updateSettings({ wake_lock_enabled: e.target.checked })}
            className="w-5 h-5 accent-black dark:accent-white rounded cursor-pointer"
          />
        </div>
      </div>

      {/* BACKUP E EXPORTAÇÃO */}
      <div className={`${cardStyle} space-y-4`}>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-zinc-400 block">Soberania dos Seus Dados</span>
          <ShieldCheck className={`w-4 h-4 ${isLight ? 'text-zinc-700' : 'text-white'}`} />
        </div>

        <p className={`text-xs leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
          Seus treinos, rotinas e recordes são seus. Você pode exportar seu backup em JSON ou restaurar quando quiser.
        </p>

        {importStatus && (
          <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
            isLight
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-zinc-800 border border-white/40 text-white'
          }`}>
            <Check className="w-4 h-4" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 border ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200 shadow-sm'
                : 'bg-[#18181b] hover:bg-[#222226] text-white border-[#27272a]'
            }`}
          >
            <Download className="w-4 h-4" />
            Exportar JSON
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 border ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200 shadow-sm'
                : 'bg-[#18181b] hover:bg-[#222226] text-white border-[#27272a]'
            }`}
          >
            <Upload className="w-4 h-4" />
            Restaurar JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Rodapé com Logo e Informações do Change */}
      <div className={`pt-2 pb-6 flex flex-col items-center justify-center text-center space-y-1 ${
        isLight ? 'text-zinc-400' : 'text-zinc-500'
      }`}>
        <div className={`flex items-center gap-1.5 font-black text-sm tracking-widest ${
          isLight ? 'text-zinc-900' : 'text-white'
        }`}>
          <span>CHANGE</span>
        </div>
        <p className="text-[10px]">Plataforma de Treinamento & Performance</p>
      </div>

      {/* Modal de Gestão de Usuários */}
      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </div>
  );
};
