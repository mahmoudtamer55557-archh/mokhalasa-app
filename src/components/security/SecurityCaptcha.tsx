import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface SecurityCaptchaProps {
  onVerifyChange: (isVerified: boolean) => void;
  resetTrigger?: number;
  compact?: boolean;
}

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateChallengeCode(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * CAPTCHA_CHARS.length);
    code += CAPTCHA_CHARS[idx];
  }
  return code;
}

/**
 * Interactive Human Verification CAPTCHA + Anti-Bot Honeypot Component
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
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
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
          ? 'bg-emerald-50/70 border-emerald-300'
          : 'bg-slate-50 border-slate-200'
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
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
          <ShieldCheck
            className={`w-4 h-4 ${
              isVerified ? 'text-emerald-600' : 'text-amber-600'
            }`}
          />
          <span>التحقق الأمني ضد الهجمات الآلية (CAPTCHA)</span>
        </div>
        {isVerified ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            تم التحقق
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            مطلوب للمتابعة
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Visual Distorted Challenge Box */}
        <div
          className="select-none relative overflow-hidden rounded-xl bg-slate-900 text-amber-400 px-3.5 py-2 font-mono font-black tracking-[0.28em] text-base shadow-inner border border-slate-700 flex items-center justify-center min-w-[125px]"
          dir="ltr"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 4px, transparent 4px, transparent 8px)',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          }}
          title="رمز التحقق البشري"
        >
          <span className="transform -rotate-2 inline-block">{challenge}</span>
        </div>

        <button
          type="button"
          onClick={refreshChallenge}
          className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
          title="تغيير رمز التحقق"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <input
          type="text"
          dir="ltr"
          value={userInput}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="اكتب الرمز هنا"
          maxLength={5}
          className={`w-full px-3 py-2 rounded-xl border text-center font-mono font-black text-sm tracking-widest uppercase outline-none transition-all ${
            isVerified
              ? 'border-emerald-400 bg-white text-emerald-700 ring-2 ring-emerald-500/20'
              : 'border-slate-300 bg-white text-slate-900 focus:border-emerald-600'
          }`}
        />
      </div>
    </div>
  );
};
