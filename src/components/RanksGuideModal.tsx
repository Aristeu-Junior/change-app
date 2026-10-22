import React, { useState } from 'react';
import {
  X,
  Shield,
  Trophy,
  Flame,
  Dumbbell,
  TrendingUp,
  Award,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { ALL_RANKS_SHOWCASE, RankTierId } from '../utils/hevyRank';

interface RanksGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore: number;
  currentTierId: RankTierId;
}

export const RanksGuideModal: React.FC<RanksGuideModalProps> = ({
  isOpen,
  onClose,
  currentScore,
  currentTierId
}) => {
  const [activeTab, setActiveTab] = useState<'tiers' | 'xp_rules'>('tiers');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 text-white">
      <div className="w-full max-w-2xl bg-[#121214] border border-[#27272a] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header Fixo */}
        <div className="p-4 sm:p-5 border-b border-[#27272a] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shrink-0 shadow-md">
              <Shield className="w-5 h-5 fill-black/10" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-white truncate">
                Ranks & Patentes do App
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
                Tabela de patentes, progressão de XP e padrões de força
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas Internas: Todas as Patentes | Como Ganhar XP */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-[#27272a]/60 bg-[#141416] shrink-0">
          <div className="grid grid-cols-2 gap-2 bg-[#18181b] p-1 rounded-2xl border border-[#27272a]">
            <button
              onClick={() => setActiveTab('tiers')}
              className={`py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                activeTab === 'tiers'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Todas as 8 Patentes</span>
            </button>
            <button
              onClick={() => setActiveTab('xp_rules')}
              className={`py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                activeTab === 'xp_rules'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Como Ganhar XP</span>
            </button>
          </div>
        </div>

        {/* Conteúdo com Scroll Suave */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* =========================================================
              ABA 1: TODAS AS PATENTES
             ========================================================= */}
          {activeTab === 'tiers' && (
            <div className="space-y-3">
              <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-3.5 flex items-center gap-3">
                <Info className="w-5 h-5 text-zinc-400 shrink-0" />
                <p className="text-xs text-zinc-300 leading-relaxed">
                  As patentes são baseadas em <strong>XP de treino acumulado</strong> e padrões mundiais de carga real. Cada nível conta com subdivisões <strong>I, II e III</strong> para que sua evolução seja contínua.
                </p>
              </div>

              {ALL_RANKS_SHOWCASE.map((tier, idx) => {
                const isCurrent = tier.id === currentTierId;
                const isInverted = tier.id === 'diamond' || tier.id === 'titan';

                return (
                  <div
                    key={tier.id}
                    className={`p-4 rounded-2xl border transition relative overflow-hidden ${
                      isCurrent
                        ? 'bg-[#1c1c1f] border-white shadow-xl'
                        : 'bg-[#141416] border-[#27272a] hover:border-zinc-700'
                    }`}
                  >
                    {/* Badge de Patente Atual */}
                    {isCurrent && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3 h-3 text-black" />
                        <span>Sua Patente Atual ({currentScore} PTS)</span>
                      </div>
                    )}

                    <div className="flex items-start gap-3.5">
                      {/* Emblema Hexagonal */}
                      <div
                        className={`w-12 h-12 rounded-2xl ${tier.badgeStyle.bg} border-2 ${tier.badgeStyle.border} flex flex-col items-center justify-center shrink-0 shadow-md relative mt-0.5`}
                      >
                        <Shield
                          className={`w-6 h-6 ${
                            isInverted ? 'text-black fill-black/15' : 'text-white fill-white/10'
                          }`}
                        />
                        <span
                          className={`text-[8px] font-black leading-none mt-0.5 ${
                            isInverted ? 'text-black' : 'text-white'
                          }`}
                        >
                          #{idx}
                        </span>
                      </div>

                      {/* Informações da Patente */}
                      <div className="flex-1 min-w-0 pr-1 sm:pr-24">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-white">{tier.name}</h3>
                          <span className="px-2 py-0.5 rounded-lg bg-[#18181b] border border-[#27272a] text-[10px] font-bold text-zinc-300">
                            {tier.maxXp ? `${tier.minXp} — ${tier.maxXp} XP` : `${tier.minXp}+ XP`}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-500">
                            {tier.subTiers}
                          </span>
                        </div>

                        <span className="text-[11px] font-semibold text-zinc-400 block mt-0.5">
                          Tempo estimado: <strong className="text-zinc-200">{tier.approxWorkouts}</strong>
                        </span>

                        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                          {tier.description}
                        </p>

                        {/* Cargas de Referência para os Exercícios Principais */}
                        <div className="mt-3 pt-2.5 border-t border-[#27272a]/60">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                            Cargas médias de referência neste nível:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            <div className="bg-[#18181b] border border-[#27272a] p-2 rounded-xl text-center">
                              <span className="text-[9px] text-zinc-400 block">Supino Reto</span>
                              <strong className="text-xs text-white">{tier.examples.supino}</strong>
                            </div>
                            <div className="bg-[#18181b] border border-[#27272a] p-2 rounded-xl text-center">
                              <span className="text-[9px] text-zinc-400 block">Agachamento</span>
                              <strong className="text-xs text-white">{tier.examples.agachamento}</strong>
                            </div>
                            <div className="bg-[#18181b] border border-[#27272a] p-2 rounded-xl text-center">
                              <span className="text-[9px] text-zinc-400 block">Leg Press</span>
                              <strong className="text-xs text-white">{tier.examples.legPress}</strong>
                            </div>
                            <div className="bg-[#18181b] border border-[#27272a] p-2 rounded-xl text-center">
                              <span className="text-[9px] text-zinc-400 block">Isoladores</span>
                              <strong className="text-xs text-white">{tier.examples.rosca}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================
              ABA 2: CRITÉRIOS DE XP (COMO SUBIR DE NÍVEL)
             ========================================================= */}
          {activeTab === 'xp_rules' && (
            <div className="space-y-4">
              <div className="bg-[#141416] border border-[#27272a] rounded-2xl p-4 space-y-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Como seus Pontos de Rank são Calculados</span>
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  O sistema de patentes do Change premia a sua <strong>consistência</strong> e a <strong>sobrecarga progressiva</strong> a longo prazo. Quanto mais assíduo e firme nos treinos você for, mais alto você sobe no ranking e nas competições entre amigos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Treino Concluído */}
                <div className="p-4 rounded-2xl bg-[#141416] border border-[#27272a] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black">
                      <Flame className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-black text-white">+80 XP</span>
                  </div>
                  <h4 className="text-xs font-black text-white">Treino Concluído</h4>
                  <p className="text-[11px] text-zinc-400">
                    Cada sessão de treino salva e finalizada adiciona 80 pontos direto à sua patente.
                  </p>
                </div>

                {/* 2. Séries Concluídas */}
                <div className="p-4 rounded-2xl bg-[#141416] border border-[#27272a] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#18181b] border border-[#27272a] text-white flex items-center justify-center font-black">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-black text-white">+4 XP / série</span>
                  </div>
                  <h4 className="text-xs font-black text-white">Séries Realizadas</h4>
                  <p className="text-[11px] text-zinc-400">
                    Cada série válida e marcada como concluída adiciona 4 pontos de esforço ao seu score.
                  </p>
                </div>

                {/* 3. Volume Levantado */}
                <div className="p-4 rounded-2xl bg-[#141416] border border-[#27272a] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#18181b] border border-[#27272a] text-white flex items-center justify-center font-black">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-black text-white">+1 XP / 250 kg</span>
                  </div>
                  <h4 className="text-xs font-black text-white">Tonelagem de Carga</h4>
                  <p className="text-[11px] text-zinc-400">
                    O volume total levantado no treino rende pontos adicionais (ex: 5.000 kg no treino = +20 XP).
                  </p>
                </div>

                {/* 4. Recordes Pessoais */}
                <div className="p-4 rounded-2xl bg-[#141416] border border-[#27272a] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#18181b] border border-[#27272a] text-white flex items-center justify-center font-black">
                      <Award className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-black text-white">+15 a +360 XP</span>
                  </div>
                  <h4 className="text-xs font-black text-white">Recordes Pessoais (PR)</h4>
                  <p className="text-[11px] text-zinc-400">
                    Bater um PR de peso rende bônus de prestígio proporcional à patente atingida no exercício.
                  </p>
                </div>

                {/* 5. Consistência Semanal GymRats */}
                <div className="p-4 rounded-2xl bg-[#141416] border border-[#27272a] space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">Bônus de Consistência Semanal</h4>
                        <span className="text-[10px] text-zinc-400">Estilo GymRats Streak</span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-white">+50 XP ativo</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Atletas que completam <strong>3 ou mais treinos nos últimos 7 dias</strong> recebem um bônus ativo de 50 pontos adicionais no ranking da semana!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer com Botão de Fechar */}
        <div className="p-4 border-t border-[#27272a] bg-[#141416] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs transition active:scale-95 shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
