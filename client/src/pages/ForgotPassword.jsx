import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '../components/layout/AppLayout.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Alert } from '../components/ui/Alert.jsx';
import { apiPost } from '../api/client.js';

const schema = z.object({ email: z.string().email('Enter a valid email') });

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      const data = await apiPost('/auth/forgot-password', values);
      setDevLink(data.devLink || '');
      setSent(true);
    } catch (err) {
      setError('form', { message: err.message });
    }
  };

  return (
    <AuthLayout>
      <div className="card-base p-6">
        <h1 className="text-xl font-extrabold text-ink dark:text-neutral-100">Reset your password</h1>
        {sent ? (
          <div className="mt-4 space-y-3">
            <Alert tone="success">If an account exists for that email, a reset link is on its way.</Alert>
            {devLink ? (
              <Alert tone="info">
                <p className="mb-1 font-semibold">Development mode — no email server configured.</p>
                <a href={devLink} className="break-all text-blue-600 underline dark:text-blue-400">
                  {devLink}
                </a>
              </Alert>
            ) : null}
            <Link to="/login" className="btn-secondary mt-2">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Enter your account email and we'll send you a time-limited reset link.</p>
            <Input type="email" label="Email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            {errors.form ? <Alert tone="error">{errors.form.message}</Alert> : null}
            <Button type="submit" loading={isSubmitting} className="w-full">
              Send reset link
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
