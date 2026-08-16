import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { Button } from '../ui/Button.jsx';
import { MealTypePicker } from './MealSection.jsx';
import { apiPost, apiPut } from '../../api/client.js';
import { todayKey } from '../../lib/format.js';

const schema = z.object({
  foodId: z.number().int().positive().nullable().optional(),
  name: z.string().min(1, 'Name is required'),
  servingGrams: z.number().positive('Grams required'),
  servingSize: z.string().min(1, 'Serving is required'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'extra']),
  quantity: z.number().min(0.1, 'Quantity must be at least 0.1'),
  calories: z.number().int().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0)
});

function round1(v) {
  return Math.round(v * 10) / 10;
}

export function AddFoodEntryModal({ open, onClose, foods, date, editing, defaultMealType = 'breakfast', onSaved }) {
  const isEdit = !!editing;
  const [aiEstimating, setAiEstimating] = useState(false);
  const [estimationSource, setEstimationSource] = useState(null); // 'database' | 'ai' | 'heuristic' | null
  const [per100g, setPer100g] = useState({ calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema) });

  const foodId = watch('foodId');
  const name = watch('name');
  const servingGrams = watch('servingGrams');
  const quantity = watch('quantity');

  const selectedFood = useMemo(() => foods.find((f) => f.id === Number(foodId)), [foods, foodId]);

  useEffect(() => {
    if (open) {
      const g = editing ? (parseInt(editing.servingSize) || 100) : 100;
      reset(
        editing
          ? {
              foodId: editing.foodId || null,
              name: editing.name,
              servingGrams: g,
              servingSize: editing.servingSize || `${g} g`,
              mealType: editing.mealType,
              quantity: editing.quantity || 1,
              calories: editing.calories,
              proteinG: editing.proteinG,
              carbsG: editing.carbsG,
              fatG: editing.fatG
            }
          : { foodId: null, name: '', servingGrams: 100, servingSize: '100 g', mealType: defaultMealType || 'breakfast', quantity: 1, calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
      );
      setPer100g({ calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 });
      setEstimationSource(null);
    }
  }, [open, editing, defaultMealType, reset]);

  // When a preset food is selected from dropdown
  useEffect(() => {
    if (selectedFood && !isEdit) {
      const g = parseInt(selectedFood.servingSize) || 100;
      const basePer100 = {
        calories: (selectedFood.calories / g) * 100,
        proteinG: (selectedFood.proteinG / g) * 100,
        carbsG: (selectedFood.carbsG / g) * 100,
        fatG: (selectedFood.fatG / g) * 100
      };
      setPer100g(basePer100);
      setValue('name', selectedFood.name);
      setValue('servingGrams', g);
      setValue('servingSize', `${g} g`);
      setValue('calories', selectedFood.calories);
      setValue('proteinG', selectedFood.proteinG);
      setValue('carbsG', selectedFood.carbsG);
      setValue('fatG', selectedFood.fatG);
      setEstimationSource('database');
    }
  }, [selectedFood, setValue, isEdit]);

  // Real-time auto-calculation when servingGrams or quantity changes
  useEffect(() => {
    if (per100g && servingGrams && quantity) {
      const factor = (Number(servingGrams) / 100) * (Number(quantity) || 1);
      setValue('servingSize', `${servingGrams} g`);
      setValue('calories', Math.round(per100g.calories * factor));
      setValue('proteinG', round1(per100g.proteinG * factor));
      setValue('carbsG', round1(per100g.carbsG * factor));
      setValue('fatG', round1(per100g.fatG * factor));
    }
  }, [servingGrams, quantity, per100g, setValue]);

  // AI Auto-Estimate function
  const handleAiEstimate = async () => {
    if (!name || !name.trim()) return;
    setAiEstimating(true);
    setEstimationSource(null);
    try {
      const grams = Number(servingGrams) || 100;
      const res = await apiPost('/foods/estimate', { name, grams });
      if (res && res.per100g) {
        setPer100g(res.per100g);
        setValue('calories', res.calories);
        setValue('proteinG', res.proteinG);
        setValue('carbsG', res.carbsG);
        setValue('fatG', res.fatG);
        setValue('servingSize', `${grams} g`);
        setEstimationSource(res.source || 'ai');
      }
    } catch (err) {
      console.error('AI food estimate failed:', err);
    } finally {
      setAiEstimating(false);
    }
  };

  const onSubmit = async (values) => {
    const payload = {
      ...(isEdit ? {} : { foodId: values.foodId || null }),
      name: values.name,
      servingSize: `${values.servingGrams} g`,
      mealType: values.mealType,
      quantity: values.quantity,
      calories: values.calories,
      proteinG: values.proteinG,
      carbsG: values.carbsG,
      fatG: values.fatG,
      loggedDate: date || todayKey()
    };
    if (isEdit) {
      await apiPut(`/food-entries/${editing.id}`, payload);
    } else {
      await apiPost('/food-entries', payload);
    }
    onSaved();
    onClose();
  };

  const custom = !selectedFood || isEdit;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit entry' : 'Add food'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Add entry'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="add-food-form">
        <div className="space-y-1">
          <span className="label-text">Meal</span>
          <Controller control={control} name="mealType" render={({ field }) => <MealTypePicker value={field.value} onChange={field.onChange} />} />
        </div>

        <Select
          label="From your foods (Optional)"
          options={[{ value: '', label: 'Type custom food or use AI...' }, ...foods.map((f) => ({ value: String(f.id), label: `${f.name} (${f.calories} kcal)` }))]}
          {...register('foodId', { setValueAs: (v) => (v === '' || v === undefined || v === null ? null : Number(v)) })}
        />

        <div>
          <div className="flex items-center justify-between">
            <span className="label-text mb-1">Food Name</span>
            <button
              type="button"
              onClick={handleAiEstimate}
              disabled={aiEstimating || !name}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 dark:text-emerald-400"
            >
              {aiEstimating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              AI Estimate Macros
            </button>
          </div>
          <Input placeholder="e.g. Chicken breast, White rice, Steak..." error={errors.name?.message} {...register('name')} disabled={!custom} />
          {estimationSource && (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span>✓ Estimated via {estimationSource === 'ai' ? 'AI Model' : estimationSource === 'database' ? 'Nutrition Database' : 'Smart Macro Engine'}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text mb-1 block">Serving Amount (Grams)</label>
            <div className="relative flex items-center">
              <input
                type="number"
                step="1"
                min="1"
                placeholder="100"
                className="input-field pr-8"
                {...register('servingGrams', { valueAsNumber: true })}
              />
              <span className="absolute right-3 text-xs font-semibold text-neutral-400">g</span>
            </div>
            {errors.servingGrams ? <p className="mt-1 text-xs text-red-500">{errors.servingGrams.message}</p> : null}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label-text block">Quantity (Servings)</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setValue('quantity', m)}
                    className={`rounded px-1.5 py-0.5 text-[11px] font-bold transition ${
                      quantity === m
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                        : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}
                  >
                    {m}x
                  </button>
                ))}
              </div>
            </div>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              error={errors.quantity?.message}
              {...register('quantity', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Auto-Calculated Totals for {servingGrams || 100}g</span>
            <span className="text-[10px] text-neutral-400">Live Auto-Update ✓</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Input type="number" label="kcal" error={errors.calories?.message} {...register('calories', { valueAsNumber: true })} className="col-span-1" />
            <Input type="number" step="0.1" label="Protein (g)" error={errors.proteinG?.message} {...register('proteinG', { valueAsNumber: true })} />
            <Input type="number" step="0.1" label="Carbs (g)" error={errors.carbsG?.message} {...register('carbsG', { valueAsNumber: true })} />
            <Input type="number" step="0.1" label="Fat (g)" error={errors.fatG?.message} {...register('fatG', { valueAsNumber: true })} />
          </div>
        </div>
      </form>
    </Modal>
  );
}

