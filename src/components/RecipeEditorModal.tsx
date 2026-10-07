import React, { useState, useEffect } from 'react';
import { Recipe, RecipeIngredient, RecipeSchema } from '../domain/schemas/recipe.schema.js';
import { X, Save, Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import { generateId } from '../utils/id.js';

interface RecipeEditorModalProps {
  isOpen: boolean;
  recipe: Recipe | null;
  onClose: () => void;
  onSave: (recipe: Recipe) => Promise<void>;
}

export const RecipeEditorModal: React.FC<RecipeEditorModalProps> = ({ isOpen, recipe, onClose, onSave }) => {
  const [draft, setDraft] = useState<Recipe | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (recipe && isOpen) {
      // Deep copy to avoid mutating the original before saving
      setDraft(JSON.parse(JSON.stringify(recipe)));
      setErrorMsg(null);
    } else {
      setDraft(null);
    }
  }, [recipe, isOpen]);

  if (!isOpen || !draft) return null;

  const handleSave = async () => {
    try {
      setErrorMsg(null);
      // Validação estrita via Zod (Garante a integridade ACID)
      RecipeSchema.parse(draft);
      await onSave(draft);
      onClose();
    } catch (e: any) {
      setErrorMsg(`Erro de validação: Verifique os campos obrigatórios. ${e.message ? e.message.substring(0, 100) : ''}`);
    }
  };

  const updateField = <K extends keyof Recipe>(field: K, value: Recipe[K]) => {
    setDraft(prev => prev ? { ...prev, [field]: value } : null);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-theme-card border border-theme-subtle rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-theme-subtle flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-theme-main">
              Editar Receita
            </h2>
            <p className="text-[11px] sm:text-xs text-theme-muted">
              Altere quantidades, etapas e configurações.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-theme-card-subtle hover:bg-theme-card border border-theme-subtle flex items-center justify-center text-theme-muted hover:text-theme-main transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Dados Gerais */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-theme-main uppercase tracking-wider">Dados Gerais</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-theme-muted mb-1 font-bold">Título</label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={e => updateField('title', e.target.value)}
                  className="w-full bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2 text-sm text-theme-main focus:outline-none focus:border-theme-brand transition"
                />
              </div>
              <div>
                <label className="block text-[10px] text-theme-muted mb-1 font-bold">Descrição</label>
                <textarea
                  value={draft.description || ''}
                  onChange={e => updateField('description', e.target.value)}
                  rows={2}
                  className="w-full bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-brand transition resize-none"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] text-theme-muted mb-1 font-bold">Rendimento</label>
                  <input
                    type="number"
                    value={draft.baseYield}
                    onChange={e => updateField('baseYield', parseFloat(e.target.value) || 1)}
                    className="w-full bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2 text-sm text-theme-main focus:outline-none focus:border-theme-brand transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-theme-muted mb-1 font-bold">Unid. Rendimento</label>
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
                    value={draft.prepTimeMinutes}
                    onChange={e => updateField('prepTimeMinutes', parseInt(e.target.value) || 0)}
                    className="w-full bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2 text-sm text-theme-main focus:outline-none focus:border-theme-brand transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-theme-muted mb-1 font-bold">Cozimento (min)</label>
                  <input
                    type="number"
                    value={draft.cookTimeMinutes}
                    onChange={e => updateField('cookTimeMinutes', parseInt(e.target.value) || 0)}
                    className="w-full bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2 text-sm text-theme-main focus:outline-none focus:border-theme-brand transition"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isBaking"
                  checked={draft.isBakingRecipe}
                  onChange={e => updateField('isBakingRecipe', e.target.checked)}
                  className="rounded border-theme-subtle bg-theme-card-subtle"
                />
                <label htmlFor="isBaking" className="text-xs text-theme-main font-semibold">Receita de Panificação (Ativa Modo Padeiro)</label>
              </div>
            </div>
          </section>

          {/* Ingredientes */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-theme-main uppercase tracking-wider">Ingredientes</h3>
              <button
                onClick={addIngredient}
                className="text-[10px] flex items-center px-2 py-1 rounded bg-theme-brand/10 text-theme-brand font-bold hover:bg-theme-brand/20 transition"
              >
                <Plus className="w-3 h-3 mr-1" /> Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {draft.ingredients.map((ing, idx) => (
                <div key={ing.id} className="flex flex-col sm:flex-row gap-2 bg-theme-card-subtle p-2 rounded-xl border border-theme-subtle items-center">
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      placeholder="Nome"
                      value={ing.name}
                      onChange={e => updateIngredient(idx, 'name', e.target.value)}
                      className="w-full bg-theme-card border border-theme-subtle rounded-lg px-2 py-1.5 text-xs text-theme-main focus:outline-none"
                    />
                  </div>
                  <div className="w-full sm:w-20">
                    <input
                      type="number"
                      placeholder="Qtd"
                      value={ing.amount}
                      onChange={e => updateIngredient(idx, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full bg-theme-card border border-theme-subtle rounded-lg px-2 py-1.5 text-xs text-theme-main focus:outline-none"
                    />
                  </div>
                  <div className="w-full sm:w-24">
                    <select
                      value={ing.unit}
                      onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                      className="w-full bg-theme-card border border-theme-subtle rounded-lg px-2 py-1.5 text-xs text-theme-main focus:outline-none"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">L</option>
                      <option value="cup">Xícara</option>
                      <option value="tablespoon">Col. Sopa</option>
                      <option value="teaspoon">Col. Chá</option>
                      <option value="unit">Unidade</option>
                    </select>
                  </div>
                  <button
                    onClick={() => removeIngredient(idx)}
                    className="p-1.5 text-theme-dim hover:text-rose-500 transition self-end sm:self-auto"
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
              <h3 className="text-xs font-bold text-theme-main uppercase tracking-wider">Modo de Preparo</h3>
              <button
                onClick={addStep}
                className="text-[10px] flex items-center px-2 py-1 rounded bg-theme-brand/10 text-theme-brand font-bold hover:bg-theme-brand/20 transition"
              >
                <Plus className="w-3 h-3 mr-1" /> Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {draft.steps.map((step, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="mt-2 text-theme-dim cursor-move hidden sm:block"><GripVertical className="w-4 h-4" /></div>
                  <textarea
                    rows={2}
                    value={step}
                    onChange={e => updateStep(idx, e.target.value)}
                    className="flex-1 bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-brand resize-none"
                    placeholder={`Etapa ${idx + 1}`}
                  />
                  <button
                    onClick={() => removeStep(idx)}
                    className="p-2 text-theme-dim hover:text-rose-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-theme-card-subtle border-t border-theme-subtle flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-theme-muted hover:text-theme-main transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center transition"
          >
            <Save className="w-4 h-4 mr-1.5" />
            Salvar Receita
          </button>
        </div>
      </div>
    </div>
  );
};
