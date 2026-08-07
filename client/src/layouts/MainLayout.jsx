import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  FiHome, 
  FiUsers, 
  FiDisc, 
  FiBarChart2, 
  FiSettings, 
  FiLogOut, 
  FiUser
} from 'react-icons/fi';

const MainLayout = ({ children, onOpenScanner }) => {
  const { user, settings, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: FiHome },
    { name: 'Customers', path: '/customers', icon: FiUsers },
    { name: 'Scan Can', path: '#', icon: FiDisc, isAction: true },
    { name: 'Cans Inventory', path: '/cans', icon: FiDisc }, // Using Disc as representation, we will style nicely
    { name: 'Reports', path: '/reports', icon: FiBarChart2 },
    { name: 'Settings', path: '/settings', icon: FiSettings }
  ];

  const handleNavClick = (e, item) => {
    if (item.isAction) {
      e.preventDefault();
      onOpenScanner();
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-16 md:pb-0">
      {/* Top Header Bar for Mobile / Tablet */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {settings.logo ? (
            <img src={settings.logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-display font-bold">
              W
            </div>
          )}
          <span className="font-display font-bold tracking-tight text-slate-800 text-lg">
            {settings.businessName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/settings')}
            className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:text-primary-600 transition-colors"
          >
            <FiUser size={16} />
          </button>
        </div>
      </header>

      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 sticky top-0 h-screen z-40 p-6">
        {/* Branding */}
        <div className="flex items-center gap-3 mb-10">
          {settings.logo ? (
            <img src={settings.logo} alt="Logo" className="w-10 h-10 rounded-xl object-contain shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center text-white font-display font-bold text-xl shadow-md shadow-primary-100">
              W
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-display font-bold tracking-tight text-slate-800 leading-none mb-1 text-base">
              {settings.businessName}
            </span>
            <span className="text-xs text-slate-400 font-medium">Water Management</span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            if (item.isAction) {
              return (
                <button
                  key={idx}
                  onClick={(e) => handleNavClick(e, item)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 bg-gradient-to-r from-primary-600 to-accent-500 text-white hover:shadow-lg hover:shadow-primary-100 active:scale-[0.98] mt-4 mb-4"
                >
                  <Icon size={18} />
                  <span>Scan Can QR</span>
                </button>
              );
            }

            return (
              <button
                key={idx}
                onClick={(e) => handleNavClick(e, item)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-primary-600' : 'text-slate-400'} />
                <span>{item.name === 'Cans Inventory' ? 'Cans Inventory' : item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* User Card & Log out */}
        <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold font-display">
              {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">{user?.username || 'Admin'}</span>
              <span className="text-xs text-slate-400 capitalize">{user?.role || 'Staff'}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 font-medium text-sm transition-all duration-200"
          >
            <FiLogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto pb-24 md:pb-10">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around h-16 px-2 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] no-print">
        {navItems.filter(item => !item.isAction).slice(0, 2).map((item, idx) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={idx}
              onClick={(e) => handleNavClick(e, item)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-all ${
                isActive ? 'text-primary-600 font-semibold' : 'text-slate-400'
              }`}
            >
              <Icon size={20} className="mb-0.5" />
              <span>{item.name === 'Dashboard' ? 'Home' : item.name}</span>
            </button>
          );
        })}

        {/* Center Scanner Action Button */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => onOpenScanner()}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary-600 to-accent-500 text-white flex items-center justify-center shadow-lg shadow-primary-200 border-4 border-white active:scale-95 transition-all duration-150 animate-pulse-subtle"
          >
            <FiDisc size={28} className="animate-spin-slow" />
          </button>
          <span className="text-[10px] font-semibold text-primary-600 mt-1">Scan QR</span>
        </div>

        {navItems.filter(item => !item.isAction).slice(2, 4).map((item, idx) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={idx + 2}
              onClick={(e) => handleNavClick(e, item)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-all ${
                isActive ? 'text-primary-600 font-semibold' : 'text-slate-400'
              }`}
            >
              <Icon size={20} className="mb-0.5" />
              <span>{item.name === 'Cans Inventory' ? 'Cans' : item.name}</span>
            </button>
          );
        })}
        
        {/* Extra Bottom button to Route Settings */}
        <button
          onClick={() => navigate('/settings')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-all ${
            location.pathname === '/settings' ? 'text-primary-600 font-semibold' : 'text-slate-400'
          }`}
        >
          <FiSettings size={20} className="mb-0.5" />
          <span>Config</span>
        </button>
      </nav>
      
      {/* Dynamic CSS for slow animations */}
      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s infinite ease-in-out;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
