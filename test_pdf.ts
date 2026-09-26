import { ExtractTextFromPdfUseCase } from './src/domain/use-cases/ExtractTextFromPdf.js';
import { SanitizeAndParseRecipeUseCase } from './src/domain/use-cases/SanitizeAndParseRecipe.js';
import * as fs from 'fs';

async function run() {
  // Mock File
  const buffer = fs.readFileSync("/home/ubuntu/.gemini/antigravity-cli/brain/41573a59-512b-49ee-a3ca-aea15fef86f4/.user_uploaded/media_1790345254882.pdf");
  const file = new File([buffer], "panqueca.pdf", { type: "application/pdf" });
  
  const text = await ExtractTextFromPdfUseCase.execute(file);
  console.log("--- PDF EXTRACTED TEXT ---");
  console.log(text);
  console.log("--------------------------");
  
  const result = SanitizeAndParseRecipeUseCase.execute(text);
  console.log("--- PARSED RESULT ---");
  console.log(JSON.stringify(result, null, 2));
}
run();
