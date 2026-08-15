import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, UtensilsCrossed, Flame, CalendarDays } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../api/client.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Loading } from '../components/ui/Loading.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { MealSection } from '../components/food/MealSection.jsx';
import { AddFoodEntryModal } from '../components/food/AddFoodEntryModal.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { fmtDay, todayKey } from '../lib/format.js';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack', 'extra'];

export default function Food() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['food-entries', date],
    queryFn: () => apiGet(`/food-entries?date=${date}`)
  });
  const { data: foodsData } = useQuery({ queryKey: ['foods'], queryFn: () => apiGet('/foods') });
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => apiGet('/profile') });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['food-entries', date] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['progress'] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => apiDelete(`/food-entries/${id}`),
    onSuccess: invalidate
  });

  const changeDay = (dir) => {
    const base = new Date(date + 'T00:00:00');
    setDate(format(dir < 0 ? subDays(base, 1) : addDays(base, 1), 'yyyy-MM-dd'));
  };

  const isToday = date === format(new Date(), 'yyyy-MM-dd');
  const foods = foodsData?.foods || [];
  const entries = data?.entries || [];
  const totals = data?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const proteinTarget = profile?.proteinTargetG || 140;
  const carbTarget = profile?.carbTargetG || 200;
  const fatTarget = profile?.fatTargetG || 60;
  const calTarget = profile?.dailyCalorieTarget || 2000;

  const startEdit = (entry) => {
    setEditing(entry);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Food log</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink dark:text-neutral-100">What did you eat?</h1>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus size={15} /> Add food
        </Button>
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-1">
            <button onClick={() => changeDay(-1)} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800" aria-label="Previous day">
              <ChevronLeft size={17} />
            </button>
            <span className="inline-flex min-w-32 items-center justify-center gap-1.5 text-sm font-bold text-ink dark:text-neutral-100">
              <CalendarDays size={15} className="text-neutral-400" /> {fmtDay(date)}
            </span>
            <button onClick={() => changeDay(1)} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800" aria-label="Next day">
              <ChevronRight size={17} />
            </button>
          </div>
          {!isToday ? (
            <Button variant="ghost" onClick={() => setDate(format(new Date(), 'yyyy-MM-dd'))}>
              Jump to today
            </Button>
          ) : null}
        </CardBody>
      </Card>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <Card>
            <CardHeader
              title="Today's totals"
              action={
                <span className={`text-sm font-extrabold ${totals.calories > calTarget ? 'text-red-500' : 'text-ink dark:text-neutral-100'}`}>
                  {totals.calories} <span className="text-xs font-medium text-neutral-400">/ {calTarget} kcal</span>
                </span>
              }
            />
            <CardBody className="space-y-3">
              <ProgressBar percent={(totals.calories / Math.max(1, calTarget)) * 100} color={totals.calories > calTarget ? 'bg-red-500 dark:bg-red-400' : undefined} />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/60">
                  <p className="text-lg font-extrabold text-ink dark:text-neutral-100">{Math.round(totals.protein)}<span className="text-xs font-medium text-neutral-400">g</span></p>
                  <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Protein / {proteinTarget}g</p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/60">
                  <p className="text-lg font-extrabold text-ink dark:text-neutral-100">{Math.round(totals.carbs)}<span className="text-xs font-medium text-neutral-400">g</span></p>
                  <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Carbs / {carbTarget}g</p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/60">
                  <p className="text-lg font-extrabold text-ink dark:text-neutral-100">{Math.round(totals.fat)}<span className="text-xs font-medium text-neutral-400">g</span></p>
                  <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Fat / {fatTarget}g</p>
                </div>
              </div>
            </CardBody>
          </Card>


          {entries.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="Nothing logged yet"
              message="Add your first meal for this day and the totals above will update automatically."
              action={<Button variant="secondary" onClick={() => setModalOpen(true)}><Plus size={14} /> Add food</Button>}
            />
          ) : null}

          <div className="space-y-4">
            {MEALS.map((meal) => {
              const mealEntries = entries.filter((e) => e.mealType === meal);
              const subtotal = mealEntries.reduce(
                (acc, e) => ({ calories: acc.calories + e.calories, protein: acc.protein + e.proteinG, carbs: acc.carbs + e.carbsG, fat: acc.fat + e.fatG }),
                { calories: 0, protein: 0, carbs: 0, fat: 0 }
              );
              return (
                <MealSection
                  key={meal}
                  mealType={meal}
                  entries={mealEntries}
                  subtotal={subtotal}
                  onEdit={startEdit}
                  onDelete={(entry) => deleteMutation.mutate(entry.id)}
                />
              );
            })}
          </div>
        </>
      )}

      <AddFoodEntryModal open={modalOpen} onClose={() => setModalOpen(false)} foods={foods} date={date} editing={editing} onSaved={invalidate} />
    </div>
  );
}
