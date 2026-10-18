import { getPool, initDatabase, memoryStore, MemoryRequest, normalizePhone } from './_db';

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

  const checkIsOwner = async (): Promise<boolean> => {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
    const customPass = (req.headers['x-owner-password'] || req.query?.ownerPassword || '').toString().trim();
    const provided = token || customPass;

    if (!provided) return false;
    if (MASTER_OWNER_PASSWORDS.includes(provided)) return true;

    if (pool) {
      try {
        const q = await pool.query("SELECT value FROM system_settings WHERE key = 'owner_password' LIMIT 1;");
        if (q.rows.length > 0 && q.rows[0].value === provided) {
          return true;
        }
      } catch {}
    }

    if (memoryStore.settings['owner_password'] === provided) {
      return true;
    }

    return false;
  };

  // GET: Retrieve requests
  if (req.method === 'GET') {
    try {
      const queryPhone = String(req.query?.phone || '').trim();

      // If a student is checking their own phone request
      if (queryPhone) {
        if (pool) {
          try {
            const result = await pool.query(`
              SELECT 
                id, phone, name, university, specialization,
                academic_year AS "academicYear", 
                is_academy_subscriber AS "isAcademySubscriber", status, 
                created_at AS "createdAt", updated_at AS "updatedAt"
              FROM access_requests
              WHERE phone = $1
              ORDER BY created_at DESC
              LIMIT 1;
            `, [queryPhone]);

            if (result.rows.length > 0) {
              const r = result.rows[0];
              return res.status(200).json({
                found: true,
                phone: queryPhone,
                status: r.status,
                isActivated: r.status === 'approved',
                request: r,
                dbConnected: true
              });
            }
          } catch (e) {
            console.warn('Neon query failed in requests GET:', e);
          }
        }

        // Fallback to memoryStore
        const memReq = memoryStore.requests.find(r => r.phone === queryPhone);
        if (memReq) {
          return res.status(200).json({
            found: true,
            phone: queryPhone,
            status: memReq.status,
            isActivated: memReq.status === 'approved',
            request: memReq,
            dbConnected: false
          });
        }

        return res.status(200).json({
          found: false,
          phone: queryPhone,
          message: 'لم يتم العثور على طلب بهذا الرقم'
        });
      }

      // Owner requesting all access requests
      const isOwner = await checkIsOwner();
      if (!isOwner) {
        return res.status(401).json({
          success: false,
          error: 'غير مصرح للوصول إلى طلبات الطلاب'
        });
      }

      let allRequests: any[] = [];
      if (pool) {
        try {
          const result = await pool.query(`
            SELECT 
              id, phone, name, university, specialization,
              academic_year AS "academicYear", 
              is_academy_subscriber AS "isAcademySubscriber", status, 
              device_info AS "deviceInfo", notes,
              created_at AS "createdAt", updated_at AS "updatedAt"
            FROM access_requests
            ORDER BY created_at DESC;
          `);
          allRequests = result.rows || [];
        } catch (e) {
          console.warn('Neon query error:', e);
        }
      }

      // Merge memoryStore requests that may not be in Neon
      const existingPhones = new Set(allRequests.map(r => r.phone));
      for (const mr of memoryStore.requests) {
        if (!existingPhones.has(mr.phone)) {
          allRequests.unshift({
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
            createdAt: mr.created_at,
            updatedAt: mr.updated_at
          });
        }
      }

      return res.status(200).json({
        success: true,
        requests: allRequests,
        total: allRequests.length,
        pending: allRequests.filter(r => r.status === 'pending').length,
        approved: allRequests.filter(r => r.status === 'approved').length,
        dbConnected: Boolean(pool)
      });
    } catch (error: any) {
      console.error('Error in /api/requests GET:', error);
      return res.status(200).json({
        success: true,
        requests: memoryStore.requests,
        total: memoryStore.requests.length,
        pending: memoryStore.requests.filter(r => r.status === 'pending').length,
        dbConnected: false
      });
    }
  }

  // POST: Create or Update access request (Student sends subscription request)
  if (req.method === 'POST') {
    try {
      const { 
        phone, 
        name, 
        university, 
        specialization, 
        email, 
        academicYear, 
        isAcademySubscriber, 
        notes, 
        deviceInfo 
      } = req.body || {};

      const rawPhone = String(phone || '').trim();
      const cleanPhone = normalizePhone(rawPhone) || rawPhone;
      const cleanName = String(name || '').trim();
      const cleanUniv = String(university || 'جامعة صنعاء').trim();
      const cleanSpec = String(specialization || 'هندسة ميكاترونكس').trim();
      const yr = Number(academicYear) || 1;
      const isSub = Boolean(isAcademySubscriber);

      if (!cleanPhone || !cleanName) {
        return res.status(400).json({
          success: false,
          message: 'يرجى إدخال الاسم ورقم الهاتف'
        });
      }

      const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const nowIso = new Date().toISOString();

      // 1. Always save in memoryStore so it's NEVER lost
      const existingMemIdx = memoryStore.requests.findIndex(r => 
        r.phone === cleanPhone || normalizePhone(r.phone) === cleanPhone
      );
      const newMemoryRequest: MemoryRequest = {
        id: reqId,
        phone: cleanPhone,
        name: cleanName,
        university: cleanUniv,
        specialization: cleanSpec,
        email: email ? String(email).trim() : undefined,
        academic_year: yr,
        is_academy_subscriber: isSub,
        status: isSub ? 'approved' : 'pending',
        device_info: deviceInfo || '',
        notes: notes || '',
        created_at: nowIso,
        updated_at: nowIso
      };

      if (existingMemIdx !== -1) {
        memoryStore.requests[existingMemIdx] = newMemoryRequest;
      } else {
        memoryStore.requests.unshift(newMemoryRequest);
      }

      // Also ensure student exists in memoryStore.users as pending
      const existingUserIdx = memoryStore.users.findIndex(u => u.phone === cleanPhone);
      if (existingUserIdx === -1) {
        memoryStore.users.push({
          id: `usr_${Date.now()}`,
          name: cleanName,
          phone: cleanPhone,
          university: cleanUniv,
          specialization: cleanSpec,
          academic_year: yr,
          is_academy_subscriber: Boolean(isAcademySubscriber),
          is_activated: false,
          role: 'student',
          created_at: nowIso,
          updated_at: nowIso
        });
      }

      // 2. Save in Neon PostgreSQL if pool exists
      let savedToDb = false;
      if (pool) {
        try {
          const checkRes = await pool.query('SELECT id FROM access_requests WHERE phone = $1 LIMIT 1;', [cleanPhone]);
          if (checkRes.rows.length > 0) {
            await pool.query(`
              UPDATE access_requests
              SET 
                name = $1,
                university = $2,
                specialization = $3,
                academic_year = $4,
                is_academy_subscriber = $5,
                status = 'pending',
                device_info = $6,
                notes = $7,
                updated_at = NOW()
              WHERE phone = $8;
            `, [cleanName, cleanUniv, cleanSpec, yr, Boolean(isAcademySubscriber), deviceInfo || '', notes || '', cleanPhone]);
          } else {
            await pool.query(`
              INSERT INTO access_requests (
                id, phone, name, university, specialization, academic_year, is_academy_subscriber, status, device_info, notes, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, NOW(), NOW());
            `, [reqId, cleanPhone, cleanName, cleanUniv, cleanSpec, yr, Boolean(isAcademySubscriber), deviceInfo || '', notes || '']);
          }
          savedToDb = true;
        } catch (dbErr) {
          console.warn('Could not insert to Neon DB:', dbErr);
        }
      }

      // Always return success so the student receives confirmation and owner can activate!
      return res.status(200).json({
        success: true,
        requestId: reqId,
        requiresActivation: true,
        dbConnected: savedToDb,
        message: savedToDb 
          ? 'تم إرسال طلب الاشتراك وحفظه في قاعدة البيانات السحابية بنجاح! بانتظار موافقة مالك المختبر.'
          : 'تم إرسال طلب الاشتراك بنجاح! حسابك قيد التفعيل من قبل المالك.'
      });
    } catch (error: any) {
      console.error('Error in /api/requests POST:', error);
      return res.status(200).json({
        success: true,
        requiresActivation: true,
        message: 'تم تسجيل طلبك محلياً بانتظار تفعيل المالك.'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
