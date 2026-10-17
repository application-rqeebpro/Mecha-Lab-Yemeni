import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import dbStatusHandler from './api/db-status';
import requestsHandler from './api/requests';
import authHandler from './api/auth';
import ownerHandler from './api/owner';
import { initDatabase, getDatabaseUrl } from './lib/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Neon PostgreSQL database endpoints
app.all('/api/db-status', (req: Request, res: Response) => dbStatusHandler(req, res));
app.all('/api/requests', (req: Request, res: Response) => requestsHandler(req, res));
app.all('/api/auth', (req: Request, res: Response) => authHandler(req, res));
app.all('/api/owner', (req: Request, res: Response) => ownerHandler(req, res));

// Initialize Google GenAI if key is present
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// AI Mechatronics Lab Assistant endpoint
app.post('/api/ai-lab-assistant', async (req: Request, res: Response) => {
  try {
    const { prompt, currentExperiment, labState, academicYear, university } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!ai) {
      // Provide an intelligent context-aware local response if API key is not yet configured
      return res.json({
        response: `[مستشار المختبر الذكي - ${university || 'الجامعة'}]: بخصوص استفسارك: "${prompt}" في تجربة ${currentExperiment?.title || 'المختبر'}: تأكد من ربط Flyback Diode ومراجعة قياسات راسم الإشارة (Oscilloscope) وجهد التغذية. (ملاحظة: يمكنك إدخال GEMINI_API_KEY للحصول على شروحات مدعومة بالذكاء الاصطناعي).`
      });
    }

    const systemInstruction = `أنت خبير وبروفيسور هندسة الميكاترونكس بالجامعات اليمنية. ساعد الطالب في فهم التجربة وتحليل الدوائر وتصحيح الأخطاء (دوائر كهربائية، تحكم PID، روبوتات، PLC). قدم إجابة هندسية موجزة ودقيقة باللغة العربية مع المعادلات الرياضية والمصطلحات الإنجليزية بين قوسين (مثل PWM, Flyback Diode, Kinematics, Step Response, Ladder Logic). الجامعة: ${university || 'اليمن'}، السنة: ${academicYear || 'عام'}، التجربة: ${currentExperiment ? JSON.stringify(currentExperiment) : 'مختبر عام'}`;

    const modelResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\nسؤال الطالب:\n${prompt}` }]
        }
      ]
    });

    const reply = modelResponse.text || 'عذراً، لم أستطع الإجابة حالياً.';
    res.json({ response: reply });
  } catch (error: any) {
    console.error('Error generating AI advice:', error);
    res.status(500).json({
      error: 'فشل في توليد النصيحة الهندسية',
      details: error?.message || String(error)
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mechatronics Virtual Lab server running on http://0.0.0.0:${PORT}`);
    if (getDatabaseUrl()) {
      initDatabase()
        .then((res) => console.log('  Neon Database status:', res.message))
        .catch((err) => console.error('  Neon Database init error:', err));
    } else {
      console.log('  DATABASE_URL not set in local environment (will connect automatically when deployed on Vercel)');
    }
  });
}

startServer();
