const fs = require('fs');
const path = require('path');

console.log('🧹 Очистка webpack кэша...');

// 1. Удаляем webpack кэш
const webpackCachePath = path.resolve(__dirname, 'node_modules/.cache');
if (fs.existsSync(webpackCachePath)) {
  fs.rmSync(webpackCachePath, { recursive: true, force: true });
  console.log('✅ Webpack cache удален');
} else {
  console.log('ℹ️  Webpack cache не найден');
}

// 2. Удаляем build папку
const buildPath = path.resolve(__dirname, 'build');
if (fs.existsSync(buildPath)) {
  fs.rmSync(buildPath, { recursive: true, force: true });
  console.log('✅ Build папка удалена');
} else {
  console.log('ℹ️  Build папка не найдена');
}

// 3. Удаляем ESLint кэш
const eslintCachePath = path.resolve(__dirname, '.eslintcache');
if (fs.existsSync(eslintCachePath)) {
  fs.unlinkSync(eslintCachePath);
  console.log('✅ ESLint cache удален');
} else {
  console.log('ℹ️  ESLint cache не найден');
}

// 4. Удаляем временные файлы
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

console.log('🎉 Кэш очищен! Теперь можно запускать: npm start');




