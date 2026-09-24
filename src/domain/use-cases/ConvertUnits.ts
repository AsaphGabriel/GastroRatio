import { UnitType } from '../schemas/recipe.schema.js';
import { Grams } from '../value-objects/Grams.js';
import { Milliliters } from '../value-objects/Milliliters.js';
import { getIngredientDensity, VOLUMETRIC_MEASURES_ML } from '../constants/density-table.js';

export interface UnitConversionResult {
  readonly grams: Grams;
  readonly milliliters?: Milliliters;
  readonly originalAmount: number;
  readonly originalUnit: UnitType;
  readonly densityUsed: number;
}

/**
 * Converte qualquer unidade de medida culinária para gramas e mililitros
 * utilizando a matriz de densidade física real do insumo.
 */
export class ConvertUnitsUseCase {
  public static execute(
    ingredientName: string,
    amount: number,
    unit: UnitType
  ): UnitConversionResult {
    if (amount < 0) {
      throw new Error(`[ConvertUnits] Quantidade não pode ser negativa: ${amount}`);
    }

    const density = getIngredientDensity(ingredientName);
    const densityValue = density.toNumber();

    switch (unit) {
      case 'g': {
        const grams = Grams.of(amount);
        const ml = density.toMilliliters(grams);
        return {
          grams,
          milliliters: ml,
          originalAmount: amount,
          originalUnit: unit,
          densityUsed: densityValue
        };
      }

      case 'kg': {
        const grams = Grams.of(amount * 1000);
        const ml = density.toMilliliters(grams);
        return {
          grams,
          milliliters: ml,
          originalAmount: amount,
          originalUnit: unit,
          densityUsed: densityValue
        };
      }

      case 'ml': {
        const ml = Milliliters.of(amount);
        const grams = density.toGrams(ml);
        return {
          grams,
          milliliters: ml,
          originalAmount: amount,
          originalUnit: unit,
          densityUsed: densityValue
        };
      }

      case 'l': {
        const ml = Milliliters.of(amount * 1000);
        const grams = density.toGrams(ml);
        return {
          grams,
          milliliters: ml,
          originalAmount: amount,
          originalUnit: unit,
          densityUsed: densityValue
        };
      }

      case 'cup': {
        const ml = Milliliters.of(amount * VOLUMETRIC_MEASURES_ML.cup);
        const grams = density.toGrams(ml);
        return {
          grams,
          milliliters: ml,
          originalAmount: amount,
          originalUnit: unit,
          densityUsed: densityValue
        };
      }

      case 'tablespoon': {
        const ml = Milliliters.of(amount * VOLUMETRIC_MEASURES_ML.tablespoon);
        const grams = density.toGrams(ml);
        return {
          grams,
          milliliters: ml,
          originalAmount: amount,
          originalUnit: unit,
          densityUsed: densityValue
        };
      }

      case 'teaspoon': {
        const ml = Milliliters.of(amount * VOLUMETRIC_MEASURES_ML.teaspoon);
        const grams = density.toGrams(ml);
        return {
          grams,
          milliliters: ml,
          originalAmount: amount,
          originalUnit: unit,
          densityUsed: densityValue
        };
      }

      case 'unit': {
        // Unidades discretas (ex: 2 ovos ~100g, 1 limão ~60g)
        // Se for ovo, estima ~50g por ovo se não especificado
        let estimatedGrams = amount;
        if (ingredientName.toLowerCase().includes('ovo')) {
          estimatedGrams = amount * 50;
        }
        return {
          grams: Grams.of(estimatedGrams),
          originalAmount: amount,
          originalUnit: unit,
          densityUsed: densityValue
        };
      }
    }
  }
}
