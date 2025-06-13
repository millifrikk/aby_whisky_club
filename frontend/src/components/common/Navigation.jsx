import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import useAppearance from '../../hooks/useAppearance';
import { useComparison } from '../../contexts/ComparisonContext';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const { siteLogoUrl, siteName } = useAppearance();
  const { selectionCount, canCompare } = useComparison();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { name: t('navigation.home'), path: '/', public: true },
    { name: t('navigation.whiskies'), path: '/whiskies', public: true },
    { name: t('navigation.events'), path: '/events', public: true },
    { name: t('navigation.ratings'), path: '/ratings', public: true },
    { name: t('navigation.members'), path: '/members', public: false },
    { name: t('navigation.wishlist'), path: '/wishlist', public: false },
  ];

  // Add comparison link with badge if user has selections
  const comparisonItem = selectionCount > 0 ? {
    name: `Compare (${selectionCount})`,
    path: '/comparison',
    public: false,
    special: true
  } : null;

  // Filter navigation items based on authentication status
  const visibleNavItems = navItems.filter(item => item.public || isAuthenticated);
  
  // Add comparison item if user has selections
  if (comparisonItem && isAuthenticated) {
    visibleNavItems.push(comparisonItem);
  }

  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
              {siteLogoUrl ? (
                <>
                  <img 
                    src={siteLogoUrl} 
                    alt={siteName}
                    className="h-10 w-auto"
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      e.target.style.display = 'none';
                    }}
                  />
                  <span className="text-3xl font-bold text-amber-100 hover:text-white transition-colors">
                    {siteName}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-amber-100 hover:text-white transition-colors">
                  {siteName}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <LanguageSelector />
            {visibleNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`transition-colors ${
                  item.special 
                    ? 'bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700'
                    : isActive(item.path)
                      ? 'text-white border-b-2 border-amber-300 pb-1'
                      : 'text-amber-100 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="text-amber-100">
                  {t('auth.welcome_back_message', { name: user?.first_name || user?.username })}
                </div>
                <div className="relative group">
                  <button className="text-amber-100 hover:text-white transition-colors">
                    Account ▼
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('navigation.profile')}
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t('navigation.admin')}
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('navigation.logout')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className={`transition-colors ${
                    isActive('/login')
                      ? 'text-white border-b-2 border-amber-300 pb-1'
                      : 'text-amber-100 hover:text-white'
                  }`}
                >
                  {t('navigation.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-dark text-white px-4 py-2 rounded-md hover:bg-primary transition-colors"
                >
                  {t('navigation.register')}
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-amber-100 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="space-y-2">
              <div className="px-3 py-2">
                <LanguageSelector />
              </div>
              {visibleNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md transition-colors ${
                    isActive(item.path)
                      ? 'bg-amber-700 text-white'
                      : 'text-amber-100 hover:bg-amber-700 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-amber-100 hover:bg-amber-700 hover:text-white transition-colors"
                  >
                    {t('navigation.profile')}
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-amber-100 hover:bg-amber-700 hover:text-white transition-colors"
                    >
                      {t('navigation.admin')}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-amber-100 hover:bg-amber-700 hover:text-white transition-colors"
                  >
                    {t('navigation.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md transition-colors ${
                      isActive('/login')
                        ? 'bg-amber-700 text-white'
                        : 'text-amber-100 hover:bg-amber-700 hover:text-white'
                    }`}
                  >
                    {t('navigation.login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md bg-primary-dark text-white hover:bg-primary transition-colors"
                  >
                    {t('navigation.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navigation;
