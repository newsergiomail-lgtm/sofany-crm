import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Factory } from 'lucide-react';
import SimpleWorkOrder from '../components/SimpleWorkOrder';

const SimpleWorkOrderPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <Factory className="h-8 w-8 text-teal-600" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Заказ-наряд</h1>
                  <p className="text-sm text-gray-500">#{orderId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SimpleWorkOrder 
          orderId={orderId} 
          orderNumber={orderId} 
        />
      </div>
    </div>
  );
};

export default SimpleWorkOrderPage;
