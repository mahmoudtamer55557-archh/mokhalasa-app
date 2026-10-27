import React, { useState, useMemo } from 'react';
import { Car } from '../types';
import CarCard from '../components/cars/CarCard';
import { translations } from '../utils/translations';
import { Search, ShieldCheck, Banknote, Car as CarIcon } from 'lucide-react';

interface MarketplacePageProps {
  cars: Car[];
  onSelectCar: (car: Car) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onNavigate?: (view: string) => void;
  lang?: 'ar' | 'en';
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  cars,
  onSelectCar,
  favorites,
  onToggleFavorite,
  onNavigate,
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';
  const t = translations[lang] || translations.ar;

  const [searchTerm, setSearchTerm] = useState('');
  const [saleTypeFilter, setSaleTypeFilter] = useState<'all' | 'direct_installment' | 'cash' | 'bank_settlement'>('all');
  const [selectedFinancing, setSelectedFinancing] = useState<string>('all');
  const [selectedMake, setSelectedMake] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(3000000);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'mileage_asc'>('featured');

  // Buyer Waitlist / Custom Car Request State
  const [buyerMake, setBuyerMake] = useState('');
  const [buyerBudget, setBuyerBudget] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerTrack, setBuyerTrack] = useState<'bank_settlement' | 'direct_installment' | 'cash'>('bank_settlement');
  const [buyerRequestSuccess, setBuyerRequestSuccess] = useState(false);

  const handleBuyerRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerPhone) return;
    try {
      const existing = JSON.parse(localStorage.getItem('mokhalasa_buyer_requests') || '[]');
      existing.push({
        id: 'REQ-' + Date.now(),
        make: buyerMake || 'أي ماركة',
        budget: buyerBudget,
        track: buyerTrack,
        phone: buyerPhone,
        date: new Date().toISOString()
      });
      localStorage.setItem('mokhalasa_buyer_requests', JSON.stringify(existing));
    } catch {}
    setBuyerRequestSuccess(true);
    setTimeout(() => {
      setBuyerRequestSuccess(false);
      setBuyerMake('');
      setBuyerBudget('');
      setBuyerPhone('');
    }, 4000);
  };

  // Available makes
  const makes = useMemo(() => {
    return Array.from(new Set(cars.map(c => c.make)));
  }, [cars]);

  // Filtered and sorted cars with Contextual Top 3 & Top 10 Ranking
  const filteredCars = useMemo(() => {
    // Check if user is currently filtering by a specific make/category
    const isCategoryScoped = selectedMake !== 'all' || (
      !!searchTerm && makes.some(m => m.toLowerCase().includes(searchTerm.trim().toLowerCase()) || searchTerm.trim().toLowerCase().includes(m.toLowerCase()))
    );

    const getEffectiveRank = (car: Car): number | null => {
      if (!car.featured) return null;
      const rank = car.featuredRank || 999;
      const scope = car.featuredScope || 'both';

      if (isCategoryScoped) {
        // When searching or filtering by a specific make (e.g. "شيري"), any featured car in this category takes priority
        return rank;
      } else {
        // In the general showroom, only cars designated for 'all' or 'both' take the general top positions
        if (scope === 'category_only') return null; // regular order in general view
        return rank;
      }
    };

    return cars
      .filter((car) => {
        const matchSearch =
          car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.trim.toLowerCase().includes(searchTerm.toLowerCase());

        const isDirect = car.saleType === 'direct_installment' || car.financingType === 'direct_installment' || !!car.directInstallment;
        const isCash = car.saleType === 'cash' || car.financingType === 'fully_owned' || car.vehicleStatus === 'cash_only';
        const isBank = !isDirect && !isCash;

        const matchSaleType =
          saleTypeFilter === 'all' ||
          (saleTypeFilter === 'direct_installment' && isDirect) ||
          (saleTypeFilter === 'cash' && isCash) ||
          (saleTypeFilter === 'bank_settlement' && isBank);

        const matchFinancing =
          selectedFinancing === 'all' || car.financingType === selectedFinancing;

        const matchMake = selectedMake === 'all' || car.make === selectedMake;
        const matchPrice = car.askingPrice <= maxPrice;

        return matchSearch && matchSaleType && matchFinancing && matchMake && matchPrice;
      })
      .sort((a, b) => {
        // Priority 1: Contextual Featured Rank (Rank 1 comes before 2, 2 before 3...)
        const rankA = getEffectiveRank(a);
        const rankB = getEffectiveRank(b);

        if (rankA !== null && rankB !== null) {
          if (rankA !== rankB) return rankA - rankB;
        } else if (rankA !== null) {
          return -1;
        } else if (rankB !== null) {
          return 1;
        }

        // Priority 2: User-selected sort option
        if (sortBy === 'price_asc') return a.askingPrice - b.askingPrice;
        if (sortBy === 'price_desc') return b.askingPrice - a.askingPrice;
        if (sortBy === 'mileage_asc') return a.mileage - b.mileage;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [cars, searchTerm, saleTypeFilter, selectedFinancing, selectedMake, maxPrice, sortBy, makes]);

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-EG', { maximumFractionDigits: 0 }).format(num) + (isAr ? ' ج.م' : ' EGP');
  };

  return (
    <div className="min-h-screen bg-brand-bg py-6 sm:py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Marketplace Header */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-brand-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-brand-green text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>{t.marketplace.badge}</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-brand-navy">
              {t.marketplace.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {t.marketplace.desc}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1.5 flex-shrink-0 max-w-xs">
            <div className="flex items-center gap-1.5 font-bold text-brand-navy">
              <Banknote className="w-4 h-4 text-brand-green" />
              <span>{isAr ? 'طرق الشراء المتاحة:' : 'Available Purchase Methods:'}</span>
            </div>
            <p className="text-3xs text-slate-500 leading-relaxed">
              {t.marketplace.availableMethods}
            </p>
          </div>
        </div>

        {/* Search & Quick Filters Bar */}
        <div className="bg-white rounded-2xl p-4 border border-brand-border shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className={`w-4 h-4 text-slate-400 absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
              <input
                type="text"
                name="car_search_query"
                id="car_search_query"
                aria-label={isAr ? 'البحث عن سيارة بالماركة أو الموديل أو المحافظة' : 'Search cars by make, model, or city'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.marketplace.searchPlaceholder}
                className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-green bg-slate-50`}
              />
            </div>

            {/* Quick Track Type Filters (Horizontal scrollable on mobile) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0 text-xs font-bold">
              {[
                { id: 'all', label: t.common.all },
                { id: 'direct_installment', label: t.tracks.directInstallmentTag },
                { id: 'cash', label: t.tracks.cashSaleTag },
                { id: 'bank_settlement', label: t.tracks.bankSettlementTag }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setSaleTypeFilter(pill.id as any)}
                  className={`px-3 py-2 rounded-xl whitespace-nowrap transition flex-shrink-0 ${
                    saleTypeFilter === pill.id
                      ? 'bg-brand-navy text-white font-extrabold shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full md:w-auto px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
              >
                <option value="featured">{t.marketplace.sortFeatured}</option>
                <option value="price_asc">{t.marketplace.sortPriceAsc}</option>
                <option value="price_desc">{t.marketplace.sortPriceDesc}</option>
                <option value="mileage_asc">{t.marketplace.sortMileageAsc}</option>
              </select>
            </div>

          </div>

          {/* Make & Price Sliders */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center text-xs">
            <div>
              <label className="block font-bold text-slate-600 mb-1">{t.marketplace.filterAllMakes}:</label>
              <select
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="all">{isAr ? 'جميع الماركات' : 'All Makes'}</option>
                {makes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-600">{t.marketplace.maxPriceLabel}:</span>
                <span className="font-extrabold text-brand-green">{formatEGP(maxPrice)}</span>
              </div>
              <input
                type="range"
                min="400000"
                max="2500000"
                step="50000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand-green cursor-pointer"
              />
            </div>

            <div className="text-left sm:text-right text-xs font-bold text-slate-500 sm:col-span-2 md:col-span-1">
              {isAr ? (
                <>المعروض: <span className="text-brand-navy font-black">{filteredCars.length}</span> سيارة جاهزة للمعاينة</>
              ) : (
                <>{t.marketplace.foundCount}: <span className="text-brand-navy font-black">{filteredCars.length}</span> cars</>
              )}
            </div>
          </div>
        </div>

        {/* Cars Grid or Clean Empty State with Buyer Request Waitlist */}
        {cars.length === 0 ? (
          <div className="space-y-8 animate-fadeIn">
            {/* 1. Buyer Custom Car Request Banner */}
            <div className="bg-gradient-to-br from-brand-navy via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-white/10 shadow-xl max-w-4xl mx-auto">
              <div className="max-w-2xl mx-auto text-center space-y-3 mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/20 border border-brand-green/30 text-brand-green text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isAr ? 'خدمة حجز وفحص السيارات حسب الطلب' : 'On-Demand Car Sourcing & Inspection'}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {isAr ? 'لم تجد السيارة المناسبة لك حتى الآن؟' : 'Looking for a specific car that is not listed yet?'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isAr 
                    ? 'السيارات المعتمدة يتم حجزها وفحصها باستمرار. سجّل مواصفات سيارتك المطلوبة وميزانيتك، وسيقوم مستشار مخلصة بالتواصل معك فور توفرها وقبل طرحها في السوق العام.'
                    : 'Certified vehicles are frequently pre-booked. Register your desired car and budget, and our advisor will reach out as soon as a matching car is verified.'}
                </p>
              </div>

              {buyerRequestSuccess ? (
                <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-5 text-center text-emerald-300 text-xs font-bold space-y-1">
                  <p className="text-sm font-black">🎉 تم تسجيل طلبك واهتمامك بنجاح!</p>
                  <p>سيقوم فريق مخلصة بمراجعة قاعدة طلبات التسوية وإشعارك برقم هاتفك فور توافر السيارة ومطابقتها للفحص.</p>
                </div>
              ) : (
                <form onSubmit={handleBuyerRequestSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div>
                    <label className="block text-2xs font-bold text-slate-300 mb-1">
                      {isAr ? 'الماركة والموديل المطلوب' : 'Make & Model'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isAr ? 'مثال: نيسان صني 2022' : 'e.g. Nissan Sunny 2022'}
                      value={buyerMake}
                      onChange={(e) => setBuyerMake(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-300 mb-1">
                      {isAr ? 'مسار الشراء المفضل' : 'Purchase Method'}
                    </label>
                    <select
                      value={buyerTrack}
                      onChange={(e) => setBuyerTrack(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/20 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                    >
                      <option value="bank_settlement">{isAr ? 'تسوية مديونية وحظر بيع' : 'Bank Settlement'}</option>
                      <option value="direct_installment">{isAr ? 'تقسيط مباشر بدون بنوك' : 'Direct Installment'}</option>
                      <option value="cash">{isAr ? 'شراء كاش ملكية خالصة' : 'Cash (Clean Title)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-300 mb-1">
                      {isAr ? 'الميزانية / المقدم المتاح' : 'Budget / Down Payment'}
                    </label>
                    <input
                      type="text"
                      placeholder={isAr ? 'مثال: 450,000 ج.م' : 'e.g. 450,000 EGP'}
                      value={buyerBudget}
                      onChange={(e) => setBuyerBudget(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-300 mb-1">
                      {isAr ? 'رقم الواتساب للتواصل' : 'WhatsApp Number'}
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="01xxxxxxxxx"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4 pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-2xs text-slate-400">
                      {isAr ? '🔒 بياناتك محمية ولن تُستخدم إلا للتواصل معك بخصوص السيارات المطابقة.' : '🔒 Your info is strictly protected and used only to contact you about matching cars.'}
                    </span>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-slate-950 font-black text-xs transition shadow cursor-pointer"
                    >
                      {isAr ? 'أبلغني فور توفر سيارة مطابقة' : 'Notify Me When Available'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 2. Educational Settlement Showcase Examples */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border space-y-4 max-w-4xl mx-auto shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-extrabold text-brand-navy">
                    {isAr ? 'نماذج صفقات التسوية المعتمدة والتقسيط عبر مخلصة' : 'Verified Settlement & Installment Deal Models'}
                  </h4>
                  <p className="text-2xs text-slate-500">
                    {isAr ? 'أمثلة استرشادية توضح كيف تتم تسوية المديونيات واستلام المستندات الرسمية بالمسارات الثلاثة' : 'Illustrative verified deal benchmarks explaining legal and financial execution'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate?.('sell-wizard')}
                  className="px-4 py-2 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-slate-800 transition flex-shrink-0"
                >
                  {isAr ? 'اعرض سيارتك للبيع' : 'List Your Car'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Case 1: Bank Debt Settlement */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 space-y-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-2xs font-extrabold">
                    {isAr ? '🏦 مسار: تسوية بنكية وحظر بيع' : 'Bank Settlement'}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900">نيسان صني 2023 - سوبر صالون</h5>
                  <p className="text-2xs text-slate-600 leading-relaxed">
                    سعر السوق: 620,000 ج.م • مديونية البنك المسددة بخزينة CIB: 380,000 ج.م • تم استخراج مخالصة بنكية وفك الحظر بالمرور.
                  </p>
                </div>

                {/* Case 2: Direct Installment */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-2xs font-extrabold">
                    {isAr ? '🟡 مسار: تقسيط مباشر بدون بنوك' : 'Direct Installment'}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900">هيونداي إلنترا CN7 2022</h5>
                  <p className="text-2xs text-slate-600 leading-relaxed">
                    مقدم ميسر: 220,000 ج.م • قسط شهري: 9,500 ج.م لمدة 36 شهراً • ضمانات شيكات بنكية وحظر بيع بالرخصة بعقد معتمد.
                  </p>
                </div>

                {/* Case 3: Certified Cash Sale */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-2xs font-extrabold">
                    {isAr ? '🟢 مسار: بيع كاش ملكية خالصة' : 'Cash (Clean Title)'}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900">كيا سبورتاج 2021 - فئة ثانية</h5>
                  <p className="text-2xs text-slate-600 leading-relaxed">
                    سعر الكاش: 880,000 ج.م • فحص 150 نقطة فني وهندسي معتمد • نقل ملكية وتنازل رسمي فوري بالشهر العقاري.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-brand-border space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-brand-navy">{t.marketplace.noResultsTitle}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {t.marketplace.noResultsDesc}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedFinancing('all');
                setSelectedMake('all');
                setMaxPrice(2500000);
                setSaleTypeFilter('all');
              }}
              className="px-5 py-2 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-slate-800 transition"
            >
              {t.marketplace.resetFilters}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredCars.map((car) => (
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
        )}

      </div>
    </div>
  );
};

export default MarketplacePage;
