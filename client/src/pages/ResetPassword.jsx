import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '../components/layout/AppLayout.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Alert } from '../components/ui/Alert.jsx';
import { apiPost } from '../api/client.js';

const schema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Include at least one letter')
    .regex(/[0-9]/, 'Include at least one number'),
  confirm: z.string()
}).refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    const token = params.get('token');
    if (!token) {
      setError('form', { message: 'This reset link is missing its token. Request a new one.' });
      return;
    }
    try {
      await apiPost('/auth/reset-password', { token, password: values.password });
      setDone(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError('form', { message: err.message });
    }
  };

  return (
    <AuthLayout>
      <div className="card-base p-6">
        <h1 className="text-xl font-extrabold text-ink dark:text-neutral-100">Choose a new password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <Input type="password" label="New password" placeholder="8+ chars, letters and numbers" error={errors.password?.message} {...register('password')} autoComplete="new-password" />
          <Input type="password" label="Confirm password" error={errors.confirm?.message} {...register('confirm')} autoComplete="new-password" />
          {errors.form ? <Alert tone="error">{errors.form.message}</Alert> : null}
          {done ? <Alert tone="success">Password updated. Redirecting to login…</Alert> : null}
          <Button type="submit" loading={isSubmitting} className="w-full">
            Update password
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
          <Link to="/login" className="font-semibold text-ink hover:underline dark:text-neutral-100">
            Back to login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
