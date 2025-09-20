import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  Users, 
  Shield, 
  Bell, 
  Zap, 
  Palette, 
  Database,
  BarChart3,
  HardDrive,
  Activity,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  BookOpen,
  Calculator,
  Wrench,
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { libraryAPI } from '../../services/api';
import './AdminSettings.css';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('library');
  const [loading, setLoading] = useState(false);
  
  // Состояние для библиотеки
  const [libraryData, setLibraryData] = useState({
    materials: [],
    operations: [],
    referenceData: [],
    rates: [],
    categories: {
      materialCategories: [],
      operationCategories: [],
      referenceCategories: [],
      rateCategories: []
    },
    calculatorSettings: [],
    operationCategories: [],
    materialCategories: [],
    activeLibraryTab: 'materials'
  });
  
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [showModal, setShowModal] = useState({
    material: false,
    operation: false,
    referenceData: false,
    rate: false,
    calculatorSettings: false
  });
  
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [settings, setSettings] = useState({});
  const [changes, setChanges] = useState({});
  const [darkMode, setDarkMode] = useState(false);

  // Функции для работы с библиотекой
  const loadLibraryData = useCallback(async () => {
    if (activeTab !== 'library') return;
    setLibraryLoading(true);
    try {
      const [
        materialsRes,
        operationsRes,
        referenceDataRes,
        ratesRes,
        operationCategoriesRes,
        materialCategoriesRes,
        calculatorSettingsRes
      ] = await Promise.all([
        fetch('/api/library/materials'),
        fetch('/api/library/operations'),
        fetch('/api/library/reference-data'),
        fetch('/api/library/rates'),
        fetch('/api/library/operation-categories'),
        fetch('/api/library/material-categories'),
        fetch('/api/library/calculator-settings')
      ]);

      const [
        materials,
        operations,
        referenceData,
        rates,
        operationCategories,
        materialCategories,
        calculatorSettings
      ] = await Promise.all([
        materialsRes.json(),
        operationsRes.json(),
        referenceDataRes.json(),
        ratesRes.json(),
        operationCategoriesRes.json(),
        materialCategoriesRes.json(),
        calculatorSettingsRes.json()
      ]);


      setLibraryData(prev => ({
        ...prev,
        materials: materials || [],
        operations: operations || [],
        referenceData: referenceData || [],
        rates: rates || [],
        operationCategories: operationCategories || [],
        materialCategories: materialCategories || [],
        calculatorSettings: calculatorSettings || []
      }));
    } catch (error) {
      console.error('Ошибка загрузки данных библиотеки:', error);
      setMessage({ type: 'error', text: 'Ошибка загрузки данных библиотеки' });
    } finally {
      setLibraryLoading(false);
    }
  }, [activeTab]);

  // Загружаем данные при переключении на вкладку библиотеки
  useEffect(() => {
    loadLibraryData();
  }, [loadLibraryData]);

  // Функции для CRUD операций
  const handleAdd = (type) => {
    setEditingItem(null);
    setFormData({});
    setShowModal(prev => ({ ...prev, [type]: true }));
  };

  const handleEdit = (type, item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(prev => ({ ...prev, [type]: true }));
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Удалить ${type}?`)) return;

    try {
      const apiMap = {
        material: libraryAPI.deleteMaterial,
        operation: libraryAPI.deleteOperation,
        referenceData: libraryAPI.deleteReferenceData,
        rate: libraryAPI.deleteRate
      };

      await apiMap[type](id);
      setMessage({ type: 'success', text: `${type} удален успешно` });
      loadLibraryData();
    } catch (error) {
      console.error(`Ошибка удаления ${type}:`, error);
      setMessage({ type: 'error', text: `Ошибка удаления ${type}` });
    }
  };

  const handleSave = async (type) => {
    try {
      setLibraryLoading(true);
      const apiMap = {
        material: {
          create: libraryAPI.createMaterial,
          update: libraryAPI.updateMaterial
        },
        operation: {
          create: libraryAPI.createOperation,
          update: libraryAPI.updateOperation
        },
        referenceData: {
          create: libraryAPI.createReferenceData,
          update: libraryAPI.updateReferenceData
        },
        rate: {
          create: libraryAPI.createRate,
          update: libraryAPI.updateRate
        }
      };

      if (editingItem) {
        await apiMap[type].update(editingItem.id, formData);
        setMessage({ type: 'success', text: `${type} обновлен успешно` });
      } else {
        await apiMap[type].create(formData);
        setMessage({ type: 'success', text: `${type} создан успешно` });
      }

      setShowModal(prev => ({ ...prev, [type]: false }));
      await loadLibraryData();
    } catch (error) {
      console.error(`Ошибка сохранения ${type}:`, error);
      setMessage({ type: 'error', text: `Ошибка сохранения ${type}: ${error.response?.data?.message || error.message}` });
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleCalculatorSettingsUpdate = async () => {
    try {
      await libraryAPI.updateCalculatorSettings(formData);
      setMessage({ type: 'success', text: 'Настройки калькулятора обновлены' });
      setShowModal(prev => ({ ...prev, calculatorSettings: false }));
      loadLibraryData();
    } catch (error) {
      console.error('Ошибка обновления настроек калькулятора:', error);
      setMessage({ type: 'error', text: 'Ошибка обновления настроек калькулятора' });
    }
  };

  const tabs = [
    { id: 'overview', name: 'Обзор', icon: BarChart3, color: 'blue' },
    { id: 'system', name: 'Система', icon: Settings, color: 'gray' },
    { id: 'users', name: 'Пользователи', icon: Users, color: 'green' },
    { id: 'security', name: 'Безопасность', icon: Shield, color: 'red' },
    { id: 'modules', name: 'Модули', icon: Database, color: 'purple' },
    { id: 'library', name: 'Библиотека', icon: BookOpen, color: 'emerald' },
    { id: 'notifications', name: 'Уведомления', icon: Bell, color: 'orange' },
    { id: 'integrations', name: 'Интеграции', icon: Zap, color: 'pink' },
    { id: 'appearance', name: 'Внешний вид', icon: Palette, color: 'indigo' },
    { id: 'backup', name: 'Резервные копии', icon: HardDrive, color: 'yellow' },
    { id: 'monitoring', name: 'Мониторинг', icon: Activity, color: 'teal' }
  ];

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let endpoint = '';
      switch (activeTab) {
        case 'overview':
          return; // Обзор не требует загрузки данных
        case 'system':
          endpoint = '/api/admin-settings/system';
          break;
        case 'users':
          endpoint = '/api/admin-settings/users';
          break;
        case 'security':
          endpoint = '/api/admin-settings/security';
          break;
        case 'modules':
          endpoint = '/api/admin-settings/modules';
          break;
        case 'library':
          // Для библиотеки данные загружаются через loadLibraryData
          setLoading(false);
          loadLibraryData();
          return;
        case 'notifications':
          endpoint = '/api/admin-settings/notifications';
          break;
        case 'integrations':
          endpoint = '/api/admin-settings/integrations';
          break;
        case 'appearance':
          endpoint = '/api/admin-settings/appearance';
          break;
        case 'backup':
          endpoint = '/api/admin-settings/backup';
          break;
        case 'monitoring':
          endpoint = '/api/admin-settings/monitoring';
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setSettings(data.data || {});
      } else {
        showMessage('error', data.error || 'Ошибка загрузки настроек');
      }
    } catch (error) {
      showMessage('error', 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSettingChange = (key, value) => {
    setChanges(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin-settings/${activeTab}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(changes)
      });
      
      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Настройки сохранены');
        setChanges({});
        loadSettings();
      } else {
        showMessage('error', data.error || 'Ошибка сохранения');
      }
    } catch (error) {
      showMessage('error', 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="overview-container">
      {/* Приветственная секция */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h2>Добро пожаловать в админ-панель</h2>
          <p>Управляйте системой, настраивайте параметры и отслеживайте производительность</p>
        </div>
        <div className="welcome-actions">
          <button className="btn-glass btn-glass-primary">
            <RefreshCw className="icon" />
            Обновить данные
          </button>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-header">
            <div className="metric-icon">
              <Activity className="icon" />
            </div>
            <div className="metric-info">
              <h3>Статус системы</h3>
              <p>Все сервисы работают</p>
            </div>
          </div>
          <div className="metric-value">
            <span className="status-indicator success"></span>
            <span>Активна</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon">
              <Users className="icon" />
            </div>
            <div className="metric-info">
              <h3>Пользователи</h3>
              <p>Активные сессии</p>
            </div>
          </div>
          <div className="metric-value">
            <span className="number">12</span>
            <span className="subtitle">из 50</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon">
              <Database className="icon" />
            </div>
            <div className="metric-info">
              <h3>База данных</h3>
              <p>Использование</p>
            </div>
          </div>
          <div className="metric-value">
            <span className="number">245 MB</span>
            <span className="subtitle">16% от лимита</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon">
              <BarChart3 className="icon" />
            </div>
            <div className="metric-info">
              <h3>Производительность</h3>
              <p>Загрузка системы</p>
            </div>
          </div>
          <div className="metric-value">
            <span className="number">23%</span>
            <span className="subtitle">CPU</span>
          </div>
        </div>
      </div>

      {/* Детальная информация */}
      <div className="details-grid">
        <div className="details-card">
          <div className="card-header">
            <h3>Информация о системе</h3>
            <Settings className="icon" />
          </div>
          <div className="card-content">
            <div className="info-item">
              <span className="label">Версия</span>
              <span className="value">v2.1.0</span>
            </div>
            <div className="info-item">
              <span className="label">Время работы</span>
              <span className="value">7 дней 12 часов</span>
            </div>
            <div className="info-item">
              <span className="label">Последнее обновление</span>
              <span className="value">2 дня назад</span>
            </div>
            <div className="info-item">
              <span className="label">Следующее обновление</span>
              <span className="value">Через 5 дней</span>
            </div>
          </div>
        </div>

        <div className="details-card">
          <div className="card-header">
            <h3>Активность пользователей</h3>
            <Users className="icon" />
          </div>
          <div className="card-content">
            <div className="info-item">
              <span className="label">Онлайн сейчас</span>
              <span className="value success">3</span>
            </div>
            <div className="info-item">
              <span className="label">За последний час</span>
              <span className="value">8</span>
            </div>
            <div className="info-item">
              <span className="label">За сегодня</span>
              <span className="value">24</span>
            </div>
            <div className="info-item">
              <span className="label">Администраторы</span>
              <span className="value">2</span>
            </div>
          </div>
        </div>

        <div className="details-card">
          <div className="card-header">
            <h3>Производительность</h3>
            <BarChart3 className="icon" />
          </div>
          <div className="card-content">
            <div className="info-item">
              <span className="label">CPU</span>
              <span className="value">23%</span>
            </div>
            <div className="info-item">
              <span className="label">RAM</span>
              <span className="value">1.2 GB / 8 GB</span>
            </div>
            <div className="info-item">
              <span className="label">Диск</span>
              <span className="value">45%</span>
            </div>
            <div className="info-item">
              <span className="label">Запросов/мин</span>
              <span className="value">156</span>
            </div>
          </div>
        </div>

        <div className="details-card">
          <div className="card-header">
            <h3>Быстрые действия</h3>
            <Zap className="icon" />
          </div>
          <div className="card-content">
            <div className="quick-actions">
              <button className="quick-action-btn">
                <Users className="icon" />
                <span>Управление пользователями</span>
              </button>
              <button className="quick-action-btn">
                <Database className="icon" />
                <span>Резервное копирование</span>
              </button>
              <button className="quick-action-btn">
                <Bell className="icon" />
                <span>Настройки уведомлений</span>
              </button>
              <button className="quick-action-btn">
                <Shield className="icon" />
                <span>Безопасность</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="settings-section">
      <h3>Основные настройки</h3>
      <div className="settings-grid">
        <div className="setting-item">
          <label>Название системы</label>
          <input 
            type="text" 
            defaultValue="Sofany CRM"
            onChange={(e) => handleSettingChange('system_name', e.target.value)}
          />
        </div>
        <div className="setting-item">
          <label>Версия</label>
          <input 
            type="text" 
            defaultValue="2.1.0"
            onChange={(e) => handleSettingChange('version', e.target.value)}
          />
        </div>
        <div className="setting-item">
          <label>Временная зона</label>
          <select onChange={(e) => handleSettingChange('timezone', e.target.value)}>
            <option value="Europe/Moscow">Москва (UTC+3)</option>
            <option value="Europe/Kiev">Киев (UTC+2)</option>
            <option value="Europe/Minsk">Минск (UTC+3)</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Язык интерфейса</label>
          <select onChange={(e) => handleSettingChange('language', e.target.value)}>
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="uk">Українська</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Валюта по умолчанию</label>
          <select onChange={(e) => handleSettingChange('default_currency', e.target.value)}>
            <option value="RUB">Рубль (RUB)</option>
            <option value="USD">Доллар (USD)</option>
            <option value="EUR">Евро (EUR)</option>
            <option value="UAH">Гривна (UAH)</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Формат даты</label>
          <select onChange={(e) => handleSettingChange('date_format', e.target.value)}>
            <option value="DD.MM.YYYY">DD.MM.YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>

      <h3>Производительность</h3>
      <div className="settings-grid">
        <div className="setting-item">
          <label>Кэширование</label>
          <div className="toggle">
            <input 
              type="checkbox" 
              id="caching"
              onChange={(e) => handleSettingChange('caching', e.target.checked)}
            />
            <label htmlFor="caching" className="toggle-slider"></label>
          </div>
        </div>
        <div className="setting-item">
          <label>Сжатие данных</label>
          <div className="toggle">
            <input 
              type="checkbox" 
              id="compression"
              onChange={(e) => handleSettingChange('compression', e.target.checked)}
            />
            <label htmlFor="compression" className="toggle-slider"></label>
          </div>
        </div>
        <div className="setting-item">
          <label>Максимальный размер файла (MB)</label>
          <input 
            type="number" 
            defaultValue="50"
            onChange={(e) => handleSettingChange('max_file_size', e.target.value)}
          />
        </div>
        <div className="setting-item">
          <label>Таймаут сессии (минуты)</label>
          <input 
            type="number" 
            defaultValue="120"
            onChange={(e) => handleSettingChange('session_timeout', e.target.value)}
          />
        </div>
        <div className="setting-item">
          <label>Количество записей на странице</label>
          <input 
            type="number" 
            defaultValue="20"
            onChange={(e) => handleSettingChange('records_per_page', e.target.value)}
          />
        </div>
        <div className="setting-item">
          <label>Автосохранение (секунды)</label>
          <input 
            type="number" 
            defaultValue="30"
            onChange={(e) => handleSettingChange('autosave_interval', e.target.value)}
          />
        </div>
      </div>

      <h3>Логирование и мониторинг</h3>
      <div className="settings-grid">
        <div className="setting-item">
          <label>Уровень логирования</label>
          <select onChange={(e) => handleSettingChange('log_level', e.target.value)}>
            <option value="error">Только ошибки</option>
            <option value="warn">Предупреждения и ошибки</option>
            <option value="info">Информация</option>
            <option value="debug">Отладка</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Хранить логи (дни)</label>
          <input 
            type="number" 
            defaultValue="30"
            onChange={(e) => handleSettingChange('log_retention_days', e.target.value)}
          />
        </div>
        <div className="setting-item">
          <label>Мониторинг производительности</label>
          <div className="toggle">
            <input 
              type="checkbox" 
              id="performance_monitoring"
              onChange={(e) => handleSettingChange('performance_monitoring', e.target.checked)}
            />
            <label htmlFor="performance_monitoring" className="toggle-slider"></label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsersSettings = () => (
    <div className="users-management">
      {/* Заголовок и статистика */}
      <div className="users-header">
        <div className="users-title">
          <h2>Управление пользователями</h2>
          <p>Создавайте, редактируйте и управляйте пользователями системы</p>
        </div>
        <div className="users-stats">
          <div className="stat-item">
            <span className="stat-number">12</span>
            <span className="stat-label">Всего пользователей</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">8</span>
            <span className="stat-label">Активных</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">3</span>
            <span className="stat-label">Онлайн</span>
          </div>
        </div>
      </div>

      {/* Панель управления */}
      <div className="users-controls">
        <div className="search-section">
          <div className="search-input">
            <Search className="icon" />
            <input type="text" placeholder="Поиск пользователей..." />
          </div>
          <div className="filter-buttons">
            <button className="filter-btn active">Все</button>
            <button className="filter-btn">Активные</button>
            <button className="filter-btn">Заблокированные</button>
            <button className="filter-btn">Администраторы</button>
          </div>
        </div>
        <div className="action-buttons">
          <button className="btn-glass btn-glass-primary">
            <Plus className="icon" />
            Добавить пользователя
          </button>
          <button className="btn-glass">
            <RefreshCw className="icon" />
            Обновить
          </button>
        </div>
      </div>

      {/* Таблица пользователей */}
      <div className="users-table-container">
        <div className="users-table">
          <div className="table-header">
            <div className="col-user">Пользователь</div>
            <div className="col-role">Роль</div>
            <div className="col-status">Статус</div>
            <div className="col-last-login">Последний вход</div>
            <div className="col-actions">Действия</div>
          </div>
          
          <div className="table-body">
            <div className="user-row">
              <div className="user-info">
                <div className="user-avatar">
                  <span>А</span>
                </div>
                <div className="user-details">
                  <div className="user-name">Администратор</div>
                  <div className="user-email">admin@sofany.com</div>
                </div>
              </div>
              <div className="user-role">
                <span className="role-badge admin">Администратор</span>
              </div>
              <div className="user-status">
                <span className="status-indicator online"></span>
                <span>Онлайн</span>
              </div>
              <div className="user-last-login">
                <span>2 минуты назад</span>
              </div>
              <div className="user-actions">
                <button className="action-btn view" title="Просмотр">
                  <Eye className="icon" />
                </button>
                <button className="action-btn edit" title="Редактировать">
                  <Edit className="icon" />
                </button>
                <button className="action-btn settings" title="Настройки">
                  <Settings className="icon" />
                </button>
                <button className="action-btn delete" title="Удалить">
                  <Trash2 className="icon" />
                </button>
              </div>
            </div>

            <div className="user-row">
              <div className="user-info">
                <div className="user-avatar">
                  <span>М</span>
                </div>
                <div className="user-details">
                  <div className="user-name">Менеджер</div>
                  <div className="user-email">manager@sofany.com</div>
                </div>
              </div>
              <div className="user-role">
                <span className="role-badge manager">Менеджер</span>
              </div>
              <div className="user-status">
                <span className="status-indicator active"></span>
                <span>Активен</span>
              </div>
              <div className="user-last-login">
                <span>1 час назад</span>
              </div>
              <div className="user-actions">
                <button className="action-btn view" title="Просмотр">
                  <Eye className="icon" />
                </button>
                <button className="action-btn edit" title="Редактировать">
                  <Edit className="icon" />
                </button>
                <button className="action-btn settings" title="Настройки">
                  <Settings className="icon" />
                </button>
                <button className="action-btn delete" title="Удалить">
                  <Trash2 className="icon" />
                </button>
              </div>
            </div>

            <div className="user-row">
              <div className="user-info">
                <div className="user-avatar">
                  <span>С</span>
                </div>
                <div className="user-details">
                  <div className="user-name">Сотрудник</div>
                  <div className="user-email">employee@sofany.com</div>
                </div>
              </div>
              <div className="user-role">
                <span className="role-badge employee">Сотрудник</span>
              </div>
              <div className="user-status">
                <span className="status-indicator offline"></span>
                <span>Офлайн</span>
              </div>
              <div className="user-last-login">
                <span>3 дня назад</span>
              </div>
              <div className="user-actions">
                <button className="action-btn view" title="Просмотр">
                  <Eye className="icon" />
                </button>
                <button className="action-btn edit" title="Редактировать">
                  <Edit className="icon" />
                </button>
                <button className="action-btn settings" title="Настройки">
                  <Settings className="icon" />
                </button>
                <button className="action-btn delete" title="Удалить">
                  <Trash2 className="icon" />
                </button>
              </div>
            </div>

            <div className="user-row">
              <div className="user-info">
                <div className="user-avatar">
                  <span>К</span>
                </div>
                <div className="user-details">
                  <div className="user-name">Клиент</div>
                  <div className="user-email">client@sofany.com</div>
                </div>
              </div>
              <div className="user-role">
                <span className="role-badge client">Клиент</span>
              </div>
              <div className="user-status">
                <span className="status-indicator blocked"></span>
                <span>Заблокирован</span>
              </div>
              <div className="user-last-login">
                <span>1 неделю назад</span>
              </div>
              <div className="user-actions">
                <button className="action-btn view" title="Просмотр">
                  <Eye className="icon" />
                </button>
                <button className="action-btn edit" title="Редактировать">
                  <Edit className="icon" />
                </button>
                <button className="action-btn settings" title="Настройки">
                  <Settings className="icon" />
                </button>
                <button className="action-btn delete" title="Удалить">
                  <Trash2 className="icon" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Пагинация */}
      <div className="users-pagination">
        <div className="pagination-info">
          <span>Показано 4 из 12 пользователей</span>
        </div>
        <div className="pagination-controls">
          <button className="pagination-btn" disabled>
            <ChevronLeft className="icon" />
          </button>
          <button className="pagination-btn active">1</button>
          <button className="pagination-btn">2</button>
          <button className="pagination-btn">3</button>
          <button className="pagination-btn">
            <ChevronRight className="icon" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-section">
      <h3>Политика безопасности</h3>
      <div className="settings-grid">
        <div className="setting-item">
          <label>Минимальная длина пароля</label>
          <input 
            type="number" 
            defaultValue="8"
            onChange={(e) => handleSettingChange('min_password_length', e.target.value)}
          />
        </div>
        <div className="setting-item">
          <label>Срок действия пароля (дни)</label>
          <input 
            type="number" 
            defaultValue="90"
            onChange={(e) => handleSettingChange('password_expiry', e.target.value)}
          />
        </div>
        <div className="setting-item">
          <label>Максимальное количество попыток входа</label>
          <input 
            type="number" 
            defaultValue="5"
            onChange={(e) => handleSettingChange('max_login_attempts', e.target.value)}
          />
        </div>
        <div className="setting-item">
          <label>Блокировка аккаунта (минуты)</label>
          <input 
            type="number" 
            defaultValue="15"
            onChange={(e) => handleSettingChange('lockout_duration', e.target.value)}
          />
        </div>
      </div>

      <h3>Двухфакторная аутентификация</h3>
      <div className="settings-grid">
        <div className="setting-item">
          <label>Включить 2FA</label>
          <div className="toggle">
            <input 
              type="checkbox" 
              id="2fa"
              onChange={(e) => handleSettingChange('2fa_enabled', e.target.checked)}
            />
            <label htmlFor="2fa" className="toggle-slider"></label>
          </div>
        </div>
        <div className="setting-item">
          <label>Обязательная 2FA для администраторов</label>
          <div className="toggle">
            <input 
              type="checkbox" 
              id="2fa_admin"
              onChange={(e) => handleSettingChange('2fa_admin_required', e.target.checked)}
            />
            <label htmlFor="2fa_admin" className="toggle-slider"></label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModulesSettings = () => (
    <div className="settings-section">
      <h3>Настройки модулей</h3>
      <div className="modules-grid">
        <div className="module-card">
          <h4>Заказы</h4>
          <div className="module-settings">
            <div className="setting-item">
              <label>Автоматическая нумерация заказов</label>
              <div className="toggle">
                <input type="checkbox" id="orders_auto_numbering" />
                <label htmlFor="orders_auto_numbering" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Префикс номера заказа</label>
              <input type="text" defaultValue="SOF" />
            </div>
            <div className="setting-item">
              <label>Автоматическое назначение менеджера</label>
              <div className="toggle">
                <input type="checkbox" id="orders_auto_assign" />
                <label htmlFor="orders_auto_assign" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Уведомления о новых заказах</label>
              <div className="toggle">
                <input type="checkbox" id="orders_notifications" />
                <label htmlFor="orders_notifications" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Автоматическое создание задач</label>
              <div className="toggle">
                <input type="checkbox" id="orders_auto_tasks" />
                <label htmlFor="orders_auto_tasks" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Срок выполнения по умолчанию (дни)</label>
              <input type="number" defaultValue="14" />
            </div>
          </div>
        </div>

        <div className="module-card">
          <h4>Клиенты</h4>
          <div className="module-settings">
            <div className="setting-item">
              <label>Автоматическая сегментация</label>
              <div className="toggle">
                <input type="checkbox" id="customers_auto_segmentation" />
                <label htmlFor="customers_auto_segmentation" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Дублирование клиентов</label>
              <div className="toggle">
                <input type="checkbox" id="customers_duplicate_check" />
                <label htmlFor="customers_duplicate_check" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Автоматическое обновление контактов</label>
              <div className="toggle">
                <input type="checkbox" id="customers_auto_update" />
                <label htmlFor="customers_auto_update" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Интеграция с 1С</label>
              <div className="toggle">
                <input type="checkbox" id="customers_1c_integration" />
                <label htmlFor="customers_1c_integration" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Синхронизация с CRM</label>
              <div className="toggle">
                <input type="checkbox" id="customers_crm_sync" />
                <label htmlFor="customers_crm_sync" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Автоматические напоминания</label>
              <div className="toggle">
                <input type="checkbox" id="customers_auto_reminders" />
                <label htmlFor="customers_auto_reminders" className="toggle-slider"></label>
              </div>
            </div>
          </div>
        </div>

        <div className="module-card">
          <h4>Материалы</h4>
          <div className="module-settings">
            <div className="setting-item">
              <label>Автоматическое обновление цен</label>
              <div className="toggle">
                <input type="checkbox" id="materials_auto_price_update" />
                <label htmlFor="materials_auto_price_update" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Уведомления о низких остатках</label>
              <div className="toggle">
                <input type="checkbox" id="materials_low_stock_alerts" />
                <label htmlFor="materials_low_stock_alerts" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Минимальный остаток для уведомления</label>
              <input type="number" defaultValue="10" />
            </div>
            <div className="setting-item">
              <label>Автоматическое списание</label>
              <div className="toggle">
                <input type="checkbox" id="materials_auto_writeoff" />
                <label htmlFor="materials_auto_writeoff" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Интеграция с поставщиками</label>
              <div className="toggle">
                <input type="checkbox" id="materials_supplier_integration" />
                <label htmlFor="materials_supplier_integration" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Автоматический заказ материалов</label>
              <div className="toggle">
                <input type="checkbox" id="materials_auto_order" />
                <label htmlFor="materials_auto_order" className="toggle-slider"></label>
              </div>
            </div>
          </div>
        </div>

        <div className="module-card">
          <h4>Производство</h4>
          <div className="module-settings">
            <div className="setting-item">
              <label>Автоматическое планирование</label>
              <div className="toggle">
                <input type="checkbox" id="production_auto_planning" />
                <label htmlFor="production_auto_planning" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Контроль материалов</label>
              <div className="toggle">
                <input type="checkbox" id="production_material_control" />
                <label htmlFor="production_material_control" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Уведомления о блокировках</label>
              <div className="toggle">
                <input type="checkbox" id="production_block_notifications" />
                <label htmlFor="production_block_notifications" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Автоматическое назначение ресурсов</label>
              <div className="toggle">
                <input type="checkbox" id="production_auto_assign" />
                <label htmlFor="production_auto_assign" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Контроль качества</label>
              <div className="toggle">
                <input type="checkbox" id="production_quality_control" />
                <label htmlFor="production_quality_control" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Отслеживание времени</label>
              <div className="toggle">
                <input type="checkbox" id="production_time_tracking" />
                <label htmlFor="production_time_tracking" className="toggle-slider"></label>
              </div>
            </div>
          </div>
        </div>

        <div className="module-card">
          <h4>Канбан-доска</h4>
          <div className="module-settings">
            <div className="setting-item">
              <label>Автоматическое перемещение карточек</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_auto_move" />
                <label htmlFor="kanban_auto_move" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Цветовая индикация приоритета</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_priority_colors" />
                <label htmlFor="kanban_priority_colors" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Цветовая индикация просрочки</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_overdue_colors" />
                <label htmlFor="kanban_overdue_colors" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Цветовая индикация блокировок</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_block_colors" />
                <label htmlFor="kanban_block_colors" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Показывать прогресс выполнения (%)</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_progress_bars" />
                <label htmlFor="kanban_progress_bars" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Показывать время в колонке</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_time_display" />
                <label htmlFor="kanban_time_display" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Автоматическое обновление (секунды)</label>
              <input type="number" defaultValue="30" />
            </div>
            <div className="setting-item">
              <label>Максимальное количество карточек в колонке</label>
              <input type="number" defaultValue="50" />
            </div>
            <div className="setting-item">
              <label>Разрешить перетаскивание между колонками</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_drag_drop" />
                <label htmlFor="kanban_drag_drop" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Подтверждение при перемещении</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_move_confirmation" />
                <label htmlFor="kanban_move_confirmation" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Фильтрация по пользователю</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_user_filter" />
                <label htmlFor="kanban_user_filter" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Фильтрация по приоритету</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_priority_filter" />
                <label htmlFor="kanban_priority_filter" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Фильтрация по дате создания</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_date_filter" />
                <label htmlFor="kanban_date_filter" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Сортировка по умолчанию</label>
              <select>
                <option value="priority">По приоритету</option>
                <option value="created_at">По дате создания</option>
                <option value="deadline">По сроку выполнения</option>
                <option value="customer">По клиенту</option>
                <option value="manager">По менеджеру</option>
              </select>
            </div>
            <div className="setting-item">
              <label>Показывать миниатюры изображений</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_thumbnails" />
                <label htmlFor="kanban_thumbnails" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Показывать теги на карточках</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_tags" />
                <label htmlFor="kanban_tags" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Показывать комментарии на карточках</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_comments" />
                <label htmlFor="kanban_comments" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Показывать вложения на карточках</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_attachments" />
                <label htmlFor="kanban_attachments" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Компактный режим карточек</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_compact_mode" />
                <label htmlFor="kanban_compact_mode" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Показывать статистику по колонкам</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_column_stats" />
                <label htmlFor="kanban_column_stats" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Показывать время выполнения этапа</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_stage_time" />
                <label htmlFor="kanban_stage_time" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Уведомления при изменении статуса</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_status_notifications" />
                <label htmlFor="kanban_status_notifications" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Уведомления при приближении дедлайна</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_deadline_notifications" />
                <label htmlFor="kanban_deadline_notifications" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>За сколько дней уведомлять о дедлайне</label>
              <input type="number" defaultValue="3" />
            </div>
            <div className="setting-item">
              <label>Разрешить массовые операции</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_bulk_operations" />
                <label htmlFor="kanban_bulk_operations" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Разрешить архивирование карточек</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_archive" />
                <label htmlFor="kanban_archive" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Автоматическое архивирование завершенных (дни)</label>
              <input type="number" defaultValue="30" />
            </div>
            <div className="setting-item">
              <label>Показывать историю изменений</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_history" />
                <label htmlFor="kanban_history" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Экспорт в Excel</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_excel_export" />
                <label htmlFor="kanban_excel_export" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Экспорт в PDF</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_pdf_export" />
                <label htmlFor="kanban_pdf_export" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Печать Канбан-доски</label>
              <div className="toggle">
                <input type="checkbox" id="kanban_print" />
                <label htmlFor="kanban_print" className="toggle-slider"></label>
              </div>
            </div>
          </div>
        </div>

        <div className="module-card">
          <h4>Финансы</h4>
          <div className="module-settings">
            <div className="setting-item">
              <label>Автоматический расчет стоимости</label>
              <div className="toggle">
                <input type="checkbox" id="finance_auto_calculation" />
                <label htmlFor="finance_auto_calculation" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>НДС включен в цену</label>
              <div className="toggle">
                <input type="checkbox" id="finance_vat_included" />
                <label htmlFor="finance_vat_included" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Ставка НДС (%)</label>
              <input type="number" defaultValue="20" />
            </div>
            <div className="setting-item">
              <label>Автоматическое выставление счетов</label>
              <div className="toggle">
                <input type="checkbox" id="finance_auto_invoicing" />
                <label htmlFor="finance_auto_invoicing" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Интеграция с банком</label>
              <div className="toggle">
                <input type="checkbox" id="finance_bank_integration" />
                <label htmlFor="finance_bank_integration" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Автоматическое списание</label>
              <div className="toggle">
                <input type="checkbox" id="finance_auto_writeoff" />
                <label htmlFor="finance_auto_writeoff" className="toggle-slider"></label>
              </div>
            </div>
          </div>
        </div>

        <div className="module-card">
          <h4>Уведомления</h4>
          <div className="module-settings">
            <div className="setting-item">
              <label>Email уведомления</label>
              <div className="toggle">
                <input type="checkbox" id="notifications_email" />
                <label htmlFor="notifications_email" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>SMS уведомления</label>
              <div className="toggle">
                <input type="checkbox" id="notifications_sms" />
                <label htmlFor="notifications_sms" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Push уведомления</label>
              <div className="toggle">
                <input type="checkbox" id="notifications_push" />
                <label htmlFor="notifications_push" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Telegram уведомления</label>
              <div className="toggle">
                <input type="checkbox" id="notifications_telegram" />
                <label htmlFor="notifications_telegram" className="toggle-slider"></label>
              </div>
            </div>
            <div className="setting-item">
              <label>Время отправки (часы)</label>
              <input type="time" defaultValue="09:00" />
            </div>
            <div className="setting-item">
              <label>Частота уведомлений</label>
              <select>
                <option value="immediate">Немедленно</option>
                <option value="hourly">Каждый час</option>
                <option value="daily">Ежедневно</option>
                <option value="weekly">Еженедельно</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="settings-section">
      <h3>Настройки внешнего вида</h3>
      <div className="settings-grid">
        <div className="setting-item">
          <label>Тема оформления</label>
          <select>
            <option value="light">Светлая</option>
            <option value="dark">Темная</option>
            <option value="auto">Автоматически</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Цветовая схема</label>
          <select>
            <option value="teal">Бирюзовая</option>
            <option value="blue">Синяя</option>
            <option value="green">Зеленая</option>
            <option value="purple">Фиолетовая</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Размер шрифта</label>
          <select>
            <option value="small">Мелкий</option>
            <option value="medium">Средний</option>
            <option value="large">Крупный</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Плотность интерфейса</label>
          <select>
            <option value="compact">Компактная</option>
            <option value="normal">Обычная</option>
            <option value="spacious">Просторная</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Анимации</label>
          <div className="toggle">
            <input type="checkbox" id="animations" defaultChecked />
            <label htmlFor="animations" className="toggle-slider"></label>
          </div>
        </div>
        <div className="setting-item">
          <label>Скругление углов</label>
          <div className="toggle">
            <input type="checkbox" id="rounded_corners" defaultChecked />
            <label htmlFor="rounded_corners" className="toggle-slider"></label>
          </div>
        </div>
        <div className="setting-item">
          <label>Тени элементов</label>
          <div className="toggle">
            <input type="checkbox" id="shadows" defaultChecked />
            <label htmlFor="shadows" className="toggle-slider"></label>
          </div>
        </div>
        <div className="setting-item">
          <label>Градиенты</label>
          <div className="toggle">
            <input type="checkbox" id="gradients" defaultChecked />
            <label htmlFor="gradients" className="toggle-slider"></label>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Дизайн-система</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Новая дизайн-система</label>
            <div className="flex items-center gap-4">
              <a 
                href="/modern-design-system" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-glass btn-glass-primary btn-glass-md flex items-center gap-2"
              >
                <Palette className="h-4 w-4" />
                Открыть дизайн-систему
              </a>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Современные компоненты и стили
              </span>
            </div>
          </div>
          <div className="setting-item">
            <label>Старая дизайн-система</label>
            <div className="flex items-center gap-4">
              <a 
                href="/design-system" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-glass btn-glass-secondary btn-glass-md flex items-center gap-2"
              >
                <Palette className="h-4 w-4" />
                Открыть старую версию
              </a>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Классические компоненты
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLibrarySettings = () => {
    if (libraryLoading) {
      return (
        <div className="library-loading">
          <div className="loading-spinner"></div>
          <p>Загрузка данных библиотеки...</p>
        </div>
      );
    }

    return (
      <div className="library-management">
        {/* Заголовок и описание */}
        <div className="library-header">
          <div className="library-title">
            <h2>Библиотека калькулятора</h2>
            <p>Управление справочными данными для расчета стоимости мебели: материалы, операции, размеры и расценки</p>
          </div>
          <div className="library-actions">
            <button 
              onClick={() => handleAdd('material')}
              style={{
                backgroundColor: '#10B981',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s',
                marginBottom: '20px'
              }}
            >
              <Plus className="h-5 w-5" />
              🚀 Добавить материал
            </button>
          </div>
        </div>

        {/* Вкладки библиотеки */}
        <div className="library-tabs">
          <button 
            className={`library-tab ${libraryData.activeLibraryTab === 'materials' ? 'active' : ''}`}
            onClick={() => setLibraryData(prev => ({ ...prev, activeLibraryTab: 'materials' }))}
          >
            📦 Материалы
          </button>
          <button 
            className={`library-tab ${libraryData.activeLibraryTab === 'operations' ? 'active' : ''}`}
            onClick={() => setLibraryData(prev => ({ ...prev, activeLibraryTab: 'operations' }))}
          >
            ⚙️ Операции
          </button>
          <button 
            className={`library-tab ${libraryData.activeLibraryTab === 'reference' ? 'active' : ''}`}
            onClick={() => setLibraryData(prev => ({ ...prev, activeLibraryTab: 'reference' }))}
          >
            📊 Справочные данные
          </button>
          <button 
            className={`library-tab ${libraryData.activeLibraryTab === 'rates' ? 'active' : ''}`}
            onClick={() => setLibraryData(prev => ({ ...prev, activeLibraryTab: 'rates' }))}
          >
            💰 Расценки
          </button>
          <button 
            className={`library-tab ${libraryData.activeLibraryTab === 'categories' ? 'active' : ''}`}
            onClick={() => setLibraryData(prev => ({ ...prev, activeLibraryTab: 'categories' }))}
          >
            🏷️ Категории
          </button>
          <button 
            className={`library-tab ${libraryData.activeLibraryTab === 'settings' ? 'active' : ''}`}
            onClick={() => setLibraryData(prev => ({ ...prev, activeLibraryTab: 'settings' }))}
          >
            ⚙️ Настройки калькулятора
          </button>
        </div>

        {/* Материалы */}
        <div className="library-section">
          <div className="section-header">
            <div className="section-title">
              <h3>📦 Материалы</h3>
              <p>Справочник материалов для изготовления мебели с ценами и единицами измерения</p>
            </div>
            <button 
              className="btn-glass btn-glass-primary btn-glass-md flex items-center gap-2"
              onClick={() => handleAdd('material')}
              style={{
                backgroundColor: '#3B82F6',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
            >
              <Plus className="h-4 w-4" />
              Добавить материал
            </button>
          </div>
          <div className="library-table">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Название материала</th>
                  <th>Тип</th>
                  <th>Единица измерения</th>
                  <th>Цена за единицу</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {(libraryData.materials || []).map((material) => (
                  <tr key={material.id}>
                    <td>{material.name}</td>
                    <td>{material.category_name || 'Без категории'}</td>
                    <td>{material.unit}</td>
                    <td>{material.price_per_unit ? parseFloat(material.price_per_unit).toLocaleString() : '0'} ₽</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="icon-action icon-action-primary" 
                          title="Просмотр материала"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit('material', material);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="icon-action icon-action-success" 
                          title="Редактировать материал"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit('material', material);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="icon-action icon-action-danger" 
                          title="Удалить материал"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete('material', material.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {libraryData.materials.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-500 py-8">
                      Материалы не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Операции */}
        <div className="library-section">
          <div className="section-header">
            <div className="section-title">
              <h3>🔧 Операции</h3>
              <p>Справочник операций изготовления с временными нормами и стоимостью работ</p>
            </div>
            <button 
              className="btn-glass btn-glass-primary btn-glass-md flex items-center gap-2"
              onClick={() => handleAdd('operation')}
              style={{
                backgroundColor: '#3B82F6',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
            >
              <Plus className="h-4 w-4" />
              Добавить операцию
            </button>
          </div>
          <div className="library-table">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Название операции</th>
                  <th>Тип работ</th>
                  <th>Время выполнения (мин)</th>
                  <th>Стоимость (₽/час)</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {(libraryData.operations || []).map((operation) => (
                  <tr key={operation.id}>
                    <td>{operation.name}</td>
                    <td>{operation.category_name || 'Без категории'}</td>
                    <td>{operation.time_norm_minutes || 0} мин</td>
                    <td>{operation.price_per_unit ? parseFloat(operation.price_per_unit).toLocaleString() : '0'} ₽/час</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="icon-action icon-action-primary" 
                          title="Просмотр операции"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit('operation', operation);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="icon-action icon-action-success" 
                          title="Редактировать операцию"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit('operation', operation);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="icon-action icon-action-danger" 
                          title="Удалить операцию"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete('operation', operation.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {libraryData.operations.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-500 py-8">
                      Операции не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Справочные данные */}
        <div className="library-section">
          <div className="section-header">
            <div className="section-title">
              <h3>📏 Справочные данные</h3>
              <p>Стандартные размеры, константы и справочные значения для расчетов</p>
            </div>
            <button 
              className="btn-glass btn-glass-primary btn-glass-md flex items-center gap-2"
              onClick={() => handleAdd('referenceData')}
            >
              <Plus className="h-4 w-4" />
              Добавить данные
            </button>
          </div>
          <div className="library-table">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Категория</th>
                  <th>Значение</th>
                  <th>Единица</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {(libraryData.referenceData || []).map((data) => (
                  <tr key={data.id}>
                    <td>{data.name}</td>
                    <td>{data.category_name || 'Без категории'}</td>
                    <td>{data.value}</td>
                    <td>{data.unit}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="icon-action icon-action-primary" 
                          title="Просмотр данных"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit('referenceData', data);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="icon-action icon-action-success" 
                          title="Редактировать данные"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit('referenceData', data);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="icon-action icon-action-danger" 
                          title="Удалить данные"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete('referenceData', data.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {libraryData.referenceData.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-500 py-8">
                      Справочные данные не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Расценки */}
        <div className="library-section">
          <div className="section-header">
            <div className="section-title">
              <h3>💰 Расценки</h3>
              <p>Справочник расценок на работы для расчета стоимости изготовления</p>
            </div>
            <button 
              className="btn-glass btn-glass-primary btn-glass-md flex items-center gap-2"
              onClick={() => handleAdd('rate')}
            >
              <Plus className="h-4 w-4" />
              Добавить расценку
            </button>
          </div>
          <div className="library-table">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Название расценки</th>
                  <th>Тип работ</th>
                  <th>Стоимость за единицу</th>
                  <th>Единица измерения</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {(libraryData.rates || []).map((rate) => (
                  <tr key={rate.id}>
                    <td>{rate.name}</td>
                    <td>{rate.category_name || 'Без категории'}</td>
                    <td>{rate.rate_value ? parseFloat(rate.rate_value).toLocaleString() : '0'} ₽</td>
                    <td>{rate.unit}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="icon-action icon-action-primary" 
                          title="Просмотр расценки"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit('rate', rate);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="icon-action icon-action-success" 
                          title="Редактировать расценку"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit('rate', rate);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="icon-action icon-action-danger" 
                          title="Удалить расценку"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete('rate', rate.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {libraryData.rates.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-500 py-8">
                      Расценки не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Настройки калькулятора */}
        <div className="library-section">
          <div className="section-header">
            <div className="section-title">
              <h3>⚙️ Настройки калькулятора</h3>
              <p>Параметры расчета стоимости: наценки, НДС, доставка и другие коэффициенты</p>
            </div>
            <button 
              className="btn-glass btn-glass-primary btn-glass-md flex items-center gap-2"
              onClick={() => {
                setFormData(Array.isArray(libraryData.calculatorSettings) ? libraryData.calculatorSettings : []);
                setShowModal(prev => ({ ...prev, calculatorSettings: true }));
              }}
            >
              <Calculator className="h-4 w-4" />
              Настроить калькулятор
            </button>
          </div>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Коэффициент наценки (%)</label>
              <input 
                type="number" 
                value={Array.isArray(libraryData.calculatorSettings) ? libraryData.calculatorSettings.find(s => s.setting_name === 'default_markup_percentage')?.setting_value || 30 : 30} 
                min="0" 
                max="100" 
                step="1" 
                disabled
              />
              <small>Процент наценки к себестоимости для получения прибыли</small>
            </div>
            <div className="setting-item">
              <label>НДС (%)</label>
              <input 
                type="number" 
                value={Array.isArray(libraryData.calculatorSettings) ? libraryData.calculatorSettings.find(s => s.setting_name === 'vat_rate')?.setting_value || 20 : 20} 
                min="0" 
                max="100" 
                step="1" 
                disabled
              />
              <small>Налог на добавленную стоимость</small>
            </div>
            <div className="setting-item">
              <label>Коэффициент сложности</label>
              <input 
                type="number" 
                value={Array.isArray(libraryData.calculatorSettings) ? libraryData.calculatorSettings.find(s => s.setting_name === 'complexity_factor')?.setting_value || 1.1 : 1.1} 
                min="0" 
                step="0.1" 
                disabled
              />
              <small>Общий коэффициент сложности для калькулятора</small>
            </div>
            <div className="setting-item">
              <label>Процент накладных расходов (%)</label>
              <input 
                type="number" 
                value={Array.isArray(libraryData.calculatorSettings) ? libraryData.calculatorSettings.find(s => s.setting_name === 'overhead_percentage')?.setting_value || 15 : 15} 
                min="0" 
                step="1" 
                disabled
              />
              <small>Процент накладных расходов</small>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'system':
        return renderSystemSettings();
      case 'users':
        return renderUsersSettings();
      case 'security':
        return renderSecuritySettings();
      case 'modules':
        return renderModulesSettings();
      case 'library':
        return renderLibrarySettings();
      case 'appearance':
        return renderAppearanceSettings();
      default:
        return (
          <div className="empty-state">
            <Settings className="icon" />
            <h3>Настройки модуля</h3>
            <p>Настройки для этого модуля будут доступны в следующих версиях</p>
          </div>
        );
    }
  };

  return (
    <div className={`admin-settings ${darkMode ? 'dark' : ''}`}>
      <div className="admin-header">
        <div className="header-left">
          <h1 className="text-gray-900 dark:text-gray-100">Административная панель</h1>
          <p className="text-gray-600 dark:text-gray-400">Управление системой и настройками</p>
        </div>
        <div className="header-right">
          <button 
            className="btn-glass btn-glass-md flex items-center"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <Eye /> : <EyeOff />}
            {darkMode ? 'Светлая тема' : 'Темная тема'}
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-sidebar">
          <nav className="admin-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''} tab-${tab.color}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="icon" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="admin-main">
          {message.text && (
            <div className={`message message-${message.type}`}>
              {message.type === 'success' && <CheckCircle className="icon" />}
              {message.type === 'error' && <AlertTriangle className="icon" />}
              {message.text}
              <button onClick={() => setMessage({ type: '', text: '' })}>
                <X />
              </button>
            </div>
          )}

          <div className="content-header">
            <h2>{tabs.find(t => t.id === activeTab)?.name}</h2>
            {Object.keys(changes).length > 0 && (
              <div className="unsaved-changes">
                <AlertTriangle className="icon" />
                <span>Есть несохраненные изменения</span>
                <button className="btn-glass btn-glass-primary btn-glass-md flex items-center" onClick={saveSettings}>
                  <Save className="icon" />
                  Сохранить
                </button>
              </div>
            )}
          </div>

          <div className="content-body">
            {loading ? (
              <div className="loading">
                <RefreshCw className="spinner" />
                <span>Загрузка...</span>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </div>
      </div>

      {/* Модальные окна для библиотеки */}
      {showModal.material && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Редактировать материал' : 'Добавить материал'}</h3>
              <button onClick={() => setShowModal(prev => ({ ...prev, material: false }))}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название материала</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Введите название материала"
                />
              </div>
              <div className="form-group">
                <label>Категория</label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                >
                  <option value="">Выберите категорию</option>
                  {(libraryData.materialCategories || []).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Единица измерения</label>
                <input
                  type="text"
                  value={formData.unit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="м², м, шт, кг, л"
                />
              </div>
              <div className="form-group">
                <label>Цена за единицу (₽)</label>
                <input
                  type="number"
                  value={formData.price_per_unit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_per_unit: parseFloat(e.target.value) }))}
                  placeholder="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Примечания</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Примечания к материалу"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowModal(prev => ({ ...prev, material: false }))}
              >
                Отмена
              </button>
              <button 
                className="btn-primary" 
                onClick={() => handleSave('material')}
              >
                {editingItem ? 'Обновить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для операций */}
      {showModal.operation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Редактировать операцию' : 'Добавить операцию'}</h3>
              <button onClick={() => setShowModal(prev => ({ ...prev, operation: false }))}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название операции</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Введите название операции"
                />
              </div>
              <div className="form-group">
                <label>Категория</label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                >
                  <option value="">Выберите категорию</option>
                  {(libraryData.operationCategories || []).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Время выполнения (минуты)</label>
                <input
                  type="number"
                  value={formData.time_norm_minutes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, time_norm_minutes: parseInt(e.target.value) }))}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Стоимость за час (₽)</label>
                <input
                  type="number"
                  value={formData.price_per_unit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_per_unit: parseFloat(e.target.value) }))}
                  placeholder="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Примечания</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Примечания к операции"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowModal(prev => ({ ...prev, operation: false }))}
              >
                Отмена
              </button>
              <button 
                className="btn-primary" 
                onClick={() => handleSave('operation')}
              >
                {editingItem ? 'Обновить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для справочных данных */}
      {showModal.referenceData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Редактировать данные' : 'Добавить данные'}</h3>
              <button onClick={() => setShowModal(prev => ({ ...prev, referenceData: false }))}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Введите название"
                />
              </div>
              <div className="form-group">
                <label>Категория</label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                >
                  <option value="">Выберите категорию</option>
                  {(libraryData.referenceData || []).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Значение</label>
                <input
                  type="number"
                  value={formData.value || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                  placeholder="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Единица измерения</label>
                <input
                  type="text"
                  value={formData.unit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="см, м, кг, %"
                />
              </div>
              <div className="form-group">
                <label>Примечания</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Примечания к данным"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowModal(prev => ({ ...prev, referenceData: false }))}
              >
                Отмена
              </button>
              <button 
                className="btn-primary" 
                onClick={() => handleSave('referenceData')}
              >
                {editingItem ? 'Обновить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для расценок */}
      {showModal.rate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Редактировать расценку' : 'Добавить расценку'}</h3>
              <button onClick={() => setShowModal(prev => ({ ...prev, rate: false }))}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название расценки</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Введите название расценки"
                />
              </div>
              <div className="form-group">
                <label>Категория</label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                >
                  <option value="">Выберите категорию</option>
                  {(libraryData.rates || []).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Стоимость за единицу (₽)</label>
                <input
                  type="number"
                  value={formData.rate_value || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, rate_value: parseFloat(e.target.value) }))}
                  placeholder="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Единица измерения</label>
                <input
                  type="text"
                  value={formData.unit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="шт, м², м, кг"
                />
              </div>
              <div className="form-group">
                <label>Примечания</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Примечания к расценке"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowModal(prev => ({ ...prev, rate: false }))}
              >
                Отмена
              </button>
              <button 
                className="btn-primary" 
                onClick={() => handleSave('rate')}
              >
                {editingItem ? 'Обновить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для настроек калькулятора */}
      {showModal.calculatorSettings && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Настройки калькулятора</h3>
              <button onClick={() => setShowModal(prev => ({ ...prev, calculatorSettings: false }))}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Коэффициент наценки (%)</label>
                <input
                  type="number"
                  value={formData.markup_coefficient?.value || 30}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    markup_coefficient: { ...prev.markup_coefficient, value: parseFloat(e.target.value) }
                  }))}
                  min="0"
                  max="100"
                  step="1"
                />
                <small>Процент наценки к себестоимости для получения прибыли</small>
              </div>
              <div className="form-group">
                <label>Минимальная прибыль (%)</label>
                <input
                  type="number"
                  value={formData.min_profit?.value || 20}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    min_profit: { ...prev.min_profit, value: parseFloat(e.target.value) }
                  }))}
                  min="0"
                  max="100"
                  step="1"
                />
                <small>Минимальный процент прибыли от общей стоимости</small>
              </div>
              <div className="form-group">
                <label>НДС (%)</label>
                <input
                  type="number"
                  value={formData.vat_rate?.value || 20}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    vat_rate: { ...prev.vat_rate, value: parseFloat(e.target.value) }
                  }))}
                  min="0"
                  max="100"
                  step="1"
                />
                <small>Налог на добавленную стоимость</small>
              </div>
              <div className="form-group">
                <label>Стоимость доставки (₽)</label>
                <input
                  type="number"
                  value={formData.delivery_cost?.value || 2000}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    delivery_cost: { ...prev.delivery_cost, value: parseFloat(e.target.value) }
                  }))}
                  min="0"
                  step="100"
                />
                <small>Базовая стоимость доставки заказа</small>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowModal(prev => ({ ...prev, calculatorSettings: false }))}
              >
                Отмена
              </button>
              <button 
                className="btn-primary" 
                onClick={handleCalculatorSettingsUpdate}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Сообщения */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
