# Imaginary tables

Mesa virtual para RPG com React, Socket.io, mapa em canvas, fichas, dados, chat, timer e player de audio por sala.


---

## ▶️ COMEÇAR A JOGAR AGORA

**Windows:** Dê duplo clique em [JOGAR.bat](./JOGAR.bat) na pasta raiz do projeto.

**Mac/Linux:** Execute `npm run dev` na raiz e abra http://localhost:5173 no navegador.

---

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-white?logo=socket.io)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)](https://firebase.google.com/)
[![Konva.js](https://img.shields.io/badge/Konva.js-Mapa%20Interativo-green)](https://konvajs.org/)

## Status

**Play online:** [https://darling-snickerdoodle-b65b12.netlify.app](https://darling-snickerdoodle-b65b12.netlify.app)

### Pronto
- Criar sala com código único.
- Entrar em sala com múltiplos jogadores.
- Backend como fonte oficial do estado da mesa.
- Sincronização realtime de jogadores, tokens, fichas, timer, dados, chat e música.
- Permissões básicas de mestre e jogador.
- Persistência local em `backend/data/rooms.json`.
- Build de frontend e backend.
- Atalho Windows atualizado para usar o backend oficial.

### Parcial
- Player de música suporta URLs diretas de áudio MP3/stream. YouTube não é suportado como URL simples.
- PWA gera service worker, mas o modo offline ainda não cobre jogo realtime.
- Upload de imagens funciona via URL. Upload para Storage ainda não está conectado.

### Roadmap
- Persistencia Firestore/Storage em producao.
- Autenticacao Firebase.
- Testes automatizados de integracao Socket.io com multiplos clientes.
- Biblioteca de mapas/tokens.
- Logs de auditoria e painel administrativo.

## Requisitos

- Node.js 20 ou superior.
- npm 10 ou superior.

## Instalar

```bash
npm install
```

## Rodar em desenvolvimento

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais do Firebase
```

### GitHub / CI secrets

- Add `RAILWAY_API_TOKEN` in GitHub: Repository → Settings → Secrets and variables → Actions → New repository secret.
- The `railway-deploy.yml` workflow uses `RAILWAY_API_TOKEN` to login and deploy; **do not** commit tokens to the repo.
- If you exposed a token, revoke it in Railway and create a new one.

Example: to trigger CI after adding the secret locally:
```bash
git commit --allow-empty -m "trigger CI"
git push origin main
```

### 4. Inicie o ambiente de desenvolvimento

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Healthcheck: http://localhost:3001/health

## 🎮 Como abrir e jogar

Se você quiser iniciar sem lembrar comandos, use o arquivo `START-APLICACAO.bat` na pasta raiz do projeto.

Passo a passo:
1. Dê duplo clique em `START-APLICACAO.bat`.
2. Aguarde as janelas do backend e do frontend abrirem.
3. Abra o navegador em http://localhost:5173.
4. Entre na sala ou crie uma nova e comece a jogar.

Esse arquivo usa `C:\Projects\RPG` quando disponível e só instala dependências na primeira execução.

---
No Windows, também é possível abrir `JOGAR.bat`.


## Build e testes

```bash
npm test
npm run build
```

`npm test` executa typecheck do backend e frontend. `npm run build` compila o backend TypeScript e gera o build Vite do frontend.

## Variaveis de ambiente

Crie `.env` a partir de `.env.example`.

Principais variaveis:

- `PORT`: porta do backend. Padrao: `3001`.
- `FRONTEND_URL`: origem aceita pelo CORS. Padrao local: `http://localhost:5173`.
- `VITE_BACKEND_URL`: URL do backend usada pelo frontend.
- `DATA_DIR`: pasta da persistencia local. Padrao: `data`.
- `ROOM_TTL_HOURS`: horas para limpeza de salas inativas. Padrao: `24`.

## 🪟 Atalho no Windows

Se estiver no Windows, o jeito mais simples é manter o projeto em `C:\Projects\RPG` e usar o atalho:

```bat
START-APLICACAO.bat
```

---
As variáveis Firebase permanecem documentadas para a próxima etapa de persistência em nuvem.


## Deploy

### Frontend

```bash
npm run build:frontend
```

Publique `frontend/dist` em Vercel, GitHub Pages ou outro hosting estatico. Configure `VITE_BACKEND_URL` apontando para o backend publico.

### Backend

```bash
npm run build:backend
npm start
```

Configure `FRONTEND_URL` com a URL publica do frontend para evitar CORS aberto.

### Docker

```bash
docker build -t rpg-virtual-table .
docker run -p 3001:3001 --env FRONTEND_URL=http://localhost:5173 rpg-virtual-table
```

## Backlog Priorizado

### P0
- Manter build e typecheck verdes.
- Garantir realtime basico de sala, tokens, ficha, timer, dados e chat.
- Evitar servidor paralelo ou scripts divergentes.

### P1
- Substituir persistencia local por Firestore.
- Conectar Firebase Storage para mapas, avatares e tokens.
- Fortalecer validacao de payloads e rate limit por usuario/sala.

### P2
- Melhorar editor de mapa, fog of war e camadas.
- Expandir ficha por sistema de RPG.
- Adicionar macros e rolagens privadas reais.

### P3
- Polimento visual.
- Internacionalizacao completa.
- Otimizacao de bundle e code splitting.
