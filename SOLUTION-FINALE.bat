@echo off
echo ========================================================
echo SOLUTION FINALE - BURGER SOCIAL CLUB
echo ========================================================
echo.

echo Etape 1: Arret de tous les processus Node.js...
taskkill /F /IM node.exe 2>nul
echo.

echo Etape 2: Navigation vers le dossier frontend...
cd "%~dp0frontend"
echo.

echo Etape 3: Suppression complete du cache...
if exist ".next" (
    rmdir /s /q .next
    echo Cache Next.js supprime.
)
echo.

echo Etape 4: Modification du fichier index.tsx pour redirection directe...
echo import { useEffect } from 'react'; > pages\index.tsx
echo import { useRouter } from 'next/router'; >> pages\index.tsx
echo. >> pages\index.tsx
echo export default function Home() { >> pages\index.tsx
echo   const router = useRouter(); >> pages\index.tsx
echo. >> pages\index.tsx
echo   useEffect(() => { >> pages\index.tsx
echo     // Definir le token d'acces >> pages\index.tsx
echo     if (typeof window !== 'undefined') { >> pages\index.tsx
echo       localStorage.setItem('access_token', 'demo_token'); >> pages\index.tsx
echo       router.push('/dashboard'); >> pages\index.tsx
echo     } >> pages\index.tsx
echo   }, [router]); >> pages\index.tsx
echo. >> pages\index.tsx
echo   return null; >> pages\index.tsx
echo } >> pages\index.tsx
echo Fichier index.tsx modifie pour redirection automatique.
echo.

echo Etape 5: Modification du fichier _app.tsx pour simplification...
echo // pages/_app.tsx > pages\_app.tsx
echo import "../styles/globals.css"; >> pages\_app.tsx
echo import type { AppProps } from "next/app"; >> pages\_app.tsx
echo import { useEffect } from "react"; >> pages\_app.tsx
echo import { ToastContainer } from 'react-toastify'; >> pages\_app.tsx
echo import 'react-toastify/dist/ReactToastify.css'; >> pages\_app.tsx
echo. >> pages\_app.tsx
echo export default function App({ Component, pageProps }: AppProps) { >> pages\_app.tsx
echo   useEffect(() => { >> pages\_app.tsx
echo     // Bypass authentication for MVP >> pages\_app.tsx
echo     if (typeof window !== 'undefined') { >> pages\_app.tsx
echo       localStorage.setItem('access_token', 'demo_token'); >> pages\_app.tsx
echo     } >> pages\_app.tsx
echo   }, []); >> pages\_app.tsx
echo. >> pages\_app.tsx
echo   return ( >> pages\_app.tsx
echo     ^<^> >> pages\_app.tsx
echo       ^<Component {...pageProps} /^> >> pages\_app.tsx
echo       ^<ToastContainer position="bottom-right" autoClose={3000} /^> >> pages\_app.tsx
echo     ^</^> >> pages\_app.tsx
echo   ); >> pages\_app.tsx
echo } >> pages\_app.tsx
echo Fichier _app.tsx simplifie.
echo.

echo Etape 6: Demarrage du serveur sur le port 3002...
echo.
echo Le serveur va demarrer sur le port 3002.
echo Une fois le serveur demarre, vous serez automatiquement redirige vers le tableau de bord.
echo.
echo Appuyez sur une touche pour continuer...
pause > nul

start "" http://localhost:3002/dashboard

echo Demarrage du serveur...
npx next dev -p 3002

echo.
echo Si le serveur n'a pas demarre correctement, contactez le support technique.
echo.
pause