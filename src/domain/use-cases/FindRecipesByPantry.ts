import { Recipe, RecipeIngredient } from '../schemas/recipe.schema.js';

export interface RecipePantryMatch {
  readonly recipe: Recipe;
  readonly matchType: 'ready' | 'missing_one' | 'unavailable';
  readonly missingIngredients: readonly RecipeIngredient[];
  readonly totalRequiredPereciveis: number;
  readonly matchedPereciveisCount: number;
}

export interface PantrySearchResult {
  readonly readyToCook: readonly RecipePantryMatch[];
  readonly missingOneIngredient: readonly RecipePantryMatch[];
  readonly totalEvaluated: number;
}

/**
 * Caso de uso: Filtrador de Receitas por Disponibilidade de Despensa (RF-03).
 * Implementa o Axioma da Despensa Básica Assumida (RF-02 / ADR-01) com complexidade assintótica O(M).
 */
export class FindRecipesByPantryUseCase {
  public static execute(
    recipes: readonly Recipe[],
    userAvailableItemNames: readonly string[],
    assumeBasicStaples: boolean = true
  ): PantrySearchResult {
    // Normalizar insumos do usuário em um Set O(1)
    const userPantrySet = new Set<string>(
      userAvailableItemNames.map((name) => name.trim().toLowerCase())
    );

    const readyToCook: RecipePantryMatch[] = [];
    const missingOneIngredient: RecipePantryMatch[] = [];

    for (const recipe of recipes) {
      const missing: RecipeIngredient[] = [];
      let totalPereciveis = 0;
      let matchedPereciveis = 0;

      for (const ingredient of recipe.ingredients) {
        // Se a despensa básica estiver assumida e o item for tempero coringa, pula
        if (assumeBasicStaples && (ingredient.isStaple || ingredient.category === 'staple_seasoning')) {
          continue;
        }

        totalPereciveis++;
        const ingName = ingredient.name.trim().toLowerCase();

        // Checar se o usuário tem o item no Set (busca exata ou substring)
        let isPresent = userPantrySet.has(ingName);
        if (!isPresent) {
          for (const userItem of userPantrySet) {
            if (ingName.includes(userItem) || userItem.includes(ingName)) {
              isPresent = true;
              break;
            }
          }
        }

        if (isPresent) {
          matchedPereciveis++;
        } else {
          missing.push(ingredient);
        }
      }

      if (missing.length === 0) {
        readyToCook.push({
          recipe,
          matchType: 'ready',
          missingIngredients: [],
          totalRequiredPereciveis: totalPereciveis,
          matchedPereciveisCount: matchedPereciveis
        });
      } else if (missing.length === 1) {
        missingOneIngredient.push({
          recipe,
          matchType: 'missing_one',
          missingIngredients: missing,
          totalRequiredPereciveis: totalPereciveis,
          matchedPereciveisCount: matchedPereciveis
        });
      }
    }

    // Ordenar resultados por maior relevância (menor tempo de preparo / maior afinidade)
    readyToCook.sort(
      (a, b) =>
        a.recipe.prepTimeMinutes +
        a.recipe.cookTimeMinutes -
        (b.recipe.prepTimeMinutes + b.recipe.cookTimeMinutes)
    );

    return {
      readyToCook,
      missingOneIngredient,
      totalEvaluated: recipes.length
    };
  }
}
