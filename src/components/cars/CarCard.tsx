import React from 'react';
import { Car } from '../../types';
import { ShieldCheck, Heart, MapPin, Gauge, Banknote } from 'lucide-react';

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
      className="group bg-white rounded-2xl border border-brand-border hover:border-brand-green/40 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
    >
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
          className="absolute top-3 left-3 p-2 rounded-full bg-white/80 backdrop-blur-md text-slate-700 hover:text-red-500 hover:bg-white shadow-sm transition"
          aria-label="حفظ في المفضلة"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Financing Status Badge */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {car.financingType === 'bank_loan' && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-navy/90 text-white backdrop-blur-md shadow-sm">
              {isAr ? 'حظر بيع بنكي' : 'Bank Lien'}
            </span>
          )}
          {car.financingType === 'consumer_finance' && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-600/90 text-white backdrop-blur-md shadow-sm">
              {isAr ? 'تقسيط تمويل استهلاكي' : 'Consumer Finance'}
            </span>
          )}
          {car.financingType === 'fully_owned' && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-700/90 text-white backdrop-blur-md shadow-sm">
              {isAr ? 'حرة بالكامل (كاش)' : 'Fully Owned'}
            </span>
          )}
          {car.financingType === 'personal_loan' && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-700/90 text-white backdrop-blur-md shadow-sm">
              {isAr ? 'رخصة حرة (قرض شخصي)' : 'Clean Title'}
            </span>
          )}

          {/* Inspection Badge */}
          {car.inspection.isInspected && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-green text-white shadow-sm flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{isAr ? `فحص ${car.inspection.score}%` : `Inspected ${car.inspection.score}%`}</span>
            </span>
          )}

          {/* Verified Official Documents Badge */}
          {car.documentsVerified && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-md flex items-center gap-1 border border-emerald-400/50">
              <ShieldCheck className="w-3 h-3 text-white" />
              <span>{isAr ? 'أوراق مفحوصة وموثقة' : 'Verified Docs'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        
        {/* Title & Trim */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-extrabold text-base text-brand-navy group-hover:text-brand-green transition-colors line-clamp-1">
              {car.make} {car.model} {car.year}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold flex-shrink-0">
              {car.year}
            </span>
          </div>
          <p className="text-xs text-brand-muted line-clamp-1 mt-0.5 font-medium">
            {car.trim} • {car.engineSize}
          </p>
        </div>

        {/* Specs Ribbon (Mileage, City, Inspection) */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 py-2 border-y border-slate-100">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />
            <span>{car.mileage.toLocaleString()} كم</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-green flex-shrink-0" />
            <span className="line-clamp-1">{car.city}</span>
          </div>
        </div>

        {/* Financing Breakdown Box (If Financed) */}
        {hasFinancing && car.financingDetails && (
          <div className="bg-brand-surface/60 rounded-xl p-2.5 text-[11px] border border-brand-border/60 space-y-1">
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-medium flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-brand-navy" />
                {car.financingDetails.providerNameAr}:
              </span>
              <span className="font-bold text-brand-navy">
                {formatEGP(car.financingDetails.outstandingPrincipal)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-[10px]">
              <span>القسط: {formatEGP(car.financingDetails.monthlyInstallment)}/شهر</span>
              <span>متبقي: {car.financingDetails.remainingMonths} شهر</span>
            </div>
          </div>
        )}

        {/* Pricing Area */}
        <div className="pt-1 flex items-end justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {isAr ? 'السعر المطلوب' : 'Asking Price'}
            </div>
            <div className="text-lg font-black text-brand-navy leading-tight">
              {formatEGP(car.askingPrice)}
            </div>
          </div>

          {buyerSaving > 0 && (
            <div className="text-left">
              <span className="inline-block px-2 py-1 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
