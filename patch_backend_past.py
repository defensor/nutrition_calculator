import os

with open('backend/main.py', 'r') as f:
    content = f.read()

target = """    # Calculate weekly stats
    # Monday is 0, Sunday is 6
    start_of_week = date_str - timedelta(days=date_str.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    weekly_entries = crud.get_log_entries_between(db, user_id=user_id, start_date=start_of_week, end_date=end_of_week)
    weekly_stats = schemas.DayStats(date=start_of_week, kcal=0, protein=0, fat=0, carbs=0) # Date field is start of week
    for e in weekly_entries:
        pydantic_entry = calculate_log_macros(e)
        weekly_stats.kcal += pydantic_entry.total_kcal or 0
        weekly_stats.protein += pydantic_entry.total_protein or 0
        weekly_stats.fat += pydantic_entry.total_fat or 0
        weekly_stats.carbs += pydantic_entry.total_carbs or 0

    weekly_stats.kcal /= 7
    weekly_stats.protein /= 7
    weekly_stats.fat /= 7
    weekly_stats.carbs /= 7

    return schemas.StatsResponse(daily=daily_stats, weekly=weekly_stats)"""

replacement = """    # Calculate weekly stats
    # Monday is 0, Sunday is 6
    start_of_week = date_str - timedelta(days=date_str.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    today = date.today()

    # We only want past days in this week (days < today)
    # The actual end date for our stats query/calc should be min(end_of_week, today - 1 day)
    calc_end_date = min(end_of_week, today - timedelta(days=1))

    weekly_stats = schemas.DayStats(date=start_of_week, kcal=0, protein=0, fat=0, carbs=0) # Date field is start of week

    past_days = (calc_end_date - start_of_week).days + 1

    if past_days > 0:
        weekly_entries = crud.get_log_entries_between(db, user_id=user_id, start_date=start_of_week, end_date=calc_end_date)
        for e in weekly_entries:
            pydantic_entry = calculate_log_macros(e)
            weekly_stats.kcal += pydantic_entry.total_kcal or 0
            weekly_stats.protein += pydantic_entry.total_protein or 0
            weekly_stats.fat += pydantic_entry.total_fat or 0
            weekly_stats.carbs += pydantic_entry.total_carbs or 0

        weekly_stats.kcal /= past_days
        weekly_stats.protein /= past_days
        weekly_stats.fat /= past_days
        weekly_stats.carbs /= past_days

    return schemas.StatsResponse(daily=daily_stats, weekly=weekly_stats)"""

content = content.replace(target, replacement)

with open('backend/main.py', 'w') as f:
    f.write(content)
