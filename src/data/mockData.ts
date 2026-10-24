import { BankFeeInfo, Car } from '../types';

export const BANK_FEE_DATABASE: Record<string, BankFeeInfo> = {
  'credit_agricole': {
    bankName: 'Crédit Agricole Egypt',
    bankNameAr: 'بنك كريدي أجريكول مصر',
    earlySettlementRate: 0.15, // 15% verified Ref 1-2026
    buyoutRate: 0.20,         // 20% verified
    releaseLetterFee: 2000,   // EGP verified
    trafficLetterFee: 600,
    clearanceFee: 500,
    avgSettlementDays: 5
  },
  'cib': {
    bankName: 'Commercial International Bank (CIB)',
    bankNameAr: 'البنك التجاري الدولي - مصر',
    earlySettlementRate: 0.07, // 7% verified
    buyoutRate: 0.10,         // 10% verified
    releaseLetterFee: 150,    // EGP verified
    trafficLetterFee: 150,
    clearanceFee: 150,
    avgSettlementDays: 4
  },
  'nbe': {
    bankName: 'National Bank of Egypt (NBE)',
    bankNameAr: 'البنك الأهلي المصري',
    earlySettlementRate: 0.035, // 3.5% verified
    buyoutRate: 0.035,
    releaseLetterFee: 150,
    trafficLetterFee: 100,
    clearanceFee: 100,
    avgSettlementDays: 6
  },
  'banque_misr': {
    bankName: 'Banque Misr',
    bankNameAr: 'بنك مصر',
    earlySettlementRate: 0.06,
    buyoutRate: 0.10,
    releaseLetterFee: 200,
    trafficLetterFee: 150,
    clearanceFee: 150,
    avgSettlementDays: 5
  },
  'qnb': {
    bankName: 'QNB Egypt',
    bankNameAr: 'بنك قطر الوطني الأهلي',
    earlySettlementRate: 0.07,
    buyoutRate: 0.13,
    releaseLetterFee: 250,
    trafficLetterFee: 150,
    clearanceFee: 200,
    avgSettlementDays: 4
  },
  'alexbank': {
    bankName: 'Bank of Alexandria (AlexBank)',
    bankNameAr: 'بنك الإسكندرية',
    earlySettlementRate: 0.10,
    buyoutRate: 0.10,
    releaseLetterFee: 200,
    trafficLetterFee: 150,
    clearanceFee: 100,
    avgSettlementDays: 5
  },
  'adib': {
    bankName: 'Abu Dhabi Islamic Bank (ADIB Egypt)',
    bankNameAr: 'مصرف أبوظبي الإسلامي - مصر',
    earlySettlementRate: 0.04,
    buyoutRate: 0.07,
    releaseLetterFee: 1000,
    trafficLetterFee: 800,
    clearanceFee: 300,
    avgSettlementDays: 5
  },
  'contact': {
    bankName: 'Contact Consumer Finance',
    bankNameAr: 'شركة كونتكت للتمويل الاستهلاكي',
    earlySettlementRate: 0.04,
    buyoutRate: 0.06,
    releaseLetterFee: 1500,
    trafficLetterFee: 500,
    clearanceFee: 400,
    avgSettlementDays: 3
  },
  'drive': {
    bankName: 'Drive Consumer Finance (GB Corp)',
    bankNameAr: 'شركة درايف للتمويل الاستهلاكي',
    earlySettlementRate: 0.045,
    buyoutRate: 0.07,
    releaseLetterFee: 1500,
    trafficLetterFee: 500,
    clearanceFee: 400,
    avgSettlementDays: 3
  },
  'valu': {
    bankName: 'Valu (U-Drive)',
    bankNameAr: 'فاليو للتمويل الاستهلاكي',
    earlySettlementRate: 0.05,
    buyoutRate: 0.07,
    releaseLetterFee: 1500,
    trafficLetterFee: 500,
    clearanceFee: 400,
    avgSettlementDays: 3
  }
};

export const INITIAL_CARS: Car[] = [
  {
    id: 'car-1',
    make: 'Nissan',
    model: 'Sunny',
    year: 2023,
    trim: 'Super Saloon (أعلى فئة بصمة)',
    transmission: 'أوتوماتيك',
    engineSize: '1500 cc',
    mileage: 28000,
    city: 'القاهرة - مدينة نصر',
    cityEn: 'Cairo - Nasr City',
    color: 'برونزي ميتاليك',
    askingPrice: 620000,
    estimatedMarketValue: 660000,
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
    ],
    financingType: 'bank_loan',
    financingDetails: {
      providerName: 'Crédit Agricole Egypt',
      providerNameAr: 'بنك كريدي أجريكول مصر',
      financingType: 'bank_loan',
      outstandingPrincipal: 260000,
      monthlyInstallment: 9400,
      remainingMonths: 32,
      earlySettlementFee: 39000, // 15% of 260k
      releaseFee: 2600,         // Release letter 2000 + traffic letter 600
      totalSettlementRequired: 301600,
      hasSaleBan: true,
      sellerNetProceeds: 318400 // 620k - 301.6k
    },
    inspection: {
      isInspected: true,
      score: 94,
      inspectorName: 'مركز أوتوتشيك المعتمد',
      date: '2026-10-18',
      engineCondition: 'ممتاز',
      transmissionCondition: 'ممتاز',
      paintCondition: 'فابريكا بالكامل',
      chassisStatus: 'سليم 100% بدون أي ملاحظات',
      notes: 'السيارة بحالة المصنع بالكامل، كافة الصيانات تمت بانتظام في التوكيل بالفواتير، إطارات بحالة 85%.'
    },
    licenseValidityMonths: 18,
    trafficDepartment: 'مرور النزهة',
    sellerType: 'مالك أول',
    status: 'active',
    createdAt: '2026-10-19',
    featured: true,
    description: 'نيسان صني سوبر صالون موديل 2023 فابريكا بالكامل بدون أي دهانات، مالك أول من الزيرو، عليها قرض بنكي متبقي 260 ألف في كريدي أجريكول، البيع عن طريق السداد المباشر للبنك ونقل الملكية فوراً.'
  },
  {
    id: 'car-2',
    make: 'Hyundai',
    model: 'Elantra CN7',
    year: 2022,
    trim: 'Advanced (الفئة الثالثة)',
    transmission: 'أوتوماتيك',
    engineSize: '1600 cc',
    mileage: 48000,
    city: 'القاهرة - مصر الجديدة',
    cityEn: 'Cairo - Heliopolis',
    color: 'رمادي فيراني',
    askingPrice: 1160000,
    estimatedMarketValue: 1220000,
    images: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80'
    ],
    financingType: 'bank_loan',
    financingDetails: {
      providerName: 'Commercial International Bank (CIB)',
      providerNameAr: 'البنك التجاري الدولي - مصر',
      financingType: 'bank_loan',
      outstandingPrincipal: 980000,
      monthlyInstallment: 32000,
      remainingMonths: 40,
      earlySettlementFee: 68600, // 7% of 980k
      releaseFee: 1500,
      totalSettlementRequired: 1050100,
      hasSaleBan: true,
      sellerNetProceeds: 109900 // 1,160,000 - 1,050,100
    },
    inspection: {
      isInspected: true,
      score: 91,
      inspectorName: 'المركز الألماني لفحص السيارات',
      date: '2026-10-15',
      engineCondition: 'ممتاز',
      transmissionCondition: 'ممتاز',
      paintCondition: 'فابريكا بالكامل',
      chassisStatus: 'سليم 100% بدون أي ملاحظات',
      notes: 'حالة الصالون كالجديد، تم عمل صيانة الأربعين ألف بالتوكيل، رخصة سارية بدون مخالفات.'
    },
    licenseValidityMonths: 14,
    trafficDepartment: 'مرور التجمع الخامس',
    sellerType: 'مالك أول',
    status: 'active',
    createdAt: '2026-10-18',
    featured: true,
    description: 'إلنترا CN7 فئة أدفانسد، قسطها 32 ألف بالبنك التجاري الدولي والمتبقي على القرض نحو 980 ألف. فرصة للمشتري للاستفادة من تخفيض فوري والتنازل القانوني المعتمد.'
  },
  {
    id: 'car-3',
    make: 'Chery',
    model: 'Tiggo 7',
    year: 2023,
    trim: 'Highline (بانوراما)',
    transmission: 'أوتوماتيك',
    engineSize: '1500 cc Turbo',
    mileage: 35000,
    city: 'الجيزة - الشيخ زايد',
    cityEn: 'Giza - Sheikh Zayed',
    color: 'أبيض لؤلؤي',
    askingPrice: 790000,
    estimatedMarketValue: 840000,
    images: [
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=80'
    ],
    financingType: 'bank_loan',
    financingDetails: {
      providerName: 'QNB Egypt',
      providerNameAr: 'بنك قطر الوطني الأهلي',
      financingType: 'bank_loan',
      outstandingPrincipal: 760000,
      monthlyInstallment: 24500,
      remainingMonths: 36,
      earlySettlementFee: 53200, // 7% of 760k
      releaseFee: 2000,
      totalSettlementRequired: 815200,
      hasSaleBan: true,
      sellerNetProceeds: -25200 // Negative equity, seller injects cash
    },
    inspection: {
      isInspected: true,
      score: 89,
      inspectorName: 'فحص إكسبريس للسيارات',
      date: '2026-10-12',
      engineCondition: 'ممتاز',
      transmissionCondition: 'جيد جداً',
      paintCondition: 'رش إكصدامات فقط',
      chassisStatus: 'سليم 100% بدون أي ملاحظات',
      notes: 'رش تجميلي نظافة في الإكصدام الأمامي والخلفي، دواخل فابريكا 100%، موتور وعفشة ممتازة.'
    },
    licenseValidityMonths: 9,
    trafficDepartment: 'مرور 6 أكتوبر',
    sellerType: 'مالك أول',
    status: 'active',
    createdAt: '2026-10-18',
    featured: true,
    description: 'شيري تيجو 7 هايلين بانوراما 2023، تمويل بنك QNB، البائع ملتزم بسداد الفارق النقدي لإغلاق القرض فوراً للمشتري الجاد.'
  },
  {
    id: 'car-4',
    make: 'Toyota',
    model: 'Corolla',
    year: 2021,
    trim: 'Active Plus (خليجي)',
    transmission: 'أوتوماتيك',
    engineSize: '1600 cc',
    mileage: 72000,
    city: 'الإسكندرية - سموحة',
    cityEn: 'Alexandria - Smouha',
    color: 'فضي ميتاليك',
    askingPrice: 1040000,
    estimatedMarketValue: 1100000,
    images: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80'
    ],
    financingType: 'bank_loan',
    financingDetails: {
      providerName: 'National Bank of Egypt (NBE)',
      providerNameAr: 'البنك الأهلي المصري',
      financingType: 'bank_loan',
      outstandingPrincipal: 180000,
      monthlyInstallment: 7200,
      remainingMonths: 20,
      earlySettlementFee: 5400, // 3% of 180k
      releaseFee: 1200,
      totalSettlementRequired: 186600,
      hasSaleBan: true,
      sellerNetProceeds: 853400 // 1040k - 186.6k
    },
    inspection: {
      isInspected: true,
      score: 96,
      inspectorName: 'أوتوكير الإسكندرية',
      date: '2026-10-20',
      engineCondition: 'ممتاز',
      transmissionCondition: 'ممتاز',
      paintCondition: 'فابريكا بالكامل',
      chassisStatus: 'سليم 100% بدون أي ملاحظات',
      notes: 'تويوتا كورولا بحالة استثنائية، صيانة الألف إلى السبعين ألف بكتيب الضمان، كاوتش وبطارية جديدة.'
    },
    licenseValidityMonths: 24,
    trafficDepartment: 'مرور أبيس - الإسكندرية',
    sellerType: 'مالك أول',
    status: 'active',
    createdAt: '2026-10-18',
    featured: true,
    description: 'تويوتا كورولا أكتيف بلس، متبقي عليها مبلغ بسيط 180 ألف بالبنك الأهلي، رخصة سارية سنتين، فابريكا بالكامل بدون خدش.'
  },
  {
    id: 'car-5',
    make: 'MG',
    model: '5',
    year: 2022,
    trim: 'Luxury (كاملة أعلى فئة)',
    transmission: 'أوتوماتيك',
    engineSize: '1500 cc',
    mileage: 49000,
    city: 'الجيزة - الدقي',
    cityEn: 'Giza - Dokki',
    color: 'أحمر ملوكي',
    askingPrice: 675000,
    estimatedMarketValue: 715000,
    images: [
      'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80'
    ],
    financingType: 'consumer_finance',
    financingDetails: {
      providerName: 'Contact Consumer Finance',
      providerNameAr: 'شركة كونتكت للتمويل الاستهلاكي',
      financingType: 'consumer_finance',
      outstandingPrincipal: 380000,
      monthlyInstallment: 13500,
      remainingMonths: 30,
      earlySettlementFee: 15200, // 4%
      releaseFee: 1800,
      totalSettlementRequired: 397000,
      hasSaleBan: true,
      sellerNetProceeds: 278000
    },
    inspection: {
      isInspected: true,
      score: 90,
      inspectorName: 'فحص كونتكت المعتمد',
      date: '2026-10-14',
      engineCondition: 'ممتاز',
      transmissionCondition: 'ممتاز',
      paintCondition: 'فابريكا بالكامل',
      chassisStatus: 'سليم 100% بدون أي ملاحظات',
      notes: 'السيارة بحالة ممتازة، فتحة سقف، شاشة، كاميرات 360، رخصة سارية سنة باسم المالك الأول.'
    },
    licenseValidityMonths: 12,
    trafficDepartment: 'مرور الدقي',
    sellerType: 'مالك أول',
    status: 'active',
    createdAt: '2026-10-17',
    featured: false,
    description: 'إم جي 5 لاكشري أعلى فئة، تقسيط كونتكت، فك الحظر سريع خلال 48 ساعة فقط بعد السداد، فرصة ممتازة للمشتري.'
  },
  {
    id: 'car-6',
    make: 'Kia',
    model: 'Sportage',
    year: 2023,
    trim: 'GT Line Plus (بصمة وبانوراما)',
    transmission: 'أوتوماتيك',
    engineSize: '1600 cc Turbo',
    mileage: 29000,
    city: 'القاهرة - الرحاب',
    cityEn: 'Cairo - Rehab City',
    color: 'أسود ميتاليك',
    askingPrice: 1760000,
    estimatedMarketValue: 1860000,
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'
    ],
    financingType: 'consumer_finance',
    financingDetails: {
      providerName: 'Valu Consumer Finance',
      providerNameAr: 'فاليو للتمويل الاستهلاكي (U-Drive)',
      financingType: 'consumer_finance',
      outstandingPrincipal: 1150000,
      monthlyInstallment: 41000,
      remainingMonths: 35,
      earlySettlementFee: 57500, // 5%
      releaseFee: 2500,
      totalSettlementRequired: 1210000,
      hasSaleBan: true,
      sellerNetProceeds: 550000
    },
    inspection: {
      isInspected: true,
      score: 97,
      inspectorName: 'مركز فيت آند فيكس المعتمد',
      date: '2026-10-21',
      engineCondition: 'ممتاز',
      transmissionCondition: 'ممتاز',
      paintCondition: 'فابريكا بالكامل',
      chassisStatus: 'سليم 100% بدون أي ملاحظات',
      notes: 'كسر زيرو حالة نادرة، فرش جلد أصلي، شاشة بانورامية مزدوجة، ضمان الوكيل ساري 5 سنوات.'
    },
    licenseValidityMonths: 20,
    trafficDepartment: 'مرور التجمع',
    sellerType: 'مالك أول',
    status: 'active',
    createdAt: '2026-10-18',
    featured: true,
    description: 'كيا سبورتاج جي تي لاين بلس 2023 كسر زيرو، تمويل فاليو، البائع يرغب في التخارج السريع وتوفير القسط الشهري.'
  },
  {
    id: 'car-7',
    make: 'Fiat',
    model: 'Tipo',
    year: 2022,
    trim: 'Entry Pack Automatic',
    transmission: 'أوتوماتيك',
    engineSize: '1600 cc',
    mileage: 58000,
    city: 'القاهرة - المعادي',
    cityEn: 'Cairo - Maadi',
    color: 'أزرق كحلي',
    askingPrice: 720000,
    estimatedMarketValue: 760000,
    images: [
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80'
    ],
    financingType: 'personal_loan',
    inspection: {
      isInspected: true,
      score: 88,
      inspectorName: 'مركز المعادي للفحص',
      date: '2026-10-10',
      engineCondition: 'جيد جداً',
      transmissionCondition: 'جيد جداً',
      paintCondition: 'رش إكصدامات فقط',
      chassisStatus: 'سليم 100% بدون أي ملاحظات',
      notes: 'رش تجميلي نظافة، صالون ومحرك بحالة جيدة جداً، لا يوجد أي حظر بيع على الرخصة.'
    },
    licenseValidityMonths: 11,
    trafficDepartment: 'مرور المعادي',
    sellerType: 'مالك أول',
    status: 'active',
    createdAt: '2026-10-17',
    featured: false,
    description: 'فيات تيبو أوتوماتيك، تم شراؤها بقرض شخصي نقدي بدون حظر بيع على الرخصة (الرخصة حرة)، نقل الملكية فوري في الشهر العقاري.'
  },
  {
    id: 'car-8',
    make: 'Renault',
    model: 'Megane',
    year: 2023,
    trim: 'Signature Turbo',
    transmission: 'أوتوماتيك',
    engineSize: '1300 cc Turbo',
    mileage: 31000,
    city: 'القاهرة - هليوبوليس',
    cityEn: 'Cairo - Heliopolis',
    color: 'أبيض لؤلؤي',
    askingPrice: 1120000,
    estimatedMarketValue: 1180000,
    images: [
      'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=80'
    ],
    financingType: 'fully_owned',
    inspection: {
      isInspected: true,
      score: 95,
      inspectorName: 'مركز أوتوتشيك',
      date: '2026-10-17',
      engineCondition: 'ممتاز',
      transmissionCondition: 'ممتاز',
      paintCondition: 'فابريكا بالكامل',
      chassisStatus: 'سليم 100% بدون أي ملاحظات',
      notes: 'سيارة حرة بالكامل ملك المالك الأصلي بدون أي قروض أو أقساط، فابريكا بالكامل.'
    },
    licenseValidityMonths: 22,
    trafficDepartment: 'مرور النزهة',
    sellerType: 'مالك أول',
    status: 'active',
    createdAt: '2026-10-17',
    featured: false,
    description: 'رينو ميجان تيربو سيجنتشر أعلى فئة، فابريكا بالكامل، ملكية خالصة بدون أي التزامات بنكية، جاهزة للتسجيل الفوري.'
  }
];
