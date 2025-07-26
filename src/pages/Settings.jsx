import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Palette, Check, Eye } from 'lucide-react';
import { useTheme, themeColors } from '../contexts/ThemeContext';
import { Switch } from '@headlessui/react';

const Settings = () => {
  const navigate = useNavigate();
  const { 
    isDarkMode, 
    currentColor, 
    customColor,
    toggleDarkMode, 
    changeColorTheme, 
    setCustomColorTheme,
    getCurrentColors 
  } = useTheme();

  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [customColors, setCustomColors] = useState({
    primary: '#2563eb',
    secondary: '#06b6d4',
    accent: '#3b82f6',
  });

  const handleCustomColorChange = (colorType, value) => {
    setCustomColors(prev => ({
      ...prev,
      [colorType]: value
    }));
  };

  const applyCustomColors = () => {
    setCustomColorTheme({
      name: 'Custom Theme',
      ...customColors
    });
    setShowCustomColorPicker(false);
  };

  const previewCustomColors = () => {
    // Temporarily apply colors for preview
    const root = document.documentElement;
    root.style.setProperty('--color-primary', customColors.primary);
    root.style.setProperty('--color-secondary', customColors.secondary);
    root.style.setProperty('--color-accent', customColors.accent);
  };

  const resetPreview = () => {
    const colors = getCurrentColors();
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
  };

  const ColorThemeCard = ({ colorKey, colors, isSelected, isCustom = false }) => (
    <button
      onClick={() => !isCustom && changeColorTheme(colorKey)}
      className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
        isSelected 
          ? 'border-primary shadow-lg scale-105' 
          : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
      } ${isCustom ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className="flex space-x-1">
          <div 
            className="w-4 h-4 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: colors.primary }}
          />
          <div 
            className="w-4 h-4 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: colors.secondary }}
          />
          <div 
            className="w-4 h-4 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: colors.accent }}
          />
        </div>
        {isSelected && (
          <Check className="w-5 h-5 text-primary" />
        )}
      </div>
      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-left">
        {colors.name}
      </h3>
      {isCustom && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-left mt-1">
          Your custom colors
        </p>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
          <p className="text-gray-600 dark:text-gray-400">Customize your app experience</p>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Dark Mode</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isDarkMode ? 'Dark theme is enabled' : 'Light theme is enabled'}
              </p>
            </div>
          </div>
          <Switch
            checked={isDarkMode}
            onChange={toggleDarkMode}
            className={`${
              isDarkMode ? 'bg-primary' : 'bg-gray-200 dark:bg-slate-600'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800`}
          >
            <span
              className={`${
                isDarkMode ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>
      </div>

      {/* Color Themes */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Color Themes</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {Object.entries(themeColors).map(([key, colors]) => (
            <ColorThemeCard
              key={key}
              colorKey={key}
              colors={colors}
              isSelected={currentColor === key && !customColor}
            />
          ))}
          
          {customColor && (
            <ColorThemeCard
              colorKey="custom"
              colors={customColor}
              isSelected={currentColor === 'custom'}
              isCustom={true}
            />
          )}
        </div>

        {/* Custom Color Section */}
        <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
          <button
            onClick={() => setShowCustomColorPicker(!showCustomColorPicker)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Create Custom Theme
            </span>
            <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {showCustomColorPicker && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={customColors.primary}
                      onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                      className="w-12 h-10 rounded-lg border border-gray-300 dark:border-slate-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customColors.primary}
                      onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                      className="flex-1 input-field text-sm"
                      placeholder="#2563eb"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={customColors.secondary}
                      onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                      className="w-12 h-10 rounded-lg border border-gray-300 dark:border-slate-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customColors.secondary}
                      onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                      className="flex-1 input-field text-sm"
                      placeholder="#06b6d4"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={customColors.accent}
                      onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                      className="w-12 h-10 rounded-lg border border-gray-300 dark:border-slate-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customColors.accent}
                      onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                      className="flex-1 input-field text-sm"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={previewCustomColors}
                  onMouseLeave={resetPreview}
                  className="flex-1 btn-secondary text-sm py-2"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </button>
                <button
                  onClick={applyCustomColors}
                  className="flex-1 btn-primary text-sm py-2"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply Theme
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* App Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          About DentalCare
        </h3>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Build</span>
            <span className="font-medium">Production</span>
          </div>
          <div className="flex justify-between">
            <span>Theme</span>
            <span className="font-medium capitalize">
              {customColor ? 'Custom' : themeColors[currentColor]?.name} 
              {isDarkMode ? ' (Dark)' : ' (Light)'}
            </span>
          </div>
        </div>
      </div>

      {/* Reset Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Reset Settings
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          This will reset all your theme preferences to default values.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem('dental-app-theme');
            window.location.reload();
          }}
          className="btn-secondary text-sm py-2 px-4"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
};

export default Settings;