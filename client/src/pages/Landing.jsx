import { Link } from 'react-router-dom';
import { ArrowRight, Scale, Flame, Dumbbell, Sparkles, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AppContexts.jsx';
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx';

const FEATURES = [
  {
    icon: Flame,
    title: 'Calories that make sense',
    text: 'A daily target built from your BMR, activity and a safe deficit — no guesswork.'
  },
  {
    icon: Scale,
    title: 'Weight on a real trend',
    text: '7-day rolling averages, so one bad weigh-in never derails your judgment.'
  },
  {
    icon: Dumbbell,
    title: 'Train to keep muscle',
    text: 'Protein-first macros and a workout log with personal-record detection.'
  },
  {
    icon: Sparkles,
    title: 'AI cut coach',
    text: 'Plain-language insights on whether your deficit is working — every day.'
  }
];

export default function Landing() {
  const { user, needsOnboarding } = useAuth();
  const home = user ? (needsOnboarding ? '/onboarding' : '/app') : '/login';

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-sm font-extrabold text-white dark:bg-white dark:text-neutral-900">CT</div>
          <span className="text-lg font-extrabold tracking-tight text-ink dark:text-neutral-100">CutTrack</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to={home} className="btn-primary">
            {user ? 'Open app' : 'Sign in'} <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              <TrendingDown size={13} /> Lose fat. Keep muscle.
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink dark:text-neutral-100 sm:text-5xl">
              Your cut, <span className="text-neutral-400 dark:text-neutral-500">tracked to the gram.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
              Calorie targets, protein-first macros, weight trends and AI-powered cut analysis — one clean dashboard that answers the only question that matters: <em>am I on track?</em>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={user ? home : '/register'} className="btn-primary px-5 py-2.5 text-base">
                Start your cut <ArrowRight size={16} />
              </Link>
              {user ? null : (
                <Link to="/login" className="btn-secondary px-5 py-2.5 text-base">
                  I have an account
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="card-base p-5">
                <div className="mb-3 inline-flex rounded-xl bg-neutral-100 p-2.5 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                  <f.icon size={20} />
                </div>
                <p className="text-sm font-bold text-ink dark:text-neutral-100">{f.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50 py-10 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="card-base flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-base font-bold text-ink dark:text-neutral-100">Try the demo account</p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">dev@cuttrack.app · Password123! — fully seeded with data.</p>
            </div>
            <Link to="/login" className="btn-secondary">
              Log in to the demo
            </Link>
          </div>
          <p className="mt-8 text-center text-xs leading-relaxed text-neutral-400 dark:text-neutral-600">
            CutTrack provides calorie, macro and AI estimates for fitness purposes only — not medical advice. Consult a healthcare professional before starting any diet.
          </p>
        </div>
      </section>
    </div>
  );
}
