const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardTab.tsx', 'utf8');

// Remove spes logic
code = code.replace(/,\s*getAPIndexClassification/g, '');
code = code.replace(/let sumSpes = 0;/g, '');
code = code.replace(/sumSpes \+= stats\.spes;/g, '');
code = code.replace(/const avgSpes = .*?;/g, '');
code = code.replace(/avgSpes:\s*Number\(avgSpes\.toFixed\(2\)\)/g, '');

// Rename chart
code = code.replace(/Índice SPES \(Pleurisia Média\)/g, 'Prevalência de Pleurisia (%)');
code = code.replace(/<Bar dataKey="avgSpes" name="SPES Médio" radius={\[4, 4, 0, 0\]}>[\s\S]*?<\/Bar>/g, `<Bar dataKey="prevPleurisy" name="Pleurisia (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />`);

fs.writeFileSync('src/components/DashboardTab.tsx', code);
