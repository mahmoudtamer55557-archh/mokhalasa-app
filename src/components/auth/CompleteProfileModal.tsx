import React, { useState, useEffect } from 'react';
import { CustomerUser } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { isValidEgyptianPhone, normalizeEgyptianPhone, getPhoneValidationError } from '../../utils/phoneValidator';
import { otpService } from '../../services/otpService';
import { sendWelcomeWhatsApp } from '../../services/whatsappService';
import { authService } from '../../services/authService';
import { GOVERNORATES_LIST, getDistrictsForGovernorate } from '../../data/egyptLocationsHierarchy';
import { validateAdultAge18Plus } from '../../utils/securityGuard';
import MokhalasaSvgLogo from '../brand/MokhalasaSvgLogo';
import { Phone, ShieldCheck, AlertCircle, CheckCircle2, MessageSquare, ArrowRight, RotateCcw, MapPin, Calendar, LogOut } from 'lucide-react';

interface CompleteProfileModalProps {
  isOpen: boolean;
  customerUser: CustomerUser;
  onProfileCompleted: (updatedUser: CustomerUser) => void;
  lang?: 'ar' | 'en';
}

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
  const [districtInput, setDistrictInput] = useState(() => {
    const list = getDistrictsForGovernorate(customerUser.governorate || 'القاهرة');
    return list[0] || '';
  });

  // 18+ Date of Birth State
  const [birthYear, setBirthYear] = useState('1995');
  const [birthMonth, setBirthMonth] = useState('06');
  const [birthDay, setBirthDay] = useState('15');
  
  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // When governorate changes, update districts list
  const availableDistricts = getDistrictsForGovernorate(governorateInput);

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

    // 1. Phone validation
    const validationError = getPhoneValidationError(phoneInput);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    // 2. Age 18+ validation
    const fullBirthDate = `${birthYear}-${birthMonth}-${birthDay}`;
    const ageResult = validateAdultAge18Plus(fullBirthDate);
    if (!ageResult.isAdult) {
      setErrorMsg(ageResult.error || 'يجب ألا يقل العمر عن 18 عاماً للتسجيل على منصة مخلصة وفقاً للقوانين المصرية.');
      return;
    }

    const cleanPhone = normalizeEgyptianPhone(phoneInput);
    setIsSubmitting(true);

    try {
      // 3. Strict Phone Uniqueness Check across entire DB and registry!
      const phoneCheck = await authService.checkPhoneAccountExists(cleanPhone);
      if (phoneCheck.exists && phoneCheck.account && phoneCheck.account.userId && phoneCheck.account.userId !== customerUser.id) {
        setErrorMsg('رقم الهاتف هذا مسجل بالفعل بحساب آخر على منصة مخلصة. كل عميل يمتلك حساباً واحداً فقط برقم هاتفه.');
        setIsSubmitting(false);
        return;
      }

      // 4. Send WhatsApp OTP
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
    const fullBirthDate = `${birthYear}-${birthMonth}-${birthDay}`;
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
          district: districtInput,
          birth_date: fullBirthDate,
          phone_verified: true,
          phone_verified_at: new Date().toISOString()
        }
      });

      // 2. Upsert profile in Supabase profiles table
      try {
        await supabase.from('profiles').upsert({
          id: customerUser.id,
          phone: cleanPhone,
          full_name: resolvedName,
          governorate: governorateInput,
          city: districtInput,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch {}

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

      // 4. Send Welcome WhatsApp message with account details
      sendWelcomeWhatsApp(cleanPhone, resolvedName, `${governorateInput} - ${districtInput}`).catch(err =>
        console.warn('Welcome WhatsApp notice:', err)
      );

      setSuccessMsg('تم التحقق من رقم الواتساب بنجاح وتفعيل حسابك!');

      setTimeout(() => {
        onProfileCompleted(updated);
      }, 800);

    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر استكمال الحفظ. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoutAndSwitch = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('mokhalasa_customer_user');
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-scaleUp text-right max-h-[92vh] overflow-y-auto" 
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-13 h-13 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-1 p-2">
            <MokhalasaSvgLogo className="w-9 h-9" />
          </div>
          <h3 className="font-black text-lg sm:text-xl text-brand-navy">
            {step === 'info' ? 'استكمال وتأكيد بيانات الحساب' : 'تأكيد كود الواتساب (OTP)'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            {step === 'info' 
              ? 'مرحباً بك! لإتمام الأمان وتوثيق الهوية، يرجى استكمال بياناتك ورقم الواتساب الخاص بك.'
              : `أدخل كود التحقق المكون من 4 أرقام المرسل إلى واتساب: ${phoneInput}`}
          </p>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 text-2xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-extrabold text-slate-800 block">
              حساب واحد موثق لكل رقم هاتف مصري (+18)
            </span>
            <p className="text-3xs text-slate-500 leading-relaxed">
              وفقاً لقواعد مخلصة والقوانين المصرية، تقتصر المعاملات والعروض على الحسابات الموثقة للبالغين فقط.
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
          <form onSubmit={handleSendOtp} className="space-y-3.5 text-xs">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">
                الاسم بالكامل: <span className="text-rose-500">*</span>
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
                <span className="text-3xs text-brand-green font-mono">11 رقماً (حساب واحد لكل رقم)</span>
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

            {/* Date of Birth (18+ Mandatory) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>تاريخ الميلاد (السن القانوني +18) <span className="text-rose-500">*</span></span>
                <span className="text-3xs text-slate-500">مطلوب للتوثيق</span>
              </label>
              <div className="grid grid-cols-3 gap-2" dir="ltr">
                <select
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                  className="px-2 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green bg-white text-center"
                >
                  {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                  className="px-2 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green bg-white text-center"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="px-2 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green bg-white text-center"
                >
                  {Array.from({ length: 70 }, (_, i) => String(new Date().getFullYear() - 18 - i)).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Egyptian Address Hierarchy */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  المحافظة: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={governorateInput}
                  onChange={(e) => {
                    const newGov = e.target.value;
                    setGovernorateInput(newGov);
                    const dists = getDistrictsForGovernorate(newGov);
                    setDistrictInput(dists[0] || '');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green bg-white"
                >
                  {GOVERNORATES_LIST.map((gov: string) => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  المنطقة / الحي: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={districtInput}
                  onChange={(e) => setDistrictInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green bg-white"
                >
                  {availableDistricts.map((dist: string) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !phoneInput.trim()}
                className="w-full py-3 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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

            {/* Sign out and switch option */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleLogoutAndSwitch}
                className="text-3xs text-slate-400 hover:text-rose-600 transition inline-flex items-center gap-1 font-semibold"
              >
                <LogOut className="w-3 h-3" />
                <span>تسجيل الخروج والتبديل لحساب آخر</span>
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
                className="w-full py-3 px-4 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
