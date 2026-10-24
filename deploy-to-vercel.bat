@echo off
title Deploy Mokhalasa to Vercel
cd /d "C:\Users\tamer.salah\.gemini\antigravity\scratch\mokhalasa-app"
set "PATH=C:\Users\tamer.salah\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64;%PATH%"

echo ========================================================
echo   MOKHALASA CARS - VERCEL ONE-CLICK DEPLOY
echo ========================================================
echo.
call node node_modules\vercel\dist\index.js %*
echo.
pause
