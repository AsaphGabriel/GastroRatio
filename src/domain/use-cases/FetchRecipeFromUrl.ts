import { ParseRecipeResult, SanitizeAndParseRecipeUseCase } from './SanitizeAndParseRecipe.js';

export class FetchRecipeFromUrlUseCase {
  public static async execute(url: string): Promise<ParseRecipeResult> {
    const rawText = await this.extractRawTextFromUrl(url);
    return SanitizeAndParseRecipeUseCase.execute(rawText);
  }

  public static async extractRawTextFromUrl(url: string): Promise<string> {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Falha ao acessar a URL. Status: ${response.status}`);
      }
      const html = await response.text();
      return this.parseJsonLd(html, url);
    } catch (e: any) {
      throw new Error(`Erro ao importar receita: ${e.message}`);
    }
  }

  private static parseJsonLd(html: string, sourceUrl: string): string {
    const scriptRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let recipeData: any = null;

    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        let jsonLd = JSON.parse(match[1]);
        
        if (Array.isArray(jsonLd)) {
          const r = jsonLd.find((item: any) => item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe')));
          if (r) {
            recipeData = r;
            break;
          }
        } else if (jsonLd['@graph']) {
           const r = jsonLd['@graph'].find((item: any) => item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe')));
           if (r) {
             recipeData = r;
             break;
           }
        } else if (jsonLd['@type'] === 'Recipe' || (Array.isArray(jsonLd['@type']) && jsonLd['@type'].includes('Recipe'))) {
          recipeData = jsonLd;
          break;
        }
      } catch (e) {
        // Ignorar JSON malformado
      }
    }

    if (!recipeData) {
      throw new Error("Nenhum metadado de receita (schema.org/Recipe) encontrado nesta página. Tente colar o texto manualmente.");
    }

    const title = recipeData.name || 'Receita Importada';
    
    // Concatena as instruções se for um array de objetos HowToStep
    let instructions = '';
    if (Array.isArray(recipeData.recipeInstructions)) {
      instructions = recipeData.recipeInstructions.map((step: any) => {
        if (typeof step === 'string') return step;
        return step.text || step.name || '';
      }).filter((s: string) => s.trim().length > 0).join('\n');
    } else {
      instructions = recipeData.recipeInstructions || '';
    }
      
    const rawIngredients: string[] = recipeData.recipeIngredient || [];
    if (rawIngredients.length === 0) {
      throw new Error("A receita não possui ingredientes listados nos metadados da página.");
    }

    // Criamos o texto bruto no formato ideal para o SanitizeAndParseRecipeUseCase
    return `${title}\n\nIngredientes:\n${rawIngredients.join('\n')}\n\nModo de Preparo:\n${instructions}\n\nFonte: ${sourceUrl}`;
  }
}
