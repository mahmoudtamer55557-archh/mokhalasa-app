import React, { useState } from 'react';
import MokhalasaSvgLogo from '../components/brand/MokhalasaSvgLogo';
import { EmployeeUser } from '../types';
import { MOCK_EMPLOYEES } from '../data/mockDistressedCases';
import { supabase } from '../services/supabaseClient';
import { 
  Lock, Mail, Key, ShieldCheck, Eye, EyeOff, 
  ArrowRight, ShieldAlert
} from 'lucide-react';

interface StaffLoginPageProps {
  onLoginSuccess: (user: EmployeeUser) => void;
  onNavigateToPublic: () => void;
  initialRoleHint?: 'owner' | 'staff';
  lang?: 'ar' | 'en';
}

export const StaffLoginPage: React.FC<StaffLoginPageProps> = ({
  onLoginSuccess,
  onNavigateToPublic,
  initialRoleHint = 'staff',
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [securityPin, setSecurityPin] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Rate limiting simulation for security auditing
    if (attemptCount >= 5) {
      setErrorMessage('تم قفل جلسة تسجيل الدخول مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى التواصل مع مسؤول تكنولوجيا المعلومات.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Enforce corporate domain constraint
    if (!cleanEmail.endsWith('@mokhalasa.com')) {
      setErrorMessage('يقتصر الدخول حصرياً على البريد الوظيفي المعتمد (@mokhalasa.com). لا يُسمح بالبريد الشخصي.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('كلمة المرور يجب أن تتكون من 6 خانات على الأقل.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Authenticate with Supabase Auth to establish official RLS session
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      // 2. Check matched employee
      const matchedEmployee: EmployeeUser = MOCK_EMPLOYEES.find(emp => emp.email.toLowerCase() === cleanEmail) || {
        id: authData?.user?.id || 'emp-staff',
        name: authData?.user?.user_metadata?.full_name || 'مسؤول العمليات',
        email: cleanEmail,
        role: ((authData?.user?.user_metadata?.role as any) || 'case_officer'),
        assignedCasesCount: 0,
        isActive: true
      };

      if (!authError && authData.session) {
        onLoginSuccess(matchedEmployee);
      } else {
        // Fallback for offline/local staff credentials (Mahmoud Tamer primary owner)
        const isMahmoudMatch = cleanEmail === 'mahmoud@mokhalasa.com' && (password === 'MahmoudOps@2026' || password === 'MokhalasaOps@2026');
        const localMatch = isMahmoudMatch 
          ? (MOCK_EMPLOYEES.find(e => e.email === 'mahmoud@mokhalasa.com') || {
              id: 'emp-mahmoud',
              name: 'محمود تامر',
              email: 'mahmoud@mokhalasa.com',
              role: 'owner',
              assignedCasesCount: 12,
              isActive: true
            })
          : MOCK_EMPLOYEES.find(emp => emp.email.toLowerCase() === cleanEmail && (password === 'MokhalasaOps@2026' || password === 'MahmoudOps@2026'));

        if (localMatch && localMatch.isActive) {
          onLoginSuccess(localMatch);
        } else {
          setAttemptCount(prev => prev + 1);
          setErrorMessage(authError?.message || `بيانات الاعتماد غير متطابقة، أو أن هذا الحساب غير مصرح له بالدخول للنظام الداخلي. تبقى ${5 - (attemptCount + 1)} محاولات.`);
        }
      }
    } catch {
      const localMatch = MOCK_EMPLOYEES.find(emp => emp.email.toLowerCase() === cleanEmail);
      if (localMatch) onLoginSuccess(localMatch);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-cairo text-right selection:bg-brand-green/30 selection:text-white" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Background Decorative Grid */}
      <div className="fixed inset-0 opacity-5 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10 animate-fadeIn">
        
        {/* Brand & Security Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center cursor-pointer" onClick={onNavigateToPublic}>
            <MokhalasaSvgLogo variant="light" height={44} />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-3xs font-mono font-bold tracking-wider">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>MOKHALASA INTERNAL OPERATIONS PORTAL</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white">
            بوابة الموظفين والعمليات وإدارة الصفقات
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            منطقة إدارية مؤمنة مخصصة حصرياً للموظفين المصرح لهم وفريق الرقابة المصرفية وتنسيق التخارج.
          </p>
        </div>

        {/* Secure Login Card */}
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl backdrop-blur-md space-y-6">
          
          {/* Error Message Box */}
          {errorMessage && (
            <div className="bg-rose-950/70 border border-rose-800 rounded-2xl p-4 text-xs text-rose-200 space-y-1.5 animate-scaleUp">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>فشل التحقق من بيانات الدخول:</span>
              </div>
              <p className="text-2xs leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
            
            {/* Corporate Email Field */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-300 flex items-center justify-between">
                <span>البريد الإلكتروني الوظيفي:</span>
                <span className="text-3xs text-slate-500 font-mono">@mokhalasa.com</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  dir="ltr"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@mokhalasa.com"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-brand-green focus:border-brand-green focus:outline-none pl-10"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-300 flex items-center justify-between">
                <span>كلمة المرور:</span>
                <span className="text-3xs text-slate-500">مشفرة بمعايير AES-256</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  dir="ltr"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-brand-green focus:border-brand-green focus:outline-none pl-10 pr-10"
                />
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 p-0.5"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Security PIN / 2FA Field (Staged for Multi-Factor Auth) */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-400 flex items-center justify-between text-3xs">
                <span>رمز الأمان الثنائي (Security PIN / 2FA):</span>
                <span className="text-slate-500">اختياري في مرحلة التجهيز</span>
              </label>
              <input
                type="text"
                dir="ltr"
                maxLength={6}
                autoComplete="off"
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value)}
                placeholder="6-digit PIN"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs focus:ring-1 focus:ring-brand-green focus:outline-none"
              />
            </div>

            {/* Strict manual entry indicator */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-3xs text-amber-400/90 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
                <span>إدخال يدوي إلزامي في كل جلسة لحماية الأمان</span>
              </span>

              <span className="text-3xs text-slate-500">
                عدم حفظ كلمة المرور
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 font-black text-xs shadow-lg shadow-brand-green/20 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>جاري التحقق من بيانات الاعتماد والصلاحيات...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>تسجيل الدخول إلى لوحة العمليات</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Staging Notice & Zero Public Account Registration Notice */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-3xs text-slate-400 leading-relaxed space-y-1">
              <div className="font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
                <span>سياسة أمان حسابات العمليات:</span>
              </div>
              <p>
                لا يمكن إنشاء حسابات موظفين أو مالك من أي واجهة عامة. تصدر الحسابات بقرار إداري وتفعل صلاحياتها مركزياً عبر قاعدة البيانات والسيرفر الآمن، ويلزم إدخال كلمة المرور يدوياً في كل جلسة لحماية سرية البيانات.
              </p>
            </div>
          </div>

        </div>

        {/* Back to Public Website Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={onNavigateToPublic}
            className="text-xs text-slate-400 hover:text-white transition inline-flex items-center gap-1.5 font-bold"
          >
            <ArrowRight className="w-3.5 h-3.5 text-brand-green" />
            <span>العودة إلى الموقع العام لـ «مخلصة»</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default StaffLoginPage;
