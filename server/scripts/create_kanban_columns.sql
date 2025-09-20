-- Создание таблицы для колонок канбана
CREATE TABLE IF NOT EXISTS kanban_columns (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#d1fae5',
  type VARCHAR(20) NOT NULL DEFAULT 'common',
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставка стандартных колонок
INSERT INTO kanban_columns (title, color, type, position, is_active) VALUES
('КБ', '#d1fae5', 'common', 1, true),
('Столярный цех', '#fef3c7', 'frame', 2, true),
('Формовка', '#e0e7ff', 'frame', 3, true),
('Швейный цех', '#f3e8ff', 'upholstery', 4, true),
('Обивка', '#fde68a', 'upholstery', 5, true),
('Сборка и упаковка', '#fce7f3', 'assembly', 6, true),
('Отгружен', '#e0f7f7', 'completed', 7, true)
ON CONFLICT DO NOTHING;
