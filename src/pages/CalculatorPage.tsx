import React, { useState, useMemo } from 'react';
import { COMPREHENSIVE_BANK_DATABASE } from '../data/bankDatabase';
import { calculateItemizedSettlement } from '../utils/settlementCalculator';
import { 
  Calculator, CheckCircle2, AlertTriangle, ArrowRight, 
  Banknote, ShieldCheck, Sparkles, Scale, RefreshCw, Lock
} from 'lucide-react';

interface CalculatorPageProps {
  onNavigate: (view: string) => void;
  lang?: 'ar' | 'en';
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({ onNavigate, lang = 'ar' }) => {
  const isAr = lang === 'ar';

  // Interactive Form Inputs
  const [grossSalePrice, setGrossSalePrice] = useState<number>(600000);
  const [bankKey, setBankKey] = useState<string>('credit_agricole');
  const [lenderSettlementAmount, setLenderSettlementAmount] = useState<number>(400000);
  const [isManualLenderQuote, setIsManualLenderQuote] = useState<boolean>(true);
  
  // Dynamic bank calculation inputs if not manual
  const [outstandingPrincipal, setOutstandingPrincipal] = useState<number>(350000);

  // Additional costs
  const [trafficGovFee, setTrafficGovFee] = useState<number>(1800);
  const [notaryFee, setNotaryFee] = useState<number>(2000);
  const [inspectionFee, setInspectionFee] = useState<number>(1200);

  // Commission rate (default 1.5%)
  const [commissionRate, setCommissionRate] = useState<number>(0.015);

  const selectedBank = COMPREHENSIVE_BANK_DATABASE[bankKey] || COMPREHENSIVE_BANK_DATABASE['credit_agricole'];

  // Recalculate auto lender quote if not manual
  const effectiveLenderSettlement = useMemo(() => {
    if (isManualLenderQuote) {
      return lenderSettlementAmount;
    }
    const earlySettlementFee = Math.round(outstandingPrincipal * selectedBank.earlySettlementRate);
    const releaseLetters = selectedBank.releaseLetterFee + selectedBank.trafficLetterFee;
    return outstandingPrincipal + earlySettlementFee + releaseLetters;
  }, [isManualLenderQuote, lenderSettlementAmount, outstandingPrincipal, selectedBank]);

  const totalOtherCosts = trafficGovFee + notaryFee + inspectionFee;

  // Itemized settlement calculation
  const settlement = useMemo(() => {
    return calculateItemizedSettlement({
      grossSalePrice,
      lenderSettlementAmount: effectiveLenderSettlement,
      customCommissionRate: commissionRate,
      earlySettlementFee: 0,
      releaseLetterFee: 0,
      trafficAndGovFees: trafficGovFee,
      inspectionFee: inspectionFee + notaryFee,
      lenderSettlementValidityDate: isManualLenderQuote ? 'خطاب رسمي سارٍ' : undefined
    });
  }, [grossSalePrice, effectiveLenderSettlement, commissionRate, trafficGovFee, notaryFee, inspectionFee, isManualLenderQuote]);

  const formatEGP = (num: number) => {
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-EG', { maximumFractionDigits: 0 }).format(num) + (isAr ? ' ج.م' : ' EGP');
  };

  // Presets handler
  const handleApplyPreset = (type: 'standard_600k' | 'negative_equity' | 'cib_elantra') => {
    if (type === 'standard_600k') {
      setGrossSalePrice(600000);
      setLenderSettlementAmount(400000);
      setIsManualLenderQuote(true);
      setTrafficGovFee(1800);
      setNotaryFee(2000);
      setInspectionFee(1200);
      setCommissionRate(0.015);
    } else if (type === 'negative_equity') {
      setGrossSalePrice(500000);
      setLenderSettlementAmount(530000);
      setIsManualLenderQuote(true);
      setTrafficGovFee(1200);
      setNotaryFee(1800);
      setInspectionFee(1000);
      setCommissionRate(0.015);
    } else if (type === 'cib_elantra') {
      setGrossSalePrice(1160000);
      setBankKey('cib');
      setLenderSettlementAmount(1050100);
      setIsManualLenderQuote(true);
      setTrafficGovFee(2200);
      setNotaryFee(2500);
      setInspectionFee(1200);
      setCommissionRate(0.015);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-navy/10 text-brand-navy text-xs font-bold">
            <Calculator className="w-4 h-4 text-brand-green" />
            <span>{isAr ? 'حاسبة تسوية ديون السيارات وعمولة مخلصة (1.5%)' : 'Auto Debt Settlement & 1.5% Commission Calculator'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-navy">
            {isAr ? 'حاسبة التخارج وصافي مستحقات البائع' : 'Car Debt Exit & Net Proceeds Calculator'}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {isAr
              ? 'احسب بدقة المبالغ المستردة بعد سداد تسوية البنك بالكامل، وتعرّف على تفصيل عمولة مخلصة الثابتة (1.5%) والرسوم الرسمية، مع فحص حالات العجز المالي (Negative Equity).'
              : 'Accurately simulate seller net proceeds after complete lender payoff, 1.5% transparent platform fee, and identify potential negative equity shortfalls.'}
          </p>
        </div>

        {/* Featured Mathematical Worked Example Banner (From System Prompt) */}
        <div className="bg-gradient-to-r from-brand-navy to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-green" />
              <h2 className="font-black text-base sm:text-lg">
                {isAr ? 'النموذج الرياضي القياسي للشفافية المالية (مثال 600 ألف ج.م):' : 'Standard Transparency Mathematical Example:'}
              </h2>
            </div>
            <button
              onClick={() => handleApplyPreset('standard_600k')}
              className="px-3.5 py-1.5 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-brand-green-hover transition self-start sm:self-auto"
            >
              {isAr ? 'تطبيق هذا المثال في الحاسبة الآن' : 'Apply Preset in Calculator'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="text-slate-300 block text-[10px]">1. سعر البيع الإجمالي (P)</span>
              <span className="text-lg font-black text-white mt-1 block">600,000 ج.م</span>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="text-slate-300 block text-[10px]">2. تسوية البنك الدائن (S)</span>
              <span className="text-lg font-black text-red-300 mt-1 block">- 400,000 ج.م</span>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="text-slate-300 block text-[10px]">3. مصاريف إدارية وفحص</span>
              <span className="text-lg font-black text-amber-300 mt-1 block">- 5,000 ج.م</span>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="text-slate-300 block text-[10px]">4. عمولة مخلصة (1.5%)</span>
              <span className="text-lg font-black text-brand-green mt-1 block">- 9,000 ج.م</span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-brand-green/20 backdrop-blur-sm border border-brand-green/30">
              <span className="text-emerald-200 block text-[10px] font-bold">5. صافي المسترد للبائع (N)</span>
              <span className="text-lg font-black text-emerald-300 mt-1 block">186,000 ج.م</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] text-slate-300 gap-2 pt-1">
            <span>
              <strong>المعادلة:</strong> 600,000 - 400,000 - 5,000 - 9,000 = <strong className="text-white">186,000 ج.م صافي نقدية للبائع</strong>.
            </span>
            <span className="text-brand-green flex items-center gap-1 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>تسدد الـ 400 ألف مباشرة بالبنك بحساب القرض، ولا تحجز مخلصة أي أموال تسوية.</span>
            </span>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">{isAr ? 'نماذج جاهزة للاختبار:' : 'Quick Presets:'}</span>
          <button
            onClick={() => handleApplyPreset('standard_600k')}
            className="px-3 py-1.5 rounded-xl bg-white border border-brand-border text-xs font-bold text-brand-navy hover:border-brand-green shadow-sm transition"
          >
            ✓ الحالة النموذجية (600K بيع / 400K دين)
          </button>
          <button
            onClick={() => handleApplyPreset('negative_equity')}
            className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 hover:bg-red-100 shadow-sm transition"
          >
            ⚠️ حالة عجز مالي سلبي (Negative Equity)
          </button>
          <button
            onClick={() => handleApplyPreset('cib_elantra')}
            className="px-3 py-1.5 rounded-xl bg-white border border-brand-border text-xs font-bold text-brand-navy hover:border-brand-green shadow-sm transition"
          >
            🚙 تمويل فئة عليا CIB (إلنترا 1.16M)
          </button>
        </div>

        {/* Main Grid: Inputs vs Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Inputs Column (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-card space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                <Banknote className="w-5 h-5 text-brand-green" />
                <span>{isAr ? 'بيانات الصفقة والمديونية' : 'Deal & Loan Parameters'}</span>
              </h2>
              <button
                onClick={() => handleApplyPreset('standard_600k')}
                className="text-[11px] font-bold text-brand-green hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>إعادة ضبط</span>
              </button>
            </div>

            {/* Agreed Sale Price */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-700">{isAr ? 'سعر البيع الإجمالي المتفق عليه (P):' : 'Gross Agreed Sale Price:'}</label>
                <span className="font-black text-brand-navy text-sm">{formatEGP(grossSalePrice)}</span>
              </div>
              <input
                type="number"
                step="10000"
                min="100000"
                value={grossSalePrice}
                onChange={(e) => setGrossSalePrice(Math.max(0, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
              <input
                type="range"
                min="200000"
                max="2500000"
                step="20000"
                value={grossSalePrice}
                onChange={(e) => setGrossSalePrice(Number(e.target.value))}
                className="w-full accent-brand-navy cursor-pointer"
              />
            </div>

            {/* Lender Payoff Source Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                {isAr ? 'طريقة تحديد تسوية البنك الدائن (S):' : 'Lender Payoff Calculation Method:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualLenderQuote(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    isManualLenderQuote 
                      ? 'bg-brand-navy text-white border-brand-navy shadow-sm' 
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  خطاب سداد رسمي مباشر
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualLenderQuote(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    !isManualLenderQuote 
                      ? 'bg-brand-navy text-white border-brand-navy shadow-sm' 
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  احتساب من تعريفة البنك
                </button>
              </div>
            </div>

            {/* Manual Lender Quote Input */}
            {isManualLenderQuote ? (
              <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="text-xs font-bold text-slate-700 block">
                  {isAr ? 'مبلغ التسوية الإجمالي من خطاب البنك (S):' : 'Lender Payoff Amount (from official letter):'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="5000"
                    value={lenderSettlementAmount}
                    onChange={(e) => setLenderSettlementAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">ج.م</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  * يشمل أصل القرض القائم + عمولة السداد المعجل + رسوم خطابات فك الحظر الصادرة من البنك.
                </p>
              </div>
            ) : (
              /* Auto Calculation Based on Bank Tariff */
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">البنك أو جهة التمويل:</label>
                  <select
                    value={bankKey}
                    onChange={(e) => setBankKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-brand-navy bg-white"
                  >
                    {Object.entries(COMPREHENSIVE_BANK_DATABASE).map(([key, bank]) => (
                      <option key={key} value={key}>
                        {bank.bankNameAr} ({Math.round(bank.earlySettlementRate * 100)}% سداد معجل)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">أصل المديونية القائم (بدون فوائد):</label>
                  <input
                    type="number"
                    value={outstandingPrincipal}
                    onChange={(e) => setOutstandingPrincipal(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-brand-navy bg-white"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>عمولة السداد المعجل ({Math.round(selectedBank.earlySettlementRate * 100)}%):</span>
                    <span className="font-bold text-red-600">
                      +{formatEGP(Math.round(outstandingPrincipal * selectedBank.earlySettlementRate))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>رسوم خطابات فك الحظر:</span>
                    <span className="font-bold text-slate-700">
                      +{formatEGP(selectedBank.releaseLetterFee + selectedBank.trafficLetterFee)}
                    </span>
                  </div>
                  <div className="flex justify-between font-extrabold text-brand-navy pt-1 border-t border-slate-100">
                    <span>إجمالي التسوية المحتسبة:</span>
                    <span className="text-red-600">{formatEGP(effectiveLenderSettlement)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Deductible Costs Breakdown (Notary, Inspection, Traffic) */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">
                {isAr ? 'المصاريف والرسوم الإدارية المخصومة (C):' : 'Deductible Fees (C):'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block">توثيق بالشهر العقاري:</span>
                  <input
                    type="number"
                    value={notaryFee}
                    onChange={(e) => setNotaryFee(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block">شهادة بيانات ومرور:</span>
                  <input
                    type="number"
                    value={trafficGovFee}
                    onChange={(e) => setTrafficGovFee(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block">فحص فني معتمد:</span>
                  <input
                    type="number"
                    value={inspectionFee}
                    onChange={(e) => setInspectionFee(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-bold text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                <span>إجمالي المصاريف المخصومة:</span>
                <span className="font-bold text-slate-800">{formatEGP(totalOtherCosts)}</span>
              </div>
            </div>

            {/* Mokhalasa Commission Setting */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-950 flex items-center gap-1">
                  <Scale className="w-4 h-4 text-brand-green" />
                  <span>عمولة منصة مخلصة لتنظيم الصفقة:</span>
                </span>
                <span className="font-black text-brand-green bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                  {(commissionRate * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-[10px] text-emerald-800 leading-relaxed">
                عمولة مخلصة الثابتة 1.5% من إجمالي ثمن البيع تشمل تدقيق أوراق البنك، التنسيق الميداني بالفرع والشهر العقاري، ومتابعة فك الحظر حتى استلام الرخصة الحرة.
              </p>
            </div>

          </div>

          {/* Results & Mathematical Statement Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Core Outcome Result Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-card space-y-6">
              
              <div className="flex justify-between items-start gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-black text-brand-navy">
                    {settlement.isShortfall ? (
                      <span className="text-red-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span>حالة عجز مالي سلبي (Negative Equity)</span>
                      </span>
                    ) : (
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-5 h-5 text-brand-green" />
                        <span>تخارج ناجح وفائض نقدية للبائع</span>
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {settlement.isShortfall
                      ? 'المديونية البنكية والرسوم تتجاوز إجمالي سعر بيع السيارة. يتعين على البائع ضخ الفارق لإغلاق ملف القرض.'
                      : 'المديونية أقل من قيمة البيع. يستلم البائع صافي المبلغ كاش عند توثيق عقد البيع بالشهر العقاري.'}
                  </p>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-black flex-shrink-0 ${
                  settlement.isShortfall ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {settlement.isShortfall ? 'عجز مالي' : 'صافي ربح للبائع'}
                </span>
              </div>

              {/* Big KPI Display */}
              <div className={`p-6 rounded-3xl border text-center space-y-2 ${
                settlement.isShortfall 
                  ? 'bg-red-50/70 border-red-200 text-red-950' 
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              }`}>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  {settlement.isShortfall ? 'المبلغ المطلوب سداده من البائع كاش لتغطية العجز (Shortfall):' : 'صافي النقدية المستلمة في يد البائع (Net Proceeds):'}
                </span>
                
                <div className={`text-3xl sm:text-4xl font-black ${settlement.isShortfall ? 'text-red-600' : 'text-emerald-700'}`}>
                  {settlement.isShortfall ? formatEGP(settlement.shortfallAmount) : formatEGP(settlement.netProceedsToSeller)}
                </div>

                <p className="text-xs text-slate-600 max-w-md mx-auto pt-1">
                  {settlement.isShortfall
                    ? 'يمكن للبائع سداد هذا العجز كاش في خزينة البنك الدائن أثناء زيارة التسوية مع المشتري ومستشار مخلصة.'
                    : 'يستلم البائع هذا المبلغ كاش بالكامل بعد سداد تسوية البنك وفك حظر البيع.'}
                </p>
              </div>

              {/* Itemized Mathematical Deductions Table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                  <span>كشف التسوية المالي التفصيلي (Itemized Statement):</span>
                  <span className="text-[11px] text-brand-navy font-mono">1.5% COMMISSION</span>
                </h4>

                <div className="bg-slate-50 rounded-2xl p-4.5 text-xs space-y-2.5 border border-slate-200">
                  
                  {/* Gross Price */}
                  <div className="flex justify-between items-center text-slate-800 font-bold">
                    <span>(+) سعر البيع الإجمالي المتفق عليه (P):</span>
                    <span className="text-sm font-black text-brand-navy">{formatEGP(settlement.grossSalePrice)}</span>
                  </div>

                  {/* Lender Payoff */}
                  <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-slate-200">
                    <span className="flex items-center gap-1">
                      <span>(-) تسوية البنك الدائن بالكامل (تودع بحساب القرض):</span>
                    </span>
                    <span className="font-extrabold text-red-600">
                      -{formatEGP(settlement.lenderSettlementAmount)}
                    </span>
                  </div>

                  {/* Additional Costs */}
                  <div className="flex justify-between items-center text-slate-700">
                    <span>(-) رسوم ومصاريف التوثيق والفحص الحكومية (C):</span>
                    <span className="font-bold text-slate-700">
                      -{formatEGP(totalOtherCosts)}
                    </span>
                  </div>

                  {/* Mokhalasa Commission */}
                  <div className="flex justify-between items-center text-brand-green font-extrabold">
                    <span>(-) عمولة منصة مخلصة (1.5% من {formatEGP(settlement.grossSalePrice)}):</span>
                    <span>
                      -{formatEGP(settlement.platformCommission)}
                    </span>
                  </div>

                  {/* Total Deductions */}
                  <div className="flex justify-between items-center font-bold text-slate-600 pt-2 border-t border-slate-300">
                    <span>(=) إجمالي الاستقطاعات والمديونية:</span>
                    <span className="font-black text-slate-800">
                      {formatEGP(settlement.totalDeductions)}
                    </span>
                  </div>

                  {/* Final Net Result */}
                  <div className={`flex justify-between items-center font-black pt-2 border-t-2 border-slate-400 text-sm ${
                    settlement.isShortfall ? 'text-red-600' : 'text-emerald-700'
                  }`}>
                    <span>(=) صافي الموقف المالي للبائع:</span>
                    <span>
                      {settlement.isShortfall 
                        ? `عجز: ${formatEGP(settlement.shortfallAmount)}` 
                        : formatEGP(settlement.netProceedsToSeller)}
                    </span>
                  </div>

                </div>
              </div>

              {/* Zero-Custody Safety Protocol Card */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Lock className="w-4 h-4 text-blue-700" />
                  <span>بروتوكول مخلصة لمنع مخاطر النقد والوسطاء (Zero-Custody Guarantee):</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  منصة مخلصة لا تستلم ولا تحتفظ بأي مبالغ تخص تسوية البنك الدائن ({formatEGP(settlement.lenderSettlementAmount)}). يقوم المشتري بإيداع هذا المبلغ مباشرة في حساب القرض بفرع البنك بحضور الطرفين وممثل مخلصة، واستلام إيصال الإيداع المصرفي المعتمد.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('sell-wizard')}
                  className="w-full py-4 px-4 rounded-2xl bg-brand-green hover:bg-brand-green-hover text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>{isAr ? 'ابدأ بيع سيارتك المحملة بأقساط الآن' : 'Start Selling Your Financed Car'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default CalculatorPage;