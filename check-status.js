#!/usr/bin/env node

const http = require('http');

console.log('🔍 Проверка статуса системы SofanyCRM...\n');

// Функция для проверки порта
function checkPort(port, name) {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: port,
            path: port === 5000 ? '/api/health' : '/',
            method: 'GET',
            timeout: 3000
        }, (res) => {
            console.log(`✅ ${name} (порт ${port}): Онлайн`);
            resolve(true);
        });

        req.on('error', () => {
            console.log(`❌ ${name} (порт ${port}): Офлайн`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.log(`⏰ ${name} (порт ${port}): Таймаут`);
            resolve(false);
        });

        req.end();
    });
}

// Основная функция
async function main() {
    console.log('Проверяем компоненты системы...\n');

    const serverStatus = await checkPort(5000, 'Сервер API');
    const clientStatus = await checkPort(3000, 'Клиент');

    console.log('\n📊 Результат проверки:');
    console.log(`Сервер: ${serverStatus ? '✅ Работает' : '❌ Не работает'}`);
    console.log(`Клиент: ${clientStatus ? '✅ Работает' : '❌ Не работает'}`);

    if (serverStatus && clientStatus) {
        console.log('\n🎉 Система полностью работает!');
        console.log('🌐 Откройте http://localhost:3000 в браузере');
    } else {
        console.log('\n⚠️  Система работает частично или не работает');
        if (!serverStatus) {
            console.log('💡 Для запуска сервера: cd server && npm run dev');
        }
        if (!clientStatus) {
            console.log('💡 Для запуска клиента: cd client && npm start');
        }
    }
}

main().catch(console.error);
