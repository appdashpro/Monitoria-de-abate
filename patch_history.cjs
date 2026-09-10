const fs = require('fs');
let code = fs.readFileSync('src/components/HistoryTab.tsx', 'utf8');

code = code.replace(/let sumSpes = 0;/g, '');
code = code.replace(/sumSpes \+= stats\.spes;/g, '');
code = code.replace(/const avgSpes = .*?;/g, '');
code = code.replace(/avgSpes,/g, '');

fs.writeFileSync('src/components/HistoryTab.tsx', code);
