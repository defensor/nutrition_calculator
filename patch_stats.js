const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/DiaryPage.jsx', 'utf8');

// add state for stats
file = file.replace(
  '  const [logs, setLogs] = useState([]);',
  '  const [logs, setLogs] = useState([]);\n  const [stats, setStats] = useState(null);'
);

// update fetchLogs to also fetch stats
file = file.replace(
`  const fetchLogs = async () => {
    try {
      const data = await api.getLogs(date, currentUser);
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    }
  };`,
`  const fetchLogs = async () => {
    try {
      const data = await api.getLogs(date, currentUser);
      setLogs(data);
      const statsData = await api.getStats(date, currentUser);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    }
  };`
);

// replace the stats placeholder in the render
const statsPlaceholder = `           <div className="space-y-4">
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
           </div>`;

const newStats = `           {stats && (
             <div className="space-y-4">
               <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                 <div className="text-sm font-semibold text-blue-800 mb-2">Day ({format(new Date(stats.daily.date), 'MMM d')})</div>
                 <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-gray-700">
                   <div>Kcal: <span className="font-bold text-gray-900">{Math.round(stats.daily.kcal)}</span></div>
                   <div>Protein: <span className="font-bold text-gray-900">{Math.round(stats.daily.protein)}g</span></div>
                   <div>Fat: <span className="font-bold text-gray-900">{Math.round(stats.daily.fat)}g</span></div>
                   <div>Carbs: <span className="font-bold text-gray-900">{Math.round(stats.daily.carbs)}g</span></div>
                 </div>
               </div>

               <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                 <div className="text-sm font-semibold text-green-800 mb-2">Week</div>
                 <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-gray-700">
                   <div>Kcal: <span className="font-bold text-gray-900">{Math.round(stats.weekly.kcal)}</span></div>
                   <div>Protein: <span className="font-bold text-gray-900">{Math.round(stats.weekly.protein)}g</span></div>
                   <div>Fat: <span className="font-bold text-gray-900">{Math.round(stats.weekly.fat)}g</span></div>
                   <div>Carbs: <span className="font-bold text-gray-900">{Math.round(stats.weekly.carbs)}g</span></div>
                 </div>
               </div>
             </div>
           )}`;

file = file.replace(statsPlaceholder, newStats);

fs.writeFileSync('frontend/src/pages/DiaryPage.jsx', file);
