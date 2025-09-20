const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔥 ПРИНУДИТЕЛЬНАЯ ОЧИСТКА КЭША...');

// 1. Остановить все процессы Node.js
console.log('1. Остановка процессов Node.js...');
try {
  execSync('pkill -f "node.*start"', { stdio: 'ignore' });
  console.log('✅ Процессы Node.js остановлены');
} catch (error) {
  console.log('ℹ️  Процессы Node.js не найдены');
}

// 2. Удалить все кэши
console.log('2. Удаление всех кэшей...');

// Webpack cache
const webpackCachePath = path.resolve(__dirname, 'node_modules/.cache');
if (fs.existsSync(webpackCachePath)) {
  fs.rmSync(webpackCachePath, { recursive: true, force: true });
  console.log('✅ Webpack cache удален');
}

// Build папка
const buildPath = path.resolve(__dirname, 'build');
if (fs.existsSync(buildPath)) {
  fs.rmSync(buildPath, { recursive: true, force: true });
  console.log('✅ Build папка удалена');
}

// ESLint cache
const eslintCachePath = path.resolve(__dirname, '.eslintcache');
if (fs.existsSync(eslintCachePath)) {
  fs.unlinkSync(eslintCachePath);
  console.log('✅ ESLint cache удален');
}

// 3. Очистить временные файлы
console.log('3. Очистка временных файлов...');

const tempFiles = [
  '.DS_Store',
  'Thumbs.db',
  '*.tmp',
  '*.temp',
  '*.log',
  'client.log'
];

tempFiles.forEach(pattern => {
  try {
    const files = require('glob').sync(pattern, { cwd: __dirname });
    files.forEach(file => {
      try {
        fs.unlinkSync(path.resolve(__dirname, file));
        console.log(`✅ Удален: ${file}`);
      } catch (error) {
        // Игнорируем ошибки
      }
    });
  } catch (error) {
    // Игнорируем ошибки
  }
});

// 4. Переустановить зависимости
console.log('4. Переустановка зависимостей...');
try {
  execSync('rm -rf node_modules package-lock.json', { stdio: 'inherit' });
  console.log('✅ node_modules удален');
  
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Зависимости переустановлены');
} catch (error) {
  console.log('❌ Ошибка при переустановке зависимостей:', error.message);
}

console.log('🎉 ПРИНУДИТЕЛЬНАЯ ОЧИСТКА ЗАВЕРШЕНА!');
console.log('🚀 Теперь можно запускать: npm start');




