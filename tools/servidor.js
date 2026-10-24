/* =========================================
   SERVIDOR LOCAL PARA TESTAR O SITE
   Uso: npm run dev  (monta o site e abre em http://localhost:8080)
   ========================================= */

const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const PORTA = process.env.PORT || 8080;
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.xml': 'application/xml', '.txt': 'text/plain', '.yml': 'text/yaml'
};

http.createServer((req, res) => {
  const caminho = decodeURIComponent(req.url.split('?')[0]);
  let arquivo = path.join(DIST, caminho);
  if (!arquivo.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(arquivo) && fs.statSync(arquivo).isDirectory()) arquivo = path.join(arquivo, 'index.html');

  if (!fs.existsSync(arquivo)) {
    res.writeHead(404, { 'Content-Type': TIPOS['.html'] });
    return res.end(fs.readFileSync(path.join(DIST, '404.html')));
  }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
  res.end(fs.readFileSync(arquivo));
}).listen(PORTA, () => console.log(`Site rodando em http://localhost:${PORTA}  (Ctrl+C para parar)`));
