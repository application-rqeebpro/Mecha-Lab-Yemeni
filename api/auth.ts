import bcrypt from 'bcryptjs';
import { getPool, initDatabase } from './_db';

const MASTER_OWNER_PASSWORDS = ['785502919', 'mechatronics2026', 'admin785502919', 'owner@yemen'];

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

  const action = req.body?.action || req.query?.action || (req.body?.name ? 'register' : 'login');

  // 1. REGISTER
  if (action === 'register') {
    try {
      const {
        name,
        phone,
        password,
        university,
        academicYear,
        isAcademySubscriber,
        deviceInfo
      } = req.body || {};

      const cleanPhone = String(phone || '').trim();
      const cleanName = String(name || '').trim();
      const cleanPassword = String(password || '').trim();
      const cleanUniv = String(university || 'جامعة صنعاء').trim();

      if (!cleanPhone || !cleanName || !cleanPassword) {
        return res.status(400).json({
          success: false,
          message: 'يرجى إكمال جميع الحقول المطلوبة'
        });
      }

      // Check if user already exists
      const existing = await pool.query(
        'SELECT id, phone, name, is_activated FROM users WHERE phone = $1;',
        [cleanPhone]
      );

      const hashedPassword = bcrypt.hashSync(cleanPassword, 10);
      let userId: string;

      if (existing.rows.length > 0) {
        const existingRow = existing.rows[0];
        if (existingRow.is_activated) {
          return res.status(409).json({
            success: false,
            alreadyExists: true,
            isActivated: true,
            message: 'رقم الهاتف مسجل ومفعل مسبقاً! يرجى تسجيل الدخول مباشرة.'
          });
        }

        // If not activated yet, update user record and refresh their pending access request!
        userId = existingRow.id;
        await pool.query(`
          UPDATE users 
          SET 
            name = $1, 
            password = $2, 
            university = $3, 
            academic_year = $4, 
            is_academy_subscriber = $5,
            updated_at = NOW()
          WHERE id = $6;
        `, [
          cleanName,
          hashedPassword,
          cleanUniv,
          academicYear || 1,
          Boolean(isAcademySubscriber),
          userId
        ]);

        // Upsert in access_requests table
        const reqCheck = await pool.query('SELECT id FROM access_requests WHERE phone = $1 LIMIT 1;', [cleanPhone]);
        if (reqCheck.rows.length > 0) {
          await pool.query(`
            UPDATE access_requests
            SET 
              name = $1,
              university = $2,
              academic_year = $3,
              is_academy_subscriber = $4,
              status = 'pending',
              device_info = $5,
              updated_at = NOW()
            WHERE phone = $6;
          `, [
            cleanName,
            cleanUniv,
            academicYear || 1,
            Boolean(isAcademySubscriber),
            deviceInfo || '',
            cleanPhone
          ]);
        } else {
          const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await pool.query(`
            INSERT INTO access_requests (
              id, phone, name, university, academic_year, is_academy_subscriber, status, device_info, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, NOW(), NOW());
          `, [
            reqId,
            cleanPhone,
            cleanName,
            cleanUniv,
            academicYear || 1,
            Boolean(isAcademySubscriber),
            deviceInfo || ''
          ]);
        }

        return res.status(200).json({
          success: true,
          dbConnected: true,
          user: {
            id: userId,
            name: cleanName,
            phone: cleanPhone,
            university: cleanUniv,
            academicYear: academicYear || 1,
            isAcademySubscriber: Boolean(isAcademySubscriber),
            isActivated: false,
            role: 'student',
            registeredAt: new Date().toISOString().split('T')[0]
          },
          requiresActivation: true,
          message: 'تم تحديث بيانات حسابك في قاعدة بيانات Neon وإعادة إرسال طلب التفعيل إلى إدارة المختبر.'
        });
      }

      // Brand new user registration
      userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Insert into users table
      await pool.query(`
        INSERT INTO users (
          id, name, phone, password, university, academic_year, is_academy_subscriber, is_activated, role, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, 'student', NOW(), NOW());
      `, [
        userId,
        cleanName,
        cleanPhone,
        hashedPassword,
        cleanUniv,
        academicYear || 1,
        Boolean(isAcademySubscriber)
      ]);

      // Insert into access_requests table so it appears in Owner Dashboard
      await pool.query(`
        INSERT INTO access_requests (
          id, phone, name, university, academic_year, is_academy_subscriber, status, device_info, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, NOW(), NOW());
      `, [
        reqId,
        cleanPhone,
        cleanName,
        cleanUniv,
        academicYear || 1,
        Boolean(isAcademySubscriber),
        deviceInfo || ''
      ]);

      return res.status(200).json({
        success: true,
        dbConnected: true,
        user: {
          id: userId,
          name: cleanName,
          phone: cleanPhone,
          university: cleanUniv,
          academicYear: academicYear || 1,
          isAcademySubscriber: Boolean(isAcademySubscriber),
          isActivated: false,
          role: 'student',
          registeredAt: new Date().toISOString().split('T')[0]
        },
        requiresActivation: true,
        message: 'تم إنشاء الحساب وحفظه في Neon بنجاح! بانتظار موافقة الإدارة.'
      });
    } catch (error: any) {
      console.error('Error in auth register:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || String(error)
      });
    }
  }

  // 2. LOGIN
  if (action === 'login') {
    try {
      const { phone, password } = req.body || {};
      const cleanPhone = String(phone || '').trim();
      const cleanPassword = String(password || '').trim();

      if (!cleanPhone || !cleanPassword) {
        return res.status(400).json({
          success: false,
          message: 'يرجى إدخال رقم الهاتف وكلمة السر'
        });
      }

      const result = await pool.query(`
        SELECT 
          id, name, phone, password, university, 
          academic_year AS "academicYear", 
          is_academy_subscriber AS "isAcademySubscriber", 
          is_activated AS "isActivated", 
          role, expires_at AS "expiresAt", 
          access_duration AS "accessDuration", 
          created_at AS "createdAt"
        FROM users 
        WHERE phone = $1;
      `, [cleanPhone]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          notFound: true,
          message: 'رقم الهاتف غير مسجل في النظام'
        });
      }

      const userRow = result.rows[0];

      let isPasswordValid = false;
      if (userRow.password && (userRow.password.startsWith('$2a$') || userRow.password.startsWith('$2b$'))) {
        isPasswordValid = bcrypt.compareSync(cleanPassword, userRow.password);
      } else {
        isPasswordValid = userRow.password === cleanPassword;
        if (isPasswordValid) {
          // Silently upgrade to bcrypt in the database
          const upgradedHash = bcrypt.hashSync(cleanPassword, 10);
          pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2;', [upgradedHash, userRow.id]).catch(() => {});
        }
      }

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'كلمة السر غير صحيحة'
        });
      }

      if (!userRow.isActivated) {
        return res.status(403).json({
          success: false,
          notActivated: true,
          user: {
            id: userRow.id,
            name: userRow.name,
            phone: userRow.phone,
            university: userRow.university,
            academicYear: userRow.academicYear,
            isAcademySubscriber: userRow.isAcademySubscriber,
            isActivated: false,
            role: userRow.role
          },
          message: 'الحساب بانتظار التفعيل من قبل المالك عبر واتساب 785502919.'
        });
      }

      // Check expiration
      if (userRow.expiresAt && userRow.expiresAt !== 'unlimited') {
        const expDate = new Date(userRow.expiresAt);
        if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
          return res.status(403).json({
            success: false,
            expired: true,
            message: `انتهت صلاحية وصول الحساب في (${userRow.expiresAt}). يرجى التواصل مع المالك 785502919 لتجديد الاشتراك.`
          });
        }
      }

      return res.status(200).json({
        success: true,
        dbConnected: true,
        user: {
          id: userRow.id,
          name: userRow.name,
          phone: userRow.phone,
          university: userRow.university,
          academicYear: userRow.academicYear,
          isAcademySubscriber: userRow.isAcademySubscriber,
          isActivated: true,
          role: userRow.role,
          expiresAt: userRow.expiresAt,
          accessDuration: userRow.accessDuration,
          registeredAt: userRow.createdAt ? new Date(userRow.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        },
        message: 'تم تسجيل الدخول بنجاح'
      });
    } catch (error: any) {
      console.error('Error in auth login:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || String(error)
      });
    }
  }

  // 3. OWNER LOGIN
  if (action === 'owner-login') {
    try {
      const { password } = req.body || {};
      const cleanPass = String(password || '').trim();

      // Check DB system_settings for custom owner password
      let dbOwnerPass = '785502919';
      try {
        const resSettings = await pool.query("SELECT value FROM system_settings WHERE key = 'owner_password';");
        if (resSettings.rows.length > 0) {
          dbOwnerPass = resSettings.rows[0].value;
        }
      } catch (e) {
        console.warn('Could not read owner_password from system_settings:', e);
      }

      const isValid = cleanPass === dbOwnerPass || MASTER_OWNER_PASSWORDS.includes(cleanPass);

      if (isValid) {
        return res.status(200).json({
          success: true,
          dbConnected: true,
          user: {
            id: 'owner_master',
            name: 'إدارة المنصة (Owner)',
            phone: '785502919',
            university: 'المقر الرئيسي',
            isAcademySubscriber: true,
            isActivated: true,
            registeredAt: '2026-01-01',
            role: 'owner'
          },
          message: 'تم التحقق من صلاحية المالك بنجاح'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'رمز الدخول الخاص بالمالك غير صحيح'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error?.message || String(error)
      });
    }
  }

  return res.status(400).json({ error: 'Invalid action requested' });
}
