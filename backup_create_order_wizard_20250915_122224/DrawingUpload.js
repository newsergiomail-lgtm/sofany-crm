import React, { useState, useRef } from 'react';
import { Upload, File, X, Download, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DrawingUpload = ({ 
  drawings = [], 
  onUpload, 
  onDelete, 
  onDownload, 
  onView,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['.pdf', '.dwg', '.dxf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp']
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    if (files.length === 0) return;

    // Проверяем количество файлов
    if (drawings.length + files.length > maxFiles) {
      toast.error(`Максимальное количество файлов: ${maxFiles}`);
      return;
    }

    // Проверяем каждый файл
    for (const file of files) {
      // Проверяем размер файла
      if (file.size > maxFileSize) {
        toast.error(`Файл "${file.name}" слишком большой. Максимальный размер: ${Math.round(maxFileSize / 1024 / 1024)}MB`);
        continue;
      }

      // Проверяем тип файла
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (!acceptedTypes.includes(fileExtension)) {
        toast.error(`Файл "${file.name}" имеет неподдерживаемый формат. Поддерживаемые форматы: ${acceptedTypes.join(', ')}`);
        continue;
      }

      // Загружаем файл
      try {
        setUploading(true);
        await onUpload(file);
        toast.success(`Файл "${file.name}" загружен успешно`);
      } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        toast.error(`Ошибка загрузки файла "${file.name}"`);
      }
    }

    setUploading(false);
    
    // Очищаем input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('dwg') || fileType.includes('dxf')) return '📐';
    if (fileType.includes('image')) return '🖼️';
    return '📁';
  };

  return (
    <div className="space-y-4">
      {/* Область загрузки */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver 
            ? 'border-teal-500 bg-teal-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">
            {uploading ? 'Загрузка файлов...' : 'Перетащите чертежи сюда'}
          </p>
          <p className="text-sm text-gray-500">
            или <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              выберите файлы
            </button>
          </p>
          <p className="text-xs text-gray-400">
            Поддерживаемые форматы: {acceptedTypes.join(', ')} • Максимум {maxFiles} файлов • До {Math.round(maxFileSize / 1024 / 1024)}MB каждый
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Список загруженных файлов */}
      {drawings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Загруженные чертежи ({drawings.length})
          </h4>
          <div className="space-y-2">
            {drawings.map((drawing, index) => (
              <div
                key={drawing.id || index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {getFileIcon(drawing.file_type || drawing.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {drawing.file_name || drawing.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(drawing.file_size || drawing.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {onView && (
                    <button
                      type="button"
                      onClick={() => onView(drawing)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Просмотр"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  
                  {onDownload && (
                    <button
                      type="button"
                      onClick={() => onDownload(drawing)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Скачать"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                  
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(drawing)}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingUpload;
