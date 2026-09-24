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
    return CalculateBakersPercentageUseCase.execute(selectedRecipe.ingredients);
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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Seletor de Receita de Panificação */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Croissant className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center">
                Módulo Padeiro (Baker's Percentage)
              </h1>
              <p className="text-xs text-slate-400">
                Invariante matemática: Farinha é rigorosamente 100%. Todos os outros pesos derivam dela.
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
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            {bakingRecipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>

        {/* Indicador de Hidratação */}
        {baseBakersCalc && (
          <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Taxa de Hidratação:</span>
                <span className="text-lg font-black text-sky-400 scale-number">
                  {baseBakersCalc.hydrationPercentage.format()}
                </span>
              </div>
            </div>

            {/* Alternador de Ajuste: Por Farinha Alvo vs Por Massa Final */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1">
              <button
                onClick={() => setAdjustMode('flour')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition touch-target ${
                  adjustMode === 'flour'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ajustar Farinha Total
              </button>
              <button
                onClick={() => setAdjustMode('dough')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition touch-target ${
                  adjustMode === 'dough'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ajustar Peso da Massa
              </button>
            </div>
          </div>
        )}

        {/* Controles de Peso */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={`p-3 rounded-xl border transition ${adjustMode === 'flour' ? 'bg-amber-950/20 border-amber-500/50' : 'bg-slate-900/40 border-slate-800'}`}>
            <span className="text-[11px] text-slate-400 block mb-1">Farinha Total (Base 100%):</span>
            <div className="flex items-center">
              <input
                type="number"
                disabled={adjustMode !== 'flour'}
                value={Math.round(currentFlourGrams)}
                onChange={(e) => {
                  setAdjustMode('flour');
                  setTargetFlourInput(parseFloat(e.target.value) || 0);
                }}
                className="w-full bg-transparent text-xl font-black text-amber-400 focus:outline-none scale-number"
              />
              <span className="text-xs text-slate-400 font-bold ml-1">g</span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border transition ${adjustMode === 'dough' ? 'bg-amber-950/20 border-amber-500/50' : 'bg-slate-900/40 border-slate-800'}`}>
            <span className="text-[11px] text-slate-400 block mb-1">Massa Total Final Calculada:</span>
            <div className="flex items-center">
              <input
                type="number"
                disabled={adjustMode !== 'dough'}
                value={Math.round(currentDoughGrams)}
                onChange={(e) => {
                  setAdjustMode('dough');
                  setTargetDoughInput(parseFloat(e.target.value) || 0);
                }}
                className="w-full bg-transparent text-xl font-black text-emerald-400 focus:outline-none scale-number"
              />
              <span className="text-xs text-slate-400 font-bold ml-1">g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Fórmula de Panificação */}
      <section className="bg-slate-800/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
          <div>
            <h2 className="text-base font-bold text-white">Fórmula de Padeiro Recalculada</h2>
            <p className="text-xs text-slate-400">Proporções fixadas na base da farinha:</p>
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
              className="bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow transition touch-target flex items-center"
            >
              <Scale className="w-3.5 h-3.5 mr-1.5" />
              Pesar na Balança →
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-800">
          {calculatedIngredients.map((ing) => {
            const isFlour = ing.category === 'flour_grain' || ing.name.toLowerCase().includes('farinha') || ing.name.toLowerCase().includes('polvilho');
            return (
              <div key={ing.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-white">{ing.name}</span>
                    {isFlour && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                        Base 100%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  {/* Baker's % */}
                  <div className="text-right w-16">
                    <span className="text-xs font-bold text-amber-400 scale-number">
                      {ing.bakersPercentage ? `${ing.bakersPercentage}%` : '-'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Baker %</span>
                  </div>

                  {/* Peso em gramas */}
                  <div className="text-right w-20">
                    <span className="text-base font-black text-white scale-number">
                      {ing.amount}
                    </span>
                    <span className="text-xs text-slate-400 ml-1 font-medium">{ing.unit}</span>
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
