import React, { useState } from 'react';
import MokhalasaSvgLogo from '../components/brand/MokhalasaSvgLogo';
import { authService } from '../services/authService';
import { getPhoneValidationError, normalizeEgyptianPhone } from '../utils/phoneValidator';
import {
  sanitizeInput,
  validateStrongPassword,
  validateAdultAge18Plus,
  getDeviceSecurityFingerprint,
  validateOrNormalizeMacAddress,
  getSafeUserErrorMessage,
} from '../utils/securityGuard';
import {
  GOVERNORATES_LIST,
  getDistrictsForGovernorate,
  getSubAreasForDistrict,
} from '../data/egyptLocationsHierarchy';
import { SecurityCaptcha } from '../components/security/SecurityCaptcha';
import { 
  Eye, EyeOff, Mail, Phone, ShieldCheck, 
  AlertCircle, CheckCircle2, Info, User, MapPin, Calendar, Cpu
} from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (view: string) => void;
  onOpenLogin: () => void;
  lang?: 'ar' | 'en';
}

interface ValidationErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
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
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [confirmAdult18, setConfirmAdult18] = useState(false);
  const [governorate, setGovernorate] = useState('الجيزة');
  const [district, setDistrict] = useState('الهرم');
  const [subArea, setSubArea] = useState('مشعل');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [deviceMacId, setDeviceMacId] = useState(() => getDeviceSecurityFingerprint());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

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

  const handleGovernorateChange = (newGov: string) => {
    setGovernorate(newGov);
    const districts = getDistrictsForGovernorate(newGov);
    const firstDist = districts[0] || '';
    setDistrict(firstDist);
    const subs = getSubAreasForDistrict(newGov, firstDist);
    setSubArea(subs[0] || '');
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const subs = getSubAreasForDistrict(governorate, newDist);
    setSubArea(subs[0] || '');
  };

  const validateField = (field: keyof ValidationErrors, val?: string): string | undefined => {
    switch (field) {
      case 'fullName': {
        const v = sanitizeInput(val !== undefined ? val : fullName, 120);
        if (!v || v.length < 3) return 'يرجى إدخال الاسم الثلاثي بالكامل كما في بطاقة الرقم القومي.';
        return undefined;
      }
      case 'email': {
        const v = (val !== undefined ? val : email).trim();
        if (!v) return undefined;
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
      case 'birthDate': {
        const v = val !== undefined ? val : birthDate;
        const ageCheck = validateAdultAge18Plus(v);
        if (!ageCheck.isAdult) return ageCheck.error;
        return undefined;
      }
      case 'address': {
        const v = sanitizeInput(val !== undefined ? val : detailedAddress, 240);
        if (!governorate || !district || !subArea || v.length < 4) {
          return 'يرجى اختيار المحافظة والحي والمنطقة الفرعية وكتابة اسم الشارع والعقار بالتفصيل.';
        }
        return undefined;
      }
      case 'password': {
        const v = val !== undefined ? val : password;
        const pwdCheck = validateStrongPassword(v, phone);
        if (!pwdCheck.isValid) {
          return pwdCheck.errors[0];
        }
        return undefined;
      }
      case 'confirmPassword': {
        const v = val !== undefined ? val : confirmPassword;
        if (!v) return 'يرجى تأكيد كلمة المرور';
        if (v !== password) return 'كلمتا المرور غير متطابقتين';
        return undefined;
      }
      default:
        return undefined;
    }
  };

  const validateAll = (): boolean => {
    const newErrors: ValidationErrors = {
      fullName: validateField('fullName'),
      email: validateField('email'),
      phone: validateField('phone'),
      birthDate: validateField('birthDate'),
      address: validateField('address'),
      password: validateField('password'),
      confirmPassword: validateField('confirmPassword'),
    };

    setErrors(newErrors);
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      birthDate: true,
      address: true,
      password: true,
      confirmPassword: true,
    });

    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isGoogleSubmitting) return;

    setStatusMessage(null);

    const isValid = validateAll();
    if (!isValid) return;

    if (!confirmAdult18) {
      setStatusMessage({
        type: 'error',
        title: 'شرط السن القانوني (+18)',
        description: 'يرجى الإقرار بأن عمرك 18 عاماً فأكثر وتتمتع بالأهلية القانونية الكاملة للتسجيل.'
      });
      return;
    }

    if (!captchaVerified) {
      setStatusMessage({
        type: 'error',
        title: 'التحقق الأمني مطلوب',
        description: 'يرجى كتابة رمز التحقق البشري (CAPTCHA) أولاً لحماية المنصة.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanPhone = normalizeEgyptianPhone(phone);
      const effectiveEmail = sanitizeInput(email, 140) || `${cleanPhone}@customer.mokhalasa.com`;
      const response = await authService.registerWithEmail({
        fullName: sanitizeInput(fullName, 120),
        email: effectiveEmail,
        phone: cleanPhone,
        governorate,
        district,
        subArea,
        detailedAddress: sanitizeInput(detailedAddress, 240),
        birthDate,
        deviceMacId: validateOrNormalizeMacAddress(deviceMacId),
        password
      });

      if (response.success) {
        setStatusMessage({
          type: 'success',
          title: 'تم إنشاء وتأمين الحساب بنجاح',
          description: response.message
        });
        setPassword('');
        setConfirmPassword('');
      } else {
        setCaptchaResetKey((k) => k + 1);
        setStatusMessage({
          type: 'error',
          title: 'تعذر إنشاء الحساب',
          description: response.message
        });
      }
    } catch (err) {
      setCaptchaResetKey((k) => k + 1);
      setStatusMessage({
        type: 'error',
        title: 'تعذر معالجة الطلب',
        description: getSafeUserErrorMessage(err, 'حدث خطأ غير متوقع أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (isSubmitting || isGoogleSubmitting) return;
    setIsGoogleSubmitting(true);
    setStatusMessage(null);
    try {
      const response = await authService.registerWithGoogle();
      setStatusMessage({
        type: 'info',
        title: 'المصادقة عبر Google',
        description: response.message
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        title: 'خطأ في المصادقة',
        description: getSafeUserErrorMessage(err, 'تعذر الاتصال بمزود Google مؤقتاً.')
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const pwdStrength = validateStrongPassword(password, phone);
  const availableDistricts = getDistrictsForGovernorate(governorate);
  const availableSubAreas = getSubAreasForDistrict(governorate, district);

  return (
    <div className="min-h-screen bg-brand-bg py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-lg w-full mx-auto space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center cursor-pointer" onClick={() => onNavigate('home')}>
            <MokhalasaSvgLogo variant="dark" height={44} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
            إنشاء حساب موثق وآمن
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            تشفير PBKDF2 • تحقق السن القانوني (+18) • توثيق العنوان التفصيلي وبصمة الجهاز (MAC ID)
          </p>
        </div>

        {/* Main Registration Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-5 animate-fadeIn">

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

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1 text-right">
              <label className="block text-xs font-bold text-slate-700">
                الاسم الثلاثي بالكامل (كما في بطاقة الرقم القومي) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: محمود تامر صلاح"
                  className="w-full pr-9 pl-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {touched.fullName && errors.fullName && (
                <p className="text-2xs text-rose-600 font-bold">{errors.fullName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone */}
              <div className="space-y-1 text-right">
                <label className="block text-xs font-bold text-slate-700">
                  رقم التليفون (واتساب) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full pr-3.5 pl-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-green text-left"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {touched.phone && errors.phone && (
                  <p className="text-2xs text-rose-600 font-bold">{errors.phone}</p>
                )}
              </div>

              {/* Birth Date (18+) */}
              <div className="space-y-1 text-right">
                <label className="block text-xs font-bold text-slate-700">
                  تاريخ الميلاد (18 سنة فأكثر) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                      .toISOString()
                      .split('T')[0]}
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                  <Calendar className="w-4 h-4 text-amber-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {touched.birthDate && errors.birthDate && (
                  <p className="text-2xs text-rose-600 font-bold">{errors.birthDate}</p>
                )}
              </div>
            </div>

            {/* 4-Level Hierarchical Egyptian Address */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-right">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-green" />
                  العنوان التفصيلي المتدرج (المحافظة ← الحي/القسم ← المنطقة الفرعية) *
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-3xs font-black text-slate-600 mb-1">1. المحافظة *</label>
                  <select
                    value={governorate}
                    onChange={(e) => handleGovernorateChange(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  >
                    {GOVERNORATES_LIST.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-3xs font-black text-slate-600 mb-1">2. الحي / القسم *</label>
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  >
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-3xs font-black text-slate-600 mb-1">3. المنطقة الفرعية *</label>
                  <select
                    value={subArea}
                    onChange={(e) => setSubArea(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                  >
                    {availableSubAreas.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-3xs font-black text-slate-600 mb-1">
                  4. الشارع / رقم العقار / علامة مميزة *
                </label>
                <input
                  type="text"
                  value={detailedAddress}
                  onChange={(e) => setDetailedAddress(e.target.value)}
                  placeholder={`مثال: ${governorate} - ${district} - ${subArea} - شارع...`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                />
                {touched.address && errors.address && (
                  <p className="text-2xs text-rose-600 font-bold mt-1">{errors.address}</p>
                )}
              </div>
            </div>

            {/* Device Security MAC Fingerprint */}
            <div className="p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-1.5 text-right">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-black text-amber-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  بصمة الأمان ومعرف الجهاز (Device MAC ID)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  ربط تلقائي للحماية
                </span>
              </div>
              <input
                type="text"
                dir="ltr"
                value={deviceMacId}
                onChange={(e) => setDeviceMacId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-mono text-xs font-bold text-center"
              />
            </div>

            {/* Optional Email */}
            <div className="space-y-1 text-right">
              <label className="block text-xs font-bold text-slate-700">
                البريد الإلكتروني <span className="text-slate-400 font-normal">(اختياري)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pr-3.5 pl-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-medium text-left"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 text-right">
                <label className="block text-xs font-bold text-slate-700">
                  كلمة المرور القوية <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-3.5 pl-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-mono text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-right">
                <label className="block text-xs font-bold text-slate-700">
                  تأكيد كلمة المرور <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-3.5 pl-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-mono text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {password.length > 0 && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-right">
                <div className="flex items-center justify-between text-2xs font-black">
                  <span className="text-slate-600">قوة كلمة المرور (PBKDF2):</span>
                  <span className={pwdStrength.colorClass.split(' ')[1]}>
                    {pwdStrength.label} ({pwdStrength.score}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${pwdStrength.colorClass.split(' ')[0]}`}
                    style={{ width: `${pwdStrength.score}%` }}
                  />
                </div>
              </div>
            )}

            {(touched.password && errors.password) && (
              <p className="text-2xs text-rose-600 font-bold">{errors.password}</p>
            )}
            {(touched.confirmPassword && errors.confirmPassword) && (
              <p className="text-2xs text-rose-600 font-bold">{errors.confirmPassword}</p>
            )}

            <label className="flex items-start gap-2 cursor-pointer select-none text-right">
              <input
                type="checkbox"
                checked={confirmAdult18}
                onChange={(e) => setConfirmAdult18(e.target.checked)}
                className="mt-1 w-4 h-4 accent-brand-green rounded"
              />
              <span className="text-2xs text-slate-700 font-black leading-relaxed">
                أقر بأن عمري 18 عاماً فأكثر وأتمتع بالأهلية القانونية الكاملة لإبرام العقود والمعاملات المالية في جمهورية مصر العربية. *
              </span>
            </label>

            <SecurityCaptcha
              onVerifyChange={setCaptchaVerified}
              resetTrigger={captchaResetKey}
              compact
            />

            <button
              type="submit"
              disabled={isSubmitting || isGoogleSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري التشفير وإنشاء الحساب...' : 'إنشاء حساب موثق وآمن'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-2xs font-bold text-slate-400 absolute">أو</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition flex items-center justify-center gap-2.5"
          >
            <span>التسجيل باستخدام Google</span>
          </button>

          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              لديك حساب بالفعل؟{' '}
              <button
                type="button"
                onClick={onOpenLogin}
                className="font-extrabold text-brand-green hover:underline"
              >
                تسجيل الدخول
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
