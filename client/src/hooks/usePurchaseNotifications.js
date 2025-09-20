import { useState, useEffect } from 'react';
import { purchaseAPI } from '../services/api';

export const usePurchaseNotifications = () => {
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchaseCount();
    
    // Обновляем счетчик каждые 30 секунд
    const interval = setInterval(fetchPurchaseCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPurchaseCount = async () => {
    try {
      setLoading(true);
      
      // Получаем только заявки на закупку (purchase_requests)
      const response = await fetch('/api/purchase-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      });
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Считаем количество активных заявок на закупку (pending + approved)
        const activeRequests = data.filter(request => 
          request.status === 'pending' || request.status === 'approved'
        ).length;
        setPurchaseCount(activeRequests);
      }
    } catch (error) {
      console.error('Ошибка загрузки количества заявок на закупку:', error);
      setPurchaseCount(0);
    } finally {
      setLoading(false);
    }
  };

  return {
    purchaseCount,
    loading,
    refetch: fetchPurchaseCount
  };
};
