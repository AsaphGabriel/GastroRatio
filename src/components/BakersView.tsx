import React, { useState, useMemo } from 'react';
import { Recipe } from '../domain/schemas/recipe.schema.js';
import { CalculateBakersPercentageUseCase } from '../domain/use-cases/CalculateBakersPercentage.js';
import { Croissant, Droplets, Scale } from 'lucide-react';

interface BakersViewProps {
  recipes: Recipe[];
  initialRecipe?: Recipe;
  onSelectForScale: (recipe: Recipe) => void;
}

export const BakersView: React.FC<BakersViewProps> = ({ recipes, initialRecipe, onSelectForScale }) => {
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
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* 1. Seletor de Receita de Panificação */}
      <div className="bg-theme-card border border-theme-subtle rounded-2xl p-4 sm:p-5 card-shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Croissant className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-theme-main flex items-center">
                Módulo Padeiro (Baker's Percentage)
              </h1>
              <p className="text-xs text-theme-muted mt-0.5">
                Invariante: Farinha = 100%. Todos os outros pesos derivam dela.
              </p>
            </div>
          </div>

          <select
            value={selectedRecipeId}
            onChange={(e) => {
              setSelectedRecipeId(e.target.value);
              const found = recipes.find((r) => r.id === e.target.value);
              if (found) {
                const calc = CalculateBakersPercentageUseCase.execute(found.ingredients);
                setTargetFlourInput(calc.totalFlourGrams.toNumber());
                setTargetDoughInput(calc.totalDoughGrams.toNumber());
              }
            }}
            className="bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-amber-500 font-semibold"
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
          <div className="pt-3 border-t border-theme-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-theme-muted block">Taxa de Hidratação:</span>
                <span className="text-lg font-black text-sky-600 dark:text-sky-400 scale-number">
                  {baseBakersCalc.hydrationPercentage.format()}
                </span>
              </div>
            </div>

            {/* Alternador: Por Farinha Total vs Por Massa Final */}
            <div className="flex items-center bg-theme-card-subtle border border-theme-subtle rounded-xl p-1 self-start sm:self-auto">
              <button
                onClick={() => setAdjustMode('flour')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition touch-target ${
                  adjustMode === 'flour'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-theme-muted hover:text-theme-main'
                }`}
              >
                Por Farinha Alvo
              </button>
              <button
                onClick={() => setAdjustMode('dough')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition touch-target ${
                  adjustMode === 'dough'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-theme-muted hover:text-theme-main'
                }`}
              >
                Por Peso da Massa
              </button>
            </div>
          </div>
        )}

        {!baseBakersCalc && (
          <div className="bg-theme-card-subtle border border-theme-subtle rounded-xl p-4 text-center mt-3">
            <h3 className="text-sm font-bold text-theme-main">Receita Incompatível</h3>
            <p className="text-xs text-theme-muted mt-1">
              Esta receita não possui ingredientes base (como farinha de trigo) necessários para o cálculo da Porcentagem de Padeiro.
            </p>
          </div>
        )}
        
        {/* Controles de Peso */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className={`p-3.5 rounded-xl border transition ${adjustMode === 'flour' ? 'bg-amber-500/10 border-amber-500/50' : 'bg-theme-card-subtle border-theme-subtle'}`}>
            <span className="text-[11px] text-theme-muted font-semibold block mb-1">Farinha Total (Base 100%):</span>
            <div className="flex items-center">
              <input
                type="number"
                disabled={adjustMode !== 'flour'}
                value={Math.round(currentFlourGrams)}
                onChange={(e) => {
                  setAdjustMode('flour');
                  setTargetFlourInput(parseFloat(e.target.value) || 0);
                }}
                className="w-full bg-transparent text-xl font-black text-amber-700 dark:text-amber-400 focus:outline-none scale-number"
              />
              <span className="text-xs text-theme-dim font-bold ml-1">g</span>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border transition ${adjustMode === 'dough' ? 'bg-amber-500/10 border-amber-500/50' : 'bg-theme-card-subtle border-theme-subtle'}`}>
            <span className="text-[11px] text-theme-muted font-semibold block mb-1">Massa Total Final Calculada:</span>
            <div className="flex items-center">
              <input
                type="number"
                disabled={adjustMode !== 'dough'}
                value={Math.round(currentDoughGrams)}
                onChange={(e) => {
                  setAdjustMode('dough');
                  setTargetDoughInput(parseFloat(e.target.value) || 0);
                }}
                className="w-full bg-transparent text-xl font-black text-emerald-600 dark:text-emerald-400 focus:outline-none scale-number"
              />
              <span className="text-xs text-theme-dim font-bold ml-1">g</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tabela de Fórmula de Panificação */}
      <section className="bg-theme-card border border-theme-subtle rounded-2xl p-4 sm:p-5 space-y-3 card-shadow">
        <div className="flex items-center justify-between pb-2 border-b border-theme-subtle flex-wrap gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-theme-main">Fórmula de Padeiro Recalculada</h2>
            <p className="text-[11px] sm:text-xs text-theme-muted">Proporções fixadas na base de farinha:</p>
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
              className="bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition touch-target flex items-center"
            >
              <Scale className="w-3.5 h-3.5 mr-1.5" />
              Pesar na Balança →
            </button>
          )}
        </div>

        <div className="divide-y divide-theme-subtle">
          {calculatedIngredients.map((ing) => {
            const isFlour = ing.category === 'flour_grain' || ing.name.toLowerCase().includes('farinha') || ing.name.toLowerCase().includes('polvilho');
            return (
              <div key={ing.id} className="py-2.5 sm:py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs sm:text-sm font-bold text-theme-main truncate">{ing.name}</span>
                    {isFlour && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold shrink-0">
                        Base 100%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 sm:space-x-6 shrink-0">
                  {/* Baker's % */}
                  <div className="text-right w-14 sm:w-16">
                    <span className="text-xs font-black text-amber-700 dark:text-amber-400 scale-number">
                      {ing.bakersPercentage ? `${ing.bakersPercentage}%` : '-'}
                    </span>
                    <span className="text-[10px] text-theme-dim block leading-none">Baker %</span>
                  </div>

                  {/* Peso em gramas */}
                  <div className="text-right w-16 sm:w-20">
                    <span className="text-sm sm:text-base font-black text-theme-main scale-number">
                      {ing.amount}
                    </span>
                    <span className="text-xs text-theme-dim ml-1 font-bold">{ing.unit}</span>
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
