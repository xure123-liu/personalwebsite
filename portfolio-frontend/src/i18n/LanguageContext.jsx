import { createContext, useContext, useState, useEffect } from 'react';
import { translations, detectLanguage } from './translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // 始终根据浏览器语言自动检测，不保存到 localStorage
    return detectLanguage();
  });

  // 每次组件挂载时重新检测浏览器语言（确保语言设置与浏览器一致）
  useEffect(() => {
    const detectedLang = detectLanguage();
    if (detectedLang !== language) {
      setLanguage(detectedLang);
    }
  }, []);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // 如果找不到翻译，返回原始 key
      }
    }
    
    return value || key;
  };

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

