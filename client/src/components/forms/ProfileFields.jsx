import { Select } from '../ui/Select.jsx';
import { Input } from '../ui/Input.jsx';
import { ACTIVITY_LEVELS, WEEKLY_LOSS_OPTIONS, TARGET_MONTH_OPTIONS } from '../../lib/calc.js';

export function ProfileFields({ register, errors }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Input
        type="number"
        label="Age"
        placeholder="27"
        error={errors.age?.message}
        {...register('age', { valueAsNumber: true })}
      />
      <Select
        label="Sex"
        options={[
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' }
        ]}
        error={errors.sex?.message}
        {...register('sex')}
      />
      <Input
        type="number"
        step="0.1"
        label="Height (cm)"
        placeholder="170"
        error={errors.heightCm?.message}
        {...register('heightCm', { valueAsNumber: true })}
      />
      <Input
        type="number"
        step="0.1"
        label="Current weight (kg)"
        placeholder="71.9"
        error={errors.currentWeightKg?.message}
        {...register('currentWeightKg', { valueAsNumber: true })}
      />
      <Input
        type="number"
        step="0.1"
        label="Goal weight (kg)"
        placeholder="65"
        error={errors.goalWeightKg?.message}
        {...register('goalWeightKg', { valueAsNumber: true })}
      />
      <Select
        label="Training (days/week)"
        options={[
          { value: 0, label: '0 days/week (Rest / No training)' },
          { value: 1, label: '1 day/week' },
          { value: 2, label: '2 days/week' },
          { value: 3, label: '3 days/week' },
          { value: 4, label: '4 days/week' },
          { value: 5, label: '5 days/week' },
          { value: 6, label: '6 days/week' },
          { value: 7, label: '7 days/week (Every day)' }
        ]}
        error={errors.trainingFrequency?.message}
        {...register('trainingFrequency', { valueAsNumber: true })}
      />
      <Select
        label="Activity level"
        options={ACTIVITY_LEVELS}
        error={errors.activityLevel?.message}
        {...register('activityLevel')}
        className="col-span-2"
      />
      <Select
        label="Target Timeframe (Months to Goal)"
        options={TARGET_MONTH_OPTIONS}
        error={errors.targetMonths?.message}
        {...register('targetMonths', { valueAsNumber: true })}
        className="col-span-2"
      />
    </div>
  );
}
