import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import QRCodeImage from './QRCodeImage';
import OrderQRCode from './Production/OrderQRCode';

const SimpleWorkOrder = ({ orderId, orderNumber = 'N/A' }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const orderResponse = await ordersAPI.getById(orderId);
        const orderData = orderResponse.order || orderResponse;
        
        // Загружаем чертежи через PDF API для получения полных данных
        try {
          const pdfData = await ordersAPI.getWorkOrderPDF(orderId);
          orderData.drawings = pdfData.drawings || [];
        } catch (drawingError) {
          console.warn('Ошибка загрузки чертежей через PDF API, пробуем обычный способ:', drawingError);
          try {
            const drawingsResponse = await ordersAPI.getDrawings(orderId);
            orderData.drawings = drawingsResponse.files || drawingsResponse || [];
          } catch (fallbackError) {
            console.warn('Ошибка загрузки чертежей:', fallbackError);
            orderData.drawings = [];
          }
        }
        
        setOrder(orderData);
      } catch (error) {
        console.error('Ошибка загрузки заказа:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  // Функция для получения изображения чертежа как base64
  const getDrawingAsBase64 = async (drawingId) => {
    try {
      const response = await ordersAPI.getDrawing(orderId, drawingId);
      const blob = new Blob([response.data]);
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Ошибка получения чертежа:', error);
      return null;
    }
  };

  // Функция для генерации PDF с встроенными чертежами
  const handlePrintWithDrawings = async () => {
    try {
      console.log('Генерируем PDF с чертежами...');
      
      // Получаем данные для PDF с сервера (включая чертежи в base64)
      const pdfData = await ordersAPI.getWorkOrderPDF(orderId);
      
      // Фильтруем только изображения для встраивания
      const imageDrawings = pdfData.drawings.filter(drawing => 
        drawing.file_type?.includes('image')
      ).map(drawing => ({
        name: drawing.file_name,
        data: `data:${drawing.file_type};base64,${drawing.file_data}`
      }));
      
      // Создаем HTML для печати с встроенными изображениями
      const printWindow = window.open('', '_blank');
      const drawingsHTML = imageDrawings.map(drawing => `
        <div class="drawing-page" style="page-break-before: always; margin-top: 30px;">
          <h3 style="text-align: center; margin-bottom: 20px; font-size: 18px;">
            ${drawing.name}
          </h3>
          <div style="text-align: center;">
            <img src="${drawing.data}" style="max-width: 100%; max-height: 80vh; border: 1px solid #ddd;" />
          </div>
        </div>
      `).join('');
      
      // Получаем HTML содержимое без сайдбара
      const mainContent = document.querySelector('.bg-white.p-8');
      if (!mainContent) {
        throw new Error('Не найден основной контент для печати');
      }
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Заказ-наряд ${order.order_number}</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              line-height: 1.4; 
              background: white;
            }
            .header { margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .section { margin: 20px 0; }
            .drawing-page { page-break-before: always; }
            
            /* Полностью убираем все элементы сайдбара и навигации */
            .sidebar, .fixed, .sticky, .no-print, 
            [class*="sidebar"], [class*="fixed"], [class*="sticky"],
            nav, header, footer, .navbar, .navigation,
            .left-panel, .right-panel, .side-panel { 
              display: none !important; 
            }
            
            /* Основной контент занимает всю ширину */
            .main-content, .content, .page-content {
              margin-left: 0 !important;
              margin-right: 0 !important;
              width: 100% !important;
              max-width: none !important;
            }
            
            @media print { 
              body { 
                margin: 0; 
                padding: 15px;
              } 
              .no-print, .sidebar, .fixed, .sticky, 
              [class*="sidebar"], [class*="fixed"], [class*="sticky"],
              nav, header, footer, .navbar, .navigation,
              .left-panel, .right-panel, .side-panel { 
                display: none !important; 
              }
              .drawing-page { page-break-before: always; }
              .main-content, .content, .page-content {
                margin-left: 0 !important;
                margin-right: 0 !important;
                width: 100% !important;
                max-width: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="main-content">
            ${mainContent.innerHTML}
            ${drawingsHTML}
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      
    } catch (error) {
      console.error('Ошибка генерации PDF:', error);
      // Fallback на обычную печать
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-8 max-w-4xl mx-auto text-center">
        <div className="text-gray-500">Загрузка данных заказа...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white p-8 max-w-4xl mx-auto text-center">
        <div className="text-red-500">Ошибка загрузки заказа</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto print:p-4" style={{ 
      '@media print': { 
        'margin-left': '0 !important',
        'margin-right': '0 !important'
      }
    }}>
      {/* Заголовок */}
      <div className="text-center border-b-2 border-teal-600 pb-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ЗАКАЗ-НАРЯД №{order.order_number || orderNumber}
        </h1>
        <p className="text-gray-600">
          Дата: {new Date(order.created_at).toLocaleDateString('ru-RU')}
        </p>
        {order.delivery_date && (
          <p className="text-gray-600">
            Срок сдачи: {new Date(order.delivery_date).toLocaleDateString('ru-RU')}
          </p>
        )}
      </div>

      {/* QR-код секция */}
      <div className="text-center mb-8">
        {order.qr_code_id ? (
          <div className="inline-block p-4 border-2 border-teal-600 bg-gray-50">
            <QRCodeImage
              qrCodeId={order.qr_code_id}
              className="w-48 h-48"
              alt={`QR-код для заказа ${order.order_number}`}
            />
          </div>
        ) : (
          <div className="inline-block p-4 border-2 border-teal-600 bg-gray-50">
            <OrderQRCode
              orderId={orderId}
              orderNumber={order.order_number}
              onQRGenerated={(qr) => {
                console.log('QR-код сгенерирован в заказ-наряде:', qr);
                // Обновляем заказ, чтобы показать QR-код
                setOrder(prev => ({ ...prev, qr_code_id: qr.id }));
              }}
            />
          </div>
        )}
        <p className="text-sm text-gray-600 mt-2">QR-код для отслеживания</p>
      </div>

      {/* Информация о заказе */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Информация о заказе</h3>
          <div className="space-y-2 text-gray-700">
            <p><strong>Номер заказа:</strong> {order.order_number}</p>
            <p><strong>Изделие:</strong> {order.product_name}</p>
            <p><strong>Статус:</strong> <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{order.status}</span></p>
            <p><strong>Приоритет:</strong> <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{order.priority}</span></p>
            <p><strong>Дата создания:</strong> {new Date(order.created_at).toLocaleDateString('ru-RU')}</p>
            <p><strong>Создан:</strong> {order.created_by_name || 'Неизвестно'}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Клиент</h3>
          <div className="space-y-2 text-gray-700">
            <p><strong>Имя:</strong> {order.customer_name}</p>
            <p><strong>Компания:</strong> {order.customer_company || 'Частное лицо'}</p>
            <p><strong>Телефон:</strong> {order.customer_phone}</p>
            <p><strong>Email:</strong> {order.customer_email}</p>
          </div>
        </div>
      </div>

      {/* Описание изделия */}
      {order.project_description && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Описание изделия</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{order.project_description}</p>
          </div>
        </div>
      )}

      {/* Габариты и технические характеристики */}
      {order.calculator_data?.config?.dimensions && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Габариты</h3>
          <div className="grid grid-cols-3 gap-4">
            {order.calculator_data.config.dimensions.width_mm && (
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-600">Ширина</div>
                <div className="text-lg font-semibold">{order.calculator_data.config.dimensions.width_mm} мм</div>
              </div>
            )}
            {order.calculator_data.config.dimensions.depth_mm && (
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-600">Глубина</div>
                <div className="text-lg font-semibold">{order.calculator_data.config.dimensions.depth_mm} мм</div>
              </div>
            )}
            {order.calculator_data.config.dimensions.height_mm && (
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-600">Высота</div>
                <div className="text-lg font-semibold">{order.calculator_data.config.dimensions.height_mm} мм</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Материалы */}
      {order.calculator_data?.config?.materials && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Материалы</h3>
          <div className="grid grid-cols-2 gap-4">
            {order.calculator_data.config.materials.frame && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Каркас</div>
                <div className="font-semibold">{order.calculator_data.config.materials.frame}</div>
              </div>
            )}
            {order.calculator_data.config.materials.fabric && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Ткань</div>
                <div className="font-semibold">{order.calculator_data.config.materials.fabric}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Доставка */}
      {(order.delivery_address || order.floor || order.has_elevator !== null) && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Доставка</h3>
          <div className="space-y-2 text-gray-700">
            {order.delivery_address && <p><strong>Адрес:</strong> {order.delivery_address}</p>}
            {order.floor && <p><strong>Этаж:</strong> {order.floor}</p>}
            {order.has_elevator !== null && <p><strong>Лифт:</strong> {order.has_elevator ? 'Да' : 'Нет'}</p>}
            {order.delivery_notes && <p><strong>Примечания:</strong> {order.delivery_notes}</p>}
          </div>
        </div>
      )}

      {/* Чертежи */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Чертежи</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {order.drawings && order.drawings.length > 0 ? (
            order.drawings.map((drawing, index) => (
              <div key={drawing.id || index} className="border border-gray-300 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">
                  {drawing.original_name || drawing.filename || `Чертеж ${index + 1}`}
                </div>
                <div className="bg-gray-100 p-4 rounded text-center">
                  <div className="text-gray-500 text-sm mb-2">
                    {drawing.file_type?.includes('image') ? 'Изображение' : 'Файл'}: {drawing.filename || drawing.original_name}
                  </div>
                  <div className="text-gray-400 text-xs mb-3">
                    Размер: {drawing.file_data ? Math.round(drawing.file_data.length * 0.75 / 1024) : 0} KB
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        const url = `/api/orders/${orderId}/drawings/${drawing.id}`;
                        window.open(url, '_blank');
                      }}
                      className="px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm"
                    >
                      Открыть
                    </button>
                    <button
                      onClick={() => {
                        const url = `/api/orders/${orderId}/drawings/${drawing.id}`;
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = drawing.filename || drawing.original_name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                    >
                      Скачать
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-gray-500">
              <div className="text-lg mb-2">Чертежи не загружены</div>
              <div className="text-sm">Для этого заказа чертежи не найдены</div>
            </div>
          )}
        </div>
      </div>

      {/* Комментарии */}
      {order.notes && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Комментарии</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
          </div>
        </div>
      )}

      {/* Спецификация материалов */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Спецификация материалов</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Наименование</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Количество</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Ед. изм.</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Описание</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2">шт</td>
                    <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                  </tr>
                ))
              ) : (
                // Fallback материалы если нет данных из заказа
                <>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Ткань обивки</td>
                    <td className="border border-gray-300 px-4 py-2">5</td>
                    <td className="border border-gray-300 px-4 py-2">м²</td>
                    <td className="border border-gray-300 px-4 py-2">Основная ткань для обивки</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Поролон 40мм</td>
                    <td className="border border-gray-300 px-4 py-2">2</td>
                    <td className="border border-gray-300 px-4 py-2">м²</td>
                    <td className="border border-gray-300 px-4 py-2">Поролон для сидений</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">ДСП 16мм</td>
                    <td className="border border-gray-300 px-4 py-2">1</td>
                    <td className="border border-gray-300 px-4 py-2">лист</td>
                    <td className="border border-gray-300 px-4 py-2">Основание дивана</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Мебельные ножки</td>
                    <td className="border border-gray-300 px-4 py-2">4</td>
                    <td className="border border-gray-300 px-4 py-2">шт</td>
                    <td className="border border-gray-300 px-4 py-2">Хромированные ножки</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Крепеж</td>
                    <td className="border border-gray-300 px-4 py-2">20</td>
                    <td className="border border-gray-300 px-4 py-2">шт</td>
                    <td className="border border-gray-300 px-4 py-2">Саморезы, уголки</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex justify-center gap-4 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Печать (только наряд)
        </button>
        <button
          onClick={handlePrintWithDrawings}
          className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
          disabled={!order.drawings || order.drawings.length === 0}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Печать с чертежами {order.drawings && order.drawings.length > 0 ? `(${order.drawings.length})` : ''}
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Закрыть
        </button>
      </div>

      {/* Подпись */}
      <div className="text-center text-gray-500 text-sm mt-8 pt-4 border-t">
        Сгенерировано SofanyCRM - {new Date().toLocaleString('ru-RU')}
      </div>
    </div>
  );
};

export default SimpleWorkOrder;
