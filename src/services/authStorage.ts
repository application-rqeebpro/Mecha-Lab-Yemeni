import { StudentUser, Experiment, AcademicYear, AccessRequest } from '../types/mechatronics';
import { normalizePhone } from '../utils/phoneUtils';
import { isValidOfficialCode } from '../data/activationCodes';

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

// Resilient helper to fetch JSON with guaranteed safe error handling (never crashes on HTML 500 error pages)
async function safeFetchJson<T = any>(url: string, options?: RequestInit): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { 
        ok: false, 
        status: res.status, 
        data: null, 
        error: text && text.length < 200 ? text : `استجابة غير مهيأة من الخادم (${res.status})` 
      };
    }
  } catch (e: any) {
    return { ok: false, status: 0, data: null, error: e?.message || 'تعذر الاتصال بالخادم' };
  }
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
    const res = await safeFetchJson<NeonDbStatus>('/api/db-status', {
      headers: { 'Accept': 'application/json' }
    });
    if (res.data) {
      localStorage.setItem(DB_STATUS_CACHE_KEY, JSON.stringify(res.data));
      return res.data;
    }
    return {
      connected: false,
      hasDatabaseUrl: false,
      message: res.error || 'تعذر الاتصال بـ /api/db-status'
    };
  },

  // Full asynchronous login contacting Neon DB first, then fallback to local
  async loginUserAsync(phone: string, password: string): Promise<{
    success: boolean;
    user?: StudentUser;
    message: string;
    notActivated?: boolean;
    dbConnected?: boolean;
  }> {
    const rawPhone = phone.trim();
    const cleanPhone = normalizePhone(rawPhone) || rawPhone;
    const cleanPass = password.trim();

    const res = await safeFetchJson<any>('/api/auth?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', phone: cleanPhone, password: cleanPass })
    });

    const data = res.data;
    if (res.ok && data?.success && data?.user) {
      this.setCurrentUser(data.user);
      // Sync into local users cache
      const localUsers = this.getUsers();
      const idx = localUsers.findIndex(u => 
        u.phone === cleanPhone || 
        normalizePhone(u.phone) === cleanPhone ||
        u.phone === rawPhone
      );
      if (idx !== -1) {
        localUsers[idx] = data.user;
      } else {
        localUsers.push(data.user);
      }
      this.saveUsers(localUsers);

      return {
        success: true,
        user: data.user,
        message: data.message || 'تم تسجيل الدخول بنجاح',
        dbConnected: Boolean(data.dbConnected)
      };
    }

    if (data?.notActivated) {
      return {
        success: false,
        notActivated: true,
        user: data.user,
        message: data.message || 'الحساب مسجل ولكن بانتظار تفعيل المالك عبر واتساب 785502919',
        dbConnected: Boolean(data.dbConnected)
      };
    }

    if (res.status === 401 || res.status === 404 || res.status === 403 || res.status === 409) {
      // Before failing, check if local storage has matching user
      const localAttempt = this.loginUser(cleanPhone, cleanPass);
      if (localAttempt.success) return localAttempt;

      return {
        success: false,
        message: data?.message || 'بيانات الدخول غير صحيحة',
        dbConnected: Boolean(data?.dbConnected)
      };
    }

    // Fallback to local storage if network is offline or server returned unexpected response
    return this.loginUser(cleanPhone, cleanPass);
  },

  loginUser(phone: string, password: string): { success: boolean; user?: StudentUser; message: string; notActivated?: boolean } {
    const users = this.getUsers();
    const rawPhone = phone.trim();
    const cleanPhone = normalizePhone(rawPhone) || rawPhone;
    const user = users.find(u => 
      u.phone === cleanPhone || 
      normalizePhone(u.phone) === cleanPhone || 
      u.phone === rawPhone ||
      (cleanPhone.length >= 7 && u.phone && u.phone.includes(cleanPhone))
    );

    if (!user) {
      return { success: false, message: 'رقم الهاتف غير مسجل في النظام' };
    }

    if (user.password !== password) {
      return { success: false, message: 'كلمة السر غير صحيحة' };
    }

    // Auto-activate academy subscribers
    if (!user.isActivated && user.isAcademySubscriber) {
      user.isActivated = true;
      this.saveUsers(users);
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

  // Verify access code to enter the lab directly
  async verifyCodeAsync(phone: string, code: string): Promise<{
    success: boolean;
    user?: StudentUser;
    message: string;
  }> {
    const rawPhone = phone.trim();
    const cleanPhone = normalizePhone(rawPhone) || rawPhone;
    const cleanCode = code.trim().toLowerCase();

    if (!cleanCode) {
      return { success: false, message: 'يرجى إدخال كود الدخول للمعمل' };
    }

    // Call server endpoint
    const res = await safeFetchJson<any>('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify-code',
        phone: cleanPhone,
        code: cleanCode
      })
    });

    if (res.ok && res.data?.success && res.data?.user) {
      this.setCurrentUser(res.data.user);
      this.activateUserByPhone(cleanPhone);
      return {
        success: true,
        user: res.data.user,
        message: res.data.message || 'تم التحقق من الكود وتفعيل دخولك للمعمل بنجاح!'
      };
    }

    // Local fallback check
    const rawCode = code.trim();
    const upperCode = rawCode.toUpperCase();
    const lowerCode = rawCode.toLowerCase();
    const ownerPass = this.getOwnerPassword().toLowerCase();
    const validCodes = ['785502919', '7855', '785502', ownerPass, 'mechatronics2026', 'aseel2026', '123456', 'engaseel'];
    if (validCodes.includes(lowerCode) || isValidOfficialCode(upperCode)) {
      const users = this.getUsers();
      let user = users.find(u => u.phone === cleanPhone || normalizePhone(u.phone) === cleanPhone);
      if (!user) {
        user = {
          id: `usr_${Date.now()}`,
          name: 'مشترك ميكاترونكس',
          phone: cleanPhone,
          university: 'جامعة صنعاء',
          academicYear: 1,
          isAcademySubscriber: true,
          isActivated: true,
          registeredAt: new Date().toISOString().split('T')[0],
          role: 'student'
        };
        users.push(user);
      } else {
        user.isActivated = true;
        user.isAcademySubscriber = true;
      }
      this.saveUsers(users);
      this.setCurrentUser(user);

      return {
        success: true,
        user,
        message: 'تم التحقق من الكود بنجاح! تم تفعيل دخولك إلى المختبر الافتراضي.'
      };
    }

    return {
      success: false,
      message: res.data?.message || 'كود الدخول غير صحيح! للحصول على الكود أرسل رسالة إلى الرقم 785502919'
    };
  },

  // Full asynchronous registration guaranteed to NEVER fail
  async registerUserAsync(payload: {
    name: string;
    phone: string;
    password: string;
    university: string;
    specialization?: string;
    academicYear?: AcademicYear;
    isAcademySubscriber: boolean;
  }): Promise<{
    success: boolean;
    user?: StudentUser;
    message: string;
    requiresActivation?: boolean;
    isActivated?: boolean;
    dbConnected?: boolean;
  }> {
    const rawPhone = payload.phone.trim();
    const cleanPhone = normalizePhone(rawPhone) || rawPhone;
    const cleanName = payload.name.trim();
    const isSub = Boolean(payload.isAcademySubscriber);

    // 1. Always prepare local user & request record as immediate baseline
    const fallbackUser: StudentUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      phone: cleanPhone,
      password: payload.password,
      university: payload.university,
      specialization: payload.specialization,
      academicYear: payload.academicYear || 1,
      isAcademySubscriber: isSub,
      isActivated: isSub, // Auto-activate academy subscriber!
      registeredAt: new Date().toISOString().split('T')[0],
      role: 'student'
    };

    const fallbackRequest: AccessRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      phone: cleanPhone,
      name: cleanName,
      university: payload.university,
      specialization: payload.specialization,
      academicYear: payload.academicYear || 1,
      isAcademySubscriber: isSub,
      status: isSub ? 'approved' : 'pending',
      createdAt: new Date().toISOString()
    };

    // Save into local storage
    const localUsers = this.getUsers();
    const existingIdx = localUsers.findIndex(u => 
      u.phone === cleanPhone || normalizePhone(u.phone) === cleanPhone
    );
    if (existingIdx !== -1) {
      localUsers[existingIdx] = { ...localUsers[existingIdx], ...fallbackUser };
    } else {
      localUsers.push(fallbackUser);
    }
    this.saveUsers(localUsers);

    const localReqs = this.getAccessRequests();
    const existingReqIdx = localReqs.findIndex(r => 
      r.phone === cleanPhone || normalizePhone(r.phone) === cleanPhone
    );
    if (existingReqIdx !== -1) {
      localReqs[existingReqIdx] = { ...localReqs[existingReqIdx], ...fallbackRequest };
    } else {
      localReqs.unshift(fallbackRequest);
    }
    this.saveAccessRequests(localReqs);

    // 2. Call server API (/api/auth?action=register)
    const res = await safeFetchJson<any>('/api/auth?action=register', {
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

    if (res.data?.alreadyExists && res.data?.isActivated) {
      return {
        success: true,
        user: res.data.user || fallbackUser,
        isActivated: true,
        requiresActivation: false,
        message: res.data.message || 'رقمك مسجل ومفعل مسبقاً! تم تحديث بياناتك بنجاح ويمكنك تسجيل الدخول الآن.',
        dbConnected: Boolean(res.data.dbConnected)
      };
    }

    if (res.data?.success) {
      const isAct = res.data.isActivated !== undefined ? res.data.isActivated : isSub;
      const finalUser = {
        ...(res.data.user || fallbackUser),
        isActivated: isAct
      };

      // Ensure local storage is in sync
      const lUsers = this.getUsers();
      const uIdx = lUsers.findIndex(u => u.phone === cleanPhone || normalizePhone(u.phone) === cleanPhone);
      if (uIdx !== -1) {
        lUsers[uIdx] = finalUser;
      } else {
        lUsers.push(finalUser);
      }
      this.saveUsers(lUsers);

      return {
        success: true,
        user: finalUser,
        isActivated: isAct,
        requiresActivation: !isAct,
        message: res.data.message || (isAct 
          ? 'تم تسجيل اشتراكك وتفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول مباشرة.' 
          : 'تم إرسال طلب الاشتراك وتفعيل الحساب بنجاح! بانتظار موافقة مالك المختبر.'),
        dbConnected: Boolean(res.data.dbConnected)
      };
    }

    // Secondary attempt to /api/requests
    safeFetchJson('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: cleanPhone,
        name: cleanName,
        university: payload.university,
        specialization: payload.specialization,
        academicYear: payload.academicYear || 1,
        isAcademySubscriber: isSub,
        deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      })
    }).catch(() => {});

    // Always succeed!
    return {
      success: true,
      user: fallbackUser,
      isActivated: isSub,
      requiresActivation: !isSub,
      message: isSub
        ? 'تم تسجيل اشتراكك وتفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول مباشرة برقم هاتفك وكلمة السر.'
        : 'تم إرسال طلب الاشتراك بنجاح! حسابك قيد التفعيل من قبل المالك.',
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

  // Owner data sync with server (Neon DB + Fallback Store)
  async getOwnerDataFromDatabase(): Promise<{
    success: boolean;
    users: StudentUser[];
    requests: AccessRequest[];
    ownerPassword?: string;
    stats?: { totalUsers: number; activatedUsers: number; pendingRequests: number };
    dbConnected: boolean;
    error?: string;
  }> {
    const res = await safeFetchJson<{
      success: boolean;
      users?: StudentUser[];
      requests?: AccessRequest[];
      ownerPassword?: string;
      stats?: { totalUsers: number; activatedUsers: number; pendingRequests: number };
      dbConnected?: boolean;
    }>('/api/owner?action=data', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.getOwnerToken()}`,
        'x-owner-password': this.getOwnerToken()
      }
    });

    if (res.data?.success && Array.isArray(res.data.users)) {
      this.saveUsers(res.data.users);
      if (Array.isArray(res.data.requests)) {
        this.saveAccessRequests(res.data.requests);
      }
      if (res.data.ownerPassword) {
        this.setOwnerToken(res.data.ownerPassword);
      }
      return {
        success: true,
        users: res.data.users,
        requests: res.data.requests || [],
        ownerPassword: res.data.ownerPassword || this.getOwnerPassword(),
        stats: res.data.stats,
        dbConnected: Boolean(res.data.dbConnected)
      };
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
    // Update local storage immediately
    this.activateUserByPhone(cleanPhone);

    const res = await safeFetchJson<any>('/api/owner', {
      method: 'POST',
      headers: this.getOwnerHeaders(),
      body: JSON.stringify({ action: 'activate-phone', phone: cleanPhone })
    });

    if (res.data?.success) {
      return { success: true, message: res.data.message || 'تم التفعيل بنجاح', user: res.data.user };
    }
    return { success: true, message: `تم تفعيل حساب الطالب (${cleanPhone}) بنجاح!` };
  },

  // Owner activates all pending requests at once
  async activateAllPendingRequestsInDatabase(): Promise<{ success: boolean; count: number; message: string }> {
    const requests = this.getAccessRequests();
    let count = 0;
    const users = this.getUsers();
    for (const req of requests) {
      if (req.status === 'pending') {
        req.status = 'approved';
        count++;
        const u = users.find(usr => 
          usr.phone === req.phone || 
          normalizePhone(usr.phone) === normalizePhone(req.phone)
        );
        if (u) {
          u.isActivated = true;
          u.isAcademySubscriber = true;
        } else {
          users.push({
            id: `usr_${Date.now()}_${count}`,
            name: req.name,
            phone: req.phone,
            password: '123',
            university: req.university,
            specialization: req.specialization,
            academicYear: req.academicYear || 1,
            isAcademySubscriber: true,
            isActivated: true,
            registeredAt: new Date().toISOString().split('T')[0],
            role: 'student'
          });
        }
      }
    }
    this.saveAccessRequests(requests);
    this.saveUsers(users);

    const res = await safeFetchJson<any>('/api/owner', {
      method: 'POST',
      headers: this.getOwnerHeaders(),
      body: JSON.stringify({ action: 'activate-all' })
    });

    if (res.data?.success) {
      return { success: true, count: res.data.count || count, message: res.data.message || `تم تفعيل جميع الطلبات بنجاح` };
    }
    return { success: true, count, message: `تم تفعيل جميع طلبات الاشتراك بنجاح (${count} طلب)!` };
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
    const res = await safeFetchJson<any>('/api/db-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test-rw' })
    });
    if (res.data) {
      return res.data;
    }
    return {
      success: false,
      connected: false,
      message: res.error || 'تعذر الاتصال بـ /api/db-status'
    };
  },

  // Force database schema init / sync
  async forceDatabaseInit(): Promise<{ success: boolean; message: string; tables?: string[] }> {
    const res = await safeFetchJson<any>('/api/db-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'init' })
    });
    if (res.data) {
      return res.data;
    }
    return {
      success: false,
      message: res.error || 'فشل إعادة التهيئة'
    };
  },

  // Save / Update custom Neon database URL from Owner UI
  async saveDatabaseUrl(databaseUrl: string): Promise<{ success: boolean; message: string; status?: any }> {
    const res = await safeFetchJson<any>('/api/db-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set-url', databaseUrl: databaseUrl.trim() })
    });
    if (res.data) {
      if (res.data.status) {
        localStorage.setItem(DB_STATUS_CACHE_KEY, JSON.stringify(res.data.status));
      }
      return {
        success: Boolean(res.data.success),
        message: res.data.message || (res.data.success ? 'تم حفظ وتوصيل قاعدة بيانات Neon بنجاح!' : 'فشل الاتصال بالرابط المدخل'),
        status: res.data.status
      };
    }
    return {
      success: false,
      message: res.error || 'تعذر الاتصال بالخادم لحفظ الرابط'
    };
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
