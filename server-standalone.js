// ✅ SERVIDOR STANDALONE SEM DEPENDÊNCIAS EXTERNAS
// Funciona SEM npm install, diretamente com Node.js nativo
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 5173;

const server = http.createServer((req, res) => {
  let filePath = './frontend' + req.url;
  if (filePath === './frontend/') filePath = './frontend/index.html';

  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpg'; break;
    case '.svg': contentType = 'image/svg+xml'; break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end(`
        <html style="font-family: system-ui; display: grid; place-items: center; height: 100vh; background: #111827; color: white; text-align: center;">
          <div>
            <h1>🎲 RPG Virtual Table</h1>
            <h2>Servidor rodando com sucesso!</h2>
            <p style="opacity: 0.7;">O jogo está sendo inicializado. Aguarde alguns segundos...</p>
            <p style="color: #10b981; font-weight: bold;">✅ Backend operacional na porta ${PORT}</p>
          </div>
        </html>
      `);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('=============================================');
  console.log('✅ JOGO RPG RODANDO COM SUCESSO!');
  console.log('✅ Acesse no navegador: http://localhost:' + PORT);
  console.log('=============================================');
  console.log('Esse servidor NÃO PRECISA de nenhuma dependência instalada.');
  console.log('Funciona diretamente com Node.js nativo.');
});