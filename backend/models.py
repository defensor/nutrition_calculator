from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Date, Enum
from sqlalchemy.orm import relationship
import enum

from database import Base

class MealType(str, enum.Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    logs = relationship("LogEntry", back_populates="user")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    kcal = Column(Float, default=0.0)
    protein = Column(Float, default=0.0)
    fat = Column(Float, default=0.0)
    carbs = Column(Float, default=0.0)

class Dish(Base):
    __tablename__ = "dishes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    cooked_weight = Column(Float, nullable=True) # If null, use sum of ingredients
    is_cooked_weight_auto = Column(Boolean, default=True)

    ingredients = relationship("DishIngredient", back_populates="dish", cascade="all, delete-orphan")

class DishIngredient(Base):
    __tablename__ = "dish_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    dish_id = Column(Integer, ForeignKey("dishes.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    weight_raw = Column(Float)

    dish = relationship("Dish", back_populates="ingredients")
    product = relationship("Product")

class LogEntry(Base):
    __tablename__ = "log_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date, index=True)
    meal_type = Column(String) # Stored as string, validated via Pydantic or Enum
    name = Column(String) # Name of the entry (e.g. "Apple" or "Borscht")

    cooked_weight = Column(Float) # Total weight of the prepared batch
    consumed_weight = Column(Float) # Weight consumed by user

    user = relationship("User", back_populates="logs")
    items = relationship("LogEntryItem", back_populates="log_entry", cascade="all, delete-orphan")

class LogEntryItem(Base):
    __tablename__ = "log_entry_items"

    id = Column(Integer, primary_key=True, index=True)
    log_entry_id = Column(Integer, ForeignKey("log_entries.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    weight_raw = Column(Float) # Raw weight of this ingredient in the *whole* batch

    log_entry = relationship("LogEntry", back_populates="items")
    product = relationship("Product")
