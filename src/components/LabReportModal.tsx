import React, { useState } from 'react';
import { FileText, Printer, Download, X, CheckCircle2, Award } from 'lucide-react';
import { Experiment, UniversityInfo } from '../types/mechatronics';

interface LabReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  experiment: Experiment;
  university: UniversityInfo;
}

export const LabReportModal: React.FC<LabReportModalProps> = ({
  isOpen,
  onClose,
  experiment,
  university,
}) => {
  const [studentName, setStudentName] = useState<string>('محمد صالح الأهدل');
  const [studentId, setStudentId] = useState<string>('2024-MTR-108');
  const [labGroup, setLabGroup] = useState<string>('مجموعة A - الفريق 2');
  const [notes, setNotes] = useState<string>('تم تنفيذ التجربة بنجاح ومطابقة قراءات الأوسيلوسكوب مع الحسابات النظرية بنسبة خطأ أقل من 2%.');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                تقرير التجربة الهندسية الرسمي (Official Engineering Lab Report)
              </h3>
              <span className="text-xs text-blue-400 font-mono">
                {university.nameAr} • {university.departmentAr}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Printable Document */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs bg-slate-950 text-slate-200 print:bg-white print:text-black">
          {/* Official University Header */}
          <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>الجمهورية اليمنية</span>
              <span className="font-bold text-slate-300">تقرير معمل هندسة الميكاترونكس</span>
              <span>وزارة التعليم العالي</span>
            </div>
            <h2 className="text-lg font-black text-blue-400 print:text-blue-900">{university.nameAr}</h2>
            <h4 className="text-xs font-semibold text-slate-300">{university.departmentAr}</h4>
            <div className="inline-block bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold mt-2">
              التجربة العملية: {experiment.title} ({experiment.titleEn})
            </div>
          </div>

          {/* Student Info Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 print:border-gray-300">
            <div>
              <span className="text-slate-400 block mb-1">اسم الطالب:</span>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">الرقم الأكاديمي (ID):</span>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">المجموعة المعملية:</span>
              <input
                type="text"
                value={labGroup}
                onChange={(e) => setLabGroup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          {/* Objectives */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-100 text-xs border-r-4 border-blue-500 pr-2">
              1. أهداف التجربة (Objectives):
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pr-2">
              {experiment.objectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </div>

          {/* Scientific Equations */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-100 text-xs border-r-4 border-blue-500 pr-2">
              2. المعادلات الحاكمة (Governing Equations):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {experiment.equations.map((eq, i) => (
                <div key={i} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="font-bold text-blue-300">{eq.name}</div>
                  <div className="font-mono text-emerald-400 bg-slate-950 p-1.5 rounded text-center">{eq.formula}</div>
                  <div className="text-[10px] text-slate-400">{eq.explanation}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Measured Data Table */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-100 text-xs border-r-4 border-blue-500 pr-2">
              3. جدول القراءات والنتائج (Experimental Measurements):
            </h4>
            <table className="w-full text-center font-mono border border-slate-800">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="p-2 border border-slate-800">رقم المحاولة</th>
                  <th className="p-2 border border-slate-800">الجهد المقاس (V)</th>
                  <th className="p-2 border border-slate-800">التيار المقاس (mA)</th>
                  <th className="p-2 border border-slate-800">المقاومة المكافئة</th>
                  <th className="p-2 border border-slate-800">نسبة الخطأ %</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                <tr>
                  <td className="p-1.5 border border-slate-800">1</td>
                  <td className="p-1.5 border border-slate-800">2.0 V</td>
                  <td className="p-1.5 border border-slate-800">6.06 mA</td>
                  <td className="p-1.5 border border-slate-800">330 Ω</td>
                  <td className="p-1.5 border border-slate-800 text-emerald-400">0.8%</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-800">2</td>
                  <td className="p-1.5 border border-slate-800">4.0 V</td>
                  <td className="p-1.5 border border-slate-800">12.12 mA</td>
                  <td className="p-1.5 border border-slate-800">330 Ω</td>
                  <td className="p-1.5 border border-slate-800 text-emerald-400">1.1%</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-800">3</td>
                  <td className="p-1.5 border border-slate-800">6.0 V</td>
                  <td className="p-1.5 border border-slate-800">18.18 mA</td>
                  <td className="p-1.5 border border-slate-800">330 Ω</td>
                  <td className="p-1.5 border border-slate-800 text-emerald-400">0.9%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Student Discussion & Conclusion */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-100 text-xs border-r-4 border-blue-500 pr-2">
              4. المناقشة والاستنتاج (Discussion & Conclusion):
            </h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-20 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 resize-none leading-relaxed"
            />
          </div>

          {/* Academic Signature Block */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800 text-slate-400 text-[11px]">
            <div>
              <div>توقيع الطالب: _______________</div>
              <div>التاريخ: {new Date().toLocaleDateString('ar-YE')}</div>
            </div>
            <div className="text-left">
              <div>توقيع أستاذ المعمل: _______________</div>
              <div>التقييم المستحق: [ 10 / 10 ]</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
