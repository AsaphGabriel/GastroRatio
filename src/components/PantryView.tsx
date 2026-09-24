import React, { useState, useMemo } from 'react';
import { Recipe, PantryItem } from '../domain/schemas/recipe.schema.js';
import { FindRecipesByPantryUseCase } from '../domain/use-cases/FindRecipesByPantry.js';
import {
  Check,
  Plus,
  Sparkles,
  AlertCircle,
  Clock,
  ChefHat,
  ShieldCheck,
  RotateCcw,
  CheckCheck
} from 'lucide-react';

interface PantryViewProps {
  recipes: Recipe[];
  pantryItems: PantryItem[];
  onTogglePantryItem: (item: PantryItem) => void;
  onAddPantryItem: (name: string, category: any) => void;
  assumeBasicStaples: boolean;
  onToggleAssumeStaples: (val: boolean) => void;
  onSelectRecipeForScale: (recipe: Recipe) => void;
  onClearPantry?: () => void;
  onSelectAllPantry?: () => void;
}

export const PantryView: React.FC<PantryViewProps> = ({
  recipes,
  pantryItems,
  onTogglePantryItem,
  onAddPantryItem,
  assumeBasicStaples,
  onToggleAssumeStaples,
  onSelectRecipeForScale,
  onClearPantry,
  onSelectAllPantry
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Ingredientes atualmente marcados como disponíveis na bancada
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
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* 1. Axioma da Despensa Básica Assumida */}
      <div className="bg-theme-card border border-theme-subtle rounded-2xl p-4 card-shadow transition-colors">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-theme-main flex items-center">
                Axioma da Despensa Básica
              </h2>
              <p className="text-[11px] sm:text-xs text-theme-muted mt-0.5 leading-snug">
                Assume que você já possui sal, óleo, alho, cebola, açúcar e vinagre. Zero fricção de cadastro.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 touch-target" title="Alternar premissa da despensa básica">
            <input
              type="checkbox"
              checked={assumeBasicStaples}
              onChange={(e) => onToggleAssumeStaples(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 relative bg-theme-card-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:[background-color:var(--brand-main)] border border-theme-subtle"></div>
          </label>
        </div>
      </div>

      {/* 2. Bancada de Perecíveis (Chips com Lei de Fitts e Ações Rápidas) */}
      <section className="bg-theme-card border border-theme-subtle rounded-2xl p-4 sm:p-5 space-y-4 card-shadow transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-theme-subtle">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-theme-main flex items-center">
              <ChefHat className="w-4 h-4 mr-2 text-theme-brand shrink-0" />
              O Que Tem na Geladeira e Armário Hoje?
            </h2>
            <p className="text-[11px] sm:text-xs text-theme-muted mt-0.5">
              Toque para marcar apenas o que você tem disponível agora:
            </p>
          </div>

          {/* Contador e Ações Rápidas de Limpeza */}
          <div className="flex items-center space-x-2 self-start sm:self-auto flex-wrap gap-1.5">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-theme-card-subtle text-theme-main border border-theme-subtle">
              {activeAvailableNames.length} marcados
            </span>

            {onClearPantry && activeAvailableNames.length > 0 && (
              <button
                type="button"
                onClick={onClearPantry}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center transition touch-target"
                title="Desmarcar todos os itens da bancada"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Limpar
              </button>
            )}

            {onSelectAllPantry && activeAvailableNames.length === 0 && (
              <button
                type="button"
                onClick={onSelectAllPantry}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-theme-card-subtle hover:bg-theme-card border border-theme-subtle text-theme-muted flex items-center transition touch-target"
                title="Marcar todos os itens comuns para teste rápido"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Marcar Todos
              </button>
            )}
          </div>
        </div>

        {/* Filtros de Categoria em Scroll Suave */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-xl transition whitespace-nowrap font-medium touch-target ${
                selectedCategoryFilter === cat.id
                  ? 'bg-theme-brand text-white shadow-sm'
                  : 'bg-theme-card-subtle text-theme-muted hover:text-theme-main border border-theme-subtle'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grade de Chips de Toque Amplo (min-h-[44px]) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
          {filteredPantryItems.map((item) => {
            const isChecked = item.inStock;
            return (
              <button
                key={item.id}
                onClick={() => onTogglePantryItem(item)}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-left transition select-none touch-target ${
                  isChecked
                    ? 'bg-theme-brand-subtle border-theme-brand text-theme-brand-text font-bold shadow-sm'
                    : 'bg-theme-card hover:bg-theme-card-hover border-theme-subtle text-theme-main'
                }`}
              >
                <span className="text-xs truncate mr-1.5">{item.name}</span>
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition ${
                    isChecked
                      ? 'bg-theme-brand border-theme-brand text-white'
                      : 'border-theme-strong bg-theme-card-subtle'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Input Rápido para Insumos Extras */}
        <form onSubmit={handleAddSubmit} className="flex gap-2 pt-1">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="+ Adicionar outro ingrediente (ex: Espinafre, Bacon)..."
            className="flex-1 bg-theme-card-subtle border border-theme-subtle rounded-xl px-3.5 py-2.5 text-xs text-theme-main placeholder:text-theme-dim focus:outline-none focus:border-theme-brand transition"
          />
          <button
            type="submit"
            className="bg-theme-card border border-theme-strong hover:bg-theme-card-hover text-theme-main px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center transition shadow-sm touch-target"
          >
            <Plus className="w-4 h-4 mr-1 shrink-0" />
            Adicionar
          </button>
        </form>
      </section>

      {/* 3. Resultados em Tempo Real: Sugestões Culinárias */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm sm:text-base font-bold text-theme-main flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-amber-500 shrink-0" />
            Sugestões com a sua Bancada ({searchResults.readyToCook.length} prontas)
          </h2>
          <span className="text-xs text-theme-dim">
            {activeAvailableNames.length} {activeAvailableNames.length === 1 ? 'item selecionado' : 'itens selecionados'}
          </span>
        </div>

        {/* Estado Vazio: Nenhuma seleção feita */}
        {activeAvailableNames.length === 0 ? (
          <div className="bg-theme-card border border-dashed border-theme-strong rounded-2xl p-6 sm:p-8 text-center space-y-2 card-shadow">
            <div className="w-12 h-12 rounded-2xl bg-theme-brand-subtle text-theme-brand flex items-center justify-center mx-auto">
              <ChefHat className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-theme-main">Bancada Limpa! O que você tem na cozinha?</h3>
            <p className="text-xs text-theme-muted max-w-md mx-auto leading-relaxed">
              Marque os ingredientes na grade acima (ex: <strong>Ovos</strong>, <strong>Tomate</strong>, <strong>Queijo</strong> ou <strong>Peito de Frango</strong>) para o GastroRatio encontrar receitas deliciosas que você pode preparar sem desperdício.
            </p>
          </div>
        ) : searchResults.readyToCook.length > 0 ? (
          /* Receitas 100% Viáveis */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {searchResults.readyToCook.map(({ recipe }) => (
              <div
                key={recipe.id}
                className="bg-theme-card border-2 border-emerald-500/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 card-shadow hover:border-emerald-500 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">
                      Possível Agora
                    </span>
                    <div className="flex items-center text-xs text-theme-muted">
                      <Clock className="w-3.5 h-3.5 mr-1 text-theme-dim" />
                      <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-theme-main mt-1.5">{recipe.title}</h3>
                  <p className="text-xs text-theme-muted mt-1 line-clamp-2 leading-relaxed">{recipe.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-theme-subtle">
                  <span className="text-xs text-theme-muted">
                    Rendimento: <strong>{recipe.baseYield}</strong> {recipe.yieldUnit}
                  </span>
                  <button
                    onClick={() => onSelectRecipeForScale(recipe)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition touch-target flex items-center"
                  >
                    Abrir na Balança →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Nenhum prato 100% pronto com a combinação atual */
          <div className="bg-theme-card border border-theme-subtle rounded-2xl p-5 text-center text-theme-muted text-xs space-y-1">
            <p className="font-semibold text-theme-main">Nenhuma receita 100% pronta apenas com estes itens.</p>
            <p>Selecione mais itens na bancada acima ou confira abaixo os pratos onde falta apenas 1 ingrediente.</p>
          </div>
        )}

        {/* 4. Receitas onde falta apenas 1 ingrediente */}
        {searchResults.missingOneIngredient.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
              Falta Apenas 1 Ingrediente ({searchResults.missingOneIngredient.length} opções)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.missingOneIngredient.map(({ recipe, missingIngredients }) => {
                const missing = missingIngredients[0];
                return (
                  <div
                    key={recipe.id}
                    className="bg-theme-card border border-theme-subtle rounded-2xl p-4 flex flex-col justify-between space-y-3 card-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold">
                          Falta: {missing.name}
                        </span>
                        <div className="flex items-center text-xs text-theme-muted">
                          <Clock className="w-3.5 h-3.5 mr-1 text-theme-dim" />
                          <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-theme-main mt-1.5">{recipe.title}</h4>
                      <p className="text-xs text-theme-muted mt-1 line-clamp-1">{recipe.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-theme-subtle">
                      <button
                        onClick={() => {
                          const existing = pantryItems.find((p) => p.name.toLowerCase() === missing.name.toLowerCase());
                          if (existing) {
                            onTogglePantryItem(existing);
                          } else {
                            onAddPantryItem(missing.name, missing.category);
                          }
                        }}
                        className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center touch-target"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Tenho {missing.name}!
                      </button>

                      <button
                        onClick={() => onSelectRecipeForScale(recipe)}
                        className="text-xs text-theme-muted hover:text-theme-main font-semibold underline"
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
