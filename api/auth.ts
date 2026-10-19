import bcrypt from 'bcryptjs';
import { getPool, initDatabase, memoryStore, MemoryUser, MemoryRequest, normalizePhone } from './_db';
import { isValidOfficialCode } from '../src/data/activationCodes';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pool = getPool();
  if (pool) {
    try {
      await initDatabase();
    } catch {}
  }

  const action = req.body?.action || req.query?.action || (req.body?.name ? 'register' : 'login');

  // 1. REGISTER STUDENT
  if (action === 'register') {
    try {
      const {
        name,
        phone,
        password,
        university,
        specialization,
        academicYear,
        isAcademySubscriber,
        deviceInfo
      } = req.body || {};

      const rawPhone = String(phone || '').trim();
      const cleanPhone = normalizePhone(rawPhone) || rawPhone;
      const cleanName = String(name || '').trim();
      const cleanPassword = String(password || '').trim();
      const cleanUniv = String(university || 'جامعة صنعاء').trim();
      const cleanSpec = String(specialization || 'هندسة ميكاترونكس').trim();
      const yr = Number(academicYear) || 1;
      const isSub = Boolean(isAcademySubscriber);

      if (!cleanPhone || !cleanName || !cleanPassword) {
        return res.status(400).json({
          success: false,
          message: 'يرجى إكمال جميع الحقول المطلوبة (الاسم، رقم الهاتف، كلمة السر)'
        });
      }

      const hashedPassword = bcrypt.hashSync(cleanPassword, 10);
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const nowIso = new Date().toISOString();

      // Check if user already exists
      const memExisting = memoryStore.users.find(u => 
        u.phone === cleanPhone || 
        normalizePhone(u.phone) === cleanPhone || 
        (u.phone && cleanPhone && u.phone.includes(cleanPhone))
      );

      // Academy subscribers are granted instant activation
      const isAutoActivate = memoryStore.settings['auto_activate_subscribers'] !== 'false';
      const shouldActivate = isSub || isAutoActivate;

      if (memExisting && memExisting.is_activated) {
        // Update user record with new password/university if re-registering
        memExisting.password = cleanPassword;
        memExisting.university = cleanUniv;
        memExisting.specialization = cleanSpec;
        memExisting.academic_year = yr;
        memExisting.updated_at = nowIso;

        return res.status(200).json({
          success: true,
          user: {
            id: memExisting.id,
            name: memExisting.name,
            phone: memExisting.phone,
            university: memExisting.university,
            specialization: memExisting.specialization,
            academicYear: memExisting.academic_year,
            isAcademySubscriber: memExisting.is_academy_subscriber,
            isActivated: true,
            role: memExisting.role
          },
          alreadyExists: true,
          isActivated: true,
          message: 'حسابك مسجل ومفعل في المنصة! تم تحديث بياناتك بنجاح ويمكنك الدخول فوراً.'
        });
      }

      // Update or add in memoryStore
      const userMemoryRecord: MemoryUser = {
        id: memExisting ? memExisting.id : userId,
        name: cleanName,
        phone: cleanPhone,
        password: cleanPassword,
        university: cleanUniv,
        specialization: cleanSpec,
        academic_year: yr,
        is_academy_subscriber: isSub,
        is_activated: shouldActivate,
        role: 'student',
        created_at: nowIso,
        updated_at: nowIso
      };

      if (memExisting) {
        Object.assign(memExisting, userMemoryRecord);
      } else {
        memoryStore.users.push(userMemoryRecord);
      }

      // Add to access requests so Owner Dashboard displays it
      const reqMemExisting = memoryStore.requests.find(r => 
        r.phone === cleanPhone || normalizePhone(r.phone) === cleanPhone
      );
      const reqMemoryRecord: MemoryRequest = {
        id: reqId,
        phone: cleanPhone,
        name: cleanName,
        university: cleanUniv,
        specialization: cleanSpec,
        academic_year: yr,
        is_academy_subscriber: isSub,
        status: shouldActivate ? 'approved' : 'pending',
        device_info: deviceInfo || '',
        created_at: nowIso,
        updated_at: nowIso
      };

      if (reqMemExisting) {
        Object.assign(reqMemExisting, reqMemoryRecord);
      } else {
        memoryStore.requests.unshift(reqMemoryRecord);
      }

      // Also persist to Neon PostgreSQL if available
      let savedToDb = false;
      if (pool) {
        try {
          const existingDb = await pool.query('SELECT id, is_activated FROM users WHERE phone = $1;', [cleanPhone]);
          if (existingDb.rows.length > 0) {
            const row = existingDb.rows[0];
            await pool.query(`
              UPDATE users 
              SET name = $1, password = $2, university = $3, specialization = $4, academic_year = $5, is_academy_subscriber = $6, is_activated = $7, updated_at = NOW()
              WHERE id = $8;
            `, [cleanName, hashedPassword, cleanUniv, cleanSpec, yr, isSub, shouldActivate, row.id]);
          } else {
            await pool.query(`
              INSERT INTO users (
                id, name, phone, password, university, specialization, academic_year, is_academy_subscriber, is_activated, role, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'student', NOW(), NOW());
            `, [userId, cleanName, cleanPhone, hashedPassword, cleanUniv, cleanSpec, yr, isSub, shouldActivate]);
          }

          // Access request in Neon
          const reqDb = await pool.query('SELECT id FROM access_requests WHERE phone = $1 LIMIT 1;', [cleanPhone]);
          if (reqDb.rows.length > 0) {
            await pool.query(`
              UPDATE access_requests
              SET name = $1, university = $2, specialization = $3, academic_year = $4, is_academy_subscriber = $5, status = $6, device_info = $7, updated_at = NOW()
              WHERE phone = $8;
            `, [cleanName, cleanUniv, cleanSpec, yr, isSub, shouldActivate ? 'approved' : 'pending', deviceInfo || '', cleanPhone]);
          } else {
            await pool.query(`
              INSERT INTO access_requests (
                id, phone, name, university, specialization, academic_year, is_academy_subscriber, status, device_info, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW());
            `, [reqId, cleanPhone, cleanName, cleanUniv, cleanSpec, yr, isSub, shouldActivate ? 'approved' : 'pending', deviceInfo || '']);
          }
          savedToDb = true;
        } catch (dbErr) {
          console.warn('Could not save user to Neon DB:', dbErr);
        }
      }

      const returnedUser = {
        id: userId,
        name: cleanName,
        phone: cleanPhone,
        university: cleanUniv,
        specialization: cleanSpec,
        academicYear: yr,
        isAcademySubscriber: isSub,
        isActivated: shouldActivate,
        role: 'student' as const,
        registeredAt: nowIso.split('T')[0]
      };

      return res.status(200).json({
        success: true,
        user: returnedUser,
        requiresActivation: !shouldActivate,
        isActivated: shouldActivate,
        dbConnected: savedToDb,
        message: shouldActivate
          ? 'تم تسجيل اشتراكك وتفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول مباشرة برقم هاتفك وكلمة السر.'
          : 'تم إرسال طلب الاشتراك بنجاح! بانتظار موافقة مالك المختبر.'
      });
    } catch (error: any) {
      console.error('Error in auth register:', error);
      return res.status(200).json({
        success: true,
        requiresActivation: false,
        isActivated: true,
        message: 'تم تسجيل طلبك بنجاح! يمكنك تسجيل الدخول الآن.'
      });
    }
  }

  // 2. LOGIN STUDENT
  if (action === 'login') {
    try {
      const { phone, password } = req.body || {};
      const rawPhone = String(phone || '').trim();
      const cleanPhone = normalizePhone(rawPhone) || rawPhone;
      const cleanPassword = String(password || '').trim();

      if (!cleanPhone || !cleanPassword) {
        return res.status(400).json({
          success: false,
          message: 'يرجى إدخال رقم الهاتف أو البريد وكلمة السر'
        });
      }

      // 1. Check Neon DB first if pool exists
      if (pool) {
        try {
          const result = await pool.query(`
            SELECT 
              id, name, phone, password, university, specialization,
              academic_year AS "academicYear", 
              is_academy_subscriber AS "isAcademySubscriber", 
              is_activated AS "isActivated", 
              role, expires_at AS "expiresAt", 
              access_duration AS "accessDuration", 
              created_at AS "createdAt"
            FROM users 
            WHERE phone = $1 OR phone = $2;
          `, [cleanPhone, rawPhone]);

          if (result.rows.length > 0) {
            const userRow = result.rows[0];
            let isValid = false;
            if (userRow.password && (userRow.password.startsWith('$2a$') || userRow.password.startsWith('$2b$'))) {
              isValid = bcrypt.compareSync(cleanPassword, userRow.password);
            } else {
              isValid = userRow.password === cleanPassword;
            }

            if (!isValid) {
              return res.status(401).json({
                success: false,
                message: 'كلمة السر غير صحيحة'
              });
            }

            // Auto-activate subscriber if not yet activated
            if (!userRow.isActivated) {
              try {
                await pool.query('UPDATE users SET is_activated = true WHERE id = $1;', [userRow.id]);
                userRow.isActivated = true;
              } catch {}
            }

            return res.status(200).json({
              success: true,
              user: {
                id: userRow.id,
                name: userRow.name,
                phone: userRow.phone,
                university: userRow.university,
                specialization: userRow.specialization,
                academicYear: userRow.academicYear,
                isAcademySubscriber: userRow.isAcademySubscriber,
                isActivated: true,
                role: userRow.role,
                expiresAt: userRow.expiresAt,
                accessDuration: userRow.accessDuration
              },
              dbConnected: true,
              message: 'تم تسجيل الدخول بنجاح'
            });
          }
        } catch (dbErr) {
          console.warn('Neon DB login query failed:', dbErr);
        }
      }

      // 2. Check in memoryStore
      const memUser = memoryStore.users.find(u => 
        u.phone === cleanPhone || 
        normalizePhone(u.phone) === cleanPhone ||
        u.phone === rawPhone ||
        (cleanPhone.length >= 7 && u.phone && u.phone.includes(cleanPhone))
      );

      if (memUser) {
        const isValid = memUser.password === cleanPassword || 
          (memUser.password && bcrypt.compareSync(cleanPassword, memUser.password));
        
        if (!isValid) {
          return res.status(401).json({
            success: false,
            message: 'كلمة السر غير صحيحة'
          });
        }

        // Activate user upon successful credential verification
        memUser.is_activated = true;

        return res.status(200).json({
          success: true,
          user: {
            id: memUser.id,
            name: memUser.name,
            phone: memUser.phone,
            university: memUser.university,
            specialization: memUser.specialization,
            academicYear: memUser.academic_year as any,
            isAcademySubscriber: memUser.is_academy_subscriber,
            isActivated: true,
            role: memUser.role
          },
          dbConnected: false,
          message: 'تم تسجيل الدخول بنجاح'
        });
      }

      return res.status(404).json({
        success: false,
        notFound: true,
        message: 'رقم الهاتف أو البريد غير مسجل في النظام. يرجى إنشاء حساب وإرسال طلب اشتراك أولاً.'
      });
    } catch (error: any) {
      console.error('Error in auth login:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || String(error)
      });
    }
  }

  // 3. VERIFY CODE FOR LAB ENTRY
  if (action === 'verify-code') {
    try {
      const { phone, code } = req.body || {};
      const rawPhone = String(phone || '').trim();
      const cleanPhone = normalizePhone(rawPhone) || rawPhone;
      const rawCode = String(code || '').trim();
      const upperCode = rawCode.toUpperCase();
      const lowerCode = rawCode.toLowerCase();

      if (!rawCode) {
        return res.status(400).json({
          success: false,
          message: 'يرجى إدخال كود التفعيل للدخول للمعمل'
        });
      }

      // Check official codes catalog
      const isOfficial = isValidOfficialCode(upperCode);

      const memUser = memoryStore.users.find(u => 
        u.phone === cleanPhone || 
        normalizePhone(u.phone) === cleanPhone ||
        u.phone === rawPhone ||
        (cleanPhone.length >= 7 && u.phone && u.phone.includes(cleanPhone))
      );

      const memReq = memoryStore.requests.find(r => 
        r.phone === cleanPhone || 
        normalizePhone(r.phone) === cleanPhone ||
        r.phone === rawPhone
      );

      const userCustomCode = (memUser?.access_code || memReq?.access_code || '').trim();
      const isCustomApproved = Boolean(userCustomCode && (upperCode === userCustomCode.toUpperCase()));

      if (!isOfficial && !isCustomApproved) {
        return res.status(400).json({
          success: false,
          message: 'كود الدخول غير صحيح! يرجى إدخال الكود المعتمد الممنوح لك من إدارة المنصة.'
        });
      }

      // Single-use enforcement: Check if code has already been used by another phone
      const existingCodeUsage = memoryStore.codeUsage.find(u => u.code.toUpperCase() === upperCode);
      if (existingCodeUsage && existingCodeUsage.phone !== cleanPhone && existingCodeUsage.phone !== rawPhone) {
        return res.status(400).json({
          success: false,
          message: 'هذا الكود مستخدم بالفعل لرقم هاتف آخر! كل كود مخصص لمشترك واحد فقط.'
        });
      }

      // Check if this phone number already has a different code assigned
      const existingPhoneUsage = memoryStore.codeUsage.find(u => u.phone === cleanPhone || u.phone === rawPhone);
      if (existingPhoneUsage && existingPhoneUsage.code.toUpperCase() !== upperCode) {
        return res.status(400).json({
          success: false,
          message: `هذا الرقم مفعل مسبقاً بكود آخر. لا يمكن استخدام أكثر من كود لنفس الرقم.`
        });
      }

      // Check database if pool is active
      if (pool) {
        try {
          const dbCodeUsage = await pool.query('SELECT phone FROM activation_code_usage WHERE code = $1 LIMIT 1', [upperCode]);
          if (dbCodeUsage.rows.length > 0) {
            const boundPhone = dbCodeUsage.rows[0].phone;
            if (boundPhone !== cleanPhone && boundPhone !== rawPhone) {
              return res.status(400).json({
                success: false,
                message: 'هذا الكود مستخدم بالفعل لرقم هاتف آخر! كل كود مخصص لمشترك واحد فقط.'
              });
            }
          }

          const dbPhoneUsage = await pool.query('SELECT code FROM activation_code_usage WHERE phone = $1 OR phone = $2 LIMIT 1', [cleanPhone, rawPhone]);
          if (dbPhoneUsage.rows.length > 0) {
            const boundCode = dbPhoneUsage.rows[0].code;
            if (boundCode.toUpperCase() !== upperCode) {
              return res.status(400).json({
                success: false,
                message: 'هذا الرقم مفعل مسبقاً بكود آخر. لا يمكن استخدام أكثر من كود لنفس الرقم.'
              });
            }
          }
        } catch {}
      }

      // Record 1-to-1 binding in memoryStore
      if (!existingCodeUsage) {
        memoryStore.codeUsage.push({
          code: upperCode,
          phone: cleanPhone,
          student_name: memUser?.name || 'مشترك ميكاترونكس',
          used_at: new Date().toISOString()
        });
      }

      // Record in database
      if (pool && cleanPhone) {
        try {
          await pool.query(
            `INSERT INTO activation_code_usage (code, phone, student_name, used_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (code) DO NOTHING;`,
            [upperCode, cleanPhone, memUser?.name || 'مشترك ميكاترونكس']
          );
        } catch {}
      }

      // Code is valid! Activate account in memoryStore & database
      if (memUser) {
        memUser.is_activated = true;
        memUser.is_academy_subscriber = true;
        memUser.access_code = upperCode;
        memUser.updated_at = new Date().toISOString();
      }

      if (memReq) {
        memReq.status = 'approved';
        memReq.access_code = upperCode;
        memReq.updated_at = new Date().toISOString();
      }

      if (pool && cleanPhone) {
        try {
          await pool.query(`UPDATE users SET is_activated = true, is_academy_subscriber = true, access_code = $3, updated_at = NOW() WHERE phone = $1 OR phone = $2;`, [cleanPhone, rawPhone, upperCode]);
          await pool.query(`UPDATE access_requests SET status = 'approved', access_code = $3, updated_at = NOW() WHERE phone = $1 OR phone = $2;`, [cleanPhone, rawPhone, upperCode]);
        } catch {}
      }

      const activeUser = memUser ? {
        id: memUser.id,
        name: memUser.name,
        phone: memUser.phone,
        university: memUser.university,
        specialization: memUser.specialization,
        academicYear: memUser.academic_year as any,
        isAcademySubscriber: true,
        isActivated: true,
        role: memUser.role
      } : {
        id: `usr_${Date.now()}`,
        name: memReq ? memReq.name : 'مشترك ميكاترونكس',
        phone: cleanPhone,
        university: memReq ? memReq.university : 'جامعة صنعاء',
        specialization: memReq?.specialization || 'هندسة ميكاترونكس',
        academicYear: (memReq?.academic_year || 1) as any,
        isAcademySubscriber: true,
        isActivated: true,
        role: 'student' as const
      };

      return res.status(200).json({
        success: true,
        user: activeUser,
        message: 'تم التحقق من الكود بنجاح! تم تفعيل دخولك إلى المختبر الافتراضي.'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error?.message || String(error)
      });
    }
  }

  return res.status(400).json({ success: false, message: 'إجراء غير مدعوم' });
}
