import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  UserCheck, 
  UserX, 
  PlusCircle, 
  Phone, 
  Search, 
  BookOpen, 
  Cpu, 
  Check, 
  AlertCircle, 
  Layers, 
  Users, 
  GraduationCap,
  Sparkles,
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  FileCheck,
  RefreshCw,
  Smartphone,
  Globe,
  Lock,
  Send,
  MessageSquare,
  Calendar,
  UserPlus,
  Database,
  Inbox,
  Server,
  Clock,
  Loader2,
  Trash2,
  Edit3,
  Filter,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { StudentUser, Experiment, AcademicYear, LabCategory, AccessRequest } from '../types/mechatronics';
import { authStorage, DEFAULT_OWNER_PASSWORD, MASTER_OWNER_PASSWORDS, NeonDbStatus } from '../services/authStorage';
import { YEMENI_UNIVERSITIES } from '../data/curriculumData';

interface OwnerAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLessonAdded?: (lesson: Experiment) => void;
}

export const OwnerAdminModal: React.FC<OwnerAdminModalProps> = ({
  isOpen,
  onClose,
  onLessonAdded,
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'create_account' | 'activate' | 'neon_db' | 'add_lesson' | 'security'>('requests');
  const [usersList, setUsersList] = useState<StudentUser[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [neonStatus, setNeonStatus] = useState<NeonDbStatus | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(false);
  const [requestActionFeedback, setRequestActionFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const [phoneToActivate, setPhoneToActivate] = useState<string>('');
  const [activationFeedback, setActivationFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Tab 'create_account' state (Create Account & Send Credentials)
  const [createPhone, setCreatePhone] = useState<string>('');
  const [createPassword, setCreatePassword] = useState<string>('');
  const [createDuration, setCreateDuration] = useState<'1month' | '3months' | '6months' | '1year' | 'unlimited'>('3months');
  const [createStudentName, setCreateStudentName] = useState<string>('');
  const [createUniv, setCreateUniv] = useState<string>('جامعة العلوم والتكنولوجيا');
  const [createAcademicYear, setCreateAcademicYear] = useState<AcademicYear>(1);
  const [createFeedback, setCreateFeedback] = useState<{ success: boolean; msg: string; isUpdate?: boolean } | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    phone: string;
    password: string;
    duration: string;
    expiresAtText: string;
    labUrl: string;
    studentName: string;
    formattedMessage: string;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState<boolean>(false);

  // User Access Editing State (Extend validity, change/generate password)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<StudentUser | null>(null);
  const [editPasswordInput, setEditPasswordInput] = useState<string>('');
  const [editDurationInput, setEditDurationInput] = useState<'1month' | '3months' | '6months' | '1year' | 'unlimited'>('3months');
  const [editUserFeedback, setEditUserFeedback] = useState<{ success: boolean; msg: string; plainPassword?: string } | null>(null);
  const [copiedEditCredentials, setCopiedEditCredentials] = useState<boolean>(false);

  // Neon DB Diagnostics State
  const [isTestingRw, setIsTestingRw] = useState<boolean>(false);
  const [rwTestResult, setRwTestResult] = useState<any>(null);
  const [isForcingInit, setIsForcingInit] = useState<boolean>(false);
  const [forceInitResult, setForceInitResult] = useState<any>(null);

  // Requests Tab State
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [requestSearch, setRequestSearch] = useState<string>('');

  // Password management state
  const [currentOwnerPassword, setCurrentOwnerPassword] = useState<string>(DEFAULT_OWNER_PASSWORD);
  const [newOwnerPasswordInput, setNewOwnerPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [copiedPass, setCopiedPass] = useState<boolean>(false);

  // New Lesson form state
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTitleEn, setNewTitleEn] = useState<string>('');
  const [newYear, setNewYear] = useState<AcademicYear>(3);
  const [newCategory, setNewCategory] = useState<LabCategory>('robotics');
  const [newDifficulty, setNewDifficulty] = useState<'مبتدئ' | 'متوسط' | 'متقدم'>('متوسط');
  const [newTheory, setNewTheory] = useState<string>('');
  const [newComponents, setNewComponents] = useState<string>('أردوينو Uno • حساسات • محرك');
  const [newSteps, setNewSteps] = useState<string>('1. جهز الدائرة\n2. ارفع الكود\n3. سجل القياسات');
  const [lessonFeedback, setLessonFeedback] = useState<string | null>(null);

  const [isRefreshingRequests, setIsRefreshingRequests] = useState<boolean>(false);

  const loadData = async (silentParam?: boolean | React.MouseEvent) => {
    const silent = typeof silentParam === 'boolean' ? silentParam : false;
    if (!silent) setIsLoadingDb(true);
    try {
      const [status, ownerData] = await Promise.all([
        authStorage.checkDatabaseStatus(),
        authStorage.getOwnerDataFromDatabase()
      ]);
      setNeonStatus(status);

      if (ownerData.success && Array.isArray(ownerData.users)) {
        setUsersList(ownerData.users);
      } else if (!status.connected) {
        setUsersList(authStorage.getUsers());
      } else {
        setUsersList(ownerData.users || []);
      }

      if (ownerData.success && Array.isArray(ownerData.requests)) {
        setAccessRequests(ownerData.requests);
      } else if (!status.connected) {
        setAccessRequests(authStorage.getAccessRequests());
      } else {
        setAccessRequests(ownerData.requests || []);
      }

      if (ownerData.ownerPassword) {
        setCurrentOwnerPassword(ownerData.ownerPassword);
      }
    } catch (e) {
      console.warn('Error loading owner data from Neon DB:', e);
      if (!neonStatus?.connected) {
        setUsersList(authStorage.getUsers());
        setAccessRequests(authStorage.getAccessRequests());
      }
    } finally {
      if (!silent) setIsLoadingDb(false);
      setIsRefreshingRequests(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadData();
    setActivationFeedback(null);
    setLessonFeedback(null);
    setPasswordFeedback(null);
    setCopiedPass(false);
    setRequestActionFeedback(null);

    // Live background polling every 8 seconds so requests from any phone appear in real-time
    const interval = setInterval(() => {
      loadData(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const suffixes = ['EUI', 'MEC', 'LAB', 'YEM', 'ENG'];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    setCreatePassword(`${randomDigits}${suffix}`);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFeedback(null);
    setCreatedCredentials(null);

    const cleanPhone = createPhone.trim();
    if (!cleanPhone) {
      setCreateFeedback({ success: false, msg: 'يرجى إدخال رقم الهاتف' });
      return;
    }

    const res = await authStorage.createAccountByOwnerInDatabase({
      phone: cleanPhone,
      password: createPassword,
      duration: createDuration,
      name: createStudentName,
      university: createUniv,
      academicYear: createAcademicYear
    });

    setCreateFeedback({ success: res.success, msg: res.message });

    if (res.success && res.user && res.plainPassword) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mechatronics-yemen.edu.ye';
      const formattedMessage = `مرحباً بك يا مهندس في المختبر الافتراضي لهندسة الميكاترونكس!\n\nتم تفعيل حسابك بنجاح:\n📱 رقم الهاتف: ${cleanPhone}\n🔑 كلمة السر: ${res.plainPassword}\n⏳ الصلاحية: ${res.expiresAtText}\n\nرابط الدخول المباشر للمختبر:\n${origin}\n\nنتمنى لك فصلاً دراسياً وتجارب ميكاترونكس متميزة!`;

      setCreatedCredentials({
        phone: cleanPhone,
        password: res.plainPassword,
        duration: createDuration,
        expiresAtText: res.expiresAtText,
        labUrl: origin,
        studentName: res.user.name,
        formattedMessage
      });

      await loadData();
    }
  };

  const handleSendViaWhatsApp = () => {
    if (!createdCredentials) return;
    let targetPhone = createdCredentials.phone.replace(/\D/g, '');
    if (targetPhone.startsWith('0')) targetPhone = targetPhone.substring(1);
    if (!targetPhone.startsWith('967') && targetPhone.length === 9) {
      targetPhone = `967${targetPhone}`;
    }

    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(createdCredentials.formattedMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    navigator.clipboard.writeText(createdCredentials.formattedMessage);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  const handleActivateByPhone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneToActivate.trim()) return;

    const res = await authStorage.activateUserByPhoneInDatabase(phoneToActivate);
    setActivationFeedback({ success: res.success, msg: res.message });
    if (res.success) {
      setPhoneToActivate('');
      await loadData();
    }
  };

  const handleToggleActivation = async (userId: string) => {
    const res = await authStorage.toggleUserActivationInDatabase(userId);
    if (res.success) {
      await loadData();
    }
  };

  const handleApproveRequest = async (reqItem: AccessRequest) => {
    setRequestActionFeedback(null);
    const res = await authStorage.activateUserByPhoneInDatabase(reqItem.phone);
    if (res.success) {
      setRequestActionFeedback({ success: true, msg: `تم تفعيل حساب الطالب (${reqItem.name}) للرقم ${reqItem.phone} وحفظه في Neon بنجاح!` });
      await loadData();
    } else {
      setRequestActionFeedback({ success: false, msg: res.message });
    }
  };

  const handleRejectRequest = async (reqItem: AccessRequest) => {
    setRequestActionFeedback(null);
    const res = await authStorage.rejectRequestInDatabase(reqItem.id, reqItem.phone);
    if (res.success) {
      setRequestActionFeedback({ success: true, msg: `تم رفض طلب الطالب (${reqItem.name}) للرقم ${reqItem.phone}.` });
      await loadData();
    } else {
      setRequestActionFeedback({ success: false, msg: res.message });
    }
  };

  const handleQuickCreateForRequest = (reqItem: AccessRequest) => {
    setCreatePhone(reqItem.phone);
    setCreateStudentName(reqItem.name);
    setCreateUniv(reqItem.university || 'جامعة صنعاء');
    setCreateAcademicYear(reqItem.academicYear || 1);
    handleGeneratePassword();
    setActiveTab('create_account');
  };

  const handleDeleteRequest = async (requestId: string) => {
    await authStorage.deleteRequestFromDatabase(requestId);
    await loadData();
  };

  const handleOpenEditUser = (user: StudentUser) => {
    setSelectedUserForEdit(user);
    setEditPasswordInput('');
    setEditDurationInput((user.accessDuration as any) || '3months');
    setEditUserFeedback(null);
    setCopiedEditCredentials(false);
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    const res = await authStorage.updateUserAccessInDatabase({
      userId: selectedUserForEdit.id,
      phone: selectedUserForEdit.phone,
      newPassword: editPasswordInput || undefined,
      duration: editDurationInput
    });

    setEditUserFeedback({
      success: res.success,
      msg: res.message,
      plainPassword: res.plainPassword
    });

    if (res.success) {
      await loadData();
    }
  };

  const handleDeleteUser = async (userId: string, phone: string) => {
    if (!confirm(`هل أنت متأكد من حذف الحساب للرقم ${phone} نهائياً؟`)) return;
    await authStorage.deleteUserFromDatabase(userId, phone);
    if (selectedUserForEdit?.id === userId) setSelectedUserForEdit(null);
    await loadData();
  };

  const handleTestDatabaseRw = async () => {
    setIsTestingRw(true);
    setRwTestResult(null);
    try {
      const res = await authStorage.testDatabaseReadWrite();
      setRwTestResult(res);
      await loadData();
    } catch (err: any) {
      setRwTestResult({ success: false, message: err?.message || String(err) });
    } finally {
      setIsTestingRw(false);
    }
  };

  const handleForceDatabaseInit = async () => {
    setIsForcingInit(true);
    setForceInitResult(null);
    try {
      const res = await authStorage.forceDatabaseInit();
      setForceInitResult(res);
      await loadData();
    } catch (err: any) {
      setForceInitResult({ success: false, message: err?.message || String(err) });
    } finally {
      setIsForcingInit(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    const res = await authStorage.updateOwnerPasswordInDatabase(newOwnerPasswordInput);
    setPasswordFeedback({ success: res.success, msg: res.message });
    if (res.success) {
      setCurrentOwnerPassword(newOwnerPasswordInput);
      setNewOwnerPasswordInput('');
      await loadData();
    }
  };

  const handleResetPassword = () => {
    const res = authStorage.resetOwnerPassword();
    setCurrentOwnerPassword(res.password);
    setPasswordFeedback({ success: true, msg: `تمت استعادة كلمة سر المالك الافتراضية: (${res.password})` });
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(currentOwnerPassword);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
  };

  const handleExportBackup = () => {
    const jsonStr = authStorage.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mechatronics_lab_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddNewLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTheory.trim()) {
      setLessonFeedback('يرجى كتابة عنوان التجربة وشرحها النظري');
      return;
    }

    const newExperiment: Experiment = {
      id: `custom_exp_${Date.now()}`,
      title: newTitle.trim(),
      titleEn: newTitleEn.trim() || 'Custom Mechatronics Lesson',
      year: newYear,
      category: newCategory,
      levelBadge: `السنة ${newYear} - درس جديد من المشرف`,
      difficulty: newDifficulty,
      mode: newCategory === 'control' ? 'pid' : newCategory === 'robotics' ? 'robotics' : newCategory === 'plc' ? 'plc' : newCategory === 'pneumatics' ? 'pneumatics' : 'circuit',
      objectives: ['دراسة وتطبيق منظومة التجربة المحددة من المشرف', 'فحص الاستجابة العملية والتوصيل'],
      theory: newTheory.trim(),
      equations: [
        { name: 'معادلة العمليات', formula: 'V = I \\times R', explanation: 'العلاقة الكهربائية الأساسية' }
      ],
      componentsNeeded: newComponents.split('•').map(c => c.trim()).filter(Boolean),
      steps: newSteps.split('\n').filter(Boolean),
      expectedResults: 'تحقق من النتائج العملية وفق تعليمات المشرف.'
    };

    authStorage.saveCustomLesson(newExperiment);
    if (onLessonAdded) onLessonAdded(newExperiment);
    setLessonFeedback(`تم حفظ وإضافة التجربة "${newTitle}" بنجاح إلى المنهج!`);
    setNewTitle('');
    setNewTitleEn('');
    setNewTheory('');
  };

  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery) ||
    u.university.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsers = usersList.length;
  const activatedUsers = usersList.filter(u => u.isActivated).length;
  const pendingUsers = usersList.filter(u => !u.isActivated).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-950/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">
                  لوحة إدارة المنصة والتحكم الأكاديمي (Owner Administration Portal)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  صلاحية كاملة للمالك
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                هاتف المالك المباشر: 785502919
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={isLoadingDb}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
              title="تحديث البيانات من Neon"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDb ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">تزامن Neon</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Bar (Connected to Neon DB) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-slate-950/70 border-b border-slate-800 text-xs text-center font-mono">
          <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-sans block text-[10px]">إجمالي الحسابات</span>
            <span className="text-base font-black text-white">{totalUsers}</span>
          </div>
          <div className="bg-slate-900 p-2 rounded-xl border border-emerald-900/40">
            <span className="text-emerald-400 font-sans block text-[10px]">الحسابات المفعلة</span>
            <span className="text-base font-black text-emerald-400">{activatedUsers}</span>
          </div>
          <div className="bg-slate-900 p-2 rounded-xl border border-blue-900/40">
            <span className="text-blue-400 font-sans block text-[10px]">طلبات قيد المراجعة</span>
            <span className="text-base font-black text-blue-400">
              {accessRequests.filter(r => r.status === 'pending').length}
            </span>
          </div>
          <div 
            onClick={() => setActiveTab('neon_db')}
            className={`p-2 rounded-xl border cursor-pointer transition ${
              neonStatus?.connected 
                ? 'bg-emerald-950/30 border-emerald-500/40 hover:bg-emerald-900/40' 
                : 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-900/40'
            }`}
            title="انقر لتشخيص اتصال Neon"
          >
            <span className="text-slate-400 font-sans block text-[10px]">حالة سحابة Neon</span>
            <span className={`text-xs font-black flex items-center justify-center gap-1 mt-0.5 ${neonStatus?.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
              <span className={`w-2 h-2 rounded-full ${neonStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{neonStatus?.connected ? `متصل (${neonStatus.latencyMs || 0}ms)` : 'غير متصل'}</span>
            </span>
          </div>
          <div className="bg-slate-900 p-2 rounded-xl border border-purple-900/40 col-span-2 sm:col-span-1">
            <span className="text-purple-400 font-sans block text-[10px]">رمز دخول المالك</span>
            <span className="text-xs font-black text-purple-300 truncate font-mono">
              {showPassword ? currentOwnerPassword : '••••••••'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-slate-800 bg-slate-950 px-4 text-xs">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Inbox className="w-4 h-4 text-blue-400" />
            <span>طلبات الإشتراك وتفعيل الحسابات ({accessRequests.filter(r => r.status === 'pending').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>إدارة حسابات الطلاب والمشتركين ({totalUsers})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('create_account');
              setCreateFeedback(null);
            }}
            className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'create_account'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/40'
                : 'border-transparent text-emerald-400/90 hover:text-emerald-300'
            }`}
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>تسجيل مشترك برقم هاتفه وتفعيل فوري</span>
          </button>
          <button
            onClick={() => setActiveTab('neon_db')}
            className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'neon_db'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>سحابة Neon وقاعدة البيانات</span>
          </button>
          <button
            onClick={() => setActiveTab('activate')}
            className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'activate'
                ? 'border-amber-500 text-amber-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>تفعيل مباشر برقم الهاتف</span>
          </button>
          <button
            onClick={() => setActiveTab('add_lesson')}
            className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'add_lesson'
                ? 'border-amber-500 text-amber-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة درس أو تجربة للمنهج</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-purple-500 text-purple-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>أمان المالك والنسخ الاحتياطي</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 0: ACCESS REQUESTS (SHARED FROM PHONES VIA NEON POSTGRESQL) */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              {/* Top Filter and Header */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-xs text-white">الطلبات الواردة من هواتف الطلاب:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                    {accessRequests.filter(r => r.status === 'pending').length} قيد الانتظار
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                    <button
                      onClick={() => setRequestFilter('pending')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        requestFilter === 'pending' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      قيد المراجعة ({accessRequests.filter(r => r.status === 'pending').length})
                    </button>
                    <button
                      onClick={() => setRequestFilter('approved')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        requestFilter === 'approved' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      المقبولة ({accessRequests.filter(r => r.status === 'approved').length})
                    </button>
                    <button
                      onClick={() => setRequestFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        requestFilter === 'all' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      الكل ({accessRequests.length})
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setIsRefreshingRequests(true);
                      loadData(false);
                    }}
                    disabled={isRefreshingRequests}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition flex items-center gap-1.5 font-bold text-[11px]"
                    title="تحديث فوري من قاعدة بيانات Neon السحابية"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRequests ? 'animate-spin' : ''}`} />
                    <span>تحديث فوري</span>
                  </button>
                </div>
              </div>

              {/* Search Bar for requests */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="بحث في الطلبات بالاسم أو رقم الهاتف أو الجامعة..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {requestActionFeedback && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  requestActionFeedback.success 
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}>
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{requestActionFeedback.msg}</span>
                </div>
              )}

              {/* Requests Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold">
                    <tr>
                      <th className="p-3">الطالب</th>
                      <th className="p-3">رقم الهاتف</th>
                      <th className="p-3">الجامعة والسنة</th>
                      <th className="p-3 text-center">مشترك أكاديمية</th>
                      <th className="p-3 text-center">الحالة</th>
                      <th className="p-3 text-center">تاريخ الطلب</th>
                      <th className="p-3 text-center">إجراءات المالك</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {accessRequests
                      .filter(r => {
                        if (requestFilter === 'pending') return r.status === 'pending';
                        if (requestFilter === 'approved') return r.status === 'approved';
                        return true;
                      })
                      .filter(r => 
                        !requestSearch ||
                        r.name.toLowerCase().includes(requestSearch.toLowerCase()) ||
                        r.phone.includes(requestSearch) ||
                        r.university.toLowerCase().includes(requestSearch.toLowerCase())
                      )
                      .length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-400" />
                          <p>لا توجد طلبات وصول مطابقة حالياً</p>
                          <span className="text-[11px] text-slate-600 block mt-1">
                            عندما يقوم أي طالب بالنقر على "طلب تفعيل الوصول" من هاتفه، ستظهر بياناته هنا فورياً عبر سحابة Neon
                          </span>
                        </td>
                      </tr>
                    ) : (
                      accessRequests
                        .filter(r => {
                          if (requestFilter === 'pending') return r.status === 'pending';
                          if (requestFilter === 'approved') return r.status === 'approved';
                          return true;
                        })
                        .filter(r => 
                          !requestSearch ||
                          r.name.toLowerCase().includes(requestSearch.toLowerCase()) ||
                          r.phone.includes(requestSearch) ||
                          r.university.toLowerCase().includes(requestSearch.toLowerCase())
                        )
                        .map((req) => (
                          <tr key={req.id} className="hover:bg-slate-900/50 transition">
                            <td className="p-3 font-semibold text-white">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                                  {req.name.charAt(0)}
                                </span>
                                <div>
                                  <span>{req.name}</span>
                                  {req.deviceInfo && (
                                    <span className="text-[10px] text-slate-500 block font-mono">
                                      {req.deviceInfo.includes('Mobile') || req.deviceInfo.includes('Android') || req.deviceInfo.includes('iPhone') ? '📱 هاتف محمول' : '💻 جهاز كمبيوتر'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-slate-300">
                              <div className="flex items-center gap-1.5">
                                <span>{req.phone}</span>
                                <a
                                  href={`https://wa.me/967${req.phone.replace(/\D/g, '').replace(/^0/, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 p-1"
                                  title="مراسلة الطالب عبر واتساب"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </td>
                            <td className="p-3 text-slate-400">
                              <div>{req.university}</div>
                              <span className="text-[10px] text-purple-400">
                                السنة الدراسية: {req.academicYear === 1 ? 'الأولى' : req.academicYear === 2 ? 'الثانية' : req.academicYear === 3 ? 'الثالثة' : req.academicYear === 4 ? 'الرابعة' : 'الخامسة'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {req.isAcademySubscriber ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                                  <Check className="w-3 h-3" /> مشترك
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                                  غير مشترك
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {req.status === 'approved' ? (
                                <span className="inline-block text-[10px] bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                                  تم التفعيل بنجاح
                                </span>
                              ) : (
                                <span className="inline-block text-[10px] bg-blue-600/20 text-blue-300 border border-blue-500/40 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                                  بانتظار موافقتك
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono text-[11px] text-slate-400">
                              {req.createdAt ? new Date(req.createdAt).toLocaleDateString('ar-YE') : 'اليوم'}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {req.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveRequest(req)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow"
                                      title="موافقة وتفعيل الحساب مباشرة"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>تفعيل</span>
                                    </button>
                                    <button
                                      onClick={() => handleRejectRequest(req)}
                                      className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                      title="رفض الطلب"
                                    >
                                      <UserX className="w-3.5 h-3.5" />
                                      <span>رفض</span>
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleQuickCreateForRequest(req)}
                                  className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                  title="إنشاء بيانات مخصصة وإرسالها للطالب"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                  <span>توليد بيانات</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteRequest(req.id)}
                                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                                  title="حذف الطلب نهائياً"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 1: USERS LIST & ADVANCED ACCESS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              {/* Search Bar & Add User Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="ابحث عن طالب بالاسم أو رقم الهاتف أو الجامعة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <button
                  onClick={() => {
                    setActiveTab('create_account');
                    setCreateFeedback(null);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ إضافة وتوليد حساب جديد</span>
                </button>
              </div>

              {/* Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold">
                    <tr>
                      <th className="p-3">الطالب</th>
                      <th className="p-3">رقم الهاتف</th>
                      <th className="p-3">الجامعة</th>
                      <th className="p-3 text-center">السنة الدراسية</th>
                      <th className="p-3 text-center">الصلاحية</th>
                      <th className="p-3 text-center">اشتراك الأكاديمية</th>
                      <th className="p-3 text-center">حالة التفعيل</th>
                      <th className="p-3 text-center">إدارة الوصول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-500">
                          لا يوجد طلاب مطابقون لبحثك
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-900/50 transition">
                          <td className="p-3 font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">
                                {u.name.charAt(0)}
                              </span>
                              <span>{u.name}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-slate-300">{u.phone}</td>
                          <td className="p-3 text-slate-400">{u.university}</td>
                          <td className="p-3 text-center">
                            <select
                              value={u.academicYear || 1}
                              onChange={(e) => {
                                const newYr = Number(e.target.value) as AcademicYear;
                                authStorage.updateUserAcademicYear(u.id, newYr);
                                setUsersList(authStorage.getUsers());
                              }}
                              className="bg-slate-900 border border-slate-700 hover:border-purple-500 rounded-lg px-2 py-1 text-[11px] font-bold text-purple-300 focus:outline-none cursor-pointer"
                              title="تغيير السنة الدراسية للطالب"
                            >
                              <option value={1}>السنة الأولى</option>
                              <option value={2}>السنة الثانية</option>
                              <option value={3}>السنة الثالثة</option>
                              <option value={4}>السنة الرابعة</option>
                              <option value={5}>السنة الخامسة</option>
                            </select>
                          </td>
                          <td className="p-3 text-center">
                            {u.expiresAt === 'unlimited' ? (
                              <span className="text-purple-300 font-mono text-[11px] bg-purple-950/40 border border-purple-800/50 px-2 py-0.5 rounded-lg font-bold">
                                دائم
                              </span>
                            ) : u.expiresAt ? (
                              <span className={`font-mono text-[11px] px-2 py-0.5 rounded-lg border font-bold ${
                                new Date(u.expiresAt).getTime() < Date.now()
                                  ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                                  : 'bg-slate-900 text-slate-300 border-slate-800'
                              }`}>
                                {u.expiresAt}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">غير محدد</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {u.isAcademySubscriber ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                                <Check className="w-3 h-3" /> مشترك
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                                غير مشترك
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {u.isActivated ? (
                              <span className="inline-block text-[10px] bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                                مفعل
                              </span>
                            ) : (
                              <span className="inline-block text-[10px] bg-amber-600/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold animate-pulse">
                                معلق
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Toggle Activation Button */}
                              <button
                                onClick={() => handleToggleActivation(u.id)}
                                title={u.isActivated ? 'إلغاء التفعيل' : 'تفعيل الحساب'}
                                className={`p-1.5 rounded-lg text-xs font-bold transition ${
                                  u.isActivated
                                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                                }`}
                              >
                                {u.isActivated ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>
                              {/* Edit Credentials & Validity Button */}
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                title="تعديل الصلاحية أو كلمة السر"
                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {/* Delete User Button */}
                              <button
                                onClick={() => handleDeleteUser(u.id, u.phone)}
                                title="حذف الحساب نهائياً"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CREATE ACCOUNT AND SEND CREDENTIALS */}
          {activeTab === 'create_account' && (
            <div className="max-w-2xl mx-auto space-y-5 bg-slate-950/70 p-5 sm:p-6 rounded-3xl border border-emerald-500/30">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">إنشاء وتوليد حساب طالب جديد مع مدة الوصول</h4>
                    <p className="text-xs text-slate-400">
                      يمكنك تحديد مدة الاشتراك وإنشاء كلمة سر وإرسال بيانات الدخول للطالب فوراً عبر واتساب أو نسخها
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  حفظ دائم في سحابة Neon
                </span>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
                {/* 1. Phone Number (Primary field) */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>1. رقم هاتف الطالب (اسم المستخدم) *</span>
                    </span>
                    <span className="text-[11px] text-slate-500">مطلوب لتسجيل الدخول</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={createPhone}
                      onChange={(e) => setCreatePhone(e.target.value)}
                      placeholder="مثال: 771234567 أو 734567890 أو 785502919"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm tracking-wider focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* 2. Password with manual entry & generate button */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>2. كلمة السر المراد تعيينها *</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>توليد كلمة سر عشوائية (مثل: 654321EUI)</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      placeholder="اكتب كلمة سر أو اضغط زر التوليد بالأعلى..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm tracking-wider focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* 3. Access Duration */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>3. مدة صلاحية الوصول الممنوحة للطالب *</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: '1month', label: 'شهر واحد' },
                      { id: '3months', label: '3 أشهر (فصل)' },
                      { id: '6months', label: '6 أشهر' },
                      { id: '1year', label: 'سنة كاملة' },
                      { id: 'unlimited', label: 'وصول دائم' },
                    ].map((dur) => (
                      <button
                        key={dur.id}
                        type="button"
                        onClick={() => setCreateDuration(dur.id as any)}
                        className={`py-2 px-2 rounded-xl text-center font-bold text-xs transition border ${
                          createDuration === dur.id
                            ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional fields: Student Name & University */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-slate-400 block mb-1">اسم الطالب (اختياري):</label>
                    <input
                      type="text"
                      value={createStudentName}
                      onChange={(e) => setCreateStudentName(e.target.value)}
                      placeholder="اسم الطالب الكامل..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">الجامعة:</label>
                    <select
                      value={createUniv}
                      onChange={(e) => setCreateUniv(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {YEMENI_UNIVERSITIES.map((u) => (
                        <option key={u.id} value={u.nameAr}>
                          {u.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 text-sm mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>إنشاء الحساب وحفظه في قاعدة البيانات</span>
                </button>
              </form>

              {/* Feedback if updated or error */}
              {createFeedback && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                    createFeedback.success
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {createFeedback.success ? (
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{createFeedback.msg}</span>
                </div>
              )}

              {/* Ready-to-Send Credentials Card */}
              {createdCredentials && (
                <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs sm:text-sm">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>بيانات الدخول جاهزة للإرسال:</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      تم الحفظ والتفعيل
                    </span>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-sans block text-[11px]">اسم المستخدم (الهاتف):</span>
                      <strong className="text-white text-sm tracking-wider">{createdCredentials.phone}</strong>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-sans block text-[11px]">كلمة السر:</span>
                      <strong className="text-amber-300 text-sm tracking-wider">{createdCredentials.password}</strong>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-sans block text-[11px]">تاريخ الانتهاء:</span>
                      <span className="text-purple-300 font-sans font-bold">{createdCredentials.expiresAtText}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-sans block text-[11px]">رابط الدخول:</span>
                      <span className="text-blue-300 text-[11px] truncate block">{createdCredentials.labUrl}</span>
                    </div>
                  </div>

                  {/* Pre-formatted Message Preview */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-all">
                    {createdCredentials.formattedMessage}
                  </div>

                  {/* Sending Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCredentials}
                      className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow"
                    >
                      {copiedCredentials ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCredentials ? 'تم نسخ الرسالة بنجاح!' : 'نسخ الرسالة بالكامل'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSendViaWhatsApp}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>إرسال عبر واتساب للطالب</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVATE DIRECTLY BY PHONE */}
          {activeTab === 'activate' && (
            <div className="max-w-xl mx-auto space-y-5 bg-slate-950/60 p-6 rounded-3xl border border-slate-800">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                  <Phone className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-base">تفعيل حساب طالب مباشرة برقم الهاتف</h4>
                <p className="text-xs text-slate-400">
                  عندما يرسل لك الطالب رسالة على واتساب (785502919) برقم هاتفه، أدخل الرقم هنا لتفعيله فوراً
                </p>
              </div>

              <form onSubmit={handleActivateByPhone} className="space-y-3">
                <div className="relative">
                  <input
                    type="tel"
                    value={phoneToActivate}
                    onChange={(e) => setPhoneToActivate(e.target.value)}
                    placeholder="أدخل رقم هاتف الطالب: 771234567 أو 734567890"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-white text-center font-mono text-base tracking-wider focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-bold transition shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>تفعيل الحساب فورياً</span>
                </button>
              </form>

              {activationFeedback && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                    activationFeedback.success
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {activationFeedback.success ? (
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{activationFeedback.msg}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB: NEON DATABASE STATUS & REAL DIAGNOSTICS */}
          {activeTab === 'neon_db' && (
            <div className="space-y-4 max-w-3xl mx-auto text-xs">
              {/* Real-time Status Card */}
              <div className={`p-5 rounded-3xl border ${
                neonStatus?.connected 
                  ? 'bg-slate-950/80 border-emerald-500/40 shadow-emerald-950/20 shadow-xl' 
                  : 'bg-slate-950/80 border-amber-500/40 shadow-amber-950/20 shadow-xl'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg ${
                      neonStatus?.connected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">سحابة Neon Cloud PostgreSQL</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                          neonStatus?.connected 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${neonStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                          <span>{neonStatus?.connected ? 'متصل وحي' : 'غير متصل بالبيئة المحلية'}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        الربط السحابي الدائم لبيانات الطلاب وطلبات التفعيل عبر السيرفرلس
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={loadData}
                    disabled={isLoadingDb}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDb ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>فحص وتحديث الاتصال</span>
                  </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-4 text-xs font-mono">
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 font-sans block text-[11px]">اسم قاعدة البيانات:</span>
                    <strong className="text-white text-sm">{neonStatus?.databaseName || 'neondb'}</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 font-sans block text-[11px]">زمن الاستجابة (Latency):</span>
                    <span className="text-emerald-400 font-black text-sm">
                      {neonStatus?.latencyMs !== undefined ? `${neonStatus.latencyMs} ms` : 'غير متصل'}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 font-sans block text-[11px]">المستخدمون في Neon:</span>
                    <span className="text-purple-300 text-sm font-bold">
                      {neonStatus?.stats ? `${neonStatus.stats.activatedUsers} / ${neonStatus.stats.totalUsers}` : totalUsers}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                    <span className="text-slate-400 font-sans block text-[11px]">الطلبات المعلقة:</span>
                    <span className="text-blue-300 text-sm font-bold">
                      {neonStatus?.stats?.pendingRequests ?? accessRequests.filter(r => r.status === 'pending').length}
                    </span>
                  </div>
                </div>

                {/* Masked Connection String */}
                <div className="mt-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-slate-400 font-sans">عنوان الاتصال:</span>
                    <span className="text-slate-300 select-all truncate">{neonStatus?.maskedDatabaseUrl || 'DATABASE_URL (Vercel Ready)'}</span>
                  </div>
                  <span className="text-slate-500 font-sans text-[10px]">اتصال سحابي مشفر SSL متوافق</span>
                </div>
              </div>

              {/* Real Diagnostic Testing Tools */}
              <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-white text-sm">أدوات الفحص والتحقق لقاعدة بيانات Neon</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Test 1: Real Read/Write Ping */}
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>1. اختبار القراءة والكتابة الحي (Real Write & Read)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      يقوم بكتابة سجل اختباري مؤقت في جدول الإعدادات داخل سحابة Neon ثم قراءته ومسحه للتأكد من صلاحيات الكتابة والقراءة الحية.
                    </p>
                    <button
                      type="button"
                      onClick={handleTestDatabaseRw}
                      disabled={isTestingRw}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow shadow-emerald-950/40"
                    >
                      {isTestingRw ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جاري فحص القراءة والكتابة...</span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-4 h-4" />
                          <span>بدء فحص القراءة والكتابة</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Test 2: Schema Sync */}
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <Database className="w-4 h-4 text-purple-400" />
                      <span>2. مزامنة وتهيئة الجداول (Schema Re-Sync)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      يتحقق من وجود جميع الجداول اللازمة (users) و (access_requests) و (system_settings) والأعمدة المحدثة والفهارس في Neon.
                    </p>
                    <button
                      type="button"
                      onClick={handleForceDatabaseInit}
                      disabled={isForcingInit}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow shadow-purple-950/40"
                    >
                      {isForcingInit ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جاري تهيئة ومزامنة الجداول...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>تحديث ومزامنة جداول Neon الآن</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Diagnostics Results Output */}
                {rwTestResult && (
                  <div className={`p-4 rounded-2xl border font-mono text-xs space-y-2 ${
                    rwTestResult.success 
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  }`}>
                    <div className="flex items-center gap-2 font-bold font-sans">
                      {rwTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                      <span>نتيجة اختبار القراءة والكتابة:</span>
                    </div>
                    <p className="text-white font-sans">{rwTestResult.message}</p>
                    {rwTestResult.writeLatencyMs !== undefined && (
                      <div className="flex flex-wrap gap-4 text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                        <span>سرعة الكتابة (Write): <strong>{rwTestResult.writeLatencyMs}ms</strong></span>
                        <span>سرعة القراءة (Read): <strong>{rwTestResult.readLatencyMs}ms</strong></span>
                        <span>الزمن الكلي: <strong>{rwTestResult.totalRoundTripMs}ms</strong></span>
                      </div>
                    )}
                  </div>
                )}

                {forceInitResult && (
                  <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                    forceInitResult.success 
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  }`}>
                    <div className="flex items-center gap-2 font-bold">
                      {forceInitResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                      <span>{forceInitResult.message}</span>
                    </div>
                    {forceInitResult.tables && (
                      <span className="text-[11px] text-slate-300 block font-mono">
                        الجداول المفحوصة والمحدثة: {forceInitResult.tables.join(' • ')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Technical Architecture Details */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2 text-slate-400 text-[11px] leading-relaxed">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>آلية عمل السيرفرلس على Vercel:</span>
                </div>
                <p>
                  • عند النشر على Vercel، يتم حقن متغير البيئة <strong>DATABASE_URL</strong> تلقائياً إلى دوال السيرفرلس (Serverless Functions) في مسار <code>/api/*</code>.
                </p>
                <p>
                  • عندما يقوم أي طالب بطلب اشتراك من هاتفه، تُحفظ البيانات سحابياً في جدول <code>access_requests</code> لتراها هنا فورياً.
                </p>
                <p>
                  • تشفير كلمات السر يتم عبر خوارزمية <strong>bcrypt</strong> الموثوقة مع الحفظ السحابي في جدول <code>users</code>.
                </p>
                <p>
                  • في حال انقطاع الشبكة، تعمل المنصة بآلية النسخ الاحتياطي المحلي لتضمن عدم توقف التجارب المعملية.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ADD NEW MECHATRONICS LESSON / MATERIALS */}
          {activeTab === 'add_lesson' && (
            <form onSubmit={handleAddNewLesson} className="space-y-4 max-w-2xl mx-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">عنوان التجربة (بالعربية):</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: التحكم بمستوى السائل مع PID"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">عنوان التجربة بالإنجليزية (Title in English):</label>
                  <input
                    type="text"
                    value={newTitleEn}
                    onChange={(e) => setNewTitleEn(e.target.value)}
                    placeholder="e.g. Servo Speed Control with PID"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">السنة الدراسية:</label>
                  <select
                    value={newYear}
                    onChange={(e) => setNewYear(parseInt(e.target.value) as AcademicYear)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={1}>السنة الأولى (دوائر كهربائية)</option>
                    <option value={2}>السنة الثانية (إلكترونيات)</option>
                    <option value={3}>السنة الثالثة (أنظمة مدمجة ومحركات)</option>
                    <option value={4}>السنة الرابعة (تحكم آلي ونيوماتيك)</option>
                    <option value={5}>السنة الخامسة (روبوتات و PLC)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">تصنيف المعمل:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as LabCategory)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="circuits">دوائر كهربائية (Circuits)</option>
                    <option value="electronics">إلكترونيات قدرة</option>
                    <option value="embedded">أنظمة مدمجة وأردوينو</option>
                    <option value="control">أنظمة تحكم PID</option>
                    <option value="robotics">هندسة الروبوتات</option>
                    <option value="pneumatics">أنظمة نيوماتيك وهيدروليك</option>
                    <option value="plc">تحكم صناعي PLC</option>
                    <option value="graduation">مشاريع تخرج بيئة اليمن</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">المكونات المطلوبة للتجربة:</label>
                <input
                  type="text"
                  value={newComponents}
                  onChange={(e) => setNewComponents(e.target.value)}
                  placeholder="متحكم أردوينو • مقاومة 10k • محرك • مجس"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">النظرية الهندسية والمعادلات الحاكمة:</label>
                <textarea
                  value={newTheory}
                  onChange={(e) => setNewTheory(e.target.value)}
                  rows={3}
                  placeholder="اشرح المبدأ الفيزيائي والهندسي للتجربة..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">خطوات العمل المعملي (سطر لكل خطوة):</label>
                <textarea
                  value={newSteps}
                  onChange={(e) => setNewSteps(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                />
              </div>

              {lessonFeedback && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{lessonFeedback}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition shadow-lg shadow-amber-950/40 flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>حفظ ونشر التجربة في المنهج الأكاديمي</span>
              </button>
            </form>
          )}

          {/* TAB 4: OWNER PASSWORD & SECURITY SETTINGS */}
          {activeTab === 'security' && (
            <div className="max-w-2xl mx-auto space-y-5 text-xs">
              {/* Current Active Password Card */}
              <div className="bg-slate-950/80 p-5 rounded-3xl border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">رمز دخول المالك النشط حالياً</h4>
                      <p className="text-[11px] text-slate-400">هذا الرمز يمكنك استخدامه للدخول كمالك</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    نشط ومحفوظ
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                  <div className="flex-1 font-mono text-base font-black text-amber-400 tracking-wider">
                    {showPassword ? currentOwnerPassword : '••••••••••••'}
                  </div>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title={showPassword ? 'إخفاء' : 'إظهار'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleCopyPassword}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 transition"
                    title="نسخ الرمز"
                  >
                    {copiedPass ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPass ? 'تم النسخ' : 'نسخ الرمز'}</span>
                  </button>
                </div>
              </div>

              {/* Change Password Form */}
              <form onSubmit={handleUpdatePassword} className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-white">تغيير رمز دخول المالك وحفظه في سحابة Neon</h4>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">الرمز الجديد:</label>
                  <input
                    type="text"
                    value={newOwnerPasswordInput}
                    onChange={(e) => setNewOwnerPasswordInput(e.target.value)}
                    placeholder="أدخل رمز المالك الجديد..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                {passwordFeedback && (
                  <div
                    className={`p-3 rounded-xl flex items-center gap-2 ${
                      passwordFeedback.success
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {passwordFeedback.success ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{passwordFeedback.msg}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition shadow-lg shadow-purple-950 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>تأكيد وحفظ الرمز في Neon</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition flex items-center gap-1.5"
                    title="استعادة الرمز الافتراضي (785502919)"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>استعادة الافتراضي</span>
                  </button>
                </div>
              </form>

              {/* Master Recovery Passwords Info */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2 text-slate-300 leading-relaxed">
                <div className="font-bold text-amber-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>مفاتيح الأمان الاحتياطية للطوارئ (Master Recovery Keys):</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  إذا نسيت رمزك المخصص، يمكنك دائماً الدخول كمالك باستخدام أي من الرموز المعتمدة التالية:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-center">
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-amber-300 font-bold">
                    785502919
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-purple-300">
                    mechatronics2026
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-indigo-300">
                    admin785502919
                  </div>
                </div>
              </div>

              {/* Data Backup & Export */}
              <div className="flex justify-between items-center bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h5 className="font-bold text-white text-xs">النسخ الاحتياطي لبيانات المنصة</h5>
                  <p className="text-[10px] text-slate-400">تنزيل نسخة JSON كاملة من الحسابات والطلبات والدروس المخصصة</p>
                </div>
                <button
                  onClick={handleExportBackup}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition"
                >
                  <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>تصدير نسخة JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: EDIT USER CREDENTIALS & VALIDITY DURATION */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">تعديل صلاحيات وكلمة سر الطالب</h3>
              </div>
              <button
                onClick={() => setSelectedUserForEdit(null)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs font-mono space-y-1">
              <div className="text-slate-300 font-sans font-bold">{selectedUserForEdit.name}</div>
              <div className="text-slate-400">الهاتف: <strong className="text-white">{selectedUserForEdit.phone}</strong></div>
              <div className="text-slate-400">الجامعة: {selectedUserForEdit.university}</div>
              <div className="text-purple-300 font-sans text-[11px]">
                الصلاحية الحالية: {selectedUserForEdit.expiresAt === 'unlimited' ? 'دائم' : selectedUserForEdit.expiresAt || 'غير محدد'}
              </div>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-3.5 text-xs">
              {/* New Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-bold">تغيير كلمة السر (اتركها فارغة للإبقاء على الحالية):</label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomDigits = Math.floor(100000 + Math.random() * 900000);
                      setEditPasswordInput(`${randomDigits}EUI`);
                    }}
                    className="text-amber-400 hover:underline text-[11px] font-bold"
                  >
                    توليد عشوائي (6 أرقام)
                  </button>
                </div>
                <input
                  type="text"
                  value={editPasswordInput}
                  onChange={(e) => setEditPasswordInput(e.target.value)}
                  placeholder="كلمة السر الجديدة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Access Duration */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">تمديد صلاحية الوصول:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: '1month', label: 'شهر' },
                    { id: '3months', label: '3 أشهر' },
                    { id: '6months', label: '6 أشهر' },
                    { id: '1year', label: 'سنة' },
                    { id: 'unlimited', label: 'دائم' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setEditDurationInput(d.id as any)}
                      className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition border ${
                        editDurationInput === d.id
                          ? 'bg-amber-600 text-white border-amber-400 shadow'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {editUserFeedback && (
                <div className={`p-3 rounded-xl flex items-center gap-2 ${
                  editUserFeedback.success 
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}>
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{editUserFeedback.msg}</span>
                </div>
              )}

              {/* Quick WhatsApp & Copy if password was updated */}
              {editPasswordInput && editUserFeedback?.success && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-2">
                  <span className="text-[11px] font-bold text-emerald-300 block">البيانات الجديدة بعد التحديث:</span>
                  <div className="font-mono text-[11px] text-white">
                    <div>الهاتف: {selectedUserForEdit.phone}</div>
                    <div>كلمة السر: {editPasswordInput}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const msg = `مرحباً ${selectedUserForEdit.name}، تم تحديث بيانات دخولك للمختبر الافتراضي:\nالهاتف: ${selectedUserForEdit.phone}\nكلمة السر: ${editPasswordInput}\nالرابط: ${window.location.origin}`;
                        navigator.clipboard.writeText(msg);
                        setCopiedEditCredentials(true);
                        setTimeout(() => setCopiedEditCredentials(false), 2500);
                      }}
                      className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[11px]"
                    >
                      {copiedEditCredentials ? 'تم النسخ!' : 'نسخ البيانات'}
                    </button>
                    <a
                      href={`https://wa.me/967${selectedUserForEdit.phone.replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`مرحباً ${selectedUserForEdit.name}، تم تحديث بيانات دخولك للمختبر الافتراضي:\nالهاتف: ${selectedUserForEdit.phone}\nكلمة السر: ${editPasswordInput}\nالرابط: ${window.location.origin}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] text-center"
                    >
                      إرسال واتساب
                    </a>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition shadow-lg shadow-amber-950 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد التحديث في Neon</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
