const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка импортов...');

// Список удаленных файлов
const deletedFiles = [
  'OrderItemsTableSimple',
  'OrderTable',
  'OrderItemsTable',
  'OrderItemsTableV2',
  'SimpleOrderItemsTable',
  'OrderPositionsTable',
  'OrderPositionsTableSimple'
];

// Функция для поиска файлов
const findFiles = (dir, extension = '.js') => {
  const files = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findFiles(fullPath, extension));
    } else if (item.endsWith(extension)) {
      files.push(fullPath);
    }
  });
  
  return files;
};

// Функция для проверки импортов в файле
const checkFileImports = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  lines.forEach((line, index) => {
    deletedFiles.forEach(deletedFile => {
      // Более точная проверка - ищем точное совпадение имени файла
      const regex = new RegExp(`\\b${deletedFile}\\b`);
      if (regex.test(line) && (line.includes('import') || line.includes('require'))) {
        issues.push({
          file: path.relative(process.cwd(), filePath),
          line: index + 1,
          content: line.trim(),
          deletedFile
        });
      }
    });
  });
  
  return issues;
};

// Проверяем все JS файлы
const srcPath = path.resolve(__dirname, 'src');
const jsFiles = findFiles(srcPath, '.js');

console.log(`📊 Найдено ${jsFiles.length} JS файлов для проверки`);

let totalIssues = 0;

jsFiles.forEach(filePath => {
  const issues = checkFileImports(filePath);
  
  if (issues.length > 0) {
    console.log(`\n❌ Проблемы в файле: ${path.relative(process.cwd(), filePath)}`);
    issues.forEach(issue => {
      console.log(`  Строка ${issue.line}: ${issue.content}`);
      console.log(`  Удаленный файл: ${issue.deletedFile}`);
      totalIssues++;
    });
  }
});

if (totalIssues === 0) {
  console.log('\n✅ Все импорты в порядке!');
} else {
  console.log(`\n⚠️  Найдено ${totalIssues} проблем с импортами`);
}

// Проверяем, что новые файлы существуют
console.log('\n🔍 Проверка новых файлов...');

const newFiles = [
  'src/components/Orders/OrderPositionsTableNew.js',
  'src/components/Orders/OrderTableNew.js'
];

newFiles.forEach(file => {
  const filePath = path.resolve(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - существует`);
  } else {
    console.log(`❌ ${file} - НЕ НАЙДЕН!`);
  }
});

console.log('\n🎉 Проверка завершена!');
