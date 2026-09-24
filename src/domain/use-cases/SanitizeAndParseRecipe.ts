import '@magrinj/parse-ingredients/locale/pt';
import parse from '@magrinj/parse-ingredients';
import { Recipe, RecipeIngredient, UnitType, IngredientCategory } from '../schemas/recipe.schema.js';
import { ConvertUnitsUseCase } from './ConvertUnits.js';
import { CalculateBakersPercentageUseCase } from './CalculateBakersPercentage.js';

export interface ParseRecipeResult {
  recipe: Recipe;
  confidence: number; // 0.0 a 1.0
  source: 'local_deterministic' | 'ai_enhanced';
  unparsedLines: string[];
}

// Mapeamento de unidades brasileiras para o UnitType do GastroRatio
function mapToUnitType(parsedUnit: string | null, parsedSymbol: string | null): UnitType {
  const u = (parsedUnit || parsedSymbol || '').toLowerCase().trim();

  if (u === 'g' || u === 'grama' || u === 'gramas') return 'g';
  if (u === 'kg' || u === 'quilo' || u === 'quilos' || u === 'quilograma' || u === 'quilogramas') return 'kg';
  if (u === 'ml' || u === 'mililitro' || u === 'mililitros') return 'ml';
  if (u === 'l' || u === 'litro' || u === 'litros') return 'l';
  if (u.includes('xíc') || u.includes('copo') || u.includes('cup')) return 'cup';
  if (u.includes('sopa') || u === 'cs' || u.includes('tablespoon')) return 'tablespoon';
  if (u.includes('chá') || u === 'cc' || u.includes('café') || u.includes('sobremesa') || u.includes('teaspoon')) return 'teaspoon';

  return 'unit';
}

// Detectar categoria funcional e se é insumo da despensa básica
function categorizeIngredient(name: string): { category: IngredientCategory; isStaple: boolean } {
  const n = name.toLowerCase();

  // Despensa básica universal
  if (
    n.includes('sal') ||
    n.includes('óleo') ||
    n.includes('azeite') ||
    n.includes('alho') ||
    n.includes('cebola') ||
    n.includes('vinagre') ||
    n.includes('açúcar') ||
    n.includes('pimenta') ||
    n.includes('orégano')
  ) {
    if (n.includes('óleo') || n.includes('azeite')) return { category: 'fat_oil', isStaple: true };
    if (n.includes('açúcar')) return { category: 'sugar_sweetener', isStaple: true };
    return { category: 'staple_seasoning', isStaple: true };
  }

  // Farinhas e grãos
  if (n.includes('farinha') || n.includes('polvilho') || n.includes('fubá') || n.includes('amido') || n.includes('aveia') || n.includes('arroz') || n.includes('feijão') || n.includes('macarrão')) {
    return { category: 'flour_grain', isStaple: false };
  }

  // Proteínas
  if (n.includes('frango') || n.includes('carne') || n.includes('bife') || n.includes('ovo') || n.includes('peixe') || n.includes('calabresa') || n.includes('bacon') || n.includes('linguiça')) {
    return { category: 'protein', isStaple: false };
  }

  // Laticínios
  if (n.includes('queijo') || n.includes('mussarela') || n.includes('creme de leite') || n.includes('leite condensado') || n.includes('iogurte') || n.includes('requeijão') || n.includes('manteiga') || n.includes('margarina')) {
    if (n.includes('manteiga') || n.includes('margarina')) return { category: 'fat_oil', isStaple: false };
    return { category: 'dairy', isStaple: false };
  }

  // Líquidos
  if (n.includes('água') || n.includes('leite') || n.includes('suco') || n.includes('caldo')) {
    return { category: 'liquid', isStaple: false };
  }

  // Fermentos
  if (n.includes('fermento') || n.includes('bicarbonato')) {
    return { category: 'leavening', isStaple: false };
  }

  // Vegetais por padrão
  return { category: 'vegetable', isStaple: false };
}

/**
 * Caso de Uso: Sanitizador e Parser Local Determinístico de Receitas (Camada 1 da Cascata).
 * Converte textos colados da internet diretamente em JSON estruturado com gramas exatos.
 * Zero chamadas de API, zero chaves, 100% offline.
 */
export class SanitizeAndParseRecipeUseCase {
  public static execute(rawText: string): ParseRecipeResult {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      throw new Error('[Parser] O texto da receita está vazio.');
    }

    let title = 'Receita Importada';
    const ingredientLines: string[] = [];
    const stepLines: string[] = [];
    const unparsedLines: string[] = [];

    // Fases de leitura do texto
    type Section = 'header' | 'ingredients' | 'steps';
    let currentSection: Section = 'header';

    for (const line of lines) {
      const lower = line.toLowerCase().trim();

      // Detecção estrita de cabeçalhos de seção
      const isIngHeader =
        /^(ingredientes?|para a massa|para o recheio|ingredientes da cobertura|ingredientes do molho)[:\s]*$/i.test(lower) ||
        (lower.startsWith('ingrediente') && lower.length < 35);

      const isStepHeader =
        /^(modo de preparo|como fazer|instruções|preparo|modo de fazer|etapas|método)[:\s]*$/i.test(lower) ||
        (lower.startsWith('modo de preparo') && lower.length < 35);

      if (isIngHeader) {
        currentSection = 'ingredients';
        continue;
      }

      if (isStepHeader) {
        currentSection = 'steps';
        continue;
      }

      if (currentSection === 'header') {
        if (!title || title === 'Receita Importada') {
          title = line.replace(/^[#*-\s]+/, '').trim();
        } else {
          if (/^\d|xícara|colher|pitada|copo|[•\-*]/i.test(line)) {
            currentSection = 'ingredients';
            ingredientLines.push(line);
          }
        }
      } else if (currentSection === 'ingredients') {
        ingredientLines.push(line);
      } else if (currentSection === 'steps') {
        stepLines.push(line);
      }
    }

    // Se não encontrou divisão explícita, faz divisão heurística
    if (ingredientLines.length === 0 && stepLines.length === 0) {
      for (const line of lines) {
        if (/^\d|xícara|colher|pitada|copo|[•\-*]/i.test(line)) {
          ingredientLines.push(line);
        } else if (line.length > 20) {
          stepLines.push(line);
        }
      }
    }

    const ingredients: RecipeIngredient[] = [];
    let successfulParseCount = 0;

    for (let i = 0; i < ingredientLines.length; i++) {
      const rawLine = ingredientLines[i].replace(/^[•\-*]\s*/, '').trim();

      try {
        const parsed = parse(rawLine, { language: { from: 'pt', to: 'pt' } });

        if (parsed && parsed.ingredient) {
          const rawAmount = parsed.quantity ? parseFloat(parsed.quantity) : 1;
          const unit = mapToUnitType(parsed.unit, parsed.symbol);
          const { category, isStaple } = categorizeIngredient(parsed.ingredient);

          // Converte para gramas ou mililitros
          const conversion = ConvertUnitsUseCase.execute(parsed.ingredient, rawAmount, unit);

          ingredients.push({
            // Fix #8: crypto.randomUUID() em vez de índice sequencial [CWE-330]
            id: `ing-${crypto.randomUUID()}`,
            name: parsed.ingredient.charAt(0).toUpperCase() + parsed.ingredient.slice(1),
            amount: conversion.grams.toNumber(),
            unit: 'g',
            isStaple,
            category
          });

          successfulParseCount++;
        } else {
          unparsedLines.push(rawLine);
        }
      } catch {
        unparsedLines.push(rawLine);
      }
    }

    const confidence =
      ingredientLines.length > 0 ? successfulParseCount / ingredientLines.length : 0;

    // Higienização dos passos de preparo
    const steps = stepLines
      .map((s) => s.replace(/^\d+[\.\)\-]\s*/, '').trim())
      .filter((s) => s.length > 5);

    if (steps.length === 0) {
      steps.push('Misture os ingredientes e prepare conforme a receita tradicional.');
    }

    // Verifica se é receita de panificação
    const hasFlour = ingredients.some((ing) => ing.category === 'flour_grain');
    const hasLeavening = ingredients.some((ing) => ing.category === 'leavening');
    const isBakingRecipe = hasFlour && (hasLeavening || title.toLowerCase().includes('pão') || title.toLowerCase().includes('pizza'));

    // Se for panificação, calcula Baker's Percentage
    if (isBakingRecipe) {
      try {
        const bakers = CalculateBakersPercentageUseCase.execute(ingredients);
        for (const ing of ingredients) {
          const found = bakers.ingredients.find((b) => b.id === ing.id);
          if (found) {
            ing.bakersPercentage = found.bakersPercentage.toNumber();
          }
        }
      } catch {
        // ignora se faltar farinha
      }
    }

    const recipe: Recipe = {
      // Fix #8: crypto.randomUUID() em vez de Date.now() — previne colisões e enumeração [CWE-330]
      id: `rec-imported-${crypto.randomUUID()}`,
      title: title || 'Receita Importada da Internet',
      description: `Importada via parser local (${ingredients.length} ingredientes identificados em gramas).`,
      baseYield: 4,
      yieldUnit: 'porções',
      prepTimeMinutes: 15,
      cookTimeMinutes: 25,
      isBakingRecipe,
      ingredients,
      steps,
      tags: ['importada', isBakingRecipe ? 'panificação' : 'caseira']
    };

    return {
      recipe,
      confidence,
      source: 'local_deterministic',
      unparsedLines
    };
  }
}
