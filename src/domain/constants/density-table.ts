import { Density } from '../value-objects/Density.js';

export const VOLUMETRIC_MEASURES_ML = {
  cup: 240,
  tablespoon: 15,
  teaspoon: 5
} as const;

export interface IngredientDensityRecord {
  readonly canonicalName: string;
  readonly gramsPerMl: number;
  readonly aliases: readonly string[];
}

/**
 * Matriz canônica de densidades físicas reais (g/ml).
 * Mapeada com base em medições científicas culinárias (USDA / King Arthur).
 */
export const CANONICAL_DENSITIES: readonly IngredientDensityRecord[] = [
  // Farinhas e Grãos
  { canonicalName: 'farinha de trigo', gramsPerMl: 0.50, aliases: ['farinha', 'trigo', 'farinha branca', 'wheat flour'] },
  { canonicalName: 'farinha de trigo integral', gramsPerMl: 0.54, aliases: ['farinha integral', 'whole wheat flour'] },
  { canonicalName: 'fubá', gramsPerMl: 0.625, aliases: ['fubá mimoso', 'farinha de milho', 'cornmeal'] },
  { canonicalName: 'polvilho doce', gramsPerMl: 0.54, aliases: ['fécula de mandioca', 'polvilho'] },
  { canonicalName: 'polvilho azedo', gramsPerMl: 0.50, aliases: ['sour cassava starch'] },
  { canonicalName: 'farinha de mandioca', gramsPerMl: 0.625, aliases: ['farinha de mesa', 'cassava flour'] },
  { canonicalName: 'aveia em flocos', gramsPerMl: 0.375, aliases: ['aveia', 'rolled oats', 'flocos finos'] },
  { canonicalName: 'amido de milho', gramsPerMl: 0.54, aliases: ['maizena', 'cornstarch'] },
  { canonicalName: 'cacau em pó', gramsPerMl: 100 / 240, aliases: ['cacau', 'cocoa powder', 'chocolate em pó'] },
  { canonicalName: 'achocolatado', gramsPerMl: 150 / 240, aliases: ['toddy', 'nescau'] },

  // Açúcares e Adoçantes
  { canonicalName: 'açúcar refinado', gramsPerMl: 200 / 240, aliases: ['açúcar', 'açúcar branco', 'sugar'] },
  { canonicalName: 'açúcar cristal', gramsPerMl: 200 / 240, aliases: ['crystal sugar'] },
  { canonicalName: 'açúcar mascavo', gramsPerMl: 220 / 240, aliases: ['mascavo', 'brown sugar'] },
  { canonicalName: 'mel', gramsPerMl: 1.42, aliases: ['mel de abelha', 'honey'] },

  // Gorduras e Óleos
  { canonicalName: 'óleo vegetal', gramsPerMl: 0.90, aliases: ['óleo', 'óleo de soja', 'óleo de girassol', 'vegetable oil'] },
  { canonicalName: 'azeite', gramsPerMl: 0.90, aliases: ['azeite de oliva', 'olive oil'] },
  { canonicalName: 'manteiga', gramsPerMl: 0.945, aliases: ['margarina', 'butter'] },

  // Líquidos
  { canonicalName: 'água', gramsPerMl: 1.00, aliases: ['água morna', 'água filtrada', 'water'] },
  { canonicalName: 'leite', gramsPerMl: 1.02, aliases: ['leite integral', 'leite desnatado', 'milk'] },
  { canonicalName: 'creme de leite', gramsPerMl: 1.00, aliases: ['heavy cream', 'creme'] },
  { canonicalName: 'vinagre', gramsPerMl: 1.00, aliases: ['vinagre de álcool', 'vinagre de maçã', 'vinegar'] },
  { canonicalName: 'molho de tomate', gramsPerMl: 1.05, aliases: ['extrato de tomate', 'tomate pelado', 'polpa de tomate'] },

  // Temperos e Fermentos
  { canonicalName: 'sal', gramsPerMl: 1.20, aliases: ['sal refinado', 'sal marinho', 'salt'] },
  { canonicalName: 'fermento químico', gramsPerMl: 14 / 15, aliases: ['fermento para bolo', 'baking powder'] },
  { canonicalName: 'fermento biológico seco', gramsPerMl: 10 / 15, aliases: ['fermento seco', 'instant dry yeast'] }
];

// Mapeamento Hash O(1) para busca rápida
const DENSITY_HASH_MAP = new Map<string, number>();

for (const record of CANONICAL_DENSITIES) {
  DENSITY_HASH_MAP.set(record.canonicalName.toLowerCase(), record.gramsPerMl);
  for (const alias of record.aliases) {
    DENSITY_HASH_MAP.set(alias.toLowerCase(), record.gramsPerMl);
  }
}

/**
 * Localiza a densidade física de um ingrediente com busca exata ou parcial normalizada em O(1).
 * Fallback padrão: 1.0 g/ml (densidade da água).
 */
export function getIngredientDensity(ingredientName: string): Density {
  const normalized = ingredientName.trim().toLowerCase();

  // 1. Busca direta no mapa Hash
  if (DENSITY_HASH_MAP.has(normalized)) {
    return Density.of(DENSITY_HASH_MAP.get(normalized)!);
  }

  // 2. Busca por substring contida nos aliases
  for (const [key, density] of DENSITY_HASH_MAP.entries()) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return Density.of(density);
    }
  }

  // 3. Fallback neutro (densidade unitária da água)
  return Density.of(1.0);
}
