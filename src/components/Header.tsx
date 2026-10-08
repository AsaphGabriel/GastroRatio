import React from 'react';
import {
  UtensilsCrossed,
  BookOpen,
  ChefHat,
  Settings,
  Wifi,
  WifiOff,
  Plus,
  Sun,
  Moon
} from 'lucide-react';

export type ActiveTab = 'catalog' | 'pantry' | 'scale' | 'settings';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onNewRecipe?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewRecipe,
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
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-theme-brand flex items-center justify-center text-white shadow-sm">
            <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-theme-wheat" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-serif font-extrabold text-lg sm:text-xl tracking-tight text-theme-main">
                GastroRatio
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-theme-brand-subtle text-theme-brand font-bold tracking-wider">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-theme-dim hidden md:block leading-none mt-0.5">
              Sua cozinha, sem complicação
            </p>
          </div>
        </div>

        {/* Ações do Topo: Nova Receita + Alternar Tema + Status de Conexão */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {onNewRecipe && (
            <button
              onClick={onNewRecipe}
              className="flex items-center text-xs px-2.5 sm:px-3 py-1.5 rounded-xl bg-theme-brand hover:opacity-90 text-white font-semibold shadow-sm transition touch-target"
              title="Adicionar nova receita manualmente"
            >
              <Plus className="w-3.5 h-3.5 mr-1 shrink-0" />
              <span className="hidden sm:inline">Nova Receita</span>
              <span className="sm:hidden">Criar</span>
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

      {/* Barra de Navegação Responsiva — Abas Físicas de Fichário */}
      <nav className="max-w-4xl mx-auto mt-4 flex overflow-x-auto gap-1 border-b-2 border-theme-strong relative z-10 px-1 sm:px-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center justify-center py-2.5 px-3 sm:px-5 rounded-t-xl text-xs sm:text-sm font-semibold transition touch-target border-t border-l border-r relative ${
            activeTab === 'catalog'
              ? 'bg-theme-app text-theme-main border-theme-strong shadow-sm z-20'
              : 'bg-theme-card-subtle text-theme-muted border-theme-subtle hover:bg-theme-card hover:text-theme-main z-0'
          }`}
          style={{ marginBottom: activeTab === 'catalog' ? '-2px' : '0', borderBottomColor: activeTab === 'catalog' ? 'var(--bg-app)' : 'var(--border-strong)' }}
        >
          <BookOpen className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
          <span>Receitas</span>
        </button>

        <button
          onClick={() => setActiveTab('pantry')}
          className={`flex items-center justify-center py-2.5 px-3 sm:px-5 rounded-t-xl text-xs sm:text-sm font-semibold transition touch-target border-t border-l border-r relative ${
            activeTab === 'pantry'
              ? 'bg-theme-app text-theme-main border-theme-strong shadow-sm z-20'
              : 'bg-theme-card-subtle text-theme-muted border-theme-subtle hover:bg-theme-card hover:text-theme-main z-0'
          }`}
          style={{ marginBottom: activeTab === 'pantry' ? '-2px' : '0', borderBottomColor: activeTab === 'pantry' ? 'var(--bg-app)' : 'var(--border-strong)' }}
        >
          <UtensilsCrossed className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
          <span>Despensa</span>
        </button>

        <button
          onClick={() => setActiveTab('scale')}
          className={`flex items-center justify-center py-2.5 px-3 sm:px-5 rounded-t-xl text-xs sm:text-sm font-semibold transition touch-target border-t border-l border-r relative ${
            activeTab === 'scale'
              ? 'bg-theme-app text-theme-main border-theme-strong shadow-sm z-20'
              : 'bg-theme-card-subtle text-theme-muted border-theme-subtle hover:bg-theme-card hover:text-theme-main z-0'
          }`}
          style={{ marginBottom: activeTab === 'scale' ? '-2px' : '0', borderBottomColor: activeTab === 'scale' ? 'var(--bg-app)' : 'var(--border-strong)' }}
          title="Modo Cozinha — pese e acompanhe o preparo"
        >
          <ChefHat className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
          <span>Cozinha</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center justify-center py-2.5 px-3 sm:px-5 rounded-t-xl text-xs sm:text-sm font-semibold transition touch-target border-t border-l border-r relative ml-auto ${
            activeTab === 'settings'
              ? 'bg-theme-app text-theme-main border-theme-strong shadow-sm z-20'
              : 'bg-theme-card-subtle text-theme-muted border-theme-subtle hover:bg-theme-card hover:text-theme-main z-0'
          }`}
          style={{ marginBottom: activeTab === 'settings' ? '-2px' : '0', borderBottomColor: activeTab === 'settings' ? 'var(--bg-app)' : 'var(--border-strong)' }}
          title="Configurações & Backup"
        >
          <Settings className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
          <span className="hidden sm:inline">Ajustes</span>
        </button>
      </nav>
    </header>
  );
};
