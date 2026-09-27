export interface ChemicalSubstitution {
  readonly original: string;
  readonly substitute: string;
  readonly ratio: string; // ex: "1:1" ou "3/4 de xícara para cada xícara"
  readonly physicalFunction: string;
  readonly multiplier?: number;
  readonly overrideName?: string; // emulsificante, aerador, espessante, umectante
  readonly waterAdjustmentAlert?: string; // alerta de água livre (RN-03)
  readonly liquidDeltaRatio?: number; // Ex: -0.18 reduz 18% de água da receita pelo peso do substituto
  readonly explanation: string;
}

/**
 * Tabela canônica de substituições físico-químicas culinárias (RN-03 / RF-07).
 * Funciona 100% offline via regras determinísticas em TypeScript.
 */
export const CANONICAL_CHEMICAL_SUBSTITUTIONS: readonly ChemicalSubstitution[] = [
  {
    original: 'açúcar refinado',
    substitute: 'mel de abelha',
    multiplier: 0.75,
    overrideName: 'Mel de Abelha',
    ratio: 'Use 0.75x do peso do açúcar',
    physicalFunction: 'Adoçante e retentor de umidade (higroscópico)',
    waterAdjustmentAlert: 'O mel contém ~18% de água livre. O sistema compensará reduzindo os líquidos da receita.',
    liquidDeltaRatio: -0.18,
    explanation: 'O mel é mais doce e retém mais água que a sacarose pura, acelerando também o escurecimento pela reação de Maillard.'
  },
  {
    original: 'fermento químico',
    substitute: 'bicarbonato de sódio + ácido (limão/vinagre)',
    multiplier: 0.30,
    overrideName: 'Bicarbonato de Sódio',
    ratio: 'Use 0.30x do peso do fermento químico em bicarbonato + dobro do peso de ácido.',
    physicalFunction: 'Agente de aeração química (geração de CO2 rápida)',
    liquidDeltaRatio: -2.0, // O ácido que acompanha tem 2x o peso do bicarbonato e entra como líquido (ex: 3g bicarbonato precisa de 6g de limão)
    waterAdjustmentAlert: 'O ácido líquido extra abaterá parte do leite/água originais.',
    explanation: 'Fermento em pó comercial é apenas ~30% bicarbonato (o resto é amido e ácido seco). Ao usar bicarbonato puro, use 1/3 da quantidade e junte um ácido líquido. Leve ao forno imediatamente pois a reação é instantânea.'
  },
  {
    original: 'manteiga',
    substitute: 'óleo vegetal ou azeite',
    multiplier: 0.85,
    overrideName: 'Óleo Vegetal',
    ratio: 'Use 0.85x do peso da manteiga (ex: 85g de óleo para 100g de manteiga)',
    physicalFunction: 'Gordura e maciez',
    waterAdjustmentAlert: 'A manteiga contém ~16% de água e sólidos de leite. O óleo vegetal é 100% gordura pura. Reduzir 15% do peso evita deixar o bolo excessivamente pesado.',
    explanation: 'Bolos feitos com óleo vegetal permanecem mais úmidos e macios em temperatura ambiente ou sob refrigeração.'
  },
  {
    original: 'creme de leite',
    substitute: 'leite integral + manteiga derretida',
    multiplier: 1.0,
    overrideName: 'Leite + Manteiga Derretida',
    ratio: '3/4 xícara de leite + 1/4 xícara de manteiga derretida',
    physicalFunction: 'Emulsão gorda e textura sedosa',
    explanation: 'Restaura a concentração de gordura de ~20% a 25% típica do creme de leite de caixinha.'
  },
  {
    original: 'ovo', // matches 'ovos' or 'ovo'
    substitute: 'aquafaba (água do grão de bico) ou banana nanica madura amassada',
    multiplier: 1.0,
    overrideName: 'Aquafaba / Banana',
    ratio: '3 colheres de sopa de aquafaba batida = 1 ovo; ou 1/2 banana = 1 ovo',
    physicalFunction: 'Agente ligante e emulsificante (lecitina)',
    explanation: 'A aquafaba imita as proteínas da clara com capacidade de aeração; a banana e compotas de maçã fornecem pectina para ligação estrutural.'
  },
  {
    original: 'farinha de trigo', // changed from 'farinha de trigo (como espessante de molho)' to allow matching
    substitute: 'amido de milho (maizena)',
    multiplier: 0.5,
    overrideName: 'Amido de Milho',
    ratio: 'Use metade do peso da farinha (1 colher de sopa de amido para 2 de farinha)',
    physicalFunction: 'Espessante por gelatinização de amido',
    explanation: 'O amido de milho puro tem o dobro do poder espessante da farinha de trigo e não adiciona sabor residual de farinha crua.'
  },
  {
    original: 'leite de vaca',
    substitute: 'água morna + 1 colher de sopa de manteiga ou óleo',
    multiplier: 1.0,
    overrideName: 'Água + Manteiga/Óleo',
    ratio: '1:1 em volume',
    physicalFunction: 'Hidratação e fração lipídica',
    explanation: 'Para pães e tortas simples, a água substitui o leite perfeitamente, conferindo crosta mais crocante ao pão.'
  }
];

export function findChemicalSubstitution(ingredientName: string, isBakingRecipe?: boolean): ChemicalSubstitution | undefined {
  const norm = ingredientName.toLowerCase().trim();
  return CANONICAL_CHEMICAL_SUBSTITUTIONS.find(
    (sub) => {
      const matches = norm.includes(sub.original) || sub.original.includes(norm);
      if (!matches) return false;
      if (sub.original === 'farinha de trigo' && isBakingRecipe) return false;
      return true;
    }
  );
}
