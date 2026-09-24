import { RecipeIngredient } from '../schemas/recipe.schema.js';
import { ConvertUnitsUseCase } from './ConvertUnits.js';
import { BakersPercentage } from '../value-objects/BakersPercentage.js';
import { Grams } from '../value-objects/Grams.js';

export interface BakersCalculationResult {
  readonly totalFlourGrams: Grams;
  readonly totalDoughGrams: Grams;
  readonly hydrationPercentage: BakersPercentage;
  readonly ingredients: readonly {
    readonly id: string;
    readonly name: string;
    readonly grams: Grams;
    readonly bakersPercentage: BakersPercentage;
    readonly isFlour: boolean;
  }[];
}

/**
 * Motor determinístico de Porcentagem de Padeiro (Baker's Percentage).
 * Invariante Absoluta: Farinha Total = 100.0%. Todos os outros pesos são derivados dessa base.
 */
export class CalculateBakersPercentageUseCase {
  /**
   * Analisa os ingredientes de uma receita de panificação e calcula as porcentagens relativas e hidratação.
   */
  public static execute(ingredients: readonly RecipeIngredient[]): BakersCalculationResult {
    if (ingredients.length === 0) {
      throw new Error("[BakersMath] Receita deve conter ao menos um ingrediente.");
    }

    // 1. Converter todos os ingredientes para gramas
    const converted = ingredients.map((ing) => {
      const conversion = ConvertUnitsUseCase.execute(ing.name, ing.amount, ing.unit);
      const isFlour =
        ing.category === 'flour_grain' ||
        ing.name.toLowerCase().includes('farinha') ||
        ing.name.toLowerCase().includes('polvilho') ||
        ing.name.toLowerCase().includes('fubá');

      return {
        id: ing.id,
        name: ing.name,
        category: ing.category,
        grams: conversion.grams,
        isFlour
      };
    });

    // 2. Calcular soma de todas as farinhas (Base 100%)
    const flourIngredients = converted.filter((c) => c.isFlour);
    const totalFlourGramsNumber = flourIngredients.reduce(
      (sum, item) => sum + item.grams.toNumber(),
      0
    );

    if (totalFlourGramsNumber <= 0) {
      throw new Error(
        "[BakersMath] Nenhuma farinha ou grão base identificado na receita. A farinha deve ter peso > 0."
      );
    }

    const totalFlourGrams = Grams.of(totalFlourGramsNumber);

    // 3. Calcular porcentagens relativas e hidratação
    let totalLiquidGramsNumber = 0;
    let totalDoughGramsNumber = 0;

    const calculatedIngredients = converted.map((item) => {
      const g = item.grams.toNumber();
      totalDoughGramsNumber += g;

      const percent = BakersPercentage.fromWeights(g, totalFlourGramsNumber);

      // Soma de líquidos para cálculo de hidratação
      if (
        item.category === 'liquid' ||
        item.name.toLowerCase().includes('água') ||
        item.name.toLowerCase().includes('leite')
      ) {
        totalLiquidGramsNumber += g;
      }

      return {
        id: item.id,
        name: item.name,
        grams: item.grams,
        bakersPercentage: percent,
        isFlour: item.isFlour
      };
    });

    const hydrationPercent = BakersPercentage.fromWeights(
      totalLiquidGramsNumber,
      totalFlourGramsNumber
    );

    return {
      totalFlourGrams,
      totalDoughGrams: Grams.of(totalDoughGramsNumber),
      hydrationPercentage: hydrationPercent,
      ingredients: calculatedIngredients
    };
  }

  /**
   * Recalcula todos os pesos dos ingredientes travando uma nova farinha alvo (Target Flour).
   */
  public static scaleByTargetFlour(
    ingredients: readonly RecipeIngredient[],
    targetFlourGrams: number
  ): RecipeIngredient[] {
    if (targetFlourGrams <= 0) {
      throw new Error(`[BakersMath] O peso da farinha alvo deve ser estritamente positivo: ${targetFlourGrams}`);
    }

    const baseCalculation = this.execute(ingredients);
    const originalFlour = baseCalculation.totalFlourGrams.toNumber();
    const factor = targetFlourGrams / originalFlour;

    return ingredients.map((ing) => {
      const conversion = ConvertUnitsUseCase.execute(ing.name, ing.amount, ing.unit);
      const originalGrams = conversion.grams.toNumber();
      const scaledGrams = Math.round(originalGrams * factor * 10) / 10;

      return {
        ...ing,
        amount: scaledGrams,
        unit: 'g' as const,
        bakersPercentage: BakersPercentage.fromWeights(scaledGrams, targetFlourGrams).toNumber()
      };
    });
  }

  /**
   * Recalcula a receita para atingir um peso total final de massa (ex: quero um pão de 800g exatos).
   */
  public static scaleByTargetDoughWeight(
    ingredients: readonly RecipeIngredient[],
    targetDoughGrams: number
  ): RecipeIngredient[] {
    if (targetDoughGrams <= 0) {
      throw new Error(`[BakersMath] O peso da massa alvo deve ser estritamente positivo: ${targetDoughGrams}`);
    }

    const baseCalculation = this.execute(ingredients);
    const originalDough = baseCalculation.totalDoughGrams.toNumber();
    const factor = targetDoughGrams / originalDough;

    return ingredients.map((ing) => {
      const conversion = ConvertUnitsUseCase.execute(ing.name, ing.amount, ing.unit);
      const originalGrams = conversion.grams.toNumber();
      const scaledGrams = Math.round(originalGrams * factor * 10) / 10;

      const targetFlour = baseCalculation.totalFlourGrams.toNumber() * factor;

      return {
        ...ing,
        amount: scaledGrams,
        unit: 'g' as const,
        bakersPercentage: BakersPercentage.fromWeights(scaledGrams, targetFlour).toNumber()
      };
    });
  }
}
