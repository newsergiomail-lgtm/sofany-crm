import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  QrCode, 
  FileText, 
  Calendar, 
  User, 
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Printer,
  FileImage,
  Upload,
  X,
  Trash2,
  File,
  Image,
  Ruler,
  Folder
} from 'lucide-react';
import { useQuery } from 'react-query';
import { ordersAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

const OrderWorkOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [drawings, setDrawings] = useState([]);
  const [loadingDrawings, setLoadingDrawings] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [uploadingDrawings, setUploadingDrawings] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Получаем данные заказа
  const { data: order, isLoading, error } = useQuery(
    ['order', id],
    () => ordersAPI.getById(id),
    {
      enabled: !!id,
      onError: (error) => {
        console.error('Ошибка загрузки заказа:', error);
        toast.error('Ошибка загрузки заказа');
      }
    }
  );

  // Получаем QR-код заказа (используем тот же способ, что и в OrderDetail)
  const { data: qrData, isLoading: qrLoading } = useQuery(
    ['qr-code', order?.qr_code_id],
    () => {
      if (!order?.qr_code_id) return null;
      return fetch(`/api/production/qr-image/${order.qr_code_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      }).then(res => res.blob()).then(blob => URL.createObjectURL(blob));
    },
    {
      enabled: !!order?.qr_code_id,
      onError: (error) => {
        console.error('Ошибка загрузки QR-кода:', error);
      }
    }
  );

  // Получаем чертежи заказа
  const loadDrawings = async () => {
    if (!id) return;
    
    setLoadingDrawings(true);
    try {
      const response = await fetch(`/api/orders/${id}/drawings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      });
      
      if (response.ok) {
        const drawingsData = await response.json();
        setDrawings(drawingsData.files || []);
      } else {
        console.log('Чертежи не найдены или API не поддерживается');
        setDrawings([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки чертежей:', error);
      setDrawings([]);
    } finally {
      setLoadingDrawings(false);
    }
  };

  useEffect(() => {
    loadDrawings();
  }, [id]);

  // Загрузка чертежей
  const uploadDrawings = async (files) => {
    if (!files || files.length === 0) return;

    setUploadingDrawings(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('drawing', file);
        formData.append('order_id', id);

        const response = await fetch(`/api/orders/${id}/drawings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Ошибка загрузки файла ${file.name}`);
        }
      }

      toast.success(`Загружено файлов: ${files.length}`);
      // Перезагружаем список чертежей
      await loadDrawings();
    } catch (error) {
      console.error('Ошибка загрузки чертежей:', error);
      toast.error('Ошибка загрузки чертежей');
    } finally {
      setUploadingDrawings(false);
    }
  };

  // Удаление чертежа
  const deleteDrawing = async (drawingId) => {
    try {
      const response = await fetch(`/api/orders/${id}/drawings/${drawingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        }
      });

      if (response.ok) {
        toast.success('Чертеж удален');
        await loadDrawings();
      } else {
        throw new Error('Ошибка удаления чертежа');
      }
    } catch (error) {
      console.error('Ошибка удаления чертежа:', error);
      toast.error('Ошибка удаления чертежа');
    }
  };

  // Обработка drag & drop
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
    uploadDrawings(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    uploadDrawings(files);
  };

  // Функция для определения иконки файла
  const getFileIcon = (fileType, fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    
    if (fileType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'svg'].includes(extension)) {
      return <Image className="h-4 w-4 text-blue-500" />;
    } else if (['pdf'].includes(extension)) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (['dwg', 'dxf'].includes(extension)) {
      return <Ruler className="h-4 w-4 text-green-500" />;
    } else if (['skp'].includes(extension)) {
      return <Package className="h-4 w-4 text-purple-500" />;
    } else {
      return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  // Генерация PDF с помощью HTML2Canvas
  const generatePDF = async () => {
    setGeneratingPDF(true);
    try {
      // Создаем HTML элемент для PDF
      const pdfContent = document.createElement('div');
      pdfContent.style.cssText = `
        width: 210mm;
        min-height: 297mm;
        padding: 20mm;
        background: white;
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #333;
        box-sizing: border-box;
      `;

      // Заголовок
      const header = document.createElement('div');
      header.style.cssText = `
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #2563eb;
        padding-bottom: 20px;
      `;
      
      const title = document.createElement('h1');
      title.textContent = 'ЗАКАЗ-НАРЯД';
      title.style.cssText = `
        font-size: 24px;
        font-weight: bold;
        margin: 0 0 10px 0;
        color: #1e40af;
      `;
      
      const orderNumber = document.createElement('div');
      orderNumber.textContent = `№ ${order.order_number}`;
      orderNumber.style.cssText = `
        font-size: 16px;
        font-weight: bold;
        color: #374151;
      `;
      
      header.appendChild(title);
      header.appendChild(orderNumber);
      
      // QR-код
      if (qrData) {
        console.log('Добавляем QR-код в PDF:', qrData);
        
        const qrContainer = document.createElement('div');
        qrContainer.style.cssText = `
          position: absolute;
          top: 0;
          right: 0;
          width: 60px;
          height: 60px;
          z-index: 10;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 4px;
        `;
        
        const qrImg = document.createElement('img');
        qrImg.src = qrData;
        qrImg.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        `;
        
        qrImg.onload = () => console.log('QR-код загружен в PDF');
        qrImg.onerror = () => console.warn('Ошибка загрузки QR-кода в PDF');
        
        qrContainer.appendChild(qrImg);
        header.appendChild(qrContainer);
      } else {
        console.warn('QR-код не найден для PDF:', qrData);
      }
      
      pdfContent.appendChild(header);

      // Информация о клиенте
      const clientSection = document.createElement('div');
      clientSection.style.cssText = `
        margin-bottom: 25px;
        padding: 15px;
        background: #f8fafc;
        border-left: 4px solid #2563eb;
        border-radius: 4px;
      `;
      
      const clientTitle = document.createElement('h2');
      clientTitle.textContent = 'ИНФОРМАЦИЯ О КЛИЕНТЕ';
      clientTitle.style.cssText = `
        font-size: 14px;
        font-weight: bold;
        margin: 0 0 15px 0;
        color: #1e40af;
      `;
      
      const clientInfo = document.createElement('div');
      clientInfo.innerHTML = `
        <div style="margin-bottom: 8px;"><strong>Клиент:</strong> ${order.customer?.name || 'Не указан'}</div>
        <div style="margin-bottom: 8px;"><strong>Телефон:</strong> ${order.customer?.phone || 'Не указан'}</div>
        <div style="margin-bottom: 8px;"><strong>Email:</strong> ${order.customer?.email || 'Не указан'}</div>
        <div style="margin-bottom: 8px;"><strong>Компания:</strong> ${order.customer?.company || 'Не указана'}</div>
        <div><strong>Адрес:</strong> ${order.customer?.address || 'Не указан'}</div>
      `;
      
      clientSection.appendChild(clientTitle);
      clientSection.appendChild(clientInfo);
      pdfContent.appendChild(clientSection);

      // Информация о доставке
      if (order.delivery_address || order.floor || order.has_elevator !== null || order.delivery_notes) {
        const deliverySection = document.createElement('div');
        deliverySection.style.cssText = `
          margin-bottom: 25px;
          padding: 15px;
          background: #f0f9ff;
          border-left: 4px solid #0ea5e9;
          border-radius: 4px;
        `;
        
        const deliveryTitle = document.createElement('h2');
        deliveryTitle.textContent = 'ИНФОРМАЦИЯ О ДОСТАВКЕ';
        deliveryTitle.style.cssText = `
          font-size: 14px;
          font-weight: bold;
          margin: 0 0 15px 0;
          color: #0369a1;
        `;
        
        const deliveryInfo = document.createElement('div');
        let deliveryHTML = '';
        if (order.delivery_address) deliveryHTML += `<div style="margin-bottom: 8px;"><strong>Адрес доставки:</strong> ${order.delivery_address}</div>`;
        if (order.floor) deliveryHTML += `<div style="margin-bottom: 8px;"><strong>Этаж:</strong> ${order.floor}</div>`;
        if (order.has_elevator !== null) deliveryHTML += `<div style="margin-bottom: 8px;"><strong>Есть лифт:</strong> ${order.has_elevator ? 'Да' : 'Нет'}</div>`;
        if (order.delivery_notes) deliveryHTML += `<div><strong>Примечания:</strong> ${order.delivery_notes}</div>`;
        deliveryInfo.innerHTML = deliveryHTML;
        
        deliverySection.appendChild(deliveryTitle);
        deliverySection.appendChild(deliveryInfo);
        pdfContent.appendChild(deliverySection);
      }

      // Информация о заказе
      const orderSection = document.createElement('div');
      orderSection.style.cssText = `
        margin-bottom: 25px;
        padding: 15px;
        background: #f0fdf4;
        border-left: 4px solid #16a34a;
        border-radius: 4px;
      `;
      
      const orderTitle = document.createElement('h2');
      orderTitle.textContent = 'ИНФОРМАЦИЯ О ЗАКАЗЕ';
      orderTitle.style.cssText = `
        font-size: 14px;
        font-weight: bold;
        margin: 0 0 15px 0;
        color: #15803d;
      `;
      
      const orderInfo = document.createElement('div');
      orderInfo.innerHTML = `
        <div style="margin-bottom: 8px;"><strong>Изделие:</strong> ${order.product_name || 'Не указано'}</div>
        <div style="margin-bottom: 8px;"><strong>Статус:</strong> ${getStatusText(order.status)}</div>
        <div style="margin-bottom: 8px;"><strong>Приоритет:</strong> ${getPriorityText(order.priority)}</div>
        <div style="margin-bottom: 8px;"><strong>Дата создания:</strong> ${order.created_at ? new Date(order.created_at).toLocaleDateString('ru-RU') : 'Не указана'}</div>
        <div style="margin-bottom: 8px;"><strong>Дата доставки:</strong> ${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('ru-RU') : 'Не указана'}</div>
        <div style="margin-bottom: 8px;"><strong>Общая сумма:</strong> ${order.total_amount ? order.total_amount.toLocaleString('ru-RU') : 0} ₽</div>
        <div style="margin-bottom: 8px;"><strong>Оплачено:</strong> ${order.paid_amount ? order.paid_amount.toLocaleString('ru-RU') : 0} ₽</div>
        <div style="margin-bottom: 8px;"><strong>Остаток к доплате:</strong> ${order.total_amount && order.paid_amount ? (order.total_amount - order.paid_amount).toLocaleString('ru-RU') : 'Не рассчитано'} ₽</div>
        <div style="margin-bottom: 8px;"><strong>Создал:</strong> ${order.created_by_name || 'Не указан'}</div>
        <div><strong>Источник:</strong> ${order.source || 'CRM'}</div>
      `;
      
      orderSection.appendChild(orderTitle);
      orderSection.appendChild(orderInfo);
      pdfContent.appendChild(orderSection);

      // Описания
      if (order.notes) {
        const notesSection = document.createElement('div');
        notesSection.style.cssText = `
          margin-bottom: 25px;
          padding: 15px;
          background: #fefce8;
          border-left: 4px solid #eab308;
          border-radius: 4px;
        `;
        
        const notesTitle = document.createElement('h2');
        notesTitle.textContent = 'КРАТКОЕ ОПИСАНИЕ';
        notesTitle.style.cssText = `
          font-size: 14px;
          font-weight: bold;
          margin: 0 0 15px 0;
          color: #a16207;
        `;
        
        const notesContent = document.createElement('div');
        notesContent.textContent = order.notes;
        notesContent.style.cssText = `
          white-space: pre-wrap;
          line-height: 1.6;
        `;
        
        notesSection.appendChild(notesTitle);
        notesSection.appendChild(notesContent);
        pdfContent.appendChild(notesSection);
      }

      if (order.project_description) {
        const descSection = document.createElement('div');
        descSection.style.cssText = `
          margin-bottom: 25px;
          padding: 15px;
          background: #fdf2f8;
          border-left: 4px solid #ec4899;
          border-radius: 4px;
        `;
        
        const descTitle = document.createElement('h2');
        descTitle.textContent = 'ПОДРОБНОЕ ОПИСАНИЕ';
        descTitle.style.cssText = `
          font-size: 14px;
          font-weight: bold;
          margin: 0 0 15px 0;
          color: #be185d;
        `;
        
        const descContent = document.createElement('div');
        descContent.textContent = order.project_description;
        descContent.style.cssText = `
          white-space: pre-wrap;
          line-height: 1.6;
        `;
        
        descSection.appendChild(descTitle);
        descSection.appendChild(descContent);
        pdfContent.appendChild(descSection);
      }

      // Таблица материалов
      if (order.items && order.items.length > 0) {
        const materialsSection = document.createElement('div');
        materialsSection.style.cssText = `
          margin-bottom: 25px;
        `;
        
        const materialsTitle = document.createElement('h2');
        materialsTitle.textContent = 'МАТЕРИАЛЫ';
        materialsTitle.style.cssText = `
          font-size: 14px;
          font-weight: bold;
          margin: 0 0 15px 0;
          color: #7c3aed;
        `;
        
        const table = document.createElement('table');
        table.style.cssText = `
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        `;
        
        // Заголовки таблицы
        const thead = document.createElement('thead');
        thead.innerHTML = `
          <tr style="background: #f3f4f6;">
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">№</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Наименование</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Кол-во</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Цена</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Сумма</th>
          </tr>
        `;
        
        // Данные таблицы
        const tbody = document.createElement('tbody');
        order.items.forEach((item, index) => {
          const row = document.createElement('tr');
          row.style.cssText = index % 2 === 0 ? 'background: #f9fafb;' : 'background: white;';
          row.innerHTML = `
            <td style="border: 1px solid #d1d5db; padding: 8px;">${index + 1}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${item.name || ''}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${item.quantity || 0}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${item.unit_price ? item.unit_price.toLocaleString('ru-RU') : 0} ₽</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: bold;">${item.total_price ? item.total_price.toLocaleString('ru-RU') : 0} ₽</td>
          `;
          tbody.appendChild(row);
        });
        
        // Итоговая строка
        const totalRow = document.createElement('tr');
        totalRow.style.cssText = 'background: #e5e7eb; font-weight: bold;';
        totalRow.innerHTML = `
          <td colspan="4" style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">ИТОГО:</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${order.total_amount ? order.total_amount.toLocaleString('ru-RU') : 0} ₽</td>
        `;
        tbody.appendChild(totalRow);
        
        table.appendChild(thead);
        table.appendChild(tbody);
        
        materialsSection.appendChild(materialsTitle);
        materialsSection.appendChild(table);
        pdfContent.appendChild(materialsSection);
      }

      // Чертежи и файлы
      if (drawings.length > 0) {
        const drawingsSection = document.createElement('div');
        drawingsSection.style.cssText = `
          margin-bottom: 25px;
        `;
        
        const drawingsTitle = document.createElement('h2');
        drawingsTitle.textContent = 'ЧЕРТЕЖИ И ФАЙЛЫ';
        drawingsTitle.style.cssText = `
          font-size: 14px;
          font-weight: bold;
          margin: 0 0 15px 0;
          color: #dc2626;
        `;
        
        const drawingsList = document.createElement('div');
        drawingsList.style.cssText = `
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
        `;
        
        for (let index = 0; index < drawings.length; index++) {
          const drawing = drawings[index];
          
          const drawingItem = document.createElement('div');
          drawingItem.style.cssText = `
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            background: white;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          `;
          
          const drawingHeader = document.createElement('div');
          drawingHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          `;
          
          const drawingName = document.createElement('div');
          drawingName.textContent = `${index + 1}. ${drawing.file_name || drawing.name}`;
          drawingName.style.cssText = `
            font-weight: bold;
            color: #374151;
          `;
          
          const drawingType = document.createElement('div');
          drawingType.textContent = drawing.file_type || 'Неизвестно';
          drawingType.style.cssText = `
            font-size: 11px;
            color: #6b7280;
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
          `;
          
          drawingHeader.appendChild(drawingName);
          drawingHeader.appendChild(drawingType);
          
          const drawingInfo = document.createElement('div');
          drawingInfo.style.cssText = `
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 10px;
          `;
          drawingInfo.innerHTML = `
            <div>Размер: ${drawing.file_size ? (drawing.file_size / 1024).toFixed(1) + ' KB' : 'Неизвестно'}</div>
            <div>Дата: ${drawing.created_at ? new Date(drawing.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}</div>
          `;
          
          drawingItem.appendChild(drawingHeader);
          drawingItem.appendChild(drawingInfo);
          
          // Добавляем изображение чертежа
          if (drawing.file_type?.startsWith('image/') || 
              ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(drawing.file_name?.split('.').pop()?.toLowerCase())) {
            try {
              const response = await fetch(`/api/orders/${id}/drawings/${drawing.id}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
                }
              });
              
              if (response.ok) {
                const blob = await response.blob();
                
                // Конвертируем blob в base64
                const base64 = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.readAsDataURL(blob);
                });
                
                const img = document.createElement('img');
                img.style.cssText = `
                  width: 100%;
                  max-height: 200px;
                  object-fit: contain;
                  border-radius: 4px;
                  border: 1px solid #e5e7eb;
                  display: block;
                  margin: 0 auto;
                `;
                
                // Ждем загрузки изображения
                await new Promise((resolve) => {
                  img.onload = () => {
                    // Правильное масштабирование изображения
                    const maxWidth = 400; // Увеличиваем максимальную ширину
                    const maxHeight = 300; // Увеличиваем максимальную высоту
                    
                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                    let newWidth = maxWidth;
                    let newHeight = maxWidth / aspectRatio;
                    
                    // Если высота превышает максимум, масштабируем по высоте
                    if (newHeight > maxHeight) {
                      newHeight = maxHeight;
                      newWidth = maxHeight * aspectRatio;
                    }
                    
                    img.style.width = `${newWidth}px`;
                    img.style.height = `${newHeight}px`;
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '200px';
                    
                    drawingItem.appendChild(img);
                    resolve();
                  };
                  img.onerror = () => {
                    console.warn('Ошибка загрузки изображения:', drawing.file_name);
                    // Добавляем заглушку для неудачных изображений
                    const placeholder = document.createElement('div');
                    placeholder.style.cssText = `
                      width: 100%;
                      height: 200px;
                      background: #f3f4f6;
                      border: 2px dashed #d1d5db;
                      border-radius: 4px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: #6b7280;
                      font-size: 12px;
                    `;
                    placeholder.textContent = 'Изображение не загружено';
                    drawingItem.appendChild(placeholder);
                    resolve();
                  };
                  img.src = base64; // Используем base64 вместо URL
                });
              } else {
                // Добавляем заглушку для неудачных запросов
                const placeholder = document.createElement('div');
                placeholder.style.cssText = `
                  width: 100%;
                  height: 200px;
                  background: #f3f4f6;
                  border: 2px dashed #d1d5db;
                  border-radius: 4px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #6b7280;
                  font-size: 12px;
                `;
                placeholder.textContent = 'Ошибка загрузки';
                drawingItem.appendChild(placeholder);
              }
            } catch (error) {
              console.warn('Ошибка загрузки изображения:', error);
              // Добавляем заглушку для ошибок
              const placeholder = document.createElement('div');
              placeholder.style.cssText = `
                width: 100%;
                height: 200px;
                background: #f3f4f6;
                border: 2px dashed #d1d5db;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #6b7280;
                font-size: 12px;
              `;
              placeholder.textContent = 'Ошибка загрузки';
              drawingItem.appendChild(placeholder);
            }
          }
          
          drawingsList.appendChild(drawingItem);
        }
        
        drawingsSection.appendChild(drawingsTitle);
        drawingsSection.appendChild(drawingsList);
        pdfContent.appendChild(drawingsSection);
      }

      // Подпись
      const footer = document.createElement('div');
      footer.style.cssText = `
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        font-size: 11px;
        color: #6b7280;
      `;
      footer.innerHTML = `
        <div>PDF сгенерирован: ${new Date().toLocaleString('ru-RU')}</div>
        <div>Система: SofanyCRM</div>
      `;
      
      pdfContent.appendChild(footer);

      // Добавляем элемент на страницу для рендеринга
      pdfContent.style.position = 'absolute';
      pdfContent.style.left = '-9999px';
      pdfContent.style.top = '0';
      document.body.appendChild(pdfContent);

      // Ждем загрузки всех изображений
      const images = pdfContent.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Продолжаем даже если изображение не загрузилось
          }
        });
      });
      
      await Promise.all(imagePromises);
      
      // Небольшая задержка для полной загрузки
      await new Promise(resolve => setTimeout(resolve, 500));

      // Конвертируем в изображение
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: pdfContent.scrollHeight,
        logging: false,
        imageTimeout: 5000,
        removeContainer: false
      });

      // Создаем PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Добавляем изображение в PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Добавляем дополнительные страницы если нужно
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Удаляем временный элемент
      document.body.removeChild(pdfContent);

      // Сохраняем PDF
      pdf.save(`заказ-наряд-${order.order_number}.pdf`);
      toast.success('PDF успешно сгенерирован!');

    } catch (error) {
      console.error('Ошибка генерации PDF:', error);
      toast.error('Ошибка генерации PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Функции для отображения статусов и приоритетов
  const getStatusText = (status) => {
    const statusMap = {
      'new': 'Новый',
      'in_production': 'В производстве',
      'ready': 'Готов',
      'delivered': 'Доставлен',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
  };

  const getPriorityText = (priority) => {
    const priorityMap = {
      'urgent': 'Срочный',
      'high': 'Высокий',
      'normal': 'Обычный',
      'low': 'Низкий'
    };
    return priorityMap[priority] || priority;
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      'urgent': 'text-red-600 bg-red-100',
      'high': 'text-orange-600 bg-orange-100',
      'normal': 'text-blue-600 bg-blue-100',
      'low': 'text-gray-600 bg-gray-100'
    };
    return colorMap[priority] || 'text-gray-600 bg-gray-100';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'new': 'text-blue-600 bg-blue-100',
      'in_production': 'text-yellow-600 bg-yellow-100',
      'ready': 'text-green-600 bg-green-100',
      'delivered': 'text-green-600 bg-green-100',
      'cancelled': 'text-red-600 bg-red-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Ошибка загрузки заказа
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Не удалось загрузить данные заказа
          </p>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться к заказам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/orders/${id}`)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад к заказу
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Заказ-наряд №{order.order_number}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {order.product_name || 'Без названия'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={generatePDF}
              disabled={generatingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {generatingPDF ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {generatingPDF ? 'Генерация PDF...' : 'Скачать PDF'}
            </button>
            
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Печать
            </button>
          </div>
        </div>

        <div className="space-y-6">
            {/* QR-код и основная информация */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <QrCode className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Информация о заказе
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Номер заказа
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {order.order_number}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Статус
                      </label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Приоритет
                      </label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                          {getPriorityText(order.priority)}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Дата доставки
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('ru-RU') : 'Не указана'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* QR-код */}
                <div className="ml-6">
                  {qrLoading ? (
                    <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : qrData ? (
                    <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                      <img 
                        src={qrData} 
                        alt="QR-код заказа" 
                        className="w-full h-full object-contain"
                        onLoad={() => console.log('QR-код загружен в интерфейсе')}
                        onError={() => console.warn('Ошибка загрузки QR-кода в интерфейсе')}
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-sm text-gray-500">QR-код не найден</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Краткое описание */}
            {order.notes && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Краткое описание
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {order.notes}
                </p>
              </div>
            )}

            {/* Подробное описание */}
            {order.project_description && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Подробное описание
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {order.project_description}
                </p>
              </div>
            )}

            {/* Таблица материалов */}
            {order.items && order.items.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Материалы
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          №
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Наименование
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Описание
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Количество
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Цена за ед.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Сумма
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {order.items.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {item.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {item.unit_price ? item.unit_price.toLocaleString('ru-RU') : 0} ₽
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {item.total_price ? item.total_price.toLocaleString('ru-RU') : 0} ₽
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                          Итого:
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                          {order.total_amount ? order.total_amount.toLocaleString('ru-RU') : 0} ₽
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Чертежи и файлы */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileImage className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Чертежи и файлы
                  </h3>
                </div>
                <span className="text-sm text-gray-500">
                  {drawings.length} файлов
                </span>
              </div>

              {/* Область загрузки */}
              <div
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-6
                  ${isDragOver 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }
                  ${uploadingDrawings ? 'opacity-50 pointer-events-none' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {uploadingDrawings ? 'Загрузка файлов...' : 'Перетащите чертежи сюда'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    или <button
                      type="button"
                      onClick={() => document.getElementById('drawing-upload').click()}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      выберите файлы
                    </button>
                  </p>
                  <p className="text-xs text-gray-400">
                    Поддерживаемые форматы: .pdf, .dwg, .dxf, .jpg, .jpeg, .png, .tiff, .bmp
                  </p>
                </div>
                
                <input
                  id="drawing-upload"
                  type="file"
                  multiple
                  accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.tiff,.bmp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              {/* Список чертежей */}
              {loadingDrawings ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-gray-500">Загрузка чертежей...</span>
                </div>
              ) : drawings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {drawings.map((drawing, index) => (
                    <div key={drawing.id || index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getFileIcon(drawing.file_type, drawing.file_name)}
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {drawing.name || drawing.file_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => window.open(`/api/orders/${id}/drawings/${drawing.id}`, '_blank')}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="Просмотреть"
                          >
                            <FileImage className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteDrawing(drawing.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {drawing.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {drawing.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {drawing.size ? `${(drawing.size / 1024).toFixed(1)} KB` : 'Неизвестный размер'}
                        </span>
                        <a
                          href={`/api/orders/${id}/drawings/${drawing.id}`}
                          download
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Download className="h-3 w-3 inline mr-1" />
                          Скачать
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderWorkOrder;
