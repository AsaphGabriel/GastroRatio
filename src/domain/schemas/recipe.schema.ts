import { z } from 'zod';

export const UnitTypeSchema = z.enum([
  'g',
  'kg',
  'ml',
  'l',
  'cup',
  'tablespoon',
  'teaspoon',
  'unit'
]);

export type UnitType = z.infer<typeof UnitTypeSchema>;

export const IngredientCategorySchema = z.enum([
  'flour_grain',
  'liquid',
  'fat_oil',
  'sugar_sweetener',
  'leavening',
  'protein',
  'vegetable',
  'dairy',
  'staple_seasoning'
]);

export type IngredientCategory = z.infer<typeof IngredientCategorySchema>;

export const RecipeIngredientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().positive(),
  unit: UnitTypeSchema,
  isStaple: z.boolean().default(false),
  category: IngredientCategorySchema,
  bakersPercentage: z.number().nonnegative().optional()
});

export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;

export const RecipeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional(),
  baseYield: z.number().positive(),
  yieldUnit: z.string().default('porções'),
  prepTimeMinutes: z.number().int().nonnegative().default(0),
  cookTimeMinutes: z.number().int().nonnegative().default(0),
  isBakingRecipe: z.boolean().default(false),
  ingredients: z.array(RecipeIngredientSchema).min(1),
  steps: z.array(z.string().min(2)).min(1),
  tags: z.array(z.string()).default([])
});

export type Recipe = z.infer<typeof RecipeSchema>;

export const PantryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: IngredientCategorySchema,
  inStock: z.boolean().default(true)
});

export type PantryItem = z.infer<typeof PantryItemSchema>;

/**
 * Substituição culinária personalizada, criada pelo usuário ou gerada pela IA.
 * Armazenada na tabela custom_substitutions do IndexedDB.
 */
export const CustomSubstitutionSchema = z.object({
  id: z.string().min(1),
  originalIngredient: z.string().min(1),       // Nome do ingrediente original (normalizado)
  substituteIngredient: z.string().min(1),      // Nome do substituto
  multiplier: z.number().positive().default(1), // Fator de conversão (ex: 0.75 = 75% da quantidade)
  ratio: z.string().default('1:1'),             // Descrição textual da proporção
  physicalFunction: z.string().default(''),     // Função físico-química (ex: "aerador", "emulsificante")
  explanation: z.string().default(''),          // Explicação da substituição
  waterAdjustmentAlert: z.string().optional(),  // Alerta de umidade livre (RN-03)
  liquidDeltaRatio: z.number().default(0),      // Fator de ajuste hídrico (ex: -0.2 p/ mel, abate líquidos)
  source: z.enum(['user', 'ai']).default('user'), // Origem da substituição
  createdAt: z.string().default(() => new Date().toISOString())
});

export type CustomSubstitution = z.infer<typeof CustomSubstitutionSchema>;
