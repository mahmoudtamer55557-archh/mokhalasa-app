import React, { useState } from 'react';
import { 
  ShieldCheck, CheckCircle2, 
  HelpCircle, PhoneCall, Mail, MapPin, Clock, MessageSquare, Send
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { sendConsultationReceivedWhatsApp } from '../services/whatsappService';
import { normalizeEgyptianPhone, getPhoneValidationError } from '../utils/phoneValidator';

interface StaticPagesProps {
  type: 'how-it-works' | 'faq' | 'terms' | 'privacy' | 'contact';
  onNavigate: (view: string) => void;
  lang?: 'ar' | 'en';
}

export const StaticPages: React.FC<StaticPagesProps> = ({ type, onNavigate, lang = 'ar' }) => {
  const isAr = lang === 'ar';
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'continuation' | 'payoff'>('continuation');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMsg, setContactMsg] = useState('');

  return (
    <div className="min-h-screen bg-brand-bg py-8 sm:py-10 px-4 sm:px-6 lg:px-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-5 sm:p-10 border border-brand-border shadow-card space-y-8 animate-fadeIn">
        
        {/* HOW IT WORKS VIEW */}
        {type === 'how-it-works' && (
          <div className="space-y-6">
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-brand-green uppercase tracking-wider block">
                {isAr ? 'دليل المعاملات الآمنة' : 'Safe Transaction Protocol'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">
                {isAr ? 'كيف تعمل منظومة «مخالصة» لحماية الطرفين؟' : 'How It Works: Step-by-Step with Mokhalasa'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                {isAr
                  ? 'المنظومة القانونية والتقنية الأولى في مصر للتخارج من أقساط سيارات حظر البيع بأمان، والتقسيط المباشر والكاش المعتمد دون التعرض للنصب أو المساءلة.'
                  : 'The official and legally secured platform in Egypt for auto loan exits, sale ban releases, in-house installments, and certified cash sales without risks.'}
              </p>
            </div>

            {/* Workflow Mode Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-2xl max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setActiveWorkflowTab('continuation')}
                className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition ${
                  activeWorkflowTab === 'continuation'
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                تكملة الأقساط (حظر بيع)
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkflowTab('payoff')}
                className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition ${
                  activeWorkflowTab === 'payoff'
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                التسوية البنكية الفورية (كاش)
              </button>
            </div>

            {/* TAB 1: INSTALLMENT CONTINUATION WORKFLOW */}
            {activeWorkflowTab === 'continuation' && (
              <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-emerald-900 block mb-0.5">منظومة تكملة الأقساط: كيف يتم تأمينك كبائع أو مشترٍ؟</span>
                    <p className="text-2xs text-emerald-800 leading-relaxed">
                      هذا المسار مخصص لنقل حيازة السيارة لمشترٍ يكمل باقي أقساط البنك مع استلام البائع مقدماً نقدياً فورياً في يده. تعمل مخالصة كضامن ومراقب تقني وقانوني حتى سداد آخر قسط وفك الحظر النهائي.
                    </p>
                  </div>
                </div>

                {[
                  {
                    step: '01',
                    titleAr: 'الفحص الفني المعتمد وتدقيق المديونية البنكية',
                    titleEn: 'Certified Technical Inspection & Debt Verification',
                    descAr: 'فحص فني شامل للسيارة لتحديد حالتها الواقعية، ومراجعة رسمية لكشف حساب البنك أو شركة التمويل للتأكد من قيمة القسط وأصل المديونية وعدد الأقساط المتبقية.',
                    descEn: 'Comprehensive inspection of vehicle condition alongside bank verification of monthly installments and remaining terms.'
                  },
                  {
                    step: '02',
                    titleAr: 'توقيع عقد الاستغلال والانتفاع الثلاثي الموثق',
                    titleEn: 'Notarized Tripartite Usufruct Contract',
                    descAr: 'تحرير عقد قانوني رسمي بين البائع والمشتري ومخالصة ينقل كامل المسؤولية الجنائية والمدنية والمخالفات والحوادث فورياً على المشتري المستغل، مع إقرار استلام السيارة كأمانة لحماية البائع من شبهة تبديد الضمانة.',
                    descEn: 'Execution of a tripartite usufruct contract transferring all criminal and civil liability for traffic and vehicle use directly to the new buyer.'
                  },
                  {
                    step: '03',
                    titleAr: 'تأمين السيارة بجهاز تتبع ذكي IoT GPS مع ميزة إيقاف المحرك',
                    titleEn: 'IoT GPS Tracking & Remote Engine Cutoff Installation',
                    descAr: 'تركيب جهاز تتبع مشفر مرتبط بسيرفرات مخالصة مع تحديد النطاق الجغرافي (Geofencing)، وتفعيل ميزة التعطيل الآمن لتشغيل المحرك (Engine Immobilizer) عند التخلف عن السداد لحفظ أصل المركبة.',
                    descEn: 'Installation of high-grade encrypted IoT tracker with geofencing and remote starter cutoff failsafes in case of default.'
                  },
                  {
                    step: '04',
                    titleAr: 'تسليم السيارة واستلام البائع المقدم النقدي الفوري',
                    titleEn: 'Vehicle Handover & Seller Down Payment Delivery',
                    descAr: 'يستلم البائع مبلغ التنازل النقدي المتفق عليه كاش في يده، ويستلم المشتري حيازة السيارة ورخصتها ومفتاحها تحت إشراف المنصة.',
                    descEn: 'The seller receives their agreed cash advance at handover, while buyer receives physical custody and vehicle keys.'
                  },
                  {
                    step: '05',
                    titleAr: 'إدارة حساب الضمان وتوريد الأقساط للبنك شهرياً',
                    titleEn: 'Escrow Payment Servicing & Bank Deposit Receipts',
                    descAr: 'يودع المشتري القسط شهرياً في حساب الضمان عبر مخالصة، وتقوم المنصة بتوريد القسط مباشرة للبنك وإرسال إيصال السداد الرسمي فورياً لهاتف البائع لإبراء ذمته.',
                    descEn: 'Buyer deposits monthly installments into Mokhalasa escrow; we remit directly to the lender and issue official clearance receipts to seller.'
                  },
                  {
                    step: '06',
                    titleAr: 'سداد آخر قسط واستخراج خطاب فك الحظر ونقل الملكية',
                    titleEn: 'Final Payoff, Lien Release & Title Registration',
                    descAr: 'عند سداد القسط الأخير، يتولى فريق مخالصة استخراج مخالصة البنك الرسمية وشهادة فك الحظر الموجهة للمرور، والتنسيق لحضور الطرفين بالشهر العقاري لنقل الملكية النهائية للمشتري.',
                    descEn: 'Upon final installment completion, Mokhalasa secures official bank lien release and coordinates final Notary title registration.'
                  }
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white font-black text-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      {s.step}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-sm sm:text-base text-brand-navy">
                        {isAr ? s.titleAr : s.titleEn}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {isAr ? s.descAr : s.descEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: CASH PAYOFF WORKFLOW */}
            {activeWorkflowTab === 'payoff' && (
              <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                {[
                  {
                    step: '01',
                    titleAr: 'الفحص الفني المعتمد (150 نقطة فحص)',
                    titleEn: '150-Point Certified Technical Inspection',
                    descAr: 'تخضع السيارة لفحص دقيق للشاسيه والمحرك والدهان وسجل الصيانات بمركز فحص معتمد لضمان خلوها التام من الحوادث الهيكلية وتحديد القيمة السوقية العادلة.',
                    descEn: 'The vehicle undergoes rigorous inspection covering chassis, engine, paint, and service history at certified diagnostic centers.'
                  },
                  {
                    step: '02',
                    titleAr: 'استخراج بيان المديونية البنكية الرسمي (Payoff Quote)',
                    titleEn: 'Official Bank Debt Statement (Payoff Quote)',
                    descAr: 'يتوجه البائع للبنك الدائن أو شركة التمويل الاستهلاكي لاستخراج خطاب استعلام رسمي مختوم يحدد أصل الدين المتبقي وعمولة السداد المعجل ورسوم فك الحظر بدقة.',
                    descEn: 'The seller requests an official, stamped bank payoff quote specifying principal debt, early settlement fee, and lien clearance charges.'
                  },
                  {
                    step: '03',
                    titleAr: 'مطابقة المشتري وتوقيع الاتفاق الثلاثي المشروط',
                    titleEn: 'Buyer Matching & Conditional Tripartite Agreement',
                    descAr: 'يتم توقيع عقد اتفاق ثلاثي منظم بين البائع والمشتري والمنصة، يحدد سعر البيع المتفق عليه، والمبلغ الواجب إيداعه بالبنك، وضمان حيازة المشتري للسيارة ومستنداتها فور السداد.',
                    descEn: 'A binding tripartite contract is executed detailing agreed price, exact payoff deposit, and buyer possession guarantees upon bank counter payment.'
                  },
                  {
                    step: '04',
                    titleAr: 'سداد مديونية البنك مباشرة في حساب القرض بالفرع',
                    titleEn: 'Direct Bank Payoff at Creditor Branch (Zero-Custody)',
                    descAr: 'يتوجه المشتري بصحبة البائع ومندوب مخالصة لفرع البنك لإيداع مبلغ التسوية مباشرة في حساب القرض، واستلام إيصال الصراف الرسمي (Teller Slip) المثبت لبراءة الذمة.',
                    descEn: 'Buyer, seller, and a Mokhalasa specialist visit the bank. Settlement funds are deposited directly into the loan account with zero intermediary custody.'
                  },
                  {
                    step: '05',
                    titleAr: 'إصدار خطاب فك الحظر والتوجه لإدارة المرور',
                    titleEn: 'Lien Clearance Letter & Traffic Directorate Deregistration',
                    descAr: 'يصدر البنك خطاب رفع حظر البيع الموجه للمرور وشهادة المخالصة النهائية. يتوجه الطرفان لوحدة المرور لإلغاء إشارة الحظر من على السيستم الإلكتروني للمرور.',
                    descEn: 'The bank issues official clearance and ban removal letters. Both parties clear the computer lien record at the traffic unit.'
                  },
                  {
                    step: '06',
                    titleAr: 'توثيق عقد البيع النهائي بالشهر العقاري وسداد باقي الثمن',
                    titleEn: 'Notarized Sale Transfer at Real Estate Registry',
                    descAr: 'يتم تحرير عقد بيع نهائي مسجل وموثق بالشهر العقاري باسم المشتري مباشرة، ويستلم البائع صافي المبلغ المتبقي كاش في يده، وتسدد أتعاب المنصة (1.5%).',
                    descEn: 'Final notarized ownership transfer deed is registered at the Notary Office directly in buyer’s name. The seller receives net cash balance.'
                  }
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="w-12 h-12 rounded-2xl bg-brand-navy text-white font-black text-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      {s.step}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-sm sm:text-base text-brand-navy">
                        {isAr ? s.titleAr : s.titleEn}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {isAr ? s.descAr : s.descEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 text-center">
              <button
                onClick={() => onNavigate('marketplace')}
                className="py-3.5 px-8 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white font-bold text-xs shadow-md transition"
              >
                {isAr ? 'تصفح السيارات المتاحة للبيع الآن' : 'Browse Available Cars Now'}
              </button>
            </div>
          </div>
        )}

        {/* FAQ VIEW */}
        {type === 'faq' && (
          <div className="space-y-6">
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-brand-green uppercase tracking-wider block">
                {isAr ? 'إجابات الخبراء' : 'Expert Answers'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">
                {isAr ? 'الأسئلة الشائعة والأمان القانوني' : 'Frequently Asked Questions & Legal Safety'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                {isAr
                  ? 'كل ما تحتاج لمعرفته حول التعامل القانوني مع السيارات المقسطة والمحظورة بيعاً في مصر.'
                  : 'Everything you need to know about legally buying and selling financed, installment, and cash cars in Egypt.'}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {[
                {
                  qAr: 'هل يمكن عمل توكيل بيع أو عقد مسجل لسيارة عليها حظر بيع بالشهر العقاري؟',
                  qEn: 'Can a power of attorney (POA) or sale deed be registered for a car with a bank sale ban at the Notary?',
                  aAr: 'لا نهائياً. يمنع القانون المصري وتعليمات مصلحة الشهر العقاري المقترنة بقاعدة بيانات المرور إلكترونياً تسجيل أي عقد بيع أو إصدار أي توكيل بيع (للنفس أو للغير) طالما وجد قيد حظر بيع سارٍ لصالح بنك أو جهة تمويلية.',
                  aEn: 'Absolutely not. Egyptian law and Notary regulations linked to the traffic electronic registry strictly prohibit registering sales or issuing power-of-attorney while an active bank lien exists.'
                },
                {
                  qAr: 'لماذا ترفض منصة «مخالصة» بيع السيارات بـ "توكيل إدارة شامل"؟',
                  qEn: 'Why does Mokhalasa refuse transactions via informal management power of attorney?',
                  aAr: 'لأن توكيل الإدارة لا ينقل الملكية قانوناً، وينتهي فوراً بحكم المادة 714 من القانون المدني بوفاة الموكل أو الوكيل. كما أنه يعرض المشتري لخطر مصادرة السيارة إذا تعثر البائع في سداد أقساط أخرى، ويعرض البائع للمساءلة الجنائية إذا ارتكب المشتري أي مخالفات أو جرائم بالسيارة.',
                  aEn: 'Because a management POA does not transfer legal ownership and terminates automatically upon death under Article 714 of the Civil Code. It leaves buyers vulnerable to impoundment and exposes sellers to criminal liability.'
                },
                {
                  qAr: 'كيف يضمن المشتري أمواله بعد سداد مديونية البائع بالبنك؟',
                  qEn: 'How does the buyer secure their funds after paying the seller’s bank debt?',
                  aAr: 'يتم السداد بموجب "عقد اتفاق التخارج المشروط الثلاثي" الذي يثبت فيه رقم إيصال الإيداع بحساب القرض، ويستلم المشتري حيازة السيارة ورخصتها ومفتاحها فور السداد داخل الفرع، ويلتزم البائع جنائياً ومدنياً بالتوجه الفوري للمرور والشهر العقاري لنقل الملكية بمجرد خروج خطاب فك الحظر.',
                  aEn: 'Payment is made under a legally binding tripartite contract documenting the bank teller receipt. The buyer takes immediate physical custody and original documents, while the seller is legally obligated to execute title transfer upon clearance.'
                },
                {
                  qAr: 'هل تستلم منصة «مخالصة» أموال السداد أو الأقساط بحساباتها؟',
                  qEn: 'Does Mokhalasa hold settlement funds or installment payments in its own accounts?',
                  aAr: 'قطعاً لا. تنفيذاً لأحكام قانون البنك المركزي رقم 194 لسنة 2020 بشأن حظر توظيف الأموال، المنصة لا تلمس مليمًا واحداً من أموال التسوية البنكية. يقوم المشتري بنفسه بإيداع المبلغ في حساب قرض البائع داخل خزينة فرع البنك الدائن، وتتقاضى المنصة فقط أتعاب تنظيم الصفقة (1.5%) عند توثيق البيع.',
                  aEn: 'Strictly no. Pursuant to Central Bank Law 194/2020, Mokhalasa operates on a 100% Zero-Custody principle. Buyers deposit directly at the creditor bank counter. Mokhalasa only receives its 1.5% success fee upon final notary closing.'
                },
                {
                  qAr: 'كم تبلغ عمولة السداد المعجل في البنوك المصرية؟',
                  qEn: 'What are early payoff penalty fees across Egyptian banks?',
                  aAr: 'تختلف حسب البنك: في بنك كريدي أجريكول تبلغ 15% على أصل الدين، وفي البنك التجاري الدولي (CIB) 7%، وفي البنك الأهلي المصري 3% إلى 3.5%، وفي QNB مصر 7%، وكونتكت للتمويل الاستهلاكي 4%، وتوضح حاسبة مخالصة الرسوم بدقة لكل بنك.',
                  aEn: 'Fees range from 3% to 15% depending on the institution (e.g. Crédit Agricole 15%, CIB 7%, NBE 3-3.5%, QNB 7%, Contact 4%). Mokhalasa’s built-in calculator provides exact breakdowns for each bank.'
                },
                {
                  qAr: 'هل توفر منصة «مخالصة» سيارات بالتقسيط المباشر بدون بنوك وسيارات كاش؟',
                  qEn: 'Does Mokhalasa offer direct in-house installment cars and certified cash cars?',
                  aAr: 'نعم بالتأكيد. بالإضافة إلى تخصصنا الرائد في تسوية سيارات الأقساط البنكية وحظر البيع، توفر مخالصة مساراً متكاملاً للتقسيط المباشر بين المعارض أو الملاك والمشترين بضمانات مباشرة بدون استعلام بنكي معقد، إلى جانب قسم متخصص للسيارات الكاش ذات الملكية الخالصة والمفحوصة بالكامل.',
                  aEn: 'Yes! Along with our premier bank distress and sale-ban track, Mokhalasa provides dedicated tracks for direct in-house installments with showrooms/owners (no bank credit checks required) and verified clean-title cash cars.'
                },
                {
                  qAr: 'كيف يضمن البائع ألا يهرب المشتري بالسيارة أو يتوقف عن سداد أقساط البنك في نظام تكملة الأقساط؟',
                  qEn: 'How does the seller ensure the buyer does not default on bank installments or abscond with the car in the continuation system?',
                  aAr: 'عبر منظومة الحماية الرباعية من مخالصة: 1) تركيب جهاز تتبع مشفر IoT GPS مربوط بسيرفرات مخالصة مع ميزة الإيقاف الآمن للمحرك عن بُعد (Engine Immobilizer) عند التخلف غير المبرر عن السداد، 2) عقد استغلال وانتفاع ثلاثي رسمي يثبت استلام المشتري للسيارة كأمانة وينقل كامل المسؤولية الجنائية والمدنية والمخالفات والحوادث عليه فورياً، 3) حساب الضمان البنكي لتوريد القسط وإصدار إيصال السداد الرسمي للبائع شهرياً، 4) حق الاسترداد الفوري للأصل.',
                  aEn: 'Through Mokhalasa’s 4-pillar protection: 1) Encrypted IoT GPS with remote starter immobilizer, 2) Notarized tripartite usufruct contract transferring all civil and criminal liability to the buyer, 3) Escrow servicing ensuring direct bank payoff receipts for the seller, and 4) Immediate repossession protocols.'
                },
                {
                  qAr: 'هل يعتبر تسليم السيارة لمشتري يكمل الأقساط تبديداً أو جريمة يعاقب عليها القانون المصري؟',
                  qEn: 'Does handing over a bank-financed car to a buyer who continues installments constitute criminal breach of trust in Egypt?',
                  aAr: 'لا، طالما تم ذلك عبر عقد استغلال وانتفاع ثلاثي رسمي منظم (وليس بيعاً أو تنازلاً ناقلاً للملكية بالمخالفة للحظر). العقد يثبت صراحة استمرار ملكية البائع وقيد حظر البيع لصالح البنك، وأن المشتري مجرد حائز ومستغل ونائب في السداد؛ وبالتالي تنتفي نية التملك أو التصرف الضار بالضمانة البنكية، ويتم إبراء ذمة البائع شهرياً بتوريد الأقساط.',
                  aEn: 'No, provided it is executed under a notarized tripartite usufruct contract (not an unauthorized title transfer). The contract explicitly affirms the existing bank lien and designates the buyer solely as an authorized usufructuary custodian and installment servicer.'
                },
                {
                  qAr: 'كيف يعمل جهاز التتبع الذكي IoT GPS وخاصية إيقاف المحرك عن بُعد في مخالصة؟',
                  qEn: 'How does the IoT GPS tracking and remote engine cutoff operate at Mokhalasa?',
                  aAr: 'يتم تركيب جهاز تتبع معتمد مخفي داخل ضفيرة السيارة لا يمكن نزعه أو التلاعب به، متصل بسيرفرات مخالصة على مدار الساعة لرصد الموقع الجغرافي وتحديد النطاقات المصرح بها (Geofencing). في حال تأخر المشتري عن سداد القسط الشهري، ترسل المنصة إنذارات رسمية، وإذا امتنع يتم تفعيل خاصية الإيقاف الآمن للمحرك (لا ينطفئ أثناء السير حفاظاً على الأرواح، بل يُمنع المحرك من إعادة التشغيل بعد توقفه التام) حتى تسوية الموقف.',
                  aEn: 'A tamper-resistant IoT device connects to Mokhalasa servers with 24/7 geofencing. If installments default after automated notices, the remote immobilizer prevents engine restarts safely while stationary until arrears are resolved.'
                },
                {
                  qAr: 'لماذا لا تكفي إيصالات الأمانة وحدها بين البائع والمشتري في سوق السيارات؟',
                  qEn: 'Why are promissory notes (trust receipts) insufficient on their own between buyers and sellers?',
                  aAr: 'لأن إيصال الأمانة لا يحمي أصل السيارة إذا تم تهريبها أو إخفاؤها، ولا يمنع البنك من سحب السيارة أو ملاحقة البائع في حال تعثر المشتري، ولا ينفي المسؤولية الجنائية عن البائع في الحوادث والمخالفات الجسيمة إذا لم يحرر إقرار استلام وعقد استغلال رسمي ثلاثي مثبت التاريخ ومقترن بنظام مراقبة وتتبع لحظي.',
                  aEn: 'Because trust receipts do not safeguard the physical asset against theft or hiding, do not stop bank repossession or credit blacklisting, and do not shield the original owner from traffic/criminal liabilities without a comprehensive tripartite custody system.'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-extrabold text-sm text-brand-navy flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-brand-green flex-shrink-0" />
                    <span>{isAr ? item.qAr : item.qEn}</span>
                  </h3>
                  <p className={`text-slate-600 leading-relaxed ${isAr ? 'pr-6' : 'pl-6'}`}>
                    {isAr ? item.aAr : item.aEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TERMS VIEW */}
        {type === 'terms' && (
          <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <h1 className="text-2xl font-black text-brand-navy">
                {isAr ? 'الشروط والأحكام والمسؤولية القانونية' : 'Terms of Service & Legal Disclaimer'}
              </h1>
              <p className="text-slate-500">
                {isAr ? 'مسودة الشروط الاسترشادية المعدة للمراجعة القانونية المعتمدة' : 'Guiding terms compliant with Egyptian Commercial and Electronic Transaction laws'}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm text-brand-navy">
                {isAr ? '1. طبيعة عمل المنصة وإخلاء المسؤولية المصرفية' : '1. Nature of Platform & Banking Disclaimer'}
              </h3>
              <p>
                {isAr
                  ? 'منصة «مخالصة» (Mokhalasa) هي منصة وساطة تكنولوجية وتسويقية تعمل وفقاً لأحكام قانون التجارة المصري وقانون المعاملات الإلكترونية. المنصة ليست بنكاً ولا تقدم خدمات الائتمان أو القروض أو التمويل العقاري أو الاستهلاكي، ولا تتلقى ودائع أو مدفوعات نقدية نيابة عن العملاء.'
                  : 'Mokhalasa is a technological coordination platform operating under Egyptian commercial laws. It is not a bank, lending facility, or financial depository. Mokhalasa does not accept client deposits or loan payments in its accounts.'}
              </p>

              <h3 className="font-bold text-sm text-brand-navy">
                {isAr ? '2. التزام الأطراف بصحة البيانات' : '2. Accuracy of Submitted Data & Documentation'}
              </h3>
              <p>
                {isAr
                  ? 'يتحمل البائع المسؤولية المدنية والجنائية الكاملة عن صحة المستندات المقدمة وخلو المركبة من أي نزاعات قضائية أو قرارات تحفظ جنائي بخلاف حظر البيع البنكي المصرح عنه. يلتزم المشتري بتدقيق الفحص الفني المعتمد للمركبة قبل توقيع الاتفاق الثلاثي.'
                  : 'The seller bears full civil and criminal responsibility for document validity and vehicle clear title aside from disclosed liens. The buyer is responsible for reviewing 150-point technical inspection reports prior to contract execution.'}
              </p>

              <h3 className="font-bold text-sm text-brand-navy">
                {isAr ? '3. أتعاب المنصة وسياسة الإلغاء' : '3. Platform Fee (1.5%) & Settlement Closing'}
              </h3>
              <p>
                {isAr
                  ? 'تستحق أتعاب المنصة وقدرها (1.5%) من إجمالي القيمة البيعية المتفق عليها فور توثيق عقد البيع النهائي المسجل بالشهر العقاري. في حال تراجع أحد الطرفين بعد إتمام الإيداع البنكي دون سبب مشروع، تطبق الشروط الجزائية المنصوص عليها بالاتفاق الثلاثي.'
                  : 'Mokhalasa’s transparent fee is strictly 1.5% of agreed gross price, payable only upon completion of legal title transfer at the Real Estate Notary.'}
              </p>
            </div>
          </div>
        )}

        {/* PRIVACY VIEW */}
        {type === 'privacy' && (
          <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <h1 className="text-2xl font-black text-brand-navy">
                {isAr ? 'سياسة الخصوصية وحماية البيانات الشخصية' : 'Privacy & Data Protection Policy'}
              </h1>
              <p className="text-slate-500">
                {isAr ? 'امتثالاً لأحكام القانون رقم 151 لسنة 2020 في جمهورية مصر العربية' : 'Compliant with Egyptian Personal Data Protection Law No. 151 of 2020'}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm text-brand-navy">
                {isAr ? '1. حماية المستندات والبيانات الحساسة' : '1. Protection of Sensitive Identification & Documents'}
              </h3>
              <p>
                {isAr
                  ? 'تلتزم منصة مخالصة بعدم نشر أو مشاركة صور بطاقات الرقم القومي أو رخص السيارات أو كشوف الحسابات المصرفية مع أي طرف ثالث غير مصرح له. يتم حجب وتعتيم الأرقام الحساسة (Data Masking) في كافة العروض الترويجية العامة.'
                  : 'Mokhalasa never publishes or shares national ID copies, vehicle licenses, or bank statements with unauthorized third parties. Sensitive identifiers are masked across public marketplace listings.'}
              </p>

              <h3 className="font-bold text-sm text-brand-navy">
                {isAr ? '2. التخزين الآمن والتشفير' : '2. Secure Cloud Storage & AES-256 Encryption'}
              </h3>
              <p>
                {isAr
                  ? 'تخزن المستندات في مساحات سحابية مشفرة بمعايير (AES-256)، ويقتصر حق الاطلاع عليها على موظفي العمليات والامتثال القانوني لأغراض التحقق من صحة الصفقة فقط.'
                  : 'All uploaded verification files are encrypted using industry-standard AES-256 protocols. Access is strictly limited to authorized compliance staff for verification purposes.'}
              </p>

              <h3 className="font-bold text-sm text-brand-navy">
                {isAr ? '3. حق حذف الحساب وفترة السماح (30 يوماً للتراجع)' : '3. Account Deletion Rights & 30-Day Grace Period'}
              </h3>
              <p>
                {isAr
                  ? 'تنفيذاً لأحكام القانون رقم 151 لسنة 2020 بشأن حماية البيانات الشخصية، يحق لأي عميل طلب حذف حسابه نهائياً من إعدادات الملف الشخصي. يترتب على الطلب إيقاف الحساب فوراً وإخفاء إعلاناته من السوق، مع منح العميل فترة سماح قانونية مدتها 30 يوماً للتراجع واستعادة الحساب عند تسجيل الدخول. وفي حال انقضاء الـ 30 يوماً دون نشاط، يتم المسح الشامل والنهائي (Hard Purge) لكافة بيانات الهوية والمستندات من قواعد بياناتنا.'
                  : 'Pursuant to Egyptian Personal Data Protection Law No. 151 of 2020, users hold the right to delete their accounts. Deletion requests initiate a 30-day grace period during which listings are unlisted and users can cancel deletion by signing in. After 30 days without activity, all personal records are permanently erased.'}
              </p>

              <h3 className="font-bold text-sm text-brand-navy">
                {isAr ? '4. تصدير البيانات والنسخ الاحتياطي للأمان' : '4. Client Data Portability & Backup Integrity'}
              </h3>
              <p>
                {isAr
                  ? 'تلتزم مخالصة بمبدأ شفافية البيانات وحق نقلها، وتخضع سجلات العملاء لبروتوكولات نسخ احتياطي مشفرة ومحكمة تضمن سلامة الحقوق التعاقدية وإيصالات الإيداع البنكي الرسمية.'
                  : 'Mokhalasa adheres to data portability principles under encrypted protocols, ensuring contractual rights and bank deposit receipts are immutably verifiable.'}
              </p>
            </div>
          </div>
        )}

        {/* CONTACT VIEW */}
        {type === 'contact' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-brand-green uppercase tracking-wider block">
                {isAr ? 'فريق وساطة وتسوية مخالصة' : 'Mokhalasa Advisory & Support Team'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">
                {isAr ? 'تواصل معنا — نحن هنا لمساعدتك' : 'Contact Us — We Are Here to Assist You'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                {isAr
                  ? 'سواء كنت بائعاً ترغب في معرفة إجراءات التسوية البنكية وفك حظر البيع، أو مشترياً ترغب في معاينة سيارة معتمدة، فريقنا المتخصص جاهز للرد على استفسارك فوراً.'
                  : 'Whether you are a seller seeking bank settlement clearance or a buyer looking for vetted cars, our banking advisors are ready to help.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Contact Channels */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-brand-navy pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>{isAr ? 'قنوات التواصل المباشرة' : 'Direct Contact Channels'}</span>
                  <span className="text-3xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {isAr ? 'الرد الفوري متاح' : 'Fast Response'}
                  </span>
                </h3>

                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3.5 text-xs">
                  {/* WhatsApp Direct Action Button */}
                  <a
                    href="https://wa.me/201008836962?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D9%81%D8%B1%D9%8A%D9%82%20%D9%85%D8%AE%D9%84%D8%B5%D8%A9%D8%8C%20%D9%84%D8%AF%D9%8A%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%AD%D9%88%D9%84%20%D8%AE%D8%AF%D9%85%D8%A7%D8%AA%20%D8%A7%D9%84%D9%85%D9%86%D8%B5%D8%A9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white transition shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="font-black text-xs sm:text-sm">
                          {isAr ? 'محادثة واتساب فورية' : 'Live WhatsApp Chat'}
                        </div>
                        <div dir="ltr" className="font-mono text-3xs text-emerald-100 font-bold">
                          +20 10 0883 6962
                        </div>
                      </div>
                    </div>
                    <span className="text-3xs font-extrabold px-2.5 py-1 rounded-xl bg-white text-emerald-800 group-hover:scale-105 transition">
                      {isAr ? 'ابدأ المحادثة' : 'Chat Now'}
                    </span>
                  </a>

                  {/* Phone Call Hotline */}
                  <a
                    href="tel:01008836962"
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 hover:border-brand-green transition"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-navy text-white flex items-center justify-center flex-shrink-0">
                      <PhoneCall className="w-4 h-4 text-brand-green" />
                    </div>
                    <div>
                      <div className="font-bold text-brand-navy">{isAr ? 'الخط الساخن المباشر:' : 'Direct Hotline:'}</div>
                      <div dir="ltr" className="font-mono text-slate-700 font-extrabold text-xs">01008836962</div>
                    </div>
                  </a>

                  {/* Official Email */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-brand-navy" />
                    </div>
                    <div>
                      <div className="font-bold text-brand-navy">{isAr ? 'البريد الإلكتروني للعمليات:' : 'Official Email:'}</div>
                      <div className="text-slate-600 font-mono text-xs">support@mokhalasa.com</div>
                    </div>
                  </div>

                  {/* Headquarters */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-bold text-brand-navy">{isAr ? 'المقر الرئيسي:' : 'Headquarters:'}</div>
                      <div className="text-slate-600 text-xs">
                        {isAr ? 'التجمع الخامس، شارع التسعين الشمالي، القاهرة، مصر' : 'North 90th St, New Cairo, Egypt'}
                      </div>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-brand-navy" />
                    </div>
                    <div>
                      <div className="font-bold text-brand-navy">{isAr ? 'مواعيد العمل:' : 'Working Hours:'}</div>
                      <div className="text-slate-600 text-xs">
                        {isAr ? 'السبت إلى الخميس: 9:00 ص – 9:00 م (تنسيق مواعيد الفحص والبنوك)' : 'Saturday to Thursday: 9:00 AM – 9:00 PM'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-2xs text-emerald-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {isAr
                      ? 'جميع الاستفسارات تخضع للسرية التامة وفقاً لقانون حماية البيانات الشخصية رقم 151 لسنة 2020. لا نشارك بياناتك مع أي طرف ثالث دون موافقتك.'
                      : 'All inquiries are strictly confidential in accordance with Data Protection Law 151/2020.'}
                  </span>
                </div>
              </div>

              {/* Quick Inquiry Form */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-brand-navy pb-2 border-b border-slate-100">
                  {isAr ? 'إرسال استفسار مباشر إلى الفريق' : 'Send Direct Message to Team'}
                </h3>

                {contactSubmitted ? (
                  <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-3.5 animate-fadeIn">
                    <CheckCircle2 className="w-12 h-12 text-brand-green mx-auto" />
                    <h4 className="font-black text-brand-navy text-base">
                      {isAr ? 'تم استلام استفسارك بنجاح!' : 'Your message has been sent successfully!'}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                      {isAr
                        ? 'سيقوم أحد مستشاري مخالصة بالتواصل معك هاتفياً أو عبر الواتساب في أقرب وقت لتوضيح كافة التفاصيل.'
                        : 'A customer support representative will reach out to you via phone or WhatsApp shortly.'}
                    </p>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-black text-xs shadow-sm transition"
                    >
                      {isAr ? 'إرسال استفسار آخر' : 'Send Another Message'}
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const cleanPhone = normalizeEgyptianPhone(contactPhone);
                      const phoneError = getPhoneValidationError(contactPhone);
                      if (phoneError) {
                        alert(phoneError);
                        return;
                      }

                      setContactSubmitted(true);
                      try {
                        await supabase.from('admin_notifications').insert({
                          type: 'general',
                          title: `📩 رسالة جديدة من صفحة تواصل معنا: ${contactName}`,
                          message: `الاسم: ${contactName} | الهاتف: ${cleanPhone || contactPhone} | الرسالة: ${contactMsg}`
                        });
                      } catch {}
                      if (cleanPhone) {
                        sendConsultationReceivedWhatsApp(
                          cleanPhone,
                          contactName,
                          'تواصل واستفسار مباشر',
                          contactMsg
                        ).catch(() => {});
                      }
                    }}
                    className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3.5 text-xs shadow-sm"
                  >
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        {isAr ? 'الاسم بالكامل:' : 'Full Name:'} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder={isAr ? "أدخل اسمك الكريم" : "Enter your full name"}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-brand-green focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 flex items-center justify-between mb-1">
                        <span>{isAr ? 'رقم الهاتف (واتساب):' : 'Phone Number (WhatsApp):'} <span className="text-rose-500">*</span></span>
                        <span className="text-3xs text-slate-400 font-mono">11 رقماً</span>
                      </label>
                      <input
                        type="tel"
                        required
                        dir="ltr"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-right focus:ring-2 focus:ring-brand-green focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        {isAr ? 'استفسارك أو تفاصيل حالتك:' : 'Your Inquiry or Case Details:'} <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={contactMsg}
                        onChange={(e) => setContactMsg(e.target.value)}
                        placeholder={isAr ? "اكتب استفسارك هنا حول البنك الدائن، فك الحظر، عمولة السداد المعجل، أو السيارات المتاحة..." : "Write your questions regarding creditor bank, payoff quotes, direct installment or cash cars..."}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-brand-green focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isAr ? 'إرسال الاستفسار الآن' : 'Submit Inquiry Now'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StaticPages;
