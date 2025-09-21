from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas, crud
from .database import engine, Base, get_db

# создаём таблицы при старте (для простоты)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Clinic Materials API")

@app.post("/suppliers/", response_model=schemas.Supplier)
def create_supplier(supplier: schemas.SupplierCreate, db: Session = Depends(get_db)):
    return crud.create_supplier(db, supplier)

@app.get("/suppliers/", response_model=list[schemas.Supplier])
def list_suppliers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_suppliers(db, skip, limit)

@app.post("/materials/", response_model=schemas.Material)
def create_material(material: schemas.MaterialCreate, db: Session = Depends(get_db)):
    return crud.create_material(db, material)

@app.get("/materials/", response_model=list[schemas.Material])
def list_materials(skip: int = 0, limit: int = 100, q: str | None = None, db: Session = Depends(get_db)):
    return crud.get_materials(db, skip, limit, q)

@app.get("/materials/{material_id}", response_model=schemas.Material)
def get_material(material_id: int, db: Session = Depends(get_db)):
    mat = crud.get_material(db, material_id)
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    return mat

@app.post("/transactions/", response_model=schemas.Transaction)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    mat = crud.get_material(db, transaction.material_id)
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    return crud.create_transaction(db, transaction)
