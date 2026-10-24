import { Car, DistressedVehicleCase, PublicVehicleListing } from '../types';

/**
 * Public Data Boundary Sanitizer
 * 
 * Strict security boundary: Strips all private seller, financial, identity,
 * and internal operational data before public rendering or exposure.
 * 
 * NEVER exposes:
 * - Direct seller phone numbers
 * - Seller full legal names / national IDs
 * - Exact private addresses or GPS coordinates
 * - Internal CRM call logs and staff notes
 * - Assigned employee personal information
 * - Unmasked chassis / VIN numbers
 * - Private financial documents (PDFs/statement scans)
 */
export function sanitizeToPublicListing(
  car: Car,
  parentCase?: DistressedVehicleCase
): PublicVehicleListing {
  const isLenderVerified = parentCase?.financing?.isVerifiedByStaff || car.financingDetails?.hasOfficialStatement || false;
  
  const verificationBadgeText = isLenderVerified
    ? 'تم التحقق من خطاب السداد المعجل البنكي الرسمي'
    : 'تقدير مبدئي — بانتظار استخراج خطاب السداد المعجل من الفرع';

  const outstandingPrincipal = parentCase?.financing?.estimatedOutstandingPrincipal || car.financingDetails?.outstandingPrincipal || 0;
  const earlySettlementFee = car.financingDetails?.earlySettlementFee || 0;
  const totalSettlement = car.financingDetails?.totalSettlementRequired || (outstandingPrincipal + earlySettlementFee);
  const sellerNet = car.financingDetails?.sellerNetProceeds || (car.askingPrice - totalSettlement);

  return {
    id: car.id,
    caseReference: parentCase?.caseReference || car.id.toUpperCase(),
    make: car.make,
    model: car.model,
    year: car.year,
    trim: car.trim,
    transmission: car.transmission,
    engineSize: car.engineSize,
    fuelType: car.fuelType,
    mileage: car.mileage,
    city: car.city,
    color: car.color,
    askingPrice: car.askingPrice,
    estimatedMarketValue: car.estimatedMarketValue,
    images: car.images && car.images.length > 0 ? car.images : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'],
    financingProviderNameAr: parentCase?.financing?.institutionName || car.financingDetails?.providerNameAr || 'تمويل بنكي بحظر بيع',
    financingType: car.financingType,
    isLenderVerified,
    verificationBadgeText,
    disclosedProblems: car.disclosedProblems || parentCase?.disclosedIssues || [],
    sellerConditionStory: car.sellerConditionStory || parentCase?.sellerConditionStory || car.description || '',
    inspection: car.inspection,
    licenseValidityMonths: car.licenseValidityMonths,
    sellerType: car.sellerType || 'مالك أول',
    outstandingPrincipalEstimated: outstandingPrincipal,
    earlySettlementFeeEstimated: earlySettlementFee,
    totalSettlementRequiredEstimated: totalSettlement,
    sellerNetProceedsEstimated: sellerNet,
    createdAt: car.createdAt,
    featured: car.featured,
    hasPendingEdit: parentCase?.editStatus === 'pending_review'
  };
}

/**
 * Filter approved public listings only
 * Ensures only cases with status 'listing_approved' (or higher active status) are displayed publicly.
 */
export function filterApprovedPublicCases(cases: DistressedVehicleCase[]): PublicVehicleListing[] {
  const publicAllowedStatuses = [
    'listing_approved',
    'buyer_inquiry_received',
    'buyer_qualification',
    'offer_received',
    'awaiting_seller_response',
    'negotiation',
    'settlement_coordination'
  ];

  return cases
    .filter(c => publicAllowedStatuses.includes(c.status) && c.vehicle)
    .map(c => sanitizeToPublicListing(c.vehicle, c));
}
