const fs = require('fs');
const path = require('path');

// Очистка webpack кэша
const cacheDir = path.join(__dirname, 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('✅ Webpack кэш очищен');
}

// Очистка build директории
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
  console.log('✅ Build директория очищена');
}

console.log('🎉 Все кэши очищены!');




