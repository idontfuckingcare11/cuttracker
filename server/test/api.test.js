import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { initStore, resetStore } from '../src/lib/db/index.js';
import { createApp } from '../src/app.js';
import { todayKey } from '../src/lib/date.js';

let app;

const ONBOARDING = {
  age: 27,
  sex: 'male',
  heightCm: 170,
  currentWeightKg: 71.9,
  goalWeightKg: 65,
  activityLevel: 'moderate',
  trainingFrequency: 5,
  weeklyLossRateKg: 0.5
};

const runTag = Date.now();

async function register(email, password = 'Password123!') {
  const uniqueEmail = email.includes('@') ? email.replace('@', `+${runTag}_${Math.floor(Math.random()*10000)}@`) : email;
  const res = await request(app).post('/api/auth/register').send({ email: uniqueEmail, password });
  expect(res.status).toBe(201);
  return res.headers['set-cookie'][0].split(';')[0];
}

async function registerAndOnboard(email) {
  const cookie = await register(email);
  const res = await request(app).post('/api/profile/onboarding').set('Cookie', cookie).send(ONBOARDING);
  expect(res.status).toBe(201);
  return cookie;
}

import { config } from '../src/config.js';
config.storageEngine = 'memory';
process.env.STORAGE_ENGINE = 'memory';

beforeAll(async () => {
  resetStore();
  await initStore({ seed: false });
  app = createApp();
});

describe('health + public calculator', () => {
  it('reports healthy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.engine).toBeTruthy();
  });

  it('estimates calorie + macro targets and warns on aggressive deficit', async () => {
    const res = await request(app).post('/api/calculator/estimate').send({ ...ONBOARDING, weeklyLossRateKg: 1.5 });
    expect(res.status).toBe(200);
    expect(res.body.proteinG * 4 + res.body.carbG * 4 + res.body.fatG * 9).toBe(res.body.dailyCalorieTarget);
    expect(res.body.deficitWarning).toBeTruthy();
  });

  it('rejects invalid calculator input', async () => {
    const res = await request(app).post('/api/calculator/estimate').send({ ...ONBOARDING, heightCm: 0 });
    expect(res.status).toBe(400);
  });
});

describe('auth', () => {
  it('rejects weak passwords', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'short' });
    expect(res.status).toBe(400);
  });
  it('rejects bad emails', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: 'Password123!' });
    expect(res.status).toBe(400);
  });
  it('rejects duplicate emails', async () => {
    const dupEmail = `dup_${Date.now()}@test.com`;
    const res1 = await request(app).post('/api/auth/register').send({ email: dupEmail, password: 'Password123!' });
    expect(res1.status).toBe(201);
    const res2 = await request(app).post('/api/auth/register').send({ email: dupEmail, password: 'Password123!' });
    expect(res2.status).toBe(409);
  });
  it('rejects wrong password at login', async () => {
    const loginEmail = `login_${Date.now()}@test.com`;
    await request(app).post('/api/auth/register').send({ email: loginEmail, password: 'Password123!' });
    const res = await request(app).post('/api/auth/login').send({ email: loginEmail, password: 'WrongPass123!' });
    expect(res.status).toBe(401);
  });
  it('blocks protected routes without a session', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });
  it('logout invalidates the session cookie', async () => {
    const cookie = await registerAndOnboard('logout@test.com');
    await request(app).post('/api/auth/logout').set('Cookie', cookie);
    const res = await request(app).get('/api/dashboard').set('Cookie', cookie);
    expect(res.status).toBe(401);
  });
  it('allows logging back in after a logout', async () => {
    const reloginEmail = `relogin_${Date.now()}@test.com`;
    const regRes = await request(app).post('/api/auth/register').send({ email: reloginEmail, password: 'Password123!' });
    expect(regRes.status).toBe(201);
    const cookie = regRes.headers['set-cookie'][0].split(';')[0];
    await request(app).post('/api/profile/onboarding').set('Cookie', cookie).send(ONBOARDING).expect(201);
    await request(app).post('/api/auth/logout').set('Cookie', cookie);
    const stale = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(stale.status).toBe(401);
    const loginRes = await request(app).post('/api/auth/login').send({ email: reloginEmail, password: 'Password123!' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.email).toBe(reloginEmail);
    const newCookie = loginRes.headers['set-cookie'][0].split(';')[0];
    const me = await request(app).get('/api/auth/me').set('Cookie', newCookie);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(reloginEmail);
  });
  it('password reset flow issues a dev link and resets the password', async () => {
    const resetEmail = `reset_${Date.now()}@test.com`;
    await request(app).post('/api/auth/register').send({ email: resetEmail, password: 'Password123!' });
    const forgot = await request(app).post('/api/auth/forgot-password').send({ email: resetEmail });
    expect(forgot.status).toBe(200);
    expect(forgot.body.devLink).toBeTruthy();
    const token = forgot.body.devLink.split('token=')[1];
    const resetRes = await request(app).post('/api/auth/reset-password').send({ token, password: 'NewPass123!' });
    expect(resetRes.status).toBe(200);
    const loginOld = await request(app).post('/api/auth/login').send({ email: resetEmail, password: 'Password123!' });
    expect(loginOld.status).toBe(401);
    const loginNew = await request(app).post('/api/auth/login').send({ email: resetEmail, password: 'NewPass123!' });
    expect(loginNew.status).toBe(200);
  });
  it('rejects expired reset tokens', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'does-not-exist', password: 'NewPass123!' });
    expect(res.status).toBe(400);
  });
  it('supports authentication via Authorization Bearer token header', async () => {
    const email = `bearer_${Date.now()}@test.com`;
    const regRes = await request(app).post('/api/auth/register').send({ email, password: 'Password123!' });
    expect(regRes.status).toBe(201);
    expect(regRes.body.token).toBeTruthy();
    const token = regRes.body.token;

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);

    const logoutRes = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(logoutRes.status).toBe(200);

    const staleMe = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(staleMe.status).toBe(401);
  });
});

describe('onboarding + profile', () => {
  it('onboarding creates a profile with balanced macros', async () => {
    const cookie = await register('onboard@test.com');
    const me = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(me.body.needsOnboarding).toBe(true);
    const res = await request(app).post('/api/profile/onboarding').set('Cookie', cookie).send(ONBOARDING);
    expect(res.status).toBe(201);
    expect(res.body.profile.dailyCalorieTarget).toBeGreaterThan(1200);
    expect(res.body.profile.proteinTargetG * 4 + res.body.profile.carbTargetG * 4 + res.body.profile.fatTargetG * 9).toBe(res.body.profile.dailyCalorieTarget);
  });
  it('prevents onboarding twice', async () => {
    const cookie = await registerAndOnboard('twice@test.com');
    const res = await request(app).post('/api/profile/onboarding').set('Cookie', cookie).send(ONBOARDING);
    expect(res.status).toBe(409);
  });
  it('profile edit recalculates targets', async () => {
    const cookie = await registerAndOnboard('edit@test.com');
    const res = await request(app).put('/api/profile').set('Cookie', cookie).send({ goalWeightKg: 68 });
    expect(res.status).toBe(200);
    expect(res.body.profile.goalWeightKg).toBe(68);
  });
});

describe('food entries', () => {
  it('creates and lists a custom entry with totals', async () => {
    const cookie = await registerAndOnboard('food@test.com');
    const created = await request(app).post('/api/food-entries').set('Cookie', cookie).send({
      name: 'Protein shake',
      servingSize: '1 scoop',
      calories: 120,
      proteinG: 24,
      carbsG: 3,
      fatG: 1.5,
      mealType: 'breakfast',
      quantity: 1,
      loggedDate: todayKey()
    });
    expect(created.status).toBe(201);
    const list = await request(app).get('/api/food-entries').set('Cookie', cookie);
    expect(list.body.entries).toHaveLength(1);
    expect(list.body.totals.calories).toBe(120);
    expect(list.body.meals.breakfast.calories).toBe(120);
  });
  it('validates meal type', async () => {
    const cookie = await registerAndOnboard('mealm@test.com');
    const res = await request(app).post('/api/food-entries').set('Cookie', cookie).send({
      name: 'X',
      servingSize: '1',
      calories: 10,
      proteinG: 1,
      carbsG: 1,
      fatG: 1,
      mealType: 'brunch',
      loggedDate: '2026-01-01'
    });
    expect(res.status).toBe(400);
  });

  it('estimates food nutrition accurately without false keyword matches', async () => {
    const cookie = await registerAndOnboard('estimate@test.com');

    // Test Chicken Humba (must not match Pork Humba 330 kcal)
    const chickenRes = await request(app).post('/api/foods/estimate').set('Cookie', cookie).send({ name: 'Chicken Humba', grams: 100 });
    expect(chickenRes.status).toBe(200);
    expect(chickenRes.body.calories).toBe(220);
    expect(chickenRes.body.proteinG).toBe(24);

    // Test Pork Humba
    const porkRes = await request(app).post('/api/foods/estimate').set('Cookie', cookie).send({ name: 'Pork Humba', grams: 100 });
    expect(porkRes.status).toBe(200);
    expect(porkRes.body.calories).toBe(330);
    expect(porkRes.body.proteinG).toBe(16);

    // Test unknown food triggers heuristic estimation
    const customRes = await request(app).post('/api/foods/estimate').set('Cookie', cookie).send({ name: 'Fried Spicy Chicken Wings', grams: 100 });
    expect(customRes.status).toBe(200);
    expect(customRes.body.source).toBe('heuristic');
    expect(customRes.body.calories).toBeGreaterThan(150);
  });
});

describe('weight entries', () => {
  it('creates entries and reports stats', async () => {
    const cookie = await registerAndOnboard('weight@test.com');
    for (const [i, w] of [72, 71.8, 71.5, 71.2].entries()) {
      const date = new Date();
      date.setDate(date.getDate() - (3 - i));
      await request(app).post('/api/weight-entries').set('Cookie', cookie).send({ weightKg: w, loggedDate: date.toISOString().slice(0, 10) });
    }
    const res = await request(app).get('/api/weight-entries/stats').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.stats.start).toBe(72);
    expect(res.body.stats.current).toBe(71.6);
    expect(res.body.stats.remaining).toBe(6.6);
    expect(res.body.series).toHaveLength(4);
    expect(res.body.series[0].id).toBeTruthy();

    // Delete an entry using id from series
    const entryToDelete = res.body.series[0];
    const delRes = await request(app).delete(`/api/weight-entries/${entryToDelete.id}`).set('Cookie', cookie);
    expect(delRes.status).toBe(200);

    // Verify series length is reduced
    const afterDel = await request(app).get('/api/weight-entries/stats').set('Cookie', cookie);
    expect(afterDel.body.series).toHaveLength(3);
  });
});

describe('workouts + PR detection', () => {
  it('marks a heavier lift as a PR and an equal/lighter lift as not', async () => {
    const cookie = await registerAndOnboard('pr@test.com');
    const first = await request(app).post('/api/workouts').set('Cookie', cookie).send({
      name: 'Push A',
      workoutDate: '2026-08-01',
      durationMinutes: 50,
      caloriesBurned: 300,
      exercises: [{ exerciseName: 'Bench Press', sets: 3, reps: 10, weightKg: 50, restSeconds: 90 }]
    });
    expect(first.status).toBe(201);
    expect(first.body.workout.exercises[0].isPr).toBe(true);

    const second = await request(app).post('/api/workouts').set('Cookie', cookie).send({
      name: 'Push B',
      workoutDate: '2026-08-05',
      exercises: [{ exerciseName: 'Bench Press', sets: 3, reps: 10, weightKg: 45, restSeconds: 90 }]
    });
    expect(second.body.workout.exercises[0].isPr).toBe(false);

    const third = await request(app).post('/api/workouts').set('Cookie', cookie).send({
      name: 'Push C',
      workoutDate: '2026-08-08',
      exercises: [{ exerciseName: 'Bench Press', sets: 3, reps: 10, weightKg: 55, restSeconds: 90 }]
    });
    expect(third.body.workout.exercises[0].isPr).toBe(true);
  });
});

describe('dashboard + progress + analysis', () => {
  it('dashboard returns all key sections', async () => {
    const cookie = await registerAndOnboard('dash@test.com');
    await request(app).post('/api/weight-entries').set('Cookie', cookie).send({ weightKg: 71.9, loggedDate: todayKey() });
    await request(app).post('/api/food-entries').set('Cookie', cookie).send({
      name: 'Lunch',
      servingSize: '1',
      calories: 800,
      proteinG: 50,
      carbsG: 80,
      fatG: 20,
      mealType: 'lunch',
      loggedDate: todayKey()
    });
    const res = await request(app).get('/api/dashboard').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.calories.consumed).toBe(800);
    expect(res.body.weight.current).toBe(71.9);
    expect(res.body.aiInsight.message).toBeTruthy();
    expect(Array.isArray(res.body.notifications)).toBe(true);
  });

  it('progress returns stats and charts', async () => {
    const cookie = await registerAndOnboard('progress@test.com');
    const res = await request(app).get('/api/progress').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.stats).toHaveProperty('progressPct');
    expect(Array.isArray(res.body.charts.weight)).toBe(true);
    expect(res.body.charts.calories).toHaveLength(28);
  });

  it('analysis returns a status and message', async () => {
    const cookie = await registerAndOnboard('analysis@test.com');
    const res = await request(app).post('/api/analysis/cut-status').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(['on_track', 'too_slow', 'too_fast']).toContain(res.body.status);
    expect(res.body.message).toBeTruthy();
  });
});

describe('data isolation', () => {
  let cookieA;
  let cookieB;
  let entryIdA;
  let weightIdA;
  let workoutIdA;

  beforeEach(async () => {
    cookieA = await registerAndOnboard(`iso-a-${Date.now()}@test.com`);
    cookieB = await registerAndOnboard(`iso-b-${Date.now()}@test.com`);

    const entryRes = await request(app).post('/api/food-entries').set('Cookie', cookieA).send({
      name: 'Secret meal',
      servingSize: '1',
      calories: 999,
      proteinG: 10,
      carbsG: 10,
      fatG: 10,
      mealType: 'dinner',
      loggedDate: todayKey()
    });
    entryIdA = entryRes.body.entry.id;

    const weightRes = await request(app).post('/api/weight-entries').set('Cookie', cookieA).send({ weightKg: 71.9, loggedDate: '2026-08-10' });
    weightIdA = weightRes.body.entry.id;

    const workoutRes = await request(app).post('/api/workouts').set('Cookie', cookieA).send({
      name: 'Secret Workout',
      workoutDate: '2026-08-10',
      exercises: [{ exerciseName: 'Squat', sets: 3, reps: 5, weightKg: 80 }]
    });
    workoutIdA = workoutRes.body.workout.id;
  });

  it('user B cannot read user A entries', async () => {
    const res = await request(app).get('/api/food-entries').set('Cookie', cookieB);
    expect(res.body.entries).toHaveLength(0);
  });

  it('user B cannot update or delete user A entries', async () => {
    const update = await request(app).put(`/api/food-entries/${entryIdA}`).set('Cookie', cookieB).send({ calories: 1 });
    expect(update.status).toBe(404);
    const del = await request(app).delete(`/api/food-entries/${entryIdA}`).set('Cookie', cookieB);
    expect(del.status).toBe(404);
  });

  it('user B cannot see, update, or delete user A weights', async () => {
    const list = await request(app).get('/api/weight-entries').set('Cookie', cookieB);
    expect(list.body.entries).toHaveLength(0);
    const update = await request(app).put(`/api/weight-entries/${weightIdA}`).set('Cookie', cookieB).send({ weightKg: 60 });
    expect(update.status).toBe(404);
    const del = await request(app).delete(`/api/weight-entries/${weightIdA}`).set('Cookie', cookieB);
    expect(del.status).toBe(404);
  });

  it('user B cannot see, update, or delete user A workouts', async () => {
    const list = await request(app).get('/api/workouts').set('Cookie', cookieB);
    expect(list.body.workouts).toHaveLength(0);
    const get = await request(app).get(`/api/workouts/${workoutIdA}`).set('Cookie', cookieB);
    expect(get.status).toBe(404);
    const del = await request(app).delete(`/api/workouts/${workoutIdA}`).set('Cookie', cookieB);
    expect(del.status).toBe(404);
  });

  it('dashboards do not cross-pollute', async () => {
    const resA = await request(app).get('/api/dashboard').set('Cookie', cookieA);
    const resB = await request(app).get('/api/dashboard').set('Cookie', cookieB);
    expect(resA.body.calories.consumed).toBe(999);
    expect(resB.body.calories.consumed).toBe(0);
  });
});
