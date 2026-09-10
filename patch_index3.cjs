const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// I will just remove the entire error listener from index.html because it's causing issues.
// Vite will handle module loading natively.
code = code.replace(/window\.addEventListener\('error'[\s\S]*?\}, true\);/m, '');
// Also remove the styling and fallback-error div
code = code.replace(/<style>[\s\S]*?<\/style>/m, '');
code = code.replace(/<div id="fallback-error">[\s\S]*?<\/div>/m, '');

fs.writeFileSync('index.html', code);
