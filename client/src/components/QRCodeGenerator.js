import React, { useState, useEffect } from 'react';
import { QrCode, Download, Printer } from 'lucide-react';

const QRCodeGenerator = ({ orderId, orderNumber, onClose }) => {
  const [qrCodeData, setQrCodeData] = useState('');

  useEffect(() => {
    // Генерируем URL для мобильного учета работ
    const baseUrl = window.location.origin;
    const mobileUrl = `${baseUrl}/work-tracking/mobile?order=${orderId}`;
    setQrCodeData(mobileUrl);
  }, [orderId]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-код для заказа #${orderNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              border: 2px solid #000;
              padding: 20px;
              display: inline-block;
              margin: 20px 0;
            }
            .qr-code {
              width: 200px !important;
              height: 200px !important;
            }
            .order-info {
              margin: 20px 0;
              font-size: 18px;
              font-weight: bold;
            }
            .instructions {
              margin: 20px 0;
              font-size: 14px;
              color: #666;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .qr-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="order-info">Заказ #${orderNumber}</div>
          <div class="qr-container">
            <div id="qrcode" class="qr-code"></div>
          </div>
          <div class="instructions">
            Отсканируйте QR-код для записи работ по этому заказу
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
          <script>
            QRCode.toCanvas(document.getElementById('qrcode'), '${qrCodeData}', {
              width: 200,
              height: 200,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            }, function (error) {
              if (error) console.error(error);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    const canvas = document.getElementById('qrcode-canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `qr-code-order-${orderNumber}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              QR-код для заказа #{orderNumber}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="text-center">
            <div className="bg-white border-2 border-gray-300 p-4 rounded-lg inline-block mb-4">
              <div id="qrcode-canvas"></div>
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              Отсканируйте QR-код для записи работ по этому заказу
            </div>

            <div className="space-y-2">
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Printer className="h-4 w-4" />
                Печать
              </button>
              
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                Скачать
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;







