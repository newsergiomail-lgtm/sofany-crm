import React, { useState, useEffect } from 'react';

const QRCodeImage = ({ qrCodeId, className, style, alt = "QR-код заказа" }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!qrCodeId) {
      setLoading(false);
      return;
    }

    const fetchQRCode = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError(true);
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/production/qr-image/${qrCodeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
          setError(false);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Ошибка загрузки QR-кода:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();

    // Очистка URL при размонтировании
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [qrCodeId, imageUrl]);

  if (loading) {
    return (
      <div 
        className={`${className} flex items-center justify-center bg-gray-100 border rounded`}
        style={style}
      >
        <div className="text-xs text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div 
        className={`${className} flex items-center justify-center bg-gray-100 border rounded`}
        style={style}
      >
        <div className="text-xs text-gray-500">QR-код недоступен</div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
    />
  );
};

export default QRCodeImage;
