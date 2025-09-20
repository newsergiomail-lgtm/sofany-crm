const fs = require('fs');
const path = require('path');

console.log('🧹 Очистка всех кэшей...');

// 1. Очищаем webpack кэш
const webpackCachePath = path.resolve(__dirname, 'node_modules/.cache');
if (fs.existsSync(webpackCachePath)) {
  fs.rmSync(webpackCachePath, { recursive: true, force: true });
  console.log('✅ Webpack cache очищен');
} else {
  console.log('ℹ️  Webpack cache не найден');
}

// 2. Очищаем build папку
const buildPath = path.resolve(__dirname, 'build');
if (fs.existsSync(buildPath)) {
  fs.rmSync(buildPath, { recursive: true, force: true });
  console.log('✅ Build папка очищена');
} else {
  console.log('ℹ️  Build папка не найдена');
}

// 3. Очищаем .eslintcache
const eslintCachePath = path.resolve(__dirname, '.eslintcache');
if (fs.existsSync(eslintCachePath)) {
  fs.unlinkSync(eslintCachePath);
  console.log('✅ ESLint cache очищен');
} else {
  console.log('ℹ️  ESLint cache не найден');
}

// 4. Очищаем temp файлы
const tempFiles = [
  '.DS_Store',
  'Thumbs.db',
  '*.tmp',
  '*.temp'
];

tempFiles.forEach(pattern => {
  const files = require('glob').sync(pattern, { cwd: __dirname });
  files.forEach(file => {
    try {
      fs.unlinkSync(path.resolve(__dirname, file));
      console.log(`✅ Удален temp файл: ${file}`);
    } catch (error) {
      // Игнорируем ошибки
    }
  });
});

console.log('🎉 Все кэши очищены! Теперь можно запускать npm start');




