import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Проверяем localStorage и системные настройки
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Проверяем системные настройки
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Удаляем все возможные классы темы
    root.classList.remove('dark', 'light');
    
    // Добавляем нужный класс
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('theme', theme);
    
    // Очищаем старый ключ darkMode если он существует
    if (localStorage.getItem('darkMode')) {
      localStorage.removeItem('darkMode');
    }
  }, [theme]);

  // Слушаем события изменения темы от других компонентов
  useEffect(() => {
    const handleThemeChange = (event) => {
      const { theme: newTheme } = event.detail;
      if (newTheme && newTheme !== theme) {
        setTheme(newTheme);
      }
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

