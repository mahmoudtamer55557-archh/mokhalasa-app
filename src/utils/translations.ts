export type Language = 'ar' | 'en';

export interface Translations {
  // Common terms
  common: {
    egp: string;
    km: string;
    month: string;
    months: string;
    year: string;
    back: string;
    next: string;
    submit: string;
    cancel: string;
    confirm: string;
    close: string;
    loading: string;
    edit: string;
    delete: string;
    save: string;
    login: string;
    register: string;
    logout: string;
    myAccount: string;
    all: string;
    phone: string;
    email: string;
    optional: string;
    mandatory: string;
    price: string;
    showroom: string;
    individual: string;
    jumpToField: string;
  };
  // Navigation
  nav: {
    home: string;
    marketplace: string;
    sellCar: string;
    howItWorks: string;
    faq: string;
    contact: string;
    trackRequest: string;
    askTeam: string;
    opsConsole: string;
    notifications: string;
    markAllRead: string;
    noNotifications: string;
  };
  // 3 Tracks
  tracks: {
    bankSettlement: string;
    bankSettlementDesc: string;
    bankSettlementTag: string;
    directInstallment: string;
    directInstallmentDesc: string;
    directInstallmentTag: string;
    cashSale: string;
    cashSaleDesc: string;
    cashSaleTag: string;
  };
  // Home Page
  home: {
    heroBadge: string;
    heroHeadline1: string;
    heroHeadline2: string;
    heroSubtitle: string;
    track1Title: string;
    track1Desc: string;
    track2Title: string;
    track2Desc: string;
    track3Title: string;
    track3Desc: string;
    btnSellCar: string;
    btnSellCarSub: string;
    btnBrowseCars: string;
    btnBrowseCarsSub: string;
    btnTrackMyRequest: string;
    btnAskTeam: string;
    ribbonProp1: string;
    ribbonProp2: string;
    ribbonProp3: string;
    ribbonProp4: string;
    // Transparency section
    transparencyBadge: string;
    transparencyTitle: string;
    transparencyBadge2: string;
    transparencyDesc: string;
    exampleTitle: string;
    exampleCase: string;
    exampleGross: string;
    exampleBankPayoff: string;
    exampleBankLetter: string;
    exampleGovFees: string;
    exampleGovReceipts: string;
    exampleCommission: string;
    exampleCommissionDesc: string;
    exampleNetCash: string;
    exampleNetCashDesc: string;
    exampleNote: string;
    // Cars Gallery section
    galleryBadge: string;
    galleryTitle: string;
    galleryDesc: string;
    btnViewAllCars: string;
    tabAll: string;
    tabDirect: string;
    tabCash: string;
    tabBank: string;
    noCarsTitle: string;
    noCarsDesc: string;
    btnListYourCar: string;
    // 4-step process
    processBadge: string;
    processTitle: string;
    processDesc: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    step4Title: string;
    step4Desc: string;
    zeroCustodyNote: string;
    detailedGuideLink: string;
    // Risk Comparison
    riskBadge: string;
    riskTitle: string;
    riskDesc: string;
    informalTitle: string;
    informal1: string;
    informal2: string;
    informal3: string;
    informal4: string;
    safeTitle: string;
    safe1: string;
    safe2: string;
    safe3: string;
    safe4: string;
    // Consultation modal
    consultTitle: string;
    consultSuccessTitle: string;
    consultSuccessDesc: string;
    consultNameLabel: string;
    consultPhoneLabel: string;
    consultBankLabel: string;
    consultQuestionLabel: string;
    consultPlaceholder: string;
    consultSubmitBtn: string;
  };
  // Marketplace
  marketplace: {
    badge: string;
    title: string;
    desc: string;
    availableMethods: string;
    searchPlaceholder: string;
    filterAllMakes: string;
    filterFinancingAll: string;
    maxPriceLabel: string;
    sortFeatured: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    sortMileageAsc: string;
    foundCount: string;
    noResultsTitle: string;
    noResultsDesc: string;
    resetFilters: string;
  };
  // Car Detail
  carDetail: {
    backToMarketplace: string;
    statusUnderReview: string;
    statusApproved: string;
    statusRejected: string;
    inspectionReport: string;
    scorePoints: string;
    fullSpec: string;
    transmission: string;
    fuelType: string;
    engineSize: string;
    mileage: string;
    color: string;
    paintCondition: string;
    trafficDepartment: string;
    sellerStory: string;
    directInstallmentPlan: string;
    downPaymentRequired: string;
    monthlyInstallmentValue: string;
    installmentPeriod: string;
    requiredGuarantees: string;
    cashSaleTitle: string;
    cashSaleNotice: string;
    bankSettlementTitle: string;
    bankSettlementNotice: string;
    principalDebt: string;
    earlySettlementFee: string;
    netSellerProceeds: string;
    interestedTitle: string;
    interestedDesc: string;
    contactAdvisor: string;
    submitPurchaseOffer: string;
  };
  // Footer
  footer: {
    tagline: string;
    description: string;
    zeroCustody: string;
    coreActions: string;
    trustAndLegal: string;
    contactInfo: string;
    headquarters: string;
    phoneHotline: string;
    emailSupport: string;
    rightsReserved: string;
  };
}

export const translations: Record<Language, Translations> = {
  ar: {
    common: {
      egp: 'ج.م',
      km: 'كم',
      month: 'شهر',
      months: 'أشهر',
      year: 'سنة',
      back: 'رجوع',
      next: 'المتابعة',
      submit: 'إرسال',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      close: 'إغلاق',
      loading: 'جاري التحميل...',
      edit: 'تعديل',
      delete: 'حذف',
      save: 'حفظ',
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      logout: 'تسجيل الخروج',
      myAccount: 'حسابي',
      all: 'الكل',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      optional: 'اختياري',
      mandatory: 'إجباري',
      price: 'السعر',
      showroom: 'معرض سيارات معتمد',
      individual: 'مالك مباشر',
      jumpToField: 'انتقل للحقل المطلوب الآن ↲'
    },
    nav: {
      home: 'الرئيسية',
      marketplace: 'تصفح السيارات',
      sellCar: 'بيع عربيتك مع مخلصة',
      howItWorks: 'كيف تعمل مخلصة؟',
      faq: 'الأسئلة الشائعة',
      contact: 'تواصل معنا',
      trackRequest: 'متابعة طلبي',
      askTeam: 'اسأل فريق مخلصة عن إجراءات البنك',
      opsConsole: 'العمليات',
      notifications: 'الإشعارات والتنبيهات المباشرة',
      markAllRead: 'تعيين الكل كمقروء',
      noNotifications: 'لا توجد إشعارات جديدة حالياً'
    },
    tracks: {
      bankSettlement: 'تسوية مديونية وحظر بيع بنكي',
      bankSettlementDesc: 'تصفية القرض وسداد معجل بخزينة البنك واستخراج مخالصة فك الحظر رسمياً.',
      bankSettlementTag: '🏦 تسوية وحظر بيع',
      directInstallment: 'تقسيط مباشر بدون بنوك',
      directInstallmentDesc: 'شراء وبيع بالتقسيط المباشر بمقدم ميسر وضمانات مباشرة بدون تعقيدات ائتمانية.',
      directInstallmentTag: '🟡 تقسيط مباشر',
      cashSale: 'بيع كاش (ملكية خالصة)',
      cashSaleDesc: 'تسليم كاش فوري وتنازل رسمي بالشهر العقاري بعد الفحص الفني المعتمد.',
      cashSaleTag: '🟢 بيع كاش'
    },
    home: {
      heroBadge: 'أول منصة في مصر لبيع سيارات المتعثرين وحظر البيع، والتقسيط المباشر، وسيارات الكاش المعتمدة',
      heroHeadline1: 'أول منصة لبيع سيارات المتعثرين وحظر البيع',
      heroHeadline2: 'والتقسيط المباشر وسيارات الكاش في مصر',
      heroSubtitle: 'سواء سيارتك محملة بأقساط بنكية متعثرة وعليها حظر بيع، أو عايز تبيعها أو تشتريها بتقسيط مباشر بدون بنوك، أو كاش ملكية خالصة — «مخلصة» تضمن لك أعلى عائد وأضمن إجراءات قانونية وفنية.',
      track1Title: 'سيارات المتعثرين والأقساط',
      track1Desc: 'تصفية القرض وسداد معجل بخزينة البنك واستخراج مخالصة فك الحظر رسمياً.',
      track2Title: 'تقسيط بدون بنوك للمعارض والملاك',
      track2Desc: 'شراء وبيع بالتقسيط المباشر بمقدم ميسر وضمانات مباشرة بدون تعقيدات ائتمانية.',
      track3Title: 'سيارات ملكية خالصة حرة',
      track3Desc: 'تسليم كاش فوري وتنازل رسمي بالشهر العقاري بعد الفحص الفني المعتمد.',
      btnSellCar: '1. عايز أبيع عربيتي',
      btnSellCarSub: 'تسوية بنكية • تقسيط مباشر • أو بيع كاش فوري',
      btnBrowseCars: '2. تصفح سوق السيارات',
      btnBrowseCarsSub: 'استعراض سيارات المتعثرين والتقسيط والكاش المعتمد',
      btnTrackMyRequest: 'متابعة طلبي',
      btnAskTeam: 'اسأل فريق مخلصة عن إجراءات البنك',
      ribbonProp1: '✓ أول منصة لسيارات المتعثرين وحظر البيع',
      ribbonProp2: '✓ مسار التقسيط المباشر بدون بنوك',
      ribbonProp3: '✓ سيارات كاش ملكية خالصة',
      ribbonProp4: '✓ عمولة واضحة 1.5% فقط عند إتمام الصفقة',
      transparencyBadge: 'الشفافية المالية الكاملة (Financial Transparency)',
      transparencyTitle: 'عمولة مخلصة هي 1.5% فقط — بدون أي مصاريف خفية',
      transparencyBadge2: 'تستحق فقط عند إتمام البيع بنجاح',
      transparencyDesc: 'نؤمن بالوضوح التام مع العميل؛ عمولة المنصة موحدة بنسبة 1.5% من إجمالي سعر البيع المتفق عليه، ولا يتم تحصيل أي مليم إلا بعد إنهاء الإجراءات ونقل الملكية بنجاح.',
      exampleTitle: 'مثال توضيحي بالأرقام (Illustrative Mathematical Example):',
      exampleCase: 'حالة بيع سيارة بقيمة 600,000 ج.م',
      exampleGross: 'إجمالي سعر البيع (Gross)',
      exampleBankPayoff: 'تسوية البنك الرسمية',
      exampleBankLetter: 'خطاب رسمي مختوم',
      exampleGovFees: 'مصاريف فك الحظر والمرور',
      exampleGovReceipts: 'رسوم حكومية موثقة',
      exampleCommission: 'عمولة مخلصة (1.5%)',
      exampleCommissionDesc: '1.5% من 600 ألف',
      exampleNetCash: 'صافي كاش البائع',
      exampleNetCashDesc: 'يستلمها البائع فوراً',
      exampleNote: '* ملاحظة: هذا المثال توضيحي رياضي بحت؛ المبالغ الدقيقة تتحدد بناءً على مسار البيع وبيان المديونية الرسمي الصادر وحالة الفحص الفني.',
      galleryBadge: 'سوق سيارات مخلصة المعتمد',
      galleryTitle: 'أحدث السيارات المتاحة للتسوية والتقسيط والكاش',
      galleryDesc: 'جميع السيارات تخضع للفحص الهندسي وتدقيق الموقف القانوني والمالي بإشراف فريق مخلصة.',
      btnViewAllCars: 'شاهد كل السيارات في المعرض',
      tabAll: 'الكل',
      tabDirect: '🟡 تقسيط مباشر',
      tabCash: '🟢 بيع كاش (ملكية خالصة)',
      tabBank: '🏦 تسوية وحظر بيع بنكي',
      noCarsTitle: 'لا توجد سيارات بهذا التصنيف حالياً',
      noCarsDesc: 'المنصة تستقبل يومياً طلبات بيع سيارات المتعثرين والتقسيط المباشر والكاش المعتمد.',
      btnListYourCar: 'اعرض سيارتك للبيع الآن',
      processBadge: 'بروتوكول المعاملات المنظمة',
      processTitle: 'كيف نساعدك خطوة بخطوة في بيع وشراء سيارتك؟',
      processDesc: 'خطوات واضحة ومنظمة تحفظ حقك كبائع وتضمن إبراء ذمتك بالكامل، وتمنح المشتري الأمان القانوني التام عبر المسارات الثلاثة.',
      step1Title: 'تسجيل السيارة واختيار المسار',
      step1Desc: 'تسجيل بيانات السيارة وتحديد نظام البيع: تسوية ديون بنكية وحظر بيع، تقسيط مباشر بدون بنوك، أو بيع كاش ملكية خالصة.',
      step2Title: 'التقييم العادل وفحص 150 نقطة',
      step2Desc: 'تقييم سعر السوق العادل من واقع إعلانات البيع الحقيقية، وإفصاح كامل عن حالة السيارة لضمان استقرار الصفقة دون نزاعات.',
      step3Title: 'تأهيل المشتري والاتفاق المعتمد',
      step3Desc: 'تأهيل المشتري الجاد وتوقيع العقود النموذجية المعتمدة (اتفاق تسوية ثلاثي، عقد تقسيط مباشر بضمانات، أو عقد كاش).',
      step4Title: 'التنفيذ المالي ونقل الملكية',
      step4Desc: 'سداد رسمي بالبنك لفك الحظر، أو استلام مقدم التقسيط والضمانات، أو تسليم الكاش ونقل القيد بالشهر العقاري والمرور.',
      zeroCustodyNote: 'أمان مالي كامل مع صفر احتجاز للأموال (Zero-Custody) بدون وسطاء مجهولين',
      detailedGuideLink: 'تعرف على الدليل القانوني والإجرائي المفصل',
      riskBadge: 'مقارنة المخاطر',
      riskTitle: 'لماذا ترفض مخلصة بيع السيارات بالتوكيلات العرفية؟',
      riskDesc: 'يلجأ البعض للبيع العرفي بالتوكيل هرباً من الأقساط، مما يعرض البائع للمساءلة الجنائية والمشتري لضياع أمواله.',
      informalTitle: 'البيع العرفي غير الرسمي بالتوكيل (مخاطر كارثية)',
      informal1: '• البنك لا يعترف بالتوكيل ويقاضي البائع جنائياً في حال توقف المشتري عن السداد.',
      informal2: '• استمرار المخالفات المرورية والحوادث مسجلة باسم المالك في النيابة.',
      informal3: '• وفاة المالك تلغي التوكيل فوراً قانوناً وتدخل السيارة ضمن التركة والورثة.',
      informal4: '• ضبط وإحضار السيارة وحجزها في أي كمين مروري بموجب إذن قضائي لصالح البنك.',
      safeTitle: 'مسار التخارج الآمن المنظم عبر «مخلصة»',
      safe1: '• سداد رسمي معتمد في خزينة البنك المقرض وإغلاق ملف القرض إلى الصفر.',
      safe2: '• صدور مخالصة نهائية وإبراء ذمة تام للبائع من أي مطالبات مصرفية.',
      safe3: '• اتفاق ثلاثي مشروط يحمي حيازة المشتري ومستنداته فور السداد.',
      safe4: '• نقل ملكية قانوني نهائي بوحدة المرور والشهر العقاري برخصة جديدة حرة.',
      consultTitle: 'اسأل فريق مخلصة عن إجراءات سيارتك',
      consultSuccessTitle: 'تم إرسال استفسارك بنجاح',
      consultSuccessDesc: 'سيتواصل معك مستشار مصرفي وقانوني من مخلصة خلال ساعات لمراجعة الموقف.',
      consultNameLabel: 'اسمك بالكامل:',
      consultPhoneLabel: 'رقم الهاتف المحمول (مصر):',
      consultBankLabel: 'البنك أو جهة التمويل:',
      consultQuestionLabel: 'ما هو استفسارك أو مشكلتك بالتفصيل؟',
      consultPlaceholder: 'مثال: عندي قسط متأخر شهرين وعايز أعرف إزاي أبيع بدون غرامات كبيرة...',
      consultSubmitBtn: 'إرسال الاستفسار'
    },
    marketplace: {
      badge: 'معرض مخلصة المعتمد',
      title: 'سوق السيارات: بيع كاش، تقسيط مباشر، وتسوية مديونيات',
      desc: 'تصفح سيارات البيع الكاش (ملكية خالصة)، وسيارات التقسيط المباشر بدون تعقيدات البنوك، وفرص سيارات التسوية وفك الحظر البنكي المعتمدة مع الفحص والتوثيق الميداني.',
      availableMethods: 'طرق الشراء المتاحة:',
      searchPlaceholder: 'ابحث بالماركة، الموديل، الفئة، أو المحافظة...',
      filterAllMakes: 'كل الماركات',
      filterFinancingAll: 'كل خطط التمويل والبيع',
      maxPriceLabel: 'الحد الأقصى للسعر:',
      sortFeatured: 'المميز أولاً',
      sortPriceAsc: 'السعر: من الأقل للأعلى',
      sortPriceDesc: 'السعر: من الأعلى للأقل',
      sortMileageAsc: 'العداد: الأقل استهلاكاً',
      foundCount: 'سيارة معروضة ومطابقة لبحثك',
      noResultsTitle: 'لا توجد سيارات مطابقة لبحثك حالياً',
      noResultsDesc: 'جرب تعديل خيارات البحث أو إعادة ضبط الفلاتر لتصفح كامل المعرض.',
      resetFilters: 'إعادة ضبط كل الفلاتر'
    },
    carDetail: {
      backToMarketplace: 'العودة لمعرض السيارات',
      statusUnderReview: 'قيد المراجعة الإدارية',
      statusApproved: 'معروض ومعتمد للبيع',
      statusRejected: 'مرفوض ويحتاج تعديل',
      inspectionReport: 'تقرير الفحص الهندسي المعتمد (150 نقطة)',
      scorePoints: 'درجة الفحص الميداني',
      fullSpec: 'المواصفات الفنية التفصيلية',
      transmission: 'ناقل الحركة',
      fuelType: 'نوع الوقود',
      engineSize: 'سعة المحرك',
      mileage: 'قراءة العداد',
      color: 'اللون الخارجي',
      paintCondition: 'حالة الدهان',
      trafficDepartment: 'وحدة المرور',
      sellerStory: 'وصف وإفصاح المالك عن حالة السيارة',
      directInstallmentPlan: 'خطة التقسيط المباشر بدون وساطة بنوك',
      downPaymentRequired: 'أقل مقدم مطلوب',
      monthlyInstallmentValue: 'قيمة القسط الشهري',
      installmentPeriod: 'مدة السداد بالشهور',
      requiredGuarantees: 'الضمانات المطلوبة من المشتري:',
      cashSaleTitle: 'سيارة ملكية حرة خالصة للبيع كاش',
      cashSaleNotice: 'السيارة خالية تماماً من أي التزامات بنكية أو حظر بيع. البيع فوري نقداً وتنازل رسمي بالشهر العقاري.',
      bankSettlementTitle: 'بيان تسوية المديونية البنكية التقديري',
      bankSettlementNotice: 'سيارة محملة بتمويل بنكي — يتم سداد التسوية الرسمية مباشرة في فرع البنك الدائن لفك الحظر.',
      principalDebt: 'أصل الدين التقريبي',
      earlySettlementFee: 'عمولة السداد المعجل',
      netSellerProceeds: 'صافي كاش البائع التقديري',
      interestedTitle: 'مهتم بهذه السيارة؟ تواصل مع فريق مخلصة',
      interestedDesc: 'فريقنا يتولى المعاينة الميدانية والتنسيق القانوني الكامل.',
      contactAdvisor: 'تواصل مع مستشار الصفقة',
      submitPurchaseOffer: 'تقديم عرض شراء جاد'
    },
    footer: {
      tagline: '«أول منصة في مصر لبيع سيارات المتعثرين وحظر البيع، التقسيط المباشر، وسيارات الكاش المعتمدة»',
      description: 'منصة تكنولوجية واستشارية متخصصة لمساعدة ملاك السيارات المتعثرة أو المحملة بأقساط بنكية أو حظر بيع، بالإضافة إلى مسار التقسيط المباشر بدون بنوك وسيارات الكاش ذات الملكية الخالصة، بأعلى درجات الأمان المالي والقانوني وبشفافية تامة.',
      zeroCustody: 'إيداع مباشر بخزينة البنك الدائن (Zero-Custody) بدون وسيط مالي',
      coreActions: 'الخدمات الأساسية',
      trustAndLegal: 'الضوابط والمعلومات',
      contactInfo: 'تواصل مع فريق مخلصة',
      headquarters: 'المقر الرئيسي: التجمع الخامس، القاهرة الجديدة، مصر',
      phoneHotline: 'الخط الساخن: 01008836962',
      emailSupport: 'البريد الرسمي: support@mokhalasa.com',
      rightsReserved: 'جميع الحقوق محفوظة لمنصة مخلصة ©'
    }
  },
  en: {
    common: {
      egp: 'EGP',
      km: 'KM',
      month: 'Month',
      months: 'Months',
      year: 'Year',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      loading: 'Loading...',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      login: 'Log In',
      register: 'Sign Up',
      logout: 'Log Out',
      myAccount: 'My Account',
      all: 'All',
      phone: 'Phone Number',
      email: 'Email Address',
      optional: 'Optional',
      mandatory: 'Required',
      price: 'Price',
      showroom: 'Certified Showroom',
      individual: 'Direct Owner',
      jumpToField: 'Jump to Required Field ↲'
    },
    nav: {
      home: 'Home',
      marketplace: 'Browse Cars',
      sellCar: 'Sell Your Car with Mokhalasa',
      howItWorks: 'How It Works',
      faq: 'FAQ',
      contact: 'Contact Us',
      trackRequest: 'Track Request',
      askTeam: 'Consult Our Bank Experts',
      opsConsole: 'Operations',
      notifications: 'Direct Notifications',
      markAllRead: 'Mark all as read',
      noNotifications: 'No new notifications currently'
    },
    tracks: {
      bankSettlement: 'Bank Settlement & Ban Removal',
      bankSettlementDesc: 'Early debt settlement directly at bank branches with official clearance letters.',
      bankSettlementTag: '🏦 Bank Settlement',
      directInstallment: 'Direct In-House Installments',
      directInstallmentDesc: 'Buy and sell on installment directly with showrooms & owners without bank credit checks.',
      directInstallmentTag: '🟡 Direct Installment',
      cashSale: 'Cash Sale (Clean Title)',
      cashSaleDesc: 'Instant cash payment and notarized title transfer following rigorous 150-point inspection.',
      cashSaleTag: '🟢 Cash Sale'
    },
    home: {
      heroBadge: 'Egypt’s #1 Platform for Distressed Car Settlements, Direct Installments & Certified Cash Sales',
      heroHeadline1: 'The #1 Platform for Distressed Cars & Loan Settlement',
      heroHeadline2: 'Direct Installment & Certified Cash Cars in Egypt',
      heroSubtitle: 'Whether your car has bank loan arrears and a sale ban, you want in-house installments without banks, or a clean-title cash deal — Mokhalasa guarantees optimal value and secure legal execution.',
      track1Title: 'Distressed & Bank-Financed Cars',
      track1Desc: 'Official loan payoffs paid directly at the bank counter with formal sale ban removal.',
      track2Title: 'Direct Installments (No Banks Needed)',
      track2Desc: 'Convenient installment plans directly between showrooms/owners and buyers with direct guarantees.',
      track3Title: 'Clean Title Cash Cars',
      track3Desc: 'Immediate cash payment and notarized ownership transfer after comprehensive inspection.',
      btnSellCar: '1. I Want to Sell My Car',
      btnSellCarSub: 'Bank Settlement • Direct Installment • or Instant Cash',
      btnBrowseCars: '2. Browse Car Marketplace',
      btnBrowseCarsSub: 'Explore distressed, installment & certified cash listings',
      btnTrackMyRequest: 'Track My Request',
      btnAskTeam: 'Consult Our Bank Team',
      ribbonProp1: '✓ #1 Platform for Distressed & Loan Cars',
      ribbonProp2: '✓ Dedicated Direct Installment Track',
      ribbonProp3: '✓ Clean-Title Cash Marketplace',
      ribbonProp4: '✓ Transparent 1.5% Success Fee Only',
      transparencyBadge: 'Complete Financial Transparency',
      transparencyTitle: 'Mokhalasa Commission is Only 1.5% — Zero Hidden Fees',
      transparencyBadge2: 'Payable Only Upon Successful Deal Closing',
      transparencyDesc: 'We believe in complete transparency; our uniform platform fee is 1.5% of agreed gross price, charged only after official payoff and legal title registration.',
      exampleTitle: 'Illustrative Mathematical Breakdown:',
      exampleCase: 'Example for a 600,000 EGP Car Sale',
      exampleGross: 'Gross Selling Price',
      exampleBankPayoff: 'Official Bank Payoff',
      exampleBankLetter: 'Stamped Bank Quote',
      exampleGovFees: 'Release & Traffic Fees',
      exampleGovReceipts: 'Documented Gov Fees',
      exampleCommission: 'Mokhalasa Fee (1.5%)',
      exampleCommissionDesc: '1.5% of 600k',
      exampleNetCash: 'Seller Net Cash',
      exampleNetCashDesc: 'Received immediately',
      exampleNote: '* Note: This mathematical breakdown is purely illustrative; exact settlement numbers depend on the official bank payoff letter, inspection report, and traffic fees.',
      galleryBadge: 'Certified Mokhalasa Marketplace',
      galleryTitle: 'Latest Settlement, Direct Installment & Cash Vehicles',
      galleryDesc: 'All vehicles undergo 150-point engineering inspections and legal verification supervised by Mokhalasa.',
      btnViewAllCars: 'View All Vehicles in Marketplace',
      tabAll: 'All',
      tabDirect: '🟡 Direct Installment',
      tabCash: '🟢 Cash Sale (Clean Title)',
      tabBank: '🏦 Bank Settlement',
      noCarsTitle: 'No vehicles found in this category currently',
      noCarsDesc: 'Mokhalasa receives daily listing requests across debt settlement, direct installment and cash sales.',
      btnListYourCar: 'List Your Vehicle Today',
      processBadge: 'Managed Transaction Protocol',
      processTitle: 'How We Guide You Step-by-Step to Sell or Buy',
      processDesc: 'Clear, documented steps safeguarding sellers against liabilities and providing buyers with complete legal assurance.',
      step1Title: 'Submit Vehicle & Select Track',
      step1Desc: 'Enter car details and choose your selling route: bank settlement, in-house installment, or clean cash.',
      step2Title: 'Fair Valuation & 150-Point Inspection',
      step2Desc: 'Accurate market valuation based on verified sales, paired with thorough defect disclosure.',
      step3Title: 'Buyer Qualification & Tripartite Agreement',
      step3Desc: 'Vetting genuine buyers and signing standardized legal contracts guaranteeing safe escrow and possession.',
      step4Title: 'Bank Counter Deposit & Title Transfer',
      step4Desc: 'Direct bank deposit to release sale bans, or handover of down payment and notarized registration.',
      zeroCustodyNote: 'Full financial safety with Zero-Custody: We never hold client funds in intermediary accounts',
      detailedGuideLink: 'Read the Complete Legal & Procedure Guide',
      riskBadge: 'Risk Analysis',
      riskTitle: 'Why Mokhalasa Strictly Rejects Informal Power of Attorney (Tawkeel)',
      riskDesc: 'Some resort to informal Tawkeel sales to escape debts, exposing sellers to criminal charges and buyers to total fund forfeiture.',
      informalTitle: 'Informal Tawkeel Sale (Disastrous Risks)',
      informal1: '• Banks reject Tawkeels and prosecute the registered borrower if installments lapse.',
      informal2: '• All traffic violations, accidents and liabilities remain legally attached to original owner.',
      informal3: '• The death of either party instantly nullifies the Tawkeel by Egyptian Civil Law.',
      informal4: '• Vehicle remains flagged for immediate police impoundment under judicial seizure orders.',
      safeTitle: 'Mokhalasa Structured Exit Path',
      safe1: '• Official bank payoff deposited at teller counter, bringing debt to zero.',
      safe2: '• Issuance of definitive bank release letter clearing seller from all future obligations.',
      safe3: '• Conditional tripartite contract safeguarding buyer possession upon payment.',
      safe4: '• Final title transfer at the Traffic Department and Notary with a brand new, unencumbered license.',
      consultTitle: 'Consult Mokhalasa Experts About Your Car Situation',
      consultSuccessTitle: 'Your Inquiry Was Sent Successfully',
      consultSuccessDesc: 'A banking and legal advisor from Mokhalasa will contact you shortly to review your case.',
      consultNameLabel: 'Full Name:',
      consultPhoneLabel: 'Mobile Phone (Egypt):',
      consultBankLabel: 'Financing Entity / Bank:',
      consultQuestionLabel: 'Describe your inquiry or situation:',
      consultPlaceholder: 'e.g., I have 2 overdue installments and want to sell without paying punitive fees...',
      consultSubmitBtn: 'Send Inquiry'
    },
    marketplace: {
      badge: 'Certified Mokhalasa Marketplace',
      title: 'Car Marketplace: Cash, Direct Installment & Debt Settlement',
      desc: 'Browse clean-title cash cars, direct in-house installments without banking hurdles, and bank payoff opportunities verified with technical inspections.',
      availableMethods: 'Available Purchase Tracks:',
      searchPlaceholder: 'Search by make, model, trim, or city...',
      filterAllMakes: 'All Makes',
      filterFinancingAll: 'All Sale & Financing Types',
      maxPriceLabel: 'Maximum Price:',
      sortFeatured: 'Featured First',
      sortPriceAsc: 'Price: Low to High',
      sortPriceDesc: 'Price: High to Low',
      sortMileageAsc: 'Mileage: Lowest First',
      foundCount: 'cars matching your criteria',
      noResultsTitle: 'No vehicles match your current search',
      noResultsDesc: 'Try adjusting your search criteria or resetting filters to view all available listings.',
      resetFilters: 'Reset All Filters'
    },
    carDetail: {
      backToMarketplace: 'Back to Marketplace',
      statusUnderReview: 'Under Review',
      statusApproved: 'Verified & Listed',
      statusRejected: 'Changes Required',
      inspectionReport: 'Certified 150-Point Engineering Inspection',
      scorePoints: 'Inspection Score',
      fullSpec: 'Detailed Specifications',
      transmission: 'Transmission',
      fuelType: 'Fuel Type',
      engineSize: 'Engine Size',
      mileage: 'Mileage',
      color: 'Exterior Color',
      paintCondition: 'Paint Condition',
      trafficDepartment: 'Traffic Department',
      sellerStory: 'Seller Condition Story & Notes',
      directInstallmentPlan: 'Direct In-House Installment Plan (No Banks)',
      downPaymentRequired: 'Minimum Down Payment',
      monthlyInstallmentValue: 'Monthly Installment',
      installmentPeriod: 'Duration in Months',
      requiredGuarantees: 'Required Guarantees from Buyer:',
      cashSaleTitle: 'Clean-Title Vehicle for Cash Sale',
      cashSaleNotice: 'This vehicle has zero bank encumbrance or loan obligations. Immediate cash sale with instant notary transfer.',
      bankSettlementTitle: 'Estimated Bank Debt Payoff Statement',
      bankSettlementNotice: 'Financed vehicle — payoff is deposited directly at the lender’s teller counter to lift the registration ban.',
      principalDebt: 'Estimated Principal Debt',
      earlySettlementFee: 'Early Payoff Fee',
      netSellerProceeds: 'Estimated Seller Net Cash',
      interestedTitle: 'Interested in this vehicle? Talk to Mokhalasa',
      interestedDesc: 'Our specialized team facilitates inspections, bank negotiations and legal transfer.',
      contactAdvisor: 'Contact Deal Advisor',
      submitPurchaseOffer: 'Submit Purchase Offer'
    },
    footer: {
      tagline: '«Egypt’s #1 Platform for Distressed Car Settlements, Direct Installments & Certified Cash Sales»',
      description: 'A dedicated advisory and digital marketplace assisting owners of financed and distressed cars, while offering direct in-house installments and clean-title cash transactions with complete financial safety.',
      zeroCustody: 'Direct teller counter deposits (Zero-Custody) without financial intermediaries',
      coreActions: 'Core Services',
      trustAndLegal: 'Guidelines & Trust',
      contactInfo: 'Contact Mokhalasa Team',
      headquarters: 'Headquarters: New Cairo, 5th Settlement, Cairo, Egypt',
      phoneHotline: 'Hotline: 01008836962',
      emailSupport: 'Official Email: support@mokhalasa.com',
      rightsReserved: 'All rights reserved to Mokhalasa Platform ©'
    }
  }
};
