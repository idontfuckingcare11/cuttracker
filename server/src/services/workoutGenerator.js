import { config } from '../config.js';

const FALLBACK_PROGRAMS = {
  'chest & back': {
    mens: {
      name: 'Men\'s Chest & Lat Density Blast',
      durationMinutes: 50,
      caloriesBurned: 380,
      exercises: [
        { exerciseName: 'Incline Dumbbell Bench Press', sets: 4, reps: 10, weightKg: 22, restSeconds: 90, tips: 'Set bench to 30 degrees. Keep elbows tucked at 45° to protect shoulders.', videoQuery: 'Incline Dumbbell Bench Press proper form tutorial' },
        { exerciseName: 'Lat Pulldown (Wide Grip)', sets: 4, reps: 10, weightKg: 50, restSeconds: 90, tips: 'Pull bar down to upper chest, squeezing lats together at the bottom.', videoQuery: 'Lat Pulldown proper form tutorial' },
        { exerciseName: 'Flat Barbell Bench Press', sets: 3, reps: 8, weightKg: 60, restSeconds: 120, tips: 'Maintain slight arch in back, drive feet into ground.', videoQuery: 'Flat Barbell Bench Press form tutorial' },
        { exerciseName: 'Seated Cable Row', sets: 4, reps: 12, weightKg: 45, restSeconds: 90, tips: 'Keep torso upright, pull handles to belly button without swinging.', videoQuery: 'Seated Cable Row form tutorial' },
        { exerciseName: 'Push-Up to Cable Fly Superset', sets: 3, reps: 15, weightKg: 10, restSeconds: 60, tips: 'Focus on full chest stretch at the bottom and hard peak contraction.', videoQuery: 'Cable Chest Fly technique tutorial' }
      ]
    },
    womens: {
      name: 'Women\'s Sculpted Upper Body (Chest & Back)',
      durationMinutes: 45,
      caloriesBurned: 310,
      exercises: [
        { exerciseName: 'Incline Dumbbell Press', sets: 3, reps: 12, weightKg: 12, restSeconds: 60, tips: 'Control the descent for 2-3 seconds to maximize upper chest activation.', videoQuery: 'Incline Dumbbell Press women workout tutorial' },
        { exerciseName: 'Lat Pulldown or Assisted Pull-up', sets: 4, reps: 10, weightKg: 35, restSeconds: 90, tips: 'Engage core, initiate pull from back muscles rather than arms.', videoQuery: 'Lat Pulldown form for women' },
        { exerciseName: 'Single-Arm Dumbbell Row', sets: 3, reps: 12, weightKg: 14, restSeconds: 60, tips: 'Keep flat back, pull dumbbell towards hip pocket.', videoQuery: 'Single arm dumbbell row form' },
        { exerciseName: 'Dumbbell Chest Fly', sets: 3, reps: 15, weightKg: 8, restSeconds: 60, tips: 'Slight bend in elbows throughout, feel a deep stretch in chest.', videoQuery: 'Dumbbell Chest Fly technique' },
        { exerciseName: 'Face Pulls with Cable', sets: 3, reps: 15, weightKg: 15, restSeconds: 60, tips: 'Pull rope toward forehead, external rotating shoulders for posture.', videoQuery: 'Face pulls shoulder posture tutorial' }
      ]
    }
  },
  'push': {
    mens: {
      name: 'Men\'s Push Day (Chest, Shoulders & Triceps)',
      durationMinutes: 50,
      caloriesBurned: 360,
      exercises: [
        { exerciseName: 'Barbell Bench Press', sets: 4, reps: 8, weightKg: 65, restSeconds: 120, tips: 'Explode up on positive phase, lower under 2-sec control.', videoQuery: 'Barbell Bench Press execution' },
        { exerciseName: 'Standing Overhead Barbell Press', sets: 4, reps: 8, weightKg: 40, restSeconds: 90, tips: 'Tight glutes and core, press bar straight overhead.', videoQuery: 'Overhead Barbell Press form' },
        { exerciseName: 'Incline Dumbbell Chest Fly', sets: 3, reps: 12, weightKg: 14, restSeconds: 60, tips: 'Keep chest high, hug a wide tree motion.', videoQuery: 'Incline Dumbbell Fly tutorial' },
        { exerciseName: 'Triceps Rope Pushdown', sets: 4, reps: 12, weightKg: 25, restSeconds: 60, tips: 'Keep upper arms pinned to torso, flare rope out at bottom.', videoQuery: 'Tricep Rope Pushdown execution' }
      ]
    },
    womens: {
      name: 'Women\'s Upper Push & Shoulder Sculpt',
      durationMinutes: 40,
      caloriesBurned: 270,
      exercises: [
        { exerciseName: 'Dumbbell Shoulder Press', sets: 4, reps: 10, weightKg: 10, restSeconds: 60, tips: 'Press straight overhead without arching lower back.', videoQuery: 'Dumbbell Shoulder Press women form' },
        { exerciseName: 'Incline Dumbbell Press', sets: 3, reps: 12, weightKg: 10, restSeconds: 60, tips: 'Touch dumbbells gently at top without clanking.', videoQuery: 'Incline Dumbbell Press technique' },
        { exerciseName: 'Lateral Raises', sets: 4, reps: 15, weightKg: 5, restSeconds: 45, tips: 'Lead with elbows, pour the tea motion at top.', videoQuery: 'Dumbbell Lateral Raise form' },
        { exerciseName: 'Overhead Dumbbell Tricep Extension', sets: 3, reps: 12, weightKg: 10, restSeconds: 60, tips: 'Keep elbows pointing forward, full stretch at bottom.', videoQuery: 'Overhead Tricep Extension form' }
      ]
    }
  },
  'pull': {
    mens: {
      name: 'Men\'s Pull Day (Back, Rear Delts & Biceps)',
      durationMinutes: 50,
      caloriesBurned: 370,
      exercises: [
        { exerciseName: 'Barbell Bent-Over Row', sets: 4, reps: 8, weightKg: 60, restSeconds: 90, tips: 'Hinge at hips at 45°, pull bar to lower ribcage.', videoQuery: 'Barbell Bent Over Row execution' },
        { exerciseName: 'Neutral Grip Lat Pulldown', sets: 4, reps: 10, weightKg: 55, restSeconds: 90, tips: 'Drive elbows down and back.', videoQuery: 'Lat Pulldown neutral grip tutorial' },
        { exerciseName: 'Face Pulls', sets: 3, reps: 15, weightKg: 20, restSeconds: 60, tips: 'Squeeze rear delts at peak contraction.', videoQuery: 'Face Pulls rear delt form' },
        { exerciseName: 'Incline Dumbbell Bicep Curl', sets: 3, reps: 10, weightKg: 14, restSeconds: 60, tips: 'Let arms hang fully down for deep bicep stretch.', videoQuery: 'Incline Dumbbell Bicep Curl form' }
      ]
    },
    womens: {
      name: 'Women\'s Hourglass Back & Arm Sculpt',
      durationMinutes: 45,
      caloriesBurned: 290,
      exercises: [
        { exerciseName: 'Lat Pulldown', sets: 4, reps: 12, weightKg: 35, restSeconds: 60, tips: 'Creates the illusion of a smaller waist by building upper back.', videoQuery: 'Lat Pulldown women tutorial' },
        { exerciseName: 'Seated Cable Row', sets: 3, reps: 12, weightKg: 35, restSeconds: 60, tips: 'Pull shoulders back before bending elbows.', videoQuery: 'Seated Cable Row form' },
        { exerciseName: 'Dumbbell Hammer Curls', sets: 3, reps: 12, weightKg: 8, restSeconds: 60, tips: 'Palms facing each other, control the descent.', videoQuery: 'Dumbbell Hammer Curls technique' },
        { exerciseName: 'Rear Delt Dumbbell Fly', sets: 3, reps: 15, weightKg: 4, restSeconds: 45, tips: 'Hinge forward, lift with back of shoulders.', videoQuery: 'Rear Delt Fly form' }
      ]
    }
  },
  'legs': {
    mens: {
      name: 'Men\'s Quad & Hamstring Strength Program',
      durationMinutes: 55,
      caloriesBurned: 440,
      exercises: [
        { exerciseName: 'Barbell Back Squat', sets: 4, reps: 8, weightKg: 80, restSeconds: 120, tips: 'Squat to at least parallel depth, knees tracking over toes.', videoQuery: 'Barbell Back Squat proper depth tutorial' },
        { exerciseName: 'Romanian Deadlift (RDL)', sets: 4, reps: 10, weightKg: 70, restSeconds: 90, tips: 'Push hips back until hamstrings stretch, keep bar close to shins.', videoQuery: 'Romanian Deadlift form tutorial' },
        { exerciseName: 'Leg Press', sets: 3, reps: 12, weightKg: 150, restSeconds: 90, tips: 'Full range of motion without lower back lifting off seat.', videoQuery: 'Leg Press proper technique' },
        { exerciseName: 'Standing Calf Raises', sets: 4, reps: 15, weightKg: 40, restSeconds: 60, tips: 'Pause 1-second at bottom stretch and top squeeze.', videoQuery: 'Calf Raise form' }
      ]
    },
    womens: {
      name: 'Women\'s Glute, Hamstring & Booty Sculpt',
      durationMinutes: 50,
      caloriesBurned: 390,
      exercises: [
        { exerciseName: 'Barbell Hip Thrust', sets: 4, reps: 10, weightKg: 60, restSeconds: 90, tips: 'Chin tucked, drive through heels, hard 2-sec lockout squeeze at top.', videoQuery: 'Barbell Hip Thrust glute form tutorial' },
        { exerciseName: 'Romanian Deadlift (Dumbbell or Barbell)', sets: 4, reps: 10, weightKg: 30, restSeconds: 90, tips: 'Keep knees soft, hinge at hips to load glutes & hamstrings.', videoQuery: 'Dumbbell RDL glute focus' },
        { exerciseName: 'Bulgarian Split Squat', sets: 3, reps: 10, weightKg: 12, restSeconds: 60, tips: 'Lean slightly forward to bias glutes over quads.', videoQuery: 'Bulgarian Split Squat glute focus' },
        { exerciseName: 'Cable Glute Kickbacks', sets: 3, reps: 15, weightKg: 12, restSeconds: 45, tips: 'Kick back at 45 degree angle for maximum glute medius squeeze.', videoQuery: 'Cable Glute Kickbacks form' }
      ]
    }
  }
};

function getYouTubeUrls(query) {
  const q = encodeURIComponent(query);
  return {
    searchUrl: `https://www.youtube.com/results?search_query=${q}`,
    embedSearchUrl: `https://www.youtube.com/results?search_query=${q}`
  };
}

export async function generateWorkoutProgram({ targetMuscles = 'Chest & Back', audience = 'mens', fitnessLevel = 'intermediate' }) {
  const key = targetMuscles.toLowerCase().trim();
  const gender = audience.toLowerCase().includes('women') ? 'womens' : 'mens';

  // Find match in presets or construct fallback program
  let preset = null;
  for (const [k, v] of Object.entries(FALLBACK_PROGRAMS)) {
    if (key.includes(k) || k.includes(key)) {
      preset = v[gender] || v.mens;
      break;
    }
  }

  if (!preset) {
    // General upper/lower program generator fallback
    const isUpper = key.includes('chest') || key.includes('back') || key.includes('arm') || key.includes('shoulder') || key.includes('push') || key.includes('pull');
    preset = {
      name: `${targetMuscles.charAt(0).toUpperCase() + targetMuscles.slice(1)} (${gender === 'womens' ? "Women's" : "Men's"} Custom Program)`,
      durationMinutes: 45,
      caloriesBurned: 320,
      exercises: isUpper
        ? [
            { exerciseName: 'Incline Dumbbell Press', sets: 4, reps: 10, weightKg: gender === 'womens' ? 10 : 20, restSeconds: 90, tips: 'Control the negative phase, press smoothly.', videoQuery: 'Incline Dumbbell Press tutorial' },
            { exerciseName: 'Lat Pulldown', sets: 4, reps: 10, weightKg: gender === 'womens' ? 35 : 50, restSeconds: 90, tips: 'Pull with your back, not your forearms.', videoQuery: 'Lat Pulldown tutorial' },
            { exerciseName: 'Seated Cable Row', sets: 3, reps: 12, weightKg: gender === 'womens' ? 30 : 45, restSeconds: 60, tips: 'Squeeze shoulder blades together.', videoQuery: 'Seated Cable Row tutorial' },
            { exerciseName: 'Dumbbell Lateral Raise', sets: 3, reps: 15, weightKg: gender === 'womens' ? 5 : 10, restSeconds: 45, tips: 'Lead with your elbows.', videoQuery: 'Dumbbell Lateral Raise tutorial' }
          ]
        : [
            { exerciseName: 'Barbell Squat', sets: 4, reps: 8, weightKg: gender === 'womens' ? 40 : 70, restSeconds: 120, tips: 'Break at hips and knees together.', videoQuery: 'Barbell Squat form tutorial' },
            { exerciseName: 'Romanian Deadlift', sets: 4, reps: 10, weightKg: gender === 'womens' ? 30 : 60, restSeconds: 90, tips: 'Hinge back to stretch hamstrings.', videoQuery: 'Romanian Deadlift form tutorial' },
            { exerciseName: 'Walking Dumbbell Lunges', sets: 3, reps: 12, weightKg: gender === 'womens' ? 10 : 16, restSeconds: 60, tips: 'Keep torso upright.', videoQuery: 'Dumbbell Lunges form' }
          ]
    };
  }

  // Optional: Try Groq LLM if API Key is set for hyper-customized workouts
  if (config.groq.apiKey) {
    try {
      const prompt = `Generate a structured workout program formatted as JSON for target muscles: "${targetMuscles}", target gender/audience: "${gender}".
Rules:
- Include 4-5 exercises.
- Provide realistic sets (3-4), reps (8-15), weightKg (number), restSeconds (45-120).
- Provide a brief 1-sentence form tip.
- Provide a videoQuery string to search YouTube for proper form.
Return EXACT JSON format:
{
  "name": "Program Name",
  "durationMinutes": 45,
  "caloriesBurned": 350,
  "exercises": [
    { "exerciseName": "...", "sets": 4, "reps": 10, "weightKg": 20, "restSeconds": 90, "tips": "...", "videoQuery": "..." }
  ]
}`;

      const res = await fetch(config.groq.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.groq.apiKey}`
        },
        body: JSON.stringify({
          model: config.groq.model,
          temperature: 0.6,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (res.ok) {
        const json = await res.json();
        const text = json?.choices?.[0]?.message?.content || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.exercises && parsed.exercises.length > 0) {
            preset = parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[workout-ai] Groq LLM request failed, using structured fallback:', e.message);
    }
  }

  // Enrich exercises with YouTube links
  const enrichedExercises = preset.exercises.map((ex) => {
    const urls = getYouTubeUrls(ex.videoQuery || `${ex.exerciseName} form tutorial`);
    return {
      ...ex,
      youtubeSearchUrl: urls.searchUrl,
      youtubeEmbedUrl: urls.embedSearchUrl
    };
  });

  return {
    name: preset.name,
    targetMuscles,
    audience: gender,
    durationMinutes: preset.durationMinutes || 45,
    caloriesBurned: preset.caloriesBurned || 300,
    exercises: enrichedExercises
  };
}
