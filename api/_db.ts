import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

if (!neonConfig.webSocketConstructor) {
  neonConfig.webSocketConstructor = ws;
}

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || 
         process.env.POSTGRES_URL || 
         process.env.POSTGRES_PRISMA_URL ||
         process.env.POSTGRES_URL_NON_POOLING ||
         process.env.DATABASE_URL_UNPOOLED;
}

export function getPool(): Pool | null {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: true,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pool.on('error', (err: any) => {
      console.error('Unexpected error on idle Neon PostgreSQL client:', err);
    });
  }

  return pool;
}

export async function initDatabase(): Promise<{ success: boolean; message: string; tables?: string[] }> {
  const p = getPool();
  if (!p) {
    return {
      success: false,
      message: 'قاعدة البيانات السحابية غير مهيأة محلياً (DATABASE_URL غير متوفر في البيئة الحالية)'
    };
  }

  if (!initPromise) {
    initPromise = (async () => {
      const client = await p.connect();
      try {
        await client.query('BEGIN');

        // 1. Users table (حسابات الطلاب والمعلمين)
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            university VARCHAR(255) NOT NULL,
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

        // Migration safety: Add any columns if table was created in an earlier migration
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

        // Create index on phone for high-speed lookups
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
        `);

        // 2. Access requests table (طلبات الاشتراك والوصول المباشر)
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

        // 3. System settings table (كلمة سر المالك والإعدادات الديناميكية)
        await client.query(`
          CREATE TABLE IF NOT EXISTS system_settings (
            key VARCHAR(64) PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);

        // Seed default owner password if not exists
        await client.query(`
          INSERT INTO system_settings (key, value, updated_at)
          VALUES ('owner_password', '785502919', NOW())
          ON CONFLICT (key) DO NOTHING;
        `);

        await client.query('COMMIT');
        console.log('✅ Neon PostgreSQL tables initialized & verified (users, access_requests, system_settings)');
      } catch (err) {
        await client.query('ROLLBACK');
        initPromise = null;
        throw err;
      } finally {
        client.release();
      }
    })();
  }

  try {
    await initPromise;
    return {
      success: true,
      message: 'تم تهيئة جداول Neon بنجاح',
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
      message: 'لم يتم العثور على DATABASE_URL في البيئة السحابية'
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
    // 1. WRITE TEST
    await p.query(
      `INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, NOW()) 
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
      [testKey, testVal]
    );
    const writeLatency = Date.now() - writeStart;

    // 2. READ TEST
    const readStart = Date.now();
    const readRes = await p.query(`SELECT value, updated_at FROM system_settings WHERE key = $1;`, [testKey]);
    const readLatency = Date.now() - readStart;

    // 3. CLEANUP TEST RECORD
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
