import { Dexie, type Table } from 'dexie';
import {
  Recipe, RecipeSchema,
  PantryItem,
  IngredientCategory,
  CustomSubstitution, CustomSubstitutionSchema
} from '../domain/schemas/recipe.schema.js';
import { SEED_CANONICAL_RECIPES } from './seed-recipes.js';

export interface AppSetting {
  key: string;
  value: any;
}

const normalizeName = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export class GastroRatioDatabase extends Dexie {
  recipes!: Table<Recipe, string>;
  pantry!: Table<PantryItem, string>;
  settings!: Table<AppSetting, string>;
  custom_substitutions!: Table<CustomSubstitution, string>;

  constructor() {
    super('GastroRatioDB');
    this.version(1).stores({
      recipes: 'id, title, isBakingRecipe, *tags',
      pantry: 'id, name, category, inStock',
      settings: 'key'
    });
    // v2: Adiciona tabela de substituições personalizadas
    this.version(2).stores({
      recipes: 'id, title, isBakingRecipe, *tags',
      pantry: 'id, name, category, inStock',
      settings: 'key',
      custom_substitutions: 'id, originalIngredient, substituteIngredient, source'
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
            const normalized = normalizeName(ing.name);
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
        // Migração: limpar seleções prévias indesejadas em bancos locais existentes
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

        // Migração: corrigir categorias hardcoded
        const isCategoriesFixed = await this.settings.get('pantry_category_fix_v4');
        if (!isCategoriesFixed) {
          const allRecipes = await this.recipes.toArray();
          const categoryMap = new Map<string, string>();
          for (const recipe of allRecipes) {
            for (const ing of recipe.ingredients) {
              const norm = normalizeName(ing.name);
              if (!categoryMap.has(norm)) {
                categoryMap.set(norm, ing.category || 'vegetable');
              }
            }
          }
          const allPantry = await this.pantry.toArray();
          for (const item of allPantry) {
            const norm = normalizeName(item.name);
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
   * Impacto: se um ingrediente novo vier com nome diferente do que já existe (ex: acento), será criado novo card.
   * A deduplicação NFD previne isso.
   */
  async saveRecipeTransaction(recipe: Recipe): Promise<void> {
    RecipeSchema.parse(recipe);
    await this.transaction('rw', [this.recipes, this.pantry], async () => {
      await this.recipes.put(recipe);

      const existingPantry = await this.pantry.toArray();
      const existingNames = new Set(existingPantry.map(i => normalizeName(i.name)));

      const newPantryItems: PantryItem[] = [];
      for (const ingredient of recipe.ingredients) {
        const name = ingredient.name.trim();
        const normalized = normalizeName(name);

        if (!existingNames.has(normalized)) {
          existingNames.add(normalized);
          const isBasicStaple = ingredient.isStaple || ingredient.category === 'staple_seasoning';
          newPantryItems.push({
            id: `p-import-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            category: ingredient.category || 'vegetable',
            inStock: isBasicStaple
          });
        }
      }

      if (newPantryItems.length > 0) {
        await this.pantry.bulkAdd(newPantryItems);
      }
    });
  }

  /**
   * Exclui atomicamente uma receita do catálogo.
   * Impacto: NÃO remove itens da despensa (ingredientes de outras receitas permanecem ativos).
   */
  async deleteRecipeTransaction(id: string): Promise<void> {
    await this.transaction('rw', [this.recipes], async () => {
      await this.recipes.delete(id);
    });
  }

  /**
   * Adiciona um novo item manual ou reativa um existente se os nomes colidirem (ignorando acentos e maiúsculas).
   * Impacto: Utilizado pelo input rápido de despensa. Não cria duplicatas.
   */
  async addOrUpdatePantryItem(name: string, category: IngredientCategory): Promise<void> {
    await this.transaction('rw', this.pantry, async () => {
      const all = await this.pantry.toArray();
      const targetNormalized = normalizeName(name);
      const existing = all.find(item => normalizeName(item.name) === targetNormalized);

      if (existing) {
        await this.pantry.update(existing.id, {
          inStock: true,
          category: category !== 'vegetable' ? category : existing.category
        });
      } else {
        await this.pantry.put({
          id: `p-manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          category,
          inStock: true
        });
      }
    });
  }

  /**
   * Edita nome e categoria de um item existente na despensa.
   * Verifica se o novo nome colide com outro item (NFD). Se colidir, rejeita.
   * Impacto: Não afeta receitas nem substituições existentes.
   */
  async editPantryItem(id: string, newName: string, newCategory: IngredientCategory): Promise<{ ok: boolean; error?: string }> {
    const all = await this.pantry.toArray();
    const targetNormalized = normalizeName(newName);
    const collision = all.find(item => normalizeName(item.name) === targetNormalized && item.id !== id);
    if (collision) {
      return { ok: false, error: `Já existe um ingrediente chamado "${collision.name}".` };
    }
    await this.pantry.update(id, {
      name: newName.trim().charAt(0).toUpperCase() + newName.trim().slice(1),
      category: newCategory
    });
    return { ok: true };
  }

  /**
   * Exclui um item da despensa. Também remove substituições vinculadas a esse ingrediente.
   * Impacto: Pode tornar substituições de ScaleView inaplicáveis se o original for deletado.
   */
  async deletePantryItem(id: string): Promise<void> {
    const item = await this.pantry.get(id);
    if (!item) return;
    const nameNorm = normalizeName(item.name);
    await this.transaction('rw', [this.pantry, this.custom_substitutions], async () => {
      await this.pantry.delete(id);
      // Remover substituições que referenciam esse ingrediente (original ou substituto)
      const subs = await this.custom_substitutions.toArray();
      for (const s of subs) {
        if (normalizeName(s.originalIngredient) === nameNorm || normalizeName(s.substituteIngredient) === nameNorm) {
          await this.custom_substitutions.delete(s.id);
        }
      }
    });
  }

  // ── CRUD de Substituições Personalizadas ──────────────────────────────────────

  /**
   * Salva uma substituição personalizada. Valida duplicidade (originalIngredient + substituteIngredient).
   * Impacto: Substituições novas passam a aparecer no ScaleView via getSubstitutionsForIngredient.
   */
  async saveCustomSubstitution(sub: CustomSubstitution): Promise<{ ok: boolean; error?: string }> {
    CustomSubstitutionSchema.parse(sub);
    const all = await this.custom_substitutions.toArray();
    const collision = all.find(
      s =>
        s.id !== sub.id &&
        normalizeName(s.originalIngredient) === normalizeName(sub.originalIngredient) &&
        normalizeName(s.substituteIngredient) === normalizeName(sub.substituteIngredient)
    );
    if (collision) {
      return { ok: false, error: `Substituição ${sub.originalIngredient} → ${sub.substituteIngredient} já existe.` };
    }
    await this.custom_substitutions.put(sub);
    return { ok: true };
  }

  /**
   * Remove uma substituição personalizada pelo id.
   */
  async deleteCustomSubstitution(id: string): Promise<void> {
    await this.custom_substitutions.delete(id);
  }

  /**
   * Retorna substituições (canônicas + custom) para um dado nome de ingrediente.
   * Usado pelo ScaleView ao aplicar substituições.
   */
  async getSubstitutionsForIngredient(ingredientName: string): Promise<CustomSubstitution[]> {
    const norm = normalizeName(ingredientName);
    return this.custom_substitutions
      .filter(s => normalizeName(s.originalIngredient) === norm)
      .toArray();
  }

  // ── Reset & Sincronização ─────────────────────────────────────────────────────

  /**
   * Restaura o banco de receitas E a despensa para a carga canônica de 25 receitas.
   * Também limpa substituições customizadas.
   * Impacto: Destrói TODOS os dados do usuário exceto settings (API Key preservada).
   */
  async resetToSeed(): Promise<void> {
    await this.transaction('rw', [this.recipes, this.pantry, this.custom_substitutions], async () => {
      // Limpar tudo
      await this.recipes.clear();
      await this.pantry.clear();
      await this.custom_substitutions.clear();

      // Recarregar receitas canônicas
      await this.recipes.bulkAdd(SEED_CANONICAL_RECIPES);

      // Reconstruir a despensa a partir dos ingredientes das receitas
      const uniqueIngredients = new Map<string, PantryItem>();
      let idCounter = 0;
      for (const recipe of SEED_CANONICAL_RECIPES) {
        for (const ing of recipe.ingredients) {
          const key = normalizeName(ing.name);
          if (!uniqueIngredients.has(key)) {
            uniqueIngredients.set(key, {
              id: `p-seed-${idCounter++}`,
              name: ing.name.trim(),
              category: ing.category || 'vegetable',
              inStock: false
            });
          }
        }
      }
      await this.pantry.bulkAdd(Array.from(uniqueIngredients.values()));
    });
  }

  /**
   * Desmarca todos os itens da bancada de uma só vez.
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

  /**
   * Altera inStock para itens staple_seasoning — sincroniza com o Toggle "Assumir básicos".
   */
  async setBasicStaplesStock(inStockStatus: boolean): Promise<void> {
    await this.transaction('rw', this.pantry, async () => {
      const all = await this.pantry.toArray();
      for (const item of all) {
        if (item.category === 'staple_seasoning' && item.inStock !== inStockStatus) {
          await this.pantry.update(item.id, { inStock: inStockStatus });
        }
      }
    });
  }
}

export const db = new GastroRatioDatabase();
