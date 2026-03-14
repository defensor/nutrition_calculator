const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/DiaryPage.jsx', 'utf8');

file = file.replace(
"  const handleDateChange = (newDate) => {\n      navigate(`/diary/${e.target.value}`);\n  };",
"  const handleDateChange = (newDate) => {\n      navigate(`/diary/${format(newDate, 'yyyy-MM-dd')}`);\n  };"
);

fs.writeFileSync('frontend/src/pages/DiaryPage.jsx', file);
