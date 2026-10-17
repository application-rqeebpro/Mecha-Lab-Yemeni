import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  Trash2, 
  RotateCcw, 
  Plus, 
  CheckCircle2, 
  Palette, 
  Scissors, 
  Info, 
  Play, 
  Sliders, 
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Gauge,
  Activity,
  Crosshair
} from 'lucide-react';

export interface BreadboardPort {
  id: string;
  name: string;
  type: 'power_vcc' | 'power_gnd' | 'signal' | 'analog' | 'component_pin';
  x: number;
  y: number;
  componentId?: string;
  componentName?: string;
  voltage?: number;
}

export interface InteractiveWire {
  id: string;
  fromPortId: string;
  fromName: string;
  fromPos: { x: number; y: number };
  toPortId: string;
  toName: string;
  toPos: { x: number; y: number };
  color: string;
  voltage?: number;
  isCarryingCurrent?: boolean;
}

export interface PlacedComponent {
  id: string;
  type: 'arduino' | 'resistor' | 'led' | 'dc_motor' | 'servo' | 'pushbutton' | 'potentiometer' | 'hc_sr04';
  name: string;
  x: number;
  y: number;
  value?: number;
  unit?: string;
  state?: {
    active?: boolean;
    rpm?: number;
    angle?: number;
    pressed?: boolean;
    potPercent?: number;
    color?: string;
  };
}

const WIRE_COLORS = [
  { name: 'أحمر (+VCC)', value: '#ef4444', textLight: true },
  { name: 'أسود (GND)', value: '#0f172a', border: '#475569', textLight: true },
  { name: 'أزرق (Blue)', value: '#3b82f6', textLight: true },
  { name: 'أصفر (Signal)', value: '#eab308', textLight: false },
  { name: 'أخضر (Green)', value: '#10b981', textLight: true },
  { name: 'برتقالي (Orange)', value: '#f97316', textLight: false },
  { name: 'بنفسجي (Purple)', value: '#a855f7', textLight: true },
  { name: 'أبيض (White)', value: '#f8fafc', border: '#94a3b8', textLight: false },
];

interface InteractiveBreadboardProps {
  supplyVoltage?: number;
  isSupplyOn?: boolean;
  onProbeMeasurement?: (voltage: number, current: number, resistance: number) => void;
}

export const InteractiveBreadboard: React.FC<InteractiveBreadboardProps> = ({
  supplyVoltage = 5.0,
  isSupplyOn = true,
  onProbeMeasurement,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active wire drawing color
  const [selectedWireColor, setSelectedWireColor] = useState<string>('#ef4444');

  // Voltmeter / Ammeter Probes State & Active Tool
  const [activeTool, setActiveTool] = useState<'wire' | 'probe_red' | 'probe_black'>('wire');
  const [redProbePortId, setRedProbePortId] = useState<string | null>('led_1_anode');
  const [blackProbePortId, setBlackProbePortId] = useState<string | null>('ard_1_gnd_1');

  // Currently pending port while drawing a wire
  const [pendingPort, setPendingPort] = useState<BreadboardPort | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 0.65 : 1.0));

  // Placed components on the lab bench
  const [components, setComponents] = useState<PlacedComponent[]>([
    {
      id: 'ard_1',
      type: 'arduino',
      name: 'أردوينو Uno R3',
      x: 40,
      y: 60,
      state: { active: true }
    },
    {
      id: 'r_1',
      type: 'resistor',
      name: 'مقاومة R1 (220Ω)',
      x: 480,
      y: 70,
      value: 220,
      unit: 'Ω'
    },
    {
      id: 'led_1',
      type: 'led',
      name: 'دايود ضوئي LED أحمر',
      x: 650,
      y: 70,
      state: { active: false, color: '#ef4444' }
    },
    {
      id: 'btn_1',
      type: 'pushbutton',
      name: 'مفتاح ضاغط SW1',
      x: 480,
      y: 200,
      state: { pressed: false }
    },
    {
      id: 'mot_1',
      type: 'dc_motor',
      name: 'محرك DC Motor 5V',
      x: 650,
      y: 200,
      state: { active: false, rpm: 0 }
    },
    {
      id: 'srv_1',
      type: 'servo',
      name: 'سيرفو SG90',
      x: 820,
      y: 120,
      state: { angle: 90 }
    }
  ]);

  // Wires connected in the circuit
  const [wires, setWires] = useState<InteractiveWire[]>([
    // Initial pre-wired demo: Arduino 5V -> Resistor -> LED -> GND
    {
      id: 'w_demo_1',
      fromPortId: 'ard_1_5v',
      fromName: 'Arduino 5V',
      fromPos: { x: 190, y: 310 },
      toPortId: 'r_1_p1',
      toName: 'R1 Pin 1',
      toPos: { x: 485, y: 125 },
      color: '#ef4444',
      isCarryingCurrent: true
    },
    {
      id: 'w_demo_2',
      fromPortId: 'r_1_p2',
      fromName: 'R1 Pin 2',
      fromPos: { x: 575, y: 125 },
      toPortId: 'led_1_anode',
      toName: 'LED Anode (+)',
      toPos: { x: 670, y: 140 },
      color: '#ef4444',
      isCarryingCurrent: true
    },
    {
      id: 'w_demo_3',
      fromPortId: 'led_1_cathode',
      fromName: 'LED Cathode (-)',
      fromPos: { x: 710, y: 140 },
      toPortId: 'ard_1_gnd_1',
      toName: 'Arduino GND',
      toPos: { x: 210, y: 310 },
      color: '#0f172a',
      isCarryingCurrent: true
    }
  ]);

  // Selected wire for deletion
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);

  // Define All Ports / Pins dynamically based on placed components and Breadboard
  const getAvailablePorts = (): BreadboardPort[] => {
    const list: BreadboardPort[] = [];

    // 1. Breadboard Tie Points and Power Rails (Full Center Breadboard)
    const bbStartX = 340;
    const bbStartY = 360;
    const bbCols = 15; // 15 columns for visual cleanliness

    // Positive (+) Power Rail Holes
    for (let i = 0; i < bbCols; i++) {
      list.push({
        id: `bb_vcc_${i}`,
        name: `مسار التغذية (+) ثقب ${i + 1}`,
        type: 'power_vcc',
        x: bbStartX + i * 40,
        y: bbStartY,
      });
    }

    // Negative (-) Power Rail Holes
    for (let i = 0; i < bbCols; i++) {
      list.push({
        id: `bb_gnd_${i}`,
        name: `مسار الأرضي (-) ثقب ${i + 1}`,
        type: 'power_gnd',
        x: bbStartX + i * 40,
        y: bbStartY + 26,
      });
    }

    // Upper Component Holes (Row A to E)
    for (let i = 0; i < bbCols; i++) {
      list.push({
        id: `bb_hole_top_${i}`,
        name: `ثقب T-${i + 1}`,
        type: 'signal',
        x: bbStartX + i * 40,
        y: bbStartY + 70,
      });
      list.push({
        id: `bb_hole_mid_${i}`,
        name: `ثقب M-${i + 1}`,
        type: 'signal',
        x: bbStartX + i * 40,
        y: bbStartY + 105,
      });
    }

    // Lower Component Holes (Row F to J)
    for (let i = 0; i < bbCols; i++) {
      list.push({
        id: `bb_hole_bot_${i}`,
        name: `ثقب B-${i + 1}`,
        type: 'signal',
        x: bbStartX + i * 40,
        y: bbStartY + 160,
      });
    }

    // Lower Negative (-) Rail
    for (let i = 0; i < bbCols; i++) {
      list.push({
        id: `bb_gnd_low_${i}`,
        name: `مسار الأرضي السفلي ${i + 1}`,
        type: 'power_gnd',
        x: bbStartX + i * 40,
        y: bbStartY + 200,
      });
    }

    // 2. Component Pins based on component positions
    components.forEach((c) => {
      if (c.type === 'arduino') {
        // Digital Pins
        list.push({ id: `${c.id}_d13`, name: 'Arduino Pin D13', type: 'signal', x: c.x + 150, y: c.y + 40 });
        list.push({ id: `${c.id}_d9`, name: 'Arduino Pin D9 (PWM)', type: 'signal', x: c.x + 190, y: c.y + 40 });
        list.push({ id: `${c.id}_d8`, name: 'Arduino Pin D8', type: 'signal', x: c.x + 205, y: c.y + 40 });
        list.push({ id: `${c.id}_gnd_d`, name: 'Arduino GND (Digital)', type: 'power_gnd', x: c.x + 165, y: c.y + 40 });
        // Power & Analog Pins
        list.push({ id: `${c.id}_5v`, name: 'Arduino 5V Power', type: 'power_vcc', x: c.x + 150, y: c.y + 250 });
        list.push({ id: `${c.id}_3v3`, name: 'Arduino 3.3V', type: 'power_vcc', x: c.x + 135, y: c.y + 250 });
        list.push({ id: `${c.id}_gnd_1`, name: 'Arduino GND 1', type: 'power_gnd', x: c.x + 170, y: c.y + 250 });
        list.push({ id: `${c.id}_gnd_2`, name: 'Arduino GND 2', type: 'power_gnd', x: c.x + 185, y: c.y + 250 });
        list.push({ id: `${c.id}_a0`, name: 'Arduino Analog A0', type: 'analog', x: c.x + 215, y: c.y + 250 });
        list.push({ id: `${c.id}_a1`, name: 'Arduino Analog A1', type: 'analog', x: c.x + 230, y: c.y + 250 });
      }
      if (c.type === 'resistor') {
        list.push({ id: `${c.id}_p1`, name: `${c.name} طرف 1`, type: 'component_pin', x: c.x + 5, y: c.y + 55 });
        list.push({ id: `${c.id}_p2`, name: `${c.name} طرف 2`, type: 'component_pin', x: c.x + 95, y: c.y + 55 });
      }
      if (c.type === 'led') {
        list.push({ id: `${c.id}_anode`, name: `${c.name} مصعد Anode (+)`, type: 'component_pin', x: c.x + 20, y: c.y + 70 });
        list.push({ id: `${c.id}_cathode`, name: `${c.name} مهبط Cathode (-)`, type: 'component_pin', x: c.x + 60, y: c.y + 70 });
      }
      if (c.type === 'dc_motor') {
        list.push({ id: `${c.id}_pos`, name: `${c.name} موجب (+)`, type: 'component_pin', x: c.x + 25, y: c.y + 90 });
        list.push({ id: `${c.id}_neg`, name: `${c.name} سالب (-)`, type: 'component_pin', x: c.x + 65, y: c.y + 90 });
      }
      if (c.type === 'servo') {
        list.push({ id: `${c.id}_vcc`, name: `${c.name} تغذية VCC (أحمر)`, type: 'power_vcc', x: c.x + 20, y: c.y + 95 });
        list.push({ id: `${c.id}_gnd`, name: `${c.name} أرضي GND (بني)`, type: 'power_gnd', x: c.x + 40, y: c.y + 95 });
        list.push({ id: `${c.id}_sig`, name: `${c.name} إشارة Signal (برتقالي)`, type: 'signal', x: c.x + 60, y: c.y + 95 });
      }
      if (c.type === 'pushbutton') {
        list.push({ id: `${c.id}_pin1`, name: `${c.name} طرف 1`, type: 'component_pin', x: c.x + 15, y: c.y + 60 });
        list.push({ id: `${c.id}_pin2`, name: `${c.name} طرف 2`, type: 'component_pin', x: c.x + 65, y: c.y + 60 });
      }
    });

    return list;
  };

  const allPorts = getAvailablePorts();

  // Pure derived state for circuit continuity (no setState needed)
  const isVCCConnectedToR = wires.some(
    w => ((w.fromPortId.includes('5v') || w.fromPortId.includes('vcc')) && w.toPortId.includes('r_1')) ||
         ((w.toPortId.includes('5v') || w.toPortId.includes('vcc')) && w.fromPortId.includes('r_1'))
  );

  const isRConnectedToLED = wires.some(
    w => (w.fromPortId.includes('r_1') && w.toPortId.includes('led_1')) ||
         (w.toPortId.includes('r_1') && w.fromPortId.includes('led_1'))
  );

  const isLEDConnectedToGND = wires.some(
    w => (w.fromPortId.includes('led_1') && w.toPortId.includes('gnd')) ||
         (w.toPortId.includes('led_1') && w.fromPortId.includes('gnd'))
  );

  const isLEDActive = isSupplyOn && isVCCConnectedToR && isRConnectedToLED && isLEDConnectedToGND;

  const motorPosConnected = wires.some(
    w => (w.fromPortId.includes('mot_1_pos') && (w.toPortId.includes('5v') || w.toPortId.includes('vcc') || w.toPortId.includes('d9'))) ||
         (w.toPortId.includes('mot_1_pos') && (w.fromPortId.includes('5v') || w.fromPortId.includes('vcc') || w.fromPortId.includes('d9')))
  );

  const motorNegConnected = wires.some(
    w => (w.fromPortId.includes('mot_1_neg') && w.toPortId.includes('gnd')) ||
         (w.toPortId.includes('mot_1_neg') && w.fromPortId.includes('gnd'))
  );

  const isMotorActive = isSupplyOn && motorPosConnected && motorNegConnected;

  // Calculate potential at any port dynamically
  const getPortPotential = (portId: string | null): number => {
    if (!portId) return 0;
    if (
      portId.includes('gnd') || 
      portId.includes('bb_gnd') || 
      portId === 'led_1_cathode' || 
      portId === 'mot_1_neg' || 
      portId === 'srv_1_gnd'
    ) {
      return 0.0;
    }
    if (portId.includes('5v') || portId.includes('bb_vcc') || portId === 'srv_1_vcc') {
      return isSupplyOn ? supplyVoltage : 0.0;
    }
    if (portId.includes('3v3')) {
      return isSupplyOn ? 3.3 : 0.0;
    }
    if (portId === 'r_1_p1') {
      return isSupplyOn && isVCCConnectedToR ? supplyVoltage : 0.0;
    }
    if (portId === 'r_1_p2' || portId === 'led_1_anode') {
      if (isLEDActive) return 2.05;
      if (isSupplyOn && isVCCConnectedToR) return supplyVoltage;
      return 0.0;
    }
    if (portId === 'mot_1_pos') {
      return isMotorActive ? 5.0 : 0.0;
    }
    return 0.0;
  };

  const redPort = allPorts.find(p => p.id === redProbePortId);
  const blackPort = allPorts.find(p => p.id === blackProbePortId);
  const redPotential = getPortPotential(redProbePortId);
  const blackPotential = getPortPotential(blackProbePortId);
  const measuredVoltage = redProbePortId && blackProbePortId ? (redPotential - blackPotential) : 0.0;
  const measuredCurrentMA = isLEDActive ? 13.4 : isMotorActive ? 280.0 : 0.0;

  // Stable ref for probe measurement callback to prevent render loop
  const onProbeRef = useRef(onProbeMeasurement);
  useEffect(() => {
    onProbeRef.current = onProbeMeasurement;
  });

  useEffect(() => {
    if (onProbeRef.current) {
      onProbeRef.current(measuredVoltage, measuredCurrentMA / 1000, 220);
    }
  }, [measuredVoltage, measuredCurrentMA]);

  // Handle clicking on a port
  const handlePortClick = (port: BreadboardPort) => {
    // If placing Red probe
    if (activeTool === 'probe_red') {
      setRedProbePortId(port.id);
      setActiveTool('wire');
      return;
    }
    // If placing Black probe
    if (activeTool === 'probe_black') {
      setBlackProbePortId(port.id);
      setActiveTool('wire');
      return;
    }

    // Standard wire drawing
    if (!pendingPort) {
      setPendingPort(port);
    } else {
      if (pendingPort.id !== port.id) {
        const newWire: InteractiveWire = {
          id: `wire_${Date.now()}`,
          fromPortId: pendingPort.id,
          fromName: pendingPort.name,
          fromPos: { x: pendingPort.x, y: pendingPort.y },
          toPortId: port.id,
          toName: port.name,
          toPos: { x: port.x, y: port.y },
          color: selectedWireColor,
          isCarryingCurrent: true
        };
        setWires(prev => [...prev, newWire]);
      }
      setPendingPort(null);
    }
  };

  // Track mouse coordinates for drawing active wire rubberband
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.touches[0].clientX - rect.left) / zoom,
      y: (e.touches[0].clientY - rect.top) / zoom
    });
  };

  // Delete selected wire
  const handleDeleteWire = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWires(prev => prev.filter(w => w.id !== id));
    if (selectedWireId === id) setSelectedWireId(null);
  };

  // Pre-load specific circuits
  const loadPresetCircuit = (preset: 'led' | 'motor' | 'servo' | 'clear') => {
    setPendingPort(null);
    if (preset === 'clear') {
      setWires([]);
      return;
    }
    if (preset === 'led') {
      setWires([
        {
          id: 'w_1',
          fromPortId: 'ard_1_5v',
          fromName: 'Arduino 5V',
          fromPos: { x: 190, y: 310 },
          toPortId: 'r_1_p1',
          toName: 'R1 Pin 1',
          toPos: { x: 485, y: 125 },
          color: '#ef4444',
          isCarryingCurrent: true
        },
        {
          id: 'w_2',
          fromPortId: 'r_1_p2',
          fromName: 'R1 Pin 2',
          fromPos: { x: 575, y: 125 },
          toPortId: 'led_1_anode',
          toName: 'LED Anode (+)',
          toPos: { x: 670, y: 140 },
          color: '#ef4444',
          isCarryingCurrent: true
        },
        {
          id: 'w_3',
          fromPortId: 'led_1_cathode',
          fromName: 'LED Cathode (-)',
          fromPos: { x: 710, y: 140 },
          toPortId: 'ard_1_gnd_1',
          toName: 'Arduino GND',
          toPos: { x: 210, y: 310 },
          color: '#0f172a',
          isCarryingCurrent: true
        }
      ]);
    } else if (preset === 'motor') {
      setWires([
        {
          id: 'w_m1',
          fromPortId: 'ard_1_5v',
          fromName: 'Arduino 5V',
          fromPos: { x: 190, y: 310 },
          toPortId: 'mot_1_pos',
          toName: 'Motor (+)',
          toPos: { x: 675, y: 290 },
          color: '#ef4444',
          isCarryingCurrent: true
        },
        {
          id: 'w_m2',
          fromPortId: 'mot_1_neg',
          fromName: 'Motor (-)',
          fromPos: { x: 715, y: 290 },
          toPortId: 'ard_1_gnd_1',
          toName: 'Arduino GND',
          toPos: { x: 210, y: 310 },
          color: '#0f172a',
          isCarryingCurrent: true
        }
      ]);
    } else if (preset === 'servo') {
      setWires([
        {
          id: 'w_s1',
          fromPortId: 'ard_1_5v',
          fromName: 'Arduino 5V',
          fromPos: { x: 190, y: 310 },
          toPortId: 'srv_1_vcc',
          toName: 'Servo VCC',
          toPos: { x: 840, y: 215 },
          color: '#ef4444',
          isCarryingCurrent: true
        },
        {
          id: 'w_s2',
          fromPortId: 'ard_1_gnd_1',
          fromName: 'Arduino GND',
          fromPos: { x: 210, y: 310 },
          toPortId: 'srv_1_gnd',
          toName: 'Servo GND',
          toPos: { x: 860, y: 215 },
          color: '#0f172a',
          isCarryingCurrent: true
        },
        {
          id: 'w_s3',
          fromPortId: 'ard_1_d9',
          fromName: 'Arduino D9 (PWM)',
          fromPos: { x: 230, y: 100 },
          toPortId: 'srv_1_sig',
          toName: 'Servo Signal',
          toPos: { x: 880, y: 215 },
          color: '#f97316',
          isCarryingCurrent: true
        }
      ]);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-slate-100 font-sans select-none">
      {/* Header & Instructions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              طاولة التوصيل الحي والمحاكاة التفاعلية (Breadboard & Real-Time Wiring Lab)
            </h3>
            <span className="text-xs text-purple-400 font-mono">
              Click any pin or hole to connect a wire • Realistic SPICE Continuity & Current Flow
            </span>
          </div>
        </div>

        {/* Wires counter, Zoom controls & Clean button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setZoom(z => Math.max(0.35, Number((z - 0.1).toFixed(1))))}
              className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-300 rounded font-bold"
              title="تصغير"
            >
              -
            </button>
            <span className="px-1 text-[11px] text-slate-400 font-bold">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(1.5, Number((z + 0.1).toFixed(1))))}
              className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-300 rounded font-bold"
              title="تكبير"
            >
              +
            </button>
            <button
              onClick={() => {
                const w = window.innerWidth;
                if (w < 480) setZoom(0.36);
                else if (w < 768) setZoom(0.55);
                else if (w < 1024) setZoom(0.75);
                else setZoom(1.0);
              }}
              className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-purple-400 rounded text-[10px] font-bold mr-1 border border-slate-800"
              title="ملاءمة الشاشة"
            >
              ملء
            </button>
          </div>
          <span className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
            الأسلاك النشطة: <span className="text-purple-400 font-bold">{wires.length}</span>
          </span>
          <button
            onClick={() => loadPresetCircuit('clear')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">إزالة الأسلاك</span>
          </button>
        </div>
      </div>

      {/* Wire Colors & Preset Quick-Wire Toolbar */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Wire Color Picker */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-purple-400" />
            لون السلك:
          </span>
          <div className="flex items-center gap-1.5">
            {WIRE_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => setSelectedWireColor(c.value)}
                style={{ backgroundColor: c.value, borderColor: c.border || c.value }}
                className={`w-6 h-6 rounded-full border-2 transition-transform shadow ${
                  selectedWireColor === c.value ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-950' : 'hover:scale-110 opacity-80'
                }`}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Preset Pre-wired Circuits */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-semibold">توصيلات نموذجية جاهزة:</span>
          <button
            onClick={() => loadPresetCircuit('led')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-purple-600 rounded-lg text-slate-200 transition font-medium"
          >
            + دائرة LED ومقاومة
          </button>
          <button
            onClick={() => loadPresetCircuit('motor')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-purple-600 rounded-lg text-slate-200 transition font-medium"
          >
            + محرك تيار مستمر
          </button>
          <button
            onClick={() => loadPresetCircuit('servo')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-purple-600 rounded-lg text-slate-200 transition font-medium"
          >
            + محرك سيرفو ونبضات
          </button>
        </div>
      </div>

      {/* Integrated Live Voltmeter & Ammeter Instrument HUD Panel */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-3.5 rounded-2xl border-2 border-amber-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        {/* Left: Voltmeter & Ammeter 7-Segment Displays */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Voltmeter Display */}
          <div className="bg-black/90 px-3.5 py-2 rounded-xl border border-amber-500/60 shadow-inner flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Gauge className="w-4 h-4" />
              <span className="font-bold text-[11px]">فرق الجهد (V):</span>
            </div>
            <div className="font-mono text-xl font-black text-amber-300 tracking-wider">
              {measuredVoltage >= 0 ? `+${measuredVoltage.toFixed(3)}` : measuredVoltage.toFixed(3)}
              <span className="text-xs text-amber-400 ml-1">V DC</span>
            </div>
          </div>

          {/* Ammeter Display */}
          <div className="bg-black/90 px-3.5 py-2 rounded-xl border border-emerald-500/60 shadow-inner flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Activity className="w-4 h-4" />
              <span className="font-bold text-[11px]">شدة التيار (I):</span>
            </div>
            <div className="font-mono text-xl font-black text-emerald-300 tracking-wider">
              {measuredCurrentMA.toFixed(1)}
              <span className="text-xs text-emerald-400 ml-1">mA</span>
            </div>
          </div>

          {/* Probe Nodes Connection Label */}
          <div className="hidden lg:flex flex-col text-[10px] text-slate-300 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              المجس الموجب (+): <strong className="text-white">{redPort ? redPort.name : 'مفصول'}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              المجس السالب (-): <strong className="text-white">{blackPort ? blackPort.name : 'مفصول'}</strong>
            </span>
          </div>
        </div>

        {/* Right: Quick Probe Tools & Snapping Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Active Tool Selectors */}
          <button
            onClick={() => {
              setPendingPort(null);
              setActiveTool(activeTool === 'probe_red' ? 'wire' : 'probe_red');
            }}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition text-xs ${
              activeTool === 'probe_red'
                ? 'bg-red-600 text-white ring-2 ring-white scale-105'
                : 'bg-slate-800 text-red-300 hover:bg-slate-700'
            }`}
            title="نقل مجس القياس الأحمر (+)"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>مجس (+) أحمر</span>
          </button>
          <button
            onClick={() => {
              setPendingPort(null);
              setActiveTool(activeTool === 'probe_black' ? 'wire' : 'probe_black');
            }}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition text-xs ${
              activeTool === 'probe_black'
                ? 'bg-slate-700 text-white ring-2 ring-white scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="نقل مجس القياس الأسود (COM)"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>مجس (-) أسود</span>
          </button>

          {/* Quick presets for measuring */}
          <button
            onClick={() => {
              setRedProbePortId('led_1_anode');
              setBlackProbePortId('led_1_cathode');
              setActiveTool('wire');
            }}
            className="px-2 py-1.5 bg-slate-900 hover:bg-amber-600 rounded-lg text-slate-300 hover:text-white transition text-[11px] font-medium"
          >
            جهد LED
          </button>
          <button
            onClick={() => {
              setRedProbePortId('r_1_p1');
              setBlackProbePortId('r_1_p2');
              setActiveTool('wire');
            }}
            className="px-2 py-1.5 bg-slate-900 hover:bg-amber-600 rounded-lg text-slate-300 hover:text-white transition text-[11px] font-medium"
          >
            جهد المقاومة
          </button>
          <button
            onClick={() => {
              setRedProbePortId('ard_1_5v');
              setBlackProbePortId('ard_1_gnd_1');
              setActiveTool('wire');
            }}
            className="px-2 py-1.5 bg-slate-900 hover:bg-amber-600 rounded-lg text-slate-300 hover:text-white transition text-[11px] font-medium"
          >
            جهد 5V / GND
          </button>
        </div>
      </div>

      {/* Tool Tip Notice if in Probe Placement Mode */}
      {activeTool !== 'wire' && (
        <div className="bg-amber-950/80 border border-amber-500/60 p-2.5 rounded-xl text-xs flex items-center justify-between text-amber-200 animate-pulse">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {activeTool === 'probe_red' 
                ? 'انقر على أي منفذ أو طرف لتثبيت المجس الأحمر (+)' 
                : 'انقر على أي منفذ أو طرف لتثبيت المجس الأسود (COM -)'}
            </span>
          </div>
          <button
            onClick={() => setActiveTool('wire')}
            className="px-2 py-0.5 bg-amber-900 hover:bg-amber-800 text-white rounded text-[11px] font-bold"
          >
            إلغاء وضع المجسات
          </button>
        </div>
      )}

      {/* Pending Port Tip Bar */}
      {pendingPort && (
        <div className="bg-purple-950/70 border border-purple-500/60 p-2.5 rounded-xl text-xs flex items-center justify-between text-purple-200 animate-pulse">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              تم اختيار: <strong className="text-white font-mono">{pendingPort.name}</strong>. انقر على المنفذ الثاني لإتمام السلك.
            </span>
          </div>
          <button
            onClick={() => setPendingPort(null)}
            className="px-2 py-0.5 bg-purple-900 hover:bg-purple-800 rounded text-[11px] font-bold"
          >
            إلغاء السلك (Esc)
          </button>
        </div>
      )}

      {/* Main Interactive Workbench Canvas (Relative Container) */}
      <div className="w-full overflow-x-auto rounded-2xl border-2 border-slate-800 shadow-inner bg-slate-950 no-scrollbar">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          style={{
            transform: zoom !== 1 ? `scale(${zoom})` : undefined,
            transformOrigin: 'top right',
            width: zoom !== 1 ? `${Math.round(1020 * zoom)}px` : '100%',
            minWidth: '1020px',
            height: zoom !== 1 ? `${Math.round(620 * zoom)}px` : '620px'
          }}
          className="h-[620px] bg-slate-950 relative overflow-hidden cursor-crosshair select-none"
        >
        {/* Subtle Canvas Grid Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

        {/* SVG Layer for Drawing All Wires */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
          {/* Render Completed Wires */}
          {wires.map((wire) => {
            // Cubic Bezier curve for realistic drooping wire effect
            const dx = wire.toPos.x - wire.fromPos.x;
            const dy = wire.toPos.y - wire.fromPos.y;
            const dist = Math.hypot(dx, dy);
            const sag = Math.min(80, Math.max(25, dist * 0.18)); // natural gravity droop
            const midX = (wire.fromPos.x + wire.toPos.x) / 2;
            const midY = (wire.fromPos.y + wire.toPos.y) / 2 + sag;
            const pathD = `M ${wire.fromPos.x} ${wire.fromPos.y} Q ${midX} ${midY} ${wire.toPos.x} ${wire.toPos.y}`;
            const isSelected = selectedWireId === wire.id;

            return (
              <g key={wire.id} className="pointer-events-auto cursor-pointer" onClick={(e) => handleDeleteWire(wire.id, e)}>
                {/* Wire Outer Glow / Shadow */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={wire.color}
                  strokeWidth={isSelected ? 8 : 4.5}
                  strokeLinecap="round"
                  opacity={isSelected ? 1 : 0.88}
                  style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.6))' }}
                />
                {/* Inner Highlight Core */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={1.2}
                  strokeLinecap="round"
                  opacity={0.35}
                />
                {/* Wire Connectors Terminals */}
                <circle cx={wire.fromPos.x} cy={wire.fromPos.y} r={4.5} fill={wire.color} stroke="#ffffff" strokeWidth={1.5} />
                <circle cx={wire.toPos.x} cy={wire.toPos.y} r={4.5} fill={wire.color} stroke="#ffffff" strokeWidth={1.5} />
              </g>
            );
          })}

          {/* Render Pending Wire Rubberband following mouse */}
          {pendingPort && (
            <path
              d={`M ${pendingPort.x} ${pendingPort.y} Q ${(pendingPort.x + mousePos.x) / 2} ${(pendingPort.y + mousePos.y) / 2 + 35} ${mousePos.x} ${mousePos.y}`}
              fill="none"
              stroke={selectedWireColor}
              strokeWidth={3.5}
              strokeDasharray="6,4"
              className="animate-pulse"
              strokeLinecap="round"
            />
          )}

          {/* Render Active Voltmeter Probes (Red V+ & Black COM-) */}
          {redPort && (
            <g className="pointer-events-none">
              {/* Flexible Red Probe Lead Wire */}
              <path
                d={`M 680 15 Q ${Math.max(680, redPort.x)} ${(redPort.y + 15) / 2 + 30} ${redPort.x} ${redPort.y}`}
                fill="none"
                stroke="#ef4444"
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.9}
                style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.7))' }}
              />
              {/* Probe Terminal Head */}
              <circle cx={redPort.x} cy={redPort.y} r={10} fill="#dc2626" stroke="#ffffff" strokeWidth={2.5} className="animate-pulse" />
              <text x={redPort.x} y={redPort.y + 3.5} textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="900" fontFamily="monospace">
                V+
              </text>
            </g>
          )}

          {blackPort && (
            <g className="pointer-events-none">
              {/* Flexible Black Probe Lead Wire */}
              <path
                d={`M 740 15 Q ${Math.min(740, blackPort.x)} ${(blackPort.y + 15) / 2 + 30} ${blackPort.x} ${blackPort.y}`}
                fill="none"
                stroke="#0f172a"
                strokeWidth={3.5}
                strokeLinecap="round"
                opacity={0.9}
                style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.7))' }}
              />
              {/* Probe Terminal Head */}
              <circle cx={blackPort.x} cy={blackPort.y} r={10} fill="#090d16" stroke="#38bdf8" strokeWidth={2.5} className="animate-pulse" />
              <text x={blackPort.x} y={blackPort.y + 3.5} textAnchor="middle" fontSize="7" fill="#38bdf8" fontWeight="900" fontFamily="monospace">
                COM
              </text>
            </g>
          )}
        </svg>

        {/* 1. PHYSICAL ARDUINO UNO BOARD RENDERING */}
        <div
          style={{ left: 40, top: 60 }}
          className="absolute w-72 h-80 bg-teal-900 border-2 border-teal-600 rounded-2xl shadow-2xl p-4 z-10 select-none text-white flex flex-col justify-between"
        >
          {/* Header & USB */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-10 h-8 bg-slate-300 border border-slate-400 rounded-t shadow-inner flex items-center justify-center text-[9px] font-bold text-slate-900">
                USB
              </div>
              <div>
                <h4 className="font-black text-sm tracking-wide text-white">ARDUINO UNO</h4>
                <span className="text-[9px] text-teal-300 font-mono">DIGITAL & ANALOG PINS</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              <span className="text-[8px] text-teal-300 mt-0.5">PWR</span>
            </div>
          </div>

          {/* Microcontroller ATmega328P Chip */}
          <div className="w-full h-10 bg-slate-950 border border-slate-700 rounded flex items-center justify-center font-mono text-[10px] text-slate-300 shadow-inner">
            <span className="tracking-widest">ATmega328P 16MHz</span>
          </div>

          {/* Pin Header Labels */}
          <div className="flex justify-between text-[9px] font-mono text-teal-200 border-t border-teal-700/60 pt-1">
            <span>POWER / ANALOG A0-A5</span>
            <span>DIGITAL (PWM ~)</span>
          </div>
        </div>

        {/* 2. PHYSICAL BREADBOARD (FULL CENTER BOARD WITH RAILS) */}
        <div
          style={{ left: 320, top: 340 }}
          className="absolute w-[640px] h-64 bg-slate-200 border-4 border-slate-400 rounded-2xl shadow-2xl z-10 p-3 select-none text-slate-800"
        >
          {/* Top Rail Labels (+ and -) */}
          <div className="flex justify-between items-center text-[10px] font-mono font-bold px-4 border-b-2 border-slate-300 pb-1">
            <span className="text-red-600">(+) RED POWER BUS (+5V)</span>
            <span className="text-slate-500 font-sans">لوحة تجارب 830 نقطة (Standard Breadboard)</span>
            <span className="text-blue-600">(-) BLUE GROUND BUS (GND)</span>
          </div>

          {/* Breadboard Center Divider Notch */}
          <div className="w-full h-3 bg-slate-400/30 rounded my-10 border-y border-slate-300 flex items-center justify-center">
            <span className="text-[8px] font-mono text-slate-500 tracking-widest">CENTER CHANNEL IC DIVIDER</span>
          </div>

          {/* Bottom Rail Labels */}
          <div className="flex justify-between items-center text-[10px] font-mono font-bold px-4 border-t-2 border-slate-300 pt-1 mt-6">
            <span className="text-blue-600">(-) LOWER GROUND BUS (GND)</span>
            <span className="text-slate-500 font-sans">ROWS 1 - 30 (COLUMNS A - J)</span>
          </div>
        </div>

        {/* 3. PLACED ELECTRONIC COMPONENTS */}
        {components.map((c) => {
          if (c.type === 'arduino') return null; // rendered above

          if (c.type === 'resistor') {
            return (
              <div
                key={c.id}
                style={{ left: c.x, top: c.y }}
                className="absolute w-28 h-20 bg-slate-900/90 border border-slate-700 rounded-xl p-2 z-10 flex flex-col items-center justify-between shadow-xl"
              >
                <div className="text-[10px] font-bold text-slate-300">{c.name}</div>
                {/* Resistor Graphic Body */}
                <div className="w-20 h-6 bg-amber-100 rounded-full border border-amber-300 flex items-center justify-around px-2 shadow">
                  <div className="w-2 h-full bg-red-600 rounded" />
                  <div className="w-2 h-full bg-red-600 rounded" />
                  <div className="w-2 h-full bg-amber-950 rounded" />
                  <div className="w-2 h-full bg-amber-500 rounded" />
                </div>
                <div className="text-[9px] font-mono text-amber-400 font-bold">{c.value} {c.unit}</div>
              </div>
            );
          }

          if (c.type === 'led') {
            const isLit = isLEDActive;
            return (
              <div
                key={c.id}
                style={{ left: c.x, top: c.y }}
                className="absolute w-24 h-24 bg-slate-900/90 border border-slate-700 rounded-xl p-2 z-10 flex flex-col items-center justify-between shadow-xl"
              >
                <div className="text-[10px] font-bold text-slate-300">{c.name}</div>
                {/* LED Bulb */}
                <div
                  className={`w-9 h-9 rounded-full border-2 border-red-500 flex items-center justify-center transition-all duration-200 ${
                    isLit ? 'bg-red-500 shadow-[0_0_30px_#ef4444]' : 'bg-red-950/40 opacity-50'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-white/70" />
                </div>
                <span className={`text-[9px] font-bold ${isLit ? 'text-red-400' : 'text-slate-500'}`}>
                  {isLit ? 'مضيء (ON)' : 'مطفا (OFF)'}
                </span>
              </div>
            );
          }

          if (c.type === 'dc_motor') {
            const isSpinning = isMotorActive;
            return (
              <div
                key={c.id}
                style={{ left: c.x, top: c.y }}
                className="absolute w-28 h-28 bg-slate-900/90 border border-slate-700 rounded-xl p-2 z-10 flex flex-col items-center justify-between shadow-xl"
              >
                <div className="text-[10px] font-bold text-slate-300">{c.name}</div>
                {/* Motor Shaft & Propeller */}
                <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-slate-600 flex items-center justify-center relative shadow-inner">
                  <div
                    className={`w-10 h-2 bg-emerald-400 rounded-full transition-transform ${
                      isSpinning ? 'animate-spin' : ''
                    }`}
                  />
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-700 absolute border border-slate-500" />
                </div>
                <span className="text-[9px] font-mono text-emerald-400 font-bold">
                  {isMotorActive ? 2400 : 0} RPM
                </span>
              </div>
            );
          }

          if (c.type === 'servo') {
            return (
              <div
                key={c.id}
                style={{ left: c.x, top: c.y }}
                className="absolute w-28 h-28 bg-slate-900/90 border border-slate-700 rounded-xl p-2 z-10 flex flex-col items-center justify-between shadow-xl"
              >
                <div className="text-[10px] font-bold text-slate-300">{c.name}</div>
                {/* Servo Arm Graphic */}
                <div className="w-14 h-10 bg-blue-900 rounded border border-blue-500 flex items-center justify-center relative">
                  <div
                    className="w-10 h-1.5 bg-white rounded-full origin-left transition-transform duration-150 absolute left-7 shadow"
                    style={{ transform: `rotate(${(c.state?.angle || 90) - 90}deg)` }}
                  />
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-400 absolute left-6" />
                </div>
                <span className="text-[9px] font-mono text-blue-300 font-bold">
                  {c.state?.angle}°
                </span>
              </div>
            );
          }

          if (c.type === 'pushbutton') {
            return (
              <div
                key={c.id}
                style={{ left: c.x, top: c.y }}
                className="absolute w-24 h-20 bg-slate-900/90 border border-slate-700 rounded-xl p-2 z-10 flex flex-col items-center justify-between shadow-xl"
              >
                <div className="text-[10px] font-bold text-slate-300">{c.name}</div>
                <button
                  onMouseDown={() => {
                    setComponents(prev => prev.map(item => item.id === c.id ? { ...item, state: { pressed: true } } : item));
                  }}
                  onMouseUp={() => {
                    setComponents(prev => prev.map(item => item.id === c.id ? { ...item, state: { pressed: false } } : item));
                  }}
                  className={`w-9 h-9 rounded-lg border-2 font-bold text-xs flex items-center justify-center shadow transition ${
                    c.state?.pressed ? 'bg-emerald-600 border-emerald-400 scale-95' : 'bg-slate-700 border-slate-600'
                  }`}
                >
                  SW
                </button>
                <span className="text-[8px] text-slate-400">ضغط لحظي</span>
              </div>
            );
          }

          return null;
        })}

        {/* 4. ALL CLICKABLE PORTS / PINS / HOLES (TOP LAYER) */}
        {allPorts.map((port) => {
          const isPending = pendingPort?.id === port.id;
          let pinStyle = 'bg-slate-700 border-slate-500';
          if (port.type === 'power_vcc') pinStyle = 'bg-red-600 border-red-400 shadow-[0_0_6px_#ef4444]';
          if (port.type === 'power_gnd') pinStyle = 'bg-slate-900 border-blue-400 shadow-[0_0_6px_#3b82f6]';
          if (port.type === 'signal') pinStyle = 'bg-amber-400 border-yellow-200 shadow-[0_0_6px_#eab308]';
          if (port.type === 'analog') pinStyle = 'bg-cyan-500 border-cyan-300 shadow-[0_0_6px_#06b6d4]';
          if (port.type === 'component_pin') pinStyle = 'bg-emerald-500 border-emerald-300 shadow-[0_0_6px_#10b981]';

          return (
            <div
              key={port.id}
              onClick={() => handlePortClick(port)}
              style={{ left: port.x - 7, top: port.y - 7 }}
              className={`absolute w-3.5 h-3.5 rounded-full border-2 z-30 transition-transform cursor-pointer ${pinStyle} ${
                isPending ? 'scale-150 ring-4 ring-purple-400 animate-ping' : 'hover:scale-135'
              }`}
              title={`نقطة توصيل: ${port.name} (انقر للتوصيل)`}
            />
          );
        })}
        </div>
      </div>

      {/* Guide Banner */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>طريقة التوصيل:</strong> انقر على أي منفذ باللوحة أو الأردوينو مثل 5V ثم انقر على طرف المكون الآخر لإيصال السلك تلقائياً.
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> VCC (5V)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-blue-400"></span> GND</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Signal (إشارة)</span>
        </div>
      </div>
    </div>
  );
};
