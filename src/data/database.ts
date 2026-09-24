import { Dexie, type Table } from 'dexie';
import { Recipe, RecipeSchema, PantryItem } from '../domain/schemas/recipe.schema.js';
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

        // Itens comuns pré-cadastrados na bancada (todos desmarcados por padrão para experiência limpa)
        const initialPantryItems: PantryItem[] = [
          { id: 'p-frango', name: 'Peito de Frango', category: 'protein', inStock: false },
          { id: 'p-carne-moida', name: 'Carne Moída', category: 'protein', inStock: false },
          { id: 'p-bife', name: 'Bife Bovino', category: 'protein', inStock: false },
          { id: 'p-ovos', name: 'Ovos', category: 'protein', inStock: false },
          { id: 'p-calabresa', name: 'Linguiça Calabresa', category: 'protein', inStock: false },
          { id: 'p-batata', name: 'Batata', category: 'vegetable', inStock: false },
          { id: 'p-cenoura', name: 'Cenoura', category: 'vegetable', inStock: false },
          { id: 'p-tomate', name: 'Tomate', category: 'vegetable', inStock: false },
          { id: 'p-couve', name: 'Couve', category: 'vegetable', inStock: false },
          { id: 'p-milho', name: 'Milho Verde', category: 'vegetable', inStock: false },
          { id: 'p-leite', name: 'Leite', category: 'liquid', inStock: false },
          { id: 'p-creme-leite', name: 'Creme de Leite', category: 'dairy', inStock: false },
          { id: 'p-mussarela', name: 'Queijo Mussarela', category: 'dairy', inStock: false },
          { id: 'p-farinha', name: 'Farinha de Trigo', category: 'flour_grain', inStock: false },
          { id: 'p-fuba', name: 'Fubá', category: 'flour_grain', inStock: false },
          { id: 'p-polvilho', name: 'Polvilho Doce', category: 'flour_grain', inStock: false },
          { id: 'p-arroz', name: 'Arroz Branco', category: 'flour_grain', inStock: false },
          { id: 'p-feijao', name: 'Feijão Carioca', category: 'flour_grain', inStock: false },
          { id: 'p-macarrao', name: 'Macarrão', category: 'flour_grain', inStock: false }
        ];

        await this.pantry.bulkAdd(initialPantryItems);

        // Preferência padrão: Despensa Básica Assumida = ON
        await this.settings.put({ key: 'assume_basic_staples', value: true });
        await this.settings.put({ key: 'pantry_clean_default_v3', value: true });
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
      }
    });
  }

  /**
   * Atualização atômica ACID de receita com validação de schema em runtime (Pilar 2 & 11).
   */
  async saveRecipeTransaction(recipe: Recipe): Promise<void> {
    RecipeSchema.parse(recipe);
    await this.transaction('rw', this.recipes, async () => {
      await this.recipes.put(recipe);
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
