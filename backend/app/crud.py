from sqlalchemy.orm import Session
from sqlalchemy import select, func, text
from datetime import datetime, timedelta
from . import models, schemas, security


# User CRUD operations
def get_user(db: Session, user_id: int):
    return db.get(models.User, user_id)


def get_user_by_email(db: Session, email: str):
    return db.execute(select(models.User).filter(models.User.email == email)).scalar_one_or_none()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        role=user.role.value
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or not security.verify_password(password, user.hashed_password):
        return None
    return user


# Material CRUD operations
def get_materials(db: Session, skip: int = 0, limit: int = 100, q: str = None):
    stmt = select(models.Material)
    if q:
        stmt = stmt.filter(models.Material.name.ilike(f"%{q}%"))

    results = db.execute(stmt.offset(skip).limit(limit)).scalars().all()

    materials_with_totals = []
    for material in results:
        total_quantity = db.query(func.sum(models.Batch.current_quantity)).filter(
            models.Batch.material_id == material.id).scalar() or 0
        material_data = schemas.Material.from_orm(material)
        material_data.total_quantity = total_quantity
        materials_with_totals.append(material_data)

    return materials_with_totals


def create_material(db: Session, material: schemas.MaterialCreate, user_id: int):
    db_material = models.Material(
        name=material.name, unit=material.unit,
        min_quantity=material.min_quantity, is_narcotic=material.is_narcotic,
        supplier_id=material.supplier_id
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)

    if material.initial_quantity > 0:
        batch = models.Batch(
            material_id=db_material.id, initial_quantity=material.initial_quantity,
            current_quantity=material.initial_quantity, expiration_date=material.expiration_date
        )
        db.add(batch)
        db.flush()

        transaction = models.Transaction(
            material_id=db_material.id, delta=material.initial_quantity,
            note="Initial stock", user_id=user_id, batch_id=batch.id
        )
        db.add(transaction)
        db.commit()
        db.refresh(db_material)

    material_data = schemas.Material.from_orm(db_material)
    material_data.total_quantity = material.initial_quantity
    return material_data


def delete_material(db: Session, material_id: int):
    db_material = db.get(models.Material, material_id)
    if db_material:
        db.delete(db_material)
        db.commit()
    return db_material


def update_material(db: Session, material_id: int, material: schemas.MaterialCreate):
    db_material = db.get(models.Material, material_id)
    if db_material:
        update_data = material.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_material, key, value)
        db.add(db_material)
        db.commit()
        db.refresh(db_material)

    # После обновления возвращаем объект с посчитанным total_quantity
    total_quantity = db.query(func.sum(models.Batch.current_quantity)).filter(
        models.Batch.material_id == db_material.id).scalar() or 0
    material_data = schemas.Material.from_orm(db_material)
    material_data.total_quantity = total_quantity
    return material_data


# Purchase Request CRUD operations
def create_purchase_request(db: Session, request: schemas.PurchaseRequestCreate, user_id: int):
    db_request = models.PurchaseRequest(requester_id=user_id, status="pending")
    db.add(db_request)

    for item_data in request.items:
        db_item = models.PurchaseRequestItem(
            request=db_request, **item_data.model_dump()
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_request)
    return db_request


def get_purchase_requests(db: Session):
    return db.query(models.PurchaseRequest).order_by(models.PurchaseRequest.created_at.desc()).all()


def approve_purchase_request(db: Session, request_id: int, user_id: int):
    db_request = db.get(models.PurchaseRequest, request_id)
    if not db_request or db_request.status != "pending":
        return None

    db_request.status = "approved"

    for item in db_request.items:
        material = db.execute(
            select(models.Material).filter(models.Material.name == item.material_name)).scalar_one_or_none()
        if not material:
            material = models.Material(name=item.material_name, unit=item.unit)
            db.add(material)
            db.commit()
            db.refresh(material)

        batch = models.Batch(
            material_id=material.id, initial_quantity=item.quantity,
            current_quantity=item.quantity, expiration_date=item.expiration_date
        )
        db.add(batch)
        db.flush()

        transaction = models.Transaction(
            material_id=material.id, delta=item.quantity,
            note=f"Поступление по заявке #{db_request.id}", user_id=user_id,
            batch_id=batch.id
        )
        db.add(transaction)

    db.commit()
    db.refresh(db_request)
    return db_request


def get_dashboard_stats(db: Session):
    # 1. Материалы с низким остатком
    low_stock_query = text("""
        SELECT m.id, m.name, m.unit, m.min_quantity, SUM(b.current_quantity) as total_quantity
        FROM materials m
        JOIN batches b ON m.id = b.material_id
        GROUP BY m.id
        HAVING SUM(b.current_quantity) < m.min_quantity
    """)
    low_stock_results = db.execute(low_stock_query).mappings().all()

    # 2. Партии с истекающим сроком годности (в ближайшие 30 дней)
    expiring_soon_date = datetime.utcnow() + timedelta(days=30)
    expiring_soon_batches_orm = db.query(models.Batch) \
        .join(models.Material) \
        .filter(models.Batch.expiration_date != None) \
        .filter(models.Batch.expiration_date <= expiring_soon_date) \
        .all()

    # Конвертируем ORM объекты в словари, чтобы избежать ошибок
    expiring_soon_batches = [
        {
            "id": batch.id,
            "material": {"name": batch.material.name},  # Включаем имя материала
            "current_quantity": batch.current_quantity,
            "expiration_date": batch.expiration_date,
        }
        for batch in expiring_soon_batches_orm
    ]

    # 3. Распределение материалов по количеству
    distribution_query = text("""
        SELECT m.name, SUM(b.current_quantity) as total_quantity
        FROM materials m
        JOIN batches b ON m.id = b.material_id
        WHERE b.current_quantity > 0
        GROUP BY m.name
        ORDER BY total_quantity DESC
        LIMIT 10
    """)
    material_distribution_results = db.execute(distribution_query).mappings().all()

    return {
        "low_stock_items": [dict(row) for row in low_stock_results],
        "expiring_soon_batches": expiring_soon_batches,
        "material_distribution": [dict(row) for row in material_distribution_results]
    }