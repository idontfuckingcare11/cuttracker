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

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required')
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    const data = await login(values.email, values.password);
    navigate(data.needsOnboarding ? '/onboarding' : '/app');
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
        <h1 className="text-xl font-extrabold text-ink dark:text-neutral-100">Welcome back</h1>
        <p className="mb-6 mt-1 text-sm text-neutral-500 dark:text-neutral-400">Log in to continue your cut.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input type="email" label="Email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} autoComplete="email" />
          <div>
            <Input type="password" label="Password" placeholder="••••••••" error={errors.password?.message} {...register('password')} autoComplete="current-password" />
            <div className="mt-1.5 text-right">
              <Link to="/forgot-password" className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
                Forgot password?
              </Link>
            </div>
          </div>
          {errors.form ? <Alert tone="error">{errors.form.message}</Alert> : null}
          <Button type="submit" loading={isSubmitting} className="w-full">
            Log in
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-neutral-500 dark:text-neutral-400">
          New here?{' '}
          <Link to="/register" className="font-semibold text-ink hover:underline dark:text-neutral-100">
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
