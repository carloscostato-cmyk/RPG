# 🎲 RPG Virtual Table

> Mesa Virtual Completa e Responsiva para RPG de Mesa com Realtime, Mapa Interativo e Socket.io

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-white?logo=socket.io)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)](https://firebase.google.com/)
[![Konva.js](https://img.shields.io/badge/Konva.js-Mapa%20Interativo-green)](https://konvajs.org/)

---

## ✨ Funcionalidades

✅ **Realtime 100%** - Tudo sincronizado em tempo real via WebSocket
✅ **Salas com Código Único** - Compartilhe um código de 6 dígitos com os jogadores
✅ **Mapa Interativo Canvas** - Zoom, Pan, Grid Snap, Drag&Drop de Tokens
✅ **Fichas de Personagem** - Atributos, Inventário, Magias, Notas
✅ **Player de Áudio Sincronizado** - Mestre controla a playlist para todos
✅ **Timer de Turno** - Contador regressivo com alertas sonoros
✅ **Sistema de Permissões** - Mestre / Jogador com acessos granulares
✅ **Mobile First** - Funciona perfeitamente em celulares e tablets
✅ **PWA Offline** - Instale como aplicativo nativo
✅ **Dark / Light Mode** - Tema escuro e claro
✅ **Multi Idioma** - Português / Inglês

---

## 🚀 Instalação Rápida

### 1. Clone o repositório
```bash
git clone https://github.com/carloscostato-cmyk/RPG.git
cd RPG
```

### 2. Instale todas dependências
```bash
npm run install:all
```

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

✅ **Frontend:** http://localhost:5173  
✅ **Backend Socket.io:** http://localhost:3001

---

## 📂 Estrutura do Projeto

```
RPG/
├── 📁 frontend/          # React 18 + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/   # GameCanvas, CharacterSheet, MusicPlayer
│   │   ├── pages/        # LandingPage, GameRoom
│   │   ├── hooks/        # Custom Hooks
│   │   ├── types/        # TypeScript types
│   │   └── GameContext.tsx
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── 📁 backend/           # Node.js + Express + Socket.io
│   ├── src/
│   │   ├── sockets/      # Handlers de eventos
│   │   ├── controllers/  # Lógica de negócio
│   │   └── firebase.ts   # Integração Firestore
│   └── server.ts
│
├── 📁 shared/            # Tipos compartilhados Front/Back
├── 📁 .github/workflows/ # CI/CD GitHub Actions
├── .env.example          # Exemplo variáveis ambiente
├── package.json
└── README.md
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, React Router |
| **Realtime** | Socket.io WebSocket bidirecional |
| **Mapa** | Konva.js + React-Konva Canvas |
| **Banco** | Firebase Firestore + Storage + Auth |
| **Animações** | Framer Motion |
| **Ícones** | Lucide React |
| **Deploy** | Vercel (Frontend) + Railway (Backend) |
| **PWA** | Workbox + Vite Plugin PWA |

---

## 🎮 Funcionalidades Detalhadas

### 🗺️ Mapa Interativo
- Resolução 1920x1080 com grid 50px (1" padrão RPG)
- Zoom 0.25x até 4x com roda do mouse
- Pan com drag do mapa
- Snap automático ao grid ao mover tokens
- Camadas: Mapa > Tokens > Efeitos > Neblina de Guerra
- Suporte a 100+ tokens simultâneos

### 🧙‍♂️ Ficha de Personagem
- Abas: Atributos, Inventário, Magias, Notas
- Rolagem automática de dados
- HP / MP com barras visuais
- Upload de avatar
- Sync em tempo real

### 🎵 Player de Áudio
- Apenas o Mestre pode controlar
- Suporte a URLs YouTube / MP3
- Volume, Loop, Play/Pause
- Todos na sala ouvem a mesma música sincronizada
- Indicador visual "Tocando agora"

### ⏱️ Timer de Turno
- 60 segundos por jogador
- Alertas: 30s (amarelo), 10s (vermelho piscando + beep)
- Auto-avança turno após tempo esgotar
- Mestre pode estender tempo

---

## 📱 Responsividade

| Dispositivo | Suporte |
|-------------|---------|
| Desktop | ✅ Full |
| Tablet | ✅ Otimizado |
| Mobile | ✅ Touch Gestures |

✅ Pinch Zoom no mobile  
✅ Drag Pan com touch  
✅ Long press menu  
✅ FABs flutuantes  
✅ Timer sempre visível

---

## 🔒 Segurança

- HTTPS / WSS obrigatório em produção
- Firebase Auth anônimo com custom tokens
- Rate Limiting no Socket.io
- Firebase Security Rules
- Validação de permissões no backend
- Sem dados sensíveis no cliente

---

## 🚀 Deploy

### Frontend na Vercel
```bash
cd frontend
npm run build
```
Conecte o repositório no [Vercel](https://vercel.com) e ele deploya automaticamente.

### Backend no Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

### Firebase
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Habilite Firestore, Storage e Authentication anônimo
3. Cole as credenciais no arquivo `.env`
4. Adicione as Security Rules do arquivo `firebase.rules`

---

## 📋 Scripts Disponíveis

| Comando | Ação |
|---------|------|
| `npm run dev` | Inicia Frontend + Backend em desenvolvimento |
| `npm run build` | Builda todo o projeto para produção |
| `npm run preview` | Preview do build de produção |
| `npm run start` | Inicia servidor backend em produção |
| `npm run install:all` | Instala dependências de todos os pacotes |

---

## 🎯 Roadmap Futuro

- [ ] Chat integrado
- [ ] Rolagem de dados visual com animação
- [ ] Macro de ações
- [ ] Biblioteca de tokens publica
- [ ] Importar mapas prontos
- [ ] Sistema de convites
- [ ] Log de combate
- [ ] Integração D&D Beyond

---

## 📄 Licença

MIT - Livre para uso pessoal e comercial.

---

> ✨ **Mesa Virtual RPG foi feito com ❤️ para jogadores de RPG por jogadores de RPG.**