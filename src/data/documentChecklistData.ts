import { RequiredDocumentMetadata, ListingVehicleStatus } from '../types';

export const ALL_DOCUMENTS_MASTER_LIST: RequiredDocumentMetadata[] = [
  // 1. National ID
  {
    id: 'doc-national-id',
    nameAr: 'بطاقة الرقم القومي سارية للمالك',
    nameEn: 'Valid National ID of Registered Owner',
    descriptionAr: 'صورة واضحة لوجهي بطاقة الرقم القومي السارية للمالك المسجل بالرخصة للتحقق من الأهلية القانونية.',
    applicableStatuses: [
      'fully_owned', 'bank_loan', 'consumer_finance', 
      'loan_paid_pending_clearance', 'personal_loan_free_license', 
      'settlement_or_arrears', 'other_review'
    ],
    isRequired: true,
    issuedByAr: 'قطاع مصلحة الأحوال المدنية (وزارة الداخلية المصرية)',
    purposeAr: 'التحقق الإلزامي من هوية المالك وصفته القانونية في البيع ومنع الاحتيال أو التصرف في أموال الغير.',
    verified: true,
    source: 'قانون الأحوال المدنية رقم 143 لسنة 1994 وتعليمات الشهر العقاري',
    lastVerifiedDate: '2026-01-20',
    allowProceedWithout: false,
    status: 'required'
  },

  // 2. Vehicle Registration License
  {
    id: 'doc-vehicle-license',
    nameAr: 'رخصة تسيير المركبة (وجهين)',
    nameEn: 'Vehicle Registration License (Both Sides)',
    descriptionAr: 'صورة واضحة للرخصة تظهر رقم الشاسيه، الموتور، اسم المالك، تاريخ السريان، وخانة القيود (حظر البيع إن وُجد).',
    applicableStatuses: [
      'fully_owned', 'bank_loan', 'consumer_finance', 
      'loan_paid_pending_clearance', 'personal_loan_free_license', 
      'settlement_or_arrears', 'other_review'
    ],
    isRequired: true,
    issuedByAr: 'إدارة المرور المختصة (وزارة الداخلية المصرية)',
    purposeAr: 'إثبات الملكية وتحديد ما إذا كان هناك حظر بيع رسمي مقيد على المركبة لصالح جهة تمويل.',
    verified: true,
    source: 'قانون المرور رقم 66 لسنة 1973 وتعديلاته واللائحة التنفيذية',
    lastVerifiedDate: '2026-01-20',
    allowProceedWithout: false,
    status: 'required'
  },

  // 3. Bank Official Settlement Statement (Payoff Quote)
  {
    id: 'doc-bank-payoff-letter',
    nameAr: 'بيان مديونية بنكية رسمي مختوم (خطاب سداد معجل)',
    nameEn: 'Official Bank Payoff / Early Settlement Statement',
    descriptionAr: 'خطاب رسمي صادر من فرع البنك الدائن موجه للمقترض يوضح أصل الدين المتبقي وعمولة السداد المعجل الصالحة للسداد.',
    applicableStatuses: ['bank_loan'],
    isRequired: true,
    issuedByAr: 'البنك الدائن (إدارة القروض والتجزئة المصرفية)',
    purposeAr: 'تحديد القيمة النقدية الدقيقة (S) المطلوبة لإغلاق القرض مصرفياً وإصدار خطاب فك الحظر.',
    verified: true,
    source: 'تعليمات البنك المركزي المصري (CBE) المنظمة لقروض الأفراد',
    lastVerifiedDate: '2026-01-18',
    allowProceedWithout: true, // Can list initially, but required before transaction closing
    status: 'required'
  },

  // 4. Consumer Finance Statement
  {
    id: 'doc-consumer-finance-statement',
    nameAr: 'بيان مديونية أو مخالصة من شركة التمويل الاستهلاكي',
    nameEn: 'Consumer Finance Settlement Statement',
    descriptionAr: 'كشف حساب رسمي أو خطاب سداد مبكر من شركة التمويل (كونتكت، فاليو، درايف، أمان، سهولة) يوضح الرصيد النهائي.',
    applicableStatuses: ['consumer_finance'],
    isRequired: true,
    issuedByAr: 'شركة التمويل الاستهلاكي المرخصة من الهيئة العامة للرقابة المالية (FRA)',
    purposeAr: 'حساب القيمة الإجمالية لفك الحظر واسترداد سندات أو شيكات الضمان الموقعة من العميل.',
    verified: true,
    source: 'قانون تنظيم نشاط التمويل الاستهلاكي رقم 18 لسنة 2020',
    lastVerifiedDate: '2026-01-15',
    allowProceedWithout: true,
    status: 'required'
  },

  // 5. Final Payment Receipt for Cleared Loans
  {
    id: 'doc-final-payment-receipt',
    nameAr: 'إيصال سداد كامل المديونية البنكية',
    nameEn: 'Final Full Loan Payment Deposit Receipt',
    descriptionAr: 'إيصال التوريد البنكي المعتمد الذي يثبت تسديد كامل رصيد القرض إلى الصفر.',
    applicableStatuses: ['loan_paid_pending_clearance'],
    isRequired: true,
    issuedByAr: 'فرع البنك أو شركة التمويل الدائنة',
    purposeAr: 'إثبات خلو ذمة العميل بنكياً للمطالبة باستعجال إصدار خطاب رفع الحظر للمرور.',
    verified: true,
    source: 'قانون الإثبات في المواد المدنية والتجارية رقم 25 لسنة 1968',
    lastVerifiedDate: '2026-01-10',
    allowProceedWithout: false,
    status: 'required'
  },

  // 6. Bank Clearance Letter Addressed to Traffic
  {
    id: 'doc-traffic-release-letter',
    nameAr: 'خطاب رفع حظر البيع الموجه للمرور',
    nameEn: 'Bank Traffic Restriction Release Letter',
    descriptionAr: 'الخطاب الرسمي المغلق الصادر من البنك لوحدة المرور التابع لها الترخيص لفك قيد الحظر في قاعدة البيانات.',
    applicableStatuses: ['loan_paid_pending_clearance'],
    isRequired: false, // May still be pending from bank
    issuedByAr: 'البنك الدائن موجه إلى وحدة مرور المركبة',
    purposeAr: 'المستند التنفيذي الوحيد المقبول قانونياً لدى مهندس فحص المرور لشطب قيد حظر البيع من الرخصة.',
    verified: true,
    source: 'الكتاب الدوري الموحد لقطاع المرور والبنك المركزي المصري',
    lastVerifiedDate: '2026-01-12',
    allowProceedWithout: true,
    status: 'optional'
  },

  // 7. Arrears & Settlement Agreement Document
  {
    id: 'doc-arrears-settlement-agreement',
    nameAr: 'خطاب جدولة أو تسوية المتأخرات من إدارة التحصيل',
    nameEn: 'Debt Workout / Arrears Settlement Letter',
    descriptionAr: 'مستند صادر من إدارة المتابعة والتحصيل أو الشؤون القانونية بالبنك يحدد المبلغ المتفق عليه لإنهاء التعثر.',
    applicableStatuses: ['settlement_or_arrears'],
    isRequired: true,
    issuedByAr: 'إدارة معالجة الديون المتعثرة بالبنك الدائن',
    purposeAr: 'التأكد من إسقاط الإجراءات القانونية أو منع الحجز القضائي والتحفظي على السيارة في الكمائن الشرطية.',
    verified: true,
    source: 'مبادرات البنك المركزي المصري لتسوية الديون المتعثرة للأفراد',
    lastVerifiedDate: '2026-01-15',
    allowProceedWithout: false,
    status: 'required'
  },

  // 8. Personal Loan Responsibility Declaration
  {
    id: 'doc-personal-loan-declaration',
    nameAr: 'إقرار التزام المقترض الشخصي بسداد مديونيته',
    nameEn: 'Personal Loan Borrower Repayment Acknowledgment',
    descriptionAr: 'إقرار موقع من المالك يفيد بأن السيارة غير محملة بحظر بيع وأن القرض شخصي نقدي يتحمل البائع التزاماته بالكامل دون أي شائبة على المشتري.',
    applicableStatuses: ['personal_loan_free_license'],
    isRequired: true,
    issuedByAr: 'منصة مخلصة (نموذج إقرار قانوني معتمد)',
    purposeAr: 'حماية المشتري وإخلاء مسؤوليته التامة تجاه البنك المقرض وضمان استمرار المالك في السداد أو التسوية.',
    verified: true,
    source: 'القانون المدني المصري (أحكام الالتزام والضمان الشخصي)',
    lastVerifiedDate: '2026-01-18',
    allowProceedWithout: false,
    status: 'required'
  },

  // 9. Traffic Violation Clearance (شهادة المخالفات)
  {
    id: 'doc-traffic-violations-certificate',
    nameAr: 'شهادة براءة الذمة من نيابة المرور (شهادة المخالفات)',
    nameEn: 'Traffic Violations Clearance Certificate',
    descriptionAr: 'شهادة تثبت خلو المركبة من أي غرامات أو مخالفات مرورية مستحقة لصندوق تحسين خدمات المرور.',
    applicableStatuses: ['fully_owned', 'bank_loan', 'consumer_finance', 'loan_paid_pending_clearance', 'personal_loan_free_license'],
    isRequired: false, // Recommended, needed at transfer time
    issuedByAr: 'نيابة المرور المختصة / بوابة الحكومة المصرية',
    purposeAr: 'تسريع عملية البيع والتأكد من عدم وجود مبالغ مخالفات متراكمة يدفعها المشتري.',
    verified: true,
    source: 'قانون المرور رقم 66 لسنة 1973',
    lastVerifiedDate: '2026-01-20',
    allowProceedWithout: true,
    status: 'optional'
  },

  // 10. Power of Attorney (إن وُجد بائع بتوكيل)
  {
    id: 'doc-power-of-attorney',
    nameAr: 'صورة التوكيل الرسمي العام أو الخاص بالبيع (إن وُجد)',
    nameEn: 'Official Notarized Power of Attorney (If applicable)',
    descriptionAr: 'إذا لم تكن السيارة مسجلة باسم البائع مباشرة وكان يبيع بموجب توكيل صادر من الشهر العقاري.',
    applicableStatuses: ['fully_owned', 'personal_loan_free_license', 'other_review'],
    isRequired: false,
    issuedByAr: 'مصلحة الشهر العقاري والتوثيق',
    purposeAr: 'إثبات صفة الوكيل في التوقيع وقبض الثمن والتأكد من سريان التوكيل وعدم إلغائه أو وفاة الموكل الأصلي.',
    verified: true,
    source: 'قانون التوثيق رقم 68 لسنة 1947',
    lastVerifiedDate: '2026-01-20',
    allowProceedWithout: true,
    status: 'optional'
  }
];

// Helper to filter documents for a specific vehicle status
export function getDocumentsForStatus(status: ListingVehicleStatus): RequiredDocumentMetadata[] {
  return ALL_DOCUMENTS_MASTER_LIST.filter((doc) =>
    doc.applicableStatuses.includes(status)
  ).map((doc) => ({
    ...doc,
    status: doc.isRequired ? 'required' : 'optional'
  }));
}
