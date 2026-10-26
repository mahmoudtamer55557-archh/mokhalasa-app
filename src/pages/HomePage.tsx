import React, { useState } from 'react';
import { Car } from '../types';
import CarCard from '../components/cars/CarCard';
import { COMPREHENSIVE_BANK_DATABASE } from '../data/bankDatabase';
import { translations } from '../utils/translations';
import { 
  ShieldCheck, Banknote, 
  ChevronRight, HelpCircle, 
  Check, Car as CarIcon, FileText,
  Clock, CheckCircle2, AlertTriangle, ArrowRight
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
  const isAr = lang === 'ar';
  const t = translations[lang] || translations.ar;

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
    <div className="space-y-12 sm:space-y-16 pb-16 animate-fadeIn" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* 1. HERO SECTION — PREMIER MARKETPLACE POSITIONING */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-brand-navy to-slate-950 text-white pt-10 sm:pt-16 pb-14 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-navy/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-5 sm:space-y-6">
          
          {/* Specialized Mission Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-brand-green/15 border border-brand-green/30 text-brand-green text-xs font-black tracking-wide shadow-xs max-w-full">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{t.home.heroBadge}</span>
          </div>

          {/* Primary Core Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {t.home.heroHeadline1}
            <span className="block text-brand-green mt-1 text-xl sm:text-3xl lg:text-4xl">{t.home.heroHeadline2}</span>
          </h1>

          {/* Core Brand Message */}
          <p className="text-slate-200 text-xs sm:text-base lg:text-lg font-bold max-w-3xl mx-auto leading-relaxed">
            {t.home.heroSubtitle}
          </p>

          {/* 3 PRIMARY TRACK TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto pt-2 text-right">
            
            {/* Track 1: Bank Debt Settlement & Encumbered Vehicles */}
            <div
              onClick={() => onNavigate('marketplace')}
              className={`p-4 sm:p-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 transition cursor-pointer backdrop-blur-sm group space-y-2 hover:border-blue-400/50 ${isAr ? 'text-right' : 'text-left'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-black bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-400/30">
                  {t.tracks.bankSettlementTag}
                </span>
                <ShieldCheck className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-black text-sm text-white">{t.home.track1Title}</h3>
              <p className="text-3xs text-slate-300 leading-relaxed">
                {t.home.track1Desc}
              </p>
            </div>

            {/* Track 2: Direct Installment */}
            <div
              onClick={() => onNavigate('marketplace')}
              className={`p-4 sm:p-5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 transition cursor-pointer backdrop-blur-sm group space-y-2 hover:border-amber-400 ${isAr ? 'text-right' : 'text-left'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-black bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-400/30">
                  {t.tracks.directInstallmentTag}
                </span>
                <Clock className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-black text-sm text-white">{t.home.track2Title}</h3>
              <p className="text-3xs text-amber-100/80 leading-relaxed">
                {t.home.track2Desc}
              </p>
            </div>

            {/* Track 3: Certified Cash Sales */}
            <div
              onClick={() => onNavigate('marketplace')}
              className={`p-4 sm:p-5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 transition cursor-pointer backdrop-blur-sm group space-y-2 hover:border-emerald-400 ${isAr ? 'text-right' : 'text-left'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-400/30">
                  {t.tracks.cashSaleTag}
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-black text-sm text-white">{t.home.track3Title}</h3>
              <p className="text-3xs text-emerald-100/80 leading-relaxed">
                {t.home.track3Desc}
              </p>
            </div>

          </div>

          {/* THE 2 PRIMARY INDEPENDENT PLATFORM ACTIONS */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
            
            {/* Primary Action 1: Seller Intake */}
            <button
              onClick={() => onNavigate('sell-wizard')}
              className="p-4 sm:p-5 rounded-2xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-brand-green/20 transition flex flex-col items-center justify-center gap-1.5 sm:gap-2 group transform hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>{t.home.btnSellCar}</span>
              </div>
              <span className="text-3xs sm:text-2xs font-medium text-emerald-100">
                {t.home.btnSellCarSub}
              </span>
            </button>

            {/* Primary Action 2: Public Marketplace Browse */}
            <button
              onClick={() => onNavigate('marketplace')}
              className="p-4 sm:p-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm sm:text-base border border-white/20 transition flex flex-col items-center justify-center gap-1.5 sm:gap-2 group transform hover:-translate-y-0.5 backdrop-blur-sm cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green" />
                <span>{t.home.btnBrowseCars}</span>
              </div>
              <span className="text-3xs sm:text-2xs font-medium text-slate-300">
                {t.home.btnBrowseCarsSub}
              </span>
            </button>

          </div>

          {/* Quick Support & Request Tracking Links */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs">
            <button
              onClick={() => onNavigate('seller-portal')}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-brand-green" />
              <span>{t.home.btnTrackMyRequest}</span>
            </button>

            <button
              onClick={() => setShowConsultModal(true)}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.home.btnAskTeam}</span>
            </button>
          </div>

          {/* Platform Standards Ribbon */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-3xs font-semibold text-slate-300">
            <span className="flex items-center gap-1">{t.home.ribbonProp1}</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="flex items-center gap-1">{t.home.ribbonProp2}</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="flex items-center gap-1">{t.home.ribbonProp3}</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="flex items-center gap-1">{t.home.ribbonProp4}</span>
          </div>

        </div>
      </section>

      {/* 2. 1.5% COMMISSION TRANSPARENCY & WORKED EXAMPLE */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-brand-border shadow-card space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-brand-green uppercase tracking-wider block">
                {t.home.transparencyBadge}
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-brand-navy">
                {t.home.transparencyTitle}
              </h2>
            </div>
            <div className="bg-emerald-50 text-brand-green px-3.5 py-1.5 rounded-xl text-xs font-extrabold border border-brand-green/20 self-start sm:self-auto">
              {t.home.transparencyBadge2}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {t.home.transparencyDesc}
          </p>

          {/* Labeled Mathematical Illustrative Example */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-brand-green">
                {t.home.exampleTitle}
              </span>
              <span className="text-3xs text-slate-400 font-mono">{t.home.exampleCase}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 text-center">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-3xs text-slate-400">{t.home.exampleGross}</div>
                <div className="text-xs sm:text-sm font-black text-white mt-1">600,000 {t.common.egp}</div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-3xs text-slate-400">{t.home.exampleBankPayoff}</div>
                <div className="text-xs sm:text-sm font-black text-blue-400 mt-1">400,000 {t.common.egp}</div>
                <div className="text-3xs text-slate-400 mt-0.5">{t.home.exampleBankLetter}</div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-3xs text-slate-400">{t.home.exampleGovFees}</div>
                <div className="text-xs sm:text-sm font-black text-amber-400 mt-1">5,000 {t.common.egp}</div>
                <div className="text-3xs text-slate-400 mt-0.5">{t.home.exampleGovReceipts}</div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-3xs text-slate-400">{t.home.exampleCommission}</div>
                <div className="text-xs sm:text-sm font-black text-brand-green mt-1">9,000 {t.common.egp}</div>
                <div className="text-3xs text-slate-400 mt-0.5">{t.home.exampleCommissionDesc}</div>
              </div>

              <div className="bg-emerald-500/10 p-3 rounded-xl border border-brand-green/30 col-span-2 sm:col-span-1">
                <div className="text-3xs text-brand-green font-bold">{t.home.exampleNetCash}</div>
                <div className="text-sm sm:text-base font-black text-brand-green mt-1">186,000 {t.common.egp}</div>
                <div className="text-3xs text-slate-400 mt-0.5">{t.home.exampleNetCashDesc}</div>
              </div>
            </div>

            <div className="text-3xs text-slate-400 pt-1 leading-relaxed">
              {t.home.exampleNote}
            </div>
          </div>
        </div>
      </section>

      {/* 3. VETTED CARS GALLERY WITH 3 TRACK TABS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-bold text-brand-green uppercase tracking-wider mb-1">
              {t.home.galleryBadge}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-brand-navy">
              {t.home.galleryTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t.home.galleryDesc}
            </p>
          </div>
          
          <button
            onClick={() => onNavigate('marketplace')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-navy hover:text-brand-green transition cursor-pointer self-start sm:self-auto"
          >
            <span>{t.home.btnViewAllCars}</span>
            <ChevronRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''} text-brand-green`} />
          </button>
        </div>

        {/* Gallery Filter Tabs (Horizontal Scrollable on Mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: t.home.tabAll },
            { id: 'direct_installment', label: t.home.tabDirect },
            { id: 'cash', label: t.home.tabCash },
            { id: 'bank_settlement', label: t.home.tabBank }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setHomeGalleryTab(tab.id as any)}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer border flex-shrink-0 ${
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
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 text-center space-y-4 max-w-xl mx-auto shadow-sm">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-brand-green">
              <CarIcon className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-slate-800 text-base">{t.home.noCarsTitle}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t.home.noCarsDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('sell-wizard')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-slate-950 font-black text-xs transition shadow cursor-pointer"
            >
              <span>{t.home.btnListYourCar}</span>
            </button>
          </div>
        )}
      </section>

      {/* 4. THE 4-STEP MANAGED EXIT PROCESS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-brand-navy to-slate-900 rounded-3xl p-6 sm:p-12 text-white relative overflow-hidden">
          
          <div className="max-w-2xl space-y-3 mb-8 sm:mb-10">
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider">{t.home.processBadge}</span>
            <h2 className="text-xl sm:text-3xl font-black text-white">{t.home.processTitle}</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              {t.home.processDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-brand-green text-white font-black text-sm flex items-center justify-center">
                01
              </div>
              <h3 className="font-bold text-sm text-white">{t.home.step1Title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.home.step1Desc}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-brand-green text-white font-black text-sm flex items-center justify-center">
                02
              </div>
              <h3 className="font-bold text-sm text-white">{t.home.step2Title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.home.step2Desc}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-brand-green text-white font-black text-sm flex items-center justify-center">
                03
              </div>
              <h3 className="font-bold text-sm text-white">{t.home.step3Title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.home.step3Desc}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-brand-green text-white font-black text-sm flex items-center justify-center">
                04
              </div>
              <h3 className="font-bold text-sm text-white">{t.home.step4Title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.home.step4Desc}
              </p>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-green flex-shrink-0" />
              <span>{t.home.zeroCustodyNote}</span>
            </div>

            <button
              onClick={() => onNavigate('how-it-works')}
              className="text-xs font-bold text-brand-green hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <span>{t.home.detailedGuideLink}</span>
              <ChevronRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            </button>
          </div>

        </div>
      </section>

      {/* 5. DANGER OF INFORMAL POA VS MOKHALASA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider">{t.home.riskBadge}</span>
          <h2 className="text-xl sm:text-2xl font-black text-brand-navy">
            {t.home.riskTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            {t.home.riskDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div className="bg-red-50/60 rounded-3xl p-5 sm:p-6 border border-red-200 space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-extrabold text-sm">
              <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center font-bold text-xs">✕</span>
              <span>{t.home.informalTitle}</span>
            </div>
            <ul className="space-y-2 text-xs text-red-950 font-medium leading-relaxed">
              <li>• {t.home.informal1}</li>
              <li>• {t.home.informal2}</li>
              <li>• {t.home.informal3}</li>
              <li>• {t.home.informal4}</li>
            </ul>
          </div>

          <div className="bg-emerald-50/60 rounded-3xl p-5 sm:p-6 border border-brand-green/30 space-y-4">
            <div className="flex items-center gap-2 text-brand-green font-extrabold text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-xs">✓</span>
              <span>{t.home.safeTitle}</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-800 font-medium leading-relaxed">
              <li>• {t.home.safe1}</li>
              <li>• {t.home.safe2}</li>
              <li>• {t.home.safe3}</li>
              <li>• {t.home.safe4}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. CONSULTATION QUESTION MODAL */}
      {showConsultModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-green" />
                <h3 className="font-extrabold text-base text-brand-navy">{t.home.consultTitle}</h3>
              </div>
              <button
                onClick={() => setShowConsultModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {consultSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-brand-green flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="text-base font-extrabold text-brand-navy">{t.home.consultSuccessTitle}</h4>
                <p className="text-xs text-slate-500">
                  {t.home.consultSuccessDesc}
                </p>
              </div>
            ) : (
              <form onSubmit={handleConsultSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.home.consultNameLabel}</label>
                  <input
                    type="text"
                    required
                    value={consultName}
                    onChange={(e) => setConsultName(e.target.value)}
                    placeholder={isAr ? "مثال: أحمد محمود" : "e.g. Ahmed Mahmoud"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.home.consultPhoneLabel}</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={consultPhone}
                    onChange={(e) => setConsultPhone(e.target.value)}
                    placeholder="010xxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-green font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.home.consultBankLabel}</label>
                  <select
                    value={consultBank}
                    onChange={(e) => setConsultBank(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    {Object.entries(COMPREHENSIVE_BANK_DATABASE).map(([key, b]) => (
                      <option key={key} value={key}>{isAr ? b.bankNameAr : (b.bankName || b.bankNameAr)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.home.consultQuestionLabel}</label>
                  <textarea
                    rows={3}
                    required
                    value={consultQuestion}
                    onChange={(e) => setConsultQuestion(e.target.value)}
                    placeholder={t.home.consultPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConsultModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md"
                  >
                    {t.home.consultSubmitBtn}
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
