import React, { useState, useMemo } from 'react';
import { Recipe } from '../domain/schemas/recipe.schema.js';
import { Search, Clock, Scale, RotateCcw, Tag } from 'lucide-react';

interface RecipesListViewProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onResetToSeed: () => void;
}

export const RecipesListView: React.FC<RecipesListViewProps> = ({
  recipes,
  onSelectRecipe,
  onResetToSeed
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

        {/* Tags em Scroll Suave */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          <Tag className="w-3.5 h-3.5 text-theme-dim shrink-0 ml-1 mr-0.5" />
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`text-xs px-3 py-1 rounded-xl transition shrink-0 font-medium touch-target ${
                selectedTag === tag
                  ? 'bg-theme-brand text-white shadow-sm'
                  : 'bg-theme-card border border-theme-subtle text-theme-muted hover:text-theme-main'
              }`}
            >
              {tag === 'all' ? 'Todas' : tag}
            </button>
          ))}
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
              <button
                onClick={() => onSelectRecipe(recipe)}
                className="bg-theme-card hover:bg-theme-brand hover:text-white text-theme-main border border-theme-subtle hover:border-theme-brand px-3.5 py-1.5 rounded-xl text-xs font-bold transition touch-target flex items-center shadow-sm"
              >
                <Scale className="w-3.5 h-3.5 mr-1.5" />
                Pesar na Balança
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
