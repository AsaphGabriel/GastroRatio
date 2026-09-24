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

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pantry');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [assumeBasicStaples, setAssumeBasicStaples] = useState<boolean>(true);
  const [isDbReady, setIsDbReady] = useState(false);

  // Inicialização do IndexedDB com Carga Semente (Fase 2)
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

  if (!isDbReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-xs">
        Inicializando GastroRatio (IndexedDB)...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-slate-950 pb-12">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasSelectedRecipe={!!selectedRecipe}
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
    </div>
  );
};
