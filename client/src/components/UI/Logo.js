import React from 'react';

const Logo = ({ size = 'medium', className = '', showText = true, color = 'teal' }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-8 h-8';
      case 'medium':
        return 'w-12 h-12';
      case 'large':
        return 'w-16 h-16';
      case 'xl':
        return 'w-20 h-20';
      default:
        return 'w-12 h-12';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-lg';
      case 'large':
        return 'text-xl';
      case 'xl':
        return 'text-2xl';
      default:
        return 'text-lg';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'teal':
        return 'text-teal-500';
      case 'white':
        return 'text-white';
      case 'black':
        return 'text-black';
      case 'gray':
        return 'text-gray-600';
      default:
        return 'text-teal-500';
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Логотип - буква S в квадрате */}
      <div className={`${getSizeClasses()} ${getColorClasses()} flex items-center justify-center border-2 border-current rounded-lg bg-current/10 shadow-sm`}>
        <span className="font-bold text-2xl leading-none">S</span>
      </div>
      
      {/* Текст Sofany */}
      {showText && (
        <span className={`${getTextSize()} font-semibold ${getColorClasses()} tracking-wide`}>
          Sofany
        </span>
      )}
    </div>
  );
};

export default Logo;
