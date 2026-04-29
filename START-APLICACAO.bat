@echo off
setlocal
echo =============================================
echo 🎲 INICIANDO MESA VIRTUAL RPG
echo =============================================

set "ROOT_DIR=C:\Projects\RPG"
if not exist "%ROOT_DIR%" set "ROOT_DIR=%~dp0"

echo.
echo 📁 Pasta do projeto: %ROOT_DIR%
cd /d "%ROOT_DIR%"

echo.
echo 🟢 INICIANDO SERVIDOR BACKEND...
if not exist "%ROOT_DIR%\backend\node_modules" (
	echo 📦 Instalando dependencias do backend...
	cd /d "%ROOT_DIR%\backend" && npm install
)
start "RPG Backend" cmd /k "cd /d %ROOT_DIR%\backend && node src/server-simple.js"

timeout /t 3 /nobreak >nul

echo.
echo 🟢 INICIANDO FRONTEND...
if not exist "%ROOT_DIR%\frontend\node_modules" (
	echo 📦 Instalando dependencias do frontend...
	cd /d "%ROOT_DIR%\frontend" && npm install
)
start "RPG Frontend" cmd /k "cd /d %ROOT_DIR%\frontend && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ✅ APLICACAO INICIADA!
echo ✅ Backend: http://localhost:3001
echo ✅ Frontend: http://localhost:5173
echo.
echo Abra o navegador no endereço acima.
echo =============================================
pause