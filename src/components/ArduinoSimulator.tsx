import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Pause, RotateCcw, Check, Cpu, Code2, Sparkles, Send } from 'lucide-react';

interface ArduinoSketch {
  id: string;
  name: string;
  code: string;
}

const DEFAULT_SKETCHES: ArduinoSketch[] = [
  {
    id: 'pwm_motor',
    name: 'التحكم بسرعة محرك DC عبر PWM',
    code: `// Mechatronics Lab - DC Motor PWM Speed Control
const int motorPWM = 9;   // Pin 9 PWM output to L298N ENA
const int potPin = A0;    // Potentiometer input

void setup() {
  pinMode(motorPWM, OUTPUT);
  Serial.begin(9600);
  Serial.println("[SYSTEM READY] DC Motor Controller Initialized.");
}

void loop() {
  int potValue = analogRead(potPin);        // Read 0 - 1023
  int pwmValue = map(potValue, 0, 1023, 0, 255); // Map to 0 - 255
  analogWrite(motorPWM, pwmValue);          // Output PWM duty cycle

  Serial.print("Pot: ");
  Serial.print(potValue);
  Serial.print(" -> Duty Cycle: ");
  Serial.print((pwmValue * 100) / 255);
  Serial.println("%");
  delay(200);
}`
  },
  {
    id: 'ultrasonic',
    name: 'حساس المسافة HC-SR04',
    code: `// Mechatronics Lab - HC-SR04 Distance Measurement
const int trigPin = 9;
const int echoPin = 8;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  Serial.begin(9600);
  Serial.println("[HC-SR04] Ultrasonic Rangefinder Started.");
}

void loop() {
  // Trigger 10us acoustic pulse
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  // Speed of sound = 340 m/s = 0.0343 cm/us
  float distanceCm = (duration * 0.0343) / 2;

  Serial.print("Target Distance: ");
  Serial.print(distanceCm);
  Serial.println(" cm");
  delay(300);
}`
  },
  {
    id: 'servo_sweep',
    name: 'توجيه محرك سيرفو 180 درجة',
    code: `// Mechatronics Lab - Servo Sweep 0 to 180 Degrees
#include <Servo.h>
Servo myServo;

void setup() {
  myServo.attach(9);
  Serial.begin(9600);
  Serial.println("[SERVO] Robotic Joint Initialized.");
}

void loop() {
  for (int pos = 0; pos <= 180; pos += 15) {
    myServo.write(pos);
    Serial.print("Servo Angle: ");
    Serial.print(pos);
    Serial.println(" deg");
    delay(100);
  }
  for (int pos = 180; pos >= 0; pos -= 15) {
    myServo.write(pos);
    Serial.print("Servo Angle: ");
    Serial.print(pos);
    Serial.println(" deg");
    delay(100);
  }
}`
  },
  {
    id: 'blink',
    name: 'وميض الليد (Blink Pin 13)',
    code: `// Standard Arduino Blink
void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(13, HIGH);
  Serial.println("LED 13: HIGH [5V]");
  delay(500);
  digitalWrite(13, LOW);
  Serial.println("LED 13: LOW  [0V]");
  delay(500);
}`
  }
];

export const ArduinoSimulator: React.FC = () => {
  const [selectedSketchId, setSelectedSketchId] = useState<string>('pwm_motor');
  const [code, setCode] = useState<string>(DEFAULT_SKETCHES[0].code);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [serialLogs, setSerialLogs] = useState<string[]>(['Arduino Uno Serial Console Connected. 9600 Baud.']);
  const [potValue, setPotValue] = useState<number>(512);
  const [pin13State, setPin13State] = useState<boolean>(false);
  const [pwmDuty, setPwmDuty] = useState<number>(50);
  const [serialInput, setSerialInput] = useState<string>('');
  const terminalRef = useRef<HTMLDivElement | null>(null);

  const handleSelectSketch = (id: string) => {
    setSelectedSketchId(id);
    const item = DEFAULT_SKETCHES.find(s => s.id === id);
    if (item) setCode(item.code);
  };

  const handleCompileAndUpload = () => {
    setIsCompiling(true);
    setSerialLogs(prev => [...prev, '>>> جاري التحقق من الكود (Compiling sketch)...', '>>> جاري الرفع إلى متحكم ATmega328P عبر منفذ USB (Uploading via avrdude)...']);
    setTimeout(() => {
      setIsCompiling(false);
      setIsRunning(true);
      setSerialLogs(prev => [...prev, '>>> تم الرفع والتشغيل بنجاح.']);
    }, 1200);
  };

  // Execution ticker
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      if (selectedSketchId === 'blink') {
        setPin13State(prev => !prev);
        setSerialLogs(prev => [...prev.slice(-30), `LED 13: ${!pin13State ? 'HIGH [ON]' : 'LOW [OFF]'}`]);
      } else if (selectedSketchId === 'pwm_motor') {
        const duty = Math.round((potValue / 1023) * 100);
        setPwmDuty(duty);
        setSerialLogs(prev => [...prev.slice(-30), `Pot: ${potValue} -> PWM Duty Cycle: ${duty}% (Pin 9)`]);
      } else if (selectedSketchId === 'ultrasonic') {
        const dist = (15 + Math.sin(Date.now() / 1500) * 12).toFixed(1);
        setSerialLogs(prev => [...prev.slice(-30), `HC-SR04 Target Distance: ${dist} cm`]);
      } else if (selectedSketchId === 'servo_sweep') {
        const angle = Math.round(90 + Math.sin(Date.now() / 1000) * 90);
        setSerialLogs(prev => [...prev.slice(-30), `Servo Joint Angle: ${angle}°`]);
      }
    }, 800);
    return () => clearInterval(timer);
  }, [isRunning, selectedSketchId, potValue, pin13State]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [serialLogs]);

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              محاكي وبرمجة الأردوينو المتكامل (Arduino Uno Microcontroller Simulator)
            </h3>
            <span className="text-xs text-teal-400 font-mono">
              ATmega328P • C++ / Wiring Firmware Compiler & Serial Monitor
            </span>
          </div>
        </div>

        {/* Sketch Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSketchId}
            onChange={(e) => handleSelectSketch(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-teal-500"
          >
            {DEFAULT_SKETCHES.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={handleCompileAndUpload}
            disabled={isCompiling}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              isCompiling
                ? 'bg-slate-800 text-slate-500'
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/40'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isCompiling ? 'جاري التحقق...' : 'رفع وتشغيل (Upload)'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Code Editor + Physical Board + Serial Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Code Editor */}
        <div className="lg:col-span-6 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-300 flex items-center gap-1.5 font-sans">
              <Code2 className="w-4 h-4 text-teal-400" />
              محرر كود الأردوينو C++ التفاعلي (Interactive Firmware Editor)
            </span>
            <span className="font-mono text-slate-500 text-[11px]">sketch.ino</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-80 bg-slate-900 text-emerald-300 font-mono text-xs p-3 rounded-lg border border-slate-800 resize-none focus:outline-none focus:border-teal-500 leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Board Visualizer & Telemetry */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Arduino Board Physical Rendering */}
          <div className="bg-teal-950/70 p-4 rounded-xl border-2 border-teal-700/80 shadow-2xl relative flex flex-col justify-between gap-3 text-white">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-8 h-10 bg-slate-400 border border-slate-300 rounded-t shadow-inner flex items-center justify-center text-slate-900 text-[10px] font-bold">
                  USB
                </div>
                <div>
                  <h4 className="font-black text-sm tracking-wide text-white">ARDUINO UNO</h4>
                  <span className="text-[10px] text-teal-300 font-mono">ITALY DESIGN • 16MHz</span>
                </div>
              </div>
              {/* Status LEDs */}
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <div className="flex flex-col items-center">
                  <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-slate-700'}`}></span>
                  <span className="text-teal-300 mt-0.5">ON</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className={`w-2.5 h-2.5 rounded-full ${pin13State ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-slate-700'}`}></span>
                  <span className="text-amber-300 mt-0.5">L (Pin13)</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`}></span>
                  <span className="text-cyan-300 mt-0.5">TX/RX</span>
                </div>
              </div>
            </div>

            {/* ATmega328P Microchip */}
            <div className="w-full h-12 bg-slate-950 rounded border border-slate-700 flex items-center justify-center font-mono text-xs text-slate-300 shadow-inner">
              <span className="tracking-widest font-bold">ATMEGA328P-PU 2420</span>
            </div>

            {/* Interactive Hardware Pin Simulator Controls */}
            {selectedSketchId === 'pwm_motor' && (
              <div className="bg-slate-900/90 p-3 rounded-lg border border-teal-700/50 text-xs space-y-1.5">
                <div className="flex justify-between text-teal-200">
                  <span>محاكاة المقاومة المتغيرة A0:</span>
                  <span className="font-mono text-amber-300 font-bold">{potValue} ({pwmDuty}%)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1023"
                  value={potValue}
                  onChange={(e) => setPotValue(parseInt(e.target.value))}
                  className="w-full accent-teal-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Serial Monitor Console */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-2 flex-1">
            <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-1.5">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                شاشة الاتصال التسلسلي (Serial Monitor @ 9600 Baud)
              </span>
              <button
                onClick={() => setSerialLogs([])}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                مسح السجل (Clear)
              </button>
            </div>
            <div
              ref={terminalRef}
              className="h-36 bg-black p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-y-auto space-y-1 shadow-inner"
            >
              {serialLogs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
