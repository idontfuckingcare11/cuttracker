import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateAll } from '../src/lib/calc.js';

const prisma = new PrismaClient();

const FOODS = [
  { name: 'Chicken breast (cooked)', servingSize: '100 g', calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
  { name: 'White rice (cooked)', servingSize: '100 g', calories: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 },
  { name: 'Rolled oats', servingSize: '100 g', calories: 380, proteinG: 13, carbsG: 66, fatG: 6.5 },
  { name: 'Whole egg', servingSize: '1 large', calories: 72, proteinG: 6, carbsG: 0.4, fatG: 4.8 },
  { name: 'Banana', servingSize: '1 medium', calories: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4 },
  { name: 'Whey protein powder', servingSize: '1 scoop (30 g)', calories: 120, proteinG: 24, carbsG: 3, fatG: 1.5 },
  { name: 'Extra virgin olive oil', servingSize: '1 tbsp (13 g)', calories: 119, proteinG: 0, carbsG: 0, fatG: 13.5 },
  { name: 'Broccoli', servingSize: '100 g', calories: 34, proteinG: 2.8, carbsG: 6.6, fatG: 0.4 },
  { name: 'Sweet potato', servingSize: '150 g', calories: 130, proteinG: 2.4, carbsG: 30, fatG: 0.2 },
  { name: 'Greek yogurt (2%)', servingSize: '100 g', calories: 65, proteinG: 5.5, carbsG: 4.5, fatG: 2 },
  { name: 'Peanut butter', servingSize: '1 tbsp (16 g)', calories: 94, proteinG: 4, carbsG: 3.5, fatG: 8 },
  { name: 'Almonds', servingSize: '30 g', calories: 174, proteinG: 6, carbsG: 6, fatG: 15 },
  { name: 'Salmon fillet', servingSize: '150 g', calories: 260, proteinG: 32, carbsG: 0, fatG: 14 },
  { name: 'Cottage cheese', servingSize: '100 g', calories: 98, proteinG: 11, carbsG: 3.4, fatG: 4.3 },
  { name: 'Brown bread', servingSize: '1 slice', calories: 90, proteinG: 4, carbsG: 16, fatG: 1 },
  { name: 'Whole Milk (3.25%)', servingSize: '8 fl oz', calories: 149, proteinG: 7.7, carbsG: 11.7, fatG: 7.9 },
  { name: 'Orange Juice', servingSize: '8 fl oz', calories: 112, proteinG: 1.7, carbsG: 26, fatG: 0.5 },
  { name: 'Coca-Cola / Regular Soda', servingSize: '12 fl oz', calories: 140, proteinG: 0, carbsG: 39, fatG: 0 },
  { name: 'Coke Zero / Zero Sugar Soda', servingSize: '12 fl oz', calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  { name: 'Caffe Latte', servingSize: '12 fl oz', calories: 150, proteinG: 8, carbsG: 12, fatG: 6 },
  { name: 'Iced Tea (Sweetened)', servingSize: '12 fl oz', calories: 120, proteinG: 0, carbsG: 32, fatG: 0 },
  { name: 'Gatorade / Sports Drink', servingSize: '12 fl oz', calories: 80, proteinG: 0, carbsG: 21, fatG: 0 }
];

const DEMO = {
  email: 'dev@cuttrack.app',
  password: 'Password123!',
  age: 27,
  sex: 'male',
  heightCm: 170,
  currentWeightKg: 71.9,
  goalWeightKg: 65,
  activityLevel: 'moderate',
  trainingFrequency: 5,
  weeklyLossRateKg: 0.5
};

function dateKey(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return new Date(`${y}-${m}-${day}T00:00:00.000Z`);
}

async function main() {
  console.log('[seed] Seeding global foods...');
  for (const food of FOODS) {
    const exists = await prisma.food.findFirst({ where: { name: food.name, createdBy: null } });
    if (!exists) await prisma.food.create({ data: { ...food, createdBy: null } });
  }

  const existing = await prisma.user.findUnique({ where: { email: DEMO.email } });
  if (existing) {
    console.log('[seed] Demo user already exists, skipping.');
    return;
  }

  console.log('[seed] Creating demo user...');
  const passwordHash = await bcrypt.hash(DEMO.password, 10);
  const user = await prisma.user.create({ data: { email: DEMO.email, passwordHash } });

  const calc = calculateAll({
    age: DEMO.age,
    sex: DEMO.sex,
    heightCm: DEMO.heightCm,
    weightKg: DEMO.currentWeightKg,
    activityLevel: DEMO.activityLevel,
    trainingFrequency: DEMO.trainingFrequency,
    weeklyLossRateKg: DEMO.weeklyLossRateKg
  });

  await prisma.profile.create({
    data: {
      userId: user.id,
      age: DEMO.age,
      sex: DEMO.sex,
      heightCm: DEMO.heightCm,
      currentWeightKg: DEMO.currentWeightKg,
      goalWeightKg: DEMO.goalWeightKg,
      activityLevel: DEMO.activityLevel,
      trainingFrequency: DEMO.trainingFrequency,
      weeklyLossRateKg: DEMO.weeklyLossRateKg,
      dailyCalorieTarget: calc.dailyCalorieTarget,
      proteinTargetG: calc.proteinG,
      carbTargetG: calc.carbG,
      fatTargetG: calc.fatG
    }
  });

  for (let i = 60; i >= 0; i--) {
    if (i % 2 === 1 && i > 3) continue;
    const progress = (60 - i) / 60;
    const weightKg = Math.round((71.9 - 1.7 * progress + (Math.random() - 0.5) * 0.3) * 10) / 10;
    await prisma.weightEntry.create({
      data: { userId: user.id, weightKg, note: i === 0 ? 'Morning fasted weigh-in' : null, loggedDate: dateKey(i) }
    });
  }

  const byName = {};
  for (const food of FOODS) {
    const row = await prisma.food.findFirst({ where: { name: food.name, createdBy: null } });
    byName[food.name] = row;
  }

  const today = dateKey(0);
  const meals = [
    ['breakfast', 'Rolled oats', 0.6, today],
    ['breakfast', 'Whey protein powder', 1, today],
    ['lunch', 'Chicken breast (cooked)', 1.8, today],
    ['lunch', 'White rice (cooked)', 1.8, today],
    ['dinner', 'Greek yogurt (2%)', 2.5, today],
    ['dinner', 'Almonds', 1.3, today],
    ['snack', 'Banana', 1, today],
    ['snack', 'Peanut butter', 1, today]
  ];
  for (const [mealType, name, qty, date] of meals) {
    const food = byName[name];
    await prisma.foodEntry.create({
      data: {
        userId: user.id,
        foodId: food.id,
        name: food.name,
        servingSize: food.servingSize,
        calories: Math.round(food.calories * qty),
        proteinG: Math.round(food.proteinG * qty * 10) / 10,
        carbsG: Math.round(food.carbsG * qty * 10) / 10,
        fatG: Math.round(food.fatG * qty * 10) / 10,
        mealType,
        quantity: qty,
        loggedDate: date
      }
    });
  }

  const past = [
    { d: 1, m: 'breakfast', f: 'Rolled oats', q: 0.7 },
    { d: 1, m: 'lunch', f: 'Chicken breast (cooked)', q: 1.5 },
    { d: 1, m: 'dinner', f: 'Salmon fillet', q: 1 },
    { d: 2, m: 'breakfast', f: 'Whole egg', q: 3 },
    { d: 2, m: 'lunch', f: 'Chicken breast (cooked)', q: 1.7 },
    { d: 2, m: 'dinner', f: 'Cottage cheese', q: 2 },
    { d: 3, m: 'breakfast', f: 'Rolled oats', q: 0.6 },
    { d: 3, m: 'lunch', f: 'Salmon fillet', q: 1.2 },
    { d: 4, m: 'lunch', f: 'Chicken breast (cooked)', q: 1.6 },
    { d: 5, m: 'breakfast', f: 'Rolled oats', q: 0.7 },
    { d: 5, m: 'dinner', f: 'Salmon fillet', q: 1.4 },
    { d: 6, m: 'lunch', f: 'Chicken breast (cooked)', q: 1.8 },
    { d: 7, m: 'breakfast', f: 'Whole egg', q: 4 },
    { d: 8, m: 'breakfast', f: 'Rolled oats', q: 0.6 },
    { d: 8, m: 'lunch', f: 'Salmon fillet', q: 1.3 },
    { d: 9, m: 'dinner', f: 'Chicken breast (cooked)', q: 1.7 },
    { d: 10, m: 'breakfast', f: 'Whole egg', q: 3 },
    { d: 10, m: 'lunch', f: 'Salmon fillet', q: 1 }
  ];
  for (const meal of past) {
    const food = byName[meal.f];
    await prisma.foodEntry.create({
      data: {
        userId: user.id,
        foodId: food.id,
        name: food.name,
        servingSize: food.servingSize,
        calories: Math.round(food.calories * meal.q),
        proteinG: Math.round(food.proteinG * meal.q * 10) / 10,
        carbsG: Math.round(food.carbsG * meal.q * 10) / 10,
        fatG: Math.round(food.fatG * meal.q * 10) / 10,
        mealType: meal.m,
        quantity: meal.q,
        loggedDate: dateKey(meal.d)
      }
    });
  }

  const workouts = [
    { name: 'Push Day', d: 0, duration: 55, burned: 340, notes: 'Felt strong today', exercises: [
      ['Bench Press', 3, 10, 50, 90, true],
      ['Overhead Press', 3, 8, 30, 90, false],
      ['Triceps Pushdown', 3, 12, 25, 60, false]
    ]},
    { name: 'Pull Day', d: 2, duration: 50, burned: 320, notes: null, exercises: [
      ['Deadlift', 3, 5, 90, 150, true],
      ['Lat Pulldown', 3, 10, 55, 90, false],
      ['Barbell Row', 3, 8, 45, 90, false]
    ]},
    { name: 'Leg Day', d: 5, duration: 60, burned: 410, notes: 'Squats felt heavy', exercises: [
      ['Squat', 3, 6, 80, 150, true],
      ['Leg Press', 3, 12, 140, 90, false],
      ['Romanian Deadlift', 3, 10, 60, 120, false]
    ]},
    { name: 'Push Day', d: 9, duration: 50, burned: 330, notes: null, exercises: [
      ['Bench Press', 3, 8, 48, 90, false],
      ['Incline Dumbbell Press', 3, 10, 22, 90, false]
    ]}
  ];
  for (const w of workouts) {
    await prisma.workout.create({
      data: {
        userId: user.id,
        name: w.name,
        workoutDate: dateKey(w.d),
        durationMinutes: w.duration,
        caloriesBurned: w.burned,
        notes: w.notes,
        exercises: {
          create: w.exercises.map(([name, sets, reps, weight, rest, isPr]) => ({
            exerciseName: name,
            sets,
            reps,
            weightKg: weight,
            restSeconds: rest,
            isPr
          }))
        }
      }
    });
  }

  console.log(`[seed] Done. Demo login: ${DEMO.email} / ${DEMO.password}`);
}

main()
  .catch((error) => {
    console.error('[seed] Failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
