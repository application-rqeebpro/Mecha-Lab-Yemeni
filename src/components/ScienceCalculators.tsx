import React, { useState } from 'react';
import { Calculator, Cpu, Zap, Activity, Wind, Cog, ArrowRight } from 'lucide-react';

const COLOR_CODES = [
  { name: 'أسود Black', color: '#000000', value: 0, mult: 1, textLight: true },
  { name: 'بني Brown', color: '#8b4513', value: 1, mult: 10, tol: 1, textLight: true },
  { name: 'أحمر Red', color: '#dc2626', value: 2, mult: 100, tol: 2, textLight: true },
  { name: 'برتقالي Orange', color: '#f97316', value: 3, mult: 1000, textLight: false },
  { name: 'أصفر Yellow', color: '#eab308', value: 4, mult: 10000, textLight: false },
  { name: 'أخضر Green', color: '#16a34a', value: 5, mult: 100000, tol: 0.5, textLight: true },
  { name: 'أزرق Blue', color: '#2563eb', value: 6, mult: 1000000, tol: 0.25, textLight: true },
  { name: 'بنفسجي Violet', color: '#9333ea', value: 7, mult: 10000000, tol: 0.1, textLight: true },
  { name: 'رمادي Gray', color: '#6b7280', value: 8, mult: 100000000, tol: 0.05, textLight: true },
  { name: 'أبيض White', color: '#ffffff', value: 9, mult: 1000000000, textLight: false },
  { name: 'ذهبي Gold', color: '#eab308', mult: 0.1, tol: 5, textLight: false },
  { name: 'فضي Silver', color: '#cbd5e1', mult: 0.01, tol: 10, textLight: false },
];

export const ScienceCalculators: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'resistor' | 'ohm' | 'filter' | 'gears' | 'pneumatic'>('resistor');

  // Resistor Color Bands
  const [b1, setB1] = useState<number>(1); // Brown (1)
  const [b2, setB2] = useState<number>(0); // Black (0)
  const [b3, setB3] = useState<number>(2); // Red (x100) -> 1k
  const [tol, setTol] = useState<number>(10); // Gold (5%)

  // Resistor calculation
  const resVal = (COLOR_CODES[b1].value! * 10 + COLOR_CODES[b2].value!) * COLOR_CODES[b3].mult;
  const resTolerance = COLOR_CODES[tol].tol || 5;

  // Format Ohms
  const formatOhms = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(2)} MΩ`;
    if (val >= 1000) return `${(val / 1000).toFixed(2)} kΩ`;
    return `${val.toFixed(1)} Ω`;
  };

  // Ohm's Law Calculator
  const [ohmV, setOhmV] = useState<number>(12);
  const [ohmR, setOhmR] = useState<number>(220);
  const ohmI = ohmR > 0 ? (ohmV / ohmR) : 0;
  const ohmP = ohmV * ohmI;

  // Filter Calculator
  const [filterR, setFilterR] = useState<number>(10); // kOhm
  const [filterC, setFilterC] = useState<number>(100); // nF
  const filterFc = 1 / (2 * Math.PI * (filterR * 1000) * (filterC * 1e-9));

  // Gear Ratio Calculator
  const [n1, setN1] = useState<number>(12); // Teeth 1
  const [n2, setN2] = useState<number>(60); // Teeth 2
  const [rpmIn, setRpmIn] = useState<number>(3000);
  const [torqueIn, setTorqueIn] = useState<number>(0.2); // Nm

  const gearRatio = n2 / (n1 || 1);
  const rpmOut = rpmIn / (gearRatio || 1);
  const torqueOut = torqueIn * gearRatio * 0.9; // 90% efficiency

  // Pneumatics Calculator
  const [pneuPressBar, setPneuPressBar] = useState<number>(6);
  const [pneuDiameterMm, setPneuDiameterMm] = useState<number>(32);
  const pneuForceN = (pneuPressBar * 100000 * Math.PI * Math.pow(pneuDiameterMm / 1000, 2)) / 4;

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              حقيبة الحسابات الهندسية والميكاترونكس (Mechatronics Science Suite)
            </h3>
            <span className="text-xs text-indigo-400 font-mono">
              Engineering Calculations • Formulas & Theoretical Verification
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('resistor')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${activeTab === 'resistor' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            ألوان المقاومات
          </button>
          <button
            onClick={() => setActiveTab('ohm')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${activeTab === 'ohm' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            قانون أوم والقدرة
          </button>
          <button
            onClick={() => setActiveTab('filter')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${activeTab === 'filter' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            مرشحات التردد RC
          </button>
          <button
            onClick={() => setActiveTab('gears')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${activeTab === 'gears' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            نسبة التروس والعزم
          </button>
          <button
            onClick={() => setActiveTab('pneumatic')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${activeTab === 'pneumatic' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            قوى النيوماتيك
          </button>
        </div>
      </div>

      {/* Calculator Body */}
      {activeTab === 'resistor' && (
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col gap-5">
          {/* Resistor Graphic */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-xl border border-slate-800">
            <div className="relative flex items-center justify-center w-80 h-16">
              {/* Resistor Leads */}
              <div className="absolute w-full h-2 bg-slate-400 rounded-full" />
              {/* Resistor Body */}
              <div className="w-56 h-12 bg-amber-100 rounded-2xl border-2 border-amber-300 relative z-10 flex items-center justify-around px-6 shadow-xl">
                {/* Band 1 */}
                <div className="w-4 h-full rounded" style={{ backgroundColor: COLOR_CODES[b1].color }} />
                {/* Band 2 */}
                <div className="w-4 h-full rounded" style={{ backgroundColor: COLOR_CODES[b2].color }} />
                {/* Band 3 Multiplier */}
                <div className="w-4 h-full rounded" style={{ backgroundColor: COLOR_CODES[b3].color }} />
                {/* Tolerance Band */}
                <div className="w-4 h-full rounded ml-6" style={{ backgroundColor: COLOR_CODES[tol].color }} />
              </div>
            </div>

            {/* Value Display */}
            <div className="text-center mt-4">
              <span className="text-3xl font-black font-mono text-amber-400">{formatOhms(resVal)}</span>
              <span className="text-sm font-mono text-slate-400 ml-2">±{resTolerance}%</span>
            </div>
          </div>

          {/* Color Selector Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-300 block mb-1">الحلقة الأولى (Digit 1):</span>
              <select
                value={b1}
                onChange={(e) => setB1(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                {COLOR_CODES.slice(1, 10).map((c, i) => (
                  <option key={i + 1} value={i + 1}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="font-bold text-slate-300 block mb-1">الحلقة الثانية (Digit 2):</span>
              <select
                value={b2}
                onChange={(e) => setB2(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                {COLOR_CODES.slice(0, 10).map((c, i) => (
                  <option key={i} value={i}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="font-bold text-slate-300 block mb-1">حلقة المعامل (Multiplier):</span>
              <select
                value={b3}
                onChange={(e) => setB3(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                {COLOR_CODES.map((c, i) => (
                  <option key={i} value={i}>{c.name} (x{c.mult})</option>
                ))}
              </select>
            </div>
            <div>
              <span className="font-bold text-slate-300 block mb-1">نسبة التفاوت (Tolerance):</span>
              <select
                value={tol}
                onChange={(e) => setTol(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                <option value={10}>ذهبي (±5%)</option>
                <option value={11}>فضي (±10%)</option>
                <option value={1}>بني (±1%)</option>
                <option value={2}>أحمر (±2%)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ohm' && (
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="space-y-4">
            <h4 className="font-bold text-slate-200 text-sm">حسابات قانون أوم (V = I × R):</h4>
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>الجهد الكهربائي (Voltage V):</span>
                <span className="font-mono text-amber-400 font-bold">{ohmV} V</span>
              </div>
              <input
                type="range"
                min="1"
                max="48"
                value={ohmV}
                onChange={(e) => setOhmV(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>المقاومة (Resistance R):</span>
                <span className="font-mono text-cyan-400 font-bold">{ohmR} Ω</span>
              </div>
              <input
                type="range"
                min="10"
                max="2000"
                step="10"
                value={ohmR}
                onChange={(e) => setOhmR(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-around gap-2 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">شدة التيار المار (I):</span>
              <span className="text-lg font-bold text-emerald-400">{(ohmI * 1000).toFixed(2)} mA ({ohmI.toFixed(4)} A)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">القدرة الكهربائية المبددة (P):</span>
              <span className="text-lg font-bold text-rose-400">{ohmP.toFixed(3)} W</span>
            </div>
            <div className="text-[11px] text-slate-500 font-sans border-t border-slate-800 pt-2">
              * يوصى بمقاومة قدرة مقننة {(ohmP * 1.5).toFixed(2)}W لتفادي الاحتراق.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'filter' && (
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="space-y-4">
            <h4 className="font-bold text-slate-200 text-sm">مرشح التردد المنخفض RC (Low-Pass Filter):</h4>
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>المقاومة (R):</span>
                <span className="font-mono text-indigo-400 font-bold">{filterR} kΩ</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={filterR}
                onChange={(e) => setFilterR(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>سعة المكثف (C):</span>
                <span className="font-mono text-cyan-400 font-bold">{filterC} nF</span>
              </div>
              <input
                type="range"
                min="1"
                max="1000"
                step="10"
                value={filterC}
                onChange={(e) => setFilterC(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-around gap-2 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">تردد القطع (-3dB Cutoff fc):</span>
              <span className="text-xl font-bold text-indigo-400">{filterFc.toFixed(1)} Hz</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">ثابت الزمن (τ = R × C):</span>
              <span className="text-base font-bold text-emerald-400">{((filterR * 1000) * (filterC * 1e-9) * 1000).toFixed(2)} ms</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gears' && (
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 text-sm">منظومة التروس (Gear Train Ratio):</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">أسنان الترس القائد N1:</span>
                <input
                  type="number"
                  value={n1}
                  onChange={(e) => setN1(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono"
                />
              </div>
              <div>
                <span className="text-slate-400">أسنان الترس المقاد N2:</span>
                <input
                  type="number"
                  value={n2}
                  onChange={(e) => setN2(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono"
                />
              </div>
            </div>
            <div>
              <span className="text-slate-400">سرعة المحرك في الدخل (RPM):</span>
              <input
                type="number"
                value={rpmIn}
                onChange={(e) => setRpmIn(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-around gap-2 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">نسبة التخفيض (Gear Ratio):</span>
              <span className="text-lg font-bold text-amber-400">{gearRatio.toFixed(2)} : 1</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">سرعة الخرج:</span>
              <span className="text-lg font-bold text-cyan-400">{rpmOut.toFixed(1)} RPM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">عزم الخرج (بكفاءة 90%):</span>
              <span className="text-lg font-bold text-emerald-400">{torqueOut.toFixed(2)} N·m</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pneumatic' && (
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="space-y-4">
            <h4 className="font-bold text-slate-200 text-sm">قوة الأسطوانة الهوائية (F = P × A):</h4>
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>ضغط الهواء (Bar):</span>
                <span className="font-mono text-blue-400 font-bold">{pneuPressBar} Bar</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={pneuPressBar}
                onChange={(e) => setPneuPressBar(parseFloat(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>قطر الأسطوانة (mm):</span>
                <span className="font-mono text-cyan-400 font-bold">{pneuDiameterMm} mm</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={pneuDiameterMm}
                onChange={(e) => setPneuDiameterMm(parseInt(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-around gap-2 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">القوة المؤثرة (Force):</span>
              <span className="text-2xl font-black text-rose-400">{pneuForceN.toFixed(1)} N</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">الكتلة المكافئة للرفع:</span>
              <span className="text-lg font-bold text-emerald-400">{(pneuForceN / 9.81).toFixed(1)} kg</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
