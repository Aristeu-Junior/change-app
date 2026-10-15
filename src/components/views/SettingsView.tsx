import React, { useRef, useState } from 'react';
import {
  Settings as SettingsIcon,
  Volume2,
  Vibrate,
  Eye,
  Download,
  Upload,
  Check,
  ShieldCheck,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playGymTone, triggerHaptic } from '../../utils/calc';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, exportDataJson, importDataJson } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExport = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `change-workout-backup-${new Date().toISOString().split('T')[0]}.json`;
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
        setImportStatus('Data restored successfully!');
      } else {
        setImportStatus('Failed to parse backup file');
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-28 space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-xs text-slate-400">App preferences & data backup</p>
      </div>

      {/* Units Section */}
      <div className="bg-[#131720] border border-[#242c3d] rounded-2xl p-4 shadow-md space-y-4">
        <span className="text-xs uppercase font-bold text-slate-400 block">Units of Measurement</span>

        {/* Weight Unit */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-white block">Weight Unit</span>
            <span className="text-xs text-slate-500">Used across all exercises and PRs</span>
          </div>
          <div className="flex bg-[#1a202c] p-1 rounded-xl border border-[#242c3d]">
            <button
              onClick={() => updateSettings({ weight_unit: 'kg' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                settings.weight_unit === 'kg'
                  ? 'bg-[#008cff] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              KG
            </button>
            <button
              onClick={() => updateSettings({ weight_unit: 'lbs' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                settings.weight_unit === 'lbs'
                  ? 'bg-[#008cff] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              LBS
            </button>
          </div>
        </div>

        {/* Distance Unit */}
        <div className="flex items-center justify-between pt-2 border-t border-[#242c3d]">
          <div>
            <span className="text-sm font-bold text-white block">Distance Unit</span>
            <span className="text-xs text-slate-500">For running and cardio exercises</span>
          </div>
          <div className="flex bg-[#1a202c] p-1 rounded-xl border border-[#242c3d]">
            <button
              onClick={() => updateSettings({ distance_unit: 'kilometers' })}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                settings.distance_unit === 'kilometers'
                  ? 'bg-[#008cff] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              KM
            </button>
            <button
              onClick={() => updateSettings({ distance_unit: 'miles' })}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                settings.distance_unit === 'miles'
                  ? 'bg-[#008cff] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              MI
            </button>
          </div>
        </div>
      </div>

      {/* Rest Timer & Gym Ergonomics */}
      <div className="bg-[#131720] border border-[#242c3d] rounded-2xl p-4 shadow-md space-y-4">
        <span className="text-xs uppercase font-bold text-slate-400 block">Gym Experience</span>

        {/* Default Rest Timer */}
        <div>
          <span className="text-sm font-bold text-white block">Default Rest Duration</span>
          <span className="text-xs text-slate-500 mb-2 block">
            Automatically starts when completing a set
          </span>
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {[30, 60, 90, 120, 180].map((sec) => (
              <button
                key={sec}
                onClick={() => updateSettings({ default_rest_seconds: sec })}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  settings.default_rest_seconds === sec
                    ? 'bg-[#008cff] text-white'
                    : 'bg-[#1a202c] text-slate-400 hover:text-white border border-[#242c3d]'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Audio Beep / Bell Chime */}
        <div className="flex items-center justify-between pt-2 border-t border-[#242c3d]">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#008cff]" />
            <div>
              <span className="text-sm font-bold text-white block">Sound Effects</span>
              <span className="text-xs text-slate-500">Rest countdown and set finish chimes</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => playGymTone('complete')}
              className="text-[10px] font-bold text-[#008cff] bg-[#008cff]/10 px-2 py-1 rounded-lg"
            >
              Test
            </button>
            <input
              type="checkbox"
              checked={settings.sound_enabled}
              onChange={(e) => updateSettings({ sound_enabled: e.target.checked })}
              className="w-5 h-5 accent-[#008cff] rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Haptic Vibration */}
        <div className="flex items-center justify-between pt-2 border-t border-[#242c3d]">
          <div className="flex items-center gap-2">
            <Vibrate className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-sm font-bold text-white block">Haptic Feedback</span>
              <span className="text-xs text-slate-500">Vibrate phone on set completion</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerHaptic('success')}
              className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg"
            >
              Test
            </button>
            <input
              type="checkbox"
              checked={settings.haptics_enabled}
              onChange={(e) => updateSettings({ haptics_enabled: e.target.checked })}
              className="w-5 h-5 accent-[#008cff] rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Keep Screen Awake (Wake Lock) */}
        <div className="flex items-center justify-between pt-2 border-t border-[#242c3d]">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-sm font-bold text-white block">Keep Screen Awake</span>
              <span className="text-xs text-slate-500">Prevents phone sleep during workout</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.wake_lock_enabled}
            onChange={(e) => updateSettings({ wake_lock_enabled: e.target.checked })}
            className="w-5 h-5 accent-[#008cff] rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Backup & Data Sovereignty */}
      <div className="bg-[#131720] border border-[#242c3d] rounded-2xl p-4 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-slate-400 block">Data Backup & Ownership</span>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          All your workout sessions, routines, and personal records belong completely to you. You can export or import your data anytime with zero lock-in.
        </p>

        {importStatus && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 py-3 bg-[#1a202c] hover:bg-[#222938] border border-[#242c3d] rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Download className="w-4 h-4 text-[#008cff]" />
            Export JSON
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-3 bg-[#1a202c] hover:bg-[#222938] border border-[#242c3d] rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            Import JSON
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

      {/* About Change App Card */}
      <div className="bg-[#131720] border border-[#242c3d] rounded-2xl p-4 shadow-md text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#008cff] to-cyan-400 flex items-center justify-center mx-auto text-white font-black text-lg shadow-lg shadow-[#008cff]/20">
          C
        </div>
        <h3 className="text-base font-black text-white">Change Workout Tracker</h3>
        <p className="text-xs text-slate-400">
          Reverse-engineered from the Hevy application architecture. Full offline mobile experience with 100% data sovereignty.
        </p>
        <span className="text-[10px] text-slate-600 block">v1.0.0 • Mobile Progressive Web App</span>
      </div>
    </div>
  );
};
