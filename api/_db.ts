import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let initPromise: Promise<void> | null = null;
let customDatabaseUrl: string | null = null;

export function setCustomDatabaseUrl(url: string | null) {
  customDatabaseUrl = url && url.trim() ? url.trim() : null;
  if (pool) {
    pool.end().catch(() => {});
    pool = null;
    initPromise = null;
  }
}

export function getDatabaseUrl(): string | undefined {
  return customDatabaseUrl ||
         process.env.DATABASE_URL || 
         process.env.POSTGRES_URL || 
         process.env.POSTGRES_PRISMA_URL ||
         process.env.POSTGRES_URL_NON_POOLING ||
         process.env.DATABASE_URL_UNPOOLED;
}

export function getPool(): pg.Pool | null {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    try {
      pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false
        },
        max: 8,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 8000
      });

      pool.on('error', (err: any) => {
        console.warn('PostgreSQL idle client warning:', err?.message || err);
      });
    } catch (e) {
      console.error('Failed to construct pg.Pool:', e);
      return null;
    }
  }

  return pool;
}

// Global fallback in-memory store so NO student subscription is EVER lost even when database URL is not configured
export interface MemoryUser {
  id: string;
  name: string;
  phone: string;
  password?: string;
  university: string;
  specialization?: string;
  academic_year: number;
  is_academy_subscriber: boolean;
  is_activated: boolean;
  role: 'student' | 'owner';
  expires_at?: string;
  access_duration?: string;
  access_code?: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryRequest {
  id: string;
  phone: string;
  name: string;
  university: string;
  specialization?: string;
  email?: string;
  academic_year: number;
  is_academy_subscriber: boolean;
  status: 'pending' | 'approved' | 'rejected';
  device_info?: string;
  notes?: string;
  access_code?: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryCodeUsage {
  code: string;
  phone: string;
  student_name?: string;
  used_at: string;
}

// Persistent shared storage across requests in memory
export const memoryStore = {
  users: [
    {
      id: 'usr_demo_1',
      name: 'أحمد علي الذماري',
      phone: '771234567',
      password: '123',
      university: 'جامعة صنعاء',
      specialization: 'هندسة ميكاترونكس',
      academic_year: 1,
      is_academy_subscriber: true,
      is_activated: true,
      role: 'student' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr_demo_2',
      name: 'سارة محمد الحكيمي',
      phone: '779876543',
      password: '123',
      university: 'جامعة العلوم والتكنولوجيا (UST)',
      specialization: 'هندسة تحكم وروبوتات',
      academic_year: 2,
      is_academy_subscriber: true,
      is_activated: true,
      role: 'student' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ] as MemoryUser[],
  requests: [] as MemoryRequest[],
  codeUsage: [] as MemoryCodeUsage[],
  settings: {
    owner_password: '785502919',
    auto_activate_subscribers: 'true'
  } as Record<string, string>
};

export function normalizePhone(raw: string): string {
  if (!raw) return '';
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let cleaned = String(raw).trim();
  for (let i = 0; i < 10; i++) {
    cleaned = cleaned.replaceAll(arabicNumerals[i], String(i));
    cleaned = cleaned.replaceAll(persianNumerals[i], String(i));
  }
  if (cleaned.includes('@')) {
    return cleaned.toLowerCase().trim();
  }
  cleaned = cleaned.replace(/\D/g, '');
  if (cleaned.startsWith('00967')) {
    cleaned = cleaned.substring(5);
  } else if (cleaned.startsWith('967')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.startsWith('0') && cleaned.length >= 9) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

export async function initDatabase(): Promise<{ success: boolean; message: string; tables?: string[] }> {
  const p = getPool();
  if (!p) {
    return {
      success: false,
      message: 'قاعدة البيانات السحابية غير مهيأة محلياً (DATABASE_URL غير متوفر). النظام يعمل بنمط الذاكرة الاحتياطية المتزامنة.'
    };
  }

  if (!initPromise) {
    initPromise = (async () => {
      let client;
      try {
        client = await p.connect();
        await client.query('BEGIN');

        // 1. Users table
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            university VARCHAR(255) NOT NULL,
            specialization VARCHAR(255) DEFAULT 'هندسة ميكاترونكس',
            academic_year INT DEFAULT 1,
            is_academy_subscriber BOOLEAN DEFAULT FALSE,
            is_activated BOOLEAN DEFAULT FALSE,
            role VARCHAR(32) DEFAULT 'student',
            expires_at VARCHAR(64),
            access_duration VARCHAR(64),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);

        await client.query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT 'student';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS expires_at VARCHAR(64);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS access_duration VARCHAR(64);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS is_academy_subscriber BOOLEAN DEFAULT FALSE;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS is_activated BOOLEAN DEFAULT FALSE;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS university VARCHAR(255) DEFAULT 'جامعة العلوم والتكنولوجيا';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization VARCHAR(255) DEFAULT 'هندسة ميكاترونكس';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_year INT DEFAULT 1;
        `);

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
        `);

        // 2. Access requests table
        await client.query(`
          CREATE TABLE IF NOT EXISTS access_requests (
            id VARCHAR(64) PRIMARY KEY,
            phone VARCHAR(50) NOT NULL,
            name VARCHAR(255) NOT NULL,
            university VARCHAR(255) NOT NULL,
            specialization VARCHAR(255) DEFAULT 'هندسة ميكاترونكس',
            email VARCHAR(255),
            academic_year INT DEFAULT 1,
            is_academy_subscriber BOOLEAN DEFAULT FALSE,
            status VARCHAR(32) DEFAULT 'pending',
            device_info TEXT,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);

        await client.query(`
          ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'pending';
          ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS device_info TEXT;
          ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS notes TEXT;
          ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS is_academy_subscriber BOOLEAN DEFAULT FALSE;
          ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS university VARCHAR(255) DEFAULT 'جامعة صنعاء';
          ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS specialization VARCHAR(255) DEFAULT 'هندسة ميكاترونكس';
          ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS email VARCHAR(255);
          ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS academic_year INT DEFAULT 1;
        `);

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_access_requests_phone ON access_requests(phone);
          CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
        `);

        // 3. System settings table
        await client.query(`
          CREATE TABLE IF NOT EXISTS system_settings (
            key VARCHAR(64) PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);

        await client.query(`
          INSERT INTO system_settings (key, value, updated_at)
          VALUES ('owner_password', '785502919', NOW())
          ON CONFLICT (key) DO NOTHING;
        `);

        // 4. Activation code usage table (Single-use per phone)
        await client.query(`
          CREATE TABLE IF NOT EXISTS activation_code_usage (
            id SERIAL PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            phone VARCHAR(50) NOT NULL,
            student_name VARCHAR(255),
            used_at TIMESTAMPTZ DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_code_usage_code ON activation_code_usage(code);
          CREATE INDEX IF NOT EXISTS idx_code_usage_phone ON activation_code_usage(phone);
        `);

        await client.query('COMMIT');
        console.log('✅ Neon PostgreSQL tables initialized');
      } catch (err) {
        if (client) {
          try { await client.query('ROLLBACK'); } catch {}
        }
        initPromise = null;
        throw err;
      } finally {
        if (client) client.release();
      }
    })();
  }

  try {
    await initPromise;
    return {
      success: true,
      message: 'تم تهيئة جداول Neon بنجاح (users, access_requests, system_settings)',
      tables: ['users', 'access_requests', 'system_settings']
    };
  } catch (error: any) {
    return {
      success: false,
      message: `فشل تهيئة جداول Neon: ${error?.message || String(error)}`
    };
  }
}

export async function testDatabaseConnection() {
  const p = getPool();
  if (!p) {
    return {
      connected: false,
      hasDatabaseUrl: false,
      message: 'لم يتم العثور على DATABASE_URL في البيئة السحابية. يعمل النظام في نمط الذاكرة الاحتياطية المتزامنة.'
    };
  }

  const startTime = Date.now();
  try {
    const initRes = await initDatabase();
    const result = await p.query(`
      SELECT 
        NOW() AS server_time,
        current_database() AS database_name,
        version() AS pg_version,
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE is_activated = true) AS activated_users,
        (SELECT COUNT(*) FROM access_requests) AS total_requests,
        (SELECT COUNT(*) FROM access_requests WHERE status = 'pending') AS pending_requests;
    `);

    const latency = Date.now() - startTime;
    const row = result.rows[0];

    return {
      connected: true,
      hasDatabaseUrl: true,
      latencyMs: latency,
      databaseName: row.database_name,
      pgVersion: row.pg_version,
      stats: {
        totalUsers: parseInt(row.total_users || '0', 10),
        activatedUsers: parseInt(row.activated_users || '0', 10),
        totalRequests: parseInt(row.total_requests || '0', 10),
        pendingRequests: parseInt(row.pending_requests || '0', 10)
      },
      initResult: initRes,
      message: `متصل بنجاح مع Neon (${row.database_name}) بزمن استجابة ${latency}ms`
    };
  } catch (error: any) {
    return {
      connected: false,
      hasDatabaseUrl: true,
      error: error?.message || String(error),
      message: `فشل الاتصال بقاعدة بيانات Neon: ${error?.message || String(error)}`
    };
  }
}

export async function testReadWriteDatabase() {
  const p = getPool();
  if (!p) {
    return {
      success: false,
      connected: false,
      message: 'DATABASE_URL غير متوفر للاختبار'
    };
  }

  const testKey = `_rw_test_${Date.now()}`;
  const testVal = `neon_rw_verify_${Math.random().toString(36).substring(2, 9)}`;
  const writeStart = Date.now();

  try {
    await initDatabase();
    await p.query(
      `INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, NOW()) 
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
      [testKey, testVal]
    );
    const writeLatency = Date.now() - writeStart;

    const readStart = Date.now();
    const readRes = await p.query(`SELECT value, updated_at FROM system_settings WHERE key = $1;`, [testKey]);
    const readLatency = Date.now() - readStart;

    await p.query(`DELETE FROM system_settings WHERE key = $1;`, [testKey]);

    const readBackVal = readRes.rows.length > 0 ? readRes.rows[0].value : null;
    const matched = readBackVal === testVal;

    return {
      success: matched,
      connected: true,
      writeLatencyMs: writeLatency,
      readLatencyMs: readLatency,
      totalRoundTripMs: writeLatency + readLatency,
      testKey,
      matched,
      message: matched 
        ? `نجح اختبار الكتابة والقراءة على Neon! كتابة: ${writeLatency}ms، قراءة: ${readLatency}ms` 
        : `فشل التحقق: القيمة المكتوبة غير مطابقة للقيمة المقروءة`
    };
  } catch (err: any) {
    return {
      success: false,
      connected: false,
      error: err?.message || String(err),
      message: `خطأ في اختبار القراءة والكتابة على Neon: ${err?.message || String(err)}`
    };
  }
}

export default async function handler(req: any, res: any) {
  const result = await testDatabaseConnection();
  return res.status(200).json(result);
}
