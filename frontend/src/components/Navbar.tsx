import React from 'react';
import { ShieldCheck, Link, Image as ImageIcon, Activity, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  activeTab: 'link' | 'image';
  setActiveTab: (tab: 'link' | 'image') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-600 dark:from-white dark:via-slate-200 dark:to-emerald-400">
                  TruthLens
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Fake News Detection Platform
              </p>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
            <button
              onClick={() => setActiveTab('link')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'link'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
              }`}
            >
              <Link className="w-4 h-4" />
              <span>Verify Link & News</span>
            </button>

            <button
              onClick={() => setActiveTab('image')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'image'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Verify Image</span>
            </button>
          </div>

          {/* Right Action Bar: Status & Theme Toggle */}
          <div className="flex items-center space-x-3">
            {/* System Operational Status */}
            <div className="hidden lg:flex items-center space-x-2 bg-slate-100 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center space-x-1">
                <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Engine Status: Online</span>
              </span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all duration-300 shadow-sm cursor-pointer active:scale-95
                dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-300 dark:hover:text-amber-300 dark:hover:border-amber-500/40 dark:hover:bg-slate-800
                bg-white border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 hover:bg-slate-50"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45 shrink-0" />
                  <span className="text-xs font-semibold">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 hover:-rotate-12 shrink-0" />
                  <span className="text-xs font-semibold">Dark Mode</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
