import { BankFeeInfo } from '../types';

export const COMPREHENSIVE_BANK_DATABASE: Record<string, BankFeeInfo> = {
  // 1. Crédit Agricole Egypt
  'credit_agricole': {
    bankName: 'Crédit Agricole Egypt',
    bankNameAr: 'بنك كريدي أجريكول مصر',
    category: 'commercial_bank',
    earlySettlementRate: 0.15, // 15% verified Ref 1-2026
    earlySettlementNoteAr: '15% من أصل الرصيد المدين المتبقي (التعريفة المصرفية الرسمية)',
    buyoutRate: 0.20,
    buyoutAllowed: true,
    buyoutNoteAr: '20% عمولة شراء مديونية للسيارات المنقولة لبنك آخر',
    releaseLetterFee: 2000,
    trafficLetterFee: 600,
    clearanceFee: 500,
    avgSettlementDays: 5,
    officialSource: 'تعريفة بنك كريدي أجريكول مصر لخدمات الأفراد - كود CBE 001',
    verificationDate: '2026-01-15',
    notesAr: 'يلزم حضور البائع شخصياً بالفرع للتوقيع على طلب السداد المعجل. لا يجوز نقل القسط لمشترٍ جديد دون سداد كامل.'
  },

  // 2. Commercial International Bank (CIB)
  'cib': {
    bankName: 'Commercial International Bank (CIB)',
    bankNameAr: 'البنك التجاري الدولي - مصر',
    category: 'commercial_bank',
    earlySettlementRate: 0.07, // 7% verified
    earlySettlementNoteAr: '7% من أصل الدين المتبقي للسداد المعجل النقدي',
    buyoutRate: 0.10,
    buyoutAllowed: true,
    buyoutNoteAr: '10% عمولة نقل مديونية لبنك آخر',
    releaseLetterFee: 1500,
    trafficLetterFee: 150,
    clearanceFee: 150,
    avgSettlementDays: 4,
    officialSource: 'cibeg.com/personal/loans/auto-loan - كود CBE 002',
    verificationDate: '2026-01-20',
    notesAr: 'إصدار خطاب فك الحظر خلال 72 إلى 96 ساعة من تاريخ الإيداع المباشر لخزينة البنك.'
  },

  // 3. National Bank of Egypt (NBE)
  'nbe': {
    bankName: 'National Bank of Egypt (NBE)',
    bankNameAr: 'البنك الأهلي المصري',
    category: 'commercial_bank',
    earlySettlementRate: 0.035, // 3.5% verified
    earlySettlementNoteAr: '3.5% من أصل الدين (أقل عمولة سداد معجل بين البنوك المصرية)',
    buyoutRate: 0.035,
    buyoutAllowed: true,
    buyoutNoteAr: '3.5% عمولة شراء المديونية',
    releaseLetterFee: 200,
    trafficLetterFee: 100,
    clearanceFee: 100,
    avgSettlementDays: 5,
    officialSource: 'nbe.com.eg - قرض السيارة الملاكي كود CBE 003',
    verificationDate: '2026-01-18',
    notesAr: 'السداد في الفرع المسجل به القرض يسرع استلام المخالصة. يلزم إحضار صورة رخصة السيارة سارية.'
  },

  // 4. Banque Misr
  'banque_misr': {
    bankName: 'Banque Misr',
    bankNameAr: 'بنك مصر',
    category: 'commercial_bank',
    earlySettlementRate: 0.06,
    earlySettlementNoteAr: '6% من أصل الرصيد المدين المتبقي',
    buyoutRate: 0.10,
    buyoutAllowed: true,
    buyoutNoteAr: '10% عمولة شراء مديونية',
    releaseLetterFee: 200,
    trafficLetterFee: 150,
    clearanceFee: 150,
    avgSettlementDays: 5,
    officialSource: 'banquemisr.com - كود CBE 004',
    verificationDate: '2026-01-10',
    notesAr: 'يدعم القروض التقليدية ومرابحة كنانة الإسلامية. خطاب فك الحظر يصدر من الإدارة المركزية للقروض.'
  },

  // 5. QNB Egypt
  'qnb': {
    bankName: 'QNB Egypt',
    bankNameAr: 'بنك قطر الوطني الأهلي',
    category: 'commercial_bank',
    earlySettlementRate: 0.07,
    earlySettlementNoteAr: '7% من أصل الدين المتبقي للسداد المعجل',
    buyoutRate: 0.13,
    buyoutAllowed: true,
    buyoutNoteAr: '13% عمولة شراء مديونية للسيارات المنقولة لبنك آخر',
    releaseLetterFee: 250,
    trafficLetterFee: 150,
    clearanceFee: 200,
    avgSettlementDays: 4,
    officialSource: 'qnb.com.eg/easy-auto - كود CBE 005',
    verificationDate: '2026-01-12',
    notesAr: 'برنامج إيزي أوتو. يتم فك الحظر خلال 4 أيام عمل ويُرسل خطاب المرور عبر خدمة العملاء بالفرع.'
  },

  // 6. Bank of Alexandria (AlexBank)
  'alexbank': {
    bankName: 'Bank of Alexandria (AlexBank)',
    bankNameAr: 'بنك الإسكندرية',
    category: 'commercial_bank',
    earlySettlementRate: 0.10,
    earlySettlementNoteAr: '10% من أصل الرصيد المدين المتبقي',
    buyoutRate: 0.10,
    buyoutAllowed: true,
    buyoutNoteAr: '10% عمولة تحويل المديونية',
    releaseLetterFee: 200,
    trafficLetterFee: 150,
    clearanceFee: 150,
    avgSettlementDays: 5,
    officialSource: 'alexbank.com - كود CBE 006',
    verificationDate: '2026-01-14',
    notesAr: 'مجموعة إنتيسا سان باولو. يُشترط سداد مصاريف الشهادة وإبراء الذمة.'
  },

  // 7. Banque du Caire
  'banque_du_caire': {
    bankName: 'Banque du Caire',
    bankNameAr: 'بنك القاهرة',
    category: 'commercial_bank',
    earlySettlementRate: 0.10,
    earlySettlementNoteAr: '10% من أصل الدين المتبقي',
    buyoutRate: 0.15,
    buyoutAllowed: true,
    buyoutNoteAr: '15% عمولة سداد مشتري خارجي',
    releaseLetterFee: 200,
    trafficLetterFee: 100,
    clearanceFee: 100,
    avgSettlementDays: 6,
    officialSource: 'bdc.com.eg/loans/car - كود CBE 007',
    verificationDate: '2026-01-15',
    notesAr: 'قرض سيارة بنك القاهرة. يتطلب موافقة الفرع واستخراج تسوية مكتوبة قبل الإيداع.'
  },

  // 8. HSBC Bank Egypt
  'hsbc': {
    bankName: 'HSBC Bank Egypt',
    bankNameAr: 'بنك إتش إس بي سي مصر',
    category: 'commercial_bank',
    earlySettlementRate: 0.07,
    earlySettlementNoteAr: '7% من أصل القرض النقدي',
    buyoutRate: 0.10,
    buyoutAllowed: true,
    buyoutNoteAr: '10% عمولة بيع التمويل لبنك آخر',
    releaseLetterFee: 0, // No lien placed on car
    trafficLetterFee: 0,
    clearanceFee: 150,
    avgSettlementDays: 2,
    officialSource: 'hsbc.com.eg/loans/personal-loan - كود CBE 008',
    verificationDate: '2026-01-20',
    notesAr: 'يقدم تمويل سيارات كقرض شخصي نقدي بدون وضع حظر بيع بالرخصة؛ الرخصة حرة وتُنقل الملكية فوراً.'
  },

  // 9. First Abu Dhabi Bank Misr (FABMISR)
  'fabmisr': {
    bankName: 'First Abu Dhabi Bank Misr (FABMISR)',
    bankNameAr: 'بنك أبوظبي الأول مصر',
    category: 'commercial_bank',
    earlySettlementRate: 0.06,
    earlySettlementNoteAr: '6% للقروض غير المضمونة، 15% للمضمونة بأوعية',
    buyoutRate: 0.08,
    buyoutAllowed: true,
    buyoutNoteAr: '8% عمولة نقل التمويل',
    releaseLetterFee: 300,
    trafficLetterFee: 150,
    clearanceFee: 150,
    avgSettlementDays: 4,
    officialSource: 'fabmisr.com.eg - كود CBE 009',
    verificationDate: '2026-01-18',
    notesAr: 'إجراءات رقمية سريعة، ويتم فك الحظر بالتعاون مع المرور المختص.'
  },

  // 10. Abu Dhabi Islamic Bank (ADIB Egypt)
  'adib': {
    bankName: 'Abu Dhabi Islamic Bank (ADIB Egypt)',
    bankNameAr: 'مصرف أبوظبي الإسلامي - مصر',
    category: 'islamic_bank',
    earlySettlementRate: 0.05,
    earlySettlementNoteAr: 'إسقاط الأرباح المستقبلية غير المستحقة + 5% مصاريف إدارية شرعية',
    buyoutRate: 0.07,
    buyoutAllowed: true,
    buyoutNoteAr: '7% عمولة سداد مديونية مرابحة',
    releaseLetterFee: 1000,
    trafficLetterFee: 300,
    clearanceFee: 300,
    avgSettlementDays: 4,
    officialSource: 'adib.eg/consumer-banking/personal-finance/auto-finance - كود CBE 010',
    verificationDate: '2026-01-20',
    notesAr: 'مرابحة متوافقة 100% مع الشريعة الإسلامية. يتم خصم هامش الربح للسنوات المتبقية عند السداد المعجل.'
  },

  // 11. Faisal Islamic Bank of Egypt
  'faisal_bank': {
    bankName: 'Faisal Islamic Bank of Egypt',
    bankNameAr: 'بنك فيصل الإسلامي المصري',
    category: 'islamic_bank',
    earlySettlementRate: 0.05,
    earlySettlementNoteAr: 'تسوية أرباح المرابحة طبقاً لقرارات هيئة الرقابة الشرعية',
    buyoutRate: 0.06,
    buyoutAllowed: true,
    buyoutNoteAr: '6% عمولة تسوية مرابحة',
    releaseLetterFee: 250,
    trafficLetterFee: 150,
    clearanceFee: 100,
    avgSettlementDays: 5,
    officialSource: 'faisalbank.com.eg/murabaha-cars - كود CBE 011',
    verificationDate: '2026-01-15',
    notesAr: 'أول بنك إسلامي في مصر. حظر البيع يفك بموجب خطاب موجه لوحدة المرور بعد مراجعة الحسابات الختامية.'
  },

  // 12. Al Baraka Bank Egypt
  'albaraka': {
    bankName: 'Al Baraka Bank Egypt',
    bankNameAr: 'بنك البركة - مصر',
    category: 'islamic_bank',
    earlySettlementRate: 0.05,
    earlySettlementNoteAr: '5% مصاريف سداد معجل طبقاً لضوابط المرابحة',
    buyoutRate: 0.07,
    buyoutAllowed: true,
    buyoutNoteAr: '7% عمولة نقل مديونية',
    releaseLetterFee: 250,
    trafficLetterFee: 150,
    clearanceFee: 150,
    avgSettlementDays: 5,
    officialSource: 'albaraka.com.eg - كود CBE 012',
    verificationDate: '2026-01-12',
    notesAr: 'مرابحة إسلامية. يستلزم التنسيق مع فرع المعاملات الإسلامية لخصم الأرباح المؤجلة.'
  },

  // 13. Arab African International Bank (AAIB)
  'aaib': {
    bankName: 'Arab African International Bank (AAIB)',
    bankNameAr: 'البنك العربي الإفريقي الدولي',
    category: 'commercial_bank',
    earlySettlementRate: 0.07,
    earlySettlementNoteAr: '7% من أصل الرصيد المدين المتبقي',
    buyoutRate: 0.10,
    buyoutAllowed: true,
    buyoutNoteAr: '10% عمولة شراء مديونية',
    releaseLetterFee: 300,
    trafficLetterFee: 150,
    clearanceFee: 150,
    avgSettlementDays: 4,
    officialSource: 'aaib.com/retail/loans/auto-loan - كود CBE 013',
    verificationDate: '2026-01-16',
    notesAr: 'برنامج تمويل السيارات الجديدة والمستعملة. خطاب رفع الحظر يصدر بعد تسوية آخر يوم فوائد.'
  },

  // 14. Contact Auto (Consumer Finance & Leasing)
  'contact': {
    bankName: 'Contact Auto (Contact Financial Holding)',
    bankNameAr: 'كونتكت للتمويل الاستهلاكي (Contact Auto)',
    category: 'consumer_finance',
    earlySettlementRate: 0.04, // 4% FRA regulated
    earlySettlementNoteAr: '4% من الرصيد المدين المتبقي طبقاً لضوابط الهيئة العامة للرقابة المالية',
    buyoutRate: 0.06,
    buyoutAllowed: true,
    buyoutNoteAr: '6% عمولة تسوية للجهات الخارجية',
    releaseLetterFee: 1500,
    trafficLetterFee: 400,
    clearanceFee: 300,
    avgSettlementDays: 3,
    officialSource: 'contact.eg / 16177 - شركة تمويل مرخصة من FRA',
    verificationDate: '2026-01-20',
    notesAr: 'أكبر شركة تمويل سيارات في مصر. سرعة إصدار خطاب فك الحظر خلال 48 إلى 72 ساعة من فروع كونتكت.'
  },

  // 15. Valu Consumer Finance (U-Drive)
  'valu': {
    bankName: 'Valu (U-Drive)',
    bankNameAr: 'فاليو للتمويل الاستهلاكي (U-Drive)',
    category: 'consumer_finance',
    earlySettlementRate: 0.05,
    earlySettlementNoteAr: '5% من أصل المديونية المتبقية عبر تطبيق فاليو',
    buyoutRate: 0.07,
    buyoutAllowed: true,
    buyoutNoteAr: '7% عمولة إنهاء مبكر',
    releaseLetterFee: 1500,
    trafficLetterFee: 500,
    clearanceFee: 400,
    avgSettlementDays: 3,
    officialSource: 'valu.com.eg / 16671 - برنامج U-Drive للسيارات',
    verificationDate: '2026-01-20',
    notesAr: 'يمكن التحقق من رصيد التسوية اللحظي عبر تطبيق فاليو الرقمي واستلام خطاب المرور من الفرع الرئيسي.'
  },

  // 16. Souhoola (BM Consumer Finance)
  'souhoola': {
    bankName: 'Souhoola Consumer Finance',
    bankNameAr: 'سهولة للتمويل الاستهلاكي (بنك مصر)',
    category: 'consumer_finance',
    earlySettlementRate: 0.045,
    earlySettlementNoteAr: '4.5% من أصل الدين المتبقي',
    buyoutRate: 0.07,
    buyoutAllowed: true,
    buyoutNoteAr: '7% عمولة تسوية ونقل',
    releaseLetterFee: 800,
    trafficLetterFee: 300,
    clearanceFee: 200,
    avgSettlementDays: 3,
    officialSource: 'souhoola.com / 19048',
    verificationDate: '2026-01-15',
    notesAr: 'تابعة لبنك مصر للتمويل الاستهلاكي. يلزم استخراج بيان مديونية معتمد من إدارة العمليات.'
  },

  // 17. Aman Consumer Finance
  'aman': {
    bankName: 'Aman Consumer Finance (Raya)',
    bankNameAr: 'أمان للتمويل الاستهلاكي (راية)',
    category: 'consumer_finance',
    earlySettlementRate: 0.05,
    earlySettlementNoteAr: '5% طبقاً لجدول استرداد أقساط راية وأمان',
    buyoutRate: 0.08,
    buyoutAllowed: true,
    buyoutNoteAr: '8% عمولة تسوية خارجية',
    releaseLetterFee: 900,
    trafficLetterFee: 300,
    clearanceFee: 200,
    avgSettlementDays: 4,
    officialSource: 'amanstores.com / 19910',
    verificationDate: '2026-01-14',
    notesAr: 'يلزم استرداد الشيكات أو إيصالات الأمانة المودعة كضمان عند استلام المخالصة النهائية.'
  },

  // 18. Drive (GB Corp)
  'drive': {
    bankName: 'Drive Consumer Finance (GB Corp)',
    bankNameAr: 'درايف للتمويل وخدمات التقسيط (GB Corp غبور)',
    category: 'consumer_finance',
    earlySettlementRate: 0.04,
    earlySettlementNoteAr: '4% من أصل الدين المتبقي',
    buyoutRate: 0.06,
    buyoutAllowed: true,
    buyoutNoteAr: '6% عمولة تسوية كاملة',
    releaseLetterFee: 1200,
    trafficLetterFee: 400,
    clearanceFee: 300,
    avgSettlementDays: 3,
    officialSource: 'drive.com.eg / 16757',
    verificationDate: '2026-01-18',
    notesAr: 'متخصصة في تقسيط سيارات هيونداي وشيري وشيفروليه ومازدا. خطاب فك الحظر يصدر من فرع غبور.'
  },

  // 19. Corplease (Financial Leasing)
  'corplease': {
    bankName: 'Corplease (Financial Leasing)',
    bankNameAr: 'المصرية للتأجير التمويلي (كوربليس)',
    category: 'leasing',
    earlySettlementRate: 0.06,
    earlySettlementNoteAr: 'سداد القيمة الحالية للأقساط المتبقية مخصومة + القيمة التخريدية (Residual Value)',
    buyoutRate: 0.08,
    buyoutAllowed: true,
    buyoutNoteAr: 'يتطلب موافقة لجنة الائتمان بشركة التأجير',
    releaseLetterFee: 3000,
    trafficLetterFee: 800,
    clearanceFee: 1000,
    avgSettlementDays: 10,
    officialSource: 'corplease.com - خاضعة لقانون التأجير التمويلي 176/2018',
    verificationDate: '2026-01-15',
    notesAr: 'السيارة مملوكة رسمياً لشركة التأجير والمستأجر له حق انتفاع فقط. لا يجوز البيع بتوكيل؛ يلزم ممارسة خيار الشراء أولاً ونقل الملكية للمستأجر أو المشتري المعتمد.'
  }
};

// Helper to search institutions
export function searchFinancialInstitutions(query: string): BankFeeInfo[] {
  const q = query.trim().toLowerCase();
  const all = Object.values(COMPREHENSIVE_BANK_DATABASE);
  if (!q) return all;
  return all.filter(
    (b) => b.bankNameAr.toLowerCase().includes(q) || b.bankName.toLowerCase().includes(q)
  );
}
