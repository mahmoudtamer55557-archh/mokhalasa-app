import React, { useState, useRef } from 'react';
import { Printer, X, ShieldCheck, FileText, CheckCircle2, AlertTriangle, Building, Car as CarIcon, Download } from 'lucide-react';
import MokhalasaSvgLogo from '../brand/MokhalasaSvgLogo';

interface PrintableAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  carData?: {
    make: string;
    model: string;
    year: number;
    chassisNumber?: string;
    plateNumber?: string;
    price: number;
    bankName?: string;
    settlementAmount?: number;
    sellerName?: string;
    sellerPhone?: string;
    sellerNationalId?: string;
    buyerName?: string;
    buyerPhone?: string;
    buyerNationalId?: string;
  };
}

export const PrintableAgreementModal: React.FC<PrintableAgreementModalProps> = ({
  isOpen,
  onClose,
  carData
}) => {
  const [sellerName, setSellerName] = useState(carData?.sellerName || '');
  const [sellerId, setSellerId] = useState(carData?.sellerNationalId || '');
  const [sellerPhone, setSellerPhone] = useState(carData?.sellerPhone || '');
  
  const [buyerName, setBuyerName] = useState(carData?.buyerName || '');
  const [buyerId, setBuyerId] = useState(carData?.buyerNationalId || '');
  const [buyerPhone, setBuyerPhone] = useState(carData?.buyerPhone || '');

  const [carMakeModel, setCarMakeModel] = useState(`${carData?.make || 'نيسان'} ${carData?.model || 'صني'}`);
  const [carYear, setCarYear] = useState(String(carData?.year || 2023));
  const [chassisNum, setChassisNum] = useState(carData?.chassisNumber || 'ME1NC1159N8XXXXXX');
  const [plateNum, setPlateNum] = useState(carData?.plateNumber || 'ق هـ ر 1234');

  const [grossPrice, setGrossPrice] = useState(Number(carData?.price) || 600000);
  const [bankName, setBankName] = useState(carData?.bankName || 'البنك التجاري الدولي (CIB)');
  const [settlementAmount, setSettlementAmount] = useState(Number(carData?.settlementAmount) || 350000);
  const [earnestDeposit, setEarnestDeposit] = useState(10000);

  const feeMokhalasa = Math.round(grossPrice * 0.015);
  const netSellerAmount = grossPrice - settlementAmount - feeMokhalasa;

  const agreementDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      {/* Top action bar (hidden during print) */}
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header Controls */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-green" />
            <span className="font-bold text-sm">استمارة اتفاق وساطة وحجز مبدئي لمركبة (جاهزة للطباعة والتوقيع)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-brand-green hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الاستمارة / حفظ PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Document Container */}
        <div className="p-6 sm:p-10 overflow-y-auto text-slate-800 leading-relaxed text-xs space-y-6 print:p-0 print:m-0 print:text-[11px]" dir="rtl">
          
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                استمارة اتفاق وساطة وحجز مبدئي لمركبة
              </h1>
              <p className="text-3xs sm:text-2xs text-slate-500">
                منظمة عبر منصة «مخلصة» لوساطة وتسوية المركبات وفقاً لقوانين التجارة والبنك المركزي المصري
              </p>
            </div>
            <div className="text-left flex flex-col items-end">
              <span className="font-mono text-2xs text-slate-400">كود المعاملة: MOK-{Math.floor(100000 + Math.random() * 900000)}</span>
              <span className="text-2xs font-bold text-slate-700">التاريخ: {agreementDate}</span>
            </div>
          </div>

          {/* Section 1: Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Seller Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 space-y-2">
              <h3 className="font-black text-xs text-brand-navy border-b border-slate-200 pb-1">
                الطرف الأول (البائع / مالك المركبة):
              </h3>
              <div className="space-y-1.5 text-2xs">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 w-20">الاسم الثلاثي:</span>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="اسم البائع كما بالرخصة"
                    className="flex-1 font-bold bg-transparent border-b border-dashed border-slate-400 focus:outline-none print:border-none"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 w-20">الرقم القومي:</span>
                  <input
                    type="text"
                    value={sellerId}
                    onChange={(e) => setSellerId(e.target.value)}
                    placeholder="14 رقم"
                    className="flex-1 font-mono font-bold bg-transparent border-b border-dashed border-slate-400 focus:outline-none print:border-none"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 w-20">رقم الهاتف:</span>
                  <input
                    type="text"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="flex-1 font-mono font-bold bg-transparent border-b border-dashed border-slate-400 focus:outline-none print:border-none"
                  />
                </div>
              </div>
            </div>

            {/* Buyer Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 space-y-2">
              <h3 className="font-black text-xs text-brand-navy border-b border-slate-200 pb-1">
                الطرف الثاني (المشتري):
              </h3>
              <div className="space-y-1.5 text-2xs">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 w-20">الاسم الثلاثي:</span>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="اسم المشتري"
                    className="flex-1 font-bold bg-transparent border-b border-dashed border-slate-400 focus:outline-none print:border-none"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 w-20">الرقم القومي:</span>
                  <input
                    type="text"
                    value={buyerId}
                    onChange={(e) => setBuyerId(e.target.value)}
                    placeholder="14 رقم"
                    className="flex-1 font-mono font-bold bg-transparent border-b border-dashed border-slate-400 focus:outline-none print:border-none"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 w-20">رقم الهاتف:</span>
                  <input
                    type="text"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="flex-1 font-mono font-bold bg-transparent border-b border-dashed border-slate-400 focus:outline-none print:border-none"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Section 2: Vehicle Specs */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 space-y-2">
            <h3 className="font-black text-xs text-brand-navy border-b border-slate-200 pb-1">
              بيانات المركبة محل الاتفاق:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-2xs">
              <div>
                <span className="text-slate-500 block">الماركة والموديل:</span>
                <input
                  type="text"
                  value={carMakeModel}
                  onChange={(e) => setCarMakeModel(e.target.value)}
                  className="w-full font-bold bg-transparent border-b border-dashed border-slate-400 focus:outline-none print:border-none"
                />
              </div>
              <div>
                <span className="text-slate-500 block">سنة الصنع:</span>
                <input
                  type="text"
                  value={carYear}
                  onChange={(e) => setCarYear(e.target.value)}
                  className="w-full font-bold bg-transparent border-b border-dashed border-slate-400 focus:outline-none print:border-none"
                />
              </div>
              <div>
                <span className="text-slate-500 block">رقم اللوحات المعدنية:</span>
                <input
                  type="text"
                  value={plateNum}
                  onChange={(e) => setPlateNum(e.target.value)}
                  className="w-full font-bold bg-transparent border-b border-dashed border-slate-400 focus:outline-none print:border-none"
                />
              </div>
              <div>
                <span className="text-slate-500 block">رقم الشاسيه:</span>
                <input
                  type="text"
                  value={chassisNum}
                  onChange={(e) => setChassisNum(e.target.value)}
                  className="w-full font-mono font-bold bg-transparent border-b border-dashed border-slate-400 focus:outline-none print:border-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Financial Settlement Table */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-300 space-y-2">
            <h3 className="font-black text-xs text-emerald-950 border-b border-emerald-200 pb-1 flex items-center justify-between">
              <span>الموقف المالي وجدول توزيع المبالغ:</span>
              <span className="text-3xs font-mono font-normal">تطبيق مبدأ السداد المباشر للبنك الدائن</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-2xs">
              <div className="p-2 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 block">إجمالي سعر البيع المتفق عليه:</span>
                <span className="font-black text-sm text-slate-900">{grossPrice.toLocaleString()} ج.م</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 block">سداد مديونية البنك ({bankName}):</span>
                <span className="font-black text-sm text-rose-700">{settlementAmount.toLocaleString()} ج.م</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 block">أتعاب وساطة مخلصة (1.5%):</span>
                <span className="font-black text-sm text-brand-navy">{feeMokhalasa.toLocaleString()} ج.م</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-emerald-300">
                <span className="text-emerald-800 font-bold block">صافي ما يستلمه البائع:</span>
                <span className="font-black text-sm text-emerald-700">{netSellerAmount.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>

          {/* Section 4: Binding Terms */}
          <div className="space-y-1.5 text-3xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed">
            <h4 className="font-black text-2xs text-slate-800">البنود والشروط التنفيذية للاتفاق:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>السداد البنكي المباشر:</strong> يلتزم المشتري بتوريد مبلغ مديونية البنك مباشرة في خزينة الفرع الدائن باسم حساب قرض البائع، ويستلم إيصالاً بنكياً رسمياً بذلك.</li>
              <li><strong>إجراءات فك الحظر:</strong> يلتزم البائع فور استخراج إفادة السداد البنكية بمرافقة المشتري لوحدة المرور والشهر العقاري لتسجيل عقد البيع النهائي المسجل للمشتري ونقل الملكية.</li>
              <li><strong>استحقاق أتعاب الوساطة:</strong> يقر الطرفان باستحقاق منصة «مخلصة» لأتعاب التنسيق والوساطة وقدرها (1.5%) تُسدد فور توثيق عقد البيع الرسمي بالشهر العقاري.</li>
              <li><strong>إخلاء المسؤولية:</strong> منصة «مخلصة» هي جهة تنسيق ووساطة تنظيمية ولا تعد طرفاً مديناً أو مقرضاً، ولا تودع أي أموال في حساباتها طبقاً لقانون البنك المركزي رقم 194 لسنة 2020.</li>
            </ol>
          </div>

          {/* Section 5: Signatures Block */}
          <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-center text-2xs">
            <div className="space-y-8">
              <span className="font-black block">توقيع الطرف الأول (البائع):</span>
              <div className="border-b border-dashed border-slate-400 mx-4"></div>
              <span className="text-3xs text-slate-400 block">الاسم والتوقيع</span>
            </div>

            <div className="space-y-8">
              <span className="font-black block">توقيع الطرف الثاني (المشتري):</span>
              <div className="border-b border-dashed border-slate-400 mx-4"></div>
              <span className="text-3xs text-slate-400 block">الاسم والتوقيع</span>
            </div>

            <div className="space-y-8">
              <span className="font-black text-brand-navy block">اعتماد وسيط منصة «مخلصة»:</span>
              <div className="border-b border-dashed border-slate-400 mx-4"></div>
              <span className="text-3xs text-slate-400 block">الختم وتوقيع المنسق</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PrintableAgreementModal;
