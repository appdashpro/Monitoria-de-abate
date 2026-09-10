const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const newErrorScript = `
      window.addEventListener('error', function(e) {
        // Ignore resource loading errors (like images, favicons, etc)
        // If it's a resource error, e instanceof ErrorEvent is false
        // and e.message is undefined.
        if (!e.message && !(e instanceof ErrorEvent)) {
          // It's a resource load error (e.g. script, link, img 404)
          var target = e.target || e.srcElement;
          var isCritical = target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK');
          
          if (!isCritical) {
            // Silently ignore non-critical resource errors (e.g. missing favicon)
            return;
          }
          
          // For critical resources, we might want to show a warning,
          // but let's avoid false positives that take down the app.
          // In some environments, extensions cause these.
          // Let's only show error if it's our own script.
          var src = target.src || target.href || '';
          if (src && src.indexOf('chrome-extension') !== -1) return;
        }

        var el = document.getElementById('fallback-error');
        var root = document.getElementById('root');
        var msg = document.getElementById('error-msg');
        
        if (el) {
          el.style.display = 'block';
          
          if (e.message && e.message.includes('Unexpected token')) {
            msg.innerHTML = '<strong>O código fonte não foi compilado.</strong><br/><br/>O GitHub Pages está tentando ler arquivos TypeScript (.tsx) diretamente...';
          } else {
            var errorText = e.message || 'Falha ao carregar recurso crítico do aplicativo.';
            if (!e.message && e.target) {
               var t = e.target || e.srcElement;
               errorText = 'Falha ao carregar arquivo: ' + (t.src || t.href || t.tagName);
            }
            msg.textContent = errorText + ' ' + (e.error ? e.error.stack : '');
          }
        }
        if (root) root.style.display = 'none';
      }, true);
`;

code = code.replace(/window\.addEventListener\('error', function\(e\) \{[\s\S]*?\}, true\);/m, newErrorScript.trim());

fs.writeFileSync('index.html', code);
