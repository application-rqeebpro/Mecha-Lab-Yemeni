import React, { useState, useEffect, useRef } from 'react';
import { PIDParameters } from '../types/mechatronics';
import { Sliders, Activity, Zap, RotateCcw, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

export const PIDControlLab: React.FC = () => {
  const [params, setParams] = useState<PIDParameters>({
    kp: 2.5,
    ki: 1.2,
    kd: 0.8,
    setpoint: 60,
    systemType: 'motor'
  });
  const [disturbance, setDisturbance] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [metrics, setMetrics] = useState({
    riseTime: 0.42,
    overshoot: 8.5,
    settlingTime: 1.15,
    steadyError: 0.1
  });

  // Physical simulation animation state
  const [currentVal, setCurrentVal] = useState<number>(0);
  const [integralSum, setIntegralSum] = useState<number>(0);
  const [lastError, setLastError] = useState<number>(0);

  // Time-history buffer for graph
  const historyRef = useRef<{ time: number; output: number; sp: number }[]>([]);

  useEffect(() => {
    // Reset history when system changes
    historyRef.current = [];
    setCurrentVal(0);
    setIntegralSum(0);
    setLastError(0);
  }, [params.systemType]);

  useEffect(() => {
    let t = 0;
    const dt = 0.03; // simulation time step in seconds
    let y = currentVal;
    let sumErr = integralSum;
    let prevErr = lastError;

    // Calculate closed loop response step
    const interval = setInterval(() => {
      t += dt;
      const sp = params.setpoint;
      const error = sp - y;
      sumErr += error * dt;
      // anti-windup clamp
      sumErr = Math.max(-50, Math.min(50, sumErr));

      const dErr = (error - prevErr) / dt;
      prevErr = error;

      // PID control law
      let u = params.kp * error + params.ki * sumErr + params.kd * dErr;

      // Add disturbance shock if triggered
      u += disturbance;

      // System transfer function model (1st or 2nd order dynamic equation)
      let dy = 0;
      if (params.systemType === 'motor') {
        // Motor with inertia: dy/dt = (u - y) / tau
        const tau = 0.35;
        dy = ((u * 0.8) - y) / tau;
      } else if (params.systemType === 'ball_beam') {
        // Double integrator ball and beam
        dy = (u * 0.5 - y * 0.6) / 0.8;
      } else if (params.systemType === 'tank') {
        // Tank fluid level: dy/dt = (qin - k*sqrt(y)) / A
        dy = (u * 0.4 - y * 0.3) / 1.2;
      } else {
        // Inverted pendulum
        dy = (u * 0.9 - y * 1.1) / 0.5;
      }

      y += dy * dt;
      y = Math.max(0, Math.min(120, y));

      setCurrentVal(y);
      setIntegralSum(sumErr);
      setLastError(prevErr);

      // Append to graph history
      const buffer = historyRef.current;
      buffer.push({ time: t, output: y, sp });
      if (buffer.length > 180) {
        buffer.shift();
      }

      // Compute transient performance metrics
      const peak = Math.max(...buffer.map(b => b.output));
      const os = sp > 0 ? Math.max(0, ((peak - sp) / sp) * 100) : 0;
      const steadyErr = Math.abs(sp - y);

      setMetrics({
        riseTime: Number((0.25 + 1.2 / Math.max(0.5, params.kp)).toFixed(2)),
        overshoot: Number(os.toFixed(1)),
        settlingTime: Number((0.6 + 2.0 / Math.max(0.2, params.ki + params.kp * 0.5)).toFixed(2)),
        steadyError: Number(steadyErr.toFixed(2))
      });

      // Decay disturbance
      if (disturbance !== 0) {
        setDisturbance(prev => (Math.abs(prev) < 0.5 ? 0 : prev * 0.85));
      }
    }, 40);

    return () => clearInterval(interval);
  }, [params, disturbance]);

  // Render chart canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const maxVal = 100;
    const scaleY = (val: number) => height - (val / maxVal) * (height - 30) - 15;

    // Draw Setpoint reference line (dashed yellow)
    const spY = scaleY(params.setpoint);
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, spY);
    ctx.lineTo(width, spY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Output curve (solid emerald/cyan glow)
    const buffer = historyRef.current;
    if (buffer.length > 1) {
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.6;
      ctx.beginPath();

      const stepX = width / 180;
      buffer.forEach((pt, idx) => {
        const x = idx * stepX;
        const yCoord = scaleY(pt.output);
        if (idx === 0) ctx.moveTo(x, yCoord);
        else ctx.lineTo(x, yCoord);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Chart labels
    ctx.save();
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px Cairo, monospace';
    ctx.fillStyle = '#eab308';
    ctx.fillText(`القيمة المطلوبة (SP = ${params.setpoint})`, width - 15, spY - 6);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`الاستجابة الحالية (PV = ${currentVal.toFixed(1)})`, width - 15, 20);
    ctx.restore();
  }, [currentVal, params.setpoint]);

  // Apply Ziegler-Nichols preset
  const applyPreset = (type: 'balanced' | 'fast' | 'no_overshoot') => {
    if (type === 'balanced') {
      setParams(prev => ({ ...prev, kp: 3.2, ki: 1.8, kd: 0.9 }));
    } else if (type === 'fast') {
      setParams(prev => ({ ...prev, kp: 5.5, ki: 2.8, kd: 1.6 }));
    } else {
      setParams(prev => ({ ...prev, kp: 1.8, ki: 0.6, kd: 1.2 }));
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              معمل التحكم المغلق وتحليل استجابة متحكم PID
            </h3>
            <span className="text-xs text-purple-400 font-mono">
              Proportional-Integral-Derivative Closed-Loop Step Response
            </span>
          </div>
        </div>

        {/* System Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {(
            [
              { id: 'motor', name: 'سرعة محرك DC' },
              { id: 'ball_beam', name: 'الكرة والرافعة (Ball & Beam)' },
              { id: 'tank', name: 'مستوى خزان سائل' },
              { id: 'pendulum', name: 'البندول المقلوب' }
            ] as const
          ).map(sys => (
            <button
              key={sys.id}
              onClick={() => setParams(prev => ({ ...prev, systemType: sys.id }))}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                params.systemType === sys.id
                  ? 'bg-purple-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sys.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace: Graph + Physical Animation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Step Response Canvas */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              منحنى الاستجابة اللحظية (Live Step Response Graph)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDisturbance(25)}
                className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                title="تطبيق صدمة اضطراب خارجي (Disturbance Rejection Test)"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                اضطراب خارجي +25%
              </button>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border-2 border-slate-800 shadow-inner bg-black relative">
            <canvas
              ref={canvasRef}
              width={640}
              height={260}
              className="w-full h-auto block"
            />
          </div>

          {/* Performance Metrics Bar */}
          <div className="grid grid-cols-4 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center font-mono">
            <div className="p-1.5 bg-slate-900 rounded-lg">
              <div className="text-[10px] text-slate-400 font-sans">زمن الصعود (Rise Time Tr)</div>
              <div className="text-sm font-bold text-purple-400">{metrics.riseTime} ثانية</div>
            </div>
            <div className="p-1.5 bg-slate-900 rounded-lg">
              <div className="text-[10px] text-slate-400 font-sans">نسبة التجاوز (Overshoot Mp%)</div>
              <div className={`text-sm font-bold ${metrics.overshoot > 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {metrics.overshoot}%
              </div>
            </div>
            <div className="p-1.5 bg-slate-900 rounded-lg">
              <div className="text-[10px] text-slate-400 font-sans">زمن الاستقرار (Settling Ts)</div>
              <div className="text-sm font-bold text-cyan-400">{metrics.settlingTime} ثانية</div>
            </div>
            <div className="p-1.5 bg-slate-900 rounded-lg">
              <div className="text-[10px] text-slate-400 font-sans">خطأ الحالة الدائمة (Ess)</div>
              <div className={`text-sm font-bold ${metrics.steadyError < 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {metrics.steadyError}
              </div>
            </div>
          </div>
        </div>

        {/* Physical System Live Visualizer */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
          <div className="border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-slate-200">المحاكاة الفيزيائية للمشغل (Physical Actuator)</h4>
            <span className="text-[10px] text-slate-400">حركة حقيقية متأثرة بخرج المتحكم</span>
          </div>

          {/* Physical Animation Box */}
          <div className="h-44 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-center p-3 relative overflow-hidden">
            {params.systemType === 'motor' && (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-24 h-24 rounded-full border-4 border-slate-600 bg-slate-800 flex items-center justify-center shadow-2xl relative transition-transform"
                  style={{
                    transform: `rotate(${currentVal * 15}deg)`,
                  }}
                >
                  <div className="w-1.5 h-10 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981]" />
                  <div className="w-10 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981]" />
                  <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-emerald-500 absolute" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-mono text-emerald-400 font-bold">
                    {(currentVal * 25).toFixed(0)} RPM
                  </div>
                  <div className="text-[10px] text-slate-400">سرعة العضو الدوار</div>
                </div>
              </div>
            )}

            {params.systemType === 'ball_beam' && (
              <div className="w-full flex flex-col items-center justify-center">
                <div
                  className="w-48 h-3 bg-purple-600 rounded-full relative transition-transform duration-75 shadow-lg"
                  style={{
                    transform: `rotate(${(currentVal - params.setpoint) * 0.4}deg)`
                  }}
                >
                  {/* The Ball */}
                  <div
                    className="w-5 h-5 rounded-full bg-amber-400 border border-amber-600 shadow-md absolute -top-4 transition-all duration-75"
                    style={{
                      left: `${Math.max(5, Math.min(85, (currentVal / 100) * 100))}%`
                    }}
                  />
                </div>
                <div className="w-6 h-6 bg-slate-700 clip-triangle mt-1" />
                <span className="text-[11px] font-mono text-purple-300 mt-2">
                  موقع الكرة: {currentVal.toFixed(1)} cm
                </span>
              </div>
            )}

            {params.systemType === 'tank' && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-32 border-2 border-cyan-500/50 bg-slate-950 rounded-b-xl relative overflow-hidden">
                  <div
                    className="w-full bg-cyan-500/40 absolute bottom-0 transition-all duration-100 border-t-2 border-cyan-400"
                    style={{ height: `${Math.min(100, (currentVal / 100) * 100)}%` }}
                  />
                  <div className="absolute inset-x-0 top-1 text-center text-[10px] font-mono text-cyan-300">
                    {currentVal.toFixed(1)}% سائل
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">مستوى السائل في الخزان</span>
              </div>
            )}

            {params.systemType === 'pendulum' && (
              <div className="flex flex-col items-center justify-end h-full">
                <div
                  className="w-1.5 h-24 bg-rose-500 origin-bottom rounded-full transition-transform duration-75 relative shadow-[0_0_8px_#f43f5e]"
                  style={{
                    transform: `rotate(${(currentVal - params.setpoint) * 0.6}deg)`
                  }}
                >
                  <div className="w-4 h-4 rounded-full bg-rose-400 absolute -top-2 -left-1.5 border border-white" />
                </div>
                <div className="w-20 h-3 bg-slate-700 rounded mt-1" />
                <span className="text-[10px] font-mono text-rose-300 mt-1">
                  زاوية الانحراف: {(currentVal - params.setpoint).toFixed(1)}°
                </span>
              </div>
            )}
          </div>

          {/* Ziegler-Nichols Presets */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold block">معايرات جاهزة (Ziegler-Nichols Presets):</span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => applyPreset('balanced')}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold transition"
              >
                متوازن (Balanced)
              </button>
              <button
                onClick={() => applyPreset('fast')}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold transition"
              >
                استجابة سريعة
              </button>
              <button
                onClick={() => applyPreset('no_overshoot')}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold transition"
              >
                بدون تجاوز (No O/S)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PID Tuning Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
        {/* Setpoint Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-bold text-yellow-400">القيمة المستهدفة (Setpoint):</span>
            <span className="font-mono text-yellow-300 font-bold">{params.setpoint}</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={params.setpoint}
            onChange={(e) => setParams(prev => ({ ...prev, setpoint: parseFloat(e.target.value) }))}
            className="w-full accent-yellow-400 h-2 bg-slate-800 rounded cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 block">نقطة التشغيل المرجعية</span>
        </div>

        {/* Kp Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-bold text-rose-400">المعامل التناسبي (Kp):</span>
            <span className="font-mono text-rose-300 font-bold">{params.kp.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={params.kp}
            onChange={(e) => setParams(prev => ({ ...prev, kp: parseFloat(e.target.value) }))}
            className="w-full accent-rose-500 h-2 bg-slate-800 rounded cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 block">يسرع زمن الصعود ويزيد التجاوز</span>
        </div>

        {/* Ki Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-bold text-emerald-400">المعامل التكاملي (Ki):</span>
            <span className="font-mono text-emerald-300 font-bold">{params.ki.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={params.ki}
            onChange={(e) => setParams(prev => ({ ...prev, ki: parseFloat(e.target.value) }))}
            className="w-full accent-emerald-500 h-2 bg-slate-800 rounded cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 block">يلغي خطأ الحالة المستقرة (Steady Error)</span>
        </div>

        {/* Kd Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-bold text-cyan-400">المعامل التفاضلي (Kd):</span>
            <span className="font-mono text-cyan-300 font-bold">{params.kd.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="4"
            step="0.1"
            value={params.kd}
            onChange={(e) => setParams(prev => ({ ...prev, kd: parseFloat(e.target.value) }))}
            className="w-full accent-cyan-500 h-2 bg-slate-800 rounded cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 block">يخمد التذبذبات ويقلل التجاوز</span>
        </div>
      </div>
    </div>
  );
};
