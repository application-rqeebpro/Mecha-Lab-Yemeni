import bcrypt from 'bcryptjs';
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
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
  const customPass = (req.headers['x-owner-password'] || req.query?.ownerPassword || req.body?.ownerPassword || '').toString().trim();
  const provided = token || customPass;

  let isAuthorized = false;
  if (provided) {
    if (MASTER_OWNER_PASSWORDS.includes(provided)) {
      isAuthorized = true;
    } else {
      try {
        const q = await pool.query("SELECT value FROM system_settings WHERE key = 'owner_password' LIMIT 1;");
        if (q.rows.length > 0 && q.rows[0].value === provided) {
          isAuthorized = true;
        }
      } catch {}
    }
  }

  // Enforce security on all owner operations
  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      dbConnected: true,
      error: 'غير مصرح: يرجى التحقق من كلمة سر المالك للدخول إلى هذه العمليات'
    });
  }

  const action = req.query?.action || req.body?.action || 'data';

  // 1. GET ALL OWNER DATA (Users + Access Requests + Stats)
  if (req.method === 'GET' || action === 'data') {
    try {
      const usersQuery = await pool.query(`
        SELECT 
          id, name, phone, password, university, 
          academic_year AS "academicYear", 
          is_academy_subscriber AS "isAcademySubscriber", 
          is_activated AS "isActivated", 
          role, expires_at AS "expiresAt", 
          access_duration AS "accessDuration", 
          created_at AS "createdAt"
        FROM users 
        ORDER BY created_at DESC;
      `);

      const requestsQuery = await pool.query(`
        SELECT 
          id, phone, name, university, 
          academic_year AS "academicYear", 
          is_academy_subscriber AS "isAcademySubscriber", 
          status, device_info AS "deviceInfo", 
          notes, created_at AS "createdAt"
        FROM access_requests 
        ORDER BY created_at DESC;
      `);

      const settingsQuery = await pool.query(`
        SELECT value FROM system_settings WHERE key = 'owner_password';
      `);
      const ownerPassword = settingsQuery.rows.length > 0 ? settingsQuery.rows[0].value : '785502919';

      const users = usersQuery.rows.map(u => ({
        ...u,
        registeredAt: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }));
      const requests = requestsQuery.rows;

      return res.status(200).json({
        dbConnected: true,
        users,
        requests,
        ownerPassword,
        stats: {
          totalUsers: users.length,
          activatedUsers: users.filter(u => u.isActivated).length,
          pendingRequests: requests.filter(r => r.status === 'pending').length
        }
      });
    } catch (error: any) {
      console.error('Error in owner data:', error);
      return res.status(500).json({
        dbConnected: true,
        error: error?.message || String(error)
      });
    }
  }

  // 2. ACTIVATE USER BY PHONE (Approved by Owner)
  if (action === 'activate-phone') {
    try {
      const { phone } = req.body || {};
      const cleanPhone = String(phone || '').trim();

      if (!cleanPhone) {
        return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب' });
      }

      // Update in users
      const userRes = await pool.query(`
        UPDATE users 
        SET is_activated = true, is_academy_subscriber = true, updated_at = NOW() 
        WHERE phone = $1 
        RETURNING id, name, phone, is_activated AS "isActivated";
      `, [cleanPhone]);

      // Update in access_requests
      await pool.query(`
        UPDATE access_requests 
        SET status = 'approved', updated_at = NOW() 
        WHERE phone = $1;
      `, [cleanPhone]);

      if (userRes.rows.length === 0) {
        // If not found in users, check if in requests and create user
        const reqCheck = await pool.query('SELECT * FROM access_requests WHERE phone = $1 LIMIT 1;', [cleanPhone]);
        if (reqCheck.rows.length > 0) {
          const r = reqCheck.rows[0];
          const newId = `usr_${Date.now()}`;
          await pool.query(`
            INSERT INTO users (id, name, phone, password, university, academic_year, is_academy_subscriber, is_activated, role)
            VALUES ($1, $2, $3, '123456', $4, $5, true, true, 'student');
          `, [newId, r.name, cleanPhone, r.university, r.academic_year]);

          return res.status(200).json({
            success: true,
            dbConnected: true,
            message: `تم إنشاء وتفعيل حساب الطالب (${r.name}) للرقم ${cleanPhone} في قاعدة بيانات Neon بنجاح!`
          });
        }

        return res.status(404).json({
          success: false,
          message: `لم يتم العثور على حساب مسجل بالرقم: ${cleanPhone}`
        });
      }

      const activatedUser = userRes.rows[0];

      return res.status(200).json({
        success: true,
        dbConnected: true,
        user: activatedUser,
        message: `تم تفعيل حساب الطالب (${activatedUser.name}) للرقم ${cleanPhone} في قاعدة بيانات Neon بنجاح!`
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || String(error) });
    }
  }

  // 3. TOGGLE USER ACTIVATION
  if (action === 'toggle-activation') {
    try {
      const { userId } = req.body || {};
      if (!userId) {
        return res.status(400).json({ success: false, message: 'معرف المستخدم مطلوب' });
      }

      const resUpdate = await pool.query(`
        UPDATE users 
        SET is_activated = NOT is_activated, updated_at = NOW() 
        WHERE id = $1 
        RETURNING id, phone, is_activated AS "isActivated";
      `, [userId]);

      if (resUpdate.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
      }

      const row = resUpdate.rows[0];

      // Update access_requests status accordingly
      await pool.query(`
        UPDATE access_requests 
        SET status = $1, updated_at = NOW() 
        WHERE phone = $2;
      `, [row.isActivated ? 'approved' : 'pending', row.phone]);

      return res.status(200).json({
        success: true,
        dbConnected: true,
        isActivated: row.isActivated
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || String(error) });
    }
  }

  // 4. CREATE ACCOUNT DIRECTLY BY OWNER (with expiration & credentials generation)
  if (action === 'create-account') {
    try {
      const {
        phone,
        password,
        duration,
        name,
        university,
        academicYear
      } = req.body || {};

      const cleanPhone = String(phone || '').trim();
      if (!cleanPhone || cleanPhone.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'رقم الهاتف مطلوب (6 أرقام على الأقل)'
        });
      }

      const plainPassword = password && String(password).trim()
        ? String(password).trim()
        : `${Math.floor(100000 + Math.random() * 900000)}EUI`;

      // Calculate expiration date
      let expiresAt: string = 'unlimited';
      let expiresAtText = 'دائم بدون انتهاء';
      const now = new Date();

      if (duration === '1month') {
        const d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        expiresAt = d.toISOString().split('T')[0];
        expiresAtText = `${expiresAt} (شهر واحد)`;
      } else if (duration === '3months') {
        const d = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        expiresAt = d.toISOString().split('T')[0];
        expiresAtText = `${expiresAt} (3 أشهر)`;
      } else if (duration === '6months') {
        const d = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
        expiresAt = d.toISOString().split('T')[0];
        expiresAtText = `${expiresAt} (6 أشهر)`;
      } else if (duration === '1year') {
        const d = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        expiresAt = d.toISOString().split('T')[0];
        expiresAtText = `${expiresAt} (سنة كاملة)`;
      }

      const cleanName = name && String(name).trim() ? String(name).trim() : `طالب (${cleanPhone.slice(-4)})`;
      const cleanUniv = university && String(university).trim() ? String(university).trim() : 'جامعة صنعاء';

      // Hash password with bcrypt before storing into database
      const hashedPassword = bcrypt.hashSync(plainPassword, 10);

      // Insert or Update in users table
      const upsertUser = await pool.query(`
        INSERT INTO users (
          id, name, phone, password, university, academic_year, is_academy_subscriber, is_activated, role, expires_at, access_duration, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, true, true, 'student', $7, $8, NOW(), NOW()
        )
        ON CONFLICT (phone) DO UPDATE SET 
          password = EXCLUDED.password,
          is_activated = true,
          is_academy_subscriber = true,
          expires_at = EXCLUDED.expires_at,
          access_duration = EXCLUDED.access_duration,
          name = CASE WHEN EXCLUDED.name != '' THEN EXCLUDED.name ELSE users.name END,
          university = CASE WHEN EXCLUDED.university != '' THEN EXCLUDED.university ELSE users.university END,
          updated_at = NOW()
        RETURNING id, name, phone, university, academic_year AS "academicYear", is_activated AS "isActivated", expires_at AS "expiresAt", access_duration AS "accessDuration";
      `, [
        `usr_${Date.now()}`,
        cleanName,
        cleanPhone,
        hashedPassword,
        cleanUniv,
        academicYear || 1,
        expiresAt,
        duration || '3months'
      ]);

      // Also ensure access_requests marks status as approved
      await pool.query(`
        INSERT INTO access_requests (
          id, phone, name, university, academic_year, is_academy_subscriber, status, device_info, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, true, 'approved', 'منشأ بواسطة المالك', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [
        `req_${Date.now()}`,
        cleanPhone,
        cleanName,
        cleanUniv,
        academicYear || 1
      ]);

      return res.status(200).json({
        success: true,
        dbConnected: true,
        user: upsertUser.rows[0],
        plainPassword,
        expiresAtText,
        message: `تم حفظ الحساب في Neon وتفعيله بنجاح: ${expiresAtText}.`
      });
    } catch (error: any) {
      console.error('Error creating account by owner:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || String(error)
      });
    }
  }

  // 5. UPDATE USER ACCESS / RESET PASSWORD / EXTEND VALIDITY
  if (action === 'update-user-access') {
    try {
      const { userId, phone, newPassword, duration } = req.body || {};
      const cleanPhone = String(phone || '').trim();

      let expiresAt: string | undefined = undefined;
      let expiresAtText = '';

      if (duration) {
        const now = new Date();
        if (duration === '1month') {
          const d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          expiresAt = d.toISOString().split('T')[0];
          expiresAtText = `${expiresAt} (شهر واحد)`;
        } else if (duration === '3months') {
          const d = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          expiresAt = d.toISOString().split('T')[0];
          expiresAtText = `${expiresAt} (3 أشهر)`;
        } else if (duration === '6months') {
          const d = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
          expiresAt = d.toISOString().split('T')[0];
          expiresAtText = `${expiresAt} (6 أشهر)`;
        } else if (duration === '1year') {
          const d = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          expiresAt = d.toISOString().split('T')[0];
          expiresAtText = `${expiresAt} (سنة كاملة)`;
        } else if (duration === 'unlimited') {
          expiresAt = 'unlimited';
          expiresAtText = 'دائم بدون انتهاء';
        }
      }

      let plainPasswordToReturn: string | undefined = undefined;
      let hashedPassword: string | undefined = undefined;

      if (newPassword && String(newPassword).trim()) {
        plainPasswordToReturn = String(newPassword).trim();
        hashedPassword = bcrypt.hashSync(plainPasswordToReturn, 10);
      }

      let query = 'UPDATE users SET updated_at = NOW()';
      const params: any[] = [];
      let paramIdx = 1;

      if (hashedPassword) {
        query += `, password = $${paramIdx++}`;
        params.push(hashedPassword);
      }
      if (expiresAt !== undefined) {
        query += `, expires_at = $${paramIdx++}, access_duration = $${paramIdx++}`;
        params.push(expiresAt, duration);
      }

      query += ` WHERE id = $${paramIdx} OR phone = $${paramIdx} RETURNING id, name, phone, is_activated AS "isActivated", expires_at AS "expiresAt", access_duration AS "accessDuration";`;
      params.push(userId || cleanPhone);

      const updateRes = await pool.query(query, params);

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
      }

      return res.status(200).json({
        success: true,
        dbConnected: true,
        user: updateRes.rows[0],
        plainPassword: plainPasswordToReturn,
        expiresAtText,
        message: 'تم تحديث بيانات الوصول بنجاح في قاعدة بيانات Neon'
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || String(error) });
    }
  }

  // 6. DELETE USER
  if (action === 'delete-user') {
    try {
      const { userId, phone } = req.body || {};
      if (!userId && !phone) {
        return res.status(400).json({ success: false, message: 'معرف المستخدم أو رقم الهاتف مطلوب' });
      }

      await pool.query('DELETE FROM users WHERE id = $1 OR phone = $2;', [userId || '', phone || '']);
      if (phone) {
        await pool.query('DELETE FROM access_requests WHERE phone = $1;', [phone]);
      }

      return res.status(200).json({
        success: true,
        dbConnected: true,
        message: 'تم حذف الحساب بنجاح'
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || String(error) });
    }
  }

  // 7. REJECT REQUEST (mark status as rejected)
  if (action === 'reject-request') {
    try {
      const { requestId, phone } = req.body || {};
      if (!requestId && !phone) {
        return res.status(400).json({ success: false, message: 'معرف الطلب أو رقم الهاتف مطلوب' });
      }

      await pool.query(
        "UPDATE access_requests SET status = 'rejected', updated_at = NOW() WHERE id = $1 OR phone = $2;",
        [requestId || '', phone || '']
      );

      return res.status(200).json({
        success: true,
        dbConnected: true,
        message: 'تم رفض الطلب'
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || String(error) });
    }
  }

  // 8. DELETE / DECLINE REQUEST
  if (action === 'delete-request') {
    try {
      const { requestId } = req.body || {};
      if (!requestId) {
        return res.status(400).json({ success: false, message: 'معرف الطلب مطلوب' });
      }

      await pool.query('DELETE FROM access_requests WHERE id = $1;', [requestId]);

      return res.status(200).json({
        success: true,
        dbConnected: true,
        message: 'تم حذف الطلب بنجاح'
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || String(error) });
    }
  }

  // 9. UPDATE OWNER PASSWORD
  if (action === 'update-password') {
    try {
      const { newPassword } = req.body || {};
      const cleanPass = String(newPassword || '').trim();

      if (!cleanPass || cleanPass.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'كلمة السر يجب أن تكون 4 أحرف/أرقام على الأقل'
        });
      }

      await pool.query(`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ('owner_password', $1, NOW())
        ON CONFLICT (key) DO UPDATE SET 
          value = EXCLUDED.value,
          updated_at = NOW();
      `, [cleanPass]);

      return res.status(200).json({
        success: true,
        dbConnected: true,
        message: `تم تحديث وحفظ كلمة سر المالك في Neon بنجاح: (${cleanPass})`
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || String(error) });
    }
  }

  return res.status(400).json({ error: 'Invalid owner action' });
}
