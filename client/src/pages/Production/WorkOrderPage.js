import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Printer, 
  AlertCircle,
  Factory
} from 'lucide-react';
import { ordersAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';
import WorkOrder from '../../components/Production/WorkOrder';

const WorkOrderPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrderData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Загружаем данные заказа
      const orderData = await ordersAPI.getById(orderId);
      setOrder(orderData);

      // Загружаем материалы заказа
      try {
        if (orderData.order_items && orderData.order_items.length > 0) {
          setMaterials(orderData.order_items);
        } else {
          // Используем заглушку для демонстрации
          setMaterials([
            { id: 1, name: 'Ткань обивки', quantity: 5, unit: 'м²', description: 'Основная ткань для обивки' },
            { id: 2, name: 'Поролон 40мм', quantity: 2, unit: 'м²', description: 'Поролон для сидений' },
            { id: 3, name: 'ДСП 16мм', quantity: 1, unit: 'лист', description: 'Основание дивана' },
            { id: 4, name: 'Мебельные ножки', quantity: 4, unit: 'шт', description: 'Хромированные ножки' },
            { id: 5, name: 'Крепеж', quantity: 20, unit: 'шт', description: 'Саморезы, уголки' }
          ]);
        }
      } catch (materialsError) {
        console.warn('Не удалось загрузить материалы:', materialsError);
        // Используем заглушку для демонстрации
        setMaterials([
          { id: 1, name: 'Ткань обивки', quantity: 5, unit: 'м²', description: 'Основная ткань для обивки' },
          { id: 2, name: 'Поролон 40мм', quantity: 2, unit: 'м²', description: 'Поролон для сидений' },
          { id: 3, name: 'ДСП 16мм', quantity: 1, unit: 'лист', description: 'Основание дивана' },
          { id: 4, name: 'Мебельные ножки', quantity: 4, unit: 'шт', description: 'Хромированные ножки' },
          { id: 5, name: 'Крепеж', quantity: 20, unit: 'шт', description: 'Саморезы, уголки' }
        ]);
      }

    } catch (err) {
      console.error('Ошибка загрузки данных заказа:', err);
      setError('Не удалось загрузить данные заказа');
      toast.error('Ошибка загрузки данных заказа');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      loadOrderData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = document.getElementById('work-order-content');
    
    if (printContent) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Заказ-наряд #${order?.order_number || ''}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; border-bottom: 3px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #0d9488; margin-bottom: 10px; }
            .document-title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            .order-info { display: flex; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap; }
            .order-details { flex: 1; min-width: 300px; }
            .qr-section { flex: 0 0 200px; text-align: center; }
            .qr-code { width: 200px; height: 200px; border: 2px solid #0d9488; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; background: #f0fdfa; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 5px; margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
            .info-item { background: #f8fafc; padding: 10px; border-radius: 5px; }
            .info-label { font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
            .info-value { font-size: 14px; font-weight: 500; color: #1e293b; }
            .materials-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .materials-table th, .materials-table td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            .materials-table th { background: #f1f5f9; font-weight: 600; color: #475569; }
            .materials-table tr:nth-child(even) { background: #f8fafc; }
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadOrderData}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Заказ не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <Factory className="h-8 w-8 text-teal-600" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Заказ-наряд</h1>
                  <p className="text-sm text-gray-500">#{order.order_number}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Печать
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WorkOrder order={order} materials={materials} />
      </div>
    </div>
  );
};

export default WorkOrderPage;