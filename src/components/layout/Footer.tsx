import React from 'react';
import MokhalasaSvgLogo from '../brand/MokhalasaSvgLogo';
import { translations } from '../../utils/translations';
import { ShieldCheck, PhoneCall, Mail, MapPin, AlertTriangle, Lock, FileText } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
  lang?: 'ar' | 'en';
}

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC<FooterProps> = ({ onNavigate, lang = 'ar' }) => {
  const isAr = lang === 'ar';
  const t = translations[lang] || translations.ar;

  return (
    <footer className="bg-brand-navy text-white pt-16 pb-12 border-t border-slate-800" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 pb-12 border-b border-slate-700/60">
          
          {/* Brand & Purpose Column */}
          <div className="lg:col-span-2 space-y-4">
            <MokhalasaSvgLogo variant="light" height={44} onClick={() => onNavigate('home')} />
            
            {/* Core Brand Message from Specification */}
            <p className="text-emerald-400 font-extrabold text-sm pt-2">
              «{t.footer.tagline}»
            </p>

            <p className="text-slate-300 text-xs leading-relaxed max-w-md">
              {t.footer.description}
            </p>

            <div className="flex items-center gap-2 text-2xs text-brand-green pt-1">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>{t.footer.zeroCustody}</span>
            </div>
          </div>

          {/* 3 Core Platform Actions */}
          <div>
            <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-wider">
              {t.footer.coreActions}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <button onClick={() => onNavigate('sell-wizard')} className="hover:text-brand-green transition">
                  {isAr ? 'بيع عربيتك مع مخلصة' : 'Sell Your Car with Mokhalasa'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('marketplace')} className="hover:text-brand-green transition">
                  {isAr ? 'تصفح السيارات المتاحة' : 'Browse Available Cars'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('seller-portal')} className="hover:text-brand-green transition flex items-center gap-1">
                  <FileText className="w-3 h-3 text-brand-green inline" />
                  <span>{isAr ? 'متابعة طلبي' : 'Track My Request'}</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('calculator')} className="hover:text-brand-green transition">
                  {isAr ? 'حاسبة التصفية والعمولة (1.5%)' : 'Early Payoff & Fee Calculator'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog')} className="hover:text-brand-green transition text-brand-green font-bold">
                  {isAr ? 'دليل ومقالات السيارات' : 'Car Guides & Blog'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-brand-green transition">
                  {isAr ? 'اسأل فريق مخلصة عن الإجراءات' : 'Ask Mokhalasa Team'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('register')} className="hover:text-brand-green transition text-emerald-400 font-bold">
                  {isAr ? 'إنشاء حساب عميل جديد' : 'Create New Account'}
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Disclaimers & Trust */}
          <div>
            <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-wider">
              {t.footer.trustAndLegal}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-brand-green transition">
                  {isAr ? 'كيف تعمل مخلصة خطوة بخطوة؟' : 'How It Works (Step-by-Step)'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-brand-green transition">
                  {isAr ? 'الأسئلة الشائعة والأمان' : 'FAQ & Legal Safety'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-brand-green transition">
                  {isAr ? 'الشروط وإخلاء المسؤولية' : 'Terms & Disclaimers'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-brand-green transition">
                  {isAr ? 'سياسة حماية البيانات (قانون 151)' : 'Privacy Policy (Law 151)'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-brand-green transition">
                  {isAr ? 'تواصل مع فريق مخلصة' : 'Contact Support Team'}
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-wider">
              {t.footer.contactInfo}
            </h4>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span dir="ltr" className="font-mono">{isAr ? '01008836962 (مكتب الدعم)' : '01008836962 (Support)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span>support@mokhalasa.com</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
                <span>{isAr ? 'شارع التسعين الشمالي، التجمع الخامس، القاهرة' : 'North 90th St, New Cairo, Egypt'}</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('staff')}
                  className="text-3xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1 border-t border-slate-700/50 pt-2"
                >
                  <Lock className="w-2.5 h-2.5 text-slate-500" />
                  <span>{isAr ? 'بوابة الموظفين والعمليات (Private Staff Console)' : 'Private Operations Console'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Regulatory Disclaimers Bottom Banner */}
        <div className="pt-8 text-2xs text-slate-400 space-y-3">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-slate-400 leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">
                {isAr ? 'إخلاء مسؤولية تنظيمي وقانوني:' : 'Regulatory & Legal Disclaimer:'}
              </strong>{' '}
              {isAr
                ? 'منصة «مخلصة» هي منصة استشارية وتكنولوجية لتنسيق صفقات بيع سيارات التمويل وتسويتها، وليست بنكاً، أو جهة إقراض، أو مكتب توثيق حكومي، أو بديلاً عن وحدات المرور المصرية. لا تقدم المنصة أي وعود بنكية مسبقة أو ضمانات بنقل المديونية دون موافقة الجهة الدائنة، ولا تحتفظ بأموال التسوية في حساباتها الشخصية بل يتم الإيداع مباشرة بخزينة البنك الدائن.'
                : 'Mokhalasa is an advisory and technological platform coordinating vehicle payoffs and sales. It is not a bank, lending company, or government notary. The platform does not hold settlement funds in its own accounts; all payments are deposited directly at the creditor bank counter.'}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 pt-2">
            <div>
              {t.footer.rightsReserved} {CURRENT_YEAR} — {isAr ? 'متوافق مع قانون البنك المركزي المصري 194 لسنة 2020 وقانون 151 لسنة 2020.' : 'Compliant with CBE Law 194/2020 & Data Protection Law 151/2020.'}
            </div>
            <div className="flex items-center gap-4 text-3xs">
              <span className="text-brand-green font-bold">
                {isAr ? 'نسبة العمولة: 1.5% من إجمالي سعر البيع فقط' : 'Fee: 1.5% of gross sale price only'}
              </span>
              <span>{isAr ? 'خادم مشفر وآمن' : 'Encrypted & Secure'}</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
