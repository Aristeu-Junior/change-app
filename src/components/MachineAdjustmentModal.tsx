import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, Check, Trash2, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/calc';

interface MachineAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseTitle: string;
  initialNote?: string;
  onSave: (note: string) => void;
}

const QUICK_CHIP_GROUPS: { label: string; chips: string[] }[] = [
  {
    label: 'Furos & Pinos',
    chips: ['Furo 1', 'Furo 2', 'Furo 3', 'Furo 4', 'Furo 5', 'Furo 6', 'Furo 7', 'Furo 8']
  },
  {
    label: 'Banco & Encosto',
    chips: ['Banco Reto', 'Inclinado 30°', 'Inclinado 45°', '90° Sentado', 'Declinado']
  },
  {
    label: 'Polia & Cabo',
    chips: ['Polia Alta', 'Polia Média', 'Polia Baixa', 'Altura 5', 'Altura 10', 'Altura 15']
  },
  {
    label: 'Apoios & Rolos',
    chips: ['Rolo canela 1', 'Rolo canela 2', 'Rolo canela 3', 'Apoio coxa firme', 'Almofada lombar']
  },
  {
    label: 'Pegada & Pés',
    chips: ['Pegada Neutra', 'Pegada Aberta', 'Pegada Fechada', 'Pés no topo', 'Pés baixos']
  }
];

export const MachineAdjustmentModal: React.FC<MachineAdjustmentModalProps> = ({
  isOpen,
  onClose,
  exerciseTitle,
  initialNote = '',
  onSave
}) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNote(initialNote || '');
    }
  }, [isOpen, initialNote]);

  if (!isOpen) return null;

  const handleToggleChip = (chip: string) => {
    triggerHaptic('light');
    if (!note.trim()) {
      setNote(chip);
      return;
    }

    const parts = note.split(' • ').map((p) => p.trim()).filter(Boolean);
    const existingIndex = parts.findIndex((p) => p.toLowerCase() === chip.toLowerCase());

    if (existingIndex !== -1) {
      // Remove chip se já existir
      parts.splice(existingIndex, 1);
      setNote(parts.join(' • '));
    } else {
      // Adiciona chip formatado
      parts.push(chip);
      setNote(parts.join(' • '));
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerHaptic('success');
    onSave(note.trim());
    onClose();
  };

  const handleClear = () => {
    triggerHaptic('light');
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full sm:max-w-md bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white animate-in slide-in-from-bottom-4 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a] shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white truncate">Regulagem do Aparelho</h3>
              <p className="text-[11px] text-zinc-400 font-semibold truncate">{exerciseTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-0.5">
          {/* Campo de Texto Principal */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1.5 flex items-center justify-between">
              <span>Sua Anotação de Ajuste</span>
              {note && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-zinc-500 hover:text-red-400 text-[10px] flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              )}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Banco no furo 3, rolo da canela no pino 2..."
              className="w-full bg-[#18181b] border border-[#27272a] focus:border-white rounded-2xl p-3 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed transition"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Esta regulagem fica salva automaticamente e aparecerá sempre que você fizer este exercício.
            </p>
          </div>

          {/* Chips Rápidos de Seleção */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Toque para adicionar rapidamente:</span>
            </div>

            {QUICK_CHIP_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  {group.label}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {group.chips.map((chip) => {
                    const isSelected = note
                      .toLowerCase()
                      .includes(chip.toLowerCase());

                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleToggleChip(chip)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition active:scale-95 border ${
                          isSelected
                            ? 'bg-white text-black border-white shadow-sm'
                            : 'bg-[#18181b] text-zinc-400 border-[#27272a] hover:text-white hover:border-zinc-500'
                        }`}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="pt-3 border-t border-[#27272a] flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-zinc-300 font-bold text-xs rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            className="flex-1 py-2.5 bg-white hover:bg-zinc-200 text-black font-black text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Salvar Regulagem</span>
          </button>
        </div>
      </div>
    </div>
  );
};
