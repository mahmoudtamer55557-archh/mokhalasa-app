// =====================================================================
// MOKHALASA — SPECIALIZED DISTRESSED VEHICLE & FINANCE SETTLEMENT TYPES
// =====================================================================

export type FinancingType = 
  | 'bank_loan'         // قرض سيارة بنكي بحظر بيع
  | 'consumer_finance'  // تقسيط تمويل استهلاكي (كونتكت، فاليو، درايف، سهولة، أمان)
  | 'islamic_murabaha'  // مرابحة إسلامية
  | 'personal_loan'     // قرض شخصي نقدي (التزام شخصي على البائع)
  | 'financial_lease'   // تأجير تمويلي (حق انتفاع)
  | 'fully_owned';      // للتوجيه والتحقق فقط (غير مؤهل للخدمة)

export type ListingVehicleStatus = 
  | 'bank_loan'                    // سيارة عليها أقساط قائمة لدى بنك (حظر بيع)
  | 'consumer_finance'             // سيارة عليها تمويل من شركة تمويل استهلاكي أو تأجير
  | 'loan_paid_pending_clearance'  // سيارة تم سداد أقساطها بالكامل وتحتاج استكمال فك الحظر
  | 'personal_loan_free_license'   // سيارة مشتراة بقرض شخصي نقدي بدون حظر بيع بالرخصة
  | 'settlement_or_arrears'        // سيارة في مرحلة تسوية أو تعثر أو متأخرات معلقة
  | 'other_review'                 // موقف تمويلي آخر يحتاج إلى مراجعة خاصة
  | 'fully_owned';                 // غير مؤهل - يحال لصفحة الاعتذار والدعم

export type DistressReason =
  | 'installment_burden'     // عجز عن تحمل عبء القسط الشهري
  | 'accumulating_interest'  // الرغبة في التخلص من الفوائد البنكية المتراكمة
  | 'emergency_expenses'     // التزامات مالية طارئة ومفاجئة
  | 'relocation_travel'      // سفر مفاجئ أو تغيير محل الإقامة
  | 'reducing_overhead'      // تقليل النفقات والمصاريف التشغيلية
  | 'downsizing_car'         // استبدال بسيارة أصغر كاش
  | 'financial_pressure'     // ضغوط مالية
  | 'other';                 // سبب آخر

export type UrgencyLevel =
  | 'very_urgent' // عاجل جداً (خلال 7 إلى 10 أيام)
  | 'urgent'      // عاجل (خلال أسبوعين إلى شهر)
  | 'flexible';   // مرن (أكثر من شهر)

export type OwnerRelationship =
  | 'direct_owner'            // المالك الأصلي المسجل بالرخصة
  | 'power_of_attorney'       // وكيل بموجب توكيل رسمي بالشهر العقاري
  | 'heir'                    // وريث بموجب إعلام وراثة رسمي
  | 'first_degree_relative'   // قريب درجة أولى بتفويض
  | 'sole_owner'              // مالك فردي
  | 'not_sure';               // مش متأكد

// 25-Status Configurable Lifecycle Model
export type CaseLifecycleStatus =
  | 'new_request'                     // 1. طلب جديد
  | 'awaiting_initial_contact'        // 2. بانتظار التواصل المبدئي
  | 'seller_contacted'                // 3. تم التواصل مع البائع
  | 'eligibility_review'              // 4. مراجعة الأهلية والتعثر
  | 'awaiting_missing_info'           // 5. بانتظار استكمال البيانات
  | 'awaiting_documents'              // 6. بانتظار المستندات
  | 'awaiting_lender_confirmation'    // 7. بانتظار إفادة جهة التمويل
  | 'awaiting_official_settlement'    // 8. بانتظار بيان المديونية الرسمي
  | 'valuation_in_progress'           // 9. التقييم السعري جاري
  | 'valuation_reviewed'              // 10. تم تدقيق التقييم
  | 'awaiting_seller_price_approval'  // 11. بانتظار موافقة البائع على السعر
  | 'listing_approved'                // 12. تم اعتماد الإعلان للنشر
  | 'buyer_inquiry_received'          // 13. تم استلام طلبات مشترين
  | 'buyer_qualification'             // 14. تأهيل وفحص قدرة المشتري
  | 'offer_received'                  // 15. تم تقديم عرض سعر
  | 'awaiting_seller_response'        // 16. بانتظار رد البائع على العرض
  | 'negotiation'                     // 17. مرحلة التفاوض والاتفاق
  | 'settlement_coordination'         // 18. تنسيق السداد بالبنك
  | 'awaiting_lender_action'          // 19. بانتظار إجراءات البنك
  | 'awaiting_restriction_release'    // 20. بانتظار خطاب رفع الحظر
  | 'transfer_process'                // 21. إجراءات المرور والشهر العقاري
  | 'completed'                       // 22. تمت المعاملة بنجاح
  | 'rejected_ineligible'             // 23. مرفوض - غير مؤهل
  | 'cancelled'                       // 24. ملغي
  | 'on_hold'                         // 25. معلق / وجود عجز مالي
  | 'withdrawn'                       // تم سحب الإعلان
  | 'published'                       // منشورة
  | 'needs_changes'                   // مطلوب تعديل
  | 'pending_review'                  // قيد المراجعة
  | 'approved'                        // معتمد
  | 'rejected';                       // مرفوض

export type ListingStatus = 'active' | 'under_review' | 'settlement_pending' | 'sold';

export type TransactionRoute = 
  | 'route_a' // سداد مبكر مسبق وفك الحظر
  | 'route_b' // سداد المشتري المباشر للبنك مع اتفاق ثلاثي (المسار الموصى به)
  | 'route_c' // تمويل مشتري جديد وشراء مديونية
  | 'route_g'; // بيع سيارة القرض الشخصي الحرة

// Bank Fee Information
export interface BankFeeInfo {
  bankName: string;
  bankNameAr: string;
  category?: 'commercial_bank' | 'islamic_bank' | 'consumer_finance' | 'leasing';
  earlySettlementRate: number; // percentage (e.g. 0.15 for 15%)
  earlySettlementNoteAr?: string;
  buyoutRate: number;
  buyoutAllowed?: boolean;
  buyoutNoteAr?: string;
  releaseLetterFee: number;
  trafficLetterFee: number;
  clearanceFee: number;
  avgSettlementDays: number;
  officialSource?: string;
  verificationDate?: string;
  notesAr?: string;
}

// Financing Details on a Vehicle
export interface FinancingDetails {
  providerName: string;
  providerNameAr: string;
  financingType: FinancingType;
  outstandingPrincipal: number; // أصل المبلغ المتبقي التقديري
  monthlyInstallment: number;   // القسط الشهري
  remainingMonths: number;      // عدد الشهور المتبقية
  arrearsAmount?: number;       // متأخرات إن وجدت
  earlySettlementFee: number;   // عمولة السداد المعجل المحسوبة
  releaseFee: number;           // رسوم فك الحظر
  totalSettlementRequired: number; // إجمالي المطلوب سداده للبنك S
  hasSaleBan: boolean;          // هل يوجد حظر بيع بالرخصة؟
  sellerNetProceeds: number;    // صافي ما يستلمه البائع (P - S)
  hasOfficialStatement?: boolean; // هل يوجد بيان مديونية رسمي مختوم؟
  hasContactedBank?: boolean;    // هل تواصل البائع مع البنك؟
  isEstimateOnly?: boolean;     // تقدير البائع غير المعتمد
  officialStatementDate?: string; // تاريخ بيان المديونية
}

// Inspection Report
export interface InspectionReport {
  isInspected: boolean;
  score: number; // out of 100
  inspectorName: string;
  date: string;
  engineCondition: 'ممتاز' | 'جيد جداً' | 'جيد' | 'يحتاج صيانة';
  transmissionCondition: 'ممتاز' | 'جيد جداً' | 'جيد' | 'يحتاج فحص';
  paintCondition: 'فابريكا بالكامل' | 'رش رفرفين نظافة' | 'رش إكصدامات فقط' | 'رش خارجي نظافة' | 'أخرى';
  chassisStatus: 'سليم 100% بدون أي ملاحظات' | 'ملاحظات خفيفة' | 'تم التعديل والفحص';
  disclosedDefects?: string[];
  notes: string;
}

// Location Details
export interface VehicleLocation {
  governorate: string; // المحافظة
  city: string;        // الحي / المدينة
  district?: string;   // المنطقة الفرعية
  latitude?: number;   // خط العرض (محمي)
  longitude?: number;  // خط الطول (محمي)
  isGpsLocated?: boolean;
  displayAddress: string; // العنوان العام المعروض للمشترين
}

// Vehicle Data Model
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  transmission: 'أوتوماتيك' | 'مانيوال' | 'CVT' | 'ثنائي التعشيق (Dual Clutch)';
  engineSize: string;
  fuelType?: 'بنزين' | 'هايبرد (هجين)' | 'كهرباء بالكامل (EV)' | 'غاز طبيعي' | 'ديزل';
  mileage: number; // km
  city: string;
  cityEn: string;
  locationDetails?: VehicleLocation;
  color: string;
  vinChassisMasked?: string;
  conditionDescription?: string;
  disclosedProblems?: string[]; // Honest defect disclosures
  sellerConditionStory?: string; // Large Arabic textarea description
  askingPrice: number;        // P (Confirmed asking price)
  price?: number;
  estimatedMarketValue: number; // V
  images: string[];
  financingType: FinancingType;
  vehicleStatus?: ListingVehicleStatus;
  distressReason?: DistressReason;
  urgency?: UrgencyLevel;
  financingDetails?: FinancingDetails;
  inspection: InspectionReport;
  licenseValidityMonths: number;
  trafficDepartment: string;
  sellerType: 'مالك أول' | 'مالك ثانٍ' | 'توكيل';
  status: ListingStatus;
  documentsVerified?: boolean;
  is_hidden?: boolean;
  createdAt: string;
  featured?: boolean;
  description: string;
}

// =================== MARKET RESEARCH & VALUATION ===================

export interface MarketComparableListing {
  id: string;
  source: 'ContactCars' | 'YallaMotor Egypt' | 'Ellithy Cars' | 'Verified Egyptian Dealer';
  sourceUrl?: string;
  observationDate: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  mileage: number;
  advertisedPrice: number;
  condition: string;
  isVerifiedSalePrice: boolean;
}

export interface ValuationFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface ValuationResult {
  estimatedMarketRange: { min: number; max: number };
  suggestedAskingPrice: number;
  suggestedFasterSaleRange: { min: number; max: number };
  buyerInterestIndicator: 'مرتفع جداً (طلب قوي)' | 'متوسط' | 'منخفض';
  confidenceLevel: 'عالية (بيانات وفيرة)' | 'متوسطة' | 'منخفضة / بيانات غير كافية';
  comparableCount: number;
  sources: Array<{ name: string; timestamp: string }>;
  valueFactors: ValuationFactor[];
  missingInfoNotes: string[];
  sellerPotentialNet: number;
  disclaimerAr: string;
  humanAdjustedPrice?: number;
  humanAdjustmentReason?: string;
  adjustedByEmployee?: string;
  adjustedAt?: string;
}

// =================== SETTLEMENT STATEMENT & COMMISSION ===================

export interface PlatformCommissionConfig {
  rate: number; // default 0.015 (1.5%)
  basis: 'gross_sale_price' | 'net_proceeds';
  payer: 'seller' | 'buyer' | 'split_50_50';
  collectionTiming: 'at_bank_settlement' | 'at_traffic_transfer';
}

export interface SettlementCostItem {
  id: string;
  nameAr: string;
  amount: number;
  currency: 'EGP';
  responsibleParty: 'seller' | 'buyer' | 'lender' | 'platform';
  recipient: string;
  sourceDocument?: string;
  isEstimated: boolean;
  isDeductedFromSaleProceeds: boolean;
  approvalStatus: 'approved' | 'pending' | 'disputed';
}

export interface ItemizedSettlementStatement {
  grossSalePrice: number;
  lenderSettlementAmount: number;
  lenderSettlementSource: string;
  lenderSettlementValidityDate: string;
  earlySettlementFee: number;
  releaseLetterFee: number;
  trafficAndGovFees: number;
  inspectionFee: number;
  platformCommission: number;
  commissionRate: number;
  otherCosts: SettlementCostItem[];
  totalDeductions: number;
  netProceedsToSeller: number;
  shortfallAmount: number; // > 0 if deductions > sale price
  isShortfall: boolean;
  isPreliminary: boolean;
  sellerAccepted: boolean;
  buyerAccepted: boolean;
}

// =================== CRM & EMPLOYEE WORKFLOWS ===================

export type EmployeeRole = 'owner' | 'manager' | 'case_officer' | 'legal_officer';

export interface EmployeeUser {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  assignedCasesCount: number;
  isActive: boolean;
}

export interface CallLogEntry {
  id: string;
  caseId: string;
  employeeId: string;
  employeeName: string;
  contactType: 'phone_call' | 'whatsapp' | 'meeting' | 'inspection';
  party: 'seller' | 'buyer' | 'lender_rep';
  outcome: 'answered_agreed' | 'answered_hesitant' | 'no_answer' | 'busy' | 'scheduled_callback' | 'escalated' | string;
  notes: string;
  followUpDate?: string;
  createdAt: string;
}

export interface CaseTimelineEvent {
  id: string;
  caseId: string;
  status: CaseLifecycleStatus;
  changedBy: string;
  reason: string;
  timestamp: string;
}

export interface BuyerInquiryRecord {
  id: string;
  caseReference: string;
  carId: string;
  carTitle: string;
  buyerName: string;
  buyerPhone: string;
  purchaseIntent: 'cash_full' | 'direct_bank_settlement' | 'new_financing_requested';
  offeredPrice?: number;
  preferredContactTime: string;
  message?: string;
  status: 'new' | 'contacted' | 'qualified' | 'offer_presented' | 'closed';
  createdAt: string;
  assignedEmployeeName?: string;
}

export interface CaseRevisionRecord {
  id: string;
  caseId: string;
  timestamp: string;
  changedBy: 'seller' | 'staff' | 'owner';
  authorName?: string;
  fieldKey: string;
  fieldLabelAr: string;
  previousValue: any;
  newValue: any;
  isFinancialOrLegal: boolean; // if true, strictly requires approval
  requiresStaffReview: boolean;
  reviewStatus: 'pending_review' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface StaffAuthSession {
  user: EmployeeUser;
  token: string;
  expiresAt: string;
}

export interface StaffAuthCredentials {
  email: string;
  password?: string;
  securityPin?: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  provider: 'google' | 'email' | 'phone_otp';
  isVerified?: boolean;
  governorate?: string;
  city?: string;
  createdAt: string;
}

export type PurchaseOfferStatus = 
  | 'new'
  | 'communicated_to_seller'
  | 'seller_accepted'
  | 'seller_rejected'
  | 'accepted_by_seller'
  | 'rejected_by_seller'
  | 'contacted'
  | 'negotiating'
  | 'accepted'
  | 'declined'
  | 'pending'
  | 'rejected';

export interface PurchaseOffer {
  id: string;
  listingId?: string;
  carId: string;
  carTitle: string;
  caseReference: string;
  buyerName: string;
  buyerPhone: string;
  buyerUserId?: string;
  sellerUserId?: string;
  offerType: 'asking_price' | 'negotiated';
  offeredPrice: number;
  askingPrice: number;
  paymentPreference: 'cash_at_bank' | 'need_new_financing' | 'negotiate';
  preferredContactTime: string;
  notes?: string;
  status: PurchaseOfferStatus;
  adminNotes?: string;
  communicatedToSellerAt?: string;
  sellerResponseAt?: string;
  sellerResponseNotes?: string;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  type: 
    | 'listing_published' 
    | 'listing_status_changed' 
    | 'new_offer' 
    | 'offer_communicated' 
    | 'offer_accepted' 
    | 'offer_rejected' 
    | 'document_rejected'
    | 'document_requested'
    | 'general';
  title: string;
  message: string;
  linkView?: string;
  relatedId?: string;
  targetDocField?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ListingCallLog {
  id: string;
  timestamp: string;
  staffName: string;
  callResult: string;
  notes: string;
}

export type CustomerAuthStatus = 'unauthenticated' | 'authenticating' | 'authenticated' | 'error' | 'cancelled';

export interface CustomerAuthSession {
  user: CustomerUser | null;
  status: CustomerAuthStatus;
  errorMessage?: string;
}

export interface SellerAuthSession {
  caseReference: string;
  accessKey: string;
  verifiedAt: string;
}

export interface PublicVehicleListing {
  id: string;
  caseReference: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  transmission: 'أوتوماتيك' | 'مانيوال' | 'CVT' | 'ثنائي التعشيق (Dual Clutch)';
  engineSize: string;
  fuelType?: string;
  mileage: number;
  city: string;
  color: string;
  askingPrice: number;
  estimatedMarketValue: number;
  images: string[];
  financingProviderNameAr: string;
  financingType: FinancingType;
  isLenderVerified: boolean;
  verificationBadgeText: string;
  disclosedProblems: string[];
  sellerConditionStory: string;
  inspection: InspectionReport;
  licenseValidityMonths: number;
  sellerType: 'مالك أول' | 'مالك ثانٍ' | 'توكيل';
  outstandingPrincipalEstimated: number;
  earlySettlementFeeEstimated: number;
  totalSettlementRequiredEstimated: number;
  sellerNetProceedsEstimated: number;
  createdAt: string;
  featured?: boolean;
  hasPendingEdit?: boolean;
}

export interface DistressedVehicleCase {
  caseReference: string; // e.g. "MK-CASE-2026-081"
  accessKey: string;     // Secure non-guessable authentication secret, e.g. "MK-SEC-101"
  accessKeyExpiresAt?: string;
  createdAt: string;
  status: CaseLifecycleStatus;
  adminFeedback?: string;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  urgency: UrgencyLevel;
  distressReason: DistressReason;
  distressReasonNotes?: string;
  seller: {
    name: string;
    phone: string;
    preferredContactTime: string;
    governorate: string;
    city: string;
    relationship: OwnerRelationship;
  };
  vehicle: Car;
  disclosedIssues: string[];
  sellerConditionStory: string;
  financing: {
    institutionKey: string;
    institutionName: string;
    productType: string;
    estimatedOutstandingPrincipal: number;
    outstandingPrincipal?: number;
    monthlyInstallment: number;
    remainingMonths: number;
    remainingInstallmentsCount?: number;
    arrearsAmount: number;
    overdueInstallmentsCount?: number;
    overdueAmount?: number;
    approximatePayoffQuote?: number;
    clearanceStatus?: string;
    hasOfficialStatement: boolean;
    statementDate?: string;
    isVerifiedByStaff: boolean;
    verifiedSettlementAmount?: number;
    unverifiedNotice: string;
  };
  valuation?: ValuationResult;
  settlementStatement: ItemizedSettlementStatement;
  settlement?: any;
  callLogs: CallLogEntry[];
  timeline: CaseTimelineEvent[];
  buyerInquiries: BuyerInquiryRecord[];
  internalNotes: string[];
  documents: RequiredDocumentMetadata[];
  revisions?: CaseRevisionRecord[];
  editStatus?: 'none' | 'pending_review' | 'approved' | 'rejected';
  pendingEditsCount?: number;
}

export interface Inquiry {
  id: string;
  carId: string;
  carTitle: string;
  buyerName: string;
  buyerPhone: string;
  offerAmount: number;
  paymentPreference: 'cash_full' | 'direct_bank_settlement' | 'new_financing';
  status: 'new' | 'contacted' | 'appointment_set' | 'deal_closed';
  createdAt: string;
  message?: string;
}

export interface FinancingScenarioResult {
  route: TransactionRoute;
  routeNameAr: string;
  routeNameEn: string;
  descriptionAr: string;
  feasibilityRating: 'موصى به للغاية' | 'متاح بشروط' | 'يتطلب مراجعة خاصة';
  salePrice: number;
  bankSettlementAmount: number;
  platformFee: number;
  trafficAndNotaryFee: number;
  buyerTotalCost: number;
  buyerSaving: number;
  buyerSavingPercent: number;
  sellerNetProceeds: number;
  estimatedTimelineDays: string;
  requiredDocuments: string[];
  keyRisks: string[];
}

// Vehicle Catalog Interfaces
export interface VehicleMake {
  id: string;
  nameAr: string;
  nameEn: string;
  country: string;
  isPopularInEgypt: boolean;
}

export interface VehicleModel {
  id: string;
  makeId: string;
  nameAr: string;
  nameEn: string;
  bodyType: 'سيدان' | 'SUV / كروس أوفر' | 'هاتشباك' | 'بيك أب' | 'MPV عائلية';
}

export interface VehicleTrim {
  id: string;
  modelId: string;
  nameAr: string;
  nameEn: string;
  years: number[];
  transmission: 'أوتوماتيك' | 'مانيوال' | 'CVT' | 'ثنائي التعشيق (Dual Clutch)';
  engineSize: string;
  fuelType: 'بنزين' | 'هايبرد (هجين)' | 'كهرباء بالكامل (EV)' | 'غاز طبيعي' | 'ديزل';
  horsepower?: number;
}

export interface VehicleCatalogMetadata {
  earliestYearAllowed: number;
  currentYear: number;
  totalMakes: number;
  totalModels: number;
  verifiedSource: string;
  lastUpdated: string;
  knownGapsAr: string[];
}

export interface RequiredDocumentMetadata {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  applicableStatuses: ListingVehicleStatus[];
  isRequired: boolean;
  issuedByAr: string;
  purposeAr: string;
  verified: boolean;
  source: string;
  lastVerifiedDate: string;
  allowProceedWithout: boolean;
  uploadedFileName?: string;
  uploadedFileSize?: string;
  uploadedAt?: string;
  status: 'required' | 'optional' | 'uploaded' | 'under_review' | 'not_applicable';
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  fileUrl?: string;
}

export type PhotoSlotType = 
  | 'front' 
  | 'rear' 
  | 'right' 
  | 'left' 
  | 'interior' 
  | 'odometer' 
  | 'wheels' 
  | 'engine' 
  | 'damage' 
  | 'additional';

export interface PhotoSlotItem {
  id: string;
  slotType: PhotoSlotType;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  isRequired: boolean;
  previewUrl?: string;
  file?: File;
  fileName?: string;
  fileSizeKb?: number;
}
