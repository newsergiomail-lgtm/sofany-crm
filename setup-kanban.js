const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Настройки подключения к базе данных
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sofany_crm',
  password: 'postgres',
  port: 5432,
});

async function setupKanban() {
  try {
    console.log('Подключение к базе данных...');
    
    // Читаем SQL скрипт
    const sqlPath = path.join(__dirname, 'server', 'scripts', 'create_kanban_columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Выполнение SQL скрипта...');
    await pool.query(sql);
    
    console.log('✅ Таблица kanban_columns создана успешно!');
    
    // Проверяем, что таблица создана
    const result = await pool.query('SELECT * FROM kanban_columns ORDER BY position');
    console.log('Колонки канбана:', result.rows);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

setupKanban();
