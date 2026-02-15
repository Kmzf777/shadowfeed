@echo off
echo Limpando processos Next.js/Node.js nas portas 3000-3005...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Matando processo %%a na porta 3000
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo Matando processo %%a na porta 3001
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" ^| findstr "LISTENING"') do (
    echo Matando processo %%a na porta 3002
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3003" ^| findstr "LISTENING"') do (
    echo Matando processo %%a na porta 3003
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3004" ^| findstr "LISTENING"') do (
    echo Matando processo %%a na porta 3004
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3005" ^| findstr "LISTENING"') do (
    echo Matando processo %%a na porta 3005
    taskkill /F /PID %%a 2>nul
)

echo Limpeza concluida!
timeout /t 2 >nul