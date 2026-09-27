import React, { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/database.js';
import {
  PantryItem,
  IngredientCategory,
  CustomSubstitution,
  CustomSubstitutionSchema,
} from '../domain/schemas/recipe.schema.js';
import { GeminiSousChefAdapter } from '../domain/use-cases/AiProviderAdapter.js';
import {
  Pencil, Trash2, Plus, Check, X, FlaskConical,
  ArrowRight, Sparkles, AlertCircle, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';

const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  flour_grain: 'Grãos & Farinhas',
  liquid: 'Líquidos',
  fat_oil: 'Gorduras & Óleos',
  sugar_sweetener: 'Açúcares',
  leavening: 'Fermentos',
  protein: 'Proteínas',
  vegetable: 'Vegetais',
  dairy: 'Laticínios',
  staple_seasoning: 'Temperos & Básicos',
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS) as [IngredientCategory, string][];

const normalizeName = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// ─── Componente: Card de Ingrediente ─────────────────────────────────────────
interface IngredientCardProps {
  item: PantryItem;
  substitutions: CustomSubstitution[];
  onSaved: () => void;
}

const IngredientCard: React.FC<IngredientCardProps> = ({ item, substitutions, onSaved }) => {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editCategory, setEditCategory] = useState<IngredientCategory>(item.category);
  const [error, setError] = useState<string | null>(null);
  const [showSubs, setShowSubs] = useState(false);

  // Substituição nova
  const [addingSubstitute, setAddingSubstitute] = useState(false);
  const [subName, setSubName] = useState('');
  const [subMultiplier, setSubMultiplier] = useState('1');
  const [subRatio, setSubRatio] = useState('1:1');
  const [subExplanation, setSubExplanation] = useState('');
  const [subError, setSubError] = useState<string | null>(null);

  const handleSaveEdit = async () => {
    if (!editName.trim()) { setError('Nome não pode ser vazio.'); return; }
    const result = await db.editPantryItem(item.id, editName.trim(), editCategory);
    if (!result.ok) { setError(result.error || 'Erro ao salvar.'); return; }
    setEditing(false);
    setError(null);
    onSaved();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Excluir "${item.name}" da despensa? Substituições vinculadas também serão removidas.`)) return;
    await db.deletePantryItem(item.id);
    onSaved();
  };

  const handleAddSubstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) { setSubError('Nome do substituto obrigatório.'); return; }
    const multiplierParsed = parseFloat(subMultiplier);
    if (isNaN(multiplierParsed) || multiplierParsed <= 0) { setSubError('Multiplicador inválido.'); return; }
    const newSub: CustomSubstitution = CustomSubstitutionSchema.parse({
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      originalIngredient: item.name,
      substituteIngredient: subName.trim(),
      multiplier: multiplierParsed,
      ratio: subRatio || '1:1',
      explanation: subExplanation.trim(),
      source: 'user',
    });
    const result = await db.saveCustomSubstitution(newSub);
    if (!result.ok) { setSubError(result.error || 'Erro ao salvar substituto.'); return; }
    setSubName(''); setSubMultiplier('1'); setSubRatio('1:1'); setSubExplanation('');
    setSubError(null); setAddingSubstitute(false);
  };

  const handleDeleteSub = async (subId: string, subName: string) => {
    if (!window.confirm(`Remover substituição por "${subName}"?`)) return;
    await db.deleteCustomSubstitution(subId);
  };

  return (
    <div className="bg-theme-card border border-theme-subtle rounded-xl p-3 space-y-2">
      {editing ? (
        <div className="space-y-2">
          <input
            value={editName}
            onChange={e => { setEditName(e.target.value); setError(null); }}
            className="w-full bg-theme-card-subtle border border-theme-brand rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none"
            autoFocus
          />
          <select
            value={editCategory}
            onChange={e => setEditCategory(e.target.value as IngredientCategory)}
            className="w-full bg-theme-card-subtle border border-theme-subtle rounded-lg px-2.5 py-1.5 text-xs text-theme-main focus:outline-none"
          >
            {CATEGORY_OPTIONS.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} className="flex items-center gap-1 px-2.5 py-1.5 bg-theme-brand text-white rounded-lg text-[11px] font-bold">
              <Check className="w-3 h-3" /> Salvar
            </button>
            <button onClick={() => { setEditing(false); setEditName(item.name); setEditCategory(item.category); setError(null); }} className="flex items-center gap-1 px-2.5 py-1.5 bg-theme-card-subtle border border-theme-subtle text-theme-muted rounded-lg text-[11px]">
              <X className="w-3 h-3" /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-theme-main truncate">{item.name}</p>
            <span className="text-[10px] text-theme-muted">{CATEGORY_LABELS[item.category]}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-theme-brand-subtle text-theme-muted hover:text-theme-brand transition" title="Editar">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-theme-muted hover:text-rose-500 transition" title="Excluir">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Substituições */}
      <div>
        <button
          onClick={() => setShowSubs(v => !v)}
          className="flex items-center gap-1 text-[10px] text-theme-muted hover:text-theme-brand transition"
        >
          {showSubs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {substitutions.length > 0 ? `${substitutions.length} substituto(s)` : 'Adicionar substituto'}
        </button>

        {showSubs && (
          <div className="mt-2 space-y-1.5">
            {substitutions.map(sub => (
              <div key={sub.id} className="flex items-center justify-between gap-2 bg-theme-card-subtle border border-theme-subtle rounded-lg px-2.5 py-1.5">
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-theme-main flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-theme-brand shrink-0" />
                    {sub.substituteIngredient}
                    <span className="text-theme-dim font-normal">({sub.ratio})</span>
                  </span>
                  {sub.explanation && <p className="text-[10px] text-theme-muted truncate">{sub.explanation}</p>}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-theme-brand-subtle text-theme-brand font-semibold">{sub.source === 'ai' ? 'IA' : 'Manual'}</span>
                </div>
                <button onClick={() => handleDeleteSub(sub.id, sub.substituteIngredient)} className="p-1 rounded hover:text-rose-500 text-theme-muted transition shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {addingSubstitute ? (
              <form onSubmit={handleAddSubstitute} className="space-y-1.5 pt-1 border-t border-theme-subtle">
                <input
                  value={subName}
                  onChange={e => setSubName(e.target.value)}
                  placeholder="Nome do substituto (ex: Mel de Abelha)"
                  className="w-full bg-theme-card-subtle border border-theme-subtle rounded-lg px-2.5 py-1.5 text-[11px] text-theme-main placeholder:text-theme-dim focus:outline-none focus:border-theme-brand"
                />
                <div className="flex gap-2">
                  <input
                    value={subMultiplier}
                    onChange={e => setSubMultiplier(e.target.value)}
                    placeholder="Fator (ex: 0.75)"
                    type="number" step="0.01" min="0.01"
                    className="w-24 bg-theme-card-subtle border border-theme-subtle rounded-lg px-2 py-1.5 text-[11px] text-theme-main focus:outline-none focus:border-theme-brand"
                  />
                  <input
                    value={subRatio}
                    onChange={e => setSubRatio(e.target.value)}
                    placeholder="Proporção (ex: 3:4)"
                    className="flex-1 bg-theme-card-subtle border border-theme-subtle rounded-lg px-2 py-1.5 text-[11px] text-theme-main focus:outline-none focus:border-theme-brand"
                  />
                </div>
                <input
                  value={subExplanation}
                  onChange={e => setSubExplanation(e.target.value)}
                  placeholder="Explicação (opcional)"
                  className="w-full bg-theme-card-subtle border border-theme-subtle rounded-lg px-2.5 py-1.5 text-[11px] text-theme-main placeholder:text-theme-dim focus:outline-none"
                />
                {subError && <p className="text-[10px] text-rose-500">{subError}</p>}
                <div className="flex gap-2">
                  <button type="submit" className="flex items-center gap-1 px-2.5 py-1.5 bg-theme-brand text-white rounded-lg text-[11px] font-bold">
                    <Check className="w-3 h-3" /> Salvar
                  </button>
                  <button type="button" onClick={() => { setAddingSubstitute(false); setSubError(null); }} className="px-2.5 py-1.5 bg-theme-card-subtle border border-theme-subtle text-theme-muted rounded-lg text-[11px]">
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingSubstitute(true)}
                className="flex items-center gap-1 text-[11px] text-theme-brand hover:opacity-80 transition font-semibold"
              >
                <Plus className="w-3 h-3" /> Novo substituto manual
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Componente: Formulário de Adição Manual ──────────────────────────────────
const AddIngredientForm: React.FC<{ onAdded: () => void }> = ({ onAdded }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('vegetable');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Nome obrigatório.'); return; }
    await db.addOrUpdatePantryItem(name.trim(), category);
    setName(''); setError(null);
    onAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        value={name}
        onChange={e => { setName(e.target.value); setError(null); }}
        placeholder="Nome do ingrediente (ex: Chimichurri)"
        className="flex-1 bg-theme-card-subtle border border-theme-subtle rounded-xl px-3.5 py-2.5 text-xs text-theme-main placeholder:text-theme-dim focus:outline-none focus:border-theme-brand transition"
      />
      <select
        value={category}
        onChange={e => setCategory(e.target.value as IngredientCategory)}
        className="bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-brand transition"
      >
        {CATEGORY_OPTIONS.map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
      <button type="submit" className="bg-theme-brand hover:opacity-90 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm">
        <Plus className="w-4 h-4" /> Adicionar
      </button>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </form>
  );
};

// ─── Componente Principal: PantryManagerView ──────────────────────────────────
export const PantryManagerView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const pantryItems = useLiveQuery(() => db.pantry.toArray(), [refreshTick], []);
  const allSubs = useLiveQuery(() => db.custom_substitutions.toArray(), [refreshTick], []);

  const onRefresh = useCallback(() => setRefreshTick(t => t + 1), []);

  const filteredItems = useMemo(() => {
    if (!pantryItems) return [];
    let items = [...pantryItems].sort((a, b) => a.name.localeCompare(b.name, 'pt'));
    if (categoryFilter !== 'all') items = items.filter(i => i.category === categoryFilter);
    if (search.trim()) {
      const q = normalizeName(search);
      items = items.filter(i => normalizeName(i.name).includes(q));
    }
    return items;
  }, [pantryItems, categoryFilter, search]);

  const subsMap = useMemo(() => {
    const map = new Map<string, CustomSubstitution[]>();
    if (!allSubs) return map;
    for (const sub of allSubs) {
      const key = normalizeName(sub.originalIngredient);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(sub);
    }
    return map;
  }, [allSubs]);

  const handleAiAnalyze = async () => {
    setAiError(null); setAiSuccess(null);
    const savedKey = sessionStorage.getItem('gastroratio_gemini_api_key_v2');
    if (!savedKey) {
      setAiError('Chave da API do Gemini não configurada. Configure-a acima nesta tela.');
      return;
    }
    if (!pantryItems || pantryItems.length === 0) {
      setAiError('Nenhum ingrediente na despensa para analisar.');
      return;
    }

    setAiLoading(true);
    try {
      const listText = pantryItems.map(i => `- ${i.name} (${CATEGORY_LABELS[i.category]})`).join('\n');
      const result = await GeminiSousChefAdapter.analyzeSubstitutions(listText);

      let created = 0, newIngredients = 0;
      for (const sub of result) {
        // Verificar se o substituto existe na despensa; se não, adicionar
        const existingSub = pantryItems.find(p => normalizeName(p.name) === normalizeName(sub.substituteIngredient));
        if (!existingSub) {
          await db.addOrUpdatePantryItem(sub.substituteIngredient, 'vegetable');
          newIngredients++;
        }
        const saveResult = await db.saveCustomSubstitution(sub);
        if (saveResult.ok) created++;
      }
      setAiSuccess(`IA encontrou ${result.length} substituições — ${created} salvas, ${result.length - created} já existiam. ${newIngredients > 0 ? `${newIngredients} novos ingredientes adicionados à despensa.` : ''}`);
    } catch (err: any) {
      setAiError(`Falha na análise: ${err.message || 'Erro de comunicação com a IA.'}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
          <FlaskConical className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-theme-main">Laboratório do Chef — Catálogo de Ingredientes</h2>
          <p className="text-xs text-theme-muted">Edite, exclua, adicione ingredientes e gerencie substituições.</p>
        </div>
      </div>

      {/* Formulário de Adição */}
      <AddIngredientForm onAdded={onRefresh} />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar ingrediente..."
          className="flex-1 bg-theme-card-subtle border border-theme-subtle rounded-xl px-3.5 py-2 text-xs text-theme-main placeholder:text-theme-dim focus:outline-none focus:border-theme-brand transition"
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-theme-card-subtle border border-theme-subtle rounded-xl px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-brand transition"
        >
          <option value="all">Todas as categorias</option>
          {CATEGORY_OPTIONS.map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Botão IA */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleAiAnalyze}
          disabled={aiLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-bold transition shadow-sm"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {aiLoading ? 'Analisando substitutos com IA...' : 'Analisar Substitutos com IA (Gemini)'}
        </button>
        {aiError && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {aiError}
          </div>
        )}
        {aiSuccess && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs">
            <Check className="w-4 h-4 shrink-0 mt-0.5" /> {aiSuccess}
          </div>
        )}
      </div>

      {/* Lista de Ingredientes */}
      <div className="text-xs text-theme-muted font-semibold">{filteredItems.length} ingrediente(s) encontrado(s)</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filteredItems.map(item => (
          <IngredientCard
            key={item.id}
            item={item}
            substitutions={subsMap.get(normalizeName(item.name)) || []}
            onSaved={onRefresh}
          />
        ))}
      </div>
    </div>
  );
};
