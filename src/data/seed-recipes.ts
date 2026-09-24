import { Recipe } from '../domain/schemas/recipe.schema.js';

/**
 * Carga semente canônica com as 25 receitas populares brasileiras (ADR-06 / RF-10).
 * Calibradas em gramas exatos para uso com balança digital.
 */
export const SEED_CANONICAL_RECIPES: Recipe[] = [
  // 1. Panificação & Confeitaria
  {
    id: 'rec-01',
    title: 'Pão Caseiro de Forma Simples',
    description: 'Pão fofinho de forma inglesa com hidratação de 60%.',
    baseYield: 8,
    yieldUnit: 'fatias',
    prepTimeMinutes: 20,
    cookTimeMinutes: 35,
    isBakingRecipe: true,
    ingredients: [
      { id: 'ing-01-1', name: 'Farinha de Trigo', amount: 450, unit: 'g', isStaple: false, category: 'flour_grain', bakersPercentage: 100 },
      { id: 'ing-01-2', name: 'Água', amount: 270, unit: 'g', isStaple: true, category: 'liquid', bakersPercentage: 60 },
      { id: 'ing-01-3', name: 'Óleo Vegetal', amount: 27, unit: 'g', isStaple: true, category: 'fat_oil', bakersPercentage: 6 },
      { id: 'ing-01-4', name: 'Açúcar', amount: 22, unit: 'g', isStaple: true, category: 'sugar_sweetener', bakersPercentage: 5 },
      { id: 'ing-01-5', name: 'Sal', amount: 9, unit: 'g', isStaple: true, category: 'staple_seasoning', bakersPercentage: 2 },
      { id: 'ing-01-6', name: 'Fermento Biológico Seco', amount: 7, unit: 'g', isStaple: false, category: 'leavening', bakersPercentage: 1.5 }
    ],
    steps: [
      'Em uma tigela, misture a água morna, o fermento e o açúcar. Aguarde 5 minutos.',
      'Adicione a farinha, o óleo e o sal. Sove por 10 minutos até a massa ficar lisa.',
      'Deixe descansar por 45 minutos até dobrar de volume.',
      'Modele no formato de pão de forma e asse a 180°C por 35 minutos até dourar.'
    ],
    tags: ['pão', 'panificação', 'café da manhã']
  },
  {
    id: 'rec-02',
    title: 'Massa de Pizza de Frigideira ou Tabuleiro',
    description: 'Massa clássica de pizza com 62% de hidratação e crocância.',
    baseYield: 4,
    yieldUnit: 'porções',
    prepTimeMinutes: 15,
    cookTimeMinutes: 15,
    isBakingRecipe: true,
    ingredients: [
      { id: 'ing-02-1', name: 'Farinha de Trigo', amount: 300, unit: 'g', isStaple: false, category: 'flour_grain', bakersPercentage: 100 },
      { id: 'ing-02-2', name: 'Água', amount: 186, unit: 'g', isStaple: true, category: 'liquid', bakersPercentage: 62 },
      { id: 'ing-02-3', name: 'Azeite', amount: 12, unit: 'g', isStaple: true, category: 'fat_oil', bakersPercentage: 4 },
      { id: 'ing-02-4', name: 'Sal', amount: 6, unit: 'g', isStaple: true, category: 'staple_seasoning', bakersPercentage: 2 },
      { id: 'ing-02-5', name: 'Açúcar', amount: 6, unit: 'g', isStaple: true, category: 'sugar_sweetener', bakersPercentage: 2 },
      { id: 'ing-02-6', name: 'Fermento Biológico Seco', amount: 3, unit: 'g', isStaple: false, category: 'leavening', bakersPercentage: 1 },
      { id: 'ing-02-7', name: 'Queijo Mussarela', amount: 150, unit: 'g', isStaple: false, category: 'dairy' },
      { id: 'ing-02-8', name: 'Molho de Tomate', amount: 80, unit: 'g', isStaple: false, category: 'vegetable' }
    ],
    steps: [
      'Misture farinha, fermento, açúcar, sal, azeite e adicione a água aos poucos.',
      'Sove levemente até obter uma massa elástica. Divida em discos e abra fininho.',
      'Doure um lado na frigideira, vire, adicione o molho e a mussarela e tampe até derreter.'
    ],
    tags: ['pizza', 'lanche', 'rápido']
  },
  {
    id: 'rec-03',
    title: 'Pão de Queijo Mineiro de Polvilho e Mussarela',
    description: 'Pão de queijo caseiro crocante por fora e puxa-puxa por dentro.',
    baseYield: 20,
    yieldUnit: 'unidades',
    prepTimeMinutes: 20,
    cookTimeMinutes: 25,
    isBakingRecipe: true,
    ingredients: [
      { id: 'ing-03-1', name: 'Polvilho Doce', amount: 250, unit: 'g', isStaple: false, category: 'flour_grain', bakersPercentage: 100 },
      { id: 'ing-03-2', name: 'Queijo Mussarela', amount: 150, unit: 'g', isStaple: false, category: 'dairy', bakersPercentage: 60 },
      { id: 'ing-03-3', name: 'Leite', amount: 125, unit: 'g', isStaple: false, category: 'liquid', bakersPercentage: 50 },
      { id: 'ing-03-4', name: 'Ovos', amount: 100, unit: 'g', isStaple: false, category: 'protein', bakersPercentage: 40 },
      { id: 'ing-03-5', name: 'Óleo Vegetal', amount: 60, unit: 'g', isStaple: true, category: 'fat_oil', bakersPercentage: 24 },
      { id: 'ing-03-6', name: 'Sal', amount: 5, unit: 'g', isStaple: true, category: 'staple_seasoning', bakersPercentage: 2 }
    ],
    steps: [
      'Ferva o leite com o óleo e o sal.',
      'Escalde o polvilho em uma tigela mexendo bem até esfriar.',
      'Adicione os ovos um a um e por fim o queijo ralado.',
      'Modele bolinhas com as mãos untadas e asse a 200°C por 25 minutos.'
    ],
    tags: ['pão de queijo', 'sem glúten', 'café']
  },
  {
    id: 'rec-04',
    title: 'Pão de Minuto sem Fermento Biológico',
    description: 'Biscoitinho salgado rápido pronto em 15 minutos.',
    baseYield: 8,
    yieldUnit: 'unidades',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    isBakingRecipe: true,
    ingredients: [
      { id: 'ing-04-1', name: 'Farinha de Trigo', amount: 240, unit: 'g', isStaple: false, category: 'flour_grain', bakersPercentage: 100 },
      { id: 'ing-04-2', name: 'Leite', amount: 120, unit: 'g', isStaple: false, category: 'liquid', bakersPercentage: 50 },
      { id: 'ing-04-3', name: 'Manteiga', amount: 36, unit: 'g', isStaple: false, category: 'fat_oil', bakersPercentage: 15 },
      { id: 'ing-04-4', name: 'Fermento Químico', amount: 10, unit: 'g', isStaple: false, category: 'leavening', bakersPercentage: 4.2 },
      { id: 'ing-04-5', name: 'Açúcar', amount: 6, unit: 'g', isStaple: true, category: 'sugar_sweetener', bakersPercentage: 2.5 },
      { id: 'ing-04-6', name: 'Sal', amount: 5, unit: 'g', isStaple: true, category: 'staple_seasoning', bakersPercentage: 2 }
    ],
    steps: [
      'Misture os secos, esfarele a manteiga e dê o ponto com o leite.',
      'Modele pãezinhos redondos e asse a 200°C por 15 minutos até corar.'
    ],
    tags: ['pão', 'rápido', 'café']
  },
  {
    id: 'rec-05',
    title: 'Bolo Caseiro de Cenoura com Calda de Chocolate',
    description: 'O clássico bolo fofo de liquidificador com casquinha crocante.',
    baseYield: 8,
    yieldUnit: 'fatias',
    prepTimeMinutes: 15,
    cookTimeMinutes: 40,
    isBakingRecipe: true,
    ingredients: [
      { id: 'ing-05-1', name: 'Cenoura', amount: 200, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-05-2', name: 'Ovos', amount: 150, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-05-3', name: 'Óleo Vegetal', amount: 160, unit: 'g', isStaple: true, category: 'fat_oil' },
      { id: 'ing-05-4', name: 'Açúcar', amount: 300, unit: 'g', isStaple: true, category: 'sugar_sweetener' },
      { id: 'ing-05-5', name: 'Farinha de Trigo', amount: 240, unit: 'g', isStaple: false, category: 'flour_grain' },
      { id: 'ing-05-6', name: 'Fermento Químico', amount: 12, unit: 'g', isStaple: false, category: 'leavening' },
      { id: 'ing-05-7', name: 'Achocolatado', amount: 80, unit: 'g', isStaple: false, category: 'flour_grain' }
    ],
    steps: [
      'Bata no liquidificador a cenoura, os ovos e o óleo até homogeneizar.',
      'Transfira para uma tigela, misture o açúcar e a farinha peneirada. Adicione o fermento por último.',
      'Asse a 180°C por 40 minutos. Ferva o achocolatado com açúcar e manteiga para cobrir.'
    ],
    tags: ['bolo', 'doce', 'sobremesa']
  },
  {
    id: 'rec-06',
    title: 'Bolo Simples de Fubá com Erva-Doce',
    description: 'Bolo caipira tradicional com aroma de erva-doce.',
    baseYield: 8,
    yieldUnit: 'fatias',
    prepTimeMinutes: 15,
    cookTimeMinutes: 35,
    isBakingRecipe: true,
    ingredients: [
      { id: 'ing-06-1', name: 'Fubá', amount: 150, unit: 'g', isStaple: false, category: 'flour_grain' },
      { id: 'ing-06-2', name: 'Farinha de Trigo', amount: 120, unit: 'g', isStaple: false, category: 'flour_grain' },
      { id: 'ing-06-3', name: 'Açúcar', amount: 250, unit: 'g', isStaple: true, category: 'sugar_sweetener' },
      { id: 'ing-06-4', name: 'Ovos', amount: 150, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-06-5', name: 'Leite', amount: 240, unit: 'g', isStaple: false, category: 'liquid' },
      { id: 'ing-06-6', name: 'Óleo Vegetal', amount: 100, unit: 'g', isStaple: true, category: 'fat_oil' },
      { id: 'ing-06-7', name: 'Fermento Químico', amount: 12, unit: 'g', isStaple: false, category: 'leavening' }
    ],
    steps: [
      'Bata ovos, leite, óleo e açúcar no liquidificador.',
      'Misture o fubá e a farinha até formar massa lisa. Agregue o fermento.',
      'Despeje em forma untada com furo central e asse a 180°C por 35 minutos.'
    ],
    tags: ['bolo', 'fubá', 'café']
  },

  // 2. Refeições Práticas de Frigideira
  {
    id: 'rec-07',
    title: 'Omelete Rápida com Queijo e Tomate',
    description: 'Refeição nutritiva pronta em menos de 10 minutos.',
    baseYield: 1,
    yieldUnit: 'porção',
    prepTimeMinutes: 3,
    cookTimeMinutes: 5,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-07-1', name: 'Ovos', amount: 150, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-07-2', name: 'Tomate', amount: 60, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-07-3', name: 'Queijo Mussarela', amount: 40, unit: 'g', isStaple: false, category: 'dairy' },
      { id: 'ing-07-4', name: 'Sal', amount: 2, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-07-5', name: 'Óleo Vegetal', amount: 8, unit: 'g', isStaple: true, category: 'fat_oil' }
    ],
    steps: [
      'Bata os ovos vigorosamente com o sal em um prato.',
      'Aqueça o óleo em frigideira antiaderente, despeje os ovos e adicione tomate e queijo picados.',
      'Dobre ao meio quando o fundo dourar e sirva imediatamente.'
    ],
    tags: ['rápido', 'ovos', 'proteína']
  },
  {
    id: 'rec-08',
    title: 'Panqueca Clássica de Carne Moída',
    description: 'Massa fina leve recheada com carne moída bem temperada.',
    baseYield: 3,
    yieldUnit: 'porções',
    prepTimeMinutes: 20,
    cookTimeMinutes: 20,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-08-1', name: 'Carne Moída', amount: 300, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-08-2', name: 'Farinha de Trigo', amount: 150, unit: 'g', isStaple: false, category: 'flour_grain' },
      { id: 'ing-08-3', name: 'Leite', amount: 240, unit: 'g', isStaple: false, category: 'liquid' },
      { id: 'ing-08-4', name: 'Ovos', amount: 100, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-08-5', name: 'Molho de Tomate', amount: 100, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-08-6', name: 'Cebola', amount: 60, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-08-7', name: 'Alho', amount: 10, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-08-8', name: 'Sal', amount: 6, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Bata farinha, leite, ovos e sal no liquidificador para a massa.',
      'Faça discos finos na frigideira untada.',
      'Refogue a carne com cebola, alho e molho de tomate.',
      'Enrole as panquecas e sirva com molho por cima.'
    ],
    tags: ['panqueca', 'carne moída', 'almoço']
  },
  {
    id: 'rec-09',
    title: 'Torta Salgada de Liquidificador de Frango e Milho',
    description: 'A clássica torta de tabuleiro fofinha e recheada.',
    baseYield: 6,
    yieldUnit: 'porções',
    prepTimeMinutes: 20,
    cookTimeMinutes: 40,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-09-1', name: 'Peito de Frango', amount: 300, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-09-2', name: 'Milho Verde', amount: 170, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-09-3', name: 'Farinha de Trigo', amount: 240, unit: 'g', isStaple: false, category: 'flour_grain' },
      { id: 'ing-09-4', name: 'Leite', amount: 300, unit: 'g', isStaple: false, category: 'liquid' },
      { id: 'ing-09-5', name: 'Ovos', amount: 150, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-09-6', name: 'Óleo Vegetal', amount: 120, unit: 'g', isStaple: true, category: 'fat_oil' },
      { id: 'ing-09-7', name: 'Fermento Químico', amount: 12, unit: 'g', isStaple: false, category: 'leavening' },
      { id: 'ing-09-8', name: 'Tomate', amount: 100, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-09-9', name: 'Sal', amount: 6, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Bata leite, ovos, óleo, farinha e fermento no liquidificador.',
      'Espalhe metade da massa em assadeira untada, cubra com o frango desfiado, milho e tomate temperados.',
      'Cubra com o restante da massa e asse a 180°C por 40 minutos.'
    ],
    tags: ['torta', 'frango', 'lanche']
  },
  {
    id: 'rec-10',
    title: 'Farofa Crocante de Ovos e Cebola Dourada',
    description: 'Acompanhamento brasileiro essencial pronto em 10 minutos.',
    baseYield: 4,
    yieldUnit: 'porções',
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-10-1', name: 'Farinha de Mandioca', amount: 200, unit: 'g', isStaple: false, category: 'flour_grain' },
      { id: 'ing-10-2', name: 'Ovos', amount: 150, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-10-3', name: 'Cebola', amount: 100, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-10-4', name: 'Manteiga', amount: 40, unit: 'g', isStaple: false, category: 'fat_oil' },
      { id: 'ing-10-5', name: 'Sal', amount: 4, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Derreta a manteiga na frigideira e doure a cebola fatiada.',
      'Quebre os ovos diretamente na panela e mexa até coagularem em pedaços grandes.',
      'Junte a farinha de mandioca e o sal, mexendo em fogo baixo até tostar e ficar crocante.'
    ],
    tags: ['farofa', 'acompanhamento', 'ovos']
  },

  // 3. Pratos Principais Caseiros
  {
    id: 'rec-11',
    title: 'Fricassê Rápido de Frango com Creme de Milho',
    description: 'Prato reconfortante cremoso assado com queijo derretido.',
    baseYield: 4,
    yieldUnit: 'porções',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-11-1', name: 'Peito de Frango', amount: 450, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-11-2', name: 'Creme de Leite', amount: 200, unit: 'g', isStaple: false, category: 'dairy' },
      { id: 'ing-11-3', name: 'Milho Verde', amount: 170, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-11-4', name: 'Queijo Mussarela', amount: 80, unit: 'g', isStaple: false, category: 'dairy' },
      { id: 'ing-11-5', name: 'Molho de Tomate', amount: 100, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-11-6', name: 'Cebola', amount: 60, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-11-7', name: 'Sal', amount: 6, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Bata o milho com o creme de leite no liquidificador.',
      'Refogue a cebola no azeite, adicione o frango desfiado, o molho e o creme batido.',
      'Transfira para refratário, cubra com a mussarela e gratine no forno por 15 minutos.'
    ],
    tags: ['fricassê', 'frango', 'cremoso']
  },
  {
    id: 'rec-12',
    title: 'Estrogonofe Rápido de Frango',
    description: 'O clássico preferido do almoço em família.',
    baseYield: 4,
    yieldUnit: 'porções',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-12-1', name: 'Peito de Frango', amount: 500, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-12-2', name: 'Creme de Leite', amount: 200, unit: 'g', isStaple: false, category: 'dairy' },
      { id: 'ing-12-3', name: 'Molho de Tomate', amount: 60, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-12-4', name: 'Cebola', amount: 80, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-12-5', name: 'Alho', amount: 10, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-12-6', name: 'Óleo Vegetal', amount: 20, unit: 'g', isStaple: true, category: 'fat_oil' },
      { id: 'ing-12-7', name: 'Sal', amount: 6, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Doure o frango em cubos no óleo quente em fogo alto.',
      'Adicione a cebola e o alho e refogue até murchar.',
      'Acrescente o molho de tomate, abaixe o fogo, adicione o creme de leite e desligue antes de ferver.'
    ],
    tags: ['estrogonofe', 'frango', 'almoço']
  },
  {
    id: 'rec-13',
    title: 'Picadinho de Carne com Batata e Cenoura',
    description: 'Carne macia ensopada com legumes tenros.',
    baseYield: 4,
    yieldUnit: 'porções',
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-13-1', name: 'Carne Bovina', amount: 400, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-13-2', name: 'Batata', amount: 300, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-13-3', name: 'Cenoura', amount: 150, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-13-4', name: 'Tomate', amount: 100, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-13-5', name: 'Cebola', amount: 80, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-13-6', name: 'Alho', amount: 12, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-13-7', name: 'Sal', amount: 7, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Sele a carne em cubos na panela de pressão com óleo.',
      'Junte alho, cebola e tomate refogando bem.',
      'Adicione os legumes e água quente até cobrir. Cozinhe na pressão por 15 minutos.'
    ],
    tags: ['carne', 'ensopado', 'legumes']
  },
  {
    id: 'rec-14',
    title: 'Escondidinho de Carne Moída com Purê de Batata',
    description: 'Camadas generosas de purê aveludado e carne suculenta.',
    baseYield: 4,
    yieldUnit: 'porções',
    prepTimeMinutes: 25,
    cookTimeMinutes: 20,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-14-1', name: 'Carne Moída', amount: 400, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-14-2', name: 'Batata', amount: 600, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-14-3', name: 'Leite', amount: 120, unit: 'g', isStaple: false, category: 'liquid' },
      { id: 'ing-14-4', name: 'Queijo Mussarela', amount: 50, unit: 'g', isStaple: false, category: 'dairy' },
      { id: 'ing-14-5', name: 'Manteiga', amount: 30, unit: 'g', isStaple: false, category: 'fat_oil' },
      { id: 'ing-14-6', name: 'Cebola', amount: 80, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-14-7', name: 'Sal', amount: 8, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Cozinhe as batatas e amasse com leite e manteiga para fazer o purê.',
      'Refogue a carne com cebola, alho e sal.',
      'Monte no refratário: metade do purê, carne moída, restante do purê e finalize com mussarela.',
      'Leve ao forno para gratinar por 15 minutos.'
    ],
    tags: ['escondidinho', 'batata', 'carne moída']
  },
  {
    id: 'rec-15',
    title: 'Bife Acebolado com Molho Ferrugem',
    description: 'Bife suculento de frigideira com cebolas caramelizadas no fundo.',
    baseYield: 2,
    yieldUnit: 'porções',
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-15-1', name: 'Bife Bovino', amount: 300, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-15-2', name: 'Cebola', amount: 150, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-15-3', name: 'Alho', amount: 8, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-15-4', name: 'Óleo Vegetal', amount: 20, unit: 'g', isStaple: true, category: 'fat_oil' },
      { id: 'ing-15-5', name: 'Vinagre', amount: 10, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-15-6', name: 'Sal', amount: 4, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Tempere os bifes com alho amassado e sal.',
      'Frite na frigideira bem quente até dourar os dois lados e reserve.',
      'Na mesma frigideira, junte a cebola em rodelas e o vinagre, raspando o fundo dourado para criar o molho.'
    ],
    tags: ['bife', 'carne', 'rápido']
  },
  {
    id: 'rec-16',
    title: 'Filé de Frango Grelhado com Vinagrete Fresco',
    description: 'Frango suculento e leve com vinagrete crocante de tomate.',
    baseYield: 2,
    yieldUnit: 'porções',
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-16-1', name: 'Peito de Frango', amount: 350, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-16-2', name: 'Tomate', amount: 120, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-16-3', name: 'Cebola', amount: 80, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-16-4', name: 'Vinagre', amount: 20, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-16-5', name: 'Azeite', amount: 20, unit: 'g', isStaple: true, category: 'fat_oil' },
      { id: 'ing-16-6', name: 'Sal', amount: 5, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Grelhe os filés na frigideira bem quente com azeite até dourarem.',
      'Pique o tomate e cebola em cubinhos, tempere com vinagre, azeite e sal.',
      'Sirva o vinagrete fresco sobre os filés quentes.'
    ],
    tags: ['frango', 'saudável', 'rápido']
  },

  // 4. Massas & Molhos Populares
  {
    id: 'rec-17',
    title: 'Macarrão Alho e Óleo com Calabresa',
    description: 'Massa saborosa e rápida para jantares práticos.',
    baseYield: 3,
    yieldUnit: 'porções',
    prepTimeMinutes: 5,
    cookTimeMinutes: 12,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-17-1', name: 'Macarrão', amount: 250, unit: 'g', isStaple: false, category: 'flour_grain' },
      { id: 'ing-17-2', name: 'Linguiça Calabresa', amount: 150, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-17-3', name: 'Alho', amount: 20, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-17-4', name: 'Óleo Vegetal', amount: 35, unit: 'g', isStaple: true, category: 'fat_oil' },
      { id: 'ing-17-5', name: 'Sal', amount: 10, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Cozinhe o macarrão em água fervente com sal.',
      'Em frigideira larga, frite a calabresa e em seguida doure as lâminas de alho no óleo.',
      'Junte a massa cozida al dente diretamente na frigideira com 2 colheres da água do cozimento.'
    ],
    tags: ['macarrão', 'calabresa', 'rápido']
  },
  {
    id: 'rec-18',
    title: 'Macarrão com Carne Moída ao Sugo',
    description: 'O clássico molho bolonhesa caseiro encorpado.',
    baseYield: 4,
    yieldUnit: 'porções',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-18-1', name: 'Macarrão', amount: 350, unit: 'g', isStaple: false, category: 'flour_grain' },
      { id: 'ing-18-2', name: 'Carne Moída', amount: 300, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-18-3', name: 'Molho de Tomate', amount: 200, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-18-4', name: 'Cebola', amount: 80, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-18-5', name: 'Alho', amount: 12, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-18-6', name: 'Sal', amount: 8, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Doure a carne moída, junte cebola e alho.',
      'Adicione o molho de tomate e deixe apurar em fogo brando por 15 minutos.',
      'Cozinhe o macarrão e envolva no molho quente.'
    ],
    tags: ['macarrão', 'carne moída', 'almoço']
  },

  // 5. Bases da Cozinha Brasileira & Caldos
  {
    id: 'rec-19',
    title: 'Arroz Branco Soltinho Perfeito',
    description: 'Proporção 1:2 precisa em peso para grãos soltos e brilhantes.',
    baseYield: 4,
    yieldUnit: 'porções',
    prepTimeMinutes: 5,
    cookTimeMinutes: 15,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-19-1', name: 'Arroz Branco', amount: 200, unit: 'g', isStaple: false, category: 'flour_grain' },
      { id: 'ing-19-2', name: 'Água', amount: 400, unit: 'g', isStaple: true, category: 'liquid' },
      { id: 'ing-19-3', name: 'Alho', amount: 10, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-19-4', name: 'Óleo Vegetal', amount: 15, unit: 'g', isStaple: true, category: 'fat_oil' },
      { id: 'ing-19-5', name: 'Sal', amount: 4, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Refogue o alho picado no óleo até perfumar sem queimar.',
      'Adicione o arroz e refogue por 2 minutos até os grãos ficarem esbranquiçados.',
      'Despeje a água fervente e o sal. Cozinhe em fogo baixo com a panela semitampada até secar.'
    ],
    tags: ['arroz', 'básico', 'dia a dia']
  },
  {
    id: 'rec-20',
    title: 'Feijão Carioca Caseiro Cremoso',
    description: 'Feijão com caldo espesso, perfumado com alho e louro.',
    baseYield: 6,
    yieldUnit: 'porções',
    prepTimeMinutes: 10,
    cookTimeMinutes: 30,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-20-1', name: 'Feijão Carioca', amount: 250, unit: 'g', isStaple: false, category: 'flour_grain' },
      { id: 'ing-20-2', name: 'Água', amount: 1200, unit: 'g', isStaple: true, category: 'liquid' },
      { id: 'ing-20-3', name: 'Cebola', amount: 60, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-20-4', name: 'Alho', amount: 15, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-20-5', name: 'Óleo Vegetal', amount: 20, unit: 'g', isStaple: true, category: 'fat_oil' },
      { id: 'ing-20-6', name: 'Sal', amount: 6, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Cozinhe o feijão com água na panela de pressão por 25 minutos após o apito.',
      'Em outra panela, doure o alho e cebola no óleo.',
      'Adicione 2 conchas de grãos, amasse com as costas da concha para engrossar o caldo e devolva tudo à panela fervendo por 5 minutos com sal.'
    ],
    tags: ['feijão', 'básico', 'dia a dia']
  },
  {
    id: 'rec-21',
    title: 'Purê de Batata Cremoso Simples',
    description: 'Purê aveludado e suave que combina com qualquer prato.',
    baseYield: 3,
    yieldUnit: 'porções',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-21-1', name: 'Batata', amount: 500, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-21-2', name: 'Leite', amount: 100, unit: 'g', isStaple: false, category: 'liquid' },
      { id: 'ing-21-3', name: 'Manteiga', amount: 30, unit: 'g', isStaple: false, category: 'fat_oil' },
      { id: 'ing-21-4', name: 'Sal', amount: 4, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Cozinhe as batatas descascadas em água com sal até ficarem bem macias.',
      'Escorra e amasse ainda quentes.',
      'Volte à panela em fogo baixo, junte o leite morno e a manteiga, batendo com colher até ficar liso e cremoso.'
    ],
    tags: ['purê', 'batata', 'acompanhamento']
  },
  {
    id: 'rec-22',
    title: 'Batata Rústica Assada na Airfryer',
    description: 'Batata crocante por fora e macia por dentro com ervas.',
    baseYield: 3,
    yieldUnit: 'porções',
    prepTimeMinutes: 5,
    cookTimeMinutes: 20,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-22-1', name: 'Batata', amount: 450, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-22-2', name: 'Azeite', amount: 20, unit: 'g', isStaple: true, category: 'fat_oil' },
      { id: 'ing-22-3', name: 'Alho', amount: 10, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-22-4', name: 'Sal', amount: 4, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Lave bem as batatas e corte em gomos mantendo a casca.',
      'Envolva no azeite, alho triturado e sal.',
      'Asse na Airfryer a 200°C por 20 minutos, agitando o cesto na metade do tempo.'
    ],
    tags: ['batata', 'airfryer', 'petisco']
  },
  {
    id: 'rec-23',
    title: 'Caldo Verde Econômico com Calabresa',
    description: 'Sopa cremosa e aconchegante para dias frios.',
    baseYield: 4,
    yieldUnit: 'porções',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-23-1', name: 'Batata', amount: 600, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-23-2', name: 'Linguiça Calabresa', amount: 200, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-23-3', name: 'Couve', amount: 100, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-23-4', name: 'Água', amount: 1000, unit: 'g', isStaple: true, category: 'liquid' },
      { id: 'ing-23-5', name: 'Cebola', amount: 80, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-23-6', name: 'Alho', amount: 12, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-23-7', name: 'Sal', amount: 5, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Cozinhe as batatas com a água e sal até desmancharem. Bata no liquidificador para formar a base cremosa.',
      'Em uma panela, frite a calabresa em rodelas com alho e cebola.',
      'Despeje o creme de batata na panela com a calabresa, junte a couve fatiada e cozinhe por 3 minutos.'
    ],
    tags: ['sopa', 'caldo verde', 'inverno']
  },
  {
    id: 'rec-24',
    title: 'Sopa de Legumes com Macarrão e Frango',
    description: 'Refeição única completa, nutritiva e restauradora.',
    baseYield: 4,
    yieldUnit: 'porções',
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-24-1', name: 'Peito de Frango', amount: 250, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-24-2', name: 'Batata', amount: 200, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-24-3', name: 'Cenoura', amount: 150, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-24-4', name: 'Macarrão', amount: 100, unit: 'g', isStaple: false, category: 'flour_grain' },
      { id: 'ing-24-5', name: 'Água', amount: 1200, unit: 'g', isStaple: true, category: 'liquid' },
      { id: 'ing-24-6', name: 'Cebola', amount: 60, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-24-7', name: 'Alho', amount: 10, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-24-8', name: 'Sal', amount: 7, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Refogue o frango em cubinhos com cebola e alho.',
      'Adicione a batata, cenoura e água quente com sal.',
      'Quando os legumes estiverem casi macios, junte o macarrão e cozinhe por mais 8 minutos.'
    ],
    tags: ['sopa', 'legumes', 'frango']
  },
  {
    id: 'rec-25',
    title: 'Baião de Dois Simples de Sobras',
    description: 'Aproveitamento perfeito de arroz e feijão do dia anterior.',
    baseYield: 4,
    yieldUnit: 'porções',
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-25-1', name: 'Arroz Branco', amount: 300, unit: 'g', isStaple: false, category: 'flour_grain' },
      { id: 'ing-25-2', name: 'Feijão Carioca', amount: 250, unit: 'g', isStaple: false, category: 'flour_grain' },
      { id: 'ing-25-3', name: 'Linguiça Calabresa', amount: 150, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-25-4', name: 'Queijo Mussarela', amount: 100, unit: 'g', isStaple: false, category: 'dairy' },
      { id: 'ing-25-5', name: 'Cebola', amount: 80, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-25-6', name: 'Alho', amount: 12, unit: 'g', isStaple: true, category: 'staple_seasoning' },
      { id: 'ing-25-7', name: 'Sal', amount: 3, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: [
      'Frite a calabresa em cubinhos na panela até dourar, junte cebola e alho.',
      'Adicione o feijão cozido (sem muito caldo) e em seguida o arroz cozido.',
      'Mexa bem em fogo baixo para esquentar por igual, adicione os cubos de queijo e tampe até derreter.'
    ],
    tags: ['baião de dois', 'sobras', 'aproveitamento']
  }
];
