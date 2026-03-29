import os

with open('backend/main.py', 'r') as f:
    content = f.read()

# Refactor calculate_log_macros
new_calculate_log_macros = """
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
"""

import re
content = re.sub(
    r"def calculate_log_macros\(entry: models\.LogEntry\) -> schemas\.LogEntry:.*?return pydantic_entry",
    new_calculate_log_macros.strip(),
    content,
    flags=re.DOTALL
)

# Helper function
helper_str = """
def add_macros_to_stats(stats: schemas.DayStats, entry: schemas.LogEntry):
    for n in NUTRIENTS:
        val = getattr(entry, f'total_{n}', 0)
        current = getattr(stats, n, 0)
        setattr(stats, n, current + (val or 0))
"""

content = content.replace(
    '# Users\n@app.post',
    helper_str + '\n# Users\n@app.post'
)

# Refactor read_stats
new_read_stats_1 = """
    daily_stats = schemas.DayStats(date=date_str, kcal=0, protein=0, fat=0, carbs=0, fiber=0)
    for e in daily_entries:
        pydantic_entry = calculate_log_macros(e)
        add_macros_to_stats(daily_stats, pydantic_entry)
"""
content = re.sub(
    r"    daily_stats = schemas\.DayStats\(date=date_str, kcal=0, protein=0, fat=0, carbs=0, fiber=0\).*?        daily_stats\.fiber \+= pydantic_entry\.total_fiber or 0",
    new_read_stats_1.strip(),
    content,
    flags=re.DOTALL
)

new_read_stats_2 = """
        for e in weekly_entries:
            pydantic_entry = calculate_log_macros(e)
            add_macros_to_stats(weekly_stats, pydantic_entry)

        for n in NUTRIENTS:
            current = getattr(weekly_stats, n, 0)
            setattr(weekly_stats, n, current / past_days)
"""

content = re.sub(
    r"        for e in weekly_entries:.*?        weekly_stats\.fiber /= past_days",
    new_read_stats_2.strip(),
    content,
    flags=re.DOTALL
)

with open('backend/main.py', 'w') as f:
    f.write(content)
