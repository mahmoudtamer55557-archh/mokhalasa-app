export interface EgyptianGovernorate {
  id: string;
  nameAr: string;
  nameEn: string;
  centerLat: number;
  centerLng: number;
  cities: string[];
}

export const EGYPT_GOVERNORATES: EgyptianGovernorate[] = [
  {
    id: 'cairo',
    nameAr: 'القاهرة',
    nameEn: 'Cairo',
    centerLat: 30.0444,
    centerLng: 31.2357,
    cities: [
      'التجمع الخامس (القاهرة الجديدة)',
      'مدينة نصر',
      'مصر الجديدة (هليوبوليس)',
      'المعادي',
      'الشروق',
      'مدينتي',
      'الرحاب',
      'التجمع الأول',
      'المقطم',
      'الزمالك',
      'شبرا',
      'عين شمس',
      'حلوان',
      'وسط البلد'
    ]
  },
  {
    id: 'giza',
    nameAr: 'الجيزة',
    nameEn: 'Giza',
    centerLat: 29.9870,
    centerLng: 31.2118,
    cities: [
      'الشيخ زايد',
      'مدينة 6 أكتوبر',
      'الدقي',
      'المهندسين',
      'حدائق الأهرام',
      'الهرم',
      'فيصل',
      'العجوزة',
      'القرية الذكية'
    ]
  },
  {
    id: 'alexandria',
    nameAr: 'الإسكندرية',
    nameEn: 'Alexandria',
    centerLat: 31.2001,
    centerLng: 29.9187,
    cities: [
      'سموحة',
      'لوران',
      'جليم',
      'سيدي جابر',
      'كفر عبده',
      'رشدي',
      'ميامي',
      'المنتزه',
      'سيدي بشر',
      'الإبراهيمية',
      'العجمي',
      'برج العرب'
    ]
  },
  {
    id: 'qalyubia',
    nameAr: 'القليوبية',
    nameEn: 'Qalyubia',
    centerLat: 30.3292,
    centerLng: 31.2168,
    cities: ['بنها', 'مدينة العبور', 'شبرا الخيمة', 'قليوب', 'طوخ', 'قها']
  },
  {
    id: 'sharqia',
    nameAr: 'الشرقية',
    nameEn: 'Sharqia',
    centerLat: 30.5877,
    centerLng: 31.5020,
    cities: ['الزقازيق', 'مدينة العاشر من رمضان', 'بلبيس', 'فاقوس', 'منيا القمح']
  },
  {
    id: 'dakahlia',
    nameAr: 'الدقهلية',
    nameEn: 'Dakahlia',
    centerLat: 31.0379,
    centerLng: 31.3815,
    cities: ['المنصورة', 'طلخا', 'ميت غمر', 'السنبلاوين', 'دكرنس']
  },
  {
    id: 'gharbia',
    nameAr: 'الغربية',
    nameEn: 'Gharbia',
    centerLat: 30.7885,
    centerLng: 31.0019,
    cities: ['طنطا', 'المحلة الكبرى', 'زفتى', 'كفر الزيات', 'سمنود']
  },
  {
    id: 'monufia',
    nameAr: 'المنوفية',
    nameEn: 'Monufia',
    centerLat: 30.5972,
    centerLng: 30.9876,
    cities: ['شبين الكوم', 'قويسنا', 'مدينة السادات', 'منوف', 'أشمون']
  },
  {
    id: 'damietta',
    nameAr: 'دمياط',
    nameEn: 'Damietta',
    centerLat: 31.4175,
    centerLng: 31.8144,
    cities: ['دمياط', 'دمياط الجديدة', 'رأس البر', 'فارسكور']
  },
  {
    id: 'port_said',
    nameAr: 'بورسعيد',
    nameEn: 'Port Said',
    centerLat: 31.2653,
    centerLng: 32.3019,
    cities: ['حي الشرق', 'حي العرب', 'حي المناخ', 'بورفؤاد', 'حي الزهور']
  },
  {
    id: 'ismailia',
    nameAr: 'الإسماعيلية',
    nameEn: 'Ismailia',
    centerLat: 30.6043,
    centerLng: 32.2723,
    cities: ['الإسماعيلية', 'فايد', 'القنطرة غرب', 'التل الكبير']
  },
  {
    id: 'suez',
    nameAr: 'السويس',
    nameEn: 'Suez',
    centerLat: 29.9668,
    centerLng: 32.5498,
    cities: ['السويس', 'الأربعين', 'حي فيصل', 'عتاقة', 'العين السخنة']
  },
  {
    id: 'red_sea',
    nameAr: 'البحر الأحمر',
    nameEn: 'Red Sea',
    centerLat: 27.2579,
    centerLng: 33.8116,
    cities: ['الغردقة', 'الجونة', 'سهل حشيش', 'سفاجا', 'مرسى علم']
  },
  {
    id: 'south_sinai',
    nameAr: 'جنوب سيناء',
    nameEn: 'South Sinai',
    centerLat: 27.9158,
    centerLng: 34.3299,
    cities: ['شرم الشيخ', 'دهب', 'رأس سدر', 'نويبع']
  },
  {
    id: 'matrouh',
    nameAr: 'مطروح',
    nameEn: 'Matrouh',
    centerLat: 31.3543,
    centerLng: 27.2373,
    cities: ['مرسى مطروح', 'العلمين الجديدة', 'مارينا الساحل الشمالي', 'الضبعة']
  },
  {
    id: 'beheira',
    nameAr: 'البحيرة',
    nameEn: 'Beheira',
    centerLat: 31.0364,
    centerLng: 30.4689,
    cities: ['دمنهور', 'كفر الدوار', 'إيتاي البارود', 'وادي النطرون']
  },
  {
    id: 'kafr_el_sheikh',
    nameAr: 'كفر الشيخ',
    nameEn: 'Kafr El Sheikh',
    centerLat: 31.1107,
    centerLng: 30.9388,
    cities: ['كفر الشيخ', 'دسوق', 'بلطيم', 'فوه']
  },
  {
    id: 'fayoum',
    nameAr: 'الفيوم',
    nameEn: 'Fayoum',
    centerLat: 29.3084,
    centerLng: 30.8428,
    cities: ['الفيوم', 'الفيوم الجديدة', 'سنورس', 'إطسا']
  },
  {
    id: 'beni_suef',
    nameAr: 'بني سويف',
    nameEn: 'Beni Suef',
    centerLat: 29.0661,
    centerLng: 31.0994,
    cities: ['بني سويف', 'بني سويف الجديدة', 'الواسطى', 'ببا']
  },
  {
    id: 'minya',
    nameAr: 'المنيا',
    nameEn: 'Minya',
    centerLat: 28.1099,
    centerLng: 30.7503,
    cities: ['المنيا', 'المنيا الجديدة', 'ملوي', 'بني مزار']
  },
  {
    id: 'assiut',
    nameAr: 'أسيوط',
    nameEn: 'Assiut',
    centerLat: 27.1801,
    centerLng: 31.1837,
    cities: ['أسيوط', 'أسيوط الجديدة', 'ديروط', 'القوصية']
  },
  {
    id: 'sohag',
    nameAr: 'سوهاج',
    nameEn: 'Sohag',
    centerLat: 26.5590,
    centerLng: 31.6957,
    cities: ['سوهاج', 'سوهاج الجديدة', 'طهطا', 'جرجا', 'أخميم']
  },
  {
    id: 'qena',
    nameAr: 'قنا',
    nameEn: 'Qena',
    centerLat: 26.1551,
    centerLng: 32.7160,
    cities: ['قنا', 'قنا الجديدة', 'نجع حمادي', 'قوص']
  },
  {
    id: 'luxor',
    nameAr: 'الأقصر',
    nameEn: 'Luxor',
    centerLat: 25.6872,
    centerLng: 32.6396,
    cities: ['الأقصر', 'إسنا', 'أرمنت', 'طيبة الجديدة']
  },
  {
    id: 'aswan',
    nameAr: 'أسوان',
    nameEn: 'Aswan',
    centerLat: 24.0889,
    centerLng: 32.8998,
    cities: ['أسوان', 'أسوان الجديدة', 'كوم أمبو', 'إدفو']
  }
];

// Offline closest governorate resolver by Euclidean distance
export function resolveClosestGovernorate(lat: number, lng: number): EgyptianGovernorate {
  let closest = EGYPT_GOVERNORATES[0];
  let minDistance = Infinity;

  for (const gov of EGYPT_GOVERNORATES) {
    const dLat = gov.centerLat - lat;
    const dLng = gov.centerLng - lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = gov;
    }
  }

  return closest;
}
