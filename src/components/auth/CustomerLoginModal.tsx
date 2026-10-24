import React, { useState, useEffect } from 'react';
import MokhalasaSvgLogo from '../brand/MokhalasaSvgLogo';
import { CustomerUser, CustomerAuthStatus } from '../../types';
import { authService } from '../../services/authService';
import { 
  X, ShieldCheck, Mail, Eye, EyeOff, Lock, User, Phone, MapPin, 
  CheckCircle2, AlertCircle, ArrowRight
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

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGovernorate, setRegGovernorate] = useState('القاهرة');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setErrorMessage(null);
      setSuccessNotice(null);
      setAuthStatus('unauthenticated');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Handle Login Submission
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

  // Handle Registration Submission
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      setErrorMessage('يرجى إدخال الاسم بالكامل.');
      setAuthStatus('error');
      return;
    }

    const cleanPhone = regPhone.trim();
    if (!cleanPhone || !/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      setErrorMessage('يرجى إدخال رقم هاتف محمول مصري صحيح مكون من 11 رقماً (مثال: 01012345678).');
      setAuthStatus('error');
      return;
    }

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

    setAuthStatus('authenticating');
    setErrorMessage(null);
    setIsSubmitting(true);

    const response = await authService.registerWithEmail({
      fullName: regFullName.trim(),
      phone: cleanPhone,
      email: regEmail.trim(),
      password: regPassword,
      governorate: regGovernorate
    });

    if (response.success) {
      setAuthStatus('authenticated');
      setSuccessNotice(response.message || 'تم إنشاء حسابك بنجاح!');
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
        }, 1500);
      }
    } else {
      setAuthStatus('error');
      setErrorMessage(response.message || 'تعذر إتمام التسجيل. يرجى التأكد من البيانات.');
    }
    setIsSubmitting(false);
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
        {/* Compact Header */}
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

          {/* Tab Switcher */}
          <div className="mt-4 flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMessage(null); setAuthStatus('unauthenticated'); }}
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
              onClick={() => { setActiveTab('register'); setErrorMessage(null); setAuthStatus('unauthenticated'); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>إنشاء حساب جديد</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Status Alert for Loading */}
          {authStatus === 'authenticating' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center space-y-1.5 animate-pulse">
              <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="font-extrabold text-xs text-brand-navy">
                جاري التحقق وتأمين جلستك في مخلصة...
              </div>
            </div>
          )}

          {/* Status Alert for Success */}
          {authStatus === 'authenticated' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1 animate-fadeIn">
              <CheckCircle2 className="w-7 h-7 text-brand-green mx-auto" />
              <div className="font-black text-xs text-brand-navy">
                {successNotice || 'تمت العملية بنجاح!'}
              </div>
            </div>
          )}

          {/* Status Alert for Error */}
          {authStatus === 'error' && errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">تنبيه:</span>
                <p className="text-2xs leading-relaxed text-rose-800">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
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

          {/* TAB 2: REGISTER FORM */}
          {activeTab === 'register' && authStatus !== 'authenticated' && (
            <form onSubmit={handleEmailSignUp} className="space-y-2.5">
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
                    رقم المحمول (واتساب):
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none text-right pr-9"
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
                🔒 يتم حفظ بيانات هويتك الأساسية بأمان دون تعديل عشوائي لضمان الموثوقية القانونية لعقود التنازل والمخالصة.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري إنشاء الحساب...</span>
                  </>
                ) : (
                  <span>إنشاء الحساب وتفعيله</span>
                )}
              </button>
            </form>
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
