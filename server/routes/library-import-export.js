const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const XLSX = require('xlsx');
const db = require('../config/database');

const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/library');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Math.floor(Date.now() / 1000) + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.json', '.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый тип файла'), false);
    }
  }
});

// Экспорт данных
router.get('/export', async (req, res) => {
  try {
    const { data_type, format = 'json' } = req.query;
    
    let data = [];
    let filename = 'library_export';
    
    switch (data_type) {
      case 'materials':
        data = await exportMaterials();
        filename = 'materials';
        break;
      case 'operations':
        data = await exportOperations();
        filename = 'operations';
        break;
      case 'rates':
        data = await exportRates();
        filename = 'rates';
        break;
      case 'reference_data':
        data = await exportReferenceData();
        filename = 'reference_data';
        break;
      case 'calculator_settings':
        data = await exportCalculatorSettings();
        filename = 'calculator_settings';
        break;
      case 'all':
        data = await exportAllData();
        filename = 'all_library_data';
        break;
      default:
        return res.status(400).json({ error: 'Неверный тип данных' });
    }
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json(data);
    } else if (format === 'csv') {
      const csvData = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csvData);
    } else if (format === 'xlsx') {
      const workbook = convertToExcel(data, data_type);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }).pipe(res);
    } else {
      return res.status(400).json({ error: 'Неподдерживаемый формат' });
    }
    
  } catch (error) {
    console.error('Ошибка экспорта:', error);
    res.status(500).json({ error: 'Ошибка экспорта данных' });
  }
});

// Импорт данных
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const { data_type, format = 'json' } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'Файл не найден' });
    }
    
    let data = [];
    
    if (format === 'json') {
      data = JSON.parse(fs.readFileSync(file.path, 'utf8'));
    } else if (format === 'csv') {
      data = await parseCSV(file.path);
    } else if (format === 'xlsx') {
      data = await parseExcel(file.path);
    } else {
      return res.status(400).json({ error: 'Неподдерживаемый формат' });
    }
    
    let result;
    switch (data_type) {
      case 'materials':
        result = await importMaterials(data);
        break;
      case 'operations':
        result = await importOperations(data);
        break;
      case 'rates':
        result = await importRates(data);
        break;
      case 'reference_data':
        result = await importReferenceData(data);
        break;
      case 'calculator_settings':
        result = await importCalculatorSettings(data);
        break;
      case 'all':
        result = await importAllData(data);
        break;
      default:
        return res.status(400).json({ error: 'Неверный тип данных' });
    }
    
    // Удаляем временный файл
    fs.unlinkSync(file.path);
    
    res.json({ 
      message: 'Данные успешно импортированы',
      imported: result.imported,
      errors: result.errors
    });
    
  } catch (error) {
    console.error('Ошибка импорта:', error);
    res.status(500).json({ error: 'Ошибка импорта данных' });
  }
});

// Функции экспорта
async function exportMaterials() {
  const result = await db.query(`
    SELECT m.*, mc.name as category_name
    FROM materials_library m
    LEFT JOIN material_categories mc ON m.category_id = mc.id
    ORDER BY m.name
  `);
  return result.rows;
}

async function exportOperations() {
  const result = await db.query(`
    SELECT o.*, oc.name as category_name
    FROM operations_library o
    LEFT JOIN operation_categories oc ON o.category_id = oc.id
    ORDER BY o.name
  `);
  return result.rows;
}

async function exportRates() {
  const result = await db.query(`
    SELECT r.*, rc.name as category_name
    FROM rates_library r
    LEFT JOIN rate_categories rc ON r.category_id = rc.id
    ORDER BY r.name
  `);
  return result.rows;
}

async function exportReferenceData() {
  const result = await db.query(`
    SELECT rd.*, rc.name as category_name
    FROM reference_data_library rd
    LEFT JOIN reference_categories rc ON rd.category_id = rc.id
    ORDER BY rd.name
  `);
  return result.rows;
}

async function exportCalculatorSettings() {
  const result = await db.query(`
    SELECT * FROM calculator_settings_library
    ORDER BY category, setting_name
  `);
  return result.rows;
}

async function exportAllData() {
  return {
    materials: await exportMaterials(),
    operations: await exportOperations(),
    rates: await exportRates(),
    reference_data: await exportReferenceData(),
    calculator_settings: await exportCalculatorSettings(),
    categories: {
      material_categories: (await db.query('SELECT * FROM material_categories ORDER BY name')).rows,
      operation_categories: (await db.query('SELECT * FROM operation_categories ORDER BY name')).rows,
      rate_categories: (await db.query('SELECT * FROM rate_categories ORDER BY name')).rows,
      reference_categories: (await db.query('SELECT * FROM reference_categories ORDER BY name')).rows
    }
  };
}

// Функции импорта
async function importMaterials(data) {
  const imported = [];
  const errors = [];
  
  for (const item of data) {
    try {
      const result = await db.query(`
        INSERT INTO materials_library (name, description, category_id, unit, price_per_unit, current_stock, min_stock, supplier, notes, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (name) DO UPDATE SET
          description = EXCLUDED.description,
          category_id = EXCLUDED.category_id,
          unit = EXCLUDED.unit,
          price_per_unit = EXCLUDED.price_per_unit,
          current_stock = EXCLUDED.current_stock,
          min_stock = EXCLUDED.min_stock,
          supplier = EXCLUDED.supplier,
          notes = EXCLUDED.notes,
          is_active = EXCLUDED.is_active,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        item.name,
        item.description || '',
        item.category_id || null,
        item.unit || 'шт',
        parseFloat(item.price_per_unit || 0),
        parseFloat(item.current_stock || 0),
        parseFloat(item.min_stock || 0),
        item.supplier || '',
        item.notes || '',
        item.is_active !== false
      ]);
      
      imported.push(result.rows[0]);
    } catch (error) {
      errors.push({ item, error: error.message });
    }
  }
  
  return { imported, errors };
}

async function importOperations(data) {
  const imported = [];
  const errors = [];
  
  for (const item of data) {
    try {
      const result = await db.query(`
        INSERT INTO operations_library (name, description, category_id, price_per_unit, time_norm_minutes, complexity_factor, quality_factor, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (name) DO UPDATE SET
          description = EXCLUDED.description,
          category_id = EXCLUDED.category_id,
          price_per_unit = EXCLUDED.price_per_unit,
          time_norm_minutes = EXCLUDED.time_norm_minutes,
          complexity_factor = EXCLUDED.complexity_factor,
          quality_factor = EXCLUDED.quality_factor,
          is_active = EXCLUDED.is_active,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        item.name,
        item.description || '',
        item.category_id || null,
        parseFloat(item.price_per_unit || 0),
        parseFloat(item.time_norm_minutes || 0),
        parseFloat(item.complexity_factor || 1),
        parseFloat(item.quality_factor || 1),
        item.is_active !== false
      ]);
      
      imported.push(result.rows[0]);
    } catch (error) {
      errors.push({ item, error: error.message });
    }
  }
  
  return { imported, errors };
}

async function importRates(data) {
  const imported = [];
  const errors = [];
  
  for (const item of data) {
    try {
      const result = await db.query(`
        INSERT INTO rates_library (name, description, category_id, rate_value, unit, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name) DO UPDATE SET
          description = EXCLUDED.description,
          category_id = EXCLUDED.category_id,
          rate_value = EXCLUDED.rate_value,
          unit = EXCLUDED.unit,
          is_active = EXCLUDED.is_active,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        item.name,
        item.description || '',
        item.category_id || null,
        parseFloat(item.rate_value || 0),
        item.unit || 'час',
        item.is_active !== false
      ]);
      
      imported.push(result.rows[0]);
    } catch (error) {
      errors.push({ item, error: error.message });
    }
  }
  
  return { imported, errors };
}

async function importReferenceData(data) {
  const imported = [];
  const errors = [];
  
  for (const item of data) {
    try {
      const result = await db.query(`
        INSERT INTO reference_data_library (name, description, category_id, value, unit, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name) DO UPDATE SET
          description = EXCLUDED.description,
          category_id = EXCLUDED.category_id,
          value = EXCLUDED.value,
          unit = EXCLUDED.unit,
          is_active = EXCLUDED.is_active,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        item.name,
        item.description || '',
        item.category_id || null,
        item.value || '',
        item.unit || '',
        item.is_active !== false
      ]);
      
      imported.push(result.rows[0]);
    } catch (error) {
      errors.push({ item, error: error.message });
    }
  }
  
  return { imported, errors };
}

async function importCalculatorSettings(data) {
  const imported = [];
  const errors = [];
  
  for (const item of data) {
    try {
      const result = await db.query(`
        INSERT INTO calculator_settings_library (setting_name, setting_value, setting_type, category, description, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (setting_name) DO UPDATE SET
          setting_value = EXCLUDED.setting_value,
          setting_type = EXCLUDED.setting_type,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          is_active = EXCLUDED.is_active,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        item.setting_name,
        item.setting_value || '',
        item.setting_type || 'text',
        item.category || 'general',
        item.description || '',
        item.is_active !== false
      ]);
      
      imported.push(result.rows[0]);
    } catch (error) {
      errors.push({ item, error: error.message });
    }
  }
  
  return { imported, errors };
}

async function importAllData(data) {
  const results = {
    materials: { imported: [], errors: [] },
    operations: { imported: [], errors: [] },
    rates: { imported: [], errors: [] },
    reference_data: { imported: [], errors: [] },
    calculator_settings: { imported: [], errors: [] }
  };
  
  if (data.materials) {
    results.materials = await importMaterials(data.materials);
  }
  if (data.operations) {
    results.operations = await importOperations(data.operations);
  }
  if (data.rates) {
    results.rates = await importRates(data.rates);
  }
  if (data.reference_data) {
    results.reference_data = await importReferenceData(data.reference_data);
  }
  if (data.calculator_settings) {
    results.calculator_settings = await importCalculatorSettings(data.calculator_settings);
  }
  
  return results;
}

// Вспомогательные функции
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ].join('\n');
  
  return csvContent;
}

function convertToExcel(data, dataType) {
  const workbook = XLSX.utils.book_new();
  
  if (Array.isArray(data)) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, dataType);
  } else if (typeof data === 'object') {
    Object.keys(data).forEach(sheetName => {
      if (Array.isArray(data[sheetName])) {
        const worksheet = XLSX.utils.json_to_sheet(data[sheetName]);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    });
  }
  
  return workbook;
}

async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

module.exports = router;

