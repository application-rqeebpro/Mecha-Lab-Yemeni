import { getPool, initDatabase } from './_db';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pool = getPool();
  if (!pool) {
    return res.status(200).json({
      dbConnected: false,
      message: 'قاعدة البيانات غير متصلة محلياً (DATABASE_URL غير متوفر)'
    });
  }

  await initDatabase();

  const MASTER_OWNER_PASSWORDS = ['785502919', 'mechatronics2026', 'admin785502919', 'owner@yemen'];

  const checkIsOwner = async (): Promise<boolean> => {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
    const customPass = (req.headers['x-owner-password'] || req.query?.ownerPassword || '').toString().trim();
    const provided = token || customPass;

    if (!provided) return false;
    if (MASTER_OWNER_PASSWORDS.includes(provided)) return true;

    try {
      const q = await pool.query("SELECT value FROM system_settings WHERE key = 'owner_password' LIMIT 1;");
      if (q.rows.length > 0 && q.rows[0].value === provided) {
        return true;
      }
    } catch {}

    return false;
  };

  if (req.method === 'GET') {
    try {
      const queryPhone = String(req.query?.phone || '').trim();

      // If a student is checking only their own phone request
      if (queryPhone) {
        const result = await pool.query(`
          SELECT 
            id, phone, name, university, academic_year AS "academicYear", 
            is_academy_subscriber AS "isAcademySubscriber", status, 
            created_at AS "createdAt", updated_at AS "updatedAt"
          FROM access_requests
          WHERE phone = $1
          ORDER BY created_at DESC
          LIMIT 1;
        `, [queryPhone]);

        // Also check if activated in users table
        const userCheck = await pool.query('SELECT is_activated FROM users WHERE phone = $1 LIMIT 1;', [queryPhone]);
        const isUserActivated = userCheck.rows.length > 0 ? Boolean(userCheck.rows[0].is_activated) : false;

        if (result.rows.length === 0) {
          return res.status(200).json({
            found: false,
            phone: queryPhone,
            isActivated: isUserActivated,
            message: 'لا يوجد طلب معلق لهذا الرقم'
          });
        }

        return res.status(200).json({
          found: true,
          phone: queryPhone,
          request: result.rows[0],
          isActivated: isUserActivated,
          status: isUserActivated ? 'approved' : result.rows[0].status
        });
      }

      // If no phone is provided, this is a request to list ALL student requests
      // Strict security: Only the Owner can read all requests!
      const isOwner = await checkIsOwner();
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'غير مصرح: يجب تسجيل الدخول بحساب المالك لعرض جميع الطلبات'
        });
      }

      const result = await pool.query(`
        SELECT 
          id, phone, name, university, academic_year AS "academicYear", 
          is_academy_subscriber AS "isAcademySubscriber", status, device_info AS "deviceInfo",
          notes, created_at AS "createdAt", updated_at AS "updatedAt"
        FROM access_requests
        ORDER BY created_at DESC
        LIMIT 300;
      `);

      return res.status(200).json({
        dbConnected: true,
        requests: result.rows
      });
    } catch (error: any) {
      console.error('Error fetching access requests:', error);
      return res.status(500).json({
        dbConnected: true,
        error: error?.message || String(error)
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        phone,
        name,
        university,
        academicYear,
        isAcademySubscriber,
        deviceInfo,
        notes
      } = req.body || {};

      const cleanPhone = String(phone || '').trim();
      const cleanName = String(name || '').trim();
      const cleanUniv = String(university || 'جامعة العلوم والتكنولوجيا').trim();

      if (!cleanPhone || cleanPhone.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'رقم الهاتف مطلوب (6 أرقام على الأقل)'
        });
      }

      // Check if there is an existing request for this phone
      const existingReq = await pool.query('SELECT id, status FROM access_requests WHERE phone = $1 LIMIT 1;', [cleanPhone]);
      let requestId: string;

      if (existingReq.rows.length > 0) {
        // Update existing request
        requestId = existingReq.rows[0].id;
        await pool.query(`
          UPDATE access_requests
          SET 
            name = $1,
            university = $2,
            academic_year = $3,
            is_academy_subscriber = $4,
            status = 'pending',
            device_info = $5,
            notes = $6,
            updated_at = NOW()
          WHERE id = $7;
        `, [
          cleanName || `طالب (${cleanPhone.slice(-4)})`,
          cleanUniv,
          academicYear || 1,
          Boolean(isAcademySubscriber),
          deviceInfo || '',
          notes || null,
          requestId
        ]);
      } else {
        // Insert new request
        requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await pool.query(`
          INSERT INTO access_requests (
            id, phone, name, university, academic_year, is_academy_subscriber, status, device_info, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, NOW(), NOW());
        `, [
          requestId,
          cleanPhone,
          cleanName || `طالب (${cleanPhone.slice(-4)})`,
          cleanUniv,
          academicYear || 1,
          Boolean(isAcademySubscriber),
          deviceInfo || '',
          notes || null
        ]);
      }

      return res.status(200).json({
        success: true,
        dbConnected: true,
        requestId,
        message: 'تم إرسال وحفظ طلب الوصول بنجاح في قاعدة بيانات Neon'
      });
    } catch (error: any) {
      console.error('Error creating access request:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || String(error)
      });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
