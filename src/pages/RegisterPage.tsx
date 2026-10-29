import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar,
  Cpu,
} from 'lucide-react';
import { registerUserWithEmail, signInWithOAuthProvider } from '../services/authService';
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

interface RegisterPageProps {
  onSuccess: (user: { email: string; fullName: string }) => void;
  onBackHome: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess, onBackHome }) => {
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
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

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

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setError(null);
    setOauthLoading(provider);
    try {
      await signInWithOAuthProvider(provider);
    } catch (err: any) {
      setError(getSafeUserErrorMessage(err, `تعذر التسجيل عبر ${provider === 'google' ? 'جوجل' : 'آبل'}`));
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = sanitizeInput(fullName, 120);
    const cleanPhone = sanitizeInput(phone, 20).replace(/\D/g, '');
    const cleanEmail = sanitizeInput(email, 140);
    const cleanStreet = sanitizeInput(detailedAddress, 240);

    if (!cleanName || cleanName.length < 3) {
      setError('يرجى إدخال الاسم الثلاثي بالكامل.');
      return;
    }

    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError('يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقم (يبدأ بـ 010 أو 011 أو 012 أو 015)');
      return;
    }

    const ageCheck = validateAdultAge18Plus(birthDate);
    if (!ageCheck.isAdult) {
      setError(ageCheck.error || 'يشترط ألا يقل عمر المستخدم عن 18 عاماً كاملة للتسجيل.');
      return;
    }

    if (!confirmAdult18) {
      setError('يرجى الإقرار بأن عمرك 18 عاماً فأكثر وتتمتع بالأهلية القانونية الكاملة.');
      return;
    }

    if (!governorate || !district || !subArea || cleanStreet.length < 5) {
      setError('يرجى تحديد العنوان بالتفصيل (المحافظة ← الحي/المدينة ← المنطقة الفرعية ← الشارع والعقار).');
      return;
    }

    const pwdStrength = validateStrongPassword(password, cleanPhone);
    if (!pwdStrength.isValid) {
      setError(pwdStrength.errors[0] || 'كلمة المرور ضعيفة، يرجى الالتزام بمعايير كلمة المرور القوية.');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    if (!captchaVerified) {
      setError('يرجى إتمام التحقق الأمني (CAPTCHA) قبل إنشاء الحساب.');
      return;
    }

    setLoading(true);
    try {
      await registerUserWithEmail({
        email: cleanEmail,
        password,
        fullName: cleanName,
        phone: cleanPhone,
        governorate,
        district,
        subArea,
        detailedAddress: cleanStreet,
        birthDate,
        deviceMacId: validateOrNormalizeMacAddress(deviceMacId),
      });
      setRegisteredSuccess(true);
      setTimeout(() => {
        onSuccess({ email: cleanEmail, fullName: cleanName });
      }, 1500);
    } catch (err: any) {
      setCaptchaResetKey((k) => k + 1);
      setError(getSafeUserErrorMessage(err, 'حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة مرة أخرى.'));
    } finally {
      setLoading(false);
    }
  };

  const pwdStrength = validateStrongPassword(password, phone);
  const availableDistricts = getDistrictsForGovernorate(governorate);
  const availableSubAreas = getSubAreasForDistrict(governorate, district);

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 flex items-center justify-center" dir="rtl">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-l from-emerald-900 via-slate-900 to-slate-950 p-7 text-white relative">
          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white mb-4 bg-white/10 px-3 py-1.5 rounded-xl"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة للرئيسية</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <h1 className="text-2xl font-black">إنشاء حساب موثق وآمن في مُخلصة</h1>
              <p className="text-xs text-emerald-300 font-medium mt-0.5">
                حماية مشفرة PBKDF2 • تحقق السن القانوني (+18) • ربط العنوان وبصمة الجهاز
              </p>
            </div>
          </div>
        </div>

        <div className="p-7">
          {registeredSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-black text-slate-900">تم إنشاء وتأمين حسابك بنجاح!</h2>
              <p className="text-sm text-slate-600">
                تم حفظ بياناتك المشفرة وربط بصمة الجهاز بقاعدة البيانات...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-2.5 text-red-700 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={oauthLoading !== null}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 font-black text-xs text-slate-800 transition-all shadow-sm"
                >
                  <span>التسجيل بحساب Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('apple')}
                  disabled={oauthLoading !== null}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 font-black text-xs text-white transition-all shadow-sm"
                >
                  <span>التسجيل بحساب Apple</span>
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400">
                  أو التسجيل الكامل بالبيانات الموثقة
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  الاسم الثلاثي بالكامل *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="أحمد محمد علي"
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    البريد الإلكتروني *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    رقم الموبايل المصري *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                      className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  تاريخ الميلاد (يشترط ألا يقل السن عن 18 عاماً) *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-amber-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    required
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                      .toISOString()
                      .split('T')[0]}
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none text-sm font-bold"
                  />
                </div>
              </div>

              {/* Hierarchical 4-Level Address */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>العنوان التفصيلي المتدرج (المحافظة ← الحي/القسم ← المنطقة الفرعية) *</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 mb-1">1. المحافظة</label>
                    <select
                      value={governorate}
                      onChange={(e) => handleGovernorateChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    >
                      {GOVERNORATES_LIST.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-600 mb-1">2. الحي / القسم</label>
                    <select
                      value={district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    >
                      {availableDistricts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-600 mb-1">3. المنطقة الفرعية</label>
                    <select
                      value={subArea}
                      onChange={(e) => setSubArea(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    >
                      {availableSubAreas.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 mb-1">
                    4. الشارع / رقم العقار / علامة مميزة *
                  </label>
                  <input
                    type="text"
                    required
                    value={detailedAddress}
                    onChange={(e) => setDetailedAddress(e.target.value)}
                    placeholder={`مثال: ${governorate} - ${district} - ${subArea} - شارع...`}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>
              </div>

              {/* Device MAC Security Fingerprint */}
              <div className="bg-slate-900 text-white rounded-2xl p-3 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-amber-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    بصمة الجهاز (Device MAC Security ID)
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    كلمة المرور القوية *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    تأكيد كلمة المرور *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {password.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold">
                  <div className="flex justify-between mb-1">
                    <span>قوة كلمة المرور:</span>
                    <span className={pwdStrength.colorClass.split(' ')[1]}>{pwdStrength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${pwdStrength.colorClass.split(' ')[0]}`}
                      style={{ width: `${pwdStrength.score}%` }}
                    />
                  </div>
                </div>
              )}

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmAdult18}
                  onChange={(e) => setConfirmAdult18(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-emerald-600 rounded"
                />
                <span className="text-xs text-slate-700 font-black leading-relaxed">
                  أقر بأن عمري 18 عاماً فأكثر وأتمتع بالأهلية القانونية الكاملة للتعامل المالي والقانوني على المنصة. *
                </span>
              </label>

              <SecurityCaptcha
                onVerifyChange={setCaptchaVerified}
                resetTrigger={captchaResetKey}
                compact
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-black text-base shadow-lg shadow-emerald-600/25 transition-all"
              >
                {loading ? 'جاري التسجيل والتشفير...' : 'إنشاء الحساب الموثق الآن'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
