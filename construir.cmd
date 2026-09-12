@echo off
REM Doble clic para construir el sitio una vez.
cd /d "%~dp0"
node build.js
echo.
pause
