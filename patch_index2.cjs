const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const newErrorScript = `
      window.addEventListener('error', function(e) {
        if (!e.message && !(e instanceof ErrorEvent)) {
          var target = e.target || e.srcElement;
          var isScript = target && target.tagName === 'SCRIPT';
          
          // Only treat SCRIPT load failures as fatal at the global level
          if (!isScript) {
            return; 
          }
          
          var src = target.src || '';
          if (src && src.indexOf('chrome-extension') !== -1) return;
        }

        var el = document.getElementById('fallback-error');
        var root = document.getElementById('root');
        var msg = document.getElementById('error-msg');
        
        if (el) {
          el.style.display = 'block';
          
          if (e.message && e.message.includes('Unexpected token')) {
            msg.innerHTML = '<strong>O código fonte não foi compilado.</strong><br/><br/>O GitHub Pages está tentando ler arquivos TypeScript (.tsx) diretamente, mas os navegadores não suportam isso. Este é um projeto React + Vite.<br/><br/><strong>Solução:</strong><br/>No repositório, vá em <em>Settings > Pages > Source</em> e mude para <strong>GitHub Actions</strong>.';
          } else {
            var errorText = e.message || 'Falha ao carregar script do aplicativo.';
            if (!e.message && e.target) {
               var t = e.target || e.srcElement;
               errorText = 'Falha ao carregar script: ' + (t.src || 'desconhecido');
            }
            msg.textContent = errorText + ' ' + (e.error ? e.error.stack : '');
          }
        }
        if (root) root.style.display = 'none';
      }, true);
`;

code = code.replace(/window\.addEventListener\('error', function\(e\) \{[\s\S]*?\}, true\);/m, newErrorScript.trim());

fs.writeFileSync('index.html', code);
