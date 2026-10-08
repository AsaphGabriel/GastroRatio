import React, { useState, useMemo } from 'react';
import { Recipe, PantryItem } from '../domain/schemas/recipe.schema.js';
import { FindRecipesByPantryUseCase } from '../domain/use-cases/FindRecipesByPantry.js';
import { db } from '../data/database.js';
import {
  Check,
  Sparkles,
  AlertCircle,
  Clock,
  ChefHat,
  RotateCcw,
  CheckCheck
} from 'lucide-react';

interface PantryViewProps {
  recipes: Recipe[];
  pantryItems: PantryItem[];
  onTogglePantryItem: (item: PantryItem) => void;
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
  assumeBasicStaples,
  onToggleAssumeStaples,
  onSelectRecipeForScale,
  onClearPantry,
  onSelectAllPantry
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Ingredientes atualmente marcados como disponíveis na bancada
  const activeAvailableNames = useMemo(() => {
    return pantryItems.filter((i) => i.inStock).map((i) => i.name);
  }, [pantryItems]);

  // Cruzamento determinístico O(M) de receitas
  const searchResults = useMemo(() => {
    return FindRecipesByPantryUseCase.execute(recipes, activeAvailableNames, assumeBasicStaples);
  }, [recipes, activeAvailableNames, assumeBasicStaples]);

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'protein', label: 'Proteínas' },
    { id: 'vegetable', label: 'Vegetais' },
    { id: 'dairy', label: 'Laticínios' },
    { id: 'flour_grain', label: 'Grãos & Farinhas' },
    { id: 'staple_seasoning', label: 'Temperos & Básicos' },
    { id: 'fat_oil', label: 'Gorduras & Óleos' },
    { id: 'liquid', label: 'Líquidos' }
  ];

  const filteredPantryItems = useMemo(() => {
    if (selectedCategoryFilter === 'all') return pantryItems;
    return pantryItems.filter((i) => i.category === selectedCategoryFilter);
  }, [pantryItems, selectedCategoryFilter]);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">


      {/* 2. Bancada de Perecíveis (Chips com Lei de Fitts e Ações Rápidas) */}
      <section className="bg-theme-card border border-theme-subtle rounded-sm p-4 sm:p-5 space-y-4 shadow-sm transition-colors relative overflow-hidden notebook-paper">
        <div className="vichy-ribbon-thick absolute top-0 left-0 right-0 z-0" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-theme-subtle border-dashed relative z-10 mt-2">
          <div>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-theme-main flex items-center">
              <ChefHat className="w-5 h-5 mr-2 text-theme-brand shrink-0" />
              A Despensa
            </h2>
            <p className="text-[11px] sm:text-xs text-theme-muted mt-0.5 font-serif italic">
              Selecione o que você tem nas prateleiras hoje:
            </p>
          </div>

          {/* Contador e Ações Rápidas de Limpeza */}
          <div className="flex items-center space-x-2 self-start sm:self-auto flex-wrap gap-1.5">
            <span className="text-xs font-serif font-bold px-2.5 py-1 rounded-sm bg-theme-card-subtle text-theme-main border border-theme-subtle">
              {activeAvailableNames.length} em estoque
            </span>

            {onClearPantry && activeAvailableNames.length > 0 && (
              <button
                type="button"
                onClick={onClearPantry}
                className="text-xs font-bold font-serif px-2.5 py-1 rounded-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center transition touch-target"
                title="Desmarcar todos os itens da bancada"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Esvaziar
              </button>
            )}

            {onSelectAllPantry && activeAvailableNames.length === 0 && (
              <button
                type="button"
                onClick={onSelectAllPantry}
                className="text-xs font-bold font-serif px-2.5 py-1 rounded-sm bg-theme-card-subtle hover:bg-theme-card border border-theme-subtle text-theme-muted flex items-center transition touch-target"
                title="Marcar todos os itens comuns para teste rápido"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Preencher
              </button>
            )}
          </div>
        </div>

        {/* Filtros de Categoria em Scroll Suave */}
        <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar relative z-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`shrink-0 text-sm px-3.5 py-1.5 rounded-sm border transition whitespace-nowrap font-serif touch-target ${
                selectedCategoryFilter === cat.id
                  ? 'bg-theme-brand text-white border-theme-brand shadow-sm font-bold'
                  : 'bg-theme-card-subtle text-theme-muted hover:text-theme-main border-theme-subtle'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grade de Chips de Toque Amplo (max-h contido com scroll interno) */}
        <div className="max-h-[52vh] overflow-y-auto pr-1 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
            {filteredPantryItems.map((item) => {
              const isChecked = item.inStock;
              return (
                <button
                  key={item.id}
                  onClick={() => onTogglePantryItem(item)}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-sm border text-left transition select-none touch-target relative overflow-hidden ${
                    isChecked
                      ? 'bg-theme-wheat border-theme-brand/30 text-theme-strong font-serif font-bold shadow-md transform rotate-1'
                      : 'bg-theme-card border-theme-subtle border-dashed font-serif text-theme-muted hover:bg-theme-card-hover shadow-sm'
                  }`}
                >
                  <span className="text-sm truncate mr-1.5 z-10">{item.name}</span>
                  {isChecked && (
                    <div className="absolute -right-2 -bottom-2 text-theme-brand/10 pointer-events-none">
                      <ChefHat className="w-10 h-10 rotate-[-20deg]" />
                    </div>
                  )}
                  <div
                    className={`w-5 h-5 rounded-sm flex items-center justify-center shrink-0 border transition z-10 ${
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
        </div>

        {/* Toggle de Ingredientes Básicos — rodapé discreto */}
        <div className="pt-2 border-t border-theme-subtle border-dashed flex items-center justify-between gap-3 relative z-10">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-theme-muted leading-snug font-serif">
              <span className="font-semibold text-theme-main">Assumir itens básicos</span> — sal, óleo, alho, cebola, açúcar e vinagre sempre disponíveis
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 touch-target" title="Alternar premissa da despensa básica">
            <input
              type="checkbox"
              checked={assumeBasicStaples}
              onChange={(e) => onToggleAssumeStaples(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 relative bg-theme-card-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all toggle-track border border-theme-subtle"></div>
          </label>
        </div>
      </section>

      {/* 3. Resultados em Tempo Real: Sugestões Culinárias */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm sm:text-base font-bold text-theme-main flex items-center font-serif">
            <Sparkles className="w-4 h-4 mr-2 text-theme-wheat shrink-0" />
            Sugestões com a sua Despensa ({searchResults.readyToCook.length} prontas)
          </h2>
          <span className="text-xs text-theme-dim font-serif italic">
            {activeAvailableNames.length} {activeAvailableNames.length === 1 ? 'item selecionado' : 'itens selecionados'}
          </span>
        </div>

        {/* Estado Vazio: Nenhuma seleção feita */}
        {activeAvailableNames.length === 0 ? (
          <div className="bg-theme-card border border-dashed border-theme-strong rounded-sm p-6 sm:p-8 text-center space-y-2 shadow-sm notebook-paper">
            <div className="w-12 h-12 rounded-full bg-theme-brand/10 text-theme-brand flex items-center justify-center mx-auto border border-theme-brand/20">
              <ChefHat className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-theme-main font-serif">Despensa Vazia! O que você tem na cozinha?</h3>
            <p className="text-xs text-theme-muted max-w-md mx-auto leading-relaxed">
              Marque os ingredientes nas prateleiras acima (ex: <strong>Ovos</strong>, <strong>Tomate</strong>, <strong>Farinha de trigo</strong>) para encontrar receitas deliciosas que você pode preparar sem sair de casa.
            </p>
          </div>
        ) : searchResults.readyToCook.length > 0 ? (
          /* Receitas 100% Viáveis */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {searchResults.readyToCook.map(({ recipe }) => (
              <div
                key={recipe.id}
                className="bg-theme-card border border-theme-subtle rounded-sm p-4 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md transition relative overflow-hidden notebook-paper"
              >
                <div className="vichy-ribbon-thick absolute top-0 left-0 right-0 z-0 h-1.5 opacity-80" />
                <div className="relative z-10 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-sm bg-emerald-900/10 dark:bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider font-serif border border-emerald-900/20">
                      Possível Agora
                    </span>
                    <div className="flex items-center text-xs text-theme-muted">
                      <Clock className="w-3.5 h-3.5 mr-1 text-theme-dim" />
                      <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-theme-main mt-2 font-serif">{recipe.title}</h3>
                  <p className="text-xs text-theme-muted mt-1 line-clamp-2 leading-relaxed">{recipe.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-theme-subtle relative z-10">
                  <span className="text-xs text-theme-muted font-serif">
                    Rendimento: <strong>{recipe.baseYield}</strong> {recipe.yieldUnit}
                  </span>
                  <button
                    onClick={() => onSelectRecipeForScale(recipe)}
                    className="bg-theme-brand hover:bg-theme-brand-dark text-white px-3.5 py-2 rounded-sm text-xs font-bold shadow-sm transition touch-target flex items-center font-serif"
                  >
                    Abrir Receita →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Nenhum prato 100% pronto com a combinação atual */
          <div className="bg-theme-card border border-theme-subtle border-dashed rounded-sm p-5 text-center text-theme-muted text-xs space-y-1 font-serif shadow-sm">
            <p className="font-semibold text-theme-main">Nenhuma receita 100% pronta apenas com estes itens.</p>
            <p>Selecione mais itens na despensa acima ou confira abaixo os pratos onde falta apenas 1 ingrediente.</p>
          </div>
        )}

        {/* 4. Receitas onde falta apenas 1 ingrediente */}
        {searchResults.missingOneIngredient.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs sm:text-sm font-bold text-theme-brand flex items-center font-serif">
              <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
              Falta Apenas 1 Ingrediente ({searchResults.missingOneIngredient.length} opções)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.missingOneIngredient.map(({ recipe, missingIngredients }) => {
                const missing = missingIngredients[0];
                return (
                  <div
                    key={recipe.id}
                    className="bg-theme-card border border-theme-subtle rounded-sm p-4 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md transition relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500/50" />
                    <div className="pl-2 relative z-10">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-sm bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold font-serif border border-amber-200 dark:border-amber-800">
                          Falta: {missing.name}
                        </span>
                        <div className="flex items-center text-xs text-theme-muted">
                          <Clock className="w-3.5 h-3.5 mr-1 text-theme-dim" />
                          <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-theme-main mt-1.5 font-serif">{recipe.title}</h4>
                      <p className="text-xs text-theme-muted mt-1 line-clamp-1">{recipe.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-theme-subtle relative z-10 pl-2">
                      <button
                        onClick={async () => {
                          const existing = pantryItems.find((p) => p.name.toLowerCase() === missing.name.toLowerCase());
                          if (existing) {
                            onTogglePantryItem(existing);
                          } else {
                            await db.addOrUpdatePantryItem(missing.name, missing.category);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-theme-wheat border border-theme-strong/30 text-theme-strong text-xs font-bold font-serif hover:bg-theme-wheat/80 transition touch-target shadow-sm"
                      >
                        + Tenho {missing.name}!
                      </button>

                      <button
                        onClick={() => onSelectRecipeForScale(recipe)}
                        className="text-xs text-theme-muted hover:text-theme-main font-semibold underline font-serif"
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
