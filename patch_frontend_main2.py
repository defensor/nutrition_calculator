with open('frontend/src/pages/DiaryPage.jsx', 'r') as f:
    content = f.read()

content = content.replace("  };\n  };\n\n  const totals", "  };\n\n  const totals")

with open('frontend/src/pages/DiaryPage.jsx', 'w') as f:
    f.write(content)
