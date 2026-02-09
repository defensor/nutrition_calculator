from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from enum import Enum

class MealType(str, Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"

# User
class UserBase(BaseModel):
    name: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

# Product
class ProductBase(BaseModel):
    name: str
    kcal: float
    protein: float
    fat: float
    carbs: float

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    class Config:
        from_attributes = True

# Dish
class DishIngredientBase(BaseModel):
    product_id: int
    weight_raw: float

class DishIngredientCreate(DishIngredientBase):
    pass

class DishIngredient(DishIngredientBase):
    id: int
    # Optionally include product details for display
    product: Optional[Product] = None

    class Config:
        from_attributes = True

class DishBase(BaseModel):
    name: str
    cooked_weight: Optional[float] = None
    is_cooked_weight_auto: bool = True

class DishCreate(DishBase):
    ingredients: List[DishIngredientCreate]

class Dish(DishBase):
    id: int
    ingredients: List[DishIngredient] = []

    class Config:
        from_attributes = True

# Log Entry
class LogEntryItemBase(BaseModel):
    product_id: int
    weight_raw: float

class LogEntryItemCreate(LogEntryItemBase):
    pass

class LogEntryItemUpdate(BaseModel):
    weight_raw: float

class LogEntryItem(LogEntryItemBase):
    id: int
    product: Optional[Product] = None

    class Config:
        from_attributes = True

class LogEntryBase(BaseModel):
    user_id: int
    date: date
    meal_type: MealType
    name: str
    cooked_weight: float
    consumed_weight: float

class LogEntryCreate(LogEntryBase):
    items: List[LogEntryItemCreate]

class LogEntryUpdate(BaseModel):
    meal_type: Optional[MealType] = None
    consumed_weight: Optional[float] = None
    # potentially other fields if we want to edit content, but drag-n-drop mainly needs meal_type

class LogEntry(LogEntryBase):
    id: int
    items: List[LogEntryItem] = []

    # Computed fields (optional, but useful for frontend)
    total_kcal: Optional[float] = None
    total_protein: Optional[float] = None
    total_fat: Optional[float] = None
    total_carbs: Optional[float] = None

    class Config:
        from_attributes = True
