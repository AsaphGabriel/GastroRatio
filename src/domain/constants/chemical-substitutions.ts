export interface ChemicalSubstitution {
  readonly original: string;
  readonly substitute: string;
  readonly ratio: string; // ex: "1:1" ou "3/4 de xícara para cada xícara"
  readonly physicalFunction: string;
  readonly multiplier?: number;
  readonly overrideName?: string; // emulsificante, aerador, espessante, umectante
  readonly waterAdjustmentAlert?: string; // alerta de água livre (RN-03)
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
    waterAdjustmentAlert: 'Atenção: O mel contém cerca de 17% a 18% de água livre. Reduza aproximadamente 2 colheres de sopa de líquido da receita para cada xícara de mel.',
    explanation: 'O mel é mais doce e retém mais água que a sacarose pura, acelerando também o escurecimento pela reação de Maillard.'
  },
  {
    original: 'fermento químico',
    substitute: 'bicarbonato de sódio + suco de limão ou vinagre',
    ratio: '1 colher de chá de bicarbonato + 1 colher de chá de limão/vinagre',
    physicalFunction: 'Agente de aeração química (geração de CO2)',
    explanation: 'O fermento em pó comercial é bicarbonato com um ácido seco (cremor tártaro). Ao juntar bicarbonato com ácido líquido (limão/vinagre), a reação de efervescência ocorre na hora; leve ao forno imediatamente.'
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
    ratio: '3/4 xícara de leite + 1/4 xícara de manteiga derretida',
    physicalFunction: 'Emulsão gorda e textura sedosa',
    explanation: 'Restaura a concentração de gordura de ~20% a 25% típica do creme de leite de caixinha.'
  },
  {
    original: 'ovos (em massas e bolos)',
    substitute: 'aquafaba (água do grão de bico) ou banana nanica madura amassada',
    ratio: '3 colheres de sopa de aquafaba batida = 1 ovo; ou 1/2 banana = 1 ovo',
    physicalFunction: 'Agente ligante e emulsificante (lecitina)',
    explanation: 'A aquafaba imita as proteínas da clara com capacidade de aeração; a banana e compotas de maçã fornecem pectina para ligação estrutural.'
  },
  {
    original: 'farinha de trigo (como espessante de molho)',
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
    ratio: '1:1 em volume',
    physicalFunction: 'Hidratação e fração lipídica',
    explanation: 'Para pães e tortas simples, a água substitui o leite perfeitamente, conferindo crosta mais crocante ao pão.'
  }
];

export function findChemicalSubstitution(ingredientName: string): ChemicalSubstitution | undefined {
  const norm = ingredientName.toLowerCase().trim();
  return CANONICAL_CHEMICAL_SUBSTITUTIONS.find(
    (sub) => norm.includes(sub.original) || sub.original.includes(norm)
  );
}
