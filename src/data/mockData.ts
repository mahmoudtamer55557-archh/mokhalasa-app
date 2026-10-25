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

// Initial state for pre-launch: clean empty marketplace
export const INITIAL_CARS: Car[] = [];
