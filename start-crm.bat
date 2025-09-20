@echo off
echo 🚀 Запуск SofanyCRM системы...
echo ================================

REM Функция для завершения всех процессов при выходе
:cleanup
echo.
echo 🛑 Остановка системы...
taskkill /f /im node.exe 2>nul
echo ✅ Все процессы остановлены
exit /b 0

REM Устанавливаем обработчик сигналов
set "cleanup_cmd=call :cleanup"

REM Проверяем, установлены ли зависимости
echo 📦 Проверка зависимостей...

if not exist "server\node_modules" (
    echo 📥 Установка зависимостей сервера...
    cd server
    call npm install
    cd ..
)

if not exist "client\node_modules" (
    echo 📥 Установка зависимостей клиента...
    cd client
    call npm install
    cd ..
)

echo ✅ Зависимости проверены

REM Запускаем сервер
echo 🔄 Запуск сервера API...
cd server
start "SofanyCRM Server" cmd /k "npm run dev"
cd ..

REM Ждем немного, чтобы сервер запустился
echo ⏳ Ожидание запуска сервера...
timeout /t 5 /nobreak >nul

REM Запускаем клиент
echo 🔄 Запуск клиента...
cd client
start "SofanyCRM Client" cmd /k "npm start"
cd ..

REM Ждем немного, чтобы клиент запустился
echo ⏳ Ожидание запуска клиента...
timeout /t 10 /nobreak >nul

echo.
echo 🎉 Система запущена!
echo ================================
echo 🌐 Клиент: http://localhost:3000
echo 🔧 Сервер: http://localhost:5000
echo 📋 Заказы: http://localhost:3000/orders
echo 🏭 Канбан: http://localhost:3000/kanban
echo ⚙️ Производство: http://localhost:3000/production
echo.
echo 📝 Для остановки закройте окна команд
echo ================================

REM Открываем браузер
echo 🌐 Открываем браузер...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo Нажмите любую клавишу для выхода...
pause >nul
