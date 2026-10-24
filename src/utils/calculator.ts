import { BANK_FEE_DATABASE } from '../data/mockData';
import { FinancingScenarioResult } from '../types';

export interface CalculatorInputs {
  estimatedMarketValue: number; // V
  agreedSalePrice: number;        // P
  bankKey: string;               // e.g. 'credit_agricole', 'cib'
  outstandingPrincipal: number;  // أصل القرض المتبقي
  monthlyInstallment?: number;
  arrearsAmount?: number;
}

export function calculateCarExitScenarios(inputs: CalculatorInputs): FinancingScenarioResult[] {
  const { estimatedMarketValue: V, agreedSalePrice: P, bankKey, outstandingPrincipal, arrearsAmount = 0 } = inputs;
  const bankInfo = BANK_FEE_DATABASE[bankKey] || BANK_FEE_DATABASE['credit_agricole'];

  const platformFeeRate = 0.015; // 1.5%
  const platformFee = Math.round(P * platformFeeRate);
  const trafficAndNotaryFee = 4500; // Average government transfer & registration fees

  // Standard early settlement calculation:
  const earlySettlementFee = Math.round(outstandingPrincipal * bankInfo.earlySettlementRate);
  const releaseLetterFee = bankInfo.releaseLetterFee + bankInfo.trafficLetterFee;
  const totalBankSettlement = outstandingPrincipal + earlySettlementFee + releaseLetterFee + arrearsAmount;

  // Seller net cash proceeds:
  const sellerNetProceeds = P - totalBankSettlement;

  // Buyer total cost:
  const buyerTotalCost = P + platformFee + trafficAndNotaryFee;
  const buyerSaving = V - buyerTotalCost;
  const buyerSavingPercent = Math.round((buyerSaving / V) * 1000) / 10;

  // 1. Route B (Primary Recommended Route: Buyer pays bank directly)
  const routeB: FinancingScenarioResult = {
    route: 'route_b',
    routeNameAr: 'المسار (B): سداد المشتري المباشر للبنك مع اتفاق ثلاثي',
    routeNameEn: 'Route B: Direct Buyer Bank Settlement via Tri-Party Agreement',
    descriptionAr: 'يقوم المشتري بإيداع مبلغ التسوية البنكية مباشرة في حساب قرض البائع بالبنك، ويستلم إيصال السداد الرسمي فوراً، ثم يحصل البائع على صافي مستحقاته عند نقل الملكية بالشهر العقاري.',
    feasibilityRating: 'موصى به للغاية',
    salePrice: P,
    bankSettlementAmount: totalBankSettlement,
    platformFee,
    trafficAndNotaryFee,
    buyerTotalCost,
    buyerSaving,
    buyerSavingPercent,
    sellerNetProceeds,
    estimatedTimelineDays: `${bankInfo.avgSettlementDays + 2} - ${bankInfo.avgSettlementDays + 4} أيام عمل`,
    requiredDocuments: [
      'بطاقة الرقم القومي سارية للطرفين',
      'رخصة السيارة الأصلية السارية',
      'خطاب استعلام سداد معجل رسمي من البنك',
      'عقد اتفاق التخارج الثلاثي المنظم للصفقة',
      'إيصال إيداع البنك الرسمي (Bank Teller Slip)'
    ],
    keyRisks: [
      'التزام البائع بالحضور للمرور والشهر العقاري بعد إيداع البنك (مضمون بالعقد الثلاثي وحيازة السيارة الفورية)',
      'توقيت صدور خطاب فك الحظر من البنك (يستغرق عادة 3 إلى 5 أيام عمل)'
    ]
  };

  // 2. Route A (Seller Settles Early Before Sale)
  const routeA: FinancingScenarioResult = {
    route: 'route_a',
    routeNameAr: 'المسار (A): سداد البائع الكامل وفك الحظر مسبقاً',
    routeNameEn: 'Route A: Seller Self-Settlement Prior to Sale',
    descriptionAr: 'يقوم البائع بسداد كامل مديونية البنك من أمواله الخاصة مسبقاً وفك الحظر بالمرور لتصبح السيارة حرة 100%، ثم بيعها ونقل ملكيتها فوراً بالشهر العقاري للمشتري.',
    feasibilityRating: 'متاح بشروط',
    salePrice: P,
    bankSettlementAmount: totalBankSettlement,
    platformFee,
    trafficAndNotaryFee,
    buyerTotalCost,
    buyerSaving,
    buyerSavingPercent,
    sellerNetProceeds,
    estimatedTimelineDays: '7 - 10 أيام عمل',
    requiredDocuments: [
      'شهادة مخالصة نهائية وبراءة ذمة من البنك',
      'رخصة سيارة حرة بعد رفع الحظر بالمرور',
      'شهادة بيانات حديثة للشهر العقاري',
      'عقد بيع نهائي مسجل'
    ],
    keyRisks: [
      'يتطلب توفر سيولة نقدية كافية لدى البائع لسداد البنك مقدماً دون ضمان بيع سريع',
      'تحمل البائع لرسوم السداد المعجل من جيبه الخاص مقدماً'
    ]
  };

  // 3. Route C (Buyer Obtains New Financing / Debt Buyout)
  const buyoutFee = Math.round(outstandingPrincipal * bankInfo.buyoutRate);
  const totalBuyoutSettlement = outstandingPrincipal + buyoutFee + releaseLetterFee + arrearsAmount;
  const buyerFinancedCost = buyerTotalCost + (buyoutFee - earlySettlementFee);
  const routeC: FinancingScenarioResult = {
    route: 'route_c',
    routeNameAr: 'المسار (C): شراء المديونية أو تمويل بنكي جديد للمشتري',
    routeNameEn: 'Route C: Buyer Loan Refinance / Debt Buyout',
    descriptionAr: 'يتقدم المشتري بطلب تمويل سيارة مستعملة جديد من بنك أو شركة تمويل أخرى، وتقوم الجهة الجديدة بإصدار شيك سداد مديونية لصالح بنك البائع القديم واستبدال حظر البيع.',
    feasibilityRating: 'يتطلب مراجعة خاصة',
    salePrice: P,
    bankSettlementAmount: totalBuyoutSettlement,
    platformFee,
    trafficAndNotaryFee: trafficAndNotaryFee + 2000,
    buyerTotalCost: buyerFinancedCost,
    buyerSaving: V - buyerFinancedCost,
    buyerSavingPercent: Math.round(((V - buyerFinancedCost) / V) * 1000) / 10,
    sellerNetProceeds: P - totalBuyoutSettlement,
    estimatedTimelineDays: '15 - 25 يوم عمل',
    requiredDocuments: [
      'موافقة ائتمانية رسمية من جهة تمويل المشتري الجديدة',
      'خطاب مديونية موجه للبنك الجديد بغرض شراء المديونية',
      'شيك مصرفي مقبول الدفع لسداد مديونية البنك القديم',
      'تنسيق استبدال إشارة الحظر بين إدارتي المرور والائتمان'
    ],
    keyRisks: [
      'عمولة شراء مديونية مرتفعة (تصل إلى 20% في كريدي أجريكول و13% في QNB)',
      'روتين وبيروقراطية المقاصة البنكية التي قد تستغرق شهراً كاملاً'
    ]
  };

  return [routeB, routeA, routeC];
}
