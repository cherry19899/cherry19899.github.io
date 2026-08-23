import { currentLang, type LangCode } from './i18n';

// Backend's authoritative category keys (routes/jobs.js VALID_CATEGORIES) plus
// the synthetic 'all' filter key used only by the frontend.
export type CategoryKey = 'all' | 'development' | 'design' | 'writing' | 'marketing' | 'data' | 'support' | 'translation' | 'va' | 'other';

const en: Record<CategoryKey, string> = {
  all: 'All', development: 'Development', design: 'Design', writing: 'Writing',
  marketing: 'Marketing', data: 'Data', support: 'Support', translation: 'Translation',
  va: 'Virtual Assistant', other: 'Other',
};

const CATEGORY_TRANSLATIONS: Record<LangCode, Partial<Record<CategoryKey, string>>> = {
  en,
  ru: { all: 'Все', development: 'Разработка', design: 'Дизайн', writing: 'Копирайтинг', marketing: 'Маркетинг', data: 'Данные', support: 'Поддержка', translation: 'Перевод', va: 'Ассистент', other: 'Другое' },
  uk: { all: 'Усі', development: 'Розробка', design: 'Дизайн', writing: 'Копірайтинг', marketing: 'Маркетинг', data: 'Дані', support: 'Підтримка', translation: 'Переклад', va: 'Асистент', other: 'Інше' },
  de: { all: 'Alle', development: 'Entwicklung', design: 'Design', writing: 'Texten', marketing: 'Marketing', data: 'Daten', support: 'Support', translation: 'Übersetzung', va: 'Assistenz', other: 'Sonstiges' },
  fr: { all: 'Tous', development: 'Développement', design: 'Design', writing: 'Rédaction', marketing: 'Marketing', data: 'Données', support: 'Support', translation: 'Traduction', va: 'Assistant virtuel', other: 'Autre' },
  es: { all: 'Todas', development: 'Desarrollo', design: 'Diseño', writing: 'Redacción', marketing: 'Marketing', data: 'Datos', support: 'Soporte', translation: 'Traducción', va: 'Asistente virtual', other: 'Otro' },
  pt: { all: 'Todas', development: 'Desenvolvimento', design: 'Design', writing: 'Redação', marketing: 'Marketing', data: 'Dados', support: 'Suporte', translation: 'Tradução', va: 'Assistente virtual', other: 'Outro' },
  tr: { all: 'Tümü', development: 'Yazılım', design: 'Tasarım', writing: 'Metin Yazarlığı', marketing: 'Pazarlama', data: 'Veri', support: 'Destek', translation: 'Çeviri', va: 'Sanal Asistan', other: 'Diğer' },
  ar: { all: 'الكل', development: 'تطوير', design: 'تصميم', writing: 'كتابة', marketing: 'تسويق', data: 'بيانات', support: 'دعم', translation: 'ترجمة', va: 'مساعد افتراضي', other: 'أخرى' },
  hi: { all: 'सभी', development: 'विकास', design: 'डिज़ाइन', writing: 'लेखन', marketing: 'मार्केटिंग', data: 'डेटा', support: 'सहायता', translation: 'अनुवाद', va: 'वर्चुअल सहायक', other: 'अन्य' },
  zh: { all: '全部', development: '开发', design: '设计', writing: '写作', marketing: '营销', data: '数据', support: '客服', translation: '翻译', va: '虚拟助理', other: '其他' },
  ja: { all: 'すべて', development: '開発', design: 'デザイン', writing: 'ライティング', marketing: 'マーケティング', data: 'データ', support: 'サポート', translation: '翻訳', va: 'バーチャルアシスタント', other: 'その他' },
  ko: { all: '전체', development: '개발', design: '디자인', writing: '글쓰기', marketing: '마케팅', data: '데이터', support: '지원', translation: '번역', va: '가상 비서', other: '기타' },
  vi: { all: 'Tất cả', development: 'Phát triển', design: 'Thiết kế', writing: 'Viết nội dung', marketing: 'Marketing', data: 'Dữ liệu', support: 'Hỗ trợ', translation: 'Dịch thuật', va: 'Trợ lý ảo', other: 'Khác' },
  id: { all: 'Semua', development: 'Pengembangan', design: 'Desain', writing: 'Penulisan', marketing: 'Pemasaran', data: 'Data', support: 'Dukungan', translation: 'Terjemahan', va: 'Asisten Virtual', other: 'Lainnya' },
  it: { all: 'Tutte', development: 'Sviluppo', design: 'Design', writing: 'Scrittura', marketing: 'Marketing', data: 'Dati', support: 'Supporto', translation: 'Traduzione', va: 'Assistente virtuale', other: 'Altro' },
  pl: { all: 'Wszystkie', development: 'Programowanie', design: 'Projektowanie', writing: 'Pisanie', marketing: 'Marketing', data: 'Dane', support: 'Wsparcie', translation: 'Tłumaczenie', va: 'Wirtualny asystent', other: 'Inne' },
  th: { all: 'ทั้งหมด', development: 'พัฒนา', design: 'ออกแบบ', writing: 'เขียนบทความ', marketing: 'การตลาด', data: 'ข้อมูล', support: 'สนับสนุน', translation: 'แปลภาษา', va: 'ผู้ช่วยเสมือน', other: 'อื่นๆ' },
  tl: { all: 'Lahat', development: 'Development', design: 'Disenyo', writing: 'Pagsulat', marketing: 'Marketing', data: 'Datos', support: 'Suporta', translation: 'Pagsasalin', va: 'Virtual Assistant', other: 'Iba pa' },
  nl: { all: 'Alle', development: 'Ontwikkeling', design: 'Ontwerp', writing: 'Tekstschrijven', marketing: 'Marketing', data: 'Data', support: 'Ondersteuning', translation: 'Vertaling', va: 'Virtuele assistent', other: 'Overig' },
  sv: { all: 'Alla', development: 'Utveckling', design: 'Design', writing: 'Copywriting', marketing: 'Marknadsföring', data: 'Data', support: 'Support', translation: 'Översättning', va: 'Virtuell assistent', other: 'Övrigt' },
  ro: { all: 'Toate', development: 'Dezvoltare', design: 'Design', writing: 'Redactare', marketing: 'Marketing', data: 'Date', support: 'Asistență', translation: 'Traducere', va: 'Asistent virtual', other: 'Altele' },
  bn: { all: 'সব', development: 'ডেভেলপমেন্ট', design: 'ডিজাইন', writing: 'লেখালেখি', marketing: 'মার্কেটিং', data: 'ডেটা', support: 'সহায়তা', translation: 'অনুবাদ', va: 'ভার্চুয়াল অ্যাসিস্ট্যান্ট', other: 'অন্যান্য' },
};

export function categoryLabel(key: CategoryKey): string {
  const lang = currentLang();
  return CATEGORY_TRANSLATIONS[lang]?.[key] ?? en[key];
}
