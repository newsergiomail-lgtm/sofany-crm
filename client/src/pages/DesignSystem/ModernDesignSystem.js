import React, { useState, useEffect } from 'react';
import {
  Home, User, Settings, Search, Plus, Edit, Trash2, Save, RefreshCw, Filter,
  Eye, EyeOff, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, X, AlertTriangle, Info, CheckCircle, XCircle, AlertCircle,
  HelpCircle, Target, Star, MoreHorizontal, Maximize, Menu, X as XIcon,
  Palette, Type, Square, Bell, Download, Calculator, FileText, Package, Shield
} from 'lucide-react';

const ModernDesignSystem = () => {
  const [isDark, setIsDark] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [modalOpen, setModalOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('option1');
  const [multiSelectItems, setMultiSelectItems] = useState(['item1']);
  const [sliderValue, setSliderValue] = useState(50);
  const [customSelectOpen, setCustomSelectOpen] = useState(false);
  const [customSelectValue, setCustomSelectValue] = useState('Выберите опцию');
  const [selectValue, setSelectValue] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('new');

  // Статусы заказа из страницы создания заказа
  const orderStatuses = [
    {
      id: 'new',
      title: 'Новый',
      description: 'Заказ только что создан',
      icon: CheckCircle,
      color: 'teal'
    },
    {
      id: 'confirmed',
      title: 'Принят',
      description: 'Заказ подтвержден',
      icon: FileText,
      color: 'blue'
    },
    {
      id: 'purchase',
      title: 'В закупке',
      description: 'Закупка материалов',
      icon: Package,
      color: 'orange'
    },
    {
      id: 'production',
      title: 'В производстве',
      description: 'Изготовление изделия',
      icon: Settings,
      color: 'purple'
    },
    {
      id: 'ready',
      title: 'Готов',
      description: 'Заказ готов к отправке',
      icon: Check,
      color: 'green'
    },
    {
      id: 'shipped',
      title: 'Отправлен',
      description: 'Заказ отправлен клиенту',
      icon: Target,
      color: 'indigo'
    },
    {
      id: 'delivered',
      title: 'Доставлен',
      description: 'Заказ доставлен',
      icon: Shield,
      color: 'emerald'
    },
    {
      id: 'cancelled',
      title: 'Отменен',
      description: 'Заказ отменен',
      icon: XCircle,
      color: 'red'
    }
  ];

  const statusColors = {
    teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  };

  const statusIcons = {
    teal: 'text-teal-600 dark:text-teal-400',
    blue: 'text-blue-600 dark:text-blue-400',
    orange: 'text-orange-600 dark:text-orange-400',
    purple: 'text-purple-600 dark:text-purple-400',
    green: 'text-green-600 dark:text-green-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    red: 'text-red-600 dark:text-red-400'
  };

  useEffect(() => {
    // Используем единую систему управления темой
    const currentTheme = localStorage.getItem('theme') || 'light';
    const isDarkMode = currentTheme === 'dark';
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    
    // Используем единую систему управления темой
    const newTheme = newDarkMode ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    
    // Применяем изменения через ThemeContext
    const event = new CustomEvent('themeChange', { detail: { theme: newTheme } });
    window.dispatchEvent(event);
  };

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: Home },
    { id: 'buttons', label: 'Кнопки', icon: Square },
    { id: 'forms', label: 'Формы', icon: Edit },
    { id: 'navigation', label: 'Навигация', icon: Menu },
    { id: 'feedback', label: 'Обратная связь', icon: Bell },
    { id: 'data', label: 'Данные', icon: FileText },
    { id: 'layout', label: 'Макет', icon: Type },
    { id: 'status', label: 'Статусы', icon: CheckCircle }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Современная дизайн-система
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Полный набор компонентов для создания современных веб-приложений с поддержкой темной темы
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Palette className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 ml-3">
              Цветовая палитра
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Современная цветовая схема с поддержкой темной темы
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Type className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 ml-3">
              Типографика
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Читаемые шрифты и правильная иерархия текста
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Square className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 ml-3">
              Компоненты
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Готовые к использованию UI компоненты
          </p>
        </div>
      </div>
    </div>
  );

  const renderButtons = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Кнопки</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Основные кнопки</h3>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">Основная</button>
            <button className="btn-secondary">Вторичная</button>
            <button className="btn-success">Успех</button>
            <button className="btn-warning">Предупреждение</button>
            <button className="btn-danger">Опасность</button>
            <button className="btn-info">Информация</button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Размеры</h3>
          <div className="flex flex-wrap items-center gap-4">
            <button className="btn-primary btn-sm">Маленькая</button>
            <button className="btn-primary">Обычная</button>
            <button className="btn-primary btn-lg">Большая</button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Стили</h3>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">Обычная</button>
            <button className="btn-primary btn-outline">Контурная</button>
            <button className="btn-primary btn-ghost">Призрачная</button>
            <button className="btn-primary btn-glass">Стеклянная</button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">С иконками</h3>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </button>
            <button className="btn-secondary">
              <Edit className="w-4 h-4 mr-2" />
              Редактировать
            </button>
            <button className="btn-danger">
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderForms = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Формы</h2>
      
      <div className="max-w-2xl">
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Текстовое поле
            </label>
            <input
              type="text"
              placeholder="Введите текст..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Пароль
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Введите пароль..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <Eye className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Выпадающий список
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <option>Выберите опцию</option>
              <option>Опция 1</option>
              <option>Опция 2</option>
              <option>Опция 3</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Текстовая область
            </label>
            <textarea
              rows={4}
              placeholder="Введите текст..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={checkboxValue}
                onChange={(e) => setCheckboxValue(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Согласен с условиями
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Радио кнопки
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="radio"
                  value="option1"
                  checked={radioValue === 'option1'}
                  onChange={(e) => setRadioValue(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Опция 1
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="radio"
                  value="option2"
                  checked={radioValue === 'option2'}
                  onChange={(e) => setRadioValue(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Опция 2
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Слайдер
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => setSliderValue(e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Значение: {sliderValue}
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  const renderStatuses = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Статусы заказов</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {orderStatuses.map((status) => {
          const Icon = status.icon;
          return (
            <div
              key={status.id}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedStatus === status.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedStatus(status.id)}
            >
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg ${statusColors[status.color]}`}>
                  <Icon className={`w-6 h-6 ${statusIcons[status.color]}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 ml-3">
                  {status.title}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {status.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Выбранный статус: {orderStatuses.find(s => s.id === selectedStatus)?.title}
        </h3>
        <div className="flex flex-wrap gap-2">
          {orderStatuses.map((status) => {
            const Icon = status.icon;
            return (
              <span
                key={status.id}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[status.color]}`}
              >
                <Icon className="w-4 h-4 mr-1" />
                {status.title}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'buttons':
        return renderButtons();
      case 'forms':
        return renderForms();
      case 'status':
        return renderStatuses();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Заголовок */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Дизайн-система
            </h1>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {isDark ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Навигация */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedTab === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Контент */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ModernDesignSystem;




