from sqlalchemy.orm import Session
from sqlalchemy import select, func, text
from datetime import datetime, timedelta
from . import models, schemas, security


# --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
def create_activity_log(db: Session, user_id: int, action: str, details: str = None):
    """Создает запись в журнале активности."""
    db_log = models.ActivityLog(user_id=user_id, action=action, details=details)
    db.add(db_log)


def get_material_with_total(db: Session, db_material: models.Material):
    """Возвращает схему материала с посчитанным общим количеством."""
    total_quantity = db.query(func.sum(models.Batch.current_quantity)).filter(
        models.Batch.material_id == db_material.id).scalar() or 0
    material_data = schemas.Material.from_orm(db_material)
    material_data.total_quantity = total_quantity
    return material_data


# --- CRUD ОПЕРАЦИИ ---
def get_user(db: Session, user_id: int):
    return db.get(models.User, user_id)


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).order_by(models.User.full_name).offset(skip).limit(limit).all()


def get_user_by_email(db: Session, email: str):
    return db.execute(select(models.User).filter(models.User.email == email)).scalar_one_or_none()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.flush()

    create_activity_log(db, user_id=db_user.id, action="Регистрация",
                        details=f"Пользователь {user.email} зарегистрирован в системе")

    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    try:
        if not security.verify_password(password, user.hashed_password):
            return None
    except ValueError:
        return None
    return user


def get_materials(db: Session, skip: int = 0, limit: int = 100, q: str = None):
    stmt = select(models.Material).order_by(models.Material.name)
    if q:
        stmt = stmt.filter(models.Material.name.ilike(f"%{q}%"))

    results = db.execute(stmt.offset(skip).limit(limit)).scalars().all()

    materials_with_totals = [get_material_with_total(db, material) for material in results]
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

    create_activity_log(db, user_id=user_id, action="Создание материала", details=f"Создан: {db_material.name}")
    db.commit()
    db.refresh(db_material)

    return get_material_with_total(db, db_material)


def delete_material(db: Session, material_id: int, user_id: int):
    db_material = db.get(models.Material, material_id)
    if db_material:
        create_activity_log(db, user_id=user_id, action="Удаление материала", details=f"Удален: {db_material.name}")
        db.delete(db_material)
        db.commit()
    return db_material


def update_material(db: Session, material_id: int, material: schemas.MaterialCreate, user_id: int):
    db_material = db.get(models.Material, material_id)
    if db_material:
        update_data = material.model_dump(exclude_unset=True, exclude={'initial_quantity', 'expiration_date'})
        for key, value in update_data.items():
            setattr(db_material, key, value)
        db.add(db_material)
        create_activity_log(db, user_id=user_id, action="Изменение материала", details=f"Изменен: {db_material.name}")
        db.commit()
        db.refresh(db_material)
    return get_material_with_total(db, db_material)


def create_transaction(db: Session, trans_data: schemas.TransactionCreate, user_id: int):
    batch = db.get(models.Batch, trans_data.batch_id)
    if not batch or batch.current_quantity < abs(trans_data.delta):
        return None

    batch.current_quantity += trans_data.delta

    db_transaction = models.Transaction(
        material_id=trans_data.material_id, delta=trans_data.delta,
        note=trans_data.note, batch_id=trans_data.batch_id, user_id=user_id
    )
    db.add(db_transaction)
    db.flush()

    if trans_data.narcotic_log:
        narcotic_log = models.NarcoticLog(
            transaction_id=db_transaction.id,
            patient_info=trans_data.narcotic_log.patient_info,
            reason=trans_data.narcotic_log.reason
        )
        db.add(narcotic_log)

    action_details = f"{abs(trans_data.delta)} {batch.material.unit.value} материала '{batch.material.name}'"
    action_type = "Списание материала" if trans_data.delta < 0 else "Поступление материала"
    create_activity_log(db, user_id=user_id, action=action_type, details=action_details)

    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def create_purchase_request(db: Session, request: schemas.PurchaseRequestCreate, user_id: int):
    db_request = models.PurchaseRequest(requester_id=user_id, status="pending")
    db.add(db_request)
    db.flush()

    for item_data in request.items:
        db_item = models.PurchaseRequestItem(
            request_id=db_request.id, **item_data.model_dump()
        )
        db.add(db_item)

    create_activity_log(db, user_id, "Создание заявки", f"Создана заявка #{db_request.id}")
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
    create_activity_log(db, user_id, "Подтверждение заявки", f"Подтверждена заявка #{db_request.id}")

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
    low_stock_query = text("""
        SELECT m.id, m.name, m.unit, m.min_quantity, SUM(b.current_quantity) as total_quantity
        FROM materials m JOIN batches b ON m.id = b.material_id
        GROUP BY m.id
        HAVING SUM(b.current_quantity) < m.min_quantity AND m.min_quantity > 0
    """)
    low_stock_results = db.execute(low_stock_query).mappings().all()

    expiring_soon_date = datetime.utcnow() + timedelta(days=30)
    expiring_soon_batches_orm = db.query(models.Batch).join(models.Material).filter(
        models.Batch.expiration_date != None).filter(models.Batch.expiration_date <= expiring_soon_date).filter(
        models.Batch.current_quantity > 0).all()

    expiring_soon_batches = [
        {"id": b.id, "material": {"name": b.material.name}, "current_quantity": b.current_quantity,
         "expiration_date": b.expiration_date} for b in expiring_soon_batches_orm
    ]

    distribution_query = text("""
        SELECT m.name, SUM(b.current_quantity) as total_quantity
        FROM materials m JOIN batches b ON m.id = b.material_id
        WHERE b.current_quantity > 0
        GROUP BY m.name ORDER BY total_quantity DESC LIMIT 10
    """)
    material_distribution_results = db.execute(distribution_query).mappings().all()

    return {
        "low_stock_items": [dict(row) for row in low_stock_results],
        "expiring_soon_batches": expiring_soon_batches,
        "material_distribution": [dict(row) for row in material_distribution_results]
    }


def get_narcotic_logs(db: Session):
    logs = db.query(
        models.NarcoticLog.id, models.Transaction.created_at, models.Transaction.delta,
        models.NarcoticLog.patient_info, models.NarcoticLog.reason, models.User, models.Material
    ).join(models.Transaction, models.NarcoticLog.transaction_id == models.Transaction.id) \
        .join(models.User, models.Transaction.user_id == models.User.id) \
        .join(models.Material, models.Transaction.material_id == models.Material.id) \
        .order_by(models.Transaction.created_at.desc()).all()

    result = []
    for log in logs:
        result.append({"id": log[0], "created_at": log[1], "delta": log[2], "patient_info": log[3], "reason": log[4],
                       "user": log[5], "material": log[6]})
    return result