import { 
  testDatabaseConnection, 
  getDatabaseUrl, 
  initDatabase, 
  getPool, 
  testReadWriteDatabase,
  setCustomDatabaseUrl,
  memoryStore 
} from './_db';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const { action, databaseUrl } = req.body || {};

      // 1. Set / Update database URL dynamically from Owner UI
      if (action === 'set-url') {
        const cleanUrl = String(databaseUrl || '').trim();
        if (cleanUrl) {
          setCustomDatabaseUrl(cleanUrl);
          const testRes = await testDatabaseConnection();
          return res.status(200).json({
            success: testRes.connected,
            message: testRes.connected 
              ? `تم حفظ وتوصيل قاعدة بيانات Neon بنجاح!` 
              : `تم حفظ الرابط ولكن تعذر الاتصال: ${testRes.message || ''}`,
            status: testRes
          });
        } else {
          setCustomDatabaseUrl(null);
          return res.status(200).json({
            success: true,
            message: 'تمت إزالة رابط قاعدة البيانات المخصص والعودة للبيئة الافتراضية'
          });
        }
      }

      // 2. Force init database schema
      if (action === 'init') {
        const initResult = await initDatabase();
        return res.status(200).json(initResult);
      }

      // 3. Test real read/write
      if (action === 'test-rw') {
        const rwResult = await testReadWriteDatabase();
        return res.status(200).json(rwResult);
      }
    }

    const status = await testDatabaseConnection();
    const dbUrl = getDatabaseUrl();
    let maskedUrl = 'غير متوفر';
    if (dbUrl) {
      try {
        const urlObj = new URL(dbUrl);
        maskedUrl = `${urlObj.protocol}//${urlObj.username ? '***:' : ''}***@${urlObj.host}${urlObj.pathname}`;
      } catch {
        maskedUrl = dbUrl.substring(0, 15) + '...';
      }
    }

    return res.status(200).json({
      ...status,
      maskedDatabaseUrl: maskedUrl,
      timestamp: new Date().toISOString(),
      fallbackStore: {
        usersCount: memoryStore.users.length,
        requestsCount: memoryStore.requests.length,
        pendingCount: memoryStore.requests.filter(r => r.status === 'pending').length
      }
    });
  } catch (error: any) {
    console.error('Error in /api/db-status:', error);
    return res.status(200).json({
      connected: false,
      hasDatabaseUrl: Boolean(getDatabaseUrl()),
      error: error?.message || String(error),
      message: `خطأ أثناء فحص قاعدة البيانات: ${error?.message || String(error)}`
    });
  }
}
