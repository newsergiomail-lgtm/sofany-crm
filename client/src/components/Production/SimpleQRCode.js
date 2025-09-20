import React, { useState } from 'react';
import { QrCode, Download, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SimpleQRCode = ({ orderId, orderNumber, size = 200 }) => {
  const [qrCode, setQrCode] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQR = async () => {
    if (!orderId || orderId === 'Будет присвоен автоматически') {
      toast.error('Сначала сохраните заказ, чтобы получить ID');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Создаем простой QR-код с помощью QR.js или генерируем URL
      const qrData = {
        orderId: orderId,
        orderNumber: orderNumber,
        timestamp: new Date().toISOString(),
        type: 'production_order'
      };
      
      // Используем QR-код сервис для генерации
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(JSON.stringify(qrData))}`;
      
      // Проверяем, что изображение загружается
      const img = new Image();
      img.onload = () => {
        setQrCode({
          qr_image: qrUrl,
          id: `qr_${orderId}_${Date.now()}`,
          stage_name: 'Конструкторское Бюро',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          data: qrData
        });
        toast.success('QR-код сгенерирован');
      };
      img.onerror = () => {
        throw new Error('Ошибка загрузки QR-кода');
      };
      img.src = qrUrl;
      
    } catch (error) {
      console.error('Ошибка генерации QR-кода:', error);
      toast.error('Ошибка генерации QR-кода');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!qrCode?.qr_image) {
      toast.error('Нет QR-кода для скачивания');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = qrCode.qr_image;
      link.download = `QR_${orderNumber || orderId}_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR-код скачан');
    } catch (error) {
      console.error('Ошибка скачивания QR-кода:', error);
      toast.error('Ошибка скачивания QR-кода');
    }
  };

  const refreshQR = () => {
    setQrCode(null);
  };

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <QrCode className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-900">QR-код заказа</h4>
          <p className="text-sm text-gray-500">Для производства</p>
        </div>
      </div>

      {/* Информация о заказе */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-3 text-sm">
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
        onClick={generateQR}
        disabled={!orderId || orderId === 'Будет присвоен автоматически' || isGenerating}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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

      {/* Отображение QR-кода */}
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

          {/* QR-код изображение */}
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={qrCode.qr_image}
                alt="QR Code"
                className={`w-${size/8} h-${size/8} border border-gray-200 rounded-lg`}
                style={{ width: `${size}px`, height: `${size}px` }}
              />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-2">
            <button
              onClick={downloadQR}
              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 text-sm"
            >
              <Download className="h-3 w-3" />
              Скачать
            </button>
            <button
              onClick={refreshQR}
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
      )}
    </div>
  );
};

export default SimpleQRCode;

