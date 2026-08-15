import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Trophy, Video } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { VideoModal } from '../ui/VideoModal.jsx';
import { apiPost, apiPut } from '../../api/client.js';
import { todayKey } from '../../lib/format.js';

const exerciseSchema = z.object({
  exerciseName: z.string().min(1, 'Exercise name required'),
  sets: z.preprocess((v) => (v === '' || v === null || Number.isNaN(v) ? 1 : Number(v)), z.number().int().min(1, 'Sets must be > 0')),
  reps: z.preprocess((v) => (v === '' || v === null || Number.isNaN(v) ? 1 : Number(v)), z.number().int().min(1, 'Reps must be > 0')),
  weightKg: z.preprocess((v) => (v === '' || v === null || Number.isNaN(v) ? 0 : Number(v)), z.number().min(0)),
  restSeconds: z.preprocess((v) => (v === '' || v === null || Number.isNaN(v) ? 90 : Number(v)), z.number().min(0).optional().nullable())
});

const schema = z.object({
  name: z.string().min(1, 'Workout name required'),
  workoutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date required'),
  durationMinutes: z.preprocess((v) => (v === '' || v === null || Number.isNaN(v) ? null : Number(v)), z.number().positive().nullable().optional()),
  caloriesBurned: z.preprocess((v) => (v === '' || v === null || Number.isNaN(v) ? null : Number(v)), z.number().nonnegative().nullable().optional()),
  notes: z.string().nullable().optional(),
  exercises: z.array(exerciseSchema).min(1, 'Add at least one exercise')
});

export function WorkoutForm({ open, onClose, editing, onSaved }) {
  const isEdit = !!(editing && editing.id);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      workoutDate: todayKey(),
      durationMinutes: 45,
      caloriesBurned: 300,
      notes: '',
      exercises: [{ exerciseName: '', sets: 3, reps: 10, weightKg: 0, restSeconds: 90 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'exercises' });

  useEffect(() => {
    if (open) {
      setServerError(null);
      reset(
        editing
          ? {
              name: editing.name,
              workoutDate: editing.workoutDate,
              durationMinutes: editing.durationMinutes ?? 45,
              caloriesBurned: editing.caloriesBurned ?? null,
              notes: editing.notes ?? '',
              exercises: (editing.exercises || []).map((e) => ({
                exerciseName: e.exerciseName,
                sets: Number(e.sets) || 1,
                reps: Number(e.reps) || 1,
                weightKg: Number(e.weightKg) || 0,
                restSeconds: Number(e.restSeconds) || 90
              }))
            }
          : { name: '', workoutDate: todayKey(), durationMinutes: 45, caloriesBurned: 300, notes: '', exercises: [{ exerciseName: '', sets: 3, reps: 10, weightKg: 0, restSeconds: 90 }] }
      );
    }
  }, [open, editing, reset]);

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      if (isEdit) {
        await apiPut(`/workouts/${editing.id}`, values);
      } else {
        await apiPost('/workouts', values);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save workout:', err);
      setServerError(err.message || 'Failed to save workout. Please try again.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit workout' : 'Log a workout'}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {isEdit ? 'Save workout' : 'Add workout'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError ? (
          <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {serverError}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Workout name" placeholder="Push Day" error={errors.name?.message} {...register('name')} />
          <Input type="date" label="Date" error={errors.workoutDate?.message} {...register('workoutDate')} />
          <Input type="number" label="Duration (min)" error={errors.durationMinutes?.message} {...register('durationMinutes', { valueAsNumber: true })} />
          <Input type="number" label="Calories burned" error={errors.caloriesBurned?.message} {...register('caloriesBurned', { valueAsNumber: true })} />
          <Input label="Notes" placeholder="Felt strong" {...register('notes')} className="col-span-2" />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label-text mb-0">Exercises</span>
            <button
              type="button"
              onClick={() => append({ exerciseName: '', sets: 3, reps: 10, weightKg: 0, restSeconds: 90 })}
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
            >
              <Plus size={14} /> Add exercise
            </button>
          </div>
          {errors.exercises?.message || errors.exercises?.root?.message ? (
            <p className="mb-2 text-xs text-red-500">{errors.exercises.message || errors.exercises.root.message}</p>
          ) : null}
          {fields.length > 0 ? (
            <div className="mb-1.5 grid grid-cols-12 gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              <span className="col-span-5 sm:col-span-4">Exercise</span>
              <span className="col-span-2 text-center">Sets</span>
              <span className="col-span-2 text-center">Reps</span>
              <span className="col-span-2 sm:col-span-2 text-center">kg</span>
              <span className="hidden sm:block sm:col-span-1 text-center">Rest(s)</span>
              <span className="col-span-1 sm:col-span-1"></span>
            </div>
          ) : null}
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5 sm:col-span-4">
                  <Input placeholder="Incline Bench" {...register(`exercises.${index}.exerciseName`)} />
                </div>
                <div className="col-span-2">
                  <Input type="number" placeholder="3" className="text-center" {...register(`exercises.${index}.sets`, { valueAsNumber: true })} />
                </div>
                <div className="col-span-2">
                  <Input type="number" placeholder="10" className="text-center" {...register(`exercises.${index}.reps`, { valueAsNumber: true })} />
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <Input type="number" step="0.5" placeholder="0" className="text-center" {...register(`exercises.${index}.weightKg`, { valueAsNumber: true })} />
                </div>
                <div className="hidden sm:block sm:col-span-1">
                  <Input type="number" placeholder="90" className="text-center px-1" {...register(`exercises.${index}.restSeconds`, { valueAsNumber: true })} />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button type="button" onClick={() => remove(index)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400" aria-label="Remove exercise">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}

export function WorkoutCard({ workout, onEdit, onDelete }) {
  const [activeVideo, setActiveVideo] = useState(null);
  return (
    <>
      <div className="card-base p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-ink dark:text-neutral-100">{workout.name}</p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {new Date(workout.workoutDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              {workout.durationMinutes ? ` · ${workout.durationMinutes} min` : ''}
              {workout.caloriesBurned ? ` · ~${workout.caloriesBurned} kcal` : ''}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button onClick={() => onEdit(workout)} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200" aria-label="Edit workout">
              <PencilIcon />
            </button>
            <button onClick={() => onDelete(workout)} className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400" aria-label="Delete workout">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5">
          {workout.exercises.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium text-ink dark:text-neutral-100">{e.exerciseName}</span>
                {e.isPr ? (
                  <Badge tone="amber">
                    <Trophy size={11} /> PR
                  </Badge>
                ) : null}
                <button
                  type="button"
                  onClick={() => setActiveVideo({ name: e.exerciseName, url: e.videoUrl })}
                  className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 hover:bg-red-50 hover:text-red-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  title="Watch video tutorial"
                >
                  <Video size={10} /> Form
                </button>
              </span>
              <span className="shrink-0 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                {e.sets} × {e.reps} × {Number(e.weightKg)} kg
              </span>
            </li>
          ))}
        </ul>
        {workout.notes ? <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400">{workout.notes}</p> : null}
      </div>

      <VideoModal
        open={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        videoUrl={activeVideo?.url}
        exerciseName={activeVideo?.name}
      />
    </>
  );
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}
