import React, { useState } from 'react';
import { 
  ShieldCheck, CheckCircle2, 
  HelpCircle, PhoneCall, Mail, MapPin, Clock, MessageSquare, Send
} from 'lucide-react';

interface StaticPagesProps {
  type: 'how-it-works' | 'faq' | 'terms' | 'privacy' | 'contact';
  onNavigate: (view: string) => void;
  lang?: 'ar' | 'en';
}

export const StaticPages: React.FC<StaticPagesProps> = ({ type, onNavigate, lang: _lang = 'ar' }) => {
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMsg, setContactMsg] = useState('');

  return (
    <div className="min-h-screen bg-brand-bg py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-brand-border shadow-card space-y-8 animate-fadeIn">
        
        {/* HOW IT WORKS VIEW */}
        {type === 'how-it-works' && (
          <div className="space-y-6">
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-brand-green uppercase tracking-wider block">دليل المعاملات الآمنة</span>
              <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">كيف تتم المعاملة خطوة بخطوة عبر «مخلصة»؟</h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                الطريقة القانونية الرسمية الوحيدة في مصر للتخارج من أقساط السيارات وحظر البيع البنكي دون التعرض للنصب أو المساءلة.
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  step: '01',
                  title: 'الفحص الفني المعتمد (150 نقطة فحص)',
                  desc: 'تخضع السيارة لفحص دقيق للشاسيه والمحرك والدهان وسجل الصيانات بمركز فحص معتمد لضمان خلوها التام من الحوادث الهيكلية وتحديد القيمة السوقية العادلة.'
                },
                {
                  step: '02',
                  title: 'استخراج بيان المديونية البنكية الرسمي (Payoff Quote)',
                  desc: 'يتوجه البائع للبنك الدائن أو شركة التمويل الاستهلاكي لاستخراج خطاب استعلام رسمي مختوم يحدد أصل الدين المتبقي وعمولة السداد المعجل ورسوم فك الحظر بدقة.'
                },
                {
                  step: '03',
                  title: 'مطابقة المشتري وتوقيع الاتفاق الثلاثي المشروط',
                  desc: 'يتم توقيع عقد اتفاق ثلاثي منظم بين البائع والمشتري والمنصة، يحدد سعر البيع المتفق عليه، والمبلغ الواجب إيداعه بالبنك، وضمان حيازة المشتري للسيارة ومستنداتها فور السداد.'
                },
                {
                  step: '04',
                  title: 'سداد مديونية البنك مباشرة في حساب القرض بالفرع',
                  desc: 'يتوجه المشتري بصحبة البائع ومندوب مخلصة لفرع البنك لإيداع مبلغ التسوية مباشرة في حساب القرض، واستلام إيصال الصراف الرسمي (Teller Slip) المثبت لبراءة الذمة.'
                },
                {
                  step: '05',
                  title: 'إصدار خطاب فك الحظر والتوجه لإدارة المرور',
                  desc: 'يصدر البنك خطاب رفع حظر البيع الموجه للمرور وشهادة المخالصة النهائية. يتوجه الطرفان لوحدة المرور لإلغاء إشارة الحظر من على السيستم الإلكتروني للمرور.'
                },
                {
                  step: '06',
                  title: 'توثيق عقد البيع النهائي بالشهر العقاري وسداد باقي الثمن',
                  desc: 'يتم تحرير عقد بيع نهائي مسجل وموثق بالشهر العقاري باسم المشتري مباشرة، ويستلم البائع صافي المبلغ المتبقي كاش في يده، وتسدد أتعاب المنصة (1.5%).'
                }
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-12 h-12 rounded-2xl bg-brand-navy text-white font-black text-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    {s.step}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm sm:text-base text-brand-navy">{s.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 text-center">
              <button
                onClick={() => onNavigate('marketplace')}
                className="py-3.5 px-8 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white font-bold text-xs shadow-md transition"
              >
                تصفح السيارات المتاحة للبيع الآن
              </button>
            </div>
          </div>
        )}

        {/* FAQ VIEW */}
        {type === 'faq' && (
          <div className="space-y-6">
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-brand-green uppercase tracking-wider block">إجابات الخبراء</span>
              <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">الأسئلة الشائعة والأمان القانوني</h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                كل ما تحتاج لمعرفته حول التعامل القانوني مع السيارات المقسطة والمحظورة بيعاً في مصر.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {[
                {
                  q: 'هل يمكن عمل توكيل بيع أو عقد مسجل لسيارة عليها حظر بيع بالشهر العقاري؟',
                  a: 'لا نهائياً. يمنع القانون المصري وتعليمات مصلحة الشهر العقاري المقترنة بقاعدة بيانات المرور إلكترونياً تسجيل أي عقد بيع أو إصدار أي توكيل بيع (للنفس أو للغير) طالما وجد قيد حظر بيع سارٍ لصالح بنك أو جهة تمويلية.'
                },
                {
                  q: 'لماذا ترفض منصة «مخلصة» بيع السيارات بـ "توكيل إدارة شامل"؟',
                  a: 'لأن توكيل الإدارة لا ينقل الملكية قانوناً، وينتهي فوراً بحكم المادة 714 من القانون المدني بوفاة الموكل أو الوكيل. كما أنه يعرض المشتري لخطر مصادرة السيارة إذا تعثر البائع في سداد أقساط أخرى، ويعرض البائع للمساءلة الجنائية إذا ارتكب المشتري أي مخالفات أو جرائم بالسيارة.'
                },
                {
                  q: 'كيف يضمن المشتري أمواله بعد سداد مديونية البائع بالبنك؟',
                  a: 'يتم السداد بموجب "عقد اتفاق التخارج المشروط الثلاثي" الذي يثبت فيه رقم إيصال الإيداع بحساب القرض، ويستلم المشتري حيازة السيارة ورخصتها ومفتاحها فور السداد داخل الفرع، ويلتزم البائع جنائياً ومدنياً بالتوجه الفوري للمرور والشهر العقاري لنقل الملكية بمجرد خروج خطاب فك الحظر.'
                },
                {
                  q: 'هل تستلم منصة «مخلصة» أموال السداد أو الأقساط بحساباتها؟',
                  a: 'قطعاً لا. تنفيذاً لأحكام قانون البنك المركزي رقم 194 لسنة 2020 بشأن حظر توظيف الأموال، المنصة لا تلمس مليمًا واحداً من أموال التسوية البنكية. يقوم المشتري بنفسه بإيداع المبلغ في حساب قرض البائع داخل خزينة فرع البنك الدائن، وتتقاضى المنصة فقط أتعاب تنظيم الصفقة (1.5%) عند توثيق البيع.'
                },
                {
                  q: 'كم تبلغ عمولة السداد المعجل في البنوك المصرية؟',
                  a: 'تختلف حسب البنك: في بنك كريدي أجريكول تبلغ 15% على أصل الدين، وفي البنك التجاري الدولي (CIB) 7%، وفي البنك الأهلي المصري 3% إلى 3.5%، وفي QNB مصر 7%، وكونتكت للتمويل الاستهلاكي 4%، وتوضح حاسبة مخلصة الرسوم بدقة لكل بنك.'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-extrabold text-sm text-brand-navy flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-brand-green flex-shrink-0" />
                    <span>{item.q}</span>
                  </h3>
                  <p className="text-slate-600 leading-relaxed pr-6">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TERMS VIEW */}
        {type === 'terms' && (
          <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <h1 className="text-2xl font-black text-brand-navy">الشروط والأحكام والمسؤولية القانونية</h1>
              <p className="text-slate-500">مسودة الشروط الاسترشادية المعدة للمراجعة القانونية المعتمدة</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm text-brand-navy">1. طبيعة عمل المنصة وإخلاء المسؤولية المصرفية</h3>
              <p>
                منصة «مخلصة» (Mokhalasa) هي منصة وساطة تكنولوجية وتسويقية تعمل وفقاً لأحكام قانون التجارة المصري وقانون المعاملات الإلكترونية. المنصة ليست بنكاً ولا تقدم خدمات الائتمان أو القروض أو التمويل العقاري أو الاستهلاكي، ولا تتلقى ودائع أو مدفوعات نقدية نيابة عن العملاء.
              </p>

              <h3 className="font-bold text-sm text-brand-navy">2. التزام الأطراف بصحة البيانات</h3>
              <p>
                يتحمل البائع المسؤولية المدنية والجنائية الكاملة عن صحة المستندات المقدمة وخلو المركبة من أي نزاعات قضائية أو قرارات تحفظ جنائي بخلاف حظر البيع البنكي المصرح عنه. يلتزم المشتري بتدقيق الفحص الفني المعتمد للمركبة قبل توقيع الاتفاق الثلاثي.
              </p>

              <h3 className="font-bold text-sm text-brand-navy">3. أتعاب المنصة وسياسة الإلغاء</h3>
              <p>
                تستحق أتعاب المنصة وقدرها (1.5%) من إجمالي القيمة البيعية المتفق عليها فور توثيق عقد البيع النهائي المسجل بالشهر العقاري. في حال تراجع أحد الطرفين بعد إتمام الإيداع البنكي دون سبب مشروع، تطبق الشروط الجزائية المنصوص عليها بالاتفاق الثلاثي.
              </p>
            </div>
          </div>
        )}

        {/* PRIVACY VIEW */}
        {type === 'privacy' && (
          <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <h1 className="text-2xl font-black text-brand-navy">سياسة الخصوصية وحماية البيانات الشخصية</h1>
              <p className="text-slate-500">امتثالاً لأحكام القانون رقم 151 لسنة 2020 في جمهورية مصر العربية</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm text-brand-navy">1. حماية المستندات والبيانات الحساسة</h3>
              <p>
                تلتزم منصة مخلصة بعدم نشر أو مشاركة صور بطاقات الرقم القومي أو رخص السيارات أو كشوف الحسابات المصرفية مع أي طرف ثالث غير مصرح له. يتم حجب وتعتيم الأرقام الحساسة (Data Masking) في كافة العروض الترويجية العامة.
              </p>

              <h3 className="font-bold text-sm text-brand-navy">2. التخزين الآمن والتشفير</h3>
              <p>
                تخزن المستندات في مساحات سحابية مشفرة بمعايير (AES-256)، ويقتصر حق الاطلاع عليها على موظفي العمليات والامتثال القانوني لأغراض التحقق من صحة الصفقة فقط.
              </p>

              <h3 className="font-bold text-sm text-brand-navy">3. سياسة الإتلاف والحذف</h3>
              <p>
                يحق لأي مستخدم طلب حذف بياناته الشخصية من المنصة فور انتهاء المعاملة، ويتم إتلاف صور المستندات الشخصية تلقائياً بعد مرور 90 يوماً من إتمام التوثيق الرسمي بالشهر العقاري.
              </p>
            </div>
          </div>
        )}

        {/* CONTACT VIEW */}
        {type === 'contact' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-brand-green uppercase tracking-wider block">فريق وساطة وتسوية مخلصة</span>
              <h1 className="text-2xl sm:text-3xl font-black text-brand-navy">تواصل معنا — نحن هنا لمساعدتك</h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                سواء كنت بائعاً ترغب في معرفة إجراءات التسوية البنكية، أو مشترياً ترغب في معاينة سيارة معتمدة، فريقنا المتخصص جاهز للرد على كافة استفساراتك.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Channels */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-brand-navy pb-2 border-b border-slate-100">
                  قنوات التواصل المباشرة
                </h3>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-navy text-white flex items-center justify-center flex-shrink-0">
                      <PhoneCall className="w-4 h-4 text-brand-green" />
                    </div>
                    <div>
                      <div className="font-bold text-brand-navy">الخط الساخن ومكتب الدعم:</div>
                      <div dir="ltr" className="font-mono text-slate-600 font-bold">19000 (أو 01012345678)</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-brand-navy">خدمة العملاء والواتساب:</div>
                      <div dir="ltr" className="font-mono text-slate-600">+20 10 1234 5678</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-brand-navy" />
                    </div>
                    <div>
                      <div className="font-bold text-brand-navy">البريد الإلكتروني للعمليات:</div>
                      <div className="text-slate-600 font-mono">support@mokhalasa.com</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-bold text-brand-navy">المقر الرئيسي:</div>
                      <div className="text-slate-600">التجمع الخامس، شارع التسعين الشمالي، القاهرة، مصر</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-brand-navy" />
                    </div>
                    <div>
                      <div className="font-bold text-brand-navy">مواعيد العمل:</div>
                      <div className="text-slate-600">السبت إلى الخميس: 9:00 ص – 9:00 م (مكتب التوثيق البنكي)</div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-2xs text-emerald-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
                  <span>
                    جميع الاستفسارات تخضع للسرية التامة وفقاً لقانون حماية البيانات الشخصية رقم 151 لسنة 2020.
                  </span>
                </div>
              </div>

              {/* Quick Inquiry Form */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-brand-navy pb-2 border-b border-slate-100">
                  إرسال استفسار مباشر
                </h3>

                {contactSubmitted ? (
                  <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-brand-green mx-auto" />
                    <h4 className="font-black text-brand-navy text-sm">تم استلام رسالتك بنجاح!</h4>
                    <p className="text-xs text-slate-600">
                      سيقوم مسؤول خدمة العملاء بالتواصل معك هاتفياً أو عبر الواتساب في أقرب وقت.
                    </p>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="px-4 py-2 rounded-xl bg-brand-green text-white font-bold text-xs"
                    >
                      إرسال رسالة أخرى
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setContactSubmitted(true);
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">الاسم بالكامل:</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="أدخل اسمك الكريم"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-brand-green focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">رقم الهاتف (واتساب):</label>
                      <input
                        type="tel"
                        required
                        dir="ltr"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-right focus:ring-2 focus:ring-brand-green focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">استفسارك أو تفاصيل حالتك:</label>
                      <textarea
                        rows={4}
                        required
                        value={contactMsg}
                        onChange={(e) => setContactMsg(e.target.value)}
                        placeholder="اكتب استفسارك هنا حول البنك الدائن، فك الحظر، عمولة السداد المعجل، أو السيارات المتاحة..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-brand-green focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-brand-green hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      <span>إرسال الاستفسار الآن</span>
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
