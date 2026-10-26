import React, { useState } from 'react';
import { Car, BuyerInquiryRecord, CustomerUser } from '../types';
import { listingService } from '../services/listingService';
import { getPhoneValidationError, normalizeEgyptianPhone } from '../utils/phoneValidator';
import { 
  ArrowRight, ShieldCheck, Heart, Share2, MapPin, Gauge, 
  Banknote, FileCheck, CheckCircle2, 
  PhoneCall, ChevronLeft, ChevronRight,
  AlertTriangle, Lock, FileText, Tag, Send, Clock
} from 'lucide-react';

interface CarDetailPageProps {
  car: Car;
  onBack: () => void;
  onBookInspection?: (car: Car) => void;
  onAddBuyerInquiry?: (inquiry: BuyerInquiryRecord) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (carId: string) => void;
  customerUser?: CustomerUser | null;
  onOpenLogin?: () => void;
  lang?: 'ar' | 'en';
}

export const CarDetailPage: React.FC<CarDetailPageProps> = ({
  car,
  onBack,
  onBookInspection,
  onAddBuyerInquiry,
  isFavorite = false,
  onToggleFavorite,
  customerUser,
  onOpenLogin,
  lang = 'ar'
}) => {
  const isAr = lang === 'ar';
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [offerMode, setOfferMode] = useState<'accept_asking' | 'propose_price'>('accept_asking');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [submissionSuccessMsg, setSubmissionSuccessMsg] = useState<string | null>(null);
  
  // Buyer Inquiry Form State
  const [buyerName, setBuyerName] = useState(customerUser?.name || '');
  const [buyerPhone, setBuyerPhone] = useState(customerUser?.phone || '');
  const [offeredPrice, setOfferedPrice] = useState<number>(car.askingPrice);
  const [purchaseIntent, setPurchaseIntent] = useState<'cash_at_bank' | 'need_new_financing' | 'negotiate'>('cash_at_bank');
  const [preferredContactTime, setPreferredContactTime] = useState('مساءً (من 5 إلى 9 مساءً)');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [acceptedDirectDepositRule, setAcceptedDirectDepositRule] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-EG', { maximumFractionDigits: 0 }).format(num) + (isAr ? ' ج.م' : ' EGP');
  };

  const hasFinancing = car.financingType !== 'fully_owned' && car.financingDetails;
  const buyerSaving = car.estimatedMarketValue - car.askingPrice;
  const commission = Math.round(car.askingPrice * 0.015);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedDirectDepositRule) {
      alert(isAr ? 'يرجى تأكيد الموافقة على بروتوكول الإيداع البنكي المباشر للمتابعة.' : 'Please confirm agreement to direct bank deposit protocol.');
      return;
    }

    if (!customerUser) {
      alert(isAr ? 'تقديم عروض الشراء والتفاوض يتطلب تسجيل الدخول بحساب معتمد.' : 'Submitting an offer requires an authenticated account.');
      if (onOpenLogin) onOpenLogin();
      return;
    }

    const rawPhone = buyerPhone.trim() || customerUser.phone || '';
    const phoneErr = getPhoneValidationError(rawPhone);
    if (phoneErr) {
      alert(phoneErr);
      return;
    }
    const cleanBuyerPhone = normalizeEgyptianPhone(rawPhone);

    setIsSubmittingOffer(true);
    const finalOfferedPrice = offerMode === 'accept_asking' ? car.askingPrice : Number(offeredPrice) || car.askingPrice;

    const newInquiry: BuyerInquiryRecord = {
      id: `inq-${Date.now()}`,
      caseReference: car.id || 'MK-CASE-2026-001',
      carId: car.id,
      carTitle: `${car.make} ${car.model} ${car.year}`,
      buyerName: buyerName.trim() || customerUser.name || 'مشتري مهتم',
      buyerPhone: cleanBuyerPhone,
      purchaseIntent: purchaseIntent === 'cash_at_bank' ? 'direct_bank_settlement' : purchaseIntent === 'need_new_financing' ? 'new_financing_requested' : 'cash_full',
      offeredPrice: finalOfferedPrice,
      preferredContactTime,
      message: buyerNotes || (isAr ? 'مهتم بالمعاينة والتسوية البنكية المباشرة.' : 'Interested in inspection and bank payoff.'),
      status: 'new',
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (onAddBuyerInquiry) {
      onAddBuyerInquiry(newInquiry);
    }

    // Submit structured offer through listingService
    const res = await listingService.submitPurchaseOffer({
      listingId: car.id,
      carId: car.id,
      carTitle: `${car.make} ${car.model} ${car.year}`,
      caseReference: car.id || 'MK-CASE-2026-001',
      buyerName: buyerName.trim() || customerUser.name || 'مشتري مهتم',
      buyerPhone: cleanBuyerPhone,
      buyerUserId: customerUser.id,
      offerType: offerMode === 'accept_asking' ? 'asking_price' : 'negotiated',
      offeredPrice: finalOfferedPrice,
      askingPrice: car.askingPrice,
      paymentPreference: purchaseIntent,
      preferredContactTime,
      notes: buyerNotes
    });

    setIsSubmittingOffer(false);
    setSubmissionSuccessMsg(res.message);
    setInquirySubmitted(true);

    setTimeout(() => {
      setShowInquiryModal(false);
      setInquirySubmitted(false);
      setSubmissionSuccessMsg(null);
      setBuyerName('');
      setBuyerPhone('');
      setBuyerNotes('');
    }, 3200);
  };

  const whatsappInquiryMessage = encodeURIComponent(
    `مرحباً فريق مخلصة، أنا مهتم بشراء سيارة ${car.make} ${car.model} ${car.year} المعروضة على المنصة بسعر ${car.askingPrice.toLocaleString()} ج.م (كود السيارة: ${car.id}). أرجو التنسيق للمعاينة وفحص أوراق البنك الدائن وفق بروتوكول مخلصة.`
  );

  return (
    <div className="min-h-screen bg-brand-bg py-8 px-4 sm:px-6 lg:px-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Navigation & Breadcrumbs */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-navy hover:text-brand-green transition"
          >
            <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            <span>{isAr ? 'العودة إلى سوق السيارات' : 'Back to Car Marketplace'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-brand-border">
              كود الحالة: <strong className="text-brand-navy font-mono">{car.id.toUpperCase()}</strong>
            </span>
            <button
              onClick={() => onToggleFavorite?.(car.id)}
              className="p-2 rounded-xl bg-white border border-brand-border text-slate-700 hover:text-red-500 shadow-sm transition"
              title="حفظ السيارة"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: `${car.make} ${car.model}`, url: window.location.href });
                }
              }}
              className="p-2 rounded-xl bg-white border border-brand-border text-slate-700 hover:text-brand-navy shadow-sm transition"
              title="مشاركة"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Zero Direct Seller Contact Safety Notice Banner */}
        <div className="bg-brand-navy/5 border border-brand-navy/15 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-navy text-white flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-brand-green" />
            </div>
            <div>
              <span className="font-extrabold text-brand-navy block">
                {isAr ? 'معاملة محمية ومنسقة بالكامل عبر منصة مخلصة' : 'Fully Managed & Protected by Mokhalasa'}
              </span>
              <p className="text-slate-600 text-[11px]">
                {isAr
                  ? 'لحماية الطرفين ومنع العشوائية، تتولى مخلصة تدقيق أوراق البنك، ترتيب المعاينة، وتنسيق إيداع التسوية البنكية مباشرة بفرع البنك الدائن.'
                  : 'To protect both parties, Mokhalasa verifies bank quotes, schedules inspections, and coordinates direct bank payoff.'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold self-start sm:self-auto flex-shrink-0">
            {isAr ? 'صفر احتجاز أموال' : 'Zero Fund Custody'}
          </span>
        </div>

        {/* Hero Section: Gallery & Primary Buy Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Gallery & Condition (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Main Stage Image */}
            <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-slate-900 border border-brand-border shadow-card group">
              <img
                src={car.images[activeImageIndex] || car.images[0]}
                alt={`${car.make} ${car.model}`}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Prev / Next controls */}
              {car.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : car.images.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev < car.images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Badge Overlay */}
              <div className="absolute top-4 right-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-navy/90 text-white backdrop-blur-md flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-brand-green" />
                  <span>{car.financingDetails?.providerNameAr || 'حظر بيع بنكي'}</span>
                </span>
                {car.inspection.isInspected ? (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-brand-green text-white shadow-sm flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>فحص معتمد {car.inspection.score}%</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-white backdrop-blur-md">
                    فحص فني ميداني معتمد عند التعاقد
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails Row */}
            {car.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {car.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                      activeImageIndex === idx ? 'border-brand-green shadow-md scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Seller Story & Honest Condition Disclosures */}
            <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-green" />
                  <div>
                    <h3 className="font-extrabold text-sm text-brand-navy">
                      {isAr ? 'الإفصاح الصريح لحالة السيارة من البائع' : 'Seller Condition Story & Disclosures'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isAr ? 'شفافية كاملة قبل المعاينة الميدانية' : 'Full transparency prior to physical inspection'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {car.sellerType}
                </span>
              </div>

              {/* Condition Narrative */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs leading-relaxed text-slate-700">
                <span className="font-bold text-brand-navy block mb-1">
                  {isAr ? 'قصة السيارة وحالتها الحقيقية:' : 'Vehicle Narrative:'}
                </span>
                <p>
                  {car.sellerConditionStory || car.description || 'سيارة تم الحفاظ عليها بصيانات منتظمة، وتباع بداعي تصفية الالتزامات والأقساط البنكية المقررة.'}
                </p>
              </div>

              {/* Disclosed Defects / Notes */}
              {car.disclosedProblems && car.disclosedProblems.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>{isAr ? 'الملاحظات والعيوب المفصح عنها بوضوح:' : 'Disclosed Defects:'}</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {car.disclosedProblems.map((prob, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{prob}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>لم يُفصح البائع عن أي حوادث سابقة أو أعطال جسيمة، والسيارة تخضع لفحص شامل قبل التوثيق.</span>
                </div>
              )}
            </div>

            {/* Inspection Card (150 Points) */}
            <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                    {car.inspection.isInspected ? `${car.inspection.score}%` : '150'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-brand-navy">
                      {isAr ? 'تقرير الفحص الفني المعتمد (150 نقطة)' : '150-Point Certified Inspection'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {car.inspection.isInspected 
                        ? `تم الفحص بواسطة: ${car.inspection.inspectorName}`
                        : 'فحص إلزامي محايد يُجرى بمركز معتمد قبل اعتماد الشراء وإيداع التسوية'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {car.inspection.isInspected ? 'معتمد وموثق' : 'مشمول بالخدمة'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'حالة المحرك' : 'Engine'}</span>
                  <span className="font-bold text-slate-800">{car.inspection.engineCondition}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'ناقل الحركة' : 'Gearbox'}</span>
                  <span className="font-bold text-slate-800">{car.inspection.transmissionCondition}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'الدهان الخارجي' : 'Body Paint'}</span>
                  <span className="font-bold text-slate-800">{car.inspection.paintCondition}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'الشاسيه والدواخل' : 'Chassis'}</span>
                  <span className="font-bold text-emerald-700">{car.inspection.chassisStatus}</span>
                </div>
              </div>

              {car.inspection.notes && (
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  <span className="font-bold text-brand-navy ml-1">{isAr ? 'ملاحظات الفاحص:' : 'Inspector Notes:'}</span>
                  {car.inspection.notes}
                </p>
              )}

              {onBookInspection && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onBookInspection(car)}
                    className="text-xs font-bold text-brand-green hover:text-emerald-700 transition flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-200"
                  >
                    <FileCheck className="w-4 h-4 text-brand-green" />
                    <span>{isAr ? 'طلب حجز فحص فني معتمد لهذه السيارة' : 'Request Certified Inspection'}</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Buy Box & Financing Card (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Title & Pricing Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-card space-y-5">
              
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h1 className="text-2xl font-black text-brand-navy">
                    {car.make} {car.model} {car.year}
                  </h1>
                  <span className="px-2.5 py-1 rounded-lg bg-brand-surface text-brand-navy font-bold text-xs">
                    {car.year}
                  </span>
                </div>
                <p className="text-xs text-brand-muted mt-1 font-medium">
                  {car.trim} • {car.engineSize} • {car.transmission}
                </p>
              </div>

              {/* Price Row */}
              <div className="p-4 rounded-2xl bg-brand-surface/70 border border-brand-border space-y-2">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {isAr ? 'السعر الإجمالي المطلوب' : 'Agreed Asking Price'}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-brand-navy">
                      {formatEGP(car.askingPrice)}
                    </span>
                  </div>

                  {buyerSaving > 0 && (
                    <div className="text-left">
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {isAr ? `وفر ${formatEGP(buyerSaving)}` : `Save ${formatEGP(buyerSaving)}`}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        متوسط السوق: {formatEGP(car.estimatedMarketValue)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Installment Plan Box */}
              {(car.directInstallment || car.saleType === 'direct_installment') && (
                <div className="bg-amber-50/80 rounded-2xl p-4.5 border border-amber-200/90 text-xs space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-amber-200">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-amber-600" />
                      <span>{isAr ? 'نظام التقسيط المباشر (بدون بنك):' : 'Direct Installment Plan:'}</span>
                    </span>
                    <span className="bg-amber-100 text-amber-900 font-black px-2.5 py-0.5 rounded-full text-[10px]">
                      {car.directInstallment?.sellerType === 'showroom' ? (isAr ? 'معرض سيارات معتمد' : 'Certified Showroom') : (isAr ? 'مالك مباشر' : 'Direct Owner')}
                    </span>
                  </div>

                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-amber-100">
                      <span className="font-bold text-amber-950">{isAr ? 'أقل مقدم مطلوب (Down Payment):' : 'Down Payment:'}</span>
                      <span className="font-black text-amber-800 text-sm">
                        {formatEGP(car.directInstallment?.downPayment || Math.round(car.askingPrice * 0.3))}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-white p-2 rounded-xl border border-amber-100">
                        <span className="text-slate-400 block text-[10px]">{isAr ? 'القسط الشهري' : 'Monthly Installment'}</span>
                        <span className="font-black text-slate-800">
                          {formatEGP(car.directInstallment?.monthlyInstallment || 0)}/شهر
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-amber-100">
                        <span className="text-slate-400 block text-[10px]">{isAr ? 'مدة التقسيط' : 'Duration'}</span>
                        <span className="font-black text-slate-800">
                          {car.directInstallment?.installmentMonths || 36} شهراً
                        </span>
                      </div>
                    </div>

                    {/* Guarantees */}
                    {car.directInstallment?.requiredGuarantees && car.directInstallment.requiredGuarantees.length > 0 && (
                      <div className="pt-1 space-y-1">
                        <span className="text-3xs font-bold text-slate-500 block">الضمانات المطلوبة من المشتري:</span>
                        <div className="flex flex-wrap gap-1">
                          {car.directInstallment.requiredGuarantees.map((g, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-100/70 text-amber-950 text-3xs font-bold border border-amber-200">
                              ✓ {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-100/50 border border-amber-200 text-[10.5px] text-amber-900 leading-relaxed">
                    💡 <strong>ميزة مباشرة:</strong> لا يشترط استعلام بنكي أو مفردات مرتب (HR Letter). الاتفاق يتم مباشرة مع المعرض/البائع بشيكات بنكية أو إيصالات أمانة معتمدة.
                  </div>
                </div>
              )}

              {/* Cash Sale Box */}
              {(car.saleType === 'cash' || car.financingType === 'fully_owned') && !car.directInstallment && (
                <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>سيارة ملكية خالصة حرة (بيع كاش)</span>
                  </div>
                  <p className="text-2xs text-slate-600 leading-relaxed">
                    السيارة خالية من أي أقساط أو حظر بيع بالرخصة. البيع نقداً بالكامل، والتنازل فوري للمشتري بالشهر العقاري ونقل القيد بوحدة المرور دون أي انتظار بنكي.
                  </p>
                </div>
              )}

              {/* Financing Transparency Box */}
              {hasFinancing && car.financingDetails && !car.directInstallment && car.saleType !== 'cash' && (
                <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200 text-xs space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-bold text-brand-navy flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-brand-green" />
                      <span>{isAr ? 'موقف المديونية والتسوية البنكية:' : 'Bank Settlement Breakdown:'}</span>
                    </span>
                    <span className="text-brand-green font-extrabold text-[11px]">
                      {car.financingDetails.providerNameAr}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>{isAr ? 'أصل المديونية القائمة المقدرة:' : 'Outstanding Principal:'}</span>
                      <span className="font-bold text-brand-navy">{formatEGP(car.financingDetails.outstandingPrincipal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{isAr ? 'عمولة السداد المعجل ورسوم فك الحظر:' : 'Prepayment & Release Fees:'}</span>
                      <span className="font-bold text-slate-700">
                        +{formatEGP(car.financingDetails.earlySettlementFee + car.financingDetails.releaseFee)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{isAr ? 'عمولة المنصة الإدارية (1.5%):' : 'Platform Fee (1.5%):'}</span>
                      <span className="font-bold text-brand-green">
                        {formatEGP(commission)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-200 font-extrabold text-brand-navy">
                      <span>{isAr ? 'إجمالي تسوية البنك (تودع بفرع البنك مباشرة):' : 'Total Bank Payoff (Direct to Branch):'}</span>
                      <span className="text-sm text-red-600">{formatEGP(car.financingDetails.totalSettlementRequired)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold pt-1">
                      <span>{isAr ? 'صافي ما يستلمه البائع بعد السداد:' : 'Net to Seller upon Transfer:'}</span>
                      <span>{formatEGP(car.financingDetails.sellerNetProceeds)}</span>
                    </div>
                  </div>

                  {/* Direct Payoff Rule Box */}
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-900 leading-relaxed space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isAr ? 'بروتوكول الشراء المباشر والآمن:' : 'Direct Payoff Protocol:'}</span>
                    </span>
                    <p className="text-[10px]">
                      {isAr
                        ? 'يقوم المشتري بإيداع مبلغ تسوية البنك مباشرة في حساب القرض بالفرع واستلام إشعار سداد رسمي باسم المقترض، وتتولى مخلصة تسليم مخالصة البنك ونقل الملكية بالشهر العقاري.'
                        : 'Buyer deposits the settlement directly into the loan account at the branch with an official cashier receipt.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Gauge className="w-4 h-4 text-brand-green flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'العداد' : 'Mileage'}</span>
                    <span className="font-bold text-slate-800">{car.mileage.toLocaleString()} كم</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <MapPin className="w-4 h-4 text-brand-green flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'المرور والمدينة' : 'Location'}</span>
                    <span className="font-bold text-slate-800 truncate block">{car.city}</span>
                  </div>
                </div>
              </div>

              {/* Primary Call to Action Buttons (TWO DISTINCT OFFER OPTIONS - PHASE 8 & 9) */}
              <div className="space-y-2.5 pt-2">
                {/* 1. Accept Asking Price Button */}
                <button
                  type="button"
                  onClick={() => {
                    setOfferMode('accept_asking');
                    setOfferedPrice(car.askingPrice);
                    setShowInquiryModal(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-brand-green hover:bg-emerald-600 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>شراء بالسعر المطلوب ({formatEGP(car.askingPrice)})</span>
                </button>

                {/* 2. Propose Negotiated Offer Button */}
                <button
                  type="button"
                  onClick={() => {
                    setOfferMode('propose_price');
                    setOfferedPrice(Math.round(car.askingPrice * 0.95));
                    setShowInquiryModal(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-white border border-slate-300 hover:border-brand-green hover:bg-slate-50 text-brand-navy font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Tag className="w-3.5 h-3.5 text-brand-green" />
                  <span>تقديم عرض سعر مقترح للتفاوض</span>
                </button>

                {/* Direct WhatsApp Action */}
                <a
                  href={`https://wa.me/201018898144?text=${whatsappInquiryMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-2xs transition flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'تواصل مع فريق مخلصة عبر واتساب (مباشر)' : 'Chat with Mokhalasa via WhatsApp'}</span>
                </a>

                <p className="text-[10px] text-slate-400 text-center">
                  * المعاملة تدار مركزياً من مستشاري مخلصة لحماية حقوق الطرفين والبنك.
                </p>
              </div>

            </div>

            {/* Seller Credibility Card */}
            <div className="bg-white rounded-3xl p-5 border border-brand-border shadow-sm flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-surface text-brand-navy flex items-center justify-center font-bold">
                  {car.sellerType === 'مالك أول' ? '1st' : '2nd'}
                </div>
                <div>
                  <span className="font-bold text-brand-navy block">{car.sellerType}</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    رخصة سارية حتى {car.licenseValidityMonths} شهر • {car.trafficDepartment}
                  </span>
                </div>
              </div>

              {car.documentsVerified ? (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-black flex items-center gap-1.5 text-xs shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>أوراق رسمية مفحوصة وموثقة إدارياً (مضمونة بنكياً وقانونياً)</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 font-bold flex items-center gap-1 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>بانتظار توثيق المستندات الرسمية</span>
                </span>
              )}
            </div>

            {/* 4-Step Settlement Process Summary */}
            <div className="bg-white rounded-3xl p-5 border border-brand-border shadow-sm space-y-2.5 text-xs">
              <span className="font-extrabold text-brand-navy block">
                {isAr ? 'خطوات شراء هذه السيارة عبر مخلصة:' : 'Purchase Steps with Mokhalasa:'}
              </span>
              <div className="space-y-2 text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-brand-navy text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>معاينة فنية شاملة وتأكيد رقم الشاسيه والموتور بمركز معتمد.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-brand-navy text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>توقيع اتفاق التخارج الثلاثي المشروط لضمان حقوق كافة الأطراف.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-brand-navy text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>إيداع مبلغ التسوية مباشرة في البنك الدائن باسم حساب القرض.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-brand-navy text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <span>استلام خطاب فك الحظر، ونقل الملكية الرسمي بالشهر العقاري.</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Structured Buyer Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-elevated border border-slate-100 space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-brand-navy">
                  {isAr ? 'تسجيل الاهتمام بشراء السيارة' : 'Express Interest in Vehicle'}
                </h3>
                <span className="text-[11px] text-brand-green font-bold block">
                  عبر مستشار الصفقات في مخلصة
                </span>
              </div>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {inquirySubmitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-brand-green mx-auto animate-bounce" />
                <h4 className="font-black text-brand-navy text-sm">
                  {isAr ? 'تم استلام وتوثيق عرض الشراء بنجاح!' : 'Offer Submitted Successfully!'}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {submissionSuccessMsg || (isAr
                    ? 'سيقوم مستشار الصفقات المعين في مخلصة بالتواصل معك هاتفياً خلال ساعتين عمل لترتيب موعد المعاينة وتدقيق أوراق البنك الدائن.'
                    : 'Our transaction coordinator will contact you shortly to schedule an inspection.')}
                </p>
                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600">
                  كود الحالة المرجعي: <strong className="font-mono text-brand-navy">{car.id.toUpperCase()}</strong>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3.5 text-xs">
                {/* Offer Mode Toggle Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setOfferMode('accept_asking');
                      setOfferedPrice(car.askingPrice);
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition ${
                      offerMode === 'accept_asking'
                        ? 'bg-brand-green text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    السعر المطلوب
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOfferMode('propose_price');
                      setOfferedPrice(Math.round(car.askingPrice * 0.95));
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition ${
                      offerMode === 'propose_price'
                        ? 'bg-brand-navy text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    عرض تفاوضي
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">السيارة المختارة:</span>
                  <span className="font-bold text-brand-navy block text-sm">{car.make} {car.model} {car.year}</span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-600">السعر المطلوب: {formatEGP(car.askingPrice)}</span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      عرضك: {formatEGP(offerMode === 'accept_asking' ? car.askingPrice : offeredPrice)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    {isAr ? 'اسمك بالكامل:' : 'Full Name:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="مثال: د. سامح فوزي"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    {isAr ? 'رقم الهاتف (واتساب):' : 'Phone Number:'}
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none text-right font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">
                      {isAr ? 'قيمة العرض المالي:' : 'Offer Amount:'}
                    </label>
                    <input
                      type="number"
                      disabled={offerMode === 'accept_asking'}
                      value={offerMode === 'accept_asking' ? car.askingPrice : offeredPrice}
                      onChange={(e) => setOfferedPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">
                      {isAr ? 'وقت الاتصال المفضل:' : 'Preferred Time:'}
                    </label>
                    <select
                      value={preferredContactTime}
                      onChange={(e) => setPreferredContactTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
                    >
                      <option value="صباحاً (من 9 إلى 1 ظهراً)">صباحاً (9 ص - 1 م)</option>
                      <option value="ظهراً (من 1 إلى 5 مساءً)">ظهراً (1 م - 5 م)</option>
                      <option value="مساءً (من 5 إلى 9 مساءً)">مساءً (5 م - 9 م)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    {isAr ? 'طريقة السداد المفضلة:' : 'Payment Preference:'}
                  </label>
                  <select 
                    value={purchaseIntent}
                    onChange={(e) => setPurchaseIntent(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
                  >
                    <option value="cash_at_bank">{isAr ? 'سداد مباشر بحساب قرض البائع كاش بالبنك (موصى به)' : 'Direct Bank Payoff (Cash)'}</option>
                    <option value="need_new_financing">{isAr ? 'أرغب في تقديم طلب تمويل جديد' : 'Need New Financing'}</option>
                    <option value="negotiate">{isAr ? 'كاش بالكامل عند الشهر العقاري' : 'Full Cash at Notary'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    {isAr ? 'ملاحظات أو استفسارات إضافية:' : 'Additional Notes:'}
                  </label>
                  <textarea
                    rows={2}
                    value={buyerNotes}
                    onChange={(e) => setBuyerNotes(e.target.value)}
                    placeholder="أي استفسار عن حالة السيارة أو ميعاد المعاينة..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-green focus:outline-none resize-none"
                  />
                </div>

                {/* Zero-Custody Rule Checkbox */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedDirectDepositRule}
                      onChange={(e) => setAcceptedDirectDepositRule(e.target.checked)}
                      className="mt-0.5 rounded text-brand-green focus:ring-brand-green accent-brand-green w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[11px] text-emerald-950 font-medium leading-relaxed">
                      أوافق على أن التنسيق يتم حصراً عبر فريق مخلصة، وأن سداد مديونية البنك يتم بإيداع بنكي مباشر في الفرع المانح للقرض.
                    </span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!acceptedDirectDepositRule || isSubmittingOffer}
                    className="w-full py-3.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingOffer ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري توثيق وإرسال العرض...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{isAr ? 'إرسال عرض الشراء لمستشار مخلصة' : 'Submit Offer to Mokhalasa'}</span>
                      </>
                    )}
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

export default CarDetailPage;