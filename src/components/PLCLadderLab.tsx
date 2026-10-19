import React, { useState, useEffect } from 'react';
import { Cpu, Play, Pause, RotateCcw, AlertOctagon, CheckCircle2, Box, ArrowRight } from 'lucide-react';

export const PLCLadderLab: React.FC = () => {
  // Industrial Inputs
  const [startPB, setStartPB] = useState<boolean>(false);
  const [stopPB, setStopPB] = useState<boolean>(false);
  const [eStop, setEStop] = useState<boolean>(false);
  const [manualSensor, setManualSensor] = useState<boolean>(false);

  // Industrial Outputs
  const [conveyorMotor, setConveyorMotor] = useState<boolean>(false);
  const [sortingCylinder, setSortingCylinder] = useState<boolean>(false);

  // Timer TON state
  const [timerProgress, setTimerProgress] = useState<number>(0);
  const [timerDone, setTimerDone] = useState<boolean>(false);

  // Factory animation box position (0 to 100%)
  const [boxPosition, setBoxPosition] = useState<number>(10);
  const [boxSorted, setBoxSorted] = useState<number>(0);

  // Pure derived states for PLC indicators
  const redAlarm = eStop;
  const greenLight = conveyorMotor && !eStop;
  const proximitySensor = manualSensor || (conveyorMotor && !eStop && boxPosition >= 52 && boxPosition <= 62);

  // Single cleanly scoped conveyor animation loop
  useEffect(() => {
    if (!conveyorMotor || eStop) return;

    const animInterval = setInterval(() => {
      setBoxPosition(prev => {
        // If sorting zone reached (55% to 62%)
        if (prev >= 54 && prev <= 62) {
          setBoxSorted(c => c + 1);
          setSortingCylinder(true);
          setTimerProgress(100);
          setTimerDone(true);
          setTimeout(() => {
            setSortingCylinder(false);
            setTimerProgress(0);
            setTimerDone(false);
          }, 350);
          return 0; // restart new box
        }
        if (prev >= 100) {
          return 0;
        }
        return prev + 1.2;
      });
    }, 40);

    return () => clearInterval(animInterval);
  }, [conveyorMotor, eStop]);

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              معمل برمجة ومحاكاة مخطط السلم الصناعي (PLC Ladder Logic Simulator)
            </h3>
            <span className="text-xs text-cyan-400 font-mono">
              Siemens S7-1200 / Allen Bradley Emulation • IEC 61131-3 LD Standard
            </span>
          </div>
        </div>

        {/* Status Indicators & Run Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (eStop) setEStop(false);
              setConveyorMotor(prev => !prev);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              conveyorMotor && !eStop
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${conveyorMotor && !eStop ? 'fill-current' : ''}`} />
            <span>{conveyorMotor && !eStop ? 'خط الإنتاج يعمل (إيقاف)' : 'تشغيل خط الإنتاج (RUN)'}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className={`w-3 h-3 rounded-full ${greenLight ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-slate-700'}`}></span>
            <span className="text-slate-300">RUN (Q0.2)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className={`w-3 h-3 rounded-full ${redAlarm ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]' : 'bg-slate-700'}`}></span>
            <span className="text-slate-300">ALARM (Q0.3)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Animated Factory Conveyor Line + Ladder Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Animated Factory Simulation */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs">
            <span className="font-bold text-slate-200">خط الإنتاج والفرز الذكي (Industrial Sorting Conveyor)</span>
            <span className="font-mono text-cyan-400">القطع المفرزة: {boxSorted}</span>
          </div>

          {/* Conveyor Belt Canvas */}
          <div className="relative h-44 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col justify-end p-4">
            {/* Proximity Optical Sensor */}
            <div className="absolute top-4 left-[54%] -translate-x-1/2 flex flex-col items-center">
              <div className={`w-4 h-8 rounded-t border-2 ${proximitySensor ? 'bg-amber-400 border-amber-300 shadow-[0_0_12px_#fbbf24]' : 'bg-slate-700 border-slate-600'}`} />
              <div className={`w-1 h-14 ${proximitySensor ? 'bg-amber-400/80' : 'bg-amber-400/20'}`} />
              <span className="text-[9px] font-mono text-amber-300 mt-1">حساس I0.3</span>
            </div>

            {/* Pneumatic Cylinder Pusher */}
            <div className="absolute top-16 left-[56%] flex items-center">
              <div
                className={`h-4 bg-slate-300 rounded border border-slate-500 transition-all duration-150 ${
                  sortingCylinder ? 'w-16 bg-rose-500 border-rose-400 shadow-[0_0_8px_#f43f5e]' : 'w-4'
                }`}
              />
              <span className="text-[9px] font-mono text-slate-400 mr-2">مكبس Q0.1</span>
            </div>

            {/* Conveyor Belt & Moving Box */}
            <div className="w-full h-8 bg-slate-800 border-y-2 border-slate-600 rounded relative flex items-center shadow-inner">
              {/* Conveyor rollers */}
              <div className="absolute inset-0 flex justify-between px-2 items-center opacity-40 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-1.5 h-6 bg-slate-500 rounded-full" />
                ))}
              </div>

              {/* Box */}
              <div
                className="absolute -top-7 transition-all duration-75 flex items-center justify-center"
                style={{ left: `${boxPosition}%` }}
              >
                <div className="w-8 h-8 rounded bg-amber-600 border-2 border-amber-400 flex items-center justify-center text-white shadow-lg">
                  <Box className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Conveyor Drive Motor */}
            <div className="flex justify-between items-center mt-2 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${conveyorMotor ? 'bg-emerald-400 animate-spin' : 'bg-slate-600'}`}></span>
                <span>محرك السير Q0.0: {conveyorMotor ? 'يعمل (RUN)' : 'متوقف'}</span>
              </div>
              <div>سرعة الخط: 1.2 m/s</div>
            </div>
          </div>

          {/* Physical Pushbutton Control Station */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800">
            {/* Start Pushbutton (Normally Open) */}
            <button
              onClick={() => {
                if (!eStop) setConveyorMotor(true);
              }}
              onMouseDown={() => {
                setStartPB(true);
                if (!eStop) setConveyorMotor(true);
              }}
              onMouseUp={() => setStartPB(false)}
              onTouchStart={() => {
                setStartPB(true);
                if (!eStop) setConveyorMotor(true);
              }}
              onTouchEnd={() => setStartPB(false)}
              className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl font-bold text-xs text-white shadow-lg shadow-emerald-900/40 flex flex-col items-center gap-1 transition cursor-pointer"
            >
              <span>تشغيل (START)</span>
              <span className="text-[10px] font-mono opacity-80">I0.0 (NO)</span>
            </button>

            {/* Stop Pushbutton (Normally Closed) */}
            <button
              onClick={() => {
                setConveyorMotor(false);
              }}
              onMouseDown={() => {
                setStopPB(true);
                setConveyorMotor(false);
              }}
              onMouseUp={() => setStopPB(false)}
              onTouchStart={() => {
                setStopPB(true);
                setConveyorMotor(false);
              }}
              onTouchEnd={() => setStopPB(false)}
              className="py-2.5 px-2 bg-rose-700 hover:bg-rose-600 active:scale-95 rounded-xl font-bold text-xs text-white shadow-lg shadow-rose-900/40 flex flex-col items-center gap-1 transition cursor-pointer"
            >
              <span>إيقاف (STOP)</span>
              <span className="text-[10px] font-mono opacity-80">I0.1 (NC)</span>
            </button>

            {/* E-Stop Toggle */}
            <button
              onClick={() => {
                setEStop(prev => {
                  const next = !prev;
                  if (next) setConveyorMotor(false);
                  return next;
                });
              }}
              className={`py-2.5 px-2 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition shadow-lg ${
                eStop ? 'bg-rose-600 text-white animate-bounce' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>طوارئ E-STOP</span>
            </button>

            {/* Manual Sensor Trigger */}
            <button
              onClick={() => setManualSensor(!manualSensor)}
              className={`py-2.5 px-2 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition ${
                proximitySensor ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>تحفيز الحساس</span>
              <span className="text-[10px] font-mono">I0.3</span>
            </button>
          </div>
        </div>

        {/* Ladder Diagram (LD) Code Viewer & Active Power Rail */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 font-sans">مخطط السلم التنفيذي (Ladder Diagram Execution)</span>
            <span className="text-[11px] text-emerald-400">Scan Cycle: 50 ms</span>
          </div>

          {/* Ladder Rungs */}
          <div className="space-y-4 py-2 overflow-y-auto">
            {/* Rung 0: Motor Latch */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 relative">
              <div className="text-[10px] text-slate-400 font-sans mb-1">Rung 0: دائرة القفل الذاتي (Latch) لتشغيل محرك السير</div>
              <div className="flex items-center gap-2 overflow-x-auto text-[11px]">
                {/* Power Rail Left */}
                <div className="w-1.5 h-12 bg-emerald-500 rounded" />
                {/* Parallel Branch: Start OR Motor */}
                <div className="flex flex-col gap-1 border-x border-slate-700 px-2 py-1">
                  <div className={`px-2 py-1 rounded border ${startPB ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold' : 'border-slate-700 text-slate-400'}`}>
                    --[ ]-- I0.0 (Start)
                  </div>
                  <div className={`px-2 py-1 rounded border ${conveyorMotor ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold' : 'border-slate-700 text-slate-400'}`}>
                    --[ ]-- Q0.0 (Latch)
                  </div>
                </div>
                <div className="text-slate-600">--</div>
                {/* Stop Contact (NC) */}
                <div className={`px-2 py-1 rounded border ${!stopPB ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'border-rose-500 text-rose-400 font-bold'}`}>
                  --[/]-- I0.1 (Stop)
                </div>
                <div className="text-slate-600">--</div>
                {/* E-Stop Contact (NC) */}
                <div className={`px-2 py-1 rounded border ${!eStop ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'border-rose-500 text-rose-400 font-bold'}`}>
                  --[/]-- I0.2 (E-Stop)
                </div>
                <div className="text-slate-600">------</div>
                {/* Coil Q0.0 */}
                <div className={`px-2.5 py-1.5 rounded-lg border font-bold ${conveyorMotor ? 'bg-emerald-600 text-white shadow-[0_0_8px_#10b981]' : 'border-slate-700 text-slate-500'}`}>
                  ( ) Q0.0 Motor
                </div>
                {/* Power Rail Right */}
                <div className="w-1.5 h-12 bg-slate-700 rounded mr-auto" />
              </div>
            </div>

            {/* Rung 1: TON Timer */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 relative">
              <div className="text-[10px] text-slate-400 font-sans mb-1">Rung 1: تأخير الفرز (TON Timer T1)</div>
              <div className="flex items-center gap-2 text-[11px]">
                <div className="w-1.5 h-10 bg-emerald-500 rounded" />
                <div className={`px-2 py-1 rounded border ${proximitySensor ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold' : 'border-slate-700 text-slate-400'}`}>
                  --[ ]-- I0.3 (Proximity)
                </div>
                <div className="text-slate-600">--------</div>
                {/* Timer Block */}
                <div className="p-2 rounded border border-cyan-500/50 bg-slate-950 text-cyan-300 flex flex-col gap-0.5">
                  <div className="font-bold">[ TON : T1 ]</div>
                  <div className="text-[10px]">PT: 400ms • ET: {timerProgress * 4}ms</div>
                  <div className="w-24 bg-slate-800 h-1 rounded overflow-hidden">
                    <div className="bg-cyan-400 h-full transition-all" style={{ width: `${timerProgress}%` }} />
                  </div>
                </div>
                <div className="w-1.5 h-10 bg-slate-700 rounded mr-auto" />
              </div>
            </div>

            {/* Rung 2: Sorting Cylinder */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 relative">
              <div className="text-[10px] text-slate-400 font-sans mb-1">Rung 2: إطلاق مكبس الفرز</div>
              <div className="flex items-center gap-2 text-[11px]">
                <div className="w-1.5 h-10 bg-emerald-500 rounded" />
                <div className={`px-2 py-1 rounded border ${timerDone ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold' : 'border-slate-700 text-slate-400'}`}>
                  --[ ]-- T1.DN
                </div>
                <div className="text-slate-600">----------------</div>
                <div className={`px-2.5 py-1.5 rounded-lg border font-bold ${sortingCylinder ? 'bg-rose-600 text-white shadow-[0_0_8px_#f43f5e]' : 'border-slate-700 text-slate-500'}`}>
                  ( ) Q0.1 Piston
                </div>
                <div className="w-1.5 h-10 bg-slate-700 rounded mr-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
