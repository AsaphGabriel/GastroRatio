import { RecipeIngredient } from '../schemas/recipe.schema.js';
import { ConvertUnitsUseCase } from './ConvertUnits.js';
import { formatHouseholdFraction } from '../../utils/fractions.js';

export type DisplayMode = 'precision' | 'smart' | 'household';

export interface DualMeasurement {
  readonly primaryAmount: string | number;
  readonly primaryUnit: string;
  readonly secondaryText?: string;
  readonly rawGrams: number;
  readonly rawMilliliters?: number;
}

/**
 * Use case para calcular a medição primária e sua equivalência secundária em tempo real,
 * respeitando a densidade físico-química dos ingredientes e facilitando o trabalho na balança.
 */
export class FormatDualMeasurementUseCase {
  public static execute(
    ing: Pick<RecipeIngredient, 'name' | 'amount' | 'unit' | 'category'>,
    mode: DisplayMode
  ): DualMeasurement {
    const conv = ConvertUnitsUseCase.execute(ing.name, ing.amount, ing.unit);
    const g = conv.grams.toNumber();
    const ml = conv.milliliters ? conv.milliliters.toNumber() : g;
    const isLiquid = ing.category === 'liquid' || /água|agua|leite|suco|óleo|oleo|azeite|vinagre|molho|shoyu|café|cafe/i.test(ing.name);

    const formatGramsOrKg = (grams: number) => {
      if (grams >= 1000) {
        return {
          amount: (grams / 1000).toFixed(2).replace(/\.?0+$/, ''),
          unit: 'kg'
        };
      }
      return {
        amount: Math.round(grams),
        unit: 'g'
      };
    };

    const formatMlOrL = (volumeMl: number) => {
      if (volumeMl >= 1000) {
        return {
          amount: (volumeMl / 1000).toFixed(2).replace(/\.?0+$/, ''),
          unit: 'L'
        };
      }
      return {
        amount: Math.round(volumeMl),
        unit: 'ml'
      };
    };

    const getHouseholdInfo = (volumeMl: number, isDiscreteUnit: boolean, rawAmount: number) => {
      if (isDiscreteUnit) {
        return {
          amount: rawAmount,
          unit: rawAmount === 1 ? 'unidade' : 'unidades',
          fullText: `${rawAmount} ${rawAmount === 1 ? 'unidade' : 'unidades'}`
        };
      }
      if (volumeMl >= 60) {
        const frac = formatHouseholdFraction(volumeMl / 240);
        const unit = frac === '1' ? 'xícara' : 'xícaras';
        return { amount: frac, unit, fullText: `${frac} ${unit}` };
      }
      if (volumeMl >= 12) {
        const frac = formatHouseholdFraction(volumeMl / 15);
        const unit = 'col. sopa';
        return { amount: frac, unit, fullText: `${frac} ${unit}` };
      }
      if (volumeMl >= 2) {
        const frac = formatHouseholdFraction(volumeMl / 5);
        const unit = 'col. chá';
        return { amount: frac, unit, fullText: `${frac} ${unit}` };
      }
      return null;
    };

    const household = getHouseholdInfo(ml, ing.unit === 'unit', ing.amount);

    // 1. MODO MEDIDAS CASEIRAS
    if (mode === 'household') {
      if (ing.unit === 'unit') {
        return {
          primaryAmount: ing.amount,
          primaryUnit: ing.amount === 1 ? 'unidade' : 'unidades',
          secondaryText: `≈ ${Math.round(g)} g`,
          rawGrams: g,
          rawMilliliters: ml
        };
      }

      if (household) {
        const sec = isLiquid
          ? `≈ ${Math.round(ml)} ml (${Math.round(g)} g)`
          : `≈ ${Math.round(g)} g`;
        return {
          primaryAmount: household.amount,
          primaryUnit: household.unit,
          secondaryText: sec,
          rawGrams: g,
          rawMilliliters: ml
        };
      }

      // Fallback para pequenas quantidades sem fração de colher
      const p = formatGramsOrKg(g);
      return {
        primaryAmount: p.amount,
        primaryUnit: p.unit,
        secondaryText: undefined,
        rawGrams: g,
        rawMilliliters: ml
      };
    }

    // 2. MODO MISTO INTELIGENTE (Smart)
    if (mode === 'smart') {
      if (isLiquid) {
        const vol = formatMlOrL(ml);
        const weightG = Math.round(g);
        const secondary = `≈ ${weightG} g na balança`;
        return {
          primaryAmount: vol.amount,
          primaryUnit: vol.unit,
          secondaryText: secondary,
          rawGrams: g,
          rawMilliliters: ml
        };
      }

      const weight = formatGramsOrKg(g);
      const secondary = household ? `≈ ${household.fullText}` : undefined;
      return {
        primaryAmount: weight.amount,
        primaryUnit: weight.unit,
        secondaryText: secondary,
        rawGrams: g,
        rawMilliliters: ml
      };
    }

    // 3. MODO PRECISÃO (g / kg)
    const weight = formatGramsOrKg(g);
    let secondary: string | undefined;
    if (isLiquid) {
      const vol = formatMlOrL(ml);
      secondary = `≈ ${vol.amount} ${vol.unit}${household ? ` (${household.fullText})` : ''}`;
    } else if (household) {
      secondary = `≈ ${household.fullText}`;
    }

    return {
      primaryAmount: weight.amount,
      primaryUnit: weight.unit,
      secondaryText: secondary,
      rawGrams: g,
      rawMilliliters: ml
    };
  }
}
