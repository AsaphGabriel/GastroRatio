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

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pantry');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [assumeBasicStaples, setAssumeBasicStaples] = useState<boolean>(true);
  const [isDbReady, setIsDbReady] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);

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
    const id = 'p-' + Date.now();
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
    setActiveTab('scale');
  };

  const handleSelectForBakers = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setActiveTab('bakers');
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
        hasSelectedRecipe={!!selectedRecipe}
        onOpenImporter={() => setIsImporterOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1">
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

        {activeTab === 'scale' && selectedRecipe && (
          <ScaleView
            recipe={selectedRecipe}
            onBackToPantry={() => setActiveTab('pantry')}
            onOpenInBakers={handleSelectForBakers}
          />
        )}

        {activeTab === 'bakers' && (
          <BakersView
            recipes={recipes}
            initialRecipe={selectedRecipe || undefined}
            onSelectForScale={handleSelectRecipeForScale}
          />
        )}

        {activeTab === 'catalog' && (
          <RecipesListView
            recipes={recipes}
            onSelectRecipe={handleSelectRecipeForScale}
            onResetToSeed={handleResetToSeed}
          />
        )}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      <RecipeImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onSaveRecipe={handleSaveImportedRecipe}
      />
    </div>
  );
};
