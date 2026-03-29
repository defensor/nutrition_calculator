import json
import sys
import os

# Add the current directory to sys.path so we can import from backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Product

# Example data block (can be replaced by loading from a file if needed)
data = [
  {"id": 1, "name": "Малина", "kcal": 52.0, "protein": 1.2, "fat": 0.6, "carbs": 11.9, "fiber": 6.5},
  {"id": 2, "name": "Банан", "kcal": 89.0, "protein": 1.1, "fat": 0.3, "carbs": 22.8, "fiber": 2.6},
  {"id": 3, "name": "Пэшн фрукт (мякоть)", "kcal": 97.0, "protein": 2.2, "fat": 0.7, "carbs": 23.3, "fiber": 10.4},
  {"id": 4, "name": "Желтый перец", "kcal": 27.0, "protein": 1.0, "fat": 0.2, "carbs": 6.3, "fiber": 0.9},
  {"id": 5, "name": "Красный перец", "kcal": 31.0, "protein": 1.0, "fat": 0.3, "carbs": 6.0, "fiber": 2.1},
  {"id": 6, "name": "Огурец (без кожуры)", "kcal": 12.0, "protein": 0.6, "fat": 0.1, "carbs": 2.2, "fiber": 0.5},
  {"id": 7, "name": "Помидоры черри", "kcal": 18.0, "protein": 0.9, "fat": 0.2, "carbs": 3.9, "fiber": 1.2},
]

def update_products():
    db = SessionLocal()
    try:
        updated_count = 0
        for item in data:
            product = db.query(Product).filter(Product.id == item["id"]).first()
            if product:
                product.name = item.get("name", product.name)
                product.kcal = item.get("kcal", product.kcal)
                product.protein = item.get("protein", product.protein)
                product.fat = item.get("fat", product.fat)
                product.carbs = item.get("carbs", product.carbs)
                product.fiber = item.get("fiber", product.fiber)
                updated_count += 1
            else:
                print(f"Product with id {item['id']} not found.")

        db.commit()
        print(f"Successfully updated {updated_count} products.")
    except Exception as e:
        print(f"Error updating products: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_products()
