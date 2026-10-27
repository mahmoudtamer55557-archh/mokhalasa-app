import React from 'react';
import { Car } from '../../types';
import { ShieldCheck, Heart, MapPin, Gauge, Banknote, CheckCircle2, Sparkles, Star, Flame, Crown } from 'lucide-react';

interface CarCardProps {
  car: Car;
  onSelect: (car: Car) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (carId: string) => void;
  lang?: 'ar' | 'en';
}

export const CarCard: React.FC<CarCardProps> = ({
  car,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-EG', { maximumFractionDigits: 0 }).format(num) + (isAr ? ' ج.م' : ' EGP');
  };

  const hasFinancing = car.financingType !== 'fully_owned' && car.financingDetails;
  const buyerSaving = car.estimatedMarketValue - car.askingPrice;

  return (
    <div
      onClick={() => onSelect(car)}
      className={`group bg-white rounded-2xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative ${
        car.featured
          ? 'border-2 border-amber-400 shadow-sm hover:shadow-md'
          : 'border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Clean Unframed Header Text: "أفضل صفقة" as requested by user */}
      {car.featured && (
        <div className="px-4 py-2 flex items-center justify-between text-xs font-bold text-amber-700 bg-amber-50/30">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
            <span className="font-extrabold tracking-tight">أفضل صفقة</span>
          </div>
          {car.featuredRank && (
            <span className="text-3xs text-amber-600 font-bold font-mono">
              #{car.featuredRank}
            </span>
          )}
        </div>
      )}

      {/* Image Container with Badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={car.images[0]}
          alt={`${car.make} ${car.model} ${car.year}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(car.id);
          }}
          className="absolute top-3 left-3 p-2 rounded-full bg-white/90 backdrop-blur-md text-slate-700 hover:text-red-500 hover:bg-white shadow-sm transition z-10"
          aria-label="حفظ في المفضلة"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Financing Status Badge */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-10">
          {(car.saleType === 'direct_installment' || car.financingType === 'direct_installment' || car.directInstallment) && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-sm">
              {isAr ? 'تقسيط مباشر' : 'Direct Installment'}
            </span>
          )}
          {(car.saleType === 'cash' || car.financingType === 'fully_owned' || car.vehicleStatus === 'cash_only') && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm">
              {isAr ? 'بيع كاش' : 'Cash Sale'}
            </span>
          )}
          {car.financingType === 'bank_loan' && car.saleType !== 'direct_installment' && car.saleType !== 'cash' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/90 text-white shadow-sm">
              {isAr ? 'تسوية بنكية' : 'Bank Lien'}
            </span>
          )}
          {car.financingType === 'consumer_finance' && car.saleType !== 'direct_installment' && car.saleType !== 'cash' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-600/90 text-white shadow-sm">
              {isAr ? 'تمويل استهلاكي' : 'Consumer Finance'}
            </span>
          )}

          {/* Inspection Badge */}
          {car.inspection.isInspected && (
            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-600 text-white shadow-sm flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{isAr ? `فحص ${car.inspection.score}%` : `Inspected ${car.inspection.score}%`}</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Content (Spacious, prominent and clearly readable) */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-3.5">
        
        {/* Title & Trim */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
              {car.make} {car.model}
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold flex-shrink-0">
              {car.year}
            </span>
          </div>
          <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-medium">
            {car.trim} • {car.engineSize}
          </p>
        </div>

        {/* Specs Ribbon (Mileage, City, Inspection) */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 py-2.5 border-y border-slate-100 font-medium">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{car.mileage.toLocaleString()} {isAr ? 'كم' : 'KM'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="line-clamp-1">{car.city}</span>
          </div>
        </div>

        {/* Direct Installment Highlight Box */}
        {car.directInstallment && (
          <div className="bg-amber-50/70 rounded-xl p-3 text-xs border border-amber-200/80 space-y-1">
            <div className="flex justify-between items-center text-amber-950 font-bold">
              <span>{isAr ? 'أقل مقدم مطلوب:' : 'Down Payment:'}</span>
              <span className="font-extrabold text-amber-900 font-mono">
                {formatEGP(car.directInstallment.downPayment)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 text-2xs">
              <span>{isAr ? `القسط: ${formatEGP(car.directInstallment.monthlyInstallment)}/شهر` : `Installment: ${formatEGP(car.directInstallment.monthlyInstallment)}/mo`}</span>
              <span>{isAr ? `المدة: ${car.directInstallment.installmentMonths} شهر` : `Period: ${car.directInstallment.installmentMonths} mos`}</span>
            </div>
          </div>
        )}

        {/* Cash Sale Clean Title Box */}
        {(car.saleType === 'cash' || car.financingType === 'fully_owned') && !car.directInstallment && (
          <div className="bg-emerald-50/70 rounded-xl p-2.5 text-xs border border-emerald-200/70 flex items-center gap-2 text-emerald-800 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{isAr ? 'ملكية حرة — جاهزة للتسليم والتنازل الفوري' : 'Clean title, immediate handover'}</span>
          </div>
        )}

        {/* Bank Financing Breakdown Box (If Bank Financed) */}
        {hasFinancing && car.financingDetails && !car.directInstallment && car.saleType !== 'cash' && (
          <div className="bg-slate-50 rounded-xl p-3 text-xs border border-slate-200 space-y-1">
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-medium flex items-center gap-1">
                <Banknote className="w-4 h-4 text-slate-700" />
                {isAr ? car.financingDetails.providerNameAr : (car.financingDetails.providerName || car.financingDetails.providerNameAr)}:
              </span>
              <span className="font-bold text-slate-900 font-mono">
                {formatEGP(car.financingDetails.outstandingPrincipal)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-2xs">
              <span>{isAr ? `القسط: ${formatEGP(car.financingDetails.monthlyInstallment)}/شهر` : `Installment: ${formatEGP(car.financingDetails.monthlyInstallment)}/mo`}</span>
              <span>{isAr ? `متبقي: ${car.financingDetails.remainingMonths} شهر` : `Remaining: ${car.financingDetails.remainingMonths} mos`}</span>
            </div>
          </div>
        )}

        {/* Pricing Area */}
        <div className="pt-2 flex items-end justify-between border-t border-slate-100">
          <div>
            <div className="text-2xs text-slate-400 font-bold uppercase tracking-wider">
              {isAr ? 'السعر المطلوب' : 'Asking Price'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono leading-tight">
              {formatEGP(car.askingPrice)}
            </div>
          </div>

          {buyerSaving > 0 && (
            <div className="text-left">
              <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {isAr ? `وفر ${formatEGP(buyerSaving)}` : `Save ${formatEGP(buyerSaving)}`}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CarCard;
