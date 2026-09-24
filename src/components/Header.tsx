import React from 'react';
import {
  Scale,
  Croissant,
  UtensilsCrossed,
  BookOpen,
  Settings,
  Wifi,
  WifiOff,
  Zap,
  Sun,
  Moon
} from 'lucide-react';

export type ActiveTab = 'pantry' | 'scale' | 'bakers' | 'catalog' | 'settings';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  onOpenImporter?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,

  onOpenImporter,
  theme,
  onToggleTheme
}) => {
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
    <header className="sticky top-0 z-40 bg-theme-header border-b border-theme-subtle backdrop-blur-md px-3 sm:px-4 py-2.5 transition-colors duration-200">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-theme-brand flex items-center justify-center text-white shadow-sm shadow-orange-500/20">
            <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-theme-main">
                GastroRatio
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-theme-brand-subtle text-theme-brand font-bold tracking-wider">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-theme-dim hidden md:block leading-none mt-0.5">
              Engenharia Culinária & Despensa
            </p>
          </div>
        </div>

        {/* Ações do Topo: Importar + Alternar Tema + Status de Conexão */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {onOpenImporter && (
            <button
              onClick={onOpenImporter}
              className="flex items-center text-xs px-2.5 sm:px-3 py-1.5 rounded-xl bg-theme-brand hover:opacity-90 text-white font-semibold shadow-sm transition touch-target"
              title="Importar receita colada da internet"
            >
              <Zap className="w-3.5 h-3.5 mr-1 shrink-0" />
              <span className="hidden sm:inline">Colar Receita</span>
              <span className="sm:hidden">Colar</span>
            </button>
          )}

          {/* Botão de Alternância de Tema (Sol / Lua) */}
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl border border-theme-subtle bg-theme-card hover:bg-theme-card-subtle flex items-center justify-center text-theme-main transition shadow-sm touch-target"
            title={theme === 'dark' ? 'Alternar para Tema Claro (Bege Culinário)' : 'Alternar para Tema Escuro (Midnight)'}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in fade-in duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-amber-800 animate-in fade-in duration-200" />
            )}
          </button>

          {/* Status Offline/Online Compacto */}
          <div className="flex items-center pl-1">
            {isOnline ? (
              <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs" title="Online">
                <Wifi className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="flex items-center text-amber-600 dark:text-amber-400 text-xs" title="Modo 100% Offline Ativo">
                <WifiOff className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Navegação Responsiva */}
      <nav className="max-w-4xl mx-auto mt-2.5 grid grid-cols-5 gap-1 bg-theme-card-subtle p-1 rounded-xl border border-theme-subtle">
        <button
          onClick={() => setActiveTab('pantry')}
          className={`flex flex-col sm:flex-row items-center justify-center py-1.5 sm:py-2 px-1 rounded-lg text-[11px] sm:text-xs font-semibold transition touch-target ${
            activeTab === 'pantry'
              ? 'bg-theme-card text-theme-main shadow-sm border border-theme-subtle'
              : 'text-theme-muted hover:text-theme-main'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4 sm:mr-1.5 shrink-0 mb-0.5 sm:mb-0" />
          <span className="text-[10px] sm:text-xs">Bancada</span>
        </button>

        <button
          onClick={() => setActiveTab('scale')}
          
          className={`flex flex-col sm:flex-row items-center justify-center py-1.5 sm:py-2 px-1 rounded-lg text-[11px] sm:text-xs font-semibold transition touch-target ${
            activeTab === 'scale'
              ? 'bg-theme-card text-theme-main shadow-sm border border-theme-subtle'
              : 'text-theme-muted hover:text-theme-main'
          }`}
          title='Balança de precisão'
        >
          <Scale className="w-4 h-4 sm:mr-1.5 shrink-0 mb-0.5 sm:mb-0" />
          <span className="text-[10px] sm:text-xs">Balança</span>
        </button>

        <button
          onClick={() => setActiveTab('bakers')}
          className={`flex flex-col sm:flex-row items-center justify-center py-1.5 sm:py-2 px-1 rounded-lg text-[11px] sm:text-xs font-semibold transition touch-target ${
            activeTab === 'bakers'
              ? 'bg-theme-card text-theme-main shadow-sm border border-theme-subtle'
              : 'text-theme-muted hover:text-theme-main'
          }`}
        >
          <Croissant className="w-4 h-4 sm:mr-1.5 shrink-0 mb-0.5 sm:mb-0" />
          <span className="text-[10px] sm:text-xs">Chef</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col sm:flex-row items-center justify-center py-1.5 sm:py-2 px-1 rounded-lg text-[11px] sm:text-xs font-semibold transition touch-target ${
            activeTab === 'catalog'
              ? 'bg-theme-card text-theme-main shadow-sm border border-theme-subtle'
              : 'text-theme-muted hover:text-theme-main'
          }`}
        >
          <BookOpen className="w-4 h-4 sm:mr-1.5 shrink-0 mb-0.5 sm:mb-0" />
          <span className="text-[10px] sm:text-xs">Receitas</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col sm:flex-row items-center justify-center py-1.5 sm:py-2 px-1 rounded-lg text-[11px] sm:text-xs font-semibold transition touch-target ${
            activeTab === 'settings'
              ? 'bg-theme-card text-theme-main shadow-sm border border-theme-subtle'
              : 'text-theme-muted hover:text-theme-main'
          }`}
          title="Configurações & Backup"
        >
          <Settings className="w-4 h-4 sm:mr-1.5 shrink-0 mb-0.5 sm:mb-0" />
          <span className="text-[10px] sm:text-xs">Ajustes</span>
        </button>
      </nav>
    </header>
  );
};
