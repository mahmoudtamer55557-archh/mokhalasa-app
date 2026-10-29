import React, { useState, useEffect } from 'react';
import MokhalasaSvgLogo from '../brand/MokhalasaSvgLogo';
import { CustomerUser, CustomerAuthStatus } from '../../types';
import { authService } from '../../services/authService';
import { profileService } from '../../services/profileService';
import { otpService } from '../../services/otpService';
import { isWhatsAppServiceEnabled } from '../../services/whatsappService';
import { getPhoneValidationError, normalizeEgyptianPhone } from '../../utils/phoneValidator';
import {
  sanitizeInput,
  validateStrongPassword,
  checkRateLimit,
  recordFailedAttempt,
  validateAdultAge18Plus,
  getDeviceSecurityFingerprint,
  validateOrNormalizeMacAddress,
  getSafeUserErrorMessage,
} from '../../utils/securityGuard';
import {
  GOVERNORATES_LIST,
  getDistrictsForGovernorate,
  getSubAreasForDistrict,
} from '../../data/egyptLocationsHierarchy';
import { SecurityCaptcha } from '../security/SecurityCaptcha';
import { 
  X, ShieldCheck, Mail, Eye, EyeOff, Lock, User, Phone, MapPin, 
  CheckCircle2, AlertCircle, ArrowRight, MessageSquare, RotateCcw, KeyRound, Calendar, Cpu
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
  const [unregisteredPhoneToCreate, setUnregisteredPhoneToCreate] = useState<string | null>(null);
  const [matchedAccountName, setMatchedAccountName] = useState<string | null>(null);

  // Register Form State (Guided 2-Step Clean Flow)
  const [regFormStep, setRegFormStep] = useState<1 | 2>(1);
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGovernorate, setRegGovernorate] = useState('الجيزة');
  const [regDistrict, setRegDistrict] = useState('الهرم');
  const [regSubArea, setRegSubArea] = useState('مشعل');
  const [regDetailedAddress, setRegDetailedAddress] = useState('');
  const [regBirthDay, setRegBirthDay] = useState('15');
  const [regBirthMonth, setRegBirthMonth] = useState('05');
  const [regBirthYear, setRegBirthYear] = useState('1992');
  const [regBirthDate, setRegBirthDate] = useState('1992-05-15');
  const [regConfirmAdult18, setRegConfirmAdult18] = useState(true);
  const [regDeviceMacId] = useState(() => getDeviceSecurityFingerprint());
  const [regEmail, setRegEmail] = useState(''); // Optional!
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const updateBirthDateParts = (y: string, m: string, d: string) => {
    setRegBirthYear(y);
    setRegBirthMonth(m);
    setRegBirthDay(d);
    if (y && m && d) {
      setRegBirthDate(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    } else {
      setRegBirthDate('');
    }
  };

  // CAPTCHA States
  const [loginCaptchaVerified, setLoginCaptchaVerified] = useState(false);
  const [regCaptchaVerified, setRegCaptchaVerified] = useState(false);
  const [forgotCaptchaVerified, setForgotCaptchaVerified] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const handleGovernorateChange = (newGov: string) => {
    setRegGovernorate(newGov);
    const districts = getDistrictsForGovernorate(newGov);
    const firstDist = districts[0] || '';
    setRegDistrict(firstDist);
    const subs = getSubAreasForDistrict(newGov, firstDist);
    setRegSubArea(subs[0] || '');
  };

  const handleDistrictChange = (newDist: string) => {
    setRegDistrict(newDist);
    const subs = getSubAreasForDistrict(regGovernorate, newDist);
    setRegSubArea(subs[0] || '');
  };
  
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
      setRegFormStep(1);
      setIsRegisterOtpStep(false);
      setRegisterOtpCode('');
      setForgotOtpCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setUnregisteredPhoneToCreate(null);
      setMatchedAccountName(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // 1. LOGIN HANDLERS
  // -------------------------------------------------------------
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdent = sanitizeInput(loginIdentifier, 140);
    if (!cleanIdent || !loginPassword) {
      setErrorMessage('يرجى إدخال رقم الهاتف أو البريد الإلكتروني وكلمة المرور.');
      setAuthStatus('error');
      return;
    }

    if (!loginCaptchaVerified) {
      setErrorMessage('يرجى إتمام التحقق الأمني (كتابة رمز CAPTCHA) لحماية حسابك.');
      setAuthStatus('error');
      return;
    }

    setAuthStatus('authenticating');
    setErrorMessage(null);
    setIsSubmitting(true);

    const response = await authService.loginWithEmail({ 
      identifier: cleanIdent, 
      password: loginPassword 
    });

    if (response.success && response.user) {
      const user = response.user;
      setUnregisteredPhoneToCreate(null);
      
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
      if (response.errorCode === 'ACCOUNT_NOT_FOUND') {
        setUnregisteredPhoneToCreate(normalizeEgyptianPhone(loginIdentifier));
      } else {
        setUnregisteredPhoneToCreate(null);
      }
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
  // 2. FORGOT PASSWORD HANDLERS (VIA WHATSAPP OTP + DB ACCOUNT CHECK)
  // -------------------------------------------------------------
  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setUnregisteredPhoneToCreate(null);
    setMatchedAccountName(null);

    const phoneErr = getPhoneValidationError(forgotPhone);
    if (phoneErr) {
      setErrorMessage(phoneErr);
      setAuthStatus('error');
      return;
    }

    if (!forgotCaptchaVerified) {
      setErrorMessage('يرجى إتمام التحقق الأمني (كتابة رمز CAPTCHA) أولاً.');
      setAuthStatus('error');
      return;
    }

    const cleanPhone = normalizeEgyptianPhone(forgotPhone);
    const resetRate = checkRateLimit('password_reset', cleanPhone);
    if (!resetRate.allowed) {
      setErrorMessage(resetRate.message || 'تم إيقاف طلبات الاستعادة مؤقتاً لتكرار المحاولات.');
      setAuthStatus('error');
      return;
    }
    setIsSubmitting(true);

    try {
      // 1. Check Database first: Is this phone linked to any registered account?
      const accountCheck = await authService.checkPhoneAccountExists(cleanPhone);
      if (!accountCheck.exists || !accountCheck.account) {
        setUnregisteredPhoneToCreate(cleanPhone);
        setErrorMessage(`هذا الرقم (${cleanPhone}) غير مربوط بأي حساب مسجل في قاعدة البيانات! يجب إنشاء حساب جديد أولاً.`);
        setAuthStatus('error');
        setIsSubmitting(false);
        return;
      }

      setMatchedAccountName(accountCheck.account.fullName || 'عميل مخلصة');

      // 2. Phone is confirmed linked to an account -> Send WhatsApp OTP
      const res = await otpService.generateAndSendOtp(cleanPhone, {
        userId: accountCheck.account.userId,
        purpose: 'reset_password'
      });
      if (res.success) {
        setLoginView('forgot_otp');
        setForgotCountdown(45);
        setSuccessNotice(`تم التحقق من حساب (${accountCheck.account.fullName}) في قاعدة البيانات وإرسال كود استعادة كلمة المرور إلى واتساب: ${cleanPhone}`);
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

    const cleanPhone = normalizeEgyptianPhone(forgotPhone);
    const pwdStrength = validateStrongPassword(forgotNewPassword, cleanPhone);
    if (!pwdStrength.isValid) {
      setErrorMessage(pwdStrength.errors[0] || 'كلمة المرور الجديدة ضعيفة، يرجى اختيار كلمة مرور قوية.');
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

    const cleanName = sanitizeInput(regFullName, 120);
    if (!cleanName || cleanName.length < 3) {
      setErrorMessage('يرجى إدخال الاسم الثلاثي بالكامل كما في بطاقة الرقم القومي.');
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

    // Mandatory 18+ Age Verification
    const ageCheck = validateAdultAge18Plus(regBirthDate);
    if (!ageCheck.isAdult) {
      setErrorMessage(ageCheck.error || 'يشترط ألا يقل عمر المستخدم عن 18 عاماً كاملة للتسجيل في المنصة.');
      setAuthStatus('error');
      return;
    }

    if (!regConfirmAdult18) {
      setErrorMessage('يرجى الإقرار بأن عمرك 18 عاماً فأكثر وتتمتع بالأهلية القانونية الكاملة.');
      setAuthStatus('error');
      return;
    }

    // Detailed Hierarchical Address Check
    const cleanStreet = sanitizeInput(regDetailedAddress, 240);
    if (!regGovernorate || !regDistrict || !regSubArea || cleanStreet.length < 4) {
      setErrorMessage('يرجى تحديد العنوان بالتفصيل: المحافظة ← الحي/القسم ← المنطقة الفرعية ← الشارع والعقار.');
      setAuthStatus('error');
      return;
    }

    // Email is OPTIONAL: validate only if entered
    if (regEmail.trim() && !regEmail.includes('@')) {
      setErrorMessage('صيغة البريد الإلكتروني غير صحيحة (أو يمكنك تركه فارغاً).');
      setAuthStatus('error');
      return;
    }

    // Strong Password Policy Check
    const pwdStrength = validateStrongPassword(regPassword, cleanPhone);
    if (!pwdStrength.isValid) {
      setErrorMessage(pwdStrength.errors[0] || 'كلمة المرور ضعيفة، يرجى اختيار كلمة مرور قوية.');
      setAuthStatus('error');
      return;
    }

    if (!regCaptchaVerified) {
      setErrorMessage('يرجى إتمام التحقق الأمني (كتابة رمز CAPTCHA) للمتابعة.');
      setAuthStatus('error');
      return;
    }

    const boundMacId = validateOrNormalizeMacAddress(regDeviceMacId);

    // If WhatsApp service is disabled (trial finished or toggled off), register immediately!
    if (!isWhatsAppServiceEnabled()) {
      setIsSubmitting(true);
      setAuthStatus('authenticating');
      try {
        const response = await authService.registerWithEmail({
          fullName: cleanName,
          phone: cleanPhone,
          email: sanitizeInput(regEmail, 140) || undefined,
          password: regPassword,
          governorate: regGovernorate,
          district: regDistrict,
          subArea: regSubArea,
          detailedAddress: cleanStreet,
          birthDate: regBirthDate,
          deviceMacId: boundMacId,
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
        setErrorMessage(getSafeUserErrorMessage(err, 'حدث خطأ أثناء تفعيل الحساب.'));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Check Database first: Is this phone already linked to an existing account?
      const existingCheck = await authService.checkPhoneAccountExists(cleanPhone);
      if (existingCheck.exists) {
        recordFailedAttempt('register', cleanPhone);
        setErrorMessage(`هذا الرقم (${cleanPhone}) مربوط بالفعل بحساب مسجل في قاعدة البيانات (${existingCheck.account?.fullName || 'عميل مخلصة'})! يرجى تسجيل الدخول أو استخدام «نسيت كلمة المرور».`);
        setAuthStatus('error');
        setIsSubmitting(false);
        return;
      }

      // 2. Send dynamic single-use OTP via WhatsApp
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
      setErrorMessage(getSafeUserErrorMessage(err, 'فشل إرسال كود الواتساب. تأكد من اتصال الإنترنت.'));
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
        fullName: sanitizeInput(regFullName, 120),
        phone: cleanPhone,
        email: sanitizeInput(regEmail, 140) || undefined,
        password: regPassword,
        governorate: regGovernorate,
        district: regDistrict,
        subArea: regSubArea,
        detailedAddress: sanitizeInput(regDetailedAddress, 240),
        birthDate: regBirthDate,
        deviceMacId: validateOrNormalizeMacAddress(regDeviceMacId),
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
      setErrorMessage(getSafeUserErrorMessage(err, 'حدث خطأ أثناء تفعيل الحساب.'));
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

      // 2. Register account via Supabase Auth with verified state, address, age 18+, & MAC
      const response = await authService.registerWithEmail({
        fullName: sanitizeInput(regFullName, 120),
        phone: cleanPhone,
        email: sanitizeInput(regEmail, 140) || undefined,
        password: regPassword,
        governorate: regGovernorate,
        district: regDistrict,
        subArea: regSubArea,
        detailedAddress: sanitizeInput(regDetailedAddress, 240),
        birthDate: regBirthDate,
        deviceMacId: validateOrNormalizeMacAddress(regDeviceMacId),
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
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden relative flex flex-col max-h-[92vh] animate-scaleUp"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Premium Calm Header */}
        <div className="bg-gradient-to-br from-brand-navy via-slate-900 to-brand-navy text-white px-6 pt-5 pb-4 relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <MokhalasaSvgLogo variant="light" height={30} />
            <span className="text-2xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              بوابة العملاء الآمنة
            </span>
          </div>

          {/* Clean Tab Switcher */}
          <div className="mt-4 flex bg-slate-800/90 p-1 rounded-2xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => { 
                setActiveTab('login'); 
                setLoginView('form');
                setErrorMessage(null); 
                setSuccessNotice(null);
                setAuthStatus('unauthenticated');
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>

            <button
              type="button"
              onClick={() => { 
                setActiveTab('register'); 
                setRegFormStep(1);
                setIsRegisterOtpStep(false);
                setErrorMessage(null); 
                setSuccessNotice(null);
                setAuthStatus('unauthenticated');
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>حساب جديد</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Loading Alert */}
          {authStatus === 'authenticating' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-center space-y-1.5 animate-pulse">
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
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2 animate-fadeIn">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">يرجى الملاحظة:</span>
                  <p className="text-xs leading-relaxed text-rose-800">{errorMessage}</p>
                </div>
              </div>
              {unregisteredPhoneToCreate && activeTab === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setRegPhone(unregisteredPhoneToCreate);
                    setActiveTab('register');
                    setRegFormStep(1);
                    setIsRegisterOtpStep(false);
                    setErrorMessage(null);
                    setAuthStatus('unauthenticated');
                    setUnregisteredPhoneToCreate(null);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>إنشاء حساب جديد برقم ({unregisteredPhoneToCreate}) الآن</span>
                </button>
              )}
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
                    <p className="text-xs text-slate-700 leading-relaxed">
                      أهلاً بك <strong>{pendingDeletionUser.name}</strong>! لقد تم تسجيل طلب لحذف هذا الحساب، والحساب حالياً في فترة السماح القانونية (30 يوماً).
                    </p>
                    <p className="text-xs text-amber-800 font-bold">
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
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-xs sm:text-sm text-slate-700 block text-right">
                      رقم الموبايل أو البريد الإلكتروني
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="مثال: 01012345678"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-medium focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green focus:outline-none text-right pr-10 transition"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-xs sm:text-sm text-slate-700 block text-right">
                        كلمة المرور
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginView('forgot_phone');
                          setErrorMessage(null);
                          setSuccessNotice(null);
                          setForgotPhone(loginIdentifier.replace(/\D/g, '').length >= 10 ? loginIdentifier : '');
                        }}
                        className="text-xs text-brand-green hover:underline font-bold"
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
                        placeholder="اكتب كلمة المرور"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-medium focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green focus:outline-none text-right pr-10 pl-10 transition"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <SecurityCaptcha
                    onVerifyChange={setLoginCaptchaVerified}
                    resetTrigger={captchaResetKey}
                    compact
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري تسجيل الدخول...</span>
                      </>
                    ) : (
                      <span>تسجيل الدخول إلى حسابي</span>
                    )}
                  </button>
                </form>
              )}

              {/* SUBVIEW 2: FORGOT PASSWORD - STEP 1 (PHONE) */}
              {loginView === 'forgot_phone' && (
                <form onSubmit={handleRequestForgotOtp} className="space-y-4 animate-fadeIn">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 flex items-start gap-2.5">
                    <KeyRound className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block">استعادة كلمة المرور عبر الواتساب</span>
                      <p className="text-2xs text-slate-600 leading-relaxed mt-0.5">
                        اكتب رقم الموبايل المسجل به حسابك، وسنرسل لك كود مكون من 4 أرقام على الواتساب لتغيير كلمة المرور فوراً.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-xs sm:text-sm text-slate-700 block text-right">
                      رقم الموبايل المسجل (واتساب):
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        dir="ltr"
                        required
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-10"
                        autoFocus
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <SecurityCaptcha
                    onVerifyChange={setForgotCaptchaVerified}
                    resetTrigger={captchaResetKey}
                    compact
                  />

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setLoginView('form')}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                    >
                      رجوع
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !forgotPhone.trim()}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>جاري إرسال الكود...</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          <span>إرسال كود الواتساب</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* SUBVIEW 3: FORGOT PASSWORD - STEP 2 (OTP) */}
              {loginView === 'forgot_otp' && (
                <form onSubmit={handleVerifyForgotOtp} className="space-y-4 animate-fadeIn">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                    {matchedAccountName && (
                      <span className="text-xs text-emerald-950 font-black block">
                        ✓ الحساب المسجل: {matchedAccountName}
                      </span>
                    )}
                    <span className="text-2xs text-emerald-800 font-bold block">
                      وصلك كود التحقق على الواتساب على رقمك:
                    </span>
                    <span className="text-sm font-black font-mono text-brand-navy dir-ltr block">
                      {forgotPhone}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-xs text-slate-700">
                        اكتب كود الواتساب (4 أرقام):
                      </label>
                      <button
                        type="button"
                        onClick={() => setLoginView('forgot_phone')}
                        className="text-2xs text-brand-green font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <ArrowRight className="w-3 h-3 rotate-180" />
                        <span>تعديل الرقم</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      maxLength={4}
                      value={forgotOtpCode}
                      onChange={(e) => setForgotOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full py-3 text-center text-2xl font-black font-mono tracking-widest rounded-2xl border-2 border-brand-green/40 focus:border-brand-green focus:ring-4 focus:ring-brand-green/20 focus:outline-none bg-emerald-50/20 text-slate-900"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between text-2xs text-slate-500 font-bold px-1">
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
                    className="w-full py-3 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                <form onSubmit={handleSetNewPassword} className="space-y-4 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="font-bold text-xs sm:text-sm text-slate-700 block text-right">
                      كلمة المرور الجديدة:
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="8 خانات تشمل حرف كبير ورقم ورمز (@ أو #)"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-10"
                        autoFocus
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-xs sm:text-sm text-slate-700 block text-right">
                      تأكيد كلمة المرور الجديدة:
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="أعد كتابة كلمة المرور الجديدة"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-10"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || forgotNewPassword.length < 8}
                    className="w-full py-3 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
          {/* TAB 2: REGISTER FLOW (SMOOTH 2-STEP GUIDED FORM + OTP) */}
          {/* ========================================================= */}
          {activeTab === 'register' && authStatus !== 'authenticated' && (() => {
            const pwdStrength = validateStrongPassword(regPassword, regPhone);
            const availableDistricts = getDistrictsForGovernorate(regGovernorate);
            const availableSubAreas = getSubAreasForDistrict(regGovernorate, regDistrict);
            const maxAdultYear = new Date().getFullYear() - 18;
            const birthYears = Array.from({ length: 75 }, (_, i) => String(maxAdultYear - i));
            const birthMonths = [
              { val: '01', label: '1 - يناير' },
              { val: '02', label: '2 - فبراير' },
              { val: '03', label: '3 - مارس' },
              { val: '04', label: '4 - أبريل' },
              { val: '05', label: '5 - مايو' },
              { val: '06', label: '6 - يونيو' },
              { val: '07', label: '7 - يوليو' },
              { val: '08', label: '8 - أغسطس' },
              { val: '09', label: '9 - سبتمبر' },
              { val: '10', label: '10 - أكتوبر' },
              { val: '11', label: '11 - نوفمبر' },
              { val: '12', label: '12 - ديسمبر' },
            ];
            const birthDays = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

            const handleProceedToRegStep2 = () => {
              setErrorMessage(null);
              const cleanName = sanitizeInput(regFullName, 120);
              if (!cleanName || cleanName.length < 3) {
                setErrorMessage('يرجى كتابة الاسم الثلاثي بالكامل.');
                setAuthStatus('error');
                return;
              }
              const phoneErr = getPhoneValidationError(regPhone);
              if (phoneErr) {
                setErrorMessage(phoneErr);
                setAuthStatus('error');
                return;
              }
              const ageCheck = validateAdultAge18Plus(regBirthDate);
              if (!ageCheck.isAdult) {
                setErrorMessage(ageCheck.error || 'يشترط أن يكون السن 18 عاماً فأكثر.');
                setAuthStatus('error');
                return;
              }
              setAuthStatus('unauthenticated');
              setRegFormStep(2);
            };

            return (
              <div className="space-y-4">
                {!isRegisterOtpStep ? (
                  <>
                    {/* Clean Step Progress Bar (Step 1 of 2 / Step 2 of 2) */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setRegFormStep(1)}
                        className={`flex-1 flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-xs font-bold transition ${
                          regFormStep === 1
                            ? 'bg-white text-brand-navy shadow-xs border border-slate-200/80'
                            : 'text-emerald-700 hover:bg-white/60'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs font-black ${
                          regFormStep === 1 ? 'bg-brand-green text-white' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {regFormStep > 1 ? '✓' : '1'}
                        </span>
                        <span>١. البيانات الأساسية</span>
                      </button>

                      <div className="w-4 h-0.5 bg-slate-200 rounded-full" />

                      <button
                        type="button"
                        onClick={handleProceedToRegStep2}
                        className={`flex-1 flex items-center gap-2 py-1.5 px-2.5 rounded-xl text-xs font-bold transition ${
                          regFormStep === 2
                            ? 'bg-white text-brand-navy shadow-xs border border-slate-200/80'
                            : 'text-slate-400'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs font-black ${
                          regFormStep === 2 ? 'bg-brand-green text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          2
                        </span>
                        <span>٢. العنوان وكلمة المرور</span>
                      </button>
                    </div>

                    {regFormStep === 1 ? (
                      /* ================= REGISTER STEP 1: BASIC INFO ================= */
                      <div className="space-y-4 animate-fadeIn">
                        {/* Full Name */}
                        <div className="space-y-1.5">
                          <label className="font-bold text-xs sm:text-sm text-slate-700 block text-right">
                            الاسم الثلاثي بالكامل <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={regFullName}
                              onChange={(e) => setRegFullName(e.target.value)}
                              placeholder="مثال: أحمد عبد الله محمود"
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-medium focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green focus:outline-none text-right pr-10 transition"
                            />
                            <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                          </div>
                        </div>

                        {/* Phone (WhatsApp) */}
                        <div className="space-y-1.5">
                          <label className="font-bold text-xs sm:text-sm text-slate-700 flex items-center justify-between">
                            <span>رقم الموبايل (واتساب) <span className="text-rose-500">*</span></span>
                            <span className="text-2xs text-brand-green font-bold">لتأكيد الحساب واستقبال العروض</span>
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              inputMode="tel"
                              required
                              dir="ltr"
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value)}
                              placeholder="01012345678"
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-mono font-bold focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green focus:outline-none text-right pr-10 transition"
                            />
                            <Phone className="w-4 h-4 text-brand-green absolute right-3.5 top-3 pointer-events-none" />
                          </div>
                        </div>

                        {/* Easy 3-Dropdown Birth Date Selector (18+) */}
                        <div className="space-y-1.5">
                          <label className="font-bold text-xs sm:text-sm text-slate-700 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-brand-green" />
                              <span>تاريخ الميلاد <span className="text-rose-500">*</span></span>
                            </span>
                            <span className="text-2xs text-slate-500 font-medium">18 سنة فأكثر</span>
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <select
                              value={regBirthDay}
                              onChange={(e) => updateBirthDateParts(regBirthYear, regBirthMonth, e.target.value)}
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green focus:outline-none"
                            >
                              {birthDays.map((d) => (
                                <option key={d} value={d}>يوم {Number(d)}</option>
                              ))}
                            </select>

                            <select
                              value={regBirthMonth}
                              onChange={(e) => updateBirthDateParts(regBirthYear, e.target.value, regBirthDay)}
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green focus:outline-none"
                            >
                              {birthMonths.map((m) => (
                                <option key={m.val} value={m.val}>{m.label}</option>
                              ))}
                            </select>

                            <select
                              value={regBirthYear}
                              onChange={(e) => updateBirthDateParts(e.target.value, regBirthMonth, regBirthDay)}
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green focus:outline-none"
                            >
                              {birthYears.map((y) => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleProceedToRegStep2}
                          className="w-full py-3 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99]"
                        >
                          <span>التالي: تحديد العنوان وكلمة المرور</span>
                          <ArrowRight className="w-4 h-4 rotate-180" />
                        </button>
                      </div>
                    ) : (
                      /* ================= REGISTER STEP 2: ADDRESS & PASSWORD ================= */
                      <form onSubmit={handleInitiateRegistration} className="space-y-4 animate-fadeIn">
                        {/* Clean Hierarchical Egyptian Address Card */}
                        <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-brand-navy flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-brand-green" />
                              <span>عنوان الإقامة بالتفصيل <span className="text-rose-500">*</span></span>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-2xs font-bold text-slate-600 mb-1">
                                المحافظة
                              </label>
                              <select
                                value={regGovernorate}
                                onChange={(e) => handleGovernorateChange(e.target.value)}
                                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green focus:outline-none"
                              >
                                {GOVERNORATES_LIST.map((gov) => (
                                  <option key={gov} value={gov}>{gov}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-2xs font-bold text-slate-600 mb-1">
                                الحي / القسم
                              </label>
                              <select
                                value={regDistrict}
                                onChange={(e) => handleDistrictChange(e.target.value)}
                                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green focus:outline-none"
                              >
                                {availableDistricts.map((dist) => (
                                  <option key={dist} value={dist}>{dist}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-2xs font-bold text-slate-600 mb-1">
                                المنطقة الفرعية
                              </label>
                              <select
                                value={regSubArea}
                                onChange={(e) => setRegSubArea(e.target.value)}
                                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green focus:outline-none"
                              >
                                {availableSubAreas.map((sub) => (
                                  <option key={sub} value={sub}>{sub}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-2xs font-bold text-slate-600 mb-1">
                              الشارع أو أقرب علامة مميزة <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={regDetailedAddress}
                              onChange={(e) => setRegDetailedAddress(e.target.value)}
                              placeholder={`مثال: ${regDistrict} - ${regSubArea} - شارع...`}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium bg-white focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Strong Password with 1-Click Helper */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-xs sm:text-sm text-slate-700">
                              كلمة المرور <span className="text-rose-500">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const suggested = `Mokh#${Math.floor(1000 + Math.random() * 9000)}a`;
                                setRegPassword(suggested);
                                setShowRegPassword(true);
                              }}
                              className="text-2xs font-bold text-brand-green hover:underline"
                            >
                              ✨ اقتراح كلمة مرور قوية تلقائياً
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              required
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="8 خانات تشمل حرف كبير ورقم ورمز مثل # أو @"
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-medium focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green focus:outline-none text-right pr-10 pl-10 transition"
                            />
                            <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>

                          {regPassword.length > 0 && (
                            <div className="pt-1 space-y-1">
                              <div className="flex items-center justify-between text-2xs font-bold">
                                <span className="text-slate-500">مستوى أمان كلمة المرور:</span>
                                <span className={pwdStrength.colorClass.split(' ')[1]}>
                                  {pwdStrength.label}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${pwdStrength.colorClass.split(' ')[0]}`}
                                  style={{ width: `${pwdStrength.score}%` }}
                                />
                              </div>
                              {!pwdStrength.isValid && pwdStrength.errors[0] && (
                                <p className="text-2xs text-amber-700 font-bold">{pwdStrength.errors[0]}</p>
                              )}
                            </div>
                          )}
                        </div>

                        <SecurityCaptcha
                          onVerifyChange={setRegCaptchaVerified}
                          resetTrigger={captchaResetKey}
                          compact
                        />

                        {/* 18+ Legal Confirmation */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={regConfirmAdult18}
                            onChange={(e) => setRegConfirmAdult18(e.target.checked)}
                            className="w-4 h-4 accent-brand-green rounded"
                          />
                          <span className="text-2xs text-slate-600 font-bold">
                            أقر بصحة البيانات وأن عمري 18 عاماً فأكثر وأوافق على شروط المنصة.
                          </span>
                        </label>

                        <div className="flex items-center gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setRegFormStep(1)}
                            className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                          >
                            رجوع
                          </button>

                          <button
                            type="submit"
                            disabled={isSubmitting || !regPhone.trim()}
                            className="flex-1 py-3 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                          >
                            {isSubmitting ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>جاري إرسال كود الواتساب...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>إنشاء الحساب وتأكيد الواتساب</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                ) : (
                /* STEP 3: WHATSAPP OTP VERIFICATION SCREEN */
                <form onSubmit={handleFinalizeRegistration} className="space-y-4 animate-fadeIn">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                    <span className="text-xs text-emerald-800 font-bold block">
                      أرسلنا كود التحقق (OTP) على الواتساب لرقمك:
                    </span>
                    <span className="text-base font-black font-mono text-brand-navy dir-ltr block">
                      {regPhone}
                    </span>
                    <span className="text-2xs text-slate-500 block">
                      اكتب الـ 4 أرقام لتفعيل حسابك فوراً
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-xs text-slate-700">
                        كود الـ OTP:
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsRegisterOtpStep(false)}
                        className="text-2xs text-brand-green font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <ArrowRight className="w-3 h-3 rotate-180" />
                        <span>تعديل البيانات أو الرقم</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      maxLength={4}
                      value={registerOtpCode}
                      onChange={(e) => setRegisterOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full py-3.5 text-center text-2xl font-black font-mono tracking-widest rounded-2xl border-2 border-brand-green/40 focus:border-brand-green focus:ring-4 focus:ring-brand-green/20 focus:outline-none bg-emerald-50/20 text-slate-900"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between text-2xs text-slate-500 font-bold px-1">
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
                    className="w-full py-3 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري التحقق وتفعيل الحساب...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تأكيد الكود وتفعيل الحساب</span>
                      </>
                    )}
                  </button>
                </form>
              )}
              </div>
            );
          })()}

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-2xs font-bold text-slate-400 absolute">
              أو
            </span>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition flex items-center justify-center gap-2.5 active:scale-[0.99]"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>المتابعة السريعة بحساب Google</span>
          </button>

          {/* Subtle Security Assurance & Guest Link */}
          <div className="pt-1 flex items-center justify-between text-2xs text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>اتصال مشفر ومؤمّن بالكامل</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="hover:text-slate-700 font-bold transition inline-flex items-center gap-1"
            >
              <span>تصفح كزائر</span>
              <ArrowRight className="w-3 h-3 rotate-180" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomerLoginModal;
