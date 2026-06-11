@echo off
title E.H. Arogya Sutra
cd /d "%~dp0"
cls
echo.
echo  E.H. AROGYA SUTRA - Login ke liye app start
echo  Folder: %CD%
echo.
echo  Order: API (5000) pehle, phir Vite (5173)
echo  Login: http://localhost:5173/login
echo  Demo:  9876543210 / demo123
echo.
call npm run dev:restart
pause
