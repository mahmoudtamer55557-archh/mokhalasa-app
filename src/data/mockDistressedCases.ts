import { DistressedVehicleCase, EmployeeUser } from '../types';
import { INITIAL_CARS } from './mockData';

export const MOCK_EMPLOYEES: EmployeeUser[] = [
  {
    id: 'emp-mahmoud',
    name: 'محمود تامر',
    email: 'mahmoud@mokhalasa.com',
    role: 'owner',
    assignedCasesCount: 12,
    isActive: true
  },
  {
    id: 'emp-2',
    name: 'أحمد الشريف',
    email: 'ahmed@mokhalasa.com',
    role: 'case_officer',
    assignedCasesCount: 3,
    isActive: true
  }
];

export const INITIAL_DISTRESSED_CASES: DistressedVehicleCase[] = [
  {
    caseReference: 'MK-CASE-2026-001',
    accessKey: 'MK-SEC-101',
    createdAt: '2026-10-18',
    status: 'listing_approved',
    assignedEmployeeId: 'emp-2',
    assignedEmployeeName: 'أحمد الشريف',
    urgency: 'very_urgent',
    distressReason: 'installment_burden',
    distressReasonNotes: 'تراكم أقساط شهرية 9,400 ج.م على المقترض ويرغب في إغلاق القرض بالكامل لتفادي الفوائد.',
    seller: {
      name: 'م. طارق العسلي',
      phone: '01012345678',
      preferredContactTime: 'مساءً (من 5 إلى 9 مساءً)',
      governorate: 'القاهرة',
      city: 'التجمع الخامس (القاهرة الجديدة)',
      relationship: 'direct_owner'
    },
    vehicle: INITIAL_CARS[0],
    disclosedIssues: ['صيانة الأربعين ألف قادمة بعد 6,000 كم', 'خدش بسيط سطحي بالإكصدام الخلفي'],
    sellerConditionStory: 'السيارة بحالة فابريكا بالكامل من الزيرو، تم عمل جميع الصيانات في توكيل نيسان بالكتالوج. لا توجد أي حوادث سابقة. البيع فقط لعدم القدرة على الاستمرار في دفع القسط الشهري لكريدي أجريكول.',
    financing: {
      institutionKey: 'credit_agricole',
      institutionName: 'بنك كريدي أجريكول مصر',
      productType: 'قرض سيارة ملاكي تقليدي',
      estimatedOutstandingPrincipal: 260000,
      monthlyInstallment: 9400,
      remainingMonths: 32,
      arrearsAmount: 0,
      hasOfficialStatement: true,
      statementDate: '2026-10-15',
      isVerifiedByStaff: true,
      verifiedSettlementAmount: 301600,
      unverifiedNotice: 'تم التحقق من خطاب السداد المعجل الصادر من بنك كريدي أجريكول.'
    },
    valuation: {
      estimatedMarketRange: { min: 640000, max: 670000 },
      suggestedAskingPrice: 620000,
      suggestedFasterSaleRange: { min: 610000, max: 625000 },
      buyerInterestIndicator: 'مرتفع جداً (طلب قوي)',
      confidenceLevel: 'عالية (بيانات وفيرة)',
      comparableCount: 4,
      sources: [
        { name: 'ContactCars (2026-10-18)', timestamp: '2026-10-18' },
        { name: 'YallaMotor Egypt (2026-10-19)', timestamp: '2026-10-19' }
      ],
      valueFactors: [
        { factor: 'حالة الفابريكا وسجل التوكيل', impact: 'positive', description: 'حالة ممتازة ترفع سرعة البيع' },
        { factor: 'عامل الاستعجال', impact: 'neutral', description: 'تم تسعيرها بخصم 40 ألف عن متوسط السوق للتخارج السريع' }
      ],
      missingInfoNotes: [],
      sellerPotentialNet: 318400,
      disclaimerAr: 'التقييم تقديري بناءً على أسعار السوق المتاحة وحالة الفابريكا.'
    },
    settlementStatement: {
      grossSalePrice: 620000,
      lenderSettlementAmount: 260000,
      lenderSettlementSource: 'خطاب رسمي صادر من بنك كريدي أجريكول مصر فرع التجمع',
      lenderSettlementValidityDate: '2026-10-28',
      earlySettlementFee: 39000, // 15%
      releaseLetterFee: 2000,
      trafficAndGovFees: 600,
      inspectionFee: 1200,
      platformCommission: 9300, // 1.5% of 620k
      commissionRate: 0.015,
      otherCosts: [],
      totalDeductions: 312100,
      netProceedsToSeller: 307900,
      shortfallAmount: 0,
      isShortfall: false,
      isPreliminary: false,
      sellerAccepted: true,
      buyerAccepted: false
    },
    callLogs: [
      {
        id: 'cl-1',
        caseId: 'MK-CASE-2026-001',
        employeeId: 'emp-2',
        employeeName: 'أحمد الشريف',
        contactType: 'phone_call',
        party: 'seller',
        outcome: 'answered_agreed',
        notes: 'تم التواصل مع البائع م. طارق ومراجعة أصل المديونية، وأكد جاهزية خطاب السداد المعجل الصادر من كريدي أجريكول.',
        followUpDate: '2026-10-24',
        createdAt: '2026-10-19 14:30'
      }
    ],
    timeline: [
      {
        id: 'tm-1',
        caseId: 'MK-CASE-2026-001',
        status: 'new_request',
        changedBy: 'النظام الآلي',
        reason: 'تسجيل طلب تخارج جديد من الموقع',
        timestamp: '2026-10-18 10:15'
      },
      {
        id: 'tm-2',
        caseId: 'MK-CASE-2026-001',
        status: 'eligibility_review',
        changedBy: 'أحمد الشريف',
        reason: 'التحقق من وجود حظر بيع رسمي وسريان رخصة التسيير',
        timestamp: '2026-10-18 12:40'
      },
      {
        id: 'tm-3',
        caseId: 'MK-CASE-2026-001',
        status: 'listing_approved',
        changedBy: 'م. كريم عبد الرحمن',
        reason: 'اعتماد نشر السيارة للمشترين بعد مطابقة خطاب المديونية',
        timestamp: '2026-10-19 16:00'
      }
    ],
    buyerInquiries: [
      {
        id: 'inq-1',
        caseReference: 'MK-CASE-2026-001',
        carId: 'car-1',
        carTitle: 'Nissan Sunny 2023',
        buyerName: 'د. سامح فوزي',
        buyerPhone: '01223456789',
        purchaseIntent: 'direct_bank_settlement',
        offeredPrice: 615000,
        preferredContactTime: 'صباحاً',
        message: 'مستعد لدفع تسوية البنك نقداً بالفرع في يوم الفحص.',
        status: 'qualified',
        createdAt: '2026-10-21',
        assignedEmployeeName: 'أحمد الشريف'
      }
    ],
    internalNotes: [
      'العميل ملتزم جداً ولديه خطاب مديونية سارٍ حتى نهاية الشهر.',
      'تم إبلاغ المشتري بأن الإيداع النقدي يتم في خزينة كريدي أجريكول مباشرة.'
    ],
    documents: [],
    editStatus: 'none',
    revisions: [
      {
        id: 'rev-1',
        caseId: 'MK-CASE-2026-001',
        timestamp: '2026-10-20 14:00',
        changedBy: 'seller',
        authorName: 'م. طارق العسلي',
        fieldKey: 'askingPrice',
        fieldLabelAr: 'السعر المطلوب',
        previousValue: 635000,
        newValue: 620000,
        isFinancialOrLegal: false,
        requiresStaffReview: true,
        reviewStatus: 'approved',
        reviewNotes: 'تمت الموافقة وتعديل السعر المعلن لدعم سرعة البيع.',
        reviewedBy: 'أحمد الشريف',
        reviewedAt: '2026-10-20 15:30'
      }
    ]
  },
  {
    caseReference: 'MK-CASE-2026-002',
    accessKey: 'MK-SEC-202',
    createdAt: '2026-10-19',
    status: 'offer_received',
    assignedEmployeeId: 'emp-3',
    assignedEmployeeName: 'سارة مجدي',
    urgency: 'urgent',
    distressReason: 'relocation_travel',
    distressReasonNotes: 'سفر مفاجئ للخارج والرغبة في تصفية الالتزامات البنكية لدى CIB قبل ميعاد السفر.',
    seller: {
      name: 'أ. حسام الدين شلبي',
      phone: '01123456789',
      preferredContactTime: 'ظهراً',
      governorate: 'القاهرة',
      city: 'مصر الجديدة (هليوبوليس)',
      relationship: 'direct_owner'
    },
    vehicle: INITIAL_CARS[1],
    disclosedIssues: ['حكة بسيطة في الإكصدام الأمامي تم علاجها بالتوكيل'],
    sellerConditionStory: 'هيونداي إلنترا CN7 فئة أدفانسد صيانة توكيل غبور، عليها قرض في البنك التجاري الدولي بقسط 32 ألف شهرياً ومتبقي نحو 980 ألف أصل دين. أرغب في بيعها لمشتري يدفع المديونية مباشرة للبنك.',
    financing: {
      institutionKey: 'cib',
      institutionName: 'البنك التجاري الدولي - مصر (CIB)',
      productType: 'قرض سيارة بضمان حظر بيع',
      estimatedOutstandingPrincipal: 980000,
      monthlyInstallment: 32000,
      remainingMonths: 40,
      arrearsAmount: 0,
      hasOfficialStatement: true,
      statementDate: '2026-10-18',
      isVerifiedByStaff: true,
      verifiedSettlementAmount: 1050100,
      unverifiedNotice: 'تمت مطابقة بيان المديونية الرسمي الصادر من CIB.'
    },
    valuation: {
      estimatedMarketRange: { min: 1200000, max: 1250000 },
      suggestedAskingPrice: 1160000,
      suggestedFasterSaleRange: { min: 1150000, max: 1180000 },
      buyerInterestIndicator: 'مرتفع جداً (طلب قوي)',
      confidenceLevel: 'عالية (بيانات وفيرة)',
      comparableCount: 3,
      sources: [{ name: 'ContactCars (2026-10-19)', timestamp: '2026-10-19' }],
      valueFactors: [{ factor: 'سعر تنافسي جداً وفر 60 ألف للمشتري', impact: 'positive', description: 'فرصة سريعة' }],
      missingInfoNotes: [],
      sellerPotentialNet: 109900,
      disclaimerAr: 'التقييم مبني على حالة الفابريكا ومقارنات السوق المصري.'
    },
    settlementStatement: {
      grossSalePrice: 1160000,
      lenderSettlementAmount: 980000,
      lenderSettlementSource: 'بيان مديونية CIB رسمي مختوم',
      lenderSettlementValidityDate: '2026-10-30',
      earlySettlementFee: 68600, // 7%
      releaseLetterFee: 1500,
      trafficAndGovFees: 800,
      inspectionFee: 1200,
      platformCommission: 17400, // 1.5% of 1.16M
      commissionRate: 0.015,
      otherCosts: [],
      totalDeductions: 1069500,
      netProceedsToSeller: 90500,
      shortfallAmount: 0,
      isShortfall: false,
      isPreliminary: false,
      sellerAccepted: true,
      buyerAccepted: true
    },
    callLogs: [],
    timeline: [],
    buyerInquiries: [],
    internalNotes: ['المشتري حازم موافق على إيداع تسوية CIB بالفرع يوم الخميس القادم.'],
    documents: [],
    editStatus: 'pending_review',
    pendingEditsCount: 1,
    revisions: [
      {
        id: 'rev-2',
        caseId: 'MK-CASE-2026-002',
        timestamp: '2026-10-21 20:15',
        changedBy: 'seller',
        authorName: 'أ. حسام الدين شلبي',
        fieldKey: 'askingPrice',
        fieldLabelAr: 'السعر المطلوب',
        previousValue: 1180000,
        newValue: 1160000,
        isFinancialOrLegal: false,
        requiresStaffReview: true,
        reviewStatus: 'pending_review',
        reviewNotes: 'طلب تخفيض السعر بمقدار 20 ألف لتسريع إجراءات السفر والتخارج.'
      }
    ]
  },
  {
    caseReference: 'MK-CASE-2026-003',
    accessKey: 'MK-SEC-303',
    createdAt: '2026-10-20',
    status: 'on_hold',
    assignedEmployeeId: 'emp-2',
    assignedEmployeeName: 'أحمد الشريف',
    urgency: 'very_urgent',
    distressReason: 'installment_burden',
    distressReasonNotes: 'عجز مالي سلبي: المديونية البنكية أعلى من القيمة السوقية للسيارة (Negative Equity).',
    seller: {
      name: 'أ. محمود عبد الشافي',
      phone: '01099887766',
      preferredContactTime: 'أي وقت',
      governorate: 'الجيزة',
      city: 'الشيخ زايد',
      relationship: 'direct_owner'
    },
    vehicle: INITIAL_CARS[2],
    disclosedIssues: ['رش نظافة في الإكصدامين الأمامي والخلفي'],
    sellerConditionStory: 'شيري تيجو 7 هايلين بانوراما تمويل QNB، القسط 24,500 ج.م وأصل الدين المتبقي 760 ألف. السداد المعجل يتطلب نحو 815 ألف بينما سعر البيع 790 ألف. تم تعليق الحالة للتنسيق مع البائع لسداد الفارق نقداً.',
    financing: {
      institutionKey: 'qnb',
      institutionName: 'بنك قطر الوطني الأهلي (QNB Egypt)',
      productType: 'قرض سيارة ملاكي',
      estimatedOutstandingPrincipal: 760000,
      monthlyInstallment: 24500,
      remainingMonths: 36,
      arrearsAmount: 0,
      hasOfficialStatement: true,
      statementDate: '2026-10-19',
      isVerifiedByStaff: true,
      verifiedSettlementAmount: 815200,
      unverifiedNotice: 'تم التحقق من خطاب السداد المعجل لـ QNB.'
    },
    valuation: {
      estimatedMarketRange: { min: 820000, max: 850000 },
      suggestedAskingPrice: 790000,
      suggestedFasterSaleRange: { min: 780000, max: 800000 },
      buyerInterestIndicator: 'متوسط',
      confidenceLevel: 'عالية (بيانات وفيرة)',
      comparableCount: 3,
      sources: [{ name: 'ContactCars (2026-10-21)', timestamp: '2026-10-21' }],
      valueFactors: [{ factor: 'عجز مالي', impact: 'negative', description: 'المديونية أكبر من ثمن السيارة' }],
      missingInfoNotes: [],
      sellerPotentialNet: 0,
      disclaimerAr: 'حالة عجز مالي تتطلب ضخ كاش من البائع لإغلاق الملف.'
    },
    settlementStatement: {
      grossSalePrice: 790000,
      lenderSettlementAmount: 760000,
      lenderSettlementSource: 'خطاب QNB سداد معجل',
      lenderSettlementValidityDate: '2026-10-29',
      earlySettlementFee: 53200, // 7%
      releaseLetterFee: 2000,
      trafficAndGovFees: 800,
      inspectionFee: 1200,
      platformCommission: 11850,
      commissionRate: 0.015,
      otherCosts: [],
      totalDeductions: 829050,
      netProceedsToSeller: -39050,
      shortfallAmount: 39050,
      isShortfall: true,
      isPreliminary: false,
      sellerAccepted: false,
      buyerAccepted: false
    },
    callLogs: [],
    timeline: [],
    buyerInquiries: [],
    internalNotes: ['تم وضع الحالة قيد التعليق (On Hold) لحين تأكيد البائع تجهيز مبلغ العجز 39,050 ج.م.'],
    documents: [],
    editStatus: 'none',
    revisions: []
  }
];
