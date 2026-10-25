import React, { useState } from 'react';
import { CustomerUser } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { isValidEgyptianPhone, normalizeEgyptianPhone, getPhoneValidationError } from '../../utils/phoneValidator';
import MokhalasaSvgLogo from '../brand/MokhalasaSvgLogo';
import { Phone, ShieldCheck, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

interface CompleteProfileModalProps {
  isOpen: boolean;
  customerUser: CustomerUser;
  onProfileCompleted: (updatedUser: CustomerUser) => void;
  lang?: 'ar' | 'en';
}

const EGYPT_GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الشرقية', 
  'الدقهلية', 'البحيرة', 'الغربية', 'المنوفية', 'دمياط', 
  'كفر الشيخ', 'بورسعيد', 'الإسماعيلية', 'السويس', 'البحر الأحمر', 
  'جنوب سيناء', 'بني سويف', 'الفيوم', 'المنيا', 'أسيوط', 'سوهاج',
  'قنا', 'الأقصر', 'أسوان'
];

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  isOpen,
  customerUser,
  onProfileCompleted,
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';
  const [phoneInput, setPhoneInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState(customerUser.name || '');
  const [governorateInput, setGovernorateInput] = useState(customerUser.governorate || 'القاهرة');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validationError = getPhoneValidationError(phoneInput);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    const normalizedPhone = normalizeEgyptianPhone(phoneInput);
    const resolvedName = fullNameInput.trim() || customerUser.name || 'عميل مخلصة';

    setIsSubmitting(true);

    try {
      // 1. Update user_metadata in Supabase Auth without duplicate account creation
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          phone: normalizedPhone,
          full_name: resolvedName,
          governorate: governorateInput
        }
      });

      if (authError) {
        console.warn('Auth user metadata update note:', authError);
      }

      // 2. Upsert record into public.profiles matching current user ID
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: customerUser.id,
          phone: normalizedPhone,
          full_name: resolvedName,
          governorate: governorateInput,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (profileError && !profileError.message.includes('does not exist')) {
        console.warn('Profile table upsert note:', profileError);
      }

      // 3. Update customerUser model in application state
      // Notice: isVerified remains false (phone entered != phone verified via OTP)
      const updated: CustomerUser = {
        ...customerUser,
        name: resolvedName,
        phone: normalizedPhone,
        governorate: governorateInput,
        isVerified: false
      };

      try {
        localStorage.setItem('mokhalasa_customer_user', JSON.stringify(updated));
      } catch {}

      setSuccessMsg('تم حفظ وتحديث رقم الهاتف بنجاح!');

      setTimeout(() => {
        onProfileCompleted(updated);
      }, 900);

    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ أثناء حفظ البيانات. يرجى المحاولة ثانية.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-scaleUp text-right" 
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-1">
            <MokhalasaSvgLogo className="w-9 h-9" />
          </div>
          <h3 className="font-black text-xl text-brand-navy">
            استكمال بيانات الحساب
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            أهلاً بك في مخلصة! رقم الهاتف مطلوب لإتمام تسجيل حسابك ومتابعة المعاملات والتفاوض.
          </p>
        </div>

        {/* Security & Privacy Notice */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-2xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-extrabold text-slate-800 block">
              خصوصية تامة لأرقام المستخدمين
            </span>
            <p className="text-3xs text-slate-500 leading-relaxed">
              رقم هاتفك لن يظهر للعامة أو الزوار في الموقع، ولن يتم كشفه للمشترين أو البائعين دون وسيط الإدارة المعتمد.
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Completion Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">
              الاسم بالكامل:
            </label>
            <input
              type="text"
              value={fullNameInput}
              onChange={(e) => setFullNameInput(e.target.value)}
              placeholder="اكتب اسمك الثلاثي"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none"
              required
            />
          </div>

          {/* Mandatory Phone Input */}
          <div className="space-y-1">
            <label className="font-black text-slate-800 flex items-center justify-between">
              <span>رقم الهاتف المحمول (مصر) <span className="text-rose-500">*</span></span>
              <span className="text-3xs text-brand-green font-mono">11 رقماً</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                dir="ltr"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="01012345678"
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-brand-green focus:outline-none"
                required
                autoFocus
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-3xs text-slate-400">
              يقبل أرقام شبكات: فودافون (010)، اتصالات (011)، أورنج (012)، أو وي (015).
            </p>
          </div>

          {/* Governorate Selection */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">
              المحافظة:
            </label>
            <select
              value={governorateInput}
              onChange={(e) => setGovernorateInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none bg-white"
            >
              {EGYPT_GOVERNORATES.map(gov => (
                <option key={gov} value={gov}>{gov}</option>
              ))}
            </select>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !phoneInput.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري حفظ وتأكيد البيانات...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>حفظ ومتابعة إلى المنصة</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
