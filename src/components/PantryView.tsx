import React, { useState, useMemo } from 'react';
import { Recipe, PantryItem } from '../domain/schemas/recipe.schema.js';
import { FindRecipesByPantryUseCase } from '../domain/use-cases/FindRecipesByPantry.js';
import { Check, Plus, Sparkles, AlertCircle, Clock, ChefHat, ShieldCheck } from 'lucide-react';

interface PantryViewProps {
  recipes: Recipe[];
  pantryItems: PantryItem[];
  onTogglePantryItem: (item: PantryItem) => void;
  onAddPantryItem: (name: string, category: any) => void;
  assumeBasicStaples: boolean;
  onToggleAssumeStaples: (val: boolean) => void;
  onSelectRecipeForScale: (recipe: Recipe) => void;
}

export const PantryView: React.FC<PantryViewProps> = ({
  recipes,
  pantryItems,
  onTogglePantryItem,
  onAddPantryItem,
  assumeBasicStaples,
  onToggleAssumeStaples,
  onSelectRecipeForScale
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Ingredientes atualmente marcados como disponíveis
  const activeAvailableNames = useMemo(() => {
    return pantryItems.filter((i) => i.inStock).map((i) => i.name);
  }, [pantryItems]);

  // Cruzamento determinístico O(M) de receitas
  const searchResults = useMemo(() => {
    return FindRecipesByPantryUseCase.execute(recipes, activeAvailableNames, assumeBasicStaples);
  }, [recipes, activeAvailableNames, assumeBasicStaples]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    onAddPantryItem(newItemName.trim(), 'vegetable');
    setNewItemName('');
  };

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'protein', label: 'Proteínas' },
    { id: 'vegetable', label: 'Vegetais' },
    { id: 'dairy', label: 'Laticínios' },
    { id: 'flour_grain', label: 'Grãos & Farinhas' }
  ];

  const filteredPantryItems = useMemo(() => {
    if (selectedCategoryFilter === 'all') return pantryItems;
    return pantryItems.filter((i) => i.category === selectedCategoryFilter);
  }, [pantryItems, selectedCategoryFilter]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Axioma da Despensa Básica (Toggle de Destaque) */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center">
                Axioma da Despensa Básica Assumida
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Assume que você já tem sal, óleo, alho, cebola, açúcar e vinagre. Zero burocracia de cadastro.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4 touch-target">
            <input
              type="checkbox"
              checked={assumeBasicStaples}
              onChange={(e) => onToggleAssumeStaples(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* Bancada de Perecíveis (Chips com Lei de Fitts) */}
      <section className="bg-slate-800/50 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center">
              <ChefHat className="w-4 h-4 mr-2 text-brand-500" />
              O Que Tem na Geladeira e Armário Hoje?
            </h2>
            <p className="text-xs text-slate-400">Toque para marcar os itens disponíveis agora:</p>
          </div>

          {/* Filtros de Categoria */}
          <div className="flex space-x-1 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-lg transition ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-brand-600 text-white font-medium'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grade de Chips de Toque Largo (mínimo 48px de altura) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {filteredPantryItems.map((item) => {
            const isChecked = item.inStock;
            return (
              <button
                key={item.id}
                onClick={() => onTogglePantryItem(item)}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition select-none touch-target ${
                  isChecked
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-medium shadow-sm'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="text-xs truncate mr-2">{item.name}</span>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition ${
                    isChecked
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'border-slate-600 bg-slate-700/50'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Input Rápido para Insumos Extras */}
        <form onSubmit={handleAddSubmit} className="flex gap-2 pt-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="+ Adicionar outro ingrediente perecível..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center touch-target"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </button>
        </form>
      </section>

      {/* Resultados em Tempo Real: O que Cozinhar Agora */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-amber-400" />
            Sugestões para Agora ({searchResults.readyToCook.length} prontas)
          </h2>
          <span className="text-xs text-slate-400">
            {activeAvailableNames.length} itens marcados
          </span>
        </div>

        {/* 1. Receitas Prontas para Cozinhar (100% Viáveis) */}
        {searchResults.readyToCook.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {searchResults.readyToCook.map(({ recipe }) => (
              <div
                key={recipe.id}
                className="bg-slate-800/90 border border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-emerald-400 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold uppercase tracking-wider">
                      Possível Agora
                    </span>
                    <div className="flex items-center text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1.5">{recipe.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{recipe.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                  <span className="text-xs text-slate-400">
                    Rendimento: {recipe.baseYield} {recipe.yieldUnit}
                  </span>
                  <button
                    onClick={() => onSelectRecipeForScale(recipe)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow transition touch-target flex items-center"
                  >
                    Abrir na Balança →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl p-6 text-center text-slate-400 text-xs">
            Nenhuma receita 100% pronta com os itens selecionados. Marque mais itens acima ou veja as que falta apenas 1 ingrediente abaixo.
          </div>
        )}

        {/* 2. Receitas que falta apenas 1 ingrediente */}
        {searchResults.missingOneIngredient.length > 0 && (
          <div className="space-y-3 pt-4">
            <h3 className="text-sm font-semibold text-amber-300 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              Falta Apenas 1 Ingrediente ({searchResults.missingOneIngredient.length} receitas)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.missingOneIngredient.map(({ recipe, missingIngredients }) => {
                const missing = missingIngredients[0];
                return (
                  <div
                    key={recipe.id}
                    className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                          Falta: {missing.name}
                        </span>
                        <div className="flex items-center text-xs text-slate-400">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1.5">{recipe.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{recipe.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
                      <button
                        onClick={() => {
                          const existing = pantryItems.find((p) => p.name.toLowerCase() === missing.name.toLowerCase());
                          if (existing) {
                            onTogglePantryItem(existing);
                          } else {
                            onAddPantryItem(missing.name, missing.category);
                          }
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Tenho {missing.name}!
                      </button>

                      <button
                        onClick={() => onSelectRecipeForScale(recipe)}
                        className="text-xs text-slate-300 hover:text-white font-medium underline"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
