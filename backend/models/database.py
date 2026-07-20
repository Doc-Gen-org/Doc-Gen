from sqlalchemy import create_engine  # type: ignore[import]
from sqlalchemy.orm import sessionmaker, declarative_base  # type: ignore[import]
from services.app_paths import DB_PATH

# sqlite URLs need forward slashes even on Windows
DATABASE_URL = f"sqlite:///{DB_PATH.replace(chr(92), '/')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()