@echo off
echo Demarrage de l'application Burger Social Club...

:: Definir le chemin du projet
set PROJECT_PATH=%~dp0

:: Ouvrir le navigateur avec la page de bypass
start "" "http://localhost:3000/bypass.html"

:: Demarrer le serveur Next.js
cd "%PROJECT_PATH%frontend"
npm run dev

echo Application demarree!