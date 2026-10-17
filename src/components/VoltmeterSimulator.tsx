// VoltmeterSimulator.tsx - محاكي الملتيميتر والفولتميتر العملي المتقدم
import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  Sliders, 
  Info, 
  Activity, 
  Play, 
  Power,
  Gauge,
  HelpCircle,
  Eye,
  Layers
} from 'lucide-react';

interface ProbePosition {
  x: number; // percentage in container (0 - 100)
  y: number; // percentage in container (0 - 100)
  snappedNodeId?: string | null;
}

interface CircuitNode {
  id: string;
  name: string;
  nameEn: string;
  x: number; // percentage
  y: number; // percentage
  type: 'positive' | 'negative' | 'midpoint' | 'signal' | 'ac';
  baseVoltage: number; // in Volts
  component: string;
}

export const VoltmeterSimulator: React.FC = () => {
  // Meter Power and Mode Dial
  const [isOn, setIsOn] = useState<boolean>(true);
  const [dial, setDial] = useState<'OFF' | 'VDC20' | 'VDC200M' | 'VAC' | 'OHM' | 'ADC' | 'CONT'>('VDC20');
  const [reading, setReading] = useState<string>('0.00');
  const [readingUnit, setReadingUnit] = useState<string>('V DC');

  // Circuit power switch
  const [isCircuitPowered, setIsCircuitPowered] = useState<boolean>(true);

  // Variable Potentiometer (0 to 100%)
  const [potentiometerValue, setPotentiometerValue] = useState<number>(50); // 50%

  // Battery source voltage (adjustable 1.5V to 15V)
  const [batteryVoltage, setBatteryVoltage] = useState<number>(9.0);

  // Display meter type: Digital LCD or Analog Galvanometer (جلفانومتر ذو مؤشر)
  const [meterType, setMeterType] = useState<'digital' | 'analog' | 'both'>('digital');

  // Audio state for beeps
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Probes coordinates (percentage in container)
  const [redProbe, setRedProbe] = useState<ProbePosition>({ x: 58, y: 38, snappedNodeId: 'node_led_anode' });
  const [blackProbe, setBlackProbe] = useState<ProbePosition>({ x: 42, y: 78, snappedNodeId: 'node_bat_neg' });
  const [isDragging, setIsDragging] = useState<'red' | 'black' | null>(null);

  // Selected experiment preset
  const [activeExperiment, setActiveExperiment] = useState<string>('battery');

  // Container ref for pointer drag bounding box
  const benchRef = useRef<HTMLDivElement | null>(null);

  // Audio oscillator for continuity & rotary click
  const playTone = (frequency: number, duration: number) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // Audio fallback
    }
  };

  // Define Circuit Test Nodes
  const getCircuitNodes = (): CircuitNode[] => {
    const vBat = isCircuitPowered ? batteryVoltage : 0;
    // Voltage divider node: V = vBat * (pot / 100)
    const vWiper = isCircuitPowered ? Number((batteryVoltage * (potentiometerValue / 100)).toFixed(2)) : 0;
    // LED forward voltage drop ~2.1V if on
    const vLedDrop = isCircuitPowered ? 2.15 : 0;
    const vResistorMid = isCircuitPowered ? Number((vBat - vLedDrop).toFixed(2)) : 0;

    return [
      {
        id: 'node_bat_pos',
        name: 'قطب البطارية الموجب (+)',
        nameEn: 'Battery (+)',
        x: 14,
        y: 35,
        type: 'positive',
        baseVoltage: vBat,
        component: 'بطارية 9V'
      },
      {
        id: 'node_bat_neg',
        name: 'قطب البطارية السالب (GND -)',
        nameEn: 'Battery (- / GND)',
        x: 14,
        y: 65,
        type: 'negative',
        baseVoltage: 0.0,
        component: 'بطارية 9V'
      },
      {
        id: 'node_sw_out',
        name: 'خرج المفتاح الكهربائي',
        nameEn: 'Switch Out',
        x: 34,
        y: 35,
        type: 'positive',
        baseVoltage: isCircuitPowered ? vBat : 0.0,
        component: 'مفتاح SW1'
      },
      {
        id: 'node_r_in',
        name: 'دخل المقاومة R1 (330Ω)',
        nameEn: 'Resistor R1 In',
        x: 48,
        y: 35,
        type: 'positive',
        baseVoltage: isCircuitPowered ? vBat : 0.0,
        component: 'مقاومة R1'
      },
      {
        id: 'node_led_anode',
        name: 'أنود الليد (LED Anode +)',
        nameEn: 'LED Anode (+)',
        x: 62,
        y: 35,
        type: 'midpoint',
        baseVoltage: isCircuitPowered ? vLedDrop : 0.0,
        component: 'دايود LED'
      },
      {
        id: 'node_led_cathode',
        name: 'كاثود الليد (LED Cathode -)',
        nameEn: 'LED Cathode (-)',
        x: 62,
        y: 65,
        type: 'negative',
        baseVoltage: 0.0,
        component: 'دايود LED'
      },
      {
        id: 'node_pot_wiper',
        name: 'مقسم الجهد (Potentiometer Wiper)',
        nameEn: 'Pot Wiper (0-9V)',
        x: 48,
        y: 75,
        type: 'signal',
        baseVoltage: vWiper,
        component: 'مقاومة متغيرة'
      },
      {
        id: 'node_ac_gen',
        name: 'مولد إشارة متناوبة AC (12V RMS)',
        nameEn: 'AC Generator 50Hz',
        x: 34,
        y: 75,
        type: 'ac',
        baseVoltage: 12.0,
        component: 'مصدر AC'
      }
    ];
  };

  const nodes = getCircuitNodes();

  // Find nearest node within snap threshold (distance < 7% in coordinate space)
  const findSnapNode = (probe: ProbePosition): CircuitNode | null => {
    for (const node of nodes) {
      const dist = Math.hypot(probe.x - node.x, probe.y - node.y);
      if (dist < 6.5) {
        return node;
      }
    }
    return null;
  };

  // Main calculation effect
  useEffect(() => {
    if (!isOn || dial === 'OFF') {
      setReading(' - - - ');
      setReadingUnit('');
      return;
    }

    const redNode = findSnapNode(redProbe);
    const blackNode = findSnapNode(blackProbe);

    // Realistic small fluctuation (0.01V) to mimic true digital meter ADC noise
    const noise = (Math.random() - 0.5) * 0.02;

    if (dial === 'VDC20') {
      setReadingUnit('V DC');
      if (redNode && blackNode) {
        // Differential voltage V = V_red - V_black
        const vDiff = redNode.baseVoltage - blackNode.baseVoltage;
        const val = (vDiff + noise).toFixed(2);
        setReading(val);
      } else if (redNode && !blackNode) {
        // Single probe grounded by stray capacitance
        setReading(((redNode.baseVoltage * 0.1) + noise).toFixed(2));
      } else if (!redNode && blackNode) {
        setReading('0.00');
      } else {
        // Floating probes
        if (Math.random() > 0.8) {
          setReading((Math.random() * 0.04).toFixed(2));
        } else {
          setReading('0.00');
        }
      }
    } else if (dial === 'VDC200M') {
      setReadingUnit('mV DC');
      if (redNode && blackNode) {
        const vDiff = (redNode.baseVoltage - blackNode.baseVoltage) * 1000;
        setReading(vDiff.toFixed(1));
      } else {
        setReading('00.0');
      }
    } else if (dial === 'VAC') {
      setReadingUnit('V AC');
      if ((redNode?.type === 'ac' || blackNode?.type === 'ac')) {
        const acVal = (12.0 + (Math.random() - 0.5) * 0.1).toFixed(2);
        setReading(acVal);
      } else {
        setReading('0.00');
      }
    } else if (dial === 'OHM') {
      setReadingUnit('Ω');
      if (redNode && blackNode) {
        if (redNode.id === blackNode.id) {
          setReading('00.2');
        } else if (
          (redNode.id === 'node_r_in' && blackNode.id === 'node_led_anode') ||
          (blackNode.id === 'node_r_in' && redNode.id === 'node_led_anode')
        ) {
          setReading('330.0');
        } else if (redNode.component === 'مقاومة متغيرة' && blackNode.component === 'مقاومة متغيرة') {
          const potR = Math.round(10000 * (potentiometerValue / 100));
          setReading(potR >= 1000 ? `${(potR / 1000).toFixed(2)} kΩ` : `${potR} Ω`);
        } else {
          setReading('O.L');
        }
      } else {
        setReading('O.L');
      }
    } else if (dial === 'ADC') {
      setReadingUnit('mA DC');
      if (isCircuitPowered && redNode && blackNode && (redNode.id !== blackNode.id)) {
        // Current through the branch I = (V_bat - 2.1) / 330 = ~20.9 mA
        const currentMA = ((batteryVoltage - 2.15) / 330) * 1000;
        setReading((currentMA + noise * 10).toFixed(2));
      } else {
        setReading('0.00');
      }
    } else if (dial === 'CONT') {
      setReadingUnit('CONT 🔊 )))');
      if (redNode && blackNode) {
        const isShort = redNode.id === blackNode.id || 
          (redNode.type === 'negative' && blackNode.type === 'negative') ||
          (redNode.baseVoltage === blackNode.baseVoltage && redNode.type === blackNode.type);
        if (isShort) {
          setReading('00.1 Ω');
          playTone(2800, 0.1);
        } else {
          setReading('OPEN');
        }
      } else {
        setReading('OPEN');
      }
    }
  }, [isOn, dial, redProbe, blackProbe, isCircuitPowered, batteryVoltage, potentiometerValue]);

  // Handle pointer move on bench canvas
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !benchRef.current) return;
    const rect = benchRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const rawX = ((clientX - rect.left) / rect.width) * 100;
    const rawY = ((clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(4, Math.min(96, rawX));
    const clampedY = Math.max(6, Math.min(94, rawY));

    if (isDragging === 'red') {
      setRedProbe({ x: clampedX, y: clampedY });
    } else {
      setBlackProbe({ x: clampedX, y: clampedY });
    }
  };

  // Preset experiment loader
  const loadPreset = (preset: 'battery' | 'led' | 'divider' | 'ac') => {
    setActiveExperiment(preset);
    playTone(1800, 0.08);

    if (preset === 'battery') {
      setDial('VDC20');
      setIsCircuitPowered(true);
      setRedProbe({ x: 14, y: 35, snappedNodeId: 'node_bat_pos' });
      setBlackProbe({ x: 14, y: 65, snappedNodeId: 'node_bat_neg' });
    } else if (preset === 'led') {
      setDial('VDC20');
      setIsCircuitPowered(true);
      setRedProbe({ x: 62, y: 35, snappedNodeId: 'node_led_anode' });
      setBlackProbe({ x: 62, y: 65, snappedNodeId: 'node_led_cathode' });
    } else if (preset === 'divider') {
      setDial('VDC20');
      setIsCircuitPowered(true);
      setRedProbe({ x: 48, y: 75, snappedNodeId: 'node_pot_wiper' });
      setBlackProbe({ x: 14, y: 65, snappedNodeId: 'node_bat_neg' });
    } else if (preset === 'ac') {
      setDial('VAC');
      setRedProbe({ x: 34, y: 75, snappedNodeId: 'node_ac_gen' });
      setBlackProbe({ x: 14, y: 65, snappedNodeId: 'node_bat_neg' });
    }
  };

  // Snap probe to node directly on click
  const snapProbeToNode = (probe: 'red' | 'black', node: CircuitNode) => {
    playTone(probe === 'red' ? 2200 : 1500, 0.06);
    if (probe === 'red') {
      setRedProbe({ x: node.x, y: node.y, snappedNodeId: node.id });
    } else {
      setBlackProbe({ x: node.x, y: node.y, snappedNodeId: node.id });
    }
  };

  // Compute needle angle for analog meter (-60deg to +60deg)
  const numericVal = parseFloat(reading) || 0;
  const maxScale = dial === 'VDC20' ? 20 : dial === 'VAC' ? 30 : dial === 'ADC' ? 200 : 20;
  const normalizedFraction = Math.max(-0.2, Math.min(1.2, numericVal / maxScale));
  const needleAngle = -60 + normalizedFraction * 120;

  return (
    <div className="w-full max-w-6xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100 font-sans select-none" dir="rtl">
      {/* Simulator Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shadow-inner">
            <Gauge className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">محاكي الفولتميتر والملتيميتر العملي المتقدم (Voltmeter Lab)</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                PRO RMS 600V
              </span>
            </div>
            <p className="text-xs text-slate-400">
              اسحب المجسات بأصبعك أو بالفأرة وضعها على أي نقطة لاختبار الجهد، التيار، أو المقاومة واقعياً
            </p>
          </div>
        </div>

        {/* Top Control Bar: Audio toggle & Meter Type */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              playTone(2000, 0.05);
              setSoundEnabled(!soundEnabled);
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs flex items-center gap-1.5"
            title="كتم/تفعيل صوت الرنين"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span className="text-[11px] font-semibold">{soundEnabled ? 'الصوت مفعّل' : 'الصوت مكتوم'}</span>
          </button>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMeterType('digital')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                meterType === 'digital' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              شاشة رقمية (Digital LCD)
            </button>
            <button
              onClick={() => setMeterType('analog')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                meterType === 'analog' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              مؤشر تماثلي (Analog Needle)
            </button>
          </div>
        </div>
      </div>

      {/* Preset Experiments Bar */}
      <div className="my-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-amber-400 flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            تجارب قياس جاهزة:
          </span>
          <button
            onClick={() => loadPreset('battery')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              activeExperiment === 'battery' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            1. قياس جهد البطارية (9V DC)
          </button>
          <button
            onClick={() => loadPreset('led')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              activeExperiment === 'led' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            2. قياس هبوط جهد الليد (LED Drop)
          </button>
          <button
            onClick={() => loadPreset('divider')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              activeExperiment === 'divider' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            3. قياس مقسم الجهد (Potentiometer Wiper)
          </button>
          <button
            onClick={() => loadPreset('ac')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              activeExperiment === 'ac' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            4. قياس جهد متناوب (AC RMS)
          </button>
        </div>

        {/* Circuit power toggle & battery adjust */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playTone(1200, 0.08);
              setIsCircuitPowered(!isCircuitPowered);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs ${
              isCircuitPowered ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>تغذية الدائرة: {isCircuitPowered ? 'موصولة (ON)' : 'مفصولة (OFF)'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Workbench (Canvas with Circuit & Voltmeter) */}
      <div className="w-full overflow-x-auto rounded-2xl border-2 border-slate-800 shadow-2xl bg-slate-950 no-scrollbar">
        <div
          ref={benchRef}
          onPointerMove={handlePointerMove}
          onPointerUp={() => setIsDragging(null)}
          onPointerLeave={() => setIsDragging(null)}
          className="relative bg-gradient-to-b from-slate-950 via-[#0b1329] to-slate-950 min-w-[780px] w-full h-[520px] overflow-hidden select-none touch-none cursor-default"
        >
        {/* Subtle grid lines background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

        {/* SVG Wiring Layer connecting components and Probes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
          {/* Circuit Connection Tracks on the workbench board */}
          {/* Battery + to Switch */}
          <line x1="14%" y1="35%" x2="34%" y2="35%" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
          {/* Switch to Resistor R1 */}
          <line
            x1="34%"
            y1="35%"
            x2="48%"
            y2="35%"
            stroke={isCircuitPowered ? '#10b981' : '#64748b'}
            strokeWidth="3.5"
            strokeDasharray={isCircuitPowered ? 'none' : '4,4'}
          />
          {/* Resistor R1 to LED Anode */}
          <line x1="48%" y1="35%" x2="62%" y2="35%" stroke={isCircuitPowered ? '#10b981' : '#64748b'} strokeWidth="3.5" />
          {/* LED Cathode to GND rail */}
          <line x1="62%" y1="65%" x2="14%" y2="65%" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="62%" y1="65%" x2="14%" y2="65%" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          {/* Potentiometer track */}
          <line x1="14%" y1="35%" x2="48%" y2="75%" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" opacity="0.4" />
          <line x1="14%" y1="65%" x2="48%" y2="75%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3,3" opacity="0.4" />

          {/* Flexible RED Probe Wire droop curved to meter terminal (approx 85%, 70%) */}
          <path
            d={`M ${redProbe.x}% ${redProbe.y}% Q ${Math.max(redProbe.x, 82)}% ${Math.max(redProbe.y, 60) + 15}% 85% 76%`}
            stroke="#ef4444"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.7))' }}
          />

          {/* Flexible BLACK Probe Wire droop curved to meter COM terminal (approx 91%, 76%) */}
          <path
            d={`M ${blackProbe.x}% ${blackProbe.y}% Q ${Math.min(blackProbe.x, 70)}% ${Math.max(blackProbe.y, 75) + 12}% 91% 76%`}
            stroke="#1e293b"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.7))' }}
          />
          <path
            d={`M ${blackProbe.x}% ${blackProbe.y}% Q ${Math.min(blackProbe.x, 70)}% ${Math.max(blackProbe.y, 75) + 12}% 91% 76%`}
            stroke="#475569"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* 1. PHYSICAL 9V / DC BATTERY */}
        <div
          style={{ left: '8%', top: '24%' }}
          className="absolute w-28 h-56 bg-slate-900 border-2 border-slate-700 rounded-2xl flex flex-col justify-between items-center p-3 shadow-2xl z-10 select-none"
        >
          {/* Terminal buttons */}
          <div className="w-full flex justify-between items-center px-1">
            <button
              onClick={() => snapProbeToNode('red', nodes[0])}
              className="flex flex-col items-center hover:scale-110 transition"
              title="توصيل القطب الموجب"
            >
              <div className="w-6 h-6 rounded-full bg-red-600 border-2 border-white flex items-center justify-center font-black text-xs text-white shadow-lg">
                +
              </div>
              <span className="text-[9px] font-mono font-bold text-red-400 mt-0.5">+{batteryVoltage}V</span>
            </button>
            <button
              onClick={() => snapProbeToNode('black', nodes[1])}
              className="flex flex-col items-center hover:scale-110 transition"
              title="توصيل القطب السالب (GND)"
            >
              <div className="w-6 h-6 rounded-full bg-slate-950 border-2 border-blue-400 flex items-center justify-center font-black text-xs text-blue-300 shadow-lg">
                -
              </div>
              <span className="text-[9px] font-mono font-bold text-blue-400 mt-0.5">GND</span>
            </button>
          </div>

          {/* Battery Body Graphic */}
          <div className="w-full bg-gradient-to-b from-amber-500 to-amber-700 rounded-xl p-2.5 text-center shadow-inner">
            <span className="font-black text-base tracking-widest text-slate-950 block">ALKALINE</span>
            <span className="font-extrabold text-2xl text-slate-950 font-mono block">{batteryVoltage}V</span>
            <span className="text-[10px] text-slate-900 font-bold block mt-1">BATTERY 6LR61</span>
          </div>

          {/* Voltage slider for battery */}
          <div className="w-full text-center">
            <input
              type="range"
              min="1.5"
              max="15.0"
              step="0.5"
              value={batteryVoltage}
              onChange={(e) => setBatteryVoltage(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              title="تغيير جهد البطارية"
            />
            <span className="text-[9px] text-slate-400 block mt-1">جهد البطارية: {batteryVoltage}V</span>
          </div>
        </div>

        {/* 2. THE EXPERIMENTAL BREADBOARD / TEST CIRCUIT */}
        <div
          style={{ left: '30%', top: '16%' }}
          className="absolute w-[44%] h-[72%] bg-emerald-950/70 border-4 border-emerald-700 rounded-3xl shadow-2xl p-4 z-10 flex flex-col justify-between"
        >
          {/* Breadboard Header */}
          <div className="flex justify-between items-center border-b border-emerald-800/70 pb-2">
            <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              لوحة اختبار الدوائر العملية (Laboratory Test Circuit)
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              {isCircuitPowered ? 'POWER BUS: ACTIVE' : 'POWER BUS: OPEN'}
            </span>
          </div>

          {/* Components on board: Switch, Resistor, LED, Potentiometer, AC Source */}
          <div className="grid grid-cols-3 gap-3 my-auto items-center">
            {/* Component 1: Toggle Switch */}
            <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-2.5 flex flex-col items-center justify-between h-28 shadow-lg text-center">
              <span className="text-[10px] font-bold text-slate-300">مفتاح SW1</span>
              <button
                onClick={() => {
                  playTone(1000, 0.05);
                  setIsCircuitPowered(!isCircuitPowered);
                }}
                className={`w-9 h-9 rounded-xl border-2 font-black text-xs flex items-center justify-center transition shadow ${
                  isCircuitPowered ? 'bg-emerald-600 border-emerald-400 text-white scale-105' : 'bg-slate-800 border-slate-600 text-slate-400'
                }`}
              >
                {isCircuitPowered ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => snapProbeToNode('red', nodes[2])}
                className="text-[9px] text-emerald-400 hover:underline font-mono"
              >
                خرج المفتاح
              </button>
            </div>

            {/* Component 2: Resistor R1 */}
            <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-2.5 flex flex-col items-center justify-between h-28 shadow-lg text-center">
              <span className="text-[10px] font-bold text-slate-300">مقاومة R1 (330Ω)</span>
              {/* Resistor graphic */}
              <div className="w-16 h-5 bg-amber-100 rounded-full border border-amber-400 flex items-center justify-around px-1 shadow">
                <div className="w-1.5 h-full bg-orange-700 rounded" />
                <div className="w-1.5 h-full bg-orange-700 rounded" />
                <div className="w-1.5 h-full bg-amber-950 rounded" />
                <div className="w-1.5 h-full bg-amber-500 rounded" />
              </div>
              <span className="text-[9px] text-amber-300 font-mono">هبوط ~{(batteryVoltage - 2.15).toFixed(2)}V</span>
            </div>

            {/* Component 3: LED / Lamp */}
            <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-2.5 flex flex-col items-center justify-between h-28 shadow-lg text-center">
              <span className="text-[10px] font-bold text-slate-300">دايود ضوئي LED</span>
              {/* Glowing Bulb */}
              <div
                className={`w-10 h-10 rounded-full border-2 border-amber-300 flex items-center justify-center transition-all duration-300 ${
                  isCircuitPowered ? 'bg-amber-400 shadow-[0_0_35px_#f59e0b]' : 'bg-slate-800 opacity-60'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-white/80" />
              </div>
              <span className="text-[9px] text-amber-300 font-mono">
                {isCircuitPowered ? 'مضيء (Vf = 2.15V)' : 'مطفأ (0V)'}
              </span>
            </div>
          </div>

          {/* Lower Row: Potentiometer Divider & AC Source */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-800/60">
            {/* Potentiometer */}
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
                <span>مقاومة متغيرة (مقسم جهد):</span>
                <span className="text-amber-400 font-mono">{potentiometerValue}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={potentiometerValue}
                onChange={(e) => setPotentiometerValue(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-[9px] text-emerald-400 font-mono">
                جهد المخرج: {(batteryVoltage * (potentiometerValue / 100)).toFixed(2)} V
              </span>
            </div>

            {/* AC Source */}
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-300">مصدر متناوب AC Sine (12V)</span>
              <span className="text-[9px] font-mono text-cyan-400">12.0 V RMS • 50 Hz</span>
              <button
                onClick={() => snapProbeToNode('red', nodes[7])}
                className="text-[9px] text-cyan-300 hover:underline font-mono text-right"
              >
                + قياس هذا المصدر
              </button>
            </div>
          </div>
        </div>

        {/* 3. PHYSICAL DIGITAL / ANALOG MULTIMETER HOUSING (RIGHT BENCH) */}
        <div
          style={{ right: '2%', top: '10%' }}
          className="absolute w-60 h-[80%] bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 border-4 border-amber-700 rounded-3xl shadow-2xl p-3 z-10 flex flex-col justify-between text-slate-950 font-sans"
        >
          {/* Brand & On/Off Switch */}
          <div className="flex justify-between items-center border-b-2 border-amber-600/60 pb-1.5">
            <div>
              <h4 className="font-black text-sm tracking-tight text-slate-950">FLUKE 87V</h4>
              <span className="text-[8px] font-bold text-slate-800 block">TRUE RMS VOLTMETER</span>
            </div>
            <button
              onClick={() => {
                playTone(1500, 0.06);
                setIsOn(!isOn);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition ${
                isOn ? 'bg-slate-950 text-emerald-400 border-slate-800 shadow' : 'bg-slate-700 text-slate-300 border-slate-600'
              }`}
            >
              {isOn ? 'تشغيل' : 'إطفاء'}
            </button>
          </div>

          {/* METER DISPLAY: Digital LCD or Analog Needle */}
          {meterType === 'digital' ? (
            /* Digital 7-Segment LCD Display */
            <div
              dir="ltr"
              className="bg-[#a3e635]/80 p-2.5 rounded-xl border-4 border-slate-800 shadow-inner font-mono text-slate-950 flex flex-col justify-between h-28 force-ltr"
              style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
            >
              <div className="flex justify-between items-center text-[10px] font-black opacity-80" dir="ltr">
                <span>AUTO RANGE</span>
                <span>{readingUnit}</span>
                <span>{soundEnabled && '🔊'}</span>
              </div>
              <div className="text-3xl font-black tracking-tight text-center my-auto force-ltr" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                {reading}
              </div>
              {/* Analog bar-graph emulation */}
              <div className="w-full bg-slate-950/20 h-1.5 rounded-full overflow-hidden" dir="ltr">
                <div
                  className="bg-slate-950 h-full transition-all duration-150"
                  style={{ width: `${Math.min(100, Math.max(0, (Math.abs(numericVal) / 20) * 100))}%` }}
                />
              </div>
            </div>
          ) : (
            /* Classic Moving-Coil Galvanometer Analog Meter */
            <div className="bg-slate-100 p-2 rounded-xl border-4 border-slate-800 shadow-inner relative h-28 overflow-hidden flex flex-col justify-between" dir="ltr" style={{ direction: 'ltr' }}>
              {/* Dial Arc Scale */}
              <svg className="w-full h-16 overflow-visible" style={{ direction: 'ltr' }}>
                <path d="M 20 50 A 60 60 0 0 1 180 50" fill="none" stroke="#334155" strokeWidth="2.5" />
                {/* Scale Ticks */}
                <text x="25" y="45" fontSize="7" fontWeight="bold">0V</text>
                <text x="60" y="32" fontSize="7" fontWeight="bold">5V</text>
                <text x="96" y="27" fontSize="7" fontWeight="bold">10V</text>
                <text x="135" y="32" fontSize="7" fontWeight="bold">15V</text>
                <text x="170" y="45" fontSize="7" fontWeight="bold">20V</text>
                {/* Needle */}
                <line
                  x1="100"
                  y1="55"
                  x2="100"
                  y2="15"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{
                    transformOrigin: '100px 55px',
                    transform: `rotate(${needleAngle}deg)`,
                    transition: 'transform 0.2s ease-out'
                  }}
                />
                <circle cx="100" cy="55" r="4.5" fill="#0f172a" />
              </svg>
              <div className="text-center font-mono font-black text-xs text-slate-900 border-t border-slate-300 pt-0.5">
                القراءة التماثلية: {reading} {readingUnit}
              </div>
            </div>
          )}

          {/* Rotary Selector Dial */}
          <div className="bg-slate-950 p-2 rounded-2xl text-white flex flex-col gap-1.5 shadow-md">
            <span className="text-[9px] text-center text-amber-400 font-bold block">مفتاح القياس (Rotary Dial)</span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => {
                  playTone(1900, 0.04);
                  setDial('VDC20');
                }}
                className={`py-1 rounded text-[10px] font-bold transition ${
                  dial === 'VDC20' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                V (DC) 20V
              </button>
              <button
                onClick={() => {
                  playTone(1900, 0.04);
                  setDial('VDC200M');
                }}
                className={`py-1 rounded text-[10px] font-bold transition ${
                  dial === 'VDC200M' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                200mV
              </button>
              <button
                onClick={() => {
                  playTone(1900, 0.04);
                  setDial('VAC');
                }}
                className={`py-1 rounded text-[10px] font-bold transition ${
                  dial === 'VAC' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                V (AC) ~
              </button>
              <button
                onClick={() => {
                  playTone(1900, 0.04);
                  setDial('OHM');
                }}
                className={`py-1 rounded text-[10px] font-bold transition ${
                  dial === 'OHM' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Ω أوم
              </button>
              <button
                onClick={() => {
                  playTone(1900, 0.04);
                  setDial('ADC');
                }}
                className={`py-1 rounded text-[10px] font-bold transition ${
                  dial === 'ADC' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                mA (تيار)
              </button>
              <button
                onClick={() => {
                  playTone(1900, 0.04);
                  setDial('CONT');
                }}
                className={`py-1 rounded text-[10px] font-bold transition ${
                  dial === 'CONT' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                رنين )))
              </button>
            </div>
          </div>

          {/* Meter Input Banana Jacks */}
          <div className="flex justify-around items-center pt-1 border-t-2 border-amber-600/50">
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-red-900 shadow-inner flex items-center justify-center text-[9px] font-black text-white">
                V
              </div>
              <span className="text-[8px] font-bold text-slate-900">V / Ω (+)</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-slate-800 shadow-inner flex items-center justify-center text-[9px] font-black text-white">
                COM
              </div>
              <span className="text-[8px] font-bold text-slate-900">COM (-)</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-amber-700 border-2 border-amber-900 shadow-inner flex items-center justify-center text-[9px] font-black text-white">
                A
              </div>
              <span className="text-[8px] font-bold text-slate-900">10A Max</span>
            </div>
          </div>
        </div>

        {/* 4. CLICKABLE CIRCUIT TEST TERMINALS (OVERLAY ON NODES) */}
        {nodes.map((node) => {
          const isRedHere = findSnapNode(redProbe)?.id === node.id;
          const isBlackHere = findSnapNode(blackProbe)?.id === node.id;
          return (
            <div
              key={node.id}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center pointer-events-auto"
            >
              <div className="flex items-center gap-1">
                {/* Node touch target button */}
                <button
                  onClick={() => snapProbeToNode('red', node)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-125 shadow-lg ${
                    node.type === 'positive'
                      ? 'bg-red-600 border-red-300'
                      : node.type === 'negative'
                      ? 'bg-slate-950 border-blue-400'
                      : node.type === 'signal'
                      ? 'bg-amber-400 border-yellow-200'
                      : 'bg-cyan-500 border-cyan-200'
                  }`}
                  title={`${node.name} (${node.baseVoltage.toFixed(2)}V) - انقر لتثبيت مجس R`}
                >
                  <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                </button>
              </div>
              {/* Node Voltage Tag */}
              <span className="mt-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-slate-950/90 text-slate-300 border border-slate-700 pointer-events-none whitespace-nowrap shadow">
                {node.nameEn}: {node.baseVoltage.toFixed(2)}V
              </span>
            </div>
          );
        })}

        {/* 5. DRAGGABLE VIRTUAL PROBES (R = RED, B = BLACK) */}
        {/* RED PROBE (+) */}
        <div
          style={{ left: `${redProbe.x}%`, top: `${redProbe.y}%` }}
          onPointerDown={() => setIsDragging('red')}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-40 cursor-grab active:cursor-grabbing flex flex-col items-center"
        >
          {/* Metal Probe Pin */}
          <div className="w-1.5 h-6 bg-slate-200 border border-slate-400 rounded-t" />
          {/* Insulated Plastic Handle */}
          <div className="w-8 h-12 bg-red-600 border-2 border-white rounded-xl shadow-2xl flex flex-col items-center justify-center text-white font-black text-xs ring-4 ring-red-900/40">
            <span>R</span>
            <span className="text-[8px] font-bold mt-0.5">+</span>
          </div>
          <span className="text-[9px] font-bold font-mono text-red-400 mt-1 bg-slate-950/80 px-1 rounded border border-red-800">
            المجس الأحمر (+)
          </span>
        </div>

        {/* BLACK PROBE (COM / -) */}
        <div
          style={{ left: `${blackProbe.x}%`, top: `${blackProbe.y}%` }}
          onPointerDown={() => setIsDragging('black')}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-40 cursor-grab active:cursor-grabbing flex flex-col items-center"
        >
          {/* Metal Probe Pin */}
          <div className="w-1.5 h-6 bg-slate-200 border border-slate-400 rounded-t" />
          {/* Insulated Plastic Handle */}
          <div className="w-8 h-12 bg-slate-950 border-2 border-white rounded-xl shadow-2xl flex flex-col items-center justify-center text-white font-black text-xs ring-4 ring-slate-800">
            <span>B</span>
            <span className="text-[8px] font-bold mt-0.5">-</span>
          </div>
          <span className="text-[9px] font-bold font-mono text-slate-300 mt-1 bg-slate-950/80 px-1 rounded border border-slate-800">
            المجس الأسود (COM)
          </span>
        </div>
      </div>
    </div>

      {/* Educational Guide Footer */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
          <span className="font-bold text-amber-400 flex items-center gap-1.5">
            <Info className="w-4 h-4" />
            طريقة تحريك المجسات (Probes):
          </span>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            اسحب المجس الأحمر (R +) أو الأسود (B -) بأصبعك إلى أي طرف أو انقر على النقطة الملونة ليلتصق المجس بها فورياً.
          </p>
        </div>
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            قياس فرق الجهد (Parallel):
          </span>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            يقيس الفولتميتر <strong>فرق الجهد بين النقطتين</strong> عملياً (V = V1 - V2). لقياس جهد بطارية أو ليد، ضع مجساً في الدخل والآخر في الخرج.
          </p>
        </div>
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
          <span className="font-bold text-purple-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            المقاومة واختبار الرنين:
          </span>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            أدر المفتاح إلى أوم (Ω) أو الرنين (🔊) لقياس المقاومة المتغيرة وفحص التوصيل مع صوت تنبيه إذا كانت المقاومة أقل من 10 أوم.
          </p>
        </div>
      </div>
    </div>
  );
};
