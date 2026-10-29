import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';

interface SecurityCaptchaProps {
  onVerifyChange: (isVerified: boolean) => void;
  resetTrigger?: number;
  compact?: boolean;
}

const CAPTCHA_DIGITS = '23456789';

function generateChallengeCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * CAPTCHA_DIGITS.length);
    code += CAPTCHA_DIGITS[idx];
  }
  return code;
}

function normalizeArabicDigits(str: string): string {
  return str
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

/**
 * Interactive Human Verification CAPTCHA + Anti-Bot Honeypot Component
 * Designed to be effortless for non-technical users (4 clear digits + numeric keypad + Arabic digit support)
 */
export const SecurityCaptcha: React.FC<SecurityCaptchaProps> = ({
  onVerifyChange,
  resetTrigger = 0,
  compact = false,
}) => {
  const [challenge, setChallenge] = useState<string>(() => generateChallengeCode());
  const [userInput, setUserInput] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>(''); // Hidden trap for bots
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const refreshChallenge = useCallback(() => {
    const next = generateChallengeCode();
    setChallenge(next);
    setUserInput('');
    setIsVerified(false);
    onVerifyChange(false);
  }, [onVerifyChange]);

  useEffect(() => {
    if (resetTrigger > 0) {
      refreshChallenge();
    }
  }, [resetTrigger, refreshChallenge]);

  const handleInputChange = (val: string) => {
    const normalized = normalizeArabicDigits(val);
    const cleaned = normalized.replace(/[^0-9]/g, '').slice(0, 4);
    setUserInput(cleaned);

    // If honeypot was filled by a bot, never verify
    if (honeypot.trim().length > 0) {
      setIsVerified(false);
      onVerifyChange(false);
      return;
    }

    const matched = cleaned === challenge;
    setIsVerified(matched);
    onVerifyChange(matched);
  };

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isVerified
          ? 'bg-emerald-50/60 border-emerald-300/80'
          : 'bg-slate-50/80 border-slate-200/90'
      } ${compact ? 'p-3' : 'p-3.5'}`}
    >
      {/* Hidden Honeypot Trap against automated bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="mk_website_url_hp">Leave this field empty</label>
        <input
          id="mk_website_url_hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => {
            setHoneypot(e.target.value);
            setIsVerified(false);
            onVerifyChange(false);
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <ShieldCheck
            className={`w-4 h-4 ${
              isVerified ? 'text-emerald-600' : 'text-brand-green'
            }`}
          />
          <span>تأكيد الأمان السريع (اكتب الـ 4 أرقام)</span>
        </div>
        {isVerified ? (
          <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            تم التأكيد بنجاح
          </span>
        ) : (
          <button
            type="button"
            onClick={refreshChallenge}
            className="inline-flex items-center gap-1 text-2xs font-bold text-slate-500 hover:text-brand-navy transition"
            title="تغيير الرقم"
          >
            <RefreshCw className="w-3 h-3" />
            <span>تغيير الرقم</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Clean, high-contrast 4-digit visual badge */}
        <div
          className="select-none relative overflow-hidden rounded-xl bg-brand-navy text-emerald-400 px-4 py-2.5 font-mono font-black tracking-[0.3em] text-base shadow-sm border border-slate-800 flex items-center justify-center min-w-[115px]"
          dir="ltr"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 5px, transparent 5px, transparent 10px)',
          }}
          title="رمز الأمان"
        >
          <span>{challenge}</span>
        </div>

        <input
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={userInput}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="اكتب الـ 4 أرقام هنا"
          maxLength={4}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-center font-mono font-bold text-sm tracking-widest outline-none transition-all ${
            isVerified
              ? 'border-emerald-400 bg-white text-emerald-700 ring-2 ring-emerald-500/20'
              : 'border-slate-200 bg-white text-slate-900 focus:border-brand-green focus:ring-2 focus:ring-brand-green/15'
          }`}
        />
      </div>
    </div>
  );
};
