import React from 'react';
import { Scale, Croissant, UtensilsCrossed, BookOpen, Settings, Wifi, WifiOff } from 'lucide-react';

export type ActiveTab = 'pantry' | 'scale' | 'bakers' | 'catalog' | 'settings';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  hasSelectedRecipe: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, hasSelectedRecipe }) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">GastroRatio</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-medium">PWA</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Engenharia Culinária & Despensa</p>
          </div>
        </div>

        {/* Status Offline */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            {isOnline ? (
              <span className="flex items-center text-emerald-400 text-xs">
                <Wifi className="w-3.5 h-3.5 mr-1" />
                <span className="hidden md:inline">Online</span>
              </span>
            ) : (
              <span className="flex items-center text-amber-400 text-xs">
                <WifiOff className="w-3.5 h-3.5 mr-1" />
                <span>Offline</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <nav className="max-w-4xl mx-auto mt-3 flex items-center justify-between bg-slate-800/80 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('pantry')}
          className={`flex-1 flex items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition touch-target ${
            activeTab === 'pantry'
              ? 'bg-slate-700 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4 mr-1.5" />
          <span>Bancada</span>
        </button>

        <button
          onClick={() => setActiveTab('scale')}
          disabled={!hasSelectedRecipe}
          className={`flex-1 flex items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition touch-target ${
            activeTab === 'scale'
              ? 'bg-slate-700 text-white shadow'
              : hasSelectedRecipe
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-600 cursor-not-allowed'
          }`}
        >
          <Scale className="w-4 h-4 mr-1.5" />
          <span>Balança</span>
        </button>

        <button
          onClick={() => setActiveTab('bakers')}
          className={`flex-1 flex items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition touch-target ${
            activeTab === 'bakers'
              ? 'bg-slate-700 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Croissant className="w-4 h-4 mr-1.5" />
          <span>Padeiro</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 flex items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition touch-target ${
            activeTab === 'catalog'
              ? 'bg-slate-700 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 mr-1.5" />
          <span>Receitas</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition touch-target ${
            activeTab === 'settings'
              ? 'bg-slate-700 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Configurações"
        >
          <Settings className="w-4 h-4" />
        </button>
      </nav>
    </header>
  );
};
