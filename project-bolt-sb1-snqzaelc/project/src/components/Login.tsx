import { useState } from 'react';
import Logo from '@/components/Logo';

interface Props {
  onLogin: () => void;
}

type FormMode = 'sign-in' | 'create-account';

export default function Login({ onLogin }: Props) {
  const [mode, setMode] = useState<FormMode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (mode === 'create-account' && !name.trim()) {
      setError('Enter your name to create an account.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    onLogin();
  }

  function toggleMode() {
    setMode((currentMode) =>
      currentMode === 'sign-in' ? 'create-account' : 'sign-in',
    );
    setError('');
  }

  const creatingAccount = mode === 'create-account';

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 py-8">
      <section className="w-full max-w-[400px] rounded-3xl border border-[rgba(212,175,55,0.35)] bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] px-5 py-7 text-[#F5E6B3] shadow-2xl shadow-black/40 sm:px-8 sm:py-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={56} className="mb-4" />
          <p className="text-sm font-semibold tracking-[0.2em] text-[#D4AF37]">
            KARCH
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            {creatingAccount ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-[#BFA765]">
            {creatingAccount
              ? 'Start managing your money with clarity.'
              : 'Sign in to continue to your dashboard.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {creatingAccount && (
            <div>
              <label
                htmlFor="login-name"
                className="mb-2 block text-sm font-medium text-[#BFA765]"
              >
                Name
              </label>
              <input
                id="login-name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-[rgba(212,175,55,0.3)] bg-[#11100d] px-4 py-3 text-base text-[#F5E6B3] outline-none transition placeholder:text-[#8f7b45] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="login-email"
              className="mb-2 block text-sm font-medium text-[#BFA765]"
            >
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-[rgba(212,175,55,0.3)] bg-[#11100d] px-4 py-3 text-base text-[#F5E6B3] outline-none transition placeholder:text-[#8f7b45] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-2 block text-sm font-medium text-[#BFA765]"
            >
              Password
            </label>
            <div>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete={creatingAccount ? 'new-password' : 'current-password'}
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-[rgba(212,175,55,0.3)] bg-[#11100d] px-4 py-3 text-base text-[#F5E6B3] outline-none transition placeholder:text-[#8f7b45] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25"
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-rose-950/70 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="min-h-12 w-full rounded-xl bg-gradient-to-r from-[#F2D675] via-[#D4AF37] to-[#A67C00] px-4 py-3 font-semibold text-[#0A0A0A] shadow-lg shadow-black/25 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#F2D675] focus:ring-offset-2 focus:ring-offset-[#11100d] active:scale-[0.99]"
          >
            {creatingAccount ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#BFA765]">
          {creatingAccount ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="font-semibold text-[#F2D675] underline decoration-[#D4AF37]/50 underline-offset-4 transition hover:text-[#FFF1B8] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            {creatingAccount ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </section>
    </main>
  );
}
