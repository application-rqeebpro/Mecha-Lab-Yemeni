import React from 'react';
import { PowerSupplyState } from '../types/mechatronics';
import { Power, ShieldAlert, Cpu } from 'lucide-react';

interface DCPowerSupplyProps {
  state: PowerSupplyState;
  onChange: (newState: Partial<PowerSupplyState>) => void;
}

export const DCPowerSupply: React.FC<DCPowerSupplyProps> = ({ state, onChange }) => {
  const isCurrentLimited = state.measuredCurrent >= state.setCurrentLimit;

  return (
    <div className="bg-slate-900 border-2 border-slate-700/80 rounded-2xl p-4 shadow-2xl text-slate-100 flex flex-col gap-3 font-sans w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <h4 className="font-bold text-sm text-slate-200">وحدة التغذية المستمرة (Regulated DC Power Supply)</h4>
          <span className="text-[10px] font-mono text-emerald-400">0-30V / 0-5A • KORAD KD3005D Benchtop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              isCurrentLimited ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isCurrentLimited ? 'CC (تثبيت تيار)' : 'CV (تثبيت جهد)'}
          </span>
        </div>
      </div>

      {/* 7-Segment Dual LED Displays */}
      <div
        dir="ltr"
        className="grid grid-cols-2 gap-3 bg-black/90 p-3 rounded-xl border border-slate-800 force-ltr"
        style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
      >
        {/* Voltage Display */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-red-900/40">
          <span className="text-[10px] text-red-500 font-bold mb-0.5">VOLTAGE (V)</span>
          <span className="font-mono text-3xl font-black text-red-500 tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            {state.enabled ? state.setVoltage.toFixed(2) : '0.00'}
          </span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">V DC OUT</span>
        </div>

        {/* Current Display */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-emerald-900/40">
          <span className="text-[10px] text-emerald-500 font-bold mb-0.5">CURRENT (A)</span>
          <span className="font-mono text-3xl font-black text-emerald-400 tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.5)]">
            {state.enabled ? state.measuredCurrent.toFixed(3) : '0.000'}
          </span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">LIMIT: {state.setCurrentLimit.toFixed(2)}A</span>
        </div>
      </div>

      {/* Control Sliders & Knobs */}
      <div className="space-y-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs">
        <div>
          <div className="flex justify-between items-center text-slate-300 mb-1">
            <span className="font-semibold">ضبط الجهد (Voltage Adjust):</span>
            <span className="font-mono text-red-400 font-bold">{state.setVoltage.toFixed(1)} V</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="0.5"
            value={state.setVoltage}
            onChange={(e) => onChange({ setVoltage: parseFloat(e.target.value) })}
            className="w-full accent-red-500 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between items-center text-slate-300 mb-1">
            <span className="font-semibold">أقصى تيار حماية (Current Limit):</span>
            <span className="font-mono text-emerald-400 font-bold">{state.setCurrentLimit.toFixed(2)} A</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={state.setCurrentLimit}
            onChange={(e) => onChange({ setCurrentLimit: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Binding Posts / Terminals & Power Switch */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => onChange({ enabled: !state.enabled })}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            state.enabled
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{state.enabled ? 'مفعل (OUTPUT ON)' : 'مفصول (OUTPUT OFF)'}</span>
        </button>

        {/* Banana Terminals */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-red-800 shadow-md"></div>
            <span className="text-[9px] font-bold text-red-400 mt-0.5">+ (V+)</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-5 h-5 rounded-full bg-slate-900 border-2 border-slate-700 shadow-md"></div>
            <span className="text-[9px] font-bold text-slate-400 mt-0.5">- (GND)</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-5 h-5 rounded-full bg-emerald-700 border-2 border-emerald-900 shadow-md"></div>
            <span className="text-[9px] font-bold text-emerald-400 mt-0.5">EARTH</span>
          </div>
        </div>
      </div>
    </div>
  );
};
