import React from 'react';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';

const LowStockAlert = ({ materials, loading }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Низкие остатки</h3>
        </div>
        <div className="card-content">
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="md" />
          </div>
        </div>
      </div>
    );
  }

  const lowStockMaterials = materials.filter(material => 
    material.stock_status === 'low' || material.stock_status === 'warning'
  );

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Низкие остатки</h3>
          <Link 
            to="/materials" 
            className="text-sm text-sofany-600 hover:text-sofany-700 font-medium"
          >
            Все материалы
          </Link>
        </div>
      </div>
      <div className="card-content">
        {lowStockMaterials.length === 0 ? (
          <div className="empty-state">
            <Package className="empty-state-icon" />
            <h3 className="empty-state-title">Все в порядке</h3>
            <p className="empty-state-description">
              Остатки всех материалов в норме
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockMaterials.map((material) => (
              <div key={material.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div>
                    <Link 
                      to={`/materials/${material.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-sofany-600"
                    >
                      {material.name}
                    </Link>
                    <p className="text-xs text-gray-600">
                      {material.category_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">
                    {material.current_stock} {material.unit}
                  </p>
                  <p className="text-xs text-gray-500">
                    мин: {material.min_stock}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LowStockAlert;





































