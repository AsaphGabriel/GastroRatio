import { Recipe, RecipeIngredient } from '../schemas/recipe.schema.js';
import { ConvertUnitsUseCase } from './ConvertUnits.js';

export type ScaleOptions =
  | { type: 'yield'; targetYield: number }
  | { type: 'multiplier'; factor: number }
  | { type: 'anchor'; anchorIngredientId: string; targetAmountGrams: number }
  | { type: 'anchor_by_name'; anchorIngredientName: string; targetAmountGrams: number };

export interface ScaledRecipeResult {
  readonly recipe: Recipe;
  readonly scalingFactor: number;
  readonly scaledIngredients: readonly RecipeIngredient[];
}

/**
 * Caso de uso: Redimensionamento Proporcional Dual (RF-04 / ADR-05).
 * Permite escalar receitas via:
 * 1. Fator multiplicador direto (ex: 0.5x, 2x, 3x).
 * 2. Rendimento alvo por porções (ex: receita para 4 porções ajustada para 7).
 * 3. Ingrediente Âncora travado (ex: o usuário só tem 350g de frango; todos os outros insumos se ajustam a essa âncora).
 */
export class ScaleRecipeUseCase {
  public static execute(recipe: Recipe, options: ScaleOptions): ScaledRecipeResult {
    let factor = 1;

    switch (options.type) {
      case 'multiplier': {
        if (options.factor <= 0) {
          throw new Error(`[ScaleRecipe] Fator multiplicador deve ser > 0: ${options.factor}`);
        }
        factor = options.factor;
        break;
      }

      case 'yield': {
        if (options.targetYield <= 0) {
          throw new Error(`[ScaleRecipe] Rendimento alvo deve ser > 0: ${options.targetYield}`);
        }
        if (recipe.baseYield <= 0) {
          throw new Error(`[ScaleRecipe] Rendimento base da receita deve ser > 0: ${recipe.baseYield}`);
        }
        factor = options.targetYield / recipe.baseYield;
        break;
      }

      case 'anchor': {
        if (options.targetAmountGrams <= 0) {
          throw new Error(`[ScaleRecipe] Quantidade alvo do ingrediente âncora deve ser > 0: ${options.targetAmountGrams}`);
        }
        const anchor = recipe.ingredients.find((ing) => ing.id === options.anchorIngredientId);
        if (!anchor) {
          throw new Error(`[ScaleRecipe] Ingrediente âncora ID '${options.anchorIngredientId}' não encontrado na receita.`);
        }
        const currentGrams = ConvertUnitsUseCase.execute(anchor.name, anchor.amount, anchor.unit).grams.toNumber();
        if (currentGrams <= 0) {
          throw new Error(`[ScaleRecipe] Massa do ingrediente âncora deve ser > 0: ${currentGrams}`);
        }
        factor = options.targetAmountGrams / currentGrams;
        break;
      }

      case 'anchor_by_name': {
        if (options.targetAmountGrams <= 0) {
          throw new Error(`[ScaleRecipe] Quantidade alvo do ingrediente âncora deve ser > 0: ${options.targetAmountGrams}`);
        }
        const normalizedTarget = options.anchorIngredientName.trim().toLowerCase();
        const anchor = recipe.ingredients.find(
          (ing) =>
            ing.name.toLowerCase() === normalizedTarget ||
            ing.name.toLowerCase().includes(normalizedTarget)
        );
        if (!anchor) {
          throw new Error(`[ScaleRecipe] Ingrediente âncora com nome '${options.anchorIngredientName}' não encontrado.`);
        }
        const currentGrams = ConvertUnitsUseCase.execute(anchor.name, anchor.amount, anchor.unit).grams.toNumber();
        if (currentGrams <= 0) {
          throw new Error(`[ScaleRecipe] Massa do ingrediente âncora deve ser > 0: ${currentGrams}`);
        }
        factor = options.targetAmountGrams / currentGrams;
        break;
      }
    }

    // Recalcular ingredientes preservando precisão e Baker's %
    const scaledIngredients: RecipeIngredient[] = recipe.ingredients.map((ing) => {
      // Se for em gramas ou ml, arredondar para 1 casa decimal
      const rawScaled = ing.amount * factor;
      let roundedAmount = Math.round(rawScaled * 10) / 10;

      // Para temperos muito pequenos (< 1g), manter 2 casas
      if (rawScaled < 1 && rawScaled > 0) {
        roundedAmount = Math.round(rawScaled * 100) / 100;
      }

      return {
        ...ing,
        amount: roundedAmount,
        // O Baker's % invariante relativo à farinha permanece rigorosamente constante sob escala linear
        bakersPercentage: ing.bakersPercentage
      };
    });

    const scaledYield = Math.round(recipe.baseYield * factor * 10) / 10;

    const scaledRecipe: Recipe = {
      ...recipe,
      baseYield: scaledYield,
      ingredients: scaledIngredients
    };

    return {
      recipe: scaledRecipe,
      scalingFactor: Math.round(factor * 1000) / 1000,
      scaledIngredients
    };
  }
}
