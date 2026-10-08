import React, { useState, useMemo } from 'react';
import { Recipe } from '../domain/schemas/recipe.schema.js';
import { CalculateBakersPercentageUseCase } from '../domain/use-cases/CalculateBakersPercentage.js';
import { Droplets, ChefHat } from 'lucide-react';

interface BakersViewProps {
  recipes: Recipe[];
  initialRecipe?: Recipe;
  onSelectForScale: (recipe: Recipe) => void;
  onClose?: () => void;
}

export const BakersView: React.FC<BakersViewProps> = ({ recipes, initialRecipe, onSelectForScale, onClose }) => {
  const bakingRecipes = useMemo(() => {
    return recipes.filter((r) => r.isBakingRecipe);
  }, [recipes]);

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    initialRecipe?.id || bakingRecipes[0]?.id || ''
  );

  const selectedRecipe = useMemo(() => {
    return recipes.find((r) => r.id === selectedRecipeId) || bakingRecipes[0];
  }, [recipes, selectedRecipeId, bakingRecipes]);

  const baseBakersCalc = useMemo(() => {
    if (!selectedRecipe) return null;
    try {
      return CalculateBakersPercentageUseCase.execute(selectedRecipe.ingredients);
    } catch (err) {
      return null;
    }
  }, [selectedRecipe]);

  const [targetFlourInput, setTargetFlourInput] = useState<number>(() => {
    return baseBakersCalc ? baseBakersCalc.totalFlourGrams.toNumber() : 500;
  });

  const [targetDoughInput, setTargetDoughInput] = useState<number>(() => {
    return baseBakersCalc ? baseBakersCalc.totalDoughGrams.toNumber() : 800;
  });

  const [adjustMode, setAdjustMode] = useState<'flour' | 'dough'>('flour');

  // Cálculo reativo de pesos escalados
  const calculatedIngredients = useMemo(() => {
    if (!selectedRecipe) return [];
    if (adjustMode === 'flour') {
      return CalculateBakersPercentageUseCase.scaleByTargetFlour(
        selectedRecipe.ingredients,
        targetFlourInput || 100
      );
    } else {
      return CalculateBakersPercentageUseCase.scaleByTargetDoughWeight(
        selectedRecipe.ingredients,
        targetDoughInput || 200
      );
    }
  }, [selectedRecipe, adjustMode, targetFlourInput, targetDoughInput]);

  const currentFlourGrams = useMemo(() => {
    return calculatedIngredients
      .filter((i) => i.category === 'flour_grain' || i.name.toLowerCase().includes('farinha') || i.name.toLowerCase().includes('polvilho'))
      .reduce((sum, item) => sum + item.amount, 0);
  }, [calculatedIngredients]);

  const currentDoughGrams = useMemo(() => {
    return calculatedIngredients.reduce((sum, item) => sum + item.amount, 0);
  }, [calculatedIngredients]);

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Botão Voltar (contextual) */}
      {onClose && (
        <button
          onClick={onClose}
          className="flex items-center text-xs font-serif font-bold text-theme-muted hover:text-theme-main transition touch-target"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Voltar ao Modo Cozinha
        </button>
      )}

      <div className="mb-1 sm:mb-2 text-center">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-theme-main">Livro de Fórmulas</h1>
        <p className="text-xs sm:text-sm text-theme-muted font-serif italic mt-0.5">Calculadora de Baker's Percentage & Hidratação</p>
      </div>

      {/* 1. Seleção e Parâmetros */}
      <div className="bg-theme-card border border-theme-subtle rounded-sm p-4 sm:p-5 space-y-4 shadow-sm relative overflow-hidden notebook-paper">
        <div className="vichy-ribbon-thick absolute top-0 left-0 right-0 z-0 h-1.5 opacity-80" />
        
        <div className="flex flex-col relative z-10 pt-1">
          <label className="text-[11px] font-bold text-theme-muted mb-1.5 font-serif uppercase tracking-wider">Escolher Receita Base</label>
          <select
            value={selectedRecipeId || ''}
            onChange={(e) => {
              setSelectedRecipeId(e.target.value);
              const found = recipes.find((r) => r.id === e.target.value);
              if (found) {
                // Reset mode to 'flour' upon new selection
                setAdjustMode('flour');
                const calc = CalculateBakersPercentageUseCase.execute(found.ingredients);
                setTargetFlourInput(calc.totalFlourGrams.toNumber());
                setTargetDoughInput(calc.totalDoughGrams.toNumber());
              }
            }}
            className="bg-theme-card-subtle border border-theme-subtle rounded-sm px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-brand font-serif font-semibold shadow-sm"
          >
            {bakingRecipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>

        {/* Indicador de Hidratação e Alternador de Ajuste */}
        {baseBakersCalc && (
          <div className="pt-3 border-t border-theme-subtle border-dashed flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-sky-900/10 dark:bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 border border-sky-900/20">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-theme-muted block font-serif">Taxa de Hidratação:</span>
                <span className="text-lg font-bold font-serif text-sky-700 dark:text-sky-300">
                  {baseBakersCalc.hydrationPercentage.format()}
                </span>
              </div>
            </div>

            {/* Alternador: Por Farinha Total vs Por Massa Final */}
            <div className="flex items-center bg-theme-card-subtle border border-theme-subtle rounded-sm p-1 self-start sm:self-auto shadow-sm">
              <button
                onClick={() => setAdjustMode('flour')}
                className={`px-3 py-1.5 rounded-sm text-xs font-bold font-serif transition touch-target ${
                  adjustMode === 'flour'
                    ? 'bg-theme-brand text-white shadow-sm'
                    : 'text-theme-muted hover:text-theme-main'
                }`}
              >
                Por Farinha Alvo
              </button>
              <button
                onClick={() => setAdjustMode('dough')}
                className={`px-3 py-1.5 rounded-sm text-xs font-bold font-serif transition touch-target ${
                  adjustMode === 'dough'
                    ? 'bg-theme-brand text-white shadow-sm'
                    : 'text-theme-muted hover:text-theme-main'
                }`}
              >
                Por Peso da Massa
              </button>
            </div>
          </div>
        )}

        {!baseBakersCalc && (
          <div className="bg-theme-card-subtle border border-theme-subtle border-dashed rounded-sm p-4 text-center mt-3 shadow-sm relative z-10">
            <h3 className="text-sm font-bold font-serif text-theme-main">Receita Incompatível</h3>
            <p className="text-xs text-theme-muted mt-1 font-serif">
              Esta receita não possui ingredientes base (como farinha de trigo) necessários para o cálculo da Porcentagem de Padeiro.
            </p>
          </div>
        )}
        
        {/* Controles de Peso */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 relative z-10">
          <div className={`p-3.5 rounded-sm border-2 transition shadow-sm ${adjustMode === 'flour' ? 'bg-theme-wheat/20 border-theme-wheat' : 'bg-theme-card-subtle border-theme-subtle border-dashed'}`}>
            <span className="text-[11px] text-theme-muted font-bold font-serif block mb-1">Farinha Total (Base 100%):</span>
            <div className="flex items-center">
              <input
                type="number"
                disabled={adjustMode !== 'flour'}
                value={Math.round(currentFlourGrams)}
                onChange={(e) => {
                  setAdjustMode('flour');
                  setTargetFlourInput(parseFloat(e.target.value) || 0);
                }}
                className="w-full bg-transparent text-xl font-bold font-serif text-theme-strong focus:outline-none"
              />
              <span className="text-xs text-theme-dim font-bold ml-1 font-serif">g</span>
            </div>
          </div>

          <div className={`p-3.5 rounded-sm border-2 transition shadow-sm ${adjustMode === 'dough' ? 'bg-emerald-900/10 dark:bg-emerald-100 border-emerald-500/50' : 'bg-theme-card-subtle border-theme-subtle border-dashed'}`}>
            <span className="text-[11px] text-theme-muted font-bold font-serif block mb-1">Massa Total Final Calculada:</span>
            <div className="flex items-center">
              <input
                type="number"
                disabled={adjustMode !== 'dough'}
                value={Math.round(currentDoughGrams)}
                onChange={(e) => {
                  setAdjustMode('dough');
                  setTargetDoughInput(parseFloat(e.target.value) || 0);
                }}
                className="w-full bg-transparent text-xl font-bold font-serif text-emerald-800 focus:outline-none"
              />
              <span className="text-xs text-theme-dim font-bold ml-1 font-serif">g</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tabela de Fórmula de Panificação */}
      <section className="bg-theme-card border border-theme-subtle rounded-sm p-4 sm:p-5 space-y-3 shadow-sm notebook-paper">
        <div className="flex items-center justify-between pb-3 border-b-2 border-theme-strong/30 flex-wrap gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold font-serif text-theme-main">Fórmula Recalculada</h2>
            <p className="text-[11px] sm:text-xs text-theme-muted font-serif italic">Proporções fixadas na base de farinha:</p>
          </div>
          {selectedRecipe && (
            <button
              onClick={() => {
                const scaledRecipe = {
                  ...selectedRecipe,
                  ingredients: calculatedIngredients
                };
                onSelectForScale(scaledRecipe);
              }}
              className="bg-theme-brand hover:bg-theme-brand-dark text-white px-3.5 py-1.5 rounded-sm text-xs font-bold font-serif shadow-sm transition touch-target flex items-center border border-theme-brand-dark"
            >
              <ChefHat className="w-3.5 h-3.5 mr-1.5" />
              Modo Cozinha →
            </button>
          )}
        </div>

        <div className="divide-y divide-theme-strong/10">
          {calculatedIngredients.map((ing) => {
            const isFlour = ing.category === 'flour_grain' || ing.name.toLowerCase().includes('farinha') || ing.name.toLowerCase().includes('polvilho');
            return (
              <div key={ing.id} className={`py-2.5 sm:py-3 flex items-center justify-between gap-2 px-2 rounded-sm transition ${isFlour ? 'bg-theme-wheat/20 border-l-4 border-l-theme-wheat' : ''}`}>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs sm:text-sm font-bold font-serif text-theme-main truncate">{ing.name}</span>
                    {isFlour && (
                      <span className="text-[10px] px-2 py-0.5 rounded-sm bg-theme-wheat text-theme-strong font-bold font-serif shrink-0 shadow-sm border border-theme-strong/10">
                        Base 100%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 sm:space-x-6 shrink-0">
                  {/* Baker's % */}
                  <div className="text-right w-14 sm:w-16">
                    <span className="text-xs font-bold font-serif text-theme-muted">
                      {ing.bakersPercentage ? `${ing.bakersPercentage}%` : '-'}
                    </span>
                    <span className="text-[10px] text-theme-dim block leading-none font-serif italic">Baker %</span>
                  </div>

                  {/* Peso em gramas */}
                  <div className="text-right w-16 sm:w-20">
                    <span className="text-sm sm:text-base font-bold font-serif text-theme-main">
                      {ing.amount}
                    </span>
                    <span className="text-xs text-theme-dim ml-1 font-bold font-serif">{ing.unit}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
