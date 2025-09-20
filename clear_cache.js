const fs = require('fs');
const path = require('path');

console.log('🧹 Очистка кэша...');

// Удаляем node_modules/.cache
const cacheDir = path.join(__dirname, 'client', 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('✅ Кэш node_modules очищен');
}

// Удаляем build папку
const buildDir = path.join(__dirname, 'client', 'build');
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
  console.log('✅ Build папка очищена');
}

// Удаляем .eslintcache
const eslintCache = path.join(__dirname, 'client', '.eslintcache');
if (fs.existsSync(eslintCache)) {
  fs.unlinkSync(eslintCache);
  console.log('✅ ESLint кэш очищен');
}

console.log('🎉 Кэш полностью очищен!');
console.log('Теперь перезапустите клиент: cd client && npm start');




