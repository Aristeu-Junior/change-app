import React, { useRef, useState } from 'react';
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
  ShieldCheck
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
    isCurrentUserAdmin
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

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

  return (
    <div className="flex flex-col min-h-full view-container space-y-5 text-white">
      {/* Topo */}
      <div>
        <h1 className="text-2xl font-black text-white">Ajustes</h1>
        <p className="text-xs text-zinc-400">Conta, tema & preferências de treino</p>
      </div>

      {/* CONTA DO ATLETA E GESTÃO DE CONVIDADOS */}
      <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-zinc-400 block">
            Minha Conta Exclusiva
          </span>
          {isCurrentUserAdmin && (
            <span className="px-2 py-0.5 rounded bg-white text-black text-[9px] font-black uppercase">
              Admin
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white text-black font-black flex items-center justify-center text-sm shadow-md shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-sm font-black text-white block truncate">{currentUser.name}</span>
              <span className="text-xs text-zinc-400 block truncate">{currentUser.email}</span>
            </div>
          </div>

          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm shrink-0"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isCurrentUserAdmin ? 'Cadastrar / Minha Conta' : 'Minha Conta'}</span>
          </button>
        </div>
      </div>

      {/* TEMA PRETO E BRANCO & BRANCO E PRETO */}
      <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md space-y-3">
        <span className="text-xs uppercase font-bold text-zinc-400 block">Tema Visual Exclusivo</span>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-white block">Modo de Exibição</span>
            <span className="text-xs text-zinc-500">
              {theme === 'dark' ? 'Preto e Branco (Modo Escuro)' : 'Branco e Preto (Modo Claro)'}
            </span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-3 bg-white text-black rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 fill-black" />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 fill-black" />
                <span>Modo Escuro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* UNIDADES DE MEDIDA */}
      <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md space-y-4">
        <span className="text-xs uppercase font-bold text-zinc-400 block">Unidades de Treino</span>

        {/* Peso */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-white block">Unidade de Peso</span>
            <span className="text-xs text-zinc-500">Utilizada nas anilhas, barras e PRs</span>
          </div>
          <div className="flex bg-[#1c1c1f] p-1 rounded-xl border border-[#27272a]">
            <button
              onClick={() => updateSettings({ weight_unit: 'kg' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                settings.weight_unit === 'kg'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              KG
            </button>
            <button
              onClick={() => updateSettings({ weight_unit: 'lbs' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                settings.weight_unit === 'lbs'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              LBS
            </button>
          </div>
        </div>

        {/* Distância */}
        <div className="flex items-center justify-between pt-2 border-t border-[#27272a]">
          <div>
            <span className="text-sm font-bold text-white block">Unidade de Distância</span>
            <span className="text-xs text-zinc-500">Para exercícios aeróbicos e corrida</span>
          </div>
          <div className="flex bg-[#1c1c1f] p-1 rounded-xl border border-[#27272a]">
            <button
              onClick={() => updateSettings({ distance_unit: 'quilometros' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                settings.distance_unit === 'quilometros'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              KM
            </button>
            <button
              onClick={() => updateSettings({ distance_unit: 'milhas' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                settings.distance_unit === 'milhas'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              MILHAS
            </button>
          </div>
        </div>
      </div>

      {/* TEMPORIZADOR E ERGONOMIA */}
      <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md space-y-4">
        <span className="text-xs uppercase font-bold text-zinc-400 block">Experiência na Academia</span>

        {/* Duração Padrão do Descanso */}
        <div>
          <span className="text-sm font-bold text-white block">Tempo Padrão de Descanso</span>
          <span className="text-xs text-zinc-500 mb-2 block">
            Dispara automaticamente ao concluir uma série
          </span>
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {[30, 60, 90, 120, 180].map((sec) => (
              <button
                key={sec}
                onClick={() => updateSettings({ default_rest_seconds: sec })}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  settings.default_rest_seconds === sec
                    ? 'bg-white text-black shadow-sm'
                    : 'bg-[#1c1c1f] text-zinc-400 hover:text-white border border-[#27272a]'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Efeitos Sonoros */}
        <div className="flex items-center justify-between pt-2 border-t border-[#27272a]">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-white" />
            <div>
              <span className="text-sm font-bold text-white block">Efeitos Sonoros</span>
              <span className="text-xs text-zinc-500">Bips e sino ao término do descanso</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => playGymTone('complete')}
              className="text-[10px] font-bold text-white bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700"
            >
              Testar
            </button>
            <input
              type="checkbox"
              checked={settings.sound_enabled}
              onChange={(e) => updateSettings({ sound_enabled: e.target.checked })}
              className="w-5 h-5 accent-white rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Vibração Tátil */}
        <div className="flex items-center justify-between pt-2 border-t border-[#27272a]">
          <div className="flex items-center gap-2">
            <Vibrate className="w-4 h-4 text-white" />
            <div>
              <span className="text-sm font-bold text-white block">Vibração no Celular</span>
              <span className="text-xs text-zinc-500">Feedback tátil ao marcar série</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerHaptic('success')}
              className="text-[10px] font-bold text-white bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700"
            >
              Testar
            </button>
            <input
              type="checkbox"
              checked={settings.haptics_enabled}
              onChange={(e) => updateSettings({ haptics_enabled: e.target.checked })}
              className="w-5 h-5 accent-white rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Manter Tela Ligada */}
        <div className="flex items-center justify-between pt-2 border-t border-[#27272a]">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-white" />
            <div>
              <span className="text-sm font-bold text-white block">Manter Tela Ligada</span>
              <span className="text-xs text-zinc-500">Não desliga a tela durante o treino</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.wake_lock_enabled}
            onChange={(e) => updateSettings({ wake_lock_enabled: e.target.checked })}
            className="w-5 h-5 accent-white rounded cursor-pointer"
          />
        </div>
      </div>

      {/* BACKUP E EXPORTAÇÃO */}
      <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-zinc-400 block">Soberania dos Seus Dados</span>
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Seus treinos, rotinas e recordes são seus. Você pode exportar seu backup em JSON ou restaurar quando quiser.
        </p>

        {importStatus && (
          <div className="p-2.5 bg-zinc-800 border border-white/40 rounded-xl text-xs font-bold text-white flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 py-3 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            Exportar JSON
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-3 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition active:scale-95"
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
      <div className="pt-2 pb-6 flex flex-col items-center justify-center text-center space-y-1 text-zinc-500">
        <div className="flex items-center gap-1.5 font-black text-sm tracking-widest text-white">
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
