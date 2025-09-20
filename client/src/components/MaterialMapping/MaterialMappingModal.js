import React, { useState, useEffect } from 'react';
import { X, Search, Check, AlertTriangle, Package, MapPin } from 'lucide-react';
import { materialMappingAPI } from '../../services/api';

const MaterialMappingModal = ({ isOpen, onClose, calculatorMaterials, onMappingComplete }) => {
  const [mappings, setMappings] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerms, setSearchTerms] = useState({});
  const [selectedMappings, setSelectedMappings] = useState({});

  useEffect(() => {
    if (isOpen && calculatorMaterials) {
      processMaterials();
    }
  }, [isOpen, calculatorMaterials]);

  const processMaterials = async () => {
    setLoading(true);
    try {
      const response = await materialMappingAPI.processCalculatorMaterials(calculatorMaterials);
      setMappings(response.data.processed);
      setSuggestions(response.data.unmapped);
    } catch (error) {
      console.error('Ошибка обработки материалов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (materialId, searchTerm) => {
    if (!searchTerm.trim()) return;
    
    setSearchTerms(prev => ({ ...prev, [materialId]: searchTerm }));
    
    try {
      const response = await materialMappingAPI.searchMaterials(searchTerm);
      setSuggestions(prev => 
        prev.map(suggestion => 
          suggestion.calculator_material.id === materialId 
            ? { ...suggestion, suggested_matches: response.data }
            : suggestion
        )
      );
    } catch (error) {
      console.error('Ошибка поиска материалов:', error);
    }
  };

  const handleSelectMapping = (materialId, warehouseMaterial) => {
    setSelectedMappings(prev => ({
      ...prev,
      [materialId]: warehouseMaterial
    }));
  };

  const handleCreateMapping = async (materialId, warehouseMaterial) => {
    try {
      const material = suggestions.find(s => s.calculator_material.id === materialId);
      await materialMappingAPI.createMapping({
        calculator_name: material.calculator_material.name,
        calculator_category: material.calculator_material.category,
        warehouse_name: warehouseMaterial.name,
        warehouse_id: warehouseMaterial.id,
        mapping_type: 'manual'
      });
      
      // Обновляем состояние
      setSuggestions(prev => prev.filter(s => s.calculator_material.id !== materialId));
      setMappings(prev => [...prev, {
        ...material.calculator_material,
        warehouse_match: warehouseMaterial,
        confidence: 0.9,
        mapping_method: 'manual'
      }]);
      
    } catch (error) {
      console.error('Ошибка создания маппинга:', error);
    }
  };

  const handleComplete = () => {
    onMappingComplete(mappings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Маппинг материалов
              </h2>
              <p className="text-sm text-gray-500">
                Сопоставление материалов из калькулятора с материалами на складе
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Обработанные материалы */}
              {mappings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    Автоматически сопоставленные ({mappings.length})
                  </h3>
                  <div className="space-y-3">
                    {mappings.map((mapping) => (
                      <div key={mapping.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">{mapping.name}</p>
                            <p className="text-sm text-gray-600">
                              → {mapping.warehouse_match.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            mapping.confidence > 0.8 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {Math.round(mapping.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Материалы для ручного сопоставления */}
              {suggestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Требуют ручного сопоставления ({suggestions.length})
                  </h3>
                  <div className="space-y-4">
                    {suggestions.map((suggestion) => (
                      <div key={suggestion.calculator_material.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Package className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {suggestion.calculator_material.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Категория: {suggestion.calculator_material.category || 'Не указана'}
                            </p>
                          </div>
                        </div>

                        {/* Поиск */}
                        <div className="mb-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Поиск материала на складе..."
                              value={searchTerms[suggestion.calculator_material.id] || ''}
                              onChange={(e) => handleSearch(suggestion.calculator_material.id, e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* Предложения */}
                        {suggestion.suggested_matches && suggestion.suggested_matches.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Предложения:</p>
                            {suggestion.suggested_matches.map((match) => (
                              <div
                                key={match.id}
                                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedMappings[suggestion.calculator_material.id]?.id === match.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleSelectMapping(suggestion.calculator_material.id, match)}
                              >
                                <div>
                                  <p className="font-medium text-gray-900">{match.name}</p>
                                  <p className="text-sm text-gray-500">
                                    Остаток: {match.current_stock} | Цена: {match.unit_price}₽
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    {Math.round(match.similarity * 100)}% совпадение
                                  </span>
                                  {selectedMappings[suggestion.calculator_material.id]?.id === match.id && (
                                    <Check className="h-4 w-4 text-blue-600" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Кнопка создания маппинга */}
                        {selectedMappings[suggestion.calculator_material.id] && (
                          <div className="mt-3">
                            <button
                              onClick={() => handleCreateMapping(
                                suggestion.calculator_material.id,
                                selectedMappings[suggestion.calculator_material.id]
                              )}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Создать сопоставление
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Обработано: {mappings.length} из {mappings.length + suggestions.length}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleComplete}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Завершить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialMappingModal;




















