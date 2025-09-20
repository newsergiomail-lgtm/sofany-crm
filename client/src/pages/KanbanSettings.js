import React from 'react';
import KanbanColumnManager from '../components/KanbanColumnManager';

const KanbanSettings = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Настройки канбана</h1>
        <p className="text-gray-600">Управление колонками и этапами производства</p>
      </div>
      
      <KanbanColumnManager />
    </div>
  );
};

export default KanbanSettings;
