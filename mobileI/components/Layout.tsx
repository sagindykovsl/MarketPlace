import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { UserRole } from '../types';
import { LogOut, ShoppingBag, Users, MessageSquare, AlertTriangle, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <Link
      to={to}
      onClick={() => setIsMobileMenuOpen(false)}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        isActive(to) 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-blue-700">SupplyLink</h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{user?.role}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {user?.role === UserRole.CONSUMER ? (
            <>
              <NavItem to="/" icon={Users} label={t('nav.suppliers')} />
              <NavItem to="/orders" icon={ShoppingBag} label={t('nav.orders')} />
              <NavItem to="/chat" icon={MessageSquare} label={t('nav.chat')} />
            </>
          ) : (
            <>
              <NavItem to="/" icon={ShoppingBag} label={t('nav.orders')} />
              <NavItem to="/complaints" icon={AlertTriangle} label={t('nav.complaints')} />
              <NavItem to="/chat" icon={MessageSquare} label={t('nav.chat')} />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4 px-2">
                <button 
                    onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
                    className="text-xs font-bold bg-gray-200 px-2 py-1 rounded text-gray-700 hover:bg-gray-300"
                >
                    {language === 'en' ? '🇺🇸 EN' : '🇰🇿 RU'}
                </button>
            </div>
          <button 
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-2 w-full text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed w-full bg-white z-20 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-700">SupplyLink</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-10 bg-white pt-16 px-4">
              <nav className="space-y-2">
                {user?.role === UserRole.CONSUMER ? (
                    <>
                    <NavItem to="/" icon={Users} label={t('nav.suppliers')} />
                    <NavItem to="/orders" icon={ShoppingBag} label={t('nav.orders')} />
                    <NavItem to="/chat" icon={MessageSquare} label={t('nav.chat')} />
                    </>
                ) : (
                    <>
                    <NavItem to="/" icon={ShoppingBag} label={t('nav.orders')} />
                    <NavItem to="/complaints" icon={AlertTriangle} label={t('nav.complaints')} />
                    <NavItem to="/chat" icon={MessageSquare} label={t('nav.chat')} />
                    </>
                )}
                 <button 
                    onClick={() => {
                        setLanguage(language === 'en' ? 'ru' : 'en');
                        setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-gray-600 font-medium border-t border-gray-100 mt-4"
                >
                    Switch to {language === 'en' ? 'Russian' : 'English'}
                </button>
                 <button 
                    onClick={logout}
                    className="w-full text-left px-4 py-3 text-red-500 font-medium"
                >
                    Logout
                </button>
              </nav>
          </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
};