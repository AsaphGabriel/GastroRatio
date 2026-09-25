import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './data/database.js';
import { Recipe, PantryItem } from './domain/schemas/recipe.schema.js';
import { Header, ActiveTab } from './components/Header.js';
import { PantryView } from './components/PantryView.js';
import { ScaleView } from './components/ScaleView.js';
import { BakersView } from './components/BakersView.js';
import { RecipesListView } from './components/RecipesListView.js';
import { SettingsView } from './components/SettingsView.js';
import { RecipeImporterModal } from './components/RecipeImporterModal.js';
import { SWUpdater } from './components/SWUpdater.js';
import { generateId } from './utils/id.js';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [assumeBasicStaples, setAssumeBasicStaples] = useState<boolean>(true);
  const [isDbReady, setIsDbReady] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isBakersOpen, setIsBakersOpen] = useState(false);
  const [initialImportText, setInitialImportText] = useState('');

  useEffect(() => {
    if (window.location.hash.startsWith('#import=')) {
      try {
        const rawParam = window.location.hash.replace('#import=', '');
        const decoded = decodeURIComponent(rawParam);
        setInitialImportText(decoded);
        setIsImporterOpen(true);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (e) {
        console.error('Failed to parse import hash');
      }
    }
  }, []);

  // Sistema de Tema Duplo: Claro (Bege Culinário / Terracota) vs Escuro (Midnight Slate)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('gastroratio_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'light'; // Padrão: Bege Culinário Moderno
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('gastroratio_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Inicialização do IndexedDB com Carga Semente
  useEffect(() => {
    db.initializeDatabase()
      .then(async () => {
        const stapleSetting = await db.settings.get('assume_basic_staples');
        if (stapleSetting) {
          setAssumeBasicStaples(stapleSetting.value);
        }
        setIsDbReady(true);
      })
      .catch((err) => {
        console.error('[Database] Falha ao inicializar Dexie:', err);
        setIsDbReady(true);
      });
  }, []);

  // Consultas reativas ACID via useLiveQuery
  const recipes = useLiveQuery(() => db.recipes.toArray(), [], []) as Recipe[];
  const pantryItems = useLiveQuery(() => db.pantry.toArray(), [], []) as PantryItem[];

  const handleTogglePantryItem = async (item: PantryItem) => {
    await db.pantry.put({
      ...item,
      inStock: !item.inStock
    });
  };

  const handleAddPantryItem = async (name: string, category: any) => {
    // generateId usa cascata de fallback (UUID → getRandomValues → Date.now) para funcionar
    // tanto em HTTPS quanto em HTTP de rede local (http://192.168.x.x) [CWE-330 / src/utils/id.ts]
    const id = generateId('p');
    await db.pantry.put({
      id,
      name,
      category,
      inStock: true
    });
  };

  const handleClearPantry = async () => {
    await db.clearAllPantryStock();
  };

  const handleSelectAllPantry = async () => {
    await db.selectAllPantryStock();
  };

  const handleToggleAssumeStaples = async (val: boolean) => {
    setAssumeBasicStaples(val);
    await db.settings.put({ key: 'assume_basic_staples', value: val });
  };

  const handleSelectRecipeForScale = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsBakersOpen(false);
    setActiveTab('scale');
  };

  const handleOpenInBakers = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsBakersOpen(true);
  };

  const handleCloseBakers = () => {
    setIsBakersOpen(false);
  };

  const handleResetToSeed = async () => {
    await db.resetToSeed();
    if (recipes.length > 0) {
      setSelectedRecipe(recipes[0]);
    }
  };

  const handleSaveImportedRecipe = async (newRecipe: Recipe) => {
    await db.saveRecipeTransaction(newRecipe);
    setSelectedRecipe(newRecipe);
    setActiveTab('scale');
  };

  const handleDeleteRecipe = async (id: string) => {
    await db.deleteRecipeTransaction(id);
    if (selectedRecipe?.id === id) {
      setSelectedRecipe(null);
      setActiveTab('catalog');
    }
  };

  if (!isDbReady) {
    return (
      <div className="min-h-screen bg-theme-app flex items-center justify-center text-theme-muted text-xs font-semibold">
        Inicializando GastroRatio (IndexedDB)...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-app text-theme-main flex flex-col selection:bg-orange-500 selection:text-white pb-12 transition-colors duration-200">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenImporter={() => setIsImporterOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1">
        {activeTab === 'catalog' && (
          <RecipesListView
            recipes={recipes}
            onSelectRecipe={handleSelectRecipeForScale}
            onResetToSeed={handleResetToSeed}
            onDeleteRecipe={handleDeleteRecipe}
          />
        )}

        {activeTab === 'pantry' && (
          <PantryView
            recipes={recipes}
            pantryItems={pantryItems}
            onTogglePantryItem={handleTogglePantryItem}
            onAddPantryItem={handleAddPantryItem}
            assumeBasicStaples={assumeBasicStaples}
            onToggleAssumeStaples={handleToggleAssumeStaples}
            onSelectRecipeForScale={handleSelectRecipeForScale}
            onClearPantry={handleClearPantry}
            onSelectAllPantry={handleSelectAllPantry}
          />
        )}

        {activeTab === 'scale' && !selectedRecipe && (
          <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-theme-brand-subtle text-theme-brand flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-theme-main">Nenhuma Receita Selecionada</h2>
            <p className="text-sm text-theme-muted max-w-md">
              Para usar o Modo Cozinha, vá em Receitas ou Despensa e selecione um prato para preparar.
            </p>
            <button onClick={() => setActiveTab('catalog')} className="px-6 py-2.5 mt-4 rounded-xl bg-theme-brand hover:opacity-90 text-white font-bold transition shadow-sm touch-target">
              Ver Receitas
            </button>
          </div>
        )}

        {activeTab === 'scale' && selectedRecipe && !isBakersOpen && (
          <ScaleView
            recipe={selectedRecipe}
            onBackToRecipes={() => setActiveTab('catalog')}
            onOpenInBakers={handleOpenInBakers}
            onDeleteRecipe={() => handleDeleteRecipe(selectedRecipe.id)}
          />
        )}

        {activeTab === 'scale' && selectedRecipe && isBakersOpen && (
          <BakersView
            recipes={recipes}
            initialRecipe={selectedRecipe || undefined}
            onSelectForScale={handleSelectRecipeForScale}
            onClose={handleCloseBakers}
          />
        )}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      <RecipeImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onSaveRecipe={handleSaveImportedRecipe}
        initialRawText={initialImportText}
      />
      <SWUpdater />
    </div>
  );
};
