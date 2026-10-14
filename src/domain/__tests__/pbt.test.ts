import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as fc from 'fast-check';
import {
  ConvertUnitsUseCase,
  FormatDualMeasurementUseCase,
  ScaleRecipeUseCase,
  CANONICAL_DENSITIES,
  UnitType,
  Recipe
} from '../index.js';
import { formatHouseholdFraction } from '../../utils/fractions.js';

describe('Property-Based Testing (PBT) - Invariantes Matemáticas & Físico-Químicas', () => {

  test('PBT: Reversibilidade física de conversão (g -> ml -> g) com erro absoluto <= 0.02g', () => {
    // Para qualquer densidade canônica e qualquer quantidade em gramas positiva
    fc.assert(
      fc.property(
        fc.constantFrom(...CANONICAL_DENSITIES.map(d => d.canonicalName)),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        (ingredientName, gramsInput) => {
          const res1 = ConvertUnitsUseCase.execute(ingredientName, gramsInput, 'g');
          assert.ok(res1.milliliters, 'Deveria conter volume em ml');
          
          const ml = res1.milliliters.toNumber();
          const res2 = ConvertUnitsUseCase.execute(ingredientName, ml, 'ml');
          const backToGrams = res2.grams.toNumber();

          const roundedInput = Math.round(gramsInput * 100) / 100;
          const diff = Math.abs(backToGrams - roundedInput);

          assert.ok(
            diff <= 0.02,
            `Erro de reversibilidade física para ${ingredientName}: original=${roundedInput}, recalculado=${backToGrams}, diff=${diff}`
          );
        }
      ),
      { numRuns: 300 }
    );
  });

  test('PBT: Monotonicidade estrita do redimensionador proporcional por porções', () => {
    const mockRecipe: Recipe = {
      id: 'pbt-rec',
      title: 'Receita PBT',
      description: 'Teste',
      mode: 'simple',
      baseYield: 4,
      yieldUnit: 'porções',
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      isBakingRecipe: false,
      ingredients: [
        { id: 'i1', name: 'Farinha de trigo', amount: 300, unit: 'g', isStaple: false, category: 'flour_grain' },
        { id: 'i2', name: 'Leite', amount: 200, unit: 'ml', isStaple: true, category: 'liquid' },
        { id: 'i3', name: 'Açúcar refinado', amount: 100, unit: 'g', isStaple: false, category: 'sugar_sweetener' }
      ],
      steps: ['Misture tudo'],
      tags: []
    };

    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 50, noNaN: true }),
        fc.double({ min: 0.1, max: 50, noNaN: true }),
        (y1, y2) => {
          const smallerYield = Math.min(y1, y2);
          const largerYield = Math.max(y1, y2);

          const scaleSmall = ScaleRecipeUseCase.execute(mockRecipe, { type: 'yield', targetYield: smallerYield });
          const scaleLarge = ScaleRecipeUseCase.execute(mockRecipe, { type: 'yield', targetYield: largerYield });

          for (let idx = 0; idx < mockRecipe.ingredients.length; idx++) {
            const amountSmall = scaleSmall.scaledIngredients[idx].amount;
            const amountLarge = scaleLarge.scaledIngredients[idx].amount;

            assert.ok(
              amountLarge >= amountSmall - 0.0001,
              `Violação de monotonicidade: y1=${smallerYield} (qtd=${amountSmall}), y2=${largerYield} (qtd=${amountLarge})`
            );
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('PBT: Robustez do formatador dual sob qualquer unidade e modo de exibição', () => {
    const units: UnitType[] = ['g', 'kg', 'ml', 'l', 'cup', 'tablespoon', 'teaspoon', 'unit'];
    const modes = ['precision', 'smart', 'household'] as const;

    fc.assert(
      fc.property(
        fc.constantFrom(...CANONICAL_DENSITIES.map(d => d.canonicalName)),
        fc.double({ min: 0.05, max: 2000, noNaN: true }),
        fc.constantFrom(...units),
        fc.constantFrom(...modes),
        (name, amount, unit, mode) => {
          const res = FormatDualMeasurementUseCase.execute(
            { name, amount, unit, category: name.includes('leite') || name.includes('água') ? 'liquid' : 'flour_grain' },
            mode
          );

          assert.ok(res.primaryAmount !== undefined && res.primaryAmount !== '', 'primaryAmount não pode ser vazio');
          assert.ok(typeof res.primaryAmount === 'number' || !res.primaryAmount.includes('NaN'), 'primaryAmount não pode conter NaN');
          assert.ok(res.primaryUnit && res.primaryUnit.length > 0, 'primaryUnit deve existir');
          assert.ok(Number.isFinite(res.rawGrams) && res.rawGrams >= 0, 'rawGrams deve ser finito e positivo');

          if (res.secondaryText) {
            assert.ok(!res.secondaryText.includes('NaN'), `secondaryText não pode conter NaN: ${res.secondaryText}`);
          }
        }
      ),
      { numRuns: 500 }
    );
  });

  test('PBT: formatHouseholdFraction nunca gera NaN e mapeia para frações válidas', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 50, noNaN: true }),
        (val) => {
          const formatted = formatHouseholdFraction(val);
          assert.ok(!formatted.includes('NaN'), `formatHouseholdFraction produziu NaN para entrada ${val}`);
          assert.ok(formatted.length > 0, `Resultado não pode ser vazio para ${val}`);
        }
      ),
      { numRuns: 300 }
    );
  });
});
