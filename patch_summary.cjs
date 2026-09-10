const fs = require('fs');
let code = fs.readFileSync('src/components/SummaryTab.tsx', 'utf8');

// Remove spes and appi from INFO_MODALS
code = code.replace(/spes:\s*{[\s\S]*?clinical:\s*'[^']*'\s*},/g, '');
code = code.replace(/appi:\s*{[\s\S]*?clinical:\s*'[^']*'\s*},/g, '');

// Remove sum variables
code = code.replace(/let sumSpes = 0;/g, '');
code = code.replace(/let sumAppi = 0;/g, '');

// Remove addition
code = code.replace(/sumSpes \+= stats\.spes;/g, '');
code = code.replace(/sumAppi \+= stats\.appi;/g, '');

// Remove avg calc
code = code.replace(/const avgSpes = .*?;/g, '');
code = code.replace(/const avgAppi = .*?;/g, '');

// Remove from PDF rows
code = code.replace(/\['SPES Médio', avgSpes\],/g, '');
code = code.replace(/\['APP Index \(APPI\)', avgAppi\],/g, '');

// Remove from clipboard text
code = code.replace(/• SPES Médio: \$\{avgSpes\}\\n/g, '');
code = code.replace(/• APP Index \(APPI\): \$\{avgAppi\}\\n/g, '');

// Remove StatCards
code = code.replace(/<StatCard\s*label="SPES Médio"\s*value={avgSpes}\s*infoKey="spes"\s*\/>/g, '');
code = code.replace(/<StatCard\s*label="APP Index \(APPI\)"\s*value={avgAppi}\s*infoKey="appi"\s*\/>/g, '');

// Also remove from PDF title if it has SPES
code = code.replace(/Madec Adaptado & SPES \(Pleurisia\)/g, 'Madec Adaptado & Pleurisia');

// There might be another place in PDF for SPES
code = code.replace(/<div className="border border-slate-300 p-4 rounded-xl bg-slate-50">\s*<span className="text-\[9px\] text-slate-500 font-black uppercase tracking-wider block">Índice SPES Médio<\/span>\s*<span className="text-xl font-black text-slate-950 mt-1 block">{avgSpes}<\/span>\s*<\/div>/g, '');
code = code.replace(/<div className="border border-slate-300 p-4 rounded-xl bg-slate-50">\s*<span className="text-\[9px\] text-slate-500 font-black uppercase tracking-wider block">APP Index \(APPI\)<\/span>\s*<span className="text-xl font-black text-slate-950 mt-1 block">{avgAppi}<\/span>\s*<\/div>/g, '');

fs.writeFileSync('src/components/SummaryTab.tsx', code);
