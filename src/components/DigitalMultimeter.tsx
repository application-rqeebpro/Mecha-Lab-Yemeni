import React, { useState } from 'react';
import { MultimeterState } from '../types/mechatronics';
import { Volume2, VolumeX, ShieldCheck, Zap, Disc } from 'lucide-react';

interface DigitalMultimeterProps {
  state: MultimeterState;
  onChange: (newState: Partial<MultimeterState>) => void;
  measuredVoltage?: number;
  measuredCurrent?: number;
  measuredResistance?: number;
}

export const DigitalMultimeter: React.FC<DigitalMultimeterProps> = ({
  state,
  onChange,
  measuredVoltage = 5.0,
  measuredCurrent = 0.025,
  measuredResistance = 1000,
}) => {
  const [backlight, setBacklight] = useState(true);
  const [hold, setHold] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(2400, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio fallback
    }
  };

  const getDisplayValue = () => {
    if (hold) return { val: 'HOLD', unit: '' };

    switch (state.mode) {
      case 'V_DC':
        return { val: measuredVoltage.toFixed(3), unit: 'V DC' };
      case 'V_AC':
        return { val: (measuredVoltage * 0.707).toFixed(3), unit: 'V AC' };
      case 'I_DC':
        if (measuredCurrent < 1) {
          return { val: (measuredCurrent * 1000).toFixed(2), unit: 'mA DC' };
        }
        return { val: measuredCurrent.toFixed(3), unit: 'A DC' };
      case 'RES':
        if (measuredResistance >= 1000000) {
          return { val: (measuredResistance / 1000000).toFixed(3), unit: 'MΩ' };
        }
        if (measuredResistance >= 1000) {
          return { val: (measuredResistance / 1000).toFixed(2), unit: 'kΩ' };
        }
        return { val: measuredResistance.toFixed(1), unit: 'Ω' };
      case 'CONT':
        if (measuredResistance < 30) {
          if (soundEnabled && !state.beep) playBeep();
          return { val: '00.2', unit: 'Ω BEEP' };
        }
        return { val: 'O.L', unit: 'OPEN' };
      default:
        return { val: '0.000', unit: 'V' };
    }
  };

  const currentDisplay = getDisplayValue();

  return (
    <div className="bg-amber-500/90 p-4 rounded-3xl border-4 border-amber-600 shadow-2xl text-slate-900 w-full max-w-sm flex flex-col gap-4 font-sans select-none">
      {/* Brand & Model Banner */}
      <div className="flex items-center justify-between border-b-2 border-amber-600/40 pb-2">
        <div>
          <h4 className="font-black text-slate-950 tracking-wider text-base">FLUKE 87V</h4>
          <span className="text-[10px] text-slate-800 font-semibold">TRUE RMS MULTIMETER</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 bg-amber-600 hover:bg-amber-700 rounded-lg text-slate-950 transition"
            title="كتم / تفعيل الصوت"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <div className="px-2 py-0.5 bg-amber-600/60 rounded text-[10px] font-bold text-slate-900">
            CAT IV 600V
          </div>
        </div>
      </div>

      {/* LCD Display */}
      <div
        dir="ltr"
        className={`p-4 rounded-xl border-4 border-slate-700 transition shadow-inner font-mono relative force-ltr ${
          backlight ? 'bg-emerald-300 text-slate-900' : 'bg-slate-300 text-slate-800'
        }`}
        style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
      >
        <div className="flex justify-between items-center text-[11px] font-bold pb-1 text-slate-700">
          <span>AUTO RANGE</span>
          <span>{hold && 'HOLD'}</span>
          <span>{soundEnabled && '🔊'}</span>
        </div>
        {/* 7-Segment Value Readout */}
        <div className="flex items-baseline justify-between py-1">
          <span className="text-3xl font-black tracking-tight">{currentDisplay.val}</span>
          <span className="text-sm font-black ml-2">{currentDisplay.unit}</span>
        </div>
        {/* Analog Bar Graph */}
        <div className="w-full bg-slate-900/15 h-2 rounded-full overflow-hidden mt-1">
          <div
            className="bg-slate-900 h-full transition-all duration-300"
            style={{ width: `${Math.min(100, (measuredVoltage / 15) * 100)}%` }}
          />
        </div>
      </div>

      {/* Function Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setHold(!hold)}
          className={`py-1.5 rounded-lg text-xs font-bold transition shadow ${
            hold ? 'bg-amber-300 text-slate-950' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          HOLD
        </button>
        <button
          onClick={() => setBacklight(!backlight)}
          className={`py-1.5 rounded-lg text-xs font-bold transition shadow ${
            backlight ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          إضاءة الشاشة
        </button>
        <button
          onClick={() => {
            if (state.mode === 'CONT') playBeep();
          }}
          className="py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 transition shadow"
        >
          اختبار التوصيل
        </button>
      </div>

      {/* Rotary Selector Dial */}
      <div className="bg-slate-900 p-3 rounded-2xl flex flex-col gap-2 text-white">
        <span className="text-[11px] text-center text-slate-400 font-bold">مفتاح الاختيار (Mode Selector)</span>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onChange({ mode: 'V_DC' })}
            className={`py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-0.5 transition ${
              state.mode === 'V_DC' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            V (DC)
          </button>
          <button
            onClick={() => onChange({ mode: 'V_AC' })}
            className={`py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-0.5 transition ${
              state.mode === 'V_AC' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <span>~</span>
            V (AC)
          </button>
          <button
            onClick={() => onChange({ mode: 'I_DC' })}
            className={`py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-0.5 transition ${
              state.mode === 'I_DC' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <span>A / mA</span>
            تيار
          </button>
          <button
            onClick={() => onChange({ mode: 'RES' })}
            className={`py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-0.5 transition ${
              state.mode === 'RES' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <span>Ω (أوم)</span>
            مقاومة
          </button>
          <button
            onClick={() => onChange({ mode: 'CONT' })}
            className={`py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-0.5 transition ${
              state.mode === 'CONT' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <span>🔊 )))</span>
            رنين
          </button>
          <div className="py-2 rounded-lg text-[10px] bg-slate-800/60 text-slate-400 flex flex-col items-center justify-center font-mono">
            <span>OFF</span>
            <span>إيقاف</span>
          </div>
        </div>
      </div>

      {/* Jacks / Test Leads */}
      <div className="flex justify-around items-center pt-1 border-t border-amber-600/50">
        <div className="flex flex-col items-center gap-1">
          <div className="w-6 h-6 rounded-full bg-red-600 border-2 border-red-800 shadow-inner flex items-center justify-center text-[9px] font-bold text-white">
            +
          </div>
          <span className="text-[10px] font-bold text-slate-900">V / Ω / mA</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-6 h-6 rounded-full bg-slate-950 border-2 border-slate-800 shadow-inner flex items-center justify-center text-[9px] font-bold text-white">
            -
          </div>
          <span className="text-[10px] font-bold text-slate-900">COM (GND)</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-6 h-6 rounded-full bg-amber-700 border-2 border-amber-900 shadow-inner flex items-center justify-center text-[9px] font-bold text-white">
            10A
          </div>
          <span className="text-[10px] font-bold text-slate-900">FUSED</span>
        </div>
      </div>
    </div>
  );
};
