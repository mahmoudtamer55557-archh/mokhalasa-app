import { 
  ItemizedSettlementStatement, SettlementCostItem, 
  PlatformCommissionConfig 
} from '../types';

export const DEFAULT_COMMISSION_CONFIG: PlatformCommissionConfig = {
  rate: 0.015, // 1.5%
  basis: 'gross_sale_price',
  payer: 'seller',
  collectionTiming: 'at_bank_settlement'
};

interface SettlementCalculationParams {
  grossSalePrice: number;
  lenderSettlementAmount: number;
  lenderSettlementSource?: string;
  lenderSettlementValidityDate?: string;
  earlySettlementFee?: number;
  releaseLetterFee?: number;
  trafficAndGovFees?: number;
  inspectionFee?: number;
  customCommissionRate?: number;
  otherCosts?: SettlementCostItem[];
}

export function calculateItemizedSettlement(
  params: SettlementCalculationParams
): ItemizedSettlementStatement {
  const {
    grossSalePrice,
    lenderSettlementAmount,
    lenderSettlementSource = 'بيان مديونية بنكية رسمي',
    lenderSettlementValidityDate = 'صالحة لمدة 10 أيام من تاريخه',
    earlySettlementFee = 0,
    releaseLetterFee = 1500,
    trafficAndGovFees = 800,
    inspectionFee = 1200,
    customCommissionRate = DEFAULT_COMMISSION_CONFIG.rate,
    otherCosts = []
  } = params;

  // Platform commission: 1.5% of gross sale price
  const platformCommission = Math.round(grossSalePrice * customCommissionRate);

  // Total deductions calculation
  const otherCostsTotal = otherCosts
    .filter((c) => c.isDeductedFromSaleProceeds)
    .reduce((sum, item) => sum + item.amount, 0);

  const totalDeductions =
    lenderSettlementAmount +
    earlySettlementFee +
    releaseLetterFee +
    trafficAndGovFees +
    inspectionFee +
    platformCommission +
    otherCostsTotal;

  const netProceedsToSeller = grossSalePrice - totalDeductions;
  const isShortfall = netProceedsToSeller < 0;
  const shortfallAmount = isShortfall ? Math.abs(netProceedsToSeller) : 0;

  return {
    grossSalePrice,
    lenderSettlementAmount,
    lenderSettlementSource,
    lenderSettlementValidityDate,
    earlySettlementFee,
    releaseLetterFee,
    trafficAndGovFees,
    inspectionFee,
    platformCommission,
    commissionRate: customCommissionRate,
    otherCosts,
    totalDeductions,
    netProceedsToSeller,
    shortfallAmount,
    isShortfall,
    isPreliminary: !lenderSettlementValidityDate || lenderSettlementAmount === 0,
    sellerAccepted: false,
    buyerAccepted: false
  };
}
