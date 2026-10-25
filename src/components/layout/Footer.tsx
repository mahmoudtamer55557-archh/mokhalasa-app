import React from 'react';
import MokhalasaSvgLogo from '../brand/MokhalasaSvgLogo';
import { ShieldCheck, PhoneCall, Mail, MapPin, AlertTriangle, Lock, FileText } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
  lang?: 'ar' | 'en';
}

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC<FooterProps> = ({ onNavigate, lang = 'ar' }) => {
  const isAr = lang === 'ar';

  return (
    <footer className="bg-brand-navy text-white pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-700/60">
          
          {/* Brand & Purpose Column */}
          <div className="lg:col-span-2 space-y-4">
            <MokhalasaSvgLogo variant="light" height={44} onClick={() => onNavigate('home')} />
            
            {/* Core Brand Message from Specification */}
            <p className="text-emerald-400 font-extrabold text-sm pt-2">
              «أول منصة في مصر لبيع سيارات المتعثرين وحظر البيع، التقسيط المباشر، وسيارات الكاش المعتمدة»
            </p>

            <p className="text-slate-300 text-xs leading-relaxed max-w-md">
              منصة تكنولوجية واستشارية متخصصة لمساعدة ملاك السيارات المتعثرة أو المحملة بأقساط بنكية أو حظر بيع، بالإضافة إلى مسار التقسيط المباشر بدون بنوك وسيارات الكاش ذات الملكية الخالصة، بأعلى درجات الأمان المالي والقانوني وبشفافية تامة.
            </p>

            <div className="flex items-center gap-2 text-2xs text-brand-green pt-1">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>إيداع مباشر بخزينة البنك الدائن (Zero-Custody) بدون وسيط مالي</span>
            </div>
          </div>

          {/* 3 Core Platform Actions */}
          <div>
            <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-wider">
              {isAr ? 'الخدمات الأساسية' : 'Core Actions'}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <button onClick={() => onNavigate('sell-wizard')} className="hover:text-brand-green text-right transition">
                  {isAr ? 'بيع عربيتك مع مخلصة' : 'Sell Your Car'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('marketplace')} className="hover:text-brand-green text-right transition">
                  {isAr ? 'تصفح السيارات المتاحة' : 'Browse Available Cars'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('seller-portal')} className="hover:text-brand-green text-right transition flex items-center gap-1">
                  <FileText className="w-3 h-3 text-brand-green inline" />
                  <span>{isAr ? 'متابعة طلبي' : 'Track My Request'}</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('calculator')} className="hover:text-brand-green text-right transition">
                  {isAr ? 'حاسبة التصفية والعمولة (1.5%)' : 'Fee & Settlement Calc'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-brand-green text-right transition">
                  {isAr ? 'اسأل فريق مخلصة عن الإجراءات' : 'Ask Our Team'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('register')} className="hover:text-brand-green text-right transition text-emerald-400 font-bold">
                  {isAr ? 'إنشاء حساب عميل جديد' : 'Create New Account'}
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Disclaimers & Trust */}
          <div>
            <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-wider">
              {isAr ? 'الضوابط والمعلومات' : 'Information & Trust'}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-brand-green text-right transition">
                  {isAr ? 'كيف تعمل مخلصة خطوة بخطوة؟' : 'How It Works'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-brand-green text-right transition">
                  {isAr ? 'الأسئلة الشائعة والأمان' : 'FAQ'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-brand-green text-right transition">
                  {isAr ? 'الشروط وإخلاء المسؤولية' : 'Terms of Service'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-brand-green text-right transition">
                  {isAr ? 'سياسة حماية البيانات (قانون 151)' : 'Privacy Policy'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-brand-green text-right transition">
                  {isAr ? 'تواصل مع فريق مخلصة' : 'Contact Support'}
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-wider">
              {isAr ? 'المكتب الرئيسي' : 'Main Office'}
            </h4>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span dir="ltr" className="font-mono">19000 (مكتب الدعم)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span>support@mokhalasa.com</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
                <span>شارع التسعين الشمالي، التجمع الخامس، القاهرة</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('staff')}
                  className="text-3xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1 border-t border-slate-700/50 pt-2"
                >
                  <Lock className="w-2.5 h-2.5 text-slate-500" />
                  <span>بوابة الموظفين والعمليات (Private Staff Console)</span>
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
              <strong className="text-slate-200">إخلاء مسؤولية تنظيمي وقانوني:</strong> منصة «مخلصة» هي منصة استشارية وتكنولوجية لتنسيق صفقات بيع سيارات التمويل وتسويتها، وليست بنكاً، أو جهة إقراض، أو مكتب توثيق حكومي، أو بديلاً عن وحدات المرور المصرية. لا تقدم المنصة أي وعود بنكية مسبقة أو ضمانات بنقل المديونية دون موافقة الجهة الدائنة، ولا تحتفظ بأموال التسوية في حساباتها الشخصية بل يتم الإيداع مباشرة بخزينة البنك الدائن.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 pt-2">
            <div>
              جميع الحقوق محفوظة لمنصة مخلصة © {CURRENT_YEAR} — متوافق مع قانون البنك المركزي المصري 194 لسنة 2020 وقانون 151 لسنة 2020.
            </div>
            <div className="flex items-center gap-4 text-3xs">
              <span className="text-brand-green font-bold">نسبة العمولة: 1.5% من إجمالي سعر البيع فقط</span>
              <span>خادم مشفر وآمن</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
