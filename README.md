# Main Page Project

Проект состоит из клиентской части на **Next.js** и сервиса аналитики на **FastAPI** с использованием **PostgreSQL**.

## Структура проекта

- `/frontend` — Пользовательский интерфейс (Next.js, Tailwind CSS 4, Framer Motion, Lenis).
- `/backend` — API для сбора аналитики (FastAPI, Psycopg, PostgreSQL).

## Требования к окружению

- Node.js (версия 20 или выше)
- Python (версия 3.10 или выше)
- PostgreSQL
- Docker (для контейнеризации фронтенда)

---

## Настройка переменных окружения (.env)

В проекте используется разделение секретов. Вам необходимо создать два файла `.env`:

### 1. `frontend/.env`
Создайте файл `frontend/.env` для переменных фронтенда. 
*(Сюда можно добавить публичные переменные с префиксом `NEXT_PUBLIC_`, если они нужны)*

### 2. `backend/.env`
Создайте файл `backend/.env` и обязательно укажите строку подключения к базе данных аналитики:
```env
# Обязательная переменная для подключения к PostgreSQL
ANALYTICS_DATABASE_URL=postgresql://user:password@localhost:5432/analytics_db

# Опционально: разрешенные источники для CORS (по умолчанию разрешен localhost:3000)
ANALYTICS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## Запуск Бэкенда (FastAPI)

Бэкенд автоматически создает необходимые таблицы в PostgreSQL при запуске.

1. Перейдите в папку бэкенда:
   ```bash
   cd backend
   ```
2. Создайте и активируйте виртуальное окружение:
   ```bash
   python -m venv venv
   
   # Для Windows:
   venv\Scripts\activate
   # Для macOS/Linux:
   source venv/bin/activate
   ```
3. Установите зависимости:
   ```bash
   pip install fastapi uvicorn psycopg[pool] pydantic python-dotenv
   ```
4. Запустите сервер для разработки:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
API будет доступно по адресу `http://localhost:8000`. Интерактивная документация Swagger: `http://localhost:8000/docs`.

### API Endpoints
- `GET /health` — Проверка статуса сервера.
- `POST /analytics/visits` — Запись информации о посещении страницы.
- `POST /analytics/track-listens` — Запись информации о прослушивании треков (минимум 30 секунд).
- `GET /analytics/stats` — Получение статистики сайта (визиты, уникальные посетители, прослушивания).

---

## Запуск Фронтенда (Next.js)

### Локальная разработка
1. Перейдите в папку фронтенда:
   ```bash
   cd frontend
   ```
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Запустите сервер разработки:
   ```bash
   npm run dev
   ```
Сайт будет доступен по адресу `http://localhost:3000`.

### Запуск через Docker (Production)
Фронтенд настроен на многоэтапную (multi-stage) сборку для оптимизации размера образа. Вы можете запустить его одной командой из корня проекта:
```bash
docker-compose up --build -d
```
Приложение будет работать в фоновом режиме и пробросит порт `8080` (доступно по `http://localhost:8080`).