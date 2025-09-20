const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка source maps...');

// Проверяем build папку
const buildPath = path.resolve(__dirname, 'build');
if (fs.existsSync(buildPath)) {
  console.log('✅ Build папка найдена');
  
  // Ищем .map файлы
  const findMapFiles = (dir) => {
    const files = fs.readdirSync(dir);
    const mapFiles = [];
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        mapFiles.push(...findMapFiles(filePath));
      } else if (file.endsWith('.map')) {
        mapFiles.push(filePath);
      }
    });
    
    return mapFiles;
  };
  
  const mapFiles = findMapFiles(buildPath);
  console.log(`📊 Найдено ${mapFiles.length} source map файлов`);
  
  mapFiles.forEach(file => {
    const relativePath = path.relative(buildPath, file);
    console.log(`  - ${relativePath}`);
  });
  
} else {
  console.log('❌ Build папка не найдена');
}

console.log('🎉 Проверка завершена!');




