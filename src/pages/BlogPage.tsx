import React, { useState } from 'react';
import { 
  BookOpen, Search, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, 
  Car, Calendar, Clock, Share2, AlertCircle, FileText, ChevronRight, Calculator
} from 'lucide-react';

interface BlogPageProps {
  onNavigate: (view: string) => void;
  lang?: 'ar' | 'en';
}

interface Article {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  category: 'ban_settlement' | 'direct_installment' | 'cash_market' | 'legal_regulations';
  categoryLabelAr: string;
  categoryLabelEn: string;
  summaryAr: string;
  summaryEn: string;
  readTimeAr: string;
  readTimeEn: string;
  publishedDate: string;
  keywordsAr: string[];
  contentAr: {
    sectionTitle: string;
    paragraphs: string[];
  }[];
  ctaType: 'calculator' | 'sell' | 'marketplace';
}

export const BlogPage: React.FC<BlogPageProps> = ({ onNavigate, lang = 'ar' }) => {
  const isAr = lang === 'ar';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  const articles: Article[] = [
    {
      id: 'art-1',
      slug: 'how-to-lift-car-bank-ban-egypt',
      titleAr: 'دليل فك حظر بيع السيارات في البنوك المصرية والشهر العقاري 2026',
      titleEn: 'Complete Guide to Lifting Car Bank Liens & Sale Bans in Egypt (2026)',
      category: 'ban_settlement',
      categoryLabelAr: 'سيارات حظر البيع والتسوية',
      categoryLabelEn: 'Bank Lien & Settlement',
      summaryAr: 'كل ما تريد معرفته عن خطوات فك حظر البيع، استخراج شهادة المخالصة البنكية، والتعامل مع البنك الأهلي وCIB وبنك مصر لإنهاء القرض بأمان.',
      summaryEn: 'Detailed steps for lifting vehicle finance bans, obtaining bank clearance certificates, and legally transferring ownership at notary offices.',
      readTimeAr: '5 دقائق قراءة',
      readTimeEn: '5 min read',
      publishedDate: '2026-10-24',
      keywordsAr: ['فك حظر بيع سيارة', 'مخالصة سيارة بنكية', 'حظر بيع البنك الأهلي', 'إجراءات المرور فك حظر', 'تسوية قرض سيارة'],
      contentAr: [
        {
          sectionTitle: 'ما هو حظر البيع البنكي وما خطورته القانونية؟',
          paragraphs: [
            'عند شراء سيارة بالتقسيط عبر بنك مصري أو شركة تمويل استهلاكي، يتم تسجيل قيد قانوني على رخصة المركبة يسمى «حظر بيع لصالح البنك». هذا القيد يمنع مالك السيارة من نقل ملكيتها أو عمل توكيل بيع مسجل بالشهر العقاري إلا بعد سداد كامل قيمة التمويل.',
            'التحذير الأهم: البيع بتوكيل غير مخصص أو إيصالات أمانة دون رفع الحظر رسمياً قد يعرض البائع والمشتري للمساءلة الجنائية بموجب المادة 341 من قانون العقوبات (جريمة التبديد وخيانة الأمانة).'
          ]
        },
        {
          sectionTitle: 'خطوات استخراج المخالصة البنكية الرسمية',
          paragraphs: [
            '1. التوجه لفرع البنك أو شركة التمويل الدائنة وطلب كشف حساب سداد معجل (Early Settlement Quotation) موجه للمرور.',
            '2. سداد أصل المبلغ المتبقي مضافاً إليه عمولة السداد المعجل المقررة من البنك (تتراوح عادة بين 3% إلى 7% حسب لوائح البنك المركزي المصري).',
            '3. استلام إيصال الإيداع المعتمد من الخزينة البنكية، واستخراج خطاب «مخالصة وفك حظر» موجه إلى وحدة المرور التابع لها ملف السيارة.'
          ]
        },
        {
          sectionTitle: 'إجراءات إنهاء الحظر في إدارة المرور والشهر العقاري',
          paragraphs: [
            'يقوم البائع أو مفوضه بتقديم أصل خطاب المخالصة البنكية إلى نيابة المرور المختصة للتأكد من صحتها، ثم التوجه لوحدة المرور لاستخراج «شهادة بيانات موجهة للشهر العقاري خالية من قيد الحظر».',
            'بمجرد صدور شهادة البيانات النظيفة، يحق للطرفين التوجه للشهر العقاري وتوثيق عقد البيع النهائي المسجل للمشتري بكل أمان وسلاسة.'
          ]
        }
      ],
      ctaType: 'calculator'
    },
    {
      id: 'art-2',
      slug: 'sell-car-with-loan-safely-without-risk',
      titleAr: 'كيف تبيع سيارة عليها أقساط متعثرة دون التعرض لقضايا تبديد؟',
      titleEn: 'How to Sell a Distressed Car Under Bank Installments Without Legal Risk',
      category: 'ban_settlement',
      categoryLabelAr: 'سيارات حظر البيع والتسوية',
      categoryLabelEn: 'Bank Lien & Settlement',
      summaryAr: 'طرق التخارج الآمن من قسط السيارة، وتجنب فخ إيصالات الأمانة والتوكيلات العرفية، وضمان سداد البنك فورياً عبر منصة مخلصة.',
      summaryEn: 'Safe exit strategies for car owners unable to service auto loan payments, avoiding informal promissory notes and unauthorized sub-leases.',
      readTimeAr: '6 دقائق قراءة',
      readTimeEn: '6 min read',
      publishedDate: '2026-10-22',
      keywordsAr: ['بيع عربية عليها أقساط', 'سيارات متعثرين', 'حل مشكلة قسط العربية', 'التنازل عن قسط سيارة', 'عربيات حظر للبيع'],
      contentAr: [
        {
          sectionTitle: 'أزمة التعثر في سداد أقساط السيارات في مصر',
          paragraphs: [
            'مع تغير الأعباء المالية والتضخم، يجد الكثير من أصحاب السيارات صعوبة في الالتزام بأقساط البنوك الشهرية. المشكلة أن التأخر لـ 3 أشهر متتالية يضع اسم العميل في القائمة السلبية لـ I-Score، وقد تبدأ الشؤون القانونية للبنك في اتخاذ إجراءات سحب المركبة قضائياً.',
            'الحل الخاطئ الشائع هو "بيع السيارة على وضعها" لشخص آخر بتوكيل عرفي مقابل مبلغ رمزي مع تعهد المشتري بسداد الأقساط، وهو إجراء عالي الخطورة يؤدي غالباً إلى توقف المشتري الجديد عن السداد وتورط المالك الأصلي.'
          ]
        },
        {
          sectionTitle: 'الحل الآمن: التسوية الثلاثية المباشرة عبر مخلصة',
          paragraphs: [
            'الآلية الصحيحة والمعتمدة تقوم على وجود مشتري جاد يملك السيولة النقدية، ويتم حساب إجمالي المديونية بدقة باستخدام حاسبة مخلصة.',
            'يقوم المشتري بإيداع مبلغ المديونية مباشرة في حساب قرض السيارة بخزينة البنك وليس للبائع، ويحصل البائع على الفارق الصافي (صافي الربح) فور استخراج إيصال السداد، وبذلك يتخلص البائع من الالتزام تماماً وتنتقل السيارة للمشتري نظيفة وبلا ديون.'
          ]
        }
      ],
      ctaType: 'sell'
    },
    {
      id: 'art-3',
      slug: 'direct-car-installments-without-bank-egypt',
      titleAr: 'دليل التقسيط المباشر للسيارات المستعملة بدون بنوك في مصر: الضمانات والشروط',
      titleEn: 'Direct In-House Car Installments in Egypt (No Banks Required): Terms & Guarantees',
      category: 'direct_installment',
      categoryLabelAr: 'التقسيط المباشر بدون بنك',
      categoryLabelEn: 'Direct Installment',
      summaryAr: 'شرح نظام التقسيط المباشر مع المعارض أو الملاك، شروط الشيكات البنكية وإيصالات الأمانة، وكيفية حساب الفائدة الحقيقية.',
      summaryEn: 'Comprehensive guide to peer-to-peer and dealership direct vehicle installments without tedious banking checks or credit approvals.',
      readTimeAr: '4 دقائق قراءة',
      readTimeEn: '4 min read',
      publishedDate: '2026-10-20',
      keywordsAr: ['تقسيط مباشر بدون بنك', 'تقسيط سيارات مستعملة من المالك', 'سيارات مستعملة بالتقسيط بصورة البطاقة', 'شروط تقسيط المعارض المباشر'],
      contentAr: [
        {
          sectionTitle: 'لماذا يفضل الكثيرون التقسيط المباشر عن تمويل البنوك؟',
          paragraphs: [
            'تمويل البنوك يتطلب في العادة مفردات مرتب معقدة، واستعلاماً ميدانياً على السكن والعمل، وسجلاً ائتمانياً خالياً من أي تأخيرات سابقة في I-Score.',
            'نظام التقسيط المباشر يعتمد على علاقة تعاقدية مباشرة بين المشتري والبائع (سواء كان معرضاً مرخصاً أو مالكاً فرداً)، وتقتصر الإجراءات على تقديم صورة بطاقة الرقم القومي سارية مع توقيع شيكات بنكية آجلة بعدد أشهر التقسيط.'
          ]
        },
        {
          sectionTitle: 'الضمانات القانونية المطلوبة للطرفين',
          paragraphs: [
            '1. فحص فني شامل للسيارة (150 نقطة) لتحديد حالتها بدقة.',
            '2. عقد بيع بالتقسيط المباشر يحدد فيه المقدم، القسط الشهري، تاريخ الاستحقاق، وعقوبة التأخير.',
            '3. تسليم الشيكات البنكية أو أوراق الضمان المعتمدة في موعد التوثيق بالشهر العقاري.'
          ]
        }
      ],
      ctaType: 'marketplace'
    },
    {
      id: 'art-4',
      slug: 'how-to-buy-used-car-cash-inspected-egypt',
      titleAr: 'خطوات شراء سيارة مستعملة كاش: كيف تفحص رخصة القيادة والتوكيلات؟',
      titleEn: 'Buying a Clean-Title Used Car for Cash in Egypt: Due Diligence & Inspection Checklist',
      category: 'cash_market',
      categoryLabelAr: 'شراء وبيع الكاش',
      categoryLabelEn: 'Cash Market',
      summaryAr: 'دليل عملي لفحص رخصة السيارة وشهادة المخالفات وبيانات التوكيل بالشهر العقاري، وتجنب فخ السيارات التي عليها نزاعات ورثة أو أحكام قضائية.',
      summaryEn: 'Practical checklist for buying used cars with cash: checking traffic violations, succession lawsuits, and certified notary powers of attorney.',
      readTimeAr: '5 دقائق قراءة',
      readTimeEn: '5 min read',
      publishedDate: '2026-10-18',
      keywordsAr: ['شراء سيارة مستعملة كاش', 'فحص رخصة السيارة', 'شهادة بيانات المرور', 'توكيل بيع سيارة بالشهر العقاري', 'فحص السيارات المستعملة مصر'],
      contentAr: [
        {
          sectionTitle: 'الفحص الورقي والقانوني قبل الفحص الفني',
          paragraphs: [
            'كثير من المشترين يركزون على فحص الموتور والعفشة والشاسيه ويهملون تدقيق الأوراق، ليكتشفوا لاحقاً أن السيارة عليها توكيلات منتهية الصلاحية أو نزاع ورثة أو قرار حجز قضائي.',
            'أول خطوة هي مطابقة اسم المالك في الرخصة مع بطاقة الرقم القومي، والتأكد من عدم وجود أي عبارة «حظر بيع لصالح...» أو «حق انتفاع» في خلفية الرخصة.'
          ]
        },
        {
          sectionTitle: 'خطوات إنهاء الصفقة بالشهر العقاري والمرور',
          paragraphs: [
            '1. استخراج شهادة براءة الذمة (شهادة المخالفات) من نيابة المرور أو عبر بوابة الحكومة الإلكترونية قبل يوم المعاينة.',
            '2. استخراج شهادة بيانات حديثة ومطابقة أرقام الشاسيه والموتور على الطبيعة مع المكتوب في الشهادة.',
            '3. التوثيق بالشهر العقاري عبر عقد بيع مسجل مباشر من المالك أو بالتوكيل الرسمي الموثق.'
          ]
        }
      ],
      ctaType: 'marketplace'
    }
  ];

  const filteredArticles = articles.filter(art => {
    const matchesCat = selectedCategory === 'all' || art.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      art.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summaryAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.keywordsAr.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-brand-bg py-8 sm:py-12 px-4 sm:px-6 lg:px-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">

        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <button onClick={() => onNavigate('home')} className="hover:text-brand-navy transition">
            {isAr ? 'الرئيسية' : 'Home'}
          </button>
          <span>/</span>
          {activeArticle ? (
            <>
              <button onClick={() => setActiveArticle(null)} className="hover:text-brand-navy transition">
                {isAr ? 'دليل ومقالات مخلصة' : 'Guides & Knowledge Hub'}
              </button>
              <span>/</span>
              <span className="text-brand-navy font-bold line-clamp-1">{isAr ? activeArticle.titleAr : activeArticle.titleEn}</span>
            </>
          ) : (
            <span className="text-brand-navy font-bold">{isAr ? 'دليل ومقالات مخلصة' : 'Guides & Knowledge Hub'}</span>
          )}
        </nav>

        {/* ACTIVE ARTICLE VIEW */}
        {activeArticle ? (
          <article className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border shadow-card space-y-8 max-w-4xl mx-auto">
            {/* Back Button */}
            <button 
              onClick={() => setActiveArticle(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-navy transition bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl"
            >
              {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{isAr ? 'العودة لقائمة المقالات' : 'Back to Articles'}</span>
            </button>

            {/* Header */}
            <div className="space-y-4 border-b border-slate-100 pb-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full text-2xs font-extrabold bg-brand-green/10 text-brand-green">
                  {isAr ? activeArticle.categoryLabelAr : activeArticle.categoryLabelEn}
                </span>
                <span className="text-2xs text-slate-400 flex items-center gap-1 font-mono">
                  <Calendar className="w-3 h-3" />
                  {activeArticle.publishedDate}
                </span>
                <span className="text-2xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {isAr ? activeArticle.readTimeAr : activeArticle.readTimeEn}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-brand-navy leading-snug">
                {isAr ? activeArticle.titleAr : activeArticle.titleEn}
              </h1>

              <p className="text-slate-600 text-sm leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {isAr ? activeArticle.summaryAr : activeArticle.summaryEn}
              </p>
            </div>

            {/* Content Sections */}
            <div className="space-y-8 text-slate-700 leading-relaxed text-sm">
              {activeArticle.contentAr.map((sec, idx) => (
                <div key={idx} className="space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-brand-navy flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-green inline-block"></span>
                    <span>{sec.sectionTitle}</span>
                  </h2>
                  {sec.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="text-slate-600 leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            {/* Keywords Tags */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-400 block">
                {isAr ? 'الكلمات المفتاحية والمواضيع المرتبطة:' : 'Related Keywords:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {activeArticle.keywordsAr.map((kw, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-2xs rounded-lg font-medium">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Contextual CTA Box */}
            <div className="bg-brand-navy text-white p-6 sm:p-8 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-brand-green flex-shrink-0" />
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    {isAr ? 'هل لديك سيارة ترغب في تسويتها أو بيعها بأمان؟' : 'Need help resolving or selling a car safely?'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {isAr 
                      ? 'فريق مخلصة القانوني والفني ينظم كافة الخطوات في البنوك والشهر العقاري بعمولة 1.5% فقط.'
                      : 'Mokhalasa handles legal and technical coordination with 1.5% success fee only.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {activeArticle.ctaType === 'calculator' && (
                  <button
                    onClick={() => onNavigate('calculator')}
                    className="px-5 py-3 rounded-xl bg-brand-green text-brand-navy font-black text-xs hover:bg-emerald-400 transition flex items-center gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>{isAr ? 'احسب السداد المعجل وعمولة البنك' : 'Calculate Early Payoff & Fees'}</span>
                  </button>
                )}
                {activeArticle.ctaType === 'sell' && (
                  <button
                    onClick={() => onNavigate('sell-wizard')}
                    className="px-5 py-3 rounded-xl bg-brand-green text-brand-navy font-black text-xs hover:bg-emerald-400 transition flex items-center gap-2"
                  >
                    <Car className="w-4 h-4" />
                    <span>{isAr ? 'اعرض سيارتك للتسوية الآن' : 'Submit Your Car for Settlement'}</span>
                  </button>
                )}
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-2"
                >
                  <span>{isAr ? 'تصفح السيارات المتاحة في السوق' : 'Browse Available Cars'}</span>
                  {isAr ? <ChevronRight className="w-4 h-4 rotate-180" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>

          </article>
        ) : (
          /* ARTICLE LISTING VIEW */
          <div className="space-y-8">
            
            {/* Header Hero */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="px-3.5 py-1.5 rounded-full text-2xs font-extrabold bg-brand-green/10 text-brand-green inline-flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isAr ? 'دليل السيارات وقوانين التمويل في مصر' : 'Automotive & Finance Knowledge Hub'}</span>
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-brand-navy">
                {isAr ? 'كل ما تحتاج معرفته عن سيارات الحظر والتقسيط والكاش' : 'Master Egyptian Auto Finance & Legal Regulations'}
              </h1>
              <p className="text-slate-600 text-sm leading-relaxed">
                {isAr
                  ? 'مقالات وإرشادات موثقة لمساعدتك في بيع أو شراء سيارتك بأمان قانوني 100% وبدون مخاطر إيصالات أمانة أو نزاعات مصرفية.'
                  : 'Verified articles and practical guides to help you buy or sell vehicles legally without financial or criminal exposure.'}
              </p>
            </div>

            {/* Search and Category Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-brand-border shadow-sm space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث عن موضوع: فك حظر، شهادة بيانات، تقسيط بدون بنك، مخالصة البنك الأهلي...' : 'Search topics: bank ban, inspection, direct installment...'}
                  className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-green transition"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { id: 'all', labelAr: 'جميع المقالات', labelEn: 'All Articles' },
                  { id: 'ban_settlement', labelAr: 'سيارات حظر البيع والتسوية', labelEn: 'Lien & Settlement' },
                  { id: 'direct_installment', labelAr: 'التقسيط المباشر بدون بنك', labelEn: 'Direct Installment' },
                  { id: 'cash_market', labelAr: 'شراء وبيع الكاش', labelEn: 'Cash Market' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      selectedCategory === cat.id
                        ? 'bg-brand-navy text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isAr ? cat.labelAr : cat.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArticles.map(article => (
                <div
                  key={article.id}
                  onClick={() => {
                    setActiveArticle(article);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white rounded-3xl p-6 border border-brand-border shadow-card hover:shadow-card-hover hover:border-brand-green/50 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-2xs text-slate-400">
                      <span className="px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-700 group-hover:bg-brand-green/10 group-hover:text-brand-green transition">
                        {isAr ? article.categoryLabelAr : article.categoryLabelEn}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {isAr ? article.readTimeAr : article.readTimeEn}
                      </span>
                    </div>

                    <h2 className="text-lg font-black text-brand-navy group-hover:text-brand-green transition leading-snug">
                      {isAr ? article.titleAr : article.titleEn}
                    </h2>

                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                      {isAr ? article.summaryAr : article.summaryEn}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-navy group-hover:text-brand-green transition mt-4">
                    <span>{isAr ? 'اقرأ الدليل كاملاً' : 'Read Full Guide'}</span>
                    {isAr ? <ChevronRight className="w-4 h-4 rotate-180" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-brand-navy">
                  {isAr ? 'لم يتم العثور على مقالات مطابقة' : 'No matching guides found'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? 'جرب البحث بكلمات أخرى مثل "فك حظر" أو "تقسيط" أو "مخالصة"' : 'Try searching with keywords like bank ban, installment, or settlement'}
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  {isAr ? 'عرض جميع المقالات' : 'Show All Articles'}
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default BlogPage;
