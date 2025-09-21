from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SupplierBase(BaseModel):
    name: str
    contact: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class Supplier(SupplierBase):
    id: int
    class Config:
        orm_mode = True

class MaterialBase(BaseModel):
    name: str
    unit: str
    quantity: float = 0.0
    min_quantity: float = 0.0
    supplier_id: Optional[int] = None

class MaterialCreate(MaterialBase):
    pass

class Material(MaterialBase):
    id: int
    class Config:
        orm_mode = True

class TransactionBase(BaseModel):
    material_id: int
    delta: float
    note: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True
