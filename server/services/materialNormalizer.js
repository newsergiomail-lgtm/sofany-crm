const db = require('../config/database');

class MaterialNormalizer {
  constructor() {
    this.normalizationRules = {
      // Правила для тканей
      fabric: {
        patterns: [
          { from: /^Ткань\s+(.+)$/i, to: 'Ткань $1' },
          { from: /^FABRIC_(\d+)$/i, to: 'Ткань $1 кат.' },
          { from: /^ECO_LEATHER$/i, to: 'Экокожа' },
          { from: /^GENUINE_LEATHER$/i, to: 'Кожа натуральная' }
        ]
      },
      
      // Правила для ППУ
      pu: {
        patterns: [
          { from: /^ППУ\s+(.+?)\s*\((\d+)мм\)$/i, to: 'ППУ-$1 $2мм' },
          { from: /^ППУ\s+(.+?)\s*\((\d+)мм\)$/i, to: 'ППУ $1 ($2мм)' },
          { from: /^ППУ\s+(.+)$/i, to: 'ППУ-$1' }
        ]
      },
      
      // Правила для каркасных материалов
      frame: {
        patterns: [
          { from: /^DSP$/i, to: 'ДСП (базовый)' },
          { from: /^PLYWOOD$/i, to: 'Фанера березовая' },
          { from: /^METAL$/i, to: 'Профиль металлический' },
          { from: /^Каркас\s+(.+)$/i, to: '$1' }
        ]
      },
      
      // Правила для механизмов
      mechanism: {
        patterns: [
          { from: /^BOOK$/i, to: 'Механизм: Книжка' },
          { from: /^EURO_BOOK$/i, to: 'Механизм: Еврокнижка' },
          { from: /^DOLPHIN$/i, to: 'Механизм: Дельфин' },
          { from: /^TIC_TAC$/i, to: 'Механизм: Тик-так' },
          { from: /^ROLL_OUT$/i, to: 'Механизм: Выкатной' }
        ]
      }
    };
  }

  /**
   * Нормализует название материала из калькулятора
   */
  normalizeCalculatorMaterial(calcName, category = null) {
    if (!calcName) return null;

    let normalizedName = calcName.trim();
    
    // Применяем правила нормализации по категории
    if (category && this.normalizationRules[category]) {
      for (const rule of this.normalizationRules[category].patterns) {
        const match = normalizedName.match(rule.from);
        if (match) {
          normalizedName = rule.to.replace(/\$(\d+)/g, (_, index) => match[parseInt(index)]);
          break;
        }
      }
    }

    // Общие правила нормализации
    normalizedName = this.applyGeneralRules(normalizedName);
    
    return normalizedName;
  }

  /**
   * Применяет общие правила нормализации
   */
  applyGeneralRules(name) {
    return name
      .replace(/\s+/g, ' ') // Убираем лишние пробелы
      .replace(/[^\w\s\-:().а-яё]/gi, '') // Убираем специальные символы
      .trim();
  }

  /**
   * Находит соответствие в базе данных
   */
  async findWarehouseMatch(normalizedName, category = null) {
    try {
      // Сначала ищем точное совпадение
      let query = `
        SELECT id, name, category_id, current_stock, unit_price
        FROM materials 
        WHERE LOWER(name) = LOWER($1) AND is_active = true
      `;
      let params = [normalizedName];

      let result = await db.query(query, params);
      
      if (result.rows.length > 0) {
        return {
          match: result.rows[0],
          confidence: 1.0,
          method: 'exact'
        };
      }

      // Если точного совпадения нет, ищем по маппингу
      const mappingQuery = `
        SELECT m.id, m.name, m.category_id, m.current_stock, m.unit_price, mm.confidence_score
        FROM material_mappings mm
        JOIN materials m ON mm.warehouse_id = m.id
        WHERE LOWER(mm.warehouse_name) = LOWER($1) AND mm.is_active = true
      `;
      
      result = await db.query(mappingQuery, [normalizedName]);
      
      if (result.rows.length > 0) {
        return {
          match: result.rows[0],
          confidence: result.rows[0].confidence_score,
          method: 'mapping'
        };
      }

      // Нечеткий поиск
      const fuzzyQuery = `
        SELECT id, name, category_id, current_stock, unit_price,
               similarity(name, $1) as similarity
        FROM materials 
        WHERE similarity(name, $1) > 0.6 AND is_active = true
        ORDER BY similarity DESC
        LIMIT 1
      `;
      
      result = await db.query(fuzzyQuery, [normalizedName]);
      
      if (result.rows.length > 0) {
        return {
          match: result.rows[0],
          confidence: result.rows[0].similarity,
          method: 'fuzzy'
        };
      }

      return null;
    } catch (error) {
      console.error('Ошибка поиска соответствия материала:', error);
      return null;
    }
  }

  /**
   * Обрабатывает материалы из калькулятора
   */
  async processCalculatorMaterials(calculatorMaterials) {
    const processedMaterials = [];
    const unmappedMaterials = [];

    for (const calcMaterial of calculatorMaterials) {
      const normalizedName = this.normalizeCalculatorMaterial(
        calcMaterial.name, 
        calcMaterial.category
      );

      if (!normalizedName) {
        unmappedMaterials.push(calcMaterial);
        continue;
      }

      const warehouseMatch = await this.findWarehouseMatch(normalizedName, calcMaterial.category);

      if (warehouseMatch) {
        processedMaterials.push({
          ...calcMaterial,
          normalized_name: normalizedName,
          warehouse_match: warehouseMatch.match,
          confidence: warehouseMatch.confidence,
          mapping_method: warehouseMatch.method
        });
      } else {
        unmappedMaterials.push({
          ...calcMaterial,
          normalized_name: normalizedName,
          needs_manual_mapping: true
        });
      }
    }

    return {
      processed: processedMaterials,
      unmapped: unmappedMaterials
    };
  }

  /**
   * Создает предложения для маппинга
   */
  async suggestMappings(unmappedMaterials) {
    const suggestions = [];

    for (const material of unmappedMaterials) {
      const similarMaterials = await this.findSimilarMaterials(material.normalized_name);
      
      suggestions.push({
        calculator_material: material,
        suggested_matches: similarMaterials,
        needs_manual_review: similarMaterials.length === 0
      });
    }

    return suggestions;
  }

  /**
   * Находит похожие материалы
   */
  async findSimilarMaterials(name) {
    try {
      const query = `
        SELECT id, name, category_id, current_stock, unit_price,
               similarity(name, $1) as similarity
        FROM materials 
        WHERE similarity(name, $1) > 0.4 AND is_active = true
        ORDER BY similarity DESC
        LIMIT 3
      `;
      
      const result = await db.query(query, [name]);
      return result.rows;
    } catch (error) {
      console.error('Ошибка поиска похожих материалов:', error);
      return [];
    }
  }
}

module.exports = new MaterialNormalizer();




















