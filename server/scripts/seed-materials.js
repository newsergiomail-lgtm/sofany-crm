const db = require('../config/database');

const demoMaterials = [
  // ППУ (Пенополиуретан)
  { name: 'ППУ 25 кг/м³ 30x20 см', category: 'ППУ', quantity: 150, unit: 'лист', minimum: 50, price: 1800.00, description: 'Пенополиуретан плотностью 25 кг/м³, размер 30x20 см' },
  { name: 'ППУ 35 кг/м³ 30x20 см', category: 'ППУ', quantity: 120, unit: 'лист', minimum: 40, price: 2200.00, description: 'Пенополиуретан плотностью 35 кг/м³, размер 30x20 см' },
  { name: 'ППУ 40 кг/м³ 30x20 см', category: 'ППУ', quantity: 100, unit: 'лист', minimum: 30, price: 2500.00, description: 'Пенополиуретан плотностью 40 кг/м³, размер 30x20 см' },
  { name: 'ППУ 45 кг/м³ 30x20 см', category: 'ППУ', quantity: 80, unit: 'лист', minimum: 25, price: 2800.00, description: 'Пенополиуретан плотностью 45 кг/м³, размер 30x20 см' },
  { name: 'ППУ 50 кг/м³ 30x20 см', category: 'ППУ', quantity: 60, unit: 'лист', minimum: 20, price: 3200.00, description: 'Пенополиуретан плотностью 50 кг/м³, размер 30x20 см' },

  // Ткани
  { name: 'Велюр "Карамель"', category: 'Ткани', quantity: 85, unit: 'м.пог.', minimum: 50, price: 850.00, description: 'Велюровая ткань карамельного цвета, ширина 140 см' },
  { name: 'Велюр "Шоколад"', category: 'Ткани', quantity: 75, unit: 'м.пог.', minimum: 50, price: 900.00, description: 'Велюровая ткань шоколадного цвета, ширина 140 см' },
  { name: 'Жаккард "Цветочный"', category: 'Ткани', quantity: 65, unit: 'м.пог.', minimum: 40, price: 1200.00, description: 'Жаккардовая ткань с цветочным рисунком, ширина 140 см' },
  { name: 'Микрофибра "Серый"', category: 'Ткани', quantity: 95, unit: 'м.пог.', minimum: 60, price: 750.00, description: 'Микрофибра серого цвета, ширина 140 см' },
  { name: 'Флок "Бежевый"', category: 'Ткани', quantity: 70, unit: 'м.пог.', minimum: 45, price: 650.00, description: 'Флок бежевого цвета, ширина 140 см' },
  { name: 'Шенилл "Синий"', category: 'Ткани', quantity: 55, unit: 'м.пог.', minimum: 35, price: 1100.00, description: 'Шенилл синего цвета, ширина 140 см' },
  { name: 'Рогожка "Коричневый"', category: 'Ткани', quantity: 80, unit: 'м.пог.', minimum: 50, price: 950.00, description: 'Рогожка коричневого цвета, ширина 140 см' },

  // Кожа
  { name: 'Экокожа "Черная"', category: 'Кожа', quantity: 60, unit: 'м.пог.', minimum: 30, price: 1200.00, description: 'Экокожа черного цвета, ширина 140 см' },
  { name: 'Экокожа "Коричневая"', category: 'Кожа', quantity: 45, unit: 'м.пог.', minimum: 25, price: 1300.00, description: 'Экокожа коричневого цвета, ширина 140 см' },
  { name: 'Натуральная кожа "Черная"', category: 'Кожа', quantity: 25, unit: 'м.пог.', minimum: 15, price: 3500.00, description: 'Натуральная кожа черного цвета, ширина 140 см' },
  { name: 'Натуральная кожа "Коричневая"', category: 'Кожа', quantity: 20, unit: 'м.пог.', minimum: 10, price: 3800.00, description: 'Натуральная кожа коричневого цвета, ширина 140 см' },

  // Фанера
  { name: 'Фанера 6 мм', category: 'Фанера', quantity: 200, unit: 'лист', minimum: 100, price: 1200.00, description: 'Фанера 6 мм, размер 1525x1525 мм' },
  { name: 'Фанера 9 мм', category: 'Фанера', quantity: 180, unit: 'лист', minimum: 90, price: 1500.00, description: 'Фанера 9 мм, размер 1525x1525 мм' },
  { name: 'Фанера 12 мм', category: 'Фанера', quantity: 160, unit: 'лист', minimum: 80, price: 1800.00, description: 'Фанера 12 мм, размер 1525x1525 мм' },
  { name: 'Фанера 15 мм', category: 'Фанера', quantity: 140, unit: 'лист', minimum: 70, price: 2200.00, description: 'Фанера 15 мм, размер 1525x1525 мм' },
  { name: 'Фанера 18 мм', category: 'Фанера', quantity: 120, unit: 'лист', minimum: 60, price: 2500.00, description: 'Фанера 18 мм, размер 1525x1525 мм' },

  // ДВП
  { name: 'ДВП 3.2 мм', category: 'ДВП', quantity: 300, unit: 'лист', minimum: 150, price: 450.00, description: 'ДВП 3.2 мм, размер 2750x1830 мм' },
  { name: 'ДВП 4.8 мм', category: 'ДВП', quantity: 250, unit: 'лист', minimum: 125, price: 550.00, description: 'ДВП 4.8 мм, размер 2750x1830 мм' },
  { name: 'ДВП 6.4 мм', category: 'ДВП', quantity: 200, unit: 'лист', minimum: 100, price: 650.00, description: 'ДВП 6.4 мм, размер 2750x1830 мм' },

  // Брус
  { name: 'Брус 40x40 мм', category: 'Брус', quantity: 500, unit: 'м.пог.', minimum: 200, price: 150.00, description: 'Сосновый брус 40x40 мм' },
  { name: 'Брус 50x50 мм', category: 'Брус', quantity: 400, unit: 'м.пог.', minimum: 150, price: 200.00, description: 'Сосновый брус 50x50 мм' },
  { name: 'Брус 60x60 мм', category: 'Брус', quantity: 300, unit: 'м.пог.', minimum: 100, price: 280.00, description: 'Сосновый брус 60x60 мм' },
  { name: 'Брус 80x80 мм', category: 'Брус', quantity: 200, unit: 'м.пог.', minimum: 80, price: 350.00, description: 'Сосновый брус 80x80 мм' },
  { name: 'Брус 100x100 мм', category: 'Брус', quantity: 150, unit: 'м.пог.', minimum: 60, price: 450.00, description: 'Сосновый брус 100x100 мм' },

  // Механизмы
  { name: 'Механизм "Аккордеон"', category: 'Механизмы', quantity: 25, unit: 'шт', minimum: 15, price: 3500.00, description: 'Механизм трансформации "Аккордеон" для диванов-кроватей' },
  { name: 'Механизм "Дельфин"', category: 'Механизмы', quantity: 30, unit: 'шт', minimum: 20, price: 4200.00, description: 'Механизм трансформации "Дельфин" для диванов-кроватей' },
  { name: 'Механизм "Клик-кляк"', category: 'Механизмы', quantity: 20, unit: 'шт', minimum: 10, price: 2800.00, description: 'Механизм трансформации "Клик-кляк" для диванов-кроватей' },
  { name: 'Механизм "Еврокнижка"', category: 'Механизмы', quantity: 35, unit: 'шт', minimum: 25, price: 3200.00, description: 'Механизм трансформации "Еврокнижка" для диванов-кроватей' },

  // Крепеж
  { name: 'Саморезы 4x50 мм', category: 'Крепеж', quantity: 1000, unit: 'шт', minimum: 500, price: 2.50, description: 'Саморезы по дереву 4x50 мм' },
  { name: 'Саморезы 5x70 мм', category: 'Крепеж', quantity: 800, unit: 'шт', minimum: 400, price: 3.20, description: 'Саморезы по дереву 5x70 мм' },
  { name: 'Уголки металлические', category: 'Крепеж', quantity: 200, unit: 'шт', minimum: 100, price: 25.00, description: 'Уголки металлические для крепления' },
  { name: 'Скобы мебельные 14 мм', category: 'Крепеж', quantity: 5000, unit: 'шт', minimum: 2000, price: 0.80, description: 'Скобы мебельные 14 мм для степлера' },

  // Наполнители
  { name: 'Синтепон 200 г/м²', category: 'Наполнители', quantity: 100, unit: 'м.пог.', minimum: 50, price: 120.00, description: 'Синтепон плотностью 200 г/м², ширина 150 см' },
  { name: 'Синтепон 300 г/м²', category: 'Наполнители', quantity: 80, unit: 'м.пог.', minimum: 40, price: 150.00, description: 'Синтепон плотностью 300 г/м², ширина 150 см' },
  { name: 'Холлофайбер', category: 'Наполнители', quantity: 60, unit: 'м.пог.', minimum: 30, price: 200.00, description: 'Холлофайбер для наполнения подушек' },
  { name: 'Периотек', category: 'Наполнители', quantity: 40, unit: 'м.пог.', minimum: 20, price: 180.00, description: 'Периотек для наполнения подушек' },

  // Инструменты
  { name: 'Шуруповерт аккумуляторный', category: 'Инструмент', quantity: 3, unit: 'шт', minimum: 2, price: 8500.00, description: 'Аккумуляторный шуруповерт 18V' },
  { name: 'Дрель ударная', category: 'Инструмент', quantity: 2, unit: 'шт', minimum: 1, price: 12000.00, description: 'Ударная дрель 650W' },
  { name: 'Лобзик электрический', category: 'Инструмент', quantity: 2, unit: 'шт', minimum: 1, price: 4500.00, description: 'Электрический лобзик 800W' },
  { name: 'Рубанок электрический', category: 'Инструмент', quantity: 1, unit: 'шт', minimum: 1, price: 15000.00, description: 'Электрический рубанок 850W' },
  { name: 'Фрезер ручной', category: 'Инструмент', quantity: 1, unit: 'шт', minimum: 1, price: 18000.00, description: 'Ручной фрезер 1400W' },
  { name: 'Степлер мебельный', category: 'Инструмент', quantity: 2, unit: 'шт', minimum: 1, price: 2500.00, description: 'Мебельный степлер для обивки' },
  { name: 'Пистолет для клея', category: 'Инструмент', quantity: 3, unit: 'шт', minimum: 2, price: 800.00, description: 'Пистолет для термоклея' },
  { name: 'Набор отверток', category: 'Инструмент', quantity: 5, unit: 'шт', minimum: 3, price: 1200.00, description: 'Набор отверток 32 предмета' },
  { name: 'Набор ключей', category: 'Инструмент', quantity: 4, unit: 'шт', minimum: 2, price: 1500.00, description: 'Набор гаечных ключей 24 предмета' },
  { name: 'Рулетка 5м', category: 'Инструмент', quantity: 10, unit: 'шт', minimum: 5, price: 300.00, description: 'Рулетка измерительная 5 метров' },

  // Готовая продукция
  { name: 'Диван "Неаполь"', category: 'Готовая продукция', quantity: 2, unit: 'шт', minimum: 1, price: 45000.00, description: 'Диван в стиле неоклассика, размер 220x90x85 см' },
  { name: 'Кресло "Модерн"', category: 'Готовая продукция', quantity: 3, unit: 'шт', minimum: 2, price: 25000.00, description: 'Кресло в современном стиле, размер 85x85x75 см' },
  { name: 'Пуф "Круглый"', category: 'Готовая продукция', quantity: 5, unit: 'шт', minimum: 3, price: 8000.00, description: 'Круглый пуф с обивкой, диаметр 50 см' },
  { name: 'Стол журнальный', category: 'Готовая продукция', quantity: 4, unit: 'шт', minimum: 2, price: 15000.00, description: 'Журнальный столик из массива дуба, размер 80x50x45 см' }
];

const seedMaterials = async () => {
  try {
    console.log('🌱 Начинаем добавление демо материалов...');

    // Получаем категории
    const categoriesResult = await db.query('SELECT id, name FROM categories');
    const categories = {};
    categoriesResult.rows.forEach(cat => {
      categories[cat.name] = cat.id;
    });

    console.log('📋 Найдены категории:', Object.keys(categories));

    let addedCount = 0;
    let skippedCount = 0;

    for (const material of demoMaterials) {
      try {
        // Проверяем, существует ли уже материал с таким названием
        const existingMaterial = await db.query(
          'SELECT id FROM materials WHERE name = $1',
          [material.name]
        );

        if (existingMaterial.rows.length > 0) {
          console.log(`⏭️  Пропускаем "${material.name}" - уже существует`);
          skippedCount++;
          continue;
        }

        const categoryId = categories[material.category];
        if (!categoryId) {
          console.log(`❌ Категория "${material.category}" не найдена для материала "${material.name}"`);
          continue;
        }

        // Добавляем материал
        await db.query(`
          INSERT INTO materials (name, category_id, current_stock, unit, min_stock, price_per_unit, notes, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [
          material.name,
          categoryId,
          material.quantity,
          material.unit,
          material.minimum,
          material.price,
          material.description
        ]);

        console.log(`✅ Добавлен: ${material.name} (${material.quantity} ${material.unit})`);
        addedCount++;

      } catch (error) {
        console.error(`❌ Ошибка при добавлении "${material.name}":`, error.message);
      }
    }

    console.log('\n🎉 Демо материалы добавлены!');
    console.log(`✅ Добавлено: ${addedCount} материалов`);
    console.log(`⏭️  Пропущено: ${skippedCount} материалов (уже существуют)`);
    console.log(`📊 Всего обработано: ${demoMaterials.length} материалов`);

  } catch (error) {
    console.error('❌ Ошибка при добавлении демо материалов:', error);
  } finally {
    process.exit(0);
  }
};

// Запускаем скрипт
seedMaterials();
