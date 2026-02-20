@echo off
echo ========================================
echo    BURGER SOCIAL CLUB - DEMARRAGE
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Verification des dependances Python...
cd backend
if not exist venv (
    echo Creation de l'environnement virtuel...
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo.

echo [2/4] Verification des dependances Node.js...
cd ..\frontend
if not exist node_modules (
    echo Installation des dependances frontend...
    npm install
)
echo.

echo [3/4] Demarrage du backend...
start cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && python start.py"
timeout /t 3 /nobreak > nul
echo.

echo [4/4] Demarrage du frontend...
start cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 2 /nobreak > nul
echo.

echo ========================================
echo    APPLICATION DEMARREE !
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo Documentation API: http://localhost:8000/docs
echo.
echo Appuyez sur une touche pour fermer...
pause > nul