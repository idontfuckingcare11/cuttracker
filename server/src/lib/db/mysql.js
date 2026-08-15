import { config } from '../../config.js';

function toKey(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function toDate(key) {
  return new Date(`${key}T00:00:00.000Z`);
}

const num = (v) => (v === null || v === undefined ? null : Number(v));

function mapProfile(p) {
  if (!p) return null;
  return {
    id: p.id,
    userId: p.userId,
    age: p.age,
    sex: p.sex,
    heightCm: num(p.heightCm),
    currentWeightKg: num(p.currentWeightKg),
    goalWeightKg: num(p.goalWeightKg),
    activityLevel: p.activityLevel,
    trainingFrequency: p.trainingFrequency,
    weeklyLossRateKg: num(p.weeklyLossRateKg),
    dailyCalorieTarget: p.dailyCalorieTarget,
    proteinTargetG: p.proteinTargetG,
    carbTargetG: p.carbTargetG,
    fatTargetG: p.fatTargetG,
    createdAt: p.createdAt
  };
}

function mapFood(f) {
  if (!f) return null;
  return { ...f, proteinG: num(f.proteinG), carbsG: num(f.carbsG), fatG: num(f.fatG), isGlobal: f.createdBy === null };
}

function mapEntry(e) {
  if (!e) return null;
  return { ...e, loggedDate: toKey(e.loggedDate), proteinG: num(e.proteinG), carbsG: num(e.carbsG), fatG: num(e.fatG), quantity: num(e.quantity) };
}

function mapWeight(w) {
  if (!w) return null;
  return { ...w, weightKg: num(w.weightKg), loggedDate: toKey(w.loggedDate) };
}

function mapWorkout(w) {
  if (!w) return null;
  return {
    ...w,
    workoutDate: toKey(w.workoutDate),
    exercises: (w.exercises || []).map((e) => ({ ...e, weightKg: num(e.weightKg) }))
  };
}

export function createMysqlStore(prisma) {
  const db = {
    async ready() {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    },
    async disconnect() {
      await prisma.$disconnect();
    },

    async userCreate({ email, passwordHash }) {
      try {
        const user = await prisma.user.create({ data: { email, passwordHash } });
        return user;
      } catch {
        return null;
      }
    },
    userFindByEmail: (email) => prisma.user.findUnique({ where: { email } }),
    userFindById: (id) => prisma.user.findUnique({ where: { id: Number(id) } }),
    userBumpTokenVersion: async (id) => {
      const user = await prisma.user.update({ where: { id: Number(id) }, data: { tokenVersion: { increment: 1 } } });
      return user.tokenVersion;
    },
    userUpdatePassword: (id, passwordHash) => prisma.user.update({ where: { id: Number(id) }, data: { passwordHash } }),
    userPublic: (user) => ({ id: user.id, email: user.email }),

    async resetCreate({ token, userId, expiresAt }) {
      await prisma.passwordResetToken.create({ data: { token, userId: Number(userId), expiresAt } });
      return { token, userId, expiresAt };
    },
    async resetFindValid(token) {
      const row = await prisma.passwordResetToken.findUnique({ where: { token } });
      if (!row || row.expiresAt.getTime() < Date.now()) return null;
      return row;
    },
    resetDeleteForUser: (userId) => prisma.passwordResetToken.deleteMany({ where: { userId: Number(userId) } }),

    async profileCreate(input) {
      const data = {
        userId: Number(input.userId),
        age: input.age,
        sex: input.sex,
        heightCm: input.heightCm,
        currentWeightKg: input.currentWeightKg,
        goalWeightKg: input.goalWeightKg,
        activityLevel: input.activityLevel,
        trainingFrequency: input.trainingFrequency,
        weeklyLossRateKg: input.weeklyLossRateKg,
        dailyCalorieTarget: input.dailyCalorieTarget,
        proteinTargetG: input.proteinTargetG,
        carbTargetG: input.carbTargetG,
        fatTargetG: input.fatTargetG
      };
      const p = await prisma.profile.create({ data });
      return mapProfile(p);
    },
    async profileFindByUserId(userId) {
      return mapProfile(await prisma.profile.findUnique({ where: { userId: Number(userId) } }));
    },
    async profileUpdate(userId, input) {
      const data = {};
      for (const key of ['age', 'sex', 'heightCm', 'currentWeightKg', 'goalWeightKg', 'activityLevel', 'trainingFrequency', 'weeklyLossRateKg', 'dailyCalorieTarget', 'proteinTargetG', 'carbTargetG', 'fatTargetG']) {
        if (input[key] !== undefined) data[key] = input[key];
      }
      const p = await prisma.profile.update({ where: { userId: Number(userId) }, data });
      return mapProfile(p);
    },

    async foodList(userId) {
      const rows = await prisma.food.findMany({
        where: { OR: [{ createdBy: null }, { createdBy: Number(userId) }] },
        orderBy: [{ createdBy: 'asc' }, { name: 'asc' }]
      });
      return rows.map(mapFood);
    },
    async foodCreate(input) {
      const f = await prisma.food.create({
        data: {
          name: input.name,
          servingSize: input.servingSize,
          calories: input.calories,
          proteinG: input.proteinG,
          carbsG: input.carbsG,
          fatG: input.fatG,
          createdBy: input.createdBy ? Number(input.createdBy) : null
        }
      });
      return mapFood(f);
    },

    async entryCreate(input) {
      const e = await prisma.foodEntry.create({
        data: {
          userId: Number(input.userId),
          foodId: input.foodId ? Number(input.foodId) : null,
          name: input.name,
          servingSize: input.servingSize,
          calories: input.calories,
          proteinG: input.proteinG,
          carbsG: input.carbsG,
          fatG: input.fatG,
          mealType: input.mealType,
          quantity: input.quantity ?? 1,
          loggedDate: toDate(input.loggedDate)
        }
      });
      return mapEntry(e);
    },
    async entryListByDate(userId, loggedDate) {
      const rows = await prisma.foodEntry.findMany({
        where: { userId: Number(userId), loggedDate: toDate(loggedDate) },
        orderBy: { id: 'asc' }
      });
      return rows.map(mapEntry);
    },
    async entryListBetween(userId, fromKey, toKey) {
      const rows = await prisma.foodEntry.findMany({
        where: { userId: Number(userId), loggedDate: { gte: toDate(fromKey), lte: toDate(toKey) } },
        orderBy: { loggedDate: 'asc' }
      });
      return rows.map(mapEntry);
    },
    async entryUpdate(userId, id, input) {
      const data = {};
      for (const key of ['foodId', 'name', 'servingSize', 'calories', 'proteinG', 'carbsG', 'fatG', 'mealType', 'quantity', 'loggedDate']) {
        if (input[key] !== undefined) {
          data[key] = key === 'loggedDate' ? toDate(input[key]) : input[key];
        }
      }
      const row = await prisma.foodEntry.update({ where: { id: Number(id) }, data });
      return mapEntry(row);
    },
    async entryDelete(userId, id) {
      const result = await prisma.foodEntry.deleteMany({ where: { id: Number(id), userId: Number(userId) } });
      return result.count > 0;
    },

    async weightCreate(input) {
      const w = await prisma.weightEntry.create({
        data: {
          userId: Number(input.userId),
          weightKg: input.weightKg,
          note: input.note ?? null,
          loggedDate: toDate(input.loggedDate)
        }
      });
      return mapWeight(w);
    },
    async weightList(userId) {
      const rows = await prisma.weightEntry.findMany({
        where: { userId: Number(userId) },
        orderBy: { loggedDate: 'asc' }
      });
      return rows.map(mapWeight);
    },
    async weightUpdate(userId, id, input) {
      const data = {};
      for (const key of ['weightKg', 'note', 'loggedDate']) {
        if (input[key] !== undefined) data[key] = key === 'loggedDate' ? toDate(input[key]) : input[key];
      }
      const row = await prisma.weightEntry.update({ where: { id: Number(id) }, data });
      return mapWeight(row);
    },
    async weightDelete(userId, id) {
      const result = await prisma.weightEntry.deleteMany({ where: { id: Number(id), userId: Number(userId) } });
      return result.count > 0;
    },

    async workoutCreate({ userId, name, workoutDate, durationMinutes, caloriesBurned, notes, exercises }) {
      const workout = await prisma.workout.create({
        data: {
          userId: Number(userId),
          name,
          workoutDate: toDate(workoutDate),
          durationMinutes: durationMinutes ?? null,
          caloriesBurned: caloriesBurned ?? null,
          notes: notes ?? null,
          exercises: {
            create: (exercises || []).map((ex) => ({
              exerciseName: ex.exerciseName || ex.name,
              sets: ex.sets,
              reps: ex.reps,
              weightKg: ex.weightKg ?? ex.weight ?? 0,
              restSeconds: ex.restSeconds ?? ex.rest ?? 90,
              notes: ex.notes ?? null,
              isPr: !!ex.isPr
            }))
          }
        },
        include: { exercises: true }
      });
      return mapWorkout(workout);
    },
    async workoutList(userId) {
      const rows = await prisma.workout.findMany({
        where: { userId: Number(userId) },
        orderBy: { workoutDate: 'desc' },
        include: { exercises: true }
      });
      return rows.map(mapWorkout);
    },
    async workoutGet(userId, id) {
      const row = await prisma.workout.findFirst({ where: { id: Number(id), userId: Number(userId) }, include: { exercises: true } });
      return mapWorkout(row);
    },
    async workoutUpdate(userId, id, input) {
      const { exercises, ...rest } = input;
      const data = {};
      for (const key of ['name', 'durationMinutes', 'caloriesBurned', 'notes']) {
        if (rest[key] !== undefined) data[key] = rest[key];
      }
      if (rest.workoutDate !== undefined) data.workoutDate = toDate(rest.workoutDate);
      await prisma.$transaction(async (tx) => {
        if (Object.keys(data).length) {
          await tx.workout.update({ where: { id: Number(id) }, data });
        }
        if (exercises) {
          await tx.workoutExercise.deleteMany({ where: { workoutId: Number(id) } });
          for (const ex of exercises) {
            await tx.workoutExercise.create({
              data: {
                workoutId: Number(id),
                exerciseName: ex.exerciseName || ex.name,
                sets: ex.sets,
                reps: ex.reps,
                weightKg: ex.weightKg ?? ex.weight ?? 0,
                restSeconds: ex.restSeconds ?? ex.rest ?? 90,
                notes: ex.notes ?? null,
                isPr: !!ex.isPr
              }
            });
          }
        }
      });
      return db.workoutGet(userId, id);
    },
    async workoutDelete(userId, id) {
      const result = await prisma.workout.deleteMany({ where: { id: Number(id), userId: Number(userId) } });
      return result.count > 0;
    },

    async aiCacheGet(userId) {
      const row = await prisma.aiAnalysisCache.findUnique({ where: { userId: Number(userId) } });
      if (!row) return null;
      return { ...row, userId: row.userId, status: row.status, message: row.message, generatedAt: row.generatedAt, expiresAt: row.expiresAt };
    },
    async aiCacheSet({ userId, status, message, generatedAt, expiresAt }) {
      const row = await prisma.aiAnalysisCache.upsert({
        where: { userId: Number(userId) },
        update: { status, message, generatedAt, expiresAt },
        create: { userId: Number(userId), status, message, generatedAt, expiresAt }
      });
      return { ...row, userId: row.userId, status: row.status, message: row.message, generatedAt: row.generatedAt, expiresAt: row.expiresAt };
    }
  };

  return db;
}

export async function initMysqlStore() {
  const { PrismaClient } = await import('@prisma/client').catch(() => ({ PrismaClient: undefined }));
  if (!PrismaClient) {
    throw new Error('Prisma client not installed. Run "npm install -w server" then "npx prisma generate".');
  }
  const prisma = new PrismaClient({ datasourceUrl: config.db.url });
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    await prisma.$disconnect();
    throw new Error(`Cannot connect to MySQL at ${config.db.host}:${config.db.port} (${error.message}). Start your MySQL service and check DB_* env vars.`);
  }
  return createMysqlStore(prisma);
}
