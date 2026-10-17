import React, { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  EXPERIMENTS_CATALOG, 
  YEMENI_UNIVERSITIES 
} from './data/curriculumData';
import { 
  AcademicYear, 
  Experiment, 
  OscilloscopeState, 
  MultimeterState, 
  PowerSupplyState,
  UniversityInfo 
} from './types/mechatronics';
import { Oscilloscope } from './components/Oscilloscope';
import { DigitalMultimeter } from './components/DigitalMultimeter';
import { DCPowerSupply } from './components/DCPowerSupply';
import { InteractiveBreadboard } from './components/InteractiveBreadboard';
import { PIDControlLab } from './components/PIDControlLab';
import { RoboticArmLab } from './components/RoboticArmLab';
import { PLCLadderLab } from './components/PLCLadderLab';
import { PneumaticsLab } from './components/PneumaticsLab';
import { ArduinoSimulator } from './components/ArduinoSimulator';
import { ScienceCalculators } from './components/ScienceCalculators';
import { AILabAdvisorModal } from './components/AILabAdvisorModal';
import { LabReportModal } from './components/LabReportModal';
import { VoltmeterSimulator } from './components/VoltmeterSimulator';
import { CircuitWizardLab } from './components/CircuitWizardLab';
import { OwnerAdminModal } from './components/OwnerAdminModal';
import { OwnerAuthModal } from './components/OwnerAuthModal';
import { AppLogoSecretTrigger } from './components/AppLogoSecretTrigger';
import { AuthPage } from './components/AuthPage';
import { PWAInstallButton } from './components/PWAInstallButton';
import { authStorage } from './services/authStorage';
import { StudentUser } from './types/mechatronics';
import { 
  Cpu, 
  Activity, 
  Bot, 
  FileText, 
  HelpCircle, 
  Wind, 
  Calculator, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  Zap, 
  Play, 
  RotateCcw,
  Gauge,
  Compass,
  ArrowRight,
  ShieldCheck,
  Menu,
  X,
  SlidersHorizontal,
  ChevronDown,
  LogOut,
  UserCheck
} from 'lucide-react';

export default function App() {
  // Mobile Navigation Drawer Toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Selected University & Academic Year
  const [selectedUniv, setSelectedUniv] = useState<UniversityInfo>(YEMENI_UNIVERSITIES[0]);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | 'all'>('all');

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState<
    'curriculum' | 'circuit_wizard' | 'workbench' | 'voltmeter' | 'pid' | 'robotics' | 'plc' | 'pneumatics' | 'arduino' | 'calculators'
  >('circuit_wizard');

  // Currently Selected Experiment
  const [currentExp, setCurrentExp] = useState<Experiment>(EXPERIMENTS_CATALOG[0]);

  // Floating / Docked Lab Instruments
  const [showOscilloscope, setShowOscilloscope] = useState<boolean>(false);
  const [showMultimeter, setShowMultimeter] = useState<boolean>(false);
  const [showPowerSupply, setShowPowerSupply] = useState<boolean>(false);

  // Modals
  const [showAIAdvisor, setShowAIAdvisor] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Instruments Live States
  const [scopeState, setScopeState] = useState<OscilloscopeState>({
    enabled: true,
    timePerDiv: 5,
    voltsPerDivCH1: 2,
    voltsPerDivCH2: 2,
    yPosCH1: 0,
    yPosCH2: 0,
    ch1Enabled: true,
    ch2Enabled: true,
    run: true,
    frequencyCH1: 50,
    vppCH1: 5.0,
    frequencyCH2: 100,
    vppCH2: 2.5,
    waveCH1: 'sine',
    waveCH2: 'square'
  });

  const [dmmState, setDmmState] = useState<MultimeterState>({
    enabled: true,
    mode: 'V_DC',
    value: 5.0,
    unit: 'V',
    probeRedConnectedTo: null,
    probeBlackConnectedTo: null,
    beep: false
  });

  const [powerState, setPowerState] = useState<PowerSupplyState>({
    enabled: true,
    setVoltage: 5.0,
    setCurrentLimit: 2.0,
    measuredVoltage: 5.0,
    measuredCurrent: 0.025
  });

  const handleProbeMeasurement = useCallback((v: number, i: number, _r: number) => {
    setPowerState(prev => {
      if (Math.abs(prev.measuredCurrent - i) < 0.0001 && Math.abs(prev.measuredVoltage - v) < 0.0001) {
        return prev;
      }
      return { ...prev, measuredVoltage: v, measuredCurrent: i };
    });
  }, []);

  const [showOwnerAuth, setShowOwnerAuth] = useState<boolean>(false);
  const [showOwnerModal, setShowOwnerModal] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(() => {
    const u = authStorage.getCurrentUser();
    return u && u.isActivated ? u : null;
  });
  const [customLessons, setCustomLessons] = useState<Experiment[]>(() => authStorage.getCustomLessons());

  // Merge custom lessons added by owner with default catalog
  const allCatalog = [...customLessons, ...EXPERIMENTS_CATALOG];
  const filteredExperiments = selectedYear === 'all' 
    ? allCatalog 
    : allCatalog.filter(e => e.year === selectedYear);

  const handleSelectExperiment = (exp: Experiment) => {
    setCurrentExp(exp);
    // Switch to corresponding interactive lab mode
    if (exp.mode === 'pid') setActiveTab('pid');
    else if (exp.mode === 'robotics') setActiveTab('robotics');
    else if (exp.mode === 'plc') setActiveTab('plc');
    else if (exp.mode === 'pneumatics') setActiveTab('pneumatics');
    else if (exp.mode === 'arduino') setActiveTab('arduino');
    else setActiveTab('circuit_wizard');
  };

  const handleCompleteExperiment = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // If no student is logged in, show the Login / Registration Page (with secret 20s owner hold)
  if (!currentUser) {
    return (
      <>
        <AuthPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            const foundUniv = YEMENI_UNIVERSITIES.find(u => u.nameAr === user.university || (user.university && user.university.includes(u.nameAr)));
            if (foundUniv) setSelectedUniv(foundUniv);
            if (user.academicYear) setSelectedYear(user.academicYear);
          }}
          onTriggerOwner={() => setShowOwnerAuth(true)}
        />

        {/* 4-Stage Owner Authentication Modal */}
        <OwnerAuthModal
          isOpen={showOwnerAuth}
          onClose={() => setShowOwnerAuth(false)}
          onSuccess={() => {
            setShowOwnerAuth(false);
            setShowOwnerModal(true);
          }}
        />

        {/* Owner Administration Dashboard */}
        <OwnerAdminModal
          isOpen={showOwnerModal}
          onClose={() => setShowOwnerModal(false)}
          onLessonAdded={(lesson) => {
            setCustomLessons(prev => [lesson, ...prev]);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Engineering University Brand Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-slate-900/95 pt-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Logo & Platform Title with Secret 20-second Owner Trigger */}
          <div className="flex items-center gap-2.5 min-w-0">
            <AppLogoSecretTrigger onTrigger={() => setShowOwnerAuth(true)} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xs sm:text-base font-black tracking-tight text-white truncate">
                  المختبر الافتراضي لهندسة الميكاترونكس
                </h1>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                  الجامعات اليمنية
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate hidden sm:block">
                Mechatronics Virtual Engineering Laboratory • Yemeni Universities Edition
              </p>
            </div>
          </div>

          {/* Lab Access Status & Mobile Menu Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Direct Open Access Badge */}
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-bold text-emerald-400 hidden sm:inline">مختبر حي ومفتوح</span>
              <span className="font-bold text-emerald-400 sm:hidden">مفتوح</span>
            </div>

            {/* Desktop Actions Bar (visible on lg screens and up) */}
            <div className="hidden lg:flex items-center gap-1.5">
              {/* PWA Mobile Install Button */}
              <PWAInstallButton variant="primary" />

              {/* Logged-in Student Info Badge & Logout */}
              <div className="flex items-center gap-2 bg-slate-950/80 border border-emerald-500/30 rounded-xl px-2.5 py-1 text-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                  {currentUser.name ? currentUser.name[0] : 'ط'}
                </div>
                <div className="flex flex-col text-right leading-tight max-w-[110px]">
                  <span className="font-bold text-white text-[11px] truncate">{currentUser.name}</span>
                  <span className="text-[9px] text-emerald-400 font-medium">مشترك معتمد</span>
                </div>
                <button
                  onClick={() => {
                    authStorage.setCurrentUser(null);
                    setCurrentUser(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                  title="تسجيل الخروج والعودة لصفحة الدخول"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* University Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
                <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                <select
                  value={selectedUniv.id}
                  onChange={(e) => {
                    const u = YEMENI_UNIVERSITIES.find(x => x.id === e.target.value);
                    if (u) setSelectedUniv(u);
                  }}
                  className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer max-w-[125px] truncate"
                >
                  {YEMENI_UNIVERSITIES.map(u => (
                    <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                      {u.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* AI Advisor Button */}
              <button
                onClick={() => setShowAIAdvisor(true)}
                className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-purple-900/30"
              >
                <Bot className="w-3.5 h-3.5 animate-pulse" />
                <span>المستشار الذكي (AI)</span>
              </button>

              {/* Official Lab Report Button */}
              <button
                onClick={() => setShowReportModal(true)}
                className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>تقرير المعمل (PDF)</span>
              </button>
            </div>

            {/* Mobile / Tablet Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center"
              aria-label="قائمة الخيارات"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-purple-400" /> : <Menu className="w-4 h-4 text-slate-200" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Drawer (when open on screens < lg) */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-950/98 border-t border-slate-800 p-4 space-y-3 animate-fadeIn">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* University Selector for Mobile */}
              <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  الجامعة:
                </span>
                <select
                  value={selectedUniv.id}
                  onChange={(e) => {
                    const u = YEMENI_UNIVERSITIES.find(x => x.id === e.target.value);
                    if (u) setSelectedUniv(u);
                  }}
                  className="bg-slate-950 text-white font-semibold rounded-lg px-2 py-1 text-xs border border-slate-800 focus:outline-none"
                >
                  {YEMENI_UNIVERSITIES.map(u => (
                    <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                      {u.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* AI Advisor Button */}
              <button
                onClick={() => {
                  setShowAIAdvisor(true);
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition shadow"
              >
                <Bot className="w-4 h-4" />
                <span>المستشار AI</span>
              </button>

              {/* Lab Report Button */}
              <button
                onClick={() => {
                  setShowReportModal(true);
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 px-3 bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
              >
                <FileText className="w-4 h-4" />
                <span>تقرير PDF</span>
              </button>

              {/* Mobile Student Profile & Logout */}
              <button
                onClick={() => {
                  authStorage.setCurrentUser(null);
                  setCurrentUser(null);
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج ({currentUser.name.split(' ')[0]})</span>
              </button>

              {/* PWA Button */}
              <div className="col-span-2 pt-1">
                <PWAInstallButton variant="primary" />
              </div>
            </div>
          </div>
        )}

        {/* Academic Years (Shown for Curriculum) & Quick Instruments Bar */}
        {(activeTab === 'curriculum' || showOscilloscope || showMultimeter || showPowerSupply) && (
          <div className="border-t border-slate-800/80 bg-slate-950/60 px-2 sm:px-4">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between py-1.5 gap-2 text-xs">
              {/* Academic Years Filter - Scrollable chips */}
              {activeTab === 'curriculum' && (
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  <span className="text-slate-400 font-semibold ml-1 shrink-0 text-[11px]">السنوات:</span>
                  <button
                    onClick={() => setSelectedYear('all')}
                    className={`px-2.5 py-1 rounded-lg transition font-medium shrink-0 text-xs ${
                      selectedYear === 'all'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    كل السنوات
                  </button>
                  {([1, 2, 3, 4, 5] as const).map(yr => (
                    <button
                      key={yr}
                      onClick={() => setSelectedYear(yr)}
                      className={`px-2 py-1 rounded-lg transition font-medium whitespace-nowrap shrink-0 text-xs ${
                        selectedYear === yr
                          ? 'bg-purple-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {yr === 1 && 'الأولى'}
                      {yr === 2 && 'الثانية'}
                      {yr === 3 && 'الثالثة'}
                      {yr === 4 && 'الرابعة'}
                      {yr === 5 && 'الخامسة (تخرج)'}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Floating Instruments Toggle Drawer */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] overflow-x-auto no-scrollbar shrink-0">
                <span className="text-slate-400 px-1 font-sans shrink-0 hidden sm:inline">أجهزة القياس:</span>
                <button
                  onClick={() => setShowOscilloscope(!showOscilloscope)}
                  className={`px-2 py-1 rounded-lg transition font-medium shrink-0 ${
                    showOscilloscope ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  راسم الإشارة (Scope)
                </button>
                <button
                  onClick={() => setShowMultimeter(!showMultimeter)}
                  className={`px-2 py-1 rounded-lg transition font-medium shrink-0 ${
                    showMultimeter ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  الملتيميتر (DMM)
                </button>
                <button
                  onClick={() => setShowPowerSupply(!showPowerSupply)}
                  className={`px-2 py-1 rounded-lg transition font-medium shrink-0 ${
                    showPowerSupply ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  التغذية المستمرة (DC)
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Lab Mode Tabs Navigation - Responsive Touch Scrollable Bar */}
      <div className="bg-slate-900/70 border-b border-slate-800 px-2 sm:px-4 sticky top-[82px] sm:top-[90px] z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 text-xs">
          <button
            onClick={() => setActiveTab('circuit_wizard')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeTab === 'circuit_wizard'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md ring-1 ring-purple-400'
                : 'text-purple-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>معمل سيركت ويزارد (Circuit Wizard Lab)</span>
            <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-black">جديد</span>
          </button>

          <button
            onClick={() => setActiveTab('curriculum')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeTab === 'curriculum'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>دليل التجارب المعتمدة (Curriculum Catalog)</span>
          </button>

          <button
            onClick={() => setActiveTab('workbench')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeTab === 'workbench'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>لوحة التجارب والتوصيل الحي (Breadboard & Circuit)</span>
          </button>

          <button
            onClick={() => setActiveTab('voltmeter')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeTab === 'voltmeter'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>محاكي الفولتميتر والقياس (Voltmeter Lab)</span>
          </button>

          <button
            onClick={() => setActiveTab('pid')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeTab === 'pid'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>التحكم الآلي ومعايرة PID (Control Systems)</span>
          </button>

          <button
            onClick={() => setActiveTab('robotics')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeTab === 'robotics'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>كينماتيكا ذراع الروبوت (Robotics Manipulator)</span>
          </button>

          <button
            onClick={() => setActiveTab('plc')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeTab === 'plc'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>التحكم الصناعي ومخطط السلم PLC (Ladder Logic)</span>
          </button>

          <button
            onClick={() => setActiveTab('pneumatics')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeTab === 'pneumatics'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>الكهرو-نيوماتيك والأتمتة (Electro-Pneumatics)</span>
          </button>

          <button
            onClick={() => setActiveTab('arduino')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeTab === 'arduino'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code2Icon className="w-4 h-4" />
            <span>برمجة ومحاكي الأردوينو (Arduino Uno Lab)</span>
          </button>

          <button
            onClick={() => setActiveTab('calculators')}
            className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap font-bold ${
              activeTab === 'calculators'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>حقيبة الحسابات الهندسية (Science Calculations)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-1.5 sm:p-4 space-y-4 sm:space-y-6">
        {/* Floating/Docked Instruments Drawer if enabled */}
        {(showOscilloscope || showMultimeter || showPowerSupply) && (
          <div className="bg-slate-900/90 border-2 border-purple-500/40 rounded-3xl p-4 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-xs text-purple-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                أجهزة القياس المعملية المدمجة (Docked Laboratory Instrumentation)
              </span>
              <button
                onClick={() => {
                  setShowOscilloscope(false);
                  setShowMultimeter(false);
                  setShowPowerSupply(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                إخفاء الأجهزة ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {showPowerSupply && (
                <DCPowerSupply
                  state={powerState}
                  onChange={(s) => setPowerState(prev => ({ ...prev, ...s }))}
                />
              )}

              {showMultimeter && (
                <DigitalMultimeter
                  state={dmmState}
                  onChange={(s) => setDmmState(prev => ({ ...prev, ...s }))}
                  measuredVoltage={powerState.enabled ? powerState.setVoltage : 0}
                  measuredCurrent={powerState.enabled ? powerState.measuredCurrent : 0}
                  measuredResistance={330}
                />
              )}

              {showOscilloscope && (
                <div className="lg:col-span-3">
                  <Oscilloscope
                    state={scopeState}
                    onChange={(s) => setScopeState(prev => ({ ...prev, ...s }))}
                    sourceSignal={{
                      ch1Amp: powerState.enabled ? powerState.setVoltage : 0,
                      ch1Freq: 50,
                      ch2Amp: 2.5,
                      ch2Freq: 100
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 1: Curriculum Experiments Catalog */}
        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            {/* Banner */}
            <div className="bg-gradient-to-r from-purple-900/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="space-y-2 z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  منهج هندسي متكامل للخمس السنوات
                </div>
                <h2 className="text-xl font-black text-white">
                  تجارب معامل هندسة الميكاترونكس والأتمتة الصناعية
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  مبنية وفق أحدث الخطط الدراسية لأقسام هندسة الميكاترونكس في الجامعات اليمنية ({selectedUniv.nameAr}) وتغطي الدوائر الكهربائية، الإلكترونيات، الأنظمة المدمجة، الأردوينو، التحكم الآلي PID، الروبوتات، وأنظمة PLC والنيوماتيك.
                </p>
              </div>

              <div className="flex flex-col gap-2 z-10 shrink-0">
                <button
                  onClick={() => setShowAIAdvisor(true)}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-purple-900/40"
                >
                  <Bot className="w-4 h-4" />
                  <span>استشارة المستشار الذكي AI</span>
                </button>
              </div>
            </div>

            {/* Experiment Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExperiments.map(exp => (
                <div
                  key={exp.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition shadow-lg hover:shadow-purple-950/20 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {exp.levelBadge}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        مستوى الصعوبة: {exp.difficulty}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-100 group-hover:text-purple-300 transition">
                      {exp.title}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400">
                      {exp.titleEn}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {exp.theory}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <span>نمط المعمل:</span>
                      <span className="text-emerald-400 font-bold">{exp.mode.toUpperCase()}</span>
                    </div>
                    <button
                      onClick={() => handleSelectExperiment(exp)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
                    >
                      <span>بدء التجربة</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Free Workbench & Breadboard */}
        {activeTab === 'workbench' && (
          <div className="space-y-4">
            {/* Active Experiment Header bar if working on a specific experiment */}
            {currentExp && (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-purple-400 font-bold text-[11px] block">{currentExp.levelBadge}</span>
                  <h3 className="text-sm font-black text-white">{currentExp.title}</h3>
                  <span className="text-slate-400 font-mono">{currentExp.titleEn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCompleteExperiment}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-900/40"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>إكمال واعتماد التجربة</span>
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <FileText className="w-4 h-4" />
                    <span>تقرير النتائج</span>
                  </button>
                </div>
              </div>
            )}

            <InteractiveBreadboard
              supplyVoltage={powerState.setVoltage}
              isSupplyOn={powerState.enabled}
              onProbeMeasurement={handleProbeMeasurement}
            />

            {/* Experiment Step-by-Step Procedure Accordion */}
            {currentExp && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                <h4 className="font-bold text-slate-100 text-sm border-r-4 border-purple-500 pr-2">
                  خطوات تنفيذ التجربة العملية:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentExp.steps.map((st, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {idx + 1}
                      </span>
                      <p className="text-slate-300 leading-relaxed">{st}</p>
                    </div>
                  ))}
                </div>

                {/* Theoretical Equations */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="font-bold text-slate-200 block mb-2">المعادلات الحاكمة للتجربة:</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {currentExp.equations.map((eq, i) => (
                      <div key={i} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center space-y-1">
                        <span className="text-[11px] text-purple-300 font-bold block">{eq.name}</span>
                        <code className="text-xs font-mono text-emerald-400 block bg-slate-900 p-1 rounded">{eq.formula}</code>
                        <span className="text-[10px] text-slate-400 block">{eq.explanation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Full Circuit Wizard Laboratory */}
        {activeTab === 'circuit_wizard' && <CircuitWizardLab />}

        {/* Tab: Dedicated Voltmeter & Multimeter Laboratory */}
        {activeTab === 'voltmeter' && <VoltmeterSimulator />}

        {/* Tab: PID Control Systems Lab */}
        {activeTab === 'pid' && <PIDControlLab />}

        {/* Tab 4: Robotics Manipulator Lab */}
        {activeTab === 'robotics' && <RoboticArmLab />}

        {/* Tab 5: Industrial PLC Ladder Lab */}
        {activeTab === 'plc' && <PLCLadderLab />}

        {/* Tab 6: Electro-Pneumatics Lab */}
        {activeTab === 'pneumatics' && <PneumaticsLab />}

        {/* Tab 7: Arduino Uno Microcontroller Lab */}
        {activeTab === 'arduino' && <ArduinoSimulator />}

        {/* Tab 8: Science Engineering Calculations Suite */}
        {activeTab === 'calculators' && <ScienceCalculators />}
      </main>

      {/* AI Lab Advisor Modal */}
      <AILabAdvisorModal
        isOpen={showAIAdvisor}
        onClose={() => setShowAIAdvisor(false)}
        currentExperiment={currentExp}
        universityName={selectedUniv.nameAr}
        academicYear={currentExp ? currentExp.year : 1}
      />

      {/* Official Lab Report Modal */}
      {currentExp && (
        <LabReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          experiment={currentExp}
          university={selectedUniv}
        />
      )}

      {/* Secret 4-Stage Owner Authentication Modal */}
      <OwnerAuthModal
        isOpen={showOwnerAuth}
        onClose={() => setShowOwnerAuth(false)}
        onSuccess={() => {
          setShowOwnerAuth(false);
          setShowOwnerModal(true);
        }}
      />

      {/* Owner Administration Modal */}
      <OwnerAdminModal
        isOpen={showOwnerModal}
        onClose={() => setShowOwnerModal(false)}
        onLessonAdded={(lesson) => {
          setCustomLessons(prev => [lesson, ...prev]);
        }}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-12 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-slate-400">
            المختبر الافتراضي لهندسة الميكاترونكس © 2026 • معتمد لطلاب جامعات صنعاء، عدن، تعز، ذمار، إب، حضرموت، و UST
          </div>
          <div className="font-mono text-slate-500 text-[11px]">
            Virtual Mechatronics Engineering Simulator • SPICE, Control, Robotics & PLC Engine
          </div>
        </div>
      </footer>
    </div>
  );
}

function Code2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
