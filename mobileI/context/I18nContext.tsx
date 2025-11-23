import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ru';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.orders': 'Orders',
    'nav.suppliers': 'Suppliers',
    'nav.catalog': 'Catalog',
    'nav.chat': 'Chat',
    'nav.complaints': 'Complaints',
    'login.title': 'Welcome Back',
    'login.button': 'Sign In',
    'role.consumer': 'Consumer',
    'role.sales': 'Sales Rep',
    'supplier.search': 'Search Suppliers',
    'supplier.request': 'Request Link',
    'status.pending': 'Pending',
    'status.accepted': 'Accepted',
    'status.rejected': 'Rejected',
    'status.open': 'Open',
    'status.resolved': 'Resolved',
    'status.escalated': 'Escalated',
    'action.resolve': 'Resolve',
    'action.escalate': 'Escalate',
    'cart.total': 'Total',
    'cart.checkout': 'Place Order',
    'complaint.ai': 'AI Polish',
  },
  ru: {
    'nav.dashboard': 'Главная',
    'nav.orders': 'Заказы',
    'nav.suppliers': 'Поставщики',
    'nav.catalog': 'Каталог',
    'nav.chat': 'Чат',
    'nav.complaints': 'Жалобы',
    'login.title': 'Добро пожаловать',
    'login.button': 'Войти',
    'role.consumer': 'Покупатель',
    'role.sales': 'Торговый представитель',
    'supplier.search': 'Найти поставщиков',
    'supplier.request': 'Запросить связь',
    'status.pending': 'Ожидает',
    'status.accepted': 'Принят',
    'status.rejected': 'Отклонен',
    'status.open': 'Открыт',
    'status.resolved': 'Решен',
    'status.escalated': 'Эскалирован',
    'action.resolve': 'Решить',
    'action.escalate': 'Эскалировать',
    'cart.total': 'Итого',
    'cart.checkout': 'Оформить',
    'complaint.ai': 'AI Улучшение',
  }
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
};