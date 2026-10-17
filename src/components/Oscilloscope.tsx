import React, { useEffect, useRef, useState } from 'react';
import { OscilloscopeState } from '../types/mechatronics';
import { Play, Pause, RotateCcw, Activity, Settings2, Sliders, Maximize2 } from 'lucide-react';

interface OscilloscopeProps {
  state: OscilloscopeState;
  onChange: (newState: Partial<OscilloscopeState>) => void;
  title?: string;
  sourceSignal?: {
    ch1Freq?: number;
    ch1Amp?: number;
    ch2Freq?: number;
    ch2Amp?: number;
  };
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  state,
  onChange,
  title = 'راسم الإشارة الرقمي (Digital Storage Oscilloscope)',
  sourceSignal
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeOffsetRef = useRef<number>(0);
  const [activeTab, setActiveTab] = useState<'screen' | 'ch1' | 'ch2' | 'timebase'>('screen');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = state.run;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Dark CRT/OLED Phosphor Background
      ctx.fillStyle = '#061311';
      ctx.fillRect(0, 0, width, height);

      // Grid Drawing (10 div horizontal, 8 div vertical)
      const numCols = 10;
      const numRows = 8;
      const colWidth = width / numCols;
      const rowHeight = height / numRows;

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.18)';
      ctx.lineWidth = 1;

      // Vertical grid lines
      for (let i = 0; i <= numCols; i++) {
        const x = i * colWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Sub-ticks on center row
        if (i < numCols) {
          for (let sub = 1; sub < 5; sub++) {
            const subX = x + (sub * colWidth) / 5;
            ctx.beginPath();
            ctx.moveTo(subX, height / 2 - 3);
            ctx.lineTo(subX, height / 2 + 3);
            ctx.stroke();
          }
        }
      }

      // Horizontal grid lines
      for (let j = 0; j <= numRows; j++) {
        const y = j * rowHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // Sub-ticks on center column
        if (j < numRows) {
          for (let sub = 1; sub < 5; sub++) {
            const subY = y + (sub * rowHeight) / 5;
            ctx.beginPath();
            ctx.moveTo(width / 2 - 3, subY);
            ctx.lineTo(width / 2 + 3, subY);
            ctx.stroke();
          }
        }
      }

      // Center crosshairs (solid bright line)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      if (running) {
        timeOffsetRef.current += 0.04;
      }
      const t = timeOffsetRef.current;

      const f1 = (sourceSignal?.ch1Freq ?? state.frequencyCH1) || 50;
      const amp1 = (sourceSignal?.ch1Amp ?? state.vppCH1) || 5;

      const f2 = (sourceSignal?.ch2Freq ?? state.frequencyCH2) || 100;
      const amp2 = (sourceSignal?.ch2Amp ?? state.vppCH2) || 2.5;

      // Draw Channel 1 (Yellow Glow)
      if (state.ch1Enabled) {
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.2;
        ctx.beginPath();

        const vPerPixel1 = (state.voltsPerDivCH1 * 8) / height;
        const centerY1 = height / 2 + state.yPosCH1;

        for (let x = 0; x < width; x++) {
          const simTime = (x / width) * (state.timePerDiv * 10 * 0.001) + t * 0.01;
          let val = 0;
          if (state.waveCH1 === 'sine') {
            val = (amp1 / 2) * Math.sin(2 * Math.PI * f1 * simTime);
          } else if (state.waveCH1 === 'square') {
            val = (amp1 / 2) * (Math.sin(2 * Math.PI * f1 * simTime) >= 0 ? 1 : -1);
          } else if (state.waveCH1 === 'triangle') {
            const phase = (2 * Math.PI * f1 * simTime) / (2 * Math.PI);
            val = (amp1 / 2) * (4 * Math.abs(phase - Math.floor(phase + 0.5)) - 1);
          } else {
            // PWM with RC slight curvature
            const raw = Math.sin(2 * Math.PI * f1 * simTime) > 0.1 ? 1 : -1;
            val = (amp1 / 2) * raw;
          }

          const y = centerY1 - val / vPerPixel1;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Draw Channel 2 (Cyan Glow)
      if (state.ch2Enabled) {
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.2;
        ctx.beginPath();

        const vPerPixel2 = (state.voltsPerDivCH2 * 8) / height;
        const centerY2 = height / 2 + state.yPosCH2;

        for (let x = 0; x < width; x++) {
          const simTime = (x / width) * (state.timePerDiv * 10 * 0.001) + t * 0.01;
          let val = 0;
          if (state.waveCH2 === 'sine') {
            val = (amp2 / 2) * Math.sin(2 * Math.PI * f2 * simTime + Math.PI / 4);
          } else if (state.waveCH2 === 'square') {
            val = (amp2 / 2) * (Math.sin(2 * Math.PI * f2 * simTime) >= 0 ? 1 : -1);
          } else if (state.waveCH2 === 'triangle') {
            const phase = (2 * Math.PI * f2 * simTime) / (2 * Math.PI);
            val = (amp2 / 2) * (4 * Math.abs(phase - Math.floor(phase + 0.5)) - 1);
          } else {
            val = (amp2 / 2) * Math.sin(2 * Math.PI * f2 * simTime);
          }

          const y = centerY2 - val / vPerPixel2;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // On-Screen Measurement Readout HUD
      ctx.save();
      ctx.direction = 'ltr';
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#facc15';
      ctx.fillText(`CH1: ${(sourceSignal?.ch1Amp ?? state.vppCH1).toFixed(2)}Vpp  ${(sourceSignal?.ch1Freq ?? state.frequencyCH1).toFixed(0)}Hz  [${state.voltsPerDivCH1}V/div]`, 12, 18);

      ctx.fillStyle = '#22d3ee';
      ctx.fillText(`CH2: ${(sourceSignal?.ch2Amp ?? state.vppCH2).toFixed(2)}Vpp  ${(sourceSignal?.ch2Freq ?? state.frequencyCH2).toFixed(0)}Hz  [${state.voltsPerDivCH2}V/div]`, 12, 34);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#10b981';
      ctx.fillText(`TIME: ${state.timePerDiv} ms/div   TRIG: AUTO`, width - 14, 18);
      ctx.fillText(state.run ? 'STATUS: RUNNING ●' : 'STATUS: STOPPED ■', width - 14, 34);
      ctx.restore();

      if (running) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state, sourceSignal]);

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-slate-100 flex flex-col gap-3 font-sans">
      {/* Scope Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">{title}</h3>
            <span className="text-xs font-mono text-emerald-400">Tektronix / Rigol DS1054Z Emulation</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange({ run: !state.run })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              state.run
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            {state.run ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {state.run ? 'إيقاف (Stop)' : 'تشغيل (Run)'}
          </button>
          <button
            onClick={() => onChange({ yPosCH1: 0, yPosCH2: 0, voltsPerDivCH1: 2, voltsPerDivCH2: 2, timePerDiv: 5 })}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition text-xs flex items-center gap-1"
            title="ضبط تلقائي (Auto-Set)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Auto</span>
          </button>
        </div>
      </div>

      {/* Main Display Grid */}
      <div className="relative rounded-xl overflow-hidden border-2 border-slate-700 bg-black shadow-inner">
        <canvas
          ref={canvasRef}
          width={640}
          height={300}
          className="w-full h-auto block"
        />
        {/* Glow corners effect */}
        <div className="absolute top-2 left-2 pointer-events-none text-[10px] font-mono text-emerald-400/80 bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/20">
          500 MSa/s • 1X PROBE
        </div>
      </div>

      {/* Control Knob Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
        {/* Channel 1 Controls */}
        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-yellow-500/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-yellow-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block shadow-[0_0_8px_#facc15]"></span>
              القناة الأولى CH1 (أصفر)
            </span>
            <input
              type="checkbox"
              checked={state.ch1Enabled}
              onChange={(e) => onChange({ ch1Enabled: e.target.checked })}
              className="accent-yellow-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Volts/Div:</span>
              <span className="font-mono text-yellow-300 font-bold">{state.voltsPerDivCH1} V</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={state.voltsPerDivCH1}
              onChange={(e) => onChange({ voltsPerDivCH1: parseFloat(e.target.value) })}
              className="w-full accent-yellow-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>الموضع الرأسي Y-Position:</span>
              <span className="font-mono text-yellow-300">{state.yPosCH1} px</span>
            </div>
            <input
              type="range"
              min="-80"
              max="80"
              step="5"
              value={state.yPosCH1}
              onChange={(e) => onChange({ yPosCH1: parseInt(e.target.value) })}
              className="w-full accent-yellow-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex gap-1 pt-1">
            {(['sine', 'square', 'triangle', 'pwm'] as const).map((w) => (
              <button
                key={w}
                onClick={() => onChange({ waveCH1: w })}
                className={`flex-1 py-1 rounded text-[10px] font-mono transition ${
                  state.waveCH1 === w ? 'bg-yellow-500/20 border border-yellow-400 text-yellow-300 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Channel 2 Controls */}
        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-cyan-500/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_#22d3ee]"></span>
              القناة الثانية CH2 (سماوي)
            </span>
            <input
              type="checkbox"
              checked={state.ch2Enabled}
              onChange={(e) => onChange({ ch2Enabled: e.target.checked })}
              className="accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Volts/Div:</span>
              <span className="font-mono text-cyan-300 font-bold">{state.voltsPerDivCH2} V</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={state.voltsPerDivCH2}
              onChange={(e) => onChange({ voltsPerDivCH2: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>الموضع الرأسي Y-Position:</span>
              <span className="font-mono text-cyan-300">{state.yPosCH2} px</span>
            </div>
            <input
              type="range"
              min="-80"
              max="80"
              step="5"
              value={state.yPosCH2}
              onChange={(e) => onChange({ yPosCH2: parseInt(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex gap-1 pt-1">
            {(['sine', 'square', 'triangle', 'pwm'] as const).map((w) => (
              <button
                key={w}
                onClick={() => onChange({ waveCH2: w })}
                className={`flex-1 py-1 rounded text-[10px] font-mono transition ${
                  state.waveCH2 === w ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Timebase / Horizontal Controls */}
        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-emerald-500/30 flex flex-col justify-between gap-2">
          <div className="font-bold text-emerald-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            قاعدة الزمن الأفقي (Horizontal Timebase)
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Time/Div:</span>
              <span className="font-mono text-emerald-300 font-bold">{state.timePerDiv} ms</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={state.timePerDiv}
              onChange={(e) => onChange({ timePerDiv: parseInt(e.target.value) })}
              className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="bg-slate-950 p-2 rounded text-[11px] font-mono space-y-1 text-slate-300 border border-slate-800">
            <div className="text-slate-400 font-sans font-semibold">حسابات الإشارة:</div>
            <div>T = 1 / f = {(1000 / ((sourceSignal?.ch1Freq ?? state.frequencyCH1) || 50)).toFixed(2)} ms</div>
            <div>Vrms = Vpp / 2√2 = {(((sourceSignal?.ch1Amp ?? state.vppCH1) || 5) / (2 * Math.SQRT2)).toFixed(2)} V</div>
          </div>
        </div>
      </div>
    </div>
  );
};
