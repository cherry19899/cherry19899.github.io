import React, { useState } from 'react';
import { currentLang } from '../lib/i18n';

interface QA { q: string; a: string; }

const FAQ_RU: QA[] = [
  { q: 'Что такое коннекты и зачем они нужны?',
    a: 'Коннекты — внутренняя валюта активности. Публикация задачи стоит 1 коннект, отклик — 1 коннект за каждые 50π бюджета (минимум 1). Коннекты не возвращаются при отклонении отклика или удалении задачи. Купить их можно за Pi в профиле.' },
  { q: 'Как работает эскроу?',
    a: 'При найме фрилансера заказчик оплачивает бюджет задачи через Pi — деньги замораживаются в эскроу. Фрилансер спокойно работает: оплата гарантирована. После приёмки работы заказчик нажимает «Выплатить всё», и деньги уходят фрилансеру.' },
  { q: 'Какая комиссия платформы?',
    a: 'Платформа удерживает 2% из выплаты фрилансеру. Пример: бюджет 10π → заказчик платит 10π, фрилансер получает 9.8π.' },
  { q: 'Как получить выплату на Pi-кошелёк?',
    a: 'Выплаты приходят реальными Pi на ваш Pi Wallet автоматически при выплате эскроу. Важно: у вас должен быть создан Pi-кошелёк, и при входе в приложение нужно разрешить доступ к адресу кошелька. Если кошелька не было — создайте его в Pi Browser и перезайдите в Work Pro.' },
  { q: 'Чем «Отклики» отличаются от «Предложений»?',
    a: '«Мои отклики» — заявки, которые ВЫ отправили на чужие задачи. «Прямые предложения» — когда заказчик сам предлагает задачу ВАМ напрямую; их можно принять или отклонить в разделе «Мои работы → Предложения».' },
  { q: 'Что такое портфолио?',
    a: 'Витрина ваших работ в профиле — заказчики видят её при выборе исполнителя. Добавляйте лучшие проекты с описанием.' },
  { q: 'Что делать, если работа не устраивает?',
    a: 'Не выплачивайте эскроу. Откройте «Спор» на странице Эскроу — администратор рассмотрит и решит: выплатить фрилансеру или вернуть вам. Либо нажмите «Отмена» для возврата средств, пока работа не сдана.' },
  { q: 'Что будет, если заказчик пропал и не принимает работу?',
    a: 'Если вы сдали работу, а заказчик 14 дней не реагирует — эскроу выплачивается вам автоматически.' },
  { q: 'Почему приложение в Testnet?',
    a: 'Сейчас Work Pro работает в тестовой сети Pi (sandbox): все платежи идут в Test-π без реальной ценности. Это этап обкатки перед переходом на Mainnet.' },
  { q: 'Как удалить свою задачу?',
    a: 'Открытую задачу можно удалить со страницы задачи. Задачу в работе удалить нельзя — сначала завершите её или отмените эскроу.' },
];

const FAQ_EN: QA[] = [
  { q: 'What are connects?',
    a: 'Connects are the internal activity currency. Posting a job costs 1 connect; applying costs 1 connect per 50π of budget (min 1). Connects are non-refundable. Buy them with Pi in your profile.' },
  { q: 'How does escrow work?',
    a: 'When hiring, the client pays the job budget in Pi — the funds are locked in escrow. After accepting the work, the client taps “Release All” and the freelancer gets paid.' },
  { q: 'What is the platform fee?',
    a: '2% of the freelancer payout. Example: 10π budget → client pays 10π, freelancer receives 9.8π.' },
  { q: 'How do I receive payouts to my Pi wallet?',
    a: 'Payouts are sent as real Pi to your Pi Wallet automatically on escrow release. You must have a Pi wallet created and grant the wallet-address permission at login. If you had no wallet, create one in Pi Browser and re-login.' },
  { q: 'Applications vs direct offers?',
    a: '“My Applications” are requests YOU sent to other people’s jobs. “Direct Offers” are jobs a client offers to YOU directly — accept or decline them under My Jobs → Offers.' },
  { q: 'What is the portfolio?',
    a: 'A showcase of your work on your profile — clients see it when choosing a freelancer.' },
  { q: 'What if I’m not happy with the delivered work?',
    a: 'Don’t release the escrow. Open a Dispute on the Escrow page — an admin will resolve it. Or press Cancel to refund while work is not submitted.' },
  { q: 'What if the client disappears?',
    a: 'If you submitted the work and the client is silent for 14 days, the escrow is auto-released to you.' },
  { q: 'Why Testnet?',
    a: 'Work Pro currently runs on the Pi testnet (sandbox): all payments use Test-π with no real value while we polish the app before Mainnet.' },
  { q: 'How do I delete my job?',
    a: 'Open jobs can be deleted from the job page. Jobs in progress can’t — finish them or cancel the escrow first.' },
];

export default function FAQPage() {
  const ru = currentLang() === 'ru';
  const items = ru ? FAQ_RU : FAQ_EN;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in pb-24 bg-white dark:bg-slate-900 min-h-screen">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {ru ? 'Частые вопросы' : 'FAQ'}
      </h1>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
            >
              <span className="font-semibold text-sm text-gray-900 dark:text-white">{item.q}</span>
              <svg
                viewBox="0 0 24 24"
                className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            {open === i && (
              <p className="px-4 pb-4 text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
