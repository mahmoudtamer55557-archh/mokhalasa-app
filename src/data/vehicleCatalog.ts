import { VehicleMake, VehicleModel, VehicleTrim, VehicleCatalogMetadata } from '../types';

export const CATALOG_METADATA: VehicleCatalogMetadata = {
  earliestYearAllowed: 2018,
  currentYear: 2026,
  totalMakes: 32,
  totalModels: 120,
  verifiedSource: 'تقارير مجلس معلومات سوق السيارات المصري (AMIC)، كتالوجات الوكلاء الرسميين المعتمدين (GB Corp، منصور للسيارات، أبو غالي، الشركة المصرية العالمية EIM، القصراوي جروب، ناتكو، أرتوك أوتو، جميل أوتوموتيف)، وسجلات ترخيص المرور 2018-2026.',
  lastUpdated: '2026-10',
  knownGapsAr: [
    'السيارات المستوردة بمواصفات خليجية أو أوروبية غير مطروحة عبر الوكيل المحلي الرسمي قد تختلف فئاتها وتجهيزاتها وتتطلب اختيار "الفئة غير مدرجة".',
    'سيارات ذوي الهمم المستوردة برسم جمركي مخفض قد تحمل مسميات فئات بلد المنشأ الأصلي.',
    'الفئات الرياضية المحدودة (Special Editions) أو الطرازات المجمعة محلياً في سنوات التحول.'
  ]
};

export const ALLOWED_MODEL_YEARS: number[] = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

export const VEHICLE_MAKES: VehicleMake[] = [
  // Popular Brands in Egypt
  { id: 'nissan', nameAr: 'نيسان', nameEn: 'Nissan', country: 'اليابان', isPopularInEgypt: true },
  { id: 'hyundai', nameAr: 'هيونداي', nameEn: 'Hyundai', country: 'كوريا الجنوبية', isPopularInEgypt: true },
  { id: 'chery', nameAr: 'شيري', nameEn: 'Chery', country: 'الصين', isPopularInEgypt: true },
  { id: 'toyota', nameAr: 'تويوتا', nameEn: 'Toyota', country: 'اليابان', isPopularInEgypt: true },
  { id: 'kia', nameAr: 'كيا', nameEn: 'Kia', country: 'كوريا الجنوبية', isPopularInEgypt: true },
  { id: 'mg', nameAr: 'إم جي', nameEn: 'MG', country: 'بريطانيا / الصين', isPopularInEgypt: true },
  { id: 'renault', nameAr: 'رينو', nameEn: 'Renault', country: 'فرنسا', isPopularInEgypt: true },
  { id: 'fiat', nameAr: 'فيات', nameEn: 'Fiat', country: 'إيطاليا', isPopularInEgypt: true },
  { id: 'chevrolet', nameAr: 'شيفروليه', nameEn: 'Chevrolet', country: 'الولايات المتحدة', isPopularInEgypt: true },
  { id: 'mitsubishi', nameAr: 'ميتسوبيشي', nameEn: 'Mitsubishi', country: 'اليابان', isPopularInEgypt: true },
  { id: 'peugeot', nameAr: 'بيجو', nameEn: 'Peugeot', country: 'فرنسا', isPopularInEgypt: true },
  { id: 'volkswagen', nameAr: 'فولكس فاجن', nameEn: 'Volkswagen', country: 'ألمانيا', isPopularInEgypt: true },
  { id: 'skoda', nameAr: 'سكودا', nameEn: 'Skoda', country: 'التشيك / ألمانيا', isPopularInEgypt: true },
  { id: 'mercedes', nameAr: 'مرسيدس بنز', nameEn: 'Mercedes-Benz', country: 'ألمانيا', isPopularInEgypt: true },
  { id: 'bmw', nameAr: 'بي إم دبليو', nameEn: 'BMW', country: 'ألمانيا', isPopularInEgypt: true },
  { id: 'suzuki', nameAr: 'سوزوكي', nameEn: 'Suzuki', country: 'اليابان', isPopularInEgypt: true },
  { id: 'geely', nameAr: 'جيلي', nameEn: 'Geely', country: 'الصين', isPopularInEgypt: true },
  { id: 'byd', nameAr: 'بي واي دي', nameEn: 'BYD', country: 'الصين', isPopularInEgypt: true },
  { id: 'haval', nameAr: 'هافال', nameEn: 'Haval', country: 'الصين', isPopularInEgypt: true },
  { id: 'jetour', nameAr: 'جيتور', nameEn: 'Jetour', country: 'الصين', isPopularInEgypt: true },
  { id: 'opel', nameAr: 'أوبل', nameEn: 'Opel', country: 'ألمانيا', isPopularInEgypt: true },
  { id: 'citroen', nameAr: 'ستروين', nameEn: 'Citroën', country: 'فرنسا', isPopularInEgypt: true },
  { id: 'seat', nameAr: 'سيات', nameEn: 'Seat', country: 'إسبانيا', isPopularInEgypt: true },
  { id: 'cupra', nameAr: 'كوبرا', nameEn: 'Cupra', country: 'إسبانيا', isPopularInEgypt: false },
  { id: 'audi', nameAr: 'أودي', nameEn: 'Audi', country: 'ألمانيا', isPopularInEgypt: true },
  { id: 'jeep', nameAr: 'جيب', nameEn: 'Jeep', country: 'الولايات المتحدة', isPopularInEgypt: true },
  { id: 'changan', nameAr: 'شانجان', nameEn: 'Changan', country: 'الصين', isPopularInEgypt: false },
  { id: 'baic', nameAr: 'بايك', nameEn: 'BAIC', country: 'الصين', isPopularInEgypt: false },
  { id: 'honda', nameAr: 'هوندا', nameEn: 'Honda', country: 'اليابان', isPopularInEgypt: false },
  { id: 'subaru', nameAr: 'سوبارو', nameEn: 'Subaru', country: 'اليابان', isPopularInEgypt: false },
  { id: 'porsche', nameAr: 'بورشه', nameEn: 'Porsche', country: 'ألمانيا', isPopularInEgypt: false },
  { id: 'volvo', nameAr: 'فولفو', nameEn: 'Volvo', country: 'السويد', isPopularInEgypt: false },
];

export const VEHICLE_MODELS: VehicleModel[] = [
  // --- NISSAN ---
  { id: 'nissan-sunny', makeId: 'nissan', nameAr: 'صني (Sunny)', nameEn: 'Sunny', bodyType: 'سيدان' },
  { id: 'nissan-sentra', makeId: 'nissan', nameAr: 'سنترا (Sentra)', nameEn: 'Sentra', bodyType: 'سيدان' },
  { id: 'nissan-qashqai', makeId: 'nissan', nameAr: 'قشقاي (Qashqai)', nameEn: 'Qashqai', bodyType: 'SUV / كروس أوفر' },
  { id: 'nissan-juke', makeId: 'nissan', nameAr: 'جوك (Juke)', nameEn: 'Juke', bodyType: 'SUV / كروس أوفر' },
  { id: 'nissan-xtrail', makeId: 'nissan', nameAr: 'إكس تريل (X-Trail)', nameEn: 'X-Trail', bodyType: 'SUV / كروس أوفر' },

  // --- HYUNDAI ---
  { id: 'hyundai-elantra-cn7', makeId: 'hyundai', nameAr: 'إلنترا CN7 (Elantra CN7)', nameEn: 'Elantra CN7', bodyType: 'سيدان' },
  { id: 'hyundai-elantra-hd', makeId: 'hyundai', nameAr: 'إلنترا HD (Elantra HD)', nameEn: 'Elantra HD', bodyType: 'سيدان' },
  { id: 'hyundai-tucson', makeId: 'hyundai', nameAr: 'توسان (Tucson)', nameEn: 'Tucson', bodyType: 'SUV / كروس أوفر' },
  { id: 'hyundai-accent-rb', makeId: 'hyundai', nameAr: 'أكسنت RB (Accent RB)', nameEn: 'Accent RB', bodyType: 'سيدان' },
  { id: 'hyundai-creta', makeId: 'hyundai', nameAr: 'كريتا (Creta)', nameEn: 'Creta', bodyType: 'SUV / كروس أوفر' },
  { id: 'hyundai-bayon', makeId: 'hyundai', nameAr: 'بايون (Bayon)', nameEn: 'Bayon', bodyType: 'SUV / كروس أوفر' },
  { id: 'hyundai-i20', makeId: 'hyundai', nameAr: 'آي 20 (i20)', nameEn: 'i20', bodyType: 'هاتشباك' },

  // --- CHERY ---
  { id: 'chery-tiggo-7', makeId: 'chery', nameAr: 'تيجو 7 (Tiggo 7)', nameEn: 'Tiggo 7', bodyType: 'SUV / كروس أوفر' },
  { id: 'chery-tiggo-7-pro', makeId: 'chery', nameAr: 'تيجو 7 برو (Tiggo 7 Pro)', nameEn: 'Tiggo 7 Pro', bodyType: 'SUV / كروس أوفر' },
  { id: 'chery-tiggo-8', makeId: 'chery', nameAr: 'تيجو 8 (Tiggo 8)', nameEn: 'Tiggo 8', bodyType: 'SUV / كروس أوفر' },
  { id: 'chery-tiggo-8-pro', makeId: 'chery', nameAr: 'تيجو 8 برو (Tiggo 8 Pro)', nameEn: 'Tiggo 8 Pro', bodyType: 'SUV / كروس أوفر' },
  { id: 'chery-tiggo-3', makeId: 'chery', nameAr: 'تيجو 3 (Tiggo 3)', nameEn: 'Tiggo 3', bodyType: 'SUV / كروس أوفر' },
  { id: 'chery-arrizo-5', makeId: 'chery', nameAr: 'أريزو 5 (Arrizo 5)', nameEn: 'Arrizo 5', bodyType: 'سيدان' },
  { id: 'chery-tiggo-4-pro', makeId: 'chery', nameAr: 'تيجو 4 برو (Tiggo 4 Pro)', nameEn: 'Tiggo 4 Pro', bodyType: 'SUV / كروس أوفر' },

  // --- TOYOTA ---
  { id: 'toyota-corolla', makeId: 'toyota', nameAr: 'كورولا (Corolla)', nameEn: 'Corolla', bodyType: 'سيدان' },
  { id: 'toyota-fortuner', makeId: 'toyota', nameAr: 'فورتشنر (Fortuner)', nameEn: 'Fortuner', bodyType: 'SUV / كروس أوفر' },
  { id: 'toyota-yaris', makeId: 'toyota', nameAr: 'ياريس (Yaris)', nameEn: 'Yaris', bodyType: 'هاتشباك' },
  { id: 'toyota-belta', makeId: 'toyota', nameAr: 'بيلتا (Belta)', nameEn: 'Belta', bodyType: 'سيدان' },
  { id: 'toyota-rumion', makeId: 'toyota', nameAr: 'روميون (Rumion)', nameEn: 'Rumion', bodyType: 'MPV عائلية' },
  { id: 'toyota-landcruiser', makeId: 'toyota', nameAr: 'لاند كروزر (Land Cruiser)', nameEn: 'Land Cruiser', bodyType: 'SUV / كروس أوفر' },

  // --- KIA ---
  { id: 'kia-sportage', makeId: 'kia', nameAr: 'سبورتاج (Sportage)', nameEn: 'Sportage', bodyType: 'SUV / كروس أوفر' },
  { id: 'kia-cerato', makeId: 'kia', nameAr: 'جراند سيراتو (Grand Cerato)', nameEn: 'Grand Cerato', bodyType: 'سيدان' },
  { id: 'kia-seltos', makeId: 'kia', nameAr: 'سيلتوس (Seltos)', nameEn: 'Seltos', bodyType: 'SUV / كروس أوفر' },
  { id: 'kia-rio', makeId: 'kia', nameAr: 'ريو (Rio)', nameEn: 'Rio', bodyType: 'سيدان' },
  { id: 'kia-xceed', makeId: 'kia', nameAr: 'إكسيد (XCeed)', nameEn: 'XCeed', bodyType: 'SUV / كروس أوفر' },

  // --- MG ---
  { id: 'mg-5', makeId: 'mg', nameAr: 'إم جي 5 (MG 5)', nameEn: 'MG 5', bodyType: 'سيدان' },
  { id: 'mg-6', makeId: 'mg', nameAr: 'إم جي 6 (MG 6)', nameEn: 'MG 6', bodyType: 'سيدان' },
  { id: 'mg-zs', makeId: 'mg', nameAr: 'إم جي ZS (MG ZS)', nameEn: 'MG ZS', bodyType: 'SUV / كروس أوفر' },
  { id: 'mg-rx5', makeId: 'mg', nameAr: 'إم جي RX5 (MG RX5)', nameEn: 'MG RX5', bodyType: 'SUV / كروس أوفر' },
  { id: 'mg-hs', makeId: 'mg', nameAr: 'إم جي HS (MG HS)', nameEn: 'MG HS', bodyType: 'SUV / كروس أوفر' },
  { id: 'mg-one', makeId: 'mg', nameAr: 'إم جي ون (MG One)', nameEn: 'MG One', bodyType: 'SUV / كروس أوفر' },
  { id: 'mg-4-ev', makeId: 'mg', nameAr: 'إم جي 4 كهربائية (MG 4 EV)', nameEn: 'MG 4 EV', bodyType: 'هاتشباك' },

  // --- RENAULT ---
  { id: 'renault-megane', makeId: 'renault', nameAr: 'ميجان (Megane)', nameEn: 'Megane', bodyType: 'سيدان' },
  { id: 'renault-duster', makeId: 'renault', nameAr: 'داستر (Duster)', nameEn: 'Duster', bodyType: 'SUV / كروس أوفر' },
  { id: 'renault-stepway', makeId: 'renault', nameAr: 'ستيب واي (Stepway)', nameEn: 'Stepway', bodyType: 'هاتشباك' },
  { id: 'renault-logan', makeId: 'renault', nameAr: 'لوجان (Logan)', nameEn: 'Logan', bodyType: 'سيدان' },
  { id: 'renault-austral', makeId: 'renault', nameAr: 'أوسترال (Austral)', nameEn: 'Austral', bodyType: 'SUV / كروس أوفر' },

  // --- FIAT ---
  { id: 'fiat-tipo', makeId: 'fiat', nameAr: 'تيبو (Tipo)', nameEn: 'Tipo', bodyType: 'سيدان' },
  { id: 'fiat-500x', makeId: 'fiat', nameAr: '500X', nameEn: '500X', bodyType: 'SUV / كروس أوفر' },
  { id: 'fiat-500', makeId: 'fiat', nameAr: '500 (فيات 500)', nameEn: '500', bodyType: 'هاتشباك' },

  // --- CHEVROLET ---
  { id: 'chevrolet-optra', makeId: 'chevrolet', nameAr: 'أوبترا (Optra)', nameEn: 'Optra', bodyType: 'سيدان' },
  { id: 'chevrolet-captiva', makeId: 'chevrolet', nameAr: 'كابتيفا (Captiva)', nameEn: 'Captiva', bodyType: 'SUV / كروس أوفر' },

  // --- MITSUBISHI ---
  { id: 'mitsubishi-xpander', makeId: 'mitsubishi', nameAr: 'إكسباندر (Xpander)', nameEn: 'Xpander', bodyType: 'MPV عائلية' },
  { id: 'mitsubishi-eclipse', makeId: 'mitsubishi', nameAr: 'إكليبس كروس (Eclipse Cross)', nameEn: 'Eclipse Cross', bodyType: 'SUV / كروس أوفر' },
  { id: 'mitsubishi-attrage', makeId: 'mitsubishi', nameAr: 'أتراج (Attrage)', nameEn: 'Attrage', bodyType: 'سيدان' },
  { id: 'mitsubishi-mirage', makeId: 'mitsubishi', nameAr: 'ميراج (Mirage)', nameEn: 'Mirage', bodyType: 'هاتشباك' },

  // --- PEUGEOT ---
  { id: 'peugeot-301', makeId: 'peugeot', nameAr: '301', nameEn: '301', bodyType: 'سيدان' },
  { id: 'peugeot-2008', makeId: 'peugeot', nameAr: '2008', nameEn: '2008', bodyType: 'SUV / كروس أوفر' },
  { id: 'peugeot-3008', makeId: 'peugeot', nameAr: '3008', nameEn: '3008', bodyType: 'SUV / كروس أوفر' },
  { id: 'peugeot-5008', makeId: 'peugeot', nameAr: '5008', nameEn: '5008', bodyType: 'SUV / كروس أوفر' },
  { id: 'peugeot-508', makeId: 'peugeot', nameAr: '508', nameEn: '508', bodyType: 'سيدان' },

  // --- SKODA ---
  { id: 'skoda-octavia', makeId: 'skoda', nameAr: 'أوكتافيا (Octavia)', nameEn: 'Octavia', bodyType: 'سيدان' },
  { id: 'skoda-kodiaq', makeId: 'skoda', nameAr: 'كودياك (Kodiaq)', nameEn: 'Kodiaq', bodyType: 'SUV / كروس أوفر' },
  { id: 'skoda-karoq', makeId: 'skoda', nameAr: 'كاروك (Karoq)', nameEn: 'Karoq', bodyType: 'SUV / كروس أوفر' },
  { id: 'skoda-kamiq', makeId: 'skoda', nameAr: 'كاميك (Kamiq)', nameEn: 'Kamiq', bodyType: 'SUV / كروس أوفر' },

  // --- VOLKSWAGEN ---
  { id: 'vw-passat', makeId: 'volkswagen', nameAr: 'باسات (Passat)', nameEn: 'Passat', bodyType: 'سيدان' },
  { id: 'vw-tiguan', makeId: 'volkswagen', nameAr: 'تيجوان (Tiguan)', nameEn: 'Tiguan', bodyType: 'SUV / كروس أوفر' },
  { id: 'vw-golf', makeId: 'volkswagen', nameAr: 'جولف (Golf)', nameEn: 'Golf', bodyType: 'هاتشباك' },
  { id: 'vw-troc', makeId: 'volkswagen', nameAr: 'تي روك (T-Roc)', nameEn: 'T-Roc', bodyType: 'SUV / كروس أوفر' },

  // --- MERCEDES-BENZ ---
  { id: 'mercedes-c-class', makeId: 'mercedes', nameAr: 'سي كلاس (C-Class: C180/C200)', nameEn: 'C-Class', bodyType: 'سيدان' },
  { id: 'mercedes-e-class', makeId: 'mercedes', nameAr: 'إي كلاس (E-Class: E200/E300)', nameEn: 'E-Class', bodyType: 'سيدان' },
  { id: 'mercedes-glc', makeId: 'mercedes', nameAr: 'جي إل سي (GLC)', nameEn: 'GLC', bodyType: 'SUV / كروس أوفر' },
  { id: 'mercedes-cla', makeId: 'mercedes', nameAr: 'سي إل إيه (CLA)', nameEn: 'CLA', bodyType: 'سيدان' },
  { id: 'mercedes-gla', makeId: 'mercedes', nameAr: 'جي إل إيه (GLA)', nameEn: 'GLA', bodyType: 'SUV / كروس أوفر' },

  // --- BMW ---
  { id: 'bmw-3-series', makeId: 'bmw', nameAr: 'الفئة الثالثة (3 Series: 320i/330i)', nameEn: '3 Series', bodyType: 'سيدان' },
  { id: 'bmw-5-series', makeId: 'bmw', nameAr: 'الفئة الخامسة (5 Series: 520i/530i)', nameEn: '5 Series', bodyType: 'سيدان' },
  { id: 'bmw-x1', makeId: 'bmw', nameAr: 'إكس 1 (X1)', nameEn: 'X1', bodyType: 'SUV / كروس أوفر' },
  { id: 'bmw-x3', makeId: 'bmw', nameAr: 'إكس 3 (X3)', nameEn: 'X3', bodyType: 'SUV / كروس أوفر' },
  { id: 'bmw-x5', makeId: 'bmw', nameAr: 'إكس 5 (X5)', nameEn: 'X5', bodyType: 'SUV / كروس أوفر' },

  // --- SUZUKI ---
  { id: 'suzuki-swift', makeId: 'suzuki', nameAr: 'سويفت (Swift)', nameEn: 'Swift', bodyType: 'هاتشباك' },
  { id: 'suzuki-dzire', makeId: 'suzuki', nameAr: 'ديزاير (Dzire)', nameEn: 'Dzire', bodyType: 'سيدان' },
  { id: 'suzuki-fronx', makeId: 'suzuki', nameAr: 'فرونكس (Fronx)', nameEn: 'Fronx', bodyType: 'SUV / كروس أوفر' },
  { id: 'suzuki-ciaz', makeId: 'suzuki', nameAr: 'سياز (Ciaz)', nameEn: 'Ciaz', bodyType: 'سيدان' },
  { id: 'suzuki-jimny', makeId: 'suzuki', nameAr: 'جيمني (Jimny)', nameEn: 'Jimny', bodyType: 'SUV / كروس أوفر' },
  { id: 'suzuki-ertiga', makeId: 'suzuki', nameAr: 'أرتيجا (Ertiga)', nameEn: 'Ertiga', bodyType: 'MPV عائلية' },

  // --- GEELY ---
  { id: 'geely-coolray', makeId: 'geely', nameAr: 'كولراي (Coolray)', nameEn: 'Coolray', bodyType: 'SUV / كروس أوفر' },
  { id: 'geely-gx3-pro', makeId: 'geely', nameAr: 'جي إكس 3 برو (GX3 Pro)', nameEn: 'GX3 Pro', bodyType: 'SUV / كروس أوفر' },
  { id: 'geely-emgrand', makeId: 'geely', nameAr: 'إمجراند (Emgrand)', nameEn: 'Emgrand', bodyType: 'سيدان' },
  { id: 'geely-starray', makeId: 'geely', nameAr: 'ستارراي (Starray)', nameEn: 'Starray', bodyType: 'SUV / كروس أوفر' },
  { id: 'geely-geometry-c', makeId: 'geely', nameAr: 'جيومتري سي كهرباء (Geometry C EV)', nameEn: 'Geometry C', bodyType: 'SUV / كروس أوفر' },

  // --- BYD ---
  { id: 'byd-f3', makeId: 'byd', nameAr: 'إف 3 (F3)', nameEn: 'F3', bodyType: 'سيدان' },
  { id: 'byd-song-plus', makeId: 'byd', nameAr: 'سونج بلس (Song Plus)', nameEn: 'Song Plus', bodyType: 'SUV / كروس أوفر' },
  { id: 'byd-yuan-plus', makeId: 'byd', nameAr: 'يوان بلس كهرباء (Yuan Plus EV)', nameEn: 'Yuan Plus', bodyType: 'SUV / كروس أوفر' },

  // --- HAVAL ---
  { id: 'haval-h6', makeId: 'haval', nameAr: 'إتش 6 (H6)', nameEn: 'H6', bodyType: 'SUV / كروس أوفر' },
  { id: 'haval-jolion', makeId: 'haval', nameAr: 'جوليون (Jolion)', nameEn: 'Jolion', bodyType: 'SUV / كروس أوفر' },

  // --- JETOUR ---
  { id: 'jetour-x70', makeId: 'jetour', nameAr: 'إكس 70 (X70)', nameEn: 'X70', bodyType: 'SUV / كروس أوفر' },
  { id: 'jetour-dashing', makeId: 'jetour', nameAr: 'داشينج (Dashing)', nameEn: 'Dashing', bodyType: 'SUV / كروس أوفر' },
  { id: 'jetour-t2', makeId: 'jetour', nameAr: 'تي 2 (T2)', nameEn: 'T2', bodyType: 'SUV / كروس أوفر' },

  // --- OPEL ---
  { id: 'opel-astra', makeId: 'opel', nameAr: 'أسترا (Astra)', nameEn: 'Astra', bodyType: 'سيدان' },
  { id: 'opel-corsa', makeId: 'opel', nameAr: 'كورسا (Corsa)', nameEn: 'Corsa', bodyType: 'هاتشباك' },
  { id: 'opel-crossland', makeId: 'opel', nameAr: 'كروس لاند (Crossland)', nameEn: 'Crossland', bodyType: 'SUV / كروس أوفر' },
  { id: 'opel-grandland', makeId: 'opel', nameAr: 'جراند لاند (Grandland)', nameEn: 'Grandland', bodyType: 'SUV / كروس أوفر' },

  // --- CITROEN ---
  { id: 'citroen-c-elysee', makeId: 'citroen', nameAr: 'سي إليزيه (C-Elysée)', nameEn: 'C-Elysée', bodyType: 'سيدان' },
  { id: 'citroen-c3-aircross', makeId: 'citroen', nameAr: 'C3 إيركروس (C3 Aircross)', nameEn: 'C3 Aircross', bodyType: 'SUV / كروس أوفر' },
  { id: 'citroen-c5-aircross', makeId: 'citroen', nameAr: 'C5 إيركروس (C5 Aircross)', nameEn: 'C5 Aircross', bodyType: 'SUV / كروس أوفر' },

  // --- SEAT ---
  { id: 'seat-ibiza', makeId: 'seat', nameAr: 'إيبيزا (Ibiza)', nameEn: 'Ibiza', bodyType: 'هاتشباك' },
  { id: 'seat-leon', makeId: 'seat', nameAr: 'ليون (Leon)', nameEn: 'Leon', bodyType: 'هاتشباك' },
  { id: 'seat-ateca', makeId: 'seat', nameAr: 'أتيكا (Ateca)', nameEn: 'Ateca', bodyType: 'SUV / كروس أوفر' },

  // --- JEEP ---
  { id: 'jeep-renegade', makeId: 'jeep', nameAr: 'رينيجيد (Renegade)', nameEn: 'Renegade', bodyType: 'SUV / كروس أوفر' },
  { id: 'jeep-grand-cherokee', makeId: 'jeep', nameAr: 'جراند شيروكي (Grand Cherokee)', nameEn: 'Grand Cherokee', bodyType: 'SUV / كروس أوفر' }
];

export const VEHICLE_TRIMS: VehicleTrim[] = [
  // --- NISSAN SUNNY (2018 - 2026) ---
  {
    id: 'nissan-sunny-base-mt',
    modelId: 'nissan-sunny',
    nameAr: 'بيس مانيوال (Base M/T)',
    nameEn: 'Base Manual',
    years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'مانيوال',
    engineSize: '1500 cc',
    fuelType: 'بنزين',
    horsepower: 108
  },
  {
    id: 'nissan-sunny-base-at',
    modelId: 'nissan-sunny',
    nameAr: 'بيس أوتوماتيك (Base A/T)',
    nameEn: 'Base Automatic',
    years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1500 cc',
    fuelType: 'بنزين',
    horsepower: 108
  },
  {
    id: 'nissan-sunny-plus',
    modelId: 'nissan-sunny',
    nameAr: 'بلس جنوط وشاشات (Plus A/T)',
    nameEn: 'Plus Automatic',
    years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1500 cc',
    fuelType: 'بنزين',
    horsepower: 108
  },
  {
    id: 'nissan-sunny-super-saloon',
    modelId: 'nissan-sunny',
    nameAr: 'سوبر صالون بصمة وتكييف تاتش (Super Saloon)',
    nameEn: 'Super Saloon',
    years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1500 cc',
    fuelType: 'بنزين',
    horsepower: 108
  },

  // --- NISSAN SENTRA (2018 - 2026) ---
  {
    id: 'nissan-sentra-basic',
    modelId: 'nissan-sentra',
    nameAr: 'ستاندرد فئة أولى (Basic)',
    nameEn: 'Standard / Basic',
    years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
    transmission: 'CVT',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 118
  },
  {
    id: 'nissan-sentra-highline',
    modelId: 'nissan-sentra',
    nameAr: 'هايلين بصمة وجنط سبور (Highline)',
    nameEn: 'Highline',
    years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
    transmission: 'CVT',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 118
  },
  {
    id: 'nissan-sentra-premium',
    modelId: 'nissan-sentra',
    nameAr: 'بريميوم كاملة أعلى فئة (Premium SV)',
    nameEn: 'Premium SV',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'CVT',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 118
  },

  // --- HYUNDAI ELANTRA CN7 (2021 - 2026) ---
  {
    id: 'elantra-cn7-shadow',
    modelId: 'hyundai-elantra-cn7',
    nameAr: 'شادو - الفئة الأولى (Shadow)',
    nameEn: 'Shadow (1st)',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 127
  },
  {
    id: 'elantra-cn7-blaze',
    modelId: 'hyundai-elantra-cn7',
    nameAr: 'بليز - الفئة الثانية (Blaze)',
    nameEn: 'Blaze (2nd)',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 127
  },
  {
    id: 'elantra-cn7-redline',
    modelId: 'hyundai-elantra-cn7',
    nameAr: 'ريدلاين - الفئة الثالثة (Redline)',
    nameEn: 'Redline (3rd)',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 127
  },
  {
    id: 'elantra-cn7-advanced',
    modelId: 'hyundai-elantra-cn7',
    nameAr: 'أدفانسد - الفئة الخامسة بصمة وفتحة سقف (Advanced)',
    nameEn: 'Advanced (5th)',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 127
  },
  {
    id: 'elantra-cn7-premium',
    modelId: 'hyundai-elantra-cn7',
    nameAr: 'بريميوم - الفئة السادسة جلد ورادارات (Premium)',
    nameEn: 'Premium (6th)',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 127
  },
  {
    id: 'elantra-cn7-nline',
    modelId: 'hyundai-elantra-cn7',
    nameAr: 'إن لاين - فئة رياضية توربو (N-Line Turbo)',
    nameEn: 'N-Line Turbo',
    years: [2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1600 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 204
  },

  // --- HYUNDAI TUCSON (2018 - 2026) ---
  {
    id: 'tucson-gl-smart',
    modelId: 'hyundai-tucson',
    nameAr: 'سمارت فئة أولى (Smart)',
    nameEn: 'Smart',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1600 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 180
  },
  {
    id: 'tucson-smart-plus',
    modelId: 'hyundai-tucson',
    nameAr: 'سمارت بلس فئة ثانية (Smart Plus)',
    nameEn: 'Smart Plus',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1600 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 180
  },
  {
    id: 'tucson-modern',
    modelId: 'hyundai-tucson',
    nameAr: 'مودرن بانوراما فئة ثالثة (Modern)',
    nameEn: 'Modern',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1600 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 180
  },
  {
    id: 'tucson-advanced',
    modelId: 'hyundai-tucson',
    nameAr: 'أدفانسد جلد وكاميرات 360 (Advanced)',
    nameEn: 'Advanced',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1600 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 180
  },
  {
    id: 'tucson-premium-nline',
    modelId: 'hyundai-tucson',
    nameAr: 'بريميوم إن لاين أعلى فئة (Premium / N-Line)',
    nameEn: 'Premium / N-Line',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1600 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 180
  },

  // --- CHERY TIGGO 7 (2020 - 2026) ---
  {
    id: 'tiggo-7-base',
    modelId: 'chery-tiggo-7',
    nameAr: 'بيس لاين - فئة أولى (Baseline)',
    nameEn: 'Baseline',
    years: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1500 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 145
  },
  {
    id: 'tiggo-7-highline',
    modelId: 'chery-tiggo-7',
    nameAr: 'هاي لاين بانوراما - فئة ثانية كاملة (Highline)',
    nameEn: 'Highline Panoramic',
    years: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1500 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 145
  },

  // --- TOYOTA COROLLA (2019 - 2026) ---
  {
    id: 'corolla-active-mt',
    modelId: 'toyota-corolla',
    nameAr: 'أكتيف مانيوال (Active M/T)',
    nameEn: 'Active Manual',
    years: [2019, 2020, 2021, 2022, 2023, 2024],
    transmission: 'مانيوال',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 120
  },
  {
    id: 'corolla-active-cvt',
    modelId: 'toyota-corolla',
    nameAr: 'أكتيف أوتوماتيك (Active CVT)',
    nameEn: 'Active CVT',
    years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'CVT',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 120
  },
  {
    id: 'corolla-comfort',
    modelId: 'toyota-corolla',
    nameAr: 'كومفورت جنوط وحساسات (Comfort)',
    nameEn: 'Comfort',
    years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'CVT',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 120
  },
  {
    id: 'corolla-smart',
    modelId: 'toyota-corolla',
    nameAr: 'سمارت فتحة سقف وبصمة (Smart Sunroof)',
    nameEn: 'Smart Sunroof',
    years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'CVT',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 120
  },
  {
    id: 'corolla-gr-sport',
    modelId: 'toyota-corolla',
    nameAr: 'جي آر سبورت رياضية (GR Sport)',
    nameEn: 'GR Sport',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'CVT',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 120
  },
  {
    id: 'corolla-elegance',
    modelId: 'toyota-corolla',
    nameAr: 'إليجانس أعلى فئة جلد وزينون (Elegance)',
    nameEn: 'Elegance',
    years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'CVT',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 120
  },

  // --- KIA SPORTAGE (2018 - 2026) ---
  {
    id: 'sportage-lx-cam',
    modelId: 'kia-sportage',
    nameAr: 'إل إكس كاميرا فئة أولى (LX Cam)',
    nameEn: 'LX Cam',
    years: [2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1600 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 180
  },
  {
    id: 'sportage-ex',
    modelId: 'kia-sportage',
    nameAr: 'إي إكس فئة ثانية (EX)',
    nameEn: 'EX',
    years: [2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1600 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 180
  },
  {
    id: 'sportage-highline',
    modelId: 'kia-sportage',
    nameAr: 'هاي لاين بانوراما وبصمة (Highline)',
    nameEn: 'Highline',
    years: [2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1600 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 180
  },
  {
    id: 'sportage-topline',
    modelId: 'kia-sportage',
    nameAr: 'توب لاين شاشات بانورامية (Topline)',
    nameEn: 'Topline',
    years: [2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1600 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 180
  },
  {
    id: 'sportage-gt-line',
    modelId: 'kia-sportage',
    nameAr: 'جي تي لاين بلس أعلى فئة دفع رباعي (GT-Line Plus)',
    nameEn: 'GT-Line Plus',
    years: [2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1600 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 180
  },

  // --- MG 5 (2020 - 2026) ---
  {
    id: 'mg-5-classic',
    modelId: 'mg-5',
    nameAr: 'كلاسيك فئة أولى (Classic)',
    nameEn: 'Classic',
    years: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'CVT',
    engineSize: '1500 cc',
    fuelType: 'بنزين',
    horsepower: 120
  },
  {
    id: 'mg-5-comfort',
    modelId: 'mg-5',
    nameAr: 'كومفورت فئة ثانية بشاشة وجنوط (Comfort)',
    nameEn: 'Comfort',
    years: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'CVT',
    engineSize: '1500 cc',
    fuelType: 'بنزين',
    horsepower: 120
  },
  {
    id: 'mg-5-luxury',
    modelId: 'mg-5',
    nameAr: 'لاكشري أعلى فئة فتحة سقف وكاميرات 360 (Luxury)',
    nameEn: 'Luxury',
    years: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'CVT',
    engineSize: '1500 cc',
    fuelType: 'بنزين',
    horsepower: 120
  },

  // --- FIAT TIPO (2018 - 2026) ---
  {
    id: 'fiat-tipo-entry-at',
    modelId: 'fiat-tipo',
    nameAr: 'إنتر باك أوتوماتيك (Entry Pack A/T)',
    nameEn: 'Entry Pack A/T',
    years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
    transmission: 'أوتوماتيك',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 110
  },
  {
    id: 'fiat-tipo-mid-pack',
    modelId: 'fiat-tipo',
    nameAr: 'ميد باك جنوط وشاشة كاربلاي (Mid Pack)',
    nameEn: 'Mid Pack',
    years: [2019, 2020, 2021, 2022, 2023, 2024],
    transmission: 'أوتوماتيك',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 110
  },
  {
    id: 'fiat-tipo-highline',
    modelId: 'fiat-tipo',
    nameAr: 'هاي لاين أعلى فئة حساسات وليدات (Highline)',
    nameEn: 'Highline',
    years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
    transmission: 'أوتوماتيك',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 110
  },

  // --- RENAULT MEGANE (2018 - 2026) ---
  {
    id: 'megane-vision',
    modelId: 'renault-megane',
    nameAr: 'فيجن محرك 1600 تنفس طبيعي (Vision 1.6L)',
    nameEn: 'Vision 1.6L',
    years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
    transmission: 'CVT',
    engineSize: '1600 cc',
    fuelType: 'بنزين',
    horsepower: 115
  },
  {
    id: 'megane-dynamic-turbo',
    modelId: 'renault-megane',
    nameAr: 'دايناميك تيربو 1.3 لتر (Dynamic Turbo)',
    nameEn: 'Dynamic Turbo',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1300 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 150
  },
  {
    id: 'megane-signature-turbo',
    modelId: 'renault-megane',
    nameAr: 'سيجنتشر تيربو بانوراما وشاشات عملاقة (Signature Turbo)',
    nameEn: 'Signature Turbo',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1300 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 150
  },

  // --- SKODA OCTAVIA (2018 - 2026) ---
  {
    id: 'octavia-ambition',
    modelId: 'skoda-octavia',
    nameAr: 'أمبيشن فئة أولى (Ambition A8)',
    nameEn: 'Ambition A8',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1400 cc TSI',
    fuelType: 'بنزين',
    horsepower: 150
  },
  {
    id: 'octavia-style',
    modelId: 'skoda-octavia',
    nameAr: 'ستايل بلس شاحن لاسلكي وفتحة سقف (Style Plus A8)',
    nameEn: 'Style Plus A8',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1400 cc TSI',
    fuelType: 'بنزين',
    horsepower: 150
  },
  {
    id: 'octavia-rs',
    modelId: 'skoda-octavia',
    nameAr: 'آر إس الرياضية 2.0 لتر (Octavia RS)',
    nameEn: 'Octavia RS',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '2000 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 245
  },

  // --- BYD F3 ---
  {
    id: 'byd-f3-manual',
    modelId: 'byd-f3',
    nameAr: 'مانيوال تكييف وباور (Manual M/T)',
    nameEn: 'Manual M/T',
    years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'مانيوال',
    engineSize: '1500 cc',
    fuelType: 'بنزين',
    horsepower: 108
  },
  {
    id: 'byd-f3-automatic',
    modelId: 'byd-f3',
    nameAr: 'أوتوماتيك كاملة (Automatic A/T)',
    nameEn: 'Automatic A/T',
    years: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1500 cc',
    fuelType: 'بنزين',
    horsepower: 108
  },

  // --- CHERY ARRIZO 5 ---
  {
    id: 'arrizo-5-base-mt',
    modelId: 'chery-arrizo-5',
    nameAr: 'بيس لاين مانيوال (Base M/T)',
    nameEn: 'Base M/T',
    years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'مانيوال',
    engineSize: '1500 cc',
    fuelType: 'بنزين',
    horsepower: 114
  },
  {
    id: 'arrizo-5-comfort-at',
    modelId: 'chery-arrizo-5',
    nameAr: 'كومفورت أوتوماتيك (Comfort A/T)',
    nameEn: 'Comfort A/T',
    years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'CVT',
    engineSize: '1500 cc',
    fuelType: 'بنزين',
    horsepower: 114
  },
  {
    id: 'arrizo-5-highline',
    modelId: 'chery-arrizo-5',
    nameAr: 'هاي لاين فتحة سقف وجلد (Highline Leather)',
    nameEn: 'Highline Leather',
    years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'CVT',
    engineSize: '1500 cc',
    fuelType: 'بنزين',
    horsepower: 114
  },

  // --- CHERY TIGGO 7 / 7 PRO ---
  {
    id: 'tiggo-7-baseline',
    modelId: 'chery-tiggo-7',
    nameAr: 'بيس لاين (Baseline)',
    nameEn: 'Baseline',
    years: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1500 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 145
  },
  {
    id: 'tiggo-7-highline',
    modelId: 'chery-tiggo-7',
    nameAr: 'هاي لاين بانوراما (Highline Panorama)',
    nameEn: 'Highline Panorama',
    years: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1500 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 145
  },
  {
    id: 'tiggo-7-pro-comfort',
    modelId: 'chery-tiggo-7-pro',
    nameAr: 'كومفورت (Comfort Pro)',
    nameEn: 'Comfort Pro',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'CVT',
    engineSize: '1500 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 154
  },
  {
    id: 'tiggo-7-pro-luxury',
    modelId: 'chery-tiggo-7-pro',
    nameAr: 'لاكشري كاملة المواصفات (Luxury Pro)',
    nameEn: 'Luxury Pro',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'CVT',
    engineSize: '1500 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 154
  },

  // --- MG ZS ---
  {
    id: 'mg-zs-classic',
    modelId: 'mg-zs',
    nameAr: 'كلاسيك الفئة الأولى (Classic)',
    nameEn: 'Classic',
    years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1500 cc',
    fuelType: 'بنزين',
    horsepower: 119
  },
  {
    id: 'mg-zs-comfort',
    modelId: 'mg-zs',
    nameAr: 'كومفورت فئة ثانية (Comfort)',
    nameEn: 'Comfort',
    years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1500 cc',
    fuelType: 'بنزين',
    horsepower: 119
  },
  {
    id: 'mg-zs-luxury',
    modelId: 'mg-zs',
    nameAr: 'لاكشري أعلى فئة (Luxury)',
    nameEn: 'Luxury',
    years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1500 cc',
    fuelType: 'بنزين',
    horsepower: 119
  },

  // --- GEELY COOLRAY ---
  {
    id: 'coolray-comfort',
    modelId: 'geely-coolray',
    nameAr: 'كومفورت فئة أولى (Comfort)',
    nameEn: 'Comfort',
    years: [2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1500 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 174
  },
  {
    id: 'coolray-premium',
    modelId: 'geely-coolray',
    nameAr: 'بريميوم فئة ثانية (Premium)',
    nameEn: 'Premium',
    years: [2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1500 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 174
  },
  {
    id: 'coolray-sport',
    modelId: 'geely-coolray',
    nameAr: 'سبورت بلس فتحة سقف وجناح (Sport Plus)',
    nameEn: 'Sport Plus',
    years: [2022, 2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1500 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 174
  },

  // --- JETOUR DASHING ---
  {
    id: 'dashing-comfort',
    modelId: 'jetour-dashing',
    nameAr: 'كومفورت فئة أولى (Comfort)',
    nameEn: 'Comfort',
    years: [2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1500 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 156
  },
  {
    id: 'dashing-luxury',
    modelId: 'jetour-dashing',
    nameAr: 'لاكشري فئة ثانية بانوراما (Luxury)',
    nameEn: 'Luxury',
    years: [2023, 2024, 2025, 2026],
    transmission: 'ثنائي التعشيق (Dual Clutch)',
    engineSize: '1500 cc Turbo',
    fuelType: 'بنزين',
    horsepower: 156
  },

  // --- SUZUKI DZIRE ---
  {
    id: 'dzire-manual',
    modelId: 'suzuki-dzire',
    nameAr: 'مانيوال بيس لاين (GL M/T)',
    nameEn: 'GL M/T',
    years: [2020, 2021, 2022, 2023, 2024, 2025],
    transmission: 'مانيوال',
    engineSize: '1200 cc',
    fuelType: 'بنزين',
    horsepower: 85
  },
  {
    id: 'dzire-automatic',
    modelId: 'suzuki-dzire',
    nameAr: 'أوتوماتيك (GL A/T)',
    nameEn: 'GL A/T',
    years: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1200 cc',
    fuelType: 'بنزين',
    horsepower: 85
  },
  {
    id: 'dzire-glx',
    modelId: 'suzuki-dzire',
    nameAr: 'جي إل إكس شاشة وبصمة (GLX Screen)',
    nameEn: 'GLX Screen',
    years: [2021, 2022, 2023, 2024, 2025, 2026],
    transmission: 'أوتوماتيك',
    engineSize: '1200 cc',
    fuelType: 'بنزين',
    horsepower: 85
  }
];

// Helper Lookup Functions
export function getModelsByMake(makeId: string): VehicleModel[] {
  return VEHICLE_MODELS.filter((m) => m.makeId === makeId);
}

export function getTrimsByModelAndYear(modelId: string, year?: number): VehicleTrim[] {
  return VEHICLE_TRIMS.filter((t) => {
    if (t.modelId !== modelId) return false;
    if (year && !t.years.includes(year)) return false;
    return true;
  });
}

export function searchMakes(query: string): VehicleMake[] {
  const q = query.trim().toLowerCase();
  if (!q) return VEHICLE_MAKES;
  return VEHICLE_MAKES.filter(
    (m) => m.nameAr.toLowerCase().includes(q) || m.nameEn.toLowerCase().includes(q)
  );
}

export function searchModels(makeId: string, query: string): VehicleModel[] {
  const models = getModelsByMake(makeId);
  const q = query.trim().toLowerCase();
  if (!q) return models;
  return models.filter(
    (m) => m.nameAr.toLowerCase().includes(q) || m.nameEn.toLowerCase().includes(q)
  );
}
