import { Recipe, RecipeSchema, UnitType } from '../schemas/recipe.schema.js';
import { generateId } from '../../utils/id.js';

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
  // Migração para Flash-Lite (Fase 5): Evita HTTP 503 na cota gratuita
  private static readonly API_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

  // Fix #5: Timeout rígido de 20 segundos para chamadas externas (CWE-400 / Pilar 23)
  private static readonly FETCH_TIMEOUT_MS = 20_000;

  private static readonly SYSTEM_PROMPT = `Você é o Sous-Chef de engenharia culinária do GastroRatio.
Sua missão é extrair receitas de documentos PDF ou textos culinários em formato JSON estrito.
Você DEVE retornar um objeto JSON exatamente com a seguinte estrutura:
{
  "title": "Nome da Receita",
  "description": "Breve descrição sucinta",
  "baseYield": 8,
  "yieldUnit": "porções",
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 25,
  "isBakingRecipe": false,
  "ingredients": [
    {
      "name": "Farinha de trigo",
      "amount": 120,
      "unit": "g",
      "isStaple": false,
      "category": "flour_grain"
    }
  ],
  "steps": [
    "Bata todos os ingredientes no liquidificador até obter uma consistência cremosa."
  ]
}

Regras Inegociáveis:
1. As chaves do JSON DEVEM ser em inglês: "title", "description", "baseYield", "yieldUnit", "prepTimeMinutes", "cookTimeMinutes", "isBakingRecipe", "ingredients", "steps".
2. Converta todas as medidas culinárias para gramas ('g') ou mililitros ('ml') sempre que possível (ex: 1 xícara de farinha = 120g, 1 xícara de leite = 240ml, 1 colher de sopa de óleo = 15g, 1 ovo = 50g ou 1 unit, 1 pitada de sal = 1g).
3. Identifique se o ingrediente é da despensa básica (sal, óleo, azeite, alho, cebola, vinagre, açúcar) marcando isStaple: true.
4. Categorias válidas para "category": 'flour_grain', 'liquid', 'fat_oil', 'sugar_sweetener', 'leavening', 'protein', 'vegetable', 'dairy', 'staple_seasoning'.
5. Extraia o rendimento real da receita (ex: "8 porções" -> baseYield: 8, yieldUnit: "porções").
6. Divida o modo de preparo em etapas claras e sucintas no array "steps". Ignore propagandas, utensílios de cozinha ou seções como "Veja também" e "Informações adicionais".`;

  /**
   * Extração de receita diretamente do arquivo PDF usando a capacidade multimodal nativa do Gemini.
   */
  public static async parseRecipeFromPdf(file: File, apiKey?: string): Promise<SousChefParseResult> {
    const base64Data = await this.fileToBase64(file);
    const parts = [
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data
        }
      },
      {
        text: 'Analise o arquivo PDF anexo desta receita culinária e extraia os dados estruturados no formato JSON estrito conforme as instruções do sistema.'
      }
    ];

    return this.executeGeminiRequest(parts, apiKey);
  }

  /**
   * Parse avançado com IA para textos caóticos ou transcrições de áudio culinárias.
   */
  public static async parseChaoticRecipe(rawText: string, apiKey?: string): Promise<SousChefParseResult> {
    const parts = [
      {
        text: `<recipe_input>\n${rawText}\n</recipe_input>`
      }
    ];

    return this.executeGeminiRequest(parts, apiKey);
  }

  /**
   * Executa a requisição HTTP para a Gemini API com timeout, cabeçalhos seguros e normalização Zod.
   */
  private static async executeGeminiRequest(userParts: any[], apiKey?: string): Promise<SousChefParseResult> {
    let key = apiKey;
    if (!key) {
      try {
        const saved = sessionStorage.getItem('gastroratio_gemini_api_key_v2');
        if (saved) {
          key = atob(saved).split('').reverse().join('');
        }
      } catch {
        key = '';
      }
    }

    if (!key) {
      throw new Error(
        'Chave da API do Gemini não configurada. Vá na aba Configurações para adicionar sua chave ou use a extração offline básica.'
      );
    }

    const requestBody = {
      systemInstruction: {
        parts: [{ text: this.SYSTEM_PROMPT }]
      },
      contents: [
        {
          role: 'user',
          parts: userParts
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GeminiSousChefAdapter.FETCH_TIMEOUT_MS);

    try {
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

      // Normalização tolerante para chaves em inglês ou português
      const rawTitle = parsed.title || parsed.nome || parsed.titulo || 'Receita Extraída por IA';
      const rawDesc = parsed.description || parsed.descricao || 'Extraída com precisão pelo Sous-Chef Gemini Flash.';
      const rawYield = parsed.baseYield || parsed.rendimento || parsed.porcoes || 4;
      const rawYieldUnit = parsed.yieldUnit || parsed.unidade_rendimento || 'porções';
      const rawIngredientsList = parsed.ingredients || parsed.ingredientes || parsed.itens || [];
      const rawStepsList = parsed.steps || parsed.modo_de_preparo || parsed.etapas || parsed.instrucoes || [];

      const normalizedRecipe: Recipe = {
        id: generateId('rec-ai'),
        title: String(rawTitle).trim(),
        description: String(rawDesc).trim(),
        baseYield: typeof rawYield === 'number' ? rawYield : parseInt(rawYield, 10) || 4,
        yieldUnit: String(rawYieldUnit).toLowerCase().trim(),
        prepTimeMinutes: parsed.prepTimeMinutes || parsed.tempo_preparo || 15,
        cookTimeMinutes: parsed.cookTimeMinutes || parsed.tempo_cozimento || 25,
        isBakingRecipe: !!parsed.isBakingRecipe,
        ingredients: (Array.isArray(rawIngredientsList) ? rawIngredientsList : []).map((ing: any) => {
          const rawUnit = String(ing.unit || ing.unidade || 'g').toLowerCase().trim();
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
            id: generateId('ing'),
            name: ing.name || ing.nome || ing.ingredient || ing.item || 'Ingrediente',
            amount: typeof ing.amount === 'number' ? ing.amount : parseFloat(ing.amount || ing.quantidade) || 100,
            unit,
            isStaple: !!(ing.isStaple ?? ing.despensa_basica),
            category: ing.category || ing.categoria || 'vegetable',
            bakersPercentage: ing.bakersPercentage
          };
        }),
        steps: Array.isArray(rawStepsList)
          ? rawStepsList.map((s: any) => (typeof s === 'string' ? s : s.text || s.passo || ''))
          : ['Prepare conforme instruído.'],
        tags: Array.isArray(parsed.tags) ? parsed.tags : ['importada', 'ia']
      };

      // Se a lista de ingredientes ficou vazia, rejeita explicitamente
      if (normalizedRecipe.ingredients.length === 0) {
        throw new Error('[GeminiSousChef] Nenhum ingrediente pôde ser estruturado pelo modelo de IA.');
      }

      // Validação estrita via Zod como camada final de defesa
      RecipeSchema.parse(normalizedRecipe);

      return {
        recipe: normalizedRecipe,
        source: 'gemini_flash_api',
        rawOutput: rawJson
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error('[GeminiSousChef] Tempo limite de 20s excedido. Verifique sua conexão e tente novamente.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
