import React, { useState, useEffect, useRef } from 'react';
import { Bot, Play, RotateCcw, Crosshair, Sparkles, Sliders, Box, Layers } from 'lucide-react';

export const RoboticArmLab: React.FC = () => {
  // Joint angles in degrees
  const [theta1, setTheta1] = useState<number>(45); // Shoulder
  const [theta2, setTheta2] = useState<number>(-35); // Elbow
  const [theta3, setTheta3] = useState<number>(-10); // Wrist / Tool
  const [gripperOpen, setGripperOpen] = useState<boolean>(true);
  const [isAutoMoving, setIsAutoMoving] = useState<boolean>(false);
  const [isContinuousRun, setIsContinuousRun] = useState<boolean>(false);
  const [pickedItem, setPickedItem] = useState<boolean>(false);

  // Link lengths (cm)
  const L1 = 120; // Base to Shoulder
  const L2 = 100; // Upper arm
  const L3 = 80;  // Forearm to gripper

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Forward Kinematics calculations (in 2D planar workspace for clear visualization)
  const rad1 = (theta1 * Math.PI) / 180;
  const rad2 = ((theta1 + theta2) * Math.PI) / 180;
  const rad3 = ((theta1 + theta2 + theta3) * Math.PI) / 180;

  // Base position
  const baseX = 200;
  const baseY = 280;

  // Joint 1 (Shoulder)
  const j1X = baseX;
  const j1Y = baseY - 40;

  // Joint 2 (Elbow)
  const j2X = j1X + L1 * Math.cos(rad1 - Math.PI / 2);
  const j2Y = j1Y - L1 * Math.sin(rad1 - Math.PI / 2);

  // Joint 3 (Wrist)
  const j3X = j2X + L2 * Math.cos(rad2 - Math.PI / 2);
  const j3Y = j2Y - L2 * Math.sin(rad2 - Math.PI / 2);

  // End Effector (Gripper)
  const eeX = j3X + L3 * Math.cos(rad3 - Math.PI / 2);
  const eeY = j3Y - L3 * Math.sin(rad3 - Math.PI / 2);

  // Inverse Kinematics solver
  const solveIK = (targetX: number, targetY: number) => {
    // Relative to shoulder j1
    const dx = targetX - j1X;
    const dy = -(targetY - j1Y); // Invert Y for Cartesian upward
    const dist = Math.hypot(dx, dy);

    // Reachability check
    const maxReach = L1 + L2;
    if (dist > maxReach - 5 || dist < Math.abs(L1 - L2) + 5) return;

    // Law of cosines for elbow theta2
    const cosTheta2 = (dx * dx + dy * dy - L1 * L1 - L2 * L2) / (2 * L1 * L2);
    const clampedCos = Math.max(-1, Math.min(1, cosTheta2));
    const ikTheta2Rad = -Math.acos(clampedCos); // elbow-up

    // Shoulder angle theta1
    const beta = Math.atan2(dy, dx);
    const alpha = Math.atan2(L2 * Math.sin(-ikTheta2Rad), L1 + L2 * Math.cos(-ikTheta2Rad));
    const ikTheta1Rad = beta - alpha;

    setTheta1(Math.round(((ikTheta1Rad * 180) / Math.PI)));
    setTheta2(Math.round(((ikTheta2Rad * 180) / Math.PI)));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    solveIK(clickX, clickY);
  };

  // Automated Pick & Place demo
  const runPickAndPlace = async () => {
    if (isAutoMoving) return;
    setIsAutoMoving(true);

    // Sequence of waypoints
    const steps = [
      { t1: 20, t2: 40, t3: 0, grip: true, pick: false },
      { t1: 15, t2: 70, t3: -10, grip: false, pick: true }, // Pick item
      { t1: 60, t2: 10, t3: 15, grip: false, pick: true },  // Lift
      { t1: 85, t2: -30, t3: -20, grip: false, pick: true }, // Move right
      { t1: 75, t2: 45, t3: -30, grip: true, pick: false },  // Place down
      { t1: 45, t2: -35, t3: -10, grip: true, pick: false }, // Home
    ];

    for (const step of steps) {
      setTheta1(step.t1);
      setTheta2(step.t2);
      setTheta3(step.t3);
      setGripperOpen(step.grip);
      setPickedItem(step.pick);
      await new Promise(r => setTimeout(r, 650));
    }
    setIsAutoMoving(false);
  };

  // Continuous loop handler
  useEffect(() => {
    let isMounted = true;
    const runLoop = async () => {
      while (isMounted && isContinuousRun) {
        await runPickAndPlace();
        if (isMounted && isContinuousRun) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
    };
    if (isContinuousRun) {
      runLoop();
    }
    return () => {
      isMounted = false;
    };
  }, [isContinuousRun]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Factory floor background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Floor Base Plate
    ctx.fillStyle = '#334155';
    ctx.fillRect(baseX - 60, baseY, 120, 20);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(baseX - 45, baseY - 35, 90, 35);

    // Arm Link 1 (Yellow / Orange industrial robotic arm)
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(j1X, j1Y);
    ctx.lineTo(j2X, j2Y);
    ctx.stroke();

    // Link 1 center stripe
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(j1X, j1Y);
    ctx.lineTo(j2X, j2Y);
    ctx.stroke();

    // Arm Link 2
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(j2X, j2Y);
    ctx.lineTo(j3X, j3Y);
    ctx.stroke();

    // Arm Link 3 (Forearm)
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(j3X, j3Y);
    ctx.lineTo(eeX, eeY);
    ctx.stroke();

    // Joint Servos / Discs
    const drawJoint = (x: number, y: number, label: string) => {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    drawJoint(j1X, j1Y, 'مفصل 1');
    drawJoint(j2X, j2Y, 'مفصل 2');
    drawJoint(j3X, j3Y, 'مفصل 3');

    // Industrial Gripper
    ctx.save();
    ctx.translate(eeX, eeY);
    ctx.rotate(rad3 - Math.PI / 2);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-8, -4, 16, 8);

    // Claws
    const clawSpan = gripperOpen ? 14 : 5;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-clawSpan, 0);
    ctx.lineTo(-clawSpan, 18);
    ctx.lineTo(-clawSpan + 4, 22);

    ctx.moveTo(clawSpan, 0);
    ctx.lineTo(clawSpan, 18);
    ctx.lineTo(clawSpan - 4, 22);
    ctx.stroke();

    // Picked box if attached
    if (pickedItem) {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-7, 10, 14, 14);
      ctx.strokeStyle = '#047857';
      ctx.strokeRect(-7, 10, 14, 14);
    }
    ctx.restore();

    // Reach envelope contour (dotted circle)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(j1X, j1Y, L1 + L2 + L3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pickup & Delivery Trays
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.fillRect(60, 275, 50, 15);
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(60, 275, 50, 15);

    ctx.save();
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px Cairo, sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText('منصة الالتقاط A', 85, 305);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fillRect(310, 275, 50, 15);
    ctx.strokeStyle = '#3b82f6';
    ctx.strokeRect(310, 275, 50, 15);
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('منصة التسليم B', 335, 305);
    ctx.restore();
  }, [theta1, theta2, theta3, gripperOpen, pickedItem, eeX, eeY]);

  // Joint Torques calculation (approx for L1, L2, L3 with payload m=0.5kg)
  const payloadMass = 0.5; // kg
  const g = 9.81;
  const torque1 = (payloadMass * g * ((eeX - j1X) / 100)).toFixed(2);
  const torque2 = (payloadMass * g * ((eeX - j2X) / 100)).toFixed(2);

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              معمل كينماتيكا وتحكم ذراع الروبوت الصناعي (3-DOF Industrial Manipulator)
            </h3>
            <span className="text-xs text-amber-400 font-mono">
              Forward & Inverse Kinematics • Denavit-Hartenberg Parameters
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isContinuousRun) {
                setIsContinuousRun(false);
              } else {
                setIsContinuousRun(true);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isContinuousRun
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/40'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isContinuousRun ? 'fill-current' : ''}`} />
            <span>{isContinuousRun ? 'الروبوت قيد التشغيل المستمر (إيقاف)' : 'تشغيل الروبوت آلياً (RUN)'}</span>
          </button>
          <button
            onClick={runPickAndPlace}
            disabled={isAutoMoving || isContinuousRun}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isAutoMoving || isContinuousRun
                ? 'bg-slate-800 text-slate-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>دورة واحدة (Single Cycle)</span>
          </button>
          <button
            onClick={() => {
              setTheta1(45);
              setTheta2(-35);
              setTheta3(-10);
              setGripperOpen(true);
              setPickedItem(false);
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 text-xs flex items-center gap-1 transition"
            title="الوضع المرجعي (Home Position)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas + Telemetry & DH Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Canvas Simulation View */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              انقر في أي مكان بالشاشة لحل الكينماتيكا العكسية (Inverse Kinematics) وتوجيه الذراع
            </span>
            <span className="font-mono text-cyan-400 text-[11px]">
              End-Effector: X={(eeX - baseX).toFixed(1)}cm, Y={(-(eeY - baseY)).toFixed(1)}cm
            </span>
          </div>

          <div className="rounded-xl overflow-hidden border-2 border-slate-800 shadow-inner bg-black cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={600}
              height={320}
              onClick={handleCanvasClick}
              className="w-full h-auto block"
            />
          </div>
        </div>

        {/* DH Table & Real-time Joint Dynamics */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-200 border-b border-slate-800 pb-2 mb-2">
              <Layers className="w-4 h-4 text-amber-400" />
              جدول معاملات دينفيت-هارتنبرغ (DH Parameters)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-center font-mono text-[11px] border border-slate-800">
                <thead className="bg-slate-900 text-amber-400">
                  <tr>
                    <th className="p-1.5 border border-slate-800">الوصلة i</th>
                    <th className="p-1.5 border border-slate-800">θ_i</th>
                    <th className="p-1.5 border border-slate-800">d_i (cm)</th>
                    <th className="p-1.5 border border-slate-800">a_i (cm)</th>
                    <th className="p-1.5 border border-slate-800">α_i</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr>
                    <td className="p-1 border border-slate-800 font-bold">1 (الكتف)</td>
                    <td className="p-1 border border-slate-800 text-amber-300">{theta1}°</td>
                    <td className="p-1 border border-slate-800">0</td>
                    <td className="p-1 border border-slate-800">{L1 / 10}</td>
                    <td className="p-1 border border-slate-800">0°</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-slate-800 font-bold">2 (الذراع)</td>
                    <td className="p-1 border border-slate-800 text-amber-300">{theta2}°</td>
                    <td className="p-1 border border-slate-800">0</td>
                    <td className="p-1 border border-slate-800">{L2 / 10}</td>
                    <td className="p-1 border border-slate-800">0°</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-slate-800 font-bold">3 (الساعد)</td>
                    <td className="p-1 border border-slate-800 text-amber-300">{theta3}°</td>
                    <td className="p-1 border border-slate-800">0</td>
                    <td className="p-1 border border-slate-800">{L3 / 10}</td>
                    <td className="p-1 border border-slate-800">0°</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Joint Torques Calculation */}
          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-300 text-[11px] block">عزوم المفاصل الساكنة (Static Joint Torques):</span>
            <div className="flex justify-between text-slate-400 font-mono">
              <span>عزم الكتف (Joint 1):</span>
              <span className="text-amber-400 font-bold">{torque1} N·m</span>
            </div>
            <div className="flex justify-between text-slate-400 font-mono">
              <span>عزم الكوع (Joint 2):</span>
              <span className="text-amber-400 font-bold">{torque2} N·m</span>
            </div>
          </div>

          {/* Gripper Button */}
          <button
            onClick={() => setGripperOpen(!gripperOpen)}
            className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${
              gripperOpen
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-emerald-600 text-white shadow-md'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>{gripperOpen ? 'إغلاق القابض (Grip Item)' : 'فتح القابض (Release Item)'}</span>
          </button>
        </div>
      </div>

      {/* Joint Angle Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
        <div>
          <div className="flex justify-between items-center text-slate-300 mb-1">
            <span className="font-bold text-amber-400">مفصل الكتف (Joint 1 • θ1):</span>
            <span className="font-mono text-amber-300 font-bold">{theta1}°</span>
          </div>
          <input
            type="range"
            min="-90"
            max="120"
            value={theta1}
            onChange={(e) => setTheta1(parseInt(e.target.value))}
            className="w-full accent-amber-400 h-2 bg-slate-800 rounded cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between items-center text-slate-300 mb-1">
            <span className="font-bold text-yellow-400">مفصل الذراع (Joint 2 • θ2):</span>
            <span className="font-mono text-yellow-300 font-bold">{theta2}°</span>
          </div>
          <input
            type="range"
            min="-140"
            max="90"
            value={theta2}
            onChange={(e) => setTheta2(parseInt(e.target.value))}
            className="w-full accent-yellow-400 h-2 bg-slate-800 rounded cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between items-center text-slate-300 mb-1">
            <span className="font-bold text-cyan-400">مفصل الساعد والقابض (Joint 3 • θ3):</span>
            <span className="font-mono text-cyan-300 font-bold">{theta3}°</span>
          </div>
          <input
            type="range"
            min="-90"
            max="90"
            value={theta3}
            onChange={(e) => setTheta3(parseInt(e.target.value))}
            className="w-full accent-cyan-400 h-2 bg-slate-800 rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
