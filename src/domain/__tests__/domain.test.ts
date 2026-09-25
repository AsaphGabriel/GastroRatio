import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  Grams,
  Milliliters,
  Density,
  BakersPercentage,
  ConvertUnitsUseCase,
  CalculateBakersPercentageUseCase,
  ScaleRecipeUseCase,
  FindRecipesByPantryUseCase,
  SanitizeAndParseRecipeUseCase,
  findChemicalSubstitution,
  Recipe
} from '../index.js';

describe('Value Objects', () => {
  test('Grams deve realizar operações e formatações com precisão', () => {
    const g1 = Grams.of(500);
    const g2 = Grams.of(250);

    assert.equal(g1.add(g2).toNumber(), 750);
    assert.equal(g1.subtract(g2).toNumber(), 250);
    assert.equal(g1.multiply(2).toNumber(), 1000);
    assert.equal(g1.divide(2).toNumber(), 250);
    assert.equal(g1.format(), '500 g');
    assert.equal(Grams.of(1500).format(), '1.5 kg');

    assert.throws(() => Grams.of(-10), /não pode ser negativa/);
    assert.throws(() => g2.subtract(g1), /massa negativa/);
  });

  test('Milliliters deve converter e formatar corretamente', () => {
    const ml = Milliliters.of(750);
    assert.equal(ml.toLiters(), 0.75);
    assert.equal(ml.format(), '750 ml');
    assert.equal(Milliliters.of(2500).format(), '2.5 L');
  });

  test('Density deve converter com exatidão física volume e massa', () => {
    const flourDensity = Density.of(0.50); // Farinha: 0.50 g/ml
    const volume = Milliliters.of(240); // 1 xícara = 240 ml
    const mass = flourDensity.toGrams(volume);

    assert.equal(mass.toNumber(), 120); // 240 * 0.5 = 120g

    const backToVolume = flourDensity.toMilliliters(mass);
    assert.equal(backToVolume.toNumber(), 240);
  });

  test('BakersPercentage deve calcular proporções em relação à base', () => {
    const bp = BakersPercentage.fromWeights(300, 500); // 300g água para 500g farinha
    assert.equal(bp.toNumber(), 60);
    assert.equal(bp.format(), '60%');
    assert.equal(bp.calculateWeight(1000), 600);
  });
});

describe('ConvertUnitsUseCase', () => {
  test('Deve converter 1 xícara de farinha de trigo para 120g', () => {
    const res = ConvertUnitsUseCase.execute('Farinha de Trigo', 1, 'cup');
    assert.equal(res.grams.toNumber(), 120);
  });

  test('Deve converter 1 xícara de açúcar refinado para 200g', () => {
    const res = ConvertUnitsUseCase.execute('Açúcar refinado', 1, 'cup');
    assert.equal(res.grams.toNumber(), 200); // 240 * 0.833 = ~200g
  });

  test('Deve converter 1 colher de sopa de sal para 18g', () => {
    const res = ConvertUnitsUseCase.execute('Sal', 1, 'tablespoon');
    assert.equal(res.grams.toNumber(), 18); // 15ml * 1.2 = 18g
  });

  test('Deve converter 1 colher de sopa de fermento químico para 14g', () => {
    const res = ConvertUnitsUseCase.execute('Fermento químico', 1, 'tablespoon');
    assert.equal(res.grams.toNumber(), 14); // 15ml * 0.93 = ~14g
  });
});

describe('CalculateBakersPercentageUseCase', () => {
  const pãoCaseiroIngredients = [
    { id: '1', name: 'Farinha de Trigo', amount: 500, unit: 'g' as const, isStaple: false, category: 'flour_grain' as const },
    { id: '2', name: 'Água', amount: 325, unit: 'g' as const, isStaple: true, category: 'liquid' as const },
    { id: '3', name: 'Sal', amount: 10, unit: 'g' as const, isStaple: true, category: 'staple_seasoning' as const },
    { id: '4', name: 'Fermento Biológico Seco', amount: 5, unit: 'g' as const, isStaple: false, category: 'leavening' as const }
  ];

  test('Farinha total deve ser rigorosamente 100% e hidratação calculada com precisão', () => {
    const result = CalculateBakersPercentageUseCase.execute(pãoCaseiroIngredients);

    assert.equal(result.totalFlourGrams.toNumber(), 500);
    assert.equal(result.hydrationPercentage.toNumber(), 65); // 325 / 500 = 65%
    assert.equal(result.totalDoughGrams.toNumber(), 840);

    const flour = result.ingredients.find((i) => i.isFlour)!;
    assert.equal(flour.bakersPercentage.toNumber(), 100);

    const sal = result.ingredients.find((i) => i.name === 'Sal')!;
    assert.equal(sal.bakersPercentage.toNumber(), 2); // 10 / 500 = 2%

    const fermento = result.ingredients.find((i) => i.name === 'Fermento Biológico Seco')!;
    assert.equal(fermento.bakersPercentage.toNumber(), 1); // 5 / 500 = 1%
  });

  test('scaleByTargetFlour deve redimensionar todos os pesos mantendo as proporções', () => {
    const scaled = CalculateBakersPercentageUseCase.scaleByTargetFlour(pãoCaseiroIngredients, 1000);

    const farinha = scaled.find((i) => i.name === 'Farinha de Trigo')!;
    const agua = scaled.find((i) => i.name === 'Água')!;
    const sal = scaled.find((i) => i.name === 'Sal')!;

    assert.equal(farinha.amount, 1000);
    assert.equal(agua.amount, 650);
    assert.equal(sal.amount, 20);
  });

  test('scaleByTargetDoughWeight deve calcular pesos para atingir massa final exata', () => {
    const scaled = CalculateBakersPercentageUseCase.scaleByTargetDoughWeight(pãoCaseiroIngredients, 1680); // Dobro de 840g

    const farinha = scaled.find((i) => i.name === 'Farinha de Trigo')!;
    const agua = scaled.find((i) => i.name === 'Água')!;

    assert.equal(farinha.amount, 1000);
    assert.equal(agua.amount, 650);
  });
});

describe('ScaleRecipeUseCase (Redimensionador Proporcional Dual)', () => {
  const receitaTeste: Recipe = {
    id: 'rec-1',
    title: 'Fricassê Simples',
    baseYield: 4,
    yieldUnit: 'porções',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    isBakingRecipe: false,
    ingredients: [
      { id: 'ing-frango', name: 'Peito de Frango', amount: 500, unit: 'g', isStaple: false, category: 'protein' },
      { id: 'ing-creme', name: 'Creme de Leite', amount: 200, unit: 'g', isStaple: false, category: 'dairy' },
      { id: 'ing-milho', name: 'Milho Verde', amount: 170, unit: 'g', isStaple: false, category: 'vegetable' },
      { id: 'ing-sal', name: 'Sal', amount: 5, unit: 'g', isStaple: true, category: 'staple_seasoning' }
    ],
    steps: ['Cozinhe o frango', 'Misture com o creme e milho'],
    tags: ['rápido', 'frango']
  };

  test('Deve redimensionar por número de porções (rendimento alvo)', () => {
    const scaled = ScaleRecipeUseCase.execute(receitaTeste, { type: 'yield', targetYield: 6 });

    assert.equal(scaled.scalingFactor, 1.5);
    assert.equal(scaled.recipe.baseYield, 6);

    const frango = scaled.scaledIngredients.find((i) => i.id === 'ing-frango')!;
    assert.equal(frango.amount, 750); // 500 * 1.5 = 750g

    const creme = scaled.scaledIngredients.find((i) => i.id === 'ing-creme')!;
    assert.equal(creme.amount, 300); // 200 * 1.5 = 300g
  });

  test('Deve redimensionar por ingrediente âncora travado', () => {
    // O usuário só tem 350g de frango na geladeira
    const scaled = ScaleRecipeUseCase.execute(receitaTeste, {
      type: 'anchor',
      anchorIngredientId: 'ing-frango',
      targetAmountGrams: 350
    });

    assert.equal(scaled.scalingFactor, 0.7); // 350 / 500 = 0.7
    assert.equal(scaled.recipe.baseYield, 2.8);

    const frango = scaled.scaledIngredients.find((i) => i.id === 'ing-frango')!;
    assert.equal(frango.amount, 350);

    const creme = scaled.scaledIngredients.find((i) => i.id === 'ing-creme')!;
    assert.equal(creme.amount, 140); // 200 * 0.7 = 140g

    const milho = scaled.scaledIngredients.find((i) => i.id === 'ing-milho')!;
    assert.equal(milho.amount, 119); // 170 * 0.7 = 119g
  });
});

describe('FindRecipesByPantryUseCase (Axioma da Despensa Básica)', () => {
  const receitasCatalogo: Recipe[] = [
    {
      id: 'r1',
      title: 'Omelete com Queijo e Tomate',
      baseYield: 1,
      yieldUnit: 'porção',
      prepTimeMinutes: 5,
      cookTimeMinutes: 5,
      isBakingRecipe: false,
      ingredients: [
        { id: '1', name: 'Ovos', amount: 3, unit: 'unit', isStaple: false, category: 'protein' },
        { id: '2', name: 'Tomate', amount: 60, unit: 'g', isStaple: false, category: 'vegetable' },
        { id: '3', name: 'Queijo Mussarela', amount: 40, unit: 'g', isStaple: false, category: 'dairy' },
        { id: '4', name: 'Sal', amount: 2, unit: 'g', isStaple: true, category: 'staple_seasoning' },
        { id: '5', name: 'Óleo', amount: 10, unit: 'g', isStaple: true, category: 'fat_oil' }
      ],
      steps: ['Bata os ovos e frite com o recheio'],
      tags: ['rápido']
    },
    {
      id: 'r2',
      title: 'Frango com Molho de Tomate',
      baseYield: 2,
      yieldUnit: 'porções',
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      isBakingRecipe: false,
      ingredients: [
        { id: '10', name: 'Peito de Frango', amount: 300, unit: 'g', isStaple: false, category: 'protein' },
        { id: '11', name: 'Tomate', amount: 120, unit: 'g', isStaple: false, category: 'vegetable' },
        { id: '12', name: 'Cebola', amount: 60, unit: 'g', isStaple: true, category: 'staple_seasoning' },
        { id: '13', name: 'Alho', amount: 10, unit: 'g', isStaple: true, category: 'staple_seasoning' },
        { id: '14', name: 'Sal', amount: 4, unit: 'g', isStaple: true, category: 'staple_seasoning' }
      ],
      steps: ['Refogue o frango com tomate'],
      tags: ['prato principal']
    }
  ];

  test('Deve identificar receitas 100% viáveis sem exigir cadastro de sal ou óleo', () => {
    // Usuário só marcou: Ovos, Tomate, Queijo (sem marcar sal nem óleo)
    const result = FindRecipesByPantryUseCase.execute(
      receitasCatalogo,
      ['Ovos', 'Tomate', 'Queijo Mussarela'],
      true // assumeBasicStaples = true
    );

    assert.equal(result.readyToCook.length, 1);
    assert.equal(result.readyToCook[0].recipe.title, 'Omelete com Queijo e Tomate');
  });

  test('Deve classificar em missingOne se faltar apenas 1 ingrediente perecível', () => {
    // Usuário só tem Peito de Frango (falta Tomate)
    const result = FindRecipesByPantryUseCase.execute(
      receitasCatalogo,
      ['Peito de Frango'],
      true
    );

    assert.equal(result.readyToCook.length, 0);
    assert.equal(result.missingOneIngredient.length, 1);
    assert.equal(result.missingOneIngredient[0].recipe.title, 'Frango com Molho de Tomate');
    assert.equal(result.missingOneIngredient[0].missingIngredients[0].name, 'Tomate');
  });
});

describe('SanitizeAndParseRecipeUseCase (Camada 1 - Parser Local)', () => {
  const boloCenouraTexto = `
Bolo de Cenoura Fofinho
Ingredientes:
- 2 xícaras de farinha de trigo
- 1 xícara de açúcar
- 3 unidades de cenoura
- 1 colher de sopa de fermento químico
- 1 pitada de sal

Modo de Preparo:
1. Bata as cenouras no liquidificador com os ovos e óleo.
2. Misture a farinha e o açúcar em uma tigela.
3. Adicione o fermento delicadamente e leve ao forno médio por 40 minutos.
`;

  test('Deve parsear texto brasileiro e converter xícaras/colheres para gramas com alta confiança', () => {
    const res = SanitizeAndParseRecipeUseCase.execute(boloCenouraTexto);

    assert.equal(res.recipe.title, 'Bolo de Cenoura Fofinho');
    assert.ok(res.confidence >= 0.8, 'Confiança deve ser >= 80%');
    assert.equal(res.source, 'local_deterministic');

    // 2 xícaras de farinha = 240g
    const farinha = res.recipe.ingredients.find((i) => i.name.toLowerCase().includes('farinha'));
    assert.ok(farinha, 'Farinha deve ter sido encontrada');
    assert.equal(farinha.amount, 240);
    assert.equal(farinha.unit, 'g');

    // 1 xícara de açúcar = 200g
    const acucar = res.recipe.ingredients.find((i) => i.name.toLowerCase().includes('açúcar'));
    assert.ok(acucar, 'Açúcar deve ter sido encontrado');
    assert.equal(acucar.amount, 200);

    // Sal e açúcar devem ser detectados com categorias e staple
    const sal = res.recipe.ingredients.find((i) => i.name.toLowerCase().includes('sal'));
    assert.ok(sal, 'Sal deve ter sido encontrado');
    assert.equal(sal.isStaple, true);

    // Passos de preparo
    assert.equal(res.recipe.steps.length, 3);
    assert.ok(res.recipe.steps[0].includes('liquidificador'));
  });

  test('Deve calcular Baker Percentage automaticamente se for receita de panificação', () => {
    const paoTexto = `
Pão Caseiro Rústico
Ingredientes:
500 g de farinha de trigo
325 g de água
10 g de sal
5 g de fermento biológico seco

Modo de preparo:
Misture a farinha e a água.
Sove por 10 minutos.
Asse a 220 graus.
`;
    const res = SanitizeAndParseRecipeUseCase.execute(paoTexto);
    assert.equal(res.recipe.isBakingRecipe, true);

    const farinha = res.recipe.ingredients.find((i) => i.name.toLowerCase().includes('farinha'))!;
    assert.equal(farinha.bakersPercentage, 100);

    const agua = res.recipe.ingredients.find((i) => i.name.toLowerCase().includes('água'))!;
    assert.equal(agua.bakersPercentage, 65);
  });

  test('Deve parsear PDF de impressão do TudoGostoso com 2 colunas, rendimento e ignorar utensílios', () => {
    const tudoGostosoPdfTexto = `
TudoGostoso > Categorias > Receitas > Receitas massas > Massa de panqueca simples
Massa de panqueca
simples
Por Yara
Quem resiste a uma pilha fofinha de panquecas douradas no café da
manhã? Com apenas cinco ingredientes básicos e em um piscar de
olhos, você pode preparar a massa de panqueca simples perfeita,
garantindo um café da manhã reforçado e delicioso em apenas 15
minutos! A simplicidade dessa receita é cativante: um ovo, uma xícara de
farinha de trigo, outra de leite, uma pitada de sal e uma colher de óleo é
tudo o que você precisa para criar essas panquecas irresistíveis.

Ingredientes (8 porções)
1 ovo 1 xícara de farinha de trigo
1 xícara de leite 1 pitada de sal
1 colher (sopa) de óleo

Utensílios
Ao clicar em comprar você será redirecionado para um site externo
15min Muito fácil Custo baixo
Liquidificador Pincel de silicone
Concha Frigideira funda
Prato raso 

Modo de preparo
Modo de preparo :
15min
Bata todos os ingredientes no liquidificador até obter uma
consistência cremosa.
1
Unte uma frigideira com óleo e despeje uma concha de massa. 2
Faça movimentos circulares para que a massa se espalhe por toda
a frigideira.
3
Espere até a massa se soltar do fundo, vire e deixe fritar do outro
lado.
4
Acrescente o recheio de sua preferência, enrole e está pronta para
servir.
5

Veja também…
Massa de panqueca
`;

    const res = SanitizeAndParseRecipeUseCase.execute(tudoGostosoPdfTexto);

    assert.equal(res.recipe.title, 'Massa de panqueca simples');
    assert.equal(res.recipe.baseYield, 8);
    assert.equal(res.recipe.yieldUnit, 'porções');
    assert.equal(res.recipe.ingredients.length, 5);

    const ovo = res.recipe.ingredients.find((i) => i.name.toLowerCase().includes('ovo'));
    assert.ok(ovo, 'Ovo deve ser encontrado');

    const farinha = res.recipe.ingredients.find((i) => i.name.toLowerCase().includes('farinha'));
    assert.ok(farinha, 'Farinha deve ser encontrada');
    assert.equal(farinha.amount, 120);

    const leite = res.recipe.ingredients.find((i) => i.name.toLowerCase().includes('leite'));
    assert.ok(leite, 'Leite deve ser encontrado');

    const sal = res.recipe.ingredients.find((i) => i.name.toLowerCase().includes('sal'));
    assert.ok(sal, 'Sal deve ser encontrado');

    const oleo = res.recipe.ingredients.find((i) => i.name.toLowerCase().includes('óleo'));
    assert.ok(oleo, 'Óleo deve ser encontrado');

    // Utensílios NÃO devem ter sido incluídos como ingredientes
    const liquidificador = res.recipe.ingredients.find((i) => i.name.toLowerCase().includes('liquidificador'));
    assert.ok(!liquidificador, 'Utensílios não devem virar ingredientes');

    // Passos de preparo consolidados
    assert.equal(res.recipe.steps.length, 5);
    assert.ok(res.recipe.steps[0].includes('liquidificador'));
    assert.ok(res.recipe.steps[4].includes('recheio'));
  });
});

describe('ChemicalSubstitutions (Substituições Físico-Químicas)', () => {
  test('Deve encontrar substituição para açúcar com alerta de água livre', () => {
    const sub = findChemicalSubstitution('Açúcar refinado');
    assert.ok(sub);
    assert.equal(sub.substitute, 'mel de abelha');
    assert.ok(sub.waterAdjustmentAlert?.includes('água livre'));
  });

  test('Deve encontrar substituição de fermento químico', () => {
    const sub = findChemicalSubstitution('fermento químico');
    assert.ok(sub);
    assert.ok(sub.substitute.includes('bicarbonato'));
  });

  test('Deve encontrar substituição de manteiga com redução de gordura', () => {
    const sub = findChemicalSubstitution('manteiga');
    assert.ok(sub);
    assert.ok(sub.ratio.includes('0.85x'));
  });
});

