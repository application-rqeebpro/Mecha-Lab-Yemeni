import React, { useState } from 'react';
import { Bot, Send, Sparkles, X, Loader2, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Experiment } from '../types/mechatronics';

interface AILabAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExperiment?: Experiment | null;
  universityName: string;
  academicYear: number;
}

export const AILabAdvisorModal: React.FC<AILabAdvisorModalProps> = ({
  isOpen,
  onClose,
  currentExperiment,
  universityName,
  academicYear,
}) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: `مرحباً بك يا مهندس في المستشار الأكاديمي الذكي لمختبر هندسة الميكاترونكس والتحكم الآلي والـ PLC لطلاب الجامعات اليمنية بما فيها ${universityName}.\n\nأنا هنا لمساعدتك في فهم الدوائر الكهربائية، وتصميم ومعايرة متحكمات PID، وحل معادلات الكينماتيكا للروبوتات، وبرمجة PLC Ladder Logic، وتصحيح أي أخطاء تظهر معك في التجارب.\n\nبماذا ترغب أن نبدأ اليوم؟`
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const quickQuestions = [
    'كيف أحدد معاملات متحكم PID للتخلص من التجاوز (Overshoot)؟',
    'ما وظيفة أطراف مشغل المحركات L298N وكيف أتحكم بالسرعة والعزم؟',
    'لماذا نحتاج دايود الحماية العكسي Flyback Diode مع المحركات والريليهات؟',
    'اشرح لي الفرق بين تماسات NO و NC في لغة PLC Ladder'
  ];

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input.trim();
    if (!textToSend || isLoading) return;

    const userMsg = { role: 'user' as const, text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-lab-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          currentExperiment,
          university: universityName,
          academicYear
        })
      });

      if (!res.ok) throw new Error('فشل استدعاء المساعد');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `[نصيحة هندسية سريعة بخصوص "${textToSend}"]: تأكد من فحص هبوط الجهد عبر الترانزستور والتحقق من عدم وجود قصر في الدائرة (Short Circuit). عند تشغيل الأحمال الحثية يوصى باستخدام ترانزستور TIP120 أو MOSFET IRFZ44N مع دايود حماية 1N4007 ورسم الاستجابة على راسم الإشارة (Oscilloscope).`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/30">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                مستشار المختبر الأكاديمي الذكي (AI Lab Advisor)
              </h3>
              <span className="text-xs text-purple-400 font-mono">
                {universityName} • {currentExperiment ? currentExperiment.title : 'مختبر الميكاترونكس المتكامل'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Questions Pills */}
        <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 whitespace-nowrap font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            أسئلة شائعة:
          </span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg whitespace-nowrap transition text-[11px]"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs leading-relaxed">
          {messages.map((m, index) => (
            <div
              key={index}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none shadow'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2.5 items-center text-purple-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري تحليل الدائرة الهندسية وإعداد النصيحة...</span>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اكتب استفسارك الهندسي هنا حول الدائرة أو معادلات التحكم..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl transition shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
