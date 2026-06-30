const ru = {
  jobs: 'Работы', chat: 'Чат', myJobs: 'Мои работы', escrow: 'Эскроу', profile: 'Профиль',
  availability: 'Доступность', availableForWork: 'Доступен для работы', notAvailable: 'Недоступен',
  customOffers: 'Прямые предложения', lightMode: 'Тёмная тема', language: 'Язык',
  portfolio: 'Портфолио', myApplications: 'Мои отклики', admin: 'Админ панель',
  adminSub: 'Управление пользователями, работами',
  install: 'Install Work Pro?', installSub: 'Add to home screen for quick access',
  faq: 'FAQ', terms: 'Terms of Service', privacy: 'Privacy Policy',
  clearCache: 'Очистить кэш', logout: 'Выйти',
  searchJobs: 'Поиск работ...', all: 'Все', newest: 'Новые',
  budgetHigh: 'Бюджет ↑', budgetLow: 'Бюджет ↓',
  posted: 'Размещено', hired: 'Нанято', applied: 'Отклики', completed: 'Завершено',
  connects: 'Коннекты', buy: 'Купить', balance: 'Баланс', reviews: 'Отзывы',
  budget: 'Бюджет', platformFee: 'Комиссия платформы', responseCost: 'Стоимость отклика',
  total: 'Итого', postJob: 'Создать работу',
  stats: 'Статистика', users: 'Пользователи', earnings: 'Доход',
  save: 'Сохранить', current: 'Текущее',
  noJobsFound: 'Работы не найдены', tryDifferentFilters: 'Попробуйте другие фильтры',
  applicants: 'откликов', urgent: 'Срочно',
  loadMore: 'Загрузить ещё',
  available: 'Доступен', notAvailableShort: 'Недоступен',
  risingTalent: 'Восходящий талант',
  kyc: 'KYC',
  goodMorning: 'Доброе утро', goodAfternoon: 'Добрый день', goodEvening: 'Добрый вечер',
  findWork: 'Найдите работу', darkMode: 'Тёмная тема',
  view: 'Смотреть', open: 'Открыто', applyNow: 'Откликнуться',
};

const en: typeof ru = {
  jobs: 'Jobs', chat: 'Chat', myJobs: 'My Jobs', escrow: 'Escrow', profile: 'Profile',
  availability: 'Availability', availableForWork: 'Available for work', notAvailable: 'Not available',
  customOffers: 'Custom Offers', lightMode: 'Dark Mode', language: 'Language',
  portfolio: 'Portfolio', myApplications: 'My Applications', admin: 'Admin Panel',
  adminSub: 'Manage users, jobs, escrows',
  install: 'Install Work Pro?', installSub: 'Add to home screen for quick access',
  faq: 'FAQ', terms: 'Terms of Service', privacy: 'Privacy Policy',
  clearCache: 'Clear Cache', logout: 'Logout',
  searchJobs: 'Search jobs...', all: 'All', newest: 'Newest',
  budgetHigh: 'Budget ↑', budgetLow: 'Budget ↓',
  posted: 'Posted', hired: 'Hired', applied: 'Applied', completed: 'Completed',
  connects: 'Connects', buy: 'Buy', balance: 'Balance', reviews: 'Reviews',
  budget: 'Budget', platformFee: 'Platform fee', responseCost: 'Response cost',
  total: 'Total', postJob: 'Post a Job',
  stats: 'Stats', users: 'Users', earnings: 'Earnings',
  save: 'Save', current: 'Current',
  noJobsFound: 'No jobs found', tryDifferentFilters: 'Try different filters',
  applicants: 'applicants', urgent: 'Urgent',
  loadMore: 'Load more',
  available: 'Available', notAvailableShort: 'Not available',
  risingTalent: 'Rising Talent',
  kyc: 'KYC',
  goodMorning: 'Good morning', goodAfternoon: 'Good afternoon', goodEvening: 'Good evening',
  findWork: 'Find work', darkMode: 'Dark Mode',
  view: 'View', open: 'Open', applyNow: 'Apply Now',
};

type Lang = 'ru' | 'en';
type T = typeof ru;

const STORAGE_KEY = 'workpro_lang';

function getLang(): Lang {
  return (localStorage.getItem(STORAGE_KEY) as Lang) || 'ru';
}

export function setLang(l: Lang) {
  localStorage.setItem(STORAGE_KEY, l);
  window.location.reload();
}

export function t(): T {
  return getLang() === 'ru' ? ru : en;
}

export function currentLang(): Lang {
  return getLang();
}
