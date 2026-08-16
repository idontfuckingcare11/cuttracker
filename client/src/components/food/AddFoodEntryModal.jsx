import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Loader2, CupSoda } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { Button } from '../ui/Button.jsx';
import { MealTypePicker } from './MealSection.jsx';
import { apiPost, apiPut } from '../../api/client.js';
import { todayKey } from '../../lib/format.js';

const UNIT_FACTORS = {
  g: 1,
  ml: 1,
  oz: 28.3495,
  'fl oz': 29.5735
};

const schema = z.object({
  foodId: z.number().int().positive().nullable().optional(),
  name: z.string().min(1, 'Name is required'),
  servingAmount: z.number().positive('Amount required'),
  unit: z.enum(['g', 'oz', 'fl oz', 'ml']),
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

function parseServingStr(str) {
  if (!str) return { amount: 100, unit: 'g' };
  const match = String(str).match(/^([\d.]+)\s*(fl\s*oz|oz|g|ml)?/i);
  if (match) {
    const amt = parseFloat(match[1]) || 100;
    const rawUnit = match[2] ? match[2].toLowerCase().replace(/\s+/g, ' ') : 'g';
    const unit = ['g', 'oz', 'fl oz', 'ml'].includes(rawUnit) ? rawUnit : 'g';
    return { amount: amt, unit };
  }
  return { amount: 100, unit: 'g' };
}

function isLiquidName(foodName = '') {
  return /milk|juice|soda|coke|pepsi|coffee|latte|tea|boba|drink|water|shake|gatorade|smoothie|brew|cappuccino/i.test(foodName);
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
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      unit: 'g',
      servingAmount: 100,
      servingGrams: 100,
      quantity: 1,
      mealType: defaultMealType || 'breakfast',
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0
    }
  });

  const foodId = watch('foodId');
  const name = watch('name');
  const servingAmount = watch('servingAmount');
  const unit = watch('unit');
  const quantity = watch('quantity');

  const selectedFood = useMemo(() => foods.find((f) => f.id === Number(foodId)), [foods, foodId]);

  useEffect(() => {
    if (open) {
      if (editing) {
        const parsed = parseServingStr(editing.servingSize);
        const factor = UNIT_FACTORS[parsed.unit] || 1;
        const equivGrams = parsed.amount * factor;
        reset({
          foodId: editing.foodId || null,
          name: editing.name,
          servingAmount: parsed.amount,
          unit: parsed.unit,
          servingGrams: round1(equivGrams),
          servingSize: editing.servingSize || `${parsed.amount} ${parsed.unit}`,
          mealType: editing.mealType,
          quantity: editing.quantity || 1,
          calories: editing.calories,
          proteinG: editing.proteinG,
          carbsG: editing.carbsG,
          fatG: editing.fatG
        });
      } else {
        reset({
          foodId: null,
          name: '',
          servingAmount: 100,
          unit: 'g',
          servingGrams: 100,
          servingSize: '100 g',
          mealType: defaultMealType || 'breakfast',
          quantity: 1,
          calories: 0,
          proteinG: 0,
          carbsG: 0,
          fatG: 0
        });
      }
      setPer100g({ calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 });
      setEstimationSource(null);
    }
  }, [open, editing, defaultMealType, reset]);

  // When a preset food is selected from dropdown
  useEffect(() => {
    if (selectedFood && !isEdit) {
      const parsed = parseServingStr(selectedFood.servingSize);
      const isLiquid = isLiquidName(selectedFood.name);
      const chosenUnit = parsed.unit !== 'g' ? parsed.unit : isLiquid ? 'fl oz' : 'g';
      const initialAmt = chosenUnit === 'fl oz' || chosenUnit === 'oz' ? (parsed.unit === chosenUnit ? parsed.amount : 8) : parsed.amount;

      const factorToGrams = UNIT_FACTORS[chosenUnit] || 1;
      const equivGrams = initialAmt * factorToGrams;

      // Base per 100g calculation from selected food calories/macros
      const foodGrams = parsed.amount * (UNIT_FACTORS[parsed.unit] || 1);
      const basePer100 = {
        calories: (selectedFood.calories / foodGrams) * 100,
        proteinG: (selectedFood.proteinG / foodGrams) * 100,
        carbsG: (selectedFood.carbsG / foodGrams) * 100,
        fatG: (selectedFood.fatG / foodGrams) * 100
      };

      setPer100g(basePer100);
      setValue('name', selectedFood.name);
      setValue('unit', chosenUnit);
      setValue('servingAmount', initialAmt);
      setValue('servingGrams', round1(equivGrams));
      setValue('servingSize', `${initialAmt} ${chosenUnit}`);
      setEstimationSource('database');
    }
  }, [selectedFood, setValue, isEdit]);

  // Real-time auto-calculation when servingAmount, unit, or quantity changes
  useEffect(() => {
    if (per100g && servingAmount && unit && quantity) {
      const unitMult = UNIT_FACTORS[unit] || 1;
      const equivGrams = Number(servingAmount) * unitMult;
      const factor = (equivGrams / 100) * (Number(quantity) || 1);

      setValue('servingGrams', round1(equivGrams));
      setValue('servingSize', `${servingAmount} ${unit}`);
      setValue('calories', Math.round(per100g.calories * factor));
      setValue('proteinG', round1(per100g.proteinG * factor));
      setValue('carbsG', round1(per100g.carbsG * factor));
      setValue('fatG', round1(per100g.fatG * factor));
    }
  }, [servingAmount, unit, quantity, per100g, setValue]);

  // Switch to fl oz when user types a drink name (if currently on g)
  const handleNameChange = (e) => {
    const val = e.target.value;
    setValue('name', val);
    if (unit === 'g' && isLiquidName(val)) {
      setValue('unit', 'fl oz');
      setValue('servingAmount', 8);
    }
  };

  // AI Auto-Estimate function
  const handleAiEstimate = async () => {
    if (!name || !name.trim()) return;
    setAiEstimating(true);
    setEstimationSource(null);
    try {
      const unitMult = UNIT_FACTORS[unit] || 1;
      const equivGrams = (Number(servingAmount) || 100) * unitMult;
      const res = await apiPost('/foods/estimate', { name, grams: equivGrams });
      if (res && res.per100g) {
        setPer100g(res.per100g);
        setValue('calories', res.calories);
        setValue('proteinG', res.proteinG);
        setValue('carbsG', res.carbsG);
        setValue('fatG', res.fatG);
        setValue('servingGrams', round1(equivGrams));
        setValue('servingSize', `${servingAmount} ${unit}`);
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
      servingSize: `${values.servingAmount} ${values.unit}`,
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
  const isLiquid = isLiquidName(name);
  const equivGrams = Math.round((Number(servingAmount) || 0) * (UNIT_FACTORS[unit] || 1));

  const quickAmounts = unit === 'fl oz' || unit === 'oz' ? [8, 12, 16, 20] : [100, 150, 200, 250];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit entry' : 'Add food or drink'}
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
          label="From your food & drink library (Optional)"
          options={[{ value: '', label: 'Type custom food/drink or use AI...' }, ...foods.map((f) => ({ value: String(f.id), label: `${f.name} (${f.calories} kcal · ${f.servingSize})` }))]}
          {...register('foodId', { setValueAs: (v) => (v === '' || v === undefined || v === null ? null : Number(v)) })}
        />

        <div>
          <div className="flex items-center justify-between">
            <span className="label-text mb-1 flex items-center gap-1">
              Food / Drink Name {isLiquid ? <CupSoda size={13} className="text-emerald-500" /> : null}
            </span>
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
          <Input
            placeholder="e.g. Chicken breast, Whole Milk, Coke Zero, Iced Latte..."
            error={errors.name?.message}
            {...register('name')}
            onChange={handleNameChange}
            disabled={!custom}
          />
          {estimationSource && (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span>✓ Estimated via {estimationSource === 'ai' ? 'AI Model' : estimationSource === 'database' ? 'Nutrition Database' : 'Smart Macro Engine'}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label-text block">Serving Size</label>
              {/* Unit Selection Pills */}
              <div className="flex gap-0.5 rounded-md bg-neutral-100 p-0.5 dark:bg-neutral-800">
                {['g', 'fl oz', 'oz', 'ml'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      setValue('unit', u);
                      if ((u === 'fl oz' || u === 'oz') && (servingAmount === 100 || !servingAmount)) {
                        setValue('servingAmount', 8);
                      } else if ((u === 'g' || u === 'ml') && servingAmount === 8) {
                        setValue('servingAmount', 100);
                      }
                    }}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase transition ${
                      unit === u
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                        : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder={unit === 'fl oz' || unit === 'oz' ? '8' : '100'}
                className="input-field pr-12"
                {...register('servingAmount', { valueAsNumber: true })}
              />
              <span className="absolute right-3 text-xs font-semibold text-neutral-400">{unit}</span>
            </div>
            {errors.servingAmount ? <p className="mt-1 text-xs text-red-500">{errors.servingAmount.message}</p> : null}

            {/* Quick Amount Presets */}
            <div className="mt-1.5 flex gap-1 items-center">
              <span className="text-[10px] text-neutral-400 font-medium">Quick:</span>
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setValue('servingAmount', amt)}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${
                    servingAmount === amt
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {amt}
                  {unit}
                </button>
              ))}
            </div>
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
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Auto-Calculated Totals for {servingAmount || 0} {unit} {unit !== 'g' ? `(~${equivGrams}g)` : ''}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Live Auto-Update ✓</span>
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


