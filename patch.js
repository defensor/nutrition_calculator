const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/DiaryPage.jsx', 'utf8');

// replace the main return
file = file.replace(
  '  return (\n    <div className="space-y-6 pb-20">',
  `  const calendarDate = new Date(date);

  return (
    <div className="flex flex-col xl:flex-row gap-6 pb-20 items-start">
      {/* Left sidebar - Calendar and Stats */}
      <div className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-6 sticky top-4">
        {/* Calendar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Select Date</h2>
            <div className="flex justify-center">
              <Calendar
                  onChange={handleDateChange}
                  value={calendarDate}
                  className="mx-auto rounded-lg border-0 shadow-sm"
              />
            </div>
        </div>

        {/* Stats Placeholder */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <h2 className="text-xl font-bold mb-4 text-gray-800">Statistics</h2>
           <div className="space-y-4">
             {/* Stats will be injected here */}
             <div className="p-3 bg-gray-50 rounded-lg">
               <div className="text-sm font-semibold text-gray-600 mb-1">Daily Summary</div>
               <div className="grid grid-cols-2 gap-2 text-sm">
                 <div>Kcal: <span className="font-bold">{Math.round(totals.kcal)}</span></div>
                 <div>Protein: <span className="font-bold">{Math.round(totals.protein)}g</span></div>
                 <div>Fat: <span className="font-bold">{Math.round(totals.fat)}g</span></div>
                 <div>Carbs: <span className="font-bold">{Math.round(totals.carbs)}g</span></div>
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Main Content - Diary */}
      <div className="flex-1 w-full space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-center">
            <h2 className="text-2xl font-bold text-gray-800">Diary for {format(calendarDate, 'MMMM d, yyyy')}</h2>
            {/* The old date picker is optional now, but keeping it for manual entry can be useful */}
        </div>`
);

// remove the old header with date picker
file = file.replace(
`      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded shadow">
        <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Diary for</h2>
            <Input
                type="date"
                value={date}
                onChange={handleDateChange}
                className="w-40"
            />
        </div>
      </div>`,
''
);

// add closing div for the new layout wrapper
file = file.replace(
`        <div className="max-w-4xl mx-auto flex justify-between items-center">`,
`        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center">`
);

file = file.replace(
`      <Modal`,
`      </div>
      <Modal`
);


fs.writeFileSync('frontend/src/pages/DiaryPage.jsx', file);
