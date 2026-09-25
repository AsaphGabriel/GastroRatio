import React, { useState, useMemo } from 'react';
import { Recipe } from '../domain/schemas/recipe.schema.js';
import { Search, Clock, ChefHat, RotateCcw, Tag, Trash2 } from 'lucide-react';

interface RecipesListViewProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onResetToSeed: () => void;
  onDeleteRecipe: (id: string) => void;
}

export const RecipesListView: React.FC<RecipesListViewProps> = ({
  recipes,
  onSelectRecipe,
  onResetToSeed,
  onDeleteRecipe
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const allTags = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return ['all', ...Array.from(set)];
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchTag = selectedTag === 'all' || r.tags.includes(selectedTag);

      return matchSearch && matchTag;
    });
  }, [recipes, searchTerm, selectedTag]);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Topo com Título e Restauração */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-theme-main">Catálogo de Receitas</h1>
          <p className="text-xs text-theme-muted mt-0.5">
            {recipes.length} receitas populares brasileiras em gramas exatos
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Deseja restaurar todas as receitas para a versão original de fábrica?')) {
              onResetToSeed();
            }
          }}
          className="flex items-center text-xs px-3 py-2 rounded-xl bg-theme-card hover:bg-theme-card-hover text-theme-muted border border-theme-subtle transition touch-target self-start sm:self-auto shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5 shrink-0" />
          Restaurar Catálogo
        </button>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-theme-dim absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por receita ou ingrediente (ex: frango, fubá, cenoura)..."
            className="w-full bg-theme-card border border-theme-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs text-theme-main placeholder:text-theme-dim focus:outline-none focus:border-theme-brand transition card-shadow"
          />
        </div>

        {/* Filtro de Categorias (Modal/Select Native) */}
        <div className="relative">
          <div className="flex items-center bg-theme-card border border-theme-subtle rounded-xl px-3 py-2.5 card-shadow transition hover:border-theme-strong">
            <Tag className="w-4 h-4 text-theme-dim shrink-0 mr-2" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full bg-transparent text-xs text-theme-main font-medium focus:outline-none appearance-none cursor-pointer"
            >
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag === 'all' ? 'Todas as Categorias' : tag}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-theme-dim">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Grade de Receitas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-theme-card border border-theme-subtle rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3.5 card-shadow hover:border-theme-strong transition"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-card-subtle text-theme-dim font-bold uppercase border border-theme-subtle">
                  {recipe.yieldUnit}: {recipe.baseYield}
                </span>
                <div className="flex items-center text-xs text-theme-muted">
                  <Clock className="w-3.5 h-3.5 mr-1 text-theme-dim" />
                  <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
                </div>
              </div>
              <h3 className="text-base font-bold text-theme-main mt-2">{recipe.title}</h3>
              <p className="text-xs text-theme-muted mt-1 line-clamp-2 leading-relaxed">{recipe.description}</p>
            </div>

            <div className="pt-3 border-t border-theme-subtle flex items-center justify-between gap-2">
              <span className="text-xs text-theme-dim">
                {recipe.ingredients.length} ingredientes
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (confirm(`Excluir receita "${recipe.title}"? Ela será removida da sua lista local.`)) {
                      onDeleteRecipe(recipe.id);
                    }
                  }}
                  className="bg-transparent hover:bg-rose-500/10 text-theme-dim hover:text-rose-500 p-1.5 rounded-xl transition touch-target flex items-center justify-center"
                  title="Excluir receita"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSelectRecipe(recipe)}
                  className="bg-theme-card hover:bg-theme-brand hover:text-white text-theme-main border border-theme-subtle hover:border-theme-brand px-3.5 py-1.5 rounded-xl text-xs font-bold transition touch-target flex items-center shadow-sm"
                >
                  <ChefHat className="w-3.5 h-3.5 mr-1.5" />
                  Modo Cozinha
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
