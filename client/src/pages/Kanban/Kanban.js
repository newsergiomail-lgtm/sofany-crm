import React, { useEffect, useRef, useState } from 'react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Kanban = () => {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('Kanban компонент рендерится');

  useEffect(() => {
    // Загружаем канбан с передачей токена
    if (iframeRef.current) {
      const token = localStorage.getItem('token');
      if (token) {
        // Передаем токен через URL параметр
        iframeRef.current.src = `/Kanban.html?token=${encodeURIComponent(token)}`;
      } else {
        iframeRef.current.src = '/Kanban.html';
      }
    }
  }, []);

  // Обработчик сообщений от iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'kanbanOrderUpdated') {
        // Обновляем данные в родительском компоненте
        window.dispatchEvent(new CustomEvent('kanbanOrderUpdated', {
          detail: event.data.order
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLoad = () => {
    console.log('Kanban iframe загружен');
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    console.error('Ошибка загрузки Kanban iframe');
    setIsLoading(false);
    setError('Ошибка загрузки Kanban доски');
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-glass btn-glass-primary btn-glass-md"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden', position: 'relative' }}>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-75 z-10">
          <LoadingSpinner />
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Канбан доска"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#fff' }}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default Kanban;