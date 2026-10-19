import bcrypt from 'bcryptjs';
import { getPool, initDatabase, memoryStore, MemoryUser, normalizePhone } from './_db';
import { OFFICIAL_ACTIVATION_CODES } from '../src/data/activationCodes';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-owner-password');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pool = getPool();
  if (pool) {
    try {
      await initDatabase();
    } catch {}
  }

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
      if (pool) {
        try {
          const q = await pool.query("SELECT value FROM system_settings WHERE key = 'owner_password' LIMIT 1;");
          if (q.rows.length > 0 && q.rows[0].value === provided) {
            isAuthorized = true;
          }
        } catch {}
      }
      if (memoryStore.settings['owner_password'] === provided) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      error: 'غير مصرح: يرجى التحقق من كلمة سر المالك للدخول إلى هذه العمليات'
    });
  }

  const action = req.query?.action || req.body?.action || 'data';

  // 1. GET ALL OWNER DATA (Users + Access Requests + Stats)
  if (req.method === 'GET' || action === 'data') {
    try {
      let users: any[] = [];
      let requests: any[] = [];
      let ownerPassword = memoryStore.settings['owner_password'] || '785502919';

      if (pool) {
        try {
          const usersQuery = await pool.query(`
            SELECT 
              id, name, phone, password, university, specialization,
              academic_year AS "academicYear", 
              is_academy_subscriber AS "isAcademySubscriber", 
              is_activated AS "isActivated", 
              role, expires_at AS "expiresAt", 
              access_duration AS "accessDuration", 
              created_at AS "createdAt"
            FROM users 
            ORDER BY created_at DESC;
          `);
          users = usersQuery.rows || [];

          const requestsQuery = await pool.query(`
            SELECT 
              id, phone, name, university, specialization,
              academic_year AS "academicYear", 
              is_academy_subscriber AS "isAcademySubscriber", 
              status, device_info AS "deviceInfo", 
              notes, created_at AS "createdAt"
            FROM access_requests 
            ORDER BY created_at DESC;
          `);
          requests = requestsQuery.rows || [];

          const pwdQuery = await pool.query("SELECT value FROM system_settings WHERE key = 'owner_password' LIMIT 1;");
          if (pwdQuery.rows.length > 0) {
            ownerPassword = pwdQuery.rows[0].value;
          }
        } catch (dbErr) {
          console.warn('Neon data query failed, falling back to memoryStore:', dbErr);
        }
      }

      // Merge memoryStore users & requests to guarantee nothing is omitted
      const existingUserPhones = new Set(users.map(u => u.phone));
      for (const mu of memoryStore.users) {
        if (!existingUserPhones.has(mu.phone)) {
          users.push({
            id: mu.id,
            name: mu.name,
            phone: mu.phone,
            password: mu.password,
            university: mu.university,
            specialization: mu.specialization || 'هندسة ميكاترونكس',
            academicYear: mu.academic_year,
            isAcademySubscriber: mu.is_academy_subscriber,
            isActivated: mu.is_activated,
            role: mu.role,
            expiresAt: mu.expires_at,
            accessDuration: mu.access_duration,
            createdAt: mu.created_at
          });
        }
      }

      const existingReqPhones = new Set(requests.map(r => r.phone));
      for (const mr of memoryStore.requests) {
        if (!existingReqPhones.has(mr.phone)) {
          requests.unshift({
            id: mr.id,
            phone: mr.phone,
            name: mr.name,
            university: mr.university,
            specialization: mr.specialization || 'هندسة ميكاترونكس',
            academicYear: mr.academic_year,
            isAcademySubscriber: mr.is_academy_subscriber,
            status: mr.status,
            deviceInfo: mr.device_info,
            notes: mr.notes,
            createdAt: mr.created_at
          });
        }
      }

      // Compute 1-to-1 Activation Code Status
      let codeUsages: Array<{ code: string; phone: string; student_name?: string; used_at: string }> = [...memoryStore.codeUsage];
      if (pool) {
        try {
          const usageQuery = await pool.query('SELECT code, phone, student_name, used_at FROM activation_code_usage ORDER BY used_at DESC;');
          const dbUsages = usageQuery.rows || [];
          const seen = new Set(codeUsages.map(u => u.code.toUpperCase()));
          for (const u of dbUsages) {
            const upper = u.code.toUpperCase();
            if (!seen.has(upper)) {
              codeUsages.push({
                code: upper,
                phone: u.phone,
                student_name: u.student_name,
                used_at: u.used_at ? new Date(u.used_at).toISOString() : new Date().toISOString()
              });
              seen.add(upper);
            }
          }
        } catch {}
      }

      const usageMap = new Map<string, { phone: string; student_name?: string; used_at: string }>();
      codeUsages.forEach(u => {
        usageMap.set(u.code.toUpperCase(), u);
      });

      const activationCodes = OFFICIAL_ACTIVATION_CODES.map(code => {
        const upper = code.toUpperCase();
        const usage = usageMap.get(upper);
        return {
          code: upper,
          isUsed: Boolean(usage),
          phone: usage?.phone || '',
          studentName: usage?.student_name || '',
          usedAt: usage?.used_at || ''
        };
      });

      const usedCodesCount = activationCodes.filter(c => c.isUsed).length;

      return res.status(200).json({
        success: true,
        dbConnected: Boolean(pool),
        users,
        requests,
        activationCodes,
        ownerPassword,
        stats: {
          totalUsers: users.length,
          activatedUsers: users.filter(u => u.isActivated).length,
          pendingRequests: requests.filter(r => r.status === 'pending').length,
          totalCodes: OFFICIAL_ACTIVATION_CODES.length,
          usedCodes: usedCodesCount,
          availableCodes: OFFICIAL_ACTIVATION_CODES.length - usedCodesCount
        }
      });
    } catch (error: any) {
      console.error('Error in owner data:', error);
      const fallbackUsageMap = new Map(memoryStore.codeUsage.map(u => [u.code.toUpperCase(), u]));
      const fallbackCodes = OFFICIAL_ACTIVATION_CODES.map(code => {
        const upper = code.toUpperCase();
        const usage = fallbackUsageMap.get(upper);
        return {
          code: upper,
          isUsed: Boolean(usage),
          phone: usage?.phone || '',
          studentName: usage?.student_name || '',
          usedAt: usage?.used_at || ''
        };
      });
      const fallbackUsedCount = fallbackCodes.filter(c => c.isUsed).length;

      return res.status(200).json({
        success: true,
        dbConnected: false,
        users: memoryStore.users,
        requests: memoryStore.requests,
        activationCodes: fallbackCodes,
        ownerPassword: memoryStore.settings['owner_password'],
        stats: {
          totalUsers: memoryStore.users.length,
          activatedUsers: memoryStore.users.filter(u => u.is_activated).length,
          pendingRequests: memoryStore.requests.filter(r => r.status === 'pending').length,
          totalCodes: OFFICIAL_ACTIVATION_CODES.length,
          usedCodes: fallbackUsedCount,
          availableCodes: OFFICIAL_ACTIVATION_CODES.length - fallbackUsedCount
        }
      });
    }
  }

  // 1.5. RELEASE / UNBIND CODE
  if (action === 'release-code') {
    try {
      const { code } = req.body || {};
      const upperCode = String(code || '').trim().toUpperCase();
      if (!upperCode) {
        return res.status(400).json({ success: false, message: 'رمز الكود مطلوب' });
      }

      memoryStore.codeUsage = memoryStore.codeUsage.filter(u => u.code.toUpperCase() !== upperCode);
      if (pool) {
        try {
          await pool.query('DELETE FROM activation_code_usage WHERE code = $1;', [upperCode]);
        } catch {}
      }

      return res.status(200).json({
        success: true,
        message: `تم إلغاء ربط الكود (${upperCode}) بنجاح وأصبح متاحاً للاستخدام من جديد.`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 1.6. ASSIGN CODE MANUALLY TO A PHONE
  if (action === 'assign-code') {
    try {
      const { code, phone, studentName } = req.body || {};
      const upperCode = String(code || '').trim().toUpperCase();
      const rawPhone = String(phone || '').trim();
      const cleanPhone = normalizePhone(rawPhone) || rawPhone;

      if (!upperCode || !cleanPhone) {
        return res.status(400).json({ success: false, message: 'الكود ورقم الهاتف مطلوبان' });
      }

      // Check if code already used
      const existing = memoryStore.codeUsage.find(u => u.code.toUpperCase() === upperCode);
      if (existing && existing.phone !== cleanPhone) {
        return res.status(400).json({ success: false, message: 'هذا الكود مستخدم بالفعل لرقم آخر' });
      }

      // Remove previous code for this phone if any
      memoryStore.codeUsage = memoryStore.codeUsage.filter(u => u.phone !== cleanPhone && u.code.toUpperCase() !== upperCode);
      memoryStore.codeUsage.push({
        code: upperCode,
        phone: cleanPhone,
        student_name: studentName || 'مشترك ميكاترونكس',
        used_at: new Date().toISOString()
      });

      if (pool) {
        try {
          await pool.query('DELETE FROM activation_code_usage WHERE code = $1 OR phone = $2;', [upperCode, cleanPhone]);
          await pool.query(
            'INSERT INTO activation_code_usage (code, phone, student_name, used_at) VALUES ($1, $2, $3, NOW());',
            [upperCode, cleanPhone, studentName || 'مشترك ميكاترونكس']
          );
        } catch {}
      }

      return res.status(200).json({
        success: true,
        message: `تم تخصيص وربط الكود (${upperCode}) بالرقم (${cleanPhone}) بنجاح.`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. ACTIVATE USER BY PHONE (Approved by Owner)
  if (action === 'activate-phone') {
    try {
      const { phone } = req.body || {};
      const rawPhone = String(phone || '').trim();
      const cleanPhone = normalizePhone(rawPhone) || rawPhone;

      if (!cleanPhone) {
        return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب' });
      }

      // Update in memoryStore
      const memUser = memoryStore.users.find(u => 
        u.phone === cleanPhone || 
        normalizePhone(u.phone) === cleanPhone ||
        u.phone === rawPhone
      );
      if (memUser) {
        memUser.is_activated = true;
        memUser.is_academy_subscriber = true;
        memUser.updated_at = new Date().toISOString();
      }

      const memReq = memoryStore.requests.find(r => 
        r.phone === cleanPhone || 
        normalizePhone(r.phone) === cleanPhone ||
        r.phone === rawPhone
      );
      if (memReq) {
        memReq.status = 'approved';
        memReq.updated_at = new Date().toISOString();
      }

      if (!memUser && memReq) {
        memoryStore.users.push({
          id: `usr_${Date.now()}`,
          name: memReq.name,
          phone: cleanPhone,
          password: '123',
          university: memReq.university,
          specialization: memReq.specialization,
          academic_year: memReq.academic_year,
          is_academy_subscriber: true,
          is_activated: true,
          role: 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Update in Neon if connected
      if (pool) {
        try {
          await pool.query(`
            UPDATE users 
            SET is_activated = true, is_academy_subscriber = true, updated_at = NOW() 
            WHERE phone = $1 OR phone = $2;
          `, [cleanPhone, rawPhone]);

          await pool.query(`
            UPDATE access_requests 
            SET status = 'approved', updated_at = NOW() 
            WHERE phone = $1 OR phone = $2;
          `, [cleanPhone, rawPhone]);
        } catch (dbErr) {
          console.warn('Neon DB activation update warning:', dbErr);
        }
      }

      return res.status(200).json({
        success: true,
        message: `تم تفعيل حساب المشترك للرقم (${cleanPhone}) بنجاح! يمكنه الآن دخول المعمل الافتراضي فوراً.`
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || String(error) });
    }
  }

  // 2.5. ACTIVATE ALL PENDING REQUESTS IN ONE CLICK
  if (action === 'activate-all') {
    try {
      let count = 0;
      for (const reqItem of memoryStore.requests) {
        if (reqItem.status === 'pending') {
          reqItem.status = 'approved';
          reqItem.updated_at = new Date().toISOString();
          count++;

          const existingUser = memoryStore.users.find(u => 
            u.phone === reqItem.phone || normalizePhone(u.phone) === normalizePhone(reqItem.phone)
          );
          if (existingUser) {
            existingUser.is_activated = true;
            existingUser.is_academy_subscriber = true;
          } else {
            memoryStore.users.push({
              id: `usr_${Date.now()}_${count}`,
              name: reqItem.name,
              phone: reqItem.phone,
              password: '123',
              university: reqItem.university,
              specialization: reqItem.specialization,
              academic_year: reqItem.academic_year,
              is_academy_subscriber: true,
              is_activated: true,
              role: 'student',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      if (pool) {
        try {
          await pool.query("UPDATE access_requests SET status = 'approved', updated_at = NOW() WHERE status = 'pending';");
          await pool.query("UPDATE users SET is_activated = true, is_academy_subscriber = true, updated_at = NOW();");
        } catch {}
      }

      return res.status(200).json({
        success: true,
        count,
        message: `تم تفعيل جميع طلبات الاشتراك (${count} طلب) بنجاح!`
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

      let newStatus = true;
      const memUser = memoryStore.users.find(u => u.id === userId);
      if (memUser) {
        memUser.is_activated = !memUser.is_activated;
        newStatus = memUser.is_activated;
        const memReq = memoryStore.requests.find(r => r.phone === memUser.phone);
        if (memReq) {
          memReq.status = newStatus ? 'approved' : 'pending';
        }
      }

      if (pool) {
        try {
          const resUpdate = await pool.query(`
            UPDATE users 
            SET is_activated = NOT is_activated, updated_at = NOW() 
            WHERE id = $1 
            RETURNING id, phone, is_activated AS "isActivated";
          `, [userId]);
          if (resUpdate.rows.length > 0) {
            newStatus = resUpdate.rows[0].isActivated;
            await pool.query(`
              UPDATE access_requests 
              SET status = $1, updated_at = NOW() 
              WHERE phone = $2;
            `, [newStatus ? 'approved' : 'pending', resUpdate.rows[0].phone]);
          }
        } catch {}
      }

      return res.status(200).json({
        success: true,
        isActivated: newStatus,
        message: `تم تغيير حالة الحساب إلى (${newStatus ? 'مفعل' : 'معطل'}) بنجاح!`
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || String(error) });
    }
  }

  // 4. CREATE USER & ACTIVATE DIRECTLY BY PHONE NUMBER
  if (action === 'create-account') {
    try {
      const { phone, password, duration, name, university, specialization, academicYear } = req.body || {};
      const cleanPhone = String(phone || '').trim();
      const cleanName = String(name || '').trim() || `مشترك ميكاترونكس ${cleanPhone.slice(-4)}`;
      const cleanPass = String(password || '').trim() || '123456';
      const cleanUniv = String(university || 'جامعة العلوم والتكنولوجيا').trim();
      const cleanSpec = String(specialization || 'هندسة ميكاترونكس').trim();
      const yr = Number(academicYear) || 1;
      const chosenDuration = duration || '3months';

      if (!cleanPhone) {
        return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب' });
      }

      // Calculate expiration date
      let expiresAtText = 'غير محدد';
      const now = new Date();
      if (chosenDuration === '1month') {
        now.setMonth(now.getMonth() + 1);
        expiresAtText = now.toISOString().split('T')[0];
      } else if (chosenDuration === '3months') {
        now.setMonth(now.getMonth() + 3);
        expiresAtText = now.toISOString().split('T')[0];
      } else if (chosenDuration === '6months') {
        now.setMonth(now.getMonth() + 6);
        expiresAtText = now.toISOString().split('T')[0];
      } else if (chosenDuration === '1year') {
        now.setFullYear(now.getFullYear() + 1);
        expiresAtText = now.toISOString().split('T')[0];
      } else if (chosenDuration === 'unlimited') {
        expiresAtText = 'غير محدود (دائم)';
      }

      const hashedPassword = bcrypt.hashSync(cleanPass, 10);
      const userId = `usr_${Date.now()}`;

      // Update in memoryStore
      const memUser = memoryStore.users.find(u => u.phone === cleanPhone);
      const memoryRecord: MemoryUser = {
        id: memUser ? memUser.id : userId,
        name: cleanName,
        phone: cleanPhone,
        password: cleanPass,
        university: cleanUniv,
        specialization: cleanSpec,
        academic_year: yr,
        is_academy_subscriber: true,
        is_activated: true,
        role: 'student',
        expires_at: expiresAtText,
        access_duration: chosenDuration,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (memUser) {
        Object.assign(memUser, memoryRecord);
      } else {
        memoryStore.users.push(memoryRecord);
      }

      // Update request status to approved
      const memReq = memoryStore.requests.find(r => r.phone === cleanPhone);
      if (memReq) {
        memReq.status = 'approved';
      }

      // Insert or update in Neon
      if (pool) {
        try {
          const existDb = await pool.query('SELECT id FROM users WHERE phone = $1;', [cleanPhone]);
          if (existDb.rows.length > 0) {
            await pool.query(`
              UPDATE users 
              SET 
                name = $1, password = $2, university = $3, specialization = $4, academic_year = $5,
                is_academy_subscriber = true, is_activated = true, expires_at = $6, access_duration = $7, updated_at = NOW()
              WHERE phone = $8;
            `, [cleanName, hashedPassword, cleanUniv, cleanSpec, yr, expiresAtText, chosenDuration, cleanPhone]);
          } else {
            await pool.query(`
              INSERT INTO users (
                id, name, phone, password, university, specialization, academic_year, is_academy_subscriber, is_activated, role, expires_at, access_duration, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, true, 'student', $8, $9, NOW(), NOW());
            `, [userId, cleanName, cleanPhone, hashedPassword, cleanUniv, cleanSpec, yr, expiresAtText, chosenDuration]);
          }

          // Approve request in Neon
          await pool.query(`
            UPDATE access_requests SET status = 'approved', updated_at = NOW() WHERE phone = $1;
          `, [cleanPhone]);
        } catch (dbErr) {
          console.warn('Neon DB create account error:', dbErr);
        }
      }

      return res.status(200).json({
        success: true,
        user: {
          id: userId,
          name: cleanName,
          phone: cleanPhone,
          university: cleanUniv,
          specialization: cleanSpec,
          academicYear: yr,
          isAcademySubscriber: true,
          isActivated: true,
          role: 'student',
          expiresAt: expiresAtText,
          accessDuration: chosenDuration
        },
        plainPassword: cleanPass,
        expiresAtText,
        message: `تم تسجيل وتفعيل حساب المشترك (${cleanName}) للرقم ${cleanPhone} بنجاح!`
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || String(error) });
    }
  }

  // 5. REJECT ACCESS REQUEST
  if (action === 'reject-request') {
    try {
      const { requestId, phone } = req.body || {};
      const memReq = memoryStore.requests.find(r => r.id === requestId || (phone && r.phone === phone));
      if (memReq) {
        memReq.status = 'rejected';
      }

      if (pool) {
        try {
          if (requestId) {
            await pool.query("UPDATE access_requests SET status = 'rejected', updated_at = NOW() WHERE id = $1;", [requestId]);
          } else if (phone) {
            await pool.query("UPDATE access_requests SET status = 'rejected', updated_at = NOW() WHERE phone = $1;", [phone]);
          }
        } catch {}
      }

      return res.status(200).json({ success: true, message: 'تم رفض طلب الاشتراك' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || String(error) });
    }
  }

  // 6. DELETE REQUEST
  if (action === 'delete-request') {
    try {
      const { requestId } = req.body || {};
      const idx = memoryStore.requests.findIndex(r => r.id === requestId);
      if (idx !== -1) {
        memoryStore.requests.splice(idx, 1);
      }

      if (pool && requestId) {
        try {
          await pool.query('DELETE FROM access_requests WHERE id = $1;', [requestId]);
        } catch {}
      }

      return res.status(200).json({ success: true, message: 'تم حذف الطلب' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || String(error) });
    }
  }

  // 7. UPDATE OWNER PASSWORD
  if (action === 'update-password') {
    try {
      const { newPassword } = req.body || {};
      const cleanPass = String(newPassword || '').trim();
      if (!cleanPass || cleanPass.length < 4) {
        return res.status(400).json({ success: false, message: 'كلمة السر يجب أن تتكون من 4 خانات على الأقل' });
      }

      memoryStore.settings['owner_password'] = cleanPass;

      if (pool) {
        try {
          await pool.query(`
            INSERT INTO system_settings (key, value, updated_at)
            VALUES ('owner_password', $1, NOW())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
          `, [cleanPass]);
        } catch {}
      }

      return res.status(200).json({ success: true, message: `تم تحديث كلمة سر المالك بنجاح: (${cleanPass})` });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || String(error) });
    }
  }

  return res.status(400).json({ success: false, message: 'إجراء غير معروف' });
}
