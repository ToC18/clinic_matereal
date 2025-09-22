from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from . import models, schemas, crud, auth, security
from .database import engine, Base, get_db
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from pydantic import ValidationError

# Создаём таблицы при старте
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Clinic Materials API")

# Настройки CORS
origins = ["http://localhost", "http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутер аутентификации
app.include_router(auth.router, tags=["auth"])


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except (JWTError, ValidationError):
        raise credentials_exception
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user


@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user

@app.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    return crud.get_dashboard_stats(db)

@app.post("/materials/", response_model=schemas.Material)
def create_material(
    material: schemas.MaterialCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    return crud.create_material(db=db, material=material, user_id=current_user.id)

# Остальные эндпоинты тоже нужно будет защитить, добавив current_user
# ... (здесь будут эндпоинты для поставщиков, транзакций и отчетов)
def require_role(required_role: models.UserRole):
    def role_checker(current_user: schemas.User = Depends(get_current_user)):
        if current_user.role != required_role and current_user.role != models.UserRole.admin:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user
    return role_checker

@app.post("/requests/", response_model=schemas.PurchaseRequest)
def create_request(
    request: schemas.PurchaseRequestCreate,
    db: Session = Depends(get_db),
    # Только старшая медсестра (и админ) могут создавать заявки
    current_user: schemas.User = Depends(require_role(models.UserRole.head_nurse))
):
    return crud.create_purchase_request(db=db, request=request, user_id=current_user.id)

@app.get("/requests/", response_model=list[schemas.PurchaseRequest])
def list_requests(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    return crud.get_purchase_requests(db)

@app.post("/requests/{request_id}/approve", response_model=schemas.PurchaseRequest)
def approve_request(
    request_id: int,
    db: Session = Depends(get_db),
    # Только админ может подтверждать заявки
    current_user: schemas.User = Depends(require_role(models.UserRole.admin))
):
    approved_request = crud.approve_purchase_request(db, request_id=request_id, user_id=current_user.id)
    if not approved_request:
        raise HTTPException(status_code=404, detail="Request not found or already processed")
    return approved_request

# ... (дальше идет @app.get("/dashboard/stats",...))
@app.get("/materials/", response_model=list[schemas.Material])
def list_materials(skip: int = 0, limit: int = 100, q: str | None = None, db: Session = Depends(get_db)):
    return crud.get_materials(db, skip=skip, limit=limit, q=q)

