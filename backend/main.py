from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import date

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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper to calculate macros
def calculate_log_macros(entry: models.LogEntry) -> schemas.LogEntry:
    total_kcal = 0.0
    total_protein = 0.0
    total_fat = 0.0
    total_carbs = 0.0

    if entry.cooked_weight > 0:
        ratio = entry.consumed_weight / entry.cooked_weight

        for item in entry.items:
            # item.product is loaded via relationship
            if item.product:
                p = item.product
                # item.weight_raw is the raw weight used in the whole batch
                # nutrients are per 100g
                factor = (item.weight_raw * ratio) / 100.0

                total_kcal += p.kcal * factor
                total_protein += p.protein * factor
                total_fat += p.fat * factor
                total_carbs += p.carbs * factor

    pydantic_entry = schemas.LogEntry.model_validate(entry)
    pydantic_entry.total_kcal = round(total_kcal, 1)
    pydantic_entry.total_protein = round(total_protein, 1)
    pydantic_entry.total_fat = round(total_fat, 1)
    pydantic_entry.total_carbs = round(total_carbs, 1)

    return pydantic_entry

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
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
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
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
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
def read_dishes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
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
