import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { UserRole } from '../types';

export const Login = () => {
  const { login } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.CONSUMER);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      login(activeRole);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-700 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex justify-end mb-4">
            <button 
                onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
                className="text-xs font-semibold text-gray-500 hover:text-blue-600"
            >
                {language === 'en' ? 'Switch to Russian' : 'Switch to English'}
            </button>
        </div>
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">SupplyLink</h2>
          <p className="text-gray-500 mt-2">{t('login.title')}</p>
        </div>

        {/* Role Toggle for Demo */}
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => setActiveRole(UserRole.CONSUMER)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeRole === UserRole.CONSUMER 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('role.consumer')}
          </button>
          <button
            type="button"
            onClick={() => setActiveRole(UserRole.SALES)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeRole === UserRole.SALES 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('role.sales')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                t('login.button')
            )}
          </button>
        </form>
      </div>
    </div>
  );
};