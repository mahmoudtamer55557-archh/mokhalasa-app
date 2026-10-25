import React, { useState, useEffect } from 'react';
import { CustomerUser } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { isValidEgyptianPhone, normalizeEgyptianPhone, getPhoneValidationError } from '../../utils/phoneValidator';
import { otpService } from '../../services/otpService';
import MokhalasaSvgLogo from '../brand/MokhalasaSvgLogo';
import { Phone, ShieldCheck, AlertCircle, CheckCircle2, Lock, MessageSquare, ArrowRight, RotateCcw } from 'lucide-react';

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
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [phoneInput, setPhoneInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState(customerUser.name || '');
  const [governorateInput, setGovernorateInput] = useState(customerUser.governorate || 'القاهرة');
  
  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (step === 'otp' && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  // Step 1: Submit info and send WhatsApp OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validationError = getPhoneValidationError(phoneInput);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    const cleanPhone = normalizeEgyptianPhone(phoneInput);
    setIsSubmitting(true);

    try {
      const res = await otpService.generateAndSendOtp(cleanPhone, {
        userId: customerUser.id,
        purpose: 'profile_update'
      });

      if (res.success) {
        setStep('otp');
        setCountdown(45);
        setCanResend(false);
        setSuccessMsg(`تم إرسال كود التحقق (OTP) في رسالة عبر الواتساب إلى رقم: ${cleanPhone}`);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ في إرسال كود الواتساب.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanPhone = normalizeEgyptianPhone(phoneInput);
    const res = await otpService.generateAndSendOtp(cleanPhone, {
      userId: customerUser.id,
      purpose: 'profile_update'
    });

    setIsSubmitting(false);
    if (res.success) {
      setCountdown(45);
      setCanResend(false);
      setSuccessMsg(`تم إعادة إرسال كود التحقق بنجاح إلى رقم الواتساب: ${cleanPhone}`);
    } else {
      setErrorMsg(res.message);
    }
  };

  // Step 2: Verify OTP and save profile
  const handleVerifyOtpAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (otpCode.trim().length !== 4) {
      setErrorMsg('يرجى إدخال كود التحقق المكون من 4 أرقام.');
      return;
    }

    const cleanPhone = normalizeEgyptianPhone(phoneInput);
    setIsSubmitting(true);

    try {
      const verifyRes = await otpService.verifyOtp(cleanPhone, otpCode.trim(), {
        userId: customerUser.id
      });

      if (!verifyRes.success) {
        setErrorMsg(verifyRes.message);
        setIsSubmitting(false);
        return;
      }

      const resolvedName = fullNameInput.trim() || customerUser.name || 'عميل مخلصة';

      // 1. Update user_metadata in Supabase Auth
      await supabase.auth.updateUser({
        data: {
          phone: cleanPhone,
          full_name: resolvedName,
          governorate: governorateInput,
          phone_verified: true,
          phone_verified_at: new Date().toISOString()
        }
      });

      // 2. Upsert profile in Supabase
      await supabase.from('profiles').upsert({
        id: customerUser.id,
        phone: cleanPhone,
        full_name: resolvedName,
        governorate: governorateInput,
        is_verified: true,
        phone_verified: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      // 3. Mark customerUser as verified
      const updated: CustomerUser = {
        ...customerUser,
        name: resolvedName,
        phone: cleanPhone,
        governorate: governorateInput,
        isVerified: true
      };

      try {
        localStorage.setItem('mokhalasa_customer_user', JSON.stringify(updated));
      } catch {}

      setSuccessMsg('تم التحقق من رقم الواتساب بنجاح وتفعيل حسابك!');

      setTimeout(() => {
        onProfileCompleted(updated);
      }, 900);

    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر استكمال الحفظ. يرجى المحاولة لاحقاً.');
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
            {step === 'info' ? 'استكمال وتأكيد بيانات الحساب' : 'تأكيد كود الواتساب (OTP)'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            {step === 'info' 
              ? 'أهلاً بك في مخلصة! رقم الواتساب إلزامي لتوثيق الهوية وإرسال عروض التفاوض والتنبيهات.'
              : `أدخل كود التحقق المكون من 4 أرقام المرسل إلى واتساب رقم: ${phoneInput}`}
          </p>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-2xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-extrabold text-slate-800 block">
              توثيق آمن وخاص 100%
            </span>
            <p className="text-3xs text-slate-500 leading-relaxed">
              الكود مخصص لحسابك فقط وصالح لمدة 5 دقائق. لن يتم مشاركة رقم هاتفك مع أي طرف خارجي.
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

        {/* STEP 1: Phone & Info Form */}
        {step === 'info' && (
          <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
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
                <span>رقم الواتساب (مصر) <span className="text-rose-500">*</span></span>
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
                  placeholder="010XXXXXXXX"
                  className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-brand-green focus:outline-none"
                  required
                  autoFocus
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
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
                    <span>جاري إرسال كود الواتساب...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>إرسال كود التحقق عبر الواتساب</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: OTP Verification Form */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtpAndSave} className="space-y-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-black text-slate-800 text-xs">
                  أدخل كود الـ OTP المكون من 4 أرقام:
                </label>
                <button
                  type="button"
                  onClick={() => { setStep('info'); setErrorMsg(null); }}
                  className="text-3xs text-brand-green hover:underline font-bold inline-flex items-center gap-1"
                >
                  <ArrowRight className="w-3 h-3 rotate-180" />
                  <span>تعديل الرقم</span>
                </button>
              </div>

              <input
                type="text"
                dir="ltr"
                maxLength={4}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, ''));
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="••••"
                className="w-full py-3 text-center text-2xl font-black font-mono tracking-widest rounded-2xl border-2 border-brand-green/40 focus:border-brand-green focus:ring-4 focus:ring-brand-green/20 focus:outline-none bg-emerald-50/20 text-slate-900"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between text-3xs text-slate-500 font-bold px-1">
              <span>صلاحية الكود: 5 دقائق</span>
              {countdown > 0 ? (
                <span className="text-slate-400">إعادة الإرسال بعد ({countdown} ثانية)</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                  className="text-brand-green hover:underline font-bold inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>إعادة إرسال الكود</span>
                </button>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || otpCode.trim().length !== 4}
                className="w-full py-3.5 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default CompleteProfileModal;
