import React, { useState, useMemo } from 'react';
import { Car } from '../types';
import CarCard from '../components/cars/CarCard';
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

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFinancing, setSelectedFinancing] = useState<string>('all');
  const [selectedMake, setSelectedMake] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(2000000);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'mileage_asc'>('featured');

  // Exclude any ordinary cash cars - Mokhalasa only shows financed / distressed / pending release vehicles
  const eligibleCars = useMemo(() => {
    return cars.filter(c => c.financingType !== 'fully_owned' || c.vehicleStatus === 'loan_paid_pending_clearance');
  }, [cars]);

  // Available makes
  const makes = useMemo(() => {
    return Array.from(new Set(eligibleCars.map(c => c.make)));
  }, [eligibleCars]);

  // Filtered and sorted cars
  const filteredCars = useMemo(() => {
    return eligibleCars
      .filter((car) => {
        const matchSearch =
          car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.trim.toLowerCase().includes(searchTerm.toLowerCase());

        const matchFinancing =
          selectedFinancing === 'all' || car.financingType === selectedFinancing;

        const matchMake = selectedMake === 'all' || car.make === selectedMake;
        const matchPrice = car.askingPrice <= maxPrice;

        return matchSearch && matchFinancing && matchMake && matchPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.askingPrice - b.askingPrice;
        if (sortBy === 'price_desc') return b.askingPrice - a.askingPrice;
        if (sortBy === 'mileage_asc') return a.mileage - b.mileage;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [eligibleCars, searchTerm, selectedFinancing, selectedMake, maxPrice, sortBy]);

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-EG', { maximumFractionDigits: 0 }).format(num) + (isAr ? ' ج.م' : ' EGP');
  };

  return (
    <div className="min-h-screen bg-brand-bg py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Marketplace Header — Specialized Distressed Positioning */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-brand-green text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>فرص سيارات التسوية البنكية المعتمدة</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">
              سيارات معتمدة للبيع والتخارج المالي
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              جميع السيارات المعروضة محملة بأقساط أو حظر بيع بنكي وتمت مراجعة مديونيتها وفحصها هندسياً. يتم الإيداع النقدي مباشرة في خزينة البنك الدائن تحت إشراف مخلصة لضمان فك الحظر ونقل الملكية.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2 flex-shrink-0 max-w-xs">
            <div className="flex items-center gap-1.5 font-bold text-brand-navy">
              <Banknote className="w-4 h-4 text-brand-green" />
              <span>إشراف مخلصة المباشر:</span>
            </div>
            <p className="text-3xs text-slate-500 leading-relaxed">
              لا يتم التواصل مع البائعين مباشرة لحمايتهم؛ يتولى فريق مخلصة تنسيق موعد المعاينة، وتجهيز العقد الثلاثي، وإجراءات البنك.
            </p>
          </div>
        </div>

        {/* Search & Quick Filters Bar */}
        <div className="bg-white rounded-2xl p-4 border border-brand-border shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بالماركة، الموديل، الحي، أو الفئة..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-green bg-slate-50"
              />
            </div>

            {/* Quick Financing Type Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 text-xs font-bold">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'bank_loan', label: 'قروض بنكية (حظر بيع)' },
                { id: 'consumer_finance', label: 'تمويل استهلاكي (فاليو / كونتكت)' },
                { id: 'personal_loan', label: 'قروض شخصية حرة' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setSelectedFinancing(pill.id)}
                  className={`px-3 py-2 rounded-xl whitespace-nowrap transition ${
                    selectedFinancing === pill.id
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
                <option value="featured">الترتيب: المميز أولاً</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
                <option value="mileage_asc">العداد: الأقل استهلاكاً</option>
              </select>
            </div>

          </div>

          {/* Make & Price Sliders */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center text-xs">
            <div>
              <label className="block font-bold text-slate-600 mb-1">الماركة (الشركة المصنعة):</label>
              <select
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="all">جميع الماركات</option>
                {makes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-600">الحد الأقصى للسعر:</span>
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
              المعروض: <span className="text-brand-navy font-black">{filteredCars.length}</span> سيارة تسوية جاهزة للمعاينة
            </div>
          </div>
        </div>

        {/* Cars Grid or Clean Empty State (Phase 11 Compliance) */}
        {cars.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-brand-border space-y-5 animate-fadeIn max-w-xl mx-auto shadow-card">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-brand-green flex items-center justify-center mx-auto shadow-sm">
              <CarIcon className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-brand-navy">لا توجد سيارات معروضة للبيع حالياً</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                المعرض جاهز ونظيف تماماً لاستقبال إعلانات السيارات المعتمدة. كن أول من يعرض سيارته للبيع والتخارج من الأقساط بأمان وشفافية عبر مخلصة.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center">
              <button
                type="button"
                onClick={() => onNavigate?.('sell-wizard')}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition"
              >
                اعرض سيارتك للبيع الآن
              </button>
            </div>
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-brand-border space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-brand-navy">لا توجد سيارات مطابقة لبحثك حالياً</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              جرب تغيير معايير التصفية أو مسح البحث، أو تواصل مع فريق مخلصة لإبلاغك فور إدراج سيارة تناسب ميزانيتك.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedFinancing('all');
                setSelectedMake('all');
                setMaxPrice(2000000);
              }}
              className="px-5 py-2 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-slate-800 transition"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
