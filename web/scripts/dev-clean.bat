@echo off
echo Iniciando servidor Next.js com limpeza de portas...
echo.

call "%~dp0cleanup-ports.bat"
echo.
echo Iniciando Next.js na porta 3000...
echo.

cd /d "%~dp0.."
call npm run dev:safe