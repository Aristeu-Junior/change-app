import React, { useState } from 'react';
import { X, Plus, Minus, Disc } from 'lucide-react';
import { calculatePlates } from '../utils/calc';

interface PlateCalculatorModalProps {
  initialWeight: number;
  isOpen: boolean;
  onClose: () => void;
  weightUnit: 'kg' | 'lbs';
}

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  initialWeight,
  isOpen,
  onClose,
  weightUnit
}) => {
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight > 0 ? initialWeight : 60);
  const [barWeight, setBarWeight] = useState<number>(20);

  if (!isOpen) return null;

  const result = calculatePlates(targetWeight, barWeight);

  const adjustWeight = (amount: number) => {
    setTargetWeight((prev) => Math.max(barWeight, Math.round((prev + amount) * 10) / 10));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 text-white">
      <div className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white text-black rounded-xl">
              <Disc className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Calculadora de Anilhas</h2>
              <p className="text-xs text-zinc-400">Anilhas de cada lado da barra</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Carga Alvo & Ajustes Rápidos */}
        <div className="flex flex-col items-center bg-[#18181b] p-4 rounded-2xl border border-[#27272a]">
          <span className="text-xs uppercase tracking-wider text-zinc-400 font-bold mb-1">
            Carga Total Alvo
          </span>
          <div className="flex items-center gap-4 my-2">
            <button
              onClick={() => adjustWeight(-5)}
              className="w-10 h-10 rounded-full bg-[#27272a] text-white flex items-center justify-center active:scale-95 transition hover:bg-zinc-700"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">{targetWeight}</span>
              <span className="text-base font-extrabold text-zinc-300">{weightUnit}</span>
            </div>
            <button
              onClick={() => adjustWeight(5)}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition hover:bg-zinc-200 shadow-md"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          <div className="flex gap-2 mt-2">
            {[-10, -2.5, 2.5, 10].map((step) => (
              <button
                key={step}
                onClick={() => adjustWeight(step)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#27272a] text-zinc-300 hover:text-white hover:bg-zinc-700 active:scale-95 transition"
              >
                {step > 0 ? `+${step}` : step} {weightUnit}
              </button>
            ))}
          </div>
        </div>

        {/* Visual da Barra */}
        <div className="bg-[#0b0b0d] p-4 rounded-2xl border border-[#27272a] flex flex-col items-center gap-3">
          <div className="w-full flex items-center justify-center h-28 relative overflow-x-auto px-4">
            <div className="w-7 h-12 bg-zinc-600 rounded-sm mr-1 flex items-center justify-center text-[9px] text-white font-black">
              BARRA
            </div>
            <div className="h-4 w-4 bg-zinc-500"></div>

            <div className="flex items-center gap-1">
              {result.plates.length === 0 ? (
                <span className="text-xs text-zinc-500 italic">Apenas a barra</span>
              ) : (
                result.plates.map((p, idx) =>
                  Array.from({ length: p.countPerSide }).map((_, cIdx) => {
                    const heightPercent = Math.max(35, Math.min(100, (p.plateWeight / 25) * 100));
                    return (
                      <div
                        key={`${idx}-${cIdx}`}
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: p.color
                        }}
                        className={`w-6 rounded-md flex flex-col items-center justify-center font-black text-[10px] shadow-md border border-white/20 ${
                          p.color === '#f8fafc' || p.color === '#eab308' ? 'text-black' : 'text-white'
                        }`}
                      >
                        <span>{p.plateWeight}</span>
                      </div>
                    );
                  })
                )
              )}
            </div>

            <div className="h-3 w-8 bg-zinc-400 rounded-r-md"></div>
          </div>

          <div className="w-full flex justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
            <span>
              Barra: <strong className="text-white">{barWeight} {weightUnit}</strong>
            </span>
            <span>
              Por Lado: <strong className="text-white">{result.weightPerSide} {weightUnit}</strong>
            </span>
          </div>
        </div>

        {/* Lista de Anilhas por Lado */}
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-wider text-zinc-400 font-bold">
            Anilhas a Colocar (De Cada Lado)
          </span>
          {result.plates.length === 0 ? (
            <p className="text-xs text-zinc-500">Basta erguer a barra vazia ({barWeight} {weightUnit})</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {result.plates.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181b] border border-[#27272a]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: p.color }}
                      className="w-4 h-4 rounded-full border border-white/40"
                    />
                    <span className="text-xs font-bold text-white">
                      {p.plateWeight} {weightUnit}
                    </span>
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white text-black shadow-sm">
                    × {p.countPerSide}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl active:scale-98 transition shadow-lg"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
