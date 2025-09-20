import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  GripVertical,
  Save,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const KanbanColumnManager = () => {
  const [editingColumn, setEditingColumn] = useState(null);
  const [newColumn, setNewColumn] = useState({
    title: '',
    color: '#d1fae5',
    type: 'common'
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  // Получение колонок
  const { data: columns, isLoading } = useQuery('kanban-columns', async () => {
    const response = await fetch('/api/kanban/columns', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Ошибка загрузки колонок');
    return response.json();
  });

  // Создание колонки
  const createColumnMutation = useMutation(async (columnData) => {
    const response = await fetch('/api/kanban/columns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(columnData)
    });
    if (!response.ok) throw new Error('Ошибка создания колонки');
    return response.json();
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('kanban-columns');
      setShowAddForm(false);
      setNewColumn({ title: '', color: '#d1fae5', type: 'common' });
      toast.success('Колонка создана');
    }
  });

  // Обновление колонки
  const updateColumnMutation = useMutation(async ({ id, data }) => {
    const response = await fetch(`/api/kanban/columns/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Ошибка обновления колонки');
    return response.json();
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('kanban-columns');
      setEditingColumn(null);
      toast.success('Колонка обновлена');
    }
  });

  // Удаление колонки
  const deleteColumnMutation = useMutation(async (id) => {
    const response = await fetch(`/api/kanban/columns/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Ошибка удаления колонки');
    return response.json();
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('kanban-columns');
      toast.success('Колонка удалена');
    }
  });

  // Переупорядочивание колонок
  const reorderColumnsMutation = useMutation(async (reorderedColumns) => {
    const response = await fetch('/api/kanban/columns/reorder', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ columns: reorderedColumns })
    });
    if (!response.ok) throw new Error('Ошибка переупорядочивания');
    return response.json();
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('kanban-columns');
      toast.success('Порядок колонок обновлен');
    }
  });

  const handleCreateColumn = () => {
    if (!newColumn.title.trim()) {
      toast.error('Введите название колонки');
      return;
    }
    createColumnMutation.mutate(newColumn);
  };

  const handleUpdateColumn = (id, data) => {
    updateColumnMutation.mutate({ id, data });
  };

  const handleDeleteColumn = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту колонку?')) {
      deleteColumnMutation.mutate(id);
    }
  };

  const handleReorder = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(columns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const reorderedColumns = items.map((item, index) => ({
      id: item.id,
      position: index + 1
    }));
    
    reorderColumnsMutation.mutate(reorderedColumns);
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Загрузка...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Управление колонками канбана</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Добавить колонку
        </button>
      </div>

      {/* Форма добавления новой колонки */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Новая колонка</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Название</label>
              <input
                type="text"
                value={newColumn.title}
                onChange={(e) => setNewColumn({...newColumn, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Введите название колонки"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Цвет</label>
              <input
                type="color"
                value={newColumn.color}
                onChange={(e) => setNewColumn({...newColumn, color: e.target.value})}
                className="w-full h-10 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Тип</label>
              <select
                value={newColumn.type}
                onChange={(e) => setNewColumn({...newColumn, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="common">Общий</option>
                <option value="frame">Каркас</option>
                <option value="upholstery">Обивка</option>
                <option value="assembly">Сборка</option>
                <option value="completed">Завершено</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreateColumn}
              disabled={createColumnMutation.isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {createColumnMutation.isLoading ? 'Создание...' : 'Создать'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список колонок */}
      <div className="space-y-3">
        {columns?.map((column, index) => (
          <div key={column.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
            <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
            
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: column.color }}
            />
            
            <div className="flex-1">
              {editingColumn === column.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={column.title}
                    onChange={(e) => {
                      const updatedColumns = columns.map(c => 
                        c.id === column.id ? {...c, title: e.target.value} : c
                      );
                      // Обновляем локальное состояние
                    }}
                    className="px-2 py-1 border border-gray-300 rounded"
                  />
                  <input
                    type="color"
                    value={column.color}
                    onChange={(e) => {
                      const updatedColumns = columns.map(c => 
                        c.id === column.id ? {...c, color: e.target.value} : c
                      );
                      // Обновляем локальное состояние
                    }}
                    className="w-8 h-8 border border-gray-300 rounded"
                  />
                  <select
                    value={column.type}
                    onChange={(e) => {
                      const updatedColumns = columns.map(c => 
                        c.id === column.id ? {...c, type: e.target.value} : c
                      );
                      // Обновляем локальное состояние
                    }}
                    className="px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="common">Общий</option>
                    <option value="frame">Каркас</option>
                    <option value="upholstery">Обивка</option>
                    <option value="assembly">Сборка</option>
                    <option value="completed">Завершено</option>
                  </select>
                </div>
              ) : (
                <div>
                  <span className="font-medium text-gray-900">{column.title}</span>
                  <span className="ml-2 text-sm text-gray-500">({column.type})</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {editingColumn === column.id ? (
                <>
                  <button
                    onClick={() => handleUpdateColumn(column.id, {
                      title: column.title,
                      color: column.color,
                      type: column.type
                    })}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingColumn(null)}
                    className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditingColumn(column.id)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteColumn(column.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanColumnManager;
