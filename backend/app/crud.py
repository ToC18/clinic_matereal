from sqlalchemy import select
from sqlalchemy.orm import Session
from . import models, schemas

def create_supplier(db: Session, supplier: schemas.SupplierCreate):
    obj = models.Supplier(name=supplier.name, contact=supplier.contact)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_suppliers(db: Session, skip: int = 0, limit: int = 100):
    return db.execute(select(models.Supplier).offset(skip).limit(limit)).scalars().all()

def create_material(db: Session, material: schemas.MaterialCreate):
    obj = models.Material(**material.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_materials(db: Session, skip: int = 0, limit: int = 100, q: str = None):
    stmt = select(models.Material)
    if q:
        stmt = stmt.filter(models.Material.name.ilike(f"%{q}%"))
    return db.execute(stmt.offset(skip).limit(limit)).scalars().all()

def get_material(db: Session, material_id: int):
    return db.get(models.Material, material_id)

def update_material_quantity(db: Session, material_id: int, delta: float):
    mat = db.get(models.Material, material_id)
    if not mat:
        return None
    mat.quantity = (mat.quantity or 0) + delta
    db.add(mat)
    db.commit()
    db.refresh(mat)
    return mat

def create_transaction(db: Session, trans: schemas.TransactionCreate):
    transaction = models.Transaction(**trans.dict())
    db.add(transaction)
    # update material quantity
    mat = db.get(models.Material, trans.material_id)
    if mat:
        mat.quantity = (mat.quantity or 0) + trans.delta
        db.add(mat)
    db.commit()
    db.refresh(transaction)
    return transaction
