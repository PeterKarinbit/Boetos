import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Mic, 
  TrendingUp, 
  Settings, 
  User, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  X  // Added X icon for mobile close button
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, logout } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const logoPath = "/assets/images/boetos-logo.png";

  const navigationItems: NavigationItem[] = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Voice Assistant', path: '/voice-assistant', icon: Mic },
    { name: 'Burnout Tracker', path: '/burnout-tracker', icon: TrendingUp },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsCollapsed(false);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobile, isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggleCollapse = () => {
    if (!isMobile) setIsCollapsed(!isCollapsed);
  };

  const NavigationItem: React.FC<{ item: NavigationItem }> = ({ item }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
          isActive
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
        } ${isCollapsed && !isMobile ? 'justify-center px-2' : ''}`}
        title={isCollapsed && !isMobile ? item.name : ''}
        onClick={() => isMobile && onToggle()}
      >
        <Icon className={`flex-shrink-0 h-5 w-5 ${
          isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
        }`} />

        {(!isCollapsed || isMobile) && (
          <>
            <span className="font-medium truncate">{item.name}</span>
            {item.badge && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {item.badge}
              </span>
            )}
          </>
        )}

        {isCollapsed && !isMobile && (
          <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
            {item.name}
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        ></div>
      )}
      <aside 
        className={`fixed top-0 left-0 h-screen z-40 transform transition-transform duration-300 ease-in-out ${
          isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'
        } ${
          isCollapsed && !isMobile ? 'w-16' : 'w-64'
        } border-r shadow-lg flex flex-col`}
        style={{ background: 'var(--bg-glass)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
      >
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
                <img 
                  src={logoPath} 
                  alt="Boetos Logo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (sibling) sibling.style.display = 'block';
                  }}
                />
                <span className="text-white font-bold text-sm hidden">B</span>
              </div>
              <span className="font-bold text-xl text-gray-800 dark:text-white">
                Boetos
              </span>
            </div>
          )}

          {isCollapsed && !isMobile && (
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
              <img 
                src={logoPath} 
                alt="Boetos Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (sibling) sibling.style.display = 'block';
                }}
              />
              <span className="text-white font-bold text-sm hidden">B</span>
            </div>
          )}

          {/* Desktop collapse button */}
          {!isMobile && (
            <button
              onClick={handleToggleCollapse}
              className={`p-1.5 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}

          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggle();
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
              title="Close sidebar"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {(!isCollapsed || isMobile) && user && (
          <div className={`p-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.name || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-sm">
                    {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavigationItem key={item.path} item={item} />
          ))}
        </nav>

        <div className={`p-4 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 ${
              isCollapsed && !isMobile ? 'justify-center px-2' : ''
            }`}
            title={isCollapsed && !isMobile ? 'Sign Out' : ''}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {(!isCollapsed || isMobile) && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;