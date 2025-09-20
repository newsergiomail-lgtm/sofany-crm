import React, { useState, useEffect } from 'react';
import { QrCode, Download } from 'lucide-react';
import { productionAPI } from '../../services/productionAPI';
import toast from 'react-hot-toast';

const SimpleQRCodeGenerator = ({ orderId, orderNumber }) => {
  const [qrCode, setQrCode] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateQR = async () => {
    if (!orderId) {
      toast.error('ID заказа не найден');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      const response = await productionAPI.generateQR(orderId, 1);
      
      if (response.data && response.data.qr_code && response.data.qr_code.qr_image) {
        setQrCode(response.data.qr_code.qr_image);
        toast.success('QR-код сгенерирован');
      } else {
        throw new Error('Не удалось получить QR-код');
      }
    } catch (error) {
      console.error('Ошибка генерации QR-кода:', error);
      setError('Ошибка генерации QR-кода');
      toast.error('Ошибка генерации QR-кода');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `qr-code-${orderNumber || orderId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4">
      {/* Кнопка генерации */}
      <button
        onClick={handleGenerateQR}
        disabled={isGenerating}
        className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <QrCode className="h-4 w-4" />
        )}
        {isGenerating ? 'Генерация...' : 'Сгенерировать QR-код'}
      </button>

      {/* Ошибка */}
      {error && (
        <div className="text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      {/* QR-код */}
      {qrCode && (
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 flex justify-center">
            <img 
              src={qrCode} 
              alt="QR Code" 
              className="max-w-48 max-h-48"
            />
          </div>
          
          <button
            onClick={handleDownload}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Скачать QR-код
          </button>
        </div>
      )}
    </div>
  );
};

export default SimpleQRCodeGenerator;
