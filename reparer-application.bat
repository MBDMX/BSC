@echo off
echo ===================================================
echo REPARATION DE L'APPLICATION BURGER SOCIAL CLUB
echo ===================================================
echo.

echo Etape 1: Verification des processus en cours...
tasklist | findstr "node.exe"
echo.

echo Etape 2: Arret des processus node.exe en cours...
taskkill /F /IM node.exe
echo.

echo Etape 3: Navigation vers le dossier frontend...
cd "%~dp0frontend"
echo.

echo Etape 4: Nettoyage du cache Next.js...
if exist ".next" (
    rmdir /s /q .next
    echo Cache Next.js supprime.
) else (
    echo Pas de cache Next.js a supprimer.
)
echo.

echo Etape 5: Demarrage du serveur sur le port 3001...
echo Le serveur va demarrer. Attendez que le message "ready" s'affiche.
echo Puis ouvrez votre navigateur a l'adresse: http://localhost:3001/dashboard
echo.
echo Pour arreter le serveur, appuyez sur Ctrl+C
echo.
echo Appuyez sur une touche pour demarrer le serveur...
pause > nul

start "" http://localhost:3001/dashboard

npx next dev -p 3001

echo.
echo Si le serveur n'a pas demarre correctement, essayez de:
echo 1. Reinstaller les dependances avec: npm install
echo 2. Demarrer le serveur manuellement avec: npm run dev
echo.
pause