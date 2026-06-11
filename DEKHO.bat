@echo off
cd /d "%~dp0"
echo Khul raha hai: docs\project-dekho.html
start "" "%~dp0docs\project-dekho.html"
if errorlevel 1 (
  echo Agar browser nahi khula, to Cursor mein yeh file kholein:
  echo   %~dp0docs\project-dekho.html
  pause
)
