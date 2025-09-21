FROM python:3.11-slim

WORKDIR /app

# Установка netcat-openbsd и зависимостей Python
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

CMD ["./wait-for-it.sh", "db:5432", "--timeout=30", "--", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
