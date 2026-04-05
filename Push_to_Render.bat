@echo off
title Save and Ship - Live Update System
color 0b

echo.
echo ==============================================
echo [SHIPPING UPDATES TO RENDER]
echo ==============================================
echo.

echo [+] Preparing your code for deployment...
git add .

echo [+] Finalizing local save snapshot...
git commit -m "Auto-Update: %DATE% %TIME%"

echo [+] Synchronizing with GitHub...
git push

echo.
echo ==============================================
echo [SUCCESS!] 
echo.
echo Check your Render dashboard now:
echo Dashboard: https://dashboard.render.com/
echo.
echo Wait 3-5 minutes for the "Building..." status to 
echo change to "Live" on Render.
echo ==============================================
echo.

echo Press any key to close this window.
pause >nul
exit
