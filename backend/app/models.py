from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from sqlalchemy.sql import func

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
    unit = Column(String, nullable=False)
    quantity = Column(Float, default=0.0)
    min_quantity = Column(Float, default=0.0)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    supplier = relationship("Supplier", back_populates="materials")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    delta = Column(Float, nullable=False)  # positive => приход, negative => расход
    note = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
