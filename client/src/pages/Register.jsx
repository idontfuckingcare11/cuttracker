import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AppContexts.jsx';
import { AuthLayout } from '../components/layout/AppLayout.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Alert } from '../components/ui/Alert.jsx';
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx';

const schema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-zA-Z]/, 'Include at least one letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirm: z.string()
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export default function Register() {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      const data = await signup(values.email, values.password);
      navigate(data.needsOnboarding ? '/onboarding' : '/app');
    } catch (err) {
      setError('form', { message: err.message });
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-sm font-extrabold text-white dark:bg-white dark:text-neutral-900">CT</div>
          <span className="text-lg font-extrabold tracking-tight text-ink dark:text-neutral-100">CutTrack</span>
        </Link>
        <ThemeToggle />
      </div>
      <div className="card-base p-6">
        <h1 className="text-xl font-extrabold text-ink dark:text-neutral-100">Create your account</h1>
        <p className="mb-6 mt-1 text-sm text-neutral-500 dark:text-neutral-400">Takes about 30 seconds. Your calorie and macro targets follow.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input type="email" label="Email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} autoComplete="email" />
          <Input type="password" label="Password" placeholder="8+ chars, letters and numbers" error={errors.password?.message} {...register('password')} autoComplete="new-password" />
          <Input type="password" label="Confirm password" placeholder="Repeat it" error={errors.confirm?.message} {...register('confirm')} autoComplete="new-password" />
          {errors.form ? <Alert tone="error">{errors.form.message}</Alert> : null}
          <Button type="submit" loading={isSubmitting} className="w-full">
            Create account
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-ink hover:underline dark:text-neutral-100">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
