import { Recipe, RecipeSchema, UnitType } from '../schemas/recipe.schema.js';

export interface SousChefParseResult {
  recipe: Recipe;
  source: 'gemini_flash_api' | 'local_fallback';
  rawOutput?: string;
}

/**
 * Adapter para assistência avançada de IA via Gemini 2.5 Flash (Camada 2 da Cascata).
 *
 * Correções de segurança aplicadas (Auditoria 2026-09-24):
 * - Fix #7: Modelo corrigido para gemini-2.5-flash (existente na v1beta) [Art. 32º]
 * - Fix #4: systemInstruction separa o contexto do sistema da entrada do usuário [OWASP LLM01:2025]
 * - Fix #5: AbortController com timeout de 20s previne Hang DoS [CWE-400 / Pilar 23]
 * - Fix #1: Leitura da API Key migrada de localStorage para sessionStorage [CWE-312 / Art. 1º]
 * - Fix #8: IDs gerados via crypto.randomUUID() (criptograficamente seguros) [CWE-330]
 */
export class GeminiSousChefAdapter {
  // Fix #7: Modelo corrigido (gemini-3.6-flash era inexistente na v1beta — Art. 32º)
  private static readonly API_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  // Fix #5: Timeout rígido de 20 segundos para chamadas externas (CWE-400 / Pilar 23)
  private static readonly FETCH_TIMEOUT_MS = 20_000;

  /**
   * Parse avançado com IA para textos caóticos ou transcrições de áudio culinárias.
   */
  public static async parseChaoticRecipe(rawText: string, apiKey?: string): Promise<SousChefParseResult> {
    let key = apiKey;
    if (!key) {
      try {
        // Fix #1: Ler a key de sessionStorage (volátil, isolado por aba) e não de localStorage [CWE-312]
        const saved = sessionStorage.getItem('gastroratio_gemini_api_key_v2');
        if (saved) {
          key = atob(saved).split('').reverse().join('');
        }
      } catch {
        key = '';
      }
    }

    if (!key) {
      throw new Error('Chave da API do Gemini não configurada. Vá na aba Configurações para adicionar sua chave ou use a extração offline básica.');
    }

    // Fix #4: systemPrompt declarado separadamente para uso no campo systemInstruction [OWASP LLM01:2025]
    const systemPrompt = `Você é o Sous-Chef de engenharia culinária do GastroRatio.
Sua missão é extrair receitas de textos caóticos da internet em JSON estrito.
Regras Inegociáveis:
1. Converta todas as medidas para gramas ('g') ou mililitros ('ml') sempre que possível.
2. Identifique se o ingrediente é da despensa básica (sal, óleo, alho, cebola, vinagre, açúcar) marcando isStaple: true.
3. Categorize cada ingrediente: 'flour_grain', 'liquid', 'fat_oil', 'sugar_sweetener', 'leavening', 'protein', 'vegetable', 'dairy', 'staple_seasoning'.
4. Divida o modo de preparo em etapas claras e sucintas de no máximo 4 linhas.`;

    // Fix #4: systemInstruction separa fisicamente o contexto do sistema do input do usuário,
    // prevenindo Direct/Indirect Prompt Injection via texto de receitas maliciosas [OWASP LLM01:2025]
    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [
            // Delimitadores estruturados encapsulam o input do usuário, separando-o da instrução
            { text: `<recipe_input>\n${rawText}\n</recipe_input>` }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    };

    // Fix #5: AbortController com timeout determinístico de 20s [CWE-400 / Pilar 23 / Art. 22º]
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GeminiSousChefAdapter.FETCH_TIMEOUT_MS);

    try {
      // A API Key é enviada exclusivamente via header — nunca como query param (proteção em logs/proxies)
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!response.ok) {
        let errorDetails = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData?.error?.message) {
            errorDetails += ` — ${errData.error.message}`;
          }
        } catch {
          // Mantém fallback para o status HTTP se a resposta não for JSON
        }
        throw new Error(`[GeminiSousChef] Erro na API Gemini: ${errorDetails}`);
      }

      const data = await response.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) {
        throw new Error('[GeminiSousChef] Resposta vazia da API Gemini.');
      }

      let cleanedJson = rawJson.trim();
      if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanedJson);

      // Normaliza ID e campos obrigatórios para o RecipeSchema
      const normalizedRecipe: Recipe = {
        // Fix #8: crypto.randomUUID() em vez de Date.now() — criptograficamente seguro [CWE-330]
        id: `rec-ai-${crypto.randomUUID()}`,
        title: parsed.title || 'Receita Extraída por IA',
        description: parsed.description || 'Extraída com precisão pelo Sous-Chef Gemini Flash.',
        baseYield: parsed.baseYield || 4,
        yieldUnit: parsed.yieldUnit || 'porções',
        prepTimeMinutes: parsed.prepTimeMinutes || 15,
        cookTimeMinutes: parsed.cookTimeMinutes || 25,
        isBakingRecipe: !!parsed.isBakingRecipe,
        ingredients: (parsed.ingredients || []).map((ing: any) => {
          const rawUnit = String(ing.unit || 'g').toLowerCase().trim();
          let unit: UnitType = 'g';
          if (['g', 'kg', 'ml', 'l', 'cup', 'tablespoon', 'teaspoon', 'unit'].includes(rawUnit)) {
            unit = rawUnit as UnitType;
          } else if (rawUnit.includes('xíc') || rawUnit.includes('copo')) {
            unit = 'cup';
          } else if (rawUnit.includes('sopa')) {
            unit = 'tablespoon';
          } else if (rawUnit.includes('chá') || rawUnit.includes('sobremesa')) {
            unit = 'teaspoon';
          } else if (rawUnit.includes('quilo') || rawUnit === 'kg') {
            unit = 'kg';
          } else if (rawUnit.includes('litro') || rawUnit === 'l') {
            unit = 'l';
          } else if (rawUnit.includes('mili') || rawUnit === 'ml') {
            unit = 'ml';
          }

          return {
            // Fix #8: crypto.randomUUID() para IDs de ingredientes [CWE-330]
            id: `ing-${crypto.randomUUID()}`,
            name: ing.name || ing.ingredient || ing.item || 'Ingrediente',
            amount: typeof ing.amount === 'number' ? ing.amount : parseFloat(ing.amount) || 100,
            unit,
            isStaple: !!ing.isStaple,
            category: ing.category || 'vegetable',
            bakersPercentage: ing.bakersPercentage
          };
        }),
        steps: Array.isArray(parsed.steps) ? parsed.steps : ['Prepare conforme instruído.'],
        tags: Array.isArray(parsed.tags) ? parsed.tags : ['importada', 'ia']
      };

      // Validação estrita via Zod como camada final de defesa
      RecipeSchema.parse(normalizedRecipe);

      return {
        recipe: normalizedRecipe,
        source: 'gemini_flash_api',
        rawOutput: rawJson
      };
    } catch (err: any) {
      // Fix #5: Traduz erro de AbortController para mensagem de usuário legível
      if (err?.name === 'AbortError') {
        throw new Error('[GeminiSousChef] Tempo limite de 20s excedido. Verifique sua conexão e tente novamente.');
      }
      throw err;
    } finally {
      // Fix #5: Limpa o timer em todos os cenários (sucesso, erro, abort) — Art. 22º RAII
      clearTimeout(timeoutId);
    }
  }
}
