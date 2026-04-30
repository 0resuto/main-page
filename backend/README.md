# Analytics backend

This FastAPI service stores:

- total page visits
- unique visitors by persistent cookie
- listened tracks counted after 30 seconds

## Environment

Set these variables before starting the service:

- `ANALYTICS_DATABASE_URL=postgresql://user:password@localhost:5432/main_page`
- `ANALYTICS_ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.example`
- `ANALYTICS_HOST=127.0.0.1`
- `ANALYTICS_PORT=8000`

## Install

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

## Run

```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

## Frontend env

Point the Next.js app to this backend with:

- `NEXT_PUBLIC_ANALYTICS_API_URL=http://127.0.0.1:8000`
