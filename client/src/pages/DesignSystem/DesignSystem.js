import React, { useState } from 'react';
import {
  Home, User, Settings, Search, Plus, Edit, Trash2, Save, RefreshCw, Filter,
  Eye, EyeOff, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, X, AlertTriangle, Info, CheckCircle, XCircle, AlertCircle,
  HelpCircle, Zap, Target, TrendingUp, TrendingDown, Activity, PieChart,
  BarChart, LineChart, Scatter, Layers, Grid, List, Layout, Columns,
  Rows, Square, Circle, Triangle, Hexagon, Octagon, Diamond, Star,
  Heart, Bookmark, Share, MoreHorizontal, Play, Pause, Stop,
  SkipForward, SkipBack, Volume2, VolumeX, Maximize, Minimize,
  Building2, Calculator, ShoppingCart, BarChart3, ArrowUp, ArrowDown,
  ArrowLeft, ArrowRight, Mail, Phone, Calendar, Clock, MapPin,
  CreditCard, DollarSign, ShoppingBag, Package, Truck, Users,
  FileText, Download, Upload, Copy, Link, ExternalLink, Lock,
  Unlock, Shield, Bell, BellOff, Video, Music
} from 'lucide-react';

const DesignSystem = () => {
  const [isDark, setIsDark] = useState(false);
  const [selectedTab, setSelectedTab] = useState('icons');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectValue, setSelectValue] = useState('');
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [sliderValue, setSliderValue] = useState(50);
  const [switchValue, setSwitchValue] = useState(false);

  const tabs = [
    { id: 'icons', label: 'Иконки', icon: Star },
    { id: 'buttons', label: 'Кнопки', icon: Target },
    { id: 'inputs', label: 'Поля ввода', icon: Edit },
    { id: 'menus', label: 'Меню', icon: MoreHorizontal },
    { id: 'cards', label: 'Карточки', icon: Square },
    { id: 'tables', label: 'Таблицы', icon: Grid },
    { id: 'modals', label: 'Модальные окна', icon: Maximize },
    { id: 'navigation', label: 'Навигация', icon: Home }
  ];

  const iconCategories = [
    {
      title: 'Основные действия',
      icons: [
        { name: 'Просмотр', icon: Eye, color: 'text-blue-500' },
        { name: 'Редактирование', icon: Edit, color: 'text-green-500' },
        { name: 'Удаление', icon: Trash2, color: 'text-red-500' },
        { name: 'Скачивание', icon: Download, color: 'text-purple-500' },
        { name: 'Добавление', icon: Plus, color: 'text-emerald-500' }
      ]
    },
    {
      title: 'Навигация и поиск',
      icons: [
        { name: 'Поиск', icon: Search, color: 'text-gray-500' },
        { name: 'Фильтр', icon: Filter, color: 'text-gray-500' },
        { name: 'Настройки', icon: Settings, color: 'text-gray-500' },
        { name: 'Пользователь', icon: User, color: 'text-gray-500' },
        { name: 'Уведомления', icon: Bell, color: 'text-gray-500' }
      ]
    },
    {
      title: 'Стрелки и направление',
      icons: [
        { name: 'Вверх', icon: ArrowUp, color: 'text-gray-500' },
        { name: 'Вниз', icon: ArrowDown, color: 'text-gray-500' },
        { name: 'Влево', icon: ArrowLeft, color: 'text-gray-500' },
        { name: 'Вправо', icon: ArrowRight, color: 'text-gray-500' },
        { name: 'Раскрыть', icon: ChevronDown, color: 'text-gray-500' }
      ]
    },
    {
      title: 'Статусы и уведомления',
      icons: [
        { name: 'Успех', icon: CheckCircle, color: 'text-green-500' },
        { name: 'Ошибка', icon: XCircle, color: 'text-red-500' },
        { name: 'Предупреждение', icon: AlertTriangle, color: 'text-yellow-500' },
        { name: 'Информация', icon: Info, color: 'text-blue-500' },
        { name: 'Помощь', icon: HelpCircle, color: 'text-gray-500' }
      ]
    },
    {
      title: 'Файлы и документы',
      icons: [
        { name: 'Документ', icon: FileText, color: 'text-gray-500' },
        { name: 'Видео', icon: Video, color: 'text-red-500' },
        { name: 'Музыка', icon: Music, color: 'text-purple-500' },
        { name: 'Загрузка', icon: Upload, color: 'text-blue-500' }
      ]
    },
    {
      title: 'Геометрические фигуры',
      icons: [
        { name: 'Квадрат', icon: Square, color: 'text-gray-500' },
        { name: 'Круг', icon: Circle, color: 'text-gray-500' },
        { name: 'Треугольник', icon: Triangle, color: 'text-gray-500' },
        { name: 'Шестиугольник', icon: Hexagon, color: 'text-gray-500' },
        { name: 'Ромб', icon: Diamond, color: 'text-gray-500' }
      ]
    }
  ];

  const buttonVariants = [
    { name: 'Primary', className: 'btn-glass btn-glass-primary', description: 'Основная кнопка' },
    { name: 'Secondary', className: 'btn-glass btn-glass-secondary', description: 'Вторичная кнопка' },
    { name: 'Success', className: 'btn-glass btn-glass-success', description: 'Успех' },
    { name: 'Warning', className: 'btn-glass btn-glass-warning', description: 'Предупреждение' },
    { name: 'Danger', className: 'btn-glass btn-glass-danger', description: 'Опасность' },
    { name: 'Info', className: 'btn-glass btn-glass-info', description: 'Информация' }
  ];

  const inputTypes = [
    { name: 'Text', type: 'text', placeholder: 'Введите текст' },
    { name: 'Email', type: 'email', placeholder: 'example@email.com' },
    { name: 'Password', type: 'password', placeholder: 'Пароль' },
    { name: 'Number', type: 'number', placeholder: '123' },
    { name: 'Tel', type: 'tel', placeholder: '+7 (999) 123-45-67' }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Дизайн-система CRM
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Полный набор компонентов и стилей для Sofany CRM
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsDark(!isDark)}
                  className="btn-glass btn-glass-md"
                >
                  {isDark ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {isDark ? 'Светлая тема' : 'Темная тема'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      selectedTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Icons Section */}
          {selectedTab === 'icons' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Иконки
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Полная коллекция иконок из библиотеки Lucide React
                </p>
              </div>

              {iconCategories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {category.title}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {category.icons.map((iconItem, iconIndex) => (
                      <div
                        key={iconIndex}
                        className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <iconItem.icon className={`w-6 h-6 ${iconItem.color} mb-2`} />
                        <span className="text-sm text-gray-600 dark:text-gray-400 text-center">
                          {iconItem.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Buttons Section */}
          {selectedTab === 'buttons' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Кнопки
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Различные варианты кнопок с единым стилем
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Основные кнопки
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {buttonVariants.map((variant, index) => (
                    <div key={index} className="text-center">
                      <button className={`${variant.className} mb-2`}>
                        {variant.name}
                      </button>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {variant.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Размеры кнопок
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="btn-glass btn-glass-primary btn-glass-sm">
                    Маленькая
                  </button>
                  <button className="btn-glass btn-glass-primary btn-glass-md">
                    Средняя
                  </button>
                  <button className="btn-glass btn-glass-primary btn-glass-lg">
                    Большая
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Inputs Section */}
          {selectedTab === 'inputs' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Поля ввода
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Различные типы полей ввода с единым стилем
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Типы полей
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {inputTypes.map((input, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {input.name}
                      </label>
                      <input
                        type={input.type}
                        placeholder={input.placeholder}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Select элементы
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Простой select
                    </label>
                    <select className="select-simple">
                      <option>Выберите опцию</option>
                      <option>Опция 1</option>
                      <option>Опция 2</option>
                      <option>Опция 3</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Чекбоксы и радиокнопки
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={checkboxValue}
                      onChange={(e) => setCheckboxValue(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Чекбокс
                    </label>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="radio"
                        value="option1"
                        checked={radioValue === 'option1'}
                        onChange={(e) => setRadioValue(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Радиокнопка 1
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="radio"
                        value="option2"
                        checked={radioValue === 'option2'}
                        onChange={(e) => setRadioValue(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Радиокнопка 2
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Menus Section */}
          {selectedTab === 'menus' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Меню и выпадающие списки
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Различные типы меню и навигации
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Выпадающее меню
                </h3>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="btn-glass btn-glass-md flex items-center space-x-2"
                  >
                    <span>Выберите опцию</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                      <div className="py-1">
                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          Опция 1
                        </button>
                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          Опция 2
                        </button>
                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          Опция 3
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cards Section */}
          {selectedTab === 'cards' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Карточки
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Различные типы карточек для отображения информации
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Простая карточка
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Базовый стиль карточки с тенью и границей
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Карточка с иконкой
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        С иконкой и описанием
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
                  <h3 className="text-lg font-semibold mb-2">
                    Градиентная карточка
                  </h3>
                  <p className="text-blue-100">
                    Карточка с градиентным фоном
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tables Section */}
          {selectedTab === 'tables' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Таблицы
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Стилизованные таблицы для отображения данных
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Название
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        Элемент 1
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          Активен
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                          Редактировать
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        Элемент 2
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                          Ожидает
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                          Редактировать
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modals Section */}
          {selectedTab === 'modals' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Модальные окна
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Различные типы модальных окон
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Примеры модальных окон
                </h3>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Модальные окна используют классы <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">modal-glass</code> и <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">modal-glass-overlay</code>
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Структура модального окна:</strong>
                      <pre className="mt-2 text-xs bg-white dark:bg-gray-800 p-3 rounded border">
{`<div className="modal-glass-overlay">
  <div className="modal-glass">
    <div className="modal-content">
      <!-- Содержимое модального окна -->
    </div>
  </div>
</div>`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Section */}
          {selectedTab === 'navigation' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Навигация
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Компоненты навигации и меню
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Хлебные крошки
                </h3>
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    <li>
                      <div className="flex items-center">
                        <Home className="w-4 h-4 text-gray-400" />
                        <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                          Главная
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                        <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                          Раздел
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                          Текущая страница
                        </span>
                      </div>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignSystem;