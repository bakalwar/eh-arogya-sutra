@echo off
cd /d "%~dp0"
echo.
echo  E.H. Arogya — local hub (Chrome)
echo  Pehle backend chalayein:  npm run dev
echo  Phir yeh URL khulegi:
echo    http://localhost:5000/eh-arogya/
echo.
start "" "http://localhost:5000/eh-arogya/"
pause
