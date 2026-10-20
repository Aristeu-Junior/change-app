import React, { useState, useRef, useEffect } from 'react';
import { X, Share2, Download, Copy, Check, Trophy, Flame } from 'lucide-react';
import { RankInfo } from '../utils/hevyRank';

export interface CompetitorSummary {
  name: string;
  rankLabel: string;
  score: number;
  workoutsCount: number;
  weeklyWorkouts: number;
}

interface ShareRankModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteName: string;
  rankInfo: RankInfo;
  position: number;
  totalAthletes: number;
  workoutsCount: number;
  weeklyWorkouts: number;
  totalSets: number;
  bestPrText: string;
  competitors: CompetitorSummary[];
}

export const ShareRankModal: React.FC<ShareRankModalProps> = ({
  isOpen,
  onClose,
  athleteName,
  rankInfo,
  position,
  totalAthletes,
  workoutsCount,
  weeklyWorkouts,
  totalSets,
  bestPrText,
  competitors
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Desenha o Card Oficial 1080x1350 estilo GymRats / Hevy em P&B
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    // Fundo Preto Absoluto
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, W, H);

    // Moldura Externa
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // Cabeçalho CHANGE CLUB
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(90, 90, 74, 74);
    ctx.fillStyle = '#000000';
    ctx.font = '900 42px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('C', 127, 142);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 44px Inter, system-ui, sans-serif';
    ctx.fillText('CHANGE', 185, 134);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '700 22px Inter, system-ui, sans-serif';
    ctx.fillText('RANK & CHECK-IN OFICIAL', 185, 165);

    // Selo de Posição no Topo Direito
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(W - 310, 90, 220, 74);
    ctx.fillStyle = '#000000';
    ctx.font = '900 32px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`#${position} DO RANK`, W - 200, 138);

    // Bloco Principal do Atleta & Patente
    ctx.textAlign = 'left';
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '800 26px Inter, system-ui, sans-serif';
    ctx.fillText('ATLETA', 90, 260);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 72px Inter, system-ui, sans-serif';
    ctx.fillText(athleteName.toUpperCase(), 90, 335);

    // Caixa da Patente Hevy
    ctx.fillStyle = '#141416';
    ctx.fillRect(90, 380, W - 180, 220);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(90, 380, W - 180, 220);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '800 24px Inter, system-ui, sans-serif';
    ctx.fillText('PATENTE ATUAL DE FORÇA', 130, 435);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 68px Inter, system-ui, sans-serif';
    ctx.fillText(rankInfo.fullLabel.toUpperCase(), 130, 515);

    ctx.fillStyle = '#d4d4d8';
    ctx.font = '700 28px Inter, system-ui, sans-serif';
    ctx.fillText(`${rankInfo.score} PONTOS DE RANK • PROGRESSO ${rankInfo.progressPercent}%`, 130, 565);

    // Métricas da Semana & Carreira (3 Colunas)
    const boxY = 640;
    const boxW = (W - 220) / 3;
    const boxH = 190;

    const stats = [
      { label: 'NA SEMANA', value: `${weeklyWorkouts}x`, sub: 'Check-ins' },
      { label: 'TREINOS TOTAIS', value: `${workoutsCount}`, sub: 'Concluídos' },
      { label: 'SÉRIES VÁLIDAS', value: `${totalSets}`, sub: 'Executadas' }
    ];

    stats.forEach((st, idx) => {
      const x = 90 + idx * (boxW + 20);
      ctx.fillStyle = '#141416';
      ctx.fillRect(x, boxY, boxW, boxH);
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, boxY, boxW, boxH);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '800 20px Inter, system-ui, sans-serif';
      ctx.fillText(st.label, x + 28, boxY + 45);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 56px Inter, system-ui, sans-serif';
      ctx.fillText(st.value, x + 28, boxY + 115);

      ctx.fillStyle = '#71717a';
      ctx.font = '700 22px Inter, system-ui, sans-serif';
      ctx.fillText(st.sub, x + 28, boxY + 155);
    });

    // Destaque de Recorde Pessoal
    ctx.fillStyle = '#141416';
    ctx.fillRect(90, 865, W - 180, 110);
    ctx.strokeStyle = '#27272a';
    ctx.strokeRect(90, 865, W - 180, 110);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '800 20px Inter, system-ui, sans-serif';
    ctx.fillText('MAIOR CARGA REGISTRADA (PR)', 125, 905);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px Inter, system-ui, sans-serif';
    ctx.fillText(bestPrText.slice(0, 42), 125, 950);

    // Mini Placar da Competição (Top 3 Amigos)
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '800 22px Inter, system-ui, sans-serif';
    ctx.fillText('PLACAR DA TURMA (TOP ATLETAS)', 90, 1030);

    competitors.slice(0, 3).forEach((comp, idx) => {
      const rowY = 1055 + idx * 62;
      ctx.fillStyle = idx === 0 ? '#ffffff' : '#18181b';
      ctx.fillRect(90, rowY, W - 180, 52);

      ctx.fillStyle = idx === 0 ? '#000000' : '#ffffff';
      ctx.font = '900 24px Inter, system-ui, sans-serif';
      ctx.fillText(`${idx + 1}º  ${comp.name.toUpperCase()}`, 115, rowY + 34);

      ctx.textAlign = 'right';
      ctx.font = '800 22px Inter, system-ui, sans-serif';
      ctx.fillText(
        `${comp.rankLabel} • ${comp.score} PTS (${comp.weeklyWorkouts}x sem)`,
        W - 115,
        rowY + 34
      );
      ctx.textAlign = 'left';
    });

    // Rodapé
    ctx.fillStyle = '#71717a';
    ctx.font = '700 20px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `CHANGE • COMPETIÇÃO ENTRE ${totalAthletes} ATLETAS • ${new Date().toLocaleDateString('pt-BR')}`,
      W / 2,
      H - 65
    );
  }, [
    isOpen,
    athleteName,
    rankInfo,
    position,
    totalAthletes,
    workoutsCount,
    weeklyWorkouts,
    totalSets,
    bestPrText,
    competitors
  ]);

  if (!isOpen) return null;

  // Gera texto de desafio estilo GymRats para colar no grupo do WhatsApp
  const buildChallengeText = () => {
    const podiumLines = competitors
      .slice(0, 5)
      .map((c, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`;
        return `${medal} *${c.name}* — ${c.rankLabel} (${c.score} PTS | ${c.weeklyWorkouts}x na semana)`;
      })
      .join('\n');

    return (
      `🔥 *CHANGE • RANK & CHECK-IN DA TURMA* 🔥\n\n` +
      `👤 Atleta: *${athleteName}*\n` +
      `🛡️ Patente: *${rankInfo.fullLabel}* (${rankInfo.score} PTS)\n` +
      `🏆 Posição: *#${position} do Ranking*\n` +
      `⚡ Semana: *${weeklyWorkouts} treinos concluídos*\n` +
      `💪 Destaque PR: *${bestPrText}*\n\n` +
      `📊 *PLACAR ATUAL DO GRUPO:*\n${podiumLines}\n\n` +
      `Quem vai buscar o #1 essa semana? 🚀`
    );
  };

  const handleCopyChallengeText = async () => {
    try {
      await navigator.clipboard.writeText(buildChallengeText());
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch {
      // Ignore
    }
  };

  const handleDownloadCard = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `change-rank-${athleteName.toLowerCase()}-${new Date().toISOString().split('T')[0]}.png`;
    a.click();
  };

  const handleNativeShare = async () => {
    if (!canvasRef.current) return;
    setIsSharing(true);
    try {
      const blob: Blob | null = await new Promise((resolve) =>
        canvasRef.current!.toBlob((b) => resolve(b), 'image/png')
      );
      const text = buildChallengeText();

      if (blob && navigator.share) {
        const file = new File([blob], `change-rank-${athleteName.toLowerCase()}.png`, {
          type: 'image/png'
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Rank Change - ${athleteName}`,
            text,
            files: [file]
          });
          setIsSharing(false);
          return;
        }
        await navigator.share({
          title: `Rank Change - ${athleteName}`,
          text
        });
        setIsSharing(false);
        return;
      }
      handleDownloadCard();
    } catch {
      // Cancelado pelo usuário
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col modal-safe-sheet text-white overflow-y-auto space-y-4">
        {/* Topo */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-sm font-black text-white">Compartilhar Rank & Check-in</h3>
              <p className="text-[11px] text-zinc-400">
                Gere competição enviando seu card ou placar para os amigos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pré-visualização do Card Oficial gerado em Canvas */}
        <div className="w-full bg-black rounded-2xl border border-[#27272a] p-2 flex items-center justify-center overflow-hidden shadow-inner">
          <canvas
            ref={canvasRef}
            className="w-full max-w-[290px] h-auto rounded-xl border border-zinc-800 shadow-2xl"
          />
        </div>

        {/* Botões de Compartilhamento Rápido (WhatsApp / Stories / Download) */}
        <div className="space-y-2">
          <button
            onClick={handleNativeShare}
            disabled={isSharing}
            className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
          >
            <Share2 className="w-4 h-4" />
            <span>{isSharing ? 'Abrindo Compartilhamento...' : 'Compartilhar Card (WhatsApp / Stories)'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyChallengeText}
              className="py-2.5 px-3 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Placar Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Placar Texto</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadCard}
              className="py-2.5 px-3 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Imagem</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
