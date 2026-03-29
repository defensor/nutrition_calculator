import re

with open('frontend/src/pages/DiaryPage.jsx', 'r') as f:
    content = f.read()

# Define MACROS constant and calculate function
macros_code = """
  const MACROS = ['kcal', 'protein', 'fat', 'fiber', 'carbs'];

  const calculateMacrosSum = (logsArray) => {
    return logsArray.reduce((acc, log) => {
      MACROS.forEach(m => {
        acc[m] = acc[m] + (log[`total_${m}`] || 0);
      });
      return acc;
    }, { kcal: 0, protein: 0, fat: 0, fiber: 0, carbs: 0 });
  };
"""

content = content.replace(
    'const getDayTotals = () => {',
    macros_code + '\n  const getDayTotals = () => {\n    return calculateMacrosSum(logs);\n  };'
)

# Remove old getDayTotals body
content = re.sub(
    r"return calculateMacrosSum\(logs\);\n  };\n    return logs\.reduce\(\(acc, log\) => \(\{[\s\S]*?\}\), \{ kcal: 0, protein: 0, fat: 0, fiber: 0, carbs: 0 \}\);",
    "return calculateMacrosSum(logs);\n  };",
    content
)

# Replace mealTotals calculation
content = re.sub(
    r"const mealTotals = mealLogs\.reduce\(\(acc, log\) => \(\{[\s\S]*?\}\), \{ kcal: 0, protein: 0, fat: 0, fiber: 0, carbs: 0 \}\);",
    "const mealTotals = calculateMacrosSum(mealLogs);",
    content
)

with open('frontend/src/pages/DiaryPage.jsx', 'w') as f:
    f.write(content)
