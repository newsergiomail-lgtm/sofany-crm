const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Быстрая установка зависимостей...');

// Проверяем, есть ли package.json
const packageJsonPath = path.resolve(__dirname, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.log('❌ package.json не найден!');
  process.exit(1);
}

// Проверяем, есть ли node_modules
const nodeModulesPath = path.resolve(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ node_modules уже существует');
} else {
  console.log('📦 Устанавливаем зависимости...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Зависимости установлены');
  } catch (error) {
    console.log('❌ Ошибка установки:', error.message);
    process.exit(1);
  }
}

console.log('🎉 Установка завершена! Теперь можно запускать: npm start');




