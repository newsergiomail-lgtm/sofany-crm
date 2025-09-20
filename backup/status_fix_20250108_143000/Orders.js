// Бэкап настроек useQuery из Orders.js
// Дата: 2025-01-08 14:30:00

// Настройки useQuery для принудительного обновления
const { data, isLoading, error, refetch } = useQuery(
  ['orders', filters],
  () => ordersAPI.getAll(filters),
  {
    keepPreviousData: false, // Отключаем кэширование для принудительного обновления
    refetchOnWindowFocus: true, // Обновляем при фокусе на окне
    staleTime: 0, // Данные считаются устаревшими сразу
  }
);

// Функция handleCreateSuccess с двойным обновлением
const handleCreateSuccess = () => {
  setShowCreateModal(false);
  // Принудительно обновляем данные с задержкой
  setTimeout(() => {
    refetch();
  }, 100);
  
  // Дополнительное обновление через 500мс для гарантии
  setTimeout(() => {
    refetch();
  }, 500);
};








