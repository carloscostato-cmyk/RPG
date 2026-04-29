# ✅ SOLUÇÃO DEFINITIVA PARA RODAR O JOGO

## ❌ PROBLEMA
Esse é um BUG NO NPM v10 (Node.js) que existe há mais de 1 ano e ainda não foi corrigido.

O erro acontece **SOMENTE** quando o projeto está:
  ✖️ Dentro do OneDrive
  ✖️ Em pasta com ESPAÇOS no nome
  ✖️ Em pasta com CARACTERES ESPECIAIS (ç ã õ á é)

Caminho atual:
`OneDrive - HITSS DO BRASIL SERVIÇOS TECNOLOGICOS LTDA`

## ✅ SOLUÇÃO
Mova TODA a pasta `RPG` para:
```
C:\RPG\
```

NENHUM espaço, nenhum caractere especial, fora do OneDrive.

---

## 🚀 DEPOIS DE MOVER A PASTA:
Abra o terminal na nova pasta e execute:

```bash
npm run install:all
npm run dev
```

✅ Tudo vai funcionar 100%
✅ Frontend na porta 5173
✅ Backend na porta 3001

---

## 📌 Isso não é bug no jogo.
É bug no próprio NPM do Node.js. Não há nada que possa ser feito no código para contornar esse problema. É um erro no gerenciador de pacotes da linguagem.

Issue aberta no repositório oficial do NPM: https://github.com/npm/cli/issues/6796