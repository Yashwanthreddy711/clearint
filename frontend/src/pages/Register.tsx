import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { register } from '../api/auth';
import { useAuthStore } from '../store/authStore';

function getZodFieldErrors(errors: unknown): Record<string, string> {
  const map: Record<string, string> = {};
  if (!Array.isArray(errors)) return map;

  for (const issue of errors as { path?: (string | number)[]; message?: string }[]) {
    const key = issue.path?.[0];
    if (typeof key === 'string' && issue.message && !map[key]) {
      map[key] = issue.message;
    }
  }
  return map;
}

export function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      const data = await register({
        username,
        email,
        password,
        ...(mobileNo.trim() ? { mobileNo: mobileNo.trim() } : {}),
      });
      setAuth(data.user);
      navigate('/', { replace: true });
    } catch (err) {
      const apiErr = err as Error & { errors?: unknown };
      setError(apiErr.message);
      setFieldErrors(getZodFieldErrors(apiErr.errors));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors';

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Sign up to create rooms and join interview sessions."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
            Sign in
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
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            autoComplete="username"
            className={inputClass}
            placeholder="yashwanth"
          />
          {fieldErrors.username && (
            <p className="text-red-400 text-xs">{fieldErrors.username}</p>
          )}
        </div>

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
            className={inputClass}
            placeholder="you@example.com"
          />
          {fieldErrors.email && (
            <p className="text-red-400 text-xs">{fieldErrors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
            Mobile (optional)
          </label>
          <input
            type="tel"
            value={mobileNo}
            onChange={(e) => setMobileNo(e.target.value)}
            className={inputClass}
            placeholder="10-digit number"
          />
          {fieldErrors.mobileNo && (
            <p className="text-red-400 text-xs">{fieldErrors.mobileNo}</p>
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
            minLength={6}
            autoComplete="new-password"
            className={inputClass}
            placeholder="At least 6 characters"
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
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
    </AuthLayout>
  );
}
