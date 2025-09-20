import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  ArrowLeft, 
  Printer,
  FileText,
  Upload,
  X,
  Image as ImageIcon,
  Flame,
  Download
} from 'lucide-react';
import { ordersAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import QRCodeImage from '../../components/QRCodeImage';

const OrderSpecification = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Загрузка данных заказа
  const { data: order, isLoading, error } = useQuery(
    ['order', id],
    () => ordersAPI.getById(id),
    {
      enabled: !!id
    }
  );

  // Загрузка позиций заказа
  const { data: orderItems, isLoading: itemsLoading } = useQuery(
    ['orderItems', id],
    () => ordersAPI.getById(id).then(response => response.items || []),
    {
      enabled: !!id
    }
  );

  // Данные спецификации (можно расширить из API)
  const [specification, setSpecification] = useState({
    productName: 'ДИВАН CHESTERFIELD',
    orderNumber: '',
    materials: {
      upholstery: '',
      supports: '',
      hardness: '',
      decor: '',
      mechanism: ''
    },
    dimensions: {
      width: '',
      depth: '',
      height: '',
      seatWidth: '',
      seatDepth: '',
      seatHeight: ''
    },
    comments: '',
    createdDate: new Date().toISOString().split('T')[0],
    deadline: '',
    priority: 'normal' // urgent, high, normal, low
  });

  // Состояние для загруженных изображений
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);


  // Константы для приоритетов
  const priorities = [
    { id: 'urgent', name: 'Срочный', color: 'red', icon: Flame },
    { id: 'high', name: 'Высокий', color: 'orange', icon: Flame },
    { id: 'normal', name: 'Нормальный', color: 'blue', icon: Flame },
    { id: 'low', name: 'Низкий', color: 'gray', icon: Flame }
  ];

  // Инициализация данных из заказа
  useEffect(() => {
    if (order) {
      setSpecification(prev => ({
        ...prev,
        orderNumber: order.order_number || '',
        productName: order.project_description || order.product_name || prev.productName,
        createdDate: order.created_at ? new Date(order.created_at).toISOString().split('T')[0] : prev.createdDate,
        deadline: order.deadline ? new Date(order.deadline).toISOString().split('T')[0] : ''
      }));
    }
  }, [order]);

  // Функции для обновления полей
  const handleFieldChange = (section, field, value) => {
    setSpecification(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleDirectFieldChange = (field, value) => {
    setSpecification(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handlePrint = () => {
    window.print();
  };

  // Генерация и сохранение PDF с QR кодом
  const generateAndSavePDF = async () => {
    try {
      // Получаем QR код как base64
      let qrCodeBase64 = null;
      
      // Способ 1: Загружаем QR код через API
      if (order?.qr_code_id) {
        try {
          const response = await fetch(`/api/production/qr-image/${order.qr_code_id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const blob = await response.blob();
            qrCodeBase64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
            console.log('✅ QR код загружен через API');
          }
        } catch (error) {
          console.error('Ошибка загрузки QR кода через API:', error);
        }
      }
      
      // Способ 2: Если API не сработал, ищем QR код на странице
      if (!qrCodeBase64) {
        const qrImage = document.querySelector('img[alt*="QR-код"]');
        if (qrImage && qrImage.src && qrImage.src.startsWith('blob:')) {
          qrCodeBase64 = qrImage.src;
          console.log('✅ QR код найден на странице');
        } else {
          console.log('⚠️ QR код не найден');
        }
      }

      // Создаем HTML для PDF
      const printWindow = window.open('', '_blank');
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Заказ-наряд ${specification.orderNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.4;
            }
            .header { 
              margin-bottom: 30px; 
              border-bottom: 2px solid #000; 
              padding-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .header-left {
              flex: 1;
            }
            .header-right {
              flex-shrink: 0;
              margin-left: 20px;
            }
            .qr-code {
              width: 120px;
              height: 120px;
              border: 1px solid #ccc;
            }
            .product-name { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px;
            }
            .order-number { 
              font-size: 18px; 
              color: #666;
            }
            .section { 
              margin: 20px 0; 
              background: #f5f5f5; 
              padding: 15px; 
              border-radius: 5px;
            }
            .section h3 { 
              margin: 0 0 15px 0; 
              font-size: 18px; 
              font-weight: bold;
            }
            .dimensions-grid { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 10px;
            }
            .dimension-box { 
              border: 2px dashed #ccc; 
              padding: 10px; 
              text-align: center;
            }
            .dates-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px;
            }
            .image-container { 
              margin: 20px 0; 
              text-align: center;
            }
            .image-container img { 
              max-width: 100%; 
              max-height: 400px; 
              border: 1px solid #ddd;
            }
            .priority-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              margin-top: 10px;
            }
            .priority-urgent { background: #fee2e2; color: #dc2626; }
            .priority-high { background: #fed7aa; color: #ea580c; }
            .priority-normal { background: #dbeafe; color: #2563eb; }
            .priority-low { background: #f3f4f6; color: #6b7280; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <div class="product-name">${specification.productName}</div>
              <div class="order-number">Номер заказа: ${specification.orderNumber}</div>
              <div class="priority-badge priority-${specification.priority}">
                🔥 ${priorities.find(p => p.id === specification.priority)?.name || 'Нормальный'}
              </div>
            </div>
            <div class="header-right">
              ${qrCodeBase64 ? 
                `<img src="${qrCodeBase64}" alt="QR код" class="qr-code" />` : 
                `<div class="qr-code" style="display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #666; font-size: 12px;">QR код недоступен</div>`
              }
            </div>
          </div>

          <div class="section">
            <h3>ГАБАРИТНЫЕ РАЗМЕРЫ</h3>
            <div class="dimensions-grid">
              <div class="dimension-box">
                <div><strong>ШИРИНА</strong></div>
                <div style="font-size: 20px; font-weight: bold;">${specification.dimensions.width || '0'}</div>
              </div>
              <div class="dimension-box">
                <div><strong>ГЛУБИНА</strong></div>
                <div style="font-size: 20px; font-weight: bold;">${specification.dimensions.depth || '0'}</div>
              </div>
              <div class="dimension-box">
                <div><strong>ВЫСОТА</strong></div>
                <div style="font-size: 20px; font-weight: bold;">${specification.dimensions.height || '0'}</div>
              </div>
              <div class="dimension-box">
                <div><strong>ШИРИНА ПМ</strong></div>
                <div style="font-size: 20px; font-weight: bold;">${specification.dimensions.seatWidth || '0'}</div>
              </div>
              <div class="dimension-box">
                <div><strong>ГЛУБИНА ПМ</strong></div>
                <div style="font-size: 20px; font-weight: bold;">${specification.dimensions.seatDepth || '0'}</div>
              </div>
              <div class="dimension-box">
                <div><strong>ВЫСОТА ПМ</strong></div>
                <div style="font-size: 20px; font-weight: bold;">${specification.dimensions.seatHeight || '0'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>КОММЕНТАРИИ / КБ</h3>
            <div>${specification.comments || 'Комментарии не указаны'}</div>
          </div>

          <div class="section">
            <h3>ДАТЫ</h3>
            <div class="dates-grid">
              <div><strong>Дата создания:</strong> ${specification.createdDate}</div>
              <div><strong>Дедлайн:</strong> ${specification.deadline || 'Не указан'}</div>
            </div>
          </div>

          <div class="section">
            <h3>ПОЗИЦИИ ЗАКАЗА</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">№</th>
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Наименование</th>
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Количество</th>
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: center;">Ед. изм.</th>
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">Цена за ед.</th>
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">Сумма</th>
                  <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Описание</th>
                </tr>
              </thead>
              <tbody>
                ${order?.items && order.items.length > 0 ? order.items.map((item, index) => `
                  <tr>
                    <td style="border: 1px solid #ccc; padding: 8px;">${index + 1}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">${item.name || 'Не указано'}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${item.quantity || 0}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${item.unit || 'шт'}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${item.price ? item.price.toLocaleString('ru-RU') + ' ₽' : '0 ₽'}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: right; font-weight: bold;">${item.quantity && item.price ? (item.quantity * item.price).toLocaleString('ru-RU') + ' ₽' : '0 ₽'}</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">${item.description || '-'}</td>
                  </tr>
                `).join('') : '<tr><td colspan="7" style="border: 1px solid #ccc; padding: 8px; text-align: center;">Позиции заказа не найдены</td></tr>'}
              </tbody>
              <tfoot>
                <tr style="background: #f0f0f0; font-weight: bold;">
                  <td colspan="5" style="border: 1px solid #ccc; padding: 8px; text-align: right;">ИТОГО:</td>
                  <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${order?.items ? order.items.reduce((total, item) => total + (item.quantity * item.price || 0), 0).toLocaleString('ru-RU') + ' ₽' : '0 ₽'}</td>
                  <td style="border: 1px solid #ccc; padding: 8px;"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="section">
            <h3>ПОДРОБНОЕ ОПИСАНИЕ</h3>
            <div style="margin-top: 10px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 5px;">
              <div style="white-space: pre-wrap; line-height: 1.6;">
                ${order?.project_description || order?.product_name || 'Подробное описание не указано'}
              </div>
            </div>
          </div>

          ${uploadedImages.map(img => `
            <div class="image-container">
              <h3>Чертеж / Эскиз: ${img.name}</h3>
              <img src="${img.data}" alt="${img.name}" />
            </div>
          `).join('')}

          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Печать PDF
            </button>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Автоматически открываем диалог печати для сохранения PDF
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
    } catch (error) {
      console.error('Ошибка генерации PDF:', error);
      alert('Ошибка при генерации PDF');
    }
  };

  // Функции для работы с изображениями
  const handleImageUpload = (files) => {
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') || 
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.dwg') ||
      file.name.toLowerCase().endsWith('.dxf')
    );

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result,
          file: file
        };
        setUploadedImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleImageUpload(e.dataTransfer.files);
  };

  const handleFileInput = (e) => {
    handleImageUpload(e.target.files);
  };

  const removeImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Ошибка загрузки заказа</p>
          <button 
            onClick={() => navigate('/orders')}
            className="btn-primary btn-md"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Заголовок страницы - скрывается при печати */}
      <div className="print:hidden bg-gray-50 p-6 border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(`/orders/${id}`)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к заказу
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={generateAndSavePDF}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Сохранить PDF
              </button>
              
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Printer className="h-4 w-4 mr-2" />
                Печать
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Заказ-наряд #{id}</h1>
            {(() => {
              const currentPriority = priorities.find(p => p.id === specification.priority);
              const IconComponent = currentPriority?.icon || Flame;
              return (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  currentPriority?.color === 'red' ? 'bg-red-100 text-red-700' :
                  currentPriority?.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                  currentPriority?.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  <IconComponent className="h-4 w-4" />
                  <span className="text-sm font-medium">{currentPriority?.name}</span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-4xl mx-auto p-8 print:p-0">
        {/* Заголовок спецификации */}
        <div className="mb-8">
          <div className="flex items-start gap-6 mb-4">
            {/* QR-код в отдельном блоке */}
            {order?.qr_code_id && (
              <div className="flex-shrink-0">
                <QRCodeImage 
                  qrCodeId={order.qr_code_id}
                  className="border rounded"
                  style={{width: '170px', height: '170px'}}
                  alt="QR-код заказа"
                />
              </div>
            )}
            
            {/* Информация о заказе справа от QR-кода */}
            <div className="flex-1">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Номер заказа</label>
                <input
                  type="text"
                  value={specification.orderNumber}
                  onChange={(e) => handleDirectFieldChange('orderNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-xl font-bold"
                  placeholder="Введите номер заказа"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Название изделия</label>
                <input
                  type="text"
                  value={specification.productName}
                  onChange={(e) => handleDirectFieldChange('productName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-lg"
                  placeholder="Введите название изделия"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Приоритет</label>
            <div className="flex gap-2">
              {priorities.map((priority) => {
                const IconComponent = priority.icon;
                const isSelected = specification.priority === priority.id;
                
                return (
                  <button
                    key={priority.id}
                    onClick={() => handleDirectFieldChange('priority', priority.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      isSelected
                        ? `border-${priority.color}-500 bg-${priority.color}-50 text-${priority.color}-700`
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <IconComponent className={`h-4 w-4 ${
                      isSelected ? `text-${priority.color}-600` : 'text-gray-400'
                    }`} />
                    <span className="font-medium">{priority.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>


        {/* Раздел ГАБАРИТНЫЕ РАЗМЕРЫ */}
        <div className="bg-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-4">ГАБАРИТНЫЕ РАЗМЕРЫ</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="border-2 border-dashed border-gray-400 p-3 text-center">
              <div className="font-semibold mb-2">ШИРИНА</div>
              <input
                type="number"
                value={specification.dimensions.width}
                onChange={(e) => handleFieldChange('dimensions', 'width', e.target.value)}
                className="w-full text-center text-xl font-bold border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 rounded"
                placeholder="0"
              />
            </div>
            <div className="border-2 border-dashed border-gray-400 p-3 text-center">
              <div className="font-semibold mb-2">ГЛУБИНА</div>
              <input
                type="number"
                value={specification.dimensions.depth}
                onChange={(e) => handleFieldChange('dimensions', 'depth', e.target.value)}
                className="w-full text-center text-xl font-bold border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 rounded"
                placeholder="0"
              />
            </div>
            <div className="border-2 border-dashed border-gray-400 p-3 text-center">
              <div className="font-semibold mb-2">ВЫСОТА</div>
              <input
                type="number"
                value={specification.dimensions.height}
                onChange={(e) => handleFieldChange('dimensions', 'height', e.target.value)}
                className="w-full text-center text-xl font-bold border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 rounded"
                placeholder="0"
              />
            </div>
            <div className="border-2 border-dashed border-gray-400 p-3 text-center">
              <div className="font-semibold mb-2">ШИРИНА ПМ</div>
              <input
                type="number"
                value={specification.dimensions.seatWidth}
                onChange={(e) => handleFieldChange('dimensions', 'seatWidth', e.target.value)}
                className="w-full text-center text-xl font-bold border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 rounded"
                placeholder="0"
              />
            </div>
            <div className="border-2 border-dashed border-gray-400 p-3 text-center">
              <div className="font-semibold mb-2">ГЛУБИНА ПМ</div>
              <input
                type="number"
                value={specification.dimensions.seatDepth}
                onChange={(e) => handleFieldChange('dimensions', 'seatDepth', e.target.value)}
                className="w-full text-center text-xl font-bold border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 rounded"
                placeholder="0"
              />
            </div>
            <div className="border-2 border-dashed border-gray-400 p-3 text-center">
              <div className="font-semibold mb-2">ВЫСОТА ПМ</div>
              <input
                type="number"
                value={specification.dimensions.seatHeight}
                onChange={(e) => handleFieldChange('dimensions', 'seatHeight', e.target.value)}
                className="w-full text-center text-xl font-bold border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 rounded"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Раздел КОММЕНТАРИИ / КБ */}
        <div className="bg-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-4">КОММЕНТАРИИ / КБ</h2>
          <textarea
            value={specification.comments}
            onChange={(e) => handleDirectFieldChange('comments', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
            rows={3}
            placeholder="Введите комментарии или примечания"
          />
        </div>

        {/* Даты */}
        <div className="bg-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-4">ДАТЫ</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Дата создания</label>
              <input
                type="date"
                value={specification.createdDate}
                onChange={(e) => handleDirectFieldChange('createdDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Дедлайн</label>
              <input
                type="date"
                value={specification.deadline}
                onChange={(e) => handleDirectFieldChange('deadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Позиции заказа */}
        <div className="bg-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-4">ПОЗИЦИИ ЗАКАЗА</h2>
          {itemsLoading ? (
            <div className="text-center py-4">
              <LoadingSpinner size="md" />
              <p className="text-gray-500 mt-2">Загрузка позиций...</p>
            </div>
          ) : order?.items && order.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">№</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Наименование</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Количество</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Ед. изм.</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Цена за ед.</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Сумма</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Описание</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                      <td className="border border-gray-300 px-4 py-2 font-medium">{item.name || 'Не указано'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity || 0}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{item.unit || 'шт'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{item.price ? `${item.price.toLocaleString('ru-RU')} ₽` : '0 ₽'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                        {item.quantity && item.price ? `${(item.quantity * item.price).toLocaleString('ru-RU')} ₽` : '0 ₽'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{item.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-200">
                  <tr>
                    <td colSpan="5" className="border border-gray-300 px-4 py-2 text-right font-bold">ИТОГО:</td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-bold">
                      {order.items.reduce((total, item) => total + (item.quantity * item.price || 0), 0).toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="border border-gray-300 px-4 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">Позиции заказа не найдены</p>
              <p className="text-sm">Добавьте позиции в заказ для отображения в спецификации</p>
            </div>
          )}
        </div>

        {/* Подробное описание */}
        <div className="bg-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-4">ПОДРОБНОЕ ОПИСАНИЕ</h2>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-gray-700 whitespace-pre-wrap">
              {order?.project_description || order?.product_name || 'Подробное описание не указано'}
            </div>
          </div>
        </div>

        {/* Чертеж / Эскиз */}
        <div className="mb-6">
          <div className="bg-gray-200 px-4 py-2 inline-block mb-4">
            <span className="font-semibold">Чертеж / Эскиз</span>
          </div>
          
          {/* Область загрузки файлов */}
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragOver 
                ? 'border-teal-500 bg-teal-50' 
                : 'border-gray-300 hover:border-teal-500 hover:bg-teal-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('imageInput').click()}
          >
            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">
              {isDragOver ? 'Отпустите файлы для загрузки' : 'Перетащите чертежи сюда или нажмите для загрузки'}
            </p>
            <p className="text-xs text-gray-500">
              Поддерживаемые форматы: JPG, PNG, PDF, DWG, DXF
            </p>
            <input 
              id="imageInput"
              type="file" 
              multiple 
              accept="image/*,.pdf,.dwg,.dxf"
              onChange={handleFileInput}
              className="hidden" 
            />
          </div>

          {/* Загруженные изображения */}
          {uploadedImages.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Загруженные файлы</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">{image.name}</span>
                      </div>
                      <button
                        onClick={() => removeImage(image.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{formatFileSize(image.size)}</div>
                    {image.type.startsWith('image/') && (
                      <img 
                        src={image.data} 
                        alt={image.name}
                        className="w-full h-32 object-cover rounded border"
                      />
                    )}
                    {!image.type.startsWith('image/') && (
                      <div className="w-full h-32 bg-gray-100 rounded border flex items-center justify-center">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Информация о заказе */}
        {order && (
          <div className="bg-gray-100 p-6 mt-8">
            <h2 className="text-xl font-bold text-black mb-4">ИНФОРМАЦИЯ О ЗАКАЗЕ</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold">Номер заказа:</span> {order.order_number}
              </div>
              <div>
                <span className="font-semibold">Клиент:</span> {order.customer?.name || 'Не указан'}
              </div>
              <div>
                <span className="font-semibold">Дата создания:</span> {new Date(order.created_at).toLocaleDateString('ru-RU')}
              </div>
              <div>
                <span className="font-semibold">Статус:</span> {order.status}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Стили для печати */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:bg-white {
            background: white !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          @page {
            margin: 1cm;
            size: A4;
          }
        }
      `}</style>

    </div>
  );
};

export default OrderSpecification;
