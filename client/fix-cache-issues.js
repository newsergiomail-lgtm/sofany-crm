const fs = require('fs');
const path = require('path');

console.log('🔥 РАДИКАЛЬНОЕ ИСПРАВЛЕНИЕ ПРОБЛЕМ С КЭШЕМ...');

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

// 2. Удаление всех проблемных файлов
console.log('2. Удаление проблемных файлов...');

const problematicFiles = [
  'src/components/Orders/OrderItemsTableSimple.js',
  'src/components/Orders/OrderTable.js',
  'src/components/Orders/OrderItemsTable.js',
  'src/components/Orders/OrderItemsTableV2.js',
  'src/components/Orders/SimpleOrderItemsTable.js',
  'src/components/Orders/OrderPositionsTable.js',
  'src/components/Orders/OrderPositionsTableSimple.js'
];

problematicFiles.forEach(file => {
  const filePath = path.resolve(__dirname, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Удален: ${file}`);
  }
});

// 3. Создание новых файлов с уникальными именами
console.log('3. Создание новых файлов...');

// Создаем новую таблицу позиций
const newTableContent = `import React, { useState } from 'react';
import { Plus, X, Edit2, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const OrderPositionsTableNew = ({
  items = [],
  totalAmount = 0,
  onItemsChange
}) => {
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    quantity: 1,
    unit_price: 0
  });

  const addNewItem = () => {
    const newItem = {
      id: \`new_\${Date.now()}\`,
      name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      isNew: true
    };

    if (onItemsChange) {
      onItemsChange([...items, newItem]);
    }
    setEditingItem(newItem.id);
    setEditForm({
      name: '',
      quantity: 1,
      unit_price: 0
    });
  };

  const startEdit = (item) => {
    setEditingItem(item.id);
    setEditForm({
      name: item.name || '',
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0
    });
  };

  const saveEdit = () => {
    if (!editForm.name.trim()) {
      toast.error('Введите наименование');
      return;
    }

    const updatedItems = items.map(item => {
      if (item.id === editingItem) {
        const total_price = parseFloat(editForm.quantity || 0) * parseFloat(editForm.unit_price || 0);
        return {
          ...item,
          name: editForm.name.trim(),
          quantity: parseFloat(editForm.quantity) || 0,
          unit_price: parseFloat(editForm.unit_price) || 0,
          total_price: total_price,
          isNew: false
        };
      }
      return item;
    });

    if (onItemsChange) {
      onItemsChange(updatedItems);
    }
    setEditingItem(null);
    setEditForm({ name: '', quantity: 1, unit_price: 0 });
    toast.success('Изменения сохранены');
  };

  const cancelEdit = () => {
    if (items.find(item => item.id === editingItem)?.isNew) {
      const updatedItems = items.filter(item => item.id !== editingItem);
      if (onItemsChange) {
        onItemsChange(updatedItems);
      }
    }
    setEditingItem(null);
    setEditForm({ name: '', quantity: 1, unit_price: 0 });
  };

  const deleteItem = (itemId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту позицию?')) {
      const updatedItems = items.filter(item => item.id !== itemId);
      if (onItemsChange) {
        onItemsChange(updatedItems);
      }
      toast.success('Позиция удалена');
    }
  };

  const calculatedTotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0));
  }, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Позиции заказа
          </h3>
          <button
            onClick={addNewItem}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Добавить позицию
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Наименование
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Количество
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Цена за ед.
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Сумма
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {items.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Нет позиций заказа
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingItem === item.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        placeholder="Введите наименование"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.name || 'Не указано'}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white text-center"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.quantity || 0}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.unit_price}
                        onChange={(e) => setEditForm({ ...editForm, unit_price: e.target.value })}
                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white text-right"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 dark:text-white">
                        {parseFloat(item.unit_price || 0).toFixed(2)} ₽
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {(parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)).toFixed(2)} ₽
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {editingItem === item.id ? (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={saveEdit}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Сохранить"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Отменить"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Редактировать"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Итого: {calculatedTotal.toFixed(2)} ₽
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {items.length} позиций
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderPositionsTableNew;
`;

// Создаем новую таблицу заказов
const newOrderTableContent = `import React from 'react';
import { Link } from 'react-router-dom';
import { Edit } from 'lucide-react';

const OrderTableNew = ({ orders, pagination, onPageChange, onRefresh }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">Заказы не найдены</div>
        <p className="text-gray-400">Попробуйте изменить фильтры или создать новый заказ</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Номер заказа
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Клиент
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Продукт
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Сумма
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {order.order_number}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {order.customer_name || 'Не указан'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {order.product_name || 'Не указан'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {order.total_amount ? \`\${order.total_amount} ₽\` : '0 ₽'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={\`/orders/\${order.id}\`}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title="Редактировать"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTableNew;
`;

// Создаем файлы
fs.writeFileSync(path.resolve(__dirname, 'src/components/Orders/OrderPositionsTableNew.js'), newTableContent);
console.log('✅ Создан: OrderPositionsTableNew.js');

fs.writeFileSync(path.resolve(__dirname, 'src/components/Orders/OrderTableNew.js'), newOrderTableContent);
console.log('✅ Создан: OrderTableNew.js');

// 4. Обновляем импорты в App.js
console.log('4. Обновление импортов...');

const appJsPath = path.resolve(__dirname, 'src/App.js');
let appContent = fs.readFileSync(appJsPath, 'utf8');

// Заменяем импорты
appContent = appContent.replace(
  /import OrderTable from '\.\/components\/Orders\/OrderTable';/g,
  "import OrderTableNew from './components/Orders/OrderTableNew';"
);

appContent = appContent.replace(
  /<OrderTable /g,
  '<OrderTableNew '
);

fs.writeFileSync(appJsPath, appContent);
console.log('✅ Обновлен: App.js');

// 5. Обновляем импорты в Orders.js
console.log('5. Обновление Orders.js...');

const ordersJsPath = path.resolve(__dirname, 'src/pages/Orders/Orders.js');
let ordersContent = fs.readFileSync(ordersJsPath, 'utf8');

ordersContent = ordersContent.replace(
  /import OrderTable from '\.\.\/\.\.\/components\/Orders\/OrderTable';/g,
  "import OrderTableNew from '../../components/Orders/OrderTableNew';"
);

ordersContent = ordersContent.replace(
  /<OrderTable /g,
  '<OrderTableNew '
);

fs.writeFileSync(ordersJsPath, ordersContent);
console.log('✅ Обновлен: Orders.js');

// 6. Создаем файл с информацией о замене
const infoContent = `# Информация о замене файлов

## Удаленные файлы:
- OrderItemsTableSimple.js
- OrderTable.js
- OrderItemsTable.js
- OrderItemsTableV2.js
- SimpleOrderItemsTable.js
- OrderPositionsTable.js
- OrderPositionsTableSimple.js

## Созданные файлы:
- OrderPositionsTableNew.js (новая таблица позиций)
- OrderTableNew.js (новая таблица заказов)

## Обновленные файлы:
- App.js (импорты обновлены)
- Orders.js (импорты обновлены)

## Дата замены: ${new Date().toISOString()}
`;

fs.writeFileSync(path.resolve(__dirname, 'FILE_REPLACEMENT_INFO.md'), infoContent);
console.log('✅ Создан: FILE_REPLACEMENT_INFO.md');

console.log('🎉 РАДИКАЛЬНОЕ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!');
console.log('📝 Все проблемные файлы заменены на новые с уникальными именами');
console.log('🚀 Теперь можно запускать: npm start');




