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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Topo com Busca e Reset */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Catálogo Canônico de Receitas</h1>
          <p className="text-xs text-slate-400">
            {recipes.length} receitas populares brasileiras em gramas exatos
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Deseja restaurar todas as 25 receitas para a versão original de fábrica?')) {
              onResetToSeed();
            }
          }}
          className="flex items-center text-xs px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition touch-target"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Restaurar Catálogo Semente
        </button>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por receita ou ingrediente (ex: frango, fubá, cenoura)..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Tags */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1 mr-1" />
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`text-xs px-3 py-1 rounded-lg transition shrink-0 ${
                selectedTag === tag
                  ? 'bg-brand-600 text-white font-medium'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tag === 'all' ? 'Todas' : tag}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Receitas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4.5 flex flex-col justify-between space-y-3 hover:border-slate-500 transition"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-semibold uppercase">
                  {recipe.yieldUnit}: {recipe.baseYield}
                </span>
                <div className="flex items-center text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
                </div>
              </div>
              <h3 className="text-base font-bold text-white mt-2">{recipe.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{recipe.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {recipe.ingredients.length} ingredientes
              </span>
              <button
                onClick={() => onSelectRecipe(recipe)}
                className="bg-slate-700 hover:bg-brand-600 hover:text-white text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition touch-target flex items-center"
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
