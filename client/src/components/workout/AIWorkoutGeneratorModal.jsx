import { useState } from 'react';
import { Sparkles, Video, Play, Plus, Flame, Clock, Dumbbell } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { VideoModal } from '../ui/VideoModal.jsx';
import { apiPost } from '../../api/client.js';

const TARGET_PRESETS = [
  'Chest & Back',
  'Push (Chest/Shoulders/Triceps)',
  'Pull (Back/Biceps)',
  'Legs & Glutes',
  'Arms & Core',
  'Full Body'
];

export function AIWorkoutGeneratorModal({ open, onClose, onImportWorkout }) {
  const [target, setTarget] = useState('Chest & Back');
  const [customTarget, setCustomTarget] = useState('');
  const [audience, setAudience] = useState('mens'); // mens, womens
  const [loading, setLoading] = useState(false);
  const [program, setProgram] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null); // { name, url }

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const selectedTarget = customTarget.trim() || target;
      const res = await apiPost('/workouts/suggest', {
        targetMuscles: selectedTarget,
        audience
      });
      setProgram(res.program);
    } catch (err) {
      console.error('Failed to generate workout:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!program) return;
    onImportWorkout({
      name: program.name,
      durationMinutes: program.durationMinutes,
      caloriesBurned: program.caloriesBurned,
      notes: `AI Generated program for ${program.targetMuscles} (${program.audience})`,
      exercises: program.exercises.map((ex) => ({
        exerciseName: ex.exerciseName,
        sets: ex.sets,
        reps: ex.reps,
        weightKg: ex.weightKg || 0,
        restSeconds: ex.restSeconds || 90
      }))
    });
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="✨ AI Workout Generator"
        maxWidth="max-w-3xl"
        footer={
          program ? (
            <>
              <Button variant="ghost" onClick={() => setProgram(null)}>
                Change options
              </Button>
              <Button onClick={handleImport}>
                <Plus size={15} /> Log this workout now
              </Button>
            </>
          ) : null
        }
      >
        {!program ? (
          <div className="space-y-5">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Tell the AI what you want to train today (e.g. <strong>Chest & Back</strong>) and select your routine style.
            </p>

            <div>
              <label className="label-text mb-2">1. Select Target Muscle Group</label>
              <div className="flex flex-wrap gap-2">
                {TARGET_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setTarget(preset);
                      setCustomTarget('');
                    }}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      target === preset && !customTarget
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Or type custom (e.g. Upper Body & Abs)..."
                  value={customTarget}
                  onChange={(e) => setCustomTarget(e.target.value)}
                  className="input-field text-xs"
                />
              </div>
            </div>

            <div>
              <label className="label-text mb-2">2. Workout Audience / Style</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setAudience('mens')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition ${
                    audience === 'mens'
                      ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                      : 'border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
                  }`}
                >
                  👨 Men's Hypertrophy & Strength
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('womens')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition ${
                    audience === 'womens'
                      ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                      : 'border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
                  }`}
                >
                  👩 Women's Tone & Sculpt Focus
                </button>
              </div>
            </div>

            <Button onClick={handleGenerate} loading={loading} className="w-full py-3">
              <Sparkles size={16} /> Generate {customTarget || target} Workout (3-5 Exercises)
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-neutral-900 p-5 text-white dark:bg-white dark:text-neutral-900">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider dark:bg-neutral-900/20">
                  <Sparkles size={11} /> AI Generated Program
                </div>
                <h3 className="mt-1 text-xl font-extrabold">{program.name}</h3>
                <p className="text-xs opacity-75">
                  Target: {program.targetMuscles} · {program.audience === 'womens' ? "Women's Focus" : "Men's Focus"}
                </p>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-base font-extrabold flex items-center justify-center gap-1">
                    <Clock size={14} /> {program.durationMinutes}m
                  </p>
                  <p className="text-[10px] opacity-75">Est. Duration</p>
                </div>
                <div>
                  <p className="text-base font-extrabold flex items-center justify-center gap-1">
                    <Flame size={14} /> ~{program.caloriesBurned}
                  </p>
                  <p className="text-[10px] opacity-75">Est. Burn</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Recommended Exercises ({program.exercises.length}) & Video References
              </p>
              {program.exercises.map((ex, index) => (
                <div key={index} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-ink dark:text-neutral-100 flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-extrabold dark:bg-neutral-800">
                          {index + 1}
                        </span>
                        {ex.exerciseName}
                      </h4>
                      {ex.tips ? (
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          💡 <span className="italic">{ex.tips}</span>
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="gray">
                        {ex.sets} sets × {ex.reps} reps @ {ex.weightKg ? `${ex.weightKg} kg` : 'Bodyweight'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                    <span className="text-[11px] text-neutral-400">Rest: {ex.restSeconds || 90}s between sets</span>
                    <button
                      type="button"
                      onClick={() => setActiveVideo({ name: ex.exerciseName, url: ex.youtubeSearchUrl })}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60"
                    >
                      <Play size={13} fill="currentColor" /> Watch Video Reference
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <VideoModal
        open={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        videoUrl={activeVideo?.url}
        exerciseName={activeVideo?.name}
      />
    </>
  );
}
