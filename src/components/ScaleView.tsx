import React, { useState, useMemo, useEffect } from 'react';
import { Recipe, RecipeIngredient } from '../domain/schemas/recipe.schema.js';
import { ScaleRecipeUseCase, ScaleOptions } from '../domain/use-cases/ScaleRecipe.js';
import { ConvertUnitsUseCase } from '../domain/use-cases/ConvertUnits.js';
import { useWakeLock } from '../hooks/useWakeLock.js';
import {
  Lock,
  Unlock,
  Minus,
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Anchor,
  CheckCircle2,
  Circle
} from 'lucide-react';

interface ScaleViewProps {
  recipe: Recipe;
  onBackToPantry: () => void;
  onOpenInBakers?: (recipe: Recipe) => void;
}

export const ScaleView: React.FC<ScaleViewProps> = ({ recipe, onBackToPantry, onOpenInBakers }) => {
  const [scaleMode, setScaleMode] = useState<'multiplier' | 'anchor'>('multiplier');
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [anchorId, setAnchorId] = useState<string>(recipe.ingredients[0]?.id || '');
  const [anchorGramsInput, setAnchorGramsInput] = useState<number>(() => {
    const first = recipe.ingredients[0];
    if (!first) return 100;
    return ConvertUnitsUseCase.execute(first.name, first.amount, first.unit).grams.toNumber();
  });

  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  // Screen Wake Lock API (RNF-06 / ADR-07)
  const { isSupported: wakeLockSupported, isActive: wakeLockActive, requestLock, releaseLock } = useWakeLock();

  useEffect(() => {
    // Solicita ativação do Wake Lock ao entrar na tela da balança
    requestLock();
    return () => {
      releaseLock();
    };
  }, [requestLock, releaseLock]);

  // Recálculo determinístico via ScaleRecipeUseCase
  const scaleOptions = useMemo<ScaleOptions>(() => {
    if (scaleMode === 'anchor' && anchorId) {
      return {
        type: 'anchor',
        anchorIngredientId: anchorId,
        targetAmountGrams: anchorGramsInput || 1
      };
    }
    return {
      type: 'multiplier',
      factor: currentMultiplier
    };
  }, [scaleMode, currentMultiplier, anchorId, anchorGramsInput]);

  const scaledResult = useMemo(() => {
    return ScaleRecipeUseCase.execute(recipe, scaleOptions);
  }, [recipe, scaleOptions]);

  const handleToggleChecked = (id: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuickMultiplier = (factor: number) => {
    setScaleMode('multiplier');
    setCurrentMultiplier(factor);
  };

  const handleIncrementPortions = (delta: number) => {
    setScaleMode('multiplier');
    const newPortions = Math.max(0.5, scaledResult.recipe.baseYield + delta);
    setCurrentMultiplier(newPortions / recipe.baseYield);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar com Retorno e Wake Lock */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToPantry}
          className="flex items-center text-xs text-slate-400 hover:text-white transition touch-target"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Voltar para Bancada</span>
        </button>

        {/* Status da Trava de Tela (Wake Lock) */}
        {wakeLockSupported && (
          <button
            onClick={() => (wakeLockActive ? releaseLock() : requestLock())}
            className={`flex items-center text-xs px-3 py-1.5 rounded-full border transition touch-target ${
              wakeLockActive
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {wakeLockActive ? (
              <>
                <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                <span>Tela Sempre Ativa</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 mr-1.5" />
                <span>Ativar Tela na Bancada</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Cabeçalho da Receita */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-semibold uppercase tracking-wider">
              Modo Balança de Precisão
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1.5">{recipe.title}</h1>
            <p className="text-xs text-slate-400 mt-1">{recipe.description}</p>
          </div>

          {recipe.isBakingRecipe && onOpenInBakers && (
            <button
              onClick={() => onOpenInBakers(recipe)}
              className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl text-xs font-semibold transition touch-target"
            >
              Abrir no Modo Padeiro →
            </button>
          )}
        </div>

        {/* Controles de Redimensionamento Dual (Porções vs Ingrediente Âncora) */}
        <div className="mt-5 pt-4 border-t border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Seletor de Porções */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Rendimento:</span>
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1">
                <button
                  onClick={() => handleIncrementPortions(-1)}
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition touch-target"
                  title="Diminuir"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="px-4 text-center">
                  <span className="text-base font-bold text-white scale-number">
                    {scaledResult.recipe.baseYield}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{recipe.yieldUnit}</span>
                </div>
                <button
                  onClick={() => handleIncrementPortions(1)}
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition touch-target"
                  title="Aumentar"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Atalhos Rápidos de Multiplicação */}
            <div className="flex items-center space-x-1.5">
              {[0.5, 1, 1.5, 2, 3].map((f) => (
                <button
                  key={f}
                  onClick={() => handleQuickMultiplier(f)}
                  className={`text-xs px-3 py-2 rounded-xl font-bold transition touch-target ${
                    scaleMode === 'multiplier' && Math.abs(currentMultiplier - f) < 0.05
                      ? 'bg-brand-600 text-white shadow'
                      : 'bg-slate-900 border border-slate-700/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {f}x
                </button>
              ))}
            </div>
          </div>

          {/* Toggle e Configuração de Ingrediente Âncora */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Anchor className="w-4 h-4 text-brand-400" />
              <span className="text-xs text-slate-300 font-medium">Fixar por Ingrediente Âncora:</span>
            </div>

            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <select
                value={anchorId}
                onChange={(e) => {
                  setAnchorId(e.target.value);
                  setScaleMode('anchor');
                  const found = recipe.ingredients.find((i) => i.id === e.target.value);
                  if (found) {
                    const conv = ConvertUnitsUseCase.execute(found.name, found.amount, found.unit);
                    setAnchorGramsInput(conv.grams.toNumber());
                  }
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                {recipe.ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                <input
                  type="number"
                  value={anchorGramsInput}
                  onChange={(e) => {
                    setScaleMode('anchor');
                    setAnchorGramsInput(parseFloat(e.target.value) || 0);
                  }}
                  className="w-16 bg-transparent text-xs text-white text-right focus:outline-none scale-number font-bold"
                />
                <span className="text-xs text-slate-400 ml-1">g</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Pesagem com Tipografia Monoespaçada Grande */}
      <section className="bg-slate-800/50 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
          <div>
            <h2 className="text-base font-bold text-white">Pesos na Balança Digital</h2>
            <p className="text-xs text-slate-400">Zere a balança (Tara) a cada ingrediente pesado:</p>
          </div>
          <span className="text-xs text-brand-400 font-mono font-semibold">
            Fator: {scaledResult.scalingFactor}x
          </span>
        </div>

        <div className="space-y-2">
          {scaledResult.scaledIngredients.map((ing: RecipeIngredient) => {
            const isDone = !!checkedIngredients[ing.id];
            return (
              <div
                key={ing.id}
                onClick={() => handleToggleChecked(ing.id)}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer select-none touch-target ${
                  isDone
                    ? 'bg-slate-900/40 border-slate-800 text-slate-500 line-through'
                    : 'bg-slate-800/80 border-slate-700/70 text-slate-100 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="shrink-0 text-slate-400">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-semibold">{ing.name}</span>
                    {ing.isStaple && (
                      <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                        Despensa
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-brand-400 scale-number">
                    {ing.amount}
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5 font-medium">{ing.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modo de Preparo Fatiado em Etapas (Lei de Miller) */}
      <section className="bg-slate-800/70 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            Modo de Preparo — Etapa {activeStepIndex + 1} de {recipe.steps.length}
          </h2>
          <div className="flex space-x-1">
            {recipe.steps.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  i === activeStepIndex ? 'bg-brand-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Cartão da Etapa Ativa (Fonte grande e clara) */}
        <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-5 min-h-[110px] flex items-center">
          <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
            {recipe.steps[activeStepIndex]}
          </p>
        </div>

        {/* Navegação Entre Etapas */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={activeStepIndex === 0}
            className="flex items-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-white transition touch-target"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Etapa Anterior
          </button>

          <button
            onClick={() => setActiveStepIndex((prev) => Math.min(recipe.steps.length - 1, prev + 1))}
            disabled={activeStepIndex === recipe.steps.length - 1}
            className="flex items-center px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-white shadow transition touch-target"
          >
            Próxima Etapa
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </section>
    </div>
  );
};
