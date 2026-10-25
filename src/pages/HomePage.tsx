import React, { useState } from 'react';
import { Car } from '../types';
import CarCard from '../components/cars/CarCard';
import { COMPREHENSIVE_BANK_DATABASE } from '../data/bankDatabase';
import { 
  ShieldCheck, Banknote, 
  ChevronRight, HelpCircle, 
  Lock, Check, Car as CarIcon, FileText,
  Clock, CheckCircle2, AlertTriangle, Sparkles
} from 'lucide-react';

interface HomePageProps {
  cars: Car[];
  onSelectCar: (car: Car) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onNavigate: (view: string) => void;
  lang?: 'ar' | 'en';
}

export const HomePage: React.FC<HomePageProps> = ({
  cars,
  onSelectCar,
  favorites,
  onToggleFavorite,
  onNavigate,
  lang = 'ar'
}) => {

  // Consultation question modal
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [consultName, setConsultName] = useState('');
  const [consultPhone, setConsultPhone] = useState('');
  const [consultQuestion, setConsultQuestion] = useState('');
  const [consultBank, setConsultBank] = useState('credit_agricole');
  const [consultSubmitted, setConsultSubmitted] = useState(false);

  // Home gallery track tab filter
  const [homeGalleryTab, setHomeGalleryTab] = useState<'all' | 'direct_installment' | 'cash' | 'bank_settlement'>('all');

  const filteredHomeCars = cars.filter(c => {
    if (homeGalleryTab === 'all') return true;
    if (homeGalleryTab === 'direct_installment') return c.saleType === 'direct_installment' || c.vehicleStatus === 'direct_installment' || c.financingType === 'direct_installment';
    if (homeGalleryTab === 'cash') return c.saleType === 'cash' || c.vehicleStatus === 'fully_owned' || c.vehicleStatus === 'cash_only' || c.financingType === 'fully_owned';
    if (homeGalleryTab === 'bank_settlement') return c.saleType === 'bank_settlement' || (c.financingType !== 'fully_owned' && c.financingType !== 'direct_installment');
    return true;
  }).slice(0, 8);

  const handleConsultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConsultSubmitted(true);
    setTimeout(() => {
      setShowConsultModal(false);
      setConsultSubmitted(false);
      setConsultName('');
      setConsultPhone('');
      setConsultQuestion('');
    }, 2500);
  };

  return (
    <div className="space-y-16 pb-16 animate-fadeIn">
      
      {/* 1. HERO SECTION — PREMIER MARKETPLACE POSITIONING */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-brand-navy to-slate-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-navy/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-6">
          
          {/* Specialized Mission Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/15 border border-brand-green/30 text-brand-green text-xs font-black tracking-wide shadow-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>أول منصة في مصر لبيع سيارات المتعثرين وحظر البيع، والتقسيط المباشر، وسيارات الكاش المعتمدة</span>
          </div>

          {/* Primary Core Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            أول منصة لبيع سيارات المتعثرين وحظر البيع
            <span className="block text-brand-green mt-1 text-2xl sm:text-4xl lg:text-5xl">والتقسيط المباشر وسيارات الكاش في مصر</span>
          </h1>

          {/* Core Brand Message */}
          <p className="text-slate-200 text-sm sm:text-lg lg:text-xl font-bold max-w-3xl mx-auto leading-relaxed">
            سواء سيارتك محملة بأقساط بنكية متعثرة وعليها حظر بيع، أو عايز تبيعها أو تشتريها بتقسيط مباشر بدون بنوك، أو كاش ملكية خالصة — «مخلصة» تضمن لك أعلى عائد وأضمن إجراءات قانونية وفنية.
          </p>

          {/* 3 PRIMARY TRACK TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-2 text-right">
            
            {/* Track 1: Bank Debt Settlement & Encumbered Vehicles */}
            <div
              onClick={() => onNavigate('marketplace')}
              className="p-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 transition cursor-pointer backdrop-blur-sm group space-y-2 hover:border-blue-400/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-black bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-400/30">
                  🏦 تسوية وحظر بيع
                </span>
                <ShieldCheck className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-black text-sm text-white">سيارات المتعثرين والأقساط</h3>
              <p className="text-3xs text-slate-300 leading-relaxed">
                تصفية القرض وسداد معجل بخزينة البنك واستخراج مخالصة فك الحظر رسمياً.
              </p>
            </div>

            {/* Track 2: Direct Installment */}
            <div
              onClick={() => onNavigate('marketplace')}
              className="p-5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 transition cursor-pointer backdrop-blur-sm group space-y-2 hover:border-amber-400"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-black bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-400/30">
                  🟡 تقسيط مباشر
                </span>
                <Clock className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-black text-sm text-white">تقسيط بدون بنوك للمعارض والملاك</h3>
              <p className="text-3xs text-amber-100/80 leading-relaxed">
                شراء وبيع بالتقسيط المباشر بمقدم ميسر وضمانات مباشرة بدون تعقيدات ائتمانية.
              </p>
            </div>

            {/* Track 3: Certified Cash Sales */}
            <div
              onClick={() => onNavigate('marketplace')}
              className="p-5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 transition cursor-pointer backdrop-blur-sm group space-y-2 hover:border-emerald-400"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-400/30">
                  🟢 بيع كاش
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-black text-sm text-white">سيارات ملكية خالصة حرة</h3>
              <p className="text-3xs text-emerald-100/80 leading-relaxed">
                تسليم كاش فوري وتنازل رسمي بالشهر العقاري بعد الفحص الفني المعتمد.
              </p>
            </div>

          </div>

          {/* THE 2 PRIMARY INDEPENDENT PLATFORM ACTIONS */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            
            {/* Primary Action 1: Seller Intake */}
            <button
              onClick={() => onNavigate('sell-wizard')}
              className="p-5 rounded-2xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-brand-green/20 transition flex flex-col items-center justify-center gap-2 group transform hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Banknote className="w-6 h-6" />
                <span>1. عايز أبيع عربيتي</span>
              </div>
              <span className="text-3xs sm:text-2xs font-medium text-emerald-100">
                تسوية بنكية • تقسيط مباشر • أو بيع كاش فوري
              </span>
            </button>

            {/* Primary Action 2: Public Marketplace Browse */}
            <button
              onClick={() => onNavigate('marketplace')}
              className="p-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm sm:text-base border border-white/20 transition flex flex-col items-center justify-center gap-2 group transform hover:-translate-y-0.5 backdrop-blur-sm cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CarIcon className="w-6 h-6 text-brand-green" />
                <span>2. تصفح سوق السيارات</span>
              </div>
              <span className="text-3xs sm:text-2xs font-medium text-slate-300">
                استعراض سيارات المتعثرين والتقسيط والكاش المعتمد
              </span>
            </button>

          </div>

          {/* Quick Support & Request Tracking Links */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
            <button
              onClick={() => onNavigate('seller-portal')}
              className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-brand-green" />
              <span>متابعة طلبي</span>
            </button>

            <button
              onClick={() => setShowConsultModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>اسأل فريق مخلصة عن إجراءات البنك</span>
            </button>
          </div>

          {/* Platform Standards Ribbon */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-3xs font-semibold text-slate-300">
            <span className="flex items-center gap-1">✓ أول منصة لسيارات المتعثرين وحظر البيع</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">✓ مسار التقسيط المباشر بدون بنوك</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">✓ سيارات كاش ملكية خالصة</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">✓ عمولة واضحة 1.5% فقط عند إتمام الصفقة</span>
          </div>

        </div>
      </section>

      {/* 2. 1.5% COMMISSION TRANSPARENCY & WORKED EXAMPLE */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-brand-green uppercase tracking-wider block">
                الشفافية المالية الكاملة (Financial Transparency)
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-brand-navy">
                عمولة مخلصة هي 1.5% فقط — بدون أي مصاريف خفية
              </h2>
            </div>
            <div className="bg-emerald-50 text-brand-green px-3.5 py-1.5 rounded-xl text-xs font-extrabold border border-brand-green/20">
              تستحق فقط عند إتمام البيع بنجاح
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            نؤمن بالوضوح التام مع العميل؛ عمولة المنصة موحدة بنسبة <strong>1.5% من إجمالي سعر البيع المتفق عليه</strong>، ولا يتم تحصيل أي مليم إلا بعد إنهاء الإجراءات ونقل الملكية بنجاح.
          </p>

          {/* Labeled Mathematical Illustrative Example */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-brand-green">
                مثال توضيحي بالأرقام (Illustrative Mathematical Example):
              </span>
              <span className="text-3xs text-slate-400 font-mono">حالة بيع سيارة بقيمة 600,000 ج.م</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-3xs text-slate-400">إجمالي سعر البيع (Gross)</div>
                <div className="text-sm font-black text-white mt-1">600,000 ج.م</div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-3xs text-slate-400">تسوية البنك الرسمية</div>
                <div className="text-sm font-black text-blue-400 mt-1">400,000 ج.م</div>
                <div className="text-3xs text-slate-400 mt-0.5">خطاب رسمي مختوم</div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-3xs text-slate-400">مصاريف فك الحظر والمرور</div>
                <div className="text-sm font-black text-amber-400 mt-1">5,000 ج.م</div>
                <div className="text-3xs text-slate-400 mt-0.5">رسوم حكومية موثقة</div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-3xs text-slate-400">عمولة مخلصة (1.5%)</div>
                <div className="text-sm font-black text-brand-green mt-1">9,000 ج.م</div>
                <div className="text-3xs text-slate-400 mt-0.5">1.5% من 600 ألف</div>
              </div>

              <div className="bg-emerald-500/10 p-3 rounded-xl border border-brand-green/30 col-span-2 sm:col-span-1">
                <div className="text-3xs text-brand-green font-bold">صافي كاش البائع</div>
                <div className="text-base font-black text-brand-green mt-1">186,000 ج.م</div>
                <div className="text-3xs text-slate-400 mt-0.5">يستلمها البائع فوراً</div>
              </div>
            </div>

            <div className="text-3xs text-slate-400 pt-1 leading-relaxed">
              * ملاحظة: هذا المثال توضيحي رياضي بحت؛ المبالغ الدقيقة لكل سيارة تتحدد بناءً على مسار البيع (تسوية بنك، تقسيط مباشر، أو كاش) وبيان المديونية الرسمي الصادر وحالة الفحص الفني.
            </div>
          </div>
        </div>
      </section>

      {/* 3. VETTED CARS GALLERY WITH 3 TRACK TABS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-bold text-brand-green uppercase tracking-wider mb-1">
              سوق سيارات مخلصة المعتمد
            </div>
            <h2 className="text-2xl font-black text-brand-navy">
              أحدث السيارات المتاحة للتسوية والتقسيط والكاش
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              جميع السيارات تخضع للفحص الهندسي وتدقيق الموقف القانوني والمالي بإشراف فريق مخلصة.
            </p>
          </div>
          
          <button
            onClick={() => onNavigate('marketplace')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-navy hover:text-brand-green transition cursor-pointer"
          >
            <span>شاهد كل السيارات في المعرض</span>
            <ChevronRight className="w-4 h-4 rtl:rotate-180 text-brand-green" />
          </button>
        </div>

        {/* Gallery Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'direct_installment', label: '🟡 تقسيط مباشر' },
            { id: 'cash', label: '🟢 بيع كاش (ملكية خالصة)' },
            { id: 'bank_settlement', label: '🏦 تسوية وحظر بيع بنكي' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setHomeGalleryTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                homeGalleryTab === tab.id
                  ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredHomeCars.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredHomeCars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                onSelect={onSelectCar}
                isFavorite={favorites.includes(car.id)}
                onToggleFavorite={onToggleFavorite}
                lang={lang}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto shadow-sm">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-brand-green">
              <CarIcon className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-slate-800 text-base">لا توجد سيارات بهذا التصنيف حالياً</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                المنصة تستقبل يومياً طلبات بيع سيارات المتعثرين والتقسيط المباشر والكاش المعتمد.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('sell-wizard')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-slate-950 font-black text-xs transition shadow cursor-pointer"
            >
              <span>اعرض سيارتك للبيع الآن</span>
            </button>
          </div>
        )}
      </section>

      {/* 4. THE 4-STEP MANAGED EXIT PROCESS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-brand-navy to-slate-900 rounded-3xl p-6 sm:p-12 text-white relative overflow-hidden">
          
          <div className="max-w-2xl space-y-3 mb-10">
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider">بروتوكول المعاملات المنظمة</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">كيف نساعدك خطوة بخطوة في بيع وشراء سيارتك؟</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              خطوات واضحة ومنظمة تحفظ حقك كبائع وتضمن إبراء ذمتك بالكامل، وتمنح المشتري الأمان القانوني التام عبر المسارات الثلاثة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-brand-green text-white font-black text-sm flex items-center justify-center">
                01
              </div>
              <h3 className="font-bold text-sm text-white">تسجيل السيارة واختيار المسار</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                تسجيل بيانات السيارة وتحديد نظام البيع: تسوية ديون بنكية وحظر بيع، تقسيط مباشر بدون بنوك، أو بيع كاش ملكية خالصة.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-brand-green text-white font-black text-sm flex items-center justify-center">
                02
              </div>
              <h3 className="font-bold text-sm text-white">التقييم العادل وفحص 150 نقطة</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                تقييم سعر السوق العادل من واقع إعلانات البيع الحقيقية، وإفصاح كامل عن حالة السيارة لضمان استقرار الصفقة دون نزاعات.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-brand-green text-white font-black text-sm flex items-center justify-center">
                03
              </div>
              <h3 className="font-bold text-sm text-white">تأهيل المشتري والاتفاق المعتمد</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                تأهيل المشتري الجاد وتوقيع العقود النموذجية المعتمدة (اتفاق تسوية ثلاثي، عقد تقسيط مباشر بضمانات، أو عقد كاش).
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-brand-green text-white font-black text-sm flex items-center justify-center">
                04
              </div>
              <h3 className="font-bold text-sm text-white">التنفيذ المالي ونقل الملكية</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                سداد رسمي بالبنك لفك الحظر، أو استلام مقدم التقسيط والضمانات، أو تسليم الكاش ونقل القيد بالشهر العقاري والمرور.
              </p>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-green" />
              <span>أمان مالي كامل مع صفر احتجاز للأموال (Zero-Custody) بدون وسطاء مجهولين</span>
            </div>

            <button
              onClick={() => onNavigate('how-it-works')}
              className="text-xs font-bold text-brand-green hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <span>تعرف على الدليل القانوني والإجرائي المفصل</span>
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>

        </div>
      </section>

      {/* 5. DANGER OF INFORMAL POA VS MOKHALASA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider">مقارنة المخاطر</span>
          <h2 className="text-2xl font-black text-brand-navy">
            لماذا ترفض مخلصة بيع السيارات بالتوكيلات العرفية؟
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            يلجأ البعض للبيع العرفي بالتوكيل هرباً من الأقساط، مما يعرض البائع للسجن بتهم التبديد والمشتري لضياع أمواله.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-red-50/60 rounded-3xl p-6 border border-red-200 space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-extrabold text-sm">
              <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center font-bold text-xs">✕</span>
              <span>البيع العرفي غير الرسمي بالتوكيل (مخاطر كارثية)</span>
            </div>
            <ul className="space-y-2 text-xs text-red-950 font-medium leading-relaxed">
              <li>• البنك لا يعترف بالتوكيل ويقاضي البائع جنائياً في حال توقف المشتري عن السداد.</li>
              <li>• استمرار المخالفات المرورية والحوادث مسجلة باسم المالك في النيابة.</li>
              <li>• وفاة المالك تلغي التوكيل فوراً قانوناً وتدخل السيارة ضمن التركة والورثة.</li>
              <li>• ضبط وإحضار السيارة وحجزها في أي كمين مروري بموجب إذن قضائي لصالح البنك.</li>
            </ul>
          </div>

          <div className="bg-emerald-50/60 rounded-3xl p-6 border border-brand-green/30 space-y-4">
            <div className="flex items-center gap-2 text-brand-green font-extrabold text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-xs">✓</span>
              <span>مسار التخارج الآمن المنظم عبر «مخلصة»</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-800 font-medium leading-relaxed">
              <li>• سداد رسمي معتمد في خزينة البنك المقرض وإغلاق ملف القرض إلى الصفر.</li>
              <li>• صدور مخالصة نهائية وإبراء ذمة تام للبائع من أي مطالبات مصرفية.</li>
              <li>• اتفاق ثلاثي مشروط يحمي حيازة المشتري ومستنداته فور السداد.</li>
              <li>• نقل ملكية قانوني نهائي بوحدة المرور والشهر العقاري برخصة جديدة حرة.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. CONSULTATION QUESTION MODAL */}
      {showConsultModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 text-right">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-green" />
                <h3 className="font-extrabold text-base text-brand-navy">اسأل فريق مخلصة عن إجراءات سيارتك</h3>
              </div>
              <button
                onClick={() => setShowConsultModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {consultSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-brand-green flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="text-base font-extrabold text-brand-navy">تم إرسال استفسارك بنجاح</h4>
                <p className="text-xs text-slate-500">
                  سيتواصل معك مستشار مصرفي وقانوني من مخلصة خلال ساعات لمراجعة موقف البنك.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConsultSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسمك بالكامل:</label>
                  <input
                    type="text"
                    required
                    value={consultName}
                    onChange={(e) => setConsultName(e.target.value)}
                    placeholder="مثال: أحمد محمود"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف المحمول (مصر):</label>
                  <input
                    type="tel"
                    required
                    value={consultPhone}
                    onChange={(e) => setConsultPhone(e.target.value)}
                    placeholder="010xxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-green font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">البنك أو جهة التمويل:</label>
                  <select
                    value={consultBank}
                    onChange={(e) => setConsultBank(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    {Object.entries(COMPREHENSIVE_BANK_DATABASE).map(([key, b]) => (
                      <option key={key} value={key}>{b.bankNameAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ما هو استفسارك أو مشكلتك بالتفصيل؟</label>
                  <textarea
                    rows={3}
                    required
                    value={consultQuestion}
                    onChange={(e) => setConsultQuestion(e.target.value)}
                    placeholder="مثال: عندي قسط متأخر شهرين في كريدي أجريكول وعايز أعرف إزاي أبيع بدون ما أدفع غرامة كبيرة..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConsultModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md"
                  >
                    إرسال الاستفسار
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default HomePage;
