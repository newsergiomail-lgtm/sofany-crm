import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import SimpleQRCodeGenerator from '../Production/SimpleQRCodeGenerator';

// Стили для PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  orderNumber: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  value: {
    fontSize: 12,
    color: '#1f2937',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    padding: 8,
    borderRadius: 3,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableCell: {
    fontSize: 10,
    color: '#1f2937',
  },
  qrCode: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  images: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  image: {
    width: 100,
    height: 100,
    margin: 5,
    objectFit: 'cover',
  },
  notes: {
    fontSize: 12,
    color: '#1f2937',
    lineHeight: 1.5,
    marginTop: 5,
  },
});

const WorkOrderPrintView = ({ order, orderItems, uploadedFiles }) => {
  const getStatusLabel = (status) => {
    const statusMap = {
      'new': 'Новый',
      'in_progress': 'В работе',
      'completed': 'Завершен',
      'cancelled': 'Отменен',
      'in_production': 'В производстве'
    };
    return statusMap[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const priorityMap = {
      'low': 'Низкий',
      'normal': 'Обычный',
      'high': 'Высокий',
      'urgent': 'Срочный'
    };
    return priorityMap[priority] || priority;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Заголовок */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>ЗАКАЗ-НАРЯД</Text>
            <Text style={styles.orderNumber}>№ {order.order_number}</Text>
          </View>
          <View style={styles.qrCode}>
            {/* QR код будет добавлен через html2canvas */}
          </View>
        </View>

        {/* Статус и приоритет */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Статус и приоритет</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Статус:</Text>
            <Text style={styles.value}>{getStatusLabel(order.status)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Приоритет:</Text>
            <Text style={styles.value}>{getPriorityLabel(order.priority)}</Text>
          </View>
        </View>

        {/* Информация о продукте */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Информация о продукте</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Название:</Text>
            <Text style={styles.value}>{order.product_name || 'Не указано'}</Text>
          </View>
          {order.project_description && (
            <View style={{ marginTop: 5 }}>
              <Text style={styles.label}>Описание:</Text>
              <Text style={styles.notes}>{order.project_description}</Text>
            </View>
          )}
        </View>

        {/* Доставка */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Доставка</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Адрес:</Text>
            <Text style={styles.value}>{order.delivery_address || 'Не указан'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Дедлайн:</Text>
            <Text style={styles.value}>
              {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('ru-RU') : 'Не установлен'}
            </Text>
          </View>
        </View>

        {/* Позиции заказа */}
        {orderItems && orderItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Позиции заказа</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Наименование</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>Кол-во</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>Цена</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>Сумма</Text>
              </View>
              {orderItems.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{item.name || 'Не указано'}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{item.quantity || 0}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{item.unit_price || 0} ₽</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {((item.quantity || 0) * (item.unit_price || 0)).toLocaleString()} ₽
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Заметки */}
        {order.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Заметки</Text>
            <Text style={styles.notes}>{order.notes}</Text>
          </View>
        )}

        {/* Загруженные файлы */}
        {uploadedFiles && uploadedFiles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Прикрепленные файлы</Text>
            <View style={styles.images}>
              {uploadedFiles.map((file, index) => (
                <View key={index} style={{ margin: 5, alignItems: 'center' }}>
                  <Text style={[styles.tableCell, { textAlign: 'center' }]}>{file.name}</Text>
                  <Text style={[styles.tableCell, { fontSize: 8, color: '#6b7280' }]}>
                    {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default WorkOrderPrintView;
