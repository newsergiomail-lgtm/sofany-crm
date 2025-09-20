const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск серверов...');

// Запускаем клиентский сервер
console.log('1. Запуск клиентского сервера (порт 3000)...');
const clientProcess = spawn('npm', ['start'], {
  cwd: path.resolve(__dirname),
  stdio: 'inherit',
  shell: true
});

// Запускаем серверный сервер
console.log('2. Запуск серверного сервера (порт 5000)...');
const serverProcess = spawn('node', ['index.js'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  shell: true
});

// Обработка ошибок
clientProcess.on('error', (error) => {
  console.log('❌ Ошибка клиентского сервера:', error.message);
});

serverProcess.on('error', (error) => {
  console.log('❌ Ошибка серверного сервера:', error.message);
});

// Обработка завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Остановка серверов...');
  clientProcess.kill();
  serverProcess.kill();
  process.exit(0);
});

console.log('✅ Серверы запущены!');
console.log('🌐 Клиент: http://localhost:3000');
console.log('🔧 API: http://localhost:5000');
console.log('🧪 Тест: http://localhost:3000/test-connection.html');
console.log('\nНажмите Ctrl+C для остановки');




