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
  AlertCircle, CheckCircle2, Info, User, MapPin, Calendar
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
  const [birthDate, setBirthDate] = useState('1992-05-15');
  const [confirmAdult18, setConfirmAdult18] = useState(true);
  const [governorate, setGovernorate] = useState('الجيزة');
  const [district, setDistrict] = useState('الهرم');
  const [subArea, setSubArea] = useState('مشعل');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [deviceMacId] = useState(() => getDeviceSecurityFingerprint());
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
            إنشاء حساب جديد بسهولة وأمان
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            أدخل بياناتك الأساسية وعنوانك بخطوات بسيطة ومريحة للعين لبدء البيع أو الشراء بأعلى أمان
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
              <p className="text-xs leading-relaxed text-slate-700">
                {statusMessage.description}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-extrabold text-slate-700">
                الاسم الثلاثي بالكامل <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: محمود تامر صلاح"
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {touched.fullName && errors.fullName && (
                <p className="text-xs text-rose-600 font-bold">{errors.fullName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Phone */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-extrabold text-slate-700">
                  رقم الموبايل (واتساب) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full pr-4 pl-10 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-green text-left"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {touched.phone && errors.phone && (
                  <p className="text-xs text-rose-600 font-bold">{errors.phone}</p>
                )}
              </div>

              {/* Optional Email */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-extrabold text-slate-700">
                  البريد الإلكتروني <span className="text-slate-400 font-normal">(اختياري)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pr-4 pl-10 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-medium text-left"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Easy 3-Dropdown Birth Date (18+) */}
            <div className="space-y-1.5 text-right bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brand-green" />
                  <span>تاريخ الميلاد (يشترط 18 سنة فأكثر) *</span>
                </label>
                {birthDate && validateAdultAge18Plus(birthDate).isAdult && (
                  <span className="text-2xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-extrabold">
                    ✓ العمر: {validateAdultAge18Plus(birthDate).ageYears} سنة
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <select
                  value={(birthDate || '1992-05-15').split('-')[2] || '15'}
                  onChange={(e) => {
                    const parts = (birthDate || '1992-05-15').split('-');
                    setBirthDate(`${parts[0] || '1992'}-${parts[1] || '05'}-${e.target.value}`);
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                    <option key={d} value={d}>يوم {Number(d)}</option>
                  ))}
                </select>
                <select
                  value={(birthDate || '1992-05-15').split('-')[1] || '05'}
                  onChange={(e) => {
                    const parts = (birthDate || '1992-05-15').split('-');
                    setBirthDate(`${parts[0] || '1992'}-${e.target.value}-${parts[2] || '15'}`);
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  {[
                    ['01', 'يناير (1)'], ['02', 'فبراير (2)'], ['03', 'مارس (3)'], ['04', 'أبريل (4)'],
                    ['05', 'مايو (5)'], ['06', 'يونيو (6)'], ['07', 'يوليو (7)'], ['08', 'أغسطس (8)'],
                    ['09', 'سبتمبر (9)'], ['10', 'أكتوبر (10)'], ['11', 'نوفمبر (11)'], ['12', 'ديسمبر (12)'],
                  ].map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <select
                  value={(birthDate || '1992-05-15').split('-')[0] || '1992'}
                  onChange={(e) => {
                    const parts = (birthDate || '1992-05-15').split('-');
                    setBirthDate(`${e.target.value}-${parts[1] || '05'}-${parts[2] || '15'}`);
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  {Array.from({ length: 75 }, (_, i) => String(new Date().getFullYear() - 18 - i)).map((y) => (
                    <option key={y} value={y}>سنة {y}</option>
                  ))}
                </select>
              </div>
              {touched.birthDate && errors.birthDate && (
                <p className="text-xs text-rose-600 font-bold">{errors.birthDate}</p>
              )}
            </div>

            {/* 4-Level Hierarchical Egyptian Address */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3 text-right">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-green" />
                  العنوان بالتفصيل (المحافظة ← المنطقة ← الشارع) *
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-2xs font-bold text-slate-600 mb-1">المحافظة</label>
                  <select
                    value={governorate}
                    onChange={(e) => handleGovernorateChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    {GOVERNORATES_LIST.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-600 mb-1">الحي / المركز</label>
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-600 mb-1">المنطقة الفرعية</label>
                  <select
                    value={subArea}
                    onChange={(e) => setSubArea(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    {availableSubAreas.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 mb-1">
                  اسم الشارع / رقم العقار أو أقرب علامة مميزة *
                </label>
                <input
                  type="text"
                  value={detailedAddress}
                  onChange={(e) => setDetailedAddress(e.target.value)}
                  placeholder={`مثال: شارع الهرم الرئيسي - بجوار ${subArea}`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                {touched.address && errors.address && (
                  <p className="text-xs text-rose-600 font-bold mt-1">{errors.address}</p>
                )}
              </div>
            </div>

            {/* Password Section with 1-Click Auto-Generator */}
            <div className="space-y-2 text-right">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700">
                  كلمة المرور وتأكيدها <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const rand = Math.floor(100 + Math.random() * 899);
                    const generated = `Mokh@${rand}Eg!`;
                    setPassword(generated);
                    setConfirmPassword(generated);
                    setShowPassword(true);
                  }}
                  className="text-2xs font-extrabold text-brand-green hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition"
                >
                  ✨ اقتراح كلمة مرور قوية تلقائياً
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="كلمة المرور (مثال: Mokh@2026)"
                    className="w-full pr-3.5 pl-10 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تأكيد كلمة المرور"
                    className="w-full pr-3.5 pl-10 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-brand-green"
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
                <div className="flex items-center justify-between text-2xs font-bold">
                  <span className="text-slate-600">مستوى حماية كلمة المرور:</span>
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
              <p className="text-xs text-rose-600 font-bold">{errors.password}</p>
            )}
            {(touched.confirmPassword && errors.confirmPassword) && (
              <p className="text-xs text-rose-600 font-bold">{errors.confirmPassword}</p>
            )}

            <label className="flex items-center gap-2.5 cursor-pointer select-none text-right bg-slate-50/60 p-3 rounded-xl border border-slate-200/70">
              <input
                type="checkbox"
                checked={confirmAdult18}
                onChange={(e) => setConfirmAdult18(e.target.checked)}
                className="w-4 h-4 accent-brand-green rounded flex-shrink-0"
              />
              <span className="text-xs text-slate-700 font-bold leading-relaxed">
                أقر بأن عمري 18 عاماً فأكثر وأوافق على الشروط والأحكام وبنود الخصوصية.
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
              className="w-full py-3.5 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري حفظ البيانات وإنشاء الحساب...' : 'إنشاء الحساب الآن'}</span>
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
