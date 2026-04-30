export type Locale = "en" | "ru";

export const DEFAULT_LOCALE: Locale = "en";

export function normalizeLocale(value?: string | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  return value.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export const translations = {
  en: {
    metadataDescription:
      "This is a convenient hub for my services and a place where you can learn about my projects.",
    nav: {
      home: "Home",
      github: "GitHub",
      music: "Music",
    },
    hero: {
      title: "Welcome to my website",
      description:
        "This is a convenient hub for my services and a place where you can learn about my projects.",
      cards: {
        cloud: "Cloud",
        music: "Music",
        films: "Films",
      },
    },
    github: {
      repositories: "repositories",
      followers: "followers",
      noDescription: "No description",
      errors: {
        notFound: "GitHub user not found",
        api: "GitHub API error",
        profileDataFailed: "Failed to load profile data",
        fetchFailed: "Failed to fetch GitHub data",
      },
    },
    musicPlayer: {
      myPlaylist: "My playlist",
      queue: "Queue",
      failedTitle: "Failed to connect to Navidrome",
      errors: {
        playlist: "Failed to receive playlist",
        proxyUnavailable: "Proxy server not available. Check app/api/navidrome/route.ts.",
        unexpected: "An unexpected error occurred",
      },
    },
    footer: {
      description: "The website is still being worked on, and it keeps getting better.",
      navigation: "Navigation",
      contacts: "Contacts",
      stats: "Stats",
      totalVisits: "All visits",
      uniqueVisitors: "Unique visitors",
      listenedTracks: "Tracks listened",
      statsUnavailable: "Stats are temporarily unavailable.",
    },
    cookieBanner: {
      text:
        "We use cookies to make our site work better. By continuing to use this website, you agree to our use of cookies.",
      accept: "Okay",
    },
    privacyModal: {
      title: "Privacy policy",
      placeholder: "The privacy policy text will appear here soon.",
    },
  },
  ru: {
    metadataDescription:
      "Это удобный хаб с моими сервисами и место, где можно узнать о моих проектах.",
    nav: {
      home: "Главная",
      github: "GitHub",
      music: "Музыка",
    },
    hero: {
      title: "Добро пожаловать на мой сайт",
      description:
        "Это удобный хаб с моими сервисами и место, где можно узнать о моих проектах.",
      cards: {
        cloud: "Облако",
        music: "Музыка",
        films: "Фильмы",
      },
    },
    github: {
      repositories: "репозиториев",
      followers: "подписчиков",
      noDescription: "Описание отсутствует",
      errors: {
        notFound: "Пользователь GitHub не найден",
        api: "Ошибка GitHub API",
        profileDataFailed: "Не удалось загрузить данные профиля",
        fetchFailed: "Не удалось получить данные GitHub",
      },
    },
    musicPlayer: {
      myPlaylist: "Мой плейлист",
      queue: "Очередь",
      failedTitle: "Не удалось подключиться к Navidrome",
      errors: {
        playlist: "Не удалось получить плейлист",
        proxyUnavailable:
          "Прокси-сервер недоступен. Проверьте файл app/api/navidrome/route.ts.",
        unexpected: "Произошла непредвиденная ошибка",
      },
    },
    footer: {
      description: "Сайт всё ещё в разработке и постепенно становится лучше.",
      navigation: "Навигация",
      contacts: "Контакты",
      stats: "Статистика",
      totalVisits: "Все посещения",
      uniqueVisitors: "Уникальные посетители",
      listenedTracks: "Прослушанные треки",
      statsUnavailable: "Статистика временно недоступна.",
    },
    cookieBanner: {
      text:
        "Мы используем cookie, чтобы сайт работал лучше. Продолжая пользоваться сайтом, вы соглашаетесь с их использованием.",
      accept: "Понятно",
    },
    privacyModal: {
      title: "Политика конфиденциальности",
      placeholder: "Текст политики конфиденциальности появится здесь позже.",
    },
  },
} as const;
