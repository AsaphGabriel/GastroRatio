import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Recipe, RecipeIngredient } from '../domain/schemas/recipe.schema.js';
import { ScaleRecipeUseCase, ScaleOptions } from '../domain/use-cases/ScaleRecipe.js';
import { ConvertUnitsUseCase } from '../domain/use-cases/ConvertUnits.js';
import { useWakeLock } from '../hooks/useWakeLock.js';
import { findChemicalSubstitution } from '../domain/index.js';
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
  Circle,
  FlaskConical,
  Croissant
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
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [activeSubs, setActiveSubs] = useState<Record<string, { multiplier: number, newName: string }>>({});
  
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - endX;
    if (diff > 50) setActiveStepIndex((prev) => Math.min(recipe.steps.length - 1, prev + 1));
    else if (diff < -50) setActiveStepIndex((prev) => Math.max(0, prev - 1));
    touchStartX.current = null;
  };

  const patchedRecipe = useMemo(() => {
    return {
      ...recipe,
      ingredients: recipe.ingredients.map(ing => {
        const sub = activeSubs[ing.id];
        if (sub) {
          return { ...ing, name: sub.newName, amount: ing.amount * sub.multiplier };
        }
        return ing;
      })
    };
  }, [recipe, activeSubs]);

  // Screen Wake Lock API (RNF-06 / ADR-07)
  const { isSupported: wakeLockSupported, isActive: wakeLockActive, requestLock, releaseLock } = useWakeLock();

  useEffect(() => {
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
    return ScaleRecipeUseCase.execute(patchedRecipe, scaleOptions);
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
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* 1. Barra Superior com Retorno e Wake Lock */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBackToPantry}
          className="flex items-center text-xs font-semibold text-theme-muted hover:text-theme-main transition touch-target"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 shrink-0" />
          <span>Voltar para Bancada</span>
        </button>

        {/* Trava de Tela (Wake Lock) */}
        {wakeLockSupported && (
          <button
            onClick={() => (wakeLockActive ? releaseLock() : requestLock())}
            className={`flex items-center text-xs px-3 py-1.5 rounded-full border transition touch-target ${
              wakeLockActive
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300 font-bold'
                : 'bg-theme-card border-theme-subtle text-theme-muted hover:text-theme-main'
            }`}
          >
            {wakeLockActive ? (
              <>
                <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>Tela Sempre Ativa</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span>Ativar Tela na Bancada</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 2. Cabeçalho da Receita com Controles de Escala */}
      <div className="bg-theme-card border border-theme-subtle rounded-2xl p-4 sm:p-5 card-shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-theme-brand-subtle text-theme-brand font-bold uppercase tracking-wider">
              Modo Balança de Precisão
            </span>
            <h1 className="text-lg sm:text-2xl font-black text-theme-main mt-1.5 leading-tight">
              {recipe.title}
            </h1>
            <p className="text-xs text-theme-muted mt-1 leading-relaxed">
              {recipe.description}
            </p>
          </div>

          {recipe.isBakingRecipe && onOpenInBakers && (
            <button
              onClick={() => onOpenInBakers(recipe)}
              className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition touch-target flex items-center shrink-0 self-start"
            >
              <Croissant className="w-4 h-4 mr-1.5" />
              <span>Modo Padeiro →</span>
            </button>
          )}
        </div>

        {/* Painel de Redimensionamento Proporcional */}
        <div className="pt-3 border-t border-theme-subtle space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Seletor de Porções */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-theme-muted font-medium shrink-0">Rendimento:</span>
              <div className="flex items-center bg-theme-card-subtle border border-theme-subtle rounded-xl p-1">
                <button
                  onClick={() => handleIncrementPortions(-1)}
                  className="w-9 h-9 rounded-lg bg-theme-card hover:bg-theme-card-hover border border-theme-subtle flex items-center justify-center text-theme-main transition touch-target"
                  title="Diminuir porção"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="px-3 text-center min-w-[70px]">
                  <span className="text-base font-black text-theme-main scale-number">
                    {scaledResult.recipe.baseYield}
                  </span>
                  <span className="text-[10px] text-theme-dim block leading-none">{recipe.yieldUnit}</span>
                </div>
                <button
                  onClick={() => handleIncrementPortions(1)}
                  className="w-9 h-9 rounded-lg bg-theme-card hover:bg-theme-card-hover border border-theme-subtle flex items-center justify-center text-theme-main transition touch-target"
                  title="Aumentar porção"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Atalhos de Fator Multiplicador */}
            <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[0.5, 1, 1.5, 2, 3].map((f) => (
                <button
                  key={f}
                  onClick={() => handleQuickMultiplier(f)}
                  className={`text-xs px-3 py-2 rounded-xl font-bold transition touch-target shrink-0 ${
                    scaleMode === 'multiplier' && Math.abs(currentMultiplier - f) < 0.05
                      ? 'bg-theme-brand text-white shadow-sm'
                      : 'bg-theme-card-subtle border border-theme-subtle text-theme-muted hover:text-theme-main'
                  }`}
                >
                  {f}x
                </button>
              ))}
            </div>
          </div>

          {/* Fixação por Ingrediente Âncora */}
          <div className="bg-theme-card-subtle border border-theme-subtle rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <Anchor className="w-4 h-4 text-theme-brand shrink-0" />
              <span className="text-xs font-semibold text-theme-main">Fixar por Ingrediente Âncora:</span>
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
                className="bg-theme-card border border-theme-subtle rounded-xl px-2.5 py-1.5 text-xs text-theme-main focus:outline-none focus:border-theme-brand"
              >
                {recipe.ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center bg-theme-card border border-theme-subtle rounded-xl px-2.5 py-1">
                <input
                  type="number"
                  value={anchorGramsInput}
                  onChange={(e) => {
                    setScaleMode('anchor');
                    setAnchorGramsInput(parseFloat(e.target.value) || 0);
                  }}
                  className="w-16 bg-transparent text-xs text-theme-main text-right focus:outline-none scale-number font-black"
                />
                <span className="text-xs text-theme-dim font-bold ml-1">g</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tabela de Pesagem na Balança Digital */}
      <section className="bg-theme-card border border-theme-subtle rounded-2xl p-4 sm:p-5 space-y-3 card-shadow">
        <div className="flex items-center justify-between pb-2 border-b border-theme-subtle">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-theme-main">Pesos na Balança Digital</h2>
            <p className="text-[11px] sm:text-xs text-theme-muted">Zere a balança (Tara) a cada ingrediente pesado:</p>
          </div>
          <span className="text-xs text-theme-brand font-mono font-bold bg-theme-brand-subtle px-2 py-0.5 rounded-lg">
            Fator: {scaledResult.scalingFactor}x
          </span>
        </div>

        <div className="space-y-2">
          {scaledResult.scaledIngredients.map((ing: RecipeIngredient) => {
            const isDone = !!checkedIngredients[ing.id];
            const sub = findChemicalSubstitution(ing.name);
            const isSubOpen = expandedSubId === ing.id;

            return (
              <div
                key={ing.id}
                className={`p-3 sm:p-3.5 rounded-xl border transition ${
                  isDone
                    ? 'bg-theme-card-subtle border-theme-subtle opacity-60'
                    : 'bg-theme-card border-theme-subtle hover:border-theme-strong'
                }`}
              >
                <div
                  onClick={() => handleToggleChecked(ing.id)}
                  className="flex items-center justify-between cursor-pointer select-none touch-target gap-2"
                >
                  <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                    <div className="shrink-0 text-theme-muted">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-theme-dim" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className={`text-xs sm:text-sm font-bold text-theme-main truncate ${isDone ? 'line-through text-theme-dim' : ''}`}>
                          {ing.name}
                        </span>
                        {ing.isStaple && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-theme-card-subtle text-theme-dim border border-theme-subtle">
                            Despensa
                          </span>
                        )}
                        {sub && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedSubId(isSubOpen ? null : ing.id);
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold hover:bg-amber-500/25 flex items-center transition"
                            title="Ver substituição físico-química"
                          >
                            <FlaskConical className="w-3 h-3 mr-1 text-amber-700 dark:text-amber-400" />
                            Substituição
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-base sm:text-xl font-black text-theme-brand scale-number ${isDone ? 'line-through text-theme-dim' : ''}`}>
                      {ing.amount}
                    </span>
                    <span className="text-xs text-theme-dim ml-1 font-bold">{ing.unit}</span>
                  </div>
                </div>

                {/* Bloco de Substituição Físico-Química Expandido */}
                {sub && isSubOpen && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20 bg-amber-500/5 p-3 rounded-xl text-xs space-y-1.5 text-theme-main">
                    <div className="flex items-center text-amber-900 dark:text-amber-200 font-bold">
                      <FlaskConical className="w-3.5 h-3.5 mr-1.5 text-amber-700 dark:text-amber-400" />
                      <span>Substituto: {sub.substitute}</span>
                    </div>
                    <p className="text-[11px] text-theme-muted">
                      <strong className="text-theme-main">Proporção:</strong> {sub.ratio}
                    </p>
                    <p className="text-[11px] text-theme-muted">
                      <strong className="text-theme-main">Função Química:</strong> {sub.physicalFunction}
                    </p>
                    <p className="text-[11px] text-theme-muted leading-relaxed">
                      {sub.explanation}
                    </p>
                    {sub.multiplier && sub.overrideName && !activeSubs[ing.id] && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSubs(prev => ({ ...prev, [ing.id]: { multiplier: sub.multiplier!, newName: sub.overrideName! } }));
                          setExpandedSubId(null);
                        }}
                        className="mt-2 w-full bg-amber-700 hover:bg-amber-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition touch-target flex items-center justify-center"
                      >
                        Aplicar Substituição
                      </button>
                    )}
                    {activeSubs[ing.id] && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSubs(prev => {
                            const clone = {...prev};
                            delete clone[ing.id];
                            return clone;
                          });
                        }}
                        className="mt-2 w-full bg-theme-card border border-theme-subtle text-theme-main px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition touch-target flex items-center justify-center"
                      >
                        Reverter Original
                      </button>
                    )}
                    {sub.waterAdjustmentAlert && (
                      <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-[11px] mt-1 font-mono font-medium">
                        {sub.waterAdjustmentAlert}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Modo de Preparo Fatiado em Etapas (Lei de Miller) */}
      <section className="bg-theme-card border border-theme-subtle rounded-2xl p-4 sm:p-5 space-y-3 card-shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-theme-main">
            Modo de Preparo — Etapa {activeStepIndex + 1} de {recipe.steps.length}
          </h2>
          <div className="flex space-x-1">
            {recipe.steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full transition ${
                  i === activeStepIndex ? 'bg-theme-brand' : 'bg-theme-card-subtle border border-theme-subtle'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Cartão da Etapa Ativa */}
        <div 
          onTouchStart={handleTouchStart} 
          onTouchEnd={handleTouchEnd}
          className="bg-theme-card-subtle border border-theme-subtle rounded-xl p-4 sm:p-5 min-h-[90px] flex items-center select-none"
        >
          <p className="text-sm sm:text-base text-theme-main font-medium leading-relaxed">
            {recipe.steps[activeStepIndex]}
          </p>
        </div>

        {/* Navegação Entre Etapas */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={activeStepIndex === 0}
            className="flex items-center px-3.5 py-2 rounded-xl bg-theme-card border border-theme-subtle hover:bg-theme-card-hover disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-theme-main transition touch-target"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </button>

          <button
            onClick={() => setActiveStepIndex((prev) => Math.min(recipe.steps.length - 1, prev + 1))}
            disabled={activeStepIndex === recipe.steps.length - 1}
            className="flex items-center px-4 py-2 rounded-xl bg-theme-brand hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-white shadow-sm transition touch-target"
          >
            Próxima
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </section>
    </div>
  );
};
