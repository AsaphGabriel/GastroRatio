import '@magrinj/parse-ingredients/locale/pt';
import parse from '@magrinj/parse-ingredients';
import { Recipe, RecipeIngredient, UnitType, IngredientCategory } from '../schemas/recipe.schema.js';
import { ConvertUnitsUseCase } from './ConvertUnits.js';
import { generateId } from '../../utils/id.js';
import { CalculateBakersPercentageUseCase } from './CalculateBakersPercentage.js';

export interface ParseRecipeResult {
  recipe: Recipe;
  confidence: number; // 0.0 a 1.0
  source: 'local_deterministic' | 'ai_enhanced';
  unparsedLines: string[];
}

// Normaliza medidas brasileiras com parênteses antes do parser (ex: "colher (sopa)" -> "colher de sopa")
function normalizeBrazilianMeasureUnits(line: string): string {
  return line
    .replace(/\bcolher(?:es)?\s*\(\s*sopa\s*\)/gi, (m) =>
      m.toLowerCase().startsWith('colheres') ? 'colheres de sopa' : 'colher de sopa'
    )
    .replace(/\bcolher(?:es)?\s*\(\s*chá\s*\)/gi, (m) =>
      m.toLowerCase().startsWith('colheres') ? 'colheres de chá' : 'colher de chá'
    )
    .replace(/\bcolher(?:es)?\s*\(\s*sobremesa\s*\)/gi, (m) =>
      m.toLowerCase().startsWith('colheres') ? 'colheres de sobremesa' : 'colher de sobremesa'
    )
    .replace(/\bcolher(?:es)?\s*\(\s*café\s*\)/gi, (m) =>
      m.toLowerCase().startsWith('colheres') ? 'colheres de café' : 'colher de café'
    )
    .replace(/\bxícaras?\s*\(\s*chá\s*\)/gi, (m) =>
      m.toLowerCase().startsWith('xícaras') ? 'xícaras' : 'xícara'
    )
    .replace(/\bxícaras?\s*\(\s*café\s*\)/gi, (m) =>
      m.toLowerCase().startsWith('xícaras') ? 'xícaras de café' : 'xícara de café'
    )
    .replace(/\bcopos?\s*\(\s*americano\s*\)/gi, 'copo')
    .replace(/\bcopos?\s*\(\s*requeijão\s*\)/gi, 'copo');
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

    let title = '';
    let baseYield = 4;
    let yieldUnit = 'porções';
    const ingredientLines: string[] = [];
    const stepLines: string[] = [];
    const unparsedLines: string[] = [];

    // Fases de leitura do texto
    type Section = 'header' | 'ingredients' | 'paused' | 'steps' | 'end';
    let currentSection: Section = 'header';

    const multiPattern =
      /(?<=[a-zA-Z\)])\s+(?=(?:\d+(?:[\d\/\.,\s]*(?:xícara|colher|pitada|copo|g|kg|ml|l|unidade|lata|dente|pacote|envelope|cs|cc)\b|\s*(?:ovo|ovos|gema|clara|pitada))))/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase().trim();

      // Detecção de cabeçalho de ingredientes (incluindo rendimento embutido, ex: "Ingredientes (8 porções)")
      const isIngHeader =
        /^ingredientes?(?:\s*\([^)]+\))?[:\s]*$/i.test(lower) ||
        (lower.startsWith('ingrediente') && lower.length < 35);

      // Detecção de cabeçalho de passos
      const isStepHeader =
        /^(modo de preparo|como fazer|instruções|preparo|modo de fazer|etapas|método)[:\s]*$/i.test(lower) ||
        (lower.startsWith('modo de preparo') && lower.length < 35);

      // Limites de parada
      const isIngStopBoundary =
        /^(utensílios|utensilios|equipamentos|material|tempo de preparo|para servir)[:\s]*$/i.test(lower);
      const isStepStopBoundary =
        /^(veja também|veja tambem|informações adicionais|outros tipos|denunciar|comentários|avaliações|tags|publicidade)[:\s]*/i.test(lower);

      if (isIngHeader) {
        currentSection = 'ingredients';
        // Extrai rendimento se presente no cabeçalho: "Ingredientes (8 porções)"
        const yieldMatch =
          line.match(/\((\d+)\s*(porç[õo]es|unidades|fatias|pessoas)?\)/i) ||
          line.match(/(?:rendimento|serve)[:\s]*(\d+)\s*(porç[õo]es|unidades|fatias|pessoas)?/i);
        if (yieldMatch) {
          baseYield = parseInt(yieldMatch[1], 10);
          if (yieldMatch[2]) yieldUnit = yieldMatch[2].toLowerCase();
        }
        continue;
      }

      if (isStepHeader) {
        currentSection = 'steps';
        continue;
      }

      if (currentSection === 'ingredients' && isIngStopBoundary) {
        currentSection = 'paused';
        continue;
      }

      if (currentSection === 'steps' && isStepStopBoundary) {
        currentSection = 'end';
        break;
      }

      if (currentSection === 'header') {
        // Trata breadcrumbs comuns de sites (ex: TudoGostoso > Categorias > Massas > Massa de panqueca simples)
        if (line.includes('>') || line.includes('»')) {
          const parts = line.split(/[>»]/).map((p) => p.trim());
          const candidate = parts[parts.length - 1];
          if (candidate.length > 3 && candidate.length < 80) {
            title = candidate;
          }
        } else if (!title && !lower.startsWith('por ') && !lower.includes('min') && line.length < 60) {
          title = line.replace(/^[#*-\s]+/, '').trim();
          // Se a próxima linha for curta e continuar o título (ex: "Massa de panqueca" \n "simples"), e não for cabeçalho
          if (
            i + 1 < lines.length &&
            lines[i + 1].length < 25 &&
            !lines[i + 1].toLowerCase().startsWith('por ') &&
            !lines[i + 1].toLowerCase().includes('min') &&
            !lines[i + 1].toLowerCase().startsWith('ingrediente') &&
            !lines[i + 1].toLowerCase().startsWith('modo') &&
            !lines[i + 1].includes('>')
          ) {
            title += ' ' + lines[i + 1].trim();
            i++;
          }
        } else {
          // Entrar em ingredientes sem cabeçalho explícito SOMENTE se for um item culinário legítimo
          const isStrictIngredientLine =
            (/^[•\-*]\s*\d+/i.test(line) ||
              /^\d+[\d\/\.,\s]*(?:xícara|colher|copo|g|kg|ml|l|unidade|lata|pitada)\b/i.test(line)) &&
            !/(?:minuto|minutos|ano|anos|hora|horas|dia|dias)\b/i.test(line);

          if (isStrictIngredientLine) {
            currentSection = 'ingredients';
            ingredientLines.push(line);
          }
        }
      } else if (currentSection === 'ingredients') {
        // Quebra linhas que contenham múltiplos ingredientes colados lado a lado (ex: 2 colunas do TudoGostoso)
        const splitItems = line.split(multiPattern).map((p) => p.trim()).filter((p) => p.length > 0);
        for (const item of splitItems) {
          // Filtra linhas vazias ou de navegação residual
          if (
            /^\d|xícara|colher|pitada|copo|[•\-*]/i.test(item) ||
            /^(sal|açúcar|óleo|azeite|farinha|leite|ovo|ovos|manteiga|fermento)\b/i.test(item)
          ) {
            ingredientLines.push(item);
          }
        }
      } else if (currentSection === 'steps') {
        // Ignora números soltos (badges como "1", "2") e metadados de tempo na seção de preparo
        if (/^\d+$/.test(line) || /^modo de preparo\s*:\s*\d+min/i.test(line) || /^\d+min$/i.test(line)) {
          continue;
        }

        // Limpa badges numéricos no início ou no fim da linha (ex: "Unte a frigideira... 2")
        const cleaned = line.replace(/^\d+[\.\)\-]?\s*/, '').replace(/\s+\d+$/, '').trim();
        if (cleaned.length > 0) {
          // Se a linha anterior não terminou com pontuação, une como continuação de frase
          if (stepLines.length > 0 && !/[.!?:]$/.test(stepLines[stepLines.length - 1])) {
            stepLines[stepLines.length - 1] += ' ' + cleaned;
          } else {
            stepLines.push(cleaned);
          }
        }
      }
    }

    // Fallback heurístico caso não haja cabeçalhos no texto
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
      const normalizedLine = normalizeBrazilianMeasureUnits(rawLine);

      try {
        const parsed = parse(normalizedLine, { language: { from: 'pt', to: 'pt' } });

        if (parsed && parsed.ingredient) {
          const rawAmount = parsed.quantity ? parseFloat(parsed.quantity) : 1;
          const unit = mapToUnitType(parsed.unit, parsed.symbol);

          // Remove qualificadores e parênteses residuais do nome (ex: "açúcar (chá)" -> "açúcar")
          let cleanIngredientName = parsed.ingredient
            .replace(/\s*\((?:chá|sopa|café|sobremesa|opcional|a gosto)\)/gi, '')
            .replace(/^[•\-*]\s*/, '')
            .trim();

          const { category, isStaple } = categorizeIngredient(cleanIngredientName);

          // Converte para gramas ou mililitros
          const conversion = ConvertUnitsUseCase.execute(cleanIngredientName, rawAmount, unit);

          ingredients.push({
            id: generateId('ing'),
            name: cleanIngredientName.charAt(0).toUpperCase() + cleanIngredientName.slice(1),
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
      id: generateId('rec-imported'),
      title: title || 'Receita Importada da Internet',
      description: `Importada via parser local (${ingredients.length} ingredientes identificados em gramas).`,
      baseYield,
      yieldUnit,
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
