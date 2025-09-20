import React, { useRef, useEffect, useState } from 'react';
import { Printer, Download, Image, FileText } from 'lucide-react';
import SimpleQRCodeGenerator from '../Production/SimpleQRCodeGenerator';

const WorkOrderPrintComponent = ({ order, orderItems, uploadedFiles }) => {
  const printRef = useRef();
  const [imagePreviews, setImagePreviews] = useState({});
  const [pdfPreviews, setPdfPreviews] = useState({});

  const getStatusLabel = (status) => {
    const statusMap = {
      'new': 'Новый',
      'in_progress': 'В работе',
      'completed': 'Завершен',
      'cancelled': 'Отменен',
      'in_production': 'В производстве'
    };
    return statusMap[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const priorityMap = {
      'low': 'Низкий',
      'normal': 'Обычный',
      'high': 'Высокий',
      'urgent': 'Срочный'
    };
    return priorityMap[priority] || priority;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Загрузка изображений для печати
  const loadImageForPrint = async (fileId, fileType) => {
    if (imagePreviews[fileId]) return;

    try {
      const response = await fetch(`/api/orders/${order.id}/drawings/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setImagePreviews(prev => ({ ...prev, [fileId]: imageUrl }));
      }
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
    }
  };

  // Загрузка PDF для печати
  const loadPdfForPrint = async (fileId, fileType) => {
    if (pdfPreviews[fileId]) return;

    try {
      const response = await fetch(`/api/orders/${order.id}/drawings/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const pdfUrl = URL.createObjectURL(blob);
        setPdfPreviews(prev => ({ ...prev, [fileId]: pdfUrl }));
      }
    } catch (error) {
      console.error('Ошибка загрузки PDF:', error);
    }
  };

  // Загружаем файлы при монтировании компонента
  useEffect(() => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      uploadedFiles.forEach(file => {
        if (file.type.includes('image/')) {
          loadImageForPrint(file.id, file.type);
        } else if (file.type.includes('pdf')) {
          loadPdfForPrint(file.id, file.type);
        }
      });
    }
  }, [uploadedFiles]);

  // Очищаем URL при размонтировании
  useEffect(() => {
    return () => {
      Object.values(imagePreviews).forEach(url => URL.revokeObjectURL(url));
      Object.values(pdfPreviews).forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews, pdfPreviews]);

  const handlePrint = () => {
    // Создаем стиль для скрытия всех элементов навигации
    const hideStyle = document.createElement('style');
    hideStyle.id = 'print-hide-style';
    hideStyle.textContent = `
      @media print {
        nav, .sidebar, .navigation, [role="navigation"],
        header, .header, .navbar, .top-bar,
        footer, .footer,
        .sidebar-menu, .main-sidebar, .sidebar-wrapper,
        .app-sidebar, .sidebar-nav, .nav-sidebar,
        [class*="sidebar"], [class*="nav"], [class*="menu"],
        [class*="header"], [class*="navbar"], [class*="topbar"],
        button, .btn, [role="button"], input[type="button"], input[type="submit"] {
          display: none !important;
        }
        
        .print-content {
          margin: 0 auto !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
        }
      }
    `;
    
    // Добавляем стиль в head
    document.head.appendChild(hideStyle);

    // Скрываем элементы, которые не должны печататься
    const elementsToHide = document.querySelectorAll('.no-print');
    elementsToHide.forEach(el => el.style.display = 'none');

    // Печатаем
    window.print();

    // Восстанавливаем элементы
    elementsToHide.forEach(el => el.style.display = '');
    
    // Удаляем временный стиль
    const styleElement = document.getElementById('print-hide-style');
    if (styleElement) {
      styleElement.remove();
    }
  };

  const handleDownloadPDF = () => {
    // Простая реализация через window.print() с PDF опциями
    handlePrint();
  };

  return (
    <div className="print-container">
      {/* Кнопки управления */}
      <div className="no-print flex space-x-3 mb-6" style={{ display: 'none' }}>
        <button
          onClick={handlePrint}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Printer className="h-4 w-4 mr-2" />
          Печать
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Скачать PDF
        </button>
      </div>

      {/* Контент для печати */}
      <div ref={printRef} className="print-content bg-white p-8">
        {/* Заголовок */}
        <div className="border-b-2 border-blue-600 pb-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ЗАКАЗ-НАРЯД</h1>
              <p className="text-lg text-gray-600">№ {order.order_number}</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <SimpleQRCodeGenerator 
                  orderId={order.id} 
                  orderNumber={order.order_number}
                  size={80}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">QR-код</p>
            </div>
          </div>
        </div>

        {/* Основная информация */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Статус и приоритет */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Статус и приоритет</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Статус:</span>
                <span className="text-sm text-gray-900">{getStatusLabel(order.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Приоритет:</span>
                <span className="text-sm text-gray-900">{getPriorityLabel(order.priority)}</span>
              </div>
            </div>
          </div>

          {/* Информация о продукте */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Информация о продукте</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-600">Название:</span>
                <p className="text-sm text-gray-900 mt-1">{order.product_name || 'Не указано'}</p>
              </div>
              {order.project_description && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Описание:</span>
                  <p className="text-sm text-gray-900 mt-1">{order.project_description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Доставка */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Доставка</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Адрес:</span>
              <p className="text-sm text-gray-900 mt-1">{order.delivery_address || 'Не указан'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Дедлайн:</span>
              <p className="text-sm text-gray-900 mt-1">
                {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('ru-RU') : 'Не установлен'}
              </p>
            </div>
          </div>
        </div>

        {/* Позиции заказа */}
        {orderItems && orderItems.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Позиции заказа</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                      Наименование
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">
                      Кол-во
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm font-medium text-gray-700">
                      Цена
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm font-medium text-gray-700">
                      Сумма
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                        {item.name || 'Не указано'}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-900">
                        {item.quantity || 0}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-900">
                        {item.unit_price || 0} ₽
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-900">
                        {((item.quantity || 0) * (item.unit_price || 0)).toLocaleString()} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Заметки */}
        {order.notes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Заметки</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{order.notes}</p>
            </div>
          </div>
        )}

        {/* Загруженные файлы */}
        {uploadedFiles && uploadedFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Прикрепленные файлы</h3>
            
            {/* Изображения - показываем прямо в PDF */}
            {uploadedFiles.filter(file => file.type.includes('image/')).length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-800 mb-3">Изображения и чертежи:</h4>
                <div className="space-y-8">
                  {uploadedFiles
                    .filter(file => file.type.includes('image/'))
                    .map((file, index) => (
                      <div key={index} className="border border-gray-300 rounded-lg p-4" style={{ marginBottom: '40px' }}>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-900">{file.name}</h5>
                          <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                        </div>
                        {imagePreviews[file.id] ? (
                          <div className="text-center image-container">
                            <div className="image-wrapper">
                              <img 
                                src={imagePreviews[file.id]} 
                                alt={file.name}
                                className="max-w-full h-auto max-h-96 mx-auto border border-gray-200 rounded"
                                style={{ 
                                  pageBreakInside: 'avoid',
                                  display: 'block'
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-100 p-8 text-center rounded">
                            <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Загрузка изображения...</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* PDF документы - показываем встроенными */}
            {uploadedFiles.filter(file => file.type.includes('pdf')).length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-800 mb-3">PDF документы:</h4>
                <div className="space-y-4">
                  {uploadedFiles
                    .filter(file => file.type.includes('pdf'))
                    .map((file, index) => (
                      <div key={index} className="border border-gray-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-900">{file.name}</h5>
                          <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                        </div>
                        {pdfPreviews[file.id] ? (
                          <div className="text-center">
                            <iframe 
                              src={pdfPreviews[file.id]}
                              className="w-full h-96 border border-gray-200 rounded"
                              style={{ pageBreakInside: 'avoid' }}
                            />
                          </div>
                        ) : (
                          <div className="bg-gray-100 p-8 text-center rounded">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Загрузка PDF...</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Остальные файлы - только список */}
            {uploadedFiles.filter(file => !file.type.includes('image/') && !file.type.includes('pdf')).length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Другие файлы:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {uploadedFiles
                    .filter(file => !file.type.includes('image/') && !file.type.includes('pdf'))
                    .map((file, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <span className="text-xs text-gray-500">
                            {file.type.includes('dwg') ? '📐' : 
                             file.type.includes('dxf') ? '📐' : 
                             file.type.includes('skp') ? '📦' : '📁'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Подпись и дата */}
        <div className="mt-8 pt-4 border-t border-gray-300">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-gray-600 mb-8">Подпись мастера:</p>
              <p className="text-sm text-gray-600">_________________</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-8">Дата выполнения:</p>
              <p className="text-sm text-gray-600">_________________</p>
            </div>
          </div>
        </div>
      </div>

      {/* Стили для печати */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          /* Скрываем все элементы навигации и меню */
          nav, .sidebar, .navigation, [role="navigation"],
          header, .header, .navbar, .top-bar,
          footer, .footer,
          .sidebar-menu, .main-sidebar, .sidebar-wrapper,
          .app-sidebar, .sidebar-nav, .nav-sidebar {
            display: none !important;
          }
          
          /* Скрываем все элементы с классами навигации */
          [class*="sidebar"], [class*="nav"], [class*="menu"],
          [class*="header"], [class*="navbar"], [class*="topbar"] {
            display: none !important;
          }
          
          .print-content {
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 100vh !important;
          }
          
          .print-container {
            background: white !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            min-height: 100vh !important;
          }
          
          body {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          
          /* Скрываем все кнопки и интерактивные элементы */
          button, .btn, [role="button"], input[type="button"], input[type="submit"] {
            display: none !important;
          }
          
          /* Убираем все отступы и позиционирование */
          * {
            box-sizing: border-box !important;
          }
          
          /* Центрируем контент и делаем на всю ширину */
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Убираем все отступы у контейнеров */
          .container, .container-fluid, .main-content, .content-wrapper {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Стили для блоков информации */
          .bg-white, .bg-gray-50, .bg-gray-100 {
            background: white !important;
            border: 1px solid #e5e7eb !important;
            margin: 10px 0 !important;
            padding: 15px !important;
          }
          
          /* Убираем тени и скругления */
          .shadow-xl, .shadow-lg, .shadow-md, .shadow-sm, .shadow {
            box-shadow: none !important;
          }
          
          .rounded-2xl, .rounded-xl, .rounded-lg, .rounded-md, .rounded {
            border-radius: 0 !important;
          }
          
          /* Стили для изображений в печати */
          .image-container {
            overflow: hidden !important;
            padding: 20px 0 !important;
            margin: 20px 0 !important;
          }
          
          .image-wrapper {
            transform: scale(1.8) !important;
            transform-origin: center !important;
            display: inline-block !important;
            margin: 20px 0 !important;
          }
          
          img {
            max-width: 100% !important;
            height: auto !important;
            page-break-inside: avoid;
            break-inside: avoid;
            display: block !important;
          }
          
          /* Стили для PDF в печати */
          iframe {
            width: 100% !important;
            height: 400px !important;
            page-break-inside: avoid;
            break-inside: avoid;
            border: 1px solid #ccc !important;
          }
          
          /* Улучшенные отступы для печати */
          .space-y-4 > * + * {
            margin-top: 1rem !important;
          }
          
          .space-y-6 > * + * {
            margin-top: 1.5rem !important;
          }
          
          /* Предотвращаем разрыв страниц внутри важных блоков */
          .border {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default WorkOrderPrintComponent;
