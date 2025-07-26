import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

const BottomNavigation = ({ items, showAddMenu, setShowAddMenu, addMenuItems }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (item) => {
    if (item.isAction) {
      setShowAddMenu(!showAddMenu);
    } else {
      navigate(item.path);
      setShowAddMenu(false);
    }
  };

  const handleAddMenuClick = (path) => {
    navigate(path);
    setShowAddMenu(false);
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Add Menu Overlay */}
      {showAddMenu && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowAddMenu(false)}
        >
          <div className="absolute bottom-24 right-4 bg-white rounded-xl shadow-lg py-2 min-w-[160px]">
            {addMenuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleAddMenuClick(item.path)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 z-50 transition-colors duration-300">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            {items.map((item) => {
              const Icon = item.icon;
              const active = !item.isAction && isActive(item.path);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                    item.isAction
                      ? showAddMenu
                        ? 'bg-red-500 text-white scale-110'
                        : 'bg-primary text-white scale-110'
                      : active
                      ? 'text-primary bg-primary-50 dark:bg-primary-900/30'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {item.isAction && showAddMenu ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Icon className={`w-5 h-5 ${item.isAction ? 'w-6 h-6' : ''}`} />
                  )}
                  <span className={`text-xs mt-1 font-medium ${
                    item.isAction ? 'text-xs' : ''
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomNavigation;