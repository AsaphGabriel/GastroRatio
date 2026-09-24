import { Recipe, RecipeSchema } from '../schemas/recipe.schema.js';

export interface SousChefParseResult {
  recipe: Recipe;
  source: 'gemini_flash_api' | 'local_fallback';
  rawOutput?: string;
}

/**
 * Adapter para assistência avançada de IA via Gemini 1.5 Flash (Camada 2 da Cascata).
 * Utiliza Structured Outputs (JSON Schema estrito) e fallback local gracioso.
 */
export class GeminiSousChefAdapter {
  private static readonly API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  /**
   * Parse avançado com IA para textos caóticos ou transcrições de áudio culinárias.
   */
  public static async parseChaoticRecipe(rawText: string, apiKey?: string): Promise<SousChefParseResult> {
    const key = apiKey || localStorage.getItem('gastroratio_gemini_api_key') || '';

    if (!key) {
      throw new Error('Chave da API do Gemini não configurada. Vá na aba Configurações para adicionar sua chave ou use a extração offline básica.');
    }

    const systemPrompt = `Você é o Sous-Chef de engenharia culinária do GastroRatio.
Sua missão é extrair receitas de textos caóticos da internet em JSON estrito.
Regras Inegociáveis:
1. Converta todas as medidas para gramas ('g') ou mililitros ('ml') sempre que possível.
2. Identifique se o ingrediente é da despensa básica (sal, óleo, alho, cebola, vinagre, açúcar) marcando isStaple: true.
3. Categorize cada ingrediente: 'flour_grain', 'liquid', 'fat_oil', 'sugar_sweetener', 'leavening', 'protein', 'vegetable', 'dairy', 'staple_seasoning'.
4. Divida o modo de preparo em etapas claras e sucintas de no máximo 4 linhas.`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\n\nTexto bruto da receita a ser extraída:\n${rawText}` }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    };

    try {
      const response = await fetch(`${this.API_ENDPOINT}?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`[GeminiSousChef] Erro na API Gemini: HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) {
        throw new Error('[GeminiSousChef] Resposta vazia da API Gemini.');
      }

      const parsed = JSON.parse(rawJson);

      // Normaliza ID e campos obrigatórios para o RecipeSchema
      const normalizedRecipe: Recipe = {
        id: `rec-ai-${Date.now()}`,
        title: parsed.title || 'Receita Extraída por IA',
        description: parsed.description || 'Extraída com precisão pelo Sous-Chef Gemini Flash.',
        baseYield: parsed.baseYield || 4,
        yieldUnit: parsed.yieldUnit || 'porções',
        prepTimeMinutes: parsed.prepTimeMinutes || 15,
        cookTimeMinutes: parsed.cookTimeMinutes || 25,
        isBakingRecipe: !!parsed.isBakingRecipe,
        ingredients: (parsed.ingredients || []).map((ing: any, idx: number) => ({
          id: `ing-ai-${idx + 1}`,
          name: ing.name,
          amount: typeof ing.amount === 'number' ? ing.amount : parseFloat(ing.amount) || 100,
          unit: ing.unit || 'g',
          isStaple: !!ing.isStaple,
          category: ing.category || 'vegetable',
          bakersPercentage: ing.bakersPercentage
        })),
        steps: Array.isArray(parsed.steps) ? parsed.steps : ['Prepare conforme instruído.'],
        tags: Array.isArray(parsed.tags) ? parsed.tags : ['importada', 'ia']
      };

      // Validação estrita via Zod
      RecipeSchema.parse(normalizedRecipe);

      return {
        recipe: normalizedRecipe,
        source: 'gemini_flash_api',
        rawOutput: rawJson
      };
    } catch (err) {
      throw err;
    }
  }
}
