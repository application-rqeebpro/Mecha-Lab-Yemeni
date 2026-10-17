import { StudentUser, Experiment, AcademicYear, AccessRequest } from '../types/mechatronics';

const USERS_STORAGE_KEY = 'yemen_mechatronics_users_v1';
const REQUESTS_STORAGE_KEY = 'yemen_mechatronics_requests_v1';
const CURRENT_USER_KEY = 'yemen_mechatronics_current_user_v1';
const CUSTOM_LESSONS_KEY = 'yemen_mechatronics_custom_lessons_v1';
const OWNER_PASSWORD_STORAGE_KEY = 'yemen_mechatronics_owner_pwd_v1';
const DB_STATUS_CACHE_KEY = 'yemen_mechatronics_db_status_cache';

// Default master recovery keys for the owner (primary: owner's direct phone number 785502919)
export const DEFAULT_OWNER_PASSWORD = '785502919';
export const MASTER_OWNER_PASSWORDS = ['785502919', 'mechatronics2026', 'admin785502919', 'owner@yemen'];

// Initial seeded mock users as local fallback
const INITIAL_USERS: StudentUser[] = [
  {
    id: 'usr_demo_1',
    name: 'أحمد علي الذماري',
    phone: '771234567',
    password: '123',
    university: 'جامعة صنعاء',
    academicYear: 1,
    isAcademySubscriber: true,
    isActivated: true,
    registeredAt: '2026-03-15',
    role: 'student'
  },
  {
    id: 'usr_demo_2',
    name: 'سارة محمد الحكيمي',
    phone: '779876543',
    password: '123',
    university: 'جامعة العلوم والتكنولوجيا (UST)',
    academicYear: 2,
    isAcademySubscriber: true,
    isActivated: true,
    registeredAt: '2026-03-20',
    role: 'student'
  },
  {
    id: 'usr_demo_3',
    name: 'حسين ناصر اليافعي',
    phone: '734567890',
    password: '123',
    university: 'جامعة عدن',
    academicYear: 3,
    isAcademySubscriber: false,
    isActivated: false,
    registeredAt: '2026-03-22',
    role: 'student'
  }
];

export interface NeonDbStatus {
  connected: boolean;
  hasDatabaseUrl: boolean;
  databaseName?: string;
  latencyMs?: number;
  pgVersion?: string;
  stats?: {
    totalUsers: number;
    activatedUsers: number;
    totalRequests: number;
    pendingRequests: number;
  };
  maskedDatabaseUrl?: string;
  message?: string;
  error?: string;
}

export const authStorage = {
  // Local storage cache getters and setters
  getUsers(): StudentUser[] {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: StudentUser[]) {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  },

  getAccessRequests(): AccessRequest[] {
    try {
      const data = localStorage.getItem(REQUESTS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAccessRequests(requests: AccessRequest[]) {
    try {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    } catch (e) {
      console.error('Failed to save requests', e);
    }
  },

  getCurrentUser(): StudentUser | null {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: StudentUser | null) {
    try {
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (e) {
      console.error('Failed to set current user', e);
    }
  },

  getOwnerPassword(): string {
    try {
      const custom = localStorage.getItem(OWNER_PASSWORD_STORAGE_KEY);
      return (custom && custom.trim()) ? custom.trim() : DEFAULT_OWNER_PASSWORD;
    } catch {
      return DEFAULT_OWNER_PASSWORD;
    }
  },

  getOwnerToken(): string {
    try {
      const token = sessionStorage.getItem('owner_auth_token') || localStorage.getItem(OWNER_PASSWORD_STORAGE_KEY) || DEFAULT_OWNER_PASSWORD;
      return token.trim();
    } catch {
      return DEFAULT_OWNER_PASSWORD;
    }
  },

  setOwnerToken(token: string) {
    try {
      sessionStorage.setItem('owner_auth_token', token.trim());
      localStorage.setItem(OWNER_PASSWORD_STORAGE_KEY, token.trim());
    } catch {}
  },

  getOwnerHeaders(): Record<string, string> {
    const token = this.getOwnerToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-owner-password': token
    };
  },

  setOwnerPassword(newPassword: string): { success: boolean; message: string } {
    const clean = newPassword.trim();
    if (!clean || clean.length < 4) {
      return { success: false, message: 'كلمة السر يجب أن تتكون من 4 خانات على الأقل' };
    }
    try {
      this.setOwnerToken(clean);
      // Also sync to Neon DB in background
      this.updateOwnerPasswordInDatabase(clean).catch(() => {});
      return { success: true, message: `تم تحديث كلمة سر المالك بنجاح: (${clean})` };
    } catch {
      return { success: false, message: 'فشل حفظ كلمة السر' };
    }
  },

  resetOwnerPassword(): { success: boolean; password: string } {
    try {
      this.setOwnerToken(DEFAULT_OWNER_PASSWORD);
      this.updateOwnerPasswordInDatabase(DEFAULT_OWNER_PASSWORD).catch(() => {});
    } catch {}
    return { success: true, password: DEFAULT_OWNER_PASSWORD };
  },

  // ==========================================
  // NEON POSTGRESQL CLOUD DATABASE INTEGRATION
  // ==========================================
  async checkDatabaseStatus(): Promise<NeonDbStatus> {
    try {
      const res = await fetch('/api/db-status', {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data: NeonDbStatus = await res.json();
        localStorage.setItem(DB_STATUS_CACHE_KEY, JSON.stringify(data));
        return data;
      }
      return {
        connected: false,
        hasDatabaseUrl: false,
        message: `رمز الاستجابة: ${res.status}`
      };
    } catch (error: any) {
      return {
        connected: false,
        hasDatabaseUrl: false,
        message: 'تعذر الاتصال بـ /api/db-status'
      };
    }
  },

  // Full asynchronous login contacting Neon DB first, then fallback to local
  async loginUserAsync(phone: string, password: string): Promise<{
    success: boolean;
    user?: StudentUser;
    message: string;
    notActivated?: boolean;
    dbConnected?: boolean;
  }> {
    const cleanPhone = phone.trim();
    const cleanPass = password.trim();

    try {
      const response = await fetch('/api/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', phone: cleanPhone, password: cleanPass })
      });
      const data = await response.json();

      if (response.ok && data.success && data.user) {
        this.setCurrentUser(data.user);
        // Sync into local users cache
        const localUsers = this.getUsers();
        const idx = localUsers.findIndex(u => u.phone === cleanPhone);
        if (idx !== -1) {
          localUsers[idx] = data.user;
        } else {
          localUsers.push(data.user);
        }
        this.saveUsers(localUsers);

        return {
          success: true,
          user: data.user,
          message: data.message || 'تم تسجيل الدخول عبر Neon',
          dbConnected: true
        };
      }

      if (data.notActivated) {
        return {
          success: false,
          notActivated: true,
          user: data.user,
          message: data.message || 'الحساب مسجل ولكن بانتظار تفعيل المالك',
          dbConnected: true
        };
      }

      if (response.status === 401 || response.status === 403 || response.status === 404 || response.status === 409) {
        return {
          success: false,
          message: data.message || 'بيانات الدخول غير صحيحة',
          dbConnected: true
        };
      }
    } catch (e) {
      console.warn('Network call to Neon DB failed, checking local cache:', e);
    }

    // Fallback to local storage if network is offline
    return this.loginUser(cleanPhone, cleanPass);
  },

  loginUser(phone: string, password: string): { success: boolean; user?: StudentUser; message: string; notActivated?: boolean } {
    const users = this.getUsers();
    const cleanPhone = phone.trim();
    const user = users.find(u => u.phone === cleanPhone);

    if (!user) {
      return { success: false, message: 'رقم الهاتف غير مسجل في النظام' };
    }

    if (user.password !== password) {
      return { success: false, message: 'كلمة السر غير صحيحة' };
    }

    if (!user.isActivated) {
      return { 
        success: false, 
        user,
        notActivated: true, 
        message: 'الحساب بانتظار التفعيل من قبل المالك عبر واتساب 785502919' 
      };
    }

    if (user.expiresAt && user.expiresAt !== 'unlimited') {
      const expDate = new Date(user.expiresAt);
      if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
        return {
          success: false,
          user,
          notActivated: true,
          message: `انتهت صلاحية وصول هذا الحساب في (${user.expiresAt}). يرجى التواصل مع المالك 785502919 لتجديد الاشتراك.`
        };
      }
    }

    this.setCurrentUser(user);
    return { success: true, user, message: 'تم تسجيل الدخول بنجاح' };
  },

  // Full asynchronous registration to Neon DB
  async registerUserAsync(payload: {
    name: string;
    phone: string;
    password: string;
    university: string;
    academicYear?: AcademicYear;
    isAcademySubscriber: boolean;
  }): Promise<{
    success: boolean;
    user?: StudentUser;
    message: string;
    requiresActivation?: boolean;
    dbConnected?: boolean;
  }> {
    const cleanPhone = payload.phone.trim();
    const cleanName = payload.name.trim();

    try {
      const response = await fetch('/api/auth?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          ...payload,
          phone: cleanPhone,
          name: cleanName,
          deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : ''
        })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        // Also save to local storage cache
        const localUsers = this.getUsers();
        const existingIdx = localUsers.findIndex(u => u.phone === cleanPhone);
        if (existingIdx !== -1) {
          localUsers[existingIdx] = data.user;
        } else {
          localUsers.push(data.user);
        }
        this.saveUsers(localUsers);

        return {
          success: true,
          user: data.user,
          requiresActivation: true,
          message: data.message || 'تم إرسال الطلب وحفظ الحساب في Neon بنجاح',
          dbConnected: true
        };
      }

      if (data.alreadyExists) {
        return {
          success: false,
          message: data.message || 'رقم الهاتف مسجل مسبقاً',
          dbConnected: true
        };
      }

      if (data.message || data.error) {
        return { success: false, message: data.message || data.error, dbConnected: Boolean(data.dbConnected) };
      }
    } catch (e) {
      console.warn('Network call to /api/auth failed, attempting /api/requests fallback:', e);
      try {
        const reqRes = await fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            name: cleanName,
            university: payload.university,
            academicYear: payload.academicYear || 1,
            isAcademySubscriber: payload.isAcademySubscriber,
            deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : ''
          })
        });
        const reqData = await reqRes.json();
        if (reqRes.ok && reqData.success) {
          const fallbackUser: StudentUser = {
            id: reqData.requestId || `usr_${Date.now()}`,
            name: cleanName,
            phone: cleanPhone,
            password: payload.password,
            university: payload.university,
            academicYear: payload.academicYear || 1,
            isAcademySubscriber: payload.isAcademySubscriber,
            isActivated: false,
            registeredAt: new Date().toISOString().split('T')[0],
            role: 'student'
          };
          const localUsers = this.getUsers();
          localUsers.push(fallbackUser);
          this.saveUsers(localUsers);

          return {
            success: true,
            user: fallbackUser,
            requiresActivation: true,
            message: 'تم تسجيل الطلب وحفظه في Neon بنجاح! بانتظار موافقة الإدارة.',
            dbConnected: true
          };
        }
      } catch (err2) {
        console.error('Secondary request to /api/requests failed:', err2);
      }
    }

    // Do NOT show a fake success! Return error so the user knows server was not reached!
    return {
      success: false,
      message: 'تعذر الاتصال بخادم قاعدة البيانات السحابية. يرجى التحقق من اتصال الإنترنت أو التواصل مع المالك 785502919.',
      dbConnected: false
    };
  },

  registerUser(payload: {
    name: string;
    phone: string;
    password: string;
    university: string;
    academicYear?: AcademicYear;
    isAcademySubscriber: boolean;
  }): { success: boolean; user?: StudentUser; message: string; requiresActivation?: boolean } {
    const users = this.getUsers();
    const cleanPhone = payload.phone.trim();

    if (!cleanPhone || !payload.name || !payload.password) {
      return { success: false, message: 'يرجى إكمال جميع الحقول المطلوبة' };
    }

    const existing = users.find(u => u.phone === cleanPhone);
    if (existing) {
      return { success: false, message: 'رقم الهاتف مسجل مسبقاً' };
    }

    const newUser: StudentUser = {
      id: `usr_${Date.now()}`,
      name: payload.name.trim(),
      phone: cleanPhone,
      password: payload.password,
      university: payload.university,
      academicYear: payload.academicYear || 1,
      isAcademySubscriber: payload.isAcademySubscriber,
      isActivated: false,
      registeredAt: new Date().toISOString().split('T')[0],
      role: 'student'
    };

    users.push(newUser);
    this.saveUsers(users);

    return {
      success: true,
      user: newUser,
      requiresActivation: true,
      message: 'تم تسجيل الحساب بنجاح وهو بانتظار تفعيل المالك'
    };
  },

  // Submit quick access request (no password needed) directly to Neon DB
  async submitQuickAccessRequest(payload: {
    phone: string;
    name: string;
    university?: string;
    academicYear?: AcademicYear;
    isAcademySubscriber?: boolean;
    notes?: string;
  }): Promise<{ success: boolean; message: string; requestId?: string; dbConnected?: boolean }> {
    const cleanPhone = payload.phone.trim();
    const cleanName = payload.name.trim();

    if (!cleanPhone || cleanPhone.length < 6) {
      return { success: false, message: 'رقم الهاتف مطلوب (6 أرقام على الأقل)' };
    }
    if (!cleanName) {
      return { success: false, message: 'اسم الطالب مطلوب' };
    }

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          name: cleanName,
          university: payload.university || 'جامعة العلوم والتكنولوجيا',
          academicYear: payload.academicYear || 1,
          isAcademySubscriber: Boolean(payload.isAcademySubscriber),
          deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          notes: payload.notes
        })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || 'تم إرسال طلب الوصول إلى قاعدة بيانات Neon بنجاح',
          requestId: data.requestId,
          dbConnected: true
        };
      }

      return {
        success: false,
        message: data.message || 'فشل إرسال الطلب',
        dbConnected: Boolean(data.dbConnected)
      };
    } catch (e: any) {
      return {
        success: false,
        message: 'فشل الاتصال بالخادم، يرجى التحقق من الشبكة',
        dbConnected: false
      };
    }
  },

  // Check specific phone request status from Neon DB
  async checkMyRequestStatus(phone: string): Promise<{
    found: boolean;
    phone: string;
    status?: string;
    isActivated?: boolean;
    message?: string;
    request?: AccessRequest;
  }> {
    try {
      const res = await fetch(`/api/requests?phone=${encodeURIComponent(phone.trim())}`);
      if (res.ok) {
        return await res.json();
      }
      return { found: false, phone, message: `رمز الاستجابة: ${res.status}` };
    } catch {
      return { found: false, phone, message: 'تعذر الاتصال بالخادم' };
    }
  },

  // Owner data sync with Neon DB (Strictly authorized)
  async getOwnerDataFromDatabase(): Promise<{
    success: boolean;
    users: StudentUser[];
    requests: AccessRequest[];
    ownerPassword?: string;
    stats?: { totalUsers: number; activatedUsers: number; pendingRequests: number };
    dbConnected: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/owner?action=data', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.getOwnerToken()}`,
          'x-owner-password': this.getOwnerToken()
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.dbConnected && Array.isArray(data.users)) {
          this.saveUsers(data.users);
          if (Array.isArray(data.requests)) {
            this.saveAccessRequests(data.requests);
          }
          if (data.ownerPassword) {
            this.setOwnerToken(data.ownerPassword);
          }
          return {
            success: true,
            users: data.users,
            requests: data.requests || [],
            ownerPassword: data.ownerPassword,
            stats: data.stats,
            dbConnected: true
          };
        }
      } else if (response.status === 401) {
        return {
          success: false,
          users: this.getUsers(),
          requests: this.getAccessRequests(),
          ownerPassword: this.getOwnerPassword(),
          dbConnected: true,
          error: 'غير مصرح للوصول'
        };
      }
    } catch (e: any) {
      console.warn('Failed to fetch owner data from Neon DB:', e);
    }

    // Fallback to local storage
    return {
      success: false,
      users: this.getUsers(),
      requests: this.getAccessRequests(),
      ownerPassword: this.getOwnerPassword(),
      dbConnected: false
    };
  },

  // Owner activates student in Neon DB
  async activateUserByPhoneInDatabase(phone: string): Promise<{ success: boolean; message: string; user?: StudentUser }> {
    const cleanPhone = phone.trim();
    try {
      const response = await fetch('/api/owner', {
        method: 'POST',
        headers: this.getOwnerHeaders(),
        body: JSON.stringify({ action: 'activate-phone', phone: cleanPhone })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Also update local storage
        this.activateUserByPhone(cleanPhone);
        return { success: true, message: data.message, user: data.user };
      }
      if (data.message || data.error) {
        return { success: false, message: data.message || data.error };
      }
    } catch (e) {
      console.warn('Could not activate on Neon DB, updating local storage:', e);
    }
    return this.activateUserByPhone(cleanPhone);
  },

  // Owner rejects request in Neon DB
  async rejectRequestInDatabase(requestId: string, phone?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/owner', {
        method: 'POST',
        headers: this.getOwnerHeaders(),
        body: JSON.stringify({ action: 'reject-request', requestId, phone })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const reqs = this.getAccessRequests().map(r => r.id === requestId ? { ...r, status: 'rejected' as const } : r);
        this.saveAccessRequests(reqs);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || data.error || 'فشل رفض الطلب' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'خطأ في الشبكة' };
    }
  },

  // Owner toggles user activation in Neon DB
  async toggleUserActivationInDatabase(userId: string): Promise<{ success: boolean; isActivated: boolean }> {
    try {
      const response = await fetch('/api/owner', {
        method: 'POST',
        headers: this.getOwnerHeaders(),
        body: JSON.stringify({ action: 'toggle-activation', userId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.toggleUserActivation(userId);
        return { success: true, isActivated: data.isActivated };
      }
    } catch (e) {
      console.warn('Could not toggle on Neon DB, updating local storage:', e);
    }
    return this.toggleUserActivation(userId);
  },

  // Owner creates account directly in Neon DB
  async createAccountByOwnerInDatabase(payload: {
    phone: string;
    password?: string;
    duration: '1month' | '3months' | '6months' | '1year' | 'unlimited';
    name?: string;
    university?: string;
    academicYear?: AcademicYear;
  }): Promise<{
    success: boolean;
    user?: StudentUser;
    plainPassword?: string;
    message: string;
    expiresAtText: string;
    dbConnected?: boolean;
  }> {
    try {
      const response = await fetch('/api/owner', {
        method: 'POST',
        headers: this.getOwnerHeaders(),
        body: JSON.stringify({
          action: 'create-account',
          ...payload
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Also save to local storage cache
        const localRes = this.createAccountByOwner(payload);
        return {
          success: true,
          user: data.user || localRes.user,
          plainPassword: data.plainPassword || localRes.plainPassword,
          expiresAtText: data.expiresAtText || localRes.expiresAtText,
          message: data.message || localRes.message,
          dbConnected: true
        };
      }
    } catch (e) {
      console.warn('Could not create account on Neon DB, falling back to local storage:', e);
    }

    const localRes = this.createAccountByOwner(payload);
    return {
      ...localRes,
      dbConnected: false
    };
  },

  // Update owner password in Neon DB
  async updateOwnerPasswordInDatabase(newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/owner', {
        method: 'POST',
        headers: this.getOwnerHeaders(),
        body: JSON.stringify({ action: 'update-password', newPassword })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.setOwnerToken(newPassword);
        return { success: true, message: data.message };
      }
    } catch (e) {
      console.warn('Could not update password on Neon DB:', e);
    }
    return { success: true, message: `تم تحديث كلمة السر محلياً: (${newPassword})` };
  },

  // Test real read/write to Neon DB
  async testDatabaseReadWrite(): Promise<{
    success: boolean;
    connected: boolean;
    writeLatencyMs?: number;
    readLatencyMs?: number;
    totalRoundTripMs?: number;
    message: string;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/db-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-rw' })
      });
      const data = await response.json();
      return data;
    } catch (e: any) {
      return {
        success: false,
        connected: false,
        message: `تعذر الاتصال بـ /api/db-status: ${e?.message || String(e)}`
      };
    }
  },

  // Force database schema init / sync
  async forceDatabaseInit(): Promise<{ success: boolean; message: string; tables?: string[] }> {
    try {
      const response = await fetch('/api/db-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init' })
      });
      const data = await response.json();
      return data;
    } catch (e: any) {
      return {
        success: false,
        message: `فشل إعادة التهيئة: ${e?.message || String(e)}`
      };
    }
  },

  // Update specific student access (duration, password) in Neon DB
  async updateUserAccessInDatabase(payload: {
    userId?: string;
    phone: string;
    newPassword?: string;
    duration?: '1month' | '3months' | '6months' | '1year' | 'unlimited';
  }): Promise<{
    success: boolean;
    user?: StudentUser;
    plainPassword?: string;
    expiresAtText?: string;
    message: string;
  }> {
    try {
      const response = await fetch('/api/owner', {
        method: 'POST',
        headers: this.getOwnerHeaders(),
        body: JSON.stringify({
          action: 'update-user-access',
          ...payload
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return data;
      }
      if (data.message) {
        return { success: false, message: data.message };
      }
    } catch (e) {
      console.warn('Could not update user access on Neon DB:', e);
    }

    // Local fallback update
    const users = this.getUsers();
    const idx = users.findIndex(u => u.phone === payload.phone || u.id === payload.userId);
    if (idx !== -1) {
      if (payload.newPassword) users[idx].password = payload.newPassword;
      if (payload.duration) {
        users[idx].accessDuration = payload.duration;
        if (payload.duration === 'unlimited') {
          users[idx].expiresAt = 'unlimited';
        } else {
          const d = new Date();
          const days = payload.duration === '1month' ? 30 : payload.duration === '3months' ? 90 : payload.duration === '6months' ? 180 : 365;
          users[idx].expiresAt = new Date(d.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
      }
      this.saveUsers(users);
      return {
        success: true,
        user: users[idx],
        plainPassword: payload.newPassword,
        expiresAtText: users[idx].expiresAt,
        message: 'تم تحديث البيانات محلياً'
      };
    }

    return { success: false, message: 'المستخدم غير موجود' };
  },

  // Delete user from Neon DB
  async deleteUserFromDatabase(userId: string, phone?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/owner', {
        method: 'POST',
        headers: this.getOwnerHeaders(),
        body: JSON.stringify({ action: 'delete-user', userId, phone })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Also remove from local
        const users = this.getUsers().filter(u => u.id !== userId && u.phone !== phone);
        this.saveUsers(users);
        return { success: true, message: data.message };
      }
    } catch (e) {
      console.warn('Could not delete from Neon DB, removing locally:', e);
    }
    const users = this.getUsers().filter(u => u.id !== userId && u.phone !== phone);
    this.saveUsers(users);
    return { success: true, message: 'تم الحذف محلياً' };
  },

  // Delete request from Neon DB
  async deleteRequestFromDatabase(requestId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/owner', {
        method: 'POST',
        headers: this.getOwnerHeaders(),
        body: JSON.stringify({ action: 'delete-request', requestId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const reqs = this.getAccessRequests().filter(r => r.id !== requestId);
        this.saveAccessRequests(reqs);
        return { success: true, message: data.message };
      }
    } catch (e) {
      console.warn('Could not delete request from Neon DB:', e);
    }
    const reqs = this.getAccessRequests().filter(r => r.id !== requestId);
    this.saveAccessRequests(reqs);
    return { success: true, message: 'تم الحذف محلياً' };
  },

  // Owner Account Creation in local storage
  createAccountByOwner(payload: {
    phone: string;
    password?: string;
    duration: '1month' | '3months' | '6months' | '1year' | 'unlimited';
    name?: string;
    university?: string;
    academicYear?: AcademicYear;
  }): { 
    success: boolean; 
    user?: StudentUser; 
    plainPassword?: string; 
    message: string; 
    isUpdate?: boolean; 
    expiresAtText: string; 
  } {
    const cleanPhone = payload.phone.trim();
    if (!cleanPhone || cleanPhone.length < 6) {
      return {
        success: false,
        message: 'رقم الهاتف مطلوب (6 أرقام على الأقل)',
        expiresAtText: ''
      };
    }

    const plainPassword = payload.password && payload.password.trim() 
      ? payload.password.trim() 
      : `${Math.floor(100000 + Math.random() * 900000)}EUI`;

    let expiresAt: string | undefined = undefined;
    let expiresAtText = 'دائم بدون انتهاء';
    const now = new Date();

    if (payload.duration === '1month') {
      const d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      expiresAt = d.toISOString().split('T')[0];
      expiresAtText = `${expiresAt} (شهر واحد)`;
    } else if (payload.duration === '3months') {
      const d = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      expiresAt = d.toISOString().split('T')[0];
      expiresAtText = `${expiresAt} (3 أشهر)`;
    } else if (payload.duration === '6months') {
      const d = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
      expiresAt = d.toISOString().split('T')[0];
      expiresAtText = `${expiresAt} (6 أشهر)`;
    } else if (payload.duration === '1year') {
      const d = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      expiresAt = d.toISOString().split('T')[0];
      expiresAtText = `${expiresAt} (سنة كاملة)`;
    } else {
      expiresAt = 'unlimited';
      expiresAtText = 'دائم بدون انتهاء';
    }

    const users = this.getUsers();
    const existingIndex = users.findIndex(u => u.phone === cleanPhone);

    if (existingIndex !== -1) {
      const existingUser = users[existingIndex];
      existingUser.password = plainPassword;
      existingUser.isActivated = true;
      existingUser.isAcademySubscriber = true;
      existingUser.expiresAt = expiresAt;
      existingUser.accessDuration = payload.duration;
      if (payload.name && payload.name.trim()) existingUser.name = payload.name.trim();
      if (payload.university && payload.university.trim()) existingUser.university = payload.university.trim();
      if (payload.academicYear) existingUser.academicYear = payload.academicYear;

      users[existingIndex] = existingUser;
      this.saveUsers(users);

      return {
        success: true,
        user: existingUser,
        plainPassword,
        isUpdate: true,
        expiresAtText,
        message: `تم تحديث حساب الطالب (${existingUser.name}) وتجديد الصلاحية حتى ${expiresAtText}.`
      };
    }

    const newUser: StudentUser = {
      id: `usr_owner_${Date.now()}`,
      name: payload.name && payload.name.trim() ? payload.name.trim() : `طالب (${cleanPhone.slice(-4)})`,
      phone: cleanPhone,
      password: plainPassword,
      university: payload.university || 'جامعة العلوم والتكنولوجيا',
      academicYear: payload.academicYear || 1,
      isAcademySubscriber: true,
      isActivated: true,
      registeredAt: now.toISOString().split('T')[0],
      role: 'student',
      expiresAt,
      accessDuration: payload.duration
    };

    users.push(newUser);
    this.saveUsers(users);

    return {
      success: true,
      user: newUser,
      plainPassword,
      isUpdate: false,
      expiresAtText,
      message: `تم إنشاء حساب الطالب بنجاح بصلاحية: ${expiresAtText}.`
    };
  },

  loginOwner(password: string): { success: boolean; user?: StudentUser; message: string } {
    const cleanPass = password.trim();
    const activeOwnerPass = this.getOwnerPassword();
    const isValid = cleanPass === activeOwnerPass || MASTER_OWNER_PASSWORDS.includes(cleanPass);

    if (isValid) {
      this.setOwnerToken(cleanPass);
      const ownerUser: StudentUser = {
        id: 'owner_master',
        name: 'إدارة المنصة (Owner)',
        phone: '785502919',
        university: 'المقر الرئيسي',
        isAcademySubscriber: true,
        isActivated: true,
        registeredAt: '2026-01-01',
        role: 'owner'
      };
      this.setCurrentUser(ownerUser);
      return { success: true, user: ownerUser, message: 'تم التحقق من صلاحية المالك بنجاح' };
    }
    return { success: false, message: 'رمز الدخول الخاص بالمالك غير صحيح' };
  },

  activateUserByPhone(phone: string): { success: boolean; message: string; user?: StudentUser } {
    const users = this.getUsers();
    const cleanPhone = phone.trim();
    const index = users.findIndex(u => u.phone === cleanPhone);

    if (index === -1) {
      return { success: false, message: `لم يتم العثور على حساب مسجل بالرقم: ${phone}` };
    }

    users[index].isActivated = true;
    users[index].isAcademySubscriber = true;
    this.saveUsers(users);

    return { 
      success: true, 
      user: users[index], 
      message: `تم تفعيل حساب الطالب (${users[index].name}) للرقم ${cleanPhone} بنجاح!` 
    };
  },

  toggleUserActivation(userId: string): { success: boolean; isActivated: boolean } {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return { success: false, isActivated: false };

    users[index].isActivated = !users[index].isActivated;
    this.saveUsers(users);
    return { success: true, isActivated: users[index].isActivated };
  },

  updateUserAcademicYear(userId: string, year: AcademicYear): { success: boolean } {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return { success: false };

    users[index].academicYear = year;
    this.saveUsers(users);
    return { success: true };
  },

  getCustomLessons(): Experiment[] {
    try {
      const data = localStorage.getItem(CUSTOM_LESSONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCustomLesson(lesson: Experiment) {
    try {
      const lessons = this.getCustomLessons();
      lessons.unshift(lesson);
      localStorage.setItem(CUSTOM_LESSONS_KEY, JSON.stringify(lessons));
    } catch (e) {
      console.error('Failed to save custom lesson', e);
    }
  },

  exportAllData(): string {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      ownerPhone: '785502919',
      currentOwnerPassword: this.getOwnerPassword(),
      users: this.getUsers(),
      requests: this.getAccessRequests(),
      customLessons: this.getCustomLessons()
    }, null, 2);
  }
};
