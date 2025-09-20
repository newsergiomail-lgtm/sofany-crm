import React, { useState, useEffect } from 'react';
import { QrCode, Download, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { productionAPI, qrUtils } from '../../services/productionAPI';
import toast from 'react-hot-toast';

const QRCodeGenerator = ({ orderId, orderNumber, currentStage, onQRGenerated }) => {
  const [stages, setStages] = useState([]);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStageSelector, setShowStageSelector] = useState(false);

  // Загружаем этапы производства
  useEffect(() => {
    loadStages();
  }, []);

  // Автоматически выбираем первый этап (Конструкторское Бюро)
  useEffect(() => {
    if (stages.length > 0 && !selectedStageId) {
      // Находим этап "Конструкторское Бюро" (первый в последовательности)
      const firstStage = stages.find(stage => stage.order_index === 1) || stages[0];
      setSelectedStageId(firstStage.id);
    }
  }, [stages, selectedStageId]);

  const loadStages = async () => {
    try {
      setIsLoading(true);
      const response = await productionAPI.getStages();
      setStages(response.data.stages);
      setError(null);
    } catch (error) {
      console.error('Ошибка загрузки этапов:', error);
      setError('Ошибка загрузки этапов производства');
      toast.error('Ошибка загрузки этапов производства');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!selectedStageId) {
      toast.error('Выберите этап производства');
      return;
    }

    if (!orderId || orderId === 'Будет присвоен автоматически') {
      toast.error('Сначала сохраните заказ, чтобы сгенерировать QR-код');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const response = await productionAPI.generateQR(orderId, selectedStageId);
      
      if (response.data.success) {
        setQrCode(response.data.qr_code);
        toast.success('QR-код успешно сгенерирован');
        
        // Уведомляем родительский компонент
        if (onQRGenerated) {
          onQRGenerated(response.data.qr_code);
        }
      } else {
        throw new Error(response.data.error || 'Ошибка генерации QR-кода');
      }
    } catch (error) {
      console.error('Ошибка генерации QR-кода:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Ошибка генерации QR-кода';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadQR = async () => {
    if (!qrCode?.qr_image) {
      toast.error('Нет QR-кода для скачивания');
      return;
    }

    try {
      // Создаем ссылку для скачивания
      const link = document.createElement('a');
      link.href = qrCode.qr_image;
      link.download = `QR_${orderNumber}_${qrCode.stage_name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR-код скачан');
    } catch (error) {
      console.error('Ошибка скачивания QR-кода:', error);
      toast.error('Ошибка скачивания QR-кода');
    }
  };

  const handleRefresh = () => {
    setQrCode(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <RefreshCw className="h-6 w-6 animate-spin text-teal-600" />
        <span className="ml-2 text-gray-600">Загрузка этапов...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Заголовок и статус */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
            <QrCode className="h-4 w-4 text-teal-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">QR-код для производства</h3>
            <p className="text-xs text-gray-500">Генерация заказ-наряда</p>
          </div>
        </div>
        {qrCode && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            <CheckCircle className="h-3 w-3" />
            Готов
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Выбор этапа - компактный */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Этап производства
          </label>
          <button
            type="button"
            onClick={() => setShowStageSelector(!showStageSelector)}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
          >
            {showStageSelector ? 'Скрыть' : 'Изменить'}
          </button>
        </div>
        
        {showStageSelector ? (
          <select
            value={selectedStageId || ''}
            onChange={(e) => setSelectedStageId(parseInt(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
            disabled={isGenerating}
          >
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
                {stage.can_work_parallel && ' (параллельно)'}
              </option>
            ))}
          </select>
        ) : (
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
            {stages.find(s => s.id === selectedStageId)?.name || 'Загрузка...'}
          </div>
        )}
      </div>

      {/* Информация о заказе - компактная */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-500">Заказ:</span>
            <span className="ml-1 font-medium text-gray-900">#{orderNumber}</span>
          </div>
          <div>
            <span className="text-gray-500">ID:</span>
            <span className="ml-1 font-medium text-gray-900">{orderId}</span>
          </div>
        </div>
        {(!orderId || orderId === 'Будет присвоен автоматически') && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
            💡 Сначала сохраните заказ, чтобы получить ID для генерации QR-кода
          </div>
        )}
      </div>

      {/* Кнопка генерации */}
      <button
        onClick={handleGenerateQR}
        disabled={!selectedStageId || isGenerating || !orderId || orderId === 'Будет присвоен автоматически'}
        className="w-full bg-teal-600 text-white px-4 py-2.5 rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium"
      >
        {isGenerating ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <QrCode className="h-4 w-4" />
        )}
        {isGenerating ? 'Генерация...' : 
         (!orderId || orderId === 'Будет присвоен автоматически') ? 'Сначала сохраните заказ' : 
         'Сгенерировать QR-код'}
      </button>

      {/* Отображение QR-кода - компактное */}
      {qrCode && (
        <div className="space-y-4">
          {/* Статус успеха */}
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">QR-код готов</p>
              <p className="text-xs text-green-700">
                Этап: {qrCode.stage_name} • Действует 30 дней
              </p>
            </div>
          </div>

          {/* QR-код и действия */}
          <div className="space-y-3">
            {/* QR-код изображение */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={qrCode.qr_image}
                  alt="QR Code"
                  className="w-32 h-32 border border-gray-200 rounded-lg"
                />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-2">
              <button
                onClick={handleDownloadQR}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 text-sm"
              >
                <Download className="h-3 w-3" />
                Скачать
              </button>
              <button
                onClick={handleRefresh}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 text-sm"
              >
                <RefreshCw className="h-3 w-3" />
                Обновить
              </button>
            </div>

            {/* Информация о QR-коде */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-700">ID QR-кода:</span>
                  <span className="font-mono text-blue-900">#{qrCode.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Создан:</span>
                  <span className="text-blue-900">{new Date().toLocaleString('ru-RU')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Действует до:</span>
                  <span className="text-blue-900">{new Date(qrCode.expires_at).toLocaleString('ru-RU')}</span>
                </div>
              </div>
            </div>

            {/* Инструкция */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>💡 Инструкция:</strong> Распечатайте QR-код и прикрепите к заказ-наряду. 
                Мастера смогут сканировать его для подтверждения принятия заказа в работу.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
