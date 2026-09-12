@echo off
REM Doble clic para editar con reconstruccion automatica.
REM Deja esta ventana abierta mientras trabajas en src/.
cd /d "%~dp0"
node build.js --watch
pause
