import type { Locale } from "./i18n";

export interface PrivacySection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface PrivacyConsentLabels {
  title: string;
  accepted: string;
  rejected: string;
  undecided: string;
  accept: string;
  reject: string;
}

export interface PrivacyContent {
  title: string;
  intro: string;
  updatedLabel: string;
  updated: string;
  back: string;
  consent: PrivacyConsentLabels;
  sections: PrivacySection[];
  contactTitle: string;
  contactText: string;
}

export const privacyContent: Record<Locale, PrivacyContent> = {
  en: {
    title: "Privacy policy",
    intro:
      "This page explains what data this website collects, why it is collected, and how you can control it.",
    updatedLabel: "Last updated",
    updated: "2026-11-25",
    back: "Back to home",
    consent: {
      title: "Your analytics choice",
      accepted: "Analytics is enabled.",
      rejected: "Analytics is disabled.",
      undecided: "Analytics is disabled until you choose.",
      accept: "Allow analytics",
      reject: "Disable analytics",
    },
    sections: [
      {
        title: "What we collect",
        paragraphs: [
          "If you accept analytics, the site creates a random visitor identifier and stores it in the first-party cookie site_visitor_id. It is used only to distinguish visits.",
          "We record page paths, the tracks you play for at least 30 seconds, track titles, and listening duration. We do not collect names, email addresses, account credentials, or advertising identifiers.",
        ],
      },
      {
        title: "Why we collect it",
        paragraphs: [
          "The data is used to count visits, understand which sections are useful, and improve the site. Statistics are aggregated; we do not build advertising profiles or sell data.",
        ],
      },
      {
        title: "Consent",
        paragraphs: [
          "Analytics is disabled until you press Accept in the cookie banner. Pressing Reject disables analytics and removes the visitor cookie. You can change your choice on this page at any time.",
          "Your choice is stored locally in your browser under the cookie_consent key.",
        ],
      },
      {
        title: "Cookies and local storage",
        paragraphs: [],
        bullets: [
          "site_visitor_id: a random identifier, stored for 90 days, with SameSite=Lax and Secure when the site runs over HTTPS.",
          "cookie_consent: your analytics choice, stored in localStorage; it is not sent to the server.",
        ],
      },
      {
        title: "Retention",
        paragraphs: [
          "Analytics events are kept for up to 365 days by default and are then deleted. Aggregate counters may be recalculated after cleanup.",
        ],
      },
      {
        title: "Sharing",
        paragraphs: [
          "We do not sell personal data. The site loads public GitHub data to show the profile and uses a self-hosted Navidrome server to stream music. Hosting and infrastructure providers may process technical logs.",
        ],
      },
      {
        title: "Your rights",
        paragraphs: [
          "You can request access to or deletion of analytics data associated with your visitor identifier. You can also disable analytics at any time using the controls above or by clearing site data in your browser.",
        ],
      },
    ],
    contactTitle: "Contact",
    contactText:
      "For privacy questions or deletion requests, contact the site owner:",
  },
  ru: {
    title: "Политика конфиденциальности",
    intro:
      "На этой странице описано, какие данные собирает сайт, зачем они нужны и как вы можете управлять своим выбором.",
    updatedLabel: "Обновлено",
    updated: "2026-11-25",
    back: "Вернуться на главную",
    consent: {
      title: "Ваш выбор по аналитике",
      accepted: "Аналитика включена.",
      rejected: "Аналитика отключена.",
      undecided: "Аналитика отключена, пока вы не сделаете выбор.",
      accept: "Разрешить аналитику",
      reject: "Отключить аналитику",
    },
    sections: [
      {
        title: "Какие данные мы собираем",
        paragraphs: [
          "Если вы принимаете аналитику, сайт создаёт случайный идентификатор посетителя и сохраняет его в собственном cookie site_visitor_id. Он нужен только для различения визитов.",
          "Мы записываем пути страниц, треки, которые вы слушали не менее 30 секунд, названия треков и длительность прослушивания. Мы не собираем имена, email, учётные данные или рекламные идентификаторы.",
        ],
      },
      {
        title: "Зачем мы это собираем",
        paragraphs: [
          "Данные нужны, чтобы считать посещения, понимать, какие разделы полезны, и улучшать сайт. Статистика агрегируется; мы не строим рекламные профили и не продаём данные.",
        ],
      },
      {
        title: "Согласие",
        paragraphs: [
          "Аналитика отключена, пока вы не нажмёте «Принять» в cookie-баннере. Кнопка «Отклонить» отключает аналитику и удаляет cookie посетителя. Вы можете изменить выбор на этой странице в любой момент.",
          "Ваш выбор хранится локально в браузере под ключом cookie_consent.",
        ],
      },
      {
        title: "Cookie и локальное хранилище",
        paragraphs: [],
        bullets: [
          "site_visitor_id: случайный идентификатор, хранится 90 дней, SameSite=Lax и Secure при работе сайта по HTTPS.",
          "cookie_consent: ваш выбор по аналитике, хранится в localStorage и не отправляется на сервер.",
        ],
      },
      {
        title: "Срок хранения",
        paragraphs: [
          "События аналитики хранятся до 365 дней по умолчанию, затем удаляются. Агрегированные счётчики могут быть пересчитаны после очистки.",
        ],
      },
      {
        title: "Передача данных",
        paragraphs: [
          "Мы не продаём персональные данные. Сайт загружает публичные данные GitHub для профиля и использует собственный сервер Navidrome для музыки. Хостинг и инфраструктурные провайдеры могут обрабатывать технические логи.",
        ],
      },
      {
        title: "Ваши права",
        paragraphs: [
          "Вы можете запросить доступ к данным аналитики, связанным с вашим идентификатором посетителя, или их удаление. Аналитику также можно отключить в любой момент с помощью кнопок выше или очистив данные сайта в браузере.",
        ],
      },
    ],
    contactTitle: "Контакты",
    contactText:
      "По вопросам конфиденциальности и запросам на удаление данных свяжитесь с владельцем сайта:",
  },
};
