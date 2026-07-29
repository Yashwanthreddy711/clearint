import { FormEvent, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';

function getFieldErrors(errors: unknown): Record<string, string> {
  const map: Record<string, string> = {};
  if (!errors || typeof errors !== 'object') return map;

  const e = errors as {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };

  if (e.fieldErrors) {
    for (const [key, msgs] of Object.entries(e.fieldErrors)) {
      if (msgs?.[0]) map[key] = msgs[0];
    }
  }
  return map;
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      const data = await login(email, password);
      setAuth(data.user);
      navigate(from, { replace: true });
    } catch (err) {
      const apiErr = err as Error & { status?: number; errors?: unknown };
      setError(apiErr.message);
      setFieldErrors(getFieldErrors(apiErr.errors));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to start or join interview sessions."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-950/50 border border-red-900 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors"
            placeholder="you@example.com"
          />
          {fieldErrors.email && (
            <p className="text-red-400 text-xs">{fieldErrors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors"
            placeholder="••••••••"
          />
          {fieldErrors.password && (
            <p className="text-red-400 text-xs">{fieldErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-900/30"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
