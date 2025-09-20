#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('🚀 Запуск SofanyCRM системы...');
console.log('================================');

// Функция для завершения всех процессов при выходе
let processes = [];

process.on('SIGINT', () => {
    console.log('\n🛑 Остановка системы...');
    processes.forEach(proc => {
        if (proc && !proc.killed) {
            proc.kill();
        }
    });
    console.log('✅ Все процессы остановлены');
    process.exit(0);
});

// Функция для запуска процесса
function startProcess(name, command, args, cwd) {
    console.log(`🔄 Запуск ${name}...`);
    
    const process = spawn(command, args, {
        cwd: cwd,
        stdio: 'inherit',
        shell: true
    });

    process.on('error', (error) => {
        console.error(`❌ Ошибка запуска ${name}:`, error.message);
    });

    process.on('exit', (code) => {
        console.log(`📝 ${name} завершился с кодом ${code}`);
    });

    processes.push(process);
    return process;
}

// Функция для проверки зависимостей
function checkDependencies(dir, name) {
    const nodeModulesPath = path.join(dir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
        console.log(`📦 Установка зависимостей для ${name}...`);
        const installProcess = spawn('npm', ['install'], {
            cwd: dir,
            stdio: 'inherit',
            shell: true
        });
        
        installProcess.on('exit', (code) => {
            if (code === 0) {
                console.log(`✅ Зависимости для ${name} установлены`);
            } else {
                console.error(`❌ Ошибка установки зависимостей для ${name}`);
            }
        });
        
        processes.push(installProcess);
        return installProcess;
    }
    return null;
}

// Основная функция
async function main() {
    const projectRoot = __dirname;
    const serverDir = path.join(projectRoot, 'server');
    const clientDir = path.join(projectRoot, 'client');

    console.log('📋 Проверка зависимостей...\n');

    // Проверяем зависимости сервера
    const serverInstall = checkDependencies(serverDir, 'сервера');
    if (serverInstall) {
        await new Promise(resolve => serverInstall.on('exit', resolve));
    }

    // Проверяем зависимости клиента
    const clientInstall = checkDependencies(clientDir, 'клиента');
    if (clientInstall) {
        await new Promise(resolve => clientInstall.on('exit', resolve));
    }

    console.log('\n🚀 Запуск процессов...\n');

    // Запускаем сервер
    const serverProcess = startProcess('Сервер', 'npm', ['run', 'dev'], serverDir);

    // Ждем немного для запуска сервера
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Запускаем клиент
    const clientProcess = startProcess('Клиент', 'npm', ['start'], clientDir);

    // Ждем немного для запуска клиента
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('\n🎉 Система запущена!');
    console.log('================================');
    console.log('🌐 Клиент: http://localhost:3000');
    console.log('🔧 Сервер: http://localhost:5000');
    console.log('📋 Заказы: http://localhost:3000/orders');
    console.log('🏭 Канбан: http://localhost:3000/kanban');
    console.log('⚙️ Производство: http://localhost:3000/production');
    console.log('');
    console.log('📝 Для остановки нажмите Ctrl+C');
    console.log('================================');

    // Открываем браузер
    console.log('\n🌐 Открываем браузер...');
    setTimeout(() => {
        const openCommand = os.platform() === 'win32' ? 'start' : 
                           os.platform() === 'darwin' ? 'open' : 'xdg-open';
        spawn(openCommand, ['http://localhost:3000'], { stdio: 'ignore' });
    }, 2000);

    // Ждем завершения процессов
    await Promise.all([
        new Promise(resolve => serverProcess.on('exit', resolve)),
        new Promise(resolve => clientProcess.on('exit', resolve))
    ]);
}

// Запускаем основную функцию
main().catch(console.error);
