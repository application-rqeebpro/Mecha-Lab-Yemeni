import type { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, currentExperiment, labState, academicYear, university } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!ai) {
      return res.status(200).json({
        response: `[مستشار المختبر الذكي - ${university || 'الجامعة'}]: بخصوص سؤالك: "${prompt}" في تجربة ${currentExperiment?.title || 'الميكاترونكس'}: تأكد من ربط Flyback Diode بشكل عكسي لحماية الترانزستور، واضبط مجس راسم الإشارة (Oscilloscope) على تدريج مناسب. (ملاحظة: يمكنك ضبط GEMINI_API_KEY لتفعيل الإجابات الذكية عبر الذكاء الاصطناعي).`
      });
    }

    const systemInstruction = `أنت بروفيسور وخبير أكاديمي في هندسة الميكاترونكس بالجامعات اليمنية. ساعد الطالب في فهم التجربة وتحليل الدوائر وتصحيح الأخطاء وتقديم نصائح علمية دقيقة حول (الدوائر الكهربائية، التحكم PID، الروبوتات الصناعية، الأردوينو، وPLC). الجامعة: ${university || 'اليمن'}، السنة الدراسية: ${academicYear || 'عام'}، التجربة الحالية: ${currentExperiment ? JSON.stringify(currentExperiment) : 'مختبر عام'}`;

    const modelResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\nسؤال الطالب:\n${prompt}` }]
        }
      ]
    });

    const reply = modelResponse.text || 'عذراً، لم أتمكن من معالجة الطلب حالياً.';
    return res.status(200).json({ response: reply });
  } catch (error: any) {
    console.error('Error generating AI advice:', error);
    return res.status(500).json({
      error: 'فشل في توليد المشورة الهندسية',
      details: error?.message || String(error)
    });
  }
}
