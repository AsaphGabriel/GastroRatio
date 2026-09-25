import { Dexie, type Table } from 'dexie';
import { Recipe, RecipeSchema, PantryItem, IngredientCategory } from '../domain/schemas/recipe.schema.js';
import { SEED_CANONICAL_RECIPES } from './seed-recipes.js';

export interface AppSetting {
  key: string;
  value: any;
}

export class GastroRatioDatabase extends Dexie {
  recipes!: Table<Recipe, string>;
  pantry!: Table<PantryItem, string>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('GastroRatioDB');
    this.version(1).stores({
      recipes: 'id, title, isBakingRecipe, *tags',
      pantry: 'id, name, category, inStock',
      settings: 'key'
    });
  }

  /**
   * Inicializa o banco de dados local com o catálogo canônico de 25 receitas populares brasileiras.
   * Executado em transação ACID atômica.
   */
  async initializeDatabase(): Promise<void> {
    await this.transaction('rw', [this.recipes, this.pantry, this.settings], async () => {
      const count = await this.recipes.count();
      if (count === 0) {
        // Validação estrita Zod de cada receita da carga semente
        for (const recipe of SEED_CANONICAL_RECIPES) {
          RecipeSchema.parse(recipe);
        }
        await this.recipes.bulkAdd(SEED_CANONICAL_RECIPES);

        // Gera a despensa baseando-se RIGOROSAMENTE em todos os ingredientes das receitas
        const uniqueIngredients = new Map<string, PantryItem>();
        let idCounter = 0;
        
        for (const recipe of SEED_CANONICAL_RECIPES) {
          for (const ing of recipe.ingredients) {
            const normalized = ing.name.toLowerCase().trim();
            if (!uniqueIngredients.has(normalized)) {
              uniqueIngredients.set(normalized, {
                id: `p-seed-${idCounter++}`,
                name: ing.name.trim(),
                category: ing.category || 'vegetable',
                inStock: false
              });
            }
          }
        }

        await this.pantry.bulkAdd(Array.from(uniqueIngredients.values()));

        // Preferência padrão: Despensa Básica Assumida = ON
        await this.settings.put({ key: 'assume_basic_staples', value: true });
        await this.settings.put({ key: 'pantry_clean_default_v3', value: true });
        await this.settings.put({ key: 'pantry_category_fix_v4', value: true });
      } else {
        // Migração para limpar seleções prévias indesejadas em bancos locais existentes
        const isCleaned = await this.settings.get('pantry_clean_default_v3');
        if (!isCleaned) {
          const allItems = await this.pantry.toArray();
          for (const item of allItems) {
            if (item.inStock) {
              await this.pantry.update(item.id, { inStock: false });
            }
          }
          await this.settings.put({ key: 'pantry_clean_default_v3', value: true });
        }

        // Migração para corrigir as categorias da despensa que foram hardcoded como 'staple_seasoning'
        const isCategoriesFixed = await this.settings.get('pantry_category_fix_v4');
        if (!isCategoriesFixed) {
          const allRecipes = await this.recipes.toArray();
          const categoryMap = new Map<string, string>();
          for (const recipe of allRecipes) {
            for (const ing of recipe.ingredients) {
              const norm = ing.name.toLowerCase().trim();
              if (!categoryMap.has(norm)) {
                categoryMap.set(norm, ing.category || 'vegetable');
              }
            }
          }
          const allPantry = await this.pantry.toArray();
          for (const item of allPantry) {
            const norm = item.name.toLowerCase().trim();
            const correctCategory = categoryMap.get(norm) as IngredientCategory | undefined;
            if (correctCategory && item.category !== correctCategory) {
              await this.pantry.update(item.id, { category: correctCategory });
            }
          }
          await this.settings.put({ key: 'pantry_category_fix_v4', value: true });
        }
      }
    });
  }

  /**
   * Atualização atômica ACID de receita com validação de schema e sincronização deduplicada na Despensa.
   */
  async saveRecipeTransaction(recipe: Recipe): Promise<void> {
    RecipeSchema.parse(recipe);
    await this.transaction('rw', [this.recipes, this.pantry], async () => {
      await this.recipes.put(recipe);
      
      const existingPantry = await this.pantry.toArray();
      const existingNames = new Set(existingPantry.map(i => i.name.toLowerCase().trim()));
      
      const newPantryItems: PantryItem[] = [];
      for (const ingredient of recipe.ingredients) {
        const name = ingredient.name.trim();
        const normalized = name.toLowerCase();
        
        if (!existingNames.has(normalized)) {
          existingNames.add(normalized);
          newPantryItems.push({
            id: `p-import-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            category: ingredient.category || 'vegetable',
            inStock: false
          });
        }
      }
      
      if (newPantryItems.length > 0) {
        await this.pantry.bulkAdd(newPantryItems);
      }
    });
  }

  /**
   * Exclui atomaticamente uma receita do catálogo.
   */
  async deleteRecipeTransaction(id: string): Promise<void> {
    await this.transaction('rw', [this.recipes], async () => {
      await this.recipes.delete(id);
    });
  }

  /**
   * Restaura o banco de receitas para a carga canônica de 25 receitas.
   */
  async resetToSeed(): Promise<void> {
    await this.transaction('rw', [this.recipes, this.pantry], async () => {
      await this.recipes.clear();
      await this.recipes.bulkAdd(SEED_CANONICAL_RECIPES);
    });
  }

  /**
   * Desmarca todos os itens da bancada de uma só vez (Experiência limpa).
   */
  async clearAllPantryStock(): Promise<void> {
    await this.transaction('rw', this.pantry, async () => {
      const all = await this.pantry.toArray();
      for (const item of all) {
        if (item.inStock) {
          await this.pantry.update(item.id, { inStock: false });
        }
      }
    });
  }

  /**
   * Marca todos os itens da bancada.
   */
  async selectAllPantryStock(): Promise<void> {
    await this.transaction('rw', this.pantry, async () => {
      const all = await this.pantry.toArray();
      for (const item of all) {
        if (!item.inStock) {
          await this.pantry.update(item.id, { inStock: true });
        }
      }
    });
  }
}

export const db = new GastroRatioDatabase();
