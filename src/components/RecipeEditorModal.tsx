import React, { useState, useEffect } from 'react';
import { Recipe, RecipeIngredient, RecipeSchema, IngredientCategory, RecipeMode } from '../domain/schemas/recipe.schema.js';
import { GeminiSousChefAdapter } from '../domain/use-cases/AiProviderAdapter.js';
import { X, Save, Plus, Trash2, GripVertical, AlertCircle, Sparkles, Check, UtensilsCrossed, FlaskConical, ChevronDown, Wheat, Droplets, Egg, Cherry, Snowflake, Apple, Milk, Flame } from 'lucide-react';
import { generateId } from '../utils/id.js';
import { SegmentedControl } from './SegmentedControl.js';
import { WheatDivider } from './WheatDivider.js';
import { VintageCartoucheFrame } from './VintageCartoucheFrame.js';

interface RecipeEditorModalProps {
  isOpen: boolean;
  recipe: Recipe | null;
  onClose: () => void;
  onSave: (recipe: Recipe) => Promise<void>;
}

const CategorySelect = ({ value, onChange, isAdvanced }: { value: string, onChange: (val: string) => void, isAdvanced: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!isAdvanced) return null;

  const categories = [
    { id: 'flour_grain', label: 'Farinha / Grão', icon: Wheat },
    { id: 'liquid', label: 'Líquido', icon: Droplets },
    { id: 'fat_oil', label: 'Gordura / Óleo', icon: Egg },
    { id: 'sugar_sweetener', label: 'Açúcar / Doce', icon: Cherry },
    { id: 'leavening', label: 'Fermento', icon: Snowflake },
    { id: 'protein', label: 'Proteína', icon: Egg },
    { id: 'vegetable', label: 'Vegetal', icon: Apple },
    { id: 'dairy', label: 'Laticínio', icon: Milk },
    { id: 'staple_seasoning', label: 'Tempero / Sal', icon: Flame },
  ];

  const currentCategory = categories.find(c => c.id === value) || categories[0];
  const Icon = currentCategory.icon;

  return (
    <div className="relative w-full sm:w-44">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="w-full bg-theme-card border border-amber-500/30 rounded-xl px-2.5 py-2 text-xs text-theme-main focus:outline-none focus:border-amber-500 cursor-pointer flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-amber-600" />
          <span className="truncate">{currentCategory.label}</span>
        </div>
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-full bg-theme-card border border-theme-subtle rounded-xl shadow-xl overflow-hidden py-1 notebook-paper max-h-48 overflow-y-auto">
          {categories.map(c => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(c.id); setIsOpen(false); }}
              className={`w-full text-left px-2.5 py-1.5 text-xs flex items-center gap-2 hover:bg-theme-card-hover transition ${value === c.id ? 'bg-amber-500/10 text-amber-800' : 'text-theme-main'}`}
            >
              <c.icon className={`w-3.5 h-3.5 ${value === c.id ? 'text-amber-600' : 'text-theme-dim'}`} />
              <span className="truncate">{c.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const RecipeEditorModal: React.FC<RecipeEditorModalProps> = ({ isOpen, recipe, onClose, onSave }) => {
  const [draft, setDraft] = useState<Recipe | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (recipe) {
        // Cópia profunda para evitar mutação indevida antes de salvar
        setDraft({
          ...JSON.parse(JSON.stringify(recipe)),
          mode: recipe.mode || (recipe.isBakingRecipe ? 'advanced' : 'simple')
        });
      } else {
        // Nova receita em branco limpa
        setDraft({
          id: generateId('rec'),
          title: '',
          description: '',
          mode: 'simple',
          baseYield: 4,
          yieldUnit: 'porções',
          prepTimeMinutes: 15,
          cookTimeMinutes: 30,
          isBakingRecipe: false,
          ingredients: [
            {
              id: generateId('ing'),
              name: '',
              amount: 100,
              unit: 'g',
              category: 'vegetable',
              isStaple: false
            }
          ],
          steps: [''],
          tags: []
        });
      }
      setErrorMsg(null);
      setAiSuccessMsg(null);
    } else {
      setDraft(null);
    }
  }, [recipe, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
      document.documentElement.classList.add('overflow-hidden');
      return () => {
        document.body.classList.remove('overflow-hidden');
        document.documentElement.classList.remove('overflow-hidden');
      };
    }
  }, [isOpen]);

  if (!isOpen || !draft) return null;

  const isAdvanced = draft.mode === 'advanced';

  const handleSave = async () => {
    try {
      setErrorMsg(null);
      
      // Sanitização básica antes da validação
      const cleanedDraft: Recipe = {
        ...draft,
        title: draft.title.trim(),
        description: draft.description?.trim() || undefined,
        ingredients: draft.ingredients.map(ing => {
          const trimmedName = ing.name.trim();
          // Se for modo simples, preenche categoria e staple com heurística automática
          const auto = GeminiSousChefAdapter.detectCategoryLocally(trimmedName);
          return {
            ...ing,
            name: trimmedName,
            category: isAdvanced ? ing.category : auto.category,
            isStaple: isAdvanced ? ing.isStaple : auto.isStaple
          };
        }).filter(ing => ing.name.length > 0),
        steps: draft.steps.map(s => s.trim()).filter(s => s.length > 0)
      };

      if (!cleanedDraft.title) {
        setErrorMsg('Informe o nome da receita.');
        return;
      }

      if (cleanedDraft.ingredients.length === 0) {
        setErrorMsg('Adicione pelo menos 1 ingrediente com nome.');
        return;
      }

      if (cleanedDraft.steps.length === 0) {
        setErrorMsg('Adicione pelo menos 1 etapa de preparo.');
        return;
      }

      // Validação estrita via Zod (Garante a integridade ACID)
      RecipeSchema.parse(cleanedDraft);
      await onSave(cleanedDraft);
      onClose();
    } catch (e: any) {
      setErrorMsg(`Erro de validação: ${e.message ? e.message.substring(0, 140) : 'Verifique os campos.'}`);
    }
  };

  const updateField = <K extends keyof Recipe>(field: K, value: Recipe[K]) => {
    setDraft(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleToggleMode = (newMode: RecipeMode) => {
    setDraft(prev => {
      if (!prev) return null;
      // Ao alternar para avançado, roda heurística local para pré-classificar ingredientes
      const updatedIngredients = prev.ingredients.map(ing => {
        if (!ing.category || ing.category === 'vegetable') {
          const detected = GeminiSousChefAdapter.detectCategoryLocally(ing.name);
          return { ...ing, category: detected.category, isStaple: detected.isStaple };
        }
        return ing;
      });

      return {
        ...prev,
        mode: newMode,
        isBakingRecipe: newMode === 'advanced' ? prev.isBakingRecipe : false,
        ingredients: updatedIngredients
      };
    });
  };

  const addIngredient = () => {
    const newIng: RecipeIngredient = {
      id: generateId('ing'),
      name: '',
      amount: 100,
      unit: 'g',
      category: 'vegetable',
      isStaple: false
    };
    setDraft(prev => prev ? { ...prev, ingredients: [...prev.ingredients, newIng] } : null);
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    setDraft(prev => {
      if (!prev) return null;
      const newIngs = [...prev.ingredients];
      newIngs[index] = { ...newIngs[index], [field]: value };

      // Se mudou o nome e estamos no modo simples, autodetecta internamente
      if (field === 'name' && prev.mode === 'simple') {
        const detected = GeminiSousChefAdapter.detectCategoryLocally(value);
        newIngs[index].category = detected.category;
        newIngs[index].isStaple = detected.isStaple;
      }

      return { ...prev, ingredients: newIngs };
    });
  };

  const removeIngredient = (index: number) => {
    setDraft(prev => {
      if (!prev) return null;
      const newIngs = [...prev.ingredients];
      newIngs.splice(index, 1);
      return { ...prev, ingredients: newIngs };
    });
  };

  const addStep = () => {
    setDraft(prev => prev ? { ...prev, steps: [...prev.steps, ''] } : null);
  };

  const updateStep = (index: number, value: string) => {
    setDraft(prev => {
      if (!prev) return null;
      const newSteps = [...prev.steps];
      newSteps[index] = value;
      return { ...prev, steps: newSteps };
    });
  };

  const removeStep = (index: number) => {
    setDraft(prev => {
      if (!prev) return null;
      const newSteps = [...prev.steps];
      newSteps.splice(index, 1);
      return { ...prev, steps: newSteps };
    });
  };

  // Enriquecimento consultivo via IA (opcional)
  const handleEnrichWithAi = async () => {
    if (!draft || draft.ingredients.length === 0) return;
    setIsAiLoading(true);
    setErrorMsg(null);
    setAiSuccessMsg(null);

    try {
      const enrichment = await GeminiSousChefAdapter.enrichRecipeWithAi(draft.ingredients);
      if (enrichment && enrichment.length > 0) {
        setDraft(prev => {
          if (!prev) return null;
          let anyBaking = false;
          const updatedIngs = prev.ingredients.map(ing => {
            const found = enrichment.find(e => e.id === ing.id);
            if (found) {
              if (found.isBaking) anyBaking = true;
              return {
                ...ing,
                category: (found.category as IngredientCategory) || ing.category,
                isStaple: typeof found.isStaple === 'boolean' ? found.isStaple : ing.isStaple
              };
            }
            return ing;
          });
          return {
            ...prev,
            isBakingRecipe: prev.isBakingRecipe || anyBaking,
            ingredients: updatedIngs
          };
        });
        setAiSuccessMsg('Ingredientes classificados com sucesso pela IA!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao consultar a IA. Verifique a chave de API nos Ajustes.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-theme-card border border-theme-strong rounded-lg w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden notebook-paper notebook-margin relative">
        {/* Fita xadrez no topo simulando caderno encadernado */}
        <div className="vichy-ribbon-thick absolute top-0 left-0 right-0 z-20" />
        
        {/* Header com Seletor de Modo */}
        <div className="px-4 sm:px-6 pl-8 sm:pl-10 py-3.5 sm:py-5 flex items-center justify-between relative z-10 mt-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-theme-main flex items-center gap-2">
              <span>{recipe ? 'Editar Receita' : 'Nova Receita'}</span>
              <WheatDivider className="w-12 h-3.5 text-theme-wheat opacity-70" />
            </h2>
            <p className="text-[11px] sm:text-xs text-theme-muted font-serif italic mt-1">
              {isAdvanced ? 'Modo Técnico: proporções, panificação e química culinária.' : 'Modo Prático: adicione sem complicação.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-sm bg-theme-app hover:bg-theme-card-subtle border border-theme-subtle flex items-center justify-center text-theme-muted hover:text-theme-main transition shrink-0 shadow-sm"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Seletor Segmentado de Modos envolto no Cartouche Artesanal */}
        <div className="mx-4 sm:mx-8 my-4 relative z-10 flex justify-center">
          <VintageCartoucheFrame className="w-full sm:w-auto">
            <SegmentedControl<RecipeMode>
              value={draft.mode || 'simple'}
              onChange={(newMode) => handleToggleMode(newMode)}
              options={[
                {
                  id: 'simple',
                  label: 'Modo Prático',
                  sublabel: '(Dia a dia)',
                  icon: <UtensilsCrossed className="w-3.5 h-3.5 text-theme-wheat" />
                },
                {
                  id: 'advanced',
                  label: 'Modo Avançado',
                  sublabel: '(Padeiro/Química)',
                  icon: <FlaskConical className="w-3.5 h-3.5 text-theme-wheat" />
                }
              ]}
            />

            {/* Botão de Enriquecimento por IA no Modo Avançado */}
            {isAdvanced && (
              <button
                type="button"
                onClick={handleEnrichWithAi}
                disabled={isAiLoading || draft.ingredients.length === 0}
                className="text-xs px-3 py-1.5 rounded-xl bg-theme-card hover:bg-theme-card-hover text-theme-brand border border-theme-subtle font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 touch-target"
                title="Classificar categorias físico-químicas automaticamente com a IA"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                <span>{isAiLoading ? 'Classificando...' : 'Auto-Classificar'}</span>
              </button>
            )}
          </VintageCartoucheFrame>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 pl-8 sm:pl-10 overflow-y-auto space-y-6 flex-1 relative z-10">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {aiSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center">
              <Check className="w-4 h-4 mr-2 shrink-0" />
              <span>{aiSuccessMsg}</span>
            </div>
          )}

          {/* Dados Gerais */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-theme-main uppercase tracking-wider">Identificação</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-theme-muted mb-1 font-bold">Título da Receita *</label>
                <input
                  type="text"
                  placeholder="Ex: Pão de Queijo Mineiro, Molho Bolonhesa..."
                  value={draft.title}
                  onChange={e => updateField('title', e.target.value)}
                  className="w-full bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2 text-sm text-theme-main focus:outline-none focus:border-theme-brand transition"
                />
              </div>

              <div>
                <label className="block text-[10px] text-theme-muted mb-1 font-bold">Descrição ou Observações</label>
                <textarea
                  value={draft.description || ''}
                  onChange={e => updateField('description', e.target.value)}
                  rows={2}
                  placeholder="Dicas de textura, ponto do fogo, forno..."
                  className="w-full bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-brand transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] text-theme-muted mb-1 font-bold">Rendimento Base</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.1"
                    step="0.5"
                    value={draft.baseYield}
                    onChange={e => updateField('baseYield', parseFloat(e.target.value) || 1)}
                    className="w-full bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2 text-sm text-theme-main focus:outline-none focus:border-theme-brand transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-theme-muted mb-1 font-bold">Unidade Rendimento</label>
                  <input
                    type="text"
                    value={draft.yieldUnit}
                    onChange={e => updateField('yieldUnit', e.target.value)}
                    className="w-full bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2 text-sm text-theme-main focus:outline-none focus:border-theme-brand transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-theme-muted mb-1 font-bold">Preparo (min)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={draft.prepTimeMinutes}
                    onChange={e => updateField('prepTimeMinutes', parseInt(e.target.value) || 0)}
                    className="w-full bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2 text-sm text-theme-main focus:outline-none focus:border-theme-brand transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-theme-muted mb-1 font-bold">Cozimento (min)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={draft.cookTimeMinutes}
                    onChange={e => updateField('cookTimeMinutes', parseInt(e.target.value) || 0)}
                    className="w-full bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2 text-sm text-theme-main focus:outline-none focus:border-theme-brand transition"
                  />
                </div>
              </div>

              {/* Opções exclusivas do Modo Avançado */}
              {isAdvanced && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isBaking"
                      checked={draft.isBakingRecipe}
                      onChange={e => updateField('isBakingRecipe', e.target.checked)}
                      className="rounded border-amber-500/40 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <label htmlFor="isBaking" className="text-xs text-theme-main font-semibold cursor-pointer">
                      Receita de Panificação (Ativa Baker's Percentage & Hidratação)
                    </label>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Ingredientes */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-theme-main uppercase tracking-wider">Ingredientes</h3>
                <p className="text-[10px] text-theme-muted">
                  {isAdvanced
                    ? 'Informe a categoria para cálculo de hidratação e substituições.'
                    : 'Apenas nome, quantidade e unidade.'}
                </p>
              </div>
              <button
                type="button"
                onClick={addIngredient}
                className="text-xs flex items-center px-2.5 py-1.5 rounded-xl bg-theme-brand/10 text-theme-brand font-bold hover:bg-theme-brand/20 transition touch-target"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
              </button>
            </div>

            <div className="space-y-2">
              {draft.ingredients.map((ing, idx) => (
                <div
                  key={ing.id}
                  className="flex flex-col sm:flex-row gap-2 bg-theme-card-subtle p-2.5 rounded-2xl border border-theme-subtle items-center"
                >
                  {/* Nome do ingrediente */}
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      placeholder="Nome do ingrediente (ex: Farinha de trigo)"
                      value={ing.name}
                      onChange={e => updateIngredient(idx, 'name', e.target.value)}
                      className="w-full bg-theme-card border border-theme-subtle rounded-xl px-2.5 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-brand"
                    />
                  </div>

                  {/* Quantidade */}
                  <div className="w-full sm:w-24">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      placeholder="Qtd"
                      value={ing.amount}
                      onChange={e => updateIngredient(idx, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full bg-theme-card border border-theme-subtle rounded-xl px-2.5 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-brand text-right font-medium"
                    />
                  </div>

                  {/* Unidade */}
                  <div className="w-full sm:w-28">
                    <select
                      value={ing.unit}
                      onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                      className="w-full bg-theme-card border border-theme-subtle rounded-xl px-2 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-brand cursor-pointer"
                    >
                      <option value="g">gramas (g)</option>
                      <option value="kg">quilos (kg)</option>
                      <option value="ml">mililitros (ml)</option>
                      <option value="l">litros (L)</option>
                      <option value="cup">xícara</option>
                      <option value="tablespoon">col. sopa</option>
                      <option value="teaspoon">col. chá</option>
                      <option value="unit">unidade</option>
                    </select>
                  </div>

                  {/* Categoria Físico-Química (Apenas Modo Avançado) */}
                  <CategorySelect 
                    value={ing.category} 
                    onChange={(val) => updateIngredient(idx, 'category', val)} 
                    isAdvanced={isAdvanced} 
                  />

                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="p-2 text-theme-dim hover:text-rose-500 transition self-end sm:self-auto touch-target"
                    title="Remover ingrediente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Etapas de Preparo */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-theme-main uppercase tracking-wider">Modo de Preparo</h3>
                <p className="text-[10px] text-theme-muted">Etapas claras para acompanhar no Modo Cozinha.</p>
              </div>
              <button
                type="button"
                onClick={addStep}
                className="text-xs flex items-center px-2.5 py-1.5 rounded-xl bg-theme-brand/10 text-theme-brand font-bold hover:bg-theme-brand/20 transition touch-target"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Etapa
              </button>
            </div>
            <div className="space-y-2">
              {draft.steps.map((step, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="mt-2 text-theme-dim cursor-move hidden sm:block">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <textarea
                    rows={2}
                    value={step}
                    onChange={e => updateStep(idx, e.target.value)}
                    className="flex-1 bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-brand resize-none"
                    placeholder={`Passo ${idx + 1}...`}
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="p-2 text-theme-dim hover:text-rose-500 transition mt-1 touch-target"
                    title="Remover passo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 pl-8 sm:pl-10 py-4 bg-theme-card border-t-2 border-theme-strong flex items-center justify-between relative z-10 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-sm text-sm font-bold text-theme-muted hover:text-theme-main transition touch-target border border-theme-subtle hover:bg-theme-app shadow-sm"
          >
            Cancelar
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-theme-dim hidden sm:inline font-serif italic">
              {isAdvanced ? 'Salvará com parâmetros avançados' : 'Salvará no modo prático direto'}
            </span>
            <button
              type="button"
              onClick={handleSave}
              className="bg-emerald-700 hover:bg-emerald-600 border border-emerald-800 text-white px-6 py-2 rounded-sm text-sm font-bold shadow-sm flex items-center justify-center transition touch-target"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Salvar Receita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
