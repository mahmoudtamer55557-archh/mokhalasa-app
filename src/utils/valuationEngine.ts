import { 
  ValuationResult, ValuationFactor 
} from '../types';
import { EGYPT_MARKET_COMPARABLES } from '../data/marketResearchData';

interface ValuationInput {
  make: string;
  model: string;
  year: number;
  trim: string;
  mileage: number;
  paintCondition: string;
  disclosedProblems?: string[];
  outstandingDebt?: number;
  urgency?: 'very_urgent' | 'urgent' | 'flexible';
}

export function computeVehicleValuation(input: ValuationInput): ValuationResult {
  const { make, model, year, trim, mileage, paintCondition, disclosedProblems = [], outstandingDebt = 0, urgency = 'urgent' } = input;

  // 1. Find matching comparables
  const matches = EGYPT_MARKET_COMPARABLES.filter(
    (c) => c.make.toLowerCase() === make.toLowerCase() && c.model.toLowerCase() === model.toLowerCase()
  );

  const exactYearMatches = matches.filter((c) => c.year === year);
  const activeComparables = exactYearMatches.length > 0 ? exactYearMatches : matches;

  let basePrice = 600000;
  let minRange = 550000;
  let maxRange = 650000;
  let confidence: 'عالية (بيانات وفيرة)' | 'متوسطة' | 'منخفضة / بيانات غير كافية' = 'منخفضة / بيانات غير كافية';

  if (activeComparables.length >= 3) {
    const prices = activeComparables.map((c) => c.advertisedPrice);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    basePrice = Math.round(avg);
    minRange = Math.min(...prices);
    maxRange = Math.max(...prices);
    confidence = 'عالية (بيانات وفيرة)';
  } else if (activeComparables.length > 0) {
    const prices = activeComparables.map((c) => c.advertisedPrice);
    basePrice = prices[0];
    minRange = Math.round(basePrice * 0.94);
    maxRange = Math.round(basePrice * 1.05);
    confidence = 'متوسطة';
  } else {
    // Model year base estimation if no exact comparables in seed
    basePrice = 750000;
    minRange = 700000;
    maxRange = 800000;
    confidence = 'منخفضة / بيانات غير كافية';
  }

  // 2. Adjust for Mileage
  const valueFactors: ValuationFactor[] = [];
  const expectedMileage = (2026 - year) * 15000;
  const mileageDiff = mileage - expectedMileage;

  if (mileageDiff < -10000) {
    valueFactors.push({
      factor: 'عداد كيلومترات منخفض',
      impact: 'positive',
      description: `قراءة العداد (${mileage.toLocaleString()} كم) أقل من متوسط الاستهلاك السنوي، مما يرفع القيمة السوقية.`
    });
    basePrice += 20000;
  } else if (mileageDiff > 25000) {
    valueFactors.push({
      factor: 'استهلاك كيلومترات مرتفع',
      impact: 'negative',
      description: `قراءة العداد (${mileage.toLocaleString()} كم) أعلى من المعدل الطبيعي بمقدار ${(mileageDiff / 1000).toFixed(0)} ألف كم.`
    });
    basePrice -= 25000;
  }

  // 3. Adjust for Paint / Condition
  if (paintCondition === 'فابريكا بالكامل') {
    valueFactors.push({
      factor: 'حالة البودي فابريكا بالكامل',
      impact: 'positive',
      description: 'خلو السيارة التام من أي رش خارجي أو حوادث يمنحها طلباً قوياً وسرعة في البيع.'
    });
  } else if (paintCondition.includes('رش خارجي') || paintCondition.includes('رفرفين')) {
    valueFactors.push({
      factor: 'وجود رش دهان خارجي',
      impact: 'negative',
      description: 'رش أجزاء خارجية نظافة يخفض القيمة بمتوسط 3% إلى 5% عن سعر الفابريكا بالكامل.'
    });
    basePrice -= 15000;
  }

  // 4. Adjust for Disclosed Mechanical / Electrical Defects
  if (disclosedProblems.length > 0) {
    const defectPenalty = disclosedProblems.length * 10000;
    basePrice -= defectPenalty;
    valueFactors.push({
      factor: `إفصاح البائع عن ${disclosedProblems.length} ملاحظات فنية`,
      impact: 'negative',
      description: `تم خصم تقديري ${defectPenalty.toLocaleString()} ج.م لتغطية تكاليف الإصلاحات والصيانة المطلوبة.`
    });
  }

  // 5. Urgency and Faster-Sale Price
  let fasterSaleMin = Math.round(basePrice * 0.94);
  let fasterSaleMax = Math.round(basePrice * 0.97);

  if (urgency === 'very_urgent') {
    fasterSaleMin = Math.round(basePrice * 0.91);
    fasterSaleMax = Math.round(basePrice * 0.94);
    valueFactors.push({
      factor: 'عامل الاستعجال الزمني للتخارج',
      impact: 'neutral',
      description: 'لتحقيق بيع سريع خلال 7-10 أيام وتفادي نزول قسط جديد، يوصى بعرض سعر تنافسي يقل 6% عن سعر السوق.'
    });
  }

  const missingInfoNotes: string[] = [];
  if (activeComparables.length === 0) {
    missingInfoNotes.push('بيانات المقارنة المباشرة لهذه الفئة محدودة، يوصى بمراجعة يدوية من خبير مخلصة.');
  }
  if (!trim || trim.includes('غير مدرجة')) {
    missingInfoNotes.push('الفئة مسجلة يدوياً، يلزم مراجعة كتالوج الوكيل لتأكيد الكماليات الإضافية.');
  }

  const estimatedMarketRange = {
    min: Math.round(basePrice * 0.96),
    max: Math.max(maxRange, Math.round(basePrice * 1.04))
  };

  const sellerPotentialNet = Math.max(0, basePrice - outstandingDebt);

  const sources = activeComparables.map((c) => ({
    name: `${c.source} (${c.observationDate})`,
    timestamp: c.observationDate
  }));

  if (sources.length === 0) {
    sources.push({ name: 'مؤشر مخلصة التقديري لمتوسط السوق 2026', timestamp: '2026-10-22' });
  }

  return {
    estimatedMarketRange,
    suggestedAskingPrice: basePrice,
    suggestedFasterSaleRange: { min: fasterSaleMin, max: fasterSaleMax },
    buyerInterestIndicator: urgency === 'very_urgent' || basePrice < minRange ? 'مرتفع جداً (طلب قوي)' : 'متوسط',
    confidenceLevel: confidence,
    comparableCount: activeComparables.length,
    sources,
    valueFactors,
    missingInfoNotes,
    sellerPotentialNet,
    disclaimerAr: 'التقييم تقديري بناءً على بيانات السوق المتاحة ومواصفات العربية المدخلة. السعر النهائي يتأثر بالحالة الفعلية، والمعاينة الهندسية، وموافقة جهة التمويل، وأي مبالغ تسوية أو رسوم موثقة.'
  };
}
