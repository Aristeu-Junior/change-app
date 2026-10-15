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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#131720] border border-[#242c3d] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242c3d]">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#008cff]/10 rounded-xl text-[#008cff]">
              <Disc className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Plate Calculator</h2>
              <p className="text-xs text-slate-400">Plates needed per side</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Weight Display & Stepper */}
        <div className="flex flex-col items-center bg-[#1a202c] p-4 rounded-2xl border border-[#242c3d]">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-1">
            Total Target Weight
          </span>
          <div className="flex items-center gap-4 my-2">
            <button
              onClick={() => adjustWeight(-5)}
              className="w-10 h-10 rounded-full bg-[#242c3d] text-white flex items-center justify-center active:scale-95 transition hover:bg-slate-700"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">{targetWeight}</span>
              <span className="text-base font-semibold text-[#008cff]">{weightUnit}</span>
            </div>
            <button
              onClick={() => adjustWeight(5)}
              className="w-10 h-10 rounded-full bg-[#008cff] text-white flex items-center justify-center active:scale-95 transition hover:bg-[#0077db]"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Step Buttons */}
          <div className="flex gap-2 mt-2">
            {[-10, -2.5, 2.5, 10].map((step) => (
              <button
                key={step}
                onClick={() => adjustWeight(step)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#242c3d] text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition"
              >
                {step > 0 ? `+${step}` : step} {weightUnit}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Barbell Representation */}
        <div className="bg-[#0b0e14] p-4 rounded-2xl border border-[#242c3d] flex flex-col items-center gap-3">
          <div className="w-full flex items-center justify-center h-28 relative overflow-x-auto px-4">
            {/* Left Collar */}
            <div className="w-6 h-12 bg-slate-600 rounded-sm mr-1 flex items-center justify-center text-[9px] text-white font-bold">
              BAR
            </div>
            {/* Bar Sleeve */}
            <div className="h-4 w-4 bg-slate-500"></div>

            {/* Plates stacked on side */}
            <div className="flex items-center gap-1">
              {result.plates.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No plates (Bar only)</span>
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
                        className={`w-6 rounded-md flex flex-col items-center justify-center font-bold text-[10px] shadow-md border border-white/20 ${
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

            {/* Outer Bar Tip */}
            <div className="h-3 w-8 bg-slate-400 rounded-r-md"></div>
          </div>

          <div className="w-full flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>
              Bar: <strong className="text-white">{barWeight} {weightUnit}</strong>
            </span>
            <span>
              Per Side: <strong className="text-[#008cff]">{result.weightPerSide} {weightUnit}</strong>
            </span>
          </div>
        </div>

        {/* Plate Breakdown List */}
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Plate Checklist (One Side)
          </span>
          {result.plates.length === 0 ? (
            <p className="text-xs text-slate-500">Just lift the barbell ({barWeight} {weightUnit})</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {result.plates.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#1a202c] border border-[#242c3d]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: p.color }}
                      className="w-4 h-4 rounded-full border border-white/30"
                    />
                    <span className="text-sm font-semibold text-white">
                      {p.plateWeight} {weightUnit}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#008cff]/20 text-[#008cff]">
                    × {p.countPerSide}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-[#008cff] hover:bg-[#0077db] text-white font-bold rounded-xl active:scale-98 transition shadow-lg shadow-[#008cff]/20"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
