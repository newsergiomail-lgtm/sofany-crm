import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  Shield, 
  Printer, 
  Copy, 
  Lightbulb, 
  FileText, 
  Factory, 
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { productionAPI } from '../../services/productionAPI';
import toast from 'react-hot-toast';

const QRCodePage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [stages, setStages] = useState([]);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderNumber, setOrderNumber] = useState('');

  console.log('🎭 QRCodePage render:', { 
    orderId, 
    orderIdType: typeof orderId,
    selectedStageId, 
    qrCode: !!qrCode,
    qrCodeId: qrCode?.id,
    isGenerating, 
    isLoading, 
    error,
    stagesCount: stages.length,
    timestamp: new Date().toISOString()
  });

  // Загружаем этапы производства
  useEffect(() => {
    loadStages();
  }, []);

  // Автоматически выбираем первый этап (Конструкторское Бюро)
  useEffect(() => {
    if (Array.isArray(stages) && stages.length > 0 && !selectedStageId) {
      const firstStage = stages.find(stage => stage.order_index === 1) || stages[0];
      if (firstStage && firstStage.id) {
        setSelectedStageId(firstStage.id);
      }
    }
  }, [stages, selectedStageId]);

  const loadStages = async () => {
    try {
      setIsLoading(true);
      const response = await productionAPI.getStages();
      console.log('Ответ API этапов:', response);
      
      // API возвращает {success: true, stages: [...]}
      const stagesData = response.data?.stages || response.data || [];
      console.log('Загруженные этапы:', stagesData);
      setStages(stagesData);
    } catch (error) {
      console.error('Ошибка загрузки этапов:', error);
      toast.error('Не удалось загрузить этапы производства.');
      setStages([]); // Устанавливаем пустой массив в случае ошибки
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQR = useCallback(async () => {
    if (!selectedStageId) {
      console.error('❌ Этап производства не выбран');
      toast.error('Выберите этап производства');
      return;
    }

    if (!orderId) {
      console.error('❌ ID заказа не найден');
      toast.error('ID заказа не найден');
      return;
    }

    console.log('🚀 Начинаем генерацию QR-кода:', { orderId, selectedStageId });

    try {
      setIsGenerating(true);
      setError(null);

      const response = await productionAPI.generateQR(orderId, selectedStageId);
      console.log('📡 Ответ API генерации QR:', response);
      
      if (response.data.success) {
        console.log('✅ QR-код успешно получен:', response.data.qr_code);
        setQrCode(response.data.qr_code);
        setOrderNumber(response.data.qr_code?.order_number || response.data.order_number || 'Не указан');
        toast.success('QR-код успешно сгенерирован');
      } else {
        console.error('❌ Ошибка в ответе API:', response.data);
        throw new Error(response.data.error || 'Ошибка генерации QR-кода');
      }
    } catch (error) {
      console.error('💥 Ошибка генерации QR-кода:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Ошибка генерации QR-кода';
      setError(errorMessage);
      toast.error(`Ошибка: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedStageId, orderId]);

  // Автоматически генерируем QR-код при загрузке страницы
  useEffect(() => {
    console.log('🔄 useEffect для генерации QR:', { selectedStageId, orderId });
    
    // Проверяем, что orderId является числом
    const numericOrderId = parseInt(orderId);
    if (selectedStageId && orderId && !isNaN(numericOrderId)) {
      console.log('🚀 Запускаем генерацию QR-кода...');
      handleGenerateQR();
    } else {
      console.log('⏳ Ждем данные или некорректный orderId:', { selectedStageId, orderId, numericOrderId });
    }
  }, [selectedStageId, orderId, handleGenerateQR]);

  const handleDownloadQR = async () => {
    if (!qrCode?.qr_image) {
      toast.error('Нет QR-кода для скачивания');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${qrCode.qr_image}`;
      link.download = `QR-код_заказ_${orderNumber || orderId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR-код скачан');
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      toast.error('Ошибка скачивания QR-кода');
    }
  };

  const handlePrintQR = () => {
    if (!qrCode?.qr_image) {
      toast.error('Нет QR-кода для печати');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR-код заказа ${orderNumber || orderId}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
            }
            .qr-container { 
              margin: 20px 0; 
            }
            .qr-image { 
              max-width: 300px; 
              height: auto; 
            }
            .order-info { 
              margin: 20px 0; 
              font-size: 16px; 
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <h2>QR-код заказа</h2>
          <div class="order-info">
            <p><strong>Номер заказа:</strong> ${orderNumber || orderId}</p>
            <p><strong>Этап:</strong> ${stages.find(s => s.id === selectedStageId)?.name || 'Не выбран'}</p>
          </div>
          <div class="qr-container">
            <img src="data:image/png;base64,${qrCode.qr_image}" alt="QR-код" class="qr-image" />
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleCopyQR = async () => {
    if (!qrCode?.qr_image) {
      toast.error('Нет QR-кода для копирования');
      return;
    }

    try {
      const response = await fetch(`data:image/png;base64,${qrCode.qr_image}`);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      toast.success('QR-код скопирован в буфер обмена');
    } catch (error) {
      console.error('Ошибка копирования:', error);
      toast.error('Ошибка копирования QR-кода');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-600" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/orders/create')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <QrCode className="h-8 w-8 text-teal-600" />
                  QR-код заказа
                </h1>
                <p className="text-gray-600 mt-1">
                  Заказ #{orderId} • {orderNumber || 'Номер будет присвоен автоматически'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Левая колонка - QR-код */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <QrCode className="h-6 w-6 text-teal-600" />
              QR-код
            </h2>

            {error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={handleGenerateQR}
                  disabled={isGenerating}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:bg-gray-300 transition-colors"
                >
                  {isGenerating ? 'Генерация...' : 'Попробовать снова'}
                </button>
              </div>
            ) : qrCode ? (
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-6">
                  {qrCode.qr_image ? (
                    <img
                      src={`data:image/png;base64,${qrCode.qr_image}`}
                      alt="QR-код"
                      className="w-48 h-48 mx-auto"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-500">QR-код не найден</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={handleDownloadQR}
                    className="w-full bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="h-5 w-5" />
                    Скачать QR-код
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handlePrintQR}
                      className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Printer className="h-5 w-5" />
                      Печать
                    </button>
                    
                    <button
                      onClick={handleCopyQR}
                      className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy className="h-5 w-5" />
                      Копировать
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Генерация QR-кода...</p>
              </div>
            )}
          </div>

          {/* Правая колонка - Информация */}
          <div className="space-y-6">
            {/* Информация о заказе */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                Информация о заказе
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID заказа:</span>
                  <span className="font-medium">#{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Номер заказа:</span>
                  <span className="font-medium">{orderNumber || 'Будет присвоен'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Текущий этап:</span>
                  <span className="font-medium">
                    {Array.isArray(stages) ? stages.find(s => s.id === selectedStageId)?.name || 'Не выбран' : 'Загрузка...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Инструкции */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                Что дальше?
              </h3>
              
              <div className="space-y-3 text-blue-800">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    QR-код автоматически добавлен в заказ-наряд и готов к использованию
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <Factory className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    Заказ передан в производство на этап "Конструкторское Бюро"
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    Отслеживайте прогресс в разделе "Заказы" или "Производство"
                  </p>
                </div>
              </div>
            </div>

            {/* Действия */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Действия
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Перейти к заказам
                </button>
                
                <button
                  onClick={() => navigate('/orders/create')}
                  className="w-full bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Создать новый заказ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;
