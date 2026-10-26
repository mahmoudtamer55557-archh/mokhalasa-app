import React, { useState } from 'react';
import MokhalasaSvgLogo from '../components/brand/MokhalasaSvgLogo';
import { authService } from '../services/authService';
import { getPhoneValidationError, normalizeEgyptianPhone } from '../utils/phoneValidator';
import { 
  Eye, EyeOff, Mail, Phone, ShieldCheck, 
  AlertCircle, CheckCircle2, Info
} from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (view: string) => void;
  onOpenLogin: () => void;
  lang?: 'ar' | 'en';
}

interface ValidationErrors {
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigate,
  onOpenLogin,
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';

  // Form Field States
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI Interactive States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'info' | 'error' | 'success';
    title: string;
    description: string;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // Validation Logic
  // ---------------------------------------------------------------------------
  const validateField = (field: keyof ValidationErrors, val?: string): string | undefined => {
    switch (field) {
      case 'email': {
        const v = (val !== undefined ? val : email).trim();
        if (!v) return undefined; // Email is optional in Mokhalasa; phone number is primary!
        // RFC-compliant email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(v)) {
          return 'يرجى إدخال بريد إلكتروني صحيح (مثال: name@example.com)';
        }
        return undefined;
      }

      case 'phone': {
        const v = val !== undefined ? val : phone;
        const err = getPhoneValidationError(v);
        return err || undefined;
      }

      case 'password': {
        const v = val !== undefined ? val : password;
        if (!v) return 'كلمة المرور مطلوبة';
        if (v.length < 8) {
          return 'يجب ألا تقل كلمة المرور عن 8 أحرف وأرقام';
        }
        return undefined;
      }

      case 'confirmPassword': {
        const v = val !== undefined ? val : confirmPassword;
        const mainPass = password;
        if (!v) return 'يرجى تأكيد كلمة المرور';
        if (v !== mainPass) {
          return 'كلمتا المرور غير متطابقتين';
        }
        return undefined;
      }

      default:
        return undefined;
    }
  };

  const validateAll = (): boolean => {
    const newErrors: ValidationErrors = {
      email: validateField('email'),
      phone: validateField('phone'),
      password: validateField('password'),
      confirmPassword: validateField('confirmPassword')
    };

    setErrors(newErrors);
    setTouched({
      email: true,
      phone: true,
      password: true,
      confirmPassword: true
    });

    return !Object.values(newErrors).some(Boolean);
  };

  const handleBlur = (field: keyof ValidationErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = validateField(field);
    setErrors(prev => ({ ...prev, [field]: err }));
  };

  // ---------------------------------------------------------------------------
  // Submit Handler — Form Email/Password via Supabase Auth
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isGoogleSubmitting) return;

    setStatusMessage(null);

    const isValid = validateAll();
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const cleanPhone = normalizeEgyptianPhone(phone);
      const effectiveEmail = email.trim() || `${cleanPhone}@customer.mokhalasa.com`;
      // Call Supabase Auth service
      const response = await authService.registerWithEmail({
        email: effectiveEmail,
        phone: cleanPhone,
        password
      });

      if (response.success) {
        setStatusMessage({
          type: 'success',
          title: response.requiresEmailConfirmation ? 'تم إنشاء الحساب بنجاح (تأكيد البريد مطلوب)' : 'تم إنشاء الحساب بنجاح',
          description: response.message
        });
        // Clear sensitive password inputs
        setPassword('');
        setConfirmPassword('');
      } else {
        setStatusMessage({
          type: 'error',
          title: 'تعذر إنشاء الحساب',
          description: response.message
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        title: 'تعذر معالجة الطلب',
        description: 'حدث خطأ غير متوقع أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Google Registration Handler via Supabase Auth
  // ---------------------------------------------------------------------------
  const handleGoogleRegister = async () => {
    if (isSubmitting || isGoogleSubmitting) return;

    setIsGoogleSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await authService.registerWithGoogle();
      if (response.success) {
        setStatusMessage({
          type: 'info',
          title: 'المصادقة عبر Google',
          description: response.message
        });
      } else {
        setStatusMessage({
          type: 'info',
          title: 'إعدادات Google OAuth في Supabase',
          description: response.message
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        title: 'خطأ في المصادقة',
        description: 'تعذر الاتصال بمزود Google مؤقتاً.'
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full mx-auto space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center cursor-pointer" onClick={() => onNavigate('home')}>
            <MokhalasaSvgLogo variant="dark" height={44} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
            إنشاء حساب جديد
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            انضم إلى منصة «مخلصة» لحفظ سياراتك المفضلة وتتبع إجراءات تسوية التمويل بأمان وموثوقية.
          </p>
        </div>

        {/* Main Registration Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-5 animate-fadeIn">

          {/* Staging & Feedback Alert */}
          {statusMessage && (
            <div className={`p-4 rounded-2xl border text-xs space-y-1.5 animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : statusMessage.type === 'info'
                ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2 font-bold text-xs">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-brand-green flex-shrink-0" />
                ) : statusMessage.type === 'info' ? (
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{statusMessage.title}</span>
              </div>
              <p className="text-2xs leading-relaxed text-slate-700">
                {statusMessage.description}
              </p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* 1. البريد الإلكتروني — Email Input (اختياري) */}
            <div className="space-y-1 text-right">
              <label 
                htmlFor="register-email" 
                className="block text-xs font-bold text-slate-700"
              >
                البريد الإلكتروني <span className="text-slate-400 font-normal">(اختياري — رقم الهاتف أساسي)</span>
              </label>
              <div className="relative">
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  disabled={isSubmitting || isGoogleSubmitting}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) {
                      setErrors(prev => ({ ...prev, email: validateField('email', e.target.value) }));
                    }
                  }}
                  onBlur={() => handleBlur('email')}
                  placeholder="name@example.com"
                  className={`w-full pr-3.5 pl-10 py-2.5 rounded-xl border text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 transition text-left ${
                    touched.email && errors.email
                      ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-400'
                      : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-brand-green focus:border-brand-green'
                  }`}
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {touched.email && errors.email && (
                <p className="text-2xs text-rose-600 font-bold flex items-center gap-1 mt-1 animate-fadeIn">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* 2. رقم التليفون — Egyptian / International Phone Input */}
            <div className="space-y-1 text-right">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="register-phone" 
                  className="block text-xs font-bold text-slate-700"
                >
                  رقم التليفون <span className="text-rose-500">*</span>
                </label>
                <span className="text-3xs text-slate-400 font-mono" dir="ltr">+20 / 010...</span>
              </div>
              <div className="relative">
                <input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  dir="ltr"
                  autoComplete="tel"
                  disabled={isSubmitting || isGoogleSubmitting}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (touched.phone) {
                      setErrors(prev => ({ ...prev, phone: validateField('phone', e.target.value) }));
                    }
                  }}
                  onBlur={() => handleBlur('phone')}
                  placeholder="010XXXXXXXX أو +2010XXXXXXXX"
                  className={`w-full pr-3.5 pl-10 py-2.5 rounded-xl border text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 transition text-left ${
                    touched.phone && errors.phone
                      ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-400'
                      : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-brand-green focus:border-brand-green'
                  }`}
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {touched.phone && errors.phone && (
                <p className="text-2xs text-rose-600 font-bold flex items-center gap-1 mt-1 animate-fadeIn">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>

            {/* 3. كلمة المرور — Password Input with Show/Hide Toggle */}
            <div className="space-y-1 text-right">
              <label 
                htmlFor="register-password" 
                className="block text-xs font-bold text-slate-700"
              >
                كلمة المرور <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  autoComplete="new-password"
                  disabled={isSubmitting || isGoogleSubmitting}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) {
                      setErrors(prev => ({ ...prev, password: validateField('password', e.target.value) }));
                    }
                    if (touched.confirmPassword && confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: e.target.value !== confirmPassword ? 'كلمتا المرور غير متطابقتين' : undefined }));
                    }
                  }}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••"
                  className={`w-full pr-3.5 pl-10 py-2.5 rounded-xl border text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 transition text-left ${
                    touched.password && errors.password
                      ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-400'
                      : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-brand-green focus:border-brand-green'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 focus:outline-none"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && errors.password ? (
                <p className="text-2xs text-rose-600 font-bold flex items-center gap-1 mt-1 animate-fadeIn">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.password}</span>
                </p>
              ) : (
                <p className="text-3xs text-slate-400">8 أحرف وأرقام على الأقل</p>
              )}
            </div>

            {/* 4. تأكيد كلمة المرور — Confirm Password Input with Show/Hide Toggle */}
            <div className="space-y-1 text-right">
              <label 
                htmlFor="register-confirm-password" 
                className="block text-xs font-bold text-slate-700"
              >
                تأكيد كلمة المرور <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  dir="ltr"
                  autoComplete="new-password"
                  disabled={isSubmitting || isGoogleSubmitting}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (touched.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: validateField('confirmPassword', e.target.value) }));
                    }
                  }}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="••••••••"
                  className={`w-full pr-3.5 pl-10 py-2.5 rounded-xl border text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 transition text-left ${
                    touched.confirmPassword && errors.confirmPassword
                      ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-400'
                      : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-brand-green focus:border-brand-green'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 focus:outline-none"
                  aria-label={showConfirmPassword ? 'إخفاء تأكيد كلمة المرور' : 'إظهار تأكيد كلمة المرور'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-2xs text-rose-600 font-bold flex items-center gap-1 mt-1 animate-fadeIn">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
            </div>

            {/* Primary Submit Button: إنشاء حساب */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isGoogleSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-black text-sm shadow-md shadow-brand-green/20 transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري التحقق من البيانات...</span>
                  </>
                ) : (
                  <span>إنشاء حساب</span>
                )}
              </button>
            </div>
          </form>

          {/* Separator: أو */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs font-bold text-slate-400 absolute">
              أو
            </span>
          </div>

          {/* Secondary Button: التسجيل باستخدام Google */}
          <div>
            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={isSubmitting || isGoogleSubmitting}
              className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-sm hover:shadow transition flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGoogleSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                  <span>جاري الاتصال بـ Google...</span>
                </>
              ) : (
                <>
                  {/* Official Google Multi-color 'G' SVG */}
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>التسجيل باستخدام Google</span>
                </>
              )}
            </button>
          </div>

          {/* Bottom Prompt: عندك حساب بالفعل؟ تسجيل الدخول */}
          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            <span>عندك حساب بالفعل؟</span>{' '}
            <button
              type="button"
              onClick={onOpenLogin}
              className="text-brand-green hover:text-emerald-700 font-extrabold hover:underline transition"
            >
              تسجيل الدخول
            </button>
          </div>

        </div>

        {/* Security & Privacy Badges */}
        <div className="flex items-center justify-center gap-4 text-3xs text-slate-400 text-center">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
            <span>اتصال مشفر وآمن (256-bit SSL)</span>
          </div>
          <span>•</span>
          <div>حماية البيانات طبقاً لقانون 151 لسنة 2020</div>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
