'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError('');
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError('Invalid email or password. Please try again.');
    } else {
      // The session cookie is already set, so navigating loads the dashboard
      // authenticated in one fetch — no extra router.refresh() round-trip.
      router.replace('/dashboard');
    }
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="surface-panel overflow-hidden">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden flex-col justify-between border-b border-slate-200/70 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] p-8 text-white lg:flex lg:border-b-0 lg:border-r">
            <div>
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Shield className="h-7 w-7" />
              </div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-200">
                <Sparkles className="h-3.5 w-3.5" />
                Internal support workspace
              </p>
              <h1 className="max-w-md text-3xl font-semibold tracking-tight">
                A quieter, faster way to move through every ticket.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">
                Search policies, analyze customer messages, and keep your workflow tied to the latest Capelli guidance.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Guided ticket analysis with source-backed suggestions
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Clean workflow steps with light motion and clear state
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Admin tools for docs, users, and QA oversight
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 lg:p-10">
            <div className="mb-6 lg:hidden">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-capelli-navy text-white shadow-sm">
                <Shield className="h-7 w-7" />
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Capelli CS Coach</h1>
              <p className="mt-1 text-sm text-slate-500">Sign in to continue to the workspace.</p>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase text-slate-400">Sign in</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h2>
              </div>
              <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500 md:block">
                Secure access
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Email address</label>
                <Input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@capellisport.com"
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Input
                    {...register('password')}
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" size="xl" className="w-full gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5 text-center">
              <p className="text-xs text-slate-400">Internal tool - authorized users only</p>
              <p className="mt-1 text-xs text-slate-400">Contact your admin if you need access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
