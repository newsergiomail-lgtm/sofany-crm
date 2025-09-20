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
        
        // Загружаем чертежи отдельно
        try {
          const drawingsResponse = await ordersAPI.getDrawings(orderId);
          orderData.drawings = drawingsResponse.files || drawingsResponse || [];
        } catch (drawingError) {
          console.warn('Ошибка загрузки чертежей:', drawingError);
            orderData.drawings = [];
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

  const handlePrintWithDrawings = async () => {
    try {
      console.log('Генерируем PDF с чертежами...');
      
      const pdfData = await ordersAPI.getWorkOrderPDF(orderId);
      
      const imageDrawings = pdfData.drawings.filter(drawing => 
        drawing.file_type?.includes('image')
      ).map(drawing => ({
        name: drawing.file_name,
        data: `data:${drawing.file_type};base64,${drawing.file_data}`
      }));
      
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
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Заказ-наряд ${order.order_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
            .header { margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .section { margin: 20px 0; }
            .drawing-page { page-break-before: always; }
            @media print { 
              body { margin: 0; } 
              .no-print { display: none; }
              .drawing-page { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          ${document.querySelector('.bg-white.p-8').innerHTML}
            ${drawingsHTML}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      
    } catch (error) {
      console.error('Ошибка генерации PDF:', error);
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
    <div className="bg-white p-8 max-w-4xl mx-auto print:p-4">
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
            <p><strong>Телефон:</strong> {order.customer_phone}</p>
            <p><strong>Email:</strong> {order.customer_email}</p>
            {order.delivery_address && (
              <p><strong>Адрес доставки:</strong> {order.delivery_address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Описание заказа */}
      {order.detailed_description && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Описание</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{order.detailed_description}</p>
          </div>
        </div>
      )}

      {/* Кнопки управления */}
      <div className="no-print flex justify-center space-x-4 mb-8">
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <span>🖨️</span>
          Печать
        </button>
        
        {order.drawings?.length > 0 && (
        <button
          onClick={handlePrintWithDrawings}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>📄</span>
            Печать с чертежами
        </button>
        )}
      </div>

      {/* Подпись */}
      <div className="border-t pt-8 mt-16">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="border-b border-gray-300 mb-2 h-8"></div>
            <p className="text-sm text-gray-600">Принял к исполнению</p>
          </div>
          <div>
            <div className="border-b border-gray-300 mb-2 h-8"></div>
            <p className="text-sm text-gray-600">Дата</p>
          </div>
          <div>
            <div className="border-b border-gray-300 mb-2 h-8"></div>
            <p className="text-sm text-gray-600">Подпись</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleWorkOrder;