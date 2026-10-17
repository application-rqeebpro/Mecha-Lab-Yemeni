import React, { useState, useEffect } from 'react';
import { Wind, Play, RotateCcw, Gauge, ArrowRightLeft, Sliders, CheckCircle2 } from 'lucide-react';

export const PneumaticsLab: React.FC = () => {
  const [pressureBar, setPressureBar] = useState<number>(6.0); // 6 Bar standard industrial
  const [solenoidY1, setSolenoidY1] = useState<boolean>(false); // Advance coil
  const [solenoidY2, setSolenoidY2] = useState<boolean>(false); // Retract coil
  const [valveState, setValveState] = useState<'A+' | 'A-'>('A-'); // 5/2 valve position
  const [pistonPosition, setPistonPosition] = useState<number>(0); // 0 (retracted) to 100 (extended)
  const [flowThrottle, setFlowThrottle] = useState<number>(60); // % flow speed
  const [cycleMode, setCycleMode] = useState<boolean>(false);

  // Cylinder parameters
  const boreDiameter = 32; // mm
  const rodDiameter = 12; // mm
  const strokeLength = 100; // mm

  // Theoretical pneumatic forces: F = P * A
  const pressurePa = pressureBar * 100000;
  const areaPiston = (Math.PI * Math.pow(boreDiameter / 1000, 2)) / 4;
  const areaRod = (Math.PI * (Math.pow(boreDiameter / 1000, 2) - Math.pow(rodDiameter / 1000, 2))) / 4;
  const advanceForceN = (pressurePa * areaPiston).toFixed(1);
  const retractForceN = (pressurePa * areaRod).toFixed(1);

  // Limit switches
  const sensor1S1 = pistonPosition <= 5; // Retracted limit switch
  const sensor1S2 = pistonPosition >= 95; // Extended limit switch

  // 5/2 Valve actuation logic
  useEffect(() => {
    if (solenoidY1) {
      setValveState('A+');
    } else if (solenoidY2) {
      setValveState('A-');
    }
  }, [solenoidY1, solenoidY2]);

  // Cylinder movement dynamic simulation
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setPistonPosition(prev => {
        const speed = (flowThrottle / 100) * 3.5;
        if (valveState === 'A+') {
          return Math.min(100, prev + speed);
        } else {
          return Math.max(0, prev - speed);
        }
      });
    }, 40);
    return () => clearInterval(moveInterval);
  }, [valveState, flowThrottle]);

  // Decoupled Auto-cycle toggle
  useEffect(() => {
    if (!cycleMode) return;
    if (valveState === 'A+' && pistonPosition >= 99) {
      const t = setTimeout(() => setValveState('A-'), 150);
      return () => clearTimeout(t);
    } else if (valveState === 'A-' && pistonPosition <= 1) {
      const t = setTimeout(() => setValveState('A+'), 150);
      return () => clearTimeout(t);
    }
  }, [cycleMode, valveState, pistonPosition]);

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Wind className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              معمل الكهرو-نيوماتيك والأتمتة الهوائية (Electro-Pneumatics Laboratory)
            </h3>
            <span className="text-xs text-blue-400 font-mono">
              5/2 Solenoid Directional Valve • Double-Acting Piston • Festo Standard
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCycleMode(!cycleMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              cycleMode
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{cycleMode ? 'حركة دورية مستمرة (Auto Cycle)' : 'تشغيل دوري'}</span>
          </button>
        </div>
      </div>

      {/* Main Simulation View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Double-Acting Cylinder Visualizer */}
        <div className="lg:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs">
            <span className="font-bold text-slate-200">الأسطوانة المزدوجة الفعل (Double-Acting Cylinder 1.0)</span>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className={`px-2 py-0.5 rounded ${sensor1S1 ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'text-slate-600'}`}>
                1S1 (رجوع كامل)
              </span>
              <span className={`px-2 py-0.5 rounded ${sensor1S2 ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'text-slate-600'}`}>
                1S2 (تقدم كامل)
              </span>
            </div>
          </div>

          {/* Animated Cylinder Piston Graphic */}
          <div className="h-44 bg-slate-900 rounded-xl border border-slate-800 relative flex items-center justify-start p-6 overflow-hidden">
            {/* Magnetic Reed Sensors */}
            <div className="absolute top-4 left-10 flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${sensor1S1 ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-slate-700'}`} />
              <span className="text-[9px] font-mono text-slate-400 mt-0.5">1S1</span>
            </div>
            <div className="absolute top-4 left-64 flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${sensor1S2 ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-slate-700'}`} />
              <span className="text-[9px] font-mono text-slate-400 mt-0.5">1S2</span>
            </div>

            {/* Cylinder Body Barrel */}
            <div className="w-72 h-20 bg-slate-800 border-4 border-slate-600 rounded-lg relative overflow-hidden flex items-center shadow-2xl">
              {/* Left Chamber (Pressure A+ Red if extending, Blue if exhaust) */}
              <div
                className={`h-full transition-all duration-75 ${
                  valveState === 'A+' ? 'bg-rose-500/30 border-r-2 border-rose-500' : 'bg-blue-500/10'
                }`}
                style={{ width: `${pistonPosition}%` }}
              />

              {/* Piston Disc */}
              <div
                className="w-5 h-full bg-slate-400 border-x-2 border-slate-200 shadow-xl absolute transition-all duration-75"
                style={{ left: `${pistonPosition}%` }}
              />

              {/* Right Chamber (Pressure A- Red if retracting, Blue if exhaust) */}
              <div
                className={`h-full flex-1 transition-all duration-75 ${
                  valveState === 'A-' ? 'bg-rose-500/30 border-l-2 border-rose-500' : 'bg-blue-500/10'
                }`}
              />
            </div>

            {/* Piston Rod (Chrome Steel Extension) */}
            <div
              className="h-6 bg-slate-200 border-y-2 border-slate-400 shadow-md transition-all duration-75 rounded-r flex items-center justify-end"
              style={{
                width: `${12 + (pistonPosition / 100) * 120}px`,
                marginLeft: '-4px'
              }}
            >
              {/* Tool mounting flange */}
              <div className="w-3 h-10 bg-slate-500 rounded-r border border-slate-300" />
            </div>
          </div>

          {/* 5/2 Directional Valve Graphic & Coils */}
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">الصمام التوجيهي 5/2 (5/2 Solenoid Valve):</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
                {valveState === 'A+' ? 'وضع التقدم (Extension 14)' : 'وضع الرجوع (Retraction 12)'}
              </span>
            </div>

            {/* Coils Manual Override Buttons */}
            <div className="flex items-center gap-2">
              <button
                onMouseDown={() => setSolenoidY1(true)}
                onMouseUp={() => setSolenoidY1(false)}
                onTouchStart={() => setSolenoidY1(true)}
                onTouchEnd={() => setSolenoidY1(false)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                  solenoidY1 || valveState === 'A+' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <span>ملف كهربائي Y1 (A+ تقدم)</span>
              </button>
              <button
                onMouseDown={() => setSolenoidY2(true)}
                onMouseUp={() => setSolenoidY2(false)}
                onTouchStart={() => setSolenoidY2(true)}
                onTouchEnd={() => setSolenoidY2(false)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                  solenoidY2 || valveState === 'A-' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <span>ملف كهربائي Y2 (A- رجوع)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pneumatics Calculation & Air Service Unit (FRL) */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-200 border-b border-slate-800 pb-2 mb-3">
              <Gauge className="w-4 h-4 text-blue-400" />
              وحدة خدمة الهواء (FRL Unit)
            </div>

            {/* Pressure Regulator Slider */}
            <div className="space-y-1 mb-4">
              <div className="flex justify-between items-center text-slate-300">
                <span>ضغط المنظومة (Pressure P):</span>
                <span className="font-mono text-blue-400 font-bold">{pressureBar.toFixed(1)} Bar</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={pressureBar}
                onChange={(e) => setPressureBar(parseFloat(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">P = {pressureBar * 100} kPa ({pressurePa} Pa)</span>
            </div>

            {/* Flow Throttle Slider */}
            <div className="space-y-1 mb-4">
              <div className="flex justify-between items-center text-slate-300">
                <span>خانق السرعة (Throttle):</span>
                <span className="font-mono text-emerald-400 font-bold">{flowThrottle}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={flowThrottle}
                onChange={(e) => setFlowThrottle(parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Theoretical Pneumatic Force Calculations */}
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
            <span className="font-bold text-slate-300 text-[11px] block">القوة الهوائية النظرية (F = P × A):</span>
            <div className="flex justify-between text-slate-400 font-mono">
              <span>قوة شوط التقدم (Advance Force):</span>
              <span className="text-rose-400 font-bold">{advanceForceN} N</span>
            </div>
            <div className="flex justify-between text-slate-400 font-mono">
              <span>قوة شوط الرجوع (Retract Force):</span>
              <span className="text-blue-400 font-bold">{retractForceN} N</span>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
              * قطر المكبس D=32mm وقطر الذراع d=12mm
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
