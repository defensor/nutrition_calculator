from sqlalchemy.orm import Session
import models, schemas
from datetime import date

# User
def get_users(db: Session):
    return db.query(models.User).all()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(name=user.name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Product
def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product: schemas.ProductCreate):
    db_product = get_product(db, product_id)
    if db_product:
        for key, value in product.dict().items():
            setattr(db_product, key, value)
        db.commit()
        db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    # Check if used in DishIngredient
    in_dish = db.query(models.DishIngredient).filter(models.DishIngredient.product_id == product_id).first()
    if in_dish:
        return False

    # Check if used in LogEntryItem
    in_log = db.query(models.LogEntryItem).filter(models.LogEntryItem.product_id == product_id).first()
    if in_log:
        return False

    db.query(models.Product).filter(models.Product.id == product_id).delete()
    db.commit()
    return True

# Dish
def get_dishes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Dish).offset(skip).limit(limit).all()

def get_dish(db: Session, dish_id: int):
    return db.query(models.Dish).filter(models.Dish.id == dish_id).first()

def create_dish(db: Session, dish: schemas.DishCreate):
    db_dish = models.Dish(
        name=dish.name,
        cooked_weight=dish.cooked_weight,
        is_cooked_weight_auto=dish.is_cooked_weight_auto
    )
    db.add(db_dish)
    db.commit()
    db.refresh(db_dish)

    for item in dish.ingredients:
        db_item = models.DishIngredient(
            dish_id=db_dish.id,
            product_id=item.product_id,
            weight_raw=item.weight_raw
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_dish)
    return db_dish

def update_dish(db: Session, dish_id: int, dish: schemas.DishCreate):
    db_dish = get_dish(db, dish_id)
    if not db_dish:
        return None

    # Update main fields
    db_dish.name = dish.name
    db_dish.cooked_weight = dish.cooked_weight
    db_dish.is_cooked_weight_auto = dish.is_cooked_weight_auto

    # Update ingredients: simpler to delete all and re-add
    db.query(models.DishIngredient).filter(models.DishIngredient.dish_id == dish_id).delete()

    for item in dish.ingredients:
        db_item = models.DishIngredient(
            dish_id=db_dish.id,
            product_id=item.product_id,
            weight_raw=item.weight_raw
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_dish)
    return db_dish

def delete_dish(db: Session, dish_id: int):
    db_dish = get_dish(db, dish_id)
    if db_dish:
        db.delete(db_dish)
        db.commit()

# Log Entry
def get_log_entries(db: Session, user_id: int, date: date):
    entries = db.query(models.LogEntry).filter(
        models.LogEntry.user_id == user_id,
        models.LogEntry.date == date
    ).all()
    return entries

def get_log_entry(db: Session, entry_id: int):
    return db.query(models.LogEntry).filter(models.LogEntry.id == entry_id).first()

def create_log_entry(db: Session, entry: schemas.LogEntryCreate):
    db_entry = models.LogEntry(
        user_id=entry.user_id,
        date=entry.date,
        meal_type=entry.meal_type,
        name=entry.name,
        cooked_weight=entry.cooked_weight,
        consumed_weight=entry.consumed_weight
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)

    for item in entry.items:
        db_item = models.LogEntryItem(
            log_entry_id=db_entry.id,
            product_id=item.product_id,
            weight_raw=item.weight_raw
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_entry)
    return db_entry

def update_log_entry(db: Session, entry_id: int, update: schemas.LogEntryUpdate):
    db_entry = get_log_entry(db, entry_id)
    if not db_entry:
        return None

    if update.meal_type is not None:
        db_entry.meal_type = update.meal_type

    if update.consumed_weight is not None:
        db_entry.consumed_weight = update.consumed_weight

    db.commit()
    db.refresh(db_entry)
    return db_entry

def delete_log_entry(db: Session, entry_id: int):
    db_entry = db.query(models.LogEntry).filter(models.LogEntry.id == entry_id).first()
    if db_entry:
        db.delete(db_entry)
        db.commit()
