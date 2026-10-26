import React, { useState, useEffect } from 'react';
import MokhalasaSvgLogo from '../brand/MokhalasaSvgLogo';
import { CustomerUser, CustomerAuthStatus } from '../../types';
import { authService } from '../../services/authService';
import { profileService } from '../../services/profileService';
import { otpService } from '../../services/otpService';
import { isWhatsAppServiceEnabled } from '../../services/whatsappService';
import { getPhoneValidationError, normalizeEgyptianPhone } from '../../utils/phoneValidator';
import { 
  X, ShieldCheck, Mail, Eye, EyeOff, Lock, User, Phone, MapPin, 
  CheckCircle2, AlertCircle, ArrowRight, MessageSquare, RotateCcw, KeyRound
} from 'lucide-react';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: CustomerUser) => void;
  initialTab?: 'login' | 'register';
  lang?: 'ar' | 'en';
}

const EGYPT_GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الشرقية', 
  'الدقهلية', 'البحيرة', 'الغربية', 'المنوفية', 'دمياط', 
  'كفر الشيخ', 'بورسعيد', 'الإسماعيلية', 'السويس', 'البحر الأحمر', 
  'جنوب سيناء', 'بني سويف', 'الفيوم', 'المنيا', 'أسيوط', 'سوهاج'
];

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = 'login',
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [authStatus, setAuthStatus] = useState<CustomerAuthStatus>('unauthenticated');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Account Deletion Grace Period Restore Prompt
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [pendingDeletionUser, setPendingDeletionUser] = useState<CustomerUser | null>(null);
  const [restoringUser, setRestoringUser] = useState(false);

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Phone or Email
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Forgot Password Flow State ('form' | 'forgot_phone' | 'forgot_otp' | 'forgot_new_password')
  const [loginView, setLoginView] = useState<'form' | 'forgot_phone' | 'forgot_otp' | 'forgot_new_password'>('form');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotCountdown, setForgotCountdown] = useState(45);

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGovernorate, setRegGovernorate] = useState('القاهرة');
  const [regEmail, setRegEmail] = useState(''); // Optional!
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  // Register OTP Step
  const [isRegisterOtpStep, setIsRegisterOtpStep] = useState(false);
  const [registerOtpCode, setRegisterOtpCode] = useState('');
  const [registerCountdown, setRegisterCountdown] = useState(45);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown timers
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isRegisterOtpStep && registerCountdown > 0) {
      timer = setTimeout(() => setRegisterCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [isRegisterOtpStep, registerCountdown]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (loginView === 'forgot_otp' && forgotCountdown > 0) {
      timer = setTimeout(() => setForgotCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [loginView, forgotCountdown]);

  // Reset states on modal open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setErrorMessage(null);
      setSuccessNotice(null);
      setAuthStatus('unauthenticated');
      setLoginView('form');
      setIsRegisterOtpStep(false);
      setRegisterOtpCode('');
      setForgotOtpCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // 1. LOGIN HANDLERS
  // -------------------------------------------------------------
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage('يرجى إدخال رقم الهاتف أو البريد الإلكتروني وكلمة المرور.');
      setAuthStatus('error');
      return;
    }

    setAuthStatus('authenticating');
    setErrorMessage(null);
    setIsSubmitting(true);

    const response = await authService.loginWithEmail({ 
      identifier: loginIdentifier.trim(), 
      password: loginPassword 
    });

    if (response.success && response.user) {
      const user = response.user;
      
      // Check 30-day deletion grace period
      if (user.accountStatus === 'pending_deletion') {
        const scheduledTime = user.deletionScheduledDate ? new Date(user.deletionScheduledDate).getTime() : 0;
        const now = Date.now();
        if (scheduledTime && now > scheduledTime) {
          // Hard delete expired!
          setAuthStatus('error');
          setErrorMessage('تم حذف هذا الحساب نهائياً بناءً على طلبك بعد انقضاء مهلة الـ 30 يوماً المحددة. يمكنك إنشاء حساب جديد برقم هاتف جديد.');
          setIsSubmitting(false);
          return;
        } else {
          // Inside 30 days grace period! Show prompt to cancel deletion or proceed
          setPendingDeletionUser(user);
          setShowRestorePrompt(true);
          setIsSubmitting(false);
          return;
        }
      }

      setAuthStatus('authenticated');
      setSuccessNotice('تم تسجيل الدخول بنجاح! مرحباً بك في مخلصة.');
      setTimeout(() => {
        onLoginSuccess(response.user!);
        onClose();
      }, 700);
    } else {
      setAuthStatus('error');
      setErrorMessage(response.message || 'بيانات الدخول غير صحيحة.');
    }
    setIsSubmitting(false);
  };

  const handleRestoreAccount = async () => {
    if (!pendingDeletionUser) return;
    setRestoringUser(true);
    const res = await profileService.cancelAccountDeletion(pendingDeletionUser.id);
    setRestoringUser(false);
    if (res.success) {
      const restored = { ...pendingDeletionUser, accountStatus: 'active' as const };
      delete restored.deletionRequestedAt;
      delete restored.deletionScheduledDate;
      setSuccessNotice('تم إلغاء طلب الحذف واستعادة حسابك بنجاح! أهلاً بك مجدداً.');
      setAuthStatus('authenticated');
      setTimeout(() => {
        onLoginSuccess(restored);
        onClose();
      }, 800);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleProceedWithPendingDeletion = () => {
    if (!pendingDeletionUser) return;
    onLoginSuccess(pendingDeletionUser);
    onClose();
  };

  // -------------------------------------------------------------
  // 2. FORGOT PASSWORD HANDLERS (VIA WHATSAPP OTP)
  // -------------------------------------------------------------
  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const phoneErr = getPhoneValidationError(forgotPhone);
    if (phoneErr) {
      setErrorMessage(phoneErr);
      setAuthStatus('error');
      return;
    }

    const cleanPhone = normalizeEgyptianPhone(forgotPhone);
    setIsSubmitting(true);

    try {
      const res = await otpService.generateAndSendOtp(cleanPhone, { purpose: 'reset_password' });
      if (res.success) {
        setLoginView('forgot_otp');
        setForgotCountdown(45);
        setSuccessNotice(`تم إرسال كود استعادة كلمة المرور عبر الواتساب إلى رقم: ${cleanPhone}`);
      } else {
        setErrorMessage(res.message);
        setAuthStatus('error');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ في الاتصال بالواتساب.');
      setAuthStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (forgotOtpCode.trim().length !== 4) {
      setErrorMessage('يرجى إدخال كود الـ OTP المكون من 4 أرقام.');
      setAuthStatus('error');
      return;
    }

    const cleanPhone = normalizeEgyptianPhone(forgotPhone);
    setIsSubmitting(true);

    try {
      const verifyRes = await otpService.verifyOtp(cleanPhone, forgotOtpCode.trim());
      if (verifyRes.success) {
        setLoginView('forgot_new_password');
        setSuccessNotice('تم التحقق من هويتك بنجاح! يرجى إدخال كلمة المرور الجديدة.');
      } else {
        setErrorMessage(verifyRes.message);
        setAuthStatus('error');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر التحقق من الكود.');
      setAuthStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (forgotNewPassword.length < 8) {
      setErrorMessage('يجب ألا تقل كلمة المرور عن 8 أحرف وأرقام.');
      setAuthStatus('error');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين.');
      setAuthStatus('error');
      return;
    }

    setIsSubmitting(true);
    setAuthStatus('authenticating');

    try {
      const cleanPhone = normalizeEgyptianPhone(forgotPhone);
      const res = await authService.resetPasswordWithPhone(cleanPhone, forgotNewPassword);

      if (res.success && res.user) {
        setAuthStatus('authenticated');
        setSuccessNotice('تم تعيين كلمة المرور الجديدة وتسجيل دخولك بنجاح!');
        setTimeout(() => {
          onLoginSuccess(res.user!);
          onClose();
        }, 800);
      } else {
        setErrorMessage(res.message || 'تعذر تحديث كلمة المرور.');
        setAuthStatus('error');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء حفظ كلمة المرور.');
      setAuthStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 3. REGISTRATION HANDLERS (PHONE MANDATORY + WHATSAPP OTP)
  // -------------------------------------------------------------
  const handleInitiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regFullName.trim()) {
      setErrorMessage('يرجى إدخال الاسم بالكامل.');
      setAuthStatus('error');
      return;
    }

    // Phone is MANDATORY
    const phoneValidationError = getPhoneValidationError(regPhone);
    if (phoneValidationError) {
      setErrorMessage(phoneValidationError);
      setAuthStatus('error');
      return;
    }
    const cleanPhone = normalizeEgyptianPhone(regPhone);

    // Email is OPTIONAL: validate only if entered
    if (regEmail.trim() && !regEmail.includes('@')) {
      setErrorMessage('صيغة البريد الإلكتروني غير صحيحة (أو يمكنك تركه فارغاً).');
      setAuthStatus('error');
      return;
    }

    if (regPassword.length < 8) {
      setErrorMessage('يجب ألا تقل كلمة المرور عن 8 أحرف وأرقام لحماية حسابك.');
      setAuthStatus('error');
      return;
    }

    // If WhatsApp service is disabled (trial finished or toggled off), register immediately!
    if (!isWhatsAppServiceEnabled()) {
      setIsSubmitting(true);
      setAuthStatus('authenticating');
      try {
        const response = await authService.registerWithEmail({
          fullName: regFullName.trim(),
          phone: cleanPhone,
          email: regEmail.trim() || undefined,
          password: regPassword,
          governorate: regGovernorate
        });

        if (response.success && response.user) {
          setAuthStatus('authenticated');
          setSuccessNotice('تم إنشاء حسابك وتفعيله بنجاح! مرحباً بك في مخلصة.');
          setTimeout(() => {
            onLoginSuccess(response.user!);
            onClose();
          }, 900);
        } else {
          setAuthStatus('error');
          setErrorMessage(response.message || 'تعذر إتمام التسجيل.');
        }
      } catch (err: any) {
        setAuthStatus('error');
        setErrorMessage(err?.message || 'حدث خطأ أثناء تفعيل الحساب.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Send dynamic single-use OTP via WhatsApp
      const res = await otpService.generateAndSendOtp(cleanPhone, { purpose: 'register' });
      if (res.success) {
        setIsRegisterOtpStep(true);
        setRegisterCountdown(45);
        setSuccessNotice(`تم إرسال كود التحقق (OTP) إلى واتساب رقمك: ${cleanPhone}`);
      } else {
        setErrorMessage(res.message);
        setAuthStatus('error');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل إرسال كود الواتساب. تأكد من اتصال الإنترنت.');
      setAuthStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct activation fallback if user didn't receive WhatsApp or trial ended
  const handleDirectActivationFallback = async () => {
    const cleanPhone = normalizeEgyptianPhone(regPhone);
    setIsSubmitting(true);
    setAuthStatus('authenticating');

    try {
      const response = await authService.registerWithEmail({
        fullName: regFullName.trim(),
        phone: cleanPhone,
        email: regEmail.trim() || undefined,
        password: regPassword,
        governorate: regGovernorate
      });

      if (response.success && response.user) {
        setAuthStatus('authenticated');
        setSuccessNotice('تم تفعيل حسابك بنجاح! مرحباً بك في مخلصة.');
        setTimeout(() => {
          onLoginSuccess(response.user!);
          onClose();
        }, 900);
      } else {
        setAuthStatus('error');
        setErrorMessage(response.message || 'تعذر إتمام التسجيل.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء تفعيل الحساب.');
      setAuthStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (registerOtpCode.trim().length !== 4) {
      setErrorMessage('يرجى كتابة كود الـ OTP المكون من 4 أرقام لتفعيل الحساب.');
      setAuthStatus('error');
      return;
    }

    const cleanPhone = normalizeEgyptianPhone(regPhone);
    setIsSubmitting(true);
    setAuthStatus('authenticating');

    try {
      // 1. Verify OTP strictly matching phone
      const verifyRes = await otpService.verifyOtp(cleanPhone, registerOtpCode.trim());
      if (!verifyRes.success) {
        setErrorMessage(verifyRes.message);
        setAuthStatus('error');
        setIsSubmitting(false);
        return;
      }

      // 2. Register account via Supabase Auth with verified state
      const response = await authService.registerWithEmail({
        fullName: regFullName.trim(),
        phone: cleanPhone,
        email: regEmail.trim() || undefined,
        password: regPassword,
        governorate: regGovernorate
      });

      if (response.success && response.user) {
        setAuthStatus('authenticated');
        setSuccessNotice('تم تأكيد كود الواتساب وتفعيل حسابك بنجاح! مرحباً بك في مخلصة.');
        setTimeout(() => {
          onLoginSuccess(response.user!);
          onClose();
        }, 900);
      } else {
        setAuthStatus('error');
        setErrorMessage(response.message || 'تعذر إتمام التسجيل.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء تفعيل الحساب.');
      setAuthStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google OAuth
  const handleGoogleSignIn = async () => {
    setAuthStatus('authenticating');
    setErrorMessage(null);

    const response = await authService.registerWithGoogle();
    if (!response.success) {
      setAuthStatus('error');
      setErrorMessage(response.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative flex flex-col max-h-[92vh] animate-scaleUp"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy text-white px-5 pt-5 pb-4 relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <MokhalasaSvgLogo variant="light" height={28} />
            <span className="text-3xs font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              بوابة العملاء
            </span>
          </div>

          {/* Tab Switcher: ONLY 2 TABS */}
          <div className="mt-4 flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => { 
                setActiveTab('login'); 
                setLoginView('form');
                setErrorMessage(null); 
                setSuccessNotice(null);
                setAuthStatus('unauthenticated');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'login'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>تسجيل الدخول</span>
            </button>

            <button
              type="button"
              onClick={() => { 
                setActiveTab('register'); 
                setIsRegisterOtpStep(false);
                setErrorMessage(null); 
                setSuccessNotice(null);
                setAuthStatus('unauthenticated');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>إنشاء حساب</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Loading Alert */}
          {authStatus === 'authenticating' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center space-y-1.5 animate-pulse">
              <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="font-extrabold text-xs text-brand-navy">
                جاري التحقق وتأمين حسابك في مخلصة...
              </div>
            </div>
          )}

          {/* Success Alert */}
          {authStatus === 'authenticated' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1 animate-fadeIn">
              <CheckCircle2 className="w-7 h-7 text-brand-green mx-auto" />
              <div className="font-black text-xs text-brand-navy">
                {successNotice || 'تمت العملية بنجاح!'}
              </div>
            </div>
          )}

          {/* Error Alert */}
          {authStatus === 'error' && errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">تنبيه:</span>
                <p className="text-2xs leading-relaxed text-rose-800">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: LOGIN FLOW */}
          {/* ========================================================= */}
          {activeTab === 'login' && authStatus !== 'authenticated' && (
            <>
              {/* SUBVIEW 0: RESTORE FROM PENDING DELETION PROMPT */}
              {showRestorePrompt && pendingDeletionUser && (
                <div className="space-y-4 py-2 text-right" dir="rtl">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <span>تنبيه: حسابك مسجل تحت طلب الحذف</span>
                    </div>
                    <p className="text-2xs text-slate-700 leading-relaxed">
                      أهلاً بك <strong>{pendingDeletionUser.name}</strong>! لقد تم تسجيل طلب لحذف هذا الحساب، والحساب حالياً في فترة السماح القانونية (30 يوماً).
                    </p>
                    <p className="text-2xs text-amber-800 font-bold">
                      هل تود التراجع عن طلب الحذف واستعادة حسابك وإعلاناتك الآن؟
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handleRestoreAccount}
                      disabled={restoringUser}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
                    >
                      <RotateCcw className={`w-4 h-4 ${restoringUser ? 'animate-spin' : ''}`} />
                      <span>{restoringUser ? 'جاري استعادة الحساب...' : 'نعم، إلغاء الحذف واستعادة الحساب الآن'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleProceedWithPendingDeletion}
                      className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition"
                    >
                      متابعة الدخول وإبقاء الحساب قيد الحذف
                    </button>
                  </div>
                </div>
              )}

              {/* SUBVIEW 1: STANDARD LOGIN FORM */}
              {!showRestorePrompt && loginView === 'form' && (
                <form onSubmit={handleSignIn} className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-xs text-slate-700 block text-right">
                      رقم الهاتف أو البريد الإلكتروني:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="010XXXXXXXX أو name@example.com"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-9"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-xs text-slate-700 block text-right">
                        كلمة المرور:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginView('forgot_phone');
                          setErrorMessage(null);
                          setSuccessNotice(null);
                          setForgotPhone(loginIdentifier.replace(/\D/g, '').length >= 10 ? loginIdentifier : '');
                        }}
                        className="text-3xs text-brand-green hover:underline font-bold"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-9"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute left-3 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري تسجيل الدخول...</span>
                      </>
                    ) : (
                      <span>تسجيل الدخول</span>
                    )}
                  </button>
                </form>
              )}

              {/* SUBVIEW 2: FORGOT PASSWORD - STEP 1 (PHONE) */}
              {loginView === 'forgot_phone' && (
                <form onSubmit={handleRequestForgotOtp} className="space-y-3 animate-fadeIn">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-2xs text-emerald-950 flex items-start gap-2">
                    <KeyRound className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block">استعادة كلمة المرور عبر الواتساب:</span>
                      <p className="text-3xs text-slate-600 leading-relaxed mt-0.5">
                        أدخل رقم هاتفك المسجل وسنرسل لك كود تحقق (OTP) على الواتساب لتعيين كلمة مرور جديدة فوراً.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-xs text-slate-700 block text-right">
                      رقم الهاتف المسجل (واتساب):
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        dir="ltr"
                        required
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-9"
                        autoFocus
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setLoginView('form')}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !forgotPhone.trim()}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>جاري إرسال الكود...</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>إرسال كود الواتساب</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* SUBVIEW 3: FORGOT PASSWORD - STEP 2 (OTP) */}
              {loginView === 'forgot_otp' && (
                <form onSubmit={handleVerifyForgotOtp} className="space-y-3 animate-fadeIn">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                    <span className="text-3xs text-emerald-800 font-bold block">
                      وصلك كود تحقق على الواتساب على رقمك:
                    </span>
                    <span className="text-sm font-black font-mono text-brand-navy dir-ltr block">
                      {forgotPhone}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-xs text-slate-700">
                        أدخل كود الـ OTP المكون من 4 أرقام:
                      </label>
                      <button
                        type="button"
                        onClick={() => setLoginView('forgot_phone')}
                        className="text-3xs text-brand-green font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <ArrowRight className="w-3 h-3 rotate-180" />
                        <span>تعديل الرقم</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      dir="ltr"
                      maxLength={4}
                      value={forgotOtpCode}
                      onChange={(e) => setForgotOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full py-3 text-center text-2xl font-black font-mono tracking-widest rounded-2xl border-2 border-brand-green/40 focus:border-brand-green focus:ring-4 focus:ring-brand-green/20 focus:outline-none bg-emerald-50/20 text-slate-900"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between text-3xs text-slate-500 font-bold px-1">
                    <span>صلاحية الكود: 5 دقائق</span>
                    {forgotCountdown > 0 ? (
                      <span className="text-slate-400">إعادة إرسال بعد ({forgotCountdown}ث)</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestForgotOtp}
                        className="text-brand-green hover:underline inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>إعادة الإرسال</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || forgotOtpCode.trim().length !== 4}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري التحقق...</span>
                      </>
                    ) : (
                      <span>تأكيد الكود ومتابعة</span>
                    )}
                  </button>
                </form>
              )}

              {/* SUBVIEW 4: FORGOT PASSWORD - STEP 3 (NEW PASSWORD) */}
              {loginView === 'forgot_new_password' && (
                <form onSubmit={handleSetNewPassword} className="space-y-3 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="font-bold text-xs text-slate-700 block text-right">
                      كلمة المرور الجديدة:
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="8 أحرف وأرقام على الأقل"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-9"
                        autoFocus
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-xs text-slate-700 block text-right">
                      تأكيد كلمة المرور الجديدة:
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="أعد إدخال كلمة المرور"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-9"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || forgotNewPassword.length < 8}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري حفظ كلمة المرور والدخول...</span>
                      </>
                    ) : (
                      <span>حفظ كلمة المرور والدخول</span>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* TAB 2: REGISTER FLOW (PHONE MANDATORY + WHATSAPP OTP) */}
          {/* ========================================================= */}
          {activeTab === 'register' && authStatus !== 'authenticated' && (
            <div className="space-y-3">
              {!isRegisterOtpStep ? (
                /* STEP 1: FILL INFO */
                <form onSubmit={handleInitiateRegistration} className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-xs text-slate-700 block text-right">
                      الاسم بالكامل (كما في بطاقة الرقم القومي):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="مثال: أحمد عبد الله محمود"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-9"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* MANDATORY PHONE INPUT */}
                  <div className="space-y-1">
                    <label className="font-black text-xs text-slate-800 flex items-center justify-between">
                      <span>رقم الهاتف المحمول (واتساب) <span className="text-rose-500">* أساسي</span></span>
                      <span className="text-3xs text-brand-green font-mono">11 رقماً</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        dir="ltr"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="w-full px-3 py-2 rounded-xl border-2 border-brand-green/30 focus:border-brand-green text-xs font-mono font-bold focus:ring-2 focus:ring-brand-green/20 focus:outline-none text-right pr-9"
                      />
                      <Phone className="w-4 h-4 text-brand-green absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* OPTIONAL EMAIL */}
                    <div className="space-y-1">
                      <label className="font-bold text-xs text-slate-700 flex items-center justify-between">
                        <span>البريد الإلكتروني:</span>
                        <span className="text-3xs text-slate-400 font-normal">(اختياري)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="name@example.com (اختياري)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-9"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    {/* GOVERNORATE */}
                    <div className="space-y-1">
                      <label className="font-bold text-xs text-slate-700 block text-right">
                        المحافظة:
                      </label>
                      <div className="relative">
                        <select
                          value={regGovernorate}
                          onChange={(e) => setRegGovernorate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-brand-green focus:outline-none pr-8"
                        >
                          {EGYPT_GOVERNORATES.map(gov => (
                            <option key={gov} value={gov}>{gov}</option>
                          ))}
                        </select>
                        <MapPin className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div className="space-y-1">
                    <label className="font-bold text-xs text-slate-700 block text-right">
                      كلمة المرور:
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="8 أحرف وأرقام على الأقل"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-9"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute left-3 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/50 rounded-xl text-3xs text-emerald-950 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-brand-green flex-shrink-0" />
                    <span>سنرسل لك كود تحقق (OTP) على رقم الواتساب لتفعيل الأكونت فوراً.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !regPhone.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري إرسال كود الواتساب...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        <span>إنشاء الحساب ومتابعة التحقق</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* STEP 2: WHATSAPP OTP VERIFICATION SCREEN */
                <form onSubmit={handleFinalizeRegistration} className="space-y-3 animate-fadeIn">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                    <span className="text-3xs text-emerald-800 font-bold block">
                      جالك كود تحقق (OTP) على الواتساب على رقمك:
                    </span>
                    <span className="text-sm font-black font-mono text-brand-navy dir-ltr block">
                      {regPhone}
                    </span>
                    <span className="text-3xs text-slate-500 block">
                      حط الكود المكون من 4 أرقام لتفعيل الأكونت مباشرة
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-xs text-slate-700">
                        كود الـ OTP:
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsRegisterOtpStep(false)}
                        className="text-3xs text-brand-green font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <ArrowRight className="w-3 h-3 rotate-180" />
                        <span>تعديل البيانات أو الرقم</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      dir="ltr"
                      maxLength={4}
                      value={registerOtpCode}
                      onChange={(e) => setRegisterOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full py-3 text-center text-2xl font-black font-mono tracking-widest rounded-2xl border-2 border-brand-green/40 focus:border-brand-green focus:ring-4 focus:ring-brand-green/20 focus:outline-none bg-emerald-50/20 text-slate-900"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between text-3xs text-slate-500 font-bold px-1">
                    <span>صلاحية الكود: 5 دقائق</span>
                    {registerCountdown > 0 ? (
                      <span className="text-slate-400">إعادة إرسال بعد ({registerCountdown}ث)</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleInitiateRegistration}
                        className="text-brand-green hover:underline inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>إعادة إرسال الكود</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || registerOtpCode.trim().length !== 4}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري التحقق وتفعيل الأكونت...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>حط الكود وفعل الأكونت</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2 text-3xs font-bold text-slate-400 absolute">
              أو
            </span>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm hover:shadow transition flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>المتابعة السريعة بحساب Google</span>
          </button>

          {/* Privacy Note */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-3xs font-bold transition inline-flex items-center gap-1"
            >
              <span>المتابعة كزائر دون تسجيل الآن</span>
              <ArrowRight className="w-3 h-3 rotate-180" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomerLoginModal;
