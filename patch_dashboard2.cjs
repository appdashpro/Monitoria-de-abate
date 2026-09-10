const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardTab.tsx', 'utf8');

code = code.replace(/avgSpes:\s*number;/g, '');

fs.writeFileSync('src/components/DashboardTab.tsx', code);
