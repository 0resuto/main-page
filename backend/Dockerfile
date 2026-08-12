FROM python:3.10-slim

WORKDIR /app

# Запрещаем Python писать .pyc файлы на диск (экономит место)
ENV PYTHONDONTWRITEBYTECODE=1
# Запрещаем буферизацию вывода (чтобы логи сразу попадали в терминал Docker)
ENV PYTHONUNBUFFERED=1

# Копируем только файл зависимостей и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем исходный код бэкенда
COPY . .

RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]