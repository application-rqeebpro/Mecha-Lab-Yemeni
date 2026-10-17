import { testDatabaseConnection, getDatabaseUrl, initDatabase, getPool, testReadWriteDatabase } from './_db';

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
      // Allows testing a connection string, forcing re-init, or testing real read/write
      const { action } = req.body || {};
      if (action === 'init') {
        const initResult = await initDatabase();
        return res.status(200).json(initResult);
      }
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
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in /api/db-status:', error);
    return res.status(500).json({
      connected: false,
      error: error?.message || String(error)
    });
  }
}
