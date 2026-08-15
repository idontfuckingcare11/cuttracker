import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .max(100);

export const emailSchema = z.string().email('Enter a valid email address').max(255).transform((v) => v.trim().toLowerCase());

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address').max(255),
  password: z.string().min(1, 'Password is required')
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema
});

export const activityLevelSchema = z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']);
export const sexSchema = z.enum(['male', 'female']);
export const mealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'extra']);

const positiveNumber = z.number().positive();
const optionalPositive = z.number().positive().optional();
const optionalNull = z.number().positive().nullable().optional();

export const profileInputSchema = z.object({
  age: z.number().int().min(13, 'Age must be at least 13').max(100),
  sex: sexSchema,
  heightCm: positiveNumber.max(250, 'Height must be under 250 cm'),
  currentWeightKg: positiveNumber.max(400, 'Weight must be under 400 kg'),
  goalWeightKg: positiveNumber.max(400, 'Weight must be under 400 kg'),
  activityLevel: activityLevelSchema,
  trainingFrequency: z.number().int().min(0).max(7),
  weeklyLossRateKg: z.number().positive().max(2, 'Weekly loss rate must be 2 kg or less').optional(),
  targetMonths: z.number().positive().max(36, 'Target timeframe must be under 36 months').optional().nullable()
});

export const profileUpdateSchema = profileInputSchema.partial();

export const foodCreateSchema = z.object({
  name: z.string().min(1).max(150),
  servingSize: z.string().min(1).max(100),
  calories: z.number().int().positive(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative()
});

export const foodEntryCreateSchema = z.object({
  foodId: z.number().int().positive().nullable().optional(),
  name: z.string().min(1).max(150).optional(),
  servingSize: z.string().min(1).max(100).optional(),
  calories: z.number().int().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  mealType: mealTypeSchema,
  quantity: positiveNumber.default(1),
  loggedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
});

export const foodEntryUpdateSchema = foodEntryCreateSchema.partial();

export const weightEntrySchema = z.object({
  weightKg: positiveNumber.max(400, 'Weight must be under 400 kg'),
  note: z.string().max(255).nullable().optional(),
  loggedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
});

export const weightEntryUpdateSchema = weightEntrySchema.partial();

export const workoutExerciseSchema = z.object({
  exerciseName: z.string().min(1).max(150),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  weightKg: z.number().nonnegative(),
  restSeconds: optionalPositive,
  notes: z.string().max(255).nullable().optional(),
  isPr: z.boolean().optional()
});

export const workoutSchema = z.object({
  name: z.string().min(1).max(150),
  workoutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  durationMinutes: optionalNull,
  caloriesBurned: optionalNull,
  notes: z.string().max(255).nullable().optional(),
  exercises: z.array(workoutExerciseSchema).max(50).default([])
});

export const workoutUpdateSchema = workoutSchema.partial();
