@echo off
title LibreTranslate - Summary languages
cd /d "%~dp0"

echo LibreTranslate server (port 5001) - is window ko band mat karo.
echo Pehli baar models download ho sakte hain - 5-15 min wait karein.
echo.

powershell -ExecutionPolicy Bypass -File scripts\start-libretranslate.ps1
pause
