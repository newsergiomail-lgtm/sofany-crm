const axios = require('axios');

async function checkStatus() {
  console.log('🔍 ПРОВЕРКА СТАТУСА СИСТЕМЫ\n');
  console.log('='.repeat(40));

  // Проверяем основную CRM систему
  console.log('1️⃣ Основная CRM система:');
  try {
    const response = await axios.get('http://localhost:5000/api/health', { timeout: 3000 });
    console.log('   ✅ Сервер работает на порту 5000');
    console.log('   📊 Статус:', response.data.status);
  } catch (error) {
    console.log('   ❌ Сервер на порту 5000 недоступен');
  }

  try {
    const response = await axios.get('http://localhost:3000', { timeout: 3000 });
    console.log('   ✅ Клиент работает на порту 3000');
  } catch (error) {
    console.log('   ❌ Клиент на порту 3000 недоступен');
  }

  console.log('\n2️⃣ Тестовая система заказов:');
  try {
    const response = await axios.get('http://localhost:3001/api/health', { timeout: 3000 });
    console.log('   ✅ Тестовый сервер работает на порту 3001');
    console.log('   📊 Статус:', response.data.status);
  } catch (error) {
    console.log('   ❌ Тестовый сервер на порту 3001 недоступен');
  }

  try {
    const response = await axios.get('http://localhost:3000', { timeout: 3000 });
    console.log('   ✅ Клиент работает на порту 3000');
  } catch (error) {
    console.log('   ❌ Клиент недоступен');
  }

  console.log('\n3️⃣ Проверка портов:');
  const { exec } = require('child_process');
  
  exec('lsof -i :3000 -i :3001 -i :5000', (error, stdout, stderr) => {
    if (stdout) {
      console.log('   📋 Занятые порты:');
      console.log(stdout);
    } else {
      console.log('   ⚠️ Нет активных процессов на портах 3000, 3001, 5000');
    }
  });

  console.log('\n' + '='.repeat(40));
  console.log('📋 ССЫЛКИ ДЛЯ ПРОВЕРКИ:');
  console.log('   Основная CRM: http://localhost:3000');
  console.log('   API основной: http://localhost:5000/api/health');
  console.log('   Тестовая API: http://localhost:3001/api/health');
  console.log('='.repeat(40));
}

checkStatus().catch(console.error);




