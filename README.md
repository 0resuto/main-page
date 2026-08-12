# Main Page Project

The project consists of a **Next.js** client application and an analytics service built with **FastAPI** using **PostgreSQL**.

## Project Structure

- `/frontend` — User interface (Next.js, Tailwind CSS, Framer Motion, Lenis).
- `/backend` — API for analytics collection (FastAPI, Psycopg, PostgreSQL).

## Environment Requirements

- Node.js (version 20 or higher)
- Python (version 3.10 or higher)
- PostgreSQL
- Docker (for containerization)

## Environment Variables (.env)

The project uses split secrets. You need to create `.env` files based on the `.env.example` templates:

1. Create a `.env` file in the root for docker-compose.
2. Create a `frontend/.env` file for frontend variables.
3. Create a `backend/.env` file and make sure to specify the database connection string.

## Running the Backend (FastAPI)

The backend automatically creates the necessary tables in PostgreSQL upon startup.

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # macOS/Linux
   venv\Scripts\activate     # Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`. Interactive Swagger documentation: `http://localhost:8000/docs`.

### Available Endpoints
- `GET /health` — Check server status.
- `POST /analytics/visits` — Record page visit information.
- `POST /analytics/track-listens` — Record track listen information.
- `GET /analytics/stats` — Get site statistics.

## Running the Frontend (Next.js)

### Local Development
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

The site will be available at `http://localhost:3000`.

### Running via Docker (Production)
The frontend is configured for a multi-stage build to optimize image size. You can run it with a single command from the root of the project:

```bash
docker-compose up -d --build
```