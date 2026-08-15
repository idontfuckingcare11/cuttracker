import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Dumbbell, Trophy, CalendarCheck, Sparkles } from 'lucide-react';
import { apiGet, apiDelete } from '../api/client.js';
import { Button } from '../components/ui/Button.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Loading } from '../components/ui/Loading.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { WorkoutForm, WorkoutCard } from '../components/workout/WorkoutComponents.jsx';
import { AIWorkoutGeneratorModal } from '../components/workout/AIWorkoutGeneratorModal.jsx';

export default function Workout() {
  const [modalOpen, setModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['workouts'], queryFn: () => apiGet('/workouts') });
  const profile = queryClient.getQueryData(['dashboard'])?.profile;
  const workouts = data?.workouts || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['workouts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['progress'] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => apiDelete(`/workouts/${id}`),
    onSuccess: invalidate
  });

  const handleImportWorkout = (imported) => {
    setEditing({
      name: imported.name,
      workoutDate: new Date().toISOString().slice(0, 10),
      durationMinutes: imported.durationMinutes,
      caloriesBurned: imported.caloriesBurned,
      notes: imported.notes,
      exercises: imported.exercises
    });
    setModalOpen(true);
  };

  const prCount = workouts.reduce((sum, w) => sum + w.exercises.filter((e) => e.isPr).length, 0);
  const thisMonth = workouts.filter((w) => w.workoutDate.slice(0, 7) === new Date().toISOString().slice(0, 7)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Training log</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink dark:text-neutral-100">Every rep builds the cut.</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setAiModalOpen(true)}>
            <Sparkles size={15} /> AI Workout Generator
          </Button>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={15} /> Log workout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Dumbbell size={18} />} label="Total workouts" value={workouts.length} sub={profile ? `Goal: ${profile.trainingFrequency} days/week` : ''} />
        <StatCard icon={<CalendarCheck size={18} />} label="This month" value={thisMonth} />
        <StatCard icon={<Trophy size={18} />} label="Personal records" value={prCount} />
      </div>

      {isLoading ? (
        <Loading />
      ) : workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workouts yet"
          message="Generate a routine with AI or log your first session below."
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setAiModalOpen(true)}><Sparkles size={14} /> AI Generator</Button>
              <Button onClick={() => setModalOpen(true)}><Plus size={14} /> Log workout</Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {workouts.map((w) => (
            <WorkoutCard key={w.id} workout={w} onEdit={(workout) => { setEditing(workout); setModalOpen(true); }} onDelete={(workout) => deleteMutation.mutate(workout.id)} />
          ))}
        </div>
      )}

      <WorkoutForm open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} onSaved={invalidate} />
      <AIWorkoutGeneratorModal open={aiModalOpen} onClose={() => setAiModalOpen(false)} onImportWorkout={handleImportWorkout} />
    </div>
  );
}
