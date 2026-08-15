import { useState } from 'react';
import { CheckCircle2, Dumbbell, Trophy, Video, Calendar } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { VideoModal } from '../ui/VideoModal.jsx';

export function TodayWorkoutCard({ workout }) {
  const [activeVideo, setActiveVideo] = useState(null);

  if (!workout) {
    return (
      <div className="card-base p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink dark:text-neutral-100">
          <Dumbbell size={16} /> Today's Workout
        </div>
        <EmptyState icon={Dumbbell} title="No workout logged today" message="Log your training session to keep your streak visible on your dashboard." />
      </div>
    );
  }

  const prs = (workout.exercises || []).filter((e) => e.isPr);
  const formattedDate = new Date(workout.workoutDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <>
      <div className="card-base p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-neutral-100">
            <Dumbbell size={16} /> {workout.isLatest ? 'Latest Workout' : "Today's Workout"}
            {workout.isLatest ? (
              <Badge tone="gray">
                <Calendar size={11} /> {formattedDate}
              </Badge>
            ) : (
              <Badge tone="green">
                <CheckCircle2 size={12} /> Completed Today
              </Badge>
            )}
          </div>
        </div>
        <p className="text-base font-bold text-ink dark:text-neutral-100">{workout.name}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
          <span>{workout.exerciseCount || (workout.exercises || []).length} exercises</span>
          {workout.durationMinutes ? <span>{workout.durationMinutes} min</span> : null}
          {workout.caloriesBurned ? <span>~{workout.caloriesBurned} kcal burned</span> : null}
        </div>

        {workout.exercises && workout.exercises.length > 0 ? (
          <ul className="mt-3 space-y-1.5 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            {workout.exercises.map((e) => (
              <li key={e.id || e.exerciseName} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-medium text-ink dark:text-neutral-100">{e.exerciseName}</span>
                  {e.isPr ? (
                    <Badge tone="amber">
                      <Trophy size={10} /> PR
                    </Badge>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setActiveVideo({ name: e.exerciseName, url: e.videoUrl })}
                    className="inline-flex items-center gap-1 rounded bg-neutral-100 px-1 py-0.5 text-[10px] font-semibold text-neutral-600 hover:bg-red-50 hover:text-red-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    title="Watch video tutorial"
                  >
                    <Video size={10} /> Form
                  </button>
                </span>
                <span className="shrink-0 font-semibold text-neutral-500 dark:text-neutral-400">
                  {e.sets} × {e.reps} × {Number(e.weightKg)} kg
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {prs.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs border-t border-neutral-100 pt-2 dark:border-neutral-800">
            <Trophy size={13} className="text-amber-500" />
            <span className="font-semibold text-ink dark:text-neutral-100">PRs Hit:</span>
            {prs.map((e) => (
              <Badge key={e.id || e.exerciseName} tone="amber">
                {e.exerciseName}
              </Badge>
            ))}
          </div>
        ) : null}
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
