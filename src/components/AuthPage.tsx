import React, { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Phone, 
  Lock, 
  User, 
  GraduationCap, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Loader2, 
  Check, 
  Send,
  MessageCircle,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { StudentUser, AcademicYear } from '../types/mechatronics';
import { authStorage } from '../services/authStorage';
import { YEMENI_UNIVERSITIES } from '../data/curriculumData';
import { AppLogoSecretTrigger } from './AppLogoSecretTrigger';

interface AuthPageProps {
  onLoginSuccess: (user: StudentUser) => void;
  onTriggerOwner: () => void;
}

const SPECIALIZATIONS = [
  'هندسة الميكاترونكس (Mechatronics Engineering)',
  'هندسة التحكم والأتمتة الصناعية (Control & Automation)',
  'هندسة الروبوتات والأنظمة الذكية (Robotics Systems)',
  'هندسة الإلكترونيات والاتصالات (Electronics & Telecom)',
  'هندسة الكهرباء والقوى (Electrical & Power)',
  'هندسة الحاسوب والأنظمة المدمجة (Computer & Embedded)',
  'هندسة ميكانيكية عامة (Mechanical Engineering)',
  'تخصص هندسي آخر (Other Engineering)'
];

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  onTriggerOwner
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginPhone, setLoginPhone] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginFeedback, setLoginFeedback] = useState<{
    type: 'error' | 'warning' | 'success';
    message: string;
    notActivated?: boolean;
    user?: StudentUser;
  } | null>(null);

  // Registration Form States
  const [regName, setRegName] = useState<string>('');
  const [regPhoneOrEmail, setRegPhoneOrEmail] = useState<string>('');
  const [regUniversity, setRegUniversity] = useState<string>(YEMENI_UNIVERSITIES[0].nameAr);
  const [regCustomUniv, setRegCustomUniv] = useState<string>('');
  const [regSpecialization, setRegSpecialization] = useState<string>(SPECIALIZATIONS[0]);
  const [regCustomSpec, setRegCustomSpec] = useState<string>('');
  const [regAcademicYear, setRegAcademicYear] = useState<AcademicYear>(1);
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  // Mandatory Question: Are you subscribed to engaseel.online?
  const [isAcademySubscriber, setIsAcademySubscriber] = useState<boolean | null>(null);

  const [regLoading, setRegLoading] = useState<boolean>(false);
  const [regFeedback, setRegFeedback] = useState<{
    type: 'error' | 'warning' | 'success';
    message: string;
    requiresActivation?: boolean;
    registeredPhone?: string;
  } | null>(null);

  // 1. Handle Student Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginFeedback(null);
    const cleanPhone = loginPhone.trim();
    const cleanPass = loginPassword.trim();

    if (!cleanPhone || !cleanPass) {
      setLoginFeedback({
        type: 'error',
        message: 'يرجى إدخال رقم الهاتف أو البريد وكلمة السر'
      });
      return;
    }

    setLoginLoading(true);

    try {
      const res = await authStorage.loginUserAsync(cleanPhone, cleanPass);

      if (res.success && res.user) {
        setLoginFeedback({
          type: 'success',
          message: 'تم تسجيل الدخول بنجاح! جاري تحويلك إلى المعمل الافتراضي...'
        });
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 600);
      } else if (res.notActivated) {
        setLoginFeedback({
          type: 'warning',
          message: res.message || 'حسابك مسجل ولكنه بانتظار تفعيل المالك. يمكنك مراسلة المالك لتسريع التفعيل.',
          notActivated: true,
          user: res.user
        });
      } else {
        setLoginFeedback({
          type: 'error',
          message: res.message || 'بيانات الدخول غير صحيحة. يرجى التحقق وإعادة المحاولة.'
        });
      }
    } catch {
      setLoginFeedback({
        type: 'error',
        message: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.'
      });
    } finally {
      setLoginLoading(false);
    }
  };

  // 2. Handle Student Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegFeedback(null);

    // Validation
    const cleanName = regName.trim();
    const cleanPhone = regPhoneOrEmail.trim();
    const cleanPass = regPassword.trim();
    const cleanConfirm = regConfirmPassword.trim();
    const selectedUniv = regUniversity === 'other' ? regCustomUniv.trim() : regUniversity;
    const selectedSpec = regSpecialization.includes('Other') ? regCustomSpec.trim() : regSpecialization;

    if (!cleanName || !cleanPhone || !cleanPass || !cleanConfirm) {
      setRegFeedback({
        type: 'error',
        message: 'يرجى ملء جميع الحقول المطلوبة'
      });
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setRegFeedback({
        type: 'error',
        message: 'كلمتا السر غير متطابقتين! يرجى التأكد من تطابق كلمة السر وتأكيدها.'
      });
      return;
    }

    if (cleanPass.length < 4) {
      setRegFeedback({
        type: 'error',
        message: 'كلمة السر يجب أن تكون من 4 خانات على الأقل'
      });
      return;
    }

    // Crucial condition: Must be an academy subscriber to create account!
    if (isAcademySubscriber !== true) {
      setRegFeedback({
        type: 'error',
        message: 'لا يمكنك إنشاء الحساب إلا إذا كنت مشتركاً في منصة أكاديمية الميكاترونكس اليمنية engaseel.online'
      });
      return;
    }

    setRegLoading(true);

    try {
      const res = await authStorage.registerUserAsync({
        name: cleanName,
        phone: cleanPhone,
        password: cleanPass,
        university: selectedUniv || 'جامعة صنعاء',
        academicYear: regAcademicYear,
        isAcademySubscriber: true
      });

      if (res.success) {
        setRegFeedback({
          type: 'success',
          requiresActivation: true,
          registeredPhone: cleanPhone,
          message: res.message || 'تم إرسال طلب الاشتراك وتفعيل الحساب بنجاح! بانتظار موافقة مالك المختبر.'
        });
      } else {
        setRegFeedback({
          type: 'error',
          message: res.message || 'حدث خطأ أثناء إرسال طلب الاشتراك'
        });
      }
    } catch {
      setRegFeedback({
        type: 'error',
        message: 'تعذر إرسال الطلب. يرجى التحقق من الاتصال بالشبكة.'
      });
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white relative overflow-hidden" dir="rtl">
      {/* Background Decorative Grids & Glows */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Brand & Secret Owner Trigger */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* The Logo with 20-second secret hold trigger */}
            <AppLogoSecretTrigger onTrigger={onTriggerOwner} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                  المختبر الافتراضي لهندسة الميكاترونكس
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  الجامعات اليمنية
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Virtual Mechatronics Engineering Laboratory • منصة المحاكاة الهندسية التفاعلية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://engaseel.online"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="أكاديمية الميكاترونكس اليمنية"
            >
              <span>أكاديمية engaseel.online</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Tab Navigation */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-950/70 border-b border-slate-800">
            <button
              onClick={() => {
                setActiveTab('login');
                setLoginFeedback(null);
              }}
              className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول إلى المعمل</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('register');
                setRegFeedback(null);
              }}
              className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>إنشاء حساب وطلب اشتراك</span>
            </button>
          </div>

          <div className="p-5 sm:p-8">
            {/* ======================================================== */}
            {/* TAB 1: STUDENT LOGIN                                     */}
            {/* ======================================================== */}
            {activeTab === 'login' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    تسجيل دخول الطالب
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    أدخل رقم هاتفك أو بريدك وكلمة السر المسجلة للدخول الفوري إلى المعمل الافتراضي
                  </p>
                </div>

                {loginFeedback && (
                  <div
                    className={`p-4 rounded-2xl border text-xs sm:text-sm flex flex-col gap-2 ${
                      loginFeedback.type === 'error'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : loginFeedback.type === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {loginFeedback.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                      {loginFeedback.type === 'warning' && <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                      {loginFeedback.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                      <span className="font-medium leading-relaxed">{loginFeedback.message}</span>
                    </div>

                    {loginFeedback.notActivated && (
                      <div className="mt-2 pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-amber-300/80">
                          هاتف مالك المختبر لتسريع التفعيل: 785502919
                        </span>
                        <a
                          href={`https://wa.me/967785502919?text=${encodeURIComponent(
                            `السلام عليكم، قمت بالتسجيل في المختبر الافتراضي لهندسة الميكاترونكس برقمي (${loginPhone}) وأرجو تفعيل حسابي.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>إشعار المالك عبر واتساب</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      رقم الهاتف أو البريد الإلكتروني
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="مثال: 771234567 أو البريد"
                        className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl pr-10 pl-4 py-3 text-sm text-white focus:outline-none transition font-sans"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      كلمة السر
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl pr-10 pl-10 py-3 text-sm text-white focus:outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute left-3 top-3.5 text-slate-400 hover:text-white transition"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-purple-950/40 disabled:opacity-60 cursor-pointer"
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جارٍ التحقق والدخول...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>دخول المعمل الافتراضي</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <span>ليس لديك حساب بعد؟</span>
                  <button
                    onClick={() => {
                      setActiveTab('register');
                      setRegFeedback(null);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4 transition"
                  >
                    أنشئ حساباً وأرسل طلب تفعيل الآن
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: STUDENT REGISTRATION                              */}
            {/* ======================================================== */}
            {activeTab === 'register' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    إنشاء حساب طالب وإرسال طلب اشتراك
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    سجل بياناتك الجامعية لإرسال طلب الاشتراك وتفعيل حسابك في المختبر الافتراضي
                  </p>
                </div>

                {regFeedback && (
                  <div
                    className={`p-4 rounded-2xl border text-xs sm:text-sm flex flex-col gap-2 ${
                      regFeedback.type === 'error'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : regFeedback.type === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {regFeedback.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                      {regFeedback.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                      <span className="font-medium leading-relaxed">{regFeedback.message}</span>
                    </div>

                    {regFeedback.requiresActivation && (
                      <div className="mt-2 pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-emerald-300/80">
                          تم إرسال الطلب إلى لوحة المالك (هاتف: 785502919).
                        </span>
                        <a
                          href={`https://wa.me/967785502919?text=${encodeURIComponent(
                            `السلام عليكم، قمت بالتسجيل في المختبر الافتراضي برقمي (${regFeedback.registeredPhone || regPhoneOrEmail})، وأنا مشترك في أكاديمية engaseel.online، وأرجو تفعيل حسابي.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>إشعار المالك عبر واتساب لتسريع التفعيل</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* 1. Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      الاسم الكامل للطالب <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="مثال: محمد أحمد علي الذماري"
                        className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* 2. Phone or Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      رقم الهاتف أو البريد الإلكتروني <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={regPhoneOrEmail}
                        onChange={(e) => setRegPhoneOrEmail(e.target.value)}
                        placeholder="مثال: 771234567 أو student@university.edu"
                        className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white focus:outline-none transition"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* 3. University & Specialization in two columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* University */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        اسم الجامعة <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                        <select
                          value={regUniversity}
                          onChange={(e) => setRegUniversity(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white focus:outline-none transition cursor-pointer"
                        >
                          {YEMENI_UNIVERSITIES.map(u => (
                            <option key={u.id} value={u.nameAr} className="bg-slate-900 text-white">
                              {u.nameAr} ({u.city})
                            </option>
                          ))}
                          <option value="other" className="bg-slate-900 text-white">جامعة أخرى / كلية خاصة</option>
                        </select>
                      </div>
                      {regUniversity === 'other' && (
                        <input
                          type="text"
                          required
                          value={regCustomUniv}
                          onChange={(e) => setRegCustomUniv(e.target.value)}
                          placeholder="اكتب اسم جامعتك أو كليتك"
                          className="mt-2 w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      )}
                    </div>

                    {/* Specialization */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        التخصص الهندسي <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <GraduationCap className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                        <select
                          value={regSpecialization}
                          onChange={(e) => setRegSpecialization(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white focus:outline-none transition cursor-pointer"
                        >
                          {SPECIALIZATIONS.map(s => (
                            <option key={s} value={s} className="bg-slate-900 text-white">
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      {regSpecialization.includes('Other') && (
                        <input
                          type="text"
                          required
                          value={regCustomSpec}
                          onChange={(e) => setRegCustomSpec(e.target.value)}
                          placeholder="اكتب تخصصك الدقيق"
                          className="mt-2 w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      )}
                    </div>
                  </div>

                  {/* Academic Year Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      السنة الدراسية
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {([1, 2, 3, 4, 5] as AcademicYear[]).map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setRegAcademicYear(yr)}
                          className={`py-2 rounded-xl text-xs font-bold transition border ${
                            regAcademicYear === yr
                              ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          السنة {yr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        كلمة السر <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pr-10 pl-9 py-2.5 text-sm text-white focus:outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute left-3 top-3 text-slate-400 hover:text-white transition"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        تأكيد كلمة السر <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full bg-slate-950 border rounded-xl pr-10 pl-4 py-2.5 text-sm text-white focus:outline-none transition ${
                            regConfirmPassword && regPassword !== regConfirmPassword
                              ? 'border-rose-500/70'
                              : 'border-slate-700 focus:border-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* MANDATORY QUESTION: engaseel.online subscription check   */}
                  {/* ======================================================== */}
                  <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          سؤال التحقق الإلزامي:
                        </h4>
                        <p className="text-xs text-purple-200 mt-0.5">
                          هل أنت مشترك في منصة أكاديمية الميكاترونكس اليمنية{' '}
                          <a
                            href="https://engaseel.online"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold underline text-purple-300 hover:text-white"
                          >
                            engaseel.online
                          </a>
                          ؟ <span className="text-rose-400">*</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAcademySubscriber(true);
                          setRegFeedback(null);
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition ${
                          isAcademySubscriber === true
                            ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/40'
                            : 'bg-slate-950/80 border-slate-700 text-slate-300 hover:border-emerald-500/50'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>نعم، أنا مشترك في المنصة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAcademySubscriber(false);
                          setRegFeedback(null);
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition ${
                          isAcademySubscriber === false
                            ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-950/40'
                            : 'bg-slate-950/80 border-slate-700 text-slate-300 hover:border-rose-500/50'
                        }`}
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>لا، لست مشتركاً بعد</span>
                      </button>
                    </div>

                    {/* Condition A: IF NO -> Cannot create account & Must visit engaseel.online */}
                    {isAcademySubscriber === false && (
                      <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-200 space-y-2.5 animate-fadeIn">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div className="leading-relaxed font-semibold">
                            عذراً! لا يمكن إنشاء الحساب أو الدخول للمختبر الافتراضي إلا لمنتسبي ومشتركي أكاديمية الميكاترونكس اليمنية (engaseel.online).
                          </div>
                        </div>
                        <p className="text-[11px] text-rose-300/90">
                          يرجى التوجه إلى المنصة والاشتراك أولاً، ثم العودة لتفعيل وصولك للمعمل الافتراضي.
                        </p>
                        <a
                          href="https://engaseel.online"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-purple-950/30"
                        >
                          <span>الانتقال إلى الأكاديمية للاشتراك الآن (engaseel.online)</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    {/* Condition B: IF YES -> Can submit subscription request */}
                    {isAcademySubscriber === true && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>رائع! يمكنك الآن إرسال طلب الاشتراك وتفعيل الحساب وسيقوم المالك بتفعيله فوراً.</span>
                      </div>
                    )}
                  </div>

                  {/* Submission Button */}
                  {isAcademySubscriber === true ? (
                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/40 disabled:opacity-60 cursor-pointer"
                    >
                      {regLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جارٍ إرسال طلب الاشتراك...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>إرسال طلب الاشتراك وتفعيل الحساب</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-semibold">
                      يرجى الإجابة بـ «نعم» على سؤال الاشتراك في أكاديمية engaseel.online لتفعيل زر إرسال الطلب
                    </div>
                  )}
                </form>

                <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <span>لديك حساب مفعل بالفعل؟</span>
                  <button
                    onClick={() => {
                      setActiveTab('login');
                      setLoginFeedback(null);
                    }}
                    className="text-purple-400 hover:text-purple-300 font-bold underline underline-offset-4 transition"
                  >
                    تسجيل الدخول برقم هاتفك وكلمة السر
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="py-3 px-4 border-t border-slate-800/60 bg-slate-950/60 text-center text-[11px] text-slate-500">
        المختبر الافتراضي لهندسة الميكاترونكس • الجامعات اليمنية • برعاية أكاديمية الميكاترونكس اليمنية engaseel.online
      </footer>
    </div>
  );
};
