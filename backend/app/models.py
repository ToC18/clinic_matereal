from sqlalchemy import (Column, Integer, String, Float, ForeignKey, DateTime,
                        Boolean, Enum as SQLAlchemyEnum)
from sqlalchemy.orm import relationship
from .database import Base
from sqlalchemy.sql import func
import enum

class UnitEnum(enum.Enum):
    piece = "piece"
    milliliter = "milliliter"
    gram = "gram"
    pack = "pack"
    ampoule = "ampoule"

class UserRole(enum.Enum):
    staff = "staff"
    admin = "admin"
    head_nurse = "head_nurse"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(SQLAlchemyEnum(UserRole), default=UserRole.staff)

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    details = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User")

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    contact = Column(String, nullable=True)
    materials = relationship("Material", back_populates="supplier")

class Material(Base):
    __tablename__ = "materials"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    unit = Column(SQLAlchemyEnum(UnitEnum, name="unitenum"), nullable=False)
    min_quantity = Column(Float, default=0.0)
    is_narcotic = Column(Boolean, default=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    supplier = relationship("Supplier", back_populates="materials")
    batches = relationship("Batch", back_populates="material", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="material")

class Batch(Base):
    __tablename__ = "batches"
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    material = relationship("Material", back_populates="batches")
    initial_quantity = Column(Float, nullable=False)
    current_quantity = Column(Float, nullable=False)
    expiration_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    material = relationship("Material", back_populates="transactions")
    delta = Column(Float, nullable=False)
    note = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)

class NarcoticLog(Base):
    __tablename__ = "narcotic_logs"
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    patient_info = Column(String, nullable=False)
    reason = Column(String, nullable=False)

class PurchaseRequest(Base):
    __tablename__ = "purchase_requests"
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    items = relationship("PurchaseRequestItem", back_populates="request", cascade="all, delete-orphan")

class PurchaseRequestItem(Base):
    __tablename__ = "purchase_request_items"
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("purchase_requests.id"), nullable=False)
    material_name = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(SQLAlchemyEnum(UnitEnum, name="unitenum"), nullable=False)
    expiration_date = Column(DateTime, nullable=True)
    request = relationship("PurchaseRequest", back_populates="items")