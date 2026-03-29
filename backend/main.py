from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Generator, Optional
from datetime import date, timedelta

import crud, models, schemas
from database import SessionLocal, engine

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

# Dependency
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper to calculate macros
NUTRIENTS = ['kcal', 'protein', 'fat', 'carbs', 'fiber']

def calculate_log_macros(entry: models.LogEntry) -> schemas.LogEntry:
    totals = {n: 0.0 for n in NUTRIENTS}

    if entry.cooked_weight > 0:
        ratio = entry.consumed_weight / entry.cooked_weight

        for item in entry.items:
            # item.product is loaded via relationship
            if item.product:
                p = item.product
                # item.weight_raw is the raw weight used in the whole batch
                # nutrients are per 100g
                factor = (item.weight_raw * ratio) / 100.0

                for n in NUTRIENTS:
                    totals[n] += getattr(p, n, 0.0) * factor

    pydantic_entry = schemas.LogEntry.model_validate(entry)
    for n in NUTRIENTS:
        setattr(pydantic_entry, f'total_{n}', round(totals[n], 1))

    return pydantic_entry


def add_macros_to_stats(stats: schemas.DayStats, entry: schemas.LogEntry):
    for n in NUTRIENTS:
        val = getattr(entry, f'total_{n}', 0)
        current = getattr(stats, n, 0)
        setattr(stats, n, current + (val or 0))

# Users
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_user(db=db, user=user)
    except Exception as e:
        if "UNIQUE constraint failed" in str(e) or "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="User already exists")
        raise e

@app.get("/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: Optional[int] = None, db: Session = Depends(get_db)):
    users = crud.get_users(db)
    return users

# Products
@app.post("/products/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_product(db=db, product=product)
    except Exception as e:
        if "UNIQUE constraint failed" in str(e) or "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Product with this name already exists")
        raise e

@app.get("/products/", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: Optional[int] = None, db: Session = Depends(get_db)):
    products = crud.get_products(db, skip=skip, limit=limit)
    return products

@app.put("/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product: schemas.ProductCreate, db: Session = Depends(get_db)):
    try:
        return crud.update_product(db=db, product_id=product_id, product=product)
    except Exception as e:
        if "UNIQUE constraint failed" in str(e) or "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Product with this name already exists")
        raise e

@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    success = crud.delete_product(db, product_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot delete product used in dishes or logs")
    return {"ok": True}

# Dishes
@app.post("/dishes/", response_model=schemas.Dish)
def create_dish(dish: schemas.DishCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_dish(db=db, dish=dish)
    except Exception as e:
        if "UNIQUE constraint failed" in str(e) or "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Dish with this name already exists")
        raise e

@app.get("/dishes/", response_model=List[schemas.Dish])
def read_dishes(skip: int = 0, limit: Optional[int] = None, db: Session = Depends(get_db)):
    dishes = crud.get_dishes(db, skip=skip, limit=limit)
    return dishes

@app.put("/dishes/{dish_id}", response_model=schemas.Dish)
def update_dish(dish_id: int, dish: schemas.DishCreate, db: Session = Depends(get_db)):
    try:
        updated_dish = crud.update_dish(db=db, dish_id=dish_id, dish=dish)
        if updated_dish is None:
            raise HTTPException(status_code=404, detail="Dish not found")
        return updated_dish
    except Exception as e:
        if "UNIQUE constraint failed" in str(e) or "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Dish with this name already exists")
        raise e

@app.delete("/dishes/{dish_id}")
def delete_dish(dish_id: int, db: Session = Depends(get_db)):
    crud.delete_dish(db, dish_id)
    return {"ok": True}

# Logs
@app.post("/logs/", response_model=schemas.LogEntry)
def create_log_entry(entry: schemas.LogEntryCreate, db: Session = Depends(get_db)):
    db_entry = crud.create_log_entry(db=db, entry=entry)
    return calculate_log_macros(db_entry)

@app.get("/logs/{date_str}", response_model=List[schemas.LogEntry])
def read_log_entries(date_str: date, user_id: int, db: Session = Depends(get_db)):
    entries = crud.get_log_entries(db, user_id=user_id, date=date_str)
    return [calculate_log_macros(e) for e in entries]

@app.put("/logs/{entry_id}", response_model=schemas.LogEntry)
def update_log_entry(entry_id: int, update: schemas.LogEntryUpdate, db: Session = Depends(get_db)):
    db_entry = crud.update_log_entry(db, entry_id, update)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return calculate_log_macros(db_entry)

@app.delete("/logs/{entry_id}")
def delete_log_entry(entry_id: int, db: Session = Depends(get_db)):
    crud.delete_log_entry(db, entry_id)
    return {"ok": True}

@app.post("/logs/{entry_id}/items", response_model=schemas.LogEntry)
def add_log_entry_item(entry_id: int, item: schemas.LogEntryItemCreate, db: Session = Depends(get_db)):
    crud.add_log_entry_item(db, entry_id, item)
    db_entry = crud.get_log_entry(db, entry_id)
    return calculate_log_macros(db_entry)

@app.put("/log-items/{item_id}", response_model=schemas.LogEntry)
def update_log_entry_item(item_id: int, update: schemas.LogEntryItemUpdate, db: Session = Depends(get_db)):
    db_item = crud.update_log_entry_item(db, item_id, update)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    db_entry = crud.get_log_entry(db, db_item.log_entry_id)
    return calculate_log_macros(db_entry)

@app.delete("/log-items/{item_id}", response_model=schemas.LogEntry)
def delete_log_entry_item(item_id: int, db: Session = Depends(get_db)):
    # Get entry id before delete to return updated entry
    db_item = db.query(models.LogEntryItem).filter(models.LogEntryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    entry_id = db_item.log_entry_id

    crud.delete_log_entry_item(db, item_id)

    db_entry = crud.get_log_entry(db, entry_id)
    return calculate_log_macros(db_entry)


@app.get("/stats/{date_str}", response_model=schemas.StatsResponse)
def read_stats(date_str: date, user_id: int, db: Session = Depends(get_db)):
    # Calculate daily stats
    daily_entries = crud.get_log_entries(db, user_id=user_id, date=date_str)
    daily_stats = schemas.DayStats(date=date_str, kcal=0, protein=0, fat=0, carbs=0, fiber=0)
    for e in daily_entries:
        pydantic_entry = calculate_log_macros(e)
        add_macros_to_stats(daily_stats, pydantic_entry)

    # Calculate weekly stats
    # Monday is 0, Sunday is 6
    start_of_week = date_str - timedelta(days=date_str.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    today = date.today()

    # We only want past days in this week (days < today)
    # The actual end date for our stats query/calc should be min(end_of_week, today - 1 day)
    calc_end_date = min(end_of_week, today - timedelta(days=1))

    weekly_stats = schemas.DayStats(date=start_of_week, kcal=0, protein=0, fat=0, carbs=0, fiber=0) # Date field is start of week

    past_days = (calc_end_date - start_of_week).days + 1

    if past_days > 0:
        weekly_entries = crud.get_log_entries_between(db, user_id=user_id, start_date=start_of_week, end_date=calc_end_date)
        for e in weekly_entries:
            pydantic_entry = calculate_log_macros(e)
            add_macros_to_stats(weekly_stats, pydantic_entry)

        for n in NUTRIENTS:
            current = getattr(weekly_stats, n, 0)
            setattr(weekly_stats, n, current / past_days)

    return schemas.StatsResponse(daily=daily_stats, weekly=weekly_stats)
