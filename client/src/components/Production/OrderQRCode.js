import React, { useState, useEffect, useCallback } from 'react';
import { QrCode, Download, RefreshCw } from 'lucide-react';
import { productionAPI } from '../../services/productionAPI';
import toast from 'react-hot-toast';

const OrderQRCode = ({ orderId, orderNumber, onQRGenerated }) => {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateQR = useCallback(async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Генерируем QR-код для заказа:', orderId);
      const token = localStorage.getItem('token');
      console.log('Токен аутентификации:', token ? 'есть' : 'отсутствует');
      
      const response = await productionAPI.generateQR(orderId, 1, {
        'Authorization': `Bearer ${token}`
      }); // Этап 1 - начало производства
      console.log('Ответ API QR-кода:', response);
      
      if (response.success) {
        setQrCode(response.qr_code);
        if (onQRGenerated) {
          onQRGenerated(response.qr_code);
        }
        toast.success('QR-код сгенерирован');
      } else {
        throw new Error(response.error || 'Ошибка генерации QR-кода');
      }
    } catch (err) {
      console.error('Ошибка генерации QR-кода:', err);
      setError(err.message);
      toast.error(`Ошибка генерации QR-кода: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [orderId, onQRGenerated]);

  const downloadQR = () => {
    if (qrCode?.qr_image) {
      const link = document.createElement('a');
      link.href = qrCode.qr_image;
      link.download = `qr-code-${orderNumber || orderId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Автоматически генерируем QR-код при получении orderId
  useEffect(() => {
    if (orderId && !qrCode) {
      generateQR();
    }
  }, [orderId, qrCode, generateQR]);

  if (!orderId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <QrCode className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">QR-код</h2>
            <p className="text-sm text-gray-500">Для производства</p>
          </div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-gray-500 text-sm mb-2">
            QR-код будет сгенерирован после сохранения заказа
          </div>
          <div className="text-xs text-gray-400">
            Сначала заполните и сохраните заказ, затем QR-код появится здесь
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <QrCode className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">QR-код</h2>
            <p className="text-sm text-gray-500">Для производства</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={generateQR}
            disabled={loading}
            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50"
            title="Обновить QR-код"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {qrCode && (
            <button
              onClick={downloadQR}
              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              title="Скачать QR-код"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {loading && (
        <div className="text-center p-8">
          <RefreshCw className="h-8 w-8 text-teal-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Генерация QR-кода...</p>
        </div>
      )}
      
      {error && (
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="text-red-600 text-sm mb-2">{error}</p>
          <button
            onClick={generateQR}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Попробовать снова
          </button>
        </div>
      )}
      
      {qrCode && !loading && (
        <div className="text-center">
          <div className="mb-4">
            <img
              src={qrCode.qr_image}
              alt="QR-код заказа"
              className="mx-auto w-48 h-48 border border-gray-200 rounded-lg"
            />
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium">Заказ #{orderNumber || orderId}</p>
            <p className="text-xs text-gray-500 mt-1">
              Этап: {qrCode.stage_name || 'Начало производства'}
            </p>
            <p className="text-xs text-gray-500">
              Действителен до: {new Date(qrCode.expires_at).toLocaleDateString('ru-RU')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderQRCode;
