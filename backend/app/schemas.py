from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from .models import UserRole, UnitEnum


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.staff


class User(UserBase):
    id: int
    is_active: bool
    role: str

    class Config:
        from_attributes = True


# Activity Log Schemas
class ActivityLog(BaseModel):
    id: int
    action: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# Supplier Schemas
class SupplierBase(BaseModel):
    name: str
    contact: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class Supplier(SupplierBase):
    id: int

    class Config:
        from_attributes = True


# Batch Schemas
class BatchBase(BaseModel):
    initial_quantity: float
    expiration_date: Optional[datetime] = None


class BatchCreate(BatchBase):
    material_id: int


class Batch(BatchBase):
    id: int
    current_quantity: float
    created_at: datetime

    class Config:
        from_attributes = True


# Material Schemas
class MaterialBase(BaseModel):
    name: str
    unit: UnitEnum
    min_quantity: float = 0.0
    is_narcotic: bool = False
    supplier_id: Optional[int] = None


class MaterialCreate(MaterialBase):
    initial_quantity: float = 0.0
    expiration_date: Optional[datetime] = None


class Material(MaterialBase):
    id: int
    total_quantity: float = 0.0
    batches: list[Batch] = []

    class Config:
        from_attributes = True


# Narcotic Log Schemas
class NarcoticLogBase(BaseModel):
    patient_info: str
    reason: str


class NarcoticLogCreate(NarcoticLogBase):
    pass


# Transaction Schemas
class TransactionBase(BaseModel):
    material_id: int
    delta: float
    note: Optional[str] = None
    batch_id: Optional[int] = None
    narcotic_log: Optional[NarcoticLogCreate] = None


class TransactionCreate(TransactionBase):
    pass


class Transaction(TransactionBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Purchase Request Item Schemas
class PurchaseRequestItemBase(BaseModel):
    material_name: str
    quantity: float
    unit: UnitEnum
    expiration_date: Optional[datetime] = None


class PurchaseRequestItemCreate(PurchaseRequestItemBase):
    pass


class PurchaseRequestItem(PurchaseRequestItemBase):
    id: int

    class Config:
        from_attributes = True


# Purchase Request Schemas
class PurchaseRequestBase(BaseModel):
    items: list[PurchaseRequestItemCreate]


class PurchaseRequestCreate(PurchaseRequestBase):
    pass


class PurchaseRequest(PurchaseRequestBase):
    id: int
    requester_id: int
    status: str
    created_at: datetime
    items: list[PurchaseRequestItem] = []

    class Config:
        from_attributes = True


# Narcotic Journal Schemas
class UserInfo(BaseModel):
    email: str
    full_name: str

    class Config:
        from_attributes = True


class MaterialInfo(BaseModel):
    name: str
    unit: UnitEnum

    class Config:
        from_attributes = True


class NarcoticLogEntry(BaseModel):
    id: int
    created_at: datetime
    delta: float
    patient_info: str
    reason: str
    user: UserInfo
    material: MaterialInfo

    class Config:
        from_attributes = True