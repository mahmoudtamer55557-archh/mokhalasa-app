import React, { useState, useEffect } from 'react';
import MokhalasaSvgLogo from '../brand/MokhalasaSvgLogo';
import { CustomerUser, CustomerAuthStatus } from '../../types';
import { authService } from '../../services/authService';
import { otpService } from '../../services/otpService';
import { getPhoneValidationError, normalizeEgyptianPhone } from '../../utils/phoneValidator';
import { 
  X, ShieldCheck, Mail, Eye, EyeOff, Lock, User, Phone, MapPin, 
  CheckCircle2, AlertCircle, ArrowRight, MessageSquare, RotateCcw
} from 'lucide-react';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: CustomerUser) => void;
  initialTab?: 'login' | 'register' | 'otp_login';
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
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'otp_login'>(initialTab);
  const [authStatus, setAuthStatus] = useState<CustomerAuthStatus>('unauthenticated');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Login with Email Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Quick WhatsApp OTP Login State
  const [otpLoginPhone, setOtpLoginPhone] = useState('');
  const [otpLoginCode, setOtpLoginCode] = useState('');
  const [isOtpLoginPending, setIsOtpLoginPending] = useState(false);
  const [otpLoginCountdown, setOtpLoginCountdown] = useState(45);

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGovernorate, setRegGovernorate] = useState('القاهرة');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  // Register OTP Step
  const [isRegisterOtpStep, setIsRegisterOtpStep] = useState(false);
  const [registerOtpCode, setRegisterOtpCode] = useState('');
  const [registerCountdown, setRegisterCountdown] = useState(45);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isRegisterOtpStep && registerCountdown > 0) {
      timer = setTimeout(() => setRegisterCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [isRegisterOtpStep, registerCountdown]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isOtpLoginPending && otpLoginCountdown > 0) {
      timer = setTimeout(() => setOtpLoginCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [isOtpLoginPending, otpLoginCountdown]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setErrorMessage(null);
      setSuccessNotice(null);
      setAuthStatus('unauthenticated');
      setIsRegisterOtpStep(false);
      setIsOtpLoginPending(false);
      setRegisterOtpCode('');
      setOtpLoginCode('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Handle Standard Email Login
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      setAuthStatus('error');
      return;
    }

    setAuthStatus('authenticating');
    setErrorMessage(null);
    setIsSubmitting(true);

    const response = await authService.loginWithEmail({ 
      email: loginEmail.trim(), 
      password: loginPassword 
    });

    if (response.success && response.user) {
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

  // Handle WhatsApp OTP Request for Quick Login
  const handleRequestOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const phoneErr = getPhoneValidationError(otpLoginPhone);
    if (phoneErr) {
      setErrorMessage(phoneErr);
      setAuthStatus('error');
      return;
    }

    const cleanPhone = normalizeEgyptianPhone(otpLoginPhone);
    setIsSubmitting(true);

    try {
      const res = await otpService.generateAndSendOtp(cleanPhone, { purpose: 'login' });
      if (res.success) {
        setIsOtpLoginPending(true);
        setOtpLoginCountdown(45);
        setSuccessNotice(`تم إرسال كود التحقق عبر الواتساب إلى رقم: ${cleanPhone}`);
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

  // Handle WhatsApp OTP Verification for Quick Login
  const handleVerifyOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otpLoginCode.trim().length !== 4) {
      setErrorMessage('يرجى إدخال كود الـ OTP المكون من 4 أرقام.');
      setAuthStatus('error');
      return;
    }

    const cleanPhone = normalizeEgyptianPhone(otpLoginPhone);
    setIsSubmitting(true);

    try {
      const verifyRes = await otpService.verifyOtp(cleanPhone, otpLoginCode.trim());
      if (!verifyRes.success) {
        setErrorMessage(verifyRes.message);
        setAuthStatus('error');
        setIsSubmitting(false);
        return;
      }

      const loginRes = await authService.loginWithVerifiedPhone(cleanPhone);
      if (loginRes.success && loginRes.user) {
        setAuthStatus('authenticated');
        setSuccessNotice('تم تسجيل الدخول وتوثيق رقم الواتساب بنجاح!');
        setTimeout(() => {
          onLoginSuccess(loginRes.user!);
          onClose();
        }, 700);
      } else {
        setErrorMessage(loginRes.message);
        setAuthStatus('error');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر تسجيل الدخول.');
      setAuthStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Step 1 of Registration: Validate and Send WhatsApp OTP
  const handleInitiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regFullName.trim()) {
      setErrorMessage('يرجى إدخال الاسم بالكامل.');
      setAuthStatus('error');
      return;
    }

    const phoneValidationError = getPhoneValidationError(regPhone);
    if (phoneValidationError) {
      setErrorMessage(phoneValidationError);
      setAuthStatus('error');
      return;
    }
    const cleanPhone = normalizeEgyptianPhone(regPhone);

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صحيح.');
      setAuthStatus('error');
      return;
    }

    if (regPassword.length < 8) {
      setErrorMessage('يجب ألا تقل كلمة المرور عن 8 أحرف وأرقام لحماية حسابك.');
      setAuthStatus('error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await otpService.generateAndSendOtp(cleanPhone, { purpose: 'register' });
      if (res.success) {
        setIsRegisterOtpStep(true);
        setRegisterCountdown(45);
        setSuccessNotice(`تم إرسال كود التحقق (OTP) إلى واتساب رقم: ${cleanPhone}`);
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

  // Handle Step 2 of Registration: Verify OTP and Create Final Account
  const handleFinalizeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (registerOtpCode.trim().length !== 4) {
      setErrorMessage('يرجى كتابة كود الـ OTP المكون من 4 أرقام.');
      setAuthStatus('error');
      return;
    }

    const cleanPhone = normalizeEgyptianPhone(regPhone);
    setIsSubmitting(true);
    setAuthStatus('authenticating');

    try {
      // 1. Verify OTP
      const verifyRes = await otpService.verifyOtp(cleanPhone, registerOtpCode.trim());
      if (!verifyRes.success) {
        setErrorMessage(verifyRes.message);
        setAuthStatus('error');
        setIsSubmitting(false);
        return;
      }

      // 2. Register account via Supabase Auth
      const response = await authService.registerWithEmail({
        fullName: regFullName.trim(),
        phone: cleanPhone,
        email: regEmail.trim(),
        password: regPassword,
        governorate: regGovernorate
      });

      if (response.success) {
        setAuthStatus('authenticated');
        setSuccessNotice('تم تأكيد رقم هاتفك وإنشاء حسابك بنجاح! مرحباً بك في مخلصة.');
        if (response.user) {
          setTimeout(() => {
            onLoginSuccess(response.user!);
            onClose();
          }, 900);
        } else {
          setTimeout(() => {
            setActiveTab('login');
            setLoginEmail(regEmail);
            setAuthStatus('unauthenticated');
            setIsRegisterOtpStep(false);
          }, 1500);
        }
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

  // Google OAuth Trigger
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
              بوابة العملاء المعتمدة
            </span>
          </div>

          {/* Tab Switcher */}
          <div className="mt-4 flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => { 
                setActiveTab('login'); 
                setErrorMessage(null); 
                setAuthStatus('unauthenticated');
                setIsRegisterOtpStep(false);
                setIsOtpLoginPending(false);
              }}
              className={`flex-1 py-1.5 rounded-lg text-3xs sm:text-xs font-bold transition flex items-center justify-center gap-1 ${
                activeTab === 'login'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>دخول بالبريد</span>
            </button>

            <button
              type="button"
              onClick={() => { 
                setActiveTab('otp_login'); 
                setErrorMessage(null); 
                setAuthStatus('unauthenticated');
                setIsRegisterOtpStep(false);
              }}
              className={`flex-1 py-1.5 rounded-lg text-3xs sm:text-xs font-bold transition flex items-center justify-center gap-1 ${
                activeTab === 'otp_login'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>دخول واتساب</span>
            </button>

            <button
              type="button"
              onClick={() => { 
                setActiveTab('register'); 
                setErrorMessage(null); 
                setAuthStatus('unauthenticated');
                setIsOtpLoginPending(false);
              }}
              className={`flex-1 py-1.5 rounded-lg text-3xs sm:text-xs font-bold transition flex items-center justify-center gap-1 ${
                activeTab === 'register'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>حساب جديد</span>
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

          {/* TAB 1: EMAIL LOGIN FORM */}
          {activeTab === 'login' && authStatus !== 'authenticated' && (
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-xs text-slate-700 block text-right">
                  البريد الإلكتروني:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-9"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-xs text-slate-700 block text-right">
                    كلمة المرور:
                  </label>
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

          {/* TAB 2: WHATSAPP OTP QUICK LOGIN */}
          {activeTab === 'otp_login' && authStatus !== 'authenticated' && (
            <div className="space-y-3">
              {!isOtpLoginPending ? (
                <form onSubmit={handleRequestOtpLogin} className="space-y-3">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl text-2xs text-emerald-950 flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      تسجيل دخول فوري بدون كلمة مرور! سنرسل لك كود تحقق مؤقت (OTP) مباشرة على الواتساب.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-xs text-slate-700 block text-right">
                      رقم الواتساب المسجل (مصر):
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        dir="ltr"
                        required
                        value={otpLoginPhone}
                        onChange={(e) => setOtpLoginPhone(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-9"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !otpLoginPhone.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري إرسال الكود...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        <span>إرسال كود الدخول عبر الواتساب</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtpLogin} className="space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-xs text-slate-800">
                      كود التحقق المكون من 4 أرقام:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsOtpLoginPending(false)}
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
                    value={otpLoginCode}
                    onChange={(e) => setOtpLoginCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full py-3 text-center text-2xl font-black font-mono tracking-widest rounded-2xl border-2 border-brand-green/40 focus:border-brand-green focus:ring-4 focus:ring-brand-green/20 focus:outline-none bg-emerald-50/20 text-slate-900"
                    autoFocus
                  />

                  <div className="flex items-center justify-between text-3xs text-slate-500 font-bold px-1">
                    <span>صالح لمدة 5 دقائق</span>
                    {otpLoginCountdown > 0 ? (
                      <span className="text-slate-400">إعادة إرسال بعد ({otpLoginCountdown}ث)</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestOtpLogin}
                        className="text-brand-green hover:underline inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>إعادة الإرسال</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || otpLoginCode.trim().length !== 4}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري التحقق والدخول...</span>
                      </>
                    ) : (
                      <span>تأكيد وتسجيل الدخول</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: REGISTER FORM */}
          {activeTab === 'register' && authStatus !== 'authenticated' && (
            <div className="space-y-3">
              {!isRegisterOtpStep ? (
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-xs text-slate-700 block text-right">
                        رقم الواتساب (مصر):
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          dir="ltr"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="010XXXXXXXX"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-9"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                      </div>
                    </div>

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

                  <div className="space-y-1">
                    <label className="font-bold text-xs text-slate-700 block text-right">
                      البريد الإلكتروني:
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-9"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

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

                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-3xs text-slate-500 leading-relaxed">
                    🔒 سنرسل لك كود تحقق (OTP) عبر الواتساب لتأكيد رقمك وتفعيل حسابك فوراً.
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
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
                        <span>متابعة وتأكيد بالواتساب</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleFinalizeRegistration} className="space-y-3 animate-fadeIn">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                    <span className="text-3xs text-emerald-800 font-bold block">
                      أرسلنا كود التحقق (OTP) إلى واتساب رقم:
                    </span>
                    <span className="text-sm font-black font-mono text-brand-navy dir-ltr block">
                      {regPhone}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-xs text-slate-700">
                        أدخل كود الـ OTP المكون من 4 أرقام:
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsRegisterOtpStep(false)}
                        className="text-3xs text-brand-green font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <ArrowRight className="w-3 h-3 rotate-180" />
                        <span>تعديل البيانات</span>
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
                        <span>جاري التحقق وإنشاء الحساب...</span>
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
