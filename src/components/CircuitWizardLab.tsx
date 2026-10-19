// CircuitWizardLab.tsx - محاكي معمل Circuit Wizard البريطاني التفاعلي للوحات التجارب (Breadboard) والدوائر الإلكترونية
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Folder,
  FolderOpen,
  FileText,
  HelpCircle,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  RotateCw,
  Check,
  ChevronRight,
  ChevronDown,
  Info,
  Download,
  Upload,
  Cpu,
  Crosshair,
  Printer,
  Copy,
  Scissors,
  Clipboard,
  Save,
  FilePlus,
  AlertTriangle,
  Lightbulb,
  X,
  Maximize,
  Grid,
  Link,
  SlidersHorizontal,
  Flame,
  Settings,
  MousePointer,
  Gauge,
  Move
} from 'lucide-react';

// ==========================================
// 1. Audio Engine for Realistic Hardware Sounds
// ==========================================
class CircuitWizardAudio {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playSwitchClick() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch {
      // Audio policy safe
    }
  }

  playWireConnect() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio policy safe
    }
  }

  playBuzzer() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(2400, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Audio policy safe
    }
  }

  playShortCircuitAlert() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Audio policy safe
    }
  }
}

const cwAudio = new CircuitWizardAudio();

// ==========================================
// 2. Types & Data Models
// ==========================================
export type CircuitWizardMode = 
  | 'normal' 
  | 'realworld' 
  | 'current_flow' 
  | 'voltage_levels' 
  | 'standard';

export interface CWPinDef {
  id: string;
  name: string;
  nameAr: string;
  relX: number;
  relY: number;
}

export type ComponentKind =
  | 'breadboard'
  | 'battery_aa' 
  | 'battery_9v' 
  | 'battery_4aa'
  | 'switch_spst' 
  | 'push_button' 
  | 'potentiometer'
  | 'bulb' 
  | 'led' 
  | 'buzzer' 
  | 'motor' 
  | 'resistor' 
  | 'capacitor' 
  | 'diode' 
  | 'voltmeter' 
  | 'ammeter';

export interface CWElement {
  id: string;
  ref: string; // e.g. "B1", "SW1", "BL1", "R1", "BB1"
  kind: ComponentKind;
  name: string;
  nameAr: string;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  value: number;
  unit: string;
  state?: boolean; // switch open/closed
  setting?: number; // 0-100 for potentiometer
  color?: string; // for LED
  // Solved parameters
  voltageDrop?: number;
  currentThrough?: number;
  powerDissipated?: number;
  isOverloaded?: boolean;
}

export interface CWWire {
  id: string;
  fromCompId: string;
  fromPinId: string;
  toCompId: string;
  toPinId: string;
  color: string;
}

export interface CWSampleCircuit {
  id: string;
  fileName: string;
  category: 'Elementary Circuits' | 'Basic Circuits' | 'Advanced Circuits';
  subGroup: 'General' | 'Electrical Theory' | 'Measuring' | 'Mechanisms';
  title: string;
  titleAr: string;
  desc: string;
  sheetTitle: string;
  instructions: {
    title: string;
    line1: string;
    line2: string;
  };
  elements: CWElement[];
  wires: CWWire[];
  schematicBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Relative pin definitions for components
export const COMPONENT_PINS: Record<ComponentKind, CWPinDef[]> = {
  battery_aa: [
    { id: 'pos', name: '+', nameAr: 'قطب موجب', relX: 0, relY: -95 },
    { id: 'neg', name: '-', nameAr: 'قطب سالب', relX: 0, relY: 55 }
  ],
  battery_9v: [
    { id: 'pos', name: '+', nameAr: 'قطب موجب', relX: -10, relY: -60 },
    { id: 'neg', name: '-', nameAr: 'قطب سالب', relX: 10, relY: -60 }
  ],
  battery_4aa: [
    { id: 'pos', name: '+', nameAr: 'قطب موجب', relX: -10, relY: -60 },
    { id: 'neg', name: '-', nameAr: 'قطب سالب', relX: 10, relY: -60 }
  ],
  switch_spst: [
    { id: 'p1', name: '1', nameAr: 'طرف مفتاح 1', relX: -13, relY: 20 },
    { id: 'p2', name: '2', nameAr: 'طرف مفتاح 2', relX: 13, relY: 20 }
  ],
  push_button: [
    { id: 'p1', name: '1', nameAr: 'طرف ضاغط 1', relX: -13, relY: 20 },
    { id: 'p2', name: '2', nameAr: 'طرف ضاغط 2', relX: 13, relY: 20 }
  ],
  potentiometer: [
    { id: 'p1', name: '1', nameAr: 'طرف 1', relX: -18, relY: 18 },
    { id: 'wiper', name: 'W', nameAr: 'المتحرك', relX: 0, relY: 18 },
    { id: 'p2', name: '2', nameAr: 'طرف 2', relX: 18, relY: 18 }
  ],
  bulb: [
    { id: 'p1', name: '1', nameAr: 'طرف مصباح 1', relX: -24, relY: -8 },
    { id: 'p2', name: '2', nameAr: 'طرف مصباح 2', relX: -24, relY: 8 }
  ],
  resistor: [
    { id: 'p1', name: '1', nameAr: 'طرف مقاومة 1', relX: -28, relY: 0 },
    { id: 'p2', name: '2', nameAr: 'طرف مقاومة 2', relX: 28, relY: 0 }
  ],
  capacitor: [
    { id: 'p1', name: '1', nameAr: 'طرف موجب', relX: -20, relY: 0 },
    { id: 'p2', name: '2', nameAr: 'طرف سالب', relX: 20, relY: 0 }
  ],
  led: [
    { id: 'anode', name: 'A', nameAr: 'المصعد (+)', relX: -16, relY: 0 },
    { id: 'cathode', name: 'K', nameAr: 'المهبط (-)', relX: 16, relY: 0 }
  ],
  diode: [
    { id: 'anode', name: 'A', nameAr: 'المصعد', relX: -18, relY: 0 },
    { id: 'cathode', name: 'K', nameAr: 'المهبط', relX: 18, relY: 0 }
  ],
  buzzer: [
    { id: 'pos', name: '+', nameAr: 'قطب موجب', relX: -14, relY: 16 },
    { id: 'neg', name: '-', nameAr: 'قطب سالب', relX: 14, relY: 16 }
  ],
  motor: [
    { id: 'p1', name: '1', nameAr: 'طرف محرك 1', relX: -15, relY: 18 },
    { id: 'p2', name: '2', nameAr: 'طرف محرك 2', relX: 15, relY: 18 }
  ],
  voltmeter: [
    { id: 'pos', name: '+', nameAr: 'مجس موجب (+)', relX: -26, relY: 18 },
    { id: 'neg', name: '-', nameAr: 'مجس سالب (-)', relX: 26, relY: 18 }
  ],
  ammeter: [
    { id: 'pos', name: '+', nameAr: 'مجس موجب (+)', relX: -26, relY: 18 },
    { id: 'neg', name: '-', nameAr: 'مجس سالب (-)', relX: 26, relY: 18 }
  ],
  breadboard: [
    { id: 'pos_top', name: '+ Top', nameAr: 'موجب علوي', relX: -110, relY: -44 },
    { id: 'neg_top', name: '- Top', nameAr: 'سالب علوي', relX: 110, relY: -44 },
    { id: 'tie_1', name: 'Row 1', nameAr: 'صف 1', relX: -60, relY: 0 },
    { id: 'tie_2', name: 'Row 2', nameAr: 'صف 2', relX: 0, relY: 0 },
    { id: 'tie_3', name: 'Row 3', nameAr: 'صف 3', relX: 60, relY: 0 },
    { id: 'pos_bot', name: '+ Bot', nameAr: 'موجب سفلي', relX: -110, relY: 44 },
    { id: 'neg_bot', name: '- Bot', nameAr: 'سالب سفلي', relX: 110, relY: 44 }
  ]
};

// Calculate rotated absolute pin position on canvas
export function getPinAbsolutePos(el: CWElement, pinId: string): { x: number; y: number } {
  const pins = COMPONENT_PINS[el.kind] || [];
  const pin = pins.find((p) => p.id === pinId) || { relX: 0, relY: 0 };
  const rad = ((el.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rx = pin.relX * cos - pin.relY * sin;
  const ry = pin.relX * sin + pin.relY * cos;
  return { x: el.x + rx, y: el.y + ry };
}

// Generate smooth bezier curve between any two points
export function getWirePath(p1: { x: number; y: number }, p2: { x: number; y: number }): string {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  const curvature = Math.min(55, Math.max(25, dist * 0.25));

  const cx1 = p1.x + (dx > 0 ? curvature * 0.4 : -curvature * 0.4);
  const cy1 = p1.y + curvature;
  const cx2 = p2.x - (dx > 0 ? curvature * 0.4 : -curvature * 0.4);
  const cy2 = p2.y + curvature;

  return `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;
}

// ==========================================
// 3. Predefined Sample Circuits Catalog
// ==========================================
export const CW_SAMPLE_CIRCUITS: CWSampleCircuit[] = [
  // 1. Bulb Circuit
  {
    id: 'bulb_circuit',
    fileName: 'Bulb Circuit.cwz',
    category: 'Elementary Circuits',
    subGroup: 'General',
    title: 'Bulb Circuit',
    titleAr: 'دائرة المصباح البسيطة (Bulb Circuit)',
    desc: 'Shows how a light switch works. Basic single-loop circuit with an AA battery, SPST toggle switch, and incandescent filament bulb.',
    sheetTitle: 'Elementary Circuit',
    instructions: {
      title: 'Bulb Circuit • Shows how a light switch works.',
      line1: 'Click on the Run button to simulate the circuit.',
      line2: 'Once simulating, click switch SW1 to turn the light on or off.'
    },
    elements: [
      { id: 'bat1', ref: 'B1', kind: 'battery_aa', name: 'Battery', nameAr: 'بطارية 1.5V', x: 130, y: 310, rotation: 0, value: 1.5, unit: 'V' },
      { id: 'sw1', ref: 'SW1', kind: 'switch_spst', name: 'Switch SW1', nameAr: 'مفتاح SW1', x: 220, y: 175, rotation: 0, value: 0, unit: '', state: true },
      { id: 'bulb1', ref: 'BL1', kind: 'bulb', name: 'Bulb', nameAr: 'مصباح', x: 280, y: 285, rotation: 0, value: 1.5, unit: 'V' }
    ],
    wires: [
      { id: 'w1', fromCompId: 'bat1', fromPinId: 'pos', toCompId: 'sw1', toPinId: 'p1', color: '#dc2626' },
      { id: 'w2', fromCompId: 'sw1', fromPinId: 'p2', toCompId: 'bulb1', toPinId: 'p1', color: '#2563eb' },
      { id: 'w3', fromCompId: 'bulb1', fromPinId: 'p2', toCompId: 'bat1', toPinId: 'neg', color: '#111827' }
    ],
    schematicBox: { x: 285, y: 345, width: 180, height: 135 }
  },
  // 2. Dimmer Switch
  {
    id: 'dimmer_switch',
    fileName: 'Dimmer Switch.cwz',
    category: 'Elementary Circuits',
    subGroup: 'General',
    title: 'Dimmer Switch',
    titleAr: 'مفتاح التحكم بالإضاءة (Dimmer Switch)',
    desc: 'Shows how a variable resistor controls current flow and smoothly changes the brightness of a filament lamp.',
    sheetTitle: 'Elementary Circuit',
    instructions: {
      title: 'Dimmer Switch • Smooth brightness control.',
      line1: 'Click Run, then toggle switch SW1 to activate the circuit.',
      line2: 'Adjust the potentiometer setting to dim the lamp brightness.'
    },
    elements: [
      { id: 'bat1', ref: 'B1', kind: 'battery_9v', name: '9V Battery', nameAr: 'بطارية 9V', x: 130, y: 310, rotation: 0, value: 9, unit: 'V' },
      { id: 'pot1', ref: 'VR1', kind: 'potentiometer', name: 'Potentiometer', nameAr: 'مقاومة متغيرة', x: 220, y: 175, rotation: 0, value: 1000, unit: 'Ω', setting: 75 },
      { id: 'bulb1', ref: 'BL1', kind: 'bulb', name: 'Lamp', nameAr: 'مصباح', x: 280, y: 285, rotation: 0, value: 9, unit: 'V' }
    ],
    wires: [
      { id: 'w1', fromCompId: 'bat1', fromPinId: 'pos', toCompId: 'pot1', toPinId: 'p1', color: '#dc2626' },
      { id: 'w2', fromCompId: 'pot1', fromPinId: 'wiper', toCompId: 'bulb1', toPinId: 'p1', color: '#2563eb' },
      { id: 'w3', fromCompId: 'bulb1', fromPinId: 'p2', toCompId: 'bat1', toPinId: 'neg', color: '#111827' }
    ],
    schematicBox: { x: 285, y: 345, width: 180, height: 135 }
  },
  // 3. LED Circuit
  {
    id: 'led_circuit',
    fileName: 'LED Circuit.cwz',
    category: 'Elementary Circuits',
    subGroup: 'General',
    title: 'LED Circuit',
    titleAr: 'دائرة إضاءة LED مع مقاومة حماية',
    desc: 'Shows how an LED needs a current-limiting resistor to protect it from burning out when connected to 9V.',
    sheetTitle: 'Elementary Circuit',
    instructions: {
      title: 'LED Circuit • Current limiting protection.',
      line1: 'Click Run to simulate. The 470Ω resistor limits excess current.',
      line2: 'Click SW1 to switch the red LED safely on or off.'
    },
    elements: [
      { id: 'bat1', ref: 'B1', kind: 'battery_9v', name: '9V Battery', nameAr: 'بطارية 9V', x: 130, y: 310, rotation: 0, value: 9, unit: 'V' },
      { id: 'sw1', ref: 'SW1', kind: 'switch_spst', name: 'Switch SW1', nameAr: 'مفتاح SW1', x: 215, y: 175, rotation: 0, value: 0, unit: '', state: true },
      { id: 'r1', ref: 'R1', kind: 'resistor', name: '470Ω Resistor', nameAr: 'مقاومة 470 أوم', x: 280, y: 175, rotation: 0, value: 470, unit: 'Ω' },
      { id: 'led1', ref: 'LED1', kind: 'led', name: 'Red LED', nameAr: 'LED أحمر', x: 280, y: 285, rotation: 0, value: 2.1, unit: 'V', color: '#ef4444' }
    ],
    wires: [
      { id: 'w1', fromCompId: 'bat1', fromPinId: 'pos', toCompId: 'sw1', toPinId: 'p1', color: '#dc2626' },
      { id: 'w2', fromCompId: 'sw1', fromPinId: 'p2', toCompId: 'r1', toPinId: 'p1', color: '#dc2626' },
      { id: 'w3', fromCompId: 'r1', fromPinId: 'p2', toCompId: 'led1', toPinId: 'anode', color: '#2563eb' },
      { id: 'w4', fromCompId: 'led1', fromPinId: 'cathode', toCompId: 'bat1', toPinId: 'neg', color: '#111827' }
    ],
    schematicBox: { x: 285, y: 345, width: 180, height: 135 }
  },
  // 4. Ohm's Law
  {
    id: 'ohms_law',
    fileName: 'Ohms Law.cwz',
    category: 'Elementary Circuits',
    subGroup: 'Electrical Theory',
    title: "Ohm's Law",
    titleAr: 'تحقيق قانون أوم (Ohm\'s Law: V = I × R)',
    desc: 'Verify Ohm\'s Law by measuring current and voltage across a precision 1kΩ resistor with live instruments.',
    sheetTitle: 'Electrical Theory',
    instructions: {
      title: "Ohm's Law • Relationship between V, I, and R.",
      line1: 'Current is directly proportional to voltage and inversely to resistance.',
      line2: 'With 9V and 1kΩ, the circuit draws exactly 9mA.'
    },
    elements: [
      { id: 'bat1', ref: 'B1', kind: 'battery_9v', name: '9V Battery', nameAr: 'بطارية 9V', x: 130, y: 310, rotation: 0, value: 9, unit: 'V' },
      { id: 'sw1', ref: 'SW1', kind: 'switch_spst', name: 'Switch SW1', nameAr: 'مفتاح SW1', x: 215, y: 175, rotation: 0, value: 0, unit: '', state: true },
      { id: 'r1', ref: 'R1', kind: 'resistor', name: '1kΩ Resistor', nameAr: 'مقاومة 1k', x: 280, y: 285, rotation: 0, value: 1000, unit: 'Ω' },
      { id: 'vm1', ref: 'VM1', kind: 'voltmeter', name: 'Voltmeter', nameAr: 'فولتميتر', x: 380, y: 285, rotation: 0, value: 0, unit: 'V' }
    ],
    wires: [
      { id: 'w1', fromCompId: 'bat1', fromPinId: 'pos', toCompId: 'sw1', toPinId: 'p1', color: '#dc2626' },
      { id: 'w2', fromCompId: 'sw1', fromPinId: 'p2', toCompId: 'r1', toPinId: 'p1', color: '#2563eb' },
      { id: 'w3', fromCompId: 'r1', fromPinId: 'p2', toCompId: 'bat1', toPinId: 'neg', color: '#111827' },
      { id: 'w4', fromCompId: 'r1', fromPinId: 'p1', toCompId: 'vm1', toPinId: 'pos', color: '#dc2626' },
      { id: 'w5', fromCompId: 'r1', fromPinId: 'p2', toCompId: 'vm1', toPinId: 'neg', color: '#111827' }
    ],
    schematicBox: { x: 285, y: 345, width: 180, height: 135 }
  },
  // 5. Doorbell Circuit
  {
    id: 'doorbell_circuit',
    fileName: 'Doorbell Circuit.cwz',
    category: 'Elementary Circuits',
    subGroup: 'General',
    title: 'Doorbell Circuit',
    titleAr: 'دائرة جرس الباب (Doorbell Circuit)',
    desc: 'A momentary push-to-make switch triggers an audible piezoelectric sounder/buzzer.',
    sheetTitle: 'Elementary Circuit',
    instructions: {
      title: 'Doorbell Circuit • Push to sound buzzer.',
      line1: 'Click Run, then click the switch to complete the loop.',
      line2: 'The piezoelectric buzzer sounds with clear acoustic feedback.'
    },
    elements: [
      { id: 'bat1', ref: 'B1', kind: 'battery_9v', name: '9V Battery', nameAr: 'بطارية 9V', x: 130, y: 310, rotation: 0, value: 9, unit: 'V' },
      { id: 'sw1', ref: 'SW1', kind: 'push_button', name: 'Push SW1', nameAr: 'زر ضاغط', x: 215, y: 175, rotation: 0, value: 0, unit: '', state: true },
      { id: 'bz1', ref: 'BZ1', kind: 'buzzer', name: 'Piezo Buzzer', nameAr: 'جرس تنبيه', x: 275, y: 285, rotation: 0, value: 9, unit: 'V' }
    ],
    wires: [
      { id: 'w1', fromCompId: 'bat1', fromPinId: 'pos', toCompId: 'sw1', toPinId: 'p1', color: '#dc2626' },
      { id: 'w2', fromCompId: 'sw1', fromPinId: 'p2', toCompId: 'bz1', toPinId: 'pos', color: '#2563eb' },
      { id: 'w3', fromCompId: 'bz1', fromPinId: 'neg', toCompId: 'bat1', toPinId: 'neg', color: '#111827' }
    ],
    schematicBox: { x: 285, y: 345, width: 180, height: 135 }
  },
  // 6. Motor Circuit
  {
    id: 'motor_circuit',
    fileName: 'Motor Circuit.cwz',
    category: 'Elementary Circuits',
    subGroup: 'Mechanisms',
    title: 'Motor Circuit',
    titleAr: 'دائرة تشغيل محرك DC المستمر',
    desc: 'Demonstrates electromagnetic rotary actuation with a high-torque DC motor and on/off power switch.',
    sheetTitle: 'Mechanisms',
    instructions: {
      title: 'Motor Circuit • Electric drive and rotation.',
      line1: 'Click Run and flip switch SW1 to close the circuit.',
      line2: 'Observe the kinetic rotational motion of the rotor shaft.'
    },
    elements: [
      { id: 'bat1', ref: 'B1', kind: 'battery_4aa', name: '6V Battery Pack', nameAr: 'بطارية 6V', x: 130, y: 310, rotation: 0, value: 6, unit: 'V' },
      { id: 'sw1', ref: 'SW1', kind: 'switch_spst', name: 'Switch SW1', nameAr: 'مفتاح SW1', x: 215, y: 175, rotation: 0, value: 0, unit: '', state: true },
      { id: 'mot1', ref: 'M1', kind: 'motor', name: 'DC Motor', nameAr: 'محرك DC', x: 275, y: 285, rotation: 0, value: 6, unit: 'V' }
    ],
    wires: [
      { id: 'w1', fromCompId: 'bat1', fromPinId: 'pos', toCompId: 'sw1', toPinId: 'p1', color: '#dc2626' },
      { id: 'w2', fromCompId: 'sw1', fromPinId: 'p2', toCompId: 'mot1', toPinId: 'p1', color: '#2563eb' },
      { id: 'w3', fromCompId: 'mot1', fromPinId: 'p2', toCompId: 'bat1', toPinId: 'neg', color: '#111827' }
    ],
    schematicBox: { x: 285, y: 345, width: 180, height: 135 }
  },
  // 7. Breadboard Starter Circuit
  {
    id: 'breadboard_starter',
    fileName: 'Breadboard Experiment.cwz',
    category: 'Basic Circuits',
    subGroup: 'General',
    title: 'Breadboard Prototyping',
    titleAr: 'تجارب لوحة التجارب (Breadboard)',
    desc: 'Solderless breadboard layout with power rails, switch, limiting resistor, and LED ready for prototyping.',
    sheetTitle: 'Breadboard Circuit',
    instructions: {
      title: 'Breadboard Prototyping • Solderless assembly.',
      line1: 'Connect battery leads to the power rails and build your circuit.',
      line2: 'Drag components freely across the board.'
    },
    elements: [
      { id: 'bb1', ref: 'BB1', kind: 'breadboard', name: 'Breadboard', nameAr: 'لوحة Breadboard', x: 380, y: 280, rotation: 0, value: 0, unit: '' },
      { id: 'bat1', ref: 'B1', kind: 'battery_9v', name: '9V Battery', nameAr: 'بطارية 9V', x: 130, y: 280, rotation: 0, value: 9, unit: 'V' },
      { id: 'sw1', ref: 'SW1', kind: 'switch_spst', name: 'Toggle SW1', nameAr: 'مفتاح SW1', x: 380, y: 180, rotation: 0, value: 0, unit: '', state: true },
      { id: 'r1', ref: 'R1', kind: 'resistor', name: '330Ω Resistor', nameAr: 'مقاومة 330 أوم', x: 380, y: 280, rotation: 90, value: 330, unit: 'Ω' },
      { id: 'led1', ref: 'LED1', kind: 'led', name: 'Green LED', nameAr: 'LED أخضر', x: 380, y: 380, rotation: 0, value: 2.2, unit: 'V', color: '#22c55e' }
    ],
    wires: [
      { id: 'w1', fromCompId: 'bat1', fromPinId: 'pos', toCompId: 'bb1', toPinId: 'pos_top', color: '#dc2626' },
      { id: 'w2', fromCompId: 'bat1', fromPinId: 'neg', toCompId: 'bb1', toPinId: 'neg_top', color: '#111827' },
      { id: 'w3', fromCompId: 'bb1', fromPinId: 'pos_top', toCompId: 'sw1', toPinId: 'p1', color: '#dc2626' },
      { id: 'w4', fromCompId: 'sw1', fromPinId: 'p2', toCompId: 'r1', toPinId: 'p1', color: '#2563eb' },
      { id: 'w5', fromCompId: 'r1', fromPinId: 'p2', toCompId: 'led1', toPinId: 'anode', color: '#2563eb' },
      { id: 'w6', fromCompId: 'led1', fromPinId: 'cathode', toCompId: 'bb1', toPinId: 'neg_top', color: '#111827' }
    ]
  }
];

// ==========================================
// 4. Component Gallery Definition
// ==========================================
export interface GalleryItem {
  kind: ComponentKind;
  name: string;
  nameAr: string;
  category: string;
  defaultVal: number;
  unit: string;
}

export const GALLERY_CATEGORIES = [
  'Power Supplies',
  'Boards & Prototyping',
  'Input Components',
  'Passive Components',
  'Discrete Semiconductors',
  'Output Components',
  'Test Equipment'
] as const;

export const GALLERY_ITEMS: GalleryItem[] = [
  { kind: 'battery_aa', name: 'AA Battery 1.5V', nameAr: 'بطارية 1.5V AA', category: 'Power Supplies', defaultVal: 1.5, unit: 'V' },
  { kind: 'battery_9v', name: 'PP3 9V Battery with Clip', nameAr: 'بطارية 9V مع كلبس', category: 'Power Supplies', defaultVal: 9, unit: 'V' },
  { kind: 'battery_4aa', name: '4 x AA Battery Pack 6V', nameAr: 'حزمة بطاريات 4xAA (6V)', category: 'Power Supplies', defaultVal: 6, unit: 'V' },
  { kind: 'breadboard', name: 'Solderless Breadboard', nameAr: 'لوحة تجارب Breadboard', category: 'Boards & Prototyping', defaultVal: 0, unit: '' },
  { kind: 'switch_spst', name: 'SPST Toggle Switch', nameAr: 'مفتاح تبديل SPST', category: 'Input Components', defaultVal: 0, unit: '' },
  { kind: 'push_button', name: 'Push-to-Make Switch', nameAr: 'زر ضاغط لحظي Push Button', category: 'Input Components', defaultVal: 0, unit: '' },
  { kind: 'potentiometer', name: 'Rotary Potentiometer 10k', nameAr: 'مقاومة متغيرة Potentiometer', category: 'Input Components', defaultVal: 10000, unit: 'Ω' },
  { kind: 'resistor', name: 'Resistor 1kΩ (Carbon Film)', nameAr: 'مقاومة كربونية', category: 'Passive Components', defaultVal: 1000, unit: 'Ω' },
  { kind: 'capacitor', name: 'Capacitor 100μF', nameAr: 'مكثف كيميائي 100μF', category: 'Passive Components', defaultVal: 100, unit: 'μF' },
  { kind: 'led', name: '5mm Red LED', nameAr: 'دايود ضوئي LED', category: 'Discrete Semiconductors', defaultVal: 2.1, unit: 'V' },
  { kind: 'diode', name: '1N4007 Rectifier Diode', nameAr: 'دايود سيليكون 1N4007', category: 'Discrete Semiconductors', defaultVal: 0.7, unit: 'V' },
  { kind: 'bulb', name: 'Filament Lamp 1.5V', nameAr: 'مصباح متوهج 1.5V', category: 'Output Components', defaultVal: 1.5, unit: 'V' },
  { kind: 'buzzer', name: 'Piezo Buzzer 9V', nameAr: 'جرس رنان Piezo Buzzer', category: 'Output Components', defaultVal: 9, unit: 'V' },
  { kind: 'motor', name: 'Miniature DC Motor', nameAr: 'محرك تيار مستمر DC', category: 'Output Components', defaultVal: 6, unit: 'V' },
  { kind: 'voltmeter', name: 'Digital Voltmeter', nameAr: 'فولتميتر رقمي', category: 'Test Equipment', defaultVal: 0, unit: 'V' },
  { kind: 'ammeter', name: 'Digital Ammeter', nameAr: 'أميتر رقمي', category: 'Test Equipment', defaultVal: 0, unit: 'A' }
];

// ==========================================
// 5. Main Component: CircuitWizardLab
// ==========================================
export function CircuitWizardLab() {
  // Current active circuit / project
  const [activeCircuit, setActiveCircuit] = useState<CWSampleCircuit>(CW_SAMPLE_CIRCUITS[0]);
  const [elements, setElements] = useState<CWElement[]>(CW_SAMPLE_CIRCUITS[0].elements);
  const [wires, setWires] = useState<CWWire[]>(CW_SAMPLE_CIRCUITS[0].wires);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentTick, setCurrentTick] = useState<number>(0);

  // View Mode: 'realworld' | 'normal' | 'current_flow' | 'voltage_levels' | 'standard'
  const [mode, setMode] = useState<CircuitWizardMode>('realworld');

  // Interactive Selection, Dragging & Wiring
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [wiringFrom, setWiringFrom] = useState<{ compId: string; pinId: string; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [wireColor, setWireColor] = useState<string>('#dc2626');
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Right sidebar tab ('assistant' | 'gallery' | null)
  const [rightTab, setRightTab] = useState<'assistant' | 'gallery' | null>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return null;
    return 'assistant';
  });
  const [gallerySelectedCategory, setGallerySelectedCategory] = useState<string>('Power Supplies');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'Elementary Circuits': true,
    'General': true,
    'Electrical Theory': true,
    'Measuring': true,
    'Mechanisms': true,
    'Basic Circuits': false,
    'Advanced Circuits': false
  });

  // Bottom sheet tab: 'circuit' | 'bom'
  const [bottomTab, setBottomTab] = useState<'circuit' | 'bom'>('circuit');

  // Zoom level (default 100%)
  const [zoomPercent, setZoomPercent] = useState<number>(100);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const labContainerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Sound enabled
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals
  const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('My Circuit');
  const [showPropertiesModal, setShowPropertiesModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [editingComp, setEditingComp] = useState<CWElement | null>(null);

  // Active menu dropdown
  const [activeMenu, setActiveMenu] = useState<'file' | 'edit' | 'view' | 'project' | 'help' | null>(null);

  // Clipboard & Undo History
  const [clipboardComp, setClipboardComp] = useState<CWElement | null>(null);
  const [historyStack, setHistoryStack] = useState<Array<{ elements: CWElement[]; wires: CWWire[] }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ----------------------------------------------------
  // Dynamic Circuit Physics Solver
  // ----------------------------------------------------
  const solvedState = useMemo(() => {
    if (!isSimulating || isPaused) {
      return { isLoopActive: false, elementValues: {}, hasShortCircuit: false, meterReadings: {} };
    }

    const batteries = elements.filter(
      (e) => e.kind === 'battery_aa' || e.kind === 'battery_9v' || e.kind === 'battery_4aa'
    );
    if (batteries.length === 0) {
      return { isLoopActive: false, elementValues: {}, hasShortCircuit: false, meterReadings: {} };
    }

    // Build pin connectivity adjacency map
    const adj: Record<string, Array<{ compId: string; pinId: string }>> = {};
    wires.forEach((w) => {
      const fromKey = `${w.fromCompId}:${w.fromPinId}`;
      const toKey = `${w.toCompId}:${w.toPinId}`;
      if (!adj[fromKey]) adj[fromKey] = [];
      if (!adj[toKey]) adj[toKey] = [];
      adj[fromKey].push({ compId: w.toCompId, pinId: w.toPinId });
      adj[toKey].push({ compId: w.fromCompId, pinId: w.fromPinId });
    });

    let isLoopActive = false;
    let hasShortCircuit = false;
    const elementValues: Record<
      string,
      { voltageDrop: number; currentThrough: number; isLit: boolean; isSpinning: boolean; isBuzzing: boolean }
    > = {};
    const meterReadings: Record<string, number> = {};

    batteries.forEach((bat) => {
      const posKey = `${bat.id}:pos`;
      const negKey = `${bat.id}:neg`;

      // BFS to find complete circuit loop
      const queue: Array<{ currentPinKey: string; currentCompId: string; pathComps: string[] }> = [
        { currentPinKey: posKey, currentCompId: bat.id, pathComps: [bat.id] }
      ];
      const visited = new Set<string>([posKey]);
      let closedLoopPath: string[] | null = null;

      while (queue.length > 0) {
        const { currentPinKey, pathComps } = queue.shift()!;
        if (currentPinKey === negKey && pathComps.length > 1) {
          closedLoopPath = pathComps;
          break;
        }

        const neighbors = adj[currentPinKey] || [];
        for (const n of neighbors) {
          const neighborKey = `${n.compId}:${n.pinId}`;
          if (!visited.has(neighborKey)) {
            visited.add(neighborKey);
            const comp = elements.find((e) => e.id === n.compId);
            if (!comp) continue;

            // If component is an open switch/pushbutton, path is blocked!
            if ((comp.kind === 'switch_spst' || comp.kind === 'push_button') && comp.state === false) {
              continue;
            }

            const compPins = COMPONENT_PINS[comp.kind] || [];
            for (const p of compPins) {
              const otherPinKey = `${comp.id}:${p.id}`;
              if (!visited.has(otherPinKey)) {
                visited.add(otherPinKey);
                queue.push({
                  currentPinKey: otherPinKey,
                  currentCompId: comp.id,
                  pathComps: [...pathComps, comp.id]
                });
              }
            }
          }
        }
      }

      if (closedLoopPath && closedLoopPath.length > 1) {
        isLoopActive = true;
        const vSource = bat.value || 1.5;

        // Calculate loop total equivalent resistance
        let rTotal = 0.2; // Internal battery resistance
        let hasLoad = false;

        closedLoopPath.forEach((cid) => {
          const c = elements.find((e) => e.id === cid);
          if (!c) return;
          if (c.kind === 'resistor') {
            rTotal += c.value || 1000;
            hasLoad = true;
          } else if (c.kind === 'bulb') {
            rTotal += 5; // ~5 ohms filament
            hasLoad = true;
          } else if (c.kind === 'potentiometer') {
            const potR = ((c.value || 10000) * (c.setting ?? 50)) / 100;
            rTotal += Math.max(1, potR);
            hasLoad = true;
          } else if (c.kind === 'led') {
            rTotal += 50; // LED internal drop
            hasLoad = true;
          } else if (c.kind === 'motor') {
            rTotal += 12; // Motor DC resistance
            hasLoad = true;
          } else if (c.kind === 'buzzer') {
            rTotal += 80;
            hasLoad = true;
          } else if (c.kind === 'ammeter') {
            rTotal += 0.05; // Ideal low resistance ammeter
          }
        });

        if (!hasLoad || rTotal < 0.5) {
          hasShortCircuit = true;
        }

        const loopCurrent = vSource / Math.max(0.1, rTotal);

        // Assign voltages & states
        closedLoopPath.forEach((cid) => {
          const c = elements.find((e) => e.id === cid);
          if (!c) return;

          let compV = 0;
          if (c.kind === 'bulb') {
            compV = Math.min(vSource, loopCurrent * 5);
            elementValues[cid] = {
              voltageDrop: compV,
              currentThrough: loopCurrent,
              isLit: compV > 0.5,
              isSpinning: false,
              isBuzzing: false
            };
          } else if (c.kind === 'led') {
            compV = Math.min(vSource, loopCurrent * 50);
            elementValues[cid] = {
              voltageDrop: compV,
              currentThrough: loopCurrent,
              isLit: loopCurrent > 0.002,
              isSpinning: false,
              isBuzzing: false
            };
          } else if (c.kind === 'motor') {
            compV = Math.min(vSource, loopCurrent * 12);
            elementValues[cid] = {
              voltageDrop: compV,
              currentThrough: loopCurrent,
              isLit: false,
              isSpinning: loopCurrent > 0.05,
              isBuzzing: false
            };
          } else if (c.kind === 'buzzer') {
            compV = Math.min(vSource, loopCurrent * 80);
            elementValues[cid] = {
              voltageDrop: compV,
              currentThrough: loopCurrent,
              isLit: false,
              isSpinning: false,
              isBuzzing: compV > 2.0
            };
          } else if (c.kind === 'resistor') {
            compV = loopCurrent * (c.value || 1000);
            elementValues[cid] = {
              voltageDrop: compV,
              currentThrough: loopCurrent,
              isLit: false,
              isSpinning: false,
              isBuzzing: false
            };
          } else if (c.kind === 'ammeter') {
            meterReadings[cid] = loopCurrent;
          }
        });

        // Compute voltmeter readings
        elements.filter(e => e.kind === 'voltmeter').forEach(vm => {
          // Check if connected across any element in the active loop
          meterReadings[vm.id] = vSource;
        });
      }
    });

    return { isLoopActive, elementValues, hasShortCircuit, meterReadings };
  }, [elements, wires, isSimulating, isPaused]);

  // Simulation tick loop for current flow animation
  useEffect(() => {
    if (!isSimulating || isPaused) return;
    const interval = setInterval(() => {
      setCurrentTick((t) => (t + 1) % 1000);
    }, 40);
    return () => clearInterval(interval);
  }, [isSimulating, isPaused]);

  // Buzzer & Short circuit audio effects
  useEffect(() => {
    if (!soundEnabled || !isSimulating || isPaused) return;
    if (solvedState.hasShortCircuit) {
      cwAudio.playShortCircuitAlert();
    } else {
      const buzzing = Object.values(solvedState.elementValues).some((v) => v.isBuzzing);
      if (buzzing) {
        cwAudio.playBuzzer();
      }
    }
  }, [solvedState, isSimulating, isPaused, soundEnabled]);

  // Convert client coordinates to SVG canvas coordinates
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 370, y: 280 };
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 740 / (rect.width || 740);
    const scaleY = 540 / (rect.height || 540);
    return {
      x: Math.max(10, Math.min(730, (clientX - rect.left) * scaleX)),
      y: Math.max(10, Math.min(530, (clientY - rect.top) * scaleY))
    };
  }, []);

  // ----------------------------------------------------
  // Project Actions: New, Load, Reset, Clipboard & History
  // ----------------------------------------------------
  const pushHistory = useCallback(() => {
    setHistoryStack((prev) => [...prev.slice(-15), { elements: [...elements], wires: [...wires] }]);
  }, [elements, wires]);

  const handleUndo = useCallback(() => {
    if (historyStack.length === 0) return;
    const last = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    setElements(last.elements);
    setWires(last.wires);
    setSelectedCompId(null);
    setSelectedWireId(null);
  }, [historyStack]);

  const handleCopy = useCallback(() => {
    const comp = elements.find((e) => e.id === selectedCompId);
    if (comp) {
      setClipboardComp(comp);
    }
  }, [elements, selectedCompId]);

  const handleCut = useCallback(() => {
    const comp = elements.find((e) => e.id === selectedCompId);
    if (comp) {
      pushHistory();
      setClipboardComp(comp);
      setElements((prev) => prev.filter((el) => el.id !== comp.id));
      setWires((prev) => prev.filter((w) => w.fromCompId !== comp.id && w.toCompId !== comp.id));
      setSelectedCompId(null);
    }
  }, [elements, selectedCompId, pushHistory]);

  const handlePaste = useCallback(() => {
    if (!clipboardComp) return;
    pushHistory();
    const newId = `comp_${Date.now()}`;
    const newRef = `${clipboardComp.kind.slice(0, 2).toUpperCase()}${elements.length + 1}`;
    const dup: CWElement = {
      ...clipboardComp,
      id: newId,
      ref: newRef,
      x: Math.min(680, clipboardComp.x + 35),
      y: Math.min(480, clipboardComp.y + 35)
    };
    setElements((prev) => [...prev, dup]);
    setSelectedCompId(newId);
  }, [clipboardComp, elements.length, pushHistory]);

  const handleClearCanvas = useCallback(() => {
    if (elements.length > 0 || wires.length > 0) {
      pushHistory();
      setElements([]);
      setWires([]);
      setSelectedCompId(null);
      setSelectedWireId(null);
      setWiringFrom(null);
    }
  }, [elements.length, wires.length, pushHistory]);

  const handleSelectAll = useCallback(() => {
    if (elements.length > 0) {
      setSelectedCompId(elements[0].id);
    }
  }, [elements]);

  const handleSaveCWZ = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ activeCircuit, elements, wires }));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", activeCircuit.fileName);
    dl.click();
  }, [activeCircuit, elements, wires]);

  const handleImportCWZ = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.elements) {
          pushHistory();
          if (data.activeCircuit) setActiveCircuit(data.activeCircuit);
          setElements(data.elements || []);
          setWires(data.wires || []);
          setSelectedCompId(null);
          setSelectedWireId(null);
        }
      } catch {
        // Safe fallback
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [pushHistory]);

  const handleStartBlankProject = (customName?: string) => {
    pushHistory();
    const finalName = customName && customName.trim() ? customName.trim() : (newProjectName.trim() || 'Untitled');
    const cleanFileName = finalName.endsWith('.cwz') ? finalName : `${finalName}.cwz`;

    setElements([]);
    setWires([]);
    setSelectedCompId(null);
    setSelectedWireId(null);
    setWiringFrom(null);
    setActiveCircuit({
      id: `custom_project_${Date.now()}`,
      fileName: cleanFileName,
      category: 'Basic Circuits',
      subGroup: 'General',
      title: finalName,
      titleAr: `مشروع مخصص: ${finalName}`,
      desc: 'مشروع دارة إلكترونية فارغ جديد يمكنك إضافة أي مكونات وبنائه بحرية.',
      sheetTitle: 'Circuit Diagram',
      instructions: {
        title: `${finalName} • New Custom Project`,
        line1: 'Add components from the Gallery or the quick toolbar above.',
        line2: 'Drag them to place and click on pins to connect wires.'
      },
      elements: [],
      wires: []
    });
    setBottomTab('circuit');
    setIsSimulating(true);
    setIsPaused(false);
    setShowNewProjectModal(false);
  };

  const handleStartBreadboardProject = () => {
    pushHistory();
    handleLoadSample(CW_SAMPLE_CIRCUITS[6]);
    setShowNewProjectModal(false);
  };

  const handleLoadSample = (sample: CWSampleCircuit) => {
    pushHistory();
    // Ensure all switches and buttons are closed (state: true) so the circuit runs immediately!
    const elementsToLoad = sample.elements.map(el => {
      if (el.kind === 'switch_spst' || el.kind === 'push_button') {
        return { ...el, state: true };
      }
      return { ...el };
    });
    setActiveCircuit(sample);
    setElements(elementsToLoad);
    setWires(sample.wires);
    setSelectedCompId(null);
    setSelectedWireId(null);
    setWiringFrom(null);
    setBottomTab('circuit');
    setIsSimulating(true);
    setIsPaused(false);
    setShowNewProjectModal(false);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setRightTab(null);
    }
  };

  // ----------------------------------------------------
  // Component Manipulation: Add, Drag, Rotate, Delete
  // ----------------------------------------------------
  const handleAddComponent = (item: GalleryItem, pos?: { x: number; y: number }) => {
    if (soundEnabled) cwAudio.playWireConnect();
    const newId = `comp_${Date.now()}_${Math.floor(Math.random() * 100)}`;
    const newRef = `${item.kind.slice(0, 2).toUpperCase()}${elements.length + 1}`;
    
    // Default coordinates or dropped coordinates
    const targetX = pos?.x ?? (240 + (elements.length % 5) * 45);
    const targetY = pos?.y ?? (200 + (elements.length % 4) * 40);

    const newEl: CWElement = {
      id: newId,
      ref: newRef,
      kind: item.kind,
      name: item.name,
      nameAr: item.nameAr,
      x: targetX,
      y: targetY,
      rotation: 0,
      value: item.defaultVal,
      unit: item.unit,
      state: true,
      color: '#ef4444'
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedCompId(newId);

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setRightTab(null);
    }
  };

  // Drag component on canvas
  const handleCompMouseDown = (e: React.MouseEvent | React.TouchEvent, comp: CWElement) => {
    e.stopPropagation();
    setSelectedCompId(comp.id);
    setSelectedWireId(null);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const coords = getCanvasCoords(clientX, clientY);

    setDraggingCompId(comp.id);
    setDragOffset({
      x: coords.x - comp.x,
      y: coords.y - comp.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const coords = getCanvasCoords(clientX, clientY);
    setMousePos(coords);

    if (draggingCompId) {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id === draggingCompId) {
            const newX = Math.max(30, Math.min(710, coords.x - dragOffset.x));
            const newY = Math.max(30, Math.min(510, coords.y - dragOffset.y));
            return { ...el, x: newX, y: newY };
          }
          return el;
        })
      );
    }
  };

  const handleMouseUp = () => {
    setDraggingCompId(null);
  };

  // Toggle switch/button state
  const handleToggleSwitch = (id: string) => {
    if (soundEnabled) cwAudio.playSwitchClick();
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === id) {
          return { ...el, state: !el.state };
        }
        return el;
      })
    );
  };

  // Rotate component
  const handleRotateComponent = (id: string) => {
    if (soundEnabled) cwAudio.playWireConnect();
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === id) {
          const nextRot = ((el.rotation || 0) + 90) % 360;
          return { ...el, rotation: nextRot };
        }
        return el;
      })
    );
  };

  // Delete component and all connected wires
  const handleDeleteComponent = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setWires((prev) => prev.filter((w) => w.fromCompId !== id && w.toCompId !== id));
    setSelectedCompId(null);
  };

  // Duplicate component
  const handleDuplicateComponent = (comp: CWElement) => {
    const newId = `comp_${Date.now()}`;
    const newRef = `${comp.kind.slice(0, 2).toUpperCase()}${elements.length + 1}`;
    const dup: CWElement = {
      ...comp,
      id: newId,
      ref: newRef,
      x: Math.min(680, comp.x + 35),
      y: Math.min(480, comp.y + 35)
    };
    setElements((prev) => [...prev, dup]);
    setSelectedCompId(newId);
  };

  // ----------------------------------------------------
  // Interactive Wiring Tool
  // ----------------------------------------------------
  const handlePinClick = (e: React.MouseEvent | React.TouchEvent, comp: CWElement, pinId: string) => {
    e.stopPropagation();
    const pinPos = getPinAbsolutePos(comp, pinId);

    if (!wiringFrom) {
      if (soundEnabled) cwAudio.playWireConnect();
      setWiringFrom({
        compId: comp.id,
        pinId: pinId,
        x: pinPos.x,
        y: pinPos.y
      });
      setSelectedCompId(null);
      setSelectedWireId(null);
    } else {
      if (wiringFrom.compId === comp.id && wiringFrom.pinId === pinId) {
        setWiringFrom(null);
        return;
      }
      if (soundEnabled) cwAudio.playWireConnect();
      const newWire: CWWire = {
        id: `wire_${Date.now()}`,
        fromCompId: wiringFrom.compId,
        fromPinId: wiringFrom.pinId,
        toCompId: comp.id,
        toPinId: pinId,
        color: wireColor
      };
      setWires((prev) => [...prev, newWire]);
      setWiringFrom(null);
    }
  };

  // Delete selected wire
  const handleDeleteWire = (wireId: string) => {
    setWires((prev) => prev.filter((w) => w.id !== wireId));
    setSelectedWireId(null);
  };

  // Selected element object for inspector
  const selectedComp = useMemo(() => {
    return elements.find((e) => e.id === selectedCompId) || null;
  }, [elements, selectedCompId]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!labContainerRef.current) return;
    if (!document.fullscreenElement) {
      labContainerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // HTML5 Drag and Drop handlers onto SVG Canvas
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const item: GalleryItem = JSON.parse(dataStr);
        const coords = getCanvasCoords(e.clientX, e.clientY);
        handleAddComponent(item, coords);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div
      ref={labContainerRef}
      dir="ltr"
      className="w-full bg-[#808080] text-slate-900 select-none font-['Tahoma',sans-serif] text-xs flex flex-col shadow-2xl border border-[#404040] overflow-hidden rounded-md transition-all force-ltr"
      style={{
        direction: 'ltr',
        height: isFullscreen ? '100vh' : 'calc(100vh - 145px)',
        minHeight: '520px',
        maxHeight: isFullscreen ? 'none' : '880px',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
      onClick={() => {
        if (activeMenu) setActiveMenu(null);
        if (wiringFrom) setWiringFrom(null);
      }}
    >
      {/* ======================================================== */}
      {/* 1. Classic Title Bar: Circuit Wizard - [Filename]        */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-[#0a246a] via-[#0055ea] to-[#3a6ea5] text-white px-2 py-1 flex items-center justify-between shrink-0 font-bold select-none border-b border-[#002266]">
        {/* App Icon + Title */}
        <div className="flex items-center gap-1.5 truncate">
          <div className="w-4 h-4 bg-white rounded-xs p-0.5 flex items-center justify-center shrink-0 shadow">
            <svg viewBox="0 0 24 24" className="w-full h-full text-indigo-700">
              <path fill="currentColor" d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 7l3-4 3 6 3-3 2 1" />
            </svg>
          </div>
          <span className="text-[11px] sm:text-xs tracking-wide truncate">
            Circuit Wizard - [{activeCircuit.fileName}]
          </span>
        </div>

        {/* Windows Window Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setZoomPercent(100)}
            className="w-5 h-4 bg-[#ece9d8] hover:bg-[#ffffff] text-black text-[9px] font-bold flex items-center justify-center border border-[#7a7a7a] shadow-inner"
            title="Reset Zoom (100%)"
          >
            _
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-5 h-4 bg-[#ece9d8] hover:bg-[#ffffff] text-black text-[9px] font-bold flex items-center justify-center border border-[#7a7a7a] shadow-inner"
            title={isFullscreen ? 'Restore' : 'Maximize'}
          >
            {isFullscreen ? '❐' : '□'}
          </button>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="w-5 h-4 bg-[#e81123] hover:bg-[#f65314] text-white text-[9px] font-bold flex items-center justify-center border border-[#7a7a7a]"
            title="New Project (مشروع جديد)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Hidden file input for importing .cwz files */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".cwz,.json"
        onChange={handleImportCWZ}
        className="hidden"
      />

      {/* ======================================================== */}
      {/* 2. Menu Bar: File • Edit • View • Project • Help         */}
      {/* ======================================================== */}
      <div className="bg-[#ece9d8] border-b border-[#aca899] px-2 py-0.5 flex items-center gap-0.5 text-[11px] text-slate-800 shrink-0 relative overflow-x-auto no-scrollbar font-medium">
        {/* Menu Item: File */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'file' ? null : 'file');
            }}
            className={`px-2 py-0.5 rounded hover:bg-[#316ac5] hover:text-white transition-colors ${
              activeMenu === 'file' ? 'bg-[#316ac5] text-white' : ''
            }`}
          >
            <span className="underline">F</span>ile
          </button>
          {activeMenu === 'file' && (
            <div className="absolute left-0 top-full mt-0.5 w-56 bg-white border border-[#7a7a7a] shadow-xl rounded-sm py-1 z-50 text-[11px] text-slate-800 divide-y divide-slate-100">
              <div className="py-0.5">
                <button
                  onClick={() => {
                    setShowNewProjectModal(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between"
                >
                  <span className="font-bold flex items-center gap-1.5">
                    <FilePlus className="w-3.5 h-3.5 text-blue-600" />
                    New Project (مشروع جديد)...
                  </span>
                  <span className="text-[10px] text-slate-400">Ctrl+N</span>
                </button>
                <button
                  onClick={() => {
                    setRightTab('assistant');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                    Open Sample Circuits...
                  </span>
                  <span className="text-[10px] text-slate-400">Ctrl+O</span>
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    Import .cwz File...
                  </span>
                </button>
              </div>
              <div className="py-0.5">
                <button
                  onClick={() => {
                    handleSaveCWZ();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5 text-blue-600" />
                    Save .cwz File
                  </span>
                  <span className="text-[10px] text-slate-400">Ctrl+S</span>
                </button>
                <button
                  onClick={() => {
                    window.print();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    Print / Export Sheet...
                  </span>
                  <span className="text-[10px] text-slate-400">Ctrl+P</span>
                </button>
              </div>
              <div className="py-0.5">
                <button
                  onClick={() => {
                    handleClearCanvas();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-rose-600 hover:text-white flex items-center justify-between text-rose-700"
                >
                  <span className="flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    Clear Canvas (مسح الكل)
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Menu Item: Edit */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'edit' ? null : 'edit');
            }}
            className={`px-2 py-0.5 rounded hover:bg-[#316ac5] hover:text-white transition-colors ${
              activeMenu === 'edit' ? 'bg-[#316ac5] text-white' : ''
            }`}
          >
            <span className="underline">E</span>dit
          </button>
          {activeMenu === 'edit' && (
            <div className="absolute left-0 top-full mt-0.5 w-52 bg-white border border-[#7a7a7a] shadow-xl rounded-sm py-1 z-50 text-[11px] text-slate-800 divide-y divide-slate-100">
              <div className="py-0.5">
                <button
                  onClick={() => {
                    handleUndo();
                    setActiveMenu(null);
                  }}
                  disabled={historyStack.length === 0}
                  className={`w-full text-left px-3 py-1 flex items-center justify-between ${
                    historyStack.length > 0 ? 'hover:bg-[#316ac5] hover:text-white' : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Undo (تراجع)
                  </span>
                  <span className="text-[10px] text-slate-400">Ctrl+Z</span>
                </button>
              </div>
              <div className="py-0.5">
                <button
                  onClick={() => {
                    handleCut();
                    setActiveMenu(null);
                  }}
                  disabled={!selectedCompId}
                  className={`w-full text-left px-3 py-1 flex items-center justify-between ${
                    selectedCompId ? 'hover:bg-[#316ac5] hover:text-white' : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5" />
                    Cut Selected (قص)
                  </span>
                  <span className="text-[10px] text-slate-400">Ctrl+X</span>
                </button>
                <button
                  onClick={() => {
                    handleCopy();
                    setActiveMenu(null);
                  }}
                  disabled={!selectedCompId}
                  className={`w-full text-left px-3 py-1 flex items-center justify-between ${
                    selectedCompId ? 'hover:bg-[#316ac5] hover:text-white' : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5" />
                    Copy Selected (نسخ)
                  </span>
                  <span className="text-[10px] text-slate-400">Ctrl+C</span>
                </button>
                <button
                  onClick={() => {
                    handlePaste();
                    setActiveMenu(null);
                  }}
                  disabled={!clipboardComp}
                  className={`w-full text-left px-3 py-1 flex items-center justify-between ${
                    clipboardComp ? 'hover:bg-[#316ac5] hover:text-white font-bold' : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clipboard className="w-3.5 h-3.5" />
                    Paste (لصق)
                  </span>
                  <span className="text-[10px] text-slate-400">Ctrl+V</span>
                </button>
              </div>
              <div className="py-0.5">
                {selectedCompId && (
                  <button
                    onClick={() => {
                      handleRotateComponent(selectedCompId);
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5" />
                      Rotate 90°
                    </span>
                    <span className="text-[10px] text-slate-400">R</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    handleSelectAll();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between"
                >
                  <span>Select All (تحديد الكل)</span>
                  <span className="text-[10px] text-slate-400">Ctrl+A</span>
                </button>
                {(selectedCompId || selectedWireId) && (
                  <button
                    onClick={() => {
                      if (selectedCompId) handleDeleteComponent(selectedCompId);
                      else if (selectedWireId) handleDeleteWire(selectedWireId);
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1 hover:bg-rose-600 hover:text-white flex items-center justify-between text-rose-600"
                  >
                    <span className="flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Selected (حذف)
                    </span>
                    <span className="text-[10px] text-slate-400">Del</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Menu Item: View */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'view' ? null : 'view');
            }}
            className={`px-2 py-0.5 rounded hover:bg-[#316ac5] hover:text-white transition-colors ${
              activeMenu === 'view' ? 'bg-[#316ac5] text-white' : ''
            }`}
          >
            <span className="underline">V</span>iew
          </button>
          {activeMenu === 'view' && (
            <div className="absolute left-0 top-full mt-0.5 w-52 bg-white border border-[#7a7a7a] shadow-xl rounded-sm py-1 z-50 text-[11px] text-slate-800 divide-y divide-slate-100">
              <div className="py-0.5">
                <button onClick={() => { setMode('realworld'); setActiveMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between">
                  <span>Real World (المظهر الحقيقي)</span> {mode === 'realworld' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button onClick={() => { setMode('normal'); setActiveMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between">
                  <span>Normal (المخطط الرمزي)</span> {mode === 'normal' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button onClick={() => { setMode('current_flow'); setActiveMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between">
                  <span>Current Flow (مسار الشحنات)</span> {mode === 'current_flow' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button onClick={() => { setMode('voltage_levels'); setActiveMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between">
                  <span>Voltage Levels (مستويات الجهد)</span> {mode === 'voltage_levels' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              </div>
              <div className="py-0.5">
                <button onClick={() => { setShowGrid(!showGrid); setActiveMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between">
                  <span>Toggle Grid Dots (إظهار الشبكة)</span> {showGrid && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button onClick={() => { setZoomPercent((z) => Math.min(z + 10, 150)); setActiveMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between">
                  <span>Zoom In (تكبير)</span> <span className="text-[10px] text-slate-400">+10%</span>
                </button>
                <button onClick={() => { setZoomPercent((z) => Math.max(z - 10, 60)); setActiveMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between">
                  <span>Zoom Out (تصغير)</span> <span className="text-[10px] text-slate-400">-10%</span>
                </button>
                <button onClick={() => { setZoomPercent(100); setActiveMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between">
                  <span>Reset Zoom (100%)</span> <span className="text-[10px] text-slate-400">100%</span>
                </button>
                <button onClick={() => { toggleFullscreen(); setActiveMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between">
                  <span>Fullscreen (شاشة كاملة)</span> <span className="text-[10px] text-slate-400">{isFullscreen ? 'Esc' : 'F11'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Menu Item: Project */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'project' ? null : 'project');
            }}
            className={`px-2 py-0.5 rounded hover:bg-[#316ac5] hover:text-white transition-colors ${
              activeMenu === 'project' ? 'bg-[#316ac5] text-white' : ''
            }`}
          >
            <span className="underline">P</span>roject
          </button>
          {activeMenu === 'project' && (
            <div className="absolute left-0 top-full mt-0.5 w-52 bg-white border border-[#7a7a7a] shadow-xl rounded-sm py-1 z-50 text-[11px] text-slate-800 divide-y divide-slate-100">
              <div className="py-0.5">
                <button onClick={() => { setIsSimulating(true); setIsPaused(false); setActiveMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between font-bold text-emerald-700">
                  <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5 fill-current" /> Run Simulation</span> <span className="text-[10px] text-slate-400">F9</span>
                </button>
                <button onClick={() => { setIsPaused(!isPaused); setActiveMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between text-amber-700">
                  <span className="flex items-center gap-1.5"><Pause className="w-3.5 h-3.5 fill-current" /> Pause</span> <span className="text-[10px] text-slate-400">إيقاف مؤقت</span>
                </button>
                <button onClick={() => { setIsSimulating(false); setActiveMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between text-rose-700">
                  <span className="flex items-center gap-1.5"><Square className="w-3.5 h-3.5 fill-current" /> Stop</span> <span className="text-[10px] text-slate-400">إيقاف</span>
                </button>
              </div>
              <div className="py-0.5">
                <button onClick={() => { setRightTab('gallery'); setActiveMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> Component Gallery</span>
                </button>
                <button onClick={() => { setRightTab('assistant'); setActiveMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Sample Assistant</span>
                </button>
                <button onClick={() => { setBottomTab('bom'); setActiveMenu(null); }} className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Bill of Materials...</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Menu Item: Help */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'help' ? null : 'help');
            }}
            className={`px-2 py-0.5 rounded hover:bg-[#316ac5] hover:text-white transition-colors ${
              activeMenu === 'help' ? 'bg-[#316ac5] text-white' : ''
            }`}
          >
            <span className="underline">H</span>elp
          </button>
          {activeMenu === 'help' && (
            <div className="absolute left-0 top-full mt-0.5 w-56 bg-white border border-[#7a7a7a] shadow-xl rounded-sm py-1 z-50 text-[11px] text-slate-800 divide-y divide-slate-100">
              <div className="py-0.5">
                <button
                  onClick={() => {
                    setShowHelpModal(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    Circuit Wizard Guide (دليل الاستخدام)...
                  </span>
                  <span className="text-[10px] text-slate-400">F1</span>
                </button>
                <button
                  onClick={() => {
                    setShowHelpModal(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white flex items-center justify-between"
                >
                  <span>Keyboard Shortcuts (اختصارات لوحة المفاتيح)</span>
                </button>
              </div>
              <div className="py-0.5">
                <button
                  onClick={() => {
                    handleLoadSample(CW_SAMPLE_CIRCUITS[0]);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white text-slate-600"
                >
                  <span>Restore Default Circuit (استعادة الدائرة الافتراضية)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. Main Classic Toolbar: New, Run, Pause, Wire, Zoom      */}
      {/* ======================================================== */}
      <div className="bg-[#ece9d8] border-b border-[#aca899] px-2 py-1 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
        {/* New Project Button ("مشروع جديد") */}
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-[#aca899] rounded-xs font-bold flex items-center gap-1 text-slate-900 shadow-xs transition shrink-0 active:translate-y-0.5"
          title="New Project (مشروع جديد - Ctrl+N)"
        >
          <FilePlus className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[11px]">New</span>
        </button>

        {/* Open Sample Circuits */}
        <button
          onClick={() => setRightTab('assistant')}
          className="p-1 hover:bg-[#ffffff] active:bg-[#dfdfdf] border border-transparent hover:border-[#7a7a7a] rounded-xs transition shrink-0"
          title="Open Sample Circuits (نماذج تجارب جاهزة - Ctrl+O)"
        >
          <FolderOpen className="w-4 h-4 text-amber-600" />
        </button>

        {/* Import .cwz from PC */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1 hover:bg-[#ffffff] active:bg-[#dfdfdf] border border-transparent hover:border-[#7a7a7a] rounded-xs transition shrink-0"
          title="Open .cwz File from Computer (فتح ملف دارة من جهازك)"
        >
          <Upload className="w-4 h-4 text-slate-700" />
        </button>

        {/* Save */}
        <button
          onClick={handleSaveCWZ}
          className="p-1 hover:bg-[#ffffff] active:bg-[#dfdfdf] border border-transparent hover:border-[#7a7a7a] rounded-xs transition shrink-0"
          title="Save Circuit (.cwz) (حفظ ملف الدائرة - Ctrl+S)"
        >
          <Save className="w-4 h-4 text-blue-600" />
        </button>

        {/* Print / Export */}
        <button
          onClick={() => window.print()}
          className="p-1 hover:bg-[#ffffff] active:bg-[#dfdfdf] border border-transparent hover:border-[#7a7a7a] rounded-xs transition shrink-0"
          title="Print / Export Sheet (طباعة أو تصدير - Ctrl+P)"
        >
          <Printer className="w-4 h-4 text-slate-700" />
        </button>

        <div className="h-5 w-px bg-[#aca899] mx-0.5 sm:mx-1 shrink-0" />

        {/* Cut */}
        <button
          onClick={handleCut}
          disabled={!selectedCompId}
          className={`p-1 rounded-xs transition shrink-0 ${
            selectedCompId ? 'hover:bg-white text-slate-800' : 'text-slate-400 cursor-not-allowed'
          }`}
          title="Cut Selected (قص المكون - Ctrl+X)"
        >
          <Scissors className="w-3.5 h-3.5" />
        </button>

        {/* Copy */}
        <button
          onClick={handleCopy}
          disabled={!selectedCompId}
          className={`p-1 rounded-xs transition shrink-0 ${
            selectedCompId ? 'hover:bg-white text-slate-800' : 'text-slate-400 cursor-not-allowed'
          }`}
          title="Copy Selected (نسخ المكون - Ctrl+C)"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Paste */}
        <button
          onClick={handlePaste}
          disabled={!clipboardComp}
          className={`p-1 rounded-xs transition shrink-0 ${
            clipboardComp ? 'hover:bg-white text-blue-700 font-bold' : 'text-slate-400 cursor-not-allowed'
          }`}
          title="Paste (لصق المكون - Ctrl+V)"
        >
          <Clipboard className="w-3.5 h-3.5" />
        </button>

        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={historyStack.length === 0}
          className={`p-1 rounded-xs transition shrink-0 ${
            historyStack.length > 0 ? 'hover:bg-white text-slate-800' : 'text-slate-400 cursor-not-allowed'
          }`}
          title="Undo Last Action (تراجع - Ctrl+Z)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Delete */}
        <button
          onClick={() => {
            if (selectedCompId) handleDeleteComponent(selectedCompId);
            else if (selectedWireId) handleDeleteWire(selectedWireId);
          }}
          disabled={!selectedCompId && !selectedWireId}
          className={`p-1 rounded-xs transition shrink-0 ${
            selectedCompId || selectedWireId ? 'hover:bg-rose-100 text-rose-600' : 'text-slate-400 cursor-not-allowed'
          }`}
          title="Delete Selected (حذف - Del)"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Rotate */}
        <button
          onClick={() => selectedCompId && handleRotateComponent(selectedCompId)}
          disabled={!selectedCompId}
          className={`p-1 rounded-xs transition shrink-0 ${
            selectedCompId ? 'hover:bg-white text-slate-800' : 'text-slate-400 cursor-not-allowed'
          }`}
          title="Rotate 90° (تدوير 90 درجة - R)"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-px bg-[#aca899] mx-0.5 sm:mx-1 shrink-0" />

        {/* Simulation Controls: Run (Green ▶), Pause (❚❚), Stop (■) */}
        <div className="flex items-center gap-0.5 bg-[#dfdfdf] p-0.5 rounded-xs border border-[#aca899] shrink-0">
          <button
            onClick={() => {
              setIsSimulating(true);
              setIsPaused(false);
              // Ensure switches and pushbuttons are closed so project runs immediately
              setElements(prev => prev.map(el => {
                if (el.kind === 'switch_spst' || el.kind === 'push_button') {
                  return { ...el, state: true };
                }
                return el;
              }));
            }}
            className={`px-2 py-0.5 flex items-center gap-1 font-bold rounded-xs text-xs transition ${
              isSimulating && !isPaused
                ? 'bg-emerald-600 text-white shadow-inner'
                : 'hover:bg-emerald-100 text-emerald-800'
            }`}
            title="Run Simulation (بدء المحاكاة الحية - F9)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden xs:inline sm:inline">Run</span>
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1 rounded-xs transition ${
              isPaused ? 'bg-amber-500 text-white shadow-inner' : 'hover:bg-amber-100 text-slate-700'
            }`}
            title="Pause Simulation (إيقاف مؤقت)"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
          </button>

          <button
            onClick={() => {
              setIsSimulating(false);
              setIsPaused(false);
            }}
            className={`p-1 rounded-xs transition ${
              !isSimulating ? 'bg-rose-600 text-white shadow-inner' : 'hover:bg-rose-100 text-slate-700'
            }`}
            title="Stop Simulation (إيقاف تام)"
          >
            <Square className="w-3 h-3 fill-current text-rose-600" />
          </button>
        </div>

        <div className="h-5 w-px bg-[#aca899] mx-0.5 sm:mx-1 shrink-0" />

        {/* Wire Color Picker */}
        <div className="flex items-center gap-1 bg-white border border-[#aca899] px-1 py-0.5 rounded-xs shrink-0">
          <span className="text-[10px] text-slate-600 font-bold hidden sm:inline">Wire:</span>
          {[
            { c: '#dc2626', title: 'Red (موجب)' },
            { c: '#111827', title: 'Black (أرضي)' },
            { c: '#2563eb', title: 'Blue (إشارة)' },
            { c: '#16a34a', title: 'Green (توصيل)' }
          ].map(({ c, title }) => (
            <button
              key={c}
              onClick={() => setWireColor(c)}
              className={`w-3.5 h-3.5 rounded-full border transition ${
                wireColor === c ? 'ring-2 ring-blue-500 scale-110' : 'border-slate-300'
              }`}
              style={{ backgroundColor: c }}
              title={title}
            />
          ))}
        </div>

        {/* Toggle Grid */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1 rounded-xs border transition shrink-0 ${
            showGrid ? 'bg-blue-100 text-blue-700 border-blue-400' : 'hover:bg-white border-transparent text-slate-600'
          }`}
          title="Toggle Grid Dots (إظهار/إخفاء شبكة النقاط)"
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Zoom Controls */}
        <button
          onClick={() => setZoomPercent((z) => Math.min(z + 10, 150))}
          className="p-1 hover:bg-[#ffffff] active:bg-[#dfdfdf] border border-transparent hover:border-[#7a7a7a] rounded-xs transition shrink-0"
          title="Zoom In (تكبير)"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
        </button>
        <button
          onClick={() => setZoomPercent((z) => Math.max(z - 10, 60))}
          className="p-1 hover:bg-[#ffffff] active:bg-[#dfdfdf] border border-transparent hover:border-[#7a7a7a] rounded-xs transition shrink-0"
          title="Zoom Out (تصغير)"
        >
          <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 font-bold flex items-center justify-center text-slate-800 leading-none">−</span>
        </button>

        <div className="h-5 w-px bg-[#aca899] mx-0.5 sm:mx-1 shrink-0" />

        {/* Gallery Button ("معرض المكونات") */}
        <button
          onClick={() => setRightTab(rightTab === 'gallery' ? null : 'gallery')}
          className={`px-2 py-0.5 flex items-center gap-1 rounded-xs border transition shrink-0 font-bold ${
            rightTab === 'gallery'
              ? 'bg-[#316ac5] text-white border-[#002266]'
              : 'bg-white hover:bg-slate-100 border-[#aca899] text-blue-700'
          }`}
          title="Component Gallery (معرض المكونات الإلكترونية)"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Gallery</span>
        </button>

        {/* Assistant Button */}
        <button
          onClick={() => setRightTab(rightTab === 'assistant' ? null : 'assistant')}
          className={`px-2 py-0.5 flex items-center gap-1 rounded-xs border transition shrink-0 font-medium ${
            rightTab === 'assistant'
              ? 'bg-[#316ac5] text-white border-[#002266]'
              : 'bg-[#ece9d8] hover:bg-white border-[#aca899] text-slate-800'
          }`}
          title="Sample Circuits Assistant (مساعد التجارب النموذجية)"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Assistant</span>
        </button>

        {/* Guide / Help Button */}
        <button
          onClick={() => setShowHelpModal(true)}
          className="p-1 hover:bg-[#ffffff] active:bg-[#dfdfdf] border border-transparent hover:border-[#7a7a7a] rounded-xs transition shrink-0 text-blue-700"
          title="Circuit Wizard Guide (دليل استخدام البرنامج - F1)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-1 rounded-xs transition shrink-0 ${
            soundEnabled ? 'text-indigo-700' : 'text-slate-400'
          }`}
          title="Toggle Hardware Sounds (أصوات المفاتيح والأسلاك)"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* ======================================================== */}
      {/* 4. Quick Component Bar (Quick Palette)                   */}
      {/* ======================================================== */}
      <div className="bg-[#f0ede4] border-b border-[#aca899] px-2 py-0.5 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 text-[10px]">
        <span className="font-bold text-slate-600 uppercase tracking-tight shrink-0 hidden sm:inline">Add:</span>
        <button
          onClick={() => handleAddComponent(GALLERY_ITEMS[0])}
          className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 rounded-xs font-semibold text-slate-800 shrink-0"
        >
          + 1.5V AA
        </button>
        <button
          onClick={() => handleAddComponent(GALLERY_ITEMS[1])}
          className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 rounded-xs font-semibold text-slate-800 shrink-0"
        >
          + 9V Bat
        </button>
        <button
          onClick={() => handleAddComponent(GALLERY_ITEMS[3])}
          className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 rounded-xs font-semibold text-slate-800 shrink-0"
        >
          + Breadboard
        </button>
        <button
          onClick={() => handleAddComponent(GALLERY_ITEMS[4])}
          className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 rounded-xs font-semibold text-slate-800 shrink-0"
        >
          + Switch
        </button>
        <button
          onClick={() => handleAddComponent(GALLERY_ITEMS[11])}
          className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 rounded-xs font-semibold text-slate-800 shrink-0"
        >
          + Lamp
        </button>
        <button
          onClick={() => handleAddComponent(GALLERY_ITEMS[7])}
          className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 rounded-xs font-semibold text-slate-800 shrink-0"
        >
          + 1kΩ
        </button>
        <button
          onClick={() => handleAddComponent(GALLERY_ITEMS[9])}
          className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 rounded-xs font-semibold text-slate-800 shrink-0"
        >
          + LED
        </button>
        <button
          onClick={() => handleAddComponent(GALLERY_ITEMS[12])}
          className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 rounded-xs font-semibold text-slate-800 shrink-0"
        >
          + Buzzer
        </button>
        <button
          onClick={() => handleAddComponent(GALLERY_ITEMS[13])}
          className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 rounded-xs font-semibold text-slate-800 shrink-0"
        >
          + Motor
        </button>
        <button
          onClick={() => handleAddComponent(GALLERY_ITEMS[14])}
          className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 rounded-xs font-semibold text-slate-800 shrink-0"
        >
          + Voltmeter
        </button>
      </div>

      {/* ======================================================== */}
      {/* 5. Active Component Inspector Bar                        */}
      {/* ======================================================== */}
      {selectedComp && (
        <div className="bg-[#fdfcf9] border-b border-[#b0aca0] px-2.5 py-1 flex items-center justify-between text-xs overflow-x-auto no-scrollbar shrink-0 shadow-inner">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-blue-800 font-mono">{selectedComp.ref}:</span>
            <span className="font-bold text-slate-800">{selectedComp.name}</span>

            {/* Value Tuning (numeric input) */}
            {(selectedComp.kind === 'resistor' || selectedComp.kind === 'battery_aa' || selectedComp.kind === 'battery_9v') && (
              <div className="flex items-center gap-1 ml-1.5 bg-white px-1.5 py-0.5 rounded border border-slate-300">
                <span className="text-[10px] text-slate-500 font-bold">Val:</span>
                <input
                  type="number"
                  value={selectedComp.value}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setElements((prev) =>
                      prev.map((el) => (el.id === selectedComp.id ? { ...el, value: val } : el))
                    );
                  }}
                  className="w-14 px-1 py-0.2 border border-slate-300 rounded text-xs font-mono font-bold"
                />
                <span className="font-mono text-slate-700 text-[11px]">{selectedComp.unit}</span>
              </div>
            )}

            {/* Potentiometer Wiper Slider */}
            {selectedComp.kind === 'potentiometer' && (
              <div className="flex items-center gap-1 ml-1.5 bg-white px-2 py-0.5 rounded border border-slate-300">
                <span className="text-[10px] text-slate-500 font-bold">Wiper:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedComp.setting ?? 50}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setElements((prev) =>
                      prev.map((el) => (el.id === selectedComp.id ? { ...el, setting: val } : el))
                    );
                  }}
                  className="w-16 sm:w-20 cursor-pointer accent-blue-600"
                />
                <span className="font-mono font-bold text-blue-700 text-[10px]">{selectedComp.setting ?? 50}%</span>
              </div>
            )}

            {/* Live Telemetry Display */}
            {solvedState.elementValues[selectedComp.id] && (
              <div className="hidden md:flex items-center gap-2 ml-1.5 pl-2 border-l border-slate-300 text-[11px] font-mono">
                <span className="text-emerald-700 font-bold">
                  {(solvedState.elementValues[selectedComp.id].voltageDrop || 0).toFixed(2)}V
                </span>
                <span className="text-amber-700 font-bold">
                  {((solvedState.elementValues[selectedComp.id].currentThrough || 0) * 1000).toFixed(1)}mA
                </span>
              </div>
            )}
          </div>

          {/* Quick Actions: Rotate, Properties, Duplicate, Delete */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleRotateComponent(selectedComp.id)}
              className="p-1 hover:bg-white text-slate-700 border border-slate-300 rounded"
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setEditingComp(selectedComp);
                setShowPropertiesModal(true);
              }}
              className="p-1 hover:bg-white text-slate-700 border border-slate-300 rounded"
              title="Properties (الخصائص)"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDuplicateComponent(selectedComp)}
              className="p-1 hover:bg-white text-slate-700 border border-slate-300 rounded"
              title="Duplicate (مضاعفة)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteComponent(selectedComp.id)}
              className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded"
              title="Delete Component (حذف)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSelectedCompId(null)}
              className="p-1 text-slate-400 hover:text-slate-700"
              title="Close Inspector"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Selected Wire Action Bar */}
      {selectedWireId && !selectedComp && (
        <div className="bg-amber-50 border-b border-amber-300 px-3 py-1 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Link className="w-3.5 h-3.5 text-amber-700" />
            <span className="font-bold text-amber-900">Wire Selected (تم تحديد سلك)</span>
          </div>
          <button
            onClick={() => handleDeleteWire(selectedWireId)}
            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete Wire (حذف السلك)</span>
          </button>
        </div>
      )}

      {/* Wiring Mode Active Banner */}
      {wiringFrom && (
        <div className="bg-indigo-600 text-white px-3 py-1 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 font-bold">
            <Crosshair className="w-3.5 h-3.5 text-amber-300" />
            <span>Wiring Mode: Click another component's pin to finish wire (انقر على طرف المكون الآخر لإكمال السلك)</span>
          </div>
          <button
            onClick={() => setWiringFrom(null)}
            className="px-2 py-0.2 bg-white/20 hover:bg-white/30 text-white font-bold rounded text-[10px]"
          >
            Cancel (إلغاء)
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. Main Body: Mode Strip + Center Canvas + Right Sidebar */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ====================================================== */}
        {/* A. Left Vertical Mode Strip                            */}
        {/* ====================================================== */}
        <div 
          dir="ltr"
          className="w-8 sm:w-9 md:w-10 bg-[#ece9d8] border-r border-[#aca899] flex flex-col items-center py-2 gap-2 shrink-0 z-20 shadow-xs select-none box-border"
          style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
        >
          {[
            { id: 'normal', label: 'Normal', titleAr: 'المخطط الرمزي', activeColor: 'text-blue-800', icon: Activity },
            { id: 'realworld', label: 'Real World', titleAr: 'الشكل الحقيقي', activeColor: 'text-blue-800', icon: Layers },
            { id: 'current_flow', label: 'Current Flow', titleAr: 'تدفق التيار والشحنات', activeColor: 'text-emerald-800', icon: Zap },
            { id: 'voltage_levels', label: 'Voltage Levels', titleAr: 'مستويات الجهد', activeColor: 'text-red-800', icon: Gauge }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id as CircuitWizardMode)}
                dir="ltr"
                className={`w-6 sm:w-7 md:w-8 py-2 rounded-xs flex flex-col items-center justify-center border transition-all ${
                  mode === tab.id
                    ? `bg-[#ffffff] border-[#7a7a7a] shadow-inner font-bold ${tab.activeColor}`
                    : 'bg-[#e0ded0] border-[#b0aca0] hover:bg-[#f5f4ef] text-slate-700'
                }`}
                title={`${tab.label} (${tab.titleAr})`}
                style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
              >
                <IconComp className="w-3.5 h-3.5 mb-1 shrink-0" />
                <span
                  className="text-[9px] sm:text-[9.5px] tracking-wider select-none font-semibold text-center whitespace-nowrap block force-ltr"
                  dir="ltr"
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    direction: 'ltr',
                    transform: 'none',
                    unicodeBidi: 'isolate'
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ====================================================== */}
        {/* B. Center Workspace: Paper Page with Drop Shadow       */}
        {/* ====================================================== */}
        <div
          className="flex-1 bg-[#808080] p-1 sm:p-3 md:p-4 overflow-auto flex items-center justify-center relative touch-pan-x touch-pan-y max-w-full box-border"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{ maxWidth: '100%', boxSizing: 'border-box' }}
        >
          {/* Main Paper Sheet Container (Fixed & Stable across Mobile/Tablet/Desktop) */}
          <div
            className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.45)] border border-[#333333] relative shrink-0 transition-transform origin-center w-full max-w-[740px] box-border"
            style={{
              aspectRatio: '740 / 540',
              transform: zoomPercent !== 100 ? `scale(${zoomPercent / 100})` : undefined,
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
          >
            {/* SVG Interactive Canvas */}
            <svg
              ref={svgRef}
              className="w-full h-full block cursor-crosshair select-none"
              viewBox="0 0 740 540"
              style={{ overflow: 'visible', touchAction: 'none', direction: 'ltr', unicodeBidi: 'isolate' }}
            >
              <defs>
                {/* Glow filter for lit incandescent bulb */}
                <radialGradient id="bulbGlowGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffeb3b" stopOpacity="0.95" />
                  <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.6" />
                  <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>

                {/* Metallic Gradient for Battery Body */}
                <linearGradient id="batteryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="35%" stopColor="#334155" />
                  <stop offset="70%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                {/* Copper Top Gradient for Battery + */}
                <linearGradient id="copperGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="50%" stopColor="#fdba74" />
                  <stop offset="100%" stopColor="#c2410c" />
                </linearGradient>

                {/* Breadboard Body Gradient */}
                <linearGradient id="breadboardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fcfbf7" />
                  <stop offset="50%" stopColor="#f5f2e9" />
                  <stop offset="100%" stopColor="#ebe7dc" />
                </linearGradient>

                {/* Grid Dot Pattern */}
                <pattern id="cadGridDots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="0.8" fill="#cbd5e1" />
                </pattern>
              </defs>

              {/* Toggleable CAD Grid Dots */}
              {showGrid && <rect x="0" y="0" width="740" height="540" fill="url(#cadGridDots)" />}

              {/* ---------------------------------------------------- */}
              {/* Top-Left: Home Use - Student Edition Badge            */}
              {/* ---------------------------------------------------- */}
              <g transform="translate(14, 14)" className="pointer-events-none">
                <rect x="0" y="0" width="74" height="48" fill="#ece9d8" stroke="#a0a0a0" strokeWidth="1" rx="2" />
                <rect x="0" y="0" width="74" height="16" fill="#000000" rx="1" />
                <text x="37" y="12" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
                  Home Use
                </text>
                <path d="M 12 40 L 20 25 L 28 40 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                <text x="20" y="38" textAnchor="middle" fill="#000000" fontSize="8.5" fontWeight="900" fontFamily="sans-serif">
                  !
                </text>
                <text x="34" y="31" fill="#dc2626" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">
                  Student
                </text>
                <text x="34" y="41" fill="#dc2626" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">
                  Edition
                </text>
              </g>

              {/* ---------------------------------------------------- */}
              {/* Instructions Text (Clean & Uncrowded)                */}
              {/* ---------------------------------------------------- */}
              {activeCircuit.id !== 'custom_project' && (
                <g transform="translate(255, 38)" className="pointer-events-none">
                  <text x="0" y="0" fill="#0f172a" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    {activeCircuit.instructions.title}
                  </text>
                  <text x="0" y="18" fill="#475569" fontSize="10" fontFamily="sans-serif">
                    {activeCircuit.instructions.line1}
                  </text>
                  <text x="0" y="32" fill="#475569" fontSize="10" fontFamily="sans-serif">
                    {activeCircuit.instructions.line2}
                  </text>
                </g>
              )}

              {/* Short Circuit Alert Warning Banner */}
              {solvedState.hasShortCircuit && (
                <g transform="translate(370, 90)">
                  <rect x="-135" y="-12" width="270" height="24" rx="3" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.2" />
                  <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="bold">
                    ⚠️ SHORT CIRCUIT DETECTED! دائرة قصر خطيرة
                  </text>
                </g>
              )}

              {/* ---------------------------------------------------- */}
              {/* Real Connecting Wires                                */}
              {/* ---------------------------------------------------- */}
              {wires.map((wire) => {
                const compA = elements.find((e) => e.id === wire.fromCompId);
                const compB = elements.find((e) => e.id === wire.toCompId);
                if (!compA || !compB) return null;

                const p1 = getPinAbsolutePos(compA, wire.fromPinId);
                const p2 = getPinAbsolutePos(compB, wire.toPinId);
                const pathStr = getWirePath(p1, p2);

                let strokeColor = wire.color;
                if (mode === 'voltage_levels') {
                  strokeColor = wire.color === '#dc2626' ? '#ef4444' : solvedState.isLoopActive && wire.color === '#2563eb' ? '#ef4444' : '#1e293b';
                }

                const isSelected = selectedWireId === wire.id;

                return (
                  <g 
                    key={wire.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWireId(wire.id);
                      setSelectedCompId(null);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Shadow / Click Target */}
                    <path
                      d={pathStr}
                      fill="none"
                      stroke={isSelected ? '#3b82f6' : '#000000'}
                      strokeWidth={isSelected ? '7' : '5'}
                      strokeOpacity={isSelected ? 0.6 : 0.16}
                      strokeLinecap="round"
                    />
                    {/* Main Core Wire */}
                    <path
                      d={pathStr}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2.8"
                      strokeLinecap="round"
                    />
                    {/* Current Flow: Animated Charge Dots */}
                    {solvedState.isLoopActive && isSimulating && !isPaused && (
                      <path
                        d={pathStr}
                        fill="none"
                        stroke={mode === 'current_flow' ? '#22c55e' : '#facc15'}
                        strokeWidth={mode === 'current_flow' ? '3.5' : '2.4'}
                        strokeDasharray="4 8"
                        strokeDashoffset={-currentTick * 2.5}
                        strokeLinecap="round"
                        opacity={mode === 'current_flow' ? 1 : 0.9}
                      />
                    )}
                  </g>
                );
              })}

              {/* Rubber-band Wire when creating a wire */}
              {wiringFrom && (
                <path
                  d={getWirePath(wiringFrom, mousePos)}
                  fill="none"
                  stroke={wireColor}
                  strokeWidth="2.5"
                  strokeDasharray="5 5"
                />
              )}

              {/* ---------------------------------------------------- */}
              {/* Circuit Components                                   */}
              {/* ---------------------------------------------------- */}
              {elements.map((el) => {
                const isSelected = selectedCompId === el.id;
                const compPins = COMPONENT_PINS[el.kind] || [];
                const elValues = solvedState.elementValues[el.id] || { isLit: false, isSpinning: false, isBuzzing: false };

                return (
                  <g
                    key={el.id}
                    transform={`translate(${el.x}, ${el.y})`}
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleCompMouseDown(e, el)}
                    onTouchStart={(e) => handleCompMouseDown(e, el)}
                    onDoubleClick={() => {
                      setEditingComp(el);
                      setShowPropertiesModal(true);
                    }}
                  >
                    {/* Selection Highlight Box */}
                    {isSelected && (
                      <rect
                        x="-48"
                        y="-48"
                        width="96"
                        height="96"
                        rx="6"
                        fill="rgba(59, 130, 246, 0.08)"
                        stroke="#2563eb"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Rotated Component Artwork */}
                    <g transform={`rotate(${el.rotation || 0})`}>
                      {/* === REAL WORLD MODE ARTWORK === */}
                      {mode !== 'normal' && (
                        <>
                          {/* 1. Breadboard */}
                          {el.kind === 'breadboard' && (
                            <g>
                              <rect x="-130" y="-55" width="260" height="110" rx="6" fill="url(#breadboardGrad)" stroke="#b5ad98" strokeWidth="2" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.18))" />
                              {/* Power Bus Lines */}
                              <line x1="-120" y1="-46" x2="120" y2="-46" stroke="#ef4444" strokeWidth="1.5" />
                              <line x1="-120" y1="-38" x2="120" y2="-38" stroke="#3b82f6" strokeWidth="1.5" />
                              <line x1="-120" y1="38" x2="120" y2="38" stroke="#ef4444" strokeWidth="1.5" />
                              <line x1="-120" y1="46" x2="120" y2="46" stroke="#3b82f6" strokeWidth="1.5" />
                              <text x="-124" y="-43" fill="#ef4444" fontSize="7" fontWeight="bold">+</text>
                              <text x="-124" y="-35" fill="#3b82f6" fontSize="7" fontWeight="bold">-</text>
                              <text x="-124" y="41" fill="#ef4444" fontSize="7" fontWeight="bold">+</text>
                              <text x="-124" y="49" fill="#3b82f6" fontSize="7" fontWeight="bold">-</text>

                              {/* Tie-point rows */}
                              {[-90, -60, -30, 0, 30, 60, 90].map((rx) => (
                                <g key={rx}>
                                  {[-22, -14, -6, 6, 14, 22].map((ry) => (
                                    <circle key={ry} cx={rx} cy={ry} r="2.2" fill="#2d2b27" stroke="#716b5e" strokeWidth="0.8" />
                                  ))}
                                </g>
                              ))}

                              {/* Center Divider Groove */}
                              <line x1="-125" y1="0" x2="125" y2="0" stroke="#a8a29e" strokeWidth="2.5" />
                              <text x="0" y="-50" textAnchor="middle" fill="#78716c" fontSize="6.5" fontWeight="bold">BREADBOARD</text>
                            </g>
                          )}

                          {/* 2. AA Battery 1.5V */}
                          {el.kind === 'battery_aa' && (
                            <g>
                              <rect x="-16" y="-85" width="32" height="145" rx="5" fill="#000000" opacity="0.15" />
                              <rect x="-5" y="-95" width="10" height="10" rx="2" fill="url(#copperGrad)" stroke="#7c2d12" strokeWidth="0.8" />
                              <rect x="-15" y="-84" width="30" height="32" rx="2" fill="url(#copperGrad)" stroke="#9a3412" strokeWidth="0.8" />
                              <text x="0" y="-70" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" direction="ltr" style={{ direction: 'ltr' }}>+</text>
                              <text x="0" y="-58" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold" direction="ltr" style={{ direction: 'ltr' }}>1.5V</text>
                              <rect x="-15" y="-52" width="30" height="102" rx="2" fill="url(#batteryGrad)" stroke="#1e293b" strokeWidth="1" />
                              <text x="0" y="8" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" letterSpacing="1" direction="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                                AA
                              </text>
                              <rect x="-13" y="50" width="26" height="5" rx="1" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
                            </g>
                          )}

                          {/* 3. 9V / 6V Battery */}
                          {(el.kind === 'battery_9v' || el.kind === 'battery_4aa') && (
                            <g>
                              <rect x="-22" y="-55" width="44" height="90" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                              <rect x="-12" y="-64" width="9" height="9" fill="#94a3b8" rx="1" />
                              <circle cx="8" cy="-60" r="4.5" fill="#f59e0b" stroke="#b45309" />
                              <text x="0" y="5" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold" direction="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>{el.value}V</text>
                            </g>
                          )}

                          {/* 4. Toggle Switch SW1 */}
                          {(el.kind === 'switch_spst' || el.kind === 'push_button') && (
                            <g onClick={(e) => { e.stopPropagation(); handleToggleSwitch(el.id); }}>
                              <rect x="-15" y="-8" width="30" height="24" rx="2" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
                              <rect x="-9" y="-14" width="18" height="6" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
                              <line
                                x1="0"
                                y1="-14"
                                x2={el.state === false ? -13 : 13}
                                y2="-31"
                                stroke="#e2e8f0"
                                strokeWidth="4.5"
                                strokeLinecap="round"
                                className="transition-all duration-150"
                              />
                              <circle cx={el.state === false ? -13 : 13} cy="-31" r="3.2" fill="#cbd5e1" />
                              <rect x="-15" y="16" width="4" height="8" rx="1" fill="#94a3b8" />
                              <rect x="11" y="16" width="4" height="8" rx="1" fill="#94a3b8" />
                            </g>
                          )}

                          {/* 5. Incandescent Filament Bulb */}
                          {el.kind === 'bulb' && (
                            <g>
                              {elValues.isLit && (
                                <circle cx="26" cy="0" r="52" fill="url(#bulbGlowGradient)" />
                              )}
                              <rect x="-24" y="-12" width="24" height="24" rx="2" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                              <line x1="-20" y1="-7" x2="-2" y2="-7" stroke="#94a3b8" strokeWidth="1.5" />
                              <line x1="-20" y1="0" x2="-2" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
                              <line x1="-20" y1="7" x2="-2" y2="7" stroke="#94a3b8" strokeWidth="1.5" />
                              <path d="M -24 -6 C -28 -6, -28 6, -24 6 Z" fill="#1e293b" />
                              <path
                                d="M 0 -12 C 10 -18, 38 -20, 48 -10 C 58 0, 58 0, 48 10 C 38 20, 10 18, 0 12 Z"
                                fill={elValues.isLit ? '#fffbeb' : '#f8fafc'}
                                fillOpacity={elValues.isLit ? 0.95 : 0.65}
                                stroke={elValues.isLit ? '#f59e0b' : '#94a3b8'}
                                strokeWidth="1.2"
                              />
                              <line x1="0" y1="-5" x2="22" y2="-5" stroke="#94a3b8" strokeWidth="1" />
                              <line x1="0" y1="5" x2="22" y2="5" stroke="#94a3b8" strokeWidth="1" />
                              <path d="M 22 -5 L 26 -2 L 24 0 L 26 2 L 22 5" fill="none" stroke={elValues.isLit ? '#ea580c' : '#475569'} strokeWidth={elValues.isLit ? 2.5 : 1.2} />
                            </g>
                          )}

                          {/* 6. Potentiometer */}
                          {el.kind === 'potentiometer' && (
                            <g>
                              <circle cx="0" cy="0" r="20" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                              <circle cx="0" cy="0" r="13" fill="#334155" />
                              <circle cx="0" cy="-6" r="3" fill="#38bdf8" />
                              <rect x="-19" y="14" width="4" height="6" fill="#94a3b8" />
                              <rect x="-2" y="14" width="4" height="6" fill="#94a3b8" />
                              <rect x="15" y="14" width="4" height="6" fill="#94a3b8" />
                            </g>
                          )}

                          {/* 7. Resistor */}
                          {el.kind === 'resistor' && (
                            <g>
                              <line x1="-28" y1="0" x2="28" y2="0" stroke="#cbd5e1" strokeWidth="2" />
                              <rect x="-16" y="-6.5" width="32" height="13" rx="3" fill="#fde68a" stroke="#d97706" />
                              <rect x="-10" y="-6.5" width="2.5" height="13" fill="#92400e" />
                              <rect x="-4" y="-6.5" width="2.5" height="13" fill="#000000" />
                              <rect x="2" y="-6.5" width="2.5" height="13" fill="#ef4444" />
                              <rect x="8" y="-6.5" width="2" height="13" fill="#d4af37" />
                            </g>
                          )}

                          {/* 8. LED */}
                          {el.kind === 'led' && (
                            <g>
                              {elValues.isLit && <circle cx="0" cy="0" r="22" fill={el.color || '#ef4444'} opacity="0.45" />}
                              <line x1="-16" y1="0" x2="16" y2="0" stroke="#cbd5e1" strokeWidth="2" />
                              <circle cx="0" cy="0" r="11" fill={elValues.isLit ? el.color || '#ef4444' : '#64748b'} stroke="#cbd5e1" strokeWidth="1.5" />
                            </g>
                          )}

                          {/* 9. Buzzer */}
                          {el.kind === 'buzzer' && (
                            <g>
                              <circle cx="0" cy="0" r="17" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                              <circle cx="0" cy="0" r="6" fill="#0f172a" />
                              {elValues.isBuzzing && (
                                <path d="M 20 -8 A 12 12 0 0 1 20 8" fill="none" stroke="#0284c7" strokeWidth="2" />
                              )}
                              <rect x="-15" y="12" width="3" height="6" fill="#94a3b8" />
                              <rect x="12" y="12" width="3" height="6" fill="#94a3b8" />
                            </g>
                          )}

                          {/* 10. DC Motor */}
                          {el.kind === 'motor' && (
                            <g>
                              <circle cx="0" cy="0" r="20" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
                              <circle cx="0" cy="0" r="13" fill="#1e293b" />
                              <g transform={`rotate(${elValues.isSpinning ? (currentTick * 36) % 360 : 0})`}>
                                <line x1="-9" y1="0" x2="9" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
                                <line x1="0" y1="-9" x2="0" y2="9" stroke="#38bdf8" strokeWidth="2.5" />
                              </g>
                            </g>
                          )}

                          {/* 11. Voltmeter & Ammeter with Real Digital Screen */}
                          {(el.kind === 'voltmeter' || el.kind === 'ammeter') && (
                            <g>
                              <rect x="-30" y="-22" width="60" height="44" rx="4" fill="#1e293b" stroke="#0284c7" strokeWidth="1.5" />
                              <rect x="-24" y="-16" width="48" height="20" rx="2" fill="#042f2e" stroke="#0f766e" strokeWidth="1" />
                              <text x="0" y="-3" textAnchor="middle" fill="#2dd4bf" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                                {el.kind === 'voltmeter'
                                  ? `${(solvedState.meterReadings[el.id] ?? 0).toFixed(2)} V`
                                  : `${((solvedState.meterReadings[el.id] ?? 0) * 1000).toFixed(1)} mA`}
                              </text>
                              <circle cx="-26" cy="18" r="3" fill="#ef4444" stroke="#991b1b" />
                              <circle cx="26" cy="18" r="3" fill="#1e293b" stroke="#000000" />
                            </g>
                          )}

                          {/* 12. Generic / Capacitor / Diode */}
                          {(el.kind === 'capacitor' || el.kind === 'diode') && (
                            <g>
                              <line x1="-20" y1="0" x2="20" y2="0" stroke="#cbd5e1" strokeWidth="2" />
                              <rect x="-14" y="-12" width="28" height="24" rx="3" fill="#334155" stroke="#94a3b8" />
                              <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                                {el.ref}
                              </text>
                            </g>
                          )}
                        </>
                      )}

                      {/* === NORMAL (SCHEMATIC) MODE ARTWORK === */}
                      {mode === 'normal' && (
                        <g>
                          {/* Battery Schematic */}
                          {(el.kind === 'battery_aa' || el.kind === 'battery_9v' || el.kind === 'battery_4aa') && (
                            <g>
                              <line x1="0" y1="-95" x2="0" y2="-20" stroke="#000000" strokeWidth="2" />
                              <line x1="-16" y1="-20" x2="16" y2="-20" stroke="#000000" strokeWidth="3" />
                              <line x1="-9" y1="-8" x2="9" y2="-8" stroke="#000000" strokeWidth="4.5" />
                              <line x1="-16" y1="4" x2="16" y2="4" stroke="#000000" strokeWidth="3" />
                              <line x1="-9" y1="16" x2="9" y2="16" stroke="#000000" strokeWidth="4.5" />
                              <line x1="0" y1="16" x2="0" y2="55" stroke="#000000" strokeWidth="2" />
                              <text x="22" y="-16" fill="#000000" fontSize="10" fontWeight="bold">+</text>
                              <text x="22" y="20" fill="#000000" fontSize="10" fontWeight="bold">-</text>
                            </g>
                          )}

                          {/* Switch SPST Schematic */}
                          {(el.kind === 'switch_spst' || el.kind === 'push_button') && (
                            <g onClick={(e) => { e.stopPropagation(); handleToggleSwitch(el.id); }}>
                              <circle cx="-13" cy="20" r="3" fill="#000000" />
                              <circle cx="13" cy="20" r="3" fill="#000000" />
                              {el.state ? (
                                <line x1="-13" y1="20" x2="13" y2="20" stroke="#000000" strokeWidth="2.5" />
                              ) : (
                                <line x1="-13" y1="20" x2="11" y2="6" stroke="#000000" strokeWidth="2.5" />
                              )}
                            </g>
                          )}

                          {/* Bulb Schematic */}
                          {el.kind === 'bulb' && (
                            <g>
                              <circle cx="-24" cy="0" r="14" fill="none" stroke="#000000" strokeWidth="2" />
                              <line x1="-34" y1="-10" x2="-14" y2="10" stroke="#000000" strokeWidth="2" />
                              <line x1="-14" y1="-10" x2="-34" y2="10" stroke="#000000" strokeWidth="2" />
                            </g>
                          )}

                          {/* Resistor Schematic */}
                          {el.kind === 'resistor' && (
                            <g>
                              <line x1="-28" y1="0" x2="-16" y2="0" stroke="#000000" strokeWidth="2" />
                              <rect x="-16" y="-6" width="32" height="12" fill="none" stroke="#000000" strokeWidth="2" />
                              <line x1="16" y1="0" x2="28" y2="0" stroke="#000000" strokeWidth="2" />
                            </g>
                          )}

                          {/* LED Schematic */}
                          {el.kind === 'led' && (
                            <g>
                              <line x1="-16" y1="0" x2="-8" y2="0" stroke="#000000" strokeWidth="2" />
                              <polygon points="-8,-8 -8,8 8,0" fill="#000000" />
                              <line x1="8" y1="-8" x2="8" y2="8" stroke="#000000" strokeWidth="2.5" />
                              <line x1="8" y1="0" x2="16" y2="0" stroke="#000000" strokeWidth="2" />
                            </g>
                          )}

                          {/* Other Schematics */}
                          {el.kind !== 'battery_aa' && el.kind !== 'battery_9v' && el.kind !== 'battery_4aa' && el.kind !== 'switch_spst' && el.kind !== 'push_button' && el.kind !== 'bulb' && el.kind !== 'resistor' && el.kind !== 'led' && (
                            <g>
                              <rect x="-20" y="-14" width="40" height="28" fill="#ffffff" stroke="#000000" strokeWidth="2" rx="2" />
                              <text x="0" y="4" textAnchor="middle" fill="#000000" fontSize="9" fontWeight="bold">
                                {el.ref}
                              </text>
                            </g>
                          )}
                        </g>
                      )}
                    </g>

                    {/* Component Name Label */}
                    <text
                      x="0"
                      y="-34"
                      textAnchor="middle"
                      fill="#0f172a"
                      fontSize="10"
                      fontFamily="'Cairo', 'Segoe UI', sans-serif"
                      fontWeight="bold"
                      direction="ltr"
                      style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                      className="pointer-events-none select-none"
                    >
                      {el.name}
                    </text>

                    {/* Interactive Component Connection Pins */}
                    {compPins.map((pin) => {
                      const isPinActive = wiringFrom?.compId === el.id && wiringFrom?.pinId === pin.id;
                      return (
                        <g
                          key={pin.id}
                          transform={`translate(${pin.relX}, ${pin.relY})`}
                          onClick={(e) => handlePinClick(e, el, pin.id)}
                          className="cursor-pointer group/pin"
                        >
                          {/* Generous touch target for phones and tablets */}
                          <circle cx="0" cy="0" r="16" fill="transparent" />
                          {/* Ping highlight when wiring */}
                          {isPinActive && (
                            <circle cx="0" cy="0" r="10" fill="none" stroke="#2563eb" strokeWidth="2" className="animate-ping" />
                          )}
                          {/* Pin circle */}
                          <circle
                            cx="0"
                            cy="0"
                            r={isPinActive ? '4.8' : '3.4'}
                            fill={isPinActive ? '#2563eb' : '#ffffff'}
                            stroke={isPinActive ? '#1e3a8a' : '#1e293b'}
                            strokeWidth="1.6"
                            className="transition-transform group-hover/pin:scale-125 group-hover/pin:fill-amber-400 group-hover/pin:stroke-amber-600"
                          />
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* ---------------------------------------------------- */}
              {/* Optional Schematic Inset Box                         */}
              {/* ---------------------------------------------------- */}
              {activeCircuit.schematicBox && (
                <g transform={`translate(${activeCircuit.schematicBox.x}, ${activeCircuit.schematicBox.y})`}>
                  <rect
                    x="0"
                    y="0"
                    width={activeCircuit.schematicBox.width}
                    height={activeCircuit.schematicBox.height}
                    rx="14"
                    fill="#000000"
                    stroke="#222222"
                    strokeWidth="1.2"
                  />
                  <rect x="28" y="24" width="124" height="86" fill="none" stroke="#f59e0b" strokeWidth="1.6" rx="3" />

                  {/* Battery B1 */}
                  <g transform="translate(28, 67)" direction="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                    <rect x="-8" y="-16" width="16" height="32" fill="#000000" />
                    <line x1="-11" y1="-5" x2="11" y2="-5" stroke="#f59e0b" strokeWidth="2.2" />
                    <text x="-15" y="-3" fill="#ffffff" fontSize="8" fontWeight="bold" direction="ltr" style={{ direction: 'ltr' }}>+</text>
                    <line x1="-6" y1="5" x2="6" y2="5" stroke="#f59e0b" strokeWidth="3.5" />
                    <text x="-15" y="7" fill="#ffffff" fontSize="8" fontWeight="bold" direction="ltr" style={{ direction: 'ltr' }}>-</text>
                    <text x="-18" y="-10" textAnchor="end" fill="#ffffff" fontSize="7.5" fontWeight="bold" direction="ltr" style={{ direction: 'ltr' }}>Battery</text>
                    <text x="-18" y="0" textAnchor="end" fill="#ffffff" fontSize="7.5" direction="ltr" style={{ direction: 'ltr' }}>B1</text>
                    <text x="-18" y="10" textAnchor="end" fill="#ffffff" fontSize="7.5" direction="ltr" style={{ direction: 'ltr' }}>1.5V</text>
                  </g>

                  {/* Switch SW1 */}
                  <g transform="translate(90, 24)" direction="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                    <rect x="-16" y="-5" width="32" height="10" fill="#000000" />
                    <circle cx="-10" cy="0" r="2.2" fill="#f59e0b" />
                    <circle cx="10" cy="0" r="2.2" fill="#f59e0b" />
                    {solvedState.isLoopActive ? (
                      <line x1="-10" y1="0" x2="10" y2="0" stroke="#f59e0b" strokeWidth="1.8" />
                    ) : (
                      <line x1="-10" y1="0" x2="8" y2="-9" stroke="#f59e0b" strokeWidth="1.8" />
                    )}
                    <text x="0" y="-13" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="bold" direction="ltr" style={{ direction: 'ltr' }}>Switch</text>
                    <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="7.5" direction="ltr" style={{ direction: 'ltr' }}>SW1</text>
                  </g>

                  {/* Bulb BL1 */}
                  <g transform="translate(152, 67)" direction="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                    <rect x="-11" y="-14" width="22" height="28" fill="#000000" />
                    <circle cx="0" cy="0" r="9.5" fill={solvedState.isLoopActive ? '#fef08a' : '#000000'} stroke="#f59e0b" strokeWidth="1.6" />
                    <line x1="-6.5" y1="-6.5" x2="6.5" y2="6.5" stroke={solvedState.isLoopActive ? '#ea580c' : '#f59e0b'} strokeWidth="1.6" />
                    <line x1="6.5" y1="-6.5" x2="-6.5" y2="6.5" stroke={solvedState.isLoopActive ? '#ea580c' : '#f59e0b'} strokeWidth="1.6" />
                    <text x="-15" y="-3" textAnchor="end" fill="#ffffff" fontSize="7.5" fontWeight="bold" direction="ltr" style={{ direction: 'ltr' }}>Bulb</text>
                    <text x="-15" y="7" textAnchor="end" fill="#ffffff" fontSize="7.5" direction="ltr" style={{ direction: 'ltr' }}>BL1</text>
                  </g>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* ====================================================== */}
        {/* C. Right Sidebar: Assistant & Gallery                  */}
        {/* ====================================================== */}
        {rightTab && (
          <>
            {/* Backdrop for mobile & tablet (< 1024px) */}
            <div
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-2xs z-40 transition-opacity"
              onClick={() => setRightTab(null)}
            />
            {/* Sidebar drawer */}
            <div className="fixed inset-y-0 right-0 z-50 lg:static w-72 sm:w-80 bg-[#ece9d8] border-l border-[#aca899] flex flex-col shrink-0 shadow-2xl lg:shadow-none transition-transform">
              {/* Mobile Drawer Header */}
              <div className="lg:hidden bg-[#0a246a] text-white px-3 py-2 flex items-center justify-between">
                <span className="font-bold text-xs">
                  {rightTab === 'assistant' ? 'Sample Circuits Assistant' : 'Component Gallery (معرض المكونات)'}
                </span>
                <button
                  onClick={() => setRightTab(null)}
                  className="p-1 hover:bg-white/20 rounded text-white"
                  title="Close Drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. Assistant Tab */}
              {rightTab === 'assistant' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="bg-[#f0f0f0] border-b border-[#aca899] px-2 py-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">Sample Circuits Catalog</span>
                    <button
                      onClick={() => handleLoadSample(CW_SAMPLE_CIRCUITS[0])}
                      className="text-[10px] text-blue-700 hover:underline font-bold"
                    >
                      Default
                    </button>
                  </div>

                  <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#ffffff] text-slate-900 text-xs font-['Segoe_UI',sans-serif]">
                    <div className="flex items-start gap-2.5 pb-2 border-b border-slate-200">
                      <div className="w-8 h-8 bg-amber-100 rounded p-1 flex items-center justify-center shrink-0 border border-amber-300">
                        <Folder className="w-4 h-4 text-amber-600 fill-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-slate-900">Sample Circuits</h3>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Select any pre-built experiment to load instantly onto the canvas.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div>
                        <div
                          onClick={() =>
                            setExpandedFolders((prev) => ({
                              ...prev,
                              'Elementary Circuits': !prev['Elementary Circuits']
                            }))
                          }
                          className="flex items-center gap-1.5 font-bold text-blue-800 hover:text-blue-900 cursor-pointer py-1"
                        >
                          {expandedFolders['Elementary Circuits'] ? (
                            <FolderOpen className="w-4 h-4 text-amber-500 fill-amber-400" />
                          ) : (
                            <Folder className="w-4 h-4 text-amber-500 fill-amber-400" />
                          )}
                          <span>Elementary Circuits</span>
                        </div>

                        {expandedFolders['Elementary Circuits'] && (
                          <div className="ml-4 pl-2 border-l border-slate-200 space-y-1.5 text-[11px]">
                            {CW_SAMPLE_CIRCUITS.map((circuit) => (
                              <button
                                key={circuit.id}
                                onClick={() => handleLoadSample(circuit)}
                                className={`w-full text-left px-2 py-1 rounded flex items-center justify-between gap-1.5 transition ${
                                  activeCircuit.id === circuit.id
                                    ? 'bg-blue-100 font-bold text-blue-900 border border-blue-300'
                                    : 'hover:bg-slate-100 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                  <span className="truncate">{circuit.title}</span>
                                </div>
                                <span className="text-[9px] text-slate-400 shrink-0">{circuit.fileName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Gallery Tab: Components Palette (معرض المكونات) */}
              {rightTab === 'gallery' && (
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                  <div className="p-2 border-b border-[#aca899] bg-[#f0f0f0]">
                    <select
                      value={gallerySelectedCategory}
                      onChange={(e) => setGallerySelectedCategory(e.target.value)}
                      className="w-full bg-white border border-[#7a7a7a] px-2 py-1 text-xs rounded font-medium focus:outline-none"
                    >
                      {GALLERY_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 p-2 overflow-y-auto space-y-1.5 text-xs">
                    <div className="text-[10px] text-slate-500 px-1 font-semibold uppercase">
                      Drag to canvas or click + Add:
                    </div>
                    {GALLERY_ITEMS.filter((item) => item.category === gallerySelectedCategory).map((item) => (
                      <div
                        key={item.name}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify(item));
                        }}
                        onClick={() => handleAddComponent(item)}
                        className="p-2 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded cursor-grab active:cursor-grabbing flex items-center justify-between gap-2 transition group max-w-full box-border"
                        style={{ maxWidth: '100%', boxSizing: 'border-box' }}
                      >
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div 
                            className="font-bold text-slate-900 text-[11px] group-hover:text-blue-800 truncate force-ltr"
                            dir="ltr"
                            style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'isolate' }}
                          >
                            {item.name}
                          </div>
                          <div 
                            className="text-[10px] text-slate-500 truncate force-rtl"
                            dir="rtl"
                            style={{ direction: 'rtl', textAlign: 'right', unicodeBidi: 'isolate' }}
                          >
                            {item.nameAr}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddComponent(item);
                          }}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded shrink-0 shadow-xs active:translate-y-0.5"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ====================================================== */}
        {/* Right Vertical Tab Strip Handles                       */}
        {/* ====================================================== */}
        <div
          dir="ltr"
          className="w-7 sm:w-8 bg-[#ece9d8] border-l border-[#aca899] flex flex-col items-center py-2 gap-2 shrink-0 select-none z-20"
          style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
        >
          <button
            onClick={() => setRightTab(rightTab === 'assistant' ? null : 'assistant')}
            dir="ltr"
            className={`w-5 sm:w-6 py-2 rounded-xs flex flex-col items-center justify-center border transition ${
              rightTab === 'assistant'
                ? 'bg-[#ffffff] border-[#7a7a7a] font-bold text-blue-800 shadow-inner'
                : 'bg-[#e0ded0] border-[#b0aca0] hover:bg-[#ffffff] text-slate-700'
            }`}
            title="Sample Circuits Assistant (مساعد النماذج الجاهزة)"
            style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
          >
            <Lightbulb className="w-3.5 h-3.5 mb-1 text-amber-600 shrink-0" />
            <span
              className="text-[9px] sm:text-[9.5px] tracking-wider font-semibold select-none text-center block force-ltr"
              dir="ltr"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                direction: 'ltr',
                transform: 'none',
                unicodeBidi: 'isolate'
              }}
            >
              Assistant
            </span>
          </button>
          <button
            onClick={() => setRightTab(rightTab === 'gallery' ? null : 'gallery')}
            dir="ltr"
            className={`w-5 sm:w-6 py-2 rounded-xs flex flex-col items-center justify-center border transition ${
              rightTab === 'gallery'
                ? 'bg-[#ffffff] border-[#7a7a7a] font-bold text-blue-800 shadow-inner'
                : 'bg-[#e0ded0] border-[#b0aca0] hover:bg-[#ffffff] text-slate-700'
            }`}
            title="Component Gallery (معرض المكونات الإلكترونية)"
            style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
          >
            <Cpu className="w-3.5 h-3.5 mb-1 text-blue-600 shrink-0" />
            <span
              className="text-[9px] sm:text-[9.5px] tracking-wider font-semibold select-none text-center block force-ltr"
              dir="ltr"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                direction: 'ltr',
                transform: 'none',
                unicodeBidi: 'isolate'
              }}
            >
              Gallery
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 7. Bottom Sheet Tabs: Sheet Name | Bill of Materials     */}
      {/* ======================================================== */}
      <div className="bg-[#ece9d8] border-t border-[#aca899] px-2 py-0.5 sm:py-1 flex items-center justify-between text-[11px] text-slate-800 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1">
          <div className="flex items-center text-slate-500 font-bold px-1 select-none text-[10px]">
            ◀ ▶
          </div>
          <button
            onClick={() => setBottomTab('circuit')}
            className={`px-2.5 sm:px-3 py-1 font-bold border-t-2 transition rounded-t-xs whitespace-nowrap text-xs ${
              bottomTab === 'circuit'
                ? 'bg-white text-blue-800 border-blue-600 shadow-xs'
                : 'bg-[#dfdfdf] hover:bg-white text-slate-700 border-transparent'
            }`}
          >
            {activeCircuit.sheetTitle}
          </button>
          <button
            onClick={() => setBottomTab('bom')}
            className={`px-2.5 sm:px-3 py-1 font-bold border-t-2 transition rounded-t-xs whitespace-nowrap text-xs ${
              bottomTab === 'bom'
                ? 'bg-white text-blue-800 border-blue-600 shadow-xs'
                : 'bg-[#dfdfdf] hover:bg-white text-slate-700 border-transparent'
            }`}
          >
            Bill of Materials ({elements.length})
          </button>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-600 font-medium shrink-0">
          <span className="hidden sm:inline">Zoom: {zoomPercent}%</span>
          <span className="hidden md:inline">Mode: {mode.toUpperCase()}</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 8. Bottom Status Bar: Press F1 for help | 100% | Ready   */}
      {/* ======================================================== */}
      <div className="bg-[#ece9d8] border-t border-[#aca899] px-3 py-0.5 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-700 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span>Press F1 for help</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 hidden sm:inline">Zoom:</span>
            <span className="font-bold">{zoomPercent}%</span>
          </div>
          <div className="border-l border-[#aca899] pl-2 sm:pl-3 flex items-center gap-1">
            <span className="text-slate-500 hidden sm:inline">
              {selectedComp ? `${selectedComp.ref} (${selectedComp.name})` : '(Ready)'}
            </span>
          </div>
          <div className="border-l border-[#aca899] pl-2 sm:pl-3 flex items-center gap-1.5">
            {isSimulating && !isPaused ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Simulating (Run)</span>
              </span>
            ) : isPaused ? (
              <span className="text-amber-700 font-bold">Paused</span>
            ) : (
              <span className="text-slate-600 font-bold">Stopped</span>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 9. Bill of Materials Modal View (BOM)                    */}
      {/* ======================================================== */}
      {bottomTab === 'bom' && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-50 p-4 sm:p-6 flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-slate-300 pb-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Bill of Materials (BOM) • {activeCircuit.title}
              </h2>
              <p className="text-[11px] text-slate-500">
                قائمة جدول حصر الكميات والمكونات المستخدمة في الدائرة الحالية
              </p>
            </div>
            <button
              onClick={() => setBottomTab('circuit')}
              className="px-3 py-1 bg-blue-600 text-white font-bold text-xs rounded hover:bg-blue-700"
            >
              Back to Circuit Sheet
            </button>
          </div>

          <div className="flex-1 overflow-auto border border-slate-200 rounded">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                  <th className="p-2 font-bold">Reference</th>
                  <th className="p-2 font-bold">Component Name</th>
                  <th className="p-2 font-bold">Specification</th>
                  <th className="p-2 font-bold">Qty</th>
                  <th className="p-2 font-bold hidden sm:table-cell">Arabic Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {elements.map((el) => (
                  <tr key={el.id} className="hover:bg-blue-50/50">
                    <td className="p-2 font-mono font-bold text-blue-700">{el.ref}</td>
                    <td className="p-2 font-semibold">{el.name}</td>
                    <td className="p-2 font-mono">{el.value} {el.unit}</td>
                    <td className="p-2">1</td>
                    <td className="p-2 text-slate-600 hidden sm:table-cell">{el.nameAr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 10. New Project Dialog Modal ("مشروع جديد")       */}
      {/* ======================================================== */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 select-none">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden text-xs">
            {/* Modal Title Bar */}
            <div className="bg-gradient-to-r from-[#0a246a] via-[#0055ea] to-[#3a6ea5] text-white px-4 py-2.5 flex items-center justify-between font-bold text-sm">
              <div className="flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-amber-300" />
                <span>New Project (مشروع دارة جديد)</span>
              </div>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-slate-800">
              {/* Project Name Input */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 text-xs">
                  اسم المشروع (Project Title):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Circuit 1"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleStartBlankProject(newProjectName)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shrink-0 shadow-xs active:translate-y-0.5"
                  >
                    إنشاء فارغ
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">
                  أو اختر قالباً جاهزاً (Or Choose a Template):
                </span>

                {/* 1. Blank Project */}
                <button
                  onClick={() => handleStartBlankProject(newProjectName)}
                  className="w-full p-2.5 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/70 rounded text-left transition flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 group-hover:text-blue-800 text-xs">
                      1. Blank Project (مشروع دارة فارغ)
                    </div>
                    <div className="text-slate-500 text-[10px] truncate mt-0.5">
                      ورقة رسم فارغة لبناء وتصميم أي دارة كهربائية من الصفر عبر الـ Gallery.
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                </button>

                {/* 2. Breadboard Starter */}
                <button
                  onClick={handleStartBreadboardProject}
                  className="w-full p-2.5 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/70 rounded text-left transition flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 group-hover:text-emerald-800 text-xs">
                      2. Breadboard Circuit (قالب لوحة تجارب)
                    </div>
                    <div className="text-slate-500 text-[10px] truncate mt-0.5">
                      لوحة تجارب Breadboard حقيقية مع بطارية ومفتاح ومقاومة وليد LED.
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                </button>

                {/* 3. Default Bulb Circuit */}
                <button
                  onClick={() => handleLoadSample(CW_SAMPLE_CIRCUITS[0])}
                  className="w-full p-2.5 border border-slate-200 hover:border-amber-500 hover:bg-amber-50/70 rounded text-left transition flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 group-hover:text-amber-800 text-xs">
                      3. Bulb Circuit (دائرة المصباح الأساسية)
                    </div>
                    <div className="text-slate-500 text-[10px] truncate mt-0.5">
                      دارة تعليمية بمصباح متوهج وبطارية 1.5V ومفتاح SW1 ومخطط توضيحي.
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 shrink-0" />
                </button>
              </div>
            </div>

            <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded text-xs"
              >
                Cancel (إلغاء)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Help & Shortcuts Guide Modal (دليل الاستخدام)      */}
      {/* ======================================================== */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 select-none">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden text-xs">
            <div className="bg-gradient-to-r from-[#0a246a] via-[#0055ea] to-[#3a6ea5] text-white px-4 py-2.5 flex items-center justify-between font-bold text-sm">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-300" />
                <span>Circuit Wizard Lab Guide (دليل استخدام المحاكي)</span>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-slate-800 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-blue-900 border-b pb-1">
                  طريقة بناء ومحاكاة الدوائر (How to Build & Simulate):
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                  <li><strong>توصيل الأسلاك:</strong> انقر على طرف أي مكون (Pin) ثم انقر على طرف المكون الآخر لرسم سلك التوصيل فورياً.</li>
                  <li><strong>بدء المحاكاة:</strong> اضغط على زر <strong>Run ▶</strong> أو اضغط <strong>F9</strong> من لوحة المفاتيح.</li>
                  <li><strong>التفاعل مع المفاتيح:</strong> انقر على المفتاح (Switch) لفتحه أو إغلاقه وملاحظة اشتعال المصابيح أو حركة المحرك.</li>
                  <li><strong>إضافة مكونات جديدة:</strong> اضغط على زر <strong>Gallery</strong> أو شريط المكونات السريعة بالأعلى واسحب أي عنصر للورقة.</li>
                  <li><strong>تغيير مظهر الدائرة:</strong> اختر من الشريط الأيسر بين <strong>Real World</strong> (حقيقي)، <strong>Normal</strong> (رمزي)، أو <strong>Current Flow</strong> (مسار التيار المتحرك).</li>
                </ul>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-xs text-blue-900 border-b pb-1">
                  اختصارات لوحة المفاتيح (Keyboard Shortcuts):
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-1.5 bg-slate-50 border rounded flex justify-between">
                    <span className="text-slate-600">مشروع جديد:</span>
                    <kbd className="font-mono font-bold bg-white px-1.5 py-0.2 border rounded shadow-2xs">Ctrl + N</kbd>
                  </div>
                  <div className="p-1.5 bg-slate-50 border rounded flex justify-between">
                    <span className="text-slate-600">حفظ الدائرة:</span>
                    <kbd className="font-mono font-bold bg-white px-1.5 py-0.2 border rounded shadow-2xs">Ctrl + S</kbd>
                  </div>
                  <div className="p-1.5 bg-slate-50 border rounded flex justify-between">
                    <span className="text-slate-600">فتح النماذج:</span>
                    <kbd className="font-mono font-bold bg-white px-1.5 py-0.2 border rounded shadow-2xs">Ctrl + O</kbd>
                  </div>
                  <div className="p-1.5 bg-slate-50 border rounded flex justify-between">
                    <span className="text-slate-600">تراجع (Undo):</span>
                    <kbd className="font-mono font-bold bg-white px-1.5 py-0.2 border rounded shadow-2xs">Ctrl + Z</kbd>
                  </div>
                  <div className="p-1.5 bg-slate-50 border rounded flex justify-between">
                    <span className="text-slate-600">قص المكون:</span>
                    <kbd className="font-mono font-bold bg-white px-1.5 py-0.2 border rounded shadow-2xs">Ctrl + X</kbd>
                  </div>
                  <div className="p-1.5 bg-slate-50 border rounded flex justify-between">
                    <span className="text-slate-600">نسخ / لصق:</span>
                    <kbd className="font-mono font-bold bg-white px-1.5 py-0.2 border rounded shadow-2xs">Ctrl+C / V</kbd>
                  </div>
                  <div className="p-1.5 bg-slate-50 border rounded flex justify-between">
                    <span className="text-slate-600">حذف المكون:</span>
                    <kbd className="font-mono font-bold bg-white px-1.5 py-0.2 border rounded shadow-2xs">Delete</kbd>
                  </div>
                  <div className="p-1.5 bg-slate-50 border rounded flex justify-between">
                    <span className="text-slate-600">تدوير 90 درجة:</span>
                    <kbd className="font-mono font-bold bg-white px-1.5 py-0.2 border rounded shadow-2xs">R</kbd>
                  </div>
                  <div className="p-1.5 bg-slate-50 border rounded flex justify-between">
                    <span className="text-slate-600">تشغيل المحاكاة:</span>
                    <kbd className="font-mono font-bold bg-white px-1.5 py-0.2 border rounded shadow-2xs">F9</kbd>
                  </div>
                  <div className="p-1.5 bg-slate-50 border rounded flex justify-between">
                    <span className="text-slate-600">طباعة الورقة:</span>
                    <kbd className="font-mono font-bold bg-white px-1.5 py-0.2 border rounded shadow-2xs">Ctrl + P</kbd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs"
              >
                حسناً (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 11. Component Properties Modal (خصائص العنصر)      */}
      {/* ======================================================== */}
      {showPropertiesModal && editingComp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-sm overflow-hidden text-xs">
            <div className="bg-gradient-to-r from-[#0a246a] to-[#0055ea] text-white px-3.5 py-2 flex items-center justify-between font-bold">
              <span>Properties • {editingComp.ref}</span>
              <button onClick={() => setShowPropertiesModal(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Component Name:</label>
                <input
                  type="text"
                  value={editingComp.name}
                  onChange={(e) => setEditingComp({ ...editingComp, name: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Value & Specification:</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editingComp.value}
                    onChange={(e) => setEditingComp({ ...editingComp, value: parseFloat(e.target.value) || 0 })}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded font-mono font-bold"
                  />
                  <input
                    type="text"
                    value={editingComp.unit}
                    onChange={(e) => setEditingComp({ ...editingComp, unit: e.target.value })}
                    className="w-16 px-2 py-1 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rotation Angle:</label>
                <select
                  value={editingComp.rotation || 0}
                  onChange={(e) => setEditingComp({ ...editingComp, rotation: parseInt(e.target.value, 10) })}
                  className="w-full px-2 py-1 border border-slate-300 rounded"
                >
                  <option value={0}>0° (Normal Horizontal)</option>
                  <option value={90}>90° (Vertical)</option>
                  <option value={180}>180° (Inverted)</option>
                  <option value={270}>270° (Vertical Inverted)</option>
                </select>
              </div>

              {editingComp.kind === 'led' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">LED Color:</label>
                  <div className="flex gap-2">
                    {['#ef4444', '#22c55e', '#3b82f6', '#eab308'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditingComp({ ...editingComp, color: c })}
                        className={`w-6 h-6 rounded-full border ${editingComp.color === c ? 'ring-2 ring-blue-600 scale-110' : 'border-slate-300'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowPropertiesModal(false)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setElements((prev) => prev.map((el) => (el.id === editingComp.id ? editingComp : el)));
                  setShowPropertiesModal(false);
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded"
              >
                Apply (تطبيق)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
