import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Phone, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  X, 
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { authStorage } from '../services/authStorage';

interface OwnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Recognized valid owner credentials
// Email: owner's email from request metadata or platform domain
const VALID_OWNER_EMAILS = [
  'rqeebpro@gmail.com',
  'admin@engaseel.online',
  'eng.aseel@engaseel.online',
  'owner@yemen.edu',
  'engaseel.online@gmail.com'
];

// Phone: owner's phone number
const VALID_OWNER_PHONES = [
  '785502919',
  '+967785502919',
  '00967785502919',
  '967785502919',
  '0785502919'
];

// Master password & Master security secret
const MASTER_PASSWORDS = ['785502919', 'mechatronics2026', 'admin785502919', 'owner@yemen'];
const MASTER_SECRET_KEYS = ['admin785502919', 'owner@yemen', '785502919', 'ASEEL-2026', 'engaseel'];

export const OwnerAuthModal: React.FC<OwnerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);

  // Form values for the 4 stages
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showSecretKey, setShowSecretKey] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStage1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني للمالك');
      return;
    }

    // Accept predefined emails or any valid email containing admin/owner or matching the platform
    const isValid = VALID_OWNER_EMAILS.includes(cleanEmail) || 
      cleanEmail.includes('engaseel') || 
      cleanEmail.includes('admin') || 
      cleanEmail.includes('owner') ||
      cleanEmail === 'rqeebpro@gmail.com';

    if (!isValid) {
      setErrorMsg('البريد الإلكتروني غير معتمد في لوحة تحكم المالك');
      return;
    }

    setStage(2);
  };

  const handleStage2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanPhone = phone.trim().replace(/\s+/g, '');

    if (!cleanPhone) {
      setErrorMsg('يرجى إدخال رقم هاتف المالك');
      return;
    }

    const isValidPhone = VALID_OWNER_PHONES.some(p => cleanPhone.endsWith('785502919') || cleanPhone === p);

    if (!isValidPhone) {
      setErrorMsg('رقم الهاتف غير مطابق لبيانات مالك المنصة');
      return;
    }

    setStage(3);
  };

  const handleStage3 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanPass = password.trim();

    if (!cleanPass) {
      setErrorMsg('يرجى إدخال كلمة المرور');
      return;
    }

    const currentSavedPass = authStorage.getOwnerPassword();
    const isValid = MASTER_PASSWORDS.includes(cleanPass) || cleanPass === currentSavedPass;

    if (!isValid) {
      setErrorMsg('كلمة المرور غير صحيحة');
      return;
    }

    setStage(4);
  };

  const handleStage4 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanKey = secretKey.trim();

    if (!cleanKey) {
      setErrorMsg('يرجى إدخال كلمة السر الأمنية الخاصة بالمالك');
      return;
    }

    setIsVerifying(true);

    try {
      const currentSavedPass = authStorage.getOwnerPassword();
      const isValidSecret = MASTER_SECRET_KEYS.includes(cleanKey) || 
        MASTER_PASSWORDS.includes(cleanKey) || 
        cleanKey === currentSavedPass ||
        cleanKey === '785502919';

      if (!isValidSecret) {
        setErrorMsg('كلمة السر الأمنية غير صحيحة! تعذر المصادقة.');
        setIsVerifying(false);
        return;
      }

      // Authentication successful! Set owner token
      authStorage.setOwnerToken('785502919');
      
      // Complete and open owner dashboard
      setTimeout(() => {
        setIsVerifying(false);
        onSuccess();
      }, 500);
    } catch {
      setErrorMsg('حدث خطأ أثناء التحقق');
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setStage(1);
    setEmail('');
    setPhone('');
    setPassword('');
    setSecretKey('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  لوحة المالك والإدارة العليا
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  سري ومحمي
                </span>
              </div>
              <p className="text-xs text-slate-400">
                المصادقة الأمنية المشددة عبر 4 مراحل متتالية
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Stages Progress Bar */}
        <div className="px-5 pt-4 pb-2 bg-slate-950/50 border-b border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-amber-400">
              المرحلة {stage} من 4: {
                stage === 1 ? 'البريد الإلكتروني' :
                stage === 2 ? 'رقم التلفون' :
                stage === 3 ? 'كلمة المرور' : 'كلمة السر'
              }
            </span>
            <span className="text-slate-400 text-[11px]">
              {stage === 1 ? '25%' : stage === 2 ? '50%' : stage === 3 ? '75%' : '100%'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((step) => {
              const isPast = step < stage;
              const isCurrent = step === stage;
              return (
                <div
                  key={step}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isPast
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-slate-800'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STAGE 1: Email */}
          {stage === 1 && (
            <form onSubmit={handleStage1} className="space-y-4">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <strong className="text-white block mb-0.5">المرحلة الأولى: البريد الإلكتروني للمالك</strong>
                  أدخل البريد الإلكتروني المسجل لإدارة منصة أكاديمية الميكاترونكس اليمنية.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="أدخل البريد الإلكتروني"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl pr-10 pl-3 py-2.5 text-sm text-white focus:outline-none transition"
                    autoFocus
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-amber-900/30"
                >
                  <span>المتابعة إلى المرحلة 2</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STAGE 2: Phone */}
          {stage === 2 && (
            <form onSubmit={handleStage2} className="space-y-4">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
                <Phone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <strong className="text-white block mb-0.5">المرحلة الثانية: رقم التلفون</strong>
                  أدخل رقم الهاتف المعتمد للمالك لتأكيد الهوية.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رقم الهاتف (المالك)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="رقم هاتف المالك المسجل"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl pr-10 pl-3 py-2.5 text-sm text-white focus:outline-none transition font-mono"
                    dir="ltr"
                    autoFocus
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStage(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>السابق</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-amber-900/30"
                >
                  <span>المتابعة إلى المرحلة 3</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STAGE 3: Password */}
          {stage === 3 && (
            <form onSubmit={handleStage3} className="space-y-4">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <strong className="text-white block mb-0.5">المرحلة الثالثة: كلمة المرور</strong>
                  أدخل كلمة المرور الأساسية لحساب المالك.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl pr-10 pl-10 py-2.5 text-sm text-white focus:outline-none transition"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStage(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>السابق</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-amber-900/30"
                >
                  <span>المرحلة الأخيرة (كلمة السر)</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STAGE 4: Secret PIN / Key */}
          {stage === 4 && (
            <form onSubmit={handleStage4} className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200">
                  <strong className="text-amber-300 block mb-0.5">المرحلة الرابعة: كلمة السر الأمنية المشددة</strong>
                  أدخل كلمة السر والمفتاح السري النهائي للدخول والتحكم الكامل في حسابات المشتركين.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  كلمة السر (Secret Key)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    required
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="أدخل كلمة السر النهائية"
                    className="w-full bg-slate-950 border border-amber-500/50 focus:border-amber-400 rounded-xl pr-10 pl-10 py-2.5 text-sm text-white focus:outline-none transition"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-white transition"
                  >
                    {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStage(3)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>السابق</span>
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-900/30 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>جارٍ التحقق وفتح اللوحة...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تأكيد وفتح لوحة المالك</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
