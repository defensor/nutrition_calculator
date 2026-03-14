const fs = require('fs');
let file = fs.readFileSync('backend/main.py', 'utf8');

file = file.replace(
\`        weekly_stats.fat += pydantic_entry.total_fat or 0
        weekly_stats.carbs += pydantic_entry.total_carbs or 0

    return schemas.StatsResponse(daily=daily_stats, weekly=weekly_stats)\`,
\`        weekly_stats.fat += pydantic_entry.total_fat or 0
        weekly_stats.carbs += pydantic_entry.total_carbs or 0

    weekly_stats.kcal /= 7
    weekly_stats.protein /= 7
    weekly_stats.fat /= 7
    weekly_stats.carbs /= 7

    return schemas.StatsResponse(daily=daily_stats, weekly=weekly_stats)\`
);

fs.writeFileSync('backend/main.py', file);
