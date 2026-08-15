import fs from 'node:fs';
import path from 'node:path';
import { calculateAll } from '../calc.js';
import { todayKey, daysAgoKey } from '../date.js';

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GLOBAL_FOODS = [
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
  { name: 'Brown bread', servingSize: '1 slice', calories: 90, proteinG: 4, carbsG: 16, fatG: 1 }
];

const SEED_USER = {
  email: 'dev@cuttrack.app'
};

const SEED_PROFILE = {
  age: 27,
  sex: 'male',
  heightCm: 170,
  currentWeightKg: 71.9,
  goalWeightKg: 65,
  activityLevel: 'moderate',
  trainingFrequency: 5,
  weeklyLossRateKg: 0.5
};

function seedData() {
  const data = freshData();
  const today = todayKey();
  const rand = mulberry32(20260815);

  for (const food of GLOBAL_FOODS) {
    const id = nextId(data, 'food');
    data.foods.push({ id, ...food, createdBy: null });
  }

  data.users.push({
    id: nextId(data, 'user'),
    email: SEED_USER.email,
    passwordHash: 'SEED_PENDING',
    tokenVersion: 0,
    createdAt: new Date().toISOString()
  });
  const userId = data.users[0].id;

  const calc = calculateAll({
    age: SEED_PROFILE.age,
    sex: SEED_PROFILE.sex,
    heightCm: SEED_PROFILE.heightCm,
    weightKg: SEED_PROFILE.currentWeightKg,
    activityLevel: SEED_PROFILE.activityLevel,
    trainingFrequency: SEED_PROFILE.trainingFrequency,
    weeklyLossRateKg: SEED_PROFILE.weeklyLossRateKg
  });

  data.profiles.push({
    id: nextId(data, 'profile'),
    userId,
    ...SEED_PROFILE,
    dailyCalorieTarget: calc.dailyCalorieTarget,
    proteinTargetG: calc.proteinG,
    carbTargetG: calc.carbG,
    fatTargetG: calc.fatG,
    createdAt: new Date().toISOString()
  });

  const byName = (n) => data.foods.find((f) => f.name === n);

  for (let i = 60; i >= 0; i--) {
    if (i % 2 === 1 && i > 3) continue;
    const date = daysAgoKey(i);
    const progress = (60 - i) / 60;
    const noise = (rand() - 0.5) * 0.2;
    const weightKg = Math.round((71.9 - 2.5 * progress + noise) * 10) / 10;
    data.weights.push({
      id: nextId(data, 'weight'),
      userId,
      weightKg,
      note: i === 0 ? 'Morning fasted weigh-in' : null,
      loggedDate: date,
      createdAt: `${date}T06:30:00.000Z`
    });
  }

  function addEntry(dayOffset, mealType, foodName, quantity, loggedDate) {
    const food = byName(foodName);
    if (!food) return;
    data.entries.push({
      id: nextId(data, 'entry'),
      userId,
      foodId: food.id,
      name: food.name,
      servingSize: food.servingSize,
      calories: Math.round(food.calories * quantity),
      proteinG: Math.round(food.proteinG * quantity * 10) / 10,
      carbsG: Math.round(food.carbsG * quantity * 10) / 10,
      fatG: Math.round(food.fatG * quantity * 10) / 10,
      mealType,
      quantity,
      loggedDate: loggedDate || daysAgoKey(dayOffset),
      createdAt: new Date().toISOString()
    });
  }

  addEntry(0, 'breakfast', 'Rolled oats', 0.6, today);
  addEntry(0, 'breakfast', 'Whey protein powder', 1, today);
  addEntry(0, 'lunch', 'Chicken breast (cooked)', 1.8, today);
  addEntry(0, 'lunch', 'White rice (cooked)', 1.8, today);
  addEntry(0, 'dinner', 'Greek yogurt (2%)', 2.5, today);
  addEntry(0, 'dinner', 'Almonds', 1.3, today);
  addEntry(0, 'snack', 'Banana', 1, today);
  addEntry(0, 'snack', 'Peanut butter', 1, today);

  const pastMeals = [
    { d: 1, m: 'breakfast', f: 'Rolled oats', q: 0.7 },
    { d: 1, m: 'lunch', f: 'Chicken breast (cooked)', q: 1.5 },
    { d: 1, m: 'lunch', f: 'White rice (cooked)', q: 2 },
    { d: 1, m: 'dinner', f: 'Salmon fillet', q: 1 },
    { d: 1, m: 'dinner', f: 'Broccoli', q: 2 },
    { d: 1, m: 'snack', f: 'Whey protein powder', q: 1 },
    { d: 2, m: 'breakfast', f: 'Whole egg', q: 3 },
    { d: 2, m: 'breakfast', f: 'Brown bread', q: 2 },
    { d: 2, m: 'lunch', f: 'Chicken breast (cooked)', q: 1.7 },
    { d: 2, m: 'lunch', f: 'Sweet potato', q: 1 },
    { d: 2, m: 'dinner', f: 'Cottage cheese', q: 2 },
    { d: 2, m: 'snack', f: 'Banana', q: 1 },
    { d: 3, m: 'breakfast', f: 'Rolled oats', q: 0.6 },
    { d: 3, m: 'breakfast', f: 'Whey protein powder', q: 1 },
    { d: 3, m: 'lunch', f: 'Salmon fillet', q: 1.2 },
    { d: 3, m: 'lunch', f: 'White rice (cooked)', q: 2 },
    { d: 3, m: 'dinner', f: 'Greek yogurt (2%)', q: 2 },
    { d: 3, m: 'snack', f: 'Almonds', q: 1 }
  ];
  for (const meal of pastMeals) addEntry(meal.d, meal.m, meal.f, meal.q);

  const mealPattern = [
    { d: 4, f: 'Chicken breast (cooked)', q: 1.6, m: 'lunch' },
    { d: 4, f: 'White rice (cooked)', q: 2, m: 'lunch' },
    { d: 4, f: 'Broccoli', q: 2, m: 'lunch' },
    { d: 4, f: 'Whey protein powder', q: 1, m: 'snack' },
    { d: 4, f: 'Whole egg', q: 3, m: 'breakfast' },
    { d: 5, f: 'Rolled oats', q: 0.7, m: 'breakfast' },
    { d: 5, f: 'Salmon fillet', q: 1.4, m: 'dinner' },
    { d: 5, f: 'White rice (cooked)', q: 1.5, m: 'dinner' },
    { d: 5, f: 'Banana', q: 1, m: 'snack' },
    { d: 6, f: 'Chicken breast (cooked)', q: 1.8, m: 'lunch' },
    { d: 6, f: 'Sweet potato', q: 1.2, m: 'lunch' },
    { d: 6, f: 'Greek yogurt (2%)', q: 2, m: 'dinner' },
    { d: 6, f: 'Cottage cheese', q: 2, m: 'snack' },
    { d: 7, f: 'Whole egg', q: 4, m: 'breakfast' },
    { d: 7, f: 'Chicken breast (cooked)', q: 1.5, m: 'dinner' },
    { d: 7, f: 'White rice (cooked)', q: 1.8, m: 'dinner' },
    { d: 8, f: 'Rolled oats', q: 0.6, m: 'breakfast' },
    { d: 8, f: 'Whey protein powder', q: 1, m: 'snack' },
    { d: 8, f: 'Salmon fillet', q: 1.3, m: 'lunch' },
    { d: 9, f: 'Chicken breast (cooked)', q: 1.7, m: 'dinner' },
    { d: 9, f: 'Broccoli', q: 2, m: 'dinner' },
    { d: 9, f: 'Banana', q: 1, m: 'snack' },
    { d: 10, f: 'Whole egg', q: 3, m: 'breakfast' },
    { d: 10, f: 'Salmon fillet', q: 1, m: 'lunch' },
    { d: 10, f: 'White rice (cooked)', q: 2, m: 'lunch' },
    { d: 10, f: 'Cottage cheese', q: 1.5, m: 'dinner' }
  ];
  for (const meal of mealPattern) addEntry(meal.d, meal.m, meal.f, meal.q);

  function addWorkout(name, dayOffset, durationMinutes, caloriesBurned, notes, exercises) {
    const workoutId = nextId(data, 'workout');
    const date = dayOffset === 0 ? today : daysAgoKey(dayOffset);
    data.workouts.push({
      id: workoutId,
      userId,
      name,
      workoutDate: date,
      durationMinutes,
      caloriesBurned,
      notes: notes || null,
      createdAt: new Date().toISOString()
    });
    for (const ex of exercises) {
      data.exercises.push({
        id: nextId(data, 'exercise'),
        workoutId,
        exerciseName: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weightKg: ex.weight,
        restSeconds: ex.rest ?? 90,
        notes: ex.notes ?? null,
        isPr: !!ex.isPr,
        createdAt: new Date().toISOString()
      });
    }
  }

  addWorkout('Push Day', 0, 55, 340, 'Felt strong today', [
    { name: 'Bench Press', sets: 3, reps: 10, weight: 50, rest: 90, isPr: true },
    { name: 'Overhead Press', sets: 3, reps: 8, weight: 30, rest: 90 },
    { name: 'Triceps Pushdown', sets: 3, reps: 12, weight: 25, rest: 60 }
  ]);
  addWorkout('Pull Day', 2, 50, 320, null, [
    { name: 'Deadlift', sets: 3, reps: 5, weight: 90, rest: 150, isPr: true },
    { name: 'Lat Pulldown', sets: 3, reps: 10, weight: 55, rest: 90 },
    { name: 'Barbell Row', sets: 3, reps: 8, weight: 45, rest: 90 }
  ]);
  addWorkout('Leg Day', 5, 60, 410, 'Squats felt heavy', [
    { name: 'Squat', sets: 3, reps: 6, weight: 80, rest: 150, isPr: true },
    { name: 'Leg Press', sets: 3, reps: 12, weight: 140, rest: 90 },
    { name: 'Romanian Deadlift', sets: 3, reps: 10, weight: 60, rest: 120 }
  ]);
  addWorkout('Push Day', 9, 50, 330, null, [
    { name: 'Bench Press', sets: 3, reps: 8, weight: 48, rest: 90 },
    { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 22, rest: 90 }
  ]);

  return data;
}

function freshData() {
  return {
    counters: { user: 0, profile: 0, food: 0, entry: 0, weight: 0, workout: 0, exercise: 0, cache: 0, reset: 0 },
    users: [],
    profiles: [],
    foods: [],
    entries: [],
    weights: [],
    workouts: [],
    exercises: [],
    cache: [],
    resets: []
  };
}

function nextId(data, key) {
  data.counters[key] += 1;
  return data.counters[key];
}

function findBy(arr, predicate) {
  return arr.find(predicate) || null;
}

function hasId(item, id) {
  return item.id === Number(id);
}

export function createMemoryStore({ seed = true, dataFile = '' } = {}) {
  let data;
  let saveTimer = null;

  if (dataFile && fs.existsSync(dataFile)) {
    try {
      data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } catch (error) {
      console.warn('[memory] Could not load data file, starting fresh:', error.message);
      data = seed ? seedData() : freshData();
    }
  } else {
    data = seed ? seedData() : freshData();
  }

  function scheduleSave() {
    if (!dataFile) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      fs.mkdirSync(path.dirname(dataFile), { recursive: true });
      const tmp = `${dataFile}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
      fs.renameSync(tmp, dataFile);
    }, 300);
  }

  const db = {
    _seedMode: seed,
    async ready() {
      return true;
    },
    async disconnect() {
      if (saveTimer) clearTimeout(saveTimer);
    },

    userCreate: async ({ email, passwordHash }) => {
      const existing = findBy(data.users, (u) => u.email === email);
      if (existing) return null;
      const user = { id: nextId(data, 'user'), email, passwordHash, tokenVersion: 0, createdAt: new Date().toISOString() };
      data.users.push(user);
      scheduleSave();
      return user;
    },
    userFindByEmail: async (email) => findBy(data.users, (u) => u.email === email),
    userFindById: async (id) => findBy(data.users, (u) => hasId(u, id)),
    userBumpTokenVersion: async (id) => {
      const user = findBy(data.users, (u) => hasId(u, id));
      if (!user) return 0;
      user.tokenVersion = (user.tokenVersion ?? 0) + 1;
      scheduleSave();
      return user.tokenVersion;
    },
    userUpdatePassword: async (id, passwordHash) => {
      const user = findBy(data.users, (u) => hasId(u, id));
      if (!user) return null;
      user.passwordHash = passwordHash;
      scheduleSave();
      return user;
    },
    userPublic: (user) => ({ id: user.id, email: user.email }),

    resetCreate: async ({ token, userId, expiresAt }) => {
      const row = { id: nextId(data, 'reset'), token, userId, expiresAt, createdAt: new Date().toISOString() };
      data.resets.push(row);
      scheduleSave();
      return row;
    },
    resetFindValid: async (token) => {
      const row = findBy(data.resets, (r) => r.token === token);
      if (!row || new Date(row.expiresAt).getTime() < Date.now()) return null;
      return row;
    },
    resetDeleteForUser: async (userId) => {
      data.resets = data.resets.filter((r) => r.userId !== Number(userId));
      scheduleSave();
    },

    profileCreate: async (input) => {
      const profile = { id: nextId(data, 'profile'), createdAt: new Date().toISOString(), ...input };
      data.profiles.push(profile);
      scheduleSave();
      return profile;
    },
    profileFindByUserId: async (userId) => findBy(data.profiles, (p) => p.userId === Number(userId)),
    profileUpdate: async (userId, input) => {
      const profile = findBy(data.profiles, (p) => p.userId === Number(userId));
      if (!profile) return null;
      Object.assign(profile, input);
      scheduleSave();
      return profile;
    },

    foodList: async (userId) =>
      data.foods
        .filter((f) => f.createdBy === null || f.createdBy === Number(userId))
        .map((f) => ({ ...f, isGlobal: f.createdBy === null })),
    foodCreate: async ({ name, servingSize, calories, proteinG, carbsG, fatG, createdBy }) => {
      const food = { id: nextId(data, 'food'), name, servingSize, calories, proteinG, carbsG, fatG, createdBy: createdBy ?? null };
      data.foods.push(food);
      scheduleSave();
      return { ...food, isGlobal: food.createdBy === null };
    },

    entryCreate: async (input) => {
      const entry = { id: nextId(data, 'entry'), createdAt: new Date().toISOString(), ...input };
      data.entries.push(entry);
      scheduleSave();
      return entry;
    },
    entryListByDate: async (userId, loggedDate) =>
      data.entries
        .filter((e) => e.userId === Number(userId) && e.loggedDate === loggedDate)
        .sort((a, b) => mealOrder(a.mealType) - mealOrder(b.mealType)),
    entryListBetween: async (userId, fromKey, toKey) =>
      data.entries.filter((e) => e.userId === Number(userId) && e.loggedDate >= fromKey && e.loggedDate <= toKey),
    entryUpdate: async (userId, id, input) => {
      const entry = findBy(data.entries, (e) => hasId(e, id) && e.userId === Number(userId));
      if (!entry) return null;
      Object.assign(entry, input);
      scheduleSave();
      return entry;
    },
    entryDelete: async (userId, id) => {
      const index = data.entries.findIndex((e) => hasId(e, id) && e.userId === Number(userId));
      if (index === -1) return false;
      data.entries.splice(index, 1);
      scheduleSave();
      return true;
    },

    weightCreate: async (input) => {
      const row = { id: nextId(data, 'weight'), createdAt: new Date().toISOString(), ...input };
      data.weights.push(row);
      scheduleSave();
      return row;
    },
    weightList: async (userId) =>
      data.weights
        .filter((w) => w.userId === Number(userId))
        .sort((a, b) => (a.loggedDate < b.loggedDate ? -1 : a.loggedDate > b.loggedDate ? 1 : 0)),
    weightUpdate: async (userId, id, input) => {
      const row = findBy(data.weights, (w) => hasId(w, id) && w.userId === Number(userId));
      if (!row) return null;
      Object.assign(row, input);
      scheduleSave();
      return row;
    },
    weightDelete: async (userId, id) => {
      const index = data.weights.findIndex((w) => hasId(w, id) && w.userId === Number(userId));
      if (index === -1) return false;
      data.weights.splice(index, 1);
      scheduleSave();
      return true;
    },

    workoutCreate: async ({ userId, name, workoutDate, durationMinutes, caloriesBurned, notes, exercises }) => {
      const workout = { id: nextId(data, 'workout'), userId, name, workoutDate, durationMinutes: durationMinutes ?? null, caloriesBurned: caloriesBurned ?? null, notes: notes ?? null, createdAt: new Date().toISOString() };
      data.workouts.push(workout);
      const rows = [];
      for (const ex of exercises || []) {
        rows.push({
          id: nextId(data, 'exercise'),
          workoutId: workout.id,
          exerciseName: ex.exerciseName || ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weightKg: ex.weightKg ?? ex.weight ?? 0,
          restSeconds: ex.restSeconds ?? ex.rest ?? 90,
          notes: ex.notes ?? null,
          isPr: !!ex.isPr,
          createdAt: new Date().toISOString()
        });
        data.exercises.push(rows[rows.length - 1]);
      }
      scheduleSave();
      return db.workoutGet(workout.userId, workout.id);
    },
    workoutList: async (userId) => {
      const list = data.workouts
        .filter((w) => w.userId === Number(userId))
        .sort((a, b) => (a.workoutDate < b.workoutDate ? 1 : a.workoutDate > b.workoutDate ? -1 : 0));
      return list.map((w) => {
        const exercises = data.exercises.filter((e) => e.workoutId === w.id);
        return { ...w, exercises };
      });
    },
    workoutGet: async (userId, id) => {
      const workout = findBy(data.workouts, (w) => hasId(w, id) && w.userId === Number(userId));
      if (!workout) return null;
      const exercises = data.exercises.filter((e) => e.workoutId === workout.id);
      return { ...workout, exercises };
    },
    workoutUpdate: async (userId, id, input) => {
      const workout = findBy(data.workouts, (w) => hasId(w, id) && w.userId === Number(userId));
      if (!workout) return null;
      const { exercises, ...rest } = input;
      Object.assign(workout, rest);
      if (exercises) {
        data.exercises = data.exercises.filter((e) => e.workoutId !== workout.id);
        for (const ex of exercises) {
          data.exercises.push({
            id: nextId(data, 'exercise'),
            workoutId: workout.id,
            exerciseName: ex.exerciseName || ex.name,
            sets: ex.sets,
            reps: ex.reps,
            weightKg: ex.weightKg ?? ex.weight ?? 0,
            restSeconds: ex.restSeconds ?? ex.rest ?? 90,
            notes: ex.notes ?? null,
            isPr: !!ex.isPr,
            createdAt: new Date().toISOString()
          });
        }
      }
      scheduleSave();
      return db.workoutGet(workout.userId, workout.id);
    },
    workoutDelete: async (userId, id) => {
      const index = data.workouts.findIndex((w) => hasId(w, id) && w.userId === Number(userId));
      if (index === -1) return false;
      data.workouts.splice(index, 1);
      data.exercises = data.exercises.filter((e) => e.workoutId !== Number(id));
      scheduleSave();
      return true;
    },

    aiCacheGet: async (userId) => findBy(data.cache, (c) => c.userId === Number(userId)),
    aiCacheSet: async ({ userId, status, message, generatedAt, expiresAt }) => {
      const existing = findBy(data.cache, (c) => c.userId === Number(userId));
      if (existing) {
        Object.assign(existing, { status, message, generatedAt, expiresAt });
      } else {
        data.cache.push({ id: nextId(data, 'cache'), userId, status, message, generatedAt, expiresAt });
      }
      scheduleSave();
      return db.aiCacheGet(userId);
    },
    aiCacheDelete: async (userId) => {
      data.cache = data.cache.filter((c) => c.userId !== Number(userId));
      scheduleSave();
    }
  };

  return db;
}

function mealOrder(type) {
  const order = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
  return order[type] ?? 4;
}
