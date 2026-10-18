import React, { useState } from 'react';
import { 
  KeyRound, 
  MessageCircle, 
  PhoneCall, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  Sparkles, 
  ArrowLeft,
  ShieldCheck,
  Send
} from 'lucide-react';
import { StudentUser } from '../types/mechatronics';
import { authStorage } from '../services/authStorage';
import { normalizePhone } from '../utils/phoneUtils';

interface EnterCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: StudentUser) => void;
  defaultPhone?: string;
  studentName?: string;
}

export const EnterCodeModal: React.FC<EnterCodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultPhone = '',
  studentName = ''
}) => {
  const [phone, setPhone] = useState<string>(defaultPhone);
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);

  // Sync phone when defaultPhone changes
  React.useEffect(() => {
    if (defaultPhone) {
      setPhone(defaultPhone);
    }
  }, [defaultPhone]);

  if (!isOpen) return null;

  const currentPhone = phone || defaultPhone;
  const cleanPhone = normalizePhone(currentPhone) || currentPhone;

  const whatsappMessage = encodeURIComponent(
    `السلام عليكم، قمت بإنشاء حساب في المختبر الافتراضي لهندسة الميكاترونكس ${studentName ? `باسم (${studentName}) ` : ''}برقم الهاتف (${cleanPhone || 'المسجل'})، وأرجو إرسال كود الدخول للمعمل.`
  );
  const whatsappUrl = `https://wa.me/967785502919?text=${whatsappMessage}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanCode = code.trim();
    if (!cleanCode) {
      setFeedback({
        type: 'error',
        message: 'يرجى إدخال كود الدخول للمعمل'
      });
      return;
    }

    if (!cleanPhone) {
      setFeedback({
        type: 'error',
        message: 'يرجى إدخال رقم هاتفك المسجل للتحقق من الكود'
      });
      return;
    }

    setLoading(true);

    try {
      const res = await authStorage.verifyCodeAsync(cleanPhone, cleanCode);

      if (res.success && res.user) {
        setFeedback({
          type: 'success',
          message: res.message || 'تم التحقق من الكود بنجاح! جاري توجيهك إلى المعمل الافتراضي...'
        });
        setTimeout(() => {
          onSuccess(res.user!);
          onClose();
        }, 800);
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'كود الدخول غير صحيح! للحصول على الكود أرسل رسالة إلى الرقم 785502919'
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'حدث خطأ في الاتصال. يرجى التأكد من اتصالك بالإنترنت وإعادة المحاولة.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      dir="rtl"
    >
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-950/50 overflow-hidden">
        {/* Glow Header */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 via-emerald-400 to-indigo-500" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Header Icon & Title */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-purple-950/60 flex items-center justify-center animate-bounce-subtle">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-purple-300">
                <KeyRound className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            
            <h3 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span>أدخل الكود للدخول للمعمل</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed px-2">
              لإكمال تفعيل وصولك إلى المعمل الافتراضي لهندسة الميكاترونكس
            </p>
          </div>

          {/* Action Notice: Send message to 785502919 to get the code */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-purple-950/30 to-slate-900 border border-emerald-500/40 rounded-2xl space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-300">
                  للحصول على الكود أرسل رسالة إلى الرقم 785502919 لإرسال الكود:
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  تواصل مع إدارة المنصة مباشرة ليتم تزويدك بكود التفعيل السريع فورياً عبر رسالة أو واتساب.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-emerald-950/50"
              >
                <MessageCircle className="w-4 h-4" />
                <span>طلب الكود عبر واتساب</span>
              </a>

              <a
                href="tel:+967785502919"
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>اتصال: 785502919</span>
              </a>
            </div>
          </div>

          {/* Feedback messages */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                feedback.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed font-medium">{feedback.message}</span>
            </div>
          )}

          {/* Code Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رقم هاتفك المسجل <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 771234567"
                className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition font-sans text-center"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>كود الدخول للمعمل <span className="text-rose-400">*</span></span>
                <span className="text-[10px] text-emerald-400 font-normal">
                  أدخل الكود المستلم من 785502919
                </span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="أدخل الكود هنا (مثال: M24U4C أو 785502919)"
                  className="w-full bg-slate-950 border-2 border-purple-500/60 focus:border-emerald-400 rounded-xl pr-10 pl-4 py-3 text-base text-white text-center font-mono font-bold tracking-widest placeholder-slate-600 focus:outline-none transition shadow-inner uppercase"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-purple-950/50 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ التحقق وتفعيل الدخول...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>تأكيد الكود ودخول المعمل</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Help Footer */}
          <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
            <span>تحتاج مساعدة؟ تواصل مع المالك:</span>
            <a
              href="tel:785502919"
              className="text-emerald-400 hover:underline font-mono font-bold"
            >
              785502919
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
