import { Car } from '../types';

interface PageSeoMetadata {
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  keywordsAr: string;
  keywordsEn: string;
  path: string;
}

const SEO_ROUTES: Record<string, PageSeoMetadata> = {
  home: {
    titleAr: 'مخلصة | منصة تسوية سيارات حظر البيع والمديونيات والتقسيط المباشر في مصر',
    titleEn: 'Mokhalasa | Car Loan Settlement, Sale Bans & Direct Installments in Egypt',
    descAr: 'منصة مخلصة: المنصة الأولى في مصر لحلول وفك حظر سيارات المديونيات البنكية، والتقسيط المباشر بدون بنوك، وشراء وبيع السيارات المستعملة بعقود موثقة ومخالصات رسمية.',
    descEn: 'Mokhalasa: Egypt’s leading platform for car loan debt settlements, bank sale ban releases, and direct installment car sales with official verified contracts.',
    keywordsAr: 'مخلصة, منصة مخلصة, سيارات حظر بيع, تسوية مديونية سيارة, بيع سيارات متعثرين, تقسيط مباشر بدون بنك, فك حظر بيع بنك, سيارات مستعملة تقسيط مباشر مصر',
    keywordsEn: 'Mokhalasa, car debt settlement Egypt, bank sale ban cars, direct car installments, used cars Egypt',
    path: '',
  },
  marketplace: {
    titleAr: 'سوق وتصفح سيارات حظر البيع والتقسيط المباشر في مصر | مخلصة',
    titleEn: 'Marketplace | Bank Sale Ban & Direct Installment Cars in Egypt | Mokhalasa',
    descAr: 'تصفح أحدث سيارات حظر البيع والتقسيط المباشر في مصر بأسعار أقل من السوق مع ضمان فحص الحالة الفنية والاستعلام القانوني والبنكي المعتمد.',
    descEn: 'Browse inspected sale ban and direct installment cars in Egypt below market value with guaranteed technical and legal checks.',
    keywordsAr: 'سوق سيارات حظر بيع, سيارات تقسيط مباشر, سيارات مستعملة للبيع كاش وتقسيط, مخلصة ماركت بليس, عروض سيارات متعثرين مصر',
    keywordsEn: 'used cars marketplace Egypt, bank distressed cars, direct installment cars Cairo Alexandria',
    path: 'marketplace',
  },
  'sell-wizard': {
    titleAr: 'بيع سيارتك وتسوية المديونية البنكية وفك حظر البيع | مخلصة',
    titleEn: 'Sell Your Car & Settle Bank Debt | Mokhalasa',
    descAr: 'سجل سيارتك الآن لبيعها وسداد مديونية البنك واستخراج المخالصة الرسمية أو بيعها بالتقسيط المباشر بعقود موثقة في الشهر العقاري وبدون أي مسؤولية جنائية.',
    descEn: 'List your car to settle your loan, obtain official bank clearance, and safely sell with notarized installment contracts.',
    keywordsAr: 'بيع سيارة عليها حظر بيع, تسوية قرض سيارة, سداد مديونية بنك, مخالصة سيارة بنكية, فك حظر المرور, بيع عربية مقسطة',
    keywordsEn: 'sell mortgaged car Egypt, bank clearance car, release car sale ban Egypt',
    path: 'sell',
  },
  calculator: {
    titleAr: 'حاسبة أقساط السيارات وتسوية المديونيات البنكية | مخلصة',
    titleEn: 'Car Installment & Bank Settlement Calculator | Mokhalasa',
    descAr: 'احسب القسط الشهري، مديونية البنك، قيمة الخصم للسداد المعجل، والأرباح المتوقعة للتقسيط المباشر والتسوية المصرفية في مصر بدقة وبشكل فوري.',
    descEn: 'Calculate monthly installments, bank loan settlements, early payoff discounts, and direct installment plans instantly in Egypt.',
    keywordsAr: 'حاسبة قسط السيارة, حساب سداد معجل قرض سيارة, حاسبة فوائد البنوك سيارات, تسوية مديونية حاسبة, تقسيط سيارات مصر',
    keywordsEn: 'Egypt car loan calculator, car installment calculator, early repayment calculation',
    path: 'calculator',
  },
  'how-it-works': {
    titleAr: 'كيف تعمل منصة مخلصة؟ خطوات فك الحظر والتقسيط الآمن | مخلصة',
    titleEn: 'How It Works | Car Clearance & Installment Process | Mokhalasa',
    descAr: 'تعرف على آلية عمل منصة مخلصة خطوة بخطوة: الفحص الفني، سداد مديونية البنك، استخراج المخالصة الرسمية، فك الحظر من المرور، ونقل الملكية الآمن.',
    descEn: 'Learn step-by-step how Mokhalasa handles technical inspection, bank debt settlement, clearance certificates, and official title transfer.',
    keywordsAr: 'خطوات فك حظر البيع, كيف اشتري سيارة حظر بيع, اجراءات بيع سيارة مقسطة, مخالصة بنكية سيارات مصر',
    keywordsEn: 'how to buy car with bank ban Egypt, car debt clearance steps',
    path: 'how-it-works',
  },
  faq: {
    titleAr: 'الأسئلة الشائعة حول سيارات حظر البيع والتقسيط المباشر | مخلصة',
    titleEn: 'FAQ | Vehicle Debt Settlement & Installments | Mokhalasa',
    descAr: 'كل الإجابات عن فك حظر بيع السيارات، الضمانات القانونية، عقود الشهر العقاري، استرداد الأموال، ومخاطر العقود العرفية وكيف تحميك منصة مخلصة.',
    descEn: 'Frequently asked questions regarding vehicle sale bans, legal notarization, escrow protection, and direct installment financing.',
    keywordsAr: 'اسئلة حظر بيع السيارات, هل بيع سيارة حظر بيع جناية, شروط التقسيط المباشر, اسئلة مخلصة الشائعة',
    keywordsEn: 'Egypt car sale ban FAQ, legal car buying installment guide',
    path: 'faq',
  },
  blog: {
    titleAr: 'دليل ومقالات سوق السيارات وتسوية المديونيات في مصر | مدونة مخلصة',
    titleEn: 'Automotive Insights & Settlement Guides | Mokhalasa Blog',
    descAr: 'مقالات ونصائح قانونية وفنية من خبراء السيارات في مصر حول تسوية قروض البنوك، فحص السيارات المستعملة، وتجنب النصب في عقود التقسيط.',
    descEn: 'Expert guides and legal tips on handling bank car loans, second-hand car inspection, and direct installments in Egypt.',
    keywordsAr: 'دليل شراء سيارة مستعملة مصر, مقالات حظر البيع, نصائح شراء سيارة بالتقسيط, مدونة مخلصة',
    keywordsEn: 'used cars Egypt guide, car buying tips Cairo, automotive blog Egypt',
    path: 'blog',
  },
  contact: {
    titleAr: 'اتصل بنا | الدعم الفني واستشارات تسوية السيارات | مخلصة',
    titleEn: 'Contact Us | Car Settlement Inquiries & Support | Mokhalasa',
    descAr: 'تواصل مع فريق منصة مخلصة للاستفسارات القانونية، تسوية مديونيات السيارات، وخدمة العملاء عبر الواتساب والموقع المباشر.',
    descEn: 'Get in touch with the Mokhalasa support team for legal consultations, vehicle debt settlements, and customer service.',
    keywordsAr: 'تواصل مع مخلصة, رقم خدمة عملاء مخلصة, استشارة تسوية سيارات',
    keywordsEn: 'Mokhalasa contact, car consultation Egypt',
    path: 'contact',
  },
  terms: {
    titleAr: 'الشروط والأحكام وسياسة الاستخدام القانونية | مخلصة',
    titleEn: 'Terms and Conditions | Mokhalasa Platform',
    descAr: 'الشروط والأحكام المنظمة للوساطة في تسوية سيارات حظر البيع والتقسيط المباشر وضمان حقوق البائع والمشتري وفق القانون المصري.',
    descEn: 'Terms of service regulating vehicle debt settlement and direct installment intermediation under Egyptian law.',
    keywordsAr: 'شروط منصة مخلصة, عقد وساطة سيارات, حقوق المشتري والبائع',
    keywordsEn: 'Mokhalasa terms, user agreement Egypt',
    path: 'terms',
  },
  privacy: {
    titleAr: 'سياسة الخصوصية وحماية البيانات الشخصية | مخلصة',
    titleEn: 'Privacy Policy & Data Protection | Mokhalasa',
    descAr: 'التزام منصة مخلصة بحماية بيانات العملاء والمستندات الرسمية وأرقام الهوية وسرية المعاملات المالية والمصرفية.',
    descEn: 'Mokhalasa privacy policy and data protection commitments for client records, official vehicle documents, and transactions.',
    keywordsAr: 'سياسة الخصوصية مخلصة, حماية بيانات عملاء السيارات',
    keywordsEn: 'Mokhalasa privacy policy, data security',
    path: 'privacy',
  },
};

function updateMetaTag(name: string, content: string, isProperty = false) {
  if (typeof document === 'undefined') return;
  const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    if (isProperty) {
      element.setAttribute('property', name);
    } else {
      element.setAttribute('name', name);
    }
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function updateCanonicalUrl(url: string) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', url);
}

/**
 * Updates page title, meta description, meta keywords, canonical URL, and OpenGraph/Twitter tags
 * dynamically based on current route or active car listing.
 */
export function applyPageSeo(view: string, car?: Car | null, lang: 'ar' | 'en' = 'ar'): void {
  if (typeof document === 'undefined') return;

  const isAr = lang === 'ar';
  const baseUrl = 'https://mokalasa.online';

  let title = '';
  let description = '';
  let keywords = '';
  let canonicalUrl = `${baseUrl}/`;

  if (view === 'car-detail' && car) {
    const makeModelYear = `${car.make} ${car.model} ${car.year}`;
    const transmissionText = car.transmission || (isAr ? 'أوتوماتيك' : 'Automatic');
    const locationText = (isAr ? car.city : (car.cityEn || car.city)) || (isAr ? 'مصر' : 'Egypt');

    title = isAr 
      ? `سيارة ${makeModelYear} للبيع والتسوية في ${locationText} | مخلصة`
      : `${makeModelYear} for Sale & Settlement in ${locationText} | Mokhalasa`;

    description = isAr
      ? `سيارة ${makeModelYear} (${transmissionText}) في ${locationText}. فحص فني معتمد، حلول تسوية حظر البيع البنكي والتقسيط المباشر بدون بنك في مصر مع منصة مخلصة.`
      : `${makeModelYear} (${transmissionText}) in ${locationText}. Inspected with loan settlement options and direct installment via Mokhalasa.`;

    keywords = isAr
      ? `${car.make}, ${car.model}, سيارات مستعملة ${car.year}, تسوية مديونية ${car.make}, شراء ${car.model} تقسيط مصر`
      : `${car.make} ${car.model}, used cars Egypt, ${car.make} installments`;

    canonicalUrl = `${baseUrl}/marketplace?car=${encodeURIComponent(car.id)}`;
  } else {
    const meta = SEO_ROUTES[view] || SEO_ROUTES.home;
    title = isAr ? meta.titleAr : meta.titleEn;
    description = isAr ? meta.descAr : meta.descEn;
    keywords = isAr ? meta.keywordsAr : meta.keywordsEn;
    canonicalUrl = meta.path ? `${baseUrl}/${meta.path}` : `${baseUrl}/`;
  }

  // Update DOM Title
  document.title = title;

  // Update Standard Meta Tags
  updateMetaTag('title', title);
  updateMetaTag('description', description);
  updateMetaTag('keywords', keywords);

  // Update Canonical Link
  updateCanonicalUrl(canonicalUrl);

  // Update OpenGraph
  updateMetaTag('og:title', title, true);
  updateMetaTag('og:description', description, true);
  updateMetaTag('og:url', canonicalUrl, true);

  // Update Twitter
  updateMetaTag('twitter:title', title);
  updateMetaTag('twitter:description', description);
  updateMetaTag('twitter:url', canonicalUrl);
}
