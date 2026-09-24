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
