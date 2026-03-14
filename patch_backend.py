import os

with open('backend/main.py', 'r') as f:
    content = f.read()

target = """        weekly_stats.fat += pydantic_entry.total_fat or 0
        weekly_stats.carbs += pydantic_entry.total_carbs or 0

    return schemas.StatsResponse(daily=daily_stats, weekly=weekly_stats)"""

replacement = """        weekly_stats.fat += pydantic_entry.total_fat or 0
        weekly_stats.carbs += pydantic_entry.total_carbs or 0

    weekly_stats.kcal /= 7
    weekly_stats.protein /= 7
    weekly_stats.fat /= 7
    weekly_stats.carbs /= 7

    return schemas.StatsResponse(daily=daily_stats, weekly=weekly_stats)"""

content = content.replace(target, replacement)

with open('backend/main.py', 'w') as f:
    f.write(content)
