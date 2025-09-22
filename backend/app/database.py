# backend/app/database.py

import os
import time
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Получаем URL базы данных из .env
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://clinic:clinicpass@db:5432/clinic_db")

# Инициализация engine с повторными попытками подключения
engine = None
for attempt in range(20):
    try:
        engine = create_engine(DATABASE_URL, future=True)
        conn = engine.connect()
        conn.close()
        print(f"[INFO] Connected to database on attempt {attempt+1}")
        break
    except Exception as e:
        print(f"[WARN] Database not ready (attempt {attempt+1}): {e}")
        time.sleep(1)
else:
    raise Exception("Cannot connect to database after 20 attempts")

# Создание сессии и метаданных
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
metadata = MetaData()
Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()