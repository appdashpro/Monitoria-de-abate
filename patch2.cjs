const fs = require('fs');
let code = fs.readFileSync('src/components/SummaryTab.tsx', 'utf8');

// Remove avgSpes and avgAppi string template lines
code = code.replace(/• SPES Médio: \$\{avgSpes\}\n/g, '');
code = code.replace(/• APP Index \(APPI\): \$\{avgAppi\}\n/g, '');

// Remove the StatCard for APP Index completely (looks like the first one didn't catch because it was multiline or had extra props like subText)
code = code.replace(/<StatCard\s+label="APP Index \(APPI\)"[\s\S]*?\/>/g, '');

// Remove getAPIndexClassification import
code = code.replace(/,\s*getAPIndexClassification/g, '');

fs.writeFileSync('src/components/SummaryTab.tsx', code);
