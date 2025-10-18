from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, crud, auth, security
from .database import engine, Base, get_db
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from pydantic import ValidationError

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Clinic Materials API")

origins = ["http://localhost", "http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


def require_roles(allowed_roles: List[models.UserRole]):
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return role_checker


@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user


@app.get("/users/me/activity", response_model=list[schemas.ActivityLog])
def read_user_activity(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    return db.query(models.ActivityLog).filter(models.ActivityLog.user_id == current_user.id).order_by(
        models.ActivityLog.created_at.desc()).all()


@app.get("/users/", response_model=list[schemas.User])
def list_users(
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(require_roles([models.UserRole.admin, models.UserRole.head_nurse]))
):
    return crud.get_users(db)


@app.get("/users/{user_id}", response_model=schemas.User)
def read_user(
        user_id: int,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(require_roles([models.UserRole.admin, models.UserRole.head_nurse]))
):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.get("/users/{user_id}/activity", response_model=list[schemas.ActivityLog])
def read_specific_user_activity(
        user_id: int,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(require_roles([models.UserRole.admin, models.UserRole.head_nurse]))
):
    return db.query(models.ActivityLog).filter(models.ActivityLog.user_id == user_id).order_by(
        models.ActivityLog.created_at.desc()).all()


@app.post("/requests/", response_model=schemas.PurchaseRequest)
def create_request(
        request: schemas.PurchaseRequestCreate, db: Session = Depends(get_db),
        current_user: schemas.User = Depends(require_roles([models.UserRole.admin, models.UserRole.head_nurse]))
):
    return crud.create_purchase_request(db=db, request=request, user_id=current_user.id)


@app.get("/requests/", response_model=list[schemas.PurchaseRequest])
def list_requests(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    return crud.get_purchase_requests(db)


@app.post("/requests/{request_id}/approve", response_model=schemas.PurchaseRequest)
def approve_request(
        request_id: int, db: Session = Depends(get_db),
        current_user: schemas.User = Depends(require_roles([models.UserRole.admin]))
):
    approved_request = crud.approve_purchase_request(db, request_id=request_id, user_id=current_user.id)
    if not approved_request:
        raise HTTPException(status_code=404, detail="Request not found or already processed")
    return approved_request


@app.get("/narcotic-logs/", response_model=list[schemas.NarcoticLogEntry])
def list_narcotic_logs(
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(require_roles([models.UserRole.admin, models.UserRole.head_nurse]))
):
    return crud.get_narcotic_logs(db)


@app.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    return crud.get_dashboard_stats(db)


@app.post("/materials/", response_model=schemas.Material)
def create_material(
        material: schemas.MaterialCreate, db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    return crud.create_material(db=db, material=material, user_id=current_user.id)


@app.get("/materials/", response_model=list[schemas.Material])
def list_materials(
        skip: int = 0, limit: int = 100, q: str | None = None, db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    return crud.get_materials(db, skip=skip, limit=limit, q=q)


@app.put("/materials/{material_id}", response_model=schemas.Material)
def update_material(
        material_id: int, material: schemas.MaterialCreate, db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    updated_material = crud.update_material(db, material_id=material_id, material=material, user_id=current_user.id)
    if updated_material is None:
        raise HTTPException(status_code=404, detail="Material not found")
    return updated_material


@app.delete("/materials/{material_id}")
def delete_material(
        material_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)
):
    deleted_material = crud.delete_material(db, material_id=material_id, user_id=current_user.id)
    if deleted_material is None:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"detail": "Material deleted successfully"}


@app.post("/transactions/", response_model=schemas.Transaction)
def create_transaction(
        transaction_data: schemas.TransactionCreate, db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    material = db.get(models.Material, transaction_data.material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    if material.is_narcotic and transaction_data.delta < 0 and not transaction_data.narcotic_log:
        raise HTTPException(status_code=400, detail="Narcotic log is required for this transaction")

    transaction = crud.create_transaction(db, trans_data=transaction_data, user_id=current_user.id)
    if not transaction:
        raise HTTPException(status_code=400, detail="Insufficient quantity in batch")

    return transaction