import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { env } from '../../config/env';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <div className="hidden bg-ey-black p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <img src="/ey-logo.png" alt="EY" className="h-10 w-auto" />
          <h1 className="mt-5 max-w-lg text-4xl font-bold leading-tight">
            Unified issue intake, ticket tracking, and operational visibility.
          </h1>
          <p className="mt-4 max-w-xl text-base text-ey-gray-400">
            Streamline issue intake, ticket management, and operational visibility — all from a single platform.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-ey-gray-700 bg-ey-gray-800 p-5">
            <div className="text-3xl font-bold text-ey-yellow">2</div>
            <div className="mt-2 text-sm text-ey-gray-400">Issue intake channels</div>
          </div>
          <div className="rounded-2xl border border-ey-gray-700 bg-ey-gray-800 p-5">
            <div className="text-3xl font-bold text-ey-yellow">6</div>
            <div className="mt-2 text-sm text-ey-gray-400">Operational screens</div>
          </div>
          <div className="rounded-2xl border border-ey-gray-700 bg-ey-gray-800 p-5">
            <div className="text-3xl font-bold text-ey-yellow">99.9%</div>
            <div className="mt-2 text-sm text-ey-gray-400">Uptime reliability</div>
          </div>
        </div>
      </div>

      {/* Mobile brand strip */}
      <div className="bg-ey-black px-6 py-5 text-white lg:hidden">
        <img src="/ey-logo.png" alt="EY" className="h-7 w-auto" />
        <div className="mt-1 text-lg font-bold">Unified issue tracking & operations</div>
      </div>

      <div className="flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="w-full max-w-lg rounded-3xl border border-ey-gray-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="mb-8">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-ey-black">{env.appName}</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ey-black">Welcome back</h2>
            <p className="mt-2 text-sm text-ey-gray-500">Sign in to access dashboards, ticket queues, and product settings.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

            <button className="btn-primary w-full" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
