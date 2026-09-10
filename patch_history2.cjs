const fs = require('fs');
let code = fs.readFileSync('src/components/HistoryTab.tsx', 'utf8');

code = code.replace(/avgSpes:\s*number;/g, '');
code = code.replace(/<div className="text-\[8px\] font-bold text-slate-500 uppercase tracking-wider">SPES<\/div>\s*<div className="text-sm font-black text-white mt-0\.5">{record\.avgSpes\.toFixed\(2\)}<\/div>/g, '');

fs.writeFileSync('src/components/HistoryTab.tsx', code);
