const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔥 УЛЬТИМАТИВНОЕ ИСПРАВЛЕНИЕ ПРОБЛЕМ С КЭШЕМ...');

// 1. Полная очистка всех кэшей
console.log('1. Очистка всех кэшей...');

// Webpack cache
const webpackCachePath = path.resolve(__dirname, 'node_modules/.cache');
if (fs.existsSync(webpackCachePath)) {
  fs.rmSync(webpackCachePath, { recursive: true, force: true });
  console.log('✅ Webpack cache очищен');
}

// Build папка
const buildPath = path.resolve(__dirname, 'build');
if (fs.existsSync(buildPath)) {
  fs.rmSync(buildPath, { recursive: true, force: true });
  console.log('✅ Build папка очищена');
}

// ESLint cache
const eslintCachePath = path.resolve(__dirname, '.eslintcache');
if (fs.existsSync(eslintCachePath)) {
  fs.unlinkSync(eslintCachePath);
  console.log('✅ ESLint cache очищен');
}

// 2. Очистка всех временных файлов
console.log('2. Очистка временных файлов...');

const tempFiles = [
  '.DS_Store',
  'Thumbs.db',
  '*.tmp',
  '*.temp',
  '*.log'
];

tempFiles.forEach(pattern => {
  try {
    const files = require('glob').sync(pattern, { cwd: __dirname });
    files.forEach(file => {
      try {
        fs.unlinkSync(path.resolve(__dirname, file));
        console.log(`✅ Удален temp файл: ${file}`);
      } catch (error) {
        // Игнорируем ошибки
      }
    });
  } catch (error) {
    // Игнорируем ошибки
  }
});

// 3. Создание нового webpack.config.js с прозрачными картами
console.log('3. Обновление webpack конфигурации...');

const webpackConfig = `const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'source-map', // Прозрачные карты для Safari
  output: {
    clean: true,
    devtoolModuleFilenameTemplate: info =>
      \`webpack:///\${info.resourcePath}\${info.loaders ? \`?\${info.loaders}\` : ''}\`,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      // Подхватываем карты из предыдущих стадий (TS/Babel)
      { 
        test: /\\.[jt]s$/, 
        use: ['source-map-loader'], 
        enforce: 'pre' 
      },
      {
        test: /\\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-syntax-dynamic-import'
            ]
          }
        }
      }
    ]
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  devServer: {
    hot: true,
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3000,
  },
};`;

fs.writeFileSync(path.resolve(__dirname, 'webpack.config.js'), webpackConfig);
console.log('✅ Webpack конфигурация обновлена');

// 4. Создание .babelrc для лучшей совместимости
console.log('4. Создание .babelrc...');

const babelConfig = {
  "presets": [
    ["@babel/preset-env", {
      "targets": {
        "browsers": ["last 2 versions", "ie >= 11"]
      }
    }],
    "@babel/preset-react"
  ],
  "plugins": [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-syntax-dynamic-import"
  ]
};

fs.writeFileSync(path.resolve(__dirname, '.babelrc'), JSON.stringify(babelConfig, null, 2));
console.log('✅ .babelrc создан');

// 5. Создание .eslintrc.js для лучшей совместимости
console.log('5. Создание .eslintrc.js...');

const eslintConfig = `module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'no-debugger': 'warn'
  },
  settings: {
    'import/resolver': {
      'webpack': {
        'config': './webpack.config.js'
      }
    }
  }
};`;

fs.writeFileSync(path.resolve(__dirname, '.eslintrc.js'), eslintConfig);
console.log('✅ .eslintrc.js создан');

// 6. Создание .gitignore для исключения проблемных файлов
console.log('6. Обновление .gitignore...');

const gitignoreContent = `# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Webpack cache
node_modules/.cache/

# ESLint cache
.eslintcache

# Temporary files
*.tmp
*.temp
*.log

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
`;

fs.writeFileSync(path.resolve(__dirname, '.gitignore'), gitignoreContent);
console.log('✅ .gitignore обновлен');

// 7. Создание скрипта для проверки source maps
console.log('7. Создание скрипта проверки...');

const checkSourceMapsScript = `const fs = require('fs');
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
  console.log(\`📊 Найдено \${mapFiles.length} source map файлов\`);
  
  mapFiles.forEach(file => {
    const relativePath = path.relative(buildPath, file);
    console.log(\`  - \${relativePath}\`);
  });
  
} else {
  console.log('❌ Build папка не найдена');
}

console.log('🎉 Проверка завершена!');
`;

fs.writeFileSync(path.resolve(__dirname, 'check-sourcemaps.js'), checkSourceMapsScript);
console.log('✅ Скрипт проверки создан');

console.log('🎉 УЛЬТИМАТИВНОЕ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!');
console.log('📝 Все кэши очищены, конфигурация обновлена');
console.log('🚀 Теперь можно запускать: npm start');
console.log('🔍 Для проверки source maps: node check-sourcemaps.js');




