import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon, 
  color = 'gray' 
}) => {
  const colorClasses = {
    sofany: 'text-sofany-500 bg-sofany-100',
    blue: 'text-blue-500 bg-blue-100',
    green: 'text-green-500 bg-green-100',
    orange: 'text-orange-500 bg-orange-100',
    red: 'text-red-500 bg-red-100',
    gray: 'text-gray-500 bg-gray-100'
  };

  const changeClasses = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="stat-label">{title}</p>
          <p className="stat-value">{value}</p>
          <div className="flex items-center space-x-1 mt-1">
            {changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
            {changeType === 'negative' && <TrendingDown className="h-3 w-3" />}
            <span className={`text-xs ${changeClasses[changeType]}`}>
              {change}
            </span>
          </div>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;







































